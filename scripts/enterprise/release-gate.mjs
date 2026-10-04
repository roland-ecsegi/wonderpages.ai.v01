#!/usr/bin/env node
/**
 * P8-T01 — release gate and provenance evidence.
 *   node scripts/enterprise/release-gate.mjs [--skip-tests] [--out=path]   → exit 1 when a required check fails
 * Required checks: build/lint guard, ProductContract of the shipped type, runtime resources (fonts + measured metrics,
 * shared measuring script, gold set, role contracts), secret sentinel over every file that would ship, and the test
 * suite with explicit mocks (no provider spend). Provider probes are reported SEPARATELY (runtime facts, never a gate).
 * The evidence lists code/schema/policy/tool versions and what actually ran (NOT_RUN is never reported as PASS).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), DEFAULT_ROOT = path.resolve(HERE, '..', '..');
export const RELEASE_INCLUDE = ['.claude', '.env.example', '.gitignore', 'AUDIT.md', 'INSTALARE.md', 'README.md', 'activeaza-retea.bat', 'deschide.vbs', 'docker-compose.yml', 'instaleaza.bat', 'opreste.bat', 'package.json', 'package-lock.json', 'porneste.bat', 'agents', 'blueprints', 'docs', 'public', 'scripts', 'seeds', 'server', 'tests', 'evaluation'];
/** local evidence that is regenerated per machine and never ships */
export const RELEASE_EXCLUDE = /^docs\/enterprise\/baseline\/logs\//;
export const shipped = rel => !RELEASE_EXCLUDE.test(rel);
const SECRET = [/sk-ant-[A-Za-z0-9_-]{16,}/, /sk-(proj-)?[A-Za-z0-9]{32,}/, /-----BEGIN (RSA |OPENSSH |EC |)PRIVATE KEY-----/, /(ANTHROPIC|OPENAI|CANVA|GOOGLE)_[A-Z_]*(KEY|SECRET|TOKEN)\s*=\s*['"]?[A-Za-z0-9_\-]{16,}/, /ghp_[A-Za-z0-9]{30,}/, /xox[bp]-[A-Za-z0-9-]{20,}/, /postgres(ql)?:\/\/[^:\s'"]+:[^@\s'"]{6,}@(?!127\.0\.0\.1|localhost)/];
/* documented fixtures and templates, never real credentials */
const BENIGN = /\$\{|example|placeholder|sk-test-must-be-stripped|SENTINEL-FIXTURE/i;
const FORBIDDEN_NAMES = /(^|\/)(\.env|data|node_modules|\.git|_backup)(\/|$)|\.(pem|key|p12|pfx)$/;
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

function* files(root, rel = '') { for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) { const r = rel ? `${rel}/${e.name}` : e.name; if (!shipped(r)) continue; if (e.isSymbolicLink()) { yield { rel: r, link: true }; continue; } if (e.isDirectory()) yield* files(root, r); else yield { rel: r }; } }
/** Every file that would ship is scanned: forbidden names and secret-looking content stop the release. */
export function secretSentinel(root, include = RELEASE_INCLUDE) {
  const hits = [];
  for (const item of include) {
    const p = path.join(root, item); if (!fs.existsSync(p)) continue;
    const list = fs.statSync(p).isDirectory() ? [...files(root, item)] : [{ rel: item }];
    for (const f of list) {
      if (f.link) { hits.push({ file: f.rel, reason: 'legătură simbolică' }); continue; }
      if (FORBIDDEN_NAMES.test(f.rel) && !f.rel.endsWith('.env.example')) { hits.push({ file: f.rel, reason: 'fișier privat' }); continue; }
      if (/\.(log|part|tmp|bak)$/.test(f.rel) || /(^|\/)\.env\.(?!example$)/.test(f.rel)) { hits.push({ file: f.rel, reason: 'fișier temporar sau de mediu' }); continue; }
      const st = fs.statSync(path.join(root, f.rel)); if (st.size > 8 * 1024 * 1024 || /\.(png|jpg|jpeg|webp|ttf|woff2?|zip|pdf)$/i.test(f.rel)) continue;
      const t = fs.readFileSync(path.join(root, f.rel), 'utf8');
      for (const re of SECRET) { const m = [...t.matchAll(new RegExp(re.source, 'g'))].filter(x => !BENIGN.test(t.slice(x.index, x.index + x[0].length + 48))); if (m.length) { hits.push({ file: f.rel, reason: 'conținut care arată ca un secret (' + re.source.slice(0, 24) + '…)' }); break; } }
    }
  }
  return { ok: !hits.length, hits };
}

