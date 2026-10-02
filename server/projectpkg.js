/**
 * Export / import de proiect: tot proiectul (date, documente cu versiuni, aprobări, fișiere) într-o singură arhivă.
 * Folosit pentru backup, mutare pe alt calculator și proiecte pregătite, importate separat.
 * La import, proiectul intră „Pregătit”: nu pornește singur; etapele lucrate se păstrează, dar toate aprobările se refac.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { zipDir } from './output.js';
import { unzip } from './training.js';
import { uid, now } from './repo.js';
import { expandStages, HANDLER_NAMES } from './engine.js';
import { str, cleanInput, isSafeRel, IMAGE_MIME, safeCode, cleanComment } from './sanitize.js';
import { contractFromBlueprint, validateContract } from './domain/product-contract.js';
import { sniffImage } from './security/safe-zip.js';

const FORMAT = 'wonderpages-project';
async function copyDir(a, b) { await fsp.mkdir(b, { recursive: true }); for (const e of await fsp.readdir(a, { withFileTypes: true }).catch(() => [])) { const x = path.join(a, e.name), y = path.join(b, e.name); if (e.isDirectory()) await copyDir(x, y); else await fsp.copyFile(x, y); } }
export async function exportProject(repo, storage, p) {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'wonderpages-export-'));
  const art = await repo.artifacts(p.id);
  const doc = { format: FORMAT, version: 1, exportedAt: now(), project: { ...p, running: undefined, pausing: undefined, rendering: undefined }, blueprint: await repo.getBlueprint(p.id), artifacts: Object.fromEntries(Object.entries(art).map(([k, a]) => [k, { content: a.content, meta: a.meta, version: a.version, note: a.note, by: a.by }])), comments: await repo.listComments(p.id) };
  await fsp.writeFile(path.join(tmp, 'project.json'), JSON.stringify(doc, null, 1));
  const src = storage.abs ? storage.abs(`projects/${p.id}`) : null;
  for (const sub of ['images', 'uploads']) if (src && fs.existsSync(path.join(src, sub))) await copyDir(path.join(src, sub), path.join(tmp, 'files', sub));
  const name = `${(safeCode(p.code) || 'wp')}-${String(p.title || 'proiect').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 50)}-proiect`;
  const out = path.join(os.tmpdir(), `${name}.zip`); await zipDir(tmp, out, name);
  fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
  return out;
}
/* Import (audit C1): only known fields are taken from the archive. The code, the state, the approvals and the
   decisions are never trusted: the project enters "Pregătit", every approval gate opens again for YOU, and
   finished production stages are kept (marked "imported") so the content is not generated a second time. */
