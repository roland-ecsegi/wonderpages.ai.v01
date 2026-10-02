// TEST-P2-T04 — aprobare urmată de editare de aceeași lungime / schimbare de referință; limbă sau imagine lipsă;
// doi operatori pe aceeași revizie; export de colecție fără poartă; decizii durabile cu actor și scop valid.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { api, INPUT, ROOT, project } from './lib.mjs';
import { LocalStorage } from '../server/storage/local.js';
import { applyMigrations } from '../server/persistence/migrations.js';
import { Repo } from '../server/repo.js';
import { decisionStatus, expectedInventory, releaseCheck, policyHash, itemSubject, decisionRecord } from '../server/domain/decisions.js';

const BP = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8'));
const DWZIP = fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip'));
async function gateProject(pid) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-dec-')); const s = new LocalStorage(dir); await s.init(); await applyMigrations(s); const repo = new Repo(s);
  await repo.createProject({ id: pid, title: 'D', status: 'awaiting_review', input: { second_language: 'Romanian', languages: ['English', 'Romanian'], language: 'English' }, options: { images: false }, approvals: {} }, BP);
  const engine = await import('../server/engine.js'); engine.initEngine(repo, {});
  /* v16 (P4-T02): the collection plan is an approval item, so the fixture carries a minimal valid plan */
  const plan = { series: { through_line: 'Milo', volumes: Array.from({ length: 6 }, (_, i) => ({ number: i + 1, title: 'V' + (i + 1), ending_type: 'e' + i, story_bible: { premise: 'Milo ' + i, protagonist: 'milo', goal: 'g', obstacle: 'o', climax_choice: 'c', resolution: 'r' } })) }, cast: { main_character: 'milo', characters: [{ id: 'milo', role: 'main', volumes: Array.from({ length: 6 }, (_, i) => ({ volume: i + 1, presence: i ? 'appears' : 'introduced' })) }] }, bible: { characters: [{ id: 'milo', name: 'Milo', role: 'main' }], world_rules: { magic: 'none' } } };
  for (const k of ['brief', 'series', 'bible', 'cast']) await repo.writeArtifact(pid, k, plan[k] ? { ...plan[k], text: 'abcd', k } : { text: 'abcd', k });
  for (let v = 0; v < 6; v++) await repo.writeArtifact(pid, 'plan_' + v, { pages: Array.from({ length: 12 }, (_, i) => ({ n: i + 1, role: 'r', beat: 'b', emotion: 'e', new_information: 's', image_added_value: 'i', turn: { type: 'quiet' } })) });   // v17 (P4-T03)
  await repo.patchProject(pid, { gate: { key: 'review_collection', vol: null, round: 1 } });
  return { s, repo, dir, engine };
}

