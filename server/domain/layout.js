/**
 * P6-T01 — layout / composition planner (OUTPUT-20 PageLayoutPlan, G08, RK12 MATCH).
 * For every interior page of a volume the plan links the narrative purpose (PageBlueprint role/turn/shot, dialogue,
 * wordless) to a layout family, a text region, the crop of the illustration and its protected regions, and measures
 * the text of EVERY language in its own space with the shared measuring code (public/app/layout-measure.js, the same
 * file the preview and the canvas/PDF export execute). Rules:
 *  - the font is never below the age profile (a smaller request is refused and reported, never applied);
 *  - text that does not fit is never clipped or shrunk: another layout is chosen only with evidence (the overflow of
 *    the current one), otherwise the page is blocked with the exact overflow;
 *  - characters missing from the book font, or a missing/changed font file, block (the renderer would fall back);
 *  - the crop keeps protected regions (identity landmarks such as horns or spots, the focal point) inside the safe
 *    area, and the text block never covers them;
 *  - an existing layout (e.g. Dinosaur World V1) is preserved while it is valid; repetition of the same layout on
 *    three consecutive pages is flagged unless it is a declared motif;
 *  - the measurement report has a deterministic hash: preview and export reproduce it or the export stops.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { loadMetrics } from './font-metrics.js';
import { derivePageBlueprints } from './page-blueprints.js';
import { printDimensions } from '../printprofile.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const LAYOUT_SCHEMA = 'wonderpages.layout-plan/1';
export const FAMILIES = Object.freeze(['action', 'dialogue', 'surprise', 'panorama', 'intimate']);
export const ZONES = Object.freeze(['bottom', 'top', 'left', 'right']);
const BLOCKING = new Set(['TEXT_OVERFLOW', 'GLYPH_MISSING', 'FONT_MISSING', 'FONT_METRICS_MISSING', 'FONT_METRICS_STALE', 'CROP_CUTS_INVARIANT', 'TEXT_COVERS_INVARIANT']);

/** The shared measuring script, executed in an isolated context; results are plain JSON (no cross-realm objects). */
export function loadShared(root = ROOT) {
  const ctx = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root, 'public', 'app', 'layout-measure.js'), 'utf8'), ctx, { filename: 'layout-measure.js' });
  const W = ctx.WPLayout, plain = f => (...a) => JSON.parse(JSON.stringify(f(...a.map(x => x === undefined ? x : JSON.parse(JSON.stringify(x))))));
  const { metrics, problems } = loadMetrics(root);
  if (metrics) W.setMetrics(JSON.parse(JSON.stringify(metrics)));
  return { W, problems, metricsHash: metrics?.hash || null, fitText: plain(W.fitText), cropWindow: plain(W.cropWindow), measure: plain(W.measure), geometry: plain(W.geometry), regionOnPage: plain(W.regionOnPage), hash: x => W.hash(JSON.parse(JSON.stringify(x))), measurementOf: plain(W.measurementOf) };
}
let SHARED = null;
export const shared = () => (SHARED ||= loadShared());
export const resetShared = () => { SHARED = null; };

const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const isWordless = pg => pg?.page_type === 'wordless' || !String(pg?.text ?? '').trim();

