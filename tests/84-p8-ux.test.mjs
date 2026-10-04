// TEST-P8-T07 — 375/768/1440 px, zoom 200%, tastatură/modal/focus, stări goale/limitate/eroare, căi lungi, toate paginile
// cărții și edițiile: nicio depășire de pagină sau control inaccesibil; fiecare blocaj duce la o acțiune; toate sarcinile
// principale au ruta lor. Măsurat în browserul real (Chromium headless prin CDP).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { api, setFake, project, waitStatus, waitFor, connectCanva, approveAll, INPUT, BASE } from './lib.mjs';
import { openPage } from './cdp.mjs';
import { AUDIT, violations } from './ux-audit.mjs';
import { server } from '../scripts/enterprise/capacity-bench.mjs';

const BROWSER = process.env.BROWSER_PATH;
const VIEWPORTS = [{ name: '375', width: 375, height: 812, mobile: true }, { name: '768', width: 768, height: 1024 }, { name: '1440', width: 1440, height: 900 }, { name: '1440@200%', width: 1440, height: 900, zoom: 2 }];
let PID;
const settle = async page => { await page.waitFor(`!!document.querySelector('#main') && document.querySelector('#main').children.length > 0`); await new Promise(r => setTimeout(r, 450)); };
async function audit(page, route) { await page.evaluate(`location.hash = ${JSON.stringify(route)}`); await settle(page); return page.evaluate(AUDIT); }

test('P8-T07 pregătire: un proiect cu volumul 1 complet (pagini, ediții EN+RO, imagini)', { skip: !BROWSER && 'fără BROWSER_PATH' }, async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva();
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  PID = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Interfață P8 — un titlu ceva mai lung pentru a verifica încadrarea' } })).body.id;
  await waitFor(async () => !(await api('GET', 'state')).body.projects.some(p => p.running) || null, { label: 'niciun proiect activ', timeout: 120000 });
  assert.equal((await api('POST', `projects/${PID}/start`)).status, 200); await waitStatus(PID, ['awaiting_review']); await approveAll(PID); await waitStatus(PID, ['awaiting_review']); await approveAll(PID); await waitStatus(PID, ['awaiting_review']);
  assert.ok((await project(PID)).artifacts.final_0 || (await project(PID)).artifacts.script_0);
});

test('P8-T07: toate vederile principale la 375/768/1440 px și zoom 200% — fără depășire, controale accesibile și numite, ținte ≥ 24 px pe mobil, blocaje cu acțiune', { skip: !BROWSER && 'fără BROWSER_PATH' }, async () => {
  const routes = ['#/', '#/projects', '#/new/kids-sc', `#/p/${PID}/progress`, `#/p/${PID}/review`, `#/p/${PID}/book`, `#/p/${PID}/book/1/4`, `#/p/${PID}/export`, `#/p/${PID}/activity`, '#/learning', '#/agents', '#/improvements', '#/settings', '#/studio'];
  const found = [];
  for (const vp of VIEWPORTS) {
    const page = await openPage(BROWSER, vp);
    try {
      await page.goto(BASE + '/'); await settle(page);
      for (const r of routes) { const a = await audit(page, r); for (const v of violations(a)) found.push(`${vp.name} ${r}: ${v}`); assert.ok(a.title.includes('WonderPages'), 'titlu pe fiecare pagină'); }
    } finally { await page.close(); }
  }
  if (process.env.WP_UX_DUMP) fs.writeFileSync(process.env.WP_UX_DUMP, found.join('\n') + '\n');   // diagnostics: full list for triage
  assert.deepEqual(found, []);
});

