/**
 * Deterministic, language-aware text structure shared by the hardened evaluators (safety, age, localization, science).
 * It is a STRUCTURED HEURISTIC layer, not semantic understanding: sentences → clauses → tokens with lemmas (EN, rule-based)
 * and diacritic-insensitive stems (RO), negation and its scope, contrast/prohibition markers. Raw text is kept so that
 * meaning-bearing Romanian diacritics (urât ≠ urat) can still be consulted where they matter (OBS-GS-9).
 */
export const fold = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const lower = s => String(s ?? '').toLowerCase().normalize('NFC');
export const sentencesOf = s => String(s ?? '').split(/(?<=[.!?…])\s+/).map(x => x.trim()).filter(Boolean);
export const wordsOf = s => String(s ?? '').match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) || [];

/* ---------- language identification (coarse, per text) ---------- */
const RO_FUNCTION = new Set(['si', 'nu', 'pe', 'cu', 'la', 'de', 'din', 'in', 'un', 'o', 'este', 'era', 'sunt', 'se', 'ca', 'sa', 'care', 'dar', 'iar', 'mai', 'lui', 'ei', 'lor', 'il', 'le', 'am', 'au', 'ai', 'ati', 'pentru', 'spre', 'dupa', 'cand', 'apoi', 'foarte', 'tot', 'toti', 'toate', 'acum', 'azi', 'aici', 'unde', 'ce', 'cum', 'fara', 'printre', 'langa', 'sub', 'peste']);
const EN_FUNCTION = new Set(['the', 'and', 'with', 'of', 'is', 'are', 'you', 'this', 'that', 'was', 'were', 'he', 'she', 'it', 'they', 'his', 'her', 'their', 'a', 'an', 'to', 'in', 'on', 'at', 'for', 'from', 'by', 'but', 'then', 'not', 'into', 'onto', 'over', 'under', 'has', 'have', 'had', 'will', 'can', 'does', 'did', 'my', 'your', 'our', 'its', 'what', 'who', 'which', 'when', 'where', 'why', 'how', 'all', 'some', 'very', 'so', 'just', 'too', 'out', 'up', 'down', 'off', 'there', 'here', 'be', 'been', 'am']);
/** tokens that exist as function words in BOTH languages (computed, not hand-picked): ambiguous, decided by context */
export const SHARED_FUNCTION = new Set([...EN_FUNCTION].filter(w => RO_FUNCTION.has(w)));
export function languageOf(text) {
  const raw = String(text ?? ''); if (/[ăâîșşțţ]/i.test(raw)) return 'ro';
  const w = wordsOf(fold(raw)); let ro = 0, en = 0;
  for (const x of w) { if (SHARED_FUNCTION.has(x)) continue; if (RO_FUNCTION.has(x)) ro++; if (EN_FUNCTION.has(x)) en++; }
  return ro > en ? 'ro' : 'en';
}
export { RO_FUNCTION, EN_FUNCTION };

