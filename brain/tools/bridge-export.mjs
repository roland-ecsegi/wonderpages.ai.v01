#!/usr/bin/env node
/**
 * One-way, verifiable mirror: WonderPages (git objects of one commit) → Agent Bridge working copy.
 *
 *   node brain/tools/bridge-export.mjs export --bridge=DIR [--commit=REV] [--mode=manual|ci] [--force]
 *        writes mirror/current/, mirror/snapshots/<seq>-<sha12>/{MANIFEST,DELTA}.json and mirror/CURRENT.json in DIR
 *        (it never commits or pushes; the caller does). Fail-closed: secret suspicion or failed verification ⇒ exit 1.
 *   node brain/tools/bridge-export.mjs verify --bridge=DIR
 *        verifies the Bridge mirror against THIS WonderPages repository (provenance: every file's git blob id must equal the blob
 *        at the recorded source commit) AND the Bridge control files against brain/manifest/BRIDGE-CONTROL.json — the checks a
 *        ChatGPT write cannot pass undetected (they run outside the Bridge).
 *   node brain/tools/bridge-export.mjs control --bridge=DIR
 *        records the sha256 of every Bridge control file into brain/manifest/BRIDGE-CONTROL.json (run by Claude after a reviewed
 *        change of Bridge control files; the manifest then reaches the Bridge only through the verified mirror).
 *
 * WonderPages never reads the Bridge at runtime or build time. This tool runs only when a person / CI invokes it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { BRAIN_ROOT, sha256, gitBlobSha, canonHash, git, treeEntries, matchAny, readJSON, writeJSON } from './lib.mjs';
import { runGate } from './brain.mjs';

export const PROTOCOL = 'wonderpages.bridge-protocol/1';
const POLICY = 'brain/manifest/MIRROR-POLICY.json';
export const CONTROL_FILE = 'brain/manifest/BRIDGE-CONTROL.json';
export const BRIDGE_CONTROL = [/^tools\//, /^schemas\//, /^\.github\//, /^PROTOCOL\.md$/, /^README\.md$/, /^INGRESS\.md$/, /^audit\/README\.md$/, /^exchange\/QUARANTINE\.json$/];
const bridgeFiles = bridge => [...new Set([...git(['ls-files'], { cwd: bridge }).split('\n'), ...git(['ls-files', '--others', '--exclude-standard'], { cwd: bridge }).split('\n')])].filter(Boolean).sort();

export function controlManifest(bridge, root = BRAIN_ROOT) {
  const files = bridgeFiles(bridge).filter(f => BRIDGE_CONTROL.some(r => r.test(f)) && fs.existsSync(path.join(bridge, f))).map(f => { const b = fs.readFileSync(path.join(bridge, f)); return { path: f, sha256: sha256(b), gitBlob: gitBlobSha(b) }; });
  return { schema: 'wonderpages.brain.bridge-control/1', bridgeRepo: readJSON(POLICY, root).bridgeRepo, rule: 'Canonical hashes (sha256 + git blob id, the latter directly comparable through the GitHub connector) of the Agent Bridge control files. Bridge CI (tools/bridge.mjs verify-control) and Claude (bridge-export.mjs verify) require the live control files to equal these and forbid unlisted control files. Updated only by Claude after a reviewed control change, then exported through the provenance-verified mirror.', files };
}
export function verifyControlFiles(bridge, root = BRAIN_ROOT) {
  const errors = []; if (!fs.existsSync(path.join(root, CONTROL_FILE))) return { ok: false, errors: [`${CONTROL_FILE} missing`] };
  const man = readJSON(CONTROL_FILE, root), listed = new Set(man.files.map(f => f.path));
  for (const f of man.files) { const p = path.join(bridge, f.path); if (!fs.existsSync(p)) errors.push(`control: missing ${f.path}`); else { const b = fs.readFileSync(p); if (sha256(b) !== f.sha256 || (f.gitBlob && gitBlobSha(b) !== f.gitBlob)) errors.push(`control: ${f.path} differs from the WonderPages-canonical hash`); } }
  for (const f of bridgeFiles(bridge)) if (BRIDGE_CONTROL.some(r => r.test(f)) && !listed.has(f)) errors.push(`control: unlisted control file ${f}`);
  return { ok: errors.length === 0, errors };
}
const arg = (k, d = null) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const isText = b => !b.subarray(0, 8000).includes(0);

export function secretHits(entries, blobOf, policy) {
  const pats = policy.secretScan.patterns.map(p => new RegExp(p, 'g')), benign = new RegExp(policy.secretScan.benign, 'i'), hits = [];
  for (const e of entries) {
    const b = blobOf(e); if (!isText(b)) continue; const t = b.toString('utf8');
    for (const re of pats) for (const m of t.matchAll(re)) if (!benign.test(t.slice(Math.max(0, m.index - 48), m.index + m[0].length + 48))) hits.push(`${e.path}: ${re.source.slice(0, 24)}…`);
  }
  return hits;
}

export function manifestHash(m) { const { manifestSha256, ...rest } = m; return canonHash(rest); }

/** Self-consistency of a Bridge mirror (what the Bridge's own CI also checks). */
export function verifyMirror(bridge) {
  const errors = [], P = (...p) => path.join(bridge, ...p);
  if (!fs.existsSync(P('mirror', 'CURRENT.json'))) return { ok: false, errors: ['mirror/CURRENT.json missing'] };
  const cur = JSON.parse(fs.readFileSync(P('mirror', 'CURRENT.json'), 'utf8'));
  const mpath = P(cur.manifestPath); if (!fs.existsSync(mpath)) return { ok: false, errors: [`manifest ${cur.manifestPath} missing`] };
  const man = JSON.parse(fs.readFileSync(mpath, 'utf8'));
  if (manifestHash(man) !== man.manifestSha256) errors.push('manifest hash does not match its content');
  if (cur.manifestSha256 !== man.manifestSha256) errors.push('CURRENT.json points to a different manifest hash');
  if (cur.source.commit !== man.source.commit || cur.seq !== man.seq) errors.push('CURRENT.json and manifest disagree on source/seq');
  const listed = new Set(man.files.map(f => f.path));
  for (const f of man.files) {
    const p = P('mirror', 'current', f.path);
    if (!fs.existsSync(p)) { errors.push(`missing: ${f.path}`); continue; }
    const b = fs.readFileSync(p); if (sha256(b) !== f.sha256 || gitBlobSha(b) !== f.gitBlob) errors.push(`content differs from manifest: ${f.path}`);
  }
  const walk = (d, rel = '') => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name), rel + e.name + '/') : [rel + e.name]);
  if (fs.existsSync(P('mirror', 'current'))) for (const f of walk(P('mirror', 'current'))) if (!listed.has(f)) errors.push(`extra file not in manifest: ${f}`);
  if (man.prevManifestSha256) { const prev = man.prevSnapshot && P('mirror', 'snapshots', man.prevSnapshot, 'MANIFEST.json'); if (!prev || !fs.existsSync(prev)) errors.push('previous manifest missing'); else { const pm = JSON.parse(fs.readFileSync(prev, 'utf8')); if (pm.manifestSha256 !== man.prevManifestSha256 || manifestHash(pm) !== pm.manifestSha256) errors.push('manifest chain broken'); } }
  return { ok: errors.length === 0, errors, current: cur, manifest: man };
}

