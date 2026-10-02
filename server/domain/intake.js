/**
 * P4-T01 — guided idea/manuscript intake (OUTPUT-02/23).
 * - `inferFromText`: a LOCAL, deterministic proposal (no AI call, nothing created) that maps a free idea or a pasted
 *   manuscript to form values, each with its source; the operator confirms or cancels it in the form.
 * - `contractPreview`: what will be produced, shown BEFORE create/start (theme, age, languages, style, format, source,
 *   6×2×12 structure, editions) plus validation errors and a `formHash` bound to the product type version.
 * - limits are explicit: an over-long manuscript is refused with its limit, never cut silently.
 */
import { canonicalHash } from './canonical.js';

export const LIMITS = Object.freeze({ short_description: 2000, title: 160, additional_comments: 4000, seed_story: 20000 });
export const SOURCES = Object.freeze({ idea: 'idee scurtă', manuscript: 'manuscris propriu (volumul 1)', pack: 'pachet de antrenament', import: 'proiect importat', migration: 'migrare (proiect existent)' });

const fieldsOf = t => t?.input_schema?.fields || [];
const optLabel = (f, v) => (f?.options || []).find(o => o.value === v)?.label || v;

/** Length limits checked on the RAW input (before any defensive truncation). */
export function checkLimits(t, input) {
  const errors = [];
  for (const f of fieldsOf(t)) {
    const v = input?.[f.key], max = LIMITS[f.key];
    if (typeof v === 'string' && max && v.length > max) errors.push({ code: 'INPUT_TOO_LONG', field: f.key, limit: max, length: v.length, message: `„${f.label}” are ${v.length} caractere; limita este ${max}. Scurtează textul (nu îl tăiem în tăcere)${f.key === 'seed_story' ? ' sau împarte manuscrisul pe volume' : ''}.` });
  }
  return errors;
}

/** Same normalization the create route applies: languages ordered as in the contract; first = source, second = adaptation. */
export function normalizeInput(t, input) {
  const out = { ...(input || {}) };
  for (const f of fieldsOf(t)) if (f.type === 'languages') {
    const sel = (Array.isArray(out[f.key]) ? out[f.key] : []).filter(v => (f.options || []).some(o => o.value === v));
    const ordered = (f.options || []).map(o => o.value).filter(v => sel.includes(v));
    if (!ordered.length) throw { status: 400, code: 'LANGUAGES_EMPTY', message: `Alege cel puțin o limbă la „${f.label}”.` };
    out[f.key] = ordered; out.language = ordered[0]; out.second_language = ordered[1] || '';
  }
  return out;
}
export const formHash = (t, input) => canonicalHash({ type: t.slug, version: t.version, input: Object.fromEntries(Object.entries(input || {}).filter(([, v]) => v !== '' && v != null).sort(([a], [b]) => a.localeCompare(b))) });

/** Source of a new project: a manuscript when seed_story is present, otherwise an idea (pack/import/migration set elsewhere). */
export const sourceOf = (input, explicit = null) => (explicit && SOURCES[explicit] ? explicit : String(input?.seed_story || '').trim() ? 'manuscript' : 'idea');

export function contractPreview(t, rawInput, { contract = null, validate = null, editions = null, source = null } = {}) {
  const errors = [...checkLimits(t, rawInput)];
  let input = rawInput || {};
  try { input = normalizeInput(t, rawInput); } catch (e) { errors.push({ code: e.code, field: 'languages', message: e.message }); }
  for (const f of fieldsOf(t)) if (!['images', 'languages'].includes(f.type) && f.required && !String(input[f.key] ?? '').trim()) errors.push({ code: 'REQUIRED', field: f.key, message: `Câmpul „${f.label}” este obligatoriu.` });
  if (contract && validate) for (const e of validate(contract, input).errors) if (!errors.some(x => x.code === e.code)) errors.push(e);
  const F = k => fieldsOf(t).find(f => f.key === k);
  const langs = Array.isArray(input.languages) ? input.languages : [];
  const src = sourceOf(input, source);
  const ed = contract && editions && !errors.length ? editions(contract, langs) : null;
  return {
    schema: 'wonderpages.intake-preview/1', type: { slug: t.slug, name: t.full_name || t.name, version: t.version },
    theme: String(input.short_description || '').trim().slice(0, 400) || null, title: String(input.title || '').trim() || null,
    age: input.target_age ? { value: input.target_age, label: optLabel(F('target_age'), input.target_age) } : null,
    languages: langs.map((l, i) => ({ value: l, label: optLabel(F('languages'), l), role: i === 0 ? 'limba sursă' : 'adaptare naturală' })),
    style: input.visual_style ? { value: input.visual_style, label: optLabel(F('visual_style'), input.visual_style) } : null,
    format: input.page_format ? { value: input.page_format, label: optLabel(F('page_format'), input.page_format) } : null,
    source: { kind: src, label: SOURCES[src], manuscriptChars: String(input.seed_story || '').length || 0 },
    structure: t.structure ? { volumes: t.structure.volumes, pagesPerBook: t.structure.pages, books: ed ? ed.total : null, story: ed?.story ?? null, coloring: ed?.coloring ?? null } : null,
    valid: !errors.length, errors, formHash: errors.length ? null : formHash(t, input)
  };
}

