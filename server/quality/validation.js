/**
 * Gold-set VALIDATION state (instruction 2026-10-05, §21): adjudication complete ≠ validation complete ≠ acceptance
 * performed. Validation is COMPUTED, never set by hand: every requirement the set declares (manifest.validationRequirements)
 * must hold on the current set content, the current adjudication and the current evaluator version. A set that declares no
 * requirements (gold-v1, the frozen "Before" benchmark) can never be validated: the operator required a hardening stage.
 * Acceptance (the operator's act in Enterprise Local) is refused until validation is COMPLETE.
 */
import { canonicalHash } from '../domain/canonical.js';
import { integrity, computeSeal } from './gold-integrity.js';
import { applyAdjudications, EVALUATOR_VERSION, goldHash } from './evaluation.js';

export const VALIDATION_SCHEMA = 'wonderpages.gold-validation/1';
export function validationState({ gold, adjudication = null, reports = [], regression = null, sealFile = null }) {
  const req = gold.manifest.validationRequirements, checks = [], add = (code, ok, message, detail) => checks.push({ code, ok: !!ok, message, ...(detail !== undefined ? { detail } : {}) });
  const set = { id: gold.manifest.id, version: gold.manifest.version, goldHash: goldHash(gold) };
  if (!req) add('VALIDATION_NOT_DEFINED', false, 'Setul nu declară cerințe de validare: gold-v1 este benchmarkul înghețat „Before”; validarea cere etapa de hardening și un set nou (decizia operatorului).');
  else {
    add('ADJUDICATION_COMPLETE', adjudication?.complete === true, 'Toate cazurile sunt adjudecate de operator, fără inconsecvențe.', adjudication ? { adjudicated: adjudication.counts?.adjudicated, required: adjudication.counts?.required, inconsistencies: adjudication.inconsistencies?.length } : null);
    const adjusted = adjudication ? applyAdjudications(gold, adjudication) : gold, unl = adjusted.cases.filter(c => c.label == null).length;
    add('NO_UNLABELED', !unl, 'Nicio politică nedecisă rămasă: fiecare caz are o etichetă a operatorului.', { unlabeled: unl });
    if (req.holdoutSealVerified) {
      const now = computeSeal(gold.cases.filter(c => c.split === 'holdout')).hash, m = gold.manifest.holdoutSeal?.hash, f = sealFile?.hash;
      add('HOLDOUT_SEALED', !!m && now === m && (f == null || f === m), 'Setul rezervat corespunde sigiliului făcut înainte de hardening.', { manifest: m || null, current: now, file: f ?? null });
    }
    if (req.integrityClean) { const i = integrity(gold); add('INTEGRITY_CLEAN', i.ok, 'Fără duplicate accidentale, contaminare sau metadate inconsecvente.', { errors: i.errors.length }); }
    const lab = adjusted.cases.filter(c => c.label != null), kinds = [...new Set(gold.cases.map(c => c.kind))], short = [];
    for (const k of kinds) {
      for (const [sp, min] of Object.entries(req.minPerKindAndSplit || {})) { const n = lab.filter(c => c.kind === k && c.split === sp).length; if (n < min) short.push(`${k}/${sp}: ${n} < ${min}`); }
      const pos = lab.filter(c => c.kind === k && c.label === 'positive').length, neg = lab.filter(c => c.kind === k && c.label === 'negative').length;
      if (pos < (req.minPositivePerKind || 0)) short.push(`${k}: ${pos} pozitive < ${req.minPositivePerKind}`); if (neg < (req.minNegativePerKind || 0)) short.push(`${k}: ${neg} negative < ${req.minNegativePerKind}`);
    }
    add('COVERAGE_MINIMA', !short.length, 'Acoperirea minimă declarată (praguri PROPUSE, decizie a operatorului).', short);
    if (req.regressionRegistryPasses) add('REGRESSION_REGISTRY', regression?.ok === true, 'Registrul de probe gold-v1: niciun defect reparat nu regresează.', regression ? { tracked: regression.tracked, failing: regression.failing } : null);
    const fresh = r => r && r.dataset?.id === set.id && r.dataset?.version === set.version && r.dataset?.goldHash === set.goldHash && r.versions?.evaluator === EVALUATOR_VERSION && r.adjudicationState?.hash === adjudication?.hash && r.adjudicationState?.complete === true;
    if (req.holdoutEvaluatedOnCurrentEvaluator) {
      add('CALIBRATION_EVALUATED', reports.some(r => r.split === 'calibration' && fresh(r)), 'Raport pe calibrare, pe setul adjudecat complet, cu evaluatorul curent.');
      add('HOLDOUT_EVALUATED', reports.some(r => r.split === 'holdout' && fresh(r)), 'Raport pe setul rezervat, pe setul adjudecat complet, cu evaluatorul curent.');
    }
  }
  const complete = checks.length > 0 && checks.every(c => c.ok);
  return { schema: VALIDATION_SCHEMA, set, evaluatorVersion: EVALUATOR_VERSION, complete, status: complete ? 'COMPLETE' : 'NOT_COMPLETE', checks, failing: checks.filter(c => !c.ok).map(c => c.code), hash: canonicalHash({ set, adjudication: adjudication?.hash ?? null, evaluator: EVALUATOR_VERSION, checks: checks.map(c => [c.code, c.ok]) }) };
}
