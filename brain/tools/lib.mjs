/**
 * Shared helpers of the Project Brain tooling (control plane only).
 * Uses Node built-ins and the git CLI only. The gate never imports application code; drift.mjs is the one tool that
 * loads application modules, read-only, to fingerprint their behaviour.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const BRAIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
export const gitBlobSha = b => crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`), b])).digest('hex');

/** Deterministic JSON: object keys sorted, arrays kept in order. */
export function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
export const canonHash = v => sha256(Buffer.from(canon(v), 'utf8'));

export function git(args, { cwd = BRAIN_ROOT, allowFail = false, buffer = false } = {}) {
  const r = spawnSync('git', args, { cwd, encoding: buffer ? 'buffer' : 'utf8', maxBuffer: 512 * 1024 * 1024 });
  if (r.status !== 0 && !allowFail) throw new Error(`git ${args.join(' ')} → ${(r.stderr || '').toString().trim()}`);
  return r.status === 0 ? (buffer ? r.stdout : r.stdout.toString()) : null;
}

/** Tracked files as recorded in the index: [{ path, blob, mode }]. Index blob ids are line-ending independent. */
export function indexEntries(root = BRAIN_ROOT) {
  const out = git(['ls-files', '-s', '-z'], { cwd: root });
  return out.split('\0').filter(Boolean).map(l => { const [meta, p] = l.split('\t'); const [mode, blob] = meta.split(' '); return { path: p, blob, mode }; }).sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}
/** Files of a commit: [{ path, blob, mode }]. */
export function treeEntries(commit, root = BRAIN_ROOT) {
  const out = git(['ls-tree', '-r', '-z', '--full-tree', commit], { cwd: root });
  return out.split('\0').filter(Boolean).map(l => { const [meta, p] = l.split('\t'); const [mode, type, blob] = meta.split(' '); return { path: p, blob, mode, type }; }).filter(e => e.type === 'blob').sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** Minimal glob: `**` any depth (incl. none), `*` within one segment, `?` one char. */
export function globToRe(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') { if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i++; } }
    else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$');
}
export const matchAny = (p, globs) => globs.some(g => globToRe(g).test(p));

export const readJSON = (rel, root = BRAIN_ROOT) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
export const readText = (rel, root = BRAIN_ROOT) => fs.readFileSync(path.join(root, rel), 'utf8');
export const exists = (rel, root = BRAIN_ROOT) => fs.existsSync(path.join(root, rel));
export const writeJSON = (file, v) => fs.writeFileSync(file, JSON.stringify(v, null, 1) + '\n');

/** Hash-chained JSONL (same shape as the policy ledger): each line = { ...entry, prevHash, hash = canonHash(entry without hash) }. */
export function verifyChain(lines) {
  let prev = null; const errors = [];
  lines.forEach((e, i) => { const { hash, ...rest } = e; if (e.prevHash !== prev) errors.push(`line ${i + 1}: prevHash`); if (hash !== canonHash(rest)) errors.push(`line ${i + 1}: hash`); prev = hash; });
  return { ok: errors.length === 0, head: prev, errors };
}
export const readJSONL = (rel, root = BRAIN_ROOT) => { const t = exists(rel, root) ? readText(rel, root).trim() : ''; return t ? t.split('\n').map(l => JSON.parse(l)) : []; };
