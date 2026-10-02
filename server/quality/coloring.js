/**
 * P6-T03 — colouring page measured in its physical layout (RK14 SURPASS).
 * A colouring page is judged at the size a child gets it, after placement: the same crop as the colour page
 * (P6-T01 layout, protected regions included) on the trim of the product format. Measured on the real file:
 *  - contours: the median and the thin-end (10th percentile) stroke thickness, in millimetres at print size;
 *  - colourable spaces: closed paper regions inside the visible window and their area in mm²; regions smaller than the
 *    age profile's `min_region` (mm²) are too small to colour; enough usable regions must exist;
 *  - grey: anti-aliased edges are normal, grey fills (shading) are a defect (pngcheck: LL-030).
 * Age profile units (documented here, unchanged blueprint values): `line_weight` = minimum stroke in tenths of a mm,
 * `min_region` = minimum colourable area in mm². The result is versioned and bound to the exact file and colour it
 * derives from; it never approves anything (approval stays the operator's).
 */
import { decodePng, analyzeLineart, judgeLineart } from '../pngcheck.js';
import { shared, geometryFor } from '../domain/layout.js';

export const COLORING_QA_VERSION = 1;
const pct = (arr, q) => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))]; };

/** Strokes and colourable regions of a decoded image inside a window, converted to print units. */
export function measureColoring(buf, { trimW, trimH, widthIn = null, heightIn = null, crop = null, age = '5-6', profile = {}, threshold = 150 } = {}) {
  const d = decodePng(buf); if (!d) return { version: COLORING_QA_VERSION, ok: false, issues: ['Format neverificabil (doar PNG).'], metrics: null };
  const { w, h, L } = d, c = crop || { x: 0, y: 0, w: 1, h: 1 };
  const x0 = Math.round(c.x * w), y0 = Math.round(c.y * h), x1 = Math.min(w, Math.round((c.x + c.w) * w)), y1 = Math.min(h, Math.round((c.y + c.h) * h)), W = x1 - x0, H = y1 - y0;
  const pageW = widthIn || trimW, pageH = heightIn || trimH, ppi = Math.min(W / pageW, H / pageH), mmPerPx = 25.4 / ppi;
  const black = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) black[y * W + x] = L[(y + y0) * w + x + x0] < threshold ? 1 : 0;
  let allBlack = 0; for (let i = 0; i < w * h; i++) if (L[i] < threshold) allBlack++; let inBlack = 0; for (let i = 0; i < W * H; i++) inBlack += black[i];
  const clippedShare = allBlack ? +((allBlack - inBlack) / allBlack).toFixed(3) : 0;   // P6-T05: contour mass cut away by the placement
  /* stroke thickness: black runs across lines, horizontally and vertically (a run is a cut through a contour) */
  const runs = []; const step = Math.max(1, Math.floor(Math.min(W, H) / 200));
  for (let y = 0; y < H; y += step) { let r = 0; for (let x = 0; x <= W; x++) { if (x < W && black[y * W + x]) r++; else { if (r) runs.push(r); r = 0; } } }
  for (let x = 0; x < W; x += step) { let r = 0; for (let y = 0; y <= H; y++) { if (y < H && black[y * W + x]) r++; else { if (r) runs.push(r); r = 0; } } }
  const contour = runs.filter(r => r < Math.min(W, H) / 8);   // filled black masses are not contours
  /* colourable regions: 4-connected paper components */
  const lab = new Int32Array(W * H), areas = [], stack = new Int32Array(W * H); let n = 0;
  for (let i = 0; i < W * H; i++) {
    if (black[i] || lab[i]) continue; n++; let top = 0, area = 0; stack[top++] = i; lab[i] = n;
    while (top) { const k = stack[--top]; area++; const x = k % W, y = (k - x) / W;
      if (x > 0 && !black[k - 1] && !lab[k - 1]) { lab[k - 1] = n; stack[top++] = k - 1; } if (x < W - 1 && !black[k + 1] && !lab[k + 1]) { lab[k + 1] = n; stack[top++] = k + 1; }
      if (y > 0 && !black[k - W] && !lab[k - W]) { lab[k - W] = n; stack[top++] = k - W; } if (y < H - 1 && !black[k + W] && !lab[k + W]) { lab[k + W] = n; stack[top++] = k + W; } }
    areas.push(area);
  }
  const mm2 = a => a * mmPerPx * mmPerPx, noise = 1 / (mmPerPx * mmPerPx);   // components under 1 mm² are line noise, not spaces
  const regions = areas.filter(a => a >= noise).map(mm2), minRegion = Number(profile.min_region) || 300, minStroke = (Number(profile.line_weight) || 6) / 10;
  const small = regions.filter(a => a < minRegion), usable = regions.filter(a => a >= minRegion);
  const metrics = { ppi: Math.round(ppi * 10) / 10, window: { x: x0, y: y0, w: W, h: H }, strokeMedianMm: +(pct(contour, 0.5) * mmPerPx).toFixed(2), strokeThinMm: +(pct(contour, 0.1) * mmPerPx).toFixed(2), regions: regions.length, usableRegions: usable.length, smallRegions: small.length, smallShare: regions.length ? +(small.length / regions.length).toFixed(3) : 0, smallestMm2: regions.length ? +Math.min(...regions).toFixed(1) : null, minRegionMm2: minRegion, minStrokeMm: minStroke, clippedShare };
  const issues = [];
  if (!contour.length) issues.push('nu are contururi măsurabile');
  else if (metrics.strokeMedianMm < minStroke * 0.8) issues.push(`contururi prea subțiri la tipar (${metrics.strokeMedianMm} mm; vârsta cere ≥ ${minStroke} mm)`);
  if (usable.length < 3) issues.push(`prea puține spații de colorat la dimensiunea de tipar (${usable.length} ≥ ${minRegion} mm²)`);
  if (clippedShare > 0.05) issues.push(`încadrarea taie ${Math.round(clippedShare * 100)}% din contururi (linii tăiate la marginea paginii)`);
  if (metrics.smallShare > 0.4) issues.push(`prea multe zone prea mici pentru vârstă (${small.length} din ${regions.length} sub ${minRegion} mm²)`);
  return { version: COLORING_QA_VERSION, ok: !issues.length, issues, metrics, print: { trimW, trimH, widthIn: pageW, heightIn: pageH, crop: c } };
}

