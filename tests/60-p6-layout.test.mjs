// TEST-P6-T01 — text lung RO/EN, diacritice și font/glife lipsă, încercare de font mic, încadrare pe coarne/pete,
// pagină fără text și machetă repetată cu motiv intenționat: fără depășire/tăiere, fără font sub profil, variația
// machetei justificată, încadrarea protejează invarianții, raportul de măsurare identic în previzualizare și export.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { api, setFake, waitStatus, approveAll, connectCanva, INPUT, project, ROOT } from './lib.mjs';
import { planLayout, loadShared, familyFor, geometryFor } from '../server/domain/layout.js';
import { parseTTF, buildMetrics } from '../server/domain/font-metrics.js';
import { readZip } from '../server/security/safe-zip.js';

const BP = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8'));
const PROJ = (age = '5-6') => ({ input: { target_age: age, page_format: 'portrait45', language: 'English', second_language: 'Romanian' } });
const EN = 'Milo walks to the meadow.', RO = 'Milo merge spre pajiște.';
const art = (en = () => EN, ro = () => RO, extra = () => ({})) => ({
  final_0: { content: { pages: Array.from({ length: 12 }, (_, i) => ({ n: i + 1, text: en(i + 1), layout: { family: ['action', 'dialogue', 'panorama', 'intimate'][i % 4], text_zone: i % 2 ? 'top' : 'bottom' }, ...extra(i + 1) })) } },
  tr_0: { content: { pages: Array.from({ length: 12 }, (_, i) => ({ n: i + 1, text: ro(i + 1) })) } }
});
const page = (pl, n) => pl.pages.find(p => p.n === n);
const codes = (pl, n) => page(pl, n).findings.map(f => f.code);

test('P6-T01: metricile partajate provin chiar din fișierele TTF (hash-ul fontului) și includ diacriticele românești', () => {
  const t = parseTTF(fs.readFileSync(path.join(ROOT, 'public/fonts/Andika-Regular.ttf')));
  for (const c of 'șțăîâŞŢşţ') assert.ok(t.advances[c.codePointAt(0)] > 0, c);
  assert.equal(t.advances[0x1F995], undefined, 'emoji nu este în font');
  const committed = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/fonts/andika-metrics.json'), 'utf8'));
  assert.equal(buildMetrics(path.join(ROOT, 'public/fonts')).hash, committed.hash, 'metricile publicate corespund fonturilor instalate');
});

test('P6-T01: text lung EN/RO — fiecare limbă măsurată în spațiul ei; macheta se schimbă numai cu dovadă; fontul nu scade', () => {
  const longEn = 'Milo tiptoed past the tall ferns, the sleepy stones and the quiet pond, looking for the shiny pebble his friend had lost.';
  const longRo = 'Milo a trecut în vârful picioarelor pe lângă ferigile înalte, pietrele adormite și iazul liniștit, căutând pietricica strălucitoare pierdută de prietena lui, Tia, încă de dimineață.';
  const a = art(n => n === 2 ? longEn : EN, n => n === 2 ? longRo : RO);
  const pl = planLayout({ bp: BP, project: PROJ('5-6'), art: a, v: 0 });
  const p2 = page(pl, 2);
  assert.ok(p2.textBlocks.first.lines.length >= 1 && p2.textBlocks.second.lines.length > p2.textBlocks.first.lines.length, 'RO are propriile rânduri');
  assert.equal(p2.sizePt, 20, 'profilul 5-6 = 20 pt');
  assert.ok(Object.values(p2.textBlocks).every(t => t.fits), 'ambele limbi încap în macheta aleasă');
  if (p2.adjusted) { assert.equal(p2.source, 'adjusted'); assert.ok(p2.adjusted.evidence.some(e => /Romanian/.test(e)), 'dovada numește limba care nu încăpea'); }
  /* the dialogue family (narrow) does not hold a very long RO page: adjusted with evidence, never shrunk */
  const veryLong = Array(2).fill(longRo).join(' ');
  const b = planLayout({ bp: BP, project: PROJ('5-6'), art: art(() => EN, n => n === 2 ? veryLong : RO), v: 0 });
  const q = page(b, 2);
  assert.ok(q.adjusted, JSON.stringify(q.findings)); assert.deepEqual(q.adjusted.from, { family: 'dialogue', zone: 'top' }); assert.match(q.reason, /Schimbată cu dovadă: Romanian: depășește zona cu/);
  assert.equal(q.sizePt, 20); assert.ok(codes(b, 2).includes('LAYOUT_ADJUSTED')); assert.equal(b.blocking, 0);
  /* impossible: no layout holds it → blocked with the exact overflow, never clipped */
  const c = planLayout({ bp: BP, project: PROJ('3-4'), art: art(() => EN, n => n === 2 ? Array(9).fill(longRo).join(' ') : RO), v: 0 });
  const of = page(c, 2).findings.find(f => f.code === 'TEXT_OVERFLOW');
  assert.ok(of && of.blocking && of.language === 'Romanian' && of.overflow.byPt > 0, JSON.stringify(page(c, 2).findings));
  assert.equal(page(c, 2).sizePt, 26, 'fontul profilului 3-4 rămâne 26 pt'); assert.equal(c.ok, false);
  assert.ok(!codes(c, 2).includes('GLYPH_MISSING'));
});

