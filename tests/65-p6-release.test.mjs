// TEST-P6-T06 — drepturi lipsă, aprobare/referință învechită, ediție așteptată lipsă, copertă nepotrivită, eroare la
// copia secundară și probă în așteptare: fișiere = hash + inventar, drepturi clare, validare reproductibilă; acceptarea
// fizică doar cu chitanță/probă.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { api, setFake, waitStatus, connectCanva, approveAll, INPUT, project, ROOT } from './lib.mjs';
import { buildCandidate, verifyCandidate, transition, recordProof, exportRelease, snapshotOf, expectedInventory } from '../server/domain/release-candidate.js';
import { readZip } from '../server/security/safe-zip.js';

const BP = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8'));
const FP = 'fp-1';
function state({ bilingual = false, preset = 'digital' } = {}) {
  const project = { id: 'prc00001', input: { target_age: '5-6', language: 'English', ...(bilingual ? { second_language: 'Romanian' } : {}) }, refs: [{ file: 'uploads/milo.png', sha256: 'a'.repeat(64) }] };
  const art = { bible: { version: 2, content: { characters: [{ id: 'milo' }] } }, final_0: { version: 5, content: { pages: [{ n: 1, text: 'Milo.' }], labels: { ai_notice: 'Creat cu AI.' } } } };
  for (let p = 0; p <= 12; p++) art[`ill_0_${p}`] = { version: 1, content: { color: `images/c${p}.png`, lineart: `images/l${p}.png` } };
  const rec = (book, lang = 'first') => ({ book, lang, name: `${book}-${lang}.pdf`, kind: 'final', preset, fingerprint: FP, sha256: crypto.createHash('sha256').update(book + lang).digest('hex'), inspection: { ok: true, version: 1 } });
  const receipts = [rec('story'), rec('coloring'), ...(bilingual ? [rec('story', 'second')] : []), ...(preset === 'kdp' ? [rec('story-cover'), rec('coloring-cover')] : [])];
  return { project, art, receipts, readiness: { status: 'PASS', hash: 'r1', version: 1, checks: [], pdfs: receipts.map(r => ({ book: r.book, lang: r.lang, status: 'pass' })) }, rights: { eligible: true, blockers: [] }, approved: true, fingerprint: FP };
}
const cand = (st, preset = 'digital') => buildCandidate({ project: st.project, bp: BP, art: st.art, v: 0, preset, receipts: st.receipts, readiness: st.readiness, rights: st.rights });
const verify = (rc, st) => verifyCandidate(rc, { project: st.project, bp: BP, art: st.art, approved: st.approved, receipts: st.receipts, readiness: st.readiness, rights: st.rights, fingerprint: st.fingerprint });
const codes = r => r.problems.map(p => p.code);

test('P6-T06: candidatul complet se verifică reproductibil; aprobarea cere previzualizarea reală; export → verificat', async () => {
  const st = state(), rc = cand(st); assert.equal(rc.schema, 'wonderpages.release-candidate/1'); assert.equal(rc.state, 'prepared');
  assert.deepEqual(rc.inventory, [{ book: 'story', lang: 'first' }, { book: 'coloring', lang: 'first' }]); assert.ok(rc.disclosures.some(d => d.id === 'ai_notice' && d.text === 'Creat cu AI.'));
  assert.equal(rc.proof.digital, 'validated'); assert.equal(rc.proof.print, 'not_applicable');
  const v1 = verify(rc, st), v2 = verify(rc, st); assert.equal(v1.ok, true, JSON.stringify(v1.problems)); assert.deepEqual({ ...v1, at: 0 }, { ...v2, at: 0 }, 'reproductibil');
  let c = transition(rc, 'checked', { verification: v1 });
  assert.throws(() => transition(c, 'approved', { verification: v1 }), e => e.code === 'preview_required');
  c = transition(c, 'approved', { verification: v1, previewed: true }); assert.throws(() => transition(c, 'verified', { verification: v1 }), e => e.code === 'rc_state', 'nu se sare peste export');
  c = transition(c, 'exported', { verification: v1 }); c = transition(c, 'verified', { verification: v1 }); assert.deepEqual(c.history.map(h => h.state), ['prepared', 'checked', 'approved', 'exported', 'verified']);
});

