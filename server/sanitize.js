/**
 * Validare pentru tot ce vine din afara aplicației (arhive importate, pachete, cereri din rețea).
 * Audit extern v18.2 (C1): câmpurile interne ale unui proiect importat (cod, stare, aprobări) nu se mai preiau orbește.
 */
import path from 'node:path';

export const str = (v, max = 2000) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max);
/* project code used in file and folder names: 2–8 lowercase letters/digits, nothing else */
export const CODE_RE = /^[a-z0-9]{2,8}$/;
export const safeCode = c => (typeof c === 'string' && CODE_RE.test(c) ? c : null);
/* a project id as minted by uid('p') */
export const PID_RE = /^p[a-z0-9]{6,24}$/;
/* relative file inside a project folder: images/… or uploads/… with a plain file name */
export const REL_FILE_RE = /^(images|uploads|exports)\/[A-Za-z0-9._-]{1,120}$/;
export const isSafeRel = r => typeof r === 'string' && REL_FILE_RE.test(r) && !r.includes('..');

/* the form input of a project: flat keys, text / numbers / booleans / short text lists only */
export function cleanInput(input) {
  const out = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
  for (const [k, v] of Object.entries(input)) {
    if (!/^[a-z0-9_]{1,40}$/i.test(k)) continue;
    if (typeof v === 'string') out[k] = v.slice(0, 20000);
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'boolean') out[k] = v;
    else if (Array.isArray(v)) out[k] = v.filter(x => typeof x === 'string').slice(0, 20).map(x => x.slice(0, 200));
  }
  return out;
}

/* true when `child` is `parent` itself or inside it (no escape through .. or another drive) */
export function inside(parent, child) {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/* images the app serves back; anything else is downloaded, never rendered on the app's origin */
export const IMAGE_MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

/* a comment on a document: only the fields the interface uses */
export function cleanComment(c = {}) {
  return { artifactKey: str(c.artifactKey, 60), quote: str(c.quote, 1000), body: str(c.body, 4000), severity: c.severity === 'must' ? 'must' : 'note',
    gateKey: c.gateKey ? str(c.gateKey, 60) : null, round: Number.isInteger(c.round) ? c.round : null, author: c.author === 'local' ? 'local' : 'rețea' };
}
