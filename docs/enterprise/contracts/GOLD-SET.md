# Setul de aur și calibrarea pe cohorte (P5-T05)

Implementare: `evaluation/gold/gold-v1.json` (set versionat), `server/quality/evaluation.js` (runner, metrici, contaminare, comparații oarbe, starea calibrării), rutele `/api/evaluation/*`.

## Setul `gold-v1`

- **44 de cazuri** sintetice, pozitive și negative, pentru evaluatorii deterministici: siguranță (P5-T01), complexitate pe vârstă, localizare (P4-T04), știință, politica de calitate (răspunsuri de critic adjudecate ca „acceptabil”/„neacceptabil”, P5-T02).
- **Cohorte**: 3 vârste (3-4, 5-6, 7-8), 2 limbi (EN, RO), 3 teme de calibrare (dinozauri, mare, pădure) + **temă rezervată distinctă** (spațiu) — 8 cazuri.
- **Manifest**: ID, versiune, scop („NU reprezintă cărți reale”), drepturi (fixture-uri sintetice pentru evaluare internă; arhiva Dinosaur World referită prin SHA-256, textul ei nu este copiat), împărțire, cohorte, subsetul de bază DW (text V1, referințe prin hash, scoruri vizuale `NOT_AVAILABLE`), limitări.
- **Adjudecare**: etichetele sunt propuse de implementator și au statusul `pending_operator_review` — confirmarea lor este a operatorului (aprobare umană).

## Raportul de evaluare (`wonderpages.evaluation-report/1`)

Pe evaluator și pe cohortă (vârstă, limbă, temă): matricea de confuzie, acuratețea, **rata false-pass pe setul negativ**, rata false-block, kappa Cohen față de etichete, acordul exact și **ID-urile cazurilor greșite**; determinismul (același input rulat de mai multe ori); contaminarea setului rezervat (temă comună, duplicate și aproape-duplicate); versiunile evaluatorului și ale politicii; limitările.

Rezultate inițiale (calibrare): cu politica v2 toți evaluatorii clasifică corect setul; cu politica v1, 3 din 4 negative de calitate trec (false-pass 0,75) — dovada pentru pragurile propuse v2. Pe setul rezervat (spațiu): toate corecte. **Aceste rezultate sunt optimiste**: cazurile și regulile au același autor; setul este mic și sintetic.

## Reguli

- Rapoartele se compară numai pe același set (ID, versiune, hash de manifest) și aceeași împărțire; o schimbare de politică sau de evaluator este afișată ca atare, nu amestecată.
- Comparația oarbă A/B cere variante potrivite (temă, vârstă, limbă), ascunde identitatea și randomizează determinist partea (sămânță).
- **Pragurile țintă rămân „propuse”** (și afirmațiile de maturitate din P7 sunt interzise) până există un raport curat pe calibrare și pe setul rezervat **și** operatorul acceptă raportul (`POST /api/evaluation/accept`, cu notă).
- Ratingurile operatorului sunt distincte de feedbackul pieței; setul nu certifică reacția copiilor.
