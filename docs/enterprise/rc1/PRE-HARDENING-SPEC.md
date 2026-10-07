# RC1 — Specificația pre-hardening

**Faza:** `RC1-POLICY-DEPENDENCY-CLOSURE`. **Versiune:** 1.0 (draft pentru auditul ChatGPT și pentru deciziile operatorului).

Specificația nu schimbă politica. Ea traduce deciziile D-01…D-22 în reprezentări, proceduri și cerințe testabile de care au
nevoie fazele următoare: brief-ul sanitizat, setul ascuns, SH#2 și rularea oarbă. Unde politica e nedecisă, specificația nu
alege. Trimite la întrebarea din `OPERATOR-DECISION-PACKAGE-01.md` (Q-xx).

Fiecare secțiune are un marcaj `[S-…]`. `DEPENDENCY-REGISTER.json` trimite la aceste marcaje. Gate-ul G15 verifică că fiecare
marcaj citat există.

**Ce nu face:** nu creează cazuri, nu adjudecă, nu sigilează, nu modifică evaluatorul și nu implementează tooling-ul în codul
aplicației.

---

## [S-00] Surse și reguli de citire

- Sursa de adevăr pentru politică: `evaluation/gold-v2-policy/decisions.jsonl` (verbatim). Rezumat: raportul de închidere
  `docs/enterprise/records/GOLD-V2-POLICY-CLOSURE.md`. Dacă specificația și declarația diferă, **declarația are prioritate**.
- Referințele de tip „D-14 §19” trimit la numerotarea din declarația operatorului.
- Cuvintele „trebuie” și „nu” sunt cerințe pentru implementarea viitoare. Nimic de aici nu e implementat.
- Codurile de motiv (reason codes) sunt nume de lucru. Numele finale le alege implementarea. Semantica rămâne cea de aici.

## [S-STATES] Vocabularul stărilor

Stările de publicare (D-14 §49, D-15 §68, D-18, D-19 E):

| Stare | Sens | Cine o poate închide |
|---|---|---|
| `PASS` | Fără problemă relevantă | — |
| `PASS_WITH_ADVISORY` | Finding real, nematerial | — (auto-acceptabil dacă advisory-ul nu cere review) |
| `REVIEW_REQUIRED` | Materialitate sau incertitudine care cere judecată umană | operatorul, după tipul review-ului (mai jos) |
| `REPAIR_REQUIRED` | Defect material confirmat (fidelitate, știință, calitate validată) | nimeni: reparare → reevaluare |
| `BLOCKED_BY_POLICY` | Politică ne-deblocabilă (siguranță, content-policy) | nimeni: se corectează conținutul |
| `ASSESSMENT_INVALID` | Evaluarea nu poate fi folosită (D-18) | reevaluare |
| `ASSESSMENT_VALIDATION_REQUIRED` | Evaluare UNVERIFIED | validare |

Tipul review-ului (`reviewKind`) e explicit și citibil automat:

- `waivable`: operatorul poate accepta artefactul neschimbat, cu justificare (age-fit material, D-14 §2–§3; REVIEW de siguranță
  sau content-policy, D-01, D-08).
- `confirm-or-dismiss`: operatorul doar confirmă defectul (→ `REPAIR_REQUIRED`) sau îl respinge ca fals pozitiv (→ `PASS`).
  Nu poate aproba eroarea (fidelitate D-14 §18, știință D-15 §30). Cum se numără această stare în D-21 decide Q-20.

Severitatea comună: `advisory` · `material` · `severe` · `not-applicable` (D-19 B). Fiecare axă poate detalia
(`severityDetail`), de exemplu scala de consecințe D-06 sau clasa de hazard A / B / C.

Starea de confirmare a unui finding (D-14 §1): `candidate` → `confirmed` | `dismissed-false-positive` → `repaired` → `revalidated`.

Starea validării evaluării (D-18 §3): `VALIDATED` · `UNVERIFIED` · `INVALID`. `WEAK` e doar atribut de diagnostic.

## [S-JURIS] Jurisdicții și observații legate

Jurisdicțiile autoritative (D-17 §1, D-08 §17): `physical-safety`, `content-policy`, `age-fit`, `science`,
`localization-fidelity`, `quality` (T01–T18), `assessment-validation` (D-18).

Reguli:

1. Un defect de fond are **o singură** jurisdicție autoritativă. Observațiile multiple se leagă prin `underlyingIssue`, nu se
   adjudecă de două ori (D-17 §18–§19).
2. Release = conjuncția jurisdicțiilor. Raportul arată **toate** porțiile care pică și separă eșecurile independente de
   observațiile multiple ale aceluiași defect (D-17 §45–§47).
3. Criticul care observă un hazard, un stereotip sau o problemă de vârstă emite un **candidat** către jurisdicția autoritativă.
   Nu scade T07 (D-17 §14–§16, §29). Findings date criticului ca context au proveniență și nu comandă nota (D-14 §24–§28).
4. O închidere a operatorului legată de hash nu se redeschide prin T07 cu aceeași evidence. Evidence material nou creează un
   candidat nou în jurisdicția corectă (D-17 §21–§25).
5. **Ambiguitatea referențială** (D-13-DEP-REFERENCE-AMBIGUITY-TAXONOMY):
   - **Ambiguitatea reală** e jurisdicția `quality`, criteriul T15. Ambiguitate reală înseamnă că un cititor competent nu
     poate determina referentul. T15 cere „unambiguous pronouns”.
   - **Încărcarea de urmărire** e `age-fit`. Încărcarea de urmărire înseamnă că referentul e determinabil, dar cere efort pe
     bandă (D-13 §18–§19).
   - Pentru același defect există o singură consecință autoritativă.
6. **SAFETY_DISTRESS_CONTEXT** (D-14-DEP-SAFETY-DISTRESS-CONTEXT) se descompune în două findings:
   - un finding de `physical-safety`: mediul acvatic, adâncimea, singurătatea, după D-07;
   - un finding de `age-fit`: distress-ul emoțional, după D-11.
   Cele două se compun (D-11 §2). Codul combinat actual e metadată de implementare, nu politică.
