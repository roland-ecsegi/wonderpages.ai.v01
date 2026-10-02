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
- Never claim you did something other than these actions. You cannot change projects yourself. add_improvement is only a PROPOSAL the user confirms. You can never approve, promote knowledge, publish, send, release or delete; never say approvals exist that the APP STATE does not show.
Reply with ONLY this JSON: {"reply": "", "actions": []}`;

/* P7-T06: ActionProposal — what the model returns is a PROPOSAL validated by the server, never an executed command.
   Allowlist: navigate (valid routes only), fill_project (fills the form; you still create), add_improvement (mutating:
   only when YOUR message asks for it, and applied only when you confirm it). Anything else (approve, promote, publish,
   send, release, delete, start…) is rejected whatever the prompt or an injected document says. */
export const ACTION_SCHEMAS = Object.freeze({
  navigate: { mutates: false, fields: ['to', 'label'] },
  fill_project: { mutates: false, fields: ['values'] },
  add_improvement: { mutates: true, fields: ['title', 'category', 'priority', 'description'], intent: /(not(e|ea)z|adaug|trece|lista de (imbunatatiri|îmbunătățiri)|imbunatatir|îmbunătățir|propun)/i }
});
const PROPOSAL_TTL = 15 * 60e3;
const TABS = ['progress', 'review', 'book', 'export', 'activity', 'preview', 'carte', 'livrare', 'activitate', 'revizuire', 'progres', 'macheta'];
export function validRoute(to, { projectExists = () => false } = {}) {
  const r = String(to || ''); if (!/^#\/[\w\-/]*$/.test(r)) return false;
  const parts = r.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!parts.length) return true;
  if (['projects', 'agents', 'learning', 'improvements', 'settings'].includes(parts[0])) return parts.length === 1;
  if (parts[0] === 'new' || parts[0] === 'studio') return parts.length <= 2;
  if (parts[0] === 'p') return parts.length >= 2 && projectExists(parts[1]) && (parts.length === 2 || (TABS.includes(parts[2]) && (parts.length === 3 || (parts[2] === 'book' && parts.length === 5 && /^\d+$/.test(parts[3]) && /^\d+$/.test(parts[4])))));
  return false;
}
/** Server-side validation of the model's actions for one user message. */
export function validateActions(raw, { userMessage = '', projectExists = () => false, resource = null } = {}) {
  const accepted = [], proposals = [], rejected = [];
  for (const a of Array.isArray(raw) ? raw : []) {
    const sch = ACTION_SCHEMAS[a?.type];
    if (!sch) { rejected.push({ type: String(a?.type || '?').slice(0, 40), reason: 'not_allowed' }); continue; }
    if (a.type === 'navigate') { if (validRoute(a.to, { projectExists })) accepted.push({ type: 'navigate', to: a.to, label: String(a.label || 'Deschide').slice(0, 60) }); else rejected.push({ type: 'navigate', reason: 'invalid_route', to: String(a.to || '').slice(0, 80) }); continue; }
    if (a.type === 'fill_project') { if (a.values && typeof a.values === 'object' && !Array.isArray(a.values)) accepted.push({ type: 'fill_project', values: Object.fromEntries(Object.entries(a.values).filter(([k]) => /^[a-z_]{1,40}$/.test(k)).slice(0, 30)) }); else rejected.push({ type: 'fill_project', reason: 'invalid' }); continue; }
    if (sch.mutates) {
      if (!sch.intent.test(String(userMessage).normalize('NFC'))) { rejected.push({ type: a.type, reason: 'no_user_intent' }); continue; }
      if (!String(a.title || '').trim()) { rejected.push({ type: a.type, reason: 'invalid' }); continue; }
      proposals.push({ id: uid('ap'), kind: a.type, status: 'proposed', payload: Object.fromEntries(sch.fields.map(f => [f, String(a[f] ?? '').slice(0, f === 'description' ? 3000 : 160)])), resource, intentHash: crypto.createHash('sha256').update(String(userMessage)).digest('hex').slice(0, 16), at: now(), expiresAt: now() + PROPOSAL_TTL });
    }
  }
  return { accepted, proposals, rejected };
}
export async function decideProposal(sid, id, { confirm, revisionOf = () => null }) {
  const s = SESS.get(sid), pr = s?.proposals?.find(x => x.id === id);
  if (!pr) throw { status: 404, code: 'proposal_missing', message: 'Propunerea nu mai există (conversația s-a închis sau a expirat).' };
  if (pr.status !== 'proposed') throw { status: 409, code: 'proposal_decided', message: `Propunerea este deja „${pr.status}”.` };
  if (!confirm) { pr.status = 'cancelled'; pr.decidedAt = now(); return { proposal: pr, applied: false }; }
  if (now() > pr.expiresAt) { pr.status = 'expired'; throw { status: 409, code: 'proposal_expired', message: 'Propunerea a expirat; cere-o din nou.' }; }
  if (pr.resource?.projectId) { const rev = revisionOf(pr.resource.projectId); if (rev == null) throw { status: 409, code: 'stale_project', message: 'Proiectul la care se referea propunerea nu mai există.' }; if (pr.resource.revision != null && rev !== pr.resource.revision) throw { status: 409, code: 'stale_revision', message: 'Proiectul s-a schimbat de la propunere; cere din nou.' }; }
  if (pr.kind === 'add_improvement') { const it = await addImprovement(pr.payload, 'asistent'); pr.status = 'applied'; pr.decidedAt = now(); pr.result = { id: it.id, title: it.title }; return { proposal: pr, applied: true, result: pr.result }; }
  throw { status: 400, message: 'Tip de propunere necunoscut.' };
}

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
  const screen = { route: context?.route || '', project: context?.projectId ? (() => { const p = repo.getProject(context.projectId); return p ? { id: p.id, title: p.title, status: p.status, gate: p.gate, currentVolume: p.currentVolume, age: p.variantLabel, languages: [p.input?.language, p.input?.second_language].filter(Boolean), revision: p.revision ?? 0, source: p.source?.kind || 'native', approvalsGiven: Object.values(p.approvals || {}).reduce((n, g) => n + Object.values(g || {}).filter(a => a && ['approved', 'approved_note'].includes(a.state)).length, 0), conflicts: p.source?.kind === 'migration' ? (p.reconciledAt ? 'reconciliate' : 'raport de reconciliere deschis (DW01/DW02): decizia operatorului') : null } : null; })() : null };
  const prompt = `${DALI}\n\n${await knowledge()}\n\nAPP STATE: ${JSON.stringify(st)}\nCURRENT SCREEN: ${JSON.stringify(screen)}\n\nCONVERSATION SO FAR (oldest first):\n${s.msgs.slice(-10).map(m => `${m.role === 'user' ? 'USER' : 'DALI'}: ${m.text}`).join('\n')}\n\nReply to the last USER message.`;
  let out;
  try { out = await completeFn(prompt, { json: true, agent: 'asistent', task: 'Dali răspunde', skipBudget: true }); }
  catch (e) { s.msgs.pop(); throw { status: 503, message: e?.code === 'rate_limited' ? (e?.provider === 'codex' ? 'Am atins limita Codex din contul ChatGPT; revin după resetare.' : 'Am atins limita abonamentului Claude; revin după resetare.') : e?.code === 'codex_auth' ? 'Codex nu e autentificat cu ChatGPT; verifică în Setări.' : e?.code === 'auth' ? 'Claude nu e autentificat; verifică în Setări.' : 'Nu am reușit să răspund acum. Mai încearcă o dată.' }; }
  const resource = screen.project ? { projectId: screen.project.id, revision: screen.project.revision ?? 0 } : null;
  const v = validateActions(out?.actions, { userMessage: message, projectExists: id => !!repo.getProject(id), resource });
  s.proposals = [...(s.proposals || []).filter(x => x.status === 'proposed' && x.expiresAt > now()), ...v.proposals].slice(-20);
  const actions = [...v.accepted, ...v.proposals.map(p => ({ type: 'proposal', id: p.id, kind: p.kind, status: 'proposed', title: p.payload.title }))];
  const reply = String(out?.reply || '').trim() || 'Nu am înțeles bine; poți reformula?';
  s.msgs.push({ role: 'dali', text: reply, actions, rejected: v.rejected, at: now() }); s.last = now();
  return { sid, reply, actions, rejected: v.rejected };
}
export function history(sid) { const s = SESS.get(sid); return s ? { sid, msgs: s.msgs } : null; }
export function forget(sid) { SESS.delete(sid); }
