// TEST-P3-T06 — SSE deconectat/reconectat, suspendare/repornire a laptopului, cotă necunoscută și replanificare totală;
// UI comparat cu unitățile comise: progres măsurabil, fără ETA inventată, niciun eveniment duplicat, inspectorul leagă ieșirea efectivă.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { api, setFake, waitStatus, connectCanva, INPUT } from './lib.mjs';
import { EventStream } from '../server/observability/events.js';
import { progressReport } from '../server/observability/progress.js';
import { LocalStorage } from '../server/storage/local.js';

/* reads an SSE stream for `ms` and returns the parsed events (id, event, data) */
function sse({ cursor = null, ms = 1200, query = '' } = {}) {
  return new Promise((resolve, reject) => {
    const headers = cursor != null ? { 'last-event-id': String(cursor) } : {};
    const req = http.get({ host: '127.0.0.1', port: Number(process.env.WP_PORT), path: '/api/events' + query, headers }, res => {
      let buf = ''; const out = [];
      res.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n\n')) >= 0) { const block = buf.slice(0, i); buf = buf.slice(i + 2); const ev = { event: 'message' }; for (const line of block.split('\n')) { const m = line.match(/^(id|event|data): ?(.*)$/); if (m) ev[m[1]] = m[1] === 'data' ? JSON.parse(m[2]) : m[2]; } if (ev.data !== undefined) out.push(ev); } });
      setTimeout(() => { req.destroy(); resolve(out); }, ms);
    });
    req.on('error', e => (e.code === 'ECONNRESET' ? null : reject(e)));
  });
}

test('P3-T06: fluxul de evenimente — id-uri monotone, reluare exactă, reset explicit la cursor expirat sau din viitor, conținut sanitizat', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-ev-')); const s = new LocalStorage(dir); await s.init();
  const a = await new EventStream(s, { max: 5 }).init();
  for (let i = 0; i < 4; i++) a.append({ scope: 'project', pid: 'p1', content: 'TEXT EDITORIAL SECRET', note: 'x' });
  assert.deepEqual(a.ring.map(e => e.id), [1, 2, 3, 4]); assert.equal(a.ring[0].content, undefined, 'conținutul editorial nu intră în flux');
  assert.deepEqual(a.since(2).events.map(e => e.id), [3, 4]); assert.deepEqual(a.since(4).events, []);
  assert.equal(a.since(99).reset, true); assert.equal(a.since(99).reason, 'cursor_ahead');
  for (let i = 0; i < 4; i++) a.append({ scope: 'projects' });
  assert.equal(a.since(1).reset, true, 'evenimentele ieșite din inel nu se pot relua exact'); assert.equal(a.since(1).reason, 'cursor_expired');
  assert.deepEqual(a.since(3).events.map(e => e.id), [4, 5, 6, 7, 8]);
  // „laptop repornit”: o instanță nouă continuă numerotarea și reia evenimentele persistate
  await a.flush(); const b = await new EventStream(s, { max: 5 }).init();
  assert.equal(b.seq, 8); assert.deepEqual(b.since(6).events.map(e => e.id), [7, 8]); assert.equal(b.append({ scope: 'projects' }).id, 9);
  // evenimente pierdute într-un crash (nepersistate) → cursorul clientului este „din viitor” → reset, nu gol tăcut
  const c = await new EventStream(s, { max: 5 }).init(); assert.equal(c.since(9).reset, true);
  // ștergerea definitivă a unui proiect elimină id-ul lui din flux (inclusiv evenimentele întârziate)
  c.append({ scope: 'project', pid: 'pDEL' }); await c.purgeProject('pDEL'); c.append({ scope: 'project', pid: 'pDEL' });
  assert.ok(!JSON.stringify(c.ring).includes('pDEL')); assert.ok(!fs.readFileSync(path.join(dir, '_events', 'stream.json'), 'utf8').includes('pDEL'));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('P3-T06 API: SSE deconectat → reconectarea cu Last-Event-ID primește exact evenimentele pierdute, o singură dată', async () => {
  const first = await sse({ ms: 600 });
  const hello = first.find(e => e.event === 'hello'); assert.ok(hello && Number.isInteger(hello.data.head), 'cursorul inițial este anunțat');
  const cursor = Number(hello.id);
  // un client rămas conectat este martorul; celălalt este „suspendat” în timpul schimbărilor
  const witness = sse({ ms: 2500 }); await new Promise(r => setTimeout(r, 300));
  const id1 = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'SSE 1' } })).body.id;
  await new Promise(r => setTimeout(r, 400));
  const id2 = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'SSE 2' } })).body.id;
  await api('POST', `projects/${id1}/archive`, { archived: true });
  const live = (await witness).filter(e => e.event === 'change').map(e => Number(e.id));
  const replay = (await sse({ cursor, ms: 800 })).filter(e => e.event === 'change');
  const ids = replay.map(e => Number(e.id));
  assert.ok(live.length >= 2, 'martorul a văzut schimbările: ' + JSON.stringify(live));
  assert.ok(ids.every(i => i > cursor), 'nimic de dinaintea cursorului'); assert.equal(new Set(ids).size, ids.length, 'niciun duplicat');
  assert.equal(ids[0], cursor + 1, 'reluarea începe imediat după cursor');
  assert.ok(live.every(i => ids.includes(i)), 'reluarea conține tot ce a văzut clientul conectat: ' + JSON.stringify({ live, ids }));
  assert.deepEqual(ids, [...ids].sort((x, y) => x - y)); assert.equal(ids[ids.length - 1] - ids[0] + 1, ids.length, 'fără goluri');
  const again = (await sse({ cursor: ids[ids.length - 1], ms: 500 })).filter(e => e.event === 'change');
  assert.equal(again.length, 0, 'o a doua reconectare la zi nu repetă nimic');
  const future = await sse({ cursor: 10 ** 9, ms: 500 }); assert.equal(future[0]?.event, 'reset', 'cursor necunoscut → reîncărcare completă');
  await api('POST', `projects/${id2}/archive`, { archived: true });
});

