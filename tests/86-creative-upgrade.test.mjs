// Creative Upgrade Proposal — DOVEZI MECANICE cu furnizor SIMULAT (mock). Testele verifică mecanica fluxului (ordinea
// agenților permanenți, critică → o rundă de revizie → revizie finală, proveniența, „doar propunere”, zero mutații,
// zero aprobări inventate, versiuni, eșec/reluare, furnizor indisponibil, ieșiri invalide, critic care respinge,
// conflict de continuitate, baseline învechit) și remedierea O3. Textele simulate sunt marcate [MOCK]: NU sunt conținut
// creativ, NU sunt un Creative Upgrade real și NU dovedesc calitatea creativă a vreunei propuneri.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { openPage } from './cdp.mjs';
import { AUDIT, violations } from './ux-audit.mjs';
import { api, setFake, waitFor, ROOT, zip } from './lib.mjs';
import { readZip } from '../server/security/safe-zip.js';
import { LocalStorage } from '../server/storage/local.js';
import { applyMigrations } from '../server/persistence/migrations.js';
import { Repo } from '../server/repo.js';
import { planMigration, runMigration } from '../server/migration/migrator.js';
import { loadContracts, PERMANENT_IDS } from '../server/agents-runtime/registry.js';
import { findingStatus, canonConflicts } from '../server/domain/canon.js';
import { buildBaseline, projectFingerprint } from '../server/creative/baseline.js';
import { validateProposal, validateDecision, validateStepOutput } from '../server/creative/proposal.js';
import { createUpgradeService, STEPS } from '../server/creative/upgrade.js';

const require = createRequire(import.meta.url);
const ORIGINAL = path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip');
/* a re-packed copy of the read-only original: a different archive hash gives a fresh migrated project for this file */
const REPACKED = zip([...readZip(fs.readFileSync(ORIGINAL))].map(([name, data]) => ({ name, data })));
const post = (p, body) => api('POST', p, body, { headers: { 'content-type': 'application/octet-stream' } });
const FINALS = ['ready_for_review', 'critic_rejected', 'invalid', 'stale_baseline', 'blocked_provider', 'failed'];
const settle = (pid, id) => waitFor(async () => { const r = (await api('GET', `projects/${pid}/creative/proposals/${id}`)).body; return FINALS.includes(r.status) && !r.live?.running ? r : null; }, { timeout: 120000, label: `propunerea ${id}` });
const startP = async (pid, body = {}) => { const r = await api('POST', `projects/${pid}/creative/proposals`, body); assert.equal(r.status, 200, JSON.stringify(r.body)); return r.body.id; };
const snapshot = async pid => { const d = (await api('GET', `projects/${pid}`)).body; const { running, log, ...project } = d.project; return { project, artifacts: Object.fromEntries(Object.entries(d.artifacts).map(([k, a]) => [k, [a.version, JSON.stringify(a.content)]])), decisions: (await api('GET', `projects/${pid}/decisions`)).body.decisions.map(x => x.id) }; };
/* both simulated CLIs (a permanent agent may be bound to Claude or to GPT/Codex — a binding, not an identity) */
const mockLog = () => ['claude', 'codex'].flatMap(who => { try { return fs.readFileSync(`${process.env.WP_FAKE_STATE}.${who}.log`, 'utf8').trim().split('\n').map(l => ({ ...JSON.parse(l), who })); } catch { return []; } }).filter(e => String(e.kind).startsWith('creative_upgrade:')).sort((a, b) => a.at - b.at);

let PID, BASE0, SNAP0;

test('CU setup: proiect DW migrat dintr-o copie reîmpachetată (originalul doar citit); O3 înainte: constatarea DW01 este activă', async () => {
  setFake({}); await api('PUT', 'settings/budget', { budget5h: 1000, budget7d: 5000 });
  const plan = await post('migrations/plan', REPACKED); assert.equal(plan.status, 200);
  const run = await post(`migrations/run?plan=${plan.body.planHash}`, REPACKED); assert.equal(run.status, 200, JSON.stringify(run.body).slice(0, 300)); PID = run.body.projectId;
  assert.ok(!run.body.alreadyMigrated, 'proiect nou pentru acest test');
  const canon = (await api('GET', `projects/${PID}/canon`)).body;
  assert.ok(canon.conflicts.some(c => c.id === 'finding:DW01'), 'constatarea deschisă apare (regresie O3: deschis → activ)');
  assert.deepEqual(canon.resolvedFindings, []);
});

