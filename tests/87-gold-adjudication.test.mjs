// Adjudecarea setului de aur: jurnal append-only înlănțuit prin hash (confirm / correct / exclude, cu proveniență),
// separat de fișierul setului și livrat cu release-ul; acceptarea calibrării este refuzată până când adjudecarea este
// completă și consecventă, iar rapoartele corespund setului și adjudecărilor curente. Adjudecarea completă NU este
// acceptare. Seturile din teste sunt construite din cazurile existente, fără ID sau număr de cazuri fixat în cod.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { api, ROOT } from './lib.mjs';
import { LocalStorage } from '../server/storage/local.js';
import { loadActiveGold, logFileFor, readLog, verifyChain, adjudicationState, makeEntry, appendEntry, acceptanceCheck, caseHash } from '../server/quality/adjudication.js';
import { runEvaluation, calibrationStatus, compareReports } from '../server/quality/evaluation.js';
import { createEvaluationService } from '../server/quality/evaluation-service.js';
import { adjudicate } from '../scripts/enterprise/gold-adjudicate.mjs';

const REAL_DIR = path.join(ROOT, 'evaluation/gold');
const REAL = loadActiveGold(REAL_DIR).gold;
const PROV = { statement: 'decizia operatorului (test)', recordedBy: 'test', channel: 'test' };

/* a small synthetic set from existing cases: calibration + holdout, positive + negative, a quality case */
function fixtureDir({ id = 'gold-test', version = 1 } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-adj-'));
  const pick = [REAL.cases.find(c => c.kind === 'safety' && c.label === 'positive' && c.split === 'calibration'), REAL.cases.find(c => c.kind === 'safety' && c.label === 'negative' && c.split === 'calibration'),
    REAL.cases.find(c => c.kind === 'quality' && c.label === 'negative' && c.split === 'calibration'), REAL.cases.find(c => c.split === 'holdout' && c.kind === 'safety')];
  const gold = { manifest: { ...structuredClone(REAL.manifest), id, version, caseCount: pick.length }, cases: structuredClone(pick) };
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(gold));
  return { dir, gold, log: logFileFor(dir, gold) };
}
const record = (F, caseId, decision, extra = {}) => { const { entries } = readLog(F.log); return appendEntry(F.log, makeEntry({ gold: F.gold, entries, caseId, decision, actor: 'operator', provenance: PROV, ...extra })); };
const adjudicateAll = F => { for (const c of F.gold.cases) record(F, c.id, 'confirm', { note: 'ok' }); };
const reportsFor = (F, state) => ({ calibration: runEvaluation(F.gold, { split: 'calibration', adjudication: state }), holdout: runEvaluation(F.gold, { split: 'holdout', adjudication: state }) });

test('ADJ: o decizie are cazul, eticheta propusă, verdictul sistemului, decizia, eticheta rezultată, nota, momentul, versiunea setului și proveniența', () => {
  const F = fixtureDir(), c = F.gold.cases[0], e = record(F, c.id, 'confirm', { note: 'inofensiv' });
  assert.equal(e.caseId, c.id); assert.deepEqual(e.proposed.label, c.label); assert.deepEqual(e.result, { label: c.label, expected: c.expected });
  assert.equal(e.system.evaluator, c.kind); assert.ok(['positive', 'negative'].includes(e.system.predicted)); assert.equal(e.decision, 'confirm'); assert.equal(e.note, 'inofensiv');
  assert.ok(Number.isFinite(e.at)); assert.equal(e.set.id, 'gold-test'); assert.equal(e.set.version, 1); assert.ok(e.set.goldHash && e.caseHash === caseHash(c));
  assert.equal(e.provenance.statement, PROV.statement); assert.equal(e.seq, 1); assert.equal(e.prevHash, null); assert.ok(e.hash);
  const st = adjudicationState(F.gold, readLog(F.log)); assert.equal(st.counts.adjudicated, 1); assert.equal(st.counts.pending, F.gold.cases.length - 1); assert.equal(st.complete, false);
  assert.equal(JSON.stringify(JSON.parse(fs.readFileSync(path.join(F.dir, 'gold-test.json'), 'utf8'))), JSON.stringify(F.gold), 'fișierul setului nu se modifică');
});

