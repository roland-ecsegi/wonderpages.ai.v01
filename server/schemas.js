/**
 * Contracte de ieșire (plan 1.3). Fiecare prompt din blueprint poate avea o schemă JSON în `blueprint.schemas[promptKey]`.
 * - Când versiunea de Claude Code are `--json-schema`, schema e trimisă și răspunsul vine deja validat.
 * - Oricum ar fi, răspunsul e verificat și aici (validator mic, fără dependențe); o abatere cere o singură corectură.
 * Valorile de tip "{{structure.pages}}" din schemă se înlocuiesc cu numărul real (ex. minItems = maxItems = 12).
 */
const getPath = (o, p) => String(p).split('.').reduce((x, k) => (x == null ? undefined : x[k]), o);
function resolve(node, ctx) {
  if (Array.isArray(node)) return node.map(x => resolve(x, ctx));
  if (node && typeof node === 'object') { const out = {}; for (const [k, v] of Object.entries(node)) { const r = resolve(v, ctx); if (r !== undefined) out[k] = r; } return out; }
  if (typeof node === 'string') { const m = node.match(/^\{\{\s*([^}]+?)\s*\}\}$/); if (m) { const v = Number(getPath(ctx, m[1])); return Number.isFinite(v) && v > 0 ? v : undefined; } }
  return node;
}
export function schemaFor(bp, promptKey, ctx = {}) {
  const s = bp?.schemas?.[promptKey]; if (!s) return null;
  return resolve(typeof s === 'string' ? bp.schemas[s] : s, ctx);   // a string points to another prompt's schema (e.g. script_b -> script)
}
const typeOf = v => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
const fits = (v, t) => t === typeOf(v) || (t === 'number' && typeof v === 'number') || (t === 'integer' && typeof v === 'number' && Number.isInteger(v));
/* returns null when valid, otherwise a short English description of the first problem (it goes back to the model) */
export function validateSchema(v, s, at = 'reply') {
  if (!s || typeof s !== 'object') return null;
  if (s.anyOf && !s.anyOf.some(option => !validateSchema(v, option, at))) return at + ' must match one of the allowed page types';
  if (s.type) { const ts = Array.isArray(s.type) ? s.type : [s.type]; if (!ts.some(t => fits(v, t))) return `${at} must be ${ts.join(' or ')}`; }
  if (s.enum && !s.enum.includes(v)) return `${at} must be one of ${s.enum.join(', ')}`;
  if (typeof v === 'number') { if (s.minimum != null && v < s.minimum) return `${at} must be >= ${s.minimum}`; if (s.maximum != null && v > s.maximum) return `${at} must be <= ${s.maximum}`; }
  if (typeof v === 'string' && s.minLength != null && v.trim().length < s.minLength) return `${at} must not be empty`;
  if (Array.isArray(v)) {
    if (s.minItems != null && v.length < s.minItems) return `${at} has ${v.length} items but needs ${s.maxItems === s.minItems ? 'exactly' : 'at least'} ${s.minItems}`;
    if (s.maxItems != null && v.length > s.maxItems) return `${at} has ${v.length} items but must have ${s.maxItems === s.minItems ? 'exactly' : 'at most'} ${s.maxItems}`;
    if (s.items) for (let i = 0; i < v.length; i++) { const e = validateSchema(v[i], s.items, `${at}[${i}]`); if (e) return e; }
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const r of s.required || []) if (v[r] == null) return `${at}.${r} is missing`;
    for (const [k, sub] of Object.entries(s.properties || {})) if (v[k] != null) { const e = validateSchema(v[k], sub, `${at}.${k}`); if (e) return e; }
  }
  return null;
}
