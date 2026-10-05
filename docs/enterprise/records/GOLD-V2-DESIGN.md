# Gold-v2 — proiectare și acoperire

Starea: **CONSTRUIT · SIGILAT (setul rezervat) · NEADJUDECAT · NEVALIDAT · NEACCEPTAT**. Toate etichetele sunt PROPUSE de
furnizorul de implementare. Gold-v1 rămâne neschimbat, ca benchmark „Before” (sha256 `603fa00a…cee2db`, verificat de test).

## 1. Fișiere

| Fișier | Rol |
|---|---|
| `evaluation/gold-v2-src/holdout.mjs` | 69 de cazuri rezervate, scrise **înainte** de orice modificare de evaluator (commit `e95716e`) |
| `evaluation/gold-v2-src/holdout-seal.json` | sigiliul: hash pe fiecare caz (fără blocul de adjudecare) + hash total `afa194aa8aac5e91…` |
| `evaluation/gold-v2-src/calibration.mjs` | 157 de cazuri de calibrare (set de dezvoltare), inclusiv cazurile de regresie |
| `scripts/enterprise/gold-v2-build.mjs` | constructor determinist: aceleași surse → aceiași octeți (verificat de test) |
| `evaluation/gold/gold-v2.json` | setul (schema `wonderpages.gold-set/2`), setul activ în Enterprise Local; nu se editează de mână |
| `evaluation/gold-v2-src/build-report.json` | integritate, duplicate, independență, acoperire |
| `scripts/enterprise/gold-v2-seal.mjs verify` | verifică sigiliul |
| `evaluation/gold-v2-src/*-run-1.json` | rulările tehnice pe etichetele propuse (rezervatul: o singură rulare, scriptul refuză suprascrierea) |

## 2. Principii de proiectare

1. **Setul rezervat înaintea reglajului.** Setul rezervat a fost scris și sigilat înainte de hardening. Orice schimbare a unui caz
   rezervat rupe sigiliul (`SEAL_CASE_CHANGED`) și starea de validare (`HOLDOUT_SEALED`). Eșecurile rezervate nu se repară, cazurile
   nu se mută în calibrare, iar etichetele nu se rescriu.
2. **Teme rezervate.** Calibrarea folosește temele *dinosaurs, sea, forest, space, farm*. Setul rezervat folosește *mountain, city*.
   Integritatea refuză o temă comună (`HOLDOUT_THEME_SHARED`).
3. **Sursa etichetei pe fiecare caz (OBS-GS-20).**
   - `fact`: fapt științific sau lingvistic;
   - `current_policy`: corectitudinea implementării politicii scrise; circulară prin definiție;
   - `operator_decision`: deciziile deja luate (T01 ≥ 8, T08 ≥ 8, T13 = 6,5 blochează etc.);
   - `operator_principle`: principiile din OBS-GS;
   - `OPERATOR_DECISION_REQUIRED`: eticheta e `null` și cazul nu se punctează.
4. **Familii controlate.** Perechile minime și variantele au `pairGroup` și `variable` declarate (negație, ordine, poziție,
   morfologie, parafrază, paritate EN/RO, vârstă). Același stimul fără familie și variabilă e eroare (`ACCIDENTAL_DUPLICATE` /
   `METADATA_ONLY_DUPLICATE`).
5. **Populații separate.** Rapoartele nu amestecă: cazuri brute ≠ etichetate ≠ stimuli unici ≠ stimuli independenți. Variantele
   corelate nu se numără ca observații independente.
6. **Independență raportată pe axe** pentru fiecare caz rezervat: stimul, temă, proprietate, familie de reguli, limbă. Nu e
   presupusă.
7. **Motivele fac parte din etichetă.** `expected` conține verdictul și motivele (regulile de siguranță, codurile de localizare,
   semnalele de vârstă, regula științifică, motivele de calitate). Evaluatorii v2 cer ambele pentru acordul exact (OBS-GS-5).
8. **Regresie.** Fiecare defect reparat are cel puțin un caz în calibrare (`regressionOf`, 26 de cazuri; 30 cu rolul `regression`).
   Registrul de probe gold-v1 (79 de probe) rulează în testul 92 și în starea de validare (`REGRESSION_REGISTRY`).
9. **Garda (§21): adjudecare ≠ validare ≠ acceptare.**
   - Starea de validare e calculată (`GET /api/evaluation/validation`), nu se setează de mână.
   - Acceptarea e refuzată fără validare completă (`VALIDATION_INCOMPLETE`).
   - O acceptare devine învechită când se schimbă evaluatorul sau validarea.
   - `GET /api/evaluation/status` arată cele trei faze separat.

