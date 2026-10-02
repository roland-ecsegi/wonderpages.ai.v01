/**
 * P1-T02/P1-T05 — read-only verification of the Dinosaur World reference archive (OUTPUT-28).
 * Verifies the PROJECT-MANIFEST (bytes + sha256 per entry), counts the protected baseline
 * (6 artifacts, 6 volumes, 72 page plans, 12 prepared manuscript pages, 2 reference images) and
 * detects the documented findings DW01–DW07. It never writes, imports or starts production.
 */
import { readZip, pngSize } from '../security/safe-zip.js';
import { sha256, canonicalHash } from '../domain/canonical.js';
import { contractFromBlueprint, validateContract, validateProjectInput } from '../domain/product-contract.js';

const words = s => String(s || '').trim().split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
const RAIN_PEBBLE = /feresc de ploaie|protect.*pebble.*rain|pebble.*from.*rain/i;

export function readDinosaurWorld(zipBuf, { currentBlueprint = null } = {}) {
  const files = readZip(zipBuf);
  const rootName = [...files.keys()].find(k => /(^|\/)PROJECT-MANIFEST\.json$/.test(k));
  if (!rootName) throw { status: 400, code: 'dw_manifest_missing', message: 'Arhiva nu conține PROJECT-MANIFEST.json.' };
  const root = rootName.slice(0, rootName.length - 'PROJECT-MANIFEST.json'.length);
  const manifest = JSON.parse(files.get(rootName).toString('utf8'));
  const entries = (manifest.files || []).map(f => { const b = files.get(root + f.path); return { path: f.path, present: !!b, bytesMatch: !!b && b.length === f.bytes, sha256Match: !!b && sha256(b) === f.sha256 }; });
  const doc = JSON.parse(files.get(root + 'project.json').toString('utf8'));
  const A = doc.artifacts || {}, series = A.series?.content, script = A.script_0?.content, bible = A.bible?.content;
  const images = (doc.project?.refs || []).map(r => { const b = files.get(root + 'files/' + r.file); const size = b ? pngSize(b) : null; return { file: r.file, sha256: b ? sha256(b) : null, bytes: b?.length ?? null, pixels: size ? [size.width, size.height] : null }; });
  const contract = contractFromBlueprint(doc.blueprint);
  const counts = {
    artifacts: Object.keys(A).sort(),
    volumes: series?.volumes?.length ?? 0,
    pagePlans: (series?.volumes || []).reduce((n, v) => n + (v.page_plan?.length || 0), 0),
    preparedManuscriptPages: script?.pages?.length ?? 0,
    images: images.length,
    wordCounts: { manifest: manifest.word_counts || null, whitespaceTokens: { English: (script?.pages || []).reduce((n, p) => n + words(p.text), 0), Romanian: (script?.pages || []).reduce((n, p) => n + words(p.text_ro), 0) } }
  };
  return {
    archiveSha256: sha256(zipBuf), edition: manifest.edition, root,
    manifest: { entries, allMatch: entries.length > 0 && entries.every(e => e.bytesMatch && e.sha256Match) },
    counts, images,
    project: { status: doc.project?.status, approvalsEmpty: !Object.keys(doc.project?.approvals || {}).length, decisionsEmpty: !(doc.project?.decisions || []).length, deliveriesEmpty: !Object.keys(doc.project?.delivered || {}).length, ages: [...new Set((series?.volumes || []).map(v => v.age_profile))], languages: doc.project?.input?.languages, format: doc.project?.input?.page_format, style: doc.project?.input?.visual_style },
    contract: { valid: validateContract(contract).valid, input: validateProjectInput(contract, doc.project?.input || {}), contractHash: contract.contractHash, blueprintVersion: contract.blueprintVersion },
    customPrompts: currentBlueprint ? Object.keys({ ...currentBlueprint.prompts, ...doc.blueprint.prompts }).filter(k => canonicalHash(currentBlueprint.prompts?.[k] ?? null) !== canonicalHash(doc.blueprint.prompts?.[k] ?? null)).sort() : null,
    findings: dwFindings(doc),
    doc
  };
}

