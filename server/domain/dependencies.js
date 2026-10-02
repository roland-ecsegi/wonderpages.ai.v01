/**
 * P2-T02 — typed dependency graph and deterministic impact (OUTPUT-06/11, ADR10).
 *
 * Nodes are stable slots: canon:<kind>:<id>, text:<v>:<p>, tr:<v>:<p>, scene:<v>:<p>, color:<v>:<p>,
 * line:<v>:<p>, layout:<v>:<p>, qa:text:<v>, qa:visual:<v>:<p>, book:<v>, delivery:<v>.
 * Edge types: semantic | visual | layout | localization | quality | release.
 * Impact never regenerates anything: it marks dependents `stale` (evidence no longer valid, approval needed again)
 * or `revalidate` (likely still valid, must be re-checked), and lists unaffected siblings explicitly.
 */
import { sceneFingerprint } from '../contracts.js';
import { canonicalHash } from './canonical.js';

export const EDGE_TYPES = Object.freeze(['semantic', 'visual', 'layout', 'localization', 'quality', 'release']);
const pageOf = (art, v, p) => (art[`final_${v}`] || art[`script_${v}`])?.content?.pages?.find(x => x.n === p) || null;
const ids = list => (Array.isArray(list) ? list : []).map(x => (typeof x === 'string' ? x : x?.id || x?.name)).filter(Boolean).map(s => String(s).toLowerCase());

/** Builds the graph from blueprint structure + current artifacts. Deterministic (sorted). */
export function buildGraph(bp, art) {
  const V = bp.structure.volumes, P = bp.structure.pages, edges = [];
  const add = (from, to, type) => edges.push({ from, to, type });
  const bible = art.bible?.content || {};
  const chars = ids(bible.characters), objs = ids(bible.objects), locs = ids(bible.world?.locations);
  for (let v = 0; v < V; v++) {
    for (let p = 1; p <= P; p++) {
      const pg = pageOf(art, v, p) || {};
      add(`text:${v}:${p}`, `tr:${v}:${p}`, 'localization');
      add(`text:${v}:${p}`, `layout:${v}:${p}`, 'layout'); add(`tr:${v}:${p}`, `layout:${v}:${p}`, 'layout');
      add(`text:${v}:${p}`, `qa:text:${v}`, 'quality'); add(`text:${v}:${p}`, `qa:visual:${v}:${p}`, 'quality');
      add(`scene:${v}:${p}`, `color:${v}:${p}`, 'visual'); add(`color:${v}:${p}`, `line:${v}:${p}`, 'visual');
      add(`color:${v}:${p}`, `layout:${v}:${p}`, 'layout'); add(`color:${v}:${p}`, `qa:visual:${v}:${p}`, 'quality'); add(`line:${v}:${p}`, `qa:visual:${v}:${p}`, 'quality');
      for (const c of ids(pg.characters)) if (chars.includes(c)) add(`canon:character:${c}`, `scene:${v}:${p}`, 'visual');
      for (const o of ids(pg.objects)) if (objs.includes(o)) add(`canon:object:${o}`, `scene:${v}:${p}`, 'semantic');
      const loc = String(pg.location || '').toLowerCase(); if (loc && locs.includes(loc)) add(`canon:location:${loc}`, `scene:${v}:${p}`, 'visual');
      add('canon:style', `color:${v}:${p}`, 'visual');
      for (const n of [`text:${v}:${p}`, `tr:${v}:${p}`, `color:${v}:${p}`, `line:${v}:${p}`, `layout:${v}:${p}`, `qa:visual:${v}:${p}`]) add(n, `book:${v}`, 'release');
    }
    add(`scene:${v}:0`, `color:${v}:0`, 'visual'); add('canon:style', `color:${v}:0`, 'visual'); add(`color:${v}:0`, `book:${v}`, 'release');
    add(`qa:text:${v}`, `book:${v}`, 'release'); add(`book:${v}`, `delivery:${v}`, 'release'); add('canon:bible', `delivery:${v}`, 'release');   // the canon is part of every delivery fingerprint
  }
  edges.sort((a, b) => (a.from + a.to + a.type).localeCompare(b.from + b.to + b.type));
  return { nodes: [...new Set(edges.flatMap(e => [e.from, e.to]))].sort(), edges, hash: canonicalHash(edges) };
}

