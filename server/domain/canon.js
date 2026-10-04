/**
 * P2-T02 — canon authority (ADR03): one authoritative source per fact, everything else is a projection.
 *
 *   characters / world / objects / style  → `bible` (CollectionBible = CanonRevision)
 *   volume plan (goal…ending)             → `series.volumes[v].story_bible` (VolumeBible)
 *   page events / text / turn             → the manuscript `script_v` / `final_v` once it exists (it prevails over plans)
 *   summaries, premises in scripts, page_plan turn labels → projections (must agree with their authority)
 *
 * Legacy data has no derivation records: such projections are `unverified` (a semantic check is required, P5-T04),
 * never silently "true". A divergence between two places that both claim authority is a `dual_authority`
 * conflict that the operator resolves; raw values are preserved.
 */
import { canonicalHash } from './canonical.js';
import { canonChanges, buildGraph, impactOf, firstAppearanceConflicts } from './dependencies.js';

/* workflow labels (status/derived records) are not canon content */
const semantic = sb => { if (!sb || typeof sb !== 'object') return sb ?? null; const { status, derived, ...rest } = sb; return rest; };

export const AUTHORITY = Object.freeze([
  { fact: 'characters|world|objects|style', authority: 'bible', projections: ['refs.characters', 'cast.characters'] },
  { fact: 'volume_plan', authority: 'series.volumes[v].story_bible', projections: ['series.volumes[v].summary', 'script_v.story_bible'] },
  { fact: 'page_events', authority: 'script_v.pages / final_v.pages (manuscris)', projections: ['series.volumes[v].page_plan'] }
]);

export function canonRevision(art) {
  const b = art.bible?.content || {}, h = x => canonicalHash(x ?? null);
  const list = (arr, key = 'id') => (arr || []).map(x => ({ id: String(x[key] || x.name || '').toLowerCase(), hash: h(x) })).sort((a, b2) => a.id.localeCompare(b2.id));
  const volumes = (art.series?.content?.volumes || []).map((vol, v) => ({ v, bibleHash: h(semantic(vol.story_bible)), planHash: h(vol.page_plan) }));
  const body = { characters: list(b.characters), objects: list(b.objects), locations: list(b.world?.locations), style: h(b.style_guide), worldRules: h(b.world_rules), volumes };
  return { ...body, hash: h(body), source: { bible: art.bible?.version ?? null, series: art.series?.version ?? null } };
}

/** Projection status: derived (matches its recorded source), stale (source changed since), unverified (legacy, no record). */
export function projections(art) {
  const out = [], vols = art.series?.content?.volumes || [];
  vols.forEach((vol, v) => {
    const auth = canonicalHash(semantic(vol.story_bible)), scr = art[`script_${v}`]?.content;
    const rec = vol.derived?.summary;
    out.push({ field: `series.volumes[${v}].summary`, authority: `series.volumes[${v}].story_bible`, status: rec ? (rec.sourceHash === auth ? 'derived' : 'stale') : 'unverified', value: vol.summary ?? null });
    if (scr?.story_bible) {
      const rec2 = scr.derived?.story_bible;
      out.push({ field: `script_${v}.story_bible`, authority: `series.volumes[${v}].story_bible`, status: rec2 ? (rec2.sourceHash === auth ? 'derived' : 'stale') : canonicalHash(semantic(scr.story_bible)) === auth ? 'identical_copy' : 'divergent', value: scr.story_bible.premise ?? null });
    }
  });
  return out;
}

/**
 * Stored findings (e.g. recorded at migration) are an AUDIT TRAIL and are never deleted. A finding is active until an
 * approved decision explicitly covers it (`scope.conflicts` lists its id); then it is reported as resolved, with the
 * decision that resolved it, instead of as an open conflict. Generic: no project or finding id is special.
 */
