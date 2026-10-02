/**
 * P6-T01 — shared font measurements (one metric source for preview, export and the server planner).
 * The book font (Andika, local TTF) is parsed directly: unitsPerEm, ascender/descender and the advance width of every
 * mapped code point (cmap format 4/12 + hmtx). The result is written to public/fonts/andika-metrics.json, which the
 * browser (preview + canvas export) and the server load through the SAME measuring code (public/app/layout-measure.js).
 * The JSON records the sha256 of the TTF it was derived from, so a font swap without regenerating is detected.
 * Kerning is ignored on purpose: advance sums are an upper bound of the kerned width, so a line that fits here also
 * fits in the canvas renderer (which applies kerning).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const METRICS_SCHEMA = 'wonderpages.font-metrics/1';
export const FONT_FILES = Object.freeze({ 400: 'Andika-Regular.ttf', 700: 'Andika-Bold.ttf' });

/** Minimal TrueType reader: head, hhea, hmtx, cmap (formats 4 and 12). */
export function parseTTF(buf) {
  if (buf.length < 12) throw new Error('Fișier de font invalid.');
  const n = buf.readUInt16BE(4), tables = {};
  for (let i = 0; i < n; i++) { const o = 12 + i * 16; tables[buf.toString('latin1', o, o + 4)] = { off: buf.readUInt32BE(o + 8), len: buf.readUInt32BE(o + 12) }; }
  for (const t of ['head', 'hhea', 'hmtx', 'cmap']) if (!tables[t]) throw new Error(`Tabelul ${t} lipsește din font.`);
  const unitsPerEm = buf.readUInt16BE(tables.head.off + 18);
  const hh = tables.hhea.off, ascender = buf.readInt16BE(hh + 4), descender = buf.readInt16BE(hh + 6), numH = buf.readUInt16BE(hh + 34);
  const adv = gid => buf.readUInt16BE(tables.hmtx.off + 4 * Math.min(gid, numH - 1));
  const cm = tables.cmap.off, sub = [];
  for (let i = 0, k = buf.readUInt16BE(cm + 2); i < k; i++) { const o = cm + 4 + i * 8; sub.push({ pid: buf.readUInt16BE(o), eid: buf.readUInt16BE(o + 2), off: cm + buf.readUInt32BE(o + 4) }); }
  const map = new Map();
  const pick = sub.find(s => buf.readUInt16BE(s.off) === 12 && (s.pid === 3 && s.eid === 10 || s.pid === 0)) || sub.find(s => buf.readUInt16BE(s.off) === 4 && (s.pid === 3 && s.eid === 1 || s.pid === 0));
  if (!pick) throw new Error('Fontul nu are un cmap Unicode.');
  const o = pick.off;
  if (buf.readUInt16BE(o) === 12) {
    for (let i = 0, g = buf.readUInt32BE(o + 12); i < g; i++) { const r = o + 16 + i * 12, s = buf.readUInt32BE(r), e = buf.readUInt32BE(r + 4), gid = buf.readUInt32BE(r + 8); for (let c = s; c <= e; c++) map.set(c, gid + c - s); }
  } else {
    const seg = buf.readUInt16BE(o + 6) / 2, ends = o + 14, starts = ends + seg * 2 + 2, deltas = starts + seg * 2, ranges = deltas + seg * 2;
    for (let i = 0; i < seg; i++) {
      const e = buf.readUInt16BE(ends + i * 2), s = buf.readUInt16BE(starts + i * 2), d = buf.readInt16BE(deltas + i * 2), ro = buf.readUInt16BE(ranges + i * 2);
      for (let c = s; c <= e && c !== 0xFFFF; c++) {
        let gid = ro === 0 ? (c + d) & 0xFFFF : buf.readUInt16BE(ranges + i * 2 + ro + (c - s) * 2);
        if (ro !== 0 && gid !== 0) gid = (gid + d) & 0xFFFF;
        if (gid) map.set(c, gid);
      }
    }
  }
  const advances = {};
  for (const [c, gid] of [...map].sort((a, b) => a[0] - b[0])) advances[c] = adv(gid);
  return { unitsPerEm, ascender, descender, notdef: adv(0), advances };
}

/** Compact form: runs of consecutive code points → [start, [advances...]]. */
const runs = adv => { const out = []; let cur = null, prev = -2; for (const c of Object.keys(adv).map(Number).sort((a, b) => a - b)) { if (c !== prev + 1) { cur = [c, []]; out.push(cur); } cur[1].push(adv[c]); prev = c; } return out; };

export function buildMetrics(fontDir) {
  const fonts = {};
  for (const [w, file] of Object.entries(FONT_FILES)) {
    const buf = fs.readFileSync(path.join(fontDir, file)), t = parseTTF(buf);
    fonts[w] = { file, sha256: crypto.createHash('sha256').update(buf).digest('hex'), unitsPerEm: t.unitsPerEm, ascender: t.ascender, descender: t.descender, notdef: t.notdef, runs: runs(t.advances) };
  }
  const body = { schema: METRICS_SCHEMA, family: 'Andika', fonts };
  return { ...body, hash: crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 16) };
}

/** Load the committed metrics and check they still describe the installed TTF files (font swapped → stale). */
export function loadMetrics(root) {
  const dir = path.join(root, 'public', 'fonts'), file = path.join(dir, 'andika-metrics.json');
  const problems = [];
  let m = null;
  try { m = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { problems.push({ code: 'FONT_METRICS_MISSING', message: 'Măsurătorile fontului lipsesc (public/fonts/andika-metrics.json).' }); }
  for (const [w, f] of Object.entries(FONT_FILES)) {
    let sha = null; try { sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, f))).digest('hex'); } catch { problems.push({ code: 'FONT_MISSING', weight: Number(w), message: `Fontul cărții ${f} lipsește: textul ar ieși cu un font de rezervă, deci nu se măsoară și nu se exportă.` }); continue; }
    if (m && m.fonts?.[w]?.sha256 !== sha) problems.push({ code: 'FONT_METRICS_STALE', weight: Number(w), message: `Măsurătorile nu corespund fontului instalat ${f}; regenerează-le (scripts/enterprise/font-metrics.mjs).` });
  }
  return { metrics: problems.length ? null : m, problems };
}
