import { LocalStorage } from './local.js';
import { PostgresStorage } from './postgres.js';

/* PostgreSQL in Docker (normal use) or plain files (tests / no Docker) */
export async function createStorage(cfg) {
  const s = cfg.kind === 'postgres' ? new PostgresStorage(cfg) : new LocalStorage(cfg.dataDir);
  await s.init();
  return s;
}
