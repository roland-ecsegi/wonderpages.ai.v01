/**
 * Enterprise API routes (P2+), registered on the existing tiny router. Each route states its task.
 * ctx: { on, json, need, localOnly, repo, storage, commandIdOf }
 */
import { buildGraph, impactOf, textArtifactChanges, canonChanges } from './domain/dependencies.js';
import { canonRevision, canonConflicts, projections, proposeCanonChange, AUTHORITY } from './domain/canon.js';
import { uid, now } from './repo.js';
import { decisionRecord, policyHash } from './domain/decisions.js';
import { planMigration, runMigration, listMigrations } from './migration/migrator.js';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.js';
import { RUNNING, expandStages, reassessVolume, prepareTextPacket, ingestTextPacket, prepareImagePacket, ingestImagePacket, gateItems, setItemDecisions, applyItemChanges, assertCanWork } from './engine.js';
import { pageWorkbench, commandImpact, itemIdFor, srcKeyOf } from './domain/workbench.js';
import { coloringQA, COLORING_QA_VERSION } from './quality/coloring.js';
import { unitHashes, verifyExecution, missingUnits } from './quality/repair.js';
import { variantSet, backfillVersions } from './persistence/artifact-store.js';
import { progressReport, inspectArtifact } from './observability/progress.js';
import { inferFromText, contractPreview } from './domain/intake.js';
import { matrixForArtifacts } from './domain/collection.js';
import { derivePageBlueprints, validatePageBlueprints } from './domain/page-blueprints.js';
import { atlasFor } from './domain/atlas.js';
import { storyContract } from './domain/story-contracts.js';
import { pilotState } from './domain/pilot.js';
import { volumeSafety, SAFETY_POLICY } from './quality/safety.js';
import { assessBook, policyFor } from './quality/assessment.js';
import { pageVisual } from './quality/visual.js';
import { collectionQA } from './quality/collection-qa.js';
import { runEvaluation, calibrationStatus, compareReports } from './quality/evaluation.js';
import { planLayout } from './domain/layout.js';
import { pngSize } from './security/safe-zip.js';
import { reconcileReport, applyReconcile } from './migration/dw-reconcile.js';
import { contractFromBlueprint, validateProjectInput, editionsFor } from './domain/product-contract.js';
import * as Ledger from './ledger.js';
import { getCapabilities } from './providers/registry.js';
import { createPacket, getPacket, listPackets, recordAttempt, assertUsable, packetZip } from './providers/operator-exchange.js';

/** P6-T01: the layout plan of a volume with the real pixel sizes of its illustrations (crop measured on the files). */
export async function measuredLayout(repo, pid, project, bp, art, v, preset = 'digital') {
  if (preset !== 'digital' && !(bp.export?.presets || []).some(x => x.key === preset)) throw { status: 400, message: 'Profil de export necunoscut.' };
  const images = {};
  for (let p = 1; p <= (bp.structure?.pages || 12); p++) { const c = art[`ill_${v}_${p}`]?.content; if (!c?.color) continue; try { const sz = pngSize(await repo.readFile(pid, c.color)); if (sz) images[`ill_${v}_${p}`] = sz; } catch {} }
  return planLayout({ bp, project, art, v, preset, images });
}

export function impactForWrite(bp, art, key, nextContent) {
  const prev = art[key]?.content;
  let changes = [];
  if (/^(script|final|tr)_\d+$/.test(key)) changes = textArtifactChanges(key, prev, nextContent);
  else if (key === 'bible') changes = canonChanges(prev, nextContent);
  else if (/^ill_\d+_\d+$/.test(key)) { const [, v, p] = key.split('_'); const colorChanged = JSON.stringify(prev?.color) !== JSON.stringify(nextContent?.color), lineChanged = JSON.stringify(prev?.lineart) !== JSON.stringify(nextContent?.lineart); if (colorChanged) changes.push({ node: `color:${v}:${p}`, kind: 'color_only' }); else if (lineChanged) changes.push({ node: `line:${v}:${p}`, kind: 'line_only' }); }
  else if (key === 'series') changes = [{ node: 'canon:bible', kind: 'canon_release' }];
  return impactOf(buildGraph(bp, art), changes, bp);
}

