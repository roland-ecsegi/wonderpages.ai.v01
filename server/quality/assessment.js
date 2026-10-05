/**
 * P5-T02 — QualityAssessment: editorial (script), native edition and book (OUTPUT-13, RK05 SURPASS, RK25 ADAPT).
 * - Versioned QualityPolicy: v1 = the existing behaviour (average ≥ threshold, critical criteria ≥ 7); v2 = the stricter
 *   OUTPUT-13 proposal (average ≥ 8, T01/T08 ≥ 8, no criterion < 7, evidence validated) applied ONLY to a product type
 *   version that declares it (`quality_policy: { version: 2 }`). Historical assessments are never relabelled.
 * - Coverage: exactly the rubric codes (the 18 IDs are kept), no duplicate/unknown, a score and evidence for each.
 * - Evidence: quotes must exist in the assessed content (a fabricated quote is detected); under v2 it fails closed.
 * - Book: a volume does not pass on 12 good isolated pages — the causal chain must reach a real ending.
 * - Repair: a repaired version is compared with the pre-repair one on the complete check set; regressions are reported.
 */
import { rubricEvaluation } from '../contracts.js';
import { canonicalHash } from '../domain/canonical.js';
import { storyContract, localization } from '../domain/story-contracts.js';

export const QUALITY_POLICIES = Object.freeze({
  1: Object.freeze({ id: 'wonderpages.quality-policy', version: 1, status: 'active', threshold: 8, criticalFloor: 7, criticalCodes: null, minCriterion: null, evidence: 'recorded' }),
  2: Object.freeze({ id: 'wonderpages.quality-policy', version: 2, status: 'proposed', threshold: 8, criticalFloor: 8, criticalCodes: ['T01', 'T08'], minCriterion: 7, evidence: 'validated', note: 'OUTPUT-13: praguri propuse; se calibrează pe setul de aur (P5-T05).' })
});
export const policyFor = bp => QUALITY_POLICIES[Number(bp?.quality_policy?.version) === 2 ? 2 : 1];

