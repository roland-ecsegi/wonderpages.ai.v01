/**
 * Gold-set integrity (OBS-GS-12, OBS-GS-20) — shared by the Gold-v2 builder and the validation guard:
 *  - held-out seal: per-case hashes (adjudication block excluded) and one hash over them;
 *  - duplicates: exact / normalised stimulus duplicates, classified as INTENTIONAL (same controlled family, declared
 *    variable) or ACCIDENTAL (an error), plus metadata-only duplicates (same stimulus, different theme/age, no family);
 *  - near-duplicates (token Jaccard ≥ 0.8) — correlated evidence inside a split, contamination across splits;
 *  - claim-relative independence of every held-out case (stimulus, theme, property, rule family);
 *  - coverage and the population counts the reports must keep separate (raw, labelled, unique stimuli, independent).
 */
import { canonicalHash } from '../domain/canonical.js';

const fold = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = s => new Set(fold(s).split(' ').filter(w => w.length > 2));
const jacc = (a, b) => { const A = tokens(a), B = tokens(b); if (!A.size || !B.size) return 0; let n = 0; for (const w of A) if (B.has(w)) n++; return n / (A.size + B.size - n); };
export const sealCaseHash = c => { const { adjudication, ...rest } = c; return canonicalHash(rest); };
export function computeSeal(cases) {
  const per = Object.fromEntries([...cases].sort((a, b) => (a.id < b.id ? -1 : 1)).map(c => [c.id, sealCaseHash(c)]));
  return { count: cases.length, ids: Object.keys(per), perCase: per, hash: canonicalHash(per) };
}
/** the text a case shows to the evaluator (quality: the assessed content + the reply) */
export const stimulusText = c => c.kind === 'quality' ? [...(c.input.content?.pages || []).map(p => p.text), ...(c.input.reply?.criteria || []).map(x => `${x.code}:${x.score}:${x.evidence}`)].join(' ') : [c.input.text, c.input.page, c.input.source, c.input.native].filter(Boolean).join(' || ');
const stimulusKey = c => c.kind + '|' + (c.kind === 'quality' ? canonicalHash(c.input) : fold(stimulusText(c)) + '|' + JSON.stringify(c.input.canon || null) + '|' + (c.input.world || ''));
const THEME_WORDS = {
  dinosaurs: /dinosaur|dino|pterosaur|pterodactyl|rex|triceratops|caveman|cavemen|fossil|dinozaur|stegosaur|ichthyosaur/, sea: /sea|ocean|wave|crab|fish|seal|shell|beach|boat|sail|reef|shark|tide|gull|bay|lake|river|pool|swim|mare|crab|foca|val|plaja/,
  forest: /forest|tree|leaf|leaves|owl|fox|mushroom|berr|wood|fern|bush|bat|padure|bufnit|vulpe|frunz|ciuperc|lilieci|copac/, space: /space|star|moon|sun|rocket|comet|planet|astronaut|alien|robot|earth|stele|luna|soare|cometa|racheta|pamant/,
  farm: /farm|cow|pig|goat|barn|hen|horse|duck|tractor|coin|farmer|vaca|porc|capr|grajd|ferm|purcel|rata|sat|bucatarie|cal/, mountain: /mountain|hill|trail|cliff|goat|wolf|bear|snow|stream|waterfall|ranger|lake|munte|munti|deal|iedul|lupi|bear|cascad/,
  city: /city|street|balcony|shop|park|window|bus|school|apartment|boss|robber|museum|garden|balcon|strada|oras|parc|scoala|magazin|vecin|paznic/
};

