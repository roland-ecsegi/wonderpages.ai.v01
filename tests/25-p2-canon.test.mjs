// TEST-P2-T02 — schimbare semantică p7, typo exact p7, landmark de canon, prima apariție a unui obiect:
// dependenți exacți, frați neafectați, un singur canon autoritar, impact propagat până la livrare; DW01/DW02 detectate.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, INPUT, ROOT } from './lib.mjs';
import { buildGraph, impactOf, textArtifactChanges, canonChanges, classifyPageChange } from '../server/domain/dependencies.js';
import { canonConflicts, canonRevision, projections, proposeCanonChange, AUTHORITY } from '../server/domain/canon.js';
import { readDinosaurWorld } from '../server/migration/dw-reference.js';
import { canonicalHash } from '../server/domain/canonical.js';

const dw = readDinosaurWorld(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')));
const bp = dw.doc.blueprint, art = dw.doc.artifacts, s0 = art.script_0.content, graph = buildGraph(bp, art);
const pageNodes = (list, v, p) => list.filter(n => new RegExp(`:${v}:${p}$`).test(n));
const impactFor = after => impactOf(graph, textArtifactChanges('script_0', s0, after), bp);

test('P2-T02: typo exact p7 → textul, macheta și livrarea; arta și scena NU; paginile vecine neatinse', () => {
  const after = structuredClone(s0); after.pages[6].text = after.pages[6].text.replace('pebble', 'pebbel');
  assert.equal(classifyPageChange(s0.pages[6], after.pages[6]), 'exact_typo');
  const i = impactFor(after);
  assert.deepEqual(i.changed, ['text:0:7']);
  assert.deepEqual(i.stale, ['book:0', 'delivery:0', 'layout:0:7']);
  assert.deepEqual(i.revalidate, ['qa:text:0', 'qa:visual:0:7', 'tr:0:7']);
  assert.ok(!i.stale.some(n => /^(color|line|scene):/.test(n)), 'arta bună rămâne pentru un typo');
  assert.ok(i.unaffectedPages.includes('0:6') && i.unaffectedPages.includes('0:8') && i.unaffectedPages.includes('1:7'));
  assert.deepEqual(i.regenerates, []);
});

test('P2-T02: rescriere semantică p7 (scena neschimbată) → adaptarea și QA text–imagine expirate, arta doar reverificată prin QA', () => {
  const after = structuredClone(s0); after.pages[6].text = 'Milo and Tia counted the shiny drops together, slowly, one by one.';
  const i = impactFor(after);
  assert.deepEqual(i.changed, ['text:0:7']);
  for (const n of ['tr:0:7', 'layout:0:7', 'qa:visual:0:7', 'qa:text:0', 'book:0', 'delivery:0']) assert.ok(i.stale.includes(n), n);
  assert.ok(!i.stale.includes('color:0:7') && !i.stale.includes('line:0:7'));
  assert.deepEqual([...pageNodes(i.stale, 0, 6), ...pageNodes(i.stale, 0, 8)], []);
});

test('P2-T02: schimbare de scenă p7 → culoare + lineart + QA expirate doar pe p7', () => {
  const after = structuredClone(s0); after.pages[6].scene = after.pages[6].scene + ' Now at dusk.';
  const i = impactFor(after);
  assert.deepEqual(i.changed, ['scene:0:7', 'text:0:7']);
  for (const n of ['color:0:7', 'line:0:7', 'qa:visual:0:7', 'layout:0:7', 'book:0', 'delivery:0']) assert.ok(i.stale.includes(n), n);
  assert.deepEqual([...pageNodes(i.stale, 0, 6), ...pageNodes(i.stale, 0, 8)], []);
});

test('P2-T02: landmark de canon (Milo) → toate scenele cu Milo; niciun text; toate livrările (canonul e în amprentă)', () => {
  const nb = structuredClone(art.bible.content); nb.characters.find(c => c.id === 'milo').visual_landmarks[0].colour = '#123456';
  const ch = canonChanges(art.bible.content, nb);
  assert.deepEqual(ch.map(c => c.node), ['canon:character:milo', 'canon:bible']);
  const i = impactOf(graph, ch, bp);
  const miloPages = s0.pages.filter(p => p.characters.includes('milo')).map(p => `color:0:${p.n}`);
  for (const n of miloPages) assert.ok(i.stale.includes(n), n);
  assert.ok(!i.stale.some(n => n.startsWith('text:') || n.startsWith('tr:')), 'textul nu este atins');
  for (let v = 0; v < 6; v++) assert.ok(i.stale.includes(`delivery:${v}`));
});

test('P2-T02: prima apariție a obiectului mutată → conflicte de continuitate exacte, scenele reverificate', () => {
  const nb = structuredClone(art.bible.content); nb.objects.find(o => o.id === 'shiny-pebble').introduced = 'volumul 1, pagina 5';
  const prop = proposeCanonChange(bp, art, nb);
  assert.deepEqual(prop.changes.find(c => c.node === 'canon:object:shiny-pebble').detail.firstAppearance, { before: 'volumul 1, pagina 2', after: 'volumul 1, pagina 5' });
  assert.deepEqual(prop.conflicts.map(c => c.page), ['0:2', '0:3', '0:4']);
  assert.ok(prop.impact.revalidate.includes('scene:0:2') && !prop.impact.stale.includes('color:0:2'), 'obiectul semantic: reverificare, nu regenerare');
  assert.equal(prop.status, 'pending'); assert.equal(prop.requiresDecision, true);
  assert.equal(canonicalHash(art.bible.content) === prop.proposedHash, false); assert.equal(prop.baseCanonHash, canonRevision(art).hash);
});

test('P2-T02: determinism și un singur canon autoritar per fapt', () => {
  const after = structuredClone(s0); after.pages[6].text += ' Plip!';
  assert.equal(JSON.stringify(impactFor(after)), JSON.stringify(impactFor(structuredClone(after))));
  assert.equal(buildGraph(bp, art).hash, graph.hash);
  const facts = AUTHORITY.map(a => a.fact); assert.equal(new Set(facts).size, facts.length);
  assert.ok(AUTHORITY.every(a => typeof a.authority === 'string' && a.authority.length));
});

test('P2-T02: DW01/DW02 detectate fără modificarea conținutului; scenele bune păstrate', () => {
  const before = canonicalHash(art);
  const findings = dw.findings.filter(f => f.id === 'DW01').map(f => ({ ...f, source: 'dw-reference' }));
  const c = canonConflicts(bp, art, findings);
  const turn = c.find(x => x.id === 'turn-type@v1'); assert.equal(turn.kind, 'dual_authority'); assert.equal(turn.count, 8); assert.equal(turn.requiresDecision, true);
  assert.ok(c.some(x => x.kind === 'unverified_projection' && x.field === 'series.volumes[0].summary'), 'DW01 structural: rezumat neverificat față de manuscris');
  assert.ok(c.some(x => x.kind === 'semantic_conflict' && x.id === 'finding:DW01'), 'DW01 semantic din registrul de referință');
  assert.ok(!c.some(x => x.id === 'volume-bible@v1'), 'diferența doar de etichetă workflow nu este conflict de canon');
  assert.equal(projections(art).find(p => p.field === 'script_0.story_bible').status, 'identical_copy');
  assert.equal(canonicalHash(art), before, 'detecția nu rescrie nimic');
});

test('P2-T02 API: preview de impact, editarea întoarce impactul, canon și propuneri', async () => {
  const p = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Canon API' } }); const pid = p.body.id;
  const pages = Array.from({ length: 12 }, (_, i) => ({ n: i + 1, text: `Page ${i + 1} text about Milo.`, scene: `Scene ${i + 1}`, characters: ['milo'] }));
  let r = await api('POST', `projects/${pid}/artifacts/final_0`, { content: { pages } }); assert.equal(r.status, 200);
  const edited = structuredClone(pages); edited[6].text = 'Page 7 text abuot Milo.';
  const pre = await api('POST', `projects/${pid}/impact`, { key: 'final_0', content: { pages: edited } });
  assert.deepEqual(pre.body.changed, ['text:0:7']); assert.ok(!pre.body.stale.some(n => n.startsWith('color:')));
  r = await api('POST', `projects/${pid}/artifacts/final_0`, { content: { pages: edited } }); assert.deepEqual(r.body.impact.changed, ['text:0:7']);
  const canon = await api('GET', `projects/${pid}/canon`); assert.equal(canon.status, 200); assert.ok(Array.isArray(canon.body.conflicts));
  const prop = await api('POST', `projects/${pid}/canon/proposals`, { bible: { characters: [{ id: 'milo', visual: 'teal' }] }, reason: 'test' });
  assert.equal(prop.status, 200); assert.equal(prop.body.status, 'pending');
  assert.equal((await api('GET', `projects/${pid}/canon`)).body.proposals.length, 1);
  await api('POST', `projects/${pid}/archive`, { archived: true });
});
