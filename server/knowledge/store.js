/**
 * P7-T01 — knowledge quarantine and ingestion provenance (C19/G11, ADR08).
 * Imported material is a SOURCE (hash, files, rights), never active knowledge. Everything derived from it — lessons,
 * text examples, image failure patterns, world rules — is a CANDIDATE with its evidence (file + exact quote) and a
 * quarantine scan:
 *   INSTRUCTION_INJECTION  text that tries to instruct the system (ignore/override rules, act as, scripts, shell);
 *   FAKE_QUOTE             the cited quote is not in the cited file;
 *   WORLD_RULE_CONFLICT    a rule that would make light/weather magical by default (canon: natural unless declared);
 *   CONTRADICTS_ACTIVE     a rule that negates an active rule on the same subject;
 *   CANON_COLLISION        a rule about a canonical page that contradicts the reconciled canon (LL-013 ↔ DW p9).
 * A quarantined candidate cannot be promoted. Promotion is an explicit operator act (P7-T02 adds validation/scope);
 * every promoted item is recorded in the source's revocation index, so revoking/deleting the source removes ALL of it.
 * Imports can never touch the charter, skills, agents or active knowledge directly.
 */
import { uid, now, bus } from '../repo.js';
import { canonicalHash } from '../domain/canonical.js';

let storage = null, SOURCES = [], CANDIDATES = [];
export const KNOWLEDGE_SCHEMA = 'wonderpages.knowledge/1';
export async function initKnowledgeStore(s) { storage = s; const d = (await s.readJSON('knowledge/store.json', null)) || {}; SOURCES = d.sources || []; CANDIDATES = d.candidates || []; }
const save = async () => { await storage.writeJSON('knowledge/store.json', { schema: KNOWLEDGE_SCHEMA, sources: SOURCES, candidates: CANDIDATES }); bus.emit('change', { scope: 'learning' }); };
export const listSources = () => SOURCES;
export const listCandidates = (f = {}) => CANDIDATES.filter(c => (!f.sourceId || c.sourceId === f.sourceId) && (!f.status || c.status === f.status));
export const getCandidate = id => CANDIDATES.find(c => c.id === id) || null;

