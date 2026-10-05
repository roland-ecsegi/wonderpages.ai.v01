# Hardening & Gold-v2 — TaskExecutionRecord

Instrucțiunea operatorului din 2026-10-05: „WONDERPAGES — HARDENING & GOLD-V2 AUTONOMOUS EXECUTION”. Execuție autonomă până la
punctul de oprire dinaintea adjudecării independente a Gold-v2. Gold-v1 rămâne artefact înghețat (benchmarkul „Before”).

## 0. Starea de pornire (verificată înainte de orice modificare)

| Verificare | Rezultat |
|---|---|
| HEAD | `784f5accfe8e046d48d30aa4fae6c23a95407b61` (propunerea Gold v2) — checkpoint pre-hardening |
| Arbore de lucru | curat |
| `gold-v1.json` sha256 | `603fa00aac029d3e4d1eabe9d29d182049d9984320a232457aa0ad05c9cee2db` |
| Jurnalul adjudecărilor gold-v1 | 44 de intrări, lanț valid (cap `abf3051162e3…`), 40 confirmate · 0 corectate · 4 excluse, adjudecare completă |
| Teste de integritate | 87 9/9, 54 8/8, 73 5/5 (la închiderea adjudecării); suita completă: vezi §6 |

## 1. Ordinea metodologică (de ce held-out-ul vine primul)

1. **Registrul de probe** (`evaluation/hardening/probes.mjs`): toate probele executate din GS.md (OBS-GS-1…20), cu direcția
   declarată de operator (`expect`) sau fără etichetă (`expect: null` = caz-limită, urmărit, nepunctat). Rezultatele „înainte” au
   fost înregistrate O SINGURĂ DATĂ cu evaluatorii neschimbați (`evaluation/hardening/probes-before.json`): **36 eșuează,
   24 trec, 19 neetichetate**.
2. **Setul rezervat Gold-v2** (`evaluation/gold-v2-src/holdout.mjs`, 69 de cazuri) scris și **sigilat înainte de orice
   modificare de evaluator** (`evaluation/gold-v2-src/holdout-seal.json`, hash `afa194aa8aac…`). Teme rezervate: *mountain*,
   *city* (absente din calibrare). Nu se rulează evaluatorii întăriți pe setul rezervat decât o dată, la final; eșecurile rămân
   dovezi; cazurile nu se mută în calibrare și etichetele nu se rescriu.
3. Abia apoi: întărirea evaluatorilor pe dovezile din registru și pe cazurile de calibrare (set de dezvoltare).

## 2. Matricea de trasabilitate (rezultat)

Coloanele „Probe înainte → după” numără probele din registru legate de observație. O probă cu mai multe OBS e numărată la fiecare.
„Fără etichetă” înseamnă caz-limită urmărit, nepunctat. „Rezervat” înseamnă rezultatul pe setul rezervat Gold-v2, rulat o singură
dată după hardening, pe etichete PROPUSE. Rezultatul NU a fost folosit pentru reglaj. Starea: **adresat** = defectul demonstrat nu
se mai reproduce pe probe și pe calibrare; **parțial** = reparat pe ce e acoperit, cu eșecuri sau limite demonstrate în afara
acoperirii; **nerezolvat** = doar instrumentat sau trimis la operator.