test('CU baseline: dosar înghețat, reproductibil (același hash), 6 volume / 72 planuri / 12 pagini, index de proveniență, O1/O2', async () => {
  const a = (await api('POST', `projects/${PID}/creative/baselines`)).body, b = (await api('POST', `projects/${PID}/creative/baselines`)).body;
  assert.equal(a.hash, b.hash, 'reproductibil'); assert.equal(a.counts.volumes, 6); assert.equal(a.counts.pagePlans, 72); assert.equal(a.counts.pagesPerBook, 12); assert.ok(a.counts.characters >= 1);
  BASE0 = (await api('GET', `projects/${PID}/creative/baselines/${a.hash}`)).body;
  assert.equal(BASE0.project.ageBand, '3-4'); assert.equal(BASE0.contract.volumes, 6); assert.equal(BASE0.inventory.pagePlans.length, 72);
  for (const ref of ['series:through_line', 'volume:1', 'volume:6', 'page_plan:V1-P01', 'page_plan:V6-P12', 'manuscript:V1-P01']) assert.ok(BASE0.index.some(x => x.ref === ref), ref);
  assert.ok(BASE0.findings.observations.payoffMismatches.length >= 0 && Array.isArray(BASE0.findings.observations.sharedOpenings));
  assert.deepEqual(BASE0.findings.reconcile.map(c => c.id), ['DW01', 'DW02']);
  assert.equal((await api('GET', `projects/${PID}/creative/baselines`)).body.baselines.length, 1, 'adresat prin conținut: un singur document');
  SNAP0 = await snapshot(PID);
});

test('CU flux complet (mock): ordinea agenților permanenți, critică → revizie → revizie finală, proveniență, ready_for_review', async () => {
  setFake({});
  const id = await startP(PID, { baseline: BASE0.hash, direction: 'Direcția operatorului (test).' }), pr = await settle(PID, id);
  assert.equal(pr.status, 'ready_for_review', JSON.stringify(pr.validation?.errors || pr.error).slice(0, 600));
  assert.deepEqual(pr.steps.map(s => s.id), ['direction', 'structure', 'continuity', 'narrative', 'critique', 'revision:arhitect-serie', 'revision:scriitor', 'final_review']);
  assert.deepEqual(pr.steps.map(s => s.agent), ['director-creativ', 'arhitect-serie', 'pastrator-continuitate', 'scriitor', 'editor-critic', 'arhitect-serie', 'scriitor', 'editor-critic']);
  assert.deepEqual(mockLog().map(e => e.kind), ['direction', 'structure', 'continuity', 'narrative', 'critique', 'revision:arhitect-serie', 'revision:scriitor', 'final_review'].map(s => `creative_upgrade:${s}`), 'furnizorul a fost chemat exact în această ordine');
  for (const s of pr.steps) {
    assert.ok(PERMANENT_IDS.includes(s.agent), `identitate permanentă: ${s.agent}`);
    const a = s.attempts[s.attempts.length - 1]; assert.equal(a.ok, true); assert.equal(a.agent, s.agent); assert.equal(a.role.id, s.agent);
    assert.ok(a.role.contractHash && a.skills.length && a.context.manifestHash, 'rol, skill-uri, manifest de context'); assert.ok(['claude-code', 'codex'].includes(a.context.provider), 'Claude/GPT = binding, nu identitate');
  }
  assert.equal(pr.validation.structural, 'PASS'); assert.equal(pr.validation.creativeQuality, 'NOT_EVALUATED');
  assert.equal(pr.critique.by, 'editor-critic'); assert.equal(pr.responses.length, 2); assert.equal(pr.finalReview.by, 'editor-critic');
  assert.equal(pr.sections.arc.through_line, '[MOCK] fir revizuit', 'revizia autorului secțiunii a fost aplicată în propunere');
  for (const d of pr.decisions) { assert.ok(['KEEP', 'IMPROVE', 'REPLACE', 'NEW'].includes(d.decision)); assert.ok(d.argument && d.impact && d.evidence.length && d.scope && Array.isArray(d.dependencies) && d.risk.level, 'decizie completă'); assert.ok(PERMANENT_IDS.includes(d.owner)); }
  assert.ok(pr.decisions.some(d => d.decision === 'NEW' && d.element.startsWith('new:')));
  assert.equal(pr.baseline.hash, BASE0.hash); assert.equal(pr.baseline.projectFingerprint, BASE0.projectFingerprint);
  assert.equal(pr.mutation.before, pr.mutation.after, 'amprenta proiectului neschimbată'); assert.equal(pr.apply.available, false); assert.equal(pr.apply.requires, 'operator_approval');
  assert.equal(pr.provider.authentic, true, 'furnizorul simulat se declară autentic doar în teste'); assert.equal(pr.contract.volumes, 6); assert.equal(pr.target.ageBand, '3-4');
  globalThis.CU_A = pr;
});

