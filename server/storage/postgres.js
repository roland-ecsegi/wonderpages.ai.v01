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
    return { t: 'doc', path: rel };
  }
  async readJSON(rel, fallback = null) {
    const r = this.route(rel); let res;
    if (r.t === 'type') res = await this.q('SELECT doc FROM product_types WHERE slug = $1', [r.slug]);
    else if (r.t === 'project') res = await this.q('SELECT doc FROM projects WHERE id = $1', [r.pid]);
    else if (r.t === 'blueprint') res = await this.q('SELECT doc FROM project_blueprints WHERE project_id = $1', [r.pid]);
    else if (r.t === 'artifact') res = await this.q('SELECT doc FROM artifacts WHERE project_id = $1 AND key = $2', [r.pid, r.key]);
    else if (r.t === 'comments') res = await this.q('SELECT doc FROM comments WHERE project_id = $1', [r.pid]);
    else res = await this.q('SELECT doc FROM documents WHERE path = $1', [r.path]);
    return res.rows.length ? parse(res.rows[0].doc) : fallback;
  }
  async writeJSON(rel, obj) {
    const r = this.route(rel); const j = JSON.stringify(obj);
    if (r.t === 'type') return this.q('INSERT INTO product_types (slug, doc, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (slug) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()', [r.slug, j]);
    if (r.t === 'project') return this.q('INSERT INTO projects (id, title, status, type_slug, doc, updated_at) VALUES ($1, $2, $3, $4, $5::jsonb, now()) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, type_slug = EXCLUDED.type_slug, doc = EXCLUDED.doc, updated_at = now()', [r.pid, obj.title || '', obj.status || '', obj.typeSlug || '', j]);
    if (r.t === 'blueprint') return this.q('INSERT INTO project_blueprints (project_id, doc) VALUES ($1, $2::jsonb) ON CONFLICT (project_id) DO UPDATE SET doc = EXCLUDED.doc', [r.pid, j]);
    if (r.t === 'artifact') return this.q('INSERT INTO artifacts (project_id, key, version, doc, updated_at) VALUES ($1, $2, $3, $4::jsonb, now()) ON CONFLICT (project_id, key) DO UPDATE SET version = EXCLUDED.version, doc = EXCLUDED.doc, updated_at = now()', [r.pid, r.key, obj.version || 1, j]);
    if (r.t === 'comments') return this.q('INSERT INTO comments (project_id, doc) VALUES ($1, $2::jsonb) ON CONFLICT (project_id) DO UPDATE SET doc = EXCLUDED.doc', [r.pid, j]);
    return this.q('INSERT INTO documents (path, doc, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (path) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()', [r.path, j]);
  }
  async list(relDir) {
    let m;
    if (relDir === 'types') return (await this.q('SELECT slug FROM product_types')).rows.map(r => ({ name: r.slug + '.json', dir: false }));
    if (relDir === 'projects') return (await this.q('SELECT id FROM projects')).rows.map(r => ({ name: r.id, dir: true }));
    if ((m = relDir.match(/^projects\/([^/]+)\/artifacts$/))) return (await this.q('SELECT key FROM artifacts WHERE project_id = $1', [m[1]])).rows.map(r => ({ name: r.key + '.json', dir: false }));
    return this.files.list(relDir);
  }
  async exists(rel) { return (await this.readJSON(rel, null)) !== null || this.files.exists(rel); }
  /* learning data: every review decision, comment and manual edit, queryable later */
  async logEvent(pid, kind, doc) { await this.q('INSERT INTO review_events (project_id, kind, doc) VALUES ($1, $2, $3::jsonb)', [pid, kind, JSON.stringify(doc)]); }
  async deleteProject(pid) {
    const tx = await this.pool.connect();
    try {
      await tx.query('BEGIN');
      for (const [t, c] of [['artifacts', 'project_id'], ['comments', 'project_id'], ['project_blueprints', 'project_id'], ['review_events', 'project_id'], ['projects', 'id']]) await tx.query(`DELETE FROM ${t} WHERE ${c} = $1`, [pid]);
      await tx.query('COMMIT');
    } catch (e) { await tx.query('ROLLBACK'); throw e; } finally { tx.release(); }
    await this.files.remove(`projects/${pid}`);
  }
  abs(rel) { return this.files.abs(rel); }
  readFile(rel) { return this.files.readFile(rel); }
  writeFile(rel, buf) { return this.files.writeFile(rel, buf); }
  remove(rel) { return this.files.remove(rel); }
  async flush() { await this.files.flush(); }
  async close() { await this.flush(); await this.pool.end(); }
  describe() { return { kind: 'postgres', legacyCredentials: !!this.legacyCredentials, label: 'PostgreSQL în Docker', location: `containerul ${process.env.DB_CONTAINER || 'wonderpages-db'}, fișiere în ${this.files.root}` }; }
}
