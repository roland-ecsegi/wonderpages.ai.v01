// TEST-P8-T05/T06 (partea software) — Dinosaur World: calea implementată fără furnizor și fără decizii rulează pe o copie
// (original neschimbat, migrare fără pierderi, aprobări neinventate, poarta pilotului), blocajele reale sunt listate exact;
// pachetul Enterprise dus-întors nu pierde nimic și reimportă cu aprobări în așteptare; aplicația generică nu conține
// specificul DW și rulează alte teme/vârste (5–6, 7–8) fără cod de temă. Ieșirile simulate NU sunt dovezi de calitate DW.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, setFake, project, waitStatus, waitFor, connectCanva, INPUT, ROOT } from './lib.mjs';
import { dwStatus, dwRoundtrip, DW_ZIP } from '../scripts/enterprise/dw-status.mjs';
import { CANON_FACTS } from '../server/knowledge/store.js';

test('P8-T05: starea reală DW — BLOCKED de furnizor + deciziile operatorului; nimic inventat, originalul neschimbat', async () => {
  const r = await dwStatus();
  assert.equal(r.status, 'BLOCKED'); assert.equal(r.original.unchanged, true);
  assert.equal(r.migration.status, 'committed'); assert.equal(r.migration.lost, 0); assert.equal(r.migration.changed, 0); assert.ok(r.migration.preserved >= 6); assert.equal(r.migration.approvals, 0, 'nicio aprobare inventată');
  assert.deepEqual(r.reconcile.map(c => c.id), ['DW01', 'DW02']);
  assert.deepEqual(r.pilotGate.map(x => x.allowed), [true, false, false, false, false, false], 'V2–6 blocate până la acceptarea pilotului');
  assert.deepEqual(r.blockers.map(b => b.id), ['DW01', 'DW02', 'GATES', 'PROVIDER', 'PILOT', 'V2-6']);
  assert.ok(r.blockers.filter(b => b.kind === 'operator_decision').length >= 4); assert.ok(r.blockers.some(b => b.kind === 'provider'));
  assert.deepEqual(Object.values(r.acceptance).slice(0, 4), [false, false, false, false], 'acceptarea AC-P8-T05 nu este pretinsă');
  assert.equal(r.content.reduce((n, v) => n + v.illustrations, 0), 0, 'nicio artă DW nu există încă: nu se raportează ca produsă');
  assert.ok(fs.existsSync(DW_ZIP));
});

test('P8-T06: pachetul Enterprise DW dus-întors — toate artefactele și sursa brută identice, proiect nou, aprobări în așteptare', async () => {
  const r = await dwRoundtrip();
  assert.equal(r.status, 'PASS', JSON.stringify(r)); assert.equal(r.lost, 0); assert.deepEqual(r.changed, []); assert.equal(r.rawSourceIdentical, true);
  assert.equal(r.newProjectId, true); assert.equal(r.approvalsAfterImport, 0); assert.equal(r.statusAfterImport, 'ready');
});

test('P8-T06 genericitate: codul generic nu conține specificul DW (faptele canonice sunt date); adaptorul de migrare este separat', () => {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
  const FIXTURES = ['server/quality/evaluation.js'];   // gold-set evaluator fixture (calibration data quoted by the gold replies), not production logic
  const re = /\b(tia|milo|pebble|pietricic\w*|dinosaur world|DW-V1|dinosaur-world)\b/i, hits = [];
  for (const f of walk(path.join(ROOT, 'server')).filter(f => f.endsWith('.js'))) { const rel = path.relative(ROOT, f).split(path.sep).join('/'); if (rel.startsWith('server/migration/') || FIXTURES.includes(rel)) continue; strip(fs.readFileSync(f, 'utf8')).split('\n').forEach((l, i) => { if (re.test(l)) hits.push(`${rel}: ${l.trim().slice(0, 80)}`); }); }
  assert.deepEqual(hits, []);
  assert.equal(CANON_FACTS[0].id, 'DW-V1-p9'); assert.ok(JSON.parse(fs.readFileSync(path.join(ROOT, 'seeds/canon-facts.json'), 'utf8')).facts.length >= 1, 'faptul canonic DW vine din date');
});

test('P8-T06 genericitate: aceeași aplicație rulează alte teme pentru 5–6 și 7–8 până la poarta colecției (furnizori simulați: genericitate, nu calitate)', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva(); await api('PUT', 'settings/budget', { budget5h: 1000, budget7d: 5000 });
  for (const [age, idea, title] of [['5-6', 'O balenă mică învață să cânte cu valurile mării', 'Cântecul mării'], ['7-8', 'Doi copii construiesc o rachetă din carton și explorează Luna', 'Racheta de carton']]) {
    for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
    const c = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, target_age: age, short_description: idea, title } }); assert.equal(c.status, 200, JSON.stringify(c.body));
    await waitFor(async () => !(await api('GET', 'state')).body.projects.some(x => x.running) || null, { label: 'niciun proiect activ', timeout: 120000 });
    assert.equal((await api('POST', `projects/${c.body.id}/start`)).status, 200); const p = await waitStatus(c.body.id, ['awaiting_review']); assert.equal(p.gate.key, 'review_collection');
    const d = await project(c.body.id); assert.equal(d.project.input.target_age, age); assert.equal(d.artifacts.series.content.volumes.length, 6, `${age}: 6 volume`);
    await api('POST', `projects/${c.body.id}/archive`, { archived: true });
  }
});
