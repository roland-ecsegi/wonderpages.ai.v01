/**
 * P5-T04 — cross-artifact and collection QA (OUTPUT-13 Cross-artifact/Collection layers, RK06/11 SURPASS).
 * Issues carry exact references (artifact, path, page, quote) and the affected scope (volumes/pages). Severity `high`
 * blocks release of every affected volume (and the collection); the collection never averages away a weak volume —
 * every required volume must pass its own book assessment. Intentionally repeated motifs (declared) are allowed.
 */
import { collectionMatrix } from '../domain/collection.js';
import { assessBook } from './assessment.js';
import { reconcileReport } from '../migration/dw-reconcile.js';

const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const words = s => new Set((norm(s).match(/[a-z0-9]+/g) || []).filter(w => w.length > 3));
const jaccard = (a, b) => { const A = words(a), B = words(b); if (!A.size || !B.size) return 0; let n = 0; for (const w of A) if (B.has(w)) n++; return n / (A.size + B.size - n); };
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const containment = (a, b) => { const A = words(a), B = words(b); if (!A.size) return 1; let n = 0; for (const w of A) if (B.has(w)) n++; return n / A.size; };
/* a language guess by function words: a summary is compared word-by-word only with a book text in the same language */
const langOf = s => { const t = ` ${norm(s)} `, en = (t.match(/ (the|and|with|his|her|they|is|was) /g) || []).length, ro = (t.match(/ (si|cu|pe|lui|ei|este|era|o|un) /g) || []).length; return en > ro ? 'en' : ro > en ? 'ro' : null; };
const textOf = c => (c?.pages || []).map(p => `${p.text || ''} ${p.scene || ''}`).join(' ');
const INTRO = name => new RegExp(`((meets?|met) (a )?(new )?(friend|dinosaur|girl|boy)?( named| called)? ${esc(norm(name))}|i['’]?m ${esc(norm(name))}[.!”"]|my name is ${esc(norm(name))}|o cunoaste pe ${esc(norm(name))}|il cunoaste pe ${esc(norm(name))}|eu sunt ${esc(norm(name))}|ma numesc ${esc(norm(name))}|cine esti)`);
const HOLDER = /([a-z]+) (holds?|carries|carrying|holding|tine|duce|poarta)/;