/** Provenance: compare the mirror with the real source repository's git objects. */
export function verifyProvenance(bridge, sourceRoot = BRAIN_ROOT) {
  const v = verifyMirror(bridge); if (!v.manifest) return v;
  const errors = [...v.errors], commit = v.manifest.source.commit;
  if (git(['cat-file', '-e', commit + '^{commit}'], { cwd: sourceRoot, allowFail: true }) === null) return { ok: false, errors: [...errors, `source commit ${commit} not found in ${sourceRoot}`] };
  const tree = new Map(treeEntries(commit, sourceRoot).map(e => [e.path, e.blob]));
  const listed = new Set([...v.manifest.files.map(f => f.path), ...v.manifest.excluded.map(f => f.path)]);
  for (const f of v.manifest.files) if (tree.get(f.path) !== f.gitBlob) errors.push(`provenance: ${f.path} is not the blob of ${commit.slice(0, 12)}`);
  for (const f of v.manifest.excluded) if (tree.get(f.path) !== f.gitBlob) errors.push(`provenance: excluded ${f.path} blob differs`);
  for (const p of tree.keys()) if (!listed.has(p)) errors.push(`provenance: ${p} of the source commit is missing from the snapshot`);
  return { ok: errors.length === 0, errors, current: v.current, manifest: v.manifest };
}

