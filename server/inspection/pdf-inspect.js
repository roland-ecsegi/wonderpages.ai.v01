/**
 * P6-T05 — independent PDF inspection (no dependency on how the PDF was produced).
 * Parses the file itself: page tree (in order), MediaBox / TrimBox / BleedBox (inherited), resources, content streams
 * (FlateDecode), the graphics state (q/Q/cm) to find where every image is placed and at which effective DPI, text runs
 * (font, size, origin, glyphs, width from the font's /W array) and the fonts actually used (embedded or not; .notdef).
 * It never trusts metadata DPI: resolution is pixels / placed inches.
 */
import zlib from 'node:zlib';

export const INSPECT_VERSION = 1;

function objects(buf) {
  const s = buf.toString('latin1'), out = new Map(), re = /(?<![0-9])(\d+)\s+(\d+)\s+obj\b/g; let m;
  while ((m = re.exec(s))) {
    const start = m.index + m[0].length, end = s.indexOf('endobj', start); if (end < 0) break;
    const body = s.slice(start, end), si = body.search(/\bstream\r?\n/);
    let dict = si >= 0 ? body.slice(0, si) : body, stream = null;
    if (si >= 0) { const off = start + si + body.slice(si).match(/^stream\r?\n/)[0].length; let len = Number((dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/) || [])[1]); if (!Number.isFinite(len)) { const e = s.indexOf('endstream', off); len = e - off; } stream = buf.subarray(off, off + len); }
    out.set(Number(m[1]), { dict: dict.trim(), stream });
    re.lastIndex = end;
  }
  return { s, objs: out };
}
const refOf = (d, key) => { const m = d.match(new RegExp(`/${key}\\s+(\\d+)\\s+\\d+\\s+R`)); return m ? Number(m[1]) : null; };
const numsOf = (d, key) => { const m = d.match(new RegExp(`/${key}\\s*\\[([^\\]]*)\\]`)); return m ? m[1].trim().split(/\s+/).map(Number) : null; };
const nameOf = (d, key) => (d.match(new RegExp(`/${key}\\s*/([A-Za-z0-9_.+-]+)`)) || [])[1] || null;
/** Inner dictionary for a key: either inline << … >> (balanced) or an indirect reference. */
function subDict(objs, d, key) {
  const i = d.search(new RegExp(`/${key}\\s*(<<|\\d+\\s+\\d+\\s+R)`)); if (i < 0) return null;
  const rest = d.slice(i + key.length + 1).trimStart();
  if (rest.startsWith('<<')) { let depth = 0, j = 0; for (; j < rest.length; j++) { if (rest.startsWith('<<', j)) { depth++; j++; } else if (rest.startsWith('>>', j)) { depth--; j++; if (!depth) break; } } return rest.slice(2, j - 1); }
  const r = rest.match(/^(\d+)\s+\d+\s+R/); return r ? (objs.get(Number(r[1]))?.dict || null) : null;
}
const namedRefs = d => Object.fromEntries([...(d || '').matchAll(/\/([A-Za-z0-9_.+-]+)\s+(\d+)\s+\d+\s+R/g)].map(x => [x[1], Number(x[2])]));
const inflate = st => { try { return zlib.inflateSync(st).toString('latin1'); } catch { try { return zlib.inflateRawSync(st).toString('latin1'); } catch { return null; } } };
const mul = (a, b) => [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3], a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5]];

