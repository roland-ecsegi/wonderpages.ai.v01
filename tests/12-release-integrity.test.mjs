import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Repo } from '../server/repo.js';
import { schemaFor, validateSchema } from '../server/schemas.js';
import { deliveryComplete, currentReceipts, deliveryFingerprint } from '../server/delivery.js';
import { initEngine, reopenChangedReview, gateItems } from '../server/engine.js';
import { validateFinalPdf } from '../server/pdfcheck.js';
import { jsPDF } from 'jspdf';
import { api, INPUT, project, setFake } from './lib.mjs';
const bp=JSON.parse(fs.readFileSync(new URL('../blueprints/kids-sc.json',import.meta.url)));
test('v03: golul accidental este invalid; pagina intenționat fără text trece schema',()=>{
 const schema=schemaFor(bp,'script',{structure:{pages:1}}).properties.pages.items;
 const pg={n:1,text:'',characters:[],scene:'A quiet meadow',actions:[],purpose:'pause',emotion:'calm',new_information:'safe place',image_added_value:'butterfly',storyboard:{shot:'wide',angle:'eye-level',focal_action:'rest',direction:'still',lighting:'warm',rationale:'pause'},turn:{type:'quiet',purpose:'Inspect the hidden butterfly'},layout:{family:'intimate',text_zone:'bottom'}};
 assert.match(validateSchema(pg,schema),/page types/);pg.page_type='wordless';assert.equal(validateSchema(pg,schema),null);
});
test('v03: un eșec de stocare nu înlocuiește documentul bun din memorie',async()=>{
 let fail=false;const store={list:async()=>[],writeJSON:async()=>{if(fail)throw Error('disk full');}},repo=new Repo(store);await repo.createProject({id:'p1',title:'Old'},{});await repo.writeArtifact('p1','bible',{name:'Old'});fail=true;
 await assert.rejects(repo.patchProject('p1',{title:'Bad'}),/disk full/);assert.equal(repo.getProject('p1').title,'Old');
 await assert.rejects(repo.writeArtifact('p1','bible',{name:'Bad'}),/disk full/);assert.equal((await repo.artifacts('p1')).bible.content.name,'Old');
 fail=false;await Promise.all([repo.writeArtifact('p1','bible',{name:'A'}),repo.writeArtifact('p1','bible',{name:'B'})]);assert.equal((await repo.artifacts('p1')).bible.version,3);
});
test('v03: KDP cere coperta fiecărui produs, în același profil ca interiorul',()=>{
 const p={input:{},options:{}},small={structure:{volumes:1,books:[{key:'story'},{key:'coloring'}]}},art={};const hash=deliveryFingerprint(p,small,art,0);const receipt=book=>({book,lang:'first',fingerprint:hash,kind:'final',preset:'kdp'});
 art.delivery_0={content:{exports:['story','coloring'].map(receipt)}};assert.equal(deliveryComplete(p,small,currentReceipts(p,small,art,0)),false);
 art.delivery_0.content.exports.push(receipt('story-cover'),receipt('coloring-cover'));assert.equal(deliveryComplete(p,small,currentReceipts(p,small,art,0)),true);
 art.delivery_0.content.exports[1].preset='digital';assert.equal(currentReceipts(p,small,art,0).length,0);
});
test('v03: serverul verifică paginarea, dimensiunile și fontul în PDF-ul final',()=>{
 const make=(count,width=8)=>{const pdf=new jsPDF({unit:'in',format:[width,10],orientation:'portrait'});pdf.addFileToVFS('Andika.ttf',fs.readFileSync(new URL('../public/fonts/Andika-Regular.ttf',import.meta.url)).toString('base64'));pdf.addFont('Andika.ttf','Andika','normal');pdf.setFont('Andika');for(let i=0;i<count;i++){if(i)pdf.addPage([width,10]);pdf.text('Băltoacă și baltă',1,1);}return Buffer.from(pdf.output('arraybuffer'));};
 const p={input:{page_format:'portrait45'}};
 assert.equal(validateFinalPdf(make(14),bp,p,{book:'story',preset:'digital'}).pages,14);
 assert.throws(()=>validateFinalPdf(make(13),bp,p,{book:'story',preset:'digital'}),e=>e.status===400);
 assert.throws(()=>validateFinalPdf(make(14,9),bp,p,{book:'story',preset:'digital'}),e=>e.status===400);
});
test('v03: editarea unui volum anterior redeschide revizuirea chiar în timpul unui gate ulterior',async()=>{
 const store={list:async()=>[],writeJSON:async()=>{}},repo=new Repo(store);
 const small={structure:{pages:1,volumes:2},gates:{review:{items:[{kind:'text',source:'final'}]}},stages:[{key:'review',handler:'review_gate',gate:'review',per_volume:true}]};
 // Reuse the actual expanded production plan to preserve its gate indexing semantics.
 const production=structuredClone(bp);production.gates.review_2.items=[{kind:'text',source:'final'}];production.gates.review_collection.items=[];
 const {expandStages}=await import('../server/engine.js');const plan=expandStages(production),closed=plan.find(s=>s.handler==='review_gate'&&s.gate==='review_2'&&s.vol===0);
 const p={id:'p1',input:{},options:{images:false},stages:{[closed.key]:{status:'done'}},gate:{key:'review_1',vol:1},approvals:{}};
 await repo.createProject(p,production);await repo.writeArtifact('p1','final_0',{pages:Array.from({length:12},(_,i)=>({n:i+1,text:'Old'}))});
 const items=gateItems(production,await repo.artifacts('p1'),p,{key:'review_2',vol:0});p.approvals['review_2@0']=Object.fromEntries(items.map(i=>[i.id,{state:'approved',hash:i.hash}]));
 initEngine(repo,{});const c=structuredClone((await repo.artifacts('p1')).final_0.content);c.pages[0].text='New';await repo.writeArtifact('p1','final_0',c);assert.equal(p.gate.key,'review_2');assert.equal(p.gate.vol,0);
});
test('v03: schimbarea explicită a contractului este reversibilă și păstrează conținutul',async()=>{
 setFake({});const state=(await api('GET','state')).body;for(const p of state.projects)await api('POST',`projects/${p.id}/stop`);
 const p=(await api('POST','projects',{typeSlug:'kids-sc',input:INPUT})).body,old=await project(p.id);
 await api('POST',`projects/${p.id}/artifacts/brief`,{content:{collection_title:'Păstrat',logline:'Păstrat'}});
 const type=state.types.find(t=>t.slug==='kids-sc');const newer={...type,version:type.version+1};assert.equal((await api('PUT','types/kids-sc',newer)).status,200);
 assert.equal((await api('POST',`projects/${p.id}/blueprint-upgrade`,{})).status,200);let d=await project(p.id);assert.equal(d.blueprint.version,newer.version);assert.equal(d.artifacts.brief.content.collection_title,'Păstrat');assert.deepEqual(d.project.approvals,{});
 assert.equal((await api('POST',`projects/${p.id}/blueprint-upgrade`,{restore:true})).status,200);d=await project(p.id);assert.equal(d.blueprint.version,old.blueprint.version);assert.equal(d.artifacts.brief.content.collection_title,'Păstrat');
});
