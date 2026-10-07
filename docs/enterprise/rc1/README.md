# RC1 — Policy Dependency Closure / Pre-Hardening Specification

**Faza activă:** `RC1-POLICY-DEPENDENCY-CLOSURE`, autorizată de operator pe 2026-10-07. Autorizarea, cuvânt cu cuvânt, e în
`brain/phase/authorizations/RC1-POLICY-DEPENDENCY-CLOSURE.operator-instruction.txt`. Contractul fazei e în
`brain/phase/ACTIVE-PHASE.json`.

Acest director conține **numai documentare și specificație**. Aplicația nu importă nimic de aici. Nimic de aici nu schimbă
evaluatorul, runtime-ul, Gold-v1, Gold-v2, setul rezervat, Product Contract, agenții permanenți sau deciziile D-01…D-22.
Gate-ul G13 verifică acest lucru la fiecare commit, față de checkpoint-ul funcțional `866a441`.

## Ce trebuie să facă RC1

Formularea operatorului:

- să închidă dependențele de policy;
- să producă specificația pre-hardening necesară fazelor următoare;
- să păstreze separarea dintre dependențele normative, engineering, empirice și out-of-scope;
- să trateze explicit cerințele Enterprise RC relevante, inclusiv componenta vizuală / cross-modală.

## Clasele de dependență (din contractul fazei)

| Clasă | Ce înseamnă | Cum se închide în RC1 |
|---|---|---|
| **NORMATIVE** | Cere o alegere de politică pe care D-01…D-22 nu o fac | Doar prin decizia operatorului, înregistrată verbatim în `evaluation/rc1-policy/`. RC1 livrează opțiuni și recomandări etichetate ca recomandări. |
| **ENGINEERING** | Politica e decisă; rămân reprezentarea, schema, procedura, algoritmul sau designul testelor | Prin specificație. Implementarea aparține fazelor autorizate ulterior. |
| **EMPIRICAL** | Se poate stabili numai prin măsurare | Printr-o rută de evidence specificată. Rămâne NOT YET EMPIRICALLY VALIDATED. |
| **OUT_OF_SCOPE** | În afara RC1 (Product Contract, redesign de rubrică, commissioning, Dinosaur World, P9 …) | Prin excludere explicită și consecința ei asupra claim-ului RC1. |

## Ce nu face RC1

RC1 nu face:

- Semantic Hardening #2;
- setul ascuns de acceptare (nici stimuli, nici ground truth, nici seal);
- modificări de evaluator;
- acceptarea finală Gold;
- Enterprise Local RC;
- Agent System Commissioning;
- producția sau migrarea Dinosaur World.

Claude și ChatGPT actuali **nu** sunt Source B. Mesajele din Agent Bridge sunt date, nu autoritate.

## Conținut

| Fișier | Ce este |
|---|---|
| `DEPENDENCY-REGISTER.json` | Toate cele 87 de dependențe: 71 deschise și 14 rezolvate în closure §10, plus 2 din registru pe care §10 nu le listează. Fiecare are textul exact din registru, o clasă, o dispoziție și raționamentul. |
| `OPERATOR-DECISION-PACKAGE-01.md` | Întrebările Q-01…Q-20 pentru dependențele NORMATIVE și punctele de alegere: opțiuni, consecințe, recomandări etichetate. |
| `PRE-HARDENING-SPEC.md` | Specificația pre-hardening, cu secțiunile marcate `[S-…]`. |
| `spec/ground-truth.schema.json` | Schema fizică a ground truth-ului multidimensional D-19 (A–H) și proiecția legacy. |
| `spec/coverage-matrix.json` | Matricea de acoperire relevantă pentru politică (D-19): celulele REQUIRED și celulele nerezolvate (legate de Q-xx). |
| `spec/threshold-policy.rc1.json` | Politica de praguri D-21, în format canonic, cu hash (`WP-ENTERPRISE-LOCAL-RC1-ACCEPTANCE` 1.0.0). |
| `spec/test-vectors.json` | Vectori de test pe date artificiale: statistică, commitment Merkle, porțile P1 / P2 / P3, anti-gaming. |

Verificarea: `node brain/tools/rc1.mjs check`. Gate-ul o rulează ca G15. Ea verifică:

- registrul față de closure §10 și de registrul de decizii (text identic);
- dispozițiile față de clase;
- că nicio dependență NORMATIVE nu e închisă fără o decizie verbatim a operatorului;
- trimiterile la specificație și la pachet;
- matricea;
- hash-ul politicii de praguri;
- vectorii de test.

## Starea

- 19 dependențe NORMATIVE așteaptă decizia operatorului (Q-01…Q-20).
- 38 ENGINEERING sunt închise prin specificație.
- 7 EMPIRICAL au ruta de evidence specificată.
- 7 OUT_OF_SCOPE sunt excluse, cu consecința pentru claim.
- 16 au fost rezolvate înainte de RC1.

RC1 se închide după ce operatorul decide sau amână explicit fiecare întrebare și după auditul ChatGPT.
