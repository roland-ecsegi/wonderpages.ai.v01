import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {LocalStorage} from '../server/storage/local.js';
import {saveSnapshot,listSnapshots} from '../server/snapshot.js';
import {api,TMP} from './lib.mjs';

test('v04: dimensiunea backupului este măsurată pe disc, inclusiv fișierele și manifestul',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'wp-backup-size-')),storage=new LocalStorage(path.join(base,'data'));await storage.init();
 try{
  await storage.writeJSON('project.json',{title:'Generic project'});await storage.writeFile('images/reference.png',Buffer.alloc(1537,7));
  const root=path.join(base,'backups'),folder=path.join(root,'backup-v03-123.wbackup');await saveSnapshot(storage,folder);
  async function actual(dir){let bytes=0;for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);bytes+=e.isDirectory()?await actual(f):(await fs.stat(f)).size;}return bytes;}
  let [item]=await listSnapshots(root);assert.equal(item.bytes,await actual(folder));assert.ok(item.bytes>1537);assert.equal(item.fileCount,3);assert.equal(item.at,123);
  await fs.writeFile(path.join(folder,'files','extra.bin'),Buffer.alloc(71));[item]=await listSnapshots(root);assert.equal(item.bytes,await actual(folder));assert.equal(item.fileCount,4);
  await fs.mkdir(path.join(root,'backup-v03-456.wbackup.part-unfinished'));assert.equal((await listSnapshots(root)).length,1);
 }finally{await fs.rm(base,{recursive:true,force:true});}
});

test('v04: o dimensiune necunoscută nu este transformată în zero',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'wp-backup-invalid-'));
 try{assert.deepEqual(await listSnapshots(path.join(base,'missing')),[]);await fs.writeFile(path.join(base,'backup-v03-456.wbackup'),'not a directory');const [item]=await listSnapshots(base);assert.equal(item.bytes,null);assert.ok(item.error);await assert.rejects(listSnapshots(path.join(base,'backup-v03-456.wbackup')));}
 finally{await fs.rm(base,{recursive:true,force:true});}
});

test('v04: lista API raportează dimensiunea reală a copiei create și păstrează formatul restaurabil',async()=>{
 const made=await api('POST','backups');assert.equal(made.status,200);
 const listed=await api('GET','backups');assert.equal(listed.status,200);const item=listed.body.items.find(x=>x.file===made.body.file);assert.ok(item);assert.ok(item.bytes>0);assert.equal(item.format,'wbackup');
 const folder=path.join(TMP,'out','_backup',item.file);async function total(dir){let bytes=0;for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);bytes+=e.isDirectory()?await total(f):(await fs.stat(f)).size;}return bytes;}
 assert.equal(item.bytes,await total(folder));assert.ok(item.fileCount>0);
});

test('v04: interfața afișează B/KB/MB și tratează dimensiunea necunoscută distinct',async()=>{
 const source=await fs.readFile(new URL('../public/app/core.js',import.meta.url),'utf8');const line=source.split(/\r?\n/).find(x=>x.startsWith('function formatBytes('));assert.ok(line);const format=vm.runInNewContext('('+line+')');
 assert.equal(format(17),'17 B');assert.equal(format(0),'0 B');assert.equal(format(1024),'1 KB');assert.equal(format(1024*1024),'1 MB');assert.equal(format(null),'dimensiune necunoscută');assert.equal(format(-1),'dimensiune necunoscută');
});
