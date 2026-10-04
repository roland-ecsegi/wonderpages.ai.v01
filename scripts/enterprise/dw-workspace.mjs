#!/usr/bin/env node
/**
 * Dinosaur World — the separate Enterprise working project, driven through the REAL application (HTTP API of a local
 * instance on the workspace data; provider mocks on PATH so nothing reaches a real provider).
 *   node scripts/enterprise/dw-workspace.mjs status
 *   node scripts/enterprise/dw-workspace.mjs apply --choices='{"DW01":"align_to_pages","premise":"…"}' --note="…" --label=DW01
 * `apply` migrates the read-only original archive into the workspace when no Enterprise project exists yet, records the
 * full state BEFORE, applies ONLY the given reconciliation choices through POST /reconcile/apply (report hash checked),
 * records the state AFTER, diffs every field of every artifact and of the project, exports the Enterprise package
 * (versions + decisions, previous versions kept) and writes a verification report. It never approves anything else.
 */
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const WS = path.join(ROOT, 'dinosaur-world-enterprise'), DATA = path.join(WS, 'data'), OUT = path.join(WS, 'out');
const ORIGINAL = path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const arg = n => process.argv.find(x => x.startsWith(`--${n}=`))?.split('=').slice(1).join('=');
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });

async function start() {
  fs.mkdirSync(DATA, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
  const port = await freePort(), fake = path.join(os.tmpdir(), `dw-ws-fake-${process.pid}.json`); fs.writeFileSync(fake, '{}');
  const child = spawn(process.execPath, ['server/start.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port), STORAGE: 'local', DATABASE_URL: '', DATA_DIR: DATA, OUTPUT_DIR: OUT, OPEN_BROWSER: '0', WP_BG: '', WP_AUTO_BACKUP: '0', WP_FAKE_STATE: fake, CODEX_HOME: path.join(os.tmpdir(), `dw-ws-codex-${process.pid}`), PATH: path.join(ROOT, 'tests', 'mocks', 'bin') + path.delimiter + process.env.PATH, ANTHROPIC_API_KEY: '', OPENAI_API_KEY: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; child.stdout.on('data', d => { log += d; }); child.stderr.on('data', d => { log += d; });
  const base = `http://127.0.0.1:${port}`, t0 = Date.now();
  while (Date.now() - t0 < 60000) { try { if ((await fetch(base + '/api/state', { headers: { 'x-wp': '1' } })).ok) break; } catch {} if (child.exitCode != null) throw Error(log.slice(-400)); await new Promise(r => setTimeout(r, 300)); }
  const api = async (method, p, body, raw = false) => { const h = { 'x-wp': '1' }; let b = body; if (body !== undefined && !Buffer.isBuffer(body)) { h['content-type'] = 'application/json'; b = JSON.stringify(body); } else if (Buffer.isBuffer(body)) h['content-type'] = 'application/octet-stream'; const r = await fetch(base + p, { method, headers: h, body: b }); if (raw) return r; const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; } if (!r.ok) throw Object.assign(Error(`${method} ${p} → ${r.status}: ${typeof j === 'string' ? j : j.message || JSON.stringify(j)}`), { status: r.status, body: j }); return j; };
  return { api, stop: async () => { child.kill(); await new Promise(r => setTimeout(r, 400)); fs.rmSync(fake, { force: true }); } };
}
async function enterpriseProject(api) {
  const st = await api('GET', '/api/state'); const p = (st.projects || []).find(x => x.source?.kind === 'migration' && /dinosaur/i.test(x.title || ''));
  if (p) return { pid: p.id, migrated: false };
  const buf = fs.readFileSync(ORIGINAL), plan = await api('POST', '/api/migrations/plan', buf), run = await api('POST', `/api/migrations/run?plan=${plan.planHash}`, buf);
  return { pid: run.projectId, migrated: true, migration: { id: run.migrationId, status: run.status, preserved: (run.report?.preserved || []).length, lost: run.report?.lost ?? null } };
}
async function snapshot(api, pid) {
  const d = await api('GET', `/api/projects/${pid}`);
  const art = Object.fromEntries(Object.entries(d.artifacts || {}).map(([k, a]) => [k, { version: a.version, content: a.content }]));
  const { running, log, updatedAt, revision, ...project } = d.project;
  return { project, revision, artifacts: art, decisions: (await api('GET', `/api/projects/${pid}/decisions`).catch(() => ({ decisions: [] }))).decisions || [] };
}
/* every leaf that differs, with its path (arrays by index) */
function diff(a, b, p = '', out = []) {
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[k], b[k], Array.isArray(a) ? `${p}[${k}]` : (p ? `${p}.${k}` : k), out); return out; }
  out.push({ path: p, before: a, after: b }); return out;
}

