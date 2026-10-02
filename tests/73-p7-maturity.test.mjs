// TEST-P7-T04 — prag atins / neatins, cohortă nesuportată, reproductibilitate pe două rulări, schimbarea modelului,
// recuperare de la alt rol și dovezi lipsă: maturitate cu eșantioane/referințe/limitări; dovezi insuficiente = nedovedit;
// retrogradare/re-testare versionate fără pierderea istoricului.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { api } from './lib.mjs';
import { LocalStorage } from '../server/storage/local.js';
import * as X from '../server/knowledge/experience.js';
import { loadContracts } from '../server/agents-runtime/registry.js';

const roles = loadContracts().roles, ctx = { roles, ageBands: ['3-4', '5-6', '7-8'], languages: ['English', 'Romanian'] };
const B1 = { provider: 'claude-code', model: 'sonnet' }, B2 = { provider: 'codex', model: 'gpt-6-sol' };
/* a full evaluation set: 3 ages × 3 themes (+ reserved theme), negative and safety cases, run twice */
function evalSet({ binding = B1, runs = ['r1', 'r2'], score = 8.6, version = 'v1', critical = false, themes = ['forest', 'sea', 'city'], extra = {} } = {}) {
  const out = [];
  for (const runId of runs) for (const age of ['3-4', '5-6', '7-8']) for (const theme of themes) out.push({ agent: 'scriitor', skill: 'narrative-causality', cohort: { age, theme, language: 'English' }, caseId: `${age}-${theme}`, runId, binding, version, testRefs: [`gold-v1:${age}-${theme}`], result: { contractPass: true, score, criticalDefect: critical && age === '5-6', causalDiagnosis: true, explained: true }, ...extra });
  out.push({ agent: 'scriitor', skill: 'narrative-causality', cohort: { age: '3-4', theme: 'forest' }, caseId: 'neg-1', runId: runs[0], binding, version, testRefs: ['gold-v1:neg-1'], negativeCase: true, result: { contractPass: true, score: 9 } });
  out.push({ agent: 'scriitor', skill: 'narrative-causality', cohort: { age: '5-6', theme: 'sea' }, caseId: 'saf-1', runId: runs[0], binding, version, testRefs: ['gold-v1:saf-1'], safetyCase: true, result: { contractPass: true, safetyBlocked: true, score: 9 } });
  return out;
}
const run = (records, o = {}) => X.assess({ agent: 'scriitor', skill: 'narrative-causality', records, binding: B1, calibrated: true, ...o });

test('P7-T04: pragul atins → Senior (calibrat); neatins → nedovedit cu motivele; necalibrat → rămâne nedovedit', () => {
  const ok = run(evalSet()); assert.equal(ok.criteriaMet, 'senior'); assert.equal(ok.status, 'senior'); assert.ok(ok.counts.records >= 18 && ok.testRefs.length >= 9); assert.ok(ok.limitations.length);
  assert.ok(ok.reasons.some(r => /tema rezervată/.test(r)) && ok.reasons.some(r => /reparație/.test(r)), 'Principal cere transfer și reparație');
  const low = run(evalSet({ score: 7.2 })); assert.equal(low.status, 'unproven'); assert.ok(low.reasons.some(r => /Scor median 7.2/.test(r)));
  const crit = run(evalSet({ critical: true })); assert.equal(crit.status, 'unproven'); assert.ok(crit.reasons.some(r => /defecte critice/.test(r)));
  const two = run(evalSet({ themes: ['forest', 'sea'] })); assert.ok(two.reasons.some(r => /2 teme distincte/.test(r)));
  const pend = run(evalSet(), { calibrated: false }); assert.equal(pend.status, 'unproven'); assert.equal(pend.pendingCalibration, true); assert.ok(pend.limitations.some(l => /nu sunt încă calibrate/.test(l)));
  const prin = run([...evalSet({ themes: ['forest', 'sea', 'space'] }), ...evalSet({ runs: ['r3'], version: 'v2', themes: ['forest'] }), { agent: 'scriitor', skill: 'narrative-causality', cohort: { age: '3-4', theme: 'forest' }, caseId: 'rep-1', runId: 'r1', binding: B1, version: 'v1', kind: 'repair', testRefs: ['rep-1'], result: { contractPass: true, score: 9, noRegression: true } }]);
  assert.equal(prin.status, 'principal', JSON.stringify(prin.reasons));
});

