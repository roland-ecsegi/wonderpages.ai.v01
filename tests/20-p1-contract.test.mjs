// TEST-P1-T01 — ProductContract 6×2×12, ediții, refuzul structurilor invalide și maparea explicită KDP legacy (ADR04).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { api, zip, INPUT, project } from './lib.mjs';
import { contractFromBlueprint, validateContract, validateProjectInput, editionsFor, profileCompatibility, KDP_MIN_INTERIOR_PAGES } from '../server/domain/product-contract.js';
import { canonicalHash } from '../server/domain/canonical.js';

const BP = JSON.parse(fs.readFileSync(new URL('../blueprints/kids-sc.json', import.meta.url)));
const V14 = JSON.parse(fs.readFileSync(new URL('./mocks/legacy-blueprint-v14.json', import.meta.url)));
const V15 = JSON.parse(fs.readFileSync(new URL('./mocks/legacy-blueprint-v15.json', import.meta.url)));   // snapshot before P4-T02 (v16)
const variant = mutate => { const b = structuredClone(BP); mutate(b); return b; };
const codes = bp => validateContract(contractFromBlueprint(bp)).errors.map(e => e.code);

test('P1-T01: contractul curent kids-sc este valid, cu hash stabil la ordinea cheilor', () => {
  const c = contractFromBlueprint(BP);
  assert.deepEqual(validateContract(c), { valid: true, errors: [] });
  assert.equal(c.structure.volumes, 6); assert.equal(c.structure.contentPagesPerBook, 12);
  assert.deepEqual(c.components.map(x => x.key), ['story', 'coloring']);
  assert.deepEqual(c.ageBands, ['3-4', '5-6', '7-8']);
  const reordered = Object.fromEntries(Object.entries(BP).reverse());
  assert.equal(contractFromBlueprint(reordered).contractHash, c.contractHash, 'ordinea cheilor nu schimbă amprenta');
  assert.equal(canonicalHash({ a: 1, b: [2, { d: 1, c: 2 }] }), canonicalHash({ b: [2, { c: 2, d: 1 }], a: 1 }));
});

test('P1-T01: 5/7 volume, 11/13 pagini și componentă lipsă sunt refuzate', () => {
  assert.ok(codes(variant(b => { b.structure.volumes = 5; })).includes('VOLUMES'));
  assert.ok(codes(variant(b => { b.structure.volumes = 7; })).includes('VOLUMES'));
  assert.ok(codes(variant(b => { b.structure.pages = 11; })).includes('PAGES'));
  assert.ok(codes(variant(b => { b.structure.pages = 13; })).includes('PAGES'));
  assert.ok(codes(variant(b => { b.structure.books = b.structure.books.filter(x => x.key !== 'coloring'); })).includes('COMPONENT_MISSING'));
  assert.ok(codes(variant(b => { b.structure.books.push({ key: 'comic', mode: 'color' }); })).includes('COMPONENT_UNKNOWN'));
  assert.ok(codes(variant(b => { b.structure.books[1].per_language = true; })).includes('COLORING_LANGUAGE'));
  assert.ok(codes(variant(b => { b.input_schema.fields.find(f => f.key === 'target_age').options.push({ value: '9-10' }); })).includes('AGE_BANDS'));
  assert.ok(codes(variant(b => { b.slug = 'animation'; })).includes('PRODUCT_TYPE_NOT_ALLOWED'), 'RK27/RK26: niciun alt Product Type în P1–P8');
});

test('P1-T01: limbi multiple = ediții ale aceleiași cărți, nu Product Types noi', () => {
  const c = contractFromBlueprint(BP), e = editionsFor(c, ['English', 'Romanian']);
  assert.equal(e.productTypes, 1); assert.equal(e.story, 12); assert.equal(e.coloring, 6); assert.equal(e.total, 18);
  assert.equal(editionsFor(c, ['English']).total, 12);
  assert.ok(validateProjectInput(c, { target_age: '5-6', languages: ['English', 'Romanian'] }).valid);
  assert.deepEqual(validateProjectInput(c, { target_age: '9-10', languages: ['English', 'English', 'Klingon'] }).errors.map(x => x.code), ['AGE_BAND', 'LANGUAGES_DUPLICATE', 'LANGUAGE_UNKNOWN']);
});

