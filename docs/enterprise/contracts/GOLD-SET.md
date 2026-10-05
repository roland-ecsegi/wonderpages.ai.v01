# Setul de aur și calibrarea pe cohorte (P5-T05)

Implementare: `evaluation/gold/gold-v1.json` (set versionat), `server/quality/evaluation.js` (runner, metrici, contaminare, comparații oarbe, starea calibrării), rutele `/api/evaluation/*`.

## Setul `gold-v1`

- **44 de cazuri** sintetice, pozitive și negative, pentru evaluatorii deterministici: siguranță (P5-T01), complexitate pe vârstă, localizare (P4-T04), știință, politica de calitate (răspunsuri de critic adjudecate ca „acceptabil”/„neacceptabil”, P5-T02).
- **Cohorte**: 3 vârste (3-4, 5-6, 7-8), 2 limbi (EN, RO), 3 teme de calibrare (dinozauri, mare, pădure) + **temă rezervată distinctă** (spațiu) — 8 cazuri.
- **Manifest**: ID, versiune, scop („NU reprezintă cărți reale”), drepturi (fixture-uri sintetice pentru evaluare internă; arhiva Dinosaur World referită prin SHA-256, textul ei nu este copiat), împărțire, cohorte, subsetul de bază DW (text V1, referințe prin hash, scoruri vizuale `NOT_AVAILABLE`), limitări.
- **Adjudecare**: etichetele sunt propuse de implementator și au statusul `pending_operator_review` — confirmarea lor este a operatorului (aprobare umană). Deciziile se păstrează în jurnalul separat descris mai jos; fișierul setului nu se rescrie.

## Raportul de evaluare (`wonderpages.evaluation-report/1`)

Pe evaluator și pe cohortă (vârstă, limbă, temă): matricea de confuzie, acuratețea, **rata false-pass pe setul negativ**, rata false-block, kappa Cohen față de etichete, acordul exact și **ID-urile cazurilor greșite**; determinismul (același input rulat de mai multe ori); contaminarea setului rezervat (temă comună, duplicate și aproape-duplicate); versiunile evaluatorului și ale politicii; limitările.

Rezultate inițiale (calibrare): cu politica v2 toți evaluatorii clasifică corect setul; cu politica v1, 3 din 4 negative de calitate trec (false-pass 0,75) — dovada pentru pragurile propuse v2. Pe setul rezervat (spațiu): toate corecte. **Aceste rezultate sunt optimiste**: cazurile și regulile au același autor; setul este mic și sintetic.

## Reguli

- Rapoartele se compară numai pe același set (ID, versiune, hash de manifest) și aceeași împărțire; o schimbare de politică sau de evaluator este afișată ca atare, nu amestecată.
- Comparația oarbă A/B cere variante potrivite (temă, vârstă, limbă), ascunde identitatea și randomizează determinist partea (sămânță).
- **Pragurile țintă rămân „propuse”** (și afirmațiile de maturitate din P7 sunt interzise) până există un raport curat pe calibrare și pe setul rezervat **și** operatorul acceptă raportul (`POST /api/evaluation/accept`, cu notă).
- Ratingurile operatorului sunt distincte de feedbackul pieței; setul nu certifică reacția copiilor.

## Jurnalul adjudecărilor (`<id set>.adjudications.jsonl`)

Implementare: `server/quality/adjudication.js`, `server/quality/evaluation-service.js`, `scripts/enterprise/gold-adjudicate.mjs`.

- **Separat de set, append-only, înlănțuit prin hash.** Fiecare linie este o decizie: cazul și hash-ul conținutului său;
  setul (id, versiune, hash de manifest, hash al întregului set); eticheta propusă inițial; verdictul sistemului în acel
  moment (evaluator, versiuni, detaliu); decizia operatorului — `confirm` / `correct` / `exclude`; eticheta rezultată;
  nota; actorul; momentul; proveniența (declarația operatorului, cine a înregistrat, canalul); intrarea înlocuită
  (`supersedes`); `seq`, `prevHash`, `hash`; opțional `reasoning` — acordul de verdict (calculat) și acordul de raționament
  (yes / no / incomplete, al operatorului, cu motivul sistemului și justificarea operatorului). O readjudecare adaugă o
  intrare nouă; istoricul rămâne.
- **Verificare.** Secvență continuă, legătură cu intrarea anterioară, hash recalculat: o modificare, ștergere,
  reordonare sau linie invalidă este detectată, iar peste un jurnal alterat nu se mai adaugă nimic. Corectura cere o
  etichetă validă și diferită; corectura și excluderea cer notă; fără declarația operatorului nu se înregistrează nimic.
