/**
 * P1-T04 — hardened ZIP reader for untrusted archives (projects, training packs, reference imports).
 * Rejects: path traversal / absolute paths / drive letters / backslash tricks, duplicate names (exact and
 * case-insensitive), symlink entries, encrypted entries, unsupported compression, CRC mismatch, declared-vs-actual
 * size mismatch, too many entries, oversized entries and oversized totals (zip bombs). Never executes anything.
 * Returns Map<normalizedName, Buffer>, same shape as the legacy `unzip()`.
 */
import zlib from 'node:zlib';
import path from 'node:path';

export const ZIP_LIMITS = Object.freeze({ maxFiles: 2000, maxEntry: 200 * 1024 * 1024, maxTotal: 1024 * 1024 * 1024 });
const fail = (status, code, message) => { throw { status, code, message }; };

const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

/** Normalizes an entry name; returns null for directory entries; throws for unsafe names. */
export function safeEntryName(raw) {
  const name = String(raw);
  if (name.includes('\0')) fail(400, 'zip_unsafe_name', 'Nume de fișier invalid în arhivă.');
  if (name.includes('\\')) fail(400, 'zip_unsafe_name', 'Arhiva folosește separatori „\\”: respinsă.');
  if (name.startsWith('/') || /^[a-zA-Z]:/.test(name)) fail(400, 'zip_unsafe_name', 'Arhiva conține căi absolute: respinsă.');
  if (name.endsWith('/')) return null;
  const segs = name.split('/');
  if (segs.some(seg => seg === '..' || seg === '.' || seg === '')) fail(400, 'zip_traversal', 'Arhiva conține căi care ies din folder sau segmente goale („..”, „.”, „//”): respinsă.');
  return path.posix.normalize(name);
}

export function readZip(buf, limits = ZIP_LIMITS) {
  const L = { ...ZIP_LIMITS, ...limits };
  if (!Buffer.isBuffer(buf) || buf.length < 22) fail(400, 'zip_invalid', 'Fișierul nu e o arhivă .zip validă.');
  let e = buf.length - 22; const stop = Math.max(0, buf.length - 22 - 65535);
  while (e >= stop && buf.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < stop) fail(400, 'zip_invalid', 'Fișierul nu e o arhivă .zip validă.');
  const n = buf.readUInt16LE(e + 10); let off = buf.readUInt32LE(e + 16);
  if (n > L.maxFiles) fail(413, 'zip_too_many', `Arhiva are ${n} fișiere (limită ${L.maxFiles}).`);
  const out = new Map(), lower = new Set(); let total = 0;
  for (let i = 0; i < n; i++) {
    if (off + 46 > buf.length || buf.readUInt32LE(off) !== 0x02014b50) fail(400, 'zip_invalid', 'Directorul central al arhivei este corupt.');
    const flags = buf.readUInt16LE(off + 8), method = buf.readUInt16LE(off + 10), crc = buf.readUInt32LE(off + 16), csize = buf.readUInt32LE(off + 20), usize = buf.readUInt32LE(off + 24);
    const nlen = buf.readUInt16LE(off + 28), xlen = buf.readUInt16LE(off + 30), clen = buf.readUInt16LE(off + 32), madeBy = buf.readUInt16LE(off + 4) >> 8, ext = buf.readUInt32LE(off + 38), lho = buf.readUInt32LE(off + 42);
    if (off + 46 + nlen > buf.length) fail(400, 'zip_invalid', 'Nume de fișier trunchiat.');
    const raw = buf.toString('utf8', off + 46, off + 46 + nlen); off += 46 + nlen + xlen + clen;
    const name = safeEntryName(raw); if (name === null) continue;
    if (madeBy === 3 && ((ext >>> 16) & 0o170000) === 0o120000) fail(400, 'zip_symlink', 'Arhiva conține legături simbolice: respinsă.');
    if (flags & 1) fail(400, 'zip_encrypted', 'Arhivele criptate nu sunt acceptate.');
    if (out.has(name) || lower.has(name.toLowerCase())) fail(400, 'zip_duplicate', `Nume duplicat în arhivă: ${name}.`);
    if (usize > L.maxEntry || total + usize > L.maxTotal) fail(413, 'zip_too_big', 'Arhiva se despachetează în fișiere prea mari (limită de siguranță).');
    if (lho + 30 > buf.length || buf.readUInt32LE(lho) !== 0x04034b50) fail(400, 'zip_invalid', 'Antet local corupt.');
    const start = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
    if (start + csize > buf.length) fail(400, 'zip_invalid', 'Conținut trunchiat.');
    const data = buf.subarray(start, start + csize); let body;
    if (method === 0) body = Buffer.from(data);
    else if (method === 8) { try { body = zlib.inflateRawSync(data, { maxOutputLength: L.maxEntry }); } catch (err) { if (err?.code === 'ERR_BUFFER_TOO_LARGE' || /buffer/i.test(err?.message || '')) fail(413, 'zip_too_big', 'Arhiva se despachetează în fișiere prea mari (limită de siguranță).'); fail(400, 'zip_invalid', 'Conținut comprimat corupt.'); } }
    else fail(400, 'zip_method', `Metodă de compresie nesuportată (${method}).`);
    if (body.length !== usize) fail(400, 'zip_size_mismatch', `Dimensiune declarată diferită de cea reală: ${name}.`);
    if (crc32(body) !== crc) fail(400, 'zip_crc', `Sumă de control greșită: ${name}.`);
    total += body.length; if (total > L.maxTotal) fail(413, 'zip_too_big', 'Arhiva se despachetează în fișiere prea mari (limită de siguranță).');
    out.set(name, body); lower.add(name.toLowerCase());
  }
  return out;
}

/* MIME sniffing for decode checks: the declared extension must match the actual bytes. */
export function sniffImage(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}
export function pngSize(buf) {
  if (sniffImage(buf) !== 'image/png' || buf.length < 24 || buf.toString('latin1', 12, 16) !== 'IHDR') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
