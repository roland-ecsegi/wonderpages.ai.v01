/**
 * P5-T03 — visual and coloring quality (OUTPUT-13 Visual layer, RK09/RK14 SURPASS).
 * The art director's verdict is checked for CONSISTENCY against the page contract and the canon (fail-closed):
 *  - landmarks: each reported landmark is visible, or "occluded" only where the canon defines an occlusion rule;
 *    a missing landmark contradicts ok:true;
 *  - holding: who holds what and with which body part must match the anatomy (e.g. Tia never with a hand);
 *  - sequence: nothing from the page's must_not_show (early reveal) may be visible;
 *  - clutter: the number of focal elements must not exceed the age profile.
 * A page passes only when color QA (all four dimensions + safety) AND the coloring page (derived from the CURRENT color,
 * its own line QA bound to the current file) pass together; dimensions are measured on the real files.
 * Anti-aliased contours are tolerated; grey filled interiors are not (pngcheck.judgeLineart).
 */
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const HAND = /(?<![a-z])(hands?|fingers?|paws? held like hands|palm|mana|maini|degete)(?![a-z])/;
export const DIMENSIONS = Object.freeze(['anatomy', 'action', 'story', 'readability']);

export function visualConsistency(r, { contract = {}, bible = null, ageProfile = {} } = {}) {
  const failed = new Set(), issues = [];
  const chars = new Map((bible?.characters || []).map(c => [c.id, c]));
  for (const l of Array.isArray(r?.landmarks) ? r.landmarks : []) {
    const c = chars.get(l.character), def = (c?.visual_landmarks || []).find(x => x.id === l.id);
    if (l.visible === false) { failed.add('anatomy'); issues.push(`Reperul ${l.id} al lui ${c?.name || l.character} lipsește.`); }
    else if (l.visible === 'occluded' && !def?.occlusion_rule) { failed.add('anatomy'); issues.push(`Reperul ${l.id} este declarat ascuns, dar canonul nu permite ocluzia lui.`); }
  }
  for (const h of Array.isArray(r?.holds) ? r.holds : []) {
    const c = chars.get(h.character), allowed = norm((c?.anatomy?.holds_objects_with || []).join(' ')), never = norm((c?.anatomy?.never || []).join(' '));
    if (HAND.test(norm(h.with)) && !HAND.test(allowed) && (/hand|finger|grasp|mana|degete/.test(never) || allowed)) { failed.add('anatomy'); failed.add('action'); issues.push(`${c?.name || h.character} ține ${h.object || 'obiectul'} cu ${h.with}; anatomia permite: ${(c?.anatomy?.holds_objects_with || []).join(', ')}.`); }
    const want = (contract.actions || []).find(a => a.character === h.character && /hold|carr|tine|duce|poarta/.test(norm(a.action)));
    if (want && h.object && !norm(want.action).includes(norm(h.object).split('-')[0])) { failed.add('action'); issues.push(`Contractul paginii cere ca ${c?.name || h.character} să țină altceva („${want.action}”).`); }
  }
  const visible = (Array.isArray(r?.visible) ? r.visible : []).map(norm);
  for (const x of contract.must_not_show || []) if (x && visible.some(v => v.includes(norm(x)) || norm(x).includes(v))) { failed.add('story'); issues.push(`„${x}” este vizibil înainte de dezvăluire.`); }
  const maxFocal = Number(ageProfile?.max_focal) || null;
  if (maxFocal && Number.isFinite(r?.focal_count) && r.focal_count > maxFocal) { failed.add('readability'); issues.push(`${r.focal_count} elemente de atenție; vârsta suportă cel mult ${maxFocal}.`); }
  return { failed: [...failed], issues };
}

/** One page: color QA + coloring page + real dimensions; reasons explain every block. */
export function pageVisual({ c, contractHash = null, size = null, lineSize = null, format = {}, minShortSide = null, requireLine = true }) {   // pixel/print readiness is P6 (effective DPI); here only when asked
  const reasons = [];
  if (!c?.color) return { ok: false, missing: true, reasons: ['Ilustrația lipsește (referințele singure nu certifică o pagină).'] };
  const qa = c.qa;
  if (!qa) reasons.push('QA vizual lipsă.');
  else {
    if (qa.color && qa.color !== c.color) reasons.push('QA vizual este pentru altă imagine (învechit).');
    if (qa.ok !== true) reasons.push('QA vizual negativ: ' + ((qa.failed || []).join(', ') || (qa.issues || []).join('; ') || 'nespecificat'));
    if (qa.safety && qa.safety !== 'pass') reasons.push('Siguranța imaginii nu este PASS.');
  }
  if (size && minShortSide) {
    if (Math.min(size.width, size.height) < minShortSide) reasons.push(`Rezoluție ${size.width}×${size.height}: latura scurtă < ${minShortSide} px.`);
    const want = format.trim_w_in && format.trim_h_in ? format.trim_w_in / format.trim_h_in : null;
    if (want && Math.abs(size.width / size.height - want) / want > 0.03) reasons.push(`Raport ${(size.width / size.height).toFixed(3)} diferit de format (${want.toFixed(3)}).`);
  }
  if (requireLine) {
    if (!c.lineart || c.linePending) reasons.push('Pagina de colorat lipsește (culoarea bună se păstrează).');
    else {
      if (c.lineFrom && c.lineFrom !== c.color) reasons.push('Pagina de colorat provine dintr-o altă imagine color (învechită).');
      if (!c.lineQA) reasons.push('Verificarea paginii de colorat lipsește.');
      else { if (c.lineQA.ok !== true) reasons.push('Pagina de colorat: ' + (c.lineQA.issues || []).join('; ')); if (c.lineQA.for && c.lineQA.for !== c.lineart) reasons.push('Verificarea paginii de colorat este pentru alt fișier (învechită).'); }
      if (size && lineSize && (lineSize.width !== size.width || lineSize.height !== size.height) && Math.abs(lineSize.width / lineSize.height - size.width / size.height) > 0.02) reasons.push('Perechea color/colorat are proporții diferite.');
    }
  }
  return { ok: !reasons.length, reasons, qa: qa ? { ok: qa.ok, failed: qa.failed || [], safety: qa.safety || null, bound: !qa.color || qa.color === c.color } : null, line: c.lineart ? { ok: c.lineQA?.ok === true, metrics: c.lineQA?.metrics || null, normalized: !!c.lineQA?.normalized } : null, size, contractHash };
}
