// TEST-P4-T04 — același subiect la vârste diferite cu complexitate reală diferită, pagină fără text intenționată,
// idiom românesc natural, schimbare de voce și știință inexactă: manuscrisul dovedește scop → alegere → consecință;
// ediția nativă este aliniată pe pagini; dovezile sunt citabile; nimic nu se taie în tăcere.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, setFake, waitStatus, connectCanva, approveAll, INPUT, project } from './lib.mjs';
import { textMetrics, volumeMetrics, ageFit, causality, voice, science, localization, silentCuts, storyContract } from '../server/domain/story-contracts.js';
import { readZip } from '../server/security/safe-zip.js';
import { canonicalHash } from '../server/domain/canonical.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pages = (fn, n = 12) => Array.from({ length: n }, (_, i) => ({ n: i + 1, text: fn(i + 1), actions: [{ character: 'milo', action: 'walks' }], characters: ['milo'] }));
const codes = r => r.findings.map(f => f.code);
const PLOT = {
  '3-4': n => `Milo sees a leaf. It is shiny. Swish! Milo smiles.`,
  '5-6': n => `Milo spots a shiny leaf by the path, and he wonders who lost it. “Is it yours?” he asks Tia, who shakes her head.`,
  '7-8': n => `When Milo noticed the shimmering leaf trembling beside the winding path, he wondered which neighbour had dropped it. Carefully, he carried it toward the meadow where everyone gathered after breakfast.`
};

test('P4-T04: același subiect la trei vârste are complexitate reală diferită; textul de 7-8 ani este semnalat pentru 3-4 ani (fără plafon rigid)', () => {
  const m = Object.fromEntries(Object.entries(PLOT).map(([band, f]) => [band, volumeMetrics(pages(f))]));
  assert.ok(m['3-4'].avgSentence < m['5-6'].avgSentence && m['5-6'].avgSentence < m['7-8'].avgSentence, JSON.stringify(Object.values(m).map(x => x.avgSentence)));
  assert.ok(m['3-4'].longWordShare < m['7-8'].longWordShare);
  assert.deepEqual(ageFit(pages(PLOT['3-4']), '3-4').findings, []);
  assert.ok(codes(ageFit(pages(PLOT['7-8']), '3-4')).includes('AGE_COMPLEXITY'));
  assert.deepEqual(codes(ageFit(pages(PLOT['7-8']), '7-8')).filter(c => c === 'AGE_COMPLEXITY'), []);
  const over = ageFit(pages(PLOT['5-6']), '5-6', { word_budget: { min: 100, max: 150 } });
  assert.ok(over.findings.every(f => f.severity !== 'blocker'), 'bugetul este orientativ, nu un plafon'); assert.ok(over.findings.some(f => f.code === 'BUDGET_GUIDANCE' && /nu se taie/.test(f.message)));
});

test('P4-T04: pagina fără text intenționată este permisă; o pagină goală neintenționată în ediția nativă este blocată', () => {
  const src = { pages: pages(n => `Milo walks on page ${n}.`) }; src.pages[5] = { n: 6, text: '', page_type: 'wordless' };
  assert.deepEqual(volumeMetrics(src.pages).wordless, [6]);
  const tr = { pages: src.pages.map(p => ({ n: p.n, text: p.text ? `Milo merge pe pagina ${p.n}.` : '' })) };
  assert.deepEqual(localization(src, tr, { names: ['Milo'] }).findings, []);
  tr.pages[2].text = '';
  assert.ok(localization(src, tr, { names: ['Milo'] }).findings.some(f => f.code === 'TR_EMPTY' && f.page === 3 && f.severity === 'blocker'));
});

