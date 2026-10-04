#!/usr/bin/env node
/**
 * P8-T04 — capacity benchmark on THIS host (never on the live installation, never against real providers/quotas).
 *   node scripts/enterprise/capacity-bench.mjs [--archived=1,10,100] [--pg] [--asset-kb=8] [--out=docs/enterprise/baseline/CAPACITY.json]
 * For each dataset (N archived 6×12 projects + one active collection with variants and assets) a fresh server starts with
 * the explicit provider mocks; measured: boot time, API reads p50/p95 (sequential and concurrent), local mutations p50/p95,
 * time until the UI event stream delivers a change, reads under Dali contention, server-side layout planning, process RSS,
 * data footprint (disk + PostgreSQL) and the backup retention it implies (14 full daily snapshots).
 * Targets are the PROPOSED ones (read p95 < 1 s, mutation p95 < 2 s, event ≤ 2 s). AI/provider throughput is NOT measured
 * (mocks answer instantly): no real AI throughput is claimed.
 */
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LocalStorage } from '../../server/storage/local.js';
import { applyMigrations } from '../../server/persistence/migrations.js';
import { Repo } from '../../server/repo.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TARGETS = Object.freeze({ readP95Ms: 1000, writeP95Ms: 2000, eventMs: 2000, status: 'proposed_targets' });
const pct = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.ceil(p / 100 * s.length) - 1)] * 10) / 10; };
const stats = a => ({ n: a.length, p50: pct(a, 50), p95: pct(a, 95), max: a.length ? Math.round(Math.max(...a) * 10) / 10 : null });
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const du = dir => { let n = 0; const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.isFile()) n += fs.statSync(p).size; } }; if (fs.existsSync(dir)) walk(dir); return n; };