- **Starea adjudecării** (`GET /api/evaluation/adjudication`, doar citire): cazurile care cer adjudecare (orice caz fără
  status confirmat de operator în set), decizia efectivă pe caz, cele în așteptare, inconsecvențele (lanț rupt, caz
  necunoscut, caz schimbat după decizie, alt set, intrare invalidă) și un hash peste deciziile efective.
- **Evaluarea** folosește etichetele adjudecate (corecturile aplicate, excluderile scoase), iar raportul se leagă de
  starea adjudecării (`adjudicationState.hash`) și de conținutul setului (`dataset.goldHash`). Rapoartele pe
  adjudecări diferite nu se compară.
- **Acceptarea** (`POST /api/evaluation/accept`) este refuzată (409, cu motivele) dacă: există cazuri neadjudecate; jurnalul
  are inconsecvențe; un raport este pentru altă versiune de set; setul s-a schimbat după raport; adjudecările s-au
  schimbat după raport (sau raportul precede adjudecarea completă); lipsește nota. Acceptarea reținută conține hash-ul
  adjudecărilor și al setului; o schimbare ulterioară o face învechită (pragurile revin la „propuse”).
- **Adjudecarea completă nu este acceptare.** Acceptarea rămâne o acțiune separată a operatorului, făcută în aplicația
  Enterprise Local după instalare. Jurnalul este date de repository: intră în release, deci deciziile nu se repetă.
- Setul activ al directorului este fișierul cu schema `wonderpages.gold-set/1` sau `/2` și versiunea cea mai mare (niciun
  nume sau număr de cazuri fixat în cod); directorul poate fi schimbat cu `WP_GOLD_DIR`. Setul activ este acum `gold-v2`; `gold-v1`
  rămâne înghețat (benchmarkul „Before”), cu jurnalul lui complet.
- Un caz fără etichetă (`label: null`, politică nedecisă) nu poate fi confirmat (`LABEL_REQUIRED`): operatorul îi dă eticheta
  prin `correct`.

## Setul `gold-v2` (`wonderpages.gold-set/2`, hardening 2026-10-05)

Proiectarea, acoperirea și limitările: `records/GOLD-V2-DESIGN.md`. Deciziile operatorului: `records/GOLD-V2-OPERATOR-DECISIONS.md`.

- **Metadate pe caz:** `property`, `dimension`, `labelSource` (`fact` / `current_policy` / `operator_decision` /
  `operator_principle` / `OPERATOR_DECISION_REQUIRED`), `roles`, `pairGroup` + `variable` (familii controlate), `obs`,
  `regressionOf`, `provenance`. `expected` conține verdictul și motivele.
- **Setul rezervat** e sigilat (`manifest.holdoutSeal`, `evaluation/gold-v2-src/holdout-seal.json`): un hash pe fiecare caz, fără
  blocul de adjudecare, plus un hash total. Setul e construit determinist din surse (`scripts/enterprise/gold-v2-build.mjs`) și nu
  se editează de mână.
- **Integritatea** (`server/quality/gold-integrity.js`) e verificată la construcție și în validare:
  - duplicatele intenționale vs accidentale;
  - duplicatele doar de metadate;
  - contaminarea între seturi;
  - tema rezervată;
  - consecvența etichetă ↔ sursa etichetei.
- **Evaluatorul v2** (`EVALUATOR_VERSION = 2`) cere verdictul ȘI motivele pentru acordul exact. Cazurile fără etichetă se
  raportează separat (`report.unlabeled`) și nu se punctează.
- **Validarea** (`server/quality/validation.js`, `GET /api/evaluation/validation`) e calculată din
  `manifest.validationRequirements`:
  - adjudecare completă;
  - niciun caz fără etichetă;
  - sigiliul verificat;
  - integritate curată;
  - acoperire minimă;
  - registrul de probe gold-v1 (`server/quality/regression.js`);
  - rapoarte pe calibrare și pe setul rezervat, cu evaluatorul curent, pe setul adjudecat complet.

  Un set fără cerințe (gold-v1) are starea `VALIDATION_NOT_DEFINED`.
- **Garda (§21): adjudecare ≠ validare ≠ acceptare.**
  - Acceptarea e refuzată fără validare completă (`VALIDATION_INCOMPLETE`) sau cu un raport pe alt evaluator
    (`REPORT_STALE_EVALUATOR`).
  - Acceptarea reține hash-ul validării și versiunea evaluatorului; o schimbare ulterioară o face învechită.
  - `GET /api/evaluation/status` arată fazele separat: `adjudicationComplete`, `validationComplete`, `acceptancePerformed`,
    `acceptanceStale`.
- **Calitatea:**
  - decizia folosește media exactă (`exactScore`); `score` e rotunjit doar pentru afișare;
  - fiecare condiție de respingere activă are un cod (`reasonCodes`);
  - validitatea dovezilor e raportată separat de verdict;
  - formatul (numărul și secvența paginilor) e verificat determinist.