/** Digest of exactly what would ship (path + content of every included file): evidence is valid only for these sources. */
export function sourceDigest(root, include = RELEASE_INCLUDE) {
  const rows = [];
  for (const item of include) { const p = path.join(root, item); if (!fs.existsSync(p)) continue; const list = fs.statSync(p).isDirectory() ? [...files(root, item)] : [{ rel: item }]; for (const f of list) rows.push(f.link ? `${f.rel}\0link` : `${f.rel}\0${sha(fs.readFileSync(path.join(root, f.rel)))}`); }
  return { files: rows.length, sha256: sha(rows.sort().join('\n')) };
}

export async function runGate({ root = DEFAULT_ROOT, skipTests = false, env = process.env } = {}) {
  const checks = [], add = (id, required, status, detail) => checks.push({ id, required, status, detail });
  const node = (args, opts = {}) => spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', env: { ...env, ...(opts.env || {}) }, timeout: opts.timeout || 20 * 60e3 });
  /* 1. build / lint guard */
  { const r = node(['scripts/build.mjs']); add('build', true, r.status === 0 ? 'PASS' : 'FAIL', (r.stdout || r.stderr || '').trim().split('\n').slice(-2).join(' ').slice(0, 300)); }
  /* 2. ProductContract of every shipped product type */
  try {
    const { contractFromBlueprint, validateContract } = await import(pathToFileURL(path.join(root, 'server/domain/product-contract.js')).href + `?gate=${Date.now()}`);
    const bad = [];
    for (const f of fs.readdirSync(path.join(root, 'blueprints')).filter(x => x.endsWith('.json'))) { const v = validateContract(contractFromBlueprint(JSON.parse(fs.readFileSync(path.join(root, 'blueprints', f), 'utf8')))); if (!v.valid) bad.push(`${f}: ${v.errors.map(e => e.code).join(',')}`); }
    add('contract', true, bad.length ? 'FAIL' : 'PASS', bad.length ? bad.join('; ') : 'ProductContract valid (6×2×12, vârste, ediții)');
  } catch (e) { add('contract', true, 'FAIL', 'Contractul nu se poate evalua: ' + (e.message || e)); }
  /* 3. runtime resources */
  {
    const missing = ['public/fonts/Andika-Regular.ttf', 'public/fonts/Andika-Bold.ttf', 'public/fonts/andika-metrics.json', 'public/app/layout-measure.js', 'evaluation/gold/gold-v1.json', 'agents/contracts/role-contracts.json', 'agents/contracts/skills.json', 'tests/run.mjs'].filter(f => !fs.existsSync(path.join(root, f)));
    let stale = [];
    if (!missing.length) { try { const { loadMetrics } = await import(pathToFileURL(path.join(root, 'server/domain/font-metrics.js')).href + `?gate=${Date.now()}`); stale = loadMetrics(root).problems.map(p => p.code); } catch (e) { stale = ['metrics: ' + e.message]; } }
    add('resources', true, missing.length || stale.length ? 'FAIL' : 'PASS', missing.length ? 'Lipsesc: ' + missing.join(', ') : stale.length ? 'Fontul/metricile: ' + stale.join(', ') : 'fonturi + metrici măsurate, cod de măsurare, set de aur, contracte de rol, suita de teste');
  }
  /* 4. secret sentinel over everything that ships */
  { const s = secretSentinel(root); add('secrets', true, s.ok ? 'PASS' : 'FAIL', s.ok ? 'niciun secret sau fișier privat în release' : s.hits.slice(0, 5).map(h => `${h.file}: ${h.reason}`).join('; ')); }
  /* 5. test suite with explicit mocks (real PDF when a browser exists) */
  if (skipTests) add('tests', true, 'NOT_RUN', 'rulare fără suită (--skip-tests): nu este un release valid');
  else { const r = node(['tests/run.mjs'], { timeout: 40 * 60e3 }); const sum = (r.stdout || '').match(/(\d+) trecute, (\d+) picate/); add('tests', true, r.status === 0 ? 'PASS' : 'FAIL', sum ? `${sum[1]} trecute, ${sum[2]} picate${env.BROWSER_PATH ? ', PDF real din browser' : ''}` : (r.stderr || r.stdout || '').trim().split('\n').slice(-3).join(' ').slice(0, 300)); }
  /* provider probes: runtime facts, reported separately, never required */
  const providers = { claude: spawnSync(process.platform === 'win32' ? 'where' : 'which', ['claude']).status === 0 ? 'installed' : 'absent', codex: spawnSync(process.platform === 'win32' ? 'where' : 'which', ['codex']).status === 0 ? 'installed' : 'absent', note: 'Probele reale ale furnizorilor rulează în aplicație (Setări › Diagnostic), separat de release; nicio cheltuială per commit.' };
  const versions = await versionsOf(root), source = sourceDigest(root);
  const required = checks.filter(c => c.required), ok = required.every(c => c.status === 'PASS');
  return { schema: 'wonderpages.release-evidence/1', at: new Date().toISOString(), ok, status: ok ? 'PASS' : required.some(c => c.status === 'FAIL') ? 'FAIL' : 'INCOMPLETE', checks, providers, versions, source };
}

