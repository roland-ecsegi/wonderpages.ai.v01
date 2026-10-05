/**
 * Evaluation service behind /api/evaluation/*: the active gold set of a directory (highest version, any name), its
 * adjudication log (read-only here — decisions are recorded with `scripts/enterprise/gold-adjudicate.mjs` and ship
 * with the release), evaluation runs bound to the adjudication state, and the operator's acceptance, which is refused
 * until the adjudication is complete and the reports match it. Complete adjudication never implies acceptance.
 */
import path from 'node:path';
import { runEvaluation, calibrationStatus } from './evaluation.js';
import { loadActiveGold, logFileFor, readLog, adjudicationState, acceptanceCheck } from './adjudication.js';

export function createEvaluationService({ goldDir, storage, now = () => Date.now() }) {
  const active = () => loadActiveGold(goldDir).gold;
  const current = () => { const gold = active(); return { gold, state: adjudicationState(gold, readLog(logFileFor(goldDir, gold))) }; };
  const reports = async () => { const out = []; for (const f of (await storage.list('evaluation/reports').catch(() => [])).filter(x => x.name.endsWith('.json'))) { const r = await storage.readJSON(`evaluation/reports/${f.name}`, null); if (r) out.push(r); } return out.sort((a, b) => a.at - b.at); };
  const summary = s => ({ set: s.set, complete: s.complete, counts: s.counts, pending: s.pending, inconsistencies: s.inconsistencies, chain: s.chain, hash: s.hash, effective: s.effective, log: path.basename(logFileFor(goldDir, { manifest: { id: s.set.id } })) });

  return {
    gold() { const g = active(); return { manifest: g.manifest, counts: g.cases.reduce((m, c) => { m[c.split] = (m[c.split] || 0) + 1; m[c.kind] = (m[c.kind] || 0) + 1; return m; }, {}) }; },
    adjudication() { return summary(current().state); },
    async run({ split = 'calibration', policy = 2 } = {}) {
      const { gold, state } = current(), r = runEvaluation(gold, { split: ['calibration', 'holdout', 'all'].includes(split) ? split : 'calibration', policy: Number(policy) === 1 ? 1 : 2, adjudication: state });
      await storage.writeJSON(`evaluation/reports/${r.id}.json`, r); return r;
    },
    reports,
    /** the operator's acceptance: only on complete, consistent adjudication and reports that match it */
    async accept({ calibration, holdout, note, actor = 'operator@laptop' } = {}) {
      const all = await reports(), { gold, state } = current();
      const chk = acceptanceCheck({ gold, state, calibration: all.find(r => r.id === calibration), holdout: all.find(r => r.id === holdout), note });
      if (!chk.ok) throw { status: 409, code: chk.reasons[0].code, message: chk.reasons.map(r => r.message).join(' '), errors: chk.reasons };
      const acc = { calibration, holdout, note: String(note).slice(0, 1000), actor, at: now(), set: state.set, goldHash: state.set.goldHash, adjudicationHash: state.hash, counts: state.counts };
      await storage.writeJSON('evaluation/acceptance.json', acc); return acc;
    },
    async status() {
      const all = await reports(), acc = await storage.readJSON('evaluation/acceptance.json', null), { state } = current(), pick = id => all.find(r => r.id === id);
      const picked = acc ? [pick(acc.calibration), pick(acc.holdout)].filter(Boolean) : [all.filter(r => r.split === 'calibration').at(-1), all.filter(r => r.split === 'holdout').at(-1)].filter(Boolean);
      return { ...calibrationStatus(picked, acc, { adjudication: state }), acceptance: acc, adjudication: { complete: state.complete, counts: state.counts, hash: state.hash } };
    }
  };
}