test('P2-T04: aprobare + editare de aceeași lungime → decizia rămâne în istoric, dar devine expirată', async () => {
  const { repo, dir, engine } = await gateProject('pdec00001');
  await engine.setItemDecisions('pdec00001', [{ id: 'doc:brief', state: 'approved' }], { actor: 'operator@laptop' });
  const [rec] = await repo.listDecisions('pdec00001');
  assert.equal(rec.kind, 'item'); assert.equal(rec.actor, 'operator@laptop'); assert.equal(rec.scope.item, 'doc:brief'); assert.equal(rec.subject.version, 1);
  let items = engine.gateItems(BP, await repo.artifacts('pdec00001'), repo.getProject('pdec00001'), repo.getProject('pdec00001').gate);
  assert.equal(decisionStatus(rec, { item: items.find(i => i.id === 'doc:brief'), art: await repo.artifacts('pdec00001'), bp: BP }).status, 'approved');
  await repo.writeArtifact('pdec00001', 'brief', { text: 'abce', k: 'brief' });   // aceeași lungime
  items = engine.gateItems(BP, await repo.artifacts('pdec00001'), repo.getProject('pdec00001'), repo.getProject('pdec00001').gate);
  const st = decisionStatus(rec, { item: items.find(i => i.id === 'doc:brief'), art: await repo.artifacts('pdec00001'), bp: BP });
  assert.equal(st.status, 'stale'); assert.deepEqual(st.reasons, ['conținutul s-a schimbat']);
  assert.equal(items.find(i => i.id === 'doc:brief').state, 'pending', 'poarta cere o decizie nouă');
  assert.equal((await repo.listDecisions('pdec00001')).length, 1, 'decizia istorică nu se șterge');
  const bp2 = structuredClone(BP); bp2.gates.review_collection.items.push({ kind: 'doc', keys: ['refs'] });
  assert.ok(decisionStatus({ ...rec, subject: { ...rec.subject, contentHash: items.find(i => i.id === 'doc:brief').hash } }, { item: items.find(i => i.id === 'doc:brief'), art: await repo.artifacts('pdec00001'), bp: bp2 }).reasons.includes('politica porții s-a schimbat'));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P2-T04: schimbarea referinței (dependenței) face decizia expirată', () => {
  const art = { ill_0_4: { version: 2, content: { color: 'images/a.png' }, basedOn: { key: 'final_0', version: 3, pageHash: 'h1' } } };
  const item = { id: 'img:ill_0_4:color', key: 'ill_0_4', hash: 'same' };
  const rec = decisionRecord({ kind: 'item', actor: 'operator@laptop', state: 'approved', scope: { gate: 'review_2', item: item.id }, subject: itemSubject(art, item), policy: policyHash(BP, 'review_2') });
  assert.equal(decisionStatus(rec, { item, art, bp: BP }).status, 'approved');
  art.ill_0_4.basedOn.pageHash = 'h2';
  assert.deepEqual(decisionStatus(rec, { item, art, bp: BP }).reasons, ['dependențele s-au schimbat']);
});

test('P2-T04: limbă sau imagine lipsă → inventar incomplet → release blocat chiar cu porți aprobate', () => {
  const p = { input: { languages: ['English', 'Romanian'], language: 'English', second_language: 'Romanian' }, options: {} };
  const pages = Array.from({ length: 12 }, (_, i) => ({ n: i + 1, text: 'EN ' + (i + 1) }));
  const art = { final_0: { content: { pages } } };
  for (let i = 0; i <= 12; i++) if (i !== 3) art[`ill_0_${i}`] = { content: { color: `images/c${i}.png`, lineart: i ? `images/l${i}.png` : undefined } };
  const inv = expectedInventory(p, BP, art, 0);
  assert.ok(inv.missing.some(m => m.id === 'tr:0:1') && inv.missing.filter(m => m.id.startsWith('tr:0:')).length === 12, 'ediția RO lipsă');
  assert.ok(inv.missing.some(m => m.id === 'color:0:3') && inv.missing.some(m => m.id === 'line:0:3'), 'imaginea p3 lipsă');
  const rc = releaseCheck(p, BP, art, 0, { approved: true });
  assert.equal(rc.eligible, false); assert.ok(rc.blockers.every(b => b.code === 'missing_artifact'));
  art.tr_0 = { content: { pages: pages.map(x => ({ ...x, text: 'RO' })) } }; art.ill_0_3 = { content: { color: 'c', lineart: 'l' } };
  assert.equal(releaseCheck(p, BP, art, 0, { approved: true }).eligible, true);
  assert.equal(releaseCheck(p, BP, art, 0, { approved: false }).eligible, false, 'inventarul complet nu înlocuiește aprobarea');
});

