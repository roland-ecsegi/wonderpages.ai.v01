// TEST-P3-T05 — instrument eliminat/schimbat, referințe de imagine nesuportate, login refuzat și rezultat manual
// valid/invalid/cu hash învechit: capabilitatea se verifică la execuție; schimbul manual folosește aceleași validări,
// proveniența „operator-exchange” și nu atinge aprobările.
import './loader.mjs';   // Codex/MCP simulate și în procesul de test (fără CLI real)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { api, setFake, INPUT } from './lib.mjs';

const BRIEF = { collection_title: 'Dino Meadow', logline: 'A warm series about curiosity.', tone: 'cald', core_values: ['prietenie'], educational_goals: ['culori'], narrative_rules: ['fără pericol'], visual_direction: 'soft 3D', avoid: ['violență'] };
const mem = () => { const m = new Map(); return { readJSON: async (k, d = null) => (m.has(k) ? structuredClone(m.get(k)) : d), writeJSON: async (k, v) => { m.set(k, structuredClone(v)); } }; };
const canvaObs = inputs => async () => ({ installed: true, auth: true, tools: ['generate-image', 'get-generate-image-job'], toolInputs: { 'generate-image': inputs, 'get-generate-image-job': ['job_id'] }, toolSchemaHash: inputs.join(',') });
async function registryWith(probes) { const R = await import('../server/providers/registry.js'); await R.initCapabilities(mem(), probes); await R.runDiscovery(); return R; }
const OK_CODEX = async () => ({ installed: true, version: '1', auth: true, quota: { status: 'ok', provenance: 'provider' } });

test('P3-T05: instrument eliminat sau schemă schimbată → canalul este refuzat la execuție (nu la pornire)', async () => {
  let R = await registryWith({ canva: async () => ({ installed: true, auth: true, tools: ['get-generate-image-job'], toolInputs: {}, toolSchemaHash: 'x' }) });
  assert.throws(() => R.assertExecutable('canva-mcp'), e => e.code === 'capability_limited' && /Instrumente lipsă/.test(e.message));
  R = await registryWith({ canva: canvaObs(['prompt', 'aspectRatio', 'imageReferences']) });
  assert.equal(R.assertExecutable('canva-mcp', { needsRefs: true }).checked, true);
  // a doua descoperire cu altă schemă decât cea memorată → renegociere necesară
  const store = mem(); await R.initCapabilities(store, { canva: canvaObs(['prompt', 'aspectRatio', 'imageReferences']) }); await R.runDiscovery();
  await R.initCapabilities(store, { canva: canvaObs(['prompt', 'aspectRatio', 'imageReferences', 'brand']) }); await R.runDiscovery();
  assert.throws(() => R.assertExecutable('canva-mcp'), e => e.code === 'capability_limited' && /Schema instrumentelor/.test(e.message));
});

