/**
 * P8-T02 — the same normalization after a process stop and after a restore: nothing restarts by itself.
 * Running work becomes resumable (paused, or awaiting review when a gate is open); job leases are reconciled
 * (after a restore every restored lease is dead whatever its expiry: force); a unit stopped after an external call
 * without a confirmed result becomes "ambiguous" and is never replayed blindly. Approvals and decisions restored from
 * the snapshot stay as they were recorded — a restore never grants or removes an approval.
 */
const now = () => Date.now();
export async function normalizeAfterStop(repo, jobs, { reason = 'Serverul a fost repornit. Reia de unde a rămas.', force = false, logPrefix = '' } = {}) {
  const paused = [], reconciled = {};
  for (const p of repo.listProjects()) if (['running', 'correcting'].includes(p.status)) { await repo.patchProject(p.id, { status: p.gate ? 'awaiting_review' : 'paused', error: reason }); paused.push(p.id); }
  for (const p of repo.listProjects()) {
    const r = await jobs?.reconcile(p.id, { force }).catch(e => ({ error: e.message }));
    if (r && (r.pending?.length || r.ambiguous?.length || r.resumeCheck?.length)) {
      reconciled[p.id] = r;
      if (r.ambiguous?.length) { const cur = repo.getProject(p.id); await repo.patchProject(p.id, { log: [...(cur.log || []), { t: now(), text: `${logPrefix}${r.ambiguous.length} unități au fost întrerupte după un apel extern fără rezultat confirmat; decide în Activitate dacă le reiei.`, kind: 'warn' }].slice(-120) }); }
    }
  }
  return { paused, reconciled, autoStarted: 0 };
}
