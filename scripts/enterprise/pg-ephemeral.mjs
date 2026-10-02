/**
 * Disposable PostgreSQL cluster for regression runs (RS-DATA). Never touches an installed database:
 * it creates a new data directory under the OS temp folder, listens only on 127.0.0.1 on a free port,
 * and is deleted by `stop`. Returns NOT_RUN (exit 3) when PostgreSQL server binaries are not available.
 *
 *   node scripts/enterprise/pg-ephemeral.mjs start   → prints {"url","dir","port"} (JSON)
 *   node scripts/enterprise/pg-ephemeral.mjs stop <dir>
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

export function findPgBin() {
  const cands = [process.env.PG_BIN, ...['17', '16', '15', '14'].map(v => `/usr/lib/postgresql/${v}/bin`)].filter(Boolean);
  return cands.find(d => fs.existsSync(path.join(d, 'initdb')) && fs.existsSync(path.join(d, 'pg_ctl'))) || null;
}
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
/* PostgreSQL refuses to run as root: when root, the cluster runs as the "postgres" system user. */
function asOwner(cmd, args) {
  const root = process.getuid?.() === 0;
  return root ? spawnSync('runuser', ['-u', 'postgres', '--', cmd, ...args], { encoding: 'utf8' }) : spawnSync(cmd, args, { encoding: 'utf8' });
}

export async function startEphemeral() {
  const bin = findPgBin(); if (!bin) return { status: 'NOT_RUN', reason: 'PostgreSQL server binaries not found (set PG_BIN).' };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-pg-ephemeral-'));
  if (process.getuid?.() === 0) spawnSync('chown', ['-R', 'postgres:postgres', dir]);
  const data = path.join(dir, 'data'), port = await freePort();
  let r = asOwner(path.join(bin, 'initdb'), ['-D', data, '-U', 'wp', '--auth=trust', '-E', 'UTF8', '--locale=C']);
  if (r.status !== 0) return { status: 'FAIL', reason: r.stderr || r.stdout, dir };
  r = asOwner(path.join(bin, 'pg_ctl'), ['-D', data, '-l', path.join(dir, 'pg.log'), '-o', `-p ${port} -k ${dir} -c listen_addresses=127.0.0.1`, '-w', 'start']);
  if (r.status !== 0) return { status: 'FAIL', reason: r.stderr || r.stdout, dir };
  r = asOwner(path.join(bin, 'createdb'), ['-h', '127.0.0.1', '-p', String(port), '-U', 'wp', 'wonderpages']);
  if (r.status !== 0) return { status: 'FAIL', reason: r.stderr || r.stdout, dir };
  return { status: 'STARTED', url: `postgres://wp@127.0.0.1:${port}/wonderpages`, dir, port, bin };
}
export function stopEphemeral(dir) {
  if (!dir || !path.basename(dir).startsWith('wp-pg-ephemeral-')) throw Error('Refuz: nu este un cluster efemer.');
  const bin = findPgBin();
  if (bin && fs.existsSync(path.join(dir, 'data'))) asOwner(path.join(bin, 'pg_ctl'), ['-D', path.join(dir, 'data'), '-m', 'fast', '-w', 'stop']);
  fs.rmSync(dir, { recursive: true, force: true });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'start') { const r = await startEphemeral(); console.log(JSON.stringify(r)); process.exit(r.status === 'STARTED' ? 0 : r.status === 'NOT_RUN' ? 3 : 1); }
  else if (cmd === 'stop') { stopEphemeral(arg); console.log('{"status":"STOPPED"}'); }
  else { console.error('usage: start | stop <dir>'); process.exit(2); }
}
