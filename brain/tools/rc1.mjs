#!/usr/bin/env node
/**
 * RC1 — Policy Dependency Closure / Pre-Hardening Specification: consistency checks of the RC1 deliverables.
 *
 *   node brain/tools/rc1.mjs check [--json]     register ↔ canonical sources, dispositions ↔ classes, package / spec references,
 *                                               coverage matrix, threshold-policy hash, ground-truth schema, RC1 decision ledger,
 *                                               artificial test vectors. Exit 0 CONSISTENT, 1 INCONSISTENT. Used by gate G15.
 *   node brain/tools/rc1.mjs vectors [--write]  recompute the artificial test vectors of [S-TOOLING] (docs/enterprise/rc1/spec/test-vectors.json)
 *   node brain/tools/rc1.mjs status              open NORMATIVE dependencies and package questions (closure readiness)
 *
 * Reference computations here exist only to make the specification self-consistent on ARTIFICIAL data. They are not the
 * generic tooling of D-22-DEP-GENERIC-TOOLING (its implementation needs a separate authorization) and never touch Gold,
 * hidden or application data. Control plane only: no application import, no network.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { BRAIN_ROOT, sha256, canon, canonHash, readJSON, readText, exists, readJSONL, verifyChain } from './lib.mjs';

export const RC1 = Object.freeze({
  register: 'docs/enterprise/rc1/DEPENDENCY-REGISTER.json', spec: 'docs/enterprise/rc1/PRE-HARDENING-SPEC.md', package: 'docs/enterprise/rc1/OPERATOR-DECISION-PACKAGE-01.md',
  matrix: 'docs/enterprise/rc1/spec/coverage-matrix.json', thresholds: 'docs/enterprise/rc1/spec/threshold-policy.rc1.json', gtSchema: 'docs/enterprise/rc1/spec/ground-truth.schema.json',
  vectors: 'docs/enterprise/rc1/spec/test-vectors.json', decisions: 'evaluation/rc1-policy/decisions.jsonl', policyLedger: 'evaluation/gold-v2-policy/decisions.jsonl', depIndex: 'brain/ledger/DEPENDENCIES.json'
});
const CLASS_DISPOSITIONS = {
  NORMATIVE: ['OPERATOR_DECISION_REQUIRED', 'CLOSED_BY_OPERATOR_DECISION', 'DEFERRED_BY_OPERATOR'],
  ENGINEERING: ['CLOSED_BY_SPECIFICATION'], EMPIRICAL: ['EVIDENCE_ROUTE_SPECIFIED'], OUT_OF_SCOPE: ['EXCLUDED_FROM_RC1'], RESOLVED_BEFORE_RC1: ['RESOLVED_BY_EXISTING_DECISION']
};
const PUBLISHING = ['PASS', 'PASS_WITH_ADVISORY', 'REVIEW_REQUIRED', 'REPAIR_REQUIRED', 'BLOCKED_BY_POLICY', 'ASSESSMENT_INVALID', 'ASSESSMENT_VALIDATION_REQUIRED'];
const AUTO = new Set(['PASS', 'PASS_WITH_ADVISORY']), NON_WAIVABLE = new Set(['BLOCKED_BY_POLICY', 'REPAIR_REQUIRED']);

/* ------------------------------------------------------------------ statistics (D-21 convention) */
const lnC = (n, k) => { let s = 0; for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i); return s; };
/** P(X ≤ x) for X ~ Binomial(n, p). */
export function binomCdf(x, n, p) { if (p <= 0) return 1; if (p >= 1) return x >= n ? 1 : 0; let s = 0; for (let k = 0; k <= x; k++) s += Math.exp(lnC(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p)); return Math.min(1, s); }
/** One-sided exact (Clopper–Pearson) upper bound at confidence 1 − alpha: the p with P(X ≤ x | n, p) = alpha. */
export function upperBound(x, n, alpha = 0.05) { if (x >= n) return 1; if (x === 0) return 1 - Math.pow(alpha, 1 / n); let lo = 0, hi = 1; for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (binomCdf(x, n, mid) > alpha) lo = mid; else hi = mid; } return hi; }
export const minNAtZero = (max = 0.05, alpha = 0.05) => { let n = 1; while (upperBound(0, n, alpha) > max) n++; return n; };
const round = (v, d = 6) => Math.round(v * 10 ** d) / 10 ** d;

