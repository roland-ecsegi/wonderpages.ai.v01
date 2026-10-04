#!/usr/bin/env node
/**
 * P8-T02 — recovery and backup/restore drill on a disposable copy (never the live installation).
 *   node scripts/enterprise/recovery-drill.mjs [--projects=N] [--asset-mb=M] [--pg] [--out=docs/enterprise/baseline/RECOVERY-DRILL.json]
 * Seeds projects with artifacts, decisions, assets, jobs (leased + after an external call), knowledge and a migrated
 * project with its raw source, then measures: snapshot time, post-snapshot commits lost on a disaster restore (RPO, never
 * reported as zero), crash boundaries of the commit journal, an interrupted restore, the full restore + verification
 * (RTO), what was recovered (inventory/hashes/versions/decisions), the no-auto-production normalization, a missing file,
 * a failed and a verified second copy and an interrupted dataset migration. Targets are the PROPOSED ones of the
 * architecture (RPO 0 for committed data after a local crash, disaster RPO ≤ 24 h with daily backups, RTO ≤ 2 h);
 * measurements are from this host and this dataset, not from the reference host.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LocalStorage } from '../../server/storage/local.js';
import { applyMigrations, MIGRATIONS, SCHEMA_VERSION } from '../../server/persistence/migrations.js';
import { Repo } from '../../server/repo.js';
import { Scheduler } from '../../server/jobs/scheduler.js';
import { saveSnapshot, restoreSnapshot, verifySnapshot, recoveryReport } from '../../server/snapshot.js';
import { reconcileStorage } from '../../server/reconcile.js';
import { normalizeAfterStop } from '../../server/ops/recovery.js';
import { recoverMigrations, listMigrations } from '../../server/migration/migrator.js';
import { decisionRecord } from '../../server/domain/decisions.js';
import { setOutputDir, setOutputMirror, mirrorBackup } from '../../server/output.js';

export const TARGETS = Object.freeze({ crashRpoCommits: 0, disasterRpoHours: 24, rtoHours: 2, status: 'proposed_targets_not_measured_on_reference_host' });
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const ms = t0 => Math.round(Number(process.hrtime.bigint() - t0) / 1e6);
const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex');

async function seed(repo, storage, { projects = 3, assetMb = 0 } = {}) {
  const jobs = new Scheduler(storage, { owner: 'iDRILL:seed', ttlMs: 10 * 60e3 }), ids = [];
  for (let i = 0; i < projects; i++) {
    const pid = `drill${String(i).padStart(3, '0')}`; ids.push(pid);
    await repo.createProject({ id: pid, title: `Proiect ${i}`, status: i === 0 ? 'running' : 'paused', input: { language: 'English' }, approvals: {}, createdAt: Date.now(), updatedAt: Date.now() }, { slug: 'kids-sc', version: 1 });
    await repo.writeArtifact(pid, 'bible', { characters: [{ name: 'Tia' }], i }, { by: 'drill' });
    await repo.writeArtifact(pid, 'script_0', { pages: Array.from({ length: 12 }, (_, n) => ({ n: n + 1, text: `Pagina ${n + 1}` })) }, { by: 'drill' });
    await storage.writeFile(`projects/${pid}/images/p${i}.png`, Buffer.concat([PNG, Buffer.from([i])]));
    if (assetMb) await storage.writeFile(`projects/${pid}/images/large-${i}.png`, crypto.randomBytes(Math.round(assetMb * 1024 * 1024 / projects)));   // incompressible bytes: copy throughput, not compression
    await repo.commitProjectDecision(pid, { approvals: { bible: { by: 'operator', at: Date.now() } } }, [decisionRecord({ kind: 'approval', actor: 'operator', state: 'approved', subject: { key: 'bible', version: 1 } })], { kind: 'decision' });
  }
  /* a unit leased by a process that will "die" and one stopped after an external call */
  const a = await jobs.acquire(ids[0], 'text:script_1', { inputsHash: 'h1', label: 'Scenariu 2' }); await jobs.start(ids[0], 'text:script_1', a.token);
  const b = await jobs.acquire(ids[0], 'image:p3', { inputsHash: 'h2', label: 'Imagine 3' }); await jobs.start(ids[0], 'image:p3', b.token); await jobs.markExternal(ids[0], 'image:p3', b.token, { provider: 'canva' });
  await storage.writeJSON('knowledge/store.json', { schema: 'wonderpages.knowledge/1', sources: [{ id: 'ks1' }], candidates: [{ id: 'kc1', status: 'candidate' }], decisions: [] });
  await storage.writeJSON('knowledge/experience.json', { records: [{ id: 'xp1' }], assessments: [] });
  /* migrated project: raw source kept, lineage recorded, approvals reset */
  const mig = 'drilldw1', raw = Buffer.from('PK\u0003\u0004 dinosaur world original archive bytes');
  await repo.createProject({ id: mig, title: 'Dinosaur World', status: 'ready', input: { language: 'English', second_language: 'Romanian' }, approvals: {}, source: { kind: 'migration', original: 'dw-original', at: Date.now() }, migration: { id: 'mig-drill', sourceSha256: sha(raw) }, createdAt: Date.now(), updatedAt: Date.now() }, { slug: 'kids-sc', version: 1 });
  await storage.writeFile(`projects/${mig}/raw/source-${sha(raw).slice(0, 16)}.zip`, raw);
  await repo.writeArtifact(mig, 'bible', { characters: [{ name: 'Rex' }] }, { by: 'migration' });
  await repo.writeArtifact(mig, 'canon_typed', { sourceKey: 'bible', sourceVersion: 1 }, { by: 'migration' });
  await storage.writeJSON('_migrations/mig-drill.json', { id: 'mig-drill', status: 'committed', projectId: mig, sourceSha256: sha(raw), at: Date.now() });
  return { ids, mig, rawSha: sha(raw), rawRel: `projects/${mig}/raw/source-${sha(raw).slice(0, 16)}.zip` };
}

