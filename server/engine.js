/* ============================================================
   Motorul generic: execută pipeline-ul oricărui tip de produs,
   exact cum îl descrie blueprint-ul. Rulează pe server, deci
   continuă și cu browserul închis.
   ============================================================ */
import { complete, parseJSONLoose } from './llm.js';
import crypto from 'node:crypto';
import { bus, now, clone } from './repo.js';
import { config } from './config.js';
import { getAgent, requireAgent, startInstance, registry as agentRegistry } from './agents.js';
import { buildContext } from './agents-runtime/context-builder.js';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Scheduler, INSTANCE, unitInputsHash } from './jobs/scheduler.js';
import { ExecutionBudget } from './jobs/budget.js';
import { sniffImage, pngSize } from './security/safe-zip.js';
import { planLayout, pageIssues } from './domain/layout.js';
import { assertExecutable } from './providers/registry.js';
import { canonicalHash } from './domain/canonical.js';
import { matrixForArtifacts } from './domain/collection.js';
import { derivePageBlueprints, validatePageBlueprints } from './domain/page-blueprints.js';
import { atlasFor, landmarkContext } from './domain/atlas.js';
import { generationAllowed, pilotState } from './domain/pilot.js';
import { volumeSafety, textSafety } from './quality/safety.js';
import { assessText, assessBook, policyFor, nativeChecks, regressions } from './quality/assessment.js';
import { visualConsistency } from './quality/visual.js';
import { planRepairs, unitHashes, verifyExecution, resolution, MAX_CREATIVE_ATTEMPTS } from './quality/repair.js';
import { storyContract, causality as storyCausality, voice as storyVoice, science as storyScience, ageFit, criticNotes } from './domain/story-contracts.js';
/* P3-T03: the innermost durable unit (stage or item) of the current async flow: its lease fences every result write */
export const FENCE = new AsyncLocalStorage();
export let jobs = null;
const noteExternal = info => { const f = FENCE.getStore(); return f ? jobs.markExternal(f.pid, f.key, f.token, info).catch(e => { if (e?.code === 'stale_lease') throw e; console.warn('[jobs external]', e?.message || e); }) : null; };
import { lessonsFor, predictApproval, featuresOf, chooseVariant, findExamples, addSamples, rewardVariant, learnFromEvent, addExample } from './learning.js';
import { outcomeOf } from './knowledge/effectiveness.js';
import { recordCall, govConfig, beforeImage, canvaPaused, canvaCfg } from './governor.js';
import { knownFailures, noteLessonUse, thresholdFor, noteVisualFailure, addProposals, listLessons, learningSettings } from './learning.js';
const listLessonsForRetro = () => listLessons().filter(l => l.status === 'active').slice(-60).map(l => ({ id: l.id, agent: l.agent, code: l.code || undefined, text: l.text }));
import * as Ledger from './ledger.js';
import { schemaFor, validateSchema } from './schemas.js';
import * as GPTImage from './codeximage.js';
import path from 'node:path';
import { analyzeLineart, judgeLineart, normalizeLineart } from './pngcheck.js';
import { coloringQA } from './quality/coloring.js';
import { pinVersion } from './persistence/artifact-store.js';
import { decisionRecord, itemSubject, policyHash } from './domain/decisions.js';
import { fingerprint, pageSequence, sceneFingerprint, rubricEvaluation, visualVerdicts, exactCorrection, parseExactCorrection } from './contracts.js';
import { EDITORIAL_POLICY, editorialFindings } from './editorial.js';

let repo, canva;
export function initEngine(r, c) {
  repo = r; canva = c; jobs = r?.s?.commitBatch ? new Scheduler(r.s, { owner: INSTANCE }) : null;
  repo.onArtifactWrite = async (pid, key, prev, next) => {
    if (prev && /^(script|final)_\d+$/.test(key)) {
      const art = await repo.artifacts(pid);
      for (const [illKey, a] of Object.entries(art)) if (illKey.startsWith('ill_') && a.basedOn?.key === key && !a.basedOn.pageHash && a.basedOn.version === prev.version) {
        const page = Number(illKey.split('_')[2]);
        await repo.patchArtifact(pid, illKey, { basedOn: { pageHash: sceneFingerprint(pageData(prev.content, page)) } });
      }
    }
    await reopenChangedReview(pid);
  };
}
export const RUNNING = {};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BACKGROUND = new Map(), BACKGROUND_TIMERS = new Map(), DELETING = new Set();
export function trackProjectBackground(pid, work) {
  if (DELETING.has(pid)) return Promise.resolve(null);
  const active = BACKGROUND.get(pid) || new Set(); BACKGROUND.set(pid, active);
  const job = Promise.resolve().then(() => DELETING.has(pid) ? null : work());
  active.add(job);
  job.finally(() => { active.delete(job); if (!active.size) BACKGROUND.delete(pid); }).catch(() => {});
  return job;
}
export async function quietProjectBackground(pid) {
  DELETING.add(pid);
  for (const t of BACKGROUND_TIMERS.get(pid) || []) clearTimeout(t);
  BACKGROUND_TIMERS.delete(pid);
  await Promise.allSettled([...(BACKGROUND.get(pid) || [])]);
  return () => DELETING.delete(pid);
}
function scheduleRetro(pid, vol) {
  const timers = BACKGROUND_TIMERS.get(pid) || new Set(); BACKGROUND_TIMERS.set(pid, timers);
  const timer = setTimeout(() => {
    timers.delete(timer); if (!timers.size) BACKGROUND_TIMERS.delete(pid);
    trackProjectBackground(pid, () => runRetro(pid, vol)).catch(e => console.warn('[retro]', e?.message || e));
  }, 1500);
  timers.add(timer);
}

/* ---------- template engine ---------- */
export function getPath(obj, path) { if (!path) return obj; return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
export function tpl(str, ctx) {
  return String(str ?? '').replace(/\{\{\s*([^}|]+?)\s*(?:\|\s*([^}]+?))?\s*\}\}/g, (_, p, f) => {
    let v = getPath(ctx, p.trim());
    if (f) {
      const [fn, arg] = f.split(':').map(x => x.trim());
      if (fn === 'pluck') v = Array.isArray(v) ? v.map(x => getPath(x, arg)).filter(x => x != null && x !== '').join('; ') : '';
      else if (fn === 'join') v = Array.isArray(v) ? v.join(arg || ', ') : v;
      else if (fn === 'count') v = Array.isArray(v) ? v.length : 0;
    }
    if (v == null || v === '') return '';
    return typeof v === 'object' ? JSON.stringify(v) : String(v);
  });
}
export function globMatch(pattern, key) {
  if (!pattern.includes('*')) return pattern === key ? '' : null;
  const re = new RegExp('^' + pattern.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('(.+)') + '$');
  const m = key.match(re); return m ? (m[1] ?? '') : null;
}
export function defFor(bp, key) {
  const defs = bp?.artifacts || {};
  if (defs[key]) return { ...defs[key], _key: key };
  for (const [pat, d] of Object.entries(defs)) {
    const cap = globMatch(pat, key);
    if (cap != null) { const n = /^\d+$/.test(cap) ? Number(cap) + 1 : cap; return { ...d, label: tpl(d.label, { n, key }), _key: key }; }
  }
  return { label: key, view: 'generic', _key: key };
}
const matchMap = (map, key) => { for (const [pat, v] of Object.entries(map || {})) if (globMatch(pat, key) != null) return v; return null; };
/* collection stages run once; per_volume stages repeat for volume 1, 2, ... so volumes are delivered one by one */
export function expandStages(bp) {
  if (!bp.volume_flow) return bp.stages;
  const col = bp.stages.filter(s => !s.per_volume), per = bp.stages.filter(s => s.per_volume); const out = [...col];
  for (let v = 0; v < bp.structure.volumes; v++) for (const s of per) out.push({ ...s, key: `${s.key}@${v + 1}`, base: s.key, vol: v, label: `${s.label}` });
  return out;
}
const stageByKey = (E, k) => E.stages.find(s => s.key === k) || E.stages.find(s => s.base === k);
/* the (item, index) pairs a stage works on: all volumes, or only the current one */
function pairsOf(E, stage, base) {
  const items = stage.for_each ? (getPath(base, stage.for_each) || []) : [null];
  const all = items.map((item, i) => ({ item, i }));
  return stage.vol != null && stage.for_each ? all.filter(x => x.i === stage.vol) : all;
}
const wordsOf = t => new Set(String(t || '').toLowerCase().match(/[\p{L}]{4,}/gu) || []);
function adjacentWarnings(c) {
  const pages = c?.pages || []; const out = [];
  for (let i = 1; i < pages.length; i++) { const a = wordsOf((pages[i - 1].purpose || '') + ' ' + (pages[i - 1].scene || '')), b = wordsOf((pages[i].purpose || '') + ' ' + (pages[i].scene || ''));
    const inter = [...a].filter(x => b.has(x)).length, uni = new Set([...a, ...b]).size; if (uni && inter / uni > 0.55) out.push(`Pages ${i} and ${i + 1} seem to do the same narrative job; make them clearly different.`); }
  return out.join(' ');
}
export const pageLabel = (v, p) => `Vol. ${v + 1}, ${p === 0 ? 'copertă' : 'p. ' + p}`;

/* ---------- live view of running calls ---------- */
const LIVE = new Map(); let liveT = null;
function emitLive() { if (liveT) return; liveT = setTimeout(() => { liveT = null; bus.emit('live', [...LIVE.values()].map(c => ({ pid: c.pid, agent: c.agent, label: c.label, kind: c.kind, chars: c.text.length, tail: c.text.slice(-240), since: c.since }))); }, 300); }

const HARD = new Set(['stopped', 'no_claude_code', 'codex_missing', 'codex_auth', 'codex_error', 'codex_timeout', 'auth', 'rate_limited', 'canva_not_connected']);
export function errMsg(e) {
  const m = {
    no_claude_code: 'Claude Code nu este instalat. Rulează instalatorul din folderul aplicației.',
    codex_missing: 'Codex CLI nu este instalat. Instalează-l și autentifică-te cu ChatGPT.',
    codex_auth: 'Codex CLI nu este autentificat cu contul ChatGPT. Verifică în Setări.',
    auth: 'Claude Code nu este autentificat cu contul tău Pro. Setări > Autentifică.',
    rate_limited: 'Ai atins limita abonamentului Claude. Proiectul se reia singur după resetare.',
    upstream_error: 'Claude Code nu a răspuns corect. Reia generarea.',
    invalid_json: 'Răspunsul AI nu a fost JSON valid. Reia generarea.',
    empty_completion: 'Modelul nu a produs niciun răspuns. Reia generarea.',
    canva_not_connected: 'Canva nu este conectat. Conectează-l din Setări, apoi reia.'
  };
  if (e?.code === 'validation') return 'Rezultatul nu a respectat structura cerută: ' + (e.message || '');
  if (e?.code === 'rate_limited' && e?.provider === 'codex') return e.message || 'Limita Codex din abonamentul ChatGPT a fost atinsă.';
  return e?.message && !m[e?.code] ? e.message : (m[e?.code] || e?.message || String(e));
}

/* every call is a temporary instance of a permanent agent: its persona + its approved lessons come first */
/* provenance (LL-022/023): which agent, model, prompt variant, lessons and blueprint version produced an artifact */
/* P3-T02: provenance comes from the real execution (effective model + override source + context manifest), not from the agent default */
function provenance(E, agentId, promptKey) { const a = getAgent(agentId), last = E.lastContext?.agentId === agentId && E.lastContext?.scope?.prompt === promptKey ? E.lastContext : null; return { agent: agentId, model: last?.model?.model || a?.model || config.claudeCode.model, modelSource: last?.model?.source || null, context: last?.manifestHash || null, prompt: promptKey, lessons: last ? last.layers.experience.included.map(l => l.id) : lessonsFor(agentId, E.project.input?.[E.bp.variant_key], E.pid).map(l => l.id), blueprint: E.bp.version, at: now() }; }
const persistedContexts = new Set();
async function persistContext(pid, m) { const rel = `${pid ? `projects/${pid}` : '_context'}/context/${m.manifestHash}.json`; if (persistedContexts.has(rel)) return; await repo?.s?.writeJSON?.(rel, { ...m, at: now() }); persistedContexts.add(rel); }
/* v19 (plan 1.1/1.2): the agent's charter + its lessons are the SYSTEM prompt; the task and its data are the message */
export function agentSystem(agentId, age, pid = null, opts = {}) {
  const a = getAgent(agentId); if (!a) return '';
  return buildContext({ agent: a, role: agentRegistry().contracts?.roles?.[a.id], policy: EDITORIAL_POLICY, lessons: listLessons(), age, pid, stage: opts.stage, promptKey: opts.prompt }).system;   // P3-T02
}
export function agentPrompt(agentId, prompt, age, pid = null) { const sys = agentSystem(agentId, age, pid); return sys ? `${sys}\n\n${prompt}` : prompt; }
/* meta: { stage, vol, prompt, bp } for the ledger (plan 2.6); schema: JSON Schema of the reply (plan 1.3) */
export async function agentComplete(prompt, { agent = 'producator', task = '', json = true, images, pid = null, age, signal, onText, skipBudget, schema = null, localSchema = false, meta = {}, model, onContext } = {}) {
  const a = requireAgent(agent);   // P3-T01: unknown agent ID is a contract error, never Producător by default
  /* P3-T02: one context build per call — system text, manifest (persisted), effective model with its source */
  const ctxBuilt = buildContext({ agent: a, role: agentRegistry().contracts?.roles?.[a.id], policy: EDITORIAL_POLICY, lessons: listLessons(), age, pid, stage: meta.stage, promptKey: meta.prompt, prompt, override: meta.modelSource === 'model_variant' ? null : model, variant: meta.modelSource === 'model_variant' ? model : null, defaultModel: config.claudeCode.model });
  const end = startInstance(agent, pid, task); let ok = false; let info = null; const t0 = Date.now(); const useModel = ctxBuilt.manifest.model.model;
  const system = ctxBuilt.system; await persistContext(pid, ctxBuilt.manifest).catch(e => console.warn('[context]', e?.message || e)); onContext?.(ctxBuilt.manifest);
  assertExecutable(ctxBuilt.manifest.model.provider === 'codex' ? 'codex-text' : 'claude-code-text');   // P3-T05: entitlement/capability checked at execution
  if (pid) await noteExternal({ provider: ctxBuilt.manifest.model.provider });   // P3-T03
  if (meta.lessons !== false) noteLessonUse(agent, age, pid, { stage: meta.stage, prompt: meta.prompt });
  try { const r = await complete(prompt, { json, images, signal, onText, skipBudget, model: useModel, system, schema, onMeta: m => { info = m; } }); ok = true; recordCall(useModel === 'gpt-6-sol' ? 'text_gpt' : 'text'); return r; }
  finally {
    end(ok);
    const u = info?.usage || {};
    Ledger.record({ kind: 'text', pid, unit: FENCE.getStore()?.key || null, vol: meta.vol ?? null, stage: meta.stage || task || null, prompt: meta.prompt || null, agent, model: useModel, ok, ms: info?.ms ?? (Date.now() - t0), bytesIn: info?.bytesIn ?? Buffer.byteLength(prompt), bytesOut: info?.bytesOut ?? 0,
      inTok: u.input_tokens ?? null, outTok: u.output_tokens ?? null, cacheRead: u.cache_read_input_tokens ?? null, cacheWrite: u.cache_creation_input_tokens ?? null, schema: info?.schema ?? (schema || localSchema ? 'local' : null), system: info?.system || null, bp: meta.bp ?? null, charter: a?.charterVersion || null, context: ctxBuilt.manifest.manifestHash, modelSource: ctxBuilt.manifest.model.source });
  }
}
const agentOf = (E, stage, promptKey) => stage?.agent || E.bp.prompt_agents?.[promptKey] || 'producator';
async function callLLM(E, prompt, { label, json = true, agent = 'producator', images, promptKey = null, schemaCtx = null, model, modelSource = null } = {}) {
  if (E.stopped) throw { code: 'stopped' };
  const id = Math.random().toString(36).slice(2);
  LIVE.set(id, { pid: E.pid, label, kind: 'text', text: '', since: now(), agent }); emitLive();
  const cur = E.curStage || {};
  const full = promptKey ? schemaFor(E.bp, promptKey, schemaCtx || buildCtx(E)) : null;
  const { 'x-cli': cliOk, ...schema } = full || {};             // large documents are validated here only, so they keep every extra field
  try { return await agentComplete(prompt, { agent, task: label, json, images, pid: E.pid, age: E.project.input?.[E.bp.variant_key], signal: E.ctl.signal, schema: full && cliOk !== false ? schema : null, localSchema: !!full, model: model || E.bp.prompt_models?.[promptKey] || undefined, onContext: m => { E.lastContext = m; }, meta: { stage: cur.base || cur.key || E.stageKey || '_task', vol: cur.vol ?? E.taskVol ?? null, prompt: promptKey, bp: E.bp.version, modelSource: modelSource || (model ? 'model_variant' : E.bp.prompt_models?.[promptKey] ? 'stage_override' : null) }, onText: t => { const c = LIVE.get(id); if (c) { c.text = t; emitLive(); } } }); }
  finally { LIVE.delete(id); emitLive(); }
}
export const imageEngineOf = E => E.project.options?.image_engine || IMAGE_DEFAULT.engine;
export const IMAGE_DEFAULT = { engine: 'canva' };
export const _callImage = (...a) => callImage(...a);   // test seam (P3-T04)
/* P3-T04: one ExecutionBudget per image travels through the (single) provider hop: no wait-clock reset (C11), no bounce;
   Canva records its accepted job before polling and resumes by lookup; an output that cannot be owned is ambiguous. */
