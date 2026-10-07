# RC1 — Pachetul de decizii al operatorului nr. 1 (dependențe NORMATIVE)

**Stare: OPERATOR_DECISION_REQUIRED.** Documentul acesta nu decide nimic. Fiecare întrebare are opțiuni, consecințe și o
**RECOMANDARE**. Recomandarea e a lui Claude (implementatorul) și nu e decizie. Decide numai operatorul. Decizia ta se
înregistrează cuvânt cu cuvânt în `evaluation/rc1-policy/decisions.jsonl` și abia atunci închide dependența.

Sursa fiecărei întrebări e dependența din `DEPENDENCY-REGISTER.json`. Acolo e și textul exact din registrul D-01…D-22.
Politica deja decisă (D-01…D-22) nu se redeschide aici. Întrebările acoperă numai ce acele decizii au lăsat explicit deschis.

## Cum răspunzi

Poți răspunde scurt, de exemplu:

- „Accept recomandările pentru Q-01…Q-20.”
- „Accept recomandările, cu excepția: Q-04 → opțiunea B; Q-16 → opțiunea A.”
- Sau formulezi propria regulă pentru oricare întrebare.

Unde nu răspunzi, dependența rămâne deschisă, iar RC1 nu se poate închide. Poți și amâna explicit o întrebare. Atunci
consecința ei intră în claim-ul RC1: jurisdicția respectivă devine NOT VALIDATED și celulele ei rămân nerezolvate.

## Ce blochează fiecare întrebare

| Întrebare | Dependențe | Blochează |
|---|---|---|
| Q-01 Explozivi | D-01-DEP-EXPLOSIVES | brief, matrice, ground truth, SH#2 |
| Q-02 Amenințare implicită | D-01-DEP-IMPLICIT-THREAT | brief, matrice, ground truth, SH#2 |
| Q-03 Violență fără obiect | D-02-DEP-VIOLENCE-WITHOUT-OBJECT | brief, matrice, ground truth, SH#2 |
| Q-04 Sânge / gore / moarte | D-03-DEP-GORE-DEATH | brief, matrice, ground truth, SH#2 |
| Q-05 Consecința „vătămării semnificative” | D-06-DEP-SEVERITY-TAXONOMY | brief, ground truth, SH#2 |
| Q-06 Hazarduri de mediu | D-07-DEP-ENVIRONMENTAL-HAZARDS | brief, matrice, ground truth, SH#2 |
| Q-07 Țintele stereotipurilor | D-08-DEP-STEREOTYPE-TARGET-TAXONOMY | brief, matrice, ground truth, SH#2 |
| Q-08 Restricții pe vârstă / rol / capacitate | D-09-DEP-OTHER-RESTRICTION-BASES | brief, matrice, ground truth |
| Q-09 Bullying și degradare pe aspect | D-10-DEP-BULLYING-HARASSMENT-TAXONOMY, D-10-DEP-APPEARANCE-DEGRADATION-TAXONOMY | brief, matrice, ground truth, SH#2 |
| Q-10 Lint-ul forbidden_words | D-10-DEP-FORBIDDEN-WORDS-STATUS | — (confirmare) |
| Q-11 Alte emoții decât frica | D-11-DEP-OTHER-EMOTIONS (și D-14-DEP-AGEFIT-DIMENSION-TAXONOMIES) | brief, matrice, ground truth |
| Q-12 Pagini goale / nealiniate în traducere | punct de alegere în D-14-DEP-LOCALIZATION-DEFECT-TAXONOMY | ground truth, SH#2 |
| Q-13 Simplificarea științifică | D-15-DEP-SIMPLIFICATION-TAXONOMY | brief, ground truth, SH#2 |
| Q-14 Știința în lumi fantastice | D-15-DEP-FANTASY-WORLD-SCIENCE | brief, ground truth |
| Q-15 Valorile editoriale (T07) | D-17-DEP-VALUES-TAXONOMY | brief, matrice, ground truth |
| Q-16 Claim-ul vizual / cross-modal RC1 | D-22-DEP-RC1-VISUAL-CLAIM, D-17-DEP-VISUAL-EDITORIAL-VALUES (și dependențele vizuale ENGINEERING) | claim, matrice, brief |
| Q-17 Niveluri și ediții în claim-ul RC1 | punct de alegere în D-06-DEP-MULTILEVEL-EVALUATION, D-16-DEP-COLLECTION-SYSTEMIC-QUALITY, D-19-DEP-COVERAGE-MATRIX-DEFINITION | claim, matrice |
| Q-18 Source B | D-22-DEP-SOURCE-B | construcția setului ascuns |
| Q-19 Storage-ul custodelui | D-22-DEP-STORAGE | construcția setului ascuns |
| Q-20 REVIEW-ul de candidat în metricile D-21 | punct de alegere în D-19-DEP-PHYSICAL-SCHEMA (ambiguitate constatată de RC1) | ground truth, calculul P2 |