test('P7-T04: o singură rulare nu ajunge; două rulări comparabile, deterministe; evaluarea este reproductibilă', () => {
  const one = run(evalSet({ runs: ['r1'] })); assert.ok(one.reasons.some(r => /rulări comparabile/.test(r)));
  const disagree = evalSet(); disagree.filter(r => r.runId === 'r2').slice(0, 4).forEach(r => { r.result = { ...r.result, contractPass: false }; });
  assert.ok(run(disagree).reasons.some(r => /rulări comparabile/.test(r)), 'rulările care nu concordă nu sunt comparabile');
  assert.equal(run(evalSet()).hash, run(evalSet()).hash, 'aceleași dovezi → același rezultat');
});

test('P7-T04: cohortă nesuportată, dovezi lipsă și rolul greșit sunt refuzate; experiența rămâne privată rolului', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-xp-')), s = new LocalStorage(dir); await s.init(); await X.initExperience(s);
  const base = evalSet()[0];
  const r = await X.addRecords([{ ...base, cohort: { age: '9-10', theme: 'forest' } }, { ...base, testRefs: [] }, { ...base, agent: 'director-artistic' }, { ...base, cohort: { age: '3-4', theme: 'x', language: 'Klingon' } }, base], ctx);
  assert.equal(r.added.length, 1); assert.deepEqual(r.rejected.map(x => x.errors[0].code), ['UNSUPPORTED_COHORT', 'MISSING_EVIDENCE', 'WRONG_ROLE', 'UNSUPPORTED_COHORT']);
  assert.equal(X.experienceFor('scriitor', 'narrative-causality', ctx).length, 1);
  assert.throws(() => X.experienceFor('director-artistic', 'narrative-causality', ctx), e => e.code === 'role_privacy');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P7-T04: schimbarea modelului nu transferă calificarea (de reevaluat); identitatea și istoricul rămân; retrogradare versionată', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-xp-')), s = new LocalStorage(dir); await s.init(); await X.initExperience(s);
  const set = evalSet(); assert.equal(run(set).status, 'senior');
  const swapped = X.assess({ agent: 'scriitor', skill: 'narrative-causality', records: set, binding: B2, calibrated: true }); assert.equal(swapped.status, 'requires_reevaluation'); assert.match(swapped.reasons[0], /nu se transferă/);
  const both = [...set, ...evalSet({ binding: B2 })]; assert.equal(X.assess({ agent: 'scriitor', skill: 'narrative-causality', records: both, binding: B2, calibrated: true }).status, 'senior', 'după re-testare pe noul model');
  const a1 = await X.recordAssessment(run(set)); const a2 = await X.recordAssessment(run([...set, ...evalSet({ runs: ['r9'], critical: true })]));
  assert.equal(a1.version, 1); assert.equal(a2.version, 2); assert.equal(a2.change, 'downgrade'); assert.equal(a2.previous.status, 'senior');
  assert.equal(X.assessments('scriitor', 'narrative-causality').length, 2, 'istoricul nu se pierde'); assert.equal((await X.recordAssessment(run([...set, ...evalSet({ runs: ['r9'], critical: true })]))).unchanged, true);
  assert.equal(run([]).status, 'unproven'); assert.match(run([]).reasons[0], /Nicio dovadă/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P7-T04 API: niciun agent nu are maturitate fără dovezi (inclusiv DW: P7 nu pretinde Principal); înregistrările greșite sunt refuzate; rolul străin primește 403', async () => {
  for (const id of ['scriitor', 'director-artistic', 'editor-critic']) { const m = (await api('GET', `agents/${id}/maturity`)).body; assert.ok(m.skills.length); assert.ok(m.skills.every(x => ['unproven', 'requires_reevaluation'].includes(x.current.status)), id); }
  const bad = await api('POST', 'agents/experience', { records: [{ agent: 'scriitor', skill: 'composition-planning', caseId: 'c', runId: 'r', binding: B1, testRefs: ['t'], result: {} }] }); assert.equal(bad.status, 200); assert.equal(bad.body.added, 0); assert.equal(bad.body.rejected[0].errors[0].code, 'WRONG_ROLE');
  assert.equal((await api('GET', 'agents/director-artistic/experience/narrative-causality')).status, 403);
  assert.equal((await api('POST', 'agents/scriitor/maturity/composition-planning/assess')).status, 403);
  const a = await api('POST', 'agents/scriitor/maturity/narrative-causality/assess'); assert.equal(a.status, 200); assert.equal(a.body.status, 'unproven');
});
