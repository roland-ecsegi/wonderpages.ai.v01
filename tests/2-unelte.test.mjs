// Uneltele din jurul producției: Dali, agenți, învățare, diagnostic, motorul de imagini, atelierul de îmbunătățiri.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { api, setFake, waitFor, TMP } from './lib.mjs';

test('Dali: răspunde, notează o îmbunătățire, completează formularul', async () => {
  setFake({});
  let r = await api('POST', 'assistant', { message: 'Salut!' }); assert.equal(r.status, 200); assert.ok(r.body.reply);
  const sid = r.body.sid;
  r = await api('POST', 'assistant', { message: 'notează o îmbunătățire pentru export', sid });   // P7-T06 (D-C21): a proposal, applied only when you confirm it
  const pr = r.body.actions.find(a => a.type === 'proposal' && a.kind === 'add_improvement'); assert.ok(pr && pr.status === 'proposed');
  const n0 = (await api('GET', 'improvements')).body.items.length; const c = await api('POST', `assistant/${sid}/proposals/${pr.id}`, { confirm: true }); assert.equal(c.status, 200); assert.equal(c.body.applied, true);
  assert.equal((await api('GET', 'improvements')).body.items.length, n0 + 1);
  r = await api('POST', 'assistant', { message: 'completează formularul', sid }); assert.ok(r.body.actions.some(a => a.type === 'fill_project'));
  r = await api('POST', 'assistant', { message: 'linkextern', sid }); assert.ok(!r.body.actions.some(a => a.type === 'navigate' && !a.to.startsWith('#/')), 'Dali deschide doar pagini din aplicație');
});

test('agenți și lecții', async () => {
  let r = await api('GET', 'agents'); assert.equal(r.body.agents.length, 11); assert.ok(r.body.lessons.length >= 24, 'registrul de lecții e încărcat');
  r = await api('PUT', 'agents/scriitor', { model: 'haiku' }); assert.equal(r.body.model, 'haiku');
  r = await api('PUT', 'agents/scriitor', { model: 'alt-model' }); assert.equal(r.body.model, 'haiku', 'model invalid ignorat');
  r = await api('POST', 'lessons', { agent: 'scriitor', text: 'Lecție de test', scope: 'global' }); assert.equal(r.status, 200);
});

test('diagnostic: baza, fără API plătit, versiuni testate', async () => {
  const r = await api('GET', 'diagnostic'); const c = Object.fromEntries(r.body.checks.map(x => [x.name, x]));
  assert.equal(c['Baza de date'].ok, true);
  assert.match(c['Fără API plătit'].detail, /ignorat/);
  assert.ok(c['Fontul cărților (Andika)'], 'verifică fontul cărților');
});

test('cheile API nu ajung niciodată la Claude sau Codex', async () => {
  const f = process.env.WP_FAKE_STATE + '.claude.log'; const lines = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').map(JSON.parse) : [];
  assert.ok(lines.length > 0); assert.ok(lines.every(l => !l.apiKeyInEnv));
});

test('motorul de imagini: ChatGPT (Codex)', async () => {
  setFake({});
  let r = await api('POST', 'chatgpt/check'); assert.equal(r.body.installed, true);
  r = await api('PUT', 'settings/images', { engine: 'chatgpt' }); assert.equal(r.body.engine, 'chatgpt');
  r = await api('PUT', 'settings/images', { engine: 'canva' }); assert.equal(r.body.engine, 'canva');
});

async function runWorkshop(fake) {
  setFake(fake);
  const id = (await api('POST', 'improvements', { title: 'Notă în ghid', description: 'Adaugă o notă în ghid.', category: 'altele' })).body.id;
  await api('POST', `improvements/${id}/start`);
  await waitFor(async () => (await api('GET', 'improvements')).body.items.find(x => x.id === id)?.status === 'propunere', { timeout: 60000, label: 'propunere' });
  await api('POST', `improvements/${id}/approve`);
  return waitFor(async () => { const it = (await api('GET', 'improvements')).body.items.find(x => x.id === id); return it?.status === 'în revizuire' ? it : null; }, { timeout: 180000, label: 'revizuire' });
}
test('atelier: schimbarea trece verificările și testul de pornire în copie (audit #5)', async () => {
  const it = await runWorkshop({});
  assert.ok(it.work.changes.length >= 1);
  const smoke = it.work.checks.find(c => /pornire/.test(c.name)); assert.ok(smoke, 'test de pornire rulat'); assert.equal(smoke.ok, true, smoke.detail);
  await api('POST', `improvements/${it.id}/reject`, { comment: 'doar test' });
});
test('atelier: scripturile de pornire nu pot fi modificate (audit H3)', async () => {
  const it = await runWorkshop({ engineerTouchesBat: true });
  const prot = it.work.checks.find(c => c.name === 'Fișiere protejate'); assert.ok(prot && !prot.ok, 'porneste.bat e blocat');
  const r = await api('POST', `improvements/${it.id}/resolve`); assert.equal(r.status, 400, 'nu se aplică');
  await api('POST', `improvements/${it.id}/reject`, { comment: 'test' });
});
