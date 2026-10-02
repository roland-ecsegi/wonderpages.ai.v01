/* WonderPages.AI — Paginile interfeței (panou, proiecte, proiect nou, proiect, revizuire, carte, setări, agenți, învățare).
   Scripturi clasice încărcate în ordine (core, views, ui, actions, pdf); împart același spațiu global. */
/* ============================================================
   RENDER
   ============================================================ */
let pendingRender = false;
function isTyping() {
  if (S.dragging) return true;
  const ae = document.activeElement; const main = $('#main');
  return !!(ae && main && main.contains(ae) && (ae.matches('textarea, select, input[type="text"], input[type="search"], input:not([type])') || ae.isContentEditable));
}
function render() {
  if (isTyping()) { pendingRender = true; return; }
  pendingRender = false; doRender();
}
document.addEventListener('focusout', () => setTimeout(() => { if (pendingRender && !isTyping()) render(); }, 30));

function doRender() {
  const app = $('#app');
  if (!app.firstChild) app.innerHTML = shellHTML();
  paintNav();
  const main = $('#main');
  const keep = {}; $$('[data-keep]', main).forEach(el => { keep[el.dataset.keep] = el.scrollTop; });
  main.innerHTML = viewHTML();
  $$('[data-keep]', main).forEach(el => { if (keep[el.dataset.keep] != null) el.scrollTop = keep[el.dataset.keep]; });
  paintLive();
  if (S.exporting) paintExport();
  initPanZooms(); paintViewer();
}
function regMark(size = 30) {
  return `<svg class="reg" viewBox="0 0 30 30" width="${size}" height="${size}" aria-hidden="true"><circle cx="15" cy="15" r="9.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="15" cy="15" r="4" fill="var(--m)"/><path d="M15 1v28M1 15h28" stroke="currentColor" stroke-width="1.6"/><rect x="21" y="2" width="3.5" height="3.5" fill="var(--c)"/><rect x="25" y="2" width="3.5" height="3.5" fill="var(--y)"/></svg>`;
}
function shellHTML() {
  return `<a class="skip" href="#/" data-act="skip">Sari la conținut</a><div class="shell"><aside class="side">
    <a class="brand" href="#/">${regMark()}<div><b>WonderPages.AI</b><small>studio de produse digitale</small></div></a>
    <nav class="nav" id="nav" aria-label="Navigare principală"></nav>
    <a class="btn primary btn-new" href="#/new">Proiect nou</a>
    <div class="side-foot" id="who"></div>
  </aside><main class="main" id="main" tabindex="-1"></main><nav class="mnav" id="mnav" aria-label="Navigare"></nav></div>`;
}
function paintNav() {
  const r = S.route.name; const attn = S.projects.filter(p => p.status === 'awaiting_review').length;
  $('#nav').innerHTML = [
    ['#/', 'Panou', r === 'dashboard', attn],
    ['#/projects', 'Proiecte', r === 'projects' || r === 'project', 0],
    ['#/studio', 'Tipuri de produs', r === 'studio', 0],
    ['#/agents', 'Agenți', r === 'agents', (S.live || []).length],
    ['#/learning', 'Învățare', r === 'learning', 0],
    ['#/improvements', 'Îmbunătățiri', r === 'improvements', 0],
    ['#/settings', 'Setări', r === 'settings', 0]
  ].map(([h, l, on, n]) => `<a href="${h}" ${on ? 'aria-current="page"' : ''}>${l}${n ? `<span class="count" title="Așteaptă review">${n}</span>` : ''}</a>`).join('');
  const I = { home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>', list: '<path d="M5 6h14M5 12h14M5 18h14"/>', agents: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.7-3.3 2.9-5 5.5-5s4.8 1.7 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.3c2.4-.4 4.3 1.1 5 4.7"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>' };
  const ic = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;
  $('#mnav').innerHTML = `<a href="#/" ${r === 'dashboard' ? 'aria-current="page"' : ''}>${ic('home')}Panou${attn ? `<span class="count">${attn}</span>` : ''}</a><a href="#/projects" ${r === 'projects' || r === 'project' ? 'aria-current="page"' : ''}>${ic('list')}Proiecte</a><a class="new" href="#/new" ${r === 'new' ? 'aria-current="page"' : ''}><span class="plus"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>Nou</a><a href="#/agents" ${r === 'agents' ? 'aria-current="page"' : ''}>${ic('agents')}Agenți</a><a href="#/settings" ${['settings', 'learning', 'studio', 'improvements'].includes(r) ? 'aria-current="page"' : ''}>${ic('gear')}Mai mult</a>`;
  const sv = S.services || {};
  const dot = ok => `<span class="dot" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${ok ? 'var(--ok)' : 'var(--err)'};margin-right:6px" aria-hidden="true"></span><span class="sr-only">${ok ? 'conectat: ' : 'neconectat: '}</span>`;   // audit WCAG 1.4.1: the state is also in words
  $('#who').innerHTML = S.offline ? `<a class="who small" href="#/settings" style="color:var(--err);text-decoration:none">Serverul local nu răspunde</a>`
    : `${S.active ? `<div class="panel" style="padding:10px;margin-bottom:10px"><div class="tiny faint">Lucrează acum</div><a href="#/p/${esc(S.active.id)}/progress" style="font-weight:700;font-size:13px;display:block;margin:2px 0 6px">${esc(S.active.title)}</a><button class="btn sm" data-act="pause" data-pid="${esc(S.active.id)}" style="width:100%">Pune pe pauză</button></div>` : ''}<a class="who small" href="#/settings" style="text-decoration:none;line-height:1.7"><div>${dot(sv.claude?.configured)}Claude</div><div>${dot(sv.canva?.connected)}Canva</div>${S.images?.chatgpt?.installed ? `<div>${dot(S.images.chatgpt.ready)}ChatGPT imagini</div>` : ''}<div class="faint tiny">${esc(sv.storage?.label || '')}</div></a>`;
}
function viewHTML() {
  if (!S.booted) return `<div class="boot">Pregătesc atelierul…</div>`;
  if (S.offline && !S.services) return `<div class="empty" style="max-width:560px;margin:10vh auto">Serverul local nu răspunde. Pornește-l cu <code>npm start</code> în folderul aplicației, apoi reîncarcă pagina.</div>`;
  switch (S.route.name) {
    case 'projects': return viewProjects();
    case 'new': return viewNew();
    case 'project': return viewProject();
    case 'studio': return viewStudio();
    case 'settings': return viewSettings();
    case 'agents': return viewAgents();
    case 'improvements': return viewImprovements();
    case 'render': return `<div class="boot">Livrare în curs pe laptop…</div>`;
    case 'learning': return viewLearning();
    default: return viewDashboard();
  }
}

/* ---------- shared bits ---------- */
const STATUS = {
  queued: ['Pregătit', ''], ready: ['Pregătit', ''], running: ['Lucrează', 'b-m'], paused: ['Pe pauză', ''], failed: ['Eroare', 'b-err'],
  awaiting_review: ['Așteaptă revizuirea', 'b-y'], waiting_limit: ['Pauză: limita Pro', 'b-y'], correcting: ['Aplică modificări', 'b-m'], completed: ['Finalizat', 'b-ok'], archived: ['Arhivat', '']
};
const badge = st => { const [l, c] = STATUS[st] || [st, '']; return `<span class="badge ${c}">${esc(l)}</span>`; };
/* collection + one group per volume (volumes are delivered one by one) */
function groupsOf(p) {
  const plan = p.stagePlan || []; const idx = p.stageIndex || 0; const G = [];
  plan.forEach((s, i) => { const key = s.vol == null ? 'c' : 'v' + s.vol; let g = G.find(x => x.key === key); if (!g) G.push(g = { key, vol: s.vol, label: s.vol == null ? 'Colecție' : `Volumul ${s.vol + 1}`, items: [] }); g.items.push({ s, i, st: p.stages?.[s.key]?.status || (i < idx ? 'done' : 'pending') }); });
  G.forEach(g => { const st = g.items.map(x => x.st); g.status = st.includes('error') ? 'error' : st.includes('waiting') ? 'waiting' : st.includes('running') ? 'running' : st.every(x => x === 'done' || x === 'skipped') ? 'done' : st.some(x => x === 'done') ? 'running' : 'pending'; g.current = g.items.some(x => x.i === idx) || (idx >= plan.length && g === G[G.length - 1]); });
  return G;
}
function colorbar(p, big = false) {
  const plan = p.stagePlan || []; const idx = p.stageIndex || 0;
  if (p.volumeFlow) return `<div class="cbar ${big ? 'big' : ''}" role="img" aria-label="Progres pe volume">${groupsOf(p).map(g => `<div class="seg s-${cls(g.status === 'waiting' ? 'running' : g.status)}${g.status === 'waiting' ? ' s-wait' : ''}" title="${esc(g.label)}"></div>`).join('')}</div>`;
  return `<div class="cbar ${big ? 'big' : ''}" role="img" aria-label="Progres: etapa ${Math.min(idx + 1, plan.length)} din ${plan.length}">` + plan.map((s, i) => {
    let st = p.stages?.[s.key]?.status || (i < idx ? 'done' : 'pending');
    return `<div class="seg ${s.gate ? 'gate' : ''} s-${cls(st)}" title="${esc(s.label)}"></div>`;
  }).join('') + `</div>`;
}
const gateLabel = p => `${S.bp?.gates?.[p.gate?.key]?.label || 'Revizuire'}${p.gate?.vol != null ? `, volumul ${p.gate.vol + 1}` : ''}`;
function pcard(p) {
  const attn = p.status === 'awaiting_review';
  const cur = (p.stagePlan || []).find(s => s.key === p.currentStage);
  const href = `#/p/${esc(p.id)}/${attn ? 'review' : 'progress'}`;   /* audit: a card link that contains buttons is invalid HTML; the title is the link and covers the card */
  return `<div class="pcard ${attn ? 'attn' : ''}">
    <div class="icon" aria-hidden="true">${esc(p.typeIcon || '📦')}</div>
    <div style="min-width:0"><h2 class="pc-title"><a class="pc-link" href="${href}">${esc(p.title || 'Proiect fără titlu')}</a></h2>
      <div class="meta">${esc(p.typeName || '')}, ${esc(p.variantLabel || '')}${cur && !['completed', 'archived'].includes(p.status) ? `, ${esc(cur.label)}` : ''}, ${ago(p.updatedAt)}</div>
      ${colorbar(p)}</div>
    <div class="row" style="justify-content:flex-end">${badge(p.status)}${attn ? '<span class="btn sm primary">Deschide revizuirea</span>' : ''}${['ready', 'queued', 'paused'].includes(p.status) && !p.running ? `<button class="btn sm ${['ready', 'queued'].includes(p.status) ? 'primary' : ''}" data-act="run" data-pid="${esc(p.id)}">${['ready', 'queued'].includes(p.status) ? 'Pornește' : 'Continuă'}</button>` : ''}${p.running && !p.pausing ? `<button class="btn sm" data-act="pause" data-pid="${esc(p.id)}">Pauză</button>` : ''}</div></div>`;
}

/* ---------- dashboard ---------- */
function viewDashboard() {
  const ps = S.projects.filter(p => p.status !== 'archived');
  const attn = ps.filter(p => p.status === 'awaiting_review');
  const prepared = ps.filter(p => p.status === 'ready');
  const work = ps.filter(p => ['running', 'queued', 'paused', 'failed', 'correcting', 'waiting_limit'].includes(p.status));
  const done = ps.filter(p => p.status === 'completed').slice(0, 5);
  const first = '';
  let body = '';
  if (!S.projLoaded) body = `<div class="faint">Se încarcă proiectele…</div>`;
  else if (!ps.length) body = `<div class="empty"><p><b>Niciun proiect încă.</b></p><p class="small" style="margin-top:4px">Alege un tip de produs, descrie tema, iar AI-ul lucrează până la prima revizuire.</p><a class="btn primary" href="#/new">Începe un proiect</a></div>`;
  else {
    if(prepared.length)body+=`<section class="section"><h2>Pregătite pentru pornire <span class="faint">${prepared.length}</span></h2><div class="plist">${prepared.map(pcard).join('')}</div></section>`;
    if (attn.length) body += `<section class="section" style="margin-top:0"><h2>Așteaptă decizia ta <span class="faint">${attn.length}</span></h2><div class="plist">${attn.map(pcard).join('')}</div></section>`;
    body += `<section class="section"><h2>În lucru <span class="faint">${work.length}</span></h2>${work.length ? `<div class="plist">${work.map(pcard).join('')}</div>` : `<div class="empty small">Nimic nu rulează acum.</div>`}</section>`;
    if (done.length) body += `<section class="section"><h2>Finalizate recent</h2><div class="plist">${done.map(pcard).join('')}</div></section>`;
  }
  return `${setupNotice()}<div class="page-head"><div><h1>Atelier</h1><p>${attn.length ? `${attn.length === 1 ? 'Un proiect așteaptă' : attn.length + ' proiecte așteaptă'} revizuirea ta.` : 'Totul e la zi.'}</p></div><a class="btn primary" href="#/new">Proiect nou</a></div>${body}`;
}

/* ---------- projects list ---------- */
function viewProjects() {
  const F = { all: ['Toate', () => true], attn: ['Așteaptă revizuirea', p => p.status === 'awaiting_review'], work: ['În lucru', p => ['running', 'queued', 'ready', 'paused', 'failed', 'correcting', 'waiting_limit'].includes(p.status)], done: ['Finalizate', p => p.status === 'completed'], arch: ['Arhivate', p => p.status === 'archived'] };
  const q = S.q.trim().toLowerCase();
  const list = S.projects.filter(F[S.filter][1]).filter(p => S.filter === 'arch' || p.status !== 'archived').filter(p => !q || (p.title || '').toLowerCase().includes(q) || (p.input?.short_description || '').toLowerCase().includes(q));
  return `<div class="page-head"><div><h1>Proiecte</h1><p>${S.projects.length} în total${S.active ? `; lucrează acum „${esc(S.active.title)}”` : ''}. Un singur proiect lucrează odată.</p></div><div class="row"><button class="btn" data-act="import-project">Importă proiect (.zip)</button><a class="btn primary" href="#/new">Proiect nou</a></div></div>
  <div class="row" style="margin-bottom:16px;justify-content:space-between"><div class="filters">${Object.entries(F).map(([k, [l]]) => `<button data-act="filter" data-f="${k}" aria-pressed="${S.filter === k}">${l}</button>`).join('')}</div>
  <input class="search" type="search" placeholder="Caută după titlu sau temă" value="${esc(S.q)}" data-bind="q" aria-label="Caută proiecte"></div>
  ${list.length ? `<div class="plist">${list.map(pcard).join('')}</div>` : `<div class="empty">Niciun proiect în această listă.</div>`}`;
}