test('P4-T04: idiom românesc natural — calcuri, cuvinte netraduse, nume schimbate și pagini nealiniate', () => {
  const src = { pages: pages(n => `Milo finds a leaf on page ${n}.`) }, ok = { pages: src.pages.map(p => ({ n: p.n, text: `Milo găsește o frunză lucioasă.` })) };
  assert.deepEqual(localization(src, ok, { names: ['Milo'] }).findings, []);
  const bad = structuredClone(ok); bad.pages[0].text = 'Asta face sens, spune Milo.'; bad.pages[1].text = 'Milo găsește the frunză.'; bad.pages[2].text = 'Mila găsește o frunză.'; bad.pages[3].text = 'Milo și Tia au avut un timp bun.';
  const f = localization(src, bad, { names: ['Milo'] }).findings;
  assert.ok(f.some(x => x.code === 'TR_CALQUE' && x.page === 1 && /are sens/.test(x.message)));
  assert.ok(f.some(x => x.code === 'TR_UNTRANSLATED' && x.page === 2 && x.quote === 'the'));
  assert.ok(f.some(x => x.code === 'TR_NAME' && x.page === 3)); assert.ok(f.some(x => x.code === 'TR_CALQUE' && x.page === 4));
  const short = { pages: ok.pages.slice(0, 11) }; assert.ok(localization(src, short, { names: ['Milo'] }).findings.some(x => x.code === 'TR_MISALIGNED' && x.severity === 'blocker'));
});

test('P4-T04: schimbare de voce și de timp; replicile între ghilimele nu contează', () => {
  const p = pages(n => `Milo walked to the pond. He saw a frog and said hello. “I am Milo!” he said.`);
  assert.deepEqual(voice(p).findings, [], 'persoana I din dialog nu este o schimbare de narator');
  p[6].text = 'I ran to my nest and I hid my pebble under my blanket.';
  assert.ok(codes(voice(p)).includes('VOICE_SWITCH'));
  const t = pages(n => `Milo was happy. He went to the pond and said hello.`); t[4].text = 'Milo is happy. He goes to the pond and says hello.';
  assert.ok(codes(voice(t)).includes('TENSE_SWITCH'));
});

test('P4-T04: știință inexactă și regula lumii (T18), cu citat și corectură', () => {
  const p = pages(n => `Milo walks.`); p[2].text = 'Pip, the flying dinosaur, landed on a branch.'; p[3].text = 'Cavemen waved at the dinosaurs.'; p[4] = { ...p[4], text: 'The pebble shone with a magic glow.' };
  const f = science(p, { world: 'natural' }).findings;
  assert.ok(f.some(x => x.rule === 'pterosaur-dinosaur' && x.page === 3 && /Pterozaurii nu sunt dinozauri/.test(x.message)));
  assert.ok(f.some(x => x.rule === 'humans-dinosaurs' && x.page === 4)); assert.ok(f.some(x => x.code === 'T18_WORLD' && x.page === 5 && x.quote));
  const fantasy = science(p, { world: 'fantasy' }).findings; assert.ok(!fantasy.some(x => x.code === 'T18_WORLD' || x.rule === 'humans-dinosaurs'), 'o lume fantastică declarată permite magia');
});

