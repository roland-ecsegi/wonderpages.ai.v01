/**
 * Science claims (OBS-GS-15/16/17 + OBS-GS-7) — deterministic, structured, still heuristic:
 *   ENTITY      who/what the claim is about (bird vs pterosaur vs non-avian dinosaur; canonical species when the canon
 *               names a character), never the bare phrase alone;
 *   RELATION    co-occurrence ≠ relation: humans + dinosaurs in a sentence is a coexistence claim only when nothing
 *               mediates it (fossils, museum, model, book, study, pretend play…) and the world is not declared fantasy;
 *   POLARITY    a negated misconception is a correct statement ("Bats are not blind");
 *   STANCE      a misconception attributed as a belief and corrected in the same sentence is not asserted; a correction
 *               that comes later (next sentence / next page) → REVIEW (the correction-window policy is an operator decision);
 *               uncorrected narrator or character assertions → SCIENCE_CLAIM.
 * Claim families are concept-based (subject concept + predicate concept), with EN/RO forms; unseen concepts are not covered.
 */
import { fold, sentencesOf, wordsOf, negatedBefore } from './text.js';

const R = src => new RegExp(`(?<![\\p{L}])(?:${src})(?![\\p{L}])`, 'iu');
const DINO_EXCEPT = /(ichthyosaur|plesiosaur|mosasaur|pterosaur|pterozaur|pliosaur|ihtiozaur|plesiozaur)/i;
const isDinoWord = w => { const x = fold(w); if (DINO_EXCEPT.test(x)) return false; return /^(dinosaurs?|dinos?|dinozaur\p{L}*|t\.?\s?rex|tyrannosaur\p{L}*)$/u.test(x) || /(saurus|saurs?|ceratops|raptors?|zaur\p{L}*)$/.test(x) && x.length > 6; };
const hasDino = s => /t\.?\s?rex/i.test(s) || wordsOf(s).some(isDinoWord);
const HUMAN = R('people|persons?|humans?|cave ?m[ae]n|boys?|girls?|child|children|kids?|man|woman|men|women|oameni\\p{L}*|omul|oamenii|omul preistoric|baiat\\p{L}*|baieti\\p{L}*|fata|fete|fetit\\p{L}*|copil\\p{L}*|copii\\p{L}*');
const MEDIATED = R('fossils?|bones?|skeletons?|museums?|models?|toys?|statues?|pictures?|photos?|books?|films?|movies?|stud(?:y|ies|ied|ying)|learn\\p{L}*|dig\\p{L}*|dug|paleontolog\\p{L}*|extinct|millions of years ago|imagin\\p{L}*|dream\\p{L}*|pretend\\p{L}*|draw\\p{L}*|read\\p{L}*|love|loves|like|likes|costume|fosil\\p{L}*|oase|schelet\\p{L}*|muzeu\\p{L}*|jucari\\p{L}*|carte|carti|studiaz\\p{L}*|invat\\p{L}*|disparut\\p{L}*|imagineaz\\p{L}*|deseneaz\\p{L}*|citesc|citeste');
const BIRDS = R('birds?|pasari|pasarile|pasare|pasarea');
const CANON_BIRD = /(bird|sparrow|pigeon|robin|eagle|owl|parrot|duck|hen|chicken|penguin|crow|pasare|vrabie|porumbel|bufnita|vultur|papagal|rata|gaina)/i;
const CANON_PTERO = /(pterosaur|pterodactyl|pteranodon|quetzalcoatlus|pterozaur|pterodactil)/i;
const BELIEF = R("thinks?|thought|believes?|believed|used to believe|used to think|people long ago|long ago people|many people|some people|they say|people say|it was once believed|cred|credea|credeau|se credea|multi cred|unii cred|unii spun|demult");
const CORRECTION_GENERIC = R("but|however|actually|in fact|that's a myth|that is a myth|not true|dar|insa|de fapt|nu e adevarat|e un mit");
const LATER_CORRECTION = R("no|not true|that's a myth|that is a myth|actually|in fact|nu|nu e adevarat|e un mit|de fapt");