test('P6-T01: diacritice compuse/descompuse măsurate identic; caracterele absente din font blochează cu codul exact', () => {
  const S = loadShared(), g = S.geometry(geometryFor(BP, PROJ())); const f = t => S.fitText(t, { geom: g, zone: 'bottom', family: 'panorama', sizePt: 20, weight: 400 });
  const composed = 'Puiul a găsit o pietricică lângă țărm, și s-a bucurat.', decomposed = composed.normalize('NFD');
  assert.notEqual(composed, decomposed); assert.deepEqual(f(decomposed), f(composed), 'NFC: aceleași rânduri și aceleași măsuri');
  assert.deepEqual(f(composed).missing, []);
  const pl = planLayout({ bp: BP, project: PROJ(), art: art(n => n === 4 ? 'Milo found a 🦕 toy.' : EN, n => n === 5 ? 'Milo a găsit 恐竜.' : RO), v: 0 });
  const g4 = page(pl, 4).findings.find(x => x.code === 'GLYPH_MISSING'), g5 = page(pl, 5).findings.find(x => x.code === 'GLYPH_MISSING');
  assert.ok(g4.blocking && /U\+1F995/.test(g4.message) && g4.language === 'English'); assert.ok(g5.blocking && g5.language === 'Romanian' && g5.chars.length === 2);
});

test('P6-T01: font lipsă sau înlocuit fără metrici regenerate → nicio măsurare, totul blocat (nu se măsoară cu alt font)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-font-'));
  fs.mkdirSync(path.join(tmp, 'public/app'), { recursive: true }); fs.mkdirSync(path.join(tmp, 'public/fonts'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'public/app/layout-measure.js'), path.join(tmp, 'public/app/layout-measure.js'));
  fs.copyFileSync(path.join(ROOT, 'public/fonts/andika-metrics.json'), path.join(tmp, 'public/fonts/andika-metrics.json'));
  fs.copyFileSync(path.join(ROOT, 'public/fonts/Andika-Regular.ttf'), path.join(tmp, 'public/fonts/Andika-Regular.ttf'));
  let S = loadShared(tmp); assert.deepEqual(S.problems.map(p => p.code), ['FONT_MISSING']);
  let pl = planLayout({ bp: BP, project: PROJ(), art: art(), v: 0, measuring: S });
  assert.ok(pl.findings.some(f => f.code === 'FONT_MISSING' && f.blocking)); assert.equal(pl.ok, false); assert.ok(pl.pages.every(p => !Object.keys(p.textBlocks).length));
  const bold = fs.readFileSync(path.join(ROOT, 'public/fonts/Andika-Bold.ttf')); bold[bold.length - 1] ^= 0xff; fs.writeFileSync(path.join(tmp, 'public/fonts/Andika-Bold.ttf'), bold);
  S = loadShared(tmp); assert.deepEqual(S.problems.map(p => p.code), ['FONT_METRICS_STALE']);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('P6-T01: o încercare de font sub profil este refuzată și raportată; un font mai mare este permis', () => {
  const pl = planLayout({ bp: BP, project: PROJ('3-4'), art: art(() => EN, () => RO, n => n === 3 ? { layout: { family: 'panorama', text_zone: 'bottom', font_pt: 12 } } : n === 6 ? { layout: { family: 'panorama', text_zone: 'top', font_pt: 30 } } : {}), v: 0 });
  assert.equal(page(pl, 3).sizePt, 26); assert.ok(page(pl, 3).findings.some(f => f.code === 'FONT_BELOW_PROFILE' && f.requestedPt === 12 && f.minPt === 26));
  assert.ok(Object.values(page(pl, 3).textBlocks).every(t => t.sizePt === 26)); assert.equal(page(pl, 6).sizePt, 30);
  assert.ok(pl.pages.every(p => p.sizePt >= 26), 'niciun bloc sub profil');
});