test('P8-T07: toate paginile cărții și ambele ediții sunt accesibile din atelier (deep link) la mobil', { skip: !BROWSER && 'fără BROWSER_PATH' }, async () => {
  const page = await openPage(BROWSER, VIEWPORTS[0]);
  try {
    await page.goto(BASE + '/'); await settle(page); const found = [];
    for (let pg = 0; pg <= 12; pg++) { const a = await audit(page, `#/p/${PID}/book/1/${pg}`); for (const v of violations(a)) found.push(`p${pg}: ${v}`); }
    assert.deepEqual(found, []);
    const langs = await page.evaluate(`[...document.querySelectorAll('#main select, #main [data-lang], #main button')].map(x => x.textContent + ' ' + (x.value || '')).join(' | ')`);
    assert.match(langs, /English|EN|Romanian|RO|ro/i, 'edițiile lingvistice sunt alegeri vizibile');
  } finally { await page.close(); }
});

test('P8-T07: tastatură — dialogul ține focusul (Tab/Shift+Tab), Escape îl închide și focusul revine; după schimbarea rutei focusul nu rămâne în afara conținutului', { skip: !BROWSER && 'fără BROWSER_PATH' }, async () => {
  const page = await openPage(BROWSER, VIEWPORTS[2]);
  try {
    await page.goto(BASE + '/#/p/' + PID + '/activity'); await settle(page);
    await page.evaluate(`(() => { const b = document.querySelector('#main button, #main a[href]'); b.id = b.id || 'opener-p8'; b.focus(); confirmAct('Test P8', 'Verificarea focusului.', 'Confirmă', () => {}); return true; })()`);
    await page.waitFor(`!!document.querySelector('#modal .modal') && document.querySelector('#modal').contains(document.activeElement)`);
    for (let i = 0; i < 6; i++) { await page.key('Tab'); assert.equal(await page.evaluate(`document.querySelector('#modal').contains(document.activeElement)`), true, `Tab ${i + 1} rămâne în dialog`); }
    for (let i = 0; i < 3; i++) { await page.key('Tab', { shift: true }); assert.equal(await page.evaluate(`document.querySelector('#modal').contains(document.activeElement)`), true, 'Shift+Tab rămâne în dialog'); }
    assert.equal(await page.evaluate(`document.querySelector('#modal .modal').getAttribute('aria-modal') === 'true' && !!document.querySelector('#modal .modal').getAttribute('aria-labelledby')`), true, 'dialog numit');
    await page.key('Escape'); await page.waitFor(`!document.querySelector('#modal')`);
    assert.equal(await page.evaluate(`document.activeElement && document.activeElement.id === 'opener-p8'`), true, 'focusul revine la butonul care a deschis dialogul');
    await page.evaluate(`location.hash = '#/settings'`); await settle(page);
    assert.equal(await page.evaluate(`document.activeElement === document.body || !!document.activeElement.closest('#main') || !!document.activeElement.closest('nav, header')`), true);
    await page.key('Tab'); await page.key('Tab');   // keyboard focus (programmatic focus does not show :focus-visible)
    assert.equal(await page.evaluate(`(() => { const b = document.activeElement; if (!b || b === document.body) return false; const cs = getComputedStyle(b); return (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'; })()`), true, 'focus vizibil la tastatură');
  } finally { await page.close(); }
});