const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const INJECTION = [/\bignor(e|ă|a)\b.{0,30}\b(previous|prior|all|above|instruc|regul|reguli|charter)/i, /\bdisregard\b/i, /\bsystem prompt\b/i, /\byou are now\b|\besti acum\b|\beşti acum\b/i, /\boverride\b.{0,30}\b(charter|rules?|policy|safety|skills?)/i, /\bnew instructions?\b|\binstructiuni noi\b/i, /\bact as\b/i, /\bjailbreak\b/i, /<\s*script\b|javascript:/i, /\brm\s+-rf\b|\bcurl\s+https?:|\bwget\s|\bpowershell\b|\beval\s*\(|\brequire\s*\(|process\.env|child_process/i, /\b(api[_ -]?key|token|password|parol[aă])\b.{0,20}[:=]/i, /\b(delete|șterge|sterge)\b.{0,30}\b(lessons?|lecții|lectii|projects?|proiecte|backups?)\b/i];
const NEG = /\b(never|not|no|without|nu|niciodata|fara|interzis)\b/, POS = /\b(always|must|should|mereu|trebuie|intotdeauna)\b/;
const STOP = new Set('the a an and or of to in on for with is are be page pagina si sau de la in pe cu din un o ca nu never not always must should mereu trebuie fara niciodata'.split(' '));
const words = s => new Set(norm(s).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(w => w.length > 3 && !STOP.has(w)));
/** Canonical facts imported knowledge must not overwrite (reconciled canon). */
export const CANON_FACTS = Object.freeze([
  { id: 'DW-V1-p9', page: 9, label: 'Dinosaur World V1 p9: adăpostul prietenilor sub frunză (motivul reconciliat)', subject: /\b(page|pagina|p\.?)\s*9\b/i, contradicts: /\b(current|stream|curent|parau|puddle|baltoac|pushing the pebble|impinge pietricica)\b/i }
]);

export function scanCandidate(c, { sourceFiles = {}, active = [], canon = CANON_FACTS } = {}) {
  const flags = [], text = String(c.text || ''), add = (code, detail) => flags.push({ code, detail });
  for (const re of INJECTION) if (re.test(text)) { add('INSTRUCTION_INJECTION', `Textul încearcă să instruiască sistemul (${re.source.slice(0, 40)}…).`); break; }
  if (c.evidence?.quote) { const f = sourceFiles[c.evidence.file]; if (f == null || !norm(f).includes(norm(c.evidence.quote))) add('FAKE_QUOTE', `Citatul nu există în ${c.evidence.file || 'sursă'}.`); }
  const n = norm(text);
  if ((c.type === 'world_rule' || /\b(light|lumin|glow|stralu|sparkl|weather|vreme|magic)/.test(n)) && /\b(magic|magical|magica|magice|glows? by itself|straluceste singur)/.test(n) && !/\bunless\b|\bdaca\b.{0,40}\b(declar|regul)/.test(n)) add('WORLD_RULE_CONFLICT', 'Regula ar face lumina/vremea magice implicit; canonul: naturale cât timp regulile lumii nu declară magie.');
  const w = words(text);
  for (const a of active) {
    const aw = words(a.text), shared = [...w].filter(x => aw.has(x));
    if (shared.length >= 2 && ((NEG.test(n) && POS.test(norm(a.text)) && !NEG.test(norm(a.text))) || (POS.test(n) && !NEG.test(n) && NEG.test(norm(a.text))))) { add('CONTRADICTS_ACTIVE', `Contrazice regula activă ${a.id} („${String(a.text).slice(0, 60)}”).`); break; }
  }
  for (const f of canon) if (f.subject.test(text) && f.contradicts.test(text)) add('CANON_COLLISION', `Coliziune cu canonul reconciliat ${f.id}: ${f.label}. Nu suprascrie pagina canonică; cere reconciliere.`);
  return flags;
}

export async function registerSource({ kind, ref, label = '', sha256 = null, files = [], rights = null, meta = {} }) {
  const s = { id: uid('ks'), kind, ref, label: String(label).slice(0, 200), sha256, files: files.slice(0, 500), rights: rights || { status: 'unknown', reasons: ['Drepturile materialului importat nu sunt documentate.'] }, meta, status: 'active', importedAt: now(), derived: [] };
  SOURCES.push(s); await save(); return s;
}
export async function addCandidates(sourceId, list, ctx = {}) {
  const src = SOURCES.find(s => s.id === sourceId); if (!src) throw { status: 404, message: 'Sursă inexistentă.' };
  const out = [];
  for (const c of list) {
    const flags = scanCandidate(c, ctx);
    const cand = { id: uid('kc'), sourceId, type: c.type, agent: c.agent || null, text: String(c.text || '').slice(0, 1000), scope: c.scope || 'project', age: c.age || null, evidence: c.evidence || null, payload: c.payload || null, ref: c.ref || null, flags, status: flags.length ? 'quarantined' : 'candidate', createdAt: now(), hash: canonicalHash({ t: c.type, a: c.agent, x: c.text, p: c.payload ?? null }).slice(0, 16) };
    CANDIDATES.push(cand); out.push(cand);
  }
  await save(); return out;
}
/** Explicit operator promotion; the effect (lesson/example/failure id) is written to the source's revocation index. */
export async function promoteCandidate(id, apply, { actor = 'operator' } = {}) {
  const c = getCandidate(id); if (!c) throw { status: 404, message: 'Candidat inexistent.' };
  if (c.status === 'quarantined') throw { status: 409, code: 'quarantined', message: 'Candidatul este în carantină (' + c.flags.map(f => f.code).join(', ') + ') și nu se poate promova.' };
  if (c.status !== 'candidate') throw { status: 409, message: `Candidatul este „${c.status}”.` };
  const src = SOURCES.find(s => s.id === c.sourceId); if (!src || src.status !== 'active') throw { status: 409, message: 'Sursa a fost revocată.' };
  const target = await apply(c);
  c.status = 'promoted'; c.promotedAt = now(); c.promotedBy = actor; c.target = target; src.derived.push({ candidateId: c.id, ...target });
  await save(); return c;
}
export async function rejectCandidate(id, reason = '') { const c = getCandidate(id); if (!c) throw { status: 404, message: 'Candidat inexistent.' }; if (!['candidate', 'quarantined'].includes(c.status)) throw { status: 409, message: `Candidatul este „${c.status}”.` }; c.status = 'rejected'; c.reason = String(reason).slice(0, 300); c.updatedAt = now(); await save(); return c; }
/** Revokes a source and EVERYTHING derived from it (candidates + promoted items via the index). */
export async function revokeSource(id, revokeTarget, reason = 'sursă revocată') {
  const src = SOURCES.find(s => s.id === id); if (!src) throw { status: 404, message: 'Sursă inexistentă.' };
  const undone = [];
  for (const d of src.derived) { try { await revokeTarget(d); undone.push({ ...d, ok: true }); } catch (e) { undone.push({ ...d, ok: false, error: String(e?.message || e) }); } }
  for (const c of CANDIDATES.filter(x => x.sourceId === id && x.status !== 'revoked')) { c.previousStatus = c.status; c.status = 'revoked'; c.revokedAt = now(); }
  src.status = 'revoked'; src.revokedAt = now(); src.revokeReason = String(reason).slice(0, 200); src.revoked = undone;
  await save(); return { source: src, undone };
}
export const sourceByRef = (kind, ref) => SOURCES.filter(s => s.kind === kind && s.ref === ref && s.status === 'active');
export function counts(sourceId = null) {
  const list = CANDIDATES.filter(c => !sourceId || c.sourceId === sourceId), by = {};
  for (const c of list) by[c.status] = (by[c.status] || 0) + 1;
  return { total: list.length, ...by };
}
