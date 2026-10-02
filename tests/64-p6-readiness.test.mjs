// TEST-P6-T05 — imagine 1024 mărită și etichetată 300 DPI, încadrare sub 300 DPI efectivi, cotor pentru altă hârtie,
// font/glifă lipsă, pagină de colorat tăiată, PDF modificat/depășit: „gata” numai pentru profilul și inventarul real,
// cu măsurători; dimensiuni native/mărite explicite; niciun substituent final.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { api, setFake, waitStatus, connectCanva, approveAll, INPUT, ROOT } from './lib.mjs';
import { inspectPdf, checkInspection } from '../server/inspection/pdf-inspect.js';
import { nativeEstimate, effectiveDpi } from '../server/inspection/raster.js';
import { readinessReport, imageResolution } from '../server/quality/readiness.js';
import { coloringQA } from '../server/quality/coloring.js';
import { planLayout } from '../server/domain/layout.js';
import { destinationCheck, coverWrap } from '../server/printprofile.js';
import { readZip } from '../server/security/safe-zip.js';

const req = createRequire(path.join(ROOT, 'package.json')), { PNG } = req('pngjs'), { jsPDF } = req(path.join(ROOT, 'node_modules/jspdf/dist/jspdf.node.js'));
const BP = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
/* a sharp illustration (hard edges) and its bilinear enlargement */
const scene = (w, h) => { const png = new PNG({ width: w, height: h }); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, u = x / w, v = y / h, blob = Math.hypot(u - 0.5, v - 0.6) < 0.22, eye = Math.hypot(u - 0.45, v - 0.5) < 0.02, stripe = Math.floor(u * 40) % 2 === 0 && v > 0.85; const c = eye ? [20, 20, 20] : blob ? [80, 170, 90] : stripe ? [230, 200, 60] : [140 + 60 * v, 200 - 40 * v, 240]; png.data.set([...c, 255], i); } return png; };
const enlarge = (src, k) => { const w = Math.round(src.width * k), h = Math.round(src.height * k), png = new PNG({ width: w, height: h }); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const sx = Math.min(src.width - 1.001, x / k), sy = Math.min(src.height - 1.001, y / k), x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0; for (let ch = 0; ch < 4; ch++) { const g = (a, b) => src.data[(b * src.width + a) * 4 + ch]; png.data[(y * w + x) * 4 + ch] = Math.round(g(x0, y0) * (1 - fx) * (1 - fy) + g(x0 + 1, y0) * fx * (1 - fy) + g(x0, y0 + 1) * (1 - fx) * fy + g(x0 + 1, y0 + 1) * fx * fy); } } return png; };
/* pHYs chunk claiming 300 DPI (metadata that must NOT be trusted) */
const crc = b => { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; } return (~c) >>> 0; };
const withPhys300 = buf => { const d = Buffer.alloc(9); d.writeUInt32BE(11811, 0); d.writeUInt32BE(11811, 4); d[8] = 1; const td = Buffer.concat([Buffer.from('pHYs'), d]), len = Buffer.alloc(4), c = Buffer.alloc(4); len.writeUInt32BE(9); c.writeUInt32BE(crc(td)); return Buffer.concat([buf.subarray(0, 33), len, td, c, buf.subarray(33)]); };
const grid = (w, h, cell = 160, stroke = 8) => { const png = new PNG({ width: w, height: h }); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = x % cell < stroke || y % cell < stroke ? 0 : 255; png.data.set([v, v, v, 255], (y * w + x) * 4); } return PNG.sync.write(png); };
function makePdf({ pages = 1, w = 8, h = 10, font = 'Andika', text = 'Milo merge pe pajiște.', img = null } = {}) {
  const o = w > h ? 'landscape' : 'portrait', pdf = new jsPDF({ unit: 'in', format: [w, h], orientation: o, compress: true });
  if (font === 'Andika') for (const [i, st] of ['Regular', 'Bold'].entries()) { pdf.addFileToVFS(`Andika-${st}.ttf`, fs.readFileSync(path.join(ROOT, `public/fonts/Andika-${st}.ttf`)).toString('binary')); pdf.addFont(`Andika-${st}.ttf`, 'Andika', i ? 'bold' : 'normal'); }
  for (let i = 0; i < pages; i++) { if (i) pdf.addPage([w, h], o); if (img) pdf.addImage('data:image/png;base64,' + img.toString('base64'), 'PNG', 0, 0, w, h, undefined, 'FAST'); pdf.setFont(font, 'normal'); pdf.setFontSize(20); pdf.text(text, w / 2, h - 1.2, { align: 'center', baseline: 'middle' }); }
  return Buffer.from(pdf.output('arraybuffer'));
}

