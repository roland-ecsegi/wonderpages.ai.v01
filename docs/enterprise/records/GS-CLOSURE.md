# Raport de închidere — adjudecarea setului de aur gold-v1

Data: 2026-10-05. Tip: raport de dovezi pentru etapa de adjudecare. **Nu** este un plan de implementare și **nu** este o acceptare.
Sursa de adevăr: jurnalul append-only `evaluation/gold/gold-v1.adjudications.jsonl`. Detaliile pe caz și textul integral al
observațiilor se află în `docs/enterprise/records/GS.md`. Toate cifrele de mai jos au fost calculate din jurnal sau obținute prin rularea
evaluatorilor. Niciuna nu a fost dedusă manual.

## 0. Stare

| | |
|---|---|
| **GOLD-V1 ADJUDICATION** | **COMPLETE** (44/44) |
| **GOLD-V1 VALIDATION** | **NOT COMPLETE** |
| **GOLD-V1 FINAL ACCEPTANCE** | **NOT PERFORMED** |

Integritate:

- jurnalul are 44 de intrări, iar lanțul de hash-uri e valid (capul `abf3051162e3b34b…`); nu există erori de parsare și nici inconsecvențe;
- hash-ul stării de adjudecare este `6b469f817096e733…`;
- `gold-v1.json` e neschimbat (sha256 `603fa00aac029d3e4d1eabe9d29d182049d9984320a232457aa0ad05c9cee2db`);
- evaluatorii, politicile v1/v2, pragurile și garda de acceptare n-au fost modificate în timpul adjudecării.

Garda de acceptare refuză acum acceptarea cu codurile `REPORT_MISSING` (calibrare), `REPORT_MISSING` (set rezervat) și
`NOTE_REQUIRED`.

## 1. Populația

| Măsură | Valoare |
|---|---|
| Cazuri brute | 44 |
| Adjudecate | 44 |
| Confirmate / corectate / excluse | **40 / 0 / 4** |
| Excluse | 21, 22, 23, 24 (vârstă): duplicate exacte ale stimulilor de vârstă, cu metadate de temă nepotrivite (OBS-GS-12) |
| Populația validă de evaluare | **40** (calibrare 32, set rezervat 8) |

**Acordul de raționament** (câmpul structurat, din jurnal):

| Valoare | Număr | Cazuri |
|---|---|---|
| YES | 19 | 7, 8, 10, 12, 14, 15, 16, 18, 27, 28, 29, 31, 37, 38, 39, 40, 41, 42, 44 |
| INCOMPLETE | 15 | 6, 11, 13, 17, 19, 20, 25, 26, 30, 32, 33, 34, 35, 36, 43 |
| NO | 1 | 9 |
| fără câmp | 9 | 1–5 (înainte de introducerea câmpului; raționamentul greșit al cazului 3 e consemnat în OBS-GS-2); 21–24 (excluse, câmpul nu se aplică) |

NO și INCOMPLETE se raportează separat. Numai uneori sunt numărate împreună, ca „raționament problematic” (16).

## 2. Rezultate pe categorii (executate pe populația validă, cu adjudecarea aplicată)

Acordul de verdict față de etichetele de aur. Pentru calitate se dă și rata fals-pass pe negative.

| Categorie | Calibrare n | Rezervat n | v2: calibrare / rezervat | v1: calibrare / rezervat |
|---|---|---|---|---|
| Siguranță | 14 | 4 | 14/14 · 4/4 | 14/14 · 4/4 |
| Vârstă | 2 | 1 | 2/2 · 1/1 | 2/2 · 1/1 |
| Localizare | 5 | 1 | 5/5 · 1/1 | 5/5 · 1/1 |
| Știință | 4 | 1 | 4/4 · 1/1 | 4/4 · 1/1 |
| Calitate | 7 | 1 | 7/7 · 1/1 | **4/7 · 0/1** (fals-pass 0,75 calibrare; 1,0 rezervat; 0,8 total) |

Pentru calitate, v1 lasă să treacă negativele 40, 41, 42 și 44. Motivul este o politică diferită (praguri mai permisive), nu un
defect de implementare: v1 își aplică corect propria politică. La cazul 43 ambele politici resping.

**Acordul de verdict nu este validare.** Pe fiecare categorie, probele executate în afara setului au demonstrat defecte (§5).

**Raționamentul pe categorii:**

| Categorie | YES / INCOMPLETE / NO / fără câmp |
|---|---|
| Siguranță | 8 / 4 / 1 / 5 |
| Vârstă | 0 / 3 / 0 / 4 excluse |
| Localizare | 4 / 2 / 0 / 0 |
| Știință | 0 / 5 / 0 / 0 |
| Calitate | 7 / 1 / 0 / 0 |

## 3. Numărul de cazuri vs structura dovezilor

