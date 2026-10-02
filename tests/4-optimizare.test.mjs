// Versiunea 19: planul de optimizare a agenților (carta ca prompt de sistem, scheme, critic pe criterii, revizie țintită,
// verificarea de structură, continuitate incrementală, registrul de consum, motive la porți, diferențe, buget săptămânal, export).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { api, setFake, project, waitStatus, approveAll, connectCanva, INPUT } from './lib.mjs';

const LOG = () => { const f = process.env.WP_FAKE_STATE + '.claude.log'; return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').map(JSON.parse) : []; };
async function newProject(fake, input = INPUT) {
  setFake(fake); const t0 = Date.now();
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input })).body.id;
  assert.equal((await api('POST', `projects/${id}/start`)).status, 200);
  return { id, t0 };
}
async function toReview1(fake) {
  const P = await newProject(fake);
  await waitStatus(P.id, ['awaiting_review']); assert.equal((await approveAll(P.id)).status, 200);
  const p = await waitStatus(P.id, ['awaiting_review']); assert.equal(p.gate.key, 'review_1');
  return P;
}
const stop = id => api('POST', `projects/${id}/pause`);

test('pregătire: Canva conectat, buget mare pentru teste (multe proiecte la rând)', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva();
  assert.equal((await api('PUT', 'settings/budget', { budget5h: 1000 })).status, 200);
});

test('v19 1.7/2.3: critic pe criterii, revizie țintită, a doua rundă doar cât nota crește', async () => {
  const { id } = await toReview1({ criticScores: [7, 7.5, 9] });
  const d = await project(id); const m = d.artifacts.script_0.meta;
  assert.equal(m.score, 9); assert.equal(m.rounds, 2); assert.equal(m.critique.criteria.length, 18);
  assert.match(d.artifacts.script_0.content.pages[1].text, /revizuit țintit/, 'pagina cu problema a fost rescrisă');
  assert.doesNotMatch(d.artifacts.script_0.content.pages[5].text, /revizuit/, 'celelalte pagini au rămas neatinse');
  await stop(id);
});

test('v19 1.2/1.3: carta agentului ca prompt de sistem; schemă pentru răspunsurile compacte', async () => {
  const L = LOG();
  const critic = L.find(l => l.kind === 'critic'); assert.ok(critic, 'criticul a rulat');
  assert.ok(critic.sysBytes > 800, 'carta editorului e în promptul de sistem'); assert.equal(critic.schema, true, 'schema e trimisă');
  const script = L.find(l => l.kind === 'script'); assert.ok(script.sysBytes > 800); assert.equal(script.schema, null, 'documentele mari se validează local');
  assert.ok(L.filter(l => l.kind === 'brief').every(l => l.schema === true));
  assert.ok(!L.some(l => l.bytes > 0 && l.sysBytes === 0 && ['critic', 'script', 'brief'].includes(l.kind)), 'nicio carte în mesaj când există --system-prompt-file');
});

test('v19 2.6: registrul de consum și calitate', async () => {
  const r = await api('GET', 'ledger'); assert.equal(r.status, 200);
  assert.ok(r.body.textCalls > 5); assert.ok(r.body.stages.some(s => s.stage === 'critic'));
  assert.ok(r.body.cacheShare > 0, 'tokenii din cache sunt citiți din răspuns'); assert.ok(r.body.schemaShare > 0);
  const csv = await api('GET', '/api/ledger.csv', undefined, { raw: true }); assert.match(await csv.text(), /t,kind,pid/);
});

test('v19 2.3: fără câștig nu mai revizuiește și păstrează varianta mai bună', async () => {
  const { id } = await toReview1({ criticScores: [7, 6] });
  const a = (await project(id)).artifacts.script_0;
  assert.equal(a.meta.score, 7); assert.equal(a.meta.rounds, 1);
  assert.doesNotMatch(a.content.pages[1].text, /revizuit/, 'revizia mai slabă a fost aruncată');
  await stop(id);
});

test('v19 1.7: un criteriu critic sub prag cere revizie chiar dacă media e bună', async () => {
  const { id } = await toReview1({ criticCritical: 'T07' });
  const m = (await project(id)).artifacts.script_0.meta;
  assert.ok(m.critique.failed_critical.includes('T07')); assert.ok(m.rounds >= 1); assert.ok(m.score >= 8);
  await stop(id);
});

test('v19 2.1: verificarea de structură repară înainte de editor', async () => {
  const before = (await api('GET', 'ledger')).body.critic.lintStops;
  const { id, t0 } = await toReview1({ scriptUnknownId: true });
  const seq = LOG().filter(l => l.at >= t0).map(l => l.kind);
  const iRev = seq.indexOf('revise_pages'), iCrit = seq.indexOf('critic');
  assert.ok(iRev >= 0 && iRev < iCrit, 'revizia de structură vine înaintea criticului');
  assert.ok((await api('GET', 'ledger')).body.critic.lintStops > before);
  await stop(id);
});

