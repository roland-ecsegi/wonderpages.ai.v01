// TEST-P5-T04 — rezumat opus scenariului, Tia reintrodusă ca străină, Pip prea devreme, finaluri identice reformulate
// și deținător diferit între poveste și colorat: referințe exacte și scopuri afectate; livrarea este blocată de orice
// problemă mare nerezolvată sau componentă lipsă; un motiv repetat intenționat este permis.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, ROOT } from './lib.mjs';
import { collectionQA, releaseIssues } from '../server/quality/collection-qa.js';
import { releaseCheck } from '../server/domain/decisions.js';
import { readZip } from '../server/security/safe-zip.js';

const BP = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8'));
const pages = (v, fn) => Array.from({ length: 12 }, (_, i) => ({ n: i + 1, text: fn(i + 1), characters: ['milo', 'tia'], actions: [{ character: 'milo', action: 'walks' }], coloring_scene: 'simple scene' }));
const presence = spec => Array.from({ length: 6 }, (_, i) => ({ volume: i + 1, presence: spec[i] || 'absent' }));
function base() {
  const vol = i => ({ number: i + 1, title: `V${i + 1}`, summary: `Milo and Tia look for shiny things in the meadow, volume ${i + 1}.`, ending_type: ['home', 'song', 'picnic', 'painting', 'party', 'trip'][i], story_bible: { premise: `Milo and Tia look for shiny things, volume ${i + 1}`, protagonist: 'milo', goal: 'g', obstacle: 'o', climax_choice: 'c', resolution: 'r' } });
  return {
    series: { content: { volumes: Array.from({ length: 6 }, (_, i) => vol(i)) } },
    cast: { content: { main_character: 'milo', characters: [{ id: 'milo', role: 'main', volumes: presence(['introduced', 'appears', 'appears', 'appears', 'appears', 'appears']) }, { id: 'tia', volumes: presence(['introduced', 'appears', 'appears', 'appears', 'appears', 'appears']) }, { id: 'pip', volumes: presence([null, null, 'introduced', 'appears']) }] } },
    bible: { content: { characters: [{ id: 'milo', name: 'Milo', role: 'main' }, { id: 'tia', name: 'Tia' }, { id: 'pip', name: 'Pip' }], objects: [{ id: 'pebble', name: 'pebble' }], world_rules: { magic: 'none' } } },
    final_0: { content: { pages: pages(0, n => n === 12 ? 'At dusk Milo waved goodbye and went home to his nest.' : `Milo and Tia look for shiny things in the meadow, page ${n}.`) } },
    final_1: { content: { pages: pages(1, n => n === 12 ? 'Milo and Tia sang their echo song on the hill until the stars came out.' : `Milo and Tia look for shiny things on the hill, page ${n}.`) } }
  };
}
const codes = q => q.issues.map(i => `${i.code}@${(i.scope.volumes || []).join(',')}${i.scope.pages ? ':' + i.scope.pages.join(',') : ''}`);

test('P5-T04: o colecție coerentă nu are probleme mari; scopurile sunt pe volume', () => {
  const q = collectionQA({ bp: BP, art: base(), project: { input: {} } });
  assert.equal(q.high, 0, JSON.stringify(q.issues)); assert.equal(q.collectionPass, false, 'volumele nescrise/neevaluate nu trec: colecția nu ascunde un volum slab');
  assert.ok(q.volumes.every(v => v.bookPass === false));
});

test('P5-T04: rezumatul opus manuscrisului → nepotrivire de proiecție cu referințe exacte', () => {
  const a = base(); a.series.content.volumes[1].summary = 'Pip loses the pebble forever and nobody ever finds it again.';
  const q = collectionQA({ bp: BP, art: a, project: { input: {} } });
  const i = q.issues.find(x => x.code === 'PROJECTION_MISMATCH'); assert.ok(i, JSON.stringify(q.issues)); assert.equal(i.severity, 'high');
  assert.deepEqual(i.scope.volumes, [2]); assert.ok(i.references.some(r => r.path === 'series.volumes[1].summary' && /Pip loses/.test(r.quote)));
});

test('P5-T04: Tia reintrodusă ca străină și Pip înainte de volumul 3 → pagini exacte', () => {
  const a = base(); a.final_1.content.pages[2].text = 'A new friend peeked out. “I’m Tia!” she said.';
  a.final_1.content.pages[5] = { ...a.final_1.content.pages[5], characters: ['milo', 'tia', 'pip'], text: 'Pip flew down from the tree.' };
  const q = collectionQA({ bp: BP, art: a, project: { input: {} } });
  assert.ok(codes(q).includes('RELATIONSHIP_RESET@2:3')); assert.ok(codes(q).includes('EARLY_APPEARANCE@2:6'));
  assert.ok(q.issues.find(i => i.code === 'RELATIONSHIP_RESET').references[0].quote.includes('I’m Tia'));
});

