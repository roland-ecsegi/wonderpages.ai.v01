/**
 * Hardening regression registry (evaluation/hardening/probes.mjs): runs every Gold-v1 probe through the CURRENT
 * evaluators and judges it against the direction the operator stated (or `untracked` when the operator left it unlabeled).
 * Used by the hardening tests, the before/after report and the Gold validation guard (a validation is never complete
 * while a repaired defect regresses).
 */
import { PROBES, PROBE_CONTENTS, PROBE_REPLY_CASES, probeReply } from '../../evaluation/hardening/probes.mjs';
import { textSafety } from './safety.js';
import { ageFit, localization, science } from '../domain/story-contracts.js';
import { assessText, QUALITY_POLICIES } from './assessment.js';
import fs from 'node:fs';
const GOLD1 = JSON.parse(fs.readFileSync(new URL('../../evaluation/gold/gold-v1.json', import.meta.url), 'utf8'));

const CODES = Array.from({ length: 18 }, (_, i) => 'T' + String(i + 1).padStart(2, '0'));
const BP = v => ({ rubric: CODES.map(code => ({ code, critical: ['T01', 'T07', 'T08'].includes(code) })), schemas: { critic: {} }, version: 21, ...(v === 2 ? { quality_policy: { version: 2 } } : {}) });
const replyOf = spec => typeof spec === 'string' ? GOLD1.cases.find(c => c.id === PROBE_REPLY_CASES[spec]).input.reply : probeReply(spec);
export function runProbe(p) {
  const i = p.input;
  if (p.kind === 'safety') { const r = textSafety(i.text, { age: i.age }); return { verdict: r.verdict, rules: [...new Set(r.findings.map(f => f.rule))], reasonCodes: [...new Set(r.findings.map(f => f.reasonCode).filter(Boolean))] }; }
  if (p.kind === 'age') return { codes: [...new Set(ageFit([{ n: 1, text: i.page }], i.band).findings.map(f => f.code))] };
  if (p.kind === 'localization') return { codes: [...new Set(localization({ pages: [{ n: 1, text: i.source }] }, { pages: [{ n: 1, text: i.native }] }, { names: i.names || [] }).findings.map(f => f.code))] };
  if (p.kind === 'science') return { rules: [...new Set(science([{ n: 1, text: i.text }], { world: i.world || 'natural' }).findings.filter(f => f.code === 'SCIENCE_CLAIM').map(f => f.rule))] };
  const content = PROBE_CONTENTS[i.content || 'gold'], reply = replyOf(i.reply), out = {};
  for (const v of [1, 2]) { const a = assessText({ reply, content, bp: BP(v), stage: { critic_prompt: 'critic', critical_threshold: 7 }, policy: QUALITY_POLICIES[v] }); out['v' + v] = { pass: a.pass, score: a.score, exactScore: a.exactScore ?? null, codes: [...new Set((a.reasonCodes || []).map(r => r.code))], reasons: a.reasons, evidence: [...new Set([...(a.evidence?.codes || []), ...((a.evidence?.fabricated || []).length ? ['QUALITY_EVIDENCE_NOT_FOUND'] : [])])] }; }
  return out;
}
export function judge(p, r) {
  const e = p.expect; if (!e) return 'untracked';
  if (p.kind === 'safety') return (e.verdict ? r.verdict === e.verdict : r.verdict !== e.not) ? 'pass' : 'fail';
  if (p.kind === 'age') return e.signals.every(s => r.codes.includes(s)) ? 'pass' : 'fail';
  if (p.kind === 'localization') return ((e.codes || []).every(c => r.codes.includes(c)) && (e.absent || []).every(c => !r.codes.includes(c))) ? 'pass' : 'fail';
  if (p.kind === 'science') return (e.rule ? r.rules.includes(e.rule) : !r.rules.includes(e.absent)) ? 'pass' : 'fail';
  for (const v of ['v1', 'v2']) { const x = e[v]; if (!x) continue; if (r[v].pass !== x.pass) return 'fail'; if ((x.codes || []).some(c => !r[v].codes.includes(c))) return 'fail'; }
  if (e.evidence && e.evidence.some(c => !r.v1.evidence.includes(c) || !r.v2.evidence.includes(c))) return 'fail';
  return 'pass';
}
export function runRegistry() {
  const rows = PROBES.map(p => ({ id: p.id, kind: p.kind, judgement: judge(p, runProbe(p)) }));
  const failing = rows.filter(r => r.judgement === 'fail').map(r => r.id);
  return { ok: !failing.length, tracked: rows.filter(r => r.judgement !== 'untracked').length, untracked: rows.filter(r => r.judgement === 'untracked').length, failing };
}
export { PROBES };