export function exportSnapshot({ root = BRAIN_ROOT, bridge, commit = 'HEAD', mode = 'manual', force = false, now = new Date().toISOString(), env = process.env } = {}) {
  const policy = readJSON(POLICY, root), sha = git(['rev-parse', commit + '^{commit}'], { cwd: root }).trim();
  const entries = treeEntries(sha, root), blobCache = new Map();
  const blobOf = e => { if (!blobCache.has(e.blob)) blobCache.set(e.blob, git(['cat-file', 'blob', e.blob], { cwd: root, buffer: true })); return blobCache.get(e.blob); };
  const excludedRule = e => policy.exclude.find(x => matchAny(e.path, [x.glob]));
  const included = entries.filter(e => !excludedRule(e)), excluded = entries.filter(e => excludedRule(e));
  const hits = secretHits(included, blobOf, policy);
  if (hits.length) throw Object.assign(new Error('SECRET_SUSPECT — export aborted, nothing written:\n  ' + hits.join('\n  ')), { code: 'secret' });
  const P = (...p) => path.join(bridge, ...p);
  const prevCur = fs.existsSync(P('mirror', 'CURRENT.json')) ? JSON.parse(fs.readFileSync(P('mirror', 'CURRENT.json'), 'utf8')) : null;
  if (prevCur && prevCur.source.commit === sha && !force) return { skipped: true, reason: `already mirrored as ${prevCur.snapshotId}`, current: prevCur };
  const prevMan = prevCur ? JSON.parse(fs.readFileSync(P(prevCur.manifestPath), 'utf8')) : null;
  const seq = (prevCur?.seq || 0) + 1, snapshotId = `${String(seq).padStart(6, '0')}-${sha.slice(0, 12)}`;
  const branch = env.GITHUB_REF_NAME || (git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root }).trim());
  const gate = runGate(root, { env });
  const files = included.map(e => { const b = blobOf(e); return { path: e.path, mode: e.mode, size: b.length, sha256: sha256(b), gitBlob: e.blob }; });
  const excl = excluded.map(e => { const b = blobOf(e); return { path: e.path, mode: e.mode, size: b.length, sha256: sha256(b), gitBlob: e.blob, reason: excludedRule(e).reason }; });
  const state = (() => { try { const s = JSON.parse(blobOf(entries.find(e => e.path === 'brain/state/CURRENT-STATE.json')).toString()); const ph = JSON.parse(blobOf(entries.find(e => e.path === 'brain/phase/ACTIVE-PHASE.json')).toString()); return { activePhase: s.activePhase, phaseStatus: ph.status, nextAuthorizedStep: s.nextAuthorizedStep, statuses: s.statuses }; } catch { return null; } })();
  const manifest = {
    schema: 'wonderpages.bridge.mirror-manifest/1', protocol: PROTOCOL, seq, snapshotId,
    source: { repo: policy.sourceRepo, branch, commit: sha, tree: git(['rev-parse', sha + '^{tree}'], { cwd: root }).trim(), committedAt: git(['show', '-s', '--format=%cI', sha], { cwd: root }).trim() },
    generatedAt: now, syncMode: mode, generator: { tool: 'brain/tools/bridge-export.mjs', toolBlob: entries.find(e => e.path === 'brain/tools/bridge-export.mjs')?.blob ?? null, policyBlob: entries.find(e => e.path === POLICY)?.blob ?? null },
    contextIntegrity: { status: gate.CONTEXT_INTEGRITY, at: gate.at, failed: gate.checks.filter(c => c.status === 'FAIL').map(c => c.id), note: 'Gate run on the exporting checkout. FAIL ⇒ the brain replica is not reliable for current-state claims.' },
    state, counts: { files: files.length, excluded: excl.length, bytes: files.reduce((a, f) => a + f.size, 0) },
    prevSnapshot: prevCur?.snapshotId ?? null, prevManifestSha256: prevMan?.manifestSha256 ?? null,
    files, excluded: excl
  };
  manifest.manifestSha256 = manifestHash(manifest);
  const old = new Map((prevMan?.files || []).map(f => [f.path, f.sha256])), now_ = new Map(files.map(f => [f.path, f.sha256]));
  const delta = { schema: 'wonderpages.bridge.mirror-delta/1', snapshotId, fromSnapshot: prevCur?.snapshotId ?? null, fromCommit: prevMan?.source.commit ?? null, toCommit: sha,
    added: files.filter(f => !old.has(f.path)).map(f => f.path), modified: files.filter(f => old.has(f.path) && old.get(f.path) !== f.sha256).map(f => f.path), removed: [...old.keys()].filter(p => !now_.has(p)) };
  // write: replace mirror/current entirely, then snapshot metadata, then the pointer (last)
  fs.rmSync(P('mirror', 'current'), { recursive: true, force: true });
  for (const e of included) { const out = P('mirror', 'current', e.path); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, blobOf(e)); }
  fs.mkdirSync(P('mirror', 'snapshots', snapshotId), { recursive: true });
  writeJSON(P('mirror', 'snapshots', snapshotId, 'MANIFEST.json'), manifest);
  writeJSON(P('mirror', 'snapshots', snapshotId, 'DELTA.json'), delta);
  const current = { schema: 'wonderpages.bridge.mirror-current/1', protocol: PROTOCOL, seq, snapshotId, source: manifest.source, manifestPath: `mirror/snapshots/${snapshotId}/MANIFEST.json`, manifestSha256: manifest.manifestSha256, syncedAt: now, syncMode: mode, contextIntegrity: manifest.contextIntegrity.status, state,
    syncStatus: 'PENDING_VERIFICATION', checks: null };
  writeJSON(P('mirror', 'CURRENT.json'), current);
  const v = verifyProvenance(bridge, root);
  current.checks = { sourceCommitIdentified: /^[0-9a-f]{40}$/.test(sha), snapshotComplete: v.ok && files.length + excl.length === entries.length, manifestValid: !v.errors.some(e => /manifest/.test(e)), integrityValid: !v.errors.some(e => /content differs|missing|extra/.test(e)), syncVerified: v.ok };
  current.syncStatus = Object.values(current.checks).every(Boolean) ? 'VERIFIED' : 'INVALID';
  if (!v.ok) current.errors = v.errors;
  writeJSON(P('mirror', 'CURRENT.json'), current);
  return { skipped: false, current, delta: { added: delta.added.length, modified: delta.modified.length, removed: delta.removed.length } };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const cmd = process.argv[2], bridge = arg('bridge'); if (!bridge) { console.error('--bridge=DIR required'); process.exit(2); }
  try {
    if (cmd === 'export') {
      const r = exportSnapshot({ bridge: path.resolve(bridge), commit: arg('commit', 'HEAD'), mode: arg('mode', 'manual'), force: process.argv.includes('--force') });
      console.log(JSON.stringify(r.skipped ? r : { snapshotId: r.current.snapshotId, sourceCommit: r.current.source.commit, syncStatus: r.current.syncStatus, checks: r.current.checks, contextIntegrity: r.current.contextIntegrity, delta: r.delta }, null, 1));
      process.exit(r.skipped || r.current.syncStatus === 'VERIFIED' ? 0 : 1);
    } else if (cmd === 'verify') {
      const r = verifyProvenance(path.resolve(bridge)), c = verifyControlFiles(path.resolve(bridge));
      console.log(JSON.stringify({ PROVENANCE: r.ok ? 'VERIFIED' : 'INVALID', CONTROL: c.ok ? 'VERIFIED' : 'INVALID', snapshot: r.current?.snapshotId, sourceCommit: r.manifest?.source.commit, errors: [...r.errors, ...c.errors].slice(0, 50) }, null, 1));
      process.exit(r.ok && c.ok ? 0 : 1);
    } else if (cmd === 'control') {
      const m = controlManifest(path.resolve(bridge)); writeJSON(path.join(BRAIN_ROOT, CONTROL_FILE), m);
      console.log(`recorded ${m.files.length} Bridge control files in ${CONTROL_FILE}`);
    } else { console.error('usage: bridge-export.mjs export|verify|control --bridge=DIR'); process.exit(2); }
  } catch (e) { console.error(e.message || e); process.exit(1); }
}
