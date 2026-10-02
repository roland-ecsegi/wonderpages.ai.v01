// TEST-P7-T05 — suita lipsă din copie, cod schimbat după analiză, scriere în node_modules comun, verificare eșuată,
// aplicare întreruptă și rollback de reguli: nicio suită absentă trecută, niciun patch învechit; izolarea scrierilor;
// rollback coerent cod + reguli. Totul pe directoare temporare (aplicația reală nu este atinsă).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './lib.mjs';
import { suite, treeHash, verifyBase, fileHashes, modulesSignature, applyJournaled, recoverJournal, classifyIncident, runChecks } from '../server/improve.js';
import { modelBinding, loadContracts } from '../server/agents-runtime/registry.js';
import { LocalStorage } from '../server/storage/local.js';
import * as Learning from '../server/learning.js';
import * as K from '../server/knowledge/store.js';
import * as Training from '../server/training.js';

const tmp = p => fs.mkdtempSync(path.join(os.tmpdir(), p));
const write = (root, rel, data) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), data); };

test('P7-T05: suita de teste absentă din copie NU este o verificare trecută', async () => {
  const d = tmp('wp-ci-'); const r = await suite(d); assert.equal(r.ok, false); assert.match(r.detail, /absentă nu este o verificare trecută/);
  fs.rmSync(d, { recursive: true, force: true });
});

test('P7-T05: codul schimbat după analiză face propunerea/patch-ul învechite (hash de bază)', async () => {
  const live = tmp('wp-live-'); write(live, 'server/a.js', 'export const a = 1;\n'); write(live, 'server/b.js', 'export const b = 1;\n');
  const h0 = await treeHash(live), base = await fileHashes(live, ['server/a.js']);
  assert.equal(await treeHash(live), h0, 'determinist');
  write(live, 'server/b.js', 'export const b = 2;\n'); assert.notEqual(await treeHash(live), h0, 'analiza este învechită');
  assert.equal((await verifyBase(live, [{ file: 'server/a.js', type: 'modified' }], base)).ok, true);
  write(live, 'server/a.js', 'export const a = 99;\n'); const v = await verifyBase(live, [{ file: 'server/a.js', type: 'modified' }], base); assert.equal(v.ok, false); assert.deepEqual(v.stale, ['server/a.js']);
  write(live, 'server/new.js', 'x'); assert.equal((await verifyBase(live, [{ file: 'server/new.js', type: 'added' }], {})).ok, false, 'un fișier „adăugat” care între timp există');
  fs.rmSync(live, { recursive: true, force: true });
});

test('P7-T05: o scriere în node_modules comun este detectată; fișierele protejate și sintaxa greșită pică verificările', async () => {
  const root = tmp('wp-nm-'); write(root, 'node_modules/pg/package.json', '{"name":"pg","version":"8.23.0"}'); write(root, 'node_modules/jspdf/package.json', '{"name":"jspdf"}');
  const s0 = await modulesSignature(root); write(root, 'node_modules/pg/package.json', '{"name":"pg","version":"6.6.6"}'); assert.notEqual((await modulesSignature(root)).hash, s0.hash);
  const wd = tmp('wp-wd-'); write(wd, 'server/ok.js', 'export const x = 1;\n'); write(wd, 'server/bad.js', 'const x = ;\n'); write(wd, 'public/app/a.js', 'const a = 1;\n'); write(wd, 'public/login.js', ''); write(wd, 'public/index.html', '<html></html>'); write(wd, 'package.json', '{}');
  const checks = runChecks(wd, [{ file: 'server/bad.js', type: 'added' }, { file: 'package.json', type: 'modified' }]);
  assert.ok(checks.some(c => c.name === 'server/bad.js' && !c.ok)); assert.ok(checks.some(c => c.name === 'Fișiere protejate' && !c.ok && /package\.json/.test(c.detail)));
  assert.match(fs.readFileSync(path.join(ROOT, 'server/improve.js'), 'utf8'), /no link to the shared modules while the engineer edits/, 'copia nu are legătura la node_modules în timpul editării');
  fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(wd, { recursive: true, force: true });
});