test('P5-T04: finaluri identice reformulate sunt semnalate; motivul declarat intenționat este permis', () => {
  const a = base(); a.final_1.content.pages[11].text = 'At dusk Milo waved goodbye and went back home to his cosy nest.';
  assert.ok(codes(collectionQA({ bp: BP, art: a, project: { input: {} } })).includes('ENDING_REPEAT@1,2'));
  assert.ok(!codes(collectionQA({ bp: BP, art: a, project: { input: {} }, motifs: ['at dusk milo waved goodbye and went home to his nest'] })).some(c => c.startsWith('ENDING_REPEAT')), 'refrenul declarat nu este o repetiție accidentală');
});

test('P5-T04: deținătorul diferă între poveste și pagina de colorat; obiect dublat fără explicație; doi prieteni dorm în același cuib', () => {
  const a = base(); const p = a.final_0.content.pages[8];
  p.actions = [{ character: 'tia', action: 'holds the leaf stem in her mouth' }]; p.coloring_scene = 'Milo holds the leaf over both friends.';
  a.final_0.content.pages[6] = { ...a.final_0.content.pages[6], text: 'Now there were two pebbles!', objects: ['pebble'] };
  a.final_0.content.pages[11].final_locations = { milo: 'asleep in the fern nest', tia: 'asleep in the fern nest' };
  const q = collectionQA({ bp: BP, art: a, project: { input: {} } });
  assert.ok(codes(q).includes('PAIR_HOLDER_MISMATCH@1:9')); assert.ok(codes(q).includes('OBJECT_DUPLICATE@1:7')); assert.equal(q.issues.find(i => i.code === 'ENDING_LOCATIONS').severity, 'medium', 'formulare identică = ambiguitate de clarificat');
  a.final_0.content.pages[11].final_locations = { milo: 'asleep together in the same nest', tia: 'asleep together in the same nest' };
  assert.equal(collectionQA({ bp: BP, art: a, project: { input: {} } }).issues.find(i => i.code === 'ENDING_LOCATIONS').severity, 'high', 'prietenii care dorm împreună blochează (T15)');
  const fixed = base(); fixed.final_0.content.pages[6] = { ...fixed.final_0.content.pages[6], text: 'One pebble, two sparkles!', objects: ['pebble'], effects: 'natural: reflection in still water' };
  assert.ok(!codes(collectionQA({ bp: BP, art: fixed, project: { input: {} } })).some(c => c.startsWith('OBJECT_DUPLICATE')), 'reflexia explicată nu este un al doilea obiect');
});

test('P5-T04: livrarea este blocată de orice problemă mare nerezolvată din scopul ei; componenta lipsă blochează', () => {
  const a = base(); a.final_1.content.pages[2].text = 'A new friend peeked out. “I’m Tia!” she said.';
  const q = collectionQA({ bp: BP, art: a, project: { input: {} } });
  assert.equal(releaseIssues(q, 0).length, 0, 'volumul 1 nu este afectat'); assert.equal(releaseIssues(q, 1).length, 1); assert.ok(releaseIssues(q, null).length >= 1);
  const rc = releaseCheck({ input: { languages: ['English'] }, options: {} }, BP, a, 1, { approved: true, quality: releaseIssues(q, 1) });
  assert.equal(rc.eligible, false); assert.ok(rc.blockers.some(b => b.code === 'quality_relationship_reset' && b.scope.pages.includes(3)));
  assert.ok(rc.blockers.some(b => b.code === 'missing_artifact'), 'componentele lipsă (imagini, colorat) rămân blocaje');
});

test('P5-T04 Dinosaur World: DW01/DW02 cu referințe exacte; p7 aceeași pietricică (reflexie), p12 fiecare acasă; diferențierea V2–6 propusă', () => {
  const doc = JSON.parse([...readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')))].find(([k]) => k.endsWith('/project.json'))[1].toString());
  const q = collectionQA({ bp: doc.blueprint, art: doc.artifacts, project: doc.project });
  const dw01 = q.issues.find(i => i.code === 'PROJECTION_MISMATCH' && i.scope.volumes[0] === 1); assert.ok(dw01); assert.deepEqual(dw01.scope.pages, [8, 9]); assert.equal(dw01.references.length, 3);
  const dw02 = q.issues.find(i => i.code === 'TURN_CONTRACT_DIVERGENCE'); assert.equal(dw02.scope.pages.length, 8);
  assert.ok(!q.issues.some(i => ['OBJECT_DUPLICATE', 'ENDING_LOCATIONS', 'RELATIONSHIP_RESET', 'EARLY_APPEARANCE'].includes(i.code)), 'p7 reflexia și p12 casele proprii sunt corecte');
  assert.equal(q.differentiation.length, 6); assert.equal(new Set(q.differentiation.map(d => d.ending)).size, 6, 'finaluri diferite în planurile V2–6');
  assert.equal(q.collectionPass, false, 'colecția DW nu este gata (volume nescrise, artă lipsă)');
});

test('P5-T04 API: raportul de colecție este disponibil pe proiect', async () => {
  const id = (await api('GET', 'state')).body.projects.find(p => p.typeSlug === 'kids-sc')?.id; if (!id) return;
  const r = await api('GET', `projects/${id}/collection-qa`); assert.equal(r.status, 200); assert.equal(r.body.schema, 'wonderpages.collection-qa/1'); assert.equal(r.body.volumes.length, 6);
});