test('P6-T05: o imagine 1024 mărită la 2458 px și etichetată 300 DPI nu trece: DPI-ul nativ estimat este explicit; metadata este ignorată', () => {
  const native = PNG.sync.write(scene(1024, 1280)), up = withPhys300(PNG.sync.write(enlarge(scene(1024, 1280), 2.4)));
  const e = nativeEstimate(up); assert.equal(e.width, 2458); assert.equal(e.suspectedUpscale, true); assert.ok(e.nativeWidth < 1400 && e.upscaleFactor > 1.8, JSON.stringify(e));
  assert.equal(nativeEstimate(native).suspectedUpscale, false); assert.equal(nativeEstimate(PNG.sync.write(scene(2458, 3072))).suspectedUpscale, false, 'o imagine nativă mare nu este acuzată');
  return imageResolution('x.png', { readFile: async () => up, crop: null, pageWIn: 8.125, pageHIn: 10.25, minDpi: 300 }).then(r => {
    assert.ok(r.effectiveDpi >= 299, 'pixelii acoperă formatul'); assert.equal(r.status, 'fail'); assert.ok(r.nativeDpi < 200, JSON.stringify({ ...r, buf: undefined })); assert.equal(r.nativeEstimate.suspectedUpscale, true);
  });
});

test('P6-T05: DPI efectiv după încadrare — 3000×3000 pe pagina KDP 8,125×10,25 are sub 300; regiunea protejată nu adaugă pixeli', () => {
  assert.ok(effectiveDpi({ width: 3000, height: 3000 }, null, 8.125, 10.25) < 300);
  assert.ok(effectiveDpi({ width: 2438, height: 3075 }, null, 8.125, 10.25) >= 300, 'minimul din ADR04: 2438×3075');
  assert.ok(effectiveDpi({ width: 2438, height: 3075 }, { x: 0, y: 0, w: 0.9, h: 0.9 }, 8.125, 10.25) < 300, 'o încadrare mai strânsă scade DPI-ul efectiv');
});

test('P6-T05: cotorul calculat pentru altă hârtie este prins de geometria copertei separate', () => {
  const col = BP.structure.books.find(b => b.key === 'coloring'), fmt = BP.formats.portrait45;
  const white = coverWrap(fmt, destinationCheck({ count: 12, book: col, profile: 'kdp', paper: 'white' })), cream = coverWrap(fmt, destinationCheck({ count: 12, book: col, profile: 'kdp', paper: 'cream' }));
  const pdf = makePdf({ w: white.widthIn, h: white.heightIn, text: 'Colorat' }), ins = inspectPdf(pdf);
  assert.equal(checkInspection(ins, { pages: 1, widthIn: white.widthIn, heightIn: white.heightIn }).ok, true);
  const bad = checkInspection(ins, { pages: 1, widthIn: cream.widthIn, heightIn: cream.heightIn }); assert.equal(bad.ok, false); assert.equal(bad.problems[0].code, 'PAGE_SIZE');
});

