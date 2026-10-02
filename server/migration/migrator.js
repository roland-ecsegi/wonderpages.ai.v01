/**
 * P2-T05 — project migration v1 → target (OUTPUT-28 steps 1–2, ADR12).
 *
 *   plan  : read-only dry-run — integrity (reference manifest when present), counts, contract, conflicts, unknown
 *           fields, transforms; the plan is identified by a hash bound to the source archive hash.
 *   run   : requires the plan hash; idempotent per source archive (a second run returns the first result);
 *           imports into a NEW project (original untouched), keeps the raw source, pins every imported version
 *           ("migration"), records conflicts and a migration report; approvals stay pending, nothing autoruns,
 *           missing volumes are NOT generated. Any failure removes the new project (no partial project).
 */
import { readZip, pngSize } from '../security/safe-zip.js';
import { sha256, canonicalHash } from '../domain/canonical.js';
import { contractFromBlueprint, validateContract, validateProjectInput } from '../domain/product-contract.js';
import { canonConflicts } from '../domain/canon.js';
import { rawFingerprints } from './raw-compare.js';
import { dwFindings } from './dw-reference.js';
import { importProject } from '../projectpkg.js';
import { pinVersion, listVersions } from '../persistence/artifact-store.js';
import { now } from '../repo.js';

export const TRANSFORMS = Object.freeze([
  { id: 'T1-raw-retention', what: 'arhiva sursă păstrată byte-identic în raw/ a proiectului nou' },
  { id: 'T2-id-mapping', what: 'ID nou de proiect; cheile artefactelor, numerele de versiune și numele referințelor se păstrează' },
  { id: 'T3-contract-snapshot', what: 'snapshotul de blueprint (inclusiv prompturile personalizate) se păstrează; contractul se validează' },
  { id: 'T4-version-pins', what: 'fiecare versiune importată este fixată „migration”; nu se inventează variante' },
  { id: 'T5-typed-adapter', what: 'câmpurile relative_size JSON-string se parsează într-o proiecție tipizată; valoarea brută rămâne' },
  { id: 'T6-conflict-report', what: 'conflictele de canon și constatările de referință se atașează proiectului, fără rescriere' },
  { id: 'T7-gates-pending', what: 'aprobările se resetează; proiectul intră Pregătit, fără pornire automată' }
]);
const KNOWN_TOP = new Set(['format', 'version', 'exportedAt', 'project', 'blueprint', 'artifacts', 'comments', 'versions', 'dependencies', 'decisions', 'rights', 'contract', 'app']);

