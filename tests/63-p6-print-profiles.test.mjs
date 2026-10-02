// TEST-P6-T04 — interior de 12 pagini vs minimul KDP; color premium vs standard; coperți în carte (digital) vs copertă
// separată; scurgere pe deschidere după mapare. strict12 nu este niciodată gata pentru KDP; prezentarea legacy 28/26 are
// mapare și aprobare explicită, fără a schimba numărul canonic de 12 pagini.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, INPUT, project, ROOT } from './lib.mjs';
import { destinationCheck, pageMap, spreadLeaks, coverWrap, PROFILE_RULES, PROFILE_VERSIONS } from '../server/printprofile.js';
import { contractFromBlueprint, profileCompatibility } from '../server/domain/product-contract.js';
import { validatePageBlueprints, toBlueprint } from '../server/domain/page-blueprints.js';
import { readZip } from '../server/security/safe-zip.js';

const BP = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8'));
const story = BP.structure.books.find(b => b.key === 'story'), coloring = BP.structure.books.find(b => b.key === 'coloring');

test('P6-T04: interiorul strict de 12 pagini nu este niciodată compatibil KDP; prezentarea legacy 28/26 cere aprobare', () => {
  for (const key of ['digital', 'print']) { const c = destinationCheck({ count: 12, book: story, profile: key }); assert.equal(c.semantics, 'strict12'); assert.equal(c.kdpCompatible, false); assert.equal(c.physicalPages, 14); assert.match(c.reasons[0], /Nu este un interior KDP \(minim 24/); }
  assert.equal(profileCompatibility(contractFromBlueprint(BP), 'digital', 'kdp_paperback').status, 'incompatible');
  const s = destinationCheck({ count: 12, book: story, profile: 'kdp' }), c = destinationCheck({ count: 12, book: coloring, profile: 'kdp' });
  assert.equal(s.physicalPages, 28); assert.equal(c.physicalPages, 26); assert.equal(s.canonicalContentPages, 12);
  assert.equal(s.status, 'requires_approval'); assert.equal(s.approved, false); assert.ok(s.reasons.some(r => /aprobarea ta explicită/.test(r)));
  assert.equal(PROFILE_VERSIONS.kdp.semantics, 'legacy-scene-expansion'); assert.equal(PROFILE_RULES.recordedAt, '2026-10-02'); assert.ok(PROFILE_RULES.sources.length >= 2);
  assert.ok(s.map.filter(m => m.canonical).every(m => m.canonical >= 1 && m.canonical <= 12)); assert.equal(new Set(s.map.filter(m => m.canonical).map(m => m.canonical)).size, 12, 'cele 12 pagini canonice, fiecare mapată');
});

test('P6-T04: color premium vs standard — standard (minim 72) este incompatibil pentru 28 de pagini; cartea color nu se tipărește alb-negru', () => {
  assert.equal(destinationCheck({ count: 12, book: story, profile: 'kdp', ink: 'premium_color' }).compatible, true);
  const std = destinationCheck({ count: 12, book: story, profile: 'kdp', ink: 'standard_color' }); assert.equal(std.status, 'incompatible'); assert.match(std.reasons[0], /minimul de 72/);
  assert.equal(destinationCheck({ count: 12, book: story, profile: 'kdp', ink: 'bw' }).status, 'incompatible');
  assert.equal(destinationCheck({ count: 12, book: coloring, profile: 'kdp', ink: 'bw', paper: 'cream' }).compatible, true);
  assert.equal(destinationCheck({ count: 12, book: story, profile: 'kdp', ink: 'premium_color', paper: 'cream' }).compatible, false, 'hârtie crem indisponibilă pentru color premium');
});

test('P6-T04: coperți în carte (digital) vs copertă separată cu cotor din cerneală/hârtie; marginea interioară după numărul de pagini', () => {
  const dm = pageMap(12, story, 'digital'); assert.equal(dm[0].role, 'front_cover'); assert.equal(dm.at(-1).role, 'back'); assert.equal(dm[0].side, 'recto');
  const km = pageMap(12, story, 'kdp'); assert.ok(!km.some(m => m.role === 'front_cover'), 'coperta KDP nu este în interior'); assert.deepEqual(km.slice(0, 3).map(m => m.role), ['title', 'copyright', 'characters']);
  const fmt = BP.formats.portrait45, w = coverWrap(fmt, destinationCheck({ count: 12, book: coloring, profile: 'kdp' })), wc = coverWrap(fmt, destinationCheck({ count: 12, book: coloring, profile: 'kdp', paper: 'cream' }));
  assert.ok(Math.abs(w.widthIn - (8 * 2 + 26 * 0.002252 + 0.25)) < 0.001, 'comportamentul istoric păstrat'); assert.ok(wc.spineIn > w.spineIn); assert.equal(w.spineText, false);
  assert.equal(destinationCheck({ count: 12, book: story, profile: 'kdp' }).gutterIn, 0.375); assert.equal(coverWrap(fmt, destinationCheck({ count: 12, book: story, profile: 'digital' })), null);
});

test('P6-T04: scurgere pe deschidere după mapare — întrebarea p1 cu răspunsul p2 nu se vede în planul canonic, dar se vede în digital; nu în prezentarea KDP', () => {
  const raw = Array.from({ length: 12 }, (_, i) => ({ n: i + 1, role: 'setup', beat: 'b', emotion: 'e', new_information: 's', image_added_value: 'v', turn: i === 0 ? { type: 'question', hook: 'Ce e în tufiș?', payoff_page: 2, payoff: 'Tia' } : { type: 'quiet' } }));
  const bps = raw.map((r, i) => toBlueprint(1, r, i));
  assert.ok(!validatePageBlueprints(bps, { structure: { volumes: 1, pages: 12 } }).findings.some(f => /SPREAD|LEAK|deschidere/i.test(f.code + f.message)), 'planul canonic (p1 recto) nu vede scurgerea');
  const d = spreadLeaks(pageMap(12, story, 'digital'), bps); assert.equal(d.length, 1); assert.equal(d[0].page, 1); assert.equal(d[0].payoffPage, 2);
  assert.deepEqual(spreadLeaks(pageMap(12, story, 'kdp'), bps), [], 'în KDP fiecare scenă are propria deschidere');
});

test('P6-T04 Dinosaur World: contractul de 12 pagini și formatul ales rămân; prezentarea legacy se inspectează separat, neaprobată', () => {
  const doc = JSON.parse([...readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')))].find(([k]) => k.endsWith('/project.json'))[1].toString());
  const c = contractFromBlueprint(doc.blueprint); assert.equal(c.structure.contentPagesPerBook, 12); assert.equal(doc.project.input.page_format, 'portrait45');
  const st = doc.blueprint.structure.books.find(b => b.key === 'story');
  assert.equal(destinationCheck({ count: 12, book: st, profile: 'digital' }).status, 'compatible_unverified');
  const k = destinationCheck({ count: 12, book: st, profile: 'kdp', approval: doc.project.printProfiles?.kdp?.story || null }); assert.equal(k.status, 'requires_approval'); assert.equal(k.physicalPages, 28);
});

test('P6-T04 API: profilurile proiectului; aprobarea explicită (fără schimbarea contractului); standard refuzat; exportul final KDP fără aprobare refuzat; retragere', async () => {
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Profil P6' } })).body.id;
  const contract0 = (await api('GET', `projects/${id}/contract`)).body.contract.contractHash;
  let r = (await api('GET', `projects/${id}/print-profiles`)).body; assert.equal(r.canonicalContentPages, 12);
  const row = (k, b) => r.profiles.find(x => x.profile === k && x.book === b);
  assert.equal(row('digital', 'story').status, 'compatible_unverified'); assert.equal(row('kdp', 'story').status, 'requires_approval'); assert.equal(row('kdp', 'coloring').physicalPages, 26);
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Pages /Count 1 >> endobj\n%%EOF\n');
  const refused = await api('POST', `projects/${id}/exports?name=x.pdf&kind=final&volume=0&book=story&lang=first&preset=kdp`, pdf); assert.equal(refused.status, 409); assert.equal(refused.body.code, 'profile_not_approved');
  const std = await api('POST', `projects/${id}/print-profile`, { profile: 'kdp', book: 'story', ink: 'standard_color' }); assert.equal(std.status, 409); assert.equal(std.body.code, 'profile_incompatible');
  const ok = await api('POST', `projects/${id}/print-profile`, { profile: 'kdp', book: 'coloring', ink: 'bw', paper: 'cream', note: 'pentru tipar KDP' }); assert.equal(ok.status, 200, JSON.stringify(ok.body)); assert.equal(ok.body.check, 'approved_unverified');
  assert.equal(ok.body.approval.canonicalContentPages, 12); assert.equal(ok.body.approval.physicalPages, 26);
  assert.equal((await api('GET', `projects/${id}/contract`)).body.contract.contractHash, contract0, 'contractul canonic neschimbat');
  r = (await api('GET', `projects/${id}/print-profiles`)).body; assert.equal(row('kdp', 'coloring').status, 'approved_unverified'); assert.equal(row('kdp', 'story').status, 'requires_approval', 'aprobarea este per carte');
  const plan = (await api('GET', `projects/${id}/print-plan?book=coloring&profile=kdp`)).body; assert.equal(plan.approved, true); assert.equal(plan.cover.spineIn, +(26 * 0.0025).toFixed(4)); assert.equal(plan.canonicalContentPages, 12);
  assert.ok((await project(id)).project.printProfiles.kdp.coloring.mapHash);
  const dec = (await api('GET', `projects/${id}/decisions`)).body.decisions; assert.ok(dec.some(d => d.kind === 'print_profile' && d.state === 'approved'));
  assert.equal((await api('POST', `projects/${id}/print-profile`, { profile: 'kdp', book: 'coloring', approve: false })).status, 200);
  r = (await api('GET', `projects/${id}/print-profiles`)).body; assert.equal(row('kdp', 'coloring').status, 'requires_approval');
  assert.equal((await api('POST', `projects/${id}/print-profile`, { profile: 'digital', book: 'story' })).status, 400, 'doar legacy cere aprobare');
  const browser = process.env.BROWSER_PATH;
  if (browser && fs.existsSync(browser)) {
    const { evalInPage } = await import('./cdp.mjs');
    const out = await evalInPage(browser, `${process.env.WP_BASE}/#/p/${id}/export`, `(() => { if (!S.printProfiles || !S.printProfiles['${id}']) return null; S.preset = 'kdp'; render(); const k = [...document.querySelectorAll('#print-profile [data-status]')].map(e => e.dataset.book + ':' + e.dataset.status); S.preset = 'digital'; render(); const d = [...document.querySelectorAll('#print-profile [data-status]')].map(e => e.dataset.book + ':' + e.dataset.status); return JSON.stringify({ k, d, approveButtons: 0 }); })()`, { timeout: 30000 });
    const u = JSON.parse(out); assert.deepEqual(u.k.sort(), ['coloring:requires_approval', 'story:requires_approval']); assert.deepEqual(u.d.sort(), ['coloring:compatible_unverified', 'story:compatible_unverified']);
  }
  await api('POST', `projects/${id}/archive`, { archived: true });
});
