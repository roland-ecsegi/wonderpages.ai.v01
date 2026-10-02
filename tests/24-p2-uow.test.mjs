// TEST-P2-T01 — UnitOfWork: două editări pe aceeași revizie, eșec disc/DB înainte și după commit, commandId repetat,
// restaurare și backfill cu orfani detectați; local (jurnal redo) și PostgreSQL real (tranzacție) când este disponibil.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { api, INPUT } from './lib.mjs';
import { LocalStorage } from '../server/storage/local.js';
import { applyMigrations, MIGRATIONS, SCHEMA_VERSION } from '../server/persistence/migrations.js';
import { Repo } from '../server/repo.js';
import { saveSnapshot, restoreSnapshot } from '../server/snapshot.js';
import { reconcileStorage } from '../server/reconcile.js';
import { startEphemeral, stopEphemeral } from '../scripts/enterprise/pg-ephemeral.mjs';

const tmpStore = async () => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-uow-')); const s = new LocalStorage(dir); await s.init(); await applyMigrations(s); return { s, dir }; };
const batch = (pid, extra = {}) => ({ projectId: pid, bumpRevision: true, ops: [{ rel: `projects/${pid}/artifacts/a.json`, obj: { key: 'a', v: extra.v ?? 1 } }, { rel: `projects/${pid}/project.json`, obj: { id: pid, title: 'T' } }], result: { ok: extra.v ?? 1 }, ...extra });

