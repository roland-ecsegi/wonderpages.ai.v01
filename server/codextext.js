/** Text through Codex CLI, authenticated with the user's ChatGPT subscription. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkIncludedQuota } from './subscription-usage.js';

const WIN = process.platform === 'win32';
const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
const quote = a => WIN && /[\s"&|<>^()%!]/.test(String(a)) ? `"${String(a).replace(/"/g, '\\"')}"` : String(a);
const cleanEnv = () => {
  const e = { ...process.env };
  for (const k of ['OPENAI_API_KEY', 'CODEX_API_KEY', 'AZURE_OPENAI_API_KEY', 'OPENAI_BASE_URL']) delete e[k];
  return e;
};
const LIMIT = /(usage limit|rate limit|limit reached|quota|too many requests|try again later)/i;
const AUTH = /(not logged in|login required|unauthorized|unauthorised|authentication failed|401)/i;
const SCHEMA = /(output.schema|output schema|json.schema|json schema|schema.*(invalid|unsupported|failed))/i;

function command(args, { input = '', cwd, signal, timeoutMs = 12 * 60e3, onEvent } = {}) {
  return new Promise((resolve, reject) => {
    let child, settled = false, out = '', err = '', lineBuf = '', timedOut = false;
    const finish = (e, result) => { if (settled) return; settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort); e ? reject(e) : resolve(result); };
    const abort = () => { try { child?.kill(); } catch {} finish({ code: 'stopped', message: 'Oprit.' }); };
    if (signal?.aborted) return reject({ code: 'stopped', message: 'Oprit.' });
    try { child = spawn(process.execPath, [CLI, ...args], { shell: false, cwd, env: cleanEnv(), stdio: ['pipe', 'pipe', 'pipe'], windowsHide:true }); }
    catch { return reject({ code: 'codex_missing', message: 'Codex CLI nu este instalat.' }); }
    const timer = setTimeout(() => { timedOut = true; try { child.kill(); } catch {} }, timeoutMs);
    signal?.addEventListener('abort', abort, { once: true });
    child.on('error', () => finish({ code: 'codex_missing', message: 'Codex CLI nu este instalat sau nu poate porni.' }));
    child.stdout.on('data', d => {
      const s = d.toString(); out += s; lineBuf += s;
      let n; while ((n = lineBuf.indexOf('\n')) >= 0) {
        const line = lineBuf.slice(0, n).trim(); lineBuf = lineBuf.slice(n + 1);
        if (line) { try { onEvent?.(JSON.parse(line)); } catch {} }
      }
    });
    child.stderr.on('data', d => { err += d.toString(); });
    child.on('close', code => finish(null, { code, out, err, timedOut }));
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

let textStatus = { installed:false, auth:null, ready:false, version:'', at:0 };
export const codexTextStatus = () => ({...textStatus});
export async function checkCodexText() {
  const version=await command(['--version'],{timeoutMs:15000});
  if(version.code!==0) return textStatus={installed:false,auth:null,ready:false,version:'',at:Date.now()};
  const login=await command(['login','status'],{timeoutMs:15000}); const output=login.out+' '+login.err;
  const auth=/api key/i.test(output)?'apikey':login.code===0&&/logged in.*chatgpt|chatgpt.*logged in/i.test(output);
  return textStatus={installed:true,auth,ready:auth===true,version:version.out.trim(),at:Date.now()};
}
export async function runCodexText(prompt, { model = 'gpt-6-sol', reasoning = 'medium', system = '', images = [], schema = null, signal, onText, onMeta } = {}) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wonderpages-codex-text-'));
  try {
    // A saved API-key login must never silently switch this feature to metered API billing.
    const login = await command(['login', 'status'], { cwd: dir, timeoutMs: 15000, signal });
    const status = login.out + '\n' + login.err;
    if (login.code !== 0 || !/logged in.*chatgpt|chatgpt.*logged in/i.test(status) || /api key/i.test(status))
      throw { code: 'codex_auth', message: 'Codex CLI trebuie autentificat cu contul ChatGPT din Setări > Motor de imagini.' };

    textStatus.quota=await checkIncludedQuota({cli:CLI,env:cleanEnv(),signal});
    const output = path.join(dir, 'reply.txt');
    const picturePaths = [];
    for (const [i, im] of images.entries()) {
      const ext = /jpe?g/.test(im.mime || '') ? 'jpg' : /webp/.test(im.mime || '') ? 'webp' : 'png';
      const f = path.join(dir, `reference-${i}.${ext}`);
      await fs.writeFile(f, Buffer.from(im.data, 'base64')); picturePaths.push(f);
    }
    const input = `You are one agent in a children's-book production workflow. Do not use tools, run commands or modify files. Reply only with the requested ${schema ? 'JSON' : 'content'}.\n\nAGENT CHARTER AND LEARNED RULES:\n${system || '(none)'}\n\nTASK:\n${prompt}`;
    let usage = null, text = '', usedSchema = false;
    const run = async withSchema => {
      const args = ['exec', '--skip-git-repo-check', '--sandbox', 'read-only', '--ignore-user-config', '--ignore-rules', '--ephemeral',
        '--model', model, '-c', `model_reasoning_effort=${reasoning}`, '--json', '--output-last-message', output,
        ...picturePaths.flatMap(f => ['-i', f])];
      if (withSchema) { const f = path.join(dir, 'output.schema.json'); await fs.writeFile(f, JSON.stringify(schema)); args.push('--output-schema', f); }
      args.push('-');
      const r = await command(args, { input, cwd: dir, signal, onEvent: ev => {
        if (ev.type === 'turn.completed') usage = ev.usage || null;
        if (ev.type === 'item.completed' && ev.item?.type === 'agent_message') { text = ev.item.text || text; onText?.(text); }
      } });
      if (r.timedOut) throw { code: 'codex_timeout', message: 'Codex nu a răspuns în timpul permis.' };
      if (r.code !== 0) {
        const tail = (r.err + '\n' + r.out).slice(-1800);
        if (LIMIT.test(tail)) throw { code: 'rate_limited', provider: 'codex', resetAt: Date.now() + 60 * 60e3, message: 'Limita Codex din abonamentul ChatGPT a fost atinsă.' };
        if (AUTH.test(tail)) throw { code: 'codex_auth', message: 'Codex CLI nu mai este autentificat cu ChatGPT.' };
        if (withSchema && SCHEMA.test(tail)) return false;
        throw { code: 'codex_error', message: `Codex CLI nu a finalizat sarcina (${r.code}). ${tail.slice(-350)}` };
      }
      usedSchema = withSchema;
      return true;
    };
    if (!(await run(!!schema))) await run(false);
    const final = (await fs.readFile(output, 'utf8').catch(() => text)).trim();
    if (!final) throw { code: 'empty_completion', message: 'Codex nu a produs niciun răspuns.' };
    onText?.(final);
    onMeta?.({ usage, bytesIn: Buffer.byteLength(input), bytesOut: Buffer.byteLength(final), schema: usedSchema ? 'codex-cli' : schema ? 'local' : null, system: 'message', provider: 'codex' });
    return final;
  } finally { await fs.rm(dir, { recursive: true, force: true }).catch(() => {}); }
}
