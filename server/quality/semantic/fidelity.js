/**
 * Localization fidelity (OBS-GS-13/14) — lexicon-bounded and deterministic:
 *  - contextual language identification: a token that is a valid word in both languages ("are", "a", "in") is decided by
 *    its sentence, never flagged from a word list alone (OBS-GS-14); English-only function words stay flagged;
 *  - untranslated content: a target token copied verbatim from the source, not a name, with English orthography;
 *  - fidelity: concepts found on both sides (CONCEPTS) → changed action, omission, unsupported addition; negation count.
 * Only what the lexicon covers is judged; the result says how much it could compare (never "translation verified").
 */
import { fold, wordsOf, lemma, sentencesOf, languageOf, EN_FUNCTION } from './text.js';
import { CONCEPTS } from './lexicon-bilingual.js';

/* common Romanian words that are also English words (computed overlap below is what makes them ambiguous) */
const RO_COMMON = new Set(['are', 'a', 'am', 'an', 'in', 'sat', 'pe', 'la', 'cu', 'de', 'o', 'nu', 'da', 'e', 'si', 'mi', 'ti', 'era', 'fi', 'ce', 'cum', 'ca', 'sa', 'se', 'te', 'ne', 'vi', 'le', 'li', 'lui', 'ei', 'el', 'ea', 'noi', 'voi', 'ai', 'au', 'un', 'cel', 'cea', 'tot', 'bun', 'mare', 'mic', 'bine', 'ani', 'zi', 'acum', 'apoi', 'dar', 'iar', 'sub', 'pana']);
export const AMBIGUOUS = new Set([...EN_FUNCTION].filter(w => RO_COMMON.has(w)));
const EN_ONLY_FUNCTION = ['the', 'and', 'with', 'of', 'is', 'you', 'this', 'that', 'was', 'were'];   // the v1 list minus the computed ambiguous tokens
const EN_ORTHO = /(th|wh|sh|ck|oo|ee|w|y|k|q)|(?:ies|ing|ed|ness|ful|ly)$|[^aeiouăâîs]s$/i;
const NEG_EN = /(?<![\p{L}])(not|never|no|nobody|nothing|cannot)(?![\p{L}])|n['’]t(?![\p{L}])/giu, NEG_RO = /(?<![\p{L}])(nu|niciodata|nimeni|nimic|nici)(?![\p{L}])|(?<![\p{L}])n-/giu;

function conceptsOf(text, lang) {
  const found = new Map(); let f = ' ' + fold(text).replace(/[^\p{L}\s'-]/gu, ' ').replace(/\s+/g, ' ') + ' ';
  if (lang === 'ro') {   // multiword phrases first, consumed so their words are not counted twice
    for (const c of CONCEPTS) for (const form of c.ro.filter(x => x.includes(' '))) { const k = ' ' + form + ' '; if (f.includes(k)) { found.set(c.id, c); f = f.split(k).join(' '); } }
    for (const w of wordsOf(f)) for (const c of CONCEPTS) if (c.ro.some(r => (r.endsWith('*') ? w.startsWith(r.slice(0, -1)) : w === r))) found.set(c.id, c);
  } else for (const w of wordsOf(f)) { const l = lemma(w); for (const c of CONCEPTS) if (c.en.includes(l) || c.en.includes(w)) found.set(c.id, c); }
  return found;
}
const counted = c => c.type !== 'light';

/** language of a target sentence from unambiguous cues only: RO diacritics/function words/lexicon forms/morphology vs
 *  English-only function words; tokens valid in both languages never vote */
export function targetLanguage(text) {
  if (/[ăâîșşțţ]/i.test(String(text ?? ''))) return 'ro';
  let ro = conceptsOf(text, 'ro').size, en = 0;
  for (const w of wordsOf(fold(text))) { if (AMBIGUOUS.has(w)) continue; if (EN_ONLY_FUNCTION.includes(w)) en += 2; else if (RO_COMMON.has(w) || /(?:ea|ul|ele|ilor|este|eaza|ati|iti|esc)$/.test(w)) ro++; }
  return ro >= en ? 'ro' : 'en';
}

/** findings for one aligned page pair (source EN → target RO) */
export function fidelityFindings(srcText, tgtText, { names = [], page = null } = {}) {
  const out = [], strip = s => names.reduce((x, n) => x.split(n).join(' '), String(s ?? ''));
  const src = strip(srcText), tgt = strip(tgtText);
  /* language identification in context */
  const tWords = wordsOf(tgt), sentLang = targetLanguage(tgt);
  const fn = tWords.find(w => EN_ONLY_FUNCTION.includes(w.toLowerCase()) || (AMBIGUOUS.has(w.toLowerCase()) && sentLang === 'en' && tWords.length > 2));
  if (fn) out.push({ code: 'TR_UNTRANSLATED', severity: 'major', page, quote: fn, layer: 'structured', message: `Pagina ${page}: cuvântul englezesc „${fn}” a rămas netradus.` });
  const srcSet = new Set(wordsOf(fold(src)));
  const copied = tWords.find(w => w.length >= 3 && srcSet.has(fold(w)) && EN_ORTHO.test(w) && !EN_ONLY_FUNCTION.includes(w.toLowerCase()) && !/^\p{Lu}/u.test(w));
  if (copied && copied !== fn) out.push({ code: 'TR_UNTRANSLATED', severity: 'major', page, quote: copied, layer: 'structured', message: `Pagina ${page}: „${copied}” e copiat din original, netradus.` });
  /* fidelity on the concepts both sides can express */
  const S = conceptsOf(src, 'en'), T = conceptsOf(tgt, 'ro'), add = (code, msg, extra) => out.push({ code, severity: 'minor', advisory: true, page, layer: 'lexicon-bounded', message: `Pagina ${page}: ${msg}`, ...extra });
  const missing = [...S.values()].filter(c => counted(c) && !T.has(c.id)), extra = [...T.values()].filter(c => counted(c) && !S.has(c.id));
  const mA = missing.filter(c => c.type === 'action'), xA = extra.filter(c => c.type === 'action');
  if (mA.length && xA.length) add('TR_MEANING_CHANGED', `acțiunea „${mA[0].id}” din original apare ca „${xA[0].id}”.`, { from: mA[0].id, to: xA[0].id });
  const mQ = missing.filter(c => c.type === 'quality'), xQ = extra.filter(c => c.type === 'quality');
  if (mQ.length && xQ.length) add('TR_MEANING_CHANGED', `„${mQ[0].id}” din original apare ca „${xQ[0].id}”.`, { from: mQ[0].id, to: xQ[0].id });
  const omitted = missing.filter(c => c.type === 'object' || (c.type === 'action' && !xA.length) || (c.type === 'quality' && !xQ.length));
  const added = extra.filter(c => c.type === 'object' || (c.type === 'action' && !mA.length) || (c.type === 'quality' && !mQ.length));
  if (omitted.length) add('TR_OMISSION', `lipsește din traducere: ${omitted.map(c => c.id).join(', ')}.`, { concepts: omitted.map(c => c.id) });
  if (added.length) add('TR_ADDITION', `apare în traducere fără să fie în original: ${added.map(c => c.id).join(', ')}.`, { concepts: added.map(c => c.id) });
  const nS = (src.match(NEG_EN) || []).length, nT = (fold(tgt).match(NEG_RO) || []).length;
  if ((nS > 0) !== (nT > 0)) add('TR_NEGATION_CHANGED', nS ? 'negația din original lipsește din traducere.' : 'traducerea adaugă o negație care nu e în original.', { source: nS, target: nT });
  return { findings: out, coverage: { sourceConcepts: [...S.keys()], targetConcepts: [...T.keys()], sourceWords: wordsOf(src).length } };
}