const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[“”„«»"'’`]/g, '').replace(/[.,;:!?…—–-]+/g, ' ').replace(/\s+/g, ' ').trim();
const corpus = content => norm([content?.title, content?.back_cover_blurb, ...(content?.pages || []).flatMap(p => [p.text, p.text_ro, p.scene])].filter(Boolean).join(' \n '));
/** A quote is valid when (after normalisation) it occurs in the assessed content; quoted spans inside the evidence are checked individually. */
export function quoteFound(evidence, content) {
  const all = corpus(content), e = String(evidence ?? '');
  const spans = [...e.matchAll(/[“"„«]([^”"»]{4,})[”"»]/g)].map(m => m[1]);
  const parts = (spans.length ? spans : [e.replace(/^\s*(p(age|agina)?\.?\s*\d+\s*[:—-]\s*)/i, '')]).map(norm).filter(x => x.length >= 4);
  if (!parts.length) return { valid: false, reason: 'insufficient' };
  const bad = parts.filter(x => !all.includes(x) && !x.split(/\s*\.\.\.\s*|\s*…\s*/).every(seg => !seg || all.includes(seg)));
  return bad.length ? { valid: false, reason: 'not_found', missing: bad } : { valid: true };
}

/**
 * Deterministic format check (the measurable part of T08 — never left to the critic alone): page count and sequence
 * against the product contract (bp.structure.pages). The editorial part of T08 (length vs the age guideline, justified
 * variation) stays with the critic and is only reported here as guidance.
 */
export function formatCheck(content, bp) {
  const P = Number(bp?.structure?.pages), pages = Array.isArray(content?.pages) ? content.pages : null, findings = [];
  if (!P || !pages || !pages.length) return { checked: false, findings };
  if (pages.length !== P) findings.push({ code: 'QUALITY_FORMAT_PAGE_COUNT', layer: 'deterministic', value: pages.length, expected: P, message: `Textul are ${pages.length} pagini de conținut; contractul produsului cere exact ${P}.`, repair: `Readu manuscrisul la ${P} pagini (nu se taie în tăcere).` });
  else if (!pages.every((p, i) => Number(p?.n) === i + 1)) findings.push({ code: 'QUALITY_FORMAT_SEQUENCE', layer: 'deterministic', message: `Paginile nu sunt numerotate 1..${P}.`, repair: 'Renumerotează paginile în ordine.' });
  return { checked: true, findings };
}
const evNorm = s => norm(s).replace(/^p(age|agina)? ?\d+ /, '');
/**
 * Evidence validity (OBS-GS-18) — a layer SEPARATE from the gate verdict: presence (the quote exists), reuse (the same
 * quote offered for several unrelated criteria) and relevance (whether the quote supports the criterion: not verifiable
 * deterministically → reported as `unverified`, never claimed). Under policies v1/v2 this layer does not change `pass`;
 * whether it should gate acceptance is an operator decision (see records/HARDENING.md).
 */
export function evidenceValidity(reply, content, presence) {
  const crit = Array.isArray(reply?.criteria) ? reply.criteria : [], groups = {};
  for (const c of crit) { const k = evNorm(c?.evidence); if (k.length >= 4) (groups[k] = groups[k] || []).push(c.code); }
  const reused = Object.values(groups).filter(g => g.length >= 3), codes = [];
  const missing = Object.entries(presence).filter(([, v]) => !v.valid && v.reason === 'not_found').map(([c]) => c), thin = Object.entries(presence).filter(([, v]) => !v.valid && v.reason === 'insufficient').map(([c]) => c);
  if (missing.length) codes.push('QUALITY_EVIDENCE_NOT_FOUND');
  if (thin.length) codes.push('EVIDENCE_INSUFFICIENT');
  if (reused.length) codes.push('EVIDENCE_REUSED_ACROSS_CRITERIA');
  return { codes, missing, insufficient: thin, reused, relevance: 'unverified', status: codes.length ? 'weak' : 'present_unverified' };
}

/** Editorial assessment of one artifact version (script/final/native) from the critic's reply. */
export function assessText({ reply, content, bp, stage, policy = policyFor(bp), level = 'script', subject = {}, model = null, threshold = null }) {
  const thr = threshold ?? policy.threshold, ev = rubricEvaluation(reply, bp, stage, thr);
  const evidence = Object.fromEntries((Array.isArray(reply?.criteria) ? reply.criteria : []).map(c => [c?.code, quoteFound(c?.evidence, content)]));
  const issueQuotes = (reply?.issues || []).filter(i => i?.quote).map(i => ({ page: i.page ?? null, code: i.code || null, ...quoteFound(i.quote, content) }));
  const fabricated = [...Object.entries(evidence).filter(([, v]) => !v.valid && v.reason === 'not_found').map(([code]) => code), ...issueQuotes.filter(q => !q.valid && q.reason === 'not_found').map(q => `issue:${q.code || ''}@${q.page ?? ''}`)];
  const reasons = [...ev.errors], reasonCodes = [], add = r => reasonCodes.push(r);
  const rubric = ev.valid && !ev.legacy && Object.keys(ev.criteria).length > 0;
  /* OBS-GS-19: every active failure condition gets its own code (failure → code → evidence → explanation → repair) */
  if (!ev.valid) add({ code: 'QUALITY_COVERAGE_INVALID', layer: 'gate', errors: ev.errors, message: ev.errors.join(' '), repair: 'Cere o evaluare completă (toate criteriile, cu notă și dovadă).' });
  const exact = ev.exactScore ?? ev.score;
  if (ev.valid && exact < thr) { const m = `Media evaluării este ${Math.round(exact * 1000) / 1000} (afișat ${ev.score}); pragul este ${thr}.`; add({ code: 'QUALITY_MEAN_BELOW_THRESHOLD', layer: 'gate', value: exact, display: ev.score, threshold: thr, message: m, repair: 'Îmbunătățește criteriile cu notele cele mai mici; media globală trebuie să atingă pragul.' }); reasons.push(m); }
  const crit = {};   // criterion → strictest failed floor (rubric floor for every policy; v2 adds its stricter floor)
  for (const c of ev.failedCritical || []) crit[c] = { floor: stage?.critical_threshold ?? 7, source: 'rubric' };
  let pass = ev.pass;
  if (policy.version === 2 && rubric) {   // rubric-based replies only (the native critic has no rubric)
    const low = Object.entries(ev.criteria).filter(([, s]) => policy.minCriterion != null && s < policy.minCriterion).map(([c]) => c);
    const critical = (policy.criticalCodes || []).filter(c => c in ev.criteria && !(ev.criteria[c] >= policy.criticalFloor));
    if (low.length) reasons.push(`Criterii sub ${policy.minCriterion}: ${low.join(', ')}.`);
    if (critical.length) reasons.push(`Criterii critice sub ${policy.criticalFloor}: ${critical.join(', ')}.`);
    if (fabricated.length) reasons.push(`Dovezi care nu se găsesc în text: ${fabricated.join(', ')}.`);
    for (const c of low) add({ code: 'QUALITY_CRITERION_BELOW_MINIMUM', layer: 'gate', criterion: c, value: ev.criteria[c], threshold: policy.minCriterion, validation: 'universal floor — operator-adjudicated only for T13=6.5; NOT validated for every criterion', message: `${c} = ${ev.criteria[c]}, sub minimul ${policy.minCriterion}.`, repair: `Repară criteriul ${c}.` });
    for (const c of critical) crit[c] = { floor: policy.criticalFloor, source: 'policy-v2' };
    if (fabricated.length) add({ code: 'QUALITY_EVIDENCE_NOT_FOUND', layer: 'evidence', criteria: fabricated, message: `Dovezi care nu se găsesc în text: ${fabricated.join(', ')}.`, repair: 'Cere criticului citate care apar literal în text.' });
    pass = pass && !low.length && !critical.length && !fabricated.length;
  }
  const v1Critical = (ev.failedCritical || []).filter(c => crit[c]?.source === 'rubric');
  if (v1Critical.length) reasons.push(`Criterii critice sub ${stage?.critical_threshold ?? 7}: ${v1Critical.join(', ')}.`);
  for (const [c, f] of Object.entries(crit)) add({ code: 'QUALITY_CRITICAL_BELOW_FLOOR', layer: 'gate', criterion: c, value: ev.criteria?.[c] ?? null, threshold: f.floor, source: f.source, message: `Criteriul critic ${c} = ${ev.criteria?.[c] ?? '—'}, sub pragul ${f.floor}.`, repair: `Repară criteriul critic ${c}.` });
  const format = level === 'script' || level === 'native' ? formatCheck(content, bp) : { checked: false, findings: [] };
  for (const f of format.findings) { add(f); reasons.push(f.message); }
  if (format.findings.length) pass = false;   // a contract violation is never compensated by scores
  const valid = ev.valid && !(policy.version === 2 && fabricated.length);   // v2: fabricated evidence makes the reply invalid (fail closed)
  const ed = evidenceValidity(reply, content, evidence);
  return { schema: 'wonderpages.quality-assessment/1', level, subject: { ...subject, hash: subject.hash || canonicalHash(content ?? null) }, policy: { id: policy.id, version: policy.version, status: policy.status }, model,
    coverage: { valid: ev.valid, errors: ev.errors, legacy: !!ev.legacy, codes: Object.keys(ev.criteria).length },
    criteria: ev.criteria, evidence: { checked: Object.keys(evidence).length + issueQuotes.length, fabricated, codes: ed.codes, reused: ed.reused, relevance: ed.relevance, status: ed.status }, score: ev.score, exactScore: exact, threshold: thr, failedCritical: ev.failedCritical, format, valid, pass: valid && pass, reasons, reasonCodes, at: Date.now() };
}

/** Book assessment: text assessment + causal chain to a real ending + structure; safety stays separate (never averaged). */
export function assessBook({ bp, art, project, v }) {
  const key = art[`final_${v}`] ? `final_${v}` : `script_${v}`, c = art[key]?.content, reasons = [];
  if (!c) return { schema: 'wonderpages.book-assessment/1', volume: v + 1, pass: false, reasons: ['Volumul nu are manuscris.'], checks: {} };
  const P = bp.structure?.pages || 12, pages = c.pages || [];
  const seq = pages.length === P && pages.every((p, i) => Number(p.n) === i + 1);
  if (!seq) reasons.push(`Secvența paginilor nu este 1..${P}.`);
  const sc = storyContract({ bp, art, input: project?.input || {}, v });
  const cons = sc?.causality?.links?.consequence, last = pages[pages.length - 1];
  const ending = !!cons && cons.page >= Math.ceil(P * 0.66) && String(last?.text || '').trim().length > 0;
  if (!cons) reasons.push('Lanțul cauzal nu ajunge la o consecință: cartea nu are final dovedit.');
  else if (!ending) reasons.push(`Consecința apare pe pagina ${cons.page}; finalul (ultima treime și ultima pagină) lipsește.`);
  for (const f of (sc?.findings || []).filter(f => f.severity === 'blocker')) reasons.push(f.message);
  const text = art[key]?.meta?.assessment || null;
  if (!text) reasons.push('Lipsește evaluarea editorială curentă a textului.');
  else if (text.subject?.hash && text.subject.hash !== canonicalHash(c)) reasons.push('Evaluarea editorială este pentru o altă versiune a textului (învechită).');
  else if (!text.pass) reasons.push('Evaluarea editorială nu trece politica ' + (text.policy?.version ?? '?') + '.');
  return { schema: 'wonderpages.book-assessment/1', volume: v + 1, artifact: key, policy: text?.policy || null, checks: { sequence: seq, ending, causality: sc?.causality || null, text: text ? { pass: text.pass, score: text.score, policy: text.policy, at: text.at } : null }, pass: !reasons.length, reasons };
}

/** Native edition checks before/after a repair: any new deterministic issue or lower criterion is a regression. */
export function nativeChecks(src, tr, { names = [], language = 'Romanian' } = {}) { return localization(src, tr, { names, language }).findings; }
export function regressions(before, after) {
  const out = [];
  for (const [code, s] of Object.entries(before?.criteria || {})) if (after?.criteria?.[code] != null && after.criteria[code] < s) out.push({ kind: 'criterion', code, from: s, to: after.criteria[code] });
  if (before?.score != null && after?.score != null && after.score < before.score) out.push({ kind: 'score', from: before.score, to: after.score });
  const key = f => `${f.code}@${f.page ?? ''}`, had = new Set((before?.checks || []).map(key));
  for (const f of after?.checks || []) if (!had.has(key(f)) && ['blocker', 'major'].includes(f.severity)) out.push({ kind: 'check', code: f.code, page: f.page ?? null, message: f.message });
  return out;
}