let VOL2;
test('v19 1.8: continuitatea volumului 2 folosește registrul aprobat', async () => {
  const P = await toReview1({}); VOL2 = P.id;
  await approveAll(P.id); let p = await waitStatus(P.id, ['awaiting_review']); assert.equal(p.gate.key, 'review_2');
  await approveAll(P.id); p = await waitStatus(P.id, ['awaiting_review']); assert.equal(p.gate.key, 'review_1'); assert.equal(p.gate.vol, 1);
  assert.ok(LOG().some(l => l.at >= P.t0 && l.kind === 'continuity_inc'), 'apel incremental');
  const c = (await project(P.id)).artifacts.continuity.content;
  assert.equal(c.incremental, true); assert.equal(c.covers, 2);
  const st = (await project(P.id)).project.stages;
  assert.match(st['scripts@2'].note || '', /Pregătit în avans/, 'scenariul vol. 2 s-a scris cât se desenau imaginile vol. 1 (2.12)');
  assert.equal(st['critic@2'].status, 'done');
  const milo = c.ledger.find(x => x.id === 'milo'); assert.ok(milo.volumes.some(v => v.volume === 1) && milo.volumes.some(v => v.volume === 2), 'registrul păstrează vol. 1 și adaugă vol. 2');
});

test('v19 2.2/2.11: motiv din rubrică la corectură; diferența și motivul apar la runda următoare', async () => {
  const d = await project(VOL2); const it = d.review.items.find(i => i.kind === 'text' && i.p === 2);
  let r = await api('POST', `projects/${VOL2}/items`, { decisions: [{ id: it.id, state: 'changes', note: 'mai scurt', code: 'T04' }, { id: d.review.items[0].id, state: 'approved', code: 'NU-EXISTA' }] });
  assert.equal(r.status, 200);
  let again = (await project(VOL2)).review.items.find(i => i.id === it.id); assert.equal(again.code, 'T04');
  assert.equal((await project(VOL2)).review.items.find(i => i.id === d.review.items[0].id).code, null, 'un cod necunoscut e ignorat');
  await api('POST', `projects/${VOL2}/items/apply`); await waitStatus(VOL2, ['awaiting_review']);
  again = (await project(VOL2)).review.items.find(i => i.id === it.id);
  assert.ok(again.diff, 'diferența e păstrată'); assert.equal(again.diff.before, it.id ? d.artifacts.script_1.content.pages[1].text : ''); assert.equal(again.diff.reason, 'mai scurt'); assert.equal(again.diff.code, 'T04');
  await stop(VOL2);
});

test('v19 3.3: retrospectiva volumului propune lecții, aplicate doar cu acordul tău', async () => {
  const art = await (async () => { for (let i = 0; i < 40; i++) { const a = (await project(VOL2)).artifacts; if (a.retro_0) return a; await new Promise(r => setTimeout(r, 300)); } return null; })();
  assert.ok(art?.retro_0, 'retrospectiva a fost scrisă'); assert.equal(art.retro_0.content.repeated_problems[0].code, 'T04');
  const L = (await api('GET', 'learning')).body; const pr = L.proposals.find(x => /retrospectivă/.test(x.text)); assert.ok(pr, 'propunerea așteaptă decizia ta');
  assert.ok(!(await api('GET', 'agents')).body.lessons.some(l => l.text === pr.text), 'nu devine lecție singură');
  assert.equal((await api('POST', `proposals/${pr.id}`, { accept: true, scope: 'project' })).status, 200);
  const l = (await api('GET', 'agents')).body.lessons.find(x => x.text === pr.text); assert.ok(l); assert.equal(l.code, 'T04'); assert.equal(l.scope, 'project');
  const retro = LOG().find(x => x.kind === 'retro'); assert.equal(retro.model, 'haiku', 'retrospectiva folosește modelul ușor');
});

test('v19 2.7–2.10: coperta din șablonul de brand Canva (autofill, export PDF, promovare, comentarii)', async () => {
  let r = await api('GET', 'canva/brand-templates'); assert.equal(r.body.items[0].id, 'tpl-cover');
  r = await api('GET', 'canva/template-fields?id=tpl-cover'); assert.equal(r.body.fields.find(f => f.name === 'titlu').role, 'title'); assert.equal(r.body.fields.find(f => f.name === 'coperta').role, 'coperta');
  assert.equal((await api('POST', `projects/${VOL2}/canva-cover?volume=1`)).status, 409, 'doar după aprobarea finală a volumului');
  await api('PUT', `projects/${VOL2}/canva-brand`, { brandKitId: 'kit-1', brandKitName: 'WonderPages', templateId: 'tpl-cover', templateName: 'Copertă KDP' });
  r = await api('POST', `projects/${VOL2}/canva-cover?volume=0`); assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.ok(r.body.pdf && r.body.designId); assert.deepEqual(r.body.filled.sort(), ['colectie', 'coperta', 'text spate', 'titlu', 'volum'].sort()); assert.ok(r.body.skipped.includes('sigla'));
  setFake({ canvaComments: [{ text: 'Mută titlul mai sus', resolved: false }] });
  r = await api('POST', `projects/${VOL2}/canva-export?volume=0`); assert.equal(r.body.blocked, true, 'comentariu nerezolvat oprește exportul');
  r = await api('POST', `projects/${VOL2}/canva-export?volume=0&force=1`); assert.ok(!r.body.blocked);
  setFake({});
  r = await api('POST', `projects/${VOL2}/canva-promo?volume=0`); assert.equal(r.body.promo.length, 4);
  r = await api('POST', `projects/${VOL2}/package?volume=0`); assert.equal(r.status, 200);
  assert.ok(fs.readdirSync(`${r.body.folder}/Extra/Canva`).some(f => f.endsWith('.pdf')), 'coperta Canva e în pachet');
});

