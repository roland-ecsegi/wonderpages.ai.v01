// TEST-P5-T02 — criterii lipsă/duplicate, citat inventat, pagini bune dar final lipsă, nepotrivire de cauzalitate și
// text nativ reparat regresiv: dovezi complete și curente, politica și modelul exacte în evaluare; pragurile propuse
// (OUTPUT-13) se aplică numai versiunii țintă; rezultatele istorice nu se reetichetează.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, setFake, waitStatus, connectCanva, approveAll, INPUT, project, ROOT } from './lib.mjs';
import { assessText, assessBook, policyFor, regressions, quoteFound, QUALITY_POLICIES } from '../server/quality/assessment.js';
import { localization } from '../server/domain/story-contracts.js';
import { canonicalHash } from '../server/domain/canonical.js';
import { readZip } from '../server/security/safe-zip.js';

const BP = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8'));
const V15 = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/mocks/legacy-blueprint-v15.json'), 'utf8'));
const CODES = Array.from({ length: 18 }, (_, i) => 'T' + String(i + 1).padStart(2, '0'));
const content = () => ({ title: 'Milo', pages: Array.from({ length: 12 }, (_, i) => ({ n: i + 1, text: `Milo and Tia find a gentle surprise on page ${i + 1}.`, actions: [{ character: 'milo', action: 'walks' }], characters: ['milo'] })), story_bible: { goal: 'g', climax_choice: 'c', resolution: 'r', causality: { goal: { page: 1, quote: 'surprise on page 1' }, choice: { page: 7, quote: 'surprise on page 7' }, consequence: { page: 11, quote: 'surprise on page 11' } } } });
const reply = (score = 9, evidence = 'Milo and Tia find a gentle surprise', over = {}) => ({ criteria: CODES.map(c => ({ code: c, score: over[c] ?? score, evidence })), issues: [] });
const stage = { critic_prompt: 'critic', critical_threshold: 7 };

test('P5-T02: acoperirea rubricii — criteriu lipsă, duplicat sau necunoscut face evaluarea invalidă; cele 18 coduri se păstrează', () => {
  assert.equal(BP.rubric.length, 18); assert.deepEqual(BP.rubric.map(r => r.code), CODES);
  const ok = assessText({ reply: reply(), content: content(), bp: BP, stage }); assert.equal(ok.valid, true); assert.equal(ok.pass, true); assert.equal(ok.coverage.codes, 18);
  const miss = reply(); miss.criteria = miss.criteria.filter(c => c.code !== 'T05');
  const a = assessText({ reply: miss, content: content(), bp: BP, stage }); assert.equal(a.valid, false); assert.ok(a.coverage.errors.some(e => /T05/.test(e)));
  const dup = reply(); dup.criteria.push({ code: 'T02', score: 9, evidence: 'Milo and Tia' }); dup.criteria.push({ code: 'T99', score: 9, evidence: 'Milo and Tia' });
  const b = assessText({ reply: dup, content: content(), bp: BP, stage }); assert.equal(b.valid, false); assert.ok(b.coverage.errors.some(e => /duplicat/.test(e)) && b.coverage.errors.some(e => /necunoscut/.test(e)));
});

test('P5-T02: citatul inventat este detectat; politica v2 eșuează închis, v1 îl consemnează fără reetichetare', () => {
  assert.equal(quoteFound('“a gentle surprise on page 3”', content()).valid, true);
  assert.equal(quoteFound('Pagina 4: Milo and Tia find a gentle surprise on page 4', content()).valid, true, 'prefixul de pagină nu contează');
  assert.equal(quoteFound('Tia rides a purple dragon', content()).valid, false);
  const v2 = assessText({ reply: reply(9, 'Tia rides a purple dragon'), content: content(), bp: BP, stage });
  assert.equal(v2.policy.version, 2); assert.equal(v2.valid, false); assert.equal(v2.pass, false); assert.equal(v2.evidence.fabricated.length, 18);
  const v1 = assessText({ reply: reply(9, 'Tia rides a purple dragon'), content: content(), bp: V15, stage });
  assert.equal(v1.policy.version, 1); assert.equal(v1.valid, true); assert.equal(v1.pass, true, 'regula veche rămâne aceeași pentru tipurile vechi'); assert.equal(v1.evidence.fabricated.length, 18, 'dar dovada inventată este consemnată');
});

test('P5-T02: pragurile propuse (T01/T08 ≥ 8, niciun criteriu < 7) se aplică doar versiunii țintă', () => {
  assert.equal(policyFor(BP).version, 2); assert.equal(policyFor(V15).version, 1); assert.equal(QUALITY_POLICIES[2].status, 'proposed');
  const r = reply(9, 'Milo and Tia', { T01: 7.5, T12: 6.5 });
  const old = assessText({ reply: r, content: content(), bp: V15, stage }), cur = assessText({ reply: r, content: content(), bp: BP, stage });
  assert.equal(old.pass, true, 'v1: medie ≥ 8 și criticele ≥ 7'); assert.equal(cur.pass, false); assert.ok(cur.reasons.some(x => /T01/.test(x)) && cur.reasons.some(x => /T12/.test(x)));
});

