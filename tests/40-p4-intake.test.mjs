// TEST-P4-T01 — input gol, vârstă invalidă, manuscris peste limite, formular învechit, alias de rută și
// inferență confirmată/anulată: operatorul vede tema/vârsta/limbile/stilul/formatul/sursa înainte de creare;
// rutele duc la funcția reală; Dali nu creează și nu pornește nimic prin inferență.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, INPUT } from './lib.mjs';
import { inferFromText, contractPreview, checkLimits, LIMITS } from '../server/domain/intake.js';
import { contractFromBlueprint, validateProjectInput, editionsFor } from '../server/domain/product-contract.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const T = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints', 'kids-sc.json'), 'utf8'));
const MANUSCRIPT = Array.from({ length: 12 }, (_, i) => `Pagina ${i + 1}. Micuțul dinozaur Tia caută o pietricică strălucitoare lângă pârâu. Prietenul ei o ajută să privească sub frunze.`).join('\n\n');
const projectsCount = async () => (await api('GET', 'state')).body.projects.length;

test('P4-T01: inferență locală — gol refuzat, idee mapată pe câmpuri cu sursa lor, vârstă în afara benzilor doar avertizată', () => {
  assert.throws(() => inferFromText(T, '   '), e => e.code === 'INTAKE_EMPTY');
  const r = inferFromText(T, 'O serie pentru 3-4 ani despre un pui de dinozaur curios, în română și engleză, acuarelă, format pătrat, titlul „Dino Meadow”.');
  assert.equal(r.kind, 'idea'); assert.equal(r.values.target_age, '3-4'); assert.deepEqual(r.values.languages, ['Romanian', 'English']);
  assert.equal(r.values.visual_style, 'watercolor'); assert.equal(r.values.page_format, 'square'); assert.equal(r.values.title, 'Dino Meadow');
  assert.equal(r.sources.target_age, 'din text'); assert.ok(r.values.short_description.startsWith('O serie'));
  const bad = inferFromText(T, 'O poveste pentru copii de 10 ani despre stele');
  assert.equal(bad.values.target_age, undefined, 'nicio bandă inventată'); assert.equal(bad.warnings[0].code, 'AGE_UNSUPPORTED');
  assert.ok(bad.missing.some(m => m.field === 'target_age'), 'câmpul rămâne de ales de operator');
});

test('P4-T01: manuscris recunoscut ca sursă; peste limită → refuz explicit, nu tăiere tăcută', () => {
  const r = inferFromText(T, MANUSCRIPT);
  assert.equal(r.kind, 'manuscript'); assert.equal(r.values.seed_story, MANUSCRIPT.trim()); assert.match(r.sources.short_description, /verifică/);
  const huge = 'Pagina 1. ' + 'Tia merge prin pădure. '.repeat(1200);
  const h = inferFromText(T, huge); assert.equal(h.values.seed_story, undefined); assert.equal(h.warnings[0].code, 'INPUT_TOO_LONG'); assert.equal(h.warnings[0].limit, LIMITS.seed_story);
  assert.equal(checkLimits(T, { seed_story: huge }).length, 1);
});

test('P4-T01: previzualizarea contractului arată tot înainte de creare și se leagă de versiunea tipului', () => {
  const c = contractFromBlueprint(T), opt = { contract: c, validate: validateProjectInput, editions: editionsFor };
  const p = contractPreview(T, { ...INPUT }, opt);
  assert.equal(p.valid, true, JSON.stringify(p.errors)); assert.ok(p.formHash);
  assert.equal(p.age.value, '3-4'); assert.deepEqual(p.languages.map(l => [l.value, l.role]), [['English', 'limba sursă'], ['Romanian', 'adaptare naturală']]);
  assert.ok(p.style.label && p.format.label && p.theme); assert.equal(p.source.kind, 'idea');
  assert.deepEqual([p.structure.volumes, p.structure.pagesPerBook, p.structure.books], [6, 12, 18]);
  const m = contractPreview(T, { ...INPUT, seed_story: MANUSCRIPT }, opt); assert.equal(m.source.kind, 'manuscript'); assert.notEqual(m.formHash, p.formHash);
  assert.notEqual(contractPreview({ ...T, version: T.version + 1 }, { ...INPUT }, opt).formHash, p.formHash, 'altă versiune a tipului → alt hash');
  const inv = contractPreview(T, { ...INPUT, target_age: '9-10' }, opt); assert.equal(inv.valid, false); assert.equal(inv.formHash, null); assert.ok(inv.errors.some(e => e.code === 'AGE_BAND'));
  const empty = contractPreview(T, {}, opt); assert.equal(empty.valid, false); assert.ok(empty.errors.length >= 2);
});

