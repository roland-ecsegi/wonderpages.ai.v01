// TEST-P6-T02 — patru scenarii (culoare p4; doar linia p4; text semantic p7; greșeală exactă p7), restaurare după mai
// mult de 5 candidați, impact anulat și revizie învechită: se schimbă doar artefactele/apelurile afectate; previzualizare
// completă Poveste/Colorat/limbi 12 pagini + coperți; niciun link generic fals de previzualizare.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, setFake, waitStatus, waitFor, connectCanva, approveAll, INPUT, project, ROOT, BASE } from './lib.mjs';
import { commandImpact, pageWorkbench, stateHash, COMMANDS } from '../server/domain/workbench.js';
import { readZip } from '../server/security/safe-zip.js';

const BP = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8'));
const pages = () => Array.from({ length: 12 }, (_, i) => ({ n: i + 1, text: `Milo walks on page ${i + 1}.`, scene: `scene ${i + 1}`, characters: ['milo'], objects: ['pebble'], layout: { family: 'action', text_zone: 'bottom' }, text_zone: 'bottom' }));
const art0 = () => { const a = { bible: { content: { characters: [{ id: 'milo', name: 'Milo' }], objects: [{ id: 'pebble', name: 'pietricica' }] } }, final_0: { version: 3, content: { pages: pages() } }, tr_0: { version: 2, content: { pages: pages().map(p => ({ n: p.n, text: `Milo merge pe pagina ${p.n}.` })) } } };
  for (let p = 0; p <= 12; p++) a[`ill_0_${p}`] = { version: 1, content: { color: `images/c${p}.png`, qa: { ok: true, color: `images/c${p}.png` }, lineart: `images/l${p}.png`, lineFrom: `images/c${p}.png`, lineQA: { ok: true, for: `images/l${p}.png` } } };
  return a; };
const PROJ = { input: { target_age: '5-6', page_format: 'portrait45', language: 'English', second_language: 'Romanian' } };

test('P6-T02: cele șase comenzi sunt distincte; culoarea p4 face linia depășită, linia p4 nu atinge culoarea', () => {
  assert.deepEqual(Object.keys(COMMANDS), ['exact', 'style', 'semantic', 'color', 'line', 'layout']);
  const a = art0(), c = commandImpact({ art: a, v: 0, p: 4, command: 'color', payload: { note: 'mai luminos' } });
  assert.deepEqual(c.changes, ['ill_0_4:color']); assert.deepEqual(c.stale, ['ill_0_4:line']); assert.ok(c.calls.some(x => x.kind === 'image') && c.ai);
  assert.equal(c.unchanged.count, Object.keys(a).filter(k => /^ill_0_/.test(k)).length * 2 + 24 - 2, 'restul unităților rămân');
  const l = commandImpact({ art: a, v: 0, p: 4, command: 'line', payload: { note: 'linii mai groase' } });
  assert.deepEqual(l.changes, ['ill_0_4:line']); assert.deepEqual(l.stale, []); assert.match(l.notes.join(' '), /Culoarea rămâne/);
  assert.throws(() => commandImpact({ art: a, v: 0, p: 4, command: 'color', payload: {} }), e => e.status === 400);
  assert.throws(() => commandImpact({ art: a, v: 0, p: 4, command: 'repaint-all' }), e => e.status === 400);
});