test('P8-T07 stări: instalare goală (fără proiecte), furnizor limitat, eroare și cale lungă — fiecare cu acțiune, fără depășire', { skip: !BROWSER && 'fără BROWSER_PATH' }, async () => {
  /* empty installation: a fresh server on empty data */
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-ux-empty-')), fake = path.join(work, 'fake.json'); fs.writeFileSync(fake, '{}');
  const srv = await server({ WP_AUTO_BACKUP: '0', STORAGE: 'local', DATABASE_URL: '', DATA_DIR: path.join(work, 'data'), OUTPUT_DIR: path.join(work, 'o'.repeat(40), 'livrari-cu-un-nume-foarte-lung-pentru-verificare'), WP_FAKE_STATE: fake, CODEX_HOME: path.join(work, 'codex') });
  const page = await openPage(BROWSER, VIEWPORTS[0]);
  try {
    await page.goto(srv.base + '/'); await settle(page);
    let a = await page.evaluate(AUDIT); assert.deepEqual(violations(a), [], 'panoul gol pe mobil');
    assert.equal(await page.evaluate(`!!document.querySelector('#main a[href^="#/new"], #main [data-act*="new"], #main a[href="#/settings"]')`), true, 'starea goală duce la crearea unui proiect / la setări');
    await page.evaluate(`location.hash = '#/settings'`); await settle(page); a = await page.evaluate(AUDIT); assert.deepEqual(violations(a), [], 'setări cu cale de ieșire lungă, pe mobil');
  } finally { await page.close(); srv.child.kill(); await new Promise(r => setTimeout(r, 300)); fs.rmSync(work, { recursive: true, force: true }); }
  /* limited provider (subscription limit) and error (authentication) on the shared instance; a manual weekly budget keeps
     the governor from learning the simulated limit as the real weekly one (it would hold back every later test) */
  await api('PUT', 'settings/budget', { budget5h: 1000, budget7d: 5000 });
  for (const [mode, statuses] of [['ratelimit', ['waiting_limit', 'paused', 'failed']], ['auth', ['failed', 'paused', 'waiting_limit']]]) {
    for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
    setFake({ claude: mode }); const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: `Stare ${mode}` } })).body.id;
    await api('POST', `projects/${id}/start`);
    const p = await waitFor(async () => { const x = (await project(id)).project; return statuses.includes(x.status) && !x.running ? x : null; }, { label: mode, timeout: 120000 });
    const pg = await openPage(BROWSER, VIEWPORTS[0]);
    try { await pg.goto(BASE + `/#/p/${id}/progress`); await settle(pg); const a = await pg.evaluate(AUDIT); assert.deepEqual(violations(a), [], `${mode} (${p.status})`);
      assert.equal(await pg.evaluate(`!!document.querySelector('.banner button, .banner a[href], .notice a[href]')`), true, `${mode}: blocajul are o acțiune`); }
    finally { await pg.close(); }
    setFake({}); await api('POST', `projects/${id}/archive`, { archived: true });
  }
});

test('P8-T07 Dinosaur World în interfață: proiectul migrat se deschide, reconcilierea arată opțiunile, reexportul merge, pregătirea de tipar apare „nemăsurat”', { skip: !BROWSER && 'fără BROWSER_PATH' }, async () => {
  const { ROOT } = await import('./lib.mjs'); const zip = fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip'));
  const post = p => api('POST', p, zip, { headers: { 'content-type': 'application/octet-stream' } });
  const plan = await post('migrations/plan'); assert.equal(plan.status, 200); const run = await post(`migrations/run?plan=${plan.body.planHash}`); assert.equal(run.status, 200, JSON.stringify(run.body).slice(0, 300));
  const id = run.body.projectId; assert.ok(id);
  const page = await openPage(BROWSER, VIEWPORTS[0]);
  try {
    await page.goto(BASE + `/#/p/${id}/activity`); await settle(page); await page.waitFor(`!!document.querySelector('#reconcile')`);
    let a = await page.evaluate(AUDIT); assert.deepEqual(violations(a), [], 'Activitate (DW, mobil)');
    const rec = await page.evaluate(`document.querySelector('#reconcile').textContent`); assert.match(rec, /Reconciliere/); assert.ok(Number(await page.evaluate(`document.querySelector('#reconcile').dataset.conflicts`)) >= 2, 'DW01 și DW02 vizibile cu opțiunile lor');
    await page.evaluate(`location.hash = '#/p/${id}/export'`); await settle(page);
    a = await page.evaluate(AUDIT); assert.deepEqual(violations(a), [], 'Livrare (DW, mobil)');
    assert.match(await page.evaluate(`document.querySelector('#main').textContent`), /nemăsurat|nu este gata|necunoscut/i, 'tipar/canal: nicio pretenție de pregătire fără măsurători');
  } finally { await page.close(); }
  const exp = await api('GET', `projects/${id}/export.zip`, undefined, { raw: true }); assert.equal(exp.status, 200); assert.ok((await exp.arrayBuffer()).byteLength > 1e6, 'reexportul pachetului');
});