test('P6-T06: drepturi lipsă → RIGHTS_MISSING; aprobare sau referință învechită → STALE_*', () => {
  const st = state(), rc = cand(st);
  assert.ok(codes(verify(rc, { ...st, rights: { eligible: false, blockers: [{ ref: 'font:andika', status: 'unknown' }] } })).includes('RIGHTS_MISSING'));
  assert.ok(codes(verify(rc, { ...st, approved: false })).includes('STALE_APPROVAL'));
  const edited = structuredClone(st); edited.art.final_0 = { version: 6, content: { pages: [{ n: 1, text: 'Milo!' }] } };
  const r = verify(rc, edited); assert.ok(r.problems.some(p => p.code === 'STALE_APPROVAL' && p.keys.includes('final_0')), JSON.stringify(r.problems));
  const ref = structuredClone(st); ref.project.refs[0].sha256 = 'b'.repeat(64); assert.ok(codes(verify(rc, ref)).includes('STALE_REF'));
  assert.throws(() => transition(transition(rc, 'checked', { verification: verify(rc, st) }), 'approved', { verification: verify(rc, edited), previewed: true }), e => e.code === 'rc_not_verified', 'o schimbare după verificare blochează aprobarea');
});

test('P6-T06: ediția așteptată lipsă; coperta separată lipsă sau nepotrivită; fișier înlocuit', () => {
  const bi = state({ bilingual: true }), rc = cand(bi); assert.equal(rc.inventory.length, 3);
  const missing = { ...bi, receipts: bi.receipts.filter(r => !(r.book === 'story' && r.lang === 'second')) };
  assert.ok(verify(rc, missing).problems.some(p => p.code === 'EDITION_MISSING' && p.lang === 'second'));
  const k = state({ preset: 'kdp' }), rk = cand(k, 'kdp'); assert.equal(rk.inventory.filter(x => x.cover).length, 2); assert.equal(rk.proof.print, 'pending');
  assert.ok(codes(verify(rk, { ...k, receipts: k.receipts.filter(r => r.book !== 'coloring-cover') })).includes('COVER_MISMATCH'));
  assert.ok(codes(verify(rk, { ...k, readiness: { ...k.readiness, pdfs: [{ book: 'story-cover', lang: 'first', status: 'fail', problems: ['Geometria copertei separate diferă'] }] } })).includes('COVER_MISMATCH'));
  const swapped = structuredClone(bi); swapped.receipts[0].sha256 = 'c'.repeat(64); assert.ok(codes(verify(rc, swapped)).includes('FILE_CHANGED'));
  assert.ok(codes(verify(rc, { ...bi, readiness: { ...bi.readiness, status: 'NOT_READY', checks: [{ id: 'resolution', status: 'fail' }] } })).includes('DESTINATION_NOT_READY'));
});

test('P6-T06: eroarea copiei secundare nu anulează exportul principal', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-rc-')), zip = path.join(dir, 'Volumul-01.zip'); fs.writeFileSync(zip, 'zip');
  const r = await exportRelease({ zip, manifestPath: zip + '.release-candidate.json', manifest: { id: 'rc1' }, writeFile: (f, d) => fs.promises.writeFile(f, d), mirror: async () => { throw new Error('discul secundar lipsește'); } });
  assert.equal(r.mirror.status, 'failed'); assert.match(r.mirror.error, /discul secundar/); assert.ok(fs.existsSync(zip) && fs.existsSync(zip + '.release-candidate.json'), 'exportul principal rămâne');
  const ok = await exportRelease({ zip, manifestPath: zip + '.rc2.json', manifest: {}, writeFile: (f, d) => fs.promises.writeFile(f, d), mirror: async () => ({ dir: '/m' }) }); assert.equal(ok.mirror.status, 'ok');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P6-T06: proba fizică rămâne „pending” până la dovadă; acceptarea fără chitanță este refuzată; digitalul nu are probă fizică', () => {
  const k = state({ preset: 'kdp' }), rk = cand(k, 'kdp');
  assert.throws(() => recordProof(rk, { status: 'accepted' }), e => e.code === 'receipt_required');
  const acc = recordProof(rk, { status: 'accepted', receipt: { reference: 'KDP proof #A123', note: 'culori corecte' } }); assert.equal(acc.proof.print, 'accepted'); assert.equal(acc.proof.receipt.reference, 'KDP proof #A123');
  assert.equal(recordProof(rk, { status: 'rejected', receipt: { reference: 'proba 2' } }).proof.print, 'rejected');
  assert.throws(() => recordProof(cand(state()), { status: 'accepted', receipt: { reference: 'x' } }), e => e.status === 400);
});

