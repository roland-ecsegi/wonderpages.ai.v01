/* audit L1: the book font is local; if it is missing, you are told (the PDF would use a fallback font) */
let fontWarned = false;
async function bookFontReady() {
  try { await Promise.all([document.fonts.load('400 40px Andika'), document.fonts.load('700 40px Andika')]); } catch (e) { throw new Error('Fonturile cărții nu s-au încărcat: '+e.message); }
  const ok = document.fonts.check('400 40px Andika') && document.fonts.check('700 40px Andika');
  if (!ok && !fontWarned) { fontWarned = true; toast('Fontul cărților (Andika) lipsește din aplicație; exportul final este oprit până la recuperarea fontului. Rulează din nou instalatorul (vezi Setări > Diagnostic).', 'error'); }
  return ok;
}
/* WonderPages.AI — Crearea PDF-urilor (tipar și digital), livrarea și pornirea aplicației.
   Scripturi clasice încărcate în ordine (core, views, ui, actions, pdf); împart același spațiu global. */
/* ============================================================
   EXPORT: pages rendered on canvas at print resolution, then PDF
   ============================================================ */
function paintExport() {
  if (S.renderJob && S.exporting) { const n = Date.now(); if (!S._rp || n - S._rp > 700) { S._rp = n; api('POST', `/render/${S.renderJob}/progress`, { label: S.exporting.label, i: S.exporting.i, n: S.exporting.n }).catch(() => {}); } }
  const el = $('#xprog'); if (!el) return;
  const x = S.exporting;
  el.textContent = x ? `${x.label}${x.n && x.i ? `: pagina ${x.i} din ${x.n}` : ''}` : '';
}
const slugify = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 80) || 'carte';
function loadImg(url) {
  return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => rej(new Error('img')); img.src = url; });
}
function drawCover(g, img, px, ph, crop) {
  if (crop && crop.w > 0 && crop.h > 0) { g.drawImage(img, crop.x * img.width, crop.y * img.height, crop.w * img.width, crop.h * img.height, 0, 0, px, ph); return; }   // P6-T01: measured crop (protected regions inside the safe area)
  const r = Math.max(px / img.width, ph / img.height); const w = img.width * r, h = img.height * r;
  g.drawImage(img, (px - w) / 2, (ph - h) / 2, w, h);
}
/* P6-T01: the export re-measures every text block with the shared code and must find the plan's exact lines */
function verifyLayoutPlan(lay) {
  if (!window.WPLayout || !WPLayout.ready()) throw new Error('Măsurătorile fontului cărții nu s-au încărcat; exportul se oprește (nu se măsoară cu alt font).');
  if (lay.metricsHash !== WPLayout.metricsHash()) throw new Error('Măsurătorile fontului din browser diferă de cele ale serverului; reîncarcă aplicația.');
  if (lay.blocking) throw new Error('Macheta are probleme blocante: ' + lay.findings.filter(f => f.blocking).slice(0, 2).map(f => f.message).join(' '));
  const geom = WPLayout.geometry(lay.geometry);
  for (const pg of lay.pages) for (const [id, tb] of Object.entries(pg.textBlocks || {})) {
    const again = WPLayout.fitText(tb.lines.join(' '), { geom, zone: pg.zone, family: pg.family, sizePt: pg.sizePt, weight: 400 });
    if (again.lines.join('\n') !== tb.lines.join('\n') || !again.fits) throw new Error(`Pagina ${pg.n} (${tb.language}): măsurarea exportului diferă de previzualizare; exportul se oprește.`);
  }
  return lay;
}
function wrapLines(g, text, maxW) {
  const out = [];
  for (const para of String(text || '').split(/\n+/)) {
    let line = '';
    for (const w of para.split(/\s+/).filter(Boolean)) {
      const t = line ? line + ' ' + w : w;
      if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    if (line) out.push(line);
  }
  return out;
}
function rrect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
/* a block of text segments (different sizes/weights) inside a rounded paper band */
function drawBlock(g, segs, { px, ph = px, safe, zone, maxW, alpha = 0.9, bg = true }) {
  const base = Math.max(...segs.map(s => s.size));
  const pad = base * 0.55;
  const laid = segs.filter(s => s.text).map(s => { g.font = `${s.weight || 400} ${s.size}px Andika, "Trebuchet MS", sans-serif`; return { ...s, lines: s.lines || wrapLines(g, s.text, maxW - pad * 2), lh: s.size * (s.lh || 1.32) }; });
  const gap = base * 0.25;
  const h = laid.reduce((a, s) => a + s.lines.length * s.lh, 0) + gap * Math.max(0, laid.length - 1) + pad * 2;
  const x = zone === 'left' ? safe : zone === 'right' ? px - safe - maxW : (px - maxW) / 2;
  const y = zone === 'top' ? safe : zone === 'middle' ? (ph - h) / 2 : ph - safe - h;
  if (h > ph - safe * 2 || laid.some(seg => { g.font = `${seg.weight || 400} ${seg.size}px Andika`; return seg.lines.some(line => g.measureText(line).width > maxW - pad * 2); })) throw new Error('Textul nu încape în zona lizibilă. Ajustează macheta sau textul; fontul nu a fost micșorat.');
  if (bg) { g.fillStyle = `rgba(255,255,255,${alpha})`; rrect(g, x, y, maxW, h, base * 0.45); g.fill(); }
  g.fillStyle = '#1C1C1F'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let cy = y + pad;
  laid.forEach((s, i) => {
    g.font = `${s.weight || 400} ${s.size}px Andika, "Trebuchet MS", sans-serif`;
    s.lines.forEach(l => { if (S.vectorText) S.vectorText.push({ text: l, x: x + maxW / 2, y: cy + s.lh / 2, size: s.size, weight: s.weight || 400 }); else g.fillText(l, x + maxW / 2, cy + s.lh / 2); cy += s.lh; });
    if (i < laid.length - 1) cy += gap;
  });
}
function tint(hex, amt) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return '#F4F1F8';
  const n = parseInt(m[1], 16); const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(x => Math.round(x + (255 - x) * amt));
  return `rgb(${c.join(',')})`;
}
async function drawPage({ v, pg, book, src, src2 = null, age, px, ph, dpi, bleedPx }) {
  const c = document.createElement('canvas'); c.width = px; c.height = ph;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, px, ph);
  const safe = bleedPx + 0.375 * dpi;
  const maxW = px - safe * 2;
  const fpx = pt => pt / 72 * dpi;
  const pt = age.font_pt || 20;
  const coll = src.c.collection_title || S.art.brief?.content?.collection_title || '';
  const lab = src.c.labels || {};
  if (pg === 'blank') return c;
  if (pg === 'characters' || pg === 'reflection') {
    const romanian = (src.key?.startsWith('tr_') ? curProject()?.input?.second_language : curProject()?.input?.language) === 'Romanian';
    const text = pg === 'characters' ? (S.art.bible?.content?.characters || []).map(ch => ch.name).join(' · ') : (src.c.read_together_questions || [romanian ? 'Care a fost momentul tău preferat? Ce ai fi făcut tu?' : 'What was your favourite moment? What would you have done?']).join('\n');
    drawBlock(g, [{ text, size: fpx(pt), weight: 400 }], { px, ph, safe, zone: 'middle', maxW, bg: false }); return c;
  }
  if (pg === 'title') {
    drawBlock(g, [{ text: coll, size: fpx(pt * 1.1), weight: 700 }, { text: src.c.title || '', size: fpx(pt * 1.7), weight: 700, lh: 1.15 }, { text: lab.title_page || '', size: fpx(pt * 0.8) }], { px, ph, safe, zone: 'middle', maxW: maxW * 0.9, bg: false });
    return c;
  }
  if (pg === 'copyright') {
    drawBlock(g, [{ text: `© ${new Date().getFullYear()} ${coll}. ${lab.rights || 'Toate drepturile rezervate.'}`, size: fpx(10) }, { text: lab.ai_notice || 'Text și ilustrații create cu ajutorul inteligenței artificiale și verificate de editor.', size: fpx(9), lh: 1.4 }], { px, ph, safe, zone: 'bottom', maxW: maxW * 0.85, bg: false });
    return c;
  }
  if (pg === 'back') {
    const pal = S.art.bible?.content?.style_guide?.palette || [];
    if (book.mode !== 'lineart') { g.fillStyle = tint(pal[0]?.hex, 0.82); g.fillRect(0, 0, px, ph); }
    drawBlock(g, [{ text: coll, size: fpx(pt * 1.1), weight: 700 }, book.back_text === false ? { text: `${lab.volume || 'Volumul'} ${v + 1}`, size: fpx(pt * 0.8) } : { text: src.c.back_cover_blurb || '', size: fpx(pt * 0.85), lh: 1.45 }], { px, ph, safe, zone: 'middle', maxW: maxW * 0.86, bg: false });
    return c;
  }
  const ill = S.art[`ill_${v}_${pg}`]?.content;
  const rel = book.mode === 'lineart' ? ill?.lineart : ill?.color;
  if (book.textOnly) { /* facing text page: illustration is on the paired physical page */ }
  else if (rel) {
    const image = await loadImg(fileUrl(rel));
    if (S.printValidation) { const actualDpi = Math.min(image.naturalWidth / (px / S.printValidation.dpi), image.naturalHeight / (ph / S.printValidation.dpi)); if (actualDpi < S.printValidation.minDpi) throw new Error('Rezoluția ilustrației este ' + Math.round(actualDpi) + ' DPI; profilul cere ' + S.printValidation.minDpi + '.'); }
    drawCover(g, image, px, ph, typeof pg === 'number' && pg > 0 ? S.layoutExport?.pages?.[pg - 1]?.crop : null);
  } else {
    if (S.finalExport && curProject()?.options?.images !== false) throw new Error('Lipsește ilustrația pentru pagina ' + pg + '.');
    g.fillStyle = '#F1F2F4'; g.fillRect(0, 0, px, ph);
    g.fillStyle = '#9AA0AC'; g.font = `400 ${fpx(14)}px Andika, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('Ilustrație în așteptare', px / 2, ph / 2);
  }
  if (pg === 0) {
    drawBlock(g, [
      { text: coll, size: fpx(pt * 1.9), weight: 700, lh: 1.12 },
      ...(age.cover_volume_title ? [{ text: src.c.title || '', size: fpx(pt * 1.0), weight: 700 }] : []),
      { text: `${lab.volume || 'Volumul'} ${v + 1}`, size: fpx(pt * 0.8), weight: 700 }
    ], { px, ph, safe, zone: 'top', maxW });
    if (book.stamp) {                                                   // Storybook / Coloringbook stamp
      const fs = fpx(pt * 0.95); g.save(); g.font = `700 ${fs}px Andika, "Trebuchet MS", sans-serif`;
      const tw = g.measureText(book.stamp).width, bw = tw + fs * 1.6, bh = fs * 1.9;
      g.translate(px - safe - bw / 2, ph - safe - bh / 2); g.rotate(-8 * Math.PI / 180);
      rrect(g, -bw / 2, -bh / 2, bw, bh, bh / 2);
      if (book.mode === 'lineart') { g.fillStyle = '#fff'; g.fill(); g.lineWidth = fs * 0.18; g.strokeStyle = '#111'; g.stroke(); g.fillStyle = '#111'; }
      else { g.lineWidth = fs * 0.5; g.strokeStyle = '#fff'; g.stroke(); g.fillStyle = '#F07F63'; g.fill(); g.fillStyle = '#fff'; }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(book.stamp, 0, fs * 0.05); g.restore();
    }
  } else {
    const page = (src.c.pages || [])[pg - 1];
    const t2 = src2?.c?.pages?.[pg - 1]?.text;
    const lp = S.layoutExport?.pages?.[pg - 1], tb = lp?.textBlocks?.[src.key?.startsWith('tr_') ? 'second' : 'first'];
    if (page?.text && book.page_text !== false && !book.illustrationOnly) {
      if (tb) drawBlock(g, [{ text: page.text, lines: tb.lines, size: fpx(lp.sizePt), lh: WPLayout.LINE }], { px, ph, safe, zone: lp.zone, maxW: tb.boxWidthPt / 72 * dpi });   // P6-T01: the plan's lines, font never below the profile
      else if (S.finalExport) throw new Error('Pagina ' + pg + ' nu are măsurarea machetei; exportul final se oprește.');
      else drawBlock(g, [{ text: page.text, size: fpx(pt), lh: 1.38 }], { px, ph, safe, zone: page.layout?.text_zone || page.text_zone || 'bottom', maxW: maxW * (['left','right'].includes(page.layout?.text_zone || page.text_zone) ? 0.48 : ({action:.88,dialogue:.72,surprise:.72,panorama:1,intimate:.78}[page.layout?.family] || 1)) });
    }
  }
  return c;
}
let pdfFonts = null;
async function preparePdfFonts(pdf) {
  if (!pdfFonts) pdfFonts = await Promise.all(['Regular', 'Bold'].map(async weight => { const r = await fetch('/fonts/Andika-' + weight + '.ttf'); if (!r.ok) throw new Error('Lipsește fontul Andika.'); const bytes = new Uint8Array(await r.arrayBuffer()); let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192)); return btoa(binary); }));
  for (const [i, style] of ['normal', 'bold'].entries()) { const file = 'Andika-' + style + '.ttf'; pdf.addFileToVFS(file, pdfFonts[i]); pdf.addFont(file, 'Andika', style); }
}
const LANG = { English: 'en', Romanian: 'ro', German: 'de', French: 'fr', Spanish: 'es', Italian: 'it', Hungarian: 'hu' };
async function exportBook(v, bookKey, opt = {}) {
  const p = curProject(); const bp = S.bp; if (!p || !bp || (S.exporting && !opt.inPackage)) return;
  opt = { ...opt, noLang: (bp.structure.books || []).find(b => b.key === bookKey)?.per_language === false };
  if (!window.jspdf?.jsPDF) { toast('Modulul PDF nu s-a încărcat. Rulează npm install și repornește serverul.'); return; }
  const preset = (bp.export?.presets || []).find(x => x.key === S.preset) || bp.export.presets[0];
  const exportFingerprint = S.delivery?.fingerprints?.[v] || '';
  const bi = bookInfo(p); const src = bi.src(v, opt.lang || S.book.lang); if (!src) return;
  const langTag = !bi.bilingual || opt.noLang ? '' : opt.lang === 'both' ? `-${LANG[p.input.language] || 'l1'}-${LANG[p.input.second_language] || 'l2'}` : '-' + (LANG[(opt.lang || S.book.lang) === 'second' ? p.input.second_language : p.input.language] || 'l2');
  const book = (bp.structure.books || []).find(b => b.key === bookKey) || { key: bookKey, mode: 'color', label: bookKey };
  if (!(await bookFontReady())) throw new Error('Fontul cărții nu este disponibil.');
  const plan = preset.key === 'kdp' ? await api('GET', `/projects/${p.id}/print-plan?book=${bookKey}&profile=kdp`) : null;
  const fmt = bi.fmt; const bleedIn = (preset.bleed_mm || 0) / 25.4;
  const W = plan?.width || fmt.trim_w_in + 2 * bleedIn, H = plan?.height || fmt.trim_h_in + 2 * bleedIn;
  const px = Math.round(W * preset.dpi), ph = Math.round(H * preset.dpi); const bleedPx = bleedIn * preset.dpi;
  const P = bp.structure.pages; const range = () => Array.from({ length: P }, (_, i) => i + 1);
  const entries = book.mode === 'combined'
    ? [{ pg: 'title', mode: 'color' }, { pg: 'copyright', mode: 'color' }, ...range().map(pg => ({ pg, mode: 'color' })), ...range().map(pg => ({ pg, mode: 'lineart' }))]
    : [0, ...range(), ...(book.back_cover ? ['back'] : [])].map(pg => ({ pg, mode: book.mode }));
  const list = plan?.pages || entries;
  S.exporting = { label: `${opt.prefix || ''}${book.label}, volumul ${v + 1}`, i: 0, n: list.length }; if (opt.inPackage) paintExport(); else render();
  try {
    S.layoutExport = verifyLayoutPlan(await api('GET', `/projects/${p.id}/layout/${v + 1}?preset=${encodeURIComponent(preset.key)}`));
    S.finalExport = !!opt.inPackage; S.printValidation = preset.key !== 'digital' ? { dpi: preset.dpi, minDpi: plan?.minDpi || 300 } : null;
    const pdf = new window.jspdf.jsPDF({ unit: 'in', format: [W, H], orientation: 'portrait', compress: true });
    await preparePdfFonts(pdf);
    for (let i = 0; i < list.length; i++) {
      S.exporting.i = i + 1; paintExport(); await sleep(0);
      const src2 = opt.lang === 'both' && S.art[`tr_${v}`] ? bi.src(v, 'second') : null;
      S.vectorText = [];
      const c = await drawPage({ v, pg: list[i].pg, book: { ...book, ...list[i], mode: list[i].mode }, src, src2, age: bi.age, px, ph, dpi: preset.dpi, bleedPx });
      if (i) pdf.addPage([W, H], 'portrait');
      pdf.addImage(c.toDataURL('image/png'), 'PNG', 0, 0, W, H, undefined, 'FAST');
      for (const t of S.vectorText) { pdf.setFont('Andika', t.weight >= 700 ? 'bold' : 'normal'); pdf.setFontSize(t.size / preset.dpi * 72); pdf.setTextColor(28, 28, 31); pdf.text(t.text, t.x / preset.dpi, t.y / preset.dpi, { align: 'center', baseline: 'middle' }); }
      S.vectorText = null;
      c.width = c.height = 1;
    }
    const coll = S.art.brief?.content?.collection_title || p.title;
    pdf.setProperties({ title: `${coll}: ${src.c.title || ''} (${book.label})`, creator: 'WonderPages.AI', subject: `${p.typeName} v${p.typeVersion}` });
    const blob = pdf.output('blob');
    const filename = `${slugify(coll)}-vol${v + 1}-${slugify(book.key)}${langTag}-${preset.key}.pdf`;
    S.exporting.label = 'Salvez în folderul proiectului'; S.exporting.i = 0; paintExport();
    const r = await api('POST', `/projects/${p.id}/exports?name=${encodeURIComponent(filename)}&kind=${opt.inPackage ? 'final' : 'preview'}&volume=${v}&book=${encodeURIComponent(bookKey)}&lang=${opt.lang || S.book.lang || 'first'}&preset=${preset.key}&fingerprint=${exportFingerprint}&layout=${S.layoutExport.measurementHash}`, blob, true);
    if (!opt.silent) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); toast('PDF salvat și în ' + r.path); }
  } catch (e) {
    if (opt.inPackage) throw e;
    toast('Exportul nu a reușit: ' + (e?.message || e?.code || e));
  } finally { S.finalExport = false; S.printValidation = null; S.vectorText = null; S.layoutExport = null; if (!opt.inPackage) { S.exporting = null; render(); } }
}
function bookRuns(p, bi, books) {
  const two = bi.bilingual && Object.keys(S.art).some(k => k.startsWith('tr_'));
  return books.flatMap(b => b.per_language && two ? [{ b, lang: 'first' }, { b, lang: 'second' }] : [{ b, lang: 'first' }]);
}
async function deliverVolume(v) {
  const p = curProject(); const bp = S.bp; if (!p || !bp || S.exporting) return;
  if (!window.jspdf?.jsPDF) { toast('Modulul PDF nu s-a încărcat. Repornește aplicația.'); return; }
  const bi = bookInfo(p); const runs = bookRuns(p, bi, bp.structure.books || []); let k = 0;
  S.exporting = { label: `Pregătesc volumul ${v + 1}`, i: 0, n: 0 }; render();
  try {
    for (const r of runs) { k++; await exportBook(v, r.b.key, { silent: true, inPackage: true, lang: r.lang, prefix: `PDF ${k} din ${runs.length}: ` }); }
    if (S.preset === 'kdp') for (const r of runs) await exportCoverWrap(v, { silent: true, inPackage: true, lang: r.lang, bookKey: r.b.key });
    S.exporting = { label: 'Creez arhiva volumului', i: 0, n: 0 }; paintExport();
    const res = await api('POST', `/projects/${p.id}/package?volume=${v}`);
    if (S.renderJob) { await api('POST', `/render/${S.renderJob}/done`, { ok: true, message: `Volumul ${v + 1} livrat: ${res.files} fișiere în ${res.folder}${res.mirror ? ` și copiat în ${res.mirror.dir}` : ''}${res.mirrorError ? '. ' + res.mirrorError : ''}`, result: res }); return; }
    toast(`Volumul ${v + 1} livrat: ${res.files} fișiere în ${res.folder}${res.mirror ? ` și copiat în ${res.mirror.dir}` : ''}${res.mirrorError ? '. ' + res.mirrorError : ''}`);
    const a = document.createElement('a'); a.href = `/api/projects/${p.id}/package.zip?volume=${v}`; document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { if (S.renderJob) { await api('POST', `/render/${S.renderJob}/done`, { ok: false, message: 'Livrarea nu a reușit: ' + (e?.message || e) }).catch(() => {}); return; } toast('Livrarea nu a reușit: ' + (e?.message || e)); }
  finally { S.exporting = null; render(); }
}
/* KDP paperback cover: back + spine + front on one sheet; spine width from the interior page count */
async function exportCoverWrap(v, opt = {}) {
  const p = curProject(), bp = S.bp; if (!p || !bp || (S.exporting && !opt.inPackage)) return;
  const book = (bp.structure.books || []).find(b => b.key === (opt.bookKey || S.book.mode)) || bp.structure.books[0];
  const bi = bookInfo(p), lang = book.per_language === false ? 'first' : opt.lang || S.book.lang || 'first', src = bi.src(v, lang); if (!src) return;
  const plan = await api('GET', '/projects/'+p.id+'/print-plan?book='+book.key+'&profile=kdp');
  const fingerprint = S.delivery?.fingerprints?.[v] || '';
  const fmt = bi.fmt, bleed = 0.125, interior = plan.pages.length;
  const spine = interior * (book.mode === 'lineart' ? 0.002252 : 0.002347);
  const W = fmt.trim_w_in * 2 + spine + bleed * 2, H = fmt.trim_h_in + bleed * 2, dpi = 300;
  const px = Math.round(W*dpi), ph = Math.round(H*dpi), half = Math.round((fmt.trim_w_in+bleed)*dpi), frontX=px-half;
  if (!opt.inPackage) { S.exporting={label:'Copertă separată: '+book.label+', volumul '+(v+1),i:1,n:1};render(); }
  try {
    if (!(await bookFontReady())) throw Error('Fontul cărții lipsește.');
    S.finalExport=!!opt.inPackage;S.printValidation={dpi,minDpi:300};S.vectorText=[];
    const c=document.createElement('canvas');c.width=px;c.height=ph;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,px,ph);
    const back=await drawPage({v,pg:'back',book,src,age:bi.age,px:half,ph,dpi,bleedPx:bleed*dpi});
    const backText=S.vectorText;S.vectorText=[];
    const front=await drawPage({v,pg:0,book,src,age:bi.age,px:half,ph,dpi,bleedPx:bleed*dpi});
    const text=[...backText,...S.vectorText.map(t=>({...t,x:t.x+frontX}))];S.vectorText=null;
    g.drawImage(back,0,0);g.drawImage(front,frontX,0);
    g.fillStyle=book.mode==='lineart'?'#fff':S.art.bible?.content?.style_guide?.palette?.[0]?.hex||'#3a5a6a';g.fillRect(half,0,frontX-half,ph);
    // KDP places its barcode in this clear 2 × 1.2 inch zone on the back cover.
    const barcode={x:(bleed+fmt.trim_w_in-0.25-2)*dpi,y:(H-bleed-0.25-1.2)*dpi,w:2*dpi,h:1.2*dpi};
    if(text.some(t=>t.x>barcode.x && t.x<barcode.x+barcode.w && t.y>barcode.y && t.y<barcode.y+barcode.h))throw Error('Textul de pe coperta spate intră în zona codului de bare. Ajustează descrierea.');
    g.fillStyle='#fff';g.fillRect(barcode.x,barcode.y,barcode.w,barcode.h);
    const pdf=new window.jspdf.jsPDF({unit:'in',format:[W,H],orientation:'landscape',compress:true});await preparePdfFonts(pdf);
    pdf.addImage(c.toDataURL('image/png'),'PNG',0,0,W,H,undefined,'FAST');
    for(const t of text){pdf.setFont('Andika',t.weight>=700?'bold':'normal');pdf.setFontSize(t.size/dpi*72);pdf.setTextColor(28,28,31);pdf.text(t.text,t.x/dpi,t.y/dpi,{align:'center',baseline:'middle'});}
    const blob=pdf.output('blob'),coll=S.art.brief?.content?.collection_title||p.title,tag=book.per_language!==false&&bi.bilingual?'-'+(LANG[lang==='second'?p.input.second_language:p.input.language]||lang):'';
    const filename=slugify(coll)+'-vol'+(v+1)+'-'+book.key+'-cover'+tag+'-kdp.pdf';
    const r=await api('POST','/projects/'+p.id+'/exports?name='+encodeURIComponent(filename)+'&kind='+(opt.inPackage?'final':'preview')+'&volume='+v+'&book='+book.key+'-cover&lang='+lang+'&preset=kdp&fingerprint='+fingerprint,blob,true);
    if(!opt.silent)toast('Copertă salvată pentru '+interior+' pagini. Verifică șablonul KDP și proba de tipar: '+r.path);
    c.width=c.height=1;
  } catch(e){if(opt.inPackage)throw e;toast('Coperta nu a putut fi creată: '+e.message);}
  finally{S.finalExport=false;S.printValidation=null;S.vectorText=null;if(!opt.inPackage){S.exporting=null;render();}}
}
/* all PDFs for all volumes, then images + publishing details, then one ZIP */
async function packageAll() {
  const p = curProject(); const bp = S.bp; if (!p || !bp || S.exporting) return;
  if (!window.jspdf?.jsPDF) { toast('Modulul PDF nu s-a încărcat. Repornește aplicația.'); return; }
  const bi = bookInfo(p); const vols = Array.from({ length: bp.structure.volumes }, (_, i) => i).filter(v => bi.src(v));
  const books = bp.structure.books || []; const total = vols.length * books.length; let k = 0;
  S.exporting = { label: 'Pregătesc pachetul final', i: 0, n: 0 }; render();
  try {
    const runs = bookRuns(p, bi, books); const all = runs.length * vols.length;
    for (const v of vols) for (const r of runs) { k++; await exportBook(v, r.b.key, { silent: true, inPackage: true, lang: r.lang, prefix: `PDF ${k} din ${all}: ` }); }
    if (S.preset === 'kdp') for (const v of vols) for (const r of runs) await exportCoverWrap(v, { silent: true, inPackage: true, lang: r.lang, bookKey: r.b.key });
    S.exporting = { label: 'Copiez imaginile și creez arhiva ZIP', i: 0, n: 0 }; paintExport();
    const r = await api('POST', `/projects/${p.id}/package`);
    toast(`Pachet final gata: ${r.files} fișiere în ${r.folder}`);
    const a = document.createElement('a'); a.href = `/api/projects/${p.id}/package.zip`; document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { toast('Pachetul nu a putut fi creat: ' + (e?.message || e)); }
  finally { S.exporting = null; render(); }
}

boot();