/** Runs the drill on a fresh storage. `reopen()` returns a NEW storage instance on the same data (a process restart). */
export async function runDrill({ storage, reopen, work, projects = 3, assetMb = 0 }) {
  const out = { kind: storage.kind, schemaVersion: SCHEMA_VERSION, dataset: {}, steps: {}, measured: {}, targets: TARGETS, failures: [] };
  const step = (k, v) => { out.steps[k] = v; return v; };
  let repo = new Repo(storage); await repo.load();
  const seeded = await seed(repo, storage, { projects, assetMb });
  const backups = path.join(work, '_backup'); fs.mkdirSync(backups, { recursive: true });

  /* 1. snapshot */
  let t = process.hrtime.bigint(); const snap = path.join(backups, `backup-v03-${Date.now()}.wbackup`); const sres = await saveSnapshot(storage, snap); out.measured.snapshotMs = ms(t);
  const manifest = await verifySnapshot(snap); out.dataset = { projects: projects + 1, files: sres.files, bytes: manifest.files.reduce((n, f) => n + f.bytes, 0), summary: manifest.summary };
  const snapAt = manifest.at;

  /* 2. commits after the snapshot: a disaster restore loses exactly these (never reported as zero loss) */
  const after = 3; for (let i = 0; i < after; i++) await repo.commitProjectDecision(seeded.ids[1], { note: `după backup ${i}` }, [decisionRecord({ kind: 'note', actor: 'operator', state: 'recorded', note: `după backup ${i}` })]);
  const decisionsBefore = (await repo.listDecisions(seeded.ids[1])).length;

  /* 3. crash boundaries of the commit (local journal / PostgreSQL transaction) */
  const crash = {};
  if (storage.kind === 'local') {
    storage.faults = { point: 'before-journal', once: true };
    await repo.commitProjectDecision(seeded.ids[2], { x: 1 }, [decisionRecord({ kind: 'note', actor: 'drill', state: 'recorded' })]).then(() => { crash.beforeJournal = 'acked?'; }, () => { crash.beforeJournal = 'not_acked'; });
    storage.faults = { point: 'after-journal', once: true };
    let acked = false; await repo.commitProjectDecision(seeded.ids[2], { y: 1 }, [decisionRecord({ kind: 'note', actor: 'drill', state: 'recorded', note: 'journaled' })]).then(() => { acked = true; }, () => {});
    const s2 = await reopen(); const rec = await s2.recoverJournal(); const r2 = new Repo(s2); await r2.load();
    crash.afterJournal = { acked, replayed: rec.replayed, present: (await r2.listDecisions(seeded.ids[2])).some(d => d.note === 'journaled') };
    crash.rpoCommitsLost = 0; storage = s2; repo = r2;
  } else {
    storage.faults = { point: 'before-commit', once: true };
    let acked = false; await repo.commitProjectDecision(seeded.ids[2], { y: 1 }, [decisionRecord({ kind: 'note', actor: 'drill', state: 'recorded', note: 'pg-fault' })]).then(() => { acked = true; }, () => {});
    crash.beforeCommit = { acked, present: (await repo.listDecisions(seeded.ids[2])).some(d => d.note === 'pg-fault') };
    crash.rpoCommitsLost = 0;
  }
  step('crashBoundaries', crash);

  /* 4. disaster: data lost/corrupted; an interrupted restore leaves the current data untouched */
  if (storage.kind === 'local') { fs.rmSync(path.join(storage.root, 'projects', seeded.ids[1]), { recursive: true, force: true }); fs.writeFileSync(path.join(storage.root, 'knowledge/store.json'), '{corrupt'); }
  else { await storage.q('DELETE FROM decision_records WHERE project_id = $1', [seeded.ids[1]]); await storage.files.remove(`projects/${seeded.ids[1]}`); }
  const fingerprint = async () => storage.kind === 'local' ? fs.existsSync(path.join(storage.root, 'projects', seeded.ids[1])) + ':' + fs.readFileSync(path.join(storage.root, 'knowledge/store.json'), 'utf8') : String((await storage.q('SELECT COUNT(*)::int n FROM decision_records WHERE project_id = $1', [seeded.ids[1]])).rows[0].n);
  const fp0 = await fingerprint(); const interrupted = {};
  for (const fault of ['before-swap', 'before-commit']) { let err = null; await restoreSnapshot(storage, snap, { fault }).catch(e => { err = e.message; }); interrupted[fault] = { failed: !!err, currentDataUnchanged: (await fingerprint()) === fp0 }; }
  step('interruptedRestore', interrupted);

  /* 5. restore + verification + normalization = RTO */
  t = process.hrtime.bigint();
  await restoreSnapshot(storage, snap); const report = await recoveryReport(storage, snap); await applyMigrations(storage);
  repo = new Repo(storage); await repo.load();
  const normalized = await normalizeAfterStop(repo, new Scheduler(storage, { owner: 'iDRILL:restored' }), { reason: 'Restaurat din backup (drill).', force: true, logPrefix: 'După restaurare: ' });
  out.measured.rtoMs = ms(t);
  { const mb = out.dataset.bytes / 1048576; out.measured.throughput = { datasetMb: Math.round(mb * 10) / 10, snapshotMbPerS: out.measured.snapshotMs ? Math.round(mb / (out.measured.snapshotMs / 1000) * 10) / 10 : null, restoreMbPerS: out.measured.rtoMs ? Math.round(mb / (out.measured.rtoMs / 1000) * 10) / 10 : null, note: 'Estimare liniară pentru alte volume = volum ÷ debit; nu este o măsurătoare pe hostul de referință.' }; }
  step('recovery', report);
  const decisionsAfter = (await repo.listDecisions(seeded.ids[1])).length;
  out.measured.disasterRpo = { commitsLost: decisionsBefore - decisionsAfter, expectedLost: after, windowMs: Date.now() - snapAt, note: 'Commit-urile făcute după ultimul backup se pierd la o restaurare după dezastru; cu backup zilnic fereastra maximă este 24 h.' };
  const jobs = await new Scheduler(storage).list(seeded.ids[0]);
  step('normalization', { paused: normalized.paused, reconciled: normalized.reconciled, autoStarted: normalized.autoStarted, jobs: jobs.map(j => ({ key: j.key, status: j.status })), projectStatus: repo.getProject(seeded.ids[0])?.status });
  const mp = repo.getProject(seeded.mig), rawNow = await storage.readFile(seeded.rawRel).catch(() => null);
  step('migratedProject', { source: mp?.source?.kind || null, original: mp?.source?.original || null, rawSourceIntact: !!rawNow && sha(rawNow) === seeded.rawSha, lineage: !!(await repo.artifacts(seeded.mig)).canon_typed, approvals: Object.keys(mp?.approvals || {}).length });

  /* 6. a file missing after restore is reported, never counted as recovered */
  await (storage.kind === 'local' ? storage : storage.files).remove(`projects/${seeded.ids[2]}/images/p2.png`);
  const missingRef = 'images/p2.png';
  await repo.writeArtifact(seeded.ids[2], 'final_0', { pages: [{ image: missingRef }] }, { by: 'drill' });
  const rec = await reconcileStorage(repo); const rep2 = await recoveryReport(storage, snap);
  step('missingFile', { reconcileMissing: rec.missing.filter(m => m.project === seeded.ids[2]).map(m => m.file), reportMissing: rep2.inventory.missing.filter(f => f.endsWith('p2.png')), reportOk: rep2.ok });

  /* 7. second copy: a failing mirror is reported (primary stays valid); a working mirror is verified by hash */
  setOutputDir(work); const blocker = path.join(work, 'mirror-is-a-file'); fs.writeFileSync(blocker, 'x'); setOutputMirror(blocker);
  const bad = await mirrorBackup(snap); setOutputMirror(path.join(work, 'mirror')); const good = await mirrorBackup(snap); setOutputMirror(null);
  let primaryValid = true; await verifySnapshot(snap).catch(() => { primaryValid = false; });
  step('secondaryCopy', { failing: { error: !!bad?.error, verified: bad?.verified ?? null }, working: { copied: good?.copied ?? 0, verified: good?.verified === true }, primaryValid });

  /* 8. interrupted dataset migration (process killed after import): startup recovery removes the partial project */
  await repo.createProject({ id: 'drillpart', title: 'Import parțial', status: 'paused', input: { language: 'English' }, approvals: {} }, { slug: 'kids-sc', version: 1 });
  await storage.writeJSON('_migrations/mig-partial.json', { id: 'mig-partial', status: 'running', projectId: 'drillpart', startedAt: Date.now(), at: Date.now() });
  const rm = await recoverMigrations(repo, storage); const runs = await listMigrations(storage);
  step('interruptedMigration', { recovered: rm, partialProjectGone: !repo.getProject('drillpart'), runStatus: runs.find(r => r.id === 'mig-partial')?.status, committedUntouched: runs.find(r => r.id === 'mig-drill')?.status === 'committed' });

  /* 9. interrupted schema migration (PostgreSQL: one transaction per migration) */
  if (storage.kind === 'postgres') {
    let err = null; await applyMigrations(storage, [...MIGRATIONS, { id: 990, name: 'drill', pg: ['CREATE TABLE drill_ok (id int)', 'CREATE TABLE drill_bad ('] }]).catch(e => { err = e.message; });
    const okTable = (await storage.q("SELECT to_regclass('public.drill_ok') AS t")).rows[0].t, recorded = (await storage.q('SELECT COUNT(*)::int n FROM schema_migrations WHERE id = 990')).rows[0].n;
    step('interruptedSchemaMigration', { failed: !!err, partialTable: okTable, recorded, rerunClean: (await applyMigrations(storage)).applied.length === 0 });
  } else step('interruptedSchemaMigration', { applicable: false, note: 'Local: migrările sunt doar metadate scrise atomic (tmp + rename); nu există stare parțială.' });

  /* 10. old snapshot (no versions/summary) restores; a snapshot from a newer schema is refused */
  const old = path.join(backups, `backup-v03-${Date.now() + 1}.wbackup`); fs.cpSync(snap, old, { recursive: true });
  const om = JSON.parse(fs.readFileSync(path.join(old, 'manifest.json'), 'utf8')); delete om.app; delete om.summary; fs.writeFileSync(path.join(old, 'manifest.json'), JSON.stringify(om));
  let oldOk = true; await restoreSnapshot(storage, old).catch(() => { oldOk = false; }); const oldRep = await recoveryReport(storage, old);
  const newer = path.join(backups, `backup-v03-${Date.now() + 2}.wbackup`); fs.cpSync(snap, newer, { recursive: true });
  const nm = JSON.parse(fs.readFileSync(path.join(newer, 'manifest.json'), 'utf8')); nm.app = { ...nm.app, schemaVersion: SCHEMA_VERSION + 50 }; fs.writeFileSync(path.join(newer, 'manifest.json'), JSON.stringify(nm));
  let newerErr = null; await restoreSnapshot(storage, newer).catch(e => { newerErr = e.message; });
  step('snapshotVersions', { oldRestored: oldOk, oldReportOk: oldRep.ok, oldNote: oldRep.versions.note, newerRefused: !!newerErr });

  /* verdicts against the proposed targets */
  const s = out.steps;
  const checks = [
    ['crash: commit fără jurnal nu este confirmat; commit jurnalizat recuperat (RPO 0 pentru date comise)', storage.kind === 'local' ? s.crashBoundaries.beforeJournal === 'not_acked' && s.crashBoundaries.afterJournal.present : !s.crashBoundaries.beforeCommit.acked && !s.crashBoundaries.beforeCommit.present],
    ['restaurare întreruptă: datele curente rămân neatinse', Object.values(s.interruptedRestore).every(x => x.failed && x.currentDataUnchanged)],
    ['inventar/hash-uri/versiuni/decizii recuperate', s.recovery.ok && s.recovery.inventory.matched === s.recovery.inventory.expected],
    ['pierderea după backup este măsurată, nu zero', out.measured.disasterRpo.commitsLost === after],
    ['fără producție automată după restaurare', s.normalization.autoStarted === 0 && s.normalization.projectStatus !== 'running' && !s.normalization.jobs.some(j => ['leased', 'executing'].includes(j.status)) && s.normalization.jobs.some(j => j.status === 'ambiguous')],
    ['proiectul migrat: sursă brută intactă, linie de proveniență, aprobări resetate', s.migratedProject.rawSourceIntact && s.migratedProject.lineage && s.migratedProject.source === 'migration' && s.migratedProject.approvals === 0],
    ['fișier lipsă raportat', s.missingFile.reconcileMissing.length === 1 && s.missingFile.reportMissing.length === 1 && !s.missingFile.reportOk],
    ['a doua copie: eșecul raportat, copia bună verificată, primara validă', s.secondaryCopy.failing.error && s.secondaryCopy.working.verified && s.secondaryCopy.primaryValid],
    ['migrare întreruptă curățată la pornire', s.interruptedMigration.partialProjectGone && s.interruptedMigration.runStatus === 'interrupted' && s.interruptedMigration.committedUntouched],
    ['migrare de schemă întreruptă fără stare parțială', s.interruptedSchemaMigration.applicable === false || (s.interruptedSchemaMigration.failed && !s.interruptedSchemaMigration.partialTable && !s.interruptedSchemaMigration.recorded && s.interruptedSchemaMigration.rerunClean)],
    ['backup vechi restaurabil; backup din schemă mai nouă refuzat', s.snapshotVersions.oldRestored && s.snapshotVersions.newerRefused],
    [`RTO măsurat ≤ ${TARGETS.rtoHours} h (acest host, acest set)`, out.measured.rtoMs <= TARGETS.rtoHours * 3600e3]
  ];
  out.checks = checks.map(([name, ok]) => ({ name, ok: !!ok })); out.failures = out.checks.filter(c => !c.ok).map(c => c.name);
  out.ok = !out.failures.length; return out;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const arg = n => process.argv.find(x => x.startsWith(`--${n}=`))?.split('=').slice(1).join('=');
  const projects = Number(arg('projects') || 3), assetMb = Number(arg('asset-mb') || 0), work = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-drill-')), results = {};
  try {
    const dir = path.join(work, 'local-data'), s = new LocalStorage(dir); await s.init(); await applyMigrations(s);
    results.local = await runDrill({ storage: s, reopen: async () => { const n = new LocalStorage(dir); await n.init(); return n; }, work: path.join(work, 'local'), projects, assetMb });
    if (process.argv.includes('--pg')) {
      const { startEphemeral, stopEphemeral } = await import('./pg-ephemeral.mjs'); const pg = await startEphemeral();
      if (pg.status !== 'STARTED') results.postgres = { status: 'NOT_RUN', reason: pg.reason || pg.status };
      else { const { PostgresStorage } = await import('../../server/storage/postgres.js'); const data = path.join(work, 'pg-data'); const s = new PostgresStorage({ databaseUrl: pg.url, dataDir: data }); await s.init();
        try { results.postgres = await runDrill({ storage: s, reopen: async () => s, work: path.join(work, 'pg'), projects, assetMb }); } finally { await s.close?.(); await stopEphemeral(pg.dir); } }
    }
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
  const ev = { schema: 'wonderpages.recovery-drill/1', at: new Date().toISOString(), host: { platform: process.platform, node: process.version, cpus: os.cpus().length }, targets: TARGETS, results };
  const outFile = arg('out'); if (outFile) fs.writeFileSync(path.resolve(outFile), JSON.stringify(ev, null, 2) + '\n');
  for (const [k, r] of Object.entries(results)) { console.log(`${k}: ${r.ok ? 'PASS' : r.status || 'FAIL'}${r.measured ? ` — snapshot ${r.measured.snapshotMs} ms, RTO ${r.measured.rtoMs} ms, pierdute după backup ${r.measured.disasterRpo.commitsLost}` : ''}`); for (const c of r.checks || []) console.log(`  ${c.ok ? 'PASS' : 'FAIL'} ${c.name}`); }
  process.exit(Object.values(results).every(r => r.ok || r.status === 'NOT_RUN') ? 0 : 1);
}
