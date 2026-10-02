/**
 * Exportul lunar al cunoștințelor (plan 3.4) pentru Proiectul „Studioul WonderPages” din claude.ai (plan 1.9).
 * Scrie un folder datat cu fișiere Markdown (plus registrul CSV) și îl arhivează. Tu încarci fișierele în Proiect;
 * nimic nu pleacă singur de pe calculator și nu se folosește niciun API.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { listAgents } from './agents.js';
import * as Learning from './learning.js';
import * as Ledger from './ledger.js';
import { outputDir, zipDir } from './output.js';

const md = s => String(s ?? '').replace(/\r/g, '');
const pct = x => (x == null ? '—' : `${x}%`);
const scopeRo = { global: 'toate proiectele', age: 'o vârstă', project: 'un proiect' };

export async function exportKnowledge(repo, { projectInstructions } = {}) {
  const day = new Date().toISOString().slice(0, 10);
  const dir = path.join(outputDir(), 'Cunostinte', `cunostinte-${day}`);
  await fs.rm(dir, { recursive: true, force: true }); await fs.mkdir(dir, { recursive: true });
  const files = {};
  const agents = listAgents(); const lessons = Learning.listLessons();
  const types = repo.listTypes();

  files['00-CITESTE-MA.md'] = `# Cunoștințele WonderPages.AI, ${day}\n\nÎncarcă toate fișierele din acest folder în baza de cunoștințe a Proiectului „Studioul WonderPages” din claude.ai și șterge versiunea anterioară (fișierele au data în nume). Instrucțiunile Proiectului sunt în \`instructiuni-proiect.md\` (le copiezi o singură dată în câmpul de instrucțiuni).\n\nCe conține:\n- \`carte-agenti.md\`: rolul, contractul și interdicțiile fiecărui agent\n- \`rubrica-si-varste.md\`: criteriile de calitate cu coduri și profilurile de vârstă\n- \`lectii-*.md\`: lecțiile active, pe agent, cu efectul măsurat\n- \`esecuri-cunoscute.md\`: problemele de imagine găsite până acum\n- \`registre-continuitate.md\`: ce s-a întâmplat în fiecare serie\n- \`exemple-aprobate.md\`: începuturi de volume aprobate de tine\n- \`raport-lunar.md\`: consum, calitate, evoluție pe versiuni, praguri, variante\n- \`prompturi.md\`: prompturile actuale (pentru rafinarea lunară)\n- \`registru-consum.csv\`: toate măsurătorile din ultimele 90 de zile\n`;
  if (projectInstructions) files['instructiuni-proiect.md'] = projectInstructions;

  files['carte-agenti.md'] = `# Cartele agenților\n\n` + agents.map(a => `## ${a.name} (\`${a.id}\`, ${a.model})\n\n${md(a.persona)}\n`).join('\n');

  const rub = [];
  for (const t of types) {
    rub.push(`# ${t.name} (blueprint v${t.version})\n\n## Rubrica textului\n\n| Cod | Criteriu | Critic |\n| --- | --- | --- |\n${(t.rubric || []).map((r, i) => (typeof r === 'object' ? `| ${r.code} | ${md(r.text)} | ${r.critical ? 'da' : ''} |` : `| T${String(i + 1).padStart(2, '0')} | ${md(r)} | |`)).join('\n')}`);
    if (t.rubric_visual) rub.push(`## Rubrica imaginilor\n\n| Cod | Criteriu |\n| --- | --- |\n${t.rubric_visual.map(r => `| ${r.code} | ${md(r.text)} |`).join('\n')}`);
    rub.push(`## Profiluri de vârstă\n\n${Object.entries(t.age_profiles || {}).map(([k, v]) => `### ${v.label || k}\n\n${Object.entries(v).filter(([x]) => x !== 'label').map(([x, y]) => `- **${x}**: ${md(typeof y === 'object' ? JSON.stringify(y) : y)}`).join('\n')}`).join('\n\n')}`);
  }
  files['rubrica-si-varste.md'] = rub.join('\n\n');

  for (const a of agents) {
    const mine = lessons.filter(l => l.agent === a.id && l.status === 'active'); if (!mine.length) continue;
    files[`lectii-${a.id}.md`] = `# Lecțiile agentului ${a.name}\n\n| Lecție | Cod | Domeniu | Încredere | Folosită | Efect măsurat | De revizuit |\n| --- | --- | --- | --- | --- | --- | --- |\n` +
      mine.sort((x, y) => (y.confidence || 0) - (x.confidence || 0)).map(l => `| ${md(l.text).replace(/\|/g, '/')} | ${l.code || ''} | ${scopeRo[l.scope] || l.scope || ''}${l.age ? ` (${l.age})` : ''} | ${Math.round((l.confidence || 0) * 100)}% | ${l.uses || 0} | ${l.effect == null ? '' : (l.effect > 0 ? '+' : '') + l.effect} | ${l.needsReview ? 'da' : ''} |`).join('\n');
  }

  const auto = Learning.autoFailures();
  files['esecuri-cunoscute.md'] = `# Eșecuri cunoscute la imagini\n\n## Din pachetele de instruire\n\n${Learning.knownFailures().filter(x => !auto.some(a => a.text === x)).map(x => `- ${md(x)}`).join('\n') || '- (niciunul)'}\n\n## Găsite automat (verificarea vizuală și imaginile trimise înapoi)\n\n| Problemă | Cod | De câte ori |\n| --- | --- | --- |\n${auto.map(a => `| ${md(a.text).replace(/\|/g, '/')} | ${a.code || ''} | ${a.count} |`).join('\n') || '| (niciuna) | | |'}`;

  const led = [];
  for (const p of repo.listProjects()) {
    if (p.status === 'archived') continue;
    const art = await repo.artifacts(p.id).catch(() => ({})); const ledger = art.continuity?.content?.ledger; if (!ledger?.length) continue;
    const names = Object.fromEntries((art.bible?.content?.characters || []).map(c => [c.id, c.name]));
    led.push(`## ${md(p.title)}\n\n${ledger.map(c => `### ${md(names[c.id] || c.id)}\n\n${(c.volumes || []).map(v => `- Vol. ${v.volume}: ${md(v.did)}${v.learned ? `; a învățat: ${md(v.learned)}` : ''}${v.relationships ? `; relații: ${md(v.relationships)}` : ''}`).join('\n')}`).join('\n\n')}`);
  }
  files['registre-continuitate.md'] = `# Registrele de continuitate\n\n${led.join('\n\n') || 'Încă nu există serii cu registru.'}`;

  const ex = Learning.listExamples().slice(-40);
  files['exemple-aprobate.md'] = `# Începuturi de volume aprobate\n\n${ex.map(e => `## ${md(e.title)} (${e.age || ''}, ${e.language || ''})\n\n${(e.pages || []).map((t, i) => `${i + 1}. ${md(t)}`).join('\n')}`).join('\n\n') || 'Încă nu există volume aprobate.'}`;

  const sum = Ledger.summary(30), evo = Ledger.evolution(); const th = Learning.thresholds(); const bandit = Learning.banditState();
  files['raport-lunar.md'] = `# Raport lunar, ${day}\n\n## Ultimele 30 de zile\n\n- Apeluri Claude: ${sum.textCalls} (erori: ${sum.textErrors}); generări de imagine: ${sum.imageCalls}, dintre care redesenări: ${sum.redraws}\n- Tokeni din cache: ${pct(sum.cacheShare)}; răspunsuri validate de schemă: ${pct(sum.schemaShare)}\n- Evaluări ale criticului: ${sum.critic.evaluations}, nota medie ${sum.critic.avgScore ?? '—'}, revizii medii ${sum.critic.avgRounds ?? '—'}; opriri la verificarea de structură: ${sum.critic.lintStops}\n\n## Consum pe etape\n\n| Etapă | Agent | Model | Apeluri | KB medii trimiși | Secunde medii |\n| --- | --- | --- | --- | --- | --- |\n${sum.stages.map(s => `| ${s.stage} | ${s.agent} | ${s.model} | ${s.calls} | ${s.avgKB} | ${s.avgSec} |`).join('\n')}\n\n## Evoluție pe versiuni\n\n| Lună | Blueprint | Volume aprobate | Aprobate din prima | Nota medie | Criterii slabe | Redesenări |\n| --- | --- | --- | --- | --- | --- | --- |\n${evo.map(e => `| ${e.month} | v${e.bp ?? '—'} | ${e.volumes} | ${pct(e.firstPass)} | ${e.avgScore ?? '—'} | ${e.weakest.map(w => `${w[0]} ${w[1]}`).join(', ')} | ${e.redraws} |`).join('\n')}\n\n## Praguri ale criticului\n\n${Object.entries(th).map(([age, x]) => `- ${age}: ${Object.entries(x).map(([k, v]) => `${k} ${v}`).join(', ')}`).join('\n') || '- implicite (8)'}\n\n## Variante de prompt\n\n${Object.entries(bandit).filter(([k]) => !k.includes('__')).map(([k, v]) => `- ${k}: ${v.a - 1} reușite, ${v.b - 1} respingeri`).join('\n') || '- încă fără date'}\n`;

  files['prompturi.md'] = types.map(t => `# ${t.name}, blueprint v${t.version}\n\n${Object.entries(t.prompts || {}).map(([k, v]) => `## ${k}${t.prompt_agents?.[k] ? ` (agent: ${t.prompt_agents[k]})` : ''}\n\n\`\`\`text\n${md(v)}\n\`\`\``).join('\n\n')}`).join('\n\n');
  files['registru-consum.csv'] = '﻿' + Ledger.csv(90);

  for (const [name, content] of Object.entries(files)) await fs.writeFile(path.join(dir, name), content);
  const zip = dir + '.zip'; await zipDir(dir, zip, path.basename(dir));
  return { folder: dir, zip, files: Object.keys(files) };
}
