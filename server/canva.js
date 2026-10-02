/**
 * Furnizor de imagini: Canva, prin serverul MCP oficial (https://mcp.canva.com/mcp).
 * Autentificarea este OAuth în browser, cu contul tău Canva; nu există chei de copiat.
 * Instrumente folosite: generate-image (pornește un job) și get-generate-image-job (verifică jobul).
 */
import crypto from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';
import { config } from './config.js';
import { seal, unseal } from './secrets.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const POLL_MS = Number(process.env.CANVA_POLL_MS || 5000);
/* Canva Pro keeps working after the monthly AI allowance, with short pauses: recognise that answer as a pause, not a failure */
const PAUSE_RE = /(limit|allowance|pause|paused|too many|rate|quota|try again|temporarily|wait|slow down|usage)/i;
const pauseErr = msg => ({ code: /(quota|allowance|usage limit|monthly limit|credits|upgrade|payment|billing)/i.test(String(msg)) ? 'rate_limited' : 'canva_pause', provider: 'canva', resetAt: Date.now() + 3600e3, message: 'Canva cere o pauză: ' + String(msg || '').slice(0, 160) });
const INTENT = "WonderPages.AI: generate an illustration for a children's picture book page";

/* OAuth state persisted in the local data store (tokens never leave this computer) */
class StoredOAuthProvider {
  constructor(storage, redirectUrl) { this.storage = storage; this.redirect = redirectUrl; this.file = '.canva-auth.json'; this.data = {}; this.pendingAuthUrl = null; }
  async load() { this.data = unseal(await this.storage.readJSON(this.file, {})) || {}; }
  async persist() { await this.storage.writeJSON(this.file, seal(this.data)); }   // audit H2: encrypted at rest
  get redirectUrl() { return this.redirect; }
  get clientMetadata() {
    return {
      client_name: 'WonderPages.AI (local)', redirect_uris: [this.redirect],
      grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'],
      token_endpoint_auth_method: config.canva.clientSecret ? 'client_secret_post' : 'none'
    };
  }
  state() { this.data.state = crypto.randomBytes(16).toString('hex'); this.persist(); return this.data.state; }
  clientInformation() {
    if (config.canva.clientId) return { client_id: config.canva.clientId, ...(config.canva.clientSecret ? { client_secret: config.canva.clientSecret } : {}) };
    return this.data.client;
  }
  async saveClientInformation(info) { this.data.client = info; await this.persist(); }
  tokens() { return this.data.tokens; }
  async saveTokens(t) { this.data.tokens = t; await this.persist(); }
  async redirectToAuthorization(url) { this.pendingAuthUrl = url.toString(); }
  async saveCodeVerifier(v) { this.data.verifier = v; await this.persist(); }
  codeVerifier() { if (!this.data.verifier) throw new Error('Lipsește code verifier-ul OAuth.'); return this.data.verifier; }
  async invalidateCredentials(scope) {
    if (scope === 'all' || scope === 'tokens') delete this.data.tokens;
    if (scope === 'all' || scope === 'client') delete this.data.client;
    if (scope === 'all' || scope === 'verifier') delete this.data.verifier;
    await this.persist();
  }
  async logout() { this.data = {}; await this.persist(); }
}

