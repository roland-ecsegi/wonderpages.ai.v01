# Eficacitatea în buclă închisă și experimentele de prompt (P7-T03)

`server/knowledge/effectiveness.js` (versiunea 1) judecă ce s-a învățat pe **rezultate**, cu statistici oneste.

| Element | Regulă |
|---|---|
| Rezultat (`outcome`) | aprobat neatins = succes; **aprobat după reparație/corectură = nu este succesul ieșirii originale**; respins/corectat țintit = eșec; neatins de corectură = fără etichetă. Fiecare rezultat se înregistrează (`Ledger kind: outcome`) cu varianta, modelul, versiunea blueprint-ului, vârsta și lecțiile folosite. |
| Modelul de preferință | validare **grupată pe proiecte** (un proiect nu apare și în antrenare și în test); `accuracy` = acuratețea pe proiecte ținute deoparte (sau `null` sub 3 proiecte); acuratețea pe antrenare este raportată separat cu mențiunea „NU este generalizare”. |
| Variante de prompt/model | recompensele se păstrează și pe **cohortă** (versiune blueprint/prompt, model, vârstă); o competiție se decide numai în interiorul unei cohorte (≥ 10 decizii pe variantă); variantele măsurate în cohorte diferite sunt raportate drept „confundate”. |
| Efectul unei lecții | potrivit pe vârstă, versiune și etapă (înainte vs. cu lecția), cu numărul de eșantioane și limitări; `harmful` = efect negativ pe ≥ 5 utilizări → marcată pentru revizuire; anularea promovării rămâne decizia operatorului (P7-T02). |
| Încrederea istorică | proxy de politică, nu probabilitate validată. |

`GET /api/learning/effectiveness` — validarea modelului, rapoartele pe cohorte, efectele lecțiilor (și cele dăunătoare),
rezultatele pe tipuri, nota despre încredere și baseline-ul Dinosaur World.

**Dinosaur World:** baseline-ul V1 (metrici text) și „după” se raportează separat; fără date „după” nu există diferență;
diferența vizuală este `NOT_AVAILABLE` (nu se inventează); tema rezervată a setului de aur (spațiu) nu este folosită pentru DW.