function fontInfo(objs, ref) {
  const f = objs.get(ref)?.dict || '', sub = nameOf(f, 'Subtype'), base = nameOf(f, 'BaseFont');
  let desc = refOf(f, 'FontDescriptor'), widths = null, dw = 1000, identity = nameOf(f, 'Encoding') === 'Identity-H';
  if (sub === 'Type0') { const kids = f.match(/\/DescendantFonts\s*\[\s*(\d+)\s+\d+\s+R/); const cid = kids ? objs.get(Number(kids[1]))?.dict || '' : ''; desc = refOf(cid, 'FontDescriptor'); dw = Number((cid.match(/\/DW\s+(\d+)/) || [])[1]) || 1000;
    const w = cid.match(/\/W\s*\[([\s\S]*?)\]\s*\/(?!W)/); widths = new Map(); if (w) { const t = w[1].match(/\d+\s*\[[^\]]*\]|\d+\s+\d+\s+\d+/g) || []; for (const g of t) { const a = g.match(/^(\d+)\s*\[([^\]]*)\]/); if (a) a[2].trim().split(/\s+/).forEach((v, i) => widths.set(Number(a[1]) + i, Number(v))); else { const [c1, c2, v] = g.split(/\s+/).map(Number); for (let c = c1; c <= c2; c++) widths.set(c, v); } } } }
  const d = desc ? objs.get(desc)?.dict || '' : '', embedded = /\/FontFile[23]?\s+\d+\s+\d+\s+R/.test(d);
  /* ToUnicode: the text the PDF really contains (characters a font lacks are dropped by some producers) */
  let uni = null; const tu = refOf(f, 'ToUnicode'), o = tu != null ? objs.get(tu) : null;
  if (o?.stream) { const cm = /\/FlateDecode/.test(o.dict) ? inflate(o.stream) : o.stream.toString('latin1'); if (cm) { uni = new Map(); const hex = h => String.fromCodePoint(...(h.match(/.{4}/g) || []).map(x => parseInt(x, 16)));
    for (const b of cm.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) for (const m of b[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) uni.set(parseInt(m[1], 16), hex(m[2]));
    for (const b of cm.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) for (const m of b[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) { const a = parseInt(m[1], 16), z = parseInt(m[2], 16), st = parseInt(m[3], 16); for (let c = a; c <= z && c - a < 65536; c++) uni.set(c, String.fromCodePoint(st + c - a)); } } }
  return { ref, subtype: sub, baseFont: base, embedded, identity, widths, dw, uni };
}

export function inspectPdf(buf) {
  const errors = [];
  if (!Buffer.isBuffer(buf) || buf.subarray(0, 5).toString('latin1') !== '%PDF-') return { version: INSPECT_VERSION, ok: false, errors: ['Nu este un PDF.'], pages: [] };
  const { s, objs } = objects(buf);
  if (!/%%EOF\s*$/.test(s.slice(-1024))) errors.push('PDF trunchiat (lipsește %%EOF).');
  const cat = [...objs.values()].find(o => /\/Type\s*\/Catalog\b/.test(o.dict)), root = cat ? refOf(cat.dict, 'Pages') : null;
  const pages = [], fonts = new Map();
  const walk = (ref, inh, depth = 0) => {
    const o = objs.get(ref); if (!o || depth > 20) return;
    const d = o.dict, here = { MediaBox: numsOf(d, 'MediaBox') || inh.MediaBox, TrimBox: numsOf(d, 'TrimBox') || inh.TrimBox, BleedBox: numsOf(d, 'BleedBox') || inh.BleedBox, Resources: subDict(objs, d, 'Resources') ?? inh.Resources };
    if (/\/Type\s*\/Pages\b/.test(d)) { const kids = (d.match(/\/Kids\s*\[([^\]]*)\]/) || [])[1] || ''; for (const k of kids.matchAll(/(\d+)\s+\d+\s+R/g)) walk(Number(k[1]), here, depth + 1); return; }
    pages.push({ ref, d, ...here });
  };
  if (root) walk(root, {}); else errors.push('Lipsește arborele de pagini.');
  const declared = Number((objs.get(root)?.dict.match(/\/Count\s+(\d+)/) || [])[1]);
  const out = pages.map((pg, i) => {
    const res = pg.Resources || '', xo = namedRefs(subDict(objs, res, 'XObject')), fo = namedRefs(subDict(objs, res, 'Font'));
    const cRefs = [...(pg.d.match(/\/Contents\s*(\[[^\]]*\]|\d+\s+\d+\s+R)/)?.[1] || '').matchAll(/(\d+)\s+\d+\s+R/g)].map(x => Number(x[1]));
    let content = ''; for (const r of cRefs) { const o = objs.get(r); if (!o?.stream) continue; const txt = /\/FlateDecode/.test(o.dict) ? inflate(o.stream) : o.stream.toString('latin1'); if (txt == null) errors.push(`Pagina ${i + 1}: conținut necitibil.`); else content += txt + '\n'; }
    const images = [], text = [], stack = []; let ctm = [1, 0, 0, 1, 0, 0], tf = null, tm = [1, 0, 0, 1, 0, 0], operands = [];
    const toks = content.match(/<[0-9A-Fa-f\s]*>|\((?:\\.|[^\\)])*\)|\[[^\]]*\]|\/[^\s/<>\[\]()]+|-?\d*\.?\d+(?:e-?\d+)?|[A-Za-z'"*]+/g) || [];
    for (const t of toks) {
      if (/^-?\d*\.?\d/.test(t) || t.startsWith('/') || t.startsWith('<') || t.startsWith('(') || t.startsWith('[')) { operands.push(t); continue; }
      const num = k => Number(operands[operands.length - k]);
      if (t === 'q') stack.push(ctm); else if (t === 'Q') ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
      else if (t === 'cm') ctm = mul([num(6), num(5), num(4), num(3), num(2), num(1)], ctm);
      else if (t === 'Do') { const name = operands.at(-1)?.slice(1), ref = xo[name], x = objs.get(ref)?.dict || '';
        if (/\/Subtype\s*\/Image/.test(x)) { const w = Number((x.match(/\/Width\s+(\d+)/) || [])[1]), h = Number((x.match(/\/Height\s+(\d+)/) || [])[1]), pw = Math.hypot(ctm[0], ctm[1]), ph = Math.hypot(ctm[2], ctm[3]);
          images.push({ name, ref, width: w, height: h, placed: { x: ctm[4], y: ctm[5], w: pw, h: ph }, dpi: Math.round(Math.min(w / (pw / 72), h / (ph / 72)) * 10) / 10, smask: /\/SMask\s+\d+/.test(x) }); } }
      else if (t === 'BT') tm = [1, 0, 0, 1, 0, 0];
      else if (t === 'Tf') { const ref = fo[operands.at(-2)?.slice(1)]; if (ref != null && !fonts.has(ref)) fonts.set(ref, fontInfo(objs, ref)); tf = { name: operands.at(-2)?.slice(1), ref, size: num(1) }; }
      else if (t === 'Td' || t === 'TD') tm = [tm[0], tm[1], tm[2], tm[3], tm[4] + num(2), tm[5] + num(1)];
      else if (t === 'Tm') tm = [num(6), num(5), num(4), num(3), num(2), num(1)];
      else if (t === 'Tj' || t === 'TJ' || t === "'" || t === '"') {
        const f = tf?.ref != null ? fonts.get(tf.ref) : null, raw = operands.filter(o => o.startsWith('<') || o.startsWith('(') || o.startsWith('[')).join(' ');
        const hex = [...raw.matchAll(/<([0-9A-Fa-f\s]*)>/g)].map(x => x[1].replace(/\s+/g, '')).join('');
        const glyphs = f?.identity ? (hex.match(/.{4}/g) || []).map(x => parseInt(x, 16)) : [...raw.replace(/^\[|\]$/g, '').matchAll(/\(((?:\\.|[^\\)])*)\)/g)].flatMap(x => [...x[1]].map(c => c.charCodeAt(0)));
        const wUnits = f?.widths ? glyphs.reduce((a, g) => a + (f.widths.get(g) ?? f.dw), 0) : null;
        const origin = { x: tm[4] * ctm[0] + tm[5] * ctm[2] + ctm[4], y: tm[4] * ctm[1] + tm[5] * ctm[3] + ctm[5] };
        const decoded = f?.uni ? glyphs.map(g => f.uni.get(g) ?? '\uFFFD').join('') : f && !f.identity ? String.fromCharCode(...glyphs) : null;
        text.push({ text: decoded, font: tf?.name || null, fontRef: tf?.ref ?? null, size: tf?.size || null, x: Math.round(origin.x * 100) / 100, y: Math.round(origin.y * 100) / 100, glyphs: glyphs.length, notdef: f?.identity ? glyphs.filter(g => g === 0).length : 0, widthPt: wUnits != null && tf?.size ? Math.round(wUnits / 1000 * tf.size * 100) / 100 : null });
      }
      operands = [];
    }
    return { n: i + 1, mediaBox: pg.MediaBox || null, trimBox: pg.TrimBox || null, bleedBox: pg.BleedBox || null, images, text };
  });
  if (Number.isFinite(declared) && declared !== out.length) errors.push(`Arborele declară ${declared} pagini, are ${out.length}.`);
  const used = [...fonts.values()].map(f => ({ ref: f.ref, baseFont: f.baseFont, subtype: f.subtype, embedded: f.embedded }));
  return { version: INSPECT_VERSION, ok: !errors.length, errors, pageCount: out.length, pages: out, fontsUsed: used, producer: (s.match(/\/Producer\s*\(([^)]*)\)/) || [])[1] || null };
}

