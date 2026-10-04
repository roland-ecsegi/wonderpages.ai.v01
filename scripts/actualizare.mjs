#!/usr/bin/env node
/**
 * P8-T03 — staged install/upgrade with smoke test and full rollback.
 *   node scripts/actualizare.mjs --release=<folder sau .zip al versiunii noi> [--install=<folderul aplicației>]
 *   node scripts/actualizare.mjs --rollback [--install=<folderul aplicației>]
 * 1. The release is verified before anything changes: every file against RELEASE-MANIFEST.json (sha256), the release
 *    gate evidence (RELEASE-EVIDENCE.json) PASS for exactly these sources (digest).
 * 2. Preserved, never touched: .env, data/ (projects, settings, agents, keys), node_modules/, logs, _upgrade/. A changed
 *    package-lock.json stops the upgrade (dependency upgrade only as a separate, explicit step: --allow-deps → npm ci).
 * 3. Journaled apply: the current code files are backed up, files removed by the new version are removed, new files
 *    copied; a stop in the middle is rolled back at the next run (or at startup of this script).
 * 4. Smoke: every installed file matches the new manifest; the build guard passes; the new code starts on an EMPTY
 *    temporary data folder (fresh install: zero projects, health ok). Any failure → automatic full rollback, verified by
 *    hash against the previous code. The preserved files are hashed before and after (protected hashes).
 * The live data is migrated (additively) by the next normal start; take a backup first (Setări › Backup).
 */
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readZip } from '../server/security/safe-zip.js';
import { RELEASE_INCLUDE, sourceDigest } from './enterprise/release-gate.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), APP = path.resolve(HERE, '..');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const PRESERVE = /^(\.env$|data\/|node_modules\/|_upgrade\/|.*\.log$|stop\.flag$|\.git\/)/;
const fail = (code, message, extra = {}) => { throw { code, message, ...extra }; };
const readJSON = f => JSON.parse(fs.readFileSync(f, 'utf8'));

/** A release folder (or a .zip extracted to a staging folder) verified file by file. */
export function verifyRelease(src, { staging = null } = {}) {
  let dir = src;
  if (/\.zip$/i.test(src)) {
    const files = readZip(fs.readFileSync(src)), root = [...files.keys()].find(k => /(^|\/)RELEASE-MANIFEST\.json$/.test(k))?.replace(/RELEASE-MANIFEST\.json$/, '');
    if (root == null) fail('manifest_missing', 'Arhiva nu conține RELEASE-MANIFEST.json.');
    dir = staging || fs.mkdtempSync(path.join(os.tmpdir(), 'wp-release-'));
    for (const [k, b] of files) { if (!k.startsWith(root) || k.endsWith('/')) continue; const out = path.join(dir, k.slice(root.length)); if (!out.startsWith(path.resolve(dir) + path.sep)) fail('unsafe_path', 'Cale nesigură în arhivă.'); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, b); }
  }
  const mp = path.join(dir, 'RELEASE-MANIFEST.json'), ep = path.join(dir, 'RELEASE-EVIDENCE.json');
  if (!fs.existsSync(mp)) fail('manifest_missing', 'Versiunea nu are RELEASE-MANIFEST.json.');
  if (!fs.existsSync(ep)) fail('evidence_missing', 'Versiunea nu are dovada porții de release (RELEASE-EVIDENCE.json).');
  const manifest = readJSON(mp), evidence = readJSON(ep), bad = [];
  for (const f of manifest.files || []) { if (f.path === 'RELEASE-MANIFEST.json') continue; const p = path.join(dir, f.path); if (!fs.existsSync(p) || sha(fs.readFileSync(p)) !== f.sha256) bad.push(f.path); }
  if (bad.length) fail('release_corrupt', `Fișiere lipsă sau modificate în versiunea nouă: ${bad.slice(0, 5).join(', ')}.`, { files: bad });
  if (evidence.status !== 'PASS' || !evidence.ok) fail('gate_not_passed', `Poarta de release a versiunii este ${evidence.status}.`);
  if (evidence.source?.sha256 !== sourceDigest(dir).sha256) fail('evidence_mismatch', 'Dovada porții nu corespunde fișierelor versiunii.');
  return { dir, manifest, evidence, version: manifest.version, release: manifest.release };
}