export function integrity(gold) {
  const cases = gold.cases || [], cal = cases.filter(c => c.split !== 'holdout'), hold = cases.filter(c => c.split === 'holdout'), errors = [], warnings = [];
  /* ids, metadata, label ↔ expected ↔ labelSource consistency */
  const ids = new Set(); for (const c of cases) { if (ids.has(c.id)) errors.push({ code: 'DUPLICATE_ID', case: c.id }); ids.add(c.id); }
  for (const c of cases.filter(x => x.labelSource)) {
    for (const k of ['property', 'kind', 'split', 'language', 'theme', 'provenance']) if (!c[k]) errors.push({ code: 'METADATA_MISSING', case: c.id, field: k });
    if ((c.label == null) !== (c.labelSource.type === 'OPERATOR_DECISION_REQUIRED')) errors.push({ code: 'LABEL_SOURCE_MISMATCH', case: c.id, message: 'O etichetă lipsă trebuie marcată OPERATOR_DECISION_REQUIRED (și invers).' });
    if (c.variable && !c.pairGroup) errors.push({ code: 'VARIANT_WITHOUT_FAMILY', case: c.id });
  }
  /* duplicates */
  const byKey = {}; for (const c of cases) (byKey[stimulusKey(c)] = byKey[stimulusKey(c)] || []).push(c);
  const exact = [], metadataOnly = [];
  for (const g of Object.values(byKey).filter(g => g.length > 1)) {
    const fam = new Set(g.map(c => c.pairGroup)), intentional = fam.size === 1 && g[0].pairGroup && g.every(c => c.variable), sameMeta = new Set(g.map(c => `${c.age}|${c.theme}|${c.language}`)).size;
    const entry = { cases: g.map(c => c.id), intentional, variables: g.map(c => c.variable) };
    exact.push(entry);
    if (!intentional) { (sameMeta === g.length ? metadataOnly : []).push(entry); errors.push({ code: sameMeta === g.length ? 'METADATA_ONLY_DUPLICATE' : 'ACCIDENTAL_DUPLICATE', cases: entry.cases, message: 'Același stimul fără o familie controlată și o variabilă declarată (OBS-GS-12).' }); }
  }
  /* near duplicates: correlation inside a split; contamination across splits */
  const near = [], contamination = [];
  for (let i = 0; i < cases.length; i++) for (let j = i + 1; j < cases.length; j++) {
    const a = cases[i], b = cases[j]; if (a.kind !== b.kind || stimulusKey(a) === stimulusKey(b)) continue;
    const s = a.kind === 'quality' ? (canonicalHash(a.input.content) === canonicalHash(b.input.content) ? 0.9 : 0) : jacc(stimulusText(a), stimulusText(b)); if (s < 0.8) continue;
    const cross = (a.split === 'holdout') !== (b.split === 'holdout'), rec = { a: a.id, b: b.id, similarity: Math.round(s * 100) / 100, sameFamily: !!a.pairGroup && a.pairGroup === b.pairGroup };
    (cross ? contamination : near).push(rec);
  }
  for (const c of contamination) errors.push({ code: 'HOLDOUT_CONTAMINATION', ...c });
  const calThemes = new Set(cal.map(c => c.theme)); for (const h of hold) if (calThemes.has(h.theme)) errors.push({ code: 'HOLDOUT_THEME_SHARED', case: h.id, theme: h.theme });
  /* theme support (a heuristic signal, never proof: OBS-GS-12) */
  const themeUnsupported = cases.filter(c => c.kind !== 'quality' && THEME_WORDS[c.theme] && !THEME_WORDS[c.theme].test(fold(stimulusText(c)))).map(c => c.id);
  if (themeUnsupported.length) warnings.push({ code: 'THEME_NOT_EVIDENT', count: themeUnsupported.length, cases: themeUnsupported, message: 'Tema declarată nu e evidentă în stimul (semnal euristic, nu dovadă): tema nu se raportează ca acoperire pentru aceste cazuri.' });
  /* claim-relative independence of held-out cases */
  const famOf = c => c.kind === 'safety' ? (c.expected?.rules || []).join('+') || (c.expected?.verdict === 'PASS' ? 'pass' : '') : c.kind === 'science' ? c.expected?.rule || 'none' : c.kind === 'localization' ? (c.expected?.codes || []).join('+') || 'none' : c.kind === 'age' ? (c.expected?.signals || []).join('+') || 'none' : (c.expected?.reasons || []).join('+') || (c.expected?.acceptable ? 'accept' : '');
  const calFam = new Set(cal.map(c => c.kind + ':' + famOf(c))), calProp = new Set(cal.map(c => c.kind + ':' + c.property));
  const independence = Object.fromEntries(hold.map(h => [h.id, {
    stimulus: !cal.some(c => c.kind === h.kind && (h.kind === 'quality' ? canonicalHash(c.input.content) === canonicalHash(h.input.content) : jacc(stimulusText(c), stimulusText(h)) >= 0.5)),
    theme: !calThemes.has(h.theme), property: !calProp.has(h.kind + ':' + h.property), ruleFamily: !calFam.has(h.kind + ':' + famOf(h)), language: true
  }]));
  /* coverage + populations */
  const count = (arr, f) => arr.reduce((m, c) => { const k = f(c); m[k] = (m[k] || 0) + 1; return m; }, {});
  const families = Object.values(cases.reduce((m, c) => { if (c.pairGroup) (m[c.pairGroup] = m[c.pairGroup] || []).push(c); return m; }, {}));
  const role = r => cases.filter(c => (c.roles || []).includes(r)).length;
  const coverage = {
    raw: cases.length, labelled: cases.filter(c => c.label != null).length, unlabeled: cases.filter(c => c.label == null).length,
    calibration: cal.length, holdout: hold.length, uniqueStimuli: Object.keys(byKey).length,
    independentStimuli: Object.keys(byKey).length - families.reduce((n, f) => n + Math.max(0, f.length - 1), 0),
    controlledFamilies: families.filter(f => f.length > 1).length, correlatedVariants: families.reduce((n, f) => n + Math.max(0, f.length - 1), 0),
    roles: { minimal_pair: role('minimal_pair'), boundary: role('boundary'), regression: role('regression'), positive_control: role('positive_control'), negative_control: role('negative_control'), paraphrase: role('paraphrase'), morphological_variant: role('morphological_variant'), negation_variant: role('negation_variant'), order_variant: role('order_variant'), stance_variant: role('stance_variant'), parity: role('parity'), cross_gate: role('cross_gate') },
    byKind: count(cases, c => c.kind), byKindSplit: count(cases, c => `${c.kind}/${c.split}`), byLanguage: count(cases, c => c.language), byAge: count(cases, c => c.age), byTheme: count(cases, c => c.theme),
    byLabel: count(cases, c => c.label ?? 'unlabeled'), byLabelSource: count(cases, c => c.labelSource?.type || 'n/a'),
    kindLanguageAge: count(cases, c => `${c.kind}/${c.language}/${c.age}`), obs: count(cases.flatMap(c => (c.obs || []).map(o => ({ o }))), x => x.o)
  };
  return { ok: !errors.length, errors, warnings, duplicates: { exact, metadataOnly }, nearDuplicates: near, contamination, independence, coverage };
}
