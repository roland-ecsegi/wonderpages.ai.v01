#!/usr/bin/env node
/**
 * WonderPages Project Brain — Context Integrity Gate and maintenance tooling.
 *
 *   node brain/tools/brain.mjs gate [--json] [--allow-dirty]   BOOT gate: CONTEXT_INTEGRITY = PASS | FAIL (exit 0 | 1)
 *   node brain/tools/brain.mjs status                          which subsystems changed since the last seal
 *   node brain/tools/brain.mjs index                           regenerate the derived indexes (decisions, accidents, dependencies, agents)
 *   node brain/tools/brain.mjs render                          regenerate brain/state/CURRENT-STATE.md from the JSON state
 *   node brain/tools/brain.mjs acceptance                      check that the active phase's completion evidence describes the tested
 *                                                              candidate commit and that only evidence files changed after it
 *   node brain/tools/brain.mjs seal --review=<subsystem>:<note> [...] [--initial]
 *                                                              record that the brain was reviewed against every changed subsystem
 *
 * Fail-closed: any missing source, broken anchor, hash/tree mismatch, stale subsystem, contradiction, unknown phase,
 * ambiguous next step, missing decision or incomplete coverage gives CONTEXT_INTEGRITY = FAIL and WORK NOT AUTHORIZED.
 * The gate reads only the repository (git index + files). It never imports application code and never contacts the network.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { BRAIN_ROOT, sha256, canon, canonHash, git, indexEntries, globToRe, readJSON, readText, exists, writeJSON, verifyChain, readJSONL } from './lib.mjs';

export const FILES = Object.freeze({
  state: 'brain/state/CURRENT-STATE.json', stateMd: 'brain/state/CURRENT-STATE.md', phase: 'brain/phase/ACTIVE-PHASE.json', phases: 'brain/phase/PHASES.json',
  subsystems: 'brain/map/SUBSYSTEMS.json', sources: 'brain/manifest/SOURCES.json', seal: 'brain/evidence/SEAL.json', sealLog: 'brain/evidence/SEAL-LOG.jsonl',
  decisions: 'brain/ledger/DECISIONS.json', accidents: 'brain/ledger/ACCIDENTS.json', dependencies: 'brain/ledger/DEPENDENCIES.json', agents: 'brain/map/AGENTS.json',
  ledger: 'evaluation/gold-v2-policy/decisions.jsonl', closure: 'docs/enterprise/records/GOLD-V2-POLICY-CLOSURE.md', roles: 'agents/contracts/role-contracts.json'
});
const SEAL_EXCLUDED = new Set([FILES.seal, FILES.sealLog]);
const BRIDGE_NAME = 'wonderpages.agent-bridge';
const ISOLATION_ALLOWED = ['CLAUDE.md', 'brain/**', '.github/workflows/bridge-sync.yml'];
/** Paths cited in brain documents that are NOT in this repository by design: Agent Bridge paths and ignored local directories. */
const EXTERNAL_PREFIXES = ['mirror/', 'exchange/', 'audit/', 'schemas/', 'ingress/', 'tools/bridge.mjs', 'data/', 'node_modules'];

/* ------------------------------------------------------------------ derived indexes (from canonical sources) */

export function deriveIndexes(root = BRAIN_ROOT) {
  const closure = readText(FILES.closure, root), ledger = readJSONL(FILES.ledger, root);
  const section = (from, to) => { const a = closure.indexOf(from), b = closure.indexOf(to, a + 1); if (a < 0 || b < 0) throw new Error(`closure section not found: ${from}`); return closure.slice(a, b); };
  const s1 = section('## 1. Starea D-01…D-22', '## 2. '), s2 = section('## 2. Commit-ul fiecărei decizii', '## 3. ');
  const topics = Object.fromEntries([...s1.matchAll(/^\| (D-\d\d) \| ([^|]+) \| ([^|]+) \| `([0-9a-f]{16})` \|$/gm)].map(m => [m[1], { topic: m[2].trim(), option: m[3].trim(), hash16: m[4] }]));
  const commits = {}; for (const m of s2.matchAll(/(D-\d\d) \| `([0-9a-f]{7,40})`/g)) commits[m[1]] = m[2];
  const decisions = ledger.map(e => ({ id: e.decision, outcome: e.outcome ?? null, entryHash: e.hash, topic: topics[e.decision]?.topic ?? null, option: topics[e.decision]?.option ?? null, closureHash16: topics[e.decision]?.hash16 ?? null, commit: commits[e.decision] ?? null }));
  const s8 = section('## 8. Accidente', '## 9. ');
  let area = null; const accidents = [];
  for (const line of s8.split('\n')) { const h = line.match(/^\*\*(.+)\*\*$/); if (h) area = h[1]; const m = line.match(/^\| (A-\d\d) \| (.+) \| ([^|]+) \|$/); if (m) accidents.push({ id: m[1], area, decisions: m[3].split(',').map(x => x.trim()), label: m[2].replace(/\*\*/g, '').slice(0, 110) }); }
  const s10 = section('## 10. Dependențe rămase', '## 11. '), cut = s10.indexOf('**Rezolvate');
  const ids = t => [...new Set([...t.matchAll(/D-\d\d-DEP-[A-Z0-9-]*[A-Z0-9]/g)].map(m => m[0]))];
  const dependencies = { open: ids(s10.slice(0, cut)), resolved: ids(s10.slice(cut)) };
  const roles = JSON.parse(readText(FILES.roles, root)).roles;
  const front = id => { const t = readText(`agents/${id}.md`, root), fm = t.slice(0, t.indexOf('\n---', 3)); const g = k => (fm.match(new RegExp(`^${k}:\\s*(.+)$`, 'm')) || [])[1]?.trim() ?? null; return { name: g('name'), model: g('model'), charter: g('charter') }; };
  const agents = roles.map(r => { const f = front(r.id); return { id: r.id, name: r.name, mission: r.mission, ownedSkills: r.ownedSkills, defaultModelBinding: { model: f.model, provider: f.model === 'gpt-6-sol' ? 'codex (ChatGPT plan)' : 'claude-code (Claude Pro)' }, personaFile: `agents/${r.id}.md` }; });
  const roleContracts = JSON.parse(readText(FILES.roles, root));
  return {
    decisions: { schema: 'wonderpages.brain.decisions-index/1', derivedFrom: [FILES.ledger, FILES.closure], authority: 'The verbatim operator statement in the ledger is authoritative; this is an index.', count: decisions.length, head: ledger.at(-1)?.hash ?? null, decisions },
    accidents: { schema: 'wonderpages.brain.accidents-index/1', derivedFrom: [FILES.closure + ' §8'], count: accidents.length, accidents },
    dependencies: { schema: 'wonderpages.brain.dependencies-index/1', derivedFrom: [FILES.closure + ' §10'], rule: 'Open dependencies are NOT to be resolved without an explicit operator decision.', counts: { open: dependencies.open.length, resolved: dependencies.resolved.length }, ...dependencies },
    agents: { schema: 'wonderpages.brain.agents-index/1', derivedFrom: [FILES.roles, 'agents/*.md', 'docs/enterprise/contracts/AGENT-REGISTRY.md'], roleContractVersion: roleContracts.version, rule: 'Identity (RoleContract + persona) and ModelBinding are separate: changing the model never changes the identity. Default bindings come from the persona front-matter; the live binding is runtime state (AgentProfile).', count: agents.length, agents }
  };
}

