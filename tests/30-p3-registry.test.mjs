// TEST-P3-T01 — schimb de model/provider, ID lipsă, hash de persona veche și cartă personalizată:
// ID stabil și istoric păstrat; contract/schemă invalidă respinsă; 11 profiluri permanente.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { api, ROOT } from './lib.mjs';
import { loadContracts, validateRoleContract, syncProfiles, modelBinding, assertBindingAllowed, PERMANENT_IDS } from '../server/agents-runtime/registry.js';

const C = loadContracts(ROOT);
const agentsMap = over => Object.fromEntries(PERMANENT_IDS.map(id => [id, { id, name: id, persona: 'default ' + id, defaultPersona: 'default ' + id, model: 'sonnet', charter: '2', ...(over?.[id] || {}) }]));

test('P3-T01: 11 RoleContracts valide, cu intrări/ieșiri tipizate, instrumente și acțiuni interzise', () => {
  assert.deepEqual(C.errors, []); assert.equal(Object.keys(C.roles).length, 11);
  for (const id of PERMANENT_IDS) {
    const r = C.roles[id];
    assert.ok(r.inputs.length && typeof r.outputs === 'object' && r.toolAllowlist.length && r.forbiddenActions.length && r.evidenceObligations.length, id);
    assert.ok(r.forbiddenActions.some(f => /aprobarea propriei/.test(f)), `${id}: nu își aprobă propria lucrare`);
    assert.match(r.hash, /^[0-9a-f]{64}$/);
  }
  for (const s of ['adauga-etapa', 'blueprint-si-prompturi', 'ruleaza-teste', 'texte-pentru-editor']) {
    assert.equal(C.skills[s].sourceHash, crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, '.claude/skills', s, 'SKILL.md'))).digest('hex'), `${s}: importat cu hash`);
    assert.deepEqual(C.skills[s].owners, ['inginer']);
  }
  assert.ok(Object.values(C.skills).every(s => s.maturity === 'unproven'), 'nicio etichetă Senior/Principal fără dovezi');
});

test('P3-T01: contract invalid respins (câmp lipsă, instrument necunoscut, identitate nouă)', () => {
  const r = structuredClone(C.roles.scriitor); delete r.forbiddenActions;
  assert.ok(validateRoleContract(r).some(e => /forbiddenActions/.test(e)));
  assert.ok(validateRoleContract({ ...C.roles.scriitor, toolAllowlist: ['shell:any'] }).some(e => /instrument necunoscut/.test(e)));
  assert.ok(validateRoleContract({ ...C.roles.scriitor, id: 'agent-generic' }).some(e => /identitate necunoscută/.test(e)), 'nu se adaugă identități ad-hoc');
});

test('P3-T01: schimbarea modelului păstrează identitatea și istoricul; carta personalizată rămâne recuperabilă', () => {
  const t0 = 1_000_000;
  const first = syncProfiles(agentsMap(), C, {}, t0).profiles;
  assert.equal(Object.keys(first).length, 11);
  const swapped = syncProfiles(agentsMap({ scriitor: { model: 'gpt-6-sol' } }), C, first, t0 + 1).profiles.scriitor;
  assert.equal(swapped.id, 'scriitor'); assert.equal(swapped.createdAt, t0); assert.equal(swapped.modelBinding.provider, 'codex');
  assert.deepEqual(swapped.bindingHistory.map(b => b.model), ['sonnet', 'gpt-6-sol']); assert.equal(swapped.charterHistory.length, 1, 'carta nu se schimbă la schimbarea modelului');
  assert.deepEqual(swapped.maturity, first.scriitor.maturity, 'experiența/maturitatea nu se pierde');
  const custom = syncProfiles(agentsMap({ scriitor: { persona: 'Carta mea specială' } }), C, { scriitor: swapped }, t0 + 2).profiles.scriitor;
  const back = syncProfiles(agentsMap(), C, { scriitor: custom }, t0 + 3).profiles.scriitor;
  assert.deepEqual(back.charterHistory.map(h => h.source), ['default', 'custom', 'default']);
  assert.equal(back.charterHistory[1].text, 'Carta mea specială', 'textul cartei personalizate este recuperabil');
  assert.equal(back.charterHistory[0].personaHash, back.charterHistory[2].personaHash, 'hash-ul personei vechi rămâne identificabil');
});

test('P3-T01: legarea modelului respectă carta (Inginer doar Claude)', () => {
  assert.equal(modelBinding({ model: 'gpt-6-sol' }, C.roles.inginer).consistent, false);
  assert.throws(() => assertBindingAllowed(C.roles.inginer, 'gpt-6-sol'), e => e.code === 'charter_binding');
  assert.doesNotThrow(() => assertBindingAllowed(C.roles['director-creativ'], 'gpt-6-sol'));
});

test('P3-T01: ID de agent necunoscut nu mai cade pe Producător', async () => {
  const agents = await import('../server/agents.js'); const { LocalStorage } = await import('../server/storage/local.js');
  const dir = fs.mkdtempSync(path.join((await import('node:os')).tmpdir(), 'wp-ag-')); const s = new LocalStorage(dir); await s.init(); await agents.initAgents(s);
  assert.equal(agents.getAgent('agent-inexistent'), null);
  assert.throws(() => agents.requireAgent('agent-inexistent'), e => e.code === 'unknown_agent');
  assert.equal(agents.requireAgent('scriitor').id, 'scriitor');
  const { agentComplete } = await import('../server/engine.js');
  await assert.rejects(agentComplete('x', { agent: 'agent-inexistent' }), e => e.code === 'unknown_agent');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P3-T01 API: registrul, refuzul de schemă, carta Inginerului, istoricul la schimbarea modelului', async () => {
  let r = await api('GET', 'agents/registry'); assert.equal(r.status, 200);
  assert.equal(Object.keys(r.body.profiles).length, 11); assert.deepEqual(r.body.validation, []);
  const created = r.body.profiles.corector.createdAt;
  assert.equal((await api('PUT', 'agents/corector', { persona: 42 })).status, 400);
  const ing = await api('PUT', 'agents/inginer', { model: 'gpt-6-sol' }); assert.equal(ing.status, 409); assert.equal(ing.body.code, 'charter_binding');
  assert.equal((await api('PUT', 'agents/corector', { model: 'gpt-6-sol' })).status, 200);
  assert.equal((await api('PUT', 'agents/corector', { persona: 'Corector cu cartă proprie de test' })).status, 200);
  r = await api('GET', 'agents/registry'); const p = r.body.profiles.corector;
  assert.equal(p.createdAt, created, 'aceeași identitate'); assert.equal(p.modelBinding.model, 'gpt-6-sol');
  assert.equal(p.charterHistory.at(-1).text, 'Corector cu cartă proprie de test');
  await api('PUT', 'agents/corector', { persona: '', model: 'sonnet' });
  r = await api('GET', 'agents/registry'); assert.equal(r.body.profiles.corector.charterHistory.at(-1).source, 'default');
});
