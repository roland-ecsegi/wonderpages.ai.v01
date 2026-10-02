/**
 * Sistemul de învățare. Modelul Claude nu se schimbă; sistemul din jurul lui învață din deciziile tale:
 *  1. lecții extrase din corecții, cu scor de încredere (cresc la confirmare, scad la contrazicere)
 *  2. un model local de preferințe (regresie logistică) care estimează dacă vei aproba un volum
 *  3. variante de prompt care concurează (Thompson sampling) după rata ta de aprobare
 *  4. exemple aprobate, regăsite prin similaritate (TF-IDF) pentru proiectele noi
 *  5. metrici de progres în timp
 */
import { bus, now, uid } from './repo.js';
import * as Ledger from './ledger.js';

let storage, completeFn;
let LESSONS = [], MODEL = null, DATA = [], BANDIT = {}, EXAMPLES = [];
const save = (name, v) => storage.writeJSON(name, v);
export async function initLearning(s, complete) {
  storage = s; completeFn = complete;
  LESSONS = (await s.readJSON('lessons.json', [])) || [];
  const m = (await s.readJSON('preference-model.json', {})) || {}; DATA = m.data || []; MODEL = m.model || null;
  BANDIT = (await s.readJSON('bandit.json', {})) || {};
  for (const k of Object.keys(BANDIT)) { const m = k.match(/^(.+)@\d+:(.+)$/); if (!m) continue;   // v19: one competition per stage, pooled over volumes
    const to = `${m[1]}:${m[2]}`; const a = BANDIT[to] || { a: 1, b: 1 }; BANDIT[to] = { a: a.a + BANDIT[k].a - 1, b: a.b + BANDIT[k].b - 1 }; delete BANDIT[k]; }
  PROPOSALS = (await s.readJSON('proposals.json', [])) || [];
  LSET = (await s.readJSON('learning-settings.json', {})) || {};
  EXAMPLES = (await s.readJSON('examples.json', [])) || [];
}

/* ---------------- 1. lessons ---------------- */
export const listLessons = () => LESSONS;
/* governed learning (LL-032): a lesson applies only within its scope. New lessons start in their own project;
   only you can widen them to an age group or to everything. Nothing is promoted silently. */
const scopeOf = l => l.scope || (l.age ? 'age' : 'global');
/* v19 (plan 3.2): the lessons of one call are chosen for its stage, ranked by measured effect (3.1) and confidence,
   and capped by size (not by count), so a growing registry never bloats the prompt */
function eligible(agent, age, pid, { stage, prompt } = {}) {
  return LESSONS.filter(l => l.agent === agent && l.status === 'active' && (scopeOf(l) === 'global' || (scopeOf(l) === 'age' && l.age === age) || (scopeOf(l) === 'project' && l.pid && l.pid === pid))
    && (!l.stages?.length || (!stage && !prompt) || l.stages.includes(stage) || l.stages.includes(prompt)));
}
const rank = l => (l.source === 'manual' || l.source === 'initial' || l.source === 'registru' ? 0.3 : 0) + (l.confidence || 0) + (l.effect == null ? 0 : l.effect > 0 ? Math.min(0.3, l.effect / 2) : -0.2) - (l.needsReview ? 0.3 : 0);
export function lessonsFor(agent, age, pid = null, { stage, prompt, budget = 1400 } = {}) {
  const out = []; let used = 0;
  for (const l of eligible(agent, age, pid, { stage, prompt }).sort((a, b) => rank(b) - rank(a))) {
    const n = l.text.length + 3; if (out.length >= 12 || (out.length && used + n > budget)) continue;
    out.push(l); used += n;
  }
  return out;
}
let useT = null;
export function noteLessonUse(agent, age, pid, opts) {
  const list = lessonsFor(agent, age, pid, opts); if (!list.length) return [];
  for (const l of list) { l.uses = (l.uses || 0) + 1; l.lastUsed = now(); }
  clearTimeout(useT); useT = setTimeout(() => save('lessons.json', LESSONS), 3000); useT.unref?.();
  return list.map(l => l.id);
}
/* v19 (plan 3.1): the effect of a lesson = the average editor score on ITS criterion in volumes written with it,
   minus the average before it existed (same age). After 5 uses without a gain it is marked "to review" for you. */