test('P4-T01 API: inferența și previzualizarea nu creează nimic; crearea cere formularul confirmat (stale → 409), refuză manuscrisul prea lung', async () => {
  const n0 = await projectsCount();
  assert.equal((await api('POST', 'intake/infer', { typeSlug: 'kids-sc', text: '' })).status, 400);
  const inf = await api('POST', 'intake/infer', { typeSlug: 'kids-sc', text: 'Idee pentru 5-6 ani, doar în română, stil guașă' }); assert.equal(inf.status, 200);
  assert.deepEqual(inf.body.values.languages, ['Romanian']); assert.equal(inf.body.values.visual_style, 'gouache');
  const pv = await api('POST', 'intake/preview', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Intake P4' } }); assert.equal(pv.status, 200); assert.equal(pv.body.valid, true);
  assert.equal(await projectsCount(), n0, 'inferența și previzualizarea nu creează proiecte');
  assert.equal((await api('POST', 'projects', { typeSlug: 'kids-sc', input: {} })).status, 400, 'input gol refuzat');
  const age = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, target_age: '9-10' } }); assert.equal(age.status, 422); assert.equal(age.body.code, 'contract_invalid');
  const long = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, seed_story: 'x'.repeat(LIMITS.seed_story + 1) } });
  assert.equal(long.status, 422); assert.equal(long.body.code, 'input_too_long'); assert.equal(long.body.errors[0].limit, LIMITS.seed_story);
  const stale = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Intake P4 modificat' }, previewHash: pv.body.formHash });
  assert.equal(stale.status, 409); assert.equal(stale.body.code, 'stale_form');
  assert.equal(await projectsCount(), n0, 'nimic creat la refuz');
  const ok = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Intake P4' }, previewHash: pv.body.formHash }); assert.equal(ok.status, 200, JSON.stringify(ok.body));
  const p = (await api('GET', `projects/${ok.body.id}`)).body.project; assert.equal(p.source.kind, 'idea'); assert.equal(p.status, 'ready', 'creat, nepornit');
  const ms = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, seed_story: MANUSCRIPT } }); assert.equal(ms.status, 200, 'fără previewHash (API existent) rămâne compatibil');
  assert.equal((await api('GET', `projects/${ms.body.id}`)).body.project.source.kind, 'manuscript');
  for (const id of [ok.body.id, ms.body.id]) await api('POST', `projects/${id}/archive`, { archived: true });
});

test('P4-T01: registrul de rute — fiecare link de proiect (inclusiv „preview”) duce la o funcție reală', () => {
  const core = fs.readFileSync(path.join(ROOT, 'public/app/core.js'), 'utf8');
  const tabs = Object.keys(eval('(' + core.match(/PROJECT_TABS = Object\.freeze\((\{[^}]+\})\)/)[1] + ')'));
  const aliases = eval('(' + core.match(/TAB_ALIASES = Object\.freeze\((\{[^}]+\})\)/)[1] + ')');
  assert.equal(aliases.preview, 'book');
  for (const a of Object.values(aliases)) assert.ok(tabs.includes(a), a);
  const used = new Set();
  for (const f of fs.readdirSync(path.join(ROOT, 'public/app'))) for (const m of fs.readFileSync(path.join(ROOT, 'public/app', f), 'utf8').matchAll(/#\/p\/[^\n]{0,60}?(?:\$\{[^}]+\}|'\s*\+\s*[^+\n]+\+\s*')\/([a-z]+)/g)) used.add(m[1]);
  assert.ok(used.has('book') && !used.has('preview'), 'P6-T02: linkul generic „preview” a fost înlocuit cu linkuri exacte către pagina din atelier (aliasul rămâne pentru rutele vechi)');
  for (const t of used) assert.ok(tabs.includes(t) || aliases[t], `ruta „${t}” nu are funcție`);
});

