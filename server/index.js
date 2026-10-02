import { installConsoleRedaction } from './security/redact.js';
import { transportMode, remoteMutationBlocked, originAllowed, postureReport } from './security/posture.js';
import { sniffImage } from './security/safe-zip.js';
import { validateFinalPdf } from './pdfcheck.js';
installConsoleRedaction();   // P1-T04: secrets never reach wonderpages.log
import { checkedPackage } from './package-check.js';
import { reconcileStorage } from './reconcile.js';
import http from 'node:http';
import {saveSnapshot,restoreSnapshot,listSnapshots} from './snapshot.js';
import {tlsEnabled,startTls} from './tls.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config, ROOT, APP_EDITION } from './config.js';
import { createStorage } from './storage/index.js';
import { Repo, bus, now, uid, clone, flushRepo } from './repo.js';
import { Canva } from './canva.js';
import { llmInfo, initLLM, verifyClaude, openLoginWindow } from './llm.js';
import { killAll as killClaude, claudeFlags, schemaActive } from './claudecode.js';
import os from 'node:os';
import { buildPackage, openFolder, projectFolder, scheduleBackups, outputDir, setOutputDir, outputMirror, setOutputMirror, mirrorDelivery, mirrorBackup, listBackups, backupNow, restoreBackup } from './output.js';
import { ENV_DUPLICATES } from './config.js';
import { spawn } from 'node:child_process';
import { startProject, pauseProject, switchTo, assertCanWork, activeProject, IMAGE_DEFAULT, gateItems, gateSummary, setItemDecisions, applyItemChanges, completeGate, expandStages, initEngine, runTask, stopEngine, decide, RUNNING, HANDLER_NAMES, agentComplete, learnFromEdit, trackProjectBackground, quietProjectBackground } from './engine.js';
import { initAgents, listAgents, updateAgent, flushAgents } from './agents.js';
import * as AgentsMod from './agents.js';
import * as EngineMod from './engine.js';
import { initLearning, listLessons, setLessonStatus, learningState, addManualLesson, seedLessons, setLessonScope, loadCalibration, setCalibrated } from './learning.js';
import { initGovernor, flushGovernor, usage, setBudget, setWeeklyBudget, canvaUsage, setCanvaSettings } from './governor.js';
import * as Training from './training.js';
import * as GPTImage from './codeximage.js';
import { runCodexText, codexTextStatus, checkCodexText } from './codextext.js';
import { exportProject, importProject } from './projectpkg.js';
import * as Learning from './learning.js';
import * as Ledger from './ledger.js';
import { exportKnowledge } from './knowledge.js';
import * as Cover from './canvacover.js';
import * as Purge from './purge.js';
import { GDrive } from './gdrive.js';
import * as LAN from './lan.js';
import * as Render from './renderer.js';
import * as Dali from './assistant.js';
import * as Improve from './improve.js';
import { cleanComment, cleanInput, IMAGE_MIME, PID_RE } from './sanitize.js';
import { volumeApproved, runRetro, runPreflight } from './engine.js';
import { fingerprint, fileHash, pageSequence, sceneFingerprint } from './contracts.js';
import { pageData } from './engine.js';
import { deliveryFingerprint, currentReceipts, requiredBooks } from './delivery.js';
import { editorialFindings } from './editorial.js';
import { physicalPages, printDimensions, destinationCheck, coverWrap } from './printprofile.js';
import { contractFromBlueprint, validateContract, validateProjectInput, projectContractReport } from './domain/product-contract.js';
import { appRightsInventory, projectRightsInventory, rightsStatus, rightsRecord, commercialReleaseCheck } from './domain/rights.js';
import * as Capabilities from './providers/registry.js';
import { schemaStatus } from './persistence/migrations.js';
import { getVersion, listVersions, variantSet, pinVersion, backfillVersions, retentionPlan, applyRetention } from './persistence/artifact-store.js';
import { canonicalHash } from './domain/canonical.js';
import { releaseCheck, expectedInventory, decisionStatus } from './domain/decisions.js';
import { rebindDependents } from './persistence/rebind.js';
import { registerEnterpriseRoutes, impactForWrite, measuredLayout } from './enterprise-routes.js';
import * as Knowledge from './knowledge/store.js';
import * as Governance from './knowledge/governance.js';
import { inspectPdf, checkInspection } from './inspection/pdf-inspect.js';
import { imageResolution } from './quality/readiness.js';
import { EventStream } from './observability/events.js';
import * as Intake from './domain/intake.js';
import { volumeSafety, inputSafety } from './quality/safety.js';
import { collectionQA, releaseIssues } from './quality/collection-qa.js';
import { toolSchemaHash, hostConfig } from './providers/capabilities.js';
import { checkIncludedQuota } from './subscription-usage.js';

globalThis.__wpBootStage?.('Pornesc baza de date (Docker)…');
const storage = await createStorage(config.storage);
const repo = new Repo(storage);
await repo.load();
const canva = new Canva(storage, config.port);
initEngine(repo, canva);
await initAgents(storage); await initGovernor(storage);
await Ledger.initLedger(storage);
const Events = await new EventStream(storage).init();   // P3-T06: durable change stream (cursor replay across reconnects and restarts)
await initLearning(storage, (prompt, o) => agentComplete(prompt, o)); await loadCalibration(); await Learning.loadKnownFailures(); await Learning.loadThresholds();
await Knowledge.initKnowledgeStore(storage); await (await import('./knowledge/experience.js')).initExperience(storage); await Training.initTraining(storage, Learning);
Improve.initImprove({ learn: Learning, activeProject: () => activeProject() });
const gdrive = new GDrive(storage, config.port); await gdrive.init();
await LAN.initLan(storage);
await Dali.initAssistant(repo, storage, (prompt, o) => agentComplete(prompt, o), () => ({
  projects: repo.listProjects().slice(0, 20).map(p => ({ id: p.id, title: p.title, status: p.status, gate: p.gate ? { key: p.gate.key, vol: p.gate.vol } : null, currentVolume: p.currentVolume, age: p.variantLabel })),
  services: { claude: llmInfo().configured, claudeAuth: llmInfo().auth?.ok, canva: canva.status().connected, drive: gdrive.status().connected, lan: LAN.status().enabled }, usage: usage()
}));
await Improve.recoverInterruptedApplies(Dali.listImprovements()).then(r => { if (r.length) console.warn('[atelier] aplicări întrerupte, revenite:', r.join(', ')); }).catch(e => console.warn('[atelier]', e.message));   // P7-T05
const SETTINGS = (await storage.readJSON('settings.json', {})) || {};
if (SETTINGS.outputDir) setOutputDir(SETTINGS.outputDir);
if (SETTINGS.outputMirror) setOutputMirror(SETTINGS.outputMirror);
IMAGE_DEFAULT.engine = SETTINGS.imageEngine || 'canva'; IMAGE_DEFAULT.fallback = !!SETTINGS.imageFallback;
GPTImage.checkCodex().catch(e => console.warn('[images status]', e.message));
checkCodexText().catch(e => console.warn('[text status]', e.message));
try { await seedLessons(JSON.parse(await fs.readFile(path.join(ROOT, 'seeds', 'lessons.json'), 'utf8'))); } catch (e) { console.warn('[seed]', e.message); }   // adds only rules you don't have yet

/* seed product types from ./blueprints the first time (data, not code) */
for (const f of await fs.readdir(path.join(ROOT, 'blueprints'))) {
  if (!f.endsWith('.json')) continue;
  const bp = JSON.parse(await fs.readFile(path.join(ROOT, 'blueprints', f), 'utf8'));
  const cur = repo.getType(bp.slug);
  if (!cur || Number(cur.version || 0) < Number(bp.version || 0)) await repo.putType({ ...bp, updatedAt: now() });
}
/* a server restart interrupts running work: mark it resumable */
for (const p of repo.listProjects()) if (['running', 'correcting'].includes(p.status)) await repo.patchProject(p.id, { status: p.gate ? 'awaiting_review' : 'paused', error: 'Serverul a fost repornit. Reia de unde a rămas.' });
/* P3-T03: leases of the previous process are reconciled; an external call without a confirmed result is never replayed blindly */
const reconciled = {};
for (const p of repo.listProjects()) { const r = await EngineMod.jobs?.reconcile(p.id).catch(e => ({ error: e.message })); if (r && (r.pending?.length || r.ambiguous?.length || r.resumeCheck?.length)) { reconciled[p.id] = r; if (r.ambiguous?.length) await repo.patchProject(p.id, { log: [...(p.log || []), { t: now(), text: `${r.ambiguous.length} unități au fost întrerupte după un apel extern fără rezultat confirmat; decide în Activitate dacă le reiei.`, kind: 'warn' }].slice(-120) }); } }
if (Object.keys(reconciled).length) console.warn('[jobs reconcile]', JSON.stringify(reconciled));
globalThis.__wpBootStage?.('Verific Claude…');
await initLLM();
/* P1-T03: read-only capability discovery (no generation, no API keys); unknown is never green */
const codexQuotaObs = async () => { try { const q = await checkIncludedQuota(); return { status: 'ok', provenance: 'provider', checkedAt: q.checkedAt, primary: q.primary?.usedPercent ?? null, secondary: q.secondary?.usedPercent ?? null }; } catch (e) { return e?.code === 'rate_limited' ? { status: 'limited', provenance: 'provider', resetAt: e.resetAt } : { status: 'unknown', provenance: 'none', reason: e?.message }; } };
await Capabilities.initCapabilities(storage, {
  claudeText: async () => { const i = llmInfo(); return { installed: !!i.configured, version: i.version, auth: i.auth?.ok ?? null, authDetail: i.auth?.message || null }; },
  codexText: async () => { const t = await checkCodexText().catch(() => codexTextStatus());   /* P3-T05: login re-read (read-only) so a revoked login is seen */ const q = t.installed && t.auth === true ? await codexQuotaObs() : undefined; return { installed: t.installed, version: t.version, auth: t.auth, quota: q }; },
  codexImage: async () => { const t = await GPTImage.checkCodex().catch(() => GPTImage.codexStatus()); const q = t.installed && t.auth === true ? await codexQuotaObs() : undefined; return { installed: t.installed, version: t.version, auth: t.auth, quota: q, generationVerified: t.generationVerified || null }; },
  canva: async () => { const st = canva.status(); const tools = st.connected ? await canva.listTools().catch(() => null) : null; return { installed: true, auth: st.connected ? true : st.needsAuth ? false : null, tools: tools ? tools.map(t => t.name) : null, toolInputs: tools ? Object.fromEntries(tools.map(t => [t.name, Object.keys(t.inputSchema?.properties || {})])) : null, toolSchemaHash: tools ? toolSchemaHash(tools) : null }; }
});
const storageHealth=await reconcileStorage(repo); if(storageHealth.missing.length||storageHealth.orphans.length)console.warn('[storage reconciliation]',JSON.stringify(storageHealth));
/* resource hygiene: leftovers from an earlier run (temporary images, delivery browser profiles) are removed at start */
for (const f of await fs.readdir(os.tmpdir()).catch(() => [])) if (/^(wonderpages|tiparnita)-(img|render)-/.test(f)) { const p = path.join(os.tmpdir(), f); try { const st = await fs.stat(p); if (Date.now() - st.mtimeMs > 30 * 60e3) await fs.rm(p, { recursive: true, force: true }); } catch {} }
setInterval(() => repo.evict(pid => !!RUNNING[pid]), 10 * 60e3).unref?.();
let shuttingDown = false;
const shutdown = async () => {
  if (shuttingDown) return; shuttingDown = true;
  killClaude(); Render.killAll(); GPTImage.killAllCodex();
  try {
    await Promise.all([flushGovernor(), flushAgents(), Learning.flushLearning(), Ledger.flushLedger(), flushRepo(), Events.flush()]);
    await storage.close?.(); process.exit(0);
  } catch (e) { console.error('[shutdown persistence]', e.message); process.exit(1); }
};
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown); process.on('exit', () => { try { killClaude(); } catch {} });
let storageMaintenance = false;
async function exclusiveStorage(fn) {
  if(storageMaintenance || activeProject() || Object.keys(RUNNING).length) throw {status:409,message:'Pune producția pe pauză pentru o copie coerentă.'};
  storageMaintenance = true;
  try { await Promise.all([flushGovernor(),flushAgents(),Learning.flushLearning(),Ledger.flushLedger(),flushRepo()]); return await fn(); }
  finally { storageMaintenance = false; }
}
scheduleBackups(storage,exclusiveStorage);
canva.init().catch(e => console.warn('[canva]', e?.message || e));

