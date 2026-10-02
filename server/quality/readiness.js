/**
 * P6-T05 — destination readiness from measurements (OUTPUT-15, RK22/RK23 SURPASS).
 * PASS only for the ACTUAL profile and inventory, and only when everything was measured:
 *  - profile semantics (P6-T04): strict12 never KDP; the legacy presentation approved per book;
 *  - layout (P6-T01): no blocking finding (overflow, glyphs, crop, font);
 *  - inventory: every page has its real art (no placeholder can become final);
 *  - resolution: effective DPI = pixels USED by the crop / printed inches, and the native estimate when the file looks
 *    enlarged (metadata DPI is ignored); print profiles need 300, digital its own preset DPI;
 *  - colouring pages measured at print size (P6-T03), contours not cut by the placement;
 *  - final PDFs: present for every required book, byte-identical to their receipt, current (not stale), and the
 *    independent inspection passes (page count/size, embedded fonts, no .notdef, text in the safe area, image DPI,
 *    separate cover geometry with the approved spine).
 * Generic print is never reported as CMYK/PDF-X certified; TrimBox/BleedBox are reported, not assumed required.
 */
import { pngSize } from '../security/safe-zip.js';
import { nativeEstimate, effectiveDpi } from '../inspection/raster.js';
import { inspectPdf, checkInspection } from '../inspection/pdf-inspect.js';
import { destinationCheck, coverWrap, pageMap, printDimensions } from '../printprofile.js';
import { coloringQA } from './coloring.js';
import { canonicalHash } from '../domain/canonical.js';
import crypto from 'node:crypto';

export const READINESS_VERSION = 1;
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

/** Effective and native DPI of one page image after placement (crop of the layout plan, or cover-fit). */
export async function imageResolution(file, { readFile, crop, pageWIn, pageHIn, minDpi }) {
  let buf = null; try { buf = await readFile(file); } catch { return { status: 'unreadable', file }; }
  const size = pngSize(buf), est = size ? nativeEstimate(buf) : null;
  if (!size) return { status: 'unmeasured', file, reason: 'Doar PNG se măsoară.' };
  const eff = effectiveDpi(size, crop, pageWIn, pageHIn), native = est?.suspectedUpscale ? Math.round(eff / est.upscaleFactor * 10) / 10 : eff;
  return { file, width: size.width, height: size.height, effectiveDpi: eff, nativeEstimate: est ? { width: est.nativeWidth, height: est.nativeHeight, suspectedUpscale: est.suspectedUpscale, factor: est.upscaleFactor, method: est.method } : null, nativeDpi: native, minDpi, status: eff >= minDpi && native >= minDpi ? 'pass' : 'fail', buf };
}