Două cazuri de aur valide nu înseamnă automat două observații independente.

- **Siguranță (18).** Cuprinde perechi pozitiv/negativ pe teme și limbi.
  - Cazul 14 e regresie/control: verifică doar că un subșir nu e luat drept cuvânt („begun” ≠ „gun”).
  - Cazurile 15 și 18 sunt controale pozitive din setul rezervat.
  - Mai multe cazuri trec din motive de formă, nu de sens: OBS-GS-2 (motiv greșit la cazul 3); OBS-GS-1, 7 și 8 (ocoliri și
    limite demonstrate prin probe).
  - Regula de raportare: held-out success ≠ semantic domain understanding.
- **Vârstă (3 valide din 7 brute).**
  - Doar engleză și doar vârsta 3–4.
  - Calibrarea are 2 stimuli (1 pozitiv, 1 negativ); setul rezervat are 1 negativ și niciun control pozitiv.
  - Detectorul demonstrat folosește lungimea propozițiilor ca aproximare (OBS-GS-11).
- **Localizare (6).**
  - 26 și 30 sunt controale pozitive. Trec pentru că nu încalcă nicio regulă implementată, nu pentru că fidelitatea ar fi verificată.
  - 27, 28 și 31 exersează calcuri din catalog. Cazul 31 (rezervat) folosește aceeași familie de reguli ca 28, deci e independent ca
    stimul și temă, dar nu ca proprietate.
  - 29 exersează un singur token netradus din listă.
- **Știință (5).**
  - Cinci concepte și reguli distincte, cu un singur control pozitiv (35).
  - Cazul 36 (rezervat) exersează o regulă din catalog neprezentă în calibrare. Nu există regula `moon-light` pe un caz negativ de aur.
- **Calitate (8).** Toate cazurile folosesc același conținut sintetic și aceeași frază ca dovadă.
  - 37 e baseline-ul; 38 și 39 sunt variante corelate, fără prag atins.
  - 40, 41 și 42 sunt variante de discriminare între politici: pragul critic T01, minimul necritic, pragul critic T08.
  - 43 are un tipar distinct de note (uniform 7).
  - 44 e o combinație nouă din setul rezervat (două eșecuri simultane).
  - Metadatele de vârstă/temă nu schimbă rezultatul porții în probele executate. Tema și vârsta nu reprezintă deci acoperire.

**Setul rezervat** (8 cazuri valide, toate cu tema `space`) e independent ca temă și stimul. În general nu e independent ca familie
de proprietăți sau de reguli (matricile din OBS-GS-12, cazurile 31, 36 și 44).

## 4. Observațiile OBS-GS-1…20

| OBS | Titlu | Categorie |
|---|---|---|
| 1 | Expresiile de siguranță („cu un adult”) nu fac automat sigură o acțiune; ocoliri prin cuvinte de siguranță și prin ordinea/relația acțiunilor | siguranță |
| 2 | Verdict corect, motiv greșit (cazul 3) | siguranță / metodă |
| 3 | Stereotip promovat vs stereotip citat pentru a fi contestat; tipar incluziv folosit ca ocolire; dezaprobare narativă | siguranță |
| 4 | Conștiința personajului / speciei / contextului | siguranță |
| 5 | Corectitudinea verdictului vs corectitudinea raționamentului (a introdus câmpul `reasoning`) | metodă |
| 6 | Generalizare/stereotip vs restricție contextuală | siguranță |
| 7 | Robustețe lingvistică/morfologică/parafrazare (transversală) | toate |
| 8 | Semantica siguranței vs politica produsului vs sensul obiectului | siguranță |
| 9 | Paritate semantică EN ↔ RO; coliziune prin eliminarea diacriticelor | siguranță / limbi |
| 10 | Intensitate emoțională și recuperare în funcție de vârstă | siguranță / vârstă |
| 11 | Potrivirea cu vârsta e multidimensională; lungimea e doar o aproximare | vârstă |
| 12 | Integritatea setului: duplicare, acoperire, independența setului rezervat, cazuri aproape duplicate / corelate, acoperirea domeniului unei politici | set |
| 13 | Fidelitate semantică și completitudine în localizare; defecte de recall | localizare |
| 14 | Identificarea contextuală a limbii; ambiguitatea tokenurilor comune între limbi | localizare |
| 15 | Taxonomie științifică, identitatea entității, clasificare contextuală | știință |
| 16 | Relații științifice, coexistență temporală, contextul lumii | știință |
| 17 | Atribuirea afirmației, poziția narativă, corectarea concepțiilor greșite | știință |
| 18 | Validitatea dovezii, încrederea în critic, poartă vs conținut | calitate |
| 19 | Precizia pragului, semantica rotunjirii, explicabilitatea respingerii | calitate |
| 20 | Circularitatea calibrării, independența politicii, justificarea pragului | calitate / metodă |