async function callImage(E, args, label, budget = null) {
  if (E.stopped) throw { code: 'stopped' };
  budget = budget || new ExecutionBudget({ deadlineMs: canvaCfg.maxWaitMin * 60e3 });
  const id = Math.random().toString(36).slice(2);
  LIVE.set(id, { pid: E.pid, label, kind: 'image', text: '', since: now(), agent: 'director-artistic' }); emitLive();
  const end = startInstance('director-artistic', E.pid, label); let ok = false; const t0 = Date.now();
  const hhmm = t => new Date(t).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  const engine = args.provider || imageEngineOf(E);
  const fence = FENCE.getStore(), resumeJobId = engine === 'canva' ? fence?.resumeProviderJobId || null : null; if (fence) fence.resumeProviderJobId = null;
  assertExecutable(engine === 'chatgpt' ? 'codex-image' : 'canva-mcp', { needsRefs: !!args.references?.length });   // P3-T05
  await noteExternal({ provider: engine, ...(resumeJobId ? { providerJobId: resumeJobId, lookup: true } : {}) });   // P3-T03: recorded BEFORE the provider is asked
  const hop = async (to, why) => {
    if (!budget.can('providerHop')) throw { code: 'rate_limited', provider: engine, resetAt: Date.now() + canvaCfg.pauseMin * 60e3, budget: budget.snapshot(), message: 'Ambii furnizori de imagini cer pauză; proiectul așteaptă și reia singur mai târziu (fără alternare repetată).' };
    budget.consume('providerHop', why);
    await logE(E, `${why}; folosesc ${to === 'canva' ? 'Canva' : 'ChatGPT'} pentru această imagine (ai permis alternarea, o singură dată).`, 'warn');
    return callImage(E, { ...args, provider: to }, label, budget);
  };
  try {
    if (engine === 'chatgpt') {
      for (let tries = 0; ; tries++) {
        try {
          const files = await Promise.all((args.files || []).map(f => repo.absFile(E.pid, f)));
          const r = await GPTImage.generate({ prompt: args.prompt, aspectRatio: args.aspectRatio, files: files.filter(Boolean), signal: E.ctl.signal });
          ok = true; recordCall('image_gpt'); return { ...r, engine };
        } catch (e) {
          if (e?.code !== 'image_pause') throw e;
          if (E.project.options?.image_fallback && canva.status().connected && args.references?.length !== undefined) return await hop('canva', 'ChatGPT cere pauză');
          if (budget.expired()) throw { code: 'rate_limited', resetAt: Date.now() + 15 * 60e3, budget: budget.snapshot(), message: 'ChatGPT cere pauze lungi pentru imagini; proiectul continuă singur mai târziu.' };
          const until = Date.now() + (canvaCfg.pauseMin + tries) * 60e3; const c = LIVE.get(id); if (c) { c.label = `${label} (ChatGPT: pauză până la ${hhmm(until)})`; emitLive(); }
          await logE(E, `ChatGPT a cerut o pauză pentru imagini; reiau la ${hhmm(until)}.`, 'warn');
          await new Promise((res, rej) => { const tm = setTimeout(res, until - Date.now()); E.ctl.signal.addEventListener('abort', () => { clearTimeout(tm); rej({ code: 'stopped' }); }, { once: true }); });
        }
      }
    }
    for (;;) {
      await beforeImage(E.ctl.signal, (until, why) => { const c = LIVE.get(id); if (c) { c.label = `${label} (aștept până la ${hhmm(until)}${why ? ': ' + why : ''})`; emitLive(); } });
      const c = LIVE.get(id); if (c) { c.label = label; c.since = now(); emitLive(); }
      try { const r = await canva.generate({ ...args, signal: E.ctl.signal, resumeJobId, onAccepted: jobId => noteExternal({ provider: 'canva', providerJobId: jobId }) }); ok = true; recordCall('image'); return { ...r, engine: 'canva' }; }
      catch (e) {
        if (e?.code !== 'canva_pause') throw e;
        if (E.project.options?.image_fallback && GPTImage.codexStatus().ready) return await hop('chatgpt', 'Canva cere pauză');
        const until = canvaPaused();                                      // wait politely, then retry the same image
        if (budget.expired()) throw { code: 'rate_limited', resetAt: until + canvaCfg.pauseMin * 60e3, budget: budget.snapshot(), message: 'Canva cere pauze lungi; proiectul continuă singur mai târziu.' };
        await logE(E, `Canva a cerut o pauză; reiau imaginea la ${hhmm(until)}.`, 'warn');
      }
    }
  } finally { end(ok); LIVE.delete(id); emitLive(); Ledger.record({ kind: 'image', pid: E.pid, unit: FENCE.getStore()?.key || null, vol: E.curStage?.vol ?? E.taskVol ?? null, stage: E.curStage?.base || E.curStage?.key || '_task', engine, ok, ms: Date.now() - t0, redraw: !!args.redraw || undefined, budget: budget.snapshot().used }); }
}
function checkOut(out, spec, ctx, schema = null) {
  if (out == null || typeof out !== 'object' || Array.isArray(out)) return 'the reply must be a single JSON object';
  if (schema) { const e = validateSchema(out, schema); if (e) return e; }   // v19 (plan 1.3): the output contract of this prompt
  for (const r of spec?.required || []) {                       // e.g. "pages[].text": every page must have a non-empty text
    const [head, tail] = r.split('[].');
    const val = getPath(out, head);
    if (tail) { if (!Array.isArray(val) || !val.length) return `"${head}" must be a non-empty array`; const bad = val.findIndex(x => { const y = getPath(x, tail); return y == null || (y === '' && !(tail === 'text' && x.page_type === 'wordless')) || (Array.isArray(y) && !y.length && tail !== 'characters'); }); if (bad >= 0) return `"${head}[${bad}].${tail}" is missing or empty`; }
    else if (val == null || val === '') return `"${r}" is missing`;
  }
  const v = spec?.validate; if (!v) return null;
  const arr = getPath(out, v.path); const want = Number(getPath(ctx, v.length));
  if (!Array.isArray(arr)) return `"${v.path}" must be an array`;
  if (want && arr.length !== want) return `"${v.path}" has ${arr.length} items but must have exactly ${want}`;
  return null;
}
async function llmValidated(E, prompt, spec, ctx, label, agent = 'producator', promptKey = null, model = undefined) {
  const schema = promptKey ? schemaFor(E.bp, promptKey, ctx) : null;
  let out = await callLLM(E, prompt, { label, agent, promptKey, schemaCtx: ctx, model });
  let problem = checkOut(out, spec, ctx, schema);
  if (problem) {
    out = await callLLM(E, prompt + `\n\nIMPORTANT: your previous reply was rejected because ${problem}. Reply again with ONLY the corrected, complete JSON.`, { label: label + ' (corectez structura)', agent, promptKey, schemaCtx: ctx, model });
    problem = checkOut(out, spec, ctx, schema);
    if (problem) throw { code: 'validation', message: problem };
  }
  return out;
}

export function buildCtx(E, extra = {}) {
  const bp = E.bp, input = E.project.input || {};
  const ctx = {
    product: { name: bp.name, full_name: bp.full_name, brief_en: bp.brief_en, description: bp.description },
    structure: bp.structure, input, options: E.project.options || {}, ui_language: bp.ui_language || 'Romanian',
    age_profile: bp.age_profiles?.[input[bp.variant_key]] || {}, rubric: bp.rubric,
    style: bp.style_presets?.[input[bp.style_key]] || Object.values(bp.style_presets || {})[0] || {},
    format: bp.formats?.[input[bp.format_key]] || Object.values(bp.formats || {})[0] || {},
    refs_count: (E.project.refs || []).length, refs_names: (E.project.refs || []).map(r => r.name).join(', '),
    notes: (E.project.notes || []).filter(Boolean).join('\n'), rejections: (E.project.rejections || []).filter(Boolean).join('\n'), constraints: ''
  };
  for (const [k, a] of Object.entries(E.art)) ctx[k] = a.content;
  const cons = E.art.constraints?.content?.constraints;
  if (Array.isArray(cons)) ctx.constraints = cons.join('\n');
  Object.assign(ctx, extra);
  ctx.seed_story_for_volume = Number(ctx.n) === 1 ? (input.seed_story || '') : '';
  /* the slice of the cast plan that concerns the current volume */
  const cast = E.art.cast?.content;
  if (cast && ctx.n) {
    const names = Object.fromEntries((E.art.bible?.content?.characters || []).map(c => [c.id, c.name]));
    ctx.cast_volume = (cast.characters || []).map(c => ({ id: c.id, name: names[c.id] || c.id, role: c.role, arc: c.arc, ...((c.volumes || []).find(v => Number(v.volume) === Number(ctx.n)) || { presence: 'absent' }) }))
      .filter(c => c.presence && c.presence !== 'absent');
  }
  ctx.plan_volume = ctx.n && E.art['plan_' + (Number(ctx.n) - 1)] ? E.art['plan_' + (Number(ctx.n) - 1)].content.pages : '';   // P4-T03: scripts follow the approved PageBlueprints
  ctx.bible_volume = volumeBible(E, ctx.script || null, ctx.cast_volume);
  ctx.editorial_findings = editorialFindings(bp, E.art, Number.isInteger(extra.i) ? extra.i : E.curStage?.vol ?? null);
  ctx.codes = (bp.rubric || []).map(r => (typeof r === 'object' ? `${r.code} ${String(r.text).split(':')[0]}` : null)).filter(Boolean).join('; ');
  return ctx;
}
/* v19 (plan 1.5): the Story Bible trimmed to the characters of this volume (cast plan + those the script uses); objects and world stay */
const buildCodes = bp => (bp.rubric || []).filter(r => typeof r === 'object').map(r => `${r.code} ${String(r.text).split(':')[0]}`).concat((bp.rubric_visual || []).map(r => `${r.code} ${r.key}`)).join('; ');
export function volumeBible(E, script, castVolume) {
  const bible = E.art.bible?.content; if (!bible) return null;
  const ids = new Set();
  for (const c of castVolume || []) ids.add(c.id);
  for (const pg of [script?.cover, ...(script?.pages || [])]) for (const id of pg?.characters || []) ids.add(id);
  const main = E.art.cast?.content?.main_character; if (main) ids.add(main);
  const chars = (bible.characters || []).filter(c => !ids.size || ids.has(c.id));
  const { style_guide, ...rest } = bible;                       // the illustration style travels only to image prompts
  return { ...rest, characters: chars.length ? chars : bible.characters };
}
function applyBind(E, spec, ctx) {
  for (const [name, src] of Object.entries(spec.bind || {})) {
    const path = tpl(src, ctx); const [k, ...rest] = path.split('.');
    ctx[name] = rest.length ? getPath(E.art[k]?.content, rest.join('.')) : E.art[k]?.content;
  }
  for (const L of spec.lookup || []) {
    const pool = getPath(ctx, L.from) || []; const ids = getPath(ctx, L.by) || [];
    ctx[L.as] = (Array.isArray(ids) ? ids : [ids]).map(id => pool.find(x => x?.[L.key] === id)).filter(Boolean)
      .map(x => { if (!L.fields) return x; const o = Object.fromEntries(L.fields.map(f => [f.split('.').pop(), getPath(x, f)]));
        if (/characters$/.test(L.from) && L.fields.includes('canonical_description')) { const lc = landmarkContext(x); if (lc.deduplicated) { o.canonical_description = lc.description; o.landmarks = lc.landmarks.map(({ id, side, body_region, anchor, shape, colour, relative_size, occlusion_rule }) => ({ id, side, body_region, anchor, shape, colour, relative_size, occlusion_rule })); } }   // P4-T03 (DW03): landmarks once, structured; raw unchanged
        return o; });
  }
  return ctx;
}
async function saveArt(E, key, content, o = {}) { const f = FENCE.getStore(); f?.outputs?.add(key); const d = await repo.writeArtifact(E.pid, key, content, f && jobs ? { ...o, fence: { rel: jobs.rel(f.pid, f.key), token: f.token } } : o); E.art[key] = d; return d; }
async function setStage(E, key, patch) { await repo.patchProject(E.pid, { stages: { [key]: patch } }); }
async function logE(E, text, kind = 'info') { const log = [...(E.project.log || []), { t: now(), text, kind }].slice(-120); await repo.patchProject(E.pid, { log }); }

/* fan-out with checkpoints: finished items are never redone on resume */
/* P3-T03: one durable unit — lease (fencing token), start, work under the fence, commit; release with the stop reason on failure */
async function unit(E, key, label, extra, work) {
  if (!jobs || !E.runId) return work();
  const parent = FENCE.getStore();
  extra = { ...extra, task: E.task ? canonicalHash(E.task) : null };   // a correction is new work: never "reused" (see reuseIf below)
  const before = Object.fromEntries(Object.entries(E.art).map(([k, a]) => [k, a.version]));
  const inputsHash = unitInputsHash({ stage: { key, parent: parent?.key || null }, project: E.project, artifacts: E.art, blueprintVersion: E.bp.version, extra });
  const lease = await jobs.acquire(E.pid, key, { inputsHash, label, owner: `${INSTANCE}:${E.runOwner || E.runId}`, kind: parent ? 'item' : 'stage', meta: { run: E.project.run || 1, stage: parent?.key || key, parent: parent?.key || null }, reuseIf: E.task ? () => false : prev => prev.result?.inputsExcl === unitInputsHash({ stage: { key, parent: parent?.key || null }, project: E.project, artifacts: Object.fromEntries(Object.entries(E.art).filter(([k]) => !(prev.result?.outputs || []).includes(k))), blueprintVersion: E.bp.version, extra }) });
  if (lease.reused) return null;
  const lastAttempt = lease.job.attempts?.[lease.job.attempts.length - 1];
  const f = { pid: E.pid, key, token: lease.token, outputs: new Set(), resumeProviderJobId: lease.job.resolution?.action === 'retry' ? [...(lastAttempt?.external || [])].reverse().find(x => x.providerJobId)?.providerJobId || null : null }; (E.leases ||= new Map()).set(key, f);   // P3-T04: an accepted provider job is looked up, not regenerated
  await jobs.start(E.pid, key, lease.token);
  try {
    const out = await FENCE.run(f, work);
    const outputs = [...f.outputs].sort(); for (const k of outputs) parent?.outputs?.add(k);   // attributed through the fence, not by diff (safe under concurrency)
    const inputsExcl = unitInputsHash({ stage: { key, parent: parent?.key || null }, project: E.project, artifacts: Object.fromEntries(Object.entries(before).filter(([k]) => !outputs.includes(k)).map(([k, v]) => [k, { version: v }])), blueprintVersion: E.bp.version, extra });
    await jobs.commit(E.pid, key, lease.token, { result: { outputs, versions: Object.fromEntries(outputs.map(k => [k, E.art[k].version])), inputsExcl } });
    E.leases.delete(key); return out;
  } catch (e) {
    const status = e?.code === 'ambiguous_output' ? 'ambiguous' : e?.code === 'skip' ? 'skipped' : e?.code === 'paused' ? 'paused' : e?.code === 'stopped' ? 'cancelled' : e?.code === 'rate_limited' ? 'waiting_provider' : e?.code === 'stale_lease' ? null : 'failed';
    if (status) await jobs.release(E.pid, key, lease.token, { status, stopReason: errMsg(e) }).catch(() => {});
    E.leases.delete(key); throw e;
  }
}
async function runItems(E, stage, items, labels, fn) {
  const prev = E.project.stages?.[stage.key] || {};
  const status = (Array.isArray(prev.items) && prev.items.length === items.length && prev.run === E.project.run)
    ? prev.items.map(s => (s === 'done' ? 'done' : 'pending')) : items.map(() => 'pending');
  const flush = () => setStage(E, stage.key, { status: 'running', items: [...status], labels, done: status.filter(s => s === 'done').length, total: items.length, run: E.project.run });
  await flush();
  const queue = items.map((_, i) => i).filter(i => status[i] !== 'done');
  let fatal = null, soft = 0;
  const worker = async () => {
    while (queue.length && !fatal && !E.stopped && !E.pausing) {
      const i = queue.shift(); status[i] = 'running'; await flush();
      try { await unit(E, `${stage.key}#${i}`, labels[i], { i, run: E.project.run }, () => fn(items[i], i)); status[i] = 'done'; }
      catch (e) {
        status[i] = 'error';
        if (stage.tolerate_item_errors && !HARD.has(e?.code)) { soft++; await logE(E, `${stage.label}, ${labels[i]}: ${errMsg(e)}`, 'warn'); }
        else fatal = e;
      }
      await flush();
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(stage.concurrency || 1, queue.length || 1)) }, worker));
  if (E.stopped) throw { code: 'stopped' };
  if (fatal) throw fatal;
  if (E.pausing && queue.length) throw { code: 'paused' };
  return { soft };
}

export function pageData(src, p) {
  if (!src) return null;
  if (p === 0) return { ...(src.cover || {}), text_zone: 'top', composition: src.cover?.composition || 'hero shot, main characters large and centred in the lower two thirds, calm open space at the top for the title' };
  return (src.pages || [])[p - 1] || null;
}
const ext = mime => (/jpe?g/.test(mime) ? 'jpg' : /webp/.test(mime) ? 'webp' : 'png');
const aspectOf = (stage, ctx) => tpl(stage.aspect_ratio || '{{format.aspect}}', ctx) || 'SQUARE_1_1';
/* short, stable project code for file names, e.g. "dw" -> page-dw01-story-03-v2.png */
async function codeOf(E) {
  if (E.project.code) return E.project.code;
  const title = String(E.art.brief?.content?.collection_title || E.project.title || 'tp');
  const words = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
  const code = (words.length >= 2 ? words[0][0] + words[1][0] : (words[0] || 'tp').slice(0, 2)).padEnd(2, 'x');
  await repo.patchProject(E.pid, { code }); return code;
}
const pad = n => String(n).padStart(2, '0');

