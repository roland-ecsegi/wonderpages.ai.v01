// TEST-P8-T02 — restaurarea backupurilor vechi/noi într-o copie, limitele de crash, lease expirat, fișier lipsă, eșecul
// copiei secundare și migrarea întreruptă: inventarul/hash-urile/versiunile/deciziile recuperate; RPO/RTO măsurate față de
// țintele propuse; eșecurile documentate fără „zero pierderi” fals. Local și PostgreSQL real (instanță proprie, efemeră).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { api } from './lib.mjs';
import { LocalStorage } from '../server/storage/local.js';
import { applyMigrations } from '../server/persistence/migrations.js';
import { runDrill, TARGETS } from '../scripts/enterprise/recovery-drill.mjs';
import { startEphemeral, stopEphemeral } from '../scripts/enterprise/pg-ephemeral.mjs';

function assertDrill(r) {
  assert.deepEqual(r.failures, [], JSON.stringify(r.failures));
  const s = r.steps;
  assert.equal(s.recovery.inventory.matched, s.recovery.inventory.expected); assert.ok(s.recovery.inventory.expected > 0);
  for (const [k, e] of Object.entries(s.recovery.entities)) assert.equal(e.restored, e.snapshot, `entitatea ${k} recuperată`);
  assert.ok(s.recovery.entities.decisions.snapshot >= 3 && s.recovery.entities.jobs.snapshot === 2 && s.recovery.entities.assets.snapshot >= 4);
  assert.equal(s.recovery.versions.current.schemaVersion, r.schemaVersion); assert.equal(s.recovery.versions.snapshot.schemaVersion, r.schemaVersion);
  assert.equal(r.measured.disasterRpo.commitsLost, 3, 'commit-urile de după backup sunt raportate ca pierdute, nu zero');
  assert.ok(Number.isFinite(r.measured.rtoMs) && r.measured.rtoMs < TARGETS.rtoHours * 3600e3); assert.equal(r.targets.status, 'proposed_targets_not_measured_on_reference_host');
  assert.equal(s.normalization.autoStarted, 0); assert.equal(s.normalization.projectStatus, 'paused');
  assert.deepEqual(s.normalization.jobs.map(j => `${j.key}:${j.status}`).sort(), ['image:p3:ambiguous', 'text:script_1:pending'], 'lease-ul restaurat este mort: fără apel extern → reluabil; după apel extern → ambiguu, nu se reia orbește');
  assert.deepEqual(s.migratedProject, { source: 'migration', original: 'dw-original', rawSourceIntact: true, lineage: true, approvals: 0 });
  assert.deepEqual(s.missingFile.reconcileMissing, ['images/p2.png']); assert.equal(s.missingFile.reportOk, false);
  assert.equal(s.secondaryCopy.failing.error, true); assert.equal(s.secondaryCopy.failing.verified, false); assert.equal(s.secondaryCopy.working.verified, true); assert.equal(s.secondaryCopy.primaryValid, true);
  assert.equal(s.interruptedMigration.runStatus, 'interrupted'); assert.equal(s.interruptedMigration.partialProjectGone, true); assert.equal(s.interruptedMigration.committedUntouched, true);
  assert.equal(s.snapshotVersions.oldRestored, true); assert.match(s.snapshotVersions.oldNote, /versiune mai veche/); assert.equal(s.snapshotVersions.newerRefused, true);
  for (const x of Object.values(s.interruptedRestore)) assert.deepEqual(x, { failed: true, currentDataUnchanged: true });
}

test('P8-T02 local: drill complet — crash jurnal, restaurare întreruptă și completă, normalizare, fișier lipsă, copie secundară, migrare întreruptă, backup vechi/nou', async () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-drill-t-')), dir = path.join(work, 'data'), s = new LocalStorage(dir); await s.init(); await applyMigrations(s);
  const r = await runDrill({ storage: s, reopen: async () => { const n = new LocalStorage(dir); await n.init(); return n; }, work: path.join(work, 'w'), projects: 3 });
  assertDrill(r);
  assert.equal(r.steps.crashBoundaries.beforeJournal, 'not_acked', 'zero ACK pentru o mutație nedurabilă');
  assert.deepEqual(r.steps.crashBoundaries.afterJournal, { acked: false, replayed: 1, present: true }, 'commit-ul jurnalizat (neconfirmat încă) este reaplicat la repornire');
  assert.equal(r.steps.interruptedSchemaMigration.applicable, false);
  fs.rmSync(work, { recursive: true, force: true });
});

