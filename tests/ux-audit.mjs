// P8-T07 — in-page UX/accessibility audit (evaluated in the real browser). Returns measured violations, never a score.
// Overflow: no horizontal page scroll. Reachable: every visible control lies inside the viewport (or inside a scroll
// container of its own). Named: every control has an accessible name. Target size (≤ 480 px wide): ≥ 24×24 CSS px,
// inline links in running text excepted (WCAG 2.5.8). Images have alt. A live region exists. A focus style exists.
export const AUDIT = `(() => {
  const vw = innerWidth, out = { width: vw, overflowX: Math.max(0, document.documentElement.scrollWidth - vw), offscreen: [], unnamed: [], smallTargets: [], imgNoAlt: [] };
  const visible = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden],[aria-hidden="true"]'); };
  const inScroller = el => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll') return true; } return false; };
  const labelled = el => { const id = el.getAttribute('aria-labelledby'); return id ? id.split(/\\s+/).map(x => document.getElementById(x)?.textContent || '').join(' ').trim() : ''; };
  const name = el => (el.getAttribute('aria-label') || labelled(el) || (el.labels ? [...el.labels].map(l => l.textContent).join(' ') : '') || el.getAttribute('title') || (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) ? '' : el.textContent) || el.querySelector?.('img[alt]')?.alt || (el.type === 'submit' || el.type === 'button' ? el.value : '') || '').trim();
  const desc = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '') + ' "' + (el.textContent || el.value || el.placeholder || '').trim().replace(/\\s+/g, ' ').slice(0, 28) + '"';
  for (const el of document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button], [tabindex]:not([tabindex="-1"])')) {
    if (!visible(el)) continue; const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !inScroller(el)) out.offscreen.push(desc(el));
    if (!name(el)) out.unnamed.push(desc(el));
    const inline = el.tagName === 'A' && el.closest('p, li, td, .hint, small') && getComputedStyle(el).display === 'inline';
    /* the target of a checkbox/radio (also a visually hidden one) is its clickable label; a zoomable region (pan/zoom
       timeline, image viewer) is exempt — the same actions exist as full-size controls (WCAG 2.5.8 equivalent) */
    const lab = (['checkbox', 'radio', 'file'].includes(el.type) || r.width < 2 || r.height < 2) ? (el.closest('label') || (el.id && document.querySelector('label[for="' + el.id + '"]'))) : null;
    const t = lab ? lab.getBoundingClientRect() : r, zoomable = !!el.closest('[data-panzoom]');
    if (vw <= 480 && !inline && !zoomable && (t.width < 24 || t.height < 24)) out.smallTargets.push(desc(el) + ' ' + Math.round(t.width) + '×' + Math.round(t.height));
  }
  for (const img of document.querySelectorAll('img')) if (visible(img) && !img.hasAttribute('alt')) out.imgNoAlt.push(img.getAttribute('src')?.slice(-40));
  /* every visible blocker leads to an action (a link or a button inside it) */
  out.blockersNoAction = [...document.querySelectorAll('.banner.err, .notice.err')].filter(visible).filter(b => !b.querySelector('a[href], button, [data-act]')).map(b => b.textContent.trim().replace(/\\s+/g, ' ').slice(0, 60));
  out.liveRegion = !!document.querySelector('[aria-live], [role=status], [role=alert]');
  out.focusStyle = [...document.styleSheets].some(ss => { try { return [...ss.cssRules].some(r => /:focus-visible|:focus\\b/.test(r.selectorText || '')); } catch { return false; } });
  out.title = document.title; out.main = !!document.querySelector('main, [role=main]'); out.h1 = !!document.querySelector('h1');
  return out;
})()`;
export const violations = a => [...(a.overflowX > 1 ? [`overflow-x ${a.overflowX}px`] : []), ...a.offscreen.map(x => `în afara ecranului: ${x}`), ...a.unnamed.map(x => `fără nume accesibil: ${x}`), ...a.smallTargets.map(x => `țintă mică: ${x}`), ...a.imgNoAlt.map(x => `imagine fără alt: ${x}`), ...(a.blockersNoAction || []).map(x => `blocaj fără acțiune: ${x}`), ...(a.liveRegion ? [] : ['fără regiune live']), ...(a.focusStyle ? [] : ['fără stil de focus']), ...(a.main ? [] : ['fără <main>'])];
