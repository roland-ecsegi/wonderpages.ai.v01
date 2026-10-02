/**
 * Ștergerea definitivă a unui proiect din spațiile gestionate de aplicație.
 * Ce se șterge:
 *  - baza de date: proiectul, blueprintul lui, documentele, comentariile, istoricul deciziilor (apoi VACUUM FULL, ca rândurile
 *    șterse să nu mai rămână nici în fișierele bazei);
 *  - fișierele: imaginile și încărcările din `data`, copia lor din `_backup/fisiere`, arhivele de export temporare;
 *  - folderul cu livrările (și copia din al doilea folder), proiectul din copiile de siguranță SQL (celelalte proiecte
 *    rămân în ele), fișierele trimise de aplicație în Google Drive;
 *  - urmele din învățare: registrul de consum, exemplele aprobate, lecțiile și propunerile legate doar de acest proiect.
 * Ce nu poate șterge aplicația (e în conturile tale) apare în raport, cu linkuri: imaginile și designurile din Canva.
 */
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { projectFolder, backupDir, outputMirror, outputDir, backupNow } from './output.js';
import { config } from './config.js';
import * as Ledger from './ledger.js';
import * as Learning from './learning.js';
import { safeCode } from './sanitize.js';

async function rmrf(p, report, label) {
  if (!p) return false;
  try { await fsp.lstat(p); } catch (e) { if (e.code === 'ENOENT') return false; throw e; }
  await fsp.rm(p, { recursive: true, force: true });
  report.removed.push(label || p); return true;
}

async function readableDir(dir, allowMissing = true) {
  try { return (await fsp.readdir(dir)).filter(x => x.endsWith('.sql')).map(x => path.join(dir, x)); }
  catch (e) { if (allowMissing && e.code === 'ENOENT') return []; throw { status: 503, message: `Folderul de copii nu poate fi accesat: ${dir}. Conectează discul și reîncearcă.` }; }
}

/* the rows of the "documents" table in a dump, by path (shared JSON documents such as lessons.json) */
export function documentRows(text) {
  const rows = new Map(); let inDocs = false;
  for (const line of text.split('\n')) {
    if (!inDocs) { if (/^COPY\s+(public\.)?documents\s/.test(line)) inDocs = true; continue; }
    if (line === '\\.') break;
    rows.set(line.split('\t')[0], line);
  }
  return rows;
}
/* removes one project from a pg_dump file: its own rows go; a shared document that mentions it (lessons, ledger, examples)
   is replaced by today's clean version when one is given, otherwise left as it is and counted in `kept` */
export async function scrubDump(file, pid, clean = null) {
  const text = await fsp.readFile(file, 'utf8'); const lines = text.split('\n'); const out = []; let table = null, dropped = 0, replaced = 0, kept = 0;
  for (const line of lines) {
    if (!table) { out.push(line); const m = line.match(/^COPY\s+(?:public\.)?(\w+)\s.*FROM stdin;/); if (m) table = m[1]; continue; }
    if (line === '\\.') { table = null; out.push(line); continue; }
    const f = line.split('\t');
    if (f.some(x => x === pid) || f[0].startsWith(`projects/${pid}/`)) { dropped++; continue; }
    if (table === 'documents' && (line.includes(pid))) { const c = clean?.get(f[0]); if (c && !c.includes(pid)) { out.push(c); replaced++; } else { out.push(line); kept++; } continue; }
    out.push(line);
  }
  if (dropped || replaced) { const tmp = file + '.scrub'; await fsp.writeFile(tmp, out.join('\n')); await fsp.rename(tmp, file); }
  return { dropped, replaced, kept, remaining: (out.join('\n').includes(pid) ? 1 : 0) };
}

