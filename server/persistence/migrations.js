/**
 * P2-T01 — numbered, additive schema migrations (OUTPUT-20, ADR05).
 * Every migration is idempotent (IF NOT EXISTS), runs in its own transaction on PostgreSQL and is recorded
 * with a checksum in `schema_migrations` (local mode: `_meta/schema.json`). Nothing is dropped or rewritten:
 * older application versions keep working with the extra tables/columns (downgrade compatibility).
 */
import { canonicalHash } from '../domain/canonical.js';

export const MIGRATIONS = Object.freeze([
  { id: 1, name: 'schema_migrations', pg: ['CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ DEFAULT now())'] },
  { id: 2, name: 'project_revision', pg: ['ALTER TABLE projects ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 0'] },
  { id: 3, name: 'commands', pg: ['CREATE TABLE IF NOT EXISTS commands (command_id TEXT PRIMARY KEY, project_id TEXT, doc JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now())', 'CREATE INDEX IF NOT EXISTS idx_commands_project ON commands (project_id)'] },
  { id: 4, name: 'artifact_versions', pg: ['CREATE TABLE IF NOT EXISTS artifact_versions (project_id TEXT NOT NULL, key TEXT NOT NULL, version INTEGER NOT NULL, hash TEXT, pinned BOOLEAN NOT NULL DEFAULT false, doc JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (project_id, key, version))'] },
  { id: 5, name: 'artifact_dependencies', pg: ['CREATE TABLE IF NOT EXISTS artifact_dependencies (project_id TEXT NOT NULL, id TEXT NOT NULL, doc JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (project_id, id))'] },
  { id: 6, name: 'decision_records', pg: ['CREATE TABLE IF NOT EXISTS decision_records (project_id TEXT NOT NULL, id TEXT NOT NULL, doc JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (project_id, id))'] },
  { id: 7, name: 'outbox', pg: ['CREATE TABLE IF NOT EXISTS outbox (id BIGSERIAL PRIMARY KEY, project_id TEXT, kind TEXT NOT NULL, doc JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), delivered_at TIMESTAMPTZ)'] },
  { id: 8, name: 'migration_runs', pg: ['CREATE TABLE IF NOT EXISTS migration_runs (id TEXT PRIMARY KEY, doc JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now())'] },
  { id: 9, name: 'jobs', pg: ['CREATE TABLE IF NOT EXISTS jobs (project_id TEXT NOT NULL, job_key TEXT NOT NULL, status TEXT NOT NULL, lease_token BIGINT NOT NULL DEFAULT 0, doc JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (project_id, job_key))', 'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status)'] }
]);
/* tables included in PostgreSQL snapshots; restore of an older snapshot leaves the newer tables empty */
export const CORE_TABLES = ['product_types', 'projects', 'project_blueprints', 'artifacts', 'comments', 'review_events', 'documents'];
export const LEDGER_TABLES = ['schema_migrations', 'commands', 'artifact_versions', 'artifact_dependencies', 'decision_records', 'outbox', 'migration_runs', 'jobs'];
/* project-scoped ledger tables (removed together with the project by an explicit purge) */
export const PROJECT_LEDGER_TABLES = ['commands', 'artifact_versions', 'artifact_dependencies', 'decision_records', 'outbox', 'jobs'];
export const checksumOf = m => canonicalHash({ id: m.id, name: m.name, pg: m.pg });
export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].id;

export async function applyMigrations(storage, migrations = MIGRATIONS) {   // P8-T02: the list is injectable for the interrupted-migration drill
  const applied = [];
  if (storage.kind === 'postgres') {
    await storage.q(MIGRATIONS[0].pg[0]);
    const done = new Map((await storage.q('SELECT id, checksum FROM schema_migrations')).rows.map(r => [r.id, r.checksum]));
    for (const m of migrations) {
      const sum = checksumOf(m);
      if (done.has(m.id)) { if (done.get(m.id) !== sum) throw Error(`Migrarea ${m.id} (${m.name}) diferă de cea aplicată: oprire (integritate schema).`); continue; }
      const tx = await storage.pool.connect();
      try { await tx.query('BEGIN'); for (const sql of m.pg) await tx.query(sql); await tx.query('INSERT INTO schema_migrations (id, name, checksum) VALUES ($1,$2,$3)', [m.id, m.name, sum]); await tx.query('COMMIT'); applied.push(m.id); }
      catch (e) { await tx.query('ROLLBACK').catch(() => {}); throw e; } finally { tx.release(); }
    }
  } else {
    const meta = (await storage.readJSON('_meta/schema.json', null)) || { migrations: [] };
    for (const m of migrations) {
      const sum = checksumOf(m), prev = meta.migrations.find(x => x.id === m.id);
      if (prev) { if (prev.checksum !== sum) throw Error(`Migrarea ${m.id} (${m.name}) diferă de cea aplicată: oprire (integritate schema).`); continue; }
      meta.migrations.push({ id: m.id, name: m.name, checksum: sum, appliedAt: Date.now() }); applied.push(m.id);
    }
    if (applied.length) await storage.writeJSON('_meta/schema.json', meta);
  }
  const recovered = await storage.recoverJournal?.() || { replayed: 0 };
  return { schemaVersion: SCHEMA_VERSION, applied, recovered };
}
export async function schemaStatus(storage) {
  if (storage.kind === 'postgres') return { schemaVersion: SCHEMA_VERSION, applied: (await storage.q('SELECT id, name, checksum, applied_at FROM schema_migrations ORDER BY id')).rows };
  return { schemaVersion: SCHEMA_VERSION, applied: ((await storage.readJSON('_meta/schema.json', null)) || { migrations: [] }).migrations };
}