async function reloadPersistent(){repo.projects.clear();repo.art.clear();repo.bps.clear();repo.comments.clear();repo.types.clear();await repo.load();await initAgents(storage);await initGovernor(storage);await Ledger.initLedger(storage);await initLearning(storage,(prompt,o)=>agentComplete(prompt,o));await Knowledge.initKnowledgeStore(storage);await (await import('./knowledge/experience.js')).initExperience(storage);await loadCalibration();await Learning.loadKnownFailures();await Learning.loadThresholds();Object.assign(SETTINGS,await storage.readJSON('settings.json',{}));if(SETTINGS.outputDir)setOutputDir(SETTINGS.outputDir);IMAGE_DEFAULT.engine=SETTINGS.imageEngine||'canva';}
/* ---------- tiny router ---------- */
const routes = [];
const on = (method, pattern, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn });
const send = (res, code, body, headers = {}) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }); res.end(typeof body === 'string' ? body : JSON.stringify(body)); };
async function readBody(req, limit = 25 * 1024 * 1024) {   // audit M2: small by default; larger only where needed
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > limit) throw { status: 413, message: 'Corpul cererii este prea mare.' }; chunks.push(c); }
  return Buffer.concat(chunks);
}
const json = async req => { const b = await readBody(req, 20 * 1024 * 1024); return b.length ? JSON.parse(b.toString('utf8')) : {}; };
const pad2 = n => String(n).padStart(2, '0');
const lean = p => ({ ...p, log: undefined, running: !!RUNNING[p.id] });
/* audit C3: settings, product types, agents, lessons, imports, deletions and the AI engineer are laptop-only;
   devices on the home network can follow production, comment and approve */
function localOnly(req) { if (!LAN.isLocal(req)) throw { status: 403, message: 'Asta se face doar de pe laptopul pe care rulează aplicația.' }; }
function need(pid) { if (!PID_RE.test(String(pid))) throw { status: 404, message: 'Proiect inexistent.' }; const p = repo.getProject(pid); if (!p) throw { status: 404, message: 'Proiect inexistent.' }; return p; }

