/**
 * Acces din rețeaua locală (telefon, tabletă, alt PC pe același Wi-Fi).
 * - Oprit implicit. Se pornește din Setări, doar de pe laptopul pe care rulează aplicația.
 * - Orice dispozitiv din rețea trebuie să introducă un cod de acces; laptopul nu are nevoie de cod.
 * - Sesiune de 30 de zile într-un cookie HttpOnly, SameSite=Strict; 5 încercări greșite pe minut blochează IP-ul.
 */
import os from 'node:os';
import dgram from 'node:dgram';
import crypto from 'node:crypto';

let storage, S = {};
const attempts = new Map();
export async function initLan(s) {
  refreshPrimary().catch(() => {}); storage = s; S = (await s.readJSON('lan.json', {})) || {}; S.sessions = (S.sessions || []).filter(x => x.exp > Date.now()); }
const save = () => storage.writeJSON('lan.json', S);
export const lanEnabled = () => !!S.enabled && !!S.codeHash;

export function isLocal(req) { const a = req.socket.remoteAddress || ''; return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1'; }
const privateIp = h => /^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+)$/.test(h);
export function hostAllowed(req) {
  const h = String(req.headers.host || '').replace(/:\d+$/, '').replace(/^\[|\]$/g, '').toLowerCase();
  if (['localhost', '127.0.0.1', '::1'].includes(h)) return true;
  if (!lanEnabled()) return false;
  const name = os.hostname().toLowerCase();
  return privateIp(h) || h === name || h === name + '.local' || h.endsWith('.local');
}
/* Which address works from the phone? A laptop often has virtual network cards too (VirtualBox 192.168.56.x,
   WSL/Hyper-V/Docker 172.x), which other devices cannot reach. The real one is the address the laptop uses to
   reach the router: asked from the operating system (a UDP "connect" sends nothing), with virtual cards filtered
   out by name as a fallback. It comes first, and the QR code uses it. */
const VIRTUAL = /(vethernet|wsl|hyper-?v|virtualbox|vbox|host-only|vmware|vmnet|docker|default switch|loopback|bluetooth|npcap|tap-|tun|zerotier|hamachi|tailscale|wireguard)/i;
let primary = null, primaryAt = 0;
function detectPrimary() {
  return new Promise(res => {
    const s = dgram.createSocket('udp4'); let done = false;
    const end = v => { if (done) return; done = true; try { s.close(); } catch {} res(v); };
    const t = setTimeout(() => end(null), 1500);
    s.on('error', () => { clearTimeout(t); end(null); });
    try { s.connect(53, '8.8.8.8', () => { clearTimeout(t); try { end(s.address().address); } catch { end(null); } }); } catch { clearTimeout(t); end(null); }
  });
}
export async function refreshPrimary() { primary = await detectPrimary(); primaryAt = Date.now(); return primary; }
export function orderAddresses(ifaces, prim) {
  const list = [];
  for (const [name, addrs] of Object.entries(ifaces)) for (const i of addrs || []) if (i.family === 'IPv4' && !i.internal && privateIp(i.address)) list.push({ ip: i.address, name, virtual: VIRTUAL.test(name) });
  const score = x => (x.ip === prim ? 0 : x.virtual ? 2 : 1) * 10 + (/wi-?fi|wlan|wireless|ethernet|eth\d|en\d/i.test(x.name) ? 0 : 1);
  list.sort((a, b) => score(a) - score(b));
  return list.map((x, i) => ({ ...x, primary: i === 0 && !x.virtual }));
}
export function lanAddresses(port) {
  if (Date.now() - primaryAt > 30000) refreshPrimary().catch(() => {});     // networks change (another Wi-Fi, VPN)
  return orderAddresses(os.networkInterfaces(), primary).map(x => ({ ...x, url: `${process.env.WP_TLS_CERT && process.env.WP_TLS_KEY ? 'https' : 'http'}://${x.ip}:${process.env.WP_TLS_CERT && process.env.WP_TLS_KEY ? Number(process.env.WP_TLS_PORT||4322) : port}` }));
}
export function lanUrls(port) { return lanAddresses(port).map(x => x.url); }
export const localName = port => `${process.env.WP_TLS_CERT && process.env.WP_TLS_KEY ? 'https' : 'http'}://${os.hostname().toLowerCase()}.local:${process.env.WP_TLS_CERT && process.env.WP_TLS_KEY ? Number(process.env.WP_TLS_PORT||4322) : port}`;
const hash = (code, salt) => crypto.scryptSync(String(code), salt, 32).toString('hex');
export async function configure({ enabled, code }) {
  if (code != null && String(code).length) {
    if (String(code).length < 6) throw { status: 400, message: 'Codul de acces trebuie să aibă cel puțin 6 caractere.' };
    S.salt = crypto.randomBytes(16).toString('hex'); S.codeHash = hash(code, S.salt); S.sessions = [];   // new code: every device logs in again
  }
  if (enabled && !S.codeHash) throw { status: 400, message: 'Alege întâi un cod de acces.' };
  S.enabled = !!enabled; await save(); return status();
}
export function status() { return { enabled: lanEnabled(), hasCode: !!S.codeHash, devices: (S.sessions || []).length }; }
export async function logoutAll() { S.sessions = []; await save(); }