test('ADJ: corectura cere eticheta rezultată validă și diferită; excluderea și corectura cer notă; cazul necunoscut și proveniența lipsă sunt refuzate', () => {
  const F = fixtureDir(), [pos, neg] = F.gold.cases, { entries } = readLog(F.log), base = { gold: F.gold, entries, actor: 'operator', provenance: PROV };
  assert.throws(() => makeEntry({ ...base, caseId: 'nu-exista', decision: 'confirm' }), e => e.code === 'CASE_UNKNOWN');
  assert.throws(() => makeEntry({ ...base, caseId: pos.id, decision: 'aprob' }), e => e.code === 'DECISION_UNKNOWN');
  assert.throws(() => makeEntry({ ...base, caseId: pos.id, decision: 'correct', result: { label: pos.label, expected: pos.expected }, note: 'x y z' }), e => e.code === 'CORRECTION_SAME');
  assert.throws(() => makeEntry({ ...base, caseId: pos.id, decision: 'correct', result: { label: 'negative', expected: { altceva: 1 } }, note: 'x y z' }), e => e.code === 'CORRECTION_SHAPE');
  assert.throws(() => makeEntry({ ...base, caseId: pos.id, decision: 'correct', result: { label: 'negative', expected: { verdict: 'REVIEW' } } }), e => e.code === 'NOTE_REQUIRED');
  assert.throws(() => makeEntry({ ...base, caseId: neg.id, decision: 'exclude' }), e => e.code === 'NOTE_REQUIRED');
  assert.throws(() => makeEntry({ ...base, caseId: pos.id, decision: 'confirm', result: { label: 'negative' } }), e => e.code === 'CONFIRM_RESULT');
  assert.throws(() => makeEntry({ ...base, caseId: pos.id, decision: 'confirm', provenance: null }), e => e.code === 'PROVENANCE');
  const ok = makeEntry({ ...base, caseId: pos.id, decision: 'correct', result: { label: 'negative', expected: { verdict: 'REVIEW' } }, note: 'cere verificare' }); assert.equal(ok.result.label, 'negative');
  assert.throws(() => adjudicate('record', { dir: F.dir, case: pos.id, decision: 'confirm', statement: '' }), e => /declarația operatorului/.test(e.message), 'CLI: fără cuvintele operatorului nu se înregistrează nimic');
});

test('ADJ: append-only — o readjudecare păstrează istoricul; modificarea, ștergerea sau reordonarea unei intrări sunt detectate; o intrare construită pe un jurnal vechi este refuzată', () => {
  const F = fixtureDir(), [a, b] = F.gold.cases;
  const e1 = record(F, a.id, 'confirm', { note: 'prima' }); record(F, b.id, 'confirm'); const e3 = record(F, a.id, 'exclude', { note: 'm-am răzgândit' });
  let st = adjudicationState(F.gold, readLog(F.log)); assert.equal(st.effective[a.id].decision, 'exclude'); assert.equal(e3.supersedes, e1.hash); assert.equal(readLog(F.log).entries.length, 3, 'istoricul rămâne');
  const stale = makeEntry({ gold: F.gold, entries: readLog(F.log).entries.slice(0, 2), caseId: b.id, decision: 'confirm', actor: 'operator', provenance: PROV }); assert.throws(() => appendEntry(F.log, stale), e => e.code === 'CHAIN_STALE');
  const lines = fs.readFileSync(F.log, 'utf8').trim().split('\n');
  fs.writeFileSync(F.log, lines.map((l, i) => i === 0 ? l.replace('"prima"', '"altă notă"') : l).join('\n') + '\n');
  st = adjudicationState(F.gold, readLog(F.log)); assert.ok(st.inconsistencies.some(i => i.code === 'CHAIN_HASH')); assert.equal(st.complete, false);
  assert.throws(() => record(F, b.id, 'confirm'), e => e.code === 'CHAIN_BROKEN', 'nu se adaugă peste un jurnal alterat');
  fs.writeFileSync(F.log, [lines[0], lines[2]].join('\n') + '\n'); assert.ok(verifyChain(readLog(F.log).entries).errors.some(x => x.code === 'CHAIN_SEQUENCE'), 'ștergere detectată');
  fs.writeFileSync(F.log, [lines[1], lines[0], lines[2]].join('\n') + '\n'); assert.equal(verifyChain(readLog(F.log).entries).ok, false, 'reordonare detectată');
  fs.writeFileSync(F.log, lines.join('\n') + '\nnu este json\n'); assert.ok(adjudicationState(F.gold, readLog(F.log)).inconsistencies.some(i => i.code === 'LOG_UNPARSABLE'));
});