## 5. Defecte demonstrate (executate, prin probe care NU sunt cazuri de aur)

Fiecare defect e limitat la probele executate. Nicio afirmație nu e generalizată dincolo de ele.

**Siguranță**

- Ocolire prin expresii de siguranță și prin ordinea acțiunilor (OBS-GS-1).
- Tipar incluziv folosit accidental ca ocolire (OBS-GS-3).
- Variații morfologice ratate: „eating” vs „eats”; adverb intercalat în română (OBS-GS-7).
- Coliziune prin eliminarea diacriticelor (OBS-GS-9).

**Vârstă**

- Detectorul răspunde la lungimea propozițiilor, nu la complexitatea reală.
- Un cuvânt lung nu înseamnă un cuvânt dificil (OBS-GS-11).

**Localizare**

- Fals pozitiv: „are” într-o propoziție românească corectă (OBS-GS-14).
- Fals negative: „berries”, „finds” rămase netraduse (OBS-GS-13).
- Mutațiile de sens nu sunt detectate (OBS-GS-13).

**Știință**

- Fals pozitiv taxonomic: „Birds are flying dinosaurs.” (OBS-GS-15).
- Fals pozitiv relațional: „People study dinosaur fossils…” (OBS-GS-16).
- Fals negativ de acoperire a entităților: „A boy rode a T. rex…” (OBS-GS-16).
- Fals pozitive la demontarea unui mit, pe două concepte: `bats-blind`, `sun-orbits` (OBS-GS-17).
- Fals negative la parafrază: `bats-blind`, `moon-light` ×2, `sun-orbits` (OBS-GS-7).

**Calitate**

- v1 acceptă dovezi inexistente în text; v2 verifică doar existența dovezii, nu suportul (OBS-GS-18).
- Pragul mediei se aplică pe valoarea rotunjită: media exactă 7,9556 e acceptată (OBS-GS-19).
- Respingeri fără motiv:
  - v1, la eșecul mediei și la eșecul unui criteriu critic, `reasons: []`;
  - v2, la eșecul doar al mediei (OBS-GS-19).
- Motiv parțial pe un caz de aur: la cazul 43, v2 omite media (OBS-GS-19).

## 6. Limite demonstrate ale setului și ale benchmarkului

- Cazurile și evaluatorii au același autor. Etichetele de calitate codifică pragurile v2 pe care ar trebui să le calibreze, ceea ce
  produce circularitate (OBS-GS-20).
- Patru duplicate cu metadate de temă nepotrivite (OBS-GS-12).
- Pseudo-acoperire prin metadate la calitate (OBS-GS-12).
- Acoperirea pe vârstă e foarte îngustă: o singură vârstă, o singură limbă, 3 stimuli.
- Puține controale pozitive: știința are unul singur; vârsta nu are niciunul în setul rezervat.
- Setul rezervat e independent ca temă, dar nu ca proprietate sau regulă.
- Controalele pozitive trec prin absența unui tipar, nu prin verificare (26, 30, 35).
- Dovezile de calitate sunt artificiale: aceeași frază pentru 18 criterii (OBS-GS-18).
- Cazurile de calitate testează aritmetica porții, nu calitatea conținutului (cele patru niveluri, OBS-GS-18).
- Nu există cazuri controlate la frontiera pragurilor.
- Garda de acceptare implementată verifică adjudecarea completă și potrivirea rapoartelor. Ea **nu** impune încă etapa de
  hardening, care e o condiție a operatorului (GS.md, decizia de după cazul 3).

## 7. Decizii de politică luate de operator (adjudecate, nu validate empiric)

- **Hardening obligatoriu.** Adjudecarea completă plus 100% pe gold-v1 nu ajung pentru validarea finală. Urmează o etapă separată
  de hardening / validare adversarială. Politica v2 nu se declară validată. Maturitatea nu se promovează pe baza gold-v1.
- **Calitate:**
  - T01 (Age fit) e non-compensator; T01 = 7,5 e insuficient, deci T01 ≥ 8 e politica curentă (cazul 40);
  - prin monotonie intra-criteriu, T01 = 7,4 e insuficient (cazul 44);
  - T13 (Agency) = 6,5 blochează, chiar dacă T13 e necritic (cazul 41, decizie specifică);
  - T08 (Format) = 7 e insuficient, deci T08 ≥ 8 e politica curentă (cazul 42);
  - o evaluare uniformă de 7/10 nu se acceptă automat, deci media ≥ 8 e politica curentă (cazul 43).
