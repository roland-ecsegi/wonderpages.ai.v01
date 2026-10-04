// TEST-P8-T03 — instalare nouă / peste una existentă, eșec la pornire cu revenire, actualizare întreruptă, cale lungă de
// ieșire, drepturi necunoscute, export doar-sursă și chitanță învechită: smoke + hash-uri protejate trec; revenirea completă
// este dovedită; statutul comercial este bazat pe dovezi și specific destinației. Totul pe copii temporare.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { api, ROOT } from './lib.mjs';
import { RELEASE_INCLUDE, runGate } from '../scripts/enterprise/release-gate.mjs';
import { licenseReport, noticesMarkdown, ELECTIONS } from '../scripts/enterprise/licenses.mjs';
import { upgrade, rollback, recoverUpgrade, verifyRelease, smoke, protectedHashes } from '../scripts/actualizare.mjs';
import { outputPathCheck, longPaths } from '../server/output.js';
import { commercialStatus, recordProof } from '../server/domain/release-candidate.js';

const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const W = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-inst-'));
function source(name, mutate = () => {}) {
  const d = path.join(W, name); for (const item of RELEASE_INCLUDE) if (fs.existsSync(path.join(ROOT, item))) fs.cpSync(path.join(ROOT, item), path.join(d, item), { recursive: true });
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(d, 'node_modules'), 'dir'); mutate(d); return d;
}
/* the real gate on the copy; "tests" is this very suite (fixture), everything else is the gate's own output */
async function release(src, out, extra = []) {
  const f = path.join(W, `ev-${path.basename(src)}.json`);
  if (!fs.existsSync(f)) await gate(src, f);
  const r = spawnSync(process.execPath, ['scripts/pachet-versiune.mjs', `--evidence=${f}`, `--output=${out}`, ...extra], { cwd: src, encoding: 'utf8', timeout: 120000 }); assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}
async function gate(src, f) {
  const ev = await runGate({ root: src, skipTests: true }); assert.equal(ev.checks.filter(c => c.id !== 'tests').every(c => c.status === 'PASS'), true, JSON.stringify(ev.checks));
  fs.writeFileSync(f, JSON.stringify({ ...ev, ok: true, status: 'PASS', checks: ev.checks.map(c => c.id === 'tests' ? { ...c, status: 'PASS', detail: 'suita curentă (fixture)' } : c) }));
}
const tree = (root, files) => Object.fromEntries(files.map(f => [f, fs.existsSync(path.join(root, f)) ? sha(fs.readFileSync(path.join(root, f))) : null]));
let A, B, inst, filesA;

test('P8-T03: pachet reproductibil (aceleași surse + dovadă → aceiași octeți), licențe și OFL incluse; instalarea nouă pornește fără proiecte', async () => {
  const srcA = source('srcA'); A = await release(srcA, path.join(W, 'outA'));
  const again = await release(srcA, path.join(W, 'outA2'));   // same sources, same gate evidence
  assert.equal(sha(fs.readFileSync(A.zip)), sha(fs.readFileSync(again.zip)), 'arhiva este reproductibilă');
  const man = JSON.parse(fs.readFileSync(path.join(A.folder, 'RELEASE-MANIFEST.json'), 'utf8'));
  for (const f of ['THIRD-PARTY-NOTICES.md', 'RELEASE-EVIDENCE.json', 'public/fonts/OFL-Andika.txt']) assert.ok(man.files.some(x => x.path === f), f);
  const notices = fs.readFileSync(path.join(A.folder, 'THIRD-PARTY-NOTICES.md'), 'utf8'); assert.match(notices, /dompurify \| [\d.]+ \| \(MPL-2\.0 OR Apache-2\.0\) \| Apache-2\.0/); assert.match(notices, /rgbcolor \| [\d.]+ \| MIT OR SEE LICENSE IN FEEL-FREE\.md \| MIT/);
  const lr = licenseReport(ROOT); assert.equal(lr.ok, true, JSON.stringify(lr.problems)); assert.ok(lr.fonts.every(f => f.licenseFile)); assert.ok(Object.keys(ELECTIONS).length >= 3);
  assert.match(fs.readFileSync(path.join(ROOT, 'public/fonts/OFL-Andika.txt'), 'utf8'), /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.equal(noticesMarkdown(lr), noticesMarkdown(licenseReport(ROOT)), 'notificări deterministe');
  /* fresh install = the release folder + installed modules */
  inst = path.join(W, 'install'); fs.cpSync(A.folder, inst, { recursive: true }); fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(inst, 'node_modules'), 'dir');
  const sm = await smoke(inst); assert.equal(sm.ok, true, JSON.stringify(sm)); assert.equal(sm.projects, 0, 'instalare nouă: zero proiecte'); assert.equal(sm.health, 'ok');
  filesA = man.files.map(f => f.path).concat('RELEASE-MANIFEST.json');
});

