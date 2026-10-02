export const PRINT_PROFILES = {
  digital: { key: 'digital', minDpi: 0, separateCover: false },
  kdp: { key: 'kdp', minDpi: 300, bleedIn: 0.125, minPages: 24, separateCover: true }
};
export function physicalPages(count, bookMode, profile = 'digital', backCover = true) {
  if (!Number.isInteger(count) || count < 1) throw Error('Număr de scene invalid.');
  if (profile !== 'kdp') return [0, ...Array.from({ length: count }, (_, i) => i + 1), ...(backCover ? ['back'] : [])].map(pg => ({ pg, mode: bookMode }));
  if (bookMode === 'combined') return [{pg:'title',mode:'color'},{pg:'copyright',mode:'color'},...Array.from({length:count},(_,i)=>({pg:i+1,mode:'color'})),...Array.from({length:count},(_,i)=>({pg:i+1,mode:'lineart'}))];
  if (bookMode === 'lineart') return [{ pg: 'title', mode: bookMode }, { pg: 'copyright', mode: bookMode }, ...Array.from({ length: count }, (_, i) => [{ pg: i + 1, mode: bookMode }, { pg: 'blank', mode: bookMode }]).flat()];
  return [{ pg: 'title', mode: bookMode }, { pg: 'copyright', mode: bookMode }, { pg: 'characters', mode: bookMode }, ...Array.from({ length: count }, (_, i) => [{ pg: i + 1, mode: bookMode, illustrationOnly: true }, { pg: i + 1, mode: bookMode, textOnly: true }]).flat(), { pg: 'reflection', mode: bookMode }];
}
export function printDimensions(format, profile) {
  if (!(format?.trim_w_in > 0 && format?.trim_h_in > 0)) throw Error('Format invalid.');
  const p = PRINT_PROFILES[profile] || PRINT_PROFILES.digital;
  return { width: format.trim_w_in + (p.bleedIn || 0), height: format.trim_h_in + 2 * (p.bleedIn || 0), minDpi: p.minDpi, profile: p.key };
}

