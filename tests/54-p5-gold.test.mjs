// TEST-P5-T05 — comparații oarbe/potrivite, setul negativ (false-pass), același input repetat, schimbarea modelului/
// politicii și contaminarea setului rezervat: manifest cu ID-uri/drepturi/împărțire, confuzie/erori și limitări;
// pragurile țintă rămân „propuse” până la calibrare și acceptarea operatorului.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, ROOT } from './lib.mjs';
import { runEvaluation, contamination, compareReports, blindPair, revealPreference, calibrationStatus, EVALUATORS } from '../server/quality/evaluation.js';
import { textSafety } from '../server/quality/safety.js';
import { volumeMetrics, ageFit } from '../server/domain/story-contracts.js';
import { readZip } from '../server/security/safe-zip.js';

const GOLD = JSON.parse(fs.readFileSync(path.join(ROOT, 'evaluation/gold/gold-v1.json'), 'utf8'));

test('P5-T05: manifestul are ID, versiune, drepturi, împărțire, cohorte (3 vârste, 2 limbi, ≥ 3 teme) și limitări; etichetele așteaptă adjudecarea operatorului', () => {
  const m = GOLD.manifest; assert.equal(m.id, 'gold-v1'); assert.equal(m.version, 1); assert.equal(m.caseCount, GOLD.cases.length);
  assert.ok(m.rights.synthetic && m.rights.dinosaur_world.sha256.length === 64); assert.match(m.purpose, /NU reprezintă cărți reale/);
  const ages = new Set(GOLD.cases.map(c => c.age)), langs = new Set(GOLD.cases.map(c => c.language)), themes = new Set(GOLD.cases.filter(c => c.split === 'calibration').map(c => c.theme));
  assert.deepEqual([...ages].sort(), ['3-4', '5-6', '7-8']); assert.deepEqual([...langs].sort(), ['English', 'Romanian']); assert.ok(themes.size >= 3);
  assert.ok(GOLD.cases.some(c => c.label === 'negative') && GOLD.cases.some(c => c.label === 'positive'));
  assert.ok(GOLD.cases.every(c => c.adjudication.status === 'pending_operator_review'), 'nicio etichetă nu pretinde adjudecare umană');
  assert.ok(m.limitations.some(l => /optimistă/.test(l)) && m.limitations.some(l => /piață/.test(l)));
});

test('P5-T05: setul rezervat are o temă distinctă și nu este contaminat; un duplicat sau o temă comună sunt prinse', () => {
  const c = contamination(GOLD); assert.equal(c.clean, true, JSON.stringify(c.problems));
  assert.ok(GOLD.cases.filter(x => x.split === 'holdout').every(x => x.theme === 'space'));
  const leaked = structuredClone(GOLD); const h = leaked.cases.find(x => x.split === 'holdout' && x.kind === 'safety'); const cal = leaked.cases.find(x => x.split === 'calibration' && x.kind === 'safety');
  h.input.text = cal.input.text; h.theme = cal.theme;
  const bad = contamination(leaked); assert.equal(bad.clean, false); assert.ok(bad.problems.some(p => p.kind === 'duplicate') && bad.problems.some(p => p.kind === 'theme_shared'));
});

test('P5-T05: raport pe calibrare — confuzie, false-pass pe setul negativ, kappa, erori; același input repetat dă același rezultat', () => {
  const r = runEvaluation(GOLD, { split: 'calibration', policy: 2, repeat: 3 });
  assert.equal(r.dataset.id, 'gold-v1'); assert.ok(r.dataset.manifestHash); assert.equal(r.determinism.nondeterministic.length, 0);
  for (const k of ['safety', 'age', 'localization', 'science', 'quality']) { const e = r.evaluators[k]; assert.ok(e.confusion && e.falsePassRate != null && e.kappa != null && Array.isArray(e.errors), k); }
  assert.equal(r.evaluators.safety.falsePassRate, 0, 'niciun negativ de siguranță nu trece');
  assert.ok(r.cohorts.age['3-4'] && r.cohorts.language.Romanian && r.cohorts.theme.forest); assert.ok(r.limitations.length >= 3);
});

