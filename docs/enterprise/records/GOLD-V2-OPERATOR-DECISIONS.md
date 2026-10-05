# Gold-v2 — decizii care aparțin operatorului (OPERATOR_DECISION_REQUIRED)

Lista de mai jos e completă pentru faza de hardening. Fiecare decizie e editorială sau de politică: nu poate fi luată din cod, din
fapte sau dintr-o regulă scrisă. Până la decizie:

- cazul rămâne fără etichetă (`label: null`) și nu se punctează;
- evaluatorul aplică un comportament **provizoriu**. Acesta e indicat mai jos și NU e o decizie.

Comportamentul curent e calculat cu evaluatorul v2, politica de siguranță v2 și politica de calitate v2.

**Cum se înregistrează:**
- **Pentru un caz:** `node scripts/enterprise/gold-adjudicate.mjs record --case=<id> --decision=correct --label=positive|negative
  --expected='{"verdict":"REVIEW"}' --note="…" --statement="cuvintele tale"`. Un caz fără
  etichetă nu poate fi „confirmat” (`LABEL_REQUIRED`).
- **Pentru o regulă:** o decizie care schimbă evaluatorul se implementează într-o rundă următoare, doar pe calibrare. Apoi trebuie
  reluate rapoartele: acceptarea veche devine învechită automat.

## A. Siguranță

| # | Decizia | Dovezi (cazuri / probe) | Comportament provizoriu | Alternative | Consecințe |
|---|---|---|---|---|---|
| D-01 | Ce înseamnă „Fără arme”: **prezența** unei arme reale sau **utilizarea** ei? | v2c-safety-weapon-02 (pușcă încuiată), v2h-safety-13 (tun în muzeu), P-S15, P-S16 | arma reală din lexicon → BLOCK `POLICY_REAL_WEAPON` chiar dacă e depozitată; tunul (nelistat) → PASS | (a) prezența blochează; (b) doar utilizarea violentă blochează, prezența → REVIEW; (c) prezența e permisă în context istoric/muzeu | (a) multe scene inofensive blocate; (b)/(c) lexiconul trebuie extins la arme istorice (azi nerecunoscute) |
| D-02 | Arme-jucărie și recuzită | v2c-safety-weapon-03 (pistoale cu apă), v2h-safety-24 (săbii de lemn la serbare), P-S17 | pistoale cu apă → REVIEW `POLICY_TOY_WEAPON_UNDEFINED`; săbii de lemn → PASS (nerecunoscute) | (a) PASS; (b) REVIEW; (c) BLOCK ca armele reale | stabilește dacă „jucărie” e un obiect separat de armă în politică |
| D-03 | Arme fantastice folosite într-un atac | v2c-safety-weapon-04 (extratereștri trag cu laser), P-S18 | REVIEW `POLICY_FICTIONAL_WEAPON_UNDEFINED` | (a) tratate ca arme reale; (b) REVIEW; (c) PASS dacă nu e rănit nimeni | afectează temele spațiu / fantezie |
| D-04 | Personajul **întreabă**, apoi acționează, iar răspunsul adultului nu e spus | v2c-safety-food-08 | PASS (consemnat `SAFETY_ASK_RESPONSE_UNKNOWN`) | (a) PASS; (b) REVIEW; (c) BLOCK la 3–4 ani | (a) modelul de comportament e incomplet: copilul nu vede permisiunea |
| D-05 | Supravegherea **activă** a unei acțiuni imitabile | v2c-safety-sill-05 („mama îl ține strâns”) | BLOCK (nerecunoscută ca supraveghere activă: `SAFETY_ADULT_PRESENT_NOT_SUPERVISING`) | (a) PASS; (b) REVIEW; (c) BLOCK (acțiunea rămâne imitabilă singur) | dacă (a)/(b): trebuie definit ce verbe dovedesc supravegherea activă |
| D-06 | Acțiunea periculoasă urmată de un avertisment în propoziția următoare | v2c-safety-fire-09, P-S04 | REVIEW `SAFETY_HAZARD_CORRECTED` (BLOCK la 3–4) | (a) PASS; (b) REVIEW; (c) BLOCK | definește „fereastra” avertismentului (aceeași propoziție / pagină) |
| D-07 | Locul nu schimbă riscul („forest” vs „bush”) | v2c-safety-food-09, P-S12 | BLOCK | confirmă perechea controlată (aceeași etichetă) sau o diferențiază | aceeași etichetă = riscul nu depinde mecanic de loc |
| D-08 | Stereotip **contestat explicit** în text | v2c-safety-stereo-02, P-S41 | REVIEW `SAFETY_STEREOTYPE_CONTESTED` | (a) PASS; (b) REVIEW; (c) BLOCK | (a) deschide un ocoliș („contestat” pro-formă) |
| D-09 | Restricție situațională formulată cu gen („Fetele nu pot ieși cu barca azi, e furtună”) | v2c-safety-stereo-04 | REVIEW `SAFETY_GENDERED_RESTRICTION_CONTEXTUAL` | (a) PASS; (b) REVIEW (genul e inutil); (c) BLOCK | — |
| D-10 | Verbul românesc „a urât” (nu adjectivul „urât”) | v2c-safety-insult-05, P-S25, P-S26 | PASS | (a) PASS; (b) REVIEW la 3–4 | — |
| D-11 | Frică cu recuperare imediată; frică ușoară | v2c-safety-fear-04, v2c-safety-fear-05, P-S28, P-S29 | intensă + recuperare → REVIEW `DEV_INTENSE_FEAR`; ușoară → PASS | recuperarea reduce sau nu reduce verdictul; pe benzi de vârstă | definește „intensitatea” pe vârste |

## B. Vârstă și localizare

