/**
 * Pornirea aplicației: o pagină de stare răspunde imediat la http://localhost:4321 cât timp aplicația
 * se încarcă (baza de date, Claude). Dacă pornirea eșuează, pagina arată motivul și ce ai de făcut,
 * în loc de „This site can't be reached”. După 60 de secunde procesul se oprește, ca pornirea să fie reîncercată.
 */
import http from 'node:http';
import { config } from './config.js';

const BOOT = { stage: 'Pornesc aplicația…', error: null, since: Date.now() };
globalThis.__wpBootStage = s => { BOOT.stage = s; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const page = () => `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="${BOOT.error ? 15 : 3}"><title>WonderPages.AI</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F2F3F5;color:#15171C;font:16px/1.5 system-ui,Segoe UI,sans-serif;padding:20px}@media (prefers-color-scheme:dark){body{background:#131519;color:#ECEEF2}}div{max-width:560px}h1{font-size:22px;margin:0 0 8px}code{background:rgba(127,127,127,.15);padding:2px 6px;border-radius:4px}li{margin:6px 0}.e{color:#C23333;font-weight:600}</style></head><body><div>
${BOOT.error ? `<h1>WonderPages nu a putut porni</h1><p class="e">${esc(BOOT.error)}</p><ol><li>Verifică să fie pornit <b>Docker Desktop</b> și să scrie „Engine running”; în lista Containers, <code>wonderpages-db</code> trebuie să fie pornit.</li><li>Aplicația reîncearcă singură peste câteva secunde; pagina se reîmprospătează.</li><li>Pentru detalii: dublu-clic pe <code>porneste.bat</code> din folderul aplicației (fereastra arată mesajul complet) sau deschide <code>wonderpages.log</code>.</li></ol>`
  : `<h1>WonderPages pornește…</h1><p>${esc(BOOT.stage)}</p><p style="opacity:.7">Prima pornire poate dura până la un minut. Pagina se reîmprospătează singură.</p>`}</div></body></html>`;
const handler = (req, res) => {
  if (req.url.startsWith('/api/')) { res.writeHead(503, { 'content-type': 'application/json' }); res.end(JSON.stringify({ message: BOOT.error || BOOT.stage, booting: true })); return; }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(page());
};
const boot4 = http.createServer(handler), boot6 = http.createServer(handler);
boot4.on('error', e => { if (e.code === 'EADDRINUSE') { console.error(`Portul ${config.port} e ocupat: aplicația rulează deja sau alt program folosește portul.`); process.exit(3); } });
boot6.on('error', () => {});
await new Promise(r => boot4.listen(config.port, '127.0.0.1', r)); boot6.listen(config.port, '::1');
globalThis.__wpBoot = { close: () => Promise.all([new Promise(r => boot4.close(() => r())), new Promise(r => boot6.close(() => r()))]).then(() => { boot4.closeAllConnections?.(); boot6.closeAllConnections?.(); }) };
try {
  await import(process.env.WP_INDEX || './index.js');
} catch (e) {
  BOOT.error = String(e?.message || e);
  console.error('[pornire] ' + BOOT.error);
  setTimeout(() => process.exit(1), 60e3);            // the background loop starts it again
}
