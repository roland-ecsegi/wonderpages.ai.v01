/**
 * Creative Upgrade Proposal — a first-class, proposal-only workflow over an existing collection.
 *
 * The permanent agents work in their own roles (identities are permanent; Claude/GPT are only their model bindings):
 *   direction    Director Creativ        evaluation, creative direction, age fit, risks
 *   structure    Arhitect Serie          collection arc V1–V6, before/after, impact on open observations
 *   continuity   Păstrător Continuitate  cast (a reason for every character), relations, callbacks, continuity issues
 *   narrative    Scriitor                pilot (V1) page structure, key moment of every volume
 *   critique     Editor Critic           independent critique of the whole draft
 *   revision:*   the author of each objected section — ONE revision round
 *   final_review Editor Critic           final verdict on the revised proposal
 * Every element is decided KEEP / IMPROVE / REPLACE / NEW with argument, evidence (baseline refs), impact, scope,
 * dependencies and risk; the default is "preserve good work → improve selectively → validate".
 *
 * Proposal-only by construction: this module READS the project (getProject / artifacts / listDecisions / getBlueprint)
 * and WRITES only its own documents under `projects/<pid>/creative/` (baselines, proposals). It never calls an artifact,
 * decision, approval or project write API, and the project fingerprint is checked before every step and at the end.
 * Applying a proposal is a separate, later operation that needs an explicit operator approval; it does not exist here.
 *
 * Without an authentic provider (Claude Code logged in with the operator's own Claude Pro plan) the workflow stops as
 * `blocked_provider`: incomplete, never a creative PASS. Structural acceptance never claims creative quality.
 */
import { uid, now } from '../repo.js';
import { buildBaseline, baselineRel, projectFingerprint } from './baseline.js';
import { PROPOSAL_SCHEMA, SECTION_OWNER, kindsFor, validateStepOutput, validateProposal } from './proposal.js';

export const STEPS = Object.freeze([
  { id: 'direction', agent: 'director-creativ', sections: ['evaluation', 'direction', 'ageFit', 'risks'] },
  { id: 'structure', agent: 'arhitect-serie', sections: ['arc', 'beforeAfter', 'observationsImpact'] },
  { id: 'continuity', agent: 'pastrator-continuitate', sections: ['cast', 'continuity'] },
  { id: 'narrative', agent: 'scriitor', sections: ['pilot', 'volumeMoments'] },
  { id: 'critique', agent: 'editor-critic', sections: [] },
  { id: 'revision', agent: null, sections: [] },          // expanded after the critique into revision:<owner>
  { id: 'final_review', agent: 'editor-critic', sections: [] }
]);
export const FINAL = Object.freeze(['ready_for_review', 'critic_rejected', 'invalid', 'stale_baseline']);
export const RESUMABLE = Object.freeze(['blocked_provider', 'failed', 'interrupted']);
export const MAX_ATTEMPTS = 2;   // one retry with the validation errors fed back, then the step fails (resumable)
export const MARK = 'CREATIVE UPGRADE PROPOSAL — STEP:';
const PROVIDER_CODES = new Set(['auth', 'no_claude_code', 'capability_unavailable', 'capability_limited', 'rate_limited', 'codex_auth', 'codex_missing', 'charter_binding']);
const proposalRel = (pid, id) => `projects/${pid}/creative/proposals/${id}.json`;

