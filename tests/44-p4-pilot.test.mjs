// TEST-P4-T05 — trei premise învechite, opt divergențe de tip de întoarcere, p1 fără pietricică / p2 prima
// dezvăluire, p9 bot + acțiune; demo respins, apoi încercare de producție în volum: raport de conflicte cu schimbări
// rezolvabile de operator; producția în volum și V2–6 blocate; hash-urile textului și referințelor bune păstrate.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { api, setFake, waitStatus, connectCanva, approveAll, INPUT, project, ROOT } from './lib.mjs';
import { readZip } from '../server/security/safe-zip.js';
import { reconcileReport, applyReconcile } from '../server/migration/dw-reconcile.js';
import { pilotState, generationAllowed } from '../server/domain/pilot.js';

const DWZIP = fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip'));
const FILES = readZip(DWZIP), DOC = JSON.parse([...FILES].find(([k]) => k.endsWith('/project.json'))[1].toString());
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const post = (p, body) => api('POST', p, body, { headers: { 'content-type': 'application/octet-stream' } });

test('P4-T05 DW: trei premise învechite, opt divergențe de întoarcere și faptele p1/p2/p9, într-un raport fără modificări', () => {
  const before = JSON.stringify(DOC.artifacts), r = reconcileReport(DOC.artifacts);
  assert.equal(r.dryRun, true); assert.equal(JSON.stringify(DOC.artifacts), before, 'raportul nu modifică nimic');
  const dw01 = r.conflicts.find(c => c.id === 'DW01'); assert.equal(dw01.fields.length, 3);
  assert.deepEqual(dw01.fields.map(f => f.path), ['series.volumes[0].summary', 'series.volumes[0].story_bible.premise', 'script_0.story_bible.premise']);
  assert.ok(dw01.fields.every(f => /feresc de ploaie/.test(f.current) && /se adăpostesc împreună de ploaie/.test(f.proposed) && !/împreună se adăpostesc împreună/.test(f.proposed)));
  const dw02 = r.conflicts.find(c => c.id === 'DW02'); assert.equal(dw02.pages.length, 8); assert.ok(dw02.pages.every(p => p.plan === 'quiet' && p.script !== 'quiet'));
  for (const id of ['p1-pebble-absent', 'p2-first-reveal', 'p9-mouth-action']) assert.equal(r.facts.find(f => f.id === id).ok, true, id);
  assert.equal(r.preserved.pages.length, 12);
});

test('P4-T05 DW: aplicarea selectivă schimbă doar câmpurile alese; textul paginilor (EN/RO) rămâne identic', () => {
  const r = reconcileReport(DOC.artifacts);
  const keep = applyReconcile(DOC.artifacts, r, { DW01: 'keep' }); assert.deepEqual(Object.keys(keep.writes), [], '„păstrează” nu scrie nimic');
  const { writes, applied } = applyReconcile(DOC.artifacts, r, { DW01: 'align_to_pages', DW02: { 1: 'script', 5: 'script', 9: 'plan' } });
  assert.deepEqual(Object.keys(writes).sort(), ['script_0', 'series']); assert.equal(applied.filter(a => a.conflict === 'DW01').length, 3);
  assert.equal(writes.series.volumes[0].page_plan[0].turn.type, 'question'); assert.equal(writes.series.volumes[0].page_plan[8].turn.type, 'quiet', 'p9: operatorul a ales planul');
  for (const [i, p] of writes.script_0.pages.entries()) { assert.equal(sha(p.text), r.preserved.pages[i].sha256); assert.equal(sha(p.text_ro), r.preserved.pages[i].sha256_ro); }
  const strip = c => { const x = structuredClone(c); x.volumes.forEach(v => { delete v.summary; delete v.story_bible?.premise; v.page_plan?.forEach(pp => delete pp.turn); }); return JSON.stringify(x); };
  assert.equal(strip(writes.series), strip(DOC.artifacts.series.content), 'restul arcului este identic');
  assert.throws(() => applyReconcile(DOC.artifacts, r, { DW01: 'rescrie-tot' }), e => e.status === 400);
});