---

## Siguranță fizică / imitabilă

### Q-01 — Explozivii

**Deja decis.** D-01 definește arma reală după funcție și cere separat analiza explozivilor, fără a inventa politica. D-04 / D-05
decid logica hazardului care cere control (tip B).

**Deschis.** Au explozivii (bombe, grenade, dinamită) și pirotehnia (artificii, petarde) un hazard propriu, chiar fără
folosire violentă?

| Opțiune | Regula |
|---|---|
| A | Explozivii militari / de distrugere sunt arme reale (D-01): folosire violentă sau amenințare → BLOCK; acces sau manipulare de către copil → BLOCK; prezență neviolentă (muzeu, depozit, profesionist) → REVIEW. Pirotehnia nu are regulă proprie. |
| B | Orice exploziv real în scenă, inclusiv prezența → BLOCK. Pirotehnia → REVIEW. |
| C | Ca A pentru explozivi. Pirotehnia devine familie de hazard D-04 de tip B: copilul care o aprinde sau o manipulează → BLOCK; adultul care o controlează, cu copilul la distanță sigură → candidat PASS; control relevant dar incert → REVIEW (D-05). |

**RECOMANDARE (Claude): C.** Păstrează definiția funcțională D-01. Tratează pirotehnia prin mecanismul control ↔ hazard
deja decis, fără regulă lexicală. Explozivii fantastici rămân în D-03.

### Q-02 — Amenințarea implicită sau ambiguă cu o armă reală

**Deja decis.** Amenințarea clară → BLOCK; prezența neviolentă → REVIEW (D-01). D-01 interzice reclasificarea automată a lui
P-S15.

**Deschis.** Arma îndreptată spre cineva fără act, „raised … then lowered”, „fired at” fără țintă clară.

| Opțiune | Regula |
|---|---|
| A | Arma reală îndreptată spre o ființă, cu intenție neclară → REVIEW. Context care stabilește intimidarea → BLOCK (amenințare clară). „Fired at” o ființă → BLOCK (folosire violentă). „Fired at” fără țintă sau spre o țintă inertă, de către un adult → REVIEW. Ridicată, apoi coborâtă, fără țintă → REVIEW. |
| B | Orice armă reală îndreptată spre o ființă → BLOCK, indiferent de context. |
| C | Toate cazurile ambigue → REVIEW, ca prezența. |

**RECOMANDARE (Claude): A.** Separă ambiguitatea (operatorul judecă) de amenințarea stabilită (ne-deblocabilă), așa cum
cere D-01. Amenințarea fără instrument trece la Q-03.

### Q-03 — Violența fizică fără obiect

**Deja decis.** Jucăria folosită pentru a răni → BLOCK (D-02). Vătămarea fantastică explicită → BLOCK (D-03).

**Deschis.** Lovitura, îmbrânceala, bătaia fără obiect.

| Opțiune | Regula |
|---|---|
| A | Aceeași gradare ca D-02 / D-03. Vătămare explicită → BLOCK. Agresiune sau amenințare fizică fără vătămare descrisă, ori context ambiguu → REVIEW. Joacă fizică clar consensuală și benignă (luptă în joacă, prinsea, gâdilat) → PASS. Amenințarea verbală fără instrument („Te bat!”) → REVIEW (se leagă de D-10). |
| B | Orice violență fizică între personaje → BLOCK. |
| C | Orice violență fără obiect → REVIEW, inclusiv cu vătămare. |