test('P6-T02: text p7 — semantic invalidează arta, colorarea și pagina nativă; stilistic doar nativa; greșeala exactă e locală, fără apeluri', () => {
  const a = art0();
  const sem = commandImpact({ art: a, v: 0, p: 7, command: 'semantic', payload: { note: 'Milo găsește cuibul' } });
  assert.deepEqual(sem.changes, ['final_0#p7']); assert.deepEqual(sem.stale, ['ill_0_7:color', 'ill_0_7:line', 'tr_0#p7']); assert.equal(sem.mode, 'rewrite');
  const sty = commandImpact({ art: a, v: 0, p: 7, command: 'style', payload: { note: 'mai ritmat' } });
  assert.deepEqual(sty.stale, ['tr_0#p7'], 'arta rămâne'); assert.equal(sty.mode, 'adjust');
  const ex = commandImpact({ art: a, v: 0, p: 7, command: 'exact', payload: { from: 'walks', to: 'tiptoes' } });
  assert.equal(ex.ai, false); assert.deepEqual(ex.calls, []); assert.deepEqual(ex.changes, ['final_0#p7']); assert.equal(ex.next, 'Milo tiptoes on page 7.');
  const exRo = commandImpact({ art: a, v: 0, p: 7, command: 'exact', payload: { language: 'second', from: 'merge', to: 'pășește' } });
  assert.deepEqual(exRo.changes, ['tr_0#p7']); assert.deepEqual(exRo.stale, [], 'ediția nativă se corectează în spațiul ei');
  assert.throws(() => commandImpact({ art: a, v: 0, p: 7, command: 'exact', payload: { from: 'zbor', to: 'x' } }), e => /nu se găsește/.test(e.message));
  a.final_0.content.pages[6].text = 'Milo walks and walks.';
  assert.throws(() => commandImpact({ art: a, v: 0, p: 7, command: 'exact', payload: { from: 'walks', to: 'runs' } }), e => /de mai multe ori/.test(e.message));
  const lay = commandImpact({ art: a, v: 0, p: 7, command: 'layout', payload: { family: 'panorama', zone: 'top' } });
  assert.deepEqual(lay.changes, ['layout:0:7']); assert.deepEqual(lay.stale, []); assert.ok(lay.notes.some(n => /zona calmă/.test(n)));
  assert.throws(() => commandImpact({ art: a, v: 0, p: 0, command: 'exact', payload: { from: 'a', to: 'b' } }), e => e.status === 400, 'coperta nu are text de pagină');
});

test('P6-T02: impactul este legat de starea exactă; orice schimbare a volumului îl face învechit', () => {
  const a = art0(), h1 = commandImpact({ art: a, v: 0, p: 5, command: 'layout', payload: { family: 'panorama', zone: 'top' } }).previewHash;
  assert.equal(commandImpact({ art: a, v: 0, p: 5, command: 'layout', payload: { family: 'panorama', zone: 'top' } }).previewHash, h1, 'determinist');
  const s0 = stateHash(a, 0, 5); a.ill_0_9.content.color = 'images/c9-v2.png'; assert.notEqual(stateHash(a, 0, 5), s0);
  assert.notEqual(commandImpact({ art: a, v: 0, p: 5, command: 'layout', payload: { family: 'panorama', zone: 'top' } }).previewHash, h1);
});

test('P6-T02: atelierul paginii — 12 pagini + copertă, limbi, distribuție/obiecte, contract, verificări; AI doar prin poarta deschisă', () => {
  const a = art0(), w = pageWorkbench({ bp: BP, art: a, project: PROJ, v: 0, p: 4, gateItems: [{ id: 'img:ill_0_4:color' }] });
  assert.equal(w.thumbnails.length, 13); assert.deepEqual(w.texts.map(t => t.language), ['English', 'Romanian']);
  assert.deepEqual(w.cast, [{ id: 'milo', name: 'Milo' }]); assert.deepEqual(w.props, [{ id: 'pebble', name: 'pietricica' }]); assert.equal(w.contract.scene, 'scene 4');
  assert.equal(w.verdicts.visual.ok, true); const cmd = id => w.commands.find(c => c.id === id);
  assert.equal(cmd('color').available, true); assert.equal(cmd('semantic').available, false); assert.match(cmd('semantic').reason, /poarta de revizie/); assert.equal(cmd('exact').available, true);
  const cover = pageWorkbench({ bp: BP, art: a, project: PROJ, v: 0, p: 0 }); assert.equal(cover.commands.find(c => c.id === 'exact').available, false);
});

