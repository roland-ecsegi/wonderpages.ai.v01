/**
 * P4-T02 — collection matrix and living canon (OUTPUT-04/05, RK05/06/11 SURPASS).
 * Deterministic, explainable checks over the planned collection BEFORE any bulk production:
 *  - exactly N volume bibles, each with goal → obstacle → choice → consequence (agency of the protagonist);
 *  - character/object/relationship timeline from the cast plan and the bible (first appearance, returns, mentions);
 *  - findings with code, severity, volume, evidence and a fix hint: returning characters met again, first-appearance
 *    leaks, redundant endings, world-policy breaks (per collection, never a global "natural light" rule), claims of a
 *    species the canon marks as uncertain, and cross-artifact premise/protagonist mismatches.
 * Protagonist is permanent; companions are flexible (absence is never a finding). Summaries are DERIVED projections
 * of the canonical fields, never an authority.
 */
import { canonicalHash } from './canonical.js';

export const SEVERITY = Object.freeze({ blocker: 3, major: 2, minor: 1 });
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const words = s => new Set(norm(s).split(/[^a-z0-9]+/).filter(w => w.length > 3));
const jaccard = (a, b) => { const A = words(a), B = words(b); if (!A.size || !B.size) return 1; let n = 0; for (const w of A) if (B.has(w)) n++; return n / (A.size + B.size - n); };
const has = (text, name) => !!name && new RegExp(`(?<![a-z0-9])${norm(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`).test(norm(text));
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* applied to normalized text (lower case, no diacritics) */
const MEET = '(?:cunoaste|o cunoaste|il cunoaste|intalneste (?:pentru prima data )?pe|face cunostinta cu|meets?|first meets?|gets to know|is introduced to)';
const FANTASY = /(magie|magic|vraj|spell|fairy|zana|zane|fermecat|enchant|wizard|vrajitoare|witch|potion|potiune)/;
export const BIBLE_FIELDS = Object.freeze({ goal: ['goal'], obstacle: ['obstacle'], choice: ['climax_choice', 'choice'], consequence: ['resolution', 'consequence'] });
const pick = (sb, keys) => { for (const k of keys) if (String(sb?.[k] ?? '').trim()) return String(sb[k]).trim(); return ''; };
const volOf = x => { const m = String(x ?? '').match(/(\d+)/); return m ? Number(m[1]) : null; };

