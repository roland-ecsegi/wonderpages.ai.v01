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

Directorul se completează pe parcursul fazei. Fiecare livrabil e legat de sursele lui canonice:

- closure §10 și §15–§21;
- câmpurile `openDependencies` și `notDecided` din registrul D-01…D-22.