| OBS | Defect demonstrat | Subsistem | Reparație implementată | Teste / dovezi | Probe înainte → după (eșec) · fără etichetă | Rezervat | Stare | Limită rămasă |
|---|---|---|---|---|---|---|---|---|
| GS-1 | expresii de siguranță și negații fără legătură anulau regula; ordinea acțiunilor ignorată; „cu un adult” ≠ supraveghere | safety | analiză pe clauze (`semantic/text.js`); negația legată de predicatul periculos (`negatedBefore`); interdicție + „anyway/în ciuda” → regula rămâne; „asks first” și supraveghere activă = decizii de operator; adult prezent nu atenuează | `89-hardening-safety`; P-S01…08, P-S30, P-S35/36 | 7 → 0 · 1 | 24 cazuri safety: 22 etichetate, 17/22 exact | parțial | regula aflată în altă propoziție decât acțiunea nu e legată (P-S04, fără etichetă); „act + avertisment ulterior” nedecis |
| GS-2 | PASS corect din motiv greșit (cazul 3) | safety / metodă | negația recunoscută e consemnată ca motiv (`mitigated[]` cu `SAFETY_NEGATED`) | P-S06; cazul 3 v1 | 0 → 0 · 0 | — | adresat | doar pentru negația explicită |
| GS-3 | stereotip promovat vs contestat; tiparul incluziv ca bypass | safety | poziția narativă: promovat → BLOCK; contestat / dezaprobat narativ / episodic → REVIEW; incluziv pe altă activitate nu anulează | P-S39…41; cazuri v2 stereo-* | 1 → 0 · 1 | v2h-safety-19 (RO „nu au voie”) **eșuează** | parțial | parafrazele RO ale restricției de gen nu sunt recunoscute; politica pentru „contestat” nedecisă |
| GS-4 | specia / capacitatea personajului | safety | canonul (`art.bible.content.characters`) și speciile acvatice suspendă regula de apă; contextul de pericol rămâne | P-S13; cazurile 5/6 v1 | 0 → 0 · 1 | v2h-safety-22 („dives … alone”, urs) **eșuează** | parțial | verbul „dives” și „deep pool” nu sunt în familia water-alone |
| GS-5 | verdict corect ≠ raționament corect | metodă | coduri de motiv structurate pe fiecare constatare; evaluatorii v2 verifică verdictul ȘI motivele așteptate (`EVALUATOR_VERSION = 2`) | `92-gold-v2` („verdict corect, motiv greșit ≠ acord exact”) | — | acordul exact = acord de verdict pe rezervat (0,864) | adresat (instrumentare) | raționamentul se măsoară doar pe codurile declarate în `expected` |
| GS-6 | restricție contextuală tratată ca stereotip | safety | restricție episodică/justificată cu gen → REVIEW (nici BLOCK, nici bypass) | P-S42 | 1 → 0 · 0 | — | parțial | politica pentru restricția situațională cu gen e nedecisă (v2c-safety-stereo-04) |
| GS-7 | morfologie, adverbe intercalate, parafraze | toate | lematizator EN cu verbe neregulate; tulpini RO fără diacritice; clauze în loc de regex fix; familii de concepte EN/RO | P-S05,09,10,31,32; P-C12,15,16,19; 13 variante morfologice + 11 parafraze în v2 | 11 → 0 · 2 | v2h-safety-11, -21, v2h-sci-11 **eșuează** | parțial | parafrazele nevăzute în afara lexiconului („domn necunoscut”, „our planet”, insultă nelistată) rămân nerecunoscute: acoperirea e lexicală |
| GS-8 | obiect / acțiune / politică pentru arme | safety | armă reală: utilizare violentă (siguranță) vs politica „Fără arme” (editorial); jucărie → REVIEW (politică nedefinită); fantastică → REVIEW; proiectile benigne → PASS | P-S14…21 | 1 → 0 · 6 | v2h-safety-14 (amenințare cu cuțit) **eșuează** | parțial | sensul politicii „Fără arme”, jucării, arme fantastice: OPERATOR_DECISION_REQUIRED; arme nelistate („cuțit”) neacoperite |
| GS-9 | paritate EN↔RO; diacritice | safety | lexicoane paralele; diacriticele purtătoare de sens păstrate (insultă: pers. a 2-a + „urât”); frică intensă cu paritate | P-S21…27; 23 cazuri de paritate | 3 → 0 · 2 | v2h-safety-21 **eșuează** (EN, nelistată) | parțial | „a urât” (verb) nedecis; paritatea e verificată doar pe perechile construite |
| GS-10 | intensitate emoțională, recuperare | safety / age | intensitate cumulativă EN+RO; recuperarea consemnată ca dovadă | P-S27…29 | 1 → 0 · 2 | — | parțial | frică ușoară / recuperare imediată: OPERATOR_DECISION_REQUIRED |
| GS-11 | vârsta = doar lungime | age | semnale consultative pe benzi: AGE_SYNTAX, AGE_ABSTRACTION, AGE_TEMPORAL_CAUSAL, AGE_DENSITY, AGE_EMOTION (minore) | `90-hardening-age-localization`; P-A01…03 | 0 → 0 · 2 | v2h-age-12 **eșuează**; calibrare v2c-age-voc-01 eșuează | parțial | AGE_VOCABULARY rămâne bazat pe lungimea cuvântului (cuvinte lungi familiare marcate); semnalele noi nu blochează |
| GS-12 | duplicate, pseudo-acoperire, independența rezervatului | gold infra | `gold-integrity.js`: duplicate exacte/normalizate/apropiate, intenționat vs accidental, contaminare, temă rezervată, independență pe axe, populații separate; sigiliu pe caz | `92-gold-v2` (integritate, sigiliu, contaminare) | — | integritate curată; 131 stimuli independenți din 226 | adresat (instrumentare) | același autor pentru ambele seturi; tema e semnal euristic (67 avertismente THEME_NOT_EVIDENT) |
| GS-13 | fidelitate SOURCE↔TARGET; tokenuri netraduse | localization | `fidelity.js`: lexicon bilingv mărginit (acțiuni, obiecte, calități; verbe ușoare excluse), TR_MEANING_CHANGED / OMISSION / ADDITION / NEGATION_CHANGED (minore, consultative); tokenuri copiate verbatim din sursă | P-L01,02,04,05; 21 cazuri v2 | 4 → 0 · 0 | v2h-loc-11 (calc nevăzut), v2h-loc-12 (idiom → TR_OMISSION fals) **eșuează** | parțial | fidelitatea e limitată la lexicon; calcurile doar din catalog; idiomurile pot produce omisiuni false |
| GS-14 | „are” românesc marcat englezesc | localization | identificare contextuală a limbii; setul ambiguu calculat (funcționale EN ∩ cuvinte RO), decis de context | P-L03; gold-v1 cazul 31 | 1 → 0 · 0 | 3 cazuri v2, trec | adresat | doar EN/RO |
| GS-15 | taxonomie / identitatea entității | science | rezolvarea referentului: păsări, pterozauri, specii din canon; euristica `-saurus` cu excepții marine/zburătoare | `91-hardening-science`; P-C01…04 | 1 → 0 · 0 | trec | parțial | entitățile sunt dintr-o listă închisă |
| GS-16 | co-apariție ≠ relație | science | relație om–dinozaur cu contexte MEDIATE (fosile, muzeu, carte); entități umane extinse | P-C05…08 | 2 → 0 · 0 | trec | parțial | relația e detectată pe tipare, nu prin analiză sintactică |
| GS-17 | atribuire, poziție, corectare | science | credință atribuită + corectare în aceeași propoziție → fără defect; corectare ulterioară → SCIENCE_REVIEW cu scop (aceeași / pagina următoare) | P-C09…13, P-C18 | 3 → 0 · 1 | trec | parțial | fereastra de corectare e decizie de operator (P-C10, v2c-sci-bat-05) |
| GS-18 | dovadă prezentă ≠ suport | quality | strat de validitate a dovezilor (negăsită, insuficientă, refolosită; relevanța `unverified`) raportat separat; verdictul porții neschimbat (sub v2 citatul negăsit respingea și înainte, acum cu cod) | `88-hardening-quality`; P-Q01, P-Q02 | 2 → 0 · 0 | quality 7/7 | parțial | relevanța dovezii nu e verificată; refolosirea / insuficiența nu resping (D-18) |
| GS-19 | prag pe valoarea rotunjită; respingeri fără motiv | quality | decizie pe `exactScore`; `score` doar afișare; un cod de motiv pentru fiecare condiție activă | P-Q03…06; v2c-quality-11 | 4 → 0 · 0 | trec | adresat | — |
| GS-20 | circularitate etichetă ↔ politică | gold infra / quality | sursa etichetei pe caz (fact / current_policy / operator_decision / operator_principle / OPERATOR_DECISION_REQUIRED); cazuri fără etichetă; gardă de validare | `92-gold-v2`; P-Q07 | 0 → 0 · 1 | 3 cazuri rezervate fără etichetă | adresat (instrumentare) | 62 de etichete „current_policy” rămân circulare prin definiție până la decizia operatorului |
| (arh.) | garda nu impunea hardening-ul | acceptance | `validation.js`: stare de validare calculată; acceptarea cere validare completă; devine învechită la schimbarea evaluatorului sau a validării | `87`, `92` | — | — | adresat | — |
| (arh.) | formatul depindea doar de critic | quality | validator determinist: număr de pagini, secvență (`QUALITY_FORMAT_*`) | `88` | — | — | adresat | doar numărul și ordinea paginilor |

