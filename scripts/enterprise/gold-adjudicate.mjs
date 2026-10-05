#!/usr/bin/env node
/**
 * Gold-set adjudication log — the operator's per-case decisions (append-only, hash-chained, shipped with the release).
 *   node scripts/enterprise/gold-adjudicate.mjs status
 *   node scripts/enterprise/gold-adjudicate.mjs show --case=<id>
 *   node scripts/enterprise/gold-adjudicate.mjs verify
 *   node scripts/enterprise/gold-adjudicate.mjs record --case=<id> --decision=confirm|correct|exclude
 *        [--label=positive|negative --expected='{"verdict":"REVIEW"}'] --note="…" --statement="the operator's words"
 *        [--reasoning-agreement=yes|no|incomplete --system-reason="…" --operator-reason="…"]
 *        [--actor=operator] [--recorded-by="…"] [--channel="…"]
 * `record` writes ONE decision that the operator stated explicitly (their words go into the provenance); it never
 * rewrites the set file, never accepts a calibration and refuses to append to a log that fails verification.
 * Options: --dir=<gold directory> (default: WP_GOLD_DIR or evaluation/gold).
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadActiveGold, logFileFor, readLog, verifyChain, adjudicationState, makeEntry, appendEntry, systemVerdict } from '../../server/quality/adjudication.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = n => process.argv.find(x => x.startsWith(`--${n}=`))?.split('=').slice(1).join('=');

export function adjudicate(cmd, opts = {}) {
  const dir = opts.dir || process.env.WP_GOLD_DIR || path.join(ROOT, 'evaluation', 'gold');
  const { gold, file: setFile } = loadActiveGold(dir), log = logFileFor(dir, gold), { entries, errors } = readLog(log);
  if (cmd === 'status' || cmd === 'verify') {
    const st = adjudicationState(gold, { entries, errors });
    return { set: st.set, setFile: path.relative(ROOT, setFile), log: path.relative(ROOT, log), chain: verifyChain(entries), parseErrors: errors, counts: st.counts, complete: st.complete, inconsistencies: st.inconsistencies, pending: st.pending.length, effective: st.effective };
  }
  if (cmd === 'show') {
    const c = gold.cases.find(x => x.id === opts.case); if (!c) throw { message: `Cazul „${opts.case}” nu există.` };
    return { case: c, system: systemVerdict(c, { policy: 2 }), systemPolicyV1: c.kind === 'quality' ? systemVerdict(c, { policy: 1 }) : undefined, history: entries.filter(e => e.caseId === c.id), position: gold.cases.indexOf(c) + 1, of: gold.cases.length };
  }
  if (cmd === 'record') {
    if (!String(opts.statement || '').trim()) throw { message: 'Lipsește declarația operatorului (--statement): o decizie nu se înregistrează fără cuvintele lui.' };
    const result = opts.decision === 'correct' ? { label: opts.label, expected: JSON.parse(opts.expected || 'null') } : undefined;
    const e = makeEntry({ gold, entries, caseId: opts.case, decision: opts.decision, result, note: opts.note || '', actor: opts.actor || 'operator',
      provenance: { statement: opts.statement, recordedBy: opts.recordedBy || 'gold-adjudicate.mjs', channel: opts.channel || 'local' }, at: opts.at || Date.now(),
      reasoning: opts.reasoningAgreement ? { reasoningAgreement: opts.reasoningAgreement, systemReason: opts.systemReason, operatorReason: opts.operatorReason } : null });
    appendEntry(log, e);
    const st = adjudicationState(gold, readLog(log));
    return { recorded: e, state: { counts: st.counts, complete: st.complete, chain: st.chain, inconsistencies: st.inconsistencies.length } };
  }
  throw { message: `Comandă necunoscută: ${cmd}` };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    const out = adjudicate(process.argv[2] || 'status', { dir: arg('dir'), case: arg('case'), decision: arg('decision'), label: arg('label'), expected: arg('expected'), note: arg('note'), statement: arg('statement'), actor: arg('actor'), recordedBy: arg('recorded-by'), channel: arg('channel'), reasoningAgreement: arg('reasoning-agreement'), systemReason: arg('system-reason'), operatorReason: arg('operator-reason') });
    console.log(JSON.stringify(out, null, 1));
    if (process.argv[2] === 'verify' && (!out.chain.ok || out.parseErrors.length)) process.exit(1);
  } catch (e) { console.error(JSON.stringify({ error: e.code || 'error', message: e.message, errors: e.errors }, null, 1)); process.exit(1); }
}