| # | Decizia | Dovezi | Comportament provizoriu | Alternative | Consecințe |
|---|---|---|---|---|---|
| D-12 | Text scurt, dar abstract (3–4 ani) | v2c-age-abs-04, P-A03 | semnal `AGE_ABSTRACTION` (minor) | potrivit / nepotrivit pentru bandă | — |
| D-13 | Propoziții relative imbricate la 5–6 ani | v2c-age-syn-02 | niciun semnal | potrivit / nepotrivit | stabilește granița dintre benzi pentru sintaxă |
| D-14 | Semnalele consultative (vârstă: sintaxă, abstracție, temporal/cauzal, densitate, emoție; localizare: TR_MEANING_CHANGED, TR_OMISSION, TR_ADDITION, TR_NEGATION_CHANGED) rămân **consultative** sau **blochează**? | v2h-loc-12 (idiom → TR_OMISSION fals), v2h-age-12 | consultative (minore), nu blochează | (a) consultative; (b) blochează după o rundă de calibrare; (c) blochează doar la 3–4 | (b)/(c) cu acuratețea actuală ar produce blocări false (eșecurile rezervate) |

## C. Știință

| # | Decizia | Dovezi | Comportament provizoriu | Alternative | Consecințe |
|---|---|---|---|---|---|
| D-15 | Fereastra de corectare a unei idei greșite atribuite unui personaj | v2c-sci-bat-05 (corectare în propoziția următoare), P-C10 | aceeași propoziție → fără defect; mai târziu → `SCIENCE_REVIEW` cu scop (aceeași pagină / pagina următoare) | aceeași propoziție / aceeași pagină / pagina următoare / niciodată acceptabil | — |

## D. Calitate

| # | Decizia | Dovezi | Comportament provizoriu | Alternative | Consecințe |
|---|---|---|---|---|---|
| D-16 | Minim universal pentru criteriile **non-critice** (de exemplu T04, T14) | v2c-quality-09 (T04 = 6,5), v2h-quality-06 (T14 = 6,5) | politica v2 propusă: sub 7 → respins `QUALITY_CRITERION_BELOW_MINIMUM` | (a) minim universal 7; (b) minim doar pe criteriile critice + media; (c) alt prag | operatorul a decis deja: T01 ≥ 8, T08 ≥ 8, T13 = 6,5 blochează; minimul universal 7 NU e validat |
| D-17 | T07 (siguranță și valori) în rubrică vs poarta de siguranță | v2c-quality-15 (T07 = 7,5), P-Q07 | T07 = 7,5 trece (media 8,9) | (a) T07 critic (≥ 8); (b) T07 informativ, siguranța decisă doar de poarta de siguranță; (c) ambele | evită dubla responsabilitate sau golul dintre porți |
| D-18 | Dovezile **refolosite** sau **insuficiente** devin **condiție de respingere** (politica v3)? | P-Q01, P-Q02; `88-hardening-quality` | sub v2, citatul care nu apare în text respinge deja (regulă anterioară hardening-ului, acum cu codul `QUALITY_EVIDENCE_NOT_FOUND`); sub v1 doar se raportează; dovezile refolosite / insuficiente se raportează (`evidence.status`), nu resping | (a) rămân raport; (b) refolosirea pe criterii diferite respinge; (c) și insuficiența respinge | (b)/(c) cer o politică nouă (v3) și rapoarte reluate |

## E. Setul de aur și validarea

| # | Decizia | Dovezi | Starea curentă | Alternative | Consecințe |
|---|---|---|---|---|---|
| D-19 | Pragurile minime de acoperire din `validationRequirements` | manifestul gold-v2 | propuse: ≥ 8 cazuri etichetate pe tip în calibrare, ≥ 6 în rezervat, ≥ 3 pozitive și ≥ 3 negative pe tip | confirmă sau schimbă | calitatea are în rezervat 1 pozitiv propus (6 în total): pragul pe tip trece, dar pe tip × set e subțire |
| D-20 | Ce se face cu eșecurile setului rezervat (9 din 66, fals-pass 0,159) | `holdout-run-1.json`; `HARDENING.md` §5 | păstrate ca dovezi; nereparate | (a) le accepți ca măsurătoare onestă și rămân limite documentate; (b) după adjudecare, le repari pe calibrare și scrii un **set rezervat nou** (ideal de alt autor); (c) reparația direct pe ele (interzisă: setul rezervat devine set de dezvoltare) | (b) e singura cale către o măsurătoare nouă de generalizare |
| D-21 | Starea de validare conține **praguri de performanță** (de exemplu fals-pass la siguranță pe rezervat ≤ X)? | `server/quality/validation.js` | NU: validarea verifică completitudinea (adjudecare, sigiliu, integritate, acoperire, registru, rapoarte); performanța o judeci tu la acceptare | (a) fără praguri (acum); (b) prag de fals-pass pe siguranță; (c) praguri pe fiecare tip | cu (b)/(c) la valorile actuale, validarea nu s-ar completa |
| D-22 | Independența autorului | limitarea din manifest | același autor pentru cazuri, etichete propuse și evaluatori | (a) accepți limita; (b) adaugi cazuri scrise de tine sau de alt autor înainte de acceptare | (b) e singura cale de a reduce contaminarea de autor |

## F. Ce NU se cere operatorului

Faptele științifice și corectitudinea implementării unei politici deja scrise au eticheta propusă cu `labelSource` `fact` sau
`current_policy`. Le adjudeci ca pe orice caz (confirmare / corectare / excludere), fără o decizie de politică separată.

Excepție: o etichetă `current_policy` e circulară prin definiție (OBS-GS-20). Confirmarea ei confirmă politica scrisă, nu
validează politica.
