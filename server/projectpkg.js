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
import { listVersions, backfillVersions, versionDoc } from './persistence/artifact-store.js';
import { fileHash } from './contracts.js';
import { APP_VERSION } from './config.js';
import { SCHEMA_VERSION } from './persistence/migrations.js';
import { canonicalHash } from './domain/canonical.js';

const FORMAT = 'wonderpages-project';
async function copyDir(a, b) { await fsp.mkdir(b, { recursive: true }); for (const e of await fsp.readdir(a, { withFileTypes: true }).catch(() => [])) { const x = path.join(a, e.name), y = path.join(b, e.name); if (e.isDirectory()) await copyDir(x, y); else await fsp.copyFile(x, y); } }
/* P2-T05: package v2 = superset of v1 (same project.json fields, so a v04 importer still reads it) plus the immutable
   version history, typed lineage edges, decisions as evidence, rights, raw migration sources and a checksummed manifest. */
export async function exportProject(repo, storage, p) {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'wonderpages-export-'));
  const art = await repo.artifacts(p.id);
  const versions = {};
  for (const [k, a] of Object.entries(art)) { await backfillVersions(storage, p.id, k, a).catch(() => 0); versions[k] = (await listVersions(storage, p.id, k)).map(v => ({ version: v.version, hash: v.hash, content: v.content, meta: v.meta, basedOn: v.basedOn, by: v.by, note: v.note, at: v.at, pins: v.pins, restoredFrom: v.restoredFrom || null, source: v.source || null, annotatedHash: v.annotatedHash || null, annotations: v.annotations || [] })); }
  const dependencies = []; for (const f of (await storage.list(`projects/${p.id}/dependencies`).catch(() => [])).filter(x => x.name.endsWith('.json'))) { const d = await storage.readJSON(`projects/${p.id}/dependencies/${f.name}`, null); if (d) dependencies.push(d); }
  const decisions = await repo.listDecisions?.(p.id).catch(() => []) || [];
  const doc = { format: FORMAT, version: 2, exportedAt: now(), app: { version: APP_VERSION, schema: SCHEMA_VERSION },
    project: { ...p, running: undefined, pausing: undefined, rendering: undefined },
    blueprint: await repo.getBlueprint(p.id),
    artifacts: Object.fromEntries(Object.entries(art).map(([k, a]) => [k, { content: a.content, meta: a.meta, version: a.version, note: a.note, by: a.by, basedOn: a.basedOn ?? null, stage: a.stage || '', updatedAt: a.updatedAt || null }])),
    comments: await repo.listComments(p.id), versions, dependencies, decisions, rights: p.rightsDeclared || [], contract: p.contractRef || null };
  await fsp.writeFile(path.join(tmp, 'project.json'), JSON.stringify(doc, null, 1));
  const src = storage.abs ? storage.abs(`projects/${p.id}`) : null;
  for (const sub of ['images', 'uploads', 'raw']) if (src && fs.existsSync(path.join(src, sub))) await copyDir(path.join(src, sub), path.join(tmp, 'files', sub));
  const listed = []; (function walk(d, rel) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const a = path.join(d, e.name), r = rel ? `${rel}/${e.name}` : e.name; if (e.isDirectory()) walk(a, r); else { const b = fs.readFileSync(a); listed.push({ path: r, bytes: b.length, sha256: fileHash(b) }); } } })(tmp, '');
  await fsp.writeFile(path.join(tmp, 'manifest.json'), JSON.stringify({ format: FORMAT, version: 2, exportedAt: doc.exportedAt, app: doc.app, contract: doc.contract, counts: { artifacts: Object.keys(art).length, versions: Object.values(versions).reduce((n, l) => n + l.length, 0), dependencies: dependencies.length, decisions: decisions.length }, files: listed }, null, 1));
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
  if (![1, 2].includes(doc.version ?? 1)) throw { status: 400, code: 'unsupported_schema', message: `Formatul pachetului (v${doc.version}) nu este suportat de această versiune a aplicației.` };   // P2-T05
  const manName2 = root + 'manifest.json', manifest = files.get(manName2) ? (() => { try { return JSON.parse(files.get(manName2).toString('utf8')); } catch { throw { status: 400, code: 'package_corrupt', message: 'manifest.json nu e JSON valid.' }; } })() : null;
  if (doc.version === 2 && !manifest) throw { status: 400, code: 'package_corrupt', message: 'Pachetul v2 nu are manifest.' };
  if (manifest) for (const f of manifest.files || []) { const b = files.get(root + f.path); if (!b) throw { status: 400, code: 'package_missing_file', message: `Pachet incomplet: lipsește ${f.path}.` }; if (b.length !== f.bytes || fileHash(b) !== f.sha256) throw { status: 400, code: 'package_corrupt', message: `Pachet deteriorat: ${f.path} nu corespunde sumei de control.` }; }
  const bad = blueprintProblem(doc.blueprint); if (bad) throw { status: 400, message: 'Proiect respins: ' + bad + '.' };
  /* P1-T01: the protected ProductContract (6 volumes × story+coloring × 12 pages, age bands) is checked before anything is written */
  const contract = contractFromBlueprint(doc.blueprint), cv = validateContract(contract);
  if (!cv.valid) throw { status: 422, code: 'contract_invalid', errors: cv.errors, message: 'Proiect respins: nu respectă contractul produsului — ' + cv.errors.map(e => e.message).join(' ') };
  const pid = uid('p'); const src = doc.project; const bp = doc.blueprint;
  /* files: only images/ and uploads/ with plain names, only image formats */
  const kept = new Set(), rejectedFiles = [];
  /* P2-T05: assets referenced by the project must be in a v2 package (a v1 package only warns, as before) */
  const referenced = new Set(); (function visit(v) { if (typeof v === 'string' && /^(images|uploads)\/[A-Za-z0-9._-]+$/.test(v)) referenced.add(v); else if (Array.isArray(v)) v.forEach(visit); else if (v && typeof v === 'object') Object.values(v).forEach(visit); })([doc.artifacts, doc.project?.refs]);
  const missingAssets = [...referenced].filter(r => !files.get(root + 'files/' + r));
  if (doc.version === 2 && missingAssets.length) throw { status: 400, code: 'package_missing_asset', message: `Pachet incomplet: lipsesc ${missingAssets.length} fișiere (${missingAssets.slice(0, 3).join(', ')}).` };
  try {
  for (const [name, data] of files) {
    if (!data || !name.startsWith(root + 'files/')) continue;
    const rawRel = path.posix.normalize(name.slice((root + 'files/').length));
    if (/^raw\/[A-Za-z0-9._-]{1,160}$/.test(rawRel)) { await storage.writeFile(`projects/${pid}/${rawRel}`, data); continue; }   // P2-T05: raw migration source, never served
    const rel = rawRel;
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
    importedAt: now(), createdAt: now(), updatedAt: now(), source: { kind: 'import', original: src.source?.kind ? str(src.source.kind, 20) : null, at: now() },   // P4-T01: shown as an existing source
    importedEvidence: { decisions: (Array.isArray(src.decisions) ? src.decisions : []).slice(-200).map(d => ({ gate: str(d?.gate, 60), vol: Number.isInteger(d?.vol) ? d.vol : null, decision: str(d?.decision, 40), at: Number(d?.at) || null })), approvals: Object.keys(src.approvals || {}).length, authority: 'none', note: 'Evidență istorică din arhivă; aprobările locale se refac.' },   // P2-T04
    log: [{ t: now(), text: `Proiect importat${Object.keys(stages).length ? ` cu ${Object.keys(stages).length} etape deja lucrate` : ''}. Toate aprobările se refac de către tine: fiecare poartă se redeschide când ajunge lucrul la ea.`, kind: 'info' }]
  };
  await repo.createProject(p, bp);
  for (const [k, a] of Object.entries(doc.artifacts || {})) {
    if (!/^[a-z0-9_]{1,40}$/i.test(k) || !a || typeof a !== 'object') continue;
    await repo.writeArtifact(pid, k, a.content ?? null, { meta: a.meta && typeof a.meta === 'object' ? a.meta : {}, note: 'importat', by: 'import', versionOverride: Number.isInteger(a.version) && a.version >= 1 && a.version < 1e6 ? a.version : undefined, ...(doc.version === 2 && a.basedOn && typeof a.basedOn === 'object' ? { basedOn: { key: str(a.basedOn.key, 40), version: Number.isInteger(a.basedOn.version) ? a.basedOn.version : null, pageHash: a.basedOn.pageHash ? str(a.basedOn.pageHash, 80) : undefined } } : {}) });   // P2-T05: original version numbers and lineage kept
  }
  if (Array.isArray(doc.comments) && doc.comments.length) {
    const list = await repo.listComments(pid);
    for (const c of doc.comments.slice(0, 500)) if (c && typeof c === 'object') list.push({ id: uid('c'), createdAt: now(), status: ['open', 'resolved', 'addressed'].includes(c.status) ? c.status : 'open', ...cleanComment(c) });
    await repo.saveComments(pid);
  }
  if (rejectedFiles.length) await repo.patchProject(pid, { log: [...p.log, { t: now(), text: `${rejectedFiles.length} fișiere respinse la import: conținutul nu corespunde tipului declarat (${rejectedFiles.slice(0, 5).join(', ')}).`, kind: 'warn' }] });
  /* P2-T05: v2 history is imported as retained history (pin "migration"); original pins/decisions become evidence, never local authority */
  if (doc.version === 2) {
    for (const [k, list] of Object.entries(doc.versions || {})) {
      if (!/^[a-z0-9_]{1,40}$/i.test(k) || !Array.isArray(list)) continue;
      const cur = (await repo.artifacts(pid))[k]?.version;
      for (const v of list.slice(-500)) if (Number.isInteger(v?.version) && v.version >= 1 && v.version < 1e6) { const vd = versionDoc(k, { version: v.version, content: v.content ?? null, meta: v.meta || {}, basedOn: v.basedOn ?? null, by: v.by, note: v.note, updatedAt: v.at }, { source: 'import-v2', pinned: true, pins: [{ reason: 'migration', ref: { originalPins: (v.pins || []).map(x => x?.reason).filter(Boolean) }, actor: 'import', at: now() }], importedFrom: { version: v.version, hash: v.hash ?? null }, restoredFrom: v.restoredFrom || undefined }); if (v.hash && vd.hash !== v.hash) throw { status: 400, code: 'package_corrupt', message: `Versiunea ${k}@${v.version} nu corespunde amprentei sale.` }; if (v.version === cur) { const c = await storage.readJSON(`projects/${pid}/versions/${k}/${cur}.json`, null); if (c && c.hash !== (v.annotatedHash || vd.hash)) throw { status: 400, code: 'package_corrupt', message: `Versiunea curentă ${k}@${cur} diferă de istoric.` }; continue; } await storage.writeJSON(`projects/${pid}/versions/${k}/${v.version}.json`, vd); }
    }
    for (const d of (doc.dependencies || []).slice(0, 5000)) if (d?.id && /^[A-Za-z0-9_@.-]{1,80}$/.test(d.id)) await storage.writeJSON(`projects/${pid}/dependencies/${d.id}.json`, { ...d, imported: true });
    await repo.patchProject(pid, { importedEvidence: { ...p.importedEvidence, decisionRecords: (doc.decisions || []).slice(-500).map(d => ({ id: str(d?.id, 40), kind: str(d?.kind, 30), state: str(d?.state, 30), actor: str(d?.actor, 40), at: Number(d?.at) || null })) }, rightsDeclared: Array.isArray(doc.rights) ? doc.rights.slice(0, 500) : [] });
  }
  if (missingAssets.length) await repo.patchProject(pid, { log: [...(repo.getProject(pid).log || []), { t: now(), text: `Pachet v1: ${missingAssets.length} fișiere referite lipsesc din arhivă (${missingAssets.slice(0, 3).join(', ')}).`, kind: 'warn' }] });
  await repo.logEvent(pid, 'import', { from: str(src.id, 60), title: p.title, version: doc.version ?? 1 });
  return p;
  } catch (e) { await rollbackImport(repo, storage, pid); throw e; }   // P2-T05: an error never leaves a partial project
}
async function rollbackImport(repo, storage, pid) { try { if (repo.getProject(pid)) await repo.deleteProject(pid); else await storage.deleteProject?.(pid) ?? storage.remove(`projects/${pid}`); } catch (e) { console.warn('[import rollback]', e?.message || e); } }
