// TEST-P5-T06 — reparația culorii p4 → linia p4 învechită, reparație doar a liniei p4, text semantic p7, greșeală
// exactă p7; p9 reparat cu anatomia bună dar acțiunea greșită: problema se rezolvă numai cu recheck complet curent;
// contra-dovezile o redeschid; epuizarea merge la operator cu apelurile și hash-urile exacte; frații rămân neatinși.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, setFake, waitStatus, waitFor, connectCanva, approveAll, INPUT, project, ROOT } from './lib.mjs';
import { planRepairs, unitHashes, verifyExecution, resolution, missingUnits, MAX_CREATIVE_ATTEMPTS } from '../server/quality/repair.js';
import { readZip } from '../server/security/safe-zip.js';

const pages = () => Array.from({ length: 12 }, (_, i) => ({ n: i + 1, text: `Milo walks on page ${i + 1}.`, scene: `scene ${i + 1}` }));
const art0 = () => { const a = { final_0: { content: { pages: pages() } }, tr_0: { content: { pages: pages().map(p => ({ n: p.n, text: `Milo merge pe pagina ${p.n}.` })) } } };
  for (let p = 0; p <= 12; p++) a[`ill_0_${p}`] = { content: { color: `images/c${p}.png`, qa: { ok: true, color: `images/c${p}.png` }, lineart: `images/l${p}.png`, lineFrom: `images/c${p}.png`, lineQA: { ok: true, for: `images/l${p}.png` } } };
  return a; };
const item = (id, kind, extra) => ({ id, kind, state: 'changes', v: 0, ...extra });

test('P5-T06: culoarea p4 → linia p4 devine învechită (dependent declarat); niciun alt element nu se schimbă', () => {
  const a = art0(), plan = planRepairs({ items: [item('img:ill_0_4:color', 'image', { key: 'ill_0_4', p: 4, mode: 'color', note: 'mai luminos' })] });
  assert.deepEqual(plan.patches[0].target, ['ill_0_4:color']); assert.deepEqual(plan.patches[0].invalidates, ['ill_0_4:line']); assert.ok(plan.patches[0].recheck.includes('visual_qa_all_dimensions'));
  const before = unitHashes(a, 0); a.ill_0_4.content.color = 'images/c4-v2.png';
  assert.deepEqual(verifyExecution(before, unitHashes(a, 0), plan).unrequested, []);
  assert.equal(resolution(plan.patches[0], a).status, 'open', 'fără QA pe imaginea nouă nu este rezolvat');
  assert.equal(resolution({ ...plan.patches[0], op: 'line', target: ['ill_0_4:line'] }, a).status, 'open', 'linia derivă din culoarea veche: învechită');
  a.ill_0_4.content.qa = { ok: true, color: 'images/c4-v2.png' }; assert.equal(resolution(plan.patches[0], a).status, 'resolved');
  a.ill_0_5.content.color = 'images/c5-alta.png';
  assert.deepEqual(verifyExecution(before, unitHashes(a, 0), plan).unrequested, ['ill_0_5:color'], 'un frate schimbat este semnalat');
});

test('P5-T06: reparația doar a liniei p4 nu are voie să atingă culoarea', () => {
  const a = art0(), plan = planRepairs({ items: [item('img:ill_0_4:line', 'image', { key: 'ill_0_4', p: 4, mode: 'line', note: 'linii mai groase' })] });
  assert.equal(plan.patches[0].op, 'line'); assert.deepEqual(plan.patches[0].invalidates, []);
  const before = unitHashes(a, 0); a.ill_0_4.content.lineart = 'images/l4-v2.png'; a.ill_0_4.content.lineQA = { ok: true, for: 'images/l4-v2.png' };
  assert.ok(verifyExecution(before, unitHashes(a, 0), plan).ok); assert.equal(resolution(plan.patches[0], a).status, 'resolved');
  a.ill_0_4.content.color = 'images/c4-nou.png'; assert.deepEqual(verifyExecution(before, unitHashes(a, 0), plan).unrequested, ['ill_0_4:color']);
});

test('P5-T06: text semantic p7 invalidează arta și pagina nativă p7; greșeala exactă p7 este locală și nu atinge imaginea', () => {
  const a = art0();
  const sem = planRepairs({ items: [item('text:final_0:7', 'text', { key: 'final_0', p: 7, note: 'mai mult suspans' })] });
  assert.equal(sem.patches[0].op, 'semantic'); assert.deepEqual(sem.patches[0].invalidates, ['ill_0_7:color', 'ill_0_7:line', 'tr_0#p7']);
  const before = unitHashes(a, 0); a.final_0.content.pages[6].text = 'Milo tiptoes towards the hidden nest.'; a.final_0.content.pages[5].text = 'Schimbare necerută.';
  assert.deepEqual(verifyExecution(before, unitHashes(a, 0), sem).unrequested, ['final_0#p6']);
  const ex = planRepairs({ items: [item('text:final_0:7', 'text', { key: 'final_0', p: 7, note: 'înlocuiește „page 7” cu „pagina 7”' })] });
  assert.equal(ex.patches[0].op, 'exact'); assert.equal(ex.patches[0].creative, false); assert.deepEqual(ex.patches[0].invalidates, ['tr_0#p7'], 'doar revalidarea paginii native');
  const b = art0(); b.final_0.content.pages[6].text = 'Milo walks on pagina 7.';
  assert.equal(resolution(ex.patches[0], b).status, 'resolved');
});