## 3. Acoperire (din `build-report.json`)

| Populație | Număr |
|---|---|
| Cazuri brute | 226 (157 calibrare + 69 rezervate) |
| Etichetate (propuse) / fără etichetă | 206 / 20 (17 calibrare, 3 rezervate) |
| Stimuli unici | 216 |
| Stimuli independenți (familiile numărate o dată) | 131 |
| Familii controlate / variante corelate | 38 / 85 |

| Tip | Calibrare (poz · neg · fără) | Rezervat (poz · neg · fără) |
|---|---|---|
| Siguranță | 21 · 43 · 12 | 6 · 16 · 2 |
| Vârstă | 10 · 8 · 2 | 6 · 6 · 0 |
| Localizare | 5 · 16 · 0 | 4 · 9 · 0 |
| Știință | 11 · 12 · 1 | 5 · 7 · 0 |
| Calitate | 5 · 9 · 2 | 1 · 6 · 1 |

| Dimensiune | Distribuție |
|---|---|
| Limbă | EN 156 · RO 70 |
| Vârstă | 3–4: 61 · 5–6: 89 · 7–8: 76 |
| Temă | sea 44 · forest 43 · farm 28 · space 23 · dinosaurs 19 · mountain 35 · city 34 |
| Sursa etichetei | fact 79 · current_policy 62 · operator_principle 43 · operator_decision 22 · OPERATOR_DECISION_REQUIRED 20 |
| Roluri | pereche minimă 66 · control pozitiv 57 · control negativ 29 · caz-limită 30 · regresie 30 · paritate 23 · negație 15 · morfologie 13 · parafrază 11 · poziție 8 · ordine 3 · între porți 2 |

**Independența setului rezervat (69 de cazuri):**

| Axă | Cazuri independente |
|---|---|
| Temă | 69/69 |
| Limbă | 69/69 (axa e marcată mereu independentă) |
| Stimul (similaritate < 0,5 cu orice caz de calibrare) | 66/69 |
| Proprietate | 62/69 |
| Familie de reguli | **0/69** |

Interpretare: setul rezervat măsoară generalizarea pe **stimuli și teme noi** în aceleași familii de reguli. NU măsoară
generalizarea pe reguli noi.

**Goluri de acoperire cunoscute:**
- **Calitate:** toate cazurile sunt EN 3–4 (conținut sintetic de 12 pagini), cu un singur pozitiv rezervat.
- **Știință:** predominant EN 7–8 (RO 3 cazuri).
- **Localizare:** doar direcția EN → RO.
- **Vârstă:** RO 7 cazuri.
- **Temă:** 67 de cazuri au tema declarată, dar neevidentă în stimul (avertisment `THEME_NOT_EVIDENT`). Pentru ele, tema nu se
  raportează ca acoperire.

## 4. Cerințe de validare (propuse; decizia operatorului: D-19, D-21)

`adjudicationComplete`, `noUnlabeledAfterAdjudication`, `holdoutSealVerified`, `integrityClean`, `regressionRegistryPasses`,
`holdoutEvaluatedOnCurrentEvaluator`, `minPerKindAndSplit {calibration: 8, holdout: 6}`, `minPositivePerKind 3`,
`minNegativePerKind 3`.

Validarea nu conține praguri de performanță (D-21). Starea curentă: `NOT_COMPLETE`.
- **Trec:** HOLDOUT_SEALED, INTEGRITY_CLEAN, REGRESSION_REGISTRY, COVERAGE_MINIMA.
- **Nu trec:** ADJUDICATION_COMPLETE, NO_UNLABELED, CALIBRATION_EVALUATED, HOLDOUT_EVALUATED.

## 5. Limitări (și în manifest)

- **Autor:** același autor (furnizorul de implementare) pentru cazuri, etichete propuse și evaluatori. Sigiliul dovedește doar
  că setul rezervat nu s-a schimbat după scriere. Contaminarea de autor e posibilă (D-22).
- **Stimuli:** scurți și sintetici; nu sunt cărți reale, ilustrații sau reacția copiilor.
- **Evaluatori:** deterministici și euristici, cu analiză structurată pe clauze și lexicoane delimitate. Nu e înțelegere semantică.
- **Praguri:** pragurile de calitate și de vârstă sunt politică editorială, nu optimizate empiric.
