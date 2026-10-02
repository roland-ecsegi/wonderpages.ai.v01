// TEST-P7-T03 — recompensă pentru aprobare după reparație, scurgere în setul de test din același caz, confuzie de
// versiune provider/prompt, transfer negativ și rollback: raport cu dovezi potrivite, eșantioane, limitări; acuratețea
// pe antrenare nu este numită generalizare; lecția dăunătoare marcată pentru revizuire.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { api, ROOT } from './lib.mjs';
import { LocalStorage } from '../server/storage/local.js';
import * as Learning from '../server/learning.js';
import * as K from '../server/knowledge/store.js';
import * as G from '../server/knowledge/governance.js';
import { outcomeOf, groupedCv, variantReport, lessonEffect, baselineAfter, cohortKey } from '../server/knowledge/effectiveness.js';
import { volumeMetrics } from '../server/domain/story-contracts.js';
import { readZip } from '../server/security/safe-zip.js';

async function setup() { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-ke-')), s = new LocalStorage(dir); await s.init(); await Learning.initLearning(s, async () => ({})); await K.initKnowledgeStore(s); return dir; }

test('P7-T03: aprobarea după reparație nu este un succes al variantei originale', () => {
  assert.deepEqual(outcomeOf({ decision: 'approved' }), { result: 'approved', reward: 1 });
  assert.deepEqual(outcomeOf({ decision: 'approved', repaired: true }), { result: 'approved_after_repair', reward: 0 });
  assert.deepEqual(outcomeOf({ decision: 'approved_with_notes', corrected: true }), { result: 'approved_after_repair', reward: 0 });
  assert.equal(outcomeOf({ decision: 'needs_correction', targeted: true }).reward, 0); assert.equal(outcomeOf({ decision: 'needs_correction', targeted: false }).reward, null, 'neatins de corectură: fără etichetă');
  assert.match(fs.readFileSync(path.join(ROOT, 'server/engine.js'), 'utf8'), /repaired: repaired\.has\(k\)/, 'motorul folosește reparațiile porții');
});

test('P7-T03: scurgerea din același caz — validarea grupată pe proiecte; acuratețea pe antrenare nu este generalizare', () => {
  const samples = []; for (let g = 0; g < 4; g++) for (let i = 0; i < 12; i++) samples.push({ x: [0, 1, 2, 3].map(j => (j === g ? 1 : 0) + (i % 3) * 0.001), y: g % 2, group: 'p' + g });
  const r = groupedCv(samples, { train: Learning.trainPreference, predict: Learning.predictPreference });
  assert.equal(r.status, 'measured'); assert.ok(r.trainAccuracy >= 0.95, 'modelul memorează proiectele'); assert.ok(r.groupedCvAccuracy <= 0.6, `pe proiecte ținute deoparte nu generalizează (${r.groupedCvAccuracy})`); assert.match(r.trainAccuracyNote, /NU este generalizare/);
  const two = groupedCv(samples.filter(s => ['p0', 'p1'].includes(s.group)), { train: Learning.trainPreference, predict: Learning.predictPreference });
  assert.equal(two.status, 'insufficient_groups'); assert.equal(two.groupedCvAccuracy, null);
});

test('P7-T03: confuzia de versiune — variante măsurate în cohorte diferite nu decid competiția; în aceeași cohortă, da', async () => {
  const dir = await setup(), st = 'script_conf';
  for (let i = 0; i < 12; i++) { await Learning.rewardVariant(st, 'A', true, { bp: 21, model: 'm1', age: '3-4' }); await Learning.rewardVariant(st, 'B', false, { bp: 22, model: 'm2', age: '3-4' }); }
  let rep = Learning.variantReports().find(r => r.stage === st); assert.equal(rep.confounded, true); assert.deepEqual(rep.comparableCohorts, []);
  assert.ok(!Learning.competitionDecisions().some(d => d.stage === st), 'nicio decizie din cohorte amestecate');
  for (let i = 0; i < 12; i++) { await Learning.rewardVariant(st, 'A', true, { bp: 22, model: 'm2', age: '3-4' }); await Learning.rewardVariant(st, 'B', i < 2, { bp: 22, model: 'm2', age: '3-4' }); }
  rep = Learning.variantReports().find(r => r.stage === st); assert.deepEqual(rep.comparableCohorts, [cohortKey({ bp: 22, model: 'm2', age: '3-4' })]);
  const d = Learning.competitionDecisions().find(x => x.stage === st); assert.equal(d.winner, 'A'); assert.equal(d.cohort, '22|m2|3-4');
  assert.equal(variantReport('x', { c1: { A: { a: 5, b: 1 } }, c2: { B: { a: 1, b: 5 } } }).confounded, true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P7-T03: transfer negativ — efectul potrivit (vârstă, versiune, etapă) marchează lecția dăunătoare; rollback-ul promovării', async () => {
  const dir = await setup();
  await Learning.addManualLesson({ agent: 'scriitor', text: 'Add a rhyme on every page.', scope: 'project' }); const l = Learning.listLessons().find(x => x.text === 'Add a rhyme on every page.');
  l.code = 'T05'; l.createdAt = 1000; l.pid = 'p1'; l.projects = ['p1', 'p2']; await Learning.persistLessons();
  const row = (t, score, lessons = [], extra = {}) => ({ kind: 'quality', t, age: '3-4', bp: 21, stage: 'script', criteria: { T05: score }, lessons, ...extra });
  const rows = [...[1, 2, 3, 4].map(t => row(t, 8.5)), ...[2000, 2001, 2002, 2003, 2004].map(t => row(t, 6.5, [l.id])), row(5, 3, [], { bp: 15 }), row(6, 3, [], { age: '7-8' })];
  const e = lessonEffect(l, rows); assert.equal(e.status, 'harmful'); assert.equal(e.beforeN, 4, 'doar rândurile potrivite (aceeași vârstă/versiune/etapă)'); assert.equal(e.withN, 5); assert.ok(e.effect < 0); assert.ok(e.limitations.length);
  assert.equal(lessonEffect({ ...l, code: null }, rows).status, 'no_criterion'); assert.equal(lessonEffect(l, rows.slice(0, 2)).status, 'insufficient');
  const repo = { getProject: pid => ({ id: pid, input: { target_age: '3-4', theme: pid } }), artifacts: async () => ({}) };
  const rep = await G.scopeReport(repo, l.id, { scope: 'age', age: '3-4' }); const done = await G.changeScope(repo, l.id, { scope: 'age', age: '3-4', reportHash: rep.hash });
  await G.rollback(done.decision.id); assert.equal(Learning.listLessons().find(x => x.id === l.id).scope, 'project', 'promovarea dăunătoare se anulează exact');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P7-T03 Dinosaur World: baseline-ul V1 și „după” sunt separate; fără date după, nicio diferență (vizuală nici atât)', () => {
  const doc = JSON.parse([...readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')))].find(([k]) => k.endsWith('/project.json'))[1].toString());
  const r = baselineAfter({ baseline: volumeMetrics(doc.artifacts.script_0.content.pages) });
  assert.equal(r.status, 'no_after_data'); assert.equal(r.textDelta, null); assert.equal(r.visualDelta, 'NOT_AVAILABLE'); assert.equal(r.baseline.totalWords, 335); assert.deepEqual(r.heldout.reservedThemes, ['space']);
  const gold = JSON.parse(fs.readFileSync(path.join(ROOT, 'evaluation/gold/gold-v1.json'), 'utf8')); assert.ok(gold.cases.filter(c => c.split === 'holdout').every(c => c.theme === 'space'), 'tema DW (dinozauri) nu este în setul rezervat');
  const after = baselineAfter({ baseline: { totalWords: 335 }, after: { totalWords: 320 } }); assert.equal(after.textDelta.totalWords, -15); assert.equal(after.visualDelta, 'NOT_AVAILABLE');
});

test('P7-T03 API: raportul de eficacitate — eșantioane, limitări, încrederea ca proxy, DW fără delta inventată', async () => {
  const r = await api('GET', 'learning/effectiveness'); assert.equal(r.status, 200);
  assert.match(r.body.confidenceNote, /proxy de politică/); assert.equal(r.body.dinosaurWorld.status, 'no_after_data'); assert.equal(r.body.dinosaurWorld.visualDelta, 'NOT_AVAILABLE');
  assert.ok(Array.isArray(r.body.variants) && Array.isArray(r.body.lessons) && r.body.outcomes.total >= 0);
  if (r.body.model?.validation) assert.ok(['measured', 'insufficient_groups', 'insufficient_classes'].includes(r.body.model.validation.status));
});