7. Stratul **content-policy** (D-08-DEP-CONTENT-POLICY-LAYER) e o poartă separată de `physical-safety`:
   - `BLOCKED_BY_POLICY` e ne-deblocabil;
   - REVIEW-ul e `waivable`;
   - se aplică regulilor D-08, D-09 și D-10.
   Frica rămâne age-fit (D-11). Afișarea în UI e implementare SH#2.

## [S-TAX-FRAMEWORK] Cadrul comun al taxonomiilor

Toate taxonomiile de mai jos respectă aceleași reguli, decise în D-01…D-18:

- **Lanț semantic, nu listă:** proprietate → finding → severitate → consecință. Cuvântul e evidence, nu verdict. Sunt
  interzise word lists și regex ca verdict.
- **Paritate EN / RO semantică:** aceeași relație produce aceeași analiză. Paritatea nu se obține prin liste de sinonime.
- **Text, imagine și relația lor** sunt evaluate separat. Scene description ≠ image evidence.
- **Page → Book → Volume → Collection** ([S-MULTILEVEL]): finding-ul local supraviețuiește rezolvării de carte.
- **Fără scoruri numerice inventate** și fără sume de findings. Compunerea are propriul finding și nu numără de două ori.
- **Fiecare finding material** are evidence despre: ce, unde, pentru ce bandă / ediție, ce impact are, de ce e material
  și ce consecință produce (D-14 §62).
- **Construcția completă a taxonomiilor** e în SH#2, „cu decizii punctuale ale operatorului unde e editorial” (statusurile din
  registru). RC1 fixează structura și regula de adjudecare. **Ground truth-ul unui caz** e stabilit de operator, aplicând
  politica decisă la acel caz (D-22 §24). Nu depinde de existența taxonomiei complete.

## [S-TAX-HAZARD] Hazard: familie, clasă, condiție de siguranță, control

Închide structural D-04-DEP-HAZARD-TAXONOMY și D-05-DEP-SUFFICIENT-CONTROL.

**Înregistrarea unui hazard:**

```
hazardFamily        (ex. fire, height-fall, ingestion-small-object, unknown-food, water, tool, weapon, …)
hazardClass         A (condițional sigur) | B (cere control activ) | C (periculos indiferent de permisiune)   — D-04 §2
mechanism           mecanismul vătămării (ardere, cădere, sufocare, toxicitate, înec, tăiere, …)
requiredCondition   condiția care face acțiunea sigură (A: verificarea relevantă; B: control relevant și suficient; C: niciuna)
evidence            dovada din text / imagine că acea condiție e satisfăcută
actorAction         cine execută partea periculoasă; e copilul expus?
ask / response / permission / confirmation / supervision / control   — separate (D-04 §16, D-05)
exposureTiming      intent → attempt → exposure → act → consequence (D-06 §1)
intervention        înainte de expunere | după expunere (D-05 §11–§13)
consequenceLevel    [S-TAX-SEVERITY]
framing             endorsed | neutral | cautionary | prevented | contradictory   (D-06 §22)
```

**Regula de verdict** (decisă; implementarea nu o poate schimba):

| Situație | Consecință |
|---|---|
| Clasa A, condiția nedemonstrată, act executat | REVIEW dacă răspunsul e necunoscut după o întrebare (D-04 §3); verdictul hazardului dacă identitatea e necunoscută (D-07 §5) |
| Clasa A, condiția demonstrată de o persoană competentă | PASS (D-04 §6) |
| Clasa B, control relevant și suficient, copil neexpus | PASS (D-05 §6) |
| Clasa B, control relevant, suficiență incertă | REVIEW (D-05 §7) |
| Clasa B sau C, control irelevant, pasiv sau absent | verdictul hazardului (BLOCK) (D-05 §5, §16) |
| Refuz explicit, apoi act | BLOCK (D-04 §9) |
| Prevenire înainte de expunere | PASS (D-05 §11, D-06 §2) |
| Salvare după expunere | nu PASS (D-05 §13) |
| Lecție ulterioară, A / B, fără consecință gravă | REVIEW (poveste-avertisment, D-06 §5) |
| Clasa C sau consecință gravă / ireversibilă | BLOCK (D-06 §16–§17) |

**Familiile și clasa lor.** Lista completă se construiește în SH#2. Familiile de mediu intră aici dacă Q-06 = A. Pentru
fiecare familie se înregistrează:

- clasa;
- mecanismul;
- condiția cerută;
- sursa clasificării: decizia D-xx, decizia punctuală a operatorului sau derivarea implementatorului, marcată „de confirmat”.

O familie fără clasă confirmată nu poate produce `PASS` prin atenuare.

**Control suficient.** Dovada are trei componente:

- **relevanța**: controlul acționează asupra aceluiași mecanism;
- **acoperirea**: întreaga parte periculoasă e controlată;
- **expunerea reziduală**: copilul mai execută partea riscantă?

Prezența, privitul și instrucțiunea verbală nu sunt, singure, control (D-05 §1–§4).

## [S-TAX-SEVERITY] Scala consecințelor

Scala e decisă de D-06 §18:

`none` · `near-miss` · `minor-reversible` · `meaningful` · `severe` · `irreversible-catastrophic`

Clasificarea se face după mecanism, nu după cuvinte (fără „burn = minor”). Scala e aceeași pentru text și imagine.

Consecința decisă pe niveluri:

- `severe` și `irreversible-catastrophic` → BLOCK (D-06 §16).
- `minor-reversible` + lecție, hazard A / B → REVIEW (D-06 §15).
- `meaningful` → **Q-05**.
- `none` nu înseamnă sigur (D-06 §14). Hazardul se judecă după mecanism și expunere.

## [S-TAX-ENV] Mediu și identitate

Închide D-07-DEP-IDENTITY-CONFIDENCE.

Câmpuri: `location` (doar context), `environmentProperties` (adâncime, curent, înălțime, suprafață, barieră, echipament,
temperatură), `protections` (judecate prin D-05), `foodIdentity`, `identityConfidence`.

Valorile pentru `identityConfidence`:

- `narrator-established`: adevăr narativ sau canon (D-07 §8);
- `child-assumed`: presupunerea personajului;
- `ambiguous`: evaluatorul nu poate decide;
- `adult-verified`: verificare relevantă, D-04.

