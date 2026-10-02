/**
 * Canonical JSON (OUTPUT-05): object keys are sorted recursively and `undefined` is dropped, so the
 * fingerprint of a value does not depend on key order. Arrays keep their order (it is meaningful).
 */
import crypto from 'node:crypto';

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(v => (v === undefined ? null : canonicalize(v)));
  if (value && typeof value === 'object') {
    if (value instanceof Date) return value.toISOString();
    const out = {};
    for (const k of Object.keys(value).sort()) if (value[k] !== undefined && typeof value[k] !== 'function') out[k] = canonicalize(value[k]);
    return out;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) return null;
  return value;
}
export const canonicalJSON = value => JSON.stringify(canonicalize(value ?? null));
export const canonicalHash = value => crypto.createHash('sha256').update(canonicalJSON(value)).digest('hex');
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