const FAMILIES = [
  { id: 'pterosaur-dinosaur', fix: 'Pterozaurii nu sunt dinozauri: „reptilă zburătoare”, „pterozaur”.',
    claim: (s, ctx) => {
      const f = fold(s), ptero = f.match(R('pterosaur\\p{L}*|pterodactyl\\p{L}*|pterozaur\\p{L}*|pterodactil\\p{L}*'));
      if (ptero && R('dinosaurs?|dinozaur\\p{L}*').test(f.slice(ptero.index + ptero[0].length)) && !/flying reptile|reptila zburatoare/.test(f)) return { index: ptero.index, match: ptero[0], negIndex: f.search(R('dinosaurs?|dinozaur\\p{L}*')) };
      const fd = f.match(/flying dinosaurs?|dinozaur(?:ul|ii|i)? zburat\p{L}*/u); if (!fd) return null;
      if (BIRDS.test(f)) return { resolved: 'bird' };   // birds are avian dinosaurs: not a misconception
      const named = (ctx.canon || []).find(c => f.includes(fold(c.name)));
      if (named && CANON_BIRD.test(String(named.species))) return { resolved: 'bird', canon: named.name };
      return { index: fd.index, match: fd[0], evidence: named && CANON_PTERO.test(String(named.species)) ? { referent: named.name, species: named.species, source: 'canon' } : { referent: 'unresolved', assumption: 'pterosaur (the common misconception the phrase usually names)' } };
    }, counter: R('not (?:a )?dinosaurs?|nu (?:este|sunt|e) (?:un )?dinozaur\\p{L}*|flying reptiles?|reptil\\p{L}* zburato\\p{L}*') },
  { id: 'humans-dinosaurs', world: true, fix: 'Oamenii și dinozaurii (non-aviari) nu au trăit în aceeași epocă — doar dacă lumea este declarată fantastică.',
    claim: s => { const f = fold(s); if (!hasDino(f)) return null; const h = f.match(HUMAN); if (!h) return null;
      if (R('never lived at the same time|did not live at the same time|millions of years apart|nu au trait (?:niciodata )?in acelasi timp').test(f)) return { resolved: 'denies coexistence (correct statement)' };
      if (MEDIATED.test(f) && !/(lived|au trait|traiau)\s/.test(f)) return { resolved: 'mediated' };
      return { index: h.index, match: h[0] + ' … dinosaur', negIndex: -1 }; },
    counter: R('never lived at the same time|millions of years apart|nu au trait in acelasi timp|nu au trait niciodata') },
  { id: 'bats-blind', fix: 'Liliecii văd; folosesc și ecoul.',
    claim: s => { const f = fold(s), b = f.match(R('bats?|lilieci\\p{L}*|liliac\\p{L}*')); if (!b) return null; const rest = f.slice(b.index);
      const blind = rest.match(R('blind|orbi|orb')); if (blind) return { index: b.index, match: b[0] + ' … ' + blind[0], negIndex: b.index + blind.index };
      const see = rest.match(R("(?:cannot|can't|can not|don't|do not|never|nu (?:pot )?)\\s*(?:\\p{L}+\\s)?(?:see|vad|vede|vedea)")); if (see) return { index: b.index, match: b[0] + ' … ' + see[0], negIndex: -1 };
      return null; }, counter: R("(?:bats? )?can see|see (?:quite |very )?well|are not blind|aren't blind|vad|pot vedea|nu sunt orbi") },
  { id: 'sun-orbits', fix: 'Pământul se învârte în jurul Soarelui.',
    claim: s => { const f = fold(s), m = f.match(/(?<![\p{L}])(?:the )?sun\s+(?:\p{L}+\s+)?(?:goes|go|went|moves?|moved|travels?|travelled|circles?|circled|orbits?|orbited|revolves?|revolved|turns?|spins?)\s+(?:all\s+)?(?:a?round|about)\s+(?:the\s+)?earth|(?<![\p{L}])(?:the )?sun\s+(?:\p{L}+\s+)?(?:circles?|circled|orbits?|orbited)\s+(?:the\s+)?earth|soarele\s+se\s+(?:invarte|roteste|misca)\s+(?:in jurul|imprejurul)\s+pamantului/u);
      return m ? { index: m.index, match: m[0], negIndex: m.index + m[0].search(/goes|go|went|mov|travel|circl|orbit|revolv|turn|spin|invarte|roteste|misca/) } : null; },
    counter: R('earth (?:goes|moves|travels|circles|orbits|revolves) (?:a?round|about) the sun|pamantul se (?:invarte|roteste) (?:in jurul|imprejurul) soarelui') },
  { id: 'moon-light', fix: 'Luna reflectă lumina Soarelui.',
    claim: s => { const f = fold(s), m = f.match(R('moon|luna')); if (!m) return null; const rest = f.slice(m.index);
      const own = rest.match(/(?:makes|has|produces|shines with|glows with|with)\s+(?:a\s+)?(?:its\s+|her\s+)?own\s+(?:\p{L}+\s+)?light|light of its own|(?:glows|shines|lights up)\s+by itself|lumina?\s+proprie|propria\s+(?:ei\s+)?lumin\p{L}*|lumin\p{L}* proprie|straluceste singura/u);
      return own ? { index: m.index, match: m[0] + ' … ' + own[0], negIndex: m.index + own.index } : null; },
    counter: R('reflects?|reflected|lit by the sun|light from the sun|reflecta|lumina soarelui|luminata de soare') },
  { id: 'night-rainbow', fix: 'Curcubeul apare în lumina soarelui (curcubeul lunar este un fenomen rar, de explicat).',
    claim: s => { const m = fold(s).match(/(rainbow[^.]{0,30}(at night|moonless))|(curcubeu[^.]{0,30}noaptea)/); return m ? { index: m.index, match: m[0], negIndex: m.index } : null; }, counter: /$^/ }
];
const MAGIC = /(magic|magical|spell|enchant|wizard|magie|magic[aă]|vr[aă]j|fermecat)/i;

