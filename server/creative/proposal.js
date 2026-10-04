/**
 * Creative Upgrade — proposal schema, per-step output validation and the automatic STRUCTURAL acceptance criteria.
 * These checks prove shape, contract, provenance, continuity bookkeeping and proposal-only behaviour; they never prove
 * creative quality (`creativeQuality` is always NOT_EVALUATED: the operator reviews the proposal).
 */
export const PROPOSAL_SCHEMA = 'wonderpages.creative-proposal/1';
export const DECISIONS = Object.freeze(['KEEP', 'IMPROVE', 'REPLACE', 'NEW']);
export const RISK = Object.freeze(['low', 'medium', 'high']);
export const ROLES = Object.freeze(['main', 'secondary', 'minor']);
export const LINK_KINDS = Object.freeze(['callback', 'setup', 'payoff', 'return']);
export const TURN_TYPES = Object.freeze(['quiet', 'question', 'surprise', 'anticipation', 'unfinished_action', 'reveal']);

/* which element kinds each skill may decide on (role boundary, derived from the RoleContracts' owned skills) */
export const SKILL_KINDS = Object.freeze({
  'concept-differentiation': ['series', 'brief', 'volume', 'character', 'location', 'object', 'world_rule'],
  'collection-arc': ['series', 'volume', 'page_plan'],
  'reveal-sequencing': ['page_plan', 'manuscript_page'],
  'continuity-ledger': ['character', 'location', 'object', 'world_rule', 'volume'],
  'narrative-causality': ['volume', 'page_plan', 'manuscript_page'],
  'age-dialogue': ['manuscript_page'],
  'rubric-critique': [], 'safety-semantic': []
});
export const kindsFor = role => [...new Set((role?.ownedSkills || []).flatMap(s => SKILL_KINDS[s] || []))];
export const kindOfRef = ref => { const m = String(ref || '').match(/^(?:new:)?([a-z_]+)(?::|$)/); return m ? m[1] : null; };

/* section ownership: the agent that wrote a section is the one that revises it after the critique */
export const SECTION_OWNER = Object.freeze({ evaluation: 'director-creativ', direction: 'director-creativ', ageFit: 'director-creativ', risks: 'director-creativ', arc: 'arhitect-serie', beforeAfter: 'arhitect-serie', observationsImpact: 'arhitect-serie', cast: 'pastrator-continuitate', continuity: 'pastrator-continuitate', pilot: 'scriitor', volumeMoments: 'scriitor' });

const str = v => typeof v === 'string' && v.trim().length > 0;
const arr = v => Array.isArray(v);
const err = (errors, code, message, extra = {}) => errors.push({ code, message, ...extra });

/** One KEEP/IMPROVE/REPLACE/NEW record (argument, evidence/source, impact, scope, dependencies, risk). */
export function validateDecision(d, { index, allowedKinds = null, where = 'decisions' }) {
  const errors = [], refs = new Set(index.map(x => x.ref)), at = `${where}:${d?.element || '?'}`;
  if (!d || typeof d !== 'object') { err(errors, 'DECISION_SHAPE', `${where}: înregistrare invalidă.`); return errors; }
  if (!DECISIONS.includes(d.decision)) err(errors, 'DECISION_TYPE', `${at}: decizia trebuie să fie KEEP, IMPROVE, REPLACE sau NEW.`);
  if (!str(d.element)) err(errors, 'DECISION_ELEMENT', `${where}: lipsește elementul.`);
  else if (d.decision === 'NEW') { if (!/^new:[a-z_]+:[A-Za-z0-9_.-]+$/.test(d.element)) err(errors, 'NEW_REF', `${at}: un element NEW se scrie „new:<tip>:<id>”.`); else if (refs.has(d.element.replace(/^new:/, ''))) err(errors, 'NEW_COLLIDES', `${at}: există deja în baseline; folosește IMPROVE/REPLACE.`); }
  else if (!refs.has(d.element)) err(errors, 'UNKNOWN_ELEMENT', `${at}: elementul nu există în baseline (proveniență).`);
  for (const f of ['argument', 'impact']) if (!str(d[f])) err(errors, 'DECISION_FIELD', `${at}: lipsește „${f}”.`);
  if (!arr(d.evidence) || !d.evidence.length) err(errors, 'NO_EVIDENCE', `${at}: lipsește dovada (sursa din baseline).`);
  else for (const e of d.evidence) { const r = typeof e === 'string' ? e : e?.ref; if (!(refs.has(r) || r === 'operator_direction' || r?.startsWith?.('finding:'))) err(errors, 'EVIDENCE_REF', `${at}: dovada „${r}” nu este în baseline.`); }
  if (!d.scope || typeof d.scope !== 'object' || !arr(d.scope.volumes)) err(errors, 'DECISION_SCOPE', `${at}: lipsește domeniul (volume/pagini).`);
  if (!arr(d.dependencies)) err(errors, 'DECISION_DEPS', `${at}: lipsesc dependențele (listă, poate fi goală).`);
  if (!d.risk || !RISK.includes(d.risk.level) || !str(d.risk.note)) err(errors, 'DECISION_RISK', `${at}: riscul cere nivel (low/medium/high) și notă.`);
  if (allowedKinds && str(d.element) && !allowedKinds.includes(kindOfRef(d.element))) err(errors, 'ROLE_BOUNDARY', `${at}: tipul „${kindOfRef(d.element)}” nu este în skill-urile rolului.`);
  return errors;
}

