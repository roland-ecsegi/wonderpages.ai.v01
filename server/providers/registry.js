/**
 * P1-T03 — persisted capability state (storage document `capabilities.json`). Discovery is read-only;
 * real probes are recorded only from operator-initiated, laptop-only checks on the operator's own account.
 */
import { discover, effective, buildSnapshot, CHANNELS } from './capabilities.js';

let storage = null, probes = {}, state = { discovery: null, probes: {}, history: [] };
export async function initCapabilities(s, p) { storage = s; probes = p || {}; state = (await s.readJSON('capabilities.json', null)) || { discovery: null, probes: {}, history: [] }; state.probes ||= {}; state.history ||= []; }
const persist = () => storage?.writeJSON('capabilities.json', state);

export async function runDiscovery(now = Date.now()) {
  const previous = Object.fromEntries(Object.entries(state.discovery?.channels || {}).map(([k, v]) => [k, { ...v, realProbe: state.probes[k] || null }]));
  const r = await discover(probes, previous, now);
  state.discovery = r; state.history = [...state.history, { at: r.at, summary: r.summary }].slice(-50);
  await persist(); return getCapabilities(now);
}
/** Records the outcome of a real, minimal, operator-run probe (no automatic spend). */
export async function recordRealProbe(channel, ok, detail = {}) {
  if (!CHANNELS[channel]) return;
  state.probes[channel] = { ok: !!ok, at: Date.now(), model: detail.model || null, note: String(detail.note || '').slice(0, 200) };
  if (state.discovery?.channels?.[channel]) { const prev = state.discovery.channels[channel]; state.discovery.channels[channel] = { ...prev, realProbe: state.probes[channel], states: { ...prev.states, verified: !!ok } }; }
  await persist();
}
export function getCapabilities(now = Date.now()) {
  const ch = state.discovery?.channels || {};
  const channels = Object.fromEntries(Object.keys(CHANNELS).map(k => [k, ch[k] ? effective(ch[k], now) : buildSnapshot(k, k === 'operator-exchange' ? {} : { installed: null }, now)]));
  return { discoveredAt: state.discovery?.at || null, probeErrors: state.discovery?.probeErrors || {}, channels, probes: state.probes, history: state.history.slice(-10), rule: 'unknown nu este verde; numai o probă reală recentă și cota verificată fac un canal „supported”.' };
}
/** Admission helper for later phases: may production use this channel automatically? */
export function channelUsable(channel, now = Date.now()) { const s = getCapabilities(now).channels[channel]; return { usable: s?.status === 'supported', status: s?.status || 'unknown', reasons: s?.reasons || [] }; }

/** P3-T05 — execution-time capability check. Unavailable or tool-limited channels are refused (manual exchange instead);
 *  a provider-reported quota limit becomes a durable wait; a stale or never-run discovery does not block (status unknown). */
export function assertExecutable(channel, { needsRefs = false } = {}) {
  const s = getCapabilities().channels[channel]; if (!s || s.stale || !state.discovery) return { checked: false };
  if (s.status === 'unavailable') throw { status: 409, code: 'capability_unavailable', channel, message: `${s.provider}: indisponibil (${s.reasons.join(' ')}). Folosește schimbul manual sau reconectează contul oficial.` };
  if (s.quota?.status === 'limited') throw { code: 'rate_limited', provider: channel, resetAt: s.quota.resetAt || Date.now() + 15 * 60e3, message: `${s.provider}: limita inclusă este atinsă; aștept resetarea.` };
  if (s.reasons.some(r => /Instrumente lipsă|Schema instrumentelor|Model indisponibil/.test(r))) throw { status: 409, code: 'capability_limited', channel, message: `${s.provider}: ${s.reasons.filter(r => /Instrumente|Schema|Model/.test(r)).join(' ')} Folosește schimbul manual până la o nouă verificare.` };
  if (needsRefs && channel === 'canva-mcp' && s.toolInputs?.['generate-image'] && !s.toolInputs['generate-image'].includes('imageReferences')) throw { status: 409, code: 'capability_limited', reason: 'refs_unsupported', channel, message: 'Canva nu acceptă imagini de referință pentru acest cont/client; fără ele s-ar pierde identitatea personajelor. Folosește alt canal sau schimbul manual.' };
  return { checked: true, status: s.status };
}