export function collectionMatrix({ series, cast, bible, brief = null, scripts = {}, structure = { volumes: 6 } }) {
  const N = structure.volumes, findings = [];
  const add = (code, severity, message, extra = {}) => findings.push({ code, severity, message, ...extra });
  const vols = Array.isArray(series?.volumes) ? series.volumes : [];
  if (vols.length !== N) add('VOLUME_COUNT', 'blocker', `Planul are ${vols.length} volume; contractul cere exact ${N}.`, { fix: 'Refă arcul colecției cu exact ' + N + ' volume.' });
  const chars = Array.isArray(bible?.characters) ? bible.characters : [];
  const castChars = Array.isArray(cast?.characters) ? cast.characters : [];
  const mainId = cast?.main_character || chars.find(c => c.role === 'main')?.id || castChars.find(c => c.role === 'main')?.id || null;
  const main = chars.find(c => c.id === mainId) || null;
  const nameOf = id => chars.find(c => c.id === id)?.name || id;
  /* timeline from the cast plan */
  const timeline = { characters: {}, objects: {}, relationships: {} };
  for (const c of castChars) {
    const per = Object.fromEntries((c.volumes || []).map(v => [Number(v.volume), { presence: v.presence, purpose: v.purpose || '' }]));
    const present = Object.entries(per).filter(([, v]) => ['introduced', 'appears', 'returns'].includes(v.presence)).map(([n]) => Number(n)).sort((a, b) => a - b);
    const first = present[0] ?? null;
    timeline.characters[c.id] = { name: nameOf(c.id), role: c.role || null, first, present, mentioned: Object.entries(per).filter(([, v]) => v.presence === 'mentioned').map(([n]) => Number(n)), returns: present.filter((n, i) => i > 0 && n - present[i - 1] > 1), arc: c.arc || null, per, species: chars.find(x => x.id === c.id)?.species || null, speciesCertainty: chars.find(x => x.id === c.id)?.species_certainty || null };
  }
  for (const o of bible?.objects || []) timeline.objects[o.id] = { name: o.name || o.id, introduced: volOf(o.introduced) };
  for (let n = 1; n <= N; n++) { const here = Object.entries(timeline.characters).filter(([, t]) => t.present.includes(n)).map(([id]) => id).sort(); for (let i = 0; i < here.length; i++) for (let j = i + 1; j < here.length; j++) { const k = here[i] + '+' + here[j]; (timeline.relationships[k] ||= []).push(n); } }
  /* volume bibles */
  const volumes = vols.map((v, i) => {
    const n = Number(v.number) || i + 1, sb = v.story_bible || {};
    const row = { n, title: v.title || '', premise: String(sb.premise || '').trim(), protagonist: sb.protagonist || null, ending_type: v.ending_type || '', setting: v.main_setting || '',
      ...Object.fromEntries(Object.entries(BIBLE_FIELDS).map(([k, keys]) => [k, pick(sb, keys)])),
      cast: Object.fromEntries(['introduced', 'appears', 'returns', 'mentioned'].map(p => [p, Object.entries(timeline.characters).filter(([, t]) => t.per[n]?.presence === p).map(([id]) => id)])) };
    const missing = Object.keys(BIBLE_FIELDS).filter(k => !row[k]);
    if (missing.length) add('BIBLE_INCOMPLETE', 'blocker', `Volumul ${n}: lipsește ${missing.join(', ')} din biblia volumului.`, { volume: n, fields: missing, fix: 'Completează scopul, obstacolul, alegerea protagonistului și consecința ei.' });
    row.summary = row.goal && row.choice && row.consequence ? `${row.title}: ${row.goal} → ${row.obstacle} → ${row.choice} → ${row.consequence}` : null;   // derived, not an authority
    return row;
  });
  /* protagonist permanent; companions flexible */
  if (mainId) for (let n = 1; n <= Math.min(N, vols.length); n++) if (!timeline.characters[mainId]?.present.includes(n)) add('PROTAGONIST_ABSENT', 'blocker', `Protagonistul ${nameOf(mainId)} nu apare în volumul ${n}.`, { volume: n, character: mainId, fix: 'Protagonistul conduce fiecare volum; companionii pot lipsi.' });
  for (const r of volumes) if (r.protagonist && mainId && norm(r.protagonist) !== norm(mainId) && norm(r.protagonist) !== norm(main?.name)) add('PROTAGONIST_MISMATCH', 'major', `Volumul ${r.n}: biblia volumului are protagonistul „${r.protagonist}”, distribuția are „${nameOf(mainId)}”.`, { volume: r.n, fix: 'Aliniază protagonistul la canon.' });
  /* returns without re-meeting; first appearance without leaks */
  for (const [id, t] of Object.entries(timeline.characters)) {
    if (t.first == null) continue;
    for (const [n, p] of Object.entries(t.per)) if (p.presence === 'introduced' && Number(n) > t.first) add('RETURN_REMEET', 'major', `${t.name} este „introdus” din nou în volumul ${n}, deși apare din volumul ${t.first}.`, { volume: Number(n), character: id, fix: 'Marchează revenirea („returns”) și amintește-l într-o atingere ușoară, fără o nouă întâlnire.' });
    for (const r of volumes) { const text = norm(`${r.premise} ${vols[r.n - 1]?.summary || ''}`); if (r.n > t.first && new RegExp(`${MEET}[^.]{0,40}(?<![a-z])${esc(norm(t.name))}(?![a-z])`).test(text)) add('RETURN_REMEET', 'major', `Volumul ${r.n} descrie o primă întâlnire cu ${t.name}, cunoscut din volumul ${t.first}.`, { volume: r.n, character: id, evidence: r.premise || vols[r.n - 1]?.summary, fix: 'Un prieten care revine este amintit, nu cunoscut din nou.' }); }
    for (const r of volumes) if (r.n < t.first && !t.mentioned.includes(r.n) && has(`${r.premise} ${vols[r.n - 1]?.summary || ''} ${r.goal} ${r.choice}`, t.name)) add('FIRST_APPEARANCE_LEAK', 'major', `${t.name} apare în planul volumului ${r.n}, înainte de prima apariție din volumul ${t.first}.`, { volume: r.n, character: id, fix: 'Mută apariția sau actualizează distribuția (prima apariție).' });
    const bc = chars.find(c => c.id === id), declared = volOf(bc?.introduced ?? bc?.first_volume);
    if (declared && declared !== t.first) add('FIRST_APPEARANCE_MISMATCH', 'major', `Biblia spune că ${t.name} apare din volumul ${declared}; distribuția îl prezintă din volumul ${t.first}.`, { character: id, fix: 'Aliniază biblia și distribuția.' });
  }
  for (const [id, o] of Object.entries(timeline.objects)) if (o.introduced) for (const r of volumes) if (r.n < o.introduced && has(`${r.premise} ${r.goal} ${r.choice}`, o.name)) add('FIRST_APPEARANCE_LEAK', 'minor', `Obiectul „${o.name}” apare în planul volumului ${r.n}, înainte de introducerea lui (volumul ${o.introduced}).`, { volume: r.n, object: id });
  /* endings */
  const endings = volumes.map(r => norm(r.ending_type));
  for (let i = 1; i < endings.length; i++) if (endings[i] && endings[i] === endings[i - 1]) add('ENDING_REDUNDANT', 'major', `Volumele ${i} și ${i + 1} au același tip de final („${volumes[i].ending_type}”).`, { volume: i + 1, fix: 'Variază finalurile între volume consecutive.' });
  const counts = endings.reduce((m, e) => (e ? (m[e] = (m[e] || 0) + 1, m) : m), {});
  for (const [e, c] of Object.entries(counts)) if (c > 2) add('ENDING_REDUNDANT', 'minor', `Finalul „${e}” se repetă în ${c} volume.`, { fix: 'Cel mult două volume cu același tip de final.' });
  /* world policy: per collection, from the canon (no global natural-light rule) */
  const magic = norm(bible?.world_rules?.magic || 'none');
  const policy = /^(none|fara|no|nu)/.test(magic) ? 'natural' : 'fantasy';
  if (policy === 'natural') for (const r of volumes) { const t = norm(`${r.premise} ${r.goal} ${r.obstacle} ${r.choice} ${r.consequence} ${vols[r.n - 1]?.summary || ''}`); const m = t.match(FANTASY); if (m) add('WORLD_POLICY', 'major', `Volumul ${r.n} conține „${m[0]}”, dar lumea colecției este fără magie.`, { volume: r.n, fix: 'Explică efectul natural sau schimbă regulile lumii printr-o decizie de canon.' }); }
  /* factual certainty: no species claimed for a character the canon marks as uncertain */
  for (const c of chars) if (c.species_certainty === 'indeterminate_stylized') {
    const SPECIES = /(triceratops|stegozaur|stegosaur|tiranozaur|tyrannosaur|brontozaur|brontosaur|diplodocus|velociraptor|pterodactil|pterodactyl|ankylozaur|ankylosaur|parasaurolophus|iguanodon|brachiozaur|brachiosaur)/;
    for (const r of volumes) { const t = norm(`${r.premise} ${vols[r.n - 1]?.summary || ''}`); const m = t.match(new RegExp(`${norm(c.name)}[^.]{0,30}${SPECIES.source}|${SPECIES.source}[^.]{0,30}${norm(c.name)}`)); if (m) add('SPECIES_CLAIM', 'major', `Volumul ${r.n} atribuie lui ${c.name} o specie, deși canonul o marchează ca nedeterminată.`, { volume: r.n, character: c.id, evidence: m[0], fix: 'Nu numi specia; descrie-l prin trăsăturile din canon.' }); }
  }
  /* cross-artifact premise: canonical volume premise vs its projections (series summary, script copy) */
  for (const r of volumes) {
    const copies = [['series.summary', vols[r.n - 1]?.summary], [`script_${r.n - 1}.story_bible.premise`, scripts[r.n - 1]?.story_bible?.premise]].filter(([, t]) => String(t || '').trim());
    for (const [where, t] of copies) if (r.premise && jaccard(r.premise, t) < 0.35) add('PREMISE_MISMATCH', 'major', `Volumul ${r.n}: premisa canonică diferă de ${where}.`, { volume: r.n, where, evidence: [r.premise, t], fix: 'Reconciliază proiecția cu premisa aprobată (o decizie de canon), nu prin înlocuire arbitrară.' });
  }
  if (brief?.collection_title && series?.through_line && main && !has(`${series.through_line} ${volumes.map(r => r.premise).join(' ')}`, main.name) && !has(`${series.through_line} ${volumes.map(r => r.premise).join(' ')}`, main.id)) add('PREMISE_MISMATCH', 'minor', `Firul colecției și premisele volumelor nu îl numesc pe protagonistul ${main.name}.`, { fix: 'Leagă firul colecției de protagonist.' });
  findings.sort((a, b) => SEVERITY[b.severity] - SEVERITY[a.severity] || (a.volume || 0) - (b.volume || 0));
  /* findings about downstream projections (scripts written after the plan) are reported, but they neither block nor
     change the hash of the approved plan: approving the plan is about the plan, not about later manuscripts */
  const downstream = findings.filter(f => /^script_/.test(f.where || '')), plan = findings.filter(f => !downstream.includes(f));
  const blockers = plan.filter(f => f.severity === 'blocker').length;
  const core = { volumes: volumes.map(({ summary, ...v }) => v), timeline, policy: { world: policy }, mainCharacter: mainId };
  return { schema: 'wonderpages.collection-matrix/1', ...core, volumes, findings: plan, downstream, summary: { volumes: volumes.length, expected: N, blockers, major: plan.filter(f => f.severity === 'major').length, minor: plan.filter(f => f.severity === 'minor').length, downstream: downstream.length }, ready: blockers === 0 && volumes.length === N, hash: canonicalHash({ core, findings: plan.map(f => [f.code, f.volume ?? null, f.character ?? null]) }) };
}

/** Matrix for a project's current artifacts (series/cast/bible/brief + any existing scripts). */
export function matrixForArtifacts(bp, art) {
  const scripts = {}; for (let v = 0; v < (bp.structure?.volumes || 6); v++) if (art['script_' + v]) scripts[v] = art['script_' + v].content;
  return collectionMatrix({ series: art.series?.content, cast: art.cast?.content, bible: art.bible?.content, brief: art.brief?.content, scripts, structure: bp.structure });
}
