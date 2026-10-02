// TEST-P5-T01 — scenariu cu medie mare și blocaj de siguranță, imagine la limită, traducere nesigură, verdict lipsă,
// imitație periculoasă și contra-exemple de stereotip: orice non-PASS oprește producția/livrarea; defectul este explicat;
// reparație sau verificare manuală; scorul mare nu compensează.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, setFake, waitStatus, connectCanva, INPUT, project, ROOT } from './lib.mjs';
import { textSafety, volumeSafety, inputSafety, SAFETY_POLICY } from '../server/quality/safety.js';
import { rubricEvaluation, visualVerdicts } from '../server/contracts.js';
import { releaseCheck } from '../server/domain/decisions.js';
import { readZip } from '../server/security/safe-zip.js';

const BP = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8'));
const page = (n, text) => ({ n, text, scene: `Milo în poiană ${n}`, actions: [{ character: 'milo', action: 'walks' }] });
const vol = (fn = n => `Milo finds a gentle surprise on page ${n}.`) => ({ pages: Array.from({ length: 12 }, (_, i) => page(i + 1, fn(i + 1))) });
const proj = (extra = {}) => ({ id: 'px', input: { target_age: '3-4' }, options: { images: true }, ...extra });

test('P5-T01: imitație periculoasă și stereotipuri sunt blocate; contra-exemplele (regula de siguranță, „și fetele și băieții”) trec', () => {
  for (const [t, v] of [['Milo plays with matches.', 'BLOCK'], ['Tia climbs onto the window sill.', 'BLOCK'], ['Pip swallows a coin.', 'BLOCK'], ['Girls can\'t climb trees.', 'BLOCK'], ['Băieții nu plâng.', 'BLOCK'],
    ['Milo never plays with matches; he asks a grown-up.', 'PASS'], ['Tia climbs onto the window sill with her dad holding her.', 'PASS'], ['Girls and boys can climb trees.', 'PASS'], ['Și fetele și băieții pot sări.', 'PASS'], ['The chimney is smoking.', 'PASS'], ['Milo has begun to play.', 'PASS']])
    assert.equal(textSafety(t, { age: '3-4' }).verdict, v, t);
  const f = textSafety('Milo plays with matches.').findings[0]; assert.ok(f.quote && f.fix && f.category === 'dangerous_imitation', 'defectul este explicat (citat + corectură)');
  assert.equal(textSafety('Tia was terrified of the monster attack.', { age: '3-4' }).verdict, 'REVIEW'); assert.equal(textSafety('Tia was terrified of the monster attack.', { age: '7-8' }).verdict, 'PASS', 'potrivirea pe vârstă');
});

test('P5-T01: un scenariu cu medie mare și un blocaj de siguranță rămâne BLOCK; elementul porții nu poate fi aprobat', async () => {
  const rubric = BP.rubric.map(r => ({ code: r.code, score: 10, evidence: 'citat' }));
  const ev = rubricEvaluation({ criteria: rubric, issues: [] }, BP, { critic_prompt: 'critic' }, 8); assert.equal(ev.pass, true); assert.equal(ev.score, 10);
  const s = vol(); s.pages[6].text = 'Milo sees blood on the path.';
  const sf = volumeSafety({ bp: BP, art: { script_0: { content: s } }, project: proj(), v: 0, images: false });
  assert.equal(sf.verdict, 'BLOCK', 'scorul 10 nu compensează'); assert.equal(sf.blocking[0].page, 7);
  const engine = await import('../server/engine.js');
  const items = engine.gateItems(BP, { script_0: { content: s, version: 1 } }, { ...proj(), approvals: {} }, { key: 'review_1', vol: 0 });
  const it = items.find(i => i.kind === 'safety'); assert.ok(it); assert.equal(it.blocked, true); assert.equal(it.state, 'error');
});

test('P5-T01: imagine la limită (REVIEW), blocată (BLOCK) sau fără verdict (UNKNOWN); verificarea unui adult clarifică doar REVIEW/UNKNOWN pe hash-ul curent', () => {
  const art = { final_0: { content: vol() } };
  for (let p = 0; p <= 12; p++) art[`ill_0_${p}`] = { content: { color: `images/c${p}.png`, qa: { ok: true, safety: 'pass' } } };
  art.ill_0_3.content.qa.safety = 'review'; art.ill_0_4.content.qa.safety = 'block'; delete art.ill_0_5.content.qa.safety;
  let sf = volumeSafety({ bp: BP, art, project: proj(), v: 0 });
  const by = id => sf.subjects.find(s => s.id === id);
  assert.equal(by('ill_0_3').verdict, 'REVIEW'); assert.equal(by('ill_0_4').verdict, 'BLOCK'); assert.equal(by('ill_0_5').verdict, 'UNKNOWN'); assert.equal(sf.verdict, 'BLOCK');
  const reviews = { ill_0_3: { hash: by('ill_0_3').hash, decision: 'pass' }, ill_0_4: { hash: by('ill_0_4').hash, decision: 'pass' }, ill_0_5: { hash: 'alt-hash', decision: 'pass' } };
  sf = volumeSafety({ bp: BP, art, project: proj({ safetyReviews: reviews }), v: 0 });
  assert.equal(by.call(null, 'x') === undefined, true);
  const by2 = id => sf.subjects.find(s => s.id === id);
  assert.equal(by2('ill_0_3').verdict, 'PASS', 'REVIEW clarificat de un adult'); assert.equal(by2('ill_0_4').verdict, 'BLOCK', 'BLOCK nu se poate suprascrie'); assert.equal(by2('ill_0_5').verdict, 'UNKNOWN', 'o verificare pe altă versiune nu contează');
  assert.throws(() => visualVerdicts({ pages: [{ image: 0, ok: true, anatomy: true, action: true, story: true, readability: true, issues: [], safety: 'maybe' }] }, [0]), e => e.code === 'validation');
  assert.equal(visualVerdicts({ pages: [{ image: 0, ok: true, anatomy: true, action: true, story: true, readability: true, issues: [] }] }, [0])[0].safety, undefined, 'verdictul lipsă rămâne necunoscut, nu „pass”');
});

