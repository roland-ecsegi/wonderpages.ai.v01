/**
 * P7-T02 — the governed scope change of a lesson: report (preview) → operator decision bound to the report hash →
 * versioned, pinned change → deterministic rollback. Narrowing never needs evidence; widening always does.
 */
import * as Learning from '../learning.js';
import * as K from './store.js';
import { promotionReport, applyScope, rollbackScope } from './promotion.js';
import { decisionRecord } from '../domain/decisions.js';

async function context(repo, lesson) {
  const pids = [...new Set([...(lesson.projects || []), lesson.pid, ...(lesson.negatives || []).map(n => n.pid)].filter(Boolean))], projects = {}, canons = [];
  for (const pid of pids) { const p = repo.getProject(pid); if (!p) continue; projects[pid] = p; const b = (await repo.artifacts(pid)).bible?.content; if (b) canons.push(b); }
  return { projects, canons, sourceRevoked: !!(lesson.provenance?.sourceId && K.sourceStatus(lesson.provenance.sourceId) === 'revoked'), active: Learning.listLessons().filter(l => l.status === 'active') };
}
export async function scopeReport(repo, id, target) {
  const lesson = Learning.listLessons().find(l => l.id === id); if (!lesson) throw { status: 404, message: 'Lecție inexistentă.' };
  return promotionReport({ lesson, target: { ...target, pid: target.pid || (target.scope === 'project' ? lesson.pid : null) }, ...(await context(repo, lesson)) });
}
const RANK = { project: 0, age: 1, global: 2 };
export async function changeScope(repo, id, { scope, age = null, pid = null, reportHash = null, note = '' }, actor = 'operator@laptop') {
  const lesson = Learning.listLessons().find(l => l.id === id); if (!lesson) throw { status: 404, message: 'Lecție inexistentă.' };
  const target = { scope, age, pid: pid || (scope === 'project' ? lesson.pid : null) }, report = await scopeReport(repo, id, target);
  const cur = lesson.scope || 'global', narrowing = scope in RANK && (RANK[scope] < RANK[cur] || (scope === cur && (scope === 'project' || (scope === 'age' && age === lesson.age))));   // narrower scope (or the same cohort) never needs evidence; another age is a new cohort
  if (!narrowing) {
    if (!reportHash) return { applied: false, report };
    if (reportHash !== report.hash) throw { status: 409, code: 'stale_report', message: 'Raportul de promovare s-a schimbat (dovezi, text sau sursă); citește-l din nou înainte de a decide.', report };
    if (!report.eligible) throw { status: 409, code: 'promotion_blocked', message: report.reasons.join(' '), report };
  } else if (scope === 'project' && !target.pid) throw { status: 400, message: 'Alege proiectul în care se aplică.' };
  const rec = decisionRecord({ kind: 'knowledge_promotion', actor, state: 'approved', note, scope: { lesson: id, from: lesson.scope || null, to: scope, age: target.age, pid: target.pid }, subject: { reportHash: report.hash, version: lesson.version || 1, text: lesson.text, evidence: report.evidence, narrowing } });
  applyScope(lesson, target, { decision: rec.id, reportHash: report.hash });
  await Learning.persistLessons(); await K.recordDecision(rec);
  return { applied: true, lesson, decision: rec, report };
}
export async function rollback(decisionId, actor = 'operator@laptop') {
  const d = K.getDecision(decisionId); if (!d || d.kind !== 'knowledge_promotion') throw { status: 404, message: 'Decizie de promovare inexistentă.' };
  const lesson = Learning.listLessons().find(l => l.id === d.scope.lesson); if (!lesson) throw { status: 404, message: 'Lecția nu mai există.' };
  if (lesson.promotion?.decision !== decisionId) throw { status: 409, code: 'not_latest', message: 'Lecția a fost schimbată după această decizie; revino mai întâi asupra deciziei mai noi.' };
  const rec = decisionRecord({ kind: 'knowledge_rollback', actor, state: 'approved', scope: { lesson: lesson.id, decision: decisionId }, subject: { fromVersion: lesson.version }, supersedes: decisionId });
  rollbackScope(lesson, { decision: rec.id }); await Learning.persistLessons(); await K.recordDecision(rec);
  return { lesson, decision: rec };
}