**Totaluri registru:** 36 eșec → 0 eșec; 24 trec → 24 trec; 19 fără etichetă rămân fără etichetă. Dovada „înainte/după” pe probă:
`evaluation/hardening/probes-after.json` (regenerabil cu `node scripts/enterprise/hardening-probes.mjs json`). Probele sunt
**dovezi de dezvoltare**: au fost scrise din GS.md și reparațiile au fost făcute pe ele. Trecerea lor nu e generalizare.

## 3. Ce s-a schimbat (pe commit)

| Pas | Commit | Conținut |
|---|---|---|
| H0 | `e95716e` | registrul de probe + rezultatele „înainte”; setul rezervat sigilat ÎNAINTE de orice modificare de evaluator |
| H1 | `4ddafea` | calitate: media exactă, coduri de motiv, validitatea dovezilor, verificarea deterministă a formatului |
| H2 | `5ee99e8` | siguranță: politica v2 pe clauze, negație, interdicție, cerere/supraveghere, specie, poziție, paritate, siguranță vs politică |
| H3 | `b73f699` | vârstă (semnale consultative) și localizare (limba contextuală, fidelitate mărginită de lexicon) |
| H4 | `bc4451a` | știință: entități, relație vs co-apariție, atribuire și corectare |
| — | `c3cc70c` | lexiconul generic curățat de cuvinte specifice Dinosaur World (testul P8-T06) |
| H5 | `caf0629` | Gold-v2, integritate, evaluatori v2, stare de validare, gardă de acceptare |
| H6 | `c144651`, `c14aaa2` | UI: motivul fiecărei probleme de siguranță; rulările tehnice (calibrare, rezervat o singură dată) |

