/**
 * P1-T02 — executable baseline report. Every check is PASS / FAIL / NOT_RUN with a reason and, when run,
 * a log file. Historical results (the audit's 91/91 of 2026-10-01) are reported separately and never
 * counted as a new run. No provider is called, nothing is installed, no real project is touched.
 *
 *   node scripts/enterprise/baseline-report.mjs [--with-tests] [--with-pg] [--out=docs/enterprise/baseline]
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sha256 } from '../../server/domain/canonical.js';
import { readDinosaurWorld } from '../../server/migration/dw-reference.js';
import { startEphemeral, stopEphemeral, findPgBin } from './pg-ephemeral.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = n => process.argv.find(x => x.startsWith(`--${n}=`))?.slice(n.length + 3);
const OUT = path.resolve(ROOT, arg('out') || 'docs/enterprise/baseline'), LOGS = path.join(OUT, 'logs');
fs.mkdirSync(LOGS, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const checks = [], add = c => { checks.push(c); console.log(`${c.status.padEnd(7)} ${c.id} — ${c.summary}`); };
const run = (cmd, args, env = {}) => spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024 });
const writeLog = (name, text) => { const f = path.join(LOGS, `${stamp}-${name}.log`); fs.writeFileSync(f, text); return path.relative(ROOT, f).split(path.sep).join('/'); };
const which = exe => { const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [exe], { encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim().split(/\r?\n/)[0] : null; };

/* 1. inventory incl. hidden files and entry points */
const SKIP = new Set(['node_modules', '.git', 'data']);
const files = []; (function walk(d) { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { if (SKIP.has(e.name)) continue; const rel = d ? `${d}/${e.name}` : e.name; if (e.isDirectory()) walk(rel); else files.push(rel); } })('');
const byExt = files.reduce((m, f) => { const x = path.extname(f) || '(none)'; m[x] = (m[x] || 0) + 1; return m; }, {});
const hidden = files.filter(f => f.split('/').some(s => s.startsWith('.')));
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
add({ id: 'INVENTORY', status: 'PASS', summary: `${files.length} fișiere (fără node_modules/.git/data), ${hidden.length} ascunse`, detail: { total: files.length, byExt, hidden, entryPoints: { scripts: pkg.scripts, server: 'server/start.js → server/index.js', ui: 'public/index.html → public/app/{core,views,ui,actions,pdf}.js', installer: ['instaleaza.bat', 'porneste.bat', 'opreste.bat', 'activeaza-retea.bat', 'deschide.vbs', 'docker-compose.yml'] }, version: pkg.version, edition: pkg.edition } });

/* 2. drift vs the v04 release manifest (expected: enterprise changes are listed, not hidden) */
const rel = JSON.parse(fs.readFileSync(path.join(ROOT, 'RELEASE-MANIFEST.json'), 'utf8'));
const drift = { unchanged: 0, modified: [], missing: [] };
for (const f of rel.files) { const p = path.join(ROOT, f.path); if (!fs.existsSync(p)) { drift.missing.push(f.path); continue; } const b = fs.readFileSync(p); if (b.length === f.bytes && sha256(b) === f.sha256) drift.unchanged++; else drift.modified.push(f.path); }
const listed = new Set(rel.files.map(f => f.path)); drift.added = files.filter(f => !listed.has(f) && !f.startsWith('reference/') && f !== 'RELEASE-MANIFEST.json');
add({ id: 'SOURCE_DRIFT_V04', status: drift.missing.length ? 'FAIL' : 'PASS', summary: `${drift.unchanged}/${rel.files.length} fișiere v04 identice, ${drift.modified.length} modificate (enterprise), ${drift.added.length} adăugate, ${drift.missing.length} lipsă`, detail: drift });

/* 3. build/lint (syntax + resources; not TypeScript/ESLint) */
const b = run(process.execPath, ['scripts/build.mjs']);
add({ id: 'BUILD', status: b.status === 0 ? 'PASS' : 'FAIL', summary: (b.stdout || b.stderr).trim().split('\n').pop(), log: writeLog('build', b.stdout + b.stderr) });