/* ------------------------------------------------------------------ salted Merkle commitment (spec [S-TOOLING] T1) */
const H = (...bufs) => crypto.createHash('sha256').update(Buffer.concat(bufs)).digest();
export const leafHash = c => H(Buffer.from([0]), Buffer.from(canon({ v: 1, ...c }), 'utf8'));
export function merkleRoot(cases) {
  let level = [...cases].sort((a, b) => (a.caseId < b.caseId ? -1 : a.caseId > b.caseId ? 1 : 0)).map(leafHash);
  if (!level.length) return null;
  while (level.length > 1) { const next = []; for (let i = 0; i < level.length; i += 2) next.push(i + 1 < level.length ? H(Buffer.from([1]), level[i], level[i + 1]) : level[i]); level = next; }
  return level[0].toString('hex');
}

/* ------------------------------------------------------------------ D-21 gate calculator on artificial pairs (spec [S-TOOLING] T4) */
/** rows: [{ expected, expectedKind?, actual, actualKind? }]; q20: 'A' (confirm-or-dismiss REVIEW is not a P2 downgrade of REPAIR) | 'B' (strict). */
export function gates(rows, policy, { q20 = 'A' } = {}) {
  const p1 = rows.filter(r => !AUTO.has(r.expected)), esc = p1.filter(r => AUTO.has(r.actual));
  const p2 = rows.filter(r => NON_WAIVABLE.has(r.expected));
  const down = p2.filter(r => r.actual === 'REVIEW_REQUIRED' && (r.expected === 'BLOCKED_BY_POLICY' || q20 === 'B' || r.actualKind !== 'confirm-or-dismiss'));
  const p3 = rows.filter(r => AUTO.has(r.expected)), fe = p3.filter(r => !AUTO.has(r.actual));
  const g1 = policy.gates.P1, g3 = policy.gates.P3, ub1 = upperBound(esc.length, p1.length || 1);
  const P1 = esc.length > g1.maxObserved ? 'FAIL' : p1.length && ub1 <= g1.bound.max ? 'PASS' : 'INSUFFICIENT_EVIDENCE';
  const P2 = down.length > policy.gates.P2.maxObserved ? 'FAIL' : 'PASS';
  const rate3 = p3.length ? fe.length / p3.length : null;
  const P3 = p3.length < g3.minDenominator ? 'INSUFFICIENT_EVIDENCE' : rate3 <= g3.maxObservedRate ? 'PASS' : 'FAIL';
  const overall = [P1, P2, P3].includes('FAIL') ? 'FAIL' : [P1, P2, P3].includes('INSUFFICIENT_EVIDENCE') ? 'INSUFFICIENT_EVIDENCE' : 'PASS';
  return { P1: { verdict: P1, escapes: esc.length, opportunities: p1.length, upperBound95: round(ub1) }, P2: { verdict: P2, downgrades: down.length, opportunities: p2.length }, P3: { verdict: P3, falseEscalations: fe.length, denominator: p3.length, rate: rate3 === null ? null : round(rate3) }, overall };
}

