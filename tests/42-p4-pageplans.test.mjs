// TEST-P4-T03 — exact 72 ID-uri, payoff lipsă, scurgere pe aceeași deschidere, deținător greșit al obiectului,
// atlas nevalidat și drepturi de reutilizare între cărți: fiecare pagină planificată are funcție/emoție/valoarea
// imaginii/stare; canonul vizual este propus și aprobat explicit; referințele fără drepturi nu se activează.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { api, setFake, waitStatus, connectCanva, INPUT, project } from './lib.mjs';
import { toBlueprint, derivePageBlueprints, validatePageBlueprints, PAGE_ID } from '../server/domain/page-blueprints.js';
import { atlasFor, landmarkContext } from '../server/domain/atlas.js';
import { readZip } from '../server/security/safe-zip.js';
import { canonicalHash } from '../server/domain/canonical.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BIBLE = { characters: [{ id: 'milo', name: 'Milo', anatomy: { holds_objects_with: ['both small hands held close to the chest'], never: ['long fingers'] } }, { id: 'tia', name: 'Tia', anatomy: { holds_objects_with: ['mouth/beak', 'balanced on the horns'], never: ['human-like hands', 'fingers'] } }], objects: [{ id: 'pebble', name: 'pietricica', introduced: 'volumul 1, pagina 2' }, { id: 'leaf', name: 'frunza', introduced: 'volumul 1, pagina 9' }] };
const page = (n, o = {}) => ({ n, role: 'development', beat: `b${n}`, emotion: 'bucurie', new_information: `s${n}`, image_added_value: `i${n}`, characters: ['milo', 'tia'], actions: [], turn: { type: 'quiet' }, ...o });
const plan = (mut = () => {}) => { const pages = []; for (let v = 1; v <= 6; v++) for (let p = 1; p <= 12; p++) pages.push(toBlueprint(v, page(p, mut(v, p) || {}), p - 1)); return pages; };
const check = pages => validatePageBlueprints(pages, { structure: { volumes: 6, pages: 12 }, bible: BIBLE });
const codes = r => r.findings.map(f => `${f.code}@${f.page || '-'}`);

test('P4-T03: exact 72 de ID-uri V1-P01…V6-P12; lipsă/duplicat → blocaj; câmpurile obligatorii ale fiecărei pagini', () => {
  const ok = check(plan()); assert.equal(ok.count, 72); assert.equal(ok.ready, true, JSON.stringify(ok.findings.slice(0, 3))); assert.deepEqual(ok.findings, []);
  assert.equal(PAGE_ID(6, 12), 'V6-P12');
  const short = plan().filter(p => p.id !== 'V3-P07'); const r = check(short); assert.equal(r.ready, false); assert.ok(r.findings[0].code === 'PAGE_COUNT' && r.findings[0].missing.includes('V3-P07'));
  const dup = plan(); dup.push(dup[0]); assert.ok(check(dup).findings.some(f => f.code === 'PAGE_COUNT' && f.duplicates.includes('V1-P01')));
  const empty = plan((v, p) => (v === 2 && p === 5 ? { emotion: '', image_added_value: '' } : null)); const e = check(empty);
  assert.equal(e.ready, false); assert.ok(e.findings.some(f => f.code === 'PAGE_FIELDS' && f.page === 'V2-P05' && f.fields.includes('emotion') && f.fields.includes('imageValue')));
});

test('P4-T03: payoff lipsă sau înapoi; răspunsul pe aceeași deschidere este o scurgere (maparea fizică explicită)', () => {
  assert.ok(codes(check(plan((v, p) => (v === 1 && p === 5 ? { turn: { type: 'question', hook: 'Ce e acolo?', payoff_page: null } } : null)))).includes('MISSING_PAYOFF@V1-P05'));
  assert.ok(codes(check(plan((v, p) => (v === 1 && p === 5 ? { turn: { type: 'question', hook: 'Ce e acolo?', payoff_page: 3, payoff: 'x' } } : null)))).includes('MISSING_PAYOFF@V1-P05'));
  const leak = plan((v, p) => (v === 1 && p === 2 ? { turn: { type: 'question', hook: 'Cine e?', payoff_page: 3, payoff: 'Pip' } } : null));
  assert.ok(codes(check(leak)).includes('SPREAD_LEAK@V1-P02'), 'paginile 2-3 sunt aceeași deschidere');
  const turned = plan((v, p) => (v === 1 && p === 3 ? { turn: { type: 'question', hook: 'Cine e?', payoff_page: 4, payoff: 'Pip' } } : null));
  assert.deepEqual(check(turned).findings, [], 'răspunsul după întoarcerea paginii este ascuns corect');
  assert.ok(validatePageBlueprints(turned, { structure: { volumes: 6, pages: 12 }, bible: BIBLE, firstSide: 'left' }).findings.some(f => f.code === 'SPREAD_LEAK'), 'cu interiorul pe stânga, 3-4 devin aceeași deschidere');
});