export async function versionsOf(root) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')), git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  const imp = async f => { try { return await import(pathToFileURL(path.join(root, f)).href); } catch { return {}; } };
  const [safety, quality, coloring, inspect, ready, layout, prof, exp, eff, know, rc, mig, fm, evq, dec] = await Promise.all(['server/quality/safety.js', 'server/quality/assessment.js', 'server/quality/coloring.js', 'server/inspection/pdf-inspect.js', 'server/quality/readiness.js', 'server/domain/layout.js', 'server/printprofile.js', 'server/knowledge/experience.js', 'server/knowledge/effectiveness.js', 'server/knowledge/store.js', 'server/domain/release-candidate.js', 'server/persistence/migrations.js', 'server/domain/font-metrics.js', 'server/quality/evaluation.js', 'server/domain/decisions.js'].map(imp));
  const types = fs.readdirSync(path.join(root, 'blueprints')).filter(x => x.endsWith('.json')).map(f => { const b = JSON.parse(fs.readFileSync(path.join(root, 'blueprints', f), 'utf8')); return { slug: b.slug, version: b.version, sha256: sha(fs.readFileSync(path.join(root, 'blueprints', f))).slice(0, 16) }; });
  return { code: { commit: git.status === 0 ? git.stdout.trim() : null, version: pkg.version, edition: pkg.edition }, productTypes: types,
    schemas: { contract: 'wonderpages.product-contract/1', layout: layout.LAYOUT_SCHEMA || null, readiness: ready.READINESS_VERSION || null, coloringQA: coloring.COLORING_QA_VERSION || null, pdfInspection: inspect.INSPECT_VERSION || null, knowledge: know.KNOWLEDGE_SCHEMA || null, releaseCandidate: rc.RC_SCHEMA || null, database: mig.SCHEMA_VERSION ?? null, fontMetrics: fm.METRICS_SCHEMA || null, decisions: dec.DECISION_SCHEMA || null },
    policies: { safety: safety.SAFETY_POLICY?.version ?? null, qualityActive: Object.values(quality.QUALITY_POLICIES || {}).find(p => p.status === 'active')?.version ?? null, printRules: prof.PROFILE_RULES ? { version: prof.PROFILE_RULES.version, recordedAt: prof.PROFILE_RULES.recordedAt } : null, maturityCriteria: exp.MATURITY_CRITERIA?.version ?? null, effectiveness: eff.EFFECT_VERSION ?? null, evaluator: evq.EVALUATOR_VERSION ?? null, goldSet: (() => { try { const g = JSON.parse(fs.readFileSync(path.join(root, 'evaluation/gold/gold-v1.json'), 'utf8')); return { version: g.version ?? 'gold-v1', cases: (g.cases || []).length }; } catch { return null; } })() },
    tools: { node: process.version, npm: spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--version'], { encoding: 'utf8' }).stdout?.trim() || null, dependencies: pkg.dependencies, testedWith: pkg.testedWith || null } };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const out = process.argv.find(x => x.startsWith('--out='))?.slice(6);
  const ev = await runGate({ skipTests: process.argv.includes('--skip-tests') });
  if (out) fs.writeFileSync(path.resolve(out), JSON.stringify(ev, null, 2));
  for (const c of ev.checks) console.log(`${c.status.padEnd(8)} ${c.id.padEnd(10)} ${c.detail}`);
  console.log(`${ev.status} — commit ${ev.versions.code.commit?.slice(0, 10) || '?'}; furnizori (separat): claude ${ev.providers.claude}, codex ${ev.providers.codex}`);
  process.exit(ev.ok ? 0 : 1);
}
