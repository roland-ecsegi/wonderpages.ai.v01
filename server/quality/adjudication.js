/**
 * Gold-set adjudication — the operator's per-case decisions, kept OUTSIDE the set file in an append-only, hash-chained
 * log next to it (`<set id>.adjudications.jsonl`). The log is repository data: it ships with a release, so decisions
 * taken once are not repeated after installation. The set file itself is never rewritten by this module.
 *
 * Every entry records: the case and its content hash, the set (id, version, manifest hash, whole-set hash), the label
 * proposed initially, the system verdict at that moment (evaluator, versions, detail), the operator's decision
 * (confirm / correct / exclude), the resulting label, the note, actor, time, provenance, the entry it supersedes and
 * the hash chain (seq, prevHash, hash). A later entry for the same case supersedes an earlier one; history stays.
 *
 * `adjudicationState` derives, for the current set: which cases require adjudication, the effective decision per case,
 * what is pending, every inconsistency (broken chain, unknown case, case changed after its decision, wrong set,
 * malformed entry) and one hash over the effective decisions. Complete adjudication is NOT acceptance of calibration:
 * acceptance stays a separate operator action (see `acceptanceCheck`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalHash } from '../domain/canonical.js';
import { EVALUATORS, EVALUATOR_VERSION, caseHash, goldHash, applyAdjudications } from './evaluation.js';
export { caseHash, goldHash, applyAdjudications };

export const ADJ_SCHEMA = 'wonderpages.gold-adjudication/1';
export const SET_SCHEMA = 'wonderpages.gold-set/1';
export const DECISIONS = Object.freeze(['confirm', 'correct', 'exclude']);
/** a case-level status in a set file that means "already adjudicated by the operator" (e.g. in a later set version) */
export const CONFIRMED_STATUSES = Object.freeze(['operator_confirmed', 'operator_corrected']);
const LABELS = ['positive', 'negative'];
/** OBS-GS-5: verdict correctness and reasoning correctness are assessed separately (optional, per entry) */
export const REASONING = Object.freeze(['yes', 'no', 'incomplete']);

export const setRef = gold => ({ id: gold.manifest.id, version: gold.manifest.version, manifestHash: canonicalHash(gold.manifest), goldHash: goldHash(gold) });
export const logFileFor = (dir, gold) => path.join(dir, `${gold.manifest.id}.adjudications.jsonl`);
export const requiresAdjudication = c => !CONFIRMED_STATUSES.includes(c?.adjudication?.status);
const entryHash = e => { const { hash, ...rest } = e; return canonicalHash(rest); };

/** The active set of a directory: the highest-version file with the gold-set schema (never a fixed name). */
export function loadActiveGold(dir) {
  const sets = fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => { try { return { file: path.join(dir, f), gold: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }; } catch { return null; } })
    .filter(x => x?.gold?.manifest?.schema === SET_SCHEMA && Array.isArray(x.gold.cases));
  if (!sets.length) throw { status: 404, message: 'Niciun set de aur în directorul de evaluare.' };
  return sets.sort((a, b) => (b.gold.manifest.version - a.gold.manifest.version) || String(a.gold.manifest.id).localeCompare(b.gold.manifest.id))[0];
}

/** Lines that do not parse are kept as errors (never silently dropped). */
export function readLog(file) {
  if (!fs.existsSync(file)) return { entries: [], errors: [] };
  const entries = [], errors = [];
  fs.readFileSync(file, 'utf8').split('\n').forEach((l, i) => { if (!l.trim()) return; try { entries.push(JSON.parse(l)); } catch { errors.push({ code: 'LOG_UNPARSABLE', line: i + 1, message: `Linia ${i + 1} din jurnal nu este JSON valid.` }); } });
  return { entries, errors };
}
/** Append-only proof: consecutive sequence, each entry chained to the previous one, every hash recomputes. */
export function verifyChain(entries) {
  const errors = []; let prev = null;
  entries.forEach((e, i) => {
    if (e?.schema !== ADJ_SCHEMA) errors.push({ code: 'ENTRY_SCHEMA', seq: e?.seq ?? null, message: `Intrarea ${i + 1} nu are schema jurnalului.` });
    if (e?.seq !== i + 1) errors.push({ code: 'CHAIN_SEQUENCE', seq: e?.seq ?? null, message: `Secvență ruptă la poziția ${i + 1} (o intrare lipsește sau a fost mutată).` });
    if ((e?.prevHash ?? null) !== prev) errors.push({ code: 'CHAIN_LINK', seq: e?.seq ?? null, message: `Intrarea ${e?.seq} nu continuă intrarea anterioară.` });
    if (e?.hash !== entryHash(e || {})) errors.push({ code: 'CHAIN_HASH', seq: e?.seq ?? null, message: `Intrarea ${e?.seq} a fost modificată după înregistrare.` });
    prev = e?.hash ?? null;
  });
  return { ok: !errors.length, errors, head: prev, length: entries.length };
}

