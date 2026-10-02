/** P3-T03 — preconditions evaluated INSIDE a commit (lock / transaction): fencing tokens, expected document state. */
export function checkPreconditions(pcs, read) {
  return Promise.all((pcs || []).map(async pc => {
    const doc = await read(pc.rel);
    if (pc.lease) {
      const l = doc?.lease;
      if (!doc || !l || l.token !== pc.lease.token || !(l.expiresAt > (pc.lease.now ?? Date.now())) || !['leased', 'executing', 'checking'].includes(doc.status))
        throw { status: 409, code: 'stale_lease', message: 'Lucrătorul nu mai deține sarcina (lease expirat sau preluat); rezultatul nu se scrie.', job: pc.rel, expected: pc.lease.token, current: l?.token ?? null };
    }
    if (pc.exists === false && doc) throw { status: 409, code: 'precondition_failed', message: `Documentul există deja: ${pc.rel}` };
  }));
}