const STEP_SPEC = {
  direction: `Evaluate the existing collection and set the creative direction for the upgrade.
Return JSON: {"evaluation":{"strengths":[...],"weaknesses":[...]},"direction":"…","ageFit":"…","risks":[{"risk":"…","mitigation":"…"}],"decisions":[…]}`,
  structure: `Propose the collection arc, volume by volume, preserving what works.
Return JSON: {"arc":{"through_line":"…","volumes":[{"n":1,"premise":"…","characters":["<cast id>"],"goal":"…","obstacle":"…","discovery":"…","choice":"…","consequence":"…","payoff":"…","links":[{"to":<volume>,"kind":"callback|setup|payoff|return","what":"…"}]}, … exactly VOLUMES entries]},"beforeAfter":[{"element":"<ref>","before":"…","after":"…"}],"observationsImpact":[{"observation":"<finding or observation>","impact":"…"}],"decisions":[…]}
A callback/return points to an EARLIER volume, a setup to a LATER one.`,
  continuity: `Own the cast and the cross-volume continuity. Every character needs a reason to exist; exactly one main character.
Return JSON: {"cast":[{"id":"…","name":"…","species":"…","personality":"…","role":"main|secondary|minor","reason":"…","volumes":[…],"relations":[{"with":"<id>","kind":"…"}]}],"continuity":{"callbacks":[{"from":<later volume>,"to":<earlier volume>,"what":"…"}],"issues":[{"issue":"…","volumes":[…]}]},"decisions":[…]}
The arc's characters per volume must match the cast's volumes.`,
  narrative: `Propose the pilot (volume 1) page STRUCTURE (not final text) and the key moment of every volume.
Return JSON: {"pilot":{"volume":1,"pages":[{"n":1,"beat":"…","characters":[…],"turn":{"type":"quiet|question|surprise|anticipation|unfinished_action|reveal","hook":"…","payoff_page":<later page>},"purpose":"…"}, … exactly PAGES pages]},"volumeMoments":[{"volume":1,"moment":"…"}],"decisions":[…]}`,
  critique: `You did not write this draft. Critique it independently against the baseline, the age profile and the product contract.
Return JSON: {"objections":[{"id":"O-1","target":"<section: evaluation|direction|ageFit|risks|arc|beforeAfter|observationsImpact|cast|continuity|pilot|volumeMoments>","severity":"blocking|major|minor","text":"…","evidence":["<ref>"]}],"verdict":"accept|revise|reject","summary":"…"}`,
  revision: `ONE revision round. Answer EVERY objection addressed to your sections (accept and change, or reject with a reason). Revise only your own sections.
Return JSON: {"responses":[{"objection":"<id>","resolution":"accepted|rejected","change":"…","reason":"…"}],"revised":{"<your section>":…},"decisions":[… optional replacements of your own decisions]}`,
  final_review: `Final review of the revised proposal (after the single revision round).
Return JSON: {"verdict":"accept|accept_with_reservations|reject","summary":"…","remaining":["…"]}`
};

/** The compact, model-facing view of the frozen baseline (the full dossier stays stored, hashed). */
export function baselineView(b) {
  const inv = b.inventory;
  return {
    project: { title: b.project.title, ageBand: b.project.ageBand, languages: b.project.languages, revision: b.project.revision },
    contract: b.contract, series: inv.series, brief: inv.brief, cast: inv.cast, canon: { characters: inv.canon.characters, locations: inv.canon.locations, objects: inv.canon.objects, world_rules: inv.canon.world_rules },
    pagePlans: inv.pagePlans.map(p => ({ id: p.id, beat: p.beat, purpose: p.purpose, characters: p.characters, objects: p.objects, location: p.location, turn: p.turn })),
    manuscripts: inv.manuscripts, decisionsAlreadyTaken: b.decisions, findings: b.findings
  };
}

export function stepPrompt(step, pr, baseline, { role, objections = [] } = {}) {
  const base = step.startsWith('revision:') ? 'revision' : step, allowed = kindsFor(role);
  const spec = STEP_SPEC[base].replace('VOLUMES', String(baseline.contract.volumes)).replace('PAGES', String(baseline.contract.pagesPerBook));
  const draft = { sections: pr.sections, decisions: pr.decisions.map(({ owner, step: s, ...d }) => ({ owner, ...d })) };
  return [
    `${MARK} ${step}`,
    `You are writing a PROPOSAL for upgrading an existing children's collection. Nothing you write changes the project: the operator reviews the proposal and decides separately whether to apply any part of it.`,
    `Principle: preserve good work → improve selectively → validate. Do not regenerate the collection wholesale; every change must be argued from the baseline.`,
    `Fixed: product contract ${baseline.contract.volumes} volumes × ${baseline.contract.pagesPerBook} logical pages; age profile ${baseline.project.ageBand}. Do not change them.`,
    base === 'critique' || base === 'final_review' ? '' : `Every decision: {"element":"<ref from ELEMENT INDEX, or new:<kind>:<id> for NEW>","decision":"KEEP|IMPROVE|REPLACE|NEW","argument":"…","evidence":["<ref>|operator_direction|finding:<id>"],"impact":"…","scope":{"volumes":[…],"pages":[…]},"dependencies":["<ref>"],"risk":{"level":"low|medium|high","note":"…"}}. You may decide only on element kinds: ${allowed.join(', ') || 'none'}.`,
    spec,
    `OPERATOR DIRECTION: ${pr.direction || '(none given)'}`,
    `ELEMENT INDEX: ${JSON.stringify(baseline.index.map(x => x.ref))}`,
    `BASELINE (frozen, hash ${baseline.hash.slice(0, 16)}): ${JSON.stringify(baselineView(baseline))}`,
    base === 'direction' ? '' : `PROPOSAL SO FAR: ${JSON.stringify(draft)}`,
    objections.length ? `OBJECTIONS TO ANSWER: ${JSON.stringify(objections)}` : '',
    base === 'final_review' ? `REVISION RESPONSES: ${JSON.stringify(pr.responses)}` : '',
    'Return only the JSON object.'
  ].filter(Boolean).join('\n\n');
}

