/**
 * Pachete de antrenament: materiale reale (personaje, o poveste aprobată, imagini bune și greșite, lecții)
 * importate ca DATE, nu ca cod. Un pachet poate:
 *  - porni un proiect nou cu tema, personajele și povestea volumului 1 (tu decizi, nimic nu e fixat în aplicație);
 *  - învăța echipa: exemplele de text aprobate, tiparele de greșeli văzute în imagini, regulile din registrul de lecții.
 * Format: arhivă .zip cu training.json la rădăcină (sau într-un singur folder) + fișierele referite.
 */
import { textSafety } from './quality/safety.js';
import zlib from 'node:zlib';
import path from 'node:path';
import { bus, now } from './repo.js';
import { readZip } from './security/safe-zip.js';
import crypto from 'node:crypto';
import * as Knowledge from './knowledge/store.js';

let storage, learning;
let PACKS = [];
export async function initTraining(s, learn) { storage = s; learning = learn; PACKS = (await s.readJSON('training.json', [])) || []; }
export const listPacks = () => PACKS;
export const getPack = id => PACKS.find(p => p.id === id) || null;

/* minimal ZIP reader (store + deflate), no dependencies.
   audit M2: every entry and the whole archive have a ceiling after decompression (no "zip bomb"),
   and every offset is checked before it is read. */
const MAX_ENTRY = 80 * 1024 * 1024, MAX_TOTAL = 900 * 1024 * 1024, MAX_FILES = 5000;
/* P1-T04: delegates to the hardened reader (traversal, duplicates, symlinks, CRC, sizes, methods) */
export function unzip(buf) { return readZip(buf, { maxFiles: MAX_FILES, maxEntry: MAX_ENTRY, maxTotal: MAX_TOTAL }); }
const safeRel = p => { const n = path.posix.normalize(String(p || '').replace(/\\/g, '/')).replace(/^\/+/, ''); if (!n || n.startsWith('..')) throw { status: 400, message: 'Cale invalidă în pachet: ' + p }; return n; };

