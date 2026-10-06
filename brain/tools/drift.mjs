#!/usr/bin/env node
/**
 * Zero-drift fingerprint of the APPLICATION (everything outside the active phase's write scope).
 *   node brain/tools/drift.mjs fingerprint [--root=DIR] [--out=FILE]   fingerprint a checkout (default: this one)
 *   node brain/tools/drift.mjs compare BASELINE.json [--root=DIR]      exit 1 on any drift
 * The fingerprint combines:
 *   - release sourceDigest (scripts/enterprise/release-gate.mjs, the exact digest the release evidence records);
 *   - protected tree: every tracked file outside the write scope (path + git blob id);
 *   - behaviour: every evaluator on every Gold-v1 / Gold-v2 case under quality policies 1 and 2, the Gold-v2 report on all
 *     splits (random id / timestamp removed), every hardening probe, and the declared code/schema/policy versions;
 *   - canonical evidence hashes: Gold-v1, Gold-v2, adjudication log, policy ledger head, held-out seal, holdout-run-1.
 * Application modules are loaded read-only from --root; nothing is written there.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { BRAIN_ROOT, sha256, canonHash, indexEntries, matchAny, readJSON, git, readJSONL, verifyChain } from './lib.mjs';

const arg = (k, d = null) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const writeScope = () => readJSON('brain/phase/ACTIVE-PHASE.json').writeScope;

export async function fingerprint(root, scope = writeScope()) {
  const imp = f => import(pathToFileURL(path.join(root, f)).href);
  const file = rel => fs.readFileSync(path.join(root, rel));
  const gate = await imp('scripts/enterprise/release-gate.mjs');
  const { EVALUATORS, runEvaluation, EVALUATOR_VERSION } = await imp('server/quality/evaluation.js');
  const { PROBES } = await imp('evaluation/hardening/probes.mjs');
  const { runProbe } = await imp('server/quality/regression.js');
  const tree = indexEntries(root), dirty = git(['status', '--porcelain', '--untracked-files=no'], { cwd: root }).trim();
  const prot = tree.filter(e => !matchAny(e.path, scope));
  const behaviour = {};
  for (const g of ['gold-v1', 'gold-v2']) {
    const gold = JSON.parse(file(`evaluation/gold/${g}.json`));
    const rows = [];
    for (const c of gold.cases) for (const policy of [1, 2]) { const ev = EVALUATORS[c.kind]; rows.push([c.id, policy, ev ? ev(c, { policy }) : 'no-evaluator']); }
    behaviour[g] = { cases: gold.cases.length, perCase: canonHash(rows) };
  }
  { const gold = JSON.parse(file('evaluation/gold/gold-v2.json')); const { id, at, ...rep } = runEvaluation(gold, { split: 'all', policy: 2 }); behaviour.goldV2Report = canonHash(rep); }
  behaviour.probes = { n: PROBES.length, results: canonHash(PROBES.map(p => [p.id, runProbe(p)])) };
  const versions = await gate.versionsOf(root); delete versions.code.commit;
  behaviour.versions = canonHash(versions); behaviour.evaluatorVersion = EVALUATOR_VERSION;
  const ledger = readJSONL('evaluation/gold-v2-policy/decisions.jsonl', root);
  return {
    schema: 'wonderpages.brain.drift-fingerprint/1',
    head: git(['rev-parse', 'HEAD'], { cwd: root }).trim(), dirty: dirty ? dirty.split('\n') : [],
    writeScope: scope,
    releaseSourceDigest: gate.sourceDigest(root),
    protectedTree: { files: prot.length, digest: canonHash(prot.map(e => [e.path, e.mode, e.blob])), entries: Object.fromEntries(prot.map(e => [e.path, e.blob])) },
    behaviour: { ...behaviour, digest: canonHash(behaviour) },
    evidence: {
      goldV1: sha256(file('evaluation/gold/gold-v1.json')), goldV2: sha256(file('evaluation/gold/gold-v2.json')),
      goldV1AdjudicationLines: file('evaluation/gold/gold-v1.adjudications.jsonl').toString().trim().split('\n').length,
      policyLedger: { entries: ledger.length, head: ledger.at(-1)?.hash ?? null, chain: verifyChain(ledger).ok },
      holdoutSeal: sha256(file('evaluation/gold-v2-src/holdout-seal.json')), holdoutRun1: sha256(file('evaluation/gold-v2-src/holdout-run-1.json'))
    }
  };
}

export function compare(base, cur) {
  const diffs = [];
  if (base.releaseSourceDigest.sha256 !== cur.releaseSourceDigest.sha256) diffs.push(`release sourceDigest ${base.releaseSourceDigest.sha256.slice(0, 12)} → ${cur.releaseSourceDigest.sha256.slice(0, 12)}`);
  const a = base.protectedTree.entries, b = cur.protectedTree.entries;
  for (const p of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[p] !== b[p]) diffs.push(`protected file ${p}: ${a[p] ? a[p].slice(0, 10) : 'absent'} → ${b[p] ? b[p].slice(0, 10) : 'absent'}`);
  if (base.behaviour.digest !== cur.behaviour.digest) for (const k of Object.keys(base.behaviour)) if (k !== 'digest' && canonHash(base.behaviour[k]) !== canonHash(cur.behaviour[k])) diffs.push(`behaviour ${k} changed`);
  for (const k of Object.keys(base.evidence)) if (canonHash(base.evidence[k]) !== canonHash(cur.evidence[k])) diffs.push(`evidence ${k} changed`);
  if (cur.dirty.length) diffs.push(`uncommitted tracked changes: ${cur.dirty.join(', ')}`);
  return { ok: diffs.length === 0, diffs };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const cmd = process.argv[2], root = path.resolve(arg('root', BRAIN_ROOT));
  if (cmd === 'fingerprint') {
    const fp = await fingerprint(root), out = arg('out');
    if (out) fs.writeFileSync(out, JSON.stringify(fp, null, 1) + '\n');
    console.log(JSON.stringify({ head: fp.head, releaseSourceDigest: fp.releaseSourceDigest, protectedTree: { files: fp.protectedTree.files, digest: fp.protectedTree.digest }, behaviour: fp.behaviour.digest, evidence: fp.evidence }, null, 1));
  } else if (cmd === 'compare') {
    const base = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')), cur = await fingerprint(root, base.writeScope);
    const r = compare(base, cur);
    console.log(JSON.stringify({ APPLICATION_ZERO_DRIFT: r.ok ? 'PASS' : 'FAIL', baseline: base.head, current: cur.head, releaseSourceDigest: cur.releaseSourceDigest, protectedFiles: cur.protectedTree.files, behaviour: cur.behaviour.digest, diffs: r.diffs }, null, 1));
    process.exit(r.ok ? 0 : 1);
  } else { console.error('usage: drift.mjs fingerprint|compare'); process.exit(2); }
}
