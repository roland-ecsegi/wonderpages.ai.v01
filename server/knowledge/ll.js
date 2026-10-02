/**
 * P7-T01 — the historical lessons-learned registry (LL-001…) ingested as a SOURCE: every entry is a history candidate,
 * scanned like any import (LL-013 collides with the reconciled Dinosaur World p9 and is quarantined). The raw file stays.
 */
import crypto from 'node:crypto';
import * as K from './store.js';

export function parseLessonsRegistry(md) {
  return [...md.matchAll(/^## (LL-\d{3}) — (.+)$/gm)].map(m => {
    const block = md.slice(m.index + m[0].length).split(/\n## LL-/)[0] || '';
    const field = re => (block.match(re) || [])[1] || null, section = name => (block.match(new RegExp(`${name}\\s*\\n+([^\\n]+)`)) || [])[1]?.trim() || '';
    return { id: m[1], title: m[2].trim(), scope: field(/\*\*Scope\*\* \| ([A-Z_]+)/), status: field(/\*\*Status\*\* \| ([A-Z_]+)/), problem: section('Problem / mistake') };
  });
}
export async function ingestLessonsRegistry(md, { file = 'docs/LESSONS-LEARNED.md' } = {}) {
  const sha256 = crypto.createHash('sha256').update(md).digest('hex');
  const same = K.listSources().find(s => s.kind === 'll_registry' && s.status === 'active' && s.sha256 === sha256);
  if (same) return { source: same, candidates: K.listCandidates({ sourceId: same.id }), reused: true };
  const entries = parseLessonsRegistry(md);
  const source = await K.registerSource({ kind: 'll_registry', ref: file, label: 'Registrul lecțiilor (istoric)', sha256, files: [file], rights: { status: 'cleared', reasons: [], note: 'Document intern al editorului.' }, meta: { entries: entries.length } });
  const candidates = await K.addCandidates(source.id, entries.map(e => ({ type: 'lesson_history', text: `${e.id} — ${e.title}: ${e.problem}`, ref: e.id, scope: e.scope === 'PAGE' ? 'project' : 'project', evidence: { file, quote: e.problem.slice(0, 200) } })), { sourceFiles: { [file]: md } });
  return { source, candidates, reused: false };
}
