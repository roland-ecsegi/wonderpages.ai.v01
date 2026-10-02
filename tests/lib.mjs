// Utilitare comune pentru testele rulate de tests/run.mjs (instanța temporară e la WP_BASE).
import fs from 'node:fs';
import http from 'node:http';
export const BASE = process.env.WP_BASE;
export const TMP = process.env.WP_TMP;
export const ROOT = process.env.WP_ROOT;
export const setFake = s => fs.writeFileSync(process.env.WP_FAKE_STATE, JSON.stringify(s));
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function api(method, p, body, { headers = {}, raw = false } = {}) {
  const h = { 'x-wp': '1', ...headers }; let b = body;
  if (body !== undefined && !Buffer.isBuffer(body) && typeof body !== 'string') { h['content-type'] = 'application/json'; b = JSON.stringify(body); }
  const r = await fetch(BASE + (p.startsWith('/') ? p : '/api/' + p), { method, headers: h, body: b, redirect: 'manual' });
  if (raw) return r;
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, body: j, headers: r.headers };
}
/* a request with full control over Host and the source address (for the network and host checks) */
export function rawRequest({ host = '127.0.0.1', port = Number(process.env.WP_PORT), method = 'GET', path = '/api/state', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host, port, method, path, headers, setHost: false }, res => { let d = ''; res.on('data', c => { d += c; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: d })); });
    req.on('error', reject); if (body) req.write(body); req.end();
  });
}
export const project = async pid => (await api('GET', `projects/${pid}`)).body;
export async function waitFor(fn, { timeout = 120000, every = 300, label = '' } = {}) {
  const t0 = Date.now(); while (Date.now() - t0 < timeout) { const v = await fn(); if (v) return v; await sleep(every); }
  throw new Error('timp depășit: ' + label);
}
export async function waitStatus(pid, statuses, timeout = 180000) {
  return waitFor(async () => { const p = (await project(pid)).project; if (p.status === 'failed') throw new Error('proiect eșuat: ' + p.error); return statuses.includes(p.status) && !p.running ? p : null; }, { timeout, label: statuses.join('|') });
}
export async function connectCanva() {
  const r = await api('GET', '/api/canva/login'); const state = new URL(r.headers.get('location')).searchParams.get('state');
  return api('GET', `/oauth/callback?code=good-code&state=${state}`);
}
export async function approveAll(pid) {
  const d = await project(pid);
  const r = await api('POST', `projects/${pid}/items`, { decisions: d.review.items.map(i => ({ id: i.id, state: 'approved' })) });
  if (r.status !== 200) console.error('Aprobarea tuturor elementelor a fost refuzată:', r.body, d.review.items.filter(i => i.missing || i.blocked).map(i => ({ id: i.id, missing: i.missing, blocked: i.blocked, qa: d.artifacts[i.key]?.content?.qa, lineQA: d.artifacts[i.key]?.content?.lineQA, basedOn: d.artifacts[i.key]?.basedOn })));
  return api('POST', `projects/${pid}/gate/complete`);
}
/* minimal .zip writer (store) for crafted archives */
export function zip(files) {
  const crc = b => { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; } return (~c) >>> 0; };
  const parts = [], central = []; let off = 0;
  for (const f of files) {
    const name = Buffer.from(f.name), data = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data); const cr = crc(data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt32LE(cr, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(name.length, 26);
    parts.push(h, name, data);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt32LE(cr, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(off, 42);
    central.push(Buffer.concat([c, name])); off += 30 + name.length + data.length;
  }
  const cd = Buffer.concat(central); const e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, e]);
}
export const INPUT = { short_description: 'Un pui de dinozaur curios descoperă pajiștea împreună cu prietena lui', target_age: '3-4', languages: ['English', 'Romanian'], visual_style: 'soft3d', page_format: 'portrait45', title: 'Dino Meadow' };
