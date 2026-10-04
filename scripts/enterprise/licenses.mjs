#!/usr/bin/env node
/**
 * P8-T03 — license review of everything the installation distributes or installs (production dependencies from the
 * lockfile, bundled fonts). Every license must be on the permissive allowlist; dual/conditional licenses carry an
 * explicit, documented ELECTION. Produces THIRD-PARTY-NOTICES.md (deterministic: same lockfile → same text).
 *   node scripts/enterprise/licenses.mjs [--out=THIRD-PARTY-NOTICES.md]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ALLOWED = new Set(['MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', '0BSD', 'OFL-1.1']);
/* dual or conditional licenses: the license WonderPages distributes under, and why */
export const ELECTIONS = Object.freeze({
  '(MIT OR Apache-2.0)': { elected: 'MIT', note: 'licență dublă; se folosește MIT' },
  '(MPL-2.0 OR Apache-2.0)': { elected: 'Apache-2.0', note: 'dompurify: licență dublă; se alege Apache-2.0 (permisivă, fără obligațiile copyleft pe fișier ale MPL)' },
  'MIT OR SEE LICENSE IN FEEL-FREE.md': { elected: 'MIT', note: 'rgbcolor: MIT sau licența proprie; se folosește MIT' }
});

export function licenseReport(root = ROOT) {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8')), packages = [], problems = [];
  for (const [k, v] of Object.entries(lock.packages || {})) {
    if (!k || v.dev) continue;
    const name = k.replace(/^.*node_modules\//, ''), license = v.license || null, el = ELECTIONS[license];
    const elected = el ? el.elected : license;
    if (!elected || !ALLOWED.has(elected)) problems.push({ code: 'LICENSE_NOT_ALLOWED', package: name, license: license || 'necunoscută' });
    packages.push({ name, version: v.version, license, elected, note: el?.note || null, optional: !!v.optional });
  }
  packages.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : a.version < b.version ? -1 : 1));
  const fontsDir = path.join(root, 'public', 'fonts'), fonts = [];
  for (const f of fs.existsSync(fontsDir) ? fs.readdirSync(fontsDir).filter(x => /\.(ttf|otf|woff2?)$/i.test(x)).sort() : []) {
    const family = f.replace(/-[A-Za-z]+\.(ttf|otf|woff2?)$/i, ''), file = [`OFL-${family}.txt`, 'OFL.txt'].find(x => fs.existsSync(path.join(fontsDir, x))) || null;
    if (!file) problems.push({ code: 'FONT_LICENSE_MISSING', font: f, message: `Textul licenței pentru ${family} lipsește din public/fonts (OFL cere ca licența să însoțească fontul redistribuit).` });
    fonts.push({ file: f, family, license: 'OFL-1.1', licenseFile: file });
  }
  const counts = {}; for (const p of packages) counts[p.elected || '?'] = (counts[p.elected || '?'] || 0) + 1;
  return { ok: !problems.length, packages, fonts, counts, problems };
}

function licenseText(root, name) {
  const dir = path.join(root, 'node_modules', name); if (!fs.existsSync(dir)) return null;
  const f = fs.readdirSync(dir).filter(x => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(x)).sort()[0];
  return f ? fs.readFileSync(path.join(dir, f), 'utf8').trim() : null;
}
export function noticesMarkdown(rep, root = ROOT) {
  const out = ['# Notificări privind componentele terților', '', 'Generat din package-lock.json de `scripts/enterprise/licenses.mjs`. Licențele duble sunt folosite sub varianta aleasă (coloana „Folosită”).', '',
    '## Fonturi', '', ...rep.fonts.map(f => `- ${f.file} — ${f.license} (${f.licenseFile ? `public/fonts/${f.licenseFile}` : 'TEXTUL LICENȚEI LIPSEȘTE'})`), '',
    '## Dependențe de producție', '', '| Pachet | Versiune | Licență declarată | Folosită | Notă |', '|---|---|---|---|---|',
    ...rep.packages.map(p => `| ${p.name} | ${p.version} | ${p.license || '—'} | ${p.elected || '—'} | ${p.note || (p.optional ? 'opțional, specific platformei' : '')} |`), '', '## Textele licențelor', ''];
  const seen = new Set();
  for (const p of rep.packages) { if (seen.has(p.name)) continue; seen.add(p.name); const t = licenseText(root, p.name); if (t) out.push(`### ${p.name}`, '', '```', t, '```', ''); }
  return out.join('\n') + '\n';
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const rep = licenseReport(), out = process.argv.find(x => x.startsWith('--out='))?.slice(6);
  if (out) fs.writeFileSync(path.resolve(out), noticesMarkdown(rep));
  console.log(`${rep.ok ? 'PASS' : 'FAIL'} ${rep.packages.length} pachete ${JSON.stringify(rep.counts)}; fonturi ${rep.fonts.length}`); for (const p of rep.problems) console.log(`  ${p.code} ${p.package || p.font} ${p.license || ''}`);
  process.exit(rep.ok ? 0 : 1);
}