test('P4-T03: deținătorul greșit al obiectului — anatomia, prezența pe pagină și introducerea obiectului', () => {
  const hands = plan((v, p) => (v === 1 && p === 10 ? { actions: [{ character: 'tia', action: 'holds the leaf in her hands', holds: { object: 'leaf', with: 'hands' } }] } : null));
  assert.ok(codes(check(hands)).includes('WRONG_HOLDER@V1-P10'));
  const mouth = plan((v, p) => (v === 1 && p === 10 ? { actions: [{ character: 'tia', action: 'holds the leaf stem in her mouth', holds: { object: 'leaf', with: 'mouth' } }, { character: 'milo', action: 'holds the pebble in both paws at his chest', holds: { object: 'pebble', with: 'both hands' } }] } : null));
  assert.deepEqual(check(mouth).findings, [], 'Tia cu botul și Milo cu mâinile sunt corecte (DW04)');
  const absent = plan((v, p) => (v === 1 && p === 10 ? { characters: ['milo'], actions: [{ character: 'tia', action: 'carries the leaf in her mouth', holds: { object: 'leaf', with: 'mouth' } }] } : null));
  assert.ok(codes(check(absent)).includes('WRONG_HOLDER@V1-P10'), 'deținătorul nu este pe pagină');
  const early = plan((v, p) => (v === 1 && p === 1 ? { actions: [{ character: 'milo', action: 'holds the pebble', holds: { object: 'pebble', with: 'hands' } }] } : null));
  assert.ok(check(early).findings.some(f => f.code === 'WRONG_HOLDER' && f.object === 'pebble'), 'pietricica e ținută înainte de pagina 2');
});

test('P4-T03: atlas nevalidat rămâne propus; aprobarea explicită (cu hash-ul curent) îl activează; reutilizarea fără drepturi rămâne inactivă', () => {
  const art = { bible: { content: { characters: [{ id: 'milo', name: 'Milo', role: 'main' }, { id: 'pip', name: 'Pip' }] } }, cast: { content: { main_character: 'milo', characters: [{ id: 'milo', volumes: [{ volume: 1, presence: 'introduced' }] }, { id: 'pip', volumes: [{ volume: 3, presence: 'introduced' }] }] } }, anchors: { content: { prompts: [{ ref: 'milo', image: 'images/milo-sheet.png', prompt: 'p' }] } },
    atlas: { content: { entries: [{ id: 'pip-front', character: 'pip', view: 'front', file: 'images/pip.png', source: 'reuse', fromProject: 'altul', status: 'approved' }] } } };
  const hashOf = (i, p) => canonicalHash([p.image, p.prompt]);
  let a = atlasFor({ project: { id: 'p1', refs: [] }, art, hashOf });
  assert.ok(a.entries.filter(e => e.id.startsWith('sheet:')).every(e => e.status === 'proposed' && !e.active), 'fișa generată nu este activă fără aprobare');
  assert.equal(a.requirements.find(r => r.character === 'milo' && r.view === 'side').status, 'proposed');
  assert.equal(a.entries.find(e => e.id === 'atlas:pip-front').status, 'inactive_rights'); assert.ok(!a.activeReferences.some(e => e.character === 'pip'));
  a = atlasFor({ project: { id: 'p1', refs: [] }, art, hashOf, approvals: { 'ref:0': { state: 'approved', hash: 'vechi' } } });
  assert.ok(a.entries.filter(e => e.id.startsWith('sheet:')).every(e => !e.active), 'o aprobare pe altă versiune nu activează fișa');
  a = atlasFor({ project: { id: 'p1', refs: [] }, art, hashOf, approvals: { 'ref:0': { state: 'approved', hash: hashOf(0, art.anchors.content.prompts[0]) } }, declaredRights: [{ id: 'atlas:pip-front', source: 'contract de licență', permissions: { commercial: 'yes', reproduction: 'yes', derivative: 'yes' } }] });
  assert.equal(a.requirements.find(r => r.character === 'milo' && r.view === 'side').status, 'covered_approved'); assert.equal(a.requirements.find(r => r.character === 'milo' && r.view === 'expressions').status, 'missing');
  assert.equal(a.entries.find(e => e.id === 'atlas:pip-front').active, true, 'cu drepturi clarificate reutilizarea se activează');
});

