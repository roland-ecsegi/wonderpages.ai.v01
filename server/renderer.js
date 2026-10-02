/**
 * Livrarea se face pe laptop, oricare ar fi dispozitivul de pe care apeși „Livrează”:
 * serverul pornește browserul instalat (Edge sau Chrome) fără fereastră, care creează PDF-urile
 * și le salvează local; telefonul doar urmărește progresul.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const JOBS = new Map();
export function findBrowser() {
  const env = process.env.BROWSER_PATH; if (env && fs.existsSync(env)) return env;
  const pf = process.env.ProgramFiles || 'C:\\Program Files', pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', la = process.env.LOCALAPPDATA || '';
  const list = process.platform === 'win32'
    ? [`${pf86}\\Microsoft\\Edge\\Application\\msedge.exe`, `${pf}\\Microsoft\\Edge\\Application\\msedge.exe`, `${pf}\\Google\\Chrome\\Application\\chrome.exe`, `${pf86}\\Google\\Chrome\\Application\\chrome.exe`, `${la}\\Google\\Chrome\\Application\\chrome.exe`]
    : process.platform === 'darwin' ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
    : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'];
  return list.find(f => f && fs.existsSync(f)) || null;
}
export function startRender({ port, pid, vol, preset = 'digital', onUpdate }) {
  const exe = findBrowser();
  if (!exe) throw { status: 400, code: 'no_browser', message: 'Nu am găsit Microsoft Edge sau Google Chrome pe laptop. Livrează din browserul laptopului sau setează BROWSER_PATH în .env.' };
  for (const j of JOBS.values()) if (j.pid === pid && !j.finished) throw { status: 409, message: 'O livrare pentru acest proiect e deja în curs.' };
  const id = crypto.randomBytes(8).toString('hex');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wonderpages-render-'));
  const url = `http://127.0.0.1:${port}/#/render/${pid}/${vol ?? 'all'}/${id}?preset=${encodeURIComponent(preset)}`;
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--mute-audio', `--user-data-dir=${dir}`, '--window-size=1280,900', url];
  if (process.getuid?.() === 0) args.unshift('--no-sandbox');
  const child = spawn(exe, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const job = { id, pid, vol, child, dir, browser: path.basename(exe), started: Date.now(), label: 'Pornesc livrarea pe laptop', i: 0, n: 0, diagnostic: '', finished: false, onUpdate };
  const diagnostic = data => { job.diagnostic = (job.diagnostic + data.toString()).slice(-4000); };
  child.stdout.on('data', diagnostic); child.stderr.on('data', diagnostic);
  child.on('error', e => finish(id, false, `Browserul de livrare nu poate porni: ${e.message}`));
  job.timer = setTimeout(() => finish(id, false, 'Livrarea a depășit 20 de minute.'), 20 * 60e3);
  child.on('exit', (code, signal) => { job.exitCode = code; job.exitSignal = signal;
    if (!job.finished && code !== 0) setTimeout(() => finish(id, false, `Browserul de livrare s-a închis (cod ${code}, semnal ${signal || 'niciunul'}). ${job.diagnostic.slice(-700)}`), 1500);
    // Windows browser launchers can hand execution to another process and exit successfully.
    // Progress or completion is the evidence, not the launcher's successful exit.
    else if (!job.finished) job.startupTimer = setTimeout(() => { if (!job.lastProgress && !job.finished) finish(id, false, `Browserul ${job.browser} nu a început exportul în 45 de secunde. ${job.diagnostic.slice(-700)}`); }, 45000);
  });
  JOBS.set(id, job); onUpdate?.(job);
  return id;
}
export function killAll() { for (const j of JOBS.values()) if (!j.finished) finish(j.id, false, 'Aplicația s-a oprit.'); }
export function progress(id, d) { const j = JOBS.get(id); if (!j || j.finished) return false; Object.assign(j, { label: String(d.label || j.label).slice(0, 160), i: d.i | 0, n: d.n | 0, lastProgress: Date.now() }); clearTimeout(j.startupTimer); j.onUpdate?.(j); return true; }
export function finish(id, ok, message = '', result = null) {
  const j = JOBS.get(id); if (!j || j.finished) return false;
  j.finished = true; j.ok = !!ok; j.message = message; j.result = result; clearTimeout(j.timer); clearTimeout(j.startupTimer);
  try { j.child.kill(); } catch {}
  setTimeout(() => fs.rm(j.dir, { recursive: true, force: true }, e => { if (e) console.warn('[PDF] profil temporar:', e.message); }), 3000);
  j.onUpdate?.(j); setTimeout(() => JOBS.delete(id), 60e3);
  return true;
}
