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

/** Editorial assessment of one artifact version (script/final/native) from the critic's reply. */
export function assessText({ reply, content, bp, stage, policy = policyFor(bp), level = 'script', subject = {}, model = null, threshold = null }) {
  const ev = rubricEvaluation(reply, bp, stage, threshold ?? policy.threshold);
  const evidence = Object.fromEntries((Array.isArray(reply?.criteria) ? reply.criteria : []).map(c => [c?.code, quoteFound(c?.evidence, content)]));
  const issueQuotes = (reply?.issues || []).filter(i => i?.quote).map(i => ({ page: i.page ?? null, code: i.code || null, ...quoteFound(i.quote, content) }));
  const fabricated = [...Object.entries(evidence).filter(([, v]) => !v.valid && v.reason === 'not_found').map(([code]) => code), ...issueQuotes.filter(q => !q.valid && q.reason === 'not_found').map(q => `issue:${q.code || ''}@${q.page ?? ''}`)];
  const reasons = [...ev.errors];
  let pass = ev.pass;
  if (policy.version === 2 && !ev.legacy && ev.valid && Object.keys(ev.criteria).length) {   // rubric-based replies only (the native critic has no rubric)
    const low = Object.entries(ev.criteria).filter(([, s]) => policy.minCriterion != null && s < policy.minCriterion).map(([c]) => c);
    const critical = (policy.criticalCodes || []).filter(c => c in ev.criteria && !(ev.criteria[c] >= policy.criticalFloor));
    if (low.length) reasons.push(`Criterii sub ${policy.minCriterion}: ${low.join(', ')}.`);
    if (critical.length) reasons.push(`Criterii critice sub ${policy.criticalFloor}: ${critical.join(', ')}.`);
    if (fabricated.length) reasons.push(`Dovezi care nu se găsesc în text: ${fabricated.join(', ')}.`);
    pass = pass && !low.length && !critical.length && !fabricated.length;
  }
  const valid = ev.valid && !(policy.version === 2 && fabricated.length);   // v2: fabricated evidence makes the reply invalid (fail closed)
  return { schema: 'wonderpages.quality-assessment/1', level, subject: { ...subject, hash: subject.hash || canonicalHash(content ?? null) }, policy: { id: policy.id, version: policy.version, status: policy.status }, model,
    coverage: { valid: ev.valid, errors: ev.errors, legacy: !!ev.legacy, codes: Object.keys(ev.criteria).length },
    criteria: ev.criteria, evidence: { checked: Object.keys(evidence).length + issueQuotes.length, fabricated }, score: ev.score, failedCritical: ev.failedCritical, valid, pass: valid && pass, reasons, at: Date.now() };
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
