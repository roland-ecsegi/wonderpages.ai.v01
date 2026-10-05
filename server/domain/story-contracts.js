/**
 * P4-T04 — story, age and localization contracts (OUTPUT-11/12, RK03/25 ADAPT).
 * Deterministic, citeable QA inputs for the critic and the reviewer (never a literary verdict):
 *  - causality: the manuscript proves goal → protagonist's choice → consequence, page by page, with exact quotes
 *    (declared in story_bible.causality, or inferred and marked as such);
 *  - age fit: real complexity per band (sentence length, long words, dialogue) against ORIENTATIVE budgets —
 *    never a rigid word cap; intentional wordless pages are allowed;
 *  - voice: narrative person/tense switches; science: known factual errors for children's themes; world (T18):
 *    natural effects not presented as magic unless the canon declares fantasy;
 *  - localization: page-aligned native edition (same pages, names kept, no untranslated function words, common
 *    English calques flagged in Romanian); no silent cutting between script → final → native edition.
 */
import { ageDimensions } from '../quality/semantic/age.js';
import { fidelityFindings } from '../quality/semantic/fidelity.js';
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const stripQuotes = s => String(s ?? '').replace(/[“"„«][^”"»]*[”"»]/g, ' ');
const words = s => (String(s ?? '').match(/[\p{L}\p{N}'’-]+/gu) || []);
const sentences = s => String(s ?? '').split(/(?<=[.!?…])\s+/).map(x => x.trim()).filter(x => words(x).length);
const SEV = { blocker: 3, major: 2, minor: 1 };

export function textMetrics(text) {
  const w = words(text), s = sentences(text);
  return { words: w.length, sentences: s.length, avgSentence: s.length ? Math.round(w.length / s.length * 10) / 10 : 0, longestSentence: Math.max(0, ...s.map(x => words(x).length)), longWordShare: w.length ? Math.round(w.filter(x => x.length >= 9).length / w.length * 100) / 100 : 0, dialogue: (String(text ?? '').match(/[“"„«]/g) || []).length > 0 };
}
/* orientative ceilings for the average sentence length per band; budgets are guidance (layout decides, P6) */
export const BAND = Object.freeze({ '3-4': { avgSentence: 10, longWordShare: 0.12 }, '5-6': { avgSentence: 14, longWordShare: 0.18 }, '7-8': { avgSentence: 20, longWordShare: 0.25 } });
export function volumeMetrics(pages) {
  const per = (pages || []).map(p => ({ n: p.n, wordless: p.page_type === 'wordless' || p.wordless === true, ...textMetrics(p.text) }));
  const all = per.filter(p => !p.wordless), W = all.reduce((a, p) => a + p.words, 0), S = all.reduce((a, p) => a + p.sentences, 0);
  return { pages: per, totalWords: W, avgSentence: S ? Math.round(W / S * 10) / 10 : 0, longWordShare: W ? Math.round(all.reduce((a, p) => a + p.longWordShare * p.words, 0) / W * 100) / 100 : 0, wordless: per.filter(p => p.wordless).map(p => p.n) };
}

/* ---------- causality: goal → choice → consequence with citeable evidence ---------- */
const overlap = (a, b) => { const A = new Set(words(norm(a)).filter(w => w.length > 3)), B = new Set(words(norm(b)).filter(w => w.length > 3)); let n = 0; for (const w of A) if (B.has(w)) n++; return A.size ? n / A.size : 0; };
const pageText = p => [p?.text, p?.scene, p?.purpose, p?.beat, ...(p?.actions || []).map(a => `${a.character || ''} ${a.action || ''}`)].filter(Boolean).join(' ');
export function causality(script, { bible = null, mainId = null, mainName = null } = {}) {
  const pages = script?.pages || [], sb = { ...(bible || {}), ...(script?.story_bible || {}) }, findings = [];
  const add = (code, severity, message, extra = {}) => findings.push({ code, severity, message, ...extra });
  const links = { goal: sb.goal, choice: sb.climax_choice || sb.choice, consequence: sb.resolution || sb.consequence };
  const declared = sb.causality && typeof sb.causality === 'object' ? sb.causality : null;
  const out = { mode: declared ? 'declared' : 'inferred', links: {} };
  const isMain = p => !mainId && !mainName ? true : (p?.actions || []).some(a => a.character === mainId) || (mainName && norm(p?.text).includes(norm(mainName))) || (p?.characters || []).includes(mainId);
  for (const [k, statement] of Object.entries(links)) {
    if (declared?.[k]) {
      const n = Number(declared[k].page), pg = pages.find(p => Number(p.n) === n), quote = String(declared[k].quote || '').trim();
      if (!pg) { add('CAUSALITY_PAGE', 'blocker', `Legătura „${k}” indică pagina ${declared[k].page}, care nu există.`, { link: k }); continue; }
      const found = quote && norm(pg.text).includes(norm(quote));
      if (!found) add('CAUSALITY_QUOTE', 'major', `Citatul pentru „${k}” nu se găsește pe pagina ${n}.`, { link: k, page: n, quote });
      out.links[k] = { page: n, quote: found ? quote : String(pg.text || '').slice(0, 120), exact: !!found };
    } else if (String(statement || '').trim()) {
      /* sequential: goal early, then the protagonist's choice after it, then the consequence after the choice */
      const after = k === 'choice' ? out.links.goal?.page || 1 : k === 'consequence' ? (out.links.choice?.page || Math.ceil(pages.length / 2)) + 1 : 1;
      const ranges = { goal: [1, Math.ceil(pages.length / 3)], choice: [Math.max(after + 1, Math.ceil(pages.length / 3)), pages.length - 1], consequence: [Math.max(after, Math.ceil(pages.length / 2)), pages.length] }[k];
      const cand = pages.filter(p => p.n >= ranges[0] && p.n <= ranges[1] && (k !== 'choice' || isMain(p))).map(p => ({ p, s: overlap(statement, pageText(p)) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s || (k === 'goal' ? a.p.n - b.p.n : b.p.n - a.p.n));
      if (cand.length) out.links[k] = { page: cand[0].p.n, quote: String(cand[0].p.text || '').slice(0, 120), exact: false, score: Math.round(cand[0].s * 100) / 100 };
    }
    if (!out.links[k]) add('CAUSALITY_UNPROVEN', 'blocker', `Manuscrisul nu arată pe nicio pagină legătura „${k}” (${String(statement || '—').slice(0, 80)}).`, { link: k, fix: 'Scrie momentul în pagină sau declară pagina și citatul în story_bible.causality.' });
  }
  const { goal, choice, consequence } = out.links;
  if (goal && choice && consequence && !(goal.page <= choice.page && choice.page < consequence.page)) add('CAUSALITY_ORDER', declared ? 'blocker' : 'major', `Ordinea paginilor nu este scop (${goal.page}) → alegere (${choice.page}) → consecință (${consequence.page}).`);
  if (choice && !isMain(pages.find(p => p.n === choice.page))) add('CHOICE_NOT_PROTAGONIST', 'major', `Alegerea de pe pagina ${choice.page} nu este făcută de protagonist.`, { page: choice.page });
  return { ...out, findings };
}

/* ---------- age fit (orientative), voice, science / world ---------- */
export function ageFit(pages, band, profile = {}) {
  const m = volumeMetrics(pages), t = BAND[band] || BAND['5-6'], findings = [];
  if (m.avgSentence > t.avgSentence * 1.25) findings.push({ code: 'AGE_COMPLEXITY', severity: 'major', message: `Propozițiile au în medie ${m.avgSentence} cuvinte, peste ce poate urmări vârsta ${band} (≈ ${t.avgSentence}).`, metric: m.avgSentence });
  if (m.longWordShare > t.longWordShare * 1.5) findings.push({ code: 'AGE_VOCABULARY', severity: 'minor', message: `${Math.round(m.longWordShare * 100)}% cuvinte lungi; pentru ${band} ar fi de așteptat sub ${Math.round(t.longWordShare * 100)}%.` });
  const wb = profile.word_budget, [lo, hi] = Array.isArray(wb) ? wb : wb && typeof wb === 'object' ? [wb.min ?? wb.low ?? wb[0], wb.max ?? wb.high ?? wb[1]] : [];
  if (hi && m.totalWords > hi * 1.5) findings.push({ code: 'BUDGET_GUIDANCE', severity: 'minor', message: `${m.totalWords} cuvinte în volum față de ghidul orientativ ${lo}–${hi}; macheta reală decide (nu se taie automat).` });
  if (lo && m.totalWords < lo * 0.5 && m.wordless.length < 3) findings.push({ code: 'BUDGET_GUIDANCE', severity: 'minor', message: `${m.totalWords} cuvinte, mult sub ghidul orientativ ${lo}–${hi}.` });
  /* OBS-GS-11: length is one proxy — the other dimensions are measured and reported separately (advisory signals) */
  const dims = ageDimensions((pages || []).filter(p => !(p.page_type === 'wordless' || p.wordless === true)).map(p => p.text || '').join(' '), band);
  findings.push(...dims.findings);
  return { metrics: m, dimensions: dims.dimensions, findings };
}
const PAST = /(?<![\p{L}])(was|were|had|did|went|said|saw|came|found|ran|looked|smiled|whispered)(?![\p{L}])/giu, PRESENT = /(?<![\p{L}])(is|are|has|does|goes|says|sees|comes|finds|runs|looks|smiles|whispers)(?![\p{L}])/giu;
const FIRST = { English: /(?<![\p{L}])(I|me|my|we|our|us)(?![\p{L}])/gu, Romanian: /(?<![\p{L}])(eu|noi|meu|mea|mei|nostru|noastră|noastra)(?![\p{L}])/giu };
export function voice(pages, language = 'English') {
  const findings = [], per = (pages || []).filter(p => String(p.text || '').trim()).map(p => { const t = stripQuotes(p.text); return { n: p.n, first: (t.match(FIRST[language] || FIRST.English) || []).length, past: language === 'English' ? (t.match(PAST) || []).length : 0, present: language === 'English' ? (t.match(PRESENT) || []).length : 0 }; });
  const firstPages = per.filter(p => p.first > 0).map(p => p.n), thirdPages = per.length - firstPages.length;
  if (firstPages.length && thirdPages && firstPages.length < per.length / 2) findings.push({ code: 'VOICE_SWITCH', severity: 'major', message: `Naratorul trece la persoana I pe pagina ${firstPages.join(', ')} (restul volumului este la persoana a III-a).`, pages: firstPages });
  const dom = p => (p.past >= 2 && p.past > p.present * 2 ? 'past' : p.present >= 2 && p.present > p.past * 2 ? 'present' : null);
  const tagged = per.map(p => ({ n: p.n, d: dom(p) })).filter(p => p.d), past = tagged.filter(p => p.d === 'past').length, pres = tagged.length - past;
  if (past && pres) { const minor = past < pres ? 'past' : 'present'; findings.push({ code: 'TENSE_SWITCH', severity: 'minor', message: `Timpul narațiunii se schimbă pe pagina ${tagged.filter(p => p.d === minor).map(p => p.n).join(', ')}.` }); }
  return { findings };
}
const SCIENCE = [
  { id: 'pterosaur-dinosaur', re: /(pterosaur\w*|pterodactyl\w*|pterozaur\w*|pterodactil\w*)[^.]{0,40}(dinosaur|dinozaur)|(flying dinosaur|dinozaur(ul|i)? zbur[aă]to)/i, fix: 'Pterozaurii nu sunt dinozauri: „reptilă zburătoare”, „pterozaur”.' },
  { id: 'humans-dinosaurs', re: /((people|humans|cave ?(man|men)|oameni|omul preistoric)[^.]{0,40}(dinosaur|dinozaur))|((dinosaur|dinozaur)\w*[^.]{0,40}(people|humans|oameni))/i, fix: 'Oamenii și dinozaurii (non-aviari) nu au trăit în aceeași epocă — doar dacă lumea este declarată fantastică.' },
  { id: 'bats-blind', re: /bats? (are|is) blind|lilieci[i]? (sunt|e) orbi/i, fix: 'Liliecii văd; folosesc și ecoul.' },
  { id: 'night-rainbow', re: /(rainbow[^.]{0,30}(at night|moonless))|(curcubeu[^.]{0,30}noaptea)/i, fix: 'Curcubeul apare în lumina soarelui (curcubeul lunar este un fenomen rar, de explicat).' },
  { id: 'sun-orbits', re: /sun (goes|moves|travels) (around|round) the earth|soarele se (învârte|invarte|rotește|roteste) (în|in) jurul p[aă]m[aâ]ntului/i, fix: 'Pământul se învârte în jurul Soarelui.' },
  { id: 'moon-light', re: /moon (makes|has) its own light|luna (are|face) lumin[aă] proprie/i, fix: 'Luna reflectă lumina Soarelui.' }
];
const MAGIC = /(magic|magical|spell|enchant|wizard|magie|magic[aă]|vr[aă]j|fermecat)/i;
export function science(pages, { world = 'natural' } = {}) {
  const findings = [];
  for (const p of pages || []) {
    const t = `${p.text || ''} ${p.scene || ''}`;
    for (const r of SCIENCE) { if (r.id === 'humans-dinosaurs' && world === 'fantasy') continue; const m = t.match(r.re); if (m) findings.push({ code: 'SCIENCE_CLAIM', severity: 'major', rule: r.id, page: p.n, quote: m[0], message: `Pagina ${p.n}: „${m[0]}” — ${r.fix}` }); }
    if (world === 'natural') { const m = `${p.text || ''} ${p.effects || ''}`.match(MAGIC); if (m || /^fantasy/i.test(String(p.effects || ''))) findings.push({ code: 'T18_WORLD', severity: 'major', page: p.n, quote: m?.[0] || p.effects, message: `Pagina ${p.n}: un efect prezentat ca magie într-o lume fără magie (T18).` }); }
  }
  return { findings };
}

/* ---------- localization: page-aligned native edition; no silent cutting ---------- */
/* known calques with their morphological / syntactic variants (OBS-GS-13: variant robustness; unseen calques are NOT covered) */
const CALQUES = [[/(?<![\p{L}])(face|facea|făcea|făcut|facut|fac|facem) sens/iu, 'are sens'], [/[iî]n ordine s[aă]/i, 'ca să'], [/(?<![\p{L}])avut (un|o) timp (bun|minunat|grozav|frumos|excelent)/iu, 's-au distrat'], [/la sf[aâ]r[sș]itul zilei/i, 'până la urmă'], [/este (tot|totul) despre/i, 'contează'], [/(?<![\p{L}])f[aă]c\p{L}* o decizie/iu, 'să ia o decizie'], [/(?<![\p{L}])(a lua|ia|iau|lu[aă]\p{L}*) o plimbare/iu, 'a se plimba'], [/bun diminea[tț]a/i, 'bună dimineața']];
export function localization(src, tr, { names = [], language = 'Romanian' } = {}) {
  const findings = [], sp = src?.pages || [], tp = tr?.pages || [];
  if (sp.length !== tp.length) findings.push({ code: 'TR_MISALIGNED', severity: 'blocker', message: `Ediția nativă are ${tp.length} pagini; originalul are ${sp.length}.` });
  for (const p of sp) {
    const t = tp.find(x => Number(x.n) === Number(p.n)), a = String(p.text || ''), wordless = p.page_type === 'wordless' || p.wordless === true;
    if (!t) { findings.push({ code: 'TR_MISALIGNED', severity: 'blocker', page: p.n, message: `Pagina ${p.n} lipsește din ediția nativă.` }); continue; }
    const b = String(t.text || '');
    if (!b.trim() && a.trim() && !wordless) findings.push({ code: 'TR_EMPTY', severity: 'blocker', page: p.n, message: `Pagina ${p.n} nu are text în ediția nativă.` });
    for (const nm of names) if (a.includes(nm) && !b.includes(nm)) findings.push({ code: 'TR_NAME', severity: 'major', page: p.n, message: `Pagina ${p.n}: numele „${nm}” lipsește (numele nu se traduc).` });
    if (language === 'Romanian') {
      for (const [re, fix] of CALQUES) { const m = b.match(re); if (m) findings.push({ code: 'TR_CALQUE', severity: 'major', page: p.n, quote: m[0], message: `Pagina ${p.n}: „${m[0]}” sună tradus din engleză; natural: „${fix}”.` }); }
      /* OBS-GS-13/14: contextual language identification, copied source tokens, lexicon-bounded fidelity */
      if (b.trim() && a.trim()) findings.push(...fidelityFindings(stripQuotes(a), stripQuotes(b), { names, page: p.n }).findings);
    }
  }
  return { findings };
}
export function silentCuts(before, after, label = 'versiunea finală') {
  const findings = [];
  for (const p of before?.pages || []) {
    const q = (after?.pages || []).find(x => Number(x.n) === Number(p.n)); if (!q) continue;
    const a = words(p.text).length, b = words(q.text).length;
    if (a >= 8 && b < a * 0.5 && !q.cut_note) findings.push({ code: 'TEXT_CUT', severity: 'major', page: p.n, message: `Pagina ${p.n}: ${label} are ${b} cuvinte față de ${a}; o tăiere de peste jumătate cere o notă explicită (nu tăiem în tăcere).` });
  }
  return { findings };
}

/** All story contracts for one volume (v is 0-based). */
export function storyContract({ bp, art, input = {}, v }) {
  const src = art[`final_${v}`]?.content || art[`script_${v}`]?.content; if (!src) return null;
  const chars = art.bible?.content?.characters || [], mainId = art.cast?.content?.main_character || chars.find(c => c.role === 'main')?.id || null;
  const main = chars.find(c => c.id === mainId), band = input[bp.variant_key || 'target_age'] || input.target_age;
  const world = /^(none|fara|no|nu)/i.test(norm(art.bible?.content?.world_rules?.magic || 'none')) ? 'natural' : 'fantasy';
  const volBible = art.series?.content?.volumes?.[v]?.story_bible || null;
  const parts = {
    causality: causality(src.story_bible ? src : { ...src, story_bible: art[`script_${v}`]?.content?.story_bible }, { bible: volBible, mainId, mainName: main?.name }),
    age: ageFit(src.pages, band, bp.age_profiles?.[band] || {}),
    voice: voice(src.pages, input.language || 'English'),
    science: science(src.pages, { world }),
    cuts: art[`final_${v}`] && art[`script_${v}`] ? silentCuts(art[`script_${v}`].content, art[`final_${v}`].content) : { findings: [] },
    localization: art[`tr_${v}`] ? localization(src, art[`tr_${v}`].content, { names: chars.map(c => c.name).filter(Boolean), language: input.second_language || 'Romanian' }) : null
  };
  if (art[`tr_${v}`]) parts.trCuts = silentCuts(src, art[`tr_${v}`].content, 'ediția nativă');
  const findings = Object.values(parts).filter(Boolean).flatMap(x => x.findings).sort((a, b) => SEV[b.severity] - SEV[a.severity] || (a.page || 0) - (b.page || 0));
  const blockers = findings.filter(f => f.severity === 'blocker').length;
  return { schema: 'wonderpages.story-contract/1', volume: v + 1, source: art[`final_${v}`] ? `final_${v}` : `script_${v}`, band, world, causality: { mode: parts.causality.mode, links: parts.causality.links }, metrics: parts.age.metrics, findings, summary: { blockers, major: findings.filter(f => f.severity === 'major').length, minor: findings.filter(f => f.severity === 'minor').length }, ready: blockers === 0 };
}
/** One-line warnings for the critic prompt (structured QA input, in English like the other warnings). */
export const criticNotes = sc => (sc?.findings || []).slice(0, 12).map(f => `[${f.code}${f.page ? ' p' + f.page : ''}] ${f.message}`);