test('P7-T05: aplicarea întreruptă se anulează complet la repornire (jurnal + backup)', async () => {
  const live = tmp('wp-ap-'), work = tmp('wp-apw-'), bk = path.join(tmp('wp-apb-'), 'backup'), jp = path.join(tmp('wp-apj-'), 'journal.json');
  write(live, 'server/a.js', 'A0'); write(live, 'server/b.js', 'B0'); write(work, 'server/a.js', 'A1'); write(work, 'server/b.js', 'B1'); write(work, 'server/c.js', 'C1');
  const changes = [{ file: 'server/a.js', type: 'modified' }, { file: 'server/c.js', type: 'added' }, { file: 'server/b.js', type: 'modified' }];
  await assert.rejects(applyJournaled({ liveRoot: live, workRoot: work, backupRoot: bk, journalPath: jp, changes, failAfter: 2 }), e => e.code === 'interrupted');
  assert.equal(fs.readFileSync(path.join(live, 'server/a.js'), 'utf8'), 'A1', 'starea parțială există înainte de recuperare'); assert.equal(JSON.parse(fs.readFileSync(jp, 'utf8')).state, 'applying');
  const r = await recoverJournal({ liveRoot: live, backupRoot: bk, journalPath: jp }); assert.equal(r.recovered, true);
  assert.equal(fs.readFileSync(path.join(live, 'server/a.js'), 'utf8'), 'A0'); assert.equal(fs.readFileSync(path.join(live, 'server/b.js'), 'utf8'), 'B0'); assert.equal(fs.existsSync(path.join(live, 'server/c.js')), false);
  assert.equal((await recoverJournal({ liveRoot: live, backupRoot: bk, journalPath: jp })).recovered, false, 'idempotent');
  const ok = await applyJournaled({ liveRoot: live, workRoot: work, backupRoot: bk, journalPath: jp, changes }); assert.equal(ok.applied, 3); assert.equal(JSON.parse(fs.readFileSync(jp, 'utf8')).state, 'applied');
});

test('P7-T05: regulile unei îmbunătățiri urmează promovarea; anularea îmbunătățirii revocă regulile (cod + reguli coerente)', async () => {
  const d = tmp('wp-ir-'), s = new LocalStorage(d); await s.init(); await Learning.initLearning(s, async () => ({})); await K.initKnowledgeStore(s); await Training.initTraining(s, Learning);
  const src = await K.registerSource({ kind: 'improvement', ref: 'imp1', label: 'Îmbunătățire' }); const [c] = await K.addCandidates(src.id, [{ type: 'lesson', agent: 'scriitor', text: 'Name the speaker when two friends talk.', scope: 'project' }]);
  assert.equal(c.status, 'candidate'); assert.equal(Learning.listLessons().filter(l => l.status === 'active' && l.text === c.text).length, 0, 'nu devine activă direct');
  await K.promoteCandidate(c.id, x => Training.applyCandidate(x, { pid: 'p1' })); assert.equal(Learning.listLessons().filter(l => l.status === 'active' && l.text === c.text).length, 1);
  await K.revokeSource(src.id, Training.revokeDerived, 'îmbunătățire anulată'); assert.equal(Learning.listLessons().filter(l => l.status === 'active' && l.text === c.text).length, 0);
  const code = fs.readFileSync(path.join(ROOT, 'server/improve.js'), 'utf8'); assert.match(code, /kind: 'improvement'/); assert.match(code, /code and rules roll back together/); assert.doesNotMatch(code, /addManualLesson\(\{ agent: r\.agent/);
  fs.rmSync(d, { recursive: true, force: true });
});

test('P7-T05: Inginerul rulează doar prin legarea permisă de carta lui (C29); RCA: conținutul se repară în carte, infrastructura nu rescrie povestea', () => {
  const role = loadContracts().roles.inginer; assert.equal(modelBinding({ model: 'sonnet' }, role).consistent, true); assert.equal(modelBinding({ model: 'gpt-6-sol' }, role).consistent, false);
  const code = fs.readFileSync(path.join(ROOT, 'server/improve.js'), 'utf8'); assert.doesNotMatch(code, /await runClaudeCode\(persona \+ prompt/); assert.match(code, /engineerBinding\(\); assertExecutable\('claude-code-text'\)/);
  assert.equal(classifyIncident({ title: 'Pagina 9: Tia ține frunza cu mâna', description: 'scena nu respectă anatomia' }).kind, 'content');
  const infra = classifyIncident({ title: 'Canva nu mai generează', description: 'token expirat, 401 unauthorized' }); assert.equal(infra.kind, 'infrastructure'); assert.match(infra.constraint, /nu se modifică poveștile/);
  assert.equal(classifyIncident({ title: 'Butonul de export PDF dă eroare', description: 'crash la export' }).kind, 'code');
});