const cmd = process.argv[2] || 'status';
const srv = await start();
try {
  const originalBefore = sha(fs.readFileSync(ORIGINAL));
  const ep = await enterpriseProject(srv.api), pid = ep.pid;
  if (cmd === 'status') { console.log(JSON.stringify({ pid, ...ep, reconcile: (await srv.api('GET', `/api/projects/${pid}/reconcile`)).conflicts.map(c => c.id), original: originalBefore }, null, 1)); }
  else if (cmd === 'apply') {
    const choices = JSON.parse(arg('choices') || '{}'), label = arg('label') || Object.keys(choices).filter(k => /^DW\d+$/.test(k)).join('+'), note = arg('note') || '';
    const before = await snapshot(srv.api, pid), report = await srv.api('GET', `/api/projects/${pid}/reconcile`);
    const result = await srv.api('POST', `/api/projects/${pid}/reconcile/apply`, { reportHash: report.hash, choices, note });
    const after = await snapshot(srv.api, pid), afterReport = await srv.api('GET', `/api/projects/${pid}/reconcile`);
    const artifactChanges = diff(before.artifacts, after.artifacts), projectChanges = diff(before.project, after.project);
    const newDecisions = after.decisions.filter(d => !before.decisions.some(x => x.id === d.id));
    const versions = Object.fromEntries(Object.keys(after.artifacts).map(k => [k, { before: before.artifacts[k]?.version ?? null, after: after.artifacts[k].version }]));
    const pkgRes = await srv.api('GET', `/api/projects/${pid}/export.zip`, undefined, true); const pkg = Buffer.from(await pkgRes.arrayBuffer());
    fs.mkdirSync(path.join(WS, 'pachet'), { recursive: true }); const pkgFile = path.join(WS, 'pachet', 'dinosaur-world-enterprise.zip'); fs.writeFileSync(pkgFile, pkg);
    const originalAfter = sha(fs.readFileSync(ORIGINAL));
    const rep = { schema: 'wonderpages.dw-decision/1', label, at: new Date().toISOString(), project: pid, migratedNow: ep.migrated, migration: ep.migration || null, choices, note,
      reportBefore: { hash: report.hash, conflicts: report.conflicts.map(c => c.id) }, reportAfter: { hash: afterReport.hash, conflicts: afterReport.conflicts.map(c => c.id) },
      applied: result.applied, decision: newDecisions, artifactChanges, projectChanges, versions,
      approvals: { before: Object.keys(before.project.approvals || {}).length, after: Object.keys(after.project.approvals || {}).length },
      stages: { before: before.project.stages, after: after.project.stages, unchanged: JSON.stringify(before.project.stages) === JSON.stringify(after.project.stages) },
      status: { before: before.project.status, after: after.project.status },
      original: { sha256: originalBefore, unchanged: originalBefore === originalAfter }, package: { file: path.relative(ROOT, pkgFile), sha256: sha(pkg), bytes: pkg.length } };
    fs.writeFileSync(path.join(WS, `${label}-VERIFICARE.json`), JSON.stringify(rep, null, 2) + '\n');
    console.log(JSON.stringify({ label, applied: rep.applied.length, artifactChanges: artifactChanges.map(c => c.path), projectChanges: projectChanges.map(c => c.path), reportAfter: rep.reportAfter.conflicts, decision: newDecisions.map(d => ({ kind: d.kind, state: d.state, scope: d.scope })), approvals: rep.approvals, stagesUnchanged: rep.stages.unchanged, original: rep.original }, null, 1));
  }
} finally { await srv.stop(); }