test('P8-T02 PostgreSQL real: tranzacție întreruptă, restaurare cu rânduri pe tabel, migrare de schemă întreruptă fără stare parțială', async t => {
  const pg = await startEphemeral();
  if (pg.status !== 'STARTED') return t.skip(`PostgreSQL indisponibil: ${pg.reason || pg.status} (blocker de readiness înregistrat)`);
  const { PostgresStorage } = await import('../server/storage/postgres.js');
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-drill-pg-')), s = new PostgresStorage({ databaseUrl: pg.url, dataDir: path.join(work, 'data') });
  try {
    await s.init();
    const r = await runDrill({ storage: s, reopen: async () => s, work: path.join(work, 'w'), projects: 3 });
    assertDrill(r);
    assert.deepEqual(r.steps.crashBoundaries.beforeCommit, { acked: false, present: false });
    assert.deepEqual(r.steps.recovery.rowMismatch, []); assert.equal(r.steps.recovery.rows.decision_records.live, r.steps.recovery.rows.decision_records.snapshot);
    assert.deepEqual(r.steps.interruptedSchemaMigration, { failed: true, partialTable: null, recorded: 0, rerunClean: true });
  } finally { await s.close?.().catch(() => {}); fs.rmSync(work, { recursive: true, force: true }); stopEphemeral(pg.dir); }
});

test('P8-T02 API: restaurarea raportează ce s-a recuperat și nu pornește nimic automat', async () => {
  const b = await api('POST', 'backups'); assert.equal(b.status, 200, JSON.stringify(b.body)); assert.match(b.body.file, /^backup-v03-\d+\.wbackup$/);
  const list = await api('GET', 'backups'); assert.ok(list.body.items.some(i => i.file === b.body.file && i.fileCount > 0));
  assert.equal((await api('POST', 'backups/restore', { file: b.body.file, confirm: 'nu' })).status, 400);
  const r = await api('POST', 'backups/restore', { file: b.body.file, confirm: 'RESTAUREAZĂ' }); assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.recovery.ok, true, JSON.stringify(r.body.recovery).slice(0, 600)); assert.equal(r.body.recovery.inventory.matched, r.body.recovery.inventory.expected);
  assert.ok(r.body.recovery.versions.snapshot?.schemaVersion >= 9); assert.equal(r.body.normalized.autoStarted, 0); assert.match(r.body.safety, /^backup-v03-\d+\.wbackup$/, 'backup de siguranță înainte de restaurare');
  const st = await api('GET', 'state'); assert.equal(st.status, 200); assert.ok(!(st.body.projects || []).some(p => p.status === 'running'), 'nicio producție pornită după restaurare');
  const h = await api('GET', 'health'); assert.equal(h.body.app.status, 'ok');
});

test('P8-T02 Dinosaur World: migrarea oprită de proces este curățată la pornire; originalul și proiectul migrat se restaurează independent, cu proveniența', async () => {
  const { ROOT } = await import('./lib.mjs'), crypto = await import('node:crypto'), sha = b => crypto.createHash('sha256').update(b).digest('hex');
  const { Repo } = await import('../server/repo.js'), { planMigration, runMigration, recoverMigrations, listMigrations } = await import('../server/migration/migrator.js');
  const { saveSnapshot, restoreSnapshot, recoveryReport } = await import('../server/snapshot.js');
  const zipPath = path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip'), DW = fs.readFileSync(zipPath), dwSha = sha(DW);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-dw-rec-')), dir = path.join(work, 'data'), s = new LocalStorage(dir); await s.init(); await applyMigrations(s);
  let repo = new Repo(s); await repo.load(); const plan = planMigration(DW);
  await assert.rejects(runMigration(repo, s, DW, { planHash: plan.planHash, faultAt: 'crash-after-import' }), e => e.code === 'migration_crash');
  assert.equal(repo.listProjects().length, 1, 'starea lăsată de procesul oprit: proiect parțial'); assert.equal((await listMigrations(s))[0].status, 'running');
  repo = new Repo(s); await repo.load(); const rec = await recoverMigrations(repo, s);   // repornire
  assert.equal(rec.length, 1); assert.equal(repo.listProjects().length, 0); assert.equal((await listMigrations(s))[0].status, 'interrupted');
  const ok = await runMigration(repo, s, DW, { planHash: plan.planHash }); assert.equal(ok.status, 'committed');
  const pid = ok.projectId, rawRel = (await s.list(`projects/${pid}/raw`)).map(f => `projects/${pid}/raw/${f.name}`)[0];
  const snap = path.join(work, 'backup-v03-1.wbackup'); await saveSnapshot(s, snap);
  fs.rmSync(path.join(dir, 'projects', pid), { recursive: true, force: true });   // proiectul Enterprise DW pierdut
  await restoreSnapshot(s, snap); const report = await recoveryReport(s, snap); assert.equal(report.ok, true);
  repo = new Repo(s); await repo.load(); const p = repo.getProject(pid), art = await repo.artifacts(pid);
  assert.equal(p.source.kind, 'migration'); assert.equal(p.migration.sourceSha256, dwSha, 'proveniența către arhiva originală');
  assert.equal(sha(await s.readFile(rawRel)), dwSha, 'sursa brută din proiect este identică cu originalul');
  assert.ok(art.migration_report && art.canon_typed, 'raportul de migrare și proiecția tipizată (linia de proveniență) recuperate');
  assert.deepEqual(Object.keys(p.approvals || {}), [], 'aprobările rămân resetate: restaurarea nu acordă autoritate');
  assert.equal(sha(fs.readFileSync(zipPath)), dwSha, 'arhiva originală DW este neatinsă (sursă read-only, restaurabilă separat)');
  fs.rmSync(work, { recursive: true, force: true });
});