test('ADJ acceptare: refuzată cu cazuri neadjudecate, jurnal inconsecvent, raport pe altă versiune, set schimbat sau adjudecări schimbate după raport; acceptată doar când totul corespunde', () => {
  const F = fixtureDir(), note = 'am verificat fiecare caz și raportul';
  let st = adjudicationState(F.gold, readLog(F.log)), R = reportsFor(F, st);
  assert.ok(acceptanceCheck({ gold: F.gold, state: st, ...R, note }).reasons.some(r => r.code === 'ADJUDICATION_INCOMPLETE'));
  const early = reportsFor(F, st);   // reports generated BEFORE the adjudication is complete
  adjudicateAll(F); st = adjudicationState(F.gold, readLog(F.log)); assert.equal(st.complete, true);
  let chk = acceptanceCheck({ gold: F.gold, state: st, ...early, note }); assert.ok(chk.reasons.some(r => r.code === 'REPORT_STALE_ADJUDICATION'), JSON.stringify(chk.reasons));
  R = reportsFor(F, st); chk = acceptanceCheck({ gold: F.gold, state: st, ...R, note }); assert.equal(chk.ok, true, JSON.stringify(chk.reasons));
  assert.ok(acceptanceCheck({ gold: F.gold, state: st, ...R, note: 'scurt' }).reasons.some(r => r.code === 'NOTE_REQUIRED'));
  const other = structuredClone(F.gold); other.manifest.version = 2; const R2 = { calibration: runEvaluation(other, { split: 'calibration', adjudication: st }), holdout: R.holdout };
  assert.ok(acceptanceCheck({ gold: F.gold, state: st, ...R2, note }).reasons.some(r => r.code === 'REPORT_SET_MISMATCH'));
  /* the set content changes after the reports and the decisions */
  const changed = structuredClone(F.gold); changed.cases[0].input.text += ' Then they wave.';
  const st2 = adjudicationState(changed, readLog(F.log)); assert.ok(st2.inconsistencies.some(i => i.code === 'CASE_CHANGED')); assert.equal(st2.complete, false);
  chk = acceptanceCheck({ gold: changed, state: st2, ...R, note }); assert.ok(['ADJUDICATION_INCONSISTENT', 'REPORT_STALE_SET'].every(c => chk.reasons.some(r => r.code === c)), JSON.stringify(chk.reasons));
  /* a later re-adjudication makes the earlier reports stale */
  record(F, F.gold.cases[1].id, 'confirm', { note: 'reconfirm' }); const st3 = adjudicationState(F.gold, readLog(F.log));
  assert.ok(acceptanceCheck({ gold: F.gold, state: st3, ...R, note }).reasons.some(r => r.code === 'REPORT_STALE_ADJUDICATION'));
  assert.throws(() => compareReports(early.calibration, R.calibration), e => e.code === 'not_comparable', 'rapoarte pe adjudecări diferite nu se compară');
});

test('ADJ: eticheta corectată și excluderea intră în evaluare (dezacordul devine vizibil), fără nicio schimbare de regulă sau prag', () => {
  const F = fixtureDir(), [pos, neg] = F.gold.cases;
  record(F, pos.id, 'correct', { result: { label: 'negative', expected: { verdict: 'REVIEW' } }, note: 'operatorul cere verificare' }); record(F, neg.id, 'exclude', { note: 'neclar' });
  const st = adjudicationState(F.gold, readLog(F.log)), r = runEvaluation(F.gold, { split: 'calibration', adjudication: st });
  assert.ok(r.evaluators.safety.errors.some(e => e.id === pos.id && e.label === 'negative' && e.predicted === 'positive'), 'sistemul spune PASS, operatorul nu: dezacord raportat');
  assert.equal(r.dataset.evaluatedCases, F.gold.cases.length - 1, 'cazul exclus nu se mai evaluează'); assert.equal(r.dataset.caseCount, F.gold.cases.length);
  assert.equal(r.adjudicationState.hash, st.hash);
});