export function refreshEffects() {
  const q = Ledger.rows(r => r.kind === 'quality' && r.criteria);
  let changed = false;
  for (const l of LESSONS) {
    if (!l.code) continue;
    const withL = q.filter(r => (r.lessons || []).includes(l.id) && r.criteria[l.code] != null);
    const before = q.filter(r => r.t < (l.createdAt || 0) && (!l.age || r.age === l.age) && r.criteria[l.code] != null && !(r.lessons || []).includes(l.id));
    if (withL.length < 3 || before.length < 3) continue;
    const m = a => a.reduce((x, r) => x + Number(r.criteria[l.code]), 0) / a.length;
    const eff = Math.round((m(withL) - m(before)) * 100) / 100; const review = withL.length >= 5 && eff <= 0 && l.status === 'active';
    if (l.effect !== eff || !!l.needsReview !== review) { l.effect = eff; l.effectN = withL.length; l.needsReview = review && !l.keptAt; changed = true; }
  }
  if (changed) { save('lessons.json', LESSONS); bus.emit('change', { scope: 'learning' }); }
}
export async function keepLesson(id) { const l = LESSONS.find(x => x.id === id); if (!l) throw { status: 404, message: 'Lecție inexistentă.' }; l.needsReview = false; l.keptAt = now(); await save('lessons.json', LESSONS); bus.emit('change', { scope: 'learning' }); return l; }
export async function setLessonScope(id, scope, age = null) {
  const l = LESSONS.find(x => x.id === id); if (!l) throw { status: 404, message: 'Lecție inexistentă.' };
  if (!['project', 'age', 'global'].includes(scope)) throw { status: 400, message: 'Domeniu invalid.' };
  l.scope = scope; if (scope === 'age') l.age = age || l.age; l.status = 'active'; l.promotedAt = now(); l.updatedAt = now();
  await save('lessons.json', LESSONS); bus.emit('change', { scope: 'learning' }); return l;
}
/* rules you write yourself (or the initial ones from seeds/lessons.json): active immediately, editable, deletable */
export async function addManualLesson({ agent, text, age = null, source = 'manual', scope, ref, provenance = null }) {
  if (!agent || !String(text || '').trim()) throw { status: 400, message: 'Alege agentul și scrie regula.' };
  const l = { id: uid('l'), agent, text: String(text).trim().slice(0, 500), age: age || null, scope: scope || (age ? 'age' : 'global'), ref: ref || null, confidence: 0.95, hits: 1, status: 'active', source, ...(provenance ? { provenance } : {}), createdAt: now(), updatedAt: now() };
  LESSONS.push(l); await save('lessons.json', LESSONS); bus.emit('change', { scope: 'learning' }); return l;
}
export async function persistLessons() { await save('lessons.json', LESSONS); bus.emit('change', { scope: 'learning' }); }
export async function seedLessons(list) { for (const x of list) if (!LESSONS.some(l => l.text === x.text)) await addManualLesson({ ...x, source: x.ref ? 'registru' : 'initial' }); }
export async function setLessonStatus(id, status) {
  const l = LESSONS.find(x => x.id === id); if (!l) throw { status: 404, message: 'Lecție inexistentă.' };
  l.status = status; if (status === 'active') l.confidence = Math.max(l.confidence, 0.8); l.updatedAt = now();
  await save('lessons.json', LESSONS); bus.emit('change', { scope: 'learning' }); return l;
}
const LESSON_PROMPT = (event, existing, agents, codes) => `You extract durable, reusable lessons for a children's book production team from ONE decision of the publisher (the client).
TEAM AGENTS (use these ids): ${agents}
RUBRIC CODES (give each new lesson the code of the criterion it improves, if any): ${codes || '-'}
EXISTING LESSONS (id, agent, text): ${JSON.stringify(existing)}
THE DECISION: ${JSON.stringify(event)}

Rules: a lesson is a short imperative rule in Romanian that will help future projects (not a fix for this one page only). Only extract what the decision really implies. If the decision confirms an existing lesson, list its id in "confirm"; if it contradicts one, list it in "contradict". Set "age_specific" true when the lesson clearly depends on the target age.
Reply with ONLY this JSON: {"new": [{"agent": "", "code": "", "text": "", "age_specific": false}], "confirm": [""], "contradict": [""]}`;
export async function learnFromEvent(event, { agents, age, pid = null, codes = '' }) {
  const existing = LESSONS.filter(l => l.status !== 'rejected').slice(-60).map(l => ({ id: l.id, agent: l.agent, code: l.code || undefined, text: l.text }));
  const out = await completeFn(LESSON_PROMPT(event, existing, agents.join(', '), codes), { json: true, agent: 'producator', task: 'Extrag lecții din decizia ta', meta: { stage: 'lectii', prompt: 'lessons', lessons: false } });
  for (const id of out?.confirm || []) { const l = LESSONS.find(x => x.id === id); if (l) { l.confidence = Math.min(0.97, l.confidence + 0.15); l.hits = (l.hits || 0) + 1; l.projects = [...new Set([...(l.projects || [l.pid].filter(Boolean)), pid].filter(Boolean))]; l.candidate = scopeOf(l) === 'project' && l.projects.length >= 2; l.updatedAt = now(); } }
  for (const id of out?.contradict || []) { const l = LESSONS.find(x => x.id === id); if (l) { l.confidence = Math.max(0, l.confidence - 0.25); l.updatedAt = now(); if (pid) l.negatives = [...(l.negatives || []).filter(n => n.pid !== pid), { pid, at: now() }].slice(-50); /* P7-T02: negative case kept as evidence */ if (l.confidence < 0.2 && l.status !== 'active') l.status = 'rejected'; } }
  for (const n of out?.new || []) {
    if (!n?.text || !agents.includes(n.agent)) continue;
    if (LESSONS.some(l => l.text.toLowerCase() === n.text.toLowerCase())) continue;
    LESSONS.push({ id: uid('l'), agent: n.agent, text: String(n.text).slice(0, 300), code: /^[TV]\d\d$/.test(n.code || '') ? n.code : null, age: n.age_specific ? age : null, scope: 'project', pid, projects: [pid].filter(Boolean), confidence: 0.5, hits: 1, status: 'active', source: event.kind, createdAt: now(), updatedAt: now() });
  }
  if (LESSONS.length > 500) {                                           // memory control: drop rejected, then the oldest unconfirmed project-scoped lessons
    LESSONS = LESSONS.filter(l => l.status !== 'rejected');
    while (LESSONS.length > 500) { const i = LESSONS.findIndex(l => (l.scope === 'project') && (l.hits || 1) <= 1); if (i < 0) break; LESSONS.splice(i, 1); }
  }
  await save('lessons.json', LESSONS); bus.emit('change', { scope: 'learning' });
}

