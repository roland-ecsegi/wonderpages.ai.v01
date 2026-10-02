/**
 * P1-T01 — ProductContract (OUTPUT-01/05, ADR04).
 *
 * Protected contract: one collection → six volumes → a Story Book and a Coloring Book in every volume →
 * 12 content pages in every book, plus covers. Age bands 3–4 / 5–6 / 7–8, one band per collection.
 * Language editions are variants of the same Story Book (not new Product Types); Coloring is language-independent.
 *
 * The contract is derived from the project's blueprint snapshot (legacy v13/v14/v15 snapshots stay readable
 * and identifiable through `blueprintVersion` + `blueprintHash`) and validated against the protected shape.
 * Rendering profiles carry explicit page semantics: `strict12` (default) and `legacy-scene-expansion`
 * (the historic KDP 28/26 presentation, opt-in only, never described as "12 physical pages").
 */
import { canonicalHash } from './canonical.js';
import { physicalPages } from '../printprofile.js';

export const CONTRACT_SCHEMA = 'wonderpages.product-contract/1';
export const PROTECTED = Object.freeze({
  productType: 'kids-sc',
  volumes: 6,
  contentPagesPerBook: 12,
  components: Object.freeze(['story', 'coloring']),
  ageBands: Object.freeze(['3-4', '5-6', '7-8'])
});
/* P1–P8 run exactly one ProductType (guardrail: product registry allowlist; more types only in P9-D). */
export const ALLOWED_PRODUCT_TYPES = Object.freeze([PROTECTED.productType]);
/* KDP paperback minimum interior page count for the usual ink options (ADR04, official KDP guidelines). */
export const KDP_MIN_INTERIOR_PAGES = 24;

const fieldOf = (bp, pred) => (bp?.input_schema?.fields || []).find(pred);

function renderingProfiles(bp) {
  const pages = bp?.structure?.pages, books = bp?.structure?.books || [];
  const ok = Number.isInteger(pages) && pages > 0;
  const physical = profile => Object.fromEntries(books.map(b => [b.key, ok ? physicalPages(pages, b.mode, profile, b.back_cover).length : null]));
  const map = profile => Object.fromEntries(books.map(b => [b.key, ok ? physicalPages(pages, b.mode, profile, b.back_cover).map((x, i) => ({ physical: i + 1, canonical: typeof x.pg === 'number' && x.pg > 0 ? x.pg : null, role: typeof x.pg === 'number' ? (x.pg === 0 ? 'front_cover' : x.illustrationOnly ? 'illustration' : x.textOnly ? 'text' : 'content') : String(x.pg) })) : []]));
  const presets = (bp?.export?.presets || []).map(p => p.key);
  const list = [];
  if (presets.includes('digital') || !presets.length) list.push({ key: 'digital', semantics: 'strict12', destination: 'digital', canonicalContentPages: pages, physicalPages: physical('digital'), pageMap: map('digital'), covers: 'in_book', explicitOptIn: false, kdpCompatible: false });
  if (presets.includes('print')) list.push({ key: 'print', semantics: 'strict12', destination: 'generic_print', canonicalContentPages: pages, physicalPages: physical('digital'), pageMap: map('digital'), covers: 'in_book', explicitOptIn: false, kdpCompatible: false, certified: false });
  if (presets.includes('kdp')) list.push({ key: 'kdp', semantics: 'legacy-scene-expansion', destination: 'kdp_paperback', canonicalContentPages: pages, physicalPages: physical('kdp'), pageMap: map('kdp'), covers: 'separate_wrap', explicitOptIn: true, requiresApproval: true, kdpCompatible: null });
  return list;
}