test('P4-T01 UI (browser real): alias preview → Carte; propunerea se confirmă sau se anulează; rezumatul contractului înainte de creare', async t => {
  const browser = process.env.BROWSER_PATH; if (!browser || !fs.existsSync(browser)) return t.skip('fără browser');
  const { evalInPage } = await import('./cdp.mjs');
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Rute P4' } })).body.id;
  const tab = await evalInPage(browser, `${process.env.WP_BASE}/#/p/${id}/preview`, `document.querySelector('nav.tabs a[aria-current=page]')?.getAttribute('href') || null`);
  assert.equal(tab, `#/p/${id}/book`, 'aliasul deschide tabul Carte');
  const flow = `(async () => {
    const wait = async (fn, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = fn(); if (v) return v; await new Promise(r => setTimeout(r, 100)); } return null; };
    if (!await wait(() => document.getElementById('intake-text'))) return null;
    const out = {};
    document.getElementById('intake-text').value = 'Serie pentru 7-8 ani, doar în română, acuarelă';
    document.querySelector('[data-act=intake-infer]').click();
    await wait(() => document.getElementById('intake-proposal'));
    document.querySelector('[data-act=intake-cancel]').click(); await new Promise(r => setTimeout(r, 200));
    out.cancelled = !document.getElementById('intake-proposal') && !document.querySelector('input[data-field=target_age][value="7-8"]')?.checked;
    document.querySelector('[data-act=intake-infer]').click();
    await wait(() => document.getElementById('intake-proposal'));
    document.querySelector('[data-act=intake-apply]').click(); await new Promise(r => setTimeout(r, 200));
    out.applied = !!document.querySelector('input[data-field=target_age][value="7-8"]')?.checked && !!document.querySelector('input[data-field=visual_style][value=watercolor]')?.checked;
    document.querySelector('[data-act=wiz-next]').click();
    const card = await wait(() => document.querySelector('#contract-preview[data-valid=true]'));
    out.preview = card ? card.innerText : null;
    out.createEnabled = !document.querySelector('[data-act=start]')?.disabled;
    return JSON.stringify(out);
  })()`;
  const r = JSON.parse(await evalInPage(browser, `${process.env.WP_BASE}/#/new/kids-sc`, flow, { timeout: 30000 }) || '{}');
  assert.equal(r.cancelled, true, 'anularea nu schimbă formularul'); assert.equal(r.applied, true, 'confirmarea completează formularul');
  assert.ok(r.preview && /7-8|7–8/.test(r.preview) && /Română|Romanian|română/i.test(r.preview) && /Acuarel|acuarel/i.test(r.preview) && /idee/i.test(r.preview) && /6 volume/.test(r.preview), r.preview);
  await api('POST', `projects/${id}/archive`, { archived: true });
});

test('P4-T01: Dali completează doar formularul; acțiunile de creare/pornire/publicare din inferență sunt ignorate', async () => {
  const A = await import('../server/assistant.js');
  const mem = new Map(); const storage = { readJSON: async (k, d) => mem.get(k) ?? d, writeJSON: async (k, v) => { mem.set(k, v); } };
  await A.initAssistant({ listTypes: () => [], getProject: () => null }, storage, async () => ({ reply: 'Gata.', actions: [{ type: 'create_project', values: {} }, { type: 'start_project', pid: 'p1' }, { type: 'publish', pid: 'p1' }, { type: 'fill_project', values: { target_age: '3-4' } }] }), () => ({}));
  const r = await A.chat({ message: 'Fă-mi o carte și pornește-o' });
  assert.deepEqual(r.actions.map(a => a.type), ['fill_project']);
});
