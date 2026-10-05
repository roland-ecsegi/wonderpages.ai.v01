/**
 * P5-T05 — gold set and cohort calibration (OUTPUT-13/16, RK20 SURPASS).
 * Runs the deterministic evaluators on a versioned gold set (manifest with rights, split and cohorts) and reports, per
 * evaluator and cohort, the confusion matrix, false-pass rate on the negative set, agreement with the adjudicated
 * labels (Cohen's kappa), the misclassified case ids and the limitations. It also checks that the holdout is not
 * contaminated (no shared theme, no duplicate or near-duplicate content), that the same input gives the same result,
 * and that reports from different dataset/policy/evaluator versions are never mixed. Blind A/B pairs hide the
 * variant identity and randomise the side (seeded) and refuse unmatched comparisons.
 * Thresholds stay `proposed` until a calibration report exists AND the operator accepts it (human approval).
 */
import crypto from 'node:crypto';
import { canonicalHash } from '../domain/canonical.js';
import { textSafety } from './safety.js';
import { ageFit, localization, science } from '../domain/story-contracts.js';
import { assessText, QUALITY_POLICIES } from './assessment.js';

export const EVALUATOR_VERSION = 1;
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = s => new Set(norm(s).split(' ').filter(w => w.length > 2));
const jacc = (a, b) => { const A = tokens(a), B = tokens(b); if (!A.size || !B.size) return 0; let n = 0; for (const w of A) if (B.has(w)) n++; return n / (A.size + B.size - n); };
const caseText = c => [c.input.text, c.input.page, c.input.source, c.input.native].filter(Boolean).join(' ');
const CONTENT = Object.freeze({ title: 'gold', pages: Array.from({ length: 12 }, (_, i) => ({ n: i + 1, text: `Milo and Tia find a gentle surprise on page ${i + 1}.` })) });
const BP_V = v => ({ rubric: Array.from({ length: 18 }, (_, i) => ({ code: 'T' + String(i + 1).padStart(2, '0'), critical: ['T01', 'T07', 'T08'].includes('T' + String(i + 1).padStart(2, '0')) })), schemas: { critic: {} }, version: 21, ...(v === 2 ? { quality_policy: { version: 2 } } : {}) });

/** Each evaluator returns { predicted: 'positive'|'negative', detail } for one case. */
export const EVALUATORS = Object.freeze({
  safety: c => { const r = textSafety(c.input.text, { age: c.age }); const ok = r.verdict === c.expected.verdict; return { predicted: r.verdict === 'PASS' ? 'positive' : 'negative', exact: ok, detail: r.verdict }; },
  age: c => { const f = ageFit([{ n: 1, text: c.input.page }], c.input.band).findings.some(x => x.code === 'AGE_COMPLEXITY'); return { predicted: f ? 'negative' : 'positive', exact: f === c.expected.AGE_COMPLEXITY, detail: f }; },
  localization: c => { const codes = localization({ pages: [{ n: 1, text: c.input.source }] }, { pages: [{ n: 1, text: c.input.native }] }, { names: c.input.names || [] }).findings.map(f => f.code); return { predicted: codes.length ? 'negative' : 'positive', exact: (c.expected.codes || []).every(x => codes.includes(x)) && (codes.length > 0) === ((c.expected.codes || []).length > 0), detail: codes }; },
  science: c => { const rules = science([{ n: 1, text: c.input.text }], { world: 'natural' }).findings.filter(f => f.code === 'SCIENCE_CLAIM').map(f => f.rule); return { predicted: rules.length ? 'negative' : 'positive', exact: c.expected.rule ? rules.includes(c.expected.rule) : !rules.length, detail: rules }; },
  quality: (c, { policy = 2 } = {}) => { const a = assessText({ reply: c.input.reply, content: CONTENT, bp: BP_V(policy), stage: { critic_prompt: 'critic', critical_threshold: 7 }, policy: QUALITY_POLICIES[policy] }); return { predicted: a.pass ? 'positive' : 'negative', exact: a.pass === c.expected.acceptable, detail: { score: a.score, reasons: a.reasons } }; }
});

