/**
 * Al doilea motor de imagini: GPT Image din abonamentul tău ChatGPT (Plus), prin Codex CLI oficial de la OpenAI.
 * Codex are un instrument de generare de imagini inclus, care folosește autentificarea ChatGPT (fără cheie API,
 * fără cost pe imagine). Aplicația pornește `codex exec` fără fereastră, cere o singură imagine și o preia
 * din folderul unde Codex salvează imaginile generate (~/.codex/generated_images).
 * Siguranță: OPENAI_API_KEY nu ajunge niciodată la Codex, ca să nu se poată trece pe facturare API.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkIncludedQuota } from './subscription-usage.js';

const WIN = process.platform === 'win32';
const CLI=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','node_modules','@openai','codex','bin','codex.js');
const qa = a => (/[\s"&|<>^()%!]/.test(a) ? `"${String(a).replace(/"/g, '\\"')}"` : a);   // Windows shell: every argument quoted
const HOME = () => process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const ACTIVE = new Set();
export function killAllCodex() { for (const c of ACTIVE) { try { c.kill(); } catch {} } ACTIVE.clear(); }
const env = () => { const e = { ...process.env }; for(const k of ['OPENAI_API_KEY','CODEX_API_KEY','AZURE_OPENAI_API_KEY','OPENAI_BASE_URL'])delete e[k]; return e; };
function run(args, { input = null, timeoutMs = 30000, signal } = {}) {
  return new Promise((resolve, reject) => {
    let out = '', err = '', done = false;
    const child = spawn(process.execPath, [CLI,...args], { shell: false, env: env(), cwd: os.tmpdir(),windowsHide:true }); ACTIVE.add(child);
    const t = setTimeout(() => { try { child.kill(); } catch {} }, timeoutMs);
    const onAbort = () => { try { child.kill(); } catch {} reject({ code: 'stopped' }); };
    signal?.addEventListener('abort', onAbort, { once: true });
    child.stdout.on('data', d => { out += d; }); child.stderr.on('data', d => { err += d; });
    child.on('error', e => { if (!done) { done = true; clearTimeout(t); ACTIVE.delete(child); reject({ code: 'codex_missing', message: 'Codex CLI nu e instalat (npm install -g @openai/codex).' }); } });
    child.on('close', code => { if (done) return; done = true; clearTimeout(t); ACTIVE.delete(child); signal?.removeEventListener('abort', onAbort); resolve({ code, out, err }); });
    if (input != null) child.stdin.end(input); else child.stdin.end();
  });
}
let state = { installed: false, version: '', auth: null, checkedAt: 0, lastError: '', generationVerified:null };
export async function checkCodex() {
  try {
    const v = await run(['--version'], { timeoutMs: 15000 });
    state.installed = v.code === 0; state.version = (v.out || v.err).trim().split('\n')[0];
    if (state.installed) { const s = await run(['login', 'status'], { timeoutMs: 15000 }); const t = (s.out + s.err); state.auth = /chatgpt/i.test(t) && !/not logged|no credentials|api key/i.test(t) ? true : /logged in/i.test(t) && /api key/i.test(t) ? 'apikey' : false; }
  } catch (e) { state.installed = false; state.auth = null; }
  state.checkedAt = Date.now(); return codexStatus();
}
export const codexStatus = () => ({ ...state, ready: state.installed && state.auth === true });
export function openCodexLogin() {
  // BUG fixed: without shell:true Node quoted "codex login" as one program name ("Windows cannot find 'login\'")
  if (WIN) spawn('cmd', ['/c', 'start', '"ChatGPT - autentificare"', 'cmd', '/k', 'codex', 'login'], { shell: true, detached: true, stdio: 'ignore', env: env() }).unref();
  else if (process.platform === 'darwin') spawn('osascript', ['-e', 'tell application "Terminal" to do script "codex login"'], { detached: true, stdio: 'ignore' }).unref();
  else spawn('x-terminal-emulator', ['-e', 'codex login'], { detached: true, stdio: 'ignore', env: env() }).unref();
}
/* audit M5: which image belongs to THIS generation? Every file that existed before is listed first, generations run
   one at a time (a queue), and only a file that did not exist before and appeared after the start is taken */