/** The code files of an installation: its manifest when it has one, otherwise everything in the release allowlist. */
function installedFiles(root) {
  const mp = path.join(root, 'RELEASE-MANIFEST.json');
  if (fs.existsSync(mp)) return readJSON(mp).files.map(f => f.path).filter(p => !PRESERVE.test(p)).concat('RELEASE-MANIFEST.json');
  const out = [], walk = rel => { for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) { const r = rel ? `${rel}/${e.name}` : e.name; if (PRESERVE.test(r) || e.isSymbolicLink()) continue; if (e.isDirectory()) walk(r); else out.push(r); } };
  for (const item of RELEASE_INCLUDE) { const p = path.join(root, item); if (!fs.existsSync(p)) continue; if (fs.statSync(p).isDirectory()) walk(item); else out.push(item); }
  return out;
}
/** Protected hashes: configuration and data that an install/update must never change. */
export function protectedHashes(root) {
  const out = {}, add = rel => { const p = path.join(root, rel); if (fs.existsSync(p) && fs.statSync(p).isFile()) out[rel] = sha(fs.readFileSync(p)); };
  add('.env'); const d = path.join(root, 'data');
  if (fs.existsSync(d)) { const walk = rel => { for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) { const r = `${rel}/${e.name}`; if (e.isDirectory()) walk(r); else if (fs.statSync(path.join(root, r)).size <= 64 * 1024 * 1024) add(r); } }; walk('data'); }
  return out;
}
/** The installed dependency set (lockfile packages, without the app's own version line): a version bump is not a dependency change. */
export function depsDigest(root) { const f = path.join(root, 'package-lock.json'); if (!fs.existsSync(f)) return null; const { '': self, ...deps } = readJSON(f).packages || {}; return sha(JSON.stringify([self?.dependencies || {}, deps])); }
const journalPath = root => path.join(root, '_upgrade', 'journal.json');
const writeJournal = (root, j) => { fs.mkdirSync(path.dirname(journalPath(root)), { recursive: true }); const t = journalPath(root) + '.tmp'; fs.writeFileSync(t, JSON.stringify(j, null, 1)); fs.renameSync(t, journalPath(root)); };

function restoreFrom(root, j) {
  for (const rel of j.added || []) fs.rmSync(path.join(root, rel), { force: true });
  for (const rel of j.previousFiles) { const b = path.join(j.backup, rel); if (fs.existsSync(b)) { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.copyFileSync(b, path.join(root, rel)); } }
  const bad = j.previousFiles.filter(rel => !fs.existsSync(path.join(root, rel)) || sha(fs.readFileSync(path.join(root, rel))) !== j.previousHashes[rel]);
  if (bad.length) fail('rollback_incomplete', `Revenirea nu a putut reface: ${bad.slice(0, 5).join(', ')}.`, { files: bad });
  return { restored: j.previousFiles.length, removed: (j.added || []).length };
}

