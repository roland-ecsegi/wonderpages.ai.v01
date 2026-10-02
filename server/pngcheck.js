/**
 * Paginile de colorat: verificare și normalizare locală (PNG, fără dependențe).
 * Lecția LL-030: marginile netezite (anti-aliasing) NU sunt umbre. Se măsoară separat:
 *  - gri de margine: pixeli gri lipiți de o linie neagră (normali la orice desen netezit)
 *  - gri de umplere: zone gri departe de linii (umbre, hașuri) = defect real
 * Pagina finală se normalizează la alb-negru pur, fără să-i schimbe geometria.
 */
import zlib from 'node:zlib';

export function decodePng(buf) {
  if (!buf || buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) return null;   // not a PNG (e.g. JPEG): skip
  let off = 8, w, h, depth, type, interlace, palette = null, trns = null; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), t = buf.toString('ascii', off + 4, off + 8), d = buf.subarray(off + 8, off + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; type = d[9]; interlace = d[12]; }
    else if (t === 'PLTE') palette = d; else if (t === 'tRNS') trns = d; else if (t === 'IDAT') idat.push(d); else if (t === 'IEND') break;
    off += 12 + len;
  }
  if (depth !== 8 || interlace !== 0) return null;
  const bpp = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type]; if (!bpp) return null;
  const raw = zlib.inflateSync(Buffer.concat(idat)); const stride = w * bpp; const img = Buffer.alloc(stride * h); let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), out = img.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      out[x] = (line[x] + (f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? (pa <= pb && pa <= pc ? a : pb <= pc ? b : c) : 0)) & 255;
    }
    prev = out;
  }
  const L = new Uint8Array(w * h); let colour = 0;
  for (let i = 0, j = 0; i < w * h; i++, j += bpp) {
    let r, g, bl, al = 255;
    if (type === 0) r = g = bl = img[j]; else if (type === 4) { r = g = bl = img[j]; al = img[j + 1]; }
    else if (type === 3) { const k = img[j] * 3; r = palette[k]; g = palette[k + 1]; bl = palette[k + 2]; if (trns && img[j] < trns.length) al = trns[img[j]]; }
    else { r = img[j]; g = img[j + 1]; bl = img[j + 2]; if (type === 6) al = img[j + 3]; }
    if (al < 128) { L[i] = 255; continue; }                     // transparent = paper
    if (Math.max(r, g, bl) - Math.min(r, g, bl) > 40) colour++;
    L[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * bl);
  }
  return { w, h, L, colour: colour / (w * h) };
}

export function analyzeLineart(buf) {
  const d = decodePng(buf); if (!d) return null;
  const { w, h, L } = d; let n = 0, black = 0, grayEdge = 0, grayFill = 0; const R = 2;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
    const v = L[y * w + x]; n++;
    if (v < 80) { black++; continue; }
    if (v >= 215) continue;
    let nearBlack = false;                                          // anti-aliasing sits right next to a line
    for (let dy = -R; dy <= R && !nearBlack; dy++) for (let dx = -R; dx <= R; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < h && xx >= 0 && xx < w && L[yy * w + xx] < 80) { nearBlack = true; break; } }
    if (nearBlack) grayEdge++; else grayFill++;
  }
  return { width: w, height: h, black: black / n, grayEdge: grayEdge / n, grayFill: grayFill / n, gray: (grayEdge + grayFill) / n, colour: d.colour };
}
/* judged by what a child and a printer actually see */
export function judgeLineart(m, age) {
  if (!m) return { ok: false, issues: ['Format neverificabil; încărcați un PNG valid.'] };
  const maxBlack = { '3-4': 0.2, '5-6': 0.26, '7-8': 0.32 }[age] || 0.26;
  const issues = [];
  if (m.colour > 0.01) issues.push('conține culoare');
  if (m.grayFill > 0.006) issues.push('are umbre sau zone gri (nu doar margini netezite)');
  if (m.black > maxBlack) issues.push('prea multe detalii negre pentru vârstă');
  if (m.black < 0.01) issues.push('aproape goală');
  return { ok: !issues.length, issues, metrics: { black: +m.black.toFixed(3), grayEdge: +m.grayEdge.toFixed(4), grayFill: +m.grayFill.toFixed(4), colour: +m.colour.toFixed(4) } };
}

/* pure black/white at the mid-tone: edges keep their position, so the drawing's geometry does not change */
function crc32(b) { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; } return (~c) >>> 0; }
function chunk(t, d) { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t, 'ascii'), d]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
export function normalizeLineart(buf, threshold = 150) {
  const d = decodePng(buf); if (!d) return null;
  const { w, h, L } = d; const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w + 1)] = 0; for (let x = 0; x < w; x++) raw[y * (w + 1) + 1 + x] = L[y * w + x] < threshold ? 0 : 255; }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
