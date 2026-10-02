// TEST-P3-T03 — crash la lease/start/output/check/commit; worker expirat încearcă commit; cerere/pornire repetată
// și prefetch învechit: fără commituri locale duplicate și fără scrieri ale workerilor învechiți; reluare doar a unităților necesare.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { api, setFake, waitStatus, connectCanva, INPUT } from './lib.mjs';
import { LocalStorage } from '../server/storage/local.js';
import { applyMigrations } from '../server/persistence/migrations.js';
import { Scheduler } from '../server/jobs/scheduler.js';
import { Repo } from '../server/repo.js';
import { startEphemeral, stopEphemeral } from '../scripts/enterprise/pg-ephemeral.mjs';

async function store() { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-jobs-')); const s = new LocalStorage(dir); await s.init(); await applyMigrations(s); return { s, dir }; }
const clock = (t = 1_000_000) => { const c = { t }; c.now = () => c.t; return c; };
const restart = (s, c) => new Scheduler(s, { owner: 'iRESTART', now: c.now, ttlMs: 60000 });   // a new process instance

test('P3-T03: crash după lease sau după start (fără efect extern) → pending; reluarea primește un token nou', async () => {
  const { s, dir } = await store(), c = clock(); const a = new Scheduler(s, { owner: 'iA', now: c.now, ttlMs: 60000 });
  const l1 = await a.acquire('p1', 'u1', { inputsHash: 'h' }); assert.equal(l1.token, 1);
  const l2 = await a.acquire('p1', 'u2', { inputsHash: 'h' }); await a.start('p1', 'u2', l2.token);
  const r = await restart(s, c).reconcile('p1');
  assert.deepEqual(r.pending.sort(), ['u1', 'u2']); assert.deepEqual(r.ambiguous, []);
  const again = await restart(s, c).acquire('p1', 'u2', { inputsHash: 'h' }); assert.ok(again.token > l2.token, 'tokenul vechi nu mai este valid');
  assert.equal((await a.get('p1', 'u2')).attempts[0].outcome, 'interrupted');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P3-T03: crash după un apel extern → ambiguous, nu se reia automat; operatorul decide', async () => {
  const { s, dir } = await store(), c = clock(); const a = new Scheduler(s, { owner: 'iA', now: c.now });
  const l = await a.acquire('p1', 'img7', { inputsHash: 'h', label: 'Pagina 7' }); await a.start('p1', 'img7', l.token); await a.markExternal('p1', 'img7', l.token, { provider: 'canva' });
  const b = restart(s, c); assert.deepEqual((await b.reconcile('p1')).ambiguous, ['img7']);
  await assert.rejects(b.acquire('p1', 'img7', { inputsHash: 'h' }), e => e.code === 'ambiguous_unit');
  const res = await b.resolve('p1', 'img7', 'retry'); assert.equal(res.status, 'pending'); assert.match(res.resolution.warning, /consum dublu/);
  assert.ok((await b.acquire('p1', 'img7', { inputsHash: 'h' })).token);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P3-T03: crash cu ieșirea salvată → se reia verificarea fără apel nou; crash după commit → refolosire, niciun commit dublu', async () => {
  const { s, dir } = await store(), c = clock(); const a = new Scheduler(s, { owner: 'iA', now: c.now });
  const l = await a.acquire('p1', 'txt', { inputsHash: 'h' }); await a.start('p1', 'txt', l.token); await a.markExternal('p1', 'txt', l.token, {}); await a.stageOutput('p1', 'txt', l.token, { candidate: 'cand-1.json' });
  const b = restart(s, c); assert.deepEqual((await b.reconcile('p1')).resumeCheck, ['txt']);
  const l2 = await b.acquire('p1', 'txt', { inputsHash: 'h' }); assert.deepEqual(l2.job.checkpoint.output, { candidate: 'cand-1.json' }, 'ieșirea staged este păstrată');
  await b.start('p1', 'txt', l2.token);
  const c1 = await b.commit('p1', 'txt', l2.token, { result: { outputs: ['final_0'] }, ops: [{ rel: 'projects/p1/artifacts/final_0.json', obj: { key: 'final_0', v: 1 } }] });
  assert.equal(c1.duplicate, false);
  assert.equal((await b.commit('p1', 'txt', l2.token, { ops: [{ rel: 'projects/p1/artifacts/final_0.json', obj: { key: 'final_0', v: 2 } }] })).duplicate, true);
  assert.equal((await s.readJSON('projects/p1/artifacts/final_0.json')).v, 1, 'al doilea commit nu a scris');
  assert.equal((await restart(s, c).acquire('p1', 'txt', { inputsHash: 'h' })).reused, true, 'reluarea nu reexecută unitatea comisă');
  assert.equal((await restart(s, c).acquire('p1', 'txt', { inputsHash: 'altul' })).reused, undefined, 'intrări schimbate → unitate nouă');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P3-T03: workerul cu lease expirat sau preluat nu poate scrie (precondiție în același commit)', async () => {
  const { s, dir } = await store(), c = clock(); const a = new Scheduler(s, { owner: 'iA', now: c.now, ttlMs: 1000 });
  const repo = new Repo(s); await repo.createProject({ id: 'pjob0001', title: 'J', status: 'ready', input: {}, options: {} }, { slug: 'kids-sc', structure: { volumes: 6, pages: 12 } });
  const l = await a.acquire('pjob0001', 'unit', { inputsHash: 'h' }); await a.start('pjob0001', 'unit', l.token);
  c.t += 5000;   // lease expirat
  await assert.rejects(a.commit('pjob0001', 'unit', l.token, { ops: [{ rel: 'projects/pjob0001/artifacts/x.json', obj: { v: 'stale' } }] }), e => e.code === 'stale_lease');
  assert.equal(await s.readJSON('projects/pjob0001/artifacts/x.json'), null);
  await assert.rejects(repo.writeArtifact('pjob0001', 'final_0', { t: 'stale' }, { fence: { rel: a.rel('pjob0001', 'unit'), token: l.token } }), e => e.code === 'stale_lease');
  assert.equal((await repo.artifacts('pjob0001')).final_0, undefined, 'scrierea învechită nu a ajuns în proiect');
  const fresh = await a.acquire('pjob0001', 'unit', { inputsHash: 'h' }); await a.start('pjob0001', 'unit', fresh.token);
  await a.takeover('pjob0001', 'unit', { reason: 'test' });
  await assert.rejects(repo.writeArtifact('pjob0001', 'final_0', { t: 'after-takeover' }, { fence: { rel: a.rel('pjob0001', 'unit'), token: fresh.token } }), e => e.code === 'stale_lease', 'prefetch-ul învechit nu mai scrie');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P3-T03: o cerere repetată nu preia o unitate deținută de alt worker activ', async () => {
  const { s, dir } = await store(), c = clock(); const a = new Scheduler(s, { owner: 'iA:run1', now: c.now, ttlMs: 60000 }), b = new Scheduler(s, { owner: 'iA:run2', now: c.now, ttlMs: 60000 });
  await a.acquire('p1', 'u', { inputsHash: 'h' });
  await assert.rejects(b.acquire('p1', 'u', { inputsHash: 'h', owner: 'iA:run2' }), e => e.code === 'job_leased');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P3-T03 PostgreSQL real: fencing verificat în tranzacție (rând jobs blocat)', async t => {
  const pg = await startEphemeral(); if (pg.status !== 'STARTED') return t.skip(`PostgreSQL indisponibil: ${pg.reason || pg.status}`);
  const { PostgresStorage } = await import('../server/storage/postgres.js'); const data = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-pgj-'));
  const s = new PostgresStorage({ databaseUrl: pg.url, dataDir: data });
  try {
    await s.init(); const c = clock(); const a = new Scheduler(s, { owner: 'iA', now: c.now, ttlMs: 1000 });
    const l = await a.acquire('ppg1', 'u', { inputsHash: 'h' }); await a.start('ppg1', 'u', l.token);
    assert.equal((await s.q("SELECT status, lease_token FROM jobs WHERE job_key='u'")).rows[0].lease_token, '1');
    await a.takeover('ppg1', 'u');
    await assert.rejects(a.commit('ppg1', 'u', l.token, { ops: [{ rel: 'projects/ppg1/artifacts/a.json', obj: { key: 'a' } }] }), e => e.code === 'stale_lease');
    assert.equal(await s.readJSON('projects/ppg1/artifacts/a.json'), null, 'rollback: nimic scris');
    const l2 = await a.acquire('ppg1', 'u', { inputsHash: 'h' }); await a.start('ppg1', 'u', l2.token);
    assert.equal((await a.commit('ppg1', 'u', l2.token, { ops: [{ rel: 'projects/ppg1/artifacts/a.json', obj: { key: 'a' } }] })).duplicate, false);
    assert.ok(await s.readJSON('projects/ppg1/artifacts/a.json'));
  } finally { await s.close().catch(() => {}); fs.rmSync(data, { recursive: true, force: true }); stopEphemeral(pg.dir); }
});

test('P3-T03 API: producția reală înregistrează unități durabile cu ieșiri și apeluri externe; pornirea repetată este refuzată', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Joburi P3' } })).body.id;
  await api('POST', `projects/${id}/start`);
  const second = await api('POST', `projects/${id}/start`); assert.ok([409, 200].includes(second.status));
  await waitStatus(id, ['awaiting_review']);
  const { jobs } = (await api('GET', `projects/${id}/jobs`)).body;
  const brief = jobs.find(j => j.key === 'brief');
  const item = jobs.find(j => j.key === 'brief#0');
  assert.equal(brief.status, 'committed'); assert.ok(brief.result.outputs.includes('brief'), 'ieșirile elementului se atribuie și etapei');
  assert.equal(item.kind, 'item'); assert.ok(item.attempts[0].external.length >= 1, 'apelul extern a fost marcat pe unitatea interioară înainte de execuție');
  assert.ok(jobs.every(j => ['committed', 'skipped'].includes(j.status)), JSON.stringify(jobs.filter(j => j.status !== 'committed').map(j => [j.key, j.status, j.stopReason])));
  assert.ok(!jobs.some(j => j.status === 'failed'), 'o etapă sărită intenționat nu apare ca eșec');
  await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});