test('P2-T01: migrările sunt numerotate, înregistrate cu checksum și idempotente', async () => {
  const { s, dir } = await tmpStore();
  const meta = await s.readJSON('_meta/schema.json');
  assert.deepEqual(meta.migrations.map(m => m.id), MIGRATIONS.map(m => m.id)); assert.equal(SCHEMA_VERSION, MIGRATIONS.at(-1).id);
  assert.deepEqual((await applyMigrations(s)).applied, [], 'a doua rulare nu reaplică');
  meta.migrations[1].checksum = 'tampered'; await s.writeJSON('_meta/schema.json', meta);
  await assert.rejects(applyMigrations(s), /integritate schema/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P2-T01 local: commit atomic, CAS pe revizie (409) și commandId repetat deduplicat', async () => {
  const { s, dir } = await tmpStore();
  let r = await s.commitBatch(batch('p1', { commandId: 'cmd-0001-aaaa' }));
  assert.equal(r.revision, 1); assert.equal((await s.readJSON('projects/p1/project.json')).revision, 1);
  const again = await s.commitBatch(batch('p1', { commandId: 'cmd-0001-aaaa', v: 99 }));
  assert.equal(again.deduplicated, true); assert.deepEqual(again.result, { ok: 1 }); assert.equal((await s.readJSON('projects/p1/artifacts/a.json')).v, 1, 'retry nu rescrie');
  await assert.rejects(s.commitBatch(batch('p1', { expectedRevision: 0, v: 2 })), e => e.status === 409 && e.code === 'revision_conflict' && e.currentRevision === 1);
  assert.equal((await s.readJSON('projects/p1/artifacts/a.json')).v, 1, 'conflictul nu scrie nimic');
  const both = await Promise.allSettled([s.commitBatch(batch('p1', { expectedRevision: 1, v: 3 })), s.commitBatch(batch('p1', { expectedRevision: 1, v: 4 }))]);
  assert.deepEqual(both.map(x => x.status).sort(), ['fulfilled', 'rejected'], 'exact un commit valid pe aceeași revizie');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P2-T01 local: eșec înainte de jurnal → nimic; eșec după jurnal → reluat la pornire, fără ACK înainte de durabilitate', async () => {
  const { s, dir } = await tmpStore();
  s.faults = { point: 'before-journal', once: true };
  await assert.rejects(s.commitBatch(batch('p2', { commandId: 'cmd-0002-bbbb' })), e => e.code === 'storage_fault');
  assert.equal(await s.readJSON('projects/p2/project.json'), null, 'nimic scris');
  s.faults = { point: 'mid-apply', once: true };
  await assert.rejects(s.commitBatch(batch('p2', { commandId: 'cmd-0003-cccc', v: 7 })), e => e.code === 'storage_fault');
  assert.equal((await s.readJSON('projects/p2/artifacts/a.json'))?.v, 7, 'primul document aplicat');
  assert.equal(await s.readJSON('projects/p2/project.json'), null, 'al doilea încă lipsă: stare parțială pe disc');
  const restarted = new LocalStorage(dir); await restarted.init(); const m = await applyMigrations(restarted);   // „repornire”
  assert.equal(m.recovered.replayed, 1);
  assert.equal((await restarted.readJSON('projects/p2/project.json')).revision, 1, 'jurnalul a completat commitul');
  const retry = await restarted.commitBatch(batch('p2', { commandId: 'cmd-0003-cccc', v: 8 }));
  assert.equal(retry.deduplicated, true, 'clientul care nu a primit ACK reia cu același commandId fără dublare');
  restarted.faults = { point: 'before-journal-delete', once: true };
  await assert.rejects(restarted.commitBatch(batch('p2', { commandId: 'cmd-0004-dddd', v: 9 })));
  const again = new LocalStorage(dir); await again.init(); assert.equal((await applyMigrations(again)).recovered.replayed, 1, 'reluarea este idempotentă');
  assert.equal((await again.readJSON('projects/p2/artifacts/a.json')).v, 9);
  assert.deepEqual(await again.list('_journal'), [], 'jurnalul gol după recuperare');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P2-T01 Repo: două editări pe aceeași versiune → una validă, 409 cu ce s-a schimbat; retry cu același commandId', async () => {
  const { s, dir } = await tmpStore(); const repo = new Repo(s);
  await repo.createProject({ id: 'puow0001', title: 'R', status: 'ready', input: {}, options: {} }, { slug: 'kids-sc', structure: { volumes: 6, pages: 12 } });
  await repo.writeArtifact('puow0001', 'final_0', { t: 'a' }, { by: 'agent' });
  const ok = await repo.writeArtifact('puow0001', 'final_0', { t: 'b' }, { by: 'user', expectedVersion: 1, commandId: 'edit-0001-x' });
  assert.equal(ok.version, 2);
  await assert.rejects(repo.writeArtifact('puow0001', 'final_0', { t: 'c' }, { by: 'user', expectedVersion: 1 }), e => e.status === 409 && e.currentVersion === 2 && e.changedBy === 'user');
  const dup = await repo.writeArtifact('puow0001', 'final_0', { t: 'b' }, { by: 'user', expectedVersion: 1, commandId: 'edit-0001-x' });
  assert.equal(dup.version, 2, 'commandId repetat: același rezultat, fără 409 și fără versiune nouă');
  assert.equal(repo.getProject('puow0001').revision, 2); assert.equal((await s.readJSON('projects/puow0001/project.json')).revision, 2);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P2-T01: snapshot + restaurare păstrează registrul de comenzi; orfanii sunt detectați, nu șterși', async () => {
  const { s, dir } = await tmpStore(); const repo = new Repo(s);
  await repo.createProject({ id: 'psnap0001', title: 'S', status: 'ready', input: {}, options: {} }, { slug: 'kids-sc', structure: { volumes: 6, pages: 12 } });
  await repo.writeArtifact('psnap0001', 'final_0', { t: 'x', image: 'images/missing.png' }, { commandId: 'snap-0001-cmd' });
  const out = path.join(os.tmpdir(), `wp-snap-${Date.now()}`); await saveSnapshot(s, out);
  await repo.writeArtifact('psnap0001', 'final_0', { t: 'after' });
  await restoreSnapshot(s, out);
  assert.equal((await s.readJSON('projects/psnap0001/artifacts/final_0.json')).content.t, 'x');
  assert.ok(await s.readJSON('_commands/psnap0001/snap-0001-cmd.json'), 'comanda deduplicabilă supraviețuiește restaurării');
  fs.mkdirSync(path.join(dir, 'projects', 'porphan001'), { recursive: true });
  const repo2 = new Repo(s); await repo2.load(); const rec = await reconcileStorage(repo2);
  assert.ok(rec.orphans.some(o => o.project === 'porphan001')); assert.ok(rec.missing.some(m => m.file === 'images/missing.png'));
  assert.ok(fs.existsSync(path.join(dir, 'projects', 'porphan001')), 'reconcilierea nu șterge');
  fs.rmSync(out, { recursive: true, force: true }); fs.rmSync(dir, { recursive: true, force: true });
});

test('P2-T01 PostgreSQL real: tranzacție, CAS cu blocare de rând, deduplicare, eșec înainte de commit, snapshot cu tabelele noi', async t => {
  const pg = await startEphemeral();
  if (pg.status !== 'STARTED') return t.skip(`PostgreSQL indisponibil: ${pg.reason || pg.status} (blocker de readiness înregistrat)`);
  const { PostgresStorage } = await import('../server/storage/postgres.js');
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-pgdata-')); const s = new PostgresStorage({ databaseUrl: pg.url, dataDir: data });
  try {
    await s.init();
    assert.deepEqual((await s.q('SELECT id FROM schema_migrations ORDER BY id')).rows.map(r => r.id), MIGRATIONS.map(m => m.id));
    let r = await s.commitBatch(batch('ppg00001', { commandId: 'pg-cmd-00001' })); assert.equal(r.revision, 1);
    assert.equal((await s.q("SELECT revision FROM projects WHERE id='ppg00001'")).rows[0].revision, 1);
    assert.equal((await s.commitBatch(batch('ppg00001', { commandId: 'pg-cmd-00001', v: 5 }))).deduplicated, true);
    const both = await Promise.allSettled([s.commitBatch(batch('ppg00001', { expectedRevision: 1, v: 2 })), s.commitBatch(batch('ppg00001', { expectedRevision: 1, v: 3 }))]);
    assert.deepEqual(both.map(x => x.status).sort(), ['fulfilled', 'rejected']); assert.equal(both.find(x => x.status === 'rejected').reason.code, 'revision_conflict');
    s.faults = { point: 'before-commit', once: true };
    await assert.rejects(s.commitBatch(batch('ppg00002', { commandId: 'pg-cmd-00002' })), e => e.code === 'storage_fault');
    assert.equal(await s.readJSON('projects/ppg00002/project.json'), null, 'rollback complet');
    assert.equal(await s.readJSON('_commands/ppg00002/pg-cmd-00002.json'), null, 'comanda nu este înregistrată fără commit');
    await s.writeJSON('projects/ppg00001/versions/a/1.json', { hash: 'h', pinned: true, content: {} });
    const out = path.join(os.tmpdir(), `wp-pgsnap-${Date.now()}`); await saveSnapshot(s, out);
    const db = JSON.parse(fs.readFileSync(path.join(out, 'database.json'), 'utf8'));
    assert.ok(Array.isArray(db.commands) && db.commands.length >= 1 && db.artifact_versions.length === 1);
    await s.q("DELETE FROM artifact_versions"); await restoreSnapshot(s, out);
    assert.equal((await s.q('SELECT COUNT(*)::int n FROM artifact_versions')).rows[0].n, 1);
    delete db.artifact_versions; delete db.commands; fs.writeFileSync(path.join(out, 'database.json'), JSON.stringify(db));
    const man = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8')); const crypto = await import('node:crypto');
    man.files.find(f => f.path === 'database.json').sha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(out, 'database.json'))).digest('hex'); fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(man));
    await restoreSnapshot(s, out);   // snapshot mai vechi, fără tabelele noi
    assert.equal((await s.q('SELECT COUNT(*)::int n FROM artifact_versions')).rows[0].n, 0, 'tabelele noi pornesc goale');
    assert.ok((await s.q('SELECT COUNT(*)::int n FROM schema_migrations')).rows[0].n >= MIGRATIONS.length, 'registrul schemei instalate rămâne');
    fs.rmSync(out, { recursive: true, force: true });
  } finally { await s.close().catch(() => {}); fs.rmSync(data, { recursive: true, force: true }); stopEphemeral(pg.dir); }
});

test('P2-T01 API: commandId repetat și editare pe versiune veche', async () => {
  const p = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'UoW API' } }); const pid = p.body.id;
  const body = v => ({ content: { title: 'Brief ' + v }, note: 'test', expectedVersion: v });
  let r = await api('POST', `projects/${pid}/artifacts/brief`, body(0), { headers: { 'x-wp-command': 'api-cmd-000001' } });
  assert.equal(r.status, 200); assert.equal(r.body.version, 1);
  r = await api('POST', `projects/${pid}/artifacts/brief`, body(0), { headers: { 'x-wp-command': 'api-cmd-000001' } });
  assert.equal(r.status, 200); assert.equal(r.body.version, 1, 'retry deduplicat');
  r = await api('POST', `projects/${pid}/artifacts/brief`, body(0));
  assert.equal(r.status, 409); assert.equal(r.body.code, 'version_conflict'); assert.equal(r.body.conflict.currentVersion, 1);
  assert.equal((await api('GET', 'schema')).body.schemaVersion, SCHEMA_VERSION);
  await api('POST', `projects/${pid}/archive`, { archived: true });
});
