/* WonderPages.AI — Nucleul interfeței: utilitare, șabloane, API-ul serverului local, starea și navigarea.
   Scripturi clasice încărcate în ordine (core, views, ui, actions, pdf); împart același spațiu global. */
/* ============================================================
   WonderPages.AI: motor generic de generare condus de blueprint-uri
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* audit C2: values used as CSS classes, numbers and links are checked, not only escaped */
const cls = v => String(v ?? '').replace(/[^A-Za-z0-9_-]/g, '');                     // a class name / state token
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);              // a number from a blueprint or an artifact
const extUrl = u => (/^https:\/\/[^\s"'<>]+$/i.test(String(u || '')) ? esc(u) : '#');    // external links: https only
const uid = (p = '') => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-5);
const now = () => Date.now();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TAB = uid('tab-');
function ago(t) {
  if (!t) return '';
  const s = Math.round((now() - t) / 1000);
  if (s < 45) return 'acum câteva secunde';
  const m = Math.round(s / 60); if (m < 60) return `acum ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `acum ${h} h`;
  return new Date(t).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
}
function clock(t) { return t ? new Date(t).toLocaleString('ro-RO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''; }
function dur(ms) { if (!ms || ms < 0) return ''; const s = Math.round(ms / 1000); return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`; }
function formatBytes(bytes) { if (!Number.isFinite(bytes) || bytes < 0) return 'dimensiune necunoscută'; if (bytes < 1024) return `${bytes} B`; const units=['KB','MB','GB','TB'];let n=bytes/1024,i=0;while(n>=1024&&i<units.length-1){n/=1024;i++;}return `${n.toLocaleString('ro-RO',{maximumFractionDigits:1})} ${units[i]}`; }
function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }

/* ---------- template engine (blueprint prompts & labels) ---------- */
function getPath(obj, path) {
  if (!path) return obj;
  return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function tpl(str, ctx) {
  return String(str ?? '').replace(/\{\{\s*([^}|]+?)\s*(?:\|\s*([^}]+?))?\s*\}\}/g, (_, p, f) => {
    let v = getPath(ctx, p.trim());
    if (f) {
      const [fn, arg] = f.split(':').map(x => x.trim());
      if (fn === 'pluck') v = Array.isArray(v) ? v.map(x => getPath(x, arg)).filter(x => x != null && x !== '').join('; ') : '';
      else if (fn === 'join') v = Array.isArray(v) ? v.join(arg || ', ') : v;
      else if (fn === 'count') v = Array.isArray(v) ? v.length : 0;
    }
    if (v == null || v === '') return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  });
}
function globMatch(pattern, key) {
  if (!pattern.includes('*')) return pattern === key ? '' : null;
  const re = new RegExp('^' + pattern.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('(.+)') + '$');
  const m = key.match(re); return m ? (m[1] ?? '') : null;
}
function defFor(bp, key) {
  const defs = bp?.artifacts || {};
  if (defs[key]) return { ...defs[key], _key: key, _pattern: key };
  for (const [pat, d] of Object.entries(defs)) {
    const cap = globMatch(pat, key);
    if (cap != null) {
      const n = /^\d+$/.test(cap) ? Number(cap) + 1 : cap;
      return { ...d, label: tpl(d.label, { n, key }), _key: key, _pattern: pat, _n: n };
    }
  }
  return { label: key, view: 'generic', _key: key, _pattern: key };
}
function matchMap(map, key) { for (const [pat, v] of Object.entries(map || {})) if (globMatch(pat, key) != null) return v; return null; }

function pageLabel(v, p) { return `Vol. ${v + 1}, ${p === 0 ? 'copertă' : 'p. ' + p}`; }

/* ---------- local server API ---------- */
async function api(method, url, body, raw) {
  let r;
  try { r = await fetch('/api' + url, { method, cache: 'no-store', headers: raw ? { 'x-wp': '1' } : { 'content-type': 'application/json', 'x-wp': '1' }, body: raw ? body : body !== undefined ? JSON.stringify(body) : undefined }); }
  catch { throw { status: 0, message: 'Serverul local nu răspunde. Verifică dacă aplicația rulează pe laptop.' }; }
  const out = await r.json().catch(() => ({}));
  if (!r.ok) throw { status: r.status, message: out.message || r.statusText, code: out.code, active: out.active };
  return out;
}
/* audit C2: a file path from an artifact can only become a plain /files/… URL (no quote or script can get through) */
const fileUrl = rel => (/^(images|exports|uploads)\/[A-Za-z0-9._-]+$/.test(String(rel || '')) && /^[a-z0-9]+$/.test(String(S.cur || '')) ? `/files/${S.cur}/${rel}` : '');
const claudeOk = () => !!S.services?.claude?.configured;
const canvaOk = () => !!S.services?.canva?.connected;
const imagesOk = () => canvaOk() || !!S.images?.chatgpt?.ready;
const RT = {};

