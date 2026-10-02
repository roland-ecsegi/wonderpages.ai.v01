/**
 * P3-T06 — durable change-event stream with cursor replay (OUTPUT-22, RK17 SURPASS).
 * Every `change` event receives a monotonically increasing sequence id that survives a host restart (persisted
 * ring of the last events + the counter). An SSE client reconnecting with `Last-Event-ID` gets exactly the events it
 * missed, once; a cursor that is older than the ring or ahead of the host (events lost in a crash) gets an explicit
 * `reset` (full refetch) instead of a silent gap. Payloads are sanitized: scope/pid/kind only, never editorial content.
 */
const REL = '_events/stream.json';
const SAFE = ['scope', 'pid', 'kind', 'key', 'status', 'unit'];
export class EventStream {
  constructor(storage, { max = 500, debounceMs = 250 } = {}) { this.s = storage; this.max = max; this.debounceMs = debounceMs; this.seq = 0; this.ring = []; this.t = null; this.dirty = false; this.purged = new Set(); }
  async init() { const d = await this.s?.readJSON?.(REL, null).catch?.(() => null); if (d && Number.isInteger(d.seq)) { this.seq = d.seq; this.ring = Array.isArray(d.ring) ? d.ring.slice(-this.max) : []; } this.bootSeq = this.seq; return this; }
  sanitize(ev) { const out = {}; for (const k of SAFE) if (ev?.[k] != null && ['string', 'number', 'boolean'].includes(typeof ev[k])) out[k] = typeof ev[k] === 'string' ? ev[k].slice(0, 80) : ev[k]; return out; }
  append(ev) {
    const clean = this.sanitize(ev); if (clean.pid && this.purged.has(clean.pid)) { delete clean.pid; clean.scope = 'projects'; }   // late events of a deleted project carry no id
    const e = { id: ++this.seq, at: Date.now(), ...clean };
    this.ring.push(e); if (this.ring.length > this.max) this.ring.splice(0, this.ring.length - this.max);
    this.schedule(); return e;
  }
  schedule() { this.dirty = true; if (this.t) return; this.t = setTimeout(() => { this.t = null; this.flush().catch(e => console.warn('[events]', e?.message || e)); }, this.debounceMs); this.t.unref?.(); }
  async flush() { if (!this.dirty || !this.s) return; this.dirty = false; await this.s.writeJSON(REL, { schema: 'wonderpages.event-stream/1', seq: this.seq, ring: this.ring }); }
  /** Permanent deletion: the project's id leaves the stream; ids stay contiguous (a neutral `projects` event remains). */
  async purgeProject(pid) { this.purged.add(pid); let n = 0; this.ring = this.ring.map(e => (e.pid === pid ? (n++, { id: e.id, at: e.at, scope: 'projects' }) : e)); if (n) { this.dirty = true; await this.flush(); } return n; }
  /** Events after `cursor`; `reset` when the cursor cannot be served exactly (too old, or ahead of this host). */
  since(cursor) {
    if (cursor == null || cursor === '') return { events: [], reset: false, head: this.seq };
    const c = Number(cursor);
    if (!Number.isInteger(c) || c < 0 || c > this.seq) return { events: [], reset: true, reason: 'cursor_ahead', head: this.seq };
    const oldest = this.ring.length ? this.ring[0].id : this.seq + 1;
    if (c < oldest - 1) return { events: [], reset: true, reason: 'cursor_expired', head: this.seq };
    return { events: this.ring.filter(e => e.id > c), reset: false, head: this.seq };
  }
}
