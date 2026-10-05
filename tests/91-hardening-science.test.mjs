// HARDENING H4 — știința (OBS-GS-15/16/17 + OBS-GS-7): entitatea (pasăre / pterozaur / dinozaur, specia din canon),
// relația (co-apariție ≠ coexistență; mediere prin fosile/muzeu/carte), polaritatea (mitul negat = afirmație corectă),
// poziția (credință atribuită + corectată în aceeași propoziție; corectarea ulterioară → REVIEW cu decizie a operatorului).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';
import { science } from '../server/domain/story-contracts.js';
import { PROBES } from '../evaluation/hardening/probes.mjs';
import { runProbe, judge } from '../scripts/enterprise/hardening-probes.mjs';

const BEFORE = JSON.parse(fs.readFileSync(path.join(ROOT, 'evaluation/hardening/probes-before.json'), 'utf8'));
const GOLD1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'evaluation/gold/gold-v1.json'), 'utf8'));
const rules = (t, o = {}) => science([{ n: 1, text: t }], o).findings.filter(f => f.code === 'SCIENCE_CLAIM').map(f => f.rule);

test('H4 registru: probele de știință care eșuau înainte trec acum; corectarea pe aceeași pagină rămâne neetichetată', () => {
  let fixed = 0;
  for (const p of PROBES.filter(x => x.kind === 'science')) { const j = judge(p, runProbe(p)); if (!p.expect) { assert.equal(j, 'untracked'); continue; } assert.equal(j, 'pass', `${p.id} ${JSON.stringify(runProbe(p))}`); if (BEFORE.results[p.id].judgement === 'fail') fixed++; }
  assert.equal(fixed, 9);
});

test('H4 Gold-v1 rămâne în acord: cele 5 etichete de știință', () => {
  for (const c of GOLD1.cases.filter(x => x.kind === 'science')) assert.deepEqual(rules(c.input.text, { world: 'natural' }), c.expected.rule ? [c.expected.rule] : [], c.id);
});

test('H4 OBS-GS-15: entitatea și canonul decid, nu expresia „flying dinosaur”', () => {
  assert.deepEqual(rules('Birds are flying dinosaurs.'), []); assert.deepEqual(rules('Pip, the pterosaur, is not a dinosaur.'), [], 'mitul negat');
  const canonP = [{ name: 'Kiri', species: 'pteranodon' }], canonB = [{ name: 'Kiri', species: 'sparrow' }];
  const f = science([{ n: 1, text: 'Kiri, a flying dinosaur, landed on the rock.' }], { canon: canonP }).findings[0]; assert.equal(f.rule, 'pterosaur-dinosaur'); assert.equal(f.evidence.source, 'canon');
  assert.deepEqual(rules('Kiri, a flying dinosaur, pecked at the seeds.', { canon: canonB }), []);
  assert.equal(science([{ n: 1, text: 'Pip, the flying dinosaur, landed.' }]).findings[0].evidence.referent, 'unresolved', 'fără canon: presupunerea e declarată');
});

test('H4 OBS-GS-16: relație vs co-apariție; entități umane sistematice; lumea fantastică', () => {
  assert.deepEqual(rules('People study dinosaur fossils in museums.'), []); assert.deepEqual(rules('The boy read a book about a T. rex.'), []);
  assert.deepEqual(rules('Humans and dinosaurs never lived at the same time.'), []);
  assert.deepEqual(rules('A boy rode a T. rex to school.'), ['humans-dinosaurs']); assert.deepEqual(rules('A girl fed a stegosaurus.'), ['humans-dinosaurs'], 'genul -saurus = dinozaur (cu excepțiile marine/zburătoare)');
  assert.deepEqual(rules('Ichthyosaurus swam near the boy.'), [], 'ihtiozaurul nu e dinozaur');
  assert.deepEqual(rules('Cavemen waved at the dinosaurs.', { world: 'fantasy' }), []);
});

test('H4 OBS-GS-17: polaritate, credință atribuită și corectată, corectare ulterioară → REVIEW cu decizie', () => {
  assert.deepEqual(rules('Bats are not blind.'), []); assert.deepEqual(rules('Many people think bats are blind, but bats can see.'), []);
  assert.deepEqual(rules('People long ago thought the sun goes around the earth, but the earth goes around the sun.'), []);
  const later = science([{ n: 1, text: 'Bats are blind, said the owl. "No, we can see," laughed the bat.' }]).findings; assert.equal(later[0].code, 'SCIENCE_REVIEW'); assert.equal(later[0].scope, 'same-page'); assert.ok(later[0].operatorDecision);
  const nextPage = science([{ n: 1, text: 'Bats are blind, said the owl.' }, { n: 2, text: 'But bats can see quite well.' }]).findings; assert.equal(nextPage[0].code, 'SCIENCE_REVIEW'); assert.equal(nextPage[0].scope, 'next-page');
  const owl = science([{ n: 1, text: 'Bats are blind, said the owl.' }]).findings[0]; assert.equal(owl.code, 'SCIENCE_CLAIM'); assert.equal(owl.speaker, 'character', 'mitul spus de un personaj, necorectat');
});

test('H4 OBS-GS-7: familiile de concepte prind parafrazele (inclusiv RO), nu doar expresia fixă', () => {
  for (const [t, r] of [['Bats cannot see anything at all.', 'bats-blind'], ['The sun circles the earth every day.', 'sun-orbits'], ['The moon glows by itself.', 'moon-light'], ['The moon shone with its own bright light.', 'moon-light'], ['Luna strălucește cu propria ei lumină.', 'moon-light'], ['Soarele se învârte în jurul Pământului.', 'sun-orbits']]) assert.deepEqual(rules(t), [r], t);
  assert.deepEqual(rules('The sun rises in the east.'), []); assert.deepEqual(rules('The moon reflects the light of the sun.'), []);
});