test('P5-T02: pagini bune dar final lipsă și nepotrivire de cauzalitate → cartea nu trece; evaluarea veche (altă versiune) nu contează', () => {
  const c = content(); const meta = a => ({ assessment: { ...a, subject: { hash: canonicalHash(c) } } });
  const good = assessText({ reply: reply(), content: c, bp: BP, stage });
  const art = (cc, m) => ({ final_0: { content: cc, meta: m }, series: { content: { volumes: [{ story_bible: { goal: 'g', climax_choice: 'c', resolution: 'r' } }] } }, cast: { content: { main_character: 'milo' } } });
  assert.equal(assessBook({ bp: BP, art: art(c, meta(good)), project: { input: { target_age: '3-4' } }, v: 0 }).pass, true);
  const noEnd = structuredClone(c); noEnd.story_bible.causality.consequence = { page: 5, quote: 'surprise on page 5' }; noEnd.story_bible.causality.choice = { page: 4, quote: 'surprise on page 4' }; noEnd.pages[11].text = '';
  const b1 = assessBook({ bp: BP, art: art(noEnd, { assessment: { ...good, subject: { hash: canonicalHash(noEnd) } } }), project: { input: {} }, v: 0 });
  assert.equal(b1.pass, false); assert.ok(b1.reasons.some(r => /finalul/.test(r)), JSON.stringify(b1.reasons));
  const mism = structuredClone(c); mism.story_bible.causality.choice = { page: 12, quote: 'surprise on page 12' };
  const b2 = assessBook({ bp: BP, art: art(mism, { assessment: { ...good, subject: { hash: canonicalHash(mism) } } }), project: { input: {} }, v: 0 });
  assert.equal(b2.pass, false); assert.ok(b2.reasons.some(r => /Ordinea/.test(r)));
  const stale = assessBook({ bp: BP, art: art(c, { assessment: { ...good, subject: { hash: 'altă-versiune' } } }), project: { input: {} }, v: 0 });
  assert.equal(stale.pass, false); assert.ok(stale.reasons.some(r => /învechită/.test(r)), 'dovezile trebuie să fie curente');
});

test('P5-T02: un text nativ reparat care introduce un calc este o regresie', () => {
  const src = content(), tr = { pages: src.pages.map(p => ({ n: p.n, text: 'Milo și Tia găsesc o surpriză blândă.' })) };
  const before = { score: 6, criteria: {}, checks: localization(src, tr, { names: ['Milo', 'Tia'] }).findings };
  const bad = structuredClone(tr); bad.pages[0].text = 'Asta face sens, spune Milo și Tia.';
  const after = { score: 9, criteria: {}, checks: localization(src, bad, { names: ['Milo', 'Tia'] }).findings };
  const r = regressions(before, after); assert.ok(r.some(x => x.kind === 'check' && x.code === 'TR_CALQUE'), 'scorul mai mare nu ascunde regresia');
});

test('P5-T02 Dinosaur World: V1 evaluat proaspăt, fără rescriere; EN/RO comparate pe aceleași pagini', () => {
  const doc = JSON.parse([...readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')))].find(([k]) => k.endsWith('/project.json'))[1].toString());
  const s0 = doc.artifacts.script_0.content, before = canonicalHash(s0);
  const quote = s0.pages[8].text.split(/[.!?]/)[0];
  const a = assessText({ reply: reply(9, `“${quote}”`), content: s0, bp: doc.blueprint, stage });
  assert.equal(a.valid, true); assert.equal(a.evidence.fabricated.length, 0); assert.equal(a.policy.version, 1, 'DW își păstrează politica tipului său (v15)');
  const ro = { pages: s0.pages.map(p => ({ n: p.n, text: p.text_ro })) };
  assert.ok(!localization(s0, ro, { names: ['Milo', 'Tia', 'Pip'] }).findings.some(f => f.severity === 'blocker'));
  assert.equal(canonicalHash(s0), before, 'evaluarea nu rescrie');
});

test('P5-T02 API: evaluări cu politica și modelul exacte; elementul „book” la poarta finală; reparația nativă regresivă nu este păstrată', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Evaluare P5' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']); await approveAll(id);
  await waitStatus(id, ['awaiting_review']);
  setFake({ nativeScores: [6, 9], nativeRegress: true }); await approveAll(id);
  const p = await waitStatus(id, ['awaiting_review']); assert.equal(p.gate.key, 'review_2');
  const as = (await api('GET', `projects/${id}/assessment/1`)).body;
  assert.equal(as.policy.version, 2); assert.equal(as.script.assessment.policy.version, 2); assert.ok(as.script.assessment.model?.agent, 'snapshot-ul modelului');
  assert.equal(as.final.assessment?.level, 'script'); assert.equal(as.final.assessment.pass, true, 'textul final este evaluat pe versiunea lui');
  assert.equal(as.book.pass, true, JSON.stringify(as.book.reasons));
  const d = await project(id); const it = d.review.items.find(i => i.kind === 'book'); assert.ok(it && it.blocked === false);
  assert.ok(!/face sens/.test(d.artifacts.tr_0.content.pages[0].text), 'reparația nativă regresivă a fost respinsă');
  assert.ok(as.native.assessment?.regressionRejected?.some(r => r.code === 'TR_CALQUE'), JSON.stringify(as.native.assessment));
  setFake({}); await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});

test('P5-T02 API: un critic care citează text inexistent este întrebat din nou, apoi etapa eșuează închis', async () => {
  setFake({ criticFabricated: true });
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Dovezi P5' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']); await approveAll(id);
  let p; for (let i = 0; i < 200; i++) { p = (await project(id)).project; if (['failed', 'paused', 'awaiting_review'].includes(p.status) && !p.running) break; await new Promise(r => setTimeout(r, 200)); }
  assert.notEqual(p.gate?.key, 'review_1', 'nu ajunge la revizuire cu o evaluare inventată');
  assert.match(JSON.stringify(p.stages?.['critic@1'] || {}) + (p.error || ''), /nu există|citează/);
  setFake({}); await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});
