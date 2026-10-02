import fs from 'node:fs/promises';
import path from 'node:path';
import { checkPreconditions } from '../persistence/preconditions.js';

/* v19: writes of the same file are queued and each uses its own temporary name (two quick writes used to collide: ENOENT on rename) */
let SEQ = 0; const CHAINS = new Map();
const LOCKS = new Map(), PENDING = new Set();
const lockOn = (k, fn) => { const prev = LOCKS.get(k) || Promise.resolve(); const run = prev.catch(() => {}).then(fn); LOCKS.set(k, run.catch(() => {})); return run; };
const safeId = s => String(s).replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 120);
const cmpId = (a, b) => { const [x1, x2] = a.split('-').map(Number), [y1, y2] = b.split('-').map(Number); return x1 - y1 || x2 - y2; };
/* test-only fault injection: storage.faults = { point, once } */
function fault(st, point) { if (st.faults?.point === point) { if (st.faults.once) st.faults = null; throw { code: 'storage_fault', point, message: `Eroare simulată de stocare (${point}).` }; } }

/**
 * Stocare locală: un folder pe disc.
 * Orice adaptor de stocare (local, Google Drive, S3...) implementează EXACT aceste metode,
 * cu căi relative separate prin "/":
 *   readJSON(rel, fallback) · writeJSON(rel, obj) · list(relDir) · exists(rel)
 *   readFile(rel) -> Buffer · writeFile(rel, buffer) · remove(rel) · describe()
 */
export class LocalStorage {
  constructor(root) { this.root = root; this.kind = 'local'; }
  abs(rel) {
    const p = path.resolve(this.root, rel);
    if (p !== this.root && !p.startsWith(this.root + path.sep)) throw new Error('Cale în afara folderului de date: ' + rel);
    return p;
  }
  async init() { await fs.mkdir(this.root, { recursive: true }); }
  async readJSON(rel, fallback = null) {
    try { return JSON.parse(await fs.readFile(this.abs(rel), 'utf8')); }
    catch (e) { if (e.code === 'ENOENT') return fallback; throw e; }
  }
  async writeJSON(rel, obj) {
    const p = this.abs(rel); const data = JSON.stringify(obj, null, 1);
    const run = (CHAINS.get(p) || Promise.resolve()).catch(() => {}).then(async () => {
      await fs.mkdir(path.dirname(p), { recursive: true });
      const tmp = `${p}.${process.pid}.${++SEQ}.tmp`;
      await fs.writeFile(tmp, data); await fs.rename(tmp, p);
    });
    CHAINS.set(p, run); run.finally(() => { if (CHAINS.get(p) === run) CHAINS.delete(p); }).catch(() => {});
    return run;
  }
  async list(relDir) {
    try { return (await fs.readdir(this.abs(relDir), { withFileTypes: true })).map(d => ({ name: d.name, dir: d.isDirectory() })); }
    catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  }
  async exists(rel) { try { await fs.access(this.abs(rel)); return true; } catch { return false; } }
  async readFile(rel) { return fs.readFile(this.abs(rel)); }
  async writeFile(rel, buf) { const p = this.abs(rel); await fs.mkdir(path.dirname(p), { recursive: true }); await fs.writeFile(p, buf); }
  async deleteProject(pid) { await this.remove(`projects/${pid}`); await this.remove(`_commands/${pid}`); await this.remove(`_journal/${pid}`); PENDING.delete(pid); }