/** DW01–DW07 as evidence records; status VERIFIED only when the data shows it. */
export function dwFindings(doc) {
  const A = doc.artifacts || {}, v0 = A.series?.content?.volumes?.[0], script = A.script_0?.content, bible = A.bible?.content;
  const out = [];
  const premises = [['series.volumes[0].summary', v0?.summary], ['series.volumes[0].story_bible.premise', v0?.story_bible?.premise], ['script_0.story_bible.premise', script?.story_bible?.premise]];
  const stale = premises.filter(([, t]) => RAIN_PEBBLE.test(t || ''));
  const shelter = [8, 9].map(n => script?.pages?.find(p => p.n === n)?.text || '').join(' ');
  out.push({ id: 'DW01', status: stale.length && /two friends|roof for two|Underneath/i.test(shelter) ? 'VERIFIED' : 'NOT_OBSERVED', title: 'Premisă reziduală „protejarea pietrei de ploaie” vs paginile 8–9 (adăpostul prietenilor)', evidence: stale.map(([f]) => f), count: stale.length });
  const plan = (v0?.page_plan || []).map(p => p.turn?.type), scr = (script?.pages || []).map(p => p.turn?.type);
  const diverge = plan.map((t, i) => (t !== scr[i] ? i + 1 : null)).filter(Boolean);
  out.push({ id: 'DW02', status: plan.length && plan.every(t => t === 'quiet') && diverge.length ? 'VERIFIED' : 'NOT_OBSERVED', title: 'turn.type din page_plan V1 este „quiet” peste tot; scriptul diferă', evidence: diverge.map(n => `p${n}: plan=${plan[n - 1]} script=${scr[n - 1]}`), count: diverge.length });
  const lm = (bible?.characters || []).flatMap(c => (c.visual_landmarks || []).map(l => ({ c: c.id, l })));
  const jsonSizes = lm.filter(({ l }) => typeof l.relative_size === 'string' && /^\s*\{/.test(l.relative_size));
  const repeated = (bible?.characters || []).filter(c => (c.visual_landmarks || []).some(l => l.id && String(c.canonical_description || '').includes(String(l.anchor || '').slice(0, 30))));
  out.push({ id: 'DW03', status: lm.length && jsonSizes.length ? 'VERIFIED' : 'NOT_OBSERVED', title: 'landmarks structurate, repetate în canonical_description; relative_size poate fi JSON string', evidence: jsonSizes.map(({ c, l }) => `${c}.${l.id}`), count: jsonSizes.length, repeatedInDescription: repeated.map(c => c.id) });
  const milo = bible?.characters?.find(c => c.id === 'milo'), tia = bible?.characters?.find(c => c.id === 'tia'), feather = bible?.objects?.find(o => o.id === 'found-feather');
  const tiaMouth = /mouth/i.test(script?.pages?.find(p => p.n === 9)?.text || '');
  out.push({ id: 'DW04', status: milo?.species_certainty === 'indeterminate_stylized' && tiaMouth && feather ? 'VERIFIED' : 'NOT_OBSERVED', title: 'Milo species-indeterminate; Tia folosește botul pentru frunză; pana lui Pip este obiect', evidence: [`milo.species_certainty=${milo?.species_certainty}`, `p9 mouth=${tiaMouth}`, `object=${feather?.id}`, `tia.species_certainty=${tia?.species_certainty}`] });
  const missingScripts = Array.from({ length: 6 }, (_, v) => v).filter(v => !A[`script_${v}`]);
  const art = Object.keys(A).filter(k => /^(ill_|final_|tr_|delivery_)/.test(k));
  out.push({ id: 'DW05', status: missingScripts.length === 5 && !art.length ? 'VERIFIED' : 'NOT_OBSERVED', title: 'Lipsesc manuscrise V2–6, atlas nou, artă, lineart și exporturi', evidence: [`script lipsă: V${missingScripts.map(v => v + 1).join(',V')}`, `artefacte finale: ${art.length}`], visualBaseline: 'NOT_AVAILABLE' });
  out.push({ id: 'DW06', status: 'INFERRED', title: 'Unele planuri pot avea diferențiere insuficientă în finaluri/beat-uri', evidence: (A.series?.content?.volumes || []).map(v => `V${v.number}: ${v.ending_type}`), note: 'Se evaluează prin matricea de colecție (P4-T02/P5-T04); nu se declară defect din planuri.' });
  out.push({ id: 'DW07', status: doc.project?.status === 'ready' && !Object.keys(doc.project?.approvals || {}).length ? 'VERIFIED' : 'NOT_OBSERVED', title: 'Import ready, aprobări goale; custom prompts și ref-uri originale', evidence: [`status=${doc.project?.status}`, `approvals=${Object.keys(doc.project?.approvals || {}).length}`, `refs=${(doc.project?.refs || []).length}`] });
  return out;
}
