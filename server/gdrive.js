/**
 * Google Drive: trimite pachetul final (ZIP) într-un folder „WonderPages.AI” din Drive-ul tău.
 * Necesită GOOGLE_CLIENT_ID și GOOGLE_CLIENT_SECRET (aplicație de tip „Desktop” în Google Cloud Console,
 * cu Google Drive API activat). Acces doar la fișierele create de aplicație (scope drive.file).
 */
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { seal, unseal } from './secrets.js';
const SCOPE = 'https://www.googleapis.com/auth/drive.file'; // audit H2: only the files and folders this app creates (not your whole Drive)
export class GDrive {
  constructor(storage, port) { this.s = storage; this.redirect = `http://localhost:${port}/oauth/google`; this.id = process.env.GOOGLE_CLIENT_ID || ''; this.secret = process.env.GOOGLE_CLIENT_SECRET || ''; this.auth = null; }
  async init() { this.auth = unseal(await this.s.readJSON('gdrive-auth.json', null)); if (this.auth) await this.s.writeJSON('gdrive-auth.json', seal(this.auth)); }
  status() { return { configured: !!(this.id && this.secret), connected: !!this.auth?.refresh_token, folderId: this.auth?.chosenFolderId || null, folderName: this.auth?.chosenFolderName || null }; }
  async chooseFolder(input) {
    const id = (String(input).match(/folders\/([A-Za-z0-9_-]+)/) || [])[1] || String(input).trim();
    const tok = await this.access();
    const r = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType&supportsAllDrives=true`, { headers: { authorization: 'Bearer ' + tok } });
    const j = await r.json(); if (!r.ok || j.mimeType !== 'application/vnd.google-apps.folder') throw new Error('Folderul nu e accesibil. Din motive de siguranță, aplicația are acces doar la fișierele și folderele create de ea: încarcă în folderul „WonderPages.AI” (îl poți muta sau partaja în Drive) sau folosește „Al doilea folder” cu Google Drive pentru desktop.');
    this.auth.chosenFolderId = j.id; this.auth.chosenFolderName = j.name; await this.s.writeJSON('gdrive-auth.json', seal(this.auth)); return { id: j.id, name: j.name };
  }
  loginUrl() {
    this.state = crypto.randomBytes(16).toString('hex'); this.stateAt = Date.now();
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ client_id: this.id, redirect_uri: this.redirect, response_type: 'code', scope: SCOPE, access_type: 'offline', prompt: 'consent', state: this.state });
  }
  async token(params) {
    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: this.id, client_secret: this.secret, ...params }) });
    const j = await r.json(); if (!r.ok) throw new Error('Google: ' + (j.error_description || j.error || r.status)); return j;
  }
  async finish(code, state) {
    /* audit M1: the answer must carry the state of a login started here, at most 10 minutes ago, used once */
    const ok = this.state && state === this.state && Date.now() - (this.stateAt || 0) < 10 * 60e3; this.state = null;
    if (!ok) throw new Error('Conectarea nu a fost pornită din aplicație sau a expirat. Reîncearcă din Setări.');
    const t = await this.token({ code, grant_type: 'authorization_code', redirect_uri: this.redirect });
    this.auth = { ...t, expires_at: Date.now() + (t.expires_in - 60) * 1000 }; await this.s.writeJSON('gdrive-auth.json', seal(this.auth));
  }
  async access() {
    if (!this.auth?.refresh_token) throw new Error('Google Drive nu este conectat.');
    if (Date.now() > (this.auth.expires_at || 0)) { const t = await this.token({ refresh_token: this.auth.refresh_token, grant_type: 'refresh_token' }); this.auth = { ...this.auth, ...t, expires_at: Date.now() + (t.expires_in - 60) * 1000 }; await this.s.writeJSON('gdrive-auth.json', seal(this.auth)); }
    return this.auth.access_token;
  }
  async folder(tok) {
    if (this.auth.chosenFolderId) return this.auth.chosenFolderId;
    if (this.auth.folderId) return this.auth.folderId;
    const r = await fetch('https://www.googleapis.com/drive/v3/files', { method: 'POST', headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'WonderPages.AI', mimeType: 'application/vnd.google-apps.folder' }) });
    const j = await r.json(); if (!r.ok) throw new Error('Drive: ' + (j.error?.message || r.status));
    this.auth.folderId = j.id; await this.s.writeJSON('gdrive-auth.json', seal(this.auth)); return j.id;
  }
  async upload(file, name) {
    const tok = await this.access(); const parent = await this.folder(tok); const buf = await fs.readFile(file);
    const init = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true', { method: 'POST', headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json', 'x-upload-content-type': 'application/zip', 'x-upload-content-length': String(buf.length) }, body: JSON.stringify({ name, parents: [parent] }) });
    if (!init.ok) throw new Error('Drive: nu am putut începe încărcarea (' + init.status + ')');
    const up = await fetch(init.headers.get('location'), { method: 'PUT', headers: { 'content-type': 'application/zip' }, body: buf });
    const j = await up.json(); if (!up.ok) throw new Error('Drive: ' + (j.error?.message || up.status));
    return { id: j.id, link: `https://drive.google.com/file/d/${j.id}/view` };
  }
  /* v19.1: permanent delete of a file this app uploaded (scope drive.file); already gone counts as done */
  async remove(id) {
    if (!/^[-\w]{10,}$/.test(String(id))) throw new Error('id Drive invalid');
    const tok = await this.access(); const r = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?supportsAllDrives=true`, { method: 'DELETE', headers: { authorization: 'Bearer ' + tok } });
    if (!r.ok && r.status !== 404) throw new Error('Drive: nu am putut șterge fișierul (' + r.status + ')');
  }
}
