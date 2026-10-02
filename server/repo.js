import { EventEmitter } from 'node:events';
import crypto from 'node:crypto';

export const bus = new EventEmitter();
bus.setMaxListeners(100);

export const now = () => Date.now();
export const uid = (p = '') => p + crypto.randomBytes(4).toString('hex') + Date.now().toString(36).slice(-4);
export const clone = o => (o == null ? o : JSON.parse(JSON.stringify(o)));

/* same semantics as the cloud db "update": nested objects merge, arrays and scalars replace */
export function deepMerge(target, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) deepMerge(target[k], v);
    else target[k] = clone(v);
  }
  return target;
}

/* one write at a time per file */
const Q = new Map();
function queued(key, fn) {
  const prev = Q.get(key) || Promise.resolve();
  const next = prev.then(fn, fn);
  Q.set(key, next.catch(() => {}));
  return next;
}

const pending = new Map();
function changed(scope, pid) {
  const k = scope + ':' + (pid || '');
  if (pending.has(k)) return;
  pending.set(k, setTimeout(() => { pending.delete(k); bus.emit('change', { scope, pid }); }, 120));
}

export class Repo {
  constructor(storage) { this.s = storage; this.projects = new Map(); this.art = new Map(); this.types = new Map(); this.comments = new Map(); this.bps = new Map(); }

  async load() {
    for (const f of await this.s.list('types')) if (f.name.endsWith('.json')) { const t = await this.s.readJSON('types/' + f.name); if (t?.slug) this.types.set(t.slug, t); }
    for (const d of await this.s.list('projects')) if (d.dir) { const p = await this.s.readJSON(`projects/${d.name}/project.json`); if (p?.id) this.projects.set(p.id, p); }
  }

  /* product types */
  listTypes() { return [...this.types.values()]; }
  getType(slug) { return this.types.get(slug) || null; }
  async putType(t) { await queued('t/' + t.slug, async () => {await this.s.writeJSON(`types/${t.slug}.json`, t);this.types.set(t.slug, t);}); changed('types'); return t; }

  /* projects */
  listProjects() { return [...this.projects.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); }
  getProject(pid) { return this.projects.get(pid) || null; }
  async createProject(p, blueprint) {

    await this.s.writeJSON(`projects/${p.id}/blueprint.json`, blueprint);
    await this.s.writeJSON(`projects/${p.id}/project.json`, p);
    this.projects.set(p.id,p);this.bps.set(p.id,blueprint);changed('projects'); return p;
  }
  async patchProject(pid, patch) {
    const p = this.projects.get(pid); if (!p) throw new Error('Proiect inexistent: ' + pid);
    await queued('p/' + pid, async () => {const next=deepMerge(clone(p),{...patch,updatedAt:now()});await this.s.writeJSON(`projects/${pid}/project.json`,next);deepMerge(p,next);});
    changed('projects'); changed('project', pid);
    return p;
  }
  async getBlueprint(pid) {
    if (!this.bps.has(pid)) this.bps.set(pid, await this.s.readJSON(`projects/${pid}/blueprint.json`));
    return this.bps.get(pid);
  }

  /* artifacts, versioned */
  touch(pid) { (this.seen = this.seen || new Map()).set(pid, Date.now()); }
  /* memory hygiene: forget cached documents of projects nobody looked at for 30 minutes (they reload from the database) */
  evict(isBusy) { const t = Date.now() - 30 * 60e3; for (const [pid, at] of this.seen || []) if (at < t && !isBusy(pid)) { this.art.delete(pid); this.comments.delete(pid); this.bps.delete(pid); this.seen.delete(pid); } }
  async artifacts(pid) {
    this.touch(pid);
    if (!this.art.has(pid)) {
      const map = {};
      for (const f of await this.s.list(`projects/${pid}/artifacts`)) if (f.name.endsWith('.json')) { const a = await this.s.readJSON(`projects/${pid}/artifacts/${f.name}`); if (a?.key) map[a.key] = a; }
      this.art.set(pid, map);
    }
    return this.art.get(pid);
  }
  async writeArtifact(pid, key, content, o = {}) {
    const map = await this.artifacts(pid);
    let prev,doc;
    await queued(`a/${pid}/${key}`,async()=>{
    prev = map[key] || null;
    const keep = o.keep ?? 5;
    const versions = prev ? [{ version: prev.version, content: clone(prev.content), meta: clone(prev.meta), basedOn: clone(prev.basedOn), by: prev.by, note: prev.note, at: prev.updatedAt }, ...(prev.versions || [])].slice(0, keep) : [];
    doc = {
      key, content: clone(content), version: (prev?.version || 0) + 1, by: o.by || 'agent', note: o.note || '',
      meta: o.meta !== undefined ? o.meta : (prev?.meta || {}), basedOn: o.basedOn !== undefined ? o.basedOn : (prev?.basedOn || null),
      versions, updatedAt: now(), stage: o.stage || prev?.stage || ''
    };
    await this.s.writeJSON(`projects/${pid}/artifacts/${key}.json`,doc);map[key]=doc;
    });
    changed('project', pid);
    if (this.onArtifactWrite) await this.onArtifactWrite(pid, key, prev, doc);
    return doc;
  }
  async patchArtifact(pid, key, patch) {
    const map = await this.artifacts(pid); if (!map[key]) return null;
    await queued(`a/${pid}/${key}`,async()=>{const next=deepMerge(clone(map[key]),patch);await this.s.writeJSON(`projects/${pid}/artifacts/${key}.json`,next);map[key]=next;});
    changed('project', pid);
    return map[key];
  }

  /* comments: one file per project */
  async listComments(pid) {
    if (!this.comments.has(pid)) this.comments.set(pid, (await this.s.readJSON(`projects/${pid}/comments.json`, [])) || []);
    return this.comments.get(pid);
  }
  async saveComments(pid) { const list = await this.listComments(pid); await queued('c/' + pid, () => this.s.writeJSON(`projects/${pid}/comments.json`, list)); changed('project', pid); }
  async addComment(pid, c) { const list = await this.listComments(pid); const doc = { id: uid('c'), createdAt: now(), status: 'open', ...c }; list.push(doc); await this.saveComments(pid); return doc; }
  async patchComment(pid, id, patch) { const list = await this.listComments(pid); const c = list.find(x => x.id === id); if (c) { Object.assign(c, patch); await this.saveComments(pid); } return c; }

  async deleteProject(pid) { await this.s.deleteProject(pid); this.projects.delete(pid); this.art.delete(pid); this.comments.delete(pid); this.bps.delete(pid); changed('projects'); }

  /* learning data (PostgreSQL only; ignored with plain files) */
  async logEvent(pid, kind, doc) { try { await this.s.logEvent?.(pid, kind, { ...doc, at: now() }); } catch (e) { console.warn('[events]', e.message); } }

  /* files (images, exports) */
  async saveFile(pid, rel, buf) { const p = `projects/${pid}/${rel}`; await this.s.writeFile(p, buf); return rel; }
  async readFile(pid, rel) { return this.s.readFile(`projects/${pid}/${rel}`); }
  absFile(pid, rel) { return this.s.abs ? this.s.abs(`projects/${pid}/${rel}`) : null; }
}

export async function flushRepo(){await Promise.all([...Q.values()]);}