/* ---------- new project wizard (form generated from the blueprint) ---------- */
function initWizard(slug) {
  const t = typeBySlug(slug);
  const values = {};
  (t?.input_schema?.fields || []).forEach(f => { values[f.key] = Array.isArray(f.default) ? [...f.default] : f.default ?? ''; });
  S.wiz = { slug, values, step: 2, errors: {}, options: { images: imagesOk(), image_engine: S.images?.engine || 'canva' }, files: [] };
}
function viewNew() {
  const r = S.route;
  const steps = ['Tip de produs', 'Detalii proiect', 'Confirmare'];
  const on = !r.slug ? 0 : S.wiz.step === 3 ? 2 : 1;
  const head = `<div class="page-head"><div><h1>Proiect nou</h1><p>Configurezi o singură dată. Apoi AI-ul lucrează singur până la prima revizuire.</p></div></div>
    <ol class="steps">${steps.map((s, i) => `<li class="${i === on ? 'on' : i < on ? 'done' : ''}">${i + 1}. ${s}</li>`).join('')}</ol>`;
  if (!r.slug) {
    const types = S.types.filter(t => t.status !== 'draft');
    const packs = (S.training?.packs || []).filter(p => p.project); if (!S.training) loadTraining();
    const packHTML = packs.length ? `<h3 style="font-size:15px;margin:22px 0 10px">Sau pornește dintr-un pachet de antrenament</h3><div class="types">${packs.map(pk => `<button class="type-card" data-act="train-start" data-id="${esc(pk.id)}"><div class="ico" aria-hidden="true">🎓</div><h3>${esc(pk.name)}</h3><p>${esc(pk.description || '')}</p><div class="faint">tema, personajele și povestea volumului 1 vin din pachet</div></button>`).join('')}</div>` : '';
    return `<div class="wiz">${head}${!S.typesLoaded ? '<div class="faint">Se încarcă…</div>' : types.length ? `<div class="types">${types.map(t => `<button class="type-card" data-act="pick-type" data-slug="${esc(t.slug)}"><div class="ico" aria-hidden="true">${esc(t.icon || '📦')}</div><h3>${esc(t.full_name || t.name)}</h3><p>${esc(t.description || '')}</p><div class="faint">Versiunea ${esc(t.version)}</div></button>`).join('')}</div>${packHTML}` : `<div class="empty">Niciun tip de produs publicat. Adaugă unul din <a href="#/studio">Tipuri de produs</a>.</div>`}</div>`;
  }
  const t = typeBySlug(r.slug);
  if (!t) return `<div class="wiz">${head}<div class="faint">Se încarcă tipul de produs…</div></div>`;
  if (S.wiz.step === 3) return `<div class="wiz">${head}${wizSummary(t)}</div>`;
  const all = t.input_schema?.fields || [];
  const req = all.filter(f => f.required).map(f => fieldHTML(f, S.wiz.values[f.key], S.wiz.errors[f.key])).join('');
  const optF = all.filter(f => !f.required), optOpen = optF.some(f => { const v = S.wiz.values[f.key]; return (Array.isArray(v) ? v.length : String(v ?? '').trim() && v !== f.default) || S.wiz.errors[f.key]; }) || (S.wiz.files || []).length;
  const fields = `${req}<details class="more" ${optOpen ? 'open' : ''}><summary>Mai multe opțiuni: titlu, observații, personajele tale, manuscrisul tău</summary>${optF.map(f => fieldHTML(f, S.wiz.values[f.key], S.wiz.errors[f.key])).join('')}</details>`;
  return `<div class="wiz">${head}${intakeHTML()}<div class="panel panel-pad"><div class="row" style="margin-bottom:18px"><span style="font-size:22px" aria-hidden="true">${esc(t.icon || '')}</span><div><b>${esc(t.full_name || t.name)}</b><div class="faint small">${esc(t.description || '')}</div></div></div>${fields}</div>
    <div class="wiz-foot"><a class="btn ghost" href="#/new">Alege alt tip</a><button class="btn primary" data-act="wiz-next">Continuă</button></div></div>`;
}
/* P4-T01: short intake — a local proposal (no AI, nothing created) that you confirm into the form or cancel */
function intakeHTML() {
  const I = S.wiz.intake || {};
  const prop = I.result ? `<div class="notice" id="intake-proposal" style="margin-top:10px"><b>Propunere (${I.result.kind === 'manuscript' ? 'manuscris' : 'idee'})</b><dl class="small" style="margin:6px 0">${Object.entries(I.result.values).map(([k, v]) => `<dt>${esc(fieldLabel(k))}</dt><dd>${esc(Array.isArray(v) ? v.join(', ') : String(v).slice(0, 160))}${String(v).length > 160 ? '…' : ''} <span class="faint">(${esc(I.result.sources[k])})</span></dd>`).join('')}</dl>${I.result.warnings.map(w => `<div class="small" style="color:var(--warn)">${esc(w.message)}</div>`).join('')}${I.result.missing.length ? `<div class="small muted">De ales în formular: ${I.result.missing.map(m => esc(m.label)).join(', ')}</div>` : ''}<div class="row" style="margin-top:8px"><button class="btn sm primary" data-act="intake-apply">Aplică în formular</button><button class="btn sm ghost" data-act="intake-cancel">Renunță</button></div></div>` : '';
  return `<div class="panel panel-pad" style="margin-bottom:12px"><label class="field" for="intake-text" style="margin:0"><span class="lbl">Pe scurt: ideea ta sau manuscrisul tău <span class="opt">(opțional)</span></span><textarea id="intake-text" class="textarea" placeholder="Ex.: o serie pentru 3-4 ani despre un pui de dinozaur curios, în română și engleză, acuarelă">${esc(I.text || '')}</textarea></label><div class="row" style="margin-top:8px"><button class="btn sm" data-act="intake-infer">Propune completarea formularului</button><span class="small muted">Nimic nu pornește și nimic nu se creează fără confirmarea ta.</span></div>${I.error ? `<div class="err-text">${esc(I.error)}</div>` : ''}${prop}</div>`;
}
const fieldLabel = k => (typeBySlug(S.wiz.slug)?.input_schema?.fields || []).find(f => f.key === k)?.label || k;
function fieldHTML(f, val, err) {
  if (f.show_if_languages && (S.wiz.values.languages || []).length < f.show_if_languages) return '';
  const key = String(f.key || '').replace(/[^A-Za-z0-9_-]/g, ''); const id = 'f-' + key;   // audit C2: the id is a safe token
  const lbl = `<span class="lbl" id="${id}-lbl">${esc(f.label)}${f.required ? '' : ' <span class="opt">(opțional)</span>'}</span>`;
  let ctl = '';
  if (f.type === 'textarea') ctl = `<textarea id="${id}" class="textarea" data-field="${esc(f.key)}" placeholder="${esc(f.placeholder || '')}" ${f.accept_file ? 'style="min-height:160px"' : ''}>${esc(val)}</textarea>${f.accept_file ? `<div class="row" style="margin-top:6px"><span class="small muted">sau încarcă un fișier:</span><input type="file" accept="${esc(f.accept_file)}" data-textfile="${esc(f.key)}"></div>` : ''}`;
  else if (f.type === 'select') ctl = `<select id="${id}" class="select" data-field="${esc(f.key)}">${(f.options || []).map(o => `<option value="${esc(o.value)}" ${o.value === val ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
  else if (f.type === 'languages') {
    const sel = Array.isArray(val) ? val : [];
    ctl = `<div class="choices" role="group" aria-labelledby="${id}-lbl">${(f.options || []).map(o => `<label class="choice"><input type="checkbox" data-langs="${esc(f.key)}" value="${esc(o.value)}" ${sel.includes(o.value) ? 'checked' : ''}><b>${esc(o.label)}</b></label>`).join('')}</div><div class="help">${sel.length === 2 ? 'Fiecare volum: o carte de colorat și două cărți de povești (una în fiecare limbă).' : sel.length === 1 ? 'Fiecare volum: o carte de colorat și o carte de povești.' : 'Alege cel puțin o limbă.'}</div>`;
  }
  else if (f.type === 'images') {
    const files = S.wiz.files || [];
    ctl = `<input id="${id}" type="file" accept="image/png,image/jpeg,image/webp" multiple data-files="${esc(f.key)}" data-max="${num(f.max, 6)}" class="input">
      ${files.length ? `<div class="row" style="margin-top:10px">${files.map((x, i) => `<figure style="margin:0;text-align:center"><img src="${x.url}" alt="${esc(x.name)}" style="width:92px;height:92px;object-fit:cover;border-radius:8px;border:1px solid var(--line)"><figcaption class="tiny faint" style="max-width:92px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.name)}</figcaption><button class="btn ghost sm" data-act="rm-file" data-i="${i}">Scoate</button></figure>`).join('')}</div>` : ''}`;
  }
  else if (f.type === 'choice') ctl = `<div class="choices" role="radiogroup" aria-labelledby="${id}-lbl">${(f.options || []).map(o => `<label class="choice"><input type="radio" name="${id}" value="${esc(o.value)}" data-field="${esc(f.key)}" ${o.value === val ? 'checked' : ''}><b>${esc(o.label)}</b>${o.hint ? `<span>${esc(o.hint)}</span>` : ''}</label>`).join('')}</div>`;
  else ctl = `<input id="${id}" class="input" type="text" data-field="${esc(f.key)}" value="${esc(val)}" placeholder="${esc(f.placeholder || '')}">`;
  const tag = f.type === 'choice' ? 'div' : 'label';
  return `<${tag} class="field" ${tag === 'label' ? `for="${id}"` : ''}>${lbl}${ctl}${f.help ? `<div class="help">${esc(f.help)}</div>` : ''}${err ? `<div class="err-text">${esc(err)}</div>` : ''}</${tag}>`;
}
function estimate(bp, opts) {
  let calls = 0, images = 0; const V = bp.structure.volumes, P = bp.structure.pages;
  const mult = st => (st.per_volume ? V : 1);
  const cnt = st => st.per_volume ? 1 : st.estimate_count ? Number(getPath(bp, st.estimate_count)) || 1 : 1;
  const on = st => !st.optional_flag || opts[st.optional_flag] !== false;
  for (const st of bp.stages || []) {
    if (st.when && st.when.includes('second_language') && (opts.languagesCount || 2) < 2) continue;
    if (st.handler === 'llm_json') calls += (st.for_each ? cnt(st) : 1) * mult(st);
    else if (st.handler === 'critique_revise') calls += cnt(st) * ((st.max_rounds || 1) > 1 ? 2.5 : 2) * mult(st);
    else if (st.handler === 'continuity_check') calls += 1.3 * mult(st);
    else if (st.handler === 'apply_notes') calls += 0.3 * mult(st);
    else if (st.handler === 'visual_qa' && opts.visual_qa !== false && opts.images !== false) calls += Math.ceil((P + 1) / (st.batch || 6)) * mult(st);
    else if (st.handler === 'canva_images' && on(st)) {
      const n = st.pages === 'all' ? P + 1 : st.pages === 'demo' ? (st.demo_pages || []).length : (st.pages || []).length;
      const lines = st.defer_lineart ? 0 : st.lineart_pages ? st.lineart_pages.length : (st.lineart_template ? n : 0);
      images += (n + lines) * mult(st) * (st.pages === 'all' ? 1.1 : 1);                // ~10% redraws after the automatic check
    }
    else if (st.handler === 'canva_lines' && opts.images !== false) images += (P + 1) * mult(st);
    else if (st.handler === 'image_prompts' && on(st)) images += (st.items || []).filter(i => i.generate).length * 3;
  }
  calls = Math.round(calls); images = Math.round(images);
  const sec = calls * (bp.estimate?.seconds_per_call || 35) / 2 + images * (bp.estimate?.seconds_per_image || 45);
  return { calls, images, perVolume: Math.round(images / V), minutes: Math.max(3, Math.round(sec / 60)) };
}
function wizSummary(t) {
  const v = S.wiz.values;
  const rows = (t.input_schema?.fields || []).map(f => {
    if (f.show_if_languages && (v.languages || []).length < f.show_if_languages) return '';
    if (f.type === 'languages') return `<dt>${esc(f.label)}</dt><dd>${(v[f.key] || []).map(x => esc((f.options || []).find(o => o.value === x)?.label || x)).join(' și ')}</dd>`;
    if (f.type === 'images') return `<dt>${esc(f.label)}</dt><dd>${(S.wiz.files || []).length ? `<div class="row">${S.wiz.files.map(x => `<img src="${x.url}" alt="${esc(x.name)}" style="width:56px;height:56px;object-fit:cover;border-radius:6px">`).join('')}</div>` : '<span class="faint">niciuna</span>'}</dd>`;
    let val = v[f.key];
    const o = (f.options || []).find(o => o.value === val); if (o) val = o.label;
    return `<dt>${esc(f.label)}</dt><dd>${val ? esc(val) : '<span class="faint">necompletat</span>'}</dd>`;
  }).join('');
  const hasFlag = (t.stages || []).some(s => s.optional_flag === 'images');
  const est = estimate(t, { ...S.wiz.options, languagesCount: (S.wiz.values.languages || []).length || 1 });
  const gates = (t.stages || []).filter(s => s.handler === 'review_gate').length;
  const P = S.wiz.preview;
  const contractCard = !P ? `<div class="panel panel-pad faint">Se verifică contractul…</div>` : `<div class="panel panel-pad" id="contract-preview" data-valid="${P.valid}" style="margin-bottom:12px"><h3 style="font-size:16px;margin-bottom:10px">Ce se va produce</h3>
    <dl><dt>Tema</dt><dd>${esc(P.theme || '—')}</dd><dt>Vârsta</dt><dd>${esc(P.age?.label || '—')}</dd><dt>Limbi</dt><dd>${P.languages.map(l => `${esc(l.label)} <span class="faint">(${esc(l.role)})</span>`).join(', ') || '—'}</dd><dt>Stil</dt><dd>${esc(P.style?.label || '—')}</dd><dt>Format</dt><dd>${esc(P.format?.label || '—')}</dd><dt>Sursa</dt><dd>${esc(P.source.label)}${P.source.manuscriptChars ? ` <span class="faint">(${esc(P.source.manuscriptChars)} caractere)</span>` : ''}</dd><dt>Structura</dt><dd>${P.structure ? `${esc(P.structure.volumes)} volume × ${esc(P.structure.pagesPerBook)} pagini${P.structure.books ? `, ${esc(P.structure.books)} cărți (${esc(P.structure.story)} de povești, ${esc(P.structure.coloring)} de colorat)` : ''}` : '—'}</dd></dl>
    ${P.errors.map(e => `<div class="err-text">${esc(e.message)}</div>`).join('')}</div>`;
  return `${contractCard}<div class="panel panel-pad summary"><h3 style="font-size:16px;margin-bottom:14px">${esc(t.full_name || t.name)}, versiunea ${esc(t.version)}</h3><dl>${rows}</dl></div>
    ${hasFlag ? `<div class="panel panel-pad" style="margin-top:12px"><label class="check"><input type="checkbox" data-opt="images" ${S.wiz.options.images !== false ? 'checked' : ''}><span><b>Generează ilustrațiile</b><br><span class="small muted">Motorul de imagini ales desenează fișele de personaj, apoi fiecare pagină color folosindu-le ca referință, apoi pagina de colorat pornind chiar de la imaginea color. Debifat, primești textul complet și prompturile, iar imaginile le poți genera ulterior, pagină cu pagină.</span></span></label>${S.wiz.options.images !== false && ((S.wiz.options.image_engine || S.images?.engine) === 'chatgpt' ? !S.images?.chatgpt?.ready : !canvaOk()) ? `<div class="notice warn" style="margin-top:10px">Motorul de imagini ales nu este conectat. <a href="#/settings">Conectează-l în Setări</a> înainte de etapa de imagini.</div>` : ''}
      <div class="field" style="margin-top:12px"><span class="lbl">Motor de imagini pentru acest proiect</span><div class="choices">${[['canva', 'Canva', 'din abonamentul Canva Pro'], ['chatgpt', 'ChatGPT (GPT Image)', 'din abonamentul ChatGPT, prin Codex']].map(([v, l, h]) => `<label class="choice"><input type="radio" name="img-engine" data-opt-engine="${v}" ${(S.wiz.options.image_engine || S.images?.engine || 'canva') === v ? 'checked' : ''} ${v === 'chatgpt' && !S.images?.chatgpt?.ready ? 'disabled' : ''}><b>${l}</b><span>${h}${v === 'chatgpt' && !S.images?.chatgpt?.ready ? ' (neconectat)' : ''}</span></label>`).join('')}</div></div>
      <label class="check" style="margin-top:12px"><input type="checkbox" data-opt="visual_qa" ${S.wiz.options.visual_qa !== false ? 'checked' : ''}><span><b>Verificare vizuală a personajelor</b><br><span class="small muted">Directorul artistic compară fiecare pagină cu fișele personajelor și redesenează automat ce nu seamănă. Cere în plus aproximativ 20 de apeluri Claude.</span></span></label></div>` : ''}
    <div class="panel panel-pad" style="margin-top:12px"><div class="estimate"><div><b>≈ ${est.calls}</b><span>apeluri Claude</span></div>${est.images ? `<div><b>≈ ${est.images}</b><span>imagini Canva (≈ ${est.perVolume} pe volum)</span></div>` : ''}<div><b>≈ ${est.minutes} min</b><span>timp total de generare</span></div><div><b>${gates}</b><span>opriri pentru revizuire</span></div></div>
    ${est.images && S.canva ? `<p class="small" style="margin-top:12px">Canva: soldul real este necunoscut. Estimarea bugetului local: ${S.canva.estimatedRemaining} utilizări rămase (se reînnoiește ${new Date(S.canva.resetsAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })}). ${S.canva.budgetReached ? 'Buget local atins: generarea se oprește. Verifică limita inclusă în cont.' : ''}</p>` : ''}
    ${S.usage ? `<p class="small" style="margin-top:12px">Claude în ultimele 7 zile: <b>${S.usage.text7d}</b> apeluri${S.usage.budget7d ? ` din bugetul săptămânal de ${S.usage.budget7d}. ${S.usage.text7d + est.calls <= S.usage.budget7d ? 'Colecția încape în săptămâna aceasta.' : `Colecția nu încape toată în săptămâna aceasta: se oprește în siguranță la buget și continuă singură când se eliberează (${Math.max(0, S.usage.budget7d - S.usage.text7d)} apeluri rămase acum).`}` : '. Dacă atingi limita săptămânală a planului Pro, proiectul intră pe pauză și se reia singur; nu se cumpără nimic în plus.'} Pe 5 ore, colecția se întinde pe aproximativ ${Math.max(1, Math.ceil(est.calls / (S.usage.budget5h || 90)))} ferestre.</p>` : ''}
    <p class="small muted" style="margin-top:12px">Generarea rulează pe serverul local: poți închide fereastra, lucrul continuă cât timp serverul e pornit. Textul folosește ${S.services?.claude?.provider === 'claude-code' ? 'abonamentul tău Claude, prin Claude Code' : 'cheia ta Claude API'}; imaginile folosesc contul tău Canva, cu limitele planului tău.</p></div>
    ${claudeOk() ? '' : `<div class="notice err" style="margin-top:12px">Claude nu este configurat. Vezi <a href="#/settings">Setări</a>.</div>`}
    <div class="wiz-foot"><button class="btn ghost" data-act="wiz-back">Înapoi la detalii</button><button class="btn primary" data-act="start" ${claudeOk() && P?.valid ? '' : 'disabled'}>Creează proiectul</button></div>`;
}

/* ---------- project view ---------- */
function projectTabs(p) {
  const T = Object.entries(PROJECT_TABS);   // P4-T01: one registry for tabs and aliases
  return `<nav class="tabs" aria-label="Secțiuni proiect">${T.map(([k, l]) => `<a href="#/p/${esc(p.id)}/${k}" ${S.route.tab === k ? 'aria-current="page"' : ''}>${l}${k === 'review' && p.status === 'awaiting_review' ? '<span class="pip" aria-label="așteaptă"></span>' : ''}</a>`).join('')}</nav>`;
}
function viewProject() {
  const p = curProject();
  if (!p) return S.projLoaded ? `<div class="empty">Proiectul nu există sau nu ai acces la el. <a href="#/projects">Toate proiectele</a></div>` : `<div class="boot">Se încarcă proiectul…</div>`;
  const local = !!p.running;
  const canRun = claudeOk() && !local && ['queued', 'ready', 'paused', 'failed', 'running', 'waiting_limit'].includes(p.status);
  const actions = local
    ? (p.pausing ? `<span class="badge">se pune pe pauză…</span>` : `<button class="btn" data-act="pause" data-pid="${esc(p.id)}"><span class="dot" style="background:var(--m)"></span>Pune pe pauză</button><button class="btn ghost sm danger" data-act="stop-now" data-pid="${esc(p.id)}" title="Oprește imediat; pasul în curs se reface la continuare">Oprește imediat</button>`)
    : p.status === 'waiting_limit' ? `<button class="btn" data-act="pause" data-pid="${esc(p.id)}">Pune pe pauză</button>`
    : canRun ? `<button class="btn primary" data-act="run" data-pid="${esc(p.id)}">${['queued', 'ready'].includes(p.status) ? 'Pornește lucrul' : 'Continuă'}</button>` : '';
  let banner = '';
  const lastCp = (p.checkpoints || []).slice(-1)[0];
  if (local) banner = p.pausing ? `<div class="banner"><span>Se termină pasul în curs și se salvează, apoi proiectul intră pe pauză. Nimic nu se pierde.</span></div>` : `<div class="banner m"><span>Proiectul lucrează pe laptop. Poți închide fereastra; fiecare pas se salvează imediat.</span></div>`;
  else if (['queued', 'ready'].includes(p.status)) banner = `<div class="banner"><span><b>Proiect pregătit.</b> ${S.active && S.active.id !== p.id ? `Acum lucrează „${esc(S.active.title)}”; doar un proiect poate lucra odată.` : 'Pornește-l când vrei.'}</span>${canRun ? `<button class="btn sm primary" data-act="run" data-pid="${esc(p.id)}">Pornește lucrul</button>` : ''}</div>`;
  else if (p.status === 'paused') banner = `<div class="banner"><span><b>Pe pauză.</b> ${lastCp ? `Punct de salvare: ${esc(lastCp.label)}${lastCp.total ? ` (${lastCp.done}/${lastCp.total} elemente gata)` : ''}, ${clock(lastCp.at)}. ` : ''}„Continuă” pornește exact de aici.</span>${canRun ? `<button class="btn sm primary" data-act="run" data-pid="${esc(p.id)}">Continuă</button>` : ''}</div>`;
  else if (p.status === 'failed') banner = `<div class="banner err"><span><b>Generarea s-a oprit.</b> ${esc(p.error || '')}</span>${canRun ? `<button class="btn sm" data-act="run" data-pid="${esc(p.id)}">Reia de la ultimul pas</button>` : ''}</div>`;
  else if (p.status === 'waiting_limit') banner = `<div class="banner"><span>Limita abonamentului Claude a fost atinsă. Aplicația reia singură la <b>${new Date(p.resumeAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</b>, de unde a rămas.</span>${canRun ? `<button class="btn sm" data-act="run" data-pid="${esc(p.id)}">Încearcă acum</button>` : ''}</div>`;
  else if (p.status === 'awaiting_review' && S.route.tab !== 'review') banner = `<div class="banner"><span><b>${esc(gateLabel(p))}</b>${p.gate?.round > 1 ? `, runda ${p.gate.round}` : ''} te așteaptă.</span><a class="btn sm primary" href="#/p/${esc(p.id)}/review">Deschide revizuirea</a></div>`;
  if (p.error && p.status === 'awaiting_review' && !local) banner += `<div class="banner err"><span>${esc(p.error)}</span></div>`;
  const inp = p.input || {};
  const head = `<a class="back" href="#/projects">Toate proiectele</a><div class="phead"><div style="min-width:0"><h1>${esc(p.title)}</h1>
    <div class="pmeta">${badge(p.status)}<span class="chip">${esc(p.typeName)} v${esc(p.typeVersion)}</span><span class="chip">${esc(p.variantLabel || '')}</span>${p.source?.kind ? `<span class="chip" title="Sursa proiectului">${esc({ idea: 'din idee', manuscript: 'din manuscris', pack: 'din pachet', import: 'importat', migration: 'migrat' }[p.source.kind] || p.source.kind)}</span>` : ''}${[inp.language, inp.second_language].filter(Boolean).map(l => `<span class="chip">${esc(langLabel(l))}</span>`).join('')}</div></div><div class="row">${actions}</div></div>${banner}`;
  let body = '';
  if (!S.bp) body = `<div class="faint">Se încarcă…</div>`;
  else switch (S.route.tab) {
    case 'review': body = tabReview(p); break;
    case 'book': body = tabBook(p); break;
    case 'export': body = tabExport(p); break;
    case 'activity': body = tabActivity(p); break;
    default: body = tabProgress(p);
  }
  return head + projectTabs(p) + body;
}