/* one book page: colour illustration, then its colouring-book twin made FROM the colour image */
const mimeOf = f => (/\.jpe?g$/i.test(f) ? 'image/jpeg' : /\.webp$/i.test(f) ? 'image/webp' : 'image/png');
/* page contract for the inspector: what must be visible, who does what, what must never appear */
function pageContract(E, v, p) {
  const src = E.art[`final_${v}`]?.content || E.art[`script_${v}`]?.content; const pg = pageData(src, p) || {};
  const chars = (E.art.bible?.content?.characters || []).filter(c => (pg.characters || []).includes(c.id));
  const objs = (E.art.bible?.content?.objects || []).filter(o => (pg.objects || []).includes(o.id));
  return { page: pageLabel(v, p), scene: pg.scene, actions: pg.actions || [], effects: pg.effects || 'none', must_not_show: pg.must_not_show || [],
    emotion: pg.emotion, new_information: pg.new_information, image_added_value: pg.image_added_value, storyboard: pg.storyboard, previous_scene: pageData(src, p - 1)?.scene, next_scene: pageData(src, p + 1)?.scene,
    characters: chars.map(c => ({ id: c.id, anatomy: c.anatomy || null, invariants: c.invariants || [], visual_landmarks: c.visual_landmarks || [], never: [...(c.anatomy?.never || []), ...(c.forbidden_deviations || [])] })),
    objects: objs.map(o => ({ id: o.id, invariants: o.invariants || [] })), ids: pg.characters || [] };
}
async function qaPages(E, stage, pages, { redraw = null, batch = 6 } = {}) {
  const refs = (E.art.anchors?.content?.prompts || []).filter(x => x.ref && x.image); const results = [];
  const batches = []; for (let i = 0; i < pages.length; i += batch) batches.push(pages.slice(i, i + batch));
  const inspect = async list => {
    const info = list.map(([v, p]) => ({ v, p, c: pageContract(E, v, p) }));
    const useRefs = refs.filter(r => info.some(x => x.c.ids.includes(r.ref))).slice(0, 3); const images = [];
    for (const r of useRefs) images.push({ mime: mimeOf(r.image), data: (await repo.readFile(E.pid, r.image)).toString('base64') });
    for (const x of info) { const f = E.art[`ill_${x.v}_${x.p}`].content.color; images.push({ mime: mimeOf(f), data: (await repo.readFile(E.pid, f)).toString('base64') }); }
    const neighbours = [];
    for (const x of [info[0], info[info.length - 1]]) for (const p of [x.p - 1, x.p + 1]) {
      const f = E.art[`ill_${x.v}_${p}`]?.content?.color;
      if (p < 1 || p > E.bp.structure.pages || !f || info.some(i => i.v === x.v && i.p === p) || neighbours.some(n => n.v === x.v && n.p === p)) continue;
      neighbours.push({ v: x.v, p, image: images.length, contract: pageContract(E, x.v, p) });
      images.push({ mime: mimeOf(f), data: (await repo.readFile(E.pid, f)).toString('base64') });
    }
    const ctx = buildCtx(E, { known_failures: knownFailures(), refs_list: useRefs.map((r, i) => ({ image: i, character: r.ref })), pages_list: info.map((x, j) => ({ image: useRefs.length + j, ...x.c, ids: undefined })) });
    const out = await callLLM(E, tpl(E.bp.prompts.visual_qa, ctx) + '\nSEQUENCE CONTEXT (reference only, no extra verdicts): ' + JSON.stringify(neighbours) + '\nCheck spatial direction, relative character size, handedness and landmark placement, object state, light and premature reveals against neighbouring images. Put any broken continuity or missing visual added value in the story verdict.', { label: `Directorul artistic verifică: ${info.map(x => x.c.page).join(', ')}`, agent: 'director-artistic', images });
    const verdicts = visualVerdicts(out, info.map((_, j) => useRefs.length + j));
    const ageProfile = buildCtx(E).age_profile || {};
    return info.map((x, j) => { const r = verdicts[j];
      const cons = visualConsistency(r, { contract: x.c, bible: E.art.bible?.content, ageProfile });   // P5-T03: the verdict must agree with the contract and the canon
      const dims = [...new Set(['anatomy', 'action', 'story', 'readability'].filter(k => r[k] === false).concat(cons.failed))];
      if (cons.issues.length) r.issues = [...(r.issues || []), ...cons.issues];
      if (cons.failed.length && !r.instruction) r.instruction = 'Fix: ' + cons.issues.join(' ');
      const safety = ['pass', 'review', 'block'].includes(String(r.safety || '').toLowerCase()) ? String(r.safety).toLowerCase() : null;   // P5-T01: separate from ok; absent → unknown
      const res = { v: x.v, p: x.p, ok: r.ok !== false && !dims.length && safety !== 'block', failed: safety === 'block' ? [...dims, 'safety'] : dims, issues: r.issues || [], instruction: r.instruction || '', safety, safety_reasons: Array.isArray(r.safety_reasons) ? r.safety_reasons.map(String).slice(0, 6) : [] };
      if (!res.ok) { const code = c => (E.bp.rubric_visual || []).find(v => v.key === c)?.code || null; (res.issues.length ? res.issues : dims).forEach(t => noteVisualFailure(t, code(dims[0]))); }   // 3.9
      return res; });
  };
  const save = async r => { const key = `ill_${r.v}_${r.p}`; if (E.art[key]) { const qa = { ok: r.ok, failed: r.failed, issues: r.issues, redrawn: !!r.redrawn, error: r.error || null, color: E.art[key].content.color, safety: r.safety || null, safety_reasons: r.safety_reasons || [], at: now() }; await repo.patchArtifact(E.pid, key, { content: { qa } }); E.art[key].content.qa = qa; } };
  await runItems(E, { key: stage.key, label: stage.label, concurrency: 2, tolerate_item_errors: true }, batches, batches.map(b => `${pageLabel(...b[0])} … ${pageLabel(...b[b.length - 1])}`), async list => {
    for (const r of await inspect(list)) {
      if (!r.ok && redraw && r.instruction) {
        try {
          await imageOne(E, redraw, r.v, r.p, r.instruction, { redraw: true });
          const again = (await inspect([[r.v, r.p]]))[0];               // corrective regression check: the WHOLE contract again, not only the reported defect
          Object.assign(r, again, { redrawn: true, firstIssues: r.issues });
        } catch (e) { if (HARD.has(e?.code)) throw e; r.error = errMsg(e); }
      }
      await save(r); results.push(r);
    }
  });
  return results;
}
async function imageOne(E, stage, v, p, instruction, opts = {}) {
  const srcKey = `${stage.source}_${v}`;
  const src = E.art[srcKey]?.content; const page = pageData(src, p);
  if (!page) throw { code: 'validation', message: `lipsește sursa ${srcKey}` };
  const ctx = applyBind(E, stage, buildCtx(E, { page, v, p, n: v + 1, label: pageLabel(v, p), instruction: instruction || '' }));
  const key = `ill_${v}_${p}`; const prev = E.art[key]?.content || {};
  let prompt = tpl(E.bp.templates[(p === 0 && stage.cover_template) || stage.template || 'page_image'], ctx);
  const refs = [], refFiles = []; const engine = opts.provider || imageEngineOf(E);
  if (stage.use_references) {
    const sheets = (E.art.anchors?.content?.prompts || []).filter(x => x.ref && (page.characters || []).includes(x.ref));
    sheets.slice(0, stage.max_references || 3).forEach(x => { if (x.mediaId) refs.push({ type: 'MEDIA', id: x.mediaId }); if (x.image) refFiles.push(x.image); });
    if ((engine === 'chatgpt' ? refFiles.length : refs.length) && stage.reference_hint) prompt += ' ' + stage.reference_hint;
  }
  if (instruction && !opts.lineOnly) prompt += ' Additional art direction: ' + instruction;
  const wantImages = !stage.optional_flag || E.project.options?.[stage.optional_flag] !== false || !!instruction;
  const next = { prompt, v, p, status: prev.color ? prev.status : 'prompt_only', color: prev.color || null, lineart: prev.lineart || null, mediaId: prev.mediaId || null, lineMediaId: prev.lineMediaId || null, link: prev.link || null, instruction: instruction || '', engine: prev.engine || null, ...(opts.lineOnly ? { qa: prev.qa || null } : {}) };   // a colouring-only redo keeps the colour image's engine and its check
  if (wantImages) {
    const ver = (E.art[key]?.version || 0) + 1; const code = await codeOf(E);
    const base = (book, n) => `images/page-${code}${pad(v + 1)}-${book}-${p === 0 ? 'cover' : pad(p)}-v${n}`;
    if (opts.lineOnly && !prev.color) throw { code: 'validation', message: 'Lipsește imaginea color; nu pot corecta numai pagina de colorat.' };
    if (opts.lineOnly && prev.color && !prev.mediaId && engine === 'canva' && canva.status().connected) prev.mediaId = await canva.upload(await repo.readFile(E.pid, prev.color));
    if (opts.lineOnly && engine === 'canva' && !prev.mediaId) throw { code: 'validation', message: 'Imaginea color nu poate fi folosită ca referință. Culoarea aprobată rămâne păstrată.' };   // upload (free), not a new generation
    const img = opts.lineOnly && prev.color && (prev.mediaId || engine === 'chatgpt') ? { mediaId: prev.mediaId, lineOnly: true }   // only the colouring page is redone, from the approved colour image
      : await callImage(E, { prompt, aspectRatio: aspectOf(stage, ctx), references: refs, files: refFiles, provider: engine, redraw: !!opts.redraw }, `${tpl(stage.activity || stage.label, ctx)} (color)`);
    if (!img.lineOnly) next.engine = img.engine || engine;
    next.color = img.lineOnly ? prev.color : await repo.saveFile(E.pid, `${base('story', ver)}.${ext(img.mime)}`, img.buffer);
    next.mediaId = img.mediaId; next.link = img.lineOnly ? prev.link : img.link; next.status = 'color'; next.lineart = null; next.lineMediaId = null;
    const wantLine = !opts.deferLine && stage.lineart_template && (opts.lineOnly || opts.forceLine || (!stage.defer_lineart && (!stage.lineart_pages || stage.lineart_pages.includes(p))));   // colouring pages are made only when they are needed
    if (!wantLine && img.lineOnly !== true) { next.status = 'color'; next.linePending = !!prev.lineart || !!stage.lineart_template; }
    else if (stage.lineart_template) {
      if (!img.mediaId && (img.engine || engine) !== 'chatgpt' && engine !== 'chatgpt') { next.status = 'color_only'; }
      else {
        const lp = tpl(E.bp.templates[stage.lineart_template], ctx) + (opts.lineOnly && instruction ? ' Additional direction for this colouring page: ' + instruction : '');
        next.lineFrom = next.color; next.linePending = false;
        /* P6-T03: a good colouring page of the SAME colour is kept when a new candidate fails; the failed candidate is retained for inspection */
        const prevGood = opts.lineOnly && prev.lineart && prev.lineFrom === prev.color && prev.lineQA?.ok === true && (!prev.lineQA.for || prev.lineQA.for === prev.lineart) ? { lineart: prev.lineart, lineFrom: prev.lineFrom, lineQA: prev.lineQA, lineMediaId: prev.lineMediaId || null, ...(prev.lineartRaw ? { lineartRaw: prev.lineartRaw } : {}) } : null;
        const keepCandidate = cand => { next.lineCandidates = [...(prev.lineCandidates || []), { ...cand, from: next.color, at: now() }].slice(-6); };
        const cq = (raw, fin) => coloringQA(raw, { bp: E.bp, project: E.project, page, ill: prev, final: fin });
        try {
          const lineRefs = img.mediaId ? [{ type: 'MEDIA', id: img.mediaId }] : []; const lineEngine = img.mediaId ? (opts.provider || (next.engine === 'chatgpt' ? 'chatgpt' : engine)) : 'chatgpt';
          const li = await callImage(E, { prompt: lp, aspectRatio: aspectOf(stage, ctx), references: lineRefs, files: [next.color], provider: lineEngine }, `${tpl(stage.activity || stage.label, ctx)} (colorat)`);
          next.lineart = await repo.saveFile(E.pid, `${base('coloring', ver)}.${ext(li.mime)}`, li.buffer);
          next.lineMediaId = li.mediaId; next.status = 'complete';
          const age = E.project.input?.[E.bp.variant_key];
          let q = cq(li.buffer);
          if (!q.ok && q.issues.some(x => /gri|culoare/.test(x))) {         // one automatic retry for grey/colour
            const li2 = await callImage(E, { prompt: lp + ' STRICT: pure black lines on pure white only; absolutely no grey, no shading, no colour, no texture.', aspectRatio: aspectOf(stage, ctx), references: lineRefs, files: [next.color], provider: lineEngine }, `${tpl(stage.activity || stage.label, ctx)} (colorat, a doua încercare)`);
            next.lineart = await repo.saveFile(E.pid, `${base('coloring', ver)}.${ext(li2.mime)}`, li2.buffer); next.lineMediaId = li2.mediaId;
            q = { ...cq(li2.buffer), retried: true };
          }
          next.lineQA = q;
          if (!q.issues?.some(x => /culoare|umbre/.test(x))) {
            const raw = await repo.readFile(E.pid, next.lineart); const bw = normalizeLineart(raw);
            if (bw) { next.lineartRaw = next.lineart; next.lineart = await repo.saveFile(E.pid, next.lineart.replace(/\.(png|jpg|webp)$/i, '.bw.png'), bw); next.lineQA = { ...cq(raw, bw), ...(q.retried ? { retried: true } : {}), normalized: true }; }   // P6-T03: physical measures on the file that prints
          }
          next.lineQA = { ...next.lineQA, for: next.lineart, colorFrom: next.color };   // P5-T03: the coloring check is bound to the exact file it judged
          if (!next.lineQA.ok && prevGood) { keepCandidate({ file: next.lineart, raw: next.lineartRaw || null, qa: next.lineQA }); delete next.lineartRaw; Object.assign(next, prevGood); next.lineRejected = 'Candidatul nou nu a trecut verificarea; pagina de colorat bună a rămas.'; }
          else if (!next.lineQA.ok) keepCandidate({ file: next.lineart, qa: next.lineQA, current: true });
        } catch (e) { keepCandidate({ error: errMsg(e) }); if (prevGood) { Object.assign(next, prevGood, { status: 'complete', linePending: false, lineError: errMsg(e) }); await saveArt(E, key, next, { keep: 10, stage: stage.key, note: 'Derivarea nouă a eșuat; culoarea și pagina de colorat bună au rămas', basedOn: { key: srcKey, version: E.art[srcKey]?.version, pageHash: sceneFingerprint(page) } }); throw e; }
          next.status = 'color_only'; next.linePending = true; next.lineError = errMsg(e); await saveArt(E, key, next, { keep: 10, stage: stage.key, note: 'Culoarea păstrată; derivarea de colorat necesită reluare', basedOn: { key: srcKey, version: E.art[srcKey]?.version, pageHash: sceneFingerprint(page) } }); throw e; }
      }
    }
  }
  await saveArt(E, key, next, { keep: 3, stage: stage.key, note: instruction ? 'Regenerată: ' + instruction.slice(0, 90) : stage.label, basedOn: { key: srcKey, version: E.art[srcKey]?.version, pageHash: sceneFingerprint(page) } });
}

export function runPreflight(bp, art, ctx, vol = null) {
  const out = [];
  const inVol = v => vol == null || v === vol;
  for (const c of bp.preflight || []) {
    if (c.source?.startsWith('tr_') && !ctx.input?.second_language) continue;
    if (['visual', 'illustrations'].includes(c.type) && ctx.options?.images === false) { out.push({ label: c.label, status: 'warn', detail: 'Proiect configurat explicit fără imagini; verificarea vizuală nu se aplică.' }); continue; }
    const keys = Object.keys(art).filter(k => (c.source ? globMatch(c.source, k) != null : false) && (vol == null || k.endsWith('_' + vol))).sort();
    if (c.type === 'count') {
      const want = Number(getPath(ctx, c.equals)); const bad = keys.filter(k => (getPath(art[k].content, c.path) || []).length !== want);
      out.push({ label: c.label, status: !keys.length || bad.length ? 'fail' : 'pass', detail: !keys.length ? 'Nu există conținut final.' : bad.length ? `Nepotriviri: ${bad.map(k => defFor(bp, k).label).join(', ')}` : `${keys.length} volume verificate, câte ${want} pagini.` });
    } else if (c.type === 'max_len') {
      const target = Number(getPath(ctx, c.max)); const max = Math.round(target * (c.tolerance || 1)); const over = [];
      keys.forEach(k => (getPath(art[k].content, c.path) || []).forEach((pg, i) => { const L = String(pg?.[c.field] || '').length; if (L > max) over.push(`${defFor(bp, k).label.split(':')[0]}, p. ${i + 1} (${L} caractere)`); }));
      out.push({ label: c.label, status: !keys.length ? 'fail' : over.length ? 'warn' : 'pass', detail: !keys.length ? 'Fără conținut final; lungimea nu a fost verificată.' : over.length ? `Mult peste ghidul de ~${target} caractere (doar informativ): ${over.slice(0, 8).join('; ')}${over.length > 8 ? '…' : ''}` : `Textul e în jurul ghidului de ~${target} caractere pe pagină.` });
    } else if (c.type === 'visual') {
      const S = bp.structure; let bad = 0, fixed = 0, checked = 0;
      for (let v = 0; v < S.volumes; v++) if (inVol(v)) for (let p = 0; p <= S.pages; p++) { const q = art[`ill_${v}_${p}`]?.content?.lineQA; if (q) { checked++; if (!q.ok) bad++; } }
      const vq = []; let expected = 0;
      for (let v = 0; v < S.volumes; v++) if (inVol(v)) for (let p = 0; p <= S.pages; p++) { expected++; const a = art[`ill_${v}_${p}`]?.content; if (a?.qa) vq.push({ ...a.qa, ok: a.qa.ok === true && (!a.qa.color || a.qa.color === a.color) }); }
      const flagged = vq.filter(x => x.ok !== true); fixed = vq.filter(x => x.redrawn && x.ok === true).length;
      out.push({ label: c.label, status: bad || flagged.length || checked !== expected || vq.length !== expected ? 'fail' : 'pass', detail: `Pagini de colorat verificate: ${checked}/${expected}, cu probleme: ${bad}. Imagini verificate: ${vq.length}/${expected}, nereușite: ${flagged.length}, redesenate și reverificate corect: ${fixed}.` });
    } else if (c.type === 'illustrations') {
      const S = bp.structure; let total = 0, col = 0, line = 0, stale = 0;
      for (let v = 0; v < S.volumes; v++) if (inVol(v)) for (let p = 0; p <= S.pages; p++) {
        total++; const a = art[`ill_${v}_${p}`];
        if (a?.content?.color) col++; if (a?.content?.lineart) line++;
        if (a?.basedOn && art[a.basedOn.key] && (a.basedOn.pageHash ? sceneFingerprint(pageData(art[a.basedOn.key].content, p)) !== a.basedOn.pageHash : art[a.basedOn.key].version !== a.basedOn.version)) stale++;
      }
      out.push({ label: c.label, status: col === total && line === total && !stale ? 'pass' : 'fail', detail: `${col} din ${total} ilustrații color, ${line} din ${total} pagini de colorat${stale ? `, ${stale} depășite de o scenă modificată` : ''}.` });
    }
  }
  out.push({ label: 'Profil de culoare', status: 'warn', detail: 'PDF-ul este RGB. Pentru tipografie, conversia CMYK (PDF/X) se face la tipografie sau cu Ghostscript.' });
  return out;
}


