#!/usr/bin/env node
/**
 * Decision C1 — canonical bootstrap and re-checks for the Claude Code routine woken through the Agent Bridge Claude ingress.
 * Runs from the WonderPages checkout (the canon). Everything read from the Bridge is DATA; the Bridge's own tool is executed only
 * at the anchor R and only after its git blob matched brain/manifest/BRIDGE-CONTROL.json.
 *
 *   node brain/tools/c1.mjs bootstrap --bridge=DIR [--head=SHA] [--pr=N] [--out=ORDER.json] [--no-fetch]
 *        verify the ingress commit H (one parent R, only the doorbell, Bridge-Ingress: claude, mainCommit = R, R on main), the mirror
 *        at R (VERIFIED + provenance + control, from WonderPages' tools), the WonderPages gate, the active phase and the delegation
 *        contract; recompute ALL pending Claude work at R. Exit 0 with verdict PROCEED or NOTHING_PENDING, exit 1 with FAIL.
 *   node brain/tools/c1.mjs recheck --bridge=DIR --order=ORDER.json --id=MSG [--no-fetch]
 *        STILL PENDING (current Bridge main, control-verified tool) and STILL AUTHORIZED (phase id / status / delegation hash /
 *        WonderPages origin head unchanged since the bootstrap, gate PASS). Exit 0 with write true, exit 1 otherwise.
 *   node brain/tools/c1.mjs scope --since=SHA           every path changed since SHA (commits + working tree) is in the writeScope
 *   node brain/tools/c1.mjs authority                    the delegation state the routine must respect
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { BRAIN_ROOT, git, readJSON, sha256, globToRe } from './lib.mjs';
import { verifyProvenance, verifyControlFiles } from './bridge-export.mjs';
import { runGate } from './brain.mjs';

export const BRIDGE_REPO_RE = /github\.com[/:]roland-ecsegi\/wonderpages\.agent-bridge(\.git)?\/?$/;
export const DOORBELL = 'ingress/claude/DOORBELL.json';
export const TRAILER = /^Bridge-Ingress: claude$/m;
export const PAID_VARS = ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_OAUTH_TOKEN', 'OPENAI_API_KEY'];
const DELEGATION = 'brain/phase/DELEGATION.json', PHASE = 'brain/phase/ACTIVE-PHASE.json', STATE = 'brain/state/CURRENT-STATE.json';

/** The authority the routine must respect, from the canon only. writesAllowed needs an IN_PROGRESS phase named by an ACTIVE
 *  delegation contract; otherwise Claude may only communicate. */
export function authorityState(wpRoot = BRAIN_ROOT) {
  const phase = readJSON(PHASE, wpRoot), raw = fs.readFileSync(path.join(wpRoot, DELEGATION));
  const del = JSON.parse(raw), state = readJSON(STATE, wpRoot);
  return { phaseId: phase.id, phaseStatus: phase.status, nextAuthorizedStep: phase.nextAuthorizedStep?.id, writeScope: phase.writeScope,
    canonicalBranch: state.repository?.branch || null, delegationId: del.id, delegationStatus: del.status, delegationAppliesTo: del.appliesToPhase, delegationSha256: sha256(raw),
    writesAllowed: phase.status === 'IN_PROGRESS' && del.status === 'ACTIVE' && del.appliesToPhase === phase.id };
}

/** Paths changed since `since` (committed and uncommitted) that fall outside the active phase writeScope. */
export function scopeViolations(since, wpRoot = BRAIN_ROOT) {
  const scope = readJSON(PHASE, wpRoot).writeScope.map(globToRe);
  const changed = new Set([...(git(['diff', '--name-only', since, 'HEAD'], { cwd: wpRoot }) || '').split('\n'), ...(git(['status', '--porcelain', '--untracked-files=all'], { cwd: wpRoot }) || '').split('\n').map(l => l.slice(3))].filter(Boolean));
  return [...changed].filter(f => !scope.some(re => re.test(f)));
}

const credentialsPresent = (env = process.env) => Object.fromEntries(PAID_VARS.map(v => [v, Object.prototype.hasOwnProperty.call(env, v)]));