function tabProgress(p) {
  const plan = p.stagePlan || [];
  const idx = p.stageIndex || 0;
  const task = p.stages?._task;
  const curKey = task && task.status === 'running' && p.status === 'correcting' ? '_task' : p.currentStage;
  const curDef = curKey === '_task' ? { key: '_task', label: 'Modificări cerute' } : S.bp.stages.find(s => s.key === curKey);
  const cur = p.stages?.[curKey] || {};
  const headline = p.status === 'awaiting_review' ? `Așteaptă decizia ta: ${gateLabel(p)}`
    : p.status === 'completed' ? 'Produs finalizat' : p.status === 'failed' ? `Oprit la: ${curDef?.label || ''}`
    : p.status === 'correcting' ? 'Aplic modificările cerute' : curDef ? tpl(curDef.label, {}) : 'Pregătit de pornire';
  const stageLi = (s, i) => {
    const st = p.stages?.[s.key] || {};
    const status = st.status === 'prefetched' ? 'done' : st.status || (i < idx ? 'done' : 'pending');
    const sub = [st.total > 1 ? `${st.done || 0} din ${st.total}` : '', st.status === 'skipped' ? (st.note || 'sărit') : '', st.status === 'prefetched' || /în avans/.test(st.note || '') ? 'pregătit în avans' : '', status === 'waiting' ? 'așteaptă decizia ta' : ''].filter(Boolean).join(', ');
    return `<li><span class="ic ${cls(status)} ${s.gate ? 'gate' : ''}"></span><div><div class="name">${esc(s.label)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}${st.error ? `<div class="err-text">${esc(st.error)}</div>` : ''}${st.warn ? `<div class="sub" style="color:var(--warn)">${esc(st.warn)}</div>` : ''}</div><div class="right">${st.finishedAt && st.startedAt ? dur(st.finishedAt - st.startedAt) : status === 'running' ? 'acum' : ''}</div></li>`;
  };
  const GS = { done: 'livrat', running: 'în lucru', waiting: 'așteaptă decizia ta', error: 'eroare', pending: 'urmează' };
  const list = p.volumeFlow ? groupsOf(p).map(g => `<li style="background:var(--sunken)"><span class="ic ${cls(g.status === 'done' ? 'done' : g.status)}"></span><div><div class="name"><b>${esc(g.label)}</b></div></div><div class="right">${g.vol == null && g.status === 'done' ? 'aprobată' : g.status === 'done' ? (p.delivered?.[g.vol] ? 'livrat' : 'aprobat, de livrat') : GS[g.status]}</div></li>${g.current ? g.items.map(x => stageLi(x.s, x.i)).join('') : ''}`).join('') : plan.map(stageLi).join('');
  const labels = cur.labels || [];
  const grid = (cur.items || []).length > 1 ? `<div class="grid-items">${cur.items.map((s, i) => `<span class="gi ${cls(s)}" title="${esc(labels[i] || '')}">${esc(labels[i] || i + 1)}</span>`).join('')}</div>` : '';
  return `${p.volumeFlow ? `<div style="margin-bottom:16px">${timelineHTML(p)}</div>` : ''}<div class="panel prog-top"><div class="row" style="justify-content:space-between"><h2 style="font-size:18px">${esc(headline)}</h2><span class="faint small">Etapa ${Math.min(idx + 1, plan.length)} din ${plan.length}, pornit ${ago(p.createdAt)}</span></div>
    ${colorbar(p, true)}<div class="cbar-labels" aria-hidden="true">${p.volumeFlow ? groupsOf(p).map(g => `<span>${esc(g.label)}</span>`).join('') : plan.map(s => `<span class="${s.gate ? 'gate' : ''}">${esc(s.label)}</span>`).join('')}</div></div>
    <div class="cols"><div class="panel"><ul class="stage-list">${list}</ul></div>
    <div class="panel panel-pad"><h3 style="font-size:15px">Acum</h3>
      <p class="small muted" style="margin-top:4px">${cur.status === 'running' ? `${esc(curDef?.label || '')}${cur.total > 1 ? `: ${cur.done || 0} din ${cur.total} gata` : ''}` : p.status === 'awaiting_review' ? 'AI-ul s-a oprit la revizuire. Citește documentele și decide.' : 'Niciun pas activ.'}</p>
      ${grid}<div class="live" id="live"></div></div></div>${pilotBanner(p)}${unitsPanel(p)}`;
}
/* P3-T06: measured progress from durable work units (current run); no invented ETA; waits and stop reasons explicit */
const UNIT_ST = { committed: 'gata', skipped: 'sărit', executing: 'în lucru', leased: 'în lucru', checking: 'se verifică', waiting_provider: 'așteaptă furnizorul', ambiguous: 'necesită decizie', failed: 'eșuat', cancelled: 'anulat', paused: 'pe pauză', pending: 'urmează' };
const QUOTA = { ok: 'verificată', limited: 'limitată', unknown: 'necunoscută' };
/* P4-T05: demo → full pilot → bulk; volumes 2–N stay blocked (including prefetch) until the pilot is decided */
function pilotBanner(p) {
  const ps = S.pilot?.[p.id]; if (!ps || ps.policy !== 'pilot') return '';
  return `<div class="panel panel-pad" id="pilot-state" data-approved="${ps.pilotApproved}" style="margin-top:16px"><h3 style="font-size:15px">Pilot: volumul ${esc(ps.pilotVolume)}</h3><p class="small">Demo: ${ps.demoApproved ? 'aprobat' : 'așteaptă decizia ta'} · Cartea completă a pilotului: ${ps.pilotApproved ? 'aprobată' : 'așteaptă decizia ta'}</p>${ps.pilotApproved ? '<p class="small muted">Volumele următoare se pot genera.</p>' : `<p class="small" style="color:var(--warn)">${esc(ps.message)}</p>`}</div>`;
}
function unitsPanel(p) {
  const r = S.progress?.[p.id]; if (!r) return '';
  const u = r.units, c = r.consumption;
  const est = r.estimate?.value != null ? `≈ ${dur(r.estimate.value)} pentru etapa curentă (${esc(r.estimate.basis)}; fără așteptări și decizii)` : esc(r.estimate?.reason || 'Fără estimare.');
  const waits = (r.waiting || []).map(w => `<li><span class="ic ${w.kind === 'human' ? 'waiting' : 'running'}"></span><div><div class="name">${esc(w.cause)}</div>${w.label ? `<div class="sub">${esc(w.label)}</div>` : ''}</div><div class="right">${w.resetAt ? 'reia la ' + clock(w.resetAt) : ''}</div></li>`).join('');
  const quota = Object.entries(c.quota || {}).map(([k, v]) => `<span class="chip" title="${esc(k)}">${esc(k.replace(/-.*$/, ''))}: ${esc(QUOTA[v] || v)}</span>`).join(' ');
  return `<div class="panel panel-pad" id="units-panel" style="margin-top:16px" data-run="${esc(r.run)}" data-committed="${esc(u.committed)}"><div class="row" style="justify-content:space-between"><h3 style="font-size:15px">Unități de lucru (rularea ${esc(r.run)})</h3><span class="faint small">din jurnalul durabil</span></div>
    <p class="small" style="margin-top:6px"><b>${esc(u.committed)}</b> gata${u.reused ? ` (din care ${esc(u.reused)} refolosite)` : ''} · ${esc(u.skipped)} sărite · ${esc(u.executing + u.leased + u.checking)} în lucru · ${esc(u.waiting_provider)} așteaptă furnizorul · ${esc(u.ambiguous)} necesită decizie · ${esc(u.failed)} eșuate${u.superseded ? ` · <span class="faint">${esc(u.superseded)} din rulări anterioare (nu se numără)</span>` : ''}</p>
    <p class="small muted">Estimare: ${est}</p>
    <p class="small muted">Consum: ${esc(c.textCalls)} apeluri text, ${esc(c.imageCalls)} imagini; tokeni ${c.tokens.measuredCalls ? `măsurați la ${esc(c.tokens.measuredCalls)} apeluri (${esc(c.tokens.input)} intrare / ${esc(c.tokens.output)} ieșire)${c.tokens.unmeasuredCalls ? `, necunoscuți la ${esc(c.tokens.unmeasuredCalls)}` : ''}` : 'necunoscuți (nu au fost raportați)'}. Cotă: ${quota || 'necunoscută'}</p>
    ${waits ? `<h4 style="margin-top:8px">Așteptări</h4><ul class="stage-list">${waits}</ul>` : ''}${r.stopReason ? `<p class="small err-text">Motivul opririi: ${esc(r.stopReason)}</p>` : ''}</div>`;
}

/* ---------- review studio ---------- */
function treeNodes(bp, art) {
  const defs = bp.artifacts || {}; const order = Object.keys(defs);
  const nodes = [];
  for (const k of Object.keys(art)) { const d = defFor(bp, k); if (!d.hidden) nodes.push(d); }
  for (const [k, d] of Object.entries(defs)) if (d.virtual && (!d.requires || art[d.requires])) nodes.push({ ...d, _key: k, _pattern: k });
  const num = k => { const m = k.match(/(\d+)$/); return m ? Number(m[1]) : -1; };
  nodes.sort((a, b) => (order.indexOf(a._pattern) - order.indexOf(b._pattern)) || (num(a._key) - num(b._key)));
  const groups = [];
  for (const n of nodes) { const g = n.group || 'Altele'; let G = groups.find(x => x.name === g); if (!G) groups.push(G = { name: g, items: [] }); G.items.push(n); }
  return { nodes, groups };
}
function tabReview(p) {
  if (p.gate && S.review?.items?.length && S.revMode !== 'docs') return approvalHTML(p);
  const bp = S.bp; const { nodes, groups } = treeNodes(bp, S.art);
  if (!nodes.length) return `<div class="empty">Documentele apar aici pe măsură ce AI-ul le produce.</div>`;
  let sel = S.sel[p.id];
  if (!sel || !nodes.find(n => n._key === sel)) {            // open straight on what the current review is about
    const g = p.gate; const pref = g?.vol != null ? (g.key === 'review_1' ? `script_${g.vol}` : `final_${g.vol}`) : g?.key === 'review_collection' ? 'bible' : null;
    sel = S.sel[p.id] = (pref && nodes.find(n => n._key === pref) ? pref : nodes[0]._key);
  }
  const node = nodes.find(n => n._key === sel);
  const openBy = k => S.comments.filter(c => c.artifactKey === k && c.status === 'open').length;
  const appr = [...(p.decisions || [])].reverse().find(d => d.approvedVersions)?.approvedVersions || {};
  const mark = (k, a) => appr[k] == null ? (a?.version > 1 ? `<span class="v">v${a.version}</span>` : '') : appr[k] === a?.version ? '<span class="ok-mark" title="Aprobat în această versiune">aprobat</span>' : '<span class="stale" title="S-a schimbat după ce l-ai aprobat">modificat</span>';
  const tree = groups.map(g => `<h4>${esc(g.name)}</h4>${g.items.map(n => { const c = openBy(n._key); const a = S.art[n._key]; return `<button data-act="sel" data-key="${esc(n._key)}" aria-current="${n._key === sel}">${esc(n.label)}${c ? `<span class="cnt" title="comentarii deschise">${c}</span>` : mark(n._key, a)}</button>`; }).join('')}`).join('');
  const picker = `<select class="select tree-select" data-act-change="tree-sel" aria-label="Document">${groups.map(g => `<optgroup label="${esc(g.name)}">${g.items.map(n => `<option value="${esc(n._key)}" ${n._key === sel ? 'selected' : ''}>${esc(n.label)}${openBy(n._key) ? ` (${openBy(n._key)} comentarii)` : ''}</option>`).join('')}</optgroup>`).join('')}</select>`;
  return `${p.gate && S.review?.items?.length ? `<div class="row" style="margin-bottom:10px"><button class="btn sm" data-act="rev-mode" data-m="items">Înapoi la aprobarea pe elemente</button></div>` : ''}${picker}<div class="studio"><nav class="tree" data-keep="tree" aria-label="Documente">${tree}</nav>
    <div class="reader" id="reader" data-keep="reader-${esc(sel)}"><div class="reader-inner ${node.view === 'script' && S.readMode !== 'detail' || node.view === 'cast' || node.view === 'bible' ? 'wide' : ''}">${readerHTML(p, node)}</div></div>
    <aside class="aside">${commentsHTML(p, node)}</aside></div>${decisionBar(p)}`;
}
function readerHTML(p, node) {
  const a = S.art[node._key];
  if (node.virtual) return `<div class="doc"><h2 class="doc-title">${esc(node.label)}</h2>${(VIEWS[node.view] || VIEWS.generic)(null, node, p)}</div>`;
  if (!a) return `<div class="faint">Documentul nu există încă.</div>`;
  const vKey = p.id + '/' + node._key;
  const vv = S.viewVersion[vKey];
  const old = vv ? (a.versions || []).find(x => String(x.version) === String(vv)) : null;
  const content = old ? old.content : a.content;
  const prev = old ? null : (a.versions || [])[0]?.content;
  const modeCtl = node.view === 'script' ? `<div class="seg-ctl readmode"><button data-act="read-mode" data-m="storyboard" aria-pressed="${S.readMode !== 'detail'}">Planșe</button><button data-act="read-mode" data-m="detail" aria-pressed="${S.readMode === 'detail'}">Detaliat</button></div>` : '';
  const pv = a.meta?.prov; const provTxt = pv ? `<span class="tiny faint" title="Proveniență">Creat de ${esc(agentName(pv.agent))} (${esc(pv.model || '')}), prompt „${esc(pv.prompt || '')}”, ${pv.lessons?.length || 0} reguli aplicate, tip de produs v${esc(pv.blueprint)}</span>` : '';
  const editorialNote = S.editorial?.issues?.length ? `<details class="notice warn small"><summary>${S.editorial.issues.length} câmpuri editoriale necesită verificare (${S.editorial.strict ? 'contract v03' : 'proiect anterior, păstrat'})</summary>${S.editorial.issues.slice(0,80).map(x=>`<div>${esc(x.target)}: ${esc(x.field)}</div>`).join('')}</details>` : '';
  const vbar = `<div class="vbar">${node._key === "bible" && !S.lan?.remote ? `<button class="btn sm ghost" data-act="blueprint-upgrade">Folosește contractul editorial curent</button>${S.art.blueprint_history ? `<button class="btn sm ghost" data-act="blueprint-upgrade" data-restore="1">Revino la contractul precedent</button>` : ""}` : ""}<button class="btn sm ghost" data-act="artifact-history" data-key="${esc(node._key)}">Compară / restaurează</button>${!old ? `<button class="btn sm" data-act="artifact-edit" data-key="${esc(node._key)}">Editează structura</button>` : ''}${modeCtl}${provTxt}<span>Versiunea ${a.version}, ${a.by === 'user' ? 'editată de tine' : a.meta?.provenance === 'manual' || a.by === 'import' || a.stage === 'import' ? 'importată / pregătită manual' : 'generată de AI'}, ${ago(a.updatedAt)}${a.note ? `. ${esc(a.note)}` : ''}</span>
    ${(a.versions || []).length ? `<label>Vezi <select data-act-change="ver" data-key="${esc(node._key)}"><option value="">versiunea curentă</option>${a.versions.map(x => `<option value="${x.version}" ${String(x.version) === String(vv) ? 'selected' : ''}>versiunea ${x.version}</option>`).join('')}</select></label>` : ''}</div>`;
  return `${editorialNote}${vbar}${old ? `<div class="notice warn" style="margin-bottom:16px">Vezi o versiune anterioară (${old.version}), doar pentru citire.</div>` : ''}<div class="doc">${(VIEWS[node.view] || VIEWS.generic)(content, node, p, { art: a, prev })}</div>`;
}
function commentsHTML(p, node) {
  const all = S.cmScope === 'all';
  const list = S.comments.filter(c => all || c.artifactKey === node._key);
  const items = list.length ? list.slice().reverse().map(c => `<div class="cm ${c.status !== 'open' ? 'done' : ''}"><div class="who"><span>${esc(nameOf(c.author))}, ${ago(c.createdAt)}${all ? `, ${esc(defFor(S.bp, c.artifactKey).label)}` : ''}</span><span>${c.severity === 'must' ? '<span class="must">obligatoriu</span>' : ''}</span></div>
      ${c.quote ? `<div class="quote">${esc(c.quote)}</div>` : ''}<div class="body">${esc(c.body)}</div>
      <div class="row" style="margin-top:6px"><span class="faint tiny">${c.status === 'addressed' ? 'rezolvat de AI' : c.status === 'resolved' ? 'rezolvat' : ''}</span>${c.status === 'open' ? `<button class="btn ghost sm" data-act="cm-resolve" data-id="${esc(c.id)}">Marchează rezolvat</button>` : `<button class="btn ghost sm" data-act="cm-reopen" data-id="${esc(c.id)}">Redeschide</button>`}</div></div>`).join('')
    : `<p class="faint small">${all ? 'Niciun comentariu în proiect.' : 'Selectează text în document pentru a comenta un fragment, sau scrie un comentariu general mai jos.'}</p>`;
  const q = S.composer?.key === node._key ? S.composer.quote : '';
  return `<div class="aside-head"><b>Comentarii</b><div class="seg-ctl"><button data-act="cm-scope" data-s="artifact" aria-pressed="${!all}">Aici</button><button data-act="cm-scope" data-s="all" aria-pressed="${all}">Toate</button></div></div>
    <div class="aside-body" data-keep="cm">${items}</div>
    <div class="composer">${q ? `<div class="quote">${esc(q)}</div>` : ''}<textarea id="cm-body" class="textarea" placeholder="${q ? 'Ce trebuie schimbat aici?' : 'Comentariu despre ' + esc(node.label)}" aria-label="Comentariu nou"></textarea>
      <div class="row" style="margin-top:8px;justify-content:space-between"><label class="check small"><input type="checkbox" id="cm-must"> obligatoriu</label><div class="row">${q ? '<button class="btn ghost sm" data-act="cm-clear">Renunță</button>' : ''}<button class="btn sm primary" data-act="cm-add" data-key="${esc(node._key)}">Adaugă</button></div></div></div>`;
}
function decisionBar(p) {
  if (p.status !== 'awaiting_review' || !p.gate) return p.status === 'correcting' ? `<div class="decision"><div class="what"><b>Se aplică modificările</b><span class="small muted">Revizuirea se redeschide automat după ce AI-ul termină.</span></div></div>` : '';
  const g = S.bp.gates?.[p.gate.key] || {};
  const open = S.comments.filter(c => c.status === 'open' && c.gateKey === p.gate.key).length;
  return `<div class="decision"><div class="what"><b>${esc(gateLabel(p))}${p.gate.round > 1 ? `, runda ${p.gate.round}` : ''}</b><span class="small muted">${open ? `${open} comentarii deschise vor fi trimise AI-ului la corecții.` : esc(g.approve_hint || '')}</span></div>
    <button class="btn danger" data-act="decide" data-d="rejected">Respinge</button><button class="btn" data-act="decide" data-d="needs_correction">Cere corecții</button>${gateReady() ? '' : `<span class="small muted" id="gate-hint">Aprobarea se dă pe fiecare element, în „Aprobări pe elemente”.</span>`}<button class="btn" data-act="decide" data-d="approved_with_notes" ${gateReady() ? '' : 'disabled aria-describedby="gate-hint"'}>Aprobă cu note</button><button class="btn primary" data-act="decide" data-d="approved" ${gateReady() ? '' : 'disabled aria-describedby="gate-hint"'}>Aprobă</button></div>`;
}
/* audit H1: the gate closes only when every element was approved (the server checks it too) */
function gateReady() { const R = S.review; return !R?.items?.length || !!R.summary?.done;
}

/* ---------- characters: avatars from reference images ---------- */
function avatarOf(id) {
  const a = (S.art.anchors?.content?.prompts || []).find(x => x.ref === id && x.image); if (a) return fileUrl(a.image);
  const own = (S.art.refs?.content?.characters || []).find(c => c.id === id); const f = own && (curProject()?.refs || [])[own.images?.[0]];
  return f ? fileUrl(f.file) : null;
}
function charOf(id) { return (S.art.bible?.content?.characters || []).find(c => c.id === id) || { id, name: id }; }
function avatar(id, lg) {
  const u = avatarOf(id); const c = charOf(id); const hex = c.visual?.palette?.[0]?.hex || '#8a90a0';
  return u ? `<img class="av ${lg ? 'lg' : ''}" src="${u}" alt="">` : `<span class="av ${lg ? 'lg' : ''}" style="background:${/^#[0-9a-f]{3,8}$/i.test(hex) ? hex : '#8a90a0'}">${esc((c.name || id || '?')[0].toUpperCase())}</span>`;
}
const whoChip = id => `<span class="who-chip">${avatar(id)}${esc(charOf(id).name || id)}</span>`;
const PRES = { introduced: ['nou', 'apare prima dată'], appears: ['apare', 'apare'], returns: ['revine', 'revine după o pauză'], mentioned: ['amintit', 'doar menționat'] };

