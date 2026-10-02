// TEST-P2-T03 — peste 5 candidați și pin pe varianta aprobată, restaurare și retenție dry-run; hash-urile vechi și
// re-legarea dependențelor; nicio pierdere a artei aprobate după mai mult de cinci încercări.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { api, INPUT, ROOT } from './lib.mjs';
import { LocalStorage } from '../server/storage/local.js';
import { applyMigrations } from '../server/persistence/migrations.js';
import { Repo } from '../server/repo.js';
import { listVersions, getVersion, pinVersion, variantSet, retentionPlan, applyRetention, backfillVersions } from '../server/persistence/artifact-store.js';
import { canonicalHash } from '../server/domain/canonical.js';
import { sceneFingerprint } from '../server/contracts.js';

const BP = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8'));
async function setup(pid) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-var-')); const s = new LocalStorage(dir); await s.init(); await applyMigrations(s); const repo = new Repo(s); await repo.createProject({ id: pid, title: 'V', status: 'ready', input: {}, options: { images: false } }, BP); return { s, repo, dir }; }

test('P2-T03: 8 încercări → toate versiunile imuabile rămân; varianta aprobată este fixată și selectabilă', async () => {
  const { s, repo, dir } = await setup('pvar00001');
  for (let i = 1; i <= 8; i++) await repo.writeArtifact('pvar00001', 'ill_0_4', { color: `images/c${i}.png`, try: i }, { keep: 3, by: 'agent' });
  const art = await repo.artifacts('pvar00001');
  assert.equal(art.ill_0_4.versions.length, 3, 'istoricul încorporat v04 rămâne scurt');
  const all = await listVersions(s, 'pvar00001', 'ill_0_4');
  assert.deepEqual(all.map(v => v.version), [1, 2, 3, 4, 5, 6, 7, 8], 'stocul imuabil le are pe toate');
  assert.ok(all.every(v => v.hash === canonicalHash(v.content)));
  await pinVersion(s, 'pvar00001', 'ill_0_4', 3, { reason: 'approved', ref: { gate: 'review_1@0' } });
  const set = await variantSet(s, 'pvar00001', 'ill_0_4', art.ill_0_4);
  assert.equal(set.versions.find(v => v.version === 3).status, 'approved'); assert.equal(set.versions.find(v => v.version === 8).status, 'current');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P2-T03: retenția este dry-run; aprobatul, curentul și ce e referit nu se șterg; planul vechi este refuzat', async () => {
  const { s, repo, dir } = await setup('pvar00002');
  for (let i = 1; i <= 8; i++) await repo.writeArtifact('pvar00002', 'final_0', { pages: [{ n: 1, text: 't' + i }] });
  await repo.writeArtifact('pvar00002', 'ill_0_1', { color: 'images/a.png' }, { basedOn: { key: 'final_0', version: 2, pageHash: 'x' } });
  await pinVersion(s, 'pvar00002', 'final_0', 1, { reason: 'approved' });
  const before = (await listVersions(s, 'pvar00002', 'final_0')).map(v => [v.version, v.hash]);
  const plan = await retentionPlan(s, 'pvar00002', await repo.artifacts('pvar00002'), { keepUnpinned: 2 });
  assert.deepEqual(plan.remove.filter(r => r.key === 'final_0').map(r => r.version), [3, 4, 5]);
  assert.equal((await listVersions(s, 'pvar00002', 'final_0')).length, 8, 'dry-run: nimic șters');
  await assert.rejects(applyRetention(s, 'pvar00002', await repo.artifacts('pvar00002'), 'wrong', { keepUnpinned: 2 }), e => e.code === 'plan_conflict');
  assert.deepEqual((await applyRetention(s, 'pvar00002', await repo.artifacts('pvar00002'), plan.planHash, { keepUnpinned: 2 })), { removed: 3 });
  const after = await listVersions(s, 'pvar00002', 'final_0');
  assert.deepEqual(after.map(v => v.version), [1, 2, 6, 7, 8], 'v1 aprobat, v2 referit de ilustrație, ultimele două și curentul');
  for (const v of after) assert.equal(v.hash, before.find(b => b[0] === v.version)[1], 'hash-urile vechi neschimbate');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P2-T03: restaurarea creează o versiune nouă cu lineage; trecutul nu se rescrie; corupția este detectată', async () => {
  const p = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Variante' } }); const pid = p.body.id;
  for (let i = 1; i <= 7; i++) assert.equal((await api('POST', `projects/${pid}/artifacts/brief`, { content: { title: 'B' + i } })).status, 200);
  let h = await api('GET', `projects/${pid}/artifacts/brief/history`);
  assert.equal(h.body.versions.length, 6, 'istoricul complet (6 anterioare), nu doar 5'); assert.equal(h.body.variants.versions.length, 7);
  const v2hash = h.body.variants.versions.find(v => v.version === 2).hash;
  const r = await api('POST', `projects/${pid}/artifacts/brief/restore`, { version: 2 });
  assert.equal(r.status, 200); assert.equal(r.body.version, 8); assert.equal(r.body.restoredFrom, 2);
  h = await api('GET', `projects/${pid}/artifacts/brief/history`);
  assert.equal(h.body.current.content.title, 'B2'); assert.equal(h.body.variants.versions.find(v => v.version === 2).hash, v2hash, 'versiunea 2 neatinsă');
  assert.deepEqual(h.body.variants.versions.find(v => v.version === 8).restoredFrom, { version: 2, hash: v2hash });
  const pin = await api('POST', `projects/${pid}/variants/brief/pin`, { version: 5, note: 'favorit' }); assert.equal(pin.status, 200);
  const plan = await api('GET', `projects/${pid}/retention?keep=1`); assert.ok(!plan.body.remove.some(x => x.key === 'brief' && x.version === 5));
  const vfile = path.join(process.env.WP_TMP, 'data', 'projects', pid, 'versions', 'brief', '3.json'); const d = JSON.parse(fs.readFileSync(vfile, 'utf8')); d.content.title = 'tampered'; fs.writeFileSync(vfile, JSON.stringify(d));
  const bad = await api('POST', `projects/${pid}/artifacts/brief/restore`, { version: 3 }); assert.equal(bad.status, 409); assert.equal(bad.body.code, 'version_corrupt');
  await api('POST', `projects/${pid}/archive`, { archived: true });
});