/** The system verdict on a case at adjudication time (the same evaluators as the evaluation run). */
export function systemVerdict(c, { policy = 2 } = {}) {
  const ev = EVALUATORS[c.kind]; if (!ev) return { evaluator: c.kind, available: false };
  const r = ev(c, { policy }); return { evaluator: c.kind, evaluatorVersion: EVALUATOR_VERSION, qualityPolicy: policy, predicted: r.predicted, agreesWithProposed: r.predicted === c.label && r.exact !== false, exact: r.exact, detail: r.detail };
}
function correctionErrors(c, result) {
  const errors = [];
  if (!result || typeof result !== 'object') return [{ code: 'CORRECTION_MISSING', message: 'O corectură cere eticheta rezultată.' }];
  if (!LABELS.includes(result.label)) errors.push({ code: 'CORRECTION_LABEL', message: 'Eticheta rezultată este „positive” sau „negative”.' });
  const keys = Object.keys(c.expected || {}).sort();
  if (!result.expected || typeof result.expected !== 'object' || JSON.stringify(Object.keys(result.expected).sort()) !== JSON.stringify(keys)) errors.push({ code: 'CORRECTION_SHAPE', message: `Rezultatul așteptat are aceleași câmpuri ca propunerea (${keys.join(', ')}).` });
  if (!errors.length && result.label === c.label && canonicalHash(result.expected) === canonicalHash(c.expected)) errors.push({ code: 'CORRECTION_SAME', message: 'Corectura este identică cu propunerea: folosește „confirm”.' });
  return errors;
}
function entryErrors(e, c) {
  const errors = [];
  if (!DECISIONS.includes(e.decision)) errors.push({ code: 'DECISION_UNKNOWN', message: `Decizie necunoscută: ${e.decision}.` });
  if (e.decision === 'correct') errors.push(...correctionErrors(c, e.result));
  if (e.decision === 'confirm' && (e.result?.label !== c.label || canonicalHash(e.result?.expected ?? null) !== canonicalHash(c.expected))) errors.push({ code: 'CONFIRM_RESULT', message: 'O confirmare păstrează exact eticheta propusă.' });
  if (e.decision === 'exclude' && e.result !== null) errors.push({ code: 'EXCLUDE_RESULT', message: 'O excludere nu are etichetă rezultată.' });
  if (['correct', 'exclude'].includes(e.decision) && String(e.note || '').trim().length < 3) errors.push({ code: 'NOTE_REQUIRED', message: 'Corectura și excluderea cer o notă a operatorului.' });
  if (!String(e.actor || '').trim() || !e.provenance || !String(e.provenance.statement || '').trim()) errors.push({ code: 'PROVENANCE', message: 'Intrarea cere actorul și proveniența (declarația operatorului).' });
  if (!Number.isFinite(e.at)) errors.push({ code: 'TIMESTAMP', message: 'Lipsește momentul deciziei.' });
  if (e.reasoning != null) {
    const r = e.reasoning;
    if (!REASONING.includes(r.reasoningAgreement)) errors.push({ code: 'REASONING_VALUE', message: 'Acordul de raționament este yes, no sau incomplete.' });
    if (['no', 'incomplete'].includes(r.reasoningAgreement) && (!String(r.systemReason || '').trim() || !String(r.operatorReason || '').trim())) errors.push({ code: 'REASONING_FIELDS', message: 'Un raționament greșit/incomplet cere motivul sistemului și justificarea operatorului.' });
    if (typeof r.verdictAgreement !== 'boolean') errors.push({ code: 'REASONING_VERDICT', message: 'Lipsește acordul de verdict (calculat de sistem).' });
  }
  return errors;
}