test('ADJ serviciu: adjudecarea completă NU înseamnă acceptare; acceptarea se leagă de adjudecări și devine învechită dacă ele se schimbă', async () => {
  const F = fixtureDir({ id: 'gold-svc', version: 3 }), work = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-adj-st-')), storage = new LocalStorage(work); await storage.init();
  const EV = createEvaluationService({ goldDir: F.dir, storage });
  assert.equal(EV.gold().manifest.id, 'gold-svc', 'setul activ se citește din director, fără nume fixat');
  let cal = await EV.run({ split: 'calibration' }), hold = await EV.run({ split: 'holdout' });
  await assert.rejects(EV.accept({ calibration: cal.id, holdout: hold.id, note: 'am verificat tot' }), e => e.status === 409 && e.code === 'ADJUDICATION_INCOMPLETE');
  adjudicateAll(F);
  let s = await EV.status(); assert.equal(s.adjudication.complete, true); assert.equal(s.thresholdsStatus, 'proposed'); assert.equal(s.acceptance, null, 'adjudecarea completă nu acceptă nimic');
  await assert.rejects(EV.accept({ calibration: cal.id, holdout: hold.id, note: 'am verificat tot' }), e => e.code === 'REPORT_STALE_ADJUDICATION', 'rapoartele vechi sunt refuzate');
  cal = await EV.run({ split: 'calibration' }); hold = await EV.run({ split: 'holdout' });
  const acc = await EV.accept({ calibration: cal.id, holdout: hold.id, note: 'am verificat fiecare caz și raportul' });
  assert.equal(acc.adjudicationHash, EV.adjudication().hash); assert.equal(acc.set.id, 'gold-svc');
  s = await EV.status(); assert.equal(s.thresholdsStatus, 'validated'); assert.equal(s.maturityClaimsAllowed, true);
  record(F, F.gold.cases[0].id, 'confirm', { note: 'reconfirm' });
  s = await EV.status(); assert.equal(s.thresholdsStatus, 'proposed', 'acceptarea veche nu mai acoperă adjudecările noi'); assert.ok(s.reasons.some(r => /trebuie reluată/.test(r)));
  assert.equal(calibrationStatus([cal, hold], { by: 'operator' }).thresholdsStatus, 'validated', 'compatibil: fără stare curentă, comportamentul anterior');
});

test('ADJ setul livrat: jurnalul real (dacă există) trece verificarea, se leagă de setul activ, iar acceptarea prin API este refuzată cât timp adjudecarea e incompletă', async () => {
  const log = logFileFor(REAL_DIR, REAL), parsed = readLog(log), st = adjudicationState(REAL, parsed);
  assert.deepEqual(parsed.errors, []); assert.equal(verifyChain(parsed.entries).ok, true, 'jurnalul livrat este intact');
  assert.deepEqual(st.inconsistencies, [], JSON.stringify(st.inconsistencies).slice(0, 400));
  assert.ok(parsed.entries.every(e => e.provenance?.statement && e.actor), 'fiecare decizie are declarația operatorului');
  const a = (await api('GET', 'evaluation/adjudication')).body; assert.equal(a.counts.required, REAL.cases.filter(c => !['operator_confirmed', 'operator_corrected'].includes(c.adjudication?.status)).length); assert.equal(a.counts.adjudicated, st.counts.adjudicated); assert.equal(a.hash, st.hash);
  const cal = (await api('POST', 'evaluation/run', { split: 'calibration' })).body, hold = (await api('POST', 'evaluation/run', { split: 'holdout' })).body;
  assert.equal(cal.adjudicationState.hash, st.hash);
  const r = await api('POST', 'evaluation/accept', { calibration: cal.id, holdout: hold.id, note: 'test: încercare de acceptare' });
  if (!st.complete) { assert.equal(r.status, 409); assert.equal(r.body.code, 'ADJUDICATION_INCOMPLETE'); assert.ok(r.body.errors.length); }
  assert.equal((await api('GET', 'evaluation/status')).body.thresholdsStatus, st.complete && r.status === 200 ? 'validated' : 'proposed');
});

test('ADJ release: jurnalul adjudecărilor este livrat (nu se repetă deciziile după instalare) și trece santinela de secrete', async () => {
  const { RELEASE_INCLUDE, shipped, secretSentinel } = await import('../scripts/enterprise/release-gate.mjs');
  const rel = path.relative(ROOT, logFileFor(REAL_DIR, REAL)).split(path.sep).join('/');
  assert.ok(RELEASE_INCLUDE.some(x => rel === x || rel.startsWith(x + '/')) && shipped(rel), `${rel} intră în pachet`);
  assert.deepEqual(secretSentinel(ROOT, ['evaluation']).hits, []);
});
