// TEST-P7-T02 — o singură respingere încearcă o regulă globală, pozitivă într-o temă și negativă în alta, raport de
// promovare învechit și sursă revocată: nicio difuzare automată globală/pe rol; promovarea are dovezi + domeniu +
// decizie + versiune fixată și rollback determinist.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { api, zip } from './lib.mjs';
import { LocalStorage } from '../server/storage/local.js';
import * as Learning from '../server/learning.js';
import * as Training from '../server/training.js';
import * as K from '../server/knowledge/store.js';
import * as G from '../server/knowledge/governance.js';

const P = { p1: ['3-4', 'forest'], p2: ['3-4', 'sea'], p3: ['3-4', 'space'], p4: ['5-6', 'city'] };
const repo = { getProject: pid => (P[pid] ? { id: pid, input: { target_age: P[pid][0], theme: P[pid][1] } } : null), artifacts: async () => ({ bible: { content: { characters: [{ name: 'Tia' }, { name: 'Milo' }], objects: [{ name: 'pebble' }] } } }) };
let reply = {};
async function setup() { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-kp-')), s = new LocalStorage(dir); await s.init(); await Learning.initLearning(s, async () => reply); await K.initKnowledgeStore(s); await Training.initTraining(s, Learning); return dir; }
const lesson = text => Learning.listLessons().find(l => l.text === text);
async function confirmIn(text, pids) { const l = lesson(text); l.projects = [...new Set([...(l.projects || []), ...pids])]; await Learning.persistLessons(); return l; }

test('P7-T02: o singură respingere nu poate deveni regulă globală (nici prin propunere, nici prin lărgire directă)', async () => {
  const dir = await setup();
  reply = { new: [{ agent: 'scriitor', text: 'Never use rhymes on any page of any book.', age_specific: false }] };
  await Learning.learnFromEvent({ kind: 'item_decisions', decisions: [{ decision: 'rejected', note: 'fără rime aici' }] }, { agents: ['scriitor'], age: '3-4', pid: 'p1' });
  const l = lesson('Never use rhymes on any page of any book.'); assert.equal(l.scope, 'project'); assert.equal(l.pid, 'p1', 'lecția se naște în proiectul ei');
  const preview = await G.changeScope(repo, l.id, { scope: 'global' }); assert.equal(preview.applied, false); assert.equal(preview.report.eligible, false); assert.ok(preview.report.reasons.some(r => /cel puțin 3/.test(r)));
  await assert.rejects(G.changeScope(repo, l.id, { scope: 'global', reportHash: preview.report.hash }), e => e.code === 'promotion_blocked'); assert.equal(lesson(l.text).scope, 'project');
  await Learning.addProposals([{ agent: 'scriitor', text: 'Short sentences only.' }], { pid: 'p1', age: '3-4' }); const pr = Learning.listProposals()[0];
  await assert.rejects(Learning.decideProposal(pr.id, true, 'global'), e => e.code === 'single_case');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P7-T02: pozitivă într-o temă, negativă în alta → rămâne pe domeniul confirmat; fără negative, vârsta se promovează cu decizie și versiune', async () => {
  const dir = await setup(); const t = 'Show one clear event per page.';
  await Learning.addManualLesson({ agent: 'scriitor', text: t, scope: 'project' }); const l = await confirmIn(t, ['p1', 'p2']); l.pid = 'p1'; l.negatives = [{ pid: 'p3', at: 1 }]; await Learning.persistLessons();
  let r = await G.scopeReport(repo, l.id, { scope: 'age', age: '3-4' }); assert.equal(r.eligible, false); assert.ok(r.reasons.some(x => /Contrazisă în 1 proiect\(e\) \(space\)/.test(x)), JSON.stringify(r.reasons));
  r = await G.scopeReport(repo, l.id, { scope: 'global' }); assert.ok(r.reasons.some(x => /Pozitivă într-o temă, negativă în alta/.test(x)));
  l.negatives = []; await Learning.persistLessons();
  r = await G.scopeReport(repo, l.id, { scope: 'age', age: '3-4' }); assert.equal(r.eligible, true, JSON.stringify(r.reasons));
  const done = await G.changeScope(repo, l.id, { scope: 'age', age: '3-4', reportHash: r.hash, note: 'confirmată în pădure și mare' });
  assert.equal(done.applied, true); assert.equal(lesson(t).scope, 'age'); assert.equal(lesson(t).age, '3-4'); assert.equal(lesson(t).version, 2); assert.equal(lesson(t).versions[0].scope, 'project');
  const d = K.getDecision(done.decision.id); assert.equal(d.kind, 'knowledge_promotion'); assert.equal(d.subject.reportHash, r.hash); assert.equal(d.subject.evidence.positives.length, 2);
  assert.equal(Learning.lessonsFor('scriitor', '3-4', 'p9').some(x => x.text === t), true, 'se aplică doar vârstei 3-4'); assert.equal(Learning.lessonsFor('scriitor', '5-6', 'p9').some(x => x.text === t), false);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P7-T02: raportul învechit este refuzat (o contradicție nouă după citire)', async () => {
  const dir = await setup(); const t = 'Use a sound word on most pages.';
  await Learning.addManualLesson({ agent: 'scriitor', text: t, scope: 'project' }); const l = await confirmIn(t, ['p1', 'p2']); l.pid = 'p1'; await Learning.persistLessons();
  const r = await G.scopeReport(repo, l.id, { scope: 'age', age: '3-4' }); assert.equal(r.eligible, true);
  reply = { contradict: [l.id] }; await Learning.learnFromEvent({ kind: 'item_decisions' }, { agents: ['scriitor'], age: '3-4', pid: 'p3' });
  await assert.rejects(G.changeScope(repo, l.id, { scope: 'age', age: '3-4', reportHash: r.hash }), e => e.code === 'stale_report'); assert.equal(lesson(t).scope, 'project');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P7-T02: sursa revocată — lecția nu mai poate fi promovată; rollback determinist al unei promovări', async () => {
  const dir = await setup();
  const p = await Training.importPack(zip([{ name: 'training.json', data: JSON.stringify({ id: 'rev-pack', name: 'R', lessons: [{ agent: 'scriitor', text: 'End every book warmly.' }] }) }]));
  const c = K.listCandidates({ sourceId: p.sourceId })[0]; await K.promoteCandidate(c.id, x => Training.applyCandidate(x, { pid: 'p1' }));
  const l = await confirmIn('End every book warmly.', ['p2']);
  const r = await G.scopeReport(repo, l.id, { scope: 'age', age: '3-4' }); assert.equal(r.eligible, true, JSON.stringify(r.reasons));
  const done = await G.changeScope(repo, l.id, { scope: 'age', age: '3-4', reportHash: r.hash }); const after = structuredClone(lesson(l.text));
  const rb = await G.rollback(done.decision.id); const back = lesson(l.text);
  assert.deepEqual([back.scope, back.age, back.pid, back.text], [after.versions[0].scope, after.versions[0].age, after.versions[0].pid, after.versions[0].text], 'versiunea anterioară exactă');
  assert.equal(back.version, 3); assert.equal(back.versions.length, 2, 'istoricul nu se pierde'); assert.equal(K.getDecision(rb.decision.id).supersedes, done.decision.id);
  await assert.rejects(G.rollback(done.decision.id), e => e.code === 'not_latest');
  await Training.deletePack('rev-pack');
  const r2 = await G.scopeReport(repo, l.id, { scope: 'age', age: '3-4' }); assert.equal(r2.eligible, false); assert.equal(r2.sourceRevoked, true); assert.equal(lesson(l.text).status, 'revoked');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P7-T02 Dinosaur World: anatomia Tiei rămâne a proiectului; verificarea generică a prinderii obiectelor se validează separat; contractul precede', async () => {
  const dir = await setup();
  for (const t of ['Tia holds objects only with her mouth.', 'Check who holds what, and with which body part, on every page.', 'Light glows with magic around everyone at night.']) { await Learning.addManualLesson({ agent: 'director-artistic', text: t, scope: 'project' }); const l = await confirmIn(t, ['p1', 'p2', 'p4']); l.pid = 'p1'; }
  await Learning.persistLessons();
  const tia = await G.scopeReport(repo, lesson('Tia holds objects only with her mouth.').id, { scope: 'global' }); assert.equal(tia.eligible, false); assert.deepEqual(tia.named, ['Tia']);
  const gen = await G.scopeReport(repo, lesson('Check who holds what, and with which body part, on every page.').id, { scope: 'global' }); assert.equal(gen.eligible, true, JSON.stringify(gen.reasons));
  const magic = await G.scopeReport(repo, lesson('Light glows with magic around everyone at night.').id, { scope: 'global' }); assert.ok(magic.reasons.some(r => /WORLD_RULE_CONFLICT/.test(r)), 'regula lumii din contract precede preferința învățată');
  const narrow = await G.changeScope(repo, lesson('Tia holds objects only with her mouth.').id, { scope: 'project', pid: 'p1' }); assert.equal(narrow.applied, true, 'restrângerea nu cere dovezi');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P7-T02 API: lărgirea cere raportul și decizia; propunerea globală dintr-un singur caz este refuzată', async () => {
  const l = (await api('POST', 'lessons', { agent: 'scriitor', text: 'API: one idea per sentence.', scope: 'project' })).body;
  const prev = await api('POST', `lessons/${l.id}/scope`, { scope: 'global' }); assert.equal(prev.status, 200); assert.equal(prev.body.applied, false); assert.equal(prev.body.report.eligible, false);
  const rep = (await api('GET', `lessons/${l.id}/promotion-report?scope=global`)).body; assert.equal(rep.hash, prev.body.report.hash);
  const bl = await api('POST', `lessons/${l.id}/scope`, { scope: 'global', reportHash: rep.hash }); assert.equal(bl.status, 409); assert.equal(bl.body.code, 'promotion_blocked');
  assert.ok(Array.isArray((await api('GET', 'knowledge/decisions')).body.decisions));
});