test('P5-T05: schimbarea politicii (model/politică) este vizibilă: v1 lasă să treacă negative de calitate; rapoartele nu se amestecă', () => {
  const v1 = runEvaluation(GOLD, { split: 'calibration', policy: 1 }), v2 = runEvaluation(GOLD, { split: 'calibration', policy: 2 });
  assert.ok(v1.evaluators.quality.falsePassRate > v2.evaluators.quality.falsePassRate, 'v2 are mai puține false-pass pe negativele de calitate');
  assert.ok(v1.evaluators.quality.errors.length >= 1 && v1.evaluators.quality.errors.every(e => e.label === 'negative'));
  const cmp = compareReports(v1, v2); assert.deepEqual(cmp.changedVersions, ['qualityPolicy']); assert.match(cmp.note, /qualityPolicy/);
  const hold = runEvaluation(GOLD, { split: 'holdout', policy: 2 });
  assert.throws(() => compareReports(v2, hold), e => e.code === 'not_comparable', 'calibrare vs rezervat nu se compară');
  const other = structuredClone(GOLD); other.manifest.version = 2;
  assert.throws(() => compareReports(v2, runEvaluation(other, { split: 'calibration' })), e => e.code === 'not_comparable');
});

test('P5-T05: comparație oarbă și potrivită — identitatea variantei ascunsă, partea randomizată determinist, nepotrivirea refuzată', () => {
  const [a, b] = GOLD.cases.filter(c => c.kind === 'safety' && c.theme === 'dinosaurs' && c.age === '3-4');
  const p = blindPair(a, b, 's1'); assert.ok(!JSON.stringify({ left: p.left, right: p.right }).includes(a.id), 'ID-ul nu este expus în fața evaluatorului');
  assert.deepEqual(blindPair(a, b, 's1').sealed, p.sealed, 'aceeași sămânță → aceeași parte');
  const sides = new Set(Array.from({ length: 12 }, (_, i) => blindPair(a, b, 'seed' + i).sealed.left)); assert.equal(sides.size, 2, 'partea se schimbă între sesiuni');
  assert.equal(revealPreference(p, 'left').winner, p.sealed.left);
  const other = GOLD.cases.find(c => c.kind === 'safety' && c.theme === 'sea');
  assert.throws(() => blindPair(a, other), e => e.code === 'unmatched');
});

test('P5-T05: pragurile țintă rămân propuse fără raport pe setul rezervat și fără acceptarea operatorului', () => {
  const cal = runEvaluation(GOLD, { split: 'calibration' }), hold = runEvaluation(GOLD, { split: 'holdout' });
  let s = calibrationStatus([cal]); assert.equal(s.thresholdsStatus, 'proposed'); assert.equal(s.maturityClaimsAllowed, false);
  s = calibrationStatus([cal, hold]); assert.equal(s.maturityClaimsAllowed, false); assert.ok(s.reasons.some(r => /Operatorul/.test(r)));
  assert.equal(calibrationStatus([cal, hold], { by: 'operator' }).thresholdsStatus, 'validated');
});

test('P5-T05 Dinosaur World în subsetul de bază: textul V1 trece aceiași evaluatori; nu există scoruri vizuale inventate', () => {
  const doc = JSON.parse([...readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')))].find(([k]) => k.endsWith('/project.json'))[1].toString());
  const pages = doc.artifacts.script_0.content.pages;
  assert.ok(pages.every(p => textSafety(p.text, { age: '3-4' }).verdict === 'PASS' && textSafety(p.text_ro, { age: '3-4' }).verdict === 'PASS'));
  assert.deepEqual(ageFit(pages, '3-4').findings.filter(f => f.code === 'AGE_COMPLEXITY'), []); assert.equal(volumeMetrics(pages).totalWords, 335);
  assert.equal(GOLD.manifest.baselineSubset.dinosaur_world.visualScores, 'NOT_AVAILABLE');
  assert.ok(!Object.keys(doc.artifacts).some(k => /^ill_/.test(k)), 'nicio imagine evaluată, deci niciun scor vizual');
  assert.ok(GOLD.cases.every(c => !/Milo and the Shiny Pebble/.test(JSON.stringify(c.input))), 'textul DW nu este copiat în set (referință prin hash)');
});

test('P5-T05 API: rulare, rapoarte, comparație și starea calibrării (fără acceptare: propus)', async () => {
  const g = await api('GET', 'evaluation/gold'); assert.equal(g.status, 200); assert.equal(g.body.manifest.id, 'gold-v2', 'setul activ = versiunea cea mai mare (gold-v1 rămâne benchmarkul înghețat „Before”)'); assert.ok(g.body.counts.holdout >= 1);
  const a = (await api('POST', 'evaluation/run', { split: 'calibration', policy: 1 })).body, b = (await api('POST', 'evaluation/run', { split: 'calibration', policy: 2 })).body;
  const cmp = await api('POST', 'evaluation/compare', { a: a.id, b: b.id }); assert.equal(cmp.status, 200); assert.deepEqual(cmp.body.changedVersions, ['qualityPolicy']);
  const st = (await api('GET', 'evaluation/status')).body; assert.equal(st.thresholdsStatus, 'proposed'); assert.equal(st.maturityClaimsAllowed, false);
  assert.ok(EVALUATORS.quality);
});