**RECOMANDARE (Claude): A.** E simetrică cu D-02 / D-03. Previne bypass-ul „fără obiect = PASS” și nu blochează joaca
fizică normală.

### Q-04 — Sânge, gore și moarte

**Deja decis.** Regula existentă: „violență/sânge” → BLOCK (`SAFETY.md`). D-03 o păstrează până la această decizie. Frica e
age-fit (D-11).

**Deschis.** Politica generală pentru sânge, rană grafică și moarte.

| Opțiune | Regula |
|---|---|
| A | (1) Gore, rană grafică, sânge descris sau ilustrat explicit → BLOCK. (2) Rană minoră, negrafică, într-un accident obișnuit (genunchi julit) → content PASS; siguranța după D-06; frica după D-11. (3) Moarte naturală (un animal de companie, un bunic), tratată cu grijă → content PASS; age-fit evaluat (Q-11). (4) Moarte violentă descrisă sau ilustrată → BLOCK. (5) Moarte violentă doar menționată, negrafic → REVIEW. |
| B | Păstrează regula existentă: orice sânge sau moarte → BLOCK. |
| C | Numai gore-ul → BLOCK; tot restul trece pe age-fit, fără regulă de content. |

**RECOMANDARE (Claude): A.** B ar face imposibile cărțile despre pierdere și julituri banale. C ar lăsa moartea violentă fără
poartă de content. A separă graficul (content) de emoție (age-fit) și se aplică text + imagine.

### Q-05 — Consecința nivelului „vătămare semnificativă”

**Deja decis.** Scala D-06 §18: fără consecință / near miss / minor-reversibil / semnificativ / sever / ireversibil-catastrofal.
Consecință gravă sau ireversibilă → BLOCK. Minor + lecție, hazard A / B → REVIEW. Hazard C → BLOCK.

**Deschis.** Ce consecință are nivelul „semnificativ”? Exemple: o arsură care cere îngrijire, o mână ruptă după o cățărare,
într-o poveste-avertisment cu hazard A / B.

| Opțiune | Regula |
|---|---|
| A | Semnificativ → BLOCK, ca severul. |
| B | Semnificativ, negrafic, cu încadrare negativă clară și recuperare arătată → REVIEW. Prezentat grafic → regula Q-04. Fără încadrare negativă → verdictul hazardului. |
| C | Semnificativ → REVIEW întotdeauna. |

**RECOMANDARE (Claude): B.** Păstrează genul poveste-avertisment (D-06 §5) sub judecata operatorului. Nu lasă glorificarea sau
detaliul grafic să treacă. Severul și ireversibilul rămân BLOCK, cum a decis D-06.

### Q-06 — Hazardurile de mediu (apă, înălțime, vreme, foc / căldură, trafic, frig, animale)

**Deja decis.** Locul nu e verdict; proprietățile fizice (adâncime, curent, înălțime, barieră, echipament, control) sunt evidence
(D-07). Protecțiile se judecă prin D-05.

**Deschis.** „Politica generală pentru hazardurile de mediu.”

| Opțiune | Regula |
|---|---|
| A | Hazardurile de mediu sunt familii de hazard în cadrul D-04 / D-05 / D-06 (A / B / C, condiția de siguranță cerută, control relevant și suficient, expunere, consecință), cu aceeași logică de consecință. Fără politică separată. Clasificarea pe familii se face în SH#2, cu decizii punctuale ale tale unde e editorial. |
| B | Politică separată, mai strictă (de exemplu: copil singur lângă apă adâncă → BLOCK întotdeauna). |

**RECOMANDARE (Claude): A.** E consecventă cu D-07 („locul e evidence”) și cu taxonomia A / B / C deja decisă. Evită o
listă paralelă de reguli.

## Content / child-safety policy

### Q-07 — Taxonomia țintelor stereotipurilor

**Deja decis.** Regulile D-08 (susținut / necontestat / falsă contestare → BLOCK; contestat autentic → REVIEW). Motorul nu
poate fi gender-only. D-09: counterfactual și aplicabilitate.

**Deschis.** Ce e țintă de grup / identitate; diferența stereotip / descriere factuală; severitatea; diferențe de politică.

