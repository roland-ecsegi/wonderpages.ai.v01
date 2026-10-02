/**
 * P3-T04 — one shared ExecutionBudget per unit of external work (OUTPUT-08 initial policies).
 * Limits: transport retries 2, JSON repair 1, creative revisions 2, automatic redraw 1, provider hop 1, and a global
 * deadline. The SAME budget travels through a provider fallback, so a recursive hop can never reset the wait clock
 * or bounce between providers; exhaustion becomes `waiting_provider`/operator, never an infinite loop.
 */
export const DEFAULT_LIMITS = Object.freeze({ transportRetry: 2, jsonRepair: 1, creativeRevision: 2, redraw: 1, providerHop: 1 });
export class ExecutionBudget {
  constructor({ deadlineMs = 30 * 60e3, limits = {}, now = () => Date.now() } = {}) { this.now = now; this.startedAt = now(); this.deadlineAt = this.startedAt + deadlineMs; this.limits = { ...DEFAULT_LIMITS, ...limits }; this.used = Object.fromEntries(Object.keys(this.limits).map(k => [k, 0])); this.log = []; }
  remainingMs() { return Math.max(0, this.deadlineAt - this.now()); }
  expired() { return this.now() >= this.deadlineAt; }
  can(kind) { return (this.used[kind] || 0) < (this.limits[kind] ?? 0); }
  consume(kind, note = '') {
    if (!(kind in this.limits)) throw Error('budget kind necunoscut: ' + kind);
    if (!this.can(kind)) throw { code: 'budget_exhausted', kind, message: `Bugetul comun de execuție este epuizat (${kind}: ${this.used[kind]}/${this.limits[kind]}).` };
    this.used[kind]++; this.log.push({ kind, note, at: this.now() }); return this.used[kind];
  }
  /** A wait that would cross the global deadline is converted into a durable `waiting_provider`, not slept through. */
  assertCanWaitUntil(until, provider) { if (until > this.deadlineAt) throw { code: 'rate_limited', provider, resetAt: until, budget: this.snapshot(), message: 'Furnizorul cere o pauză mai lungă decât termenul unității; proiectul așteaptă și reia singur mai târziu.' }; }
  snapshot() { return { startedAt: this.startedAt, deadlineAt: this.deadlineAt, used: { ...this.used }, limits: { ...this.limits } }; }
}