/** The full colouring check of one candidate: grey/colour/density on the raw file + physical measures after placement. */
export function coloringQA(buf, { bp, project, page = null, ill = null, preset = 'print', age = null, final = null }) {
  const a = age || project?.input?.[bp.variant_key || 'target_age'], prof = bp.age_profiles?.[a] || {};
  const base = judgeLineart(analyzeLineart(buf), a);   // grey/colour/density on the generated file; the physical check on the file that prints
  buf = final || buf;
  const geo = geometryFor(bp, project, (bp.export?.presets || []).some(p => p.key === preset) ? preset : 'digital');
  const d = decodePng(buf); let crop = null;
  if (d) { const S = shared(), g = S.geometry(geo); const protect = [...(ill?.regions || []), ...(ill?.qa?.regions || []), ...(page?.layout?.protect || [])].filter(r => r && [r.x, r.y, r.w, r.h].every(Number.isFinite)); crop = S.cropWindow({ imgW: d.w, imgH: d.h, geom: g, protect }); }
  const g2 = shared().geometry(geo), physical = measureColoring(buf, { trimW: geo.trimW, trimH: geo.trimH, widthIn: g2.w / 72, heightIn: g2.h / 72, crop: crop ? { x: crop.x, y: crop.y, w: crop.w, h: crop.h } : null, age: a, profile: prof });
  return { ...base, ok: base.ok && physical.ok, issues: [...base.issues, ...physical.issues], version: COLORING_QA_VERSION, physical: { ...physical, preset: geo.preset } };
}
