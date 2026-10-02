// Fluxul de producție cap-coadă: proiect nou, porți de aprobare, corecții, livrare, export/import.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, setFake, project, waitStatus, waitFor, connectCanva, approveAll, INPUT, TMP } from './lib.mjs';

let PID;
test('pregătire: servicii simulate, Canva conectat prin OAuth', async () => {
  setFake({});
  const r = await connectCanva(); assert.equal(r.status, 302);
  assert.equal((await api('GET', 'state')).body.services.canva.connected, true);
});

test('proiect nou: validare și creare', async () => {
  let r = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, short_description: '' } });
  assert.equal(r.status, 400); assert.match(r.body.message, /obligatoriu/);
  r = await api('POST', 'projects', { typeSlug: 'nu-exista', input: INPUT }); assert.equal(r.status, 400);
  r = await api('POST', 'projects', { typeSlug: 'kids-sc', input: INPUT }); assert.equal(r.status, 200); PID = r.body.id;
  const d = await project(PID);
  assert.equal(d.project.status, 'ready'); assert.equal(d.project.input.language, 'English'); assert.equal(d.project.input.second_language, 'Romanian');
});

test('un singur proiect activ', async () => {
  const other = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: INPUT })).body.id;
  await api('POST', `projects/${PID}/start`);
  const r = await api('POST', `projects/${other}/start`); assert.equal(r.status, 409);
});

test('poarta seriei: aprobarea pe elemente e obligatorie (audit H1)', async () => {
  const p = await waitStatus(PID, ['awaiting_review']); assert.equal(p.gate.key, 'review_collection');
  let r = await api('POST', `projects/${PID}/decide`, { decision: 'approved' });
  assert.equal(r.status, 400, 'poarta nu se închide fără aprobarea fiecărui element'); assert.match(r.body.message, /neaprobate/);
  r = await api('POST', `projects/${PID}/decide`, { decision: 'orice' }); assert.equal(r.status, 400);
  const d = await project(PID);
  r = await api('POST', `projects/${PID}/items`, { decisions: [{ id: d.review.items[0].id, state: 'approved_note', note: 'ton mai cald' }, ...d.review.items.slice(1).map(i => ({ id: i.id, state: 'approved' }))] });
  assert.equal(r.body.approved_note, 1);
  assert.equal((await api('POST', `projects/${PID}/gate/complete`)).status, 400, 'nota trebuie aplicată întâi');
  await api('POST', `projects/${PID}/items/apply`); await waitStatus(PID, ['awaiting_review']);
  r = await approveAll(PID); assert.equal(r.status, 200);
});

test('volumul 1: demo, corecție, text final, adaptare RO', async () => {
  let p = await waitStatus(PID, ['awaiting_review']); assert.equal(p.gate.key, 'review_1');
  let d = await project(PID); assert.ok(d.review.items.some(i => i.kind === 'image' && i.image), 'imagini demo generate');
  await api('POST', `projects/${PID}/decide`, { decision: 'needs_correction', note: 'schimbă pagina 1', targets: ['script_0'] });
  p = await waitStatus(PID, ['awaiting_review']); assert.equal(p.gate.round, 2);
  await approveAll(PID);
  p = await waitStatus(PID, ['awaiting_review']); assert.equal(p.gate.key, 'review_2');
  d = await project(PID); assert.ok(d.review.items.some(i => i.lang === 'second'), 'adaptarea în a doua limbă e la aprobare');
});

test('aprobarea se invalidează când elementul se schimbă', async () => {
  const d = await project(PID); const it = d.review.items.find(i => i.kind === 'text' && i.key.startsWith('final'));
  await api('POST', `projects/${PID}/items`, { decisions: [{ id: it.id, state: 'approved' }] });
  const content = structuredClone(d.artifacts[it.key].content); content.pages[0].text += ' (editat)';
  assert.equal((await api('POST', `projects/${PID}/artifacts/${it.key}`, { content })).status, 200);
  const again = (await project(PID)).review.items.find(i => i.id === it.id); assert.equal(again.state, 'pending');
});

