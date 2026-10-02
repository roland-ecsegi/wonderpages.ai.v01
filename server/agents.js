/**
 * Agenți permanenți: fiecare are o identitate (persona), memorie (lecții aprobate) și statistici.
 * Agenți temporari: fiecare apel efectiv este o instanță temporară a unui agent permanent,
 * vizibilă live în aplicație și înregistrată în statistici.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from './config.js';
import { bus } from './repo.js';

/* sha1 (first 16 hex) of the one-line personas shipped up to 18.3: if agents.json still holds one of them, the user never edited it */
const LEGACY_DEFAULTS = new Set(['59fce0ed900453c2', 'ea94040a5a235cdc', 'c296b15d5122fa21', '60c4aa155a67bdd1', 'ddc06a57be50dc37', 'c69443092d38df83', '7a45efed69c64a7e', 'bb7094cffb171c7c', 'cc3c215a05878cdd', '5bd294ed2f3dec20', '642c524afc2f7ac9']);
const sha = t => crypto.createHash('sha1').update(String(t).trim()).digest('hex').slice(0, 16);
let storage; let AGENTS = {}; let STATS = {}; const ACTIVE = new Map(); let statsTimer = null;
function parseMd(txt) {
  const m = txt.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/); if (!m) return null;
  const meta = Object.fromEntries(m[1].split('\n').map(l => l.split(/:\s(.*)/s).slice(0, 2)).filter(x => x[0]));
  return { ...meta, persona: m[2].trim() };
}
export async function initAgents(s) {
  storage = s;
  const saved = (await storage.readJSON('agents.json', {})) || {};
  for (const f of await fs.readdir(path.join(ROOT, 'agents'))) {
    if (!f.endsWith('.md')) continue;
    const a = parseMd(await fs.readFile(path.join(ROOT, 'agents', f), 'utf8'));
    if (!a?.id) continue;
    const mine = { ...(saved[a.id] || {}) };
    if (mine.persona && (mine.persona === a.persona || LEGACY_DEFAULTS.has(sha(mine.persona)))) delete mine.persona;   // v19: an untouched old default gets the new charter
    AGENTS[a.id] = { ...a, ...mine, id: a.id, defaultPersona: a.persona, charterVersion: `${a.id}@${a.charter || 1}${mine.persona ? '*' : ''}` };
  }
  STATS = (await storage.readJSON('agent-stats.json', {})) || {};
}
const ORDER = ['asistent', 'producator', 'director-creativ', 'arhitect-serie', 'pastrator-continuitate', 'scriitor', 'editor-critic', 'corector', 'director-artistic'];
export const listAgents = () => Object.values(AGENTS).sort((x, y) => (ORDER.indexOf(x.id) + 99) % 99 - (ORDER.indexOf(y.id) + 99) % 99).map(a => ({ ...a, stats: STATS[a.id] || { calls: 0, ms: 0, errors: 0 }, active: [...ACTIVE.values()].filter(x => x.agent === a.id) }));
export const getAgent = id => AGENTS[id] || AGENTS.producator || null;
export async function updateAgent(id, patch) {
  if (!AGENTS[id]) throw { status: 404, message: 'Agent inexistent.' };
  if (typeof patch.persona === 'string') { AGENTS[id].persona = patch.persona.trim() || AGENTS[id].defaultPersona; AGENTS[id].charterVersion = `${id}@${AGENTS[id].charter || 1}${AGENTS[id].persona !== AGENTS[id].defaultPersona ? '*' : ''}`; }
  if (patch.model != null) {
    if (['sonnet', 'haiku', 'gpt-6-sol'].includes(patch.model)) AGENTS[id].model = patch.model;
  }
  const saved = Object.fromEntries(Object.values(AGENTS).map(a => [a.id, { ...(a.persona !== a.defaultPersona ? { persona: a.persona } : {}), model: a.model }]));   // only what you changed is stored
  await storage.writeJSON('agents.json', saved); bus.emit('change', { scope: 'agents' });
  return AGENTS[id];
}
/* a temporary agent: one real Claude/Canva process working for a permanent agent */
export function startInstance(agent, pid, task) {
  const id = Math.random().toString(36).slice(2); ACTIVE.set(id, { id, agent, pid, task, since: Date.now() });
  bus.emit('change', { scope: 'agents' });
  return (ok = true) => {
    const x = ACTIVE.get(id); ACTIVE.delete(id); if (!x) return;
    const s = STATS[agent] = STATS[agent] || { calls: 0, ms: 0, errors: 0 };
    s.calls++; s.ms += Date.now() - x.since; if (!ok) s.errors++; s.last = Date.now();
    clearTimeout(statsTimer); statsTimer = setTimeout(() => storage.writeJSON('agent-stats.json', STATS).catch(() => {}), 2000);
    bus.emit('change', { scope: 'agents' });
  };
}

export async function flushAgents(){clearTimeout(statsTimer);if(storage)await storage.writeJSON('agent-stats.json',STATS);}