test('P8-T03: actualizare peste instalarea existentă — config/date/preferințe neschimbate (hash-uri protejate), fișiere eliminate/adăugate, smoke, revenire manuală completă', async () => {
  fs.writeFileSync(path.join(inst, '.env'), 'PORT=4321\nSTORAGE=local\n'); fs.mkdirSync(path.join(inst, 'data/projects/p1'), { recursive: true });
  fs.writeFileSync(path.join(inst, 'data/settings.json'), '{"outputDir":"D:\\\\Carti"}'); fs.writeFileSync(path.join(inst, 'data/agents.json'), '{"scriitor":{"persona":"a mea"}}'); fs.writeFileSync(path.join(inst, 'data/projects/p1/project.json'), '{"id":"p1"}');
  const prot0 = protectedHashes(inst); assert.ok(Object.keys(prot0).length >= 4);
  const srcB = source('srcB', d => { fs.appendFileSync(path.join(d, 'server/ops/health.js'), '\n// versiunea B\n'); fs.writeFileSync(path.join(d, 'docs/NOU-B.md'), '# nou\n'); fs.rmSync(path.join(d, 'docs/enterprise/contracts/LAYOUT.md'));
    const pk = JSON.parse(fs.readFileSync(path.join(d, 'package.json'))); const lk = JSON.parse(fs.readFileSync(path.join(d, 'package-lock.json'))); pk.version = lk.version = lk.packages[''].version = '19.4.1';
    fs.writeFileSync(path.join(d, 'package.json'), JSON.stringify(pk, null, 2)); fs.writeFileSync(path.join(d, 'package-lock.json'), JSON.stringify(lk, null, 2)); });
  B = await release(srcB, path.join(W, 'outB'));
  const r = await upgrade({ install: inst, release: B.zip }); assert.equal(r.ok, true); assert.equal(r.from, '19.4.0'); assert.equal(r.to, '19.4.1'); assert.equal(r.smoke.projects, 0);
  assert.ok(fs.existsSync(path.join(inst, 'docs/NOU-B.md'))); assert.ok(!fs.existsSync(path.join(inst, 'docs/enterprise/contracts/LAYOUT.md')), 'fișierul eliminat din versiune nu rămâne');
  assert.match(fs.readFileSync(path.join(inst, 'server/ops/health.js'), 'utf8'), /versiunea B/);
  assert.deepEqual(protectedHashes(inst), prot0, '.env, data/ (setări, agenți, proiecte) neschimbate');
  const rb = rollback(inst); assert.equal(rb.ok, true); assert.equal(rb.version, '19.4.0');
  assert.deepEqual(tree(inst, filesA), tree(A.folder, filesA), 'revenirea reface exact versiunea anterioară'); assert.ok(!fs.existsSync(path.join(inst, 'docs/NOU-B.md')));
  assert.deepEqual(protectedHashes(inst), prot0);
});

test('P8-T03: pornirea eșuată → revenire automată verificată; actualizarea întreruptă se anulează la reluare; versiune coruptă, poartă netrecută și dependențe schimbate sunt refuzate fără nicio schimbare', async () => {
  const prot0 = protectedHashes(inst), before = tree(inst, filesA);
  const srcC = source('srcC', d => fs.writeFileSync(path.join(d, 'server/start.js'), "throw new Error('pornire imposibilă în versiunea C');\n"));
  const C = await release(srcC, path.join(W, 'outC'));
  await assert.rejects(upgrade({ install: inst, release: C.folder }), e => e.code === 'smoke_failed' && e.rolledBack === true && /start/.test(e.message));
  assert.deepEqual(tree(inst, filesA), before, 'migrare/pornire eșuată → versiunea anterioară refăcută'); assert.deepEqual(protectedHashes(inst), prot0);
  await assert.rejects(upgrade({ install: inst, release: B.folder, faultAt: 'mid-copy' }), e => e.code === 'upgrade_interrupted');
  assert.notDeepEqual(tree(inst, filesA), before, 'starea parțială există înainte de reluare');
  const rec = recoverUpgrade(inst); assert.equal(rec.recovered, true); assert.deepEqual(tree(inst, filesA), before);
  const bad = path.join(W, 'outB-corrupt'); fs.cpSync(B.folder, bad, { recursive: true }); fs.appendFileSync(path.join(bad, 'server/index.js'), '\n// modificat\n');
  assert.throws(() => verifyRelease(bad), e => e.code === 'release_corrupt' && e.files.includes('server/index.js'));
  const inc = path.join(W, 'outB-incomplete'); fs.cpSync(B.folder, inc, { recursive: true }); const ev = JSON.parse(fs.readFileSync(path.join(inc, 'RELEASE-EVIDENCE.json'))); ev.status = 'INCOMPLETE'; ev.ok = false; fs.writeFileSync(path.join(inc, 'RELEASE-EVIDENCE.json'), JSON.stringify(ev));
  const m = JSON.parse(fs.readFileSync(path.join(inc, 'RELEASE-MANIFEST.json'))); m.files.find(f => f.path === 'RELEASE-EVIDENCE.json').sha256 = sha(fs.readFileSync(path.join(inc, 'RELEASE-EVIDENCE.json'))); fs.writeFileSync(path.join(inc, 'RELEASE-MANIFEST.json'), JSON.stringify(m));
  assert.throws(() => verifyRelease(inc), e => e.code === 'gate_not_passed');
  const srcD = source('srcD', d => { const lk = JSON.parse(fs.readFileSync(path.join(d, 'package-lock.json'))); lk.packages['node_modules/qrcode'].version = '9.9.9'; fs.writeFileSync(path.join(d, 'package-lock.json'), JSON.stringify(lk, null, 2)); });
  const D = await release(srcD, path.join(W, 'outD'));
  await assert.rejects(upgrade({ install: inst, release: D.folder }), e => e.code === 'dependencies_changed' && !e.rolledBack);
  assert.deepEqual(tree(inst, filesA), before, 'refuzul nu schimbă nimic'); assert.deepEqual(protectedHashes(inst), prot0);
});

