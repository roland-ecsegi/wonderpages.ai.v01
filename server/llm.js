/**
 * Text generation through Claude Code (Claude Pro) or Codex CLI (ChatGPT plan).
 * Neither path uses a paid API key; credentials are stripped from child processes.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { config } from './config.js';
import { runClaudeCode, checkClaudeCode, checkClaudeAuth, schemaFailed, probeFlags } from './claudecode.js';
import { runCodexText } from './codextext.js';
import { beforeCall, afterCall } from './governor.js';
export { openLoginWindow } from './claudecode.js';

let cc = { ok: false, version: '' };
let auth = { ok: null, message: '', at: 0 };
export function setAuthState(ok, message = '') { auth = { ok, message, at: Date.now() }; }
export async function initLLM() { cc = await checkClaudeCode(); if (cc.ok) { await probeFlags(); const a=await checkClaudeAuth();setAuthState(a.ok,a.message); } return cc; }
export function llmInfo() { return { configured: cc.ok, provider: 'claude-code', model: config.claudeCode.model, lightModel: config.claudeCode.lightModel, version: cc.version || '', auth, apiKeyIgnored: !!process.env.ANTHROPIC_API_KEY }; }
export function llmConfigured() { return cc.ok; }
export async function verifyClaude() {
  try { await runClaudeCode('Reply with the single word OK.', { model: config.claudeCode.lightModel, timeoutMs: 120000 }); setAuthState(true); }
  catch (e) { setAuthState(e?.code === 'auth' ? false : null, e?.message || ''); }
  cc = await checkClaudeCode(); return llmInfo();
}

/* reads the whole reply as JSON, else a fenced block, else first {..last } */
export function parseJSONLoose(text) {
  const t = String(text || '').trim();
  try { return JSON.parse(t); } catch {}
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) { try { return JSON.parse(fence[1]); } catch {} }
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch {} }
  throw { code: 'invalid_json', message: 'Răspunsul nu conține JSON valid.', text: t.slice(0, 2000) };
}

/** One Claude call. model: 'sonnet' (quality) or 'haiku' (light tasks, uses less of the Pro allowance). */
export async function complete(prompt, { json = true, onText, signal, images = [], model, skipBudget = false, system = '', schema = null, onMeta } = {}) {
  if (model === 'gpt-6-sol') {
    const text = await runCodexText(prompt, { model, reasoning: 'medium', system, images, schema: json ? schema : null, signal, onText, onMeta });
    return json ? parseJSONLoose(text) : text;
  }
  if (!skipBudget) await beforeCall(signal);                 // the assistant is exempt: helping you should not wait for the production budget; Pro budget: wait politely instead of hitting the hard limit
  const login=await checkClaudeAuth();
  if(login.ok===false) {setAuthState(false,login.message);throw {code:'auth',message:login.message||'Este necesar contul Claude Pro.'};}
  let dir = null;
  try {
    let files = [];
    if (images.length) {
      dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wonderpages-img-'));
      files = await Promise.all(images.map(async (im, i) => { const f = path.join(dir, `ref-${i}.${/jpe?g/.test(im.mime) ? 'jpg' : im.mime.split('/')[1]}`); await fs.writeFile(f, Buffer.from(im.data, 'base64')); return f; }));
      prompt = `First use the Read tool to look at these ${files.length} image file(s), in this order (index 0 first):\n${files.join('\n')}\n\n` + prompt;
    }
    let text;
    const run = sch => runClaudeCode(prompt, { model: model || config.claudeCode.model, files, onText, signal, system, schema: json && !files.length ? sch : null, onMeta });
    try { text = await run(schema); setAuthState(true); }
    catch (e) {
      if (e?.code === 'auth') setAuthState(false, e.message);
      if (e?.schemaUsed) {                                   // v19: a structured-output failure never costs the step; retry the same call without the schema
        schemaFailed();
        try { text = await run(null); setAuthState(true); } catch (e2) { afterCall(e2); throw e2; }
      } else { afterCall(e); throw e; }
    }
    afterCall(null);
    return json ? parseJSONLoose(text) : text;
  } finally { if (dir) fs.rm(dir, { recursive: true, force: true }).catch(() => {}); }   // audit: temp images were never cleaned
}