| Opțiune | Regula |
|---|---|
| A | Ținte protejate: caracteristici de grup sau identitate (sex / gen, origine / etnie / naționalitate, religie, dizabilitate, vârstă, caracteristici corporale, limbă / accent, statut social / familial) și orice altă grupare de oameni tratată la fel prin logica D-08. Aceeași politică D-08 / D-09 pentru toate țintele, fără trepte de severitate pe țintă în RC1. Stereotip = afirmație generală despre capacitatea, valoarea sau caracterul unui grup, prezentată ca adevăr. Descriere factuală = fapt verificabil, relevant în context, care nu atribuie capacitate sau valoare. |
| B | Ca A, dar cu trepte: pentru unele ținte (etnie, religie, dizabilitate) stereotipul e BLOCK chiar și când e contestat. |
| C | Numai țintele din exemplele D-08. |

**RECOMANDARE (Claude): A.** O singură regulă semantică, testabilă și fără listă închisă. B ar elimina povestea anti-stereotip
(D-08 §19) pentru tocmai țintele unde e mai valoroasă.

### Q-08 — Restricții pe vârstă, rol sau capacitate

**Deja decis.** D-09 decide restricțiile formulate prin gen (motiv, aplicabilitate, counterfactual). Pentru alte baze spune
„nedecisă”.

| Opțiune | Regula |
|---|---|
| A | Aceeași logică D-09. Restricția pe vârstă / rol / capacitate relevantă, necesară, proporțională și nederogatorie → PASS („Only grown-ups can drive”). Generalizarea derogatorie despre capacitatea unui grup de vârstă sau rol → calea stereotipului D-08. Relevanță neclară → REVIEW. |
| B | Orice restricție pe vârstă sau rol → PASS (doar genul și identitatea sunt sensibile). |

**RECOMANDARE (Claude): A.** E logica D-09 reutilizată, cum cere chiar D-09 §29. B ar lăsa să treacă „Old people can't
learn”, pe care D-08 §15 îl numește explicit.

### Q-09 — Bullying, hărțuire, excludere și degradare pe aspect

**Deja decis.** Ostilitatea adresată izolată → REVIEW. Batjocura pe aspect → REVIEW. Ura bazată pe corp → minimum REVIEW.
Reconcilierea nu șterge finding-ul local (D-10).

**Deschis.** Plafonul consecinței pentru tiparul repetat și pentru degradarea severă.

| Opțiune | Regula |
|---|---|
| A | Tipar persistent de ostilitate / excludere / degradare îndreptat spre un personaj, nerezolvat → BLOCK la nivel de carte. Același tipar cu rezolvare autentică (recunoaștere, reparație, comportament schimbat; nu „sorry” pro-forma) → REVIEW. Degradare de aspect dezumanizantă, nerezolvată → BLOCK; restul → minimum REVIEW. |
| B | Totul rămâne REVIEW; decide operatorul caz cu caz. |
| C | Orice tipar de bullying → BLOCK, chiar rezolvat. |

**RECOMANDARE (Claude): A.** Copiază structura D-08 (susținut → BLOCK, contestat autentic → REVIEW). Permite povestea
anti-bullying și nu lasă un tipar nerezolvat să depindă doar de un REVIEW.

### Q-10 — Statutul lint-ului `forbidden_words`

**Deja decis.** Lint-ul rămâne consultativ „până la o decizie separată” (D-10 §23).

| Opțiune | Regula |
|---|---|
| A | Confirmi: lint-ul rămâne permanent consultativ, nu e niciodată poartă și nu face parte din claim-ul RC1. |
| B | Lint-ul se retrage. |

**RECOMANDARE (Claude): A.** E statutul actual, fără efect asupra politicii semantice.

## Age-fit

### Q-11 — Alte emoții decât frica (tristețe, doliu, furie, separare, anxietate, rușine)

**Deja decis.** Arhitectura D-11 pentru frică (axa age-fit, finding → severitate → consecință, recuperarea reduce
severitatea, banda schimbă pragul). D-14 interzice extrapolarea automată.

