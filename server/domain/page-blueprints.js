/**
 * P4-T03 — 72 typed PageBlueprints (OUTPUT-05/06, RK07 MATCH, RK09 SURPASS).
 * A PageBlueprint is the plan of one physical page before any manuscript or image: its narrative function, beat,
 * emotion, the state it changes, the value the image adds over the text, the visible actions (who holds what, with
 * which body part), the reveal/turn contract and its layout. 6 volumes × 12 pages = exactly 72 ids `V1-P01…V6-P12`.
 * Sources: the per-volume plan artifacts `plan_<v>` (kids-sc v17) or, for legacy projects such as Dinosaur World,
 * `series.volumes[].page_plan` (read-only; raw never changes).
 */
export const PAGE_ID = (v, p) => `V${v}-P${String(p).padStart(2, '0')}`;
const HOOK_TYPES = new Set(['question', 'hook', 'cliffhanger', 'suspense', 'reveal_setup']);
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
/* physical mapping of a strict12 interior (ADR04): by default p1 is a recto facing the title page, then spreads
   (2,3) (4,5) (6,7) (8,9) (10,11) and p12 alone; `firstSide: 'left'` pairs (1,2) (3,4)… A payoff on the same opening
   as its question is not hidden. The rendering profile can refine the mapping (P6-T04). */
export const spreadOf = (p, firstSide = 'right') => (firstSide === 'left' ? Math.ceil(Number(p) / 2) : Math.floor(Number(p) / 2));
const HANDS = /(?<![a-z])(hands?|paws?|fingers?|palms?|mana|maini|manuta|manute|labut[ae]|labe|degete|pumn)(?![a-z])/;
const HOLD = /(?<![a-z])(holds?|holding|grips?|gripp(?:ed|ing)|grabs?|grabb(?:ed|ing)|carr(?:y|ies|ying|ied)|clutch(?:es|ed|ing)?|tine|tinand|apuca|apucand|duce|ducand|poarta|strange)(?![a-z])/;
const handsAllowed = c => { const a = c?.anatomy || {}; if (HANDS.test(norm((a.holds_objects_with || []).join(' ')))) return true;   /* explicit permission wins (e.g. Milo: both small hands; "never long fingers" is a shape rule) */
  if (/hand|finger|mana|maini|degete|grasp/.test(norm((a.never || []).join(' ')))) return false; return !(a.holds_objects_with || []).length; };
const volOfIntro = s => { const m = norm(s).match(/(?:volum(?:ul)?|volume|v)\s*(\d+)(?:[^0-9]+(?:pagina|page|p)\s*(\d+))?/); return m ? { v: Number(m[1]), p: m[2] ? Number(m[2]) : null } : null; };

/** Normalizes one plan entry (DW page_plan shape or v17 plan shape) into a typed PageBlueprint. */
export function toBlueprint(v, raw, i) {
  const p = Number(raw?.n) || i + 1, sb = raw?.storyboard || {}, t = raw?.turn || {};
  const actions = Array.isArray(raw?.actions) ? raw.actions.map(a => ({ character: a.character || null, action: String(a.action || ''), holds: a.holds && typeof a.holds === 'object' ? { object: a.holds.object || null, with: a.holds.with || null } : null })) : raw?.action ? [{ character: null, action: String(raw.action), holds: null }] : [];
  return {
    id: PAGE_ID(v, p), volume: v, page: p, function: raw?.role || raw?.function || null, beat: raw?.beat || null, purpose: raw?.purpose || null,
    emotion: raw?.emotion || null, state: raw?.new_information || raw?.state_change || raw?.state || null, imageValue: raw?.image_added_value || raw?.image_value || null,
    actions, characters: Array.isArray(raw?.characters) ? raw.characters : [], objects: Array.isArray(raw?.objects) ? raw.objects : [], location: raw?.location || null,
    turn: { type: t.type || 'quiet', hook: t.hook || '', payoffPage: Number.isInteger(t.payoff_page) ? t.payoff_page : t.payoff_page == null ? null : Number(t.payoff_page) || null, payoff: t.payoff || '' },
    layout: { shot: sb.shot || raw?.shot || null, textZone: raw?.text_zone || null, spread: spreadOf(p) }
  };
}
export function derivePageBlueprints(bp, art) {
  const V = bp.structure?.volumes || 6, pages = [], sources = {};
  for (let v = 0; v < V; v++) {
    const own = art['plan_' + v]?.content?.pages, legacy = art.series?.content?.volumes?.[v]?.page_plan;
    const list = Array.isArray(own) ? own : Array.isArray(legacy) ? legacy : [];
    sources[v + 1] = Array.isArray(own) ? `plan_${v}` : Array.isArray(legacy) ? 'series.page_plan' : null;
    list.forEach((raw, i) => pages.push(toBlueprint(v + 1, raw, i)));
  }
  return { pages, sources };
}

