/**
 * P7-T02 — validation, scope and promotion gates (ADR08: role-specific governed learning).
 * A lesson is born in ONE project. Widening it is a decision backed by a report, never a broadcast:
 *   project → age      ≥ 2 distinct projects of that age confirm it, none of them (or another project of that age) contradicts it;
 *   age/project → global (the agent's role, every project)   ≥ 3 projects over ≥ 2 themes, no negative case anywhere;
 * and in every case: not project-specific (no character/place name of a project canon), not revoked at the source,
 * no child-safety BLOCK, no quarantine flag (injection, magical world rule, canon collision). The hard product and
 * safety contract always precede a learned preference. The report has a hash; an approval with an older hash is
 * refused (stale report). Every change is a versioned, pinned record; rollback restores the exact previous version.
 */
import { canonicalHash } from '../domain/canonical.js';
import { textSafety } from '../quality/safety.js';
import { scanCandidate } from './store.js';

export const WIDEN = Object.freeze({ age: { minProjects: 2 }, global: { minProjects: 3, minThemes: 2 } });
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const themeOf = p => String(p?.input?.theme || p?.theme || (p?.input?.short_description || '').split(/\s+/).slice(0, 3).join(' ') || '?').toLowerCase();

/** Positive (confirming) and negative (contradicting) cases of a lesson, with the cohort of each project. */
export function evidenceOf(lesson, projects = {}) {
  const row = pid => { const p = projects[pid]; return { pid, age: p?.input?.target_age || null, theme: p ? themeOf(p) : null, known: !!p }; };
  const pos = [...new Set([...(lesson.projects || []), lesson.pid].filter(Boolean))].map(row);
  const neg = [...new Set((lesson.negatives || []).map(n => n.pid).filter(Boolean))].map(row);
  return { positives: pos, negatives: neg };
}
/** Names a project canon owns (characters, places, objects): a lesson that names them is project-specific. */
export function projectSpecific(text, canons = []) {
  const t = norm(text), hits = new Set();
  for (const c of canons) for (const n of [...(c?.characters || []), ...(c?.locations || []), ...(c?.objects || [])].map(x => x?.name).filter(Boolean)) { const nn = norm(n); if (nn.length >= 3 && new RegExp(`(?<![a-z])${nn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`).test(t)) hits.add(n); }
  return [...hits];
}

export function promotionReport({ lesson, target, projects = {}, canons = [], sourceRevoked = false, active = [] }) {
  if (!lesson) throw { status: 404, message: 'Lecție inexistentă.' };
  const scope = target?.scope, reasons = [], ev = evidenceOf(lesson, projects);
  if (!['project', 'age', 'global'].includes(scope)) throw { status: 400, message: 'Domeniu invalid.' };
  if (lesson.status !== 'active' && lesson.status !== 'candidate') reasons.push(`Lecția este „${lesson.status}”.`);
  if (sourceRevoked) reasons.push('Sursa lecției a fost revocată.');
  if (textSafety(lesson.text).verdict === 'BLOCK') reasons.push('Textul nu trece politica de siguranță a copiilor (contractul are prioritate).');
  const flags = scanCandidate({ type: 'lesson', text: lesson.text }, { active: active.filter(a => a.id !== lesson.id && a.agent === lesson.agent) });
  for (const f of flags) reasons.push(`${f.code}: ${f.detail}`);
  const named = projectSpecific(lesson.text, canons);
  if (scope === 'project') { if (!target.pid) reasons.push('Alege proiectul în care se aplică.'); }
  else {
    if (named.length) reasons.push(`Lecția este specifică proiectului (numește ${named.join(', ')}); rămâne la nivel de proiect.`);
    if (scope === 'age') {
      if (!target.age) reasons.push('Alege vârsta.');
      const pos = ev.positives.filter(x => x.age === target.age), neg = ev.negatives.filter(x => !x.age || x.age === target.age);
      if (pos.length < WIDEN.age.minProjects) reasons.push(`Confirmată în ${pos.length} proiect(e) de ${target.age}; promovarea cere cel puțin ${WIDEN.age.minProjects} (fără generalizare dintr-un singur caz).`);
      if (neg.length) reasons.push(`Contrazisă în ${neg.length} proiect(e) (${neg.map(n => n.theme || n.pid).join(', ')}): aplicabilitate neconfirmată.`);
    }
    if (scope === 'global') {
      const themes = new Set(ev.positives.map(x => x.theme).filter(Boolean));
      if (ev.positives.length < WIDEN.global.minProjects) reasons.push(`Confirmată în ${ev.positives.length} proiect(e); rolul întreg cere cel puțin ${WIDEN.global.minProjects}.`);
      if (themes.size < WIDEN.global.minThemes) reasons.push(`Confirmată pe ${themes.size} temă/teme; rolul întreg cere cel puțin ${WIDEN.global.minThemes} teme diferite.`);
      if (ev.negatives.length) reasons.push(`Pozitivă într-o temă, negativă în alta (${ev.negatives.map(n => n.theme || n.pid).join(', ')}): rămâne pe domeniul confirmat.`);
    }
  }
  const body = { lesson: { id: lesson.id, version: lesson.version || 1, text: lesson.text, agent: lesson.agent, scope: lesson.scope || null, age: lesson.age || null, pid: lesson.pid || null, status: lesson.status }, target: { scope, age: target.age || null, pid: target.pid || null }, evidence: ev, named, sourceRevoked };
  return { ...body, eligible: !reasons.length, reasons, hash: canonicalHash(body).slice(0, 24) };
}

/** Versioned, pinned scope change. */
export function applyScope(lesson, target, { decision, reportHash, at = Date.now() }) {
  const prev = { version: lesson.version || 1, scope: lesson.scope || null, age: lesson.age || null, pid: lesson.pid || null, text: lesson.text, status: lesson.status, at };
  Object.assign(lesson, { versions: [...(lesson.versions || []), prev], version: prev.version + 1, scope: target.scope, age: target.scope === 'age' ? target.age : lesson.age && target.scope === 'project' ? lesson.age : null, pid: target.scope === 'project' ? target.pid : lesson.pid, status: 'active', promotion: { decision, reportHash, at }, updatedAt: at });
  return lesson;
}
export function rollbackScope(lesson, { decision, at = Date.now() }) {
  const prev = (lesson.versions || []).at(-1); if (!prev) throw { status: 409, message: 'Nu există o versiune anterioară.' };
  const current = { version: lesson.version, scope: lesson.scope, age: lesson.age, pid: lesson.pid, text: lesson.text, status: lesson.status, at, rolledBackBy: decision };
  Object.assign(lesson, { scope: prev.scope, age: prev.age, pid: prev.pid, text: prev.text, status: prev.status, version: lesson.version + 1, versions: [...lesson.versions.slice(0, -1), prev, current], rollback: { decision, to: prev.version, at }, promotion: null, updatedAt: at });
  return lesson;
}