test('P6-T06 Dinosaur World: copia Enterprise primește un candidat (raport înainte/după); arhiva originală rămâne intactă', () => {
  const zipPath = path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip'), before = crypto.createHash('sha256').update(fs.readFileSync(zipPath)).digest('hex');
  const doc = JSON.parse([...readZip(fs.readFileSync(zipPath))].find(([k]) => k.endsWith('/project.json'))[1].toString());
  const rc = buildCandidate({ project: doc.project, bp: doc.blueprint, art: doc.artifacts, v: 0, preset: 'digital', receipts: [], readiness: { status: 'NOT_READY', checks: [{ id: 'inventory', status: 'fail' }], pdfs: [] }, rights: { eligible: false, blockers: [{ ref: 'ref:milo', status: 'unknown' }] } });
  assert.ok(rc.snapshot.versions.script_0 && rc.snapshot.refs.length >= 1);
  const r = verifyCandidate(rc, { project: doc.project, bp: doc.blueprint, art: doc.artifacts, approved: false, receipts: [], readiness: { status: 'NOT_READY', checks: [{ id: 'inventory', status: 'fail' }], pdfs: [] }, rights: { eligible: false, blockers: [{ ref: 'ref:milo', status: 'unknown' }] } });
  assert.ok(['STALE_APPROVAL', 'EDITION_MISSING', 'DESTINATION_NOT_READY', 'RIGHTS_MISSING'].every(c => codes(r).includes(c)), JSON.stringify(codes(r)));
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(zipPath)).digest('hex'), before, 'arhiva originală neschimbată');
  assert.deepEqual(expectedInventory({ project: doc.project, bp: doc.blueprint, preset: 'digital' }).map(x => x.book + ':' + x.lang).sort(), ['coloring:first', 'story:first', 'story:second']);
});

test('P6-T06 API: candidatul unui volum neaprobat nu trece; aprobarea și exportul sunt refuzate; proba digitală nu există', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Lansare P6' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']); await approveAll(id); await waitStatus(id, ['awaiting_review']);
  const r = await api('POST', `projects/${id}/release-candidates`, { volume: 1, preset: 'digital' }); assert.equal(r.status, 200, JSON.stringify(r.body));
  const c = r.body.candidate, cs = codes(r.body.verification); assert.equal(c.state, 'prepared'); assert.equal(r.body.verification.ok, false);
  assert.ok(cs.includes('STALE_APPROVAL') && cs.includes('EDITION_MISSING'), JSON.stringify(cs)); assert.ok(cs.some(x => /RIGHTS|DESTINATION/.test(x)));
  const appr = await api('POST', `projects/${id}/release-candidates/${c.id}/approve`, { previewed: true }); assert.equal(appr.status, 409); assert.equal(appr.body.code, 'rc_state');
  assert.equal((await api('POST', `projects/${id}/release-candidates/${c.id}/export`)).status, 409);
  assert.equal((await api('POST', `projects/${id}/release-candidates/${c.id}/proof`, { status: 'accepted', receipt: { reference: 'x' } })).status, 400, 'digitalul nu are probă fizică');
  const list = (await api('GET', `projects/${id}/release-candidates`)).body.candidates; assert.equal(list[0].candidate.id, c.id); assert.equal(list[0].verification.ok, false);
  assert.equal((await api('POST', `projects/${id}/release-candidates`, { volume: 9 })).status, 400);
  assert.ok((await project(id)).project.releaseCandidates[c.id].snapshot.hash, 'candidatul este persistat cu snapshot-ul exact');
  await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});
