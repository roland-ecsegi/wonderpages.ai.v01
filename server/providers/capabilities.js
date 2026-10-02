/**
 * P1-T03 (extended in P3-T05) — ProviderCapabilitySnapshot (OUTPUT-08).
 *
 * Separate snapshots per channel and capability (text vs image). States installed / authenticated /
 * verified / limited / unknown are kept apart, every snapshot has evidence, `checkedAt` and `expiresAt`.
 * Rule: UNKNOWN IS NEVER GREEN. A channel is `supported` only with a successful, unexpired real probe;
 * otherwise it is `limited`, `unknown`, `unavailable` or falls back to `operator-assisted` (manual exchange).
 * Discovery is read-only: version / login-status / tool listing. No generation, no API keys, no purchase.
 */
import os from 'node:os';
import fs from 'node:fs';
import { canonicalHash } from '../domain/canonical.js';

export const CHANNELS = Object.freeze({
  'claude-code-text': { capability: 'text', provider: 'Claude Code (abonament Claude, CLI oficial)', terms: 'https://code.claude.com/docs/en/legal-and-compliance', expectedModels: ['sonnet', 'haiku'] },
  'codex-text': { capability: 'text', provider: 'Codex CLI (plan ChatGPT)', terms: 'https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan', expectedModels: ['gpt-6-sol'] },
  'codex-image': { capability: 'image', provider: 'Codex CLI imagini (plan ChatGPT)', terms: 'https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan', expectedModels: [] },
  'canva-mcp': { capability: 'image', provider: 'Canva MCP (OAuth individual)', terms: 'https://www.canva.dev/docs/apps/mcp/access/', expectedTools: ['generate-image', 'get-generate-image-job'] },
  'operator-exchange': { capability: 'text+image', provider: 'Schimb manual prin operator (aplicațiile oficiale)', terms: null }
});
export const TTL = Object.freeze({ auth: 24 * 3600e3, quota: 3600e3, probe: 7 * 24 * 3600e3, tools: 24 * 3600e3 });

/**
 * Pure classification of observations into a snapshot.
 * obs: { installed, version, auth: true|false|null|'apikey', authDetail, models:{available:[],unavailable:[]}, quota:{status:'ok'|'limited'|'unknown', resetAt, provenance},
 *        tools:[names]|null, toolSchemaHash, expectedToolSchemaHash, realProbe:{ok, at, model}|null, termsAcknowledgedAt }
 */
export function buildSnapshot(channel, obs = {}, now = Date.now()) {
  const def = CHANNELS[channel]; if (!def) throw { status: 400, message: 'Canal necunoscut.' };
  const reasons = [], evidence = [], unavailableModels = obs.models?.unavailable || [];
  const states = { installed: obs.installed === true ? true : obs.installed === false ? false : null, authenticated: obs.auth === true ? true : obs.auth === null || obs.auth === undefined ? null : false, verified: false, limited: false };
  if (channel === 'operator-exchange') return finish({ status: 'operator-assisted', decision: 'operator-assisted', states: { installed: true, authenticated: null, verified: true, limited: false }, reasons: ['Canal manual mereu disponibil: pachet de lucru cu schemă, hash-uri și instrucțiuni de retur.'], evidence: ['contract intern'] });
  if (obs.version) evidence.push(`executabil ${obs.version}`);
  if (states.installed === false) { reasons.push('Executabilul/conectorul nu este instalat sau nu răspunde.'); return finish({ status: 'unavailable', decision: 'operator-assisted', states, reasons, evidence }); }
  if (obs.auth === 'apikey') { reasons.push('Autentificare cu cheie API: interzisă în modul principal (fără facturare API în P1–P8).'); states.authenticated = false; return finish({ status: 'unavailable', decision: 'operator-assisted', states, reasons, evidence }); }
  if (states.authenticated === false) { reasons.push('Neautentificat prin login-ul oficial.'); return finish({ status: 'unavailable', decision: 'operator-assisted', states, reasons, evidence }); }
  if (states.installed === null || states.authenticated === null) { reasons.push(states.installed === null ? 'Instalarea nu a fost verificată.' : 'Autentificarea nu poate fi verificată (auth null).'); return finish({ status: 'unknown', decision: 'operator-assisted', states, reasons, evidence }); }
  evidence.push('login oficial confirmat' + (obs.authDetail ? ` (${obs.authDetail})` : ''));
  if (def.expectedTools) {
    if (!Array.isArray(obs.tools)) reasons.push('Lista de instrumente nu este disponibilă.');
    else {
      const missing = def.expectedTools.filter(t => !obs.tools.includes(t));
      if (missing.length) { reasons.push(`Instrumente lipsă: ${missing.join(', ')}.`); states.limited = true; }
      if (obs.expectedToolSchemaHash && obs.toolSchemaHash && obs.toolSchemaHash !== obs.expectedToolSchemaHash) { reasons.push('Schema instrumentelor s-a schimbat față de ultima verificare: renegociere necesară.'); states.limited = true; }
      evidence.push(`instrumente: ${obs.tools.length}`);
    }
  }
  if (unavailableModels.length) { reasons.push(`Model indisponibil: ${unavailableModels.join(', ')}.`); states.limited = true; }
  if (obs.quota?.status === 'limited') { reasons.push('Limita inclusă a abonamentului este atinsă' + (obs.quota.resetAt ? ` (resetare ${new Date(obs.quota.resetAt).toISOString()})` : '') + '.'); states.limited = true; }
  else if (!obs.quota || obs.quota.status === 'unknown') reasons.push('Cota nu poate fi verificată (unknown): nu se presupune disponibilă.');
  else evidence.push(`cotă: ${obs.quota.status} (${obs.quota.provenance || 'provider'})`);
  const probeFresh = obs.realProbe?.ok === true && now - (obs.realProbe.at || 0) < TTL.probe;
  states.verified = probeFresh;
  if (!probeFresh) reasons.push(obs.realProbe?.ok === false ? 'Proba reală a eșuat.' : 'Fără probă reală recentă și permisă: capabilitatea nu este verificată.');
  else evidence.push(`probă reală ${new Date(obs.realProbe.at).toISOString()}${obs.realProbe.model ? ` (${obs.realProbe.model})` : ''}`);
  const status = states.limited ? 'limited' : probeFresh && obs.quota?.status === 'ok' ? 'supported' : 'unknown';
  return finish({ status, decision: status === 'supported' ? 'supported' : 'operator-assisted', states, reasons, evidence });

  function finish(r) {
    const ttl = Math.min(TTL.auth, obs.quota ? TTL.quota : TTL.auth, def.expectedTools ? TTL.tools : TTL.auth);
    const snap = { kind: 'wonderpages.provider-capability/1', channel, capability: def.capability, provider: def.provider, ...r, executableVersion: obs.version || null, models: { configured: def.expectedModels || [], available: obs.models?.available || [], unavailable: unavailableModels, availability: obs.models?.available?.length ? 'verified' : 'unknown' }, quota: obs.quota ? { ...obs.quota } : { status: 'unknown', provenance: 'none' }, tools: Array.isArray(obs.tools) ? obs.tools : null, toolSchemaHash: obs.toolSchemaHash || null, realProbe: obs.realProbe || null, terms: { url: def.terms, entitlement: obs.realProbe?.ok ? 'observed' : 'unknown', acknowledgedAt: obs.termsAcknowledgedAt || null, note: 'Abonamentul nu dovedește drept de folosire automată nelimitată; condițiile se verifică la sursa oficială.' }, checkedAt: now, expiresAt: now + ttl };
    snap.green = snap.status === 'supported';
    return snap;
  }
}
/** A stale snapshot downgrades to unknown; it never stays green after expiry. */
export function effective(snap, now = Date.now()) {
  if (!snap) return null;
  if (now <= snap.expiresAt) return snap;
  return { ...snap, status: snap.status === 'operator-assisted' ? snap.status : 'unknown', decision: 'operator-assisted', green: false, stale: true, reasons: [...snap.reasons, 'Verificarea a expirat; rulează din nou discovery.'] };
}
export const toolSchemaHash = tools => canonicalHash((tools || []).map(t => ({ name: t.name, input: t.inputSchema || null })).sort((a, b) => a.name.localeCompare(b.name)));