const kappa = m => { const n = m.tp + m.fp + m.tn + m.fn; if (!n) return null; const po = (m.tp + m.tn) / n, pe = ((m.tp + m.fp) * (m.tp + m.fn) + (m.tn + m.fn) * (m.tn + m.fp)) / (n * n); return pe === 1 ? 1 : Math.round((po - pe) / (1 - pe) * 1000) / 1000; };
const metrics = rows => { const m = { tp: 0, fp: 0, tn: 0, fn: 0 }; for (const r of rows) { const pos = r.label === 'positive'; if (r.predicted === 'positive') pos ? m.tp++ : m.fp++; else pos ? m.fn++ : m.tn++; } const neg = m.fp + m.tn; return { n: rows.length, confusion: m, accuracy: rows.length ? Math.round((m.tp + m.tn) / rows.length * 1000) / 1000 : null, falsePassRate: neg ? Math.round(m.fp / neg * 1000) / 1000 : null, falseBlockRate: m.tp + m.fn ? Math.round(m.fn / (m.tp + m.fn) * 1000) / 1000 : null, kappa: kappa(m), exactAgreement: rows.length ? Math.round(rows.filter(r => r.exact).length / rows.length * 1000) / 1000 : null }; };

/** Holdout must not share a theme with calibration nor contain (near-)duplicates of calibration content. */
export function contamination(gold) {
  const cal = gold.cases.filter(c => c.split !== 'holdout'), hold = gold.cases.filter(c => c.split === 'holdout'), problems = [];
  const calThemes = new Set(cal.map(c => c.theme));
  for (const h of hold) {
    if (calThemes.has(h.theme)) problems.push({ case: h.id, kind: 'theme_shared', theme: h.theme });
    for (const c of cal) { const s = jacc(caseText(h), caseText(c)); if (s >= 0.8) problems.push({ case: h.id, kind: s === 1 ? 'duplicate' : 'near_duplicate', with: c.id, similarity: Math.round(s * 100) / 100 }); }
  }
  return { clean: !problems.length, problems };
}

/* set identity: content hash per case (its adjudication block excluded) and over the whole set */
export const caseHash = c => { const { adjudication, ...rest } = c || {}; return canonicalHash(rest); };
export const goldHash = gold => canonicalHash({ manifest: gold.manifest, cases: gold.cases.map(c => [c.id, caseHash(c)]) });
/** The set as the operator adjudicated it (in memory): corrected labels applied, excluded cases removed. */
export function applyAdjudications(gold, state) {
  const out = structuredClone(gold);
  out.cases = out.cases.filter(c => state.effective[c.id]?.decision !== 'exclude').map(c => { const e = state.effective[c.id]; if (!e) return c; return { ...c, ...(e.decision === 'correct' ? { label: e.result.label, expected: e.result.expected } : {}), adjudication: { status: e.decision === 'correct' ? 'operator_corrected' : 'operator_confirmed', entry: e.hash } }; });
  return out;
}

/** adjudication: the current adjudication state (server/quality/adjudication.js); the run then uses the operator's
 *  labels and the report is bound to that state (hash), so a later change makes the report stale. */
