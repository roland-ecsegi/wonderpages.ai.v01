// HARDENING H2 — siguranța (OBS-GS-1…10): analiză pe clauze — negația legată de acțiunea periculoasă, interdicția ignorată,
// adult prezent ≠ supraveghere, întrebarea adultului, capacitatea speciei, poziția față de stereotip, paritate EN↔RO,
// diacritice cu sens; „nesigur” separat de „interzis de politica editorială”; politicile nedecise → REVIEW cu decizie a
// operatorului. Fiecare reparație are proba care eșua „înainte”.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';
import { textSafety, SAFETY_POLICY } from '../server/quality/safety.js';
import { PROBES } from '../evaluation/hardening/probes.mjs';
import { runProbe, judge } from '../scripts/enterprise/hardening-probes.mjs';

const BEFORE = JSON.parse(fs.readFileSync(path.join(ROOT, 'evaluation/hardening/probes-before.json'), 'utf8'));
const GOLD1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'evaluation/gold/gold-v1.json'), 'utf8'));
const v = (t, age = '5-6', o = {}) => textSafety(t, { age, ...o });

test('H2 registru: fiecare probă de siguranță care eșua înainte trece acum; cele fără etichetă rămân neetichetate', () => {
  let fixed = 0;
  for (const p of PROBES.filter(x => x.kind === 'safety')) {
    const j = judge(p, runProbe(p));
    if (!p.expect) { assert.equal(j, 'untracked', p.id); continue; }
    assert.equal(j, 'pass', `${p.id}: ${JSON.stringify(runProbe(p))}`); if (BEFORE.results[p.id].judgement === 'fail') fixed++;
  }
  assert.ok(fixed >= 14, `reparate: ${fixed}`);
});

test('H2 Gold-v1 rămâne în acord: cele 18 etichete de siguranță adjudecate de operator', () => {
  for (const c of GOLD1.cases.filter(x => x.kind === 'safety')) assert.equal(v(c.input.text, c.age).verdict, c.expected.verdict, c.id);
});

test('H2 OBS-GS-1/2: negația contează doar legată de acțiune; motivul unui PASS e consemnat (nu accidental)', () => {
  const neg = v('Milo nu se joacă niciodată cu focul; întreabă un adult.'); assert.equal(neg.verdict, 'PASS'); assert.equal(neg.mitigated[0].reasonCode, 'SAFETY_HAZARD_NEGATED');
  assert.equal(v("Milo doesn't care and plays with matches near the ferns.").verdict, 'BLOCK', 'negația altui verb nu anulează');
  assert.equal(v('Nova nu ascultă și se urcă pe pervaz.').verdict, 'BLOCK');
  const despite = v("Sam's dad says no, but Sam plays with matches."); assert.equal(despite.findings[0].reasonCode, 'SAFETY_HAZARD_DESPITE_PROHIBITION');
  const ask = v('The fox asks a grown-up before eating the berries from the forest.'); assert.equal(ask.verdict, 'PASS'); assert.equal(ask.mitigated[0].reasonCode, 'SAFETY_ASK_RESPONSE_UNKNOWN'); assert.match(ask.mitigated[0].operatorDecision, /răspuns necunoscut/);
  const present = v('Milo plays with matches with a grown-up.', '3-4'); assert.equal(present.verdict, 'BLOCK'); assert.equal(present.findings[0].reasonCode, 'SAFETY_ADULT_PRESENT_NOT_SUPERVISING');
  const sup = v('Tia climbs onto the window sill with her dad holding her.', '3-4'); assert.equal(sup.verdict, 'PASS'); assert.match(sup.mitigated[0].operatorDecision, /supraveghere activă/, 'comportamentul P5 păstrat, dar decizia e deschisă');
});

test('H2 OBS-GS-7/9: morfologie, cuvinte intercalate, paritate EN↔RO, diacritice care schimbă sensul', () => {
  for (const t of ['The fox ate the strange berries from the forest.', 'The fox is eating the berries from the forest.', 'Milo se joacă adesea cu focul.', 'Robotul Nova se cățără pe pervaz.', 'Robotul Nova urcă pe pervaz.', 'Pirații spațiali au tras cu armele în navă.']) assert.equal(v(t).verdict, 'BLOCK', t);
  assert.equal(v('Ești urât, râse vulpea la ursuleț.', '3-4').verdict, 'REVIEW'); assert.equal(v('Esti urat, rase vulpea.', '3-4').verdict, 'REVIEW', 'fără diacritice, persoana a II-a + copulă = insultă');
  assert.equal(v('Ursulețul a urat noapte bună.', '3-4').verdict, 'PASS', 'urarea nu devine insultă'); assert.equal(v('Ursulețul era îngrozit de atacul monstrului în întuneric.', '3-4').verdict, 'REVIEW');
});