function locate(files) {
  const name = [...files.keys()].find(k => /(^|\/)project\.json$/.test(k) && k.split('/').length <= 2);
  if (!name) throw { status: 400, code: 'migration_source', message: 'Arhiva nu conține project.json.' };
  const root = name.includes('/') ? name.slice(0, name.lastIndexOf('/') + 1) : '';
  let doc; try { doc = JSON.parse(files.get(name).toString('utf8')); } catch { throw { status: 400, code: 'migration_source', message: 'project.json nu e JSON valid.' }; }
  return { root, doc };
}
function typedLandmarks(bible) {
  const out = [];
  for (const c of bible?.characters || []) for (const l of c.visual_landmarks || []) {
    const raw = l.relative_size; let parsed = null, status = 'text';
    if (typeof raw === 'string' && /^\s*\{/.test(raw)) { try { parsed = JSON.parse(raw); status = 'parsed'; } catch { status = 'invalid_json'; } }
    else if (raw && typeof raw === 'object') { parsed = raw; status = 'object'; }
    out.push({ character: c.id, landmark: l.id, side: l.side || null, relative_size_raw: raw ?? null, relative_size: parsed, status, geometryVerified: false });
  }
  return out;
}

export function planMigration(buf, { currentBlueprint = null } = {}) {
  const sourceSha = sha256(buf), files = readZip(buf), { root, doc } = locate(files);
  if (doc.format !== 'wonderpages-project' || !doc.project || !doc.blueprint) throw { status: 400, code: 'migration_source', message: 'Nu e un proiect WonderPages.' };
  if (![1, 2].includes(doc.version ?? 1)) throw { status: 400, code: 'unsupported_schema', message: `Format v${doc.version} nesuportat.` };
  const refMan = [...files.keys()].find(k => k === root + 'PROJECT-MANIFEST.json');
  let integrity = { kind: 'none', allMatch: null, entries: [] };
  if (refMan) { const m = JSON.parse(files.get(refMan).toString('utf8')); const entries = (m.files || []).map(f => { const b = files.get(root + f.path); return { path: f.path, present: !!b, bytesMatch: !!b && b.length === f.bytes, sha256Match: !!b && sha256(b) === f.sha256 }; }); integrity = { kind: 'reference-manifest', allMatch: entries.every(e => e.bytesMatch && e.sha256Match), entries }; }
  if (integrity.allMatch === false) throw { status: 400, code: 'integrity_mismatch', message: 'Integritatea sursei nu corespunde manifestului: migrarea se oprește.', integrity };
  const contract = contractFromBlueprint(doc.blueprint), cv = validateContract(contract), iv = validateProjectInput(contract, doc.project.input || {});
  const A = doc.artifacts || {}, series = A.series?.content;
  const counts = { artifacts: Object.keys(A).length, volumes: series?.volumes?.length ?? 0, pagePlans: (series?.volumes || []).reduce((n, v) => n + (v.page_plan?.length || 0), 0), manuscriptPages: Object.keys(A).filter(k => /^script_\d+$/.test(k)).reduce((n, k) => n + (A[k].content?.pages?.length || 0), 0), refs: (doc.project.refs || []).length, approvals: Object.keys(doc.project.approvals || {}).length };
  const refs = (doc.project.refs || []).map(r => { const b = files.get(root + 'files/' + r.file); const px = b ? pngSize(b) : null; return { file: r.file, sha256: b ? sha256(b) : null, pixels: px ? [px.width, px.height] : null }; });
  const conflicts = canonConflicts(doc.blueprint, A, refMan ? dwFindings(doc).filter(f => f.status === 'VERIFIED' && f.id === 'DW01').map(f => ({ ...f, source: 'reference-manifest' })) : []);
  const unknownFields = Object.keys(doc).filter(k => !KNOWN_TOP.has(k));
  const customPrompts = currentBlueprint ? Object.keys({ ...currentBlueprint.prompts, ...doc.blueprint.prompts }).filter(k => canonicalHash(currentBlueprint.prompts?.[k] ?? null) !== canonicalHash(doc.blueprint.prompts?.[k] ?? null)).sort() : null;
  const missingVolumes = Array.from({ length: contract.structure.volumes || 0 }, (_, v) => v).filter(v => !A[`script_${v}`] && !A[`final_${v}`]).map(v => v + 1);
  const body = { sourceSha256: sourceSha, sourceFormat: { format: doc.format, version: doc.version ?? 1 }, originalProjectId: String(doc.project.id || ''), integrity, contract: { valid: cv.valid, errors: cv.errors, input: iv, contractHash: contract.contractHash, blueprintVersion: contract.blueprintVersion }, counts, refs, rawFingerprints: rawFingerprints(doc), conflicts: conflicts.map(c => ({ id: c.id, kind: c.kind, requiresDecision: !!c.requiresDecision })), unknownFields, customPrompts, transforms: TRANSFORMS.map(t => t.id), notGenerated: { volumesWithoutManuscript: missingVolumes, art: Object.keys(A).filter(k => /^ill_/.test(k)).length ? 'parțial' : 'absentă', note: 'Migrarea nu generează conținut lipsă; producția ulterioară trece prin porți.' } };
  if (!cv.valid || !iv.valid) throw { status: 422, code: 'contract_invalid', errors: [...cv.errors, ...iv.errors], message: 'Sursa nu respectă contractul produsului.' };
  return { ...body, planHash: canonicalHash(body), migrationId: 'mig-' + sourceSha.slice(0, 24), dryRun: true };
}

export async function runMigration(repo, storage, buf, { planHash, currentBlueprint = null, faultAt = null } = {}) {
  const plan = planMigration(buf, { currentBlueprint });
  if (planHash !== plan.planHash) throw { status: 409, code: 'plan_conflict', message: 'Planul de migrare nu corespunde sursei; rulează din nou dry-run.' };
  const runRel = `_migrations/${plan.migrationId}.json`, prev = await storage.readJSON(runRel, null);
  if (prev?.status === 'committed' && repo.getProject(prev.projectId)) return { ...prev, alreadyMigrated: true };
  let pid = null;
  try {
    const p = await importProject(repo, storage, buf); pid = p.id;
    if (faultAt === 'after-import') throw { code: 'migration_fault', message: 'Eroare simulată după import.' };
    await storage.writeFile(`projects/${pid}/raw/source-${plan.sourceSha256.slice(0, 16)}.zip`, buf);   // T1
    const art = await repo.artifacts(pid);
    for (const [k, a] of Object.entries(art)) for (const v of await listVersions(storage, pid, k)) await pinVersion(storage, pid, k, v.version, { reason: 'migration', ref: { migration: plan.migrationId, originalVersion: a.version }, actor: 'migration' });   // T4
    if (faultAt === 'after-pins') throw { code: 'migration_fault', message: 'Eroare simulată după fixarea versiunilor.' };
    if (art.bible) await repo.writeArtifact(pid, 'canon_typed', { sourceKey: 'bible', sourceVersion: art.bible.version, sourceHash: canonicalHash(art.bible.content), landmarks: typedLandmarks(art.bible.content) }, { by: 'migration', note: 'Proiecție tipizată (T5); valorile brute rămân în bible' });
    const files = readZip(buf), { doc } = locate(files);
    const findings = dwFindings(doc).filter(f => f.status === 'VERIFIED' && ['DW01'].includes(f.id) && plan.integrity.kind === 'reference-manifest').map(f => ({ id: f.id, title: f.title, evidence: f.evidence, source: 'reference-manifest' }));
    const after = await repo.artifacts(pid);
    const report = {
      migrationId: plan.migrationId, at: now(), source: { sha256: plan.sourceSha256, format: plan.sourceFormat, originalProjectId: plan.originalProjectId }, target: { projectId: pid, schema: storage.migrationStatus?.schemaVersion ?? null },
      idMapping: { [plan.originalProjectId || '(fără id)']: pid },
      preserved: Object.keys(plan.rawFingerprints.artifacts).map(k => ({ key: k, status: after[k] && canonicalHash(after[k].content) === plan.rawFingerprints.artifacts[k] ? 'identical' : 'changed', version: after[k]?.version ?? null })),
      refs: plan.refs.map(r => ({ ...r, status: 'identical' })), prompts: { customPrompts: plan.customPrompts, blueprintIdentical: canonicalHash(await repo.getBlueprint(pid)) === plan.rawFingerprints.blueprint },
      repaired: [], new: ['canon_typed', 'migration_report', 'versiuni fixate (migration)', 'raw/source'], revalidate: ['scenariile existente: critică și continuitate înaintea aprobării', 'referințele vizuale: atlas/unghiuri lipsă rămân propuse'],
      conflicts: plan.conflicts, findings, unknownFields: plan.unknownFields, notGenerated: plan.notGenerated, approvals: 'resetate (pending)', counts: plan.counts, transforms: TRANSFORMS
    };
    report.lost = report.preserved.filter(x => x.status !== 'identical').length;
    if (report.lost) throw { code: 'migration_loss', message: `Migrarea ar modifica ${report.lost} artefacte: oprire.`, report };
    await repo.writeArtifact(pid, 'migration_report', report, { by: 'migration', note: 'Raport de migrare ' + plan.migrationId });
    await repo.patchProject(pid, { canonFindings: findings, migration: { id: plan.migrationId, sourceSha256: plan.sourceSha256, at: report.at } });
    const run = { id: plan.migrationId, status: 'committed', projectId: pid, planHash: plan.planHash, sourceSha256: plan.sourceSha256, transforms: plan.transforms, counts: plan.counts, at: now() };
    await storage.writeJSON(runRel, run);
    return { ...run, report };
  } catch (e) {
    if (pid) { try { await repo.deleteProject(pid); } catch (x) { console.warn('[migration rollback]', x?.message || x); } }
    await storage.writeJSON(runRel, { id: plan.migrationId, status: 'failed', planHash: plan.planHash, sourceSha256: plan.sourceSha256, error: String(e?.message || e).slice(0, 300), at: now() }).catch(() => {});
    throw e;
  }
}
export async function listMigrations(storage) { const out = []; for (const f of (await storage.list('_migrations').catch(() => [])).filter(x => x.name.endsWith('.json'))) { const d = await storage.readJSON(`_migrations/${f.name}`, null); if (d) out.push(d); } return out.sort((a, b) => b.at - a.at); }
