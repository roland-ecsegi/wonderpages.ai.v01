/**
 * Gold-v2 source helpers (shared by the held-out and calibration sources and by the builder).
 * A case records: what property it tests, why its proposed label is what it is (labelSource), how it relates to other
 * cases (roles, pair group, the one variable changed), which Gold-v1 observation it traces to, and its provenance.
 * Every label here is PROPOSED by the implementation provider and waits for the operator's independent adjudication;
 * a case whose label depends on an undecided editorial policy carries `label: null` + labelSource OPERATOR_DECISION_REQUIRED
 * and is never counted in metrics until the operator assigns one.
 */
export const AUTHOR = 'implementation provider (Claude Code, cloud session), on behalf of the operator';
export const CREATED = '2026-10-05';

/** labelSource kinds */
export const SRC = Object.freeze({
  FACT: 'fact',                         // linguistic / scientific / structural fact, independent of any threshold
  OPERATOR: 'operator_decision',        // follows from an adjudicated operator decision (ref = GS.md decision / case)
  POLICY: 'current_policy',             // follows from the current written policy (implementation correctness only — NOT policy validity)
  PRINCIPLE: 'operator_principle',      // follows from a principle the operator stated in an OBS (ref), label still proposed
  REQUIRED: 'OPERATOR_DECISION_REQUIRED'
});

export function mk(split, o) {
  const label = o.label === undefined ? null : o.label;
  return {
    id: o.id, kind: o.kind, split, property: o.property, dimension: o.dimension || null,
    age: o.age || null, language: o.language || 'English', theme: o.theme || null,
    input: o.input, label, expected: o.expected,
    labelSource: { type: o.src, ref: o.ref || null, rationale: o.why || null },
    roles: o.roles || ['independent'], pairGroup: o.pair || null, variable: o.variable || null,
    obs: o.obs || [], regressionOf: o.regressionOf || null,
    policyVersion: o.policyVersion || null,
    provenance: { author: AUTHOR, createdAt: CREATED, method: 'hand-written synthetic stimulus' },
    adjudication: { by: 'implementation provider (proposed)', status: 'pending_operator_review', note: label === null ? 'Fără etichetă: decizie de politică nerezolvată; operatorul atribuie eticheta (decizie „correct”).' : 'Etichetă propusă; operatorul confirmă sau corectează (aprobare umană).' }
  };
}

/* ---------- quality: content-based assessments (the property can be examined in the text) ---------- */
export const CRITERIA = Array.from({ length: 18 }, (_, i) => 'T' + String(i + 1).padStart(2, '0'));
/** a 12-page story for 3–4 (≈ 25–35 words per page), every page a distinct drawable moment */
export const STORY_KITE = {
  title: 'Lia and the Red Kite',
  pages: [
    'Lia has a red kite. Today the wind is soft and warm.',
    'Lia runs up the green hill. Her kite bobs behind her. Hop, hop, hop!',
    'Whoosh! The wind lifts the kite high into the sky.',
    'The kite flies over the duck pond. The ducks look up. Quack, quack!',
    'Oh no! The string slips from Lia\'s hand. The kite floats away.',
    'Lia follows the kite past the big oak tree. Where will it land?',
    'The kite lands on the roof of the little red barn.',
    'Lia cannot reach it. She thinks hard. Then she has an idea.',
    'Lia asks Farmer Bo for help. He brings his long ladder.',
    'Farmer Bo climbs up and gives the kite back to Lia. Thank you!',
    'Lia holds the string tight with both hands. Now it will not slip.',
    'Lia and her red kite dance in the wind until the sun goes down.'
  ].map((text, i) => ({ n: i + 1, text }))
};
/** criterion → a quote from STORY_KITE that is relevant to it */
export const KITE_EVIDENCE = {
  T01: 'Lia has a red kite.', T02: 'Lia and her red kite dance in the wind until the sun goes down.', T03: 'Lia holds the string tight with both hands.',
  T04: 'Hop, hop, hop!', T05: 'The kite lands on the roof of the little red barn.', T06: 'The kite flies over the duck pond.',
  T07: 'Lia asks Farmer Bo for help.', T08: 'Today the wind is soft and warm.', T09: 'Then she has an idea.',
  T10: 'Oh no! The string slips from Lia\'s hand.', T11: 'Where will it land?', T12: 'Quack, quack!', T13: 'Lia cannot reach it. She thinks hard.',
  T14: 'until the sun goes down', T15: 'He brings his long ladder.', T16: 'Whoosh! The wind lifts the kite high into the sky.',
  T17: 'Now it will not slip.', T18: 'Today the wind is soft and warm.'
};
/** reply: scores (default `all`) with per-criterion overrides; evidence from KITE_EVIDENCE unless overridden */
export function kiteReply(scores = {}, evidence = {}) {
  return { criteria: CRITERIA.map(code => ({ code, score: scores[code] ?? scores.all ?? 9, evidence: evidence[code] ?? evidence.all ?? KITE_EVIDENCE[code] })), issues: [] };
}
export const story = (pages, title = 'Story') => ({ title, pages: pages.map((text, i) => ({ n: i + 1, text })) });
