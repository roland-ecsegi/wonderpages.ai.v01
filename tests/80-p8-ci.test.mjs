// TEST-P8-T01 — regresie de contract intenționată, font/test/resursă lipsă, santinelă de secrete în release și furnizor
// limitat cu aplicația sănătoasă: o verificare obligatorie picată blochează pachetul; fiecare release listează versiunile
// de cod/schemă/politică/unelte și dovezile reale. Totul pe o copie temporară (originalul nu este atins).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { api, ROOT } from './lib.mjs';
import { RELEASE_INCLUDE, runGate, secretSentinel, sourceDigest } from '../scripts/enterprise/release-gate.mjs';
import { healthReport, providerState, REQUIRED_RESOURCES } from '../server/ops/health.js';

/* a disposable copy of exactly what ships, with the shared modules linked (never written) */
function copyRoot() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-gate-'));
  for (const item of RELEASE_INCLUDE) if (fs.existsSync(path.join(ROOT, item))) fs.cpSync(path.join(ROOT, item), path.join(d, item), { recursive: true });
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(d, 'node_modules'), 'dir');
  return d;
}
const status = (ev, id) => ev.checks.find(c => c.id === id)?.status;
const pack = (root, args) => spawnSync(process.execPath, ['scripts/pachet-versiune.mjs', ...args], { cwd: root, encoding: 'utf8', timeout: 120000 });

test('P8-T01: copia curată trece verificările obligatorii; fără suită poarta este INCOMPLETE, nu PASS; versiunile sunt listate', async () => {
  const d = copyRoot();
  const ev = await runGate({ root: d, skipTests: true });
  for (const id of ['build', 'contract', 'resources', 'secrets']) assert.equal(status(ev, id), 'PASS', `${id}: ${ev.checks.find(c => c.id === id)?.detail}`);
  assert.equal(status(ev, 'tests'), 'NOT_RUN'); assert.equal(ev.ok, false); assert.equal(ev.status, 'INCOMPLETE', 'NOT_RUN nu este raportat ca PASS');
  const v = ev.versions; assert.equal(v.code.version, JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version);
  assert.ok(v.productTypes.length && v.productTypes.every(t => t.slug && t.sha256)); assert.ok(v.schemas.contract && v.schemas.layout && v.schemas.database);
  assert.ok(v.policies.safety && v.policies.printRules?.recordedAt && v.policies.goldSet?.cases > 0); assert.ok(v.tools.node && v.tools.dependencies);
  assert.ok(ev.providers && !ev.checks.some(c => c.id === 'providers'), 'furnizorii sunt raportați separat, nu ca poartă');
  assert.equal(ev.source.sha256, sourceDigest(d).sha256);
  fs.rmSync(d, { recursive: true, force: true });
});

test('P8-T01: regresie de contract, font/metrici/test lipsă și secret în release pică verificarea obligatorie', async () => {
  const d = copyRoot(), bp = path.join(d, 'blueprints/kids-sc.json'), orig = fs.readFileSync(bp, 'utf8');
  const b = JSON.parse(orig); b.structure.pages = 11; fs.writeFileSync(bp, JSON.stringify(b));
  assert.equal(status(await runGate({ root: d, skipTests: true }), 'contract'), 'FAIL', 'regresia de contract (11 pagini) este prinsă'); fs.writeFileSync(bp, orig);
  for (const f of ['public/fonts/Andika-Bold.ttf', 'public/fonts/andika-metrics.json', 'tests/run.mjs', 'evaluation/gold/gold-v1.json']) {
    const p = path.join(d, f), keep = fs.readFileSync(p); fs.rmSync(p);
    const ev = await runGate({ root: d, skipTests: true }); assert.equal(ev.ok, false, f); assert.equal(status(ev, f.endsWith('.ttf') || f.endsWith('metrics.json') ? 'build' : 'resources'), 'FAIL', f);
    fs.writeFileSync(p, keep);
  }
  const m = path.join(d, 'public/fonts/andika-metrics.json'), mk = fs.readFileSync(m, 'utf8'), mj = JSON.parse(mk); mj.fonts['400'].sha256 = '0'.repeat(64); fs.writeFileSync(m, JSON.stringify(mj));
  assert.equal(status(await runGate({ root: d, skipTests: true }), 'resources'), 'FAIL', 'metrici învechite față de font'); fs.writeFileSync(m, mk);
  const fake = 'sk-ant-' + 'api03-' + 'Q'.repeat(40);
  fs.writeFileSync(path.join(d, 'server/leak.js'), `export const k = '${fake}';\n`);
  fs.writeFileSync(path.join(d, 'docs/notes.md'), 'DATABASE_URL=postgres://wp:' + 'hunter22' + '@db.internal.lan:5432/wp\n');
  fs.mkdirSync(path.join(d, 'seeds/data'), { recursive: true }); fs.writeFileSync(path.join(d, 'seeds/data/x.json'), '{}');
  fs.writeFileSync(path.join(d, 'tests/run-2026.log'), 'x'); fs.mkdirSync(path.join(d, 'docs/enterprise/baseline/logs'), { recursive: true }); fs.writeFileSync(path.join(d, 'docs/enterprise/baseline/logs/local.log'), 'dovadă locală, nu se livrează');
  const s = secretSentinel(d); assert.equal(s.ok, false); assert.deepEqual(s.hits.map(h => h.file).sort(), ['docs/notes.md', 'seeds/data/x.json', 'server/leak.js', 'tests/run-2026.log']);
  assert.equal(status(await runGate({ root: d, skipTests: true }), 'secrets'), 'FAIL');
  assert.equal(secretSentinel(ROOT).ok, true, 'șabloanele documentate (sk-test-must-be-stripped, example.com, ${…}) nu sunt secrete');
  fs.rmSync(d, { recursive: true, force: true });
});

