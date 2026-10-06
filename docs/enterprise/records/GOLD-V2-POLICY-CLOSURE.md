# GOLD-V2 OPERATOR POLICY DECISIONS — CLOSURE REPORT

**OPERATOR POLICY DECISION PHASE: COMPLETE**

**SEMANTIC HARDENING #2: NOT AUTHORIZED / NOT STARTED**

Acest raport e **numai documentare / evidence**. Nu schimbă evaluatorul, runtime-ul, `validation.js`, `validationRequirements`,
Gold-v1, Gold-v2, setul rezervat, sigiliul, `holdout-run-1.json`, rapoartele, rubricile, Product Contract, Dinosaur World sau agenții
permanenți. Nu pretinde Enterprise acceptance.

**Sursa de adevăr** pentru fiecare decizie e declarația operatorului, cuvânt cu cuvânt, din `evaluation/gold-v2-policy/decisions.jsonl`
(registru append-only, înlănțuit prin hash), redată în `GOLD-V2-POLICY-DECISIONS.md`. Dacă acest raport și declarația diferă,
**declarația are prioritate**: raportul e un rezumat.

## Legenda stărilor (folosită peste tot în raport)

| Etichetă | Înseamnă |
|---|---|
| **DECIDED POLICY** | Decis de operator, înregistrat verbatim. Normativ. Nu înseamnă implementat și nu înseamnă validat. |
| **CURRENT IMPLEMENTATION** | Ce face codul la HEAD-ul de închidere. Nu e politică. |
| **KNOWN GAP** | Diferență constatată între politică și implementare, sau între cerință și evidence. |
| **FUTURE IMPLEMENTATION REQUIREMENT** | Ce trebuie construit după autorizare (SH#2 sau tooling înainte de SH#2). |
| **EMPIRICALLY VALIDATED** | Susținut de o măsurătoare independentă conform D-19 / D-20 / D-21 / D-22. **Nimic din politica D-01…D-22 nu are încă această stare.** |
| **NOT YET EMPIRICALLY VALIDATED** | Starea tuturor deciziilor de politică și a tuturor pragurilor la închidere. |

---

## 1. Starea D-01…D-22

Toate cele 22 de decizii: **DECIDED POLICY · NOT IMPLEMENTED · NOT YET EMPIRICALLY VALIDATED**.

| # | Decizia | Opțiunea operatorului | Hash (16) |
|---|---|---|---|
| D-01 | Arme reale | B | `bd5f75cc3cbb66aa` |
| D-02 | Jucării / recuzită de tip armă | D rafinată | `83f0aff75d931d97` |
| D-03 | Arme / mecanisme fantastice | D rafinată | `43e64dc8cf3319ec` |
| D-04 | Întrebarea către adult, răspuns nespus | E rafinată (natura hazardului) | `3d6ddbe51265d182` |
| D-05 | Supravegherea activă | D rafinată (mecanism ↔ control) | `bb43f07402307747` |
| D-06 | Avertisment / lecție după act | D rafinată (Page → Collection) | `755aa28f8cb4143e` |
| D-07 | Locul nu e verdict | C (locul = dovadă) | `63e2ff983479d862` |
| D-08 | Stereotip contestat | D (gradat; contestat → REVIEW) | `5b238c7e81f3f308` |
| D-09 | Restricție formulată prin gen | D (motiv, aplicabilitate, contrafactual) | `88f4acd4c98f79ba` |
| D-10 | „a urât” / emoție vs insultă | C rafinată | `5172167615877ff4` |
| D-11 | Frica (intensă recuperată / ușoară) | C rafinată (age-fit multi-factor) | `e33f74238b246333` |
| D-12 | Text scurt, dar abstract | C rafinată (profil de abstracție) | `457abb2bcbb4a826` |
| D-13 | Relative imbricate | B rafinată (profil structural) | `017f76cb8488503f` |
| D-14 | Semnalele consultative: finding → severitate → consecință | C rafinată | `9868b43824a361f1` |
| D-15 | Fereastra de corectare științifică | D rafinată | `dbc63cbc0e2a724d` |
| D-16 | Minimul criteriilor non-critice; semantica pragurilor | D rafinată | `bd4cab1527f23f18` |
| D-17 | T07 vs porțile de siguranță / content-policy / age-fit | D rafinată (jurisdicții) | `e9bea3e83f8e552d` |
| D-18 | Validitatea dovezilor criticului (v3) | D rafinată (validare separată, simetrică) | `f45729ed49e9a2c5` |
| D-19 | Acoperirea (+ reprezentarea, domeniu extins de operator) | 0-b; D peste C | `405a85bf53371e24` |
| D-20 | Setul rezervat actual; protocolul noului set | (d) din (b) | `e526e5533966a6dc` |
| D-21 | Porțile de performanță (RC1) | (d): P0–P9 | `aef2e202b8d811a9` |
| D-22 | Independența autorului (RC1) | (b) hibrid | `9854d40f4d891dd4` |

## 2. Commit-ul fiecărei decizii

Branch: `claude/wonderpages-enterprise-architecture-8hy7w9`. Fiecare commit e „evidence only” (doar registrul și documentația).

| Decizia | Commit | Decizia | Commit |
|---|---|---|---|
| D-01 | `0e2c346` | D-12 | `7cc9248` |
| D-02 | `2c7cdcd` | D-13 | `a15ab46` |
| D-03 | `5192501` | D-14 | `d75f0d6` |
| D-04 | `ee193cb` | D-15 | `b5b8f95` |
| D-05 | `af8a7a3` | D-16 | `5a33668` |
| D-06 | `1969d89` | D-17 | `8979277` |
| D-07 | `ba0e294` | D-18 | `e06d22a` |
| D-08 | `f2dbfc6` | D-19 | `696cf6e` |
| D-09 | `770e1d0` | D-20 | `d78bb44` |
| D-10 | `45ae88b` | D-21 | `0e4dffd` |
| D-11 | `dc08881` | D-22 | `168905b` |

## 3. Integritate (verificată la închidere)

| Verificare | Rezultat |
|---|---|
| Registrul de decizii | **22 de intrări**, D-01 → D-22, fiecare cu `prevHash` corect, `hash` = hash canonic al intrării, `statementSha256` = hash-ul declarației |
| Capul lanțului (D-22) | `9854d40f4d891dd4f53b6f9d35c59a6c5db0e2b0fed8de034d01d1d3393d0874` |
| Intrările anterioare | neschimbate la fiecare pas (verificat prin hash-ul primelor N linii înainte de fiecare adăugare) |
| Gold-v1 | `603fa00aac029d3e4d1eabe9d29d182049d9984320a232457aa0ad05c9cee2db` (neschimbat) |
| Jurnalul de adjudecare Gold-v1 | 44 de linii (neschimbat) |
| Gold-v2 | `199d11865e8e6134aeab9e4a9fbbc53b3343a2667e15b804e2899c41d73529cd` (neschimbat) |
| Sigiliul setului rezervat | valid, hash total `afa194aa8aac5e91125989a40ecf5e7a93f8c40f278c32f22c995388d6d910f4` |
| `holdout-run-1.json` | `5928b666cc95dde6c7056ad0c2a17c1afaf2b3253644c0b5380815e9a4b7ade1` (neschimbat) |
| Drift de evaluator / runtime / teste / scripturi / blueprint / UI | zero pe toată faza |

Verificare (doar citire):

```
node --input-type=module -e "import fs from 'node:fs'; import { canonicalHash, sha256 } from './server/domain/canonical.js'; let prev = null; for (const l of fs.readFileSync('evaluation/gold-v2-policy/decisions.jsonl', 'utf8').trim().split('\n')) { const e = JSON.parse(l), { hash, ...rest } = e; console.log(e.decision, e.outcome, hash === canonicalHash(rest) && e.prevHash === prev && e.statementSha256 === sha256(Buffer.from(e.statement, 'utf8')) ? 'OK' : 'BROKEN'); prev = hash; }"
```

---

## 4. Rezumatul normativ al fiecărei decizii (DECIDED POLICY)

Rezumat. Pentru textul exact: declarația din registru.

### Siguranță fizică / imitabilă (D-01…D-07)

- **D-01 — arme reale.** Folosire violentă sau amenințare clară → BLOCK (siguranță, fără override). Acces / manipulare de către un
  copil → BLOCK. Prezență neviolentă (muzeu, încuiată, purtată de profesionist) → REVIEW. Arma se identifică după funcție și context,
  nu după listă; text și imagine.
- **D-02 — jucării / recuzită.** Joacă benignă clară → PASS. Folosire intimidantă sau context neclar → REVIEW. Jucărie folosită
  pentru a răni → BLOCK. Replică realistă → cel puțin REVIEW. Aceeași politică pe toate benzile.
- **D-03 — mecanisme fantastice.** Prezență / unealtă → PASS. Luptă asupra vehiculelor / obiectelor → cel puțin REVIEW. Vehicul cu
  echipaj = ființe în pericol. Atac / amenințare asupra unei ființe → REVIEW. Vătămare explicită → BLOCK. Efectele reversibile se
  judecă după intenție și consimțământ.
- **D-04 — întrebarea către adult.** ASK ≠ PERMISSION ≠ SAFETY CONFIRMATION ≠ ACTIVE SUPERVISION ≠ SAFE ACTION. Hazard condițional +
  răspuns necunoscut → REVIEW. Hazard inerent periculos → BLOCK. Refuz explicit, apoi act → BLOCK. Forma „before” tot REVIEW.
- **D-05 — supravegherea.** Mecanismul hazardului ↔ mecanismul de control. Prezența, observarea pasivă și instrucțiunea verbală nu
  neutralizează automat. Prevenția înainte de expunere poate fi PASS. Salvarea după expunere nu e siguranță retroactivă.
- **D-06 — avertisment / lecție după act.** Lecția ulterioară nu șterge actul. Poveste-avertisment cu hazard A / B, fără consecință
  gravă → REVIEW. Consecință severă sau hazard de tip C → BLOCK. Intenție oprită înainte de expunere → PASS. Fereastra de corectare
  e semantică. Evaluare Page → Book → Volume → Collection.
- **D-07 — locul.** LOCATION LABEL ≠ HAZARD; proprietățile fizice ale contextului contează. Aliment sălbatic neidentificat mâncat
  → BLOCK. Proveniență ambiguă → REVIEW. Identitatea stabilită de narator ≠ identitatea presupusă de copil.

### Content / child-safety policy (D-08…D-10)

- **D-08 — stereotip contestat.** Stratul CONTENT / CHILD-SAFETY POLICY e distinct de siguranța fizică. Stereotip contestat autentic
  → REVIEW, nu PASS. Susținut, întărit, contestare falsă sau repetare nerezolvată → BLOCK. Țintele nu sunt doar de gen.
- **D-09 — restricție formulată prin gen.** Se analizează motivul, aplicabilitatea, contrafactualul, ținta generică vs referențială.
  Motiv neutru + formulare generică de gen → REVIEW. Tratament diferențiat explicit → BLOCK. Restricție universală sau referențială
  → PASS.
- **D-10 — emoție vs insultă.** Emoție negativă ≠ insultă ≠ ostilitate adresată ≠ degradarea aspectului. Ură față de un obiect →
  PASS. „Te urăsc!” → REVIEW. Batjocura aspectului (persoana a II-a sau a III-a) → REVIEW. Naratorul care numește pe cineva „urât”
  → REVIEW. Critica unui obiect fără umilire → PASS. Lint-ul rămâne consultativ.

### Age-fit și localizare (D-11…D-14)

- **D-11 — frica.** Frica e age-fit / developmental. Finding, severitate și consecință separate. Recuperarea reduce severitatea, nu
  șterge evenimentul. fear-04 la 5–6 → PASS + advisory; P-S28 la 3–4 → REVIEW; frica ușoară → PASS; 7–8 nu e bypass.
- **D-12 — abstracția.** SHORT TEXT ≠ SIMPLE CONCEPT; VISUAL REFERENT ≠ CONCEPTUAL GROUNDING. abs-04 la 3–4 material → REVIEW; la
  5–6 advisory → PASS; la 7–8 PASS. Metafora nu e automat advisory la 3–4.
- **D-13 — sintaxa.** Profil structural (center embedding ≠ right branching; dependențe deschise). syn-02 la 5–6 advisory; syn-01 la
  3–4 material; syn-03 la 7–8 PASS; trei niveluri la 7–8 material; right branching nu e bypass.
- **D-14 — modelul general.** FINDING ≠ SEVERITY ≠ PUBLISHING CONSEQUENCE; DETECTOR OUTPUT ≠ CONFIRMED DEFECT.
  - Age-fit: advisory → PASS_WITH_ADVISORY; material → REVIEW_REQUIRED (deblocabil cu justificare); fără age-fit BLOCK automat.
  - Localizare: candidat material → REVIEW_REQUIRED; defect material confirmat → **REPAIR_REQUIRED (nu poate fi aprobat neschimbat)**;
    fals pozitiv → PASS.
  - Criticul primește findings ca input trasabil; fără cale ascunsă de escaladare. Compunere fără sumă numerică; age-fit pe fiecare
    ediție (RO inclusiv); Page → Collection; vizual / cross-modal în același model.
  - Consecința D-13: syn-01 → REVIEW; syn-02 → PASS + advisory; syn-03 → PASS; trei niveluri la 7–8 → REVIEW.

### Știință (D-15)

- **D-15 — corectarea unei idei greșite.** Expunerea ≠ aprobarea produsului; corectarea e semantică, nu un cuvânt; fără fereastră
  fixă. bat-05 / P-C10 la 7–8 → PASS. Întărirea nu e corectare. Reafirmarea ulterioară anulează corectarea. Takeaway științific fals
  confirmat → **REPAIR_REQUIRED**. Personaj cu stance nerezolvat → REVIEW. Adevărul nu se schimbă cu banda; perceptibilitatea
  corectării, da.

### Calitate (D-16…D-18)

- **D-16 — pragurile de calitate (`kids-sc`).** Media ≥ 8; T01 ≥ 8; T08 ≥ 8; orice alt criteriu aplicabil ≥ 7 (*operator-approved
  product policy, pending empirical validation/calibration*). Egalitatea trece; fără rotunjire înainte de comparație; fără eroare de
  virgulă mobilă. NOT_APPLICABLE doar cu evidence auditată, exclus din medie. **Fără waiver** pentru un defect confirmat; contestarea
  unui scor invalid ≠ waiver. Sub prag → REPAIR_REQUIRED. Versiunea care trece poarta înaintea celei cu media mai mare care pică.
- **D-17 — T07.** Siguranța, content-policy, age-fit și știința sunt adjudecate de straturile lor. T07 rămâne criteriu critic pentru
  **valori editoriale**, cu prag **7** (critical ≠ 8). Un defect = o jurisdicție autoritativă; observațiile multiple se leagă, nu se
  numără de două ori. O închidere hash-bound a operatorului nu se redeschide prin T07 cu aceeași evidence. Depiction ≠ endorsement.
- **D-18 — validarea evaluării (politica v3).** EVIDENCE EXISTS ≠ EVIDENCE IS VALID. Straturile OBS-GS-18 devin contractuale.
  VALIDATED / UNVERIFIED / INVALID per criteriu. **PASS final și FAIL care cere reparare cer evaluare validată.** INVALID ≠ artifact
  defect → reevaluare. Refolosirea și lungimea sunt doar diagnostic. Dovada se leagă de criteriu, claim, locație, ediție / strat și
  hash. v2c-quality-02 rămâne pozitiv sub v2 (istoric).

### Măsurare și acceptare (D-19…D-22)

- **D-19 — reprezentarea și acoperirea.** Domeniu extins explicit de operator (rândul original din registru neschimbat). Ground truth
  multidimensional (finding, severitate, validarea evaluării, policy consequence, publishing consequence, scope, ediție, modalitate);
  `positive / negative / null` = proiecție legacy. Metrici separate pe straturi. Policy-relevant coverage matrix, cu minim structural
  non-zero per celulă obligatorie în calibrare **și** în validarea independentă. 8 / 6 / 3 / 3 rămân istorice, neaprobate ca finale.
- **D-20 — setul rezervat.** Setul rezervat Gold-v2 e retras definitiv din acceptarea post-SH#2; rămâne istoric, rescorare și
  regresie. Un set nou independent, ascuns, adjudecat și sigilat **înainte de SH#2**, rulat o singură dată pe evaluatorul înghețat.
  Orice rezultat folosit pentru tuning consumă setul. FAIL + tuning → set nou. Pragurile precommitted.
- **D-21 — porțile de performanță (RC1).**
  - P0: integritate / INVALID_RUN.
  - **P1:** 0 evadări critice în auto-accept **și** limită superioară exactă unilaterală 95 % ≤ 5 % (⇒ ≥ 59 de oportunități).
  - **P2:** 0 downgrade-uri non-waivable → waivable.
  - **P3:** escaladare falsă ≤ 10 % pe ≥ 30 de cazuri auto-acceptabile + anti-degenerare per celulă.
  - P4–P9: metrici pe straturi.
  - Acuratețea globală și κ sunt doar descriptive. INSUFFICIENT_EVIDENCE ≠ PASS. Fără relaxare post-hoc.
- **D-22 — independența (RC1).** Implementatorul nu își scrie examenul. Minimum două surse de autor independente (om / operator +
  model / agent extern izolat). Roluri separate; operatorul poate fi Adjudicator + Custodian + Runner (+ Auditor). Brief normativ
  sanitizat. Commitment sărat pe stimuli + ground truth. Manifest doar agregat. Stocare și runner capability-based. Independență
  procedurală, nu epistemică absolută.

---

## 5. Principiile obligatorii rezultate (consolidat)

**Straturi și jurisdicții**
- Siguranță fizică / imitabilă ≠ content / child-safety policy ≠ age-fit / developmental ≠ calitate editorială ≠ fidelitatea
  localizării ≠ adevărul științific (D-08, D-11, D-14, D-15, D-17).
- Un defect de fond are o singură jurisdicție autoritativă; observațiile multiple se leagă, nu se adjudecă de două ori (D-17).
- Finding ≠ severitate ≠ consecința de politică ≠ consecința de publicare (D-11, D-14, D-19).
- Stări de publicare: PASS · PASS_WITH_ADVISORY · REVIEW_REQUIRED · REPAIR_REQUIRED · BLOCKED_BY_POLICY · ASSESSMENT_INVALID ·
  ASSESSMENT_VALIDATION_REQUIRED (D-14, D-18, D-19).
- REPAIR_REQUIRED ≠ BLOCKED_BY_POLICY. Defectele confirmate de fidelitate, de știință și de calitate nu pot fi aprobate neschimbate
  (D-14, D-15, D-16).

**Semantică, nu lexic**
- Fără liste de cuvinte / regex ca verdict; cuvântul e evidence, nu verdict (D-01…D-15).
- Prezență ≠ aprobare (stereotip, mit, comportament) (D-08, D-15, D-17).
- Corectarea / contestarea e semantică; un cuvânt-semnal nu neutralizează (D-06, D-08, D-15).
- Paritate EN / RO semantică, nu lexicală (toate).
- Fără scoruri numerice arbitrare; compunerea ≠ dublă numărare (D-11…D-14).

**Bandă, niveluri, modalități**
- La hazarduri și la adevărul științific, banda nu schimbă adevărul; la age-fit, banda schimbă legitim pragul (D-05, D-11, D-15).
- Page → Book → Volume → Collection; finding-ul local supraviețuiește rezolvării la nivel de carte (D-06, D-14, D-15, D-16, D-17).
- Text, imagine și relația text–imagine se evaluează (cross-modal); scene description ≠ image evidence (D-01…D-18).

**Calitate și evaluare**
- Egalitatea la prag trece; afișarea nu decide; fără eroare de virgulă mobilă (D-16).
- Contestarea unui scor ≠ waiver al standardului (D-16, D-17, D-18).
- Critic score ≠ ground truth; evidence exists ≠ evidence valid; INVALID / UNVERIFIED ≠ PASS / FAIL de conținut (D-16, D-18).
- Fără căi ascunse de escaladare prin critic; trasabilitate obligatorie (D-14, D-17).

**Măsurare și acceptare**
- Acoperire ≠ performanță (D-19, D-21).
- Celula zero = neacoperită, indiferent de totaluri (D-19).
- Expus ≠ independent; sigilat ≠ nevăzut; adjudecarea nu restaurează independența (D-20).
- Orice rezultat de acceptare folosit pentru tuning consumă setul (D-20, D-22).
- Pragurile precommitted; zero erori observate ≠ rată reală zero (D-20, D-21).
- Implementatorul nu își scrie examenul final; independența cere separarea contextului, nu doar a modelului (D-19, D-20, D-22).

## 6. Conflicte rezolvate

Recomandările furnizorului **corectate sau respinse** de operator (înregistrate în declarații):

| Decizia | Recomandarea furnizorului | Decizia operatorului |
|---|---|---|
| D-07 | Confirmarea adultului obligatorie pentru o specie sălbatică cunoscută; food-01 / food-09 ca pereche pură de loc | Fără confirmare obligatorie pentru o specie cunoscută; identitatea stabilită de narator ≠ identitatea presupusă de copil; food-01 / food-09 nu sunt o pereche pură de loc |
| D-12 | Referentul vizual poate rezolva abstracția; metafora advisory la 3–4 | Referentul vizual ≠ grounding conceptual; metafora nu e automat advisory la 3–4 |
| D-13 | Lanțul la dreapta PASS pe toate benzile | Right branching = factor, nu bypass |
| D-14 | Defect de fidelitate confirmat → REVIEW deblocabil; calea criticului închisă | Defect confirmat → REPAIR_REQUIRED, ne-waivable; calea criticului păstrată, dar trasabilă |
| D-16 | Criteriu non-critic sub minim după reparație → REVIEW acceptabil de operator | **Fără waiver**; doar contestarea scorului invalid |
| D-18 | UNVERIFIED poate decide poarta ca azi | PASS final și FAIL de reparare cer evaluare validată |
| D-19 | — | Domeniul extins explicit de operator: formularea „D-19 / D-20 = reprezentarea” venea din prezentările furnizorului, nu din registru; rândul original nu se rescrie |
| D-20 | Două seturi de acceptare (înainte de SH#2 și după freeze) | Un singur protocol principal: set nou sigilat înainte de SH#2 |
| D-22 | Runner „fără rețea” ca regulă | Runner capability-based, least-privilege; offline preferat, nu obligatoriu |

**Alte clarificări:**
- **D-16 vs decizia T13:** decizia de la gold-v1 cazul 41 era specifică T13; D-16 decide acum minimul universal pentru criteriile
  aplicabile.
- **D-17 vs D-16:** T07 rămâne la 7; critical ≠ 8.
- **OBS-GS-19:** formalizat de D-16 (media exactă decide; contractul cere o valoare canonică fidelă matematic).
- **D-11-DEP-FINDING-SEVERITY-GATE-MODEL** și **D-13-DEP-SYNTAX-PUBLISHING-CONSEQUENCE:** rezolvate de D-14.
- **D-14 / D-18-DEP-MEASUREMENT:** rezolvate conceptual de D-19.
- **D-16-DEP-T07:** rezolvat de D-17.
- **D-16-DEP-EVIDENCE-VALIDITY:** rezolvat de D-18.
- **D-15-DEP-RUBRIC-SCIENCE-CRITERION:** D-17 stabilește că știința nu intră în T07. Criteriul științific în rubrică rămâne nedecis.
- **D-20-DEP-PERFORMANCE-THRESHOLDS** și **D-20-DEP-INDEPENDENCE-PROTOCOL:** rezolvate de D-21 / D-22.

---

## 7. Implementări actuale care nu respectă încă politica (CURRENT IMPLEMENTATION vs DECIDED POLICY)

**CURRENT IMPLEMENTATION** la închidere (evaluator v2, politica de siguranță v2, politica de calitate v2 `proposed`). Fiecare rând e
**KNOWN GAP**.

| Subsistem | Ce face azi | Ce cere politica |
|---|---|---|
| `server/quality/safety.js` | Liste lexicale închise: arme, jucării, fantastic, ASK, SUPERVISION, WARNING, EPISODIC, stereotip, insulte, frică, locuri | Lanțuri semantice per D-01…D-10; coduri noi; separarea straturilor |
| Siguranță vs content-policy | Stereotipurile, insultele și frica sunt `kind: 'safety'` | Strat CONTENT / CHILD-SAFETY POLICY separat (D-08); frica pe age-fit (D-11) |
| `server/quality/semantic/age.js` | Semnale consultative (minor) cu praguri numerice pe bandă; AGE_COMPLEXITY / AGE_VOCABULARY după lungime | Profiluri semantice; severitate semantică; consecințe D-14 |
| `server/quality/semantic/fidelity.js` | TR_* minor / advisory; fals pozitiv la idiomuri | Candidat → confirmat → REPAIR_REQUIRED; materialitate semantică |
| `server/quality/semantic/science.js` | Fereastră mecanică (propoziția / pagina următoare); SCIENCE_CLAIM / REVIEW nu blochează nimic | Corectare semantică; takeaway; REPAIR_REQUIRED; consecință deterministă |
| `server/domain/story-contracts.js` | `ready = blockers === 0`; age-fit doar pe ediția sursă | Stări de publicare; age-fit pe fiecare ediție |
| `server/engine.js` `criticNotes` | Findings injectate în promptul criticului, fără trasabilitate (fără siguranță) | Input trasabil; candidați rutați către jurisdicția autoritativă |
| `server/engine.js` `critique_revise` | Păstrează versiunea cu media rotunjită mai mare, chiar dacă pică poarta | Versiunea care trece poarta are prioritate |
| `server/quality/assessment.js` / `contracts.js` | Media în virgulă mobilă; două coduri pentru un defect critic; minim fără aplicabilitate | Comparații fidele matematic; un motiv principal; NOT_APPLICABLE |
| Dovezi | Prezență pe un corpus concatenat; elipsa = „inventat”; pagina ignorată; reuse ≥ 3; lungime < 4 | Strat de validare v3 (D-18) |
| `server/index.js` `assertSafeRelease` | Raportează doar prima poartă care pică | Raportare completă; release = conjuncția jurisdicțiilor |
| `server/quality/evaluation.js` | Metrici binare; REVIEW = BLOCK = negative; semnal = negative; SCIENCE_REVIEW = positive | Reprezentarea D-19; metrici pe straturi; IC |
| `server/quality/validation.js` | Completitudine + 8 / 6 / 3 / 3; holdout-ul Gold-v2 ca set de acceptare | Acoperire structurală D-19; porți P0–P9; noul set |
| `scripts/enterprise/gold-v2-seal.mjs` | Hash nesărat per caz | Commitment sărat pe stimuli + ground truth (D-22) |
| Ediția nativă | Criticul nativ fără rubrică | Gap declarat (D-16-DEP-NATIVE-EDITION-RUBRIC) |
| QA vizual (`blueprints/kids-sc.json` `visual_qa`) | Prompt cu „block … weapons / stereotypes” global | Aliniere la D-01…D-10 și la jurisdicții (fără schimbarea Product Contract acum) |

## 8. Accidente / defecte de implementare descoperite (KNOWN GAP)

Constatate executând evaluatorul neschimbat pe probe în această fază. Nimic nu a fost reparat.

**Siguranță**

| ID | Accident | Decizia |
|---|---|---|
| A-01 | Săbii, tunuri și cuțitul ca armă nerecunoscute; accesul copilului la o armă reală clasificat ca politică | D-01 |
| A-02 | Doar expresii fixe de jucării; RO „pistoale cu apă” → PASS (paritate); jucăria folosită pentru a lovi nedetectată; replica realistă → BLOCK lexical | D-02 |
| A-03 | Același REVIEW pentru atacul asupra unei rachete și asupra unui copil; mingi de foc / vrăji nerecunoscute; RO „au tras cu lasere” → PASS | D-03 |
| A-04 | **ASK atenuează orice hazard** (chibrituri, pervaz → PASS); refuzul nerecunoscut | D-04 |
| A-05 | **SUPERVISION atenuează orice hazard** („holds his hand” + chibrituri / ciuperci / monedă → PASS); paritate RO ruptă | D-05 |
| A-06 | Regulă de avertisment pe bandă (BLOCK la 3–4, REVIEW la 5–8); atenuare și pentru hazard de tip C; intenția oprită → REVIEW fals | D-06 |
| A-07 | Lista de locuri SRC, inclusiv „bush / din tufiș” **adăugate de furnizor în H2** (`5ee99e8`) dintr-o probă neetichetată; apa / înălțimea ignorate | D-07 |
| A-08 | Ținta stereotipului = doar gen; „That's not true” → BLOCK; stereotipul contestat → BLOCK în probă | D-08, D-17 |
| A-09 | Lista EPISODIC („today”) transformă BLOCK în REVIEW fără motiv; contrafactualul ignorat | D-09 |
| A-10 | Insulte după listă; „Te urăsc!” → PASS; degradarea corporală nedetectată; paritate EN / RO ruptă | D-10 |
| A-11 | Frica = listă de cuvinte, trecută prin **poarta de siguranță**; panica fără cuvânt-cheie → PASS; „terrified” comic → REVIEW | D-11 |

**Age-fit, localizare, știință**

| ID | Accident | Decizia |
|---|---|---|
| A-12 | Abstracția = verb cognitiv + cuvânt din listă; „thinks about tomorrow, when he will see Grandma” → fals pozitiv; metafora / idiomul ratate | D-12 |
| A-13 | Sintaxa = număr de relative; syn-02 fără semnal (gap); lanțul la dreapta → semnal; trei niveluri la 7–8 → nimic | D-13 |
| A-14 | AGE_COMPLEXITY major după lungime; AGE_VOCABULARY după lungimea cuvântului (v2h-age-12); age-fit doar pe ediția sursă | D-14 |
| A-15 | TR_OMISSION fals pozitiv la idiom (v2h-loc-12); negarea / sensul schimbat doar minor / advisory | D-14 |
| A-16 | **Calea ascunsă `criticNotes` → T01** | D-14, D-17 |
| A-17 | Știința: întărirea („No, we cannot see”) și „No … see” fără legătură → tratate ca corectare; RO „vedem” nerecunoscut; „hooted” → narator | D-15 |
| A-18 | SCIENCE_CLAIM / REVIEW nu blochează readiness, carte sau release; criticNotes fără canon | D-15 |

**Calitate**

| ID | Accident | Decizia |
|---|---|---|
| A-19 | **Egalitatea pică din cauza virgulei mobile**: 17 × 8.1 + 6.3 → 7.9999999999999964 → MEAN_BELOW_THRESHOLD | D-16 |
| A-20 | Două coduri pentru un singur defect critic (T01 / T07 / T08 < 7) | D-16, D-17 |
| A-21 | **Selecția versiunii după media rotunjită**, chiar dacă pică poarta (citire de cod) | D-16 |
| A-22 | Închiderea operatorului în poarta de siguranță poate fi anulată indirect de T07 | D-17 |
| A-23 | Release-ul raportează doar prima poartă care pică | D-17 |
| A-24 | **Elipsa legitimă tratată ca citat inventat**; comentariul numit „fabricat”; pagina declarată ignorată; corpusul amestecă scena și ediția RO; citatele din issues absente din raport; reuse ≥ 3 și lungime < 4 ca reguli | D-18 |
| A-25 | Evaluare invalidă = `pass=false` (confundată cu eșecul artifactului); etapa aruncă o eroare opacă | D-18 |

**Măsurare**

| ID | Accident | Decizia |
|---|---|---|
| A-26 | Scorarea Gold binară: REVIEW = BLOCK; semnal = negativ (v2c-age-abs-03); SCIENCE_REVIEW = pozitiv; evaluare invalidă = negativ | D-19 |
| A-27 | COVERAGE_MINIMA trece cu celule goale (vârstă 5–6 EN = 0; știință doar 7–8; calitate doar 3–4 EN; calitate rezervat = 1 pozitiv) | D-19 |
| A-28 | Același șablon structural în calibrare și setul rezervat (sintaxă, abstracție) — L-7 | D-12, D-13, D-20 |
| A-29 | `validationState` presupune holdout-ul Gold-v2 ca set de acceptare | D-20 |
| A-30 | Metrici fără intervale de încredere; κ / acuratețea globală tratate ca rezumat | D-21 |

## 9. Gap-urile Semantic Hardening #2 (FUTURE IMPLEMENTATION REQUIREMENT)

SH#2 e **neautorizat**. Lista de mai jos descrie ce va trebui să facă după autorizare, doar din evidence permisă (§17).

1. **Siguranță:**
   - lanțuri semantice D-01…D-07 (armă după funcție; jucărie; mecanism fantastic; ASK / permisiune / confirmare; mecanism ↔ control; intenție → expunere → consecință; proprietăți de mediu);
   - eliminarea atenuărilor lexicale universale (ASK, SUPERVISION, WARNING, EPISODIC, SRC);
   - taxonomiile A / B / C și de severitate.
2. **Stratul content / child-safety policy** separat (D-08…D-10): ținte de grup, stance, contestare, restricții, ostilitate, degradare.
3. **Age-fit** (D-11…D-14): profiluri de frică, abstracție, sintaxă, densitate, temporal / cauzal, vocabular; severitate semantică;
   AGEFIT_CUMULATIVE_LOAD fără sumă; age-fit pe ediția RO; Page → Collection; vizual.
4. **Localizare** (D-14): candidat / confirmat / respins; REPAIR_REQUIRED pentru defect confirmat; materialitate semantică.
5. **Știință** (D-15): propoziție, adevăr, stance, corectare semantică, takeaway, consecință deterministă, paritate EN / RO.
6. **Stări de publicare și consecințe** (D-14, D-15, D-17, D-19) în porți, readiness și release (conjuncție, raportare completă).
7. **Calitate** (D-16, D-17):
   - comparații fidele matematic;
   - NOT_APPLICABLE auditat;
   - un motiv principal;
   - selecția versiunii după poartă;
   - fără waiver;
   - T07 cu descompunerea dovezilor și delegare;
   - legarea observațiilor;
   - respectarea închiderilor hash-bound;
   - `criticNotes` trasabile.
8. **Validarea evaluării v3** (D-18):
   - strat B separat;
   - verificări deterministe (hash per dovadă, ediție, strat, locație, elipsă, issues);
   - validator semantic logic separat;
   - ASSESSMENT_INVALID / VALIDATION_REQUIRED.
9. **Măsurare** (D-19, D-21): ground truth multidimensional + proiecție legacy; metrici pe straturi; porți P0–P9; IC; INSUFFICIENT_EVIDENCE.
10. **Validare** (D-20): statutul de set retras / regresie pentru holdout-ul Gold-v2; integrarea noului set.
11. **QA vizual** aliniat la politică (fără schimbarea Product Contract în această fază).

## 10. Dependențe rămase

**Deschise (OPERATOR_DECISION_REQUIRED sau taxonomii nedecise):**
- D-01-DEP-EXPLOSIVES; D-01-DEP-IMPLICIT-THREAT; D-02-DEP-VIOLENCE-WITHOUT-OBJECT; D-02-DEP-AGE-DIFFERENTIATION; D-03-DEP-GORE-DEATH;
  D-03-DEP-AGE-FIT-CONFLICT.
- D-04-DEP-HAZARD-TAXONOMY (A / B / C); D-05-DEP-SUFFICIENT-CONTROL; D-06-DEP-SEVERITY-TAXONOMY; D-06-DEP-CAUTIONARY-AGE-FIT;
  D-06-DEP-MULTILEVEL-EVALUATION.
- D-07-DEP-CONTROLLED-LOCATION-PAIR; D-07-DEP-ENVIRONMENTAL-HAZARDS; D-07-DEP-IDENTITY-CONFIDENCE.
- D-08-DEP-STEREOTYPE-TARGET-TAXONOMY; D-08-DEP-CONTENT-POLICY-LAYER; D-09-DEP-LEGITIMATE-ACCESS-RULES; D-09-DEP-OTHER-RESTRICTION-BASES.
- D-10-DEP-BULLYING-HARASSMENT-TAXONOMY; D-10-DEP-APPEARANCE-DEGRADATION-TAXONOMY; D-10-DEP-FORBIDDEN-WORDS-STATUS;
  D-10-DEP-MEANING-PRESERVING-NORMALIZATION.
- D-11-DEP-EMOTIONAL-INTENSITY-TAXONOMY; D-11-DEP-BAND-THRESHOLD-CALIBRATION; D-11-DEP-OTHER-EMOTIONS.
- D-12-DEP-ABSTRACTION-TAXONOMY; D-12-DEP-VISUAL-GROUNDING-CRITERIA; D-12-DEP-ABSTRACTION-TEMPLATE-CONTAMINATION.
- D-13-DEP-REFERENCE-AMBIGUITY-TAXONOMY; D-13-DEP-STRUCTURAL-FAMILY-DIVERSITY.
- D-14-DEP-AGEFIT-DIMENSION-TAXONOMIES; D-14-DEP-LOCALIZATION-DEFECT-TAXONOMY; D-14-DEP-VISUAL-AGEFIT-TAXONOMY;
  D-14-DEP-SAFETY-DISTRESS-CONTEXT; D-14-DEP-EVALUATOR-MECHANISM.
- D-15-DEP-SIMPLIFICATION-TAXONOMY; D-15-DEP-MISCONCEPTION-TAXONOMY; D-15-DEP-BAND-PERCEPTIBILITY-EVIDENCE; D-15-DEP-FANTASY-WORLD-SCIENCE;
  D-15-DEP-VISUAL-SCIENCE-TAXONOMY; criteriul științific în rubrică (din D-15-DEP-RUBRIC-SCIENCE-CRITERION, nedecis de D-17).
- D-16-DEP-SCORING-GRANULARITY; D-16-DEP-NA-TAXONOMY; D-16-DEP-COLLECTION-SYSTEMIC-QUALITY; D-16-DEP-EMPIRICAL-FLOOR-VALIDATION;
  D-16-DEP-NATIVE-EDITION-RUBRIC; D-16-DEP-PASS-VERSION-RANKING.
- D-17-DEP-VALUES-TAXONOMY; D-17-DEP-RUBRIC-T07-WORDING (Product Contract, în afara fazei); D-17-DEP-VISUAL-EDITORIAL-VALUES;
  D-17-DEP-NATIVE-VALUES-PARITY.
- D-18-DEP-SEMANTIC-VALIDATOR; D-18-DEP-RETRY-COUNT; D-18-DEP-SUFFICIENCY-TAXONOMY; D-18-DEP-VISUAL-CROSSMODAL-EVIDENCE;
  D-18-DEP-V3-REPORT-REGENERATION.
- D-19-DEP-COVERAGE-MATRIX-DEFINITION; D-19-DEP-NEW-CASES; D-19-DEP-SAMPLE-SUFFICIENCY; D-19-DEP-PHYSICAL-SCHEMA.
- D-20-DEP-DEVELOPMENT-CORPUS; D-20-DEP-INVALID-RUN-PROCEDURE; D-20-DEP-VALIDATION-STATE-ADAPTATION.
- D-21-DEP-STABILITY-CONTRACT; D-21-DEP-INVALID-TEST-EVIDENCE-PROTOCOL; D-21-DEP-THRESHOLD-POLICY-VERSIONING.
- D-22-DEP-SANITIZED-BRIEF; D-22-DEP-SOURCE-B; D-22-DEP-GENERIC-TOOLING; D-22-DEP-STORAGE; D-22-DEP-RC1-VISUAL-CLAIM.

**Rezolvate în această fază:**
- D-11-DEP-FINDING-SEVERITY-GATE-MODEL (D-14);
- D-13-DEP-SYNTAX-PUBLISHING-CONSEQUENCE (D-14);
- D-14-DEP-MEASUREMENT-REPRESENTATION și D-18-DEP-MEASUREMENT (conceptual, D-19);
- D-14-DEP-QUALITY-THRESHOLDS (D-16 / D-17);
- D-14-DEP-EVIDENCE-VALIDITY, D-16-DEP-EVIDENCE-VALIDITY, D-17-DEP-EVIDENCE-VALIDITY (D-18);
- D-16-DEP-T07 (D-17);
- D-15-DEP-MEASUREMENT, D-17-DEP-MEASUREMENT (conceptual, D-19);
- D-20-DEP-PERFORMANCE-THRESHOLDS (D-21);
- D-20-DEP-INDEPENDENCE-PROTOCOL și D-21-DEP-INDEPENDENT-SET-SIZE (D-22).

---

## 11. Statutul Gold-v1

- **Rol:** benchmark înghețat „Before”, sha256 `603fa00a…`, fără `validationRequirements` (nu poate fi validat).
- **Adjudecare:** **44/44 de către operator** (40 confirmate, 0 corectate, 4 excluse); jurnal de 44 de linii, neschimbat.
- **Ce e validat:** etichetele celor 40 de cazuri valide (adjudecare umană). **Nu** e validat niciun evaluator și nicio politică
  D-01…D-22.
- **Registrul de probe** (79): dovadă de regresie a defectelor reparate; autorul e furnizorul.

## 12. Statutul Gold-v2

- 226 de cazuri (157 calibrare + 69 rezervate), sha256 `199d1186…`, **imutabil** (D-20).
- **Autor:** furnizorul de implementare pentru stimuli, etichete propuse și evaluatori (limitare confirmată de D-22).
- **Adjudecare: 0/226.** 20 de cazuri fără etichetă (cazurile de politică, acum decise).
- **Starea de validare: NOT_COMPLETE.** Motive:
  - adjudecarea;
  - etichetele null;
  - **acoperirea structurală D-19 nesatisfăcută** (vârstă 5–6 EN = 0; știință doar 7–8; calitate doar 3–4 EN; localizare doar
    EN → RO; fără vizual / cross-modal; fără Book / Volume / Collection).
- Trece doar calculul legacy de acoperire grosieră (8 / 6 / 3 / 3, istoric).
- **Rol după închidere:** baseline istoric pre-SH#2. Calibrarea e evidence de dezvoltare. Adjudecarea poate continua după procedură,
  cu provenance; rescorarea istorică e un raport nou. Cazuri care cer explicit adjudecare în reprezentarea nouă: v2c-age-abs-03,
  v2c-age-syn-02, cele 12 REVIEW de siguranță, v2c-quality-03.

## 13. Statutul vechiului set rezervat

- 69 de cazuri (`holdout.mjs` `041d3e8c…`), sigilate (`afa194aa…`) înaintea schimbărilor de evaluator.
- **Expus**, **autor neindependent**, independența familiilor de reguli **0/69**.
- **Retras definitiv** din acceptarea independentă post-SH#2 (D-20).
- **Roluri permise:** A (istoric), B (rescorare istorică după adjudecare, marcată), C (regresie / diagnostic: „known failures fixed”,
  nu generalizare).
- Cele 9 eșecuri rămân evidence, nemodificate.

## 14. Statutul `holdout-run-1.json`

- Rulare unică, commit `c144651`, evaluator v2, pe **etichete propuse**; scriptul refuză reluarea. Evaluatorul nu s-a schimbat după.
- **Rezultat istoric:**
  - acord 0,864;
  - fals-pass 7/44 (CP bilateral 95 % [0,066 · 0,301]);
  - siguranță 5/16 (3 BLOCK → PASS, 2 REVIEW → PASS);
  - fals-block 2/22.
- Sub D-21 ar fi **P1 FAIL** (cel puțin 5 evadări critice).
- Măsurătoare istorică, **nu** set de acceptare și **nu** sursă de praguri.

## 15. Cerințele de validare structurală D-19 (DECIDED POLICY)

- **Ground truth multidimensional** (A–H). Proiecția binară e derivată și versionată. ASSESSMENT_INVALID ≠ negativ; UNVERIFIED ≠
  pozitiv / negativ.
- **Metrici separate:** detecție · severitate · policy consequence · validarea evaluării · decizie de publicare · `exact`.
- **Policy-relevant coverage matrix:** celula e obligatorie doar dacă dimensiunea schimbă legitim finding-ul / severitatea /
  interpretarea / consecința sau dacă sistemul pretinde că o operează. Stări: COVERED / UNCOVERED / NOT_APPLICABLE (cu rationale) /
  COVERAGE_REQUIREMENT_UNRESOLVED.
- **Minim structural:** ≥ 1 caz adjudecat în calibrare **și** ≥ 1 caz adjudecabil independent în validarea independentă, per celulă
  obligatorie. O celulă la zero → structural coverage FAIL / INCOMPLETE.
- **Stratificare** pe bandă / ediție / modalitate / scope, unde politica o cere. Frontiere (numerice și semantice) acoperite.
  Template-family ≠ domain coverage.
- **Non-zero ≠ suficiență statistică.**

## 16. Cerințele de acceptare a performanței D-21 (DECIDED POLICY, RC1)

| Poartă | Regula |
|---|---|
| P0 | Integritate (commitments, freeze, configurație, run complet, fără contaminare, fără schimbarea pragurilor) — altfel INVALID_RUN |
| **P1** | 0 evadări critice în auto-accept observate **și** limită superioară exactă unilaterală 95 % ≤ 5 % (⇒ ≥ 59 de oportunități relevante) |
| **P2** | 0 downgrade-uri non-waivable → waivable observate |
| **P3** | Escaladare falsă ≤ 10 % observat pe ≥ 30 de cazuri auto-acceptabile; ≥ 1 auto-accept corect în fiecare celulă cu cazuri auto-acceptabile |
| P4–P9 | Matrice de consecințe; validarea evaluării; detecție; severitate; policy consequence; decizie de publicare (raportate) |
| Determinism | 100 % pentru componentele deterministe; contract de stabilitate obligatoriu pentru componentele model |
| Acuratețe globală / κ | doar descriptive |
| Dovezi insuficiente | INSUFFICIENT_EVIDENCE / VALIDATION NOT COMPLETE |

Incertitudinea se raportează obligatoriu. Pragurile, convenția și numitorii sunt precommitted și nu se relaxează post-hoc. *D-21
performance thresholds are WonderPages Enterprise Local RC1 product-acceptance policy, not universal empirical constants.*

## 17. Protocolul de independență D-22 (DECIDED POLICY)

- **Roluri:**
  - Author (nu implementatorul; nu un model cu context de implementare);
  - Adjudicator (operatorul, autoritate finală);
  - Custodian;
  - Runner;
  - Implementer (blind până la scored run);
  - Auditor.

  Operatorul poate cumula Adjudicator + Custodian + Runner (+ Auditor).
- **Autori:** minimum două surse independente: om / operator + model / agent extern izolat. Partea critică P1 / P2 are mai multe
  perspective și parțial e scrisă sau re-lucrată de om. O sesiune nouă Claude nu ajunge singură.
- **Brief:** SANITIZED NORMATIVE POLICY BRIEF, versionat, hash-uit, aprobat de operator. Fără cod, slăbiciuni, exemple, stimuli Gold,
  eșecuri, design SH#2, ieșiri. Ledger-ul D-01…D-22 **nu** e brief.
- **Înainte de seal:**
  - screening de contaminare (rulat de custode);
  - toate cazurile adjudecate în reprezentarea D-19;
  - D-19 și D-21 demonstrate fără dezvăluire.
- **Commitment** sărat, canonic, pe stimuli + ground truth. În repo doar commitment-uri, versiuni, numărători agregate, atestări.
- **Stocare și runner** capability-based. Expunerea către un inference provider se documentează.
- **Dezvăluire:** reguli pentru înainte și după rulare (PASS / FAIL / INVALID_RUN).
- **Incidente de contaminare:** evaluate pe scope, cu presupunere conservatoare.
- **Limită:** independență procedurală, nu epistemică absolută. Acceptarea sintetică ≠ Agent Commissioning ≠ Dinosaur World ≠
  acceptarea reală a produsului.

---

## 18. Ce e permis ca development evidence

Pentru SH#2 și pentru regresie:
- **Politica:** D-01…D-22 (inclusiv exemplele din ledger).
- **Calibrarea Gold-v2** (157), cu etichetele propuse și, după adjudecare, cu cele adjudecate.
- **Setul rezervat Gold-v2 expus** (roluri B / C) și `holdout-run-1.json`, ca diagnostic și regresie.
- **Gold-v1** (44) și registrul de probe (79).
- **Probele din această fază** (D-01…D-21).
- **Un corpus de dezvoltare SH#2 nou**, versionat separat (versiune, provenance, autor / sursă, legătura cu eșecul cunoscut, hash-uri,
  timp, versiunea politicii).
- **Probe adversariale de dezvoltare.**

## 19. Ce e interzis ca independent acceptance evidence

- Orice caz din Gold-v1, Gold-v2 (calibrare **și** setul rezervat), registrul de probe, probele din ledger, corpusul de dezvoltare
  SH#2.
- Orice set scris de furnizorul de implementare, de o sesiune / sub-agent cu contextul lui, sau de un model care a primit repo-ul /
  evaluatorul / eșecurile / probele.
- Orice set ascuns care nu a fost sigilat (stimuli + ground truth) **înainte de SH#2**, ori care a fost expus implementatorului
  înainte de scored run (cazurile expuse ies din numitori).
- Orice rezultat de acceptare folosit pentru tuning (setul e consumat), inclusiv feedbackul agregat.
- Re-rulări după modificarea evaluatorului pe același set; best-of-N; praguri alese după rezultat.
- Celule D-19 neacoperite completate prin inferență (bandă, limbă, modalitate, nivel).

## 20. Ce trebuie construit înainte de SH#2

Fiecare punct cere **autorizare explicită**. Nimic nu a început.

1. **SANITIZED NORMATIVE POLICY BRIEF:** draft mecanic al implementatorului, revizuit și aprobat de operator; versionat și hash-uit
   (D-22-DEP-SANITIZED-BRIEF).
2. **Definiția concretă a policy-relevant coverage matrix:** celule obligatorii, NOT_APPLICABLE cu rationale, UNRESOLVED
   (D-19-DEP-COVERAGE-MATRIX-DEFINITION). Include decizia despre claim-ul vizual / cross-modal RC1 (D-22-DEP-RC1-VISUAL-CLAIM).
3. **Schema fizică a ground truth-ului multidimensional** și a proiecției legacy (D-19-DEP-PHYSICAL-SCHEMA).
4. **Commitment-ul politicii de praguri D-21:** identificator, versiune, convenția statistică (D-21-DEP-THRESHOLD-POLICY-VERSIONING).
5. **Tooling generic**, testat doar pe date artificiale (D-22-DEP-GENERIC-TOOLING):
   - commitment sărat / Merkle;
   - manifest agregat;
   - screening de similaritate rulat de custode;
   - calculul porților P0–P9 cu IC;
   - verificarea provenance;
   - procedura INVALID_RUN (D-20-DEP-INVALID-RUN-PROCEDURE).
6. **Alegerea Source B** și a storage-ului custodelui (D-22-DEP-SOURCE-B, D-22-DEP-STORAGE). Sunt decizii ale operatorului.
7. **Construcția setului ascuns:** pașii 4–12 din §21, de către autori independenți, adjudecat de operator, sigilat.

## 21. Ordinea canonică post-closure (D-20 / D-22)

1. Închidere D-22 — **făcut**.
2. Closure Report D-01…D-22 — **acest document**.
3. Construirea și aprobarea sanitized normative policy brief.
4. Construirea setului ascuns din minimum două surse independente de implementator.
5. Adjudecarea operatorului în schema D-19.
6. Screening de contaminare / aproape-duplicate.
7. Verificarea acoperirii structurale D-19.
8. Verificarea numitorilor și a compoziției D-21.
9. Finalizarea provenance.
10. Commitment pentru stimuli + ground truth.
11. Seal înainte de SH#2.
12. Setul ascuns devine inaccesibil implementatorului.
13. Semantic Hardening #2, exclusiv din politică + evidence de dezvoltare / calibrare / diagnostic expus.
14. Regresie pe evidence cunoscută.
15. Freeze: evaluator + prompturi + configurație + praguri.
16. Verificarea integrității P0.
17. Blind scored run.
18. Calculul acceptării D-19 + D-21.
19. PASS / FAIL / INVALID_RUN înregistrat, fără schimbarea pragurilor post-hoc.
20. Dacă FAIL duce la tuning → set consumat → următoarea acceptare cere un set nou.

**Ordinea fazelor convenită (neschimbată):** decizii D-01…D-22 → (construcția și sigilarea setului ascuns) → Semantic Hardening #2 →
înghețarea evaluatorului → rularea oarbă și validarea → adjudecarea / validarea finală Gold → acceptarea explicită a operatorului →
Enterprise Local RC → instalare → autentificarea reală Claude Pro → Agent System Commissioning → propunerea reală de Creative Upgrade
DW → V1 Pilot → V2–V6 → acceptarea finală P8 → abia apoi Phase 9.

## 22. Validat vs nevalidat (fără confuzii)

| Afirmație | Stare |
|---|---|
| Deciziile D-01…D-22 | **DECIDED POLICY** · **NOT YET EMPIRICALLY VALIDATED** |
| Pragurile D-16 / D-17 (8 / 8 / 7 / T07 = 7) | Operator-approved product policy · **NOT YET EMPIRICALLY VALIDATED** |
| Pragurile D-21 (P1 / P2 / P3) | RC1 product-acceptance policy · **NOT YET EMPIRICALLY VALIDATED** · nu sunt constante empirice |
| Evaluatorul v2 actual | CURRENT IMPLEMENTATION · nu respectă politica (§7, §8) · măsurat istoric (`holdout-run-1`), **nevalidat** |
| Suita de teste (428 / 428 local și pe PostgreSQL, la H6) | Corectitudinea implementării comportamentului v2 · **nu** validarea politicii |
| Etichetele Gold-v1 (40 valide) | Adjudecate de operator · **nu** validează niciun evaluator |
| Gold-v2 | Neadjudecat (0/226) · NOT_COMPLETE · acoperire structurală D-19 nesatisfăcută |
| Enterprise acceptance | **Nepretinsă** |

---

**OPERATOR POLICY DECISION PHASE: COMPLETE**

**SEMANTIC HARDENING #2: NOT AUTHORIZED / NOT STARTED**

Următorul pas cere autorizarea explicită a operatorului.
