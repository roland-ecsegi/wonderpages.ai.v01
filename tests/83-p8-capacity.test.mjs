// TEST-P8-T04 — timpi de coadă/memorie/disc/DB, admitere cu spațiu puțin, imagini lente cu pregătirea textului și
// concurență Dali/atelier: raport p50/p95/amprentă/plic de capacitate; țintele API citire < 1 s / scriere < 2 s verificate;
// niciun debit AI real inventat (furnizori simulați).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { api, setFake, project, waitStatus, waitFor, connectCanva, approveAll, INPUT } from './lib.mjs';
import { runDataset, TARGETS, dwSizing } from '../scripts/enterprise/capacity-bench.mjs';
import { admissionCheck, setMinFreeMb, minFreeMb } from '../server/ops/admission.js';

const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil(p / 100 * s.length) - 1)]; };
const timedGet = async p => { const t = performance.now(); const r = await api('GET', p); assert.equal(r.status, 200, p); return performance.now() - t; };

test('P8-T04: benchmark pe un set declarat (local): p50/p95, scrieri comise, evenimentul UI, concurența Dali, blocarea de backup, amprentă și reținerea backupurilor', async () => {
  const r = await runDataset({ archived: 2, assetKb: 4, reads: 15, writes: 8, concurrency: 4 });
  assert.equal(r.ok, true, JSON.stringify(r.verdict));
  for (const k of ['state', 'activeProject', 'archivedProject', 'jobs', 'learning', 'health', 'ledger']) { assert.ok(r.reads[k].p95 < TARGETS.readP95Ms, k); assert.ok(r.reads[k].p50 <= r.reads[k].p95); }
  assert.ok(r.writes.p95 < TARGETS.writeP95Ms && r.commitWrites.p95 < TARGETS.writeP95Ms); assert.equal(r.eventMissed, 0); assert.ok(r.eventMs.p95 <= TARGETS.eventMs);
  assert.ok(r.daliCalls > 0 && r.readsUnderContention.p95 < TARGETS.readP95Ms, 'citirile rămân sub țintă cât Dali răspunde în paralel');
  assert.equal(r.layoutStatus, 200); assert.ok(r.layoutPlan.p95 > 0);
  assert.equal(r.backupLockIncremental.status, 200); assert.ok(r.backupLockIncremental.linked > 0, 'al doilea backup este incremental');
  assert.equal(r.backupLock.status, 200); assert.ok(r.backupLock.lockMs >= 0 && r.backupLock.writesTried >= 1, 'durata blocării la backup este măsurată');
  assert.ok(r.diskMb > 0 && r.footprintMbPerProject > 0 && r.backupRetentionMb >= r.diskMb * 14 - 1);
  if (process.platform === 'linux') assert.ok(r.rssMb > 0 && r.peakRssMb >= r.rssMb);
  const dw = dwSizing(); assert.ok(dw.referenceArchiveMb > 1); assert.match(dw.note, /nu este măsurată/);
});

test('P8-T04: admitere cu spațiu puțin — pornirea refuzată cu mesaj clar, sănătatea „degraded”, producția în curs se oprește înaintea etapei următoare', async () => {
  const a = admissionCheck({ temp: process.env.WP_TMP }, { min: 1 }); assert.equal(a.ok, true); assert.ok(a.disks[0].freeMb > 0);
  assert.equal(admissionCheck({ temp: process.env.WP_TMP }, { min: 1e9 }).ok, false); assert.throws(() => setMinFreeMb(-1), e => e.status === 400); const keep = minFreeMb(); setMinFreeMb(keep);
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva();
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Admitere P8' } })).body.id;
  let s = await api('PUT', 'settings/admission', { minFreeMb: 9 * 1024 * 1024 }); assert.equal(s.status, 200); assert.equal(s.body.check.ok, false);
  const h = await api('GET', 'health'); assert.equal(h.body.app.status, 'degraded'); assert.equal(h.body.app.components.disk.ok, false); assert.ok(!JSON.stringify(h.body).includes(process.env.WP_TMP), 'fără căi');
  const st = await api('POST', `projects/${id}/start`); assert.equal(st.status, 409); assert.equal(st.body.code, 'disk_low'); assert.match(st.body.message, /Spațiu liber insuficient.*minim/);
  assert.equal((await project(id)).project.status, 'ready', 'nimic nu a pornit');
  s = await api('PUT', 'settings/admission', { minFreeMb: 1 }); assert.equal(s.body.check.ok, true); assert.equal((await api('GET', 'health')).body.app.status, 'ok');
  assert.equal((await api('POST', `projects/${id}/start`)).status, 200);
  await waitFor(async () => (await project(id)).project.status === 'running' || null, { label: 'running' });
  await api('PUT', 'settings/admission', { minFreeMb: 9 * 1024 * 1024 });   // space runs out during the run
  const p = await waitFor(async () => { const x = (await project(id)).project; return ['paused', 'awaiting_review'].includes(x.status) && !x.running ? x : null; }, { label: 'oprire la etapa următoare', timeout: 120000 });
  if (p.status === 'paused') assert.match(p.error || '', /Spațiu liber insuficient/);
  await api('PUT', 'settings/admission', { minFreeMb: 2048 }); await api('POST', `projects/${id}/archive`, { archived: true });
});