/* ---------- v19: evaluation, structure gate, alignment, targeted revision ---------- */
/* 1.7: one score per rubric criterion; the overall score is computed here; critical criteria (safety, age, format) have their own floor */
export function evaluateCritique(c, bp, stage, threshold) { return rubricEvaluation(c, bp, stage, threshold); }
/* 2.1: the checks code can do by itself, before any call. hard = must be fixed first; soft = warnings for the critic */
export function lintScript(E, c, ctx) {
  const L = E.bp.lint || {}; const pages = c?.pages || []; const hard = [], soft = [];
  const want = Number(E.bp.structure?.pages) || pages.length; const max = Number(ctx.age_profile?.max_chars) || 0;
  const ids = new Set((E.art.bible?.content?.characters || []).map(x => x.id)); const cast = new Set((ctx.cast_volume || []).map(x => x.id));
  const words = [...(L.forbidden_words?.['*'] || []), ...(L.forbidden_words?.[E.project.input?.[E.bp.variant_key]] || [])];
  const wre = words.length ? new RegExp(`(^|[^\\p{L}])(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?=$|[^\\p{L}])`, 'iu') : null;
  if (pages.length !== want) hard.push({ page: null, code: 'T08', problem: `The volume has ${pages.length} pages instead of ${want}.`, fix: `Write exactly ${want} pages.` });
  if (!pageSequence(pages, want)) hard.push({ page: null, code: 'T08', problem: 'Page numbers must be unique and exactly 1..' + want + '.', fix: 'Restore the complete ordered page sequence.' });
  pages.forEach((pg, k) => {
    const n = Number(pg?.n) || k + 1; const t = String(pg?.text || '');
    if (!t.trim() && pg.page_type !== 'wordless') hard.push({ page: n, code: 'T08', problem: 'The page has no text.', fix: 'Write the page text.' });
    if (max && t.length > max * (L.hard_len_factor || 2)) hard.push({ page: n, code: 'T08', quote: t.slice(0, 80), problem: `The text has ${t.length} characters, far above the guideline of about ${max}.`, fix: 'Shorten it to the age guideline.' });
    else if (max && t.length > max * (L.soft_len_factor || 1.35)) soft.push(`Page ${n}: ${t.length} characters (guideline about ${max}).`);
    const unknown = (pg?.characters || []).filter(id => ids.size && !ids.has(id));
    if (unknown.length) hard.push({ page: n, code: 'T03', problem: `Unknown character id(s): ${unknown.join(', ')}.`, fix: 'Use only ids from the Story Bible.' });
    const off = (pg?.characters || []).filter(id => cast.size && ids.has(id) && !cast.has(id));
    if (off.length) soft.push(`Page ${n}: ${off.join(', ')} is not in the cast plan of this volume.`);
    const m = wre && t.match(wre); if (m) soft.push(`Page ${n}: the word "${m[2]}" may be unsuitable for the age.`);
  });
  /* P4-T04: structured, citeable QA inputs for the critic (causality, age complexity, voice, science/T18) — never a cut */
  try {
    const chars = E.art.bible?.content?.characters || [], mainId = E.art.cast?.content?.main_character || chars.find(x => x.role === 'main')?.id, band = E.project.input?.[E.bp.variant_key];
    const world = /^(none|fara|no|nu)/i.test(String(E.art.bible?.content?.world_rules?.magic || 'none')) ? 'natural' : 'fantasy', vb = Number.isInteger(ctx.i) ? E.art.series?.content?.volumes?.[ctx.i]?.story_bible : null;
    soft.push(...criticNotes({ findings: [...storyCausality(c, { bible: vb, mainId, mainName: chars.find(x => x.id === mainId)?.name }).findings, ...ageFit(pages, band, E.bp.age_profiles?.[band] || {}).findings, ...storyVoice(pages, E.project.input?.language).findings, ...storyScience(pages, { world }).findings] }));
  } catch (e) { console.warn('[story contract]', e?.message || e); }
  return { hard, soft };
}
/* 2.4: adaptation vs original, page by page (names never change; similar length) */
export function alignWarnings(E, src, tr) {
  const out = []; const names = (E.art.bible?.content?.characters || []).map(c => c.name).filter(Boolean);
  const sp = src?.pages || [], tp = tr?.pages || [];
  if (sp.length && tp.length !== sp.length) out.push(`The adaptation has ${tp.length} pages; the original has ${sp.length}.`);
  sp.forEach(p => {
    const t = tp.find(x => Number(x.n) === Number(p.n)); if (!t) { out.push(`Page ${p.n} is missing in the adaptation.`); return; }
    const a = String(p.text || ''), b = String(t.text || '');
    for (const nm of names) if (a.includes(nm) && !b.includes(nm)) out.push(`Page ${p.n}: the name "${nm}" is missing (names never change).`);
    if (a.length > 20 && (b.length / a.length < 0.6 || b.length / a.length > 1.6)) out.push(`Page ${p.n}: length ${b.length} vs ${a.length} characters in the original.`);
  });
  return out;
}
/* 2.3: only the pages with issues are rewritten; anything global, or a bad reply, falls back to the full revision */
async function reviseWith(E, stage, current, critique, ctx, label, writer, structural = false) {
  const issues = (critique?.issues || []).filter(x => x && (x.problem || x.fix));
  const pagesAsked = [...new Set(issues.map(x => Number(x.page)).filter(n => n >= 1 && n <= (current?.pages || []).length))];
  const targeted = stage.targeted && E.bp.prompts.revise_pages && pagesAsked.length && issues.every(x => Number(x.page) >= 1) && !(critique?.failed_critical || []).some(c => !issues.some(x => x.code === c));
  if (targeted) {
    try {
      const c2 = { ...ctx, issues };
      const out = await callLLM(E, tpl(E.bp.prompts.revise_pages, c2), { label: label + ` (paginile ${pagesAsked.join(', ')})`, agent: writer, promptKey: 'revise_pages', schemaCtx: c2 });
      const e = validateSchema(out, schemaFor(E.bp, 'revise_pages', c2)); if (e) throw { code: 'validation', message: e };
      const next = clone(current); let changed = 0;
      for (const pg of out.pages || []) { const n = Number(pg.n); if (pagesAsked.includes(n)) { next.pages[n - 1] = { ...next.pages[n - 1], ...pg, n }; changed++; } }
      if (!changed) throw { code: 'validation', message: 'no requested page returned' };
      const problem = checkOut(next, stage, ctx, schemaFor(E.bp, stage.revise_prompt, ctx)); if (problem) throw { code: 'validation', message: problem };
      return next;
    } catch (e) { if (HARD.has(e?.code)) throw e; }                     // fall back to the full revision below
  }
  return llmValidated(E, tpl(E.bp.prompts[stage.revise_prompt], { ...ctx, critique: structural ? { issues } : critique }), stage, ctx, label, writer, stage.revise_prompt);
}

const HANDLERS = {
  async llm_json(E, stage) {
    const base = buildCtx(E);
    const pairs = pairsOf(E, stage, base);
    if (stage.for_each && !pairs.length) throw { code: 'validation', message: `lipsesc elementele pentru „${stage.for_each}”` };
    const labels = pairs.map(({ item: it, i }) => (stage.for_each ? tpl(stage.item_label || '{{n}}', { ...base, item: it, i, n: i + 1 }) : stage.label));
    await runItems(E, stage, pairs, labels, async ({ item, i }) => {
      const ctx = applyBind(E, stage, buildCtx(E, { item, i, n: i + 1 }));
      if (stage.examples) ctx.examples = findExamples(`${E.project.input?.short_description || ''} ${ctx.brief?.logline || ''} ${item?.summary || ''}`, { age: E.project.input?.[E.bp.variant_key], language: E.project.input?.language, excludePid: E.pid });
      const gv = E.project.options?.golden_variant;
      const variant = stage.prompt_variants ? (gv && stage.prompt_variants.includes(gv) ? gv : chooseVariant(stage.base || stage.key, stage.prompt_variants)) : null;
      const promptKey = variant || stage.prompt;
      const outKey = tpl(stage.out, ctx); const agentId = agentOf(E, stage, promptKey);
      /* v19 (plan 1.6): on a border stage, the light model competes with sonnet (only when you turned model experiments on) */
      const mStage = `${stage.base || stage.key}#model`;
      const mv = stage.model_variants && getAgent(agentId)?.model !== 'gpt-6-sol' && learningSettings().modelExperiments && !E.project.options?.golden ? chooseVariant(mStage, stage.model_variants) : null;
      const out = await llmValidated(E, tpl(E.bp.prompts[promptKey], ctx), { ...stage, required: defFor(E.bp, outKey).required }, ctx, tpl(stage.activity || stage.label, ctx), agentId, promptKey, mv);
      const prov = provenance(E, agentId, promptKey); if (mv) prov.model = mv;
      await saveArt(E, outKey, out, { stage: stage.key, note: stage.label + (variant ? ` (varianta ${variant})` : '') + (mv ? ` (model ${mv})` : ''), meta: { ...(variant ? { variant, variant_stage: stage.base || stage.key } : {}), ...(mv ? { model_variant: mv, model_stage: mStage } : {}), prov } });
    });
  },
  /* v19: structure gate (2.1) -> critic scored per criterion (1.7) -> targeted revision (2.3), a 2nd round only while the score
     rises, the best version is kept; adaptations get a page-by-page alignment check first (2.4) */
  async critique_revise(E, stage) {
    const base = buildCtx(E); const pairs = pairsOf(E, stage, base);
    const labels = pairs.map(({ item: it, i }) => tpl(stage.item_label || '{{n}}', { item: it, i, n: i + 1 }));
    const age = E.project.input?.[E.bp.variant_key]; const stageBase = stage.base || stage.key;
    await runItems(E, stage, pairs, labels, async ({ item, i }) => {
      const key = tpl(stage.target, { i }); let current = E.art[key]?.content;
      if (!current) throw { code: 'validation', message: `lipsește ${key}` };
      const ctxOf = cur => { const c = applyBind(E, stage, buildCtx(E, { item, i, n: i + 1 })); c.script = cur; c.bible_volume = volumeBible(E, cur, c.cast_volume); return c; };
      const writer = E.bp.prompt_agents?.[stage.revise_prompt] || 'scriitor';
      const lbl = tpl(stage.activity || stage.label, ctxOf(current));
      let soft = [], revised = false, rounds = 0, lint = null;
      if (stage.lint) {                                                   // 2.1: mechanical errors never reach the critic
        lint = lintScript(E, current, ctxOf(current));
        Ledger.record({ kind: 'lint', pid: E.pid, vol: i, stage: stageBase, hard: lint.hard.length, soft: lint.soft.length });
        soft = lint.soft;
        if (lint.hard.length) {
          current = await reviseWith(E, stage, current, { issues: lint.hard }, ctxOf(current), lbl + ' (corectez structura)', writer, true);
          revised = true; const again = lintScript(E, current, ctxOf(current)); soft = again.soft;
          if (again.hard.length) throw { code: 'validation', message: again.hard.map(h => h.problem).join(' ') };
        }
      }
      if (stage.align) soft = alignWarnings(E, getPath(ctxOf(current), 'source'), current);   // 2.4
      const threshold = thresholdFor(age, stageBase, stage.threshold ?? 8);
      let best = null, prevScore = null, critique = null, first = null, firstAs = null, firstContent = null; const qpolicy = policyFor(E.bp);
      const maxRounds = Math.min(2, stage.max_rounds ?? 1);
      for (let round = 0; round <= maxRounds; round++) {
        const ctx = ctxOf(current); ctx.warnings = [adjacentWarnings(current), ...soft].filter(Boolean).join(' ');
        critique = await callLLM(E, tpl(E.bp.prompts[stage.critic_prompt], ctx), { label: lbl + (round ? ' (re-evaluare)' : ''), agent: E.bp.prompt_agents?.[stage.critic_prompt] || 'editor-critic', promptKey: stage.critic_prompt, schemaCtx: ctx });
        const ev = evaluateCritique(critique, E.bp, stage, threshold); if (!ev.valid) throw { code: 'validation', message: ev.errors.join(' ') };
        /* P5-T02: QualityAssessment under the type's policy; fabricated evidence (v2) is re-asked once, then fails closed */
        const snap = () => ({ agent: E.lastContext?.agentId || null, model: E.lastContext?.model?.model || null, source: E.lastContext?.model?.source || null, context: E.lastContext?.manifestHash || null, prompt: stage.critic_prompt });
        const assessNow = cr => { const a = assessText({ reply: cr, content: current, bp: E.bp, stage, policy: qpolicy, level: stage.align ? 'native' : 'script', subject: { artifact: key }, model: snap(), threshold }); if (stage.align) a.checks = nativeChecks(getPath(ctxOf(current), 'source'), current, { names: (E.art.bible?.content?.characters || []).map(x => x.name).filter(Boolean), language: E.project.input?.second_language || 'Romanian' }); return a; };
        let as = assessNow(critique);
        if (!as.valid) {
          critique = await callLLM(E, tpl(E.bp.prompts[stage.critic_prompt], ctx) + `\nYOUR PREVIOUS EVIDENCE COULD NOT BE FOUND IN THE TEXT (${as.evidence.fabricated.join(', ')}). Quote ONLY words that literally appear in the script.`, { label: lbl + ' (dovezi verificate)', agent: E.bp.prompt_agents?.[stage.critic_prompt] || 'editor-critic', promptKey: stage.critic_prompt, schemaCtx: ctx });
          const ev2 = evaluateCritique(critique, E.bp, stage, threshold); if (!ev2.valid) throw { code: 'validation', message: ev2.errors.join(' ') };
          as = assessNow(critique); if (!as.valid) throw { code: 'validation', message: 'Evaluarea citează text care nu există: ' + as.evidence.fabricated.join(', ') };
          Object.assign(ev, ev2);
        }
        ev.pass = as.pass;   // the policy decides (v1 = existing rule; v2 = stricter, target versions only)
        critique = { ...critique, score: ev.score, failed_critical: ev.failedCritical };
        if (first == null) { first = ev.score; firstAs = as; firstContent = current; }
        Ledger.record({ kind: 'quality', pid: E.pid, vol: i, stage: stageBase, round, age, score: ev.score, criteria: ev.criteria, critical: ev.failedCritical, lessons: E.art[key]?.meta?.prov?.lessons || [], variant: E.art[key]?.meta?.variant || null, bp: E.bp.version, charter: getAgent(writer)?.charterVersion || null });
        if (!best || ev.score > best.score) best = { content: current, critique, score: ev.score, assessment: as };
        if (ev.pass || round === maxRounds) break;
        if (round > 0 && stage.stop_if_no_gain && prevScore != null && ev.score <= prevScore) break;   // 2.3: no gain, no more rounds
        prevScore = ev.score;
        current = await reviseWith(E, stage, current, critique, ctx, lbl + ' (revizuiesc)', writer);
        revised = true; rounds++;
        if (stage.recheck === false && qpolicy.version < 2) { best = { content: current, critique, score: ev.score }; break; }   // legacy types only: v2 always rechecks a repair
      }
      if (best && best.content !== current) { current = best.content; critique = best.critique; }   // keep the best-scored version
      let regress = [];
      if (revised && firstAs && best?.assessment && best.content !== firstContent) {   // P5-T02: a repair that regresses on the complete check set is not kept
        regress = regressions(firstAs, best.assessment);
        if (regress.length) { current = firstContent; critique = { ...critique, regression: regress }; best = { content: firstContent, critique, score: first, assessment: { ...firstAs, regressionRejected: regress } }; revised = false; await logE(E, `Reparația (${lbl}) a introdus regresii (${regress.map(r => r.code || r.kind).join(', ')}); se păstrează versiunea dinainte.`, 'warn'); }
      }
      const target = buildCtx(E).age_profile?.max_chars;
      let prob = predictApproval(featuresOf(current, { score: critique?.score }, target));
      if (prob != null && prob < 0.35 && rounds < Math.min(2, maxRounds) && qpolicy.version < 2) {   // P5-T02: v2 never keeps an unverified repair                    // the local model expects you to reject it: one more careful pass first
        const ctx = ctxOf(current);
        const hint = { ...critique, issues: [...(critique?.issues || []), { page: null, problem: 'The publisher usually rejects volumes like this one (learned from past reviews).', fix: 'Re-read the lessons above and revise the weakest pages accordingly.' }] };
        current = await llmValidated(E, tpl(E.bp.prompts[stage.revise_prompt], { ...ctx, critique: hint }), stage, ctx, lbl + ' (îmbunătățire după preferințele tale)', writer, stage.revise_prompt);
        revised = true; rounds++; prob = predictApproval(featuresOf(current, { score: critique?.score }, target));
      }
      const finalAs = best?.content === current && best?.assessment ? best.assessment : firstContent === current ? firstAs : null;
      const meta = { ...(E.art[key]?.meta || {}), critique, score_before: first, score: Number(critique?.score) || 0, approval_prob: prob, rounds, lint: lint ? { hard: lint.hard.length, soft: lint.soft.length } : undefined, threshold, assessment: finalAs ? { ...finalAs, subject: { ...finalAs.subject, hash: canonicalHash(current) } } : null };   // P5-T02: assessment bound to the saved version
      if (revised) await saveArt(E, key, current, { stage: stage.key, note: `Revizuit de editorul critic (scor ${first} → ${meta.score})`, meta });
      else { await repo.patchArtifact(E.pid, key, { meta }); }
    });
  },
  /* reference prompts; items with "generate" also become Canva images (character sheets used as references later) */
  async image_prompts(E, stage) {
    const list = [];
    for (const spec of stage.items || []) {
      const ctx = buildCtx(E);
      if (spec.for_each) (getPath(ctx, spec.for_each) || []).forEach((item, i) => list.push({ spec, label: tpl(spec.label, { ...ctx, item, i }), prompt: tpl(E.bp.templates[spec.template], { ...ctx, item, i }), ref: spec.ref ? tpl(spec.ref, { item, i }) : null }));
      else { const c = applyBind(E, spec, ctx); list.push({ spec, label: tpl(spec.label, c), prompt: tpl(E.bp.templates[spec.template], c), ref: null }); }
    }
    const prev = E.art[stage.out]?.content?.prompts || [];
    const out = list.map(x => { const old = prev.find(o => o.label === x.label && o.prompt === x.prompt); return { label: x.label, prompt: x.prompt, ref: x.ref, image: old?.image || null, mediaId: old?.mediaId || null, link: old?.link || null, generate: !!x.spec.generate }; });
    const wantImages = !stage.optional_flag || E.project.options?.[stage.optional_flag] !== false;
    const gen = wantImages ? out.map((x, i) => i).filter(i => out[i].generate) : [];
    if (gen.length) {
      const own = E.art.refs?.content?.characters || []; const code = await codeOf(E);
      await runItems(E, { ...stage, concurrency: config.canva.concurrency }, gen, gen.map(i => out[i].label), async i => {
        if (out[i].mediaId) return;
        const mine = own.find(c => c.id === out[i].ref && (c.images || []).length);
        const file = mine ? (E.project.refs || [])[mine.images[0]] : null;
        if (file) {
          out[i].image = file.file; out[i].client = true;
          if (imageEngineOf(E) === 'canva' || canva.status().connected) { try { out[i].mediaId = await canva.upload(await repo.readFile(E.pid, file.file)); } catch (e) { if (imageEngineOf(E) === 'canva') throw e; } }   // ChatGPT uses the local file directly
        } else {
          const img = await callImage(E, { prompt: out[i].prompt, aspectRatio: stage.aspect_ratio || 'LANDSCAPE_3_2' }, out[i].label);
          out[i].image = await repo.saveFile(E.pid, `images/reference-character-${code}-${out[i].ref || i}-v1.${ext(img.mime)}`, img.buffer);
          out[i].mediaId = img.mediaId; out[i].link = img.link;
        }
        await saveArt(E, stage.out, { prompts: out }, { stage: stage.key, note: stage.label });
      });
    }
    await saveArt(E, stage.out, { prompts: out }, { stage: stage.key, note: stage.label });
  },
  async canva_images(E, stage) {
    const S = E.bp.structure; let targets = stage.pages;
    if (targets === 'all') { targets = []; for (let v = 0; v < S.volumes; v++) if (stage.vol == null || stage.vol === v) for (let p = 0; p <= S.pages; p++) targets.push([v, p]); }
    if (targets === 'demo') targets = (stage.demo_pages || [0, 1]).map(p => [stage.vol ?? 0, p]);
    if (stage.reuse_from_gate) {                        // keep demo pages you already approved if their scene did not change
      const appr = E.project.approvals?.[`${stage.reuse_from_gate}@${stage.vol ?? 'c'}`] || {};
      const scene = (k, p) => { const c = E.art[k]?.content; return p === 0 ? c?.cover?.scene : c?.pages?.[p - 1]?.scene; };
      targets = targets.filter(([v, p]) => { const a = E.art[`ill_${v}_${p}`]; const ok = a?.content?.color && appr[`img:ill_${v}_${p}:color`]?.state === 'approved' && appr[`img:ill_${v}_${p}:line`]?.state === 'approved' && scene(`script_${v}`, p) === scene(`final_${v}`, p); return !ok; });
    }
    const res = await runItems(E, { ...stage, concurrency: stage.concurrency || config.canva.concurrency }, targets, targets.map(([v, p]) => pageLabel(v, p)), ([v, p]) => imageOne(E, stage, v, p, ''));
    if (stage.qa && E.project.options?.visual_qa !== false) { const done = targets.filter(([v, p]) => E.art[`ill_${v}_${p}`]?.content?.color); if (done.length) await qaPages(E, { key: stage.key, label: stage.label }, done, { redraw: null }); }
    if (res.soft) await setStage(E, stage.key, { warn: `${res.soft} pagini nu au primit imagine; le poți regenera din tab-ul Carte.` });
  },
  /* Claude looks at the client's own character images and describes them for the Story Bible */
  async describe_refs(E, stage) {
    const refs = E.project.refs || [];
    if (!refs.length) { await setStage(E, stage.key, { status: 'skipped', note: 'Nu au fost încărcate personaje proprii.' }); throw { code: 'skip' }; }
    const images = [];
    for (const r of refs) images.push({ mime: r.mime, data: (await repo.readFile(E.pid, r.file)).toString('base64') });
    const ctx = buildCtx(E);
    if (E.stopped) throw { code: 'stopped' };
    const id = Math.random().toString(36).slice(2);
    LIVE.set(id, { pid: E.pid, label: stage.activity || stage.label, kind: 'text', text: '', since: now() }); emitLive();
    let out;
    try { out = await agentComplete(tpl(E.bp.prompts[stage.prompt], ctx), { agent: 'director-artistic', task: stage.label, images, pid: E.pid, signal: E.ctl.signal, onText: t => { const c = LIVE.get(id); if (c) { c.text = t; emitLive(); } } }); }
    finally { LIVE.delete(id); emitLive(); }
    if (!Array.isArray(out?.characters)) throw { code: 'validation', message: 'lipsește lista de personaje' };
    await saveArt(E, stage.out, out, { stage: stage.key, note: stage.label });
  },
  /* the Continuity Keeper reads the whole collection, builds a ledger and fixes only real problems */
  async continuity_check(E, stage) {
    let keys = Object.keys(E.art).filter(k => globMatch(stage.target, k) != null).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    const prefix = stage.target.replace('*', '');
    if (stage.vol != null) keys = Array.from({ length: stage.vol + 1 }, (_, v) => (v < stage.vol ? (E.art[`final_${v}`] ? `final_${v}` : `${prefix}${v}`) : `${prefix}${v}`)).filter(k => E.art[k]);
    if (!keys.length) throw { code: 'validation', message: 'nu există volume de verificat' };
    const compact = (k, i) => { const c = E.art[k].content || {}; return { volume: i + 1, title: c.title, cover_characters: c.cover?.characters, pages: (c.pages || []).map(p => ({ n: p.n, text: p.text, scene: p.scene, characters: p.characters })) }; };
    /* v19 (plan 1.8): the ledger of the volumes before is kept as an artifact; later volumes are checked against it, so this
       call stays the same size instead of re-reading the whole collection each time */
    const prev = E.art[stage.out]?.content; const vol = stage.vol;
    const incremental = !!(stage.incremental_prompt && E.bp.prompts[stage.incremental_prompt] && vol != null && vol > 0 && keys.length === vol + 1 && Array.isArray(prev?.ledger) && Number(prev?.covers || 0) >= vol);
    const previous_ledger = incremental ? prev.ledger.map(c => ({ ...c, volumes: (c.volumes || []).filter(v => Number(v.volume) <= vol) })).filter(c => c.volumes.length) : null;
    const volumes_compact = incremental ? [compact(keys[vol], vol)] : keys.map(compact);
    await setStage(E, stage.key, { status: 'running', total: 1, done: 0 });
    const ctx = buildCtx(E, { volumes_compact, previous_ledger });
    const pk = incremental ? stage.incremental_prompt : stage.prompt;
    const out = await callLLM(E, tpl(E.bp.prompts[pk], ctx), { label: tpl(stage.activity || stage.label, ctx) + (incremental ? ' (față de registrul aprobat)' : ''), agent: 'pastrator-continuitate', promptKey: pk, schemaCtx: ctx });
    let ledger = Array.isArray(out?.ledger) ? out.ledger : [];
    if (incremental) {                                                   // merge: approved entries stay as they were, new volume entries are added
      const byId = new Map(previous_ledger.map(c => [c.id, { ...c, volumes: [...c.volumes] }]));
      for (const c of ledger) { const cur = byId.get(c.id) || { id: c.id, volumes: [] }; const fresh = (c.volumes || []).filter(v => Number(v.volume) > vol); cur.volumes = [...cur.volumes.filter(v => Number(v.volume) <= vol), ...fresh]; byId.set(c.id, cur); }
      ledger = [...byId.values()];
    }
    const issues = Array.isArray(out?.issues) ? out.issues : [];
    const byVol = {}; issues.forEach(x => { const v = Number(x.volume); if (v >= 1 && v <= keys.length) (byVol[v] = byVol[v] || []).push(x); });
    const vols = Object.keys(byVol).map(Number).filter(v => stage.vol == null || v === stage.vol + 1).sort((a, b) => a - b);
    const fixed = [];
    if (vols.length && stage.fix_prompt) {
      await runItems(E, { ...stage, concurrency: 2, tolerate_item_errors: true }, vols, vols.map(v => `Vol. ${v}`), async v => {
        const key = keys[v - 1];
        const c2 = buildCtx(E, { n: v, i: v - 1, script: E.art[key].content, issues: byVol[v] });
        const fixedDoc = await llmValidated(E, tpl(E.bp.prompts[stage.fix_prompt], c2), stage, c2, `Corectez continuitatea: volumul ${v}`, agentOf(E, null, stage.fix_prompt) === 'producator' ? 'scriitor' : agentOf(E, null, stage.fix_prompt), stage.fix_prompt);
        await saveArt(E, key, fixedDoc, { stage: stage.key, note: `Corecție de continuitate (${byVol[v].length} probleme)`, meta: E.art[key]?.meta || {} });
        fixed.push(v);
      });
    }
    await saveArt(E, stage.out, { ledger, issues, fixed_volumes: fixed.sort((a, b) => a - b), source: stage.target, covers: keys.length, incremental }, { stage: stage.key, note: stage.label + (incremental ? ' (incremental)' : '') });
  },
  /* the Art Director compares each page with the character reference sheets and redraws what drifted */
  /* the Art Director checks the whole page contract (anatomy, action, story, readability), redraws once and re-checks (LL-029, LL-035) */
  async visual_qa(E, stage) {
    if (E.project.options?.images === false || E.project.options?.visual_qa === false) { await setStage(E, stage.key, { status: 'skipped', note: 'Verificarea vizuală e oprită pentru acest proiect.' }); throw { code: 'skip' }; }
    const S = E.bp.structure; const pages = []; for (let v = 0; v < S.volumes; v++) if (stage.vol == null || stage.vol === v) for (let p = 0; p <= S.pages; p++) if (E.art[`ill_${v}_${p}`]?.content?.color) pages.push([v, p]);
    const results = await qaPages(E, stage, pages, { redraw: stageByKey(E, stage.redraw_stage), batch: stage.batch || 6 });
    await saveArt(E, stage.out || 'visual_qa', { pages: results, at: now() }, { stage: stage.key, note: stage.label });
  },
  /* colouring pages for every page whose colour image is final (and only where missing or out of date) */
  async canva_lines(E, stage) {
    if (E.project.options?.images === false) { await setStage(E, stage.key, { status: 'skipped', note: 'Imaginile sunt oprite pentru acest proiect.' }); throw { code: 'skip' }; }
    const S = E.bp.structure; const ill = stageByKey(E, stage.image_stage || 'illustrations'); const pages = [];
    for (let v = 0; v < S.volumes; v++) if (stage.vol == null || stage.vol === v) for (let p = 0; p <= S.pages; p++) { const c = E.art[`ill_${v}_${p}`]?.content; if (c?.color && (c.mediaId || c.engine === 'chatgpt') && (!c.lineart || c.lineFrom !== c.color)) pages.push([v, p]); }
    await runItems(E, { ...stage, concurrency: 1, tolerate_item_errors: true }, pages, pages.map(([v, p]) => pageLabel(v, p)), ([v, p]) => imageOne(E, ill, v, p, '', { lineOnly: true }));
  },
  async apply_notes(E, stage) {
    const ctx = buildCtx(E);
    if (!ctx.notes.trim()) { await setStage(E, stage.key, { status: 'skipped', note: 'Nu au existat note de integrat.' }); throw { code: 'skip' }; }
    const out = await llmValidated(E, tpl(E.bp.prompts[stage.prompt], ctx), stage, ctx, tpl(stage.activity, ctx), agentOf(E, stage, stage.prompt), stage.prompt);
    await saveArt(E, stage.out, out, { stage: stage.key, note: stage.label });
  },
  async preflight(E, stage) {
    await saveArt(E, stage.out || 'preflight', { checks: runPreflight(E.bp, E.art, buildCtx(E), stage.vol ?? null), vol: stage.vol ?? null, at: now() }, { stage: stage.key, note: stage.label });
  }
};
export const HANDLER_NAMES = [...Object.keys(HANDLERS), 'review_gate'];

