/* WonderPages.AI — Componente interactive: mărire/mutare, cronologie, aprobări pe elemente, vizualizator, pachete, Dali.
   Scripturi clasice încărcate în ordine (core, views, ui, actions, pdf); împart același spațiu global. */
/* ---------- pan & zoom: wheel, drag, pinch, arrow keys, + / - / 0 ---------- */
function initPanZooms() {
  for (const host of $$('[data-panzoom]:not([data-wait])')) {
    const key = host.dataset.panzoom; const inner = host.querySelector('.pz-inner'); if (!inner || host._pz) continue; host._pz = true;
    let st = S.pz[key]; const W = () => host.clientWidth, H = () => host.clientHeight;
    const nat = () => ({ w: inner.scrollWidth || inner.firstElementChild?.getBoundingClientRect().width || 1, h: inner.scrollHeight || 1 });
    const apply = () => { inner.style.transform = `translate(${st.x}px,${st.y}px) scale(${st.s})`; S.pz[key] = st; };
    const fit = () => { const n = nat(); const s = Math.min(W() / n.w, H() / n.h, host.dataset.maxfit ? Number(host.dataset.maxfit) : 1.5) * 0.96; st = { s, x: (W() - n.w * s) / 2, y: (H() - n.h * s) / 2 }; apply(); };
    const zoomAt = (f, cx = W() / 2, cy = H() / 2) => { const ns = Math.min(8, Math.max(0.15, st.s * f)); st = { s: ns, x: cx - (cx - st.x) * (ns / st.s), y: cy - (cy - st.y) * (ns / st.s) }; apply(); };
    if (!st) fit(); else apply();
    host._fit = fit; host._zoom = zoomAt; host._state = () => st;
    host.addEventListener('wheel', e => { e.preventDefault(); const r = host.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    const pts = new Map(); let last = null, pinch = null;
    host.addEventListener('pointerdown', e => { if (e.target.closest('button,a,[data-act]')) return; host.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); S.dragging = true; host.classList.add('drag'); last = { x: e.clientX, y: e.clientY }; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } });
    host.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); const r = host.getBoundingClientRect(); if (pinch) zoomAt(d / pinch, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); pinch = d; return; }
      st = { ...st, x: st.x + e.clientX - last.x, y: st.y + e.clientY - last.y }; last = { x: e.clientX, y: e.clientY }; apply(); });
    const up = e => { pts.delete(e.pointerId); pinch = null; if (!pts.size) { S.dragging = false; host.classList.remove('drag'); if (pendingRender) setTimeout(render, 50); } };
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    host.addEventListener('keydown', e => {
      const k = e.key; const step = 60;
      if (host.dataset.nav && st.s <= (S.pz[key + ':fit'] || st.s) + 0.01 && (k === 'ArrowLeft' || k === 'ArrowRight')) return;   // viewer: arrows change item when not zoomed
      if (k === 'ArrowLeft') st.x += step; else if (k === 'ArrowRight') st.x -= step; else if (k === 'ArrowUp') st.y += step; else if (k === 'ArrowDown') st.y -= step;
      else if (k === '+' || k === '=') return zoomAt(1.2); else if (k === '-') return zoomAt(1 / 1.2); else if (k === '0') return fit(); else return;
      e.preventDefault(); apply();
    });
    if (host.dataset.nav) S.pz[key + ':fit'] = S.pz[key + ':fit'] || st.s;
  }
}
const pzTools = key => `<div class="pz-tools"><button data-act="pz" data-k="${key}" data-z="in" title="Mărește (+)" aria-label="Mărește">+</button><button data-act="pz" data-k="${key}" data-z="out" title="Micșorează (-)" aria-label="Micșorează">−</button><button data-act="pz" data-k="${key}" data-z="fit" title="Potrivește (0)" aria-label="Potrivește" style="font-size:12px">⤢</button></div>`;