Nu s-au modificat: `gold-v1.json` (sha256 neschimbat, verificat de test), jurnalul adjudecărilor gold-v1, pragurile, politicile de
calitate v1/v2 (v2 rămâne „propusă”), Dinosaur World, agenții permanenți, maturitatea, tipul de produs kids-sc.

## 4. Regresie Gold-v1 (benchmarkul „Before”)

| Categorie | Înainte (v2 / v1) | După (v2 / v1) |
|---|---|---|
| Siguranță 18 · Vârstă 3 · Localizare 6 · Știință 5 | 100% / 100% | 100% / 100% |
| Calitate 8 | 8/8 / 4/8 | 8/8 / 4/8 (dezacord de politică la 40, 41, 42, 44 — nu defect) |

Verificat automat în `92-gold-v2` („acordul adjudecat se păstrează după hardening”).

## 5. Rularea tehnică Gold-v2 (etichete PROPUSE, înainte de adjudecarea operatorului)

| Set | n punctat | Acord exact | Fals-pass | Fals-block | κ | Fără etichetă |
|---|---|---|---|---|---|---|
| Calibrare (dezvoltare) | 140 | 139/140 (0,993) | 0 | 0,019 | 0,985 | 17 |
| Rezervat (o singură rulare, `holdout-run-1.json`) | 66 | 57/66 (0,864) | **0,159** | 0,091 | 0,71 | 3 |

Pe tip, rezervat: siguranță 17/22 (0,773), vârstă 11/12, localizare 11/13, știință 11/12, calitate 7/7.

Diferența calibrare → rezervat (0,993 → 0,864) arată că o parte din câștig e potrivire pe setul de dezvoltare. Eșecurile
rezervate (§2) sunt toate **parafraze sau obiecte nevăzute**: limita principală a abordării lexicale. Rata de fals-pass de 0,159 pe
rezervat (7 din 44 negative au trecut, dintre care 5 de siguranță) e cel mai important rezultat al rulării. Nu e o rată acceptabilă
pentru o poartă de siguranță. Eșecurile NU au fost reparate: setul rezervat ar deveni set de dezvoltare. O reparație cere un nou
set rezervat (decizie de operator, vezi `GOLD-V2-OPERATOR-DECISIONS.md` D-20).

## 6. Teste

Vezi §7 (completat la finalul H6).
