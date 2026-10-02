import fs from 'node:fs/promises';
import path from 'node:path';
import { deliveryFingerprint } from './delivery.js';
import { fileHash, fingerprint } from './contracts.js';
import { projectFolder } from './output.js';
export async function checkedPackage(repo, project, volume, { final = false } = {}) {
  const root = projectFolder(project), folder = volume == null ? path.join(root, 'Collection-Final') : path.join(root, 'Volumul-' + String(volume + 1).padStart(2, '0'));
  let manifest;
  try { manifest = JSON.parse(await fs.readFile(path.join(folder, 'manifest.json'), 'utf8')); }
  catch { throw { status: 409, message: 'Generează mai întâi pachetul curent.' }; }
  const bp = await repo.getBlueprint(project.id), art = await repo.artifacts(project.id);
  if (manifest.project !== project.id || (final && manifest.kind !== 'final') || !manifest.volumes?.length || manifest.volumes.some(v => v.fingerprint !== deliveryFingerprint(project, bp, art, v.volume - 1))) throw { status: 409, message: 'Pachetul este incomplet sau depășit. Regenerează livrarea.' };
  for (const pdf of manifest.PDFs || []) {
    const name = path.basename(pdf.name);
    const data = await fs.readFile(path.join(folder, ...(volume == null ? ['PDF'] : []), name));
    if (fileHash(data) !== pdf.sha256) throw { status: 409, message: 'Un PDF din pachet a fost modificat.' };
  }
  const zip = volume == null ? root + '.zip' : folder + '.zip';
  const receipt = JSON.parse(await fs.readFile(zip + '.receipt.json', 'utf8').catch(() => { throw { status: 409, message: 'Regenerează pachetul pentru verificarea arhivei.' }; }));
  if (receipt.manifest !== fingerprint(manifest) || receipt.sha256 !== fileHash(await fs.readFile(zip))) throw { status: 409, message: 'Arhiva nu corespunde manifestului curent.' };
  for (const item of receipt.files || []) if (fileHash(await fs.readFile(path.join(folder, item.name))) !== item.sha256) throw { status: 409, message: 'Un fișier livrat a fost modificat; regenerează pachetul.' };
  return zip;
}
