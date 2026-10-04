/**
 * P3-T03 — durable jobs with leases and fencing (OUTPUT-19/21, ADR06).
 *
 * Job lifecycle: pending → leased → executing → checking → committed; side states waiting_provider, waiting_review,
 * paused, cancelled, failed, ambiguous. Every state change is a durable commit. A lease carries a monotonically
 * increasing fencing token; result writes present the token as a precondition evaluated inside the same commit,
 * so an expired or superseded worker can never write. At startup, leases of a previous process are reconciled:
 * nothing external is replayed blindly — a unit interrupted after an external call is `ambiguous`, a unit with a
 * staged output resumes at its check, a unit that never started returns to pending. Exactly-once with external
 * providers is NOT promised; local commits are idempotent.
 */
import crypto from 'node:crypto';
import { canonicalHash } from '../domain/canonical.js';

export const JOB_SCHEMA = 'wonderpages.job/1';
export const INSTANCE = `i${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
export const ACTIVE = Object.freeze(['leased', 'executing', 'checking']);
export const safeKey = k => String(k).replace(/[^A-Za-z0-9_.-]/g, m => (m === '@' ? '~' : m === '#' ? '__' : '_')).slice(0, 120);

export class Scheduler {
  constructor(storage, { owner = INSTANCE, now = () => Date.now(), ttlMs = 120000 } = {}) { this.s = storage; this.owner = owner; this.now = now; this.ttl = ttlMs; this.locks = new Map(); }
  rel(pid, key) { return `projects/${pid}/jobs/${safeKey(key)}.json`; }
  lock(k, fn) { const prev = this.locks.get(k) || Promise.resolve(); const run = prev.catch(() => {}).then(fn); this.locks.set(k, run.catch(() => {})); return run; }
  async get(pid, key) { return this.s.readJSON(this.rel(pid, key), null); }
  async write(pid, job, preconditions = []) { await this.s.commitBatch({ projectId: null, ops: [{ rel: this.rel(pid, job.key), obj: { ...job, updatedAt: this.now() } }], preconditions }); return job; }
  live(job) { return !!(job && ACTIVE.includes(job.status) && job.lease && job.lease.expiresAt > this.now()); }

  /** Lease a unit. A committed unit with the same inputs is reused (never re-executed); a live foreign lease refuses. */
  acquire(pid, key, { inputsHash = null, label = '', owner = this.owner, kind = 'unit', reuseIf = null, meta = null } = {}) {
    return this.lock(pid + '/' + key, async () => {
      const prev = await this.get(pid, key);
      if (prev?.status === 'committed' && (reuseIf ? reuseIf(prev) : (inputsHash == null || prev.inputsHash === inputsHash))) { if (meta && prev.meta?.run !== meta.run) { const job = { ...prev, meta: { ...prev.meta, ...meta, reusedFromRun: prev.meta?.run ?? null } }; await this.write(pid, job); return { reused: true, job }; } return { reused: true, job: prev }; }   // P3-T06: a reused unit counts in the current run, marked as reused
      if (prev?.status === 'ambiguous') throw { status: 409, code: 'ambiguous_unit', message: `„${prev.label || key}” a fost întreruptă după un apel extern fără rezultat confirmat. Decide în Activitate: reia (posibil consum dublu) sau anulează.`, key };
      if (prev && this.live(prev) && prev.lease.owner !== owner) throw { status: 409, code: 'job_leased', message: `Unitatea „${label || key}” este deja în lucru.`, owner: prev.lease.owner };
      const token = (prev?.lease?.token || 0) + 1;
      const job = { schema: JOB_SCHEMA, key, pid, kind, label: label || prev?.label || key, meta: meta || prev?.meta || null, inputsHash, generation: prev && prev.inputsHash !== inputsHash ? (prev.generation || 1) + 1 : prev?.generation || 1, status: 'leased', lease: { owner, token, expiresAt: this.now() + this.ttl }, attempts: prev?.attempts || [], checkpoint: prev?.status === 'checking' && prev.inputsHash === inputsHash ? prev.checkpoint : null, result: null, createdAt: prev?.createdAt || this.now() };
      await this.write(pid, job); return { token, job };
    });
  }
  async transition(pid, key, token, mutate) {
    return this.lock(pid + '/' + key, async () => {
      const job = await this.get(pid, key), next = mutate(structuredClone(job));
      await this.write(pid, next, [{ rel: this.rel(pid, key), lease: { token, now: this.now() } }]); return next;
    });
  }
  start(pid, key, token) { return this.transition(pid, key, token, j => { j.status = 'executing'; j.attempts = [...j.attempts, { n: j.attempts.length + 1, owner: j.lease.owner, token, startedAt: this.now(), external: [], outcome: null }].slice(-50); return j; }); }
  heartbeat(pid, key, token) { return this.transition(pid, key, token, j => { j.lease.expiresAt = this.now() + this.ttl; return j; }); }
  /** Record that an external, billable/observable effect was requested (before the call). */
  markExternal(pid, key, token, info = {}) { return this.transition(pid, key, token, j => { const a = j.attempts[j.attempts.length - 1]; if (a) a.external.push({ at: this.now(), provider: info.provider || null, providerJobId: info.providerJobId || null }); return j; }); }
  /** Stage an output (already durable elsewhere, e.g. a candidate file) before checking it. */
  stageOutput(pid, key, token, ref) { return this.transition(pid, key, token, j => { j.status = 'checking'; j.checkpoint = { output: ref, stagedAt: this.now() }; return j; }); }
  /** Commit: the job becomes committed in the SAME commit as the result documents, only with a valid lease. */
  commit(pid, key, token, { result = null, ops = [], projectId = null, bumpRevision = false } = {}) {
    return this.lock(pid + '/' + key, async () => {
      const job = await this.get(pid, key);
      if (job?.status === 'committed') return { duplicate: true, job };
      const a = job.attempts[job.attempts.length - 1]; if (a) { a.outcome = 'committed'; a.endedAt = this.now(); }
      const next = { ...job, status: 'committed', result, lease: { ...job.lease, expiresAt: 0 }, committedAt: this.now(), updatedAt: this.now() };
      await this.s.commitBatch({ projectId, bumpRevision, ops: [...ops, { rel: this.rel(pid, key), obj: next }], preconditions: [{ rel: this.rel(pid, key), lease: { token, now: this.now() } }] });
      return { duplicate: false, job: next };
    });
  }
  release(pid, key, token, { status = 'paused', stopReason = '' } = {}) {
    return this.transition(pid, key, token, j => { const a = j.attempts[j.attempts.length - 1]; if (a && !a.outcome) { a.outcome = status; a.stopReason = stopReason; a.endedAt = this.now(); } j.status = status; j.stopReason = stopReason; j.lease = { ...j.lease, expiresAt: 0 }; return j; }).catch(e => { if (e?.code !== 'stale_lease') throw e; return null; });
  }
  /** Revoke any current lease (e.g. a stale prefetch) by bumping the token; the previous holder can no longer write. */
  takeover(pid, key, { owner = this.owner, reason = 'preluare' } = {}) {
    return this.lock(pid + '/' + key, async () => {
      const prev = await this.get(pid, key); if (!prev) return null;
      const token = (prev.lease?.token || 0) + 1;
      const next = { ...prev, status: 'pending', lease: { owner, token, expiresAt: 0 }, stopReason: reason, attempts: prev.attempts.map((a, i) => (i === prev.attempts.length - 1 && !a.outcome ? { ...a, outcome: 'revoked', endedAt: this.now() } : a)) };
      await this.write(pid, next); return next;
    });
  }
  /** Operator resolution of an ambiguous unit: retry (accepting possible double consumption) or cancel. */
  resolve(pid, key, action, actor = 'operator') {
    return this.lock(pid + '/' + key, async () => {
      const prev = await this.get(pid, key); if (!prev || prev.status !== 'ambiguous') throw { status: 409, message: 'Unitatea nu este în stare ambiguă.' };
      if (!['retry', 'cancel'].includes(action)) throw { status: 400, message: 'Acțiune necunoscută.' };
      const next = { ...prev, status: action === 'retry' ? 'pending' : 'cancelled', resolution: { action, actor, at: this.now(), warning: action === 'retry' ? 'posibil consum dublu acceptat de operator' : null } };
      await this.write(pid, next); return next;
    });
  }
  async list(pid) { const out = []; for (const f of (await this.s.list(`projects/${pid}/jobs`).catch(() => [])).filter(x => x.name.endsWith('.json'))) { const j = await this.s.readJSON(`projects/${pid}/jobs/${f.name}`, null); if (j) out.push(j); } return out.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); }

  /** Startup reconciliation: leases of another process instance (or expired) are dead; classify without replaying externals. */
  async reconcile(pid, { force = false } = {}) {   // P8-T02: force = after a restore, every restored lease is dead whatever its expiry
    const summary = { pending: [], ambiguous: [], resumeCheck: [], untouched: 0 };
    for (const j of await this.list(pid)) {
      const dead = ACTIVE.includes(j.status) && (force || !j.lease || j.lease.expiresAt <= this.now() || String(j.lease.owner).split(':')[0] !== String(this.owner).split(':')[0]);
      if (!dead) { summary.untouched++; continue; }
      const a = j.attempts[j.attempts.length - 1], external = (a?.external || []).length > 0;
      let status, reason;
      if (j.status === 'checking' && j.checkpoint?.output) { status = 'checking'; reason = 'ieșire salvată înainte de oprire: se reia verificarea, fără apel nou'; summary.resumeCheck.push(j.key); }
      else if (j.status === 'executing' && external) { status = 'ambiguous'; reason = 'oprit după un apel extern fără rezultat confirmat: necesită reconciliere (nu se reia automat)'; summary.ambiguous.push(j.key); }
      else { status = 'pending'; reason = 'oprit înainte de efecte externe: se poate relua'; summary.pending.push(j.key); }
      if (a && !a.outcome) { a.outcome = 'interrupted'; a.endedAt = this.now(); a.stopReason = reason; }
      await this.write(pid, { ...j, status, stopReason: reason, lease: { ...(j.lease || {}), expiresAt: 0, token: (j.lease?.token || 0) + 1 }, reconciledAt: this.now() });
    }
    return summary;
  }
}
/** Inputs hash of a stage unit: its definition, the project input and the versions of every artifact present before it. */
export function unitInputsHash({ stage, project, artifacts, blueprintVersion, extra = null }) {
  const { label, activity, ...def } = stage || {};
  return canonicalHash({ def, input: project?.input ?? null, run: project?.run || 1, notes: project?.notes || [], rejections: project?.rejections || [], bp: blueprintVersion ?? null, upstream: Object.fromEntries(Object.entries(artifacts || {}).map(([k, a]) => [k, a?.version ?? null]).sort()), extra });
}