test('P3-T06: estimare numai măsurată și numai pentru etapa curentă; cota necunoscută rămâne necunoscută', () => {
  const project = { id: 'pX', run: 2, status: 'running', currentStage: 'scripts', stageIndex: 1, createdAt: 0, stages: { scripts: { status: 'running', done: 2, total: 6 } } };
  const stages = [{ key: 'brief', label: 'B', handler: 'llm_json' }, { key: 'scripts', label: 'S', handler: 'llm_json' }];
  const item = (n, run, ms, extra = {}) => ({ key: `scripts#${n}`, kind: 'item', status: 'committed', meta: { run, stage: 'scripts' }, attempts: [{ n: 1, startedAt: 1000, endedAt: 1000 + ms, outcome: 'committed', external: [] }], ...extra });
  let r = progressReport({ project, stages, jobs: [item(0, 2, 1000), item(1, 2, 3000), item(9, 1, 50)], capabilities: { channels: { 'claude-code-text': { quota: { status: 'unknown' } }, 'codex-text': {} } } });
  assert.equal(r.estimate.value, null); assert.match(r.estimate.reason, /2 din minimum 3/); assert.equal(r.units.committed, 2); assert.equal(r.units.superseded, 1);
  assert.deepEqual(r.consumption.quota, { 'claude-code-text': 'unknown', 'codex-text': 'unknown' }); assert.equal(r.consumption.tokens.input, null, 'tokeni neraportați = necunoscuți, nu zero');
  r = progressReport({ project, stages, jobs: [item(0, 2, 1000), item(1, 2, 3000), item(2, 2, 2000), item(3, 2, 99, { meta: { run: 2, stage: 'scripts', reusedFromRun: 1 } })] });
  assert.equal(r.estimate.value, 2000 * 4, 'mediana unităților măsurate × elementele rămase'); assert.equal(r.estimate.scope, 'etapa curentă'); assert.equal(r.units.reused, 1);
  r = progressReport({ project: { ...project, status: 'awaiting_review', gate: { key: 'review_1' }, stages: {} }, stages, jobs: [] });
  assert.equal(r.estimate.value, null); assert.equal(r.waiting[0].kind, 'human');
});