/** pages: [{ n, text, scene?, effects? }]; world: 'natural' | 'fantasy'; canon: [{ name, species }] */
export function scienceFindings(pages, { world = 'natural', canon = [] } = {}) {
  const findings = [], mitigated = [];
  (pages || []).forEach((p, pi) => {
    const t = `${p.text || ''} ${p.scene || ''}`.trim(), sents = sentencesOf(t), nextPage = sentencesOf((pages[pi + 1]?.text) || '');
    sents.forEach((s, si) => {
      for (const fam of FAMILIES) {
        if (fam.world && world === 'fantasy') continue;
        const c = fam.claim(s, { canon }); if (!c) continue;
        if (c.resolved) { mitigated.push({ rule: fam.id, page: p.n, outcome: c.resolved, quote: s }); continue; }
        const f = fold(s);
        if (c.negIndex >= 0 && negatedBefore(f, c.negIndex + 1) && !/(cannot|can't|can not|nu pot)/.test(f.slice(c.index, c.negIndex + 1))) { mitigated.push({ rule: fam.id, page: p.n, outcome: 'negated (correct statement)', quote: s }); continue; }
        const corrected = (BELIEF.test(f) || CORRECTION_GENERIC.test(f)) && fam.counter.test(f.slice(c.index + 1));
        if (corrected) { mitigated.push({ rule: fam.id, page: p.n, outcome: 'attributed belief, corrected in the same sentence', quote: s }); continue; }
        const nextSent = fold(sents[si + 1] || ''), np = fold(nextPage[0] || '');
        const laterHere = nextSent && (fam.counter.test(nextSent) || (LATER_CORRECTION.test(nextSent) && /\b(see|vad|light|lumin|around|jurul|dinosaur|dinozaur)/.test(nextSent)));
        const laterPage = !laterHere && np && fam.counter.test(np);
        if (laterHere || laterPage) { findings.push({ code: 'SCIENCE_REVIEW', severity: 'minor', rule: fam.id, page: p.n, quote: c.match, scope: laterHere ? 'same-page' : 'next-page', operatorDecision: 'concepție greșită corectată ulterior: PASS / REVIEW / alt verdict; fereastra de corectare (OBS-GS-17)', message: `Pagina ${p.n}: „${c.match}” e corectat ${laterHere ? 'în propoziția următoare' : 'pe pagina următoare'} — verifică dacă lecția e clară pentru vârstă.` }); continue; }
        const speaker = /(said|says|told|asked|shouted|whispered|laughed|a spus|spuse|zise|a zis|a strigat)/.test(f) ? 'character' : 'narrator';
        findings.push({ code: 'SCIENCE_CLAIM', severity: 'major', rule: fam.id, page: p.n, quote: c.match, speaker, ...(c.evidence ? { evidence: c.evidence } : {}), message: `Pagina ${p.n}: „${c.match}” — ${fam.fix}` });
      }
    });
    if (world === 'natural') { const m = `${p.text || ''} ${p.effects || ''}`.match(MAGIC); if (m || /^fantasy/i.test(String(p.effects || ''))) findings.push({ code: 'T18_WORLD', severity: 'major', page: p.n, quote: m?.[0] || p.effects, message: `Pagina ${p.n}: un efect prezentat ca magie într-o lume fără magie (T18).` }); }
  });
  return { findings, mitigated };
}
