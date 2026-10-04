/**
 * P8-T04 — disk admission. Production writes images, PDFs, versions and backups; starting (or continuing into the next
 * stage) with too little free space would fail halfway with a cryptic error. A project starts only when every data/output
 * folder has at least the configured free space (default 2 GB; Setări or WP_MIN_FREE_MB); during a run the check repeats
 * before each stage and the run pauses gracefully when space runs low. Unknown free space (no statfs) never blocks.
 */
import fs from 'node:fs';
let MIN_FREE_MB = Number(process.env.WP_MIN_FREE_MB) || 2048;
export const minFreeMb = () => MIN_FREE_MB;
export function setMinFreeMb(mb) { const n = Number(mb); if (!Number.isFinite(n) || n < 0 || n > 10 * 1024 * 1024) throw { status: 400, message: 'Spațiu minim invalid (MB).' }; MIN_FREE_MB = Math.round(n); return MIN_FREE_MB; }
export function diskStatus(dirs) {
  const out = [];
  for (const [label, dir] of Object.entries(dirs)) { if (!dir) continue; let freeMb = null; try { fs.mkdirSync(dir, { recursive: true }); const s = fs.statfsSync(dir); freeMb = Math.floor(s.bavail * s.bsize / 1048576); } catch {} out.push({ label, freeMb }); }
  return out;
}
export function admissionCheck(dirs, { min = MIN_FREE_MB } = {}) {
  const disks = diskStatus(dirs), low = disks.filter(d => d.freeMb != null && d.freeMb < min);
  return { ok: !low.length, minFreeMb: min, disks, low,
    message: low.length ? `Spațiu liber insuficient: ${low.map(d => `${d.label} ${(d.freeMb / 1024).toFixed(1)} GB`).join(', ')} (minim ${(min / 1024).toFixed(1)} GB). Eliberează spațiu sau mută folderul fișierelor finale, apoi reia.` : null };
}
export function assertAdmission(dirs) { const a = admissionCheck(dirs); if (!a.ok) throw { status: 409, code: 'disk_low', message: a.message, admission: a }; return a; }
