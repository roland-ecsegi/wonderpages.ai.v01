/**
 * P7-T03 — closed-loop effectiveness (OUTPUT-16/17, ADR11).
 * What was learned is judged on OUTCOMES, with honest statistics:
 *  - the preference model is validated by GROUPED cross-validation (all samples of one project stay in the same fold:
 *    no same-case holdout leakage); training accuracy is never reported as generalisation;
 *  - prompt/model variants are compared only inside one COHORT (same blueprint version, provider/model and age): a
 *    reward from another cohort never decides a competition (version confound);
 *  - a lesson's effect is matched (same age, blueprint version and stage before/with the lesson), carries its sample
 *    counts and limitations, and a negative effect flags the lesson as harmful for the operator's review (rollback of
 *    its promotion stays an explicit decision, P7-T02);
 *  - an approval reached only after a repair is not a success of the original output.
 * Historical confidence is a policy proxy, not a validated probability.
 */
export const EFFECT_VERSION = 1;
export const MIN = Object.freeze({ cvGroups: 3, effect: 3, harmful: 5, cohortArm: 10 });

/** Outcome of one artifact at a decision: approved untouched = success; approved after a repair/correction = not a success. */
export function outcomeOf({ decision, targeted = false, repaired = false, corrected = false }) {
  if (decision === 'rejected' || (decision === 'needs_correction' && targeted)) return { result: 'rejected', reward: 0 };
  if (['approved', 'approved_with_notes'].includes(decision)) return repaired || corrected ? { result: 'approved_after_repair', reward: 0 } : { result: 'approved', reward: 1 };
  return { result: 'pending', reward: null };
}

/** Grouped k-fold: folds are formed from whole groups (projects), so the same case is never both trained and tested. */
export function groupedCv(samples, { train, predict, folds = 4 }) {
  const groups = [...new Set(samples.map(s => s.group || '?'))];
  const limitations = ['Modelul de preferință învață din deciziile tale; validarea este pe proiecte ținute deoparte, nu pe piață.'];
  if (groups.length < MIN.cvGroups) return { groups: groups.length, samples: samples.length, groupedCvAccuracy: null, status: 'insufficient_groups', limitations: [...limitations, `Sunt necesare cel puțin ${MIN.cvGroups} proiecte distincte pentru o validare fără scurgeri.`] };
  const k = Math.min(folds, groups.length), foldOf = new Map(groups.map((g, i) => [g, i % k])); let correct = 0, tested = 0;
  for (let f = 0; f < k; f++) {
    const test = samples.filter(s => foldOf.get(s.group || '?') === f), tr = samples.filter(s => foldOf.get(s.group || '?') !== f);
    if (!test.length || !tr.some(d => d.y === 1) || !tr.some(d => d.y === 0)) continue;
    const m = train(tr); correct += test.filter(d => (predict(m, d.x) >= 0.5) === (d.y === 1)).length; tested += test.length;
  }
  const m = train(samples), trainAcc = samples.filter(d => (predict(m, d.x) >= 0.5) === (d.y === 1)).length / samples.length;
  return { groups: groups.length, samples: samples.length, folds: k, tested, groupedCvAccuracy: tested ? Math.round(correct / tested * 1000) / 1000 : null, trainAccuracy: Math.round(trainAcc * 1000) / 1000, trainAccuracyNote: 'Acuratețe pe datele de antrenare: NU este generalizare.', status: tested ? 'measured' : 'insufficient_classes', limitations };
}

export const cohortKey = c => [c?.bp ?? '?', c?.model ?? '?', c?.age ?? '?'].join('|');
/** A competition is decided only within one cohort; arms measured in different cohorts are reported as confounded. */
export function variantReport(stage, cohorts = {}) {
  const rows = Object.entries(cohorts).map(([key, arms]) => ({ cohort: key, arms: Object.entries(arms).map(([v, s]) => ({ variant: v, n: s.a + s.b - 2, rate: Math.round(s.a / (s.a + s.b) * 1000) / 1000 })) }));
  const variants = [...new Set(rows.flatMap(r => r.arms.map(a => a.variant)))];
  const comparable = rows.filter(r => r.arms.length >= 2 && r.arms.every(a => a.n >= MIN.cohortArm));
  const confounded = variants.length >= 2 && !rows.some(r => variants.every(v => r.arms.some(a => a.variant === v)));
  return { stage, cohorts: rows, comparableCohorts: comparable.map(r => r.cohort), confounded, note: confounded ? 'Variantele au fost măsurate în cohorte diferite (versiune de prompt/blueprint, model sau vârstă): diferența nu se atribuie variantei.' : null };
}

/** Matched effect of one lesson on its criterion: same age, blueprint version and stage, before vs with. */
export function lessonEffect(lesson, rows) {
  if (!lesson.code) return { status: 'no_criterion', n: 0, limitations: ['Lecția nu are un criteriu de rubrică asociat; efectul nu se măsoară.'] };
  const withL = rows.filter(r => (r.lessons || []).includes(lesson.id) && r.criteria?.[lesson.code] != null);
  const match = r => withL.some(w => w.age === r.age && w.bp === r.bp && w.stage === r.stage);
  const before = rows.filter(r => r.t < (lesson.createdAt || 0) && !(r.lessons || []).includes(lesson.id) && r.criteria?.[lesson.code] != null && match(r));
  const lim = ['Efect observațional (înainte/după, potrivit pe vârstă, versiune și etapă), nu experiment controlat.'];
  if (withL.length < MIN.effect || before.length < MIN.effect) return { status: 'insufficient', withN: withL.length, beforeN: before.length, effect: null, matchedOn: ['age', 'bp', 'stage'], limitations: [...lim, `Sunt necesare cel puțin ${MIN.effect} măsurători în fiecare grup potrivit.`] };
  const m = a => a.reduce((x, r) => x + Number(r.criteria[lesson.code]), 0) / a.length, eff = Math.round((m(withL) - m(before)) * 100) / 100;
  const status = eff < 0 && withL.length >= MIN.harmful ? 'harmful' : eff <= 0 ? 'neutral' : 'positive';
  return { status, effect: eff, withN: withL.length, beforeN: before.length, matchedOn: ['age', 'bp', 'stage'], limitations: lim };
}

/** Dinosaur World: baseline V1 vs after are reported separately; with no "after" there is no delta (visual delta never invented). */
export function baselineAfter({ baseline, after = null, reservedThemes = ['space'] }) {
  return { baseline, after, textDelta: after ? Object.fromEntries(Object.keys(baseline).filter(k => typeof baseline[k] === 'number' && typeof after[k] === 'number').map(k => [k, Math.round((after[k] - baseline[k]) * 100) / 100])) : null, visualDelta: 'NOT_AVAILABLE', status: after ? 'measured' : 'no_after_data', heldout: { reservedThemes, note: 'Tema rezervată a setului de aur nu este folosită pentru evaluarea DW.' } };
}