export function registerEnterpriseRoutes({ on, json, need, localOnly, repo, storage, readBody }) {
  const currentBlueprint = () => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints', 'kids-sc.json'), 'utf8')); } catch { return null; } };
  /* P2-T05: migration dry-run (read-only), run bound to the plan hash (idempotent per source), history */
  on('POST', '/api/migrations/plan', async (_, req) => { localOnly(req); return planMigration(await readBody(req, 600 * 1024 * 1024), { currentBlueprint: currentBlueprint() }); });
  on('POST', '/api/migrations/run', async (_, req, url) => { localOnly(req); return runMigration(repo, storage, await readBody(req, 600 * 1024 * 1024), { planHash: String(url.searchParams.get('plan') || ''), currentBlueprint: currentBlueprint() }); });
  on('GET', '/api/migrations', async (_, req) => { localOnly(req); return { runs: await listMigrations(storage) }; });
  on('GET', '/api/projects/:pid/migration-report', async ({ pid }) => { need(pid); const a = (await repo.artifacts(pid)).migration_report; if (!a) throw { status: 404, message: 'Proiectul nu provine dintr-o migrare.' }; return a.content; });
  /* P2-T02: canon authority, projections and conflicts (read-only) */
  on('GET', '/api/projects/:pid/canon', async ({ pid }) => {
    need(pid); const bp = await repo.getBlueprint(pid), art = await repo.artifacts(pid), p = repo.getProject(pid);
    return { authority: AUTHORITY, revision: canonRevision(art), projections: projections(art), conflicts: canonConflicts(bp, art, p.canonFindings || []), proposals: (p.canonProposals || []).map(x => ({ ...x, impact: { stale: x.impact.stale.length, revalidate: x.impact.revalidate.length } })) };
  });
  /* P2-T02: impact preview before committing an edit (nothing is written) */
  on('POST', '/api/projects/:pid/impact', async ({ pid }, req) => {
    need(pid); const b = await json(req); if (!/^[a-z0-9_]{1,40}$/i.test(String(b.key || ''))) throw { status: 400, message: 'Document invalid.' };
    const bp = await repo.getBlueprint(pid), art = await repo.artifacts(pid);
    return { key: b.key, ...impactForWrite(bp, art, b.key, b.content) };
  });
  /* P2-T04: decisions history (append-only), newest last */
  on('GET', '/api/projects/:pid/decisions', async ({ pid }) => { need(pid); return { decisions: await repo.listDecisions(pid) }; });
  /* P2-T04: applying a canon proposal is an explicit operator decision bound to the canon hash it was based on */
  on('POST', '/api/projects/:pid/canon/proposals/:id/decide', async ({ pid, id }, req) => {
    localOnly(req); const p = need(pid), b = await json(req), prop = (p.canonProposals || []).find(x => x.id === id);
    if (!prop || prop.status !== 'pending') throw { status: 404, message: 'Propunere inexistentă sau deja decisă.' };
    if (!['approved', 'rejected'].includes(b.state)) throw { status: 400, message: 'Decizie necunoscută.' };
    if (b.state === 'rejected' && !String(b.reason || '').trim()) throw { status: 400, message: 'Motivul respingerii este obligatoriu.' };
    const bp = await repo.getBlueprint(pid), art = await repo.artifacts(pid);
    if (b.state === 'approved' && canonRevision(art).hash !== prop.baseCanonHash) throw { status: 409, code: 'stale_proposal', message: 'Canonul s-a schimbat după propunere; recalculează impactul înainte de aprobare.' };
    if (b.state === 'approved') await repo.writeArtifact(pid, 'bible', prop.bible, { by: 'user', note: 'Schimbare de canon aprobată' + (b.reason ? ': ' + String(b.reason).slice(0, 120) : ''), meta: art.bible?.meta || {} });
    const rec = decisionRecord({ kind: 'canon_change', actor: 'operator@laptop', state: b.state, note: b.reason, scope: { proposal: id }, subject: { baseCanonHash: prop.baseCanonHash, proposedHash: prop.proposedHash, bibleVersion: b.state === 'approved' ? (await repo.artifacts(pid)).bible.version : null, impact: { stale: prop.impact.stale.length, revalidate: prop.impact.revalidate.length } }, policy: policyHash(bp, null) });
    await repo.commitProjectDecision(pid, { canonProposals: (p.canonProposals || []).map(x => (x.id === id ? { ...x, status: b.state, decidedAt: now(), decision: rec.id } : x)) }, [rec], { actor: 'operator@laptop', kind: 'canon.decide' });
    return { ok: true, decision: rec };
  });
  /* P2-T02: a canon change is a proposal bound to the current canon hash; applying it is a decision (P2-T04) */
  on('POST', '/api/projects/:pid/canon/proposals', async ({ pid }, req) => {
    localOnly(req); const p = need(pid), b = await json(req); if (!b.bible || typeof b.bible !== 'object') throw { status: 400, message: 'Lipsește canonul propus.' };
    const bp = await repo.getBlueprint(pid), art = await repo.artifacts(pid);
    const prop = { id: uid('cp'), ...proposeCanonChange(bp, art, b.bible, { actor: 'operator', reason: String(b.reason || '').slice(0, 1000) }), bible: b.bible, at: now() };
    await repo.patchProject(pid, { canonProposals: [...(p.canonProposals || []).filter(x => x.status === 'pending').slice(-19), prop] });
    return prop;
  });

  /* P3-T05: operator exchange — packet issue/list/download/result; same validators, provenance operator-exchange, gates unchanged */
  on('POST', '/api/projects/:pid/packets', async ({ pid }, req) => {
    localOnly(req); need(pid); const b = await json(req);
    let spec;
    if (b.kind === 'text') spec = await prepareTextPacket(pid, String(b.stageKey || ''));
    else if (b.kind === 'image') { const v = Number(b.v), p = Number(b.p); if (!Number.isInteger(v) || !Number.isInteger(p) || v < 0 || p < 0) throw { status: 400, message: 'Pagină invalidă.' }; spec = await prepareImagePacket(pid, v, p); }
    else throw { status: 400, message: 'Tip de pachet necunoscut (text sau image).' };
    const doc = await createPacket(storage, pid, spec); return { ...doc, system: undefined };
  });
  on('GET', '/api/projects/:pid/packets', async ({ pid }) => { need(pid); return { packets: await listPackets(storage, pid) }; });
  on('GET', '/api/projects/:pid/packets/:id/download', async ({ pid, id }, req, _, res) => {
    localOnly(req); need(pid); const pk = await getPacket(storage, pid, id); if (!pk) throw { status: 404, message: 'Pachet inexistent.' };
    const zip = await packetZip(repo, pid, pk); const buf = fs.readFileSync(zip); fs.rmSync(zip, { force: true });
    res.writeHead(200, { 'content-type': 'application/zip', 'content-length': buf.length, 'content-disposition': `attachment; filename="${pk.id}.zip"` }); res.end(buf); return null;
  });
  on('POST', '/api/projects/:pid/packets/:id/result', async ({ pid, id }, req) => {
    localOnly(req); need(pid); if (RUNNING[pid]) throw { status: 409, message: 'Oprește producția înainte de a importa un rezultat manual.' };
    const pk = await getPacket(storage, pid, id); assertUsable(pk);
    const isImage = /^image\//.test(String(req.headers['content-type'] || ''));
    const body = isImage ? await readBody(req, 40 * 1024 * 1024) : await json(req);
    try {
      const r = pk.kind === 'text'
        ? await ingestTextPacket(pid, pk, typeof body.text === 'string' ? body.text : JSON.stringify(body.output ?? ''))
        : await ingestImagePacket(pid, pk, isImage ? body : Buffer.from(String(body.imageBase64 || ''), 'base64'));
      await recordAttempt(storage, pid, pk, { ok: true, artifact: r.artifact, version: r.version });
      return { ok: true, ...r };
    } catch (e) { await recordAttempt(storage, pid, pk, { ok: false, code: e.code || null, message: String(e.message || e).slice(0, 300) }); throw e; }
  });

  /* P3-T06: truthful progress (durable units of the current run, measured-only estimate) and the artifact inspector */
  const engineJobsNow = () => import('./engine.js').then(m => m.jobs);
  on('GET', '/api/projects/:pid/progress', async ({ pid }) => {
    const p = need(pid), bp = await repo.getBlueprint(pid), J = await engineJobsNow();
    return progressReport({ project: p, stages: expandStages(bp), jobs: J ? await J.list(pid) : [], ledgerRows: Ledger.rows(r => r.pid === pid), capabilities: getCapabilities() });
  });
  on('GET', '/api/projects/:pid/inspect/:key', async ({ pid, key }) => {
    const p = need(pid); if (!/^[a-z0-9_]{1,40}$/i.test(key)) throw { status: 400, message: 'Document invalid.' };
    const art = (await repo.artifacts(pid))[key]; if (!art) throw { status: 404, message: 'Documentul nu există.' };
    const J = await engineJobsNow(), hash = art.meta?.prov?.context;
    const manifest = hash && /^[0-9a-f]{16,64}$/.test(hash) ? await storage.readJSON(`projects/${pid}/context/${hash}.json`, null) : null;
    return inspectArtifact({ key, art, pid, jobs: J ? await J.list(pid) : [], ledgerRows: Ledger.rows(r => r.pid === pid), decisions: await repo.listDecisions(pid), projectDecisions: p.decisions || [], manifest });
  });

  /* P4-T01: guided intake — local inference proposal and the contract preview shown before create/start (nothing is created) */
  const typeOr400 = slug => { const t = repo.getType(String(slug || '')); if (!t) throw { status: 400, message: 'Tip de produs necunoscut.' }; return t; };
  on('POST', '/api/intake/infer', async (_, req) => { const b = await json(req); return inferFromText(typeOr400(b.typeSlug), b.text); });
  on('POST', '/api/intake/preview', async (_, req) => { const b = await json(req), t = typeOr400(b.typeSlug); return contractPreview(t, b.input && typeof b.input === 'object' ? b.input : {}, { contract: contractFromBlueprint(t), validate: validateProjectInput, editions: editionsFor, source: b.source === 'pack' ? 'pack' : null }); });

  /* P4-T02: the collection matrix (read-only, any project — also migrated ones such as Dinosaur World) */
  on('GET', '/api/projects/:pid/collection', async ({ pid }) => { need(pid); return matrixForArtifacts(await repo.getBlueprint(pid), await repo.artifacts(pid)); });

  /* P4-T03: the 72 PageBlueprints and the visual canon (read-only, any project) */
  on('GET', '/api/projects/:pid/pageplans', async ({ pid }) => { need(pid); const bp = await repo.getBlueprint(pid), art = await repo.artifacts(pid); const { pages, sources } = derivePageBlueprints(bp, art); return { pages, sources, ...validatePageBlueprints(pages, { structure: bp.structure, bible: art.bible?.content }) }; });
  on('GET', '/api/projects/:pid/atlas', async ({ pid }) => { const p = need(pid), art = await repo.artifacts(pid); return atlasFor({ project: p, art, approvals: p.approvals?.['review_collection@c'] || {}, declaredRights: p.rightsDeclared || [] }); });

  /* P4-T04: story/age/localization contract of one volume (read-only, citeable evidence) */
  on('GET', '/api/projects/:pid/story/:v', async ({ pid, v }) => { const p = need(pid), bp = await repo.getBlueprint(pid), n = Number(v); if (!Number.isInteger(n) || n < 1 || n > bp.structure.volumes) throw { status: 400, message: 'Volum invalid.' }; const r = storyContract({ bp, art: await repo.artifacts(pid), input: p.input || {}, v: n - 1 }); if (!r) throw { status: 404, message: 'Volumul nu are încă manuscris.' }; return r; });

  /* P4-T05: pilot state (V2–N blocked until the pilot is decided) and selective reconciliation of a migrated project */
  on('GET', '/api/projects/:pid/pilot', async ({ pid }) => { const p = need(pid); return pilotState(await repo.getBlueprint(pid), p); });
  on('GET', '/api/projects/:pid/reconcile', async ({ pid }) => { need(pid); return reconcileReport(await repo.artifacts(pid)); });
  on('POST', '/api/projects/:pid/reconcile/apply', async ({ pid }, req) => {
    localOnly(req); const p = need(pid); if (RUNNING[pid]) throw { status: 409, message: 'Oprește proiectul înainte de reconciliere.' };
    const b = await json(req), art = await repo.artifacts(pid), report = reconcileReport(art);
    if (b.reportHash !== report.hash) throw { status: 409, code: 'stale_report', message: 'Raportul s-a schimbat de la deschidere; reîncarcă-l înainte de a decide.' };
    const { writes, applied } = applyReconcile(art, report, b.choices || {});
    if (!applied.length) throw { status: 400, message: 'Nicio alegere de aplicat.' };
    for (const [k, content] of Object.entries(writes)) await repo.writeArtifact(pid, k, content, { by: 'operator', note: 'Reconciliere selectivă (decizia operatorului): ' + [...new Set(applied.filter(a => a.path.startsWith(k === 'series' ? 'series' : k)).map(a => a.conflict))].join(', '), meta: art[k]?.meta || {} });
    const rec = decisionRecord({ kind: 'reconcile', actor: 'operator@laptop', state: 'approved', note: String(b.note || '').slice(0, 500), scope: { conflicts: [...new Set(applied.map(a => a.conflict))] }, subject: { reportHash: report.hash, applied: applied.map(a => ({ conflict: a.conflict, path: a.path, from: a.from, to: a.to })) }, policy: policyHash(await repo.getBlueprint(pid), null) });
    await repo.commitProjectDecision(pid, { reconciledAt: now() }, [rec], { actor: 'operator@laptop', kind: 'reconcile.apply' });
    return { ok: true, applied, decision: rec.id, after: reconcileReport(await repo.artifacts(pid)) };
  });

  /* P5-T01: safety verdicts per volume, and the adult operator review that may clear REVIEW/UNKNOWN (never BLOCK) */
  on('GET', '/api/projects/:pid/safety/:v', async ({ pid, v }) => { const p = need(pid), bp = await repo.getBlueprint(pid), n = Number(v); if (!Number.isInteger(n) || n < 1 || n > bp.structure.volumes) throw { status: 400, message: 'Volum invalid.' }; return volumeSafety({ bp, art: await repo.artifacts(pid), project: p, v: n - 1 }); });
  on('POST', '/api/projects/:pid/safety/review', async ({ pid }, req) => {
    localOnly(req); const p = need(pid), b = await json(req), bp = await repo.getBlueprint(pid), n = Number(b.v);
    if (!Number.isInteger(n) || n < 1 || n > bp.structure.volumes) throw { status: 400, message: 'Volum invalid.' };
    const reason = String(b.reason || '').trim(); if (reason.length < 5) throw { status: 400, message: 'Scrie ce ai verificat (motivul este obligatoriu).' };
    const sf = volumeSafety({ bp, art: await repo.artifacts(pid), project: p, v: n - 1 }), sub = sf.subjects.find(x => x.id === b.subject);
    if (!sub) throw { status: 404, message: 'Elementul nu există.' };
    if (sub.raw === 'BLOCK') throw { status: 409, code: 'no_override', message: 'Un BLOCK de siguranță nu se poate aproba: corectează conținutul.' };
    if (sub.raw === 'PASS') throw { status: 400, message: 'Elementul este deja PASS.' };
    const review = { hash: sub.hash, decision: 'pass', reason: reason.slice(0, 500), actor: 'operator@laptop', at: now(), verdict: sub.raw, policy: SAFETY_POLICY.version };
    const rec = decisionRecord({ kind: 'safety_review', actor: 'operator@laptop', state: 'approved', note: review.reason, scope: { volume: n, subject: sub.id }, subject: { hash: sub.hash, verdict: sub.raw, policy: SAFETY_POLICY }, policy: policyHash(bp, null) });
    await repo.commitProjectDecision(pid, { safetyReviews: { ...(p.safetyReviews || {}), [sub.id]: review } }, [rec], { actor: 'operator@laptop', kind: 'safety.review' });
    return { ok: true, review, decision: rec.id };
  });

  /* P5-T02: the current assessments of a volume (script, final, native edition) and the book assessment */
  on('GET', '/api/projects/:pid/assessment/:v', async ({ pid, v }) => {
    const p = need(pid), bp = await repo.getBlueprint(pid), n = Number(v); if (!Number.isInteger(n) || n < 1 || n > bp.structure.volumes) throw { status: 400, message: 'Volum invalid.' };
    const art = await repo.artifacts(pid), i = n - 1, pick = k => art[k] ? { artifact: k, version: art[k].version, assessment: art[k].meta?.assessment || null, legacyScore: art[k].meta?.score ?? null } : null;
    return { policy: policyFor(bp), script: pick(`script_${i}`), final: pick(`final_${i}`), native: pick(`tr_${i}`), book: assessBook({ bp, art, project: p, v: i }) };
  });

  on('POST', '/api/projects/:pid/assessment/:v/refresh', async ({ pid, v }, req) => { localOnly(req); const p = need(pid), bp = await repo.getBlueprint(pid), n = Number(v); if (!Number.isInteger(n) || n < 1 || n > bp.structure.volumes) throw { status: 400, message: 'Volum invalid.' }; if (RUNNING[pid]) throw { status: 409, message: 'Proiectul lucrează deja.' }; reassessVolume(pid, n - 1).catch(e => console.warn('[reassess]', e?.message || e)); return { ok: true, started: true }; });   // P5-T02

  /* P5-T03: visual + coloring pair per page of a volume, on the real files (missing/stale/negative QA explained) */
  on('GET', '/api/projects/:pid/visual/:v', async ({ pid, v }) => {
    const p = need(pid), bp = await repo.getBlueprint(pid), n = Number(v); if (!Number.isInteger(n) || n < 1 || n > bp.structure.volumes) throw { status: 400, message: 'Volum invalid.' };
    const art = await repo.artifacts(pid), size = async f => { try { return f ? pngSize(await repo.readFile(pid, f)) : null; } catch { return null; } }, pages = [];
    for (let pg = 0; pg <= bp.structure.pages; pg++) { const c = art[`ill_${n - 1}_${pg}`]?.content; pages.push({ page: pg, ...pageVisual({ c, size: await size(c?.color), lineSize: await size(c?.lineart), format: bp.formats?.[p.input?.[bp.format_key]] || {}, requireLine: p.options?.images !== false }) }); }
    return { volume: n, ok: pages.every(x => x.ok), pages };
  });

  /* P5-T04: cross-artifact and collection QA with exact references and affected scopes */
  on('GET', '/api/projects/:pid/collection-qa', async ({ pid }) => { const p = need(pid); return collectionQA({ bp: await repo.getBlueprint(pid), art: await repo.artifacts(pid), project: p }); });

  /* P5-T05: gold set (versioned, rights + split manifest), evaluation runs, comparison and the operator's acceptance */
  const gold = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'evaluation', 'gold', 'gold-v1.json'), 'utf8'));
  const reports = async () => { const out = []; for (const f of (await storage.list('evaluation/reports').catch(() => [])).filter(x => x.name.endsWith('.json'))) { const r = await storage.readJSON(`evaluation/reports/${f.name}`, null); if (r) out.push(r); } return out.sort((a, b) => a.at - b.at); };
  on('GET', '/api/evaluation/gold', async () => { const g = gold(); return { manifest: g.manifest, counts: g.cases.reduce((m, c) => { m[c.split] = (m[c.split] || 0) + 1; m[c.kind] = (m[c.kind] || 0) + 1; return m; }, {}) }; });
  on('POST', '/api/evaluation/run', async (_, req) => { localOnly(req); const b = await json(req); const r = runEvaluation(gold(), { split: ['calibration', 'holdout', 'all'].includes(b.split) ? b.split : 'calibration', policy: Number(b.policy) === 1 ? 1 : 2 }); await storage.writeJSON(`evaluation/reports/${r.id}.json`, r); return r; });
  on('GET', '/api/evaluation/reports', async () => ({ reports: (await reports()).map(r => ({ id: r.id, split: r.split, versions: r.versions, dataset: r.dataset, at: r.at, overall: r.overall })) }));
  on('POST', '/api/evaluation/compare', async (_, req) => { const b = await json(req), all = await reports(), a = all.find(r => r.id === b.a), c = all.find(r => r.id === b.b); if (!a || !c) throw { status: 404, message: 'Raport inexistent.' }; return compareReports(a, c); });
  on('POST', '/api/evaluation/accept', async (_, req) => { localOnly(req); const b = await json(req), all = await reports(); if (!all.some(r => r.id === b.calibration && r.split === 'calibration') || !all.some(r => r.id === b.holdout && r.split === 'holdout')) throw { status: 400, message: 'Alege un raport de calibrare și unul pe setul rezervat.' }; if (String(b.note || '').trim().length < 10) throw { status: 400, message: 'Scrie ce ai verificat la acceptare.' }; const acc = { calibration: b.calibration, holdout: b.holdout, note: String(b.note).slice(0, 1000), actor: 'operator@laptop', at: now() }; await storage.writeJSON('evaluation/acceptance.json', acc); return acc; });
  on('GET', '/api/evaluation/status', async () => { const all = await reports(), acc = await storage.readJSON('evaluation/acceptance.json', null); const pick = id => all.find(r => r.id === id); return calibrationStatus(acc ? [pick(acc.calibration), pick(acc.holdout)].filter(Boolean) : [all.filter(r => r.split === 'calibration').at(-1), all.filter(r => r.split === 'holdout').at(-1)].filter(Boolean), acc); });

  /* P5-T06: repair reports (plan, verification, resolutions, items for the operator) and missing/failed units of a volume */
  on('GET', '/api/projects/:pid/repairs', async ({ pid }) => { const p = need(pid); return { attempts: p.repairAttempts || {}, reports: p.repairs || [] }; });
  on('GET', '/api/projects/:pid/missing/:v', async ({ pid, v }) => { const p = need(pid), bp = await repo.getBlueprint(pid), n = Number(v); if (!Number.isInteger(n) || n < 1 || n > bp.structure.volumes) throw { status: 400, message: 'Volum invalid.' }; return { volume: n, units: missingUnits(await repo.artifacts(pid), n - 1, { pages: bp.structure.pages, images: p.options?.images !== false }) }; });
  /* P6-T01: measured layout plans (shared measuring code with the preview and the export) and layout revisions */
  const presetOf = req => { const k = new URL(req.url, 'http://x').searchParams.get('preset') || 'digital'; if (!/^[a-z0-9_-]{1,20}$/.test(k)) throw { status: 400, message: 'Profil de export invalid.' }; return k; };
  const layoutOf = async (pid, n, preset) => { const p = need(pid), bp = await repo.getBlueprint(pid); if (!Number.isInteger(n) || n < 1 || n > bp.structure.volumes) throw { status: 400, message: 'Volum invalid.' }; return measuredLayout(repo, pid, p, bp, await repo.artifacts(pid), n - 1, preset); };
  on('GET', '/api/projects/:pid/layout', async ({ pid }, req) => { const p = need(pid), bp = await repo.getBlueprint(pid), art = await repo.artifacts(pid), preset = presetOf(req), plans = {};
    for (let v = 0; v < bp.structure.volumes; v++) if (art[`final_${v}`] || art[`script_${v}`]) plans[v] = await layoutOf(pid, v + 1, preset);
    return { preset, plans, revisions: p.layoutRevisions || {} }; });
  on('GET', '/api/projects/:pid/layout/:v', async ({ pid, v }, req) => layoutOf(pid, Number(v), presetOf(req)));
  on('POST', '/api/projects/:pid/layout/:v/revision', async ({ pid, v }, req) => {
    localOnly(req); const p = need(pid), b = await json(req), n = Number(v), plan = await layoutOf(pid, n, String(b.preset || 'digital'));
    if (b.measurementHash !== plan.measurementHash) throw { status: 409, code: 'stale_layout', message: 'Măsurarea s-a schimbat (text, imagine, font sau profil) de la previzualizare; reîncarcă macheta.', current: plan.measurementHash };
    if (plan.blocking) throw { status: 409, code: 'layout_blocked', message: 'Macheta are probleme blocante (depășire, glife lipsă, încadrare): rezolvă-le înainte de a o fixa.', findings: plan.findings.filter(f => f.blocking) };
    const prev = p.layoutRevisions?.[n] || [], rev = { rev: prev.length + 1, preset: plan.preset, measurementHash: plan.measurementHash, metricsHash: plan.metricsHash, at: now(), actor: 'operator@laptop', note: String(b.note || '').slice(0, 300), pages: plan.pages.map(x => ({ n: x.n, family: x.family, zone: x.zone, sizePt: x.sizePt, source: x.source, crop: x.crop ? { x: x.crop.x, y: x.crop.y, w: x.crop.w, h: x.crop.h } : null })) };
    const rec = decisionRecord({ kind: 'layout_revision', actor: 'operator@laptop', state: 'approved', note: rev.note, scope: { volume: n, preset: plan.preset }, subject: { measurementHash: plan.measurementHash, rev: rev.rev } });
    await repo.commitProjectDecision(pid, { layoutRevisions: { ...(p.layoutRevisions || {}), [n]: [...prev, rev].slice(-20) } }, [rec], { actor: 'operator@laptop', kind: 'layout.revision' });
    return { ok: true, revision: rev, decision: rec.id };
  });
  /* P6-T02: integrated page workbench — page in context, commands with impact before commit, stale-bound commits */
  const wbArgs = async (pid, v, pg) => { const p = need(pid), bp = await repo.getBlueprint(pid), n = Number(v), page = Number(pg); if (!Number.isInteger(n) || n < 1 || n > bp.structure.volumes) throw { status: 400, message: 'Volum invalid.' }; if (!Number.isInteger(page) || page < 0 || page > bp.structure.pages) throw { status: 400, message: 'Pagină invalidă.' }; return { p, bp, v: n - 1, page, art: await repo.artifacts(pid) }; };
  on('GET', '/api/projects/:pid/workbench/:v/:pg', async ({ pid, v, pg }) => {
    const { p, bp, v: vi, page, art } = await wbArgs(pid, v, pg), versions = {};
    for (const key of [srcKeyOf(art, vi), `tr_${vi}`, `ill_${vi}_${page}`]) if (art[key]) { await backfillVersions(storage, pid, key, art[key]); versions[key] = await variantSet(storage, pid, key, art[key]); }
    const plan = await measuredLayout(repo, pid, p, bp, art, vi).catch(() => null);
    return pageWorkbench({ bp, art, project: p, v: vi, p: page, plan, versions, gateItems: p.gate ? gateItems(bp, art, p, p.gate) : [] });
  });
  on('POST', '/api/projects/:pid/workbench/:v/:pg/preview', async ({ pid, v, pg }, req) => {
    const { p, bp, v: vi, page, art } = await wbArgs(pid, v, pg), b = await json(req), imp = commandImpact({ art, v: vi, p: page, command: b.command, payload: b.payload || {}, P: bp.structure.pages });
    const out = { ...imp, next: undefined };
    if (imp.command === 'exact') { const c = structuredClone(art[imp.key].content); c.pages[page - 1].text = imp.next; out.graph = impactForWrite(bp, art, imp.key, c); }
    if (imp.ai) { const id = itemIdFor(imp, vi, page), items = p.gate ? gateItems(bp, art, p, p.gate) : []; out.item = id; const it = items.find(i => i.id === id); out.inGate = !!it; out.applicable = !!it && !it.missing && !it.blocked; out.otherPending = items.filter(i => i.id !== id && ['changes', 'rejected', 'approved_note'].includes(i.state)).map(i => i.label); }
    return out;
  });
  on('POST', '/api/projects/:pid/workbench/:v/:pg/commit', async ({ pid, v, pg }, req) => {
    localOnly(req); if (RUNNING[pid]) throw { status: 409, message: 'Așteaptă terminarea operației active.' };
    const { p, bp, v: vi, page, art } = await wbArgs(pid, v, pg), b = await json(req), imp = commandImpact({ art, v: vi, p: page, command: b.command, payload: b.payload || {}, P: bp.structure.pages });
    if (b.previewHash !== imp.previewHash) throw { status: 409, code: 'stale_preview', message: 'Pagina s-a schimbat după ce ai văzut impactul; verifică din nou impactul înainte de a aplica.' };
    if (imp.ai) {
      const id = itemIdFor(imp, vi, page), items = p.gate ? gateItems(bp, art, p, p.gate) : [];
      const it = items.find(i => i.id === id);
      if (!it) throw { status: 409, code: 'needs_gate', message: 'Comenzile cu AI rulează prin poarta de revizie deschisă care conține această pagină.' };
      if (it.missing || it.blocked) throw { status: 409, code: 'item_not_applicable', message: imp.command === 'line' ? 'Pagina de colorat este depășită: se derivă din culoarea nouă când aprobi culoarea.' : 'Elementul lipsește sau nu a trecut verificarea; rezolvă mai întâi cauza.' };
      assertCanWork(pid);
      await setItemDecisions(pid, [{ id, state: 'changes', note: String(b.payload?.note || '').slice(0, 800), ...(imp.mode ? { mode: imp.mode } : {}) }], { actor: 'operator@laptop' });
      applyItemChanges(pid);
      return { ok: true, started: true, item: id, impact: { ...imp, next: undefined } };
    }
    const before = unitHashes(art, vi, bp.structure.pages), c = structuredClone(art[imp.key].content);
    if (imp.command === 'exact') c.pages[page - 1].text = imp.next; else c.pages[page - 1].layout = imp.next;
    const doc = await repo.writeArtifact(pid, imp.key, c, { by: 'user', note: imp.command === 'exact' ? `Atelier: înlocuire exactă pe pagina ${page}` : `Atelier: machetă pagina ${page}`, meta: art[imp.key]?.meta || {} });
    const art2 = await repo.artifacts(pid), verify = verifyExecution(before, unitHashes(art2, vi, bp.structure.pages), { patches: [{ target: imp.changes, invalidates: imp.stale }] });
    const rec = decisionRecord({ kind: 'workbench', actor: 'operator@laptop', state: 'approved', note: imp.label, scope: { volume: vi + 1, page, command: imp.command }, subject: { key: imp.key, version: doc.version, previewHash: imp.previewHash, changes: imp.changes, stale: imp.stale, verify: { ok: verify.ok, unrequested: verify.unrequested } } });
    await repo.commitProjectDecision(pid, {}, [rec], { actor: 'operator@laptop', kind: 'workbench.' + imp.command });
    return { ok: true, version: doc.version, verify, calls: [], decision: rec.id };
  });
  /* P6-T03: colouring pages measured at print size after placement (strokes, colourable spaces), bound to file and colour */
  on('GET', '/api/projects/:pid/coloring/:v', async ({ pid, v }, req) => {
    const p = need(pid), bp = await repo.getBlueprint(pid), n = Number(v); if (!Number.isInteger(n) || n < 1 || n > bp.structure.volumes) throw { status: 400, message: 'Volum invalid.' };
    const art = await repo.artifacts(pid), preset = presetOf(req), src = art[`final_${n - 1}`] || art[`script_${n - 1}`], pages = [];
    for (let pg = 0; pg <= bp.structure.pages; pg++) {
      const c = art[`ill_${n - 1}_${pg}`]?.content; if (!c?.color) { pages.push({ p: pg, status: 'pending' }); continue; }
      if (!c.lineart) { pages.push({ p: pg, status: c.linePending ? 'line_pending' : 'line_missing', candidates: c.lineCandidates || [] }); continue; }
      let measured = null; try { const fin = await repo.readFile(pid, c.lineart), raw = c.lineartRaw ? await repo.readFile(pid, c.lineartRaw).catch(() => fin) : fin; measured = coloringQA(raw, { bp, project: p, page: src?.content?.pages?.[pg - 1] || null, ill: c, preset, final: fin }); } catch (e) { measured = { ok: false, issues: ['Fișierul paginii de colorat nu se poate citi: ' + (e.message || e)] }; }
      const stale = !!(c.lineFrom && c.lineFrom !== c.color);
      pages.push({ p: pg, status: stale ? 'stale' : measured.ok ? 'pass' : 'fail', file: c.lineart, colorFrom: c.lineFrom || null, color: c.color, stale, stored: c.lineQA ? { ok: c.lineQA.ok, version: c.lineQA.version || 0, for: c.lineQA.for || null } : null, measured: { ok: measured.ok, issues: measured.issues, metrics: measured.physical?.metrics || null, preset: measured.physical?.preset || preset }, candidates: c.lineCandidates || [] });
    }
    return { schema: 'wonderpages.coloring-report/1', version: COLORING_QA_VERSION, volume: n, preset, pages, ok: pages.every(x => x.status === 'pass') };
  });
}
