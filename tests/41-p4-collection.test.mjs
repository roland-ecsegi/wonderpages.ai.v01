// TEST-P4-T02 — întoarcerea Tiei fără o nouă întâlnire, prima apariție a lui Pip în V3, finaluri redundante,
// politica lumii naturale/fantastice și nepotrivirea de premisă între artefacte; exact 6 biblii cu
// scop/obstacol/alegere/consecință; conflictele explicate și planul aprobat înaintea producției în volum.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, setFake, waitStatus, connectCanva, INPUT, project } from './lib.mjs';
import { collectionMatrix, matrixForArtifacts } from '../server/domain/collection.js';
import { readZip } from '../server/security/safe-zip.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const vol = (n, o = {}) => ({ number: n, title: `V${n}`, summary: o.summary ?? '', ending_type: o.ending ?? ['acasă', 'cântec', 'zbor', 'picnic', 'pictură', 'sărbătoare'][n - 1], main_setting: 'poiana', story_bible: { premise: o.premise ?? `Milo are o aventură nouă numărul ${n} în poiană`, protagonist: 'milo', goal: `scop ${n}`, obstacle: `obstacol ${n}`, climax_choice: o.choice ?? `Milo alege ${n}`, resolution: `consecință ${n}`, ...(o.sb || {}) } });
const presence = (spec) => Array.from({ length: 6 }, (_, i) => ({ volume: i + 1, presence: spec[i] || 'absent' }));
const BASE = () => ({
  series: { through_line: 'Milo își face prieteni', volumes: Array.from({ length: 6 }, (_, i) => vol(i + 1)) },
  cast: { main_character: 'milo', characters: [{ id: 'milo', role: 'main', volumes: presence(['introduced', 'appears', 'appears', 'appears', 'appears', 'appears']) }, { id: 'tia', role: 'secondary', volumes: presence(['introduced', 'appears', 'mentioned', 'returns', 'appears', 'appears']) }, { id: 'pip', role: 'secondary', volumes: presence([null, null, 'introduced', 'appears', null, 'returns']) }] },
  bible: { characters: [{ id: 'milo', name: 'Milo', role: 'main', species_certainty: 'indeterminate_stylized' }, { id: 'tia', name: 'Tia', role: 'secondary', species_certainty: 'certain' }, { id: 'pip', name: 'Pip', role: 'secondary', introduced: 'volumul 3' }], objects: [{ id: 'feather', name: 'pana', introduced: 'V3' }], world_rules: { magic: 'none' } },
  brief: { collection_title: 'Dino' }, structure: { volumes: 6 }
});
const codes = m => m.findings.map(f => `${f.code}@${f.volume ?? '-'}`);

test('P4-T02: un plan coerent — exact 6 biblii complete, protagonist permanent, companioni flexibili, nicio constatare', () => {
  const m = collectionMatrix(BASE());
  assert.equal(m.volumes.length, 6); assert.equal(m.ready, true, JSON.stringify(m.findings)); assert.deepEqual(m.findings, []);
  for (const v of m.volumes) for (const k of ['goal', 'obstacle', 'choice', 'consequence']) assert.ok(v[k], `V${v.n}.${k}`);
  assert.deepEqual(m.timeline.characters.tia.returns, [4], 'Tia revine în V4 după o menționare în V3'); assert.equal(m.timeline.characters.pip.first, 3);
  assert.deepEqual(m.timeline.relationships['milo+pip'], [3, 4, 6]); assert.equal(m.timeline.objects.feather.introduced, 3);
  assert.equal(m.timeline.characters.milo.speciesCertainty, 'indeterminate_stylized', 'certitudinea factuală este explicită');
  assert.match(m.volumes[0].summary, /scop 1 → obstacol 1 → Milo alege 1 → consecință 1/, 'rezumat derivat din câmpurile canonice');
});