/** Builds (does not write) the next entry; refuses anything incomplete. */
export function makeEntry({ gold, entries, caseId, decision, result = undefined, note = '', actor, provenance, at = Date.now(), policy = 2, reasoning = null }) {
  const c = gold.cases.find(x => x.id === caseId); if (!c) throw { status: 404, code: 'CASE_UNKNOWN', message: `Cazul „${caseId}” nu există în ${gold.manifest.id}.` };
  const chain = verifyChain(entries); if (!chain.ok) throw { status: 409, code: 'CHAIN_BROKEN', message: 'Jurnalul existent nu trece verificarea; nu se adaugă nimic.', errors: chain.errors };
  if (decision === 'confirm' && result !== undefined) throw { status: 400, code: 'CONFIRM_RESULT', message: 'O confirmare nu primește altă etichetă.' };
  if (decision === 'exclude' && result !== undefined && result !== null) throw { status: 400, code: 'EXCLUDE_RESULT', message: 'O excludere nu primește etichetă.' };
  const prevForCase = [...entries].reverse().find(e => e.caseId === caseId) || null;
  const e = { schema: ADJ_SCHEMA, seq: entries.length + 1, set: setRef(gold), caseId, caseHash: caseHash(c), proposed: { label: c.label, expected: c.expected, by: c.adjudication?.by || null }, system: systemVerdict(c, { policy }),
    decision, result: decision === 'confirm' ? { label: c.label, expected: c.expected } : decision === 'correct' ? result : null, note: String(note || ''), actor: String(actor || ''), provenance: provenance || null, at,
    supersedes: prevForCase?.hash || null, prevHash: chain.head };
  /* verdict agreement is computed (system verdict vs the resulting label), the reasoning assessment is the operator's */
  if (reasoning) { const res = e.result, ev = EVALUATORS[c.kind], r = res && ev ? ev({ ...c, label: res.label, expected: res.expected }, { policy }) : null; e.reasoning = { verdictAgreement: !!(r && r.predicted === res.label && r.exact !== false), reasoningAgreement: reasoning.reasoningAgreement, systemReason: String(reasoning.systemReason || ''), operatorReason: String(reasoning.operatorReason || '') }; }
  const errors = entryErrors(e, c); if (errors.length) throw { status: 400, code: errors[0].code, message: errors.map(x => x.message).join(' '), errors };
  return { ...e, hash: entryHash(e) };
}
/** Appends one entry; refuses when the log changed since the entry was built (no lost or reordered decisions). */
export function appendEntry(file, entry) {
  const { entries, errors } = readLog(file), chain = verifyChain(entries);
  if (errors.length || !chain.ok) throw { status: 409, code: 'CHAIN_BROKEN', message: 'Jurnalul existent nu trece verificarea; nu se adaugă nimic.', errors: [...errors, ...chain.errors] };
  if (entry.seq !== entries.length + 1 || (entry.prevHash ?? null) !== chain.head || entry.hash !== entryHash(entry)) throw { status: 409, code: 'CHAIN_STALE', message: 'Jurnalul s-a schimbat între timp; reconstruiește intrarea.' };
  fs.appendFileSync(file, JSON.stringify(entry) + '\n', { flag: 'a' });
  return entry;
}