test('CU furnizor indisponibil: blocked_provider (INCOMPLETE, nu PASS), apoi reluare după autentificare', async () => {
  setFake({ claude: 'auth' });
  const id = await startP(PID), pr = await settle(PID, id);
  assert.equal(pr.status, 'blocked_provider'); assert.equal(pr.validation.structural, 'INCOMPLETE'); assert.ok(pr.steps.every(s => s.status === 'pending' && !s.attempts.length), 'niciun agent nu a rulat');
  const rd = (await api('GET', `projects/${PID}/creative/readiness`)).body; assert.equal(rd.canRun, false); assert.ok(rd.reasons.length);
  setFake({}); assert.equal((await api('POST', `projects/${PID}/creative/proposals/${id}/resume`)).status, 200);
  assert.equal((await settle(PID, id)).status, 'ready_for_review');
  assert.equal((await api('GET', `projects/${PID}/creative/readiness`)).body.canRun, true);
});

test('CU binding mixt: Director Creativ legat de GPT/Codex — identitatea rămâne, furnizorul lui se verifică separat (ChatGPT)', async () => {
  const prev = (await api('GET', 'agents')).body.agents.find(a => a.id === 'director-creativ').model;
  assert.equal((await api('PUT', 'agents/director-creativ', { model: 'gpt-6-sol' })).status, 200);
  try {
    setFake({ codex: 'noauth' }); const id = await startP(PID); let pr = await settle(PID, id);
    assert.equal(pr.status, 'blocked_provider'); assert.equal(pr.provider.providers.codex.authentic, false); assert.equal(pr.provider.bindings['director-creativ'], 'codex');
    setFake({}); await api('POST', `projects/${PID}/creative/proposals/${id}/resume`); pr = await settle(PID, id);
    assert.equal(pr.status, 'ready_for_review'); assert.equal(pr.steps[0].agent, 'director-creativ'); assert.equal(pr.steps[0].attempts.at(-1).context.provider, 'codex', 'Claude/GPT = binding');
    assert.equal(pr.steps[1].attempts.at(-1).context.provider, 'claude-code');
  } finally { await api('PUT', 'agents/director-creativ', { model: prev }); }
});

test('CU pierderea furnizorului în timpul rulării: pașii terminați se păstrează, reluarea continuă de unde a rămas', async () => {
  setFake({ cu: { fail: { step: 'continuity', kind: 'auth' } } });
  const id = await startP(PID); let pr = await settle(PID, id);
  assert.equal(pr.status, 'blocked_provider'); assert.equal(pr.error.code, 'auth'); assert.deepEqual(pr.steps.slice(0, 3).map(s => s.status), ['done', 'done', 'pending']);
  assert.equal((await api('POST', `projects/${PID}/creative/proposals/${id}/resume`)).status, 200); pr = await settle(PID, id);
  assert.equal(pr.status, 'ready_for_review'); assert.equal(pr.steps[0].attempts.length, 1, 'direcția nu s-a reluat'); assert.equal(pr.steps[2].attempts.length, 2);
  assert.ok(pr.history.some(h => h.event === 'resumed'));
});