test('livrarea e refuzată înainte de aprobarea finală (audit H1)', async () => {
  let r = await api('POST', `projects/${PID}/deliver?volume=0`); assert.equal(r.status, 409);
  r = await api('POST', `projects/${PID}/package?volume=0`); assert.equal(r.status, 409);
});

test('după aprobarea finală: pachet, PDF-uri (dacă există browser)', async (t) => {
  /* P5-T02: the edit above made the text assessment stale — the current version is re-evaluated (no rewrite) before approval */
  if ((await project(PID)).review?.items?.some(i => i.kind === 'book' && i.blocked)) { assert.equal((await api('POST', `projects/${PID}/assessment/1/refresh`)).status, 200); await waitFor(async () => !(await project(PID)).project.running && !(await project(PID)).review.items.find(i => i.kind === 'book').blocked, { label: 'reevaluare' }); }
  await approveAll(PID); await waitStatus(PID, ['paused', 'awaiting_review', 'completed']);
  let r = await api('POST', `projects/${PID}/package?volume=0`); assert.equal(r.status, 200); assert.ok(r.body.files > 10);
  const md = fs.readFileSync(path.join(r.body.folder, 'Extra', 'Detalii publicare.md'), 'utf8'); assert.match(md, /KDP/);
  if (process.env.WP_QUICK) return t.skip('rulare rapidă: fără PDF');
  r = await api('POST', `projects/${PID}/deliver?volume=0`);
  if (r.status === 400 && r.body.code === 'no_browser') return t.skip('nu există Edge/Chrome pe acest calculator');
  assert.equal(r.status, 200);
  const job = await waitFor(async () => { const p = (await project(PID)).project; return p.rendering?.finished ? p.rendering : null; }, { timeout: 240000, every: 1000, label: 'livrare' });
  assert.equal(job.ok, true, job.message);
  const pdfs = fs.readdirSync(path.join(TMP, 'out')).flatMap(d => { try { return fs.readdirSync(path.join(TMP, 'out', d, 'PDF')); } catch { return []; } }).filter(f => f.endsWith('.pdf'));
  assert.equal(pdfs.length, 3, 'colorat + EN + RO');
  const receipts = (await project(PID)).artifacts.delivery_0.content.exports.filter(e => e.kind === 'final');   // P6-T05: every final PDF passed the independent inspection
  assert.ok(receipts.length === 3 && receipts.every(e => e.inspection?.ok === true && e.inspection.fonts.every(f => f.embedded)), JSON.stringify(receipts.map(e => e.inspection)));
});

test('export și import de proiect: conținutul rămâne, aprobările se refac (audit C1)', async () => {
  const r = await api('GET', `projects/${PID}/export.zip`, undefined, { raw: true }); const buf = Buffer.from(await r.arrayBuffer());
  const imp = await api('POST', 'projects/import', buf, { headers: { 'content-type': 'application/octet-stream' } }); assert.equal(imp.status, 200);
  const d = await project(imp.body.id);
  assert.equal(d.project.status, 'ready'); assert.deepEqual(d.project.approvals, {}); assert.deepEqual(d.project.decisions, []);
  assert.ok(Object.keys(d.artifacts).length > 5, 'artefactele sunt păstrate');
  assert.ok(Object.values(d.project.stages).every(s => s.imported), 'etapele lucrate sunt marcate importate');
  await api('POST', `projects/${PID}/pause`); await waitStatus(PID, ['paused', 'awaiting_review', 'completed']);
  await api('POST', `projects/${imp.body.id}/start`);
  const p = await waitStatus(imp.body.id, ['awaiting_review']); assert.equal(p.gate.key, 'review_collection', 'prima poartă se redeschide');
  assert.equal((await api('POST', `projects/${imp.body.id}/deliver?volume=0`)).status, 409, 'volumul importat nu se livrează fără aprobarea ta');
  await api('POST', `projects/${imp.body.id}/stop`);
});

test('arhivare și ștergere cu confirmare scrisă', async () => {
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Proiect unic pentru arhivare și ștergere' } })).body.id;
  await api('POST', `projects/${id}/archive`, { archived: true });
  assert.equal((await api('DELETE', `projects/${id}`, { confirm: 'nu' })).status, 400);
  assert.equal((await api('DELETE', `projects/${id}`, { confirm: 'ȘTERGE' })).status, 200);
});
