/**
 * P3-T01 — Permanent Agent Registry (OUTPUT-07, ADR02).
 *
 * Identity (stable ID, name) is permanent; capability is versioned: RoleContract (typed inputs/outputs, tools,
 * forbidden actions, escalation, evidence obligations), SkillVersions and a separate ModelBinding. A model or
 * provider swap changes only the binding — identity, history and experience survive. Charter history (including
 * custom personas) is kept and recoverable. Maturity is `unproven` until evidence exists (P7-T04).
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalHash, sha256 } from '../domain/canonical.js';
import { ROOT } from '../config.js';

export const PERMANENT_IDS = Object.freeze(['asistent', 'producator', 'director-creativ', 'arhitect-serie', 'pastrator-continuitate', 'scriitor', 'editor-critic', 'corector', 'traducator', 'director-artistic', 'inginer']);
const REQUIRED = ['id', 'name', 'roleVersion', 'mission', 'inputs', 'outputs', 'contextScope', 'ownedSkills', 'toolAllowlist', 'qualityDimensions', 'forbiddenActions', 'escalation', 'handoff', 'evidenceObligations'];

export function validateRoleContract(rc) {
  const errors = [];
  for (const k of REQUIRED) if (rc?.[k] === undefined || rc[k] === null || (Array.isArray(rc[k]) && k !== 'handoff' && k !== 'escalation' && !rc[k].length && k !== 'prerequisites')) errors.push(`câmp obligatoriu lipsă: ${k}`);
  if (rc && !PERMANENT_IDS.includes(rc.id)) errors.push(`identitate necunoscută: ${rc.id}`);
  if (rc?.outputs && typeof rc.outputs !== 'object') errors.push('outputs trebuie să fie o schemă JSON');
  if (rc?.toolAllowlist?.some?.(t => !/^(text|image):(any|claude-code|codex|canva|chatgpt)$/.test(t))) errors.push('toolAllowlist conține un instrument necunoscut');
  if (rc?.roleVersion && !/^\d+\.\d+\.\d+$/.test(rc.roleVersion)) errors.push('roleVersion trebuie să fie semver');
  return errors;
}
export function loadContracts(root = ROOT) {
  const rc = JSON.parse(fs.readFileSync(path.join(root, 'agents', 'contracts', 'role-contracts.json'), 'utf8'));
  const sk = JSON.parse(fs.readFileSync(path.join(root, 'agents', 'contracts', 'skills.json'), 'utf8'));
  const errors = [], roles = {};
  for (const r of rc.roles) { const e = validateRoleContract(r); if (e.length) errors.push({ id: r.id, errors: e }); roles[r.id] = { ...r, hash: canonicalHash(r) }; }
  for (const id of PERMANENT_IDS) if (!roles[id]) errors.push({ id, errors: ['lipsește RoleContract'] });
  const skills = {};
  for (const s of sk.skills) {
    let sourceHash = null;
    if (s.source?.startsWith('.claude/')) { try { sourceHash = sha256(fs.readFileSync(path.join(root, s.source))); } catch { errors.push({ id: s.id, errors: ['fișierul sursă al skill-ului lipsește'] }); } }
    skills[s.id] = { ...s, sourceHash, hash: canonicalHash({ ...s, sourceHash }), maturity: s.maturity || 'unproven' };
  }
  for (const r of Object.values(roles)) for (const sid of r.ownedSkills || []) if (!skills[sid]) errors.push({ id: r.id, errors: [`skill necunoscut: ${sid}`] });
  return { roles, skills, errors, version: rc.version };
}
/** ModelBinding is separate from identity; a role restricted to one provider by its charter cannot be bound elsewhere. */
export function modelBinding(agent, role) {
  const model = agent?.model || 'sonnet', provider = model === 'gpt-6-sol' ? 'codex' : 'claude-code';
  const allowed = (role?.toolAllowlist || []).filter(t => t.startsWith('text:')).map(t => t.split(':')[1]);
  return { provider, model, reasoning: provider === 'codex' ? 'medium' : null, fallback: null, allowedProviders: allowed.includes('any') ? ['claude-code', 'codex'] : allowed, consistent: allowed.includes('any') || allowed.includes(provider) };
}
export function assertBindingAllowed(role, model) {
  const b = modelBinding({ model }, role);
  if (!b.consistent) throw { status: 409, code: 'charter_binding', message: `Carta rolului „${role.name}” permite doar ${b.allowedProviders.join(', ')} pentru text; modelul ${model} nu este permis.` };
}

/** Profiles: one per permanent identity. Migration from agents.json keeps IDs, names, custom personas and models. */
export function syncProfiles(agents, contracts, saved = {}, now = Date.now()) {
  const out = {}, events = [];
  for (const id of PERMANENT_IDS) {
    const a = agents[id], role = contracts.roles[id], prev = saved[id];
    if (!a) continue;
    const persona = a.persona || '', custom = persona !== a.defaultPersona, personaHash = sha256(persona).slice(0, 16);
    const history = [...(prev?.charterHistory || [])];
    const last = history[history.length - 1];
    if (!last || last.personaHash !== personaHash || last.charter !== (a.charter || '1')) { history.push({ charter: a.charter || '1', personaHash, source: custom ? 'custom' : 'default', text: custom ? persona : null, defaultHash: sha256(a.defaultPersona || '').slice(0, 16), at: now }); events.push({ id, kind: 'charter', personaHash }); }
    const binding = modelBinding(a, role), bindings = [...(prev?.bindingHistory || [])];
    if (!bindings.length || bindings[bindings.length - 1].model !== binding.model) { bindings.push({ provider: binding.provider, model: binding.model, at: now }); if (prev) events.push({ id, kind: 'binding', model: binding.model }); }
    out[id] = {
      id, name: a.name, createdAt: prev?.createdAt || now, roleVersion: role?.roleVersion || null, roleContractHash: role?.hash || null,
      skillVersions: Object.fromEntries((role?.ownedSkills || []).map(s => [s, contracts.skills[s]?.version || null])),
      validatedKnowledgeSnapshot: prev?.validatedKnowledgeSnapshot || null, modelBinding: binding, bindingHistory: bindings.slice(-50),
      charterHistory: history.slice(-50), maturity: prev?.maturity || Object.fromEntries((role?.ownedSkills || []).map(s => [s, { status: 'unproven', evidence: [] }]))
    };
  }
  return { profiles: out, events };
}