- **Metodă de adjudecare:**
  - cele patru niveluri la calitate: verdictul cerut de politică, implementarea, validitatea dovezii, calitatea conținutului;
  - regula YES / INCOMPLETE / NO (precizată la cazul 43);
  - taxonomia dovezilor: proprietatea stimulului → proprietatea testată → verificarea implementată → verdictul observat → afirmația
    susținută (cazul 30);
  - cazurile nu se corectează retroactiv ca să schimbe proprietatea testată (cazul 37).

## 8. Întrebări de politică încă nevalidate

- Minimul universal de 7 pe toate criteriile T01–T18: validat doar pentru T13 = 6,5. Pragul pentru T14 nu e validat (cazul 44).
- Tratarea T07 „Safety and values”: în v2 nu primește pragul critic 8. Responsabilitățile față de poarta de siguranță sunt neclare
  (cazul 42).
- Semantica numerică a pragurilor: media exactă vs rotunjită (OBS-GS-19).
- Optimalitatea empirică a pragurilor 8 (T01, T08, media).
- Ce se întâmplă cu o concepție greșită corectată pe aceeași pagină sau mai târziu: PASS, REVIEW sau alt verdict (OBS-GS-17).
- Unitatea de evaluare (pagină vs poveste) și fereastra de corectare (OBS-GS-17).
- Ce simplificări potrivite vârstei sunt acceptabile în știință (OBS-GS-15).
- Locul verificării deterministe a formatului față de nota criticului (cazul 42).

## 9. Afirmații permise

- „Gold-v1 adjudication is complete: 44/44 raw cases adjudicated by the operator (40 confirmed, 0 corrected, 4 excluded).”
- „On the 40 valid cases, policy v2 agrees with all Gold labels; policy v1 disagrees on 4 quality negatives due to its more permissive
  thresholds (policy disagreement, not implementation failure).”
- Pe categorii, formulări strict limitate:
  - „The current evaluator agrees with all six valid gold-v1 localization labels.”
  - „Held-out localization: 1/1 … exercising a previously represented known-calque rule family.”
  - „Held-out science: 1/1 … catalogued science rule not represented in calibration.”
  - „3/3 Gold positive-control cases agree, consisting of one baseline assessment and two closely correlated non-boundary variants.”
  - „Held-out quality: 1/1 … previously represented v2 rule families, including a new criterion instance (T14) and the first
    simultaneous two-failure combination.”
- „Operator adjudication supports T01≥8, T08≥8 and mean≥8 as current automatic-acceptance policy for the demonstrated conditions, and
  T13=6.5 as blocking.”
- Fiecare defect din §5, limitat la probele executate.

## 10. Afirmații interzise

- „Gold-v1 accepted” / „evaluators validated” / „quality v2 validated” / „v2 globally superior to v1”.
- „Localization evaluator validated” / „semantic fidelity validated” / „Romanian naturalness validated”.
- „Science evaluator validated” / „unseen-concept or semantic-paraphrase generalization”.
- „Held-out generalization validated” (în orice categorie) / „science held-out generalization = 100%”.
- „Age-fit generalization validated” / „quality validated across themes/ages”.
- „Critic scores are proven accurate” / „evidence is semantically validated” / „WonderPages content quality evaluation validated”.
- „Universal minCriterion=7 validated” / „T07 treatment validated” / „thresholds empirically optimized”.
- „WonderPages accepts unsafe content”: proba B de la cazul 37 izolează doar poarta de calitate.
- Orice promovare de maturitate a agenților sau orice afirmație de tip P7 pe baza gold-v1.

## 11. De ce gold-v1 nu poate fi acceptat încă drept validare finală

1. Operatorul a decis explicit că adjudecarea completă plus 100% nu ajung. Hardening-ul urmează înainte de acceptare.
2. Acordul de 100% (v2) coexistă cu defecte executate în fiecare categorie (§5). Benchmarkul nu acoperă comportamentul relevant.
3. 16 din 40 de cazuri valide au raționament INCOMPLETE sau NO. Alte 5 cazuri (1–5) nu au câmpul.
4. Etichetele de calitate sunt parțial auto-referențiale față de v2 (OBS-GS-20). Unele reguli v2 au rămas nevalidate editorial
   (minimul universal, T07, semantica rotunjirii).
5. Acoperirea e îngustă:
   - vârsta (o singură vârstă, o singură limbă);
   - puține controale pozitive;
   - nu există cazuri la frontieră;
   - dovezile de calitate sunt artificiale.
6. Explicabilitatea respingerilor e incompletă (OBS-GS-19), deci blocajele nu conduc încă în mod fiabil spre acțiune.
7. Acceptarea finală se face doar de operator, în Enterprise Local. Garda refuză acum acceptarea (`REPORT_MISSING`, `NOTE_REQUIRED`)
   și nu impune încă etapa de hardening.

Nu s-a rulat nicio acceptare, nu s-au promovat agenți, nu s-a modificat maturitatea și nu s-a început hardening-ul.