| Opțiune | Regula |
|---|---|
| A | Aceeași arhitectură D-11 / D-14 se aplică acestor emoții, cu factori specifici fiecăreia: permanența pierderii, sprijinul, rezolvarea, auto-reglarea. Furia îndreptată spre cineva activează și D-10. Verdictele fricii nu se transferă automat. |
| B | Amâni: în RC1 jurisdicția emoțională age-fit acoperă numai frica; celelalte emoții sunt NOT VALIDATED. |

**RECOMANDARE (Claude): A.** Cărțile pentru copii tratează des pierderea și furia. A nu adaugă verdicte noi, doar aplică
modelul deja decis cu factorii potriviți.

## Localizare

### Q-12 — Pagini goale sau nealiniate în traducere (`TR_EMPTY`, `TR_MISALIGNED`)

**Deja decis.** Modelul D-14: candidat → REVIEW; defect material confirmat → REPAIR_REQUIRED; fals pozitiv → PASS. D-14 lasă
aceste două coduri în afara deciziei.

| Opțiune | Regula |
|---|---|
| A | O pagină tradusă goală, unde sursa are text, sau o pagină nealiniată cu evenimentul sursei e defect de fidelitate. Candidat → REVIEW; confirmat → REPAIR_REQUIRED. O pagină fără text în sursă rămâne fără text și nu e defect. |
| B | Le tratezi ca eroare tehnică de pipeline (integritate), nu ca fidelitate: release-ul se oprește până la regenerare. |

**RECOMANDARE (Claude): A.** Copilul primește o ediție greșită exact ca la sensul inversat. Modelul D-14 acoperă cazul fără
regulă nouă.

## Știință

### Q-13 — Simplificare acceptabilă / simplificare înșelătoare / afirmație falsă

**Deja decis.** Takeaway științific fals confirmat → REPAIR_REQUIRED. Nu orice lipsă de precizie academică e REPAIR (D-15
§50). Faptul nu e preferința operatorului (D-22 §25).

| Opțiune | Regula |
|---|---|
| A | Simplificare acceptabilă (omite detalii, rămâne adevărată la nivelul copilului, nu instalează o credință de dezvățat) → PASS. Simplificare înșelătoare (aproape adevărată, dar probabil să instaleze o concepție greșită) → REVIEW. Afirmație falsă ca takeaway → REPAIR_REQUIRED. Testul: un expert ar considera falsă credința rezultată la copil? |
| B | Doar două clase: adevărat → PASS; orice imprecizie → REVIEW. |

**RECOMANDARE (Claude): A.** Dă un test verificabil care separă faptul (expertul) de politică (consecința). Evită
REVIEW-uri inutile pentru simplificările normale.

### Q-14 — Știința în lumi fantastice

**Deja decis.** D-15 pentru lumea reală. T18: lumina și vremea naturale nu se prezintă ca magie.

| Opțiune | Regula |
|---|---|
| A | Lumea fantastică poate avea reguli proprii, marcate clar (magie, animale care vorbesc). Acestea nu sunt findings de știință. Afirmațiile despre lumea reală (proprietăți reale ale animalelor, fenomene naturale) prezentate ca fapt rămân sub D-15 și în decor fantastic. Ambiguitatea fantastic / real → REVIEW. T18 rămâne. |
| B | Decorul fantastic scutește tot conținutul de evaluarea științifică. |
| C | Fără scutire: orice afirmație neadevărată în lumea reală e finding de știință. |

**RECOMANDARE (Claude): A.** Păstrează povestea fantastică posibilă. Nu lasă un decor fantastic să predea un mit real ca
fapt.

## Calitate / valori

### Q-15 — Taxonomia valorilor editoriale (T07)

**Deja decis.** T07 ≥ 7, critic, cu delegarea siguranței / content-policy / age-fit / știință. Depiction ≠ endorsement. Fără
VALUES gate nou (D-17).

| Opțiune | Regula |
|---|---|
| A | Cele 13 concepte din D-17 §33 sunt dimensiunile analizei de stance. Finding T07 când produsul endorses / glorifică / normalizează un comportament dăunător (necinste, cruzime, constrângere, furt), fără consecință, corectare sau reparație în takeaway-ul final. Prezentarea simplă nu e finding. Fără praguri pe bandă în RC1 (T07 ≥ 7 uniform). Severitatea se exprimă prin scorul T07, cu evidence valid (D-18). |
| B | Amâni: claim-ul RC1 nu validează T07 pe valori; T07 rulează, dar e NOT VALIDATED. |

