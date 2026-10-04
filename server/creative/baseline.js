/**
 * Creative Upgrade — the frozen BEFORE dossier of an existing collection (proposal input, comparison reference).
 * Read-only: it is computed from the project as it is and stored as an immutable, content-addressed document next to the
 * project (`projects/<pid>/creative/baselines/<hash>.json`), never inside its artifacts.
 *
 * Contents: product contract, artifact versions + content hashes, the inventory (volumes, 72 page plans, cast and its
 * appearances, canon: characters / locations / objects / world rules, manuscripts), the decisions already taken
 * (e.g. reconciliations), the deterministic findings (reconciliation report, canon conflicts with resolved findings kept
 * as history, collection QA, page-plan findings, open observations: payoff texts that differ from the manuscript and
 * page turns whose answer shares an opening), an INDEX of addressable elements (provenance for KEEP/IMPROVE/REPLACE/NEW)
 * and the project fingerprint the proposal is bound to. Nothing here is creative output.
 */
import { canonicalHash } from '../domain/canonical.js';
import { contractFromBlueprint } from '../domain/product-contract.js';
import { matrixForArtifacts } from '../domain/collection.js';
import { derivePageBlueprints, validatePageBlueprints } from '../domain/page-blueprints.js';
import { canonConflicts, findingStatus, projections } from '../domain/canon.js';
import { collectionQA } from '../quality/collection-qa.js';
import { destinationCheck, PROFILE_VERSIONS } from '../printprofile.js';
import { reconcileReport } from '../migration/dw-reconcile.js';

export const BASELINE_SCHEMA = 'wonderpages.creative-baseline/1';
const h = v => canonicalHash(v ?? null).slice(0, 24);
const ids = list => (Array.isArray(list) ? list : []).map(x => x?.id).filter(Boolean);

/** Content-bearing project state (what a proposal must never change): revision, status, approvals, stages, artifact
 *  versions and contents, decisions. Audit documents (context manifests, creative baselines/proposals) are excluded. */
export function projectFingerprint(project, art, decisions = []) {
  return canonicalHash({
    revision: project?.revision ?? 0, status: project?.status || null, approvals: project?.approvals || {}, stages: project?.stages || {}, gate: project?.gate || null,
    input: project?.input || null, canonFindings: project?.canonFindings || [], reconciledAt: project?.reconciledAt || null,
    artifacts: Object.fromEntries(Object.entries(art || {}).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, a]) => [k, [a?.version ?? null, h(a?.content)]])),
    decisions: decisions.map(d => d.id).sort()
  });
}

/** O1 (generic): the payoff description of a hook page differs between the plan and the manuscript. */
export function payoffMismatches(art, volumes = 6) {
  const out = [];
  for (let v = 0; v < volumes; v++) {
    const plan = art.series?.content?.volumes?.[v]?.page_plan || [], scr = art[`final_${v}`]?.content || art[`script_${v}`]?.content; if (!scr?.pages) continue;
    for (const pl of plan) { const pg = scr.pages.find(x => x.n === pl.n), a = pl.turn?.payoff, b = pg?.turn?.payoff; if (pg && pl.turn?.hook && a && b && String(a).trim() !== String(b).trim()) out.push({ volume: v + 1, page: pl.n, plan: a, manuscript: b }); }
  }
  return out;
}
/** O2 (generic): a hook whose answer shares an opening — per destination mapping and in the plan's own mapping. */
export function sharedOpenings(bp, pages) {
  const out = [], profiles = Object.keys(PROFILE_VERSIONS).filter(k => k === 'digital' || (bp.export?.presets || []).some(x => x.key === k)), book = (bp.structure?.books || [])[0];
  for (const key of profiles) for (let v = 1; v <= (bp.structure?.volumes || 6); v++) for (const l of destinationCheck({ count: bp.structure.pages, book, profile: key, blueprints: pages.filter(b => b.volume === v) }).leaks || []) out.push({ mapping: key, volume: v, page: l.page, payoffPage: l.payoffPage });
  return out;
}