/* 4. RS0 full suite (simulated providers, real browser PDF when available) */
const browser = process.env.BROWSER_PATH || ['/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/google-chrome'].find(p => fs.existsSync(p)) || null;
let rs0 = null;
if (process.argv.includes('--with-tests')) {
  const t = run(process.execPath, ['tests/run.mjs'], browser ? { BROWSER_PATH: browser } : {});
  const out = t.stdout + t.stderr, pass = Number(out.match(/ℹ pass (\d+)/)?.[1] || 0), fail = Number(out.match(/ℹ fail (\d+)/)?.[1] || 0), skipped = Number(out.match(/ℹ skipped (\d+)/)?.[1] || 0);
  const names = [...out.matchAll(/^(✔|✖) (.+?) \(\d/gm)].map(m => ({ ok: m[1] === '✔', name: m[2] }));
  rs0 = { pass, fail, skipped, names };
  add({ id: 'RS0_SUITE', status: t.status === 0 && !fail ? 'PASS' : 'FAIL', summary: `${pass} trecute, ${fail} picate, ${skipped} sărite; browser PDF: ${browser ? 'da' : 'nu (testul PDF se sare)'}`, log: writeLog('rs0', out) });
} else add({ id: 'RS0_SUITE', status: 'NOT_RUN', summary: 'rulează cu --with-tests' });

/* 5. protected protections mapped to test names (from this run only) */
const PROTECTED = { import: /import|C1/, approvals: /aprob|poart|gate|H1/i, pdf: /PDF/, backup: /backup|copi(a|ile) de siguranță|restaur/i, learning: /lecți|învăț|retrospectiv|setul de aur|calibr/i, atelier: /atelier/, lan: /CSRF|rebinding|localOnly|laptopul|LAN/ };
for (const [k, re] of Object.entries(PROTECTED)) {
  if (!rs0) { add({ id: `PROTECT_${k.toUpperCase()}`, status: 'NOT_RUN', summary: 'depinde de RS0_SUITE' }); continue; }
  const hit = rs0.names.filter(n => re.test(n.name));
  add({ id: `PROTECT_${k.toUpperCase()}`, status: !hit.length ? 'FAIL' : hit.every(n => n.ok) ? 'PASS' : 'FAIL', summary: `${hit.filter(n => n.ok).length}/${hit.length} teste`, detail: hit.map(n => n.name) });
}

/* 6. real PostgreSQL regression in a disposable cluster */
if (process.argv.includes('--with-pg')) {
  const pg = await startEphemeral();
  if (pg.status !== 'STARTED') add({ id: 'PG_QA', status: pg.status === 'NOT_RUN' ? 'NOT_RUN' : 'FAIL', summary: pg.reason?.slice(0, 200) || 'cluster indisponibil' });
  else {
    const inst = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-pg-inst-')); fs.writeFileSync(path.join(inst, '.env'), `DATABASE_URL=${pg.url}\n`);
    const init = run(process.execPath, ['-e', `import('./server/storage/postgres.js').then(async m=>{const s=new m.PostgresStorage({databaseUrl:${JSON.stringify(pg.url)},dataDir:${JSON.stringify(path.join(inst, 'data'))}});await s.init();await s.close();})`]);
    const q = run(process.execPath, ['scripts/qa-postgres.mjs', inst]);
    add({ id: 'PG_QA', status: init.status === 0 && q.status === 0 ? 'PASS' : 'FAIL', summary: (q.stdout || q.stderr).trim().split('\n').pop().slice(0, 200), log: writeLog('pg-qa', init.stdout + init.stderr + q.stdout + q.stderr) });
    if (process.argv.includes('--with-tests')) {   // RS-DATA: the whole suite again, on the disposable PostgreSQL
      const t = run(process.execPath, ['tests/run.mjs'], { WP_TEST_DATABASE_URL: pg.url, ...(browser ? { BROWSER_PATH: browser } : {}) });
      const out = t.stdout + t.stderr, pass = Number(out.match(/ℹ pass (\d+)/)?.[1] || 0), fail = Number(out.match(/ℹ fail (\d+)/)?.[1] || 0), skipped = Number(out.match(/ℹ skipped (\d+)/)?.[1] || 0);
      add({ id: 'RS0_SUITE_POSTGRES', status: t.status === 0 && !fail ? 'PASS' : 'FAIL', summary: `${pass} trecute, ${fail} picate, ${skipped} sărite (STORAGE=postgres)`, log: writeLog('rs0-postgres', out) });
    }
    fs.rmSync(inst, { recursive: true, force: true }); stopEphemeral(pg.dir);
  }
} else add({ id: 'PG_QA', status: 'NOT_RUN', summary: findPgBin() ? 'rulează cu --with-pg' : 'binare PostgreSQL absente' });

/* 7. Dinosaur World reference (read-only) */
const dwZip = path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip');
let dw = null;
if (fs.existsSync(dwZip)) {
  dw = readDinosaurWorld(fs.readFileSync(dwZip), { currentBlueprint: JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8')) }); delete dw.doc;
  const c = dw.counts, ok = dw.archiveSha256 === '7056e113bf5c84fdfc0f7b8f528713de6c8fe31e82b40fbab056544fe10e45e3' && dw.manifest.allMatch && c.volumes === 6 && c.pagePlans === 72 && c.preparedManuscriptPages === 12 && c.images === 2 && c.artifacts.length === 6;
  add({ id: 'DW_REFERENCE', status: ok ? 'PASS' : 'FAIL', summary: `sha256 ${dw.archiveSha256.slice(0, 12)}…, manifest ${dw.manifest.entries.filter(e => e.sha256Match && e.bytesMatch).length}/${dw.manifest.entries.length}, ${c.artifacts.length} artefacte, ${c.volumes} volume, ${c.pagePlans} planuri, ${c.preparedManuscriptPages} pagini V1, ${c.images} PNG; producție nepornită`, detail: dw });
} else add({ id: 'DW_REFERENCE', status: 'NOT_RUN', summary: 'arhiva DW lipsește din reference/' });

/* 8. runtime and provider executables (presence only; no login, no call) */
const v = cmd => { const r = spawnSync(cmd, ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' }); return r.status === 0 ? (r.stdout || r.stderr).trim().split('\n')[0] : null; };
const runtime = { node: process.version, npm: v('npm'), platform: `${os.platform()} ${os.release()} ${os.arch()}`, postgresBin: findPgBin(), browser, claude: which('claude'), codex: which('codex'), docker: which('docker') };
add({ id: 'RUNTIME', status: 'PASS', summary: `Node ${runtime.node}, npm ${runtime.npm}, ${runtime.platform}`, detail: runtime });
add({ id: 'PROVIDERS_REAL', status: 'NOT_RUN', summary: `Fără apeluri reale în baseline (claude: ${runtime.claude ? 'instalat' : 'absent'}, codex: ${runtime.codex ? 'instalat' : 'absent'}); discovery în P1-T03` });
add({ id: 'WINDOWS_INSTALLER', status: process.platform === 'win32' ? 'NOT_RUN' : 'NOT_RUN', summary: process.platform === 'win32' ? 'necesită hostul operatorului' : 'hostul de referință Windows nu este acest mediu' });
add({ id: 'DOCKER_POSTGRES', status: 'NOT_RUN', summary: runtime.docker ? 'Docker prezent, dar nu se pornește în baseline' : 'Docker absent în acest mediu; PostgreSQL verificat prin cluster efemer (PG_QA)' });

const report = { kind: 'wonderpages.baseline-report/1', generatedAt: new Date().toISOString(), codeRevision: run('git', ['rev-parse', '--short', 'HEAD']).stdout.trim() || null, checks, historical: [{ source: 'Audit_Full_WonderPages_AI_v04.pdf pp. 250–251 / docs/v04/RAPORT-V04.md', date: '2026-10-01', result: '91/91 PASS', providers: 'simulați', note: 'raport istoric; nu este rezultatul acestei rulări' }], summary: { PASS: checks.filter(c => c.status === 'PASS').length, FAIL: checks.filter(c => c.status === 'FAIL').length, NOT_RUN: checks.filter(c => c.status === 'NOT_RUN').length } };
fs.writeFileSync(path.join(OUT, 'BASELINE-REPORT.json'), JSON.stringify(report, null, 1));
const md = [`# Baseline report (${report.generatedAt.slice(0, 10)}, cod ${report.codeRevision})`, '', 'Generat de `scripts/enterprise/baseline-report.mjs`. NOT_RUN nu este PASS; istoricul este separat.', '', '| Check | Status | Rezumat | Log |', '|---|---|---|---|',
  ...checks.map(c => `| ${c.id} | ${c.status} | ${String(c.summary).replace(/\|/g, '/')} | ${c.log ? `\`${c.log}\`` : ''} |`), '', '## Istoric (nu rulare nouă)', '', ...report.historical.map(h => `- ${h.date}: ${h.result} (${h.providers}) — ${h.source}. ${h.note}`), '', `Total: ${report.summary.PASS} PASS · ${report.summary.FAIL} FAIL · ${report.summary.NOT_RUN} NOT_RUN`, ''].join('\n');
fs.writeFileSync(path.join(OUT, 'BASELINE-REPORT.md'), md);
console.log(`\n${report.summary.PASS} PASS, ${report.summary.FAIL} FAIL, ${report.summary.NOT_RUN} NOT_RUN → ${path.relative(ROOT, OUT)}`);
process.exit(report.summary.FAIL ? 1 : 0);
