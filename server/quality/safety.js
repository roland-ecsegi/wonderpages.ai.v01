/**
 * P5-T01 — independent child-safety gate (OUTPUT-14/15, RK20 SURPASS); hardened in policy version 2 (Gold-v1 evidence,
 * OBS-GS-1…10, records/HARDENING.md).
 * Safety is a separate verdict, never a score: PASS / REVIEW / BLOCK / UNKNOWN for every subject (page text, scene,
 * native edition, cover text, image, project input). A high critic average can never compensate a safety failure.
 *  - BLOCK: cannot be overridden (fix the content); REVIEW / UNKNOWN: an adult operator review on the CURRENT hash
 *    may clear it, recorded as a decision (this is operator review, not testing with families).
 *  - Images carry the art director's `safety` verdict from visual QA; without it (or without art) they are UNKNOWN.
 *
 * Version 2 replaces sentence-wide keyword exceptions with a structured (still deterministic, heuristic) analysis:
 * sentence → clauses → ACTION (lemmatised EN / stemmed RO) → OBJECT in the same clause → MODIFIERS of THAT action
 * (negation attached to it, prohibition ignored, asking first, active supervision vs an adult merely present, a warning
 * elsewhere) → character capability (aquatic species) → STANCE (stereotype promoted / contested / situational) → verdict
 * with a stable reason code. A safety word anywhere in the sentence no longer cancels a hazard (OBS-GS-1); "unsafe"
 * (kind: safety) and "prohibited by WonderPages editorial policy" (kind: policy) are reported separately (OBS-GS-8).
 * Unresolved editorial policies return REVIEW with an explicit `operatorDecision` instead of guessing PASS/BLOCK.
 */
import { sha256 } from '../domain/canonical.js';
import { fold, lower, sentencesOf, clausesOf, wordsOf, lemma, negatedBefore, DESPITE, PROHIBITION } from './semantic/text.js';

export const SAFETY_POLICY = Object.freeze({ id: 'wonderpages.safety-policy', version: 2 });
const rank = { PASS: 0, UNKNOWN: 1, REVIEW: 2, BLOCK: 3 };
export const worst = vs => vs.reduce((a, b) => (rank[b] > rank[a] ? b : a), 'PASS');
const R = (src, flags = 'iu') => new RegExp(`(?<![\\p{L}])(?:${src})(?![\\p{L}])`, flags);

