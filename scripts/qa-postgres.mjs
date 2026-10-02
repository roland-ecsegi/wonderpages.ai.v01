/** Real PostgreSQL regression in a newly-created disposable database; production is read-only. */
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import pg from 'pg';import assert from 'node:assert/strict';
import {PostgresStorage} from '../server/storage/postgres.js';import {saveSnapshot,restoreSnapshot} from '../server/snapshot.js';
const installed=process.argv[2];if(!installed)throw Error('Indică folderul instalat pentru configurația locală.');
const text=await fs.readFile(path.join(installed,'.env'),'utf8'),m=text.match(/^DATABASE_URL=(.+)$/m);if(!m)throw Error('Configurarea PostgreSQL lipsește.');
const url=new URL(m[1].trim().replace(/^['"]|['"]$/g,''));const admin=new pg.Pool({connectionString:url.toString()});
const db='wp_v03_qa_'+Date.now();if(!/^wp_v03_qa_\d+$/.test(db))throw Error('Nume izolat invalid.');
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'wp-pg-qa-'));let s;
try{
  const before=(await admin.query('SELECT COUNT(*)::int AS n FROM projects')).rows[0].n;
  await admin.query('CREATE DATABASE '+db);url.pathname='/'+db;s=new PostgresStorage({databaseUrl:url.toString(),dataDir:path.join(tmp,'data')});await s.init();
  await s.writeJSON('projects/p123456/project.json',{id:'p123456',title:'Original',status:'ready'});await s.writeJSON('projects/p123456/artifacts/final_0.json',{key:'final_0',version:2,content:{title:'Original'},versions:[{version:1,content:{title:'First'}}]});await s.writeFile('projects/p123456/images/scene.png',Buffer.from('original image'));
  await s.writeJSON('settings.json',{imageEngine:'canva'});await s.logEvent('p123456','review',{approved:true});
  const backup=path.join(tmp,'snapshot');await saveSnapshot(s,backup);await s.writeJSON('settings.json',{imageEngine:'changed'});await s.writeFile('projects/p123456/images/scene.png',Buffer.from('changed image'));await s.deleteProject('p123456');
  await restoreSnapshot(s,backup);assert.equal((await s.readJSON('settings.json')).imageEngine,'canva');assert.equal((await s.readJSON('projects/p123456/artifacts/final_0.json')).versions[0].version,1);assert.equal((await s.readFile('projects/p123456/images/scene.png')).toString(),'original image');assert.equal((await s.q('SELECT COUNT(*)::int AS n FROM review_events')).rows[0].n,1);
  assert.equal(await s.exists('projects/pabsent/project.json'),false);
  await s.q("CREATE FUNCTION reject_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'transaction test'; END $$");await s.q('CREATE TRIGGER prevent_delete BEFORE DELETE ON projects FOR EACH ROW EXECUTE FUNCTION reject_delete()');
  await assert.rejects(s.deleteProject('p123456'));assert.ok(await s.readJSON('projects/p123456/artifacts/final_0.json'));assert.ok(await s.readJSON('projects/p123456/project.json'));assert.equal((await s.readFile('projects/p123456/images/scene.png')).toString(),'original image');
  assert.equal((await admin.query('SELECT COUNT(*)::int AS n FROM projects')).rows[0].n,before);
  console.log('PASS: PostgreSQL real — CRUD, istoric, backup DB+fișiere, restaurare, rollback tranzacțional; numărul proiectelor instalate păstrat.');
}finally{await s?.close();await admin.query('DROP DATABASE IF EXISTS '+db);await admin.end();await fs.rm(tmp,{recursive:true,force:true});}