| identityConfidence | Consecință (decisă) |
|---|---|
| `narrator-established`, fără alt hazard | fără hazard prin loc → PASS |
| `child-assumed` sau necunoscută, aliment sălbatic consumat | verdictul hazardului (candidat BLOCK, D-07 §5) |
| `ambiguous` | REVIEW (D-07 §8) |
| proveniență ambiguă (grădină, parc), fără context | REVIEW (D-07 §7) |

Locul nu e motiv. Motivul e identitatea sau siguranța nedemonstrată. Perechea controlată (forest ≡ bush) e o cerință de test
([S-DEV-CORPUS]). Politica generală pentru hazardurile de mediu: **Q-06**.

## [S-TAX-CONTENT] Content-policy: stance, restricții, ostilitate, normalizare

**Lanțul stereotipului** (D-08 §30):

```
claim → proposition → source/speaker → target → source authority → local exposure → narrative stance
→ challenge type → semantic relevance → replacement → challenge strength → repetition → final resolution
→ page isolation risk → visual stance → book-level stance → content-policy verdict (+ age-fit separat)
```

Ținta: **Q-07**. Până la decizie, motorul nu e gender-only (decis). Lista țintelor și severitatea lor sunt nedecise.

**Restricții** (D-09). Lanțul:

`restriction → generic | referential target → reason → reason class → relevance → applicability → counterfactual
→ differential treatment → wording → speaker → stance → visual evidence`

**Regulile legitime de acces** (D-09-DEP-LEGITIMATE-ACCESS-RULES) sunt un test cu cinci criterii, fără listă de excepții:

1. relevanță: grupul are legătură cu scopul regulii;
2. necesitate: regula nu poate fi formulată fără grup;
3. proporționalitate: regula nu depășește contextul;
4. specificitate: un spațiu sau o activitate anume;
5. nederogatoriu: formularea nu umilește.

Toate cinci → PASS. Oricare incert → REVIEW. Diferențiere fără motiv → BLOCK (D-09 §4–§13). Alte baze (vârstă, rol,
capacitate): **Q-08**.

**Ostilitate** (D-10). Lanțul:

`raw form → meaning-preserving normalized form → lemma/sense → grammatical role → speaker/experiencer → target
→ target type → directedness → hostility → degradation basis → repetition → stance → recovery → visual evidence`

Plafonul pentru tipar și pentru degradarea severă: **Q-09**. Lint-ul `forbidden_words` nu e poartă (**Q-10**).

**Normalizarea care păstrează sensul** (D-10-DEP-MEANING-PRESERVING-NORMALIZATION) e testabilă prin trei cerințe:

1. Forma brută se păstrează alături de forma normalizată.
2. Diacriticele se restaurează sau se dezambiguizează **înaintea** politicii, după context. Exemple: `a urat` / `a urât` /
   `urât` (adj.) / `mi-e urât` (D-10 §1, §4).
3. Când sensul nu poate fi stabilit, rezultatul e `UNKNOWN` → REVIEW semantic, nu insultă și nu urare.

Fără parser extern obligatoriu. Test: perechi EN / RO echivalente dau aceeași analiză.

## [S-TAX-AGEFIT] Age-fit: profiluri, compunere, vizual

Regula de consecință e decisă (D-14 §2, §68):

- `advisory` → `PASS_WITH_ADVISORY`;
- `material` → `REVIEW_REQUIRED` (`waivable`);
- fără BLOCK automat de age-fit.

Fiecare ediție e evaluată (D-14 §34).

| Dimensiune | Factori (decizi) | Dependență închisă |
|---|---|---|
| Frică / emoție | emoție, intensitate, cauză, realitatea amenințării, severitatea ei, anticipare / expunere, durată, sprijin, mecanism de reglare, momentul recuperării, stare finală, persistență, încărcare cumulativă, amplificare / liniștire vizuală (D-11 §47) | D-11-DEP-EMOTIONAL-INTENSITY-TAXONOMY; conflictul D-03-DEP-AGE-FIT-CONFLICT folosește aceiași factori (intensitate, durată, recuperare) |
| Abstracție | obiect concret, acțiune observabilă, proprietate senzorială, eveniment familiar, relație concretă, stare internă familiară, inferență, generalizare, concept abstract / ontologic, metaforă, idiom, simbolism, temporal, cauzal, suport contextual / vizual (D-12 §6) | D-12-DEP-ABSTRACTION-TAXONOMY |
| Sintaxă | tip de clauză, atașare, imbricare, center embedding, right branching, distanța dependenței, dependențe deschise simultan, urmărirea referentului, coordonare, subordonare, întreruperea clauzei principale, sprijin prin granițe de propoziție, repetiție (D-13 §3) | D-14-DEP-AGEFIT-DIMENSION-TAXONOMIES (sintaxa) |
| Temporal / cauzal | dificultatea reală a relației, nu cuvintele „before / because” (D-14 §7) | idem |
| Densitate | idei noi, referenți, relații, inferențe, schimbări temporale, concepte, informație vizuală necesară, ritm (D-14 §8) | idem |
| Vocabular | familiaritate, concretețe, ilustrabilitate; lungimea nu e dificultate (D-14 §9) | idem |
| Compunere | `AGEFIT_CUMULATIVE_LOAD` explică ce findings contribuie, cum interacționează, efectul, nivelul și banda; nu repenalizează (D-14 §30–§33) | idem |
| Vizual | complexitatea scenei, aglomerare, elemente relevante, detalii mici, relații vizuale, ierarhie, densitate de linie, `line_hint`; impact, nu checklist (D-14 §44–§47) | D-14-DEP-VISUAL-AGEFIT-TAXONOMY (claim: Q-16) |
| Grounding vizual | imaginea exemplifică / concretizează / explică / stabilește relația / reduce inferența; referentul afișat nu ajunge (D-12 §41) | D-12-DEP-VISUAL-GROUNDING-CRITERIA (claim: Q-16) |

Pragurile pe bandă nu se inventează. Sunt EMPIRICE ([S-EMPIRICAL]). Până la calibrare, severitatea e o clasificare motivată
cu evidence, iar ground truth-ul se adjudecă de operator caz cu caz. Celelalte emoții: **Q-11**.

## [S-TAX-LOC] Localizare: fidelitate

Închide D-14-DEP-LOCALIZATION-DEFECT-TAXONOMY (fără `TR_EMPTY` / `TR_MISALIGNED`, aflate la Q-12) și
D-17-DEP-NATIVE-VALUES-PARITY.

