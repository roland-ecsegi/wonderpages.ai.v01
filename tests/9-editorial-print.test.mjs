import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {physicalPages,printDimensions} from '../server/printprofile.js';
import {editorialFindings} from '../server/editorial.js';
import {schemaFor,validateSchema} from '../server/schemas.js';
import {judgeLineart} from '../server/pngcheck.js';
import {LocalStorage} from '../server/storage/local.js';
import {initGovernor,recordCall,flushGovernor,canvaUsage,setCanvaSettings,beforeImage} from '../server/governor.js';
import {limitReset} from '../server/claudecode.js';
import {includedQuota} from '../server/subscription-usage.js';
import os from 'node:os';import path from 'node:path';
const bp=JSON.parse(fs.readFileSync(new URL('../blueprints/kids-sc.json',import.meta.url)));
test('v03: identitatea și paginile cer dovezi structurale, fără rescriere legacy',()=>{
  const art={bible:{content:{characters:[{id:'milo'}]}},final_0:{content:{pages:[{n:1,text:'x'}]}}};
  assert.equal(editorialFindings(bp,art,0).complete,false);assert.equal(editorialFindings({...bp,editorial_contract:null},art,0).issues[0].severity,'legacy-review');
  assert.match(validateSchema(art.bible.content,schemaFor(bp,'bible')),/name|canonical|approximate/);
});
test('v03: hook fără payoff și storyboard fără scop rămân probleme',()=>{
  const x=editorialFindings(bp,{final_0:{content:{pages:[{n:1,turn:{type:'question',hook:'Unde?',payoff_page:1,payoff:'aici'},storyboard:{shot:'wide'}}]}}},0);
  assert.ok(x.issues.some(i=>i.field==='hook_payoff'));assert.ok(x.issues.some(i=>i.field==='storyboard_purpose'));
});
test('v03: scenele diferă de paginile fizice și coperțile pentru tipar',()=>{
  const story=physicalPages(12,'color','kdp'),line=physicalPages(12,'lineart','kdp');
  assert.equal(story.length,28);assert.equal(line.length,26);assert.equal(story[3].illustrationOnly,true);assert.equal(story[4].textOnly,true);
  assert.equal(line.filter(p=>p.pg==='blank').length,12);assert.equal(story.some(p=>p.pg===0),false);
  assert.equal(physicalPages(12,'color','digital').length,14);
  assert.deepEqual(printDimensions({trim_w_in:8,trim_h_in:10},'kdp'),{width:8.125,height:10.25,minDpi:300,profile:'kdp'});
});
test('v03: un format vizual neverificat nu primește QA pozitiv',()=>assert.equal(judgeLineart(null,'3-4').ok,false));
test('v03: limita reală Claude săptămânală are resetare în fusul furnizorului',()=>assert.equal(limitReset("You've hit your weekly limit · resets Oct 4, 4pm (Europe/Bucharest)",Date.parse('2026-10-01T10:00:00Z')),Date.parse('2026-10-04T13:00:00Z')));
test('v03: soldul de credite nu permite continuarea după epuizarea limitei incluse',()=>{
 assert.throws(()=>includedQuota({rateLimits:{primary:{usedPercent:100,resetsAt:2000000000},credits:{hasCredits:true,balance:'1000'}}}),e=>e.code==='rate_limited');
 assert.throws(()=>includedQuota({}),e=>e.code==='quota_unknown');
 assert.equal(includedQuota({rateLimits:{primary:{usedPercent:50},credits:{hasCredits:true,balance:'1000'}}}).creditsContinuation,false);
});
test('v03: consumul se salvează la oprire și soldul Canva rămâne necunoscut',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'wp-governor-contract-')),s=new LocalStorage(root);await s.init();
  try{await initGovernor(s);await setCanvaSettings({allowance:1});recordCall('image');await flushGovernor();assert.equal((await s.readJSON('usage.json')).calls.length,1);assert.equal(canvaUsage().remaining,null);assert.equal(canvaUsage().quotaKnown,false);await assert.rejects(beforeImage(),e=>e.code==='rate_limited');await s.close();}finally{fs.rmSync(root,{recursive:true,force:true});}
});
