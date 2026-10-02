/**
 * P5-T06 — repair verification and selective planner (OUTPUT-13 repair, RK13/14 SURPASS).
 * An IssueList (the operator's per-item decisions at a gate) becomes a bounded PagePatch plan:
 *  - each patch names its exact target (artifact, page, mode) and operation: exact replacement (local, no AI),
 *    semantic page rewrite, color redraw, line-only redraw, document correction;
 *  - its dependents are invalidated explicitly (a new color makes the coloring page stale; a rewritten scene makes
 *    the page art and the native page stale; an exact typo only asks to revalidate the native page);
 *  - at most 2 creative attempts per item, then the item goes to the operator with the exact calls and hashes;
 *  - after execution nothing outside the targets may change (siblings stay byte-identical);
 *  - an issue is resolved only by a full CURRENT recheck; later counter-evidence reopens it (status is recomputed).
 */
import { canonicalHash } from '../domain/canonical.js';
import { parseExactCorrection } from '../contracts.js';

export const MAX_CREATIVE_ATTEMPTS = 2;
const h = x => canonicalHash(x ?? null).slice(0, 16);

export function classify(item, approval = {}) {
  if (item.kind === 'text') return approval.correction || parseExactCorrection(item.note) ? 'exact' : 'semantic';
  if (item.kind === 'image') return item.mode === 'line' ? 'line' : 'color';
  return item.kind === 'doc' || item.kind === 'ref' ? 'document' : 'other';
}
const unitsOf = (op, it) => {
  const v = it.v, p = it.p;
  if (op === 'exact' || op === 'semantic') { const lang = it.key?.startsWith('tr_') ? 'tr' : 'text'; return { target: [`${it.key}#p${p}`], invalidates: op === 'semantic' && lang === 'text' ? [`ill_${v}_${p}:color`, `ill_${v}_${p}:line`, `tr_${v}#p${p}`] : lang === 'text' ? [`tr_${v}#p${p}`] : [], recheck: op === 'semantic' ? ['story_contract', 'critic', 'safety'] : ['safety', 'native_alignment'] }; }
  if (op === 'color') return { target: [`ill_${v}_${p}:color`], invalidates: [`ill_${v}_${p}:line`], recheck: ['visual_qa_all_dimensions', 'safety', 'line_qa'] };
  if (op === 'line') return { target: [`ill_${v}_${p}:line`], invalidates: [], recheck: ['line_qa'] };
  return { target: [it.key], invalidates: ['dependents (graful canonului)'], recheck: ['canon', 'collection_matrix'] };
};
export function planRepairs({ items, approvals = {}, attempts = {} }) {
  const patches = [], needsOperator = [];
  for (const it of items.filter(i => ['changes', 'rejected', 'approved_note'].includes(i.state))) {
    const op = classify(it, approvals[it.id] || {}), creative = op !== 'exact', n = attempts[it.id]?.count || 0;
    const patch = { id: it.id, op, creative, attempt: creative ? n + 1 : null, ...unitsOf(op, it), request: String(it.note || '').slice(0, 300) };
    if (creative && n >= MAX_CREATIVE_ATTEMPTS) needsOperator.push({ ...patch, reason: `${n} încercări creative fără rezolvare: decizia operatorului (editare manuală, altă abordare sau acceptare cu motiv).`, history: attempts[it.id]?.history || [] });
    else patches.push(patch);
  }
  return { schema: 'wonderpages.repair-plan/1', bounded: true, maxCreativeAttempts: MAX_CREATIVE_ATTEMPTS, patches, needsOperator };
}

