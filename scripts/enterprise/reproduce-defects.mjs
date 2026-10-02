/**
 * P1-T02 — reproduces the CURRENT defects named by the architecture (not historical v02/v03 findings that
 * the audit records as remedied). Each check returns REPRODUCED / FIXED / INFERRED with the evidence used.
 * Dynamic checks run in a temporary folder with local storage; nothing real is touched.
 *   node scripts/enterprise/reproduce-defects.mjs [--out=docs/enterprise/baseline/DEFECTS.json]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const src = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const lineOf = (f, re) => { const i = src(f).split('\n').findIndex(l => re.test(l)); return i < 0 ? null : `${f}:${i + 1}`; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-defects-'));
process.env.DATA_DIR = path.join(tmp, 'data'); process.env.OUTPUT_DIR = path.join(tmp, 'out'); process.env.STORAGE = 'local'; process.env.DATABASE_URL = '';
const out = [];
const rec = (id, arch, phase, status, evidence, method) => out.push({ id, arch, phase, status, method, evidence });

try {
  const { LocalStorage } = await import('../../server/storage/local.js');
  const storage = new LocalStorage(path.join(tmp, 'data')); await storage.init();

  /* C16: project export v1 omits versions and basedOn */
  {
    const { Repo } = await import('../../server/repo.js'); const { exportProject } = await import('../../server/projectpkg.js'); const { unzip } = await import('../../server/training.js');
    const repo = new Repo(storage); const bp = JSON.parse(src('blueprints/kids-sc.json'));
    await repo.createProject({ id: 'pdefect01', title: 'D', status: 'ready', input: {}, options: {} }, bp);
    await repo.writeArtifact('pdefect01', 'final_0', { v: 1 }); await repo.writeArtifact('pdefect01', 'final_0', { v: 2 }, { basedOn: { ref: 'x' } });
    const zip = fs.readFileSync(await exportProject(repo, storage, repo.getProject('pdefect01')));
    const doc = JSON.parse([...unzip(zip)].find(([k]) => k.endsWith('project.json'))[1].toString());
    const a = doc.artifacts.final_0, lost = a && !('versions' in a) && !('basedOn' in a);
    rec('D-C16', 'C16/G05', 'P2-T05', doc.version === 1 && lost ? 'REPRODUCED' : 'FIXED', [`export format v${doc.version}; artifact keys: ${Object.keys(a || {}).join(',')}`, lineOf('server/projectpkg.js', /artifacts: Object\.fromEntries/)], 'dynamic');
  }
  /* C19: training import creates ACTIVE lessons immediately; deleting the pack does not revoke them */
  {
    const learning = await import('../../server/learning.js'); const training = await import('../../server/training.js'); const { zip } = await import('../../tests/lib.mjs');
    await learning.initLearning(storage, async () => ({})); await (await import('../../server/knowledge/store.js')).initKnowledgeStore(storage); await training.initTraining(storage, learning);
    const pack = zip([{ name: 'training.json', data: JSON.stringify({ id: 'defect-pack', name: 'D', lessons: [{ agent: 'scriitor', text: 'Imported rule must not be active by default.' }] }) }]);
    await training.importPack(pack);
    const active = learning.listLessons().filter(l => l.source === 'training' && l.status === 'active');
    await training.deletePack('defect-pack');
    const after = learning.listLessons().filter(l => l.source === 'training' && l.status === 'active');
    rec('D-C19', 'C19/G11', 'P7-T01', active.length && after.length ? 'REPRODUCED' : 'FIXED', [`active după import: ${active.length}; active după ștergerea packului: ${after.length}`, lineOf('server/training.js', /addManualLesson/)], 'dynamic');
    await learning.flushLearning?.();
  }
  /* C04/P3-T01: unknown agent ID silently falls back to Producător */
  {
    const agents = await import('../../server/agents.js'); await agents.initAgents(storage);
    const a = agents.getAgent('agent-inexistent');
    rec('D-AGENT-FALLBACK', 'OUTPUT-07', 'P3-T01', a?.id === 'producator' ? 'REPRODUCED' : 'FIXED', [`getAgent('agent-inexistent') → ${a?.id ?? null}`, lineOf('server/agents.js', /export const getAgent/)], 'dynamic');
  }
  /* C26: PostgreSQL storage retries known default credentials */
  {
    const { PostgresStorage } = await import('../../server/storage/postgres.js');
    const s = new PostgresStorage({ databaseUrl: 'postgres://op:secret@127.0.0.1:5999/db', dataDir: path.join(tmp, 'pg') }), n = new PostgresStorage({ databaseUrl: 'postgres://op:secret@db.example.com:5999/db', dataDir: path.join(tmp, 'pg2') });
    const c = s.candidates(), cn = n.candidates(); await s.pool.end().catch(() => {}); await n.pool.end().catch(() => {});
    const known = l => l.filter(u => /wonderpages-local|tiparnita-local/.test(u)).length;
    rec('D-C26', 'C26/OUTPUT-26', 'P1-T04', known(cn) ? 'REPRODUCED' : known(c) ? 'MITIGATED' : 'FIXED', [`gazdă din rețea: ${known(cn)} seturi cunoscute; loopback (migrare legacy): ${known(c)}`, lineOf('server/storage/postgres.js', /wonderpages-local/)], 'dynamic');
  }
  /* routes: preview link vs book tab */
  {
    const has = /#\/p\/'\+esc\(S\.cur\)\+'\/preview/.test(src('public/app/ui.js')), alias = /preview: 'book'/.test(src('public/app/core.js'));   // P4-T01: the route registry resolves the alias
    rec('D-ROUTE-PREVIEW', 'OUTPUT-02/23', 'P4-T01', has && !alias ? 'REPRODUCED' : 'FIXED', [lineOf('public/app/ui.js', /\/preview">Verifică macheta/) || 'link absent', alias ? lineOf('public/app/core.js', /preview: 'book'/) : 'fără alias'], 'static');
  }
  /* C11: recursive provider fallback can reset the local wait clock (INFERRED in the architecture) */
  {
    const rec2 = (src('server/engine.js').match(/return await callImage\(E, \{ \.\.\.args, provider:/g) || []).length;
    rec('D-C11', 'C11', 'P3-T04', rec2 >= 2 ? 'INFERRED' : 'FIXED', [`${rec2} apeluri recursive callImage cu alt provider`, lineOf('server/engine.js', /provider: 'canva' \}, label\)/), lineOf('server/engine.js', /provider: 'chatgpt' \}, label\)/)], 'static');
  }
  /* C12: Codex image output discovered by new files / mtime in a shared folder */
  {
    const scan = /out\.set\(f, st\.mtimeMs\)/.test(src('server/codeximage.js')) && !/code: 'ambiguous_output'/.test(src('server/codeximage.js'));
    rec('D-C12', 'C12', 'P3-T04', scan ? 'INFERRED' : 'FIXED', [lineOf('server/codeximage.js', /out\.set\(f, st\.mtimeMs\)/) || 'scan absent'], 'static');
  }
  /* C29: engineer charter says Claude-only; improve.js calls runClaudeCode directly */
  {
    const direct = /await runClaudeCode\(persona \+ prompt/.test(src('server/improve.js'));
    rec('D-C29', 'C29', 'P3-T01/P3-T05/P7-T05', direct ? 'REPRODUCED' : 'FIXED', [lineOf('server/improve.js', /await runClaudeCode\(persona/), lineOf('agents/inginer.md', /text only through the Claude Pro/)], 'static');
  }
  /* C21: Dali add_improvement follows the model result */
  {
    const auto = /add_improvement/.test(src('server/assistant.js'));
    rec('D-C21', 'C21/G14', 'P7-T06', auto ? 'REPRODUCED' : 'FIXED', [lineOf('server/assistant.js', /add_improvement/)], 'static');
  }
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }

const file = path.resolve(ROOT, process.argv.find(x => x.startsWith('--out='))?.slice(6) || 'docs/enterprise/baseline/DEFECTS.json');
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify({ kind: 'wonderpages.defect-reproduction/1', generatedAt: new Date().toISOString(), defects: out }, null, 1));
for (const d of out) console.log(`${d.status.padEnd(10)} ${d.id.padEnd(18)} ${d.phase.padEnd(20)} ${d.evidence.filter(Boolean).join(' · ')}`);
process.exit(0);