export function collectionQA({ bp, art, project, motifs = null }) {
  const V = bp.structure?.volumes || 6, issues = [];
  const add = (code, severity, message, scope, references = []) => issues.push({ code, severity, message, scope, references });
  const chars = art.bible?.content?.characters || [], cast = art.cast?.content?.characters || [];
  const firstOf = id => { const c = cast.find(x => x.id === id); const f = (c?.volumes || []).filter(v => ['introduced', 'appears', 'returns'].includes(v.presence)).map(v => Number(v.volume)).sort((a, b) => a - b)[0]; return f || null; };
  const declared = new Set([...(motifs || art.series?.content?.motifs || art.bible?.content?.motifs || [])].map(norm));
  const book = v => art[`final_${v}`]?.content || art[`script_${v}`]?.content, bookKey = v => (art[`final_${v}`] ? `final_${v}` : `script_${v}`);
  const written = Array.from({ length: V }, (_, v) => v).filter(v => book(v));
  for (const v of written) {
    const c = book(v), key = bookKey(v), plan = art.series?.content?.volumes?.[v];
    /* projection: the summary/premise of the plan must tell the story the manuscript tells */
    for (const [path, txt] of [[`series.volumes[${v}].summary`, plan?.summary], [`series.volumes[${v}].story_bible.premise`, plan?.story_bible?.premise]]) {
      if (!String(txt || '').trim()) continue;
      const body = textOf(c), same = langOf(txt) && langOf(txt) === langOf(body), cont = containment(txt, body);
      const named = [...chars, ...(art.bible?.content?.objects || [])].filter(ch => ch.name && norm(txt).includes(norm(ch.name)) && !(c.pages || []).some(p => (p.characters || []).includes(ch.id) || (p.objects || []).includes(ch.id) || norm(p.text).includes(norm(ch.name))));
      if ((same && cont < 0.3) || named.length) add('PROJECTION_MISMATCH', 'high', `Volumul ${v + 1}: ${path} nu descrie manuscrisul${named.length ? ` (numește ${named.map(n => n.name).join(', ')}, absenți din pagini)` : ` (doar ${Math.round(cont * 100)}% din cuvintele lui apar în carte)`}.`, { volumes: [v + 1], artifacts: ['series', key] }, [{ artifact: 'series', path, quote: String(txt).slice(0, 160) }, { artifact: key, path: 'pages', quote: String(c.pages?.[0]?.text || '').slice(0, 120) }]);
    }
    for (const p of c.pages || []) {
      /* relationships: a known friend is never introduced again */
      for (const ch of chars) {
        const first = firstOf(ch.id); if (!first) continue;
        if (v + 1 > first && INTRO(ch.name || ch.id).test(norm(p.text)) && (p.characters || []).includes(ch.id)) add('RELATIONSHIP_RESET', 'high', `Volumul ${v + 1}, pagina ${p.n}: ${ch.name} este prezentat ca un străin, deși îl cunoaștem din volumul ${first}.`, { volumes: [v + 1], pages: [p.n], artifacts: [key] }, [{ artifact: key, path: `pages[${p.n}].text`, quote: p.text.slice(0, 160) }]);
        if (v + 1 < first && ((p.characters || []).includes(ch.id) || norm(p.text).includes(norm(ch.name)))) add('EARLY_APPEARANCE', 'high', `Volumul ${v + 1}, pagina ${p.n}: ${ch.name} apare înainte de volumul ${first}.`, { volumes: [v + 1], pages: [p.n], artifacts: [key] }, [{ artifact: key, path: `pages[${p.n}]`, quote: String(p.text || '').slice(0, 160) }]);
      }
      /* story vs coloring pair: the same holder in both */
      const holds = (p.actions || []).filter(a => /hold|carr|tine|duce|poarta/.test(norm(a.action)));
      const cm = norm(p.coloring_scene).match(HOLDER);
      if (holds.length && cm) { const who = chars.find(ch => norm(ch.name) === cm[1] || ch.id === cm[1]); if (who && !holds.some(h => h.character === who.id)) add('PAIR_HOLDER_MISMATCH', 'high', `Volumul ${v + 1}, pagina ${p.n}: în poveste ține ${holds.map(h => h.character).join(', ')}, în pagina de colorat ține ${who.name}.`, { volumes: [v + 1], pages: [p.n], artifacts: [key] }, [{ artifact: key, path: `pages[${p.n}].actions`, quote: holds[0].action }, { artifact: key, path: `pages[${p.n}].coloring_scene`, quote: String(p.coloring_scene).slice(0, 140) }]); }
      /* objects: one real object unless a reflection/effect explains the second one */
      for (const o of art.bible?.content?.objects || []) {
        const nm = norm(o.name || o.id).split(' ')[0];
        if (new RegExp(`(two|2|doua|doi) ${esc(nm)}|second ${esc(nm)}|al doilea ${esc(nm)}|a doua ${esc(nm)}`).test(norm(p.text)) && (p.objects || []).filter(x => x === o.id).length < 2 && !/reflect|reflex|oglind|mirror|shadow|umbr/.test(norm(`${p.effects} ${p.continuity}`))) add('OBJECT_DUPLICATE', 'high', `Volumul ${v + 1}, pagina ${p.n}: textul spune că există două „${o.name}”, dar canonul are unul singur și nu este explicat (reflexie/umbră).`, { volumes: [v + 1], pages: [p.n], artifacts: [key] }, [{ artifact: key, path: `pages[${p.n}].text`, quote: p.text.slice(0, 160) }]);
      }
    }
    /* last page: every character ends in a clear place; friends do not end up sleeping together */
    const last = (c.pages || [])[c.pages.length - 1], fl = last?.final_locations || {};
    const places = Object.entries(fl).filter(([, w]) => String(w || '').trim());
    const TOGETHER = /(same|together|share|impreuna|acelasi|aceeasi|amandoi|amandoua)/;
    for (let i = 0; i < places.length; i++) for (let j = i + 1; j < places.length; j++) if ((norm(places[i][1]) === norm(places[j][1]) || TOGETHER.test(norm(places[i][1] + ' ' + places[j][1]))) && /sleep|nest|bed|doarm|cuib|pat/.test(norm(places[i][1] + ' ' + places[j][1]))) add('ENDING_LOCATIONS', TOGETHER.test(norm(places[i][1] + ' ' + places[j][1])) ? 'high' : 'medium', TOGETHER.test(norm(places[i][1] + ' ' + places[j][1])) ? `Volumul ${v + 1}: ${places[i][0]} și ${places[j][0]} ajung să doarmă împreună (T15: fiecare la casa lui, dacă nu sunt familie).` : `Volumul ${v + 1}: locul final al lui ${places[i][0]} și ${places[j][0]} este formulat identic („${places[i][1]}”) — precizează că fiecare ajunge la casa lui.`, { volumes: [v + 1], pages: [last.n], artifacts: [key] }, [{ artifact: key, path: `pages[${last.n}].final_locations`, quote: places[i][1] }]);
  }
  /* endings: rephrasings of the same ending across written volumes (declared motifs allowed) */
  for (let a = 0; a < written.length; a++) for (let b = a + 1; b < written.length; b++) {
    const la = book(written[a]).pages?.slice(-1)[0]?.text || '', lb = book(written[b]).pages?.slice(-1)[0]?.text || '';
    const shared = [...words(la)].filter(w => words(lb).has(w)), motifShare = shared.filter(w => [...declared].some(m => m.includes(w)));
    if (jaccard(la, lb) >= 0.5 && motifShare.length < shared.length * 0.7) add('ENDING_REPEAT', 'medium', `Volumele ${written[a] + 1} și ${written[b] + 1} se termină cu același final, reformulat.`, { volumes: [written[a] + 1, written[b] + 1] }, [{ artifact: bookKey(written[a]), path: 'pages[12].text', quote: la.slice(0, 120) }, { artifact: bookKey(written[b]), path: 'pages[12].text', quote: lb.slice(0, 120) }]);
  }
  /* stale premises and turn-contract divergences (DW01/DW02 shapes) with their exact fields and pages */
  for (const c of reconcileReport(art).conflicts) {
    if (c.id === 'DW01') add('PROJECTION_MISMATCH', 'high', 'Volumul 1: premisa (3 copii) contrazice paginile 8–9 (adăpostul prietenilor). Reconcilierea este decizia ta.', { volumes: [1], pages: c.evidence.pages, artifacts: ['series', 'script_0'] }, c.fields.map(f => ({ artifact: f.path.split('.')[0], path: f.path, quote: f.current })));
    if (c.id === 'DW02') add('TURN_CONTRACT_DIVERGENCE', 'medium', `Volumul 1: ${c.pages.length} pagini au alt tip de întoarcere în manuscris decât în plan.`, { volumes: [1], pages: c.pages.map(p => p.n), artifacts: ['series', 'script_0'] }, c.pages.map(p => ({ artifact: 'series', path: `volumes[0].page_plan[${p.n}].turn.type`, quote: `${p.plan} ≠ ${p.script}` })));
  }
  /* plan-level arc/diversity (P4-T02) */
  const m = art.series && art.cast && art.bible ? collectionMatrix({ series: art.series.content, cast: art.cast.content, bible: art.bible.content, brief: art.brief?.content, structure: bp.structure }) : null;
  for (const f of m?.findings || []) add('PLAN_' + f.code, f.severity === 'blocker' ? 'high' : f.severity === 'major' ? 'medium' : 'low', f.message, { volumes: f.volume ? [f.volume] : [] }, []);
  /* the collection is as strong as its weakest required volume (no averaging) */
  const volumes = Array.from({ length: V }, (_, v) => { const b = book(v) ? assessBook({ bp, art, project, v }) : null; return { volume: v + 1, written: !!book(v), bookPass: b ? b.pass : false, reasons: b ? b.reasons : ['Volumul nu este scris încă.'] }; });
  const sev = { high: 3, medium: 2, low: 1 }; issues.sort((x, y) => sev[y.severity] - sev[x.severity] || (x.scope.volumes?.[0] || 0) - (y.scope.volumes?.[0] || 0));
  return { schema: 'wonderpages.collection-qa/1', issues, volumes, high: issues.filter(i => i.severity === 'high').length, collectionPass: !issues.some(i => i.severity === 'high') && volumes.every(v => v.bookPass), differentiation: m ? m.volumes.map(x => ({ volume: x.n, goal: x.goal, ending: x.ending_type, setting: x.setting })) : [] };
}
/** High issues that block the release of a volume (or of the whole collection when vol is null). */
export const releaseIssues = (qa, vol) => qa.issues.filter(i => i.severity === 'high' && (vol == null || !(i.scope.volumes || []).length || i.scope.volumes.includes(vol + 1)));
