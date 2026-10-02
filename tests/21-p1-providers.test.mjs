// TEST-P1-T03 — discovery de provideri: auth null, model indisponibil, cotă necunoscută, schemă de instrumente schimbată;
// „unknown” nu este verde; fiecare canal are supported / operator-assisted / unavailable, dovezi și expirare.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api, setFake, connectCanva } from './lib.mjs';
import { buildSnapshot, effective, TTL } from '../server/providers/capabilities.js';

const NOW = 1_800_000_000_000;
const okProbe = { ok: true, at: NOW - 1000 };

test('P1-T03: auth null → unknown, niciodată verde', () => {
  const s = buildSnapshot('claude-code-text', { installed: true, version: '2.1', auth: null }, NOW);
  assert.equal(s.status, 'unknown'); assert.equal(s.green, false); assert.equal(s.decision, 'operator-assisted');
  assert.ok(s.expiresAt > s.checkedAt && s.reasons.length);
});

test('P1-T03: neinstalat sau cheie API → unavailable, cu alternativă manuală', () => {
  assert.equal(buildSnapshot('codex-text', { installed: false }, NOW).status, 'unavailable');
  const k = buildSnapshot('codex-text', { installed: true, auth: 'apikey', quota: { status: 'ok' }, realProbe: okProbe }, NOW);
  assert.equal(k.status, 'unavailable'); assert.equal(k.decision, 'operator-assisted'); assert.match(k.reasons.join(' '), /cheie API/);
});

test('P1-T03: model indisponibil și cotă limitată → limited; cotă necunoscută → unknown chiar cu probă', () => {
  assert.equal(buildSnapshot('codex-text', { installed: true, auth: true, quota: { status: 'ok' }, models: { unavailable: ['gpt-6-sol'] }, realProbe: okProbe }, NOW).status, 'limited');
  assert.equal(buildSnapshot('codex-text', { installed: true, auth: true, quota: { status: 'limited', resetAt: NOW + 3600e3 }, realProbe: okProbe }, NOW).status, 'limited');
  const q = buildSnapshot('codex-text', { installed: true, auth: true, quota: { status: 'unknown' }, realProbe: okProbe }, NOW);
  assert.equal(q.status, 'unknown'); assert.equal(q.green, false);
});

test('P1-T03: schema instrumentelor Canva schimbată sau instrument lipsă → limited', () => {
  const base = { installed: true, auth: true, tools: ['generate-image', 'get-generate-image-job'], quota: { status: 'ok' }, realProbe: okProbe };
  assert.equal(buildSnapshot('canva-mcp', { ...base, toolSchemaHash: 'a', expectedToolSchemaHash: 'a' }, NOW).status, 'supported');
  assert.equal(buildSnapshot('canva-mcp', { ...base, toolSchemaHash: 'b', expectedToolSchemaHash: 'a' }, NOW).status, 'limited');
  assert.equal(buildSnapshot('canva-mcp', { ...base, tools: ['get-generate-image-job'] }, NOW).status, 'limited');
});

test('P1-T03: supported numai cu probă reală recentă + cotă verificată; expirarea îl coboară la unknown', () => {
  const s = buildSnapshot('codex-text', { installed: true, auth: true, quota: { status: 'ok', provenance: 'provider' }, realProbe: okProbe }, NOW);
  assert.equal(s.status, 'supported'); assert.equal(s.green, true);
  assert.equal(buildSnapshot('codex-text', { installed: true, auth: true, quota: { status: 'ok' } }, NOW).status, 'unknown', 'fără probă reală nu este verificat');
  assert.equal(buildSnapshot('codex-text', { installed: true, auth: true, quota: { status: 'ok' }, realProbe: { ok: true, at: NOW - TTL.probe - 1 } }, NOW).status, 'unknown', 'proba veche nu contează');
  const stale = effective(s, s.expiresAt + 1);
  assert.equal(stale.status, 'unknown'); assert.equal(stale.green, false); assert.equal(stale.stale, true);
  assert.equal(buildSnapshot('operator-exchange', {}, NOW).status, 'operator-assisted');
});

test('P1-T03 API: discovery read-only; proba reală inițiată de operator face canalul verificat', async () => {
  setFake({}); await connectCanva().catch(() => null);   // în suita completă Canva poate fi deja conectat
  const before = await api('GET', 'capabilities');
  assert.equal(before.status, 200); assert.ok(before.body.host.cpus >= 1 && before.body.host.envelope.activeProjects === 1);
  let r = await api('POST', 'capabilities/discover'); assert.equal(r.status, 200);
  for (const [k, s] of Object.entries(r.body.channels)) { assert.ok(s.checkedAt && s.expiresAt, k); assert.ok(['supported', 'limited', 'unknown', 'unavailable', 'operator-assisted'].includes(s.status), k); }
  assert.notEqual(r.body.channels['codex-text'].status, 'supported', 'fără probă reală nu este verde');
  assert.equal(r.body.channels['codex-text'].quota.status, 'ok'); assert.equal(r.body.channels['codex-text'].quota.provenance, 'provider');
  assert.ok(r.body.channels['canva-mcp'].tools?.includes('generate-image'), JSON.stringify(r.body.probeErrors || r.body));
  const t = await api('POST', 'chatgpt/text-test'); assert.equal(t.status, 200);
  r = await api('POST', 'capabilities/discover');
  assert.equal(r.body.channels['codex-text'].status, 'supported'); assert.equal(r.body.channels['codex-text'].states.verified, true);
  setFake({ canvaToolsDrop: ['generate-image'] });
  r = await api('POST', 'capabilities/discover'); assert.equal(r.body.channels['canva-mcp'].status, 'limited');
  setFake({ codex: 'ratelimit' });
  r = await api('POST', 'capabilities/discover'); assert.equal(r.body.channels['codex-text'].status, 'limited');
  setFake({});
});