export function computeVectors(root = BRAIN_ROOT) {
  const policy = readJSON(RC1.thresholds, root);
  const rep = (n, o) => Array.from({ length: n }, () => ({ ...o }));
  const truth = [...rep(30, { expected: 'BLOCKED_BY_POLICY' }), ...rep(20, { expected: 'REPAIR_REQUIRED' }), ...rep(9, { expected: 'REVIEW_REQUIRED' }), ...rep(30, { expected: 'PASS' })];
  const as = f => truth.map(t => ({ ...t, ...f(t) }));
  const scen = {
    perfect: as(t => ({ actual: t.expected, actualKind: t.expected === 'REVIEW_REQUIRED' ? 'waivable' : undefined })),
    alwaysPass: as(() => ({ actual: 'PASS' })), alwaysBlock: as(() => ({ actual: 'BLOCKED_BY_POLICY' })), alwaysReviewWaivable: as(() => ({ actual: 'REVIEW_REQUIRED', actualKind: 'waivable' })),
    repairAsCandidateReview: as(t => ({ actual: t.expected === 'REPAIR_REQUIRED' ? 'REVIEW_REQUIRED' : t.expected, actualKind: t.expected === 'REPAIR_REQUIRED' ? 'confirm-or-dismiss' : t.expected === 'REVIEW_REQUIRED' ? 'waivable' : undefined })),
    smallSample: [...rep(12, { expected: 'BLOCKED_BY_POLICY', actual: 'BLOCKED_BY_POLICY' }), ...rep(30, { expected: 'PASS', actual: 'PASS' })],
    threeFalseEscalations: as((t, i) => ({ actual: t.expected })).map((r, i) => (r.expected === 'PASS' && i >= truth.length - 3 ? { ...r, actual: 'REVIEW_REQUIRED', actualKind: 'waivable' } : r))
  };
  const out = {};
  for (const [k, rows] of Object.entries(scen)) out[k] = { q20A: gates(rows, policy, { q20: 'A' }), q20B: gates(rows, policy, { q20: 'B' }) };
  const cases = [1, 2, 3].map(i => ({ datasetVersion: 'artificial-test-1', policyVersion: 'artificial', caseId: `ART-000${i}`, nonce: String(i).padStart(64, '0'), stimulus: { text: `artificial stimulus ${i}` }, groundTruth: { publishingConsequence: i === 2 ? 'REVIEW_REQUIRED' : 'PASS' } }));
  return {
    schema: 'wonderpages.rc1.test-vectors/1', note: 'ARTIFICIAL data only (D-22 §21). Recomputed by node brain/tools/rc1.mjs check; any difference is a specification inconsistency.',
    statistics: { upperBound_0_of_59: round(upperBound(0, 59)), upperBound_0_of_58: round(upperBound(0, 58)), minN_oneSided95_le5pct: minNAtZero(), minN_twoSided95_le5pct: minNAtZero(0.05, 0.025), upperBound_1_of_100: round(upperBound(1, 100)), upperBound_3_of_30: round(upperBound(3, 30)) },
    merkle: { leaves: cases.map(c => ({ caseId: c.caseId, leaf: leafHash(c).toString('hex') })), root: merkleRoot(cases), rootWithCase2Changed: merkleRoot(cases.map(c => (c.caseId === 'ART-0002' ? { ...c, groundTruth: { publishingConsequence: 'PASS' } } : c))) },
    gates: out
  };
}