**RECOMANDARE (Claude): A.** Folosește doar ce D-17 a enumerat deja. Nu adaugă praguri. Permite cazuri ascunse adjudecabile
pentru T07.

## Claim-ul RC1

### Q-16 — Jurisdicțiile vizuale / cross-modale în claim-ul RC1

**Deja decis.** D-22 §38–§40: evidence ascuns vizual / cross-modal e obligatoriu unde claim-ul afirmă jurisdicția. Altfel
claim-ul o declară NOT IMPLEMENTED / NOT VALIDATED. Imaginile ascunse nu le generează implementatorul. Pipeline-ul are azi
QA vizual cu `safety: pass / review / block`.

| Opțiune | Claim-ul RC1 | Ce cere |
|---|---|---|
| A | Doar text. Toate jurisdicțiile vizuale / cross-modale: NOT IMPLEMENTED / NOT VALIDATED. QA vizual rămâne control de producție, nevalidat Enterprise. | Set ascuns doar text. Cel mai rapid. |
| B | Siguranța vizuală (D-01…D-07 aplicate imaginii) și content-policy vizual (D-08…D-10), plus contradicțiile cross-modale de siguranță / policy. Exclus: age-fit vizual, știință vizuală, valori exclusiv vizuale. | Imagini ascunse dintr-o sursă independentă (Source A / B, la custode), alinierea QA vizual în SH#2, celule vizuale în matrice. |
| C | Toate jurisdicțiile vizuale și cross-modale. | Cel mai mare set de imagini și cea mai mare implementare SH#2. |

**RECOMANDARE (Claude): B.** Cartea e ilustrată, iar riscul cel mai vizibil e o imagine nesigură sau un stereotip desenat.
Poarta există deja în pipeline. Age-fit-ul, știința și valorile vizuale cer taxonomii încă neconstruite. Dacă vrei un RC1 mai
rapid, A e onest și acceptabil, cu condiția ca raportul să spună clar NOT VALIDATED pentru imagini.

### Q-17 — Nivelurile (Page / Book / Volume / Collection) și edițiile din claim-ul RC1

**Deja decis.** Politica se aplică Page → Book → Volume → Collection (D-06, D-14, D-15, D-16, D-17). D-19: coverage pentru
fiecare nivel pe care îl pretinde sistemul. Direcția reală a Product Contract e EN → RO. Rubrica nativă lipsește
(arhitectură).

| Opțiune | Regula |
|---|---|
| A | Claim-ul RC1 acoperă Page și Book pentru jurisdicțiile pretinse. Agregarea Volume și Collection: NOT CLAIMED / NOT VALIDATED în RC1. Ediții: EN (sursa) pentru toate jurisdicțiile; RO pentru age-fit, siguranță, content-policy și știință (paritate) și pentru fidelitatea EN → RO; rubrica T01–T18 numai pe EN. |
| B | Toate cele patru niveluri. Setul ascuns ar trebui să conțină volume și colecții întregi. |
| C | Doar Page. |

**RECOMANDARE (Claude): A.** Book e nivelul la care se decid stance-ul și takeaway-ul (D-06, D-08, D-15). Volume și
Collection cer artefacte ascunse foarte mari și calibrări încă inexistente (D-16 §40). Rămân pentru validarea reală V1–V6.

## Setul ascuns

### Q-18 — Source B

**Deja decis.** Minimum două surse independente de implementator. Source A = om / operator. Source B = model / agent extern
izolat; nu Claude Code / implementatorul. Independența cere separarea contextului (D-22). O sesiune Claude nouă nu ajunge.
Autorizarea RC1: Claude și ChatGPT **actuali** nu devin Source B dacă starea canonică îi consideră contaminați. ChatGPT-ul care
auditează Agent Bridge a primit mirror-ul repository-ului, deci e contaminat (D-22 §13).

