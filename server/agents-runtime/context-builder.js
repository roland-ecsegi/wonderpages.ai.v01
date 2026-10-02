/**
 * P3-T02 — Context Builder and real provenance (OUTPUT-07 memory layers, OUTPUT-22).
 *
 * Layers, in order: 1) stable role (charter + RoleContract duties)  2) hard rules (editorial/product/safety policy)
 * 3) eligible validated experience for THIS role (scope global / this age / this project only)  4) project canon
 * reference (the canon itself travels in the task message)  5) the task. Layers 1–2 are never truncated; layer 3
 * is budgeted. Every inclusion and exclusion is recorded in a manifest; the system text is reproducible from the
 * manifest and its sources (same inputs → same hash). The EFFECTIVE model and the source of any override are recorded.
 */
import { canonicalHash, sha256 } from '../domain/canonical.js';

export const MANIFEST_SCHEMA = 'wonderpages.context-manifest/1';
/* imported/learned text that tries to act as an instruction to the system is never placed in context */
const INJECTION = /(ignore (all |the )?(previous|prior|above) (instructions|rules)|disregard (the )?(system|previous)|you are now|system prompt|reveal (your|the) (prompt|instructions)|ignoră (toate )?instrucțiunile|uită regulile|run (this|the following) (command|script)|execute (this|the following)|<\/?script|```(bash|sh|powershell))/i;
export const looksLikeInjection = t => INJECTION.test(String(t || ''));

const scopeOf = l => l.scope || (l.pid ? 'project' : l.age ? 'age' : 'global');
const rank = l => (['manual', 'initial', 'registru'].includes(l.source) ? 0.3 : 0) + (l.confidence || 0) + (l.effect == null ? 0 : l.effect > 0 ? Math.min(0.3, l.effect / 2) : -0.2) - (l.needsReview ? 0.3 : 0);

/** Pure lesson selection with explicit exclusion reasons; deterministic (ties broken by id). */
export function selectExperience(lessons, { agentId, age, pid, stage, prompt, budget = 1400, max = 12 }) {
  const included = [], excluded = []; let used = 0;
  const candidates = [];
  for (const l of lessons) {
    const why = l.agent !== agentId ? 'alt_rol' : l.status !== 'active' ? `status_${l.status || 'necunoscut'}` : scopeOf(l) === 'project' && (!l.pid || l.pid !== pid) ? 'alt_proiect' : scopeOf(l) === 'age' && l.age !== age ? 'altă_vârstă' : l.stages?.length && (stage || prompt) && !l.stages.includes(stage) && !l.stages.includes(prompt) ? 'altă_etapă' : looksLikeInjection(l.text) ? 'instrucțiune_suspectă' : null;
    if (why) { excluded.push({ id: l.id, reason: why }); continue; }
    candidates.push(l);
  }
  candidates.sort((a, b) => rank(b) - rank(a) || String(a.id).localeCompare(String(b.id)));
  for (const l of candidates) {
    const n = String(l.text).length + 3;
    if (included.length >= max || (included.length && used + n > budget)) { excluded.push({ id: l.id, reason: 'buget' }); continue; }
    included.push(l); used += n;
  }
  excluded.sort((a, b) => String(a.id).localeCompare(String(b.id)));   // determinism: input order never changes the manifest
  return { included, excluded, budget: { limit: budget, used, max } };
}

/** Effective model and where it came from (an override must never be reported as the agent's default). */
export function effectiveModel({ agent, override = null, variant = null, defaultModel = 'sonnet' }) {
  if (agent?.model === 'gpt-6-sol') return { model: 'gpt-6-sol', provider: 'codex', source: 'agent_binding' };
  if (variant) return { model: variant, provider: 'claude-code', source: 'model_variant' };
  if (override) return { model: override, provider: override === 'gpt-6-sol' ? 'codex' : 'claude-code', source: 'stage_override' };
  if (agent?.model) return { model: agent.model, provider: 'claude-code', source: 'agent_binding' };
  return { model: defaultModel, provider: 'claude-code', source: 'default' };
}

export function renderSystem({ persona, policy, lessons }) {
  return `${persona}\n\n${policy}${lessons.length ? `\n\nLESSONS LEARNED FROM THE PUBLISHER'S PAST REVIEWS (apply them):\n${lessons.map(l => '- ' + l.text).join('\n')}` : ''}`;
}

/**
 * Builds system text + manifest. `agent` = permanent profile (persona, charterVersion), `role` = RoleContract,
 * `policy` = hard rules text, `lessons` = the whole lesson store (filtered here), `prompt` = task message.
 */
export function buildContext({ agent, role = null, policy = '', lessons = [], age = null, pid = null, stage = null, promptKey = null, prompt = '', override = null, variant = null, defaultModel = 'sonnet', budget = 1400 }) {
  const sel = selectExperience(lessons, { agentId: agent.id, age, pid, stage, prompt: promptKey, budget });
  const system = renderSystem({ persona: agent.persona, policy, lessons: sel.included });
  const eff = effectiveModel({ agent, override, variant, defaultModel });
  const manifest = {
    schema: MANIFEST_SCHEMA, agentId: agent.id, charterVersion: agent.charterVersion || null, personaHash: sha256(agent.persona || '').slice(0, 16),
    roleVersion: role?.roleVersion || null, roleContractHash: role?.hash || null, policyHash: sha256(policy).slice(0, 16),
    layers: { role: { chars: (agent.persona || '').length, truncated: false }, hardRules: { chars: policy.length, truncated: false }, experience: { included: sel.included.map(l => ({ id: l.id, scope: scopeOf(l), hash: sha256(l.text).slice(0, 16) })), excluded: sel.excluded, budget: sel.budget } },
    scope: { pid, age, stage, prompt: promptKey }, model: eff, systemHash: sha256(system), promptHash: sha256(String(prompt))
  };
  return { system, manifest: { ...manifest, manifestHash: canonicalHash(manifest) } };
}
/** Exact reproduction check: rebuild the system text from the manifest's lesson IDs and the current sources. */
export function reproduce(manifest, { agent, policy, lessons }) {
  const byId = new Map(lessons.map(l => [l.id, l]));
  const picked = manifest.layers.experience.included.map(x => byId.get(x.id));
  if (picked.some(l => !l || sha256(l.text).slice(0, 16) !== manifest.layers.experience.included.find(x => x.id === l.id).hash)) return { exact: false, reason: 'o lecție folosită s-a schimbat sau a fost retrasă' };
  const system = renderSystem({ persona: agent.persona, policy, lessons: picked });
  return { exact: sha256(system) === manifest.systemHash, system };
}
