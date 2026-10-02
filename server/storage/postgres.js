/**
 * Stocare PostgreSQL: documentele (proiecte, artefacte, comentarii, tipuri de produs) stau în tabele
 * cu coloane JSONB; fișierele mari (imagini, PDF-uri) rămân pe disc. Implementează aceeași interfață
 * ca LocalStorage, deci restul aplicației nu se schimbă.
 */
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { LocalStorage } from './local.js';
import { ROOT } from '../config.js';
import { PROJECT_LEDGER_TABLES, applyMigrations } from '../persistence/migrations.js';
import { checkPreconditions } from '../persistence/preconditions.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS product_types (slug TEXT PRIMARY KEY, doc JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, title TEXT, status TEXT, type_slug TEXT, doc JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS project_blueprints (project_id TEXT PRIMARY KEY, doc JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS artifacts (project_id TEXT NOT NULL, key TEXT NOT NULL, version INTEGER, doc JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (project_id, key));
CREATE TABLE IF NOT EXISTS comments (project_id TEXT PRIMARY KEY, doc JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS review_events (id BIGSERIAL PRIMARY KEY, project_id TEXT NOT NULL, kind TEXT NOT NULL, doc JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS documents (path TEXT PRIMARY KEY, doc JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_events_project ON review_events (project_id, kind);
`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const parse = v => (typeof v === 'string' ? JSON.parse(v) : v);

export class PostgresStorage {
  constructor(cfg) { this.kind = 'postgres'; this.url = cfg.databaseUrl; this.files = new LocalStorage(cfg.dataDir); this.pool = new pg.Pool({ connectionString: this.url, max: 5 }); }
  /* the database may use the credentials of an earlier version (e.g. after the rename to WonderPages):
     on an authentication error the known sets are tried, and .env is corrected to the one that works */
  candidates() {
    const u = new URL(this.url); const host = `${u.hostname}:${u.port || 5432}`; const list = [this.url];
    /* P1-T04: the known legacy credential sets are a migration path for a LOCAL database only, never for a network host */
    if (!['127.0.0.1', 'localhost', '[::1]', '::1'].includes(u.hostname.toLowerCase())) return list;
    for (const [user, pass, db] of [['wonderpages', 'wonderpages-local', 'wonderpages'], ['tiparnita', 'tiparnita-local', 'tiparnita']]) list.push(`postgres://${user}:${pass}@${host}/${db}`);
    return [...new Set(list)];
  }
  fixEnv(url) {
    try {
      const file = path.join(ROOT, '.env'); if (!fs.existsSync(file)) return;
      const u = new URL(url); let lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
      const set = (k, v) => { const i = lines.findIndex(l => l.startsWith(k + '=')); if (i >= 0) lines[i] = `${k}=${v}`; else lines.push(`${k}=${v}`); };
      set('DATABASE_URL', url); set('PG_USER', decodeURIComponent(u.username)); set('PG_PASSWORD', decodeURIComponent(u.password)); set('PG_DB', u.pathname.slice(1));
      fs.writeFileSync(file, lines.join('\r\n'));
      console.log('[baza de date] .env corectat automat cu datele de conectare care funcționează.');
    } catch (e) { console.warn('[baza de date] nu am putut corecta .env:', e.message); }
  }
  async init() {
    await this.files.init();
    let last;
    for (let i = 0; i < 30; i++) {           // Docker may still be starting the database
      try { await this.pool.query('SELECT 1'); last = null; break; }
      catch (e) {
        last = e;
        if (['28P01', '28000', '3D000'].includes(e.code)) {          // wrong password / unknown user / unknown database: try the known credentials
          for (const url of this.candidates().slice(1)) {
            const p = new pg.Pool({ connectionString: url, max: 5 });
            try { await p.query('SELECT 1'); await this.pool.end().catch(() => {}); this.pool = p; this.url = url; this.legacyCredentials = /:(wonderpages|tiparnita)-local@/.test(url); if (this.legacyCredentials) console.warn('[baza de date] conectat cu credențiale legacy cunoscute (doar local); migrează la o parolă generată.'); this.fixEnv(url); last = null; break; }
            catch { await p.end().catch(() => {}); }
          }
          if (!last) break;
          throw new Error('Baza de date răspunde, dar datele de conectare din .env nu se potrivesc (' + e.message + '). Trimite-mi acest mesaj.');
        }
        await sleep(2000);
      }
    }
    if (last) throw new Error('Baza de date PostgreSQL nu răspunde. Pornește Docker Desktop și rulează din nou porneste.bat. (' + last.message + ')');
    if (this.legacyCredentials === undefined) this.legacyCredentials = /:(wonderpages|tiparnita)-local@/.test(this.url);
    for (const stmt of SCHEMA.split(';').map(s => s.trim()).filter(Boolean)) await this.pool.query(stmt);
    this.migrationStatus = await applyMigrations(this);   // P2-T01: numbered additive migrations
  }
  q(text, params) { return this.pool.query(text, params); }

  /* path -> table routing */
  route(rel) {
    let m;
    if ((m = rel.match(/^types\/([^/]+)\.json$/))) return { t: 'type', slug: m[1] };
    if ((m = rel.match(/^projects\/([^/]+)\/project\.json$/))) return { t: 'project', pid: m[1] };
    if ((m = rel.match(/^projects\/([^/]+)\/blueprint\.json$/))) return { t: 'blueprint', pid: m[1] };
    if ((m = rel.match(/^projects\/([^/]+)\/artifacts\/([^/]+)\.json$/))) return { t: 'artifact', pid: m[1], key: m[2] };
    if ((m = rel.match(/^projects\/([^/]+)\/comments\.json$/))) return { t: 'comments', pid: m[1] };
    /* P2: ledger documents routed to their own tables */
    if ((m = rel.match(/^projects\/([^/]+)\/versions\/([^/]+)\/(\d+)\.json$/))) return { t: 'version', pid: m[1], key: m[2], v: Number(m[3]) };
    if ((m = rel.match(/^projects\/([^/]+)\/dependencies\/([^/]+)\.json$/))) return { t: 'dependency', pid: m[1], id: m[2] };
    if ((m = rel.match(/^projects\/([^/]+)\/decisions\/([^/]+)\.json$/))) return { t: 'decision', pid: m[1], id: m[2] };
    if ((m = rel.match(/^_commands\/([^/]+)\/([^/]+)\.json$/))) return { t: 'command', pid: m[1], id: m[2] };
    if ((m = rel.match(/^_migrations\/([^/]+)\.json$/))) return { t: 'migration', id: m[1] };
    if ((m = rel.match(/^projects\/([^/]+)\/jobs\/([^/]+)\.json$/))) return { t: 'job', pid: m[1], key: m[2] };
    return { t: 'doc', path: rel };
  }
  async readJSON(rel, fallback = null) {
    const r = this.route(rel); let res;
    if (r.t === 'type') res = await this.q('SELECT doc FROM product_types WHERE slug = $1', [r.slug]);
    else if (r.t === 'project') res = await this.q('SELECT doc FROM projects WHERE id = $1', [r.pid]);
    else if (r.t === 'blueprint') res = await this.q('SELECT doc FROM project_blueprints WHERE project_id = $1', [r.pid]);
    else if (r.t === 'artifact') res = await this.q('SELECT doc FROM artifacts WHERE project_id = $1 AND key = $2', [r.pid, r.key]);
    else if (r.t === 'comments') res = await this.q('SELECT doc FROM comments WHERE project_id = $1', [r.pid]);
    else if (r.t === 'version') res = await this.q('SELECT doc FROM artifact_versions WHERE project_id = $1 AND key = $2 AND version = $3', [r.pid, r.key, r.v]);
    else if (r.t === 'dependency') res = await this.q('SELECT doc FROM artifact_dependencies WHERE project_id = $1 AND id = $2', [r.pid, r.id]);
    else if (r.t === 'decision') res = await this.q('SELECT doc FROM decision_records WHERE project_id = $1 AND id = $2', [r.pid, r.id]);
    else if (r.t === 'command') res = await this.q('SELECT doc FROM commands WHERE command_id = $1', [r.id]);
    else if (r.t === 'migration') res = await this.q('SELECT doc FROM migration_runs WHERE id = $1', [r.id]);
    else if (r.t === 'job') res = await this.q('SELECT doc FROM jobs WHERE project_id = $1 AND job_key = $2', [r.pid, r.key]);
    else res = await this.q('SELECT doc FROM documents WHERE path = $1', [r.path]);
    return res.rows.length ? parse(res.rows[0].doc) : fallback;
  }
  async writeJSON(rel, obj) { return this.writeJSONWith(this.pool, rel, obj); }
  async writeJSONWith(db, rel, obj) {
    const r = this.route(rel); const j = JSON.stringify(obj); const q = (t, p) => db.query(t, p);
    if (r.t === 'type') return q('INSERT INTO product_types (slug, doc, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (slug) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()', [r.slug, j]);
    if (r.t === 'project') return q('INSERT INTO projects (id, title, status, type_slug, doc, revision, updated_at) VALUES ($1, $2, $3, $4, $5::jsonb, $6, now()) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, type_slug = EXCLUDED.type_slug, doc = EXCLUDED.doc, revision = GREATEST(projects.revision, EXCLUDED.revision), updated_at = now()', [r.pid, obj.title || '', obj.status || '', obj.typeSlug || '', j, Number(obj.revision) || 0]);
    if (r.t === 'blueprint') return q('INSERT INTO project_blueprints (project_id, doc) VALUES ($1, $2::jsonb) ON CONFLICT (project_id) DO UPDATE SET doc = EXCLUDED.doc', [r.pid, j]);
    if (r.t === 'artifact') return q('INSERT INTO artifacts (project_id, key, version, doc, updated_at) VALUES ($1, $2, $3, $4::jsonb, now()) ON CONFLICT (project_id, key) DO UPDATE SET version = EXCLUDED.version, doc = EXCLUDED.doc, updated_at = now()', [r.pid, r.key, obj.version || 1, j]);
    if (r.t === 'comments') return q('INSERT INTO comments (project_id, doc) VALUES ($1, $2::jsonb) ON CONFLICT (project_id) DO UPDATE SET doc = EXCLUDED.doc', [r.pid, j]);
    if (r.t === 'version') return q('INSERT INTO artifact_versions (project_id, key, version, hash, pinned, doc) VALUES ($1, $2, $3, $4, $5, $6::jsonb) ON CONFLICT (project_id, key, version) DO UPDATE SET pinned = EXCLUDED.pinned, doc = EXCLUDED.doc', [r.pid, r.key, r.v, obj.hash || null, !!obj.pinned, j]);
    if (r.t === 'dependency') return q('INSERT INTO artifact_dependencies (project_id, id, doc) VALUES ($1, $2, $3::jsonb) ON CONFLICT (project_id, id) DO UPDATE SET doc = EXCLUDED.doc', [r.pid, r.id, j]);
    if (r.t === 'decision') return q('INSERT INTO decision_records (project_id, id, doc) VALUES ($1, $2, $3::jsonb) ON CONFLICT (project_id, id) DO UPDATE SET doc = EXCLUDED.doc', [r.pid, r.id, j]);
    if (r.t === 'command') return q('INSERT INTO commands (command_id, project_id, doc) VALUES ($1, $2, $3::jsonb) ON CONFLICT (command_id) DO NOTHING', [r.id, r.pid === '_global' ? null : r.pid, j]);
    if (r.t === 'job') return q('INSERT INTO jobs (project_id, job_key, status, lease_token, doc, updated_at) VALUES ($1, $2, $3, $4, $5::jsonb, now()) ON CONFLICT (project_id, job_key) DO UPDATE SET status = EXCLUDED.status, lease_token = EXCLUDED.lease_token, doc = EXCLUDED.doc, updated_at = now()', [r.pid, r.key, obj.status || 'pending', Number(obj.lease?.token) || 0, j]);
    if (r.t === 'migration') return q('INSERT INTO migration_runs (id, doc) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO UPDATE SET doc = EXCLUDED.doc', [r.id, j]);
    return q('INSERT INTO documents (path, doc, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (path) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()', [r.path, j]);
  }
  async list(relDir) {
    let m;
    if (relDir === 'types') return (await this.q('SELECT slug FROM product_types')).rows.map(r => ({ name: r.slug + '.json', dir: false }));
    if (relDir === 'projects') return (await this.q('SELECT id FROM projects')).rows.map(r => ({ name: r.id, dir: true }));
    if ((m = relDir.match(/^projects\/([^/]+)\/artifacts$/))) return (await this.q('SELECT key FROM artifacts WHERE project_id = $1', [m[1]])).rows.map(r => ({ name: r.key + '.json', dir: false }));
    if ((m = relDir.match(/^projects\/([^/]+)\/versions\/([^/]+)$/))) return (await this.q('SELECT version FROM artifact_versions WHERE project_id = $1 AND key = $2 ORDER BY version', [m[1], m[2]])).rows.map(r => ({ name: r.version + '.json', dir: false }));
    if ((m = relDir.match(/^projects\/([^/]+)\/versions$/))) return (await this.q('SELECT DISTINCT key FROM artifact_versions WHERE project_id = $1', [m[1]])).rows.map(r => ({ name: r.key, dir: true }));
    if ((m = relDir.match(/^projects\/([^/]+)\/dependencies$/))) return (await this.q('SELECT id FROM artifact_dependencies WHERE project_id = $1', [m[1]])).rows.map(r => ({ name: r.id + '.json', dir: false }));
    if ((m = relDir.match(/^projects\/([^/]+)\/decisions$/))) return (await this.q('SELECT id FROM decision_records WHERE project_id = $1 ORDER BY created_at', [m[1]])).rows.map(r => ({ name: r.id + '.json', dir: false }));
    if ((m = relDir.match(/^_commands\/([^/]+)$/))) return (await this.q('SELECT command_id FROM commands WHERE project_id = $1', [m[1]])).rows.map(r => ({ name: r.command_id + '.json', dir: false }));
    if ((m = relDir.match(/^projects\/([^/]+)\/jobs$/))) return (await this.q('SELECT job_key FROM jobs WHERE project_id = $1', [m[1]])).rows.map(r => ({ name: r.job_key + '.json', dir: false }));
    if (relDir === '_migrations') return (await this.q('SELECT id FROM migration_runs ORDER BY created_at')).rows.map(r => ({ name: r.id + '.json', dir: false }));
    /* P3-T05: generic JSON documents (e.g. work packets) live in `documents`; files (images, uploads) stay on disk */
    const prefix = relDir.replace(/\/+$/, '') + '/';
    const docs = (await this.q("SELECT path FROM documents WHERE path LIKE $1 ESCAPE '\\'", [prefix.replace(/[\\%_]/g, m => '\\' + m) + '%'])).rows.map(r => r.path.slice(prefix.length)).filter(n => n && !n.includes('/')).map(name => ({ name, dir: false }));
    const files = await this.files.list(relDir).catch(e => { if (docs.length) return []; throw e; });
    const seen = new Set(files.map(f => f.name)); return [...files, ...docs.filter(d => !seen.has(d.name))];
  }
  async exists(rel) { return (await this.readJSON(rel, null)) !== null || this.files.exists(rel); }
  /* learning data: every review decision, comment and manual edit, queryable later */
  async logEvent(pid, kind, doc) { await this.q('INSERT INTO review_events (project_id, kind, doc) VALUES ($1, $2, $3::jsonb)', [pid, kind, JSON.stringify(doc)]); }
  async deleteProject(pid) {
    const tx = await this.pool.connect();
    try {
      await tx.query('BEGIN');
      for (const [t, c] of [['artifacts', 'project_id'], ['comments', 'project_id'], ['project_blueprints', 'project_id'], ['review_events', 'project_id'], ...PROJECT_LEDGER_TABLES.map(t => [t, 'project_id']), ['projects', 'id']]) await tx.query(`DELETE FROM ${t} WHERE ${c} = $1`, [pid]);
      await tx.query("DELETE FROM documents WHERE path LIKE $1", [`projects/${pid}/%`]);   // generic per-project documents (context manifests, …)
      await tx.query('COMMIT');
    } catch (e) { await tx.query('ROLLBACK'); throw e; } finally { tx.release(); }
    await this.files.remove(`projects/${pid}`);
  }
  /* P2-T01: atomic multi-document commit in one SQL transaction; revision CAS with row lock; commandId dedupe */
  async commitBatch(b) {
    const tx = await this.pool.connect();
    try {
      await tx.query('BEGIN');
      if (b.commandId) { const prev = await tx.query('SELECT doc FROM commands WHERE command_id = $1', [b.commandId]); if (prev.rows.length) { await tx.query('ROLLBACK'); const d = parse(prev.rows[0].doc); return { deduplicated: true, result: d.result, revision: d.revision }; } }
      await checkPreconditions(b.preconditions, async rel => { const r = this.route(rel); if (r.t === 'job') { const x = await tx.query('SELECT doc FROM jobs WHERE project_id = $1 AND job_key = $2 FOR UPDATE', [r.pid, r.key]); return x.rows.length ? parse(x.rows[0].doc) : null; } return this.readJSON(rel, null); });   // P3-T03: fencing inside the transaction
      let current = 0;
      if (b.projectId) { const r = await tx.query('SELECT revision FROM projects WHERE id = $1 FOR UPDATE', [b.projectId]); current = r.rows[0]?.revision || 0; }
      if (b.expectedRevision != null && b.expectedRevision !== current) throw { status: 409, code: 'revision_conflict', currentRevision: current, expectedRevision: b.expectedRevision, message: `Proiectul s-a schimbat între timp (revizia ${current}, nu ${b.expectedRevision}). Reîncarcă și reaplică modificarea.` };
      const revision = b.bumpRevision ? current + 1 : current, projRel = b.projectId ? `projects/${b.projectId}/project.json` : null;
      for (const o of b.ops) await this.writeJSONWith(tx, o.rel, o.rel === projRel ? { ...o.obj, revision } : o.obj);
      if (b.commandId) await this.writeJSONWith(tx, `_commands/${b.projectId || '_global'}/${b.commandId}.json`, { commandId: b.commandId, projectId: b.projectId || null, kind: b.kind || null, actor: b.actor || null, result: b.result ?? null, events: b.events || [], revision, at: Date.now() });
      for (const e of b.events || []) await tx.query('INSERT INTO outbox (project_id, kind, doc) VALUES ($1, $2, $3::jsonb)', [b.projectId || null, e.kind || 'event', JSON.stringify(e)]);
      if (this.faults?.point === 'before-commit') { if (this.faults.once) this.faults = null; throw { code: 'storage_fault', point: 'before-commit', message: 'Eroare simulată de stocare (before-commit).' }; }
      await tx.query('COMMIT');
      return { deduplicated: false, revision, result: b.result ?? null };
    } catch (e) { await tx.query('ROLLBACK').catch(() => {}); throw e; } finally { tx.release(); }
  }
  async recoverJournal() { return { replayed: 0, projects: [] }; }   // PostgreSQL transactions need no redo journal
  abs(rel) { return this.files.abs(rel); }
  readFile(rel) { return this.files.readFile(rel); }
  writeFile(rel, buf) { return this.files.writeFile(rel, buf); }
  remove(rel) { return this.files.remove(rel); }
  async flush() { await this.files.flush(); }
  async close() { await this.flush(); await this.pool.end(); }
  describe() { return { kind: 'postgres', legacyCredentials: !!this.legacyCredentials, label: 'PostgreSQL în Docker', location: `containerul ${process.env.DB_CONTAINER || 'wonderpages-db'}, fișiere în ${this.files.root}` }; }
}