test('P2-T04: doi operatori pe aceeași revizie → al doilea primește 409; id necunoscut → 400 resource_scope', async () => {
  const { repo, dir, engine } = await gateProject('pdec00002');
  const rev = repo.getProject('pdec00002').revision;
  await engine.setItemDecisions('pdec00002', [{ id: 'doc:brief', state: 'approved' }], { actor: 'operator@laptop', expectedRevision: rev });
  await assert.rejects(engine.setItemDecisions('pdec00002', [{ id: 'doc:series', state: 'approved' }], { actor: 'operator@lan', expectedRevision: rev }), e => e.status === 409 && e.code === 'revision_conflict');
  assert.equal(repo.getProject('pdec00002').approvals['review_collection@c']['doc:series'], undefined, 'nicio aprobare pe vedere veche');
  await assert.rejects(engine.setItemDecisions('pdec00002', [{ id: 'doc:inexistent', state: 'approved' }]), e => e.status === 400 && e.code === 'resource_scope');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P2-T04: decizia de poartă este un record durabil, legat de versiunile aprobate', async () => {
  const { repo, dir, engine } = await gateProject('pdec00003');
  const items = engine.gateItems(BP, await repo.artifacts('pdec00003'), repo.getProject('pdec00003'), repo.getProject('pdec00003').gate);
  await engine.setItemDecisions('pdec00003', items.map(i => ({ id: i.id, state: 'approved' })), { actor: 'operator@laptop' });
  await engine.completeGate('pdec00003', { actor: 'operator@laptop' });
  engine.stopEngine('pdec00003'); await new Promise(r => setTimeout(r, 300));   // aprobarea pornește producția (comportament v04); aici o oprim
  const gate = (await repo.listDecisions('pdec00003')).find(d => d.kind === 'gate');
  assert.equal(gate.state, 'approved'); assert.equal(gate.scope.gate, 'review_collection'); assert.equal(gate.subject.approvedVersions.brief, 1); assert.match(gate.policyHash, /^[0-9a-f]{64}$/);
  assert.equal(repo.getProject('pdec00003').gate, null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P2-T04 API: export de colecție fără poartă refuzat cu motive; propunerea de canon cere decizie; propunere expirată refuzată', async () => {
  const p = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Decizii API' } }); const pid = p.body.id;
  const pk = await api('POST', `projects/${pid}/package`);
  assert.equal(pk.status, 409); assert.equal(pk.body.code, 'release_blocked'); assert.ok(pk.body.errors.some(e => e.code === 'gate_not_approved'));
  await api('POST', `projects/${pid}/artifacts/bible`, { content: { characters: [{ id: 'milo', visual: 'teal' }] } });
  const a = await api('POST', `projects/${pid}/canon/proposals`, { bible: { characters: [{ id: 'milo', visual: 'teal with coral spots' }] } });
  const b = await api('POST', `projects/${pid}/canon/proposals`, { bible: { characters: [{ id: 'milo', visual: 'green' }] } });
  assert.equal((await api('POST', `projects/${pid}/canon/proposals/${a.body.id}/decide`, { state: 'rejected' })).status, 400, 'respingerea cere motiv');
  const ok = await api('POST', `projects/${pid}/canon/proposals/${a.body.id}/decide`, { state: 'approved', reason: 'pete coral confirmate' });
  assert.equal(ok.status, 200); assert.equal(ok.body.decision.kind, 'canon_change');
  const d = await project(pid); assert.equal(d.artifacts.bible.content.characters[0].visual, 'teal with coral spots'); assert.equal(d.artifacts.bible.version, 2);
  const stale = await api('POST', `projects/${pid}/canon/proposals/${b.body.id}/decide`, { state: 'approved' });
  assert.equal(stale.status, 409); assert.equal(stale.body.code, 'stale_proposal');
  const list = await api('GET', `projects/${pid}/decisions`); assert.ok(list.body.decisions.some(x => x.kind === 'canon_change' && x.actor === 'operator@laptop'));
  await api('POST', `projects/${pid}/archive`, { archived: true });
});

test('P2-T04 API: DW importat intră Pregătit cu aprobări goale; deciziile originale sunt doar evidență', async () => {
  const r = await api('POST', 'projects/import', DWZIP, { headers: { 'content-type': 'application/octet-stream' } });
  assert.equal(r.status, 200);
  const d = await project(r.body.id);
  assert.equal(d.project.status, 'ready'); assert.deepEqual(d.project.approvals, {}); assert.equal(d.project.importedEvidence.authority, 'none');
  assert.equal((await api('GET', `projects/${r.body.id}/decisions`)).body.decisions.length, 0, 'nicio decizie locală inventată');
  assert.equal(d.project.running, false);
  await api('POST', `projects/${r.body.id}/archive`, { archived: true });
});
