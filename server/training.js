/**
 * Pachete de antrenament: materiale reale (personaje, o poveste aprobată, imagini bune și greșite, lecții)
 * importate ca DATE, nu ca cod. Un pachet poate:
 *  - porni un proiect nou cu tema, personajele și povestea volumului 1 (tu decizi, nimic nu e fixat în aplicație);
 *  - învăța echipa: exemplele de text aprobate, tiparele de greșeli văzute în imagini, regulile din registrul de lecții.
 * Format: arhivă .zip cu training.json la rădăcină (sau într-un singur folder) + fișierele referite.
 */
import zlib from 'node:zlib';
import path from 'node:path';
import { bus, now } from './repo.js';

let storage, learning;
let PACKS = [];
export async function initTraining(s, learn) { storage = s; learning = learn; PACKS = (await s.readJSON('training.json', [])) || []; }
export const listPacks = () => PACKS;
export const getPack = id => PACKS.find(p => p.id === id) || null;

/* minimal ZIP reader (store + deflate), no dependencies.
   audit M2: every entry and the whole archive have a ceiling after decompression (no "zip bomb"),
   and every offset is checked before it is read. */
const MAX_ENTRY = 80 * 1024 * 1024, MAX_TOTAL = 900 * 1024 * 1024, MAX_FILES = 5000;
export function unzip(buf) {
  const bad = () => { throw { status: 400, message: 'Fișierul nu e o arhivă .zip validă.' }; };
  const tooBig = () => { throw { status: 413, message: 'Arhiva se despachetează în fișiere prea mari (limită de siguranță).' }; };
  if (!Buffer.isBuffer(buf) || buf.length < 22) bad();
  let e = buf.length - 22; const stop = Math.max(0, buf.length - 22 - 65535); while (e >= stop && buf.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < stop) bad();
  const n = buf.readUInt16LE(e + 10); let off = buf.readUInt32LE(e + 16); const out = new Map(); let total = 0;
  if (n > MAX_FILES) tooBig();
  for (let i = 0; i < n; i++) {
    if (off + 46 > buf.length || buf.readUInt32LE(off) !== 0x02014b50) break;
    const method = buf.readUInt16LE(off + 10), csize = buf.readUInt32LE(off + 20), usize = buf.readUInt32LE(off + 24), nlen = buf.readUInt16LE(off + 28), xlen = buf.readUInt16LE(off + 30), clen = buf.readUInt16LE(off + 32), lho = buf.readUInt32LE(off + 42);
    if (off + 46 + nlen > buf.length) bad();
    const name = buf.toString('utf8', off + 46, off + 46 + nlen); off += 46 + nlen + xlen + clen;
    if (name.endsWith('/')) continue;
    if (lho + 30 > buf.length) bad();
    const ln = buf.readUInt16LE(lho + 26), lx = buf.readUInt16LE(lho + 28); const start = lho + 30 + ln + lx;
    if (start + csize > buf.length) bad();
    if (usize > MAX_ENTRY || total + usize > MAX_TOTAL) tooBig();
    const data = buf.subarray(start, start + csize);
    let body = null;
    if (method === 8) { try { body = zlib.inflateRawSync(data, { maxOutputLength: MAX_ENTRY }); } catch (err) { if (err?.code === 'ERR_BUFFER_TOO_LARGE' || /buffer/i.test(err?.message || '')) tooBig(); bad(); } }
    else if (method === 0) body = Buffer.from(data);
    if (body) { total += body.length; if (total > MAX_TOTAL) tooBig(); }
    out.set(name, body);
  }
  return out;
}
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
  for (const r of rules) { if (r?.agent && r?.text) { await learning.addManualLesson({ agent: r.agent, text: r.text, age: r.age || null, scope: r.scope || (r.age ? 'age' : 'global'), ref: r.ref || null, source: 'training' }).catch(() => {}); lessons++; } }
  for (const ex of man.text_examples || []) {
    const md = await read(ex.file); if (!md) continue;
    const pages = parseStory(md, ex.language_marker);
    if (pages.length) { await learning.addExample({ pid: `training:${man.id}:${ex.language}`, volume: ex.volume ?? 0, age: ex.age || man.age, language: ex.language, theme: ex.theme || man.name, title: ex.title || '', pages }); examples++; }
  }
  const failures = (man.image_examples || []).filter(x => x.verdict === 'reject' && x.issue).map(x => ({ pack: man.id, dimension: x.dimension || 'anatomy', issue: x.issue, fix: x.fix || '', ref: x.lesson || null }));
  await learning.setKnownFailures(man.id, failures);
  const pack = { ...man, importedAt: now(), files: stored, applied: { lessons, examples, failures: failures.length } };
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