export function findingStatus(findings = [], decisions = []) {
  const active = [], resolved = [];
  for (const f of findings) {
    const d = decisions.filter(x => x?.state === 'approved' && Array.isArray(x?.scope?.conflicts) && x.scope.conflicts.includes(f.id)).sort((a, b) => (b.at || 0) - (a.at || 0))[0];
    if (d) resolved.push({ ...f, resolvedBy: { decision: d.id, kind: d.kind, actor: d.actor, at: d.at, note: d.note || '' } }); else active.push(f);
  }
  return { active, resolved };
}
export function canonConflicts(bp, art, findings = [], { decisions = [] } = {}) {
  const out = [], vols = art.series?.content?.volumes || [];
  vols.forEach((vol, v) => {
    const scr = art[`final_${v}`]?.content || art[`script_${v}`]?.content; if (!scr?.pages) return;
    const diffs = (vol.page_plan || []).map(pl => { const pg = scr.pages.find(x => x.n === pl.n); return pg && pl.turn?.type && pg.turn?.type && pl.turn.type !== pg.turn.type ? { page: pl.n, plan: pl.turn.type, manuscript: pg.turn.type } : null; }).filter(Boolean);
    if (diffs.length) out.push({ id: `turn-type@v${v + 1}`, kind: 'dual_authority', field: 'pages[].turn.type', volume: v + 1, count: diffs.length, detail: diffs, authority: 'manuscris', requiresDecision: true, resolution: 'Operatorul alege contractul intenționat; ambele valori brute se păstrează; PageBlueprint canonic se derivă din alegere.' });
    const sb = art[`script_${v}`]?.content?.story_bible;
    if (sb && canonicalHash(semantic(sb)) !== canonicalHash(semantic(vol.story_bible))) out.push({ id: `volume-bible@v${v + 1}`, kind: 'dual_authority', field: 'story_bible', volume: v + 1, authority: `series.volumes[${v}].story_bible`, requiresDecision: true, resolution: 'VolumeBible din serie este autoritatea; copia din manuscris devine proiecție.' });
  });
  for (const pr of projections(art)) if (pr.status === 'unverified' || pr.status === 'stale') {
    const v = Number(pr.field.match(/\[(\d+)\]/)?.[1]);
    if (art[`script_${v}`] || art[`final_${v}`]) out.push({ id: `projection:${pr.field}`, kind: pr.status === 'stale' ? 'stale_projection' : 'unverified_projection', field: pr.field, volume: v + 1, authority: pr.authority, requiresAssessment: true, resolution: 'Verificare semantică față de manuscrisul aprobat (P5-T04); dacă diferă, proiecția se regenerează din autoritate, nu invers.' });
  }
  for (const f of findingStatus(findings, decisions).active) out.push({ id: `finding:${f.id}`, kind: 'semantic_conflict', source: f.source || 'assessment', title: f.title, evidence: f.evidence, requiresDecision: true });   // O3: resolved findings are reported separately
  return out;
}

/**
 * A change to canon is a PROPOSAL bound to the current canon hash; it carries its full impact and needs an explicit
 * decision (P2-T04) before it becomes the canon. Editing a projection becomes a proposal for its authority.
 */
export function proposeCanonChange(bp, art, nextBible, { actor = 'operator', reason = '' } = {}) {
  const before = art.bible?.content || {}, changes = canonChanges(before, nextBible);
  const graph = buildGraph(bp, art), impact = impactOf(graph, changes, bp);
  const conflicts = changes.filter(c => c.detail?.firstAppearance).flatMap(c => firstAppearanceConflicts(bp, art, c.node.split(':')[2], c.detail.firstAppearance.after));
  return { kind: 'canon-change-proposal', baseCanonHash: canonRevision(art).hash, baseBibleVersion: art.bible?.version ?? null, proposedHash: canonicalHash(nextBible), changes, impact, conflicts, actor, reason, status: 'pending', requiresDecision: true, at: Date.now() };
}