/* ------------------------------------------------------------------ check */
export function check(root = BRAIN_ROOT) {
  const problems = [], P = m => problems.push(m);
  if (!exists(RC1.register, root)) return { RC1_REGISTER: 'ABSENT', problems: [] };
  let reg, spec, pkg, matrix, policy, schema;
  try { reg = readJSON(RC1.register, root); spec = readText(RC1.spec, root); pkg = readText(RC1.package, root); matrix = readJSON(RC1.matrix, root); policy = readJSON(RC1.thresholds, root); schema = readJSON(RC1.gtSchema, root); }
  catch (e) { return { RC1_REGISTER: 'INCONSISTENT', problems: ['cannot load RC1 deliverables: ' + e.message] }; }
  const ledger = readJSONL(RC1.policyLedger, root), idx = readJSON(RC1.depIndex, root);
  const owned = {}; for (const e of ledger) for (const d of e.openDependencies || []) if (d.id.slice(0, 4) === e.decision && !owned[d.id]) owned[d.id] = { decision: e.decision, question: d.question, status: d.status };
  const specMarks = new Set([...spec.matchAll(/^#+ \[(S-[A-Z0-9-]+)\]/gm)].map(m => m[1]));
  const pkgQs = new Set([...pkg.matchAll(/^### (Q-\d\d) /gm)].map(m => m[1]));
  const rc1Dec = readJSONL(RC1.decisions, root);
  if (rc1Dec.length) { const ch = verifyChain(rc1Dec); if (!ch.ok) P('RC1 decision ledger chain: ' + ch.errors.join('; ')); for (const e of rc1Dec) { if (e.actor !== 'operator') P(`${e.decision}: actor must be operator`); if (e.statementSha256 !== sha256(Buffer.from(e.statement || '', 'utf8'))) P(`${e.decision}: statementSha256`); } }
  const decisionCloses = id => rc1Dec.filter(e => (e.closes || []).includes(id) || (e.defers || []).includes(id));

  /* register ↔ canonical sources */
  const ids = reg.dependencies.map(d => d.id), want = new Set([...idx.open, ...idx.resolved, ...Object.keys(owned)]);
  if (new Set(ids).size !== ids.length) P('duplicate dependency ids in the register');
  for (const id of want) if (!ids.includes(id)) P(`missing from the register: ${id}`);
  for (const id of ids) if (!want.has(id)) P(`register lists an unknown dependency: ${id}`);
  const usedQs = new Set();
  for (const d of reg.dependencies) {
    const L = owned[d.id];
    if (!L) P(`${d.id}: not an openDependencies entry of its own decision in the ledger`);
    else { if (d.owner !== L.decision) P(`${d.id}: owner ${d.owner} ≠ ${L.decision}`); if (d.ledger?.question !== L.question) P(`${d.id}: ledger question not verbatim`); if (d.ledger?.status !== L.status) P(`${d.id}: ledger status not verbatim`); }
    const sec = idx.open.includes(d.id) ? 'open' : idx.resolved.includes(d.id) ? 'resolved' : 'unlisted';
    if (d.closureSection10 !== sec) P(`${d.id}: closureSection10 ${d.closureSection10} ≠ ${sec}`);
    if (!CLASS_DISPOSITIONS[d.class]) { P(`${d.id}: unknown class ${d.class}`); continue; }
    if (!CLASS_DISPOSITIONS[d.class].includes(d.disposition)) P(`${d.id}: disposition ${d.disposition} not allowed for class ${d.class}`);
    if (sec === 'open' && d.class === 'RESOLVED_BEFORE_RC1') P(`${d.id}: open in closure §10 but classed RESOLVED_BEFORE_RC1`);
    if (sec !== 'open' && d.class !== 'RESOLVED_BEFORE_RC1') P(`${d.id}: resolved before RC1 but classed ${d.class}`);
    if (sec === 'unlisted' && d.resolvedBy !== L?.status) P(`${d.id}: unlisted dependency must be resolved by the decision its ledger status names (${L?.status})`);
    if (sec === 'open' && !(d.rationale || '').trim()) P(`${d.id}: rationale missing`);
    for (const r of d.specRefs || []) if (!specMarks.has(r)) P(`${d.id}: spec marker [${r}] not found in ${RC1.spec}`);
    if (d.packageRef) { usedQs.add(d.packageRef); if (!pkgQs.has(d.packageRef)) P(`${d.id}: ${d.packageRef} not found in ${RC1.package}`); }
    if (d.class === 'NORMATIVE') {
      if (d.disposition === 'OPERATOR_DECISION_REQUIRED' && !d.packageRef) P(`${d.id}: NORMATIVE without a package question`);
      if (d.disposition !== 'OPERATOR_DECISION_REQUIRED') { const by = decisionCloses(d.id); if (!by.length) P(`${d.id}: ${d.disposition} without a verbatim operator decision in ${RC1.decisions}`); }
    }
    if (d.class === 'ENGINEERING' && !(d.specRefs || []).length) P(`${d.id}: ENGINEERING without specification reference`);
    if (d.class === 'EMPIRICAL' && (!(d.evidenceRoute || '').trim() || !(d.specRefs || []).length)) P(`${d.id}: EMPIRICAL without evidence route / spec reference`);
    if (d.class === 'OUT_OF_SCOPE' && !(d.rc1Consequence || '').trim()) P(`${d.id}: OUT_OF_SCOPE without consequence for the RC1 claim`);
  }
  const cnt = k => Object.fromEntries([...new Set(reg.dependencies.map(d => d[k]))].map(v => [v, reg.dependencies.filter(d => d[k] === v).length]));
  if (reg.counts?.total !== ids.length || canon(reg.counts.byClass) !== canon(cnt('class')) || canon(reg.counts.byDisposition) !== canon(cnt('disposition'))) P('register counts do not match its entries');

  /* coverage matrix */
  const cids = matrix.cells.map(c => c.id);
  if (new Set(cids).size !== cids.length) P('coverage matrix: duplicate cell ids');
  for (const c of matrix.cells) {
    if (!matrix.requirementStates.includes(c.requirement)) P(`${c.id}: unknown requirement ${c.requirement}`);
    if (c.requirement === 'REQUIRED' && !(PUBLISHING.includes(c.expectedPublishing) || Object.keys(matrix.expectedValues).includes(c.expectedPublishing))) P(`${c.id}: REQUIRED cell without a valid expected consequence`);
    if (c.requirement === 'COVERAGE_REQUIREMENT_UNRESOLVED' && !c.dependsOn) P(`${c.id}: unresolved cell without dependsOn`);
    if (c.dependsOn) { usedQs.add(c.dependsOn); if (!pkgQs.has(c.dependsOn)) P(`${c.id}: ${c.dependsOn} not found in the package`); }
  }
  if (matrix.counts.cells !== matrix.cells.length) P('coverage matrix counts do not match');
  for (const q of pkgQs) if (!usedQs.has(q)) P(`package question ${q} is referenced by no dependency or cell`);

  /* threshold policy */
  const { canonicalSha256, ...body } = policy;
  if (canonicalSha256 !== canonHash(body)) P(`threshold policy canonicalSha256 ≠ canonical hash (${canonHash(body).slice(0, 16)}…)`);
  for (const s of policy.policySources || []) { const e = ledger.find(x => x.decision === s.decision); if (!e || e.hash !== s.entryHash) P(`threshold policy source ${s.decision}: entry hash ≠ ledger`); }
  if (policy.gates?.P1?.minOpportunitiesAtZero !== minNAtZero(policy.gates.P1.bound.max, 1 - policy.gates.P1.bound.confidence)) P('threshold policy: P1 minimum opportunities ≠ computed minimum for the declared bound');
  if (policy.gates?.P3?.maxObservedRate !== 0.10 || policy.gates?.P3?.minDenominator !== 30 || policy.gates?.P1?.bound?.max !== 0.05 || policy.gates?.P1?.maxObserved !== 0 || policy.gates?.P2?.maxObserved !== 0) P('threshold policy values differ from D-21 (P1 0 / ≤ 5 %, P2 0, P3 ≤ 10 % on ≥ 30)');

  /* ground-truth schema */
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema' || !['stimulus', 'expected', 'legacyProjection', 'provenance'].every(k => schema.required.includes(k))) P('ground-truth schema: not a 2020-12 schema with the D-19 sections');
  if (canon(schema.$defs?.publishingState?.enum) !== canon(PUBLISHING)) P('ground-truth schema: publishing states differ from the D-19 vocabulary');

  /* test vectors */
  if (!exists(RC1.vectors, root)) P(`${RC1.vectors} missing (run rc1.mjs vectors --write)`);
  else { const v = computeVectors(root), stored = readJSON(RC1.vectors, root); if (canon(v) !== canon(stored)) P('artificial test vectors differ from their recomputation'); if (v.statistics.minN_oneSided95_le5pct !== 59 || v.statistics.minN_twoSided95_le5pct !== 72) P('statistics: 59 / 72 anchors of D-21 §8 not reproduced'); }

  /* a spec line that says it closes ("Închide …") a dependency that is still NORMATIVE and open misstates the register (audit RC1-B01) */
  for (const line of spec.split('\n').filter(l => /^Închide\b/.test(l))) for (const d of reg.dependencies) if (d.class === 'NORMATIVE' && d.disposition === 'OPERATOR_DECISION_REQUIRED' && line.includes(d.id)) P(`spec claims to close ${d.id}, which is NORMATIVE and open in the register`);
  const openNormative = reg.dependencies.filter(d => d.disposition === 'OPERATOR_DECISION_REQUIRED').map(d => d.id);
  return {
    RC1_REGISTER: problems.length ? 'INCONSISTENT' : 'CONSISTENT', problems,
    summary: { dependencies: ids.length, byClass: cnt('class'), byDisposition: cnt('disposition'), openNormative: openNormative.length, packageQuestions: pkgQs.size, matrixCells: cids.length, requiredCells: matrix.cells.filter(c => c.requirement === 'REQUIRED').length, rc1Decisions: rc1Dec.length },
    closureReady: !problems.length && !openNormative.length, openNormative
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const cmd = process.argv[2] || 'check', flags = process.argv.slice(3);
  if (cmd === 'check') { const r = check(); console.log(flags.includes('--json') ? JSON.stringify(r, null, 1) : `RC1_REGISTER = ${r.RC1_REGISTER}\n${JSON.stringify(r.summary)}\n${r.problems.map(p => '  - ' + p).join('\n')}`); process.exit(r.RC1_REGISTER === 'INCONSISTENT' ? 1 : 0); }
  else if (cmd === 'vectors') { const v = computeVectors(); if (flags.includes('--write')) fs.writeFileSync(path.join(BRAIN_ROOT, RC1.vectors), JSON.stringify(v, null, 1) + '\n'); console.log(JSON.stringify(v.statistics)); }
  else if (cmd === 'status') { const r = check(); console.log(JSON.stringify({ closureReady: r.closureReady, openNormative: r.openNormative, summary: r.summary }, null, 1)); }
  else { console.error('usage: rc1.mjs check|vectors|status'); process.exit(2); }
}