Pipeline-ul (D-14 §13):

`source meaning → target meaning → semantic relation → candidate fidelity finding → confirmation state → semantic impact
→ severity → publishing consequence`

Dimensiunile materialității (D-14 §19): acțiunea, actorul, obiectul, starea, relația, cauza, consecința, negarea, cantitatea,
temporalitatea, **stance-ul**, informația de canon, sensul de siguranță, sensul educațional / științific.

| Tip | Nematerial | Material candidat | Material confirmat |
|---|---|---|---|
| negare schimbată | — | REVIEW (`confirm-or-dismiss`) | REPAIR_REQUIRED |
| sens schimbat | PASS / advisory | REVIEW | REPAIR_REQUIRED |
| omisiune (stilistică / idiomatică vs materială) | PASS | REVIEW | REPAIR_REQUIRED |
| adăugare (clarificare vs informație inventată) | PASS | REVIEW | REPAIR_REQUIRED |
| stance moral schimbat prin traducere | — | REVIEW | REPAIR_REQUIRED |
| pagină goală / nealiniată | **Q-12** | **Q-12** | **Q-12** |

Fals pozitiv verificat → `dismissed-false-positive` → PASS. Decizia rămâne în audit (D-14 §51). Fidelitatea și age-fit-ul
ediției țintă sunt axe separate (D-14 §35). Adaptarea care păstrează sensul nu e defect (D-14 §36).

## [S-TAX-SCIENCE] Știință

Închide D-15-DEP-MISCONCEPTION-TAXONOMY și, structural, D-15-DEP-VISUAL-SCIENCE-TAXONOMY.

Lanțul (D-15 §3):

`proposition → truth status → speaker/source → attribution → epistemic stance → narrative stance → correction
→ correction relation → correction correctness → salience → proximity → age-band perceptibility
→ later reinforcement/contradiction → local takeaway → book takeaway → higher-scope takeaway → consequence`

**Concepțiile greșite** sunt o **resursă factuală deschisă**, nu o listă de verdicte. O intrare conține:

- propoziția falsă;
- propoziția corectă;
- surse factuale verificabile;
- formulări EN / RO, doar ca exemple de recunoaștere.

Adevărul se verifică factual. Nu e preferința operatorului (D-22 §25). O propoziție absentă din resursă se tratează
la fel, prin verificare.

**Vizual** (D-15 §38–§43):

- imaginea poate întări mitul, îl poate contrazice sau poate purta ea însăși o afirmație factuală;
- corectarea exclusiv vizuală contează doar dacă e semantic neechivocă; altfel → REVIEW;
- „bat looks with big eyes” nu corectează.

Includerea în claim: **Q-16**. Simplificarea: **Q-13**. Lumile fantastice: **Q-14**.

## [S-TAX-QUALITY] Calitate și validarea evaluării

Închide D-16-DEP-NA-TAXONOMY, D-16-DEP-PASS-VERSION-RANKING, D-18-DEP-RETRY-COUNT și D-18-DEP-SUFFICIENCY-TAXONOMY, plus
partea de reprezentare din D-16-DEP-SCORING-GRANULARITY.

**Contractul de scor (D-16 §7–§15)**

1. Scorul se transmite și se stochează ca **zecimal canonic**, sub formă de șir (de exemplu `"6.99"`).
2. Comparația cu pragul folosește aritmetică exactă (rațională sau întreg scalat), după ordinea:
   `canonical mathematically faithful value → threshold comparison → verdict → display rounding`.
3. Egalitatea trece.
4. Granularitatea e un parametru versionat al contractului: `scoreGranularity`. Valoarea lui e EMPIRICĂ.
5. Un scor care încalcă granularitatea se respinge sau se normalizează **la validarea intrării**, niciodată în poartă.
6. Test obligatoriu: 17 × 8.1 + 6.3 ⇒ media exactă = 8, deci condiția mediei trece. 6.3 < 7 ⇒ pică minimul. Motivul
   principal e minimul.

**NOT_APPLICABLE (D-16 §16–§21).** Înregistrarea conține:

- criterionId;
- versiunea definiției;
- regula de aplicabilitate;
- contextul artefactului;
- evidence citabil;
- motivul;
- actorul;
- proveniența.

Criteriul e aplicabil implicit. Un N/A fără evidence sau unul folosit pentru a ridica media duce la `ASSESSMENT_INVALID`. Un
N/A legitim iese din numitorul mediei. Regulile per criteriu T01–T18 se construiesc în SH#2, cu decizii punctuale ale
operatorului.

**Motive (D-16 §60).** Un singur motiv principal per încălcare, cel mai specific:

- `QUALITY_CRITICAL_BELOW_THRESHOLD:Txx`
- `QUALITY_CRITERION_BELOW_MINIMUM:Txx`
- `QUALITY_MEAN_BELOW_THRESHOLD`
- `QUALITY_APPLICABILITY_INVALID`
- `QUALITY_EVIDENCE_INVALID`
- `QUALITY_SYSTEMIC_PATTERN`

**Selecția versiunii (D-16 §32–§34)**

Ordinea:

1. validitatea evaluării (D-18);
2. porțile obligatorii;
3. pragurile;
4. comparația de calitate.

O versiune validă la poartă bate întotdeauna una care pică.

**Ranking-ul între două versiuni valide** (D-16-DEP-PASS-VERSION-RANKING; implicit tehnic, nu politică): media canonică mai
mare, apoi minimul cel mai mare, apoi versiunea mai veche. E determinist și auditat. Nu schimbă eligibilitatea.

**Validarea evaluării (D-18)**

Straturile A–D (D-18 §1) nu se colapsează.

Verificările deterministe (D-18 §11), care se aplică inclusiv evidence-ului din `issues`:

- identitatea și hash-ul artefactului;
- ediția;
- stratul;
- criteriul;
- prezența citatului;
- locația și maparea paginii;
- evaluarea expirată (stale);
- proveniența.

Validatorul semantic e logic distinct de critic (D-18 §90).

**Suficiența e un bundle** (D-18-DEP-SUFFICIENCY-TAXONOMY). Pentru fiecare criteriu, bundle-ul conține:

