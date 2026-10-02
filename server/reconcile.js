import fs from 'node:fs/promises';
import path from 'node:path';
export async function reconcileStorage(repo) {
  const missing = [], orphans = [];
  for (const p of repo.listProjects()) {
    const art = await repo.artifacts(p.id), refs = new Set();
    function visit(v) { if (typeof v === 'string' && /^(images|uploads)\//.test(v)) refs.add(v); else if (Array.isArray(v)) v.forEach(visit); else if (v && typeof v === 'object') Object.values(v).forEach(visit); }
    for (const a of Object.values(art)) visit(a.content);
    for (const rel of refs) try { await repo.readFile(p.id, rel); } catch { missing.push({ project: p.id, file: rel }); }
  }
  if (repo.s.pool) for (const table of ['artifacts', 'project_blueprints', 'comments', 'review_events']) {
    const { rows } = await repo.s.pool.query(`SELECT DISTINCT project_id FROM ${table} WHERE project_id NOT IN (SELECT id FROM projects)`);
    for (const row of rows) orphans.push({ table, project: row.project_id });
  }
  const root = repo.s.abs?.('projects');
  if (root) for (const entry of await fs.readdir(root, { withFileTypes: true }).catch(() => [])) if (entry.isDirectory() && !repo.getProject(entry.name)) orphans.push({ table: 'files', project: entry.name });
  return { at: Date.now(), missing, orphans, repaired: false, note: 'Inventar fără ștergere sau rescriere automată. Fișierele lipsă trebuie recuperate din backup.' };
}
