/**
 * Fișierele finale: un folder per proiect (PDF-uri, imagini, referințe, detalii de publicare)
 * și o arhivă ZIP. Fără dependențe: ZIP-ul e scris direct (metoda "store"; PDF/PNG sunt deja comprimate).
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { config, APP_EDITION } from './config.js';
import { safeCode, inside } from './sanitize.js';
import { deliveryFingerprint, currentReceipts, deliveryComplete } from './delivery.js';
import { fileHash, fingerprint } from './contracts.js';
import { saveSnapshot } from './snapshot.js';
const fingerprintReceipt = fileHash;

const slug = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'proiect';
const pad = n => String(n).padStart(2, '0');
let OUT = config.outputDir;
export const outputDir = () => OUT;
export function setOutputDir(d) { OUT = d; }
/* a second destination (e.g. Google Drive for desktop): every delivery is copied there too */
let MIRROR = null;
export const outputMirror = () => MIRROR;
export function setOutputMirror(d) { MIRROR = d || null; }
async function copyAny(src, dst) {
  const st = await fsp.stat(src);
  if (st.isDirectory()) { await fsp.mkdir(dst, { recursive: true }); for (const e of await fsp.readdir(src)) await copyAny(path.join(src, e), path.join(dst, e)); }
  else { await fsp.mkdir(path.dirname(dst), { recursive: true }); await fsp.copyFile(src, dst); }
}
export async function mirrorDelivery(paths) {
  if (!MIRROR) return null;
  const done = [];
  for (const p of paths.filter(Boolean)) { const rel = path.relative(OUT, p); if (rel.startsWith('..')) continue; await copyAny(p, path.join(MIRROR, rel)); done.push(path.join(MIRROR, rel)); }
  return { dir: MIRROR, copied: done.length };
}
/* audit C1: the folder name is built only from a validated code and a slug; it can never leave the output folder */
export function projectFolder(p) {
  const dir = path.join(OUT, `${safeCode(p.code) || 'wp'}-${slug(p.title)}`);
  if (!inside(OUT, dir) || path.resolve(dir) === path.resolve(OUT)) throw { status: 400, message: 'Numele folderului proiectului nu e valid.' };
  return dir;
}

/* ---------- zip ---------- */
const T = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = b => { let c = ~0; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (~c) >>> 0; };
async function walk(dir, base = dir, out = []) {
  for (const e of await fsp.readdir(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) await walk(f, base, out); else out.push({ abs: f, rel: path.relative(base, f).split(path.sep).join('/') });
  }
  return out;
}
export async function zipDir(dir, outFile, rootName) {
  const files = await walk(dir);
  const d = new Date(); const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1); const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const ws = fs.createWriteStream(outFile);
  let streamError=null;
  ws.on('error',e=>{streamError=e;});
  const write = b => streamError ? Promise.reject(streamError) : new Promise((res, rej) => ws.write(b, e => (e ? rej(e) : res())));
  let offset = 0; const central = [];
  try {
  for (const f of files) {
    const data = await fsp.readFile(f.abs); const name = Buffer.from(`${rootName}/${f.rel}`, 'utf8'); const crc = crc32(data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(0, 8); h.writeUInt16LE(time, 10); h.writeUInt16LE(date, 12);
    h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(name.length, 26); h.writeUInt16LE(0, 28);
    await write(h); await write(name); await write(data);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(0, 10); c.writeUInt16LE(time, 12); c.writeUInt16LE(date, 14);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([c, name]));
    offset += 30 + name.length + data.length;
  }
  const cd = Buffer.concat(central); await write(cd);
  const e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(offset, 16);
  await write(e); await new Promise((resolve,reject)=>{if(streamError)return reject(streamError);ws.once('error',reject);ws.end(resolve);});
  return { files: files.length, bytes: offset + cd.length + 22 };
  } catch(e) { ws.destroy();throw e; }
}

