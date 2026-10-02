/**
 * P1-T05 — RightsRecord and source evidence register (OUTPUT-27).
 *
 * "Uploaded" does not prove ownership; "generated" does not prove exclusivity. A subject is `cleared` for
 * commercial release only with an explicit source, commercial + reproduction + derivative permission and no
 * expiry. Anything else (unknown, expired, restricted, missing record) BLOCKS commercial release but never blocks
 * internal editing. Dependency licences are read from the shipped lockfile, not assumed from package names.
 */
import fs from 'node:fs';
import path from 'node:path';
import { sha256 } from './canonical.js';

export const RIGHTS_SCHEMA = 'wonderpages.rights-record/1';
const YES = 'yes', NO = 'no', UNK = 'unknown';
const PERMISSIVE = /^(\(?)(MIT|ISC|Apache-2\.0|BSD-2-Clause|BSD-3-Clause|0BSD|OFL-1\.1)( OR (MIT|ISC|Apache-2\.0|MPL-2\.0|BSD-3-Clause))*(\)?)$/;

export function rightsRecord(r) {
  const p = r.permissions || {};
  return {
    schema: RIGHTS_SCHEMA, id: String(r.id), subject: { kind: r.subject?.kind || 'unknown', ref: r.subject?.ref || null, sha256: r.subject?.sha256 || null },
    source: r.source || null, owner: r.owner || null, grant: r.grant || UNK,
    permissions: { commercial: p.commercial || UNK, reproduction: p.reproduction || UNK, derivative: p.derivative || UNK },
    attribution: r.attribution || null, territory: r.territory || null, expiresAt: r.expiresAt || null,
    terms: r.terms || null, providerContext: r.providerContext || null, reviewer: r.reviewer || null, reviewedAt: r.reviewedAt || null, notes: r.notes || null
  };
}
export function rightsStatus(rec, now = Date.now()) {
  if (!rec) return { status: 'missing', reasons: ['Nu există RightsRecord.'] };
  const reasons = [];
  if (rec.expiresAt && Number(new Date(rec.expiresAt)) <= now) return { status: 'expired', reasons: ['Dreptul de folosire a expirat.'] };
  if (!rec.source) reasons.push('Sursa nu este documentată.');
  const perms = rec.permissions || {};
  if ([perms.commercial, perms.reproduction, perms.derivative].includes(NO)) return { status: 'restricted', reasons: ['Licența interzice o folosire necesară (comercial / reproducere / derivate).'] };
  for (const k of ['commercial', 'reproduction', 'derivative']) if (perms[k] !== YES) reasons.push(`Permisiunea „${k}” este necunoscută.`);
  if (rec.licenseTextPresent === false) reasons.push('Textul licenței lipsește din pachetul distribuit.');
  return reasons.length ? { status: 'unknown', reasons } : { status: 'cleared', reasons: [] };
}
/** Commercial release gate: every required subject needs a cleared record. */
export function commercialReleaseCheck(records, required, now = Date.now()) {
  const byRef = new Map(records.map(r => [r.subject?.ref || r.id, r]));
  const items = required.map(ref => ({ ref, ...rightsStatus(byRef.get(ref), now) }));
  const blockers = items.filter(i => i.status !== 'cleared');
  return { eligible: !blockers.length, blockers, items, note: 'Necunoscut/expirat/restricționat blochează lansarea comercială; editarea internă rămâne permisă.' };
}
export const editingAllowed = () => ({ allowed: true, note: 'Drepturile necunoscute nu blochează editarea internă.' });

/** Application-level inventory: fonts and dependencies actually shipped (lockfile + font folder). */
export function appRightsInventory(root) {
  const recs = [];
  const fonts = path.join(root, 'public', 'fonts');
  const has = f => fs.existsSync(path.join(fonts, f));
  for (const f of fs.existsSync(fonts) ? fs.readdirSync(fonts).filter(x => /\.(ttf|otf|woff2?)$/i.test(x)) : []) {
    const family = f.replace(/-(Regular|Bold|Italic|BoldItalic)\.\w+$/, '');
    const licenseFile = ['OFL.txt', `OFL-${family}.txt`, `LICENSE-${family}.txt`].find(has) || null;
    const rec = rightsRecord({ id: `font:${f}`, subject: { kind: 'font', ref: `public/fonts/${f}`, sha256: sha256(fs.readFileSync(path.join(fonts, f))) }, source: family === 'Andika' ? 'SIL International via github.com/google/fonts/ofl/andika (README fonturi)' : family === 'InstrumentSans' ? 'Instrument Sans Project Authors' : null, grant: 'licensed', permissions: licenseFile || family === 'Andika' ? { commercial: YES, reproduction: YES, derivative: YES } : {}, attribution: 'SIL Open Font License 1.1', terms: { url: 'https://openfontlicense.org', license: 'OFL-1.1' }, notes: licenseFile ? `licență: ${licenseFile}` : 'Textul OFL nu este inclus în public/fonts; OFL cere ca licența să însoțească fontul redistribuit (încorporarea în PDF este permisă).' });
    rec.licenseTextPresent = !!licenseFile; recs.push(rec);
  }
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  for (const [k, v] of Object.entries(lock.packages || {})) {
    if (!k) continue;
    const lic = v.license || null, ok = lic && PERMISSIVE.test(lic);
    recs.push(rightsRecord({ id: `dep:${k.replace(/^.*node_modules\//, '')}@${v.version}`, subject: { kind: 'dependency', ref: k }, source: v.resolved || 'npm registry', grant: lic ? 'licensed' : UNK, permissions: ok ? { commercial: YES, reproduction: YES, derivative: YES } : {}, attribution: lic, terms: { license: lic }, notes: ok ? null : `Licență ne-standard sau lipsă (${lic || 'nedeclarată'}): verificare manuală.` }));
  }
  const summary = recs.reduce((m, r) => { const s = rightsStatus(r).status; m[s] = (m[s] || 0) + 1; return m; }, {});
  return { records: recs, summary };
}

/** Project-level subjects: uploaded refs, seed manuscript, generated outputs. Operator declarations override defaults. */
export function projectRightsInventory(project, art, declared = []) {
  const byId = new Map(declared.map(d => [d.id, d])), subjects = [];
  for (const r of project.refs || []) subjects.push(rightsRecord(byId.get(`ref:${r.file}`) || { id: `ref:${r.file}`, subject: { kind: 'reference', ref: r.file, sha256: r.sha256 || null }, source: 'încărcat de operator', grant: UNK, notes: 'Încărcarea nu dovedește proprietatea.' }));
  if (project.input?.seed_story) subjects.push(rightsRecord(byId.get('manuscript:seed_story') || { id: 'manuscript:seed_story', subject: { kind: 'manuscript', ref: 'input.seed_story', sha256: sha256(String(project.input.seed_story)) }, source: 'introdus de operator', grant: UNK }));
  for (const key of Object.keys(art || {}).filter(k => /^ill_\d+_\d+$/.test(k)).sort()) subjects.push(rightsRecord(byId.get(`output:${key}`) || { id: `output:${key}`, subject: { kind: 'output', ref: key }, source: 'generat prin canalul abonat al operatorului', grant: 'generated', providerContext: art[key]?.meta?.provider || art[key]?.content?.provider || null, notes: 'Generarea nu dovedește exclusivitate; condițiile canalului se verifică la lansare.' }));
  for (const d of declared) if (!subjects.some(s => s.id === d.id)) subjects.push(rightsRecord(d));
  return subjects;
}
