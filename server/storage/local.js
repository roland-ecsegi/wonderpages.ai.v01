import fs from 'node:fs/promises';
import path from 'node:path';

/* v19: writes of the same file are queued and each uses its own temporary name (two quick writes used to collide: ENOENT on rename) */
let SEQ = 0; const CHAINS = new Map();

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
  async deleteProject(pid) { await this.remove(`projects/${pid}`); }
  async remove(rel) { await fs.rm(this.abs(rel), { recursive: true, force: true }); }
  async flush() { await Promise.all([...CHAINS.values()]); }
  async close() { await this.flush(); }
  describe() { return { kind: 'local', label: 'Folder local', location: this.root }; }
}
