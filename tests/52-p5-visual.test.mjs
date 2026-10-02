// TEST-P5-T03 — mâna greșită a Tiei, trei coarne/pete cu ocluzie, acțiune absentă după reparație, interioare gri
// umplute vs contururi netezite, dezvăluire timpurie și aglomerare pentru vârstă: QA lipsă/învechit/negativ blochează;
// anatomie + acțiune + poveste + lizibilitate și perechea de colorat se verifică împreună.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { api, setFake, waitStatus, connectCanva, approveAll, INPUT, project, ROOT } from './lib.mjs';
import { visualConsistency, pageVisual } from '../server/quality/visual.js';
import { analyzeLineart, judgeLineart } from '../server/pngcheck.js';
import { readZip } from '../server/security/safe-zip.js';

const { PNG } = createRequire(import.meta.url)('pngjs');
const BIBLE = { characters: [
  { id: 'milo', name: 'Milo', anatomy: { holds_objects_with: ['both small hands held close to the chest'], never: ['long fingers'] }, visual_landmarks: [{ id: 'spot-left-upper', occlusion_rule: 'Brațul stâng poate acoperi pata.' }, { id: 'tail-stripe' }] },
  { id: 'tia', name: 'Tia', anatomy: { holds_objects_with: ['mouth/beak', 'balanced on the horns'], never: ['human-like hands', 'fingers'] }, visual_landmarks: [{ id: 'horn-brow-left', occlusion_rule: 'Un corn poate fi ascuns de perspectivă.' }, { id: 'horn-nose' }] }] };
const CONTRACT = { actions: [{ character: 'tia', action: 'holds the leaf stem in her mouth' }], must_not_show: ['pebble'] };
const base = { ok: true, anatomy: true, action: true, story: true, readability: true, issues: [] };

test('P5-T03: mâna greșită a Tiei contrazice verdictul „ok” și anatomia; botul este corect', () => {
  const bad = visualConsistency({ ...base, holds: [{ character: 'tia', object: 'leaf', with: 'right hand' }] }, { contract: CONTRACT, bible: BIBLE });
  assert.deepEqual(bad.failed.sort(), ['action', 'anatomy']); assert.match(bad.issues[0], /Tia ține/);
  assert.deepEqual(visualConsistency({ ...base, holds: [{ character: 'tia', object: 'leaf', with: 'mouth' }, { character: 'milo', object: 'pebble', with: 'both hands' }] }, { contract: { actions: [] }, bible: BIBLE }).failed, [], 'Milo poate ține cu mâinile (permis explicit)');
  assert.ok(visualConsistency({ ...base, holds: [{ character: 'tia', object: 'pebble', with: 'mouth' }] }, { contract: CONTRACT, bible: BIBLE }).failed.includes('action'), 'Tia trebuia să țină frunza');
});

test('P5-T03: repere numărabile cu ocluzie — ascuns doar unde canonul permite; lipsa contrazice „ok”', () => {
  const ok = visualConsistency({ ...base, landmarks: [{ character: 'tia', id: 'horn-brow-left', visible: 'occluded' }, { character: 'tia', id: 'horn-nose', visible: true }, { character: 'milo', id: 'spot-left-upper', visible: 'occluded' }] }, { bible: BIBLE });
  assert.deepEqual(ok.failed, []);
  assert.ok(visualConsistency({ ...base, landmarks: [{ character: 'tia', id: 'horn-nose', visible: 'occluded' }] }, { bible: BIBLE }).failed.includes('anatomy'), 'cornul nazal nu are regulă de ocluzie');
  assert.ok(visualConsistency({ ...base, landmarks: [{ character: 'milo', id: 'tail-stripe', visible: false }] }, { bible: BIBLE }).failed.includes('anatomy'));
});

test('P5-T03: dezvăluire timpurie și aglomerare pentru vârstă', () => {
  assert.ok(visualConsistency({ ...base, visible: ['milo', 'the pebble'] }, { contract: CONTRACT }).failed.includes('story'));
  assert.ok(visualConsistency({ ...base, focal_count: 5 }, { ageProfile: { max_focal: 2 } }).failed.includes('readability'));
  assert.deepEqual(visualConsistency({ ...base, focal_count: 2, visible: ['milo', 'tia'] }, { contract: CONTRACT, ageProfile: { max_focal: 2 } }).failed, []);
});

const png = draw => { const w = 200, h = 200, p = new PNG({ width: w, height: h }); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = draw(x, y); const i = (y * w + x) * 4; p.data[i] = p.data[i + 1] = p.data[i + 2] = v; p.data[i + 3] = 255; } return PNG.sync.write(p); };
test('P5-T03: contururi netezite sunt tolerate; interioarele gri umplute nu (fără desaturare sau binar orb)', () => {
  const ring = (x, y) => { const d = Math.hypot(x - 100, y - 100); return Math.abs(d - 60) < 2 ? 0 : Math.abs(d - 60) < 3.5 ? 140 : 255; };
  const anti = judgeLineart(analyzeLineart(png(ring)), '3-4'); assert.equal(anti.ok, true, JSON.stringify(anti));
  const filled = judgeLineart(analyzeLineart(png((x, y) => (Math.hypot(x - 100, y - 100) < 50 ? 160 : ring(x, y)))), '3-4');
  assert.equal(filled.ok, false); assert.ok(filled.issues.some(i => /gri/.test(i)));
  const colour = new PNG({ width: 50, height: 50 }); for (let i = 0; i < colour.data.length; i += 4) { colour.data[i] = 220; colour.data[i + 1] = 40; colour.data[i + 2] = 40; colour.data[i + 3] = 255; }
  assert.ok(judgeLineart(analyzeLineart(PNG.sync.write(colour)), '3-4').issues.some(i => /culoare/.test(i)));
});