export function buildBaseline({ project, bp, art, decisions = [], source = null }) {
  const contract = contractFromBlueprint(bp), V = bp.structure?.volumes || 6, P = bp.structure?.pages || 12;
  const series = art.series?.content || {}, bible = art.bible?.content || {}, cast = art.cast?.content || {};
  const { pages: pagePlans, sources: planSources } = derivePageBlueprints(bp, art);
  const matrix = matrixForArtifacts(bp, art);
  const manuscripts = {}; for (let v = 0; v < V; v++) { const s = art[`final_${v}`]?.content || art[`script_${v}`]?.content; if (s?.pages) manuscripts[v + 1] = { source: art[`final_${v}`] ? `final_${v}` : `script_${v}`, title: s.title || null, story_bible: s.story_bible || null, pages: s.pages.map(p => ({ n: p.n, text: p.text || '', text_ro: p.text_ro || null, characters: p.characters || [], objects: p.objects || [], location: p.location || null, turn: p.turn || null, page_turn: p.page_turn || null })) }; }
  const fs0 = findingStatus(project.canonFindings || [], decisions);
  const inventory = {
    series: { through_line: series.through_line || '', volumes: (series.volumes || []).map((x, i) => ({ n: x.number || i + 1, title: x.title || '', summary: x.summary || '', main_setting: x.main_setting || '', ending_type: x.ending_type || '', learning_goal: x.learning_goal || '', emotional_arc: x.emotional_arc || '', story_bible: x.story_bible || {} })) },
    pagePlans: pagePlans.map(p => ({ id: p.id, volume: p.volume, page: p.page, beat: p.beat, purpose: p.purpose, emotion: p.emotion, state: p.state, imageValue: p.imageValue, characters: p.characters, objects: p.objects, location: p.location, turn: p.turn })), planSources,
    cast: { characters: (cast.characters || []).map(c => ({ id: c.id, name: c.name, role: c.role || null, volumes: c.volumes || null })), appearances: (matrix.volumes || []).map(r => ({ volume: r.n, protagonist: r.protagonist, ...r.cast })) },
    canon: { characters: (bible.characters || []).map(c => ({ id: c.id, name: c.name, species: c.species || null, canonical_description: c.canonical_description || null, personality: c.personality || null, voice: c.voice || null, role: c.role || null })), locations: (bible.world?.locations || []).map(l => ({ id: l.id, name: l.name, description: l.description || l.canonical_description || null })), objects: (bible.objects || []).map(o => ({ id: o.id, name: o.name, canonical_description: o.canonical_description || null })), world_rules: bible.world_rules || {}, style_guide: bible.style_guide || null },
    manuscripts, brief: art.brief?.content ? { logline: art.brief.content.logline || '', narrative_rules: art.brief.content.narrative_rules || [], core_values: art.brief.content.core_values || [], age_application: art.brief.content.age_application || null } : null
  };
  /* every addressable element, the vocabulary of provenance (KEEP/IMPROVE/REPLACE must point to one of these) */
  const index = [
    { ref: 'series:through_line', kind: 'series', path: 'series.through_line' }, ...(art.brief ? [{ ref: 'brief', kind: 'brief', path: 'brief' }] : []),
    ...inventory.series.volumes.map(x => ({ ref: `volume:${x.n}`, kind: 'volume', path: `series.volumes[${x.n - 1}]` })),
    ...inventory.canon.characters.map(c => ({ ref: `character:${c.id}`, kind: 'character', path: `bible.characters[${c.id}]` })),
    ...inventory.canon.locations.map(l => ({ ref: `location:${l.id}`, kind: 'location', path: `bible.world.locations[${l.id}]` })),
    ...inventory.canon.objects.map(o => ({ ref: `object:${o.id}`, kind: 'object', path: `bible.objects[${o.id}]` })),
    ...Object.keys(inventory.canon.world_rules).map(k => ({ ref: `world_rule:${k}`, kind: 'world_rule', path: `bible.world_rules.${k}` })),
    ...pagePlans.map(p => ({ ref: `page_plan:${p.id}`, kind: 'page_plan', path: `pagePlans[${p.id}]` })),
    ...Object.entries(manuscripts).flatMap(([v, m]) => m.pages.map(p => ({ ref: `manuscript:V${v}-P${String(p.n).padStart(2, '0')}`, kind: 'manuscript_page', path: `${m.source}.pages[${p.n}]` })))
  ];
  const findings = {
    reconcile: (() => { try { return reconcileReport(art).conflicts.map(c => ({ id: c.id, kind: c.kind, title: c.title })); } catch { return []; } })(),
    canonActive: canonConflicts(bp, art, project.canonFindings || [], { decisions }).map(c => ({ id: c.id, kind: c.kind, field: c.field || null })),
    canonResolved: fs0.resolved.map(f => ({ id: f.id, title: f.title, resolvedBy: f.resolvedBy })),
    projections: projections(art).map(p => ({ field: p.field, status: p.status })),
    collectionQA: (() => { try { return (collectionQA({ bp, art, project }).issues || []).map(i => ({ code: i.code, severity: i.severity, message: i.message })); } catch { return []; } })(),
    pagePlans: validatePageBlueprints(pagePlans, { structure: bp.structure, bible }).findings.map(f => ({ code: f.code, severity: f.severity, page: f.page || null })),
    observations: { payoffMismatches: payoffMismatches(art, V), sharedOpenings: sharedOpenings(bp, pagePlans) }
  };
  const body = {
    schema: BASELINE_SCHEMA,
    project: { id: project.id, title: project.title || '', revision: project.revision ?? 0, status: project.status || null, ageBand: project.input?.[bp.variant_key] || null, languages: project.input?.languages || [project.input?.language, project.input?.second_language].filter(Boolean), source: project.source || null, originalSha256: project.migration?.sourceSha256 || null },
    contract: { hash: contract.contractHash, volumes: contract.structure.volumes, pagesPerBook: contract.structure.contentPagesPerBook, books: (bp.structure?.books || []).map(b => b.key), ageBands: contract.ageBands, languages: contract.languages },
    artifacts: Object.fromEntries(Object.entries(art).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, a]) => [k, { version: a.version ?? null, hash: h(a.content) }])),
    inventory, index, decisions: decisions.map(d => ({ id: d.id, kind: d.kind, state: d.state, actor: d.actor, scope: d.scope || null, at: d.at })),
    findings, counts: { volumes: inventory.series.volumes.length, pagePlans: pagePlans.length, characters: inventory.canon.characters.length, locations: inventory.canon.locations.length, objects: inventory.canon.objects.length, manuscriptVolumes: Object.keys(manuscripts).length, pagesPerBook: P },
    projectFingerprint: projectFingerprint(project, art, decisions), externalSource: source
  };
  return { ...body, hash: canonicalHash(body) };
}
export const baselineRel = (pid, hash) => `projects/${pid}/creative/baselines/${hash}.json`;