/* ---------- action finder: EN by lemma, RO by diacritic-free stem; returns the first match position in the clause ---------- */
function findAction(clause, { en = [], ro = [] }) {
  const f = fold(clause), re = /[\p{L}]+(?:['’][\p{L}]+)*/gu; let m;
  while ((m = re.exec(f))) { const w = m[0]; if (en.includes(lemma(w)) || ro.some(s => w.startsWith(s))) return { index: m.index, word: clause.substr(m.index, w.length) }; }
  return null;
}
const after = (clause, idx, re) => { const f = fold(clause).slice(idx), m = f.match(re); return m ? { index: idx + m.index, word: m[0] } : null; };

/* ---------- context markers (folded text) ---------- */
const ADULT = '(?:a |an |the |his |her |their |its |my |your )?(?:grown-?ups?|adults?|mum|mom|mommy|mummy|dad|daddy|parents?|grandma|grandpa|granny|grandad|teacher|ranger|farmer \\w+)';
const ADULT_RO = '(?:un adult|o adulta|adultul|adultii|mama|mami|tata|tati|bunica|bunicul|parintii|parintele|educatoarea|invatatoarea|un om mare|pădurarul|padurarul)';
const ASK = R(`asks?|asked|asking|checks? with|cere voie|a cerut voie|intreaba|a intrebat|intreb`);
const ASK_ADULT = new RegExp(`(?<![\\p{L}])(?:asks?|asked|asking|checks? with)\\s+${ADULT}|(?:intreaba|a intrebat|cere voie)(?:\\s+(?:pe )?${ADULT_RO})?`, 'iu');
const SUPERVISION = R(`holding (?:him|her|them|it)|holds (?:his|her|their) hand|hand in hand|helps (?:him|her|them)|helping (?:him|her|them)|watching (?:him|her|them) closely|il tine de mana|o tine de mana|ii tine de mana|o tine|il tine|o sustine|il sustine|il ajuta|o ajuta|supravegheaza|supravegheat`);
const PRESENT = new RegExp(`(?<![\\p{L}])(?:with|near|beside|next to)\\s+${ADULT}|while\\s+${ADULT}|${ADULT}\\s+(?:is |was )?(?:nearby|reads? nearby|watches tv)|(?<![\\p{L}])cu\\s+${ADULT_RO}|(?:langa|in timp ce)\\s+${ADULT_RO}`, 'iu');
const WARNING = R(`dangerous|not safe|unsafe|must not|never (?:do|play|touch|eat|climb)|periculos|periculoasa|nu e voie|nu este voie|nu se face|nu e bine`);
const AQUATIC = R(`fish|fishes|little fish|trout|salmon|shark|whale|dolphin|octopus|crab|seal|turtle|mermaid|peste|pestele|pestisor|pestisorul|rechin|rechinul|balena|delfin|caracatita|caracatita|focă|foca|broasca testoasa`);
const CANON_AQUATIC = /(fish|trout|salmon|shark|whale|dolphin|octopus|crab|seal|turtle|mermaid|peste|pestisor|rechin|balena|delfin|caracatita|foca)/i;

/* ---------- imitable hazards (category dangerous_imitation) ---------- */
const HAZARDS = [
  { id: 'fire-play', verdict: 'BLOCK', fix: 'Un copil poate imita: arată regula de siguranță sau scoate momentul.',
    find: c => { let a = findAction(c, { en: ['play'], ro: ['joac', 'juca', 'jucat', 'jucam', 'jucau'] }), o = a && after(c, a.index, R('fire|matches|match|a lighter|lighter|focul|foc|chibrit\\p{L}*|brichet\\p{L}*')); if (o) return { a, o };
      a = findAction(c, { en: ['light', 'strike'], ro: ['aprind', 'aprins'] }); o = a && after(c, a.index, R('a match|the match|matches|match|chibrit\\p{L}*')); if (o) return { a, o };
      const b = fold(c).match(R('bricheta|brichete')); return b ? { a: { index: b.index, word: b[0] }, o: { index: b.index, word: b[0] } } : null; } },
  { id: 'heights-window', verdict: 'BLOCK', fix: 'Fără cățărat pe fereastră/balcon/aragaz fără un adult și fără regula de siguranță.',
    find: c => { const a = findAction(c, { en: ['climb'], ro: ['urc', 'catar', 'cater'] }), o = a && after(c, a.index, R('window sill|window|sill|balcony|railing|stove|pervaz|pervazul|geam|geamul|fereastra|ferestre|balustrada|balustradei|balcon|balconului|aragaz|aragazul')); return o ? { a, o } : null; } },
  { id: 'swallow', verdict: 'BLOCK', fix: 'Obiectele mici nu se înghit: reformulează fără imitabil.',
    find: c => { const a = findAction(c, { en: ['swallow'], ro: ['inghit'] }), o = a && after(c, a.index, R('(?:small |tiny |little )?(?:coin|coins|button|buttons|battery|batteries|magnet|magnets|bead|beads)|moned\\p{L}*|nastur\\p{L}*|bateri\\p{L}*|magnet\\p{L}*|marg\\p{L}*')); return o ? { a, o } : null; } },
  { id: 'bag-fridge', verdict: 'BLOCK', fix: 'Ascunzătorile periculoase nu apar ca joacă.',
    find: c => { const f = fold(c), bag = f.match(/plastic bag over (his|her|its|their) head|punga (de plastic )?pe cap/); if (bag) return { a: { index: bag.index, word: bag[0] }, o: { index: bag.index, word: bag[0] } };
      const a = findAction(c, { en: ['hide'], ro: ['ascund', 'ascuns'] }), o = a && after(c, a.index, R('fridge|freezer|washing machine|dryer|frigider|congelator|masina de spalat')); return o ? { a, o } : null; } },
  { id: 'unknown-food', verdict: 'BLOCK', fix: 'Ciupercile/fructele necunoscute nu se mănâncă: arată că întreabă un adult.',
    find: (c, ctx) => { const a = findAction(c, { en: ['eat', 'taste', 'chew', 'munch'], ro: ['manc', 'manan', 'gust'] }); if (!a) return null;
      const FOOD = R('berry|berries|mushrooms?|toadstools?|fruits?|ciuperc\\p{L}*|fruct\\p{L}*|bace|boabe'), UNK = R('strange|unknown|wild|odd|mysterious|ciudat\\p{L}*|necunoscut\\p{L}*|salbatic\\p{L}*'), SRC = R('(?:from|in|off|by) (?:the |a )?(?:forest|woods|bush)|din padure|din tufis');
      const o = after(c, a.index, FOOD); if (o) { const f = fold(c); return UNK.test(f) || SRC.test(f) ? { a, o } : null; }
      const pron = after(c, a.index, R('them|it|le|o|ii')), s = fold(ctx.sentence);   // pronoun object: resolve to a food item in the same sentence
      return pron && FOOD.test(s) && (UNK.test(s) || SRC.test(s)) ? { a, o: pron } : null; } },
  { id: 'stranger', verdict: 'BLOCK', fix: 'Nu pleacă cu un străin.',
    find: c => { const a = findAction(c, { en: ['go', 'walk', 'leave', 'run'], ro: ['plec', 'merg', 'merse', 'pleaca'] }), o = a && after(c, a.index, R('with (?:a |the )?stranger|cu (?:un |o )?strain\\p{L}*')); return o ? { a, o } : null; } },
  { id: 'water-alone', verdict: 'REVIEW', water: true, fix: 'Apa adâncă doar cu un adult.',
    find: c => { let a = findAction(c, { en: ['swim'], ro: ['inot'] }), o = a && after(c, a.index, R('alone|all alone|by (?:him|her|it)self|singur|singura')); if (o) return { a, o };
      a = findAction(c, { en: ['jump'], ro: ['sare', 'sarit', 'sar '] }); o = a && after(c, a.index, R('into (?:the )?(?:deep )?(?:river|lake)|in (?:rau|lac)')); return o ? { a, o } : null; } }
];

/* ---------- other families ---------- */
const GORE = R('bloody?|bleed(?:ing|s)?|gore|sange|sangera|kill(?:s|ed|ing)?|murder\\p{L}*|omoar\\p{L}*|ucide|ucis|dead body|cadavru|stab(?:bed|bing|s)?|injunghi\\p{L}*');
const TOY_WEAPON = R('water ?guns?|toy ?guns?|squirt ?guns?|nerf ?guns?|cap ?guns?|pistol(?:ul|ae)? cu apa|pistol(?:ul)? de jucarie|arm(?:a|e) de jucarie');
const FIREARM = R('guns?|rifles?|pistols?|revolvers?|shotguns?|bombs?|grenades?|arma de foc|arme de foc|pusca|pusti|pistol(?:ul|ul sau)?|bomba|grenada|grenade');
const RO_WEAPON = R('arm(?:a|ele|ă|e)');
const FICTIONAL = R('lasers?|blasters?|ray ?guns?|phasers?');
const VIOLENT = R('shoot\\p{L}*|shot|fire[sd]?|firing|aim(?:s|ed|ing)?|point(?:s|ed|ing)? (?:a |the |his |her |their )?\\p{L}* at|raise[sd]? (?:his|her|their|a|the) \\p{L}+ at|at the|attack\\p{L}*|threaten\\p{L}*|zap\\p{L}*|trage|tras|trag|indreptat|a indreptat|amenint\\p{L}*|atac\\p{L}*');
const STEREO_SUBJ = R('girls?|boys?|women|men|fetele|fete|fetitele|fetita|baietii|baieti|baietelul|o fata|un baiat');
const STEREO_PRED = R(`can't|cannot|can not|are (?:too |so |very )?(?:weak|bad at|not good at|scared of everything)|(?:don't|do not|never) cry|nu pot|nu plang|nu plange|sunt (?:prea |asa de )?(?:slabe|slabi)|nu sunt (?:bune|buni) la`);
const STEREO_FIXED = R('like a girl|ca o fata');
const EPISODIC = R('today|tonight|now|right now|this time|because|while it|azi|astazi|acum|diseara|pentru ca|fiindca|deoarece|e furtuna|este furtuna');
const INCLUSIVE = R('everyone|everybody|anyone|anybody|all children|both girls and boys|both boys and girls|girls and boys|boys and girls|toata lumea|toti copiii|oricine|si fetele si baietii|si baietii si fetele|fetele si baietii|baietii si fetele|toti pot');
const INSULT_EN = R('stupid|idiot|dumb|fatty|ugly');
const INSULT_RO = R('prost(?:ul|ule|ut|ii|i)?|proasta|tampit\\p{L}*|grasan\\p{L}*');
const INSULT_RO_2P = R('(?:esti|sunteti|tu esti)\\s+(?:foarte |asa de |atat de |cam )?(?:urat|urata|urati|urate)|uratule|urato');
const SUBSTANCES = R('beers?|wine|vodka|alcohol|drunk|cigarettes?|cigars?|smok(?:es|ing) a (?:pipe|cigar|cigarette)|bere|vin(?:ul)? rosu|alcool|tigar\\p{L}*');
const FEAR = R('terrif(?:ied|ying)|horrif(?:ied|ying)|nightmares?|monster attack|scream(?:s|ed)? in terror|groaza|teroare|cosmar\\p{L}*|urla de frica|ingrozit\\p{L}*|atacul monstrului|un atac al monstrului|pierdut pentru totdeauna|lost forever|nobody will ever find');
const FEAR_CONTEXT = R('dark|alone|night|lost|monster|wolves|intuneric|singur\\p{L}*|noapte|pierdut|monstr\\p{L}*|lupi');
const RECOVERY = R('hug(?:s|ged)?|turned on the light|felt safe|calmed? down|smiled again|safe again|imbratis\\p{L}*|a aprins lumina|s-a linistit|era din nou in siguranta');

/** Text verdict with citeable findings and the mitigations that explain a PASS (reasons are kept for both). */
export function textSafety(text, { age = null, canon = null } = {}) {
  const findings = [], mitigated = [], sents = sentencesOf(text);
  const canonAquatic = new Set((canon?.characters || []).filter(c => CANON_AQUATIC.test(String(c.species || ''))).map(c => fold(c.name)));
  const push = (f, sent) => findings.push({ quote: sent.slice(0, 160), ...f });
  sents.forEach((sent, si) => {
    const fs = fold(sent), cls = clausesOf(sent), next = sents[si + 1] || '';
    /* --- imitable hazards, per clause --- */
    cls.forEach((c, ci) => {
      for (const h of HAZARDS) {
        const hit = h.find(c, { sentence: sent }); if (!hit) continue;
        const base = { rule: h.id, category: 'dangerous_imitation', kind: 'safety', layer: 'structured', match: hit.o.word || hit.a.word, fix: h.fix };
        if (negatedBefore(c, hit.a.index)) { mitigated.push({ rule: h.id, outcome: 'negated', reasonCode: 'SAFETY_HAZARD_NEGATED', quote: c }); continue; }
        const gerund = /^(?:\p{L}+ing|to \p{L}+)\b/iu.test(fold(c).slice(Math.max(0, hit.a.index - 3)).trim()) && hit.a.index <= 3 || /(?<![\p{L}])to\s*$/.test(fold(c).slice(0, hit.a.index));
        if (gerund && WARNING.test(fold(c))) { mitigated.push({ rule: h.id, outcome: 'warning_statement', reasonCode: 'SAFETY_WARNING_STATEMENT', quote: c }); continue; }
        const prev = cls.slice(0, ci).join(' '), despite = DESPITE.test(fold(c)) || (PROHIBITION.test(fold(prev)) && !negatedBefore(c, hit.a.index));
        if (h.water) {   // character capability (OBS-GS-4): natural water behaviour of an aquatic character is not an imitation risk
          const aquatic = AQUATIC.test(fs) || [...canonAquatic].some(n => fs.includes(n));
          if (aquatic) { const distress = /alone|singur/.test(fs) && /(dark|deep|intuneric|adanc)/.test(fs) && (age === '3-4' || age == null); if (distress) push({ ...base, rule: 'distress-context', category: 'developmental_fit', verdict: 'REVIEW', reasonCode: 'SAFETY_DISTRESS_CONTEXT', fix: 'Separare de părinte în apă adâncă și întunecată: intensitate de verificat pentru vârstă.' }, sent); else mitigated.push({ rule: h.id, outcome: 'aquatic_character', reasonCode: 'SAFETY_CHARACTER_CAPABILITY', quote: c }); continue; }
        }
        if (despite) { push({ ...base, verdict: h.verdict, reasonCode: 'SAFETY_HAZARD_DESPITE_PROHIBITION' }, sent); continue; }
        const askFirst = ASK_ADULT.test(fold(prev + ' ' + fold(c).slice(0, hit.a.index))) && !despite;
        if (askFirst) { mitigated.push({ rule: h.id, outcome: 'asked_adult_first', reasonCode: 'SAFETY_ASK_RESPONSE_UNKNOWN', operatorDecision: 'ASK → răspuns necunoscut → acțiune: PASS sau REVIEW? (GS.md extensia OBS-GS-1, cazul 10)', quote: c }); continue; }
        if (SUPERVISION.test(fs)) { mitigated.push({ rule: h.id, outcome: 'active_supervision', reasonCode: 'SAFETY_ACTIVE_SUPERVISION', operatorDecision: 'supraveghere activă a unei acțiuni imitabile: PASS (comportamentul P5 existent) sau REVIEW? (OBS-GS-1: adult doar prezent ≠ supraveghere)', quote: c }); continue; }
        const warned = WARNING.test(fold(cls.filter((_, k) => k !== ci).join(' '))) || WARNING.test(fold(next));
        const present = PRESENT.test(fs);
        if (warned && age !== '3-4') { push({ ...base, verdict: 'REVIEW', reasonCode: 'SAFETY_HAZARD_CORRECTED', evidence: { warning: true, adultPresent: present }, fix: 'Acțiunea are loc, apoi e corectată: verifică dacă lecția e clară pentru vârstă.' }, sent); continue; }
        push({ ...base, verdict: h.verdict, reasonCode: present ? 'SAFETY_ADULT_PRESENT_NOT_SUPERVISING' : 'SAFETY_IMITABLE_HAZARD', evidence: { adultPresent: present, warning: warned } }, sent);
      }
    });
    /* --- violence / weapons: object → action → policy (OBS-GS-8) --- */
    const gore = fs.match(GORE); if (gore) push({ rule: 'gore', category: 'violence', kind: 'safety', layer: 'lexical', verdict: 'BLOCK', reasonCode: 'SAFETY_VIOLENCE', match: gore[0], fix: 'Fără sânge, ucidere sau răni; conflictul se rezolvă blând.' }, sent);
    const toy = fs.match(TOY_WEAPON), fsNoToy = toy ? fs.replace(TOY_WEAPON, ' ') : fs, fire = fsNoToy.match(FIREARM), violent = VIOLENT.test(fsNoToy);
    if (fire) push({ rule: 'weapons', category: 'violence', kind: violent ? 'safety' : 'policy', layer: 'structured', verdict: 'BLOCK', reasonCode: violent ? 'SAFETY_WEAPON_VIOLENT_USE' : 'POLICY_REAL_WEAPON', match: fire[0], evidence: { violentAction: violent }, operatorDecision: violent ? null : 'sensul politicii „Fără arme” (prezență vs utilizare violentă) — OBS-GS-8', fix: 'Fără arme.' }, sent);
    else if (RO_WEAPON.test(fsNoToy) && /(trag|tras|amenint|atac|indreptat)/.test(fsNoToy)) push({ rule: 'weapons', category: 'violence', kind: 'safety', layer: 'structured', verdict: 'BLOCK', reasonCode: 'SAFETY_WEAPON_VIOLENT_USE', match: fsNoToy.match(RO_WEAPON)[0], fix: 'Fără arme.' }, sent);
    if (toy) push({ rule: 'toy-weapon', category: 'violence', kind: 'policy', layer: 'structured', verdict: 'REVIEW', reasonCode: 'POLICY_TOY_WEAPON_UNDEFINED', match: toy[0], operatorDecision: 'politica armelor-jucărie (OBS-GS-8)', fix: 'Politica armelor-jucărie nu e definită: decide operatorul.' }, sent);
    const fict = fs.match(FICTIONAL); if (fict && violent) push({ rule: 'fictional-weapon', category: 'violence', kind: 'policy', layer: 'structured', verdict: 'REVIEW', reasonCode: 'POLICY_FICTIONAL_WEAPON_UNDEFINED', match: fict[0], operatorDecision: 'armele fantastice folosite într-un atac (OBS-GS-8, cazul 17)', fix: 'Atac cu o armă fantastică: politica nu e definită; decide operatorul.' }, sent);
    /* --- stereotypes: is there one, does the story promote or contest it (OBS-GS-3 / OBS-GS-6) --- */
    const subj = fs.match(STEREO_SUBJ), pred = subj && fs.slice(subj.index).match(STEREO_PRED), fixed = fs.match(STEREO_FIXED);
    if ((subj && pred) || fixed) {
      const restrictedVerb = pred ? (wordsOf(fs.slice(subj.index + (pred.index || 0) + pred[0].length)).slice(0, 2).map(lemma)) : [], verbInPred = pred ? wordsOf(pred[0]).map(lemma) : [];
      const actions = [...restrictedVerb, ...verbInPred.filter(w => !['can', 'not', 'cannot', 'nu', 'pot', 'be', 'are', 'do', 'don', 't', 'never', 'sunt'].includes(w))].map(w => w.slice(0, 4));
      const rest = [...cls.slice(1), ...sents.slice(si + 1, si + 3)].map(fold).join(' ');
      const contested = INCLUSIVE.test(rest) && actions.some(a => a.length >= 3 && wordsOf(rest).some(w => fold(w).startsWith(a)));
      const challenged = !contested && /^(?:but|dar|insa)\b/.test(fold(sents[si + 1] || '')) && actions.some(a => a.length >= 3 && wordsOf(fold(sents[si + 1])).some(w => w.startsWith(a)));
      const episodic = EPISODIC.test(fs);
      const base = { rule: 'stereotype', category: 'stereotype', kind: 'safety', layer: 'structured', match: (fixed || pred)[0], fix: 'Fără stereotipuri de gen; oricine poate.' };
      if (contested) push({ ...base, verdict: 'REVIEW', reasonCode: 'SAFETY_STEREOTYPE_CONTESTED', fix: 'Stereotipul e contestat explicit: verifică dacă mesajul final e clar pentru vârstă (nu PASS automat).' }, sent);
      else if (challenged) push({ ...base, verdict: 'REVIEW', reasonCode: 'SAFETY_STEREOTYPE_NARRATIVELY_CHALLENGED', fix: 'Povestea pare să contrazică stereotipul prin fapte: verifică.' }, sent);
      else if (episodic && !fixed) push({ ...base, verdict: 'REVIEW', reasonCode: 'SAFETY_GENDERED_RESTRICTION_CONTEXTUAL', fix: 'Restricție situațională formulată pe gen: genul pare inutil; verifică (nu e stereotip general).' }, sent);
      else push({ ...base, verdict: 'BLOCK', reasonCode: 'SAFETY_STEREOTYPE' }, sent);
    }
    /* --- respect, substances, developmental fit --- */
    const ins = fs.match(INSULT_EN) || fs.match(INSULT_RO) || fs.match(INSULT_RO_2P);
    if (ins) push({ rule: 'insult', category: 'respect', kind: 'safety', layer: 'lexical', verdict: 'REVIEW', reasonCode: 'SAFETY_INSULT', match: ins[0], fix: 'Fără insulte sau rușinare corporală între personaje.' }, sent);
    const sub = fs.match(SUBSTANCES); if (sub) push({ rule: 'adult-substances', category: 'adult_themes', kind: 'policy', layer: 'lexical', verdict: 'BLOCK', reasonCode: 'POLICY_ADULT_SUBSTANCES', match: sub[0], fix: 'Fără alcool sau fumat.' }, sent);
    const fear = fs.match(FEAR);
    if (fear && (!age || ['3-4', '5-6'].includes(age))) push({ rule: 'intense-fear', category: 'developmental_fit', kind: 'safety', layer: 'lexical', verdict: 'REVIEW', reasonCode: 'DEV_INTENSE_FEAR', match: fear[0], evidence: { cumulative: (fs.match(new RegExp(FEAR_CONTEXT.source, 'giu')) || []).length, recovery: RECOVERY.test(fs) || RECOVERY.test(fold(next)) }, fix: 'Suspans blând: pericolul nu depășește ce poate duce vârsta.' }, sent);
  });
  return { verdict: worst(findings.map(f => f.verdict)), findings, mitigated, policy: SAFETY_POLICY.version };
}
const imageVerdict = c => { const s = String(c?.qa?.safety || '').toLowerCase(); return s === 'pass' ? 'PASS' : s === 'block' ? 'BLOCK' : s === 'review' ? 'REVIEW' : 'UNKNOWN'; };

/** Every subject of one volume (v 0-based) with its verdict; operator reviews clear REVIEW/UNKNOWN on the same hash only. */
export function volumeSafety({ bp, art, project, v, images = true }) {
  const age = project?.input?.[bp.variant_key || 'target_age'] || project?.input?.target_age || null, reviews = project?.safetyReviews || {}, subjects = [];
  const canon = { characters: art?.bible?.content?.characters || [] };
  const add = (id, kind, verdict, hash, findings = [], extra = {}) => {
    const rv = reviews[id], cleared = rv && rv.hash === hash && rv.decision === 'pass' && verdict !== 'BLOCK' && verdict !== 'PASS';
    subjects.push({ id, kind, verdict: cleared ? 'PASS' : verdict, raw: verdict, hash, findings, review: cleared ? { by: rv.actor, at: rv.at, reason: rv.reason } : null, ...extra });
  };
  for (const key of [`script_${v}`, `final_${v}`, `tr_${v}`]) {
    const c = art[key]?.content; if (!c) continue;
    for (const p of c.pages || []) {
      const text = [p.text, key.startsWith('tr_') ? '' : [p.scene, p.coloring_scene, ...(p.actions || []).map(a => a.action)].filter(Boolean).join('. ')].filter(Boolean).join(' \n ');
      const r = textSafety(text, { age, canon }); add(`${key}:p${p.n}`, key.startsWith('tr_') ? 'native' : 'text', r.verdict, sha256(text), r.findings, { page: p.n, artifact: key });
    }
    const cover = [c.title, c.back_cover_blurb, c.cover?.scene].filter(Boolean).join('. ');
    if (cover) { const r = textSafety(cover, { age, canon }); add(`${key}:cover`, 'cover', r.verdict, sha256(cover), r.findings, { artifact: key }); }
  }
  if (images && project?.options?.images !== false) for (let p = 0; p <= (bp.structure?.pages || 12); p++) {
    const k = `ill_${v}_${p}`, c = art[k]?.content;
    if (!c?.color) { if (images !== 'existing') add(`${k}:missing`, 'image', 'UNKNOWN', 'missing', [], { page: p, note: 'Ilustrația lipsește: siguranța ei este necunoscută.' }); continue; }   // 'existing': demo gates check only what was drawn
    add(k, 'image', imageVerdict(c), sha256(String(c.color) + '|' + String(c.lineart || '')), (c.qa?.safety_reasons || []).map(x => ({ rule: 'visual', verdict: imageVerdict(c), quote: x, reasonCode: 'SAFETY_VISUAL' })), { page: p });
  }
  return { policy: SAFETY_POLICY, volume: v + 1, age, verdict: worst(subjects.map(s => s.verdict)), subjects, blocking: subjects.filter(s => s.verdict !== 'PASS') };
}
/** Input safety (idea, notes, manuscript) before a project exists. */
export function inputSafety(input = {}) {
  const fields = ['short_description', 'additional_comments', 'seed_story', 'title'].filter(k => typeof input[k] === 'string' && input[k].trim());
  const per = fields.map(k => ({ field: k, ...textSafety(input[k], { age: input.target_age || null }) }));
  return { policy: SAFETY_POLICY, verdict: worst(per.map(x => x.verdict)), fields: per.filter(x => x.verdict !== 'PASS') };
}
