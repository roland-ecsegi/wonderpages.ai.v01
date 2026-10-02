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
import { RUNNING, expandStages, prepareTextPacket, ingestTextPacket, prepareImagePacket, ingestImagePacket } from './engine.js';
import { progressReport, inspectArtifact } from './observability/progress.js';
import { inferFromText, contractPreview } from './domain/intake.js';
import { matrixForArtifacts } from './domain/collection.js';
import { derivePageBlueprints, validatePageBlueprints } from './domain/page-blueprints.js';
import { atlasFor } from './domain/atlas.js';
import { storyContract } from './domain/story-contracts.js';
import { pilotState } from './domain/pilot.js';
import { volumeSafety, SAFETY_POLICY } from './quality/safety.js';
import { reconcileReport, applyReconcile } from './migration/dw-reconcile.js';
import { contractFromBlueprint, validateProjectInput, editionsFor } from './domain/product-contract.js';
import * as Ledger from './ledger.js';
import { getCapabilities } from './providers/registry.js';
import { createPacket, getPacket, listPackets, recordAttempt, assertUsable, packetZip } from './providers/operator-exchange.js';

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
}