test('P3-T05: referințe de imagine nesuportate → refuz explicit cu referințe; fără referințe canalul rămâne utilizabil', async () => {
  const R = await registryWith({ canva: canvaObs(['prompt', 'aspectRatio', 'extra']) });
  assert.throws(() => R.assertExecutable('canva-mcp', { needsRefs: true }), e => e.code === 'capability_limited' && e.reason === 'refs_unsupported');
  assert.equal(R.assertExecutable('canva-mcp', { needsRefs: false }).checked, true);
  // în motor: generarea cu referințe nu ajunge la furnizor (nicio cheltuială), identitatea nu se pierde în tăcere
  const { LocalStorage } = await import('../server/storage/local.js'); const { applyMigrations } = await import('../server/persistence/migrations.js'); const { Repo } = await import('../server/repo.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-ex-')); const st = new LocalStorage(dir); await st.init(); await applyMigrations(st); const repo = new Repo(st);
  await repo.createProject({ id: 'pexchange1', title: 'X', status: 'running', input: {}, options: {}, log: [] }, { slug: 'kids-sc', structure: { volumes: 6, pages: 12 } });
  for (const [m, f] of [['../server/agents.js', 'initAgents'], ['../server/governor.js', 'initGovernor'], ['../server/ledger.js', 'initLedger']]) await (await import(m))[f](st);
  const calls = []; const engine = await import('../server/engine.js'); engine.initEngine(repo, { status: () => ({ connected: true }), generate: async () => { calls.push(1); throw Error('nu trebuia apelat'); } });
  const E = { pid: 'pexchange1', project: repo.getProject('pexchange1'), ctl: new AbortController(), curStage: {}, art: {} };
  await assert.rejects(engine._callImage(E, { prompt: 'p', aspectRatio: 'SQUARE_1_1', references: [{ file: 'refs/a.png' }], provider: 'canva' }, 'Pagina 1'), e => e.code === 'capability_limited' && e.reason === 'refs_unsupported');
  assert.equal(calls.length, 0, 'furnizorul nu a fost apelat');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P3-T05: login refuzat → indisponibil; cotă limitată → așteptare durabilă; descoperire veche sau absentă nu blochează', async () => {
  let R = await registryWith({ codexText: async () => ({ installed: true, version: '1', auth: false }) });
  assert.throws(() => R.assertExecutable('codex-text'), e => e.code === 'capability_unavailable' && e.status === 409);
  R = await registryWith({ codexText: async () => ({ installed: true, version: '1', auth: true, quota: { status: 'limited', provenance: 'provider', resetAt: Date.now() + 60e3 } }) });
  assert.throws(() => R.assertExecutable('codex-text'), e => e.code === 'rate_limited' && e.resetAt > Date.now());
  R = await registryWith({ codexText: OK_CODEX }); assert.equal(R.assertExecutable('codex-text').checked, true);
  await R.initCapabilities(mem(), {}); assert.equal(R.assertExecutable('codex-text').checked, false, 'fără descoperire: unknown, nu blochează');
});

test('P3-T05 API: login ChatGPT refuzat este raportat de descoperire ca indisponibil, cu alternativa manuală', async () => {
  setFake({ codex: 'noauth' });
  const r = await api('POST', 'capabilities/discover');
  assert.equal(r.body.channels['codex-text'].status, 'unavailable'); assert.equal(r.body.channels['codex-text'].decision, 'operator-assisted');
  setFake({}); await api('POST', 'capabilities/discover');
});