test('P8-T03: calea lungă de ieșire este refuzată înainte de livrare, cu limita explicită', async () => {
  const limit = 259, short = outputPathCheck('C:/Carti', limit), long = outputPathCheck('/' + 'a'.repeat(120), limit);
  assert.equal(short.ok, true); assert.equal(long.ok, false); assert.match(long.message, /cel mult \d+ caractere/); assert.equal(long.maxFolderLength, limit - long.reserve);
  assert.deepEqual(longPaths(['/x/' + 'b'.repeat(300), '/x/scurt'], limit).map(x => x.length), [303]);
  const r = await api('PUT', 'settings/output', { dir: path.join(os.tmpdir(), 'wp-' + 'f'.repeat(5000)) }); assert.equal(r.status, 400); assert.equal(r.body.code, 'path_too_long');
  const d = await api('GET', 'diagnostic'); assert.ok(d.body.checks.some(c => c.name === 'Lungimea căilor de livrare' && c.ok));
});

test('P8-T03: statut comercial pe dovezi, specific destinației — drepturi necunoscute, export doar-sursă, chitanță învechită', () => {
  const base = { id: 'rc1', volume: 1, preset: 'kdp', state: 'verified', snapshot: { hash: 'S1' }, receipts: [{ book: 'story', lang: 'first', sha256: 'f1' }], rights: { eligible: true, blockers: [] }, proof: { digital: 'not_applicable', print: 'pending', receipt: null }, history: [] };
  const ok = { ok: true, problems: [], snapshotHash: 'S1' };
  const pending = commercialStatus(base, { verification: ok }); assert.equal(pending.status, 'not_eligible'); assert.deepEqual(pending.reasons.map(r => r.code), ['PROOF_PENDING']);
  assert.deepEqual(pending.otherDestinations, { digital: 'not_evaluated', print: 'not_evaluated' }, 'un candidat vorbește doar pentru destinația lui');
  const proved = recordProof(base, { status: 'accepted', receipt: { reference: 'KDP-PROOF-123' } }); assert.equal(proved.proof.receipt.snapshotHash, 'S1');
  const elig = commercialStatus(proved, { verification: ok }); assert.equal(elig.status, 'eligible'); assert.ok(elig.limitations[0].includes('nu este consultanță juridică'));
  const stale = commercialStatus(proved, { verification: { ok: false, problems: [{ code: 'STALE_APPROVAL', message: 'x' }], snapshotHash: 'S2' } });
  assert.deepEqual(stale.reasons.map(r => r.code), ['VERIFICATION_FAILED', 'PROOF_STALE'], 'chitanța pentru alt conținut nu mai contează');
  const unknown = commercialStatus({ ...proved, rights: null }, { verification: { ok: false, problems: [{ code: 'RIGHTS_UNKNOWN', message: 'Registrul drepturilor nu a fost evaluat.' }], snapshotHash: 'S1' } });
  assert.equal(unknown.status, 'blocked_rights'); assert.equal(unknown.reasons[0].code, 'RIGHTS_UNKNOWN');
  const src = commercialStatus(proved, { verification: ok, exportKind: 'source' }); assert.equal(src.status, 'not_eligible'); assert.ok(src.reasons.some(r => r.code === 'SOURCE_ONLY'));
  const legacy = commercialStatus({ ...proved, proof: { ...proved.proof, receipt: { reference: 'vechi' } } }, { verification: ok }); assert.ok(legacy.reasons.some(r => r.code === 'PROOF_STALE'), 'o chitanță fără legătură cu conținutul nu este dovadă');
  const dig = commercialStatus({ ...base, preset: 'digital', proof: { digital: 'validated', print: 'not_applicable', receipt: null } }, { verification: ok }); assert.equal(dig.status, 'eligible');
  const notExp = commercialStatus({ ...base, preset: 'digital', state: 'approved', proof: { digital: 'validated', print: 'not_applicable', receipt: null } }, { verification: ok }); assert.ok(notExp.reasons.some(r => r.code === 'NOT_EXPORTED'));
});

test.after(() => fs.rmSync(W, { recursive: true, force: true }));
