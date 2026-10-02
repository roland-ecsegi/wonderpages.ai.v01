/**
 * P2-T04 — DecisionRecord and gate contracts (OUTPUT-05/18).
 *
 * A decision binds an ACTOR, a reason and a scope to the exact content hash, dependency hash and policy hash it
 * judged. Decisions are append-only: when content, dependencies or policy change, the historical decision stays
 * and becomes `stale`; a new decision is required. Expected artifact inventory makes "missing" explicit: nothing
 * required may silently disappear from a release.
 */
import crypto from 'node:crypto';
import { canonicalHash } from './canonical.js';
import { contractFromBlueprint, editionsFor } from './product-contract.js';
import { requiredBooks } from '../delivery.js';

export const DECISION_SCHEMA = 'wonderpages.decision/1';
export const decisionId = () => 'd' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
export const policyHash = (bp, gateKey) => canonicalHash({ contract: contractFromBlueprint(bp).contractHash, gate: gateKey ? bp.gates?.[gateKey] ?? null : null, rubric: bp.rubric ?? null, editorial: bp.editorial_contract ?? null, preflight: bp.preflight ?? null });
const depHash = a => canonicalHash(a?.basedOn ? { key: a.basedOn.key, version: a.basedOn.version ?? null, pageHash: a.basedOn.pageHash ?? null } : null);

export function decisionRecord({ kind, actor, state, note = '', scope = {}, subject = {}, policy = null, evidence = null, supersedes = null }) {
  return { schema: DECISION_SCHEMA, id: decisionId(), kind, actor: actor || 'unknown', state, note: String(note || '').slice(0, 2000), scope, subject, policyHash: policy, evidence, supersedes, at: Date.now() };
}
/** The subject of an item decision: artifact version + item content hash + dependency hash. */
export const itemSubject = (art, item) => ({ artifactKey: item.key || null, version: item.key ? art[item.key]?.version ?? null : null, contentHash: item.hash ?? null, dependencyHash: item.key ? depHash(art[item.key]) : null });

/** A decision is stale when the content, its dependencies or the governing policy changed after it was made. */
export function decisionStatus(rec, { item, art, bp }) {
  if (!rec) return { status: 'missing' };
  const reasons = [];
  if (item && rec.subject?.contentHash && rec.subject.contentHash !== item.hash) reasons.push('conținutul s-a schimbat');
  if (item?.key && rec.subject?.dependencyHash && rec.subject.dependencyHash !== depHash(art[item.key])) reasons.push('dependențele s-au schimbat');
  if (rec.policyHash && bp && rec.scope?.gate && rec.policyHash !== policyHash(bp, rec.scope.gate)) reasons.push('politica porții s-a schimbat');
  return reasons.length ? { status: 'stale', reasons } : { status: rec.state };
}

/**
 * Expected artifact inventory of one volume (or the collection when vol == null): required editions, text pages,
 * adaptation pages, colour pages and coloring pages, plus final receipts. Each entry is present or missing.
 */
export function expectedInventory(project, bp, art, vol) {
  const V = bp.structure.volumes, P = bp.structure.pages, vols = vol == null ? Array.from({ length: V }, (_, i) => i) : [vol];
  const imagesOn = project.options?.images !== false, second = !!project.input?.second_language, out = [];
  const add = (id, present, label) => out.push({ id, present: !!present, label });
  const c = contractFromBlueprint(bp), langs = project.input?.languages || [project.input?.language].filter(Boolean);
  for (const v of vols) {
    const fin = art[`final_${v}`]?.content, tr = art[`tr_${v}`]?.content;
    for (let p = 1; p <= P; p++) {
      const pg = fin?.pages?.find(x => x.n === p); add(`text:${v}:${p}`, pg && (String(pg.text || '').trim() || pg.page_type === 'wordless'), `Vol. ${v + 1}, p. ${p}, text`);
      if (second) { const t = tr?.pages?.find(x => x.n === p); add(`tr:${v}:${p}`, t && (String(t.text || '').trim() || t.page_type === 'wordless'), `Vol. ${v + 1}, p. ${p}, ${project.input.second_language}`); }
    }
    if (imagesOn) for (let p = 0; p <= P; p++) {
      const ill = art[`ill_${v}_${p}`]?.content; add(`color:${v}:${p}`, ill?.color, `Vol. ${v + 1}, ${p ? 'p. ' + p : 'copertă'}, color`);
      if (p > 0 && c.components.some(x => x.key === 'coloring')) add(`line:${v}:${p}`, ill?.lineart && !ill.linePending, `Vol. ${v + 1}, p. ${p}, de colorat`);
    }
  }
  const editions = editionsFor(c, langs).books.filter(b => vol == null || b.volume === vol + 1);
  return { vol, required: out, missing: out.filter(x => !x.present), editions: editions.length, books: requiredBooks(project, bp) };
}

/** Release eligibility: approved gates (engine.volumeApproved) AND complete inventory AND no stale decision. */
export function releaseCheck(project, bp, art, vol, { approved, staleDecisions = [], safety = [] }) {
  const inv = expectedInventory(project, bp, art, vol), blockers = [];
  for (const s of safety) blockers.push({ code: 'safety_' + String(s.verdict).toLowerCase(), id: s.id, message: `Siguranță ${s.verdict}: ${s.artifact || s.kind}${s.page != null ? ' pagina ' + s.page : ''}${s.findings?.[0]?.quote ? ` — „${s.findings[0].quote}”` : s.note ? ` — ${s.note}` : ''}` });   // P5-T01: any non-PASS blocks release
  if (!approved) blockers.push({ code: 'gate_not_approved', message: vol == null ? 'Colecția nu are toate porțile aprobate de tine.' : `Volumul ${vol + 1} nu are aprobarea finală.` });
  for (const m of inv.missing) blockers.push({ code: 'missing_artifact', id: m.id, message: `Lipsește: ${m.label}.` });
  for (const d of staleDecisions) blockers.push({ code: 'stale_decision', id: d.id, message: `Decizie expirată (${d.reasons.join(', ')}): ${d.label || d.id}.` });
  return { eligible: !blockers.length, blockers, inventory: { required: inv.required.length, missing: inv.missing.length, editions: inv.editions } };
}