test('CU ieșire invalidă: o reîncercare cu erorile structurale; a doua invalidă → failed, reluare → finalizat', async () => {
  setFake({ cu: { invalid: { step: 'structure', times: 1 } } });
  let pr = await settle(PID, await startP(PID));
  assert.equal(pr.status, 'ready_for_review'); assert.deepEqual(pr.steps[1].attempts.map(a => a.ok), [false, true]); assert.ok(pr.steps[1].attempts[0].errors.some(e => e.code === 'MISSING_SECTION'));
  setFake({ cu: { invalid: { step: 'narrative', times: 2 } } });
  const id = await startP(PID); pr = await settle(PID, id);
  assert.equal(pr.status, 'failed'); assert.equal(pr.error.code, 'invalid_output'); assert.equal(pr.steps[3].status, 'invalid_output'); assert.equal(pr.validation.structural, 'INCOMPLETE');
  assert.equal((await api('POST', `projects/${PID}/creative/proposals/${id}/resume`)).status, 200);
  assert.equal((await settle(PID, id)).status, 'ready_for_review');
});

test('CU eroare a furnizorului (nu de autentificare): failed, reluare → finalizat', async () => {
  setFake({ cu: { fail: { step: 'critique', kind: 'upstream' } } });
  const id = await startP(PID); let pr = await settle(PID, id);
  assert.equal(pr.status, 'failed'); assert.equal(pr.steps[4].status, 'failed');
  await api('POST', `projects/${PID}/creative/proposals/${id}/resume`); pr = await settle(PID, id);
  assert.equal(pr.status, 'ready_for_review');
});

test('CU criticul respinge propunerea: critic_rejected (nu PASS creativ)', async () => {
  setFake({ cu: { critiqueVerdict: 'reject', finalVerdict: 'reject' } });
  const pr = await settle(PID, await startP(PID));
  assert.equal(pr.status, 'critic_rejected'); assert.equal(pr.finalReview.verdict, 'reject'); assert.equal(pr.critique.verdict, 'reject');
  assert.ok(pr.steps.some(s => s.id.startsWith('revision:')), 'și o respingere trece prin runda de revizie');
});

test('CU conflict de continuitate, KEEP modificat, obiecție fără răspuns → invalid, cu codurile exacte', async () => {
  for (const [cu, code] of [[{ conflict: true }, 'CAST_ARC_MISMATCH'], [{ keepModified: true }, 'KEEP_MODIFIED'], [{ unanswered: true }, 'OBJECTION_UNANSWERED']]) {
    setFake({ cu }); const pr = await settle(PID, await startP(PID));
    assert.equal(pr.status, 'invalid', code); assert.equal(pr.validation.structural, 'FAIL'); assert.ok(pr.validation.errors.some(e => e.code === code), `${code}: ${JSON.stringify(pr.validation.errors).slice(0, 300)}`);
  }
  setFake({ cu: { noObjections: true, critiqueVerdict: 'accept' } }); const pr = await settle(PID, await startP(PID));
  assert.equal(pr.status, 'ready_for_review'); assert.equal(pr.steps.find(s => s.id === 'revision').status, 'skipped');
});

test('CU versiuni: o propunere nouă o înlocuiește pe cea veche fără să o modifice; propunerile finale sunt imuabile; o singură rulare', async () => {
  setFake({}); const A = globalThis.CU_A;
  const before = (await api('GET', `projects/${PID}/creative/proposals/${A.id}`)).body;
  const id = await startP(PID, { supersedes: A.id }), pr = await settle(PID, id);
  assert.equal(pr.version, 2); assert.equal(pr.supersedes, A.id);
  const after = (await api('GET', `projects/${PID}/creative/proposals/${A.id}`)).body; assert.equal(after.rev, before.rev); assert.equal(after.status, 'ready_for_review');
  const list = (await api('GET', `projects/${PID}/creative/proposals`)).body.proposals; assert.equal(list.find(x => x.id === A.id).supersededBy, id);
  assert.equal((await api('POST', `projects/${PID}/creative/proposals/${A.id}/resume`)).status, 409, 'o propunere finală nu se reia');
  setFake({ cu: { delay: { step: 'direction', ms: 2500 } } });
  const run = await startP(PID); const busy = await api('POST', `projects/${PID}/creative/proposals`, {}); assert.equal(busy.status, 409); assert.equal(busy.body.code, 'creative_busy');
  await settle(PID, run);
  setFake({}); const both = await Promise.all([api('POST', `projects/${PID}/creative/proposals`, {}), api('POST', `projects/${PID}/creative/proposals`, {})]);
  assert.deepEqual(both.map(r => r.status).sort(), [200, 409], 'două cereri simultane: exact una pornește'); await settle(PID, both.find(r => r.status === 200).body.id);
  assert.equal((await api('POST', `projects/${PID}/creative/proposals/${A.id}/apply`, {})).status, 404, 'nu există operație de aplicare în acest flux');
});

