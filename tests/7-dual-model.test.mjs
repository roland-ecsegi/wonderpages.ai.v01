import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { api, setFake, waitStatus, connectCanva, INPUT } from './lib.mjs';

const events = who => { try { return fs.readFileSync(process.env.WP_FAKE_STATE + `.${who}.log`, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse); } catch { return []; } };

test('agenții aleg separat Claude sau GPT-6 Sol medium, fără chei API', async () => {
  setFake({});
  if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva();
  const c0 = events('codex').length, a0 = events('claude').length;
  const u0 = (await api('GET', 'state')).body.usage;
  assert.equal((await api('PUT', 'agents/director-creativ', { model: 'gpt-6-sol' })).status, 200);
  assert.equal((await api('PUT', 'agents/asistent', { model: 'gpt-6-sol' })).status, 200);
  assert.equal((await api('PUT', 'agents/arhitect-serie', { model: 'sonnet' })).status, 200);
  assert.equal((await api('PUT', 'agents/scriitor', { model: 'not-a-model' })).status, 200);
  const agents = (await api('GET', 'agents')).body.agents;
  assert.equal(agents.find(a => a.id === 'director-creativ').model, 'gpt-6-sol');
  assert.equal(agents.find(a => a.id === 'arhitect-serie').model, 'sonnet');

  const probe = await api('POST', 'chatgpt/text-test');
  assert.deepEqual(probe.body, { ok: true, reply: '{"ok":"OK"}' });

  const dali = await api('POST', 'assistant', { sid: null, message: 'Bună', context: { route: '#/agents' } });
  assert.equal(dali.status, 200, JSON.stringify(dali.body));
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Test mixt Claude GPT' } })).body.id;
  await api('POST', `projects/${id}/start`);
  await waitStatus(id, ['awaiting_review']);
  const codex = events('codex').slice(c0).filter(x => x.kind === 'text');
  const claude = events('claude').slice(a0);
  assert.ok(codex.length >= 2, 'Dali și Directorul creativ au folosit Codex');
  assert.ok(claude.length >= 1, 'ceilalți agenți au folosit Claude');
  assert.ok(codex.every(x => x.model === 'gpt-6-sol' && x.reasoning === 'model_reasoning_effort=medium' && !x.apiKeyInEnv));
  const usage = (await api('GET', 'state')).body.usage;
  assert.ok(usage.gptText5h > u0.gptText5h);
  assert.ok(usage.text5h > u0.text5h);
  await api('POST', `projects/${id}/stop`);
});

test('limita Codex se raportează separat și nu trece în tăcere la Claude', async () => {
  setFake({ codex: 'ratelimit' });
  const before = events('claude').length;
  const r = await api('POST', 'assistant', { sid: null, message: 'Salut', context: { route: '#/agents' } });
  assert.equal(r.status, 503);
  assert.match(r.body.message, /Codex/);
  assert.equal(events('claude').length, before);
  setFake({});
});