test('P6-T02 Dinosaur World: textul și referințele V1 inspectabile; arta lipsă apare „în așteptare”', () => {
  const doc = JSON.parse([...readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')))].find(([k]) => k.endsWith('/project.json'))[1].toString());
  const w = pageWorkbench({ bp: doc.blueprint, art: doc.artifacts, project: doc.project, v: 0, p: 7 });
  assert.deepEqual(w.texts.map(t => t.language), ['English', 'Romanian']); assert.ok(w.texts.every(t => t.text.length > 100), 'textul V1 (EN + RO) inspectabil');
  assert.ok(w.thumbnails.every(t => t.pending && !t.color)); assert.equal(w.verdicts.pending, true); assert.match(w.verdicts.visual.reasons.join(' '), /așteptare|lipsește/);
  assert.ok(w.contract.scene && w.contract.actions.length >= 1); assert.ok(w.cast.length >= 1 && w.cast.every(c => c.name));
});

test('P6-T02: UI fără link generic fals de previzualizare (legături exacte către pagina din atelier)', () => {
  for (const f of ['ui.js', 'views.js', 'actions.js', 'core.js']) assert.ok(!/href="#\/p\/[^"]*\/preview"|\/preview">/.test(fs.readFileSync(path.join(ROOT, 'public/app', f), 'utf8')), f);
  assert.match(fs.readFileSync(path.join(ROOT, 'public/app/ui.js'), 'utf8'), /\/book\/'\+\(Number\(it\.v\)\+1\)\+'\/'\+Number\(it\.p\)/);
});

test('P6-T02 API: greșeala exactă p7 locală; impact anulat; revizie învechită; culoare p4; doar linia p4; semantic p7; restaurare după > 5 candidați; previzualizare completă', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Atelier P6' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']); await approveAll(id);
  await waitStatus(id, ['awaiting_review']); await approveAll(id); await waitStatus(id, ['awaiting_review']);
  let d = await project(id); assert.equal(d.project.gate.key, 'review_2');
  const versions = x => Object.fromEntries(Object.entries(x.artifacts).map(([k, a]) => [k, a.version]));
  const idle = async () => { const n = (await project(id)).project.repairs?.length || 0; return waitFor(async () => { const x = (await project(id)).project; return (x.repairs?.length || 0) > n - 1 && !x.running && x.status === 'awaiting_review' && (x.repairs?.length || 0) >= idle.expect; }, { label: 'aplicare' }); };
  idle.expect = 0; const nextRepair = async () => { idle.expect = ((await project(id)).project.repairs?.length || 0) + 1; };
  const wb = async p => (await api('GET', `projects/${id}/workbench/1/${p}`)).body;
  const preview = async (p, command, payload) => { const r = await api('POST', `projects/${id}/workbench/1/${p}/preview`, { command, payload }); assert.equal(r.status, 200, JSON.stringify(r.body)); return r.body; };
  const commit = (p, command, payload, previewHash) => api('POST', `projects/${id}/workbench/1/${p}/commit`, { command, payload, previewHash });

  const w4 = await wb(4); assert.equal(w4.thumbnails.length, 13); assert.equal(w4.commands.find(c => c.id === 'color').available, true); assert.ok(w4.versions.ill_0_4);
  assert.equal((await api('GET', `projects/${id}/workbench/9/1`)).status, 400); assert.equal((await api('GET', `projects/${id}/workbench/1/13`)).status, 400);

  /* exact typo p7: local, no AI, only final_0#p7 */
  const t7 = d.artifacts.final_0.content.pages[6].text, word = t7.split(/\s+/).find(x => x.length > 3 && t7.split(x).length === 2).replace(/[^\p{L}]/gu, '');
  const ex = await preview(7, 'exact', { from: word, to: word.toUpperCase() }); assert.equal(ex.ai, false); assert.ok(ex.graph, 'impactul din graful de dependențe');
  const ill7 = d.artifacts.ill_0_7.content.color, calls0 = (await api('GET', 'ledger')).body?.rows?.length;
  const exr = await commit(7, 'exact', { from: word, to: word.toUpperCase() }, ex.previewHash); assert.equal(exr.status, 200, JSON.stringify(exr.body));
  assert.equal(exr.body.verify.ok, true); assert.deepEqual(exr.body.verify.changed, ['final_0#p7']); assert.deepEqual(exr.body.calls, []);
  d = await project(id); assert.ok(d.artifacts.final_0.content.pages[6].text.includes(word.toUpperCase())); assert.equal(d.artifacts.ill_0_7.content.color, ill7, 'arta p7 păstrată pentru o greșeală');
  if (calls0 != null) assert.equal((await api('GET', 'ledger')).body.rows.length, calls0, 'niciun apel AI');

  /* cancel: a preview writes nothing */
  const v0 = versions(d); await preview(4, 'color', { note: 'mai luminos' }); await preview(3, 'layout', { family: 'panorama', zone: 'top' });
  assert.deepEqual(versions(await project(id)), v0, 'previzualizarea impactului nu scrie nimic');

  /* stale revision */
  const lay = await preview(5, 'layout', { family: 'panorama', zone: 'top' });
  const w5 = d.artifacts.final_0.content.pages[4].text.split(/\s+/).find(x => x.length > 3 && d.artifacts.final_0.content.pages[4].text.split(x).length === 2).replace(/[^\p{L}]/gu, '');
  const e5 = await preview(5, 'exact', { from: w5, to: w5 + 'x' }); assert.equal((await commit(5, 'exact', { from: w5, to: w5 + 'x' }, e5.previewHash)).status, 200);
  const st = await commit(5, 'layout', { family: 'panorama', zone: 'top' }, lay.previewHash); assert.equal(st.status, 409); assert.equal(st.body.code, 'stale_preview');
  const lay2 = await preview(5, 'layout', { family: 'panorama', zone: 'top' }); const lr = await commit(5, 'layout', { family: 'panorama', zone: 'top' }, lay2.previewHash);
  assert.equal(lr.status, 200); assert.deepEqual(lr.body.verify.changed, [], 'macheta nu schimbă nicio unitate de text/artă');
  d = await project(id); assert.deepEqual(d.artifacts.final_0.content.pages[4].layout.family, 'panorama'); assert.equal(d.artifacts.final_0.content.pages[4].text_zone, (await project(id)).artifacts.final_0.content.pages[4].text_zone);

  /* line p4 only: colour hash identical */
  d = await project(id); const col4 = d.artifacts.ill_0_4.content.color, line4 = d.artifacts.ill_0_4.content.lineart;
  const l4 = await preview(4, 'line', { note: 'linii mai groase' }); assert.equal(l4.applicable, true); await nextRepair(); const lcr = await commit(4, 'line', { note: 'linii mai groase' }, l4.previewHash); assert.equal(lcr.status, 200, JSON.stringify(lcr.body));
  await idle(); d = await project(id); let rep = d.project.repairs.at(-1);
  assert.equal(d.artifacts.ill_0_4.content.color, col4, 'culoarea neatinsă'); assert.ok(rep.verify.ok, JSON.stringify(rep.verify)); assert.deepEqual(rep.verify.changed, ['ill_0_4:line']);
  assert.notEqual(d.artifacts.ill_0_4.content.lineart, line4);

  /* colour p4 (AI, through the gate's targeted repair) */
  const before = await project(id), p5c = before.artifacts.ill_0_5.content.color;
  const c4 = await preview(4, 'color', { note: 'mai luminos' }); assert.equal(c4.inGate, true); assert.equal(c4.item, 'img:ill_0_4:color');
  await nextRepair(); const cr = await commit(4, 'color', { note: 'mai luminos' }, c4.previewHash); assert.equal(cr.status, 200, JSON.stringify(cr.body)); assert.equal(cr.body.started, true);
  await idle(); d = await project(id); rep = d.project.repairs.at(-1);
  assert.equal(rep.verify.ok, true, JSON.stringify(rep.verify)); assert.ok(rep.verify.changed.includes('ill_0_4:color')); assert.ok(rep.verify.changed.every(u => u.startsWith('ill_0_4:')), 'numai pagina 4');
  assert.equal(d.artifacts.ill_0_5.content.color, p5c); assert.notEqual(d.artifacts.ill_0_4.content.lineFrom, d.artifacts.ill_0_4.content.color, 'linia p4 depășită');
  assert.ok(rep.calls.length >= 1 && rep.calls.length <= 4, 'apelurile țintite: imagine + QA');

  const lAfter = await preview(4, 'line', { note: 'x' }); assert.equal(lAfter.applicable, false, 'linia depășită se derivă la aprobarea culorii');
  assert.equal((await commit(4, 'line', { note: 'x' }, lAfter.previewHash)).body.code, 'item_not_applicable');
  assert.match((await wb(4)).commands.find(c => c.id === 'line').reason, /aprobi culoarea/);

  /* semantic text p7 */
  const s7 = await preview(7, 'semantic', { note: 'Milo găsește cuibul ascuns' }); assert.deepEqual(s7.stale.slice(0, 2), ['ill_0_7:color', 'ill_0_7:line']);
  await nextRepair(); const sr = await commit(7, 'semantic', { note: 'Milo găsește cuibul ascuns' }, s7.previewHash); assert.equal(sr.status, 200, JSON.stringify(sr.body)); await idle();
  d = await project(id); rep = d.project.repairs.at(-1); assert.equal(rep.plan.patches[0].op, 'semantic'); assert.ok(rep.verify.ok, JSON.stringify(rep.verify));
  assert.equal(d.artifacts.ill_0_2.content.color, before.artifacts.ill_0_2.content.color, 'frații neatinși');
  const sem = await commit(7, 'semantic', { note: 'x' }, s7.previewHash); assert.equal(sem.status, 409, 'hash-ul vechi nu mai este valid după schimbare');

  /* restore after more than five candidates; the approved one is pinned and never evicted */
  const png = Buffer.from(await (await fetch(`${BASE}/files/${id}/${d.artifacts.ill_0_2.content.color}`)).arrayBuffer());
  assert.equal((await api('POST', `projects/${id}/items`, { decisions: [{ id: 'img:ill_0_2:color', state: 'approved' }] })).status, 200);
  const approvedV = (await project(id)).artifacts.ill_0_2.version;
  for (let i = 0; i < 6; i++) assert.equal((await api('POST', `projects/${id}/artifacts/ill_0_2/media`, { mode: 'color', data: png.toString('base64') })).status, 200);
  const w2 = await wb(2), set = w2.versions.ill_0_2; assert.ok(set.versions.length >= 7); assert.equal(set.versions.find(x => x.version === approvedV).status, 'approved');
  const plan = (await api('GET', `projects/${id}/retention?keep=5`)).body; assert.ok(!plan.remove.some(r => r.key === 'ill_0_2' && r.version === approvedV), 'aprobatul nu este eliminat');
  const rs = await api('POST', `projects/${id}/artifacts/ill_0_2/restore`, { version: approvedV }); assert.equal(rs.status, 200);
  const w2b = await wb(2); assert.equal(w2b.versions.ill_0_2.versions.find(x => x.version === rs.body.version).restoredFrom.version, approvedV);

  /* full preview + workbench deep link in a real browser */
  const browser = process.env.BROWSER_PATH;
  if (browser && fs.existsSync(browser)) {
    const { evalInPage } = await import('./cdp.mjs');
    const out = await evalInPage(browser, `${process.env.WP_BASE}/#/p/${id}/book/1/4`, `(() => { const w = document.getElementById('workbench'); if (!w || !w.dataset.state) return null; const r = { wbPage: w.dataset.p, thumbs: w.querySelectorAll('.wb-thumb').length }; const count = m => { S.book.mode = m; render(); return document.querySelectorAll('.pages .pg').length; }; r.story = count('story'); r.coloring = count('coloring'); r.pair = count('pair'); S.book.lang = 'second'; render(); r.second = [...document.querySelectorAll('.pages .band:not(.cover)')].length; r.generic = document.querySelectorAll('a[href$="/preview"]').length; return JSON.stringify(r); })()`, { timeout: 40000 });
    const r = JSON.parse(out); assert.equal(r.wbPage, '4'); assert.equal(r.thumbs, 13);
    assert.ok(r.story >= 13 && r.coloring >= 13 && r.pair >= 13, JSON.stringify(r)); assert.ok(r.second >= 12, 'ediția a doua: 12 pagini cu text'); assert.equal(r.generic, 0);
  }
  await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});
