import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fingerprint, pageSequence, rubricEvaluation, visualVerdicts, exactCorrection, parseExactCorrection } from '../server/contracts.js';
import { gateItems, gateSummary, volumeApproved, runPreflight, lintScript } from '../server/engine.js';
const bp = JSON.parse(fs.readFileSync(new URL('./mocks/legacy-blueprint-v14.json', import.meta.url)));
test('v03: nicio lipsă nu poate fi aprobată implicit', () => {
  const p = { input: { second_language: 'Romanian' }, options: { images: true } }, gate = { key: 'review_2', vol: 0 };
  const art = { final_0: { content: { pages: Array.from({ length: 12 }, (_, i) => ({ n: i + 1, text: 'Text.' })) } } };
  const items = gateItems(bp, art, p, gate); assert.equal(items.length, 50); assert.equal(items.filter(i => i.missing).length, 38);
  p.approvals = { 'review_2@0': Object.fromEntries(items.map(i => [i.id, { state: 'approved', hash: i.hash }])) };
  assert.equal(gateSummary(gateItems(bp, art, p, gate)).done, false);
});
test('v03: aprobare închisă cu conținut schimbat refuză livrarea', () => {
  const small = { structure: { pages: 1, volumes: 1 }, gates: { review: { items: [{ kind: 'text', source: 'final' }] } }, stages: [{ key: 'review', gate: 'review', handler: 'review_gate' }] };
  const p = { status: 'completed', stages: { review: { status: 'done' } }, input: {}, approvals: {} }, art = { final_null: { content: { pages: [{ n: 1, text: 'Prima versiune.' }] } } };
  const i = gateItems(small, art, p, { key: 'review', vol: null })[0]; p.approvals['review@c'] = { [i.id]: { hash: i.hash, state: 'approved' } };
  assert.equal(volumeApproved(p, small, null, art), true); art.final_null.content.pages[0].text = 'Alt text.';
  assert.equal(volumeApproved(p, small, null, art), false);
});
test('v03: critică incompletă, duplicată și necunoscută nu trece', () => {
  assert.equal(rubricEvaluation({ criteria: [{ code: 'UNKNOWN', score: 10, evidence: 'x' }] }, bp, {}, 8).pass, false);
  const criteria = bp.rubric.map(r => ({ code: r.code, score: 9, evidence: 'Pagina 2: acțiunea protagonistului.' }));
  assert.equal(rubricEvaluation({ criteria }, bp, {}, 8).pass, true);
  assert.equal(rubricEvaluation({ criteria: [...criteria, criteria[0]] }, bp, {}, 8).pass, false);
  assert.equal(rubricEvaluation({ criteria: criteria.map(c => ({ ...c, score: c.code === 'T01' ? 5 : 9 })) }, bp, {}, 8).pass, false);
});
test('v03: QA vizual cere mapare și toate dimensiunile', () => {
  assert.throws(() => visualVerdicts({}, [3])); assert.throws(() => visualVerdicts({ pages: [{ image: 3, ok: true }] }, [3]));
  const r = { image: 3, ok: false, anatomy: false, action: true, story: true, readability: true, issues: ['pete greșite'] };
  assert.equal(visualVerdicts({ pages: [r] }, [3])[0].ok, false);
  assert.throws(() => visualVerdicts({ pages: [r, r] }, [3, 4]));
});
test('v03: numerotare unică, pagină fără text numai intenționat', () => {
  assert.equal(pageSequence([{ n: 1 }, { n: 1 }], 2), false);
  const E = { bp: { structure: { pages: 2 }, lint: {} }, art: {}, project: { input: {} } };
  assert.ok(lintScript(E, { pages: [{ n: 1, text: 'a' }, { n: 1, text: 'b' }] }, {}).hard.length);
  assert.equal(lintScript(E, { pages: [{ n: 1, text: 'a' }, { n: 2, text: '', page_type: 'wordless' }] }, {}).hard.length, 0);
});
test('v03: înlocuire exactă locală și refuzul ambiguității', () => {
  const c = parseExactCorrection('Înlocuiește „băltoacă” cu „baltă”.'); assert.deepEqual(c, { from: 'băltoacă', to: 'baltă' });
  assert.equal(exactCorrection('Milo sare în băltoacă.', c), 'Milo sare în baltă.');
  assert.throws(() => exactCorrection('băltoacă și băltoacă', c)); assert.throws(() => exactCorrection('Alt text.', c));
});
test('v03: amprenta detectează schimbări cu aceeași lungime', () => assert.notEqual(fingerprint({ text: 'Milo' }), fingerprint({ text: 'Tiao' })));