export async function purgeProject({ repo, storage, gdrive, p }) {
  const pid = p.id; const report = { pid, title: p.title, removed: [], outside: [], errors: [] };
  const step = async (label, fn) => { try { await fn(); } catch (e) { report.errors.push(`${label}: ${e?.message || e}`); } };
  const art = await repo.artifacts(pid).catch(() => ({}));

  // Check every managed destination before changing the project. A disconnected mirror must not silently leave a copy.
  const dir = projectFolder(p), mirror = outputMirror();
  if (repo.listProjects().some(x => x.id !== pid && projectFolder(x) === dir))
    throw { status: 409, message: 'Un alt proiect folosește același folder de livrare. Schimbă destinația înainte de ștergere.' };
  await readableDir(backupDir());
  if (mirror) { await fsp.access(mirror).catch(() => { throw { status: 503, message: 'Al doilea folder de livrare nu este accesibil. Reconectează-l înainte de ștergere.' }; }); await readableDir(path.join(mirror, '_backup')); }

  /* 1. what lives in your accounts (collected before the data goes) */
  const canva = new Set();
  for (const [k, a] of Object.entries(art)) {
    const c = a?.content || {};
    if (k.startsWith('ill_') && c.link) canva.add(c.link);
    if (k === 'anchors') for (const x of c.prompts || []) if (x.link) canva.add(x.link);
    if (k.startsWith('canva_') && c.link) canva.add(c.link);
  }
  if (canva.size) report.outside.push({ where: 'Canva', note: 'Imaginile generate și copertele din șablon rămân în contul tău Canva (Canva nu permite ștergerea lor prin conector). Le ștergi din Canva: Proiecte > caută după titlu sau deschide linkurile de mai jos > Mută în coș, apoi golește coșul.', links: [...canva].slice(0, 200) });

  /* 2. Google Drive: the files this app uploaded (scope drive.file allows exactly these) */
  const links = [p.driveLink, ...Object.values(p.driveLinks || {})].filter(Boolean).join(' ');
  const driveIds = [...new Set([...(p.driveFiles || []).map(x => x.id || x), ...(links.match(/\/d\/([-\w]{20,})/g) || []).map(x => x.slice(3))])];
  if (driveIds.length && !gdrive?.status().connected) throw { status: 503, message: 'Google Drive nu este conectat. Reconectează-l înainte de ștergere, ca fișierele trimise acolo să nu rămână.' };
  for (const id of driveIds) { await gdrive.remove(id); report.removed.push(`Google Drive: fișierul ${id}`); }

  /* 3. deliveries in your output folder (+ the copy in the second folder) */
  await rmrf(dir, report, `Folderul livrărilor: ${dir}`); await rmrf(dir + '.zip', report, `Arhiva livrării: ${dir}.zip`);
  if (mirror) { const rel = path.relative(outputDir(), dir); const m = path.join(mirror, rel); await rmrf(m, report, `Copia din al doilea folder: ${m}`); await rmrf(m + '.zip', report, `Copia arhivei: ${m}.zip`); }
  await rmrf(path.join(backupDir(), 'fisiere', pid), report, 'Copia imaginilor din _backup/fisiere');

  /* 4. database + project files */
  await repo.deleteProject(pid); report.removed.push('Proiectul din baza de date (texte, imagini, aprobări, comentarii, istoric)');
  if (storage.q) await step('Documente', async () => { const r = await storage.q("DELETE FROM documents WHERE path LIKE $1", [`projects/${pid}/%`]); if (r.rowCount) report.removed.push(`${r.rowCount} documente ale proiectului`); });
  await step('Fișiere', async () => { await rmrf(path.join(config.storage.dataDir, 'projects', pid), report, 'Imaginile și încărcările proiectului'); });

  /* 5a. temporary exports and learning traces */
  await step('Exporturi temporare', async () => {
    const name = `${(safeCode(p.code) || 'wp')}-${String(p.title || 'proiect').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 50)}-proiect`;
    await rmrf(path.join(os.tmpdir(), `${name}.zip`), report, 'Arhiva de export temporară');
  });
  await step('Învățare', async () => {
    const n = await Ledger.purge(pid); const l = await Learning.purgeProject(pid);
    if (n) report.removed.push(`${n} rânduri din registrul de consum`);
    if (l.examples || l.lessons || l.proposals) report.removed.push(`Din învățare: ${l.examples} exemple aprobate, ${l.lessons} lecții ale proiectului, ${l.proposals} propuneri`);
    if (l.samples || l.variants || l.failures) report.removed.push('Statisticile agregate de preferințe, variante și erori vizuale au fost resetate, deoarece versiunile vechi nu păstrau proveniența pe proiect');
  });
  /* the old versions of every changed row are removed from the database files too */
  if (storage.q) await step('Curățarea bazei', async () => { await storage.q('VACUUM FULL projects, project_blueprints, artifacts, comments, review_events, documents'); report.removed.push('Spațiul rândurilor șterse din baza de date (VACUUM FULL)'); try { await storage.q('CHECKPOINT'); } catch {} });   // CHECKPOINT: the journal moves past the deleted rows (needs the owner role; ignored otherwise)

  /* 5. database backups: a clean backup is made now; every older one loses the project's rows and gets today's clean version of
     the shared documents (lessons, ledger, examples); the other projects stay in them */
  if (storage.kind === 'postgres') await step('Copii de siguranță', async () => {
    let clean = null, fresh = null;
    try { fresh = await backupNow(); clean = documentRows(await fsp.readFile(fresh, 'utf8')); report.removed.push(`O copie de siguranță nouă, fără proiect: ${path.basename(fresh)}`); } catch (e) { report.errors.push('Copie nouă: ' + (e?.message || e)); }
    let files = 0, rows = 0, left = 0; const dirs = [backupDir(), mirror && path.join(mirror, '_backup')].filter(Boolean);
    for (const d of dirs) for (const file of await readableDir(d)) {
      if (fresh && path.resolve(file) === path.resolve(fresh)) continue;
      const r = await scrubDump(file, pid, clean); if (r.dropped || r.replaced) { files++; rows += r.dropped + r.replaced; } left += r.kept;
      if (r.remaining) report.errors.push(`Copia ${path.basename(file)} încă menționează proiectul; verifică manual această copie.`);
    }
    if (files) report.removed.push(`Proiectul scos din ${files} copii de siguranță mai vechi (${rows} rânduri); celelalte proiecte au rămas în ele`);
    if (left) report.errors.push(`${left} documente de învățare din copiile vechi mai pomenesc proiectul (copia nouă nu a reușit); rulează din nou ștergerea după ce pornește Docker`);
  });

  return report;
}
