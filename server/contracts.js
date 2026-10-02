import crypto from 'node:crypto';

export const fileHash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export const fingerprint = value => crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
export function pageSequence(pages, count) {
  return Array.isArray(pages) && pages.length === count && pages.every((p, i) => Number.isInteger(p?.n) && p.n === i + 1);
}
export function sceneFingerprint(page) {
  if (!page) return null;
  const fields = ['scene', 'actions', 'characters', 'objects', 'location', 'effects', 'must_not_show', 'composition', 'emotion', 'image_added_value', 'text_zone', 'storyboard', 'visual_revision'];
  const scene = Object.fromEntries(fields.filter(k => page[k] !== undefined).map(k => [k, page[k]]));
  if (!page.scene) scene.text = page.text;
  return fingerprint(scene);
}
export function rubricEvaluation(reply, bp, stage, threshold) {
  const required = (stage.rubric || (/native/.test(stage.critic_prompt || '') ? [] : bp.rubric) || []).filter(r => r && typeof r === 'object');
  const strict = !!bp.schemas?.critic || Number(bp.version) >= 15 || stage.strict_rubric === true;
  if (!strict && !reply?.criteria && typeof reply?.score === 'number' && Number.isFinite(reply.score) && reply.score >= 0 && reply.score <= 10) return { valid: true, legacy: true, errors: [], score: reply.score, criteria: {}, failedCritical: [], pass: reply.score >= threshold };
  if (!required.length) {
    const valid = typeof reply?.score === 'number' && Number.isFinite(reply.score) && reply.score >= 0 && reply.score <= 10;
    return { valid, errors: valid ? [] : ['Lipsește scorul evaluării.'], score: valid ? reply.score : 0, criteria: {}, failedCritical: [], pass: valid && reply.score >= threshold };
  }
  const expected = new Set(required.map(r => r.code)), seen = new Set(), errors = [], criteria = {};
  for (const r of Array.isArray(reply?.criteria) ? reply.criteria : []) {
    if (!expected.has(r?.code)) errors.push(`Criteriu necunoscut: ${r?.code}.`);
    if (seen.has(r?.code)) errors.push(`Criteriu duplicat: ${r?.code}.`);
    seen.add(r?.code);
    if (typeof r?.score !== 'number' || !Number.isFinite(r.score) || r.score < 0 || r.score > 10) errors.push(`Scor invalid: ${r?.code}.`);
    else criteria[r.code] = r.score;
    if (strict && (typeof r?.evidence !== 'string' || !r.evidence.trim())) errors.push(`Lipsește dovada pentru ${r?.code}.`);
  }
  for (const code of expected) if (!seen.has(code)) errors.push(`Lipsește criteriul ${code}.`);
  const scores = required.map(r => criteria[r.code]).filter(Number.isFinite);
  const score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0;
  const failedCritical = required.filter(r => r.critical && (criteria[r.code] === undefined || criteria[r.code] < (stage.critical_threshold ?? 7))).map(r => r.code);
  return { valid: !errors.length, errors, score, criteria, failedCritical, pass: !errors.length && score >= threshold && !failedCritical.length };
}
export function visualVerdicts(reply, indexes) {
  const pages = reply?.pages;
  if (!Array.isArray(pages) || pages.length !== indexes.length) throw { code: 'validation', message: 'QA vizual incomplet: este necesar un verdict pentru fiecare imagine cerută.' };
  const seen = new Set();
  for (const r of pages) {
    if (!Number.isInteger(r?.image) || !indexes.includes(r.image) || seen.has(r.image)) throw { code: 'validation', message: 'QA vizual: identificator de imagine necunoscut sau duplicat.' };
    seen.add(r.image);
    if (['ok', 'anatomy', 'action', 'story', 'readability'].some(k => typeof r[k] !== 'boolean') || !Array.isArray(r.issues) || r.issues.some(i => typeof i !== 'string')) throw { code: 'validation', message: `QA vizual: verdict incomplet pentru imaginea ${r.image}.` };
  }
  return indexes.map(i => pages.find(r => r.image === i));
}
export function exactCorrection(text, correction) {
  const from = correction?.from, to = correction?.to;
  if (typeof text !== 'string' || typeof from !== 'string' || !from || typeof to !== 'string' || from === to) throw { status: 400, message: 'Corectura exactă necesită textul căutat și înlocuirea.' };
  const matches = text.split(from).length - 1;
  if (matches !== 1) throw { status: 409, message: `Corectură ambiguă: ${matches} apariții. Selectează un fragment unic.` };
  return text.replace(from, to);
}
export function parseExactCorrection(note) {
  const m = String(note || '').match(/(?:înlocuiește|inlocuieste|schimbă|schimba|replace)\s+[„“"«']([^””"»']+)[””"»']\s+(?:cu|în|in|with|→)\s+[„“"«']([^””"»']*)[””"»']/iu);
  return m ? { from: m[1], to: m[2] } : null;
}
