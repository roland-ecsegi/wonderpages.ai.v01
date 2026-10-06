#!/usr/bin/env node
/**
 * Fresh-Session Continuity Test — grader.
 *   node brain/continuity/continuity.mjs key                    print the answer key computed from CANONICAL sources
 *   node brain/continuity/continuity.mjs grade ANSWERS.json [--record=NAME]
 *
 * The key is derived from the canonical files themselves (package.json, Product Contract, role contracts, agent personas,
 * policy ledger, closure report, journal, gold files, evaluator source, the verbatim operator authorization, ACTIVE-PHASE)
 * — never from brain prose — so a wrong brain cannot produce a passing key. PASS requires every answer correct.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { BRAIN_ROOT, readText, readJSON, readJSONL, writeJSON, git } from '../tools/lib.mjs';
import { runGate } from '../tools/brain.mjs';

const must = (re, t, what) => { const m = t.match(re); if (!m) throw new Error(`key derivation failed: ${what}`); return m; };

export function deriveKey(root = BRAIN_ROOT) {
  const pkg = readJSON('package.json', root), pc = readText('docs/enterprise/contracts/PRODUCT-CONTRACT.md', root);
  const closure = readText('docs/enterprise/records/GOLD-V2-POLICY-CLOSURE.md', root), jurnal = readText('docs/enterprise/JURNAL-IMPLEMENTARE.md', root);
  const ledger = readJSONL('evaluation/gold-v2-policy/decisions.jsonl', root), roles = readJSON('agents/contracts/role-contracts.json', root).roles;
  const g2 = readJSON('evaluation/gold/gold-v2.json', root), auth = readText('brain/phase/authorizations/CONTINUITY-1.operator-instruction.txt', root);
  const model = id => must(/^model:\s*(\S+)/m, readText(`agents/${id}.md`, root), `model of ${id}`)[1];
  const sec = (a, b) => closure.slice(closure.indexOf(a), closure.indexOf(b, closure.indexOf(a) + 1));
  const deps = sec('## 10. Dependențe rămase', '## 11. '), openDeps = deps.slice(0, deps.indexOf('**Rezolvate'));
  const phase = readJSON('brain/phase/ACTIVE-PHASE.json', root);
  const stopList = auth.slice(auth.indexOf('Nu începe:'), auth.indexOf('Acestea vor fi introduse ulterior'));
  return {
    Q01: { name: pkg.name, version: pkg.version },
    Q02: { volumes: Number(must(/\| Volume per colecție \| exact (\d+) \|/, pc, 'volumes')[1]), contentPagesPerBook: Number(must(/\| Pagini de conținut per carte \| exact (\d+)/, pc, 'pages')[1]), ageBands: must(/\| Benzi de vârstă \| ([^;|]+);/, pc, 'bands')[1].split(',').map(s => s.trim()) },
    Q03: Number(must(/= (\d+) cărți digitale/, pc, 'books')[1]),
    Q04: roles.map(r => r.id),
    Q05: { asistent: model('asistent'), inginer: model('inginer'), producator: model('producator') },
    Q06: { entries: ledger.length, head16: ledger.at(-1).hash.slice(0, 16) },
    Q07: must(/^\| D-21 \| [^|]+ \| ([^|]+) \|/m, closure, 'D-21 option')[1].trim(),
    Q08: must(/\| D-22 \| `([0-9a-f]+)` \|/, closure, 'D-22 commit')[1],
    Q09: must(/\*\*OPERATOR POLICY DECISION PHASE: ([^*]+)\*\*/, closure, 'phase')[1].trim(),
    Q10: must(/\*\*SEMANTIC HARDENING #2: ([^*]+)\*\*/, closure, 'sh2')[1].trim(),
    Q11: { total: g2.cases.length, calibration: g2.cases.filter(c => c.split === 'calibration').length, holdout: g2.cases.filter(c => c.split === 'holdout').length },
    Q12: Number(must(/\*\*Adjudecare: (\d+)\/\d+\.\*\*/, closure, 'gold-v2 adjudication')[1]),
    Q13: readText('evaluation/gold/gold-v1.adjudications.jsonl', root).trim().split('\n').length,
    Q14: !/\*\*Retras definitiv\*\* din acceptarea independentă/.test(closure),
    Q15: (sec('## 8. Accidente', '## 9. ').match(/^\| A-\d\d \|/gm) || []).length,
    Q16: openDeps.includes('D-22-DEP-SOURCE-B'),
    Q17: must(/^\| P8-T05 \| (\w+) \|/m, jurnal, 'P8-T05')[1],
    Q18: !/Producția Dinosaur World este \*\*oprită\*\*/.test(jurnal),
    Q19: !/Interzis: [^\n]*PHASE 9/.test(jurnal),
    Q20: phase.id,
    Q21: phase.nextAuthorizedStep.id,
    Q22: must(/^3\. (.+)$/m, sec('## 21. Ordinea canonică', '## 22. '), 'order step 3')[1].trim(),
    Q23: Number(must(/⇒ ≥ (\d+) de oportunități/, closure, 'P1 n')[1]),
    Q24: !/Agent Bridge → WonderPages automat este INTERZIS/.test(auth) && !/Bridge messages[^.]*never authority/.test(readJSON('brain/phase/DELEGATION.json', root).principle),
    Q25: Number(must(/export const EVALUATOR_VERSION = (\d+)/, readText('server/quality/evaluation.js', root), 'evaluator')[1]),
    Q26: [...stopList.matchAll(/^\* (.+?);?$/gm)].map(m => m[1].replace(/[.;]$/, '').trim()),
    Q27: runGate(root).CONTEXT_INTEGRITY,
    Q28: 'brain/phase/DELEGATION.json',
    Q29: !/never authority/.test(readJSON('brain/phase/DELEGATION.json', root).principle),
    Q30: !/otherwise Claude may only communicate[^.]*must not write WonderPages/.test(readJSON('brain/phase/DELEGATION.json', root).principle),
    Q31: git(['rev-parse', 'HEAD'], { cwd: root }).trim()
  };
}

