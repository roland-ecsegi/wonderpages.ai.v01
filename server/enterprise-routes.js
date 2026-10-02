/**
 * Enterprise API routes (P2+), registered on the existing tiny router. Each route states its task.
 * ctx: { on, json, need, localOnly, repo, storage, commandIdOf }
 */
import { buildGraph, impactOf, textArtifactChanges, canonChanges } from './domain/dependencies.js';
import { canonRevision, canonConflicts, projections, proposeCanonChange, AUTHORITY } from './domain/canon.js';
import { uid, now } from './repo.js';

export function impactForWrite(bp, art, key, nextContent) {
  const prev = art[key]?.content;
  let changes = [];
  if (/^(script|final|tr)_\d+$/.test(key)) changes = textArtifactChanges(key, prev, nextContent);
  else if (key === 'bible') changes = canonChanges(prev, nextContent);
  else if (/^ill_\d+_\d+$/.test(key)) { const [, v, p] = key.split('_'); const colorChanged = JSON.stringify(prev?.color) !== JSON.stringify(nextContent?.color), lineChanged = JSON.stringify(prev?.lineart) !== JSON.stringify(nextContent?.lineart); if (colorChanged) changes.push({ node: `color:${v}:${p}`, kind: 'color_only' }); else if (lineChanged) changes.push({ node: `line:${v}:${p}`, kind: 'line_only' }); }
  else if (key === 'series') changes = [{ node: 'canon:bible', kind: 'canon_release' }];
  return impactOf(buildGraph(bp, art), changes, bp);
}

export function registerEnterpriseRoutes({ on, json, need, localOnly, repo }) {
  /* P2-T02: canon authority, projections and conflicts (read-only) */
  on('GET', '/api/projects/:pid/canon', async ({ pid }) => {
    need(pid); const bp = await repo.getBlueprint(pid), art = await repo.artifacts(pid), p = repo.getProject(pid);
    return { authority: AUTHORITY, revision: canonRevision(art), projections: projections(art), conflicts: canonConflicts(bp, art, p.canonFindings || []), proposals: (p.canonProposals || []).map(x => ({ ...x, impact: { stale: x.impact.stale.length, revalidate: x.impact.revalidate.length } })) };
  });
  /* P2-T02: impact preview before committing an edit (nothing is written) */
  on('POST', '/api/projects/:pid/impact', async ({ pid }, req) => {
    need(pid); const b = await json(req); if (!/^[a-z0-9_]{1,40}$/i.test(String(b.key || ''))) throw { status: 400, message: 'Document invalid.' };
    const bp = await repo.getBlueprint(pid), art = await repo.artifacts(pid);
    return { key: b.key, ...impactForWrite(bp, art, b.key, b.content) };
  });
  /* P2-T02: a canon change is a proposal bound to the current canon hash; applying it is a decision (P2-T04) */
  on('POST', '/api/projects/:pid/canon/proposals', async ({ pid }, req) => {
    localOnly(req); const p = need(pid), b = await json(req); if (!b.bible || typeof b.bible !== 'object') throw { status: 400, message: 'Lipsește canonul propus.' };
    const bp = await repo.getBlueprint(pid), art = await repo.artifacts(pid);
    const prop = { id: uid('cp'), ...proposeCanonChange(bp, art, b.bible, { actor: 'operator', reason: String(b.reason || '').slice(0, 1000) }), bible: b.bible, at: now() };
    await repo.patchProject(pid, { canonProposals: [...(p.canonProposals || []).filter(x => x.status === 'pending').slice(-19), prop] });
    return prop;
  });
}