/* ---------- local inference (proposal only) ---------- */
const AGE_WORDS = [[/\b(3|trei|three)\s*(?:[-–]|și|si|or|to|sau)\s*(4|patru|four)\b/i, '3-4'], [/\b(5|cinci|five)\s*(?:[-–]|și|si|or|to|sau)\s*(6|șase|sase|six)\b/i, '5-6'], [/\b(7|șapte|sapte|seven)\s*(?:[-–]|și|si|or|to|sau)\s*(8|opt|eight)\b/i, '7-8']];
const STYLE_WORDS = [[/acuarel|watercolou?r/i, 'watercolor'], [/gua[șsş]|gouache/i, 'gouache'], [/\b3\s*d\b|soft\s*3d|pixar|tridimensional/i, 'soft3d']];
const FORMAT_WORDS = [[/p[ăa]trat|square/i, 'square'], [/portret|portrait|vertical/i, 'portrait45']];
const LANG_WORDS = [[/(?<!\p{L})(rom[âa]n[ăa]|romana|romanian|românește|romaneste)(?!\p{L})/iu, 'Romanian'], [/(?<!\p{L})(englez[ăa]|engleza|english|englezește|englezeste)(?!\p{L})/iu, 'English']];

export function inferFromText(t, text) {
  const raw = String(text ?? ''); const s = raw.trim();
  if (!s) throw { status: 400, code: 'INTAKE_EMPTY', message: 'Scrie ideea sau lipește manuscrisul.' };
  const values = {}, sources = {}, warnings = [];
  const set = (k, v, how) => { const f = fieldsOf(t).find(x => x.key === k); if (!f) return; if (f.options && !(Array.isArray(v) ? v : [v]).every(x => f.options.some(o => o.value === x))) return; values[k] = v; sources[k] = how; };
  for (const [re, band] of AGE_WORDS) if (re.test(s)) { set('target_age', band, 'din text'); break; }
  if (!values.target_age) { const m = s.match(/\b(\d{1,2})\s*(?:ani|years?|yo)\b/i); if (m) { const n = Number(m[1]); const band = n >= 3 && n <= 4 ? '3-4' : n >= 5 && n <= 6 ? '5-6' : n >= 7 && n <= 8 ? '7-8' : null; if (band) set('target_age', band, 'din text'); else warnings.push({ code: 'AGE_UNSUPPORTED', message: `Vârsta ${n} ani nu este una dintre benzile produsului (3-4, 5-6, 7-8); alege banda manual.` }); } }
  const langs = []; for (const [re, l] of LANG_WORDS) { const m = s.search(re); if (m >= 0) langs.push([m, l]); }
  if (langs.length) { const only = /(?<!\p{L})(doar|numai|only)(?!\p{L})/iu.test(s); const ordered = langs.sort((a, b) => a[0] - b[0]).map(x => x[1]); set('languages', only ? ordered.slice(0, 1) : ordered, 'din text'); }
  for (const [re, v] of STYLE_WORDS) if (re.test(s)) { set('visual_style', v, 'din text'); break; }
  for (const [re, v] of FORMAT_WORDS) if (re.test(s)) { set('page_format', v, 'din text'); break; }
  const q = s.match(/[„"«]([^"”»\n]{2,80})["”»]/); if (q) set('title', q[1].trim(), 'din text (între ghilimele)');
  const sentences = s.split(/(?<=[.!?…])\s+/).filter(x => x.trim().length > 2);
  const manuscript = s.length > 600 && (sentences.length >= 8 || /\b(pagina|page)\s*1\b/i.test(s) || s.split(/\n\s*\n/).length >= 4);
  if (manuscript) {
    if (s.length > LIMITS.seed_story) warnings.push({ code: 'INPUT_TOO_LONG', field: 'seed_story', limit: LIMITS.seed_story, length: s.length, message: `Manuscrisul are ${s.length} caractere; limita este ${LIMITS.seed_story}. Scurtează-l sau împarte-l pe volume; nu îl tăiem în tăcere.` });
    else set('seed_story', s, 'textul lipit (manuscris)');
    let summary = ''; for (const x of sentences) { if ((summary + ' ' + x).length > 280) break; summary = (summary + ' ' + x).trim(); }
    set('short_description', summary || s.slice(0, 280), 'rezumat din primele fraze — verifică-l');
  } else {
    if (s.length > LIMITS.short_description) warnings.push({ code: 'INPUT_TOO_LONG', field: 'short_description', limit: LIMITS.short_description, length: s.length, message: `Ideea are ${s.length} caractere; limita este ${LIMITS.short_description}.` });
    else set('short_description', s, 'textul tău');
  }
  const missing = fieldsOf(t).filter(f => f.required && values[f.key] == null && f.default == null && f.type !== 'images').map(f => ({ field: f.key, label: f.label }));
  return { schema: 'wonderpages.intake-inference/1', kind: manuscript ? 'manuscript' : 'idea', values, sources, warnings, missing, note: 'Propunere locală, fără AI și fără crearea proiectului: confirmă sau renunță în formular.' };
}
