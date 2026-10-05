// HARDENING H3 — vârsta multidimensională (OBS-GS-11) și localizarea (OBS-GS-13/14): fiecare dimensiune de vârstă are
// propriul cod consultativ (lungimea rămâne doar un proxy); identificarea contextuală a limbii (tokenurile valide în ambele
// limbi nu se marchează din listă), tokenuri copiate din original, fidelitate pe lexicon delimitat, variante de calc.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';
import { ageFit, localization } from '../server/domain/story-contracts.js';
import { AMBIGUOUS } from '../server/quality/semantic/fidelity.js';
import { PROBES } from '../evaluation/hardening/probes.mjs';
import { runProbe, judge } from '../scripts/enterprise/hardening-probes.mjs';

const BEFORE = JSON.parse(fs.readFileSync(path.join(ROOT, 'evaluation/hardening/probes-before.json'), 'utf8'));
const GOLD1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'evaluation/gold/gold-v1.json'), 'utf8'));
const age = (t, band) => ageFit([{ n: 1, text: t }], band).findings.map(f => f.code);
const loc = (a, b, names = []) => localization({ pages: [{ n: 1, text: a }] }, { pages: [{ n: 1, text: b }] }, { names }).findings.map(f => f.code);

test('H3 registru: probele de vârstă/localizare care eșuau înainte trec acum; cele fără etichetă rămân neetichetate', () => {
  for (const p of PROBES.filter(x => x.kind === 'age' || x.kind === 'localization')) {
    const j = judge(p, runProbe(p)); if (!p.expect) { assert.equal(j, 'untracked', p.id); continue; }
    assert.equal(j, 'pass', `${p.id} ${JSON.stringify(runProbe(p))}`);
  }
  assert.equal(['P-L01', 'P-L02', 'P-L03', 'P-L04', 'P-L05'].filter(id => BEFORE.results[id].judgement === 'fail').length, 5);
});

test('H3 Gold-v1 rămâne în acord (vârstă: semnalul de lungime; localizare: codurile adjudecate, fără coduri în plus)', () => {
  for (const c of GOLD1.cases.filter(x => x.kind === 'age')) assert.equal(age(c.input.page, c.input.band).includes('AGE_COMPLEXITY'), c.expected.AGE_COMPLEXITY, c.id);
  for (const c of GOLD1.cases.filter(x => x.kind === 'localization')) assert.deepEqual(loc(c.input.source, c.input.native, c.input.names), c.expected.codes, c.id);
});

test('H3 OBS-GS-11: dimensiunile de vârstă se măsoară separat și sunt consultative; banda contează', () => {
  const abs = ageFit([{ n: 1, text: 'Milo wonders whether time is real.' }], '3-4');
  assert.ok(abs.findings.some(f => f.code === 'AGE_ABSTRACTION' && f.severity === 'minor' && f.advisory)); assert.ok(!abs.findings.some(f => f.code === 'AGE_COMPLEXITY'), 'scurt, dar abstract');
  assert.ok(age('The duck that the girl who lives here feeds is asleep.', '3-4').includes('AGE_SYNTAX')); assert.ok(!age('The duck that the girl who lives here feeds is asleep.', '7-8').includes('AGE_SYNTAX'));
  assert.deepEqual(age('Milo sees a leaf. It is shiny. Swish! Milo smiles.', '3-4'), []);
  assert.ok(age('Ana was horrified and sobbed in terror all night.', '3-4').includes('AGE_EMOTION'));
  assert.ok(age('Rața înoată. Rața mănâncă pâine.', '3-4').length === 0);
  assert.ok(ageFit([{ n: 1, text: 'x' }], '3-4').dimensions, 'dimensiunile se raportează');
});

test('H3 OBS-GS-14: tokenurile valide în ambele limbi se decid după context; cele doar-englezești rămân semnalate', () => {
  assert.ok(AMBIGUOUS.has('are') && AMBIGUOUS.has('a') && !AMBIGUOUS.has('the'), 'mulțimea ambiguă e calculată, nu aleasă');
  assert.deepEqual(loc('The fox has berries.', 'Vulpea are fructe.'), []); assert.deepEqual(loc('Mia has a red kite.', 'Mia are un zmeu roșu.', ['Mia']), []);
  assert.ok(loc('The cat sleeps on the mat.', 'Pisica doarme pe the covor.').includes('TR_UNTRANSLATED'));
});

test('H3 OBS-GS-13: tokenuri copiate din original, schimbare de acțiune, omisiune, adăugare, negație — consultative, pe lexicon', () => {
  assert.ok(loc('The fox finds the berries.', 'Vulpea găsește berries.').includes('TR_UNTRANSLATED'));
  assert.ok(loc('Milo finds a leaf.', 'Milo pierde o frunză.', ['Milo']).includes('TR_MEANING_CHANGED'));
  assert.ok(loc('Milo finds a leaf.', 'Milo găsește o frunză și o duce acasă la bunica.', ['Milo']).includes('TR_ADDITION'));
  assert.ok(loc('Tom gives an apple and a pear to Lia.', 'Tom îi dă Liei un măr.', ['Tom', 'Lia']).includes('TR_OMISSION'));
  assert.ok(loc('The dog does not bark.', 'Câinele latră.').includes('TR_NEGATION_CHANGED'));
  assert.deepEqual(loc('Lula and the crab had a good time.', 'Lula și crabul s-au distrat.', ['Lula']), [], 'formularea naturală, neliterală, nu e penalizată (verbe ușoare)');
  const f = localization({ pages: [{ n: 1, text: 'Milo finds a leaf.' }] }, { pages: [{ n: 1, text: 'Milo pierde o frunză.' }] }, { names: ['Milo'] }).findings[0];
  assert.equal(f.severity, 'minor'); assert.equal(f.layer, 'lexicon-bounded');
});

test('H3 calcuri: variantele morfologice ale calcurilor cunoscute sunt prinse; calcurile necunoscute nu sunt pretinse', () => {
  assert.ok(loc("Let's make a decision.", 'Hai să facem o decizie.').includes('TR_CALQUE')); assert.ok(loc('We took a walk.', 'Am luat o plimbare.').includes('TR_CALQUE'));
  assert.ok(loc('It made sense.', 'Asta făcea sens.').includes('TR_CALQUE'));
});
