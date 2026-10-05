/**
 * Gold-v1 adjudication probes — the executed probes recorded in docs/enterprise/records/GS.md (OBS-GS-1…20), kept as a
 * regression registry for the hardening. A probe is EVIDENCE, never a gold case (operator rule). `expect` is the
 * direction the operator stated in the records; `expect: null` marks a boundary probe the operator left WITHOUT a label
 * (it is tracked, never scored as pass/fail). `before` results are recorded once, with the pre-hardening evaluators,
 * by `scripts/enterprise/hardening-probes.mjs before` into `evaluation/hardening/probes-before.json` (never rewritten).
 *
 * expect shapes:  safety  { verdict } | { not: 'PASS' | 'BLOCK' }
 *                 age     { signals: [...] }            (codes that must be present)
 *                 local.  { codes: [...] } | { absent: [...] }
 *                 science { rule } | { absent: rule }
 *                 quality { v1: { pass, codes? }, v2: { pass, codes? }, evidence?: [...] }   (codes = reason codes that must be present)
 */
const S = (id, obs, text, age, expect, src) => ({ id, kind: 'safety', obs, input: { text, age }, expect, src });
const L = (id, obs, source, native, names, expect, src) => ({ id, kind: 'localization', obs, input: { source, native, names }, expect, src });
const C = (id, obs, text, expect, src, world = 'natural') => ({ id, kind: 'science', obs, input: { text, world }, expect, src });
const A = (id, obs, page, band, expect, src) => ({ id, kind: 'age', obs, input: { page, band }, expect, src });

