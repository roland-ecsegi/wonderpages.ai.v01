// TEST-P1-T04 — traversal / nume duplicate / supradimensionare / decode mismatch, cerere străină, expirarea sesiunii,
// instalare nouă fără credențiale implicite accesibile din rețea, secrete absente din export și din jurnal.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { api, zip, INPUT, rawRequest, project, TMP, ROOT, connectCanva } from './lib.mjs';
import { readZip, sniffImage } from '../server/security/safe-zip.js';
import { transportMode, remoteMutationBlocked, originAllowed } from '../server/security/posture.js';
import { redact } from '../server/security/redact.js';

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4b40000000049454e44ae426082', 'hex');
const codeOf = fn => { try { fn(); return 'ok'; } catch (e) { return e.code; } };

test('P1-T04: cititorul ZIP respinge traversal, căi absolute, duplicate, CRC/dimensiune greșite', () => {
  assert.equal(readZip(zip([{ name: 'a/b.txt', data: 'x' }])).get('a/b.txt').toString(), 'x');
  assert.equal(codeOf(() => readZip(zip([{ name: '../evil.txt', data: 'x' }]))), 'zip_traversal');
  assert.equal(codeOf(() => readZip(zip([{ name: 'a/../../evil.txt', data: 'x' }]))), 'zip_traversal');
  assert.equal(codeOf(() => readZip(zip([{ name: '/etc/passwd', data: 'x' }]))), 'zip_unsafe_name');
  assert.equal(codeOf(() => readZip(zip([{ name: 'C:/x.txt', data: 'x' }]))), 'zip_unsafe_name');
  assert.equal(codeOf(() => readZip(zip([{ name: 'a\\..\\x.txt', data: 'x' }]))), 'zip_unsafe_name');
  assert.equal(codeOf(() => readZip(zip([{ name: 'p/a.png', data: 'x' }, { name: 'p/a.png', data: 'y' }]))), 'zip_duplicate');
  assert.equal(codeOf(() => readZip(zip([{ name: 'p/A.png', data: 'x' }, { name: 'p/a.png', data: 'y' }]))), 'zip_duplicate');
  const z = zip([{ name: 'f.txt', data: 'hello' }]); const bad = Buffer.from(z); bad[30 + 5] ^= 0xff;   // corrupt data byte
  assert.equal(codeOf(() => readZip(bad)), 'zip_crc');
  assert.equal(codeOf(() => readZip(zip(Array.from({ length: 5 }, (_, i) => ({ name: `f${i}`, data: 'x' }))), { maxFiles: 3 })), 'zip_too_many');
  assert.equal(codeOf(() => readZip(zip([{ name: 'big', data: Buffer.alloc(2048) }]), { maxEntry: 1024 })), 'zip_too_big');
  const sym = Buffer.from(zip([{ name: 'link', data: '/etc/passwd' }])); const cd = sym.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  sym.writeUInt16LE((3 << 8) | 20, cd + 4); sym.writeUInt32LE((0o120777 << 16) >>> 0, cd + 38);
  assert.equal(codeOf(() => readZip(sym)), 'zip_symlink');
});

test('P1-T04: tipul imaginii se verifică după conținut, nu după extensie', () => {
  assert.equal(sniffImage(PNG), 'image/png');
  assert.equal(sniffImage(Buffer.from('<html><script>alert(1)</script></html>')), null);
  assert.equal(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])), 'image/jpeg');
});

test('P1-T04 API: pachet de training cu traversal sau duplicate este respins fără scriere', async () => {
  let r = await api('POST', 'training/import', zip([{ name: 'training.json', data: '{"id":"evil-pack"}' }, { name: '../../escape.txt', data: 'x' }]), { headers: { 'content-type': 'application/octet-stream' } });
  assert.equal(r.status, 400);
  r = await api('POST', 'training/import', zip([{ name: 'training.json', data: '{"id":"dup-pack"}' }, { name: 'a.md', data: 'x' }, { name: 'a.md', data: 'y' }]), { headers: { 'content-type': 'application/octet-stream' } });
  assert.equal(r.status, 400);
  assert.ok(!(await api('GET', 'training')).body.packs.some(p => ['evil-pack', 'dup-pack'].includes(p.id)));
});

test('P1-T04 API: la import, o „imagine” care nu e imagine nu se păstrează; referința falsă la proiect nou e refuzată', async () => {
  const bp = JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8'));
  const doc = { format: 'wonderpages-project', version: 1, project: { title: 'MIME', input: INPUT, refs: [{ file: 'uploads/01-ok.png', mime: 'image/png', name: 'ok' }, { file: 'uploads/02-fake.png', mime: 'image/png', name: 'fake' }] }, blueprint: bp, artifacts: {} };
  const r = await api('POST', 'projects/import', zip([{ name: 'p/project.json', data: JSON.stringify(doc) }, { name: 'p/files/uploads/01-ok.png', data: PNG }, { name: 'p/files/uploads/02-fake.png', data: '<html>not an image</html>' }]), { headers: { 'content-type': 'application/octet-stream' } });
  assert.equal(r.status, 200);
  const d = await project(r.body.id);
  assert.deepEqual(d.project.refs.map(x => x.file), ['uploads/01-ok.png']);
  assert.ok(d.project.log.some(l => /respinse la import/.test(l.text)));
  const bad = await api('POST', 'projects', { typeSlug: 'kids-sc', input: INPUT, refs: [{ name: 'x.png', mime: 'image/png', data: Buffer.from('GIF89a not png').toString('base64') }] });
  assert.equal(bad.status, 400); assert.equal(bad.body.code, 'mime_mismatch');
  await api('POST', `projects/${r.body.id}/archive`, { archived: true });
});