async function seedProject(repo, storage, pid, { active = false, assetKb = 8, variants = 1 } = {}) {
  await repo.createProject({ id: pid, title: active ? 'Colecția activă' : `Arhivat ${pid}`, typeSlug: 'kids-sc', status: active ? 'paused' : 'completed', archived: !active, input: { language: 'English', second_language: 'Romanian', target_age: '5-6' }, approvals: {}, createdAt: Date.now(), updatedAt: Date.now() }, JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8')));
  await repo.writeArtifact(pid, 'brief', { collection_title: 'Colecție', logline: 'x'.repeat(200) }, { by: 'bench' });
  await repo.writeArtifact(pid, 'bible', { characters: Array.from({ length: 4 }, (_, i) => ({ name: `Erou ${i}`, look: 'y'.repeat(300) })) }, { by: 'bench' });
  for (let v = 0; v < 6; v++) {
    const pages = Array.from({ length: 12 }, (_, n) => ({ n: n + 1, text: `Pagina ${n + 1}: ` + 'cuvânt '.repeat(30), scene: 'scenă '.repeat(20) }));
    await repo.writeArtifact(pid, `script_${v}`, { title: `Volumul ${v + 1}`, pages }, { by: 'bench' });
    await repo.writeArtifact(pid, `final_${v}`, { title: `Volumul ${v + 1}`, pages }, { by: 'bench' });
    for (let p = 0; p <= 12; p++) for (let k = 0; k < variants; k++) {
      const color = `images/v${v}_p${p}_c${k}.png`, line = `images/v${v}_p${p}_l${k}.png`;
      await storage.writeFile(`projects/${pid}/${color}`, crypto.randomBytes(assetKb * 1024)); await storage.writeFile(`projects/${pid}/${line}`, crypto.randomBytes(Math.ceil(assetKb * 1024 / 2)));
      await repo.writeArtifact(pid, `ill_${v}_${p}`, { color, lineart: line, prompt: 'prompt '.repeat(40) }, { by: 'bench' });
    }
  }
}

export async function server(env) {   // also used by the UX gate (empty installation)
  const port = await freePort(), t0 = Date.now();
  const child = spawn(process.execPath, ['server/start.js'], { cwd: ROOT, env: { ...process.env, ...env, PORT: String(port), OPEN_BROWSER: '0', WP_BG: '', PATH: path.join(ROOT, 'tests', 'mocks', 'bin') + path.delimiter + process.env.PATH, ANTHROPIC_API_KEY: '', OPENAI_API_KEY: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; child.stdout.on('data', d => { log += d; }); child.stderr.on('data', d => { log += d; });
  while (Date.now() - t0 < 120000) { try { if ((await fetch(`http://127.0.0.1:${port}/api/state`, { headers: { 'x-wp': '1' } })).ok) break; } catch {} if (child.exitCode != null) throw Error('serverul nu a pornit: ' + log.slice(-500)); await new Promise(r => setTimeout(r, 200)); }
  return { port, child, bootMs: Date.now() - t0, base: `http://127.0.0.1:${port}`, log: () => log };
}
const timed = async (fn) => { const t = performance.now(); const r = await fn(); if (!r.ok) throw Error(`HTTP ${r.status} ${r.url}`); await r.arrayBuffer(); return performance.now() - t; };

export async function runDataset({ archived, pg = null, assetKb = 8, reads = 40, writes = 20, concurrency = 8 }) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-cap-')), data = path.join(work, 'data');
  const out = { archived, storage: pg ? 'postgres' : 'local', assetKb };
  let storage;
  if (pg) { const { PostgresStorage } = await import('../../server/storage/postgres.js'); storage = new PostgresStorage({ databaseUrl: pg.url, dataDir: data }); await storage.init(); }
  else { storage = new LocalStorage(data); await storage.init(); await applyMigrations(storage); }
  const repo = new Repo(storage); await repo.load();
  let t = Date.now();
  for (let i = 0; i < archived; i++) await seedProject(repo, storage, `parch${String(i).padStart(4, '0')}`, { assetKb });
  await seedProject(repo, storage, 'pactive01', { active: true, assetKb, variants: 3 });
  out.seedMs = Date.now() - t; await storage.close?.();
  const fake = path.join(work, 'fake.json'); fs.writeFileSync(fake, '{}');
  const srv = await server({ WP_AUTO_BACKUP: '0', STORAGE: pg ? 'postgres' : 'local', DATABASE_URL: pg?.url || '', DATA_DIR: data, OUTPUT_DIR: path.join(work, 'out'), WP_FAKE_STATE: fake, CODEX_HOME: path.join(work, 'codex') });
  const H = { 'x-wp': '1' },   // the CSRF header every UI request carries
    get = p => fetch(srv.base + p, { headers: H }), post = (p, b) => fetch(srv.base + p, { method: 'POST', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify(b) });
  try {
    out.bootMs = srv.bootMs;
    const endpoints = { state: '/api/state', activeProject: '/api/projects/pactive01', archivedProject: archived ? '/api/projects/parch0000' : '/api/projects/pactive01', jobs: '/api/projects/pactive01/jobs', learning: '/api/learning', health: '/api/health', ledger: '/api/ledger' };
    out.reads = {};
    for (const [k, p] of Object.entries(endpoints)) { await timed(() => get(p)); const a = []; for (let i = 0; i < reads; i++) a.push(await timed(() => get(p))); out.reads[k] = stats(a); }
    const conc = []; for (let r = 0; r < Math.ceil(reads / concurrency); r++) conc.push(...await Promise.all(Array.from({ length: concurrency }, (_, i) => timed(() => get(Object.values(endpoints)[i % 7])))));
    out.concurrentReads = { concurrency, ...stats(conc) };
    const w = []; for (let i = 0; i < writes; i++) w.push(await timed(() => post('/api/projects/pactive01/comments', { text: `măsurare ${i}`, target: 'general' })));
    out.writes = stats(w);
    /* a durable project commit (revision bump, journal/transaction): the operator's rights declaration */
    const put = (p, b) => fetch(srv.base + p, { method: 'PUT', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify(b) });
    const wc = []; for (let i = 0; i < writes; i++) wc.push(await timed(() => put('/api/projects/pactive01/rights', { id: 'manuscript:seed_story', subject: { kind: 'manuscript', ref: 'input.seed_story' }, source: `operator ${i}`, grant: 'owned', permissions: { commercial: 'yes', reproduction: 'yes', derivative: 'yes' } })));
    out.commitWrites = stats(wc);
    /* event stream: time from a mutation to the change event reaching a connected UI */
    const ev = []; for (let i = 0; i < 5; i++) ev.push(await eventLatency(srv.base, () => post('/api/projects/pactive01/comments', { text: `eveniment ${i}`, target: 'general' })));
    out.eventMs = stats(ev.filter(x => x != null)); out.eventMissed = ev.filter(x => x == null).length;
    /* contention: reads while Dali answers in parallel (mock model: measures the app, not the model) */
    let stop = false; const dali = Array.from({ length: 4 }, async () => { let n = 0; while (!stop) { await post('/api/assistant', { message: 'Ce fac acum?', context: { route: '#/' } }).then(r => r.arrayBuffer()).catch(() => {}); n++; } return n; });
    const cr = []; for (let i = 0; i < reads; i++) cr.push(await timed(() => get(i % 2 ? '/api/state' : '/api/projects/pactive01')));
    stop = true; out.daliCalls = (await Promise.all(dali)).reduce((a, b) => a + b, 0); out.readsUnderContention = stats(cr);
    { const a = []; for (let i = 0; i < 5; i++) { const t0 = performance.now(); const r = await get('/api/projects/pactive01/layout/1'); await r.arrayBuffer(); a.push(performance.now() - t0); out.layoutStatus = r.status; } out.layoutPlan = stats(a); }
    /* a manual/daily backup takes the storage lock: how long mutations wait (409) at this data size */
    { const t0 = performance.now(); const bk = post('/api/backups', {}).then(async r => { await r.arrayBuffer(); return { status: r.status, ms: performance.now() - t0 }; }); let rejected = 0, tried = 0;
      await new Promise(r => setTimeout(r, 20)); for (let i = 0; i < 200; i++) { const r = await post('/api/projects/pactive01/comments', { text: `în timpul copiei ${i}`, target: 'general' }); await r.arrayBuffer(); tried++; if (r.status === 409) rejected++; else if (performance.now() - t0 > 100 && rejected === 0) break; const done = await Promise.race([bk.then(() => true), Promise.resolve(false)]); if (done) break; }
      const b = await bk; out.backupLock = { status: b.status, lockMs: Math.round(b.ms), writesTried: tried, writesRejected409: rejected }; }
    /* the next backup after a few changes is incremental (unchanged files hard-linked): the lock shrinks to the changed data */
    { for (let i = 0; i < 3; i++) await (await post('/api/projects/pactive01/comments', { text: `după copie ${i}`, target: 'general' })).arrayBuffer();
      const t0 = performance.now(), r = await post('/api/backups', {}), body = await r.json(); out.backupLockIncremental = { status: r.status, lockMs: Math.round(performance.now() - t0) };
      const dir = path.join(work, 'out', '_backup', body.file || ''); try { const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')); out.backupLockIncremental.linked = m.incremental?.linked ?? null; out.backupLockIncremental.copied = m.incremental?.copied ?? null; } catch {} }
    try { const st = fs.readFileSync(`/proc/${srv.child.pid}/status`, 'utf8'); out.rssMb = Math.round(Number(st.match(/VmRSS:\s+(\d+)/)[1]) / 1024); out.peakRssMb = Math.round(Number(st.match(/VmHWM:\s+(\d+)/)[1]) / 1024); } catch { out.rssMb = null; }
    out.diskMb = Math.round(du(data) / 1048576 * 10) / 10;
    if (pg) { const pgm = (await import('pg')).default, c = new pgm.Client({ connectionString: pg.url }); await c.connect(); out.dbMb = Math.round(Number((await c.query('SELECT pg_database_size(current_database()) AS n')).rows[0].n) / 1048576 * 10) / 10; await c.end(); }
    out.footprintMbPerProject = Math.round((out.diskMb + (out.dbMb || 0)) / (archived + 1) * 100) / 100;
    out.backupRetentionMb = Math.round((out.diskMb + (out.dbMb || 0)) * 14);
    const readP95 = Math.max(...Object.values(out.reads).map(r => r.p95), out.concurrentReads.p95, out.readsUnderContention.p95);
    out.verdict = { readP95Ms: readP95, readOk: readP95 < TARGETS.readP95Ms, writeOk: Math.max(out.writes.p95, out.commitWrites.p95) < TARGETS.writeP95Ms, eventOk: out.eventMissed === 0 && out.eventMs.p95 <= TARGETS.eventMs };
    out.ok = out.verdict.readOk && out.verdict.writeOk && out.verdict.eventOk;
    return out;
  } finally { srv.child.kill(); await new Promise(r => setTimeout(r, 300)); fs.rmSync(work, { recursive: true, force: true }); }
}

async function eventLatency(base, mutate) {
  const sleep = ms => new Promise(r => setTimeout(r, ms)), ctl = new AbortController();
  const r = await fetch(base + '/api/events', { headers: { 'x-wp': '1' }, signal: ctl.signal }), reader = r.body.getReader(), dec = new TextDecoder();
  let armed = false, t0 = 0, got = null, buf = '';
  const loop = (async () => { for (;;) { const { value, done } = await reader.read(); if (done) return; const s = dec.decode(value, { stream: true }); if (!armed) continue; buf += s; if (/(^|\n)data: /.test(buf)) { got = performance.now() - t0; return; } } })().catch(() => {});
  await sleep(250); armed = true; t0 = performance.now(); await (await mutate()).arrayBuffer();
  await Promise.race([loop, sleep(5000)]); ctl.abort(); return got;
}

/** DW real asset sizes: the reference archive (texts + 2 reference images) and an estimate for full illustrated volumes. */
export function dwSizing() {
  const zip = path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip'); if (!fs.existsSync(zip)) return null;
  return { referenceArchiveMb: Math.round(fs.statSync(zip).size / 1048576 * 100) / 100, note: 'Arhiva DW conține textele, planurile și 2 imagini de referință; ilustrațiile finale nu există încă (P8-T05), deci dimensiunea reală a unui volum ilustrat nu este măsurată. Estimare: 6 volume × 13 imagini × (color + linie) × dimensiunea medie a imaginilor de referință.' };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const arg = n => process.argv.find(x => x.startsWith(`--${n}=`))?.split('=').slice(1).join('=');
  const sizes = (arg('archived') || '1,10,100').split(',').map(Number), assetKb = Number(arg('asset-kb') || 8), results = [];
  let pg = null, stopPg = null;
  if (process.argv.includes('--pg')) { const { startEphemeral, stopEphemeral } = await import('./pg-ephemeral.mjs'); const p = await startEphemeral(); if (p.status === 'STARTED') { pg = p; stopPg = () => stopEphemeral(p.dir); } else results.push({ storage: 'postgres', status: 'NOT_RUN', reason: p.reason || p.status }); }
  try {
    for (const n of sizes) { results.push(await runDataset({ archived: n, assetKb })); console.log(`local N=${n}: ${JSON.stringify(results.at(-1).verdict)}`); }
    if (pg) for (const n of sizes) {
      const pgm = (await import('pg')).default, admin = new pgm.Client({ connectionString: pg.url }); await admin.connect(); const db = `bench_${n}_${Date.now()}`; await admin.query(`CREATE DATABASE ${db}`); await admin.end();
      results.push(await runDataset({ archived: n, assetKb, pg: { url: pg.url.replace(/\/[^/?]+(\?|$)/, `/${db}$1`) } })); console.log(`postgres N=${n}: ${JSON.stringify(results.at(-1).verdict)}`);
    }
  } finally { stopPg?.(); }
  const ev = { schema: 'wonderpages.capacity/1', at: new Date().toISOString(), host: { platform: process.platform, cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model, memGb: Math.round(os.totalmem() / 1073741824), node: process.version }, targets: TARGETS, results, dw: dwSizing(),
    notAMeasurement: ['debitul real al furnizorilor AI (mock-urile răspund instantaneu)', 'randarea PDF în browser (P6-T05 măsoară separat)', 'hostul de referință al clientului'] };
  const out = arg('out'); if (out) fs.writeFileSync(path.resolve(out), JSON.stringify(ev, null, 2) + '\n');
  process.exit(results.every(r => r.ok || r.status === 'NOT_RUN') ? 0 : 1);
}