on('GET', '/api/state', async (_, req) => ({
  canva: canvaUsage(), improve: Improve.improveBusy(),
  lan: { ...LAN.status(), remote: !LAN.isLocal(req), urls: LAN.lanEnabled() ? LAN.lanUrls(config.port) : [], addresses: LAN.lanEnabled() ? LAN.lanAddresses(config.port) : [], localName: LAN.localName(config.port) },
  types: repo.listTypes(), projects: repo.listProjects().filter(p => !p.options?.golden).map(lean), handlers: HANDLER_NAMES,
  usage: usage(), active: (a => a ? { id: a.id, title: a.title, status: a.status } : null)(activeProject()), images: { engine: IMAGE_DEFAULT.engine, fallback: !!IMAGE_DEFAULT.fallback, chatgpt: GPTImage.codexStatus() }, edition: APP_EDITION, storageHealth, text: { codex: codexTextStatus() }, services: { gdrive: gdrive.status(), output: outputDir(), outputMirror: outputMirror(), claude: llmInfo(), canva: canva.status(), storage: storage.describe() }
}));
on('GET', '/api/projects/:pid', async ({ pid }) => {
  const p = need(pid);
  const bp = await repo.getBlueprint(pid); const art = await repo.artifacts(pid);
  const items = p.gate ? gateItems(bp, art, p, p.gate) : null;
  return { project: { ...p, running: !!RUNNING[pid] }, blueprint: bp, artifacts: art, comments: await repo.listComments(pid), editorial: editorialFindings(bp, art), preflight: runPreflight(bp, art, { structure: bp.structure, input: p.input, options: p.options, age_profile: bp.age_profiles?.[p.input?.[bp.variant_key]] || {} }), delivery: { fingerprints: Array.from({length:bp.structure.volumes},(_,v)=>deliveryFingerprint(p,bp,art,v)), volumes: Array.from({ length: bp.structure.volumes }, (_, v) => volumeApproved(p, bp, v, art)), collection: volumeApproved(p, bp, null, art) }, review: items ? { items, summary: gateSummary(items) } : null };
});
/* P5-T01: non-PASS safety subjects of a volume (or of the whole collection) — they block release, never a score */
const safetyOf = (p, bp, art, vol) => (vol == null ? Array.from({ length: bp.structure.volumes }, (_, v) => v) : [vol]).flatMap(v => volumeSafety({ bp, art, project: p, v }).blocking);
const qualityOf = (p, bp, art, vol) => { const qa = collectionQA({ bp, art, project: p }); const out = releaseIssues(qa, vol); if (vol == null && !qa.collectionPass) for (const v of qa.volumes.filter(x => !x.bookPass)) out.push({ code: 'VOLUME_NOT_PASSING', severity: 'high', scope: { volumes: [v.volume] }, references: [], message: `Volumul ${v.volume} nu trece evaluarea cărții: ${v.reasons.slice(0, 2).join(' ')}` }); return out; };   // P5-T04: the weakest volume decides
const assertSafeRelease = (p, bp, art, vol) => { const q = qualityOf(p, bp, art, vol); if (q.length) throw { status: 409, code: 'release_blocked', errors: releaseCheck(p, bp, art, vol, { approved: true, quality: q }).blockers.filter(b => b.code.startsWith('quality_')), message: `Calitate: ${q.length} probleme nerezolvate de severitate mare (${[...new Set(q.map(x => x.code))].join(', ')}).` }; const s = safetyOf(p, bp, art, vol); if (s.length) throw { status: 409, code: 'release_blocked', errors: releaseCheck(p, bp, art, vol, { approved: true, safety: s }).blockers.filter(b => b.code.startsWith('safety_')), message: `Siguranța copiilor: ${s.length} elemente nu sunt PASS (${[...new Set(s.map(x => x.verdict))].join(', ')}). Corectează sau verifică-le înainte de livrare.` }; };
/* P1-T05: rights ledger — unknown/expired/restricted blocks commercial release, never internal editing */
const projectRights = async (pid) => { const p = need(pid), art = await repo.artifacts(pid); const subjects = projectRightsInventory(p, art, p.rightsDeclared || []); const fonts = appRightsInventory(ROOT).records.filter(r => r.subject.kind === 'font' && /Andika/.test(r.id)); const all = [...subjects, ...fonts]; return { subjects: all.map(r => ({ ...r, ...rightsStatus(r) })), commercial: commercialReleaseCheck(all, all.map(r => r.subject.ref || r.id)), editing: { allowed: true } }; };
on('GET', '/api/rights/app', async () => { const inv = appRightsInventory(ROOT); return { summary: inv.summary, records: inv.records.map(r => ({ ...r, ...rightsStatus(r) })) }; });
on('GET', '/api/projects/:pid/rights', async ({ pid }) => projectRights(pid));
on('PUT', '/api/projects/:pid/rights', async ({ pid }, req) => { localOnly(req); const p = need(pid), b = await json(req); if (!/^(ref|manuscript|output|character|input):[A-Za-z0-9._/-]{1,160}$/.test(String(b.id || ''))) throw { status: 400, message: 'Identificator de drepturi invalid.' }; const rec = rightsRecord({ ...b, reviewer: 'operator', reviewedAt: new Date().toISOString() }); await repo.patchProject(pid, { rightsDeclared: [...(p.rightsDeclared || []).filter(r => r.id !== rec.id), rec] }); return { record: rec, ...rightsStatus(rec) }; });
on('GET', '/api/projects/:pid/contract', async ({ pid }) => { const p = need(pid); return projectContractReport(await repo.getBlueprint(pid), p); });   // P1-T01
on('POST','/api/projects/:pid/blueprint-upgrade',async({pid},req)=>{
  localOnly(req);if(RUNNING[pid])throw {status:409,message:'Oprește proiectul înainte de schimbarea contractului.'};
  const p=need(pid),body=await json(req),old=clone(await repo.getBlueprint(pid)),art=await repo.artifacts(pid),record=art.blueprint_history?.content;
  const next=body.restore?clone(record?.blueprint):clone(repo.getType(p.typeSlug));
  if(!next||next.structure.volumes!==old.structure.volumes||next.structure.pages!==old.structure.pages||!next.age_profiles?.[p.input?.[next.variant_key]])throw {status:409,message:'Contractul nu este compatibil cu structura și vârsta proiectului.'};
  if(!body.restore&&Number(next.version)<=Number(old.version))throw {status:409,message:'Proiectul folosește deja contractul curent.'};
  delete next.updatedAt;
  await repo.writeArtifact(pid,'blueprint_history',{blueprint:old,typeVersion:p.typeVersion,at:now()},{by:'user',note:'Contract salvat înainte de schimbarea explicită',keep:10});
  await storage.writeJSON('projects/'+pid+'/blueprint.json',next);repo.bps.set(pid,next);
  const plan=expandStages(next),gate=plan.find(x=>x.handler==='review_gate');
  await repo.patchProject(pid,{typeVersion:next.version,status:'awaiting_review',stageIndex:plan.indexOf(gate),currentStage:gate.key,stagePlan:plan.map(x=>({key:x.key,label:x.label,phase:x.phase||'',gate:x.handler==='review_gate',vol:x.vol??null})),gate:{key:gate.gate,vol:gate.vol??null,round:1,reopened:true,openedAt:now()},approvals:{},error:null});
  // deepMerge deliberately preserves nested objects; approvals must be explicitly cleared here.
  p.approvals={};await storage.writeJSON('projects/'+pid+'/project.json',p);
  return {ok:true,version:next.version,note:'Textele, imaginile și istoricul sunt păstrate. Aprobările se refac după revizuirea noului contract.'};
});
on('POST', '/api/projects', async (_, req) => {
  const b = await readBody(req, 60 * 1024 * 1024); const body = JSON.parse(b.toString('utf8') || '{}'); const { typeSlug, refs = [] } = body;
  const o = body.options && typeof body.options === 'object' ? body.options : {};
  const options = Object.fromEntries(Object.entries(o).filter(([k, v]) => /^[a-z_]{1,30}$/.test(k) && typeof v === 'boolean'));   // on/off flags of the product type
  if (['canva', 'chatgpt'].includes(o.image_engine)) options.image_engine = o.image_engine;
  const t = repo.getType(typeSlug); if (!t) throw { status: 400, message: 'Tip de produs necunoscut.' };
  const tooLong = Intake.checkLimits(t, body.input); if (tooLong.length) throw { status: 422, code: 'input_too_long', errors: tooLong, message: tooLong.map(e => e.message).join(' ') };   // P4-T01: never cut silently
  const input = Intake.normalizeInput(t, cleanInput(body.input));   // first selected = source language, second = natural adaptation
  for (const f of t.input_schema?.fields || []) if (!['images', 'languages'].includes(f.type) && f.required && !String(input[f.key] ?? '').trim()) throw { status: 400, message: `Câmpul „${f.label}” este obligatoriu.` };
  { const is = inputSafety(input); if (is.verdict === 'BLOCK') throw { status: 422, code: 'input_unsafe', errors: is.fields, message: 'Siguranța copiilor: ' + is.fields.flatMap(f => f.findings.filter(x => x.verdict === 'BLOCK').map(x => `„${x.quote}” — ${x.fix}`)).slice(0, 3).join(' ') }; }   // P5-T01: input safety
  if (body.previewHash != null && body.previewHash !== Intake.formHash(t, input)) throw { status: 409, code: 'stale_form', message: 'Formularul sau tipul de produs s-a schimbat după confirmare. Verifică din nou rezumatul înainte de creare.' };   // P4-T01
  const contract = contractFromBlueprint(t), cv = validateContract(contract), iv = cv.valid ? validateProjectInput(contract, input) : cv;   // P1-T01
  if (!iv.valid) throw { status: 422, code: 'contract_invalid', errors: iv.errors, message: iv.errors.map(e => e.message).join(' ') };
  const variant = (t.input_schema.fields.find(f => f.key === t.variant_key)?.options || []).find(o => o.value === input[t.variant_key]);
  const pid = uid('p');
  const p = {
    id: pid, title: (String(input.title || '').trim() || String(input.short_description || '').trim().split(/\s+/).slice(0, 7).join(' ')).slice(0, 160),
    typeSlug: t.slug, typeName: t.name, typeIcon: t.icon || '', typeVersion: t.version, variantLabel: variant?.label || '',
    contractRef: { schema: contract.schema, contractHash: contract.contractHash, blueprintVersion: contract.blueprintVersion, blueprintHash: contract.blueprintHash },
    input, source: { kind: Intake.sourceOf(input, ['pack'].includes(body.source) ? body.source : null), at: now() }, options: { image_engine: IMAGE_DEFAULT.engine, image_fallback: !!IMAGE_DEFAULT.fallback, ...options }, status: 'ready', stageIndex: 0, stages: {}, currentStage: null, run: 1,
    stagePlan: expandStages(t).map(s => ({ key: s.key, label: s.label, phase: s.phase || '', gate: s.handler === 'review_gate', vol: s.vol ?? null })), volumeFlow: !!t.volume_flow,
    gate: null, decisions: [], notes: [], rejections: [], log: [{ t: now(), text: 'Proiect creat. Pornește-l când vrei, din pagina proiectului sau din Proiecte.', kind: 'info' }], createdAt: now(), updatedAt: now(), error: null
  };
  const bp = clone(t); delete bp.updatedAt;
  const ok = (Array.isArray(refs) ? refs : []).filter(r => r && /^image\/(png|jpeg|webp)$/.test(r.mime) && typeof r.data === 'string' && r.data.length < 14e6).slice(0, 6);
  for (const r of ok) if (sniffImage(Buffer.from(r.data, 'base64')) !== r.mime) throw { status: 400, code: 'mime_mismatch', message: `Referința „${String(r.name || '').slice(0, 60)}” nu este o imagine ${r.mime} validă.` };   // P1-T04 decode check
  await repo.createProject(p, bp);
  if (ok.length) {
    const files = [];
    for (const [i, r] of ok.entries()) {
      const safe = String(r.name || 'ref').replace(/\.[a-z]+$/i, '').replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 60) || 'ref';
      const file = `uploads/${pad2(i + 1)}-${safe}.${r.mime === 'image/jpeg' ? 'jpg' : r.mime.split('/')[1]}`;
      await repo.saveFile(pid, file, Buffer.from(r.data, 'base64')); files.push({ file, name: r.name, mime: r.mime });
    }
    await repo.patchProject(pid, { refs: files });
  }
  return { id: pid };
});
on('POST', '/api/projects/:pid/run', async ({ pid }) => { need(pid); improveFree(); return startProject(pid); });
const improveFree = () => { const b = Improve.improveBusy(); if (b) throw { status: 409, message: `Inginerul lucrează acum la îmbunătățirea „${b.title}”. Așteaptă să termine sau oprește-l din pagina Îmbunătățiri.` }; };
on('POST', '/api/projects/:pid/start', async ({ pid }) => { need(pid); improveFree(); return startProject(pid); });
on('POST', '/api/projects/:pid/pause', async ({ pid }) => { need(pid); return pauseProject(pid); });
on('POST', '/api/projects/:pid/switch', async ({ pid }) => { need(pid); improveFree(); return switchTo(pid); });
on('POST', '/api/projects/:pid/stop', async ({ pid }) => { need(pid); stopEngine(pid); return { ok: true }; });
on('POST', '/api/assistant', async (_, req) => Dali.chat(await json(req)));
on('GET', '/api/assistant/:sid', async ({ sid }) => Dali.history(sid) || { sid: null, msgs: [] });
on('DELETE', '/api/assistant/:sid', async ({ sid }) => { Dali.forget(sid); return { ok: true }; });
on('POST', '/api/assistant/:sid/proposals/:id', async ({ sid, id }, req) => { localOnly(req); const b = await json(req); return Dali.decideProposal(sid, id, { confirm: b.confirm === true, revisionOf: pid => { const p = repo.getProject(pid); return p ? (p.revision ?? 0) : null; } }); });   // P7-T06: explicit confirm/cancel of a Dali proposal
on('GET', '/api/improvements', async () => ({ items: Dali.listImprovements() }));
on('POST', '/api/improvements', async (_, req) => Dali.addImprovement(await json(req), 'manual'));
on('PUT', '/api/improvements/:id', async ({ id }, req) => Dali.updateImprovement(id, await json(req)));
on('POST', '/api/improvements/:id/start', async ({ id }, req) => localOnly(req) || Improve.startAnalysis(id, (await json(req)).comment || ''));
on('POST', '/api/improvements/:id/retry', async ({ id }, req) => { localOnly(req); const c = String((await json(req)).comment || '').trim(); if (!c) throw { status: 400, message: 'Scrie ce ar trebui să fie altfel.' }; return Improve.startAnalysis(id, c); });
on('POST', '/api/improvements/:id/cancel', async ({ id }, req) => { localOnly(req); return Improve.cancelProposal(id); });
on('POST', '/api/improvements/:id/approve', async ({ id }, req) => { localOnly(req); return Improve.approve(id); });
on('POST', '/api/improvements/:id/stop', async ({ id }, req) => { localOnly(req); return Improve.stopJob(id); });
on('POST', '/api/improvements/:id/resolve', async ({ id }, req) => { localOnly(req); return Improve.resolve(id); });
on('POST', '/api/improvements/:id/reject', async ({ id }, req) => localOnly(req) || Improve.reject(id, (await json(req)).comment || ''));
on('POST', '/api/improvements/:id/rollback', async ({ id }, req) => { localOnly(req); return Improve.rollback(id); });
on('DELETE', '/api/improvements/:id', async ({ id }, req) => { localOnly(req); const it = Dali.getImprovement(id); if (it && ['în analiză', 'în lucru', 'în revizuire'].includes(it.status)) throw { status: 400, message: 'Nu se poate șterge cât timp e în analiză, în lucru sau în revizuire.' }; await Dali.deleteImprovement(id); return { ok: true }; });
on('GET', '/api/improvements.md', async (_, __, ___, res) => { res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8', 'content-disposition': 'attachment; filename="imbunatatiri-wonderpages.md"' }); res.end(Dali.improvementsMarkdown()); return null; });
on('POST', '/api/projects/:pid/deliver', async ({ pid }, _, url) => {
  const p0 = need(pid); const vq = url.searchParams.get('volume'); const vol = vq == null || vq === 'all' ? null : Number(vq);
  if (vol != null && !(Number.isInteger(vol) && vol >= 0 && vol < 60)) throw { status: 400, message: 'Volum invalid.' };
  if (!volumeApproved(p0, await repo.getBlueprint(pid), vol, await repo.artifacts(pid))) throw { status: 409, message: vol == null ? 'Livrarea completă e posibilă doar după ce ai aprobat toate volumele.' : `Volumul ${vol + 1} nu are încă aprobarea finală dată de tine; livrarea nu e permisă.` };
  assertSafeRelease(p0, await repo.getBlueprint(pid), await repo.artifacts(pid), vol);   // P5-T01
  const job = Render.startRender({ port: config.port, pid, vol, preset: url.searchParams.get('preset') || 'digital', onUpdate: j => repo.patchProject(pid, { rendering: { job: j.id, vol: j.vol, label: j.label, i: j.i, n: j.n, finished: j.finished, ok: j.ok ?? null, message: j.message || '', at: now() } }).catch(() => {}) });
  return { job };
});
on('POST', '/api/render/:job/progress', async ({ job }, req) => { if (!LAN.isLocal(req)) throw { status: 403, message: 'Doar pe laptop.' }; return { ok: Render.progress(job, await json(req)) }; });
on('POST', '/api/render/:job/done', async ({ job }, req) => { if (!LAN.isLocal(req)) throw { status: 403, message: 'Doar pe laptop.' }; const b = await json(req); return { ok: Render.finish(job, b.ok, b.message, b.result) }; });
on('POST', '/api/projects/:pid/items', async ({ pid }, req) => { need(pid); const b = await json(req); return setItemDecisions(pid, b.decisions || [], commandCtx(req, b)); });
on('POST', '/api/projects/:pid/items/apply', async ({ pid }) => { need(pid); if (RUNNING[pid]) throw { status: 409, message: 'Se lucrează deja la proiect.' }; assertCanWork(pid); applyItemChanges(pid); return { ok: true }; });
on('POST', '/api/projects/:pid/gate/complete', async ({ pid }, req) => { need(pid); const b = await json(req).catch(() => ({})); await completeGate(pid, commandCtx(req, b)); return { ok: true }; });
on('POST', '/api/projects/:pid/decide', async ({ pid }, req) => { need(pid); const b = await json(req); if (b.decision === 'needs_correction') assertCanWork(pid); await decide(pid, b, commandCtx(req, b)); return { ok: true }; });
on('POST', '/api/projects/:pid/task', async ({ pid }, req) => {
  need(pid); if (RUNNING[pid]) throw { status: 409, message: 'Proiectul rulează deja.' }; assertCanWork(pid);
  const b = await json(req); if (!Array.isArray(b.targets) || !b.targets.length) throw { status: 400, message: 'Lipsesc țintele.' };
  await repo.logEvent(pid, 'redo', { targets: b.targets, feedback: b.feedback || '' });
  runTask(pid, { targets: b.targets, feedback: b.feedback || '', redoStage: b.redoStage || null, label: b.label || 'Modificări', gateKey: null });
  return { ok: true };
});
on('POST', '/api/projects/:pid/archive', async ({ pid }, req) => {
  const p = need(pid); const { archived } = await json(req);
  if (archived) await repo.patchProject(pid, { status: 'archived', prevStatus: p.status });
  else await repo.patchProject(pid, { status: p.prevStatus && p.prevStatus !== 'archived' ? p.prevStatus : 'paused' });
  return { ok: true };
});
on('POST', '/api/projects/:pid/artifacts/:key', async ({ pid, key }, req) => {
  need(pid); const { content, note, expectedVersion, expectedRevision } = await json(req); const commandId = commandIdOf(req);
  if (RUNNING[pid]) throw { status: 409, message: 'Așteaptă terminarea operației înainte de editare.' };
  const bp = await repo.getBlueprint(pid);
  if (/^(script|final|tr)_\d+$/.test(key) && !pageSequence(content?.pages, bp.structure.pages)) throw { status: 400, message: 'Paginile trebuie numerotate unic, în ordine, de la 1 la ' + bp.structure.pages + '.' };
  const prev = (await repo.artifacts(pid))[key], impact = impactForWrite(bp, await repo.artifacts(pid), key, content);   // P2-T02: computed before the write
  const doc = await repo.writeArtifact(pid, key, content, { by: 'user', note: note || 'Editare manuală', meta: prev?.meta || {}, commandId, expectedVersion: Number.isInteger(expectedVersion) ? expectedVersion : undefined, expectedRevision: Number.isInteger(expectedRevision) ? expectedRevision : undefined });
  if (doc !== prev) await repo.logEvent(pid, 'manual_edit', { key, note, before: prev?.content ?? null, after: content });
  // Manual corrections are local. Their event is available to the later volume retrospective.
  return { ok: true, version: doc.version, revision: repo.getProject(pid).revision, impact: doc !== prev ? impact : null };
});
on('GET', '/api/projects/:pid/artifacts/:key/history', async ({pid,key}) => { need(pid); const a=(await repo.artifacts(pid))[key]; if(!a) throw {status:404,message:'Document inexistent.'}; await backfillVersions(storage,pid,key,a); const set=await variantSet(storage,pid,key,a); const all=(await listVersions(storage,pid,key)).filter(v=>v.version!==a.version).sort((x,y)=>y.version-x.version); return {current:a,versions:all.map(v=>({version:v.version,content:v.content,meta:v.meta,basedOn:v.basedOn,by:v.by,note:v.note,at:v.at,pinned:v.pinned,pins:v.pins,restoredFrom:v.restoredFrom||null})),variants:set}; });   // P2-T03: full immutable history
on('GET', '/api/projects/:pid/variants/:key', async ({pid,key}) => { need(pid); const a=(await repo.artifacts(pid))[key]; if(!a) throw {status:404,message:'Document inexistent.'}; await backfillVersions(storage,pid,key,a); return variantSet(storage,pid,key,a); });
on('POST', '/api/projects/:pid/variants/:key/pin', async ({pid,key},req) => { localOnly(req); need(pid); const b=await json(req); const d=await pinVersion(storage,pid,key,Number(b.version),{reason:'operator',ref:{note:String(b.note||'').slice(0,200)},actor:'operator'}); if(!d) throw {status:404,message:'Versiune inexistentă.'}; return {version:d.version,pins:d.pins}; });
on('GET', '/api/projects/:pid/retention', async ({pid},_,url) => { need(pid); return retentionPlan(storage,pid,await repo.artifacts(pid),{keepUnpinned:Math.max(1,Math.min(50,Number(url.searchParams.get('keep'))||5))}); });
on('POST', '/api/projects/:pid/retention/apply', async ({pid},req) => { localOnly(req); need(pid); if(RUNNING[pid]) throw {status:409,message:'Așteaptă operația activă.'}; const b=await json(req); return applyRetention(storage,pid,await repo.artifacts(pid),String(b.planHash||''),{keepUnpinned:Math.max(1,Math.min(50,Number(b.keep)||5))}); });
on('POST', '/api/projects/:pid/artifacts/:key/restore', async ({pid,key},req) => {
  need(pid); if(RUNNING[pid]) throw {status:409,message:'Așteaptă operația activă.'};
  /* P2-T03: restore reads the immutable version store (legacy embedded history as fallback) and writes a NEW version with lineage */
  const {version}=await json(req), a=(await repo.artifacts(pid))[key];
  const stored=await getVersion(storage,pid,key,Number(version)), old=stored||a?.versions?.find(v=>v.version===Number(version));
  if(!old) throw {status:404,message:'Versiunea nu mai există în istoric.'};
  if(stored&&canonicalHash(stored.content??null)!==stored.hash) throw {status:409,code:'version_corrupt',message:'Versiunea salvată nu mai corespunde amprentei sale; nu o restaurez.'};
  const content=clone(old.content); if(/^ill_/.test(key)) for(const file of [content.color,content.lineart].filter(Boolean)) await repo.readFile(pid,file);
  const doc=await repo.writeArtifact(pid,key,content,{by:'user',note:'Restaurat din versiunea '+version,meta:old.meta,basedOn:old.basedOn,keep:10,restoredFrom:{version:Number(version),hash:stored?.hash||canonicalHash(old.content??null)}});
  const rebound=await rebindDependents(repo,pid,key,doc); return {ok:true,version:doc.version,restoredFrom:Number(version),rebound};
});
on('POST', '/api/projects/:pid/artifacts/:key/media', async ({pid,key},req) => {
  need(pid); if(RUNNING[pid]) throw {status:409,message:'Așteaptă operația activă.'};
  if(!/^ill_\d+_\d+$/.test(key)) throw {status:400,message:'Alege o pagină ilustrată.'};
  const b=await json(req), mode=b.mode==='line'?'line':'color', buf=Buffer.from(String(b.data||''),'base64');
  const png=buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])), jpg=buf[0]===255&&buf[1]===216&&buf[2]===255;
  if(!buf.length || (!png&&!jpg)) throw {status:400,message:'Încarcă un PNG sau JPEG valid.'};
  const a=(await repo.artifacts(pid))[key], c=clone(a?.content||{}); if(mode==='line'&&!c.color) throw {status:409,message:'Pagina de colorat cere o culoare acceptată.'};
  if(mode==='line') { const { coloringQA }=await import('./quality/coloring.js'); if(!png) throw {status:400,message:'Pagina de colorat trebuie să fie PNG.'}; const bp=await repo.getBlueprint(pid), [, v0, p0]=key.split('_').map(Number), art0=await repo.artifacts(pid), srcA=art0['final_'+v0]||art0['script_'+v0]; const check=coloringQA(buf,{bp,project:need(pid),page:srcA?.content?.pages?.[p0-1]||null,ill:c}); if(!check.ok) throw {status:400,message:'Pagina de colorat: '+check.issues.join(', '),metrics:check.physical?.metrics}; c.lineQA=check; }   // P6-T03: measured at print size
  const file=await repo.saveFile(pid,'images/'+key+'-manual-'+Date.now()+'.'+(png?'png':'jpg'),buf);
  if(mode==='color') {c.color=file;c.mediaId=null;c.link=null;c.linePending=true;c.qa=null;} else {c.lineart=file;c.lineFrom=c.color;c.linePending=false;c.lineQA={...c.lineQA,for:file,colorFrom:c.color};}
  c.engine=c.engine || need(pid).options?.image_engine || IMAGE_DEFAULT.engine;c.provenance='manual-upload';if(mode==='color'&&b.review===true)c.qa={ok:true,failed:[],issues:[],source:'human',color:file,at:now()}; await repo.writeArtifact(pid,key,c,{by:'user',note:'Imagine corectată manual: '+mode,keep:10});return {ok:true,file};
});
on('POST', '/api/projects/:pid/comments', async ({ pid }, req) => { need(pid); const c = await repo.addComment(pid, { ...cleanComment(await json(req)), author: LAN.isLocal(req) ? 'local' : 'rețea' }); await repo.logEvent(pid, 'comment', c); return c; });
on('PATCH', '/api/projects/:pid/comments/:cid', async ({ pid, cid }, req) => { need(pid); const b = await json(req); if (!['open', 'resolved', 'addressed'].includes(b.status)) throw { status: 400, message: 'Stare invalidă.' }; return repo.patchComment(pid, cid, { status: b.status }); });
on('GET', '/api/projects/:pid/print-plan', async ({ pid }, _, url) => {
  const p = need(pid), bp = await repo.getBlueprint(pid), book = (bp.structure.books || []).find(b => b.key === url.searchParams.get('book'));
  if (!book) throw { status: 400, message: 'Carte necunoscută.' };
  const profile = url.searchParams.get('profile') === 'kdp' ? 'kdp' : 'digital', format = bp.formats?.[p.input?.[bp.format_key]];
  const pages = physicalPages(bp.structure.pages, book.mode, profile, book.back_cover);
  if (profile === 'kdp' && pages.length < 24) throw { status: 409, message: 'Interiorul nu îndeplinește numărul minim de pagini pentru acest profil.' };
  /* P6-T04: versioned profile, physical→canonical map, ink/paper/gutter/cover rules (dated), approval of the legacy presentation */
  const check = destinationCheck({ count: bp.structure.pages, book, profile, ink: url.searchParams.get('ink') || p.printProfiles?.[profile]?.[book.key]?.ink || null, paper: url.searchParams.get('paper') || p.printProfiles?.[profile]?.[book.key]?.paper || 'white', approval: p.printProfiles?.[profile]?.[book.key] || null });
  return { profile, pages, ...printDimensions(format, profile), separateCover: profile === 'kdp', sourceScenes: bp.structure.pages, colourSpace: 'RGB', publicationValidated: false, semantics: profile === 'kdp' ? 'legacy-scene-expansion' : 'strict12', canonicalContentPages: bp.structure.pages,
    check: { ...check, map: undefined }, map: check.map, cover: profile === 'kdp' ? coverWrap(format, check) : null, approved: !!check.approved, status: check.status };
});
on('POST', '/api/projects/:pid/exports', async ({ pid }, req, url) => {
  need(pid); const name = (url.searchParams.get('name') || 'export.pdf').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^\.+/, '');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,150}\.pdf$/i.test(name)) throw { status: 400, message: 'Se pot salva doar fișiere PDF.' };   // audit C1
  const buf = await readBody(req, 200 * 1024 * 1024); if (buf.subarray(0, 5).toString('latin1') !== '%PDF-') throw { status: 400, message: 'Conținutul nu este un PDF.' };
  const p = need(pid), bp = await repo.getBlueprint(pid), art = await repo.artifacts(pid);
  const final = url.searchParams.get('kind') === 'final', vol = Number(url.searchParams.get('volume'));
  if(final && (!/%%EOF/.test(buf.subarray(-1024).toString('latin1')) || !/\/Type\s*\/Pages/.test(buf.toString('latin1')))) throw {status:400,message:'PDF final incomplet.'};
  if (final && url.searchParams.get('preset') === 'kdp') { const bk = (bp.structure.books || []).find(b => b.key === String(url.searchParams.get('book') || '').replace(/-cover$/, '')); const ap = bk && p.printProfiles?.kdp?.[bk.key]; const ck = bk && destinationCheck({ count: bp.structure.pages, book: bk, profile: 'kdp', ink: ap?.ink, paper: ap?.paper || 'white', approval: ap }); if (!ck?.approved) throw { status: 409, code: 'profile_not_approved', message: 'Prezentarea legacy KDP (Poveste 28 / Colorat 26) nu este aprobată pentru această carte; aprob-o în Livrare înaintea exportului final.' }; }   // P6-T04
  if (final && (RUNNING[pid] || url.searchParams.get('fingerprint') !== deliveryFingerprint(p,bp,art,vol))) throw {status:409,message:'Conținutul s-a schimbat în timpul randării; regenerează PDF-ul.'};
  if (final && !volumeApproved(p, bp, vol, art)) throw { status: 409, message: 'Conținutul curent trebuie aprobat înaintea livrării finale.' };
  if (final) assertSafeRelease(p, bp, art, vol);   // P5-T01
  const book = url.searchParams.get('book'), lang = url.searchParams.get('lang') || 'first';
  if (final && !requiredBooks(p, bp).some(b => (b.book === book || (url.searchParams.get('preset') === 'kdp' && b.book + '-cover' === book)) && b.lang === lang)) throw { status: 400, message: 'Carte sau limbă necunoscută.' };
  const dims = final ? validateFinalPdf(buf,bp,p,{book,preset:url.searchParams.get('preset')}) : null;
  /* P6-T01: the export carries the measurement hash it rendered; it must equal the current plan (same as the preview) */
  const layoutHash = url.searchParams.get('layout'), interior = !/-cover$/.test(book || '');
  let layoutPlan = null; if ((final || layoutHash) && interior && Number.isInteger(vol)) layoutPlan = await measuredLayout(repo, pid, p, bp, art, vol, url.searchParams.get('preset') || 'digital');
  if (layoutPlan && layoutHash && layoutHash !== layoutPlan.measurementHash) throw { status: 409, code: 'stale_layout', message: 'Măsurarea machetei din export diferă de cea curentă (previzualizare); regenerează PDF-ul.' };
  if (final && layoutPlan?.blocking) throw { status: 409, code: 'layout_blocked', message: 'Macheta are probleme blocante: ' + layoutPlan.findings.filter(f => f.blocking).slice(0, 3).map(f => f.message).join(' ') };
  /* P6-T05: independent inspection of the final file (fonts used are embedded, no .notdef, text in the safe area, placed image DPI) */
  let inspection = null;
  if (final) { const presetKey = url.searchParams.get('preset'), print = ['print', 'kdp'].includes(presetKey), ins = inspectPdf(buf), bk0 = (bp.structure.books || []).find(b => b.key === book), lang0 = url.searchParams.get('lang') || 'first', expectText = bk0 && bk0.mode !== 'lineart' && bk0.page_text !== false && layoutPlan ? layoutPlan.pages.flatMap(x => x.textBlocks?.[lang0]?.lines || []) : [], chk = checkInspection(ins, { pages: dims.pages, widthIn: dims.width, heightIn: dims.height, minDpi: print ? 300 : 0, safeIn: 0.25, expectText });
    if (!chk.ok) throw { status: 400, code: 'pdf_inspection', message: 'Inspecția independentă a PDF-ului a eșuat: ' + chk.problems.slice(0, 3).map(x => x.message).join(' '), problems: chk.problems.slice(0, 20) };
    inspection = { version: ins.version, ok: true, pages: ins.pageCount, fonts: ins.fontsUsed.map(f => ({ baseFont: f.baseFont, embedded: f.embedded })), minPlacedDpi: Math.min(Infinity, ...ins.pages.flatMap(x => x.images.map(i => i.dpi))) };
    if (print && !/-cover$/.test(book || '')) {   // the canvas is rasterised at 300 DPI: the SOURCE art must really have it (crop included, upscaling estimated)
      const bk = (bp.structure.books || []).find(b => b.key === book), lp = await measuredLayout(repo, pid, p, bp, art, vol, presetKey), g = lp.geometry.pt, low = [];
      for (let pg = 0; pg <= bp.structure.pages; pg++) { const c = art[`ill_${vol}_${pg}`]?.content, file = bk?.mode === 'lineart' ? c?.lineart : c?.color; if (!file) continue; const r = await imageResolution(file, { readFile: f => repo.readFile(pid, f), crop: pg > 0 ? lp.pages.find(x => x.n === pg)?.crop : null, pageWIn: g.w / 72, pageHIn: g.h / 72, minDpi: 300 }); if (r.status === 'fail') low.push(`pagina ${pg}: ${r.width}×${r.height} px → ${r.effectiveDpi} DPI efectiv${r.nativeEstimate?.suspectedUpscale ? ` (mărită ~${r.nativeEstimate.factor}×, ~${r.nativeDpi} DPI nativ)` : ''}`); }
      if (low.length) throw { status: 409, code: 'low_resolution', message: 'Arta sursă nu are 300 DPI efectivi la tipar: ' + low.slice(0, 4).join('; ') + '.', pages: low };
    } }
  const dir = path.join(projectFolder(p), ...(final ? ['PDF'] : ['Preview', 'PDF']));
  await fs.mkdir(dir, { recursive: true }); await fs.writeFile(path.join(dir, name), buf);
  if (final) {
    const key = 'delivery_' + vol, old = art[key]?.content?.exports || [], receipt = { name, book, lang, preset: url.searchParams.get('preset'), kind: 'final', fingerprint: deliveryFingerprint(p, bp, art, vol), layout: layoutPlan ? (layoutHash ? { measurementHash: layoutHash, verified: true } : { measurementHash: layoutPlan.measurementHash, verified: false }) : null, inspection, bytes: buf.length, sha256: fileHash(buf), at: now() };
    await repo.writeArtifact(pid, key, { exports: [...old.filter(e => !(e.book === book && e.lang === lang)), receipt] }, { by: 'export', note: 'PDF al versiunii aprobate' });
    for (const [k, a] of Object.entries(await repo.artifacts(pid))) if (new RegExp(`^(final|tr|ill)_${vol}(_\\d+)?$`).test(k)) await pinVersion(storage, pid, k, a.version, { reason: 'released', ref: { receipt: receipt.sha256, book, lang }, actor: 'export' });   // P2-T03
  }
  return { ok: true, kind: final ? 'final' : 'preview', path: path.join(dir, name) };
});
on('POST', '/api/projects/:pid/package', async ({ pid }, _, url) => { const vol = url.searchParams.has('volume') ? Number(url.searchParams.get('volume')) : null; const p0 = need(pid); const bp0 = await repo.getBlueprint(pid);
  if (vol != null && !(Number.isInteger(vol) && vol >= 0 && vol < 60)) throw { status: 400, message: 'Volum invalid.' };
  const art0 = await repo.artifacts(pid);
  if (!volumeApproved(p0, bp0, vol, art0)) throw { status: 409, code: 'release_blocked', errors: releaseCheck(p0, bp0, art0, vol, { approved: false }).blockers, message: vol == null ? 'Colecția nu are toate porțile aprobate de tine; pachetul colecției nu se face.' : `Volumul ${vol + 1} nu are încă aprobarea finală dată de tine; pachetul nu se face.` };
  { const rc = releaseCheck(p0, bp0, art0, vol, { approved: true, safety: safetyOf(p0, bp0, art0, vol), quality: qualityOf(p0, bp0, art0, vol) }); if (!rc.eligible) throw { status: 409, code: 'release_blocked', errors: rc.blockers, message: 'Inventarul livrării este incomplet: ' + rc.blockers.slice(0, 3).map(b => b.message).join(' ') }; }   // P2-T04
  const r = await buildPackage(repo, p0, { vol, approved: v => volumeApproved(p0, bp0, v, art0) });
  r.commercialRights = (await projectRights(pid)).commercial;   // P1-T05: the package is internal delivery; commercial eligibility is reported, not implied
  try { r.mirror = await mirrorDelivery([r.folder, r.zip]); } catch (e) { r.mirrorError = 'Copia în al doilea folder nu a reușit: ' + e.message; } if (r.final) await repo.patchProject(pid, vol == null ? { packagedAt: now(), packagePath: r.folder } : { delivered: { [vol]: { at: now(), zip: r.zip } } }); return r; });
