// Minimal Chrome DevTools Protocol helper for UI checks: opens a URL in a real headless browser and evaluates an
// expression until it returns a truthy value (or the timeout passes). No downloads, no external network.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export async function evalInPage(browser, url, expression, { timeout = 30000 } = {}) {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-cdp-'));
  const child = spawn(browser, ['--headless=new', '--no-proxy-server', '--no-sandbox', '--disable-gpu', '--no-first-run', `--user-data-dir=${prof}`, '--remote-debugging-port=0', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'], detached: process.platform !== 'win32' });   // own process group: helpers die with it
  try {
    const wsUrl = await new Promise((resolve, reject) => { let err = ''; const t = setTimeout(() => reject(Error('browser did not start: ' + err.slice(-300))), 20000); child.stderr.on('data', d => { err += d; const m = err.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); resolve(m[1]); } }); });
    const port = new URL(wsUrl).port;
    const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let n = 0; const pending = new Map(); ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
    const send = (method, params = {}) => new Promise(r => { const id = ++n; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
    await send('Page.enable'); await send('Page.navigate', { url });
    const t0 = Date.now(); let last = null;
    while (Date.now() - t0 < timeout) {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      last = r.result?.result?.value; if (last) break; await new Promise(r => setTimeout(r, 300));
    }
    ws.close(); return last;
  } finally { const gone = new Promise(r => (child.exitCode != null ? r() : child.once('exit', r))); try { process.platform !== 'win32' ? process.kill(-child.pid, 'SIGKILL') : child.kill('SIGKILL'); } catch {} await gone; try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); } catch {} }   // temp profile: best effort
}