test('CU doar propunere: proiectul sursă este identic după toate rulările (artefacte, versiuni, decizii, aprobări, stare)', async () => {
  const now = await snapshot(PID);
  assert.deepEqual(now.artifacts, SNAP0.artifacts, 'artefacte și versiuni identice'); assert.deepEqual(now.decisions, SNAP0.decisions, 'nicio decizie nouă');
  assert.deepEqual(now.project, SNAP0.project, 'documentul proiectului identic (aprobări, etape, stare, revizie)'); assert.deepEqual(now.project.approvals || {}, {}, 'nicio aprobare inventată');
  assert.ok((await api('GET', `projects/${PID}/creative/proposals`)).body.proposals.length >= 12);
});

test('CU baseline învechit în timpul rulării → stale_baseline; O3 după reconciliere: constatarea rezolvată nu mai e activă, istoricul rămâne', async () => {
  setFake({ cu: { delay: { step: 'continuity', ms: 4000 } } });
  const seen = mockLog().filter(e => e.kind === 'creative_upgrade:continuity').length, id = await startP(PID);
  await waitFor(async () => mockLog().filter(e => e.kind === 'creative_upgrade:continuity').length > seen || null, { label: 'pasul de continuitate a început' });
  const rep = (await api('GET', `projects/${PID}/reconcile`)).body;
  const ap = await api('POST', `projects/${PID}/reconcile/apply`, { reportHash: rep.hash, choices: { DW01: 'align_to_pages' }, note: 'test O3' }); assert.equal(ap.status, 200, JSON.stringify(ap.body));
  const pr = await settle(PID, id); assert.equal(pr.status, 'stale_baseline'); assert.notEqual(pr.mutation.after, pr.mutation.before);
  /* O3 */
  const canon = (await api('GET', `projects/${PID}/canon`)).body, dec = (await api('GET', `projects/${PID}/decisions`)).body.decisions.find(d => d.kind === 'reconcile');
  assert.ok(!canon.conflicts.some(c => c.id === 'finding:DW01'), 'reconciliată → nu mai este activă');
  const res = canon.resolvedFindings.find(f => f.id === 'finding:DW01'); assert.ok(res, 'istoric accesibil'); assert.equal(res.resolvedBy.decision, dec.id); assert.equal(res.resolvedBy.actor, dec.actor);
  assert.ok((await api('GET', `projects/${PID}`)).body.project.canonFindings.some(f => f.id === 'DW01'), 'reconcilierea nu șterge pista de audit');
  const pj = canon.projections.find(p => p.field === 'series.volumes[0].summary'); assert.notEqual(pj.status, 'verified', 'proiecția neverificată nu este marcată verificată fără evaluare semantică');
  /* baseline-ul vechi este refuzat; o propunere finală veche arată live că e învechită, fără să fie rescrisă */
  const stale = await api('POST', `projects/${PID}/creative/proposals`, { baseline: BASE0.hash }); assert.equal(stale.status, 409); assert.equal(stale.body.code, 'stale_baseline');
  const old = (await api('GET', `projects/${PID}/creative/proposals/${globalThis.CU_A.id}`)).body; assert.equal(old.live.stale, true); assert.equal(old.status, 'ready_for_review');
  const nb = (await api('POST', `projects/${PID}/creative/baselines`)).body; assert.notEqual(nb.hash, BASE0.hash); assert.equal(nb.findings.canonResolved, 1);
});

