/**
 * P3-T05 — operator-assisted channel (OUTPUT-08): a work packet carries the exact prompt, the agent context, the output
 * schema, reference images with hashes and return instructions. The operator runs it in the official app of a provider
 * they are entitled to use and returns the result; ingestion uses the SAME validators, records provenance
 * `operator-exchange` and never touches approvals. A packet bound to an older project state is refused (stale hash).
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { zipDir } from '../output.js';

export const PACKET_SCHEMA = 'wonderpages.work-packet/1';
const TTL = 7 * 24 * 3600e3;
const rel = (pid, id) => `projects/${pid}/packets/${id}.json`;
export async function createPacket(storage, pid, spec, actor = 'operator@laptop') {
  const id = 'wp' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
  const doc = { schema: PACKET_SCHEMA, id, pid, ...spec, status: 'issued', actor, issuedAt: Date.now(), expiresAt: Date.now() + TTL, attempts: [] };
  await storage.writeJSON(rel(pid, id), doc); return doc;
}
export const getPacket = (storage, pid, id) => (/^wp[a-z0-9]{6,30}$/.test(id) ? storage.readJSON(rel(pid, id), null) : null);
export async function listPackets(storage, pid) { const out = []; for (const f of (await storage.list(`projects/${pid}/packets`).catch(() => [])).filter(x => x.name.endsWith('.json'))) { const d = await storage.readJSON(`projects/${pid}/packets/${f.name}`, null); if (d) out.push({ ...d, prompt: undefined, system: undefined }); } return out.sort((a, b) => b.issuedAt - a.issuedAt); }
export async function recordAttempt(storage, pid, packet, outcome) {
  const next = { ...packet, status: outcome.ok ? 'ingested' : packet.status, attempts: [...(packet.attempts || []), { at: Date.now(), ...outcome }].slice(-20) };
  await storage.writeJSON(rel(pid, packet.id), next); return next;
}
export function assertUsable(packet) {
  if (!packet) throw { status: 404, message: 'Pachet inexistent.' };
  if (packet.status === 'ingested') throw { status: 409, code: 'packet_used', message: 'Pachetul a fost deja folosit; generează unul nou pentru o altă variantă.' };
  if (Date.now() > packet.expiresAt) throw { status: 409, code: 'stale_packet', message: 'Pachetul a expirat; generează unul nou.' };
}
/** ZIP for the operator: prompt.md (agent context + task), schema.json, refs/, manifest.json (hashes), RETURN.md. */
export async function packetZip(repo, pid, packet) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wonderpages-packet-'));
  const files = [];
  const put = async (name, data) => { await fs.mkdir(path.dirname(path.join(dir, name)), { recursive: true }); await fs.writeFile(path.join(dir, name), data); files.push({ path: name, sha256: crypto.createHash('sha256').update(data).digest('hex'), bytes: Buffer.byteLength(data) }); };
  await put('prompt.md', packet.kind === 'text' ? `# Rol (context de sistem)\n\n${packet.system}\n\n# Sarcina\n\n${packet.prompt}\n` : `# Imagine — ${packet.outKey}\n\n${packet.prompt}\n`);
  if (packet.schema) await put('schema.json', JSON.stringify(packet.schema, null, 1));
  for (const r of packet.refs || []) { try { const b = await repo.readFile(pid, r.file); await put('refs/' + path.basename(r.file), b); } catch {} }
  await put('RETURN.md', packet.kind === 'text'
    ? `Rulează promptul în aplicația oficială a unui furnizor pe care ai dreptul să îl folosești (fără chei API, fără conturi partajate).\nCopiază răspunsul JSON integral și încarcă-l în WonderPages: Activitate › Schimb manual › ${packet.id}.\nRăspunsul trebuie să respecte schema.json; altfel este respins, ca orice rezultat automat. Aprobarea rămâne a ta.\n`
    : `Generează o singură imagine în aplicația oficială a furnizorului, folosind referințele din refs/ pentru identitatea personajelor.\nFără text sau litere în imagine. Latura scurtă ≥ ${packet.minShortSide} px; raport ${packet.aspect?.toFixed?.(3)}.\nÎncarcă PNG-ul în WonderPages: Activitate › Schimb manual › ${packet.id}. QA vizual și aprobarea rămân obligatorii.\n`);
  await put('manifest.json', JSON.stringify({ schema: PACKET_SCHEMA, id: packet.id, kind: packet.kind, target: packet.outKey, inputsHash: packet.inputsHash, issuedAt: packet.issuedAt, expiresAt: packet.expiresAt, files }, null, 1));
  const out = path.join(os.tmpdir(), `${packet.id}.zip`); await zipDir(dir, out, packet.id); await fs.rm(dir, { recursive: true, force: true });
  return out;
}
