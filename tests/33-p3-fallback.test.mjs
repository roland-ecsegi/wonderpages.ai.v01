// TEST-P3-T04 — ambii furnizori limitați, răspuns pierdut după acceptare, alt client scrie cea mai nouă imagine,
// buget de reîncercări epuizat și anulare: fără buclă/ping-pong, ieșirea ambiguă nu este atribuită, buget și termen comune.
import './loader.mjs';   // Codex/MCP simulate și în procesul de test (fără CLI real)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setFake } from './lib.mjs';
import { ExecutionBudget } from '../server/jobs/budget.js';

const events = who => { try { return fs.readFileSync(process.env.WP_FAKE_STATE + `.${who}.log`, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse); } catch { return []; } };
async function engineWith(canvaStub) {
  const { LocalStorage } = await import('../server/storage/local.js'); const { applyMigrations } = await import('../server/persistence/migrations.js'); const { Repo } = await import('../server/repo.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-fb-')); const s = new LocalStorage(dir); await s.init(); await applyMigrations(s); const repo = new Repo(s);
  await repo.createProject({ id: 'pfallback1', title: 'F', status: 'running', input: {}, options: { image_fallback: true }, log: [] }, { slug: 'kids-sc', structure: { volumes: 6, pages: 12 } });
  for (const [m, f] of [['../server/agents.js', 'initAgents'], ['../server/governor.js', 'initGovernor'], ['../server/ledger.js', 'initLedger']]) await (await import(m))[f](s);   // modulele cu persistență întârziată au stocare
  const engine = await import('../server/engine.js'); engine.initEngine(repo, canvaStub);
  const E = { pid: 'pfallback1', project: repo.getProject('pfallback1'), ctl: new AbortController(), curStage: {}, art: {} };
  return { engine, E, dir };
}

test('P3-T04: bugetul comun — un singur hop, reîncercări limitate, termen global', () => {
  const b = new ExecutionBudget({ deadlineMs: 1000, now: () => 0 });
  assert.equal(b.consume('providerHop'), 1);
  assert.throws(() => b.consume('providerHop'), e => e.code === 'budget_exhausted');
  b.consume('transportRetry'); b.consume('transportRetry'); assert.throws(() => b.consume('transportRetry'), e => e.code === 'budget_exhausted' && e.kind === 'transportRetry');
  assert.throws(() => b.assertCanWaitUntil(5000, 'canva'), e => e.code === 'rate_limited');
});

test('P3-T04: ambii furnizori limitați → un hop, apoi așteptare durabilă; fără ping-pong și fără resetarea ceasului', async () => {
  setFake({ codex: 'pause', pauseTimes: 99 });
  const canvaCalls = []; const stub = { status: () => ({ connected: true }), generate: async () => { canvaCalls.push(1); throw { code: 'canva_pause', message: 'Rate limit' }; } };
  const { engine, E, dir } = await engineWith(stub);
  const gov = await import('../server/governor.js'); gov.canvaCfg.pauseMin = 0;
  const c0 = events('codex').filter(x => x.kind === 'image').length;
  const budget = new ExecutionBudget({ deadlineMs: 0 });
  await assert.rejects(engine._callImage(E, { prompt: 'p', aspectRatio: 'SQUARE_1_1', references: [], provider: 'chatgpt' }, 'Pagina 1', budget), e => e.code === 'rate_limited');
  assert.equal(events('codex').filter(x => x.kind === 'image').length - c0, 1, 'ChatGPT întrebat o singură dată');
  assert.equal(canvaCalls.length, 1, 'Canva întrebat o singură dată după hop');
  assert.equal(budget.used.providerHop, 1, 'hop-ul consumat din același buget');
  setFake({}); fs.rmSync(dir, { recursive: true, force: true });
});

test('P3-T04: răspuns pierdut după acceptare → ambiguous cu providerJobId; reluarea face lookup, nu generare nouă', async () => {
  const { Canva } = await import('../server/canva.js');
  const accepted = [], calls = [];
  const lost = Object.assign(Object.create(Canva.prototype), { call: async name => { calls.push(name); if (name === 'generate-image') return { content: [{ type: 'text', text: JSON.stringify({ job: { jobId: 'JOB-1', status: 'IN_PROGRESS' } }) }] }; throw new Error('socket hang up'); } });
  await assert.rejects(lost.generate({ prompt: 'p', onAccepted: id => accepted.push(id) }), e => e.code === 'ambiguous_output' && e.providerJobId === 'JOB-1');
  assert.deepEqual(accepted, ['JOB-1'], 'jobul acceptat a fost înregistrat înainte de polling');
  const PNG = (await import('./mocks/png.cjs')).default;
  const resumed = Object.assign(Object.create(Canva.prototype), { call: async name => { calls.push('resume:' + name); return { structuredContent: { status: 'SUCCESS' }, content: [{ type: 'image', data: PNG.colour(2).toString('base64'), mimeType: 'image/png' }] }; } });
  const img = await resumed.generate({ prompt: 'p', resumeJobId: 'JOB-1' });
  assert.ok(img.buffer?.length > 0); assert.ok(!calls.includes('resume:generate-image'), 'nicio generare nouă la reluare');
});

test('P3-T04: alt client scrie o imagine nouă în același folder → ieșirea nu este atribuită; un singur candidat → atribuit și deținut', async () => {
  const GPT = await import('../server/codeximage.js');
  setFake({ codexForeignImage: true });
  await assert.rejects(GPT.generate({ prompt: 'A robot', aspectRatio: 'SQUARE_1_1' }), e => e.code === 'ambiguous_output' && e.candidates === 2);
  setFake({});
  const ok = await GPT.generate({ prompt: 'A robot', aspectRatio: 'SQUARE_1_1' });
  assert.equal(ok.owned, true); assert.match(ok.requestId, /^wp-/); assert.ok(ok.buffer.length > 0);
});

test('P3-T04: anularea întrerupe așteptarea furnizorului imediat', async () => {
  setFake({ codex: 'pause', pauseTimes: 99 });
  const { engine, E, dir } = await engineWith({ status: () => ({ connected: false }), generate: async () => { throw { code: 'canva_pause' }; } });
  const gov = await import('../server/governor.js'); gov.canvaCfg.pauseMin = 1;
  const p = engine._callImage(E, { prompt: 'p', aspectRatio: 'SQUARE_1_1', provider: 'chatgpt' }, 'Pagina 2', new ExecutionBudget({ deadlineMs: 60 * 60e3 }));
  setTimeout(() => E.ctl.abort(), 300);
  const t0 = Date.now(); await assert.rejects(p, e => e.code === 'stopped'); assert.ok(Date.now() - t0 < 10000);
  setFake({}); fs.rmSync(dir, { recursive: true, force: true });
});