function legacyPreflight(bp, art, ctx) {
  const out = [];
  for (const c of bp.preflight || []) {
    const keys = Object.keys(art).filter(k => c.source ? globMatch(c.source, k) != null : false).sort();
    if (c.type === 'count') { const want = Number(getPath(ctx, c.equals)); const bad = keys.filter(k => (getPath(art[k].content, c.path) || []).length !== want); out.push({ label: c.label, status: !keys.length || bad.length ? 'fail' : 'pass', detail: !keys.length ? 'Nu există conținut final.' : bad.length ? 'Nepotriviri: ' + bad.join(', ') : `${keys.length} volume verificate, câte ${want} pagini.` }); }
    else if (c.type === 'max_len') { const max = Number(getPath(ctx, c.max)); const over = []; keys.forEach(k => (getPath(art[k].content, c.path) || []).forEach((pg, i) => { const L = String(pg?.[c.field] || '').length; if (L > max) over.push(`${defFor(bp, k).label.split(':')[0]}, p. ${i + 1} (${L}/${max})`); })); out.push({ label: c.label, status: over.length ? 'warn' : 'pass', detail: over.length ? 'Peste limită: ' + over.slice(0, 8).join('; ') : `Toate paginile sub ${max} caractere.` }); }
    else if (c.type === 'illustrations') { const St = bp.structure; let total = 0, col = 0, line = 0; for (let v = 0; v < St.volumes; v++) for (let p = 0; p <= St.pages; p++) { total++; const a = art[`ill_${v}_${p}`]; if (a?.content?.color) col++; if (a?.content?.lineart) line++; } out.push({ label: c.label, status: col === total && line === total ? 'pass' : 'warn', detail: `${col} din ${total} ilustrații color, ${line} din ${total} pagini de colorat.` }); }
  }
  out.push({ label: 'Profil de culoare', status: 'warn', detail: 'PDF-ul este RGB. Pentru tipografie, conversia CMYK (PDF/X) se face la tipografie sau cu Ghostscript.' });
  return out;
}
/* ============================================================
   STATE + DATA
   ============================================================ */
const S = {
  pz: {}, viewer: null, revMode: 'items', apFilter: 'all',
  booted: false, fatal: null, types: [], typesLoaded: false, projects: [], projLoaded: false,
  route: { name: 'dashboard' }, wiz: { slug: null, values: {}, step: 2, errors: {}, options: { sketches: true } },
  filter: 'all', q: '', cur: null, bp: null, art: {}, comments: [], sel: {}, composer: null, cmScope: 'artifact',
  viewVersion: {}, book: { v: 0, mode: 'story' }, editing: null, preset: 'digital', exporting: null, names: {},
  studio: { slug: null, text: '', errors: null }, services: null, handlers: [], live: [], offline: false
};
S.wiz.options = { images: true };
const SUBS = {};
function unsub(prefix) { for (const k of Object.keys(SUBS)) if (k.startsWith(prefix)) { try { SUBS[k](); } catch {} delete SUBS[k]; } }
const curProject = () => S.projects.find(p => p.id === S.cur) || null;
const typeBySlug = slug => S.types.find(t => t.slug === slug);