/* ---------------- 2. local preference model ---------------- */
const words = t => String(t || '').toLowerCase().match(/[\p{L}']+/gu) || [];
export function featuresOf(content, meta, target) {
  const pages = content?.pages || []; const texts = pages.map(p => String(p.text || ''));
  const lens = texts.map(t => t.length); const avg = lens.reduce((a, b) => a + b, 0) / Math.max(1, lens.length);
  const sentences = texts.flatMap(t => t.split(/[.!?…]+/).filter(s => s.trim()));
  const w = texts.flatMap(words); const uniq = new Set(w).size;
  const dialog = texts.filter(t => /[„"«»—–-]\s?\p{Lu}/u.test(t)).length / Math.max(1, texts.length);
  const chars = pages.map(p => (p.characters || []).length); const avgChars = chars.reduce((a, b) => a + b, 0) / Math.max(1, chars.length);
  const spread = Math.sqrt(lens.reduce((a, l) => a + (l - avg) ** 2, 0) / Math.max(1, lens.length)) / Math.max(1, avg);
  return [avg / Math.max(1, target || avg || 1), w.length / Math.max(1, sentences.length) / 10, uniq / Math.max(1, w.length), dialog, avgChars / 3, spread, (Number(meta?.score) || 7) / 10];
}
export const FEATURE_NAMES = ['lungime față de ghid', 'cuvinte pe propoziție', 'varietatea vocabularului', 'pagini cu dialog', 'personaje pe pagină', 'variația lungimii', 'nota editorului'];
function trainLR(data) {
  const X = data.map(d => d.x), y = data.map(d => d.y), n = X.length, k = X[0].length;
  const mu = Array.from({ length: k }, (_, j) => X.reduce((a, r) => a + r[j], 0) / n);
  const sd = Array.from({ length: k }, (_, j) => Math.sqrt(X.reduce((a, r) => a + (r[j] - mu[j]) ** 2, 0) / n) || 1);
  const Z = X.map(r => r.map((v, j) => (v - mu[j]) / sd[j]));
  let w = new Array(k).fill(0), b = 0; const lr = 0.1, l2 = 0.05;
  for (let it = 0; it < 600; it++) {
    const gw = new Array(k).fill(0); let gb = 0;
    Z.forEach((r, i) => { const p = 1 / (1 + Math.exp(-(r.reduce((a, v, j) => a + v * w[j], b)))); const e = p - y[i]; r.forEach((v, j) => { gw[j] += e * v; }); gb += e; });
    w = w.map((wj, j) => wj - lr * (gw[j] / n + l2 * wj)); b -= lr * gb / n;
  }
  return { w, b, mu, sd };
}
const predictWith = (m, x) => 1 / (1 + Math.exp(-(x.reduce((a, v, j) => a + ((v - m.mu[j]) / m.sd[j]) * m.w[j], m.b))));
export function predictApproval(x) { return MODEL && MODEL.samples >= 10 ? predictWith(MODEL, x) : null; }
export async function addSamples(samples) {
  if (!samples.length) return;
  DATA.push(...samples.map(s => ({ ...s, at: now() }))); DATA = DATA.slice(-2000);
  const pos = DATA.filter(d => d.y === 1).length, neg = DATA.length - pos;
  if (DATA.length >= 10 && pos && neg) {
    const m = trainLR(DATA);
    let correct = 0; const folds = 4;                                   // k-fold estimate of accuracy
    for (let f = 0; f < folds; f++) {
      const test = DATA.filter((_, i) => i % folds === f), tr = DATA.filter((_, i) => i % folds !== f);
      if (!test.length || !tr.some(d => d.y) || !tr.some(d => !d.y)) { correct += test.length * 0.5; continue; }
      const mf = trainLR(tr); correct += test.filter(d => (predictWith(mf, d.x) >= 0.5) === (d.y === 1)).length;
    }
    MODEL = { ...m, samples: DATA.length, positives: pos, accuracy: correct / DATA.length, trainedAt: now() };
  }
  await save('preference-model.json', { data: DATA, model: MODEL }); bus.emit('change', { scope: 'learning' });
}

/* ---------------- 3. prompt variants (Thompson sampling) ---------------- */
function gamma(k) { if (k < 1) return gamma(1 + k) * Math.random() ** (1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { const u1 = Math.random(), u2 = Math.random(); x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); v = 1 + c * x; } while (v <= 0); v = v ** 3; const u = Math.random(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
const beta = (a, b) => { const x = gamma(a); return x / (x + gamma(b)); };
/* v19 (plan 3.7): a competition ends. After at least 20 decisions (10 per variant), the variant that is better with 95%
   probability and by at least 10 points becomes the default and the others retire; a NEW variant you add later competes
   against the winner. Decisions are stored as "<stage>:__decision". */
const DEC = st => `${st}:__decision`;
export function chooseVariant(stageKey, variants) {
  if (!variants?.length) return null;
  const d = BANDIT[DEC(stageKey)]; const live = variants.filter(v => !(d?.retired || []).includes(v));
  const pool = live.length ? live : variants;
  if (pool.length === 1) return pool[0];
  let best = null, bestV = -1;
  for (const v of pool) { const s = BANDIT[`${stageKey}:${v}`] || { a: 1, b: 1 }; const r = beta(s.a, s.b); if (r > bestV) { bestV = r; best = v; } }
  return best;
}
function settle(stageKey) {
  const arms = Object.keys(BANDIT).filter(k => k.startsWith(stageKey + ':') && !k.endsWith('__decision')).map(k => ({ v: k.slice(stageKey.length + 1), ...BANDIT[k] }));
  const d = BANDIT[DEC(stageKey)] || null; const live = arms.filter(x => !(d?.retired || []).includes(x.v));
  if (live.length < 2 || live.some(x => x.a + x.b - 2 < 10) || live.reduce((n, x) => n + x.a + x.b - 2, 0) < 20) return null;
  const N = 2000; const wins = Object.fromEntries(live.map(x => [x.v, 0]));
  for (let i = 0; i < N; i++) { let best = null, bv = -1; for (const x of live) { const r = beta(x.a, x.b); if (r > bv) { bv = r; best = x.v; } } wins[best]++; }
  const top = live.map(x => ({ ...x, p: wins[x.v] / N, mean: x.a / (x.a + x.b) })).sort((a, b) => b.p - a.p);
  if (top[0].p < 0.95 || top[0].mean - top[1].mean < 0.1) return null;
  BANDIT[DEC(stageKey)] = { winner: top[0].v, retired: [...new Set([...(d?.retired || []), ...top.slice(1).map(x => x.v)])], p: Math.round(top[0].p * 100) / 100, at: now() };
  bus.emit('change', { scope: 'learning' });
  return BANDIT[DEC(stageKey)];
}
export async function rewardVariant(stageKey, variant, success) {
  if (!stageKey || !variant) return;
  const k = `${stageKey}:${variant}`; const s = BANDIT[k] = BANDIT[k] || { a: 1, b: 1 };
  if (success) s.a++; else s.b++; settle(stageKey); await save('bandit.json', BANDIT);
}
export async function resetCompetition(stageKey) { delete BANDIT[DEC(stageKey)]; await save('bandit.json', BANDIT); bus.emit('change', { scope: 'learning' }); return { ok: true }; }
export const competitionDecisions = () => Object.entries(BANDIT).filter(([k]) => k.endsWith(':__decision')).map(([k, v]) => ({ stage: k.replace(/:__decision$/, ''), ...v }));

/* ---------------- v19 (plan 1.6): model experiments on border stages, off until you turn them on ---------------- */
let LSET = {};
export async function loadLearningSettings() { LSET = (await storage.readJSON('learning-settings.json', {})) || {}; }
export const learningSettings = () => ({ modelExperiments: !!LSET.modelExperiments, overlap: LSET.overlap !== false });
export async function setLearningSettings(patch) { for (const k of ['modelExperiments', 'overlap']) if (typeof patch[k] === 'boolean') LSET[k] = patch[k]; await save('learning-settings.json', LSET); bus.emit('change', { scope: 'learning' }); return learningSettings(); }

/* ---------------- 4. approved examples (TF-IDF retrieval) ---------------- */
export const listExamples = () => EXAMPLES;
export const banditState = () => BANDIT;
export async function removeExample(pid, volume) { EXAMPLES = EXAMPLES.filter(e => !(e.pid === pid && e.volume === volume)); await save('examples.json', EXAMPLES); bus.emit('change', { scope: 'learning' }); }   // P7-T01: revocation
export async function addExample(ex) { EXAMPLES = EXAMPLES.filter(e => !(e.pid === ex.pid && e.volume === ex.volume)); EXAMPLES.push({ ...ex, at: now() }); EXAMPLES = EXAMPLES.slice(-300); await save('examples.json', EXAMPLES); }
export function findExamples(query, { age, language, excludePid, k = 2 }) {
  const pool = EXAMPLES.filter(e => e.age === age && e.language === language && e.pid !== excludePid); if (!pool.length) return [];
  const docs = pool.map(e => words(e.theme + ' ' + e.title + ' ' + e.pages.join(' ')));
  const df = {}; docs.forEach(d => new Set(d).forEach(w => { df[w] = (df[w] || 0) + 1; }));
  const vec = d => { const tf = {}; d.forEach(w => { tf[w] = (tf[w] || 0) + 1; }); const v = {}; for (const [w, c] of Object.entries(tf)) v[w] = c * Math.log(1 + pool.length / (df[w] || 1)); return v; };
  const cos = (a, b) => { let s = 0, na = 0, nb = 0; for (const [w, x] of Object.entries(a)) { na += x * x; if (b[w]) s += x * b[w]; } for (const x of Object.values(b)) nb += x * x; return s / (Math.sqrt(na * nb) || 1); };
  const q = vec(words(query));
  return pool.map((e, i) => ({ e, s: cos(q, vec(docs[i])) })).sort((a, b) => b.s - a.s).slice(0, k).map(({ e }) => ({ title: e.title, pages: e.pages.slice(0, 3) }));
}

/* failure patterns seen in real images (from training packs): the Art Director checks them explicitly */
let FAILS = {}; let AUTO = [];
export async function loadKnownFailures() { FAILS = (await storage.readJSON('known-failures.json', {})) || {}; AUTO = (await storage.readJSON('known-failures-auto.json', [])) || []; }
export async function setKnownFailures(pack, list) { if (list.length) FAILS[pack] = list; else delete FAILS[pack]; await save('known-failures.json', FAILS); }
/* v19 (plan 3.9): problems found by the visual check and images you send back feed an automatic catalogue (merged by similarity) */
const wordsOf = t => new Set(String(t).toLowerCase().match(/[\p{L}]{3,}/gu) || []);
const similar = (a, b) => { const x = wordsOf(a), y = wordsOf(b); const inter = [...x].filter(w => y.has(w)).length; return inter / Math.max(1, new Set([...x, ...y]).size) >= 0.6; };
let autoT = null;
export function noteVisualFailure(text, code = null) {
  const t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 160); if (t.length < 8) return;
  const hit = AUTO.find(a => similar(a.text, t));
  if (hit) { hit.count++; hit.at = now(); if (code && !hit.code) hit.code = code; } else AUTO.push({ text: t, code: code || null, count: 1, at: now() });
  AUTO = AUTO.sort((a, b) => b.count - a.count).slice(0, 200);
  clearTimeout(autoT); autoT = setTimeout(() => save('known-failures-auto.json', AUTO), 2000); autoT.unref?.();
}
export const autoFailures = () => AUTO;
export function knownFailures() { const packs = Object.values(FAILS).flat(); const auto = AUTO.map(a => a.text); return [...packs.slice(0, Math.max(12, 20 - auto.length)), ...auto].slice(0, 20); }

/* ---------------- volume retrospectives: proposed lessons you approve (plan 3.3) ---------------- */
let PROPOSALS = [];
export async function loadProposals() { PROPOSALS = (await storage.readJSON('proposals.json', [])) || []; }
export const listProposals = () => PROPOSALS.filter(x => x.status === 'pending');
export async function addProposals(list, { pid, vol, age, confirm = [] } = {}) {
  for (const id of confirm) { const l = LESSONS.find(x => x.id === id); if (l) { l.confidence = Math.min(0.97, (l.confidence || 0.5) + 0.1); l.hits = (l.hits || 0) + 1; l.updatedAt = now(); } }
  for (const n of list) {
    const text = String(n.text || '').trim().slice(0, 300); if (!text || !n.agent) continue;
    if (LESSONS.some(l => l.text.toLowerCase() === text.toLowerCase()) || PROPOSALS.some(x => x.text.toLowerCase() === text.toLowerCase() && x.status === 'pending')) continue;
    PROPOSALS.push({ id: uid('pr'), pid, vol, age: age || null, agent: n.agent, code: /^[TV]\d\d$/.test(n.code || '') ? n.code : null, text, status: 'pending', source: 'retro', at: now() });
  }
  PROPOSALS = PROPOSALS.slice(-300);
  await save('proposals.json', PROPOSALS); await save('lessons.json', LESSONS); bus.emit('change', { scope: 'learning' });
}
export async function decideProposal(id, accept, scope = 'project') {
  const x = PROPOSALS.find(p => p.id === id); if (!x || x.status !== 'pending') throw { status: 404, message: 'Propunere inexistentă.' };
  if (accept && scope && scope !== 'project') throw { status: 409, code: 'single_case', message: 'O propunere vine dintr-un singur proiect: se acceptă la nivel de proiect; lărgirea cere dovezi din mai multe proiecte (raport de promovare).' };   // P7-T02
  x.status = accept ? 'accepted' : 'rejected'; x.decidedAt = now();
  if (accept) LESSONS.push({ id: uid('l'), agent: x.agent, text: x.text, code: x.code, age: scope === 'age' ? x.age : null, scope: ['project', 'age', 'global'].includes(scope) ? scope : 'project', pid: x.pid, projects: [x.pid].filter(Boolean), confidence: 0.7, hits: 1, status: 'active', source: 'retro', createdAt: now(), updatedAt: now() });
  await save('proposals.json', PROPOSALS); await save('lessons.json', LESSONS); bus.emit('change', { scope: 'learning' }); return x;
}

/* ---------------- critic thresholds per age (plan 3.8) ---------------- */
let THRESH = {};
export async function loadThresholds() { THRESH = (await storage.readJSON('thresholds.json', {})) || {}; }
export function thresholdFor(age, stage, def = 8) { const v = THRESH[age]?.[stage]; return Number.isFinite(v) ? v : def; }
export async function setThreshold(age, stage, value) {
  if (value == null) { if (THRESH[age]) delete THRESH[age][stage]; }
  else { const v = Math.round(Number(value) * 2) / 2; if (!(v >= 5 && v <= 9.5)) throw { status: 400, message: 'Prag invalid (5–9,5).' }; (THRESH[age] = THRESH[age] || {})[stage] = v; }
  await save('thresholds.json', THRESH); bus.emit('change', { scope: 'learning' }); return THRESH;
}
export const thresholds = () => THRESH;
/* v19 (plan 3.8): does the editor judge like you? Pairs (editor's final score of a script, your first decision at the demo
   gate) per age; the threshold that best predicts your approval is proposed, never applied without you (min. 10 volumes) */
export function thresholdProposals() {
  const q = Ledger.rows(r => r.kind === 'quality' && r.stage === 'critic'); const gates = Ledger.rows(r => r.kind === 'gate' && r.gate === 'review_1' && r.round === 1);
  const byAge = {};
  for (const g of gates) {
    const s = q.filter(r => r.pid === g.pid && r.vol === g.vol && r.t <= g.t).pop(); if (!s || !s.age) continue;
    (byAge[s.age] = byAge[s.age] || []).push({ score: s.score, ok: !!g.firstPass });
  }
  const out = [];
  for (const [age, xs] of Object.entries(byAge)) {
    if (xs.length < 10) { out.push({ age, stage: 'critic', samples: xs.length, current: thresholdFor(age, 'critic', 8), proposed: null }); continue; }
    let best = null;
    for (let t = 6.5; t <= 9.5; t += 0.5) { const acc = xs.filter(x => (x.score >= t) === x.ok).length / xs.length; if (!best || acc > best.acc + 1e-9) best = { t, acc }; }
    const cur = thresholdFor(age, 'critic', 8); const accCur = xs.filter(x => (x.score >= cur) === x.ok).length / xs.length;
    out.push({ age, stage: 'critic', samples: xs.length, current: cur, proposed: best.t !== cur && best.acc - accCur >= 0.05 ? best.t : null, accuracy: Math.round(best.acc * 100), accuracyNow: Math.round(accCur * 100) });
  }
  return out;
}

/* ---------------- 5. metrics ---------------- */
/* LL-033: an age group is only "calibrated" after several materially different collections, and only when you say so */
let CALIB = {};
export async function loadCalibration() { CALIB = (await storage.readJSON('calibration.json', {})) || {}; }
export async function setCalibrated(age, on) { CALIB[age] = on ? { calibrated: true, at: now() } : { calibrated: false }; await save('calibration.json', CALIB); bus.emit('change', { scope: 'learning' }); }
function calibration(projects) {
  const out = {};
  for (const age of ['3-4', '5-6', '7-8']) {
    const done = projects.filter(p => (p.input?.target_age === age) && (p.status === 'completed' || Object.keys(p.delivered || {}).length >= 6));
    const themes = new Set(done.map(p => String(p.input?.short_description || '').toLowerCase().split(/\s+/).slice(0, 3).join(' ')));
    const state = CALIB[age]?.calibrated ? 'CALIBRATED' : themes.size >= 3 ? 'CALIBRATION_CANDIDATE' : done.length ? 'IN_CALIBRATION' : 'DEFINED';
    out[age] = { collections: done.length, themes: themes.size, state };
  }
  return out;
}
export function learningState(projects) {
  refreshEffects();
  const done = projects.filter(p => (p.decisions || []).length).sort((a, b) => a.createdAt - b.createdAt);
  const perProject = done.map(p => {
    const gates = {}; (p.decisions || []).forEach(d => { (gates[d.gate] = gates[d.gate] || []).push(d); });
    const first = Object.values(gates).map(ds => ['approved', 'approved_with_notes'].includes(ds[0].decision));
    const rounds = Object.values(gates).map(ds => Math.max(...ds.map(d => d.round || 1)));
    return { id: p.id, title: p.title, at: p.createdAt, firstPass: first.length ? first.filter(Boolean).length / first.length : null, rounds: rounds.length ? rounds.reduce((a, b) => a + b, 0) / rounds.length : null };
  });
  const dec = Object.fromEntries(competitionDecisions().map(d => [d.stage, d]));
  const bandit = Object.entries(BANDIT).filter(([k]) => !k.endsWith('__decision')).map(([k, s]) => { const [st, v] = [k.slice(0, k.lastIndexOf(':')), k.slice(k.lastIndexOf(':') + 1)]; const d = dec[st];
    return { key: k, wins: s.a - 1, losses: s.b - 1, rate: s.a / (s.a + s.b), status: d ? (d.winner === v ? 'câștigătoare' : (d.retired || []).includes(v) ? 'retrasă' : 'în competiție') : 'în competiție', stage: st }; });
  return {
    perProject, lessons: { total: LESSONS.length, active: LESSONS.filter(l => l.status === 'active').length, candidates: LESSONS.filter(l => l.candidate && l.status === 'active').length, project: LESSONS.filter(l => scopeOf(l) === 'project' && l.status === 'active').length },
    calibration: calibration(projects),
    model: MODEL ? { samples: MODEL.samples, positives: MODEL.positives, accuracy: MODEL.accuracy, trainedAt: MODEL.trainedAt, weights: MODEL.w.map((w, i) => ({ name: FEATURE_NAMES[i], w })) } : { samples: DATA.length },
    bandit, examples: EXAMPLES.length,
    review: LESSONS.filter(l => l.needsReview && l.status === 'active').map(l => ({ id: l.id, agent: l.agent, text: l.text, code: l.code, effect: l.effect, uses: l.uses || 0 })),
    measured: LESSONS.filter(l => l.effect != null).map(l => ({ id: l.id, agent: l.agent, text: l.text, code: l.code, effect: l.effect, n: l.effectN })).sort((a, b) => b.effect - a.effect).slice(0, 12),
    autoFailures: AUTO.slice(0, 15), thresholds: THRESH, proposals: PROPOSALS.filter(x => x.status === 'pending'),
    thresholdProposals: thresholdProposals(), competitions: competitionDecisions(), settings: learningSettings()
  };
}

/* Project deletion removes all project-derived learning. Older preference/variant/visual aggregates
   did not record their project of origin, so they must be reset to avoid retaining an influence that
   cannot be attributed and removed safely. */
export async function purgeProject(pid) {
  const e0 = EXAMPLES.length; EXAMPLES = EXAMPLES.filter(e => e.pid !== pid);
  const p0 = PROPOSALS.length; PROPOSALS = PROPOSALS.filter(x => x.pid !== pid);
  const l0 = LESSONS.length;
  LESSONS = LESSONS.filter(l => l.pid !== pid && !(l.projects || []).includes(pid));
  const samples = DATA.length, variants = Object.keys(BANDIT).length, failures = AUTO.length;
  DATA = []; MODEL = null; BANDIT = {}; AUTO = []; clearTimeout(autoT);
  await storage.writeJSON('examples.json', EXAMPLES);
  await storage.writeJSON('proposals.json', PROPOSALS);
  await storage.writeJSON('lessons.json', LESSONS);
  await storage.writeJSON('preference-model.json', { data: [], model: null });
  await storage.writeJSON('bandit.json', {});
  await storage.writeJSON('known-failures-auto.json', []);
  bus.emit('change', { scope: 'learning' });
  return { examples: e0 - EXAMPLES.length, proposals: p0 - PROPOSALS.length, lessons: l0 - LESSONS.length, samples, variants, failures };
}

export async function flushLearning(){clearTimeout(useT);clearTimeout(autoT);if(!storage)return;await Promise.all([storage.writeJSON('lessons.json',LESSONS),storage.writeJSON('known-failures-auto.json',AUTO),storage.writeJSON('preference-model.json',{data:DATA,model:MODEL}),storage.writeJSON('bandit.json',BANDIT),storage.writeJSON('proposals.json',PROPOSALS),storage.writeJSON('examples.json',EXAMPLES)]);}
