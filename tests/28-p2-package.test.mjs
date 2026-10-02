// TEST-P2-T05 — roundtrip DW, hash corupt / asset lipsă / schemă nesuportată / migrare duplicată;
// comparare cu referințele brute originale și 6/72/12; rollback fără proiect parțial.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { api, zip, project, ROOT } from './lib.mjs';
import { readZip } from '../server/security/safe-zip.js';
import { canonicalHash } from '../server/domain/canonical.js';

const DWZIP = fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip'));
const SRC = JSON.parse([...readZip(DWZIP)].find(([k]) => k.endsWith('/project.json'))[1].toString());
const post = (p, body) => api('POST', p, body, { headers: { 'content-type': 'application/octet-stream' } });
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
let MIGRATED = null;

test('P2-T05 API: migrarea DW — dry-run, rulare legată de plan, raport fără pierderi, nimic generat, aprobări pending', async () => {
  const before = (await api('GET', 'state')).body.projects.length;
  const plan = await post('migrations/plan', DWZIP);
  assert.equal(plan.status, 200); assert.equal(plan.body.dryRun, true);
  assert.deepEqual([plan.body.counts.volumes, plan.body.counts.pagePlans, plan.body.counts.manuscriptPages, plan.body.counts.refs], [6, 72, 12, 2]);
  assert.equal((await api('GET', 'state')).body.projects.length, before, 'dry-run nu creează nimic');
  assert.equal((await post('migrations/run?plan=gresit', DWZIP)).status, 409);
  const run = await post(`migrations/run?plan=${plan.body.planHash}`, DWZIP);
  assert.equal(run.status, 200, JSON.stringify(run.body)); MIGRATED = run.body.projectId;
  const r = run.body.report;
  assert.equal(r.lost, 0); assert.ok(r.preserved.every(x => x.status === 'identical') && r.preserved.length === 6);
  assert.equal(r.prompts.blueprintIdentical, true); assert.equal(r.prompts.customPrompts.length, 9);
  assert.deepEqual(r.notGenerated.volumesWithoutManuscript, [2, 3, 4, 5, 6]); assert.deepEqual(r.repaired, []);
  assert.ok(r.conflicts.some(c => c.id === 'turn-type@v1') && r.findings.some(f => f.id === 'DW01'));
  const d = await project(MIGRATED);
  assert.equal(d.project.status, 'ready'); assert.deepEqual(d.project.approvals, {}); assert.equal(d.project.running, false);
  assert.ok(!d.artifacts.script_1 && !Object.keys(d.artifacts).some(k => k.startsWith('ill_')), 'nimic generat');
  assert.equal(d.artifacts.series.version, SRC.artifacts.series.version, 'numerele de versiune originale păstrate');
  for (const ref of d.project.refs) { const b = Buffer.from(await (await api('GET', `/files/${MIGRATED}/${ref.file}`, undefined, { raw: true })).arrayBuffer()); assert.equal(sha(b), plan.body.refs.find(x => x.file === ref.file).sha256, 'referința originală byte-identică'); }
  const raw = path.join(process.env.WP_TMP, 'data', 'projects', MIGRATED, 'raw'); const rawFile = fs.readdirSync(raw)[0];
  assert.equal(sha(fs.readFileSync(path.join(raw, rawFile))), sha(DWZIP), 'sursa brută păstrată');
  const h = await api('GET', `projects/${MIGRATED}/artifacts/series/history`); assert.ok(h.body.variants.versions.every(v => v.pins.includes('migration')));
  const canon = await api('GET', `projects/${MIGRATED}/canon`); assert.ok(canon.body.conflicts.some(c => c.id === 'finding:DW01'));
  assert.ok(d.artifacts.canon_typed.content.landmarks.some(l => l.status === 'parsed' && l.relative_size.rank === 'largest'), 'DW03: relative_size JSON tipizat, brut păstrat');
});

test('P2-T05 API: migrarea duplicată este idempotentă — același proiect, niciun duplicat', async () => {
  const before = (await api('GET', 'state')).body.projects.length;
  const plan = (await post('migrations/plan', DWZIP)).body;
  const again = await post(`migrations/run?plan=${plan.planHash}`, DWZIP);
  assert.equal(again.status, 200); assert.equal(again.body.alreadyMigrated, true); assert.equal(again.body.projectId, MIGRATED);
  assert.equal((await api('GET', 'state')).body.projects.length, before);
  assert.ok((await api('GET', 'migrations')).body.runs.some(x => x.status === 'committed' && x.projectId === MIGRATED));
});