/* ---------- timeline: series + every volume, stage by stage ---------- */
function timelineHTML(p) {
  const G = groupsOf(p); const idx = p.stageIndex || 0; const BW = 104, BH = 38, GAP = 10, X0 = 124, RH = 66;
  const maxN = Math.max(...G.map(g => g.items.length)); const W = X0 + maxN * (BW + GAP) + 20, H = 30 + G.length * RH;
  const col = st => ({ done: ['var(--k)', 'var(--on-ink)'], running: ['var(--m)', '#fff'], waiting: ['var(--y)', '#15171C'], error: ['var(--err)', '#fff'], skipped: ['var(--sunken)', 'var(--ink-3)'] }[st] || ['var(--surface)', 'var(--ink-2)']);
  const t = ts => ts ? new Date(ts).toLocaleString('ro-RO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="group" aria-label="Cronologia proiectului">`;
  G.forEach((g, gi) => {
    const y = 20 + gi * RH;
    svg += `<text x="12" y="${y + BH / 2 + 5}" font-size="13" font-weight="700" fill="var(--ink)">${esc(g.label)}</text>`;
    svg += `<line x1="${X0 - 6}" y1="${y + BH / 2}" x2="${X0 + g.items.length * (BW + GAP) - GAP}" y2="${y + BH / 2}" stroke="var(--line-2)" stroke-width="2"/>`;
    g.items.forEach((x, j) => {
      const sx = X0 + j * (BW + GAP); const info = p.stages?.[x.s.key] || {}; const [bg, fg] = col(x.st); const cur = x.i === idx && p.status !== 'completed';
      const tip = `${x.s.label}: ${({ done: 'gata', running: 'în lucru', waiting: 'te așteaptă', error: 'eroare', skipped: 'sărit', pending: 'urmează', prefetched: 'pregătit în avans' })[x.st] || x.st}${info.startedAt ? `, început ${t(info.startedAt)}` : ''}${info.finishedAt ? `, terminat ${t(info.finishedAt)}` : ''}`;
      if (x.s.gate) {
        const cx = sx + BW / 2, cy = y + BH / 2, r = 20;
        svg += `<g class="tlb gate" data-act="tl-gate" data-status="${cls(x.st)}" tabindex="0" role="button" aria-label="${esc(tip)}. Deschide aprobarea"><title>${esc(tip)}</title><polygon points="${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}" fill="${x.st === 'pending' ? 'var(--surface)' : bg}" stroke="${cur ? 'var(--m)' : 'var(--line-2)'}" stroke-width="${cur ? 3 : 1.5}"/><text x="${cx}" y="${y + BH + 16}" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--ink-2)">${esc(x.s.label.replace('Aprobarea ', 'Aprobare ').slice(0, 20))}</text></g>`;
      } else {
        const lab = x.s.label.length > 15 ? x.s.label.slice(0, 14) + '…' : x.s.label;
        svg += `<g class="tlb" role="img" aria-label="${esc(tip)}"><title>${esc(tip)}</title><rect x="${sx}" y="${y}" width="${BW}" height="${BH}" rx="8" fill="${bg}" stroke="${cur ? 'var(--m)' : 'var(--line-2)'}" stroke-width="${cur ? 3 : 1}"/><text x="${sx + BW / 2}" y="${y + BH / 2 + 4}" text-anchor="middle" font-size="11" fill="${fg}">${esc(lab)}</text></g>`;
      }
    });
    if (g.vol != null && p.delivered?.[g.vol]) svg += `<text x="${X0 + g.items.length * (BW + GAP) + 4}" y="${y + BH / 2 + 4}" font-size="11" font-weight="700" fill="var(--ok-ink)">livrat</text>`;
  });
  svg += `</svg>`;
  const key = 'tl-' + p.id;
  return `<div class="pz-host tl" data-panzoom="${key}" tabindex="0" aria-label="Cronologie: rotița sau + / - pentru zoom, trage sau săgețile pentru mutare, 0 pentru potrivire"><div class="pz-inner">${svg}</div>${pzTools(key)}<div class="pz-hint">Rotița sau + / − mărește, tragi sau săgețile mută, 0 potrivește. Clic pe un romb deschide aprobarea.</div></div>`;
}

/* ---------- approvals: every document, page text and image has its own decision ---------- */
const AP_ST = { missing: 'lipsește', error: 'verificare nereușită', pending: 'de decis', approved: 'aprobat', approved_note: 'aprobat, nota se aplică', changes: 'de modificat', rejected: 'de refăcut' };
function apItem(it, extra = '') {
  const st = it.state; const img = it.kind === 'image' || it.kind === 'ref';
  const pageText = it.kind === 'text' ? S.art[it.key]?.content?.pages?.[it.p - 1]?.text : '';
  return `<div class="ap-it ${cls(st)}">${img ? `<img src="${fileUrl(it.image)}" alt="${esc(it.label)}" loading="lazy" data-act="view" data-id="${esc(it.id)}" tabindex="0" role="button" aria-label="${esc(it.label)}: deschide imaginea mare">` : ''}
    <div class="row" style="justify-content:space-between;gap:6px">${it.kind === 'text' ? `<span class="lang">${esc(langLabel(it.lang === 'second' ? curProject().input.second_language : curProject().input.language))}</span>` : `<span class="small"><b>${esc(img ? (it.mode === 'line' ? 'De colorat' : it.kind === 'ref' ? it.label : 'Color') : it.label)}</b>${it.kind === 'image' && S.art[it.key]?.content?.engine ? ` <span class="tiny faint">${engineName(S.art[it.key].content.engine)}</span>` : ''}</span>`}<span class="ap-st ${st}">${it.changed ? 'modificat după aprobare' : AP_ST[st]}</span></div>
    ${it.kind === 'collection' ? collectionHTML(it.matrix) : it.kind === 'pageplans' ? pagePlansHTML(it.check) : it.kind === 'story' ? storyHTML(it.story) : it.kind === 'safety' ? safetyHTML(it) : it.kind === 'book' ? bookHTML(it.book) : it.kind === 'atlas' ? atlasHTML(it.atlas) : it.kind === 'layout' ? layoutReviewHTML(it) : it.kind === 'bookcheck' ? '<p class="small">Verifică povestea, vârsta, storytelling-ul vizual, personajele, page turns, lectura cu voce tare, experiența părintelui și interesul copilului. Compară și simplificarea coloratului; notează observațiile pe paginile afectate. Aprobarea ta validează pilotul pentru continuarea seriei; reacțiile publicului se consemnează separat.</p>' : ''}${it.kind === 'text' ? `${it.bookTitle ? `<div class="small"><b>${esc(it.bookTitle)}</b>${it.backBlurb ? `<p>${esc(it.backBlurb)}</p>` : ""}</div>` : ""}<div class="t">${esc(pageText)}</div>` : ''}${it.kind === 'doc' ? `<div class="small muted">${esc(docPreview(it.key))}</div><button class="btn ghost sm" data-act="open-doc" data-key="${esc(it.key)}" style="align-self:flex-start">Citește documentul</button>` : ''}
    ${it.note && st !== 'pending' ? `<div class="ap-note">${it.code ? `<span class="chip" title="${esc(codeLabel(it.code))}">${esc(it.code)}</span> ` : ''}${esc(it.note)}</div>` : ''}${diffHTML(it)}${qaBadge(it)}${extra}${it.key ? `<button class="btn sm ghost" data-act="artifact-history" data-key="${esc(it.key)}">Istoric / Compară versiunile</button>` : ""}${it.kind === "image" ? `<button class="btn sm ghost" data-act="manual-media" data-key="${esc(it.key)}" data-mode="${esc(it.mode)}">Încarcă o corectură</button>` : ""}
    <div class="ap-acts"><button ${it.missing || it.blocked ? 'disabled' : ''} class="btn sm ${st === 'approved' ? 'primary' : ''}" data-act="it" data-id="${esc(it.id)}" data-s="${st === 'approved' ? 'pending' : 'approved'}">${st === 'approved' ? 'Aprobat ✓' : 'Aprobă'}</button>${!["layout","bookcheck"].includes(it.kind) ? `<button class="btn sm" data-act="it-more" data-id="${esc(it.id)}">Modifică…</button>` : ""}</div></div>`;
}
/* v19 (plan 2.11): what changed since the previous round, and why */
function diffHTML(it) {
  const d = it.diff; if (!d || it.state === 'approved') return '';
  const why = d.reason ? `<div class="tiny faint">De ce: ${d.code ? `<span class="chip">${esc(d.code)}</span> ` : ''}${esc(d.reason)}</div>` : '';
  if (d.before != null) return `<div class="ap-diff small" style="margin-top:6px"><div class="tiny faint">Schimbat după runda ${esc(d.round)}. Înainte:</div><div class="diff-old">${esc(d.before)}</div>${why}</div>`;
  if (d.beforeImage) return `<div class="ap-diff small" style="margin-top:6px"><div class="tiny faint">Schimbată după runda ${esc(d.round)}. Înainte:</div><img src="${fileUrl(d.beforeImage)}" alt="Varianta anterioară" loading="lazy" style="max-width:96px;opacity:.75;border-radius:6px">${why}</div>`;
  return '';
}
const engineName = e => (e === 'chatgpt' ? 'ChatGPT' : 'Canva');
const QA_DIM = { anatomy: 'anatomie', action: 'acțiune', story: 'poveste', readability: 'lizibilitate' };
function qaBadge(it) {
  if (it.kind !== 'image' || it.mode === 'line') { const lq = it.mode === 'line' ? S.art[it.key]?.content?.lineQA : null; return lq ? `<div class="tiny ${lq.ok ? 'faint' : ''}" style="${lq.ok ? '' : 'color:var(--err)'}">${lq.ok ? 'Pagina de colorat: curată' + (lq.normalized ? ', alb-negru pur' : '') : 'Pagina de colorat: ' + esc(lq.issues.join(', '))}</div>` : ''; }
  const q = S.art[it.key]?.content?.qa; if (!q) return '';
  return q.ok ? `<div class="tiny" style="color:var(--ok)">${q.source === "human" ? "Verificare declarată de editor" : "Verificare automată"}: anatomie, acțiune, poveste și lizibilitate în regulă${q.redrawn ? ' (redesenată o dată)' : ''}</div>`
    : `<div class="ap-note" style="border-left:3px solid var(--err)"><b>Verificarea automată a găsit:</b> ${esc((q.failed || []).map(k => QA_DIM[k] || k).join(', '))}<br>${esc((q.issues || []).join(' '))}</div>`;
}
function docPreview(k) { const c = S.art[k]?.content || {}; return String(c.logline || c.through_line || (c.characters ? c.characters.map(x => x.name).join(', ') : '') || '').slice(0, 180); }
function approvalHTML(p) {
  const R = S.review; const sum = R.summary; const F = S.apFilter || 'all';
  const keep = it => F === 'all' || (F === 'todo' && ['pending', 'missing', 'error'].includes(it.state)) || (F === 'fix' && ['changes', 'rejected', 'approved_note'].includes(it.state)) || (F === 'ok' && it.state === 'approved');
  const items = R.items.filter(keep);
  const fixN = R.items.filter(i => ['changes', 'rejected', 'approved_note'].includes(i.state)).length;
  const pendN = R.items.filter(i => i.state === 'pending').length;
  const busy = p.status === 'correcting' || p.running;
  const head = `<div class="ap-head"><div class="row" style="justify-content:space-between"><div><b style="font-size:16px">${esc(gateLabel(p))}</b><div class="small muted">${sum.approved} din ${sum.total} aprobate${fixN ? `, ${fixN} cu modificări cerute` : ''}${pendN ? `, ${pendN} de decis` : ''}</div></div>
      <div class="row"><button class="btn sm" data-act="ap-all" ${pendN && !busy ? '' : 'disabled'}>Aprobă tot ce a rămas (${pendN})</button><button class="btn sm" data-act="ap-apply" ${fixN && !busy ? '' : 'disabled'}>Aplică modificările (${fixN})</button><button class="btn sm primary" data-act="ap-done" ${sum.done && !busy ? '' : 'disabled'}>Finalizează aprobarea</button></div></div>
    <div class="ap-bar"><i style="width:${sum.total ? Math.round(sum.approved / sum.total * 100) : 0}%"></i></div>
    <div class="row" style="justify-content:space-between"><div class="seg-ctl">${[['all', 'Toate'], ['todo', `De decis (${pendN})`], ['fix', `Cu modificări (${fixN})`], ['ok', 'Aprobate']].map(([k, l]) => `<button data-act="ap-filter" data-f="${k}" aria-pressed="${F === k}">${l}</button>`).join('')}</div>
    <div class="row"><button class="btn ghost sm" data-act="rev-mode" data-m="docs">Documente și comentarii</button><button class="btn ghost sm" data-act="decide" data-d="approved_with_notes" ${sum.done && !busy ? '' : 'disabled title="Disponibil după ce toate elementele sunt aprobate"'}>Aprobă cu notă generală</button><button class="btn ghost sm danger" data-act="decide" data-d="rejected">Respinge tot</button></div></div>
    ${busy ? `<div class="notice m" style="margin-top:10px">Se aplică modificările; elementele revin aici când sunt gata.</div>` : ''}</div>`;
  let body = '';
  if (p.gate.vol == null) body = `<div class="ap-grid">${items.map(it => `<div class="ap-card">${apItem(it)}</div>`).join('')}</div>`;
  else {
    const pages = [...new Set(items.map(i => i.p).filter(Number.isInteger))].sort((a, b) => a - b);
    body = `<div class="ap-grid">${pages.map(pg => { const its = items.filter(i => i.p === pg); const im = its.filter(i => i.kind === 'image'), tx = its.filter(i => i.kind === 'text');
      return `<div class="ap-card"><h4><span>${pg === 0 ? 'Coperta' : 'Pagina ' + pg}</span></h4>${im.length ? `<div class="ap-imgs">${im.map(i => apItem(i)).join('')}</div>` : ''}${tx.map(i => apItem(i)).join('')}${its.filter(i => !['image','text'].includes(i.kind)).map(i => apItem(i)).join('')}</div>`; }).join('')}${items.filter(i=>!Number.isInteger(i.p)).map(i=>`<div class="ap-card">${apItem(i)}</div>`).join('')}</div>`;
  }
  return head + (items.length ? body : `<div class="empty">Nimic în această listă.</div>`);
}
function itemMore(id) {
  const it = S.review?.items.find(i => i.id === id); if (!it) return;
  openModal(`<h3>${esc(it.label)}</h3><p class="muted small">Scrie exact ce trebuie schimbat, de exemplu: „expresia «micuțul» sună forțat” sau „petele de pe spate lipsesc, corectează”.</p>
    <div class="field" style="margin-top:12px"><textarea class="textarea" id="it-note" aria-label="Nota pentru acest element" placeholder="Ce trebuie schimbat?">${esc(it.note || '')}</textarea></div>
    <div class="stack small muted"><div><b>Aprobă cu notă</b>: o înlocuire exactă se aplică local și păstrează aprobarea; modificările creative revin la revizuire.</div><div><b>Cere modificare</b>: se aplică și revine la tine pentru verificare.</div><div><b>Refă de la zero</b>: se creează din nou, în altă variantă.</div></div>
    ${it.kind === 'text' ? '<div class="field"><label class="lbl" for="it-mode">Intervenție</label><select class="select" id="it-mode"><option value="adjust">Ajustează formularea, păstrează scena</option><option value="rewrite">Rescrie pagina în contextul poveștii</option></select></div><p class="small muted">Corectură locală fără AI: înlocuiește „fragment unic” cu „fragment corect”.</p>' : ''}${reasonSelect(it)}
    ${it.kind === 'image' ? `<div class="field"><span class="lbl">Refă cu</span><select class="select" id="it-engine" style="width:auto"><option value="">același motor (${esc(engineName(S.art[it.key]?.content?.engine || curProject()?.options?.image_engine))})</option><option value="canva">Canva</option>${S.images?.chatgpt?.ready ? '<option value="chatgpt">ChatGPT (GPT Image)</option>' : ''}</select></div>` : ''}
    <div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button><button class="btn danger" data-act="it-set" data-id="${esc(id)}" data-s="rejected">Refă de la zero</button><button class="btn" data-act="it-set" data-id="${esc(id)}" data-s="changes">Cere modificare</button><button class="btn primary" data-act="it-set" data-id="${esc(id)}" data-s="approved_note">Aprobă cu notă</button></div>`);
}
/* v19 (plan 2.2): an optional reason from the rubric, so learning knows which criterion your note is about */
function reasonSelect(it) {
  const all = S.bp?.reason_codes || []; const list = all.filter(r => (it.kind === 'image' || it.kind === 'ref' ? r.code.startsWith('V') : r.code.startsWith('T'))); if (!list.length) return '';
  return `<div class="field"><label class="lbl" for="it-code">Motivul (opțional)</label><select class="select" id="it-code" style="width:auto"><option value="">fără motiv anume</option>${list.map(r => `<option value="${esc(r.code)}" ${it.code === r.code ? 'selected' : ''}>${esc(r.code)} · ${esc(r.label)}</option>`).join('')}</select></div>`;
}
async function setItems(decisions) { const p = curProject(); try { await api('POST', `/projects/${p.id}/items`, { decisions }); await loadProject(); render(); } catch (e) { toast(e.message, 'error'); } }

/* ---------- viewer: large image, zoom/pan, previous/next, decide without leaving ---------- */
function paintViewer() {
  let el = $('#viewer'); if (!el) { el = document.createElement('div'); el.id = 'viewer'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Imagine mare'); document.body.appendChild(el); }
  const V = S.viewer; const list = (S.review?.items || []).filter(i => i.kind === 'image' || i.kind === 'ref');
  const it = V && list.find(i => i.id === V.id);
  if (!it) { el.classList.remove('open'); el.innerHTML = ''; return; }
  const n = list.indexOf(it); const key = 'vw-' + it.id;
  const p = curProject(); const txt = it.kind === 'image' && it.p > 0 ? [S.art[`final_${it.v}`] || S.art[`script_${it.v}`], S.art[`tr_${it.v}`]].filter(Boolean).map(a => a.content.pages?.[it.p - 1]?.text).filter(Boolean) : [];
  if (el.dataset.id !== it.id || !el.classList.contains('open')) {
    el.dataset.id = it.id; el.classList.add('open');
    el.innerHTML = `<div class="pz-host" data-panzoom="${key}" data-nav="1" data-maxfit="4" data-wait="1" tabindex="0" aria-label="Imagine: + / - zoom, săgeți pentru mutare sau pentru imaginea următoare"><div class="pz-inner"><img src="${fileUrl(it.image)}" alt="${esc(it.label)}" style="display:block;max-width:none;width:1100px"></div>${pzTools(key)}</div><div class="vw-side" id="vw-side"></div>`;
    delete S.pz[key]; delete S.pz[key + ':fit'];
    const im = el.querySelector('img'); const go = () => { const h = el.querySelector('[data-panzoom]'); if (!h) return; h.removeAttribute('data-wait'); initPanZooms(); h.focus(); };
    if (im.complete && im.naturalWidth) setTimeout(go, 0); else { im.addEventListener('load', go, { once: true }); im.addEventListener('error', go, { once: true }); }
  }
  $('#vw-side').innerHTML = `<div class="row" style="justify-content:space-between"><b>${esc(it.label)}</b><button class="btn ghost sm" data-act="view-close" aria-label="Închide">Închide</button></div>
    <div class="vw-nav"><button class="btn sm" data-act="view-step" data-d="-1" ${n > 0 ? '' : 'disabled'}>Anterioara</button><span class="small faint" style="align-self:center">${n + 1} din ${list.length}</span><button class="btn sm" data-act="view-step" data-d="1" ${n < list.length - 1 ? '' : 'disabled'}>Următoarea</button></div>
    ${txt.map(t => `<div class="ap-note" style="font:15px/1.45 var(--book)">${esc(t)}</div>`).join('')}
    ${apItem({ ...it, image: null, kind: 'viewer' }).replace(/<img[^>]*>/, '')}
    <p class="tiny faint">Taste: ← → imaginea anterioară/următoare, + − zoom, 0 potrivește, Shift+A aprobă, Esc închide.</p>`;
}
document.addEventListener('keydown', e => {
  if (!S.viewer || isTyping() || $('#modal')) return;
  const list = (S.review?.items || []).filter(i => i.kind === 'image' || i.kind === 'ref'); const n = list.findIndex(i => i.id === S.viewer.id);
  const host = $('#viewer [data-panzoom]'); const zoomed = host && host._state && host._state().s > (S.pz['vw-' + S.viewer.id + ':fit'] || 0) + 0.01;
  if (e.key === 'Escape') { S.viewer = null; paintViewer(); }
  else if (!zoomed && e.key === 'ArrowRight' && n < list.length - 1) { S.viewer = { id: list[n + 1].id }; paintViewer(); }
  else if (!zoomed && e.key === 'ArrowLeft' && n > 0) { S.viewer = { id: list[n - 1].id }; paintViewer(); }
  else if (e.key === 'A' && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && list[n]) { /* audit WCAG 2.1.4: Shift+A, never a single letter */ setItems([{ id: list[n].id, state: 'approved' }]).then(() => { if (n < list.length - 1) { S.viewer = { id: list[n + 1].id }; paintViewer(); } }); }
});

/* ---------- improvement list ---------- */
/* ---------- training packs ---------- */
async function loadTraining() { try { S.training = await api('GET', '/training'); render(); } catch {} }
function trainingHTML() {
  const T = S.training; if (!T) { loadTraining(); return ''; }
  const packs = T.packs || [];
  return `<div class="panel panel-pad" style="margin-top:16px"><div class="row" style="justify-content:space-between"><div><h3 style="font-size:15px">Pachete de antrenament</h3><p class="small muted" style="margin-top:4px">Materiale reale (personaje, o poveste aprobată, imagini bune și greșite, lecții) importate ca date. Echipa învață din ele; nimic nu e fixat în aplicație.</p></div>
    <label class="btn sm" style="cursor:pointer">Importă pachet (.zip)<input type="file" accept=".zip" data-train-import class="visually-hidden"></label></div>
    ${packs.length ? packs.map(pk => `<div class="ap-it" style="margin-top:12px"><div class="row" style="justify-content:space-between;align-items:flex-start"><div style="flex:1 1 300px;min-width:0"><b>${esc(pk.name)}</b><div class="small muted">${esc(pk.description || '')}</div><div class="tiny faint" style="margin-top:4px">${pk.applied?.lessons || 0} reguli, ${pk.applied?.examples || 0} exemple de text aprobat, ${pk.applied?.failures || 0} tipare de greșeli în imagini, ${pk.files} fișiere; importat ${ago(pk.importedAt)}</div></div>
      <div class="row">${pk.project ? `<button class="btn sm primary" data-act="train-start" data-id="${esc(pk.id)}">Pornește un proiect din pachet</button>` : ''}<button class="btn ghost sm danger" data-act="train-del" data-id="${esc(pk.id)}">Șterge</button></div></div>
      ${(pk.image_examples || []).length ? `<div class="row" style="margin-top:10px;align-items:flex-start">${pk.image_examples.map(x => `<figure style="margin:0;width:120px"><img src="/api/training/${esc(pk.id)}/file?path=${encodeURIComponent(x.file)}" alt="" loading="lazy" style="width:120px;height:140px;object-fit:cover;border-radius:6px;border:2px solid ${x.verdict === 'reject' ? 'var(--err)' : 'var(--ok)'}"><figcaption class="tiny" style="margin-top:3px">${x.verdict === 'reject' ? '<b style="color:var(--err)">greșit:</b> ' : '<b style="color:var(--ok)">bun:</b> '}${esc(x.caption || x.issue || '')}</figcaption></figure>`).join('')}</div>` : ''}</div>`).join('')
    : '<p class="small faint" style="margin-top:10px">Niciun pachet încă.</p>'}</div>`;
}
async function startFromPack(id) {
  const pk = (S.training?.packs || []).find(p => p.id === id); if (!pk?.project) return;
  const t = S.types.find(x => x.slug === (pk.project.typeSlug || 'kids-sc')) || S.types[0]; if (!t) return toast('Nu există un tip de produs.');
  initWizard(t.slug); const v = pk.project.values || {};
  for (const f of t.input_schema?.fields || []) if (v[f.key] != null) S.wiz.values[f.key] = f.type === 'languages' ? [...v[f.key]] : v[f.key];
  const file = rel => fetch(`/api/training/${id}/file?path=${encodeURIComponent(rel)}`, { cache: 'no-store' });
  if (pk.project.seed_story) { const txt = await (await file(pk.project.seed_story)).text(); S.wiz.values.seed_story = txt; }
  S.wiz.files = [];
  for (const c of pk.characters || []) { const b = await (await file(c.file)).blob(); const url = await new Promise(res => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.readAsDataURL(b); }); S.wiz.files.push({ name: c.file.split('/').pop(), mime: b.type || 'image/png', url }); }
  S.wiz.source = 'pack'; S.wiz.step = 2; location.hash = '#/new/' + t.slug; toast('Formularul a fost completat din pachet; verifică-l și continuă.');
}
/* only one project works at a time: starting another asks you to pause the current one */
async function startOrSwitch(pid) {
  try { await api('POST', `/projects/${pid}/start`); toast('Proiectul a pornit.'); }
  catch (e) {
    if (e.code !== 'busy') return toast(e.message);
    openModal(`<h3>Lucrează deja alt proiect</h3><p class="muted small">„${esc(e.active?.title || '')}” lucrează acum. Ca să protejăm abonamentele și resursele laptopului, doar un proiect lucrează odată.</p><p class="small" style="margin-top:8px">Pot pune „${esc(e.active?.title || '')}” pe pauză în siguranță (termină pasul în curs și salvează un punct de reluare), apoi pornesc proiectul ales.</p><div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button><button class="btn primary" data-act="do-switch" data-pid="${esc(pid)}">Pune pe pauză și pornește acesta</button></div>`);
  }
}
/* folder browser for the final-files location (laptop only): any disk, including Google Drive for desktop */
async function browseFolder(p) {
  try {
    const d = await api('GET', '/fs/list?path=' + encodeURIComponent(p || ''));
    openModal(`<h3>Alege folderul</h3><p class="small muted" style="word-break:break-all">${d.path ? esc(d.path) : 'Discuri și folderul tău personal'}</p>
      <div class="panel" style="max-height:50vh;overflow:auto;margin-top:8px">${d.parent !== null ? `<button class="btn ghost sm" data-act="fs-go" data-path="${esc(d.parent)}" style="width:100%;justify-content:flex-start">⬆ Înapoi</button>` : ''}${d.dirs.length ? d.dirs.map(x => `<button class="btn ghost sm" data-act="fs-go" data-path="${esc(x.path)}" style="width:100%;justify-content:flex-start">📁 ${esc(x.name)}</button>`).join('') : '<p class="small faint" style="padding:8px">Niciun subfolder.</p>'}</div>
      <div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button>${d.path ? `<button class="btn" data-act="fs-pick" data-path="${esc(d.path + (/[\\/]$/.test(d.path) ? '' : (d.path.includes('\\') ? '\\' : '/')) + 'WonderPages')}">Folder nou „WonderPages” aici</button><button class="btn primary" data-act="fs-pick" data-path="${esc(d.path)}">Alege acest folder</button>` : ''}</div>`);
  } catch (e) { toast(e.message); }
}
function impBusy(e) {
  if (e.code === 'busy' && e.active) openModal(`<h3>Lucrează un proiect</h3><p class="small muted">${esc(e.message)}</p><div class="foot"><button class="btn ghost" data-act="modal-close">Renunță</button><button class="btn primary" data-act="pause" data-pid="${esc(e.active.id)}">Pune „${esc(e.active.title)}” pe pauză</button></div>`);
  else toast(e.message);
}
async function loadImprovements() { try { S.impr = (await api('GET', '/improvements')).items; render(); } catch {} }
const IMP_OPEN = ['nouă', 'în analiză', 'propunere', 'în lucru', 'în revizuire'];
const IMP_BADGE = { 'nouă': ['nouă', ''], 'în analiză': ['în analiză', 'b-m'], 'propunere': ['propunere de rezolvare', 'b-y'], 'în lucru': ['în lucru', 'b-m'], 'în revizuire': ['în revizuire', 'b-y'], 'rezolvată': ['rezolvată', 'b-ok'], 'respinsă': ['respinsă', 'b-err'] };
function impAnalysis(a) {
  if (!a) return '';
  const li = arr => (arr || []).filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('');
  return `<div class="ap-it" style="margin-top:10px"><b>Propunerea inginerului</b>
    <div class="small"><b>Pe scurt:</b> ${esc(a.rezumat || '')}</div>${a.cauza ? `<div class="small"><b>De ce apare:</b> ${esc(a.cauza)}</div>` : ''}
    <div class="small"><b>Cum se rezolvă:</b> ${esc(a.solutie || '')}</div>${(a.pasi || []).length ? `<ol class="small" style="margin:4px 0 0 18px">${li(a.pasi)}</ol>` : ''}
    <div class="tiny faint">Tip: ${a.tip === 'cod' ? 'modificare în aplicație' : a.tip === 'reguli' ? 'reguli noi pentru agenți' : 'nu necesită modificări'}; risc ${esc(a.risc || '?')}; efort ${esc(a.efort || '?')}${(a.fisiere || []).length ? `; fișiere: ${esc(a.fisiere.join(', '))}` : ''}</div>
    ${(a.reguli || []).filter(r => r?.text).length ? `<div class="small"><b>Reguli propuse:</b><ul style="margin:4px 0 0 18px">${a.reguli.filter(r => r?.text).map(r => `<li>${esc(agentName(r.agent))}: ${esc(r.text)}</li>`).join('')}</ul></div>` : ''}
    ${a.cum_testezi ? `<div class="small"><b>Cum verifici după:</b> ${esc(a.cum_testezi)}</div>` : ''}</div>`;
}
function impWork(w) {
  if (!w) return '';
  const checks = (w.checks || []).map(c => `<li><span class="st ${c.ok ? 'pass' : 'fail'}"></span><div><b>${esc(c.name)}</b><div class="tiny faint">${esc(c.detail || '')}</div></div></li>`).join('');
  const files = (w.changes || []).map(c => `<details style="margin-top:6px"><summary class="small" style="cursor:pointer"><b>${esc(c.file)}</b> <span class="tiny faint">${c.type === 'added' ? 'fișier nou' : c.type === 'deleted' ? 'șters' : 'modificat'}</span></summary><pre class="generic" style="max-height:340px;overflow:auto;font-size:12px">${esc(c.diff || '').split('\n').map(l => l.startsWith('+') ? `<span style="color:var(--ok)">${l}</span>` : l.startsWith('-') ? `<span style="color:var(--err)">${l}</span>` : l).join('\n')}</pre></details>`).join('');
  return `<div class="ap-it" style="margin-top:10px"><b>Rezultatul lucrului</b><div class="small">${esc(w.summary || '')}</div>${w.note ? `<div class="tiny faint">${esc(w.note)}</div>` : ''}
    ${(w.rules || []).filter(r => r?.text).length ? `<div class="small"><b>Reguli care se adaugă:</b><ul style="margin:4px 0 0 18px">${w.rules.filter(r => r?.text).map(r => `<li>${esc(agentName(r.agent))}: ${esc(r.text)}</li>`).join('')}</ul></div>` : ''}
    ${checks ? `<div class="small" style="margin-top:6px"><b>Verificări automate</b></div><ul class="checks" style="margin:4px 0 0">${checks}</ul>` : ''}
    ${files ? `<div class="small" style="margin-top:6px"><b>Ce se schimbă</b> (${w.changes.length} fișiere; aplicația reală rămâne neatinsă până apeși „Rezolvat”)</div>${files}` : ''}</div>`;
}
function viewImprovements() {
  const L = S.impr; if (!L) return `<div class="boot">Se încarcă…</div>`; const F = S.impF || 'deschise';
  const list = L.filter(i => F === 'toate' || (F === 'deschise' ? IMP_OPEN.includes(i.status) : F === 'rezolvate' ? i.status === 'rezolvată' : i.status === 'respinsă'));
  const busy = S.improve; const remote = S.lan?.remote;
  const card = i => {
    const [bl, bc] = IMP_BADGE[i.status] || [i.status, '']; const working = ['în analiză', 'în lucru'].includes(i.status);
    const acts = {
      'nouă': `<button class="btn sm primary" data-act="imp-start" data-id="${esc(i.id)}" ${busy ? 'disabled' : ''}>Pornește rezolvarea</button><button class="btn sm" data-act="imp-edit" data-id="${esc(i.id)}">Editează</button><button class="btn ghost sm danger" data-act="imp-del" data-id="${esc(i.id)}">Șterge</button>`,
      'în analiză': `<span class="small"><span class="dot" style="background:var(--m)"></span> Inginerul analizează aplicația și pregătește propunerea…</span><button class="btn ghost sm" data-act="imp-stop" data-id="${esc(i.id)}">Oprește</button>`,
      'propunere': `<button class="btn sm primary" data-act="imp-approve" data-id="${esc(i.id)}" ${busy ? 'disabled' : ''}>Aprobă</button><button class="btn sm" data-act="imp-retry" data-id="${esc(i.id)}" ${busy ? 'disabled' : ''}>Mai încearcă…</button><button class="btn ghost sm" data-act="imp-cancel" data-id="${esc(i.id)}">Anulează</button>`,
      'în lucru': `<span class="small"><span class="dot" style="background:var(--m)"></span> Inginerul lucrează într-o copie separată a aplicației…</span><button class="btn ghost sm" data-act="imp-stop" data-id="${esc(i.id)}">Oprește</button>`,
      'în revizuire': `${remote ? '<span class="small faint">„Rezolvat” se apasă de pe laptop (aplicația repornește).</span>' : `<button class="btn sm primary" data-act="imp-resolve" data-id="${esc(i.id)}" ${(i.work?.checks || []).some(c => !c.ok) ? 'disabled title="Verificările automate nu trec"' : ''}>Rezolvat</button>`}<button class="btn sm danger" data-act="imp-reject" data-id="${esc(i.id)}">Respins</button>`,
      'rezolvată': i.backup && !remote ? `<button class="btn ghost sm" data-act="imp-rollback" data-id="${esc(i.id)}">Revino la versiunea de dinainte</button>` : '',
      'respinsă': `<button class="btn sm" data-act="imp-start" data-id="${esc(i.id)}" ${busy ? 'disabled' : ''}>Pornește din nou</button><button class="btn ghost sm danger" data-act="imp-del" data-id="${esc(i.id)}">Șterge</button>`
    }[i.status] || '';
    return `<div class="panel panel-pad"><div class="row" style="justify-content:space-between;align-items:flex-start"><div style="min-width:0;flex:1 1 300px"><div class="row" style="gap:8px"><h3 style="font-size:16px">${esc(i.title)}</h3><span class="badge ${bc}">${esc(bl)}</span></div>
      <div class="small faint" style="margin-top:2px">${esc(i.category)}, prioritate ${esc(i.priority)}, ${clock(i.createdAt)}${i.source === 'asistent' ? ', notată de Dali' : ''}</div></div></div>
      <div class="small" style="margin-top:10px;white-space:pre-wrap">${esc(i.description)}</div>
      ${i.error ? `<div class="notice err" style="margin-top:10px">${esc(i.error)}</div>` : ''}
      ${['propunere', 'în lucru', 'în revizuire'].includes(i.status) || (i.status === 'rezolvată' && i.analysis) ? impAnalysis(i.analysis) : ''}
      ${['în revizuire', 'rezolvată'].includes(i.status) ? impWork(i.work) : ''}
      ${(i.attempts || []).length ? `<div class="tiny faint" style="margin-top:8px">Comentariile tale: ${i.attempts.map(a => '„' + esc(a.comment) + '”').join('; ')}</div>` : ''}
      <div class="row" style="margin-top:12px">${acts}</div>
      ${(i.history || []).length > 1 ? `<details style="margin-top:8px"><summary class="tiny faint" style="cursor:pointer">Istoric</summary><ul class="tiny faint" style="margin:4px 0 0 16px">${i.history.slice().reverse().map(h => `<li>${clock(h.at)}: ${esc(h.to)}${h.note ? ', ' + esc(h.note) : ''}</li>`).join('')}</ul></details>` : ''}</div>`;
  };
  return `<div class="page-head"><div><h1>Îmbunătățiri</h1><p>Notează ce vrei îmbunătățit (sau spune-i lui Dali). Pentru fiecare: <b>Pornește rezolvarea</b> → inginerul propune soluția → <b>Aprobă</b> → lucrează într-o copie separată → tu dai <b>Rezolvat</b> sau <b>Respins</b>.</p></div><div class="row"><a class="btn" href="/api/improvements.md">Descarcă lista (.md)</a><button class="btn primary" data-act="imp-new">Adaugă</button></div></div>
    ${busy ? `<div class="notice m" style="margin-bottom:12px">Inginerul lucrează acum la „${esc(busy.title)}” (${esc(busy.step)}). Proiectele nu pornesc cât timp lucrează.</div>` : ''}
    <div class="filters" style="margin-bottom:14px">${[['deschise', 'Deschise'], ['toate', 'Toate'], ['rezolvate', 'Rezolvate'], ['respinse', 'Respinse']].map(([k, l]) => `<button data-act="imp-f" data-f="${k}" aria-pressed="${F === k}">${l}</button>`).join('')}</div>
    ${list.length ? `<div class="plist">${list.map(card).join('')}</div>` : `<div class="empty">Nimic aici. Spune-i lui Dali „trece asta în lista de îmbunătățiri”.</div>`}`;
}
function impModal(i = {}) {
  openModal(`<h3>${i.id ? 'Editează' : 'Adaugă'} o îmbunătățire</h3>
    <div class="field" style="margin-top:12px"><span class="lbl">Titlu</span><input class="input" id="imp-t" aria-label="Titlul îmbunătățirii" value="${esc(i.title || '')}"></div>
    <div class="row"><label class="small">Categorie <select class="select" id="imp-c" style="width:auto">${['text', 'imagini', 'aprobare', 'livrare', 'interfață', 'performanță', 'altele'].map(x => `<option ${x === i.category ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label class="small">Prioritate <select class="select" id="imp-p" style="width:auto">${['mică', 'medie', 'mare'].map(x => `<option ${x === (i.priority || 'medie') ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>
    <div class="field" style="margin-top:12px"><span class="lbl">Descriere</span><textarea class="textarea" id="imp-d" aria-label="Descrierea îmbunătățirii" style="min-height:140px">${esc(i.description || '')}</textarea></div>
    <div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button><button class="btn primary" data-act="imp-save" data-id="${esc(i.id || '')}">Salvează</button></div>`);
}

/* ---------- Dali: the assistant, always available bottom-right ---------- */
const DALI_SVG = (sz = 34) => `<svg width="${sz}" height="${sz}" viewBox="0 0 64 64" aria-hidden="true"><line x1="32" y1="8" x2="32" y2="14" stroke="#0B3B39" stroke-width="3" stroke-linecap="round"/><path d="M32 1.5l1.9 3.9 4.3.6-3.1 3 .7 4.2-3.8-2-3.8 2 .7-4.2-3.1-3 4.3-.6z" fill="#FFD166" stroke="#0B3B39" stroke-width="1.5" stroke-linejoin="round"/><rect x="12" y="14" width="40" height="32" rx="13" fill="#fff" stroke="#0B3B39" stroke-width="3"/><circle cx="24" cy="29" r="4.5" fill="#0B3B39"/><circle cx="40" cy="29" r="4.5" fill="#0B3B39"/><circle cx="25.5" cy="27.5" r="1.4" fill="#fff"/><circle cx="41.5" cy="27.5" r="1.4" fill="#fff"/><path d="M19 24l-2-2.5M21.5 23l-1-3M45 24l2-2.5M42.5 23l1-3" stroke="#0B3B39" stroke-width="1.8" stroke-linecap="round"/><circle cx="18.5" cy="36" r="2.6" fill="#8ED8D3"/><circle cx="45.5" cy="36" r="2.6" fill="#8ED8D3"/><path d="M26 38c3.5 2.6 8.5 2.6 12 0" fill="none" stroke="#0B3B39" stroke-width="3" stroke-linecap="round"/><rect x="6" y="24" width="6" height="12" rx="3" fill="#0B3B39"/><rect x="52" y="24" width="6" height="12" rx="3" fill="#0B3B39"/><rect x="20" y="48" width="24" height="10" rx="5" fill="#fff" stroke="#0B3B39" stroke-width="3"/></svg>`;
const RB = { idleClose: 15 * 60e3, forget: 2 * 3600e3 };
S.dali = { open: sessionStorage.getItem('dali-open') === '1', sid: sessionStorage.getItem('dali-sid') || null, msgs: [], busy: false, last: Number(sessionStorage.getItem('dali-last') || Date.now()) };
function daliSave() { sessionStorage.setItem('dali-open', S.dali.open ? '1' : '0'); if (S.dali.sid) sessionStorage.setItem('dali-sid', S.dali.sid); else sessionStorage.removeItem('dali-sid'); sessionStorage.setItem('dali-last', String(S.dali.last)); }
async function daliInit() {
  const b = document.createElement('button'); b.id = 'dali-btn'; b.setAttribute('aria-label', 'Dali, asistenta ta'); b.title = 'Dali, asistenta ta'; b.dataset.act = 'dali-toggle'; b.innerHTML = DALI_SVG(50) + '<span class="dot"></span>'; document.body.appendChild(b);
  const p = document.createElement('section'); p.id = 'dali'; p.setAttribute('aria-label', 'Conversația cu Dali'); document.body.appendChild(p);
  if (S.dali.sid) { try { const h = await api('GET', '/assistant/' + S.dali.sid); S.dali.msgs = h.msgs || []; if (!h.sid) { S.dali.sid = null; daliSave(); } } catch {} }
  paintDali();
  setInterval(() => { const idle = Date.now() - S.dali.last;               // closes after 15 idle minutes, forgets after 2 hours
    if (S.dali.sid && idle > RB.forget) daliEnd(false); else if (S.dali.open && idle > RB.idleClose) { S.dali.open = false; daliSave(); paintDali(); } }, 30e3);
}
function daliEnd(ask = true) { const sid = S.dali.sid; if (sid) api('DELETE', '/assistant/' + sid).catch(() => {}); S.dali = { ...S.dali, open: false, sid: null, msgs: [], busy: false, last: Date.now() }; daliSave(); paintDali(); }
function paintDali() {
  const p = $('#dali'); const b = $('#dali-btn'); if (!p) return;
  p.classList.toggle('open', S.dali.open); b.classList.toggle('has', !S.dali.open && S.dali.msgs.length > 0); b.setAttribute('aria-expanded', String(!!S.dali.open)); b.setAttribute('aria-controls', 'dali');
  if (!S.dali.open) return;
  const keep = $('#rb-in')?.value || '';
  const sug = [['dali-tour', 'Prezintă-mi aplicația'], ['dali-improve', 'Notează o îmbunătățire']];
  p.innerHTML = `<div class="rb-head">${DALI_SVG(30)}<div><b>Dali</b><small>asistenta ta în WonderPages</small></div><button data-act="dali-min" title="Minimizează" aria-label="Minimizează">–</button><button data-act="dali-end" title="Închide și șterge conversația" aria-label="Închide conversația">×</button></div>
    <div class="rb-body" id="rb-body">${S.dali.msgs.length ? '' : `<div class="rb-msg dali">Bună, sunt Dali! Cu ce te pot ajuta? Spune-mi ce vrei să faci și te îndrum pas cu pas.</div><div class="rb-sug">${sug.map(([a, l]) => `<button data-act="${a}">${esc(l)}</button>`).join('')}</div>`}
      ${S.dali.msgs.map(m => `<div class="rb-msg ${m.role === 'user' ? 'me' : 'dali'}">${esc(m.text)}${(m.actions || []).length ? `<div class="rb-acts">${m.actions.map((a, i) => a.type === 'fill_project' ? `<button class="btn sm primary" data-act="dali-fill" data-m="${S.dali.msgs.indexOf(m)}" data-i="${i}">Completează formularul</button>` : a.type === 'navigate' ? `<a class="btn sm" href="${/^#\/[\w\-/]*$/.test(a.to || '') ? esc(a.to) : '#/'}">${esc(a.label)}</a>` : a.type === 'improvement_added' ? `<a class="btn sm ghost" href="#/improvements">Notat: ${esc(a.title)}</a>` : a.type === 'tour' ? `<button class="btn sm" data-act="dali-tour-pick" data-k="${esc(a.k)}">${esc(a.label)}</button>` : '').join('')}</div>` : ''}</div>`).join('')}
      ${S.dali.busy ? '<div class="rb-msg dali rb-typing"></div>' : ''}</div>
    <div class="rb-foot"><textarea id="rb-in" rows="1" placeholder="Scrie-i lui Dali…" aria-label="Mesaj pentru Dali">${esc(keep)}</textarea><button class="btn primary" data-act="dali-send" ${S.dali.busy ? 'disabled' : ''} aria-label="Trimite">Trimite</button></div>`;
  const body = $('#rb-body'); body.scrollTop = body.scrollHeight;
}
async function daliSend(text) {
  text = String(text || '').trim(); if (!text || S.dali.busy) return;
  S.dali.msgs.push({ role: 'user', text }); S.dali.busy = true; S.dali.last = Date.now(); daliSave(); $('#rb-in') && ($('#rb-in').value = ''); paintDali();
  try {
    const toList = S.dali.improve; S.dali.improve = false;
    const r = await api('POST', '/assistant', { sid: S.dali.sid, message: toList ? 'Trece în lista de îmbunătățiri, formulat profesionist: ' + text : text, context: { route: location.hash, projectId: S.cur } });
    S.dali.sid = r.sid; S.dali.msgs.push({ role: 'dali', text: r.reply, actions: r.actions || [] });
  } catch (e) { S.dali.msgs.push({ role: 'dali', text: e.message || 'Nu am reușit să răspund acum.' }); }
  S.dali.busy = false; S.dali.last = Date.now(); daliSave(); paintDali(); setTimeout(() => $('#rb-in')?.focus(), 30);
}
function daliFill(values) {
  const t = S.types.find(x => x.status !== 'draft'); if (!t) return toast('Nu există un tip de produs publicat.');
  initWizard(t.slug); const fields = t.input_schema?.fields || [];
  for (const f of fields) if (values[f.key] != null) { const v = values[f.key]; if (f.type === 'languages') S.wiz.values[f.key] = (Array.isArray(v) ? v : [v]).filter(x => (f.options || []).some(o => o.value === x)); else if (f.options && !(f.options || []).some(o => o.value === v)) continue; else S.wiz.values[f.key] = String(v); }
  S.wiz.step = 2; location.hash = '#/new/' + t.slug; toast('Am completat formularul; verifică-l și continuă.');
}
/* „Prezintă-mi aplicația”: you choose the section, Dali explains it (local text, instant, no Claude usage) */
const DALI_TOUR = [
  ['panou', 'Panou', '#/', 'Pagina de start. Vezi ce te așteaptă (revizuiri de făcut), ce lucrează acum și ce e gata de livrat. Numărul galben din meniu îți arată câte revizuiri te așteaptă.'],
  ['proiecte', 'Proiecte', '#/projects', 'Toate proiectele, cu căutare și filtre. Direct de pe card le pornești, le pui pe pauză sau le continui. Tot aici imporți separat un proiect (.zip). O instalare nouă pornește fără proiecte. Doar un proiect lucrează odată.'],
  ['nou', 'Proiect nou', '#/new', 'Creezi o colecție în trei pași: alegi tipul de produs, completezi tema, vârsta, limbile, stilul și formatul (poți încărca personajele tale și povestea volumului 1), apoi confirmi. Proiectul intră „Pregătit” și îl pornești când vrei. Poți porni și dintr-un pachet de antrenament.'],
  ['proiect', 'Pagina unui proiect', null, 'Are cinci tab-uri: Progres (cronologia interactivă a seriei și a volumelor), Revizuire (aprobi fiecare text și fiecare imagine: Aprobă, Aprobă cu notă, Cere modificare, Refă), Carte (vezi cărțile pe pagini), Livrare (Livrează volumul N) și Activitate (puncte de salvare, export, istoric).'],
  ['tipuri', 'Tipuri de produs', '#/studio', 'Regulile unui produs (de exemplu KIDs S&C): vârste, etape, aprobări, formate. Sunt pentru utilizare avansată; de obicei nu trebuie schimbate.'],
  ['agenti', 'Agenți', '#/agents', 'Echipa AI: scriitor, editor critic, traducător, director artistic, inginer și ceilalți. Pentru fiecare vezi ce lucrează, alegi modelul (Sonnet scrie mai bine, Haiku consumă mai puțin) și vezi sau adaugi reguli.'],
  ['invatare', 'Învățare', '#/learning', 'Cum învață aplicația din deciziile tale: reguli pe proiect, pe vârstă sau pentru toate proiectele (doar tu le extinzi), calibrarea pe vârste și pachetele de antrenament.'],
  ['imbunatatiri', 'Îmbunătățiri', '#/improvements', 'Lista cu ce vrei îmbunătățit. Pe fiecare apeși „Pornește rezolvarea”: inginerul propune soluția, tu aprobi, el lucrează într-o copie separată, iar la final tu decizi Rezolvat sau Respins (cu revenire posibilă).'],
  ['setari', 'Setări', '#/settings', 'Conectezi Claude, Canva și ChatGPT, vezi consumul (bugetul Claude pe 5 ore, alocarea Canva), alegi unde ajung fișierele finale (pe laptop și o copie, de exemplu în Google Drive), pornești accesul de pe telefon și rulezi diagnosticul.']
];
function daliTourMenu(intro) { S.dali.msgs.push({ role: 'dali', text: intro || 'Cu plăcere! Alege ce vrei să-ți prezint:', actions: DALI_TOUR.map(([k, l]) => ({ type: 'tour', k, label: l })) }); S.dali.last = Date.now(); daliSave(); paintDali(); }
function daliTourPick(k) {
  const t = DALI_TOUR.find(x => x[0] === k); if (!t) return;
  const to = t[2] || (S.cur ? `#/p/${S.cur}/progress` : S.projects[0] ? `#/p/${S.projects[0].id}/progress` : '#/projects');
  S.dali.msgs.push({ role: 'user', text: t[1] });
  S.dali.msgs.push({ role: 'dali', text: `${t[1]}: ${t[3]}`, actions: [{ type: 'navigate', to, label: 'Deschide pagina' }, { type: 'tour', k: '_menu', label: 'Altă secțiune' }] });
  S.dali.last = Date.now(); daliSave(); paintDali();
}
document.addEventListener('keydown', e => { if (e.target.id === 'rb-in' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); daliSend(e.target.value); } });


function layoutReviewHTML(it) { const pg=S.art[it.key]?.content?.pages?.[it.p-1], lp=it.plan; return '<div class="small">Familie: '+esc(lp?.family||pg?.layout?.family||'standard')+' · Zonă text: '+esc(lp?.zone||pg?.layout?.text_zone||pg?.text_zone||'bottom')+(lp?' · '+esc(lp.sizePt)+' pt':'')+'</div>'+(lp?'<p class="tiny faint">'+esc(lp.reason||'')+'</p>':'')+((lp?.findings||[]).length?'<ul class="small">'+lp.findings.map(f=>'<li><b>'+esc(f.severity==='high'?'Blocant':f.severity==='medium'?'De verificat':'Notă')+':</b> '+esc(f.message)+'</li>').join('')+'</ul>':'')+'<p class="small">'+esc(pg?.text||'')+'</p><a class="btn sm ghost" href="#/p/'+esc(S.cur)+'/book/'+(Number(it.v)+1)+'/'+Number(it.p)+'">Deschide pagina '+Number(it.p)+' în atelier</a><button class="btn sm" data-act="layout-edit" data-key="'+esc(it.key)+'" data-p="'+it.p+'">Ajustează macheta</button>'; }

/* P4-T02: the collection plan — one row per volume bible, the cast timeline and the explained findings */
const COLL_PRES = { introduced: ['nou', 'apare prima dată'], appears: ['●', 'apare'], returns: ['revine', 'revine (amintit, nu cunoscut din nou)'], mentioned: ['menț.', 'menționat'] };
const COLL_SEV = { blocker: ['blochează', 'var(--err)'], major: ['important', 'var(--warn)'], minor: ['mic', 'var(--ink-3)'] };
function collectionHTML(m) {
  if (!m) return '';
  const V = m.volumes || [];
  const rows = V.map(v => `<tr><td><b>${esc(v.n)}</b></td><td>${esc(v.title)}</td><td>${esc(v.goal) || '<span class="err-text">lipsă</span>'}</td><td>${esc(v.obstacle) || '<span class="err-text">lipsă</span>'}</td><td>${esc(v.choice) || '<span class="err-text">lipsă</span>'}</td><td>${esc(v.consequence) || '<span class="err-text">lipsă</span>'}</td><td>${esc(v.ending_type)}</td></tr>`).join('');
  const cast = Object.entries(m.timeline?.characters || {}).map(([id, t]) => `<tr><td><b>${esc(t.name)}</b>${t.role === 'main' ? ' <span class="chip">protagonist</span>' : ''}${t.speciesCertainty === 'indeterminate_stylized' ? ' <span class="chip" title="Specia nu se afirmă în text">specie nedeterminată</span>' : ''}</td>${V.map(v => { const p = t.per?.[v.n]?.presence; const x = COLL_PRES[p]; return `<td title="${esc(x ? x[1] + (t.per[v.n].purpose ? ': ' + t.per[v.n].purpose : '') : 'absent')}">${x ? esc(x[0]) : '<span class="faint">—</span>'}</td>`; }).join('')}</tr>`).join('');
  const f = (m.findings || []).map(x => `<li><span class="chip" style="color:${COLL_SEV[x.severity]?.[1] || 'inherit'}">${esc(COLL_SEV[x.severity]?.[0] || x.severity)}</span> ${esc(x.message)}${x.fix ? `<div class="small muted">${esc(x.fix)}</div>` : ''}</li>`).join('');
  return `<div class="small" id="collection-matrix" data-ready="${m.ready}" data-blockers="${esc(m.summary?.blockers)}"><p>${esc(m.summary?.volumes)} din ${esc(m.summary?.expected)} biblii de volum · lumea: ${m.policy?.world === 'natural' ? 'fără magie (efecte naturale)' : 'cu fantezie declarată'} · ${m.ready ? 'planul poate fi aprobat' : '<b>planul are blocaje: cere corecturi la arc/biblie/distribuție</b>'}</p>
    <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Vol.</th><th>Titlu</th><th>Scop</th><th>Obstacol</th><th>Alegerea protagonistului</th><th>Consecința</th><th>Final</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div style="overflow-x:auto;margin-top:8px"><table class="tbl"><thead><tr><th>Personaj</th>${V.map(v => `<th>V${esc(v.n)}</th>`).join('')}</tr></thead><tbody>${cast}</tbody></table></div>
    ${f ? `<h4 style="margin-top:8px">Constatări</h4><ul class="log">${f}</ul>` : '<p class="small muted">Nicio constatare: întoarcerile, primele apariții, finalurile și regulile lumii sunt coerente.</p>'}
    ${(m.downstream || []).length ? `<p class="small muted" style="margin-top:6px">${esc(m.downstream.length)} diferențe între scenariile scrise ulterior și premisele aprobate (se rezolvă la revizuirea volumului, nu redeschid planul).</p>` : ''}</div>`;
}

/* P4-T03: the 72 PageBlueprints check and the visual canon (atlas): what is original, approved, proposed or without rights */
function pagePlansHTML(r) {
  if (!r) return '';
  const f = (r.findings || []).slice(0, 40).map(x => `<li><span class="chip" style="color:${COLL_SEV[x.severity]?.[1] || 'inherit'}">${esc(COLL_SEV[x.severity]?.[0] || x.severity)}</span> ${esc(x.message)}${x.fix ? `<div class="small muted">${esc(x.fix)}</div>` : ''}</li>`).join('');
  return `<div class="small" id="pageplans-check" data-count="${esc(r.count)}" data-ready="${r.ready}"><p><b>${esc(r.count)}</b> din ${esc(r.expected)} PageBlueprints (funcție, moment, emoție, schimbare de stare, valoarea imaginii, întoarceri, cine ține ce). Deschiderile se verifică pe interiorul care începe pe pagina din dreapta.</p>${f ? `<ul class="log">${f}</ul>` : '<p class="muted">Nicio constatare.</p>'}<p class="muted">Planul fiecărui volum se citește în documentele „Volumul N: planul paginilor”.</p></div>`;
}
const ATLAS_ST = { covered_original: ['original', 'var(--ok, inherit)'], covered_approved: ['aprobat', 'var(--ok, inherit)'], proposed: ['propus (neaprobat)', 'var(--warn)'], missing: ['lipsă: propunere de job', 'var(--warn)'], inactive_rights: ['fără drepturi: inactiv', 'var(--err)'] };
function atlasHTML(a) {
  if (!a) return '';
  const rows = a.requirements.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.view)}</td><td style="color:${ATLAS_ST[r.status]?.[1] || 'inherit'}">${esc(ATLAS_ST[r.status]?.[0] || r.status)}</td></tr>`).join('');
  const inactive = a.entries.filter(e => e.status === 'inactive_rights').map(e => `<li>${esc(e.id)}: ${esc(e.reason || '')}</li>`).join('');
  return `<div class="small" id="atlas-check" data-covered="${esc(a.summary.covered)}" data-proposed="${esc(a.summary.proposed)}"><p>${esc(a.summary.covered)} din ${esc(a.summary.requirements)} vederi necesare sunt acoperite de referințe originale sau aprobate. Vederile lipsă rămân propuneri; nimic nu devine aprobat fără decizia ta, iar o referință fără drepturi nu se folosește.</p><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Personaj</th><th>Vedere</th><th>Stare</th></tr></thead><tbody>${rows}</tbody></table></div>${inactive ? `<p class="err-text">Referințe inactive:</p><ul>${inactive}</ul>` : ''}</div>`;
}

/* P4-T04: the story contract of a volume — the causal chain with page quotes, real complexity, voice, facts, native edition */
const LINK_LABEL = { goal: 'Scopul', choice: 'Alegerea protagonistului', consequence: 'Consecința' };
function storyHTML(r) {
  if (!r) return '<p class="small muted">Volumul nu are încă manuscris.</p>';
  const links = Object.entries(r.causality?.links || {}).map(([k, l]) => `<li><b>${esc(LINK_LABEL[k] || k)}</b>: pagina ${esc(l.page)} — „${esc(String(l.quote || '').slice(0, 140))}”${l.exact ? '' : ' <span class="faint">(dedus; verifică)</span>'}</li>`).join('');
  const f = (r.findings || []).slice(0, 30).map(x => `<li><span class="chip" style="color:${COLL_SEV[x.severity]?.[1] || 'inherit'}">${esc(COLL_SEV[x.severity]?.[0] || x.severity)}</span> ${esc(x.message)}</li>`).join('');
  const m = r.metrics || {};
  return `<div class="small" id="story-check" data-ready="${r.ready}" data-mode="${esc(r.causality?.mode)}"><p>Lanțul cauzal (${r.causality?.mode === 'declared' ? 'declarat de autor, cu citate exacte' : 'dedus din pagini'}):</p><ul>${links}</ul>
    <p class="muted">Vârsta ${esc(r.band)}: ${esc(m.totalWords)} cuvinte, în medie ${esc(m.avgSentence)} cuvinte pe propoziție${(m.wordless || []).length ? `, pagini fără text intenționat: ${esc(m.wordless.join(', '))}` : ''}. Bugetele sunt orientative; macheta reală decide și nimic nu se taie automat. Lumea: ${r.world === 'natural' ? 'fără magie' : 'fantastică declarată'}.</p>
    ${f ? `<ul class="log">${f}</ul>` : '<p class="muted">Nicio constatare.</p>'}</div>`;
}

/* P5-T01: child safety — blockers and evidence first, never a score; an adult review may clear REVIEW/UNKNOWN, not BLOCK */
const SAFE_ST = { BLOCK: ['BLOCHEAZĂ', 'var(--err)'], REVIEW: ['DE VERIFICAT', 'var(--warn)'], UNKNOWN: ['NECUNOSCUT', 'var(--warn)'], PASS: ['PASS', 'inherit'] };
function safetyHTML(it) {
  const s = it.safety; if (!s) return '';
  const rows = s.subjects.map(x => `<li><span class="chip" style="color:${SAFE_ST[x.verdict]?.[1]}">${esc(SAFE_ST[x.verdict]?.[0] || x.verdict)}</span> ${esc(x.artifact || x.kind)}${x.page != null ? ' · pagina ' + esc(x.page) : ''}${x.findings?.[0] ? ` — „${esc(x.findings[0].quote)}” <div class="small muted">${esc(x.findings[0].fix || '')}</div>` : x.note ? ` — ${esc(x.note)}` : ''}${x.review ? `<div class="small muted">verificat de un adult: ${esc(x.review.reason)}</div>` : ''}${['REVIEW', 'UNKNOWN'].includes(x.verdict) && !S.lan?.remote ? `<div class="row" style="margin-top:4px"><button class="btn sm ghost" data-act="safety-review" data-v="${esc((it.v ?? 0) + 1)}" data-subject="${esc(x.id)}">Am verificat (adult)</button></div>` : ''}</li>`).join('');
  return `<div class="small" id="safety-check" data-verdict="${esc(s.verdict)}"><p>Siguranța se evaluează separat de scor: un BLOCK nu poate fi compensat de note mari și nu se aprobă; se corectează conținutul.</p>${rows ? `<ul class="log">${rows}</ul>` : '<p class="muted">Toate elementele sunt PASS.</p>'}</div>`;
}

/* P5-T02: book assessment — blockers and evidence before the score; the policy and the evaluating model are shown */
function bookHTML(b) {
  if (!b) return '';
  const t = b.checks?.text;
  return `<div class="small" id="book-check" data-pass="${b.pass}"><p>${b.pass ? 'Cartea trece evaluarea: secvență completă, lanț cauzal până la final, text evaluat pe versiunea curentă.' : '<b>Cartea nu trece încă:</b>'}</p>${(b.reasons || []).length ? `<ul class="log">${b.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
    <p class="muted">${t ? `Text: scor ${esc(t.score)} (politica ${esc(t.policy?.version)}${t.policy?.status === 'proposed' ? ', propusă' : ''})` : 'Text neevaluat'} · finalul: ${b.checks?.ending ? 'dovedit' : 'nedovedit'}. Siguranța se evaluează separat și nu intră în scor.</p>${(b.reasons || []).some(r => /învechit|Lipsește evaluarea/.test(r)) && !S.lan?.remote ? `<button class="btn sm" data-act="reassess" data-v="${esc(b.volume)}">Reevaluează textul curent (fără rescriere)</button>` : ''}</div>`;
}
