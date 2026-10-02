/**
 * Dali, asistenta din aplicație.
 * - Cunoaște aplicația din documentația ei (README, ghidul asistentului, auditul) și din tipurile de produs,
 *   citite la FIECARE mesaj: când aplicația se actualizează, și el e la zi.
 * - Conversațiile stau doar în memorie: se șterg când le închizi sau după 2 ore fără mesaje.
 * - Poate: explica, da idei, completa formularul de proiect nou, deschide o pagină, nota o îmbunătățire.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from './config.js';
import { bus, now, uid } from './repo.js';

let repo, storage, completeFn, stateFn;
const SESS = new Map();
const TTL = Number(process.env.ASSISTANT_TTL_MS || 2 * 3600e3);
let IMPR = [];
export async function initAssistant(r, s, complete, getState) {
  repo = r; storage = s; completeFn = complete; stateFn = getState;
  IMPR = (await s.readJSON('improvements.json', [])) || [];
  setInterval(() => { const t = Date.now() - TTL; for (const [k, v] of SESS) if (v.last < t) SESS.delete(k); }, 60e3).unref?.();
}
const saveImpr = async () => { await storage.writeJSON('improvements.json', IMPR); bus.emit('change', { scope: 'improvements' }); };
export const listImprovements = () => IMPR.slice().sort((a, b) => b.createdAt - a.createdAt);
export async function addImprovement(x, source = 'asistent') {
  const it = { id: uid('i'), title: String(x.title || '').slice(0, 160), description: String(x.description || '').slice(0, 3000), category: String(x.category || 'altele').slice(0, 40), priority: ['mică', 'medie', 'mare'].includes(x.priority) ? x.priority : 'medie', status: 'nouă', source, history: [{ at: now(), to: 'nouă', note: source === 'asistent' ? 'notată de Dali' : 'adăugată' }], createdAt: now(), updatedAt: now() };
  if (!it.title) throw { status: 400, message: 'Lipsește titlul.' };
  IMPR.push(it); await saveImpr(); return it;
}
export const getImprovement = id => IMPR.find(x => x.id === id) || null;
export async function persistImprovements() { await saveImpr(); }
export async function updateImprovement(id, patch) { const it = IMPR.find(x => x.id === id); if (!it) throw { status: 404, message: 'Nu există.' }; for (const k of ['title', 'description', 'category', 'priority']) if (patch[k] != null) it[k] = String(patch[k]).slice(0, k === 'description' ? 3000 : 160); it.updatedAt = now(); await saveImpr(); return it; }
export async function deleteImprovement(id) { IMPR = IMPR.filter(x => x.id !== id); await saveImpr(); }
export function improvementsMarkdown() {
  return ['# Lista de îmbunătățiri WonderPages.AI', '', ...listImprovements().flatMap(i => [`## ${i.title}`, `- Categorie: ${i.category}; prioritate: ${i.priority}; stare: ${i.status}; notată: ${new Date(i.createdAt).toLocaleDateString('ro-RO')}`, '', i.description, ''])].join('\n');
}

/* the knowledge: always read fresh from the app's own documentation and product types */
async function knowledge() {
  const read = async f => { try { return await fs.readFile(path.join(ROOT, f), 'utf8'); } catch { return ''; } };
  const [guide, audit] = await Promise.all([read('docs/GHID-ASISTENT.md'), read('AUDIT.md')]);
  const types = repo.listTypes().map(t => ({
    name: t.full_name || t.name, version: t.version,
    fields: (t.input_schema?.fields || []).map(f => ({ key: f.key, label: f.label, type: f.type, required: !!f.required, options: (f.options || []).map(o => ({ value: o.value, label: o.label })), default: f.default })),
    ages: Object.fromEntries(Object.entries(t.age_profiles || {}).map(([k, a]) => [k, { chars_per_page: a.max_chars, narrative: a.narrative }])),
    approvals: Object.values(t.gates || {}).map(g => g.label)
  }));
  const latest = audit.slice(audit.lastIndexOf('\n## Versiunea')).slice(0, 4000);    // only the newest version's notes
  return `APP GUIDE (authoritative, current version):\n${guide}\n\nLATEST CHANGES:\n${latest}\n\nPRODUCT TYPES (exact form fields and allowed values):\n${JSON.stringify(types)}`;
}

