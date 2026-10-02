// TEST-P6-T03 — gri de umplere vs margini netezite, regiunea minimă la formate diferite, schimbarea culorii sursă și
// eșecul derivării: spații și contururi utilizabile la dimensiunea de tipar; hash-ul culorii intact la „doar colorat”;
// candidatul eșuat păstrat; nicio acceptare automată.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { api, setFake, waitStatus, waitFor, connectCanva, approveAll, INPUT, project, ROOT, BASE } from './lib.mjs';
import { measureColoring, coloringQA, COLORING_QA_VERSION } from '../server/quality/coloring.js';
import { readZip } from '../server/security/safe-zip.js';

const { PNG } = createRequire(path.join(ROOT, 'package.json'))('pngjs');
const BP = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8'));
const PROJ = age => ({ input: { target_age: age, page_format: 'portrait45' } });
/* a grid colouring page: `cell` px cells, `stroke` px lines; optional anti-aliased edges or a grey filled block */
function grid({ w = 1000, h = 1250, cell = 160, stroke = 8, aa = false, greyFill = false } = {}) {
  const png = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x % cell, dy = y % cell; let v = dx < stroke || dy < stroke ? 0 : 255;
    if (aa && v === 255 && (dx === stroke || dy === stroke || dx === cell - 1 || dy === cell - 1)) v = 140;   // smoothed edge next to the line
    if (greyFill && v === 255 && x > 300 && x < 460 && y > 300 && y < 460 && dx > stroke + 6 && dy > stroke + 6 && dx < cell - 7 && dy < cell - 7) v = 170;   // shading far from the lines
    const i = (y * w + x) * 4; png.data[i] = png.data[i + 1] = png.data[i + 2] = v; png.data[i + 3] = 255;
  }
  return PNG.sync.write(png);
}

test('P6-T03: marginile netezite trec; o zonă gri de umplere (umbră) nu trece — și este numită', () => {
  const ok = coloringQA(grid({ aa: true }), { bp: BP, project: PROJ('5-6') });
  assert.equal(ok.ok, true, JSON.stringify(ok.issues)); assert.equal(ok.version, COLORING_QA_VERSION); assert.ok(ok.metrics.grayEdge > 0, 'margini gri prezente și tolerate');
  const bad = coloringQA(grid({ greyFill: true }), { bp: BP, project: PROJ('5-6') });
  assert.equal(bad.ok, false); assert.ok(bad.issues.some(i => /umbre|gri/.test(i)), JSON.stringify(bad.issues));
});

test('P6-T03: regiunea minimă depinde de formatul fizic — aceeași pagină trece la 8×10 și pică la 4×5 (3-4 ani)', () => {
  const prof = BP.age_profiles['3-4'], buf = grid();
  const big = measureColoring(buf, { trimW: 8, trimH: 10, profile: prof });
  assert.equal(big.ok, true, JSON.stringify(big)); assert.ok(big.metrics.usableRegions >= 30); assert.ok(Math.abs(big.metrics.ppi - 125) < 1);
  const small = measureColoring(buf, { trimW: 4, trimH: 5, profile: prof });
  assert.equal(small.ok, false); assert.ok(small.issues.some(i => /prea mici|prea puține/.test(i)), JSON.stringify(small.issues));
  assert.ok(small.metrics.smallRegions > big.metrics.smallRegions && small.metrics.smallestMm2 < prof.min_region, JSON.stringify([small.metrics, big.metrics]));
  const thin = grid({ stroke: 2 });
  assert.ok(measureColoring(thin, { trimW: 8, trimH: 10, profile: prof }).issues.some(i => /subțiri/.test(i)), 'contur de 0,4 mm prea subțire pentru 3-4');
  assert.ok(!measureColoring(thin, { trimW: 8, trimH: 10, profile: BP.age_profiles['7-8'] }).issues.some(i => /subțiri/.test(i)), 'acceptabil pentru 7-8');
});

test('P6-T03: măsurarea se face după plasare (aceeași încadrare ca pagina color)', () => {
  const sq = grid({ w: 1000, h: 1000 }), q = coloringQA(sq, { bp: BP, project: PROJ('5-6'), preset: 'digital' });
  assert.equal(q.physical.metrics.window.w, 800, 'pătratul pe pagina 4:5 pierde 20% din lățime, ca în export'); assert.equal(q.physical.metrics.window.h, 1000);
  const prot = coloringQA(sq, { bp: BP, project: PROJ('5-6'), preset: 'digital', ill: { regions: [{ id: 'milo.spots', x: 0.04, y: 0.4, w: 0.06, h: 0.1 }] } });
  assert.ok(prot.physical.print.crop.x < q.physical.print.crop.x, 'încadrarea se mută ca să păstreze reperul protejat');
});