/** Unit hashes of a volume: every text page (script/final/native) and every image (color/line). */
export function unitHashes(art, v, pages = 12) {
  const out = {};
  for (const k of [`script_${v}`, `final_${v}`, `tr_${v}`]) for (const p of art[k]?.content?.pages || []) out[`${k}#p${p.n}`] = h({ text: p.text, scene: p.scene, actions: p.actions });
  for (let p = 0; p <= pages; p++) { const c = art[`ill_${v}_${p}`]?.content; if (!c) continue; out[`ill_${v}_${p}:color`] = h(c.color); if (c.lineart) out[`ill_${v}_${p}:line`] = h(c.lineart); }
  return out;
}
/** Nothing outside the targets (and their declared dependents) may change. */
export function verifyExecution(before, after, plan) {
  const allowed = new Set(plan.patches.flatMap(p => [...p.target, ...p.invalidates]));
  const changed = Object.keys({ ...before, ...after }).filter(k => before[k] !== after[k]);
  const unrequested = changed.filter(k => !allowed.has(k));
  return { changed, unrequested, ok: !unrequested.length };
}
/** Resolution from the CURRENT state (recomputed every time, so counter-evidence reopens a resolved issue). */
export function resolution(patch, art, { approval = {} } = {}) {
  const [key, rest] = patch.target[0].split(/[#:]/), page = Number((patch.target[0].match(/#p(\d+)/) || [])[1]);
  if (patch.op === 'exact') { const corr = approval.correction || parseExactCorrection(patch.request); const text = art[key]?.content?.pages?.[page - 1]?.text || ''; return corr && text.includes(corr.to) && (!corr.from || !text.includes(corr.from) || corr.to.includes(corr.from)) ? { status: 'resolved', evidence: 'înlocuirea exactă este în text' } : { status: 'open', evidence: 'înlocuirea nu se găsește în textul curent' }; }
  if (patch.op === 'color') { const c = art[key]?.content; const qa = c?.qa; if (!qa || qa.color !== c?.color) return { status: 'open', evidence: 'lipsește verificarea completă a imaginii curente' }; if (qa.ok !== true) return { status: 'open', evidence: 'recheck negativ: ' + (qa.failed || []).join(', ') }; return { status: 'resolved', evidence: 'QA complet (toate dimensiunile) pe imaginea curentă' }; }
  if (patch.op === 'line') { const c = art[key]?.content; if (!c?.lineart || c.lineFrom !== c.color) return { status: 'open', evidence: 'pagina de colorat lipsește sau nu provine din culoarea curentă' }; if (c.lineQA?.ok !== true || (c.lineQA.for && c.lineQA.for !== c.lineart)) return { status: 'open', evidence: 'verificarea liniei lipsește, este negativă sau este pentru alt fișier' }; return { status: 'resolved', evidence: 'linie verificată pe fișierul curent' }; }
  if (patch.op === 'semantic') { const pg = art[key]?.content?.pages?.[page - 1]; return pg ? { status: 'pending_review', evidence: 'pagina rescrisă; rezolvarea o confirmă recheck-ul (critic/contract) și aprobarea ta' } : { status: 'open', evidence: 'pagina lipsește' }; }
  return { status: 'pending_review', evidence: 'document corectat; dependenții se revalidează' };
}
/** Units still to produce for a migrated/legacy volume: only missing or failed ones (good text/refs untouched). */
export function missingUnits(art, v, { pages = 12, images = true } = {}) {
  const out = [];
  if (!art[`script_${v}`] && !art[`final_${v}`]) out.push({ unit: `script_${v}`, reason: 'manuscris lipsă' });
  if (images) for (let p = 0; p <= pages; p++) { const c = art[`ill_${v}_${p}`]?.content; if (!c?.color) out.push({ unit: `ill_${v}_${p}:color`, reason: 'ilustrație lipsă' }); else if (c.qa?.ok === false) out.push({ unit: `ill_${v}_${p}:color`, reason: 'QA negativ' }); if (!c?.lineart || c?.lineFrom !== c?.color || c?.lineQA?.ok === false) out.push({ unit: `ill_${v}_${p}:line`, reason: !c?.lineart ? 'pagină de colorat lipsă' : 'pagină de colorat învechită sau negativă' }); }
  return out;
}