/* ------------------------------------------------------------------ rendering */

export function renderState(root = BRAIN_ROOT) {
  const s = readJSON(FILES.state, root), p = readJSON(FILES.phase, root), claims = Object.fromEntries(readJSON(FILES.sources, root).claims.map(c => [c.id, c]));
  const src = ids => ids.map(id => `${id} → ${[...new Set((claims[id]?.sources || []).map(x => '`' + x.path + '`'))].join(', ')}`).join('; ');
  const assertsFor = key => Object.values(claims).filter(c => c.asserts?.key === key).map(c => c.id);
  const rows = (obj, prefix) => Object.entries(obj).map(([k, v]) => `| ${k} | ${v} | ${src(assertsFor(`${prefix}.${k}`))} |`).join('\n');
  return `<!-- GENERATED by \`node brain/tools/brain.mjs render\` from CURRENT-STATE.json — do not edit by hand; the gate fails if it is out of date. -->
# WonderPages — Current State

As of ${s.asOf.date} · functional checkpoint \`${s.asOf.checkpointCommit}\` · last decision commit \`${s.asOf.lastDecisionCommit}\`
Repository \`${s.repository.name}\` · branch \`${s.repository.branch}\` · ${s.repository.visibility}

**ACTIVE PHASE:** \`${s.activePhase}\` — ${p.title} (${p.status})
**NEXT_AUTHORIZED_STEP:** ${s.nextAuthorizedStep} — ${p.nextAuthorizedStep.summary}

> Run \`node brain/tools/brain.mjs gate\` before relying on anything below. Every row names its authoritative source; if this view
> and the source differ, the source wins and the gate must fail.

## Goal
${s.goal.summary}
Sources: ${src(s.goal.claims)}

## Phases P1–P9
| Phase | Status | Source |
|---|---|---|
${rows(s.phases, 'phases')}

## Programmes after P8
| Programme | Status | Source |
|---|---|---|
${rows(s.programmes, 'programmes')}

## Key statuses
| Item | Status | Source |
|---|---|---|
${rows(s.statuses, 'statuses')}

## Blockers
${s.blockers.map(b => `- **${b.id}** — ${b.what} (${b.claims.join(', ')})`).join('\n')}

## Awaiting the operator
${s.awaitingOperator.map(x => `- ${x}`).join('\n')}

## Forbidden in the active phase
${p.forbidden.map(x => `- ${x}`).join('\n')}
`;
}

/* ------------------------------------------------------------------ seal */

export function subsystemDigests(root = BRAIN_ROOT) {
  const subs = readJSON(FILES.subsystems, root).subsystems.map(s => ({ ...s, res: s.globs.map(globToRe) }));
  const by = Object.fromEntries(subs.map(s => [s.id, []])), unmatched = [];
  for (const e of indexEntries(root)) { if (SEAL_EXCLUDED.has(e.path)) continue; const s = subs.find(x => x.res.some(r => r.test(e.path))); if (!s) unmatched.push(e.path); else by[s.id].push([e.path, e.mode, e.blob]); }
  const digests = Object.fromEntries(Object.entries(by).map(([id, rows]) => [id, { files: rows.length, digest: canonHash(rows) }]));
  return { digests, unmatched, total: canonHash(digests) };
}

