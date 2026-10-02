/**
 * Registrul de consum și calitate (plan 2.6). Fiecare apel Claude, fiecare imagine, fiecare evaluare a criticului și fiecare
 * decizie de la porți lasă un rând. Din el se calculează: consumul pe etape, efectul lecțiilor (3.1), pragurile calibrate (3.8),
 * raportul pe versiuni (3.10) și estimarea unei colecții (2.5). Totul rămâne pe calculatorul tău.
 */
import { bus } from './repo.js';

let storage = null; let ROWS = []; let saveT = null;
const MAX = 30000;
export async function initLedger(s) { storage = s; ROWS = (await s.readJSON('ledger.json', [])) || []; }
const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => storage?.writeJSON('ledger.json', ROWS).catch(e => console.warn('[ledger]', e.message)), 1500); saveT.unref?.(); };
/* kind: text | image | quality | gate | lint | retro */
export function record(row) {
  ROWS.push({ t: Date.now(), ...row }); if (ROWS.length > MAX) ROWS = ROWS.slice(-MAX);
  persist(); bus.emit('change', { scope: 'ledger' });
}
export const rows = (filter = () => true) => ROWS.filter(filter);
const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const r1 = x => (x == null ? null : Math.round(x * 10) / 10);

/* consumption per stage (base key) and agent, over the last `days` days */
export function summary(days = 30) {
  const since = Date.now() - days * 864e5; const text = ROWS.filter(r => r.kind === 'text' && r.t >= since), img = ROWS.filter(r => r.kind === 'image' && r.t >= since);
  const by = {};
  for (const r of text) {
    const k = `${r.stage || '—'}|${r.agent || '—'}|${r.model || '—'}`; const b = by[k] = by[k] || { stage: r.stage || '—', agent: r.agent || '—', model: r.model || '—', calls: 0, errors: 0, bytesIn: 0, bytesOut: 0, ms: 0, inTok: 0, outTok: 0, cacheRead: 0, schema: 0 };
    b.calls++; if (!r.ok) b.errors++; b.bytesIn += r.bytesIn || 0; b.bytesOut += r.bytesOut || 0; b.ms += r.ms || 0; b.inTok += r.inTok || 0; b.outTok += r.outTok || 0; b.cacheRead += r.cacheRead || 0; if (r.schema === 'cli') b.schema++;
  }
  const stages = Object.values(by).map(b => ({ ...b, avgKB: r1(b.bytesIn / Math.max(1, b.calls) / 1024), avgSec: r1(b.ms / Math.max(1, b.calls) / 1000) })).sort((a, b) => b.bytesIn - a.bytesIn);
  const quality = ROWS.filter(r => r.kind === 'quality' && r.t >= since);
  return {
    days, textCalls: text.length, imageCalls: img.length, textErrors: text.filter(r => !r.ok).length,
    cacheShare: (() => { const inT = text.reduce((a, r) => a + (r.inTok || 0) + (r.cacheRead || 0), 0); return inT ? r1(100 * text.reduce((a, r) => a + (r.cacheRead || 0), 0) / inT) : null; })(),
    schemaShare: text.length ? r1(100 * text.filter(r => r.schema === 'cli').length / text.length) : null,
    stages, redraws: img.filter(r => r.redraw).length,
    critic: { evaluations: quality.length, avgScore: r1(avg(quality.map(q => q.score).filter(x => x != null))), avgRounds: r1(avg(Object.values(quality.reduce((m, q) => { const k = `${q.pid}|${q.vol}|${q.stage}`; m[k] = Math.max(m[k] || 0, q.round || 0); return m; }, {})))), lintStops: ROWS.filter(r => r.kind === 'lint' && r.t >= since && r.hard).length }
  };
}
/* average calls per volume, from finished volumes (review_2 approved), for the estimate before a collection starts */
export function perVolume() {
  const gates = ROWS.filter(r => r.kind === 'gate' && r.gate === 'review_2' && ['approved', 'approved_with_notes'].includes(r.decision));
  const vols = gates.map(g => ({ pid: g.pid, vol: g.vol }));
  const counts = vols.map(({ pid, vol }) => ({ text: ROWS.filter(r => r.kind === 'text' && r.pid === pid && r.vol === vol).length, image: ROWS.filter(r => r.kind === 'image' && r.pid === pid && r.vol === vol).length })).filter(c => c.text);
  const collection = avg(ROWS.filter(r => r.kind === 'gate' && r.gate === 'review_collection' && r.decision === 'approved').map(g => ROWS.filter(r => r.kind === 'text' && r.pid === g.pid && r.vol == null && r.t <= g.t).length));
  return { samples: counts.length, text: counts.length ? Math.round(avg(counts.map(c => c.text))) : 12, image: counts.length ? Math.round(avg(counts.map(c => c.image))) : 30, collection: collection ? Math.round(collection) : 5, measured: counts.length > 0 };
}
export function csv(days = 90) {
  const since = Date.now() - days * 864e5; const cols = ['t', 'kind', 'pid', 'vol', 'stage', 'prompt', 'agent', 'model', 'ok', 'ms', 'bytesIn', 'bytesOut', 'inTok', 'outTok', 'cacheRead', 'schema', 'score', 'rounds', 'criteria', 'gate', 'decision', 'code', 'bp', 'charter', 'redraw', 'engine'];
  const esc = v => { if (v == null) return ''; const s = typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(','), ...ROWS.filter(r => r.t >= since).map(r => cols.map(c => esc(c === 't' ? new Date(r.t).toISOString() : r[c])).join(','))].join('\n');
}