test('P6-T05: font neîncorporat și glifă lipsă sunt găsite în PDF (nu în sursă)', () => {
  const helv = checkInspection(inspectPdf(makePdf({ font: 'helvetica', text: 'Milo' })), { pages: 1, widthIn: 8, heightIn: 10 });
  assert.ok(helv.problems.some(p => p.code === 'FONT_NOT_EMBEDDED' && /Helvetica/.test(p.message)), JSON.stringify(helv.problems));
  const ok = inspectPdf(makePdf({ text: 'Puiul a găsit o pietricică lângă țărm.' })); assert.ok(ok.fontsUsed.every(f => f.embedded)); assert.equal(checkInspection(ok, { pages: 1, widthIn: 8, heightIn: 10 }).ok, true);
  const emoji = inspectPdf(makePdf({ text: 'Milo 恐竜' })); assert.equal(emoji.pages[0].text[0].text.trim(), 'Milo', 'producătorul a omis tăcut caracterele fără glifă');
  const missing = checkInspection(emoji, { pages: 1, widthIn: 8, heightIn: 10, expectText: ['Milo 恐竜'] }); assert.ok(missing.problems.some(p => p.code === 'TEXT_MISSING'), JSON.stringify(missing.problems));
  assert.equal(checkInspection(ok, { pages: 1, widthIn: 8, heightIn: 10, expectText: ['Puiul a găsit o pietricică lângă țărm.'] }).ok, true, 'diacriticele românești sunt în PDF');
  const far = checkInspection(inspectPdf(makePdf({ text: 'Text foarte lung care iese din pagină pe ambele părți ale zonei sigure, mult prea lung pentru rând.' })), { pages: 1, widthIn: 8, heightIn: 10 });
  assert.ok(far.problems.some(p => p.code === 'TEXT_BOUNDS'), 'textul în afara zonei sigure');
});

test('P6-T05: pagina de colorat tăiată de încadrare este semnalată', () => {
  const q = coloringQA(grid(1000, 1000), { bp: BP, project: { input: { target_age: '5-6', page_format: 'portrait45' } }, preset: 'digital' });
  assert.ok(q.physical.metrics.clippedShare > 0.05); assert.ok(q.issues.some(i => /încadrarea taie/.test(i)), JSON.stringify(q.issues));
  assert.equal(coloringQA(grid(1000, 1250), { bp: BP, project: { input: { target_age: '5-6', page_format: 'portrait45' } }, preset: 'digital' }).physical.metrics.clippedShare, 0);
});

/* a complete, measurable volume: 13 sharp 1200×1500 images (150 DPI on 8×10), colouring pages and real final PDFs */
async function fixture() {
  const project = { id: 'pready001', input: { target_age: '5-6', page_format: 'portrait45', language: 'English' }, options: {} };
  const color = PNG.sync.write(scene(1200, 1500)), line = grid(1200, 1500), art = { final_0: { content: { pages: Array.from({ length: 12 }, (_, i) => ({ n: i + 1, text: 'Milo walks to the meadow.', layout: { family: ['action', 'panorama', 'intimate'][i % 3], text_zone: i % 2 ? 'top' : 'bottom' } })) } } };
  for (let p = 0; p <= 12; p++) art[`ill_0_${p}`] = { content: { color: `images/c${p}.png`, lineart: `images/l${p}.png`, lineFrom: `images/c${p}.png`, lineQA: { ok: true, for: `images/l${p}.png` }, qa: { ok: true, color: `images/c${p}.png` } } };
  const files = f => (f.includes('/c') ? color : line), pdfStory = makePdf({ pages: 14, img: PNG.sync.write(scene(120, 150)), text: 'Milo walks to the meadow.' }), pdfCol = makePdf({ pages: 14, img: grid(120, 150, 30, 2) });
  const fp = 'fp-current', receipts = [{ book: 'story', lang: 'first', name: 's.pdf', kind: 'final', preset: 'digital', fingerprint: fp, sha256: sha(pdfStory) }, { book: 'coloring', lang: 'first', name: 'c.pdf', kind: 'final', preset: 'digital', fingerprint: fp, sha256: sha(pdfCol) }];
  art.delivery_0 = { content: { exports: receipts } };
  const plan = planLayout({ bp: BP, project, art, v: 0, preset: 'digital', images: Object.fromEntries(Array.from({ length: 13 }, (_, p) => [`ill_0_${p}`, { width: 1200, height: 1500 }])) });
  const pdfs = { 's.pdf': pdfStory, 'c.pdf': pdfCol };
  const run = (over = {}) => readinessReport({ bp: BP, project, art, v: 0, preset: 'digital', plan, readFile: async f => files(f), readPdf: async n => pdfs[n], fingerprint: fp, ...over });
  return { project, art, plan, pdfs, receipts, run };
}