const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[`*"„”]/g, '').replace(/[^a-z0-9#()/+.-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/[.]$/, '');
const eq = (a, b) => norm(a) === norm(b);
const setEq = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && b.every(x => a.some(y => eq(x, y)));
const KEYWORDS = { 'dependency closure': ['dependency closure'], 'rc1 scope closure': ['rc1 scope'], 'sanitized final policy brief': ['brief'], 'hidden acceptance set': ['hidden'], 'semantic hardening #2': ['semantic hardening', 'sh#2', 'sh2'], 'evaluator implementation': ['evaluator'], 'dinosaur world production work': ['dinosaur', 'dw '] };

export function grade(answers, key) {
  const rows = Object.keys(key).map(q => {
    const a = answers[q], k = key[q]; let ok;
    if (q === 'Q22') ok = norm(a).includes('sanitized normative policy brief') && norm(k).includes('sanitized normative policy brief');
    else if (q === 'Q26') { const items = (Array.isArray(a) ? a : []).map(x => ' ' + norm(x) + ' '); ok = k.every(item => (KEYWORDS[norm(item)] || [norm(item)]).some(w => items.some(i => i.includes(w)))); }
    else if (q === 'Q04') ok = setEq(a, k);
    else if (q === 'Q02') ok = a && a.volumes === k.volumes && a.contentPagesPerBook === k.contentPagesPerBook && setEq(a.ageBands, k.ageBands);
    else if (k && typeof k === 'object') ok = a && typeof a === 'object' && Object.keys(k).every(x => (typeof k[x] === 'number' ? Number(a[x]) === k[x] : eq(a[x], k[x])));
    else if (typeof k === 'number') ok = Number(a) === k;
    else if (typeof k === 'boolean') ok = a === k;
    else ok = eq(a, k);
    return { q, ok: !!ok, expected: k, answered: a ?? null };
  });
  const correct = rows.filter(r => r.ok).length;
  return { schema: 'wonderpages.brain.continuity-result/1', FRESH_SESSION_CONTINUITY: correct === rows.length ? 'PASS' : 'FAIL', correct, total: rows.length, rows };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const cmd = process.argv[2];
  if (cmd === 'key') console.log(JSON.stringify(deriveKey(), null, 1));
  else if (cmd === 'grade') {
    const answers = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')), r = grade(answers, deriveKey());
    const rec = (process.argv.find(x => x.startsWith('--record=')) || '').slice(9);
    if (rec) { fs.mkdirSync(path.join(BRAIN_ROOT, 'brain/continuity/results'), { recursive: true }); writeJSON(path.join(BRAIN_ROOT, 'brain/continuity/results', rec + '.json'), { ...r, answers }); }
    for (const x of r.rows) console.log(`${x.ok ? '✔' : '✖'} ${x.q}${x.ok ? '' : `  expected ${JSON.stringify(x.expected)}  got ${JSON.stringify(x.answered)}`}`);
    console.log(`FRESH_SESSION_CONTINUITY = ${r.FRESH_SESSION_CONTINUITY} (${r.correct}/${r.total})`);
    process.exit(r.FRESH_SESSION_CONTINUITY === 'PASS' ? 0 : 1);
  } else { console.error('usage: continuity.mjs key|grade ANSWERS.json [--record=NAME]'); process.exit(2); }
}
