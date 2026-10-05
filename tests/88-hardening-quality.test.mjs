// HARDENING H1 — poarta de calitate: decizia pe media EXACTĂ (OBS-GS-19), un cod de motiv pentru fiecare condiție activă
// (OBS-GS-19), stratul de validitate a dovezilor separat de verdict (OBS-GS-18) și validarea deterministă a formatului
// (cazul 42). Fiecare reparație are proba care eșua „înainte” (evaluation/hardening/probes-before.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';
import { assessText, formatCheck, QUALITY_POLICIES } from '../server/quality/assessment.js';
import { rubricEvaluation } from '../server/contracts.js';
import { PROBES } from '../evaluation/hardening/probes.mjs';
import { runProbe, judge } from '../scripts/enterprise/hardening-probes.mjs';

const BP = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8'));
const V15 = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/mocks/legacy-blueprint-v15.json'), 'utf8'));
const BEFORE = JSON.parse(fs.readFileSync(path.join(ROOT, 'evaluation/hardening/probes-before.json'), 'utf8'));
const CODES = Array.from({ length: 18 }, (_, i) => 'T' + String(i + 1).padStart(2, '0'));
const content = (n = 12) => ({ title: 'Lia', pages: Array.from({ length: n }, (_, i) => ({ n: i + 1, text: `Lia sees thing number ${i + 1} near the pond.` })) });
const reply = (over = {}, ev = i => `Lia sees thing number ${(i % 12) + 1} near the pond`) => ({ criteria: CODES.map((c, i) => ({ code: c, score: over[c] ?? over.all ?? 9, evidence: typeof ev === 'function' ? ev(i) : ev })), issues: [] });
const stage = { critic_prompt: 'critic', critical_threshold: 7 };
const codes = a => a.reasonCodes.map(r => r.code);

test('H1 OBS-GS-19: media exactă decide (7,9556 nu trece), valoarea rotunjită rămâne doar pentru afișare', () => {
  const r = reply({ all: 8, T04: 7.2 });
  const ev = rubricEvaluation(r, BP, stage, 8); assert.equal(ev.score, 8); assert.ok(Math.abs(ev.exactScore - 7.9556) < 0.001); assert.equal(ev.pass, false);
  for (const bp of [BP, V15]) { const a = assessText({ reply: r, content: content(), bp, stage }); assert.equal(a.pass, false, `politica v${a.policy.version}`); assert.equal(a.score, 8); assert.ok(a.exactScore < 8); assert.deepEqual(codes(a), ['QUALITY_MEAN_BELOW_THRESHOLD']); }
  const ok = assessText({ reply: reply({ all: 8 }), content: content(), bp: BP, stage }); assert.equal(ok.pass, true, 'exact 8,0 trece');
});

test('H1 OBS-GS-19: fiecare condiție de respingere activă are propriul cod (nicio respingere fără motiv, niciun motiv parțial)', () => {
  const v1crit = assessText({ reply: reply({ all: 9, T08: 6.9 }), content: content(), bp: V15, stage });
  assert.equal(v1crit.pass, false); assert.deepEqual(codes(v1crit), ['QUALITY_CRITICAL_BELOW_FLOOR']); assert.equal(v1crit.reasonCodes[0].criterion, 'T08'); assert.ok(v1crit.reasons.length >= 1);
  const both = assessText({ reply: reply({ all: 7 }), content: content(), bp: BP, stage });   // cazul 43: media + T01/T08
  assert.deepEqual([...new Set(codes(both))].sort(), ['QUALITY_CRITICAL_BELOW_FLOOR', 'QUALITY_MEAN_BELOW_THRESHOLD']);
  assert.deepEqual(both.reasonCodes.filter(r => r.code === 'QUALITY_CRITICAL_BELOW_FLOOR').map(r => r.criterion).sort(), ['T01', 'T08']);
  const v1both = assessText({ reply: reply({ all: 7 }), content: content(), bp: V15, stage }); assert.deepEqual(codes(v1both), ['QUALITY_MEAN_BELOW_THRESHOLD'], 'v1: criticele 7 trec pragul 7; motivul este media');
  const low = assessText({ reply: reply({ all: 9, T13: 6.5 }), content: content(), bp: BP, stage });
  const m = low.reasonCodes.find(r => r.code === 'QUALITY_CRITERION_BELOW_MINIMUM'); assert.equal(m.criterion, 'T13'); assert.match(m.validation, /NOT validated/);
  for (const a of [v1crit, both, v1both, low]) for (const r of a.reasonCodes) assert.ok(r.message && r.repair && r.layer, JSON.stringify(r));
});

test('H1 OBS-GS-18: stratul de dovezi e separat de verdict — absență, reutilizare, relevanță neverificată', () => {
  const same = assessText({ reply: reply({ all: 9 }, 'Lia sees thing number 1 near the pond'), content: content(), bp: BP, stage });
  assert.equal(same.pass, true, 'politica v2 nu se schimbă (decizie a operatorului)'); assert.ok(same.evidence.codes.includes('EVIDENCE_REUSED_ACROSS_CRITERIA')); assert.equal(same.evidence.reused[0].length, 18); assert.equal(same.evidence.relevance, 'unverified');
  const fab = assessText({ reply: reply({ all: 9 }, 'Tia rides a purple dragon'), content: content(), bp: V15, stage });
  assert.equal(fab.pass, true, 'v1 rămâne cum era (nu se reetichetează)'); assert.ok(fab.evidence.codes.includes('QUALITY_EVIDENCE_NOT_FOUND'), 'dar stratul de dovezi o semnalează'); assert.equal(fab.evidence.status, 'weak');
  const good = assessText({ reply: reply({ all: 9 }), content: content(), bp: BP, stage }); assert.deepEqual(good.evidence.codes, []); assert.equal(good.evidence.status, 'present_unverified', 'prezența nu e declarată suport');
});

test('H1 format determinist: numărul de pagini din contract nu depinde de critic', () => {
  assert.deepEqual(formatCheck(content(12), BP).findings, []);
  const f = formatCheck(content(11), BP); assert.equal(f.findings[0].code, 'QUALITY_FORMAT_PAGE_COUNT'); assert.equal(f.findings[0].expected, 12);
  for (const bp of [BP, V15]) { const a = assessText({ reply: reply({ all: 10 }, i => `Lia sees thing number ${(i % 11) + 1} near the pond`), content: content(11), bp, stage }); assert.equal(a.pass, false); assert.ok(codes(a).includes('QUALITY_FORMAT_PAGE_COUNT')); }
  const seq = content(12); seq.pages[3].n = 9; assert.equal(formatCheck(seq, BP).findings[0].code, 'QUALITY_FORMAT_SEQUENCE');
  assert.equal(QUALITY_POLICIES[2].status, 'proposed', 'pragurile v2 rămân propuse');
});

test('H1 registru: probele de calitate eșuau înainte și trec acum (P-Q01…P-Q06); P-Q07 rămâne neetichetată', () => {
  for (const p of PROBES.filter(x => x.kind === 'quality')) {
    const j = judge(p, runProbe(p));
    if (!p.expect) { assert.equal(j, 'untracked'); continue; }
    assert.equal(BEFORE.results[p.id].judgement, 'fail', `${p.id} trebuia să eșueze înainte`); assert.equal(j, 'pass', p.id);
  }
});
