/**
 * P4-T05 — selective reconciliation of a migrated project (Dinosaur World DW01/DW02), dry-run first.
 * - DW01: the three copies of the V1 premise still say the friends protect the pebble from rain, while pages 8–9
 *   shelter the friends themselves → a targeted, operator-resolvable change of exactly those fields.
 * - DW02: the V1 page plan marks every turn "quiet" while the manuscript has typed turns → per page, the operator
 *   chooses the intended contract (default proposal: the manuscript's typed turn) → canonical V1 PageBlueprints.
 * - Facts verified on the pages (no change): p1 pebble absent, p2 first reveal, p9 Tia holds the leaf with her mouth.
 * Nothing is rewritten wholesale, nothing is approved; untouched text and reference hashes stay identical.
 */
import { canonicalHash, sha256 } from '../domain/canonical.js';

const RAIN_PEBBLE = /(împreună\s+|impreuna\s+)?(o\s+)?feresc de ploaie|protej\w*[^.]{0,40}(pietr|pebble)[^.]{0,40}(ploaie|rain)|(shield|protect)\w*[^.]{0,30}pebble[^.]{0,30}rain/i;
const SHELTER_CLAUSE = 'se adăpostesc împreună de ploaie sub o frunză lată';
const premiseFields = A => [
  { path: 'series.volumes[0].summary', key: 'series', get: c => c?.volumes?.[0]?.summary, set: (c, v) => { c.volumes[0].summary = v; } },
  { path: 'series.volumes[0].story_bible.premise', key: 'series', get: c => c?.volumes?.[0]?.story_bible?.premise, set: (c, v) => { c.volumes[0].story_bible.premise = v; } },
  { path: 'script_0.story_bible.premise', key: 'script_0', get: c => c?.story_bible?.premise, set: (c, v) => { c.story_bible.premise = v; } }
].map(f => ({ ...f, value: f.get(A[f.key]?.content) })).filter(f => typeof f.value === 'string');

export function reconcileReport(art) {
  const script = art.script_0?.content, v0 = art.series?.content?.volumes?.[0], pages = script?.pages || [];
  const conflicts = [], facts = [];
  /* DW01 — stale premises vs pages 8–9 */
  const shelter = [8, 9].map(n => pages.find(p => p.n === n)?.text || '').join(' ');
  const stale = premiseFields(art).filter(f => RAIN_PEBBLE.test(f.value));
  if (stale.length && /two friends|roof for two|underneath|dry noses/i.test(shelter)) conflicts.push({ id: 'DW01', kind: 'stale_premise', title: 'Premisa V1 spune că prietenii feresc pietricica de ploaie; paginile 8–9 îi adăpostesc pe prieteni', evidence: { pages: [8, 9], text: shelter.slice(0, 240) },
    fields: stale.map(f => ({ path: f.path, current: f.value, proposed: f.value.replace(RAIN_PEBBLE, SHELTER_CLAUSE) })), options: ['align_to_pages', 'keep'], recommended: 'align_to_pages', note: 'Schimbare țintită a celor trei câmpuri; restul textului rămâne identic. Necesită decizia ta.' });
  /* DW02 — plan turn types vs manuscript */
  const plan = v0?.page_plan || [];
  const diverge = plan.map((pp, i) => ({ n: pp.n || i + 1, plan: pp.turn?.type || 'quiet', script: pages[i]?.turn?.type || null, scriptTurn: pages[i]?.turn || null })).filter(d => d.script && d.plan !== d.script);
  if (diverge.length) conflicts.push({ id: 'DW02', kind: 'turn_divergence', title: `${diverge.length} pagini au alt tip de întoarcere în manuscris decât în planul paginilor V1`, pages: diverge.map(d => ({ n: d.n, plan: d.plan, script: d.script, hook: d.scriptTurn?.hook || '', payoff_page: d.scriptTurn?.payoff_page ?? null })), options: ['script', 'plan'], recommended: 'script', note: 'Pentru fiecare pagină alegi contractul intenționat; implicit propunem tipul din manuscris (planul are „quiet” peste tot).' });
  /* facts checked on the pages (evidence only) */
  const pebble = (art.bible?.content?.objects || []).find(o => /pebble|pietr/i.test(`${o.id} ${o.name}`))?.id || 'shiny-pebble';
  const has = (p, id) => (p?.objects || []).includes(id);
  facts.push({ id: 'p1-pebble-absent', ok: !!pages[0] && !has(pages[0], pebble), evidence: `p1 objects: ${(pages[0]?.objects || []).join(', ') || '—'}` });
  facts.push({ id: 'p2-first-reveal', ok: !!pages[1] && has(pages[1], pebble) && !pages.slice(0, 1).some(p => has(p, pebble)), evidence: `p2 objects: ${(pages[1]?.objects || []).join(', ')}; turn: ${pages[1]?.turn?.type || '—'}` });
  const tia = (pages[8]?.actions || []).find(a => a.character === 'tia');
  facts.push({ id: 'p9-mouth-action', ok: !!tia && /mouth|beak|bot|gur/i.test(tia.action || '') && /hold|ține|tine/i.test(tia.action || ''), evidence: tia?.action || '—' });
  /* hashes preserved by any repair: every page text and every reference */
  const preserved = { pages: pages.map(p => ({ n: p.n, sha256: sha256(String(p.text || '')), sha256_ro: p.text_ro ? sha256(String(p.text_ro)) : null })) };
  return { schema: 'wonderpages.reconcile/1', dryRun: true, conflicts, facts, preserved, hash: canonicalHash({ conflicts, facts }) };
}

