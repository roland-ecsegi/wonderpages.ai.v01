/**
 * Text prin Claude Code (inclus în abonamentele Pro/Max), în loc de cheie API.
 * Rulează `claude -p` în mod headless; promptul intră pe stdin, răspunsul vine ca stream-json.
 */
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const WIN = process.platform === 'win32';
const ACTIVE = new Set();                          // every Claude process still running; closed on shutdown
export function limitReset(text, current=Date.now()) {
  const epoch=String(text).match(/\|(\d{10})\b/); if(epoch)return Number(epoch[1])*1000;
  const m=String(text).match(/resets\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s*(\d{1,2})(?::(\d\d))?\s*(am|pm)?\s*\(([^)]+)\)/i);if(!m)return null;
  const month=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m[1].toLowerCase());let h=Number(m[3]);if(m[5])h=h%12+(/pm/i.test(m[5])?12:0);
  const year=new Date(current).getFullYear(), local=Date.UTC(year,month,Number(m[2]),h,Number(m[4]||0));let t=local;
  try{for(let i=0;i<2;i++){const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:m[6],year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(t).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));const rendered=Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute),Number(p.second));t+=local-rendered;}return t>current?t:null;}catch{return null;}
}
export function killAll() { for (const c of ACTIVE) { try { c.kill(); } catch {} } ACTIVE.clear(); }
const SYSTEM = "You are one agent in an automated, premium children's book production pipeline. Do not use any tools unless explicitly asked. Follow the requested output format exactly; when JSON is requested, reply with the JSON only.";
const WORKDIR = path.join(os.tmpdir(), 'wonderpages-claude');
fs.mkdirSync(WORKDIR, { recursive: true });