test('P2-T03: re-legarea dependențelor după restaurare: scena identică → legat, scena diferită → rămâne expirat', async () => {
  const { s, repo, dir } = await setup('pvar00003');
  const page = scene => ({ n: 4, text: 'Milo', scene, characters: ['milo'] });
  const v1 = Array.from({ length: 12 }, (_, i) => (i === 3 ? page('meadow at noon') : { n: i + 1, text: 'x', scene: 's' + i }));
  await repo.writeArtifact('pvar00003', 'final_0', { pages: v1 });
  await repo.writeArtifact('pvar00003', 'ill_0_4', { color: 'images/p4.png' }, { basedOn: { key: 'final_0', version: 1, pageHash: sceneFingerprint(v1[3]) } });
  const v2 = structuredClone(v1); v2[3] = page('meadow at dusk'); await repo.writeArtifact('pvar00003', 'final_0', { pages: v2 });
  await repo.writeArtifact('pvar00003', 'ill_0_5', { color: 'images/p5.png' }, { basedOn: { key: 'final_0', version: 2, pageHash: sceneFingerprint({ ...v2[4], scene: 'only in v2' }) } });
  const edges = await s.list('projects/pvar00003/dependencies'); assert.ok(edges.some(e => e.name === 'ill_0_4@1.json'), 'muchia de lineage este persistată');
  const old = await getVersion(s, 'pvar00003', 'final_0', 1);
  const restored = await repo.writeArtifact('pvar00003', 'final_0', old.content, { restoredFrom: { version: 1, hash: old.hash } });
  const { rebindDependents } = await import('../server/persistence/rebind.js');
  const r = await rebindDependents(repo, 'pvar00003', 'final_0', restored);
  assert.deepEqual(r, [{ key: 'ill_0_4', status: 'rebound' }, { key: 'ill_0_5', status: 'stale' }]);
  assert.equal((await repo.artifacts('pvar00003')).ill_0_4.basedOn.version, 3, 'legat de versiunea restaurată');
  assert.equal(restored.version, 3); assert.deepEqual((await getVersion(s, 'pvar00003', 'final_0', 3)).restoredFrom, { version: 1, hash: old.hash });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P2-T03: backfill din istoricul legacy nu inventează versiuni', async () => {
  const { s, dir } = await setup('pvar00004');
  const legacy = { key: 'script_0', version: 3, content: { t: 3 }, versions: [{ version: 2, content: { t: 2 } }, { version: 1, content: { t: 1 } }] };
  assert.equal(await backfillVersions(s, 'pvar00004', 'script_0', legacy), 3);
  assert.deepEqual((await listVersions(s, 'pvar00004', 'script_0')).map(v => [v.version, v.source]), [[1, 'backfill'], [2, 'backfill'], [3, 'backfill']]);
  assert.equal(await backfillVersions(s, 'pvar00004', 'script_0', legacy), 0, 'idempotent');
  assert.equal(await backfillVersions(s, 'pvar00004', 'cast', { key: 'cast', version: 1, content: {} }), 1);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P2-T03: aprobarea unui element fixează exact versiunea aprobată', async () => {
  const { s, repo, dir } = await setup('pvar00005');
  const { initEngine, setItemDecisions } = await import('../server/engine.js'); initEngine(repo, {});
  for (const k of ['brief', 'series', 'bible', 'cast']) { await repo.writeArtifact('pvar00005', k, { v: 1 }); await repo.writeArtifact('pvar00005', k, { v: 2 }); }
  await repo.patchProject('pvar00005', { gate: { key: 'review_collection', vol: null, round: 1 }, approvals: {} });
  await setItemDecisions('pvar00005', [{ id: 'doc:brief', state: 'approved' }]);
  const v2 = await getVersion(s, 'pvar00005', 'brief', 2), v1 = await getVersion(s, 'pvar00005', 'brief', 1);
  assert.equal(v2.pinned, true); assert.equal(v2.pins[0].reason, 'approved'); assert.equal(v2.pins[0].ref.item, 'doc:brief'); assert.equal(v1.pinned, false);
  fs.rmSync(dir, { recursive: true, force: true });
});