/** Builds the ProductContract of a blueprint snapshot. Pure; never mutates the blueprint. */
export function contractFromBlueprint(bp) {
  const S = bp?.structure || {};
  const age = fieldOf(bp, f => f.key === bp?.variant_key) || fieldOf(bp, f => f.key === 'target_age');
  const langs = fieldOf(bp, f => f.type === 'languages');
  const contract = {
    schema: CONTRACT_SCHEMA,
    productType: bp?.slug ?? null,
    structure: { volumes: S.volumes ?? null, contentPagesPerBook: S.pages ?? null, frontCover: !!S.cover },
    components: (Array.isArray(S.books) ? S.books : []).map(b => ({ key: b?.key ?? null, mode: b?.mode ?? null, perLanguage: !!b?.per_language, pageText: !!b?.page_text, backCover: !!b?.back_cover })),
    ageBands: (age?.options || []).map(o => o.value),
    ageSelection: 'one-band-per-collection',
    languages: (langs?.options || []).map(o => o.value),
    editionSemantics: 'language-variant-of-book',
    renderingProfiles: renderingProfiles(bp)
  };
  return { ...contract, contractHash: canonicalHash(contract), blueprintVersion: bp?.version ?? null, blueprintHash: canonicalHash(bp ?? null) };
}

/** Validates a contract against the protected shape. Returns { valid, errors:[{code,message}] }. */
export function validateContract(c) {
  const errors = [], err = (code, message) => errors.push({ code, message });
  if (!ALLOWED_PRODUCT_TYPES.includes(c?.productType)) err('PRODUCT_TYPE_NOT_ALLOWED', `Tipul de produs „${c?.productType}” nu este permis; P1–P8 folosesc numai ${ALLOWED_PRODUCT_TYPES.join(', ')}.`);
  if (c?.structure?.volumes !== PROTECTED.volumes) err('VOLUMES', `Colecția trebuie să aibă exact ${PROTECTED.volumes} volume (are ${c?.structure?.volumes ?? 'necunoscut'}).`);
  if (c?.structure?.contentPagesPerBook !== PROTECTED.contentPagesPerBook) err('PAGES', `Fiecare carte are exact ${PROTECTED.contentPagesPerBook} pagini de conținut (are ${c?.structure?.contentPagesPerBook ?? 'necunoscut'}).`);
  if (!c?.structure?.frontCover) err('COVER', 'Cărțile trebuie să aibă copertă.');
  const keys = (c?.components || []).map(x => x.key);
  for (const k of PROTECTED.components) if (!keys.includes(k)) err('COMPONENT_MISSING', `Lipsește componenta obligatorie „${k}”.`);
  for (const k of keys) if (!PROTECTED.components.includes(k)) err('COMPONENT_UNKNOWN', `Componentă necunoscută „${k}”.`);
  if (new Set(keys).size !== keys.length) err('COMPONENT_DUPLICATE', 'Componentă duplicată.');
  const story = c?.components?.find(x => x.key === 'story'), coloring = c?.components?.find(x => x.key === 'coloring');
  if (story && !story.perLanguage) err('STORY_EDITIONS', 'Story Book trebuie să aibă câte o ediție pentru fiecare limbă.');
  if (coloring && coloring.perLanguage) err('COLORING_LANGUAGE', 'Coloring Book este independent de limbă.');
  const ages = c?.ageBands || [];
  if (ages.length !== PROTECTED.ageBands.length || PROTECTED.ageBands.some(a => !ages.includes(a))) err('AGE_BANDS', `Benzile de vârstă sunt ${PROTECTED.ageBands.join(', ')} (contractul are ${ages.join(', ') || 'niciuna'}).`);
  if (!(c?.languages || []).length) err('LANGUAGES', 'Contractul nu definește nicio limbă.');
  return { valid: !errors.length, errors };
}

