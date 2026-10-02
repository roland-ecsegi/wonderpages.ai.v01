/**
 * P1-T05 — raw project hash comparator. Compares two project documents (v1 export / imported / migrated)
 * section by section with canonical hashes so that "preserved" claims are evidence, not assumptions.
 */
import { canonicalHash } from '../domain/canonical.js';

export function rawFingerprints(doc) {
  const A = doc?.artifacts || {};
  return {
    input: canonicalHash(doc?.project?.input ?? null),
    refs: canonicalHash((doc?.project?.refs || []).map(r => ({ file: r.file, mime: r.mime }))),
    blueprint: canonicalHash(doc?.blueprint ?? null),
    prompts: canonicalHash(doc?.blueprint?.prompts ?? null),
    artifacts: Object.fromEntries(Object.keys(A).sort().map(k => [k, canonicalHash(A[k]?.content ?? null)]))
  };
}
export function compareRaw(before, after, files = {}) {
  const a = rawFingerprints(before), b = rawFingerprints(after);
  const sections = ['input', 'refs', 'blueprint', 'prompts'].map(k => ({ section: k, same: a[k] === b[k], before: a[k], after: b[k] }));
  const keys = [...new Set([...Object.keys(a.artifacts), ...Object.keys(b.artifacts)])].sort();
  const artifacts = keys.map(k => ({ key: k, status: !(k in b.artifacts) ? 'missing_after' : !(k in a.artifacts) ? 'new' : a.artifacts[k] === b.artifacts[k] ? 'identical' : 'changed' }));
  const fileRows = Object.keys({ ...(files.before || {}), ...(files.after || {}) }).sort().map(f => ({ file: f, status: !files.after?.[f] ? 'missing_after' : !files.before?.[f] ? 'new' : files.before[f] === files.after[f] ? 'identical' : 'changed' }));
  const lost = artifacts.filter(x => x.status === 'missing_after').length + fileRows.filter(x => x.status === 'missing_after').length;
  return { sections, artifacts, files: fileRows, lost, preserved: lost === 0 };
}
