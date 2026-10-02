/**
 * P3-T06 — truthful progress and inspectability (OUTPUT-22). Progress is computed from durable work units of the
 * CURRENT run (a total replanning does not inherit old "done" counts), never from optimistic stage counters alone.
 * An estimate is shown only when it is measured (≥ MIN_SAMPLES committed units of the running stage) and is scoped
 * to that stage; provider waits and human decisions are never folded into an ETA. Unknown quota stays "unknown".
 */
export const MIN_SAMPLES = 3;
const DURABLE = ['committed', 'skipped', 'executing', 'leased', 'checking', 'waiting_provider', 'ambiguous', 'failed', 'cancelled', 'paused', 'pending'];
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const lastAttempt = j => j.attempts?.[j.attempts.length - 1] || null;
const unitMs = j => { const a = lastAttempt(j); return a?.startedAt && a?.endedAt && a.outcome === 'committed' ? a.endedAt - a.startedAt : null; };

export function progressReport({ project: p, stages, jobs, ledgerRows = [], capabilities = null, now = Date.now() }) {
  const run = p.run || 1;
  const current = jobs.filter(j => j.meta?.run === run), superseded = jobs.filter(j => j.meta && j.meta.run !== run).length, unattributed = jobs.filter(j => !j.meta).length;
  const count = list => { const c = Object.fromEntries(DURABLE.map(k => [k, 0])); c.reused = 0; for (const j of list) { c[j.status] = (c[j.status] || 0) + 1; if (j.meta?.reusedFromRun != null) c.reused++; } c.total = list.length; return c; };
  const units = { ...count(current), superseded, unattributed };
  const plan = stages.filter(s => s.handler !== 'review_gate' || true).map((s, i) => {
    const st = p.stages?.[s.key] || {}, own = current.filter(j => j.meta?.stage === s.key);
    const items = own.filter(j => j.kind === 'item');
    return { key: s.key, label: s.label, gate: s.handler === 'review_gate', index: i, status: st.status || (i < (p.stageIndex || 0) ? 'done' : 'pending'), imported: !!st.imported, manual: !!st.manual,
      units: { committed: own.filter(j => j.status === 'committed').length, skipped: own.filter(j => j.status === 'skipped').length, failed: own.filter(j => j.status === 'failed').length, waiting: own.filter(j => j.status === 'waiting_provider').length, ambiguous: own.filter(j => j.status === 'ambiguous').length, items: items.length, itemsCommitted: items.filter(j => j.status === 'committed').length },
      items: st.total > 1 ? { done: st.done || 0, total: st.total } : null, stopReason: st.error || null };
  });
  const waiting = [];
  if (p.status === 'awaiting_review' && p.gate) waiting.push({ kind: 'human', cause: 'Decizia ta la revizuire', key: p.gate.key });
  if (p.status === 'waiting_limit') waiting.push({ kind: 'provider', cause: 'Limita abonamentului atinsă', resetAt: p.resumeAt || null });
  for (const j of current.filter(j => j.status === 'waiting_provider')) waiting.push({ kind: 'provider', cause: j.stopReason || 'Furnizorul cere o pauză', key: j.key, label: j.label });
  for (const j of current.filter(j => j.status === 'ambiguous')) waiting.push({ kind: 'operator', cause: 'Unitate întreruptă după un apel extern: decide reluarea sau anularea', key: j.key, label: j.label });
  const failed = current.filter(j => j.status === 'failed').map(j => ({ key: j.key, label: j.label, stopReason: j.stopReason || null }));
  /* consumption: measured where the provider reported it; otherwise explicitly unknown */
  const rows = ledgerRows.filter(r => r.pid === p.id && (r.t || 0) >= (p.createdAt || 0)), text = rows.filter(r => r.kind === 'text'), img = rows.filter(r => r.kind === 'image');
  const measured = text.filter(r => Number.isFinite(r.inTok) || Number.isFinite(r.outTok));
  const quota = Object.fromEntries(Object.entries(capabilities?.channels || {}).filter(([k]) => k !== 'operator-exchange').map(([k, s]) => [k, s.quota?.status || 'unknown']));
  const consumption = { textCalls: text.length, textErrors: text.filter(r => !r.ok).length, imageCalls: img.length, imageErrors: img.filter(r => !r.ok).length, tokens: measured.length ? { measuredCalls: measured.length, unmeasuredCalls: text.length - measured.length, input: measured.reduce((a, r) => a + (r.inTok || 0), 0), output: measured.reduce((a, r) => a + (r.outTok || 0), 0) } : { measuredCalls: 0, unmeasuredCalls: text.length, input: null, output: null, note: 'necunoscut: furnizorul nu a raportat consumul' }, quota };
  /* estimate: only measured, only for the running stage */
  let estimate = { value: null, reason: 'Fără estimare: nu rulează nicio etapă cu elemente măsurabile.' };
  const curKey = p.currentStage, cur = p.stages?.[curKey];
  if (curKey && cur?.status === 'running' && cur.total > 1) {
    const samples = current.filter(j => j.meta?.stage === curKey && j.kind === 'item' && j.status === 'committed' && j.meta?.reusedFromRun == null).map(unitMs).filter(x => x != null && x >= 0);
    const remaining = Math.max(0, cur.total - (cur.done || 0));
    estimate = samples.length >= MIN_SAMPLES && remaining > 0
      ? { value: Math.round(median(samples) * remaining), basis: `mediana a ${samples.length} unități măsurate în etapa curentă`, scope: 'etapa curentă', remaining, excludes: 'așteptările la furnizor și deciziile tale' }
      : { value: null, reason: `Fără estimare: ${samples.length} din minimum ${MIN_SAMPLES} unități măsurate în etapa curentă.`, remaining };
  }
  const lastStop = [...jobs].filter(j => j.stopReason && j.meta?.run === run).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
  return { schema: 'wonderpages.progress/1', pid: p.id, run, status: p.status, at: now, stage: { current: curKey || null, index: p.stageIndex || 0, total: stages.length }, units, stages: plan, waiting, failed, stopReason: p.error || lastStop?.stopReason || null, consumption, estimate };
}