/* P7-T01: files that are never ingested as knowledge (kept as inert attachments, never executed or learned) */
const SCRIPT = /\.(m?js|cjs|ts|sh|bash|bat|cmd|ps1|exe|dll|py|rb|php|pl|vbs|html?|svg|jar)$/i;
const FORBIDDEN_KEYS = ['charter', 'charters', 'agents', 'skills', 'system_prompt', 'settings', 'policies', 'rubric', 'blueprint', 'thresholds'];
export async function importPack(zipBuf) {
  const files = unzip(zipBuf);
  const manName = [...files.keys()].find(k => /(^|\/)training\.json$/.test(k) && k.split('/').length <= 2);
  if (!manName) throw { status: 400, message: 'Arhiva nu conține training.json.' };
  const root = manName.includes('/') ? manName.slice(0, manName.lastIndexOf('/') + 1) : '';
  let man; try { man = JSON.parse(files.get(manName).toString('utf8')); } catch { throw { status: 400, message: 'training.json nu e JSON valid.' }; }
  if (!/^[a-z0-9-]{3,60}$/.test(man.id || '')) throw { status: 400, message: 'training.json: „id” lipsește sau conține caractere nepermise.' };
  let stored = 0; const scriptFiles = [], texts = {}, list = [];
  for (const [name, data] of files) {
    if (!data || !name.startsWith(root) || name === manName) continue;
    const rel = safeRel(name.slice(root.length));
    await storage.writeFile(`training/${man.id}/${rel}`, data); stored++; list.push(rel);
    if (SCRIPT.test(rel)) scriptFiles.push(rel); else if (/\.(md|txt|json|csv)$/i.test(rel)) texts[rel] = data.toString('utf8');
  }
  const ignoredKeys = FORBIDDEN_KEYS.filter(k => k in man);   // an import can never touch the charter, skills, agents or active knowledge
  /* the previous import of the same pack is replaced: its source (and everything derived from it) is revoked first */
  for (const old of Knowledge.sourceByRef('training_pack', man.id)) await Knowledge.revokeSource(old.id, revokeDerived, 'înlocuit de un import nou');
  const src = await Knowledge.registerSource({ kind: 'training_pack', ref: man.id, label: man.name || man.id, sha256: crypto.createHash('sha256').update(zipBuf).digest('hex'), files: list, rights: man.rights ? { status: 'declared', declared: man.rights } : null, meta: { age: man.age || null } });
  const read = rel => texts[safeRel(rel)] ?? '';
  const cands = [], unsafe = [], failed = [];
  let rules = man.lessons || [];
  if (man.lessons_file) { try { rules = JSON.parse(read(man.lessons_file) || '[]'); } catch { failed.push({ kind: 'lessons_file', ref: man.lessons_file, reason: 'JSON invalid' }); rules = []; } }
  for (const r of Array.isArray(rules) ? rules : []) {
    if (!r?.agent || !String(r?.text || '').trim()) { failed.push({ kind: 'lesson', ref: r?.ref || null, reason: 'agent sau text lipsă' }); continue; }
    if (textSafety(r.text).verdict === 'BLOCK') { unsafe.push({ kind: 'lesson', ref: r.ref || r.text.slice(0, 60) }); continue; }   // P5-T01
    cands.push({ type: 'lesson', agent: r.agent, text: r.text, age: r.age || null, scope: r.scope || 'project', ref: r.ref || null, evidence: r.evidence && typeof r.evidence === 'object' ? { file: String(r.evidence.file || ''), quote: String(r.evidence.quote || '').slice(0, 400) } : null });
  }
  for (const w of man.world_rules || []) if (String(w || '').trim()) cands.push({ type: 'world_rule', agent: 'pastrator-continuitate', text: String(w), scope: 'project' });
  for (const ex of man.text_examples || []) {
    const md = read(ex.file); if (!md) { failed.push({ kind: 'example', ref: ex.file, reason: 'fișier lipsă' }); continue; }
    const pages = parseStory(md, ex.language_marker);
    if (!pages.length) { failed.push({ kind: 'example', ref: ex.file, reason: 'nicio pagină recunoscută' }); continue; }
    if (pages.some(pg => textSafety(pg.text || pg).verdict === 'BLOCK')) { unsafe.push({ kind: 'example', ref: ex.file }); continue; }
    cands.push({ type: 'example', agent: 'scriitor', text: `${ex.title || ex.file}: ${pages.slice(0, 2).join(' ')}`.slice(0, 600), evidence: { file: ex.file }, payload: { pid: `training:${man.id}:${ex.language}`, volume: ex.volume ?? 0, age: ex.age || man.age, language: ex.language, theme: ex.theme || man.name, title: ex.title || '', pages } });
  }
  for (const x of (man.image_examples || []).filter(x => x.verdict === 'reject' && x.issue)) cands.push({ type: 'failure', agent: 'director-artistic', text: x.issue, payload: { pack: man.id, dimension: x.dimension || 'anatomy', issue: x.issue, fix: x.fix || '', ref: x.lesson || null } });
  const created = await Knowledge.addCandidates(src.id, cands, { sourceFiles: texts, active: learning.listLessons().filter(l => l.status === 'active') });
  const pack = { ...Object.fromEntries(Object.entries(man).filter(([k]) => !FORBIDDEN_KEYS.includes(k))), importedAt: now(), files: stored, sourceId: src.id,
    applied: { lessons: 0, examples: 0, failures: 0, candidates: created.filter(c => c.status === 'candidate').length, quarantined: created.filter(c => c.status === 'quarantined').length, failed: failed.length, failedItems: failed, unsafeSkipped: unsafe, scriptFiles, ignoredKeys } };
  PACKS = PACKS.filter(p => p.id !== man.id); PACKS.push(pack);
  await storage.writeJSON('training.json', PACKS); bus.emit('change', { scope: 'learning' });
  return pack;
}
/** Undo one promoted item (revocation index entry). */
export async function revokeDerived(d) {
  if (d.kind === 'lesson') await learning.setLessonStatus(d.id, 'revoked');
  else if (d.kind === 'example') await learning.removeExample(d.pid, d.volume);
  else if (d.kind === 'failure') await learning.setKnownFailures(d.key, []);
}
/** Explicit operator promotion of one candidate (P7-T02 adds validation and scope gates in front of it). */
export async function applyCandidate(c, { pid = null } = {}) {
  if (c.type === 'lesson' || c.type === 'world_rule') {   // P7-T02: a promoted rule starts in ONE project; widening needs evidence (promotion report)
    if (!pid) throw { status: 400, code: 'project_required', message: 'Alege proiectul în care se aplică regula; lărgirea la vârstă sau la tot rolul cere dovezi din mai multe proiecte.' };
    const l = await learning.addManualLesson({ agent: c.agent, text: c.text, age: c.age, scope: 'project', ref: c.ref, source: 'training', provenance: { sourceId: c.sourceId, candidateId: c.id } });
    l.pid = pid; l.projects = [pid]; await learning.persistLessons(); return { kind: 'lesson', id: l.id }; }
  if (c.type === 'example') { await learning.addExample({ ...c.payload, provenance: { sourceId: c.sourceId, candidateId: c.id } }); return { kind: 'example', pid: c.payload.pid, volume: c.payload.volume }; }
  if (c.type === 'failure') { await learning.setKnownFailures('kc:' + c.id, [c.payload]); return { kind: 'failure', key: 'kc:' + c.id }; }
  throw { status: 400, message: 'Tip de candidat necunoscut.' };
}
/* "**EN:** text" / "**RO:** text" lines of a story file, in page order */
function parseStory(md, marker) {
  const i = md.search(/^##\s/m); if (i > 0) md = md.slice(i);          // page lines start at the first page heading (skip the title block)
  const re = new RegExp(`\\*\\*${marker || 'EN'}:\\*\\*\\s*(.+)`, 'g'); const out = []; let m;
  while ((m = re.exec(md))) out.push(m[1].trim());
  return out;
}
export async function deletePack(id) {
  PACKS = PACKS.filter(p => p.id !== id); await storage.writeJSON('training.json', PACKS);
  for (const src of Knowledge.sourceByRef('training_pack', id)) await Knowledge.revokeSource(src.id, revokeDerived, 'pachet șters');   // P7-T01: complete source-derived revocation
  await learning.setKnownFailures(id, []); await storage.remove(`training/${id}`).catch(() => {});
  bus.emit('change', { scope: 'learning' });
}
export async function packFile(id, rel) { return storage.readFile(`training/${id}/${safeRel(rel)}`); }