test('P6-T05: PASS numai cu toate măsurile pe profilul real; PDF modificat sau depășit, artă lipsă și profil greșit opresc', async () => {
  const F = await fixture();
  let r = await F.run(); assert.equal(r.status, 'PASS', JSON.stringify(r.checks.filter(c => c.status !== 'pass'))); assert.equal(r.certified, false);
  assert.ok(r.pages.every(p => p.color.effectiveDpi >= 150 && p.color.nativeEstimate && p.color.nativeEstimate.suspectedUpscale === false), 'dimensiuni native explicite');
  F.pdfs['s.pdf'] = Buffer.concat([F.pdfs['s.pdf'], Buffer.from('\n% tampered\n')]); r = await F.run(); assert.equal(r.status, 'NOT_READY'); assert.match(r.checks.find(c => c.id === 'pdfs').detail, /modificat după export/);
  F.pdfs['s.pdf'] = F.pdfs['s.pdf'].subarray(0, F.pdfs['s.pdf'].length - 12);
  r = await F.run({ fingerprint: 'fp-new' }); assert.equal(r.status, 'NOT_READY'); assert.match(r.checks.find(c => c.id === 'pdfs').detail, /depășit/);
  delete F.art.ill_0_7; r = await F.run(); assert.equal(r.checks.find(c => c.id === 'inventory').status, 'fail', 'niciun substituent final'); assert.match(r.checks.find(c => c.id === 'inventory').detail, /paginile 7/);
  const F2 = await fixture(); F2.art.delivery_0.content.exports = []; assert.equal((await F2.run()).status, 'UNMEASURED', 'fără PDF-uri finale: nemăsurat, nu „gata”');
  const k = await F2.run({ preset: 'kdp' }); assert.equal(k.status, 'NOT_READY'); assert.ok(k.checks.find(c => c.id === 'profile:story').status === 'fail', 'legacy neaprobat'); assert.ok(k.checks.find(c => c.id === 'resolution').status === 'fail', '150 DPI nu ajung pentru tipar');
});

test('P6-T05 Dinosaur World: arta nouă trebuie să treacă verificările de pixeli; referințele mici nu sunt defecte de tipar final', async () => {
  const doc = JSON.parse([...readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')))].find(([k]) => k.endsWith('/project.json'))[1].toString());
  const r = await readinessReport({ bp: doc.blueprint, project: doc.project, art: doc.artifacts, v: 0, preset: 'print', plan: planLayout({ bp: doc.blueprint, project: doc.project, art: doc.artifacts, v: 0, preset: 'print' }), readFile: async () => { throw new Error('nu există'); }, readPdf: async () => { throw new Error('nu există'); }, fingerprint: 'x' });
  assert.equal(r.status, 'NOT_READY'); assert.match(r.checks.find(c => c.id === 'inventory').detail, /0, 1, 2/); assert.ok(!r.checks.some(c => /ref/i.test(c.id)), 'referințele nu sunt verificate ca artă de tipar');
  assert.equal(r.checks.find(c => c.id === 'layout').status, 'pass', 'macheta V1 rămâne validă');
});

test('P6-T05 API: raportul de pregătire pe proiect (artă de test sub DPI → nu este gata, cu motivele măsurate)', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Pregătire P6' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']); await approveAll(id); await waitStatus(id, ['awaiting_review']); await approveAll(id); await waitStatus(id, ['awaiting_review']);
  const r = await api('GET', `projects/${id}/readiness/1?preset=print`); assert.equal(r.status, 200); assert.equal(r.body.schema, 'wonderpages.readiness/1');
  assert.equal(r.body.status, 'NOT_READY'); assert.match(r.body.checks.find(c => c.id === 'resolution').detail, /400×500 px, efectiv 48\.6 DPI/); assert.equal(r.body.pages.find(p => p.p === 3).color.width, 400);
  assert.equal(r.body.note, 'Tipar generic: nu este certificat CMYK/PDF-X.');
  assert.equal((await api('GET', `projects/${id}/readiness/1?preset=bogus`)).status, 400);
  await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});