/** Host configuration without secrets (P1-T03 / U04). */
export function hostConfig(extra = {}) {
  let disk = null; try { const s = fs.statfsSync(extra.dataDir || os.tmpdir()); disk = { freeBytes: s.bavail * s.bsize, totalBytes: s.blocks * s.bsize }; } catch {}
  return { platform: os.platform(), release: os.release(), arch: os.arch(), cpus: os.cpus().length, memoryBytes: os.totalmem(), node: process.version, storage: extra.storage || null, disk, envelope: { activeProjects: 1, imageOpsSerialized: true, maxConcurrentText: 2 } };
}

/**
 * Read-only discovery from the existing adapters. `probes` are injected (tests use simulated ones).
 * Real generation probes are NOT part of discovery; they are recorded via `recordRealProbe` when an
 * operator explicitly runs one on an authorized account.
 */
export async function discover(probes, previous = {}, now = Date.now()) {
  const out = {}, errors = {};
  const probe = async fn => { try { return fn ? await fn() : null; } catch (e) { errors[fn.name || 'probe'] = String(e?.message || e).slice(0, 200); return null; } };
  const cc = await probe(probes.claudeText);
  out['claude-code-text'] = buildSnapshot('claude-code-text', { installed: cc ? cc.installed : null, version: cc?.version, auth: cc?.auth ?? null, authDetail: cc?.authDetail, quota: cc?.quota, models: cc?.models, realProbe: previous['claude-code-text']?.realProbe || cc?.realProbe || null }, now);
  const ct = await probe(probes.codexText);
  out['codex-text'] = buildSnapshot('codex-text', { installed: ct ? ct.installed : null, version: ct?.version, auth: ct?.auth ?? null, quota: ct?.quota, models: ct?.models, realProbe: previous['codex-text']?.realProbe || null }, now);
  const ci = await probe(probes.codexImage);
  out['codex-image'] = buildSnapshot('codex-image', { installed: ci ? ci.installed : null, version: ci?.version, auth: ci?.auth ?? null, quota: ci?.quota, realProbe: previous['codex-image']?.realProbe || (ci?.generationVerified ? { ok: true, at: ci.generationVerified } : null) }, now);
  const cv = await probe(probes.canva);
  out['canva-mcp'] = buildSnapshot('canva-mcp', { installed: cv ? cv.installed : null, auth: cv?.auth ?? null, tools: cv?.tools ?? null, toolSchemaHash: cv?.toolSchemaHash, expectedToolSchemaHash: previous['canva-mcp']?.toolSchemaHash || null, quota: cv?.quota, realProbe: previous['canva-mcp']?.realProbe || null }, now);
  out['operator-exchange'] = buildSnapshot('operator-exchange', {}, now);
  return { kind: 'wonderpages.capability-discovery/1', at: now, channels: out, probeErrors: errors, summary: Object.fromEntries(Object.entries(out).map(([k, s]) => [k, s.status])) };
}