const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
/** The installed code starts on an empty temporary data folder: health ok and zero projects (fresh install). */
export async function smoke(root, { timeoutMs = 60000, env = {} } = {}) {
  const build = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
  if (build.status !== 0) return { ok: false, step: 'build', detail: (build.stderr || build.stdout || '').trim().split('\n').slice(-3).join(' ') };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-smoke-')), port = await freePort();
  const child = spawn(process.execPath, ['server/start.js'], { cwd: root, env: { ...process.env, ...env, PORT: String(port), STORAGE: 'local', DATABASE_URL: '', DATA_DIR: path.join(tmp, 'data'), OUTPUT_DIR: path.join(tmp, 'out'), OPEN_BROWSER: '0', WP_BG: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; child.stdout.on('data', d => { log += d; }); child.stderr.on('data', d => { log += d; });
  try {
    const t0 = Date.now(); let health = null, state = null;
    while (Date.now() - t0 < timeoutMs && child.exitCode == null) {
      try { const h = await fetch(`http://127.0.0.1:${port}/api/health`, { headers: { 'x-wp': '1' } }); if (h.ok) { health = await h.json(); state = await (await fetch(`http://127.0.0.1:${port}/api/state`, { headers: { 'x-wp': '1' } })).json(); break; } } catch {}
      await new Promise(r => setTimeout(r, 400));
    }
    if (!health) return { ok: false, step: 'start', detail: log.trim().split('\n').slice(-4).join(' ').slice(0, 400) };
    const projects = (state.projects || []).length, ok = health.app?.status === 'ok' && projects === 0;
    return { ok, step: ok ? 'done' : 'health', health: health.app?.status, projects, version: health.app?.version };
  } finally { child.kill(); await new Promise(r => setTimeout(r, 200)); fs.rmSync(tmp, { recursive: true, force: true }); }
}

/** A journal left in "applying"/"applied" (process stopped) is rolled back before anything else. */
export function recoverUpgrade(root = APP) {
  if (!fs.existsSync(journalPath(root))) return { recovered: false };
  const j = readJSON(journalPath(root)); if (!['applying', 'applied'].includes(j.state)) return { recovered: false, state: j.state };
  const r = restoreFrom(root, j); writeJournal(root, { ...j, state: 'rolled_back', reason: 'actualizare întreruptă', at: Date.now() }); return { recovered: true, ...r };
}

export async function upgrade({ install = APP, release, allowDeps = false, faultAt = null, smokeEnv = {} }) {
  recoverUpgrade(install);
  const rel = verifyRelease(release), before = protectedHashes(install);
  const lockOld = depsDigest(install), lockNew = depsDigest(rel.dir);
  if (lockOld && lockOld !== lockNew && !allowDeps) fail('dependencies_changed', 'Versiunea nouă schimbă dependențele (package-lock.json): actualizarea lor este un pas separat (--allow-deps rulează npm ci).');
  const previousFiles = installedFiles(install), previousHashes = Object.fromEntries(previousFiles.map(f => [f, sha(fs.readFileSync(path.join(install, f)))]));
  const newFiles = rel.manifest.files.map(f => f.path).filter(p => !PRESERVE.test(p)).concat('RELEASE-MANIFEST.json');
  const stamp = Date.now(), backup = path.join(install, '_upgrade', `previous-${stamp}`);
  for (const f of previousFiles) { fs.mkdirSync(path.dirname(path.join(backup, f)), { recursive: true }); fs.copyFileSync(path.join(install, f), path.join(backup, f)); }
  const added = newFiles.filter(f => !previousFiles.includes(f)), removed = previousFiles.filter(f => !newFiles.includes(f));
  const j = { state: 'applying', at: stamp, from: readJSON(path.join(install, 'package.json')).version, to: rel.version, release: rel.release, backup, previousFiles, previousHashes, added, removed };
  writeJournal(install, j);
  try {
    for (const f of removed) fs.rmSync(path.join(install, f), { force: true });
    let n = 0; for (const f of newFiles) { if (faultAt === 'mid-copy' && ++n === Math.ceil(newFiles.length / 2)) fail('upgrade_interrupted', 'Oprire simulată în timpul copierii.', { crash: true }); fs.mkdirSync(path.dirname(path.join(install, f)), { recursive: true }); fs.copyFileSync(path.join(rel.dir, f), path.join(install, f)); }
    writeJournal(install, { ...j, state: 'applied' });
    if (lockOld !== lockNew && allowDeps) { const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--no-audit', '--no-fund'], { cwd: install, encoding: 'utf8' }); if (r.status !== 0) fail('npm_failed', 'npm ci a eșuat.'); }
    const mism = rel.manifest.files.filter(f => !PRESERVE.test(f.path) && f.path !== 'RELEASE-MANIFEST.json' && sha(fs.readFileSync(path.join(install, f.path))) !== f.sha256).map(f => f.path);
    if (mism.length) fail('install_mismatch', `Fișiere instalate diferite de manifest: ${mism.slice(0, 5).join(', ')}.`);
    const sm = await smoke(install, { env: smokeEnv }); if (!sm.ok) fail('smoke_failed', `Testul de pornire a eșuat (${sm.step}): ${sm.detail || `health ${sm.health}, proiecte ${sm.projects}`}.`, { smoke: sm });
    const after = protectedHashes(install), changed = Object.keys({ ...before, ...after }).filter(k => before[k] !== after[k]);
    if (changed.length) fail('protected_changed', `Actualizarea a schimbat fișiere protejate: ${changed.slice(0, 5).join(', ')}.`);
    writeJournal(install, { ...j, state: 'committed', smoke: sm, committedAt: Date.now() });
    return { ok: true, from: j.from, to: j.to, added: added.length, removed: removed.length, updated: newFiles.length - added.length, smoke: sm, protected: Object.keys(before).length, backup };
  } catch (e) {
    if (e?.crash) throw e;   // simulated process death: the journal stays "applying", the next run rolls back
    const r = restoreFrom(install, j); writeJournal(install, { ...j, state: 'rolled_back', reason: e?.code || String(e?.message || e), at: Date.now() });
    throw { ...e, rolledBack: true, rollback: r };
  }
}

/** Manual rollback of the last committed upgrade (one level), verified by hash. */
export function rollback(install = APP) {
  if (!fs.existsSync(journalPath(install))) fail('nothing_to_rollback', 'Nu există o actualizare de anulat.');
  const j = readJSON(journalPath(install)); if (j.state !== 'committed') fail('nothing_to_rollback', `Ultima actualizare este în starea „${j.state}”.`);
  const newOnly = (j.added || []); const r = restoreFrom(install, { ...j, added: newOnly });
  writeJournal(install, { ...j, state: 'rolled_back', reason: 'revenire manuală', at: Date.now() }); return { ok: true, version: j.from, ...r };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const arg = n => process.argv.find(x => x.startsWith(`--${n}=`))?.split('=').slice(1).join('=');
  const install = path.resolve(arg('install') || APP);
  try {
    const r = process.argv.includes('--rollback') ? rollback(install) : await upgrade({ install, release: path.resolve(arg('release') || ''), allowDeps: process.argv.includes('--allow-deps') });
    console.log(JSON.stringify(r, null, 1));
  } catch (e) { console.error(`Actualizare oprită: ${e.message || e}${e.rolledBack ? ' — versiunea anterioară a fost refăcută și verificată.' : ''}`); process.exit(1); }
}