const DALI = `WONDERPAGES ASSISTANT (you are Dali; about yourself use Romanian feminine forms)
Rules:
- Answer in Romanian, "tu", warm, professional, simple words, short sentences. Keep answers short (up to ~120 words) unless asked for more; use numbered steps for how-to answers.
- Use ONLY what the APP GUIDE and PRODUCT TYPES say about the app. If something is not possible in the app, say so honestly and offer to add it to the improvement list.
- Take into account where the user is now (CURRENT SCREEN) and the state of their projects.
- For ideas and inspiration (themes, characters, story ideas, what to write in the form), be creative and concrete, suited to the chosen age.
- Actions you may return:
  * {"type":"fill_project","values":{...}} when the user wants help filling the new-project form; use ONLY the field keys and option VALUES from PRODUCT TYPES (e.g. target_age "3-4", languages ["English","Romanian"], visual_style "soft3d", page_format "portrait45"); write short_description in Romanian.
  * {"type":"navigate","to":"#/...","label":"..."} to offer opening a page (#/, #/projects, #/new, #/agents, #/learning, #/improvements, #/settings, #/studio, or #/p/<projectId>/<progress|review|book|export|activity>).
  * {"type":"add_improvement","title":"...","category":"text|imagini|aprobare|livrare|interfață|performanță|altele","priority":"mică|medie|mare","description":"..."} ONLY when the user asks to note something in the improvement list. Rewrite it professionally in Romanian: a clear title; description with three short parts: Situația actuală, Impact, Propunere. Then confirm in "reply".
- Never claim you did something other than these actions. You cannot change projects yourself.
Reply with ONLY this JSON: {"reply": "", "actions": []}`;

/* audit M2: Dali does not use the production budget, so it has its own ceiling (messages per hour, all devices) */
const DALI_PER_HOUR = Math.max(5, Number(process.env.DALI_PER_HOUR || 40)); let daliCalls = [];
export async function chat({ sid, message, context }) {
  if (!String(message || '').trim()) throw { status: 400, message: 'Scrie un mesaj.' };
  daliCalls = daliCalls.filter(t => t > Date.now() - 3600e3);
  if (daliCalls.length >= DALI_PER_HOUR) throw { status: 429, message: `Dali a primit ${DALI_PER_HOUR} de mesaje în ultima oră; ca să nu consume abonamentul Claude al producției, mai așteaptă puțin.` };
  daliCalls.push(Date.now());
  if (SESS.size > 200) { const oldest = [...SESS.entries()].sort((a, b) => a[1].last - b[1].last)[0]; if (oldest) SESS.delete(oldest[0]); }
  let s = SESS.get(sid);
  if (!sid || !s) { sid = crypto.randomBytes(12).toString('hex'); s = { msgs: [], last: now() }; SESS.set(sid, s); }
  s.msgs.push({ role: 'user', text: String(message).slice(0, 4000), at: now() }); s.last = now();
  const st = stateFn();
  const screen = { route: context?.route || '', project: context?.projectId ? (() => { const p = repo.getProject(context.projectId); return p ? { id: p.id, title: p.title, status: p.status, gate: p.gate, currentVolume: p.currentVolume, age: p.variantLabel, languages: [p.input?.language, p.input?.second_language].filter(Boolean) } : null; })() : null };
  const prompt = `${DALI}\n\n${await knowledge()}\n\nAPP STATE: ${JSON.stringify(st)}\nCURRENT SCREEN: ${JSON.stringify(screen)}\n\nCONVERSATION SO FAR (oldest first):\n${s.msgs.slice(-10).map(m => `${m.role === 'user' ? 'USER' : 'DALI'}: ${m.text}`).join('\n')}\n\nReply to the last USER message.`;
  let out;
  try { out = await completeFn(prompt, { json: true, agent: 'asistent', task: 'Dali răspunde', skipBudget: true }); }
  catch (e) { s.msgs.pop(); throw { status: 503, message: e?.code === 'rate_limited' ? (e?.provider === 'codex' ? 'Am atins limita Codex din contul ChatGPT; revin după resetare.' : 'Am atins limita abonamentului Claude; revin după resetare.') : e?.code === 'codex_auth' ? 'Codex nu e autentificat cu ChatGPT; verifică în Setări.' : e?.code === 'auth' ? 'Claude nu e autentificat; verifică în Setări.' : 'Nu am reușit să răspund acum. Mai încearcă o dată.' }; }
  const actions = [];
  for (const a of Array.isArray(out?.actions) ? out.actions : []) {
    if (a?.type === 'add_improvement') { try { const it = await addImprovement(a, 'asistent'); actions.push({ type: 'improvement_added', id: it.id, title: it.title }); } catch {} }
    else if (a?.type === 'fill_project' && a.values && typeof a.values === 'object') actions.push({ type: 'fill_project', values: a.values });
    else if (a?.type === 'navigate' && /^#\/[\w\-/]*$/.test(a.to || '')) actions.push({ type: 'navigate', to: a.to, label: String(a.label || 'Deschide').slice(0, 60) });
  }
  const reply = String(out?.reply || '').trim() || 'Nu am înțeles bine; poți reformula?';
  s.msgs.push({ role: 'dali', text: reply, actions, at: now() }); s.last = now();
  return { sid, reply, actions };
}
export function history(sid) { const s = SESS.get(sid); return s ? { sid, msgs: s.msgs } : null; }
export function forget(sid) { SESS.delete(sid); }