export function seal(root = BRAIN_ROOT, { reviews = {}, initial = false, now = new Date().toISOString() } = {}) {
  const cur = subsystemDigests(root);
  if (cur.unmatched.length) throw new Error(`coverage incomplete — map these files in ${FILES.subsystems} first: ${cur.unmatched.join(', ')}`);
  const prev = exists(FILES.seal, root) ? readJSON(FILES.seal, root) : null;
  const changed = Object.keys(cur.digests).filter(id => !prev || prev.subsystems[id]?.digest !== cur.digests[id].digest);
  if (!initial) { const missing = changed.filter(id => !reviews[id]); if (missing.length) throw new Error(`review note required for every changed subsystem: ${missing.join(', ')}  (use --review=<id>:<what was checked/updated in the brain>)`); }
  const log = readJSONL(FILES.sealLog, root), chain = verifyChain(log); if (!chain.ok) throw new Error('seal log chain broken: ' + chain.errors.join('; '));
  const head = git(['rev-parse', 'HEAD'], { cwd: root }).trim();
  const sealDoc = { schema: 'wonderpages.brain.seal/1', sealedAt: now, baseCommit: head, note: 'Digests are over the git index (path, mode, blob id) of every tracked file except the two seal files. Seal = the brain was reviewed against this exact tree.', subsystems: cur.digests, total: cur.total };
  const entry = { seq: log.length + 1, at: now, baseCommit: head, total: cur.total, changed, reviews: initial ? Object.fromEntries(changed.map(id => [id, reviews[id] || 'initial seal'])) : Object.fromEntries(changed.map(id => [id, reviews[id]])), prevHash: chain.head };
  entry.hash = canonHash(entry);
  writeJSON(path.join(root, FILES.seal), sealDoc);
  fs.appendFileSync(path.join(root, FILES.sealLog), JSON.stringify(entry) + '\n');
  return { changed, total: cur.total, seq: entry.seq };
}

/* ------------------------------------------------------------------ gate */

const getPath = (o, key) => key.split('.').reduce((v, k) => (v == null ? undefined : v[k]), o);

