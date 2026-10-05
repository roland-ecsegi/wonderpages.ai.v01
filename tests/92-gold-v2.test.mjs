// HARDENING H5 — Gold-v2: versiune nouă, construită determinist din surse, set rezervat sigilat înainte de hardening,
// integritate (duplicate / contaminare / metadate), independență pe dimensiuni, cazuri fără etichetă pentru politici
// nedecise, evaluatori care verifică și motivele; garda de validare: adjudecare ≠ validare ≠ acceptare (§21).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { api, ROOT } from './lib.mjs';
import { assemble, OUT } from '../scripts/enterprise/gold-v2-build.mjs';
import { verifySeal } from '../scripts/enterprise/gold-v2-seal.mjs';
import { HOLDOUT } from '../evaluation/gold-v2-src/holdout.mjs';
import { integrity } from '../server/quality/gold-integrity.js';
import { validationState } from '../server/quality/validation.js';
import { runEvaluation, calibrationStatus, EVALUATOR_VERSION } from '../server/quality/evaluation.js';
import { loadActiveGold, logFileFor, readLog, adjudicationState, makeEntry } from '../server/quality/adjudication.js';
import { runRegistry } from '../server/quality/regression.js';

const GOLD2 = JSON.parse(fs.readFileSync(OUT, 'utf8')), GOLD1_FILE = path.join(ROOT, 'evaluation/gold/gold-v1.json');
const PROV = { statement: 'decizia operatorului (test)', recordedBy: 'test', channel: 'test' };

test('H5 Gold-v1 rămâne înghețat; Gold-v2 e o versiune nouă, setul activ, construită determinist din surse', () => {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(GOLD1_FILE)).digest('hex'), '603fa00aac029d3e4d1eabe9d29d182049d9984320a232457aa0ad05c9cee2db');
  assert.equal(loadActiveGold(path.join(ROOT, 'evaluation/gold')).gold.manifest.id, 'gold-v2');
  const a = assemble().gold, b = assemble().gold; assert.equal(JSON.stringify(a), JSON.stringify(b), 'aceleași surse → aceiași octeți');
  assert.equal(JSON.stringify(a, null, 1) + '\n', fs.readFileSync(OUT, 'utf8'), 'fișierul setului nu e editat de mână');
  assert.equal(GOLD2.manifest.schema, 'wonderpages.gold-set/2'); assert.ok(GOLD2.manifest.limitations.some(l => /același autor/.test(l)));
});

test('H5 setul rezervat e sigilat înainte de hardening; orice schimbare rupe sigiliul și validarea', () => {
  const v = verifySeal(); assert.equal(v.ok, true); assert.equal(GOLD2.manifest.holdoutSeal.hash, v.seal.hash); assert.equal(v.seal.count, GOLD2.cases.filter(c => c.split === 'holdout').length);
  const tampered = structuredClone(HOLDOUT); tampered[0].input.text += ' Then he waves.'; const t = verifySeal(tampered); assert.equal(t.ok, false); assert.equal(t.errors[0].code, 'SEAL_CASE_CHANGED');
  const g = structuredClone(GOLD2); g.cases.find(c => c.split === 'holdout').expected = { verdict: 'PASS' };
  assert.equal(validationState({ gold: g }).checks.find(c => c.code === 'HOLDOUT_SEALED').ok, false, 'o etichetă rescrisă în setul rezervat e detectată');
});

