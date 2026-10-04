/**
 * npm test — suita de teste a aplicației (audit extern, constatarea #4).
 * Pornește o instanță TEMPORARĂ a aplicației (stocare locală, port aleator, foldere temporare), cu servicii
 * simulate: Claude Code, Codex (ChatGPT) și Canva. Nu atinge proiectele tale, baza de date sau abonamentele.
 *   node tests/run.mjs            toate testele (inclusiv livrarea PDF, dacă există Edge/Chrome)
 *   node tests/run.mjs --quick    fără livrarea PDF (folosit de atelierul de îmbunătățiri)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)); const ROOT = path.resolve(HERE, '..');
const quick = process.argv.includes('--quick');
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wonderpages-test-'));
const state = path.join(tmp, 'fake-state.json'); fs.writeFileSync(state, '{}');
const port = await freePort();
const env = {
  ...process.env, PORT: String(port), STORAGE: process.env.WP_TEST_DATABASE_URL ? 'postgres' : 'local', DATABASE_URL: process.env.WP_TEST_DATABASE_URL || '',   // RS-DATA: WP_TEST_DATABASE_URL runs the same suite on a disposable PostgreSQL
  DATA_DIR: path.join(tmp, 'data'), OUTPUT_DIR: path.join(tmp, 'out'),
  WP_FAKE_STATE: state, CODEX_HOME: path.join(tmp, 'codex'), CANVA_SPACING_SEC: '0', CANVA_POLL_MS: '30', CANVA_CONCURRENCY: '1',
  PATH: path.join(HERE, 'mocks', 'bin') + path.delimiter + process.env.PATH, ANTHROPIC_API_KEY: 'sk-test-must-be-stripped', OPENAI_API_KEY: 'sk-test-must-be-stripped',
  GOOGLE_CLIENT_ID: 'test-client', GOOGLE_CLIENT_SECRET: 'test-secret', WP_BG: '', OPEN_BROWSER: '0',
  WP_AUTO_BACKUP: '0'   // the 5-minute daily copy locks mutations for seconds; the backup tests call dailySnapshot directly
};
if (process.platform !== 'win32') for (const f of fs.readdirSync(path.join(HERE, 'mocks', 'bin'))) try { fs.chmodSync(path.join(HERE, 'mocks', 'bin', f), 0o755); } catch {}
const server = spawn(process.execPath, ['--import', './tests/loader.mjs', 'server/start.js'], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; server.stdout.on('data', d => { log += d; }); server.stderr.on('data', d => { log += d; });
const stop = () => { try { server.kill(); } catch {} };
process.on('exit', stop);

const t0 = Date.now(); let up = false;
while (Date.now() - t0 < 60000) { try { const r = await fetch(`http://127.0.0.1:${port}/api/state`); if (r.ok) { up = true; break; } } catch {} await new Promise(r => setTimeout(r, 500)); }
if (!up) { console.error('Aplicația de test nu a pornit:\n' + log.split('\n').slice(-15).join('\n')); stop(); process.exit(1); }

const only = process.env.WP_ONLY || '';                                  // e.g. WP_ONLY=4 runs only tests/4-*.test.mjs
const files = fs.readdirSync(HERE).filter(f => f.endsWith('.test.mjs') && (!only || only.split(',').some(o => f.startsWith(o)))).sort().map(f => path.join('tests', f));
const child = spawn(process.execPath, ['--test', '--test-concurrency=1', '--test-reporter=spec', ...files], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...env, WP_BASE: `http://127.0.0.1:${port}`, WP_PORT: String(port), WP_TMP: tmp, WP_ROOT: ROOT, WP_QUICK: quick ? '1' : '' } });
let out = ''; child.stdout.on('data', d => { out += d; process.stdout.write(d); }); child.stderr.on('data', d => process.stderr.write(d));
const code = await new Promise(r => child.on('exit', r));
stop();
const pass = Number((out.match(/ℹ pass (\d+)/) || [])[1] || 0), fail = Number((out.match(/ℹ fail (\d+)/) || [])[1] || 0);
console.log(`\nRezultat: ${pass} trecute, ${fail} picate${code === 0 ? '' : ' (vezi detaliile de mai sus)'}`);
if (code !== 0) console.log('Ultimele rânduri din serverul de test:\n' + log.split('\n').slice(-12).join('\n'));
setTimeout(() => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {} process.exit(code === 0 ? 0 : 1); }, 800);
