/**
 * Age-fit dimensions (OBS-GS-11) — sentence length is ONE proxy among several. Each dimension is measured separately and
 * reported with its own code, so a report says exactly which property was detected (never "age appropriate"):
 *   AGE_SYNTAX           relative / subordinate clauses per sentence (nesting)
 *   AGE_ABSTRACTION      abstract cognition about abstract concepts (whether time / reality / existence …)
 *   AGE_TEMPORAL_CAUSAL  temporal + causal connectives in one sentence
 *   AGE_DENSITY          many listed items in one sentence
 *   AGE_EMOTION          intense emotion words
 * Thresholds are per band and ORIENTATIVE (not validated); the new signals are advisory (minor) — whether any of them
 * should block is an operator decision. Not modelled: vocabulary familiarity, visual support, working memory directly.
 */
import { fold, wordsOf, sentencesOf } from './text.js';

const R = src => new RegExp(`(?<![\\p{L}])(?:${src})(?![\\p{L}])`, 'giu');
const RELATIVE = R('who|whom|whose|which|care|pe care|caruia|careia|carora');
const RELATIVE_THAT = /(?<![\p{L}])(?:the|a|an|this|my|his|her|its|our|their|some) \p{L}+ that (?=\p{L})/giu;   // "that" after a determiner + noun = relative pronoun
const SUBORD = R('because|although|though|unless|whether|if|since|while|until|before|after|when|whereas|deoarece|pentru ca|fiindca|desi|daca|pana cand|inainte sa|inainte de|dupa ce|in timp ce|cand');
const TEMPORAL = R('before|after|until|since|while|when|then|later|earlier|meanwhile|once|inainte|dupa|pana|in timp ce|cand|apoi|mai tarziu|intre timp');
const CAUSAL = R('because|so that|therefore|since|as a result|so|deoarece|pentru ca|fiindca|asa ca|de aceea|prin urmare');
const ABSTRACT_VERB = R('wonders?|wondered|questions?|questioned|thinks? about|ponders?|asks? (?:herself|himself|itself)|se intreaba|se intreba|se gandeste|isi pune intrebarea');
const ABSTRACT_NOUN = R('whether|real|reality|exist|exists|existence|truth|meaning|infinity|forever|idea|concept|soul|mind|daca|exista|realitate|adevar\\p{L}*|sens(?:ul)?|infinit|idee|gandire|suflet');
const ABSTRACT_CORE = R('time|timpul|yesterday|ieri|tomorrow|maine');
const EMOTION = R('terrif(?:ied|ying)|horrif(?:ied|ying)|terror|sobb(?:ed|ing) in terror|in despair|devastated|panic(?:ked)?|nightmares?|ingrozit\\p{L}*|groaza|teroare|disperare|panica|cosmar\\p{L}*');
const BAND = Object.freeze({ '3-4': { syntax: 2, tc: 2, density: 3, abstraction: 1, emotion: true }, '5-6': { syntax: 3, tc: 3, density: 4, abstraction: 1, emotion: true }, '7-8': { syntax: 4, tc: 4, density: 5, abstraction: 2, emotion: false } });
const count = (re, s) => (s.match(re) || []).length;

export function ageDimensions(text, band = '5-6') {
  const t = BAND[band] || BAND['5-6'], per = sentencesOf(text).map(s => fold(s)), findings = [];
  const syntax = Math.max(0, ...per.map(s => count(RELATIVE, s) + count(RELATIVE_THAT, s) + count(SUBORD, s))), tc = Math.max(0, ...per.map(s => count(TEMPORAL, s) + count(CAUSAL, s)));
  const density = Math.max(0, ...per.map(s => (s.match(/,/g) || []).length));
  const abstraction = per.reduce((n, s) => n + (count(ABSTRACT_VERB, s) > 0 && (count(ABSTRACT_NOUN, s) + count(ABSTRACT_CORE, s)) >= 1 ? 1 : 0), 0) + per.reduce((n, s) => n + (count(ABSTRACT_NOUN, s) >= 3 ? 1 : 0), 0);
  const emotion = per.some(s => count(EMOTION, s) > 0);
  const f = (code, value, threshold, message) => findings.push({ code, severity: 'minor', advisory: true, layer: 'structured', value, threshold, message });
  if (syntax >= t.syntax) f('AGE_SYNTAX', syntax, t.syntax, `O propoziție are ${syntax} subordonate/relative; pentru ${band} structura ar trebui să fie mai simplă.`);
  if (abstraction >= t.abstraction) f('AGE_ABSTRACTION', abstraction, t.abstraction, `Concept abstract (gândire despre timp/realitate/existență) greu de urmărit la ${band}.`);
  if (tc >= t.tc) f('AGE_TEMPORAL_CAUSAL', tc, t.tc, `${tc} relații temporale/cauzale într-o singură propoziție, mult pentru ${band}.`);
  if (density >= t.density) f('AGE_DENSITY', density, t.density, `O propoziție enumeră multe elemente (${density + 1}); densitate mare pentru ${band}.`);
  if (emotion && t.emotion) f('AGE_EMOTION', 1, 1, `Emoție foarte intensă pentru ${band} (vezi și poarta de siguranță).`);
  return { dimensions: { syntax, abstraction, temporalCausal: tc, density, emotion }, findings };
}
