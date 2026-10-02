/**
 * Criptarea datelor de conectare salvate local (tokenuri Canva și Google Drive) — audit H2.
 * Cheia stă într-un fișier separat din folderul de date (data/.secret-key), NU în baza de date:
 * copiile de siguranță ale bazei (pg_dump) conțin doar text criptat.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const KEY_FILE = () => path.join(config.storage.dataDir, '.secret-key');
let KEY = null;
function key() {
  if (KEY) return KEY;
  try { KEY = Buffer.from(fs.readFileSync(KEY_FILE(), 'utf8').trim(), 'base64'); if (KEY.length === 32) return KEY; } catch {}
  KEY = crypto.randomBytes(32);
  fs.mkdirSync(path.dirname(KEY_FILE()), { recursive: true });
  fs.writeFileSync(KEY_FILE(), KEY.toString('base64'), { mode: 0o600 });
  return KEY;
}
/* object -> { sealed: 'v1', iv, tag, data } */
export function seal(obj) {
  if (obj == null) return obj;
  const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return { sealed: 'v1', iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') };
}
/* sealed -> object; an older, unencrypted value is returned as it is (it is sealed at the next save) */
export function unseal(v) {
  if (!v || v.sealed !== 'v1') return v;
  try {
    const d = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(v.iv, 'base64')); d.setAuthTag(Buffer.from(v.tag, 'base64'));
    return JSON.parse(Buffer.concat([d.update(Buffer.from(v.data, 'base64')), d.final()]).toString('utf8'));
  } catch { console.warn('[secrets] datele de conectare nu pot fi decriptate (cheia s-a schimbat?); reconectează serviciul din Setări.'); return null; }
}