/** Validates the collection input of a project against its contract (one age band, ≥1 known language, no duplicates). */
export function validateProjectInput(c, input) {
  const errors = [], err = (code, message) => errors.push({ code, message });
  const age = input?.target_age;
  if (!c.ageBands.includes(age)) err('AGE_BAND', `Vârsta „${age ?? ''}” nu este una dintre benzile ${c.ageBands.join(', ')}.`);
  const langs = Array.isArray(input?.languages) ? input.languages : input?.language ? [input.language] : [];
  if (!langs.length) err('LANGUAGES_EMPTY', 'Alege cel puțin o limbă.');
  if (new Set(langs).size !== langs.length) err('LANGUAGES_DUPLICATE', 'O limbă este aleasă de două ori.');
  for (const l of langs) if (!c.languages.includes(l)) err('LANGUAGE_UNKNOWN', `Limba „${l}” nu este în contract.`);
  return { valid: !errors.length, errors };
}

/**
 * Editions of a collection. Story editions are per language; Coloring is one per volume.
 * EN+RO → 12 Story editions + 6 Coloring books = 18 digital books, still ONE Product Type.
 */
export function editionsFor(c, languages) {
  const langs = [...new Set(languages || [])], books = [];
  for (let v = 0; v < c.structure.volumes; v++) for (const comp of c.components) {
    if (comp.perLanguage) for (const language of langs) books.push({ volume: v + 1, book: comp.key, language, edition: `${comp.key}-${language}`, pages: c.structure.contentPagesPerBook });
    else books.push({ volume: v + 1, book: comp.key, language: null, edition: comp.key, pages: c.structure.contentPagesPerBook });
  }
  return { productTypes: 1, productType: c.productType, books, total: books.length, story: books.filter(b => b.book === 'story').length, coloring: books.filter(b => b.book === 'coloring').length };
}

/**
 * Profile compatibility (never "ready": readiness needs measurements, P6-T05). A strict12 interior is
 * incompatible with KDP paperback minimums; the legacy scene expansion is only usable when explicitly chosen.
 */
export function profileCompatibility(c, profileKey, destination = null) {
  const prof = c.renderingProfiles.find(p => p.key === profileKey);
  if (!prof) return { profile: profileKey, compatible: false, ready: false, status: 'unknown_profile', reasons: ['Profil necunoscut în contract.'] };
  const reasons = [];
  const wantsKdp = destination === 'kdp_paperback' || prof.destination === 'kdp_paperback';
  if (wantsKdp) {
    const tooShort = Object.entries(prof.physicalPages).filter(([, n]) => !(n >= KDP_MIN_INTERIOR_PAGES));
    if (prof.semantics === 'strict12') return { profile: profileKey, semantics: prof.semantics, compatible: false, ready: false, status: 'incompatible', reasons: [`Interiorul strict de ${c.structure.contentPagesPerBook} pagini este sub minimul KDP de ${KDP_MIN_INTERIOR_PAGES} pagini; nu se umple cu conținut artificial.`] };
    if (tooShort.length) reasons.push(`Sub minimul KDP: ${tooShort.map(([k, n]) => `${k}=${n}`).join(', ')}.`);
    if (prof.explicitOptIn) reasons.push('Prezentarea legacy-scene-expansion cere alegere explicită și aprobare separată; nu schimbă cele 12 pagini canonice.');
    return { profile: profileKey, semantics: prof.semantics, compatible: !tooShort.length, ready: false, status: tooShort.length ? 'incompatible' : 'requires_explicit_opt_in', reasons };
  }
  return { profile: profileKey, semantics: prof.semantics, compatible: true, ready: false, status: 'compatible_unverified', reasons: ['Compatibil ca semantică; readiness cere măsurători (P6-T05).'] };
}

/** One call for API/UI: contract + validation + editions of a project. */
export function projectContractReport(bp, project) {
  const contract = contractFromBlueprint(bp), validation = validateContract(contract);
  const input = validateProjectInput(contract, project?.input || {});
  return { contract, validation, input, editions: editionsFor(contract, project?.input?.languages || []), profiles: contract.renderingProfiles.map(p => profileCompatibility(contract, p.key)) };
}
