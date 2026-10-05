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
import { runProbe, judge } from '../../server/quality/regression.js';
export { runProbe, judge };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BEFORE_FILE = path.join(ROOT, 'evaluation', 'hardening', 'probes-before.json');

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