export function adjudicationState(gold, log) {
  const { entries = [], errors: parseErrors = [] } = Array.isArray(log) ? { entries: log } : (log || {});
  const ref = setRef(gold), chain = verifyChain(entries), byId = Object.fromEntries(gold.cases.map(c => [c.id, c]));
  const inconsistencies = [...parseErrors, ...chain.errors], effective = {};
  for (const e of entries) {
    const c = byId[e.caseId];
    if (!c) { inconsistencies.push({ code: 'CASE_UNKNOWN', seq: e.seq, case: e.caseId, message: `Decizie pentru un caz care nu mai există: ${e.caseId}.` }); continue; }
    if (e.set?.id !== ref.id) { inconsistencies.push({ code: 'SET_MISMATCH', seq: e.seq, case: e.caseId, message: `Intrarea ${e.seq} aparține setului ${e.set?.id}.` }); continue; }
    effective[e.caseId] = e;   // the last entry wins; earlier ones stay as history
  }
  for (const [id, e] of Object.entries(effective)) {
    const c = byId[id];
    if (e.caseHash !== caseHash(c) || e.set.version !== ref.version) { inconsistencies.push({ code: 'CASE_CHANGED', seq: e.seq, case: id, message: `Cazul ${id} s-a schimbat după decizie (sau versiunea setului): trebuie readjudecat.` }); delete effective[id]; continue; }
    const errs = entryErrors(e, c); if (errs.length) { inconsistencies.push(...errs.map(x => ({ ...x, seq: e.seq, case: id }))); delete effective[id]; }
  }
  const required = gold.cases.filter(requiresAdjudication).map(c => c.id), pending = required.filter(id => !effective[id]);
  const counts = { cases: gold.cases.length, required: required.length, adjudicated: required.length - pending.length, pending: pending.length, ...Object.fromEntries(DECISIONS.map(d => [d, Object.values(effective).filter(e => e.decision === d).length])), reasoningFlagged: Object.values(effective).filter(e => ['no', 'incomplete'].includes(e.reasoning?.reasoningAgreement)).length, entries: entries.length };
  return { set: ref, chain: { ok: chain.ok, head: chain.head, length: chain.length }, counts, pending, inconsistencies, complete: !pending.length && !inconsistencies.length,
    effective: Object.fromEntries(Object.entries(effective).map(([id, e]) => [id, { seq: e.seq, decision: e.decision, result: e.result, note: e.note, at: e.at, hash: e.hash, supersedes: e.supersedes, reasoning: e.reasoning || null }])),
    hash: canonicalHash({ goldHash: ref.goldHash, effective: Object.entries(effective).sort(([a], [b]) => (a < b ? -1 : 1)).map(([id, e]) => [id, e.hash]) }) };
}

/**
 * Pre-conditions of the operator's acceptance of a calibration (the acceptance itself stays the operator's act):
 * complete and consistent adjudication, both reports on the adjudicated set version, produced after the last
 * adjudication change and on the current set content.
 */
export function acceptanceCheck({ gold, state, calibration, holdout, note }) {
  const reasons = [], add = (code, message) => reasons.push({ code, message });
  if (state.inconsistencies.length) add('ADJUDICATION_INCONSISTENT', `Jurnalul adjudecărilor are ${state.inconsistencies.length} probleme (${[...new Set(state.inconsistencies.map(i => i.code))].join(', ')}).`);
  if (state.pending.length) add('ADJUDICATION_INCOMPLETE', `${state.pending.length} din ${state.counts.required} cazuri nu sunt adjudecate.`);
  for (const [name, r, split] of [['calibrare', calibration, 'calibration'], ['set rezervat', holdout, 'holdout']]) {
    if (!r || r.split !== split) { add('REPORT_MISSING', `Lipsește raportul pe ${name}.`); continue; }
    if (r.dataset?.id !== gold.manifest.id || r.dataset?.version !== gold.manifest.version) add('REPORT_SET_MISMATCH', `Raportul pe ${name} este pentru ${r.dataset?.id} v${r.dataset?.version}, nu pentru setul adjudecat.`);
    else if (r.dataset?.goldHash !== state.set.goldHash) add('REPORT_STALE_SET', `Setul s-a schimbat după raportul pe ${name}.`);
    if (!r.adjudicationState || r.adjudicationState.hash !== state.hash) add('REPORT_STALE_ADJUDICATION', `Adjudecările s-au schimbat după raportul pe ${name} (sau raportul precede adjudecarea completă).`);
    else if (r.adjudicationState.complete !== true) add('REPORT_BEFORE_COMPLETE_ADJUDICATION', `Raportul pe ${name} a fost generat înaintea adjudecării complete.`);
  }
  if (String(note || '').trim().length < 10) add('NOTE_REQUIRED', 'Scrie ce ai verificat la acceptare.');
  return { ok: !reasons.length, reasons };
}