| Opțiune | Source B |
|---|---|
| A | O conversație ChatGPT izolată: Temporary Chat, memoria oprită, fără conectori (fără Bridge, fără Drive), fără proiect, fără instrucțiuni personalizate. Primește numai brief-ul sanitizat aprobat. Tu înregistrezi atestarea (setările, data, modelul afișat). Limitare declarată: același furnizor ca auditorul Bridge (priori corelați). Abonament, fără cost nou. |
| B | Alt furnizor (alt model, alt abonament). E serviciu nou: decizie de cost. |
| C | Un al doilea autor uman în locul modelului. |
| D | O sesiune Claude nouă. Respinsă de D-22 ca unic autor și nepreferată ca Source B. |

**RECOMANDARE (Claude): A, opțional îmbogățită cu C.** Respectă regula subscription-first. Independența D-22 e procedurală,
prin separarea contextului și provenance. Limitarea priorilor comuni se declară explicit.

### Q-19 — Storage-ul custodelui

**Deja decis.** Hidden înseamnă inaccesibil implementatorului. Regula e capability-based (D-22 §27–§29). Sesiunea Claude curentă
are conector Google Drive, deci Drive-ul conectat **nu** e hidden storage.

| Opțiune | Storage |
|---|---|
| A | Stocare locală criptată, offline (arhivă sau volum criptat pe un mediu extern), în afara oricărui dosar sincronizat cu un cloud și a oricărui dosar accesibil sesiunilor Claude Code / Cowork. O a doua copie criptată offline. Nonce-urile commitment-ului rămân numai acolo. |
| B | Un cont cloud separat, neconectat la niciun conector Claude sau ChatGPT, cu 2FA. |

**RECOMANDARE (Claude): A.** E cea mai simplă dovadă de capabilitate: nicio sesiune de implementare nu are cale spre ea.

### Q-20 — Cum se numără „REVIEW-ul de candidat” (fidelitate, știință) în porțile D-21

**Ambiguitate constatată de RC1.**

- D-14 și D-15 spun că un defect material **candidat** → REVIEW_REQUIRED. Operatorul doar confirmă (→ REPAIR_REQUIRED) sau
  respinge ca fals pozitiv. Nu poate aproba eroarea.
- D-21 P2 numără orice „REPAIR_REQUIRED → REVIEW_REQUIRED” ca eșec de acceptare.
- Pentru o traducere cu adevărat defectă (adevăr: REPAIR_REQUIRED), un evaluator automat care emite corect „candidat →
  REVIEW” ar pica P2, deși face exact ce cer D-14 / D-15.

| Opțiune | Regula |
|---|---|
| A | REVIEW-ul are un tip citibil automat (`reviewKind`): `waivable` sau `confirm-or-dismiss`. Pentru un caz cu adevărul REPAIR_REQUIRED, ieșirea „REVIEW_REQUIRED + `confirm-or-dismiss` + finding-ul corect” e consecință corectă la stadiul de candidat, nu P2. P2 = ieșire `waivable`, finding pierdut sau stare auto-acceptabilă (ultima e P1). |
| B | Strict: adevărul REPAIR_REQUIRED cere ieșirea REPAIR_REQUIRED. Orice REVIEW e P2 FAIL. Evaluatorul trebuie să confirme singur defectele. |

**RECOMANDARE (Claude): A.** E singura citire în care D-14 / D-15 (confirmarea umană) și D-21 (autoritatea de publicare nu
scade) sunt adevărate simultan. Un REVIEW `confirm-or-dismiss` nu dă operatorului autoritatea de a publica eroarea, iar
P2 protejează tocmai această autoritate.

---

## După decizii

1. Claude înregistrează declarația ta, cuvânt cu cuvânt, în `evaluation/rc1-policy/decisions.jsonl` (înlănțuit prin hash).
2. Registrul trece dependențele la `CLOSED_BY_OPERATOR_DECISION` sau `DEFERRED_BY_OPERATOR`. Gate-ul G15 verifică legătura.
3. Specificația pre-hardening completează celulele matricei și secțiunile dependente.
4. Claude produce draftul mecanic al brief-ului sanitizat. **Aprobarea brief-ului e o decizie separată a ta** (D-22 §18).
