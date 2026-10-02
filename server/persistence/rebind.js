/** P2-T03 — after a restore, dependents whose scene fingerprint still matches are re-bound to the new version; others stay stale. */
import { sceneFingerprint } from '../contracts.js';
import { pageData } from '../engine.js';
export async function rebindDependents(repo, pid, key, doc) {
  const art = await repo.artifacts(pid), out = [];
  for (const [k, a] of Object.entries(art)) {
    if (a?.basedOn?.key !== key || !a.basedOn.pageHash) continue;
    const page = Number(k.split('_')[2]);
    if (sceneFingerprint(pageData(doc.content, page)) === a.basedOn.pageHash) { await repo.patchArtifact(pid, k, { basedOn: { version: doc.version } }); out.push({ key: k, status: 'rebound' }); }
    else out.push({ key: k, status: 'stale' });
  }
  return out;
}
