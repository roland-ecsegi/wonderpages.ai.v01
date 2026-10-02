/**
 * P6-T02 — integrated page workbench and commands (RK12 MATCH, RK13/RK15 SURPASS, RK21 MATCH).
 * One page in context: the 12 thumbnails + covers of the volume, the canvas (colour, colouring page, measured layout),
 * the text of every language, cast/props, the scene contract, the verdicts (visual, colouring, layout) and the versions.
 * Commands are distinct and each has its impact computed BEFORE anything is written:
 *   exact     exact replacement in one language, local, no AI; the native page is only revalidated;
 *   style     stylistic adjustment of the wording (AI, mode adjust); the scene and the art stay;
 *   semantic  semantic rewrite (AI, mode rewrite); the page art, its colouring page, QA and the native page become stale;
 *   color     colour repair of one page (AI image + full visual QA); its colouring page becomes stale;
 *   line      colouring-page-only repair (derivation + line QA); the colour art is untouched;
 *   layout    layout-only edit (family, text zone, motif), local; text, art and QA stay.
 * The preview returns a hash of the exact state it was computed on; a commit with an older hash is refused (stale).
 * Nothing else is touched: the commit is verified against the unit hashes of the whole volume.
 */
import { canonicalHash } from './canonical.js';
import { unitHashes } from '../quality/repair.js';
import { pageVisual } from '../quality/visual.js';
import { languagesOf, FAMILIES, ZONES } from './layout.js';

export const COMMANDS = Object.freeze({
  exact: { label: 'Înlocuire exactă (fără AI)', ai: false, creative: false },
  style: { label: 'Ajustare stilistică (AI)', ai: true, creative: true, mode: 'adjust' },
  semantic: { label: 'Rescriere semantică (AI)', ai: true, creative: true, mode: 'rewrite' },
  color: { label: 'Reparație culoare (AI)', ai: true, creative: true },
  line: { label: 'Doar pagina de colorat', ai: true, creative: true },
  layout: { label: 'Doar macheta (fără AI)', ai: false, creative: false }
});
const bad = message => ({ status: 400, message });
export const srcKeyOf = (art, v) => (art[`final_${v}`] ? `final_${v}` : `script_${v}`);
const trKeyOf = (art, v) => (art[`tr_${v}`] ? `tr_${v}` : null);

/** The state a preview is bound to: every unit of the volume, the page layout and the versions involved. */
export function stateHash(art, v, p, P = 12) {
  const src = srcKeyOf(art, v), tr = trKeyOf(art, v), ill = `ill_${v}_${p}`;
  return canonicalHash({ units: unitHashes(art, v, P), layout: art[src]?.content?.pages?.[p - 1]?.layout ?? null, versions: { [src]: art[src]?.version ?? null, ...(tr ? { [tr]: art[tr]?.version ?? null } : {}), [ill]: art[ill]?.version ?? null } }).slice(0, 24);
}