test('CU interfață: secțiunea din Activitate arată starea, pașii agenților și „doar propunere”, fără încălcări UX (375 și 1440 px)', { skip: !process.env.BROWSER_PATH && 'fără BROWSER_PATH' }, async () => {
  for (const vp of [{ width: 375, height: 812, mobile: true }, { width: 1440, height: 900 }]) {
    const page = await openPage(process.env.BROWSER_PATH, vp);
    try {
      await page.goto(process.env.WP_BASE + `/#/p/${PID}/activity`); await page.waitFor(`!!document.querySelector('#cu-view')`); await new Promise(r => setTimeout(r, 400));
      assert.equal(await page.evaluate(`document.querySelector('#creative-upgrade').dataset.canRun`), 'true');
      const txt = await page.evaluate(`document.querySelector('#creative-upgrade').textContent`); assert.match(txt, /doar propunere/i); assert.match(txt, /Nimic din proiect nu se schimbă/); assert.match(txt, /neevaluată|pașii|KEEP/);
      assert.deepEqual(violations(await page.evaluate(AUDIT)), [], `Activitate cu Creative Upgrade (${vp.width})`);
    } finally { await page.close(); }
  }
  await api('POST', `projects/${PID}/archive`, { archived: true });
});

/* ---------- în proces: validatoare, întrerupere/reluare, proveniența codului ---------- */
async function localProject() {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-cu-')), s = new LocalStorage(path.join(work, 'data')); await s.init(); await applyMigrations(s);
  const repo = new Repo(s); await repo.load(); const buf = fs.readFileSync(ORIGINAL), plan = planMigration(buf), run = await runMigration(repo, s, buf, { planHash: plan.planHash });
  return { work, s, repo, pid: run.projectId };
}
const mockComplete = async prompt => { const { answer } = require('./mocks/bin/claude.cjs'); const a = answer(prompt, JSON.parse(fs.readFileSync(process.env.WP_FAKE_STATE, 'utf8') || '{}')); if (a.fail) throw { code: a.fail === 'auth' ? 'auth' : 'upstream_error', message: 'simulat' }; return a.json; };

test('CU în proces: o rulare „running” rămasă după repornire devine „interrupted” și se reia; furnizor neautentic → blocat', async () => {
  const L = await localProject(); setFake({});
  try {
    const contracts = loadContracts(), base = { repo: L.repo, storage: L.s, complete: mockComplete, roles: () => contracts.roles, skills: () => contracts.skills, isProjectBusy: () => false };
    const off = createUpgradeService({ ...base, checkProvider: async () => ({ configured: true, authentic: false, message: 'neautentificat' }) });
    const b = await off.start(L.pid); await b.done; assert.equal((await off.load(L.pid, b.id)).status, 'blocked_provider');
    const s1 = createUpgradeService({ ...base, checkProvider: async () => ({ configured: true, authentic: true }) });
    const r = await s1.start(L.pid); await r.done; const doc = await s1.load(L.pid, r.id); assert.equal(doc.status, 'ready_for_review');
    /* simulate a crash mid-run: a stored "running" proposal that no process owns any more */
    const crashed = { ...doc, id: 'cucrash0001', status: 'running', finalizedAt: undefined, steps: doc.steps.slice(0, 5).map((s, i) => i < 2 ? s : { ...s, status: 'pending', attempts: [], output: undefined }).concat([{ id: 'final_review', agent: 'editor-critic', status: 'pending', attempts: [] }]), sections: { evaluation: doc.sections.evaluation, direction: doc.sections.direction, ageFit: doc.sections.ageFit, risks: doc.sections.risks, arc: doc.sections.arc, beforeAfter: doc.sections.beforeAfter, observationsImpact: doc.sections.observationsImpact }, decisions: doc.decisions.filter(d => ['direction', 'structure'].includes(d.step)), critique: null, responses: [], finalReview: null, history: [{ at: Date.now(), event: 'created' }] };
    delete crashed.finalizedAt; await L.s.writeJSON(`projects/${L.pid}/creative/proposals/cucrash0001.json`, crashed);
    const s2 = createUpgradeService({ ...base, checkProvider: async () => ({ configured: true, authentic: true }) });
    assert.equal((await s2.load(L.pid, 'cucrash0001')).status, 'interrupted');
    const rr = await s2.resume(L.pid, 'cucrash0001'); await rr.done; const fin = await s2.load(L.pid, 'cucrash0001');
    assert.equal(fin.status, 'ready_for_review'); assert.equal(fin.steps[0].attempts.length, 1, 'pașii terminați nu se refac');
  } finally { fs.rmSync(L.work, { recursive: true, force: true }); }
});