/** Narrative purpose → family, with the reason (the variation is justified, never random). */
export function familyFor(page, blueprint) {
  const ex = page?.layout?.family;
  if (FAMILIES.includes(ex)) return { family: ex, source: 'existing', reason: 'Macheta existentă a paginii (se păstrează cât timp este validă).' };
  if (isWordless(page)) return { family: 'panorama', source: 'planned', reason: 'Pagină fără text: imaginea spune momentul pe toată pagina.' };
  const turn = norm(page?.turn?.type || blueprint?.turn?.type || page?.page_turn);
  if (turn === 'reveal') return { family: 'surprise', source: 'planned', reason: 'Întoarcerea paginii aduce o dezvăluire: textul scurt lasă imaginea să surprindă.' };
  if (String(page?.dialogue || '').trim()) return { family: 'dialogue', source: 'planned', reason: 'Pagina are dialog: bloc îngust, aproape de vorbitori.' };
  const shot = norm(page?.storyboard?.shot || blueprint?.layout?.shot || page?.composition);
  if (/close/.test(shot)) return { family: 'intimate', source: 'planned', reason: 'Plan apropiat, moment emoțional: bloc compact.' };
  if (/wide/.test(shot)) return { family: 'panorama', source: 'planned', reason: 'Plan larg: textul pe toată lățimea zonei calme.' };
  if ((page?.actions || blueprint?.actions || []).length) return { family: 'action', source: 'planned', reason: 'Acțiune vizibilă: bloc lat, imaginea rămâne liberă în mișcare.' };
  return { family: 'panorama', source: 'planned', reason: 'Fără indicii de compoziție: machetă implicită.' };
}
const zoneFor = (page, blueprint) => { const z = page?.layout?.text_zone || page?.text_zone || blueprint?.layout?.textZone; return ZONES.includes(z) ? z : 'bottom'; };

/** Languages of a volume, each measured in its own space (a native edition is not a copy of the source layout). */
export function languagesOf(project, art, v) {
  const src = art[`final_${v}`]?.content || art[`script_${v}`]?.content, tr = art[`tr_${v}`]?.content, out = [];
  if (src) out.push({ id: 'first', language: project?.input?.language || 'English', pages: src.pages || [], field: 'text', key: art[`final_${v}`] ? `final_${v}` : `script_${v}` });
  if (tr) out.push({ id: 'second', language: project?.input?.second_language || 'second', pages: tr.pages || [], field: 'text', key: `tr_${v}` });
  else if ((src?.pages || []).some(p => p.text_ro)) out.push({ id: 'second', language: 'Romanian', pages: src.pages, field: 'text_ro', key: (art[`final_${v}`] ? `final_${v}` : `script_${v}`) + '#text_ro' });
  return out;
}

/** Page geometry for the export preset (digital/print/kdp), identical to public/app/pdf.js. */
export function geometryFor(bp, project, preset = 'digital') {
  const fmt = bp.formats?.[project?.input?.[bp.format_key || 'page_format']] || Object.values(bp.formats || {})[0] || { trim_w_in: bp.export?.trim_in || 8.5, trim_h_in: bp.export?.trim_in || 8.5 };
  const pre = (bp.export?.presets || []).find(p => p.key === preset) || { key: 'digital', bleed_mm: 0 };
  if (pre.key === 'kdp') { const d = printDimensions(fmt, 'kdp'); return { preset: 'kdp', trimW: fmt.trim_w_in, trimH: fmt.trim_h_in, widthIn: d.width, heightIn: d.height, bleedIn: (pre.bleed_mm || 0) / 25.4 }; }
  return { preset: pre.key, trimW: fmt.trim_w_in, trimH: fmt.trim_h_in, bleedIn: (pre.bleed_mm || 0) / 25.4 };
}

const protectedRegions = (page, ill) => [...(Array.isArray(ill?.regions) ? ill.regions : []), ...(Array.isArray(ill?.qa?.regions) ? ill.qa.regions : []), ...(Array.isArray(page?.layout?.protect) ? page.layout.protect : [])]
  .filter(r => r && r.protect !== false && [r.x, r.y, r.w, r.h].every(Number.isFinite)).map(r => ({ id: r.id || r.label, label: r.label || r.id || 'regiune protejată', x: r.x, y: r.y, w: r.w, h: r.h }));

/** The candidates tried, in order, when the current layout does not hold the text of every language. */
const candidates = (family, zone) => {
  const list = [[family, zone], ['panorama', zone], [family, zone === 'top' ? 'bottom' : 'top'], ['panorama', zone === 'top' ? 'bottom' : 'top'], ['panorama', 'left'], ['panorama', 'right']];
  return list.filter(([f, z], i) => list.findIndex(([f2, z2]) => f2 === f && z2 === z) === i);
};

