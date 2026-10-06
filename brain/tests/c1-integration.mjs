#!/usr/bin/env node
/**
 * Decision C1 adversarial integration tests (manual; never run by WonderPages CI, which must not read the Bridge):
 *   node brain/tests/c1-integration.mjs --bridge=<Agent Bridge checkout>
 * Temporary clones of the committed WonderPages HEAD and of the Bridge; real doorbell commits on inbox/claude; the C1 bootstrap
 * and recheck of the CLONED WonderPages tool are exercised against valid, stale, tampered and unauthorized states.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { BRAIN_ROOT } from '../tools/lib.mjs';

const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const BR = arg('bridge'); if (!BR) { console.error('--bridge=<Agent Bridge checkout> required'); process.exit(2); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'c1-int-')), C = path.join(tmp, 'wp'), B = path.join(tmp, 'bridge');
const run = (cwd, cmd, ...a) => { const r = spawnSync(cmd, a, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }); if (r.status !== 0) throw new Error(`${cmd} ${a.join(' ')}: ${r.stderr}`); return r.stdout.trim(); };
const gw = (...a) => run(C, 'git', '-c', 'user.name=t', '-c', 'user.email=t@t', ...a), gb = (...a) => run(B, 'git', '-c', 'user.name=t', '-c', 'user.email=t@t', ...a);
let passed = 0; const t = async (name, fn) => { await fn(); passed++; console.log('✔ ' + name); };

try {
  run(tmp, 'git', 'clone', '-q', '--no-local', BRAIN_ROOT, C);
  const branch = run(BRAIN_ROOT, 'git', 'rev-parse', '--abbrev-ref', 'HEAD'); gw('checkout', '-q', '-B', branch); gw('update-ref', `refs/remotes/origin/${branch}`, 'HEAD');
  run(tmp, 'git', 'clone', '-q', '--no-local', BR, B); gb('remote', 'set-url', 'origin', 'https://github.com/roland-ecsegi/wonderpages.agent-bridge.git');
  gb('checkout', '-q', '-B', 'main', run(BR, 'git', 'rev-parse', 'HEAD')); gb('update-ref', 'refs/remotes/origin/main', 'HEAD');
  const bm = await import(pathToFileURL(path.join(B, 'tools/bridge.mjs')).href), c1 = await import(pathToFileURL(path.join(C, 'brain/tools/c1.mjs')).href);
  // every scenario starts from an empty Claude queue: live pending work at the Bridge head is acknowledged in the TEMPORARY clone only
  const live = bm.pendingFor(bm.validateMessages(B).messages, 'claude');
  for (const p of live) bm.newMessage({ root: B, from: 'claude', to: 'chatgpt', type: 'ACKNOWLEDGED', body: 'test base only', replyTo: p.messageId, now: new Date('2026-10-07T08:00:00Z') });
  if (live.length) { gb('add', '-A'); gb('commit', '-q', '-m', 'test base: acknowledge the live Claude queue'); gb('update-ref', 'refs/remotes/origin/main', 'HEAD'); }
  const base = gb('rev-parse', 'HEAD'), wpBase = gw('rev-parse', 'HEAD');
  const reset = () => { gb('checkout', '-q', '-f', 'main'); gb('reset', '-q', '--hard', base); gb('clean', '-qfd'); gb('update-ref', 'refs/remotes/origin/main', base); spawnSync('git', ['branch', '-D', 'inbox/claude'], { cwd: B }); spawnSync('git', ['update-ref', '-d', 'refs/remotes/origin/inbox/claude'], { cwd: B }); gw('reset', '-q', '--hard', wpBase); gw('update-ref', `refs/remotes/origin/${branch}`, wpBase); };
  let clock = Date.parse('2026-10-07T09:00:00Z'); const tick = () => new Date(clock += 60e3);
  const msg = o => bm.newMessage({ root: B, phase: 'CONTINUITY-1', now: tick(), ...o });
  const pushMain = m => { gb('add', '-A'); gb('commit', '-q', '-m', m); gb('update-ref', 'refs/remotes/origin/main', 'HEAD'); return gb('rev-parse', 'HEAD'); };
  const ring = ({ mutate } = {}) => {
    const R = gb('rev-parse', 'HEAD'), v = bm.validateMessages(B), plan = bm.ingressPlan(null, v.messages, { recipient: 'claude', mainCommit: R, now: tick().toISOString() });
    const doorbell = plan.ring ? plan.doorbell : { schema: 'wonderpages.bridge.ingress-doorbell/2', recipient: 'claude', seq: 1, mainCommit: R, ring: [] };
    gb('checkout', '-q', '-B', 'inbox/claude', R); fs.mkdirSync(path.join(B, 'ingress/claude'), { recursive: true });
    fs.writeFileSync(path.join(B, 'ingress/claude/DOORBELL.json'), JSON.stringify(doorbell, null, 1)); if (mutate) mutate();
    gb('add', '-A'); gb('commit', '-q', '-m', 'ingress: ring Claude', '-m', 'Bridge-Ingress: claude', '-m', `Main-Commit: ${R}`);
    const H = gb('rev-parse', 'HEAD'); gb('update-ref', 'refs/remotes/origin/inbox/claude', H); gb('checkout', '-q', 'main'); return { R, H };
  };
  const boot = (o = {}) => c1.bootstrap({ bridge: B, wpRoot: C, fetch: false, env: {}, ...o });
  const failedAt = (o, id) => o.verdict === 'FAIL' && o.checks.some(c => !c.ok && c.id === id);
  const audit = () => { const q = msg({ from: 'claude', to: 'chatgpt', type: 'AUDIT_REQUEST', title: 'C1 test audit', body: 'please audit', expected: { type: 'AUDIT_RESULT', format: 'x' } }); const a = msg({ from: 'chatgpt', to: 'claude', type: 'AUDIT_RESULT', body: 'CHANGES_REQUIRED: x', replyTo: q.id }); return { q, a }; };

  await t('valid pending AUDIT_RESULT → one wake → PROCEED with exactly that work (doorbell hint matches)', async () => { reset(); const { a } = audit(); pushMain('m'); const { R, H } = ring(); const o = boot({ head: H }); assert.equal(o.verdict, 'PROCEED', JSON.stringify(o.checks)); assert.equal(o.R, R); assert.deepEqual(o.pending.map(p => p.messageId), [a.id]); assert.deepEqual(o.hintDifference, { ringedButNotPending: [], pendingButNotRinged: [] }); assert.equal(o.authority.writesAllowed, true); assert.ok(o.quarantined.includes('MSG-20261006T145200Z-chatgpt-bpass')); });
  await t('multiple pending → one batched work order', async () => { reset(); const x = audit(), y = msg({ from: 'chatgpt', to: 'claude', type: 'QUESTION', title: 'q', body: 'q?', expected: { type: 'ANSWER', format: 'x' } }); pushMain('m'); const { H } = ring(); const o = boot({ head: H }); assert.deepEqual(o.pending.map(p => p.messageId).sort(), [x.a.id, y.id].sort()); });
  await t('no pending (only Claude → ChatGPT) → NOTHING_PENDING', async () => { reset(); msg({ from: 'claude', to: 'chatgpt', type: 'QUESTION', title: 'q', body: 'q?', expected: { type: 'ANSWER', format: 'x' } }); pushMain('m'); const { H } = ring(); assert.equal(boot({ head: H }).verdict, 'NOTHING_PENDING'); });
  for (const kind of ['CLOSED', 'SUPERSEDED', 'ACKNOWLEDGED'])
    await t(`${kind} by Claude at R → nothing pending (no work)`, async () => { reset(); const { a } = audit(); msg({ from: 'claude', to: 'chatgpt', type: kind, body: kind, replyTo: a.id }); pushMain('m'); const { H } = ring(); assert.equal(boot({ head: H }).verdict, 'NOTHING_PENDING'); });
  await t('stale doorbell: mainCommit ≠ parent → FAIL doorbell', async () => { reset(); audit(); pushMain('m'); const { H } = ring({ mutate: () => { const p = path.join(B, 'ingress/claude/DOORBELL.json'), d = JSON.parse(fs.readFileSync(p)); d.mainCommit = base; fs.writeFileSync(p, JSON.stringify(d)); } }); assert.ok(failedAt(boot({ head: H }), 'doorbell')); });
  await t('extra file in the ingress commit → FAIL doorbell', async () => { reset(); audit(); pushMain('m'); const { H } = ring({ mutate: () => fs.writeFileSync(path.join(B, 'README.md'), 'x') }); assert.ok(failedAt(boot({ head: H }), 'doorbell')); });
  await t('missing trailer → FAIL doorbell', async () => { reset(); audit(); pushMain('m'); const R = gb('rev-parse', 'HEAD'); gb('checkout', '-q', '-B', 'inbox/claude', R); fs.mkdirSync(path.join(B, 'ingress/claude'), { recursive: true }); fs.writeFileSync(path.join(B, 'ingress/claude/DOORBELL.json'), JSON.stringify({ schema: 'wonderpages.bridge.ingress-doorbell/2', recipient: 'claude', mainCommit: R })); gb('add', '-A'); gb('commit', '-q', '-m', 'no trailer'); const H = gb('rev-parse', 'HEAD'); gb('checkout', '-q', 'main'); assert.ok(failedAt(boot({ head: H }), 'doorbell')); });
  await t('stale R: anchor not on Bridge main → FAIL anchor', async () => { reset(); audit(); pushMain('m'); const { H } = ring(); gb('reset', '-q', '--hard', base); gb('update-ref', 'refs/remotes/origin/main', base); assert.ok(failedAt(boot({ head: H }), 'anchor')); });
  await t('PR number not bound to H → FAIL pull-request', async () => { reset(); audit(); pushMain('m'); const { H } = ring(); gb('update-ref', 'refs/remotes/origin/pr/77', base); assert.ok(failedAt(boot({ head: H, pr: 77 }), 'pull-request')); gb('update-ref', 'refs/remotes/origin/pr/78', H); assert.equal(boot({ head: H, pr: 78 }).verdict, 'PROCEED'); });
  await t('stale / invalid mirror at R → FAIL mirror', async () => { reset(); audit(); const p = path.join(B, 'mirror/CURRENT.json'), d = JSON.parse(fs.readFileSync(p)); d.syncStatus = 'STALE'; fs.writeFileSync(p, JSON.stringify(d)); pushMain('m'); const { H } = ring(); assert.ok(failedAt(boot({ head: H }), 'mirror')); });
  await t('tampered mirror file at R → FAIL mirror (provenance from WonderPages)', async () => { reset(); audit(); fs.appendFileSync(path.join(B, 'mirror/current/brain/README.md'), 'x'); pushMain('m'); const { H } = ring(); assert.ok(failedAt(boot({ head: H }), 'mirror')); });
  await t('changed control file at R → FAIL control', async () => { reset(); audit(); fs.appendFileSync(path.join(B, 'tools/bridge.mjs'), '\n// tampered\n'); pushMain('m'); const { H } = ring(); assert.ok(failedAt(boot({ head: H }), 'control')); });
  await t('invalid, unquarantined message at R → FAIL messages (fail-closed)', async () => { reset(); const { a } = audit(); const bad = JSON.parse(fs.readFileSync(path.join(B, 'exchange/messages', a.id + '.json'))); bad.id = bad.id.replace(/....$/, 'zzzz'); fs.writeFileSync(path.join(B, 'exchange/messages', bad.id + '.json'), JSON.stringify(bad)); pushMain('m'); const { H } = ring(); assert.ok(failedAt(boot({ head: H }), 'messages')); });
  await t('API / OAuth credential variable present → FAIL subscription-only', async () => { reset(); audit(); pushMain('m'); const { H } = ring(); assert.ok(failedAt(boot({ head: H, env: { CLAUDE_CODE_OAUTH_TOKEN: 'x' } }), 'subscription-only')); });
  await t('WonderPages not at its origin head → FAIL canon', async () => { reset(); audit(); pushMain('m'); const { H } = ring(); gw('update-ref', `refs/remotes/origin/${branch}`, gw('rev-parse', 'HEAD~1')); assert.ok(failedAt(boot({ head: H }), 'canon')); });
  await t('phase not IN_PROGRESS (resealed canon) → PROCEED but writesAllowed=false (communicate / escalate only)', async () => {
    reset(); audit(); pushMain('m'); const { H } = ring();
    const p = path.join(C, 'brain/phase/ACTIVE-PHASE.json'), d = JSON.parse(fs.readFileSync(p)); d.status = 'COMPLETE_AWAITING_OPERATOR_REVIEW'; fs.writeFileSync(p, JSON.stringify(d, null, 1) + '\n');
    const dp = path.join(C, 'brain/phase/DELEGATION.json'), dl = JSON.parse(fs.readFileSync(dp)); dl.status = 'EXPIRED'; fs.writeFileSync(dp, JSON.stringify(dl, null, 1) + '\n');
    gw('add', '-A'); gw('commit', '-q', '-m', 'phase complete'); run(C, process.execPath, 'brain/tools/brain.mjs', 'render'); gw('add', '-A'); gw('commit', '-q', '--amend', '--no-edit');
    run(C, process.execPath, 'brain/tools/brain.mjs', 'seal', '--review=brain:test'); gw('add', '-A'); gw('commit', '-q', '--amend', '--no-edit'); gw('update-ref', `refs/remotes/origin/${branch}`, 'HEAD');
    const o = boot({ head: H }); assert.equal(o.verdict, 'PROCEED', JSON.stringify(o.checks.filter(c => !c.ok))); assert.equal(o.authority.writesAllowed, false);
  });
  await t('recheck: still pending and authorized → write; request resolved between wake and execution → no write', async () => {
    reset(); const { a } = audit(); pushMain('m'); const { H } = ring(); const o = boot({ head: H });
    assert.equal(c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false }).write, true);
    msg({ from: 'claude', to: 'chatgpt', type: 'CLOSED', body: 'done elsewhere', replyTo: a.id }); pushMain('closed');
    const r = c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false }); assert.equal(r.write, false); assert.match(r.reasons.join(), /STILL PENDING failed: CLOSED/);
  });
  await t('recheck: SUPERSEDED by ChatGPT after the wake → no write', async () => { reset(); const { a } = audit(); pushMain('m'); const { H } = ring(); const o = boot({ head: H }); msg({ from: 'chatgpt', to: 'claude', type: 'SUPERSEDED', body: 'replaced', replyTo: a.id }); pushMain('s'); assert.equal(c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false }).write, false); });
  await t('recheck: delegation narrowed after the wake → no write (STILL AUTHORIZED fails)', async () => {
    reset(); const { a } = audit(); pushMain('m'); const { H } = ring(); const o = boot({ head: H });
    const dp = path.join(C, 'brain/phase/DELEGATION.json'); fs.writeFileSync(dp, fs.readFileSync(dp, 'utf8').replace('"status": "ACTIVE"', '"status": "SUSPENDED"')); gw('add', '-A'); gw('commit', '-q', '-m', 'narrow');
    const r = c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false }); assert.equal(r.write, false); assert.match(r.reasons.join(), /delegationStatus ACTIVE → SUSPENDED|delegationSha256/);
  });
  await t('recheck: phase changed after the wake → no write', async () => {
    reset(); const { a } = audit(); pushMain('m'); const { H } = ring(); const o = boot({ head: H });
    const p = path.join(C, 'brain/phase/ACTIVE-PHASE.json'); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace('"status": "IN_PROGRESS"', '"status": "COMPLETE"')); gw('add', '-A'); gw('commit', '-q', '-m', 'phase');
    const r = c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false }); assert.equal(r.write, false); assert.match(r.reasons.join(), /phaseStatus IN_PROGRESS → COMPLETE/);
  });
  await t('recheck (audit C1-A02): valid with an uncommitted in-scope edit (right before the commit) and after the sealed commit', async () => {
    reset(); const { a } = audit(); pushMain('m'); const { H } = ring(); const o = boot({ head: H });
    fs.mkdirSync(path.join(C, 'brain/ingress/runs'), { recursive: true }); fs.writeFileSync(path.join(C, 'brain/ingress/runs/test.json'), '{}\n');
    const r1 = c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false }); assert.equal(r1.write, true, r1.reasons.join('; '));
    gw('add', '-A'); gw('commit', '-q', '-m', 'run record'); run(C, process.execPath, 'brain/tools/brain.mjs', 'seal', '--review=brain:test'); gw('add', '-A'); gw('commit', '-q', '--amend', '--no-edit');
    const r2 = c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false }); assert.equal(r2.write, true, r2.reasons.join('; '));
  });
  await t('recheck (audit C1-A01): a routine that widens writeScope / allowed, or edits an authority file, can no longer write', async () => {
    reset(); const { a } = audit(); pushMain('m'); const { H } = ring(); const o = boot({ head: H });
    const p = path.join(C, 'brain/phase/ACTIVE-PHASE.json'); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace('".github/workflows/bridge-sync.yml"', '".github/workflows/bridge-sync.yml", "server/**"'));
    let r = c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false }); assert.equal(r.write, false); assert.match(r.reasons.join(), /phaseAuthoritySha256/); assert.match(r.reasons.join(), /#writeScope/);
    gw('checkout', '-q', '--', '.'); fs.appendFileSync(path.join(C, 'brain/tools/c1.mjs'), '\n'); gw('add', '-A'); gw('commit', '-q', '-m', 'weaken');
    r = c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false }); assert.equal(r.write, false); assert.match(r.reasons.join(), /brain\/tools\/c1.mjs \(authority-bearing/);
  });
  await t('recheck after this run\'s own reply → RUN_RECORD_ONLY write (step 8); another session\'s or an unknown session\'s reply → no write', async () => {
    reset(); const { a } = audit(); pushMain('m'); const { H } = ring(); const o = boot({ head: H });
    msg({ from: 'claude', to: 'chatgpt', type: 'CLOSED', body: 'closed by the run', replyTo: a.id, notes: 'C1 routine https://claude.ai/code/session_01OWN' }); pushMain('own close');
    const own = c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false, session: 'session_01OWN' });
    assert.equal(own.write, true, own.reasons.join('; ')); assert.equal(own.writeKind, 'RUN_RECORD_ONLY'); assert.equal(own.stillPending, false);
    assert.equal(c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false, session: 'session_01OTHER' }).write, false, 'a duplicate session cannot write');
    assert.equal(c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false, session: null }).write, false, 'no session id → fail closed');
    const p = path.join(C, 'brain/phase/DELEGATION.json'); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace('"status": "ACTIVE"', '"status": "SUSPENDED"')); gw('add', '-A'); gw('commit', '-q', '-m', 'narrow');
    assert.equal(c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false, session: 'session_01OWN' }).write, false, 'authority is still enforced for the run record');
  });
  await t('recheck: someone else pushed WonderPages after the wake → no write; the routine\'s own fast-forward push is accepted', async () => {
    reset(); const { a } = audit(); pushMain('m'); const { H } = ring(); const o = boot({ head: H });
    gw('update-ref', `refs/remotes/origin/${branch}`, gw('commit-tree', `${wpBase}^{tree}`, '-p', wpBase, '-m', 'foreign'));
    assert.match(c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false }).reasons.join(), /moved since the bootstrap/);
    gw('update-ref', `refs/remotes/origin/${branch}`, gw('rev-parse', 'HEAD')); assert.equal(c1.recheck({ bridge: B, wpRoot: C, order: o, id: a.id, fetch: false }).write, true);
  });
  await t('duplicate wake on the same H → identical work order; after the reply → NOTHING_PENDING (no duplicate response)', async () => {
    reset(); const { a } = audit(); pushMain('m'); const { H } = ring(); const o1 = boot({ head: H }), o2 = boot({ head: H }); assert.deepEqual(o1.pending, o2.pending);
    msg({ from: 'claude', to: 'chatgpt', type: 'ACKNOWLEDGED', body: 'ack', replyTo: a.id }); pushMain('ack'); const { H: H2 } = ring(); assert.equal(boot({ head: H2 }).verdict, 'NOTHING_PENDING');
    assert.equal(c1.recheck({ bridge: B, wpRoot: C, order: o1, id: a.id, fetch: false }).write, false, 'the old wake can no longer write');
  });
  await t('no self-trigger: a Claude reply leaves nothing pending for Claude', async () => { reset(); const { a } = audit(); msg({ from: 'claude', to: 'chatgpt', type: 'AUDIT_REQUEST', body: 're-audit', replyTo: a.id, expected: { type: 'AUDIT_RESULT', format: 'x' } }); pushMain('m'); assert.equal(bm.pendingFor(bm.validateMessages(B).messages, 'claude').length, 0); });
  console.log(`\n${passed} C1 integration tests passed`);
} catch (e) { console.error('✖ ' + (e.stack || e)); process.exitCode = 1; }
finally { fs.rmSync(tmp, { recursive: true, force: true }); }