test('P4-T02: întoarcerea Tiei fără o nouă întâlnire', () => {
  const a = BASE(); a.series.volumes[1] = vol(2, { premise: 'Milo o cunoaște pe Tia lângă deal și se joacă împreună' });
  assert.ok(codes(collectionMatrix(a)).includes('RETURN_REMEET@2'));
  const b = BASE(); b.cast.characters[1].volumes[3].presence = 'introduced';
  const m = collectionMatrix(b); assert.ok(codes(m).includes('RETURN_REMEET@4')); assert.equal(m.ready, true, 'important, explicat, dar nu blochează');
  const ok = BASE(); ok.series.volumes[3] = vol(4, { premise: 'Milo și Tia, prietena lui din prima poveste, culeg fructe' });
  assert.ok(!codes(collectionMatrix(ok)).some(c => c.startsWith('RETURN_REMEET')), 'o amintire nu este o nouă întâlnire');
});

test('P4-T02: Pip apare prima dată în V3 — scurgere în V2 și nepotrivire biblie/distribuție detectate; menționarea este permisă', () => {
  const a = BASE(); a.series.volumes[1] = vol(2, { premise: 'Milo și Pip urcă pe dealul ecoului' });
  assert.ok(codes(collectionMatrix(a)).includes('FIRST_APPEARANCE_LEAK@2'));
  const b = BASE(); b.bible.characters[2].introduced = 'volumul 2';
  assert.ok(codes(collectionMatrix(b)).includes('FIRST_APPEARANCE_MISMATCH@-'));
  const c = BASE(); c.cast.characters[2].volumes[1].presence = 'mentioned'; c.series.volumes[1] = vol(2, { premise: 'Milo aude de Pip de la Tia' });
  assert.ok(!codes(collectionMatrix(c)).some(x => x.startsWith('FIRST_APPEARANCE')), 'menționarea dinaintea apariției nu este o scurgere');
});

test('P4-T02: finaluri redundante, politica lumii per colecție, specie afirmată pentru un personaj nedeterminat', () => {
  const a = BASE(); a.series.volumes[1].ending_type = 'acasă';
  assert.ok(codes(collectionMatrix(a)).includes('ENDING_REDUNDANT@2'));
  const b = BASE(); for (const i of [0, 2, 4]) b.series.volumes[i].ending_type = 'somn';
  assert.ok(collectionMatrix(b).findings.some(f => f.code === 'ENDING_REDUNDANT' && f.severity === 'minor'));
  const c = BASE(); c.series.volumes[4] = vol(5, { premise: 'Milo găsește o vrajă care păstrează curcubeul' });
  assert.ok(codes(collectionMatrix(c)).includes('WORLD_POLICY@5'));
  c.bible.world_rules.magic = 'fantasy: zâne blânde'; const f = collectionMatrix(c);
  assert.ok(!codes(f).includes('WORLD_POLICY@5'), 'o lume fantastică declarată permite magia'); assert.equal(f.policy.world, 'fantasy');
  const d = BASE(); d.series.volumes[0] = vol(1, { premise: 'Milo, micul triceratops, găsește o pietricică' });
  assert.ok(codes(collectionMatrix(d)).includes('SPECIES_CLAIM@1'));
});

test('P4-T02: nepotrivire de premisă între artefacte; exact 6 biblii; protagonistul nu lipsește', () => {
  const a = BASE(); a.series.volumes[2].summary = 'Pip pierde pana din aripă, iar copiii construiesc un cuib în copac pentru furtună';
  assert.ok(codes(collectionMatrix(a)).includes('PREMISE_MISMATCH@3'));
  const s = collectionMatrix({ ...BASE(), scripts: { 0: { story_bible: { premise: 'Tia și Milo protejează pietricica de ploaie sub frunză' } } } });
  assert.ok(s.downstream.some(f => f.code === 'PREMISE_MISMATCH' && f.volume === 1), 'copia din scenariu diferă de premisa canonică');
  assert.equal(s.hash, collectionMatrix(BASE()).hash, 'un scenariu scris după aprobare nu schimbă planul aprobat (poarta nu se redeschide)'); assert.equal(s.ready, true);
  const b = BASE(); b.series.volumes.pop(); const m5 = collectionMatrix(b); assert.equal(m5.ready, false); assert.ok(codes(m5).includes('VOLUME_COUNT@-'));
  const c = BASE(); delete c.series.volumes[3].story_bible.climax_choice; const mc = collectionMatrix(c);
  assert.equal(mc.ready, false); assert.ok(mc.findings.some(f => f.code === 'BIBLE_INCOMPLETE' && f.volume === 4 && f.fields.includes('choice')));
  const d = BASE(); d.cast.characters[0].volumes[4].presence = 'absent'; assert.ok(codes(collectionMatrix(d)).includes('PROTAGONIST_ABSENT@5'));
  const e = BASE(); e.cast.characters[1].volumes = presence(['introduced']); assert.ok(collectionMatrix(e).ready && !codes(collectionMatrix(e)).length, 'companionii nu sunt forțați în fiecare volum');
});