/** Applies ONLY the operator's choices; returns the artifact contents to write (nothing else changes). */
export function applyReconcile(art, report, choices = {}) {
  const writes = {}, applied = [];
  const clone = k => (writes[k] ||= structuredClone(art[k].content));
  const dw01 = report.conflicts.find(c => c.id === 'DW01');
  if (dw01 && choices.DW01 && !['align_to_pages', 'keep'].includes(choices.DW01)) throw { status: 400, message: 'Alegere necunoscută pentru DW01.' };
  if (dw01 && choices.DW01 === 'align_to_pages') {
    for (const f of premiseFields(art).filter(x => dw01.fields.some(y => y.path === x.path))) { const proposed = typeof choices.premise === 'string' && choices.premise.trim() ? choices.premise.trim().slice(0, 600) : dw01.fields.find(y => y.path === f.path).proposed; f.set(clone(f.key), proposed); applied.push({ conflict: 'DW01', path: f.path, from: f.value, to: proposed }); }
  }
  const dw02 = report.conflicts.find(c => c.id === 'DW02');
  if (dw02 && choices.DW02) {
    const per = typeof choices.DW02 === 'string' ? Object.fromEntries(dw02.pages.map(p => [p.n, choices.DW02])) : choices.DW02;
    for (const p of dw02.pages) {
      const pick = per[p.n] || per[String(p.n)]; if (!pick) continue; if (!['script', 'plan'].includes(pick)) throw { status: 400, message: `Alegere necunoscută pentru pagina ${p.n}.` };
      if (pick === 'script') { const s = clone('series'), pp = s.volumes[0].page_plan.find(x => (x.n || 0) === p.n); pp.turn = { ...pp.turn, type: p.script, hook: p.hook || pp.turn?.hook || '', payoff_page: p.payoff_page ?? pp.turn?.payoff_page ?? null }; applied.push({ conflict: 'DW02', path: `series.volumes[0].page_plan[${p.n}].turn.type`, from: p.plan, to: p.script }); }
      else applied.push({ conflict: 'DW02', path: `script_0.pages[${p.n}].turn.type`, from: p.script, to: p.script, note: 'planul rămâne „quiet”; pagina din manuscris se revizuiește la poarta volumului' });
    }
  }
  return { writes, applied };
}