test('P4-T03 Dinosaur World: 72 PageBlueprints din planurile existente; cele 2 PNG originale păstrate; Pip și vederile lipsă propuse; contextul reperelor deduplicat fără schimbarea datelor brute', () => {
  const files = readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')));
  const entry = n => [...files.entries()].find(([k]) => k.endsWith(n))?.[1];
  const doc = JSON.parse(entry('project.json').toString('utf8')); const manifest = JSON.parse(entry('PROJECT-MANIFEST.json').toString('utf8'));
  const { pages, sources } = derivePageBlueprints(doc.blueprint, doc.artifacts);
  assert.equal(pages.length, 72); assert.equal(sources[1], 'series.page_plan');
  const r = validatePageBlueprints(pages, { structure: doc.blueprint.structure, bible: doc.artifacts.bible.content });
  assert.equal(r.count, 72); assert.equal(r.summary.blockers, 0, JSON.stringify(r.findings.filter(f => f.severity === 'blocker')));
  const refs = doc.project.refs.map(x => ({ ...x, sha256: crypto.createHash('sha256').update(entry(x.file.replace(/^uploads\//, 'uploads/'))).digest('hex') }));
  for (const x of refs) assert.ok(JSON.stringify(manifest).includes(x.sha256), `${x.file} identic cu manifestul`);
  const a = atlasFor({ project: { ...doc.project, refs }, art: doc.artifacts });
  assert.deepEqual(a.entries.filter(e => e.kind === 'original').map(e => e.character).sort(), ['milo', 'tia']);
  assert.ok(a.requirements.filter(x => x.character === 'pip').every(x => x.status === 'missing' && x.proposal), 'Pip: propunere, nu aprobare inventată');
  assert.ok(a.requirements.some(x => x.character === 'milo' && x.view === 'side' && x.status === 'missing'));
  const before = canonicalHash(doc.artifacts.bible.content);
  for (const c of doc.artifacts.bible.content.characters) { const L = landmarkContext(c); assert.ok(L.deduplicated && L.length < L.rawLength); assert.ok(L.landmarks.every(l => typeof l.relative_size !== 'string' || !l.relative_size.trim().startsWith('{'))); }
  assert.equal(canonicalHash(doc.artifacts.bible.content), before, 'datele brute nu se schimbă');
});

test('P4-T03 API: etapa „Planul paginilor” produce 72 PageBlueprints înaintea porții seriei; planul și atlasul sunt elemente de aprobare', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Planuri P4' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']);
  const d = await project(id); assert.equal(d.project.gate.key, 'review_collection');
  for (let v = 0; v < 6; v++) assert.equal(d.artifacts['plan_' + v]?.content?.pages?.length, 12, 'plan_' + v);
  assert.ok(!Object.keys(d.artifacts).some(k => /^script_/.test(k)), 'niciun manuscris înaintea aprobării planului');
  const pp = d.review.items.find(i => i.kind === 'pageplans'); assert.equal(pp.check.count, 72); assert.equal(pp.blocked, false, JSON.stringify(pp.check.findings));
  const at = d.review.items.find(i => i.kind === 'atlas'); assert.ok(at.atlas.requirements.length >= 2); assert.equal(at.blocked, false);
  assert.ok(at.atlas.requirements.some(r => r.status === 'proposed' || r.status === 'missing'), 'vederile neaprobate rămân propuneri');
  const api72 = (await api('GET', `projects/${id}/pageplans`)).body; assert.equal(api72.count, 72); assert.equal(api72.pages[0].id, 'V1-P01');
  const browser = process.env.BROWSER_PATH;
  if (browser && fs.existsSync(browser)) {
    const { evalInPage } = await import('./cdp.mjs');
    const ui = await evalInPage(browser, `${process.env.WP_BASE}/#/p/${id}/review`, `(() => { const a = document.getElementById('pageplans-check'), b = document.getElementById('atlas-check'); return a && b ? JSON.stringify({ count: a.dataset.count, covered: b.dataset.covered }) : null; })()`);
    assert.ok(ui, 'planul și atlasul sunt randate la aprobare'); assert.equal(JSON.parse(ui).count, '72');
  }
  await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});