/** Requirements of a profile against an inspection: page count/size, embedded fonts, no .notdef, text inside the safe area, image DPI. */
export function checkInspection(ins, { pages, widthIn, heightIn, minDpi = 0, safeIn = 0.25, boxes = 'not_required', expectText = [] }) {
  const problems = [], add = (code, message, extra = {}) => problems.push({ code, message, ...extra });
  /* every expected line must be in the PDF's own text (a dropped character = a glyph the embedded font did not have) */
  const squash = x => String(x || '').normalize('NFC').replace(/\s+/g, ''), all = squash(ins.pages.flatMap(p => p.text.map(t => t.text || '')).join(''));
  for (const line of expectText) if (squash(line) && !all.includes(squash(line))) add('TEXT_MISSING', `Textul „${String(line).slice(0, 60)}” nu se regăsește în PDF (caractere lipsă din font sau text omis).`, { line: String(line).slice(0, 120) });
  if (!ins.ok) for (const e of ins.errors) add('PDF_STRUCTURE', e);
  if (pages != null && ins.pageCount !== pages) add('PAGE_COUNT', `PDF-ul are ${ins.pageCount} pagini; profilul cere ${pages}.`);
  for (const p of ins.pages) {
    const mb = p.mediaBox; if (!mb || Math.abs((mb[2] - mb[0]) / 72 - widthIn) > 0.002 || Math.abs((mb[3] - mb[1]) / 72 - heightIn) > 0.002) add('PAGE_SIZE', `Pagina ${p.n}: dimensiunea ${mb ? ((mb[2] - mb[0]) / 72).toFixed(3) + '×' + ((mb[3] - mb[1]) / 72).toFixed(3) : '?'} in diferă de ${widthIn}×${heightIn} in.`, { page: p.n });
    if (boxes === 'required' && (!p.trimBox || !p.bleedBox)) add('BOXES', `Pagina ${p.n}: lipsesc TrimBox/BleedBox cerute de profil.`, { page: p.n });
    for (const im of p.images) if (minDpi && im.dpi < minDpi - 0.5) add('IMAGE_DPI', `Pagina ${p.n}: imaginea plasată are ${im.dpi} DPI efectiv (minim ${minDpi}).`, { page: p.n, dpi: im.dpi });
    for (const t of p.text) {
      if (t.notdef) add('GLYPH_NOTDEF', `Pagina ${p.n}: ${t.notdef} caractere fără glifă în font.`, { page: p.n });
      const W = widthIn * 72, H = heightIn * 72, s = safeIn * 72, x0 = t.x - (t.widthPt != null ? 0 : 0), x1 = t.widthPt != null ? t.x + t.widthPt : t.x;
      if (x0 < s - 0.5 || x1 > W - s + 0.5 || t.y < s - 0.5 || t.y > H - s + 0.5) add('TEXT_BOUNDS', `Pagina ${p.n}: text în afara zonei sigure (${Math.round(t.x)}, ${Math.round(t.y)} pt).`, { page: p.n });
    }
  }
  for (const f of ins.fontsUsed) if (!f.embedded) add('FONT_NOT_EMBEDDED', `Fontul ${f.baseFont || f.ref} este folosit dar nu este încorporat.`, { font: f.baseFont });
  if (!ins.fontsUsed.length && ins.pages.some(p => p.text.length)) add('FONT_UNKNOWN', 'Textul nu are un font identificabil.');
  return { ok: !problems.length, problems, boxes: boxes === 'required' ? 'required' : 'not_required' };
}