test('P6-T03 Dinosaur World: p9 — Tia cu frunza în gură și cele trei pete ale lui Milo intră în contractul paginii de colorat; liniile lipsă se generează în P8', () => {
  const doc = JSON.parse([...readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')))].find(([k]) => k.endsWith('/project.json'))[1].toString());
  const p9 = doc.artifacts.script_0.content.pages[8], milo = doc.artifacts.bible.content.characters.find(c => c.id === 'milo');
  assert.match(p9.coloring_scene, /Tia holds the leaf stem in her mouth/); assert.match(p9.coloring_scene, /identity marks/);
  assert.equal((milo.visual_landmarks || []).filter(l => /^spot-/.test(l.id)).length, 3);
  assert.match(BP.templates.lineart_image, /colour regions as separate closed areas \(e\.g\. belly, spots, frill\)/); assert.match(BP.templates.lineart_image, /same hold on objects/);
  assert.ok(!Object.keys(doc.artifacts).some(k => /^ill_/.test(k)), 'nicio pagină de colorat încă: se măsoară când există (P8)');
});

test('P6-T03 API: raport la tipar; candidatul subțire respins păstrează linia bună și culoarea; derivarea eșuată păstrează tot; culoarea nouă face linia depășită; nicio acceptare automată', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Colorat P6' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']); await approveAll(id);
  await waitStatus(id, ['awaiting_review']); await approveAll(id); await waitStatus(id, ['awaiting_review']);
  let d = await project(id); assert.equal(d.project.gate.key, 'review_2');
  const rep = (await api('GET', `projects/${id}/coloring/1?preset=print`)).body; assert.equal(rep.schema, 'wonderpages.coloring-report/1');
  const p4 = rep.pages.find(x => x.p === 4); assert.equal(p4.status, 'pass', JSON.stringify(p4)); assert.ok(p4.measured.metrics.strokeMedianMm > 0 && p4.measured.metrics.usableRegions >= 3); assert.equal(p4.stored.version, COLORING_QA_VERSION);
  const lineCmd = async (p, note) => { const n = (await project(id)).project.repairs?.length || 0; const pv = (await api('POST', `projects/${id}/workbench/1/${p}/preview`, { command: 'line', payload: { note } })).body; assert.equal(pv.applicable, true, JSON.stringify(pv));
    assert.equal((await api('POST', `projects/${id}/workbench/1/${p}/commit`, { command: 'line', payload: { note }, previewHash: pv.previewHash })).status, 200);
    await waitFor(async () => { const x = (await project(id)).project; return (x.repairs?.length || 0) > n && !x.running && x.status === 'awaiting_review'; }, { label: 'linie' }); return project(id); };

  /* a failing candidate (hairlines, tiny cells) is retained; the good colouring page and the colour stay */
  const before4 = d.artifacts.ill_0_4.content; setFake({ lineThin: true });
  d = await lineCmd(4, 'mai multe detalii');
  const c4 = d.artifacts.ill_0_4.content; assert.equal(c4.color, before4.color, 'culoarea neatinsă'); assert.equal(c4.lineart, before4.lineart, 'pagina bună rămâne');
  assert.equal(c4.lineCandidates.at(-1).qa.ok, false); assert.ok(c4.lineCandidates.at(-1).qa.issues.some(i => /prea mici|subțiri|puține/.test(i)), JSON.stringify(c4.lineCandidates.at(-1).qa.issues)); assert.ok(c4.lineRejected);
  assert.ok((await fetch(`${BASE}/files/${id}/${c4.lineCandidates.at(-1).file}`)).status === 200, 'candidatul eșuat rămâne inspectabil');

  /* derivation failure: colour and the good colouring page stay, the failure is recorded */
  const before5 = d.artifacts.ill_0_5.content; setFake({ lineFail: true });
  d = await lineCmd(5, 'linii mai groase');
  const c5 = d.artifacts.ill_0_5.content; assert.equal(c5.color, before5.color); assert.equal(c5.lineart, before5.lineart); assert.ok(c5.lineCandidates.at(-1).error, JSON.stringify(c5.lineCandidates));
  setFake({});

  /* a passing line repair is never auto-approved */
  d = await lineCmd(3, 'linii mai groase'); const items = (await api('GET', `projects/${id}`)).body.review?.items || [];
  const it3 = items.find(i => i.id === 'img:ill_0_3:line'); if (it3) assert.notEqual(it3.state, 'approved', 'nicio acceptare automată');
  assert.equal(d.artifacts.ill_0_3.content.lineQA.ok, true); assert.equal(d.artifacts.ill_0_3.content.lineQA.colorFrom, d.artifacts.ill_0_3.content.color);

  /* source colour change → colouring page stale */
  const png = Buffer.from(await (await fetch(`${BASE}/files/${id}/${d.artifacts.ill_0_6.content.color}`)).arrayBuffer());
  assert.equal((await api('POST', `projects/${id}/artifacts/ill_0_6/media`, { mode: 'color', data: png.toString('base64') })).status, 200);
  const rep2 = (await api('GET', `projects/${id}/coloring/1`)).body; assert.equal(rep2.pages.find(x => x.p === 6).status, 'stale');
  const wb6 = (await api('GET', `projects/${id}/workbench/1/6`)).body; assert.equal(wb6.verdicts.coloring.stale, true);
  await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});