export function runGate(root = BRAIN_ROOT, { allowDirty = false, env = process.env } = {}) {
  const checks = [], read = new Map();
  const add = (id, status, detail, items = []) => checks.push({ id, status, detail, ...(items.length ? { items: items.slice(0, 40), more: Math.max(0, items.length - 40) } : {}) });
  const load = rel => { const t = readText(rel, root); read.set(rel, sha256(Buffer.from(t, 'utf8')).slice(0, 16)); return t; };
  const J = rel => JSON.parse(load(rel));
  let state, phase, phases, subsystemsDoc, sources;

  /* G01 repository identity */
  try {
    const top = git(['rev-parse', '--show-toplevel'], { cwd: root }).trim(), pkg = JSON.parse(load('package.json'));
    state = J(FILES.state);
    const lineage = git(['merge-base', '--is-ancestor', state.repository.lineageCommit, 'HEAD'], { cwd: root, allowFail: true }) !== null;
    const shallow = git(['rev-parse', '--is-shallow-repository'], { cwd: root }).trim() === 'true';
    const remote = (git(['remote', 'get-url', 'origin'], { cwd: root, allowFail: true }) || '').trim();
    const remoteOk = !remote || remote.replace(/\.git$/, '').endsWith(state.repository.name) || remote.includes(state.repository.name.split('/')[1]);
    const ok = pkg.name === 'wonderpages-ai' && path.resolve(top) === path.resolve(root) && remoteOk && (lineage || shallow);
    add('G01-repository-identity', ok ? (lineage ? 'PASS' : 'WARN') : 'FAIL', `package ${pkg.name}@${pkg.version}; origin ${remote ? remote.replace(/^.*@/, '') : '(none)'}; lineage ${state.repository.lineageCommit} ${lineage ? 'is ancestor' : shallow ? 'unverifiable (shallow clone)' : 'MISSING'}`);
  } catch (e) { add('G01-repository-identity', 'FAIL', String(e.message || e)); }

  /* G02 brain files load */
  try {
    phase = J(FILES.phase); phases = J(FILES.phases); subsystemsDoc = J(FILES.subsystems); sources = J(FILES.sources);
    const schemas = { [FILES.state]: state?.schema, [FILES.phase]: phase.schema, [FILES.phases]: phases.schema, [FILES.subsystems]: subsystemsDoc.schema, [FILES.sources]: sources.schema };
    const bad = Object.entries(schemas).filter(([, s]) => !/^wonderpages\.brain\./.test(s || '')).map(([f]) => f);
    for (const f of ['CLAUDE.md', 'brain/README.md', 'brain/BOOTSTRAP.md', 'brain/CONTINUITY.md', 'brain/BRIDGE.md', 'brain/map/SYSTEM-MAP.md', FILES.stateMd]) if (!exists(f, root)) bad.push(`${f} missing`); else load(f);
    add('G02-brain-loaded', bad.length ? 'FAIL' : 'PASS', bad.length ? 'missing or invalid brain files' : 'state, phase contract, phase registry, subsystem map, sources manifest and navigation documents loaded', bad);
  } catch (e) { add('G02-brain-loaded', 'FAIL', String(e.message || e)); }

  /* G03 branch / checkpoint state */
  try {
    let branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root }).trim(); if (branch === 'HEAD') branch = env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME || '(detached)';
    const head = git(['rev-parse', 'HEAD'], { cwd: root }).trim(), shallow = git(['rev-parse', '--is-shallow-repository'], { cwd: root }).trim() === 'true';
    const anc = c => git(['merge-base', '--is-ancestor', c, 'HEAD'], { cwd: root, allowFail: true }) !== null;
    const need = [state.asOf.checkpointCommit, state.asOf.lastDecisionCommit], missing = need.filter(c => !anc(c));
    const status = missing.length ? (shallow ? 'WARN' : 'FAIL') : branch === state.repository.branch ? 'PASS' : 'WARN';
    add('G03-branch-checkpoint', status, `branch ${branch}${branch === state.repository.branch ? '' : ` (expected ${state.repository.branch})`}; HEAD ${head.slice(0, 12)}; checkpoint ${need.join(', ')} ${missing.length ? 'NOT ancestors: ' + missing.join(', ') : 'are ancestors of HEAD'}`);
  } catch (e) { add('G03-branch-checkpoint', 'FAIL', String(e.message || e)); }

  /* G04 clean working tree (the gate reasons about the git index) */
  try {
    const dirty = git(['status', '--porcelain', '--untracked-files=no'], { cwd: root }).split('\n').filter(Boolean);
    const untracked = git(['ls-files', '--others', '--exclude-standard'], { cwd: root }).split('\n').filter(Boolean);
    add('G04-working-tree', dirty.length ? (allowDirty ? 'WARN' : 'FAIL') : untracked.length ? 'WARN' : 'PASS', dirty.length ? `${dirty.length} uncommitted change(s) to tracked files${allowDirty ? ' (allowed by --allow-dirty)' : ''}` : untracked.length ? `${untracked.length} untracked file(s) — not canonical, not covered` : 'clean', [...dirty, ...untracked.map(u => '?? ' + u)]);
  } catch (e) { add('G04-working-tree', 'FAIL', String(e.message || e)); }

  /* G05 coverage */
  let cur = null;
  try {
    cur = subsystemDigests(root);
    const empty = Object.entries(cur.digests).filter(([, d]) => d.files === 0).map(([id]) => id);
    const missingAuth = subsystemsDoc.subsystems.flatMap(s => (s.authoritative || []).filter(f => !exists(f, root)).map(f => `${s.id}: ${f}`));
    const n = Object.values(cur.digests).reduce((a, d) => a + d.files, 0);
    const bad = [...cur.unmatched.map(f => 'unmapped: ' + f), ...empty.map(id => 'subsystem without files: ' + id), ...missingAuth.map(x => 'authoritative source missing: ' + x)];
    add('G05-coverage', bad.length ? 'FAIL' : 'PASS', bad.length ? 'knowledge coverage incomplete' : `${n} tracked files (+ 2 seal files) mapped to ${Object.keys(cur.digests).length} subsystems; 0 unmapped`, bad);
  } catch (e) { add('G05-coverage', 'FAIL', String(e.message || e)); }

  /* G06 freshness: seal + seal log */
  try {
    const sealDoc = J(FILES.seal), log = readJSONL(FILES.sealLog, root), chain = verifyChain(log), last = log.at(-1);
    const stale = cur ? Object.keys({ ...cur.digests, ...sealDoc.subsystems }).filter(id => sealDoc.subsystems[id]?.digest !== cur.digests[id]?.digest) : ['(coverage failed)'];
    const problems = [...(chain.ok ? [] : chain.errors.map(e => 'seal log: ' + e)), ...(last && last.total === sealDoc.total && last.baseCommit === sealDoc.baseCommit ? [] : ['SEAL.json does not match the last seal-log entry']), ...stale.map(id => `STALE subsystem: ${id} changed since the seal of ${sealDoc.sealedAt} (${sealDoc.baseCommit.slice(0, 12)})`)];
    add('G06-freshness-seal', problems.length ? 'FAIL' : 'PASS', problems.length ? 'brain is stale or its seal is invalid — review the changed subsystems, update the brain, then reseal' : `all ${Object.keys(sealDoc.subsystems).length} subsystem digests equal the seal #${last.seq} of ${sealDoc.sealedAt} (base ${sealDoc.baseCommit.slice(0, 12)}); seal log chain intact (${log.length} entries)`, problems);
  } catch (e) { add('G06-freshness-seal', 'FAIL', String(e.message || e)); }

  /* G07 sources: every claim's anchors exist in tracked files */
  try {
    const tracked = new Set(indexEntries(root).map(e => e.path)), vocab = new Set(sources.statusVocabulary), bad = []; let anchors = 0;
    const ids = new Set();
    for (const c of sources.claims) {
      if (ids.has(c.id)) bad.push(`${c.id}: duplicate id`); ids.add(c.id);
      if (!vocab.has(c.status)) bad.push(`${c.id}: unknown status ${c.status}`);
      if (!c.sources?.length) bad.push(`${c.id}: no source`);
      for (const s of c.sources || []) {
        if (!tracked.has(s.path) || !exists(s.path, root)) { bad.push(`${c.id}: source missing ${s.path}`); continue; }
        const t = load(s.path);
        for (const a of s.anchors) { anchors++; if (!t.includes(a)) bad.push(`${c.id}: anchor not found in ${s.path}: «${a.slice(0, 70)}»`); }
      }
    }
    add('G07-sources-anchors', bad.length ? 'FAIL' : 'PASS', bad.length ? 'claims without verifiable source' : `${sources.claims.length} claims, ${anchors} anchors verified in ${new Set(sources.claims.flatMap(c => c.sources.map(s => s.path))).size} source files`, bad);
  } catch (e) { add('G07-sources-anchors', 'FAIL', String(e.message || e)); }

  /* G08 decisions: ledger chain + derived indexes equal the committed ones */
  try {
    const ledger = readJSONL(FILES.ledger, root); load(FILES.ledger); load(FILES.closure);
    const chain = verifyChain(ledger), bad = [];
    if (!chain.ok) bad.push(...chain.errors.map(e => 'ledger ' + e));
    for (const e of ledger) if (e.statementSha256 !== sha256(Buffer.from(e.statement, 'utf8'))) bad.push(`${e.decision}: statementSha256`);
    const want = Array.from({ length: 22 }, (_, i) => 'D-' + String(i + 1).padStart(2, '0')), got = ledger.map(e => e.decision);
    if (canon(want) !== canon(got)) bad.push(`ledger decisions ${got.join(',')} ≠ D-01…D-22`);
    const derived = deriveIndexes(root);
    for (const d of derived.decisions.decisions) { if (!d.commit) bad.push(`${d.id}: no commit in closure §2`); if (d.closureHash16 !== d.entryHash.slice(0, 16)) bad.push(`${d.id}: closure §1 hash ${d.closureHash16} ≠ ledger ${d.entryHash.slice(0, 16)}`); }
    const shallow = git(['rev-parse', '--is-shallow-repository'], { cwd: root }).trim() === 'true', unverifiable = [];
    for (const d of derived.decisions.decisions) if (d.commit && git(['cat-file', '-e', d.commit + '^{commit}'], { cwd: root, allowFail: true }) === null) (shallow ? unverifiable : bad).push(`${d.id}: commit ${d.commit} not in repository`);
    for (const [k, f] of [['decisions', FILES.decisions], ['accidents', FILES.accidents], ['dependencies', FILES.dependencies], ['agents', FILES.agents]]) { if (!exists(f, root)) { bad.push(`${f} missing (run brain.mjs index)`); continue; } if (canon(J(f)) !== canon(derived[k])) bad.push(`${f} differs from its canonical sources (run brain.mjs index, review, reseal)`); }
    if (derived.accidents.count !== 30) bad.push(`accidents ${derived.accidents.count} ≠ 30`);
    if (derived.agents.count !== 11) bad.push(`agents ${derived.agents.count} ≠ 11`);
    if (state && state.asOf && derived.decisions.head !== ledger.at(-1)?.hash) bad.push('ledger head mismatch');
    add('G08-decisions-ledger', bad.length ? 'FAIL' : unverifiable.length ? 'WARN' : 'PASS', bad.length ? 'decision registry inconsistent' : `ledger 22/22 D-01…D-22, chain intact, head ${chain.head.slice(0, 16)}; closure tables agree; ${derived.accidents.count} accidents, ${derived.dependencies.counts.open} open / ${derived.dependencies.counts.resolved} resolved dependencies, ${derived.agents.count} agents indexed${unverifiable.length ? `; ${unverifiable.length} decision commits unverifiable in shallow clone` : ''}`, [...bad, ...unverifiable]);
  } catch (e) { add('G08-decisions-ledger', 'FAIL', String(e.message || e)); }

  /* G09 state consistency, phase, next step, contradictions */
  try {
    const bad = [], claims = Object.fromEntries(sources.claims.map(c => [c.id, c]));
    const active = phases.phases.filter(p => p.state === 'ACTIVE');
    if (active.length !== 1) bad.push(`${active.length} ACTIVE phases in the registry (exactly 1 required)`);
    if (!phases.phases.some(p => p.id === phase.id)) bad.push(`UNKNOWN phase ${phase.id}`);
    if (active[0]?.id !== phase.id) bad.push(`ACTIVE-PHASE ${phase.id} ≠ registry ACTIVE ${active[0]?.id}`);
    if (state.activePhase !== phase.id) bad.push(`CURRENT-STATE.activePhase ${state.activePhase} ≠ ACTIVE-PHASE ${phase.id}`);
    if (!['IN_PROGRESS', 'COMPLETE_AWAITING_OPERATOR_REVIEW'].includes(phase.status)) bad.push(`unknown phase status ${phase.status}`);
    const auth = active[0]?.authorization; if (!auth || !exists(auth, root)) bad.push('active phase has no recorded operator authorization');
    else if (phase.authorizedBy?.instructionSha256 !== sha256(fs.readFileSync(path.join(root, auth)))) bad.push('authorization text hash ≠ ACTIVE-PHASE.authorizedBy.instructionSha256');
    const next = phase.nextAuthorizedStep?.id; if (!next) bad.push('no next authorized step');
    if (state.nextAuthorizedStep !== next) bad.push(`next step: CURRENT-STATE ${state.nextAuthorizedStep} ≠ ACTIVE-PHASE ${next}`);
    const markers = new Set();
    for (const e of indexEntries(root)) if ((e.path.startsWith('brain/') || e.path === 'CLAUDE.md') && e.path.endsWith('.md')) for (const m of readText(e.path, root).matchAll(/NEXT_AUTHORIZED_STEP:\*{0,2}\s*`?([A-Z0-9-]+)/g)) markers.add(`${m[1]}`);
    if (markers.size > 1 || (markers.size === 1 && !markers.has(next))) bad.push(`incompatible NEXT_AUTHORIZED_STEP markers: ${[...markers].join(', ')} (canonical ${next})`);
    const asserted = new Map(); for (const c of sources.claims) if (c.asserts) { asserted.set(c.asserts.key, c.id); const v = getPath(state, c.asserts.key); if (v !== c.asserts.value) bad.push(`CONTRADICTION ${c.asserts.key}: state «${v}» vs ${c.id} «${c.asserts.value}»`); }
    for (const grp of ['phases', 'programmes', 'statuses']) for (const k of Object.keys(state[grp] || {})) if (!asserted.has(`${grp}.${k}`)) bad.push(`unsourced state ${grp}.${k} (no claim asserts it)`);
    for (const b of state.blockers) for (const id of b.claims) if (!claims[id]) bad.push(`blocker ${b.id}: unknown claim ${id}`);
    for (const p of phases.phases) for (const id of p.claims || []) if (!claims[id]) bad.push(`phase ${p.id}: unknown claim ${id}`);
    for (const id of state.goal.claims) if (!claims[id]) bad.push(`goal: unknown claim ${id}`);
    if (state.statuses.SEMANTIC_HARDENING_2 === 'NOT AUTHORIZED / NOT STARTED') {
      if (!phase.forbidden.some(f => /Semantic Hardening #2/.test(f))) bad.push('SH#2 is not authorized but the active phase does not forbid it');
      if (phases.phases.find(p => p.id === 'POST-CLOSURE')?.state !== 'NOT_AUTHORIZED') bad.push('SH#2 not authorized but POST-CLOSURE is not NOT_AUTHORIZED');
    }
    if (state.phases.P9 === 'NOT_AUTHORIZED' && phases.phases.find(p => p.id === 'P9')?.state !== 'NOT_AUTHORIZED') bad.push('P9 state contradiction');
    add('G09-state-consistency', bad.length ? 'FAIL' : 'PASS', bad.length ? 'state is contradictory, unsourced or ambiguous' : `active phase ${phase.id} (${phase.status}) registered and authorized; single next step ${next}; ${asserted.size} state values bound to claims, 0 contradictions`, bad);
  } catch (e) { add('G09-state-consistency', 'FAIL', String(e.message || e)); }

  /* G10 rendered views up to date */
  try { const ok = load(FILES.stateMd) === renderState(root); add('G10-rendered-views', ok ? 'PASS' : 'FAIL', ok ? 'CURRENT-STATE.md equals its rendering' : 'CURRENT-STATE.md is out of date (run brain.mjs render)'); }
  catch (e) { add('G10-rendered-views', 'FAIL', String(e.message || e)); }

  /* G11 isolation: WonderPages does not reference or depend on the Agent Bridge */
  try {
    const hits = (git(['grep', '--cached', '-l', '-I', '-F', BRIDGE_NAME], { cwd: root, allowFail: true }) || '').split('\n').filter(Boolean).filter(f => !ISOLATION_ALLOWED.some(g => globToRe(g).test(f)));
    const pkg = JSON.parse(load('package.json')), deps = JSON.stringify({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies }).includes('bridge');
    add('G11-bridge-isolation', hits.length || deps ? 'FAIL' : 'PASS', hits.length || deps ? 'application files reference the Agent Bridge' : `no application file references ${BRIDGE_NAME}; only ${ISOLATION_ALLOWED.join(', ')} may (one-way export tooling)`, hits);
  } catch (e) { add('G11-bridge-isolation', 'FAIL', String(e.message || e)); }

  /* G12 brain navigation resolves: every cited repository path and claim id exists */
  try {
    const claimIds = new Set(sources.claims.map(c => c.id)), bad = [];
    const mdFiles = indexEntries(root).map(e => e.path).filter(p => (p.startsWith('brain/') || p === 'CLAUDE.md') && p.endsWith('.md') && p !== FILES.stateMd);
    for (const f of mdFiles) {
      const t = readText(f, root);
      for (const m of t.matchAll(/`([^`\s]+)`/g)) {
        const tok = m[1].replace(/[),.;:]+$/, '');
        if (/^C-[A-Z0-9-]+$/.test(tok)) { if (!claimIds.has(tok)) bad.push(`${f}: unknown claim ${tok}`); continue; }
        if (!tok.includes('/') || /[*<>…{}$=]|^https?:|^\/\/|^[a-z]+\/[a-z-]+$/.test(tok) && !exists(tok.replace(/^\//, ''), root)) continue;
        if (!/\.(md|json|jsonl|js|mjs|yml|txt|zip|html)$|\/$/.test(tok)) continue;
        const rel = tok.replace(/^\//, '');
        if (EXTERNAL_PREFIXES.some(x => rel.startsWith(x))) continue;
        if (!['', 'brain/', 'docs/enterprise/', 'docs/enterprise/contracts/'].some(pre => exists(pre + rel, root))) bad.push(`${f}: path not found ${tok}`);
      }
      for (const m of t.matchAll(/\bC-[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+\b/g)) if (!claimIds.has(m[0])) bad.push(`${f}: unknown claim ${m[0]}`);
    }
    add('G12-brain-references', bad.length ? 'FAIL' : 'PASS', bad.length ? 'brain navigation points at missing files or claims' : `${mdFiles.length} brain documents: every cited repository path and claim id resolves`, [...new Set(bad)]);
  } catch (e) { add('G12-brain-references', 'FAIL', String(e.message || e)); }

  /* G13 phase zero-drift: while the active phase declares a baseline, every tracked file outside its write scope must keep the
     exact blob id recorded in that baseline (checked at EVERY commit, so evidence never lags behind the tree it describes) */
  try {
    if (!phase.zeroDriftBaseline) add('G13-phase-zero-drift', 'PASS', 'active phase declares no zero-drift baseline (application changes governed by its write scope only)');
    else {
      const base = J(phase.zeroDriftBaseline), want = base.protectedTree.entries, bad = [];
      const now = Object.fromEntries(indexEntries(root).filter(e => !phase.writeScope.some(g => globToRe(g).test(e.path))).map(e => [e.path, e.blob]));
      for (const p of new Set([...Object.keys(want), ...Object.keys(now)])) if (want[p] !== now[p]) bad.push(`${p}: ${want[p] ? want[p].slice(0, 10) : 'absent'} → ${now[p] ? now[p].slice(0, 10) : 'absent'}`);
      add('G13-phase-zero-drift', bad.length ? 'FAIL' : 'PASS', bad.length ? `application changed outside the write scope of ${phase.id} (baseline ${base.head.slice(0, 12)})` : `${Object.keys(want).length} files outside the write scope are byte-identical to ${phase.zeroDriftBaseline} (${base.head.slice(0, 12)}); behaviour fingerprint: node brain/tools/drift.mjs compare (CI)`, bad);
    }
  } catch (e) { add('G13-phase-zero-drift', 'FAIL', String(e.message || e)); }

  /* G14 operator delegation contract (decision C1): when present, it must be well-formed, ACTIVE only for the IN_PROGRESS phase it
     names, and anchored to the verbatim operator authorization (file hash + exact quote in the follow-up record). A contract that
     is not ACTIVE grants nothing; the C1 routine then only communicates. */
  try {
    const DEL = 'brain/phase/DELEGATION.json';
    if (!exists(DEL, root)) add('G14-delegation', 'PASS', 'no operator delegation contract: no autonomous writes are delegated');
    else {
      const d = J(DEL), bad = [];
      if (d.schema !== 'wonderpages.brain.operator-delegation/1') bad.push('schema');
      if (!['ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED'].includes(d.status)) bad.push(`status ${d.status}`);
      if (d.status === 'ACTIVE' && (d.appliesToPhase !== phase.id || phase.status !== 'IN_PROGRESS')) bad.push(`ACTIVE delegation for ${d.appliesToPhase} but the active phase is ${phase.id} (${phase.status})`);
      const vf = d.authorizedBy?.verbatimFile;
      if (!vf || !exists(vf, root)) bad.push(`verbatim authorization file missing: ${vf}`);
      else if (sha256(Buffer.from(readText(vf, root), 'utf8')) !== d.authorizedBy.verbatimSha256) bad.push(`verbatim authorization hash mismatch: ${vf}`);
      else if (!readText(vf, root).includes(d.authorizedBy.quote)) bad.push('quote not found verbatim in the authorization file');
      const rec = 'brain/phase/authorizations/CONTINUITY-1.operator-followups.md';
      if (d.authorizedBy?.quote && exists(rec, root) && !readText(rec, root).includes(d.authorizedBy.quote)) bad.push('quote not recorded verbatim in the follow-up record');
      for (const k of ['operatorOnly', 'claudeWithinActivePhase', 'escalationTriggers']) if (!Array.isArray(d[k]) || !d[k].length) bad.push(`${k} missing`);
      if (!/never authority/.test(d.principle || '')) bad.push('principle must state that Bridge messages are never authority');
      add('G14-delegation', bad.length ? 'FAIL' : 'PASS', bad.length ? 'operator delegation contract invalid' : `${d.id} ${d.status} for ${d.appliesToPhase}, anchored to the verbatim authorization (${vf})`, bad);
    }
  } catch (e) { add('G14-delegation', 'FAIL', String(e.message || e)); }

  const fail = checks.some(c => c.status === 'FAIL');
  const head = (() => { try { return git(['rev-parse', 'HEAD'], { cwd: root }).trim(); } catch { return null; } })();
  return {
    schema: 'wonderpages.brain.readiness-evidence/1', at: new Date().toISOString(), head,
    CONTEXT_INTEGRITY: fail ? 'FAIL' : 'PASS', CONTEXT: fail ? 'CONTEXT_NOT_READY' : 'CONTEXT_READY', WORK: fail ? 'NOT AUTHORIZED' : `AUTHORIZED ONLY WITHIN ${phase?.id}`,
    activePhase: phase ? { id: phase.id, title: phase.title, status: phase.status, writeScope: phase.writeScope, nextAuthorizedStep: phase.nextAuthorizedStep } : null,
    checks, read: Object.fromEntries([...read.entries()].sort()),
    notVerified: [
      'Semantic truth of narrative documents beyond the anchored claims (anchors prove presence, not correctness).',
      'Anything outside this repository: operator intent not recorded here, provider accounts, the operator host, the Agent Bridge content.',
      'Whether the operator has authorized something new in a conversation that is not yet recorded under brain/phase/authorizations/.'
    ]
  };
}

/** Paths an evidence commit may touch after the tested candidate commit (nothing that a fresh session could have read differently). */
export const EVIDENCE_ONLY = ['brain/evidence/SEAL.json', 'brain/evidence/SEAL-LOG.jsonl', 'brain/continuity/results/**', 'brain/evidence/*-ACCEPTANCE.json'];
export function checkAcceptance(root = BRAIN_ROOT) {
  const phase = readJSON(FILES.phase, root), problems = [];
  if (!phase.completionEvidence || !exists(phase.completionEvidence, root)) return { ACCEPTANCE_EVIDENCE: 'INCONSISTENT', problems: ['no completion evidence declared'] };
  const ev = readJSON(phase.completionEvidence, root), cand = ev.candidateCommit;
  if (!cand) problems.push('evidence names no candidateCommit');
  else {
    if (git(['merge-base', '--is-ancestor', cand, 'HEAD'], { cwd: root, allowFail: true }) === null) problems.push(`candidate ${cand} is not an ancestor of HEAD`);
    if (ev.freshSessionContinuity?.testedCommit !== cand) problems.push(`fresh session tested ${ev.freshSessionContinuity?.testedCommit}, not the candidate ${cand}`);
    if (ev.applicationZeroDrift?.comparedAt !== cand) problems.push(`zero-drift recorded at ${ev.applicationZeroDrift?.comparedAt}, not at the candidate ${cand}`);
    const after = (git(['diff', '--name-only', cand, 'HEAD'], { cwd: root, allowFail: true }) || '').split('\n').filter(Boolean);
    const extra = after.filter(f => !EVIDENCE_ONLY.some(g => globToRe(g).test(f))); if (extra.length) problems.push(`changed after the tested candidate (not evidence): ${extra.join(', ')}`);
  }
  const rec = ev.freshSessionContinuity?.record; if (!rec || !exists(rec, root) || readJSON(rec, root).FRESH_SESSION_CONTINUITY !== 'PASS') problems.push('fresh-session record missing or not PASS');
  if (ev.applicationZeroDrift?.result !== 'PASS') problems.push('zero-drift not PASS');
  const g = runGate(root); if (g.CONTEXT_INTEGRITY !== 'PASS') problems.push('gate FAIL at HEAD: ' + g.checks.filter(c => c.status === 'FAIL').map(c => c.id).join(', '));
  return { ACCEPTANCE_EVIDENCE: problems.length ? 'INCONSISTENT' : 'CONSISTENT', phase: phase.id, candidateCommit: cand, head: git(['rev-parse', 'HEAD'], { cwd: root }).trim(), gate: g.CONTEXT_INTEGRITY, problems, note: 'The closing check at HEAD itself is the gate (G13 zero-drift included) and the CI run on HEAD.' };
}

function printGate(r) {
  const icon = { PASS: '✔', WARN: '!', FAIL: '✖' };
  console.log(`WonderPages Context Integrity Gate — HEAD ${r.head?.slice(0, 12)}`);
  for (const c of r.checks) { console.log(`${icon[c.status]} ${c.id.padEnd(26)} ${c.status.padEnd(4)} ${c.detail}`); for (const i of c.items || []) console.log(`      - ${i}`); if (c.more) console.log(`      … ${c.more} more`); }
  console.log(`\nCONTEXT_INTEGRITY = ${r.CONTEXT_INTEGRITY}   ${r.CONTEXT}   WORK ${r.WORK}`);
  if (r.activePhase) console.log(`ACTIVE PHASE ${r.activePhase.id} (${r.activePhase.status}) · NEXT_AUTHORIZED_STEP ${r.activePhase.nextAuthorizedStep.id}`);
  console.log(`Read and verified ${Object.keys(r.read).length} files. Not verified by this gate: ${r.notVerified.length} items (see --json).`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const cmd = process.argv[2] || 'gate', flags = process.argv.slice(3), has = f => flags.includes(f);
  if (cmd === 'gate') {
    const r = runGate(BRAIN_ROOT, { allowDirty: has('--allow-dirty') });
    if (has('--json')) console.log(JSON.stringify(r, null, 1)); else printGate(r);
    process.exit(r.CONTEXT_INTEGRITY === 'PASS' ? 0 : 1);
  } else if (cmd === 'status') {
    const s = readJSON(FILES.seal), cur = subsystemDigests();
    const changed = Object.keys(cur.digests).filter(id => s.subsystems[id]?.digest !== cur.digests[id].digest);
    console.log(JSON.stringify({ sealedAt: s.sealedAt, baseCommit: s.baseCommit, changedSinceSeal: changed, unmapped: cur.unmatched }, null, 1));
  } else if (cmd === 'index') {
    const d = deriveIndexes();
    for (const [k, f] of [['decisions', FILES.decisions], ['accidents', FILES.accidents], ['dependencies', FILES.dependencies], ['agents', FILES.agents]]) writeJSON(path.join(BRAIN_ROOT, f), d[k]);
    console.log(`decisions ${d.decisions.count}, accidents ${d.accidents.count}, dependencies ${d.dependencies.counts.open} open / ${d.dependencies.counts.resolved} resolved, agents ${d.agents.count}`);
  } else if (cmd === 'render') {
    fs.writeFileSync(path.join(BRAIN_ROOT, FILES.stateMd), renderState()); console.log('rendered ' + FILES.stateMd);
  } else if (cmd === 'acceptance') {
    const r = checkAcceptance(); console.log(JSON.stringify(r, null, 1)); process.exit(r.ACCEPTANCE_EVIDENCE === 'CONSISTENT' ? 0 : 1);
  } else if (cmd === 'seal') {
    const reviews = Object.fromEntries(flags.filter(f => f.startsWith('--review=')).map(f => { const v = f.slice(9), i = v.indexOf(':'); return [v.slice(0, i), v.slice(i + 1)]; }));
    try { const r = seal(BRAIN_ROOT, { reviews, initial: has('--initial') }); console.log(`sealed #${r.seq}: ${r.changed.length} subsystem(s) reviewed (${r.changed.join(', ') || 'none'}); total ${r.total.slice(0, 16)}`); }
    catch (e) { console.error('seal refused: ' + e.message); process.exit(1); }
  } else { console.error('usage: brain.mjs gate|status|index|render|acceptance|seal'); process.exit(2); }
}