test('P6-T01: încadrarea pe coarne/pete — reperul rămâne în zona sigură; tăierea inevitabilă blochează; textul nu acoperă reperul', () => {
  const images = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`ill_0_${i + 1}`, { width: 1024, height: 1024 }]));
  const reg = { 2: [{ id: 'tia.horns', label: 'coarnele Tiei', x: 0.06, y: 0.3, w: 0.08, h: 0.1 }], 3: [{ id: 'milo.spots', label: 'petele lui Milo', x: 0.0, y: 0.4, w: 0.05, h: 0.1 }, { id: 'milo.tail', label: 'coada lui Milo', x: 0.95, y: 0.4, w: 0.05, h: 0.1 }], 5: [{ id: 'tia.horns', label: 'coarnele Tiei', x: 0.4, y: 0.82, w: 0.2, h: 0.1 }] };
  const a = art(); for (let n = 1; n <= 12; n++) a[`ill_0_${n}`] = { content: { color: `images/c${n}.png`, regions: reg[n] || [] } };
  const pl = planLayout({ bp: BP, project: PROJ(), art: a, v: 0, images });
  assert.equal(page(pl, 1).crop.x, 0.1, 'fără reper protejat: centrat'); assert.equal(page(pl, 1).crop.w, 0.8);
  const c2 = page(pl, 2).crop; assert.ok(c2.moved && c2.x <= 0.0225 && !c2.cut.length, JSON.stringify(c2)); assert.ok(!codes(pl, 2).includes('CROP_CUTS_INVARIANT'));
  assert.match(c2.objectPosition, /%/, 'previzualizarea primește aceeași poziție');
  const cut = page(pl, 3).findings.find(f => f.code === 'CROP_CUTS_INVARIANT'); assert.ok(cut?.blocking && cut.regions.includes('coada lui Milo') || cut.regions.includes('petele lui Milo'));
  const p5 = page(pl, 5); assert.equal(p5.zone, 'top', 'textul se mută de pe coarne'); assert.ok(p5.adjusted.evidence.some(e => /acoperă coarnele Tiei/.test(e)), JSON.stringify(p5.adjusted));
});

test('P6-T01: pagina fără text este validă (fără bloc, fără depășire) și nu primește text generat', () => {
  const a = art(n => n === 7 ? '' : EN, n => n === 7 ? '' : RO, n => n === 7 ? { page_type: 'wordless', layout: undefined } : {});
  const pl = planLayout({ bp: BP, project: PROJ(), art: a, v: 0 });
  const p7 = page(pl, 7); assert.equal(p7.wordless, true); assert.deepEqual(p7.textBlocks, {}); assert.equal(p7.family, 'panorama'); assert.match(p7.reason, /fără text/);
  assert.equal(pl.blocking, 0); assert.equal(a.final_0.content.pages[6].text, '');
  assert.equal(familyFor({ text: 'x', turn: { type: 'reveal' } }).family, 'surprise'); assert.equal(familyFor({ text: 'x', dialogue: '„Bună!”' }).family, 'dialogue');
  assert.equal(familyFor({ text: 'x', storyboard: { shot: 'close-up' } }).family, 'intimate');
});