const need = (o, keys, errors, where) => { for (const k of keys) if (o?.[k] === undefined) err(errors, 'MISSING_SECTION', `${where}: lipsește „${k}”.`); };
/** Structural validation of one step's output (the model's JSON), before it is accepted into the proposal. */
export function validateStepOutput(step, out, { index, role, baseline }) {
  const errors = [], allowedKinds = kindsFor(role), V = baseline.contract.volumes, P = baseline.contract.pagesPerBook;
  if (!out || typeof out !== 'object' || Array.isArray(out)) return [{ code: 'NOT_OBJECT', message: `${step}: răspunsul nu este un obiect JSON.` }];
  const decs = d => { if (d === undefined) return; if (!arr(d)) return err(errors, 'DECISIONS_SHAPE', `${step}: „decisions” trebuie să fie listă.`); for (const x of d) errors.push(...validateDecision(x, { index, allowedKinds, where: step })); };
  if (step === 'direction') { need(out, ['evaluation', 'direction', 'ageFit', 'risks', 'decisions'], errors, step); if (out.evaluation && (!arr(out.evaluation.strengths) || !arr(out.evaluation.weaknesses))) err(errors, 'EVALUATION_SHAPE', 'evaluation: strengths și weaknesses.'); decs(out.decisions); }
  else if (step === 'structure') { need(out, ['arc', 'beforeAfter', 'observationsImpact', 'decisions'], errors, step); if (out.arc) errors.push(...validateArc(out.arc, V)); decs(out.decisions); }
  else if (step === 'continuity') { need(out, ['cast', 'continuity', 'decisions'], errors, step); if (out.cast) errors.push(...validateCast(out.cast, V)); decs(out.decisions); }
  else if (step === 'narrative') { need(out, ['pilot', 'volumeMoments', 'decisions'], errors, step); if (out.pilot) errors.push(...validatePilot(out.pilot, P)); decs(out.decisions); }
  else if (step === 'critique') { need(out, ['objections', 'verdict', 'summary'], errors, step); if (!['accept', 'revise', 'reject'].includes(out.verdict)) err(errors, 'VERDICT', 'critique: verdictul este accept, revise sau reject.'); for (const o of arr(out.objections) ? out.objections : []) { if (!str(o?.id) || !str(o?.text) || !['blocking', 'major', 'minor'].includes(o?.severity) || !SECTION_OWNER[o?.target]) err(errors, 'OBJECTION_SHAPE', `critique: obiecția ${o?.id || '?'} cere id, țintă (secțiune), severitate și text.`); } }
  else if (step.startsWith('revision:')) { need(out, ['responses', 'revised'], errors, step); for (const r of arr(out.responses) ? out.responses : []) if (!str(r?.objection) || !['accepted', 'rejected'].includes(r?.resolution) || !str(r?.reason)) err(errors, 'RESPONSE_SHAPE', `${step}: fiecare răspuns cere obiecția, rezoluția (accepted/rejected) și motivul.`); const owner = step.slice(9); for (const k of Object.keys(out.revised || {})) if (SECTION_OWNER[k] !== owner) err(errors, 'REVISION_BOUNDARY', `${step}: secțiunea „${k}” aparține rolului ${SECTION_OWNER[k] || '?'}.`); if (out.revised?.arc) errors.push(...validateArc(out.revised.arc, V)); if (out.revised?.cast) errors.push(...validateCast(out.revised.cast, V)); if (out.revised?.pilot) errors.push(...validatePilot(out.revised.pilot, P)); decs(out.decisions); }
  else if (step === 'final_review') { need(out, ['verdict', 'summary'], errors, step); if (!['accept', 'accept_with_reservations', 'reject'].includes(out.verdict)) err(errors, 'VERDICT', 'final_review: accept, accept_with_reservations sau reject.'); }
  return errors;
}
export function validateArc(arc, V) {
  const errors = [], vols = arc?.volumes;
  if (!str(arc?.through_line)) err(errors, 'ARC_THROUGH_LINE', 'arc: lipsește firul colecției.');
  if (!arr(vols) || vols.length !== V || vols.some((v, i) => v?.n !== i + 1)) { err(errors, 'ARC_VOLUMES', `arc: exact ${V} volume, numerotate 1–${V}.`); return errors; }
  for (const v of vols) {
    for (const f of ['premise', 'goal', 'obstacle', 'discovery', 'choice', 'consequence', 'payoff']) if (!str(v[f])) err(errors, 'ARC_INCOMPLETE', `arc V${v.n}: lipsește „${f}”.`, { volume: v.n, field: f });
    if (!arr(v.characters) || !v.characters.length) err(errors, 'ARC_CHARACTERS', `arc V${v.n}: lipsesc personajele.`, { volume: v.n });
    for (const l of arr(v.links) ? v.links : []) { if (!LINK_KINDS.includes(l?.kind) || !Number.isInteger(l?.to) || l.to < 1 || l.to > V || l.to === v.n || !str(l?.what)) err(errors, 'ARC_LINK', `arc V${v.n}: legătură invalidă.`, { volume: v.n }); else if ((l.kind === 'callback' || l.kind === 'return') && l.to > v.n) err(errors, 'CALLBACK_DIRECTION', `arc V${v.n}: un callback trimite doar la un volum anterior.`, { volume: v.n }); else if (l.kind === 'setup' && l.to < v.n) err(errors, 'SETUP_DIRECTION', `arc V${v.n}: o pregătire trimite doar spre un volum ulterior.`, { volume: v.n }); }
  }
  return errors;
}
export function validateCast(cast, V) {
  const errors = [];
  if (!arr(cast) || !cast.length) return [{ code: 'CAST_EMPTY', message: 'cast: distribuția lipsește.' }];
  const idsSeen = new Set();
  for (const c of cast) {
    if (!str(c?.id) || idsSeen.has(c.id)) err(errors, 'CAST_ID', `cast: id lipsă sau dublat (${c?.id}).`); idsSeen.add(c?.id);
    for (const f of ['name', 'species', 'personality', 'reason']) if (!str(c?.[f])) err(errors, 'CAST_FIELD', `cast ${c?.id}: lipsește „${f}” (fiecare personaj are un motiv să existe).`, { character: c?.id });
    if (!ROLES.includes(c?.role)) err(errors, 'CAST_ROLE', `cast ${c?.id}: rolul este main, secondary sau minor.`, { character: c?.id });
    if (!arr(c?.volumes) || !c.volumes.length || c.volumes.some(n => !Number.isInteger(n) || n < 1 || n > V)) err(errors, 'CAST_VOLUMES', `cast ${c?.id}: volumele (1–${V}) în care apare.`, { character: c?.id });
  }
  const mains = cast.filter(c => c?.role === 'main');
  if (mains.length !== 1) err(errors, 'ONE_PROTAGONIST', `cast: exact un personaj principal (acum ${mains.length}).`);
  return errors;
}
export function validatePilot(pilot, P) {
  const errors = [], pages = pilot?.pages;
  if (pilot?.volume !== 1) err(errors, 'PILOT_VOLUME', 'pilot: volumul pilot este 1.');
  if (!arr(pages) || pages.length !== P || pages.some((p, i) => p?.n !== i + 1)) { err(errors, 'PILOT_PAGES', `pilot: exact ${P} pagini logice, numerotate 1–${P}.`); return errors; }
  for (const p of pages) {
    if (!str(p.beat) || !str(p.purpose)) err(errors, 'PILOT_PAGE', `pilot p${p.n}: lipsește momentul sau scopul.`, { page: p.n });
    if (!arr(p.characters) || !p.characters.length) err(errors, 'PILOT_CHARACTERS', `pilot p${p.n}: lipsesc personajele.`, { page: p.n });
    const t = p.turn || {}; if (!TURN_TYPES.includes(t.type)) err(errors, 'PILOT_TURN', `pilot p${p.n}: tip de întoarcere necunoscut.`, { page: p.n });
    else if (t.type !== 'quiet' && t.type !== 'reveal' && (!str(t.hook) || !Number.isInteger(t.payoff_page) || t.payoff_page <= p.n || t.payoff_page > P)) err(errors, 'PILOT_PAYOFF', `pilot p${p.n}: cârligul cere text și o pagină de răspuns ulterioară.`, { page: p.n });
  }
  return errors;
}

