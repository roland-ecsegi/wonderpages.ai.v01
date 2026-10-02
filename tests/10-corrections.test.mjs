import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {api,setFake,project,waitStatus,waitFor,connectCanva,approveAll,INPUT} from './lib.mjs';
let pid;
test('v03 acceptare: pregătire pilot nou cu toate contractele',async()=>{
  setFake({});for(const p of (await api('GET','state')).body.projects) await api('POST',`projects/${p.id}/stop`);
  if (!(await api('GET','state')).body.services.canva.connected) await connectCanva();
  await api('PUT','settings/canva',{allowance:5000});await api('PUT','settings/budget',{budget5h:1000});
  pid=(await api('POST','projects',{typeSlug:'kids-sc',input:INPUT})).body.id;await api('POST',`projects/${pid}/start`);
  await waitStatus(pid,['awaiting_review']);await approveAll(pid);await waitStatus(pid,['awaiting_review']);await approveAll(pid);await waitStatus(pid,['awaiting_review']);
  const d=await project(pid);assert.equal(d.project.gate.key,'review_2');assert.equal(d.editorial.complete,true);assert.equal(d.review.items.filter(i=>i.kind==='layout').length,12);
});
test('v03 acceptare: pagina 4 color revine separat, coloratul se derivă după acceptarea culorii',async()=>{
  const before=await project(pid),old=before.artifacts.ill_0_4.content;const keep=before.review.items.find(i=>i.id==='text:final_0:3');
  await api('POST',`projects/${pid}/items`,{decisions:[{id:keep.id,state:'approved'},{id:'img:ill_0_4:color',state:'changes',note:'Zâmbet mai clar.'}]});
  await api('POST',`projects/${pid}/items/apply`);await waitStatus(pid,['awaiting_review']);let d=await project(pid);
  assert.notEqual(d.artifacts.ill_0_4.content.color,old.color);assert.equal(d.artifacts.ill_0_4.content.linePending,true);assert.equal(d.review.items.find(i=>i.id===keep.id).state,'approved');
  assert.ok(d.artifacts.ill_0_4.versions.some(v=>v.content.lineart===old.lineart));
  await api('POST',`projects/${pid}/items`,{decisions:[{id:'img:ill_0_4:color',state:'approved'}]});await waitStatus(pid,['awaiting_review']);d=await project(pid);
  assert.equal(d.artifacts.ill_0_4.content.lineFrom,d.artifacts.ill_0_4.content.color);assert.equal(d.review.items.find(i=>i.id==='img:ill_0_4:line').state,'pending');
});
test('v03 acceptare: corectura doar de colorat păstrează culoarea și aprobarea',async()=>{
  const old=(await project(pid)).artifacts.ill_0_4.content.color;
  await api('POST',`projects/${pid}/items`,{decisions:[{id:'img:ill_0_4:line',state:'changes',note:'Contururi mai clare.'}]});await api('POST',`projects/${pid}/items/apply`);await waitStatus(pid,['awaiting_review']);
  const d=await project(pid);assert.equal(d.artifacts.ill_0_4.content.color,old);assert.equal(d.review.items.find(i=>i.id==='img:ill_0_4:color').state,'approved');
});
test('v03 acceptare: ajustarea și rescrierea paginii 7 nu schimbă alte pagini',async()=>{
  for(const mode of ['adjust','rewrite']){const old=(await project(pid)).artifacts.final_0.content;
    await api('POST',`projects/${pid}/items`,{decisions:[{id:'text:final_0:7',state:'changes',note:'Formulare mai naturală.',mode}]});await api('POST',`projects/${pid}/items/apply`);await waitStatus(pid,['awaiting_review']);const d=await project(pid),next=d.artifacts.final_0.content;
    assert.notEqual(next.pages[6].text,old.pages[6].text);for(let i=0;i<12;i++)if(i!==6)assert.deepEqual(next.pages[i],old.pages[i]);assert.equal(d.review.items.find(i=>i.id==='text:final_0:7').state,'pending');}
});
test('v03 acceptare: înlocuirea exactă delegată rămâne locală, fără apel AI',async()=>{
  const d=await project(pid),c=structuredClone(d.artifacts.final_0.content);c.pages[6].text='Milo sare peste băltoacă.';
  await api('POST',`projects/${pid}/artifacts/final_0`,{content:c});const callCount=()=>fs.existsSync(process.env.WP_FAKE_STATE+'.claude.log')?fs.readFileSync(process.env.WP_FAKE_STATE+'.claude.log','utf8').trim().split('\n').length:0;const before=callCount();
  await api('POST',`projects/${pid}/items`,{decisions:[{id:'text:final_0:7',state:'approved_note',note:'înlocuiește „băltoacă” cu „baltă”'}]});await api('POST',`projects/${pid}/items/apply`);await waitStatus(pid,['awaiting_review']);
  const after=await project(pid);assert.equal(after.artifacts.final_0.content.pages[6].text,'Milo sare peste baltă.');assert.equal(after.review.items.find(i=>i.id==='text:final_0:7').state,'approved');
  assert.equal(callCount(),before);await api('POST',`projects/${pid}/stop`);
});
