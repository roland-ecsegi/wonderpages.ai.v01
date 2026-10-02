/**
 * P5-T01 — independent child-safety gate (OUTPUT-14/15, RK20 SURPASS).
 * Safety is a separate verdict, never a score: PASS / REVIEW / BLOCK / UNKNOWN for every subject (page text, scene,
 * native edition, cover text, image, project input). A high critic average can never compensate a safety failure.
 *  - BLOCK: cannot be overridden (fix the content); REVIEW / UNKNOWN: an adult operator review on the CURRENT hash
 *    may clear it, recorded as a decision (this is operator review, not testing with families).
 *  - Images carry the art director's `safety` verdict from visual QA; without it (or without art) they are UNKNOWN.
 * Rules are versioned and conservative, with explicit counter-examples (safety framing, inclusive statements).
 */
import { sha256 } from '../domain/canonical.js';

export const SAFETY_POLICY = Object.freeze({ id: 'wonderpages.safety-policy', version: 1 });
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
/* safety framing in the same sentence turns an imitation risk into a lesson (counter-example) */
const FRAMED = /(never|not|n't|no one should|dangerous|asks? (a |an |the )?(grown-?up|adult|mum|mom|dad|parent)|with (a |an |the |his |her |their |its )?(grown-?ups?|adults?|mum|mom|dad|parents?|grandma|grandpa)|niciodata|nu (se )?(joaca|atinge|urca|inghite|pleaca|mananca|inoata)|nu e voie|periculos|cere voie|cu (un|o) adult|cu mama|cu tata|impreuna cu un adult)/;
const INCLUSIVE = /(both (girls and boys|boys and girls)|girls and boys can|boys and girls can|anyone can|everyone can|si fetele si baietii|si baietii si fetele|oricine poate|toti pot)/;
export const RULES = Object.freeze([
  { id: 'gore', category: 'violence', verdict: 'BLOCK', re: /(bloody?(?![a-z])|bleed(ing|s)?(?![a-z])|gore(?![a-z])|sange(?![a-z])|sangera|kill(s|ed|ing)?(?![a-z])|murder|omoar|ucide|ucis(?![a-z])|dead body|cadavru|stab(bed|bing|s)?(?![a-z])|injunghi)/, fix: 'Fără sânge, ucidere sau răni; conflictul se rezolvă blând.' },
  { id: 'weapons', category: 'violence', verdict: 'BLOCK', re: /(guns?(?![a-z])|rifles?(?![a-z])|pistols?(?![a-z])|bombs?(?![a-z])|grenades?(?![a-z])|arma de foc|pusca(?![a-z])|pusti(?![a-z])|bomba(?![a-z])|grenada(?![a-z]))/, fix: 'Fără arme.' },
  { id: 'fire-play', category: 'dangerous_imitation', verdict: 'BLOCK', framed: true, re: /(plays? with (fire|matches|a lighter)|light(s|ed)? (a |the )?match|joaca cu focul|joaca cu chibrituri|aprinde (un )?chibrit|bricheta)/, fix: 'Un copil poate imita: arată regula de siguranță sau scoate momentul.' },
  { id: 'heights-window', category: 'dangerous_imitation', verdict: 'BLOCK', framed: true, re: /(climb(s|ed|ing)? (on|onto|up) (the )?(window( sill)?|balcony|railing|stove)|se urca pe (pervaz|geam|fereastra|balustrada|balcon|aragaz))/, fix: 'Fără cățărat pe fereastră/balcon/aragaz fără un adult și fără regula de siguranță.' },
  { id: 'swallow', category: 'dangerous_imitation', verdict: 'BLOCK', framed: true, re: /(swallow(s|ed)? (a |the )?(coin|button|battery|magnet|bead)|inghite (o |un )?(moneda|nasture|baterie|magnet|margea))/, fix: 'Obiectele mici nu se înghit: reformulează fără imitabil.' },
  { id: 'bag-fridge', category: 'dangerous_imitation', verdict: 'BLOCK', framed: true, re: /(plastic bag over (his|her|its|their) head|hides? in (the |a )?(fridge|freezer|washing machine|dryer)|punga (de plastic )?pe cap|se ascunde in (frigider|congelator|masina de spalat))/, fix: 'Ascunzătorile periculoase nu apar ca joacă.' },
  { id: 'unknown-food', category: 'dangerous_imitation', verdict: 'BLOCK', framed: true, re: /(eats? (the |some )?(wild |unknown |strange )?(mushrooms|berries) (from|in) the (forest|woods)|mananca (ciuperci|fructe|bace) (din padure|necunoscute))/, fix: 'Ciupercile/fructele necunoscute nu se mănâncă: arată că întreabă un adult.' },
  { id: 'stranger', category: 'dangerous_imitation', verdict: 'BLOCK', framed: true, re: /(goes|went|walks? off|leaves) with (a )?stranger|pleaca cu un strain|merge cu un strain/, fix: 'Nu pleacă cu un străin.' },
  { id: 'water-alone', category: 'dangerous_imitation', verdict: 'REVIEW', framed: true, re: /(swims? alone|jumps? into the (deep )?(river|lake)|inoata singur|sare in (rau|lac))/, fix: 'Apa adâncă doar cu un adult.' },
  { id: 'stereotype', category: 'stereotype', verdict: 'BLOCK', inclusive: true, re: /(girls (can't|cannot|can not|are (weak|bad at|not good at))|boys (don't|do not|never) cry|like a girl|fetele nu pot|fetele (sunt )?slabe|baietii nu plang|ca o fata)/, fix: 'Fără stereotipuri de gen; oricine poate.' },
  { id: 'insult', category: 'respect', verdict: 'REVIEW', re: /(stupid|idiot|dumb(?![a-z])|fatty(?![a-z])|ugly(?![a-z])|prost(ul|ule|ut|ii|i)?(?![a-z])|proasta(?![a-z])|tampit|grasan)/, fix: 'Fără insulte sau rușinare corporală între personaje.' },
  { id: 'adult-substances', category: 'adult_themes', verdict: 'BLOCK', re: /(beers?(?![a-z])|wine(?![a-z])|vodka|alcohol|drunk(?![a-z])|cigarettes?|cigars?(?![a-z])|smok(es|ing) a (pipe|cigar|cigarette)|bere(?![a-z])|vin(ul)? rosu|alcool|tigar)/, fix: 'Fără alcool sau fumat.' },
  { id: 'intense-fear', category: 'developmental_fit', verdict: 'REVIEW', ages: ['3-4', '5-6'], re: /(terrif(ied|ying)|horrif(ied|ying)|nightmare|monster attack|scream(s|ed)? in terror|groaza|teroare|cosmar|urla de frica|pierdut pentru totdeauna|lost forever|nobody will ever find)/, fix: 'Suspans blând: pericolul nu depășește ce poate duce vârsta.' }
]);
const sentencesOf = s => String(s ?? '').split(/(?<=[.!?…])\s+/);
const rank = { PASS: 0, UNKNOWN: 1, REVIEW: 2, BLOCK: 3 };
export const worst = vs => vs.reduce((a, b) => (rank[b] > rank[a] ? b : a), 'PASS');

/** Text verdict with citeable findings (sentence-level counter-examples). */
export function textSafety(text, { age = null } = {}) {
  const findings = [];
  for (const sent of sentencesOf(text)) {
    const t = norm(sent); if (!t.trim()) continue;
    for (const r of RULES) {
      if (r.ages && age && !r.ages.includes(age)) continue;
      const m = t.match(new RegExp('(?<![a-z])' + r.re.source)); if (!m) continue;   // words start on a boundary (no "begun" → gun)
      if (r.framed && FRAMED.test(t)) continue;
      if (r.inclusive && INCLUSIVE.test(t)) continue;
      findings.push({ rule: r.id, category: r.category, verdict: r.verdict, quote: sent.trim().slice(0, 160), match: m[0], fix: r.fix });
    }
  }
  return { verdict: worst(findings.map(f => f.verdict)), findings };
}
const imageVerdict = c => { const s = String(c?.qa?.safety || '').toLowerCase(); return s === 'pass' ? 'PASS' : s === 'block' ? 'BLOCK' : s === 'review' ? 'REVIEW' : 'UNKNOWN'; };

/** Every subject of one volume (v 0-based) with its verdict; operator reviews clear REVIEW/UNKNOWN on the same hash only. */
export function volumeSafety({ bp, art, project, v, images = true }) {
  const age = project?.input?.[bp.variant_key || 'target_age'] || project?.input?.target_age || null, reviews = project?.safetyReviews || {}, subjects = [];
  const add = (id, kind, verdict, hash, findings = [], extra = {}) => {
    const rv = reviews[id], cleared = rv && rv.hash === hash && rv.decision === 'pass' && verdict !== 'BLOCK' && verdict !== 'PASS';
    subjects.push({ id, kind, verdict: cleared ? 'PASS' : verdict, raw: verdict, hash, findings, review: cleared ? { by: rv.actor, at: rv.at, reason: rv.reason } : null, ...extra });
  };
  for (const key of [`script_${v}`, `final_${v}`, `tr_${v}`]) {
    const c = art[key]?.content; if (!c) continue;
    for (const p of c.pages || []) {
      const text = [p.text, key.startsWith('tr_') ? '' : [p.scene, p.coloring_scene, ...(p.actions || []).map(a => a.action)].filter(Boolean).join('. ')].filter(Boolean).join(' \n ');
      const r = textSafety(text, { age }); add(`${key}:p${p.n}`, key.startsWith('tr_') ? 'native' : 'text', r.verdict, sha256(text), r.findings, { page: p.n, artifact: key });
    }
    const cover = [c.title, c.back_cover_blurb, c.cover?.scene].filter(Boolean).join('. ');
    if (cover) { const r = textSafety(cover, { age }); add(`${key}:cover`, 'cover', r.verdict, sha256(cover), r.findings, { artifact: key }); }
  }
  if (images && project?.options?.images !== false) for (let p = 0; p <= (bp.structure?.pages || 12); p++) {
    const k = `ill_${v}_${p}`, c = art[k]?.content;
    if (!c?.color) { if (images !== 'existing') add(`${k}:missing`, 'image', 'UNKNOWN', 'missing', [], { page: p, note: 'Ilustrația lipsește: siguranța ei este necunoscută.' }); continue; }   // 'existing': demo gates check only what was drawn
    add(k, 'image', imageVerdict(c), sha256(String(c.color) + '|' + String(c.lineart || '')), (c.qa?.safety_reasons || []).map(x => ({ rule: 'visual', verdict: imageVerdict(c), quote: x })), { page: p });
  }
  return { policy: SAFETY_POLICY, volume: v + 1, age, verdict: worst(subjects.map(s => s.verdict)), subjects, blocking: subjects.filter(s => s.verdict !== 'PASS') };
}
/** Input safety (idea, notes, manuscript) before a project exists. */
export function inputSafety(input = {}) {
  const fields = ['short_description', 'additional_comments', 'seed_story', 'title'].filter(k => typeof input[k] === 'string' && input[k].trim());
  const per = fields.map(k => ({ field: k, ...textSafety(input[k], { age: input.target_age || null }) }));
  return { policy: SAFETY_POLICY, verdict: worst(per.map(x => x.verdict)), fields: per.filter(x => x.verdict !== 'PASS') };
}