test('P1-T01/ADR04: strict12 nu primește KDP-ready; profilul KDP legacy are mapare explicită 28/26', () => {
  const c = contractFromBlueprint(BP);
  const digital = c.renderingProfiles.find(p => p.key === 'digital'), kdp = c.renderingProfiles.find(p => p.key === 'kdp');
  assert.equal(digital.semantics, 'strict12'); assert.deepEqual(digital.physicalPages, { story: 14, coloring: 14 });
  assert.equal(kdp.semantics, 'legacy-scene-expansion'); assert.deepEqual(kdp.physicalPages, { story: 28, coloring: 26 });
  assert.equal(kdp.explicitOptIn, true); assert.equal(kdp.canonicalContentPages, 12, 'canonul rămâne 12');
  const mapped = kdp.pageMap.story.filter(x => x.canonical).map(x => x.canonical);
  assert.deepEqual([...new Set(mapped)], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'fiecare pagină fizică trimite la pagina canonică');
  const strict = profileCompatibility(c, 'digital', 'kdp_paperback');
  assert.equal(strict.compatible, false); assert.equal(strict.ready, false); assert.equal(strict.status, 'incompatible');
  assert.ok(KDP_MIN_INTERIOR_PAGES > 14);
  const legacy = profileCompatibility(c, 'kdp');
  assert.equal(legacy.ready, false); assert.equal(legacy.status, 'requires_explicit_opt_in');
  for (const p of c.renderingProfiles) assert.equal(profileCompatibility(c, p.key).ready, false, 'niciun profil nu devine ready fără măsurători');
});

test('P1-T01: snapshoturile v14/v15 și versiunea curentă rămân identificabile și valide', () => {
  const c14 = contractFromBlueprint(V14), c15 = contractFromBlueprint(V15), cur = contractFromBlueprint(BP);
  assert.ok(validateContract(c15).valid && validateContract(cur).valid); assert.ok(cur.blueprintVersion >= 16); assert.notEqual(c15.blueprintHash, cur.blueprintHash);
  assert.ok(validateContract(c14).valid);
  assert.equal(c14.blueprintVersion, 14); assert.equal(c15.blueprintVersion, 15);
  assert.notEqual(c14.blueprintHash, c15.blueprintHash);
  assert.deepEqual(c14.renderingProfiles.map(p => p.key), ['digital', 'print'], 'v14 nu primește retroactiv profilul KDP');
});

test('P1-T01 API: importul cu structură invalidă este refuzat explicit, fără proiect parțial', async () => {
  const before = (await api('GET', 'state')).body.projects?.length;
  for (const mutate of [b => { b.structure.volumes = 5; }, b => { b.structure.pages = 13; }, b => { b.structure.books = [b.structure.books[0]]; }]) {
    const doc = { format: 'wonderpages-project', version: 1, project: { id: 'x', title: 'Contract invalid', status: 'ready', input: INPUT }, blueprint: variant(mutate), artifacts: {} };
    const r = await api('POST', 'projects/import', zip([{ name: 'p/project.json', data: JSON.stringify(doc) }]), { headers: { 'content-type': 'application/octet-stream' } });
    assert.equal(r.status, 422); assert.equal(r.body.code, 'contract_invalid'); assert.ok(r.body.errors.length >= 1);
  }
  assert.equal((await api('GET', 'state')).body.projects?.length, before, 'niciun proiect creat');
});

test('P1-T01 API: proiect nou are referința contractului; raportul expune edițiile', async () => {
  const bad = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, target_age: '9-10' } });
  assert.ok(bad.status >= 400, 'vârsta din afara benzilor este refuzată');
  const r = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Contract P1' } });
  assert.equal(r.status, 200);
  const d = await project(r.body.id);
  assert.match(d.project.contractRef.contractHash, /^[0-9a-f]{64}$/); const type = (await api('GET', 'state')).body.types.find(t => t.slug === 'kids-sc'); assert.equal(d.project.contractRef.blueprintVersion, type.version);
  const c = await api('GET', `projects/${r.body.id}/contract`);
  assert.equal(c.status, 200); assert.equal(c.body.validation.valid, true); assert.equal(c.body.editions.total, 18);
  const plan = await api('GET', `projects/${r.body.id}/print-plan?book=story&profile=kdp`);
  assert.equal(plan.body.semantics, 'legacy-scene-expansion'); assert.equal(plan.body.canonicalContentPages, 12);
  await api('POST', `projects/${r.body.id}/archive`, { archived: true });
});