export function runEvaluation(source, { split = 'calibration', policy = 2, repeat = 2, adjudication = null } = {}) {
  const gold = adjudication ? applyAdjudications(source, adjudication) : source;
  const manifestHash = canonicalHash(gold.manifest), cases = gold.cases.filter(c => split === 'all' || c.split === split);
  const rows = [], nondeterministic = [];
  for (const c of cases) {
    const ev = EVALUATORS[c.kind]; if (!ev) continue;
    const runs = Array.from({ length: Math.max(1, repeat) }, () => ev(c, { policy }));
    if (new Set(runs.map(r => JSON.stringify(r))).size > 1) nondeterministic.push(c.id);
    rows.push({ id: c.id, kind: c.kind, theme: c.theme, age: c.age, language: c.language, label: c.label, ...runs[0] });
  }
  const by = key => Object.fromEntries([...new Set(rows.map(r => r[key]))].map(v => [v, metrics(rows.filter(r => r[key] === v))]));
  const evaluators = Object.fromEntries([...new Set(rows.map(r => r.kind))].map(k => [k, { ...metrics(rows.filter(r => r.kind === k)), errors: rows.filter(r => r.kind === k && (!r.exact || (r.predicted !== r.label))).map(r => ({ id: r.id, label: r.label, predicted: r.predicted, detail: r.detail })) }]));
  return { schema: 'wonderpages.evaluation-report/1', id: 'ev-' + crypto.randomBytes(5).toString('hex'), dataset: { id: gold.manifest.id, version: gold.manifest.version, manifestHash, goldHash: goldHash(source), caseCount: source.cases.length, evaluatedCases: gold.cases.length, rights: gold.manifest.rights }, split, versions: { evaluator: EVALUATOR_VERSION, qualityPolicy: policy }, at: Date.now(),
    overall: metrics(rows), evaluators, cohorts: { age: by('age'), language: by('language'), theme: by('theme') }, determinism: { repeat, nondeterministic }, contamination: contamination(gold),
    adjudication: gold.manifest.adjudication, adjudicationState: adjudication ? { hash: adjudication.hash, complete: adjudication.complete, counts: adjudication.counts } : null, limitations: gold.manifest.limitations };
}
/** Reports are comparable only for the same dataset version and split; a policy/evaluator swap is shown, never hidden. */
export function compareReports(a, b) {
  if (a.dataset.id !== b.dataset.id || a.dataset.version !== b.dataset.version || a.dataset.manifestHash !== b.dataset.manifestHash) throw { status: 409, code: 'not_comparable', message: 'Rapoartele folosesc seturi de date diferite; nu se compară.' };
  if (a.split !== b.split) throw { status: 409, code: 'not_comparable', message: 'Rapoartele folosesc împărțiri diferite (calibrare vs rezervat).' };
  if ((a.adjudicationState?.hash ?? null) !== (b.adjudicationState?.hash ?? null)) throw { status: 409, code: 'not_comparable', message: 'Rapoartele folosesc adjudecări diferite ale setului; nu se compară.' };
  const changed = Object.entries(a.versions).filter(([k, v]) => b.versions[k] !== v).map(([k]) => k);
  const delta = Object.fromEntries(Object.keys({ ...a.evaluators, ...b.evaluators }).map(k => [k, { accuracy: (b.evaluators[k]?.accuracy ?? 0) - (a.evaluators[k]?.accuracy ?? 0), falsePassRate: (b.evaluators[k]?.falsePassRate ?? 0) - (a.evaluators[k]?.falsePassRate ?? 0) }]));
  return { changedVersions: changed, delta, note: changed.length ? `Schimbare de ${changed.join(', ')}: diferențele se atribuie acestei schimbări, nu se amestecă rapoartele.` : 'Aceleași versiuni.' };
}
/** Blind, matched A/B pair: same theme/age/language; the side is randomised by a seed and the mapping is sealed. */
export function blindPair(a, b, seed = 'seed') {
  if (a.theme !== b.theme || a.age !== b.age || a.language !== b.language) throw { status: 400, code: 'unmatched', message: 'Comparația oarbă cere variante pe aceeași temă, vârstă și limbă.' };
  const flip = crypto.createHash('sha256').update(String(seed) + a.id + b.id).digest()[0] % 2 === 1;
  const [left, right] = flip ? [b, a] : [a, b];
  return { pair: crypto.createHash('sha256').update([seed, a.id, b.id].join('|')).digest('hex').slice(0, 16), left: { text: caseText(left) }, right: { text: caseText(right) }, sealed: { left: left.id, right: right.id } };
}
export const revealPreference = (pair, choice) => { if (!['left', 'right', 'tie'].includes(choice)) throw { status: 400, message: 'Alegere necunoscută.' }; return { pair: pair.pair, winner: choice === 'tie' ? null : pair.sealed[choice], choice }; };
/** Maturity claims (P7) may use thresholds only after a clean calibration + holdout report AND the operator's acceptance. */
/** current (optional): { adjudication: state } — an acceptance bound to other adjudications/set content is stale. */
export function calibrationStatus(reports = [], acceptance = null, current = null) {
  const cal = reports.find(r => r.split === 'calibration'), hold = reports.find(r => r.split === 'holdout');
  const reasons = [];
  if (!cal) reasons.push('Lipsește raportul pe setul de calibrare.');
  if (!hold) reasons.push('Lipsește raportul pe setul rezervat.');
  if (cal && !cal.contamination.clean) reasons.push('Setul rezervat este contaminat.');
  if (cal && cal.determinism.nondeterministic.length) reasons.push('Evaluatori nedeterminiști.');
  if (current?.adjudication && !current.adjudication.complete) reasons.push(`Adjudecarea setului nu este completă (${current.adjudication.pending.length} în așteptare, ${current.adjudication.inconsistencies.length} probleme).`);
  if (!acceptance) reasons.push('Operatorul nu a acceptat încă raportul de calibrare (aprobare umană).');
  else if (current?.adjudication && (acceptance.adjudicationHash !== current.adjudication.hash || acceptance.goldHash !== current.adjudication.set.goldHash)) reasons.push('Acceptarea operatorului privește alte adjudecări sau alt conținut al setului: trebuie reluată.');
  return { thresholdsStatus: reasons.length ? 'proposed' : 'validated', maturityClaimsAllowed: !reasons.length, reasons };
}