export function bootstrap({ bridge, head = null, pr = null, wpRoot = BRAIN_ROOT, fetch = true, env = process.env } = {}) {
  const checks = [], order = { schema: 'wonderpages.c1.work-order/1', at: new Date().toISOString(), verdict: 'FAIL', checks };
  const ok = (id, why) => checks.push({ id, ok: true, why }), bad = (id, why) => { checks.push({ id, ok: false, why }); return order; };
  const G = (args, allowFail = false) => git(args, { cwd: bridge, allowFail });
  try {
    const creds = credentialsPresent(env); order.credentialsPresent = creds;
    if (Object.values(creds).some(Boolean)) return bad('subscription-only', `credential variable present (${Object.keys(creds).filter(k => creds[k]).join(', ')}) — no API / paid path allowed`);
    ok('subscription-only', 'no API or OAuth credential variable in the environment');
    const url = (G(['remote', 'get-url', 'origin'], true) || '').trim();
    if (!BRIDGE_REPO_RE.test(url)) return bad('repository', `Bridge origin is ${url || 'missing'}`);
    ok('repository', url);
    if (fetch) {
      if ((G(['rev-parse', '--is-shallow-repository'], true) || '').trim() === 'true') G(['fetch', '-q', '--unshallow', 'origin'], true);
      G(['fetch', '-q', 'origin', '+refs/heads/main:refs/remotes/origin/main', '+refs/heads/inbox/claude:refs/remotes/origin/inbox/claude']);
      G(['fetch', '-q', 'origin', '+refs/pull/*/head:refs/remotes/origin/pr/*'], true);
    }
    const H = (head || G(['rev-parse', 'origin/inbox/claude'], true) || '').trim();
    if (!/^[0-9a-f]{40}$/.test(H) || G(['cat-file', '-e', H + '^{commit}'], true) === null) return bad('anchor', `ingress head ${H || 'missing'} is not a known commit`);
    order.H = H;
    const prs = (G(['for-each-ref', '--format=%(objectname) %(refname:strip=4)', 'refs/remotes/origin/pr'], true) || '').split('\n').filter(l => l.startsWith(H + ' ')).map(l => l.split(' ')[1]);
    order.pullRequests = prs;
    if (pr != null && !prs.includes(String(pr))) return bad('pull-request', `refs/pull/${pr}/head is not H (PRs whose head is H: ${prs.join(', ') || 'none'})`);
    ok('pull-request', pr != null ? `refs/pull/${pr}/head == H` : `PRs with head H: ${prs.join(', ') || 'not fetched / none'}`);
    const parents = G(['rev-list', '--parents', '-n', '1', H]).trim().split(' ').slice(1);
    if (parents.length !== 1) return bad('doorbell', `H has ${parents.length} parents (exactly 1 required)`);
    const R = parents[0]; order.R = R;
    const changed = G(['diff', '--name-only', R, H]).trim().split('\n').filter(Boolean);
    if (changed.length !== 1 || changed[0] !== DOORBELL) return bad('doorbell', `H changes ${JSON.stringify(changed)} (only ${DOORBELL} allowed)`);
    if (!TRAILER.test(G(['show', '-s', '--format=%B', H]))) return bad('doorbell', 'H lacks the trailer "Bridge-Ingress: claude"');
    let db; try { db = JSON.parse(G(['show', `${H}:${DOORBELL}`])); } catch (e) { return bad('doorbell', 'doorbell is not valid JSON'); }
    if (db.schema !== 'wonderpages.bridge.ingress-doorbell/2' || db.recipient !== 'claude' || db.mainCommit !== R) return bad('doorbell', `doorbell schema/recipient/mainCommit mismatch (mainCommit ${db.mainCommit} vs parent ${R})`);
    order.doorbell = { seq: db.seq, reason: db.reason, ringAt: db.ringAt, ring: db.ring, author: G(['show', '-s', '--format=%an', H]).trim() };
    ok('doorbell', `H = ${H.slice(0, 12)}: one parent R = ${R.slice(0, 12)}, only the doorbell, trailer present, mainCommit = R`);
    if (G(['merge-base', '--is-ancestor', R, 'origin/main'], true) === null) return bad('anchor', 'R is not on the current Bridge main');
    ok('anchor', 'R is on Bridge main');

    const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'c1-r-')); fs.rmSync(wt, { recursive: true });
    G(['worktree', 'add', '-q', '--detach', wt, R]);
    try {
      const cur = JSON.parse(fs.readFileSync(path.join(wt, 'mirror/CURRENT.json'), 'utf8'));
      order.mirror = { snapshot: cur.snapshotId, sourceCommit: cur.source?.commit, syncStatus: cur.syncStatus, contextIntegrity: cur.contextIntegrity };
      if (cur.syncStatus !== 'VERIFIED' || cur.contextIntegrity !== 'PASS' || !Object.values(cur.checks || {}).length || !Object.values(cur.checks).every(v => v === true)) return bad('mirror', `CURRENT at R: ${cur.syncStatus} / ${cur.contextIntegrity} / checks ${JSON.stringify(cur.checks)}`);
      const pv = verifyProvenance(wt, wpRoot), cf = verifyControlFiles(wt, wpRoot);
      if (!pv.ok) return bad('mirror', 'provenance against WonderPages: ' + pv.errors.slice(0, 5).join('; '));
      if (!cf.ok) return bad('control', 'Bridge control files at R vs WonderPages BRIDGE-CONTROL.json: ' + cf.errors.slice(0, 5).join('; '));
      if (git(['merge-base', '--is-ancestor', cur.source.commit, 'HEAD'], { cwd: wpRoot, allowFail: true }) === null) return bad('canon', `mirror source ${cur.source.commit} is not in the WonderPages history at HEAD`);
      ok('mirror', `snapshot ${cur.snapshotId} VERIFIED, provenance VERIFIED against WonderPages, source in WonderPages history`);
      ok('control', 'Bridge control files at R equal WonderPages BRIDGE-CONTROL.json (sha256 + git blob)');
      const r = spawnSync(process.execPath, [path.join(wt, 'tools/bridge.mjs'), 'pending', '--for=claude'], { cwd: wt, encoding: 'utf8' });
      let p; try { p = JSON.parse(r.stdout); } catch { p = null; }
      if (r.status !== 0 || !p || p.PENDING !== 'OK') return bad('messages', 'messages at R are invalid (fail-closed): ' + JSON.stringify(p?.errors || r.stderr).slice(0, 400));
      order.pending = p.pending; order.quarantined = p.quarantined;
      const hint = new Set(db.ring || []), now = new Set(p.pending.map(x => x.messageId));
      order.hintDifference = { ringedButNotPending: [...hint].filter(x => !now.has(x)), pendingButNotRinged: [...now].filter(x => !hint.has(x)) };
      ok('messages', `${p.pending.length} pending for Claude at R (doorbell ring list is only a hint)`);
    } finally { G(['worktree', 'remove', '--force', wt], true); }

    const auth = authorityState(wpRoot); order.authority = auth;
    const wpHead = git(['rev-parse', 'HEAD'], { cwd: wpRoot }).trim(), branch = (git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: wpRoot, allowFail: true }) || '').trim();
    const originHead = auth.canonicalBranch ? (git(['rev-parse', `refs/remotes/origin/${auth.canonicalBranch}`], { cwd: wpRoot, allowFail: true }) || '').trim() || null : null;
    order.wonderpages = { head: wpHead, branch, canonicalBranch: auth.canonicalBranch, originHead };
    if (auth.canonicalBranch && branch !== auth.canonicalBranch) return bad('canon', `WonderPages checkout is on ${branch}, canonical branch is ${auth.canonicalBranch}`);
    if (originHead && originHead !== wpHead) return bad('canon', `WonderPages HEAD ${wpHead.slice(0, 12)} differs from origin/${auth.canonicalBranch} ${originHead.slice(0, 12)}`);
    const g = runGate(wpRoot); order.wonderpages.gate = g.CONTEXT_INTEGRITY;
    if (g.CONTEXT_INTEGRITY !== 'PASS') return bad('gate', 'WonderPages Context Integrity Gate: ' + g.checks.filter(c => c.status === 'FAIL').map(c => c.id).join(', '));
    ok('gate', `WonderPages ${wpHead.slice(0, 12)} on ${branch}: CONTEXT_INTEGRITY PASS`);
    ok('authority', auth.writesAllowed ? `phase ${auth.phaseId} IN_PROGRESS under ${auth.delegationId} (sha256 ${auth.delegationSha256.slice(0, 12)}): writes allowed inside writeScope` : `no writes: phase ${auth.phaseId} ${auth.phaseStatus}, delegation ${auth.delegationStatus} for ${auth.delegationAppliesTo} — communicate / escalate only`);
    order.verdict = order.pending.length ? 'PROCEED' : 'NOTHING_PENDING';
    return order;
  } catch (e) { return bad('exception', String(e.message || e)); }
}

