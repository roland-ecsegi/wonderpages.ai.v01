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

export async function importPack(zipBuf) {
  const files = unzip(zipBuf);
  const manName = [...files.keys()].find(k => /(^|\/)training\.json$/.test(k) && k.split('/').length <= 2);
  if (!manName) throw { status: 400, message: 'Arhiva nu conține training.json.' };
  const root = manName.includes('/') ? manName.slice(0, manName.lastIndexOf('/') + 1) : '';
  let man; try { man = JSON.parse(files.get(manName).toString('utf8')); } catch { throw { status: 400, message: 'training.json nu e JSON valid.' }; }
  if (!/^[a-z0-9-]{3,60}$/.test(man.id || '')) throw { status: 400, message: 'training.json: „id” lipsește sau conține caractere nepermise.' };
  let stored = 0;
  for (const [name, data] of files) {
    if (!data || !name.startsWith(root) || name === manName) continue;
    const rel = safeRel(name.slice(root.length));
    await storage.writeFile(`training/${man.id}/${rel}`, data); stored++;
  }
  const read = async rel => { try { return (await storage.readFile(`training/${man.id}/${safeRel(rel)}`)).toString('utf8'); } catch { return ''; } };
  /* what the team learns from the pack */
  let lessons = 0, examples = 0;
  const rules = man.lessons_file ? JSON.parse((await read(man.lessons_file)) || '[]') : (man.lessons || []);
  const unsafe = [];   // P5-T01: learning ingestion passes the same child-safety policy; BLOCK items are not learned
  for (const r of rules) { if (r?.agent && r?.text && textSafety(r.text).verdict === 'BLOCK') { unsafe.push({ kind: 'lesson', ref: r.ref || r.text.slice(0, 60) }); continue; } if (r?.agent && r?.text) { await learning.addManualLesson({ agent: r.agent, text: r.text, age: r.age || null, scope: r.scope || (r.age ? 'age' : 'global'), ref: r.ref || null, source: 'training' }).catch(() => {}); lessons++; } }
  for (const ex of man.text_examples || []) {
    const md = await read(ex.file); if (!md) continue;
    const pages = parseStory(md, ex.language_marker);
    if (pages.length && pages.some(pg => textSafety(pg.text || pg).verdict === 'BLOCK')) { unsafe.push({ kind: 'example', ref: ex.file }); continue; }
    if (pages.length) { await learning.addExample({ pid: `training:${man.id}:${ex.language}`, volume: ex.volume ?? 0, age: ex.age || man.age, language: ex.language, theme: ex.theme || man.name, title: ex.title || '', pages }); examples++; }
  }
  const failures = (man.image_examples || []).filter(x => x.verdict === 'reject' && x.issue).map(x => ({ pack: man.id, dimension: x.dimension || 'anatomy', issue: x.issue, fix: x.fix || '', ref: x.lesson || null }));
  await learning.setKnownFailures(man.id, failures);
  const pack = { ...man, importedAt: now(), files: stored, applied: { lessons, examples, failures: failures.length, unsafeSkipped: unsafe } };
  PACKS = PACKS.filter(p => p.id !== man.id); PACKS.push(pack);
  await storage.writeJSON('training.json', PACKS); bus.emit('change', { scope: 'learning' });
  return pack;
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
  await learning.setKnownFailures(id, []); await storage.remove(`training/${id}`).catch(() => {});
  bus.emit('change', { scope: 'learning' });
}
export async function packFile(id, rel) { return storage.readFile(`training/${id}/${safeRel(rel)}`); }