function notifyChanges(prev, next) {
  const waiting = next.filter(p => p.status === 'awaiting_review').length;
  setTitle(waiting);
  if (!prev.length || !('Notification' in window) || Notification.permission !== 'granted') return;
  for (const p of next) { const o = prev.find(x => x.id === p.id); if (o && o.status !== p.status && ['awaiting_review', 'failed', 'waiting_limit'].includes(p.status)) new Notification('WonderPages.AI', { body: p.status === 'awaiting_review' ? `${p.title}: te așteaptă o revizuire.` : p.status === 'failed' ? `${p.title}: generarea s-a oprit.` : `${p.title}: pauză pentru limita Claude.` }); }
}
async function loadState() {
  const st = await api('GET', '/state'); notifyChanges(S.projects || [], st.projects);
  S.types = st.types; S.projects = st.projects; S.text = st.text; S.edition = st.edition; S.services = st.services; S.handlers = st.handlers; S.usage = st.usage; S.lan = st.lan; S.canva = st.canva; S.active = st.active; S.images = st.images; S.improve = st.improve;
  S.typesLoaded = S.projLoaded = true; S.offline = false;
}
async function loadProject() {
  if (!S.cur) return;
  const pid = S.cur;
  try {
    const d = await api('GET', '/projects/' + pid);
    if (S.cur !== pid) return;
    S.bp = d.blueprint; S.art = d.artifacts; S.comments = d.comments; S.review = d.review; S.editorial = d.editorial; S.preflight = d.preflight; S.delivery = d.delivery;
    const i = S.projects.findIndex(p => p.id === pid); if (i >= 0) S.projects[i] = { ...S.projects[i], ...d.project }; else S.projects.push(d.project);
    /* P3-T06: progress from durable units; units and manual packets only where they are shown */
    const act = S.route.tab === 'activity', migrated = d.project?.source?.kind === 'migration';
    const book = S.route.tab === 'book', exp = S.route.tab === 'export';
    const [pr, jb, pk, pl, rc, cq, lo, pp] = await Promise.all([api('GET', `/projects/${pid}/progress`).catch(() => null), act ? api('GET', `/projects/${pid}/jobs`).catch(() => null) : null, act ? api('GET', `/projects/${pid}/packets`).catch(() => null) : null, api('GET', `/projects/${pid}/pilot`).catch(() => null), act && migrated ? api('GET', `/projects/${pid}/reconcile`).catch(() => null) : null, act ? api('GET', `/projects/${pid}/collection-qa`).catch(() => null) : null, book ? api('GET', `/projects/${pid}/layout?preset=digital`).catch(() => null) : null, exp ? api('GET', `/projects/${pid}/print-profiles`).catch(() => null) : null]);
    if (S.cur !== pid) return;
    (S.progress ||= {})[pid] = pr; if (jb) (S.jobs ||= {})[pid] = jb.jobs; if (pk) (S.packets ||= {})[pid] = pk.packets; (S.pilot ||= {})[pid] = pl; if (rc) (S.reconcile ||= {})[pid] = rc; if (cq) (S.collectionQA ||= {})[pid] = cq; if (lo) (S.layout ||= {})[pid] = lo; if (pp) (S.printProfiles ||= {})[pid] = pp;
    if (act) { const [cr, cl] = await Promise.all([api('GET', `/projects/${pid}/creative/readiness`).catch(() => null), api('GET', `/projects/${pid}/creative/proposals`).catch(() => null)]); if (S.cur === pid) { (S.creative ||= {})[pid] = { readiness: cr, proposals: cl?.proposals || [] }; const last = (cl?.proposals || []).slice(-1)[0], open = S.cuView?.pid === pid ? S.cuView.id : last?.id; if (open) { const v = await api('GET', `/projects/${pid}/creative/proposals/${open}`).catch(() => null); if (v && S.cur === pid) S.cuView = { pid, id: open, data: v }; } } }   // Creative Upgrade (proposal only)
    if (S.wb && S.wb.pid === pid && S.wb.data && !S.wb.impact) loadWorkbench();
  } catch (e) { if (e.status === 404) S.projects = S.projects.filter(p => p.id !== pid); }
}
const refetch = { t: null, proj: false, all: false, busy: false };
function scheduleRefetch(scope, pid) {
  if (scope === 'project' && pid === S.cur) refetch.proj = true; else refetch.all = true;
  if (refetch.t || refetch.busy) return;
  refetch.t = setTimeout(runRefetch, 150);
}
/* one refetch at a time, so an older response can never overwrite a newer one */
async function runRefetch() {
  refetch.t = null; refetch.busy = true;
  try {
    while (refetch.all || refetch.proj) {
      const a = refetch.all, pr = refetch.proj; refetch.all = refetch.proj = false;
      if (a) await loadState();
      if (pr || a) await loadProject();
      render();
    }
  } catch { S.offline = true; }
  refetch.busy = false; render();
}
setInterval(() => { if ((S.live || []).some(c => c.pid === S.cur)) paintLive(); }, 1000);
let extraT = null;
function loadExtra(name) { clearTimeout(extraT); extraT = setTimeout(async () => { try { if (name === 'agents') S.agentsData = await api('GET', '/agents'); else { const [l, g, gd] = await Promise.all([api('GET', '/learning'), api('GET', '/ledger').catch(() => null), api('GET', '/golden').catch(() => null)]); S.learningData = l; S.ledgerData = g; S.goldenData = gd; } render(); } catch {} }, 200); }
async function loadWorkbench() {
  const w = S.wb; if (!w) return;
  try { const d = await api('GET', `/projects/${w.pid}/workbench/${w.v + 1}/${w.p}`); if (S.wb === w) { w.data = d; render(); } }
  catch (e) { if (S.wb === w) { S.wb = null; toast(e.message, 'error'); render(); } }
}
/* P6-T01: the book font's own measurements, shared by the preview, the export and the server planner */
async function loadLayoutMetrics() {
  if (!window.WPLayout || WPLayout.ready()) return;
  try { const r = await fetch('/fonts/andika-metrics.json', { credentials: 'same-origin' }); if (r.ok) WPLayout.setMetrics(await r.json()); } catch {}
}
async function boot() {
  render();
  try { await loadState(); } catch { S.offline = true; }
  loadLayoutMetrics();
  S.booted = true;
  const es = new EventSource('/api/events');
  /* P3-T06: each change has a durable id; a replayed or repeated id is applied once; `reset` means the gap cannot be replayed exactly */
  const seen = id => { const n = Number(id); if (!Number.isInteger(n) || n <= 0) return false; if (n <= (S.lastEventId || 0)) return true; S.lastEventId = n; return false; };
  es.addEventListener('hello', e => { const h = JSON.parse(e.data).head; if (Number.isInteger(h) && h > (S.lastEventId || 0)) S.lastEventId = h; });
  es.addEventListener('reset', e => { S.lastEventId = JSON.parse(e.data).head || 0; S.progress = {}; scheduleRefetch('all'); });
  es.addEventListener('change', e => { if (seen(e.lastEventId)) return; const ev = JSON.parse(e.data); if (ev.pid && S.progress) delete S.progress[ev.pid]; if (ev.scope === 'improvements') { if (S.route.name === 'improvements') loadImprovements(); loadState().then(render).catch(() => {}); return; } if (ev.scope === 'agents' || ev.scope === 'learning') { if (ev.scope === 'learning') S.training = null; if (['agents', 'learning'].includes(S.route.name)) loadExtra(S.route.name); if (ev.scope === 'agents') return; } scheduleRefetch(ev.scope, ev.pid); });
  es.addEventListener('live', e => { S.live = JSON.parse(e.data); paintLive(); });
  es.onerror = () => { S.offline = true; paintNav(); };
  es.onopen = () => { if (S.offline) { S.offline = false; scheduleRefetch('all'); } };
  onRoute();
  if (parseRoute().name !== 'render') daliInit();
}