/** Validates the command, computes what changes, what becomes stale, what stays and which calls it costs. */
export function commandImpact({ art, v, p, command, payload = {}, P = 12 }) {
  const def = COMMANDS[command]; if (!def) throw bad('Comandă necunoscută.');
  if (!Number.isInteger(p) || p < 0 || p > P) throw bad('Pagină invalidă.');
  const src = srcKeyOf(art, v), tr = trKeyOf(art, v), ill = `ill_${v}_${p}`, page = art[src]?.content?.pages?.[p - 1];
  const textCmd = ['exact', 'style', 'semantic', 'layout'].includes(command);
  if (textCmd && (p < 1 || !page)) throw bad('Comanda cere o pagină interioară cu text.');
  let changes = [], stale = [], calls = [], recheck = [], notes = [], next = null, key = null;
  if (command === 'exact') {
    key = payload.language === 'second' ? tr : src; if (!key) throw bad('Ediția a doua nu există.');
    const from = String(payload.from ?? ''), to = String(payload.to ?? ''), text = String(art[key]?.content?.pages?.[p - 1]?.text ?? '');
    if (!from || from === to || from.length > 300 || to.length > 300) throw bad('Scrie textul exact de înlocuit și înlocuirea (diferite, cel mult 300 de caractere).');
    const at = text.indexOf(from); if (at < 0) throw bad('Textul de înlocuit nu se găsește exact pe această pagină.');
    if (text.indexOf(from, at + 1) >= 0) throw bad('Textul de înlocuit apare de mai multe ori pe pagină; alege un fragment unic.');
    next = text.slice(0, at) + to + text.slice(at + from.length);
    changes = [`${key}#p${p}`]; if (key === src && tr) stale = [`${tr}#p${p}`]; recheck = ['safety', 'native_alignment', 'layout_measurement'];
    notes.push('Fără AI: textul se înlocuiește exact; ilustrația și pagina de colorat rămân.');
  } else if (command === 'style' || command === 'semantic') {
    key = payload.language === 'second' ? tr : src; if (!key) throw bad('Ediția a doua nu există.');
    if (!String(payload.note || '').trim()) throw bad('Scrie ce trebuie schimbat.');
    changes = [`${key}#p${p}`]; calls = [{ kind: 'text', count: 1 }];
    if (command === 'semantic' && key === src) { stale = [`${ill}:color`, `${ill}:line`, ...(tr ? [`${tr}#p${p}`] : [])]; recheck = ['story_contract', 'critic', 'safety', 'visual_qa_all_dimensions', 'line_qa']; notes.push('Scena se schimbă: ilustrația, pagina de colorat și verificările lor devin depășite (se redesenează separat).'); }
    else { stale = key === src && tr ? [`${tr}#p${p}`] : []; recheck = ['critic', 'safety', ...(tr && key === src ? ['native_alignment'] : [])]; notes.push('Scena și ilustrația rămân; se schimbă numai formularea.'); }
  } else if (command === 'color') {
    if (!String(payload.note || '').trim()) throw bad('Scrie ce trebuie schimbat în imagine.');
    changes = [`${ill}:color`]; stale = art[ill]?.content?.lineart ? [`${ill}:line`] : []; calls = [{ kind: 'image', count: 1 }, { kind: 'visual_qa', count: 1 }]; recheck = ['visual_qa_all_dimensions', 'safety', 'line_qa'];
    notes.push('Textul rămâne; pagina de colorat se derivă din noua culoare după aprobare.');
  } else if (command === 'line') {
    if (!art[ill]?.content?.color) throw { status: 409, message: 'Pagina de colorat cere mai întâi o ilustrație color.' };
    changes = [`${ill}:line`]; calls = [{ kind: 'line_derivation', count: 1 }, { kind: 'line_qa', count: 1 }]; recheck = ['line_qa'];
    notes.push('Culoarea rămâne neatinsă (același hash).');
  } else if (command === 'layout') {
    key = src; const fam = payload.family ?? page.layout?.family, zone = payload.zone ?? page.layout?.text_zone ?? page.text_zone ?? 'bottom';
    if (!FAMILIES.includes(fam) || !ZONES.includes(zone)) throw bad('Familie sau zonă de text necunoscută.');
    const fpt = payload.font_pt == null ? undefined : Number(payload.font_pt); if (fpt !== undefined && !(fpt > 0 && fpt < 100)) throw bad('Corp de literă invalid.');
    next = { ...(page.layout || {}), family: fam, text_zone: zone, ...(payload.motif === true ? { motif: true } : {}), ...(fpt ? { font_pt: fpt } : {}) }; if (payload.motif === false) delete next.motif;
    changes = [`layout:${v}:${p}`]; recheck = ['layout_measurement'];
    if (page.text_zone && zone !== page.text_zone) notes.push(`Ilustrația a fost compusă cu zona calmă „${page.text_zone}”; verifică previzualizarea (textul nu se mută peste reperele protejate).`);
    notes.push('Fără AI: textul, ilustrația și verificările lor rămân.');
  }
  const all = Object.keys(unitHashes(art, v, P)), touched = new Set([...changes, ...stale]);
  const unchanged = all.filter(u => !touched.has(u));
  return { command, label: def.label, ai: def.ai, creative: def.creative, mode: def.mode || null, key, changes, stale, calls, recheck, notes, unchanged: { count: unchanged.length, sample: unchanged.slice(0, 6) }, next,
    previewHash: canonicalHash({ command, payload, state: stateHash(art, v, p, P) }).slice(0, 24) };
}

/** The gate item a creative command runs through (the targeted repair of P5-T06). */
export const itemIdFor = (impact, v, p) => (impact.command === 'color' ? `img:ill_${v}_${p}:color` : impact.command === 'line' ? `img:ill_${v}_${p}:line` : ['style', 'semantic'].includes(impact.command) ? `text:${impact.key}:${p}` : null);