test('P4-T02 Dinosaur World: 6 volume păstrate, Milo cu specie nedeterminată, Tia revine fără reîntâlnire, Pip din V3; divergența reală din V3 este explicată', () => {
  const files = readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')));
  const doc = JSON.parse([...files.entries()].find(([n]) => n.endsWith('project.json'))[1].toString('utf8'));
  const m = matrixForArtifacts(doc.blueprint, doc.artifacts);
  assert.equal(m.volumes.length, 6); assert.equal(m.summary.blockers, 0); assert.equal(m.timeline.characters.milo.speciesCertainty, 'indeterminate_stylized');
  assert.equal(m.timeline.characters.pip.first, 3); assert.ok(!codes(m).some(c => c.startsWith('RETURN_REMEET') || c.startsWith('FIRST_APPEARANCE')));
  const v3 = m.findings.find(f => f.code === 'PREMISE_MISMATCH' && f.volume === 3); assert.ok(v3, 'premisa V3 („pui de pterozaur”) diferă de rezumat („pana nu provine din corpul lui”)');
  assert.equal(m.policy.world, 'natural');
});

test('P4-T02 API: la aprobarea seriei planul colecției este un element; un plan cu blocaje nu poate fi aprobat, iar producția nu continuă', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Matrice P4' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']);
  let d = await project(id); assert.equal(d.project.gate.key, 'review_collection');
  let item = d.review.items.find(i => i.kind === 'collection'); assert.ok(item, 'elementul „planul colecției” există');
  assert.equal(item.blocked, false); assert.equal(item.matrix.volumes.length, 6); assert.ok(item.matrix.volumes.every(v => v.goal && v.choice && v.consequence));
  const live = (await api('GET', `projects/${id}/collection`)).body; assert.equal(live.hash, item.hash);
  const browser = process.env.BROWSER_PATH;
  if (browser && fs.existsSync(browser)) {
    const { evalInPage } = await import('./cdp.mjs');
    const ui = await evalInPage(browser, `${process.env.WP_BASE}/#/p/${id}/review`, `(() => { const m = document.getElementById('collection-matrix'); return m ? JSON.stringify({ ready: m.dataset.ready, rows: m.querySelectorAll('tbody')[0]?.children.length, cast: m.querySelectorAll('tbody')[1]?.children.length }) : null; })()`);
    assert.ok(ui, 'matricea este randată în revizuire'); const u = JSON.parse(ui); assert.equal(u.ready, 'true'); assert.equal(u.rows, 6); assert.ok(u.cast >= 1);
  }
  // un plan stricat (biblie fără alegere) → blocat, aprobarea refuzată, poarta nu se închide
  const series = structuredClone(d.artifacts.series.content); delete series.volumes[2].story_bible.climax_choice;
  assert.equal((await api('POST', `projects/${id}/artifacts/series`, { content: series, note: 'test' })).status, 200);
  d = await project(id); item = d.review.items.find(i => i.kind === 'collection');
  assert.equal(item.blocked, true); assert.equal(item.state, 'error');
  const r = await api('POST', `projects/${id}/items`, { decisions: [{ id: 'collection', state: 'approved' }] }); assert.equal(r.status, 409);
  assert.equal((await api('POST', `projects/${id}/gate/complete`)).status, 400, 'planul neaprobat oprește producția în volum');
  series.volumes[2].story_bible.climax_choice = 'Milo alege să asculte'; await api('POST', `projects/${id}/artifacts/series`, { content: series, note: 'reparat' });
  d = await project(id); item = d.review.items.find(i => i.kind === 'collection'); assert.equal(item.blocked, false);
  assert.equal((await api('POST', `projects/${id}/items`, { decisions: [{ id: 'collection', state: 'approved' }] })).status, 200);
  await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});