export async function readinessReport({ bp, project, art, v, preset = 'digital', plan, readFile, readPdf, fingerprint, langs = ['first'] }) {
  const checks = [], add = (id, status, detail, extra = {}) => checks.push({ id, status, detail, ...extra });
  const pre = (bp.export?.presets || []).find(p => p.key === preset) || { key: 'digital', dpi: 150, bleed_mm: 0 };
  const fmt = bp.formats?.[project.input?.[bp.format_key]] || Object.values(bp.formats || {})[0], P = bp.structure.pages, books = bp.structure.books || [];
  const minDpi = pre.key === 'digital' ? (pre.dpi || 150) : 300, profileKey = pre.key === 'kdp' ? 'kdp' : pre.key;
  /* 1. profile semantics */
  const prof = books.map(b => ({ book: b.key, ...destinationCheck({ count: P, book: b, profile: profileKey, ink: project.printProfiles?.kdp?.[b.key]?.ink, paper: project.printProfiles?.kdp?.[b.key]?.paper || 'white', approval: profileKey === 'kdp' ? project.printProfiles?.kdp?.[b.key] : null }) }));
  for (const x of prof) add(`profile:${x.book}`, x.status === 'incompatible' || x.status === 'requires_approval' ? 'fail' : 'pass', `${x.semantics}: ${x.status}${x.reasons?.length ? ' — ' + x.reasons.join(' ') : ''}`);
  /* 2. layout */
  if (!plan) add('layout', 'unmeasured', 'Macheta nu a fost măsurată.');
  else add('layout', plan.blocking ? 'fail' : 'pass', plan.blocking ? plan.findings.filter(f => f.blocking).slice(0, 3).map(f => f.message).join(' ') : `Machetă măsurată (${plan.measurementHash}).`);
  /* 3–5. inventory, resolution, colouring at print size */
  const g = plan?.geometry?.pt, pageWIn = g ? g.w / 72 : fmt.trim_w_in, pageHIn = g ? g.h / 72 : fmt.trim_h_in, pages = [], needLine = books.some(b => b.mode === 'lineart');
  for (let p = 0; p <= P; p++) {
    const c = art[`ill_${v}_${p}`]?.content, row = { p };
    if (!c?.color) { row.status = 'missing'; pages.push(row); continue; }
    const crop = p > 0 ? plan?.pages?.find(x => x.n === p)?.crop || null : null;
    for (const [kind, file] of [['color', c.color], ...(needLine ? [['line', c.lineart]] : [])]) {
      if (!file) { row[kind] = { status: 'missing' }; continue; }
      const res = await imageResolution(file, { readFile, crop, pageWIn, pageHIn, minDpi }), buf = res.buf; delete res.buf; row[kind] = res;
      if (!buf || !res.width) continue;
      if (kind === 'line') { const q = coloringQA(buf, { bp, project, page: art[`final_${v}`]?.content?.pages?.[p - 1] || art[`script_${v}`]?.content?.pages?.[p - 1] || null, ill: c, preset: pre.key }); row.coloring = { ok: q.ok, issues: q.issues, metrics: q.physical?.metrics || null, stale: !!(c.lineFrom && c.lineFrom !== c.color) }; }
    }
    row.status = ['color', 'line'].filter(k => row[k]).every(k => row[k].status === 'pass') && (!row.coloring || (row.coloring.ok && !row.coloring.stale)) && (!needLine || row.line) ? 'pass' : 'fail';
    pages.push(row);
  }
  const missing = pages.filter(r => r.status === 'missing' || r.color?.status === 'missing' || (needLine && (!r.line || r.line.status === 'missing'))).map(r => r.p);
  add('inventory', missing.length ? 'fail' : 'pass', missing.length ? `Fără artă finală (nu se exportă substituenți): paginile ${missing.join(', ')}.` : `Toate cele ${P + 1} pagini au artă${needLine ? ' și pagină de colorat' : ''}.`);
  const low = pages.filter(r => ['color', 'line'].some(k => r[k]?.status === 'fail'));
  add('resolution', low.length ? 'fail' : missing.length ? 'unmeasured' : 'pass', low.length ? low.slice(0, 4).map(r => { const k = r.color?.status === 'fail' ? 'color' : 'line', x = r[k]; return `Pagina ${r.p} (${k}): ${x.width}×${x.height} px, efectiv ${x.effectiveDpi} DPI${x.nativeEstimate?.suspectedUpscale ? `, mărită ~${x.nativeEstimate.factor}× (nativ estimat ${x.nativeEstimate.width}×${x.nativeEstimate.height}, ~${x.nativeDpi} DPI)` : ''}; minim ${minDpi}.`; }).join(' ') : `Minim ${minDpi} DPI efectiv pe toate paginile măsurate.`);
  const col = pages.filter(r => r.coloring && (!r.coloring.ok || r.coloring.stale));
  if (needLine) add('coloring', col.length ? 'fail' : missing.length ? 'unmeasured' : 'pass', col.length ? col.slice(0, 4).map(r => `Pagina ${r.p}: ${r.coloring.stale ? 'pagina de colorat este depășită' : r.coloring.issues.join(', ')}.`).join(' ') : 'Paginile de colorat trec măsurile la tipar.');
  /* 6. final PDFs */
  const receipts = (art[`delivery_${v}`]?.content?.exports || []).filter(e => e.kind === 'final' && e.preset === pre.key), pdfs = [];
  const wanted = books.flatMap(b => b.per_language ? langs.map(l => ({ book: b.key, lang: l, b })) : [{ book: b.key, lang: 'first', b }]);
  if (pre.key === 'kdp') for (const w of [...wanted]) wanted.push({ ...w, book: w.book + '-cover', cover: true });
  for (const w of wanted) {
    const r = receipts.find(e => e.book === w.book && (e.lang || 'first') === w.lang);
    if (!r) { pdfs.push({ book: w.book, lang: w.lang, status: 'unmeasured', detail: 'PDF final neexportat pentru acest profil.' }); continue; }
    let buf = null; try { buf = await readPdf(r.name); } catch { pdfs.push({ book: w.book, lang: w.lang, name: r.name, status: 'fail', detail: 'Fișierul PDF lipsește.' }); continue; }
    const problems = [];
    if (sha(buf) !== r.sha256) problems.push('Fișierul a fost modificat după export (sha256 diferit de chitanță).');
    if (r.fingerprint !== fingerprint) problems.push('PDF depășit: conținutul aprobat s-a schimbat după export.');
    const ins = inspectPdf(buf);
    let expect;
    if (w.cover) { const ap = project.printProfiles?.kdp?.[w.b.key], cw = coverWrap(fmt, destinationCheck({ count: P, book: w.b, profile: 'kdp', ink: ap?.ink, paper: ap?.paper || 'white' })); expect = { pages: 1, widthIn: cw.widthIn, heightIn: cw.heightIn, minDpi: 300 }; }
    else if (pre.key === 'kdp') { const d = printDimensions(fmt, 'kdp'); expect = { pages: pageMap(P, w.b, 'kdp').length, widthIn: d.width, heightIn: d.height, minDpi: 300 }; }
    else { const b = (pre.bleed_mm || 0) / 25.4; expect = { pages: w.b.mode === 'combined' ? 2 + 2 * P : pageMap(P, w.b, 'digital').length, widthIn: fmt.trim_w_in + 2 * b, heightIn: fmt.trim_h_in + 2 * b, minDpi: pre.key === 'digital' ? 0 : 300 }; }
    const expectText = !w.cover && w.b.mode !== 'lineart' && w.b.page_text !== false && plan ? plan.pages.flatMap(pg => pg.textBlocks?.[w.lang]?.lines || []) : [];
    const chk = checkInspection(ins, { ...expect, safeIn: 0.25, expectText });
    for (const pr of chk.problems) problems.push(pr.code === 'PAGE_SIZE' && w.cover ? `Geometria copertei separate diferă (cotor pentru cerneala/hârtia aprobată): ${pr.message}` : pr.message);
    pdfs.push({ book: w.book, lang: w.lang, name: r.name, status: problems.length ? 'fail' : 'pass', problems, inspection: { version: ins.version, pages: ins.pageCount, fonts: ins.fontsUsed, boxes: { trim: ins.pages.some(p => p.trimBox), bleed: ins.pages.some(p => p.bleedBox), required: false } } });
  }
  add('pdfs', pdfs.some(x => x.status === 'fail') ? 'fail' : pdfs.some(x => x.status === 'unmeasured') ? 'unmeasured' : 'pass', pdfs.map(x => `${x.book}${x.lang !== 'first' ? ' (' + x.lang + ')' : ''}: ${x.status}${x.problems?.length ? ' — ' + x.problems.slice(0, 2).join(' ') : x.detail ? ' — ' + x.detail : ''}`).join('; '));
  const status = checks.some(c => c.status === 'fail') ? 'NOT_READY' : checks.some(c => c.status === 'unmeasured') ? 'UNMEASURED' : 'PASS';
  return { schema: 'wonderpages.readiness/1', version: READINESS_VERSION, volume: v + 1, preset: pre.key, status, certified: false, colourSpace: 'RGB', note: pre.key === 'print' ? 'Tipar generic: nu este certificat CMYK/PDF-X.' : pre.key === 'kdp' ? 'Regulile KDP datate (P6-T04) se reverifică înainte de publicare; proba fizică rămâne la operator.' : null,
    checks, pages, pdfs, minDpi, hash: canonicalHash({ checks, pages: pages.map(p => [p.p, p.status]), pdfs: pdfs.map(p => [p.book, p.lang, p.status]) }).slice(0, 16) };
}