/* P4-T01: route registry — every project tab and alias leads to a real function (e.g. preview → the Book tab, where layout and languages are checked) */
const PROJECT_TABS = Object.freeze({ progress: 'Progres', review: 'Revizuire', book: 'Carte', export: 'Livrare', activity: 'Activitate' });
const TAB_ALIASES = Object.freeze({ preview: 'book', carte: 'book', macheta: 'book', livrare: 'export', activitate: 'activity', revizuire: 'review', progres: 'progress' });
const resolveTab = t => (PROJECT_TABS[t] ? t : TAB_ALIASES[t] || 'progress');
function parseRoute() {
  const parts = (location.hash || '#/').split('?')[0].replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!parts.length) return { name: 'dashboard' };
  if (parts[0] === 'projects') return { name: 'projects' };
  if (parts[0] === 'new') return { name: 'new', slug: parts[1] || null };
  if (parts[0] === 'p' && parts[1]) { const tab = resolveTab(parts[2] || 'progress'), vol = Number(parts[3]), page = Number(parts[4]); return { name: 'project', pid: parts[1], tab, ...(tab === 'book' && Number.isInteger(vol) && vol >= 1 && Number.isInteger(page) && page >= 0 ? { vol, page } : {}) }; }   // P6-T02: #/p/<id>/book/<volume>/<page> opens that page's workbench
  if (parts[0] === 'studio') return { name: 'studio', slug: parts[1] || null };
  if (parts[0].startsWith('settings')) return { name: 'settings' };
  if (parts[0] === 'agents') return { name: 'agents' };
  if (parts[0] === 'improvements') return { name: 'improvements' };
  if (parts[0] === 'render') return { name: 'render', pid: parts[1], vol: parts[2], job: parts[3] };
  if (parts[0] === 'learning') return { name: 'learning' };
  return { name: 'dashboard' };
}
function onRoute() {
  const r = parseRoute(); S.route = r;
  if (r.name === 'project' || r.name === 'render') openProject(r.pid); else closeProject();
  if (r.name === 'render') runHeadless(r);
  if (r.name === 'project' && r.vol) { S.book.v = r.vol - 1; S.book.picked = true; S.wb = { pid: r.pid, v: r.vol - 1, p: r.page, data: null, cmd: null, impact: null }; loadWorkbench(); } else if (S.wb && (r.name !== 'project' || r.tab !== 'book' || r.pid !== S.wb.pid)) S.wb = null;
  if (r.name === 'new' && r.slug && S.wiz.slug !== r.slug) initWizard(r.slug);
  if (r.name === 'new' && !r.slug) S.wiz.step = 2;
  if (r.name === 'agents' || r.name === 'learning') loadExtra(r.name);
  if (r.name === 'improvements') loadImprovements();
  if (r.name === 'settings' && !S.lan?.remote && !S.gdriveLocal) api('GET', '/fs/google-drive').then(d => { S.gdriveLocal = d; render(); }).catch(() => { S.gdriveLocal = { found: [] }; });
  if (r.name === 'studio' && r.slug !== S.studio.slug) { S.studio = { slug: r.slug, text: '', errors: null }; }
  window.scrollTo(0, 0);
  render(); setTitle();
  const main = document.getElementById('main'); if (main && document.activeElement && document.activeElement !== document.body && !document.activeElement.closest('#main')) main.focus({ preventScroll: true });
}
/* audit WCAG 2.4.2: every page has its own title (and the pending-review count stays in front) */
const ROUTE_TITLES = { dashboard: 'Panou', projects: 'Proiecte', new: 'Proiect nou', project: 'Proiect', settings: 'Setări', agents: 'Agenți', learning: 'Învățare', improvements: 'Îmbunătățiri', studio: 'Tipuri de produs', render: 'Livrare' };
function setTitle(waiting) {
  const r = S.route || {}; const p = r.name === 'project' ? (S.projects || []).find(x => x.id === r.pid) : null;
  const n = waiting ?? (S.projects || []).filter(x => x.status === 'awaiting_review').length;
  document.title = `${n ? `(${n}) ` : ''}${p?.title ? p.title + ' · ' : ''}${ROUTE_TITLES[r.name] || 'Panou'} · WonderPages.AI`;
}
window.addEventListener('hashchange', onRoute);

function openProject(pid) {
  if (S.cur === pid) return;
  S.cur = pid; S.bp = null; S.art = {}; S.comments = []; S.composer = null; S.editing = null; S.book = { v: 0, mode: 'story' };
  loadProject().then(render);
}
function closeProject() { S.cur = null; }
const nameOf = () => 'Tu';
function paintLive() {
  const box = $('#live'); if (!box) return;
  const calls = (S.live || []).filter(c => c.pid === S.cur);
  box.innerHTML = calls.length ? calls.map(c => `<div class="call"><b><span class="${c.chars ? '' : 'thinking'}">${c.agent ? `<span class="chip" style="margin-right:6px">${esc(agentName(c.agent))}</span>` : ''}${esc(c.label)}</span><span class="faint">${c.kind === 'image' ? 'Canva lucrează, ' + Math.round((Date.now() - c.since) / 1000) + ' s' : c.chars ? (c.chars / 1000).toFixed(1) + 'k caractere' : 'gândește'}</span></b>${c.tail ? `<div class="tail">${esc(c.tail)}</div>` : ''}</div>`).join('')
    : `<div class="faint small">Niciun apel AI activ acum.</div>`;
}