test('v19 2.5: buget săptămânal și estimarea colecției', async () => {
  let r = await api('PUT', 'settings/budget', { budget7d: 5000 }); assert.equal(r.body.budget7d, 5000);
  r = await api('GET', 'estimate?volumes=6'); assert.ok(r.body.text > 20); assert.equal(typeof r.body.fitsWeek, 'boolean');
  assert.equal((await api('GET', 'state')).body.usage?.budget7d ?? 5000, 5000);
  await api('PUT', 'settings/budget', { budget7d: 0 });
});

test('v19 3.4: exportul cunoștințelor pentru Proiectul Claude', async () => {
  const r = await api('GET', '/api/knowledge.zip', undefined, { raw: true }); assert.equal(r.status, 200);
  const buf = Buffer.from(await r.arrayBuffer()); assert.ok(buf.length > 2000);
  for (const f of ['carte-agenti.md', 'rubrica-si-varste.md', 'raport-lunar.md', 'instructiuni-proiect.md', 'registru-consum.csv']) assert.ok(buf.includes(Buffer.from(f)), 'lipsește ' + f);
});

test('v19 3.6: setul de aur rulează etapele de text și se compară cu referința', async () => {
  setFake({});
  assert.equal((await api('POST', 'golden/run', { variant: 'script_b' })).status, 200);
  const g = await (async () => { for (let i = 0; i < 200; i++) { const x = (await api('GET', 'golden')).body; if (!x.running && x.runs[0]?.status && x.runs[0].status !== 'running') return x; await new Promise(r => setTimeout(r, 500)); } return null; })();
  assert.ok(g, 'setul de aur s-a terminat'); const run = g.runs[0];
  assert.equal(run.status, 'done', JSON.stringify(run)); assert.equal(run.results.length, 3); assert.equal(run.variant, 'script_b');
  assert.ok(run.results.every(x => x.score0 != null && Object.keys(x.criteria0).length === 18));
  assert.equal(g.baseline, run.runId, 'prima rulare devine referința');
  assert.ok(!(await api('GET', 'state')).body.projects.some(p => /Golden set/.test(p.title)), 'proiectele temporare nu apar în listă');
  assert.ok(!LOG().some(l => l.at >= run.at && ['describe_refs', 'visual_qa', 'adapt'].includes(l.kind)), 'fără imagini și fără adaptare');
});

test('v19 2.12: dacă notele se schimbă după pregătirea în avans, scenariul se reface', async () => {
  const P = await toReview1({});
  await approveAll(P.id); let p = await waitStatus(P.id, ['awaiting_review']); assert.equal(p.gate.key, 'review_2');
  assert.equal(p.stages['scripts@2'].status, 'prefetched', 'pregătit în avans înainte să se deschidă poarta');
  const d = await project(P.id);
  await api('POST', `projects/${P.id}/items`, { decisions: d.review.items.map(i => ({ id: i.id, state: 'approved' })) });
  assert.equal((await api('POST', `projects/${P.id}/decide`, { decision: 'approved_with_notes', note: 'mai multe sunete' })).status, 200, 'poarta răspunde imediat (nimic nu mai rulează)');
  p = await waitStatus(P.id, ['awaiting_review']); assert.equal(p.gate.vol, 1);
  assert.match(p.stages['scripts@2'].note || '', /Refăcut/, 'scenariul pregătit cu notele vechi a fost refăcut');
  const kinds = LOG().filter(l => l.at >= P.t0).map(l => l.kind); assert.ok(kinds.filter(k => k === 'script').length >= 3, 'vol. 1 + pregătit + refăcut');
  await stop(P.id);
});

test('v19 1.3: dacă schema dă eroare, pasul se reia fără ea (fără pierdere)', async () => {
  const { id } = await newProject({ schemaBroken: true });
  const p = await waitStatus(id, ['awaiting_review']); assert.equal(p.gate.key, 'review_collection');
  const diag = (await api('GET', 'diagnostic')).body.checks.find(c => /Funcții Claude Code/.test(c.name)); assert.match(diag.detail, /oprită|locală/);
  await api('POST', `projects/${id}/stop`);
});