test('P4-T05: politica pilot — demo respins sau pilot nedecis blochează V2–6; porțile importate nu contează', () => {
  const plan = [{ key: 'review_collection', gate: true, vol: null }, { key: 'scripts@1', vol: 0 }, { key: 'review_1@1', gate: true, vol: 0 }, { key: 'illustrations@1', vol: 0 }, { key: 'review_2@1', gate: true, vol: 0 }, { key: 'scripts@2', vol: 1 }, { key: 'review_1@2', gate: true, vol: 1 }];
  const P = stages => ({ volumeFlow: true, stagePlan: plan, stages });
  let s = pilotState({}, P({})); assert.equal(s.pilotApproved, false); assert.deepEqual(s.blockedVolumes, [2]);
  assert.equal(generationAllowed({}, P({}), { key: 'scripts@2', vol: 1, handler: 'llm_json' }).code, 'pilot_required');
  assert.equal(generationAllowed({}, P({}), { key: 'scripts@1', vol: 0, handler: 'llm_json' }).allowed, true, 'volumul pilot se lucrează');
  s = pilotState({}, P({ 'review_1@1': { status: 'done' } })); assert.equal(s.demoApproved, true); assert.equal(s.pilotApproved, false);
  s = pilotState({}, P({ 'review_1@1': { status: 'done', imported: true }, 'review_2@1': { status: 'done', imported: true } })); assert.equal(s.pilotApproved, false, 'aprobările importate nu deblochează');
  s = pilotState({}, P({ 'review_1@1': { status: 'done' }, 'review_2@1': { status: 'done' } })); assert.equal(s.pilotApproved, true); assert.deepEqual(s.blockedVolumes, []);
  assert.equal(pilotState({ pilot: false }, P({})).pilotApproved, true); assert.equal(pilotState({}, { volumeFlow: false }).policy, 'none');
});

test('P4-T05 motor: o încercare de producție pentru volumul 2 înaintea pilotului se oprește fără niciun apel și fără artefact', async () => {
  const { LocalStorage } = await import('../server/storage/local.js'); const { applyMigrations } = await import('../server/persistence/migrations.js'); const { Repo } = await import('../server/repo.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-pilot-')); const s = new LocalStorage(dir); await s.init(); await applyMigrations(s); const repo = new Repo(s);
  for (const [m, f] of [['../server/agents.js', 'initAgents'], ['../server/governor.js', 'initGovernor'], ['../server/ledger.js', 'initLedger']]) await (await import(m))[f](s);
  const BP = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8'));
  const engine = await import('../server/engine.js'); engine.initEngine(repo, { status: () => ({ connected: false }) });
  const stages = engine.expandStages(BP), idx = stages.findIndex(x => x.key === 'scripts@2');
  await repo.createProject({ id: 'ppilot001', title: 'Pilot', status: 'paused', input: { ...INPUT, language: 'English', second_language: 'Romanian' }, options: { images: false }, volumeFlow: true, run: 1, stageIndex: idx, stages: { 'review_1@1': { status: 'done' } }, stagePlan: stages.map(x => ({ key: x.key, gate: x.handler === 'review_gate', vol: x.vol ?? null })), log: [] }, BP);
  engine.startProject('ppilot001');
  for (let i = 0; i < 100 && engine.RUNNING.ppilot001; i++) await new Promise(r => setTimeout(r, 50));
  const p = repo.getProject('ppilot001');
  assert.equal(p.status, 'paused'); assert.match(p.error || '', /blocate până aprobi pilotul/);
  assert.equal((await repo.artifacts('ppilot001')).script_1, undefined, 'nimic generat pentru volumul 2');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P4-T05 API: demo respins → V1 se reface și se oprește din nou la demo; V2–6 rămân blocate; aprobările nu sunt inventate', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Pilot P4' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']); await approveAll(id);
  let p = await waitStatus(id, ['awaiting_review']); assert.equal(p.gate.key, 'review_1'); assert.equal(p.gate.vol, 0);
  assert.equal((await api('POST', `projects/${id}/decide`, { decision: 'rejected', note: 'Stilul demo nu e bun', restart: 'phase' })).status, 200);
  if (!(await api('GET', `projects/${id}`)).body.project.running) await api('POST', `projects/${id}/start`);
  p = await waitStatus(id, ['awaiting_review']); assert.equal(p.gate.key, 'review_1'); assert.equal(p.gate.vol, 0, 'după respingere se revine la demo, nu se trece la volum');
  const pl = (await api('GET', `projects/${id}/pilot`)).body; assert.equal(pl.pilotApproved, false); assert.deepEqual(pl.blockedVolumes, [2, 3, 4, 5, 6]);
  const d = await project(id); assert.ok(!Object.keys(d.artifacts).some(k => /^(script|final|ill)_[1-5]\b/.test(k)), 'nimic pentru V2–6');
  await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});