  /* ---------- P2-T01: atomic multi-document commit (redo journal, single writer per project) ----------
     1) dedupe by commandId  2) revision CAS  3) journal with every full document, fsync  4) apply each document
     atomically (tmp+fsync+rename)  5) command record  6) delete journal. A crash after (3) is replayed by
     recoverJournal(); a failure before (3) leaves nothing. The caller is ACKed only after (6). */
  async commitBatch(b) {
    const pid = b.projectId || '_global';
    return lockOn(pid, async () => {
      if (PENDING.has(pid)) await this.recoverJournal(pid);
      if (b.commandId) { const prev = await this.readJSON(`_commands/${pid}/${safeId(b.commandId)}.json`, null); if (prev) return { deduplicated: true, result: prev.result, revision: prev.revision }; }
      await checkPreconditions(b.preconditions, rel => this.readJSON(rel, null));   // P3-T03: fencing inside the lock
      const projRel = b.projectId ? `projects/${b.projectId}/project.json` : null;
      const current = projRel ? ((await this.readJSON(projRel, null))?.revision || 0) : 0;
      if (b.expectedRevision != null && b.expectedRevision !== current) throw { status: 409, code: 'revision_conflict', currentRevision: current, expectedRevision: b.expectedRevision, message: `Proiectul s-a schimbat între timp (revizia ${current}, nu ${b.expectedRevision}). Reîncarcă și reaplică modificarea.` };
      const revision = b.bumpRevision ? current + 1 : current;
      const ops = b.ops.map(o => (o.rel === projRel ? { ...o, obj: { ...o.obj, revision } } : o));
      const command = b.commandId ? { commandId: b.commandId, projectId: b.projectId || null, kind: b.kind || null, actor: b.actor || null, result: b.result ?? null, events: b.events || [], revision, at: Date.now() } : null;
      const id = `${Date.now()}-${++SEQ}-${safeId(b.commandId || 'w')}`, jrel = `_journal/${pid}/${id}.json`;
      fault(this, 'before-journal');
      await this.writeDurable(jrel, { id, projectId: pid, ops, command, state: 'prepared', at: Date.now() }); PENDING.add(pid);
      fault(this, 'after-journal');
      await this.applyJournal({ ops, command }, pid, true);
      await fs.rm(this.abs(jrel), { force: true });
      if (!(await this.list(`_journal/${pid}`)).length) { PENDING.delete(pid); await fs.rmdir(this.abs(`_journal/${pid}`)).catch(() => {}); }
      return { deduplicated: false, revision, result: b.result ?? null };
    });
  }
  async applyJournal(j, pid, live = false) {
    let n = 0;
    for (const o of j.ops) { if (live && n === 1) fault(this, 'mid-apply'); await this.writeDurable(o.rel, o.obj); n++; }
    if (j.command) await this.writeDurable(`_commands/${pid}/${safeId(j.command.commandId)}.json`, j.command);
    if (live) fault(this, 'before-journal-delete');
  }
  /** Replays prepared journals (all, or one project) in order. Returns the projects whose state changed on disk. */
  async recoverJournal(only = null) {
    const replayed = [];
    for (const d of only ? [{ name: only, dir: true }] : await this.list('_journal')) {
      if (!d.dir) continue;
      for (const f of (await this.list(`_journal/${d.name}`)).filter(x => x.name.endsWith('.json')).sort((a, b) => cmpId(a.name, b.name))) {
        const rel = `_journal/${d.name}/${f.name}`; const j = await this.readJSON(rel, null);
        if (j?.state === 'prepared') { await this.applyJournal(j, d.name); replayed.push(d.name); }
        await fs.rm(this.abs(rel), { force: true });
      }
      PENDING.delete(d.name); await fs.rmdir(this.abs(`_journal/${d.name}`)).catch(() => {});
    }
    return { replayed: replayed.length, projects: [...new Set(replayed)] };
  }
  async writeDurable(rel, obj) {
    const p = this.abs(rel); await fs.mkdir(path.dirname(p), { recursive: true });
    const tmp = `${p}.${process.pid}.${++SEQ}.tmp`; const fh = await fs.open(tmp, 'w');
    try { await fh.writeFile(JSON.stringify(obj, null, 1)); await fh.sync(); } finally { await fh.close(); }
    await fs.rename(tmp, p);
    try { const dh = await fs.open(path.dirname(p), 'r'); try { await dh.sync(); } finally { await dh.close(); } } catch {}   // directory fsync is not available on every OS
  }
  async remove(rel) { await fs.rm(this.abs(rel), { recursive: true, force: true }); }
  async flush() { await Promise.all([...CHAINS.values()]); }
  async close() { await this.flush(); }
  describe() { return { kind: 'local', label: 'Folder local', location: this.root }; }
}