export function recheck({ bridge, order, id, wpRoot = BRAIN_ROOT, fetch = true } = {}) {
  const res = { schema: 'wonderpages.c1.recheck/1', id, at: new Date().toISOString(), write: false, stillPending: false, stillAuthorized: false, reasons: [] };
  const G = (args, allowFail = false) => git(args, { cwd: bridge, allowFail });
  try {
    if (!order || order.verdict !== 'PROCEED') { res.reasons.push('no PROCEED work order'); return res; }
    if (!order.pending.some(p => p.messageId === id)) { res.reasons.push(`${id} was not pending at R`); return res; }
    if (fetch) G(['fetch', '-q', 'origin', '+refs/heads/main:refs/remotes/origin/main']);
    const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'c1-main-')); fs.rmSync(wt, { recursive: true });
    G(['worktree', 'add', '-q', '--detach', wt, 'origin/main']);
    try {
      const cf = verifyControlFiles(wt, wpRoot);
      if (!cf.ok) { res.reasons.push('current Bridge main control files differ from WonderPages BRIDGE-CONTROL.json'); return res; }
      const r = spawnSync(process.execPath, [path.join(wt, 'tools/bridge.mjs'), 'write-check', '--for=claude', `--id=${id}`], { cwd: wt, encoding: 'utf8' });
      let w; try { w = JSON.parse(r.stdout); } catch { w = null; }
      if (!w || w.WRITE_CHECK !== 'WRITE') { res.reasons.push(`STILL PENDING failed: ${w ? w.reason + (w.resolvedBy ? ' by ' + w.resolvedBy : '') : 'write-check error'}`); return res; }
      res.stillPending = true;
    } finally { G(['worktree', 'remove', '--force', wt], true); }
    const auth = authorityState(wpRoot), was = order.authority;
    if (fetch && auth.canonicalBranch) git(['fetch', '-q', 'origin', auth.canonicalBranch], { cwd: wpRoot, allowFail: true });
    const originHead = auth.canonicalBranch ? (git(['rev-parse', `refs/remotes/origin/${auth.canonicalBranch}`], { cwd: wpRoot, allowFail: true }) || '').trim() || null : null;
    for (const k of ['phaseId', 'phaseStatus', 'delegationId', 'delegationStatus', 'delegationAppliesTo', 'delegationSha256', 'writesAllowed']) if (auth[k] !== was[k]) res.reasons.push(`authority changed since the bootstrap: ${k} ${was[k]} → ${auth[k]}`);
    const localHead = git(['rev-parse', 'HEAD'], { cwd: wpRoot }).trim();
    if (originHead && order.wonderpages.originHead && originHead !== order.wonderpages.originHead && originHead !== localHead) res.reasons.push(`WonderPages origin/${auth.canonicalBranch} moved since the bootstrap (${order.wonderpages.originHead.slice(0, 12)} → ${originHead.slice(0, 12)}): re-bootstrap (only the routine's own fast-forward pushes are accepted)`);
    const g = runGate(wpRoot); if (g.CONTEXT_INTEGRITY !== 'PASS') res.reasons.push('WonderPages gate: ' + g.checks.filter(c => c.status === 'FAIL').map(c => c.id).join(', '));
    res.authority = { writesAllowed: auth.writesAllowed, phaseId: auth.phaseId, phaseStatus: auth.phaseStatus, delegationSha256: auth.delegationSha256 };
    if (res.reasons.length) return res;
    res.stillAuthorized = true; res.write = true; return res;
  } catch (e) { res.reasons.push(String(e.message || e)); return res; }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const arg = (k, d = null) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
  const out = (o, ok) => { const t = JSON.stringify(o, null, 1); if (arg('out')) fs.writeFileSync(arg('out'), t + '\n'); console.log(t); process.exit(ok ? 0 : 1); };
  const cmd = process.argv[2], fetch = !process.argv.includes('--no-fetch'), bridge = arg('bridge') && path.resolve(arg('bridge'));
  if (cmd === 'bootstrap') { const o = bootstrap({ bridge, head: arg('head'), pr: arg('pr'), fetch }); out(o, o.verdict !== 'FAIL'); }
  else if (cmd === 'recheck') { const r = recheck({ bridge, order: JSON.parse(fs.readFileSync(arg('order'), 'utf8')), id: arg('id'), fetch }); out(r, r.write); }
  else if (cmd === 'scope') { const v = scopeViolations(arg('since')); out({ SCOPE: v.length ? 'VIOLATION' : 'PASS', outsideWriteScope: v }, !v.length); }
  else if (cmd === 'authority') out(authorityState(), true);
  else { console.error('usage: c1.mjs bootstrap|recheck|scope|authority (see header)'); process.exit(2); }
}
