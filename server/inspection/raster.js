/**
 * P6-T05 — raster inspection: pixel size, an explicit estimate of NATIVE resolution, and effective DPI after placement.
 * Metadata DPI (pHYs) is ignored on purpose. Upscaling is estimated from edge width: a strong edge in a native image occupies ~1 pixel (2 when
 * anti-aliased); an image enlarged k× spreads the same edge over ~k pixels. The estimate is labelled as such (heuristic),
 * with the measured mean edge width and the sample size.
 */
import { decodePng } from '../pngcheck.js';

export function nativeEstimate(buf, { step = 2, minEdge = 48 } = {}) {
  const d = decodePng(buf); if (!d) return null;
  const { w, h, L } = d, lens = [];
  /* a ramp = consecutive same-direction changes; its length is how many pixels one edge occupies */
  const scan = (n, at) => { let i = 0; while (i < n - 1) { const s0 = Math.sign(L[at(i + 1)] - L[at(i)]); if (!s0 || Math.abs(L[at(i + 1)] - L[at(i)]) < 3) { i++; continue; } let j = i + 1; while (j < n - 1 && Math.sign(L[at(j + 1)] - L[at(j)]) === s0 && Math.abs(L[at(j + 1)] - L[at(j)]) >= 3) j++; if (Math.abs(L[at(j)] - L[at(i)]) >= minEdge) lens.push(j - i); i = j; } };
  for (let y = 0; y < h; y += step) scan(w, x => y * w + x);
  for (let x = 0; x < w; x += step) scan(h, y => y * w + x);
  if (lens.length < 50) return { width: w, height: h, edgeWidth: null, samples: lens.length, upscaleFactor: null, suspectedUpscale: false, nativeWidth: w, nativeHeight: h, method: 'edge-width/1', note: 'Prea puține muchii pentru o estimare.' };
  lens.sort((a, b) => a - b); const med = lens[Math.floor(lens.length / 2)], mean = lens.reduce((a, b) => a + b, 0) / lens.length;
  const factor = Math.max(1, Math.min(8, mean * 0.62)), suspected = med >= 2 || mean >= 1.9;
  return { width: w, height: h, edgeWidth: +mean.toFixed(2), edgeWidthMedian: med, samples: lens.length, upscaleFactor: suspected ? +factor.toFixed(2) : 1, suspectedUpscale: suspected, nativeWidth: suspected ? Math.round(w / factor) : w, nativeHeight: suspected ? Math.round(h / factor) : h, method: 'edge-width/1' };
}

/** Pixels actually used per inch of the printed page, for a crop window (normalised) placed on a page of pageW×pageH in. */
export function effectiveDpi({ width, height }, crop, pageWIn, pageHIn) {
  const c = crop || (() => { const r = Math.max(pageWIn / width, pageHIn / height); return { w: pageWIn / (width * r), h: pageHIn / (height * r) }; })();
  return Math.round(Math.min(width * c.w / pageWIn, height * c.h / pageHIn) * 10) / 10;
}