test('P4-T04: lanțul scop → alegere → consecință cu citate exacte; ordine, protagonist, lipsă', () => {
  const s = { pages: pages(n => `Milo and Tia find a gentle surprise on page ${n}.`), story_bible: { goal: 'g', climax_choice: 'c', resolution: 'r', causality: { goal: { page: 1, quote: 'surprise on page 1' }, choice: { page: 7, quote: 'surprise on page 7' }, consequence: { page: 11, quote: 'surprise on page 11' } } } };
  const ok = causality(s, { mainId: 'milo', mainName: 'Milo' }); assert.equal(ok.mode, 'declared'); assert.deepEqual(ok.findings, []); assert.equal(ok.links.choice.page, 7); assert.equal(ok.links.choice.exact, true);
  const q = structuredClone(s); q.story_bible.causality.goal.quote = 'un citat inventat'; assert.ok(codes(causality(q, { mainId: 'milo' })).includes('CAUSALITY_QUOTE'));
  const o = structuredClone(s); o.story_bible.causality.choice.page = 12; assert.ok(causality(o, { mainId: 'milo' }).findings.some(f => f.code === 'CAUSALITY_ORDER' && f.severity === 'blocker'));
  const np = structuredClone(s); np.pages[6] = { n: 7, text: 'Tia decides alone: surprise on page 7.', actions: [{ character: 'tia', action: 'decides' }], characters: ['tia'] };
  assert.ok(codes(causality(np, { mainId: 'milo', mainName: 'Milo' })).includes('CHOICE_NOT_PROTAGONIST'));
  const none = { pages: pages(n => `Ferns sway.`), story_bible: { goal: 'găsește proprietarul penei', climax_choice: 'ascultă prietenul timid', resolution: 'înapoiază pana' } };
  assert.ok(causality(none, { mainId: 'milo' }).findings.some(f => f.code === 'CAUSALITY_UNPROVEN' && f.severity === 'blocker'));
});

test('P4-T04: nicio tăiere tăcută între scenariu și text final (o notă explicită o permite)', () => {
  const a = { pages: pages(n => 'Milo walked slowly along the path and looked at every shiny pebble he could find there.') };
  const b = structuredClone(a); b.pages[3].text = 'Milo walked.';
  assert.ok(silentCuts(a, b).findings.some(f => f.code === 'TEXT_CUT' && f.page === 4));
  b.pages[3].cut_note = 'redus la cererea editorului'; assert.deepEqual(silentCuts(a, b).findings, []);
});

test('P4-T04 Dinosaur World V1: EN 335 / RO 344 cuvinte păstrate până la review; ediția RO aliniată pe pagini; nimic rescris', () => {
  const files = readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')));
  const doc = JSON.parse([...files.entries()].find(([n]) => n.endsWith('project.json'))[1].toString('utf8'));
  const before = canonicalHash(doc.artifacts);
  const s0 = doc.artifacts.script_0.content;
  assert.equal(volumeMetrics(s0.pages).totalWords, 335);
  const ro = { pages: s0.pages.map(p => ({ n: p.n, text: p.text_ro })) }; assert.equal(volumeMetrics(ro.pages).totalWords, 344);
  assert.ok(!localization(s0, ro, { names: ['Milo', 'Tia', 'Pip'] }).findings.some(f => f.severity === 'blocker'), 'ediția RO este aliniată pe cele 12 pagini');
  const r = storyContract({ bp: doc.blueprint, art: doc.artifacts, input: doc.project.input, v: 0 });
  assert.equal(r.band, '3-4'); assert.equal(r.world, 'natural'); assert.equal(r.summary.blockers, 0, JSON.stringify(r.findings));
  assert.ok(['goal', 'choice', 'consequence'].every(k => r.causality.links[k]?.page), 'dovezi pe pagini pentru fiecare legătură (deduse, marcate ca atare)'); assert.equal(r.causality.mode, 'inferred');
  assert.equal(canonicalHash(doc.artifacts), before, 'contractul doar citește: premisele se schimbă numai după o propunere de canon');
});

test('P4-T04 API: la revizuirea volumului contractul poveștii este un element cu dovezi; ruta îl expune', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Poveste P4' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']); await approveAll(id);
  await waitStatus(id, ['awaiting_review']); const d = await project(id); assert.equal(d.project.gate.key, 'review_1');
  const it = d.review.items.find(i => i.kind === 'story'); assert.ok(it, 'elementul contractului de poveste există');
  assert.equal(it.story.causality.mode, 'declared'); assert.equal(it.story.causality.links.choice.page, 7); assert.equal(it.blocked, false, JSON.stringify(it.story.findings));
  const r = await api('GET', `projects/${id}/story/1`); assert.equal(r.status, 200); assert.equal(r.body.volume, 1);
  assert.equal((await api('GET', `projects/${id}/story/9`)).status, 400);
  await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});
