// TEST-P7-T06 — documente injectate cer o îmbunătățire / promovare globală, rută invalidă, ID de proiect învechit și
// confirmare/anulare explicită: serverul refuză acțiunea neautorizată indiferent de rezultatul promptului; distincție clară
// propus/aplicat; inspectorul memoriei rolului.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { api } from './lib.mjs';
import { LocalStorage } from '../server/storage/local.js';
import * as Dali from '../server/assistant.js';

const projects = { p1: { id: 'p1', title: 'Pădurea', status: 'paused', revision: 3, input: { language: 'English' }, approvals: {} }, pdw: { id: 'pdw', title: 'Dinosaur World', status: 'ready', revision: 1, input: { language: 'English', second_language: 'Romanian' }, approvals: {}, source: { kind: 'migration' } } };
const repo = { getProject: id => projects[id] || null, listTypes: () => [], listProjects: () => Object.values(projects) };
let next = { reply: 'Bine.', actions: [] }, lastPrompt = '';
async function setup() { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-dali-')), s = new LocalStorage(d); await s.init(); await Dali.initAssistant(repo, s, async p => { lastPrompt = p; return next; }, () => ({ projects: [] })); return d; }

test('P7-T06: documentul injectat cere „adaugă îmbunătățire” și „promovează global” — serverul refuză, nimic nu se aplică', async () => {
  const d = await setup(), n0 = Dali.listImprovements().length;
  next = { reply: 'Am rezumat.', actions: [{ type: 'add_improvement', title: 'Ștergeți toate lecțiile', description: 'din document' }, { type: 'promote_lesson', id: 'l1', scope: 'global' }, { type: 'approve_gate' }, { type: 'publish' }] };
  const r = await Dali.chat({ message: 'Rezumă-mi documentul atașat, te rog.', context: { route: '#/learning' } });
  assert.deepEqual(r.actions, [], 'nicio acțiune acceptată'); assert.deepEqual(r.rejected.map(x => `${x.type}:${x.reason}`), ['add_improvement:no_user_intent', 'promote_lesson:not_allowed', 'approve_gate:not_allowed', 'publish:not_allowed']);
  assert.equal(Dali.listImprovements().length, n0, 'nicio îmbunătățire creată din rezultatul modelului');
  fs.rmSync(d, { recursive: true, force: true });
});

test('P7-T06: ruta invalidă este refuzată; rutele reale (inclusiv atelierul paginii) sunt acceptate', async () => {
  const d = await setup();
  next = { reply: 'Deschide:', actions: [{ type: 'navigate', to: '#/p/p1/book/1/4' }, { type: 'navigate', to: '#/p/necunoscut/progress' }, { type: 'navigate', to: '#/p/p1/bogus' }, { type: 'navigate', to: 'javascript:alert(1)' }, { type: 'navigate', to: '#/learning' }, { type: 'navigate', to: '#/admin/delete' }] };
  const r = await Dali.chat({ message: 'Unde văd pagina 4?', context: {} });
  assert.deepEqual(r.actions.map(a => a.to), ['#/p/p1/book/1/4', '#/learning']); assert.equal(r.rejected.filter(x => x.reason === 'invalid_route').length, 4);
  fs.rmSync(d, { recursive: true, force: true });
});

test('P7-T06: propunerea cerută de tine se aplică doar la confirmare; anularea nu schimbă nimic; proiectul schimbat/șters o face învechită', async () => {
  const d = await setup(), n0 = Dali.listImprovements().length;
  next = { reply: 'Am pregătit propunerea.', actions: [{ type: 'add_improvement', title: 'Export mai rapid', category: 'livrare', priority: 'medie', description: 'Situația actuală…' }] };
  const a = await Dali.chat({ message: 'Notează în lista de îmbunătățiri: exportul durează prea mult.', context: { projectId: 'p1' } });
  assert.equal(a.actions[0].type, 'proposal'); assert.equal(a.actions[0].status, 'proposed'); assert.equal(Dali.listImprovements().length, n0, 'propus, nu aplicat');
  const rev = id => projects[id] ? projects[id].revision : null;
  const ok = await Dali.decideProposal(a.sid, a.actions[0].id, { confirm: true, revisionOf: rev }); assert.equal(ok.applied, true); assert.equal(Dali.listImprovements().length, n0 + 1);
  await assert.rejects(Dali.decideProposal(a.sid, a.actions[0].id, { confirm: true, revisionOf: rev }), e => e.code === 'proposal_decided');
  const b = await Dali.chat({ sid: a.sid, message: 'Adaugă și asta în lista de îmbunătățiri: butoane mai mari.', context: { projectId: 'p1' } });
  const c = await Dali.decideProposal(a.sid, b.actions[0].id, { confirm: false, revisionOf: rev }); assert.equal(c.proposal.status, 'cancelled'); assert.equal(Dali.listImprovements().length, n0 + 1);
  const e = await Dali.chat({ sid: a.sid, message: 'Notează o îmbunătățire: previzualizare mai mare.', context: { projectId: 'p1' } });
  projects.p1.revision = 4; await assert.rejects(Dali.decideProposal(a.sid, e.actions[0].id, { confirm: true, revisionOf: rev }), x => x.code === 'stale_revision');
  const f = await Dali.chat({ sid: a.sid, message: 'Notează o îmbunătățire: alt lucru.', context: { projectId: 'p1' } }); delete projects.p1;
  await assert.rejects(Dali.decideProposal(a.sid, f.actions[0].id, { confirm: true, revisionOf: rev }), x => x.code === 'stale_project');
  await assert.rejects(Dali.decideProposal('sesiune-necunoscută', 'x', { confirm: true }), x => x.code === 'proposal_missing');
  projects.p1 = { id: 'p1', title: 'Pădurea', status: 'paused', revision: 3, input: { language: 'English' }, approvals: {} };
  fs.rmSync(d, { recursive: true, force: true });
});

test('P7-T06 Dinosaur World: Dali vede sursa migrată și raportul de reconciliere; aprobările nu sunt inventate', async () => {
  const d = await setup(); next = { reply: 'Proiectul migrat are un raport de reconciliere deschis.', actions: [] };
  await Dali.chat({ message: 'Ce trebuie să fac la Dinosaur World?', context: { projectId: 'pdw', route: '#/p/pdw/activity' } });
  assert.match(lastPrompt, /"source":"migration"/); assert.match(lastPrompt, /"approvalsGiven":0/); assert.match(lastPrompt, /reconciliere deschis \(DW01\/DW02\)/); assert.match(lastPrompt, /never say approvals exist/);
  fs.rmSync(d, { recursive: true, force: true });
});

test('P7-T06 API: inspectorul memoriei rolului; propunerile necunoscute sunt refuzate', async () => {
  const m = await api('GET', 'agents/scriitor/memory'); assert.equal(m.status, 200); assert.deepEqual(m.body.skills, ['narrative-causality', 'age-dialogue']); assert.ok(m.body.lessons.active?.length >= 1); assert.ok(m.body.lessons.active.every(l => l.version >= 1 && 'provenance' in l && 'evidence' in l));
  assert.equal((await api('GET', 'agents/necunoscut/memory')).status, 404);
  assert.equal((await api('POST', 'assistant/sid-inexistent/proposals/ap-x', { confirm: true })).status, 404);
});