/* ---------- final package ---------- */
export async function buildPackage(repo, p, { vol = null, approved = null } = {}) {
  const opts = { approved };
  const root = projectFolder(p); const destination = vol == null ? path.join(root,"Collection-Final") : path.join(root, `Volumul-${pad(vol + 1)}`); const folder = destination + ".stage-" + Date.now(); const bp = await repo.getBlueprint(p.id); const art = await repo.artifacts(p.id);
  try {
  if (typeof approved !== 'function') throw { status: 409, message: 'Lipsește contractul de aprobare pentru pachet.' };
  const requested = vol == null ? Array.from({ length: bp.structure.volumes }, (_, v) => v) : [vol];
  for (const v of requested) if (!approved(v) || !art['final_' + v]) throw { status: 409, message: 'Volumul ' + (v + 1) + ' este incomplet sau neaprobat.' };
  const receipts = requested.flatMap(v => currentReceipts(p, bp, art, v));
  const final = requested.every(v => deliveryComplete(p, bp, currentReceipts(p, bp, art, v)));
  for (const e of receipts) { const buf = await fsp.readFile(path.join(root, 'PDF', e.name)); if (fingerprintReceipt(buf) !== e.sha256) throw { status: 409, message: 'Un PDF a fost modificat după verificare; regenerează livrarea.' }; }
  if (vol == null) {await fsp.mkdir(path.join(folder,'PDF'),{recursive:true});for(const e of receipts)await fsp.copyFile(path.join(root,'PDF',e.name),path.join(folder,'PDF',e.name));}
  if (vol != null) { await fsp.rm(folder, { recursive: true, force: true }); await fsp.mkdir(folder, { recursive: true }); for (const f of receipts.map(e => e.name)) await fsp.copyFile(path.join(root, 'PDF', f), path.join(folder, f)); }
  const S = bp.structure; const vols = [];
  for (let v = 0; v < S.volumes; v++) {
    if (vol != null && v !== vol) continue;
    const src = art[`final_${v}`]?.content; if (!src) throw { status: 409, message: 'Lipsește textul final.' };                  // audit H1: never the unapproved script as a stand-in
    if (!opts.approved(v)) throw { status: 409, message: 'Aprobarea volumului nu mai este valabilă.' };
    const dir = vol == null ? path.join(folder, 'Imagini', `Volumul-${pad(v + 1)}`) : path.join(folder, 'Extra', 'Imagini'); await fsp.mkdir(dir, { recursive: true });
    let n = 0;
    for (let pg = 0; pg <= S.pages; pg++) {
      const c = art[`ill_${v}_${pg}`]?.content; if (!c) continue;
      for (const rel of [c.color, c.lineart]) if (rel) { await fsp.writeFile(path.join(dir, path.basename(rel)), await repo.readFile(p.id, rel)); n++; }
    }
    const cv = art[`canva_${v}`]?.content;                                   // v19 (plan 2.8/2.9): cover and promo files made from your Canva brand template
    if (cv?.pdf || cv?.promo?.length) { const cdir = vol == null ? path.join(folder, 'Canva', `Volumul-${pad(v + 1)}`) : path.join(folder, 'Extra', 'Canva'); await fsp.mkdir(cdir, { recursive: true });
      for (const rel of [cv.pdf, ...(cv.promo || []).map(x => x.file)].filter(Boolean)) { await fsp.writeFile(path.join(cdir, path.basename(rel)), await repo.readFile(p.id, rel)); n++; } }
    const tr = art[`tr_${v}`]?.content;
    vols.push({ v, title: src.title, blurb: src.back_cover_blurb || '', title2: tr?.title, blurb2: tr?.back_cover_blurb, final: !!art[`final_${v}`], images: n, pages: (src.pages || []).length });
  }
  const refs = art.anchors?.content?.prompts || [];
  const extra = vol == null ? folder : path.join(folder, 'Extra');
  for (const r of refs) if (r.image) { await fsp.mkdir(path.join(extra, 'Referinte'), { recursive: true }); await fsp.writeFile(path.join(extra, 'Referinte', path.basename(r.image)), await repo.readFile(p.id, r.image)); }
  const brief = art.brief?.content || {}; const pf = art.preflight?.content?.checks || [];
  const fmt = bp.formats?.[p.input?.[bp.format_key]]; const style = bp.style_presets?.[p.input?.[bp.style_key]];
  const md = [
    `# ${brief.collection_title || p.title}`, '', brief.logline || '', '',
    `- Produs: ${p.typeName} (v${p.typeVersion})`, `- Vârstă: ${p.variantLabel}`, `- Limbi: ${[p.input?.language, p.input?.second_language].filter(Boolean).join(', ')}`,
    `- Stil: ${style?.label || ''}`, `- Format: ${fmt?.label || ''}`, `- Stare: ${p.status === 'completed' ? 'aprobat final' : 'neaprobat încă'}`, '',
    '## Volume', '',
    ...vols.flatMap(x => [`### ${x.v + 1}. ${x.title || ''}${x.title2 ? ` / ${x.title2}` : ''}`, '', x.blurb, ...(x.blurb2 ? ['', x.blurb2] : []), '', `- Pagini de conținut: ${x.pages} + copertă`, `- Text: final, aprobat`, `- Imagini exportate: ${x.images}`, '']),
    '## Verificări (preflight)', '', ...pf.map(c => `- ${c.status === 'pass' ? '[ok]' : c.status === 'warn' ? '[atenție]' : '[problemă]'} ${c.label}: ${c.detail}`), '',
    '## De știut la publicare', '',
    '- Amazon KDP cere un număr minim de pagini la cărțile tipărite (verifică limita actuală); o carte de 12 pagini + copertă poate fi sub limită. Variante: pagini de început (titlu, dedicație, copyright) cu format de interior adaptat separat fiecărui produs; perechea poveste + colorat se păstrează.',
    '- KDP cere declararea conținutului generat cu AI (text și imagini) la publicare.',
    '- PDF-urile sunt RGB. Dacă tipografia cere CMYK (PDF/X), conversia se face la tipografie.', ''
  ].join('\n');
  await fsp.mkdir(extra, { recursive: true }); await fsp.writeFile(path.join(extra, 'Detalii publicare.md'), md);
  const manifest = { edition: APP_EDITION, kind: final ? 'final' : 'assets-preview', completePDFs: final, project: p.id, blueprintVersion: bp.version, volumes: requested.map(v => ({ volume: v + 1, fingerprint: deliveryFingerprint(p, bp, art, v), artifacts: Object.fromEntries(Object.entries(art).filter(([k]) => /^(final|tr|ill)_/.test(k) && (k === 'final_' + v || k === 'tr_' + v || k.startsWith('ill_' + v + '_'))).map(([k, a]) => [k, a.version])) })), PDFs: receipts, at: Date.now() };
  await fsp.writeFile(path.join(folder, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const zip = vol == null ? root+'.zip' : destination+'.zip', pending=zip+'.part';
  const z = await zipDir(folder,pending,path.basename(destination));
  const previous=destination+'.previous';await fsp.rm(previous,{recursive:true,force:true});
  if(fs.existsSync(destination))await fsp.rename(destination,previous);
  try{await fsp.rename(folder,destination);await fsp.rename(pending,zip);}catch(e){if(fs.existsSync(previous)){await fsp.rm(destination,{recursive:true,force:true});await fsp.rename(previous,destination);}throw e;}
  await fsp.rm(previous,{recursive:true,force:true});
  const inventory=await walk(destination);const files=await Promise.all(inventory.map(async f=>({name:f.rel,sha256:fileHash(await fsp.readFile(f.abs))})));
  await fsp.writeFile(zip+'.receipt.json',JSON.stringify({manifest:fingerprint(manifest),sha256:fileHash(await fsp.readFile(zip)),files}));
  return {folder:destination,zip,final,manifest,...z};
  } finally {await fsp.rm(folder,{recursive:true,force:true});}
}

/* audit C1: no shell, the path is one argument (a quote or & in a name can never become a command) */
export function openFolder(dir) {
  if (!inside(OUT, dir)) throw { status: 400, message: 'Folder în afara destinației fișierelor finale.' };
  const exe = process.platform === 'win32' ? 'explorer.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  try { spawn(exe, [path.resolve(dir)], { detached: true, stdio: 'ignore', shell: false }).on('error', () => {}).unref(); } catch {}
}

/* ---------- daily database backup (PostgreSQL in Docker) + restore (audit M7) ---------- */
const dbInfo = () => {
  const url = (() => { try { return new URL(process.env.DATABASE_URL || ''); } catch { return null; } })();
  return { url, user: decodeURIComponent(url?.username || 'wonderpages'), db: (url?.pathname || '/wonderpages').slice(1) || 'wonderpages',
    containers: [...new Set([process.env.DB_CONTAINER, 'wonderpages-db', 'tiparnita-db'].filter(Boolean))] };
};
export const backupDir = () => path.join(OUT, '_backup');
/* runs pg_dump / psql inside the database container; without Docker (tests, a native PostgreSQL) the local tools are used */
function runDb(tool, args, { input = null, output = null } = {}) {
  const { url, user, db, containers } = dbInfo();
  const attempts = [...containers.map(c => ['docker', ['exec', ...(input ? ['-i'] : []), c, tool, '-U', user, ...args, db], process.env]),
    [tool, ['-h', url?.hostname || '127.0.0.1', '-p', url?.port || '5432', '-U', user, ...args, db], { ...process.env, PGPASSWORD: decodeURIComponent(url?.password || '') }]];
  return attempts.reduce((prev, [cmd, a, env]) => prev.catch(() => new Promise((res, rej) => {
    const p = spawn(cmd, a, { env, stdio: [input ? 'pipe' : 'ignore', output ? 'pipe' : 'ignore', 'pipe'] }); let err = '';
    if (output) p.stdout.pipe(output, { end: false }); p.stderr.on('data', d => { err += d; }); p.stdin?.on('error', () => {});
    p.on('error', rej); p.on('close', c => (c === 0 ? res() : rej(new Error(`${tool} cod ${c}: ${err.trim().slice(-300)}`))));
    if (input && p.stdin) fs.createReadStream(input).on('error', () => {}).pipe(p.stdin);
  })), Promise.reject(new Error('start')));
}
export async function backupNow(prefix = 'baza-de-date') {
  await fsp.mkdir(backupDir(), { recursive: true });
  const stamp = new Date().toISOString().slice(0, prefix === 'baza-de-date' ? 10 : 19).replace(/:/g, '-');
  const file = path.join(backupDir(), `${prefix}-${stamp}.sql`); const tmp = file + '.part';
  const out = fs.createWriteStream(tmp);
  try { await runDb('pg_dump', ['--clean', '--if-exists', '--no-owner'], { output: out }); await new Promise(r => out.end(r)); await fsp.rename(tmp, file); }
  catch (e) { out.destroy(); await fsp.rm(tmp, { force: true }).catch(() => {}); throw e; }
  if (MIRROR) { try { await fsp.mkdir(path.join(MIRROR, '_backup'), { recursive: true }); await fsp.copyFile(file, path.join(MIRROR, '_backup', path.basename(file))); } catch (e) { console.warn('[backup] copia în al doilea folder nu a reușit:', e.message); } }
  return file;
}
export async function listBackups() {
  const all = (await fsp.readdir(backupDir()).catch(() => [])).filter(f => /^baza-de-date.*\.sql$/.test(f)).sort().reverse();
  return Promise.all(all.map(async f => { const st = await fsp.stat(path.join(backupDir(), f)); return { file: f, bytes: st.size, at: st.mtimeMs }; }));
}
/* restores one daily backup; a safety backup of the current state is taken first */
export async function restoreBackup(name) {
  if (!/^baza-de-date[A-Za-z0-9-]*\.sql$/.test(String(name))) throw { status: 400, message: 'Nume de backup invalid.' };
  const file = path.join(backupDir(), name); await fsp.access(file).catch(() => { throw { status: 404, message: 'Backup inexistent.' }; });
  const head = (await fsp.readFile(file)).subarray(0, 4000).toString('utf8');
  if (!/PostgreSQL database dump/.test(head)) throw { status: 400, message: 'Fișierul nu e un backup al bazei de date.' };
  const safety = await backupNow('baza-de-date-inainte-de-restaurare');
  await runDb('psql', ['-v', 'ON_ERROR_STOP=1', '-q'], { input: file });
  return { restored: name, safety: path.basename(safety) };
}
export async function dailySnapshot(storage, exclusive = fn => fn()) {
  const dir = backupDir(); await fsp.mkdir(dir, { recursive: true });
  const day = new Date().toISOString().slice(0,10);
  for (const name of await fsp.readdir(dir)) if (/^backup-v03-\d+\.wbackup$/.test(name)) {
    const manifest = JSON.parse(await fsp.readFile(path.join(dir,name,'manifest.json'),'utf8'));
    if (manifest.purpose === 'daily' && new Date(manifest.at).toISOString().slice(0,10) === day) return MIRROR ? exclusive(async()=>({skipped:true,mirror:await mirrorBackup(path.join(dir,name))})) : { skipped: true };
  }
  return exclusive(async () => {
    const folder = path.join(dir,'backup-v03-'+Date.now()+'.wbackup');
    const result = await saveSnapshot(storage,folder);
    const manifestPath = path.join(folder,'manifest.json');
    const manifest = JSON.parse(await fsp.readFile(manifestPath,'utf8'));
    await fsp.writeFile(manifestPath,JSON.stringify({...manifest,purpose:'daily'},null,2));
    const mirror=await mirrorBackup(folder);
    await pruneDailySnapshots(dir);
    return {...result,mirror};
  });
}
export async function mirrorBackup(folder){
  try{return await mirrorDelivery([folder]);}catch(e){console.warn('[backup mirror]',e.message);return {error:e.message};}
}
async function pruneDailySnapshots(dir){
  const daily=[];
  for(const name of await fsp.readdir(dir))if(/^backup-v03-\d+\.wbackup$/.test(name)){
    const target=path.join(dir,name),m=JSON.parse(await fsp.readFile(path.join(target,'manifest.json'),'utf8'));
    if(m.version===1&&m.purpose==='daily')daily.push({target,at:m.at});
  }
  daily.sort((a,b)=>b.at-a.at);
  const realRoot=await fsp.realpath(dir);
  for(const item of daily.slice(14)){
    if((await fsp.lstat(item.target)).isSymbolicLink())throw Error('Backupul de reținut nu poate fi o legătură.');
    if(!inside(realRoot,await fsp.realpath(item.target)))throw Error('Backup în afara folderului configurat.');
    await fsp.rm(item.target,{recursive:true,force:true});
  }
}
export function scheduleBackups(storage, exclusive) {
  const run = async () => {
    try {
      const result = await dailySnapshot(storage,exclusive);
      if (!result.skipped) console.log('[backup] DB și fișiere salvate împreună',result.folder);
    } catch (e) { console.warn('[backup]', e.message); }
  };
  // Idle checks are supplied by the server; an active production is retried later.
  // Existing SQL and manual backups are retained; only daily v03 snapshots have 14-copy retention.
  setTimeout(run,5 * 60 * 1000).unref?.(); setInterval(run,60 * 60 * 1000).unref?.();
}
