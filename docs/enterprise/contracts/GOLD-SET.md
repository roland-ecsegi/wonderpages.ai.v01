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
  (`supersedes`); `seq`, `prevHash`, `hash`. O readjudecare adaugă o intrare nouă; istoricul rămâne.
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
- Setul activ al directorului este fișierul cu schema `wonderpages.gold-set/1` și versiunea cea mai mare (niciun nume
  sau număr de cazuri fixat în cod); directorul poate fi schimbat cu `WP_GOLD_DIR`.