test('H2 OBS-GS-4: capacitatea personajului — peștele în apă vs personajul terestru; canonul poate stabili specia', () => {
  assert.equal(v('Fin the little trout swims alone in the stream.').verdict, 'PASS');
  assert.equal(v('Lula swims alone in the bay.').verdict, 'REVIEW', 'fără specie cunoscută: regula de apă');
  const canon = { characters: [{ name: 'Lula', species: 'fish' }] };
  assert.equal(v('Lula swims alone in the bay.', '5-6', { canon }).verdict, 'PASS'); const d = v('Lula swims alone into the deep dark sea.', '3-4', { canon }); assert.equal(d.verdict, 'REVIEW'); assert.equal(d.findings[0].reasonCode, 'SAFETY_DISTRESS_CONTEXT');
});

test('H2 OBS-GS-8: obiect → acțiune → politică; „nesigur” ≠ „interzis de politică”; politicile nedecise → REVIEW cu decizie', () => {
  const use = v('The hunter raised his gun at the deer.', '7-8'); assert.equal(use.verdict, 'BLOCK'); assert.equal(use.findings[0].kind, 'safety'); assert.equal(use.findings[0].reasonCode, 'SAFETY_WEAPON_VIOLENT_USE');
  const stored = v('Grandpa keeps his old gun locked in a cabinet.', '7-8'); assert.equal(stored.verdict, 'BLOCK'); assert.equal(stored.findings[0].kind, 'policy'); assert.equal(stored.findings[0].reasonCode, 'POLICY_REAL_WEAPON'); assert.ok(stored.findings[0].operatorDecision);
  const toy = v('The children played with water guns in the garden.', '7-8'); assert.equal(toy.verdict, 'REVIEW'); assert.equal(toy.findings[0].reasonCode, 'POLICY_TOY_WEAPON_UNDEFINED');
  const laser = v('The space pirates shot their lasers at the ship.', '7-8'); assert.equal(laser.verdict, 'REVIEW'); assert.equal(laser.findings[0].reasonCode, 'POLICY_FICTIONAL_WEAPON_UNDEFINED');
  assert.equal(v('The space pirates shot water balloons at the ship.', '7-8').verdict, 'PASS'); assert.equal(v('Pip had begun to glide.', '7-8').verdict, 'PASS');
});

test('H2 OBS-GS-3/6: stereotip promovat / contestat / incluziv despre altceva / restricție situațională', () => {
  assert.equal(v('Fetele nu pot înota departe, râse rechinul.', '7-8').verdict, 'BLOCK');
  assert.equal(v('Fetele nu pot explora recifele, dar și fetele și băieții pot înota, spuse caracatița.', '7-8').verdict, 'BLOCK', 'tiparul incluziv despre altă activitate nu e bypass');
  const c = v('Băieții nu plâng, spuse dinozaurul cel mare. Mama îi răspunse blând: Toată lumea poate plânge.'); assert.equal(c.verdict, 'REVIEW'); assert.equal(c.findings[0].reasonCode, 'SAFETY_STEREOTYPE_CONTESTED');
  const s = v('Fetele nu pot înota departe azi, e furtună, spuse mama.', '7-8'); assert.equal(s.verdict, 'REVIEW'); assert.equal(s.findings[0].reasonCode, 'SAFETY_GENDERED_RESTRICTION_CONTEXTUAL');
  assert.equal(v('Și fetele și băieții pot explora recifele.', '7-8').verdict, 'PASS'); assert.equal(v('Nobody can swim far today because of the storm, said Mum.', '7-8').verdict, 'PASS');
});

test('H2 fiecare constatare are cod de motiv, tip (safety/policy), strat și corectură; politica e versionată', () => {
  assert.equal(SAFETY_POLICY.version, 2);
  for (const t of ['Milo plays with matches.', 'Grandpa keeps his old gun locked away.', 'You are ugly.', 'The bear was terrified.', 'Girls can\'t climb trees.', 'Milo drinks beer.'])
    for (const f of v(t, '3-4').findings) assert.ok(f.reasonCode && f.kind && f.layer && f.fix && f.quote, JSON.stringify(f));
});