- tipul criteriului: local sau global (pacing, coerență, agency, final, voce);
- evidence-ul minim:
  - local: citat plus locație;
  - global: locații multiple, căutare de contra-evidence și raționament la nivel de artefact;
- relația cu direcția scorului;
- relația cu pragul, când scorul e determinant pentru poartă (D-18 §47).

Lungimea textului nu e criteriu (D-18 §24–§25).

**Reîncercări** (D-18-DEP-RETRY-COUNT): `maxReevaluations` e un parametru de workflow. Intră în configurația înghețată și
precommitted înaintea rulării oarbe (D-20 §20). După epuizare: `ASSESSMENT_INVALID`, niciodată `ARTIFACT_QUALITY_FAIL`
(D-18 §43). Valoarea se alege în SH#2, ținând cont de costul în allowance-ul abonamentului.

## [S-MULTILEVEL] Page → Book → Volume → Collection

Închide D-06-DEP-MULTILEVEL-EVALUATION.

- **Page / spread:** findings locale cu locație. Se evaluează și isolation risk-ul paginii: arată pagina, singură, actul ca
  model (D-06 §8, D-08 §14, D-15 §46)?
- **Book:** stance-ul, rezolvarea, takeaway-ul, arcul emoțional și tiparele repetate. Rezolvarea de carte poate schimba
  consecința finală (de exemplu, poveste-avertisment → REVIEW). **Nu șterge** finding-ul local.
- **Volume / Collection:** findings cumulative sau sistemice (`AGEFIT_*_DRIFT`, `QUALITY_SYSTEMIC_PATTERN`, normalizare
  repetată), fără a dubla findings individuale (D-17 §44).
- **Reparația urmează nivelul:** se repară pagina, cartea sau colecția, după unde e problema. Nu se regenerează totul automat
  (D-14 §43).
- **În claim-ul RC1:** **Q-17**.

## [S-GT-SCHEMA] Ground truth multidimensional

Închide D-19-DEP-PHYSICAL-SCHEMA. Schema fizică: `spec/ground-truth.schema.json` (JSON Schema 2020-12, un obiect per caz,
JSONL).

**Dimensiuni D-19 A–H:**

| Dimensiune | Câmp |
|---|---|
| A | `expected.findings[].present / family / code / jurisdiction` |
| B | `severity` + `severityDetail` |
| C | `expected.assessmentValidation` (doar cazurile D-18) |
| D | `expected.policyConsequences[]` (o intrare per jurisdicție autoritativă) |
| E | `expected.publishingConsequence` |
| F | `stimulus.scope` |
| G | `stimulus.editions` / `evaluatedEdition` |
| H | `stimulus.modality` |

**Proiecția legacy** `rc1-legacy-projection/1` e derivată, versionată și reproductibilă (D-19 §14–§15):

| Ground truth | Proiecție legacy |
|---|---|
| `PASS`, `PASS_WITH_ADVISORY` | `positive` |
| `REVIEW_REQUIRED`, `REPAIR_REQUIRED`, `BLOCKED_BY_POLICY` | `negative` |
| `ASSESSMENT_INVALID`, `ASSESSMENT_VALIDATION_REQUIRED` | `not-applicable-for-binary-metric` (niciodată content negative / positive) |

Proiecția servește doar comparabilității istorice. Acceptarea nu o folosește niciodată (D-21 §5).

**Reguli de integritate:**

- `split = independent-validation` interzice `authorSource` ∈ {`implementation-provider`, `historical-gold`} (D-22).
- Toate cazurile au cel puțin o adjudecare.
- Dezacordul dintre autor și operator se păstrează.
- `d21.p1Opportunity`, `p2Opportunity` și `autoAcceptable` se derivă **determinist** din `publishingConsequence` și din
  `reviewKind` (Q-20).

## [S-COVERAGE] Matricea de acoperire relevantă pentru politică

Închide D-19-DEP-COVERAGE-MATRIX-DEFINITION. Fișierul `spec/coverage-matrix.json` enumeră celulele.

- **Ramurile** sunt consecințele decise ale D-01…D-18. Frontierele sunt marcate (`boundaryFamily`).
- **Stratificarea** se aplică numai unde politica o cere:
  - banda: age-fit, calitate, iar la știință doar perceptibilitatea;
  - ediția: EN / RO pentru siguranță, content-policy, age-fit și știință; EN → RO pentru fidelitate; EN pentru calitate.
- **Celulele dependente de decizii** (Q-01…Q-17) sunt `COVERAGE_REQUIREMENT_UNRESOLVED`. Nu se ascund în totaluri
  (D-19 §31).
- **Minimul structural:** ≥ 1 caz adjudecat în calibrare **și** ≥ 1 caz adjudecabil independent în validarea independentă,
  pentru fiecare celulă `REQUIRED` (D-19 §26). Non-zero ≠ suficiență statistică (D-19 §27).
- **Consecință practică:**
  - versiunea 1.0 are **354 de celule `REQUIRED`** (text, Page / Book) și 56 nerezolvate;
  - un caz bilingv evaluat pe ambele ediții acoperă celula EN și celula RO ale aceleiași ramuri;
  - cazurile pot servi simultan D-21 P1 / P3 (overlap legitim, D-21 §41);
  - setul ascuns va avea deci câteva sute de cazuri;
  - granularitatea ramurilor e o alegere de inginerie. O poate reduce numai o decizie care declară explicit o ramură
    NOT_APPLICABLE, cu rationale (D-19 §29).
- **Ce raportezi la măsurare:**
  - COVERED / UNCOVERED pe celulă, separat pentru calibrare și validare;
  - template-family vs domain coverage (D-19 §54);
  - direcția localizării;
  - lipsa vizualului.

## [S-THRESHOLDS] Politica de praguri D-21 (commitment)

Închide D-21-DEP-THRESHOLD-POLICY-VERSIONING și D-19-DEP-SAMPLE-SUFFICIENCY.

**Documentul canonic:** `spec/threshold-policy.rc1.json`, cu id `WP-ENTERPRISE-LOCAL-RC1-ACCEPTANCE` și versiunea `1.0.0`.

- `canonicalSha256` = SHA-256 al JSON-ului canonic (fără acest câmp). Îl verifică `rc1.mjs check`.
- Valorile sunt transcrise din D-21. RC1 nu adaugă praguri.
- Documentul e legat de hash-urile intrărilor D-19, D-21 și D-22.

