import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {LocalStorage} from '../server/storage/local.js';import {saveSnapshot,restoreSnapshot,verifySnapshot} from '../server/snapshot.js';
import {dailySnapshot,setOutputDir,outputDir,zipDir,setOutputMirror,outputMirror,mirrorBackup} from '../server/output.js';
test('v03: backupul și restaurarea păstrează împreună documentele și imaginile',async()=>{
  const base=await fs.mkdtemp(path.join(os.tmpdir(),'wp-snapshot-')),s=new LocalStorage(path.join(base,'data'));await s.init();
  try{await s.writeJSON('projects/p123456/project.json',{title:'original'});await s.writeFile('projects/p123456/images/scene.png',Buffer.from('original image'));
    const snapshot=path.join(base,'backup');await saveSnapshot(s,snapshot);await s.writeJSON('projects/p123456/project.json',{title:'changed'});await s.writeFile('projects/p123456/images/scene.png',Buffer.from('changed image'));
    await restoreSnapshot(s,snapshot);assert.equal((await s.readJSON('projects/p123456/project.json')).title,'original');assert.equal((await s.readFile('projects/p123456/images/scene.png')).toString(),'original image');
    await fs.writeFile(path.join(snapshot,'files/projects/p123456/images/scene.png'),'corrupt');await assert.rejects(verifySnapshot(snapshot),/deteriorat/);assert.equal((await s.readFile('projects/p123456/images/scene.png')).toString(),'original image');
  }finally{await fs.rm(base,{recursive:true,force:true});}
});
test('v03: eșecul scrierii ZIP este raportat, fără închiderea procesului',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'wp-zip-fail-'));try{const source=path.join(base,'source'),destination=path.join(base,'destination');await fs.mkdir(source);await fs.mkdir(destination);await fs.writeFile(path.join(source,'test.txt'),'test');await assert.rejects(zipDir(source,destination,'test'));assert.equal((await fs.readFile(path.join(source,'test.txt'),'utf8')),'test');}finally{await fs.rm(base,{recursive:true,force:true});}
});
test('v03: copia zilnică trece prin blocarea operațiilor și păstrează DB/fișiere împreună',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'wp-snapshot-daily-')),s=new LocalStorage(path.join(base,'data')),previous=outputDir(),previousMirror=outputMirror();await s.init();setOutputDir(path.join(base,'output'));setOutputMirror(path.join(base,'mirror'));
 try{await s.writeJSON('test.json',{value:1});await assert.rejects(dailySnapshot(s,async()=>{throw Error('ocupat');}),/ocupat/);assert.deepEqual(await fs.readdir(path.join(base,'output','_backup')),[]);
 let locked=false;const r=await dailySnapshot(s,async fn=>{locked=true;return fn();});assert.equal(locked,true);assert.equal((await verifySnapshot(r.folder)).purpose,'daily');assert.equal((await verifySnapshot(path.join(base,'mirror','_backup',path.basename(r.folder)))).purpose,'daily');assert.equal((await dailySnapshot(s)).skipped,true);await s.writeJSON('test.json',{value:2});await restoreSnapshot(s,r.folder);assert.equal((await s.readJSON('test.json')).value,1);
 }finally{setOutputDir(previous);setOutputMirror(previousMirror);await fs.rm(base,{recursive:true,force:true});}
});
test('v03: o copie întreruptă nu devine backup valid și nu suprascrie copia existentă',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'wp-snapshot-atomic-')),s=new LocalStorage(path.join(base,'data'));await s.init();
 try{await s.writeJSON('test.json',{value:1});const good=path.join(base,'good');await saveSnapshot(s,good);await assert.rejects(saveSnapshot(s,good),/suprascris/);assert.ok(await verifySnapshot(good));
 const bad=path.join(base,'bad'),offline={kind:'postgres',files:{root:s.root},pool:{connect:async()=>({query:async q=>{if(q==='ROLLBACK')return {};throw Error('offline');},release(){}})}};await assert.rejects(saveSnapshot(offline,bad),/offline/);assert.equal((await fs.readdir(base)).some(x=>x.startsWith('bad')),false);
 }finally{await fs.rm(base,{recursive:true,force:true});}
});
test('v03: retenția păstrează 14 copii automate și toate copiile manuale',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'wp-snapshot-retention-')),s=new LocalStorage(path.join(base,'data')),previous=outputDir();await s.init();setOutputDir(path.join(base,'output'));
 try{await s.writeJSON('test.json',{value:1});const dir=path.join(base,'output','_backup');await fs.mkdir(dir,{recursive:true});
 for(let i=1;i<=16;i++){const at=Date.now()-i*86400e3,folder=path.join(dir,'backup-v03-'+at+'.wbackup');await saveSnapshot(s,folder);const m=JSON.parse(await fs.readFile(path.join(folder,'manifest.json'),'utf8'));await fs.writeFile(path.join(folder,'manifest.json'),JSON.stringify({...m,purpose:'daily',at}));}
 const manual=path.join(dir,'backup-v03-1.wbackup');await saveSnapshot(s,manual);await dailySnapshot(s);assert.equal((await fs.readdir(dir)).length,15);assert.ok(await verifySnapshot(manual));
 }finally{setOutputDir(previous);await fs.rm(base,{recursive:true,force:true});}
});
test('v03: eșecul copiei secundare este explicit și copia principală rămâne validă',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'wp-snapshot-mirror-fail-')),s=new LocalStorage(path.join(base,'data')),previous=outputDir(),previousMirror=outputMirror();await s.init();setOutputDir(path.join(base,'output'));const blocked=path.join(base,'mirror');await fs.writeFile(blocked,'not a folder');setOutputMirror(blocked);
 try{await s.writeJSON('test.json',{value:1});const folder=path.join(base,'output','_backup','backup-v03-1.wbackup');await saveSnapshot(s,folder);assert.ok((await mirrorBackup(folder)).error);assert.ok(await verifySnapshot(folder));}finally{setOutputDir(previous);setOutputMirror(previousMirror);await fs.rm(base,{recursive:true,force:true});}
});
