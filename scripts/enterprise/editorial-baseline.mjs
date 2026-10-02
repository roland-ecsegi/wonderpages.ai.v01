/**
 * P1-T05 — editorial baseline: DW01–DW07 evidence and lesson sources inventoried as SOURCES (never activated).
 *   node scripts/enterprise/editorial-baseline.mjs → docs/enterprise/baseline/EDITORIAL-BASELINE.{json,md}
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDinosaurWorld } from '../../server/migration/dw-reference.js';
import { sha256 } from '../../server/domain/canonical.js';
import { appRightsInventory, rightsStatus } from '../../server/domain/rights.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'docs/enterprise/baseline'); fs.mkdirSync(OUT, { recursive: true });
const dw = readDinosaurWorld(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')), { currentBlueprint: JSON.parse(fs.readFileSync(path.join(ROOT, 'blueprints/kids-sc.json'), 'utf8')) });
const seeds = JSON.parse(fs.readFileSync(path.join(ROOT, 'seeds/lessons.json'), 'utf8'));
const llText = fs.readFileSync(path.join(ROOT, 'docs/LESSONS-LEARNED.md'), 'utf8');
const ll = [...llText.matchAll(/^## (LL-\d{3}) — (.+)$/gm)].map(m => { const block = llText.slice(m.index).split(/\n## LL-/)[1] || ''; return { id: m[1], title: m[2].trim(), scope: (block.match(/\*\*Scope\*\* \| ([A-Z_]+)/) || [])[1] || null, status: (block.match(/\*\*Status\*\* \| ([A-Z_]+)/) || [])[1] || null }; });
const conflicts = [{ lesson: 'LL-013', with: 'DW v04 p8–p9', status: 'CONFLICT_DETECTED', detail: 'LL-013 (rezolvat istoric) tratează pagina 9 ca protejarea pietrei/curent; DW v04 corectează motivul în adăpostul prietenilor. Lecția nu se importă fără reconciliere.' }];
const app = appRightsInventory(ROOT);
const report = {
  kind: 'wonderpages.editorial-baseline/1', generatedAt: new Date().toISOString(),
  dinosaurWorld: { archiveSha256: dw.archiveSha256, findings: dw.findings, counts: dw.counts, customPrompts: dw.customPrompts, references: dw.images.map(i => ({ ...i, rights: 'unknown', pinned: true })), beforeBaseline: 'EXPLICIT_INCOMPLETE: planuri + draft V1, fără artă/lineart/PDF/aprobări' },
  lessonSources: { seeds: { file: 'seeds/lessons.json', sha256: sha256(fs.readFileSync(path.join(ROOT, 'seeds/lessons.json'))), count: seeds.length, byAgent: seeds.reduce((m, l) => { m[l.agent] = (m[l.agent] || 0) + 1; return m; }, {}), status: 'source (seed v04: activ în instalarea curentă prin seedLessons; guvernanța P7)' }, register: { file: 'docs/LESSONS-LEARNED.md', sha256: sha256(Buffer.from(llText)), count: ll.length, entries: ll, status: 'istoric — candidat doar după reconciliere (P7-T01)' }, conflicts },
  rights: { app: app.summary, gaps: app.records.filter(r => rightsStatus(r).status !== 'cleared').map(r => ({ id: r.id, ...rightsStatus(r), notes: r.notes })) }
};
fs.writeFileSync(path.join(OUT, 'EDITORIAL-BASELINE.json'), JSON.stringify(report, null, 1));
const md = ['# Editorial & rights baseline (P1-T05)', '', `Generat ${report.generatedAt.slice(0, 10)} de \`scripts/enterprise/editorial-baseline.mjs\`. Nimic nu este activat prin această inventariere.`, '', '## Dinosaur World — DW01–DW07', '', '| ID | Status | Constatare | Dovadă |', '|---|---|---|---|',
  ...dw.findings.map(f => `| ${f.id} | ${f.status} | ${f.title} | ${(f.evidence || []).slice(0, 4).join('; ').replace(/\|/g, '/')} |`), '',
  `Referințe pin-uite: ${dw.images.map(i => `${i.file} ${i.pixels?.join('×')} sha256 ${i.sha256.slice(0, 12)}… (drepturi: unknown)`).join('; ')}. Baseline „before”: explicit incomplet.`, '',
  '## Surse de lecții (nu se activează prin lectură)', '', `- seeds/lessons.json: ${seeds.length} reguli.`, `- docs/LESSONS-LEARNED.md: ${ll.length} intrări (${ll[0]?.id}–${ll[ll.length - 1]?.id}).`, ...conflicts.map(c => `- **${c.lesson} ↔ ${c.with}: ${c.status}** — ${c.detail}`), '',
  '## Drepturi — lacune', '', `Rezumat aplicație: ${JSON.stringify(app.summary)}.`, '', '| Subiect | Status | Motiv |', '|---|---|---|', ...report.rights.gaps.map(g => `| ${g.id} | ${g.status} | ${g.reasons.join(' ')} ${g.notes || ''} |`), ''].join('\n');
fs.writeFileSync(path.join(OUT, 'EDITORIAL-BASELINE.md'), md);
console.log(`DW findings ${dw.findings.map(f => f.id + ':' + f.status).join(' ')}; LL ${ll.length}; seeds ${seeds.length}; rights gaps ${report.rights.gaps.length}`);