test('CU validatoare: contract, vârstă, volume, protagonist unic, granița rolului, proveniența; 3–4 personaje este doar avertisment', async () => {
  const L = await localProject();
  try {
    const p = L.repo.getProject(L.pid), art = await L.repo.artifacts(L.pid), bp = await L.repo.getBlueprint(L.pid), b = buildBaseline({ project: p, bp, art, decisions: [] });
    const roles = loadContracts().roles, d0 = { element: 'volume:1', decision: 'KEEP', argument: 'a', evidence: ['volume:1'], impact: 'i', scope: { volumes: [1] }, dependencies: [], risk: { level: 'low', note: 'n' } };
    assert.deepEqual(validateDecision(d0, { index: b.index }), []);
    assert.ok(validateDecision({ ...d0, element: 'volume:9' }, { index: b.index }).some(e => e.code === 'UNKNOWN_ELEMENT'));
    assert.ok(validateDecision({ ...d0, evidence: ['inventat'] }, { index: b.index }).some(e => e.code === 'EVIDENCE_REF'));
    assert.ok(validateDecision({ ...d0, decision: 'NEW', element: 'new:volume:1' }, { index: b.index }).some(e => e.code === 'NEW_COLLIDES'));
    assert.ok(validateDecision({ ...d0, element: 'character:milo' }, { index: b.index, allowedKinds: ['volume', 'page_plan'] }).some(e => e.code === 'ROLE_BOUNDARY'), 'Scriitorul nu decide asupra personajelor');
    assert.ok(validateStepOutput('critique', { objections: [], verdict: 'poate', summary: 's' }, { index: b.index, role: roles['editor-critic'], baseline: b }).some(e => e.code === 'VERDICT'));
    assert.ok(validateStepOutput('revision:scriitor', { responses: [], revised: { cast: [] } }, { index: b.index, role: roles.scriitor, baseline: b }).some(e => e.code === 'REVISION_BOUNDARY'));
    const arc = { through_line: 't', volumes: Array.from({ length: 6 }, (_, i) => ({ n: i + 1, premise: 'p', characters: ['a', 'b', 'c', 'd', 'e', 'f'], goal: 'g', obstacle: 'o', discovery: 'd', choice: 'c', consequence: 'c', payoff: 'p', links: [] })) };
    const cast = ['a', 'b', 'c', 'd', 'e', 'f'].map((id, i) => ({ id, name: id, species: 's', personality: 'p', role: i ? 'secondary' : 'main', reason: 'r', volumes: [1, 2, 3, 4, 5, 6] }));
    const pilot = { volume: 1, pages: Array.from({ length: 12 }, (_, i) => ({ n: i + 1, beat: 'b', purpose: 'p', characters: ['a'], turn: { type: 'quiet' } })) };
    const pr = { steps: [{ status: 'done' }], sections: { arc, cast, pilot }, critique: { objections: [] }, finalReview: { verdict: 'accept' }, responses: [], decisions: [], contract: { hash: b.contract.hash, volumes: 6, pagesPerBook: 12 }, target: { ageBand: '3-4' } };
    const v = validateProposal(pr, b, { roles }); assert.ok(v.warnings.some(w => w.code === 'MANY_CHARACTERS'), '6 personaje/volum: avertisment'); assert.ok(!v.errors.some(e => e.code === 'MANY_CHARACTERS'), 'nu validator dur');
    assert.ok(validateProposal({ ...pr, contract: { ...pr.contract, volumes: 5 } }, b).errors.some(e => e.code === 'CONTRACT_CHANGED'));
    assert.ok(validateProposal({ ...pr, target: { ageBand: '5-6' } }, b).errors.some(e => e.code === 'AGE_CHANGED'));
    assert.ok(validateProposal({ ...pr, sections: { ...pr.sections, arc: { ...arc, volumes: arc.volumes.slice(0, 5) } } }, b).errors.some(e => e.code === 'ARC_VOLUMES'));
    assert.ok(validateProposal({ ...pr, sections: { ...pr.sections, cast: cast.map(c => ({ ...c, role: 'main' })) } }, b).errors.some(e => e.code === 'ONE_PROTAGONIST'));
    assert.ok(validateProposal({ ...pr, sections: { ...pr.sections, pilot: { ...pilot, pages: pilot.pages.slice(0, 11) } } }, b).errors.some(e => e.code === 'PILOT_PAGES'));
    assert.ok(validateProposal(pr, b).errors.some(e => e.code === 'NOT_DECIDED'), 'elementele de bază cer decizie explicită');
    assert.ok(validateProposal({ ...pr, mutation: { before: 'a', after: 'b' } }, b).errors.some(e => e.code === 'PROJECT_MUTATED'));
    assert.ok(validateProposal(pr, b, { currentFingerprint: 'altceva' }).errors.some(e => e.code === 'STALE_BASELINE'));
    assert.equal(validateProposal({ ...pr, steps: [{ status: 'pending' }], finalReview: null }, b).structural, 'INCOMPLETE');
  } finally { fs.rmSync(L.work, { recursive: true, force: true }); }
});

