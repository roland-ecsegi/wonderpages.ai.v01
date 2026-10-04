/** Matched database + file snapshots. Restore is explicit and requires an idle application. */
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
import {CORE_TABLES,LEDGER_TABLES,SCHEMA_VERSION} from './persistence/migrations.js';
import {readFileSync} from 'node:fs';
/* P8-T02: what a snapshot carries besides its inventory — app/schema versions and counts of the recoverable entities */
const PKG=(()=>{try{return JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));}catch{return {};}})();
export const appVersions=()=>({version:PKG.version||null,edition:PKG.edition||null,schemaVersion:SCHEMA_VERSION});
const ENTITY=[['projects',/^projects\/[^/]+\/project\.json$/],['decisions',/^projects\/[^/]+\/decisions\/[^/]+\.json$/],['jobs',/^projects\/[^/]+\/jobs\/[^/]+\.json$/],['artifactVersions',/^projects\/[^/]+\/versions\/.+\.json$/],['assets',/^projects\/[^/]+\/(images|uploads|refs|raw)\//],['knowledge',/^knowledge\/[^/]+\.json$/],['releaseCandidates',/^projects\/[^/]+\/release-candidates\//],['migrations',/^_migrations\/[^/]+\.json$/]];
/** Counts per entity from the data files (+ the database rows on PostgreSQL). */
export function entitySummary(paths,database=null){
  const out=Object.fromEntries(ENTITY.map(([k])=>[k,0]));for(const p of paths)for(const [k,re] of ENTITY)if(re.test(p))out[k]++;
  if(database){out.projects+=(database.projects||[]).length;out.decisions+=(database.decision_records||[]).length;out.jobs+=(database.jobs||[]).length;out.artifactVersions+=(database.artifact_versions||[]).length;out.migrations+=(database.migration_runs||[]).length;out.rows=Object.fromEntries(Object.entries(database).map(([t,r])=>[t,r.length]));}
  return out;
}
const TABLES=[...CORE_TABLES,...LEDGER_TABLES];   // P2-T01: ledger tables travel with the snapshot
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const within=(root,file)=>file.startsWith(path.resolve(root)+path.sep);
async function files(root,base=root,out=[]){for(const e of await fs.readdir(root,{withFileTypes:true})){const p=path.join(root,e.name);if(e.isSymbolicLink())throw Error('Snapshotul nu acceptă legături simbolice.');if(e.isDirectory())await files(p,base,out);else out.push({path:path.relative(base,p).split(path.sep).join('/'),sha256:hash(await fs.readFile(p)),bytes:(await fs.stat(p)).size});}return out;}
export async function saveSnapshot(storage,dest){
  const source=storage.kind==='postgres'?storage.files.root:storage.root;
  if(path.resolve(dest)===path.resolve(source)||within(source,path.resolve(dest)))throw Error('Backupul trebuie salvat în afara datelor active.');
  await storage.flush?.();
  try{await fs.access(dest);throw Error('Backupul existent nu poate fi suprascris.');}catch(e){if(e.code!=='ENOENT')throw e;}
  const stage=path.resolve(dest)+'.part-'+crypto.randomBytes(4).toString('hex');await fs.mkdir(stage,{recursive:true});
  try{
  let database=null;
  if(storage.kind==='postgres'){
    const tx=await storage.pool.connect();try{await tx.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');database={};for(const t of TABLES)database[t]=(await tx.query('SELECT * FROM '+t)).rows;await tx.query('COMMIT');}catch(e){await tx.query('ROLLBACK');throw e;}finally{tx.release();}
  }
  await fs.cp(source,path.join(stage,'files'),{recursive:true});
  if(database)await fs.writeFile(path.join(stage,'database.json'),JSON.stringify(database));
  const inventory=await files(stage);const summary=entitySummary(inventory.filter(f=>f.path.startsWith('files/')).map(f=>f.path.slice(6)),database);await fs.writeFile(path.join(stage,'manifest.json'),JSON.stringify({version:1,kind:storage.kind,at:Date.now(),app:appVersions(),summary,files:inventory},null,2));await fs.rename(stage,dest);return {folder:dest,files:inventory.length};
  }finally{await fs.rm(stage,{recursive:true,force:true});}
}
export async function verifySnapshot(folder){
  const m=JSON.parse(await fs.readFile(path.join(folder,'manifest.json'),'utf8'));
  if(m.version!==1||!Array.isArray(m.files)||!m.files.length)throw Error('Manifest de backup invalid.');
  for(const item of m.files){const f=path.resolve(folder,item.path);if(!within(folder,f))throw Error('Cale de backup invalidă.');if(hash(await fs.readFile(f))!==item.sha256)throw Error('Backup deteriorat: '+item.path);}
  return m;
}
/** Listing measures files on disk; missing/unreadable sizes are never reported as zero. */
export async function listSnapshots(root){
  let entries;
  try{entries=await fs.readdir(root,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return [];throw e;}
  async function measure(folder){
    let bytes=0,fileCount=0;
    for(const entry of await fs.readdir(folder,{withFileTypes:true})){
      const file=path.join(folder,entry.name),stat=await fs.lstat(file);
      if(stat.isSymbolicLink())throw Error('Backupul conține o legătură simbolică.');
      if(stat.isDirectory()){const child=await measure(file);bytes+=child.bytes;fileCount+=child.fileCount;}
      else if(stat.isFile()){bytes+=stat.size;fileCount++;}
      else throw Error('Backupul conține un fișier incompatibil.');
    }
    return {bytes,fileCount};
  }
  return Promise.all(entries.filter(e=>/^backup-v03-\d+\.wbackup$/.test(e.name)).map(async entry=>{
    const item={file:entry.name,at:Number(entry.name.match(/(\d+)\.wbackup$/)[1]),format:'wbackup'};
    try{if(!entry.isDirectory()||entry.isSymbolicLink())throw Error('Backupul complet trebuie să fie un director.');return {...item,...await measure(path.join(root,entry.name))};}
    catch(e){return {...item,bytes:null,fileCount:null,error:e.message};}
  }));
}
/* the schema rows of the running installation are kept when an older snapshot has none */
const tx0=async storage=>(await storage.q('SELECT * FROM schema_migrations')).rows;
export async function restoreSnapshot(storage,folder,{fault=null}={}){
  const manifest=await verifySnapshot(folder);if(manifest.kind!==storage.kind)throw Error('Tipul stocării nu se potrivește backupului.');
  if((manifest.app?.schemaVersion||0)>SCHEMA_VERSION)throw Error(`Backupul vine dintr-o versiune mai nouă a aplicației (schema ${manifest.app.schemaVersion} > ${SCHEMA_VERSION}): actualizează aplicația înainte de restaurare.`);
  const target=path.resolve(storage.kind==='postgres'?storage.files.root:storage.root);
  if(target===path.parse(target).root)throw Error('Director de date invalid.');
  const stage=target+'.restore-'+crypto.randomBytes(4).toString('hex'),previous=stage+'.previous';
  await fs.cp(path.join(folder,'files'),stage,{recursive:true});let swapped=false,tx=null;
  try{
    if(storage.kind==='postgres'){
      const database=JSON.parse(await fs.readFile(path.join(folder,'database.json'),'utf8'));
      if(CORE_TABLES.some(t=>!Array.isArray(database[t])))throw Error('Baza din backup este incompletă.');
      for(const t of LEDGER_TABLES)if(!Array.isArray(database[t]))database[t]=t==='schema_migrations'?(await tx0(storage)):[];   // older snapshot: newer ledger tables start empty
      tx=await storage.pool.connect();await tx.query('BEGIN');
      for(const t of [...TABLES].reverse())await tx.query('DELETE FROM '+t);
      for(const t of TABLES)for(const row of database[t]){
        const cols=Object.keys(row);if(cols.some(k=>!/^\w+$/.test(k)))throw Error('Coloană invalidă în backup.');
        await tx.query('INSERT INTO '+t+' ('+cols.join(',')+') VALUES ('+cols.map((_,i)=>'$'+(i+1)).join(',')+')',cols.map(k=>row[k]&&typeof row[k]==='object'&&!(row[k] instanceof Date)?JSON.stringify(row[k]):row[k]));
      }
      for(const t of ['review_events','outbox'])await tx.query(`SELECT setval(pg_get_serial_sequence('${t}','id'),COALESCE((SELECT MAX(id) FROM ${t}),1),(SELECT COUNT(*)>0 FROM ${t}))`);
    }
    if(fault==='before-swap')throw Error('Oprire simulată înainte de înlocuirea datelor.');
    await fs.rename(target,previous);try{await fs.rename(stage,target);swapped=true;}catch(e){await fs.rename(previous,target);throw e;}
    if(fault==='before-commit')throw Error('Oprire simulată înainte de confirmarea bazei de date.');
    if(tx)await tx.query('COMMIT');
    // Failure to remove the retained safety directory must not roll back a committed database.
    await fs.rm(previous,{recursive:true,force:true}).catch(e=>console.warn('[snapshot cleanup]',e.message));return {restored:path.basename(folder),files:manifest.files.length};
  }catch(e){if(tx)await tx.query('ROLLBACK');if(swapped){await fs.rm(target,{recursive:true,force:true});await fs.rename(previous,target);}throw e;}finally{tx?.release();await fs.rm(stage,{recursive:true,force:true});}
}

/**
 * P8-T02 — what a restore actually recovered, measured against the snapshot manifest (never assumed):
 * every data file by hash, database rows per table, entity counts (projects, decisions, jobs, versions, assets,
 * knowledge, release candidates, migrations) and the app/schema versions of both sides. An older snapshot without
 * versions is reported as such; newer tables that the snapshot did not have start empty and are named.
 */
export async function recoveryReport(storage,folder){
  const m=JSON.parse(await fs.readFile(path.join(folder,'manifest.json'),'utf8')),root=path.resolve(storage.kind==='postgres'?storage.files.root:storage.root);
  const expected=m.files.filter(f=>f.path.startsWith('files/')),missing=[],changed=[];
  for(const f of expected){const live=path.join(root,f.path.slice(6));let b;try{b=await fs.readFile(live);}catch{missing.push(f.path.slice(6));continue;}if(hash(b)!==f.sha256)changed.push(f.path.slice(6));}
  let database=null,rows=null;
  if(storage.kind==='postgres'){database=JSON.parse(await fs.readFile(path.join(folder,'database.json'),'utf8'));rows={};for(const t of TABLES){const live=Number((await storage.q('SELECT COUNT(*)::int AS n FROM '+t)).rows[0].n);rows[t]={snapshot:Array.isArray(database[t])?database[t].length:null,live};}}
  const after=entitySummary((await files(root)).map(f=>f.path),null);
  if(rows){after.projects+=rows.projects.live;after.decisions+=rows.decision_records.live;after.jobs+=rows.jobs.live;after.artifactVersions+=rows.artifact_versions.live;after.migrations+=rows.migration_runs.live;}
  const before=m.summary||entitySummary(expected.map(f=>f.path.slice(6)),database);
  const entities=Object.fromEntries(Object.keys(before).filter(k=>k!=='rows').map(k=>[k,{snapshot:before[k],restored:after[k]??null}]));
  const rowMismatch=rows?Object.entries(rows).filter(([t,r])=>r.snapshot!=null&&t!=='schema_migrations'&&r.snapshot!==r.live).map(([t])=>t):[];
  const newerEmpty=rows?Object.entries(rows).filter(([,r])=>r.snapshot==null).map(([t])=>t):[];
  const versions={snapshot:m.app||null,current:appVersions(),note:m.app?null:'Backup dintr-o versiune mai veche: versiunea aplicației nu era înregistrată.'};
  const ok=!missing.length&&!changed.length&&!rowMismatch.length&&Object.entries(entities).every(([,e])=>e.snapshot===e.restored);
  return {ok,snapshot:path.basename(folder),at:m.at,kind:m.kind,inventory:{expected:expected.length,matched:expected.length-missing.length-changed.length,missing,changed},rows,rowMismatch,newerTablesEmpty:newerEmpty,entities,versions};
}