/** Everything about one page, in context. */
export function pageWorkbench({ bp, art, project, v, p, plan = null, versions = {}, gateItems = [] }) {
  const P = bp.structure?.pages || 12, src = srcKeyOf(art, v), langs = languagesOf(project, art, v), bible = art.bible?.content || {};
  const ill = art[`ill_${v}_${p}`]?.content || null, page = p > 0 ? art[src]?.content?.pages?.[p - 1] || null : null;
  const name = id => (bible.characters || []).find(c => c.id === id)?.name || id, obj = id => (bible.objects || []).find(o => o.id === id)?.name || id;
  const lp = plan?.pages?.find(x => x.n === p) || null;
  const thumbs = Array.from({ length: P + 1 }, (_, i) => { const c = art[`ill_${v}_${i}`]?.content, pg = i ? art[src]?.content?.pages?.[i - 1] : null, lpi = plan?.pages?.find(x => x.n === i);
    return { p: i, label: i ? `Pagina ${i}` : 'Copertă', color: c?.color || null, lineart: c?.lineart || null, lineStale: !!(c?.lineart && c.lineFrom && c.lineFrom !== c.color), qa: c?.qa ? (c.qa.color === c.color ? (c.qa.ok ? 'pass' : 'fail') : 'stale') : (c?.color ? 'missing' : null), wordless: !!(pg && (pg.page_type === 'wordless' || !String(pg.text || '').trim())), layoutBlocked: !!lpi?.findings?.some(f => f.blocking), pending: !c?.color }; });
  const visual = p >= 0 && ill ? pageVisual({ c: ill, requireLine: project?.options?.coloring !== false }) : { ok: false, missing: true, reasons: ['Ilustrația lipsește (în așteptare).'] };
    const commands = Object.entries(COMMANDS).map(([id, d]) => {
    let available = true, reason = null;
    if (['exact', 'style', 'semantic', 'layout'].includes(id) && (!page || p < 1)) { available = false; reason = 'Coperta nu are text de pagină.'; }
    if (id === 'line' && !ill?.color) { available = false; reason = 'Mai întâi ilustrația color.'; }
    if (available && d.ai) { const want = id === 'color' ? `img:ill_${v}_${p}:color` : id === 'line' ? `img:ill_${v}_${p}:line` : `text:${src}:${p}`, it = gateItems.find(i => i.id === want);
      if (!it) { available = false; reason = 'Comenzile cu AI rulează prin poarta de revizie deschisă care conține această pagină.'; }
      else if (it.missing || it.blocked) { available = false; reason = id === 'line' && (ill?.linePending || (ill?.lineFrom && ill.lineFrom !== ill.color)) ? 'Pagina de colorat se derivă din culoarea nouă când aprobi culoarea.' : 'Elementul lipsește sau nu a trecut verificarea; rezolvă mai întâi cauza.'; } }
    return { id, label: d.label, ai: d.ai, available, reason };
  });
  return { schema: 'wonderpages.workbench/1', volume: v + 1, page: p, src, stateHash: stateHash(art, v, Math.max(p, 0), P), thumbnails: thumbs,
    canvas: { color: ill?.color || null, lineart: ill?.lineart || null, crop: lp?.crop || null, layout: lp ? { family: lp.family, zone: lp.zone, sizePt: lp.sizePt, source: lp.source, reason: lp.reason } : null },
    texts: langs.map(l => ({ id: l.id, language: l.language, key: l.key, text: p > 0 ? String(l.pages?.[p - 1]?.[l.field] ?? '') : null, measured: lp?.textBlocks?.[l.id] ? { lines: lp.textBlocks[l.id].lines, fits: lp.textBlocks[l.id].fits } : null })),
    cast: (page?.characters || []).map(id => ({ id, name: name(id) })), props: (page?.objects || []).map(id => ({ id, name: obj(id) })),
    contract: page ? { scene: page.scene || null, purpose: page.purpose || null, emotion: page.emotion || null, actions: page.actions || [], must_not_show: page.must_not_show || [], effects: page.effects || null, composition: page.composition || null, text_zone: page.text_zone || null, page_type: page.page_type || 'text' } : null,
    verdicts: { visual: { ok: visual.ok, reasons: visual.reasons || [] }, layout: (lp?.findings || []).map(f => ({ code: f.code, severity: f.severity, blocking: f.blocking, message: f.message })), pending: !ill?.color },
    versions, commands };
}