/* ---------------- P6-T04: versioned print profiles with dated rules and explicit page semantics ---------------- */
/** Rules recorded from the public KDP documentation cited in ADR04; dated, re-checked before any publication (U08). */
export const PROFILE_RULES = Object.freeze({
  version: 1, recordedAt: '2026-10-02', recheckBeforePublishing: true,
  sources: ['https://kdp.amazon.com/en_US/help/topic/G201857950', 'https://kdp.amazon.com/en_US/help/topic/GX56BFPW4BKNPGFW', 'https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6'],
  kdp: {
    bleedIn: 0.125,                                                   // outside edges only: width + 0.125, height + 0.25
    ink: { bw: { minPages: 24, label: 'alb-negru' }, premium_color: { minPages: 24, label: 'color premium' }, standard_color: { minPages: 72, label: 'color standard' } },
    paperIn: { bw: { white: 0.002252, cream: 0.0025 }, premium_color: { white: 0.002347 }, standard_color: { white: 0.002252 } },   // thickness per page
    gutterIn: [[24, 150, 0.375], [151, 300, 0.5], [301, 500, 0.625], [501, 700, 0.75], [701, 828, 0.875]],
    outsideMarginIn: 0.375, spineTextMinPages: 80, coverBleedIn: 0.125
  }
});
export const PROFILE_VERSIONS = Object.freeze({
  digital: { key: 'digital', version: 1, semantics: 'strict12', destination: 'digital', covers: 'in_book', colour: 'RGB', explicitOptIn: false },
  print: { key: 'print', version: 1, semantics: 'strict12', destination: 'generic_print', covers: 'in_book', colour: 'RGB', certified: false, note: 'Tipar generic: nu este certificat CMYK/PDF-X.' },
  kdp: { key: 'kdp', version: 1, semantics: 'legacy-scene-expansion', destination: 'kdp_paperback', covers: 'separate_wrap', colour: 'RGB', explicitOptIn: true, requiresApproval: true, rules: 1 }
});
const role = x => (typeof x.pg === 'number' ? (x.pg === 0 ? 'front_cover' : x.illustrationOnly ? 'illustration' : x.textOnly ? 'text' : 'content') : String(x.pg));
/** Physical page → canonical page, with side (physical 1 = recto) and spread (pairs 2-3, 4-5, …). */
export function pageMap(count, book, profile = 'digital') {
  return physicalPages(count, book.mode, profile === 'kdp' ? 'kdp' : 'digital', book.back_cover).map((x, i) => {
    const physical = i + 1; return { physical, canonical: typeof x.pg === 'number' && x.pg > 0 ? x.pg : null, role: role(x), mode: x.mode, side: physical % 2 ? 'recto' : 'verso', spread: Math.floor(physical / 2) };
  });
}
/** A question/hook whose payoff becomes visible on the same physical spread after mapping is a leak (P4-T03 turn contract). */
export function spreadLeaks(map, blueprints = []) {
  const spreadsOf = n => new Set(map.filter(m => m.canonical === n).map(m => m.spread)), out = [];
  for (const b of blueprints) {
    const pay = b?.turn?.payoffPage; if (!pay || !(String(b.turn.hook || '').trim() || ['question', 'hook', 'reveal_setup', 'suspense', 'cliffhanger'].includes(b.turn.type))) continue;
    const a = spreadsOf(b.page), c = spreadsOf(pay), shared = [...a].filter(s => c.has(s));
    if (shared.length) out.push({ code: 'SPREAD_LEAK', page: b.page, payoffPage: pay, spread: shared[0], message: `Răspunsul de la pagina ${pay} se vede pe aceeași deschidere fizică cu întrebarea de la pagina ${b.page} în această mapare.` });
  }
  return out;
}
const gutterFor = n => (PROFILE_RULES.kdp.gutterIn.find(([a, b]) => n >= a && n <= b) || [0, 0, null])[2];
/** Compatibility of a book with a destination, measured on the mapping (never "ready": readiness needs P6-T05 measurements). */
export function destinationCheck({ count, book, profile, ink = null, paper = 'white', approval = null, blueprints = [] }) {
  const pv = PROFILE_VERSIONS[profile]; if (!pv) return { profile, compatible: false, status: 'unknown_profile', reasons: ['Profil necunoscut.'] };
  const map = pageMap(count, book, profile), n = map.length, reasons = [], R = PROFILE_RULES.kdp;
  const out = { profile, version: pv.version, semantics: pv.semantics, destination: pv.destination, physicalPages: n, canonicalContentPages: count, covers: pv.covers, colour: pv.colour, map, mapHash: null, leaks: spreadLeaks(map, blueprints), rules: { version: PROFILE_RULES.version, recordedAt: PROFILE_RULES.recordedAt } };
  out.mapHash = map.map(m => `${m.physical}:${m.canonical ?? m.role}:${m.mode}`).join('|');
  if (pv.destination !== 'kdp_paperback') return { ...out, compatible: true, status: 'compatible_unverified', kdpCompatible: false, reasons: [`${pv.semantics}: ${n} pagini fizice (${count} de conținut + coperți în carte). Nu este un interior KDP (minim ${R.ink.bw.minPages} pagini).`, ...(pv.note ? [pv.note] : [])] };
  const inkKey = ink || (book.mode === 'lineart' ? 'bw' : 'premium_color'), inkRule = R.ink[inkKey];
  if (!inkRule) return { ...out, compatible: false, status: 'unknown_ink', reasons: ['Tip de cerneală necunoscut.'] };
  const thickness = R.paperIn[inkKey]?.[paper]; if (!thickness) reasons.push(`Hârtia „${paper}” nu este disponibilă pentru ${inkRule.label}.`);
  if (n < inkRule.minPages) reasons.push(`${n} pagini fizice sub minimul de ${inkRule.minPages} pentru ${inkRule.label}${inkKey === 'standard_color' ? ' (nu se folosește color standard pentru o carte scurtă)' : ''}.`);
  if (book.mode === 'color' && inkKey === 'bw') reasons.push('Cartea color nu se tipărește alb-negru.');
  const spineIn = thickness ? +(n * thickness).toFixed(4) : null;
  const cover = { separate: true, spineIn, spineText: n >= R.spineTextMinPages, bleedIn: R.coverBleedIn };
  const compatible = !reasons.length, approved = !!(approval && approval.mapHash === out.mapHash && approval.ink === inkKey && approval.paper === paper && approval.version === pv.version);
  if (compatible && !approved) reasons.push('Prezentarea legacy-scene-expansion (Poveste 28 / Colorat 26) cere aprobarea ta explicită; cele 12 pagini canonice nu se schimbă.');
  return { ...out, ink: inkKey, paper, gutterIn: gutterFor(n), outsideMarginIn: R.outsideMarginIn, bleedIn: R.bleedIn, cover, approved, compatible, status: !compatible ? 'incompatible' : approved ? 'approved_unverified' : 'requires_approval', reasons };
}
export function coverWrap(format, check) { if (check?.cover?.spineIn == null) return null; const b = check.cover.bleedIn; return { widthIn: +(format.trim_w_in * 2 + check.cover.spineIn + b * 2).toFixed(4), heightIn: +(format.trim_h_in + b * 2).toFixed(4), spineIn: check.cover.spineIn, spineText: check.cover.spineText }; }
