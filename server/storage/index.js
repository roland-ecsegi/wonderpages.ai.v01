import { LocalStorage } from './local.js';
import { PostgresStorage } from './postgres.js';
import { applyMigrations } from '../persistence/migrations.js';

/* PostgreSQL in Docker (normal use) or plain files (tests / no Docker) */
export async function createStorage(cfg) {
  const s = cfg.kind === 'postgres' ? new PostgresStorage(cfg) : new LocalStorage(cfg.dataDir);
  await s.init();
  if (s.kind === 'local') s.migrationStatus = await applyMigrations(s);   // P2-T01 (PostgreSQL applies them in init)
  return s;
}