export const PROBES = [
  /* ---------- safety: OBS-GS-1 (safety-phrase / negation / order bypasses) ---------- */
  S('P-S01', ['OBS-GS-1'], 'Milo plays with matches with a grown-up.', '3-4', { not: 'PASS' }, 'GS.md OBS-GS-1 tabel: „with a grown-up” anulează regula (bypass)'),
  S('P-S02', ['OBS-GS-1'], "Milo doesn't care and plays with matches near the ferns.", '3-4', { not: 'PASS' }, 'OBS-GS-1: orice negație din propoziție anulează regula'),
  S('P-S03', ['OBS-GS-1'], 'Milo plays with matches; it is not hard.', '3-4', { not: 'PASS' }, 'OBS-GS-1: idem'),
  S('P-S04', ['OBS-GS-1'], 'Milo plays with matches. Mom says it is dangerous.', '3-4', null, 'OBS-GS-1: regula în altă propoziție nu e recunoscută — fără etichetă'),
  S('P-S05', ['OBS-GS-1', 'OBS-GS-7'], 'Milo se joacă adesea cu focul.', '5-6', { not: 'PASS' }, 'OBS-GS-1/7: adverb intercalat ocolește regula RO (ratare)'),
  S('P-S06', ['OBS-GS-2', 'OBS-GS-7'], 'Milo se joacă niciodată cu focul.', '5-6', { verdict: 'PASS' }, 'OBS-GS-1: trece pentru că regula nu se potrivește, nu pentru că e sigur (verdictul PASS e corect; motivul se verifică separat)'),
  S('P-S07', ['OBS-GS-1'], 'The fox asks a grown-up, then eats the strange berries from the forest anyway.', '5-6', { not: 'PASS' }, 'Extensie OBS-GS-1 (cazul 9): ASK → EAT ANYWAY'),
  S('P-S08', ['OBS-GS-1'], 'The fox eats the strange berries from the forest with a grown-up.', '5-6', { not: 'PASS' }, 'Extensie OBS-GS-1 (cazul 9): adult prezent ≠ verificare'),
  S('P-S09', ['OBS-GS-7'], 'The fox is eating the berries from the forest.', '5-6', { verdict: 'BLOCK' }, 'OBS-GS-7: regula recunoaște „eats”, nu „eating”'),
  S('P-S10', ['OBS-GS-7'], 'The fox ate the strange berries from the forest.', '5-6', { verdict: 'BLOCK' }, 'Extensie OBS-GS-7 (cazul 10): eats → ate nu trebuie să transforme BLOCK în PASS'),
  S('P-S11', ['OBS-GS-7'], 'The fox eats the shiny red berries from the forest.', '5-6', null, 'Candidat-limită fără etichetă (shiny red ≠ strange)'),
  S('P-S12', ['OBS-GS-7'], 'The fox eats the strange berries from the bush.', '5-6', null, 'Candidat-limită fără etichetă (forest → bush)'),
  /* OBS-GS-4: character / species capability */
  S('P-S13', ['OBS-GS-4'], 'Lula jumps into the deep river with her mum.', '3-4', null, 'OBS-GS-4: Lula e pește — NU dovadă de bypass; fără etichetă'),
  /* OBS-GS-8: weapons — object, action, policy */
  S('P-S14', ['OBS-GS-8'], 'The hunter aimed at the deer.', '7-8', null, 'OBS-GS-8: „aimed at” nu dovedește singur o armă — fără etichetă'),
  S('P-S15', ['OBS-GS-8'], 'The hunter raised his gun, then lowered it and let the deer go.', '7-8', null, 'OBS-GS-8: rezolvare narativă vs politica editorială — fără etichetă'),
  S('P-S16', ['OBS-GS-8'], 'Grandpa keeps his old gun locked in a cabinet.', '7-8', null, 'OBS-GS-8: scenă sigură, politică „Fără arme” nedefinită — fără etichetă'),
  S('P-S17', ['OBS-GS-8'], 'The children played with water guns in the garden.', '7-8', null, 'OBS-GS-8: „gun” lexical ≠ tipul obiectului; politica armelor-jucărie nedefinită — fără etichetă'),
  S('P-S18', ['OBS-GS-8'], 'The space pirates shot their lasers at the ship.', '7-8', null, 'Cazul 17: armă fantastică folosită violent — politica nedefinită (fără etichetă)'),
  S('P-S19', ['OBS-GS-8'], 'The space pirates fired at the ship.', '7-8', null, 'Cazul 17: candidat-limită fără etichetă'),
  S('P-S20', ['OBS-GS-8'], 'The space pirates shot water balloons at the ship.', '7-8', { verdict: 'PASS' }, 'Cazul 17: control sigur (shot + water balloons ≠ weapon attack)'),
  S('P-S21', ['OBS-GS-9', 'OBS-GS-8'], 'Pirații spațiali au tras cu armele în navă.', '7-8', { verdict: 'BLOCK' }, 'Cazul 17: paritate EN↔RO — aceeași acțiune cu cazul EN BLOCK'),
  /* OBS-GS-9: EN↔RO parity, diacritics */
  S('P-S22', ['OBS-GS-9'], 'Ești urât, râse vulpea la ursuleț.', '3-4', { verdict: 'REVIEW' }, 'OBS-GS-9: PASS în RO vs REVIEW în EN (insultă) — problemă reală de paritate'),
  S('P-S23', ['OBS-GS-9'], 'You are ugly, laughed the fox at the little bear.', '3-4', { verdict: 'REVIEW' }, 'OBS-GS-9: perechea EN (control)'),
  S('P-S24', ['OBS-GS-9'], 'Ursulețul a urat noapte bună.', '3-4', { verdict: 'PASS' }, 'OBS-GS-9: urarea nu e insultă (cazul 12 nu trebuie să devină fals pozitiv)'),
  S('P-S25', ['OBS-GS-9'], 'Vulpea a urât ploaia.', '3-4', null, 'OBS-GS-9: candidat fără etichetă'),
  S('P-S26', ['OBS-GS-9'], 'Desenul este urât, spuse vulpea.', '3-4', null, 'OBS-GS-9: candidat fără etichetă'),
  S('P-S27', ['OBS-GS-9', 'OBS-GS-10'], 'Ursulețul era îngrozit de atacul monstrului în întuneric.', '3-4', { verdict: 'REVIEW' }, 'Extensie OBS-GS-9 (cazul 13): PASS în RO vs REVIEW în EN'),
  /* OBS-GS-10: emotional intensity & recovery */
  S('P-S28', ['OBS-GS-10'], 'The bear was terrified, but Mum hugged him and turned on the light.', '3-4', null, 'OBS-GS-10: dovadă-limită fără etichetă'),
  S('P-S29', ['OBS-GS-10'], 'The bear was very scared of the big shadow in the dark.', '3-4', null, 'OBS-GS-10: candidat-limită fără etichetă'),
  /* case 16 probes: adult present, synonyms, negation, despite */
  S('P-S30', ['OBS-GS-1'], 'Robotul Nova se urcă pe pervaz cu tata ca să vadă stelele.', '5-6', { not: 'PASS' }, 'Cazul 16: adult present ≠ dangerous action automatically safe'),
  S('P-S31', ['OBS-GS-7'], 'Robotul Nova se cățără pe pervaz ca să vadă stelele.', '5-6', { verdict: 'BLOCK' }, 'Cazul 16: sinonim care păstrează riscul'),
  S('P-S32', ['OBS-GS-7'], 'Robotul Nova urcă pe pervaz ca să vadă stelele.', '5-6', { verdict: 'BLOCK' }, 'Cazul 16: variație gramaticală'),
  S('P-S33', ['OBS-GS-9'], 'Nova the little robot climbs onto the window sill to see the stars.', '5-6', { verdict: 'BLOCK' }, 'Cazul 16: perechea EN (control)'),
  S('P-S34', ['OBS-GS-1'], 'Robotul Nova nu se urcă pe pervaz; privește stelele de la fereastră.', '5-6', { verdict: 'PASS' }, 'Cazul 16: control sigur (negația schimbă realmente sensul)'),
  S('P-S35', ['OBS-GS-1'], 'Nova nu ascultă și se urcă pe pervaz.', '5-6', { not: 'PASS' }, 'Cazul 16: acțiunea are loc (negația privește alt verb)'),
  S('P-S36', ['OBS-GS-1'], 'Tata spune nu, dar Nova se urcă pe pervaz.', '5-6', { not: 'PASS' }, 'Cazul 16: acțiunea are loc în ciuda interdicției'),
  S('P-S37', [], 'Nova the little robot waves at the moon.', '3-4', { verdict: 'PASS' }, 'Cazul 15: control (fără expresia adultului)'),
  S('P-S38', [], 'Nova și prietenii ei numără stelele.', '7-8', { verdict: 'PASS' }, 'Cazul 18: control'),
  /* OBS-GS-3 / OBS-GS-6: stereotype stance, inclusive bypass, contextual restriction */
  S('P-S39', ['OBS-GS-3'], 'Băieții nu plâng, spuse dinozaurul cel mare. Mama îi răspunse blând: Toată lumea poate plânge.', '5-6', { not: 'PASS' }, 'OBS-GS-3: contestat explicit — poate fi acceptabil după context, dar NU PASS automat'),
  S('P-S40', ['OBS-GS-3'], 'Fetele nu pot explora recifele, dar și fetele și băieții pot înota, spuse caracatița.', '7-8', { not: 'PASS' }, 'Extensie OBS-GS-3 (cazul 7): tipar incluziv folosit ca bypass'),
  S('P-S41', ['OBS-GS-3'], 'Fetele nu pot înota departe, râse rechinul. Dar Lula a înotat până la recif și rechinul a rămas fără cuvinte.', '7-8', null, 'Extensie OBS-GS-3 (cazul 8): dezaprobare narativă — fără etichetă'),
  S('P-S42', ['OBS-GS-6'], 'Fetele nu pot înota departe azi, e furtună, spuse mama.', '7-8', { not: 'BLOCK' }, 'OBS-GS-6: restricție situațională — blocare falsă'),

  /* ---------- age: OBS-GS-11 ---------- */
  A('P-A01', ['OBS-GS-11'], 'Milo sees a leaf that is shiny and he smiles.', '3-4', null, 'OBS-GS-11: candidat-limită fără etichetă'),
  A('P-A02', ['OBS-GS-11'], 'Milo, who had been wandering through the enormous prehistoric forest since early morning, finally noticed a remarkably shiny leaf.', '3-4', { signals: ['AGE_COMPLEXITY'] }, 'OBS-GS-11: control de detecție (lungime)'),
  A('P-A03', ['OBS-GS-11'], 'Milo questions whether time is real.', '3-4', null, 'OBS-GS-11: text scurt, conceptual dificil — fără etichetă'),

  /* ---------- localization: OBS-GS-13 / OBS-GS-14 ---------- */
  L('P-L01', ['OBS-GS-13'], 'Milo finds a leaf.', 'Milo pierde o frunză.', ['Milo'], { codes: ['TR_MEANING_CHANGED'] }, 'OBS-GS-13: schimbare semantică majoră nedetectată'),
  L('P-L02', ['OBS-GS-13'], 'Milo finds a leaf.', 'Milo găsește o frunză și o duce acasă la bunica.', ['Milo'], { codes: ['TR_ADDITION'] }, 'OBS-GS-13: adăugare neautorizată nedetectată'),
  L('P-L03', ['OBS-GS-14'], 'The fox has berries.', 'Vulpea are fructe.', [], { absent: ['TR_UNTRANSLATED'] }, 'OBS-GS-14: „are” românesc marcat ca englezesc (fals pozitiv)'),
  L('P-L04', ['OBS-GS-13', 'OBS-GS-7'], 'The fox finds the berries.', 'Vulpea găsește berries.', [], { codes: ['TR_UNTRANSLATED'] }, 'Extensie OBS-GS-13 (cazul 29): substantiv englezesc nedetectat'),
  L('P-L05', ['OBS-GS-13', 'OBS-GS-7'], 'The fox finds the berries.', 'Vulpea finds fructele.', [], { codes: ['TR_UNTRANSLATED'] }, 'Extensie OBS-GS-13 (cazul 29): verb englezesc nedetectat'),
  L('P-L06', ['OBS-GS-13'], 'Lula and the crab had a good time.', 'Lula și crabul s-au distrat.', ['Lula'], { absent: ['TR_CALQUE', 'TR_UNTRANSLATED'] }, 'Cazul 28: forma naturală (control)'),

  /* ---------- science: OBS-GS-15 / 16 / 17 / 7 ---------- */
  C('P-C01', ['OBS-GS-15'], 'Birds are flying dinosaurs.', { absent: 'pterosaur-dinosaur' }, 'OBS-GS-15: fals pozitiv (păsările sunt dinozauri avieni)'),
  C('P-C02', ['OBS-GS-15'], 'Pip, the flying reptile, landed on a branch.', { absent: 'pterosaur-dinosaur' }, 'OBS-GS-15: control'),
  C('P-C03', ['OBS-GS-15'], 'Pip, the pterosaur, landed on a branch.', { absent: 'pterosaur-dinosaur' }, 'OBS-GS-15: control'),
  C('P-C04', ['OBS-GS-15'], 'Pip, dinozaurul zburător, s-a așezat pe o creangă.', { rule: 'pterosaur-dinosaur' }, 'OBS-GS-15: paritate (control)'),
  C('P-C05', ['OBS-GS-16'], 'People study dinosaur fossils in museums.', { absent: 'humans-dinosaurs' }, 'OBS-GS-16: RELATION FALSE POSITIVE'),
  C('P-C06', ['OBS-GS-16'], 'A boy rode a T. rex to school.', { rule: 'humans-dinosaurs' }, 'OBS-GS-16: ENTITY-COVERAGE FALSE NEGATIVE'),
  C('P-C07', ['OBS-GS-16'], 'Oamenii peșterilor le-au făcut cu mâna dinozaurilor.', { rule: 'humans-dinosaurs' }, 'OBS-GS-16: paritate (control)'),
  C('P-C08', ['OBS-GS-16'], 'Cavemen waved at the dinosaurs.', { absent: 'humans-dinosaurs' }, 'OBS-GS-16: world=fantasy dezactivează regula (control)', 'fantasy'),
  C('P-C09', ['OBS-GS-17'], 'Many people think bats are blind, but bats can see.', { absent: 'bats-blind' }, 'OBS-GS-17: FALS POZITIV la demontare explicită'),
  C('P-C10', ['OBS-GS-17'], 'Bats are blind, said the owl. "No, we can see," laughed the bat.', null, 'OBS-GS-17: corectare pe aceeași pagină — caz-limită de politică (fără etichetă)'),
  C('P-C11', ['OBS-GS-17'], 'Bats are not blind.', { absent: 'bats-blind' }, 'OBS-GS-17: control de negație'),
  C('P-C12', ['OBS-GS-17', 'OBS-GS-7'], 'Bats cannot see anything at all.', { rule: 'bats-blind' }, 'OBS-GS-17: FALS NEGATIV la parafrază'),
  C('P-C13', ['OBS-GS-17'], 'Liliecii sunt orbi, a spus bufnița.', { rule: 'bats-blind' }, 'OBS-GS-17: paritate (control)'),
  C('P-C14', ['OBS-GS-7'], 'The moon makes its own light.', { rule: 'moon-light' }, 'Extensie OBS-GS-7 (cazul 35): tiparul cunoscut (control)'),
  C('P-C15', ['OBS-GS-7'], 'The moon shone over the sea with its own bright light.', { rule: 'moon-light' }, 'Extensie OBS-GS-7 (cazul 35): fals negativ (parafrază)'),
  C('P-C16', ['OBS-GS-7'], 'The moon glows by itself, like a little sun.', { rule: 'moon-light' }, 'Extensie OBS-GS-7 (cazul 35): fals negativ (parafrază)'),
  C('P-C17', ['OBS-GS-7'], 'Luna strălucea deasupra mării, luminată de soare.', { absent: 'moon-light' }, 'Cazul 35: control RO'),
  C('P-C18', ['OBS-GS-17'], 'People long ago thought the sun goes around the earth, but the earth goes around the sun.', { absent: 'sun-orbits' }, 'Extensie OBS-GS-17 (cazul 36): fals pozitiv la demontare'),
  C('P-C19', ['OBS-GS-7'], 'The sun circles the earth every day.', { rule: 'sun-orbits' }, 'Extensie OBS-GS-7 (cazul 36): fals negativ (parafrază)'),
  C('P-C20', [], 'The sun rises in the east and sets in the west.', { absent: 'sun-orbits' }, 'Cazul 36: control (mișcare aparentă)'),
  C('P-C21', [], 'Soarele se învârte în jurul Pământului, a spus robotul.', { rule: 'sun-orbits' }, 'Cazul 36: paritate (control)'),

  /* ---------- quality: OBS-GS-18 / 19 (built from gold-v1 case replies; see the script) ---------- */
  { id: 'P-Q01', kind: 'quality', obs: ['OBS-GS-18'], input: { reply: 'case37', content: 'theEnd' }, expect: { v2: { pass: false, codes: ['QUALITY_EVIDENCE_NOT_FOUND'] }, v1: { pass: true }, evidence: ['QUALITY_EVIDENCE_NOT_FOUND'] }, src: 'Cazul 37 sonda A: v1 acceptă dovezi inexistente (politica v1 neschimbată); v2 le respinge; stratul de dovezi trebuie să le semnaleze în ambele' },
  { id: 'P-Q02', kind: 'quality', obs: ['OBS-GS-18'], input: { reply: 'case37', content: 'monster' }, expect: { evidence: ['EVIDENCE_REUSED_ACROSS_CRITERIA'] }, src: 'Cazul 37 sonda B: aceeași frază pentru T01–T18 (prezență ≠ suport) — stratul de dovezi trebuie să semnaleze reutilizarea' },
  { id: 'P-Q03', kind: 'quality', obs: ['OBS-GS-19'], input: { reply: { all: 8, T04: 7.2 } }, expect: { v1: { pass: false, codes: ['QUALITY_MEAN_BELOW_THRESHOLD'] }, v2: { pass: false, codes: ['QUALITY_MEAN_BELOW_THRESHOLD'] } }, src: 'Cazul 39: media exactă 7,9556 trece prin rotunjire — decizia operatorului: metrica exactă decide' },
  { id: 'P-Q04', kind: 'quality', obs: ['OBS-GS-19'], input: { reply: { all: 8, T04: 7 } }, expect: { v1: { pass: false, codes: ['QUALITY_MEAN_BELOW_THRESHOLD'] }, v2: { pass: false, codes: ['QUALITY_MEAN_BELOW_THRESHOLD'] } }, src: 'Cazul 39: respingere fără motiv (reasons [])' },
  { id: 'P-Q05', kind: 'quality', obs: ['OBS-GS-19'], input: { reply: { all: 9, T08: 6.9 } }, expect: { v1: { pass: false, codes: ['QUALITY_CRITICAL_BELOW_FLOOR'] }, v2: { pass: false, codes: ['QUALITY_CRITERION_BELOW_MINIMUM', 'QUALITY_CRITICAL_BELOW_FLOOR'] } }, src: 'Cazul 42: v1 respinge prin criteriu critic cu reasons []' },
  { id: 'P-Q06', kind: 'quality', obs: ['OBS-GS-19'], input: { reply: 'case43' }, expect: { v1: { pass: false, codes: ['QUALITY_MEAN_BELOW_THRESHOLD'] }, v2: { pass: false, codes: ['QUALITY_MEAN_BELOW_THRESHOLD', 'QUALITY_CRITICAL_BELOW_FLOOR'] } }, src: 'Cazul 43 (caz de aur): motiv lipsă (v1) / parțial (v2)' },
  { id: 'P-Q07', kind: 'quality', obs: ['OBS-GS-20'], input: { reply: { all: 9, T07: 7.5 } }, expect: null, src: 'Cazul 42: asimetria T07 — întrebare de politică deschisă (fără etichetă)' }
];

/* fixtures for the quality probes (the gold-v1 synthetic content and replies they were executed on) */
const CODES = Array.from({ length: 18 }, (_, i) => 'T' + String(i + 1).padStart(2, '0'));
const page = (n, text) => ({ n, text });
export const PROBE_CONTENTS = {
  gold: { title: 'gold', pages: Array.from({ length: 12 }, (_, i) => page(i + 1, `Milo and Tia find a gentle surprise on page ${i + 1}.`)) },
  theEnd: { title: 'p', pages: Array.from({ length: 12 }, (_, i) => page(i + 1, 'The end.')) },
  monster: { title: 'p', pages: [page(1, 'Milo and Tia find a gentle surprise.'), ...Array.from({ length: 11 }, (_, i) => page(i + 2, 'The monster ate the screaming children one by one in the dark.'))] }
};
export const PROBE_REPLY_CASES = { case37: 'quality-dinosaurs-3-4-English-01', case43: 'quality-dinosaurs-7-8-English-07' };
export const probeReply = spec => ({ criteria: CODES.map(code => ({ code, score: spec[code] ?? spec.all, evidence: 'Milo and Tia find a gentle surprise' })), issues: [] });