/* ---------- lifecycle ---------- */
async function withEngine(pid, body, task) {
  if (RUNNING[pid]) throw { code: 'busy', message: 'Proiectul rulează deja.' };
  const E = { pid, stopped: false, ctl: new AbortController(), task, runId: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
  RUNNING[pid] = E; bus.emit('change', { scope: 'projects' });
  /* P3-T03: leases held by this run are renewed while it works */
  const hb = jobs ? setInterval(() => { for (const f of E.leases?.values() || []) jobs.heartbeat(f.pid, f.key, f.token).catch(() => {}); }, Math.max(1000, (jobs.ttl || 120000) / 3)) : null; hb?.unref?.();
  try {
    E.project = repo.getProject(pid); E.bp = await repo.getBlueprint(pid); E.stages = expandStages(E.bp); E.art = await repo.artifacts(pid);
    E.project.stages = E.project.stages || {};
    await body(E);
  } catch (e) {
    if (e?.code === 'paused' || e?.code === 'stopped') {
      const cp = await checkpoint(E, e.code === 'paused' ? 'pauză cerută de tine' : 'oprire imediată');
      await repo.patchProject(pid, { status: E.task ? (E.prevStatus || 'awaiting_review') : 'paused', pausedAt: now() });
      await logE(E, e.code === 'paused' ? `Pus pe pauză în siguranță la „${cp.label}”${cp.total ? ` (${cp.done}/${cp.total} elemente gata)` : ''}. Nimic nu s-a pierdut; „Continuă” pornește de aici.` : `Oprit imediat la „${cp.label}”; elementele terminate sunt salvate, cel în curs se reface la continuare.`);
      await repo.logEvent(pid, 'checkpoint', cp);
    }
    else if (e?.code === 'rate_limited' && !E.task) {
      const resumeAt = e.resetAt || now() + govConfig.cooldownMin * 60e3;
      await repo.patchProject(pid, { status: 'waiting_limit', resumeAt, error: null });
      if (E.stageKey) await setStage(E, E.stageKey, { status: 'pending' });
      await logE(E, `Limita abonamentului a fost atinsă. Reiau automat la ${new Date(resumeAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}.`, 'warn');
    }
    else {
      const msg = errMsg(e);
      if (E.task) await repo.patchProject(pid, { status: E.prevStatus || 'awaiting_review', error: msg });
      else { await repo.patchProject(pid, { status: 'failed', error: msg }); if (E.stageKey) await setStage(E, E.stageKey, { status: 'error', error: msg }); }
      await logE(E, 'Eroare: ' + msg, 'error');
      console.error('[engine]', pid, e);
    }
  } finally { if (hb) clearInterval(hb); if (E.prefetch) { E.stopped = true; try { E.ctl.abort(); } catch {} await E.prefetch.catch(() => {}); } delete RUNNING[pid]; bus.emit('change', { scope: 'projects' }); bus.emit('change', { scope: 'project', pid }); setTimeout(startPending, 300); }
}
/* queue: at most N projects generate at once; paused-by-limit projects resume by themselves */
export function schedule(pid) {                      // continue after an approval if nothing else is working; otherwise stay paused
  if (!activeProject(pid)) runPipeline(pid);
  else logE({ pid, project: repo.getProject(pid) }, 'Aprobat. Alt proiect lucrează acum; pornește-l pe acesta când vrei.').catch(() => {});
}
setInterval(() => {
  if (!repo) return;
  for (const p of repo.listProjects().slice().reverse()) {
    if (RUNNING[p.id]) continue;
    const running = Object.keys(RUNNING).filter(k => !RUNNING[k].task).length;
    if (running >= govConfig.maxParallel) break;
    if (p.status === 'waiting_limit' && Date.now() >= (p.resumeAt || 0)) runPipeline(p.id);
    // new or approved projects are started by you, never automatically
  }
}, 15000).unref?.();

/* learning hooks: labels for the preference model, rewards for prompt variants, lessons, approved examples */
async function learnFromDecision(pid, p, bp, entry, targets, touched = new Set()) {
  const art = await repo.artifacts(pid); const age = p.input?.[bp.variant_key];
  const pattern = entry.gate === 'review_1' ? 'script_*' : 'final_*';
  const keys = Object.keys(art).filter(k => globMatch(pattern, k) != null && (entry.vol == null || k === pattern.replace('*', entry.vol)));
  const target = bp.age_profiles?.[age]?.max_chars;
  const corrected = new Set([...(p.gate?.corrected || []), ...touched]);   // v19: pages you changed item by item count as a correction too
  const samples = [];
  /* P7-T03: an artifact repaired at this gate (targeted repair, P5-T06) is not a success of its original output */
  const repaired = new Set((p.repairs || []).filter(r => r.gate === gateInstance(p.gate || { key: entry.gate, vol: entry.vol })).flatMap(r => r.verify?.changed || []).map(u => String(u).split(/[#:]/)[0]));
  const ctxOf = a => ({ bp: bp.version, model: a.meta?.model_variant || a.meta?.prov?.model || null, age });
  const reward = async (a, ok) => { await rewardVariant(a.meta?.variant_stage, a.meta?.variant, ok, ctxOf(a)); await rewardVariant(a.meta?.model_stage, a.meta?.model_variant, ok, ctxOf(a)); };
  for (const k of keys) {
    const a = art[k]; const x = featuresOf(a.content, a.meta, target), o = outcomeOf({ decision: entry.decision, targeted: targets.includes(k), repaired: repaired.has(k), corrected: corrected.has(k) });
    if (o.reward == null) continue;
    samples.push({ x, y: o.reward, pid, group: pid, k }); await reward(a, o.reward === 1);
    Ledger.record({ kind: 'outcome', pid, vol: entry.vol ?? null, stage: a.meta?.variant_stage || null, unit: k, result: o.result, variant: a.meta?.variant || null, model: ctxOf(a).model, bp: bp.version, age, lessons: a.meta?.prov?.lessons || [] });
  }
  await addSamples(samples);
  if (entry.decision !== 'approved') {
    const cm = (await repo.listComments(pid)).filter(c => c.gateKey === entry.gate).slice(-15).map(c => ({ on: c.artifactKey, quote: c.quote, comment: c.body }));
    trackProjectBackground(pid, () => learnFromEvent({ kind: entry.decision, gate: entry.gate, note: entry.note, targets, comments: cm, age, language: p.input?.language }, { pid, codes: buildCodes(bp), agents: Object.keys(bp.agents_used || {}).length ? Object.keys(bp.agents_used) : ['director-creativ', 'arhitect-serie', 'pastrator-continuitate', 'scriitor', 'editor-critic', 'corector', 'director-artistic'], age }))
      .catch(e => console.warn('[learning]', e?.message || e));
  }
  if (entry.gate === 'review_2' && ['approved', 'approved_with_notes'].includes(entry.decision)) {
    for (const k of keys) { const c = art[k].content; await addExample({ pid, volume: Number(k.split('_')[1]), age, language: p.input?.language, theme: `${p.input?.short_description || ''} ${art.brief?.content?.logline || ''}`, title: c.title, pages: (c.pages || []).slice(0, 4).map(x => x.text) }); }
  }
}
export async function learnFromEdit(pid, key, before, after) {
  const p = repo.getProject(pid); const bp = await repo.getBlueprint(pid); const age = p.input?.[bp.variant_key];
  const diff = (after?.pages || []).map((pg, i) => ({ page: i + 1, before: before?.pages?.[i]?.text, after: pg.text })).filter(x => x.before !== x.after).slice(0, 6);
  if (!diff.length) return;
  await learnFromEvent({ kind: 'manual_edit', artifact: key, changes: diff, age, language: p.input?.language }, { pid, agents: ['scriitor', 'corector', 'editor-critic'], age });
}

/* v19 (plan 3.3): after the final approval of a volume, the Producer reads everything that happened to it and proposes lessons */
export async function runRetro(pid, vol) {
  const p = repo.getProject(pid); const bp = await repo.getBlueprint(pid); if (!p || !bp.prompts?.retro || vol == null) return null;
  const art = await repo.artifacts(pid); const age = p.input?.[bp.variant_key];
  const decisions = (p.decisions || []).filter(d => d.vol === vol).map(d => ({ gate: d.gate, round: d.round, decision: d.decision, note: d.note || undefined }));
  const items = []; for (const [inst, m] of Object.entries(p.approvals || {})) if (inst.endsWith('@' + vol)) for (const [id, a] of Object.entries(m || {})) if (a && (a.note || a.code)) items.push({ item: id, state: a.state, note: a.note || undefined, code: a.code || undefined });
  const critic_issues = ['script_', 'final_', 'tr_'].flatMap(k => (art[k + vol]?.meta?.critique?.issues || []).map(x => ({ doc: k + vol, page: x.page, code: x.code, problem: x.problem })));
  const visual = (art.visual_qa?.content?.pages || []).filter(x => x.v === vol && !x.ok).map(x => ({ page: x.p, failed: x.failed, issues: x.issues, redrawn: !!x.redrawn }));
  const diffs = Object.entries(p.gate?.diffs || {}).map(([id, d]) => ({ item: id, reason: d.reason }));
  const agents = ['director-creativ', 'arhitect-serie', 'pastrator-continuitate', 'scriitor', 'editor-critic', 'corector', 'director-artistic', 'traducator'];
  const existing = listLessonsForRetro();
  const ctx = { agents: agents.join(', '), codes: buildCodes(bp), existing, volume_label: `Volumul ${vol + 1}: ${art['final_' + vol]?.content?.title || ''}`, decisions: [...decisions, ...items], critic_issues, visual, edits: diffs };
  const schema = schemaFor(bp, 'retro', ctx);
  const out = await agentComplete(tpl(bp.prompts.retro, ctx), { agent: 'producator', task: `Retrospectiva volumului ${vol + 1}`, pid, age, schema, model: bp.prompt_models?.retro, meta: { stage: 'retro', vol, prompt: 'retro', bp: bp.version, lessons: false } });
  const bad = validateSchema(out, schema); if (bad) throw { code: 'validation', message: bad };
  const newLessons = (out.new_lessons || []).filter(n => agents.includes(n.agent));
  await repo.writeArtifact(pid, `retro_${vol}`, { ...out, new_lessons: newLessons, at: now() }, { note: 'Retrospectiva volumului' });
  await addProposals(newLessons, { pid, vol, age, confirm: out.confirm || [] });
  Ledger.record({ kind: 'retro', pid, vol, proposals: newLessons.length, repeated: (out.repeated_problems || []).length });
  return out;
}

/* v19 (plan 2.11): what changed at a gate and why, so the next round shows the difference instead of the whole volume */
async function recordDiffs(pid, entries) {
  if (!entries.length) return; const p = repo.getProject(pid); if (!p?.gate) return;
  const diffs = { ...(p.gate.diffs || {}) }; for (const [id, d] of entries) diffs[id] = { ...d, round: p.gate.round || 1, at: now() };
  await repo.patchProject(pid, { gate: { ...p.gate, diffs } });
}
const pageDiffs = (key, before, after, reason, code) => (after?.pages || []).map((pg, i) => [pg, before?.pages?.[i]]).filter(([a, b]) => b && a.text !== b.text).map(([a, b], i) => [`text:${key}:${Number(a.n) || i + 1}`, { before: b.text, reason: reason || '', code: code || null }]);

/* ---------- one project at a time, explicit control ---------- */
async function checkpoint(E, reason) {
  const p = repo.getProject(E.pid); const st = E.stages?.[p.stageIndex || 0]; const s = st ? p.stages?.[st.key] || {} : {};
  const art = await repo.artifacts(E.pid);
  const cp = { at: now(), reason, stageIndex: p.stageIndex || 0, stage: st?.key || null, label: st ? `${st.label}${st.vol != null ? `, volumul ${st.vol + 1}` : ''}` : 'final', done: s.done || 0, total: s.total || 0, versions: Object.fromEntries(Object.entries(art).map(([k, a]) => [k, a.version])) };
  await repo.patchProject(E.pid, { checkpoints: [...(p.checkpoints || []), cp].slice(-30) });
  return cp;
}
const ACTIVE_ST = ['running', 'correcting', 'waiting_limit'];
export function activeProject(except = null) {
  const id = Object.keys(RUNNING).find(k => k !== except); if (id) return repo.getProject(id);
  return repo.listProjects().find(p => p.id !== except && ACTIVE_ST.includes(p.status)) || null;
}
function assertFree(pid) { const a = activeProject(pid); if (a) throw { status: 409, code: 'busy', active: { id: a.id, title: a.title }, message: `Rulează deja „${a.title}”. Doar un proiect poate lucra odată: pune-l pe pauză, apoi pornește-l pe acesta.` }; }
export function startProject(pid) {
  const p = repo.getProject(pid); if (!p) throw { status: 404, message: 'Proiect inexistent.' };
  if (RUNNING[pid]) return { ok: true };
  if (['awaiting_review', 'completed', 'archived'].includes(p.status)) throw { status: 400, message: 'Proiectul nu are nimic de pornit acum.' };
  assertFree(pid); runPipeline(pid); return { ok: true };
}
/* graceful pause: what is in progress finishes and is saved, then a checkpoint is written */
export async function pauseProject(pid) {
  const E = RUNNING[pid]; const p = repo.getProject(pid);
  if (E) { E.pausing = true; await repo.patchProject(pid, { pausing: true }); return { ok: true, graceful: true }; }
  if (p?.status === 'waiting_limit') { await repo.patchProject(pid, { status: 'paused', pausedAt: now(), resumeAt: null }); return { ok: true }; }
  return { ok: true };
}
let PENDING = null;
export async function switchTo(pid) {
  const a = activeProject(pid); PENDING = pid;
  if (a) { await pauseProject(a.id); if (!RUNNING[a.id]) setTimeout(startPending, 100); return { ok: true, pausing: a.title }; }
  setTimeout(startPending, 50); return { ok: true };
}
function startPending() { if (!PENDING || activeProject()) return; const pid = PENDING; PENDING = null; try { startProject(pid); } catch (e) { console.warn('[start]', e?.message); } }
export function assertCanWork(pid) { assertFree(pid); }
/* audit H1: delivery is allowed only for what you approved in THIS installation (every approval gate of the volume closed by you) */
export function volumeApproved(p, bp, vol = null, art = repo?.art?.get(p?.id)) {
  if (!p || !art || (vol != null && (!Number.isInteger(vol) || vol < 0 || vol >= bp.structure.volumes))) return false;
  const gates = expandStages(bp).filter(s => s.handler === 'review_gate' && (vol == null || s.vol == null || s.vol === vol));
  if (!gates.length) return false;
  if (!gates.every(s => p.stages?.[s.key]?.status === 'done' && !p.stages[s.key].imported)) return false;
  // Final review supersedes demo images; collection documents remain authoritative.
  const current = gates.filter(s => s.vol == null || !gates.some(t => t.vol === s.vol && gates.indexOf(t) > gates.indexOf(s)));
  return current.every(s => gateSummary(gateItems(bp, art, p, { key: s.gate, vol: s.vol ?? null })).done);
}
export async function reopenChangedReview(pid) {
  const p = repo.getProject(pid); if (!p || RUNNING[pid]) return;
  const bp = await repo.getBlueprint(pid), art = await repo.artifacts(pid), stages = expandStages(bp);
  const idx = stages.findIndex((s, i) => s.handler === 'review_gate' && p.stages?.[s.key]?.status === 'done' && !p.stages[s.key].imported && (s.vol == null || !stages.slice(i + 1).some(t => t.handler === 'review_gate' && t.vol === s.vol)) && !gateSummary(gateItems(bp, art, p, { key: s.gate, vol: s.vol ?? null })).done);
  if (idx < 0) return;
  const currentIndex=p.gate ? stages.findIndex(s=>s.handler==='review_gate'&&s.gate===p.gate.key&&(s.vol??null)===(p.gate.vol??null)) : -1;
  if(currentIndex>=0 && currentIndex<=idx)return;
  const s = stages[idx]; await repo.patchProject(pid, { gate: { key: s.gate, vol: s.vol ?? null, round: 1, reopened: true, openedAt: now() }, status: 'awaiting_review', stageIndex: idx, currentStage: s.key, stages: { [s.key]: { status: 'waiting', approvedAt: null } } });
}

export function stopEngine(pid) { const E = RUNNING[pid]; if (E) { E.stopped = true; E.ctl.abort(); } }

/* v19 (plan 2.12): while Canva draws volume N (spaced, slow), Claude writes and checks the script of volume N+1. It is used only if
   nothing it depends on changed in between (your notes, rejections, lessons, blueprint); otherwise it is redone normally. */
function prefetchSig(E) {
  const age = E.project.input?.[E.bp.variant_key];
  const lessons = ['scriitor', 'editor-critic'].flatMap(a => lessonsFor(a, age, E.pid, { stage: 'scripts' }).map(l => l.id));
  return h(JSON.stringify({ n: E.project.notes || [], r: E.project.rejections || [], l: lessons, bp: E.bp.version, run: E.project.run || 1 }));
}
async function prefetchNext(E, vol) {
  if (vol >= (E.bp.structure?.volumes || 0)) return;
  if (!generationAllowed(E.bp, E.project, { vol, handler: 'llm_json' }).allowed) return;   // P4-T05: no speculative bulk before the pilot
  const list = ['scripts', 'critic'].map(b => E.stages.find(s => s.base === b && s.vol === vol)).filter(Boolean); if (list.length < 2) return;
  if (list.some(s => ['done'].includes(E.project.stages?.[s.key]?.status))) return;
  const sig = prefetchSig(E); const P = Object.create(E); P.runOwner = `prefetch:${E.runId}`; P.leases = new Map();
  const done = new Set();
  try {
    for (const st of list) {
      if (E.stopped || E.pausing) break;
      P.curStage = st; P.stageKey = st.key;
      await setStage(E, st.key, { status: 'running', startedAt: now(), error: null, prefetched: null, note: 'Se pregătește în avans' });
      await unit(P, st.key, st.label, { stage: st.key, prefetch: sig }, () => HANDLERS[st.handler](P, st));
      await setStage(E, st.key, { status: 'prefetched', finishedAt: now(), prefetched: sig }); done.add(st.key);
    }
  } finally {                                                          // interrupted: what was not finished goes back to "pending" and is done normally later
    for (const st of list) if (!done.has(st.key)) await setStage(E, st.key, { status: 'pending', items: [], run: -1, prefetched: null, note: null, error: null }).catch(() => {});
  }
  if (done.size < list.length) return;
  await logE(E, `Scenariul volumului ${vol + 1} a fost scris și verificat în avans, cât se desenau imaginile.`);
}

export function runPipeline(pid) {
  return withEngine(pid, async E => {
    await repo.patchProject(pid, { status: 'running', error: null, pausing: false });
    while (!E.stopped) {
      if (E.pausing) throw { code: 'paused' };
      const idx = E.project.stageIndex || 0; const stage = E.stages[idx];
      if (stage && stage.handler !== 'review_gate' && E.project.stages?.[stage.key]?.imported) { await repo.patchProject(pid, { stageIndex: idx + 1 }); continue; }   // already done in an imported project; approval gates always reopen (audit C1/H1)
      if (!stage) { await repo.patchProject(pid, { status: 'completed', gate: null, currentStage: null, completedAt: now() }); await logE(E, 'Proiect finalizat și aprobat.'); break; }
      if (stage.when && !getPath(buildCtx(E), stage.when)) {   // optional stage, e.g. translation only for bilingual editions
        await setStage(E, stage.key, { status: 'skipped', note: 'Nu se aplică acestui proiect.' });
        await repo.patchProject(pid, { stageIndex: idx + 1 }); continue;
      }
      if (stage.handler === 'review_gate' && E.project.options?.golden) {   // v19 (plan 3.6): the golden set runs the text stages only, without gates
        await setStage(E, stage.key, { status: 'done', finishedAt: now(), note: 'Setul de aur: fără aprobare' }); await repo.patchProject(pid, { stageIndex: idx + 1 }); continue;
      }
      if (stage.handler === 'review_gate') {
        if (E.prefetch) { await E.prefetch.catch(() => {}); E.prefetch = null; }   // the gate opens only when nothing else runs, so your decisions are accepted at once
        const round = E.project.gate?.key === stage.gate && (E.project.gate?.vol ?? null) === (stage.vol ?? null) ? E.project.gate.round : 1;
        await setStage(E, stage.key, { status: 'waiting', startedAt: E.project.stages[stage.key]?.startedAt || now() });
        await repo.patchProject(pid, { status: 'awaiting_review', currentStage: stage.key, currentVolume: stage.vol ?? null, gate: { key: stage.gate, vol: stage.vol ?? null, round, openedAt: now() } });
        await logE(E, `${E.bp.gates?.[stage.gate]?.label || stage.label} te așteaptă.`);
        break;
      }
      if (stage.vol != null && ['demo', 'polish', 'adapt', 'illustrations', 'coloring', 'native_edit'].includes(stage.base)) {   // P5-T01: a safety BLOCK in the text stops production of this volume
        const sf = volumeSafety({ bp: E.bp, art: E.art, project: E.project, v: stage.vol, images: false }), b = sf.subjects.find(x => x.verdict === 'BLOCK');
        if (b) { const msg = `Siguranță: ${b.artifact || ''} pagina ${b.page ?? ''} — „${b.findings[0]?.quote || ''}” (${b.findings[0]?.fix || ''}). Producția volumului ${stage.vol + 1} este oprită până corectezi textul.`; await repo.patchProject(pid, { status: 'paused', currentStage: stage.key, error: msg }); await logE(E, msg, 'warn'); break; } }
      { const g = generationAllowed(E.bp, E.project, stage); if (!g.allowed) {   // P4-T05: no volume 2–6 generation before the pilot is decided
        await repo.patchProject(pid, { status: 'paused', currentStage: stage.key, error: g.message }); await logE(E, g.message, 'warn'); break; } }
      if (E.prefetch && ['scripts', 'critic'].includes(stage.base)) { await E.prefetch.catch(() => {}); E.prefetch = null; }
      if (['scripts', 'critic'].includes(stage.base) && E.project.stages?.[stage.key]?.prefetched && E.project.stages[stage.key].prefetched === prefetchSig(E)) {   // 2.12: prepared in advance and nothing changed since
        await setStage(E, stage.key, { status: 'done', finishedAt: now(), note: 'Pregătit în avans, în timp ce se desenau imaginile volumului anterior.' });
        await repo.patchProject(pid, { stageIndex: idx + 1 }); continue;
      }
      if (['scripts', 'critic'].includes(stage.base) && (E.project.stages?.[stage.key]?.prefetched || E.project.stages?.[stage.key]?.status === 'prefetched')) {
        if (jobs) { await jobs.takeover(pid, stage.key, { reason: 'pregătirea în avans a expirat' }); for (const j of await jobs.list(pid)) if (j.key.startsWith(stage.key + '#')) await jobs.takeover(pid, j.key, { reason: 'pregătirea în avans a expirat' }); }   // P3-T03: a stale prefetch can no longer write
        await setStage(E, stage.key, { items: [], run: -1, prefetched: null, note: 'Refăcut: notele, lecțiile sau regulile s-au schimbat după pregătirea în avans.' }); }   // stale: redo every item
      if (stage.base === 'illustrations' && stage.vol != null && !E.prefetch && learningSettings().overlap && E.project.options?.overlap !== false && !E.project.options?.golden)
        E.prefetch = prefetchNext(E, stage.vol + 1).catch(e => { if (!['stopped', 'paused'].includes(e?.code)) logE(E, `Pregătirea în avans a volumului următor s-a oprit (${errMsg(e)}); se face normal la rândul ei.`, 'warn').catch(() => {}); });
      E.stageKey = stage.key; E.curStage = stage;
      await repo.patchProject(pid, { currentStage: stage.key, currentVolume: stage.vol ?? null });
      await setStage(E, stage.key, { status: 'running', startedAt: now(), error: null, warn: null });
      await logE(E, `Început: ${stage.label}`);
      try { await unit(E, stage.key, stage.label, { stage: stage.key }, () => HANDLERS[stage.handler](E, stage)); } catch (e) { if (e?.code !== 'skip') throw e; }
      if (E.project.stages[stage.key]?.status !== 'skipped') await setStage(E, stage.key, { status: 'done', finishedAt: now() });
      else await setStage(E, stage.key, { finishedAt: now() });
      await logE(E, `Gata: ${stage.label}`);
      const auto = E.bp.title_from && !String(E.project.input?.title || '').trim() ? getPath(buildCtx(E), E.bp.title_from) : null;
      if (typeof auto === 'string' && auto && auto !== E.project.title) await repo.patchProject(pid, { title: auto });
      await repo.patchProject(pid, { stageIndex: idx + 1 });
      if (E.project.options?.golden && (stage.base || stage.key) === 'critic' && (stage.vol ?? 0) === 0) { await repo.patchProject(pid, { status: 'completed', gate: null, currentStage: null, completedAt: now() }); await logE(E, 'Setul de aur: volumul 1 evaluat.'); break; }
    }
  });
}

/* corrections at a gate, and single-page redraws, run through the same engine */
/* P5-T02: re-evaluate the CURRENT text of a volume (critic only, no rewrite) after an edit made the assessment stale */
export function reassessVolume(pid, v) {
  return withEngine(pid, async E => {
    E.prevStatus = E.project.status; E.curStage = { key: '_reassess', base: 'critic_final', vol: v };
    const key = E.art[`final_${v}`] ? `final_${v}` : `script_${v}`;
    const st = E.stages.find(s => s.handler === 'critique_revise' && s.vol === v && tpl(s.target, { i: v }) === key) || E.stages.find(s => s.handler === 'critique_revise' && s.vol === v && !s.align);
    if (!st) throw { status: 400, message: 'Tipul de produs nu are o etapă de evaluare pentru acest volum.' };
    await HANDLERS.critique_revise(E, { ...st, key: '_reassess', label: 'Reevaluare', target: key.replace(/_\d+$/, '_{{i}}'), max_rounds: 0, lint: false });
    await repo.patchProject(pid, { status: E.prevStatus || 'awaiting_review' });
  }, { kind: 'reassess', vol: v });
}
export function runTask(pid, task) {
  return withEngine(pid, async E => {
    E.prevStatus = E.project.status === 'correcting' ? (task.returnStatus || 'awaiting_review') : E.project.status;
    E.curStage = { key: '_task', base: 'corecturi', vol: E.project.gate?.vol ?? null };
    await repo.patchProject(pid, { status: 'correcting', error: null });
    const comments = (await repo.listComments(pid)).filter(c => c.status === 'open');
    const gateDef = E.bp.gates?.[task.gateKey] || {};
    const redoMap = task.redoStage ? { 'ill_*': task.redoStage } : (gateDef.redo || {});
    const tStage = { key: '_task', label: task.label || 'Corecții', concurrency: 2 };
    await repo.patchProject(pid, { stages: { _task: { items: [], run: -1 } } });
    const labelOf = k => (k.startsWith('ill_') ? pageLabel(...k.split('_').slice(1).map(Number)) : defFor(E.bp, k).label);
    await runItems(E, tStage, task.targets, task.targets.map(labelOf), async key => {
      const cm = comments.filter(c => c.artifactKey === key && (!task.gateKey || c.gateKey === task.gateKey));
      const instruction = [task.feedback, ...cm.map(c => (c.quote ? `„${c.quote}”: ` : '') + c.body)].filter(Boolean).join('\n');
      const redo = matchMap(redoMap, key);
      if (redo) {
        const st = stageByKey(E, redo); const [, v, p] = key.split('_').map(Number); const beforeImage = E.art[key]?.content?.color || null;
        await imageOne(E, st, v, p, instruction || 'Fresh, better composition.');
        await recordDiffs(pid, [[`img:${key}:color`, { beforeImage, reason: instruction || '' }]]);
      } else {
        const def = defFor(E.bp, key);
        const ctx = buildCtx(E, { current: E.art[key]?.content, feedback: task.feedback, comments: cm.map(c => ({ quote: c.quote, comment: c.body, must_fix: c.severity === 'must' })), artifact_label: def.label });
        const before = E.art[key]?.content;
        const out = await llmValidated(E, tpl(E.bp.prompts.correct, ctx), def, ctx, 'Corectez: ' + def.label, key.startsWith('bible') || key === 'cast' ? 'pastrator-continuitate' : 'scriitor', 'correct');
        await saveArt(E, key, out, { note: 'Corecție din review: ' + (task.feedback || '').slice(0, 90), meta: E.art[key]?.meta || {} });
        await recordDiffs(pid, pageDiffs(key, before, out, [task.feedback, ...cm.map(c => c.body)].filter(Boolean).join(' · ')));
      }
      for (const c of cm) await repo.patchComment(pid, c.id, { status: 'addressed', addressedAt: now() });
    });
    await setStage(E, '_task', { status: 'done', finishedAt: now() });
    if (task.gateKey && E.project.gate) {
      const round = (E.project.gate.round || 1) + 1;
      await repo.patchProject(pid, { status: 'awaiting_review', gate: { ...(repo.getProject(pid).gate || E.project.gate), round } });
      await logE(E, `Corecții aplicate. ${gateDef.label || 'Review'}, runda ${round}.`);
    } else { await repo.patchProject(pid, { status: E.prevStatus }); await logE(E, `${task.label || 'Modificări'} aplicate.`); }
    if (E.art.preflight) { const pv = E.art.preflight.content?.vol ?? null; await saveArt(E, 'preflight', { checks: runPreflight(E.bp, E.art, buildCtx(E), pv), vol: pv, at: now() }, { note: 'Recalculat după modificări' }); }
  }, task);
}

/* review decisions (the 4 buttons) */
export async function decide(pid, { decision, note = '', targets = [], restart = 'phase' }, ctx = {}) {
  const p = repo.getProject(pid); const bp = await repo.getBlueprint(pid);
  if (!p?.gate) throw { code: 'bad_request', message: 'Proiectul nu așteaptă un review.' };
  if (RUNNING[pid]) throw { code: 'busy', message: 'Proiectul rulează deja.' };
  if (!['approved', 'approved_with_notes', 'needs_correction', 'rejected'].includes(decision)) throw { code: 'bad_request', message: 'Decizie necunoscută.' };
  if (['approved_with_notes', 'needs_correction', 'rejected'].includes(decision) && !String(note || '').trim()) throw { code: 'bad_request', message: 'Nota sau motivul este obligatoriu.' };
  const art0 = await repo.artifacts(pid);
  if (['approved', 'approved_with_notes'].includes(decision)) {          // audit H1: a gate closes only when every element was approved by you
    const items = gateItems(bp, art0, p, p.gate); const c = gateSummary(items);
    if (items.length && !c.done) throw { status: 400, message: `Mai sunt ${c.total - c.approved} elemente neaprobate sau cu modificări neaplicate. Aprobă-le întâi (poți folosi „Aprobă tot ce a rămas”, după ce le-ai văzut).` };
  }
  const approvedVersions = ['approved', 'approved_with_notes'].includes(decision) ? Object.fromEntries(Object.entries(art0).map(([k, a]) => [k, a.version])) : undefined;   // images included (audit H1)
  const entry = { gate: p.gate.key, vol: p.gate.vol ?? null, round: p.gate.round || 1, decision, note, at: now(), ...(approvedVersions ? { approvedVersions } : {}) };
  await repo.logEvent(pid, 'decision', { ...entry, targets, restart, typeSlug: p.typeSlug, variant: p.variantLabel });
  const decisions = [...(p.decisions || []), entry];
  /* P2-T04: the gate decision is a durable record bound to the exact approved versions and policy */
  const gateRec = decisionRecord({ kind: 'gate', actor: ctx.actor || 'operator', state: decision, note, scope: { gate: p.gate.key, vol: p.gate.vol ?? null, round: p.gate.round || 1 }, subject: { approvedVersions: approvedVersions || null, contentHash: approvedVersions ? fingerprint(gateItems(bp, art0, p, p.gate).map(i => [i.id, i.hash])) : null, targets }, policy: policyHash(bp, p.gate.key) });
  const commitGate = patch => repo.commitProjectDecision(pid, patch, [gateRec], { actor: ctx.actor || 'operator', expectedRevision: ctx.expectedRevision, commandId: ctx.commandId, kind: 'gate.decide' });
  const stages = expandStages(bp);
  const gIdx = stages.findIndex(s => s.handler === 'review_gate' && s.gate === p.gate.key && (s.vol ?? null) === (p.gate.vol ?? null));
  const gStage = stages[gIdx];
  const labels = { approved: 'Aprobat', approved_with_notes: 'Aprobat cu note', needs_correction: 'Corecții cerute', rejected: 'Respins' };
  const log = [...(p.log || []), { t: now(), text: `${labels[decision]}: ${bp.gates?.[p.gate.key]?.label || ''}.`, kind: 'info' }].slice(-120);
  Ledger.record({ kind: 'gate', pid, gate: entry.gate, vol: entry.vol, round: entry.round, decision, firstPass: entry.round === 1 && ['approved', 'approved_with_notes'].includes(decision), bp: bp.version, age: p.input?.[bp.variant_key] });
  const touched = new Set(Object.keys(p.gate?.diffs || {}).filter(id => id.startsWith('text:')).map(id => id.split(':')[1]));
  trackProjectBackground(pid, () => learnFromDecision(pid, p, bp, entry, targets, touched)).catch(e => console.warn('[learning]', e?.message || e));
  if (entry.gate === 'review_2' && ['approved', 'approved_with_notes'].includes(decision) && !p.options?.golden) scheduleRetro(pid, entry.vol);
  if (decision === 'approved' || decision === 'approved_with_notes') {
    const gateKey = p.gate.key;
    await commitGate({ decisions, log, notes: decision === 'approved_with_notes' ? [...(p.notes || []), note] : (p.notes || []), gate: null, stageIndex: gIdx + 1, status: 'paused', pausing: false, stages: { [gStage.key]: { status: 'done', finishedAt: now(), imported: false, approvedAt: now() } } });
    for (const c of (await repo.listComments(pid)).filter(c => c.status === 'open' && c.gateKey === gateKey)) await repo.patchComment(pid, c.id, { status: 'resolved' });
    schedule(pid);
  } else if (decision === 'needs_correction') {
    if (!targets.length) throw { code: 'bad_request', message: 'Alege cel puțin un document de corectat.' };
    await commitGate({ decisions, log, gate: { ...p.gate, corrected: [...new Set([...(p.gate.corrected || []), ...targets])] } });
    runTask(pid, { gateKey: p.gate.key, feedback: note, targets, label: 'Corecții din review', returnStatus: 'awaiting_review' });
  } else if (decision === 'rejected') {
    if (restart === 'archive') { await commitGate({ decisions, log, gate: null, status: 'archived' }); return; }
    let start = 0;
    if (restart === 'phase') for (let i = gIdx - 1; i >= 0; i--) if (stages[i].handler === 'review_gate') { start = i + 1; break; }
    const reset = {}; stages.forEach((s, i) => { if (i >= start) reset[s.key] = { status: 'pending', items: [], done: 0, total: 0, error: null, warn: null, startedAt: null, finishedAt: null, imported: false, prefetched: null }; });
    await commitGate({ decisions, log, rejections: [...(p.rejections || []), note], gate: null, stageIndex: start, status: 'paused', run: (p.run || 1) + 1, stages: reset });
    schedule(pid);
  }
}


/* ============================================================
   Aprobare pe elemente: fiecare document, pagină de text și imagine are propria decizie.
   ============================================================ */
const h = x => { let a = 5381; const t = String(x ?? ''); for (let i = 0; i < t.length; i++) a = ((a << 5) + a + t.charCodeAt(i)) | 0; return (a >>> 0).toString(36); };
export const gateInstance = g => `${g.key}@${g.vol ?? 'c'}`;
/* the list of things to approve at a gate, from the blueprint (gates[..].items) */
export function gateItems(bp, art, project, gate) {
  const spec = bp.gates?.[gate.key]?.items || [], v = gate.vol, P = bp.structure.pages, out = [];
  for (const s of spec) {
    if (s.when && !getPath({ input: project.input }, s.when)) continue;
    if (s.kind === 'doc') for (const k of s.keys) out.push({ id: 'doc:' + k, kind: 'doc', key: k, label: defFor(bp, k).label, missing: !art[k], hash: art[k] ? fingerprint(art[k].content) : null });
    if (s.kind === 'ref' && project.options?.images !== false) {
      const refs = art[s.from]?.content?.prompts || [];
      if (!refs.length) out.push({ id: 'ref:missing', kind: 'ref', label: 'Fișe de referință', missing: true, hash: null });
      refs.forEach((r, i) => { if (r.generate || r.ref) out.push({ id: 'ref:' + i, kind: 'ref', index: i, label: r.label, image: r.image, missing: !r.image, hash: r.image ? fingerprint([r.image, r.prompt, (art.bible?.content?.characters||[]).find(c=>c.id===r.ref)]) : null }); });
    }
    if (s.kind === 'text') {
      const k = s.source + '_' + v, c = art[k]?.content;
      for (let i = 0; i < P; i++) { const pg = c?.pages?.[i], original = s.source === 'tr' ? art['final_' + v]?.content?.pages?.[i]?.text : null;
        out.push({ id: 'text:' + k + ':' + (i + 1), kind: 'text', key: k, v, p: i + 1, lang: s.lang || (s.source === 'tr' ? 'second' : 'first'), label: 'Pagina ' + (i + 1), bookTitle:i===0?c?.title:null,backBlurb:i===0?c?.back_cover_blurb:null, missing: !pg || Number(pg.n) !== i + 1 || (!String(pg.text || '').trim() && pg.page_type !== 'wordless'), hash: pg ? fingerprint([pg, original,...(i===0?[c.title,c.back_cover_blurb,c.collection_title]:[])]) : null });
      }
    }
    if (s.kind === 'collection') { const m = matrixForArtifacts(bp, art); out.push({ id: 'collection', kind: 'collection', label: 'Planul colecției: bibliile volumelor și cronologia distribuției', missing: !art.series || !art.cast || !art.bible, blocked: !m.ready, hash: m.hash, matrix: m }); }   // P4-T02: plan approved before bulk; blockers cannot be approved
    if (s.kind === 'book' && v != null) { const b = assessBook({ bp, art, project, v }); out.push({ id: 'book:' + v, kind: 'book', v, label: `Evaluarea cărții, volumul ${v + 1}`, missing: !art['final_' + v] && !art['script_' + v], blocked: !b.pass, hash: fingerprint([b.pass, b.reasons, b.checks?.text?.at]), book: b }); }   // P5-T02
    if (s.kind === 'safety' && v != null) { const sf = volumeSafety({ bp, art, project, v, images: (s.images ?? true) }); out.push({ id: 'safety:' + v, kind: 'safety', v, label: `Siguranța copiilor, volumul ${v + 1}: ${sf.verdict}`, missing: false, blocked: sf.verdict !== 'PASS', hash: fingerprint(sf.subjects.map(x => [x.id, x.verdict, x.hash])), safety: { ...sf, subjects: sf.subjects.filter(x => x.verdict !== 'PASS' || x.review) } }); }   // P5-T01: never compensated by scores
    if (s.kind === 'story' && v != null) { const sc = storyContract({ bp, art, input: project.input || {}, v }); out.push({ id: 'story:' + v, kind: 'story', v, label: `Contractul poveștii, volumul ${v + 1}: cauzalitate, vârstă, voce, știință${art['tr_' + v] ? ', ediția nativă' : ''}`, missing: !sc, blocked: !!sc && !sc.ready, hash: sc ? fingerprint([sc.causality, sc.findings.map(f => [f.code, f.page ?? null])]) : null, story: sc }); }   // P4-T04
    if (s.kind === 'pageplans') { const { pages, sources } = derivePageBlueprints(bp, art), r = validatePageBlueprints(pages, { structure: bp.structure, bible: art.bible?.content }); out.push({ id: 'pageplans', kind: 'pageplans', label: `Planul paginilor: ${r.count} din ${r.expected} PageBlueprints`, missing: !pages.length, blocked: !r.ready, hash: fingerprint([pages, r.findings.map(f => [f.code, f.page])]), check: { ...r, sources } }); }   // P4-T03
    if (s.kind === 'atlas') { const a = atlasFor({ project, art, approvals: project.approvals?.[gateInstance(gate)] || {}, declaredRights: project.rightsDeclared || [] }); out.push({ id: 'atlas', kind: 'atlas', label: 'Canonul vizual: atlasul personajelor', missing: !art.bible, blocked: false, hash: fingerprint([a.requirements.map(r => [r.character, r.view]), a.entries.map(e => [e.id, e.file, e.kind])]), atlas: a }); }   // P4-T03: proposals stay proposed
    if (s.kind === 'layout') { let lp = null; try { lp = planLayout({ bp, project, art, v }); } catch (e) { console.warn('[layout]', e.message); }   // P6-T01: measured plan; overflow/glyph/crop blockers cannot be approved
      for (let i=0;i<P;i++) {
      const k=s.source+'_'+v, pg=art[k]?.content?.pages?.[i], tr=art['tr_'+v]?.content?.pages?.[i], lpg=lp?.pages.find(x=>x.n===i+1), issues=lp?pageIssues(lp,i+1):[];
      out.push({id:'layout:'+k+':'+(i+1),kind:'layout',key:k,v,p:i+1,label:'Macheta paginii '+(i+1),missing:!pg,blocked:issues.length>0,issues,plan:lpg?{family:lpg.family,zone:lpg.zone,sizePt:lpg.sizePt,source:lpg.source,reason:lpg.reason,adjusted:lpg.adjusted||null,findings:lpg.findings.map(f=>({code:f.code,severity:f.severity,message:f.message}))}:null,hash:pg?fingerprint([pg.layout,pg.text,tr?.text,art['ill_'+v+'_'+(i+1)]?.content?.color, project.input.page_format, lpg&&[lpg.family,lpg.zone,issues]]):null});
    } }
    if (s.kind === 'bookcheck') {
      const k=s.source+'_'+v, c=art[k]?.content;
      out.push({id:'bookcheck:'+v,kind:'bookcheck',key:k,v,label:v===0?'Validarea pilotului: lectură, ritm, continuitate și pereche colorat':'Validarea editorială a volumului',missing:!c,blocked:editorialFindings(bp,art,v).strict && !editorialFindings(bp,art,v).complete,hash:c?fingerprint([c,art['tr_'+v]?.content,Array.from({length:P+1},(_,p)=>art['ill_'+v+'_'+p]?.content)]):null});
    }
    if (s.kind === 'image' && project.options?.images !== false) {
      const pages = s.pages === 'demo' ? (s.demo_pages || [0, 1]) : Array.from({ length: P + 1 }, (_, i) => i);
      for (const p of pages) { const key = 'ill_' + v + '_' + p, a = art[key], c = a?.content, source = art['final_' + v]?.content || art['script_' + v]?.content, pg = pageData(source, p);
        const scene = sceneFingerprint(pg), sourceChanged = !!(a?.basedOn?.pageHash && a.basedOn.pageHash !== scene);
        const identities = (art.bible?.content?.characters || []).filter(x => (pg?.characters || []).includes(x.id)).map(x => [x.id, x.canonical_description, x.anatomy, x.invariants, x.visual_landmarks]);
        for (const mode of s.modes || ['color']) {
          const demo = s.pages === 'demo' ? bp.stages.find(st => st.key === bp.gates[gate.key]?.redo?.['ill_*']) : null;
          if (mode === 'line' && demo?.lineart_pages && !demo.lineart_pages.includes(p)) continue;
          const file = mode === 'line' ? c?.lineart : c?.color;
          const failed = sourceChanged || (mode === 'line' ? c?.linePending || (c?.lineFrom && c.lineFrom !== c.color) || c?.lineQA?.ok === false || (c?.lineQA?.for && c.lineQA.for !== c.lineart) || (bp.editorial_contract?.version===1 && c?.lineQA?.ok!==true) : c?.qa?.ok === false || (bp.editorial_contract?.version===1 && project.options?.visual_qa!==false && c?.qa?.ok!==true) || (c?.qa?.color && c.qa.color !== c.color));
          out.push({ id: 'img:' + key + ':' + mode, kind: 'image', key, v, p, mode, label: (p ? 'Pagina ' + p : 'Coperta') + (mode === 'line' ? ', de colorat' : ', color'), image: file, missing: !file, blocked: !!failed, hash: file ? fingerprint([file, scene, identities, mode === 'line' ? c.color : null]) : null });
        }
      }
    }
  }
  const approvals = project.approvals?.[gateInstance(gate)] || {};
  for (const it of out) { const a = approvals[it.id]; it.note = a?.note || ''; it.code = a?.code || null; it.changed = !!(a && a.hash !== it.hash); it.state = it.missing ? 'missing' : it.blocked ? 'error' : !a || it.changed ? 'pending' : a.state; if (gate.diffs?.[it.id]) it.diff = gate.diffs[it.id]; }
  return out;
}
export function gateSummary(items) { const c = { total: items.length, approved: 0, pending: 0, changes: 0, rejected: 0, approved_note: 0 }; items.forEach(i => { c[i.state] = (c[i.state] || 0) + 1; }); c.done = c.approved === c.total && c.total > 0; return c; }
export async function setItemDecisions(pid, decisions, ctx = {}) {
  const p = repo.getProject(pid); if (!p?.gate) throw { status: 400, message: 'Nu există o aprobare deschisă.' };
  if (RUNNING[pid]) throw { status: 409, message: 'Se aplică modificări; așteaptă să termine.' };
  const bp = await repo.getBlueprint(pid); const art = await repo.artifacts(pid); const items = gateItems(bp, art, p, p.gate);
  const inst = gateInstance(p.gate); const cur = { ...(p.approvals?.[inst] || {}) };
  /* P2-T04: every item id must belong to the open gate (resource scope); unknown ids are refused, not skipped */
  const unknown = decisions.map(d => d?.id).filter(id => !items.some(i => i.id === id));
  if (unknown.length) throw { status: 400, code: 'resource_scope', message: `Elemente care nu aparțin aprobării deschise: ${unknown.slice(0, 5).join(', ')}. Reîncarcă pagina.` };
  const records = [], pol = policyHash(bp, p.gate.key);
  for (const d of decisions) {
    const it = items.find(i => i.id === d.id); if (!it) continue;
    if (!['approved', 'approved_note', 'changes', 'rejected', 'pending'].includes(d.state)) continue;
    if (['approved', 'approved_note'].includes(d.state) && (it.missing || it.blocked)) throw { status: 409, message: 'Elementul lipsește sau nu a trecut verificarea: ' + it.label };
    if (['approved_note', 'changes', 'rejected'].includes(d.state) && !String(d.note || '').trim() && d.state !== 'rejected') throw { status: 400, message: `Scrie ce trebuie schimbat la „${it.label}”.` };
    const code = (bp.reason_codes || []).some(r => r.code === d.code) ? d.code : null;   // v19 (plan 2.2): optional reason from the rubric
    if (d.state !== 'pending') records.push(decisionRecord({ kind: 'item', actor: ctx.actor || 'operator', state: d.state, note: d.note, scope: { gate: p.gate.key, vol: p.gate.vol ?? null, round: p.gate.round || 1, item: it.id }, subject: itemSubject(art, it), policy: pol, evidence: d.correction ? { correction: d.correction } : null }));
    if (d.state === 'pending') cur[it.id] = null; else cur[it.id] = { state: d.state, note: String(d.note || '').slice(0, 800), hash: it.hash, at: now(), ...(d.correction ? { correction: d.correction } : {}), ...(d.mode === 'adjust' || d.mode === 'rewrite' ? { mode: d.mode } : {}), ...(code ? { code } : {}), ...(['canva', 'chatgpt'].includes(d.engine) ? { engine: d.engine } : {}) };
    if (d.state !== 'approved' && d.state !== 'pending') { await repo.logEvent(pid, 'item_' + d.state, { gate: inst, item: it.id, note: d.note, code }); Ledger.record({ kind: 'item', pid, gate: p.gate.key, vol: p.gate.vol ?? null, item: it.id, itemKind: it.kind, decision: d.state, code, age: p.input?.[bp.variant_key] }); }
  }
  await repo.commitProjectDecision(pid, { approvals: { [inst]: cur } }, records, { actor: ctx.actor || 'operator', expectedRevision: ctx.expectedRevision, commandId: ctx.commandId, kind: 'item.decide' });
  /* P2-T03: the exact version the operator approved is pinned (never evicted by retention) */
  for (const d of decisions) { const it = items.find(i => i.id === d.id); if (it?.key && art[it.key] && ['approved', 'approved_note'].includes(d.state)) await pinVersion(repo.s, pid, it.key, art[it.key].version, { reason: 'approved', ref: { gate: inst, item: it.id, hash: it.hash }, actor: 'operator' }).catch(e => console.warn('[pin]', e?.message || e)); }
  const derive = decisions.map(d => items.find(i => i.id === d.id && d.state === 'approved' && i.kind === 'image' && i.mode === 'color')).filter(i => i && art[i.key]?.content?.linePending && items.some(line => line.id === i.id.replace(':color', ':line')));
  if (derive.length) withEngine(pid, async E => {
    E.prevStatus = 'awaiting_review'; const ill = stageByKey(E, matchMap(E.bp.gates?.[p.gate.key]?.redo || {}, 'ill_0_0') || 'illustrations');
    await repo.patchProject(pid, { status: 'correcting' });
    for (const i of derive) await imageOne(E, ill, i.v, i.p, '', { lineOnly: true, provider: E.art[i.key]?.content?.engine || undefined });
    await repo.patchProject(pid, { status: 'awaiting_review' });
  }, { label: 'Actualizez paginile de colorat din culoarea aprobată' });
  /* item-level corrections are the richest signal: they feed learning too (as lessons scoped to this project) */
  const notes = decisions.filter(d => ['changes', 'rejected', 'approved_note'].includes(d.state) && String(d.note || '').trim()).map(d => ({ item: items.find(i => i.id === d.id)?.label, kind: d.id.split(':')[0], decision: d.state, note: d.note, code: d.code || undefined }));
  if (bp.reason_codes) for (const d of decisions) if (d.id?.startsWith('img:') && ['changes', 'rejected'].includes(d.state) && String(d.note || '').trim()) noteVisualFailure(d.note, d.code);   // 3.9
  if (notes.length && learningSettings().immediateFeedback === true) trackProjectBackground(pid, () => learnFromEvent({ kind: 'item_decisions', gate: inst, decisions: notes, age: p.input?.[bp.variant_key], language: p.input?.language }, { pid, age: p.input?.[bp.variant_key], codes: buildCodes(bp), agents: ['director-creativ', 'arhitect-serie', 'pastrator-continuitate', 'scriitor', 'editor-critic', 'corector', 'director-artistic', 'traducator'] })).catch(e => console.warn('[learning]', e?.message || e));
  return gateSummary(gateItems(bp, art, repo.getProject(pid), p.gate));
}
/* applies every "change", "reject" and "approve with note" of the open gate, in as few calls as possible */
export function applyItemChanges(pid) {
  return withEngine(pid, async E => {
    E.prevStatus = 'awaiting_review'; E.task = { label: 'Modificări pe elemente' }; E.curStage = { key: '_task', base: 'modificari', vol: E.project.gate?.vol ?? null };
    await repo.patchProject(pid, { status: 'correcting', error: null });
    const gate = E.project.gate; const inst = gateInstance(gate); const appr = { ...(E.project.approvals?.[inst] || {}) };
    let items = gateItems(E.bp, E.art, E.project, gate).filter(i => ['changes', 'rejected', 'approved_note'].includes(i.state));
    if(items.some(i=>['layout','bookcheck'].includes(i.kind)))throw {code:'validation',message:'Pentru machetă folosește Editează macheta; verificarea întregii cărți se face în preview, apoi aprobi sau notezi paginile care cer corecturi.'};
    if (!items.length) { await repo.patchProject(pid, { status: 'awaiting_review' }); return; }
    /* P5-T06: bounded PagePatch plan — exact targets, explicit dependents, at most 2 creative attempts per item */
    const attempts = { ...(E.project.repairAttempts || {}) }, plan = planRepairs({ items, approvals: appr, attempts });
    const blockedIds = new Set(plan.needsOperator.map(x => x.id)); const t0 = Date.now(), vRep = gate.vol ?? 0, before = unitHashes(E.art, vRep, E.bp.structure.pages);
    if (blockedIds.size) await logE(E, `${blockedIds.size} elemente au epuizat cele ${MAX_CREATIVE_ATTEMPTS} încercări creative: decizia îți aparține (editare manuală sau altă abordare).`, 'warn');
    items = items.filter(i => !blockedIds.has(i.id));
    const byArt = {}; items.filter(i => i.kind === 'text').forEach(i => (byArt[i.key] = byArt[i.key] || []).push(i));
    const jobs = [...Object.entries(byArt).map(([k, its]) => ({ type: 'text', key: k, its })), ...items.filter(i => i.kind === 'doc').map(i => ({ type: 'doc', its: [i] })),
      ...items.filter(i => i.kind === 'image').map(i => ({ type: 'image', its: [i] })), ...items.filter(i => i.kind === 'ref').map(i => ({ type: 'ref', its: [i] }))];
    const ill = stageByKey(E, matchMap(E.bp.gates?.[gate.key]?.redo || {}, 'ill_0_0') || 'illustrations');   // demo gate redraws from the script, final gate from the final text
    const tStage = { key: '_task', label: 'Modificări pe elemente', concurrency: 2, tolerate_item_errors: true };
    await repo.patchProject(pid, { stages: { _task: { items: [], run: -1 } } });
    await runItems(E, tStage, jobs, jobs.map(j => j.type === 'text' ? `${defFor(E.bp, j.key).label}: ${j.its.length} pagini` : j.its[0].label), async job => {
      if (job.type === 'text') {
        const cur = E.art[job.key].content; const isTr = job.key.startsWith('tr_');
        const exact = job.its.map(i => ({ i, correction: appr[i.id]?.correction || parseExactCorrection(i.note) }));
        const exactItems = exact.filter(x => x.correction);
        const local = clone(cur);
        for (const { i, correction } of exactItems) { local.pages[i.p - 1].text = exactCorrection(local.pages[i.p - 1].text, correction); appr[i.id].exactApplied = true; }
        const creative = job.its.filter(i => !exactItems.some(x => x.i.id === i.id));
        const requests = creative.map(i => ({ page: i.p, request: i.note || '', rewrite: i.state === 'rejected' || appr[i.id]?.mode === 'rewrite', mode: appr[i.id]?.mode || 'adjust' }));
        const ctx = buildCtx(E, { n: (job.its[0].v ?? 0) + 1, current: cur, requests, lang: isTr ? E.project.input?.second_language : E.project.input?.language });
        const out = !requests.length ? { pages: [] } : await callLLM(E, tpl(E.bp.prompts.page_fix, ctx), { label: `Modific ${requests.length} pagini: ${defFor(E.bp, job.key).label}`, agent: isTr ? 'traducator' : 'scriitor' });
        if (!Array.isArray(out?.pages) || out.pages.length !== requests.length || new Set(out.pages.map(pg => pg.n)).size !== requests.length || out.pages.some(pg => !requests.some(r => r.page === pg.n) || typeof pg.text !== 'string' || (!pg.text.trim() && pg.page_type !== 'wordless'))) throw { code: 'validation', message: 'Corectura trebuie să întoarcă exact paginile cerute, fiecare o singură dată.' };
        const next = local;
        for (const pg of out.pages) { const n = Number(pg.n); if (n >= 1 && n <= next.pages.length && requests.some(r => r.page === n)) { const previous=next.pages[n-1]; next.pages[n - 1] = isTr ? { ...previous, text: pg.text ?? previous.text } : { ...previous, ...pg, n }; if(!isTr && (pg.semantic_changed === true || requests.find(r=>r.page===n)?.mode==='rewrite')) next.pages[n-1].visual_revision=(previous.visual_revision||0)+1; } }
        await saveArt(E, job.key, next, { note: `Modificări pe paginile ${requests.map(r => r.page).join(', ')}`, meta: E.art[job.key]?.meta || {} });
        await recordDiffs(pid, job.its.map(it => [it.id, { before: cur.pages?.[it.p - 1]?.text || '', reason: it.note || (it.state === 'rejected' ? 'refăcută de la zero' : ''), code: appr[it.id]?.code || null }]).filter(([id]) => next.pages?.[Number(id.split(':').pop()) - 1]?.text !== cur.pages?.[Number(id.split(':').pop()) - 1]?.text));
      } else if (job.type === 'doc') {
        const i = job.its[0]; const def = defFor(E.bp, i.key);
        const ctx = buildCtx(E, { current: E.art[i.key]?.content, feedback: i.state === 'rejected' ? 'Rewrite this document from scratch with a clearly different, better approach. ' + (i.note || '') : i.note, comments: [], artifact_label: def.label });
        const out = await llmValidated(E, tpl(E.bp.prompts.correct, ctx), def, ctx, 'Corectez: ' + def.label, agentOf(E, null, i.key === 'bible' || i.key === 'cast' ? 'bible' : 'brief'), 'correct');
        await saveArt(E, i.key, out, { note: 'Modificare cerută: ' + (i.note || 'refacere') });
      } else if (job.type === 'image') {
        const i = job.its[0]; const beforeImage = i.mode === 'line' ? E.art[i.key]?.content?.lineart : E.art[i.key]?.content?.color;
        await recordDiffs(pid, [[i.id, { beforeImage, reason: i.note || (i.state === 'rejected' ? 'refăcută de la zero' : ''), code: appr[i.id]?.code || null }]]);
        await imageOne(E, ill, i.v, i.p, i.state === 'rejected' ? 'Completely new composition. ' + (i.note || '') : i.note, { lineOnly: i.mode === 'line', deferLine: i.mode !== 'line', provider: appr[i.id]?.engine || undefined });
        if (i.mode !== 'line' && E.project.options?.visual_qa !== false) await qaPages(E, { key: '_task', label: 'Verificare după modificare' }, [[i.v, i.p]], { redraw: null });
      } else if (job.type === 'ref') {
        const i = job.its[0]; const list = clone(E.art.anchors.content.prompts); const r = list[i.index];
        const img = await callImage(E, { prompt: r.prompt + ' Additional direction: ' + (i.note || 'a fresh, better version'), aspectRatio: 'LANDSCAPE_3_2' }, r.label);
        r.image = await repo.saveFile(E.pid, `images/${path.basename(r.image || 'ref.png').replace(/(-v\d+)?\.(png|jpg|webp)$/, '')}-v${Date.now().toString(36)}.${ext(img.mime)}`, img.buffer); r.mediaId = img.mediaId; r.link = img.link;
        await saveArt(E, 'anchors', { prompts: list }, { note: 'Fișă refăcută: ' + r.label });
      }
      const after = gateItems(E.bp, E.art, E.project, gate);
      for (const it of job.its) {                        // "approve with note": stays approved after the fix; the others come back for review
        const now2 = after.find(x => x.id === it.id);
        if (it.state === 'approved_note' && appr[it.id]?.exactApplied) appr[it.id] = { state: 'approved', note: it.note, hash: now2?.hash, at: now(), applied: true }; else appr[it.id] = null;
        if (it.kind === 'image' && it.mode === 'color') { const lineId = it.id.replace(':color', ':line'); if (appr[lineId]?.state === 'approved') appr[lineId] = null; }   // new colour image: its colouring page needs a new look
      }
      await repo.patchProject(pid, { approvals: { [inst]: appr } });
    });
    await setStage(E, '_task', { status: 'done', finishedAt: now() });
    /* P5-T06: verify — nothing outside the plan changed; resolution only from the current full recheck; exact calls and hashes */
    const art2 = await repo.artifacts(pid), after = unitHashes(art2, vRep, E.bp.structure.pages), verify = verifyExecution(before, after, plan);
    const calls = Ledger.rows(r => r.pid === pid && r.t >= t0).map(r => ({ kind: r.kind, unit: r.unit || null, model: r.model || r.engine || null, ok: r.ok, ms: r.ms }));
    for (const pt of plan.patches.filter(x => x.creative)) attempts[pt.id] = { count: (attempts[pt.id]?.count || 0) + 1, history: [...(attempts[pt.id]?.history || []), { at: now(), before: pt.target.map(u => before[u] || null), after: pt.target.map(u => after[u] || null), calls: calls.filter(c => pt.target.some(u => String(c.unit || '').includes(u.split(/[#:]/)[0]))).length }].slice(-5) };
    const report = { at: now(), gate: inst, plan, verify, resolutions: plan.patches.map(pt => ({ id: pt.id, op: pt.op, ...resolution(pt, art2, { approval: appr[pt.id] || {} }) })), needsOperator: plan.needsOperator.map(x => ({ id: x.id, op: x.op, reason: x.reason, history: x.history })), calls };
    if (!verify.ok) await logE(E, `Atenție: s-au schimbat elemente necerute (${verify.unrequested.join(', ')}).`, 'warn');
    await repo.patchProject(pid, { status: 'awaiting_review', approvals: { [inst]: appr }, repairAttempts: attempts, repairs: [...(E.project.repairs || []), report].slice(-20) });
    await logE(E, `Modificări aplicate pe ${items.length} elemente.`);
  }, { label: 'Modificări pe elemente' });
}
/* everything approved: the gate closes and production continues */
export async function completeGate(pid, ctx = {}) {
  const p = repo.getProject(pid); if (!p?.gate) throw { status: 400, message: 'Nu există o aprobare deschisă.' };
  const bp = await repo.getBlueprint(pid); const items = gateItems(bp, await repo.artifacts(pid), p, p.gate); const c = gateSummary(items);
  if (!c.done) throw { status: 400, message: `Mai sunt ${c.total - c.approved} elemente neaprobate sau cu modificări neaplicate.` };
  return decide(pid, { decision: 'approved', note: '' }, ctx);
}

/* ============================================================
   P3-T05 — operator exchange: the SAME prompt, context, schema and validators as the automatic path; the result
   enters as a candidate with provenance "operator-exchange"; gates are unchanged (approval still required).
   ============================================================ */
async function packetEngine(pid) { const project = repo.getProject(pid); const bp = await repo.getBlueprint(pid); return { pid, project, bp, stages: expandStages(bp), art: await repo.artifacts(pid), ctl: new AbortController(), task: null }; }
function packetHash(E, parts) { return canonicalHash({ ...parts, input: E.project.input, notes: E.project.notes || [], run: E.project.run || 1, upstream: Object.fromEntries(Object.entries(E.art).filter(([k]) => k !== parts.outKey).map(([k, a]) => [k, a.version]).sort()) }); }
export async function prepareTextPacket(pid, stageKey) {
  const E = await packetEngine(pid), stage = E.stages.find(s => s.key === stageKey);
  if (!stage) throw { status: 404, message: 'Etapă necunoscută.' };
  if (stage.handler !== 'llm_json' || stage.for_each) throw { status: 400, code: 'packet_unsupported', message: 'Schimbul manual de text este disponibil pentru etapele cu un singur document.' };
  const ctx = applyBind(E, stage, buildCtx(E, { item: null, i: 0, n: 1 })), promptKey = stage.prompt, outKey = tpl(stage.out, ctx), agentId = agentOf(E, stage, promptKey);
  const prompt = tpl(E.bp.prompts[promptKey], ctx), schema = schemaFor(E.bp, promptKey, ctx), age = E.project.input?.[E.bp.variant_key];
  const system = agentSystem(agentId, age, pid, { stage: stage.base || stage.key, prompt: promptKey });
  return { kind: 'text', stageKey, outKey, agentId, promptKey, prompt, system, schema, required: defFor(E.bp, outKey).required || [], inputsHash: packetHash(E, { stageKey, outKey, prompt, system, schema }) };
}
export async function ingestTextPacket(pid, packet, rawText, actor = 'operator@laptop') {
  const fresh = await prepareTextPacket(pid, packet.stageKey);
  if (fresh.inputsHash !== packet.inputsHash) throw { status: 409, code: 'stale_packet', message: 'Pachetul este expirat: proiectul s-a schimbat după emitere. Generează un pachet nou.' };
  let out; try { out = parseJSONLoose(rawText); } catch { throw { status: 400, code: 'invalid_output', message: 'Rezultatul nu conține JSON valid.' }; }
  const E = await packetEngine(pid), stage = E.stages.find(s => s.key === packet.stageKey), ctx = applyBind(E, stage, buildCtx(E, { item: null, i: 0, n: 1 }));
  const problem = checkOut(out, { ...stage, required: fresh.required }, ctx, fresh.schema);
  if (problem) throw { status: 400, code: 'invalid_output', message: 'Rezultatul nu respectă contractul: ' + problem };
  const doc = await repo.writeArtifact(pid, fresh.outKey, out, { by: 'operator-exchange', stage: stage.key, note: 'Rezultat din schimbul manual (aceleași validări)', meta: { prov: { channel: 'operator-exchange', packetId: packet.id, agent: fresh.agentId, model: 'manual', prompt: fresh.promptKey, actor, inputsHash: fresh.inputsHash, at: now() } } });
  const p = repo.getProject(pid);
  if (!['done', 'skipped'].includes(p.stages?.[stage.key]?.status)) await repo.patchProject(pid, { stages: { [stage.key]: { status: 'done', imported: true, manual: true, finishedAt: now(), note: 'Completat prin schimb manual' } } });
  return { artifact: fresh.outKey, version: doc.version };
}
export async function prepareImagePacket(pid, v, p) {
  const E = await packetEngine(pid); const fmt = E.bp.formats?.[E.project.input?.[E.bp.format_key]] || {};
  const contract = pageContract(E, v, p), style = E.art.bible?.content?.style_guide?.style_block || null;
  const refs = []; for (const r of E.project.refs || []) { try { refs.push({ file: r.file, sha256: crypto.createHash('sha256').update(await repo.readFile(pid, r.file)).digest('hex') }); } catch {} }
  for (const r of E.art.anchors?.content?.prompts || []) if (r.image) { try { refs.push({ file: r.image, sha256: crypto.createHash('sha256').update(await repo.readFile(pid, r.image)).digest('hex'), role: r.label || r.ref }); } catch {} }
  const outKey = `ill_${v}_${p}`, aspect = fmt.trim_w_in && fmt.trim_h_in ? fmt.trim_w_in / fmt.trim_h_in : 1;
  const prompt = `Children's picture-book illustration, ${pageLabel(v, p)}. Style: ${style || E.project.input?.visual_style || ''}. Scene contract (follow exactly, never add text or letters to the art): ${JSON.stringify(contract)}`;
  return { kind: 'image', outKey, v, p, prompt, contract, refs, aspect, minShortSide: 1024, inputsHash: packetHash(E, { outKey, prompt, refs }) };
}
export async function ingestImagePacket(pid, packet, buffer, actor = 'operator@laptop') {
  const fresh = await prepareImagePacket(pid, packet.v, packet.p);
  if (fresh.inputsHash !== packet.inputsHash) throw { status: 409, code: 'stale_packet', message: 'Pachetul este expirat: scena sau referințele s-au schimbat. Generează un pachet nou.' };
  const mime = sniffImage(buffer); if (!mime) throw { status: 400, code: 'invalid_output', message: 'Fișierul nu este o imagine PNG/JPEG/WebP.' };
  const size = mime === 'image/png' ? pngSize(buffer) : null;
  if (size) {
    if (Math.min(size.width, size.height) < fresh.minShortSide) throw { status: 400, code: 'invalid_output', message: `Imaginea are ${size.width}×${size.height} px; latura scurtă trebuie să aibă cel puțin ${fresh.minShortSide} px.` };
    if (Math.abs(size.width / size.height - fresh.aspect) / fresh.aspect > 0.03) throw { status: 400, code: 'invalid_output', message: `Raportul imaginii (${(size.width / size.height).toFixed(3)}) nu corespunde formatului (${fresh.aspect.toFixed(3)}).` };
  }
  const E = await packetEngine(pid), src = E.art[`final_${packet.v}`] ? `final_${packet.v}` : `script_${packet.v}`;
  const rel = `images/manual-${packet.id}.${mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1]}`; await repo.saveFile(pid, rel, buffer);
  const prev = E.art[fresh.outKey]?.content || {};
  const doc = await repo.writeArtifact(pid, fresh.outKey, { color: rel, engine: 'manual', provider: 'operator-exchange', ...(prev.lineart ? { linePending: true } : {}) }, { by: 'operator-exchange', note: 'Imagine din schimbul manual; QA vizual necesar', basedOn: { key: src, version: E.art[src]?.version ?? null, pageHash: sceneFingerprint(pageData(E.art[src]?.content, packet.p)) }, meta: { prov: { channel: 'operator-exchange', packetId: packet.id, actor, inputsHash: fresh.inputsHash, pixels: size ? [size.width, size.height] : null, at: now() } } });
  return { artifact: fresh.outKey, version: doc.version, qa: 'required' };
}