test('P8-T01: pachetul este refuzat fără poartă trecută sau cu dovada altor surse; cu poarta trecută conține dovezile și versiunile', async () => {
  const d = copyRoot(), out = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-rel-')), evFile = path.join(out, 'ev.json');
  const ev = await runGate({ root: d, skipTests: true });
  fs.writeFileSync(evFile, JSON.stringify(ev)); let r = pack(d, [`--evidence=${evFile}`, `--output=${out}`]);
  assert.equal(r.status, 1); assert.match(r.stderr, /Pachet refuzat: poarta de release este INCOMPLETE/); assert.match(r.stderr, /NOT_RUN tests/);
  /* the suite that would fill "tests" is this very run: the fixture marks it, everything else is the real gate output */
  const passed = { ...ev, ok: true, status: 'PASS', checks: ev.checks.map(c => c.id === 'tests' ? { ...c, status: 'PASS', detail: 'suita curentă (fixture de test)' } : c) };
  fs.writeFileSync(path.join(d, 'server/late-change.js'), 'export const late = 1;\n'); fs.writeFileSync(evFile, JSON.stringify(passed));
  r = pack(d, [`--evidence=${evFile}`, `--output=${out}`]); assert.equal(r.status, 1); assert.match(r.stderr, /alte surse/, 'o modificare după poartă invalidează dovada');
  fs.rmSync(path.join(d, 'server/late-change.js'));
  r = pack(d, [`--evidence=${evFile}`, `--output=${out}`]); assert.equal(r.status, 0, r.stderr);
  const rel = path.join(out, 'wonderpages-ai.v001'); assert.ok(fs.existsSync(rel + '.zip') && fs.existsSync(rel + '.zip.sha256'));
  const evIn = JSON.parse(fs.readFileSync(path.join(rel, 'RELEASE-EVIDENCE.json'), 'utf8')), man = JSON.parse(fs.readFileSync(path.join(rel, 'RELEASE-MANIFEST.json'), 'utf8'));
  assert.equal(evIn.status, 'PASS'); assert.equal(evIn.release, 'wonderpages-ai.v001'); assert.ok(evIn.checks.every(c => c.status === 'PASS'));
  assert.equal(man.gate.source.sha256, ev.source.sha256); assert.ok(man.versions.schemas && man.versions.policies && man.versions.tools);
  assert.ok(man.files.some(f => f.path === 'evaluation/gold/gold-v1.json'), 'setul de aur cerut la rulare este livrat');
  assert.ok(!man.files.some(f => /^(node_modules|data|\.git)\//.test(f.path)));
  assert.ok(!man.files.some(f => /^reference\/|dinosaur.*\.zip$|PROJECT-MANIFEST\.json$/i.test(f.path)), 'Dinosaur World este exclus din instalarea nouă (pachetul de referință se livrează separat)');
  fs.rmSync(d, { recursive: true, force: true }); fs.rmSync(out, { recursive: true, force: true });
});

test('P8-T01: furnizor limitat sau absent cu aplicația sănătoasă; baza de date căzută = down; resursă lipsă = degraded', () => {
  const all = Object.fromEntries(REQUIRED_RESOURCES.map(r => [r, true])), base = { database: { ok: true, kind: 'postgres' }, output: { ok: true }, resources: all };
  const lim = healthReport({ ...base, providers: { claudeText: providerState({ installed: true, auth: true, limited: true }), codexText: providerState({ installed: false }), canva: providerState({ installed: true, auth: false }) } });
  assert.equal(lim.app.status, 'ok'); assert.deepEqual([lim.providers.claudeText, lim.providers.codexText, lim.providers.canva], ['limited', 'absent', 'needs_login']); assert.equal(lim.providers.summary, 'none_available');
  assert.equal(healthReport({ ...base, database: { ok: false } }).app.status, 'down');
  const deg = healthReport({ ...base, resources: { ...all, 'public/fonts/andika-metrics.json': false } }); assert.equal(deg.app.status, 'degraded'); assert.deepEqual(deg.app.components.resources.missing, ['public/fonts/andika-metrics.json']);
  assert.equal(healthReport({ ...base, providers: { x: 'token expired for roland@example.com' } }).providers.x, 'unknown', 'niciun text liber de la furnizor');
});

test('P8-T01 API: /api/health este sanitizat (fără căi, emailuri, chei) și separă aplicația de furnizori; CI doar manual, fără secrete', async () => {
  const r = await api('GET', 'health'); assert.equal(r.status, 200); assert.equal(r.body.schema, 'wonderpages.health/1'); assert.equal(r.body.app.status, 'ok', JSON.stringify(r.body.app));
  assert.ok(['claudeText', 'codexText', 'codexImage', 'canva'].every(k => k in r.body.providers));
  const t = JSON.stringify(r.body); for (const bad of [ROOT, os.homedir(), os.tmpdir(), 'sk-', '@', 'password', 'token']) assert.ok(!t.includes(bad), `nu expune ${bad}`);
  const wf = fs.readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8');
  assert.match(wf, /on:\n\s+workflow_dispatch:/); assert.doesNotMatch(wf, /\bpush:|pull_request:|schedule:/); assert.doesNotMatch(wf, /secrets\./); assert.match(wf, /release-gate\.mjs/);
});
