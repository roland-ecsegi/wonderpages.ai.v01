# Hardening — limitări rămase

Aceste limitări rămân **după** hardening. Ce NU se poate afirma: „validat”, „generalizat”, „înțelegere semantică”, „calitate
validată”, „gata de producție”, „testat cu furnizor real”, „Gold-v2 acceptat”, „DW îmbunătățit”.

## 1. Măsurate (dovezi executate)

| # | Limită | Dovadă |
|---|---|---|
| L-1 | **Parafrazele și obiectele din afara lexiconului nu sunt recunoscute.** E limita principală: toate cele 9 eșecuri rezervate sunt de acest tip. | `holdout-run-1.json`: v2h-safety-11 („domn necunoscut”), -14 („cuțit”), -19 („nu au voie”), -21 (insultă nelistată), -22 („dives … alone”), v2h-sci-11 („our planet”), v2h-loc-11 (calc nevăzut) |
| L-2 | **Fals-pass de 0,159 pe setul rezervat** (7 din 44 negative au trecut; 5 sunt de siguranță). Nu e acceptabil pentru o poartă de siguranță. | `HARDENING.md` §5 |
| L-3 | Potrivire pe setul de dezvoltare: 0,993 pe calibrare vs 0,864 pe rezervat. | `calibration-run-1.json`, `holdout-run-1.json` |
| L-4 | `AGE_VOCABULARY` rămâne bazat pe lungimea cuvântului: cuvintele lungi, dar familiare, sunt marcate la 3–4 ani. | v2c-age-voc-01 (calibrare), v2h-age-12 (rezervat) |
| L-5 | Fidelitatea traducerii poate marca o omisiune falsă la idiomuri; acoperă doar conceptele din lexicon; calcurile doar din catalog. | v2h-loc-12, v2h-loc-11 |
| L-6 | Regula aflată în altă propoziție decât acțiunea nu e legată de acțiune. | P-S04 (fără etichetă) |
| L-7 | Familiile de reguli ale setului rezervat apar toate în calibrare (independență 0/69 pe această axă). | `build-report.json` → independence |

## 2. Structurale (din proiectare)

| # | Limită |
|---|---|
| L-8 | Evaluatorii sunt deterministici și euristici: împărțire pe propoziții și clauze, lematizare pe reguli, tulpini RO, lexicoane delimitate. Nu e analiză sintactică și nici înțelegere semantică. |
| L-9 | Doar EN și RO. Localizarea e verificată doar în direcția EN → RO. |
| L-10 | Știință: entitățile și relațiile vin din liste închise și tipare (păsări, pterozauri, oameni, mediere prin fosile/muzeu/carte). |
| L-11 | Calitate: relevanța dovezii citate de critic nu e verificată (`relevance: unverified`). Sub v2 respinge doar citatul care nu apare în text. Dovezile refolosite sau insuficiente doar se raportează (D-18). Verificarea formatului acoperă doar numărul și ordinea paginilor. |
| L-12 | Semnalele noi de vârstă și de fidelitate sunt consultative (minore). Nu schimbă verdictul porții (D-14). |
| L-13 | Expansiunea lexicală s-a limitat la cuvinte din probe/gold-v1, morfologie sistematică și perechi EN↔RO. Chiar și așa, autorul setului rezervat a scris evaluatorii: contaminarea de autor nu poate fi exclusă (D-22). |

## 3. Ale setului de aur

| # | Limită |
|---|---|
| L-14 | Toate etichetele Gold-v2 sunt propuse. Adjudecarea operatorului: 0/226. |
| L-15 | 62 de etichete `current_policy` sunt circulare prin definiție: confirmă implementarea politicii scrise, nu politica. |
| L-16 | Stimulii sunt scurți și sintetici. Calitatea e EN 3–4, cu un singur pozitiv rezervat. Știința e aproape doar EN 7–8. |
| L-17 | Tema e un semnal euristic: 67 de cazuri au tema neevidentă în stimul. |
| L-18 | Starea de validare verifică completitudinea, nu performanța (D-21). „Validare completă” nu va însemna „performanță suficientă”. |

## 4. În afara acestei faze (neatinse, conform instrucțiunii)

- Fără furnizor real: niciun rezultat „real provider”. Mock-urile sunt marcate ca mock.
- Dinosaur World neatins (arhivă, hash-uri, DW01/DW02, O1/O2, Creative Baseline).
- Fără Creative Upgrade real, fără V1 Pilot / V1–V6, fără PHASE 9.
- Fără instalare, fără release Enterprise Local, fără autentificare de cont, fără promovare de maturitate.
- Fără adjudecare Gold-v2 în numele operatorului; fără acceptarea calibrării.