/* plan 3.10: the same measures grouped by blueprint version (and by month), so a change of prompts or charters is visible in numbers */
export function evolution() {
  const groups = {};
  const g = (key, label) => (groups[key] = groups[key] || { key, label, evals: [], gates: [], redraws: 0, images: 0, text: 0 });
  for (const r of ROWS) {
    const month = new Date(r.t).toISOString().slice(0, 7); const key = `${r.bp ?? '—'}|${month}`;
    if (r.kind === 'quality' && r.round === 0 && r.stage === 'critic') g(key, { bp: r.bp ?? null, month }).evals.push(r);
    else if (r.kind === 'gate') g(key, { bp: r.bp ?? null, month }).gates.push(r);
    else if (r.kind === 'image') { const x = g(key, { bp: r.bp ?? null, month }); x.images++; if (r.redraw) x.redraws++; }
    else if (r.kind === 'text') g(key, { bp: r.bp ?? null, month }).text++;
  }
  return Object.values(groups).map(x => {
    const crit = {}; for (const e of x.evals) for (const [c, v] of Object.entries(e.criteria || {})) (crit[c] = crit[c] || []).push(v);
    const vols = x.gates.filter(q => q.gate === 'review_2' && ['approved', 'approved_with_notes'].includes(q.decision)).length;
    return { bp: x.label.bp, month: x.label.month, volumes: vols, textCalls: x.text, images: x.images, redraws: x.redraws,
      firstPass: x.gates.length ? r1(100 * x.gates.filter(q => q.firstPass).length / x.gates.filter(q => q.round === 1).length || 0) : null,
      avgScore: r1(avg(x.evals.map(e => e.score))), weakest: Object.entries(crit).map(([c, v]) => [c, r1(avg(v))]).sort((a, b) => a[1] - b[1]).slice(0, 3) };
  }).filter(x => x.textCalls || x.volumes || x.images).sort((a, b) => (a.month < b.month ? 1 : -1));
}

/* v19.1: a permanently deleted project leaves no rows here */
export async function purge(pid) { const n = ROWS.length; ROWS = ROWS.filter(r => r.pid !== pid); const d = n - ROWS.length; clearTimeout(saveT); await storage?.writeJSON('ledger.json', ROWS); if (d) bus.emit('change', { scope: 'ledger' }); return d; }

export async function flushLedger(){clearTimeout(saveT);if(storage)await storage.writeJSON('ledger.json',ROWS);}