test('P6-T01: aceeași machetă pe trei pagini consecutive este semnalată; refrenul vizual declarat este permis', () => {
  const same = n => [4, 5, 6].includes(n) ? { layout: { family: 'action', text_zone: 'bottom' } } : {};
  let pl = planLayout({ bp: BP, project: PROJ(), art: art(() => EN, () => RO, same), v: 0 });
  const r = pl.findings.find(f => f.code === 'LAYOUT_REPEAT'); assert.deepEqual(r.scope.pages, [4, 5, 6]); assert.equal(r.blocking, false);
  pl = planLayout({ bp: BP, project: PROJ(), art: art(() => EN, () => RO, n => [4, 5, 6].includes(n) ? { layout: { family: 'action', text_zone: 'bottom', motif: n === 5 } } : {}), v: 0 });
  assert.ok(!pl.findings.some(f => f.code === 'LAYOUT_REPEAT'), 'motiv intenționat');
  assert.ok(!planLayout({ bp: BP, project: PROJ(), art: art(), v: 0, motifs: [5] }).findings.some(f => f.code === 'LAYOUT_REPEAT'));
});

test('P6-T01: raportul de măsurare este determinist și identic într-un context separat (codul browserului, alt realm)', () => {
  const pl = planLayout({ bp: BP, project: PROJ(), art: art(), v: 0 });
  assert.equal(planLayout({ bp: BP, project: PROJ(), art: art(), v: 0 }).measurementHash, pl.measurementHash);
  const ctx = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/app/layout-measure.js'), 'utf8'), ctx);
  ctx.WPLayout.setMetrics(JSON.parse(fs.readFileSync(path.join(ROOT, 'public/fonts/andika-metrics.json'), 'utf8')));
  const g = ctx.WPLayout.geometry(pl.geometry);
  for (const p of pl.pages) for (const tb of Object.values(p.textBlocks)) { const again = ctx.WPLayout.fitText(tb.lines.join(' '), { geom: g, zone: p.zone, family: p.family, sizePt: p.sizePt, weight: 400 }); assert.equal(again.lines.join('\n'), tb.lines.join('\n')); assert.equal(again.heightPt, tb.heightPt); }
  assert.equal(ctx.WPLayout.hash(JSON.parse(JSON.stringify({ v: 1, metrics: pl.metricsHash, geo: { ...pl.geometry, pt: undefined }, measurements: pl.measurements }))), pl.measurementHash, 'același hash în alt context');
  const other = planLayout({ bp: BP, project: PROJ(), art: art(n => n === 1 ? EN + ' Again.' : EN), v: 0 }); assert.notEqual(other.measurementHash, pl.measurementHash, 'textul schimbat schimbă hash-ul');
  assert.notEqual(planLayout({ bp: BP, project: PROJ(), art: art(), v: 0, preset: 'kdp' }).measurementHash, pl.measurementHash, 'alt profil, altă măsurare');
});