/* renderers per artifact "view"; unknown views fall back to a generic tree */
const L = (title, arr) => Array.isArray(arr) && arr.filter(Boolean).length ? `<h3>${esc(title)}</h3><ul>${arr.filter(Boolean).map(x => `<li>${esc(typeof x === 'object' ? JSON.stringify(x) : x)}</li>`).join('')}</ul>` : '';
const swatches = pal => Array.isArray(pal) && pal.length ? `<div class="swatches">${pal.map(c => `<span class="sw"><i style="background:${/^#[0-9a-f]{3,8}$/i.test(c?.hex || '') ? c.hex : '#ccc'}"></i>${esc(c?.name || '')} <span class="faint">${esc(c?.hex || '')}</span></span>`).join('')}</div>` : '';
function charName(id) { return (S.art.bible?.content?.characters || []).find(c => c.id === id)?.name || id; }
const VIEWS = {
  brief: c => `<h2 class="doc-title">${esc(c.collection_title)}</h2><p class="lede">${esc(c.logline)}</p><dl><dt>Ton</dt><dd>${esc(c.tone)}</dd><dt>Direcție vizuală</dt><dd>${esc(c.visual_direction)}</dd></dl>${L('Valori', c.core_values)}${L('Obiective educaționale', c.educational_goals)}${L('Reguli narative', c.narrative_rules)}${L('De evitat', c.avoid)}`,
  series: c => `<h2 class="doc-title">Arcul colecției</h2><p class="lede">${esc(c.through_line)}</p><div style="margin-top:20px">${(c.volumes || []).map((v, i) => `<div class="vol"><div class="num">${i + 1}</div><div><h4>${esc(v.title)}</h4><p style="margin-top:4px">${esc(v.summary)}</p><dl><dt>Obiectiv</dt><dd>${esc(v.learning_goal)}</dd><dt>Decor principal</dt><dd>${esc(v.main_setting)}</dd><dt>Arc emoțional</dt><dd>${esc(v.emotional_arc)}</dd></dl></div></div>`).join('')}</div>`,
  bible: c => `<h2 class="doc-title">Biblia poveștii</h2><p class="lede">Personajele colecției. Deschide „Detalii” pentru descrierea completă.</p>
    <div class="gallery">${(c.characters || []).map(ch => `<div class="gcard">${avatar(ch.id, true)}<h4>${esc(ch.name)}</h4><span class="role ${ch.role === 'main' ? 'main' : ''}">${ch.role === 'main' ? 'personaj principal' : 'personaj secundar'}</span><p class="small">${esc(ch.personality)}</p>${swatches(ch.visual?.palette)}${(ch.visual?.distinctive_features || []).length ? `<p class="small muted">${ch.visual.distinctive_features.map(esc).join(', ')}</p>` : ''}${(ch.forbidden_deviations || []).filter(Boolean).length ? `<p class="small" style="color:var(--err)">Niciodată: ${ch.forbidden_deviations.map(esc).join(', ')}</p>` : ''}</div>`).join('')}</div>
    ${(c.objects || []).length ? `<h3>Obiecte importante</h3><div class="gallery">${c.objects.map(o => `<div class="gcard"><h4 style="font-size:15px">${esc(o.name)}</h4><p class="small">${esc(o.canonical_description)}</p>${o.introduced ? `<p class="tiny faint">Apare prima dată: ${esc(o.introduced)}</p>` : ''}</div>`).join('')}</div>` : ''}
    <details style="margin-top:18px"><summary style="cursor:pointer;font-weight:600">Detalii complete: personaje, lume și stil</summary><h3>Personaje</h3>${(c.characters || []).map(ch => `<div class="char"><div class="row" style="justify-content:space-between"><h4>${esc(ch.name)}</h4><span class="chip">${esc(ch.role)}</span></div><p class="muted" style="margin-top:4px">${esc(ch.personality)}</p><dl>${[['Dorință','desire'],['Frică','fear'],['Obiectiv','goal'],['Defect','flaw'],['Calitate','strength'],['Relații','relationships'],['Voce','voice'],['Gesturi','gestures']].map(([label,key])=>`<dt>${label}</dt><dd>${esc(ch[key]||'neprecizat')}</dd>`).join('')}</dl><h4>Repere anatomice</h4>${(ch.visual_landmarks||[]).map(m=>`<div class="small">${esc(m.id)} · ${esc(m.side)} · ${esc(m.body_region)} · ${esc(m.anchor)} · ${esc(m.relative_size)} · ${esc(m.shape)} · ${esc(m.occlusion_rule)}</div>`).join('')}${swatches(ch.visual?.palette)}<dl><dt>Tip</dt><dd>${esc(ch.visual?.type)}</dd><dt>Corp</dt><dd>${esc(ch.visual?.body)}</dd><dt>Față</dt><dd>${esc(ch.visual?.face)}</dd><dt>Păr sau blană</dt><dd>${esc(ch.visual?.hair_or_fur)}</dd><dt>Ținută</dt><dd>${esc(ch.visual?.outfit)}</dd></dl>${L('Trăsături care nu se schimbă', ch.visual?.distinctive_features)}<div class="canon" title="Descriere canonică folosită în fiecare prompt de imagine">${esc(ch.canonical_description)}</div></div>`).join('')}
    <h3>Lumea</h3><p>${esc(c.world?.description)}</p>${(c.world?.locations || []).length ? `<dl>${c.world.locations.map(l => `<dt>${esc(l.name)}</dt><dd>${esc(l.description)}</dd>`).join('')}</dl>` : ''}
    <h3>Ghid de stil</h3>${swatches(c.style_guide?.palette)}<dl><dt>Linie</dt><dd>${esc(c.style_guide?.line)}</dd><dt>Lumină</dt><dd>${esc(c.style_guide?.lighting)}</dd><dt>Atmosferă</dt><dd>${esc(c.style_guide?.mood)}</dd></dl><div class="canon">${esc(c.style_guide?.style_block)}</div></details>`,
  script: (c, node, p, o = {}) => (S.readMode !== 'detail' ? storyboardHTML(c, node, o) : detailScript(c, node, p, o)),
  cast: c => {
    const vols = Array.from({ length: S.bp.structure.volumes }, (_, i) => i + 1);
    const rows = (c.characters || []).map(ch => `<tr><td><span class="who-chip">${avatar(ch.id)}${esc(charOf(ch.id).name || ch.id)}</span> ${ch.id === c.main_character || ch.role === 'main' ? '<span class="role main">principal</span>' : '<span class="role">secundar</span>'}</td>${vols.map(v => { const x = (ch.volumes || []).find(y => Number(y.volume) === v); const pr = PRES[x?.presence]; return `<td>${pr ? `<span class="pz pz-${x.presence}" data-act="tip" data-msg="${esc(pr[1] + (x.purpose ? ': ' + x.purpose : ''))}" title="${esc(pr[1] + (x.purpose ? ': ' + x.purpose : ''))}">${pr[0]}</span>` : ''}</td>`; }).join('')}</tr>`).join('');
    return `<h2 class="doc-title">Plan distribuție</h2><p class="lede">Cine apare în fiecare volum. Ține cursorul pe o etichetă ca să vezi de ce.</p>
      <div class="cast-wrap"><table class="cast"><thead><tr><th>Personaj</th>${vols.map(v => `<th>Vol. ${v}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
      <div class="legend">${Object.entries(PRES).map(([k, [l, d]]) => `<span><span class="pz pz-${k}">${l}</span> ${d}</span>`).join('')}</div>
      <h3>Arcul fiecărui personaj</h3>${(c.characters || []).filter(ch => ch.arc).map(ch => `<p style="margin-top:8px">${whoChip(ch.id)} ${esc(ch.arc)}</p>`).join('')}${c.notes ? `<p class="muted small" style="margin-top:14px">${esc(c.notes)}</p>` : ''}`;
  },
  continuity: c => {
    const fixed = new Set(c.fixed_volumes || []);
    return `<h2 class="doc-title">Continuitate</h2><p class="lede">${(c.issues || []).length ? `${c.issues.length} probleme găsite${fixed.size ? `; volumele ${[...fixed].join(', ')} au fost corectate automat` : ''}.` : 'Nicio problemă de continuitate găsită.'}</p>
      ${(c.issues || []).map(x => `<div class="issue ${fixed.has(Number(x.volume)) ? 'fixed' : ''}"><b>Vol. ${esc(x.volume)}${x.page ? `, p. ${esc(x.page)}` : ''}</b>${fixed.has(Number(x.volume)) ? ' <span class="faint small">corectat</span>' : ''}<div class="small">${esc(x.problem)}</div><div class="small muted">${esc(x.fix)}</div></div>`).join('')}
      <h3>Ce s-a întâmplat cu fiecare personaj</h3>${(c.ledger || []).map(l => `<div class="char"><div class="row">${avatar(l.id)}<h4>${esc(charOf(l.id).name || l.id)}</h4></div>${(l.volumes || []).map(v => `<p class="small" style="margin-top:8px"><b>Vol. ${esc(v.volume)}:</b> ${esc(v.did)}${v.learned ? ` <span class="muted">Învață: ${esc(v.learned)}</span>` : ''}${v.relationships ? ` <span class="faint">${esc(v.relationships)}</span>` : ''}</p>`).join('')}</div>`).join('')}`;
  },
  script_detail_unused: (c, node, p, o = {}) => {
    const prevPages = o.prev?.pages || [];
    const cr = o.art?.meta?.critique;
    const crit = cr ? `<details class="critique"><summary>Editorul critic: <span class="score">${esc(o.art.meta.score)}/10</span>${o.art.meta.score_before != null && o.art.meta.score_before !== o.art.meta.score ? ` <span class="faint small">(de la ${esc(o.art.meta.score_before)} înainte de revizuire)</span>` : ''}</summary>${criteriaHTML(cr)}${L('Puncte forte', cr.strengths)}${(cr.issues || []).length ? `<h3>Observații</h3><ul>${cr.issues.map(i => `<li>${i.page ? `<b>p. ${esc(i.page)}</b>: ` : ''}${i.code ? `<span class="chip" title="${esc(codeLabel(i.code))}">${esc(i.code)}</span> ` : ''}${i.quote ? `<i>„${esc(i.quote)}”</i> ` : ''}${esc(i.problem)} <span class="faint">${esc(i.fix)}</span></li>`).join('')}</ul>` : ''}</details>` : '';
    const pg = (x, label, prevX) => `<div class="spage ${prevX && prevX.text !== x.text ? 'changed' : ''}"><div class="pn">${esc(label)}</div><div>${x.text != null ? `<p class="txt">${esc(x.text)}</p>` : ''}<p class="scene">${esc(x.scene)}</p><div class="meta">${(x.characters || []).map(id => `<span class="chip">${esc(charName(id))}</span>`).join('')}${x.setting ? `<span class="chip">${esc(x.setting)}</span>` : ''}${x.composition ? `<span class="chip">${esc(x.composition)}</span>` : ''}${x.text_zone ? `<span class="chip">text ${x.text_zone === 'top' ? 'sus' : 'jos'}</span>` : ''}</div></div></div>`;
    const changed = prevPages.length ? (c.pages || []).filter((x, i) => prevPages[i] && prevPages[i].text !== x.text).length : 0;
    return `<h2 class="doc-title">${esc(c.title)}</h2>${changed ? `<p class="small" style="margin-top:6px;color:#0077AA">${changed} pagini modificate față de versiunea anterioară, marcate cu albastru.</p>` : ''}${crit}
      ${c.cover ? pg(c.cover, 'Copertă') : ''}${(c.pages || []).map((x, i) => pg(x, 'Pagina ' + (x.n || i + 1), prevPages[i])).join('')}
      ${c.back_cover_blurb ? `<h3>Coperta 4</h3><p class="txt" style="font:17px/1.55 var(--book)">${esc(c.back_cover_blurb)}</p>` : ''}`;
  },
  prompts: c => `<h2 class="doc-title">Referințe vizuale</h2><p class="lede">Fișele de personaj generate în Canva sunt trimise ca imagini de referință la fiecare pagină, pentru ca personajele să arate la fel pe toate cele 78 de ilustrații.</p>${(c.prompts || []).map((x, i) => `<div class="prompt-item">${x.image ? `<img src="${fileUrl(x.image)}" alt="${esc(x.label)}" style="border-radius:6px;margin-bottom:10px;max-height:320px;width:auto">` : ''}<div class="row" style="justify-content:space-between"><b>${esc(x.label)}</b><span class="row">${x.link ? `<a class="btn ghost sm" href="${extUrl(x.link)}" rel="noopener noreferrer" target="_blank" rel="noopener">Deschide în Canva</a>` : ''}<button class="btn ghost sm" data-act="copy" data-text-idx="${i}">Copiază promptul</button></span></div><div class="pt">${esc(x.prompt)}</div></div>`).join('')}`,
  list: (c, node) => `<h2 class="doc-title">${esc(node.label)}</h2>${L('', getPath(c, node.list_path || 'items'))}`,
  preflight: c => `<h2 class="doc-title">Verificare finală</h2><p class="lede">Verificări automate rulate ${ago(c.at)}.</p><ul class="checks">${(c.checks || []).map(x => `<li><span class="st ${cls(x.status)}"></span><div><b>${esc(x.label)}</b><div class="small muted">${esc(x.detail)}</div></div></li>`).join('')}</ul>`,
  book_sample: (c, node, p) => `<p class="lede">Primele pagini desenate, fiecare lângă pagina de colorat derivată din ea. Validezi stilul și personajele înainte de producția completă.</p><div class="pages pairs" style="padding-left:0;padding-right:0">${(node.pages || []).map(([v, pg]) => `<div class="pg"><div class="pair">${sheetHTML(p, v, pg, 'story', node.text_source)}${sheetHTML(p, v, pg, 'coloring', node.text_source)}</div><div class="pg-cap"><span>${esc(pageLabel(v, pg))}</span>${pageActions(p, v, pg, true)}</div></div>`).join('')}</div>`,
  refs: (c, node, p) => { const files = curProject()?.refs || []; return `<h2 class="doc-title">Personajele tale</h2><p class="lede">Claude a studiat imaginile încărcate. Descrierile de mai jos intră în Story Bible, iar imaginile devin referința Canva pentru fiecare pagină.</p>${(c.characters || []).map(ch => `<div class="char"><div class="row" style="align-items:flex-start;gap:16px">${(ch.images || []).map(i => files[i] ? `<img src="${fileUrl(files[i].file)}" alt="${esc(files[i].name)}" style="width:150px;border-radius:8px;border:1px solid var(--line)">` : '').join('')}<div style="flex:1;min-width:220px"><h4>${esc(ch.name_suggestion || ch.id)}</h4><div class="faint small">id: ${esc(ch.id)}</div>${swatches(ch.palette)}${L('Trăsături care nu se schimbă', ch.distinctive_features)}${ch.notes ? `<p class="small muted" style="margin-top:8px">${esc(ch.notes)}</p>` : ''}</div></div><div class="canon">${esc(ch.canonical_description)}</div></div>`).join('')}`; },
  visual_qa: c => { const bad = (c.pages || []).filter(x => !x.ok); return `<h2 class="doc-title">Verificare vizuală</h2><p class="lede">${(c.pages || []).length} pagini comparate cu fișele personajelor. ${bad.length ? `${bad.length} semnalate, ${bad.filter(x => x.redrawn).length} redesenate automat.` : 'Toate sunt consistente.'}</p>${bad.map(x => { const ill = S.art[`ill_${x.v}_${x.p}`]?.content; return `<div class="issue ${x.redrawn ? 'fixed' : ''}"><div class="row" style="align-items:flex-start">${ill?.color ? `<img src="${fileUrl(ill.color)}" alt="" style="width:110px;border-radius:6px">` : ''}<div><b>${esc(pageLabel(x.v, x.p))}</b>${x.redrawn ? ' <span class="faint small">redesenată</span>' : ''}<ul class="small" style="margin-top:4px">${(x.issues || []).map(i => `<li>${esc(i)}</li>`).join('')}</ul></div></div></div>`; }).join('')}`; },
  translation: (c, node) => { const v = Number((node._key.match(/_(\d+)$/) || [])[1] || 0); const src = S.art[`final_${v}`]?.content || {}; const p = curProject();
    return `<h2 class="doc-title">${esc(c.title)}</h2><p class="lede">${esc(langLabel(p?.input?.language || ''))} și ${esc(langLabel(p?.input?.second_language || ''))}, pagină cu pagină. Textul tradus se poate edita din tab-ul Carte.</p>${(c.notes || []).filter(Boolean).length ? `<div class="notice warn" style="margin-top:12px"><b>De verificat:</b><ul style="margin:6px 0 0;padding-left:18px">${c.notes.filter(Boolean).map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}
      <table class="tr">${(c.pages || []).map((pg, i) => `<tr><td>Pagina ${esc(pg.n || i + 1)}</td><td>${esc(src.pages?.[i]?.text || '')}</td><td>${esc(pg.text)}</td></tr>`).join('')}</table>`; },
  retro: c => `<h2 class="doc-title">Retrospectiva volumului</h2><p class="lede">Scrisă de producător după aprobarea finală. Lecțiile propuse le accepți sau le respingi în pagina Învățare.</p>${L('Ce a mers', c.worked)}${(c.repeated_problems || []).length ? `<h3>Probleme care s-au repetat</h3><ul>${c.repeated_problems.map(x => `<li>${x.code ? `<span class="chip" title="${esc(codeLabel(x.code))}">${esc(x.code)}</span> ` : ''}${esc(x.summary)}${(x.pages || []).length ? ` <span class="faint">(paginile ${x.pages.map(esc).join(', ')})</span>` : ''}</li>`).join('')}</ul>` : ''}${(c.new_lessons || []).length ? `<h3>Lecții propuse</h3><ul>${c.new_lessons.map(x => `<li>${esc(x.text)} <span class="faint">(${esc(agentName(x.agent))}${x.code ? ', ' + esc(x.code) : ''})</span></li>`).join('')}</ul>` : ''}`,
  /* P4-T03: the volume's 12 PageBlueprints — function, beat, emotion, state, image value, turn and who holds what */
  pageplan: c => `<div style="overflow-x:auto"><table class="tbl" id="pageplan"><thead><tr><th>Pag.</th><th>Funcție</th><th>Moment</th><th>Emoție</th><th>Ce se schimbă</th><th>Ce adaugă imaginea</th><th>Întoarcere</th><th>Cine ține ce</th></tr></thead><tbody>${(c?.pages || []).map(g => `<tr><td><b>${esc(g.n)}</b></td><td>${esc(g.role || '')}</td><td>${esc(g.beat || '')}</td><td>${esc(g.emotion || '')}</td><td>${esc(g.new_information || '')}</td><td>${esc(g.image_added_value || '')}</td><td>${esc(g.turn?.type || 'quiet')}${g.turn?.payoff_page ? ` → p${esc(g.turn.payoff_page)}` : ''}${g.turn?.hook ? `<div class="tiny faint">${esc(g.turn.hook)}</div>` : ''}</td><td>${(g.actions || []).filter(a => a.holds?.object).map(a => `${esc(a.character)}: ${esc(a.holds.object)} (${esc(a.holds.with || '')})`).join('<br>')}</td></tr>`).join('')}</tbody></table></div>`,
  generic: c => `<pre class="generic">${esc(JSON.stringify(c, null, 2))}</pre>`
};

/* v19 (plan 1.7/2.2): the editor's score per rubric criterion; critical criteria and low scores stand out */
function codeLabel(code) { const bp = (S.bp); const r = [...(bp?.rubric || []), ...(bp?.rubric_visual || [])].find(x => typeof x === 'object' && x.code === code); const rc = (bp?.reason_codes || []).find(x => x.code === code); return rc ? `${rc.label}${r ? ': ' + r.text : ''}` : (r?.text || code); }
function criteriaHTML(cr) {
  const list = (cr?.criteria || []).filter(x => x && x.code); if (!list.length) return '';
  return `<h3>Nota pe criterii</h3><div class="crit-grid">${list.map(x => `<div class="crit ${Number(x.score) < 7 ? 'low' : ''} ${(cr.failed_critical || []).includes(x.code) ? 'critical' : ''}" title="${esc(codeLabel(x.code))}${x.evidence ? ' — ' + esc(x.evidence) : ''}"><b>${esc(x.code)}</b><span>${esc(x.score)}</span><small>${esc(((S.bp)?.reason_codes || []).find(r => r.code === x.code)?.label || '')}</small></div>`).join('')}</div>${(cr.failed_critical || []).length ? `<p class="small" style="color:var(--err-ink)">Criterii critice sub prag: ${cr.failed_critical.map(esc).join(', ')}</p>` : ''}`;
}
function detailScript(c, node, p, o) { return VIEWS.script_detail_unused(c, node, p, o); }
function storyboardHTML(c, node, o = {}) {
  const v = Number((node._key.match(/_(\d+)$/) || [])[1] || 0);
  const cr = o.art?.meta?.critique;
  const wc = t => (String(t || '').match(/[\p{L}\p{N}'’-]+/gu) || []).length;
  const card = (x, pg, label) => { const ill = S.art[`ill_${v}_${pg}`]?.content; const img = ill?.color ? `<img src="${fileUrl(ill.color)}" alt="" loading="lazy">` : `<div class="sb-ph">${esc(x.scene || '')}</div>`;
    const meta = [x.page_turn === 'reveal' ? '<span class="turn">surpriză la întoarcerea paginii</span>' : '', x.sound ? `<span>sunet: ${esc(x.sound)}</span>` : '', x.educational ? `<span>${esc(x.educational)}</span>` : '', x.text ? `<span>${wc(x.text)} cuvinte</span>` : '', (x.must_not_show || []).filter(Boolean).length ? `<span>fără: ${esc(x.must_not_show.join(', '))}</span>` : ''].join('');
    return `<article class="sb-card"><div class="sb-img">${img}</div><div class="sb-body"><div class="sb-n">${esc(label)}${x.purpose ? `: ${esc(x.purpose)}` : ''}</div>${x.text ? `<p class="sb-text">${esc(x.text)}</p>` : ''}${ill?.color ? `<p class="sb-scene">${esc(x.scene || '')}</p>` : ''}${meta ? `<div class="sb-meta">${meta}</div>` : ''}<div class="sb-cast">${(x.characters || []).map(whoChip).join('')}</div></div></article>`; };
  const a = c.architecture; const blk = (t, o) => o ? `<div><b>${t}${o.pages ? `, paginile ${esc(o.pages)}` : ''}</b>${esc(o.summary || '')}</div>` : '';
  const archHTML = a ? `<div class="arch">${blk('Început', a.beginning)}${blk('Dezvoltare', a.development)}${blk('Punct culminant', a.climax)}${blk('Final', a.ending)}</div>${a.emotional_arc ? `<p class="small" style="margin-top:10px"><b>Arc emoțional:</b> ${esc(a.emotional_arc)}</p>` : ''}${a.why_age_fit ? `<p class="small muted" style="margin-top:4px"><b>De ce se potrivește vârstei:</b> ${esc(a.why_age_fit)}</p>` : ''}` : '';
  const pr = o.art?.meta?.approval_prob;
  return `<h2 class="doc-title">${esc(c.title)}</h2>${cr || pr != null ? `<p class="muted small" style="margin-top:6px">${cr ? `Editorul critic: <b>${esc(o.art.meta.score)}/10</b>. ` : ''}${pr != null ? `Șansa estimată să-l aprobi din prima, după deciziile tale de până acum: <b>${Math.round(pr * 100)}%</b>. ` : ''}Detaliile sunt în modul „Detaliat”.</p>` : ''}
    ${archHTML}<div class="sb-grid">${c.cover ? card(c.cover, 0, 'Copertă') : ''}${(c.pages || []).map((x, i) => card(x, i + 1, 'Pagina ' + (x.n || i + 1))).join('')}</div>
    ${c.back_cover_blurb ? `<h3>Coperta 4</h3><p class="sb-text">${esc(c.back_cover_blurb)}</p>` : ''}`;
}

/* ---------- book preview ---------- */
function bookInfo(p) {
  const bp = S.bp; const srcs = bp.preview?.text_sources || ['final', 'script'];
  return {
    src: (v, lang = S.book.lang) => {
      let base = null; for (const s of srcs) if (S.art[`${s}_${v}`]) { base = { key: `${s}_${v}`, name: s, c: S.art[`${s}_${v}`].content }; break; }
      const t = S.art[`tr_${v}`]?.content;
      const firstCover = p.input?.second_cover === 'first';
      if (base && lang === 'second' && t) return { key: `tr_${v}`, name: 'tr', c: { ...base.c, collection_title: firstCover ? '' : (t.collection_title || ''), title: t.title || base.c.title, back_cover_blurb: firstCover ? base.c.back_cover_blurb : (t.back_cover_blurb || base.c.back_cover_blurb), labels: { ...(base.c.labels || {}), ...(t.labels || {}), ...(firstCover ? { volume: base.c.labels?.volume } : {}) }, pages: (base.c.pages || []).map((pg, i) => ({ ...pg, text: t.pages?.[i]?.text ?? pg.text })) } };
      return base;
    },
    bilingual: !!p.input?.second_language,
    age: bp.age_profiles?.[p.input?.[bp.variant_key]] || {},
    fmt: bp.formats?.[p.input?.[bp.format_key]] || Object.values(bp.formats || {})[0] || { trim_w_in: bp.export?.trim_in || 8.5, trim_h_in: bp.export?.trim_in || 8.5 }
  };
}
function sheetHTML(p, v, pg, book, forceSource) {
  const bi = bookInfo(p);
  const src = forceSource && S.art[`${forceSource}_${v}`] ? { key: `${forceSource}_${v}`, c: S.art[`${forceSource}_${v}`].content } : bi.src(v);
  const bookDef = (S.bp.structure.books || []).find(b => b.key === book) || { mode: 'color' };
  const ill = S.art[`ill_${v}_${pg}`]?.content;
  const pt = num(bi.age.font_pt, 20);   // audit C2: a number, never text from the blueprint
  const fw = num(bi.fmt.trim_w_in, 8), fh = num(bi.fmt.trim_h_in, 10); const shape = `--ar:${fw}/${fh};--pw:${fw * 72};`;   // audit C2: numbers only
  const corners = '<i class="cm-corner tl"></i><i class="cm-corner tr"></i><i class="cm-corner bl"></i><i class="cm-corner br"></i>';
  const collT = src?.c?.collection_title || S.art.brief?.content?.collection_title || '';
  if (pg === 'back') {
    return `<figure class="sheet back" style="margin:0;--pt:${pt};${shape}">${corners}<div class="band" style="font-size:calc(${pt} * .8 * 100cqw / ${fw * 72})"><b style="display:block;margin-bottom:.6em">${esc(collT)}</b>${bookDef.back_text === false ? `<span style="font-size:.8em">${esc(src?.c?.labels?.volume || 'Volumul')} ${v + 1}</span>` : esc(src?.c?.back_cover_blurb || '')}</div></figure>`;
  }
  let art;
  const img = bookDef.mode === 'lineart' ? ill?.lineart : ill?.color;
  if (img) art = `<img src="${fileUrl(img)}" alt="${esc(pageLabel(v, pg))}" loading="lazy">`;
  else art = `<div class="ph">${bookDef.mode === 'lineart' && ill?.color ? 'Pagina de colorat nu a fost generată' : ill?.prompt ? 'Prompt pregătit, imagine negenerată' : 'Ilustrație în așteptare'}</div>`;
  let band = '';
  if (pg === 0) {
    const coll = S.art.brief?.content?.collection_title || '';
    const lab = src?.c?.labels || {};
    band = `<div class="band top cover" style="--pt:${pt}">${esc(collT)}${bi.age.cover_volume_title ? `<small style="font-size:.5em;margin-top:.3em">${esc(src?.c?.title || '')}</small>` : ''}<small class="vol">${esc(lab.volume || 'Volumul')} ${v + 1}</small></div>${bookDef.stamp ? `<div class="stamp ${bookDef.mode === 'lineart' ? 'lineart' : 'color'}" style="--pt:${pt}">${esc(bookDef.stamp)}</div>` : ''}`;
  } else {
    const page = (src?.c?.pages || [])[pg - 1];
    if (page?.text && bookDef.page_text !== false) {
      const zone=page.layout?.text_zone || page.text_zone || 'bottom';
      const family=page.layout?.family || 'panorama';
      const width={action:.88,dialogue:.72,surprise:.72,panorama:1,intimate:.78}[family] || 1;
      const horizontal=['left','right'].includes(zone) ? (zone==='left'?'right:51%;':'left:51%;') : `left:${5.5+44.5*(1-width)}%;right:${5.5+44.5*(1-width)}%;`;
      band = `<div class="band ${zone === 'top' ? 'top' : 'bottom'}" style="--pt:${pt};${horizontal}">${esc(page.text)}</div>`;
    }
  }
  return `<figure class="sheet" style="margin:0;${shape}">${corners}<div class="art">${art}</div>${band}</figure>`;
}
function isStale(key) {
  const a = S.art[key]; if (!a?.basedOn) return false;
  const src = S.art[a.basedOn.key]; if (!src) return false;
  const bi = bookInfo(curProject() || {}); const [, v] = key.split('_').map(Number);
  const cur = bi.src(v);
  return (cur && cur.key !== a.basedOn.key) || src.version !== a.basedOn.version;
}
function pageActions(p, v, pg, noEdit) {
  if (pg === 'back') return '';
  const key = `ill_${v}_${pg}`; const busy = !!p.running || p.status === 'correcting' || p.status === 'running';
  const has = !!S.art[key];
  const src = bookInfo(p).src(v);
  return `<span class="pg-actions">${isStale(key) ? '<span class="stale" title="Textul sau scena s-au schimbat după desen">depășită</span>' : ''}
    ${pg > 0 && src && !noEdit ? `<button class="btn ghost sm" data-act="edit-text" data-v="${v}" data-p="${pg}" ${busy ? 'disabled' : ''}>Text</button>` : ''}
    ${src && claudeOk() ? `<button class="btn ghost sm" data-act="regen" data-key="${key}" ${busy ? 'disabled' : ''}>${has && S.art[key].content?.color ? 'Redesenează' : 'Desenează'}</button>` : ''}
    ${has && S.art[key].content?.prompt ? `<button class="btn ghost sm" data-act="copy" data-key="${key}">Descriere imagine</button>` : ''}
    ${has && S.art[key].content?.link ? `<a class="btn ghost sm" href="${extUrl(S.art[key].content.link)}" rel="noopener noreferrer" target="_blank" rel="noopener">Canva</a>` : ''}</span>`;
}
const langLabel = v => ({ English: 'Engleză', Romanian: 'Română', German: 'Germană', French: 'Franceză', Spanish: 'Spaniolă', Italian: 'Italiană', Hungarian: 'Maghiară' }[v] || v);
function tabBook(p) {
  const bp = S.bp; const bi = bookInfo(p);
  const V = bp.structure.volumes, P = bp.structure.pages;
  if (!bi.src(0)) return `<div class="empty">Cartea apare aici după ce se scriu scenariile.</div>`;
  const v = Math.min(S.book.picked ? S.book.v : (p.currentVolume ?? S.book.v ?? 0), V - 1); const mode = S.book.mode;
  const title = i => bi.src(i)?.c?.title || S.art.series?.content?.volumes?.[i]?.title || `Volumul ${i + 1}`;
  const books = bp.structure.books || [];
  const pagesList = [0]; for (let i = 1; i <= P; i++) pagesList.push(i);
  const storyDef = books.find(b => b.mode === 'color') || books[0];
  const coloringDef = books.find(b => b.mode === 'lineart');
  if ((mode === 'coloring' ? coloringDef : storyDef)?.back_cover) pagesList.push('back');
  const missing = pagesList.filter(pg => pg !== 'back' && !(S.art[`ill_${v}_${pg}`]?.content?.color && S.art[`ill_${v}_${pg}`]?.content?.lineart)).length;
  const busy = !!p.running || ['running', 'correcting'].includes(p.status);
  const cards = pagesList.map(pg => {
    const cap = `<div class="pg-cap"><span>${pg === 0 ? 'Copertă' : pg === 'back' ? 'Coperta 4' : 'Pagina ' + pg}</span>${pageActions(p, v, pg)}</div>${S.editing && S.editing.v === v && S.editing.p === pg ? editBox(p, v, pg) : ''}`;
    if (mode === 'pair' && coloringDef) return `<div class="pg"><div class="pair">${sheetHTML(p, v, pg, storyDef.key)}${pg === 'back' && !coloringDef.back_cover ? '<div></div>' : sheetHTML(p, v, pg, coloringDef.key)}</div>${cap}</div>`;
    return `<div class="pg">${sheetHTML(p, v, pg, mode === 'coloring' && coloringDef ? coloringDef.key : storyDef.key)}${cap}</div>`;
  }).join('');
  return `<div class="vol-tabs" role="group" aria-label="Volume">${Array.from({ length: V }, (_, i) => `<button data-act="vol" data-v="${i}" aria-pressed="${i === v}">${i + 1}. ${esc(title(i))}</button>`).join('')}</div>
    ${bi.bilingual ? `<div class="seg-ctl" role="group" aria-label="Limba" style="margin-bottom:12px"><button data-act="book-lang" data-l="first" aria-pressed="${S.book.lang !== 'second'}">${esc(langLabel(p.input.language))}</button><button data-act="book-lang" data-l="second" aria-pressed="${S.book.lang === 'second'}" ${Object.keys(S.art).some(k => k.startsWith('tr_')) ? '' : 'disabled title="Traducerea apare după textul final"'}>${esc(langLabel(p.input.second_language))}</button></div>` : ''}
    <div class="bookbar"><div class="seg-ctl" role="group" aria-label="Mod de previzualizare"><button data-act="mode" data-m="story" aria-pressed="${mode === 'story'}">${esc(storyDef?.label || 'Poveste')}</button>${coloringDef ? `<button data-act="mode" data-m="coloring" aria-pressed="${mode === 'coloring'}">${esc(coloringDef.label)}</button><button data-act="mode" data-m="pair" aria-pressed="${mode === 'pair'}">Față în față</button>` : ''}</div>
    <div class="row"><span class="faint small">${missing ? `${missing} pagini fără imagine completă în acest volum` : 'Toate paginile volumului au imagine color și de colorat'}${bi.src(v)?.name === 'script' ? ', text din scenariu (încă nefinalizat)' : ''}</span>${missing && claudeOk() && canvaOk() ? `<button class="btn sm" data-act="fill-missing" data-v="${v}" ${busy ? 'disabled' : ''}>Generează paginile lipsă în Canva</button>` : ''}</div></div>
    <div class="pages ${mode === 'pair' ? 'pairs' : ''}">${cards}</div>`;
}
function editBox(p, v, pg) {
  const src = bookInfo(p).src(v); const page = (src?.c?.pages || [])[pg - 1] || {};
  const max = num(bookInfo(p).age.max_chars, 0) || null;
  return `<div class="edit-box"><textarea class="textarea" id="edit-text" aria-label="Textul paginii">${esc(page.text || '')}</textarea><div class="row" style="justify-content:space-between;margin-top:6px"><span class="faint tiny">Ghid orientativ: ~${max || '?'} caractere pentru vârsta aleasă. Salvarea creează o versiune nouă, fără AI.</span><div class="row"><button class="btn ghost sm" data-act="cancel-edit">Renunță</button><button class="btn sm primary" data-act="save-text" data-v="${v}" data-p="${pg}">Salvează textul</button></div></div></div>`;
}

/* ---------- export ---------- */
function tabExport(p) {
  const bp = S.bp; const bi = bookInfo(p);
  const presets = bp.export?.presets || [];
  if (!presets.find(x => x.key === S.preset)) S.preset = presets[0]?.key;
  const pf = S.preflight || [{ label: 'Verificare finală', status: 'fail', detail: 'Raportul serverului nu este încă disponibil.' }];
  const books = bp.structure.books || [];
  const rows = Array.from({ length: bp.structure.volumes }, (_, v) => {
    const src = bi.src(v);
    return `<div class="xrow"><div class="n">${v + 1}</div><div style="min-width:0"><h4>${esc(src?.c?.title || `Volumul ${v + 1}`)}</h4><div class="faint small">${src ? (src.name === 'final' ? 'text final' : 'text din scenariu, nefinalizat') : 'încă negenerat'}</div></div>
      <div class="row">${(() => { const ok = S.delivery?.volumes?.[v] === true; const dl = p.delivered?.[v]; return `${dl ? `<span class="badge b-ok">livrat ${ago(dl.at)}</span>` : ok ? '<span class="badge b-y">aprobat, gata de livrare</span>' : ''}${p.volumeFlow ? `<button class="btn sm ${ok ? 'primary' : ''}" data-act="deliver" data-v="${v}" ${ok && !S.exporting ? '' : 'disabled title="Disponibil după revizuirea finală a volumului"'}>${dl ? 'Livrează din nou' : `Livrează volumul ${v + 1}`}</button>` : ''}${dl && S.services?.gdrive?.connected ? `<button class="btn sm" data-act="gdrive-vol" data-v="${v}">Google Drive</button>` : ''}${p.driveLinks?.[v] ? `<a class="btn ghost sm" href="${extUrl(p.driveLinks[v])}" rel="noopener noreferrer" target="_blank" rel="noopener">Vezi în Drive</a>` : ''}`; })()}
      <details><summary class="small" style="cursor:pointer">PDF-uri separate</summary><div class="row" style="margin-top:6px">${bookRuns(p, bi, books).map(r => `<button class="btn sm" data-act="export" data-v="${v}" data-b="${esc(r.b.key)}" data-l="${r.lang}" ${src && !S.exporting ? '' : 'disabled'}>${esc(r.b.label)}${r.lang === 'first' && bi.bilingual && r.b.per_language ? ` (${esc(langLabel(p.input.language))})` : r.lang === 'second' ? ` (${esc(langLabel(p.input.second_language))})` : ''}</button>`).join('')}${books.some(b => b.mode === 'combined') ? `<button class="btn sm" data-act="coverwrap" data-v="${v}" ${src && !S.exporting ? '' : 'disabled'}>Copertă KDP</button>` : ''}</div></details></div></div>`;
  }).join('');
  return `${p.status !== 'completed' ? `<div class="notice warn" style="margin-bottom:16px">Proiectul nu a trecut încă de revizuirea finală. Poți exporta oricând pentru verificare, dar versiunea de vânzare e cea aprobată.</div>` : ''}
    <div class="panel panel-pad" style="margin-bottom:22px"><div class="row" style="justify-content:space-between"><div style="min-width:0;flex:1 1 280px"><h3 style="font-size:17px">Fișiere finale</h3><p class="small muted" style="margin-top:4px">Toate PDF-urile (poveste și colorat, pentru fiecare volum), imaginile la rezoluție mare, referințele personajelor și detaliile de publicare, într-un folder și o arhivă ZIP.${p.packagedAt ? ` Ultimul pachet: ${clock(p.packagedAt)}.` : ''}</p>${S.services?.output ? `<p class="tiny faint" style="margin-top:4px;overflow-wrap:anywhere">${esc(S.services.output)}</p>` : ''}</div>
      <div class="row">${S.services?.gdrive?.connected && p.packagedAt ? `<button class="btn" data-act="gdrive-upload">Trimite în Google Drive</button>` : ''}${p.driveLink ? `<a class="btn ghost" href="${extUrl(p.driveLink)}" rel="noopener noreferrer" target="_blank" rel="noopener">Vezi în Drive</a>` : ''}${S.lan?.remote ? '' : '<button class="btn" data-act="open-folder">Deschide folderul</button>'}<button class="btn primary" data-act="package" ${S.exporting ? 'disabled' : ''}>Generează pachetul final</button></div></div></div>
    <div class="section" style="margin-top:0"><h2>Destinație</h2><div class="presets" role="radiogroup">${presets.map(x => `<label class="choice"><input type="radio" name="preset" value="${esc(x.key)}" data-act-change="preset" ${S.preset === x.key ? 'checked' : ''}><b>${esc(x.label)}</b><span>${esc(x.detail || '')}</span></label>`).join('')}</div></div>
    <div class="section"><h2>Volume</h2>${p.rendering && !p.rendering.finished ? `<div class="notice m" style="margin-bottom:10px">Livrare pe laptop: ${esc(p.rendering.label)}${p.rendering.n ? `, pagina ${p.rendering.i} din ${p.rendering.n}` : ''}</div>` : p.rendering?.finished && Date.now() - (p.rendering.at || 0) < 10 * 60e3 ? `<div class="notice ${p.rendering.ok ? '' : 'err'}" style="margin-bottom:10px;${p.rendering.ok ? 'background:var(--ok-soft)' : ''}">${esc(p.rendering.message || '')}</div>` : ''}<div class="panel">${rows}</div><div id="xprog" class="small muted" style="margin-top:10px" aria-live="polite"></div></div>
    ${canvaCoverHTML(p)}
    <div class="section"><h2>Verificare finală</h2><div class="panel panel-pad"><ul class="checks" style="margin:0">${pf.map(x => `<li><span class="st ${cls(x.status)}"></span><div><b>${esc(x.label)}</b><div class="small muted">${esc(x.detail)}</div></div></li>`).join('')}</ul></div></div>`;
}

/* v19 (plan 2.7–2.10): cover and title page from YOUR Canva brand template (autofill, Canva Pro); optional */
function canvaCoverHTML(p) {
  if (S.lan?.remote) return '';
  const cb = p.options?.canva_brand || {}; const C = S.canvaBrand || {}; const connected = S.services?.canva?.connected;
  const vols = Array.from({ length: S.bp.structure.volumes }, (_, v) => v).filter(v => S.delivery?.volumes?.[v] === true);
  const kitSel = C.kits ? `<label class="small">Kit de brand <select class="select" id="cv-kit" style="width:auto;display:inline-block"><option value="">oricare</option>${C.kits.map(k => `<option value="${esc(k.id)}" ${cb.brandKitId === k.id ? 'selected' : ''}>${esc(k.name)}</option>`).join('')}</select></label>` : '';
  const tplSel = C.templates ? `<label class="small">Șablon de copertă <select class="select" id="cv-tpl" style="width:auto;display:inline-block"><option value="">alege</option>${C.templates.map(t => `<option value="${esc(t.id)}" ${cb.templateId === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label>` : '';
  const volRows = vols.map(v => { const c = S.art[`canva_${v}`]?.content; const busy = S.cvBusy === v;
    return `<div class="xrow"><div class="n">${v + 1}</div><div style="min-width:0"><h4>${esc(S.art[`final_${v}`]?.content?.title || 'Volumul ' + (v + 1))}</h4>${c ? `<div class="small muted">Completat: ${esc((c.filled || []).join(', '))}${(c.skipped || []).length ? `; rămase ca în șablon: ${esc(c.skipped.join(', '))}` : ''}</div>${c.blocked ? `<div class="notice warn small" style="margin-top:6px">În Canva sunt comentarii nerezolvate: ${esc((c.comments || []).filter(x => x.resolved === false).map(x => x.text).join(' · '))}</div>` : ''}${(c.promo || []).length ? `<div class="small" style="margin-top:4px">Promovare: ${c.promo.map(x => `<a href="${fileUrl(x.file)}" download>${esc(x.label)}</a>`).join(' · ')}</div>` : ''}` : '<div class="faint small">încă fără copertă din șablon</div>'}</div>
      <div class="row">${c?.link ? `<a class="btn sm ghost" href="${extUrl(c.link)}" target="_blank" rel="noopener noreferrer">Deschide în Canva</a>` : ''}${c?.pdf ? `<a class="btn sm" href="${fileUrl(c.pdf)}" download>PDF copertă</a>` : ''}
      ${c ? `<button class="btn sm" data-act="cv-export" data-v="${v}" ${busy ? 'disabled' : ''}>${c.blocked ? 'Exportă oricum' : 'Exportă din nou'}</button><button class="btn sm" data-act="cv-promo" data-v="${v}" ${busy ? 'disabled' : ''}>Formate de promovare</button>` : ''}
      <button class="btn sm ${c ? '' : 'primary'}" data-act="cv-cover" data-v="${v}" ${cb.templateId && !busy ? '' : 'disabled title="Alege întâi un șablon"'}>${busy ? 'Lucrez în Canva…' : c ? 'Refă coperta' : 'Creează coperta'}</button></div></div>`; }).join('');
  return `<div class="section"><h2>Copertă din șablonul tău Canva <span class="faint small">(opțional)</span></h2><div class="panel panel-pad">
    <p class="small muted">Canva Pro completează șablonul tău de brand cu titlul, colecția, numărul volumului, textul de pe spate și coperta ilustrată, apoi exportă PDF-ul. Toate volumele ies la fel, fără generări de imagine în plus. Fișierele intră în pachetul de livrare, în folderul „Canva”.</p>
    ${!connected ? '<div class="notice warn small" style="margin-top:8px">Canva nu este conectat (Setări).</div>' : `<div class="row" style="margin-top:10px">${kitSel}${tplSel}${C.kits ? '<button class="btn sm" data-act="cv-save">Salvează alegerea</button>' : '<button class="btn sm" data-act="cv-load">Încarcă kiturile și șabloanele din Canva</button>'}</div>
    ${cb.templateName ? `<p class="small" style="margin-top:6px">Șablon ales: <b>${esc(cb.templateName)}</b>${cb.brandKitName ? `, kit ${esc(cb.brandKitName)}` : ''}.</p>` : ''}
    <p class="tiny faint" style="margin-top:4px">În Canva, câmpurile șablonului trebuie marcate ca date (Bulk create). Denumiri recunoscute: titlu, colecție, volum, text spate, autor, și un câmp de imagine pentru copertă.</p>
    ${vols.length ? volRows : '<p class="small faint" style="margin-top:8px">Coperta se face după aprobarea finală a volumului.</p>'}`}</div></div>`;
}

/* ---------- activity ---------- */
const DEC = { approved: 'Aprobat', approved_with_notes: 'Aprobat cu note', needs_correction: 'Corecții cerute', rejected: 'Respins' };
/* P3-T06: durable units with stop reasons and attempts, manual exchange packets, and the artifact inspector */
function unitsActivity(p) {
  const jobs = (S.jobs?.[p.id] || []).filter(j => j.meta?.run === (p.run || 1)).slice().reverse();
  const row = j => { const a = (j.attempts || [])[j.attempts.length - 1]; return `<li><time>${clock(j.committedAt || j.updatedAt)}</time><div><b>${esc(j.label || j.key)}</b> <span class="chip">${esc(UNIT_ST[j.status] || j.status)}</span>${j.meta?.reusedFromRun != null ? ' <span class="chip">refolosit</span>' : ''}${(j.result?.outputs || []).length ? `<div class="small muted">ieșiri: ${j.result.outputs.map(k => `<button class="linklike" data-act="inspect" data-key="${esc(k)}">${esc(k)} v${esc(j.result.versions?.[k] ?? '')}</button>`).join(', ')}</div>` : ''}${j.stopReason ? `<div class="small" style="color:var(--warn)">${esc(j.stopReason)}</div>` : ''}${a?.external?.length ? `<div class="small faint">${a.external.length} apel(uri) extern(e), încercarea ${esc(a.n)}</div>` : ''}${j.status === 'ambiguous' ? `<div class="row" style="margin-top:4px"><button class="btn sm" data-act="job-resolve" data-key="${esc(j.key)}" data-a="retry">Reia (posibil consum dublu)</button><button class="btn sm ghost" data-act="job-resolve" data-key="${esc(j.key)}" data-a="cancel">Anulează</button></div>` : ''}</div></li>`; };
  const packets = (S.packets?.[p.id] || []);
  const insp = S.inspect && S.inspect.pid === p.id ? inspectorHTML(S.inspect) : '';
  const keys = Object.keys(S.art || {}).sort();
  return `<div class="section"><h2>Unități de lucru</h2>${jobs.length ? `<div class="panel"><ul class="log" id="units-log">${jobs.slice(0, 80).map(row).join('')}</ul></div>` : `<div class="empty">Nicio unitate în rularea curentă.</div>`}</div>
    <div class="section"><h2>Inspector</h2><div class="panel panel-pad row"><select class="select" id="inspect-key" aria-label="Document de inspectat">${keys.map(k => `<option value="${esc(k)}" ${S.inspect?.key === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select><button class="btn sm" data-act="inspect">Inspectează</button></div>${insp}</div>
    ${collectionQAHTML(p)}${reconcileHTML(p)}
    <div class="section"><h2>Schimb manual</h2>${packets.length ? `<div class="panel"><ul class="log">${packets.map(k => `<li><time>${clock(k.issuedAt)}</time><div><b>${esc(k.outKey)}</b> <span class="chip">${esc(k.status === 'ingested' ? 'importat' : 'emis')}</span> <a class="small" href="/api/projects/${esc(p.id)}/packets/${esc(k.id)}/download">descarcă pachetul</a>${(k.attempts || []).filter(a => !a.ok).slice(-1).map(a => `<div class="small" style="color:var(--warn)">ultima respingere: ${esc(a.message)}</div>`).join('')}</div></li>`).join('')}</ul></div>` : `<div class="empty">Niciun pachet emis. Un pachet conține promptul, contextul agentului, schema și referințele, pentru rularea în aplicația oficială a unui furnizor; rezultatul trece prin aceleași validări și aprobarea rămâne a ta.</div>`}</div>`;
}
/* P5-T04: cross-artifact and collection QA — exact references and scopes; high issues block the release of what they touch */
function collectionQAHTML(p) {
  const q = S.collectionQA?.[p.id]; if (!q) return '';
  const SEVL = { high: ['mare (blochează livrarea)', 'var(--err)'], medium: ['medie', 'var(--warn)'], low: ['mică', 'var(--ink-3)'] };
  const row = i => `<li><span class="chip" style="color:${SEVL[i.severity]?.[1]}">${esc(SEVL[i.severity]?.[0] || i.severity)}</span> ${esc(i.message)}${(i.references || []).length ? `<div class="small faint">${i.references.slice(0, 3).map(r => `${esc(r.path)}: „${esc(String(r.quote || '').slice(0, 80))}”`).join(' · ')}</div>` : ''}</li>`;
  return `<div class="section" id="collection-qa" data-high="${esc(q.high)}" data-pass="${q.collectionPass}"><h2>Calitatea colecției</h2><p class="small muted">Colecția este atât de bună cât cel mai slab volum al ei: ${q.volumes.map(v => `V${v.volume} ${v.bookPass ? '✓' : v.written ? '✗' : '—'}`).join(' · ')}</p>${q.issues.length ? `<div class="panel"><ul class="log">${q.issues.slice(0, 40).map(row).join('')}</ul></div>` : '<div class="empty">Nicio problemă între artefacte.</div>'}</div>`;
}
/* P4-T05: selective reconciliation of a migrated project (dry-run report; each change is your decision) */
function reconcileHTML(p) {
  const r = S.reconcile?.[p.id]; if (!r) return '';
  const fact = f => `<li>${f.ok ? '✓' : '✗'} ${esc({ 'p1-pebble-absent': 'p1: pietricica nu apare încă', 'p2-first-reveal': 'p2: prima dezvăluire a pietricelei', 'p9-mouth-action': 'p9: Tia ține frunza cu botul' }[f.id] || f.id)} <span class="faint">(${esc(f.evidence)})</span></li>`;
  const conflict = c => c.id === 'DW01'
    ? `<div class="panel panel-pad" style="margin-top:8px"><b>${esc(c.title)}</b><ul class="small">${c.fields.map(f => `<li><code>${esc(f.path)}</code><div class="faint">acum: ${esc(f.current)}</div><div>propus: ${esc(f.proposed)}</div></li>`).join('')}</ul><label class="small">Decizia ta: <select class="select" id="rc-DW01"><option value="">— nicio schimbare —</option><option value="align_to_pages">aliniază premisa la paginile 8–9</option><option value="keep">păstrează premisa (revizuiesc paginile)</option></select></label></div>`
    : `<div class="panel panel-pad" style="margin-top:8px"><b>${esc(c.title)}</b><table class="tbl"><thead><tr><th>Pag.</th><th>Plan</th><th>Manuscris</th><th>Contractul intenționat</th></tr></thead><tbody>${c.pages.map(x => `<tr><td>${esc(x.n)}</td><td>${esc(x.plan)}</td><td>${esc(x.script)}</td><td><select class="select" data-rc-page="${esc(x.n)}"><option value="">—</option><option value="script">manuscrisul (${esc(x.script)})</option><option value="plan">planul (${esc(x.plan)})</option></select></td></tr>`).join('')}</tbody></table></div>`;
  return `<div class="section" id="reconcile" data-conflicts="${esc(r.conflicts.length)}"><h2>Reconciliere (proiect migrat)</h2><p class="small muted">Raport fără modificări. Nimic nu se rescrie în întregime și nimic nu se aprobă: aplici doar ce alegi, iar textul și referințele neatinse rămân identice.</p><ul class="small">${r.facts.map(fact).join('')}</ul>${r.conflicts.map(conflict).join('')}${r.conflicts.length ? `<button class="btn sm" data-act="reconcile-apply" data-hash="${esc(r.hash)}" style="margin-top:8px">Aplică alegerile mele</button>` : '<p class="small">Niciun conflict deschis.</p>'}</div>`;
}
function inspectorHTML(r) {
  if (r.error) return `<div class="panel panel-pad err-text">${esc(r.error)}</div>`;
  const pv = r.provenance, u = r.unit, cx = r.context;
  return `<div class="panel panel-pad" id="inspector" data-key="${esc(r.key)}" data-version="${esc(r.version)}" data-unit="${esc(u?.key || '')}"><h3 style="font-size:15px">${esc(r.key)} · versiunea ${esc(r.version)}</h3>
    <p class="small">Produs de: ${esc(pv?.channel === 'operator-exchange' ? 'schimb manual' : r.by || '—')}${pv?.agent ? `, agent ${esc(pv.agent)}` : ''}${pv?.model ? `, model ${esc(pv.model)}${pv.modelSource ? ` (${esc(pv.modelSource)})` : ''}` : ''}${pv?.prompt ? `, prompt ${esc(pv.prompt)}` : ''}</p>
    ${u ? `<p class="small">Unitate: <b>${esc(u.label || u.key)}</b> (rularea ${esc(u.run)}${u.reusedFromRun != null ? `, refolosită din rularea ${esc(u.reusedFromRun)}` : ''}), ${u.attempts.length} încercări: ${u.attempts.map(a => `${esc(a.outcome || '—')}${a.external.length ? ` / ${a.external.length} apel(uri) extern(e)` : ''}${a.stopReason ? ` (${esc(a.stopReason)})` : ''}`).join('; ')}</p>` : `<p class="small muted">${esc(r.note || '')}</p>`}
    ${cx ? `<p class="small muted">Context ${esc(cx.manifestHash.slice(0, 12))}: carta ${esc(cx.charterVersion || '—')}, rol ${esc(cx.roleVersion || '—')}, lecții ${cx.lessons.length ? esc(cx.lessons.join(', ')) : 'niciuna'}${cx.excludedLessons ? ` (${esc(cx.excludedLessons)} excluse)` : ''}</p>` : ''}
    ${r.usage.length ? `<p class="small muted">Consum: ${r.usage.map(x => `${esc(x.kind)} ${esc(x.model || '')} ${x.ok ? 'ok' : 'eșuat'} ${dur(x.ms)}${x.inTok != null ? ` ${esc(x.inTok)}/${esc(x.outTok)} tokeni` : ''}`).join('; ')}</p>` : ''}
    ${r.approvals.length ? `<p class="small">Aprobări: ${r.approvals.map(a => `v${esc(a.approvedVersion)}${a.current ? ' (versiunea curentă)' : ' (versiune anterioară)'}`).join(', ')}</p>` : '<p class="small muted">Neaprobat încă.</p>'}
    <p class="small faint">Versiuni: ${r.versions.map(v => `v${esc(v.version)} ${esc(v.by || '')}`).join(' · ')}</p></div>`;
}
function tabActivity(p) {
  const dec = (p.decisions || []).slice().reverse();
  const log = (p.log || []).slice().reverse();
  const cps = (p.checkpoints || []).slice().reverse();
  return `<div class="section" style="margin-top:0"><div class="row" style="justify-content:space-between"><h2>Puncte de salvare</h2><a class="btn sm" href="/api/projects/${esc(p.id)}/export.zip">Exportă proiectul (.zip)</a></div>${cps.length ? `<div class="panel"><ul class="log">${cps.map(c => `<li><time>${clock(c.at)}</time><div><b>${esc(c.label)}</b>${c.total ? `, ${c.done}/${c.total} elemente gata` : ''}<div class="muted small">${esc(c.reason)}; ${Object.keys(c.versions || {}).length} documente salvate cu versiunea lor</div></div></li>`).join('')}</ul></div>` : `<div class="empty small">Niciun punct de salvare încă. Se creează la fiecare pauză.</div>`}</div>
    <div class="section"><h2>Decizii de revizuire</h2>${dec.length ? `<div class="panel"><ul class="log">${dec.map(d => `<li><time>${clock(d.at)}</time><div><b>${esc(DEC[d.decision] || d.decision)}</b>, ${esc(S.bp.gates?.[d.gate]?.label || d.gate)}, runda ${esc(d.round)}${d.note ? `<div class="muted small" style="white-space:pre-wrap">${esc(d.note)}</div>` : ''}</div></li>`).join('')}</ul></div>` : `<div class="empty small">Nicio decizie încă.</div>`}</div>
    <div class="section"><h2>Jurnal</h2>${log.length ? `<div class="panel"><ul class="log">${log.map(l => `<li><time>${clock(l.t)}</time><div style="${l.kind === 'error' ? 'color:var(--err)' : l.kind === 'warn' ? 'color:var(--warn)' : ''}">${esc(l.text)}</div></li>`).join('')}</ul></div>` : `<div class="empty small">Jurnalul e gol.</div>`}</div>
    <div class="section"><h2>Proiect</h2><div class="panel panel-pad row" style="justify-content:space-between"><span class="small muted">Creat ${clock(p.createdAt)}. Tip de produs fixat la versiunea ${esc(p.typeVersion)}, ca modificările ulterioare ale tipului să nu afecteze acest proiect.</span><span class="row">${p.status === 'archived' ? `<button class="btn sm" data-act="unarchive">Scoate din arhivă</button>` : `<button class="btn sm" data-act="archive" ${p.running ? 'disabled' : ''}>Arhivează</button>`}<button class="btn sm danger" data-act="delete-project" ${S.lan?.remote || p.running || ['running', 'correcting'].includes(p.status) ? 'disabled title="Ștergerea se face de pe laptop, după ce pui proiectul pe pauză"' : ''}>Șterge definitiv…</button></span></div></div>${unitsActivity(p)}`;
}

/* ---------- product type studio ---------- */
const HANDLER_NAMES = () => S.handlers || [];
function validateBlueprint(bp) {
  const e = [];
  if (!bp || typeof bp !== 'object') return ['Documentul trebuie să fie un obiect JSON.'];
  if (!/^[a-z0-9-]{2,40}$/.test(bp.slug || '')) e.push('„slug” lipsește sau conține caractere nepermise (litere mici, cifre, cratimă).');
  if (!bp.name) e.push('„name” lipsește.');
  if (!Array.isArray(bp.input_schema?.fields) || !bp.input_schema.fields.length) e.push('„input_schema.fields” trebuie să conțină cel puțin un câmp.');
  (bp.input_schema?.fields || []).forEach((f, i) => { if (!f.key || !f.label || !['text', 'textarea', 'select', 'choice', 'languages', 'images'].includes(f.type)) e.push(`Câmpul ${i + 1}: are nevoie de key, label și un type valid (text, textarea, select, choice, languages, images).`); });   // audit M10
  if (!Array.isArray(bp.stages) || !bp.stages.length) e.push('„stages” trebuie să conțină cel puțin o etapă.');
  const keys = new Set();
  (bp.stages || []).forEach((s, i) => {
    if (!s.key) e.push(`Etapa ${i + 1}: lipsește „key”.`); if (keys.has(s.key)) e.push(`Etapa „${s.key}” apare de două ori.`); keys.add(s.key);
    if (!HANDLER_NAMES().includes(s.handler)) e.push(`Etapa „${s.key}”: handler necunoscut „${s.handler}”. Disponibile: ${HANDLER_NAMES().join(', ')}.`);
    for (const pk of ['prompt', 'critic_prompt', 'revise_prompt']) if (s[pk] && !bp.prompts?.[s[pk]]) e.push(`Etapa „${s.key}”: promptul „${s[pk]}” nu există în „prompts”.`);
    if (s.handler === 'review_gate' && !bp.gates?.[s.gate]) e.push(`Etapa „${s.key}”: poarta „${s.gate}” nu e definită în „gates”.`);
  });
  if (!bp.prompts?.correct) e.push('Lipsește promptul „correct”, folosit la „Cere corecții”.');
  return e;
}
function viewStudio() {
  const r = S.route;
  if (!r.slug) {
    return `<div class="page-head"><div><h1>Tipuri de produs</h1><p>Fiecare tip e un blueprint: formular, structură, etape, prompturi, reguli de calitate și export. Motorul le execută pe toate la fel.</p></div></div>
      ${S.types.length ? `<div class="tlist">${S.types.map(t => `<a class="pcard" href="#/studio/${esc(t.slug)}"><div class="icon">${esc(t.icon || '📦')}</div><div style="min-width:0"><h3>${esc(t.full_name || t.name)}</h3><div class="meta">${(t.stages || []).length} etape, ${(t.input_schema?.fields || []).length} câmpuri, actualizat ${ago(t.updatedAt) || 'la publicare'}</div></div><div class="row">${t.status === 'draft' ? '<span class="badge">ciornă</span>' : '<span class="badge b-ok">publicat</span>'}<span class="chip">v${esc(t.version)}</span></div></a>`).join('')}</div>` : `<div class="empty">${S.typesLoaded ? 'Niciun tip de produs.' : 'Se încarcă…'}</div>`}
      <div class="notice" style="margin-top:18px">Pentru un produs nou, deschide un tip existent și folosește „Duplică ca tip nou”, apoi schimbă câmpurile, etapele și prompturile. Handlere disponibile în motor: ${HANDLER_NAMES().join(', ')}.</div>`;
  }
  const t = typeBySlug(r.slug);
  if (!t) return `<div class="faint">Se încarcă…</div>`;
  if (!S.studio.text) { const copy = clone(t); delete copy.updatedAt; delete copy.updatedBy; S.studio.text = JSON.stringify(copy, null, 2); }
  const errs = S.studio.errors;
  return `<a class="back" href="#/studio">Tipuri de produs</a><div class="page-head"><div><h1>${esc(t.full_name || t.name)}</h1><p>Versiunea publicată: ${esc(t.version)}. Proiectele existente rămân pe versiunea cu care au pornit.</p></div>
    <div class="row"><button class="btn" data-act="studio-validate">Validează</button><button class="btn" data-act="studio-dup">Duplică ca tip nou</button><button class="btn primary" data-act="studio-save">Publică versiunea ${Number(t.version || 0) + 1}</button></div></div>
    ${errs ? (errs.length ? `<div class="notice err" style="margin-bottom:12px"><b>${errs.length} probleme:</b><ul style="margin:6px 0 0;padding-left:18px">${errs.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : `<div class="notice" style="margin-bottom:12px;background:var(--ok-soft)">Blueprint valid.</div>`) : ''}
    <textarea class="code" id="studio-json" spellcheck="false" aria-label="Blueprint JSON">${esc(S.studio.text)}</textarea>`;
}

/* ---------- settings ---------- */
function setupNotice() {
  const sv = S.services; if (!sv) return '';
  const miss = []; if (!sv.claude?.configured || sv.claude?.auth?.ok === false) miss.push('autentificarea Claude'); if (!sv.canva?.connected) miss.push('contul Canva');
  return miss.length ? `<div class="banner" style="margin:0 0 22px"><span>Mai lipsește ${miss.join(' și ')}.</span><a class="btn sm primary" href="#/settings">Deschide setările</a></div>` : '';
}
/* audit M7: database backups with a tested restore (laptop only) */
function backupsRow(row) {
  const B = S.backups; if (!B) { api('GET', '/backups').then(d => { S.backups = d; render(); }).catch(() => { S.backups = { items: [], error: true }; }); return row('Copii de siguranță ale bazei', null, ['Se încarcă…']); }

  const list = (B.items || []).slice(0, 8).map(b => `<li class="row" style="justify-content:space-between"><span><code>${esc(b.file)}</code> <span class="tiny faint">${esc(formatBytes(b.bytes))}, ${esc(new Date(b.at).toLocaleString('ro-RO'))}</span>${b.error ? `<div class="small err-text">${esc(b.error)}</div>` : ''}</span><button class="btn sm" data-act="backup-restore" data-file="${esc(b.file)}" ${b.error ? 'disabled' : ''}>Restaurează</button></li>`).join('');
  return row('Copii de siguranță ale bazei', (B.items || []).length > 0, [`${(B.items || []).length ? `<ul class="stack small" style="margin:6px 0 0;padding:0;list-style:none">${list}</ul>` : 'Încă nicio copie. Prima se face automat la 5 minute după pornire.'}<div class="tiny faint" style="margin-top:6px">Restaurarea înlocuiește proiectele cu starea din copia aleasă; înainte se face automat o copie a stării de acum. Copiile v03 restaurează împreună documentele și imaginile, cu verificarea integrității. Copiile SQL vechi păstrează comportamentul anterior.</div>`, '<button class="btn sm" data-act="backup-now">Fă o copie acum</button>']);
}
function viewSettings() {
  const sv = S.services || {}; const q = new URLSearchParams((location.hash.split('?')[1]) || '');
  const res = q.get('canva');
  const row = (title, ok, body) => `<div class="xrow settings-row"><span class="st ${ok === null ? '' : ok ? 'pass' : 'fail'}" style="width:12px;height:12px;border-radius:50%"></span><div style="min-width:0"><h2 class="row-h">${title}</h2><div class="small muted">${body[0]}</div></div><div class="row">${body[1] || ''}</div></div>`;
  const L = S.lan || {}; const remote = !!L.remote;
  const lanRow = row('Acces de pe telefon, tabletă sau alt PC', L.enabled ? true : null, [remote ? 'Ești conectat din rețea. Pornirea, oprirea și codul de acces se schimbă doar de pe laptop.'
    : `${L.enabled ? (() => { const A = L.addresses || []; const main = A.find(x => x.primary) || A.find(x => !x.virtual); const rest = A.filter(x => x !== main);
        return `Pornit. Pe telefon (același Wi-Fi) deschide: <b style="font-size:15px">${esc(main?.url || '(nu găsesc adresa rețelei Wi-Fi)')}</b>${main ? ` <span class="tiny faint">(${esc(main.name)})</span>` : ''}. ${L.devices ? `${L.devices} dispozitive conectate.` : ''}
        ${rest.length ? `<details style="margin-top:4px"><summary class="tiny faint" style="cursor:pointer">Alte adrese ale laptopului (${rest.length})</summary><div class="tiny faint" style="margin-top:4px">${rest.map(x => `${esc(x.url)}, ${esc(x.name)}${x.virtual ? ': adaptor virtual (VirtualBox, WSL, Docker…), nu merge de pe telefon' : ''}`).join('<br>')}<br>Alternativă pe iPhone/Mac: ${esc(L.localName || '')}</div></details>` : ''}`; })() : 'Oprit: aplicația se deschide doar pe acest laptop.'} Orice alt dispozitiv intră doar cu codul de acces.
      <div class="row" style="margin-top:8px"><label class="check small"><input type="checkbox" id="lan-on" ${L.enabled ? 'checked' : ''}> Permite accesul din rețeaua locală</label></div>
      <div class="row" style="margin-top:6px"><input class="input" id="lan-code" aria-label="Cod de acces pentru rețea" type="password" placeholder="${L.hasCode ? 'Cod nou (lasă gol ca să-l păstrezi)' : 'Cod de acces, minimum 6 caractere'}" style="max-width:280px" autocomplete="new-password"><button class="btn sm primary" data-act="lan-save">Salvează</button>${L.enabled ? '<button class="btn sm" data-act="lan-qr">Cod QR pentru telefon</button><button class="btn sm ghost" data-act="lan-logout">Deconectează toate dispozitivele</button>' : ''}</div>
      ${S.qr?.svg ? `<div class="row" style="margin-top:10px;align-items:center"><div style="width:180px;background:#fff;padding:6px;border-radius:8px">${S.qr.svg}</div><div class="small">Codul QR deschide<br><b>${esc(S.qr.url || '')}</b></div></div>` : S.qr ? `<p class="small" style="margin-top:8px">Adresa: <b>${esc(S.qr.url || '')}</b></p>` : ''}
      <p class="tiny faint" style="margin-top:6px">Prima dată, Windows poate întreba dacă permiți accesul în rețea: alege „Rețele private”. Pe telefon, din meniul browserului, „Adaugă pe ecranul principal” o deschide ca pe o aplicație.</p>`]);
  return `<div class="page-head"><div><h1>Setări</h1><p>${esc(S.edition || "WonderPages AI")}. Serviciile folosite de atelierul local.</p></div></div>
    <div class="mobile-only" style="margin-bottom:14px"><div class="row"><a class="btn" href="#/learning">Învățare</a><a class="btn" href="#/improvements">Îmbunătățiri</a><a class="btn" href="#/studio">Tipuri de produs</a></div></div>
    ${res ? `<div class="notice ${res === 'ok' ? '' : 'err'}" style="margin-bottom:14px;${res === 'ok' ? 'background:var(--ok-soft)' : ''}">${res === 'ok' ? 'Canva a fost conectat.' : 'Conectarea Canva nu a reușit: ' + esc(res)}</div>` : ''}
    <div class="panel">
      ${sv.claude?.provider === 'claude-code'
        ? row('Claude (text), cu abonamentul tău', sv.claude?.configured ? sv.claude?.auth?.ok : false, [!sv.claude?.configured ? 'Componenta Claude nu a fost găsită. Rulează din nou instalatorul.' : sv.claude?.auth?.ok === false ? 'Autentificarea Claude a expirat. Apasă „Autentifică”: se deschide fereastra oficială Claude; după ce te autentifici, apasă „Verifică”.' : `Funcționează cu abonamentul tău Pro (model ${esc(sv.claude.model)}).${sv.claude?.auth?.ok === true ? ' Verificat ' + ago(sv.claude.auth.at) + '.' : ' Autentificare încă necunoscută; apasă Verifică.'} Consumul intră în limitele planului.`,
          sv.claude?.configured ? '<button class="btn sm" data-act="claude-check">Verifică</button>' + (S.lan?.remote ? '' : '<button class="btn sm' + (sv.claude?.auth?.ok === false ? ' primary' : '') + '" data-act="claude-login">Autentifică</button>') : ''])
        : ''}
      ${row('Canva (imagini)', sv.canva?.connected, [sv.canva?.connected ? 'Conectat prin serverul MCP oficial Canva. Imaginile generate apar și în contul tău Canva.' : `Conectează-te cu contul tău Canva; se deschide pagina de autorizare Canva.${sv.canva?.error ? ' Ultima eroare: ' + esc(sv.canva.error) : ''}`,
        sv.canva?.connected ? '<button class="btn sm" data-act="canva-logout">Deconectează</button>' : (S.lan?.remote ? '<span class="small faint">se conectează de pe laptop</span>' : '<a class="btn sm primary" href="/api/canva/login">Conectează Canva</a>')])}
      ${(S.gdriveLocal?.found || []).length || sv.outputMirror ? '' : row('Google Drive (prin Google Cloud, avansat)', sv.gdrive?.connected || null, [sv.gdrive?.connected ? `Conectat. Folder ales: <b>${esc(sv.gdrive.folderName || 'WonderPages.AI (creat automat)')}</b>. Lipește linkul unui folder din Drive ca să-l schimbi.<div class="row" style="margin-top:8px"><input class="input" id="drive-folder" aria-label="Linkul folderului din Google Drive" placeholder="https://drive.google.com/drive/folders/..." style="max-width:460px"><button class="btn sm" data-act="save-drive-folder">Folosește acest folder</button></div>` : sv.gdrive?.configured ? 'Conectează-te cu contul Google (acces doar la fișierele create de aplicație).' : 'Opțional. Pentru activare: în <code>.env</code> completează <code>GOOGLE_CLIENT_ID</code> și <code>GOOGLE_CLIENT_SECRET</code> (vezi README), apoi repornește.', sv.gdrive?.configured && !sv.gdrive?.connected ? '<a class="btn sm primary" href="/api/gdrive/login">Conectează Google Drive</a>' : ''])}
      ${row('Consum Claude (abonamentul Pro)', (S.usage?.text5h ?? 0) < (S.usage?.budget5h ?? 90), [`Ultimele 5 ore: <b>${S.usage?.text5h ?? 0}</b> din bugetul de <b>${S.usage?.budget5h ?? 90}</b> apeluri; 24 de ore: ${S.usage?.text24h ?? 0}; imagini Canva azi: ${S.usage?.images24h ?? 0}. La buget atins, generarea face pauză și se reia singură; restul abonamentului rămâne liber pentru tine. Un singur proiect rulează odată.<div class="small" style="margin-top:6px">Ultimele 7 zile: <b>${S.usage?.text7d ?? 0}</b>${S.usage?.budget7d ? ` din bugetul săptămânal de <b>${S.usage.budget7d}</b>${S.usage.budget7dManual ? '' : ' (învățat din limita reală a abonamentului)'}` : ' apeluri; limita săptămânală a planului Pro nu e cunoscută încă (aplicația o învață singură prima dată când o atingi)'}.${S.usage?.weeklyObserved ? ` <span class="faint">Ultima limită săptămânală: la ${S.usage.weeklyObserved.calls} apeluri.</span>` : ''}</div>
        <div class="row" style="margin-top:8px"><label class="small">Buget pe 5 ore <input class="input" id="budget" type="number" min="10" max="1000" value="${S.usage?.budget5h ?? 90}" style="width:90px;display:inline-block"></label><label class="small">Buget pe 7 zile <input class="input" id="budget7" type="number" min="0" max="20000" value="${S.usage?.budget7d ?? 0}" style="width:100px;display:inline-block" aria-describedby="b7-hint"></label><button class="btn sm" data-act="save-budget">Salvează</button></div>
        <div class="tiny faint" id="b7-hint" style="margin-top:4px">0 = fără buget săptămânal (îl învață aplicația). Valorile reale le vezi în claude.ai: Setări > Usage. „Extra usage” trebuie să rămână oprit, ca să nu plătești nimic în plus.</div>`])}
      ${row('Consum GPT prin Codex CLI', S.text?.codex?.ready ?? null, [`Apeluri text din WonderPages: <b>${S.usage?.gptText5h ?? 0}</b> în ultimele 5 ore, <b>${S.usage?.gptText24h ?? 0}</b> în 24 de ore și <b>${S.usage?.gptText7d ?? 0}</b> în 7 zile. Imagini ChatGPT în 24 de ore: <b>${S.usage?.gptImages24h ?? 0}</b>. Limita reală a planului se vede în Codex; aplicația se oprește când Codex anunță limita. Nu cumpăra și nu activa credite suplimentare; la limita inclusă generarea se oprește.`, S.lan?.remote ? '' : '<button class="btn sm" data-act="gpt-text-test">Testează GPT-6-Sol</button>'])}
      ${row('Motor de imagini', true, [`Implicit pentru proiectele noi: <select class="select" id="img-engine" aria-label="Motorul de imagini implicit" style="width:auto;display:inline-block"><option value="canva" ${S.images?.engine !== 'chatgpt' ? 'selected' : ''}>Canva</option><option value="chatgpt" ${S.images?.engine === 'chatgpt' ? 'selected' : ''}>ChatGPT (GPT Image)</option></select> <label class="check small" style="display:inline-flex;margin-left:10px"><input type="checkbox" id="img-fallback" ${S.images?.fallback ? 'checked' : ''}> Când unul cere pauză, folosește-l pe celălalt</label> <button class="btn sm" data-act="save-images">Salvează</button>
        <div class="small" style="margin-top:8px"><b>ChatGPT (GPT Image):</b> ${!S.images?.chatgpt?.installed ? 'Componenta Codex inclusă lipsește. Reinstalează dependențele aplicației, apoi autentifică ChatGPT.' : S.images.chatgpt.auth === true ? `autentificat prin Codex (${esc(S.images.chatgpt.version || '')}). ${S.images.chatgpt.generationVerified === true ? 'Generare verificată în această sesiune.' : S.images.chatgpt.generationVerified === false ? 'Ultima generare a eșuat; vezi diagnosticul.' : 'Generarea nu a fost încă verificată în această sesiune.'} Limita inclusă se verifică înaintea fiecărui apel.` : S.images.chatgpt.auth === 'apikey' ? '<span style="color:var(--err)">Codex e autentificat cu o cheie API (cost separat). Autentifică-te cu contul ChatGPT.</span>' : 'Codex e instalat, dar nu e autentificat cu ChatGPT.'}</div>
        <div class="tiny faint" style="margin-top:4px">Recomandare: un singur motor pe proiect, ca stilul să rămână identic în toată cartea. Alternarea e utilă doar când graba contează mai mult decât uniformitatea.</div>`, `<button class="btn sm" data-act="gpt-check">Verifică</button>${S.lan?.remote ? '' : `<button class="btn sm" data-act="gpt-login">Autentifică ChatGPT</button>${S.images?.chatgpt?.ready ? '<button class="btn sm" data-act="gpt-test">Testează o imagine</button>' : ''}`}`])}
      ${row('Consum Canva (imagini)', !S.canva?.slow, [S.canva ? `Luna aceasta: <b>${S.canva.used}</b> generări din alocarea estimată de <b>${S.canva.allowance}</b>; se reînnoiește pe ${new Date(S.canva.resetsAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })}. ${S.canva.budgetReached ? '<b>Buget local atins:</b> generarea se oprește până la reluare în limita abonamentului.' : 'Soldul real este necunoscut; verifică instrumentul AI în cont. O singură imagine odată.'}${S.canva.pauseUntil ? ` Pauză cerută de Canva până la ${new Date(S.canva.pauseUntil).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}.` : ''}
        <div class="row" style="margin-top:8px"><label class="small">Alocare lunară <input class="input" id="cv-al" type="number" min="1" value="${S.canva.allowance}" style="width:80px;display:inline-block"></label><label class="small">Ziua reînnoirii <input class="input" id="cv-day" type="number" min="1" max="31" value="${S.canva.resetDay}" style="width:64px;display:inline-block"></label><label class="small">Pauză după alocare (min) <input class="input" id="cv-p" type="number" min="1" max="30" value="${S.canva.pauseMin}" style="width:64px;display:inline-block"></label><button class="btn sm" data-act="save-canva">Salvează</button></div>
        <div class="tiny faint" style="margin-top:4px">Valorile exacte le vezi în Canva: Setări > Facturare > Utilizare AI. Ziua reînnoirii e ziua ta de facturare.</div>` : ''])}
      ${row('Notificări', typeof Notification !== 'undefined' && Notification.permission === 'granted' ? true : null, [typeof Notification === 'undefined' ? 'Browserul nu suportă notificări.' : Notification.permission === 'granted' ? 'Primești o notificare când te așteaptă o revizuire sau când generarea se oprește.' : 'Primește o notificare când te așteaptă o revizuire.', typeof Notification !== 'undefined' && Notification.permission !== 'granted' ? '<button class="btn sm" data-act="notif">Activează</button>' : ''])}
      ${row('Diagnostic', true, [S.diag ? `<ul class="checks" style="margin:6px 0 0">${S.diag.map(c => `<li><span class="st ${c.ok ? 'pass' : 'fail'}"></span><div><b>${esc(c.name)}</b><div class="small muted">${esc(c.detail)}</div></div></li>`).join('')}</ul>` : 'Verifică dintr-un clic baza de date, Claude, Canva, folderul de livrare și consumul.', '<button class="btn sm" data-act="diag">Rulează diagnosticul</button>'])}
      ${lanRow}
      ${row('Fișiere finale', true, [`<b>Pe laptop</b> (copia principală): ${S.lan?.remote ? `<b>${esc(sv.output || '')}</b> (se schimbă de pe laptop)` : `<div class="row" style="margin-top:6px"><input class="input" id="out-dir" aria-label="Folderul fișierelor finale" value="${esc(sv.output || '')}" style="max-width:460px"><button class="btn sm" data-act="browse-output" data-target="out-dir">Răsfoiește…</button><button class="btn sm" data-act="save-output">Salvează</button></div>`}
        <div style="margin-top:12px"><b>Copie și în</b> (de exemplu Google Drive): ${sv.outputMirror ? `<b>${esc(sv.outputMirror)}</b>. Fiecare livrare se salvează pe laptop <i>și</i> aici.` : 'oprită. Livrările se salvează doar pe laptop.'}</div>
        ${S.lan?.remote ? '' : `<div class="row" style="margin-top:6px"><input class="input" id="mirror-dir" aria-label="Al doilea folder pentru livrări" value="${esc(sv.outputMirror || '')}" placeholder="${esc(S.gdriveLocal?.suggested || 'de exemplu G:\\My Drive\\WonderPages')}" style="max-width:460px"><button class="btn sm" data-act="browse-output" data-target="mirror-dir">Răsfoiește…</button><button class="btn sm" data-act="save-mirror">Salvează</button>${sv.outputMirror ? '<button class="btn ghost sm" data-act="stop-mirror">Oprește copia</button>' : ''}</div>
        ${S.gdriveLocal?.suggested && sv.outputMirror !== S.gdriveLocal.suggested ? `<div class="row" style="margin-top:6px"><button class="btn sm primary" data-act="use-gdrive-mirror">Copie în Google Drive: ${esc(S.gdriveLocal.suggested)}</button></div>` : ''}
        <div class="tiny faint" style="margin-top:4px">Google Drive pentru desktop apare ca un disc pe laptop; ce ajunge în folderul lui se sincronizează singur, fără nicio configurare Google Cloud.</div>`}`])}
      ${row('Stocare proiecte', true, [`${esc(sv.storage?.label || '')}: <code>${esc(sv.storage?.location || '')}</code>. Backup zilnic al bazei de date și fișierelor împreună, în repaus, în <code>_backup</code> din folderul de fișiere finale. Se păstrează 14 copii automate și copiile manuale; dacă ai configurat al doilea folder, backupul se copiază și acolo.`])}
      ${S.lan?.remote ? '' : backupsRow(row)}
    </div>`;
}

/* ---------- agents ---------- */
const agentName = id => (S.agentsData?.agents || []).find(a => a.id === id)?.name || ({ producator: 'Producător', 'director-creativ': 'Director creativ', 'arhitect-serie': 'Arhitectul seriei', 'pastrator-continuitate': 'Păstrătorul continuității', scriitor: 'Scriitor', 'editor-critic': 'Editor critic', corector: 'Corector', 'director-artistic': 'Director artistic' }[id] || id);
function viewAgents() {
  const d = S.agentsData; if (!d) return `<div class="boot">Se încarcă agenții…</div>`;
  const live = S.live || [];
  const cards = d.agents.map(a => {
    const L = d.lessons.filter(l => l.agent === a.id && l.status !== 'rejected').sort((x, y) => y.confidence - x.confidence);
    const act = live.filter(c => c.agent === a.id);
    const st = a.stats || {}; const avg = st.calls ? Math.round(st.ms / st.calls / 1000) : 0;
    return `<div class="panel panel-pad" style="margin-bottom:14px"><div class="row" style="justify-content:space-between;align-items:flex-start"><div style="min-width:0;flex:1 1 280px"><h3 style="font-size:17px">${esc(a.name)}</h3><p class="small muted" style="margin-top:2px">${esc(a.description || '')}</p></div>
      <div class="row small">${act.length ? `<span class="badge b-m">${act.length} ${act.length === 1 ? 'instanță activă' : 'instanțe active'}</span>` : '<span class="badge">în așteptare</span>'}<select class="select" data-act-change="agent-model" data-id="${esc(a.id)}" style="width:auto;padding:3px 8px;font-size:12.5px" aria-label="Modelul agentului ${esc(a.name)}"><option value="sonnet" ${!['haiku', 'gpt-6-sol'].includes(a.model) ? 'selected' : ''}>Claude Sonnet</option><option value="haiku" ${a.model === 'haiku' ? 'selected' : ''}>Claude Haiku</option><option value="gpt-6-sol" ${a.model === 'gpt-6-sol' ? 'selected' : ''}>GPT-6-Sol</option></select><span class="faint">${st.calls || 0} sarcini${avg ? `, ~${avg} s fiecare` : ''}${st.errors ? `, ${st.errors} erori` : ''}</span></div></div>
      ${act.length ? `<div class="live" style="margin-top:10px">${act.map(c => `<div class="call"><b><span class="thinking">${esc(c.label)}</span><span class="faint">${Math.round((Date.now() - c.since) / 1000)} s</span></b></div>`).join('')}</div>` : ''}
      <h4 style="font-size:14px;margin:14px 0 6px">Memorie: lecții învățate din deciziile tale (${L.length})</h4>
      ${L.length ? L.map(l => `<div class="row" style="padding:7px 0;border-top:1px solid var(--line);align-items:flex-start"><div style="flex:1 1 300px;min-width:0"><div>${esc(l.text)}</div><div class="tiny faint">${l.source === 'manual' ? 'scrisă de tine' : l.source === 'initial' ? 'din deciziile tale de până acum' : l.source === 'registru' ? `din registrul de lecții ${esc(l.ref || '')}` : 'învățată dintr-o revizuire'}, ${(l.scope || (l.age ? 'age' : 'global')) === 'project' ? `doar în proiectul „${esc((S.projects.find(p => p.id === l.pid) || {}).title || '?')}”` : (l.scope || (l.age ? 'age' : 'global')) === 'age' ? `pentru ${esc(l.age || '')} ani` : 'pentru toate proiectele'}${l.candidate ? ', <b style="color:var(--ok)">confirmată în mai multe proiecte</b>' : ''}${l.status !== 'active' ? ', oprită' : ''}</div><div style="height:4px;background:var(--sunken);border-radius:2px;margin-top:4px;max-width:220px"><div style="height:4px;width:${Math.round(l.confidence * 100)}%;background:${l.confidence >= 0.7 ? 'var(--ok)' : 'var(--y)'};border-radius:2px"></div></div></div>
        <div class="row">${l.status !== 'active' ? `<button class="btn sm" data-act="lesson" data-id="${esc(l.id)}" data-s="active">Pornește</button>` : ''}${(l.scope || 'global') === 'project' ? `<button class="btn sm" data-act="lesson-scope" data-id="${esc(l.id)}" data-scope="age" data-age="${esc((S.projects.find(p => p.id === l.pid) || {}).input?.target_age || l.age || '')}" title="Se aplică la toate proiectele cu această vârstă">Pentru toată vârsta</button><button class="btn sm" data-act="lesson-scope" data-id="${esc(l.id)}" data-scope="global" title="Se aplică la toate proiectele">Pentru tot</button>` : ''}<button class="btn ghost sm danger" data-act="lesson" data-id="${esc(l.id)}" data-s="rejected">Respinge</button></div></div>`).join('') : '<p class="small faint">Încă nimic. Lecțiile apar după primele tale corecții și editări.</p>'}
      <div class="row" style="margin-top:10px"><input class="input" id="rule-${esc(a.id)}" aria-label="Regulă nouă pentru ${esc(a.name)}" placeholder="Adaugă o regulă, de ex. „La 3–4 ani, puțină acțiune blândă pe fiecare volum”" style="flex:1 1 320px"><select class="select" id="rule-age-${esc(a.id)}" aria-label="Vârsta pentru regula nouă" style="width:auto"><option value="">toate vârstele</option>${Object.entries(S.agentsAges || { '3-4': '3–4 ani', '5-6': '5–6 ani', '7-8': '7–8 ani' }).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select><button class="btn sm" data-act="add-rule" data-id="${esc(a.id)}">Adaugă</button></div>
      <details style="margin-top:12px"><summary class="small" style="cursor:pointer">Instrucțiunile agentului</summary><textarea class="textarea" id="persona-${esc(a.id)}" aria-label="Descrierea agentului ${esc(a.name)}" style="margin-top:8px;font-size:13.5px">${esc(a.persona)}</textarea><div class="row" style="margin-top:6px"><button class="btn sm" data-act="save-persona" data-id="${esc(a.id)}">Salvează</button><span class="tiny faint">Gol = revine la instrucțiunile inițiale.</span></div></details></div>`;
  }).join('');
  return `<div class="page-head"><div><h1>Agenți</h1><p>Echipa permanentă. Fiecare agent poate folosi Claude sau GPT-6-Sol. Alegerea se aplică sarcinilor viitoare ale agentului.</p></div></div>
    <div class="notice ${S.text?.codex?.ready ? 'ok' : 'warn'} small" style="margin-bottom:14px">Codex CLI pentru text: ${S.text?.codex?.ready ? 'autentificat cu ChatGPT, componenta pentru text' : 'disponibilitate sau autentificare neconfirmată pentru componenta de text'}. Apelurile GPT folosesc limita Codex a contului ChatGPT; limita Claude se urmărește separat. Nu există trecere automată între furnizori.</div>${cards}`;
}
/* ---------- learning ---------- */
/* v19: ledger (2.6), lessons to review (3.1), automatic failures (3.9), evolution (3.10), export for the claude.ai Project (3.4) */
function learningV19HTML(d, g) {
  const pct = x => (x == null ? '–' : x + '%'); const kpi = (v, l) => `<div><b>${v}</b><span>${l}</span></div>`;
  const ledger = g ? `<div class="panel panel-pad" style="margin-bottom:16px"><div class="row" style="justify-content:space-between"><h2 style="font-size:16px">Consum și calitate, ultimele ${g.days} zile</h2><a class="btn sm" href="/api/ledger.csv" download>Descarcă registrul (CSV)</a></div>
      <div class="estimate" style="margin-top:10px">${kpi(g.textCalls, 'apeluri text')}${kpi(g.imageCalls, 'imagini generate')}${kpi(g.redraws, 'redesenări')}${kpi(g.critic.avgScore ?? '–', 'nota medie a editorului')}${kpi(g.critic.avgRounds ?? '–', 'revizii pe volum')}${kpi(pct(g.cacheShare), 'text refolosit din cache')}</div>
      <p class="small muted" style="margin-top:8px">Un volum a cerut în medie <b>${g.perVolume.text}</b> apeluri text (Claude și GPT) și <b>${g.perVolume.image}</b> imagini${g.perVolume.measured ? ` (din ${g.perVolume.samples} volume aprobate)` : ' (estimare inițială, până termini primul volum)'}. Răspunsuri validate de schemă: ${pct(g.schemaShare)}. Opriri la verificarea de structură (fără apel la editor): ${g.critic.lintStops}.</p>
      ${g.stages.length ? `<details style="margin-top:8px"><summary class="small" style="cursor:pointer">Pe etape și agenți</summary><table class="ledger-table" style="margin-top:8px"><thead><tr><th>Etapă</th><th>Agent</th><th>Model</th><th>Apeluri</th><th>KB trimiși (medie)</th><th>Secunde (medie)</th></tr></thead><tbody>${g.stages.slice(0, 20).map(x => `<tr><td>${esc(x.stage)}</td><td>${esc(agentName(x.agent))}</td><td>${esc(x.model)}</td><td>${x.calls}</td><td>${x.avgKB}</td><td>${x.avgSec}</td></tr>`).join('')}</tbody></table></details>` : ''}
      ${(g.evolution || []).length ? `<details style="margin-top:8px"><summary class="small" style="cursor:pointer">Evoluție pe versiuni și luni</summary><table class="ledger-table" style="margin-top:8px"><thead><tr><th>Lună</th><th>Blueprint</th><th>Volume aprobate</th><th>Aprobat din prima</th><th>Nota medie</th><th>Criterii mai slabe</th><th>Redesenări</th></tr></thead><tbody>${g.evolution.map(e => `<tr><td>${esc(e.month)}</td><td>v${esc(e.bp ?? '–')}</td><td>${e.volumes}</td><td>${pct(e.firstPass)}</td><td>${e.avgScore ?? '–'}</td><td>${e.weakest.map(w => `<span title="${esc(codeLabel(w[0]))}">${esc(w[0])} ${w[1]}</span>`).join(', ')}</td><td>${e.redraws}</td></tr>`).join('')}</tbody></table></details>` : ''}</div>` : '';
  const review = (d.review || []).length ? `<div class="panel panel-pad" style="margin-bottom:16px"><h2 style="font-size:16px">Lecții de revizuit (${d.review.length})</h2><p class="small muted" style="margin-top:4px">Au fost folosite de cel puțin 5 ori, dar nota editorului pe criteriul lor nu a crescut. Decizia e a ta.</p>${d.review.map(l => `<div class="row" style="padding:7px 0;border-top:1px solid var(--line)"><div style="flex:1 1 300px"><div>${esc(l.text)}</div><div class="tiny faint">${esc(agentName(l.agent))} · ${esc(l.code || '')} · efect ${l.effect > 0 ? '+' : ''}${esc(l.effect)} · folosită de ${l.uses} ori</div></div><button class="btn sm" data-act="lesson-keep" data-id="${esc(l.id)}">Păstrează</button><button class="btn sm" data-act="lesson" data-id="${esc(l.id)}" data-s="rejected">Scoate</button></div>`).join('')}</div>` : '';
  const measured = (d.measured || []).length ? `<details class="panel panel-pad" style="margin-bottom:16px"><summary style="cursor:pointer;font-weight:600">Lecții cu efect măsurat</summary>${d.measured.map(l => `<div class="small" style="padding:5px 0;border-top:1px solid var(--line)"><b style="color:${l.effect > 0 ? 'var(--ok-ink)' : 'var(--err-ink)'}">${l.effect > 0 ? '+' : ''}${esc(l.effect)}</b> ${esc(l.code || '')} · ${esc(l.text)} <span class="faint">(${esc(agentName(l.agent))}, ${l.n} volume)</span></div>`).join('')}</details>` : '';
  const fails = (d.autoFailures || []).length ? `<details class="panel panel-pad" style="margin-bottom:16px"><summary style="cursor:pointer;font-weight:600">Probleme de imagine învățate automat (${d.autoFailures.length})</summary><p class="small muted" style="margin-top:4px">Vin din verificarea vizuală și din imaginile trimise înapoi. Directorul artistic le verifică explicit la fiecare pagină.</p>${d.autoFailures.map(f => `<div class="small" style="padding:4px 0;border-top:1px solid var(--line)">${esc(f.text)} <span class="faint">(${f.count}×${f.code ? ', ' + esc(f.code) : ''})</span></div>`).join('')}</details>` : '';
  const exp = `<div class="panel panel-pad" style="margin-bottom:16px"><h2 style="font-size:16px">Proiectul „Studioul WonderPages” din claude.ai</h2><p class="small muted" style="margin-top:4px">O dată pe lună descarci cunoștințele (lecții, rubrică, registre de continuitate, raport, prompturi) și le încarci în baza de cunoștințe a Proiectului. Instrucțiunile Proiectului sunt în arhivă. Totul rămâne în abonamentul Pro.</p><div class="row" style="margin-top:8px"><a class="btn sm primary" href="/api/knowledge.zip" download>Exportă cunoștințele (.zip)</a></div></div>`;
  const props = (d.proposals || []).length ? `<div class="panel panel-pad" style="margin-bottom:16px"><h2 style="font-size:16px">Propuneri din retrospectivele volumelor (${d.proposals.length})</h2><p class="small muted" style="margin-top:4px">După aprobarea finală a unui volum, producătorul caută tiparele (aceeași problemă pe mai multe pagini) și propune lecții. Nimic nu se aplică fără tine.</p>${d.proposals.map(x => `<div class="row" style="padding:7px 0;border-top:1px solid var(--line)"><div style="flex:1 1 300px"><div>${esc(x.text)}</div><div class="tiny faint">${esc(agentName(x.agent))}${x.code ? ' · ' + esc(x.code) : ''} · volumul ${Number(x.vol) + 1}</div></div><button class="btn sm primary" data-act="proposal" data-id="${esc(x.id)}" data-a="1" data-scope="project">Acceptă pentru proiect</button>${x.age ? `<button class="btn sm" data-act="proposal" data-id="${esc(x.id)}" data-a="1" data-scope="age">Pentru ${esc(x.age)} ani</button>` : ''}<button class="btn sm ghost" data-act="proposal" data-id="${esc(x.id)}" data-a="0">Respinge</button></div>`).join('')}</div>` : '';
  const ST = d.settings || {}; const tp = (d.thresholdProposals || []);
  const setHTML = `<div class="panel panel-pad" style="margin-bottom:16px"><h2 style="font-size:16px">Cum lucrează echipa</h2>
    <label class="check" style="margin-top:8px"><input type="checkbox" data-act-change="lset" data-k="overlap" ${ST.overlap !== false ? 'checked' : ''}><span><b>Scrie volumul următor cât se desenează imaginile</b><br><span class="small muted">Scenariul și verificarea editorului pentru volumul N+1 se fac în timp ce Canva desenează volumul N. Dacă după aprobare se schimbă notele, lecțiile sau regulile, se refac normal. Aceleași apeluri, colecție terminată mai repede.</span></span></label>
    <label class="check" style="margin-top:8px"><input type="checkbox" data-act-change="lset" data-k="modelExperiments" ${ST.modelExperiments ? 'checked' : ''}><span><b>Testează modelul ușor (haiku) la șlefuirea textului</b><br><span class="small muted">Pe etapa „Text final”, haiku concurează cu sonnet; decide rata ta de aprobare fără corecturi. Haiku consumă mai puțin din limita Pro. Oprit, rămâne sonnet.</span></span></label>
    ${tp.length ? `<h3 style="font-size:14px;margin-top:14px">Pragul editorului critic</h3>${tp.map(x => `<div class="row small" style="padding:6px 0;border-top:1px solid var(--line)"><div style="flex:1 1 280px"><b>${esc(x.age)} ani</b>: prag actual ${esc(x.current)}${x.samples < 10 ? ` <span class="faint">(${x.samples} din 10 volume necesare pentru o propunere)</span>` : x.proposed != null ? `. Propunere: <b>${esc(x.proposed)}</b>, care se potrivește deciziilor tale în ${x.accuracy}% din cazuri (acum ${x.accuracyNow}%).` : ` <span class="faint">(se potrivește deja deciziilor tale: ${x.accuracyNow}%)</span>`}</div>${x.proposed != null ? `<button class="btn sm primary" data-act="thr-set" data-age="${esc(x.age)}" data-v="${esc(x.proposed)}">Aplică ${esc(x.proposed)}</button>` : ''}${(d.thresholds?.[x.age]?.critic) != null ? `<button class="btn sm ghost" data-act="thr-set" data-age="${esc(x.age)}" data-v="">Revino la 8</button>` : ''}</div>`).join('')}` : ''}</div>`;
  return ledger + props + review + setHTML + goldenHTML(S.goldenData) + measured + fails + exp;
}
/* v19 (plan 3.6): the golden set; 3 fixed subjects, text stages only, compared with a reference run */
function goldenHTML(G) {
  if (!G) return '';
  const base = G.runs.find(r => r.runId === G.baseline); const mean = a => { const x = a.filter(v => v != null); return x.length ? Math.round(x.reduce((p, c) => p + c, 0) / x.length * 10) / 10 : null; };
  const crit = r => { const acc = {}; for (const x of r.results || []) for (const [c, v] of Object.entries(x.criteria0 || {})) (acc[c] = acc[c] || []).push(v); return Object.fromEntries(Object.entries(acc).map(([c, v]) => [c, mean(v)])); };
  const bc = base ? crit(base) : {};
  const rows = G.runs.slice(0, 8).map(r => { const c = crit(r); const deltas = Object.entries(c).map(([k, v]) => [k, bc[k] != null ? Math.round((v - bc[k]) * 10) / 10 : null]).filter(x => x[1]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 4);
    return `<tr><td>${esc(new Date(r.at).toLocaleDateString('ro-RO'))}</td><td>${esc(r.variant)}</td><td>v${esc(r.bp)}</td><td>${esc({ running: 'rulează', done: 'gata', limit: 'oprit la limită', error: 'eroare' }[r.status] || r.status)}</td><td>${mean((r.results || []).map(x => x.score0)) ?? '–'}</td><td>${r.runId === G.baseline ? '<b>referința</b>' : deltas.map(([k, v]) => `<span style="color:${v > 0 ? 'var(--ok-ink)' : 'var(--err-ink)'}">${esc(k)} ${v > 0 ? '+' : ''}${v}</span>`).join(', ') || '–'}</td><td>${r.status === 'done' && r.runId !== G.baseline ? `<button class="btn sm ghost" data-act="golden-base" data-id="${esc(r.runId)}">Fă referință</button>` : ''}</td></tr>`; }).join('');
  return `<div class="panel panel-pad" style="margin-bottom:16px"><h2 style="font-size:16px">Setul de aur</h2><p class="small muted" style="margin-top:4px">Trei subiecte fixe (3–4, 5–6, 7–8 ani) trec prin etapele de text până la editor: circa 20 de apeluri Claude, zero imagini. Rulează-l după o schimbare de prompt, de cartă sau de versiune Claude Code, într-o zi fără producție, și compară notele pe criterii cu referința.</p>
    <div class="row" style="margin-top:8px"><label class="small">Variantă de scenariu <select class="select" id="golden-variant" style="width:auto;display:inline-block"><option value="">automat</option>${(G.variants || []).map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select></label><button class="btn sm primary" data-act="golden-run" ${G.running ? 'disabled' : ''}>${G.running ? `Rulează (${G.running.done}/3)…` : 'Rulează setul de aur'}</button></div>
    ${rows ? `<table class="ledger-table" style="margin-top:10px"><thead><tr><th>Data</th><th>Variantă</th><th>Blueprint</th><th>Stare</th><th>Nota medie</th><th>Față de referință</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : ''}</div>`;
}
function viewLearning() {
  const d = S.learningData; if (!d) return `<div class="boot">Se încarcă…</div>`;
  const pp = d.perProject.filter(x => x.firstPass != null);
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const early = avg(pp.slice(0, 5).map(x => x.firstPass)), late = avg(pp.slice(-5).map(x => x.firstPass));
  const bars = pp.map(x => `<div title="${esc(x.title)}: ${Math.round(x.firstPass * 100)}% aprobat din prima" style="flex:1 1 0;min-width:14px;display:flex;flex-direction:column;justify-content:flex-end;height:120px"><div style="height:${Math.max(4, x.firstPass * 120)}px;background:var(--k);border-radius:3px 3px 0 0"></div></div>`).join('');
  const m = d.model || {};
  const kpi = (v, l) => `<div><b>${v}</b><span>${l}</span></div>`;
  return `<div class="page-head"><div><h1>Învățare</h1><p>Cum se adaptează aplicația la deciziile tale. Modelul Claude nu se schimbă; sistemul din jurul lui învață.</p></div></div>
    ${learningV19HTML(d, S.ledgerData)}
    <div class="panel panel-pad"><div class="estimate">${kpi(pp.length, 'proiecte revizuite')}${kpi(late != null ? Math.round(late * 100) + '%' : '–', 'aprobat din prima (ultimele 5)')}${kpi(early != null && pp.length > 5 ? Math.round(early * 100) + '%' : '–', 'aprobat din prima (primele 5)')}${kpi(d.lessons.active, 'reguli active')}${kpi(d.examples, 'exemple aprobate')}</div>
      ${bars ? `<div style="display:flex;gap:4px;align-items:flex-end;margin-top:18px">${bars}</div><p class="tiny faint" style="margin-top:6px">Fiecare bară e un proiect, în ordine: cât s-a aprobat din prima la revizuire.</p>` : '<p class="small faint" style="margin-top:12px">Graficul apare după primele revizuiri.</p>'}</div>
    ${d.calibration ? `<div class="panel panel-pad" style="margin-top:16px"><h3 style="font-size:15px">Calibrarea pe vârste</h3><p class="small muted" style="margin-top:4px">O grupă de vârstă e „calibrată” abia după mai multe colecții diferite, și numai când decizi tu.</p><div class="row" style="margin-top:10px">${Object.entries(d.calibration).map(([age, c]) => `<div class="ap-it" style="flex:1 1 200px"><b>${esc(age)} ani</b><span class="small">${({ DEFINED: 'definită', IN_CALIBRATION: 'în calibrare', CALIBRATION_CANDIDATE: 'candidată la calibrare', CALIBRATED: 'calibrată' })[c.state]}</span><span class="tiny faint">${c.collections} colecții finalizate, ${c.themes} teme diferite</span>${c.state === 'CALIBRATION_CANDIDATE' ? `<button class="btn sm" data-act="calib" data-age="${age}" data-on="1">Marchează calibrată</button>` : c.state === 'CALIBRATED' ? `<button class="btn ghost sm" data-act="calib" data-age="${age}" data-on="0">Anulează</button>` : ''}</div>`).join('')}</div></div>` : ''}
    ${trainingHTML()}
    <div class="cols"><div class="panel panel-pad"><h3 style="font-size:15px">Modelul tău de preferințe</h3>
      ${m.accuracy != null ? `<p class="small" style="margin-top:6px">Antrenat pe <b>${m.samples}</b> volume evaluate de tine, precizie estimată <b>${Math.round(m.accuracy * 100)}%</b>. Actualizat ${ago(m.trainedAt)}.</p><p class="small muted" style="margin-top:6px">Ce contează cel mai mult pentru tine:</p><ul class="small">${(m.weights || []).slice().sort((a, b) => Math.abs(b.w) - Math.abs(a.w)).slice(0, 4).map(w => `<li>${esc(w.name)}: ${w.w > 0 ? 'mai mult e mai bine' : 'mai puțin e mai bine'}</li>`).join('')}</ul><p class="tiny faint">Volumele pe care modelul le crede respinse primesc o revizuire în plus înainte să ajungă la tine.</p>`
        : `<p class="small muted" style="margin-top:6px">Are nevoie de cel puțin 10 volume evaluate, și aprobate, și corectate (acum: ${m.samples || 0}).</p>`}</div>
    <div class="panel panel-pad"><h3 style="font-size:15px">Variante de prompt în competiție</h3>${d.bandit.length ? `<table class="cast" style="margin-top:8px"><thead><tr><th>Variantă</th><th>Aprobate</th><th>Corectate</th><th>Rată estimată</th></tr></thead><tbody>${d.bandit.map(b => `<tr><td>${esc(b.key.replace('#model', ' (model)').replace(':', ', '))}</td><td>${b.wins}</td><td>${b.losses}</td><td>${Math.round(b.rate * 100)}% <span class="tiny faint">${esc(b.status || '')}</span>${b.status === 'câștigătoare' ? ` <button class="btn sm ghost" data-act="bandit-reset" data-s="${esc(b.stage)}">Repornește competiția</button>` : ''}</td></tr>`).join('')}</tbody></table><p class="tiny faint" style="margin-top:6px">Varianta care îți place mai des e aleasă tot mai des.</p>` : '<p class="small muted" style="margin-top:6px">Datele apar după primele revizuiri.</p>'}</div></div>`;
}

/* ---------- headless delivery (runs in a hidden browser on the laptop) ---------- */
async function runHeadless(r) {
  S.renderJob = r.job; S.preset = new URLSearchParams(location.hash.split('?')[1] || '').get('preset') || 'digital';
  for (let i = 0; i < 200 && !(S.bp && Object.keys(S.art).length && curProject()); i++) await sleep(150);
  await sleep(300);
  try { if (r.vol === 'all') await packageAll(); else await deliverVolume(Number(r.vol)); }
  catch (e) { await api('POST', `/render/${r.job}/done`, { ok: false, message: String(e?.message || e) }).catch(() => {}); }
}
async function serverDeliver(v) {
  const p = curProject();
  try { await api('POST', `/projects/${p.id}/deliver?volume=${v}&preset=${encodeURIComponent(S.preset)}`); toast('Livrarea rulează pe laptop; poți urmări progresul aici.'); }
  catch (e) { if (e.code === 'no_browser' && !S.lan?.remote) { toast('Livrez din acest browser.'); deliverVolume(v); } else toast(e.message); }
}