function cookie(req, name) { const m = String(req.headers.cookie || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)')); return m ? m[1] : null; }
export function authorized(req) {
  if (isLocal(req)) return true;
  if (!lanEnabled()) return false;
  const t = cookie(req, 'wp_session'); if (!t) return false;
  const h = crypto.createHash('sha256').update(t).digest('hex');
  return (S.sessions || []).some(x => x.h === h && x.exp > Date.now());
}
export async function login(req, res, code) {
  const ip = req.socket.remoteAddress || '?'; const now = Date.now();
  const a = (attempts.get(ip) || []).filter(t => t > now - 60e3);
  if (a.length >= 5) throw { status: 429, message: 'Prea multe încercări. Mai încearcă peste un minut.' };
  if (!lanEnabled() || !S.codeHash || !crypto.timingSafeEqual(Buffer.from(hash(code || '', S.salt)), Buffer.from(S.codeHash))) { a.push(now); attempts.set(ip, a); throw { status: 401, message: 'Cod greșit.' }; }
  const token = crypto.randomBytes(32).toString('hex');
  S.sessions.push({ h: crypto.createHash('sha256').update(token).digest('hex'), exp: now + 30 * 24 * 3600e3, ua: String(req.headers['user-agent'] || '').slice(0, 120), at: now });
  S.sessions = S.sessions.slice(-30); await save();
  res.setHeader('set-cookie', `wp_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 3600}${req.socket.encrypted ? '; Secure' : ''}`);
}
export const LOGIN_PAGE = `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>WonderPages.AI</title>
<style>:root{color-scheme:light dark;--bg:#F2F3F5;--s:#fff;--i:#15171C;--m:#E5007D}@media (prefers-color-scheme:dark){:root{--bg:#131519;--s:#1B1E24;--i:#ECEEF2}}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--i);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:20px}
form{background:var(--s);padding:28px;border-radius:14px;width:min(360px,100%);box-shadow:0 10px 30px rgba(0,0,0,.08)}h1{font-size:22px;margin:0 0 4px}p{margin:0 0 18px;opacity:.7;font-size:14px}
input{width:100%;box-sizing:border-box;font-size:18px;padding:12px 14px;border-radius:9px;border:1px solid #c6cbd4;background:transparent;color:inherit}button{margin-top:12px;width:100%;font-size:16px;font-weight:600;padding:12px;border:0;border-radius:9px;background:var(--i);color:var(--bg)}
.e{color:#C23333;font-size:14px;min-height:20px;margin-top:8px}</style></head><body><form id="f"><h1>WonderPages.AI</h1><p>Introdu codul de acces setat pe laptop.</p>
<input id="c" type="password" autocomplete="current-password" inputmode="text" autofocus aria-label="Cod de acces"><button>Intră</button><div class="e" id="e"></div></form>
<script src="/login.js" defer></script></body></html>`;
export async function qrSvg(text) { try { const QR = (await import('qrcode')).default; return await QR.toString(text, { type: 'svg', margin: 1, width: 180 }); } catch { return null; } }