on('GET', '/api/projects/:pid/package.zip', async ({ pid }, _, url, res) => {
  const vq=url.searchParams.get('volume'),p=need(pid),v=vq==null?null:Number(vq);
  if(v!=null&&(!Number.isInteger(v)||v<0||v>= (await repo.getBlueprint(pid)).structure.volumes))throw {status:400,message:'Volum invalid.'};
  if(!volumeApproved(p,await repo.getBlueprint(pid),v,await repo.artifacts(pid)))throw {status:409,message:'Conținutul curent trebuie aprobat.'};
  const zip=await checkedPackage(repo,p,v);
  try { const st = await fs.stat(zip); res.writeHead(200, { 'content-type': 'application/zip', 'content-length': st.size, 'content-disposition': `attachment; filename="${encodeURIComponent(path.basename(zip))}"` }); (await import('node:fs')).createReadStream(zip).pipe(res); }
  catch { send(res, 404, { message: 'Pachetul nu a fost generat încă.' }); }
  return null;
});
on('POST', '/api/projects/:pid/open-folder', async ({ pid }, req) => { localOnly(req); const dir = projectFolder(need(pid)); await fs.mkdir(dir, { recursive: true }); openFolder(dir); return { ok: true, path: dir }; });
on('POST', '/api/claude/login', async (_, req) => { localOnly(req); openLoginWindow(); return { ok: true }; });
on('POST', '/api/claude/check', async (_, req) => { localOnly(req); const r = await verifyClaude(); await Capabilities.recordRealProbe('claude-code-text', r.auth?.ok === true, { model: config.claudeCode.lightModel, note: 'verificare inițiată de operator' }); bus.emit('change', { scope: 'projects' }); return r; });
on('GET', '/api/capabilities', async () => ({ ...Capabilities.getCapabilities(), host: hostConfig({ storage: storage.describe().kind, dataDir: config.storage.dataDir }) }));   // P1-T03
on('POST', '/api/capabilities/discover', async (_, req) => { localOnly(req); return Capabilities.runDiscovery(); });
/* Google Drive for desktop shows up as a drive (e.g. G:) with a "My Drive" folder: no Google Cloud setup needed */
const DRIVE_NAMES = ['My Drive', 'Drive-ul meu', 'Drive-ul Meu', 'Mi unidad', 'Meine Ablage', 'Mon Drive', 'Il mio Drive', 'Meu Drive', 'Mijn Drive'];
async function googleDriveFolders() {
  const bases = process.platform === 'win32' ? 'DEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => `${l}:\\`) : [];
  bases.push(os.homedir(), path.join(os.homedir(), 'Google Drive'));
  const out = [];
  for (const b of bases) for (const n of DRIVE_NAMES) { const p = path.join(b, n); try { if ((await fs.stat(p)).isDirectory()) out.push(p); } catch {} }
  return [...new Set(out)];
}
on('GET', '/api/fs/google-drive', async (_, req) => { localOnly(req); const found = await googleDriveFolders(); return { found, suggested: found[0] ? path.join(found[0], 'WonderPages') : null }; });
on('GET', '/api/fs/list', async (_, req, url) => {
  localOnly(req); const p = url.searchParams.get('path') || '';
  if (!p) { const roots = process.platform === 'win32' ? (await Promise.all('CDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(async l => { try { await fs.access(`${l}:\\`); return `${l}:\\`; } catch { return null; } }))).filter(Boolean) : ['/']; return { path: '', parent: null, dirs: [...roots, os.homedir()].map(d => ({ name: d, path: d })) }; }
  const abs = path.resolve(p); let items = [];
  try { items = (await fs.readdir(abs, { withFileTypes: true })).filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('$')).map(d => ({ name: d.name, path: path.join(abs, d.name) })).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 300); }
  catch (e) { throw { status: 400, message: 'Nu pot deschide folderul: ' + e.message }; }
  const parent = path.dirname(abs) === abs ? '' : path.dirname(abs);
  return { path: abs, parent, dirs: items };
});
on('PUT', '/api/settings/output-mirror', async (_, req) => {
  localOnly(req); const { dir } = await json(req);
  if (dir) { if (!path.isAbsolute(dir)) throw { status: 400, message: 'Scrie o cale completă.' }; try { await fs.mkdir(dir, { recursive: true }); const t = path.join(dir, '.wonderpages-test'); await fs.writeFile(t, 'ok'); await fs.rm(t); } catch (e) { throw { status: 400, message: 'Nu pot scrie în acest folder: ' + e.message }; } }
  SETTINGS.outputMirror = dir || null; setOutputMirror(SETTINGS.outputMirror); await storage.writeJSON('settings.json', SETTINGS); bus.emit('change', { scope: 'projects' }); return { ok: true, dir: SETTINGS.outputMirror };
});
on('PUT', '/api/settings/output', async (_, req) => { localOnly(req);
  const { dir } = await json(req); if (!dir || !path.isAbsolute(dir)) throw { status: 400, message: 'Scrie o cale completă, de exemplu D:\\Carti\\WonderPages.' };
  try { await fs.mkdir(dir, { recursive: true }); const t = path.join(dir, '.wonderpages-test'); await fs.writeFile(t, 'ok'); await fs.rm(t); } catch (e) { throw { status: 400, message: 'Nu pot scrie în acest folder: ' + e.message }; }
  SETTINGS.outputDir = dir; setOutputDir(dir); await storage.writeJSON('settings.json', SETTINGS); bus.emit('change', { scope: 'projects' }); return { ok: true, dir };
});
on('PUT', '/api/settings/drive-folder', async (_, req) => { localOnly(req); const r = await gdrive.chooseFolder((await json(req)).folder || ''); bus.emit('change', { scope: 'projects' }); return r; });
on('GET', '/api/agents', async () => ({ agents: listAgents(), lessons: listLessons() }));
on('GET', '/api/projects/:pid/jobs', async ({ pid }) => { need(pid); return { jobs: await EngineMod.jobs.list(pid) }; });   // P3-T03
on('POST', '/api/projects/:pid/jobs/:key/resolve', async ({ pid, key }, req) => { localOnly(req); need(pid); if (RUNNING[pid]) throw { status: 409, message: 'Așteaptă operația activă.' }; const b = await json(req); return EngineMod.jobs.resolve(pid, decodeURIComponent(key), String(b.action || ''), 'operator@laptop'); });
on('GET', '/api/agents/registry', async () => { const r = AgentsMod.registry(); return { contracts: r.contracts?.roles || {}, skills: r.contracts?.skills || {}, validation: r.contracts?.errors || [], profiles: r.profiles }; });   // P3-T01
on('PUT', '/api/agents/:id', async ({ id }, req) => { localOnly(req); return updateAgent(id, await json(req)); });
/* network access: configured only from the laptop itself */
/* P2-T01: an operator command may carry an idempotency key; a repeated key returns the first result */
/* P2-T04: who decided (laptop operator or an authenticated LAN device), on which revision, with which idempotency key */
const commandCtx = (req, b = {}) => ({ actor: LAN.isLocal(req) ? 'operator@laptop' : 'operator@lan', expectedRevision: Number.isInteger(b.expectedRevision) ? b.expectedRevision : undefined, commandId: commandIdOf(req) });
const commandIdOf = req => { const c = String(req.headers['x-wp-command'] || ''); if (!c) return undefined; if (!/^[A-Za-z0-9_.-]{8,120}$/.test(c)) throw { status: 400, message: 'Identificator de comandă invalid.' }; return c; };
on('GET', '/api/schema', async () => schemaStatus(storage));
registerEnterpriseRoutes({ on, json, need, localOnly, repo, storage, commandIdOf, readBody });
const securityMode = () => transportMode({ lanEnabled: LAN.lanEnabled(), tlsEnabled: tlsEnabled(), acceptPlainLan: !!SETTINGS.acceptPlainLan });   // P1-T04
on('GET', '/api/security/posture', async (_, req) => { localOnly(req); return postureReport({ mode: securityMode(), bindHost: boundHost, storage: storage.describe().kind, legacyDbCredentials: !!storage.describe().legacyCredentials, tlsEnabled: tlsEnabled(), lanStatus: LAN.status() }); });
on('PUT', '/api/settings/lan-transport', async (_, req) => { localOnly(req); const b = await json(req); SETTINGS.acceptPlainLan = b.acceptPlainLan === true; await storage.writeJSON('settings.json', SETTINGS); return { mode: securityMode(), acceptPlainLan: SETTINGS.acceptPlainLan }; });
on('PUT', '/api/settings/lan', async (_, req) => { localOnly(req); const r = await LAN.configure(await json(req)); await relisten(); bus.emit('change', { scope: 'projects' }); return r; });
on('POST', '/api/settings/lan/logout-all', async (_, req) => { localOnly(req); await LAN.logoutAll(); dropUnauthorized(); return { ok: true }; });
on('GET', '/api/lan/qr', async (_, req) => { localOnly(req); await LAN.refreshPrimary().catch(() => {}); const u = LAN.lanUrls(config.port)[0]; return { url: u || null, svg: u ? await LAN.qrSvg(u) : null }; });
on('POST', '/auth/login', async (_, req, __, res) => { await LAN.login(req, res, (await json(req)).code); send(res, 200, { ok: true }); return null; });
on('PUT', '/api/settings/images', async (_, req) => { localOnly(req); const b = await json(req); if (['canva', 'chatgpt'].includes(b.engine)) SETTINGS.imageEngine = IMAGE_DEFAULT.engine = b.engine; if (b.fallback != null) SETTINGS.imageFallback = IMAGE_DEFAULT.fallback = !!b.fallback; await storage.writeJSON('settings.json', SETTINGS); return { engine: IMAGE_DEFAULT.engine, fallback: IMAGE_DEFAULT.fallback }; });
on('POST', '/api/chatgpt/check', async (_, req) => { localOnly(req); return GPTImage.checkCodex(); });
on('POST', '/api/chatgpt/text-test', async (_, req) => {
  localOnly(req);
  const reply = await runCodexText('Return the requested JSON object with ok set to OK.', { model: 'gpt-6-sol', reasoning: 'medium', schema: { type: 'object', properties: { ok: { type: 'string' } }, required: ['ok'], additionalProperties: false } });
  let result; try { result = JSON.parse(reply); } catch { result = null; }
  await Capabilities.recordRealProbe('codex-text', result?.ok === 'OK', { model: 'gpt-6-sol', note: 'test text inițiat de operator' });
  return { ok: result?.ok === 'OK', reply: reply.slice(0, 100) };
});
on('POST', '/api/chatgpt/login', async (_, req) => { localOnly(req); GPTImage.openCodexLogin(); return { ok: true }; });
on('POST', '/api/chatgpt/test', async (_, req) => { localOnly(req); const r = await GPTImage.generate({ prompt: 'A small friendly turquoise robot waving, simple flat illustration, white background.', aspectRatio: 'SQUARE_1_1', timeoutMs: 5 * 60e3 }); const rel = `tests/chatgpt-test-${Date.now()}.png`; await storage.writeFile(rel, r.buffer); await Capabilities.recordRealProbe('codex-image', true, { note: 'test imagine inițiat de operator' }); return { ok: true, bytes: r.buffer.length }; });
on('PUT', '/api/projects/:pid/options', async ({ pid }, req) => { const p = need(pid); const b = await json(req); const o = {}; if (['canva', 'chatgpt'].includes(b.image_engine)) o.image_engine = b.image_engine; if (b.image_fallback != null) o.image_fallback = !!b.image_fallback; await repo.patchProject(pid, { options: { ...p.options, ...o } }); return { ok: true }; });
on('GET', '/api/projects/:pid/export.zip', async ({ pid }, _, __, res) => { const f = await exportProject(repo, storage, need(pid)); const buf = await fs.readFile(f); res.writeHead(200, { 'content-type': 'application/zip', 'content-disposition': `attachment; filename="${path.basename(f)}"` }); res.end(buf); fs.rm(f).catch(() => {}); return null; });
on('POST', '/api/projects/import', async (_, req) => { localOnly(req); const p = await importProject(repo, storage, await readBody(req, 600 * 1024 * 1024)); return { id: p.id, title: p.title }; });
on('PUT', '/api/settings/canva', async (_, req) => { localOnly(req); return setCanvaSettings(await json(req)); });
on('GET', '/api/training', async () => ({ packs: Training.listPacks(), knownFailures: Learning.knownFailures() }));
on('POST', '/api/training/import', async (_, req) => { localOnly(req); return Training.importPack(await readBody(req, 200 * 1024 * 1024)); });
on('DELETE', '/api/training/:id', async ({ id }, req) => { localOnly(req); await Training.deletePack(id); return { ok: true }; });
on('GET', '/api/training/:id/file', async ({ id }, _, url, res) => { const rel = url.searchParams.get('path') || ''; const b = await Training.packFile(id, rel).catch(() => null); if (!b) { send(res, 404, { message: 'Fișier inexistent.' }); return null; } sendUserFile(res, rel, b); return null; });
on('PUT', '/api/settings/budget', async (_, req) => { localOnly(req); const b = await json(req); const out = {}; if (b.budget5h != null) out.budget5h = await setBudget(b.budget5h); if (b.budget7d != null) out.budget7d = await setWeeklyBudget(b.budget7d); return out; });
/* v19 (plan 2.5): what a collection will cost, from your own finished volumes (or a first estimate), against what is left this week */
on('GET', '/api/estimate', async (_, __, url) => {
  const vols = Math.max(1, Math.min(20, Number(url.searchParams.get('volumes')) || 6)); const pv = Ledger.perVolume(); const u = usage(); const cu = canvaUsage();
  const text = pv.collection + pv.text * vols, image = pv.image * vols;
  return { volumes: vols, text, image, measured: pv.measured, samples: pv.samples, used7d: u.text7d, budget7d: u.budget7d, fitsWeek: u.budget7d > 0 ? u.text7d + text <= u.budget7d : null, canvaRemaining: cu.remaining, fitsCanva: image <= cu.remaining, windows5h: Math.ceil(text / Math.max(1, u.budget5h)) };
});
on('DELETE', '/api/projects/:pid', async ({ pid }, req) => {
  localOnly(req);
  const p = need(pid);
  const c = String((await json(req).catch(() => ({}))).confirm || '').trim().toUpperCase();
  if (!['ȘTERGE', 'STERGE', 'ŞTERGE'].includes(c)) throw { status: 400, message: 'Scrie ȘTERGE ca să confirmi.' };
  if (RUNNING[pid] || ['running', 'correcting'].includes(p.status)) throw { status: 409, message: 'Pune proiectul pe pauză înainte să îl ștergi.' };
  const release = await quietProjectBackground(pid);
  try { await Events.purgeProject(pid); return await Purge.purgeProject({ repo, storage, gdrive, p: clone(p) }); }   // P3-T06: the event stream forgets the id first, so the clean backup made by the purge has no trace either
  finally { release(); }
});
/* backups of the database: list, make one now, restore one (audit M7) — laptop only */
on('GET', '/api/backups', async (_, req) => { localOnly(req); const [sql,snapshots]=await Promise.all([storage.kind === 'postgres' ? listBackups() : [],listSnapshots(path.join(outputDir(),'_backup'))]);return {kind:storage.kind,items:[...sql,...snapshots].sort((a,b)=>b.at-a.at)}; });
on('POST', '/api/backups', async (_, req) => { localOnly(req); return exclusiveStorage(async()=>{const file='backup-v03-'+Date.now()+'.wbackup',folder=path.join(outputDir(),'_backup',file);await saveSnapshot(storage,folder);return {ok:true,file,mirror:await mirrorBackup(folder)};}); });
on('POST', '/api/backups/restore', async (_, req) => {
  localOnly(req); const b = await json(req); return exclusiveStorage(async()=>{
  if (!['RESTAUREAZĂ', 'RESTAUREAZA', 'RESTAUREAZǍ'].includes(String(b.confirm || '').trim().toUpperCase())) throw { status: 400, message: 'Scrie RESTAUREAZĂ ca să confirmi.' };
  const a = activeProject(); if (a || Object.keys(RUNNING).length) throw { status: 409, message: `Lucrează acum „${a?.title || 'un proiect'}”. Pune-l pe pauză, apoi restaurează.` };
  let r;if(/^backup-v03-\d+\.wbackup$/.test(String(b.file))){const safety='backup-v03-'+Date.now()+'.wbackup';await Promise.all([flushGovernor(),flushAgents(),Learning.flushLearning(),Ledger.flushLedger(),flushRepo()]);await saveSnapshot(storage,path.join(outputDir(),'_backup',safety));r={...(await restoreSnapshot(storage,path.join(outputDir(),'_backup',b.file))),safety};await reloadPersistent();}else{if(storage.kind!=='postgres')throw {status:400,message:'Backup incompatibil.'};r=await restoreBackup(b.file);await reloadPersistent();}
  const auto = process.env.WP_BG === '1'; if (auto) setTimeout(() => process.exit(0), 1500);   // the app reloads everything from the restored database
  return { ok: true, ...r, restart: auto ? 'auto' : 'manual' };
  });
});
on('GET', '/api/diagnostic', async () => {
  const out = []; const add = (name, ok, detail) => out.push({ name, ok, detail });
  try { if (storage.q) await storage.q('SELECT 1'); add('Baza de date', true, storage.describe().label); } catch (e) { add('Baza de date', false, 'Nu răspunde. Pornește Docker Desktop. ' + e.message); }
  const li = llmInfo(); add('Componenta Claude', li.configured, li.configured ? li.version : 'Nu a fost găsită; rulează instalatorul.');
  add('Autentificare Claude (Pro)', li.auth.ok === true, li.auth.ok === true ? 'Verificată ' + new Date(li.auth.at).toLocaleString('ro-RO') : li.auth.ok === false ? 'Expirată: Setări > Autentifică' : 'Neverificată încă: apasă „Verifică”');
  add('Fără API plătit', true, li.apiKeyIgnored ? 'ANTHROPIC_API_KEY există în .env, dar e ignorată (poți s-o ștergi).' : 'Se folosește doar abonamentul Pro.');
  add('Canva', canva.status().connected, canva.status().connected ? 'Conectat' : 'Neconectat: Setări > Conectează Canva');
  try { await fs.mkdir(outputDir(), { recursive: true }); const t = path.join(outputDir(), '.wp-test'); await fs.writeFile(t, 'ok'); await fs.rm(t); const st = await fs.statfs(outputDir()).catch(() => null); add('Folderul fișierelor finale', true, `${outputDir()}${st ? `, ${Math.round(st.bavail * st.bsize / 1e9)} GB liberi` : ''}`); } catch (e) { add('Folderul fișierelor finale', false, e.message); }
  try { await fs.access(path.join(ROOT, 'node_modules/jspdf/dist/jspdf.umd.min.js')); add('Modulul PDF', true, 'jsPDF instalat'); } catch { add('Modulul PDF', false, 'Rulează din nou instalatorul (npm install).'); }
  const u = usage(); add('Consum Claude', u.text5h < u.budget5h, `${u.text5h} din ${u.budget5h} apeluri în ultimele 5 ore`);
  /* audit dossier #3: versions this release was tested with, so a changed external tool is visible at once */
  const tested = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8')).testedWith || {};
  const ccv = (li.version.match(/\d+\.\d+\.\d+/) || [])[0];
  if (tested['@anthropic-ai/claude-code']) add('Versiune Claude Code testată', !ccv || ccv === tested['@anthropic-ai/claude-code'], ccv ? (ccv === tested['@anthropic-ai/claude-code'] ? `${ccv}, versiunea testată` : `${ccv} instalată; testată cu ${tested['@anthropic-ai/claude-code']}. Dacă apar erori la text, reinstalează versiunea testată.`) : 'necunoscută');
  const ct=codexTextStatus(); add('Codex pentru text',ct.ready,ct.version || 'Disponibilitate necunoscută');
  const cx = GPTImage.codexStatus(); if (cx.installed) add('Codex pentru imagini', cx.ready, `${cx.version || ''}${cx.ready ? '' : ' — neautentificat'}`);
  let font = false; try { await fs.access(path.join(ROOT, 'public', 'fonts', 'Andika-Regular.ttf')); font = true; } catch {}
  add('Fontul cărților (Andika)', font, font ? 'instalat local: PDF-urile arată la fel și fără internet' : 'lipsește din public/fonts: rulează din nou instalatorul (cărțile ar ieși cu un font de rezervă)');
  if (ENV_DUPLICATES.length) add('Fișierul .env', false, `chei scrise de două ori (se folosește ultima): ${ENV_DUPLICATES.join(', ')}`);
  { const f = claudeFlags(); add('Funcții Claude Code folosite', true, [f.systemPromptFile ? 'carta agentului ca prompt de sistem' : 'carta agentului în mesaj (versiune mai veche)', f.jsonSchema ? (schemaActive() ? 'răspunsuri validate cu schemă' : 'schemă oprită după erori; validare locală') : 'validare locală a răspunsurilor'].join('; ')); }
  if (LAN.lanEnabled()) add('Acces din rețea', false, 'pornit, prin HTTP necriptat: oprește-l când nu-l folosești (vezi INSTALARE.md, „Acces din rețea”)');
  return { checks: out };
});
on('POST', '/api/lessons', async (_, req) => { localOnly(req); return addManualLesson(await json(req)); });
on('POST', '/api/lessons/:id/scope', async ({ id }, req) => { localOnly(req); const b = await json(req); return Governance.changeScope(repo, id, { scope: b.scope, age: b.age || null, pid: b.pid || null, reportHash: b.reportHash || null, note: b.note || '' }); });   // P7-T02: report → decision → versioned change
on('GET', '/api/lessons/:id/promotion-report', async ({ id }, _, url) => Governance.scopeReport(repo, id, { scope: url.searchParams.get('scope'), age: url.searchParams.get('age') || null, pid: url.searchParams.get('pid') || null }));
on('POST', '/api/knowledge/decisions/:id/rollback', async ({ id }, req) => { localOnly(req); return Governance.rollback(id); });
on('GET', '/api/knowledge/decisions', async () => ({ decisions: Knowledge.listDecisions().slice(-200) }));
on('POST', '/api/calibration/:age', async ({ age }, req) => { localOnly(req); await setCalibrated(age, (await json(req)).calibrated); return { ok: true }; });
on('POST', '/api/lessons/:id', async ({ id }, req) => localOnly(req) || setLessonStatus(id, (await json(req)).status));
on('GET', '/api/learning', async () => learningState(repo.listProjects()));
/* v19: consumption and quality ledger (plan 2.6), lesson review (3.1), calibrated thresholds (3.8) */
on('GET', '/api/ledger', async (_, __, url) => ({ ...Ledger.summary(Math.min(365, Math.max(1, Number(url.searchParams.get('days')) || 30))), perVolume: Ledger.perVolume(), usage: usage(), evolution: Ledger.evolution().slice(0, 12) }));
on('GET', '/api/ledger.csv', async (_, __, ___, res) => { res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="registru-consum-${new Date().toISOString().slice(0, 10)}.csv"` }); res.end('\ufeff' + Ledger.csv(365)); return null; });
on('GET', '/api/knowledge.zip', async (_, req, ___, res) => {   // plan 3.4: files for the claude.ai Project (plan 1.9)
  localOnly(req);
  let instr = ''; try { instr = await fs.readFile(path.join(ROOT, 'docs', 'claude-project', 'INSTRUCTIUNI-PROIECT.md'), 'utf8'); } catch {}
  const r = await exportKnowledge(repo, { projectInstructions: instr });
  const buf = await fs.readFile(r.zip);
  res.writeHead(200, { 'content-type': 'application/zip', 'content-length': buf.length, 'content-disposition': `attachment; filename="${path.basename(r.zip)}"` }); res.end(buf); return null;
});
/* ---------- v19: Canva brand kit + brand templates (plan 2.7–2.10), included in Canva Pro ---------- */
const canvaOn = () => { if (!canva.status().connected) throw { status: 400, message: 'Canva nu este conectat. Setări > Conectează Canva.' }; };
on('GET', '/api/canva/brand-kits', async (_, req) => { localOnly(req); canvaOn(); return { items: await canva.brandKits() }; });
on('GET', '/api/canva/brand-templates', async (_, req, url) => { localOnly(req); canvaOn(); return { items: await canva.brandTemplates(url.searchParams.get('kit') || null) }; });
on('GET', '/api/canva/template-fields', async (_, req, url) => { localOnly(req); canvaOn(); const f = await canva.templateFields(String(url.searchParams.get('id') || '')); return { fields: Object.entries(f).map(([name, type]) => ({ name, type, role: type === 'image' ? 'coperta' : Cover.roleOf(name) })) }; });
on('PUT', '/api/projects/:pid/canva-brand', async ({ pid }, req) => {
  localOnly(req); need(pid); const b = await json(req); const str = x => (typeof x === 'string' ? x.slice(0, 120) : null);
  const canvaOpt = { brandKitId: str(b.brandKitId), brandKitName: str(b.brandKitName), templateId: str(b.templateId), templateName: str(b.templateName) };
  await repo.patchProject(pid, { options: { canva_brand: canvaOpt } }); return canvaOpt;
});
const volParam = url => { const v = Number(url.searchParams.get('volume')); if (!Number.isInteger(v) || v < 0 || v > 50) throw { status: 400, message: 'Volum invalid.' }; return v; };
async function approvedVol(pid, url) { const p = need(pid); const v = volParam(url); if (!volumeApproved(p, await repo.getBlueprint(pid), v, await repo.artifacts(pid))) throw { status: 409, message: `Volumul ${v + 1} nu are încă aprobarea finală.` }; return { p, v }; }
on('POST', '/api/projects/:pid/canva-cover', async ({ pid }, req, url) => { localOnly(req); canvaOn(); const { p, v } = await approvedVol(pid, url); return Cover.makeCover({ repo, canva, p, v, templateId: p.options?.canva_brand?.templateId }); });
on('POST', '/api/projects/:pid/canva-export', async ({ pid }, req, url) => { localOnly(req); canvaOn(); const { p, v } = await approvedVol(pid, url); return Cover.exportCover({ repo, canva, p, v, force: url.searchParams.get('force') === '1' }); });
on('POST', '/api/projects/:pid/canva-promo', async ({ pid }, req, url) => { localOnly(req); canvaOn(); const { p, v } = await approvedVol(pid, url); return Cover.makePromo({ repo, canva, p, v, formats: (await repo.getBlueprint(pid)).marketing_formats || [] }); });
/* ---------- v19 (plan 3.3): retrospective proposals ---------- */
on('POST', '/api/proposals/:id', async ({ id }, req) => { localOnly(req); const b = await json(req); return Learning.decideProposal(id, !!b.accept, b.scope); });
on('POST', '/api/projects/:pid/retro', async ({ pid }, req, url) => { localOnly(req); need(pid); const v = volParam(url); return (await trackProjectBackground(pid, () => runRetro(pid, v))) || { ok: false }; });

/* ---------- v19 (plan 3.6): the golden set, 3 fixed subjects run through the text stages up to the editor ---------- */
let GOLDEN = { running: null };
async function goldenData() { return (await storage.readJSON('golden.json', { baseline: null, runs: [] })) || { baseline: null, runs: [] }; }
async function goldenSummary(pid) {
  const rows = Ledger.rows(r => r.kind === 'quality' && r.pid === pid && r.stage === 'critic');
  const r0 = rows.find(r => r.round === 0); const last = rows[rows.length - 1]; const p = repo.getProject(pid);
  const art = p ? await repo.artifacts(pid).catch(() => ({})) : {};
  return { pid, age: p?.input?.target_age, title: art.script_0?.content?.title || p?.title, status: p?.status, error: p?.error || null, score0: r0?.score ?? null, scoreFinal: last?.score ?? null, rounds: Math.max(0, rows.length - 1), criteria0: r0?.criteria || {}, calls: Ledger.rows(r => r.kind === 'text' && r.pid === pid).length, sample: (art.script_0?.content?.pages || []).slice(0, 3).map(x => x.text) };
}
async function runGolden(variant) {
  const t = repo.getType('kids-sc'); const briefs = t?.golden || [];
  const runId = uid('g'); const run = { runId, at: now(), variant: variant || 'automat', bp: t.version, status: 'running', results: [] };
  GOLDEN.running = run; const data = await goldenData(); data.runs.unshift(run); data.runs = data.runs.slice(0, 20); await storage.writeJSON('golden.json', data);
  try {
    for (const input0 of briefs) {
      const input = { ...input0, language: input0.languages[0], second_language: '' };
      const pid = uid('p'); const bp = clone(t); delete bp.updatedAt;
      await repo.createProject({ id: pid, title: input.title, typeSlug: t.slug, typeName: t.name, typeIcon: t.icon || '', typeVersion: t.version, variantLabel: input.target_age, input,
        options: { images: false, visual_qa: false, golden: true, golden_run: runId, ...(variant ? { golden_variant: variant } : {}) }, status: 'ready', stageIndex: 0, stages: {}, currentStage: null, run: 1,
        stagePlan: [], volumeFlow: !!t.volume_flow, gate: null, decisions: [], notes: [], rejections: [], log: [], createdAt: now(), updatedAt: now(), error: null }, bp);
      startProject(pid);
      const t0 = Date.now();
      for (;;) { await new Promise(r => setTimeout(r, 1500)); const p = repo.getProject(pid); if (!p || ['completed', 'failed', 'waiting_limit', 'paused'].includes(p.status) && !RUNNING[pid]) break; if (Date.now() - t0 > 45 * 60e3) { stopEngine(pid); break; } }
      run.results.push(await goldenSummary(pid));
      const p = repo.getProject(pid); if (p?.status === 'waiting_limit') { await repo.patchProject(pid, { status: 'paused' }); run.status = 'limit'; break; }
    }
    if (run.status === 'running') run.status = 'done';
  } catch (e) { run.status = 'error'; run.error = e?.message || String(e); }
  finally {
    for (const r of run.results) { try { await repo.deleteProject(r.pid); } catch {} }   // results are kept here and in the ledger; the temporary projects go
    run.finishedAt = now(); const d2 = await goldenData(); const i = d2.runs.findIndex(x => x.runId === runId); if (i >= 0) d2.runs[i] = run; else d2.runs.unshift(run);
    if (!d2.baseline && run.status === 'done') d2.baseline = runId;
    await storage.writeJSON('golden.json', d2); GOLDEN.running = null; bus.emit('change', { scope: 'learning' });
  }
}
on('GET', '/api/golden', async () => { const d = await goldenData(); return { ...d, running: GOLDEN.running ? { runId: GOLDEN.running.runId, done: GOLDEN.running.results.length } : null, variants: repo.getType('kids-sc')?.stages?.find(s => s.prompt_variants)?.prompt_variants || [] }; });
on('POST', '/api/golden/run', async (_, req) => {
  localOnly(req); if (GOLDEN.running) throw { status: 409, message: 'Setul de aur rulează deja.' };
  const a = activeProject(); if (a) throw { status: 409, message: `Rulează „${a.title}”. Setul de aur pornește când nu lucrează alt proiect.` };
  const b = await json(req); const variants = repo.getType('kids-sc')?.stages?.find(s => s.prompt_variants)?.prompt_variants || [];
  const variant = variants.includes(b.variant) ? b.variant : null; runGolden(variant).catch(e => console.warn('[golden]', e?.message || e)); return { ok: true };
});
on('POST', '/api/golden/baseline', async (_, req) => { localOnly(req); const b = await json(req); const d = await goldenData(); if (!d.runs.some(r => r.runId === b.runId)) throw { status: 404, message: 'Rulare inexistentă.' }; d.baseline = b.runId; await storage.writeJSON('golden.json', d); return d; });
on('PUT', '/api/learning/settings', async (_, req) => { localOnly(req); return Learning.setLearningSettings(await json(req)); });
on('POST', '/api/bandit/reset', async (_, req) => { localOnly(req); const b = await json(req); return Learning.resetCompetition(String(b.stage || '')); });
on('POST', '/api/lessons/:id/keep', async ({ id }, req) => { localOnly(req); return Learning.keepLesson(id); });
on('GET', '/api/thresholds', async () => ({ thresholds: Learning.thresholds(), proposals: Learning.thresholdProposals ? Learning.thresholdProposals() : [] }));
on('PUT', '/api/thresholds', async (_, req) => { localOnly(req); const b = await json(req); return { thresholds: await Learning.setThreshold(String(b.age || ''), String(b.stage || 'critic'), b.value == null ? null : Number(b.value)) }; });
on('GET', '/api/gdrive/login', async (_, req, ___, res) => {
  if (!LAN.isLocal(req)) { res.writeHead(302, { location: '/#/settings?gdrive=' + encodeURIComponent('conectarea Google Drive se face de pe laptop') }); res.end(); return null; } if (!gdrive.status().configured) { res.writeHead(302, { location: '/#/settings?gdrive=' + encodeURIComponent('lipsesc GOOGLE_CLIENT_ID și GOOGLE_CLIENT_SECRET în .env') }); res.end(); return null; } res.writeHead(302, { location: gdrive.loginUrl() }); res.end(); return null; });
on('GET', '/oauth/google', async (_, __, url, res) => { let msg = 'ok'; try { await gdrive.finish(url.searchParams.get('code'), url.searchParams.get('state')); } catch (e) { msg = e.message; } bus.emit('change', { scope: 'projects' }); res.writeHead(302, { location: '/#/settings?gdrive=' + encodeURIComponent(msg) }); res.end(); return null; });
on('POST', '/api/projects/:pid/gdrive', async ({ pid }, _, url) => { const p=need(pid),bp=await repo.getBlueprint(pid),vq=url.searchParams.get('volume'),v=vq==null?null:Number(vq);if(v!=null&&(!Number.isInteger(v)||v<0||v>=bp.structure.volumes))throw {status:400,message:'Volum invalid.'};if(!volumeApproved(p,bp,v,await repo.artifacts(pid)))throw {status:409,message:'Doar conținutul aprobat se poate trimite.'};{const a=await repo.artifacts(pid),rc=releaseCheck(p,bp,a,v,{approved:true,safety:safetyOf(p,bp,a,v),quality:qualityOf(p,bp,a,v)});if(!rc.eligible)throw {status:409,code:'release_blocked',errors:rc.blockers,message:'Inventarul livrării este incomplet.'};}const zip=await checkedPackage(repo,p,v,{final:true});const r=await gdrive.upload(zip,v!=null?path.basename(projectFolder(p))+'-'+path.basename(zip):path.basename(zip));await repo.patchProject(pid,{...(v!=null?{driveLinks:{[v]:r.link}}:{driveLink:r.link,driveAt:now()}),driveFiles:[...(p.driveFiles||[]),{id:r.id,at:now()}]});return r; });
on('PUT', '/api/types/:slug', async ({ slug }, req) => {
  localOnly(req); const bp = await json(req);
  if (!bp?.slug || !/^[a-z0-9-]{2,40}$/.test(bp.slug)) throw { status: 400, message: 'Slug invalid.' };
  if (bp.slug !== slug && repo.getType(bp.slug)) throw { status: 409, message: 'Există deja un tip cu acest slug.' };
  const cv = validateContract(contractFromBlueprint(bp)); if (!cv.valid) throw { status: 422, code: 'contract_invalid', errors: cv.errors, message: 'Tipul de produs nu respectă contractul protejat: ' + cv.errors.map(e => e.message).join(' ') };   // P1-T01
  await repo.putType({ ...bp, updatedAt: now() });
  return { ok: true };
});
on('GET', '/api/canva/login', async (_, req, ___, res) => {
  if (!LAN.isLocal(req)) { res.writeHead(302, { location: '/#/settings?canva=' + encodeURIComponent('conectarea Canva se face de pe laptop') }); res.end(); return null; }
  const r = await canva.connect().catch(e => ({ error: String(e?.message || e) }));
  if (r?.authUrl) { res.writeHead(302, { location: r.authUrl }); res.end(); return null; }
  res.writeHead(302, { location: '/#/settings' }); res.end(); return null;
});
on('POST', '/api/canva/logout', async (_, req) => { localOnly(req); await canva.logout(); bus.emit('change', { scope: 'projects' }); return { ok: true }; });
on('GET', '/oauth/callback', async (_, __, url, res) => {
  const code = url.searchParams.get('code'); const err = url.searchParams.get('error');
  let msg = 'ok';
  if (err || !code) msg = err || 'fără cod';
  else { try { await canva.finishAuth(code, url.searchParams.get('state')); } catch (e) { msg = String(e?.message || e); } }
  bus.emit('change', { scope: 'projects' });
  res.writeHead(302, { location: '/#/settings?canva=' + encodeURIComponent(msg) }); res.end(); return null;
});

/* ---------- live events (SSE) ---------- */
const clients = new Map();                              // res -> req (the device is re-checked at every ping)
const MAX_SSE = 20;                                      // audit M2
const push = (ev, data) => { for (const c of clients.keys()) c.write(`event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`); };
const sseEvent = e => `id: ${e.id}\nevent: change\ndata: ${JSON.stringify(e)}\n\n`;
bus.on('change', ev => { const e = Events.append(ev); for (const c of clients.keys()) c.write(sseEvent(e)); });   // P3-T06: ids let a reconnecting client replay exactly what it missed
bus.on('live', calls => push('live', calls));
const dropUnauthorized = () => { for (const [c, rq] of clients) if (!LAN.authorized(rq)) { try { c.end(); } catch {} clients.delete(c); } };
setInterval(() => { dropUnauthorized(); for (const c of clients.keys()) c.write(': ping\n\n'); }, 25000).unref?.();

/* ---------- static ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.webmanifest': 'application/manifest+json' };
/* audit C2: the app's own pages only run the app's own scripts; nothing can be framed or loaded from elsewhere */
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
function securityHeaders(res) {
  res.setHeader('Content-Security-Policy', CSP); res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Referrer-Policy', 'no-referrer'); res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
}
async function serveFile(res, file, cache = false) {
  try { const b = await fs.readFile(file); res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': cache ? 'public, max-age=31536000, immutable' : 'no-cache' }); res.end(b); }
  catch { send(res, 404, { message: 'Nu există.' }); }
}
/* audit C2: files that came from outside (uploads, imports, training packs) are shown only if they are images;
   everything else is a download, never a page that runs on the app's origin */
function sendUserFile(res, name, buf, cache = 'no-cache') {
  const ext = path.extname(name).toLowerCase(); const img = IMAGE_MIME[ext];
  const head = { 'cache-control': cache, 'content-type': img || (ext === '.pdf' ? 'application/pdf' : 'application/octet-stream') };
  if (!img) head['content-disposition'] = `attachment; filename="${path.basename(name).replace(/[^A-Za-z0-9._-]/g, '-')}"`;
  res.writeHead(200, head); res.end(buf);
}
const PUBLIC_WITHOUT_LOGIN = p => p === '/auth/login' || p === '/login.js' || p === '/manifest.webmanifest' || /^\/icons\/[a-z0-9-]+\.png$/.test(p) || /^\/fonts\/[A-Za-z0-9-]+\.(woff2|woff|ttf)$/.test(p);

async function handler(req, res) {
  securityHeaders(res);
  if (!LAN.hostAllowed(req)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (req.method !== 'GET' && (req.url.startsWith('/api/') || req.url.startsWith('/auth/')) && req.headers['x-wp'] !== '1') { res.writeHead(403); res.end('Forbidden'); return; }
  const url = new URL(req.url, `http://localhost:${config.port}`);
  if (!originAllowed(req)) { res.writeHead(403); res.end('Forbidden'); return; }   // P1-T04: cross-origin state change
  if (remoteMutationBlocked({ mode: securityMode(), local: LAN.isLocal(req), method: req.method, pathname: url.pathname })) { send(res, 403, { code: 'lan_restricted', message: 'Rețeaua locală fără HTTPS permite urmărirea și comentariile, nu aprobări sau modificări. Activează HTTPS (WP_TLS_CERT/WP_TLS_KEY) sau acceptă explicit, de pe laptop, LAN fără HTTPS în Setări.' }); return; }
  if (!LAN.authorized(req) && !PUBLIC_WITHOUT_LOGIN(url.pathname)) {   // other devices: access code first
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/files/')) { send(res, 401, { message: 'Autentifică-te cu codul de acces.' }); return; }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(LAN.LOGIN_PAGE); return;
  }
  try {
    if (url.pathname === '/api/events') {
      if (clients.size >= MAX_SSE) { const oldest = clients.keys().next().value; try { oldest.end(); } catch {} clients.delete(oldest); }
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
      res.write('retry: 3000\n: hello\n\n');
      const cursor = req.headers['last-event-id'] ?? url.searchParams.get('cursor');   // P3-T06: replay after disconnect/suspend/restart
      const r = Events.since(cursor);
      if (r.reset) res.write(`id: ${r.head}\nevent: reset\ndata: ${JSON.stringify({ reason: r.reason, head: r.head })}\n\n`);
      else { for (const e of r.events) res.write(sseEvent(e)); if (cursor == null) res.write(`id: ${r.head}\nevent: hello\ndata: ${JSON.stringify({ head: r.head })}\n\n`); }
      clients.set(res, req); req.on('close', () => clients.delete(res)); return;
    }
    const m = url.pathname.match(/^\/files\/(p[a-z0-9]{6,24})\/((?:images|exports|uploads)\/[A-Za-z0-9._-]+)$/);
    if (m) { try { sendUserFile(res, m[2], await repo.readFile(m[1], m[2]), 'private, max-age=31536000, immutable'); } catch { send(res, 404, { message: 'Fișier inexistent.' }); } return; }
    if (url.pathname === '/login.js') return serveFile(res, path.join(ROOT, 'public', 'login.js'));
    if (url.pathname === '/manifest.webmanifest') return serveFile(res, path.join(ROOT, 'public', 'manifest.webmanifest'));
    if (/^\/icons\/[a-z0-9-]+\.png$/.test(url.pathname)) return serveFile(res, path.join(ROOT, 'public', url.pathname), true);
    if (/^\/fonts\/[A-Za-z0-9-]+\.(woff2|woff|ttf)$/.test(url.pathname)) return serveFile(res, path.join(ROOT, 'public', url.pathname), true);
    if (url.pathname === '/fonts/andika-metrics.json') return serveFile(res, path.join(ROOT, 'public', 'fonts', 'andika-metrics.json'));   // P6-T01: shared font measurements
    if (/^\/app\/[a-z0-9-]+\.(js|css)$/.test(url.pathname)) return serveFile(res, path.join(ROOT, 'public', url.pathname));
    if (url.pathname === '/vendor/jspdf.umd.min.js') return serveFile(res, path.join(ROOT, 'node_modules/jspdf/dist/jspdf.umd.min.js'), true);
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const mm = url.pathname.match(r.re); if (!mm) continue;
      if(storageMaintenance && req.method !== 'GET') throw {status:409,message:'Se salvează o copie coerentă a datelor. Reîncearcă după terminarea copiei.'};
      const out = await r.fn(mm.groups || {}, req, url, res);
      if (out !== null) send(res, 200, out ?? { ok: true });
      return;
    }
    if (req.method === 'GET' && !url.pathname.startsWith('/api/')) return serveFile(res, path.join(ROOT, 'public', 'index.html'));
    send(res, 404, { message: 'Rută inexistentă.' });
  } catch (e) {
    /* audit L2: messages the app wrote for you are shown; unexpected internal errors only in the log */
    const known = e && typeof e === 'object' && !(e instanceof Error) && (e.status || e.code);
    if (!res.headersSent) send(res, e?.status || (e?.code === 'busy' ? 409 : e?.code === 'bad_request' ? 400 : 500), known ? { message: e.message || 'Eroare.', code: e.code, ...(e.active ? { active: e.active } : {}), ...(Array.isArray(e.errors) ? { errors: e.errors } : {}), ...(/_conflict$/.test(e.code || '') ? { conflict: Object.fromEntries(['key', 'currentVersion', 'expectedVersion', 'currentRevision', 'expectedRevision', 'changedBy', 'changedAt'].filter(k => e[k] !== undefined).map(k => [k, e[k]])) } : {}) } : { message: 'A apărut o eroare internă. Detaliile sunt în jurnal (wonderpages.log).' });
    if (!known || (!e.status && e.code !== 'busy' && e.code !== 'bad_request')) console.error(e);
  }
}
/* local only by default (loopback IPv4 + IPv6); with network access on, IPv4 listens on all interfaces */
if (globalThis.__wpBoot) await globalThis.__wpBoot.close();          // the start-up status page hands over the port
const v6 = http.createServer(handler); v6.on('error', () => {}); v6.listen(config.port, '::1');
const server = http.createServer(handler);
server.on('error', e => { if (e.code === 'EADDRINUSE') { console.error(`Portul ${config.port} e ocupat: aplicația rulează deja sau alt program folosește portul.`); process.exit(3); } console.error(e); process.exit(1); });   // 3 = already running: the background loop does not retry
const tlsServer=await startTls(handler,{host:LAN.lanEnabled()?'0.0.0.0':'127.0.0.1'});
let tlsHost=LAN.lanEnabled()?'0.0.0.0':'127.0.0.1';
let boundHost = LAN.lanEnabled() && !tlsEnabled() ? '0.0.0.0' : '127.0.0.1';
async function relisten() {
  const nextTlsHost=LAN.lanEnabled()?'0.0.0.0':'127.0.0.1';
  if(tlsServer && nextTlsHost!==tlsHost){tlsServer.closeAllConnections?.();await new Promise(r=>tlsServer.close(r));await new Promise((r,j)=>{tlsServer.once('error',j);tlsServer.listen(Number(process.env.WP_TLS_PORT||4322),nextTlsHost,r);});tlsHost=nextTlsHost;}
  const want = LAN.lanEnabled() && !tlsEnabled() ? '0.0.0.0' : '127.0.0.1'; if (want === boundHost) return;
  boundHost = want; server.closeAllConnections?.();
  await new Promise(r => server.close(() => r())); await new Promise(r => server.listen(config.port, want, r));
  console.log(want === '0.0.0.0' ? `Acces din rețea: ${LAN.lanUrls(config.port).join(', ')}` : 'Acces doar de pe acest calculator.');
}
server.listen(config.port, boundHost, () => {
  if (boundHost === '0.0.0.0') console.log(`Acces din rețea: ${LAN.lanUrls(config.port).join(', ')}`);
  console.log(`\nWonderPages.AI rulează la http://localhost:${config.port}`);
  console.log(`Date: ${storage.describe().location}`);
  const li = llmInfo();
  console.log(li.configured ? `Text: Claude Code ${li.version} (abonamentul tău)` : 'Atenție: Claude Code nu a fost găsit. Rulează instalatorul.');
  if (config.openBrowser) { const u = `http://localhost:${config.port}`; const [cmd, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', u]] : [process.platform === 'darwin' ? 'open' : 'xdg-open', [u]]; spawn(cmd, args, { detached: true, stdio: 'ignore', windowsVerbatimArguments: false }).on('error', () => {}).unref(); }
});
