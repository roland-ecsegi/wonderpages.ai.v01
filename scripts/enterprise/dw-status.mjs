#!/usr/bin/env node
/**
 * P8-T05 — Dinosaur World: executable status of the real upgrade, on a COPY (the original archive is read-only).
 *   node scripts/enterprise/dw-status.mjs [--out=docs/enterprise/migration/DW-P8-STATUS.json]
 * Runs the implemented path that needs no provider and no decision: dry-run plan → migration into a disposable
 * installation → reconciliation report → pilot gate → approvals. Everything after that needs a verified real provider
 * (or the manual exchange) and the operator's creative decisions; those are listed as blockers, never simulated.
 * Mock outputs are not DW production evidence and are never reported as such.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LocalStorage } from '../../server/storage/local.js';
import { applyMigrations } from '../../server/persistence/migrations.js';
import { Repo } from '../../server/repo.js';
import { planMigration, runMigration } from '../../server/migration/migrator.js';
import { reconcileReport } from '../../server/migration/dw-reconcile.js';
import { generationAllowed } from '../../server/domain/pilot.js';
import { exportProject, importProject } from '../../server/projectpkg.js';
import { canonicalHash } from '../../server/domain/canonical.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DW_ZIP = path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

export async function dwStatus({ zip = DW_ZIP, providerVerified = false } = {}) {
  if (!fs.existsSync(zip)) return { status: 'NOT_RUN', reason: 'Arhiva de referință DW lipsește din această copie.' };
  const before = sha(fs.readFileSync(zip)), buf = fs.readFileSync(zip), work = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-dw-status-'));
  try {
    const plan = planMigration(buf);
    const s = new LocalStorage(path.join(work, 'data')); await s.init(); await applyMigrations(s); const repo = new Repo(s); await repo.load();
    const run = await runMigration(repo, s, buf, { planHash: plan.planHash });
    const p = repo.getProject(run.projectId), art = await repo.artifacts(run.projectId), bp = await repo.getBlueprint(run.projectId);
    const rec = reconcileReport(art), report = art.migration_report?.content || {};
    const vols = bp.structure?.volumes || 6, pilot = Array.from({ length: vols }, (_, v) => ({ volume: v + 1, allowed: generationAllowed(bp, p, { vol: v, handler: 'canva_images' }).allowed }));
    const contentDone = Array.from({ length: vols }, (_, v) => ({ volume: v + 1, script: !!art[`script_${v}`], final: !!art[`final_${v}`], illustrations: Array.from({ length: (bp.structure?.pages || 12) + 1 }, (_, pg) => !!art[`ill_${v}_${pg}`]?.content?.color).filter(Boolean).length }));
    const blockers = [
      ...rec.conflicts.map(c => ({ kind: 'operator_decision', id: c.id, what: c.title, options: c.options || null, recommended: c.recommended || null })),
      { kind: 'operator_decision', id: 'GATES', what: 'Aprobarea canonului, a textului și a demo-ului (porțile de revizuire) — decizii creative ale operatorului.' },
      ...(providerVerified ? [] : [{ kind: 'provider', id: 'PROVIDER', what: 'Un furnizor real verificat (Claude Pro / Canva Pro în aplicația operatorului) sau schimbul manual pentru ieșirile V1; în această sesiune nu există furnizor real verificat.' }]),
      { kind: 'operator_decision', id: 'PILOT', what: 'Acceptarea pilotului V1 deblochează V2–6 (P4-T05).' },
      { kind: 'production', id: 'V2-6', what: 'Volumele 2–6 cu toate edițiile (EN+RO) și colorat, apoi QA de colecție și verificările de release.' }
    ];
    const after = sha(fs.readFileSync(zip));
    return {
      schema: 'wonderpages.dw-status/1', at: new Date().toISOString(), status: 'BLOCKED',
      original: { sha256: before, unchanged: before === after },
      migration: { id: run.migrationId, status: run.status, preserved: (report.preserved || []).filter(x => x.status === 'identical').length, changed: (report.preserved || []).filter(x => x.status !== 'identical').length, new: report.new || [], findings: (report.findings || []).map(f => f.id), lost: report.lost ?? null, approvals: Object.keys(p.approvals || {}).length },
      reconcile: rec.conflicts.map(c => ({ id: c.id, options: c.options || null, recommended: c.recommended || null })),
      pilotGate: pilot, content: contentDone,
      blockers, acceptance: { contentComplete: false, editionsChosen: false, gatesPassed: false, operatorAccepted: false, printReadiness: 'necunoscută (nicio probă fizică)' },
      note: 'Calea software fără furnizor și fără decizii rulează integral; producția reală DW (V1 pilot, V2–6, ediții, colorat) rămâne blocată de furnizor + deciziile operatorului. Ieșirile simulate nu sunt dovezi DW.'
    };
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
}

/**
 * P8-T06 — the upgraded DW package round trip: migrated project → Enterprise package (v2) → import into a second, fresh
 * installation → every artifact identical (content hash), the raw original source identical, versions kept, approvals
 * pending (an import never carries authority over), a new project id. No art exists yet, so no before/after claim.
 */