export function planLayout({ bp, project, art, v, preset = 'digital', images = {}, motifs = [], measuring = null }) {
  const S = measuring || shared(), findings = [], add = (code, severity, message, extra = {}) => findings.push({ code, severity, blocking: severity === 'high' && BLOCKING.has(code), message, ...extra });
  const age = project?.input?.[bp.variant_key || 'target_age'], prof = bp.age_profiles?.[age] || {}, minPt = Number(prof.font_pt) || 20;
  const geo = geometryFor(bp, project, preset), g = S.geometry(geo), P = bp.structure?.pages || 12;
  const langs = languagesOf(project, art, v), bps = derivePageBlueprints(bp, art).pages.filter(x => x.volume === v + 1);
  for (const p of S.problems) add(p.code, 'high', p.message, { scope: { volume: v + 1 } });
  const measurable = !S.problems.length, pages = [];
  const motifPages = new Set((motifs || []).map(Number));
  for (let n = 1; n <= P; n++) {
    const page = langs[0]?.pages?.[n - 1] || null, blueprint = bps.find(b => b.page === n) || null, ill = art[`ill_${v}_${n}`]?.content || null;
    const out = { n, missing: !page, wordless: isWordless(page), findings: [] };
    const pf = (code, severity, message, extra = {}) => { const f = { code, severity, blocking: severity === 'high' && BLOCKING.has(code), message, scope: { volume: v + 1, pages: [n] }, ...extra }; out.findings.push(f); findings.push(f); };
    if (!page) { pages.push(out); continue; }
    const fam = familyFor(page, blueprint); let family = fam.family, zone = zoneFor(page, blueprint);
    const requested = Number(page.layout?.font_pt) || null;
    if (requested && requested < minPt) pf('FONT_BELOW_PROFILE', 'medium', `Corpul de literă cerut (${requested} pt) este sub profilul de vârstă (${minPt} pt): cererea este refuzată, se folosește ${minPt} pt.`, { requestedPt: requested, minPt });
    const sizePt = Math.max(minPt, requested || 0);
    /* crop first: protected regions must stay in the safe area and out from under the text */
    const size = images[`ill_${v}_${n}`] || (ill?.size?.width ? ill.size : null), regions = protectedRegions(page, ill);
    let crop = null;
    if (size?.width && size?.height) {
      crop = S.cropWindow({ imgW: size.width, imgH: size.height, geom: g, protect: regions });
      if (crop.cut.length) pf('CROP_CUTS_INVARIANT', 'high', `Încadrarea taie sau împinge în marginea de siguranță: ${crop.cut.join(', ')}. Nu se taie un reper de identitate; ilustrația trebuie recompusă.`, { regions: crop.cut });
    } else if (ill?.color) out.cropPending = 'Dimensiunile ilustrației nu sunt măsurate încă.';
    const covers = rect => crop ? regions.filter(r => { const q = S.regionOnPage(g, crop, r); return q.x < rect.x + rect.w && rect.x < q.x + q.w && q.y < rect.y + rect.h && rect.y < q.y + q.h; }).map(r => r.label) : [];
    out.textBlocks = {};
    if (!out.wordless && measurable) {
      const texts = langs.map(l => ({ l, text: String(l.pages?.[n - 1]?.[l.field] ?? '') })).filter(x => x.text.trim());
      const tryLayout = (f, z) => { const fits = texts.map(({ l, text }) => ({ l, fit: S.fitText(text, { geom: g, zone: z, family: f, sizePt, weight: 400 }) })); return { f, z, fits, ok: fits.every(x => x.fit.fits && !covers(x.fit.rect).length) }; };
      const first = tryLayout(family, zone); let chosen = first;
      if (!first.ok) chosen = candidates(family, zone).slice(1).map(([f, z]) => tryLayout(f, z)).find(c => c.ok) || first;
      if (chosen !== first) {
        const why = first.fits.filter(x => !x.fit.fits).map(x => `${x.l.language}: ${x.fit.overflow?.kind === 'height' ? `depășește zona cu ${x.fit.overflow.byPt} pt` : 'un cuvânt nu încape pe rând'}`).concat(first.fits.flatMap(x => covers(x.fit.rect).map(c => `${x.l.language}: textul acoperă ${c}`)));
        out.adjusted = { from: { family, zone }, to: { family: chosen.f, zone: chosen.z }, evidence: why };
        family = chosen.f; zone = chosen.z; fam.source = fam.source === 'existing' ? 'adjusted' : fam.source;
        fam.reason = `Schimbată cu dovadă: ${why.join('; ')}.`;
        pf('LAYOUT_ADJUSTED', 'low', `Pagina ${n}: macheta ${out.adjusted.from.family}/${out.adjusted.from.zone} → ${family}/${zone} (${why.join('; ')}). Fontul rămâne ${sizePt} pt.`, { evidence: why });
      } else if (!first.ok) {
        for (const x of first.fits.filter(y => !y.fit.fits)) pf('TEXT_OVERFLOW', 'high', `${x.l.language}, pagina ${n}: textul nu încape la ${sizePt} pt în nicio machetă (${x.fit.overflow?.kind === 'height' ? `depășire ${x.fit.overflow.byPt} pt` : 'cuvânt prea lung: ' + x.fit.overflow.words.join(', ')}). Nu se micșorează fontul și nu se taie: scurtează textul sau schimbă formatul.`, { language: x.l.language, overflow: x.fit.overflow });
        for (const x of first.fits) for (const c of covers(x.fit.rect)) pf('TEXT_COVERS_INVARIANT', 'high', `${x.l.language}, pagina ${n}: blocul de text acoperă ${c} în orice machetă posibilă.`, { region: c });
      }
      for (const { l, fit } of chosen.fits) {
        out.textBlocks[l.id] = { language: l.language, ...fit };
        if (fit.missing.length) pf('GLYPH_MISSING', 'high', `${l.language}, pagina ${n}: fontul cărții nu are caracterele ${fit.missing.map(c => `„${c}” (U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')})`).join(', ')}; ar ieși cu un font de rezervă.`, { language: l.language, chars: fit.missing });
      }
    }
    Object.assign(out, { family, zone, sizePt, source: fam.source, reason: fam.reason, crop, regions: regions.map(r => r.label), motif: !!(page.layout?.motif || motifPages.has(n)) });
    pages.push(out);
  }
  /* repetition: three or more consecutive pages with the same family and zone, unless declared as a motif */
  for (let i = 0; i + 2 < pages.length; i++) {
    const run = pages.slice(i, i + 3);
    if (run.every(p => !p.missing && !p.wordless && p.family === run[0].family && p.zone === run[0].zone) && !run.some(p => p.motif) && !(i > 0 && pages[i - 1].family === run[0].family && pages[i - 1].zone === run[0].zone && !pages[i - 1].wordless)) {
      const f = { code: 'LAYOUT_REPEAT', severity: 'medium', blocking: false, message: `Paginile ${run.map(p => p.n).join(', ')} repetă aceeași machetă (${run[0].family}/${run[0].zone}) fără un motiv declarat; variază după scopul narativ sau declară refrenul vizual.`, scope: { volume: v + 1, pages: run.map(p => p.n) } };
      findings.push(f); run.forEach(p => p.findings.push(f));
    }
  }
  const measurements = pages.map(p => ({ n: p.n, crop: p.crop ? { x: p.crop.x, y: p.crop.y, w: p.crop.w, h: p.crop.h } : null, text: Object.fromEntries(Object.entries(p.textBlocks || {}).map(([k, f]) => [k, S.measurementOf(f)])) }));
  const blocking = findings.filter(f => f.blocking);
  return { schema: LAYOUT_SCHEMA, volume: v + 1, preset: geo.preset, geometry: { ...geo, pt: g }, profile: { age, minFontPt: minPt }, metricsHash: S.metricsHash, measuring: 'public/app/layout-measure.js',
    pages, findings, blocking: blocking.length, ok: !blocking.length && pages.every(p => !p.missing), measurementHash: S.hash({ v: 1, metrics: S.metricsHash, geo, measurements }), measurements };
}

/** Gate/release view: the blocking findings of one page (empty when the page is fine). */
export const pageIssues = (plan, n) => (plan.pages.find(p => p.n === n)?.findings || []).filter(f => f.blocking).map(f => f.message);
