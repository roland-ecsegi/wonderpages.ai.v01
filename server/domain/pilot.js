/**
 * P4-T05 — demo → full pilot → bulk (OUTPUT-28 step 3, RK08 ADAPT).
 * Volume 1 is the pilot: its demo gate (sample pages) and its final gate (the complete pilot book) must be decided
 * by the operator before any generation for volumes 2–N starts — including speculative prefetch. Imported gate
 * states never count (no auto-approve of imported work). A type can opt out with `pilot: false` (no volume flow).
 */
export function pilotState(bp, project) {
  if (!project?.volumeFlow || bp?.pilot === false) return { policy: 'none', pilotApproved: true, demoApproved: true, blockedVolumes: [] };
  const vol = Math.max(0, Number(bp?.pilot?.volume || 1) - 1);
  const gates = (project.stagePlan || []).filter(s => s.gate && s.vol === vol);
  const decided = s => !!s && project.stages?.[s.key]?.status === 'done' && !project.stages[s.key].imported;
  const demo = gates[0] || null, pilot = gates[gates.length - 1] || null;
  const demoApproved = decided(demo), pilotApproved = decided(pilot);
  const V = (project.stagePlan || []).reduce((m, s) => Math.max(m, (s.vol ?? -1) + 1), 0);
  return { policy: 'pilot', pilotVolume: vol + 1, demoGate: demo?.key || null, pilotGate: pilot?.key || null, demoApproved, pilotApproved, blockedVolumes: pilotApproved ? [] : Array.from({ length: Math.max(0, V - vol - 1) }, (_, i) => vol + 2 + i), message: pilotApproved ? null : `Volumele ${vol + 2}–${V} sunt blocate până aprobi pilotul (volumul ${vol + 1}: ${demoApproved ? 'demo aprobat, cartea completă așteaptă aprobarea' : 'întâi demo-ul, apoi cartea completă'}).` };
}
/** May generation run for this (expanded) stage now? Gates are never blocked (they only wait for you). */
export function generationAllowed(bp, project, stage) {
  if (!stage || stage.handler === 'review_gate' || stage.vol == null) return { allowed: true };
  const ps = pilotState(bp, project);
  return stage.vol >= (ps.pilotVolume || 1) && !ps.pilotApproved ? { allowed: false, code: 'pilot_required', message: ps.message, state: ps } : { allowed: true };
}
