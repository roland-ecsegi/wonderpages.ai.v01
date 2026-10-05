#!/usr/bin/env node
/**
 * Builds evaluation/gold/gold-v2.json from evaluation/gold-v2-src/{calibration,holdout}.mjs — deterministic (same sources →
 * same bytes). Refuses to build when the held-out seal does not verify or the integrity analysis finds errors.
 *   node scripts/enterprise/gold-v2-build.mjs build    write the set + evaluation/gold-v2-src/build-report.json
 *   node scripts/enterprise/gold-v2-build.mjs check    analyse only (exit 1 on errors)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CALIBRATION } from '../../evaluation/gold-v2-src/calibration.mjs';
import { HOLDOUT } from '../../evaluation/gold-v2-src/holdout.mjs';
import { verifySeal } from './gold-v2-seal.mjs';
import { integrity, computeSeal } from '../../server/quality/gold-integrity.js';
import { canonicalHash } from '../../server/domain/canonical.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const OUT = path.join(ROOT, 'evaluation', 'gold', 'gold-v2.json'), REPORT = path.join(ROOT, 'evaluation', 'gold-v2-src', 'build-report.json');

export function assemble() {
  const seal = verifySeal(HOLDOUT); if (!seal.ok) throw { code: 'SEAL', message: 'Sigiliul setului rezervat nu se verifică: ' + seal.errors.map(e => e.message).join(' ') };
  const cases = [...CALIBRATION, ...HOLDOUT];
  const gold = { manifest: {
    schema: 'wonderpages.gold-set/2', id: 'gold-v2', version: 2, createdAt: '2026-10-05', caseCount: cases.length,
    purpose: 'Validarea adversarială a evaluatorilor întăriți (hardening după adjudecarea gold-v1): perechi minimale, cazuri-limită, parafraze, variante morfologice, negație, ordinea acțiunilor, poziție narativă, paritate EN↔RO, benzi de vârstă, praguri de calitate, validitatea dovezilor, entitate/relație. NU reprezintă cărți reale și nu măsoară reacția copiilor sau piața.',
    rights: { synthetic: { source: 'fixture-uri sintetice scrise în acest repository (gold-v2-src)', commercial: 'no', reproduction: 'yes', derivative: 'yes', use: 'evaluare internă' } },
    splits: { calibration: 'teme: dinosaurs, sea, forest, space, farm — set de dezvoltare (evaluatorii pot fi dezvoltați pe el)', holdout: 'teme distincte: mountain, city — scris și sigilat ÎNAINTE de hardening; fără tuning; eșecurile rămân dovezi' },
    holdoutSeal: { hash: seal.seal.hash, sealedAt: seal.seal.sealedAt, count: seal.seal.count, file: 'evaluation/gold-v2-src/holdout-seal.json' },
    labelling: 'Toate etichetele sunt PROPUSE de furnizorul de implementare și așteaptă adjudecarea independentă a operatorului; labelSource arată de unde vine fiecare (fapt, politica scrisă = corectitudinea implementării, decizie/principiu al operatorului). Cazurile cu label null depind de o politică nedecisă (OPERATOR_DECISION_REQUIRED) și nu se punctează până la eticheta operatorului.',
    adjudication: 'Etichetele sunt propuse de implementator și așteaptă confirmarea operatorului (WAITING_HUMAN).',
    validationRequirements: {
      note: 'Pragurile minime sunt PROPUSE (decizie a operatorului); garda de validare le aplică așa cum sunt declarate aici.',
      adjudicationComplete: true, noUnlabeledAfterAdjudication: true, holdoutSealVerified: true, integrityClean: true, regressionRegistryPasses: true, holdoutEvaluatedOnCurrentEvaluator: true,
      minPerKindAndSplit: { calibration: 8, holdout: 6 }, minPositivePerKind: 3, minNegativePerKind: 3
    },
    limitations: [
      'Cazurile, etichetele propuse și evaluatorii întăriți au același autor (furnizorul de implementare): sigiliul dovedește doar că setul rezervat nu s-a schimbat după scriere, nu independența autorului.',
      'Autorul setului rezervat a scris ulterior evaluatorii: cunoașterea setului poate influența proiectarea (contaminare de autor) — de aceea registrul de probe al gold-v1 și adjudecarea operatorului rămân dovezile principale.',
      'Stimuli scurți, sintetici; nu reprezintă cărți reale, ilustrații sau reacția copiilor.',
      'Evaluatorii sunt deterministici și euristici (structurați, nu înțelegere semantică); acoperirea lexicală e delimitată și declarată.',
      'Pragurile de vârstă și de calitate rămân orientative / politică editorială curentă, nu optimizate empiric.'
    ]
  }, cases };
  const report = integrity(gold);
  gold.manifest.integrity = { ok: report.ok, errors: report.errors.length, warnings: report.warnings.map(w => ({ code: w.code, count: w.count })), duplicatesIntentional: report.duplicates.exact.filter(d => d.intentional).length, nearDuplicatesInSplit: report.nearDuplicates.length, contamination: report.contamination.length };
  gold.manifest.coverage = report.coverage;
  return { gold, report, seal };
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const cmd = process.argv[2] || 'check';
  try {
    const { gold, report } = assemble();
    const summary = { ok: report.ok, errors: report.errors, warnings: report.warnings.map(w => ({ code: w.code, count: w.count })), coverage: report.coverage, contamination: report.contamination.length, nearDuplicates: report.nearDuplicates.length };
    if (cmd === 'build') {
      if (!report.ok) { console.error(JSON.stringify(summary, null, 1)); process.exit(1); }
      fs.writeFileSync(OUT, JSON.stringify(gold, null, 1) + '\n'); fs.writeFileSync(REPORT, JSON.stringify({ schema: 'wonderpages.gold-build-report/1', set: 'gold-v2', setHash: canonicalHash(gold), ...report }, null, 1) + '\n');
      console.log(JSON.stringify({ written: path.relative(ROOT, OUT), cases: gold.cases.length, ok: true, coverage: report.coverage.byKindSplit }));
    } else { console.log(JSON.stringify(summary, null, 1)); if (!report.ok) process.exit(1); }
  } catch (e) { console.error(JSON.stringify({ error: e.code || 'error', message: e.message })); process.exit(1); }
}