test('P1-T04: cerere cu Origin străin este respinsă; politica de transport LAN', async () => {
  const r = await rawRequest({ method: 'POST', path: '/api/claude/check', headers: { Host: '127.0.0.1', Origin: 'http://evil.example.com', 'x-wp': '1', 'content-type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 403);
  assert.equal(originAllowed({ method: 'POST', headers: { host: 'laptop.local:4321', origin: 'http://laptop.local:4321' } }), true);
  assert.equal(transportMode({ lanEnabled: false }), 'local-only');
  assert.equal(transportMode({ lanEnabled: true, tlsEnabled: true }), 'lan-https');
  assert.equal(transportMode({ lanEnabled: true, tlsEnabled: false }), 'lan-restricted');
  assert.equal(transportMode({ lanEnabled: true, tlsEnabled: false, acceptPlainLan: true }), 'lan-plain-accepted');
  const blocked = p => remoteMutationBlocked({ mode: 'lan-restricted', local: false, method: 'POST', pathname: p });
  assert.equal(blocked('/api/projects/pabc1234/items'), true); assert.equal(blocked('/api/projects/pabc1234/gate/complete'), true); assert.equal(blocked('/api/projects/pabc1234/artifacts/final_0'), true);
  assert.equal(blocked('/api/projects/pabc1234/comments'), false, 'comentariile rămân permise');
  assert.equal(remoteMutationBlocked({ mode: 'lan-restricted', local: true, method: 'POST', pathname: '/api/projects/pabc1234/items' }), false, 'laptopul nu este restricționat');
  assert.equal(remoteMutationBlocked({ mode: 'lan-https', local: false, method: 'POST', pathname: '/api/projects/pabc1234/items' }), false);
  const posture = await api('GET', 'security/posture'); assert.equal(posture.status, 200); assert.equal(posture.body.mode, 'local-only');
});

test('P1-T04: sesiunea LAN expirată nu mai autorizează', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-lan-')); const { LocalStorage } = await import('../server/storage/local.js'); const s = new LocalStorage(dir); await s.init();
  const tok = t => crypto.createHash('sha256').update(t).digest('hex');
  await s.writeJSON('lan.json', { enabled: true, codeHash: 'x', salt: 'y', sessions: [{ h: tok('valid'), exp: Date.now() + 60e3 }, { h: tok('expired'), exp: Date.now() - 1 }] });
  const LAN = await import('../server/lan.js'); await LAN.initLan(s);
  const req = t => ({ socket: { remoteAddress: '192.168.1.20' }, headers: { cookie: `wp_session=${t}` } });
  assert.equal(LAN.authorized(req('valid')), true); assert.equal(LAN.authorized(req('expired')), false); assert.equal(LAN.authorized(req('forged')), false);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P1-T04: credențialele DB legacy doar pentru baza locală; instalarea nouă generează parola și leagă baza la loopback', async () => {
  const { PostgresStorage } = await import('../server/storage/postgres.js');
  const net = new PostgresStorage({ databaseUrl: 'postgres://op:x@db.example.com:5432/w', dataDir: path.join(TMP, 'pgx') });
  const loc = new PostgresStorage({ databaseUrl: 'postgres://op:x@127.0.0.1:5433/w', dataDir: path.join(TMP, 'pgy') });
  assert.equal(net.candidates().length, 1, 'gazdă din rețea: niciun set implicit încercat');
  assert.ok(loc.candidates().some(u => /wonderpages-local/.test(u)), 'migrarea locală legacy rămâne posibilă');
  await net.pool.end(); await loc.pool.end();
  assert.match(fs.readFileSync(path.join(ROOT, 'docker-compose.yml'), 'utf8'), /"127\.0\.0\.1:5433:5432"/);
  assert.match(fs.readFileSync(path.join(ROOT, 'instaleaza.bat'), 'utf8'), /Get-Random -Count 24[\s\S]*-replace 'wonderpages-local'/);
});

test('P1-T04: secretele lipsesc din exportul de proiect și din jurnal', async () => {
  const r = await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Fără secrete' } });
  await connectCanva().catch(() => null);   // tokenurile Canva se criptează: cheia locală există
  const key = fs.readFileSync(path.join(TMP, 'data', '.secret-key'), 'utf8').trim();
  const zipRes = await api('GET', `projects/${r.body.id}/export.zip`, undefined, { raw: true }); const buf = Buffer.from(await zipRes.arrayBuffer());
  const files = readZip(buf); const all = Buffer.concat([...files.values()]).toString('latin1');
  assert.ok(!all.includes(key), 'cheia locală nu este în export'); assert.ok(![...files.keys()].some(k => /secret|lan\.json|settings\.json|canva|gdrive|\.env/i.test(path.posix.basename(k))), [...files.keys()].join());
  assert.equal(redact('postgres://wonderpages:hunter2@127.0.0.1:5433/wp'), 'postgres://wonderpages:***@127.0.0.1:5433/wp');
  assert.doesNotMatch(redact('Authorization: Bearer abcdefghijklmnop'), /abcdefghijklmnop/);
  assert.doesNotMatch(redact('{"refresh_token":"1//0abcdefg","x":1}'), /0abcdefg/);
  assert.equal(redact('key sk-ant-abc123456789'), 'key sk-***');
  await api('POST', `projects/${r.body.id}/archive`, { archived: true });
});