const words = s => String(s || '').toLowerCase().normalize('NFC').match(/[\p{L}\p{N}’']+/gu) || [];
function editDistance(a, b) { if (a === b) return 0; const m = a.length, n = b.length; if (Math.abs(m - n) > 8) return 99; let prev = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[n]; }
/**
 * Classifies a page change: `none`, `exact_typo` (same words except ≤2 tokens each ≤2 edits away, no scene change),
 * `semantic_text` (meaning may change; scene contract unchanged), `scene_change` (scene fingerprint changed).
 */
export function classifyPageChange(before, after) {
  if (canonicalHash(before ?? null) === canonicalHash(after ?? null)) return 'none';
  if (sceneFingerprint(before || {}) !== sceneFingerprint(after || {}) && (before?.scene || after?.scene)) return 'scene_change';
  const a = words(before?.text), b = words(after?.text);
  if (a.length === b.length) {
    const diffs = a.map((w, i) => [w, b[i]]).filter(([x, y]) => x !== y);
    if (diffs.length <= 2 && diffs.every(([x, y]) => editDistance(x, y) <= 2)) return 'exact_typo';
  }
  return before?.scene || after?.scene ? 'semantic_text' : 'scene_change';   // legacy pages without a scene contract: text IS the scene
}

/* propagation rules per change kind: which edge types carry `stale` vs `revalidate` */
const RULES = {
  exact_typo: { stale: ['layout', 'release'], revalidate: ['localization', 'quality'] },
  semantic_text: { stale: ['localization', 'layout', 'quality', 'release'], revalidate: [] },
  scene_change: { stale: ['visual', 'localization', 'layout', 'quality', 'release'], revalidate: [] },
  canon_visual: { stale: ['visual', 'layout', 'quality', 'release'], revalidate: [] },
  canon_semantic: { stale: [], revalidate: ['semantic'] },
  canon_release: { stale: ['release'], revalidate: [] },
  style: { stale: ['visual', 'layout', 'quality', 'release'], revalidate: [] },
  color_only: { stale: ['visual', 'layout', 'quality', 'release'], revalidate: [] },
  line_only: { stale: ['quality', 'release'], revalidate: [] }
};
/**
 * Deterministic impact from changed nodes. `changes`: [{ node, kind }]. Downstream edges are followed;
 * a node reached only through `revalidate` edges is `revalidate`; once stale, everything downstream on
 * stale-carrying edges is stale. Returns sorted lists plus the explicitly unaffected sibling pages.
 */
export function impactOf(graph, changes, bp) {
  const out = new Map(graph.edges.map(e => [e.from, []])); for (const e of graph.edges) out.get(e.from).push(e);
  const stale = new Set(), reval = new Set(), changed = new Set(changes.map(c => c.node));
  for (const c of changes) {
    const rule = RULES[c.kind] || RULES.semantic_text;
    const queue = [[c.node, 'stale']];
    while (queue.length) {
      const [n, mode] = queue.shift();
      for (const e of out.get(n) || []) {
        // first hop: the rule of the change kind; later hops: the mode propagates (stale wins over revalidate)
        const carries = n === c.node ? (rule.stale.includes(e.type) ? 'stale' : rule.revalidate.includes(e.type) ? 'revalidate' : null) : mode;
        if (!carries) continue;
        if (carries === 'stale' && !stale.has(e.to)) { stale.add(e.to); reval.delete(e.to); queue.push([e.to, 'stale']); }
        else if (carries === 'revalidate' && !stale.has(e.to) && !reval.has(e.to)) { reval.add(e.to); queue.push([e.to, 'revalidate']); }
      }
    }
  }
  for (const n of changed) { stale.delete(n); reval.delete(n); }
  const pagesTouched = new Set([...changed, ...stale, ...reval].map(n => n.match(/^(?:text|tr|scene|color|line|layout|qa:visual):(\d+):(\d+)$/)).filter(Boolean).map(m => `${m[1]}:${m[2]}`));
  const unaffected = [];
  if (bp) for (let v = 0; v < bp.structure.volumes; v++) for (let p = 0; p <= bp.structure.pages; p++) if (!pagesTouched.has(`${v}:${p}`)) unaffected.push(`${v}:${p}`);
  return { changed: [...changed].sort(), stale: [...stale].sort(), revalidate: [...reval].sort(), unaffectedPages: unaffected, regenerates: [], note: 'Impactul marchează dovezi expirate; nu regenerează nimic automat.' };
}

/** Changes between two versions of a text artifact (script_/final_/tr_), page by page. */
export function textArtifactChanges(key, before, after) {
  const m = key.match(/^(script|final|tr)_(\d+)$/); if (!m) return [];
  const v = Number(m[2]), base = m[1] === 'tr' ? 'tr' : 'text', out = [];
  const pages = new Set([...(before?.pages || []), ...(after?.pages || [])].map(p => p.n));
  for (const n of [...pages].sort((a, b) => a - b)) {
    const b0 = before?.pages?.find(p => p.n === n), a0 = after?.pages?.find(p => p.n === n);
    const kind = classifyPageChange(b0, a0); if (kind === 'none') continue;
    if (base === 'tr') out.push({ node: `tr:${v}:${n}`, kind: kind === 'exact_typo' ? 'exact_typo' : 'semantic_text' });
    else { out.push({ node: `text:${v}:${n}`, kind }); if (kind === 'scene_change') out.push({ node: `scene:${v}:${n}`, kind }); }
  }
  return out;
}
/** Changes between two canon (bible) versions: characters/objects/locations/style by stable ID. */
export function canonChanges(before, after) {
  const out = [], h = x => canonicalHash(x ?? null);
  for (const [kind, sel, impact] of [['character', b => b?.characters, 'canon_visual'], ['object', b => b?.objects, 'canon_semantic'], ['location', b => b?.world?.locations, 'canon_visual']]) {
    const A = new Map((sel(before) || []).map(x => [String(x.id || x.name).toLowerCase(), x])), B = new Map((sel(after) || []).map(x => [String(x.id || x.name).toLowerCase(), x]));
    for (const id of new Set([...A.keys(), ...B.keys()])) if (h(A.get(id)) !== h(B.get(id))) {
      const firstMoved = kind === 'object' && A.get(id)?.introduced !== B.get(id)?.introduced;
      out.push({ node: `canon:${kind}:${id}`, kind: impact, detail: firstMoved ? { firstAppearance: { before: A.get(id)?.introduced ?? null, after: B.get(id)?.introduced ?? null } } : undefined });
    }
  }
  if (h(before?.style_guide) !== h(after?.style_guide)) out.push({ node: 'canon:style', kind: 'style' });
  if (out.length || h(before) !== h(after)) out.push({ node: 'canon:bible', kind: 'canon_release' });
  return out;
}

/** Continuity conflicts created by a first-appearance change: pages that show the object before it is introduced. */
export function firstAppearanceConflicts(bp, art, objectId, introduced) {
  const m = String(introduced || '').match(/(?:v|vol(?:umul)?\.?\s*)(\d+).*?(?:p|pag(?:ina)?\.?\s*)(\d+)/i); if (!m) return [];
  const [fv, fp] = [Number(m[1]) - 1, Number(m[2])], out = [];
  for (let v = 0; v <= fv && v < bp.structure.volumes; v++) for (let p = 1; p <= bp.structure.pages; p++) {
    if (v === fv && p >= fp) break;
    if (ids(pageOf(art, v, p)?.objects).includes(String(objectId).toLowerCase())) out.push({ page: `${v}:${p}`, object: objectId, issue: 'obiectul apare înaintea primei apariții declarate în canon' });
  }
  return out;
}
