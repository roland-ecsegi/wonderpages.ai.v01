// v19.1: ștergerea definitivă a unui proiect, fără urme în aplicație (baza de date, fișiere, livrări, învățare, registru, copii de siguranță).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, setFake, project, waitStatus, approveAll, connectCanva, INPUT, TMP } from './lib.mjs';
import { scrubDump } from '../server/purge.js';

const walk = d => { const out = []; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) out.push(p, ...walk(p)); else out.push(p); } return out; };
const grepTree = (d, s) => walk(d).filter(f => { if (!fs.statSync(f).isFile() || fs.statSync(f).size > 20e6) return path.basename(f).includes(s); try { return path.basename(f).includes(s) || fs.readFileSync(f, 'utf8').includes(s); } catch { return false; } });

test('ștergere definitivă: nimic din proiect nu mai rămâne în aplicație', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva();
  await api('PUT', 'settings/budget', { budget5h: 1000 });
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Dinosaur World Test' } })).body.id;
  await api('POST', `projects/${id}/start`);
  await waitStatus(id, ['awaiting_review']); await approveAll(id); await waitStatus(id, ['awaiting_review']); await approveAll(id); await waitStatus(id, ['awaiting_review']);
  const d = await project(id); assert.equal(d.project.gate.key, 'review_2');
  assert.equal((await api('DELETE', `projects/${id}`, { confirm: 'nu' })).status, 400, 'fără confirmare scrisă nu se șterge');
  await approveAll(id); await waitStatus(id, ['awaiting_review', 'paused']);
  await api('POST', `projects/${id}/pause`); await waitStatus(id, ['awaiting_review', 'paused']);
  const pk = await api('POST', `projects/${id}/package?volume=0`); assert.equal(pk.status, 200); const folder = path.dirname(pk.body.folder);
  const exp = await api('GET', `/api/projects/${id}/export.zip`, undefined, { raw: true }); assert.equal(exp.status, 200, 'exportul rămâne posibil înainte de ștergere'); await exp.arrayBuffer();
  assert.ok(fs.existsSync(path.join(TMP, 'data', 'projects', id)), 'înainte: fișierele există');
  const r = await api('DELETE', `projects/${id}`, { confirm: 'ȘTERGE' }); assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.ok(r.body.removed.length >= 3); assert.deepEqual(r.body.errors, []);
  assert.ok(r.body.outside.some(o => o.where === 'Canva' && o.links.length > 0), 'raportul spune ce e în contul Canva');
  assert.equal((await api('GET', `projects/${id}`)).status, 404);
  assert.ok(!(await api('GET', 'state')).body.projects.some(p => p.id === id));
  assert.ok(!fs.existsSync(folder), 'folderul livrărilor a dispărut');
  assert.deepEqual(grepTree(path.join(TMP, 'data'), id), [], 'nicio urmă în datele aplicației');
  assert.deepEqual(fs.existsSync(path.join(TMP, 'out')) ? grepTree(path.join(TMP, 'out'), id) : [], [], 'nicio urmă în folderul fișierelor finale');
  const csv = await (await api('GET', '/api/ledger.csv', undefined, { raw: true })).text(); assert.ok(!csv.includes(id), 'nicio urmă în registrul de consum');
});

test('ștergere: proiect pregătit, fără arhivare prealabilă', async () => {
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Proiect de șters imediat' } })).body.id;
  assert.equal((await project(id)).project.status, 'ready');
  assert.equal((await api('DELETE', `projects/${id}`, { confirm: 'ȘTERGE' })).status, 200);
  assert.equal((await api('GET', `projects/${id}`)).status, 404);
  assert.ok(!fs.existsSync(path.join(TMP, 'data', 'projects', id)));
});

test('ștergere: nu în timp ce proiectul lucrează', async () => {
  setFake({}); const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Proiect unic pentru blocarea ștergerii' } })).body.id;
  await api('POST', `projects/${id}/start`);
  const r = await api('DELETE', `projects/${id}`, { confirm: 'ȘTERGE' });
  assert.ok([409, 200].includes(r.status)); if (r.status === 409) { assert.match(r.body.message, /pauză/); await waitStatus(id, ['awaiting_review']); assert.equal((await api('DELETE', `projects/${id}`, { confirm: 'ȘTERGE', deliverables: false, backups: false })).status, 200); }
});

test('copiile de siguranță: rândurile proiectului ies, celelalte rămân', async () => {
  const f = path.join(TMP, 'dump-test.sql');
  fs.writeFileSync(f, ['-- PostgreSQL database dump', 'COPY public.projects (id, title, status, type_slug, doc, updated_at) FROM stdin;', 'pdel111\tDinosaur\tready\tkids-sc\t{}\t2026', 'pkeep22\tAlt proiect\tready\tkids-sc\t{}\t2026', '\\.', 'COPY public.documents (path, doc, updated_at) FROM stdin;', 'lessons.json\t[{"pid": "pdel111"}]\t2026', 'projects/pdel111/x.json\t{}\t2026', 'ledger.json\t[]\t2026', '\\.', 'SELECT 1;'].join('\n'));
  const clean = new Map([['lessons.json', 'lessons.json\t[{"pid": "pkeep22"}]\t2026']]);
  assert.deepEqual(await scrubDump(f, 'pdel111', clean), { dropped: 2, replaced: 1, kept: 0, remaining: 0 });
  const t = fs.readFileSync(f, 'utf8'); assert.ok(!t.includes('pdel111')); assert.ok(t.includes('pkeep22') && t.includes('ledger.json') && t.includes('SELECT 1;'));
  assert.ok(t.includes('lessons.json\t[{"pid": "pkeep22"}]'), 'documentul comun e înlocuit cu versiunea curată, nu șters');
});
