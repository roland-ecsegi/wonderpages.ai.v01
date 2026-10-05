#!/usr/bin/env node
/**
 * Technical (pre-adjudication) evaluation of Gold-v2 on the PROPOSED labels — evidence, not validation.
 *   node scripts/enterprise/gold-v2-evaluate.mjs holdout   ONE recorded run on the sealed held-out (refuses to overwrite)
 *   node scripts/enterprise/gold-v2-evaluate.mjs calibration
 * Writes evaluation/gold-v2-src/<split>-run-<n>.json with the evaluator version, git HEAD, seal check and every case result.
 * Held-out failures are kept as evidence: no tuning, no relabelling, no moving cases (instruction §18/§31).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runEvaluation, EVALUATORS, EVALUATOR_VERSION } from '../../server/quality/evaluation.js';
import { verifySeal } from './gold-v2-seal.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const split = process.argv[2] || 'calibration', gold = JSON.parse(fs.readFileSync(path.join(ROOT, 'evaluation/gold/gold-v2.json'), 'utf8'));
const out = path.join(ROOT, 'evaluation', 'gold-v2-src', `${split}-run-1.json`);
if (split === 'holdout' && fs.existsSync(out)) { console.error('Rularea pe setul rezervat a fost deja înregistrată; nu se reia pentru a o îmbunătăți.'); process.exit(1); }
const seal = verifySeal(gold.cases.filter(c => c.split === 'holdout'));
if (!seal.ok) { console.error('Sigiliul nu se verifică.'); process.exit(1); }
const report = runEvaluation(gold, { split, policy: 2 });
const cases = gold.cases.filter(c => c.split === split).map(c => { if (c.label == null) return { id: c.id, kind: c.kind, labelled: false, labelSource: c.labelSource.type }; const r = EVALUATORS[c.kind](c, { policy: 2 }); return { id: c.id, kind: c.kind, property: c.property, label: c.label, predicted: r.predicted, verdictAgreement: r.predicted === c.label, exact: r.exact, detail: r.detail, roles: c.roles, obs: c.obs }; });
const head = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
fs.writeFileSync(out, JSON.stringify({ schema: 'wonderpages.gold-v2-technical-run/1', split, note: 'Evaluare tehnică pe etichetele PROPUSE (înainte de adjudecarea operatorului): dovezi, nu validare.', at: new Date().toISOString(), gitHead: head, evaluatorVersion: EVALUATOR_VERSION, seal: { ok: seal.ok, hash: seal.seal.hash }, overall: report.overall, evaluators: Object.fromEntries(Object.entries(report.evaluators).map(([k, e]) => [k, { n: e.n, accuracy: e.accuracy, exactAgreement: e.exactAgreement, falsePassRate: e.falsePassRate, falseBlockRate: e.falseBlockRate, errors: e.errors.map(x => x.id) }])), unlabeled: report.unlabeled, cases }, null, 1) + '\n');
console.log(JSON.stringify({ split, n: report.overall.n, accuracy: report.overall.accuracy, exact: report.overall.exactAgreement, unlabeled: report.unlabeled.length, byKind: Object.fromEntries(Object.entries(report.evaluators).map(([k, e]) => [k, `${e.n}: acc ${e.accuracy}, exact ${e.exactAgreement}`])) }, null, 1));