const blueprintProblem = bp => {
  if (!bp || typeof bp !== 'object') return 'lipsește tipul de produs';
  if (!/^[a-z0-9-]{2,40}$/.test(bp.slug || '')) return 'tipul de produs are un identificator invalid';
  const S = bp.structure || {};
  if (!(Number.isInteger(S.volumes) && S.volumes >= 1 && S.volumes <= 24 && Number.isInteger(S.pages) && S.pages >= 1 && S.pages <= 60)) return 'structura tipului de produs e invalidă';
  if (!Array.isArray(bp.stages) || !bp.stages.length || bp.stages.some(s => !s || !HANDLER_NAMES.includes(s.handler) || !/^[a-z0-9_-]{1,40}$/i.test(s.key || ''))) return 'etapele tipului de produs sunt invalide';
  return null;
};
export async function importProject(repo, storage, buf) {
  const files = unzip(buf);
  const manName = [...files.keys()].find(k => /(^|\/)project\.json$/.test(k) && k.split('/').length <= 2);
  if (!manName) throw { status: 400, message: 'Arhiva nu conține project.json.' };
  const root = manName.includes('/') ? manName.slice(0, manName.lastIndexOf('/') + 1) : '';
  let doc; try { doc = JSON.parse(files.get(manName).toString('utf8')); } catch { throw { status: 400, message: 'project.json nu e JSON valid.' }; }
  if (doc.format !== FORMAT || !doc.project || typeof doc.project !== 'object' || !doc.blueprint) throw { status: 400, message: 'Nu e un proiect WonderPages.' };
  const bad = blueprintProblem(doc.blueprint); if (bad) throw { status: 400, message: 'Proiect respins: ' + bad + '.' };
  /* P1-T01: the protected ProductContract (6 volumes × story+coloring × 12 pages, age bands) is checked before anything is written */
  const contract = contractFromBlueprint(doc.blueprint), cv = validateContract(contract);
  if (!cv.valid) throw { status: 422, code: 'contract_invalid', errors: cv.errors, message: 'Proiect respins: nu respectă contractul produsului — ' + cv.errors.map(e => e.message).join(' ') };
  const pid = uid('p'); const src = doc.project; const bp = doc.blueprint;
  /* files: only images/ and uploads/ with plain names, only image formats */
  const kept = new Set(), rejectedFiles = [];
  for (const [name, data] of files) {
    if (!data || !name.startsWith(root + 'files/')) continue;
    const rel = path.posix.normalize(name.slice((root + 'files/').length));
    if (!isSafeRel(rel) || rel.startsWith('exports/') || !IMAGE_MIME[path.extname(rel).toLowerCase()]) continue;
    if (sniffImage(data) !== IMAGE_MIME[path.extname(rel).toLowerCase()]) { rejectedFiles.push(rel); continue; }   // P1-T04: declared type must match the bytes
    await storage.writeFile(`projects/${pid}/${rel}`, data); kept.add(rel);
  }
  /* progress: finished work stages are kept as "imported" (skipped at start); approval gates are never kept */
  const plan = expandStages(bp); const stages = {}; let stageIndex = 0; let firstGate = -1;
  plan.forEach((s, i) => { if (s.handler === 'review_gate' && firstGate < 0) firstGate = i; });
  const doneBefore = Number.isInteger(src.stageIndex) ? Math.max(0, Math.min(src.stageIndex, plan.length)) : 0;
  plan.forEach((s, i) => {
    const was = src.stages?.[s.key];
    if (i < doneBefore && s.handler !== 'review_gate' && ['done', 'skipped'].includes(was?.status)) stages[s.key] = { status: was.status, imported: true, finishedAt: now() };
  });
  const refs = (Array.isArray(src.refs) ? src.refs : []).filter(r => r && isSafeRel(r.file) && kept.has(r.file) && /^image\/(png|jpeg|webp)$/.test(r.mime || '')).slice(0, 6).map(r => ({ file: r.file, name: str(r.name, 120), mime: r.mime }));
  const title0 = str(src.title, 160).trim() || 'Proiect importat';
  const taken = repo.listProjects().some(x => x.title === title0);
  const opts = src.options && typeof src.options === 'object' ? src.options : {};
  const p = {
    id: pid, title: taken ? `${title0} (importat)` : title0,
    typeSlug: bp.slug, typeName: str(bp.name || src.typeName, 120), typeIcon: str(bp.icon || src.typeIcon, 8), typeVersion: bp.version ?? src.typeVersion ?? null, variantLabel: str(src.variantLabel, 60),
    input: cleanInput(src.input),
    options: { ...Object.fromEntries(Object.entries(opts).filter(([k, v]) => /^[a-z_]{1,30}$/.test(k) && typeof v === 'boolean')), image_engine: ['canva', 'chatgpt'].includes(opts.image_engine) ? opts.image_engine : 'canva' },
    status: 'ready', stageIndex, stages, currentStage: null, run: 1,
    stagePlan: plan.map(s => ({ key: s.key, label: str(s.label, 120), phase: str(s.phase, 40), gate: s.handler === 'review_gate', vol: s.vol ?? null })), volumeFlow: !!bp.volume_flow,
    gate: null, decisions: [], approvals: {}, notes: (Array.isArray(src.notes) ? src.notes : []).filter(x => typeof x === 'string').slice(0, 50).map(x => x.slice(0, 2000)),
    rejections: [], refs, error: null, resumeAt: null, pausing: false, rendering: null, delivered: {},
    importedAt: now(), createdAt: now(), updatedAt: now(),
    importedEvidence: { decisions: (Array.isArray(src.decisions) ? src.decisions : []).slice(-200).map(d => ({ gate: str(d?.gate, 60), vol: Number.isInteger(d?.vol) ? d.vol : null, decision: str(d?.decision, 40), at: Number(d?.at) || null })), approvals: Object.keys(src.approvals || {}).length, authority: 'none', note: 'Evidență istorică din arhivă; aprobările locale se refac.' },   // P2-T04
    log: [{ t: now(), text: `Proiect importat${Object.keys(stages).length ? ` cu ${Object.keys(stages).length} etape deja lucrate` : ''}. Toate aprobările se refac de către tine: fiecare poartă se redeschide când ajunge lucrul la ea.`, kind: 'info' }]
  };
  await repo.createProject(p, bp);
  for (const [k, a] of Object.entries(doc.artifacts || {})) {
    if (!/^[a-z0-9_]{1,40}$/i.test(k) || !a || typeof a !== 'object') continue;
    await repo.writeArtifact(pid, k, a.content ?? null, { meta: a.meta && typeof a.meta === 'object' ? a.meta : {}, note: 'importat', by: 'import' });
  }
  if (Array.isArray(doc.comments) && doc.comments.length) {
    const list = await repo.listComments(pid);
    for (const c of doc.comments.slice(0, 500)) if (c && typeof c === 'object') list.push({ id: uid('c'), createdAt: now(), status: ['open', 'resolved', 'addressed'].includes(c.status) ? c.status : 'open', ...cleanComment(c) });
    await repo.saveComments(pid);
  }
  if (rejectedFiles.length) await repo.patchProject(pid, { log: [...p.log, { t: now(), text: `${rejectedFiles.length} fișiere respinse la import: conținutul nu corespunde tipului declarat (${rejectedFiles.slice(0, 5).join(', ')}).`, kind: 'warn' }] });
  await repo.logEvent(pid, 'import', { from: str(src.id, 60), title: p.title });
  return p;
}
