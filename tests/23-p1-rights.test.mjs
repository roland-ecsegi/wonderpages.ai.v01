// TEST-P1-T05 — drepturi unknown/expired, licență de font absentă, comparator de hash pe proiect brut, constatările DW01–DW07.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { api, INPUT, ROOT } from './lib.mjs';
import { rightsRecord, rightsStatus, commercialReleaseCheck, editingAllowed, appRightsInventory, projectRightsInventory } from '../server/domain/rights.js';
import { compareRaw } from '../server/migration/raw-compare.js';
import { readDinosaurWorld } from '../server/migration/dw-reference.js';

const DW = path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip');
const NOW = Date.parse('2026-10-02T00:00:00Z');

test('P1-T05: drepturi unknown / expirate / restricționate blochează lansarea comercială, nu editarea', () => {
  const owned = rightsRecord({ id: 'ref:a', subject: { ref: 'a' }, source: 'operator: ilustrație proprie', grant: 'owned', permissions: { commercial: 'yes', reproduction: 'yes', derivative: 'yes' } });
  const unknown = rightsRecord({ id: 'ref:b', subject: { ref: 'b' }, source: 'încărcat' });
  const expired = rightsRecord({ ...owned, id: 'ref:c', subject: { ref: 'c' }, expiresAt: '2026-01-01' });
  const restricted = rightsRecord({ ...owned, id: 'ref:d', subject: { ref: 'd' }, permissions: { commercial: 'no', reproduction: 'yes', derivative: 'yes' } });
  assert.equal(rightsStatus(owned, NOW).status, 'cleared'); assert.equal(rightsStatus(unknown, NOW).status, 'unknown');
  assert.equal(rightsStatus(expired, NOW).status, 'expired'); assert.equal(rightsStatus(restricted, NOW).status, 'restricted');
  assert.equal(rightsStatus(null).status, 'missing');
  const gate = commercialReleaseCheck([owned, unknown, expired, restricted], ['a', 'b', 'c', 'd', 'e'], NOW);
  assert.equal(gate.eligible, false); assert.deepEqual(gate.blockers.map(b => b.ref), ['b', 'c', 'd', 'e']);
  assert.equal(commercialReleaseCheck([owned], ['a'], NOW).eligible, true);
  assert.equal(editingAllowed().allowed, true);
});

test('P1-T05: fiecare font și dependență are sursă și status; licența Andika lipsă este semnalată', () => {
  const inv = appRightsInventory(ROOT);
  assert.ok(inv.records.every(r => r.source && r.subject.kind), 'sursă pentru fiecare înregistrare');
  const andika = inv.records.filter(r => r.id.startsWith('font:Andika'));
  /* P8-T03 added the official OFL text: the fonts are cleared now; without the text they are still flagged */
  assert.equal(andika.length, 2); assert.ok(andika.every(r => rightsStatus(r).status === 'cleared' && r.licenseTextPresent === true));
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-fonts-')); fs.mkdirSync(path.join(bare, 'public/fonts'), { recursive: true });
  for (const f of ['Andika-Regular.ttf', 'Andika-Bold.ttf']) fs.copyFileSync(path.join(ROOT, 'public/fonts', f), path.join(bare, 'public/fonts', f)); fs.copyFileSync(path.join(ROOT, 'package-lock.json'), path.join(bare, 'package-lock.json'));
  const missing = appRightsInventory(bare).records.filter(r => r.id.startsWith('font:Andika')); assert.ok(missing.length === 2 && missing.every(r => rightsStatus(r).status === 'unknown' && r.licenseTextPresent === false), 'licența Andika lipsă este semnalată');
  fs.rmSync(bare, { recursive: true, force: true });
  const inst = inv.records.find(r => r.id.startsWith('font:InstrumentSans'));
  assert.equal(rightsStatus(inst).status, 'cleared');
  const lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8'));
  assert.equal(inv.records.filter(r => r.subject.kind === 'dependency').length, Object.keys(lock.packages).filter(Boolean).length);
});

