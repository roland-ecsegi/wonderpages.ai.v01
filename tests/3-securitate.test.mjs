// Teste de securitate: atacurile din audit trebuie acum să EȘUEZE; protecțiile trebuie să reziste.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { api, setFake, project, rawRequest, zip, INPUT, TMP } from './lib.mjs';

test('C1: „code” mălițios dintr-un proiect importat este neutralizat', async () => {
  setFake({});
  const marker = path.join(TMP, 'PWNED_C1'); try { fs.unlinkSync(marker); } catch {}
  const doc = { format: 'wonderpages-project', version: 1, project: { id: 'evil', title: 'Evil', code: 'x"; touch ' + marker + '; echo "', status: 'completed', input: INPUT, approvals: { 'review_collection@c': { x: { state: 'approved' } } } }, blueprint: { slug: 'kids-sc', structure: { volumes: 6, pages: 12, books: [] }, stages: [{ key: 'brief', handler: 'llm_json' }], input_schema: { fields: [] } }, artifacts: {}, comments: [] };
  const r = await api('POST', 'projects/import', zip([{ name: 'p/project.json', data: JSON.stringify(doc) }]), { headers: { 'content-type': 'application/octet-stream' } });
  assert.equal(r.status, 200); const d = await project(r.body.id);
  assert.doesNotMatch(String(d.project.code || ''), /touch|"|;/, 'codul e regenerat');
  assert.equal(d.project.status, 'ready', 'starea nu e preluată din arhivă');
  assert.deepEqual(d.project.approvals, {}, 'aprobările nu sunt preluate');
  const open = await api('POST', `projects/${r.body.id}/open-folder`); assert.ok(open.status === 200 || open.status >= 400);
  await new Promise(s => setTimeout(s, 800));
  assert.equal(fs.existsSync(marker), false, 'nicio comandă nu a fost executată');
});

test('C1: „code” cu ../ nu scoate folderul din destinație', async () => {
  const doc = { format: 'wonderpages-project', version: 1, project: { id: 'x', title: 'T', code: '../../../etc', status: 'ready', input: INPUT }, blueprint: { slug: 'kids-sc', structure: { volumes: 1, pages: 12, books: [] }, stages: [{ key: 'brief', handler: 'llm_json' }], input_schema: { fields: [] } }, artifacts: {} };
  const r = await api('POST', 'projects/import', zip([{ name: 'p/project.json', data: JSON.stringify(doc) }]), { headers: { 'content-type': 'application/octet-stream' } });
  const d = await project(r.body.id); assert.doesNotMatch(String(d.project.code || ''), /\.\./);
});

test('C2: XSS — antet CSP, fișierele străine nu sunt servite ca pagini', async () => {
  const page = await api('GET', '/', undefined, { raw: true });
  const csp = page.headers.get('content-security-policy');
  assert.ok(csp && /script-src 'self'/.test(csp) && !/unsafe-inline[^;]*script/.test(csp), 'CSP fără script inline');
  assert.equal(page.headers.get('x-content-type-options'), 'nosniff');
  const r = await api('POST', 'training/import', zip([{ name: 't/training.json', data: JSON.stringify({ id: 'evil-pack', name: 'x' }) }, { name: 't/evil.html', data: '<script>alert(1)</script>' }]), { headers: { 'content-type': 'application/octet-stream' } });
  assert.equal(r.status, 200);
  const f = await api('GET', 'training/evil-pack/file?path=evil.html', undefined, { raw: true });
  assert.ok(!/text\/html/.test(f.headers.get('content-type') || ''), 'nu e servit ca HTML');
  assert.match(f.headers.get('content-disposition') || '', /attachment/, 'e descărcare, nu pagină');
});

test('anti-CSRF: comenzile fără antetul x-wp sunt respinse', async () => {
  const r = await rawRequest({ method: 'PUT', path: '/api/settings/budget', headers: { Host: '127.0.0.1', 'content-type': 'application/json' }, body: '{"budget5h":50}' });
  assert.equal(r.status, 403);
});

test('anti-DNS-rebinding: Host străin respins, localhost acceptat', async () => {
  assert.equal((await rawRequest({ headers: { Host: 'evil.example.com' } })).status, 403);
  assert.equal((await rawRequest({ headers: { Host: '127.0.0.1' } })).status, 200);
});

test('C3: rutele sensibile cer laptopul (au localOnly)', async () => {
  const src = fs.readFileSync(path.join(process.env.WP_ROOT, 'server', 'index.js'), 'utf8');
  const routes = [
    /on\('PUT', '\/api\/types\/:slug'[\s\S]{0,120}/, /on\('PUT', '\/api\/agents\/:id'[^\n]*/, /on\('PUT', '\/api\/settings\/budget'[^\n]*/,
    /on\('PUT', '\/api\/settings\/canva'[^\n]*/, /on\('POST', '\/api\/projects\/import'[^\n]*/, /on\('DELETE', '\/api\/projects\/:pid'[\s\S]{0,120}/,
    /on\('POST', '\/api\/improvements\/:id\/approve'[^\n]*/, /on\('POST', '\/api\/training\/import'[^\n]*/, /on\('POST', '\/api\/backups\/restore'[\s\S]{0,120}/
  ];
  for (const re of routes) { const m = src.match(re); assert.ok(m && /localOnly\(req\)/.test(m[0]), 'lipsește localOnly: ' + re); }
});

test('M2: arhivă-bombă respinsă (plafon la decomprimare)', async () => {
  const inner = Buffer.alloc(120 * 1024 * 1024); const d = zlib.deflateRawSync(inner);
  const name = Buffer.from('t/training.json');
  const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(8, 8); lh.writeUInt32LE(d.length, 18); lh.writeUInt32LE(inner.length, 22); lh.writeUInt16LE(name.length, 26);
  const cd = Buffer.alloc(46); cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(8, 10); cd.writeUInt32LE(d.length, 20); cd.writeUInt32LE(inner.length, 24); cd.writeUInt16LE(name.length, 28); cd.writeUInt32LE(0, 42);
  const body = Buffer.concat([lh, name, d]); const cdb = Buffer.concat([cd, name]);
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10); end.writeUInt32LE(cdb.length, 12); end.writeUInt32LE(body.length, 16);
  const r = await api('POST', 'training/import', Buffer.concat([body, cdb, end]), { headers: { 'content-type': 'application/octet-stream' } });
  assert.equal(r.status, 413);
});

test('M1: OAuth cu state obligatoriu (Google Drive)', async () => {
  const r = await api('GET', '/oauth/google?code=x&state=forjat', undefined, { raw: true });
  const loc = r.headers.get('location') || ''; assert.match(decodeURIComponent(loc), /nu a fost pornit|expirat|state/i);
});

test('H2: Google Drive cere doar drive.file; tokenurile se stochează criptat', async () => {
  const src = fs.readFileSync(path.join(process.env.WP_ROOT, 'server', 'gdrive.js'), 'utf8');
  assert.match(src, /auth\/drive\.file/); assert.doesNotMatch(src.split('SCOPE =')[1].split('\n')[0], /'https:\/\/www\.googleapis\.com\/auth\/drive'/);
  const sec = fs.readFileSync(path.join(process.env.WP_ROOT, 'server', 'secrets.js'), 'utf8'); assert.match(sec, /aes-256-gcm/);
});

test('/exports acceptă doar PDF-uri reale', async () => {
  setFake({});
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: INPUT })).body.id;
  let r = await api('POST', `projects/${id}/exports?name=evil.bat`, Buffer.from('@echo'), { headers: { 'content-type': 'application/octet-stream' } });
  assert.equal(r.status, 400);
  r = await api('POST', `projects/${id}/exports?name=ok.pdf`, Buffer.from('not a pdf'), { headers: { 'content-type': 'application/octet-stream' } });
  assert.equal(r.status, 400, 'conținut care nu e PDF e respins');
});