/**
 * ctx: { repo, storage, complete(prompt, opts) (= agentComplete), checkProvider() → {configured, authentic, message, …},
 *        roles() → RoleContracts by id, skills() → skills by id, isProjectBusy(pid) → bool }
 */
export function createUpgradeService(ctx) {
  const ACTIVE = new Map();   // pid → proposal id (one run per project)
  const roleOf = id => ctx.roles()[id] || null;

  async function state(pid) {
    const project = ctx.repo.getProject(pid); if (!project) throw { status: 404, message: 'Proiect inexistent.' };
    const [art, decisions, bp] = await Promise.all([ctx.repo.artifacts(pid), ctx.repo.listDecisions(pid).catch(() => []), ctx.repo.getBlueprint(pid)]);
    return { project, art, decisions, bp };
  }
  const fingerprint = async pid => { const s = await state(pid); return projectFingerprint(s.project, s.art, s.decisions); };

  async function createBaseline(pid) {
    const s = await state(pid), b = buildBaseline({ ...s, source: { kind: s.project.source?.kind || 'native', originalSha256: s.project.migration?.sourceSha256 || null } });
    const rel = baselineRel(pid, b.hash); if (!(await ctx.storage.readJSON(rel, null))) await ctx.storage.writeJSON(rel, { ...b, createdAt: now() });
    return b;
  }
  const getBaseline = async (pid, hash) => { if (!/^[a-f0-9]{16,64}$/.test(String(hash || ''))) throw { status: 400, message: 'Hash de baseline invalid.' }; const b = await ctx.storage.readJSON(baselineRel(pid, hash), null); if (!b) throw { status: 404, message: 'Baseline inexistent.' }; return b; };
  async function listBaselines(pid) {
    const files = (await ctx.storage.list(`projects/${pid}/creative/baselines`).catch(() => [])).filter(f => f.name.endsWith('.json'));
    const docs = (await Promise.all(files.map(f => ctx.storage.readJSON(`projects/${pid}/creative/baselines/${f.name}`, null)))).filter(Boolean);
    return docs.map(b => ({ hash: b.hash, createdAt: b.createdAt, revision: b.project.revision, projectFingerprint: b.projectFingerprint, counts: b.counts })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }

  async function load(pid, id) {
    if (!/^cu[a-z0-9]{6,32}$/.test(String(id || ''))) throw { status: 400, message: 'Id de propunere invalid.' };
    const pr = await ctx.storage.readJSON(proposalRel(pid, id), null); if (!pr) throw { status: 404, message: 'Propunere inexistentă.' };
    if (pr.status === 'running' && ACTIVE.get(pid) !== id) { pr.status = 'interrupted'; pr.history.push({ at: now(), event: 'interrupted', note: 'Rularea s-a oprit (repornire/eroare); se poate relua.' }); await save(pr); }
    return pr;
  }
  async function save(pr) {
    const stored = await ctx.storage.readJSON(proposalRel(pr.pid, pr.id), null);
    if (stored?.finalizedAt) throw { status: 409, code: 'proposal_final', message: 'Propunerea finalizată este imuabilă; creează o versiune nouă.' };
    pr.rev = (pr.rev || 0) + 1; pr.updatedAt = now(); if (FINAL.includes(pr.status)) pr.finalizedAt ||= pr.updatedAt;
    await ctx.storage.writeJSON(proposalRel(pr.pid, pr.id), pr);
  }
  async function list(pid) {
    const files = (await ctx.storage.list(`projects/${pid}/creative/proposals`).catch(() => [])).filter(f => f.name.endsWith('.json'));
    const docs = (await Promise.all(files.map(f => ctx.storage.readJSON(`projects/${pid}/creative/proposals/${f.name}`, null)))).filter(Boolean);
    const supersededBy = Object.fromEntries(docs.filter(d => d.supersedes).map(d => [d.supersedes, d.id]));
    return docs.map(d => ({ id: d.id, version: d.version, status: d.status === 'running' && ACTIVE.get(pid) !== d.id ? 'interrupted' : d.status, createdAt: d.createdAt, updatedAt: d.updatedAt, baseline: d.baseline.hash, supersedes: d.supersedes || null, supersededBy: supersededBy[d.id] || null, structural: d.validation?.structural || 'INCOMPLETE', steps: d.steps.map(s => ({ id: s.id, agent: s.agent, status: s.status })) })).sort((a, b) => a.createdAt - b.createdAt);
  }

  /* the slot is reserved synchronously (before any await), so two concurrent requests cannot both start */
  function reserve(pid) {
    if (ACTIVE.has(pid)) throw { status: 409, code: 'creative_busy', message: 'O propunere rulează deja pentru acest proiect.' };
    if (ctx.isProjectBusy?.(pid)) throw { status: 409, code: 'busy', message: 'Proiectul rulează producție; propunerea pornește după oprire.' };
    ACTIVE.set(pid, '(rezervat)');
  }
  /* errors can only happen before launch() (the run's own errors are recorded in the proposal), so the slot is freed */
  async function start(pid, opts = {}) { reserve(pid); try { return await start0(pid, opts); } catch (e) { ACTIVE.delete(pid); throw e; } }
  async function resume(pid, id) { reserve(pid); try { return await resume0(pid, id); } catch (e) { ACTIVE.delete(pid); throw e; } }
  async function start0(pid, { baseline: hash = null, direction = '', supersedes = null } = {}) {
    const b = hash ? await getBaseline(pid, hash) : await createBaseline(pid), fp = await fingerprint(pid);
    if (b.projectFingerprint !== fp) throw { status: 409, code: 'stale_baseline', message: 'Proiectul s-a schimbat după acest baseline; creează un baseline nou.' };
    let version = 1; if (supersedes) { const prev = await load(pid, supersedes); version = (prev.version || 1) + 1; }
    const pr = {
      schema: PROPOSAL_SCHEMA, id: uid('cu'), pid, version, supersedes: supersedes || null, status: 'running', createdAt: now(), rev: 0,
      baseline: { hash: b.hash, projectFingerprint: b.projectFingerprint, projectRevision: b.project.revision, rel: baselineRel(pid, b.hash) },
      contract: { hash: b.contract.hash, volumes: b.contract.volumes, pagesPerBook: b.contract.pagesPerBook }, target: { ageBand: b.project.ageBand },
      direction: String(direction || '').slice(0, 4000),
      steps: STEPS.filter(s => s.id !== 'revision').map(s => ({ id: s.id, agent: s.agent, status: 'pending', attempts: [] })),
      sections: {}, decisions: [], critique: null, responses: [], finalReview: null,
      mutation: { before: fp, after: null }, provider: null, validation: null,
      apply: { available: false, requires: 'operator_approval', note: 'Aplicarea este o operație separată, ulterioară, cu aprobarea explicită a operatorului.' },
      history: [{ at: now(), event: 'created', baseline: b.hash, supersedes: supersedes || null }]
    };
    ACTIVE.set(pid, pr.id); await save(pr);
    return launch(pr, b);
  }
  async function resume0(pid, id) {
    const pr = await load(pid, id); if (!RESUMABLE.includes(pr.status)) throw { status: 409, code: 'not_resumable', message: `Propunerea este „${pr.status}”; nu se reia.` };
    const b = await getBaseline(pid, pr.baseline.hash); ACTIVE.set(pid, id); pr.status = 'running'; pr.history.push({ at: now(), event: 'resumed', after: pr.error || null }); pr.error = null; await save(pr);
    return launch(pr, b);
  }
  function launch(pr, b) {
    ACTIVE.set(pr.pid, pr.id);
    const done = run(pr, b).catch(async e => { pr.status = 'failed'; pr.error = { code: e?.code || 'error', message: String(e?.message || e).slice(0, 500) }; pr.history.push({ at: now(), event: 'failed', error: pr.error }); await save(pr).catch(() => {}); }).finally(() => { if (ACTIVE.get(pr.pid) === pr.id) ACTIVE.delete(pr.pid); });
    return { id: pr.id, status: pr.status, done };
  }

  async function stop(pr, status, extra = {}) { pr.status = status; Object.assign(pr, extra); pr.history.push({ at: now(), event: status, ...(extra.error ? { error: extra.error } : {}) }); pr.mutation.after = await fingerprint(pr.pid); await finalizeValidation(pr); await save(pr); }
  async function finalizeValidation(pr) { const b = await getBaseline(pr.pid, pr.baseline.hash); pr.validation = validateProposal(pr, b, { currentFingerprint: pr.mutation.after, roles: ctx.roles() }); }

  async function run(pr, b) {
    /* provider gate: only an authentic provider (the operator's own Claude Pro login) runs the agents */
    const prov = await ctx.checkProvider(); pr.provider = { ...prov, checkedAt: now() };
    if (!prov.authentic) return stop(pr, 'blocked_provider', { error: { code: 'provider_not_authentic', message: prov.message || 'Furnizorul nu este autentificat cu contul Claude Pro al operatorului.' } });
    for (;;) {
      const step = pr.steps.find(s => s.status !== 'done' && s.status !== 'skipped'); if (!step) break;
      if ((await fingerprint(pr.pid)) !== b.projectFingerprint) return stop(pr, 'stale_baseline', { error: { code: 'stale_baseline', message: 'Proiectul s-a schimbat în timpul rulării; propunerea este învechită.' } });
      const r = await runStep(pr, b, step); if (r !== 'ok') return;
    }
    pr.mutation.after = await fingerprint(pr.pid); await finalizeValidation(pr);
    pr.status = pr.finalReview?.verdict === 'reject' ? 'critic_rejected' : pr.validation.structural === 'PASS' ? 'ready_for_review' : 'invalid';
    pr.history.push({ at: now(), event: pr.status, structural: pr.validation.structural, errors: pr.validation.errors.length });
    await save(pr);
  }
  function expandRevisions(pr) {
    const owners = [...new Set((pr.critique?.objections || []).map(o => SECTION_OWNER[o.target]).filter(Boolean))];
    const at = pr.steps.findIndex(s => s.id === 'final_review');
    const revs = owners.map(o => ({ id: `revision:${o}`, agent: o, status: 'pending', attempts: [] }));
    pr.steps.splice(at, 0, ...(revs.length ? revs : [{ id: 'revision', agent: null, status: 'skipped', attempts: [], note: 'Nicio obiecție: runda de revizie nu are ce schimba.' }]));
  }

  async function runStep(pr, b, step) {
    const role = roleOf(step.agent), skills = ctx.skills?.() || {};
    const objections = step.id.startsWith('revision:') ? (pr.critique?.objections || []).filter(o => SECTION_OWNER[o.target] === step.agent) : [];
    let feedback = null, invalid = 0;
    step.status = 'running'; await save(pr);
    while (invalid < MAX_ATTEMPTS) {
      let manifest = null, out, t0 = now();
      const prompt = stepPrompt(step.id, pr, b, { role, objections }) + (feedback ? `\n\nYOUR PREVIOUS ANSWER WAS REJECTED BY THE STRUCTURAL CHECKS; FIX: ${JSON.stringify(feedback)}` : '');
      try { out = await ctx.complete(prompt, { agent: step.agent, task: `Creative Upgrade: ${step.id}`, json: true, pid: pr.pid, age: pr.target.ageBand, meta: { stage: 'creative_upgrade', prompt: `creative_upgrade:${step.id.split(':')[0]}`, lessons: false }, onContext: m => { manifest = m; } }); }
      catch (e) {
        const attempt = attemptRecord(step, role, skills, manifest, t0, false, [{ code: e?.code || 'error', message: String(e?.message || e).slice(0, 300) }]); step.attempts.push(attempt);
        if (PROVIDER_CODES.has(e?.code) || /^codex_/.test(e?.code || '')) { step.status = 'pending'; await stop(pr, 'blocked_provider', { error: { code: e.code, message: String(e.message || '').slice(0, 300), resetAt: e.resetAt || null } }); return 'blocked'; }
        if (e?.code === 'invalid_json') { invalid++; feedback = [{ code: 'NOT_JSON', message: 'Răspunsul nu a fost JSON valid.' }]; continue; }
        step.status = 'failed'; await stop(pr, 'failed', { error: { code: e?.code || 'error', message: String(e?.message || e).slice(0, 300) } }); return 'failed';
      }
      const errors = validateStepOutput(step.id, out, { index: b.index, role, baseline: b });
      step.attempts.push(attemptRecord(step, role, skills, manifest, t0, !errors.length, errors.slice(0, 30)));
      if (errors.length) { invalid++; feedback = errors.slice(0, 30); continue; }
      accept(pr, step, out); step.status = 'done'; step.output = out; pr.history.push({ at: now(), event: 'step_done', step: step.id, agent: step.agent }); await save(pr);
      return 'ok';
    }
    step.status = 'invalid_output'; await stop(pr, 'failed', { error: { code: 'invalid_output', message: `${step.id}: ieșirea nu a trecut verificările structurale după ${MAX_ATTEMPTS} încercări.`, details: feedback } });
    return 'failed';
  }
  function attemptRecord(step, role, skills, m, t0, ok, errors) {
    return { at: now(), ok, ms: now() - t0, errors, agent: step.agent, role: role ? { id: role.id, roleVersion: role.roleVersion, contractHash: role.hash } : null,
      skills: (role?.ownedSkills || []).map(s => ({ id: s, version: skills[s]?.version || null })), context: m ? { manifestHash: m.manifestHash, provider: m.model?.provider || null, model: m.model?.model || null, modelSource: m.model?.source || null, charterVersion: m.charterVersion, roleContractHash: m.roleContractHash, promptHash: m.promptHash } : null };
  }
  function accept(pr, step, out) {
    const own = (decs, owner) => (Array.isArray(decs) ? decs : []).map(d => ({ ...d, owner, step: step.id }));
    if (STEPS.find(s => s.id === step.id)?.sections.length) { for (const k of STEPS.find(s => s.id === step.id).sections) pr.sections[k] = out[k]; pr.decisions.push(...own(out.decisions, step.agent)); }
    else if (step.id === 'critique') { pr.critique = { objections: out.objections || [], verdict: out.verdict, summary: out.summary, by: step.agent }; expandRevisions(pr); }
    else if (step.id.startsWith('revision:')) {
      for (const [k, v] of Object.entries(out.revised || {})) pr.sections[k] = v;
      pr.responses.push(...out.responses.map(r => ({ ...r, by: step.agent })));
      for (const d of own(out.decisions, step.agent)) { const i = pr.decisions.findIndex(x => x.owner === d.owner && x.element === d.element); if (i >= 0) pr.decisions[i] = { ...d, revises: pr.decisions[i].step }; else pr.decisions.push(d); }
    } else if (step.id === 'final_review') pr.finalReview = { verdict: out.verdict, summary: out.summary, remaining: out.remaining || [], by: step.agent };
  }

  /** A proposal as shown: stored document + live staleness (project changed since its baseline). */
  async function view(pid, id) { const pr = await load(pid, id), fp = await fingerprint(pid); return { ...pr, live: { stale: fp !== pr.baseline.projectFingerprint, projectFingerprint: fp, running: ACTIVE.get(pid) === id } }; }
  async function readiness(pid) {
    const prov = await ctx.checkProvider(), roles = ctx.roles(), agents = STEPS.filter(s => s.agent).map(s => s.agent).filter((x, i, a) => a.indexOf(x) === i).map(id => ({ id, role: !!roles[id], skills: roles[id]?.ownedSkills || [] }));
    const reasons = [...(prov.authentic ? [] : [prov.message || 'Furnizorul nu este autentificat cu contul Claude Pro al operatorului.']), ...agents.filter(a => !a.role).map(a => `Lipsește RoleContract pentru ${a.id}.`), ...(ctx.isProjectBusy?.(pid) ? ['Proiectul rulează producție.'] : []), ...(ACTIVE.has(pid) ? ['O propunere rulează deja.'] : [])];
    return { canRun: !reasons.length, reasons, provider: prov, agents, steps: STEPS.map(s => ({ id: s.id, agent: s.agent })), proposalOnly: true, applyAvailable: false };
  }
  return { createBaseline, getBaseline, listBaselines, start, resume, load, view, list, readiness, fingerprint, active: () => new Map(ACTIVE) };
}