test('P3-T05 API: pachet text — ZIP complet; rezultat invalid respins; valid importat cu proveniență; refolosire și hash învechit refuzate', async () => {
  setFake({});
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Schimb manual' } })).body.id;
  const pk = await api('POST', `projects/${id}/packets`, { kind: 'text', stageKey: 'brief' });
  assert.equal(pk.status, 200, JSON.stringify(pk.body)); assert.match(pk.body.id, /^wp/); assert.equal(pk.body.outKey, 'brief'); assert.ok(pk.body.inputsHash);
  assert.equal((await api('POST', `projects/${id}/packets`, { kind: 'text', stageKey: 'anchors' })).status, 400, 'etapele cu imagini/elemente multiple nu au pachet text');
  const zr = await api('GET', `projects/${id}/packets/${pk.body.id}/download`, undefined, { raw: true }); assert.equal(zr.status, 200);
  const { readZip } = await import('../server/security/safe-zip.js'); const entries = [...readZip(Buffer.from(await zr.arrayBuffer())).entries()].map(([name, data]) => ({ name, data }));
  const names = entries.map(e => e.name.replace(/^[^/]+\//, ''));
  for (const n of ['prompt.md', 'schema.json', 'RETURN.md', 'manifest.json']) assert.ok(names.includes(n), n + ' lipsește: ' + names);
  const manifest = JSON.parse(entries.find(e => e.name.endsWith('manifest.json')).data.toString('utf8')); assert.equal(manifest.inputsHash, pk.body.inputsHash);
  assert.ok(manifest.files.every(f => /^[0-9a-f]{64}$/.test(f.sha256)));
  let r = await api('POST', `projects/${id}/packets/${pk.body.id}/result`, { text: 'nu e json' }); assert.equal(r.status, 400); assert.equal(r.body.code, 'invalid_output');
  r = await api('POST', `projects/${id}/packets/${pk.body.id}/result`, { text: JSON.stringify({ logline: 'doar atât' }) }); assert.equal(r.status, 400); assert.equal(r.body.code, 'invalid_output', JSON.stringify(r.body));
  r = await api('POST', `projects/${id}/packets/${pk.body.id}/result`, { text: 'Iată:\n```json\n' + JSON.stringify(BRIEF) + '\n```' }); assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.artifact, 'brief');
  const p = (await api('GET', `projects/${id}`)).body;
  assert.equal(p.artifacts.brief.meta.prov.channel, 'operator-exchange'); assert.equal(p.artifacts.brief.meta.prov.packetId, pk.body.id); assert.equal(p.artifacts.brief.by, 'operator-exchange');
  assert.equal(p.project.stages.brief.manual, true); assert.ok(!p.project.gate || p.project.gate !== 'approved', 'nicio aprobare implicită');
  assert.equal((await api('POST', `projects/${id}/packets/${pk.body.id}/result`, { text: JSON.stringify(BRIEF) })).body.code, 'packet_used');
  const list = (await api('GET', `projects/${id}/packets`)).body.packets; const used = list.find(x => x.id === pk.body.id);
  assert.equal(used.status, 'ingested'); assert.equal(used.attempts.filter(a => !a.ok).length, 2, 'încercările respinse sunt păstrate'); assert.equal(used.prompt, undefined);
  // hash învechit: pachet pentru „series” emis, apoi brief-ul se schimbă → refuz
  const s = await api('POST', `projects/${id}/packets`, { kind: 'text', stageKey: 'series' }); assert.equal(s.status, 200);
  assert.equal((await api('POST', `projects/${id}/artifacts/brief`, { content: { ...BRIEF, tone: 'jucăuș' }, note: 'editare' })).status, 200);
  r = await api('POST', `projects/${id}/packets/${s.body.id}/result`, { text: '{}' }); assert.equal(r.status, 409); assert.equal(r.body.code, 'stale_packet');
  await api('POST', `projects/${id}/archive`, { archived: true });
});

test('P3-T05 API: pachet imagine — fișier non-imagine, rezoluție/raport greșit respinse; PNG corect intră cu QA obligatoriu', async () => {
  const PNG = (await import('./mocks/png.cjs')).default;
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Imagine manuală' } })).body.id;
  const pk = await api('POST', `projects/${id}/packets`, { kind: 'image', v: 0, p: 1 }); assert.equal(pk.status, 200, JSON.stringify(pk.body));
  assert.equal(pk.body.minShortSide, 1024); assert.ok(pk.body.aspect > 0.7 && pk.body.aspect < 0.9, 'portret 4:5');
  let r = await api('POST', `projects/${id}/packets/${pk.body.id}/result`, { imageBase64: Buffer.from('not an image').toString('base64') }); assert.equal(r.status, 400); assert.equal(r.body.code, 'invalid_output');
  r = await api('POST', `projects/${id}/packets/${pk.body.id}/result`, { imageBase64: PNG.colour(2).toString('base64') }); assert.equal(r.status, 400); assert.match(r.body.message, /latura scurtă/);
  const w = 1024, h = Math.round(1024 / pk.body.aspect);
  r = await api('POST', `projects/${id}/packets/${pk.body.id}/result`, { imageBase64: PNG.colour(3, h, w).toString('base64') }); assert.equal(r.status, 400, 'raport inversat'); assert.match(r.body.message, /Raportul/);
  const good = PNG.colour(3, w, h);
  r = await api('POST', `projects/${id}/packets/${pk.body.id}/result`, good, { headers: { 'content-type': 'image/png' } });
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.qa, 'required'); assert.equal(r.body.artifact, 'ill_0_1');
  const a = (await api('GET', `projects/${id}`)).body.artifacts.ill_0_1;
  assert.equal(a.content.provider, 'operator-exchange'); assert.equal(a.meta.prov.channel, 'operator-exchange'); assert.deepEqual(a.meta.prov.pixels, [w, h]);
  await api('POST', `projects/${id}/archive`, { archived: true });
});
