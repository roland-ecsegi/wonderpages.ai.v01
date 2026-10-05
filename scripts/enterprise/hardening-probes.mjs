#!/usr/bin/env node
/**
 * Hardening regression registry runner (evaluation/hardening/probes.mjs).
 *   node scripts/enterprise/hardening-probes.mjs before   records the pre-hardening results ONCE (refuses to overwrite)
 *   node scripts/enterprise/hardening-probes.mjs check    runs the current evaluators: before → after → expected
 *   node scripts/enterprise/hardening-probes.mjs json     same as check, machine-readable
 * A probe with `expect: null` is a boundary probe without an operator label: tracked, never scored.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PROBES } from '../../evaluation/hardening/probes.mjs';
import { textSafety } from '../../server/quality/safety.js';
import { ageFit, localization, science } from '../../server/domain/story-contracts.js';
import { assessText, QUALITY_POLICIES } from '../../server/quality/assessment.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BEFORE_FILE = path.join(ROOT, 'evaluation', 'hardening', 'probes-before.json');
const GOLD1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'evaluation', 'gold', 'gold-v1.json'), 'utf8'));
const CODES = Array.from({ length: 18 }, (_, i) => 'T' + String(i + 1).padStart(2, '0'));
const BP = v => ({ rubric: CODES.map(code => ({ code, critical: ['T01', 'T07', 'T08'].includes(code) })), schemas: { critic: {} }, version: 21, ...(v === 2 ? { quality_policy: { version: 2 } } : {}) });
const page = (n, text) => ({ n, text });
const CONTENTS = {
  gold: { title: 'gold', pages: Array.from({ length: 12 }, (_, i) => page(i + 1, `Milo and Tia find a gentle surprise on page ${i + 1}.`)) },
  theEnd: { title: 'p', pages: Array.from({ length: 12 }, (_, i) => page(i + 1, 'The end.')) },
  monster: { title: 'p', pages: [page(1, 'Milo and Tia find a gentle surprise.'), ...Array.from({ length: 11 }, (_, i) => page(i + 2, 'The monster ate the screaming children one by one in the dark.'))] }
};
function replyOf(spec) {
  if (spec === 'case37') return GOLD1.cases.find(c => c.id === 'quality-dinosaurs-3-4-English-01').input.reply;
  if (spec === 'case43') return GOLD1.cases.find(c => c.id === 'quality-dinosaurs-7-8-English-07').input.reply;
  return { criteria: CODES.map(code => ({ code, score: spec[code] ?? spec.all, evidence: 'Milo and Tia find a gentle surprise' })), issues: [] };
}
const qualityCodes = a => [...new Set([...(a.reasonCodes || []).map(r => r.code)])];
const evidenceCodes = a => [...new Set([...(a.evidence?.codes || []), ...((a.evidence?.fabricated || []).length ? ['QUALITY_EVIDENCE_NOT_FOUND'] : [])])];

/** Runs one probe through the CURRENT evaluators; returns a normalised result. */
export function runProbe(p) {
  const i = p.input;
  if (p.kind === 'safety') { const r = textSafety(i.text, { age: i.age }); return { verdict: r.verdict, rules: [...new Set(r.findings.map(f => f.rule))], reasonCodes: [...new Set(r.findings.map(f => f.reasonCode).filter(Boolean))] }; }
  if (p.kind === 'age') return { codes: [...new Set(ageFit([{ n: 1, text: i.page }], i.band).findings.map(f => f.code))] };
  if (p.kind === 'localization') return { codes: [...new Set(localization({ pages: [{ n: 1, text: i.source }] }, { pages: [{ n: 1, text: i.native }] }, { names: i.names || [] }).findings.map(f => f.code))] };
  if (p.kind === 'science') return { rules: [...new Set(science([{ n: 1, text: i.text }], { world: i.world || 'natural' }).findings.filter(f => f.code === 'SCIENCE_CLAIM').map(f => f.rule))] };
  if (p.kind === 'quality') {
    const content = CONTENTS[i.content || 'gold'], reply = replyOf(i.reply), out = {};
    for (const v of [1, 2]) { const a = assessText({ reply, content, bp: BP(v), stage: { critic_prompt: 'critic', critical_threshold: 7 }, policy: QUALITY_POLICIES[v] }); out['v' + v] = { pass: a.pass, score: a.score, exactScore: a.exactScore ?? null, codes: qualityCodes(a), reasons: a.reasons, evidence: evidenceCodes(a) }; }
    return out;
  }
  throw new Error('kind ' + p.kind);
}
/** pass | fail | untracked (no operator label) */
export function judge(p, r) {
  const e = p.expect; if (!e) return 'untracked';
  if (p.kind === 'safety') return (e.verdict ? r.verdict === e.verdict : r.verdict !== e.not) ? 'pass' : 'fail';
  if (p.kind === 'age') return e.signals.every(s => r.codes.includes(s)) ? 'pass' : 'fail';
  if (p.kind === 'localization') return ((e.codes || []).every(c => r.codes.includes(c)) && (e.absent || []).every(c => !r.codes.includes(c))) ? 'pass' : 'fail';
  if (p.kind === 'science') return (e.rule ? r.rules.includes(e.rule) : !r.rules.includes(e.absent)) ? 'pass' : 'fail';
  if (p.kind === 'quality') {
    for (const v of ['v1', 'v2']) { const x = e[v]; if (!x) continue; if (r[v].pass !== x.pass) return 'fail'; if ((x.codes || []).some(c => !r[v].codes.includes(c))) return 'fail'; }
    if (e.evidence && e.evidence.some(c => !r.v1.evidence.includes(c) || !r.v2.evidence.includes(c))) return 'fail';
    return 'pass';
  }
  return 'fail';
}
export function checkAll() {
  const before = fs.existsSync(BEFORE_FILE) ? JSON.parse(fs.readFileSync(BEFORE_FILE, 'utf8')) : null;
  return PROBES.map(p => { const after = runProbe(p), b = before?.results?.[p.id] || null; return { id: p.id, kind: p.kind, obs: p.obs, expected: p.expect, before: b?.result ?? null, beforeJudgement: b?.judgement ?? null, after, judgement: judge(p, after) }; });
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const cmd = process.argv[2] || 'check';
  if (cmd === 'before') {
    if (fs.existsSync(BEFORE_FILE)) { console.error('probes-before.json există deja: rezultatele „înainte” nu se rescriu.'); process.exit(1); }
    const results = Object.fromEntries(PROBES.map(p => { const r = runProbe(p); return [p.id, { result: r, judgement: judge(p, r) }]; }));
    const head = (() => { try { return fs.readFileSync(path.join(ROOT, '.git', 'HEAD'), 'utf8').trim(); } catch { return null; } })();
    fs.writeFileSync(BEFORE_FILE, JSON.stringify({ schema: 'wonderpages.hardening-probes-before/1', recordedAt: new Date().toISOString(), note: 'Executed with the pre-hardening evaluators (evaluator version 1, safety policy 1, quality policies v1/v2). Never rewritten.', gitHead: head, results }, null, 1) + '\n');
    const s = Object.values(results).reduce((m, x) => { m[x.judgement] = (m[x.judgement] || 0) + 1; return m; }, {});
    console.log(JSON.stringify(s));
  } else {
    const rows = checkAll();
    if (cmd === 'json') console.log(JSON.stringify(rows, null, 1));
    else { for (const r of rows) console.log(`${r.id.padEnd(6)} ${String(r.beforeJudgement).padEnd(9)} → ${r.judgement.padEnd(9)} ${JSON.stringify(r.after).slice(0, 150)}`); const s = rows.reduce((m, x) => { m[x.judgement] = (m[x.judgement] || 0) + 1; return m; }, {}); console.log(JSON.stringify(s)); }
  }
}