test('P2-T05 API: roundtrip v1 → țintă → v2 → țintă, fără pierderi; 6/72/12 și istoric păstrate', async () => {
  const exp = Buffer.from(await (await api('GET', `projects/${MIGRATED}/export.zip`, undefined, { raw: true })).arrayBuffer());
  const files = readZip(exp), root = [...files.keys()].find(k => k.endsWith('/project.json')).replace('project.json', '');
  const doc = JSON.parse(files.get(root + 'project.json').toString()), man = JSON.parse(files.get(root + 'manifest.json').toString());
  assert.equal(doc.version, 2); assert.equal(man.version, 2); assert.ok(man.files.some(f => f.path.startsWith('files/raw/')), 'sursa brută călătorește');
  assert.ok(doc.versions.series.length >= 1 && doc.versions.series.every(v => v.pins.some(p => p.reason === 'migration')));
  const imp = await post('projects/import', exp); assert.equal(imp.status, 200, JSON.stringify(imp.body));
  const d = await project(imp.body.id);
  for (const k of Object.keys(SRC.artifacts)) assert.equal(canonicalHash(d.artifacts[k].content), canonicalHash(SRC.artifacts[k].content), `${k} identic cu sursa originală`);
  assert.equal(d.artifacts.series.content.volumes.length, 6); assert.equal(d.artifacts.series.content.volumes.reduce((n, v) => n + v.page_plan.length, 0), 72); assert.equal(d.artifacts.script_0.content.pages.length, 12);
  assert.deepEqual(d.project.approvals, {}); assert.equal(d.project.importedEvidence.authority, 'none');
  const h = await api('GET', `projects/${imp.body.id}/artifacts/series/history`); assert.ok(h.body.variants.versions.length >= 1);
  await api('POST', `projects/${imp.body.id}/archive`, { archived: true });
});

test('P2-T05 API: pachet v2 cu hash corupt, asset lipsă, fișier lipsă sau schemă nesuportată este respins fără proiect parțial', async () => {
  const before = (await api('GET', 'state')).body.projects.length;
  const exp = Buffer.from(await (await api('GET', `projects/${MIGRATED}/export.zip`, undefined, { raw: true })).arrayBuffer());
  const entries = [...readZip(exp)]; const root = entries.find(([k]) => k.endsWith('/project.json'))[0].replace('project.json', '');
  const rebuild = fn => zip(fn(entries.map(([name, data]) => ({ name, data: Buffer.from(data) }))).filter(Boolean));
  const png = entries.find(([k]) => k.endsWith('.png'))[0];
  let r = await post('projects/import', rebuild(list => list.map(e => (e.name === png ? { ...e, data: Buffer.concat([e.data, Buffer.from('x')]) } : e))));
  assert.equal(r.status, 400); assert.equal(r.body.code, 'package_corrupt');
  r = await post('projects/import', rebuild(list => list.map(e => (e.name === png ? null : e.name === root + 'manifest.json' ? { ...e, data: Buffer.from(JSON.stringify({ ...JSON.parse(e.data), files: JSON.parse(e.data).files.filter(f => root + f.path !== png) })) } : e))));
  assert.equal(r.status, 400); assert.equal(r.body.code, 'package_missing_asset');
  r = await post('projects/import', rebuild(list => list.map(e => (e.name === png ? null : e))));
  assert.equal(r.status, 400); assert.equal(r.body.code, 'package_missing_file');
  r = await post('projects/import', rebuild(list => list.map(e => (e.name === root + 'project.json' ? { ...e, data: Buffer.from(JSON.stringify({ ...JSON.parse(e.data), version: 9 })) } : e))));
  assert.equal(r.status, 400); assert.equal(r.body.code, 'unsupported_schema');
  assert.equal((await api('GET', 'state')).body.projects.length, before, 'niciun proiect parțial');
});

test('P2-T05: eroare în mijlocul migrării → proiectul nou este retras, rularea marcată eșuată; reluarea reușește', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-mig-')); const { LocalStorage } = await import('../server/storage/local.js'); const { applyMigrations } = await import('../server/persistence/migrations.js'); const { Repo } = await import('../server/repo.js');
  const s = new LocalStorage(dir); await s.init(); await applyMigrations(s); const repo = new Repo(s); await repo.load();
  const { planMigration, runMigration, listMigrations } = await import('../server/migration/migrator.js');
  const plan = planMigration(DWZIP);
  await assert.rejects(runMigration(repo, s, DWZIP, { planHash: plan.planHash, faultAt: 'after-pins' }), e => e.code === 'migration_fault');
  assert.equal(repo.listProjects().length, 0); assert.deepEqual((await s.list('projects')).filter(d => d.dir), [], 'niciun folder de proiect rămas');
  assert.equal((await listMigrations(s))[0].status, 'failed');
  const ok = await runMigration(repo, s, DWZIP, { planHash: plan.planHash });
  assert.equal(ok.status, 'committed'); assert.equal(repo.listProjects().length, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P2-T05 API: arhiva v1 originală rămâne importabilă (compatibilitate)', async () => {
  const r = await post('projects/import', DWZIP); assert.equal(r.status, 200);
  const d = await project(r.body.id); assert.equal(Object.keys(d.artifacts).length, 6); assert.equal(d.artifacts.script_0.version, SRC.artifacts.script_0.version);
  await api('POST', `projects/${r.body.id}/archive`, { archived: true });
  await api('POST', `projects/${MIGRATED}/archive`, { archived: true });
});