test('O3 generic: deschis → activ; rezolvat de o decizie aprobată → nu activ, cu istoric; decizie neaprobată → tot activ; intrarea nu se modifică', () => {
  const findings = [{ id: 'F1', title: 'a' }, { id: 'F2', title: 'b' }, { id: 'F3', title: 'c' }], before = JSON.stringify(findings);
  const decisions = [{ id: 'd1', kind: 'reconcile', state: 'approved', actor: 'operator', at: 2, scope: { conflicts: ['F2'] } }, { id: 'd2', kind: 'reconcile', state: 'rejected', at: 3, scope: { conflicts: ['F3'] } }];
  const s = findingStatus(findings, decisions);
  assert.deepEqual(s.active.map(f => f.id), ['F1', 'F3']); assert.deepEqual(s.resolved.map(f => [f.id, f.resolvedBy.decision]), [['F2', 'd1']]);
  assert.equal(JSON.stringify(findings), before, 'pista de audit nu se modifică');
  const conflicts = canonConflicts({ structure: { volumes: 6 } }, {}, findings, { decisions }).map(c => c.id);
  assert.ok(conflicts.includes('finding:F1') && conflicts.includes('finding:F3') && !conflicts.includes('finding:F2'));
  assert.ok(canonConflicts({ structure: { volumes: 6 } }, {}, findings).map(c => c.id).includes('finding:F2'), 'fără decizii, totul rămâne activ');
});

test('CU proveniența codului: modulul de upgrade nu cheamă nicio operație de scriere a proiectului; nu există rută de aplicare', () => {
  const src = fs.readFileSync(path.join(ROOT, 'server/creative/upgrade.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const w of ['writeArtifact', 'patchArtifact', 'patchProject', 'commitProjectDecision', 'createProject', 'deleteProject', 'saveFile', '.commit(', 'approvals']) assert.ok(!src.includes(w), `nu apare: ${w}`);
  const writes = [...src.matchAll(/storage\.writeJSON\(([^,]+),/g)].map(m => m[1].trim()); assert.ok(writes.length >= 2 && writes.every(w => /^(proposalRel|rel)\b/.test(w)), JSON.stringify(writes));
  const routes = fs.readFileSync(path.join(ROOT, 'server/enterprise-routes.js'), 'utf8'); assert.ok(!/creative\/proposals\/:id\/apply/.test(routes));
  assert.deepEqual(STEPS.filter(s => s.agent).map(s => s.agent).every(a => PERMANENT_IDS.includes(a)), true, 'niciun agent temporar');
  assert.ok(!/projectFingerprint\(.*context/.test(src)); void projectFingerprint;
});