test('P5-T06: p9 reparat cu anatomia bună dar acțiunea greșită rămâne deschis; după 2 încercări creative decide operatorul', () => {
  const a = art0(); a.ill_0_9.content.color = 'images/c9-v2.png'; a.ill_0_9.content.qa = { ok: false, color: 'images/c9-v2.png', failed: ['action'] };
  const it = item('img:ill_0_9:color', 'image', { key: 'ill_0_9', p: 9, mode: 'color', note: 'Tia ține frunza cu botul' });
  const p1 = planRepairs({ items: [it] }); const r = resolution(p1.patches[0], a); assert.equal(r.status, 'open'); assert.match(r.evidence, /action/);
  a.ill_0_9.content.qa = { ok: true, color: 'images/c9-v2.png' }; assert.equal(resolution(p1.patches[0], a).status, 'resolved');
  a.ill_0_9.content.qa = { ok: false, color: 'images/c9-v2.png', failed: ['story'] }; assert.equal(resolution(p1.patches[0], a).status, 'open', 'contra-dovezile redeschid problema');
  const exhausted = planRepairs({ items: [it], attempts: { [it.id]: { count: MAX_CREATIVE_ATTEMPTS, history: [{ before: ['h1'], after: ['h2'], calls: 2 }] } } });
  assert.equal(exhausted.patches.length, 0); assert.equal(exhausted.needsOperator[0].id, it.id); assert.equal(exhausted.needsOperator[0].history[0].calls, 2);
});

test('P5-T06 Dinosaur World: se planifică numai unitățile lipsă/eșuate; textul V1 și referințele nu sunt atinse', () => {
  const doc = JSON.parse([...readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')))].find(([k]) => k.endsWith('/project.json'))[1].toString());
  const units = missingUnits(doc.artifacts, 0); assert.ok(!units.some(u => /^script_0|^final_0/.test(u.unit)), 'V1 are text: nu se regenerează');
  assert.equal(units.filter(u => u.unit.endsWith(':color')).length, 13); assert.equal(units.filter(u => u.unit.endsWith(':line')).length, 13);
  assert.ok(missingUnits(doc.artifacts, 1).some(u => u.unit === 'script_1'), 'V2 lipsește → se planifică');
  assert.ok(!units.some(u => /refs|uploads/.test(u.unit)), 'referințele originale nu intră în plan');
});

test('P5-T06 API: culoarea p4 refăcută cu recheck complet; greșeala exactă p7 locală; a treia încercare creativă merge la operator', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Reparații P5' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']); await approveAll(id);
  await waitStatus(id, ['awaiting_review']); await approveAll(id); await waitStatus(id, ['awaiting_review']);
  let d = await project(id); assert.equal(d.project.gate.key, 'review_2');
  const p7before = d.artifacts.ill_0_7.content.color, p5before = d.artifacts.ill_0_5.content.color;
  const apply = async decisions => { assert.equal((await api('POST', `projects/${id}/items`, { decisions })).status, 200); assert.equal((await api('POST', `projects/${id}/items/apply`)).status, 200); await waitFor(async () => { const x = (await project(id)).project; return !x.running && x.status === 'awaiting_review'; }, { label: 'aplicare' }); return (await project(id)); };
  d = await apply([{ id: 'img:ill_0_4:color', state: 'changes', note: 'mai luminos' }, { id: 'text:final_0:7', state: 'changes', note: 'înlocuiește „page 7” cu „pagina 7”' }]);
  let rep = d.project.repairs.at(-1); assert.equal(rep.verify.ok, true, JSON.stringify(rep.verify));
  assert.equal(rep.resolutions.find(r => r.id === 'img:ill_0_4:color').status, 'resolved', 'QA complet pe imaginea nouă');
  assert.equal(rep.resolutions.find(r => r.id === 'text:final_0:7').status, 'resolved'); assert.match(d.artifacts.final_0.content.pages[6].text, /pagina 7/);
  assert.equal(d.artifacts.ill_0_7.content.color, p7before, 'greșeala exactă nu redesenează p7'); assert.equal(d.artifacts.ill_0_5.content.color, p5before, 'frații neatinși');
  assert.notEqual(d.artifacts.ill_0_4.content.lineFrom, d.artifacts.ill_0_4.content.color, 'linia p4 este învechită după culoarea nouă');
  assert.equal(d.project.repairAttempts['img:ill_0_4:color'].count, 1); assert.equal(d.project.repairAttempts['text:final_0:7'], undefined, 'înlocuirea exactă nu consumă încercări creative');
  for (let i = 0; i < 2; i++) d = await apply([{ id: 'img:ill_0_4:color', state: 'changes', note: 'altă variantă ' + i }]);
  rep = d.project.repairs.at(-1); assert.equal(rep.needsOperator[0]?.id, 'img:ill_0_4:color', 'a treia încercare creativă este refuzată'); assert.ok(rep.needsOperator[0].history.length >= 2);
  setFake({}); await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});