/* ---------- English lemmatizer (rule-based + irregular table; systematic, not per-case) ---------- */
const IRREGULAR = { ate: 'eat', eaten: 'eat', swam: 'swim', swum: 'swim', fed: 'feed', hid: 'hide', hidden: 'hide', lit: 'light', ran: 'run', shot: 'shoot', took: 'take', taken: 'take', rode: 'ride', ridden: 'ride', fought: 'fight', held: 'hold', gave: 'give', given: 'give', went: 'go', gone: 'go', saw: 'see', seen: 'see', found: 'find', flew: 'fly', flown: 'fly', fell: 'fall', fallen: 'fall', made: 'make', said: 'say', told: 'tell', thought: 'think', brought: 'bring', caught: 'catch', bit: 'bite', bitten: 'bite', drank: 'drink', drunk: 'drink', sang: 'sing', sat: 'sit', stood: 'stand', threw: 'throw', thrown: 'throw', wore: 'wear', left: 'leave', met: 'meet', led: 'lead', lost: 'lose', kept: 'keep', slept: 'sleep', felt: 'feel', got: 'get', put: 'put', dove: 'dive', dived: 'dive', climbed: 'climb', is: 'be', are: 'be', was: 'be', were: 'be', am: 'be', been: 'be', has: 'have', had: 'have', does: 'do', did: 'do', done: 'do', children: 'child', men: 'man', women: 'woman', people: 'person', mice: 'mouse', geese: 'goose', teeth: 'tooth', feet: 'foot', leaves: 'leaf', wolves: 'wolf', knives: 'knife', berries: 'berry', cries: 'cry', cried: 'cry', flies: 'fly', ladies: 'lady' };
const KEEP = new Set(['glass', 'grass', 'class', 'bus', 'gas', 'yes', 'this', 'his', 'is', 'was', 'has', 'does', 'always', 'news', 'lens', 'chess', 'dress', 'less', 'moss', 'boss', 'kiss', 'miss', 'cross', 'pass', 'mess', 'princess', 'thing', 'nothing', 'something', 'anything', 'everything', 'king', 'ring', 'string', 'spring', 'wing', 'swing', 'sing', 'bring', 'morning', 'evening', 'ceiling', 'during', 'red', 'bed', 'shed', 'need', 'seed', 'feed', 'speed', 'weed', 'reed', 'bread', 'head', 'dead', 'thread', 'sled', 'hundred', 'blessed', 'naked', 'wicked', 'sacred', 'tired', 'bus', 'its', 'us', 'plus', 'dinosaurus']);
export function lemma(word) {
  const w = String(word).toLowerCase().replace(/['’]s$/, ''); if (IRREGULAR[w]) return IRREGULAR[w]; if (KEEP.has(w) || w.length <= 3) return w;
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (/(ss|sh|ch|x|z|o)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) return w.slice(0, -1);
  if (w.endsWith('ied')) return w.slice(0, -3) + 'y';
  if (w.endsWith('ing') && w.length > 5) { let b = w.slice(0, -3); if (/(.)\1$/.test(b) && !/(ll|ss|zz)$/.test(b)) b = b.slice(0, -1); else if (/[^aeiou][aeiou][bcdfgkmnprstvz]$/.test(b) && !/(en|er|on)$/.test(b)) b += 'e'; return b; }
  if (w.endsWith('ed') && w.length > 4) { let b = w.slice(0, -2); if (/(.)\1$/.test(b) && !/(ll|ss|zz)$/.test(b)) b = b.slice(0, -1); else if (/[^aeiou][aeiou][bcdfgkmnprstvz]$/.test(b) || /(at|iz|bl|cl|gl|pl|tl|rc|ng|dg|rs|ok|in|us|rv|ag)$/.test(b) && !/(ing|ang|ong)$/.test(b)) b += 'e'; return b; }
  return w;
}

/* ---------- clauses, negation, contrast ---------- */
const CLAUSE_SPLIT = /\s*[;:—–]\s*|\s*,\s*(?=(?:and then|then|so|but|yet|and|or|who|which|apoi|dar|însă|insa|iar|și|si|așa că|asa ca|care|ca să|ca sa)\b)|\s+(?=(?:and then|then|but|yet|and|or|apoi|dar|însă|insa|iar|și|si)\s)/iu;
export function clausesOf(sentence) { return String(sentence ?? '').split(CLAUSE_SPLIT).map(x => x.replace(/^(and then|then|so|but|yet|and|or|apoi|dar|însă|insa|iar|și|si|așa că|asa ca)\s+/iu, '').trim()).filter(x => wordsOf(x).length); }
export const NEGATORS_EN = /(?<![\p{L}])(not|never|no one|nobody|neither|nor|cannot)(?![\p{L}])|n['’]t(?![\p{L}])/iu;
export const NEGATORS_RO = /(?<![\p{L}])(nu|niciodată|niciodata|nimeni|nici)(?![\p{L}])|(?<![\p{L}])n-/iu;
export const isNegated = clause => NEGATORS_EN.test(clause) || NEGATORS_RO.test(clause);
/** the negator precedes the matched position inside the same clause (scope = this clause only) */
export function negatedBefore(clause, index) { const head = String(clause).slice(0, Math.max(0, index)); return NEGATORS_EN.test(head) || NEGATORS_RO.test(head) || /(?<![\p{L}])(never|niciodată|niciodata)(?![\p{L}])/iu.test(clause); }
export const DESPITE = /(?<![\p{L}])(anyway|regardless|even though|despite|still did|oricum|totuși|totusi|în ciuda|in ciuda|deși|desi)(?![\p{L}])/iu;
export const PROHIBITION = /(?<![\p{L}])(says? no|said no|tells? \w+ not to|told \w+ not to|forbids?|forbade|warns?|warned|spune nu|a spus nu|zice nu|interzice|a interzis|nu (are|au) voie|l-a avertizat|a avertizat)(?![\p{L}])/iu;