/* --- defensive readers for tool results (text JSON, structuredContent, image/resource blocks) --- */
function payloads(result) {
  const out = [];
  if (result?.structuredContent) out.push(result.structuredContent);
  for (const c of result?.content || []) if (c.type === 'text') { try { out.push(JSON.parse(c.text)); } catch { out.push({ _text: c.text }); } }
  return out;
}
function findKey(obj, keys, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 8) return undefined;
  for (const k of keys) if (obj[k] != null && typeof obj[k] !== 'object') return obj[k];
  for (const v of Object.values(obj)) { const r = findKey(v, keys, depth + 1); if (r !== undefined) return r; }
  return undefined;
}
function first(result, keys) { for (const p of payloads(result)) { const v = findKey(p, keys); if (v !== undefined) return v; } return undefined; }
function allStrings(obj, acc = [], depth = 0) {
  if (depth > 8 || obj == null) return acc;
  if (typeof obj === 'string') acc.push(obj);
  else if (typeof obj === 'object') for (const v of Object.values(obj)) allStrings(v, acc, depth + 1);
  return acc;
}
async function extractImage(result) {
  for (const c of result?.content || []) {
    if (c.type === 'image' && c.data) return { buffer: Buffer.from(c.data, 'base64'), mime: c.mimeType || 'image/png' };
    if (c.type === 'resource' && c.resource?.blob && /^image\//.test(c.resource.mimeType || 'image/')) return { buffer: Buffer.from(c.resource.blob, 'base64'), mime: c.resource.mimeType || 'image/png' };
  }
  const urls = [];
  for (const c of result?.content || []) {
    if (c.type === 'resource_link' && c.uri) urls.push(c.uri);
    if (c.type === 'resource' && c.resource?.uri) urls.push(c.resource.uri);
  }
  for (const p of payloads(result)) for (const s of allStrings(p)) if (/^https:\/\/\S+\.(png|jpe?g|webp)(\?|$)/i.test(s) || /^https:\/\/[^\s]*(thumbnail|image|download|export)[^\s]*$/i.test(s)) urls.push(s);
  for (const u of urls) {
    if (!/^https:\/\//.test(u)) continue;
    try {
      const r = await fetch(u); const ct = r.headers.get('content-type') || '';
      if (r.ok && ct.startsWith('image/')) return { buffer: Buffer.from(await r.arrayBuffer()), mime: ct, sourceUrl: u };
    } catch {}
  }
  return null;
}

export class Canva {
  constructor(storage, port) {
    this.provider = new StoredOAuthProvider(storage, `http://localhost:${port}/oauth/callback`);
    this.client = null; this.transport = null; this.connected = false; this.error = null; this.connecting = null;
  }
  status() { return { connected: this.connected, needsAuth: !this.connected && !!this.provider.pendingAuthUrl, error: this.error }; }

  async init() { await this.provider.load(); if (this.provider.data.tokens) await this.connect().catch(() => {}); }

  /** Connect with stored tokens; if authorization is needed, returns { authUrl }. */
  connect() {
    if (this.connecting) return this.connecting;
    this.connecting = (async () => {
      this.error = null;
      try { await this.client?.close(); } catch {}
      const transport = new StreamableHTTPClientTransport(new URL(config.canva.url), { authProvider: this.provider });
      const client = new Client({ name: 'wonderpages-local', version: '1.0.0' });
      this.transport = transport;
      try {
        await client.connect(transport);
        this.client = client; this.connected = true; this.provider.pendingAuthUrl = null;
        return { connected: true };
      } catch (e) {
        this.connected = false; this.client = null;
        if (e instanceof UnauthorizedError || this.provider.pendingAuthUrl) return { authUrl: this.provider.pendingAuthUrl };
        this.error = String(e?.message || e);
        throw e;
      }
    })().finally(() => { this.connecting = null; });
    return this.connecting;
  }

  async finishAuth(code, state) {
    const expected = this.provider.data.state; this.provider.data.state = null; await this.provider.persist();   // audit M1: required, used once
    if (!expected || state !== expected) throw new Error('Conectarea nu a fost pornită din aplicație sau a expirat. Reîncearcă din Setări.');
    await this.transport.finishAuth(code);
    return this.connect();
  }
  /* P1-T03: read-only tool discovery (names + input schemas); no generation */
  async listTools() {
    if (!this.client) { const r = await this.connect().catch(() => null); if (!r?.connected) return null; }
    if (typeof this.client.listTools !== 'function') return null;
    const r = await this.client.listTools(); return Array.isArray(r?.tools) ? r.tools.map(t => ({ name: t.name, inputSchema: t.inputSchema || null })) : null;
  }
  async logout() { try { await this.client?.close(); } catch {} this.client = null; this.connected = false; await this.provider.logout(); }

  /* the Canva connection is closed after 10 idle minutes and reopened on the next image */
  idle() { clearTimeout(this.idleT); this.idleT = setTimeout(async () => { try { await this.client?.close(); } catch {} this.client = null; }, 10 * 60e3); this.idleT.unref?.(); }
  async call(name, args) {
    this.idle();
    if (!this.client) { const r = await this.connect().catch(() => null); if (!r?.connected) throw { code: 'canva_not_connected', message: 'Canva nu este conectat. Conectează-l din pagina Setări.' }; }
    try {
      return await this.client.callTool({ name, arguments: args }, undefined, { timeout: 180000 });
    } catch (e) {
      if (e instanceof UnauthorizedError) { this.connected = false; this.client = null; throw { code: 'canva_not_connected', message: 'Sesiunea Canva a expirat. Reconectează din Setări.' }; }
      if (PAUSE_RE.test(String(e?.message || ''))) throw pauseErr(e?.message);
      throw { code: 'canva_error', message: 'Canva: ' + (e?.message || e) };
    }
  }

  /** Upload local bytes to Canva (create-upload-url, then one raw POST); returns the media id. */
  async upload(buffer) {
    const r = await this.call('create-upload-url', { user_intent: "WonderPages.AI: use the client's character sheet as a reference image" });
    const url = first(r, ['upload_url', 'uploadUrl', 'url']) || allStrings(payloads(r)).find(s => /^https:\/\//.test(s));
    if (!url) throw { code: 'canva_failed', message: 'Canva nu a returnat un URL de upload.' };
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: buffer });
    const text = await res.text();
    if (!res.ok) throw { code: 'canva_failed', message: `Upload Canva eșuat (${res.status}).` };
    let body; try { body = JSON.parse(text); } catch { body = { _text: text }; }
    const id = findKey(body, ['mediaId', 'media_id', 'asset_id', 'assetId', 'id']);
    if (!id) throw { code: 'canva_failed', message: 'Canva nu a returnat un media id după upload.' };
    return String(id);
  }

  /**
   * Generate one image. references: [{type:'MEDIA', id}] (character sheets, or the colour page
   * when producing its colouring-book version). Returns { buffer, mime, mediaId, link, raw }.
   */
  async generate({ prompt, aspectRatio = 'SQUARE_1_1', references = [], signal }) {
    const args = { prompt, aspectRatio, user_intent: INTENT };
    if (references.length) args.imageReferences = references;
    const start = await this.call('generate-image', args);
    if (start?.isError) { const m = first(start, ['message', 'error', '_text']) || ''; if (PAUSE_RE.test(m)) throw pauseErr(m); throw { code: 'canva_failed', message: 'Canva a refuzat cererea: ' + m }; }
    const jobId = first(start, ['jobId', 'job_id']);
    if (!jobId) throw { code: 'canva_failed', message: 'Canva nu a returnat un jobId.' };
    for (let i = 0; i < 120; i++) {
      if (signal?.aborted) throw { code: 'stopped' };
      await sleep(i < 2 ? Math.min(4000, POLL_MS) : POLL_MS);
      const job = await this.call('get-generate-image-job', { jobId, user_intent: INTENT });
      const status = String(first(job, ['status']) || '').toUpperCase();
      if (status.includes('FAIL')) { const m = first(job, ['failureMessage']) || first(job, ['failureType']) || ''; if (PAUSE_RE.test(m)) throw pauseErr(m); throw { code: 'canva_failed', message: `Canva: ${m || 'generarea a eșuat'}` }; }
      if (status.includes('SUCCESS')) {
        const img = await extractImage(job);
        if (!img) continue; /* image link not ready yet: keep polling the same job */
        const link = allStrings(payloads(job)).find(s => /^https:\/\/(www\.)?canva\.com\//.test(s)) || null;
        return { ...img, mediaId: first(job, ['media_id', 'mediaId']) || null, link, raw: job };
      }
    }
    throw { code: 'canva_failed', message: 'Canva nu a terminat imaginea în 10 minute.' };
  }

  /* ---------- v19 (plan 2.7–2.10): brand kits, brand templates + autofill, resize, comments; all included in Canva Pro ---------- */
  static list(result, idKeys, nameKeys) {
    const out = []; const seen = new Set();
    const walk = (o, d = 0) => { if (!o || typeof o !== 'object' || d > 6) return; if (Array.isArray(o)) { o.forEach(x => walk(x, d + 1)); return; }
      const id = idKeys.map(k => o[k]).find(v => typeof v === 'string'); const name = nameKeys.map(k => o[k]).find(v => typeof v === 'string');
      if (id && !seen.has(id)) { seen.add(id); out.push({ id, name: name || id, thumbnail: o.thumbnail?.url || o.thumbnail_url || null }); }
      for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v, d + 1); };
    for (const p of payloads(result)) walk(p);
    return out;
  }
  async brandKits() { const r = await this.call('list-brand-kits', { user_intent: 'WonderPages.AI: choose the brand kit of a children\'s book series' }); if (r?.isError) throw { code: 'canva_failed', message: 'Canva: ' + (first(r, ['message', '_text']) || 'kiturile de brand nu sunt disponibile (necesită Canva Pro)') }; return Canva.list(r, ['brand_kit_id', 'brandKitId'], ['name', 'title']); }
  async brandTemplates(brandKitId = null) {
    const a = { dataset: 'non_empty', user_intent: 'WonderPages.AI: find a book cover brand template with data fields to autofill' }; if (brandKitId) a.brand_kit_id = brandKitId;
    const r = await this.call('search-brand-templates', a); if (r?.isError) throw { code: 'canva_failed', message: 'Canva: ' + (first(r, ['message', '_text']) || 'șabloanele de brand nu sunt disponibile (necesită Canva Pro)') };
    return Canva.list(r, ['brand_template_id', 'brandTemplateId'], ['title', 'name']);
  }
  /* the data fields of a template: { name: 'text' | 'image' | ... } */
  async templateFields(templateId) {
    const r = await this.call('get-brand-template-dataset', { template_id: templateId, user_intent: 'WonderPages.AI: read the fields of the cover template' });
    const fields = {}; const walk = (o, d = 0) => { if (!o || typeof o !== 'object' || d > 6) return;
      for (const [k, v] of Object.entries(o)) { if (v && typeof v === 'object' && typeof v.type === 'string' && ['text', 'image', 'chart', 'video'].includes(v.type)) fields[k] = v.type; else if (v && typeof v === 'object') walk(v, d + 1); } };
    for (const p of payloads(r)) walk(p);
    return fields;
  }
  async autofill(templateId, data, title) {
    const r = await this.call('autofill-design', { brand_template_id: templateId, data, title: String(title || 'WonderPages').slice(0, 250), user_intent: 'WonderPages.AI: fill the cover template with the approved volume' });
    if (r?.isError) throw { code: 'canva_failed', message: 'Canva: ' + (first(r, ['message', '_text']) || 'completarea șablonului a eșuat') };
    const id = first(r, ['design_id', 'designId']); if (!id) throw { code: 'canva_failed', message: 'Canva nu a returnat designul completat.' };
    const link = allStrings(payloads(r)).find(x => /^https:\/\/(www\.)?canva\.com\/design\//.test(x)) || null;
    return { designId: String(id), link };
  }
  async exportDesign(designId, format = { type: 'pdf', export_quality: 'pro' }) {
    const r = await this.call('export-design', { design_id: designId, format, user_intent: 'WonderPages.AI: download the finished cover' });
    if (r?.isError) throw { code: 'canva_failed', message: 'Canva: ' + (first(r, ['message', '_text']) || 'exportul a eșuat') };
    const urls = allStrings(payloads(r)).filter(x => /^https:\/\//.test(x) || (process.env.WP_FAKE_STATE && /^http:\/\/127\.0\.0\.1:/.test(x)));
    for (const u of urls) { try { const res = await fetch(u); if (res.ok) return { buffer: Buffer.from(await res.arrayBuffer()), mime: res.headers.get('content-type') || '' }; } catch {} }
    throw { code: 'canva_failed', message: 'Canva nu a dat un link de descărcare pentru export.' };
  }
  async resize(designId, width, height) {
    const r = await this.call('resize-design', { design_id: designId, design_type: { type: 'custom', width, height }, user_intent: 'WonderPages.AI: promotional version of the approved cover' });
    if (r?.isError) throw { code: 'canva_failed', message: 'Canva: ' + (first(r, ['message', '_text']) || 'redimensionarea a eșuat') };
    const id = first(r, ['design_id', 'designId']); if (!id) throw { code: 'canva_failed', message: 'Canva nu a returnat designul redimensionat.' }; return String(id);
  }
  async comment(designId, text) { return this.call('comment-on-design', { design_id: designId, message_plaintext: String(text).slice(0, 1000), user_intent: 'WonderPages.AI: leave the automatic checks as a note on the cover' }); }
  /* open comments: resolution is read only when Canva reports it; otherwise they are listed as information */
  async comments(designId) {
    const r = await this.call('list-comments', { design_id: designId, user_intent: 'WonderPages.AI: check for unresolved notes before export' });
    const out = []; const walk = (o, d = 0) => { if (!o || typeof o !== 'object' || d > 6) return; if (Array.isArray(o)) { o.forEach(x => walk(x, d + 1)); return; }
      const text = o.message_plaintext || o.message?.plaintext || (typeof o.message === 'string' ? o.message : null) || o.text || null;
      if (text && (o.id || o.comment_id || o.thread_id)) out.push({ id: o.id || o.comment_id || o.thread_id, text: String(text), resolved: typeof o.resolved === 'boolean' ? o.resolved : o.status ? /resolved/i.test(String(o.status)) : null });
      else for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v, d + 1); };
    for (const p of payloads(r)) walk(p);
    return out;
  }
}