test('P6-T01 Dinosaur World: machetele V1 valide se păstrează (12/12, EN și RO măsurate la 26 pt), fără modificarea sursei', () => {
  const doc = JSON.parse([...readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')))].find(([k]) => k.endsWith('/project.json'))[1].toString());
  const before = JSON.stringify(doc.artifacts.script_0);
  for (const preset of ['digital', 'print', 'kdp']) {
    const pl = planLayout({ bp: doc.blueprint, project: doc.project, art: doc.artifacts, v: 0, preset });
    assert.equal(pl.ok, true, preset + JSON.stringify(pl.findings)); assert.equal(pl.profile.minFontPt, 26);
    pl.pages.forEach((p, i) => { const src = doc.artifacts.script_0.content.pages[i].layout; assert.equal(p.source, 'existing'); assert.equal(p.family, src.family); assert.equal(p.zone, src.text_zone); assert.deepEqual(Object.keys(p.textBlocks), ['first', 'second']); assert.equal(p.textBlocks.second.language, 'Romanian'); });
  }
  assert.equal(JSON.stringify(doc.artifacts.script_0), before, 'sursa V1 nu se modifică');
});

test('P6-T01 API: planuri pe volum, revizie fixată numai pe hash-ul curent, export cu alt hash refuzat; previzualizarea din browser are aceleași rânduri', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Machetă P6' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']); await approveAll(id); await waitStatus(id, ['awaiting_review']);
  const all = await api('GET', `projects/${id}/layout?preset=digital`); assert.equal(all.status, 200); assert.ok(all.body.plans[0], JSON.stringify(Object.keys(all.body.plans)));
  const one = (await api('GET', `projects/${id}/layout/1?preset=digital`)).body; assert.equal(one.schema, 'wonderpages.layout-plan/1'); assert.equal(one.measurementHash, all.body.plans[0].measurementHash);
  assert.equal((await api('GET', `projects/${id}/layout/1?preset=../x`)).status, 400); assert.equal((await api('GET', `projects/${id}/layout/9`)).status, 400);
  const stale = await api('POST', `projects/${id}/layout/1/revision`, { preset: 'digital', measurementHash: 'deadbeef' }); assert.equal(stale.status, 409); assert.equal(stale.body.code, 'stale_layout');
  if (!one.blocking) { const ok = await api('POST', `projects/${id}/layout/1/revision`, { preset: 'digital', measurementHash: one.measurementHash, note: 'machetă verificată' }); assert.equal(ok.status, 200); assert.equal((await project(id)).project.layoutRevisions[1][0].measurementHash, one.measurementHash); }
  const pdf = Buffer.from('%PDF-1.4\n%%EOF\n');
  const bad = await api('POST', `projects/${id}/exports?name=x.pdf&kind=preview&volume=0&book=story&lang=first&preset=digital&layout=deadbeef`, pdf); assert.equal(bad.status, 409, JSON.stringify(bad.body)); assert.equal(bad.body.code, 'stale_layout');
  const good = await api('POST', `projects/${id}/exports?name=x.pdf&kind=preview&volume=0&book=story&lang=first&preset=digital&layout=${one.measurementHash}`, pdf); assert.equal(good.status, 200, JSON.stringify(good.body));
  const browser = process.env.BROWSER_PATH;
  if (browser && fs.existsSync(browser)) {
    const { evalInPage } = await import('./cdp.mjs');
    const out = await evalInPage(browser, `${process.env.WP_BASE}/#/p/${id}/book`, `(async () => { if (!window.WPLayout || !WPLayout.ready() || !S.layout || !S.layout['${id}']) return null; const lay = await api('GET', '/projects/${id}/layout/1?preset=digital'); try { verifyLayoutPlan(lay); } catch (e) { return JSON.stringify({ err: e.message }); } const g = WPLayout.geometry(lay.geometry); const lines = lay.pages.map(p => Object.values(p.textBlocks || {}).map(t => WPLayout.fitText(t.lines.join(' '), { geom: g, zone: p.zone, family: p.family, sizePt: p.sizePt, weight: 400 }).lines.join('|'))); const bands = [...document.querySelectorAll('.sheet .band:not(.cover)')].filter(b => b.style.whiteSpace === 'nowrap').map(b => b.innerHTML.split('<br>').join('|')); return JSON.stringify({ metrics: WPLayout.metricsHash(), lines, bands }); })()`, { timeout: 40000 });
    const r = JSON.parse(out); assert.equal(r.err, undefined, r.err); assert.equal(r.metrics, one.metricsHash);
    assert.deepEqual(r.lines, one.pages.map(p => Object.values(p.textBlocks || {}).map(t => t.lines.join('|'))), 'browserul real produce aceleași rânduri ca serverul');
    const all = one.pages.flatMap(p => Object.values(p.textBlocks || {}).map(t => t.lines.map(l => l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')).join('|')));
    assert.ok(r.bands.length >= 1 && r.bands.every(b => all.includes(b)), 'previzualizarea afișează rândurile măsurate: ' + JSON.stringify(r.bands.slice(0, 2)));
  }
  await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});