/* the subscription must be used, never an API key that happens to be in the environment */
function childEnv() { const env = { ...process.env }; for (const k of ['ANTHROPIC_API_KEY','ANTHROPIC_AUTH_TOKEN','ANTHROPIC_BASE_URL','CLAUDE_CODE_USE_BEDROCK','CLAUDE_CODE_USE_VERTEX','CLAUDE_CODE_USE_FOUNDRY']) delete env[k]; return env; }
export function checkClaudeAuth() {
  return new Promise(resolve => {
    const p=spawn('claude',['auth','status'],{shell:WIN,env:childEnv(),windowsHide:true});let out='';
    const timer=setTimeout(()=>{p.kill();resolve({ok:null,message:'Verificarea autentificării a expirat.'});},15000);
    p.stdout.on('data',d=>out+=d);p.stderr.on('data',()=>{});
    p.on('error',()=>{clearTimeout(timer);resolve({ok:null,message:'Autentificarea nu a putut fi verificată.'});});
    p.on('close',()=>{clearTimeout(timer);try{const a=JSON.parse(out);resolve({ok:a.loggedIn===true&&a.authMethod==='claude.ai'&&a.subscriptionType==='pro',method:a.authMethod||'unknown',subscription:a.subscriptionType||'unknown',message:a.authMethod==='claude.ai'?'':'Autentifică-te prin abonamentul Claude Pro.'});}catch{resolve({ok:null,message:'Versiunea CLI nu oferă un status verificabil.'});}});
  });
}
const q = a => (WIN && /[\s"&|<>^()%!]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);   // Windows shell: arguments are quoted (Node DEP0190)

/* opens Anthropic's own Claude Code login in a separate terminal window (credentials never pass through this app) */
export function openLoginWindow() {
  const env = childEnv();
  if (WIN) spawn('cmd', ['/c', 'start', '"Claude - autentificare"', 'cmd', '/k', 'claude'], { shell: true, env, detached: true });
  else if (process.platform === 'darwin') spawn('osascript', ['-e', 'tell application "Terminal" to do script "claude"'], { env, detached: true });
  else spawn('x-terminal-emulator', ['-e', 'claude'], { env, detached: true }).on('error', () => {});
}

/* token control: Claude Code's default system prompt, tool list and any MCP servers you configured for yourself
   are large and are sent on every call. When the installed version supports it, the app replaces them with a short
   system prompt, only the tool a call needs (Read for images, none for text) and no MCP servers. */
const FLAGS = { systemPrompt: false, systemPromptFile: false, tools: false, strictMcp: false, jsonSchema: false, noSession: false };
/* v19 (plan 1.3): structured output through --json-schema when this Claude Code version has it. If a call with a schema fails,
   the same call is retried without it and schemas are switched off until the next start (at most one extra call). */
let schemaFailures = 0;
export const schemaActive = () => FLAGS.jsonSchema && schemaFailures < 1;
export function schemaFailed() { schemaFailures++; }
export function probeFlags() {
  return new Promise(res => {
    const p = spawn('claude', ['--help'], { shell: WIN, env: childEnv() }); let out = '';
    const t = setTimeout(() => { try { p.kill(); } catch {} res(FLAGS); }, 8000);   // never let start-up wait on this
    p.stdout.on('data', d => { out += d; }); p.stderr.on('data', d => { out += d; });
    p.on('error', () => res(FLAGS));
    p.on('close', () => { clearTimeout(t); const o = out.replace(/--append-system-prompt(-file)?/g, ''); FLAGS.systemPrompt = /--system-prompt\b(?!-)/.test(o); FLAGS.systemPromptFile = /--system-prompt-file\b/.test(o); FLAGS.tools = /\s--tools\b/.test(out); FLAGS.strictMcp = /--strict-mcp-config/.test(out); FLAGS.jsonSchema = /--json-schema\b/.test(out); FLAGS.noSession = /--no-session-persistence\b/.test(out); res(FLAGS); });
  });
}
export const claudeFlags = () => ({ ...FLAGS });
/* v19 (plan 1.2): the agent's charter and lessons travel as the real system prompt, through a file (no shell quoting, no length
   limit on Windows). Same text = same file, so identical prefixes stay identical from one call to the next (plan 1.4). */
function systemFile(text) {
  const f = path.join(WORKDIR, `system-${crypto.createHash('sha1').update(text).digest('hex').slice(0, 16)}.txt`);
  if (!fs.existsSync(f)) fs.writeFileSync(f, text);
  return f;
}
const LEAN_SYSTEM = 'You are a precise worker inside a local children\'s-book publishing app. Follow the instructions in the user message exactly and reply only in the requested format.';
export function checkClaudeCode() {
  return new Promise(res => {
    const p = spawn('claude', ['--version'], { shell: WIN, env: childEnv() });
    let out = ''; p.stdout.on('data', d => { out += d; });
    p.on('error', () => res({ ok: false }));
    p.on('close', code => res({ ok: code === 0, version: out.trim() }));
  });
}

/** Returns the final text. files: absolute paths Claude may read (images of the client's characters). */
/* agent: { cwd, tools, maxTurns, edit } lets Claude Code work inside one folder (the improvement workshop):
   read-only analysis (Read/Glob/Grep) or editing a separate working copy (Edit/Write), never anything else */
/* system: the agent's charter (+ lessons); schema: JSON Schema for the reply (used only when supported); onMeta: usage for the ledger */
export function runClaudeCode(prompt, { model = 'sonnet', files = [], onText, signal, timeoutMs = 12 * 60e3, agent = null, system = '', schema = null, onMeta } = {}) {
  return new Promise((resolve, reject) => {
    let timedOut = false; const t0 = Date.now();
    const useSchema = !agent && !!schema && schemaActive();
    const turns = agent ? String(agent.maxTurns || 30) : files.length ? '6' : useSchema ? '3' : '1';   // structured output needs its own closing turn
    const args = ['-p', '--output-format', 'stream-json', '--verbose', '--model', model, '--max-turns', turns];
    let stdinText = (agent ? '' : SYSTEM + '\n\n') + (system && !agent ? system + '\n\n' : '') + prompt;
    let sysMode = 'message';
    if (agent) {
      args.push('--allowedTools', agent.tools.join(','));
      if (agent.edit) args.push('--permission-mode', 'acceptEdits');
      if (FLAGS.tools) args.push('--tools', agent.tools.join(','));
      if (FLAGS.strictMcp) args.push('--strict-mcp-config');
    } else {
      if (files.length) { args.push('--allowedTools', 'Read'); for (const d of new Set(files.map(f => path.dirname(f)))) args.push('--add-dir', q(d)); }
      if (FLAGS.systemPromptFile) { args.push('--system-prompt-file', q(systemFile(SYSTEM + (useSchema ? ' When a structured-output tool is available, deliver the final JSON through it.' : '') + (system ? '\n\n' + system : '')))); stdinText = prompt; sysMode = 'system'; }
      else if (FLAGS.systemPrompt) args.push('--system-prompt', q(LEAN_SYSTEM));
      if (useSchema) args.push('--json-schema', q(JSON.stringify(schema)));
      if (FLAGS.noSession) args.push('--no-session-persistence');
      if (FLAGS.tools) args.push('--tools', files.length ? 'Read' : (WIN ? '""' : ''));   // empty = no tools for text-only calls
      if (FLAGS.strictMcp) args.push('--strict-mcp-config');
    }
    const child = spawn('claude', WIN ? args.map(a => (a === '""' || /^"/.test(a) ? a : q(a))) : args, { cwd: agent?.cwd || WORKDIR, shell: WIN, env: childEnv() });
    ACTIVE.add(child); child.on('exit', () => ACTIVE.delete(child));
    let buf = '', text = '', result = null, errText = '';
    const onAbort = () => { try { child.kill(); } catch {} reject({ code: 'stopped' }); };
    signal?.addEventListener('abort', onAbort, { once: true });
    child.on('error', e => reject({ code: 'no_claude_code', message: 'Claude Code nu este instalat sau nu e în PATH. Rulează instalatorul (instaleaza) din folderul aplicației.' }));
    child.stderr.on('data', d => { errText += d; });
    const timer = setTimeout(() => { timedOut = true; try { child.kill(); } catch {} }, timeoutMs);   // audit: a hung process used to block the project forever
    child.stdout.on('data', d => {
      buf += d; let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.type === 'assistant') {
          const t = (ev.message?.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
          if (t) { text += (text ? '\n' : '') + t; onText?.(text); }
        } else if (ev.type === 'result') result = ev;
      }
    });
    child.on('close', code => {
      clearTimeout(timer); signal?.removeEventListener('abort', onAbort);
      if (signal?.aborted) return;
      if (timedOut) return reject({ code: 'upstream_error', message: `Claude nu a răspuns în ${Math.round(timeoutMs / 60e3)} minute; pasul se reia.` });
      const all = String(result?.result ?? text ?? '');
      if (/usage limit|weekly limit|daily limit|hit your.*limit|limit reached|rate limit|out of (extra )?usage|extra usage.*credits/i.test(all + errText)) {
        const reset = limitReset(all + errText);
        return reject({ code: 'rate_limited', resetAt: reset && reset > Date.now() ? reset : null, message: 'Ai atins limita abonamentului Claude. Generarea se reia singură după resetare.' });
      }
      if (/log ?in|authenticat|\/login|api key/i.test(errText) && !all) return reject({ code: 'auth', message: 'Claude Code nu este autentificat. Deschide un terminal, rulează „claude” și autentifică-te cu contul tău Pro.' });
      if (!result || result.is_error || code !== 0) return reject({ code: 'upstream_error', schemaUsed: useSchema, message: 'Claude Code: ' + ((result?.errors || []).join(' ') || all.trim() || errText.trim() || result?.subtype || `cod ${code}`).slice(0, 700) });
      const structured = useSchema && result?.structured_output != null ? JSON.stringify(result.structured_output) : null;
      const outText = structured ?? all;
      if (!outText.trim()) return reject({ code: 'empty_completion', message: 'Modelul nu a produs niciun răspuns.' });
      try { onMeta?.({ ms: Date.now() - t0, bytesIn: Buffer.byteLength(stdinText), bytesOut: Buffer.byteLength(outText), usage: result?.usage || null, schema: useSchema ? (structured ? 'cli' : 'cli-text') : null, system: sysMode, turns: result?.num_turns ?? null }); } catch {}
      resolve(outText);
    });
    child.stdin.end(stdinText);
  });
}