test('P4-T05 API (DW migrat): raport, decizie legată de raport, schimbare selectivă, aprobări pending, V2–6 blocate', async () => {
  const plan = await post('migrations/plan', DWZIP); assert.equal(plan.status, 200);
  const run = await post(`migrations/run?plan=${plan.body.planHash}`, DWZIP); const pid = run.body.projectId; assert.ok(pid);
  const r = (await api('GET', `projects/${pid}/reconcile`)).body; assert.equal(r.conflicts.length, 2);
  assert.equal((await api('POST', `projects/${pid}/reconcile/apply`, { reportHash: 'vechi', choices: { DW01: 'align_to_pages' } })).status, 409, 'decizia este legată de raportul văzut');
  const ap = await api('POST', `projects/${pid}/reconcile/apply`, { reportHash: r.hash, choices: { DW01: 'align_to_pages', DW02: 'script' }, note: 'aliniez premisa și întoarcerile' });
  assert.equal(ap.status, 200, JSON.stringify(ap.body)); assert.equal(ap.body.after.conflicts.length, 0, 'conflictele alese sunt rezolvate');
  const d = await project(pid);
  for (const [i, pg] of d.artifacts.script_0.content.pages.entries()) assert.equal(sha(pg.text), r.preserved.pages[i].sha256, 'textul paginilor este identic');
  assert.deepEqual(d.project.approvals || {}, {}, 'nicio aprobare inventată'); assert.ok(['ready', 'archived'].includes(d.project.status), 'nepornit (migrarea e idempotentă per sursă; P2-T05 îl poate fi arhivat)');
  const dec = (await api('GET', `projects/${pid}/decisions`)).body.decisions.find(x => x.kind === 'reconcile'); assert.ok(dec && dec.subject.applied.length >= 11);
  const pl = (await api('GET', `projects/${pid}/pilot`)).body; assert.equal(pl.pilotApproved, false); assert.deepEqual(pl.blockedVolumes, [2, 3, 4, 5, 6]);
  const browser = process.env.BROWSER_PATH;
  if (browser && fs.existsSync(browser)) {
    const { evalInPage } = await import('./cdp.mjs');
    assert.equal(await evalInPage(browser, `${process.env.WP_BASE}/#/p/${pid}/progress`, `document.getElementById('pilot-state')?.dataset.approved || null`), 'false', 'starea pilotului este vizibilă');
    assert.equal(await evalInPage(browser, `${process.env.WP_BASE}/#/p/${pid}/activity`, `document.getElementById('reconcile')?.dataset.conflicts || null`), '0', 'panoul de reconciliere arată conflictele rămase');
  }
  for (const ref of DOC.project.refs) { const raw = [...FILES].find(([k]) => k.endsWith(ref.file))[1]; const got = await api('GET', `/files/${pid}/${ref.file}`, undefined, { raw: true }); assert.equal(sha(Buffer.from(await got.arrayBuffer())), sha(raw), 'referința originală identică'); }
  await api('POST', `projects/${pid}/archive`, { archived: true });
});
