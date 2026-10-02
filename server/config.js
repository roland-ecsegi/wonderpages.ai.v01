import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appPackage = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8').replace(/^\uFEFF/, ''));
export const APP_EDITION = appPackage.edition || 'WonderPages AI';
export const APP_VERSION = appPackage.version;

/* tiny .env loader, no dependency */
/* audit M6: a key written twice uses its LAST value (like Docker Compose) and a warning names it */
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const vals = new Map(), seen = new Set(), dup = new Set();
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (line.trim().startsWith('#')) continue;
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (seen.has(m[1])) dup.add(m[1]); seen.add(m[1]); vals.set(m[1], v);
  }
  for (const [k, v] of vals) if (process.env[k] === undefined) process.env[k] = v;
  if (dup.size) console.warn(`[.env] chei scrise de două ori (se folosește ultima valoare): ${[...dup].join(', ')}`);
  ENV_DUPLICATES.push(...dup);
}
export const ENV_DUPLICATES = [];
loadEnv(path.join(ROOT, '.env'));

const E = process.env;
export const config = {
  port: Number(E.PORT || 4321),
  provider: 'claude-code',                         // Pro subscription only; no paid API path exists
  claudeCode: { model: E.CLAUDE_CODE_MODEL || 'sonnet', lightModel: E.CLAUDE_CODE_LIGHT_MODEL || 'haiku', timeoutMin: Number(E.CLAUDE_TIMEOUT_MIN || 12) },
  budget5h: Math.max(10, Number(E.PRO_CALLS_PER_5H || 90)),
  openBrowser: E.OPEN_BROWSER === '1',
  storage: { kind: E.STORAGE || (E.DATABASE_URL ? 'postgres' : 'local'), dataDir: path.resolve(ROOT, E.DATA_DIR || './data'), databaseUrl: E.DATABASE_URL || '' },
  outputDir: path.resolve(E.OUTPUT_DIR || path.join(os.homedir(), 'Documents', 'WonderPages')),
  canva: {
    url: E.CANVA_MCP_URL || 'https://mcp.canva.com/mcp',
    clientId: E.CANVA_CLIENT_ID || '', clientSecret: E.CANVA_CLIENT_SECRET || '',
    concurrency: Math.max(1, Number(E.CANVA_CONCURRENCY || 1))
  }
};
