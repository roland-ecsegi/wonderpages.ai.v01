/**
 * P4-T03 — visual canon / character atlas (OUTPUT-06/27, RK10/16 ADAPT).
 * Requirements (views per character) are derived from the canon; what exists is classified by provenance:
 *  - `original`   the operator's own reference images (kept byte-for-byte, hash recorded);
 *  - `approved`   a generated character sheet approved explicitly at the series gate (same hash as approved);
 *  - `proposed`   generated but not (or no longer) approved — never used as an active reference for bulk;
 *  - `inactive_rights` reused from another book or stock: active only with a cleared RightsRecord.
 * A missing view stays `proposed` as a work proposal; nothing is invented as approved.
 */
import { rightsStatus } from './rights.js';

export const VIEWS = Object.freeze({ main: ['front', 'side', 'back', 'expressions'], other: ['front', 'side', 'expressions'] });
const SHEET_VIEWS = ['front', 'side', 'back'];   // a character sheet (turnaround) covers these once approved

/** Derived prompt context for a character: the landmarks travel structured, so a copy of them embedded in the
 *  canonical description is removed from the PROMPT ONLY; relative sizes stored as JSON strings are parsed. Raw stays. */
export function landmarkContext(c) {
  const raw = String(c?.canonical_description || '');
  const cut = raw.search(/\s*Identity landmarks and their anatomical anchors:\s*\[/i);
  const description = cut >= 0 ? raw.slice(0, cut).trim() : raw;
  const landmarks = (c?.visual_landmarks || c?.landmarks || []).map(l => { let size = l.relative_size; if (typeof size === 'string' && /^\s*\{/.test(size)) { try { size = JSON.parse(size); } catch {} } return { ...l, relative_size: size }; });
  return { description, landmarks, deduplicated: cut >= 0, rawLength: raw.length, length: description.length };
}

export function atlasFor({ project, art, approvals = {}, declaredRights = [], hashOf = null }) {
  const chars = art.bible?.content?.characters || [], cast = art.cast?.content?.characters || [];
  const mainId = art.cast?.content?.main_character || chars.find(c => c.role === 'main')?.id;
  const inCast = id => !cast.length || cast.some(c => c.id === id && (c.volumes || []).some(v => ['introduced', 'appears', 'returns'].includes(v.presence)));
  const entries = [];
  /* originals: project refs mapped to characters by the refs description (images: [index]) */
  const refsMap = art.refs?.content?.characters || [];
  (project.refs || []).forEach((r, i) => { const owner = refsMap.find(c => (c.images || []).includes(i))?.id || null; entries.push({ id: `ref:${r.file}`, character: owner, view: 'front', kind: 'original', file: r.file, sha256: r.sha256 || null, status: 'original', active: true }); });
  /* generated character sheets: approved only with an explicit gate approval whose hash still matches */
  (art.anchors?.content?.prompts || []).forEach((p, i) => {
    if (!p.image) return;
    const a = approvals[`ref:${i}`], same = a && (!hashOf || a.hash === hashOf(i, p));
    const approved = a && ['approved', 'approved_note'].includes(a.state) && same;
    for (const view of SHEET_VIEWS) entries.push({ id: `sheet:${i}:${view}`, character: p.ref || null, view, kind: 'generated', file: p.image, status: approved ? 'approved' : 'proposed', active: !!approved, reason: approved ? null : 'Fișa nu este aprobată explicit la poarta seriei.' });
  });
  /* explicit atlas entries (reused from another book, stock, or extra generated views) */
  const byId = new Map(declaredRights.map(d => [d.id, d]));
  for (const e of art.atlas?.content?.entries || []) {
    const crossBook = e.source === 'reuse' || e.source === 'stock' || (e.fromProject && e.fromProject !== project.id);
    let status = e.status === 'approved' ? 'approved' : 'proposed', active = status === 'approved', reason = active ? null : 'Neaprobat.';
    if (crossBook) { const r = rightsStatus(byId.get(`atlas:${e.id}`) || null); if (r.status !== 'cleared') { status = 'inactive_rights'; active = false; reason = `Reutilizare fără drepturi clarificate (${r.status}): ${r.reasons.join(' ')}`; } }
    entries.push({ id: `atlas:${e.id}`, character: e.character || null, view: e.view || 'front', kind: crossBook ? (e.source || 'reuse') : 'generated', file: e.file || null, fromProject: e.fromProject || null, status, active, reason });
  }
  const requirements = [];
  for (const c of chars.filter(c => inCast(c.id))) for (const view of c.id === mainId ? VIEWS.main : VIEWS.other) {
    const have = entries.filter(e => e.character === c.id && (e.view === view || (view === 'front' && e.kind === 'original')));
    const best = have.find(e => e.status === 'original') || have.find(e => e.status === 'approved') || have.find(e => e.status === 'proposed') || have.find(e => e.status === 'inactive_rights');
    requirements.push({ character: c.id, name: c.name || c.id, view, status: best ? (best.status === 'original' ? 'covered_original' : best.status === 'approved' ? 'covered_approved' : best.status) : 'missing', proposal: !best || !best.active ? `Propunere: ${view} pentru ${c.name || c.id} (job nou, cu aprobare vizuală)` : null });
  }
  const pending = requirements.filter(r => !r.status.startsWith('covered'));
  return { schema: 'wonderpages.atlas/1', entries, requirements, activeReferences: entries.filter(e => e.active).map(e => ({ id: e.id, character: e.character, view: e.view, file: e.file })), summary: { requirements: requirements.length, covered: requirements.length - pending.length, proposed: pending.length, inactive: entries.filter(e => e.status === 'inactive_rights').length } };
}