test('P3-T06 API: progresul = unitățile comise ale rulării curente; replanificarea totală nu moștenește „gata”; inspectorul leagă ieșirea efectivă; UI-ul arată aceleași numere', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Progres P3' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']);
  const check = async run => {
    const pr = (await api('GET', `projects/${id}/progress`)).body, jobs = (await api('GET', `projects/${id}/jobs`)).body.jobs;
    assert.equal(pr.run, run);
    assert.equal(pr.units.committed, jobs.filter(j => j.meta?.run === run && j.status === 'committed').length, 'progresul vine din unitățile durabile');
    assert.equal(pr.estimate.value, null, 'la o poartă nu există ETA'); assert.equal(pr.waiting[0]?.kind, 'human');
    for (const v of Object.values(pr.consumption.quota)) assert.ok(['ok', 'limited', 'unknown'].includes(v));
    return { pr, jobs };
  };
  const { pr: p1 } = await check(1); assert.ok(p1.units.committed >= 3); assert.equal(p1.units.failed, 0);
  // inspectorul: versiunea curentă a brief-ului → unitatea care a comis-o, încercările, contextul și consumul
  const art = (await api('GET', `projects/${id}`)).body.artifacts.brief;
  const ins = (await api('GET', `projects/${id}/inspect/brief`)).body;
  assert.equal(ins.version, art.version); assert.ok(ins.unit, JSON.stringify(ins.note)); assert.equal(ins.unit.outputs.includes('brief'), true);
  assert.equal(ins.unit.run, 1); assert.ok(ins.unit.attempts.at(-1).external.length >= 1);
  assert.ok(ins.provenance.agent && ins.context?.manifestHash === ins.provenance.context, 'contextul efectiv este legat');
  assert.ok(ins.usage.length >= 1 && ins.usage.every(u => u.kind === 'text'), 'consumul unității este legat prin cheia unității');
  assert.equal((await api('GET', `projects/${id}/inspect/nu_exista`)).status, 404);
  // UI: aceeași valoare în panoul de unități (browser real, dacă există)
  const browser = process.env.BROWSER_PATH;
  if (browser && fs.existsSync(browser)) {
    const { evalInPage } = await import('./cdp.mjs');
    const ui = await evalInPage(browser, `${process.env.WP_BASE}/#/p/${id}/progress`, `(() => { const e = document.getElementById('units-panel'); return e ? JSON.stringify({ run: e.dataset.run, committed: e.dataset.committed }) : null; })()`, { timeout: 30000 });
    assert.ok(ui, 'panoul de unități este randat');
    const v = JSON.parse(ui); assert.equal(Number(v.run), 1); assert.equal(Number(v.committed), p1.units.committed, 'UI = unitățile comise');
    const act = await evalInPage(browser, `${process.env.WP_BASE}/#/p/${id}/activity`, `(() => { const l = document.getElementById('units-log'); if (!l) return null; const b = l.querySelector('[data-act=inspect][data-key=brief]'); if (!b) return null; b.click(); return 'clicked'; })() && new Promise(r => setTimeout(() => { const i = document.getElementById('inspector'); r(i ? JSON.stringify({ key: i.dataset.key, version: i.dataset.version, unit: i.dataset.unit }) : null); }, 1500))`, { timeout: 30000 });
    assert.ok(act, 'Activitate: unitățile și inspectorul sunt randate');
    const iv = JSON.parse(act); assert.equal(iv.key, 'brief'); assert.equal(Number(iv.version), ins.version); assert.equal(iv.unit, ins.unit.key, 'UI-ul inspectorului arată unitatea care a comis versiunea');
  }
  // replanificare totală: respingere cu reluare de la început → rularea 2; unitățile vechi nu se mai numără
  assert.equal((await api('POST', `projects/${id}/decide`, { decision: 'rejected', note: 'Refă tot', restart: 'all' })).status, 200);
  const mid = (await api('GET', `projects/${id}/progress`)).body; assert.equal(mid.run, 2);
  if (!(await api('GET', `projects/${id}`)).body.project.running) await api('POST', `projects/${id}/start`);
  await waitStatus(id, ['awaiting_review']);
  const { pr: p2, jobs: j2 } = await check(2);
  assert.ok(p2.units.committed >= 3 && p2.units.reused === 0, 'o replanificare totală reexecută, nu refolosește');
  assert.ok(j2.filter(j => j.status === 'committed').every(j => j.meta?.run === 2 || p2.units.superseded > 0));
  assert.equal((await api('GET', `projects/${id}/inspect/brief`)).body.unit.run, 2, 'inspectorul arată unitatea care a produs versiunea curentă');
  await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});