/** Inspector: link the EFFECTIVE output (artifact version) to the unit that committed it, its attempts, context and usage. */
export function inspectArtifact({ key, art, jobs, ledgerRows = [], decisions = [], projectDecisions = [], manifest = null, pid }) {
  if (!art) return null;
  const producer = jobs.filter(j => j.status === 'committed' && j.result?.versions?.[key] === art.version).sort((a, b) => (a.kind === 'item' ? -1 : 1) - (b.kind === 'item' ? -1 : 1))[0] || null;
  const prov = art.meta?.prov || null;
  const approvals = projectDecisions.filter(d => d.approvedVersions && d.approvedVersions[key] != null).map(d => ({ at: d.at, gate: d.gate || d.key || null, decision: d.decision || null, approvedVersion: d.approvedVersions[key], current: d.approvedVersions[key] === art.version }));
  return {
    schema: 'wonderpages.inspect/1', pid, key, version: art.version, hash: art.hash || null, by: art.by || null, updatedAt: art.updatedAt || null, stage: art.stage || null, basedOn: art.basedOn || null,
    provenance: prov ? { channel: prov.channel || 'automatic', agent: prov.agent || null, model: prov.model || null, modelSource: prov.modelSource || null, prompt: prov.prompt || null, lessons: prov.lessons || [], blueprint: prov.blueprint ?? null, context: prov.context || null, packetId: prov.packetId || null, actor: prov.actor || null, at: prov.at || null } : null,
    context: manifest ? { manifestHash: manifest.manifestHash, agentId: manifest.agentId, charterVersion: manifest.charterVersion || null, roleVersion: manifest.roleVersion || null, policyHash: manifest.policyHash || null, model: manifest.model, scope: manifest.scope, lessons: (manifest.layers?.experience?.included || []).map(x => x.id), excludedLessons: (manifest.layers?.experience?.excluded || []).length, systemHash: manifest.systemHash || null, promptHash: manifest.promptHash || null } : null,
    unit: producer ? { key: producer.key, label: producer.label, kind: producer.kind, run: producer.meta?.run ?? null, reusedFromRun: producer.meta?.reusedFromRun ?? null, committedAt: producer.committedAt || null, outputs: producer.result?.outputs || [], attempts: (producer.attempts || []).map(a => ({ n: a.n, startedAt: a.startedAt, endedAt: a.endedAt || null, outcome: a.outcome, stopReason: a.stopReason || null, external: (a.external || []).map(x => ({ provider: x.provider, providerJobId: x.providerJobId, at: x.at })) })) } : null,
    usage: producer ? ledgerRows.filter(r => r.pid === pid && r.unit === producer.key).map(r => ({ t: r.t, kind: r.kind, agent: r.agent || null, model: r.model || r.engine || null, ok: r.ok, ms: r.ms, inTok: r.inTok ?? null, outTok: r.outTok ?? null })) : [],
    versions: [{ version: art.version, by: art.by, at: art.updatedAt, note: art.note || null }, ...(art.versions || []).map(v => ({ version: v.version, by: v.by, at: v.at, note: v.note || null }))],
    approvals, decisions: decisions.filter(d => JSON.stringify(d.subject || {}).includes(`"${key}"`) || JSON.stringify(d.scope || {}).includes(`"${key}"`)).map(d => ({ id: d.id, kind: d.kind, state: d.state, at: d.at, actor: d.actor })),
    note: producer ? null : prov?.channel === 'operator-exchange' ? 'Rezultat din schimbul manual (fără unitate automată).' : art.by === 'user' ? 'Editare manuală.' : 'Nicio unitate durabilă nu a produs această versiune (import, migrare sau versiune anterioară P3).'
  };
}