test('P1-T05: referința încărcată și outputul generat nu sunt „cleared” implicit', () => {
  const p = { refs: [{ file: 'uploads/01-milo.png' }], input: { seed_story: 'text' } };
  const subs = projectRightsInventory(p, { ill_0_1: { content: {} } });
  assert.deepEqual(subs.map(s => [s.subject.kind, rightsStatus(s).status]), [['reference', 'unknown'], ['manuscript', 'unknown'], ['output', 'unknown']]);
  const declared = projectRightsInventory(p, {}, [{ id: 'ref:uploads/01-milo.png', subject: { kind: 'reference', ref: 'uploads/01-milo.png' }, source: 'operator: personaj original', grant: 'owned', permissions: { commercial: 'yes', reproduction: 'yes', derivative: 'yes' } }]);
  assert.equal(rightsStatus(declared[0]).status, 'cleared');
});

test('P1-T05: comparatorul pe proiect brut și DW01–DW07; referințele originale sunt pin-uite', () => {
  const dw = readDinosaurWorld(fs.readFileSync(DW));
  const same = compareRaw(dw.doc, structuredClone(dw.doc));
  assert.equal(same.preserved, true); assert.ok(same.artifacts.every(a => a.status === 'identical') && same.sections.every(s => s.same));
  const changed = structuredClone(dw.doc); changed.artifacts.series.content.volumes[0].summary = 'altceva'; delete changed.artifacts.cast;
  const diff = compareRaw(dw.doc, changed);
  assert.equal(diff.preserved, false); assert.equal(diff.artifacts.find(a => a.key === 'series').status, 'changed'); assert.equal(diff.artifacts.find(a => a.key === 'cast').status, 'missing_after');
  const f = Object.fromEntries(dw.findings.map(x => [x.id, x]));
  for (const id of ['DW01', 'DW02', 'DW03', 'DW04', 'DW05', 'DW07']) assert.equal(f[id].status, 'VERIFIED', id);
  assert.equal(f.DW06.status, 'INFERRED'); assert.equal(f.DW01.count, 3); assert.equal(f.DW02.count, 8);
  assert.deepEqual(dw.images.map(i => i.pixels), [[1199, 1312], [1222, 1287]]);
  assert.deepEqual(dw.images.map(i => i.sha256.slice(0, 8)), ['da8cbac3', '14c574dd']);
});

test('P1-T05 API: registrul de drepturi pe proiect; declarația operatorului este laptop-only și versionată', async () => {
  const r = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Drepturi P1', seed_story: 'Un manuscris al operatorului.' } });
  let d = await api('GET', `projects/${r.body.id}/rights`);
  assert.equal(d.status, 200); assert.equal(d.body.commercial.eligible, false); assert.equal(d.body.editing.allowed, true);
  assert.ok(d.body.subjects.some(s => s.subject.kind === 'manuscript' && s.status === 'unknown'));
  const put = await api('PUT', `projects/${r.body.id}/rights`, { id: 'manuscript:seed_story', subject: { kind: 'manuscript', ref: 'input.seed_story' }, source: 'operator: text propriu', grant: 'owned', permissions: { commercial: 'yes', reproduction: 'yes', derivative: 'yes' } });
  assert.equal(put.status, 200); assert.equal(put.body.status, 'cleared'); assert.equal(put.body.record.reviewer, 'operator');
  d = await api('GET', `projects/${r.body.id}/rights`);
  assert.equal(d.body.subjects.find(s => s.id === 'manuscript:seed_story').status, 'cleared');
  assert.equal(d.body.commercial.eligible, true, 'manuscris declarat + textul OFL livrat → nimic nu mai blochează (P8-T03)'); assert.deepEqual(d.body.commercial.blockers, []);
  assert.ok(d.body.commercial.items.filter(x => /Andika/.test(x.ref)).every(x => x.status === 'cleared'));
  const app = await api('GET', 'rights/app'); assert.equal(app.status, 200); assert.ok(app.body.summary.cleared > 100);
  await api('POST', `projects/${r.body.id}/archive`, { archived: true });
});
