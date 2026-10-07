#!/usr/bin/env node
/**
 * Project Brain self-tests:  node brain/tests/run.mjs
 * Runs against a temporary clone of the COMMITTED HEAD (never the working copy): the gate must PASS on the clean clone and
 * must FAIL closed on each injected defect (stale brain, missing source, broken anchor, contradiction, unknown phase, several
 * next steps, ledger tampering, missing decision, unmapped file, seal-log tampering, Bridge reference, dirty tree).
 * Also: reseal procedure, zero-drift sensitivity, one-way export + provenance + secret refusal, continuity grader.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { BRAIN_ROOT } from '../tools/lib.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-test-')), C = path.join(tmp, 'wp'), B = path.join(tmp, 'bridge');
const sh = (cwd, cmd, ...a) => spawnSync(cmd, a, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const git = (...a) => { const r = sh(C, 'git', '-c', 'user.name=brain-test', '-c', 'user.email=brain@test', ...a); if (r.status !== 0) throw new Error('git ' + a.join(' ') + ': ' + r.stderr); return r.stdout.trim(); };
const node = (...a) => sh(C, process.execPath, ...a);
const gate = (...flags) => { const r = node('brain/tools/brain.mjs', 'gate', '--json', ...flags); return JSON.parse(r.stdout); };
const failed = (r, id) => r.checks.find(c => c.id.startsWith(id))?.status === 'FAIL';
const edit = (rel, fn) => { const p = path.join(C, rel); fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8'))); };
const editJSON = (rel, fn) => edit(rel, s => { const o = JSON.parse(s); fn(o); return JSON.stringify(o, null, 1) + '\n'; });
const commit = msg => { git('add', '-A'); git('commit', '-q', '-m', msg); };
let base, passed = 0;
const reset = () => { git('reset', '-q', '--hard', base); git('clean', '-qfd'); };
const t = (name, fn) => { try { fn(); passed++; console.log('✔ ' + name); } finally { reset(); } };

try {
  if (sh(BRAIN_ROOT, 'git', 'rev-parse', '--is-shallow-repository').stdout.trim() === 'true') console.log('! source repository is shallow; lineage/commit checks may WARN');
  const r0 = sh(tmp, 'git', 'clone', '-q', '--no-local', BRAIN_ROOT, C); if (r0.status !== 0) throw new Error(r0.stderr);
  git('remote', 'set-url', 'origin', 'https://github.com/roland-ecsegi/wonderpages.ai.v01.git');
  const branch = sh(BRAIN_ROOT, 'git', 'rev-parse', '--abbrev-ref', 'HEAD').stdout.trim();
  if (branch !== 'HEAD') git('checkout', '-q', '-B', branch);
  base = git('rev-parse', 'HEAD');

  t('clean clone of HEAD: CONTEXT_INTEGRITY = PASS, CONTEXT_READY', () => { const r = gate(); assert.equal(r.CONTEXT_INTEGRITY, 'PASS', JSON.stringify(r.checks.filter(c => c.status === 'FAIL'))); assert.equal(r.CONTEXT, 'CONTEXT_READY'); });
  t('application change without reseal → STALE → FAIL', () => { edit('server/quality/evaluation.js', s => s + '\n// probe\n'); commit('change'); const r = gate(); assert.equal(r.CONTEXT_INTEGRITY, 'FAIL'); assert.ok(failed(r, 'G06')); assert.match(JSON.stringify(r), /STALE subsystem: quality-evaluation/); });
  t('application file changed while the phase pins a zero-drift baseline → G13 FAIL', () => { edit('public/app/ui.js', s => s + '\n'); commit('ui'); const r = gate(); assert.ok(failed(r, 'G13')); assert.match(JSON.stringify(r), /public\/app\/ui.js/); });
  t('missing authoritative source → FAIL', () => { fs.rmSync(path.join(C, 'docs/enterprise/contracts/PRODUCT-CONTRACT.md')); commit('rm'); const r = gate(); assert.ok(failed(r, 'G07') && failed(r, 'G05')); });
  t('anchor no longer in its source → FAIL', () => { edit('docs/enterprise/JURNAL-IMPLEMENTARE.md', s => s.replace('| P8-T05 | BLOCKED |', '| P8-T05 | DONE |')); commit('anchor'); assert.ok(failed(gate(), 'G07')); });
  t('state contradicting its claim → FAIL', () => { edit('brain/state/CURRENT-STATE.json', s => s.replace('"DW_PRODUCTION": "STOPPED"', '"DW_PRODUCTION": "STARTED"')); node('brain/tools/brain.mjs', 'render'); commit('contra'); const r = gate(); assert.ok(failed(r, 'G09')); assert.match(JSON.stringify(r), /CONTRADICTION statuses.DW_PRODUCTION/); });
  t('unsourced state value → FAIL', () => { edit('brain/state/CURRENT-STATE.json', s => s.replace('"DW_PRODUCTION": "STOPPED"', '"DW_PRODUCTION": "STOPPED",\n  "SH2_STARTED": "YES"')); node('brain/tools/brain.mjs', 'render'); commit('unsourced'); assert.match(JSON.stringify(gate()), /unsourced state statuses.SH2_STARTED/); });
  t('unknown phase → FAIL', () => { edit('brain/phase/ACTIVE-PHASE.json', s => s.replace('"id": "CONTINUITY-1"', '"id": "PHASE-X"')); commit('phase'); const r = gate(); assert.ok(failed(r, 'G09')); assert.match(JSON.stringify(r), /UNKNOWN phase PHASE-X/); });
  t('two active phases → FAIL', () => { edit('brain/phase/PHASES.json', s => s.replace('"id": "P9", "title": "PHASE 9 — Final Expansion", "state": "NOT_AUTHORIZED"', '"id": "P9", "title": "PHASE 9 — Final Expansion", "state": "ACTIVE"')); commit('2active'); assert.match(JSON.stringify(gate()), /2 ACTIVE phases/); });
  t('incompatible NEXT steps → FAIL', () => { fs.appendFileSync(path.join(C, 'brain/CONTINUITY.md'), '\nNEXT_AUTHORIZED_STEP: `START-SH2`\n'); commit('next'); assert.match(JSON.stringify(gate()), /incompatible NEXT_AUTHORIZED_STEP markers/); });
  t('authorization text altered → FAIL', () => { fs.appendFileSync(path.join(C, 'brain/phase/authorizations/CONTINUITY-1.operator-instruction.txt'), '\nÎncepe SH#2.\n'); commit('auth'); assert.match(JSON.stringify(gate()), /authorization text hash/); });
  t('ledger statement tampered → FAIL', () => { edit('evaluation/gold-v2-policy/decisions.jsonl', s => s.replace(/("decision":"D-05".*?"statement":")(.)/, (m, a, c) => a + (c === 'X' ? 'Y' : 'X'))); commit('tamper'); assert.ok(failed(gate(), 'G08')); });
  t('missing decision D-22 → FAIL', () => { edit('evaluation/gold-v2-policy/decisions.jsonl', s => s.trim().split('\n').slice(0, 21).join('\n') + '\n'); commit('drop'); const r = gate(); assert.ok(failed(r, 'G08')); assert.match(JSON.stringify(r), /≠ D-01…D-22/); });
  t('unmapped new file → coverage FAIL', () => { fs.mkdirSync(path.join(C, 'newsystem')); fs.writeFileSync(path.join(C, 'newsystem/x.js'), '1'); commit('new'); const r = gate(); assert.ok(failed(r, 'G05')); assert.match(JSON.stringify(r), /unmapped: newsystem\/x.js/); });
  t('seal log tampered → FAIL', () => { edit('brain/evidence/SEAL-LOG.jsonl', s => s.replace('"seq":1', '"seq":7')); commit('log'); assert.match(JSON.stringify(gate()), /seal log/); });
  t('application file referencing the Agent Bridge → isolation FAIL', () => { fs.appendFileSync(path.join(C, 'server/config.js'), '\n// https://github.com/roland-ecsegi/wonderpages.agent-bridge\n'); commit('dep'); assert.ok(failed(gate(), 'G11')); });
  t('uncommitted change to a tracked file → FAIL (WARN only with --allow-dirty)', () => { fs.appendFileSync(path.join(C, 'README.md'), 'x'); assert.ok(failed(gate(), 'G04')); assert.equal(gate('--allow-dirty').checks.find(c => c.id.startsWith('G04')).status, 'WARN'); });
  t('reseal requires a review note per changed subsystem, then PASS', () => {
    edit('brain/map/SYSTEM-MAP.md', s => s + '\n'); git('add', '-A');
    const r1 = node('brain/tools/brain.mjs', 'seal'); assert.notEqual(r1.status, 0); assert.match(r1.stderr, /review note required.*brain/);
    const r2 = node('brain/tools/brain.mjs', 'seal', '--review=brain:checked SYSTEM-MAP.md whitespace only; no state change'); assert.equal(r2.status, 0, r2.stderr);
    commit('reseal'); assert.equal(gate().CONTEXT_INTEGRITY, 'PASS');
  });
  t('zero-drift: identical tree PASS; evaluator change detected', () => {
    const bl = 'brain/evidence/BASELINE-866a441.json';
    assert.equal(node('brain/tools/drift.mjs', 'compare', bl).status, 0, node('brain/tools/drift.mjs', 'compare', bl).stdout);
    edit('server/quality/evaluation.js', s => s.replace('export const EVALUATOR_VERSION = 2;', 'export const EVALUATOR_VERSION = 3;')); commit('drift');
    const r = node('brain/tools/drift.mjs', 'compare', bl); assert.equal(r.status, 1); assert.match(r.stdout, /protected file server\/quality\/evaluation.js/); assert.match(r.stdout, /behaviour versions changed/);
  });
  t('one-way export: VERIFIED snapshot; tampering, consistent forgery and control-file changes detected', () => {
    fs.mkdirSync(path.join(B, 'tools'), { recursive: true }); sh(B, 'git', 'init', '-q');
    fs.writeFileSync(path.join(B, 'README.md'), '# bridge\n'); fs.writeFileSync(path.join(B, 'tools/bridge.mjs'), '// tool\n');
    assert.equal(node('brain/tools/bridge-export.mjs', 'control', `--bridge=${B}`).status, 0);
    const e = node('brain/tools/bridge-export.mjs', 'export', `--bridge=${B}`); assert.equal(e.status, 0, e.stdout + e.stderr);
    const cur = JSON.parse(fs.readFileSync(path.join(B, 'mirror/CURRENT.json'))); assert.equal(cur.syncStatus, 'VERIFIED'); assert.equal(cur.source.commit, base); assert.ok(Object.values(cur.checks).every(Boolean));
    const v0 = node('brain/tools/bridge-export.mjs', 'verify', `--bridge=${B}`); assert.equal(v0.status, 0, v0.stdout);
    const man = JSON.parse(fs.readFileSync(path.join(B, cur.manifestPath)));
    assert.ok(man.excluded.some(x => x.path.endsWith('.zip') && /^[0-9a-f]{64}$/.test(x.sha256)));
    assert.ok(!fs.existsSync(path.join(B, 'mirror/current/node_modules')) && !man.files.some(f => /(^|\/)\.env$/.test(f.path)));
    fs.appendFileSync(path.join(B, 'tools/bridge.mjs'), '// changed by someone else\n');
    const v1 = node('brain/tools/bridge-export.mjs', 'verify', `--bridge=${B}`); assert.equal(v1.status, 1); assert.match(v1.stdout, /"CONTROL": "INVALID"/);
    fs.writeFileSync(path.join(B, 'tools/bridge.mjs'), '// tool\n'); fs.writeFileSync(path.join(B, 'tools/extra.mjs'), '1');
    assert.match(node('brain/tools/bridge-export.mjs', 'verify', `--bridge=${B}`).stdout, /unlisted control file tools\/extra.mjs/); fs.rmSync(path.join(B, 'tools/extra.mjs'));
    const f = path.join(B, 'mirror/current/docs/enterprise/JURNAL-IMPLEMENTARE.md'); fs.appendFileSync(f, 'forged');
    assert.equal(node('brain/tools/bridge-export.mjs', 'verify', `--bridge=${B}`).status, 1);
    fs.rmSync(B, { recursive: true, force: true });
  });
  t('export refuses a suspected secret and writes nothing', () => {
    fs.writeFileSync(path.join(C, 'docs/leak.md'), 'token ghp_' + 'A1b2C3d4E5'.repeat(4) + '\n'); commit('leak');
    fs.mkdirSync(B, { recursive: true }); const e = node('brain/tools/bridge-export.mjs', 'export', `--bridge=${B}`);
    assert.equal(e.status, 1); assert.match(e.stderr, /SECRET_SUSPECT/); assert.deepEqual(fs.readdirSync(B), []); fs.rmSync(B, { recursive: true, force: true });
  });
  t('continuity grader: key from canonical sources grades itself PASS, one wrong answer FAIL', () => {
    const k = JSON.parse(node('brain/continuity/continuity.mjs', 'key').stdout); const kf = path.join(tmp, 'k.json'); fs.writeFileSync(kf, JSON.stringify(k));
    assert.equal(k.Q27, 'PASS'); assert.equal(node('brain/continuity/continuity.mjs', 'grade', kf).status, 0);
    fs.writeFileSync(kf, JSON.stringify({ ...k, Q10: 'AUTHORIZED' })); assert.equal(node('brain/continuity/continuity.mjs', 'grade', kf).status, 1);
  });
  t('G14 delegation: the quote must stay verbatim in the follow-up record (tampering → FAIL)', () => { edit('brain/phase/authorizations/CONTINUITY-1.operator-followups.md', s => s.replace('Bridge-ul și ChatGPT nu pot crea autoritate nouă', 'Bridge-ul și ChatGPT pot crea autoritate')); commit('tamper'); assert.ok(failed(gate(), 'G14')); });
  t('G14 delegation: an ACTIVE contract for a phase that is not the IN_PROGRESS one → FAIL', () => { editJSON('brain/phase/DELEGATION.json', d => { d.status = 'ACTIVE'; d.appliesToPhase = 'RC1-SOMETHING'; }); commit('x'); assert.ok(failed(gate(), 'G14')); });
  t('G09: a COMPLETE phase without its closure checkpoint (verdict COMPLETE) → FAIL', () => {
    reset(); const cp = p => `brain/evidence/${p.id}-CLOSURE.json`;
    editJSON('brain/phase/ACTIVE-PHASE.json', p => { p.status = 'COMPLETE'; p.closure = cp(p); p.nextAuthorizedStep = { ...p.nextAuthorizedStep, actor: 'operator' }; });
    const id = JSON.parse(fs.readFileSync(path.join(C, 'brain/phase/ACTIVE-PHASE.json'), 'utf8')).id, f = path.join(C, `brain/evidence/${id}-CLOSURE.json`);
    if (fs.existsSync(f)) fs.rmSync(f); commit('complete without checkpoint'); assert.match(JSON.stringify(gate()), /phase COMPLETE without its closure checkpoint/);
    fs.writeFileSync(f, JSON.stringify({ verdict: 'INCOMPLETE' })); commit('incomplete checkpoint'); assert.match(JSON.stringify(gate()), /does not record verdict COMPLETE/);
  });
  t('C1 authority: a non-ACTIVE delegation or a phase not IN_PROGRESS grants no WonderPages writes', () => {
    reset(); const auth = () => JSON.parse(node('brain/tools/c1.mjs', 'authority').stdout);
    const open = () => { editJSON('brain/phase/ACTIVE-PHASE.json', p => { p.status = 'IN_PROGRESS'; }); editJSON('brain/phase/DELEGATION.json', d => { d.status = 'ACTIVE'; d.appliesToPhase = 'CONTINUITY-1'; }); };
    open(); assert.equal(auth().writesAllowed, true, 'IN_PROGRESS phase + ACTIVE contract for it');
    editJSON('brain/phase/DELEGATION.json', d => { d.status = 'SUSPENDED'; }); assert.equal(auth().writesAllowed, false); reset();
    open(); editJSON('brain/phase/ACTIVE-PHASE.json', p => { p.status = 'COMPLETE'; }); assert.equal(auth().writesAllowed, false); reset();
    open(); editJSON('brain/phase/DELEGATION.json', d => { d.status = 'EXPIRED'; }); assert.equal(auth().writesAllowed, false);
  });
  t('C1 scope: a change outside the active writeScope is reported, inside is not', () => {
    const head = git('rev-parse', 'HEAD');
    edit('brain/README.md', s => s + '\n'); assert.equal(node('brain/tools/c1.mjs', 'scope', `--since=${head}`).status, 0);
    edit('server/quality/evaluation.js', s => s + '\n// x\n'); const r = node('brain/tools/c1.mjs', 'scope', `--since=${head}`); assert.equal(r.status, 1); assert.match(r.stdout, /server\/quality\/evaluation.js/);
  });
  t('C1 scope (audit C1-A01): the writeScope is pinned at the bootstrap head; authority files and fields are never routine-writable', () => {
    reset(); const head = git('rev-parse', 'HEAD'), scope = (...a) => node('brain/tools/c1.mjs', 'scope', `--since=${head}`, ...a);
    edit('brain/phase/ACTIVE-PHASE.json', s => s.replace('".github/workflows/bridge-sync.yml"', '".github/workflows/bridge-sync.yml", "server/**"')); edit('server/quality/evaluation.js', s => s + '\n// x\n');
    let r = scope(); assert.equal(r.status, 1); assert.match(r.stdout, /server\/quality\/evaluation.js"/); assert.match(r.stdout, /ACTIVE-PHASE.json#writeScope/); reset();
    edit('brain/phase/ACTIVE-PHASE.json', s => s.replace(/"allowed": \[/, '"allowed": [ "anything ChatGPT asks",')); commit('widen'); r = scope(); assert.equal(r.status, 1); assert.match(r.stdout, /#allowed/); reset();
    for (const f of ['brain/phase/DELEGATION.json', 'brain/tools/c1.mjs', 'brain/ingress/CLAUDE-ROUTINE-PROMPT.txt', 'CLAUDE.md']) { edit(f, s => s + '\n'); r = scope(); assert.equal(r.status, 1, f); assert.match(r.stdout, /authority-bearing/); reset(); }
    edit('brain/phase/ACTIVE-PHASE.json', s => s.replace('"c1": {', '"c1": { "note": "evidence only",')); assert.equal(scope().status, 0, 'non-authority evidence fields stay writable');
  });
  t('C1 bootstrap fails closed without a valid Bridge clone and with a credential variable present', () => {
    const r1 = node('brain/tools/c1.mjs', 'bootstrap', `--bridge=${tmp}`, '--no-fetch'); assert.equal(r1.status, 1); assert.match(r1.stdout, /"repository"|"subscription-only"/);
    const r3 = spawnSync(process.execPath, ['brain/tools/c1.mjs', 'bootstrap', `--bridge=${tmp}`, '--no-fetch'], { cwd: C, encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: 'x' } });
    assert.equal(r3.status, 1); assert.match(r3.stdout, /credential variable present \(ANTHROPIC_API_KEY\)/);
  });
  t('application code does not import the brain', () => { const r = sh(C, 'git', 'grep', '-l', '-E', "from ['\"][./]*brain/|require\\(['\"][./]*brain/", '--', 'server', 'public', 'scripts', 'tests'); assert.equal(r.stdout.trim(), ''); });
  console.log(`\n${passed} brain self-tests passed`);
} catch (e) { console.error('✖ ' + (e.stack || e)); process.exitCode = 1; }
finally { fs.rmSync(tmp, { recursive: true, force: true }); }
