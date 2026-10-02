/* WonderPages.AI — P6-T01 shared layout measurement.
   ONE implementation for the server planner (loaded with node:vm), the browser preview and the canvas/PDF export:
   lines, block height, overflow, missing glyphs and the crop window are computed here in points from the font's own
   advance widths (public/fonts/andika-metrics.json), never from whatever the screen happens to render.
   The font size is never reduced to make text fit: the planner changes the layout or reports the overflow. */
(function (root) {
  'use strict';
  var FAMILY_WIDTH = { action: 0.88, dialogue: 0.72, surprise: 0.72, panorama: 1, intimate: 0.78 };
  var SIDE_WIDTH = 0.48, PAD = 0.55, LINE = 1.38, SAFE_IN = 0.375, BAND_MAX = 0.42, GUARD = 0.98;
  var M = null, T = {};
  function setMetrics(m) {
    M = m; T = {};
    Object.keys(m.fonts).forEach(function (w) { var f = m.fonts[w], a = new Map(); f.runs.forEach(function (r) { r[1].forEach(function (v, i) { a.set(r[0] + i, v); }); }); T[w] = { a: a, upm: f.unitsPerEm, notdef: f.notdef }; });
    return m.hash;
  }
  var ready = function () { return !!M; };
  var nfc = function (s) { return String(s == null ? '' : s).normalize('NFC'); };
  /* width in points of a run of text; characters the font does not have are reported (they would fall back) */
  function measure(text, sizePt, weight) {
    var t = T[weight || 400] || T[400]; if (!t) throw new Error('Măsurătorile fontului nu sunt încărcate.');
    var w = 0, missing = [];
    for (var ch of nfc(text)) { var c = ch.codePointAt(0), adv = t.a.get(c); if (adv == null) { if (/\p{M}/u.test(ch)) adv = 0; else { adv = t.notdef; if (!/\s/.test(ch) && missing.indexOf(ch) < 0) missing.push(ch); } } w += adv; }
    return { width: w / t.upm * sizePt, missing: missing };
  }
  function wrap(text, sizePt, maxW, weight) {
    var lines = [], widths = [], overlong = [], space = measure(' ', sizePt, weight).width;
    nfc(text).split(/\n+/).forEach(function (para) {
      var line = '', lw = 0;
      para.split(/\s+/).filter(Boolean).forEach(function (word) {
        var ww = measure(word, sizePt, weight).width; if (ww > maxW) overlong.push(word);
        if (line && lw + space + ww > maxW) { lines.push(line); widths.push(lw); line = word; lw = ww; }
        else { lw = line ? lw + space + ww : ww; line = line ? line + ' ' + word : word; }
      });
      if (line) { lines.push(line); widths.push(lw); }
    });
    return { lines: lines, widths: widths, overlong: overlong };
  }
  /* page geometry in points, identical to the export: page = trim + 2·bleed unless the print plan gives the page size
     (KDP: trim + bleed on the outside edge), safe = bleed + 3/8 in */
  function geometry(o) {
    var b = (o.bleedIn || 0) * 72, w = (o.widthIn || o.trimW + 2 * (o.bleedIn || 0)) * 72, h = (o.heightIn || o.trimH + 2 * (o.bleedIn || 0)) * 72, safe = b + SAFE_IN * 72;
    return { w: w, h: h, bleed: b, safe: safe, liveW: w - 2 * safe, liveH: h - 2 * safe };
  }
  function textBox(g, zone, family, sizePt) {
    var side = zone === 'left' || zone === 'right', boxW = g.liveW * (side ? SIDE_WIDTH : (FAMILY_WIDTH[family] || 1)), pad = sizePt * PAD;
    return { boxW: boxW, innerW: (boxW - 2 * pad) * GUARD, pad: pad, maxH: side ? g.liveH : g.liveH * BAND_MAX };
  }
  function boxRect(g, zone, boxW, h) {
    var x = zone === 'left' ? g.safe : zone === 'right' ? g.w - g.safe - boxW : (g.w - boxW) / 2;
    var y = zone === 'top' || zone === 'left' || zone === 'right' ? g.safe : g.h - g.safe - h;
    return { x: x, y: y, w: boxW, h: h };
  }
  /* one text block: same lines, height and verdict in preview and export */
  function fitText(text, o) {
    var g = o.geom, size = o.sizePt, box = textBox(g, o.zone, o.family, size), r = wrap(text, size, box.innerW, o.weight);
    var lh = size * LINE, h = r.lines.length * lh + 2 * box.pad, miss = measure(text, size, o.weight).missing;
    return { zone: o.zone, family: o.family, sizePt: size, lineHeightPt: round(lh), lines: r.lines, widths: r.widths.map(round), heightPt: round(h), boxWidthPt: round(box.boxW), innerWidthPt: round(box.innerW), maxHeightPt: round(box.maxH),
      rect: roundRect(boxRect(g, o.zone, box.boxW, h)), fits: !r.overlong.length && h <= box.maxH, overflow: r.overlong.length ? { kind: 'word_too_long', words: r.overlong } : h > box.maxH ? { kind: 'height', byPt: round(h - box.maxH) } : null, missing: miss };
  }
  /* cover-fit crop window (normalised to the source image) that keeps every protected region inside the safe area */
  function cropWindow(o) {
    var g = o.geom, r = Math.max(g.w / o.imgW, g.h / o.imgH), fw = g.w / (o.imgW * r), fh = g.h / (o.imgH * r);
    var sx = g.safe / g.w, sy = g.safe / g.h, x = (1 - fw) / 2, y = (1 - fh) / 2, cut = [];
    function axis(c, f, s, lo0, key) {
      var lo = 0, hi = 1 - f;
      (o.protect || []).forEach(function (p) { var a = p[key], b = p[key] + p[key === 'x' ? 'w' : 'h']; lo = Math.max(lo, b - (1 - s) * f); hi = Math.min(hi, a - s * f); });
      if (lo > hi + 1e-9) return { v: c, ok: false };
      return { v: Math.min(Math.max(c, lo), hi), ok: true, moved: Math.abs(Math.min(Math.max(c, lo), hi) - lo0) > 1e-9 };
    }
    var ax = axis(x, fw, sx, x, 'x'), ay = axis(y, fh, sy, y, 'y');
    (o.protect || []).forEach(function (p) {
      var px0 = (p.x - ax.v) / fw, px1 = (p.x + p.w - ax.v) / fw, py0 = (p.y - ay.v) / fh, py1 = (p.y + p.h - ay.v) / fh;
      if (px0 < sx - 1e-9 || px1 > 1 - sx + 1e-9 || py0 < sy - 1e-9 || py1 > 1 - sy + 1e-9) cut.push(p.label || p.id || 'regiune protejată');
    });
    return { x: round4(ax.v), y: round4(ay.v), w: round4(fw), h: round4(fh), moved: !!(ax.moved || ay.moved), cut: cut,
      objectPosition: (fw < 1 ? round4(ax.v / (1 - fw)) * 100 : 50).toFixed(2) + '% ' + (fh < 1 ? round4(ay.v / (1 - fh)) * 100 : 50).toFixed(2) + '%' };
  }
  /* where a protected image region lands on the page (points) for a given crop */
  function regionOnPage(g, crop, p) { return { x: (p.x - crop.x) / crop.w * g.w, y: (p.y - crop.y) / crop.h * g.h, w: p.w / crop.w * g.w, h: p.h / crop.h * g.h }; }
  var overlap = function (a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; };
  /* deterministic hash (FNV-1a, two lanes) of a canonical JSON: the same report hashes the same in Node and the browser */
  function stable(v) { if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']'; if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter(function (k) { return v[k] !== undefined; }).map(function (k) { return JSON.stringify(k) + ':' + stable(v[k]); }).join(',') + '}'; return JSON.stringify(v === undefined ? null : v); }
  function hash(v) { var s = stable(v), h1 = 0x811c9dc5, h2 = 0x01000193 ^ s.length; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 ^ c, 2246822519) >>> 0; } return ('00000000' + h1.toString(16)).slice(-8) + ('00000000' + h2.toString(16)).slice(-8); }
  function round(n) { return Math.round(n * 100) / 100; }
  function round4(n) { return Math.round(n * 10000) / 10000; }
  function roundRect(r) { return { x: round(r.x), y: round(r.y), w: round(r.w), h: round(r.h) }; }
  /* the measurement record of one page/language — what preview and export must both reproduce */
  function measurementOf(f) { return { zone: f.zone, family: f.family, sizePt: f.sizePt, lines: f.lines, heightPt: f.heightPt, boxWidthPt: f.boxWidthPt, fits: f.fits }; }
  root.WPLayout = Object.freeze({ VERSION: 1, FAMILY_WIDTH: FAMILY_WIDTH, SIDE_WIDTH: SIDE_WIDTH, PAD: PAD, LINE: LINE, BAND_MAX: BAND_MAX, setMetrics: setMetrics, ready: ready, metricsHash: function () { return M && M.hash; },
    measure: measure, wrap: wrap, geometry: geometry, textBox: textBox, fitText: fitText, cropWindow: cropWindow, regionOnPage: regionOnPage, overlap: overlap, hash: hash, measurementOf: measurementOf });
})(typeof globalThis !== 'undefined' ? globalThis : window);