test('P8-T04: imagini lente + Dali în paralel în timpul producției — citirile API rămân sub țintă; pregătirea textului nu concurează înaintea pilotului', async () => {
  setFake({ canvaDelayMs: 600 }); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva();
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Concurență P8' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']); assert.equal((await approveAll(id)).status, 200);
  await waitFor(async () => { const x = (await project(id)).project; return /^(demo|illustrations|coloring)/.test(x.currentStage || '') && x.status === 'running' ? x : null; }, { label: 'imagini în lucru', timeout: 180000, every: 200 });
  const log = () => { try { return fs.readFileSync(process.env.WP_FAKE_STATE + '.canva.log', 'utf8').split('\n').filter(l => l.includes('generate-image')).length; } catch { return 0; } };
  const c0 = log(); let stop = false;
  const dali = Array.from({ length: 3 }, async () => { let n = 0; while (!stop) { await api('POST', 'assistant', { message: 'Ce face acum proiectul?', context: { projectId: id } }); n++; } return n; });
  const t = []; for (let i = 0; i < 30; i++) { t.push(await timedGet(i % 3 === 0 ? 'state' : i % 3 === 1 ? `projects/${id}` : `projects/${id}/jobs`)); await new Promise(r => setTimeout(r, 50)); }
  stop = true; const daliCalls = (await Promise.all(dali)).reduce((a, b) => a + b, 0);
  const p = (await project(id)).project;
  assert.ok(pct(t, 95) < TARGETS.readP95Ms, `p95 citiri în timpul imaginilor lente + Dali: ${Math.round(pct(t, 95))} ms`); assert.ok(daliCalls >= 3);
  assert.ok(log() > c0 || /^(demo|illustrations|coloring)/.test(p.currentStage || ''), 'imaginile erau în lucru în timpul măsurării');
  assert.notEqual(p.stages['scripts@2']?.status, 'prefetched', 'înaintea pilotului nu se pregătește textul volumului 2 (fără muncă speculativă în paralel cu imaginile)');
  await api('POST', `projects/${id}/stop`); setFake({});
  await waitFor(async () => !(await project(id)).project.running || null, { label: 'oprire completă', timeout: 120000 });   // a graceful stop finishes the step in progress
  await api('POST', `projects/${id}/archive`, { archived: true });
});

test('P8-T04 remediere: backupul incremental leagă fișierele neschimbate (lacăt și spațiu proporționale cu schimbarea); fiecare backup rămâne complet și independent la restaurare', async () => {
  const os = await import('node:os'), path = await import('node:path'), { LocalStorage } = await import('../server/storage/local.js');
  const { saveSnapshot, verifySnapshot, restoreSnapshot } = await import('../server/snapshot.js');
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-inc-')), data = path.join(base, 'data'), bk = path.join(base, '_backup'); fs.mkdirSync(bk);
  const s = new LocalStorage(data); await s.init();
  for (let i = 0; i < 20; i++) await s.writeFile(`projects/p1/images/i${i}.png`, Buffer.alloc(4096, i)); await s.writeJSON('projects/p1/project.json', { id: 'p1', v: 1 });
  const a = await saveSnapshot(s, path.join(bk, 'backup-v03-1000.wbackup')); assert.equal(a.linked, 0, 'primul este complet');
  await new Promise(r => setTimeout(r, 20)); await s.writeJSON('projects/p1/project.json', { id: 'p1', v: 2 }); await s.writeFile('projects/p1/images/nou.png', Buffer.alloc(10, 7));
  const b = await saveSnapshot(s, path.join(bk, 'backup-v03-2000.wbackup')); assert.equal(b.linked, 20); assert.equal(b.copied, 2, 'doar fișierele schimbate/noi se copiază');
  const ino = f => fs.statSync(path.join(bk, f, 'files/projects/p1/images/i3.png')).ino; assert.equal(ino('backup-v03-1000.wbackup'), ino('backup-v03-2000.wbackup'), 'același inod: fără spațiu dublu');
  assert.ok(await verifySnapshot(path.join(bk, 'backup-v03-2000.wbackup')));
  fs.rmSync(path.join(bk, 'backup-v03-1000.wbackup'), { recursive: true }); assert.ok(await verifySnapshot(path.join(bk, 'backup-v03-2000.wbackup')), 'ștergerea backupului vechi (retenția) nu atinge cel nou');
  await s.writeFile('projects/p1/images/i3.png', Buffer.alloc(4096, 99)); await restoreSnapshot(s, path.join(bk, 'backup-v03-2000.wbackup'));
  assert.equal((await s.readFile('projects/p1/images/i3.png'))[0], 3); assert.equal((await s.readJSON('projects/p1/project.json')).v, 2);
  await s.writeFile('projects/p1/images/i4.png', Buffer.alloc(4096, 55)); assert.equal(fs.readFileSync(path.join(bk, 'backup-v03-2000.wbackup', 'files/projects/p1/images/i4.png'))[0], 4, 'datele vii restaurate nu împart inodul cu backupul');
  const man = path.join(bk, 'backup-v03-2000.wbackup', 'manifest.json'), m = JSON.parse(fs.readFileSync(man, 'utf8')); m.incremental.fullAt = Date.now() - 8 * 24 * 3600e3; fs.writeFileSync(man, JSON.stringify(m));
  assert.equal((await saveSnapshot(s, path.join(bk, 'backup-v03-3000.wbackup'))).linked, 0, 'cel puțin o copie completă pe săptămână');
  assert.equal((await saveSnapshot(s, path.join(bk, 'backup-v03-4000.wbackup'), { full: true })).linked, 0);
  fs.rmSync(base, { recursive: true, force: true });
});