test('H5 integritate: fără duplicate accidentale sau contaminare; duplicatele, tema comună și contaminarea sunt prinse', () => {
  const i = integrity(GOLD2); assert.equal(i.ok, true, JSON.stringify(i.errors).slice(0, 300));
  assert.ok(i.duplicates.exact.every(d => d.intentional), 'același stimul doar în familii controlate, cu variabila declarată');
  const dup = structuredClone(GOLD2); const c = structuredClone(dup.cases[0]); c.id = 'dup-1'; c.pairGroup = null; c.variable = null; dup.cases.push(c);
  assert.ok(integrity(dup).errors.some(e => e.code === 'METADATA_ONLY_DUPLICATE' || e.code === 'ACCIDENTAL_DUPLICATE'));
  const leak = structuredClone(GOLD2); const h = leak.cases.find(x => x.split === 'holdout' && x.kind === 'safety'); h.theme = 'forest'; h.input.text = leak.cases.find(x => x.split === 'calibration' && x.kind === 'safety').input.text + ' Again.';
  const li = integrity(leak); assert.ok(li.errors.some(e => e.code === 'HOLDOUT_THEME_SHARED') && li.errors.some(e => e.code === 'HOLDOUT_CONTAMINATION'));
});

test('H5 metadate: proprietatea testată, sursa etichetei, roluri, proveniență; fără etichetă ⇔ OPERATOR_DECISION_REQUIRED; independența pe dimensiuni', () => {
  for (const c of GOLD2.cases) { assert.ok(c.property && c.labelSource?.type && c.provenance?.author && c.roles?.length, c.id); assert.equal(c.label == null, c.labelSource.type === 'OPERATOR_DECISION_REQUIRED', c.id); assert.equal(c.adjudication.status, 'pending_operator_review'); }
  const cov = GOLD2.manifest.coverage; assert.ok(cov.raw > cov.uniqueStimuli - 1 && cov.independentStimuli < cov.uniqueStimuli, 'numărul brut ≠ stimuli unici ≠ observații independente'); assert.ok(cov.unlabeled > 0 && cov.roles.minimal_pair > 0 && cov.roles.boundary > 0 && cov.roles.regression > 0);
  const ind = integrity(GOLD2).independence; assert.ok(Object.values(ind).every(x => x.theme === true), 'tema rezervată absentă din calibrare'); assert.ok(Object.values(ind).some(x => x.ruleFamily === false), 'independența de familie de reguli e raportată onest (nu presupusă)');
  for (const k of ['safety', 'age', 'localization', 'science', 'quality']) for (const sp of ['calibration', 'holdout']) assert.ok(GOLD2.cases.some(c => c.kind === k && c.split === sp), `${k}/${sp}`);
  assert.ok(GOLD2.cases.some(c => c.language === 'Romanian' && c.kind === 'age') && ['3-4', '5-6', '7-8'].every(a => GOLD2.cases.some(c => c.kind === 'age' && c.age === a)), 'vârsta: RO și toate benzile');
});

test('H5 adjudecare: un caz fără etichetă nu se poate „confirma”; operatorul îi dă eticheta prin „correct”; cazurile fără etichetă nu se punctează', () => {
  const u = GOLD2.cases.find(c => c.label == null && c.kind === 'safety');
  assert.throws(() => makeEntry({ gold: GOLD2, entries: [], caseId: u.id, decision: 'confirm', actor: 'operator', provenance: PROV }), e => e.code === 'LABEL_REQUIRED');
  const e = makeEntry({ gold: GOLD2, entries: [], caseId: u.id, decision: 'correct', result: { label: 'negative', expected: { verdict: 'REVIEW' } }, note: 'politica decisă de operator (test)', actor: 'operator', provenance: PROV });
  assert.equal(e.result.label, 'negative');
  const r = runEvaluation(GOLD2, { split: 'calibration' }); assert.equal(r.versions.evaluator, EVALUATOR_VERSION); assert.equal(EVALUATOR_VERSION, 2); assert.equal(r.unlabeled.length, GOLD2.cases.filter(c => c.split === 'calibration' && c.label == null).length);
  const after = adjudicationState(GOLD2, { entries: [e] }); assert.equal(after.counts.correct, 1);
});