async function listImages() {
  const root = path.join(HOME(), 'generated_images'); const out = new Map();
  const walk = async (d, depth) => { for (const e of await fsp.readdir(d, { withFileTypes: true }).catch(() => [])) { const f = path.join(d, e.name); if (e.isDirectory() && depth < 3) await walk(f, depth + 1); else if (/\.(png|jpe?g|webp)$/i.test(e.name)) { const st = await fsp.stat(f).catch(() => null); if (st) out.set(f, st.mtimeMs); } } };
  await walk(root, 0); return out;
}
async function newImage(before, since) {
  let best = null; for (const [f, t] of await listImages()) if (!before.has(f) && t >= since && (!best || t > best.t)) best = { f, t };
  return best?.f || null;
}
let queue = Promise.resolve();
const SIZE = { PORTRAIT_4_5: '1024x1280', PORTRAIT_2_3: '1024x1536', SQUARE_1_1: '1024x1024', LANDSCAPE_3_2: '1536x1024' };
const LIMIT_RE = /(rate limit|usage limit|limit reached|too many|try again (later|in)|quota|reached your|out of (image|usage))/i;
/* one image; files = absolute paths of reference images (character sheets, or the colour page to convert) */
export function generate(opts) { const turn = queue.then(() => generateOne(opts)); queue = turn.catch(() => {}); return turn; }
async function generateOne({ prompt, aspectRatio, files = [], signal, timeoutMs = 10 * 60e3 }) {
  if (signal?.aborted) throw { code: 'stopped' };
  const login=await run(['login','status'],{timeoutMs:15000,signal});const auth=login.out+' '+login.err;
  if(login.code!==0 || !/logged in.*chatgpt|chatgpt.*logged in/i.test(auth) || /api key/i.test(auth)) throw {code:'auth',message:'Imaginile necesită autentificare ChatGPT Plus; cheile API sunt refuzate.'};
  state.quota=await checkIncludedQuota({cli:CLI,env:env(),signal});
  const before = await listImages(); const since = Date.now() - 1500;
  const instr = `Use your built-in image generation tool to create exactly ONE image. Do not write code, do not run scripts, do not call any API, do not ask questions.${files.length ? ` The ${files.length} attached image(s) are references: follow them exactly for character identity, proportions, colours and markings${files.length === 1 && /colouring-book/i.test(prompt) ? ', and convert the attached picture as instructed' : ''}.` : ''}\nImage size: ${SIZE[aspectRatio] || '1024x1280'}, portrait unless stated otherwise.\n\nPROMPT:\n${prompt}\n\nWhen the image has been generated, reply with the single word DONE.`;
  const args = ['exec', '--skip-git-repo-check', '--sandbox', 'read-only','--ignore-user-config','--ignore-rules','--ephemeral','--enable','image_generation','--model','gpt-6-sol','-c','model_reasoning_effort=medium', ...files.flatMap(f => ['-i', f])];
  const r = await run(args, { input: instr, timeoutMs, signal });
  const f = await newImage(before, since);
  if (f) { const buffer = await fsp.readFile(f); state.lastError = '';state.generationVerified=true;state.verifiedAt=Date.now(); return { buffer, mime: /\.jpe?g$/i.test(f) ? 'image/jpeg' : /\.webp$/i.test(f) ? 'image/webp' : 'image/png', mediaId: null, link: null, file: f }; }
  const text = (r.out + '\n' + r.err).slice(-1500); state.lastError = text.slice(-300);state.generationVerified=false;state.verifiedAt=Date.now();
  if (LIMIT_RE.test(text)) throw { code: 'image_pause', message: 'ChatGPT cere o pauză pentru imagini.' };
  if (/(not logged in|login|unauthori[sz]ed|401|expired)/i.test(text)) throw { code: 'auth', message: 'Codex nu e autentificat cu ChatGPT: Setări > Motor de imagini > Autentifică ChatGPT.' };
  throw { code: 'image_failed', message: 'ChatGPT nu a generat imaginea (Codex nu a expus instrumentul de imagini sau a refuzat).' };
}