/**
 * Acceptance criteria of the assembled proposal. `structural` is PASS only when everything below holds and the
 * workflow is complete; a missing/blocked provider makes it INCOMPLETE — never a creative PASS.
 */
export function validateProposal(pr, baseline, { currentFingerprint = null, roles = {} } = {}) {
  const errors = [], warnings = [], s = pr.sections || {}, V = baseline.contract.volumes, P = baseline.contract.pagesPerBook, index = baseline.index;
  const complete = pr.steps?.every?.(x => x.status === 'done' || x.status === 'skipped') && !!s.arc && !!s.cast && !!s.pilot && !!pr.critique && !!pr.finalReview;
  /* 1. ProductContract and target kept (copied by the system, compared to the baseline) */
  if (pr.contract?.hash !== baseline.contract.hash || pr.contract?.volumes !== V || pr.contract?.pagesPerBook !== P) err(errors, 'CONTRACT_CHANGED', 'Propunerea schimbă ProductContract.');
  if (pr.target?.ageBand !== baseline.project.ageBand) err(errors, 'AGE_CHANGED', `Profilul de vârstă trebuie să rămână ${baseline.project.ageBand}.`);
  /* 2–4. arc, cast, pilot */
  if (s.arc) errors.push(...validateArc(s.arc, V)); else if (complete) err(errors, 'NO_ARC', 'Lipsește arcul colecției.');
  if (s.cast) errors.push(...validateCast(s.cast, V)); else if (complete) err(errors, 'NO_CAST', 'Lipsește distribuția.');
  if (s.pilot) errors.push(...validatePilot(s.pilot, P)); else if (complete) err(errors, 'NO_PILOT', 'Lipsește structura pilotului.');
  /* 5. continuity: arc ↔ cast consistency, appearances, recurring characters */
  if (s.arc?.volumes && arr(s.cast)) {
    const byId = Object.fromEntries(s.cast.map(c => [c.id, c]));
    for (const v of s.arc.volumes) { for (const id of v.characters || []) { if (!byId[id]) err(errors, 'ARC_UNKNOWN_CHARACTER', `V${v.n}: personajul „${id}” nu este în distribuție.`, { volume: v.n }); else if (!byId[id].volumes.includes(v.n)) err(errors, 'CAST_ARC_MISMATCH', `V${v.n}: „${id}” apare în arc, dar nu în volumele din distribuție.`, { volume: v.n }); }
      if ((v.characters || []).length > 5) warnings.push({ code: 'MANY_CHARACTERS', message: `V${v.n}: ${v.characters.length} personaje (direcția orientativă este 3–4; pentru 3–4 ani verifică supraîncărcarea).` }); }
    for (const c of s.cast) for (const n of c.volumes) if (!s.arc.volumes[n - 1]?.characters?.includes(c.id)) err(errors, 'CAST_ARC_MISMATCH', `„${c.id}” e declarat în V${n}, dar arcul volumului nu îl include.`, { volume: n });
    const main = s.cast.find(c => c.role === 'main'); if (main && main.volumes.length < V) warnings.push({ code: 'PROTAGONIST_ABSENT', message: `Personajul principal lipsește din ${V - main.volumes.length} volume.` });
    for (const cb of arr(s.continuity?.callbacks) ? s.continuity.callbacks : []) if (!Number.isInteger(cb?.from) || !Number.isInteger(cb?.to) || cb.to >= cb.from || cb.from > V || cb.to < 1) err(errors, 'CALLBACK_INVALID', `Callback invalid ${cb?.from}→${cb?.to} (trimite înapoi, în colecție).`);
  }
  /* 6. provenance: every decision valid, inside its author's role, and coverage of the core elements */
  const decisions = arr(pr.decisions) ? pr.decisions : [];
  for (const d of decisions) errors.push(...validateDecision(d, { index, allowedKinds: kindsFor(roles[d.owner]), where: `decizia ${d.owner || '?'}` }));
  const covered = new Set(decisions.map(d => d.element));
  for (const ref of ['series:through_line', ...index.filter(x => x.kind === 'volume' || x.kind === 'character').map(x => x.ref)]) if (complete && !covered.has(ref)) err(errors, 'NOT_DECIDED', `Elementul „${ref}” nu are decizie KEEP/IMPROVE/REPLACE/NEW.`);
  for (const k of ['location', 'object']) { const miss = index.filter(x => x.kind === k && !covered.has(x.ref)).length; if (complete && miss) warnings.push({ code: 'NOT_DECIDED_MINOR', message: `${miss} elemente „${k}” fără decizie explicită (rămân KEEP implicit).` }); }
  /* 7. KEEP integrity: a KEEP element may not be changed by any section */
  const canon = Object.fromEntries((baseline.inventory.canon.characters || []).map(c => [c.id, c]));
  for (const d of decisions.filter(x => x.decision === 'KEEP')) {
    const [kind, id] = [kindOfRef(d.element), d.element.split(':').slice(1).join(':')];
    if (kind === 'character' && arr(s.cast)) { const c = s.cast.find(x => x.id === id), b = canon[id]; if (!c) err(errors, 'KEEP_REMOVED', `„${id}” este KEEP, dar lipsește din distribuție.`); else if (b && (c.name !== b.name || (b.species && c.species !== b.species))) err(errors, 'KEEP_MODIFIED', `„${id}” este KEEP, dar numele/specia diferă de baseline.`); }
    if (kind === 'volume' && s.arc?.volumes) { const n = Number(id), b = baseline.inventory.series.volumes[n - 1]?.story_bible?.premise; if (b && s.arc.volumes[n - 1] && s.arc.volumes[n - 1].premise !== b) err(errors, 'KEEP_MODIFIED', `V${n} este KEEP, dar premisa diferă de baseline.`); }
    if (kind === 'page_plan' && s.pilot?.pages) { const m = id.match(/^V(\d+)-P(\d+)$/); if (m && Number(m[1]) === 1) { const b = baseline.inventory.pagePlans.find(p => p.id === id), p = s.pilot.pages[Number(m[2]) - 1]; if (b && p && p.turn?.type !== b.turn?.type) err(errors, 'KEEP_MODIFIED', `${id} este KEEP, dar tipul de întoarcere diferă.`); } }
  }
  /* 8. internal review: every blocking/major objection has a response; the final review exists */
  const objections = pr.critique?.objections || [], answered = new Set((pr.responses || []).map(r => r.objection));
  for (const o of objections.filter(x => x.severity !== 'minor')) if (!answered.has(o.id)) err(errors, 'OBJECTION_UNANSWERED', `Obiecția ${o.id} (${o.severity}) nu are răspuns în revizie.`);
  if (complete && !pr.finalReview) err(errors, 'NO_FINAL_REVIEW', 'Lipsește revizia finală a Editorului Critic.');
  /* 9. proposal-only: bound to the baseline and the project still identical */
  if (currentFingerprint && currentFingerprint !== baseline.projectFingerprint) err(errors, 'STALE_BASELINE', 'Proiectul s-a schimbat după baseline: propunerea este învechită.');
  if (pr.mutation && pr.mutation.before !== pr.mutation.after) err(errors, 'PROJECT_MUTATED', 'Proiectul sursă s-a schimbat în timpul rulării.');
  const structural = !complete ? 'INCOMPLETE' : errors.length ? 'FAIL' : 'PASS';
  return { structural, complete: !!complete, errors, warnings, creativeQuality: 'NOT_EVALUATED', note: 'Criteriile verifică forma, contractul, proveniența și comportamentul „doar propunere”; nu dovedesc calitatea creativă — aceasta este evaluată de operator.' };
}