**Convenția statistică pentru acceptare** e limita superioară exactă unilaterală 95%.

- Pentru x erori din n, limita U este soluția ecuației P(X ≤ x | n, U) = 0.05.
- Pentru x = 0: U = 1 − 0.05^(1/n).
- n minim pentru U ≤ 0.05 este **59** (U(59) ≈ 0.0495; U(58) ≈ 0.0503).
- Intervalul bilateral Clopper–Pearson 95% e doar descriptiv. Pentru 0 / n, limita superioară ≤ 0.05 cere n ≥ 72. Cele două
  convenții nu se amestecă (D-21 §8).

**Numitori.** Minimele P1 / P3 (59 / 30) și regula celulei P3 sunt decise. Nu se adaugă cerințe statistice suplimentare
fără evidence (D-21 §15, D-19 §59).

**Commitment-ul formal.** Hash-ul documentului intră în commitment-ul setului ascuns, înainte de SH#2, împreună cu:

- versiunile evaluatorului;
- versiunile dataset-ului;
- versiunile ground truth-ului.

O versiune nouă cere: versiune nouă + rationale + evidence + precommitment înaintea unei noi rulări independente.

## [S-STABILITY] Contractul de stabilitate pentru componente model

Închide D-21-DEP-STABILITY-CONTRACT (șablonul).

Orice componentă nedeterministă (de exemplu, validatorul semantic D-18) are, **înainte** de a intra în pipeline-ul de
acceptare, un contract înghețat. Contractul conține:

| Câmp | Conținut |
|---|---|
| `component` | identitate, model / furnizor, versiune, configurație (hash) |
| `repetitionProtocol` | numărul de repetări per intrare, independența rulărilor, ordinea |
| `aggregationRule` | de exemplu unanimitate, majoritate sau cea mai strictă stare |
| `disagreementHandling` | ce se întâmplă la dezacord (de exemplu → UNVERIFIED → validare umană) |
| `escalationBehaviour` | când nu decide singură |
| `stabilityMetric` | de exemplu acordul exact între repetări, pe stări |
| `acceptanceThreshold` | stabilit pe evidence de dezvoltare, precommitted; **RC1 nu fixează valoarea** (D-21 §20) |
| `evidence` | setul de dezvoltare și măsurătorile care justifică pragul |

Până la contract, componenta **nu poate fi singura bază a unui auto-PASS critic**. Rezultatul ei se tratează ca UNVERIFIED
pentru acel scop.

## [S-INVALID-RUN] Procedura INVALID_RUN

Închide D-20-DEP-INVALID-RUN-PROCEDURE.

1. **Declanșatori P0:**
   - commitment invalid (dataset sau ground truth);
   - freeze invalid (cod, prompturi, configurație, praguri);
   - run incomplet;
   - fișier corupt;
   - eroare de runner;
   - nepotrivire de integritate;
   - contaminare interzisă.
2. **Declarare:** runner-ul / custodele marchează formal rularea `INVALID_RUN`. Raportul conține cauza, momentul și
   artefactele afectate. Nu conține rezultate per caz.
3. **Izolare:** rezultatele parțiale nu ajung la implementator, nici agregat. Nu se folosesc la tuning (D-20 §32).
4. **Verificare înainte de rerun:**
   - evaluatorul, prompturile și configurația au hash-uri identice cu freeze-ul;
   - nimic din rularea invalidă n-a fost expus;
   - auditorul confirmă.
5. **Rerun** pe același set, permis numai după pașii 1–4 (D-22 §51). Fiecare tentativă rămâne în audit trail.
6. **Dacă orice informație din rularea invalidă** a fost folosită pentru a schimba evaluatorul, setul e consumat (D-20 §23).
7. **Escaladare:** dacă nu se poate demonstra ce s-a expus, se presupune contaminarea la scope-ul cel mai sigur justificabil
   (D-22 §59).

## [S-INVALID-GT] Protocolul pentru ground truth invalid descoperit după run

Închide D-21-DEP-INVALID-TEST-EVIDENCE-PROTOCOL.

1. Rezultatul PASS / FAIL se înregistrează **întâi**, cu ground truth-ul sigilat neschimbat (D-21 §32, D-22 §48).
2. O suspiciune de ground truth invalid se depune ca cerere scrisă, cu motiv factual sau de politică. Nu e permisă ca reacție
   la un eșec al evaluatorului fără motiv independent.
3. Adjudecarea **independentă** o face operatorul. Se recomandă a doua privire (D-22 §26). Implementatorul nu participă.
   Se separă verificarea factuală de consecința de politică (D-22 §25).
4. Dacă ground truth-ul e invalid conform politicii precommitted, cazul iese din numitori. Excluderea se raportează (caz opac,
   motiv, efectul asupra numitorilor). Pragurile nu se schimbă. Dacă numitorii scad sub minim → INSUFFICIENT_EVIDENCE.
5. Corectarea ground truth-ului ≠ tuning. Nu poate transforma un FAIL în PASS fără motivul independent de la pasul 3.
6. Toate corecturile și dezacordurile rămân în proveniență.

## [S-VALIDATION-STATE] Starea de validare v3

Închide D-20-DEP-VALIDATION-STATE-ADAPTATION (specificație; implementarea ulterior).

`validationState` v3 = f(dataset commitment, ground-truth commitment, evaluator freeze, threshold-policy hash, rezultatele
rulării). Câmpurile:

- `heldOutRole`: holdout-ul Gold-v2 apare numai ca `historical` / `historical-rescoring` / `regression`, niciodată ca set de
  acceptare (D-20 §1–§4).
- `structuralCoverage` (D-19): `COMPLETE` | `INCOMPLETE` (lista celulelor UNCOVERED / UNRESOLVED).
- `performance` (D-21): P0…P9 cu numerator, numitor, rată, metodă, nivel, bound / interval, cohortă; P1 / P2 / P3 au verdict.
- `independence` (D-22): proveniența, atestările, statutul screening-ului.
- `overall`: `ACCEPTED` | `FAIL` | `INVALID_RUN` | `INSUFFICIENT_EVIDENCE / VALIDATION NOT COMPLETE`.
- Toate legate de hash-uri. Calculate automat, deterministe. Fără judecată informală post-rezultat (D-21 §2).
- `validationRequirements` v2 și rapoartele istorice rămân neschimbate (D-19 §44, D-20).