test('P5-T03: QA lipsă, învechit sau negativ blochează; perechea color/colorat se verifică împreună; culoarea bună rămâne la eșecul liniei', () => {
  const good = { color: 'images/c.png', qa: { ok: true, color: 'images/c.png', safety: 'pass' }, lineart: 'images/l.bw.png', lineFrom: 'images/c.png', lineQA: { ok: true, for: 'images/l.bw.png' } };
  assert.equal(pageVisual({ c: good }).ok, true);
  assert.equal(pageVisual({ c: null }).missing, true);
  assert.match(pageVisual({ c: { ...good, qa: undefined } }).reasons[0], /QA vizual lipsă/);
  assert.ok(pageVisual({ c: { ...good, qa: { ...good.qa, color: 'images/vechi.png' } } }).reasons.some(r => /învechit/.test(r)));
  assert.ok(pageVisual({ c: { ...good, qa: { ok: false, failed: ['action'], color: 'images/c.png' } } }).reasons.some(r => /negativ: action/.test(r)), 'acțiune absentă după reparație');
  assert.ok(pageVisual({ c: { ...good, lineFrom: 'images/alta.png' } }).reasons.some(r => /altă imagine color/.test(r)));
  assert.ok(pageVisual({ c: { ...good, lineQA: { ok: true, for: 'images/alt-fișier.png' } } }).reasons.some(r => /alt fișier/.test(r)));
  const lineFail = pageVisual({ c: { ...good, lineart: null, linePending: true } });
  assert.equal(lineFail.ok, false); assert.equal(lineFail.qa.ok, true, 'culoarea bună este păstrată'); assert.ok(lineFail.reasons.every(r => /colorat/.test(r)));
});

test('P5-T03 Dinosaur World: fără ilustrații pagina nu trece — referințele nu certifică; scena p9 (botul Tiei) este obligatorie în contract', () => {
  const doc = JSON.parse([...readZip(fs.readFileSync(path.join(ROOT, 'reference/dinosaur-world-v04/dinosaur-world-proiect.v04.zip')))].find(([k]) => k.endsWith('/project.json'))[1].toString());
  for (let p = 0; p <= 12; p++) { const r = pageVisual({ c: doc.artifacts[`ill_0_${p}`]?.content }); assert.equal(r.ok, false); assert.equal(r.missing, true); }
  assert.equal((doc.project.refs || []).length, 2, 'referințele există, dar nu certifică paginile');
  const p9 = doc.artifacts.script_0.content.pages[8];
  assert.ok(p9.actions.some(a => a.character === 'tia' && /mouth/.test(a.action)), 'p9: Tia ține frunza cu botul');
  const wrong = visualConsistency({ ...base, holds: [{ character: 'tia', object: 'broad-leaf', with: 'hand' }] }, { contract: { actions: p9.actions }, bible: doc.artifacts.bible.content });
  assert.ok(wrong.failed.includes('anatomy'), 'o viitoare imagine p9 cu mâna ar fi respinsă');
});

test('P5-T03 API: mâna greșită raportată de QA → redesenare și reverificare completă; pagina trece doar cu perechea validă', async () => {
  setFake({}); if (!(await api('GET', 'state')).body.services.canva.connected) await connectCanva().catch(() => null);
  for (const p of (await api('GET', 'state')).body.projects) await api('POST', `projects/${p.id}/stop`);
  const id = (await api('POST', 'projects', { typeSlug: 'kids-sc', input: { ...INPUT, title: 'Vizual P5' } })).body.id;
  await api('POST', `projects/${id}/start`); await waitStatus(id, ['awaiting_review']); await approveAll(id);
  await waitStatus(id, ['awaiting_review']); setFake({ qaWrongHand: true }); await approveAll(id);
  const p = await waitStatus(id, ['awaiting_review']); assert.equal(p.gate.key, 'review_2');
  const d = await project(id); const redrawn = Object.entries(d.artifacts).filter(([k, a]) => /^ill_0_/.test(k) && a.content.qa?.redrawn);
  assert.ok(redrawn.length >= 1, 'pagina cu mâna greșită a fost redesenată'); const [, a] = redrawn[0];
  assert.equal(a.content.qa.ok, true); assert.equal(a.content.qa.color, a.content.color, 'verdictul final privește imaginea curentă');
  const vis = (await api('GET', `projects/${id}/visual/1`)).body; assert.ok(vis.pages.filter(x => x.page > 0).every(x => x.ok), JSON.stringify(vis.pages.filter(x => !x.ok).slice(0, 2)));
  assert.ok(Object.values(d.artifacts).filter(x => x.content?.lineQA).every(x => x.content.lineQA.for === x.content.lineart), 'verificarea colorării este legată de fișierul ei');
  setFake({}); await api('POST', `projects/${id}/stop`); await api('POST', `projects/${id}/archive`, { archived: true });
});