export async function dwRoundtrip({ zip = DW_ZIP } = {}) {
  if (!fs.existsSync(zip)) return { status: 'NOT_RUN' };
  const buf = fs.readFileSync(zip), work = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-dw-rt-'));
  try {
    const mk = async name => { const st = new LocalStorage(path.join(work, name)); await st.init(); await applyMigrations(st); const r = new Repo(st); await r.load(); return { st, r }; };
    const A = await mk('a'), plan = planMigration(buf), run = await runMigration(A.r, A.st, buf, { planHash: plan.planHash });
    const pa = A.r.getProject(run.projectId), artA = await A.r.artifacts(pa.id), pkg = await exportProject(A.r, A.st, pa);
    const B = await mk('b'), pb = await importProject(B.r, B.st, fs.readFileSync(pkg)), artB = await B.r.artifacts(pb.id);
    const keys = [...new Set([...Object.keys(artA), ...Object.keys(artB)])].sort();
    const diff = keys.filter(k => canonicalHash(artA[k]?.content ?? null) !== canonicalHash(artB[k]?.content ?? null));
    const rawA = (await A.st.list(`projects/${pa.id}/raw`)).map(f => f.name), rawB = (await B.st.list(`projects/${pb.id}/raw`).catch(() => [])).map(f => f.name);
    const rawSame = rawA.length > 0 && rawA.every(n => rawB.includes(n)) && await Promise.all(rawA.map(async n => sha(await A.st.readFile(`projects/${pa.id}/raw/${n}`)) === sha(await B.st.readFile(`projects/${pb.id}/raw/${n}`).catch(() => Buffer.alloc(0))))).then(x => x.every(Boolean));
    fs.rmSync(pkg, { force: true });
    return { status: !diff.length && rawSame ? 'PASS' : 'FAIL', artifacts: keys.length, changed: diff, rawSourceIdentical: rawSame, newProjectId: pb.id !== pa.id, approvalsAfterImport: Object.keys(pb.approvals || {}).length, statusAfterImport: pb.status, lost: diff.length };
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const r = await dwStatus(); r.roundtrip = await dwRoundtrip(); const out = process.argv.find(x => x.startsWith('--out='))?.slice(6);
  if (out) fs.writeFileSync(path.resolve(out), JSON.stringify(r, null, 2) + '\n');
  console.log(`${r.status}: original neschimbat ${r.original?.unchanged}; migrare ${r.migration?.status} (păstrate ${r.migration?.preserved}, schimbate ${r.migration?.changed}); blocaje: ${(r.blockers || []).map(b => b.id).join(', ')}; pachet dus-întors ${r.roundtrip?.status} (${r.roundtrip?.artifacts} artefacte, pierdute ${r.roundtrip?.lost})`);
}
