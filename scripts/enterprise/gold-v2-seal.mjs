#!/usr/bin/env node
/**
 * Seals the Gold-v2 held-out cases (evaluation/gold-v2-src/holdout.mjs) BEFORE evaluator hardening:
 * writes evaluation/gold-v2-src/holdout-seal.json with the case count, ids, per-case hashes and one hash over all of them.
 *   node scripts/enterprise/gold-v2-seal.mjs seal     once (refuses to overwrite an existing seal)
 *   node scripts/enterprise/gold-v2-seal.mjs verify   exit 1 if the held-out cases changed after sealing
 * The builder refuses to assemble gold-v2 when the seal does not verify.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { canonicalHash } from '../../server/domain/canonical.js';
import { HOLDOUT } from '../../evaluation/gold-v2-src/holdout.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SEAL_FILE = path.join(ROOT, 'evaluation', 'gold-v2-src', 'holdout-seal.json');
/** the seal covers everything except the adjudication block (the operator adjudicates later without breaking it) */
export const sealCaseHash = c => { const { adjudication, ...rest } = c; return canonicalHash(rest); };
export function computeSeal(cases = HOLDOUT) {
  const per = Object.fromEntries([...cases].sort((a, b) => (a.id < b.id ? -1 : 1)).map(c => [c.id, sealCaseHash(c)]));
  return { count: cases.length, ids: Object.keys(per), perCase: per, hash: canonicalHash(per) };
}
export function verifySeal(cases = HOLDOUT) {
  if (!fs.existsSync(SEAL_FILE)) return { ok: false, errors: [{ code: 'SEAL_MISSING', message: 'Setul rezervat nu este sigilat.' }] };
  const seal = JSON.parse(fs.readFileSync(SEAL_FILE, 'utf8')), now = computeSeal(cases), errors = [];
  if (now.hash !== seal.hash) {
    for (const id of new Set([...seal.ids, ...now.ids])) {
      if (!(id in now.perCase)) errors.push({ code: 'SEAL_CASE_REMOVED', case: id, message: `Cazul rezervat ${id} a fost eliminat după sigilare.` });
      else if (!(id in seal.perCase)) errors.push({ code: 'SEAL_CASE_ADDED', case: id, message: `Cazul ${id} a fost adăugat în setul rezervat după sigilare.` });
      else if (seal.perCase[id] !== now.perCase[id]) errors.push({ code: 'SEAL_CASE_CHANGED', case: id, message: `Cazul rezervat ${id} s-a schimbat după sigilare.` });
    }
  }
  return { ok: !errors.length, errors, seal: { hash: seal.hash, sealedAt: seal.sealedAt, count: seal.count }, current: { hash: now.hash, count: now.count } };
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const cmd = process.argv[2] || 'verify';
  if (cmd === 'seal') {
    if (fs.existsSync(SEAL_FILE)) { console.error('Sigiliul există deja; setul rezervat nu se resigilează.'); process.exit(1); }
    const s = computeSeal();
    fs.writeFileSync(SEAL_FILE, JSON.stringify({ schema: 'wonderpages.gold-holdout-seal/1', set: 'gold-v2', sealedAt: new Date().toISOString(), note: 'Sealed before any evaluator hardening (evaluator version 1). No tuning against these cases; failures are kept as evidence.', ...s }, null, 1) + '\n');
    console.log(JSON.stringify({ sealed: s.count, hash: s.hash }));
  } else { const v = verifySeal(); console.log(JSON.stringify(v, null, 1)); if (!v.ok) process.exit(1); }
}