test('H5 evaluatorii v2 verifică verdictul ȘI motivele așteptate (raționamentul se măsoară automat)', () => {
  const pick = id => GOLD2.cases.find(c => c.id === id);
  const one = (c, mut) => { const x = structuredClone(c); mut(x); return runEvaluation({ manifest: GOLD2.manifest, cases: [x] }, { split: 'all' }).evaluators[x.kind]; };
  assert.equal(one(pick('v2c-safety-fire-01'), () => {}).exactAgreement, 1);
  assert.equal(one(pick('v2c-safety-fire-01'), x => { x.expected.rules = ['stranger']; }).exactAgreement, 0, 'verdict corect, motiv greșit ≠ acord exact');
  assert.equal(one(pick('v2c-quality-11'), () => {}).exactAgreement, 1, 'ambele motive (media + critic) sunt raportate');
});

test('H5 regresie gold-v1: acordul adjudecat se păstrează după hardening (ambele politici); registrul de probe trece', () => {
  const g1 = JSON.parse(fs.readFileSync(GOLD1_FILE, 'utf8')), st = adjudicationState(g1, readLog(logFileFor(path.join(ROOT, 'evaluation/gold'), g1)));
  assert.equal(st.complete, true);
  const v2 = runEvaluation(g1, { split: 'all', policy: 2, adjudication: st }); for (const [k, e] of Object.entries(v2.evaluators)) assert.equal(e.accuracy, 1, k);
  const v1 = runEvaluation(g1, { split: 'all', policy: 1, adjudication: st }); assert.equal(v1.evaluators.quality.errors.length, 4, 'v1: dezacordul de politică pe 40, 41, 42, 44 (nu defect)');
  const reg = runRegistry(); assert.equal(reg.ok, true, JSON.stringify(reg.failing)); assert.ok(reg.tracked >= 60 && reg.untracked >= 19);
});

test('H5 garda de validare (§21): gold-v1 nu poate fi validat; gold-v2 e NOT_COMPLETE până la adjudecare + rapoarte; acceptarea e refuzată; stările sunt separate', async () => {
  const g1 = JSON.parse(fs.readFileSync(GOLD1_FILE, 'utf8'));
  assert.deepEqual(validationState({ gold: g1 }).failing, ['VALIDATION_NOT_DEFINED']);
  const v = (await api('GET', 'evaluation/validation')).body; assert.equal(v.status, 'NOT_COMPLETE'); assert.ok(['ADJUDICATION_COMPLETE', 'NO_UNLABELED', 'HOLDOUT_EVALUATED'].every(c => v.failing.includes(c)), JSON.stringify(v.failing));
  assert.equal(v.checks.find(c => c.code === 'HOLDOUT_SEALED').ok, true); assert.equal(v.checks.find(c => c.code === 'INTEGRITY_CLEAN').ok, true); assert.equal(v.checks.find(c => c.code === 'REGRESSION_REGISTRY').ok, true);
  const cal = (await api('POST', 'evaluation/run', { split: 'calibration' })).body, hold = (await api('POST', 'evaluation/run', { split: 'holdout' })).body;
  const r = await api('POST', 'evaluation/accept', { calibration: cal.id, holdout: hold.id, note: 'test: încercare de acceptare a gold-v2' });
  assert.equal(r.status, 409); const codes = r.body.errors.map(e => e.code); assert.ok(codes.includes('ADJUDICATION_INCOMPLETE') && codes.includes('VALIDATION_INCOMPLETE'), JSON.stringify(codes));
  const s = (await api('GET', 'evaluation/status')).body; assert.deepEqual(s.phases, { adjudicationComplete: false, validationComplete: false, acceptancePerformed: false, acceptanceStale: false }); assert.equal(s.thresholdsStatus, 'proposed');
  const stale = calibrationStatus([cal, hold], { validationHash: 'vechi', evaluatorVersion: 1, adjudicationHash: 'x', goldHash: 'y' }, { validation: { complete: true, failing: [], hash: 'nou' } });
  assert.ok(stale.reasons.some(x => /trebuie reluată/.test(x)), 'o schimbare de evaluator sau de validare invalidează acceptarea');
});
