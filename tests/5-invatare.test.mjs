// Versiunea 19, testate direct pe module (fără server): competiția de variante (3.7), pragurile calibrate (3.8),
// evaluarea pe criterii (1.7), verificarea de structură (2.1), alinierea EN–RO (2.4), schemele (1.3).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Learning from '../server/learning.js';
import * as Ledger from '../server/ledger.js';
import { validateSchema, schemaFor } from '../server/schemas.js';
import { evaluateCritique, lintScript, alignWarnings } from '../server/engine.js';

const mem = () => { const d = {}; return { readJSON: async (k, f) => (k in d ? JSON.parse(JSON.stringify(d[k])) : f), writeJSON: async (k, v) => { d[k] = JSON.parse(JSON.stringify(v)); } }; };
const S = mem();
await Ledger.initLedger(S); await Learning.initLearning(S, async () => ({})); await Learning.loadThresholds();

test('3.7: competiția de variante se încheie cu un câștigător; varianta nouă concurează cu el', async () => {
  for (let i = 0; i < 14; i++) await Learning.rewardVariant('scripts', 'script', i < 13);
  for (let i = 0; i < 14; i++) await Learning.rewardVariant('scripts', 'script_b', i < 5);
  const d = Learning.competitionDecisions().find(x => x.stage === 'scripts');
  assert.ok(d, 'decizie luată'); assert.equal(d.winner, 'script'); assert.deepEqual(d.retired, ['script_b']);
  for (let i = 0; i < 20; i++) assert.notEqual(Learning.chooseVariant('scripts', ['script', 'script_b']), 'script_b', 'varianta retrasă nu mai e aleasă');
  const picks = new Set(Array.from({ length: 60 }, () => Learning.chooseVariant('scripts', ['script', 'script_b', 'script_c'])));
  assert.ok(picks.has('script_c'), 'o variantă nouă intră în competiție');
  await Learning.resetCompetition('scripts'); assert.ok(!Learning.competitionDecisions().some(x => x.stage === 'scripts'));
});

test('3.7: fără diferență clară nu se decide nimic', async () => {
  for (let i = 0; i < 12; i++) { await Learning.rewardVariant('polish#model', 'sonnet', i % 2 === 0); await Learning.rewardVariant('polish#model', 'haiku', i % 2 === 1); }
  assert.ok(!Learning.competitionDecisions().some(x => x.stage === 'polish#model'));
});

test('3.8: pragul editorului propus din deciziile tale (minimum 10 volume)', async () => {
  const t0 = Date.now() - 1e6;
  for (let i = 0; i < 12; i++) {
    const score = 7 + (i % 4) * 0.5;                   // 7, 7.5, 8, 8.5
    Ledger.record({ kind: 'quality', pid: 'px' + i, vol: 0, stage: 'critic', round: 0, age: '3-4', score, criteria: {} });
    Ledger.record({ kind: 'gate', pid: 'px' + i, vol: 0, gate: 'review_1', round: 1, firstPass: score >= 7.5 });
  }
  const p = Learning.thresholdProposals().find(x => x.age === '3-4');
  assert.equal(p.samples, 12); assert.equal(p.current, 8); assert.equal(p.proposed, 7.5);
  await Learning.setThreshold('3-4', 'critic', 7.5); assert.equal(Learning.thresholdFor('3-4', 'critic', 8), 7.5);
  await assert.rejects(Learning.setThreshold('3-4', 'critic', 12));
});

test('1.7: nota se calculează din criterii; criteriile critice au prag propriu', () => {
  const bp = { rubric: [{ code: 'T01', critical: true }, { code: 'T02' }, { code: 'T07', critical: true }] };
  let e = evaluateCritique({ criteria: [{ code: 'T01', score: 9 }, { code: 'T02', score: 9 }, { code: 'T07', score: 6 }] }, bp, {}, 8);
  assert.equal(e.score, 8); assert.deepEqual(e.failedCritical, ['T07']); assert.equal(e.pass, false);
  e = evaluateCritique({ score: 8.5 }, bp, {}, 8); assert.equal(e.pass, true, 'formatul vechi (o singură notă) funcționează');
});

test('2.1: verificarea de structură găsește erorile mecanice', () => {
  const E = { bp: { structure: { pages: 3 }, lint: { forbidden_words: { '*': ['dead'] } }, variant_key: 'target_age' }, project: { input: { target_age: '3-4' } }, art: { bible: { content: { characters: [{ id: 'milo' }, { id: 'tia' }] } } } };
  const c = { pages: [{ n: 1, text: 'Milo plays.', characters: ['milo'] }, { n: 2, text: '', characters: ['rex'] }, { n: 3, text: 'The dead leaves fall. '.repeat(30), characters: ['tia'] }] };
  const r = lintScript(E, c, { age_profile: { max_chars: 100 }, cast_volume: [{ id: 'milo' }] });
  assert.ok(r.hard.some(x => x.page === 2 && /no text/.test(x.problem))); assert.ok(r.hard.some(x => x.page === 2 && /Unknown/.test(x.problem)));
  assert.ok(r.hard.some(x => x.page === 3 && x.code === 'T08')); assert.ok(r.soft.some(x => /dead/.test(x))); assert.ok(r.soft.some(x => /tia is not in the cast/.test(x)));
});

test('2.4: alinierea EN–RO: nume schimbate și lungimi foarte diferite', () => {
  const E = { art: { bible: { content: { characters: [{ name: 'Milo' }] } } } };
  const w = alignWarnings(E, { pages: [{ n: 1, text: 'Milo finds a shiny leaf in the meadow.' }, { n: 2, text: 'He smiles at the sun and the clouds.' }] }, { pages: [{ n: 1, text: 'Milu găsește o frunză strălucitoare pe pajiște.' }, { n: 2, text: 'Zâmbește.' }] });
  assert.ok(w.some(x => /Page 1: the name "Milo"/.test(x))); assert.ok(w.some(x => /Page 2: length/.test(x)));
});

test('1.3: schemele înlocuiesc numărul de pagini și validează', () => {
  const bp = { schemas: { script: { type: 'object', required: ['pages'], properties: { pages: { type: 'array', minItems: '{{structure.pages}}', maxItems: '{{structure.pages}}', items: { type: 'object', required: ['n', 'text'], properties: { text: { type: 'string', minLength: 1 } } } } } }, script_b: 'script' } };
  const s = schemaFor(bp, 'script_b', { structure: { pages: 2 } }); assert.equal(s.properties.pages.minItems, 2);
  assert.match(validateSchema({ pages: [{ n: 1, text: 'a' }] }, s), /exactly 2/);
  assert.match(validateSchema({ pages: [{ n: 1, text: 'a' }, { n: 2, text: ' ' }] }, s), /must not be empty/);
  assert.equal(validateSchema({ pages: [{ n: 1, text: 'a' }, { n: 2, text: 'b' }] }, s), null);
});