test('P5-T01: traducerea nesigură este prinsă pe ediția nativă; livrarea este blocată de orice non-PASS', () => {
  const art = { final_0: { content: vol() }, tr_0: { content: vol(n => `Milo găsește o surpriză blândă pe pagina ${n}.`) } };
  art.tr_0.content.pages[1].text = 'Milo se joacă cu chibrituri lângă iarba uscată.';
  const sf = volumeSafety({ bp: BP, art, project: proj({ options: { images: false } }), v: 0 });
  const s = sf.subjects.find(x => x.id === 'tr_0:p2'); assert.equal(s.verdict, 'BLOCK'); assert.equal(s.kind, 'native');
  const rc = releaseCheck({ input: {}, options: {} }, BP, art, 0, { approved: true, safety: sf.blocking });
  assert.equal(rc.eligible, false); assert.ok(rc.blockers.some(b => b.code === 'safety_block' && /chibrituri/.test(b.message)));
});

test('P5-T01 Dinosaur World: suspansul blând și acțiunea fizică trec aceeași politică; lipsa artei rămâne UNKNOWN', () => {
  const doc = JSON.parse([...readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')))].find(([k]) => k.endsWith('/project.json'))[1].toString());
  const art = { ...doc.artifacts, tr_0: { content: { pages: doc.artifacts.script_0.content.pages.map(p => ({ n: p.n, text: p.text_ro })) } } };
  const sf = volumeSafety({ bp: doc.blueprint, art, project: doc.project, v: 0 });
  assert.ok(sf.subjects.filter(s => s.kind !== 'image').every(s => s.verdict === 'PASS'), JSON.stringify(sf.blocking.filter(s => s.kind !== 'image')));
  assert.ok(sf.subjects.filter(s => s.kind === 'image').every(s => s.verdict === 'UNKNOWN')); assert.equal(sf.verdict, 'UNKNOWN');
  assert.equal(inputSafety(doc.project.input).verdict, 'PASS'); assert.equal(sf.policy.version, SAFETY_POLICY.version);
});

test('P5-T01 API: intrarea nesigură este refuzată; un scenariu nesigur oprește producția înaintea imaginilor; BLOCK nu se aprobă manual', async () => {
  const bad = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, short_description: 'Un dinozaur care se joacă cu chibrituri în pădure' } });
  assert.equal(bad.status, 422); assert.equal(bad.body.code, 'input_unsafe'); assert.match(bad.body.message, /chibrituri/);
  setFake({ scriptUnsafe: true }); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Siguranță P5' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']);
  const items = (await project(id)).review.items; await api('POST', `projects/${id}/items`, { decisions: items.map(i => ({ id: i.id, state: 'approved' })) }); await api('POST', `projects/${id}/gate/complete`);
  const p = await waitStatus(id, ['paused']);
  assert.match(p.error || '', /Siguranță/); assert.match(p.error || '', /chibrit|matches/);
  let d = await project(id); assert.ok(!Object.keys(d.artifacts).some(k => /^ill_0_/.test(k)), 'nicio imagine generată pe un text nesigur');
  const sf = (await api('GET', `projects/${id}/safety/1`)).body; const blk = sf.subjects.find(s => s.verdict === 'BLOCK');
  const r = await api('POST', `projects/${id}/safety/review`, { v: 1, subject: blk.id, reason: 'mi se pare în regulă' }); assert.equal(r.status, 409); assert.equal(r.body.code, 'no_override');
  setFake({});
  const script = structuredClone(d.artifacts.script_0.content); script.pages[2].text = 'Milo never plays with matches; he asks a grown-up.';
  assert.equal((await api('POST', `projects/${id}/artifacts/script_0`, { content: script, note: 'reparat' })).status, 200);
  await api('POST', `projects/${id}/start`); const q = await waitStatus(id, ['awaiting_review']); assert.equal(q.gate.key, 'review_1', 'după reparație producția continuă până la demo');
  d = await project(id); const it = d.review.items.find(i => i.kind === 'safety'); assert.equal(it.blocked, false, JSON.stringify(it.safety.subjects));
  await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});