## [S-DEV-CORPUS] Corpusul de dezvoltare SH#2

Închide D-20-DEP-DEVELOPMENT-CORPUS, D-07-DEP-CONTROLLED-LOCATION-PAIR și D-13-DEP-STRUCTURAL-FAMILY-DIVERSITY (pentru
dezvoltare).

- **Fișier separat de Gold-v2**, versionat (de exemplu `evaluation/sh2-dev/…`), creat abia în SH#2. Gold-v2 nu se modifică
  (D-20 §8).
- **Câmpuri per caz** (D-20 §9): versiunea corpusului, proveniența, autorul / sursa, `relatedKnownFailure` (A-xx, probă, caz
  Gold), hash-uri, momentul creării, versiunea politicii. Se adaugă schema ground truth-ului ([S-GT-SCHEMA]) cu
  `split = development`.
- **Perechi controlate:** un singur factor variază, de exemplu forest ≡ bush cu actor, acțiune, aliment, descriptori,
  sintaxă și bandă identice (D-07 §15).
- **Familii structurale diverse** pentru sintaxă și abstracție, fără șablonul comun calibrare / holdout (L-7, D-12, D-13).
  Se raportează template-family vs domain.
- Corpusul e **development evidence**, niciodată acceptance evidence (closure §18–§19).

## [S-HIDDEN-SET] Cerințe pentru construcția setului ascuns

Specificație pentru faza următoare. **RC1 nu construiește nimic.**

1. **Autori:** Source A (operator / om) și Source B (Q-18), independenți de implementator. Pentru P1 / P2: mai mult de o
   perspectivă pe familie de politică. O parte din boundary / adversarial e scrisă sau re-lucrată de om (D-22 §9–§11).
2. **Input-ul autorilor:** numai brief-ul sanitizat aprobat ([S-BRIEF]), plus celulele D-19 și cerințele D-21 (D-22 §14).
3. **Proiectarea din spațiul politicii**, nu din eșecurile evaluatorului (D-22 §60, §67). Fiecare celulă `REQUIRED` are
   ≥ 1 caz independent. Numitorii minimi: ≥ 59 oportunități P1 și ≥ 30 auto-acceptabile.
4. **Diversitate:** fără template substitutions, noun swaps sau traduceri triviale ale cazurilor cunoscute (D-22 §19).
   Fiecare caz are `templateFamily`.
5. **Adjudecarea** o face operatorul, în schema D-19, înainte de seal. Fără `label = null` (D-22 §22).
6. **Screening de contaminare** rulat de custode ([S-TOOLING]) față de Gold-v1, Gold-v2, registrul de probe, holdout,
   exemplele D-01…D-21 și corpusul de dezvoltare existent (D-22 §20).
7. **Commitment, seal, ascundere:** [S-TOOLING], storage-ul ales la Q-19. Totul înainte de SH#2.
8. **Imagini** (dacă Q-16 ≠ A): nu le generează implementatorul. Provin din pipeline-ul independent sau sunt obținute legitim
   de custode, cu proveniență (D-22 §40).

## [S-TOOLING] Tooling generic: specificație și vectori de test artificiali

Închide D-22-DEP-GENERIC-TOOLING la nivel de specificație. Implementarea cere o autorizare separată (closure §20). Când se
implementează, tooling-ul se testează **numai pe date artificiale**. Pe datele ascunse îl rulează custodele.

**T1. Commitment sărat, cu Merkle** (D-22 §30–§34)

- **Frunza:**
  `leaf_i = SHA-256( 0x00 ‖ UTF-8(canonicalJSON({ v: 1, datasetVersion, policyVersion, caseId, nonce, stimulus, groundTruth })) )`
  - `nonce` are 32 de octeți aleatori (hex). Se generează și se păstrează la custode.
- **Rădăcina:** frunzele se sortează după `caseId`.
  `node = SHA-256( 0x01 ‖ left ‖ right )`. Pe un nivel impar, ultimul nod urcă neschimbat.
- **Public (în repository):** `root`, `count`, `datasetVersion`, `policyVersion`, hash-ul politicii de praguri,
  momentul / commit-ul seal-ului.
- **Reveal:** caz + nonce + dovada de incluziune → verificare.
- **Proprietăți:** binding, confidențialitate înainte de reveal (nonce de 256 de biți), reproductibilitate după reveal,
  tamper evidence.

**T2. Manifest agregat** (D-22 §35–§37). Conține numai:

- numărători per celulă D-19;
- totaluri;
- numărul de oportunități P1 și de cazuri auto-acceptabile;
- modalitățile și scope-urile prezente.

Fără ID-uri semantice, subiecte sau formulări. Validare: nicio celulă cu un singur caz nu are atribute care să-l
identifice.

**T3. Screening de similaritate:**

- Măsuri lexicale: n-grame normalizate, Jaccard sau cosinus.
- Măsuri structurale: schelet POS / dependențe, șablon.
- Traducere inversă EN ↔ RO pentru traduceri triviale.
- Pragurile de semnalare sunt parametri versionați. Orice semnal → revizuire de către custode.
- Rezultatul per caz (`passed` / `excluded`) intră în proveniență. Implementatorul primește doar agregatul permis.

**T4. Calculatorul porților P0–P9:**

- Intrare: perechi (ground truth, ieșirea sistemului) plus politica de praguri.
- Ieșire: [S-VALIDATION-STATE].
- Determinist. Bound-urile se calculează cu aritmetică sigură (bisecție pe CDF-ul binomial exact, cu toleranță declarată).

**T5. Verificarea provenance-ului:**

- Fiecare caz independent are `authorSource` permis, versiunea brief-ului și atestarea Source B.
- Lanțul de adjudecare e complet.
- Statutul screening-ului e `passed`.
- Apartenența la commitment e verificată.

**T6. INVALID_RUN:** marcaje, raport și verificările de rerun din [S-INVALID-RUN].

**Vectori de test artificiali:** `spec/test-vectors.json`. Îi recalculează `node brain/tools/rc1.mjs check`, ca specificația
să fie consistentă. Ei conțin:

- bound-uri binomiale;
- un commitment Merkle pe 3 cazuri artificiale cu nonce fix de test;
- calculul P1 / P2 / P3 pe o listă artificială;
- comportamentul anti-gaming (always-PASS / always-BLOCK / always-REVIEW).

## [S-BRIEF] Brief-ul normativ sanitizat

Închide D-22-DEP-SANITIZED-BRIEF la nivel de specificație. Draftul vine după decizii. Aprobarea e a operatorului.

**Conține** (D-22 §14):

- regulile normative, formulate abstract;
- dimensiunile politicii;
- granițele jurisdicțiilor;
- benzile de vârstă;
- cerințele de ediție, limbă, modalitate și scope (după Q-16 / Q-17);
- vocabularul consecințelor ([S-STATES]);
- celulele D-19 cerute (descrierea ramurilor, fără exemple concrete);
- numărătorile D-21;
- schema de output pentru autor (subsetul autorului din [S-GT-SCHEMA]).

**Nu conține** (D-22 §15–§16):

- cod, implementarea evaluatorului, regex, word lists, prompturi;
- slăbiciuni cunoscute, exemple de fals-pass;
- stimuli Gold-v1 / Gold-v2, eșecuri ale holdout-ului, probe;
- bug-uri, designul SH#2, ieșirile evaluatorului;
- **niciun exemplu concret din registrul D-01…D-22**: exemplele din registru sunt stimuli expuși.

**Verificarea sanitizării.** Draftul trece prin T3, ca screening de similaritate față de corpusurile cunoscute. Rezultatul e
documentat. Orice potrivire se rescrie abstract.

**Versionare.** Versiune `brief-rc1-vN` și SHA-256, legate de capul registrului de politică (D-22 + RC1-D). Brief-ul se
păstrează în proveniență (D-22 §17).

**Aprobare.** Declarația operatorului, înregistrată verbatim. Fără aprobare, brief-ul nu se folosește (D-22 §18).

**Unde stă.** Brief-ul aprobat e un document policy-only. Poate sta în repository, pentru că nu conține cazuri ascunse.

## [S-RC1-CLAIM] Cerințele Enterprise RC1 și claim-ul

Trasabilitatea cerințelor relevante, conform stării canonice:

| Cerință | Sursă | Stare după RC1 |
|---|---|---|
| Set ascuns independent, sigilat înainte de SH#2, rulat o dată | D-20, D-22 | specificat ([S-HIDDEN-SET], [S-TOOLING]); construcția: faza următoare |
| Acoperire structurală D-19 | D-19 | matricea definită ([S-COVERAGE]); celulele dependente de Q-01…Q-17 nerezolvate |
| Porți de performanță P0–P9 precommitted | D-21 | document canonic ([S-THRESHOLDS]) |
| Independența autorului (≥ 2 surse) | D-22 | protocol specificat; Source B = Q-18; storage = Q-19 |
| Brief sanitizat aprobat | D-22 | specificat ([S-BRIEF]); draft după decizii; aprobare = operator |
| Validarea evaluării v3 | D-18 | specificată ([S-TAX-QUALITY]); validatorul = commissioning (exclus) |
| Calitate pe ediția nativă | D-16 | **exclusă** din claim (rubrica nativă lipsește) |
| Volume / Collection | D-06, D-14, D-16 | Q-17 |
| **Vizual / cross-modal** | D-22 §38–§40, D-19 §36–§38, D-14 §44–§48, D-15 §38–§43, D-17 §34–§39, D-18 §59–§62 | **Q-16** |

**Componenta vizuală / cross-modală, explicit.** Pipeline-ul are QA vizual, pe dimensiunile:

- anatomie;
- acțiune;
- poveste;
- lizibilitate;
- `safety: pass / review / block`, cu un prompt global („block … weapons, stereotypes”).

Promptul nu e aliniat la D-01…D-10 (closure §7, ultimul rând). Gold-v2 e doar text, deci nu validează nimic vizual
(D-19 §37). În consecință:

- dacă Q-16 = A, raportul RC1 spune: *visual safety, visual content-policy, visual age-fit, visual science, visual editorial
  values și toate jurisdicțiile cross-modale: NOT IMPLEMENTED / NOT VALIDATED*;
- dacă Q-16 = B sau C, jurisdicțiile alese devin celule `REQUIRED` vizuale / cross-modale. Ele cer:
  - imagini ascunse independente;
  - alinierea QA vizual la politică, în SH#2;
  - validarea evidence-ului vizual (D-18-DEP-VISUAL-CROSSMODAL-EVIDENCE).

Formularea care rămâne obligatorie: *„Synthetic hidden-set acceptance does not replace Agent System Commissioning, Dinosaur
World V1 production validation or real product acceptance.”* (D-22).

## [S-EMPIRICAL] Rute de evidence pentru dependențele EMPIRICAL

| Dependență | Ce se măsoară | Unde | Când |
|---|---|---|---|
| D-11-DEP-BAND-THRESHOLD-CALIBRATION | pragurile de severitate emoțională pe bandă | corpusul de dezvoltare (calibrare) → setul ascuns (validare) | SH#2 → rularea oarbă |
| D-06-DEP-CAUTIONARY-AGE-FIT | pragurile age-fit pentru povești-avertisment, pe bandă | idem | idem |
| D-15-DEP-BAND-PERCEPTIBILITY-EVIDENCE | perceptibilitatea corectării la 3–4 / 5–6 și în RO | celulele D-19 de știință stratificate | idem |
| D-16-DEP-SCORING-GRANULARITY | granularitatea reală a scorurilor criticului | scorurile din dezvoltare | SH#2 |
| D-16-DEP-COLLECTION-SYSTEMIC-QUALITY | pragurile pentru tipare sistemice de colecție | colecții reale (V1–V6), după autorizare | după RC |
| D-16-DEP-EMPIRICAL-FLOOR-VALIDATION | validitatea minimului 7 | judecăți umane de calitate pe artefacte reale | după RC |
| D-02-DEP-AGE-DIFFERENTIATION | o eventuală nevoie de diferențiere pe bandă | evidence adjudecat (declanșator) | doar dacă apare |

Toate rămân **NOT YET EMPIRICALLY VALIDATED** până la măsurare (closure §22).