export function validatePageBlueprints(pages, { structure = { volumes: 6, pages: 12 }, bible = null, firstSide = 'right' } = {}) {
  const spread = p => spreadOf(p, firstSide);
  const findings = [], add = (code, severity, message, extra = {}) => findings.push({ code, severity, message, ...extra });
  const V = structure.volumes, P = structure.pages, expected = V * P;
  const ids = pages.map(x => x.id), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  const want = []; for (let v = 1; v <= V; v++) for (let p = 1; p <= P; p++) want.push(PAGE_ID(v, p));
  const missing = want.filter(x => !ids.includes(x)), extra = ids.filter(x => !want.includes(x));
  if (pages.length !== expected || missing.length || dup.length || extra.length) add('PAGE_COUNT', 'blocker', `Sunt ${new Set(ids).size} PageBlueprints unice din ${expected} cerute.`, { missing: missing.slice(0, 24), duplicates: [...new Set(dup)], extra });
  const chars = new Map((bible?.characters || []).map(c => [c.id, c]));
  const objects = new Map((bible?.objects || []).map(o => [o.id, { ...o, intro: volOfIntro(o.introduced) }]));
  const byId = new Map(pages.map(x => [x.id, x]));
  for (const pg of pages) {
    const miss = [['function', pg.function], ['emotion', pg.emotion], ['imageValue', pg.imageValue], ['state', pg.state]].filter(([, v]) => !String(v ?? '').trim()).map(([k]) => k);
    if (miss.length) add('PAGE_FIELDS', 'blocker', `${pg.id}: lipsește ${miss.join(', ')}.`, { page: pg.id, fields: miss, fix: 'Fiecare pagină planificată are funcție, emoție, valoarea imaginii și schimbarea de stare.' });
    /* payoff of a hook */
    if (HOOK_TYPES.has(norm(pg.turn.type)) || String(pg.turn.hook || '').trim()) {
      const to = pg.turn.payoffPage;
      if (!Number.isInteger(to) || to <= pg.page || to > P || !byId.has(PAGE_ID(pg.volume, to))) add('MISSING_PAYOFF', 'major', `${pg.id}: cârligul („${String(pg.turn.hook || pg.turn.type).slice(0, 60)}”) nu are o pagină de răspuns validă.`, { page: pg.id, fix: 'Indică pagina ulterioară care răspunde întrebării.' });
      else if (!String(pg.turn.payoff || '').trim()) add('MISSING_PAYOFF', 'minor', `${pg.id}: răspunsul cârligului nu este descris.`, { page: pg.id });
      else if (spread(to) === spread(pg.page)) add('SPREAD_LEAK', 'major', `${pg.id}: răspunsul de pe pagina ${to} se vede pe aceeași deschidere cu întrebarea (pagina ${pg.page}).`, { page: pg.id, payoff: PAGE_ID(pg.volume, to), fix: 'Pune răspunsul după o întoarcere de pagină (pe deschiderea următoare).' });
    }
    /* who holds what, with which body part, and is the object already in the story */
    for (const a of pg.actions) {
      const c = chars.get(a.character), text = norm(a.action);
      if (c && (HOLD.test(text) || a.holds) && HANDS.test(norm(a.holds?.with || text)) && !handsAllowed(c)) add('WRONG_HOLDER', 'major', `${pg.id}: ${c.name || c.id} ține un obiect cu mâinile, dar anatomia lui permite doar: ${(c.anatomy?.holds_objects_with || []).join(', ') || '—'}.`, { page: pg.id, character: c.id, evidence: a.action, fix: 'Folosește modul de a ține obiecte din anatomia personajului (de ex. botul, coarnele).' });
      if (a.holds?.object) {
        const o = objects.get(a.holds.object);
        if (pg.characters.length && a.character && !pg.characters.includes(a.character)) add('WRONG_HOLDER', 'major', `${pg.id}: ${a.character} ține „${a.holds.object}”, dar nu este pe pagină.`, { page: pg.id, character: a.character });
        if (o?.intro && (pg.volume < o.intro.v || (pg.volume === o.intro.v && o.intro.p && pg.page < o.intro.p))) add('WRONG_HOLDER', 'major', `${pg.id}: „${o.name || o.id}” este ținut înainte de introducerea lui (volumul ${o.intro.v}${o.intro.p ? `, pagina ${o.intro.p}` : ''}).`, { page: pg.id, object: o.id });
      }
    }
  }
  /* a character's first appearance must not be visible on the facing page before its reveal */
  for (let v = 1; v <= V; v++) {
    const seen = new Map();
    for (let p = 1; p <= P; p++) { const pg = byId.get(PAGE_ID(v, p)); if (!pg) continue; for (const c of pg.characters) if (!seen.has(c)) seen.set(c, p); }
    for (const [c, p] of seen) { const pg = byId.get(PAGE_ID(v, p)); if (norm(pg.turn.type) === 'reveal' && p > 1) { const prev = byId.get(PAGE_ID(v, p - 1)); if (prev && spread(p - 1) === spread(p) && norm(`${prev.beat} ${prev.imageValue}`).includes(norm(chars.get(c)?.name || c))) add('SPREAD_LEAK', 'major', `${pg.id}: dezvăluirea lui ${chars.get(c)?.name || c} se vede deja pe pagina alăturată ${prev.id}.`, { page: pg.id }); } }
  }
  const sev = { blocker: 3, major: 2, minor: 1 };
  findings.sort((a, b) => sev[b.severity] - sev[a.severity] || String(a.page || '').localeCompare(String(b.page || '')));
  const blockers = findings.filter(f => f.severity === 'blocker').length;
  return { schema: 'wonderpages.page-blueprints/1', mapping: { firstSide }, expected, count: new Set(ids).size, findings, summary: { blockers, major: findings.filter(f => f.severity === 'major').length, minor: findings.filter(f => f.severity === 'minor').length }, ready: blockers === 0 };
}
