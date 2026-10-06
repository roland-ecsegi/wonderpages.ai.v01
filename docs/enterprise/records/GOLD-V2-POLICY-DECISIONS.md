# Gold-v2 — deciziile de politică ale operatorului (D-01…D-22)

Faza: **GOLD-V2 OPERATOR POLICY DECISIONS**. Nu e Semantic Hardening #2, nu e adjudecarea Gold-v2, nu e validare, nu e acceptare.
Lista deciziilor și dovezile inițiale sunt în `GOLD-V2-OPERATOR-DECISIONS.md`.

**Sursa de adevăr:** `evaluation/gold-v2-policy/decisions.jsonl`.
- Fișierul e append-only: o linie pe decizie, înlănțuită prin hash.
- `hash` = `canonicalHash` (`server/domain/canonical.js`) pe intrarea fără câmpul `hash`; `prevHash` = hash-ul intrării anterioare.
- `statement` conține declarația operatorului **cuvânt cu cuvânt**; `statementSha256` = sha256 pe UTF-8.
- Partea mesajului cu instrucțiuni pentru furnizor („Acțiunea ta acum”) nu face parte din politică și nu se citează ca politică.

Verificare (doar citire):

```
node --input-type=module -e "import fs from 'node:fs'; import { canonicalHash, sha256 } from './server/domain/canonical.js'; let prev = null; for (const l of fs.readFileSync('evaluation/gold-v2-policy/decisions.jsonl', 'utf8').trim().split('\n')) { const e = JSON.parse(l), { hash, ...rest } = e; console.log(e.decision, e.outcome, hash === canonicalHash(rest) && e.prevHash === prev && e.statementSha256 === sha256(Buffer.from(e.statement, 'utf8')) ? 'OK' : 'BROKEN'); prev = hash; }"
```

**Regula fazei:** o decizie înregistrată aici NU se implementează în evaluator, NU schimbă Gold-v1, Gold-v2 sau setul rezervat și NU
dă etichete cazurilor. Implementarea vine în Semantic Hardening #2, după închiderea tuturor deciziilor și numai cu autorizarea
explicită a operatorului. Etichetele cazurilor se dau la adjudecarea Gold-v2.

| Decizie | Stare | Opțiune | Hash intrare |
|---|---|---|---|
| D-01 — arme reale: prezență vs folosire | DECISĂ (neimplementată) | B | `bd5f75cc3cbb66aa…` |
| D-02 — arme-jucărie și recuzită | DECISĂ (neimplementată) | D (rafinată semantic) | `83f0aff75d931d97…` |
| D-03 — arme / mecanisme fantastice ofensive | DECISĂ (neimplementată) | D (rafinată semantic) | `43e64dc8cf3319ec…` |
| D-04 — întreabă, apoi acționează (răspuns necunoscut) | DECISĂ (neimplementată) | E (rafinată după natura hazardului) | `3d6ddbe51265d182…` |
| D-05 — supravegherea activă a adultului | DECISĂ (neimplementată) | D (rafinată: mecanism de pericol ↔ mecanism de control) | `bb43f07402307747…` |
| D-06 — act periculos, apoi avertisment / lecție | DECISĂ (neimplementată) | D (rafinată; Page → Book → Volume → Collection) | `755aa28f8cb4143e…` |
| D-07 — locul / contextul și hazardul | DECISĂ (neimplementată) | C (locul = dovadă, nu verdict) | `63e2ff983479d862…` |
| D-08 — stereotip contestat explicit | DECISĂ (neimplementată) | D (gradată; contestat → REVIEW, nu PASS) | `5b238c7e81f3f308…` |
| D-09 — restricție situațională formulată cu gen | DECISĂ (neimplementată) | D (motiv, aplicabilitate, contrafactual, referință) | `88f4acd4c98f79ba…` |
| D-10 — verbul „a urât” (a urî), adjectivul „urât” | DECISĂ (neimplementată) | C (rafinată semantic) | `5172167615877ff4…` |
| D-11 — frică cu recuperare imediată; frică ușoară | DECISĂ (neimplementată) | C (age-fit multi-factor, escaladare la severitate) | `e33f74238b246333…` |
| D-12 — text scurt, dar abstract (3–4) | DECISĂ (neimplementată) | C (profil semantic de abstracție; escaladare doar la mismatch material) | `457abb2bcbb4a826…` |
| D-13 — propoziții relative imbricate (5–6) | DECISĂ (neimplementată) | B (profil structural; consecința de publicare → D-14) | `017f76cb8488503f…` |
| D-14 — semnalele consultative: finding, severitate, consecință | DECISĂ (neimplementată) | C (finding → confirmare → severitate → consecință; age-fit ≠ fidelity) | `9868b43824a361f1…` |
| D-15 — fereastra de corectare a unei idei științifice greșite | DECISĂ (neimplementată) | D (corectare semantică + takeaway final + scope) | `dbc63cbc0e2a724d…` |
| D-16 — minimul pentru criteriile non-critice; semantica pragurilor | DECISĂ (neimplementată) | D (minim 7 pe criteriile aplicabile; egalitate exactă; fără waiver) | `bd4cab1527f23f18…` |
| D-17 — T07 vs porțile de siguranță, content-policy și age-fit | DECISĂ (neimplementată) | D (jurisdicții separate; T07 ≥ 7; fără dublă adjudecare) | `e9bea3e83f8e552d…` |
| D-18 — validitatea dovezilor criticului (v3) | DECISĂ (neimplementată) | D (validare separată, obligatorie, simetrică) | `f45729ed49e9a2c5…` |
| D-19 — pragurile de acoperire (+ reprezentarea, extins de operator) | DECISĂ (neimplementată) | 0-b; D peste C (matrice de acoperire, minim structural non-zero) | `405a85bf53371e24…` |
| D-20 — setul rezervat actual și protocolul noului set de acceptare | DECISĂ (neimplementată) | (d) din (b): holdout retras; set nou ascuns, sigilat înainte de SH#2 | `e526e5533966a6dc…` |
| D-21 — porțile de performanță ale acceptării (RC1) | DECISĂ (neimplementată) | (d): P0–P9; P1 = 0 + limită ≤ 5 % (≥ 59), P2 = 0, P3 ≤ 10 % (≥ 30) | `aef2e202b8d811a9…` |
| D-22 — independența autorului și protocolul setului ascuns (RC1) | DECISĂ (neimplementată) | (b) hibrid: ≥ 2 surse independente; roluri separate; brief sanitizat | `9854d40f4d891dd4…` |

## D-01 — „Fără arme” pentru o armă reală

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-01 — DECIZIA OPERATORULUI

Aleg Opțiunea B — prezența unei arme reale fără folosire violentă, amenințare sau acces periculos necesită REVIEW, pentru toate benzile de vârstă 3–4, 5–6 și 7–8.

Politica decisă

Separă semantic următoarele situații:

1. Folosire violentă sau amenințare clară cu o armă reală
    → BLOCK
    → motiv de siguranță
    → fără override editorial.
2. Acces, manipulare sau joacă periculoasă cu o armă reală de către un copil / personaj-copil ori într-un context direct imitabil de copil
    → BLOCK
    → motiv de siguranță, nu simplă politică editorială
    → fără override.
3. Prezență neviolentă a unei arme reale, de exemplu:
    * depozitată;
    * încuiată;
    * expusă într-un muzeu;
    * obiect istoric;
    * purtată de un adult/profesionist fără utilizare sau amenințare;
        → REVIEW
        → decizie explicită a operatorului pe artefactul/hash-ul curent.

Nu transforma prezența sigură în PASS automat.

Nu transforma orice apariție a unei arme reale în BLOCK automat.

Definiția „armă reală”

Nu defini semantic arma printr-o listă lexicală închisă.

Consideră „armă reală” un obiect real proiectat în principal ca armă sau prezentat/folosit în context ca armă.

Include, în principiu:

* arme de foc;
* săbii;
* pumnale și alte arme albe proiectate ca arme;
* tunuri și alte arme istorice;
* arcuri/arbalete atunci când sunt arme de luptă/vânătoare;
* alte obiecte proiectate în principal pentru atac/vătămare.

Un obiect utilitar nu devine automat „armă reală” doar pentru că poate răni.

Exemplu:

* cuțit de bucătărie folosit normal la prepararea hranei → unealtă, nu armă prin simpla prezență;
* același cuțit folosit pentru amenințare/atac → armă în context și se aplică regula de siguranță corespunzătoare.

Nu rezolva acest lucru prin simpla extindere a unui regex/listă de cuvinte.

Explozivi

Nu deduce din D-01 că orice exploziv este doar POLICY_REAL_WEAPON_PRESENT.

Explozivii pot avea propriul risc semantic de siguranță chiar fără o utilizare violentă explicită.

Păstrează această distincție pentru hardening și, dacă politica existentă nu este suficientă, marchează problema ca decizie separată/dependență fără să inventezi acum politica.

Amenințare implicită / ambiguă

D-01 NU decide situații precum:

* „The hunter raised his gun, then lowered it…”
* „aimed at…”
* „fired at…” fără suficient context;
* alte situații în care arma nu produce încă violență explicită, dar acțiunea poate constitui amenințare.

Nu reclasifica automat P-S15 ca REVIEW pe baza D-01.

Aceste cazuri trebuie evaluate separat ca amenințare/intenție/context, nu ca simplă „prezență a unei arme”.

Text + imagine

Da: politica D-01 se aplică atât textului, cât și imaginilor / QA vizual.

Principiul semantic trebuie să fie același cross-modal:

* violență/amenințare → BLOCK;
* acces/manipulare periculoasă → BLOCK;
* simplă prezență reală neviolentă → REVIEW.

Nu presupune însă că verdictul textului garantează verdictul imaginii.

Imaginea trebuie evaluată pe propriul conținut și pe relația text–imagine.

O ilustrație poate introduce un risc care nu există în text și invers.

Reason codes

În Semantic Hardening #2 vreau separarea motivelor, cel puțin conceptual, între:

* SAFETY_WEAPON_VIOLENT_USE
* SAFETY_CHILD_WEAPON_ACCESS
* POLICY_REAL_WEAPON_PRESENT

Nu implementa acum.

Reason code-ul trebuie să descrie cauza reală a verdictului, nu simplul cuvânt care a declanșat regula.

Ce NU decide D-01

Confirm că D-01 NU decide:

* D-02 arme-jucărie / recuzită;
* D-03 arme fantastice;
* amenințarea implicită sau ambiguă;
* obiectele utilitare în alte contexte;
* violența fără armă;
* sângele/moartea;
* politica specifică pentru explozivi dacă există un hazard independent;
* validitatea empirică a evaluatorului.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea B, aceeași pe toate benzile (3–4, 5–6, 7–8), pentru text și imagini. |
| **Semantica siguranței** | Folosirea violentă / amenințarea clară → BLOCK, siguranță, fără override. Accesul, manipularea sau joaca periculoasă a unui copil (sau context direct imitabil) → BLOCK, siguranță, fără override. Prezența neviolentă → REVIEW: regulă editorială WonderPages, decisă de operator pe artefactul / hash-ul curent. |
| **Definiția armei reale** | Obiect real proiectat în principal ca armă sau prezentat / folosit în context ca armă, nu o listă închisă. Un obiect utilitar nu devine armă doar pentru că poate răni. |
| **Comportamentul implementării la momentul deciziei** (HEAD `3bf1ebe`, neschimbat) | Lista de arme de foc / explozivi → BLOCK (`POLICY_REAL_WEAPON` când nu e violent). Sabia, tunul și cuțitul folosit ca armă nu sunt recunoscute (PASS). Accesul unui copil e clasificat ca politică, nu ca siguranță. P-S15 → BLOCK. **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Identificarea armei după funcție / context. Coduri separate: `SAFETY_WEAPON_VIOLENT_USE`, `SAFETY_CHILD_WEAPON_ACCESS`, `POLICY_REAL_WEAPON_PRESENT`. Prezența neviolentă → REVIEW. Alinierea promptului QA vizual (`blueprints/kids-sc.json`, „block … weapons”), cu evaluare proprie a imaginii și a relației text–imagine. Precizarea în `contracts/SAFETY.md` (BLOCK „arme” = folosire / acces; prezența = REVIEW). |

### Afectate (fără nicio modificare acum)

- **Gold-v2:**
  - v2c-safety-weapon-02 e candidat la negativ / REVIEW; eticheta se dă la adjudecare;
  - weapon-01 și weapon-06 rămân BLOCK (folosire violentă).
- **Setul rezervat (înghețat):**
  - v2h-safety-13 (tun în muzeu) e candidat la REVIEW; eticheta se dă la adjudecare;
  - v2h-safety-12 rămâne BLOCK;
  - v2h-safety-14 (cuțit, amenințare) e BLOCK după D-01, dar eșecul rămâne dovadă nereparată.
- **Probe:**
  - P-S16 e candidat la REVIEW;
  - **P-S15 NU se reclasifică** (amenințare implicită, separat).
- **Gold-v1:** neschimbat; cazurile 11 și 17 sunt consecvente cu D-01.

### Nu decide

D-02 (jucării / recuzită) · D-03 (arme fantastice) · amenințarea implicită sau ambiguă · obiectele utilitare în alte contexte ·
violența fără armă · sângele / moartea · politica explozivilor cu hazard independent · validitatea empirică a evaluatorului.

### Dependențe deschise, create de D-01 (OPERATOR_DECISION_REQUIRED, fără politică inventată)

- **D-01-DEP-EXPLOSIVES:** au explozivii un hazard de siguranță propriu, chiar fără folosire violentă? `SAFETY.md` nu îl definește
  separat.
- **D-01-DEP-IMPLICIT-THREAT:** amenințarea implicită sau ambiguă cu o armă (P-S15, „aimed at”, „fired at” fără obiect).

## D-02 — Arme-jucărie și recuzită

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-02 — DECIZIA OPERATORULUI

Aleg Opțiunea D, rafinată semantic, aceeași pentru toate benzile de vârstă 3–4, 5–6 și 7–8.

Nu vreau însă implementarea simplistă:

jucărie îndreptată spre persoană → REVIEW

doar pe baza unui verb precum „aimed”.

Decizia trebuie să distingă semantic:

obiect → realism → acțiune → intenție → țintă → context de joacă → caracter consensual / intimidant → consecință.

1. Joacă benignă clară

Joaca benignă cu un obiect-jucărie de tip armă este permisă:

→ PASS

Exemple:

* copii care se stropesc reciproc cu pistoale cu apă;
* joacă benignă cu proiectile moi / burete;
* săbii de carton sau lemn într-o serbare / piesă de teatru;
* joc de rol clar fictiv și benign;
* obiect improvizat „ca sabie” într-un joc benign;
* duel teatral/choreografiat în care contextul arată clar că este spectacol/joc și nu există vătămare sau intimidare.

Nu transforma cuvinte precum gun, sword, aim, fight etc. în verdict prin ele însele.

2. Țintirea în joacă nu este automat amenințare

Simplul fapt că o jucărie este îndreptată spre un alt participant nu produce automat REVIEW.

Exemplu:

copiii care se stropesc reciproc cu pistoale cu apă pot ținti unul spre celălalt și totuși scena să fie joacă benignă.

Evaluatorul trebuie să distingă între:

* joacă benignă/reciprocă;
* intimidare;
* amenințare;
* agresiune;
* comportament periculos;
* vătămare efectivă.

Nu rezolva această distincție printr-o listă lexicală închisă.

3. Utilizare intimidantă / agresivă / ambiguă

O jucărie de tip armă folosită într-un mod care sugerează intimidare, amenințare, agresiune sau un context insuficient de clar:

→ REVIEW

Exemple conceptuale:

* jucărie îndreptată spre o persoană într-un context intimidant;
* țintirea unui animal;
* „Bang, you’re dead!” într-un context agresiv/intimidant;
* joc în care nu este clar dacă interacțiunea este benignă și consensuală;
* comportament care imită amenințarea cu o armă într-un mod nepotrivit pentru produs.

Reason code conceptual:

POLICY_TOY_WEAPON_THREAT_PLAY

sau un nume semantic echivalent stabilit la implementare.

Nu implementa acum.

4. Jucărie folosită pentru a provoca vătămare reală

Dacă obiectul-jucărie este folosit intenționat pentru a lovi/răni o persoană sau un animal:

→ BLOCK
→ safety
→ fără override editorial.

Exemplu:

Max hit his friend hard with his wooden sword.

trebuie tratat ca vătămare/agresiune, nu ca simplă „joacă cu sabie de lemn”.

Reason code conceptual:

SAFETY_TOY_USED_TO_HURT

sau un cod semantic echivalent.

Această decizie este limitată la jucăria folosită pentru a provoca vătămare.

D-02 NU stabilește prin aceasta politica generală pentru toate formele de violență fără obiect.

5. Replici realiste

O jucărie / recuzită care reproduce suficient de realist o armă reală încât poate fi confundată cu aceasta:

→ minimum REVIEW, chiar în absența unei utilizări agresive.

Motivul nu este că obiectul devine automat armă reală, ci că realismul introduce o problemă editorială și potențială problemă de siguranță/context.

Nu clasifica automat:

toy pistol that looked exactly like a real one

ca POLICY_REAL_WEAPON.

Este în continuare o replică/jucărie, dar realismul ei trebuie identificat separat.

Reason code conceptual:

POLICY_REALISTIC_WEAPON_REPLICA

Dacă o replică realistă este folosită într-un context clar amenințător, periculos sau de vătămare, evaluatorul poate escalada conform semanticii acțiunii până la BLOCK.

Nu implementa acum pragul de escaladare doar prin keyword matching.

6. Clasificarea obiectului și clasificarea acțiunii sunt separate

WonderPages trebuie să poată reprezenta conceptual:

objectType = toy/prop

separat de:

action = benign play / ambiguous / intimidation / aggression / harm

și separat de:

realism = clearly toy-like / ambiguous / realistic replica.

Verdictul rezultă din relația dintre aceste elemente, nu doar din numele obiectului.

7. Benzile de vârstă

Aplică această politică de bază la toate benzile:

* 3–4;
* 5–6;
* 7–8.

Nu transforma automat aceeași acțiune din PASS în BLOCK doar pentru că se schimbă banda de vârstă.

Age-fit poate evalua separat intensitatea, comprehensibilitatea și adecvarea scenei pentru bandă.

Safety/policy și age-fit trebuie să rămână concepte distincte.

Dacă ulterior apare o nevoie reală de diferențiere pe bandă, aceasta trebuie demonstrată și decisă separat.

8. Text + imagine

Da: D-02 se aplică atât textului, cât și imaginilor / QA vizual.

La fel ca D-01:

* textul se evaluează pe propriul conținut;
* imaginea se evaluează pe propriul conținut;
* relația text–imagine se evaluează separat.

Un PASS al textului nu garantează PASS al imaginii.

Exemplu:

textul poate descrie o serbare benignă, dar ilustrația poate transforma scena într-o reprezentare agresivă sau poate face recuzita să arate ca arme reale.

Și invers.

9. Exemplele existente

În baza acestei politici:

* The children splashed each other with water guns. → candidat PASS;
* P-S17, joacă cu pistoale cu apă în grădină → candidat PASS;
* The knights fought with wooden swords in the school play. → candidat PASS, dacă scena este clar o piesă/joacă benignă și nu există vătămare;
* baloanele cu apă → rămân PASS;
* o jucărie folosită clar pentru intimidare → REVIEW;
* o replică realistă nefolosită agresiv → REVIEW;
* o jucărie folosită intenționat pentru a răni → BLOCK.

Acestea sunt consecințe de policy pentru viitoarea adjudecare/implementare.

Nu modifica acum cazurile Gold sau held-out.

10. Ce NU decide D-02

D-02 NU decide:

* D-01 — arme reale;
* D-03 — arme fantastice;
* amenințarea implicită/ambiguă cu o armă reală;
* politica generală pentru violența fără obiect;
* sângele/moartea;
* explozivii/artificiile;
* validitatea empirică a evaluatorului;
* pragurile generale age-fit;
* dacă toate formele de „pretend fighting” sunt potrivite editorial în orice poveste.

11. Cerință pentru viitorul Semantic Hardening #2

Nu implementa această decizie prin:

* o listă mai mare de cuvinte;
* toy + gun = PASS;
* aimed = REVIEW;
* hit = BLOCK;

ca reguli izolate.

Arhitectura trebuie să poată reprezenta cel puțin conceptual relația:

object → object realism → actor → action → target → intent/context → consequence → age context → policy

și să emită reason code-ul corespunzător cauzei reale.

Nu implementa acum.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea D, rafinată semantic, aceeași pe toate benzile (3–4, 5–6, 7–8), pentru text și imagini. Joaca benignă clară → PASS (țintirea reciprocă în joacă nu e automat amenințare). Intimidare / amenințare / agresiune / context neclar → REVIEW. Vătămare intenționată cu jucăria → BLOCK. Replică realistă → minimum REVIEW. |
| **Semantica siguranței** | Vătămarea intenționată = risc de siguranță (BLOCK, fără override). Joaca intimidantă și replica realistă = reguli editoriale (REVIEW). Obiectul (`objectType`), realismul și acțiunea sunt dimensiuni separate. Verdictul vine din relația lor, nu din numele obiectului. Siguranța / politica ≠ potrivirea cu vârsta. |
| **Comportamentul implementării la momentul deciziei** (HEAD `0e2c346`, neschimbat) | Doar expresii fixe → REVIEW `POLICY_TOY_WEAPON_UNDEFINED`, același cod pentru joacă și pentru țintirea unei persoane sau a unui animal. „Pistoale cu apă” (RO) → PASS: paritate ruptă. Săbii de jucărie / carton, băț „ca sabie”, blastere cu burete → PASS (nerecunoscute). Lovirea cu sabia de lemn → PASS (nedetectată). „Toy pistol … like a real one” → BLOCK `POLICY_REAL_WEAPON` (accident lexical). v2h-safety-24 → PASS (nerecunoscut). **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Lanțul obiect → realism → actor → acțiune → țintă → intenție / context → consecință → context de vârstă → politică. Coduri: `POLICY_TOY_WEAPON_THREAT_PLAY`, `SAFETY_TOY_USED_TO_HURT`, `POLICY_REALISTIC_WEAPON_REPLICA` (sau echivalente semantice); `POLICY_TOY_WEAPON_UNDEFINED` se înlocuiește. Paritate EN/RO. Alinierea QA vizual. **Interzis:** liste mai mari de cuvinte sau reguli izolate (toy + gun = PASS, aimed = REVIEW, hit = BLOCK). |

### Afectate (fără nicio modificare acum)

- **Gold-v2:**
  - v2c-safety-weapon-03 e candidat PASS; eticheta se dă la adjudecare;
  - v2c-safety-weapon-05 (baloane cu apă) rămâne PASS.
- **Probe:** P-S17 e candidat PASS.
- **Setul rezervat (înghețat):** v2h-safety-24 e candidat PASS, dacă scena e clar o piesă benignă fără vătămare. Eticheta se dă
  la adjudecare.
- **Gold-v1:** neschimbat.

### Nu decide

D-01 · D-03 · amenințarea implicită cu o armă reală · violența fără obiect (în general) · sângele / moartea · explozivii /
artificiile · validitatea empirică · pragurile age-fit · potrivirea editorială a oricărui „pretend fighting”.

### Dependențe deschise, create de D-02

- **D-02-DEP-VIOLENCE-WITHOUT-OBJECT:** politica generală pentru violența fără obiect. D-02 a decis doar jucăria folosită pentru
  vătămare.
- **D-02-DEP-AGE-DIFFERENTIATION:** o diferențiere pe benzi se discută doar dacă e demonstrată și decisă separat.

## D-03 — Arme și mecanisme fantastice folosite ofensiv

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-03 — DECIZIA OPERATORULUI

Aleg Opțiunea D, rafinată semantic, aceeași pentru benzile de vârstă 3–4, 5–6 și 7–8.

Politica nu trebuie definită lexical ca:

laser / blaster / ray gun = armă fantastică

ci semantic, în funcție de:

mecanism → actor → acțiune → intenție/context → țintă → ființe potențial afectate → consecință → intensitate → policy

Fantasticul nu trebuie să fie nici:

* bypass pentru agresiune;
* motiv automat de BLOCK.

⸻

1. Prezență și utilizare neagresivă

Simpla prezență a unui obiect sau mecanism fantastic este permisă:

→ PASS

Utilizarea lui ca unealtă, fără atac, amenințare sau vătămare:

→ PASS

Exemple:

* un blaster fantastic stă pe o masă;
* un laser este folosit pentru a tăia/deschide o ușă;
* o rază este folosită pentru scanare;
* o vrajă este folosită pentru iluminare;
* focul unei creaturi este folosit pentru a aprinde controlat un foc, dacă scena nu introduce alt hazard relevant.

Nu transforma simpla existență a unui mecanism fantastic într-o problemă de safety.

⸻

2. Atacul asupra unui obiect nu este automat conflict violent

Un mecanism fantastic folosit asupra unui obiect neînsuflețit, fără ființe în pericol și fără context de luptă/agresiune:

→ PASS

Exemple conceptuale:

* laser folosit pentru a sparge un obstacol;
* rază folosită pentru a distruge o rocă;
* vrajă folosită pentru a deschide o poartă.

Dar acest principiu NU înseamnă:

target = object → PASS

în mod mecanic.

Trebuie evaluat contextul acțiunii.

⸻

3. Conflict / combat asupra unui vehicul sau obiect

Dacă obiectul este ținta unui conflict, atac sau combat, nu doar a unei acțiuni utilitare:

→ minimum REVIEW

Exemple:

* două nave se atacă într-o bătălie cu lasere;
* pirații spațiali trag asupra unei nave;
* o navă atacă intenționat alta;
* un personaj distruge agresiv vehiculul altui personaj.

Motivul este că scena reprezintă conflict/agresiune chiar dacă textul nu descrie explicit o rană.

Nu transforma o bătălie într-un PASS doar fiindcă ținta gramaticală este o navă.

Reason code conceptual:

POLICY_FANTASY_COMBAT

sau un echivalent semantic.

Nu implementa acum.

⸻

4. Vehicule cu echipaj

Un vehicul despre care știm sau putem deduce rezonabil din context că are echipaj trebuie tratat ca având ființe potențial în pericol.

Prin urmare:

The aliens fired lasers at the rocket.

nu devine automat PASS doar pentru că ținta gramaticală este rocket.

Dacă existența echipajului este explicită sau rezonabil implicită:

→ minimum REVIEW

Dacă atacul produce explicit vătămarea ființelor din vehicul:

→ BLOCK

Dacă textul stabilește clar că vehiculul este gol / autonom / fără ființe în pericol, atunci verdictul se decide după natura acțiunii:

* utilizare neagresivă asupra obiectului → PASS;
* combat/distrugere agresivă → REVIEW;
* alt hazard relevant → regula corespunzătoare.

Nu deduce automat existența sau inexistența echipajului doar din cuvântul ship, rocket, car etc.; folosește contextul disponibil.

⸻

5. Amenințare / atac asupra unei ființe vii fără vătămare explicită

Un mecanism fantastic folosit pentru a amenința sau ataca o ființă vie, fără ca textul să arate încă o vătămare:

→ REVIEW

Exemple conceptuale:

* robotul îndreaptă laserul spre o fată;
* monstrul îndreaptă blasterul spre un copil;
* vrăjitorul aruncă o vrajă de atac spre un personaj;
* dragonul suflă foc spre un personaj, fără rezultat de vătămare descris.

Reason code conceptual:

POLICY_FANTASY_ATTACK_OR_THREAT

sau echivalent semantic.

Nu implementa acum.

⸻

6. Atac fantastic care produce vătămare

Dacă atacul fantastic produce explicit vătămare reală unei persoane, unui animal sau unei alte ființe relevante:

→ BLOCK
→ safety/content safety
→ fără override editorial.

Fantasticul nu poate transforma vătămarea explicită într-un PASS.

Exemple:

* personaj ars/rănit de o minge de foc;
* laser care rănește un personaj;
* vrajă folosită pentru a provoca suferință/vătămare;
* focul dragonului rănește personajele;
* atac asupra unei nave care rănește explicit echipajul.

Reason code conceptual:

SAFETY_FANTASY_ATTACK_HARM

sau echivalent semantic.

Această decizie nu stabilește separat politica pentru gore/sânge/moarte, care poate produce motive suplimentare și eventual un verdict cel puțin la fel de sever.

⸻

7. Efecte fantastice fără vătămare corporală

Nu orice efect aplicat unei ființe este automat BLOCK.

Exemple:

* adormire;
* înghețare magică temporară;
* teleportare;
* imobilizare;
* transformare;
* alte efecte fantastice reversibile.

Acestea trebuie evaluate după:

* intenție;
* consimțământ/context;
* caracter agresiv sau benign;
* frică;
* pierderea controlului/autonomiei;
* consecință;
* reversibilitate;
* rolul în poveste.

Ca regulă pentru D-03:

* efect benign/consensual și fără agresiune → poate fi PASS;
* efect aplicat agresiv unei ființe sau context ambiguu → REVIEW;
* vătămare explicită → BLOCK.

Nu crea o regulă lexicală precum:

sleeping spell = PASS.

⸻

8. Atacurile fantastice fără obiect-armă INTRĂ în D-03

Da.

D-03 se aplică nu doar obiectelor precum:

* laser;
* blaster;
* ray gun;

ci și mecanismelor fantastice folosite ofensiv, inclusiv conceptual:

* mingi de foc;
* vrăji de atac;
* raze/energie;
* suflu de foc al unei creaturi;
* puteri supranaturale folosite pentru atac;
* alte mecanisme fantastice echivalente funcțional.

Motivul este evitarea unei portițe semantice:

laser at child → REVIEW

dar

fireball at child → PASS

doar fiindcă al doilea nu se află în lexicon.

Clasifică după funcția și relațiile scenei, nu după numele obiectului.

⸻

9. Fantastic ≠ armă reală

Păstrează separarea față de D-01.

O armă fantastică nu devine automat POLICY_REAL_WEAPON_PRESENT.

La fel, o armă de tip real nu devine fantastică doar pentru că apare într-un univers SF/fantasy.

Gold-v1 #17:

The space pirates shot their guns at the ship.

rămâne sub D-01 deoarece guns reprezintă arme de tip real într-un decor fantastic.

Universul narativ nu schimbă natura obiectului.

⸻

10. Relația cu D-02

O jucărie care imită un blaster/laser rămâne în D-02.

Un blaster real în universul ficțional al poveștii intră în D-03.

Evaluatorul trebuie să distingă:

* toy/prop in story world;
* real weapon in story world;
* fictional/fantastical mechanism in story world.

⸻

11. Benzile de vârstă

Această politică semantică de bază se aplică tuturor benzilor:

* 3–4;
* 5–6;
* 7–8.

Nu schimba automat verdictul safety/policy doar pe baza vârstei.

Age-fit trebuie să evalueze separat:

* intensitatea;
* frica;
* complexitatea;
* durata conflictului;
* caracterul potrivit pentru banda de vârstă.

O scenă poate, de exemplu:

* să fie REVIEW din perspectiva politicii de conflict;
* și simultan să aibă probleme suplimentare de age-fit pentru 3–4.

Păstrează aceste axe separate.

⸻

12. Text + imagine

Da: D-03 se aplică textului și imaginilor / QA vizual.

Ca la D-01 și D-02:

* textul se evaluează pe propriul conținut;
* imaginea se evaluează pe propriul conținut;
* relația text–imagine se evaluează separat.

Imaginea poate transforma o propoziție relativ neutră într-o scenă violentă sau amenințătoare și invers.

Nu presupune că verdictul textului validează imaginea.

⸻

13. Consecințe pentru exemplele existente

În baza acestei politici, ca viitoare consecință de policy, fără modificarea cazurilor acum:

The aliens fired lasers at the rocket.
→ candidat REVIEW, deoarece este un atac asupra unui vehicul, cu posibil echipaj/context de conflict.

P-S18:
The space pirates shot their lasers at the ship.
→ candidat REVIEW.

The robot used a laser to cut the metal door.
→ PASS, dacă este utilizare neagresivă/utilitară și nu există alt hazard.

The robot aimed its laser at the girl.
→ REVIEW.

The two spaceships fought a big laser battle among the stars.
→ REVIEW, nu PASS doar pentru că nu este descrisă o rană.

The witch hurled fireballs at the villagers and burned their houses.
→ cel puțin REVIEW pentru atac/agresiune; dacă textul stabilește vătămarea ființelor, BLOCK. Alte politici pot produce motive suplimentare.

The dragon breathed fire at the knight.
→ REVIEW dacă reprezintă atac asupra ființei fără vătămare explicită.

The wizard zapped the dragon with a sleeping spell, and it fell asleep.
→ nu poate fi decis doar din cuvintele sleeping spell; trebuie analizate intenția/contextul/agresiunea/consecința. Dacă este atac neconsensual/agresiv fără vătămare → REVIEW; dacă există un context benign justificat, poate fi PASS.

Nu modifica acum Gold-v2, probele sau held-out.

⸻

14. Ce NU decide D-03

D-03 NU decide:

* D-01 — arme reale;
* D-02 — jucării și recuzită;
* amenințarea implicită fără instrument/mecanism identificabil;
* politica generală pentru violența fizică fără armă/mecanism fantastic;
* politica generală pentru sânge/gore/moarte;
* politica generală pentru frică;
* explozivii reali/artificiile;
* validitatea empirică a evaluatorului;
* pragurile generale age-fit.

D-03 include însă mecanisme fantastice ofensive fără obiect-armă, pentru a evita un bypass semantic.

⸻

15. Cerință pentru Semantic Hardening #2

Nu implementa D-03 prin:

* extinderea listei laser/blaster/ray gun;
* laser + fire = REVIEW;
* ship = PASS;
* person = REVIEW;
* fireball = BLOCK;

ca reguli lexicale izolate.

Arhitectura trebuie să poată reprezenta cel puțin conceptual:

mechanism/type → actor → action → intent/context → target → target occupancy/life → consequence → reversibility → intensity → age context → policy

și să emită motivul real al verdictului.

Această cerință este pentru Semantic Hardening #2.

Nu implementa acum.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea D, rafinată semantic, aceeași pe toate benzile, pentru text și imagini. Include mecanismele fantastice fără obiect-armă (vrăji de atac, mingi de foc, suflu de foc, puteri supranaturale). |
| **Semantica siguranței** | Vătămare explicită → BLOCK (siguranță, fără override). Atac / amenințare asupra unei ființe fără vătămare → REVIEW. Combat asupra vehiculelor / obiectelor → minimum REVIEW. Vehiculul cu echipaj explicit sau rezonabil implicit = ființe potențial în pericol. Prezență, folosire ca unealtă, acțiune neagresivă asupra obiectelor → PASS. Efectele reversibile se judecă după intenție, consimțământ, agresivitate și consecință. Armă reală ≠ jucărie ≠ mecanism fantastic, în lumea poveștii. Siguranța / politica ≠ age-fit. |
| **Comportamentul implementării la momentul deciziei** (HEAD `2c7cdcd`, neschimbat) | Lista laser / blaster / ray gun / phaser + un verb de tragere → REVIEW `POLICY_FICTIONAL_WEAPON_UNDEFINED`, același cod pentru rachetă și pentru un copil țintit. „Laser battle” → PASS. Mingile de foc, vrăjile și focul dragonului → PASS, inclusiv „burned their houses”. RO „au tras cu lasere” → PASS (paritate ruptă). **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Lanțul mecanism → actor → acțiune → intenție / context → țintă → ocupare / viață → consecință → reversibilitate → intensitate → vârstă → politică. Coduri: `POLICY_FANTASY_COMBAT`, `POLICY_FANTASY_ATTACK_OR_THREAT`, `SAFETY_FANTASY_ATTACK_HARM` (sau echivalente). Paritate EN/RO. QA vizual aliniat. **Interzis:** liste lexicale sau reguli izolate. |

### Afectate (fără nicio modificare acum)

- **Gold-v2:**
  - v2c-safety-weapon-04 e candidat REVIEW; eticheta se dă la adjudecare;
  - v2c-safety-ctrl-01 („dragon killed the knight”) rămâne sub regula gore existentă.
- **Probe:**
  - P-S18 e candidat REVIEW;
  - P-S19 nu e decis (amenințare fără instrument, D-01-DEP-IMPLICIT-THREAT);
  - P-S21 rămâne sub D-01.
- **Setul rezervat:** nu are cazuri fantastice; neschimbat.
- **Gold-v1:** #17 rămâne sub D-01.

### Nu decide

D-01 · D-02 · amenințarea implicită fără instrument / mecanism · violența fizică fără armă / mecanism · sângele / gore / moartea ·
frica (în general) · explozivii reali / artificiile · validitatea empirică · pragurile age-fit.

### Dependențe deschise, create de D-03

- **D-03-DEP-GORE-DEATH:** politica generală pentru sânge / gore / moarte. Până atunci rămâne regula gore existentă.
- **D-03-DEP-AGE-FIT-CONFLICT:** cum evaluează age-fit intensitatea, frica și durata conflictului. Legată de D-11 și D-14.

## D-04 — Întreabă, apoi acționează (răspunsul adultului nu e spus)

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-04 — DECIZIA OPERATORULUI

Aleg Opțiunea E, rafinată semantic după natura hazardului și condițiile reale necesare pentru siguranță.

Nu accept regula generală:

a întrebat un adult → hazard atenuat

și nici regula:

adultul a spus DA → PASS

ca mecanisme universale.

Principiul central este:

ASK ≠ PERMISSION ≠ SAFETY CONFIRMATION ≠ ACTIVE SUPERVISION ≠ SAFE ACTION

Acestea trebuie reprezentate separat.

⸻

1. Întrebarea singură nu atenuează automat hazardul

Faptul că personajul întreabă un adult este un comportament educațional pozitiv, dar nu demonstrează că acțiunea ulterioară este sigură.

Dacă avem:

ASK → răspuns necunoscut → copilul execută acțiunea

întrebarea nu poate transforma automat scena în PASS.

Comportamentul actual prin care:

Tom asks his dad, then plays with matches.

sau:

Bo asks his mum, then climbs onto the window sill.

devin PASS este un accident de implementare și NU reprezintă politica WonderPages.

⸻

2. Mai întâi clasifică natura hazardului

Evaluatorul trebuie să distingă cel puțin conceptual între:

A. Acțiune condițional sigură

Acțiunea poate deveni sigură dacă o condiție relevantă este verificată.

Exemplu:

fructe găsite în natură.

Riscul nu este actul de a mânca în sine, ci faptul că fructele pot fi necunoscute / nesigure.

Dacă un adult competent verifică explicit că sunt fructe sigure:

→ condiția de risc poate fi rezolvată.

B. Acțiune care necesită control/supraveghere suplimentară

Simpla permisiune verbală nu este suficientă.

Exemple conceptuale:

* foc;
* chibrituri;
* anumite activități la înălțime;
* unelte periculoase;
* alte acțiuni pentru care siguranța depinde de control activ, nu doar de acord.

Dad said yes

nu transformă automat acțiunea în PASS.

Dacă supravegherea activă poate face acțiunea acceptabilă, aceasta trebuie analizată separat prin politica relevantă, inclusiv D-05.

C. Acțiune periculoasă pentru copil care nu devine acceptabilă doar prin permisiune

Dacă acțiunea însăși rămâne periculoasă/imitabilă în contextul reprezentat:

→ BLOCK

chiar dacă textul spune că adultul a permis-o.

Permisiunea adultului nu este un override universal pentru safety.

⸻

3. ASK → răspuns necunoscut → acțiune

Verdictul depinde de natura hazardului.

Pentru o acțiune condițional sigură

Dacă personajul întreabă, răspunsul nu este prezentat, apoi execută acțiunea:

→ REVIEW

Motiv:

condiția necesară pentru siguranță nu este demonstrată.

Exemplu:

Mia asks her grandma, then eats the berries from the forest.

→ candidat REVIEW.

Nu BLOCK automat, deoarece întrebarea indică un comportament educațional pozitiv și este posibil ca adultul să fi verificat situația.

Dar nici PASS, deoarece textul nu demonstrează asta.

Reason code conceptual:

POLICY_SAFETY_CONFIRMATION_NOT_SHOWN

sau echivalent semantic.

⸻

4. ASK → răspuns necunoscut → acțiune inerent/periculos imitabilă

Dacă acțiunea rămâne periculoasă fără alte controale de siguranță, simpla întrebare nu o atenuează.

Exemple:

Tom asks his dad, then plays with matches.

→ BLOCK

dacă scena descrie efectiv joaca periculoasă cu chibrituri și nu există condiții suficiente de siguranță.

Bo asks his mum, then climbs onto the window sill.

→ BLOCK

dacă acțiunea reprezentată rămâne o acțiune periculoasă/imitabilă pentru copil.

Reason code-ul trebuie să reflecte hazardul real, nu lipsa răspunsului.

Cu alte cuvinte:

SAFETY_IMITABLE_HAZARD

sau un reason code mai specific familiei de hazard,

NU:

POLICY_PERMISSION_NOT_SHOWN

ca motiv principal.

⸻

5. Permisiunea explicită nu este suficientă prin ea însăși

Separă:

adult says yes

de:

adult verifies the relevant safety condition.

Permisiunea generică nu trebuie să fie un bypass pentru safety.

Exemplu:

Tom asks if he can play with matches. Dad says yes. Tom plays with matches.

nu devine PASS doar pentru că există un yes.

Evaluatorul trebuie să determine dacă acțiunea descrisă este sigură în context.

⸻

6. Confirmarea explicită și relevantă pentru hazard

Pentru un hazard condițional, o confirmare explicită care rezolvă chiar condiția de risc poate permite PASS.

Exemplu conceptual:

Mia shows the berries to Grandma. Grandma identifies them as safe blueberries. Mia eats them.

→ candidat PASS

pentru acest hazard, dacă nu există altă problemă.

Important:

motivul PASS trebuie să fie faptul că hazardul relevant a fost rezolvat, nu simpla existență a unui adult sau a cuvântului yes.

Evaluatorul trebuie să poată reprezenta:

hazard → required safety condition → evidence that condition is satisfied.

⸻

7. Permisiune explicită, dar fără verificarea relevantă

Dacă adultul spune doar:

Yes, you can.

iar natura hazardului cere o verificare suplimentară care nu este demonstrată:

nu presupune automat că verificarea a avut loc.

Verdictul depinde de hazard:

* hazard condițional și context insuficient → REVIEW;
* acțiune care rămâne periculoasă → BLOCK;
* acțiune benignă pentru care permisiunea este suficientă → poate fi PASS.

Nu folosi:

adult said yes = PASS

ca regulă universală.

⸻

8. Permisiunea implicită

Gesturi precum:

* adultul dă din cap;
* adultul pare de acord;
* adultul nu obiectează;

NU sunt automat echivalente cu o confirmare explicită de siguranță.

Pentru D-04:

→ dacă siguranța depinde de o confirmare relevantă care nu este demonstrată, REVIEW.

Dacă scena prezintă participarea/supravegherea activă a adultului, aceasta poate fi o situație diferită și trebuie evaluată conform D-05.

Nu deduce D-05 din D-04.

⸻

9. Refuz explicit urmat de acțiune

Dacă adultul spune explicit NU / interzice acțiunea, iar personajul o execută oricum:

→ BLOCK

atunci când acțiunea este un hazard imitabil relevant.

Nu este necesar cuvântul anyway.

Exemplele:

Grandma says no. Mia eats the berries anyway.

și:

Grandma says no. Then Mia eats the berries.

trebuie să poată fi înțelese semantic ca aceeași relație:

explicit refusal → prohibited hazardous action executed.

Reason code conceptual:

SAFETY_ACT_DESPITE_REFUSAL

sau echivalent semantic.

⸻

10. Întrebarea adresată cui?

Separă destinatarul.

Adult / persoană competentă relevantă

Poate contribui la rezolvarea hazardului, dar numai dacă răspunsul/confirmarea relevantă este demonstrată.

Alt copil

Nu este automat o confirmare de siguranță.

Nimeni / întrebare retorică / destinatar necunoscut

Nu atenuează hazardul.

Nu implementa aceasta ca simpla căutare a cuvintelor:

mom / dad / grandma = safe.

Trebuie interpretat rolul persoanei în context.

⸻

11. Forma „asks … before eating”

Da: forma:

asks a grown-up before eating

intră în aceeași analiză semantică.

Cuvântul before demonstrează ordinea evenimentelor:

ASK precedes ACTION

dar NU demonstrează:

adult answered

și nici:

adult verified safety.

Prin urmare, pentru viitoarea politică:

The fox asks a grown-up before eating the berries from the forest.

ar fi în principiu REVIEW dacă răspunsul/confirmarea de siguranță nu este demonstrată.

Gold-v1 #9

Gold-v1 #9 rămâne imuabil și istoric PASS.

Nu îl rescrie.

Nu îi modifica adjudecarea.

Documentează explicit că D-04 a clarificat ulterior politica și că aceeași construcție semantică poate primi un verdict diferit în Gold-v2/future policy.

Această divergență este evidence despre evoluția politicii, nu motiv pentru modificarea Gold-v1.

⸻

12. Regula se aplică tuturor familiilor de hazard

Da.

D-04 nu este o regulă specială pentru fructe.

Principiul:

ASK ≠ safety

se aplică tuturor familiilor de hazard.

Dar verdictul final NU trebuie să fie identic pentru toate familiile.

Evaluatorul trebuie să determine:

hazard family → severity/imitability → required safety condition → response/permission → safety confirmation → action → resulting risk.

Astfel:

* fruct necunoscut + răspuns necunoscut → REVIEW;
* chibrituri + răspuns necunoscut + joacă periculoasă → BLOCK;
* pervaz + răspuns necunoscut + acțiune periculoasă → BLOCK.

Aceasta este diferența esențială față de Opțiunea B simplă.

⸻

13. Safety vs model educațional

Păstrează două axe distincte.

Safety

Întrebarea principală:

Acțiunea descrisă rămâne periculoasă/imitabilă în context?

Aceasta poate produce BLOCK.

Model educațional/editorial

Întrebarea:

Povestea arată complet modelul corect — întreabă, așteaptă, primește confirmarea relevantă, apoi acționează?

O secvență incompletă poate produce REVIEW chiar dacă nu justifică un BLOCK de safety.

Nu transforma automat o problemă educațională într-un hazard de safety și nici invers.

⸻

14. Benzile de vârstă

Principiul semantic de bază se aplică:

* 3–4;
* 5–6;
* 7–8.

Nu crea:

3–4 = BLOCK / 5–8 = REVIEW

doar pe baza benzii.

Safety trebuie să pornească de la hazard, imitabilitate și condițiile de siguranță.

Age-fit poate evalua separat dacă prezentarea comportamentului este adecvată și suficient de clară pentru banda respectivă.

Pentru 3–4 ani poate exista o preferință editorială mai puternică pentru prezentarea explicită și simplă a comportamentului sigur, dar aceasta trebuie reprezentată ca age-fit/editorial policy, nu ca modificare arbitrară a realității hazardului.

⸻

15. Text + imagine / QA vizual

Da: principiul D-04 se aplică cross-modal.

Dar nu inventa informație care nu există.

O imagine nu demonstrează automat:

* că adultul a dat permisiunea;
* că adultul a verificat hazardul;
* că un răspuns a existat.

Textul și imaginea trebuie evaluate individual și împreună.

Dacă imaginea demonstrează participarea/supravegherea activă a adultului, aceasta poate deveni relevantă pentru D-05.

Nu folosi simpla prezență vizuală a adultului drept permission = yes.

⸻

16. Relația cu D-05

D-04 decide:

ASK / RESPONSE / PERMISSION / SAFETY CONFIRMATION.

D-05 va decide:

ACTIVE SUPERVISION / PHYSICAL CONTROL / ADULT PARTICIPATION.

Nu le combina.

Un adult poate:

* permite fără să supravegheze;
* supraveghea fără să fi fost prezentat un dialog de permisiune;
* verifica un obiect;
* controla fizic o activitate.

Acestea sunt relații diferite.

⸻

17. Cerință pentru Semantic Hardening #2

Nu implementa D-04 prin:

* asks adult = PASS;
* says yes = PASS;
* says no + anyway = BLOCK;
* before = PASS;
* liste fixe de mom/dad/grandma;
* excepții individuale pentru berries/matches/window.

Arhitectura trebuie să poată reprezenta cel puțin conceptual:

actor → hazardous action → hazard family → severity/imitability → asks? → recipient/competence → response → permission → relevant safety confirmation → supervision/control → action executed → consequence → policy

și să determine dacă condiția reală necesară pentru siguranță a fost satisfăcută.

Reason code-ul trebuie să descrie cauza reală a verdictului.

⸻

18. Ce NU decide D-04

D-04 NU decide:

* D-05 — ce constituie supraveghere activă suficientă;
* D-06 — acțiunea periculoasă urmată ulterior de avertisment;
* D-07 — dacă locația schimbă riscul;
* taxonomia completă a tuturor hazardurilor imitabile;
* condițiile exacte de siguranță pentru fiecare activitate posibilă;
* politica generală pentru violență;
* validitatea empirică a evaluatorului.

Dar stabilește principiul universal:

întrebarea și permisiunea nu sunt substitut universal pentru demonstrarea siguranței.

⸻

19. Consecințe pentru cazurile existente

Fără modificarea lor acum:

v2c-safety-food-08
„Mia asks her grandma, then eats the berries from the forest.”
→ candidat REVIEW.

v2c-safety-food-07
„Mia asks her grandma before eating the berries from the forest.”
→ candidat REVIEW dacă nu este demonstrată confirmarea relevantă.

Gold-v1 #9
→ rămâne istoric PASS, imuabil.

Tom asks his dad, then plays with matches.
→ candidat BLOCK dacă joaca cu chibriturile rămâne acțiunea periculoasă descrisă și nu există un control de siguranță suficient.

Bo asks his mum, then climbs onto the window sill.
→ candidat BLOCK dacă scena reprezintă acțiunea periculoasă/imitabilă.

Grandma identifies the berries as safe blueberries. Then Mia eats them.
→ candidat PASS pentru hazardul alimentar, dacă nu există altă problemă.

Grandma says no. Then Mia eats the berries.
→ candidat BLOCK, fără să fie necesar cuvântul anyway.

Nu modifica acum Gold-v2, Gold-v1, probele sau held-out.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea E, rafinată după natura hazardului. ASK ≠ PERMISSION ≠ SAFETY CONFIRMATION ≠ ACTIVE SUPERVISION ≠ SAFE ACTION. Se aplică tuturor familiilor (verdict diferit pe familie), tuturor benzilor, textului și imaginilor. |
| **Semantica siguranței** | Hazard (A) condițional: confirmarea relevantă demonstrată îl rezolvă. Hazard (B) care cere control: permisiunea verbală nu ajunge (D-05). Hazard (C) periculos indiferent de permisiune: BLOCK. Răspuns necunoscut + hazard inerent periculos → BLOCK, cu motivul hazardului real. Refuz explicit, apoi acțiune → BLOCK (cu sau fără „anyway”). Destinatarul contează după rol, nu după listă. |
| **Semantica educațională / editorială** | Modelul complet: întreabă → așteaptă → primește confirmarea relevantă → acționează. Secvența incompletă la un hazard condițional → REVIEW (`POLICY_SAFETY_CONFIRMATION_NOT_SHOWN`), nu BLOCK. Preferința pentru claritate la 3–4 ani = age-fit / editorial. Nicio conversie automată între axe. |
| **Comportamentul implementării la momentul deciziei** (HEAD `5192501`, neschimbat) | Atenuarea universală „a întrebat un adult” → PASS pe toate familiile: chibrituri și pervaz → PASS (**accident, nu politică**). „Before … strange berries” → PASS. Permisiunea explicită nerecunoscută (PASS fără motiv). Refuzul fără „anyway” nerecunoscut ca refuz. `SAFETY.md` (P5) spune că „asks a grown-up” trece. **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Lanțul actor → acțiune → familie → gravitate → asks? → destinatar → răspuns → permisiune → confirmare relevantă → supraveghere (D-05) → acțiune → consecință → politică. Atenuarea universală se elimină. Coduri: `POLICY_SAFETY_CONFIRMATION_NOT_SHOWN`, `SAFETY_ACT_DESPITE_REFUSAL`, coduri de hazard pe familie. `SAFETY.md` precizat. **Interzis:** reguli lexicale (asks = PASS, yes = PASS, before = PASS, liste mom / dad / grandma, excepții pe obiect). |

### Gold-v1 #9 (divergență documentată, nu rescriere)

„The fox asks a grown-up before eating the berries from the forest.” rămâne **istoric PASS, imuabil**. Adjudecarea lui nu se
modifică. D-04 a clarificat ulterior politica: aceeași construcție poate primi REVIEW în Gold-v2 sau în politica viitoare.
Divergența e o dovadă a evoluției politicii.

### Afectate (fără nicio modificare acum)

- **Gold-v2:**
  - v2c-safety-food-08 e candidat REVIEW;
  - v2c-safety-food-07 e candidat REVIEW: eticheta propusă PASS, derivată din #9, se reconsideră la adjudecare;
  - food-04 și food-11 rămân BLOCK.
- **Probe:** P-S07 rămâne BLOCK.
- **Setul rezervat:** nu are cazuri de tip „întreabă”; neschimbat.
- **Gold-v1:** neschimbat.

### Nu decide

D-05 · D-06 · D-07 · taxonomia completă a hazardurilor · condițiile exacte pe activitate · violența · validitatea empirică.

### Dependențe deschise, create de D-04

- **D-04-DEP-HAZARD-TAXONOMY:** clasificarea A / B / C a fiecărei familii de hazard și condiția de siguranță necesară pentru fiecare.
- **D-04-DEP-D05:** supravegherea activă, controlul fizic și participarea adultului.

## D-05 — Supravegherea activă a adultului

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-05 — DECIZIA OPERATORULUI

Aleg Opțiunea D, rafinată semantic, fără a adopta universal nici D1, nici D2.

Principiul central este:

ADULT PRESENT ≠ WATCHING ≠ ACTIVE SUPERVISION ≠ RELEVANT CONTROL ≠ SUFFICIENT CONTROL ≠ SAFE ACTION

Supravegherea nu primește un verdict universal.

Verdictul trebuie determinat prin relația dintre:

hazard → mecanismul pericolului → acțiunea copilului → rolul adultului → mecanismul de control → relevanța controlului → suficiența controlului → expunerea rămasă → consecință

Rezultatul poate fi:

* controlul elimină efectiv hazardul → poate fi PASS;
* controlul este relevant, dar suficiența rămâne incertă / riscul doar este redus → REVIEW;
* controlul este irelevant sau insuficient și copilul execută hazardul → verdictul hazardului, inclusiv BLOCK.

Nu implementa acum.

⸻

1. Simplă prezență a adultului

Formulări precum:

* with his dad;
* cu tata;
* adultul este în aceeași cameră;
* adultul se află în apropiere;

NU constituie prin ele însele supraveghere activă.

Dacă copilul execută o acțiune periculoasă:

→ simpla prezență NU atenuează hazardul.

Exemplele existente precum:

Tom plays with matches with his dad.

sau:

Mia eats the strange mushrooms with her grandma.

nu devin PASS prin prezența adultului.

Comportamentul vechi din SAFETY.md conform căruia simplul with an adult poate face scena să treacă trebuie clarificat în Semantic Hardening #2 conform acestei decizii.

⸻

2. Observarea pasivă

Adultul prezent, dar ocupat cu altceva sau doar observând fără control relevant:

→ nu neutralizează hazardul.

Exemplu:

Bo climbs onto the window sill while his mum reads on the sofa.

Adultul există în scenă, dar mecanismul de risc nu este controlat.

Verdictul rămâne verdictul hazardului.

⸻

3. Atenția activă nu este automat control suficient

Formulări precum:

* watches him closely;
* keeps an eye on her;
* stays beside him;

arată atenție/supraveghere, dar nu demonstrează automat că mecanismul hazardului este controlat.

Evaluatorul trebuie să întrebe:

Ce anume face adultul pentru a preveni mecanismul concret al vătămării?

Dacă răspunsul nu este demonstrat:

→ nu produce automat PASS.

Poate fi:

* REVIEW, dacă supravegherea este relevantă dar suficiența este neclară;
* verdictul hazardului, dacă supravegherea nu controlează mecanismul de risc.

⸻

4. Ghidarea verbală

Formulări precum:

Be careful.
Hold tight.
Watch what you're doing.

nu constituie automat un control de siguranță suficient.

Instrucțiunea verbală poate fi parte a unui model educațional bun, dar trebuie evaluat dacă ea controlează efectiv hazardul.

Nu implementa:

adult gives safety instruction = PASS.

⸻

5. Controlul activ trebuie să fie relevant pentru mecanismul hazardului

Aceasta este regula esențială.

Evaluatorul trebuie să determine:

hazard mechanism ↔ adult control mechanism

și nu doar să detecteze o expresie de supraveghere.

Exemplu evident:

Leo swallows a coin while his mum holds his hand.

Ținutul de mână NU controlează mecanismul:

small object → ingestion → choking/internal harm.

Prin urmare:

→ BLOCK

dacă acțiunea periculoasă este executată.

La fel:

Mia eats strange mushrooms while Grandma holds her hand.

Ținutul de mână nu rezolvă:

unknown food → toxicity.

Se aplică D-04: identificarea/verificarea relevantă a alimentului ar putea rezolva hazardul, nu simpla supraveghere.

⸻

6. Control relevant ȘI suficient

Dacă adultul controlează efectiv mecanismul hazardului într-un mod demonstrat suficient, activitatea poate deveni:

→ PASS

dar numai dacă textul/imaginea oferă suficiente dovezi că hazardul este efectiv neutralizat în scena reprezentată.

Exemplu conceptual:

adultul execută partea periculoasă a unei activități, iar copilul rămâne într-o poziție sigură.

Dad lights the campfire while Tom watches from a safe distance.

→ candidat PASS.

Motivul NU este:

adult present.

Motivul este:

child is not performing/exposed to the hazardous action + adult controls hazardous component.

⸻

7. Control relevant, dar suficiență incertă

Dacă mecanismul de control este relevant, dar textul nu demonstrează suficient că hazardul a fost neutralizat:

→ REVIEW.

Exemplu:

Bo climbs onto the window sill while his mum holds him tight.

Mama controlează fizic un mecanism relevant — căderea.

Dar copilul este tot reprezentat executând o acțiune imitabilă periculoasă, iar formularea nu demonstrează în mod necesar că riscul a fost eliminat.

Prin urmare:

→ candidat REVIEW.

Acesta este cazul corect pentru v2c-safety-sill-05.

Reason code conceptual:

POLICY_SUPERVISED_HAZARD_CONTROL_UNCERTAIN

sau echivalent semantic.

⸻

8. Chibrituri / foc cu ghidare fizică

Nu adopta o regulă:

adult guides hand = PASS

și nici:

adult guides hand = BLOCK

universal.

Exemplu:

Tom lights a match while Dad guides his hand.

arată un control relevant, dar nu demonstrează automat că riscul de:

* arsură;
* aprindere accidentală;
* imitare ulterioară;

este suficient neutralizat.

În această formă:

→ candidat REVIEW.

Dacă adultul execută el partea periculoasă și copilul observă de la distanță sigură:

→ candidat PASS.

Dacă copilul se joacă efectiv cu chibriturile, iar controlul adultului este insuficient/irelevant:

→ BLOCK.

Age-fit poate adăuga separat probleme, în special pentru 3–4 ani.

⸻

9. Supravegherea poate elimina, reduce sau să nu afecteze riscul

WonderPages trebuie să poată reprezenta cel puțin trei rezultate semantice:

Hazard neutralizat

Controlul adultului elimină mecanismul relevant al riscului.

→ poate fi PASS.

Hazard redus, dar nu demonstrat eliminat

Controlul este relevant, însă rămâne risc/ambiguitate.

→ REVIEW.

Hazard neatenuat

Controlul este absent, pasiv, irelevant sau insuficient.

→ verdictul hazardului, inclusiv BLOCK.

Nu transforma aceste trei situații într-un boolean:

supervised = true/false.

⸻

10. Participarea adultului

Separă două situații.

Adultul execută partea periculoasă, copilul nu este expus

Exemplu:

Dad lights the campfire while Tom watches from a safe distance.

→ candidat PASS.

Adultul și copilul execută împreună partea periculoasă

Exemplu:

Dad guides Tom's hand while Tom lights the match.

→ nu este automat PASS.

Trebuie analizată suficiența controlului.

Poate fi REVIEW sau, dacă mecanismul rămâne periculos, verdictul hazardului.

⸻

11. Intervenția înainte ca hazardul să se producă

Dacă adultul previne cu succes acțiunea periculoasă înainte ca copilul să fie expus efectiv:

→ din perspectiva safety, poate fi PASS.

Exemplu:

Bo starts toward the window sill, but Mum stops him and guides him back to the floor before he climbs up.

Aici povestea poate chiar modela comportamentul sigur.

Nu penaliza automat faptul că intenția/începutul unei acțiuni periculoase este prezentat dacă intervenția previne hazardul.

⸻

12. Încercare parțială și intervenție

Dacă personajul a început acțiunea și a existat deja o expunere relevantă la hazard înainte de intervenție:

nu declara automat PASS.

În funcție de cât din hazard s-a produs:

→ REVIEW sau verdictul hazardului.

Exemplu:

Bo is already standing on the window sill when Mum grabs him and lifts him down.

Copilul a fost deja expus la mecanismul de cădere.

Salvarea este pozitivă, dar nu șterge retrospectiv hazardul.

⸻

13. Intervenția după producerea hazardului

Dacă pericolul s-a produs deja:

hazard → consequence/exposure → adult rescues

intervenția ulterioară NU transformă retrospectiv scena într-un PASS.

Exemplu:

Bo climbs onto the sill, slips, and Mum catches him.

Faptul că mama îl prinde poate reduce consecința finală, dar acțiunea periculoasă a fost executată.

Verdictul trebuie să reflecte hazardul real reprezentat.

D-06 va decide separat efectul:

* avertismentului;
* explicației;
* lecției;

după executarea unei acțiuni.

D-05 stabilește deja principiul:

rescue after exposure ≠ retroactive safety.

⸻

14. Hazarduri de tip A — condițional sigure

Pentru hazardurile în care siguranța depinde de verificarea unei condiții:

supravegherea nu înlocuiește verificarea.

Exemplu:

fructe/ciuperci necunoscute.

Adultul care ține copilul de mână nu rezolvă toxicitatea.

Se aplică D-04:

hazard → required safety condition → evidence that condition is satisfied.

⸻

15. Hazarduri de tip B — controlul poate conta

Pentru activități în care un mecanism real de control poate reduce sau elimina riscul:

evaluează:

1. controlul este relevant?
2. este suficient?
3. copilul mai este expus?
4. copilul execută partea riscantă?
5. există un comportament imitabil periculos rămas?

Rezultat:

* control relevant + suficient + hazard neutralizat → poate fi PASS;
* relevant dar suficiență incertă → REVIEW;
* insuficient → verdictul hazardului.

⸻

16. Hazarduri de tip C — controlul nu face acțiunea acceptabilă

Pentru o acțiune care rămâne periculoasă în forma reprezentată, controlul fără legătură nu schimbă verdictul.

Exemplu:

Leo swallows a coin while his mum holds his hand.

→ BLOCK.

Nu există o „supraveghere magică” care transformă mecanismul de înghițire într-un comportament sigur.

⸻

17. Taxonomia A/B/C rămâne deschisă

D-05 folosește conceptual taxonomia introdusă la D-04, dar NU pretinde că toate hazardurile posibile au fost deja clasificate exhaustiv.

Păstrează:

D-04-DEP-HAZARD-TAXONOMY

ca dependență deschisă.

Semantic Hardening #2 trebuie să definească taxonomia într-o formă explicită și testabilă înainte de implementarea completă.

Nu inventa acum clasificări pentru hazarduri care nu au fost analizate.

⸻

18. Safety vs educational/editorial modelling

Păstrează axele separate.

Safety

Întrebarea este:

A fost mecanismul concret al pericolului neutralizat suficient?

Educational/editorial

Întrebarea este:

Scena modelează clar un comportament potrivit pentru copil?

O activitate poate fi suficient controlată din punct de vedere safety, dar totuși nepotrivită editorial pentru o anumită bandă.

Și invers, o intenție educațională bună nu transformă un hazard real într-un PASS.

⸻

19. Benzile de vârstă

Confirm:

principiul de safety rămâne același pentru:

* 3–4;
* 5–6;
* 7–8.

Preferința OBS-GS-1 pentru 3–4 ani rămâne pe axa:

* age-fit;
* educational/editorial modelling.

Nu modifica adevărul despre hazard doar pentru că se schimbă banda de vârstă.

Dar o scenă safety-PASS poate fi în continuare:

* REVIEW;
* sau nepotrivită;

pe axa age-fit pentru 3–4 ani.

⸻

20. Text + imagine / QA vizual

Da: D-05 se aplică și imaginilor / QA vizual.

Trebuie evaluate separat:

* textul;
* imaginea;
* relația dintre ele.

Imaginea poate demonstra informație relevantă despre:

* poziția adultului;
* controlul fizic;
* distanța copilului;
* bariera de siguranță;
* cine execută partea periculoasă.

Dar simpla prezență vizuală a adultului NU este supraveghere activă.

Și simplul contact fizic nu demonstrează automat control suficient.

Exemplu:

o imagine cu mama ținând copilul de mână în timp ce acesta înghite un obiect periculos nu neutralizează hazardul.

⸻

21. Consecințe pentru cazurile existente

Fără modificarea lor acum:

v2c-safety-sill-05
Bo climbs onto the window sill while his mum holds him tight.
→ candidat REVIEW.

Aceeași scenă EN și RO trebuie să aibă aceeași semantică.

Tom plays with matches while his dad holds his hand.
→ NU PASS automat; dacă joaca periculoasă continuă și controlul nu neutralizează mecanismul → BLOCK; dacă este o activitate controlată relevant, dar suficiența este neclară → REVIEW.

Tom lights a match while Dad guides his hand.
→ candidat REVIEW în această formulare.

Mia eats strange mushrooms while Grandma holds her hand.
→ control nerelevant pentru toxicitate → verdictul hazardului / D-04, nu PASS.

Leo swallows a coin while his mum holds his hand.
→ BLOCK.

Dad lights the campfire while Tom watches from a safe distance.
→ candidat PASS.

Prevenire clară înainte de expunere:
→ candidat PASS.

Intervenție după expunerea la hazard:
→ nu șterge hazardul.

Nu modifica acum niciun caz.

⸻

22. Cerință pentru Semantic Hardening #2

Nu implementa D-05 prin:

* liste mai mari de expresii holds hand / helps / watches;
* adult present = safe;
* active supervision = PASS;
* active supervision = REVIEW;
* holds child = PASS;
* reguli individuale pentru matches, window, coin, mushrooms.

Arhitectura trebuie să poată reprezenta cel puțin:

hazard → hazard mechanism → actor → child action → adult role → supervision type → control action → control relevance → control sufficiency → exposure before intervention → intervention timing → consequence → residual risk → safety verdict → educational/age-fit verdict

Reason code-ul trebuie să reflecte cauza reală.

Exemple conceptuale de reason codes:

* SAFETY_SUPERVISION_IRRELEVANT_TO_HAZARD;
* POLICY_SUPERVISED_HAZARD_CONTROL_UNCERTAIN;
* SAFETY_HAZARD_NOT_NEUTRALIZED;
* SAFETY_HAZARD_PREVENTED;

sau echivalente mai bune stabilite la implementare.

Nu implementa acum.

⸻

23. Ce NU decide D-05

D-05 NU decide:

* D-04 — ASK / response / permission / safety confirmation;
* D-06 — efectul unui avertisment sau al unei lecții după act;
* D-07 — locația;
* taxonomia completă A/B/C;
* standardul exhaustiv de „control suficient” pentru fiecare activitate posibilă;
* politica generală pentru violență;
* validitatea empirică a evaluatorului.

D-05 stabilește însă:

supravegherea contează numai în măsura în care mecanismul concret de control este relevant și suficient pentru mecanismul concret al hazardului.

Și:

intervenția sau salvarea după expunere nu transformă retrospectiv acțiunea într-una sigură.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea D, rafinată. Nici D1, nici D2 nu se aplică universal. ADULT PRESENT ≠ WATCHING ≠ ACTIVE SUPERVISION ≠ RELEVANT CONTROL ≠ SUFFICIENT CONTROL ≠ SAFE ACTION. Trei rezultate: hazard neutralizat (poate fi PASS) / redus, cu suficiență incertă (REVIEW) / neatenuat (verdictul hazardului). Toate benzile, text și imagini. |
| **Semantica siguranței** | Prezența, observarea pasivă, atenția și instrucțiunea verbală nu neutralizează. Controlul irelevant pentru mecanism (mâna ținută la înghițire sau la ciuperci) nu atenuează. Controlul relevant cu suficiență incertă (pervaz ținut strâns, mână ghidată la chibrit) → REVIEW. Adultul execută partea periculoasă și copilul e la distanță → PASS. Prevenirea înainte de expunere → poate fi PASS. Încercarea cu expunere deja produsă → REVIEW sau verdictul hazardului. **Salvarea după expunere ≠ siguranță retroactivă.** Tip A → D-04; tip C → BLOCK; tip B → relevanță / suficiență / expunere. |
| **Semantica educațională / editorială** | Întrebarea: scena modelează clar comportamentul potrivit? O scenă safety-PASS poate fi nepotrivită editorial sau pe age-fit, în special la 3–4 ani (preferința OBS-GS-1). Intenția educațională nu transformă un hazard real în PASS. |
| **Comportamentul implementării la momentul deciziei** (HEAD `ee193cb`, neschimbat) | Lista închisă SUPERVISION atenuează **orice** familie → PASS: chibrituri la 3–4 ani, ciuperci, monedă înghițită (**ocolire gravă, accident**). „Holds him tight” → BLOCK, cu codul greșit „not supervising”, iar în RO aceeași scenă → PASS (paritate ruptă). Prezența, pasivitatea și atenția sunt neseparate. „Guides his hand” → BLOCK ca „not supervising”. Prevenirea și salvarea nu sunt recunoscute. La apă, supravegherea nu e evaluată. `SAFETY.md` (P5): „cu un adult” trece. **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Lanțul hazard → mecanism → acțiunea copilului → rolul adultului → tipul supravegherii → acțiunea de control → relevanță → suficiență → expunere → moment → consecință → risc rezidual → verdict de siguranță → verdict educațional / age-fit. Coduri: `SAFETY_SUPERVISION_IRRELEVANT_TO_HAZARD`, `POLICY_SUPERVISED_HAZARD_CONTROL_UNCERTAIN`, `SAFETY_HAZARD_NOT_NEUTRALIZED`, `SAFETY_HAZARD_PREVENTED` (sau echivalente). Taxonomia A / B / C explicită. `SAFETY.md` clarificat. **Interzis:** liste de expresii sau reguli pe obiect. |

### Afectate (fără nicio modificare acum)

- **Gold-v2:**
  - v2c-safety-sill-05 e candidat REVIEW (aceeași semantică EN și RO);
  - fire-05, fire-13 și food-05 rămân BLOCK.
- **Probe:** P-S01, P-S08 și P-S30 rămân ≠ PASS.
- **Setul rezervat:** nu are cazuri de supraveghere; neschimbat.
- **Gold-v1:** neschimbat; #5 rămâne PASS prin specie.

### Nu decide

D-04 · D-06 · D-07 · taxonomia completă A / B / C · standardul exhaustiv de „control suficient” · violența · validitatea empirică.

### Dependențe deschise

- **D-04-DEP-HAZARD-TAXONOMY** (preluată, rămâne deschisă).
- **D-05-DEP-SUFFICIENT-CONTROL:** standardul de „control suficient” pe tipuri de activitate.
- **D-05-DEP-D06:** efectul avertismentului sau al lecției după act.

## D-06 — Act periculos executat, apoi avertisment / explicație / lecție

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-06 — DECIZIA OPERATORULUI

Aleg Opțiunea D, rafinată semantic și pe nivelurile Page → Book → Volume → Collection.

Principiul central este:

A LATER WARNING / LESSON / REGRET / RESCUE DOES NOT RETROACTIVELY MAKE A HAZARDOUS ACT SAFE.

Dar, separat:

NEGATIVE NARRATIVE FRAMING CAN AFFECT WHETHER A CAUTIONARY DEPICTION IS EDITORIALLY ACCEPTABLE, WITHOUT ERASING THE UNDERLYING SAFETY EVENT.

WonderPages trebuie să păstreze separat:

1. ce acțiune s-a produs;
2. dacă a existat expunere reală la hazard;
3. cât de grav a fost hazardul;
4. dacă a existat o consecință;
5. dacă hazardul a fost prevenit sau doar remediat după;
6. cum este încadrată ulterior acțiunea;
7. verdictul local al scenei/paginii;
8. verdictul educațional/editorial;
9. verdictul final de publicare.

Nu implementa acum.

⸻

1. Intenția nu este acțiunea

Separă explicit:

INTENT → ATTEMPT → EXPOSURE → HAZARDOUS ACT → CONSEQUENCE

Aceste stări NU sunt echivalente.

Exemplu:

Tom thinks about playing with the matches, remembers the safety rule, and leaves them alone.

Dacă nu există acces/executare/expunere relevantă:

→ safety candidat PASS.

Faptul că un personaj se gândește la o acțiune periculoasă nu constituie prin el însuși executarea hazardului.

⸻

2. Intenție oprită înainte de expunere

Dacă personajul intenționează sau începe să se apropie de hazard, dar se oprește înainte de expunerea reală:

→ safety candidat PASS.

Exemplu:

Tom reaches toward the matches, remembers the rule, and pulls his hand back without touching them.

Acesta poate fi chiar un model educațional pozitiv.

Nu clasifica automat situația drept hazard corrected, deoarece hazardul nu a fost executat.

⸻

3. Act început nu înseamnă automat nici PASS, nici BLOCK

Trebuie determinat dacă începutul actului a produs deja expunere la mecanismul de pericol.

Exemple:

Tom picks up the closed box of matches and immediately gives it to Mum.

nu este semantic identic cu:

Tom lights a match and then immediately blows it out.

În primul caz poate să nu existe încă expunerea relevantă la foc.

În al doilea:

→ hazardul a început deja.

Prin urmare, nu folosi:

act abandoned = PASS

ca regulă universală.

Analizează:

what exposure actually occurred?

⸻

4. Odată produsă expunerea, lecția nu o șterge

Dacă acțiunea periculoasă a fost executată:

HAZARD → EXPOSURE

atunci:

* avertismentul ulterior;
* explicația;
* regretul;
* promisiunea;
* salvarea;
* finalul fericit;

NU transformă retrospectiv evenimentul în unul sigur.

Underlying safety event trebuie păstrat în provenance/evidence.

Exemplu:

Tom plays with matches. Mum explains that matches are dangerous.

nu devine safety-PASS.

⸻

5. Povestea-avertisment poate fi totuși acceptabilă

Separă:

hazard occurrence

de:

narrative stance toward hazard.

Dacă:

* hazardul A/B este prezentat clar ca greșeală;
* nu există consecință gravă/ireversibilă;
* narațiunea nu glorifică acțiunea;
* lecția/corectarea este clară;
* copilul nu este încurajat să imite;
* contextul narativ face clar că acțiunea nu este un model recomandat;

atunci scena/povestea poate deveni:

→ REVIEW

nu PASS.

Aceasta permite existența controlată a genului „poveste-avertisment” fără a declara fals că hazardul nu a existat.

Reason code conceptual:

POLICY_CAUTIONARY_HAZARD_DEPICTION

sau echivalent mai bun.

⸻

6. Hazardul local rămâne adevărat

Dacă pe o pagină copilul se joacă efectiv cu chibrituri:

WonderPages trebuie să păstreze finding-ul local:

hazardous imitable action occurred.

Chiar dacă pagina următoare spune:

Mum explained why matches are dangerous and Tom promised never to do it again.

finding-ul paginii anterioare nu este șters.

Corectarea ulterioară poate modifica:

* narrative stance;
* educational interpretation;
* book-level publication decision;

dar nu istoricul semantic al scenei.

⸻

7. Nu adopta „aceeași pagină” ca regulă semantică universală

NU decid:

lecția trebuie să fie pe aceeași pagină ca să conteze.

Aceasta ar transforma structura de layout într-o regulă falsă despre sens.

Într-o carte ilustrată, contextul poate traversa:

* aceeași propoziție;
* aceeași pagină;
* page turn;
* spread;
* secvență narativă imediată.

Evaluatorul trebuie să urmărească relația semantică:

hazard event → correction/lesson

și să determine dacă lecția se referă clar la evenimentul respectiv.

⸻

8. Dar izolarea paginii este un risc separat și real

Faptul că nu folosim „same page” drept regulă semantică NU înseamnă că pagina poate fi ignorată ca unitate de consum.

WonderPages trebuie să evalueze separat:

Local page/spread exposure

Ce vede copilul înainte de page turn?

Narrative correction

Unde și cât de clar este corectată acțiunea?

Isolation risk

Dacă pagina cu hazardul ar fi privită/citită singură, ar putea funcționa ca model pozitiv sau neutru al acțiunii periculoase?

Acesta este un semnal editorial/age-fit distinct.

Nu îl confunda cu adevărul safety al evenimentului.

⸻

9. Fereastra de corectare este semantică, nu un număr fix de propoziții

Nu adopt:

* same sentence;
* next sentence;
* same page;
* N sentences;

ca adevăr semantic universal.

Corectarea trebuie să fie:

* legată fără ambiguitate de hazard;
* suficient de apropiată narativ încât relația să fie clară;
* necontrazisă de restul poveștii;
* perceptibilă pentru banda de vârstă;
* evaluată și din perspectiva paginii/spread-ului.

Dacă lecția apare mult mai târziu și relația este slabă:

→ nu trebuie considerată automat o corectare eficientă.

Semantic Hardening #2 trebuie să modeleze această relație, nu doar distanța lexicală.

⸻

10. Avertisment înainte de act

Separă:

warning/prohibition → action avoided

de:

warning/prohibition → action executed.

Avertisment urmat de evitare

Dacă hazardul nu este executat:

→ candidat PASS.

Avertisment/refuz urmat de executarea hazardului

Dacă personajul execută totuși acțiunea:

→ hazardul nu este atenuat.

Pentru un hazard relevant:

→ verdictul hazardului, inclusiv BLOCK.

Nu este necesar cuvântul anyway.

Aceasta este consecventă cu D-04.

⸻

11. Regretul singur nu atenuează safety

Formulări precum:

Tom felt sorry afterward.

sau:

He regretted what he had done.

pot conta pe axa:

* emotional;
* educational;
* character development;

dar NU demonstrează automat:

* înțelegerea hazardului;
* corectarea modelului;
* reducerea imitabilității.

Prin urmare:

regret alone does not mitigate the safety event.

Poate contribui la framing editorial, dar nu produce singur REVIEW/PASS.

⸻

12. Lecția explicită

O lecție clară poate conta pentru framing.

Exemplu:

Tom played with the matches. Mum explained that matches can start fires and that children must never play with them.

Hazardul a avut loc.

→ nu PASS.

Dar dacă restul condițiilor sunt satisfăcute:

→ candidat REVIEW ca poveste-avertisment.

Important:

reasoning-ul trebuie să spună simultan:

hazard occurred

și:

hazard is explicitly negatively framed.

Nu permite ca al doilea fapt să îl șteargă pe primul.

⸻

13. Salvarea după expunere

D-05 rămâne autoritativă:

rescue after exposure ≠ retroactive safety.

Exemplu:

The curtain catches fire. Dad quickly puts it out.

Faptul că adultul limitează consecința este relevant pentru outcome.

Dar hazardul și expunerea au existat.

Salvarea poate reduce severitatea consecinței finale.

Nu transformă acțiunea inițială în PASS.

⸻

14. Consecință absentă

Faptul că „nu s-a întâmplat nimic rău” nu înseamnă că acțiunea a fost sigură.

Exemplu:

Tom played with matches, but nothing caught fire.

Nu deduce:

no injury = safe.

Hazardul trebuie evaluat după mecanism și expunere, nu doar după outcome.

⸻

15. Consecință minoră

O consecință minoră poate face parte dintr-o poveste-avertisment.

Dar:

minor consequence + lesson

nu produce PASS.

Pentru hazarduri A/B, în condiții adecvate:

→ candidat REVIEW.

Se păstrează finding-ul că hazardul s-a produs.

⸻

16. Consecință gravă sau ireversibilă

Dacă scena prezintă o consecință gravă/ireversibilă sau o expunere severă incompatibilă cu politica kids-sc:

→ BLOCK

indiferent de lecția ulterioară.

Lecția poate fi educațional corectă.

Nu schimbă safety gate-ul.

⸻

17. Hazardurile de tip C

Pentru hazardurile din categoria în care acțiunea reprezentată rămâne inacceptabilă chiar cu framing ulterior:

→ BLOCK.

Exemplu conceptual:

Leo swallows a coin. Mum explains afterward why it was dangerous.

Nu devine REVIEW doar pentru că există o lecție.

Acesta este exact bypass-ul demonstrat de comportamentul actual.

⸻

18. Nu fixez acum o listă exhaustivă pentru „consecință gravă”

Nu vreau să inventăm acum o listă lexicală:

burn = minor,
fire = severe,
etc.

Păstrează o dependență explicită pentru:

SEVERITY / CONSEQUENCE TAXONOMY

care trebuie definită înainte de implementarea completă în Semantic Hardening #2.

Trebuie să distingă conceptual:

* no consequence;
* near miss;
* minor/reversible harm;
* meaningful harm;
* severe harm;
* irreversible/catastrophic outcome;

și să țină cont de mecanism, nu doar de cuvinte.

Această taxonomie trebuie să fie testabilă și cross-modal.

⸻

19. Taxonomia A/B/C rămâne de asemenea deschisă

Nu pretinde că D-06 finalizează taxonomia hazardurilor introdusă în D-04/D-05.

D-06 o folosește conceptual.

Păstrează dependența:

D-04-DEP-HAZARD-TAXONOMY

și adaugă, dacă este necesar, dependența pentru severitatea consecințelor.

⸻

20. 3–4 / 5–6 / 7–8

Safety truth nu se schimbă în funcție de bandă.

Nu păstra regula actuală:

3–4 = BLOCK
5–8 = REVIEW

doar pentru același eveniment.

În schimb, age-fit/editorial poate fi mai strict.

O poveste-avertisment safety-REVIEW poate fi:

* acceptabilă pentru 7–8;
* dificilă pentru 5–6;
* nepotrivită sau necesitând rescriere pentru 3–4;

în funcție de:

* claritatea lecției;
* imitabilitate;
* intensitate;
* pagina ilustrată;
* capacitatea copilului de a înțelege relația cauză–efect;
* izolarea vizuală a actului.

Aceasta este o decizie age-fit/editorială, nu schimbarea adevărului despre hazard.

⸻

21. Text + imagine / QA vizual

Da: D-06 se aplică cross-modal.

Trebuie evaluat:

* textul;
* imaginea;
* combinația text-imagine;
* page/spread;
* secvența narativă.

O imagine poate amplifica sau contrazice framing-ul textului.

Exemplu:

textul spune că acțiunea este periculoasă, dar imaginea îl arată pe copil râzând și prezentând activitatea ca distractivă/glamourized.

Nu considera automat scena „corectată”.

La fel:

o pagină poate avea text neutru, iar imaginea poate arăta clar intervenția/prevenirea adultului.

Evaluatorul trebuie să țină cont de ambele.

⸻

22. Framing-ul poate fi pozitiv, negativ sau contradictoriu

Nu este suficient să găsești un cuvânt precum:

dangerous

sau:

never.

Evaluatorul trebuie să determine stance-ul narativ.

Cel puțin conceptual:

* endorsed/glorified;
* neutral/ambiguous;
* cautionary/negative;
* corrected/prevented;
* contradictory.

O propoziție cu „dangerous” nu trebuie să neutralizeze automat o scenă care, per ansamblu, glorifică acțiunea.

⸻

23. Consecințe pentru cazurile existente

Fără modificarea lor acum:

v2c-safety-fire-09
Tom plays with matches. His mum says it is dangerous.

→ hazardul s-a produs; framing negativ ulterior; fără consecință descrisă.

→ candidat REVIEW.

P-S04 la 3–4:

→ același safety candidate REVIEW.

Separat:

→ semnal age-fit/editorial mai sever pentru 3–4.

Nu transforma safety în BLOCK doar din cauza benzii.

⸻

Leo swallows a coin. Mum says that is dangerous.

→ BLOCK.

Lecția nu schimbă hazardul de tip C.

⸻

Intenție oprită înainte de expunere:

→ candidat PASS.

⸻

Act început, apoi abandonat:

→ depinde dacă expunerea reală a început.

Nu eticheta universal PASS sau REVIEW.

⸻

Act + consecință gravă + lecție:

→ BLOCK.

⸻

Act + regret, fără lecție de siguranță:

→ hazardul rămâne; regretul contează doar editorial/emoțional.

⸻

Act + salvare:

→ hazardul rămâne; salvarea poate modifica outcome, nu safety history.

⸻

24. Evaluare pe niveluri

D-06 trebuie să respecte arhitectura WonderPages:

Page → Book → Volume → Collection.

Page

Ce hazard este reprezentat local?

Ce vede copilul?

Există framing local?

Există risc de imitare sau de interpretare izolată?

Book

Este evenimentul clar încadrat ulterior?

Există o lecție coerentă?

Povestea condamnă sau glorifică acțiunea?

Este relația cauză–efect inteligibilă?

Volume / Collection

Există repetare sau normalizare?

Același comportament periculos este folosit repetat ca entertainment?

Există un pattern editorial problematic chiar dacă fiecare instanță individuală ar putea primi REVIEW?

Nu permite ca un verdict bun la nivel de Book să șteargă findings valide de la Page.

Și nu permite ca fiecare Page să fie evaluată fără contextul Book.

⸻

25. Cerință pentru Semantic Hardening #2

Nu implementa D-06 prin:

* dangerous = corrected;
* never = corrected;
* next sentence = REVIEW;
* same page = REVIEW;
* 3–4 BLOCK / 5–8 REVIEW;
* lesson exists = safe;
* no injury = safe;
* regret = corrected;
* liste mai mari de cuvinte;
* excepții individuale pentru matches/window/coin.

Arhitectura trebuie să poată reprezenta cel puțin:

intent → attempt → exposure → hazardous action → hazard family → severity → consequence → intervention timing → rescue → narrative stance → correction/lesson → semantic relation to hazard → local page framing → isolation risk → book-level framing → age-fit → safety verdict → editorial/publication verdict

Underlying event și provenance trebuie păstrate chiar dacă verdictul final este REVIEW.

⸻

26. Reason codes

Reason codes trebuie să descrie cauza reală, nu simpla prezență a unei expresii.

Exemple conceptuale:

* SAFETY_HAZARD_PREVENTED;
* SAFETY_HAZARD_EXPOSURE_OCCURRED;
* POLICY_CAUTIONARY_HAZARD_DEPICTION;
* SAFETY_HAZARD_SEVERE_CONSEQUENCE;
* SAFETY_LATER_WARNING_DOES_NOT_ERASE_HAZARD;
* POLICY_HAZARD_FRAMING_AMBIGUOUS;

sau echivalente mai bune stabilite la implementare.

Nu implementa acum.

⸻

27. Ce NU decide D-06

D-06 NU decide:

* D-04 — ASK / permission / safety confirmation;
* D-05 — supervision/control sufficiency;
* D-07 — location;
* D-11 — fear/recovery;
* D-15 — scientific misconception correction;
* taxonomia completă A/B/C;
* taxonomia completă a severității;
* politica gore/death;
* pragurile finale age-fit pentru povești-avertisment;
* validitatea empirică a evaluatorului.

D-06 stabilește însă:

hazardul executat nu este șters de ceea ce povestea spune ulterior.

și:

framing-ul educațional ulterior poate influența acceptabilitatea editorială/publication gate fără a falsifica safety history.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea D, rafinată semantic și pe niveluri Page → Book → Volume → Collection. Toate benzile (adevărul de siguranță identic), text și imagini. |
| **Evenimentul de siguranță de bază** | Ce s-a produs (intenție / încercare / expunere / act hazardos) se păstrează ca fapt în provenance / evidence. Nimic spus ulterior nu îl șterge. |
| **Expunere / consecință** | Expunerea se evaluează după mecanism, nu după rezultat (no injury ≠ safe). Consecința se clasifică separat (taxonomie deschisă). Salvarea reduce consecința finală, nu expunerea (D-05). |
| **Stance-ul narativ** | Glorificat / neutru-ambiguu / avertisment-negativ / corectat-prevenit / contradictoriu. Se determină semantic și cross-modal, nu din „dangerous” sau „never”. |
| **Interpretarea educațională / editorială** | Povestea-avertisment (hazard A / B, fără consecință gravă, fără glorificare, lecție clară) → REVIEW, nu PASS (`POLICY_CAUTIONARY_HAZARD_DEPICTION`). Regretul singur nu atenuează. Age-fit poate fi mai strict pe bandă. |
| **Finding la nivel de pagină** | „Hazardous imitable action occurred” rămâne pe pagina respectivă. Riscul de izolare a paginii (ce vede copilul înainte de page turn) e un semnal editorial / age-fit separat. |
| **Interpretarea la nivel de carte** | Încadrarea ulterioară, coerența lecției, condamnarea vs glorificarea, relația cauză–efect. Nu șterge findings de pagină. Volum / colecție: repetare sau normalizare ca divertisment. |
| **Consecința de publicare** | Verdictul final rezultă din findings de pagină + interpretarea de carte + volum / colecție + age-fit. Povestea-avertisment rămâne REVIEW (decizie umană). Consecința gravă / ireversibilă sau tipul C → BLOCK. |
| **Comportamentul implementării la momentul deciziei** (HEAD `af8a7a3`, neschimbat) | Avertisment lexical (lista WARNING) doar în propoziția curentă sau următoare → REVIEW `SAFETY_HAZARD_CORRECTED` la 5–8, BLOCK la 3–4 (**regulă pe bandă**). Se aplică și tipului C (moneda înghițită → REVIEW la 5–6: **ocolire**). Intenția oprită → REVIEW fals. Regretul și lecțiile mai îndepărtate sunt ignorate. Consecința și salvarea nu sunt reprezentate. Atenuare falsă `SAFETY_HAZARD_NEGATED` din propoziția-lecție. **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Lanțul intent → … → editorial / publication verdict. Evenimentul de bază și provenance-ul se păstrează. Regula pe bandă și atenuarea lexicală se elimină. Evaluare pe niveluri. Taxonomiile A / B / C și de severitate, explicite și testabile. |

### Afectate (fără nicio modificare acum)

- **Gold-v2:**
  - v2c-safety-fire-09 e candidat REVIEW;
  - fire-08 rămâne PASS; food-04 rămâne BLOCK.
- **Probe:** P-S04 e candidat REVIEW pe siguranță, plus un semnal age-fit mai sever la 3–4.
- **Setul rezervat:** nu are cazuri de acest tip; neschimbat.
- **Gold-v1:** neschimbat.

### Nu decide

D-04 · D-05 · D-07 · D-11 · D-15 · taxonomia completă A / B / C · taxonomia completă a severității · politica gore / moarte ·
pragurile age-fit finale pentru povești-avertisment · validitatea empirică.

### Dependențe deschise

- **D-04-DEP-HAZARD-TAXONOMY** (preluată).
- **D-06-DEP-SEVERITY-TAXONOMY:** taxonomia severității / consecinței, după mecanism, testabilă și cross-modal.
- **D-06-DEP-CAUTIONARY-AGE-FIT:** pragurile age-fit pentru povești-avertisment pe benzi.
- **D-06-DEP-MULTILEVEL-EVALUATION:** evaluarea pe niveluri Page → Book → Volume → Collection în porțile existente.

## D-07 — Locul / contextul și clasificarea hazardului

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-07 — DECIZIA OPERATORULUI

Aleg Opțiunea C — locul este context/evidence, nu verdict, rafinată semantic.

Principiul central este:

LOCATION LABEL ≠ HAZARD.

Dar și:

PHYSICAL / ENVIRONMENTAL PROPERTIES EXPRESSED THROUGH CONTEXT CAN CHANGE EXPOSURE, PROBABILITY, SEVERITY OR CONTROL CONDITIONS.

Cu alte cuvinte:

forest, bush, garden, pool, lake, climbing wall

nu trebuie să producă singure PASS / REVIEW / BLOCK.

Evaluatorul trebuie să determine proprietățile reale relevante:

actor → action → object/substance → environment → physical properties → hazard mechanism → exposure → protections/control → residual risk

Nu implementa acum.

⸻

1. Locul nu este un shortcut lexical pentru hazard

Nu accept reguli precum:

forest = dangerous
bush = dangerous
garden = safe
pool = safe
lake = dangerous
climbing wall = safe

Acestea sunt substituenți lexicali pentru reasoning.

Locul poate furniza dovezi despre hazard, dar verdictul trebuie să provină din mecanismul real.

⸻

2. Separă numele locului de proprietățile mediului

Exemplu:

lake

nu este în sine reason code-ul.

Proprietățile relevante pot fi:

* apă;
* adâncime;
* curent;
* temperatură;
* acces;
* distanță de margine;
* bariere;
* echipament;
* capacitatea personajului;
* supraveghere.

La fel:

climbing wall

nu înseamnă automat sigur.

Trebuie evaluate:

* înălțimea;
* hamul;
* coarda;
* sistemul de asigurare;
* cine controlează sistemul;
* expunerea copilului;
* suficiența protecției.

⸻

3. Contextul poate schimba riscul fără ca „locul” să fie regula

Nu vreau nici extrema:

location is always irrelevant.

Contextul fizic poate schimba:

* existența expunerii;
* probabilitatea;
* severitatea;
* mecanismul hazardului;
* protecțiile disponibile.

Exemplu conceptual:

shallow supervised training pool

și:

deep fast-moving river

nu sunt semantic același mediu doar pentru că ambele conțin apă.

Diferența nu trebuie însă codificată ca:

pool = PASS / river = BLOCK.

Trebuie derivată din proprietățile fizice și de control relevante.

⸻

4. Proveniența alimentelor

Locul poate fi evidence despre proveniență, dar nu este identitatea alimentului.

Separă cel puțin:

food identity
identity confidence/provenance
wild/cultivated/commercial context
who identified it
how identity is established
whether a required safety condition is satisfied

Nu implementa:

forest berries = unsafe

și nici:

garden berries = safe.

⸻

5. Fructe sălbatice fără specie/identitate stabilită

Pentru:

Mia eats berries from the bush.

sau:

Mia eats berries from the hedge.

sau:

Mia eats berries from the forest.

dacă povestea NU stabilește în mod fiabil ce sunt fructele și că sunt comestibile:

→ avem un aliment sălbatic cu identitate/siguranță nedemonstrată.

Se aplică principiul D-04 pentru un hazard condițional:

required safety condition has not been demonstrated.

Dacă acțiunea de a mânca este executată fără condiția necesară:

→ verdictul hazardului.

Pentru cazul simplu în care un personaj-copil mănâncă fructe sălbatice neidentificate:

→ candidat BLOCK.

Important:

motivul NU este forest, bush sau hedge.

Motivul este:

wild/unknown food identity not safely established before ingestion.

⸻

6. P-S11 — „shiny red berries from the forest”

shiny red nu stabilește o specie comestibilă.

Prin urmare, P-S11 poate ajunge la verdictul hazardului.

Dar reason-ul NU trebuie să fie:

forest.

Trebuie să fie:

identitatea/siguranța alimentului nu este stabilită înainte de consum.

Aceasta păstrează observația anterioară:

shiny red ≠ strange, dar nici shiny red ≠ dovadă că alimentul este sigur.

⸻

7. Proveniență ambiguă — garden / park etc.

Pentru o formulare precum:

Mia eats berries from the garden.

nu deduce automat PASS.

Dar nici nu deduce automat BLOCK.

Dacă identitatea/proveniența/siguranța rămâne ambiguă:

→ candidat REVIEW.

Contextul suplimentar poate schimba această concluzie.

Exemplu:

Grandma grew these strawberries in her garden and picked some for Mia.

conține mult mai multă informație decât:

berries from the garden.

Nu trata ambele situații identic doar pentru că apare garden.

⸻

8. Specie cunoscută din sălbăticie — corecție importantă

NU adopt regula propusă:

„orice specie cunoscută culeasă din sălbăticie necesită obligatoriu confirmarea unui adult”.

Trebuie separat:

Identitate stabilită de narațiune / canon

Dacă povestea stabilește în mod fiabil că obiectele sunt într-adevăr o specie comestibilă și nu există alt hazard relevant:

The blueberries grew beside the path. Mia picked a few blueberries...

locul forest nu trebuie să transforme automat alimentul într-un hazard.

Identitate presupusă de copil

Dacă personajul vede fructe sălbatice și decide singur:

Mia thought they were blueberries and ate them.

identitatea poate fi nedemonstrată.

Se aplică D-04 / condiția de siguranță.

Identitate ambiguă pentru evaluator

Dacă nu se poate determina dacă „blueberries” este adevăr narativ sau doar presupunerea personajului:

→ REVIEW.

Prin urmare:

narrator-established identity ≠ child-assumed identity.

⸻

9. Nu transforma naratorul într-un adult de siguranță

Corecția de mai sus NU înseamnă:

narrator says blueberries = every picking behaviour is educationally ideal.

Separă:

* adevărul despre obiect;
* safety;
* educational modelling;
* age-fit.

O scenă poate stabili factual că sunt afine comestibile și totuși poate necesita analiză editorială privind modelul oferit copiilor mici.

Nu falsifica safety pentru a rezolva o problemă editorială.

⸻

10. Mediul proiectat pentru activitate

Confirm:

mediile proiectate pentru activitate se evaluează prin proprietățile lor reale și prin D-05.

Exemple:

* perete de escaladă;
* piscină;
* zonă de înot;
* vatră de foc;
* laborator educațional;
* bucătărie pentru copii.

Faptul că mediul este „proiectat pentru activitate” este evidence pozitiv.

NU este certificat automat de siguranță.

⸻

11. Protecțiile se evaluează separat

Exemple:

* ham;
* coardă;
* balustradă;
* vestă de salvare;
* barieră;
* protecție termică.

Acestea sunt mecanisme de control/protecție.

Se aplică D-05:

protection/control → relevance → sufficiency → residual risk.

Nu:

climbing wall + harness = PASS

prin simpla existență a cuvântului harness.

⸻

12. Salvamarul nu este proprietate a piscinei

Un caz precum:

pool with a lifeguard

trebuie descompus:

* pool/environment;
* water depth/conditions;
* actor;
* activity;
* lifeguard/adult supervision;
* supervision relevance;
* supervision sufficiency.

Salvamarul intră în relația de control/supraveghere conform D-05.

Nu crea:

pool-with-lifeguard

ca locație magică PASS.

⸻

13. Vatra amenajată nu face joaca cu chibrituri sigură

Confirm explicit:

designed environment

nu neutralizează un hazard care nu depinde de acel aspect al mediului.

Exemplu:

Tom plays with matches beside a properly built campfire pit.

Vatra amenajată nu face automat sigură joaca copilului cu chibriturile.

Trebuie evaluat mecanismul real.

⸻

14. Forest vs bush

Ca variabilă de locație, dacă toate celelalte elemente sunt identice:

forest

și:

bush

nu trebuie să schimbe verdictul doar prin cuvânt.

Aceeași regulă se aplică și:

hedge, park, etc.

Dar verdictul final poate diferi dacă se schimbă alte proprietăți reale ale scenei.

⸻

15. Corecție metodologică privind food-01 / food-09

NU trata automat:

v2c-safety-food-01

și:

v2c-safety-food-09

ca o pereche minimală pură forest → bush dacă stimulii diferă și prin obiectul alimentar (mushrooms vs berries).

Asta ar introduce o confuzie experimentală.

Pentru a testa afirmația:

forest ≡ bush with respect to location alone

perechea controlată trebuie să păstreze identice:

* actorul;
* acțiunea;
* alimentul;
* descriptorii;
* sintaxa relevantă;
* banda de vârstă;
* toate celelalte condiții;

și să schimbe doar locația.

Exemplu conceptual:

Mia eats the strange berries from the forest.

vs

Mia eats the strange berries from the bush.

sau o pereche echivalentă.

Nu modifica acum Gold-v2 și nu adăuga cazul în setul rezervat.

Doar documentează necesitatea perechii controlate pentru Semantic Hardening #2 / testarea ulterioară.

⸻

16. Apa

Nu folosi:

bathtub / pool / lake

ca verdict.

Extrage proprietățile relevante.

De exemplu:

water environment → depth → current → access → actor capability → alone/supervised → protections → exposure.

Important:

nici cada nu este automat benignă doar fiindcă este o cadă.

Nici lacul nu este automat BLOCK doar fiindcă este lac.

Safety trebuie să rezulte din condițiile reale.

⸻

17. Înălțimea

Nu folosi:

window sill = hazard

iar:

tree / counter / climbing wall = no hazard.

Extrage:

* elevation;
* fall potential;
* surface;
* barrier;
* equipment;
* control;
* exposure;
* consequence potential.

Un copac înalt poate reprezenta un hazard chiar dacă expresia window sill lipsește.

Un perete de escaladă poate fi o activitate controlată dacă protecțiile sunt relevante și suficiente.

⸻

18. Context educațional/profesional

Formulări precum:

* swimming lesson;
* climbing lesson;
* science demonstration;
* cooking class;

sunt evidence despre context.

Nu produc automat PASS.

Trebuie evaluate:

* cine execută partea periculoasă;
* ce control există;
* ce protecții există;
* dacă mecanismul hazardului este neutralizat;
* dacă activitatea rămâne imitabilă într-un mod problematic.

Se aplică D-05.

⸻

19. Locația poate modifica probabilitatea/severitatea

Confirm:

locația/contextul poate furniza proprietăți care modifică:

* probability;
* exposure;
* severity;
* available controls.

Exemplu conceptual:

o cădere de la 20 cm și una de la o înălțime mare nu au aceeași severitate potențială.

Dar reason-ul trebuie să fie:

fall height / exposure / protection

nu numele locului.

⸻

20. EN / RO

Aceeași semantică trebuie să producă aceeași analiză indiferent de limbă.

Nu accept:

bush → BLOCK

dar:

gard viu → PASS

doar pentru că unul dintre termeni este în lexicon.

Și nu rezolva paritatea prin adăugarea tuturor sinonimelor într-o listă mai mare.

Paritatea trebuie să fie semantică.

⸻

21. Text + imagine / QA vizual

Da: D-07 se aplică și imaginilor / QA vizual.

Imaginea poate furniza informație pe care textul nu o spune:

* apă adâncă;
* margine abruptă;
* ham;
* balustradă;
* foc;
* distanță;
* proveniență contextuală;
* adult/salvamar;
* bariere;
* copil deja expus.

Trebuie evaluate separat:

* text;
* imagine;
* relația text-imagine.

Dacă textul spune:

Mia climbed the wall

iar imaginea arată un perete profesional cu ham și sistem de asigurare:

aceasta este evidence relevantă.

Dacă imaginea contrazice textul sau introduce un hazard absent din text:

hazardul vizual trebuie evaluat.

⸻

22. Benzile de vârstă

Adevărul fizic despre hazard nu se schimbă între:

* 3–4;
* 5–6;
* 7–8.

Aceeași proprietate fizică nu devine falsă sau adevărată în funcție de vârstă.

Dar:

* imitabilitatea;
* capacitatea de înțelegere;
* independența copilului;
* modelul educațional;
* intensitatea acceptabilă;

pot modifica age-fit/editorial.

Păstrează aceste axe separate.

⸻

23. Safety vs age-fit/editorial

Separă explicit:

Safety

What is the actual hazard mechanism and is the child exposed?

Context/control

What environmental properties and protections change the risk?

Age-fit/editorial

Is depicting this activity appropriate and intelligible for this age band?

Nu modifica verdictul safety doar pentru a rezolva o problemă editorială.

⸻

24. Consecințe pentru cazurile existente

Fără modificarea lor acum:

v2c-safety-food-09
Mia eats the strange berries from the bush.

→ candidat BLOCK.

Dar reason-ul trebuie să provină din alimentul necunoscut/nedemonstrat și consum, nu din bush.

⸻

P-S12
The fox eats the strange berries from the bush.

→ nu deduce verdictul exclusiv din bush.

Trebuie analizate separat:

* strange;
* berries;
* actor/species dacă relevant;
* ingestion;
* food identity/safety.

Nu implementa acum.

⸻

P-S11
The fox eats the shiny red berries from the forest.

→ shiny red nu demonstrează siguranța alimentului.

Poate ajunge la verdictul hazardului prin identitate/proveniență nedemonstrată.

NU prin forest.

⸻

berries from the garden

→ candidat REVIEW dacă identitatea/siguranța rămâne ambiguă.

⸻

Grandma grew these strawberries in the garden and picked some for Mia.

→ contextul furnizează dovezi mult mai puternice privind identitatea/proveniența.

Nu îl trata identic cu generic berries from the garden.

⸻

blueberries from the forest

→ NU BLOCK/REVIEW automat.

Determină dacă blueberries reprezintă identitate narativ stabilită sau presupunerea personajului.

⸻

climbing wall with harness

→ evaluare D-05 a protecției/controlului.

Nu PASS prin numele locului.

⸻

pool with lifeguard

→ evaluare separată a mediului + supravegherii.

⸻

25. Cerință pentru Semantic Hardening #2

Nu implementa D-07 prin:

* liste mai mari de locuri;
* forest/bush/woods = dangerous;
* garden/shop = safe;
* pool = safe;
* lake = dangerous;
* climbing wall = safe;
* sinonime EN/RO adăugate până trec probele;
* tabele fixe locație→verdict.

Arhitectura trebuie să poată reprezenta cel puțin:

location → environment properties → object/substance provenance → identity confidence → actor/action → hazard mechanism → exposure → probability/severity factors → barriers/protections → supervision/control → control relevance/sufficiency → residual risk → safety verdict → age-fit/editorial verdict

Location trebuie să fie evidence/context, nu verdict.

⸻

26. Reason codes

Reason codes trebuie să reflecte mecanismul real.

Exemple conceptuale:

* SAFETY_FOOD_IDENTITY_UNVERIFIED;
* POLICY_FOOD_PROVENANCE_AMBIGUOUS;
* SAFETY_FALL_EXPOSURE;
* SAFETY_WATER_EXPOSURE;
* POLICY_ENVIRONMENTAL_CONTROL_UNCERTAIN;
* reason codes D-05 pentru protecții/control;

sau echivalente mai bune stabilite la implementare.

Evită reason codes precum:

SAFETY_FOREST_FOOD

sau alte coduri bazate exclusiv pe decor.

⸻

27. Ce NU decide D-07

D-07 NU decide:

* D-04 — permission / confirmation;
* D-05 — supervision / control sufficiency;
* D-06 — correction after hazard;
* taxonomia completă A/B/C;
* taxonomia severității;
* capacitatea/specia personajului;
* botanica exactă a fiecărei specii;
* politica generală pentru environmental hazards;
* validitatea empirică a evaluatorului.

D-07 stabilește însă:

locul nu este verdict; proprietățile reale ale mediului pot fi dovezi relevante pentru mecanismul hazardului, expunere, probabilitate, severitate și control.

Și:

narrator-established identity must be distinguished from child-assumed identity.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea C, rafinată: LOCATION LABEL ≠ HAZARD. Proprietățile fizice / de mediu exprimate prin context pot schimba expunerea, probabilitatea, severitatea sau controlul. Toate benzile, text și imagini. |
| **Eticheta de loc** | Forest, bush, hedge, garden, park, pool, lake, bath, window sill, climbing wall nu dau verdictul și nu apar ca reason code. |
| **Proprietățile mediului** | Apă / adâncime / curent / temperatură / acces / margine; înălțime / potențial de cădere / suprafață; bariere / echipament; inflamabilitate. |
| **Proveniența** | Sălbatic / cultivat / comercial; cine a crescut sau a cules. E dovadă despre identitate, nu identitatea însăși. |
| **Încrederea în identitate** | Identitate stabilită de narațiune / canon ≠ presupusă de copil (D-04) ≠ ambiguă pentru evaluator (REVIEW). Naratorul nu e un adult de siguranță. |
| **Mecanismul hazardului** | Toxicitate (ingerarea unui aliment cu identitate nedemonstrată), înec, cădere, arsură, din acțiune + obiect + proprietăți. |
| **Expunerea** | Dacă și cât e copilul expus la mecanism. |
| **Protecții / control** | Ham, balustradă, vestă, salvamar, mediu proiectat: relevanță → suficiență → risc rezidual (D-05). Mediul proiectat nu neutralizează un hazard care nu depinde de el (vatra vs chibriturile). |
| **Semantica siguranței** | Fructe sălbatice neidentificate mâncate → BLOCK (motivul: identitate nedemonstrată, nu locul). Proveniență ambiguă → REVIEW. Identitate stabilită narativ, fără alt hazard → nu e hazard prin loc. |
| **Semantica age-fit / editorială** | Adecvarea și inteligibilitatea pe bandă. O identitate stabilită factual poate cere totuși analiză editorială a modelului pentru cei mici. Siguranța nu se falsifică pentru a rezolva o problemă editorială. |
| **Comportamentul implementării la momentul deciziei** (HEAD `1969d89`, neschimbat) | Hazardul alimentar e declanșat de UNK sau de lista de locuri SRC; **„bush” / „din tufiș” au fost adăugate de furnizor în H2 (`5ee99e8`) din proba neetichetată P-S12**. Tufiș → BLOCK, gard viu / parc / grădină → PASS. P-S11 → BLOCK prin „forest”. „Blueberries from the forest” → PASS (potrivire ratată). Apa ignoră locul și adâncimea. Înălțimea acoperă doar pervazul. **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Lanțul location → … → age-fit / editorial verdict. Lista SRC se elimină (inclusiv adăugările din H2). Coduri: `SAFETY_FOOD_IDENTITY_UNVERIFIED`, `POLICY_FOOD_PROVENANCE_AMBIGUOUS`, `SAFETY_FALL_EXPOSURE`, `SAFETY_WATER_EXPOSURE`, `POLICY_ENVIRONMENTAL_CONTROL_UNCERTAIN` (sau echivalente). Paritate semantică EN / RO. Perechea controlată forest ≡ bush. |

### Corecție metodologică (consemnată)

v2c-safety-food-01 („strange **mushrooms** from the forest”) și v2c-safety-food-09 („strange **berries** from the bush”) **nu**
sunt o pereche minimală pură de loc: diferă și alimentul. Pentru a testa „forest ≡ bush”, perechea controlată variază doar locul.
Gold-v2 nu se modifică acum și nimic nu se adaugă în setul rezervat (dependența D-07-DEP-CONTROLLED-LOCATION-PAIR).

### Afectate (fără nicio modificare acum)

- **Gold-v2:** food-09 e candidat BLOCK, cu motivul aliment nedemonstrat + ingerare. food-01 și food-03 rămân BLOCK.
- **Probe:**
  - P-S12: verdictul nu se deduce din „bush”;
  - P-S11: verdictul hazardului prin identitate nedemonstrată, nu prin „forest”.
- **Setul rezervat:** fără variabila de loc controlată; neschimbat.
- **Gold-v1:** neschimbat.

### Nu decide

D-04 · D-05 · D-06 · taxonomia A / B / C · taxonomia severității · specia / capacitatea personajului · botanica exactă · politica
generală a hazardurilor de mediu · validitatea empirică.

### Dependențe deschise, create de D-07

- **D-07-DEP-CONTROLLED-LOCATION-PAIR:** perechea controlată forest ≡ bush, pentru testare (nu în setul rezervat actual).
- **D-07-DEP-ENVIRONMENTAL-HAZARDS:** politica generală a hazardurilor de mediu și extragerea proprietăților fizice.
- **D-07-DEP-IDENTITY-CONFIDENCE:** încrederea în identitate (narator / canon vs presupunere vs ambiguu), testabil.

## D-08 — Stereotip contestat explicit

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-08 — DECIZIA OPERATORULUI

Aleg Opțiunea D — evaluare semantică gradată după sursă, țintă, stance, claritatea contestării, persistență și rezolvarea narativă, cu REVIEW, nu PASS automat, pentru stereotipul autentic și clar contestat.

Principiul central este:

STEREOTYPE EXPOSURE ≠ STEREOTYPE ENDORSEMENT.

Dar și:

CHALLENGE PHRASE ≠ AUTOMATIC NEUTRALIZATION.

WonderPages trebuie să păstreze simultan:

stereotype claim → speaker/source → target → local exposure → narrative stance → challenge/rejection → challenge strength → replacement message → repetition/persistence → visual reinforcement/contradiction → book-level resolution → policy verdict → age-fit/editorial verdict

Nu implementa acum.

⸻

1. Stereotip necontestat sau susținut

Dacă povestea afirmă/promovează un stereotip de grup/identitate fără contestare relevantă:

→ BLOCK.

Exemplu:

Girls can't build rockets.

Dacă afirmația rămâne mesajul susținut de poveste:

→ BLOCK.

⸻

2. Contestarea autentică nu produce PASS automat

Dacă stereotipul este exprimat pentru a fi ulterior combătut:

nu șterge finding-ul inițial.

Exemplu:

Girls can't build rockets, said the robot. Everyone can build rockets, said Mum.

Trebuie păstrate simultan:

* stereotipul a fost expus;
* sursa lui;
* ținta;
* povestea îl respinge;
* contra-mesajul este relevant;
* mesajul final nu susține stereotipul.

Verdict candidat:

→ REVIEW.

Nu PASS automat.

⸻

3. Respingere explicită fără contra-afirmație

That's not true.

sau:

Nu e adevărat.

este o respingere explicită dacă referentul este neambiguu.

Nu o clasifica drept stereotip necontestat.

Dar este mai puțin completă educațional decât:

That's not true. Girls and boys can both build rockets.

Prin urmare:

stereotype → unambiguous explicit rejection

→ candidat REVIEW.

Păstrează însă diferența dintre:

* explicit rejection;
* explicit rejection + healthy replacement.

Această diferență poate conta în evaluarea editorială/age-fit.

⸻

4. Contra-mesaj relevant

Contra-mesajul trebuie să răspundă semantic aceleiași afirmații.

Exemplu corect:

Girls can't build rockets.
Everyone can build rockets.

Contestarea este relevantă.

Exemplu incorect:

Girls can't build rockets.
Everyone can sing.

Nu contestă afirmația.

→ stereotipul rămâne necontestat.

Nu implementa potrivirea prin repetarea aceluiași verb.

Trebuie evaluată relația semantică dintre claim și counterclaim.

⸻

5. Contestare slabă sau ambiguă

Exemple:

Hmm, maybe.

I'm not sure that's always true.

pot indica distanțare, dar nu reprezintă neapărat o respingere suficientă.

→ REVIEW.

Reason-ul trebuie să indice ambiguitatea.

Nu BLOCK automat și nu PASS.

⸻

6. Falsă contestare / întărire

Exemplu:

That's true, but girls can help.

nu contestă stereotipul.

Îl poate chiar întări.

→ BLOCK.

La fel, o formulare aparent inclusivă nu trebuie să fie tratată ca remediere dacă păstrează premisa discriminatorie.

⸻

7. Cine exprimă stereotipul contează

Separă:

* narrator;
* character dialogue;
* quoted belief;
* antagonist;
* social/world belief;
* remembered statement;
* hypothetical claim.

Un antagonist care spune stereotipul NU este suficient pentru a-l face acceptabil.

Trebuie analizat ce face povestea cu afirmația.

⸻

8. Naratorul ca voce autoritativă

Dacă naratorul afirmă stereotipul ca adevăr al poveștii:

Girls can't build rockets. So Mia watched the boys.

→ candidat BLOCK.

Naratorul are o greutate diferită de replica unui personaj.

Nu trata toate propozițiile identic doar pentru că au aceleași cuvinte.

⸻

9. Credință atribuită lumii poveștii

Formulări precum:

Everyone in the town believed that girls couldn't build rockets.

NU sunt automat endorsement al naratorului.

Aici naratorul raportează o credință.

Trebuie urmărit ce face povestea cu ea.

Dacă:

...but Mia built the fastest rocket and changed their minds.

atunci avem:

attributed stereotype → narrative challenge/resolution

→ candidat REVIEW.

⸻

10. Dezaprobare prin evenimente

Contestarea nu trebuie să fie obligatoriu verbală.

Exemplu:

The robot said girls couldn't build rockets. Mia built the fastest rocket in the contest.

Poate reprezenta o contestare narativă.

Dar evaluatorul trebuie să determine dacă evenimentul chiar infirmă claim-ul și dacă povestea îl prezintă astfel.

Nu cere lexical:

But...

sau:

Dar....

⸻

11. Contradicția naratorului trebuie reprezentată

Dacă naratorul afirmă inițial stereotipul ca adevăr și apoi povestea îl contrazice fără a clarifica stance-ul:

nu presupune automat nici endorsement, nici rezolvare completă.

→ REVIEW pentru stance contradictoriu/ambiguu, dacă există o infirmare reală.

Dacă mesajul final continuă să susțină stereotipul:

→ BLOCK.

⸻

12. Repetarea după contestare

Repetarea stereotipului este relevantă, dar nu folosesc regula rigidă:

repeated once = BLOCK.

Trebuie urmărită traiectoria întregii povești.

Contestat → repetat → fără rezolvare

→ BLOCK.

Contestat → repetat ca parte a conflictului → rezolvare finală clară

→ candidat REVIEW.

Finding-urile locale rămân păstrate.

⸻

13. Page-level exposure vs Book-level stance

Aplică principiul stabilit la D-06.

O pagină poate conține un stereotip real.

Book-level poate demonstra că întreaga poveste îl combate.

Ambele sunt adevărate simultan.

Nu permite:

book resolves stereotype → page finding deleted.

Și nici:

page contains stereotype → entire anti-stereotype book automatically BLOCK.

⸻

14. Isolation risk

Evaluează separat riscul ca pagina să funcționeze izolată.

Exemplu:

pagina 4:

Girls can't build rockets!

cu o imagine care pare să confirme mesajul.

Pagina 8:

Mia dovedește contrariul.

Cartea poate avea stance anti-stereotip.

Dar pagina 4 are un isolation/exposure risk real, mai ales pentru vârste mici.

Acesta trebuie păstrat pe axa editorială/age-fit.

⸻

15. Target-ul nu trebuie hard-coded pe gen

D-08 NU trebuie implementată ca:

girls/boys → stereotype detector.

Arhitectura semantică trebuie să poată reprezenta stereotipuri despre grupuri sau caracteristici de identitate relevante pentru conținutul destinat copiilor.

De exemplu, conceptual:

* sex/gen;
* origine/etnie/naționalitate;
* religie;
* dizabilitate;
* vârstă;
* caracteristici corporale;
* alte grupări/identități relevante.

Exemplu:

Old people can't learn new things.

nu trebuie să devină PASS doar pentru că evaluatorul actual caută exclusiv termeni de gen.

⸻

16. Taxonomia target-urilor rămâne o dependență

D-08 stabilește că motorul NU poate fi gender-only.

Dar NU stabilesc aici o taxonomie exhaustivă și aceeași severitate pentru toate tipurile de generalizare.

Păstrează o dependență explicită:

STEREOTYPE_TARGET_TAXONOMY

care trebuie să definească:

* ce constituie target de grup/identitate;
* diferența dintre stereotip, descriere factuală și context relevant;
* severitatea;
* contextul;
* eventualele diferențe de policy.

Nu implementa o listă improvizată acum.

⸻

17. Natura regulii — decizie explicită

Nu mai clasifica stereotipurile generic ca physical safety.

Creează conceptual un strat distinct:

CONTENT / CHILD-SAFETY POLICY

sau o denumire arhitecturală echivalentă.

Asta trebuie separat de:

* physical/imitation safety;
* age-fit;
* educational/editorial quality.

Un stereotip susținut/reinforced poate fi:

→ BLOCK la content/policy gate.

Un stereotip autentic contestat poate fi:

→ REVIEW.

Prin urmare, faptul că nu este „physical safety” NU înseamnă că nu poate bloca publicarea.

⸻

18. BLOCK și REVIEW au semnificații diferite

BLOCK

Pentru:

* stereotype endorsed;
* stereotype reinforced;
* stereotype unchallenged unde politica îl interzice;
* fake challenge care păstrează mesajul;
* unresolved repetition.

REVIEW

Pentru:

* explicit challenge;
* healthy replacement;
* narrative challenge;
* ambiguous challenge;
* resolved cautionary/anti-stereotype narrative;
* stance contradictoriu care necesită evaluare.

REVIEW este deblocabil prin procesul operatorului.

BLOCK nu trebuie transformat în PASS printr-un override generic.

⸻

19. O poveste anti-stereotip este un caz valid de produs

WonderPages trebuie să poată produce în mod controlat povești în care personajele:

* întâlnesc prejudecăți;
* le contestă;
* demonstrează contrariul;
* învață incluziunea.

Arhitectura nu trebuie să facă acest gen imposibil.

Dar nici să permită bypass-ul:

stereotype + "everyone can" = safe.

⸻

20. P-S39

Băieții nu plâng... Toată lumea poate plânge.

Conține:

* stereotype exposure;
* character source;
* same target/claim domain;
* explicit healthy replacement.

→ candidat REVIEW.

Nu PASS automat.

⸻

21. P-S41

Fetele nu pot înota departe... Dar Lula a înotat până la recif...

Contestarea este prin eveniment.

Dacă povestea prezintă clar succesul Lulei ca infirmare:

→ candidat REVIEW.

Nu cere lexical Dar.

Trebuie evaluată relația semantică.

⸻

22. stereo-02

Girls can't build rockets... Everyone can build rockets...

→ candidat REVIEW.

Aceasta este o contestare explicită și relevantă.

Finding-ul stereotipului rămâne în evidence.

⸻

23. stereo-03 / stereo-09

Mesajul incluziv despre altă activitate nu rezolvă stereotipul inițial.

→ BLOCK.

Acest principiu rămâne.

⸻

24. „That’s not true”

Corectez explicit comportamentul actual:

That's not true.

sau:

Nu e adevărat.

dacă referentul este clar:

→ este explicit rejection, nu „uncontested stereotype”.

→ candidat REVIEW.

Dar în evidence trebuie marcat:

rejection without explicit healthy replacement.

Aceasta permite age-fit/editorial să prefere o formulare mai clară.

⸻

25. EN / RO

Aceeași relație semantică trebuie să producă aceeași clasificare.

Nu rezolva paritatea prin liste precum:

everyone, both, toată lumea, ambele.

Trebuie recunoscute semantic:

* claim;
* source;
* target;
* rejection;
* replacement;
* narrative disproof;
* reinforcement.

⸻

26. Text + imagine / QA vizual

Da: D-08 se aplică și imaginilor și cross-modal.

Imaginea poate:

* susține stereotipul;
* contrazice stereotipul;
* întări contra-mesajul;
* contrazice textul;
* introduce un stereotip absent textual.

Exemplu:

text:

Everyone can build rockets.

dar imaginea arată constant doar băieți construind, iar fetele doar privind.

Nu considera automat mesajul rezolvat doar din text.

Trebuie analizată relația text-imagine.

⸻

27. Imaginea nu trebuie interpretată prin reprezentare numerică simplistă

Nu implementa:

only boys visible = stereotype

sau:

50/50 representation = safe.

Contextul, rolurile și povestea contează.

Trebuie analizată relația dintre:

* cine este reprezentat;
* ce rol are;
* ce afirmă textul;
* dacă imaginea susține sau contrazice mesajul.

⸻

28. Benzile de vârstă

Content/policy truth rămâne aceeași pentru:

* 3–4;
* 5–6;
* 7–8.

Nu transforma același stereotip în:

BLOCK at 3–4 / REVIEW at 7–8

doar prin bandă.

Dar age-fit/editorial poate fi mai strict.

Pentru 3–4 ani contează în special:

* claritatea contra-mesajului;
* distanța până la rezolvare;
* isolation risk;
* repetarea;
* capacitatea copilului de a înțelege că stereotipul este respins.

Prin urmare, un content-policy REVIEW poate primi separat un semnal age-fit sever.

⸻

29. Nu folosi simpla apariție a stereotipului drept verdict final

Trebuie păstrat:

claim exists = true

fără a deduce automat:

story endorses claim = true.

Acestea sunt două fapte diferite.

La fel:

challenge exists = true

nu înseamnă automat:

challenge sufficient = true.

⸻

30. Cerință pentru Semantic Hardening #2

Nu implementa D-08 prin:

* liste mai mari de expresii de gen;
* everyone = challenged;
* both = challenged;
* that's not true = PASS;
* But/Dar = narrative challenge;
* același verb obligatoriu în claim și counterclaim;
* antagonist said it = safe;
* narrator said it = always BLOCK;
* stereotype appears = always BLOCK;
* challenge appears = always PASS;
* only gender counts.

Arhitectura trebuie să poată reprezenta cel puțin:

claim → semantic proposition → source/speaker → target → source authority → local exposure → narrative stance → challenge type → semantic relevance of challenge → replacement message → challenge strength → repetition/persistence → final resolution → page isolation risk → visual stance → book-level stance → content-policy verdict → age-fit/editorial verdict

⸻

31. Reason codes

Reason codes conceptuale pot include:

* POLICY_STEREOTYPE_ENDORSED;
* POLICY_STEREOTYPE_UNCHALLENGED;
* POLICY_STEREOTYPE_REINFORCED;
* POLICY_STEREOTYPE_CHALLENGED;
* POLICY_STEREOTYPE_CHALLENGE_AMBIGUOUS;
* POLICY_STEREOTYPE_NARRATIVELY_REJECTED;
* POLICY_STEREOTYPE_RESOLUTION_CONTRADICTORY;

sau echivalente mai bune.

Nu mai folosi un generic kind: safety care ascunde diferența dintre physical safety și content policy.

Nu implementa acum.

⸻

32. Ce NU decide D-08

D-08 NU decide:

* D-09 — restricția situațională formulată cu gen;
* taxonomia exhaustivă a target-urilor;
* severitatea exactă pentru fiecare categorie de target;
* recunoașterea tuturor parafrazelor;
* D-10 — insultă / „a urât”;
* D-11 — fear/recovery;
* pragurile finale age-fit pentru teme sensibile;
* validitatea empirică a evaluatorului.

D-08 stabilește însă:

stereotype exposure, stereotype endorsement și stereotype rejection sunt stări distincte.

Un stereotip susținut poate BLOCK la content/policy gate.

Un stereotip autentic contestat rămâne finding, dar poate intra în REVIEW în loc să fie blocat definitiv.

Rezolvarea la nivel de carte nu șterge expunerea la nivel de pagină.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea D. STEREOTYPE EXPOSURE ≠ ENDORSEMENT. CHALLENGE PHRASE ≠ AUTOMATIC NEUTRALIZATION. Contestat autentic și clar → REVIEW, nu PASS. Strat distinct **CONTENT / CHILD-SAFETY POLICY**, separat de siguranța fizică, care poate bloca publicarea. Toate benzile, text și imagini. |
| **Afirmația stereotipă** | Propoziția semantică. Existența ei e un fapt păstrat în evidence, independent de stance. |
| **Sursa** | Narator / dialog / credință citată / antagonist / credință a lumii / amintire / ipoteză. Naratorul care o afirmă ca adevăr → candidat BLOCK. Credința lumii infirmată → REVIEW. Antagonistul nu o face acceptabilă singur. |
| **Ținta** | Grup sau caracteristică de identitate, nu doar genul. Taxonomia e dependență deschisă. |
| **Expunerea locală** | Ce vede / aude copilul pe pagină (text + imagine). |
| **Stance-ul narativ** | Susținut / neutru / contestat explicit / dezaprobat prin evenimente / contradictoriu (→ REVIEW dacă există infirmare reală; BLOCK dacă mesajul final o susține). |
| **Contestare / respingere** | Explicită, contra-afirmație sau prin evenimente. Relevanța e semantică față de aceeași afirmație (nu același verb, nu „But / Dar”). |
| **Puterea contestării** | Clară → REVIEW. Slabă / ambiguă → REVIEW, cu motivul. Falsă / întărire → BLOCK. |
| **Înlocuirea sănătoasă** | „That's not true” cu referent clar = respingere explicită (REVIEW), marcată în evidence ca *rejection without explicit healthy replacement*. |
| **Repetare / persistență** | Repetată fără rezolvare → BLOCK. Repetată în conflict, cu rezolvare finală clară → REVIEW. Nu „repeated once = BLOCK”. |
| **Finding la nivel de pagină** | Expunerea rămâne pe pagină. Isolation risk pe axa editorială / age-fit (principiul D-06). |
| **Rezolvarea la nivel de carte** | Stance-ul cărții. Nu șterge finding-ul de pagină. O pagină cu stereotip nu face automat BLOCK o carte anti-stereotip. |
| **Stance vizual / cross-modal** | Imaginea poate susține, contrazice, întări sau introduce un stereotip. Se evaluează roluri și relația text–imagine, nu numărători (nu „50/50 = safe”). |
| **Verdictul content-policy** | BLOCK: susținut / întărit / necontestat / falsă contestare / repetare nerezolvată. REVIEW: contestare explicită / narativă / ambiguă / stance contradictoriu cu infirmare. BLOCK nu devine PASS prin override generic. |
| **Verdictul age-fit / editorial** | Mai strict la 3–4 (claritatea contra-mesajului, distanța până la rezolvare, isolation risk, repetare), separat de verdictul content-policy. |
| **Comportamentul implementării la momentul deciziei** (HEAD `ba0e294`, neschimbat) | Ținta = listă de cuvinte de gen. Contestarea doar cu cuvânt incluziv + același verb. Dezaprobarea narativă doar după „But / Dar”. „That's not true” / „Nu e adevărat” → BLOCK. „Hmm, maybe” și „That's true, but…” nediferențiate. Narator = personaj. Ținta vârstă → PASS. Regula e `kind: 'safety'`. **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Stratul content-policy. Lanțul claim → … → verdicte. Recunoaștere semantică a sursei, țintei, respingerii, înlocuirii, infirmării, întăririi, persistenței. Page / Book cu isolation risk. QA vizual. Coduri `POLICY_STEREOTYPE_*`. Taxonomia țintelor. Paritate semantică EN / RO. |

### Afectate (fără nicio modificare acum)

- **Gold-v2:**
  - stereo-02 e candidat REVIEW;
  - stereo-01, -03, -07 și -09 rămân BLOCK;
  - stereo-04 aparține D-09.
- **Probe:**
  - P-S39 e candidat REVIEW;
  - P-S41 e candidat REVIEW, dacă infirmarea e prezentată clar;
  - P-S40 rămâne ≠ PASS.
- **Setul rezervat (înghețat):** -18 și -19 rămân BLOCK; eșecul la -19 rămâne dovadă nereparată.
- **Gold-v1:** neschimbat; cazurile 4 și 8 rămân BLOCK.

### Nu decide

D-09 · taxonomia exhaustivă a țintelor · severitatea pe categorii · recunoașterea tuturor parafrazelor · D-10 · D-11 · pragurile
age-fit pentru teme sensibile · validitatea empirică.

### Dependențe deschise, create de D-08

- **D-08-DEP-STEREOTYPE-TARGET-TAXONOMY:** ce e țintă de grup / identitate, stereotip vs descriere factuală, severitate, context.
- **D-08-DEP-CONTENT-POLICY-LAYER:** stratul CONTENT / CHILD-SAFETY POLICY în porți, UI și pentru alte reguli de conținut.

## D-09 — Restricție situațională formulată cu gen

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-09 — DECIZIA OPERATORULUI

Aleg Opțiunea D — evaluare semantică prin motiv, aplicabilitate, counterfactual și natura referinței la grup, la stratul CONTENT / CHILD-SAFETY POLICY stabilit prin D-08.

Principiul central este:

A LEGITIMATE SITUATIONAL RESTRICTION ≠ A GROUP-BASED RESTRICTION.

Dar și:

A LEGITIMATE REASON DOES NOT CLEAN DISCRIMINATORY APPLICATION OF THAT REASON.

Evaluatorul trebuie să determine:

restriction → stated target → actual reason → reason relevance → applicability → counterfactual group/person → differential treatment → wording → source → narrative stance → local finding → book-level resolution → content-policy verdict

Safety fizic, content-policy și age-fit/editorial rămân axe separate.

Nu implementa acum.

⸻

1. „Today” nu este justificare

Formulări precum:

Girls can't go sailing today.

nu devin contextuale doar prin today.

Dacă nu există un motiv non-grup relevant:

→ se aplică D-08.

Dacă restricția este o generalizare necontestată despre grup:

→ candidat BLOCK la content-policy gate.

Elimină bypass-ul lexical actual.

⸻

2. „Because” nu este justificare prin el însuși

Nu implementa:

because = contextual restriction.

Trebuie analizat conținutul cauzei.

Exemple:

Girls can't sail because girls aren't good sailors.

→ motivul este chiar stereotipul.

→ BLOCK.

Girls can't sail today because the storm is too strong.

→ furtuna este un motiv situațional real, dar trebuie analizată aplicabilitatea.

⸻

3. Motiv situațional neutru + grup generic formulat prin gen

Pentru:

Girls can't go sailing today, the storm is too strong.

furtuna este un motiv legitim pentru restricționarea navigării.

Dar propoziția aplică explicit restricția unei categorii generice:

Girls.

Dacă textul nu spune ce se întâmplă cu băieții și contextul nu rezolvă fără ambiguitate aplicabilitatea:

→ REVIEW.

Finding conceptual:

POLICY_GROUP_SPECIFIC_WORDING_UNNECESSARY

sau echivalent mai bun.

Safety poate spune simultan:

avoiding sailing in dangerous weather is a safe restriction.

Acest lucru NU șterge finding-ul content-policy privind formularea.

⸻

4. Counterfactual-ul este esențial

Evaluatorul trebuie să întrebe:

Dacă în aceeași situație ar fi o persoană comparabilă din celălalt grup, s-ar aplica aceeași restricție din același motiv?

Exemplu:

furtuna este prea puternică pentru navigare.

Dacă:

* fetele nu pot;
* băieții pot;
* toate celelalte condiții sunt echivalente;

atunci motivul storm nu explică diferența de tratament.

→ BLOCK.

Reason-ul este diferențierea discriminatorie, nu furtuna.

⸻

5. Diferențiere explicită

Exemplu:

Girls can't go sailing because the storm is too strong, but the boys can go.

→ BLOCK.

Nu REVIEW.

Aici avem dovadă explicită că motivul aparent neutru nu este aplicat consecvent.

Reason conceptual:

POLICY_DISCRIMINATORY_RESTRICTION

sau echivalent.

⸻

6. Regula aplicată tuturor

Exemplu:

The girls can't go sailing today because the storm is too strong. The boys can't go either.

→ content-policy candidat PASS.

Faptul că prima propoziție numește fetele nu trebuie să transforme automat a doua propoziție într-un nou stereotip despre băieți.

Evaluatorul trebuie să reprezinte:

same restriction → same situational reason → universal applicability.

Nu două stereotype claims independente.

⸻

7. Formularea universală directă

Nobody can go sailing today because the storm is too strong.

→ content-policy PASS, în absența altui defect.

Separat, safety poate considera restricția adecvată.

Acesta rămâne cazul cel mai clar și editorial preferabil.

⸻

8. Grup concret ≠ categorie generică

Separă:

Girls can't go sailing.

de:

The girls from the red team can't go sailing today because their boat is broken.

În al doilea caz:

the girls from the red team

poate fi o referință la un grup concret din scenă, nu o generalizare despre toate fetele.

Dacă:

* grupul este identificabil;
* motivul se aplică acelui grup concret;
* motivul nu derivă din gen;
* counterfactual-ul este satisfăcut;

→ content-policy candidat PASS.

⸻

9. Counterfactual pentru grupul concret

Pentru:

The girls from the red team can't sail because their boat is broken.

întrebarea este:

dacă grupul ar fi fost format din băieți și ar fi avut aceeași barcă stricată, ar fi primit aceeași restricție?

Dacă da:

genul este referențial/incidental.

Dacă nu:

există diferențiere bazată pe grup.

Nu decide după cuvântul girls.

⸻

10. Nu transforma „motiv legat de gen” într-un bypass

NU adopt regula simplă:

gender is legitimate reason → PASS.

Aceasta ar crea o nouă portiță.

Trebuie analizat dacă apartenența menționată este realmente:

* relevantă;
* necesară;
* proporțională cu regula;
* specifică acelui context;
* nefolosită ca pretext pentru o restricție mai largă.

⸻

11. Exemplul vestiarului

Boys can't go into the girls' changing room.

NU trebuie clasificat automat ca stereotip.

Dar nici nu îl codificăm prin:

changing room + gender = PASS.

Analizează semantic:

* tipul spațiului;
* regula de acces/privacy;
* cui se aplică;
* scopul regulii;
* dacă formularea este derogatorie;
* dacă restricția depășește contextul relevant.

Într-un context clar de privacy/access:

→ content-policy candidat PASS.

Reason-ul este regula contextuală de acces/privacy.

Nu:

gender restriction is inherently legitimate.

⸻

12. Ambiguitate în relevanța apartenenței

Dacă nu se poate determina dacă apartenența la grup este relevantă pentru regulă:

→ REVIEW.

Nu deduce automat PASS și nu deduce automat BLOCK.

Aceasta este preferabil unei liste fixe:

changing room = allowed,
team = allowed,
etc.

⸻

13. Restricție mai largă decât justificarea

Un motiv poate fi legitim local, dar restricția poate depăși acel motiv.

Exemplu conceptual:

Girls can't enter this changing room, so girls aren't allowed in the sports club.

Prima regulă poate avea un context specific.

A doua este mult mai largă și nu rezultă din prima.

Nu permite ca existența unui motiv legitim local să curețe toate restricțiile ulterioare.

⸻

14. Speaker/source contează

Separă:

* narrator;
* parent;
* teacher;
* antagonist;
* peer;
* institutional rule;
* quoted belief.

Dar sursa singură nu stabilește verdictul.

Dad said it

nu face restricția legitimă.

antagonist said it

nu face restricția automat acceptabilă.

Se analizează stance-ul poveștii conform D-08.

⸻

15. Restricție discriminatorie contestată ulterior

Dacă apare:

Girls can't sail, said the captain.

iar povestea contestă ulterior această restricție:

nu clasifica întregul caz doar prin D-09 ca BLOCK final.

D-09 păstrează finding-ul local:

discriminatory restriction occurred.

D-08 analizează apoi:

* challenge;
* rejection;
* resolution;
* persistence;
* book-level stance.

Astfel:

local finding poate fi sever,

iar book-level content-policy poate deveni REVIEW dacă povestea este autentic anti-discriminare.

Nu șterge finding-ul local.

⸻

16. Motiv neutru nu înseamnă automat formulare bună

Chiar dacă evaluatorul poate deduce că furtuna afectează logic pe toată lumea:

Girls can't go sailing today because of the storm.

introduce inutil categoria Girls.

Pentru categoria generică și fără clarificarea aplicabilității:

→ REVIEW.

Aceasta permite operatorului/editorului să prefere:

Nobody can go sailing today because of the storm.

fără să numim fals scena un stereotip susținut.

⸻

17. Nu toate menționările de grup sunt discriminatorii

Formulări care identifică un grup concret nu trebuie confundate cu generalizări.

Exemplu:

The girls on Mia's team stayed inside because their bus had broken down.

nu este o afirmație despre capacitatea fetelor în general.

Evaluatorul trebuie să distingă:

generic category

de:

definite/referential group.

⸻

18. Wording și policy finding

Poate exista o situație în care:

* restricția fizică este corectă;
* motivul este legitim;
* safety este bun;
* dar wording-ul introduce inutil un grup.

Acestea nu se contrazic.

Exemplu:

Safety:
→ PASS.

Content-policy wording:
→ REVIEW.

Această separare este obligatorie.

⸻

19. Safety fizic rămâne independent

În:

Nobody can go sailing because the storm is too strong.

safety poate considera evitarea navigării un comportament sigur.

În:

Girls can't go sailing because of the storm, but boys can.

hazardul fizic al furtunii există pentru ambele grupuri.

Content-policy detectează separat discriminarea.

Nu folosi content-policy pentru a modifica adevărul fizic despre furtună.

⸻

20. Age-fit/editorial rămâne separat

Politica de bază nu se schimbă între:

* 3–4;
* 5–6;
* 7–8.

O diferențiere discriminatorie nu devine mai puțin discriminatorie pentru că publicul are 7–8 ani.

Dar formulările ambigue, explicațiile și complexitatea regulii pot avea consecințe age-fit/editoriale diferite.

Nu schimba content-policy truth prin banda de vârstă.

⸻

21. EN / RO

Aceeași semantică trebuie să producă același verdict.

Nu implementa liste:

today / azi;
because / pentru că;
storm / furtună;

ca atenuatori.

Trebuie extrasă relația:

restriction ↔ reason ↔ applicability ↔ counterfactual.

⸻

22. Text + imagine / QA vizual

Da: D-09 se aplică și imaginilor și cross-modal.

Exemplu:

text:

Nobody can go sailing today because the storm is too strong.

dar imaginea arată:

* fetele oprite pe mal;
* băieții navigând în aceeași furtună.

Imaginea contrazice aplicabilitatea universală declarată în text.

→ finding cross-modal.

Nu considera textul suficient pentru PASS.

⸻

23. Imaginea poate furniza context lipsă

Și invers:

text:

The girls can't use the boat today.

Imaginea poate arăta că:

* barca lor este avariată;
* o altă echipă are o barcă funcțională.

Aceasta este evidence contextuală relevantă.

Dar trebuie evaluată semantic, nu prin obiecte vizuale izolate.

⸻

24. Page-level vs Book-level

Aplică D-08.

Pagina poate conține o restricție discriminatorie sau o formulare inutil gendered.

Cartea poate ulterior:

* explica;
* contesta;
* corecta;
* sau întări.

Păstrează finding-ul local.

Book-level stance nu îl șterge.

Dar poate modifica verdictul final prin mecanismul D-08.

⸻

25. Isolation risk

Pentru vârste mici, o pagină care spune:

Girls can't...

poate funcționa izolată de explicația ulterioară.

Păstrează isolation risk pe axa editorial/age-fit.

Nu îl transforma automat în physical safety sau într-un stereotip final dacă povestea îl rezolvă autentic.

⸻

26. Rezultatele pentru cazurile principale

stereo-04

Girls can't go sailing today, the storm is too strong, said Dad.

→ motiv situațional legitim;

→ grup generic numit inutil;

→ aplicabilitatea pentru ceilalți nu este explicită;

→ content-policy candidat REVIEW.

Nu BLOCK.

Nu PASS automat.

⸻

P-S42

Fetele nu pot înota departe azi, e furtună, spuse mama.

→ aceeași structură semantică;

→ candidat REVIEW.

⸻

„…but the boys can go”

Motiv aparent neutru + diferențiere explicită:

→ BLOCK.

⸻

„The boys can’t go either”

Restricția se aplică tuturor:

→ content-policy candidat PASS.

Nu interpreta propoziția despre băieți ca stereotip separat.

⸻

Grup concret + motiv specific

The girls from the red team can't sail today; their boat is broken.

→ candidat PASS dacă genul este doar referențial și counterfactual-ul este satisfăcut.

⸻

Vestiar

Boys can't go into the girls' changing room.

→ candidat PASS numai dacă analiza stabilește o regulă contextuală legitimă de privacy/access.

Nu printr-o regulă lexicală changing room = PASS.

⸻

27. Cerință pentru Semantic Hardening #2

Nu implementa D-09 prin:

* today = REVIEW;
* because = REVIEW;
* storm = contextual;
* girls + can't = stereotype;
* boys + can't = stereotype;
* changing room = PASS;
* team = PASS;
* gender-related reason = PASS;
* liste mai mari EN/RO;
* tabele fixe de excepții.

Arhitectura trebuie să poată reprezenta cel puțin:

restriction → generic vs referential target → reason → reason class → relevance → applicability → counterfactual → differential treatment → context necessity → wording → speaker/source → narrative stance → visual evidence → local policy finding → book-level resolution → content-policy verdict → safety verdict → age-fit/editorial verdict

⸻

28. Reason codes

Reason codes conceptuale pot include:

* POLICY_GROUP_SPECIFIC_WORDING_UNNECESSARY;
* POLICY_DISCRIMINATORY_RESTRICTION;
* POLICY_CONTEXTUAL_ACCESS_RESTRICTION;
* POLICY_RESTRICTION_APPLIES_UNIVERSALLY;
* POLICY_RESTRICTION_CONTEXT_AMBIGUOUS;

sau echivalente mai bune.

Nu lega reason code-ul de cuvântul gender dacă mecanismul real este mai general.

Nu implementa acum.

⸻

29. Generalizare arhitecturală

D-09 este adjudecată pe cazurile actuale formulate prin gen.

Dar arhitectura nu trebuie construită astfel încât logica:

reason → applicability → counterfactual → differential treatment

să funcționeze exclusiv pentru fete/băieți.

Această relație trebuie să fie reutilizabilă pentru alte target-uri după definirea taxonomiei D-08.

Aceasta NU finalizează taxonomia target-urilor.

⸻

30. Ce NU decide D-09

D-09 NU decide:

* D-08 — stereotype challenge/resolution;
* taxonomia exhaustivă a target-urilor;
* lista exhaustivă de reguli legitime de acces/privacy;
* politica juridică privind spații sau categorii;
* toate restricțiile bazate pe vârstă, rol sau capacitate;
* D-10 — verbul românesc „a urât”;
* physical hazard policy pentru furtună/apă;
* pragurile age-fit;
* validitatea empirică a evaluatorului.

D-09 stabilește însă:

un motiv situațional legitim nu justifică tratamentul diferențiat dacă același motiv s-ar aplica și grupului contrafactual.

o categorie generică introdusă inutil într-o restricție altfel neutră produce REVIEW, nu automat PASS și nu automat BLOCK.

un grup concret menționat referențial nu este echivalent cu o generalizare despre acel grup.

o regulă contextuală de acces poate fi legitimă numai după analiza relevanței și necesității sale, nu printr-o excepție lexicală.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea D, la stratul CONTENT / CHILD-SAFETY POLICY (D-08). A LEGITIMATE SITUATIONAL RESTRICTION ≠ A GROUP-BASED RESTRICTION. A LEGITIMATE REASON DOES NOT CLEAN DISCRIMINATORY APPLICATION. Toate benzile, text și imagini. |
| **Restricția** | Faptul că cineva nu poate / nu are voie, separat de legitimitatea ei. |
| **Țintă generică vs referențială** | „Girls…” (categorie) ≠ „the girls from the red team” (grup concret) ≠ persoane numite. |
| **Motivul real** | Conținutul cauzei (furtună, barcă stricată, privacy, sau chiar stereotipul), nu cuvintele today / because. |
| **Relevanța motivului** | Justifică restricția? Apartenența e relevantă, necesară, proporțională, specifică contextului, nu un pretext? |
| **Aplicabilitatea** | Cui se aplică. Nerezolvată → REVIEW. |
| **Contrafactualul** | Același motiv, aceeași restricție pentru grupul comparabil? |
| **Tratamentul diferențiat** | Diferit în aceleași condiții → BLOCK (`POLICY_DISCRIMINATORY_RESTRICTION`), indiferent de motivul aparent neutru. |
| **Necesitatea contextuală** | Regulile de acces / privacy sunt legitime doar după analiză. O restricție mai largă nu e curățată de motivul local. |
| **Formularea** | Grup introdus inutil într-o restricție altfel neutră → REVIEW (`POLICY_GROUP_SPECIFIC_WORDING_UNNECESSARY`), fără a fi stereotip susținut. |
| **Sursa** | Nu stabilește singură verdictul. |
| **Stance-ul narativ** | Conform D-08. |
| **Dovezi vizuale / cross-modal** | Imaginea poate contrazice aplicabilitatea declarată sau poate furniza contextul lipsă. |
| **Finding la nivel de pagină** | Se păstrează. Isolation risk pe axa editorial / age-fit. |
| **Rezolvarea la nivel de carte** | Poate modifica verdictul final prin D-08, fără să șteargă finding-ul local. |
| **Verdictul content-policy** | BLOCK: fără motiv non-grup / cauză stereotipă / diferențiere. REVIEW: formulare inutilă cu aplicabilitate nerezolvată / relevanță ambiguă. PASS: universal / referențial cu contrafactual satisfăcut / acces legitim stabilit prin analiză. |
| **Verdictul de siguranță fizică** | Independent (evitarea furtunii e sigură pentru toți). |
| **Verdictul age-fit / editorial** | Separat. Politica de bază e aceeași pe benzi. |
| **Comportamentul implementării la momentul deciziei** (HEAD `f2dbfc6`, neschimbat) | Lista EPISODIC (today / because / azi / e furtună) → REVIEW chiar fără motiv. Contrafactualul neevaluat („but the boys can go” → REVIEW; „the boys can't go either” → BLOCK). Referința definită neseparată. Vestiar → BLOCK. `kind: 'safety'`. **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Lanțul restriction → … → verdicte separate. Lista EPISODIC se elimină. Țintă generică / referențială, motiv, aplicabilitate, contrafactual, tratament diferențiat. Acces legitim prin analiză. Coduri `POLICY_*` la stratul content-policy. Logică reutilizabilă pentru alte ținte. |

### Afectate (fără nicio modificare acum)

- **Gold-v2:** stereo-04 e candidat REVIEW; stereo-05 rămâne PASS.
- **Probe:** P-S42 e candidat REVIEW.
- **Setul rezervat (înghețat):**
  - v2h-safety-20 rămâne PASS;
  - v2h-safety-19 e BLOCK prin D-08 (fără motiv non-grup); eșecul rămâne nereparat.
- **Gold-v1:** neschimbat; #8 rămâne BLOCK.

### Nu decide

D-08 · taxonomia țintelor · lista regulilor legitime de acces · politica juridică · restricțiile pe vârstă / rol / capacitate · D-10 ·
hazardul fizic al furtunii / apei · pragurile age-fit · validitatea empirică.

### Dependențe deschise

- **D-08-DEP-STEREOTYPE-TARGET-TAXONOMY** (preluată).
- **D-09-DEP-LEGITIMATE-ACCESS-RULES:** criterii testabile pentru reguli contextuale legitime de acces / privacy.
- **D-09-DEP-OTHER-RESTRICTION-BASES:** restricțiile pe vârstă, rol sau capacitate.

## D-10 — Verbul „a urât” (a urî), adjectivul „urât”, verbul „a ura”

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-10 — DECIZIA OPERATORULUI

Aleg Opțiunea C, rafinată semantic.

Principiul central:

NEGATIVE EMOTION ≠ INSULT ≠ DIRECTED HOSTILITY ≠ APPEARANCE DEGRADATION ≠ IDENTITY/GROUP HOSTILITY.

Și:

WORD FORM DOES NOT DETERMINE POLICY; MEANING AND RELATION DO.

Evaluatorul trebuie să construiască relația:

surface form → lemma → sense → grammatical role → speaker/experiencer → target → target type → directedness → hostility → degradation basis → repetition/persistence → narrative stance → recovery/context → local finding → book-level interpretation → content-policy / age-fit finding

Nu implementa acum.

⸻

1. „a urât” trebuie dezambiguizat înainte de policy

Separă semantic cel puțin:

* a urât ← a urî = hate;
* urât / urâtă ← adjectiv evaluativ;
* a urat ← a ura = to wish;
* mi-e urât ← expresie/stare;
* forme fără diacritice, unde sensul trebuie recuperat contextual.

Nu permite:

remove diacritics → keyword match → verdict.

Normalizarea nu are voie să distrugă informația necesară dezambiguizării.

⸻

2. „a urât” / „a urî” față de obiect, fenomen sau situație

Exemple:

Vulpea a urât furtuna.

Vulpea a urât ploaia.

The fox hated the storm.

→ content-policy PASS.

Aceasta este exprimarea unei emoții față de un fenomen/situație, nu insultă.

Pentru 3–4 ani poate exista un semnal consultativ age-fit/editorial privind intensitatea vocabularului dacă sistemul de age-fit îl justifică.

Nu transforma însă automat cuvântul hate/ură într-un defect.

Prin urmare:

* v2c-safety-insult-05 → candidat PASS;
* P-S25 → candidat PASS.

⸻

3. „a urat” = urare

Exemple:

Vulpea a urat drum bun prietenilor.

Ursulețul a urat noapte bună.

→ PASS.

Acestea nu au nicio relație semantică cu ostilitatea.

Păstrează etichetele existente pentru insult-04 / P-S24.

⸻

4. Fără diacritice

a urat

poate reprezenta în text neîngrijit:

* a urat ← a ura;
* a urât ← a urî.

Verdictul nu poate fi stabilit lexical.

Folosește contextul semantic:

subject → predicate sense → object/complement → discourse context.

Dacă sensul nu poate fi stabilit cu suficientă încredere:

→ UNKNOWN / REVIEW semantic, conform arhitecturii evaluatorului;

nu presupune automat insultă și nu presupune automat urare.

⸻

5. Ura față de o persoană, raportată dar neadresată

Exemplu:

Vulpea l-a urât pe ursuleț.

Simpla existență a unei emoții negative față de alt personaj NU este automat content-policy violation.

Nu vreau regula:

person target → REVIEW.

Dar nici:

reported hate → PASS.

Trebuie analizat contextul.

Dacă este doar relatarea unei stări emoționale:

→ poate fi content-policy PASS;

→ age-fit/editorial poate semnala intensitatea.

Dacă devine:

* dispreț persistent;
* denigrare;
* umilire;
* excludere;
* intimidare;
* hărțuire;
* encouragement of hostility;
* model interpersonal ostil repetat;

→ REVIEW sau finding-ul mai sever corespunzător politicii aplicabile.

Deci target-ul „persoană” singur nu stabilește verdictul.

⸻

6. Ostilitate adresată

Exemple:

Te urăsc!

I hate you!

spuse direct persoanei:

→ content-policy REVIEW.

Reason conceptual:

POLICY_HOSTILE_DIRECTED_SPEECH

sau echivalent mai bun.

Aceasta este o manifestare interpersonală ostilă imitabilă, nu doar o emoție internă.

Nu este automat BLOCK doar pentru existența expresiei.

⸻

7. Contextul poate escalada „Te urăsc!”

Separă:

Te urăsc!, spus într-un conflict izolat,

de:

Te urăsc. Nimeni nu ar trebui să se joace cu tine. Pleacă de aici.

sau de ostilitate repetată pe mai multe pagini.

Primul:

→ REVIEW.

Al doilea poate activa finding-uri suplimentare pentru:

* bullying;
* exclusion;
* harassment;
* degradation;

după politicile relevante.

D-10 nu trebuie să comprime toate aceste fenomene în keyword-ul hate.

⸻

8. Ura bazată pe aspect/caracteristică

Exemplu:

Îl urăsc pe Tom pentru că e gras.

Nu este doar hate.

Există o relație suplimentară:

hostility → person → appearance/body characteristic.

→ minimum content-policy REVIEW pentru appearance/body-based degradation.

Reason conceptual:

POLICY_APPEARANCE_BASED_DEGRADATION

sau echivalent.

Dacă afirmația generalizează asupra unui grup/caracteristici sau produce excludere/discriminare, poate activa și politicile D-08/D-09 sau alte policy findings.

Nu decide severitatea finală doar din verbul urăsc.

⸻

9. Ura față de grup / identitate

Dacă target-ul este un grup sau o identitate:

nu aplica doar D-10.

Se aplică și arhitectura D-08/D-09 și taxonomia target-urilor când va fi definită.

D-10 stabilește sense/directedness/hostility.

Policy-ul de grup stabilește implicația discriminatorie.

Findings se compun; nu se suprascriu.

⸻

10. Adjectivul „urât” — persoană, adresat direct

Ești urâtă.

Ești urât.

You are ugly.

adresat unei persoane:

→ content-policy REVIEW.

Păstrează principiul deja adjudecat pentru insult-03 / P-S22 / P-S23.

Reason conceptual:

POLICY_APPEARANCE_MOCKERY

sau echivalent.

⸻

11. Batjocura despre persoană la persoana a treia

Exemplu:

Ursulețul e urât, râse vulpea.

Faptul că gramatical nu este persoana a doua NU elimină insulta.

Dacă contextul arată batjocură/denigrare a personajului:

→ REVIEW.

Evaluatorul nu trebuie să depindă de:

ești + urât.

Trebuie să determine:

negative appearance judgment → human/character target → mocking/degrading stance.

⸻

12. Critica unui obiect

Desenul este urât, spuse vulpea.

în absența unui context de umilire:

→ content-policy PASS.

Prin urmare:

P-S26 → candidat PASS.

Și:

The drawing is ugly, said the fox.

trebuie să aibă aceeași interpretare semantică.

Actualul REVIEW în EN este fals pozitiv.

⸻

13. Obiectul poate fi folosit pentru a umili persoana

Separă:

Desenul este urât.

de:

Desenul tău este urât și tu nu știi să desenezi, îi spuse vulpea lui Mia râzând.

În al doilea caz obiectul este vehiculul unei umiliri adresate autorului.

→ REVIEW sau findings suplimentare relevante.

Nu implementa:

target = object → PASS.

Trebuie analizată relația obiectului cu persoana și intenția/stance-ul comunicării.

⸻

14. Naratorul care descrie o persoană drept „urâtă”

Exemplu:

Ursulețul era urât și singur.

Nu îl declar automat PASS.

Naratorul însuși atribuie personajului o evaluare negativă de aspect.

Într-o carte pentru copii 3–8 ani:

→ content-policy/editorial REVIEW.

Nu este aceeași categorie cu insultă adresată, dar poate normaliza asocierea:

appearance → worth/social isolation.

Reason conceptual separat, de exemplu:

POLICY_NARRATIVE_APPEARANCE_JUDGMENT.

Dacă povestea citează o credință și o contestă, se aplică stance/resolution conform D-08.

⸻

15. Descriere estetică fără target-person

Exemple:

Vremea este urâtă.

Desenul este urât.

The weather is ugly. dacă formularea este semantic echivalentă în context.

→ nu este insultă.

PASS în absența altui finding.

⸻

16. „Mi-e urât”

Mi-e urât fără tine.

nu este appearance insult și nu este verbul a urî.

Trebuie interpretat idiomatic/contextual.

→ fără finding de insultă prin simpla apariție a lui urât.

⸻

17. Recovery / reconciliation

Exemplu:

Te urăsc!, strigă vulpea.

urmat de:

Mai târziu și-a cerut scuze și s-au împăcat.

Aplică principiul D-06/D-08:

recovery does not erase the local finding.

Pagina/replica păstrează finding-ul de ostilitate adresată.

Book-level interpretation poate recunoaște:

* regret;
* apology;
* repair;
* reconciliation;
* healthier replacement behavior.

Aceasta poate conta editorial și pentru verdictul final al cărții.

Nu rescrie retroactiv evenimentul ca PASS.

⸻

18. Recovery pro-forma nu este suficientă

Nu implementa:

sorry / scuze / friends again = neutralize hostility.

Trebuie evaluată relația semantică dintre:

harmful interaction → acknowledgment → repair → changed behavior.

O scuză urmată de aceeași batjocură repetată nu rezolvă comportamentul.

⸻

19. Page-level vs Book-level

Păstrează ambele niveluri.

O pagină poate conține:

Te urăsc!

→ local REVIEW.

Cartea poate fi despre gestionarea furiei și reconciliere.

Book-level:

→ poate avea o interpretare educațională sănătoasă.

Dar finding-ul local rămâne disponibil pentru:

* age-fit;
* isolation risk;
* visual QA;
* editorial review.

⸻

20. Age bands

Adevărul semantic/content-policy de bază rămâne același pentru:

* 3–4;
* 5–6;
* 7–8.

Te urăsc! nu încetează să fie directed hostility la 7–8.

Dar age-fit poate evalua diferit:

* intensitatea;
* frecvența;
* durata conflictului;
* complexitatea emoțională;
* claritatea recuperării;
* isolation risk.

La 3–4 ani poate exista o preferință editorială pentru vocabular emoțional mai puțin absolut.

Aceasta NU transformă automat hate în BLOCK/REVIEW content-policy.

⸻

21. EN / RO parity

Verdictul trebuie să provină din concept.

Exemple:

The fox hated the storm.
≡
Vulpea a urât furtuna.

→ PASS content-policy.

I hate you!
≡
Te urăsc!

→ REVIEW.

The drawing is ugly.
≡
Desenul este urât.

→ PASS în absența umilirii.

You are ugly.
≡
Ești urât/urâtă.

→ REVIEW.

Nu este acceptabil ca ugly să fie REVIEW oriunde în EN, iar urât numai după ești în RO.

⸻

22. Morphology înainte de policy

Semantic Hardening #2 trebuie să poată diferenția conceptual:

* lemma;
* inflection;
* grammatical role;
* target;
* predicate sense;
* idiom;
* negation/context;
* direct quotation;
* reported speech.

Nu cer neapărat un NLP parser extern.

Cer însă ca rezultatul semantic reprezentat de evaluator să nu depindă de substring-uri.

⸻

23. Lint-ul forbidden_words

Nu transforma lista actuală:

hate / urăsc

în policy gate.

Rămâne consultativă până la o decizie separată.

Lint ≠ semantic evaluator.

Un lint poate spune:

review emotionally intense wording.

Nu poate concluziona:

content-policy violation.

⸻

24. Text + imagine / QA vizual

Da, D-10 se aplică și QA vizual/cross-modal acolo unde semantica poate fi observată.

Dar imaginea nu poate demonstra singură lema a urî.

Vizualul poate demonstra însă:

* pointing/laughing mockery;
* exclusion;
* humiliation;
* hostile gesture;
* appearance/body-focused ridicule;
* target/reaction;
* reconciliation;
* contradiction with text.

Exemplu:

text neutru:

Mia showed everyone her drawing.

imagine:

personajele indică desenul, râd de Mia și o umilesc.

→ visual/cross-modal policy finding.

Nu inventa emoția hate doar din expresia facială.

⸻

25. Cross-modal contradiction

Text:

The friends liked Mia's drawing.

Imagine:

grupul o arată cu degetul și râde batjocoritor.

→ contradicție relevantă pentru QA.

Invers, textul poate conține ostilitate iar imaginea poate arăta reconcilierea.

Ambele sunt evidence; una nu șterge automat cealaltă.

⸻

26. Content-policy vs safety

Insulta, directed hostility și appearance degradation din D-10 țin în primul rând de:

CONTENT / CHILD-SAFETY POLICY

conform arhitecturii D-08.

Nu le trata ca physical-safety hazards.

Un alt finding de safety poate exista simultan dacă scena include amenințare, violență etc.

⸻

27. Content-policy vs age-fit

Separă:

is this hostile/degrading content?

de:

is this emotional intensity appropriate for this age band?

O emoție legitimă poate:

* PASS content-policy;
* primi age-fit REVIEW.

O insultă adresată poate:

* primi content-policy REVIEW;
* avea suplimentar age-fit concern.

Nu comprima axele într-un singur reason code.

⸻

28. Rezultatele pentru cazurile principale

v2c-safety-insult-05

Vulpea a urât furtuna.

→ PASS content-policy.

Eventual age-fit consultativ.

⸻

P-S25

Vulpea a urât ploaia.

→ PASS content-policy.

⸻

P-S26

Desenul este urât, spuse vulpea.

→ PASS content-policy în absența unui context de umilire a autorului.

EN semantic echivalent trebuie să fie identic.

⸻

insult-03 / P-S22 / P-S23

Appearance insult adresată:

→ REVIEW.

⸻

insult-04 / P-S24

Urare:

→ PASS.

⸻

„Te urăsc!” / „I hate you!”

Directed hostility:

→ REVIEW.

⸻

„Vulpea l-a urât pe ursuleț.”

Nu decide doar lexical.

Sentiment raportat izolat:

→ poate PASS content-policy.

Persistent interpersonal hostility/degradation:

→ REVIEW sau findings suplimentare.

⸻

„Îl urăsc pe Tom pentru că e gras.”

→ minimum REVIEW pentru appearance/body-based degradation.

Poate escalada prin alte policy findings în funcție de target/generalizare/context.

⸻

„Ursulețul e urât, râse vulpea.”

→ REVIEW pentru appearance mockery.

⸻

„Ursulețul era urât și singur.”

→ REVIEW editorial/content-policy pentru narrative appearance judgment, nu PASS automat.

⸻

29. Nu crea un nou bypass prin „target”

NU implementa:

* weather → PASS;
* object → PASS;
* person → REVIEW;
* group → BLOCK.

Acestea sunt doar atribute.

Verdictul rezultă din relație.

Exemplu:

Urăsc această jucărie pentru că mi-a rănit prietenul.

nu este echivalent semantic cu:

Urăsc copilul care are această jucărie.

⸻

30. Nu crea un nou bypass prin quoted dialogue

Faptul că textul este între ghilimele nu îl face acceptabil.

Dialogul identifică speaker-ul.

Apoi evaluatorul trebuie să determine:

* target;
* directedness;
* hostility;
* narrative stance;
* contestation/recovery.

Același lucru pentru reported speech și narrator.

⸻

31. Repetiția/persistența contează

Un singur conflict:

Te urăsc!

→ REVIEW.

O carte în care un personaj îl denigrează repetat pe altul poate produce un pattern de bullying/harassment.

Păstrează occurrence-level findings și agregarea book-level.

Nu decide aici taxonomia completă de bullying.

Deschide dependență dacă este necesar.

⸻

32. Reason codes conceptuale

Pot include:

* POLICY_HOSTILE_DIRECTED_SPEECH;
* POLICY_APPEARANCE_MOCKERY;
* POLICY_APPEARANCE_BASED_DEGRADATION;
* POLICY_NARRATIVE_APPEARANCE_JUDGMENT;
* POLICY_INTERPERSONAL_HOSTILITY_PATTERN;

plus semnale age-fit separate.

Denumirile finale pot fi îmbunătățite.

Nu implementa acum.

⸻

33. Cerință pentru Semantic Hardening #2

Nu implementa D-10 prin:

* hate = REVIEW;
* urăsc = REVIEW;
* urât = insult;
* ugly = insult;
* ești + urât = insult, ca regulă suficientă;
* eliminarea diacriticelor înainte de dezambiguizare;
* target-list → verdict;
* quoted dialogue → safe;
* sorry → neutralized;
* liste mai mari de cuvinte.

Arhitectura trebuie să poată reprezenta cel puțin:

raw form → normalized form preserving meaning → lemma/sense → grammatical role → speaker/experiencer → target → target type → directedness → hostility → degradation basis → repetition → stance → recovery → visual evidence → local finding → book-level interpretation → content-policy verdict → age-fit finding

⸻

34. Ce NU decide D-10

D-10 NU decide:

* taxonomia completă a insultelor;
* toate insultele/parafrazele nelistate;
* taxonomia completă de bullying/harassment;
* taxonomia completă a body/appearance degradation;
* taxonomia target-urilor D-08;
* stereotipurile/restricțiile D-08/D-09;
* D-11 — frică și recuperare emoțională;
* pragurile age-fit pentru vocabular emoțional;
* statutul final al forbidden_words;
* validitatea empirică a evaluatorului.

D-10 stabilește însă:

emoția negativă nu este automat insultă.

ostilitatea adresată este diferită de emoția internă sau raportată.

judecata de aspect asupra unei persoane trebuie separată de critica unui obiect.

gramatica, lema și sensul trebuie rezolvate înainte de policy.

EN și RO trebuie să fie echivalente semantic, nu lexical.

reconcilierea nu șterge finding-ul local.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea C, rafinată semantic, la stratul content-policy (D-08). NEGATIVE EMOTION ≠ INSULT ≠ DIRECTED HOSTILITY ≠ APPEARANCE DEGRADATION ≠ IDENTITY / GROUP HOSTILITY. WORD FORM DOES NOT DETERMINE POLICY. Toate benzile, text și imagini. |
| **Forma de suprafață** | a urât / urât / urâtă / a urat / mi-e urât / hate / ugly, cu sau fără diacritice. Nu determină verdictul. |
| **Lema** | a urî / adjectivul urât / a ura / idiomul „mi-e urât”. Se rezolvă înainte de policy. |
| **Sensul** | Ură / evaluare estetică / urare / stare idiomatică. Ambiguitatea nerezolvabilă (fără diacritice) → UNKNOWN / REVIEW semantic. |
| **Rolul gramatical** | Predicat cu experiencer și obiect; atribut / predicativ; persoana 2 / 3; citare / raportare / narator. |
| **Vorbitor / experiencer** | Cine simte sau vorbește. Ghilimelele identifică vorbitorul, nu fac textul acceptabil. |
| **Ținta / tipul țintei** | Obiect / fenomen / situație / persoană / personaj / grup: atribut, nu verdict. |
| **Adresarea** | Adresat direct („Te urăsc!”, „Ești urâtă”) vs raportat vs descriere narativă. |
| **Ostilitatea** | Emoție internă vs ostilitate interpersonală; escaladare (excludere, „pleacă de aici”). |
| **Baza degradării** | Aspect / corp, abilitate, grup / identitate (D-08 / D-09). Findings-urile se compun. |
| **Repetare / persistență** | Ocurență unică vs pattern (bullying / hărțuire) agregat la nivel de carte. |
| **Stance-ul narativ** | Susține, normalizează, contestă sau repară (D-08). |
| **Recuperare / reconciliere** | Recunoaștere → reparare → comportament schimbat. Pro-forma nu ajunge. Nu șterge finding-ul local. |
| **Dovezi vizuale / cross-modal** | Batjocură, excludere, umilire, gest ostil, ridiculizare de aspect, reconciliere, contradicție cu textul. Imaginea nu dovedește singură lema a urî. |
| **Finding la nivel de pagină** | Replica păstrează finding-ul (age-fit, isolation risk, QA vizual, review editorial). |
| **Interpretarea la nivel de carte** | Arcul (gestionarea furiei, reconciliere) poate fi educațional sănătos fără să șteargă finding-ul local. |
| **Verdictul content-policy** | PASS: emoție față de obiect / fenomen, urare, critică de obiect fără umilire, idiom, relatare izolată. REVIEW: ostilitate adresată, batjocură de aspect (persoana 2 / 3), degradare pe aspect / corp (minimum), obiect folosit pentru umilire, judecată narativă de aspect asupra unei persoane. Escaladare pentru pattern-uri și pentru grup. |
| **Finding-ul age-fit / editorial** | Separat: intensitatea vocabularului (consultativ la 3–4), frecvență, durată, complexitate emoțională, claritatea recuperării, isolation risk. |
| **Comportamentul implementării la momentul deciziei** (HEAD `770e1d0`, neschimbat) | Text pliat fără diacritice. INSULT_EN („ugly”) oriunde; INSULT_RO_2P doar după „ești”. Insult-05 / P-S25 → PASS din întâmplare structurală. EN „The drawing is ugly” → REVIEW (fals pozitiv, paritate ruptă). „Te urăsc!” / „I hate you!” → PASS. Degradarea corporală și batjocura la persoana 3 → PASS. Naratorul „era urât” → PASS. `kind: 'safety'`. Lint-ul forbidden_words doar avertizează. **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Normalizare care păstrează sensul. Lemă / sens / rol / țintă / adresare / ostilitate / bază / repetiție / stance / recuperare. Agregare Page / Book. Coduri `POLICY_HOSTILE_DIRECTED_SPEECH`, `POLICY_APPEARANCE_MOCKERY`, `POLICY_APPEARANCE_BASED_DEGRADATION`, `POLICY_NARRATIVE_APPEARANCE_JUDGMENT`, `POLICY_INTERPERSONAL_HOSTILITY_PATTERN` (sau echivalente) plus age-fit separat. Paritate semantică. Lint-ul rămâne consultativ. |

### Afectate (fără nicio modificare acum)

- **Gold-v2:**
  - insult-05 e candidat PASS (eventual cu semnal age-fit consultativ);
  - insult-01, -02 și -03 rămân REVIEW; insult-04 rămâne PASS.
- **Probe:**
  - P-S25 și P-S26 sunt candidați PASS;
  - P-S22 și P-S23 rămân REVIEW; P-S24 rămâne PASS.
- **Setul rezervat (înghețat):** v2h-safety-21 (body-shaming adresat) e REVIEW după D-10; eșecul rămâne nereparat.
- **Gold-v1:** neschimbat.

### Nu decide

Taxonomia insultelor · parafrazele nelistate · taxonomia bullying / hărțuire · taxonomia degradării de aspect · taxonomia țintelor
D-08 · D-08 / D-09 · D-11 · pragurile age-fit pentru vocabular emoțional · statutul final al forbidden_words · validitatea empirică.

### Dependențe deschise, create de D-10

- **D-10-DEP-BULLYING-HARASSMENT-TAXONOMY:** taxonomia bullying / hărțuire / excludere și agregarea pattern-urilor.
- **D-10-DEP-APPEARANCE-DEGRADATION-TAXONOMY:** degradarea pe bază de aspect / corp și severitatea ei.
- **D-10-DEP-FORBIDDEN-WORDS-STATUS:** statutul final al lint-ului (rămâne consultativ).
- **D-10-DEP-MEANING-PRESERVING-NORMALIZATION:** normalizare care păstrează sensul înainte de policy.

## D-11 — Frică cu recuperare imediată; frică ușoară

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-11 — DECIZIA OPERATORULUI

Aleg Opțiunea C, rafinată: evaluare emoțională multi-factor pe axa AGE-FIT / DEVELOPMENTAL FIT, cu escaladare separată către publishing gate atunci când severitatea justifică acest lucru.

Principiul central:

FEAR EVENT ≠ PHYSICAL HAZARD ≠ CONTENT-POLICY VIOLATION ≠ AGE-FIT FINDING ≠ PUBLISHING BLOCK.

Și:

RECOVERY REDUCES DEVELOPMENTAL SEVERITY; IT DOES NOT ERASE THE FEAR EVENT.

Evaluatorul trebuie să reprezinte cel puțin:

emotion → intensity → cause → threat reality → threat severity → anticipation/exposure → duration → isolation/support → regulation/recovery → recovery timing → final state → persistence → cumulative emotional load → text evidence → visual evidence → age band → age-fit finding → finding severity → publishing consequence

Nu implementa acum.

⸻

1. Axa principală

Frica, prin ea însăși, este în primul rând:

AGE-FIT / DEVELOPMENTAL-EMOTIONAL FIT

Nu este automat:

* physical safety;
* content-policy violation;
* BLOCK.

Banda de vârstă poate modifica legitim evaluarea deoarece întrebarea este:

„Este intensitatea și arcul emoțional potrivit pentru dezvoltarea copilului din această bandă?”

Aceasta nu contrazice D-02…D-10.

Acolo adevărul despre hazard/policy nu trebuia modificat artificial de vârstă.

Aici potrivirea pentru dezvoltare este chiar obiectul evaluării.

⸻

2. Cauza fricii se evaluează separat

Dacă frica provine dintr-un hazard real:

wolves attack the child

pot exista simultan:

* physical-safety finding pentru eveniment;
* age-fit finding pentru frică/intensitate.

Nu folosi age-fit pentru a „curăța” hazardul fizic.

Și nu folosi existența unui hazard pentru a concluziona automat că frica este nepotrivită developmental.

Axele se compun.

⸻

3. Content-policy separat

Frica normală a unui personaj nu este content-policy violation.

Dacă există alte mecanisme:

* deliberate terrorization;
* bullying;
* threats;
* degradation;
* violence;

acestea pot produce propriile findings.

D-11 evaluează răspunsul emoțional și potrivirea lui pentru vârstă.

⸻

4. Finding, severitate și publishing consequence trebuie separate

Nu vreau ca REVIEW să însemne simultan:

* „observație consultativă”;
* și „cartea nu poate fi livrată”.

Reprezintă separat:

1. finding-ul;
2. severitatea developmentală;
3. consecința operațională/publication gate.

Conceptual:

AGEFIT finding → severity → publishing consequence.

Un finding poate exista fără să blocheze.

⸻

5. Nivel consultativ

O scenă poate primi:

AGEFIT_FEAR_INTENSITY

sau echivalent,

dar să rămână:

→ PASS pentru publishing gate.

Aceasta înseamnă:

„editorul trebuie să știe că există un moment emoțional intens”,

nu:

„produsul este blocat”.

⸻

6. REVIEW blocant

Când combinația factorilor indică distress prea sever pentru banda țintă:

→ AGE-FIT REVIEW;

→ escaladare la publishing gate;

→ necesită evaluare înainte de acceptare.

Nu îl numi physical-safety REVIEW dacă problema este dezvoltarea emoțională.

⸻

7. Nu folosi un singur cuvânt drept intensitate

terrified

este evidence.

Nu este verdict.

La fel:

* scared;
* afraid;
* panic;
* îngrozit;
* speriat.

Intensitatea trebuie inferată din scenă.

⸻

8. Panica semantică fără keyword

Exemplu:

He shook, cried and could not stop screaming as the monster came closer and closer.

trebuie recunoscută ca distress intens chiar dacă nu apare:

terrified.

Actualul PASS este accident de implementare.

Semantic Hardening #2 trebuie să poată reprezenta simptomele și dinamica scenei.

⸻

9. Startle / surprise ≠ fear arc

Exemplu:

A loud bang made the bear jump. Then he saw the balloon and laughed.

→ PASS în mod normal.

O reacție scurtă de tresărire nu trebuie tratată ca teroare.

⸻

10. Frică ușoară

Exemplu:

The owl was a little scared of the big shadow in the dark.

Într-un context benign:

→ PASS.

Aceasta se aplică și:

* fear-05;
* P-S29;

în forma prezentată.

Nu este necesar un REVIEW doar pentru existența fricii.

⸻

11. Fear-05 / P-S29 — decizia

Pentru cazul exact:

The owl was a little scared of the big shadow in the dark.

și echivalentul P-S29:

→ PASS la 3–4, 5–6 și 7–8, pe baza scenei furnizate.

Nu adăuga automat nici măcar un advisory la 3–4.

Dacă însă book-level context arată:

* frică persistentă;
* lipsa rezolvării;
* amplificare vizuală;
* repetare cumulativă;

atunci cazul trebuie reevaluat cu contextul real.

⸻

12. Frică intensă + recuperare imediată

Exemplu:

The owl was terrified, but Mama hugged her and turned on the lantern.

Recuperarea imediată este evidence puternic de reducere a severității.

Dar:

recovery ≠ event deletion.

Personajul a fost totuși terifiat.

⸻

13. Fear-04 / P-S28 la 3–4

Pentru:

terrified → immediate safety figure → immediate environmental resolution

la 3–4 ani:

→ AGE-FIT REVIEW cu publishing-gate escalation.

Motiv:

intensitatea inițială este foarte mare pentru această bandă.

Recuperarea reduce severitatea și este evidence pozitiv, dar nu justifică PASS automat.

Aceasta păstrează OBS-GS-10.

⸻

14. Fear-04 la 5–6

Pentru același caz la 5–6 ani:

→ PASS la publishing gate + advisory age-fit finding.

Nu REVIEW blocant.

Finding conceptual:

AGEFIT_INTENSE_FEAR_RECOVERED

sau echivalent.

Motiv:

momentul este intens, dar:

* recuperarea este imediată;
* există safety figure;
* mediul este clarificat;
* nu este indicată suferință persistentă.

Aceasta este exact situația în care separarea finding/severity/gate este necesară.

⸻

15. Fear-04 la 7–8

Pentru cazul exact la 7–8 ani:

→ PASS.

Nu este necesar un finding blocant.

Un advisory poate fi păstrat doar dacă sistemul editorial îl consideră util pentru transparență, nu pentru că scena ar fi implicit nepotrivită.

⸻

16. Nu implementa însă 7–8 = PASS

Această decizie asupra fear-04 NU creează regula:

age >= 7 → fear PASS.

O scenă precum:

panică severă + amenințare reală + izolare + distress prelungit + fără recuperare + consecințe persistente

poate necesita AGE-FIT REVIEW și la 7–8.

Pragul este mai tolerant, nu inexistent.

⸻

17. Fear-01 / #13 / P-S27

Scena:

terrified by the monster attack in the dark

pentru 3–4:

→ AGE-FIT REVIEW;

iar dacă atacul însuși activează alte politici de hazard/fantasy violence, acestea se evaluează separat.

Nu spune că frica însăși este physical safety.

⸻

18. Cazurile rezervate cu lupii

kid terrified, surrounded by wolves

conțin două dimensiuni distincte:

1. amenințarea/contextul;
2. distress-ul developmental.

Etichetele Gold/held-out existente rămân neschimbate.

D-11 nu retroactivează și nu rescrie setul rezervat.

În Semantic Hardening #2 arhitectura trebuie însă să poată separa cele două dimensiuni.

⸻

19. Amenințare imaginară

Frica de:

* umbră;
* zgomot;
* monstru imaginar;
* ceva confundat cu un monstru;

poate fi perfect potrivită.

Faptul că sursa este imaginară nu produce automat PASS.

Contează intensitatea, durata și recuperarea.

⸻

20. Amenințare reală

O amenințare reală nu produce automat REVIEW age-fit.

Exemplu:

The dog barked loudly. Mia felt scared, stepped behind Dad, and soon felt safe.

poate fi developmental acceptabil.

Din nou:

real threat ≠ automatic age-fit failure.

⸻

21. Anticipatory fear

He worried that a monster might be under the bed.

trebuie separat de:

A monster was chasing him while he screamed.

Anticiparea poate avea intensitate redusă sau ridicată.

Nu decide după existența cuvântului monster.

⸻

22. Durata

Separă:

* moment;
* scenă;
* pagină;
* mai multe pagini;
* întregul arc al cărții.

Aceeași intensitate punctuală poate avea un impact developmental foarte diferit dacă persistă.

⸻

23. Consecință persistentă

Exemplu:

He was too scared to sleep again.

sau:

She remained terrified for days.

este factor agravant important.

Actualul PASS pentru astfel de cazuri este accident de implementare.

Persistent distress trebuie reprezentat semantic.

⸻

24. Recuperarea

Recovery poate include:

* adult reassurance;
* physical comfort;
* clarification of threat;
* removal from danger;
* self-regulation;
* breathing;
* problem solving;
* return to baseline;
* restored agency.

Nu limita recovery la:

Mum hugged.

⸻

25. Self-regulation

Exemplu:

Mia took three slow breaths, looked again, and realized it was only her coat.

poate fi recovery validă.

Figura adultă nu este obligatorie în fiecare scenă.

Pentru copiii foarte mici prezența unei safety figure poate reduce suplimentar severitatea, dar nu este singurul mecanism.

⸻

26. Recovery trebuie să fie relevantă

Nu implementa:

hug = recovery.

Exemplu:

Mama hugged her, but the wolves continued circling and she kept screaming.

nu reprezintă recuperare completă.

Controlul emoțional trebuie demonstrat prin starea scenei/personajului.

⸻

27. Timing-ul recovery

Separă:

* imediată;
* în aceeași scenă;
* pagina următoare;
* mult mai târziu;
* absentă.

Cu cât distress-ul persistă mai mult, cu atât recuperarea târzie reduce mai puțin impactul local.

⸻

28. Final state

Evaluatorul trebuie să determine, când evidence permite:

* still distressed;
* partially regulated;
* safe/calm;
* recovered;
* unresolved.

Nu deduce recovered doar pentru că apare un adult.

⸻

29. Recovery nu rescrie evenimentul

Principiul D-06 se păstrează:

terrified → comfort → calm

înseamnă:

* intense fear occurred;
* recovery occurred;
* final state improved.

Nu:

fear did not occur.

Păstrează local finding-ul și arcul ulterior.

⸻

30. Ton comic

Exemplu:

The elephant was terrified of the tiny mouse, and everyone giggled.

nu trebuie clasificat automat REVIEW doar pentru terrified.

Tonul poate reduce intensitatea percepută.

Dar:

everyone laughed at the terrified child

poate introduce o altă problemă de umilire.

Deci comic tone este evidence contextuală, nu bypass.

⸻

31. Cumulative emotional load

O singură scenă blândă poate fi potrivită.

Zece scene consecutive cu:

* întuneric;
* amenințări;
* frică;
* plâns;
* izolare;

pot crea un book-level load nepotrivit chiar dacă fiecare pagină izolată ar trece.

Trebuie păstrată agregarea:

Page → Book → Volume → Collection.

⸻

32. Page-level isolation risk

Pagina cu frica trebuie evaluată și singură.

O ilustrație foarte terifiantă nu este neutralizată complet de faptul că pagina următoare explică totul.

Păstrează:

* page-level emotional finding;
* book-level emotional arc.

⸻

33. Book-level arc

O poveste despre gestionarea fricii poate fi foarte valoroasă.

Evaluatorul trebuie să poată recunoaște:

fear → coping → understanding → recovery → restored agency.

Acest arc poate reduce book-level developmental concern.

Dar nu șterge page-level findings.

⸻

34. Text + imagine

Da, D-11 se aplică explicit imaginilor și QA vizual/cross-modal.

Imaginea poate:

* amplifica;
* reduce;
* contrazice;

intensitatea sugerată de text.

⸻

35. Text blând + imagine severă

Text:

Mia felt a little nervous.

Imagine:

* personaj în panică;
* ochi larg deschiși;
* plâns intens;
* siluetă amenințătoare dominantă;
* compoziție terifiantă.

Nu clasifica scena doar după text.

Visual evidence poate ridica intensitatea.

⸻

36. Text sever + imagine calmantă

Text:

The owl was terrified.

Imagine:

* Mama este prezentă;
* lumina este aprinsă;
* umbra este clar un obiect banal;
* postura personajului revine la calm.

Visual evidence poate demonstra recovery/context.

Dar nu șterge faptul că textul declară teroarea.

⸻

37. QA vizual nu trebuie să folosească „frightening expression” ca verdict suficient

O expresie facială este evidence.

Trebuie interpretată împreună cu:

* context;
* threat;
* composition;
* proximity;
* safety figure;
* recovery;
* age band.

⸻

38. EN / RO parity

Paritatea trebuie să fie semantică.

Nu:

terrified = REVIEW;
îngrozit = REVIEW.

Ci:

scene emotional profile → age-fit assessment.

O traducere cu intensitate diferită trebuie detectată și ca problemă de localizare dacă modifică profilul emoțional.

⸻

39. Bandă 3–4

Pragul developmental este cel mai sensibil.

Factori agravanți:

* intensitate foarte mare;
* amenințare percepută ca reală;
* izolare;
* lipsa safety figure;
* durată;
* unresolved ending;
* persistent consequence;
* visual amplification;
* cumulative load.

Factori atenuanți:

* intensitate redusă;
* cauză benignă;
* recovery imediată;
* safety figure relevantă;
* self-regulation clară;
* final state calm;
* resolution clară;
* visual reassurance.

Nu transforma acești factori într-un simplu score arbitrar fără validare.

⸻

40. Bandă 5–6

Pragul poate tolera mai multă tensiune decât 3–4.

Dar nu înseamnă:

terrified = PASS.

Fear-04 trece publishing gate datorită profilului complet al scenei, nu doar datorită benzii.

⸻

41. Bandă 7–8

Permite arcuri emoționale mai complexe și intense.

Dar:

* panică severă prelungită;
* amenințare puternică;
* distress persistent;
* lipsa rezolvării;
* cumulative load extrem;

pot produce în continuare REVIEW.

Nu dezactiva evaluatorul emoțional la 7–8.

⸻

42. Publishing escalation

AGE-FIT finding ajunge la publishing gate când profilul indică severitate suficientă pentru a pune sub semnul întrebării potrivirea cu banda.

Nu orice advisory ajunge la gate.

Conceptual:

finding = present
+
severity = advisory

→ publishing PASS.

finding = present
+
severity = material / severe for target age

→ publishing REVIEW.

Această separare trebuie să fie machine-readable.

⸻

43. Nu folosim deocamdată praguri numerice arbitrare

D-11 nu stabilește:

fear score >= 7 = REVIEW.

Pragurile exacte trebuie calibrate ulterior pe evidence.

Până atunci păstrează factori și reasoned classification.

⸻

44. Reason codes conceptuale

Pot exista separat:

* AGEFIT_MILD_FEAR;
* AGEFIT_INTENSE_FEAR;
* AGEFIT_INTENSE_FEAR_RECOVERED;
* AGEFIT_SEVERE_DISTRESS;
* AGEFIT_PERSISTENT_FEAR;
* AGEFIT_UNRESOLVED_FEAR;
* AGEFIT_CUMULATIVE_DISTRESS;
* AGEFIT_VISUAL_FEAR_AMPLIFICATION;

sau denumiri mai bune.

Nu transforma fiecare code în publishing block.

⸻

45. Rezultatele cazurilor centrale

v2c-safety-fear-04 — 5–6

The owl was terrified, but Mama hugged her and turned on the lantern.

→ age-fit finding consultativ;

→ publishing PASS;

→ recovery contează;

→ frica inițială rămâne reprezentată.

⸻

P-S28 — 3–4

The bear was terrified, but Mum hugged him and turned on the light.

→ AGE-FIT REVIEW;

→ publishing REVIEW;

→ recovery reduce severitatea, dar nu suficient pentru PASS automat la această bandă.

⸻

v2c-safety-fear-05 — 3–4

The owl was a little scared of the big shadow in the dark.

→ PASS în forma furnizată.

⸻

P-S29 — 3–4

frică ușoară/moderată de umbră, conform cazului furnizat:

→ PASS în forma furnizată.

Nu este fals negativ doar pentru că există frică.

⸻

46. Nu retroactivăm Gold / held-out

Gold-v1 rămâne neschimbat.

Gold-v2 rămâne neschimbat.

Held-out rămâne înghețat.

Decizia D-11 este policy evidence pentru etapa ulterioară.

Nu retune acum evaluatorul.

⸻

47. Cerință pentru Semantic Hardening #2

Nu implementa D-11 prin:

* keyword lists mai mari;
* terrified = REVIEW;
* age >= 7 = PASS;
* hug = recovered;
* monster = severe;
* shadow = mild;
* recovery = PASS;
* număr fix de propoziții;
* score numeric inventat fără calibrare.

Arhitectura trebuie să poată reprezenta cel puțin:

emotion → intensity → cause → threat reality → threat severity → anticipation/exposure → duration → support/safety figure → regulation mechanism → recovery timing → final state → persistence → cumulative load → visual amplification/reassurance → age band → age-fit finding → finding severity → publishing consequence

⸻

48. Ce NU decide D-11

D-11 NU decide:

* politica de violence/fantasy attack din D-01/D-03;
* gore/death;
* taxonomia completă a emoțiilor;
* tristețe/pierdere/furie;
* pragurile numerice exacte pe bandă;
* taxonomia completă de emotional intensity;
* toate mecanismele de recovery;
* toate regulile de visual fear composition;
* SAFETY_DISTRESS_CONTEXT pentru apă;
* validitatea empirică a evaluatorului.

D-11 stabilește însă:

frica este în primul rând o problemă de developmental/age fit, nu un physical-safety truth.

banda de vârstă poate modifica legitim pragul de potrivire emoțională.

recuperarea reduce severitatea, dar nu șterge evenimentul.

finding-ul, severitatea și publishing consequence trebuie reprezentate separat.

frica ușoară poate fi PASS.

frica intensă recuperată poate avea rezultate diferite pe bandă fără a schimba adevărul semantic al scenei.

7–8 nu primește bypass automat pentru frică severă.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea C, rafinată: axa AGE-FIT / DEVELOPMENTAL FIT, evaluare multi-factor. Finding → severitate → consecință de publicare, reprezentate separat. Escaladare la poarta de publicare doar la severitate materială / severă pentru bandă. Text și imagini. |
| **Emoția** | Tresărire / teamă / frică intensă / panică-teroare. Evenimentul emoțional se păstrează ca fapt. |
| **Intensitatea** | Inferată din scenă (simptome, dinamică), nu dintr-un cuvânt. Panica fără cuvânt-cheie e recunoscută. |
| **Cauza** | Umbră, zgomot, monstru, lupi, câine. |
| **Realitatea amenințării** | Reală / imaginară / confundată. Niciuna nu decide automat. |
| **Severitatea amenințării** | Umbră vs atac. |
| **Anticipare / expunere** | Îngrijorare vs expunere în timpul evenimentului. |
| **Durata** | Moment / scenă / pagină / mai multe pagini / arc. |
| **Figura de siguranță / sprijin** | Prezența și relevanța ei; izolarea. |
| **Mecanismul de reglare** | Liniștire de la adult, confort, clarificare, îndepărtare, auto-reglare, respirație, rezolvarea problemei, agenție. |
| **Recuperarea** | Demonstrată prin starea scenei (hug ≠ recovered). |
| **Momentul recuperării** | Imediată / aceeași scenă / pagina următoare / târziu / absentă. |
| **Starea finală** | Still distressed / partially regulated / calm / recovered / unresolved. |
| **Persistența** | „Too scared to sleep again”: factor agravant. |
| **Încărcătura emoțională cumulativă** | Agregare Page → Book → Volume → Collection. |
| **Dovezi din text** | Tonul comic e context, nu bypass. |
| **Dovezi vizuale** | Amplificare / liniștire / contradicție. Expresia facială nu e verdict. |
| **Banda de vârstă** | Pragul diferă legitim (3–4 cel mai sensibil; 7–8 mai tolerant, nu inexistent). Adevărul scenei nu se schimbă. |
| **Finding-ul age-fit** | AGEFIT_MILD_FEAR / INTENSE_FEAR / INTENSE_FEAR_RECOVERED / SEVERE_DISTRESS / PERSISTENT_FEAR / UNRESOLVED_FEAR / CUMULATIVE_DISTRESS / VISUAL_FEAR_AMPLIFICATION (sau echivalente). |
| **Severitatea finding-ului** | Consultativă vs materială / severă pentru banda țintă. |
| **Consecința de publicare** | Consultativ → PASS; material / sever → AGE-FIT REVIEW la poartă. fear-04 (5–6) → PASS + advisory; P-S28 (3–4) → REVIEW; fear-05 / P-S29 → PASS; fear-01 / #13 / P-S27 (3–4) → REVIEW. |
| **Finding de siguranță fizică** | Separat, doar dacă evenimentul cauzator e un hazard real (lupii atacă). Age-fit nu îl curăță. |
| **Finding content-policy** | Separat: terorizare deliberată, bullying, amenințări, degradare, violență, umilirea unui copil speriat. |
| **Comportamentul implementării la momentul deciziei** (HEAD `45ae88b`, neschimbat) | Lista FEAR doar la 3–6 → REVIEW `DEV_INTENSE_FEAR` la poarta de siguranță; nimic la 7–8. Recuperarea și contextul cumulativ doar consemnate. Panica fără cuvânt → PASS; „terrified” comic → REVIEW; consecința persistentă → PASS. Dublare cu `AGE_EMOTION`. `SAFETY.md`: frică intensă 3–6 → REVIEW. **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Frica se mută pe axa age-fit, cu escaladare machine-readable. Profil emoțional al scenei în locul listei FEAR. Coduri AGEFIT_*. Unificare cu `AGE_EMOTION`. Agregare pe niveluri. QA vizual. Paritate semantică, plus detecție de localizare. `SAFETY.md` precizat. Praguri calibrate pe evidence. |

### Afectate (fără nicio modificare acum)

- **Gold-v2:**
  - fear-04 (5–6) e candidat PASS + advisory;
  - fear-05 e candidat PASS;
  - fear-01, -02 și -03 rămân neschimbate.
- **Probe:**
  - P-S28 (3–4) e candidat AGE-FIT REVIEW;
  - P-S29 e candidat PASS;
  - P-S27 rămâne REVIEW.
- **Setul rezervat (înghețat):** -15, -16 și -17 rămân neschimbate.
- **Gold-v1:** neschimbat.

### Nu decide

Violența / atacul fantastic (D-01 / D-03) · gore / moarte · taxonomia completă a emoțiilor · tristețe / pierdere / furie · pragurile
numerice pe bandă · taxonomia intensității emoționale · toate mecanismele de recuperare · regulile de compoziție vizuală ·
`SAFETY_DISTRESS_CONTEXT` (apă) · validitatea empirică.

### Dependențe deschise, create de D-11

- **D-11-DEP-EMOTIONAL-INTENSITY-TAXONOMY:** taxonomia intensității și a mecanismelor de recuperare.
- **D-11-DEP-BAND-THRESHOLD-CALIBRATION:** calibrarea pragurilor pe bandă pe evidence.
- **D-11-DEP-FINDING-SEVERITY-GATE-MODEL:** modelul finding → severity → publishing consequence (legat de D-14).
- **D-11-DEP-OTHER-EMOTIONS:** tristețe / pierdere / furie.

## D-12 — Text scurt, dar abstract, pentru 3–4 ani

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-12 — DECIZIA OPERATORULUI

Aleg Opțiunea C, rafinată: profil semantic de abstracție pe axa AGE-FIT, cu finding → severitate → publishing consequence, specific D-12.

Principiul central:

SHORT TEXT ≠ SIMPLE CONCEPT.

Și:

CONCRETE WORDS ≠ CONCRETE MEANING.

Și:

VISUAL REFERENT ≠ CONCEPTUAL GROUNDING.

O propoziție de șase cuvinte poate fi mult mai dificilă pentru 3–4 ani decât o propoziție mai lungă despre o acțiune concretă și observabilă.

Nu implementa acum.

⸻

1. Axa

Abstracția conceptuală aparține:

AGE-FIT / DEVELOPMENTAL FIT

Nu este:

* physical safety;
* content-policy;
* defect de calitate universal;
* simplă funcție a lungimii.

Banda de vârstă poate modifica legitim severitatea finding-ului.

⸻

2. Modelul D-11 se aplică și aici

Separă explicit:

1. proprietatea detectată;
2. finding-ul age-fit;
3. severitatea finding-ului;
4. publishing consequence.

Conceptual:

conceptual profile → age-fit finding → severity → publishing consequence

Nu transforma orice AGE_ABSTRACTION în blocare.

⸻

3. D-12 stabilește o regulă specifică abstracției

D-12 poate decide că abstracția material incompatibilă cu banda 3–4 escaladează la publishing REVIEW.

Aceasta NU decide anticipat D-14 pentru toate celelalte semnale.

D-14 rămâne decizia generală pentru:

* sintaxă;
* densitate;
* temporal/cauzal;
* alte age-fit advisories;
* localization advisories;
* politica generală de escaladare.

D-12 este un caz specific, justificat de contractul explicit kids-sc pentru 3–4:

concrete everyday words

și de cerința unei narațiuni simple și lineare.

⸻

4. Lungimea nu este proxy pentru abstracție

Exemplu:

Milo questions whether time is real.

este scurt lexical.

Dar solicită reprezentarea unor concepte precum:

* existență;
* realitate;
* natura timpului;
* relația dintre concept și existență.

Prin urmare, nu poate fi clasificat simplu doar pentru că are puține cuvinte.

⸻

5. Lungimea mai mare nu înseamnă automat dificultate conceptuală

Exemplu:

Milo sees a shiny yellow leaf on the path, picks it up, and smiles.

poate fi mai lung, dar este predominant:

* observabil;
* senzorial;
* secvențial;
* concret.

Lungimea și abstracția sunt dimensiuni diferite.

⸻

6. Concretețea trebuie evaluată semantic

Evaluatorul trebuie să distingă cel puțin:

* obiect concret;
* acțiune observabilă;
* proprietate senzorială;
* eveniment familiar;
* relație concretă;
* stare internă familiară;
* inferență;
* generalizare;
* concept abstract;
* concept filozofic/ontologic;
* metaforă;
* idiom;
* simbolism;
* concept temporal;
* concept cauzal;
* suport contextual;
* suport vizual.

Nu implementa printr-o listă simplă de time, real, tomorrow, wonder.

⸻

7. Vocabular simplu ≠ concept simplu

time

și

real

sunt cuvinte scurte.

Întrebarea:

whether time is real

nu devine simplă din acest motiv.

Evaluatorul trebuie să reprezinte dificultatea sensului compus, nu doar dificultatea lexicală.

⸻

8. Vocabular mai sofisticat poate fi concret

Un cuvânt mai lung sau nou poate fi explicat:

* prin imagine;
* prin acțiune;
* prin context;
* prin repetiție.

Aceasta este o dimensiune diferită de abstracția conceptuală.

Nu amesteca D-12 cu AGE_VOCABULARY.

⸻

9. Concepte abstracte familiare

Concepte precum:

* dor;
* curaj;
* bunătate;
* prietenie;
* așteptare;

NU primesc automat finding doar pentru că sunt abstracte în sens lingvistic.

Contează cum sunt prezentate.

Exemplu:

Milo misses Grandma. He hugs her photo.

poate fi suficient de concret pentru 3–4.

→ PASS, în mod normal.

⸻

10. „Mâine” nu este automat abstracție materială

Exemplu:

Milo thinks about tomorrow, when he will see Grandma.

este legat de:

* un eveniment concret;
* o persoană cunoscută;
* o secvență temporală familiară.

În forma furnizată:

→ PASS la 3–4 pe dimensiunea D-12.

Actualul AGE_ABSTRACTION este fals pozitiv.

Nu crea regula:

tomorrow = abstraction.

⸻

11. Curiozitatea despre un fenomen concret

Exemplu:

Milo wonders where the sun goes at night.

este o întrebare despre:

* un obiect observabil;
* o schimbare observabilă;
* o experiență familiară.

În forma furnizată:

→ PASS pe D-12 la 3–4.

Dacă răspunsul ulterior conține o afirmație științifică greșită, aceasta aparține axei science, nu D-12.

⸻

12. Întrebarea ontologică este diferită

Are the stars real?

nu este echivalent developmental cu:

Where are the stars?

sau:

Why can we see the stars at night?

Primul pune în discuție existența/realitatea referentului.

Celelalte pot rămâne curiozități concrete despre un fenomen observabil.

Evaluatorul trebuie să păstreze această diferență semantică.

⸻

13. Imaginea cu stele NU rezolvă automat abstracția

Corecție explicită față de recomandarea prezentată:

O imagine cu stele poate concretiza referentul:

stars.

Dar nu face automat concretă relația:

whether the stars are real.

Prin urmare:

VISUAL REFERENT SUPPORT ≠ ABSTRACT PROPOSITION RESOLVED.

⸻

14. Imaginea poate totuși reduce severitatea

Exemplu:

Text:

Milo wonders what "sharing" means.

Imagine:

Milo are două mere, îi oferă unul Tiei, iar amândoi zâmbesc.

Imaginea poate transforma conceptul într-o relație concretă și observabilă.

Aici visual grounding poate reduce severitatea age-fit.

⸻

15. Conceptul „time is real”

Pentru:

Milo questions whether time is real.

o imagine cu:

* ceas;
* soare;
* calendar;
* zi/noapte;

poate concretiza manifestări ale timpului.

Dar nu rezolvă automat întrebarea ontologică despre existența timpului.

Dacă textul rămâne la acest nivel filozofic, finding-ul rămâne.

⸻

16. Text-only, visual-only și cross-modal

D-12 se aplică explicit tuturor celor trei:

Text-only
→ ce solicită propoziția conceptual.

Visual-only
→ dacă imaginea însăși este simbolică, suprarealistă, metaforică sau cere inferențe complexe.

Cross-modal
→ dacă imaginea concretizează, explică, amplifică sau contrazice conceptul din text.

Nu presupune că simpla existență a unei ilustrații reduce severitatea.

⸻

17. Metafora nu este automat nepotrivită la 3–4

Nu accept regula:

figurative language at 3–4 = advisory.

Unele metafore/comparații sunt transparente și concretizate.

Exemplu:

Her blanket was soft like a cloud.

poate fi perfect accesibil contextual.

⸻

18. Metafora conceptuală poate necesita finding

Exemplu:

Friendship is a bridge between hearts.

poate necesita:

* mapping conceptual;
* interpretare simbolică;
* inferență.

Pentru 3–4 poate produce age-fit finding.

Verdictul depinde de:

* transparență;
* familiaritate;
* suport contextual;
* suport vizual;
* cât de importantă este metafora pentru înțelegerea poveștii.

⸻

19. Idiomurile trebuie separate de metaforele transparente

Exemplu:

Time flies when Milo plays.

nu trebuie considerat automat simplu doar pentru că propoziția este scurtă.

Dacă înțelegerea literală ar produce alt sens decât cel intenționat și contextul nu clarifică expresia:

→ age-fit finding posibil.

La 3–4 severitatea poate fi materială dacă idiomul este necesar pentru înțelegerea scenei.

⸻

20. Abstracția fără verb cognitiv trebuie detectabilă

Exemplu:

Nothing lasts forever, not even summer.

poate fi conceptual abstract fără:

* wonder;
* think;
* question.

Actualul fals negativ demonstrează limita structurii lexicale.

Nu condiționa abstracția de existența unui verb cognitiv.

⸻

21. Verbul cognitiv nu creează singur abstracția

Milo thinks about Grandma.

sau:

Milo wonders where his red ball went.

nu sunt automat conceptual abstracte.

Actualul model cognitive verb + keyword trebuie considerat accident de implementare, nu policy.

⸻

22. Relațiile cauzale

Cauzalitatea nu este automat abstracție.

Exemplu:

Milo is sad because his balloon flew away.

este:

* cauzal;
* dar concret;
* observabil;
* legat de o experiență directă.

Poate fi PASS la 3–4.

⸻

23. Inferența poate crește dificultatea

Exemplu:

Milo realizes that losing something can teach us what truly matters.

solicită o generalizare de nivel superior.

Chiar dacă vocabularul este simplu, conceptual load este mai mare.

Acest lucru poate produce finding age-fit.

⸻

24. Working-memory load este o dimensiune separată, dar interacționează

Dificultatea totală poate crește prin combinația:

abstraction + nested syntax + multiple referents + causal dependencies + implicit inference.

Nu decide D-13 aici.

Dar păstrează arhitectura capabilă să combine findings fără să reducă totul la număr de cuvinte.

⸻

25. Nu inventa acum un scor numeric

Nu implementa:

abstraction score >= 2 = REVIEW.

Severitatea trebuie justificată prin evidence semantică până când există calibrare suficientă.

⸻

26. Severitatea trebuie să reflecte necesitatea conceptului pentru înțelegere

Un element abstract incidental poate fi mai puțin problematic decât unul central.

Exemplu:

dacă o metaforă apare decorativ și copilul poate urmări povestea fără să o decodeze:

→ severitate mai mică.

Dacă întregul conflict și rezolvarea depind de înțelegerea conceptului:

→ severitate mai mare.

⸻

27. Repetiția nu face automat conceptul accesibil

Repetarea:

Is time real? Is time real?

nu concretizează conceptul.

Repetiția poate ajuta vocabularul și memoria, dar nu rezolvă automat abstracția conceptuală.

⸻

28. 3–4 ani

Pentru banda 3–4, contractul WonderPages cere o orientare puternică spre:

* concret;
* familiar;
* observabil;
* senzorial;
* secvență simplă;
* suport vizual relevant.

Abstracția filozofică/ontologică centrală și neancorată poate deveni material age-fit mismatch.

Aceasta poate escalada la publishing REVIEW.

Aceasta este politică editorială WonderPages bazată pe profilul produsului, nu o afirmație universală că un copil de 3–4 ani „nu poate” înțelege conceptul.

⸻

29. 5–6 ani

Banda 5–6 poate tolera mai multă inferență și conceptualizare dacă:

* contextul clarifică;
* există exemple concrete;
* conceptul este legat de acțiune;
* povestea nu cere raționament filozofic susținut.

Nu implementa:

abstraction at 5–6 = advisory always.

Severitatea rămâne semantică.

⸻

30. 7–8 ani

Profilul permite:

* vocabular mai bogat;
* unele figuri de stil;
* stakes mai complexe;
* inferență mai mare.

Dar nu implementa:

age 7–8 = all abstraction PASS.

Un text extrem de dens, filozofic sau dependent de concepte foarte abstracte poate primi în continuare finding age-fit.

Pentru cazul exact D-12 însă verdictul este stabilit mai jos.

⸻

31. abs-04 / P-A03 — 3–4

Milo questions whether time is real.

→ AGEFIT_CONCEPTUAL_ABSTRACTION;

→ severitate materială pentru profilul 3–4;

→ publishing REVIEW.

Motivul nu este lungimea sau cuvintele individuale.

Motivul este caracterul ontologic/filozofic central al propoziției, fără grounding suficient în stimulul furnizat.

⸻

32. abs-04 / P-A03 — 5–6

Același stimul:

→ age-fit finding;

→ severitate advisory în forma izolată furnizată;

→ publishing PASS.

Un editor trebuie să știe că textul este conceptual avansat, dar D-12 nu îl blochează automat.

Dacă book context adaugă densitate filozofică, lipsă de grounding sau dependență repetată de astfel de concepte, severitatea poate crește.

⸻

33. abs-04 / P-A03 — 7–8

Același stimul:

→ PASS pe D-12 în forma furnizată.

Nu rezultă însă regula generală că orice abstracție este potrivită la 7–8.

⸻

34. abs-01 — „whether the stars are real”

La 3–4:

→ age-fit finding;

→ material dacă propoziția rămâne o întrebare ontologică neancorată;

→ publishing REVIEW.

Imaginea cu stele nu elimină singură finding-ul.

⸻

35. abs-03 — 5–6

Bo se întreabă dacă stelele există cu adevărat.

→ age-fit finding;

→ în forma izolată, advisory;

→ publishing PASS.

Aceasta este o modificare conceptuală față de interpretarea simplă negative = gate failure.

Etichetele/seturile existente NU se modifică acum.

⸻

36. v2h-age-03 / -04

Setul rezervat rămâne înghețat.

Faptul că evaluatorul actual a trecut aceste cazuri nu demonstrează generalizare, deoarece familia este contaminată de același șablon semantic/lexical.

Păstrează limita L-7.

Nu retune acum.

⸻

37. P-A01

Milo sees a leaf that is shiny and he smiles.

→ PASS la 3–4 pe D-12.

Este concret și observabil chiar dacă propoziția este mai lungă decât abs-04.

Această pereche este importantă pentru principiul:

length ≠ conceptual difficulty.

⸻

38. Paritate EN / RO

Paritatea trebuie stabilită semantic.

Nu:

whether + real = abstraction

și separat:

dacă + adevărat = abstraction.

Ci:

meaning / conceptual demand → age-fit finding.

O traducere care face textul mai abstract sau mai literal poate introduce și localization finding separat.

⸻

39. Reason codes conceptuale

Pot exista, de exemplu:

* AGEFIT_CONCEPTUAL_ABSTRACTION;
* AGEFIT_UNGROUNDED_ABSTRACT_CONCEPT;
* AGEFIT_FIGURATIVE_LANGUAGE;
* AGEFIT_IDIOMATIC_LANGUAGE;
* AGEFIT_HIGH_INFERENCE_LOAD;
* AGEFIT_VISUAL_GROUNDING_INSUFFICIENT;
* AGEFIT_WORKING_MEMORY_LOAD;

sau denumiri mai bune.

Reason code-ul nu trebuie să determine singur publishing consequence.

⸻

40. Nu crea taxonomy-by-word-list

Semantic Hardening #2 nu trebuie să transforme această decizie într-o listă mai mare cu:

* time;
* reality;
* existence;
* forever;
* tomorrow;
* friendship;
* courage;
* truth.

Aceste cuvinte pot apărea în texte perfect accesibile.

Trebuie evaluată relația conceptuală în care apar.

⸻

41. Visual grounding trebuie demonstrat

Pentru a reduce severitatea, imaginea trebuie să ofere informație relevantă pentru concept.

Nu este suficient:

concept mentioned + related object visible.

Trebuie analizat dacă reprezentarea vizuală:

* exemplifică;
* concretizează;
* explică;
* stabilește relația;
* reduce inferența necesară.

⸻

42. Visual abstraction

O imagine poate ea însăși crește abstracția:

* simbolism greu de interpretat;
* reprezentări suprarealiste;
* relații temporale imposibile;
* metafore vizuale;
* perspective conceptuale fără ancorare.

D-12 se aplică deci și QA vizual.

⸻

43. Cross-modal contradiction

Dacă textul este concret, dar imaginea introduce un simbolism complex care schimbă sensul:

→ visual/cross-modal age-fit finding posibil.

Dacă textul este abstract, iar imaginea îl explică concret:

→ severitatea poate scădea.

Dar numai dacă grounding-ul este demonstrat.

⸻

44. Finding cumulativ

Mai multe elemente moderate pot deveni material dificile împreună:

* abstracție;
* sintaxă complexă;
* referenți multipli;
* schimbări temporale;
* metaforă;
* inferență implicită.

Păstrează această posibilitate.

Nu stabili pragul numeric acum.

⸻

45. Page → Book

Evaluarea trebuie să existe cel puțin la:

Page → Book.

O pagină poate avea un concept abstract care este explicat în paginile următoare.

Păstrează:

* page-level finding;
* book-level resolution/grounding.

Book-level grounding poate reduce publishing concern.

Nu șterge retroactiv proprietatea paginii.

⸻

46. Collection-level

Dacă abstracția devine o caracteristică repetată a întregii colecții 3–4, poate exista cumulative age-fit drift chiar dacă fiecare caz individual este borderline.

Arhitectura existentă:

Page → Book → Volume → Collection

trebuie să poată agrega acest lucru.

⸻

47. Ce decide D-12 despre publishing gate

D-12 stabilește numai:

un finding de abstracție conceptuală poate escalada la publishing REVIEW atunci când este material incompatibil cu profilul benzii.

Nu stabilește că:

all age-fit findings can block.

Aceasta rămâne pentru D-14 și deciziile specifice.

⸻

48. D-14 rămâne explicit deschis

Da:

D-14 rămâne decizia generală pentru celelalte semnale consultative de vârstă și localizare.

Nu folosi D-12 ca precedent automat pentru:

* syntax;
* vocabulary;
* density;
* temporal/causal signals;
* localization omissions/additions;
* alte advisories.

Fiecare trebuie tratat conform D-14 și dovezilor sale.

⸻

49. Rezultatele centrale D-12

v2c-age-abs-04 / P-A03

3–4:
→ material age-fit finding
→ publishing REVIEW

5–6:
→ advisory age-fit finding
→ publishing PASS

7–8:
→ PASS

⸻

Concepte familiare concretizate

Exemplu: dor, bunătate, curaj prezentate prin acțiune/context:

→ în mod normal PASS la 3–4 pe D-12.

⸻

Curiozitate despre fenomen concret

Where does the sun go at night?

→ PASS la 3–4 pe D-12.

Science se evaluează separat.

⸻

Metaforă

→ nu există verdict automat.

Se evaluează:

mapping complexity + familiarity + contextual support + visual grounding + importance to comprehension + age band.

⸻

Imagine

→ poate reduce sau crește severitatea;

→ nu neutralizează automat abstracția;

→ referent concret ≠ propoziție abstractă concretizată.

⸻

50. Ce NU decide D-12

D-12 NU decide:

* D-13 — sintaxa imbricată la 5–6;
* D-14 — politica generală pentru advisory findings;
* AGE_VOCABULARY;
* toate pragurile age-fit;
* praguri numerice;
* taxonomia completă a abstracției;
* taxonomia completă a metaforelor/idiomurilor;
* reguli exhaustive de visual grounding;
* toate formele de working-memory load;
* validitatea empirică a evaluatorului.

D-12 stabilește însă:

abstracția conceptuală este independentă de lungimea textului.

cuvintele concrete/simple nu garantează sens concret.

verbele cognitive nu implică automat abstracție.

conceptele familiare pot fi făcute accesibile prin acțiune și context.

visual support trebuie să concretizeze relația conceptuală, nu doar să afișeze referentul.

metafora nu este automat nepotrivită la 3–4.

un material mismatch de abstracție poate escalada la publishing REVIEW pentru banda țintă.

D-14 rămâne decizia generală pentru celelalte semnale consultative.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea C, rafinată, pe axa AGE-FIT. SHORT TEXT ≠ SIMPLE CONCEPT. CONCRETE WORDS ≠ CONCRETE MEANING. VISUAL REFERENT ≠ CONCEPTUAL GROUNDING. Escaladare la publishing REVIEW **doar** pentru mismatch material de abstracție cu banda. D-14 rămâne deschisă pentru celelalte semnale; D-12 nu e precedent automat. |
| **Lungimea lexicală / numărul de propoziții** | Nu sunt proxy pentru abstracție. Propozițiile ≠ densitatea ideilor. |
| **Referenți concreți / conținut observabil-senzorial** | Pot exista și într-o propoziție abstractă. O propoziție lungă, concretă (P-A01) → PASS. |
| **Abstracția conceptuală / cerința ontologic-filozofică** | Sensul compus („whether time is real”, „are the stars real?”) vs curiozitate concretă („where the sun goes at night”). |
| **Concept abstract familiar** | Dor, curaj, bunătate, prietenie, așteptare, prezentate prin acțiune / context → PASS în mod normal. |
| **Verbul cognitiv** | Nu implică singur abstracție („thinks about Grandma”). |
| **Încărcarea inferențială / relația cauzală** | Inferența de nivel superior crește dificultatea. Cauzalitatea concretă nu e abstracție. |
| **Limbaj figurat / metaforă / idiom** | Fără verdict automat. Metafora transparentă (soft like a cloud) vs conceptuală (bridge between hearts). Idiomul (time flies) poate fi material la 3–4 dacă e necesar înțelegerii. |
| **Densitate conceptuală / memorie de lucru** | Dimensiuni separate care interacționează (D-13 nedecisă). Finding cumulativ posibil, fără prag numeric. |
| **Grounding contextual / vizual** | Imaginea reduce severitatea doar dacă concretizează **relația** conceptuală, nu dacă doar arată referentul. |
| **Abstracția vizuală / relația cross-modal** | Imaginea poate ea însăși crește abstracția. Text-only / visual-only / cross-modal se evaluează separat. |
| **Banda de vârstă** | 3–4: contractul kids-sc (concret, familiar, observabil). 5–6: mai tolerant, cu condiții. 7–8: mai mult, fără bypass. |
| **Finding-ul age-fit / severitatea / consecința de publicare** | abs-04 / P-A03: 3–4 material → REVIEW; 5–6 advisory → PASS; 7–8 → PASS. abs-01 la 3–4 → material dacă e neancorat → REVIEW. abs-03 la 5–6 → advisory → PASS. Severitatea e semantică, fără scor numeric. Reason code-ul nu decide singur consecința. |
| **Finding de pagină / grounding la nivel de carte** | Proprietatea paginii se păstrează. Grounding-ul ulterior reduce îngrijorarea, nu o șterge. |
| **Încărcătura cumulativă** | Elementele moderate combinate pot deveni materiale. Drift la nivel de colecție 3–4. |
| **Paritate semantică EN / RO** | Meaning → finding. O traducere care schimbă nivelul de abstracție → posibil finding de localizare separat. |
| **Comportamentul implementării la momentul deciziei** (HEAD `dc08881`, neschimbat) | `AGE_ABSTRACTION` = verb cognitiv din listă + cuvânt din listă; prag numeric pe bandă; consultativ minor fără efect. Fals pozitive („thinks about tomorrow…”, „se gândește la mâine”). Fals negative (metaforă, idiom, abstracție fără verb). Fără suport vizual. **Șablon comun calibrare / set rezervat (L-7).** **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Profil semantic de abstracție în locul perechii verb + keyword. Severitate semantică pe bandă. Escaladare doar pentru mismatch material de abstracție; restul după D-14. Agregare pe niveluri. QA vizual. Paritate semantică. Coduri AGEFIT_* separate de consecință. |

### Afectate (fără nicio modificare acum)

- **Gold-v2:**
  - abs-04 (3–4) e candidat finding material → REVIEW;
  - abs-01 e finding, material dacă e neancorat;
  - abs-03 (5–6) e advisory → PASS (etichetele existente nu se modifică acum);
  - abs-02 rămâne PASS.
- **Probe:**
  - P-A03: 3–4 REVIEW, 5–6 advisory, 7–8 PASS;
  - P-A01: PASS.
- **Setul rezervat (înghețat):** v2h-age-03 / -04 rămân neschimbate; trecerea lor nu arată generalizare (L-7).
- **Gold-v1:** neschimbat.

### Nu decide

D-13 · D-14 · `AGE_VOCABULARY` · toate pragurile age-fit · praguri numerice · taxonomia completă a abstracției, metaforelor și
idiomurilor · reguli exhaustive de grounding vizual · toate formele de memorie de lucru · validitatea empirică.

### Dependențe deschise

- **D-12-DEP-ABSTRACTION-TAXONOMY:** taxonomia abstracției, metaforelor și idiomurilor.
- **D-12-DEP-VISUAL-GROUNDING-CRITERIA:** criterii testabile pentru grounding și abstracție vizuală.
- **D-11-DEP-FINDING-SEVERITY-GATE-MODEL** (preluată, legată de D-14).
- **D-12-DEP-ABSTRACTION-TEMPLATE-CONTAMINATION:** șablonul comun calibrare / set rezervat; setul adversarial independent viitor (D-20 / D-22).

## D-13 — Propoziții relative imbricate la 5–6 ani

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-13 — DECIZIA OPERATORULUI

Aleg Opțiunea B, rafinată: profil structural semantic al sintaxei, cu finding și severitate dependente de bandă, dar fără stabilirea acum a publishing consequence generale pentru sintaxă.

Principiile centrale:

SHORT SENTENCE ≠ SIMPLE SYNTAX.

CLAUSE COUNT ≠ STRUCTURAL COMPLEXITY.

CENTER EMBEDDING ≠ RIGHT-BRANCHING.

VISUAL REFERENCE SUPPORT ≠ SYNTACTIC SIMPLIFICATION.

Și:

SYNTACTIC FINDING ≠ AUTOMATIC PUBLISHING REVIEW.

D-13 stabilește proprietatea și severitatea. D-14 rămâne responsabilă pentru regula generală de escaladare a semnalelor age-fit consultative.

Nu implementa acum.

⸻

1. Axa

Complexitatea sintactică aparține în primul rând:

AGE-FIT / DEVELOPMENTAL-LANGUAGE FIT.

Trebuie separată de:

* conceptual abstraction — D-12;
* vocabulary difficulty;
* semantic density;
* referential ambiguity;
* general prose quality;
* localization fidelity.

Aceste dimensiuni pot interacționa, dar nu trebuie confundate.

⸻

2. Numărul de cuvinte nu este suficient

The crab that the fish who lives here likes is hiding.

este relativ scurtă.

Dar ascultătorul trebuie să păstreze deschisă relația:

The crab ... is hiding

în timp ce procesează:

that the fish ... likes

și în interiorul acesteia:

who lives here.

Dificultatea este structurală, nu lexicală.

⸻

3. Numărul de subordonate nu este suficient

Două propoziții relative pot avea dificultăți foarte diferite în funcție de structură.

Evaluatorul trebuie să reprezinte cel puțin:

* clause type;
* attachment;
* nesting;
* center embedding;
* right branching;
* dependency distance;
* number of simultaneously open dependencies;
* referent tracking;
* pronoun/reference clarity;
* coordination;
* subordination;
* interruption of main clause;
* sentence boundary support;
* repetition/scaffolding;
* age band.

Nu implementa prin simpla numărare who / that / which / care.

⸻

4. Center embedding

Center embedding-ul întrerupe o structură înainte ca aceasta să fie închisă.

Conceptual:

MAIN [RELATIVE [RELATIVE] ... ] MAIN-CONTINUATION

Acest lucru poate crește working-memory load chiar când toate substantivele și acțiunile sunt concrete.

⸻

5. Right branching

Right branching/cumulative structure poate fi mai ușor de urmărit deoarece relațiile sunt închise mai progresiv.

Dar NU stabilesc regula:

RIGHT-BRANCHING = PASS.

Un lanț poate deveni dificil prin:

* lungime;
* prea multe verigi;
* referenți similari;
* pronume;
* schimbări de agent;
* dependențe semantice;
* cumulative working-memory load.

Prin urmare:

RIGHT-BRANCHING IS A STRUCTURAL FACTOR, NOT A BYPASS.

⸻

6. Structurile cumulative familiare

Forme repetitive de tip:

This is the X that...
that...
that...

pot beneficia de:

* predictibilitate;
* ritm;
* repetiție;
* closure incremental;
* suport vizual.

Aceste proprietăți pot reduce severitatea.

Nu înseamnă că orice lanț cumulativ este automat potrivit pentru orice bandă.

⸻

7. Coordonarea

Exemplu:

The crab digs, the fish swims, and the gull flies.

nu trebuie echivalat cu trei niveluri de subordonare doar pentru că există mai multe predicate.

Coordonarea poate avea un working-memory profile mult mai simplu.

⸻

8. Dependency distance

Evaluatorul trebuie să poată reprezenta distanța dintre elementele care trebuie conectate.

Exemplu:

The crab, after the long sunny morning near the rocks where all the little fish were playing, finally hid.

poate fi dificil fără multe relative imbricate.

Prin urmare:

number of relative markers ≠ dependency load.

⸻

9. Simultaneously open dependencies

Mai important decât simplul număr de clauze este câte relații trebuie păstrate simultan înainte de rezolvare.

Aceasta este una dintre proprietățile care diferențiază center embedding de unele structuri cumulative.

Nu fixa acum un prag numeric.

⸻

10. syn-02 la 5–6

Pentru cazul exact:

The crab that the fish who lives here likes is hiding.

la 5–6 ani:

→ finding AGEFIT_CENTER_EMBEDDING sau echivalent;

→ severitate ADVISORY / CONSULTATIVĂ;

→ publishing consequence NU este decisă în D-13;

→ se decide conform D-14.

Lipsa actuală a semnalului este:

coverage gap / implementation limitation, nu dovadă că structura este potrivită fără observații.

⸻

11. De ce nu este material la 5–6 în D-13

În cazul exact:

* propoziția este scurtă;
* vocabularul este simplu;
* conținutul este concret;
* referenții sunt puțini;
* nu există abstracție conceptuală semnificativă.

Complexitatea structurală este reală, dar nu există suficiente dovezi pentru a declara acum un material mismatch WonderPages la 5–6.

Prin urmare:

→ advisory.

Aceasta este o politică editorială WonderPages, nu o afirmație universală despre capacitatea lingvistică a tuturor copiilor de 5–6 ani.

⸻

12. syn-01 la 3–4

Aceeași structură cu două niveluri de center embedding la 3–4:

→ AGEFIT_CENTER_EMBEDDING;

→ severitate MATERIALĂ.

Eticheta/finding-ul existent rămâne coerent.

Publishing consequence generală pentru sintaxă rămâne totuși D-14.

Nu modifica Gold acum.

⸻

13. syn-03 la 7–8

Aceeași structură cu două niveluri:

→ PASS pe D-13 în forma furnizată.

Aceasta nu creează:

two embeddings at 7–8 = always PASS.

Contează profilul complet.

⸻

14. Trei niveluri de center embedding la 7–8

Exemplul furnizat cu trei niveluri:

→ finding AGEFIT_CENTER_EMBEDDING;

→ severitate MATERIALĂ în forma furnizată.

Motivul este încărcarea structurală foarte ridicată și multiplele dependențe simultan deschise.

Publishing consequence rămâne D-14.

Nu implementa:

age 7–8 = syntax bypass.

⸻

15. Center embedding pe un singur nivel

Exemplu:

The crab that the fish likes is hiding.

Decizia:

3–4
→ finding consultativ;

→ nu material doar prin existența unei singure relative.

5–6
→ PASS pe D-13 în forma furnizată.

7–8
→ PASS.

Dacă propoziția adaugă:

* dependență foarte lungă;
* referenți multipli;
* pronume ambigue;
* abstracție;
* vocabular dificil;

profilul trebuie reevaluat.

⸻

16. Nu transforma adâncimea într-un tabel rigid

Deciziile de mai sus NU înseamnă:

1 level = advisory
2 levels = material
3 levels = material

independent de context.

Depth este un factor.

Nu verdictul.

Trebuie analizate și:

* dependency distance;
* open dependencies;
* referent load;
* lexical load;
* semantic load;
* scaffolding;
* age band.

⸻

17. Ambiguitatea pronumelor este separată

Exemplu:

The crab told the fish that he was hungry.

nu trebuie clasificat pur și simplu:

AGEFIT_CENTER_EMBEDDING.

Aici problema principală poate fi:

REFERENTIAL AMBIGUITY / REFERENCE RESOLUTION.

Păstrează o dimensiune separată.

⸻

18. Două efecte diferite ale referinței

Separă conceptual:

A. Referential ambiguity
→ textul nu stabilește clar cine este referentul.

B. Referential tracking load
→ referentul este determinabil, dar copilul trebuie să urmărească multe entități/relații.

Acestea nu sunt același defect.

⸻

19. Ambiguitatea reală poate depăși age-fit

Dacă nici un cititor competent nu poate determina rezonabil cine este he, poate exista și o problemă generală de clarity/quality, nu doar age-fit.

D-13 nu stabilește taxonomia generală de quality pentru această situație.

Păstreaz-o ca dependență, fără a o forța în AGE_SYNTAX.

⸻

20. Visual support

Da, D-13 trebuie să permită suport vizual/cross-modal.

Dar cu o distincție importantă:

IMAGE CAN SUPPORT REFERENT RESOLUTION.

Nu:

IMAGE REMOVES SYNTACTIC COMPLEXITY.

⸻

21. Exemplu visual support

Text:

The crab that the fish who lives here likes is hiding.

Imaginea poate arăta foarte clar:

* crabul;
* peștele;
* locul;
* relația dintre ei.

Aceasta poate reduce:

* referent-tracking load;
* ambiguity;
* inferential load.

Dar propoziția rămâne center-embedded.

Finding-ul structural nu dispare automat.

⸻

22. Imaginea poate și complica

Dacă textul are doi referenți, dar imaginea introduce:

* trei pești similari;
* două personaje cu aceeași poziție;
* relații contradictorii;

cross-modal load poate crește.

Deci imaginea este evidence, nu atenuare automată.

⸻

23. Visual-only

O imagine nu are „relative clauses” în sens sintactic.

Prin urmare, D-13 nu trebuie să inventeze:

visual center embedding.

Dar imaginea poate avea:

* referential ambiguity;
* sequencing complexity;
* visual relation load.

Acestea pot interacționa cu textul prin cross-modal evaluation.

⸻

24. Repetiția

Repetiția poate reduce dificultatea dacă oferă structură predictibilă.

Exemplu:

This is the crab...
This is the fish...

Dar repetarea unei propoziții greu center-embedded nu o simplifică automat.

Separă:

repetition/scaffolding

de:

structural complexity.

⸻

25. Sentence splitting

Rescrierea:

The fish lives here.
It likes the crab.
The crab is hiding.

reduce semnificativ center embedding-ul.

Aceasta este o reparație editorială validă.

Dar D-13 nu obligă automat la această rescriere pentru orice finding consultativ.

⸻

26. EN / RO parity

Paritatea trebuie să fie structurală și semantică.

Nu compara mecanic:

* word count;
* număr de that;
* număr de who;
* număr de care;
* număr de clitice.

Româna și engleza pot exprima aceeași relație prin structuri diferite.

Evaluatorul trebuie să compare:

* dependency structure;
* embedding;
* referent tracking;
* ambiguity;
* working-memory demand.

⸻

27. Cliticele românești

Construcții precum:

pe care ... îl

nu trebuie penalizate ca două relații doar pentru că există două marcaje de suprafață.

Trebuie interpretată structura reală.

⸻

28. D-12 + D-13

Abstracția și sintaxa își păstrează finding-urile proprii.

Exemplu:

* AGEFIT_CONCEPTUAL_ABSTRACTION;
* AGEFIT_CENTER_EMBEDDING.

Nu le contopi într-un singur defect.

⸻

29. Working-memory load agregat

Dacă aceeași pagină conține:

* abstracție conceptuală;
* center embedding;
* referenți multipli;
* dependency distance mare;

poate exista suplimentar:

AGEFIT_WORKING_MEMORY_LOAD

sau echivalent.

Dar acesta trebuie să reprezinte efectul combinat.

Nu trebuie să penalizeze din nou fiecare finding individual.

Principiu:

COMPOSITION ≠ DOUBLE COUNTING.

⸻

30. Nu calcula simplu suma finding-urilor

Nu implementa:

abstraction = 1
syntax = 1
reference = 1
total >= 2 → REVIEW.

Fără calibrare, aceasta ar fi doar un alt prag arbitrar.

Trebuie păstrată relația dintre factori și evidence.

⸻

31. D-12 nu trebuie duplicată

Dacă propoziția este dificilă numai pentru că exprimă o idee filozofică, D-13 nu trebuie să inventeze și finding sintactic.

Dacă este:

* abstractă;
* și structural complexă;

ambele findings sunt legitime.

⸻

32. Contractul „short sentences”

short sentences din profilul 5–6 este evidence relevant.

Dar „short” nu definește singur sintaxa.

D-13 extinde interpretarea editorială:

o propoziție poate respecta lungimea și totuși avea structură dificilă.

Nu modifica acum contractul.

⸻

33. Right-branching — corecție față de recomandarea primită

Nu aprob formularea:

lanț cumulativ la dreapta → PASS pe toate benzile.

Aprob:

right-branching / cumulative structure is generally less structurally demanding than equivalent center embedding, all else equal.

Verdictul rămâne dependent de profilul complet.

⸻

34. Exemplu cumulativ rezonabil

Un lanț:

* scurt;
* repetitiv;
* cu referenți concreți;
* ilustrat;
* cu closure incremental;

poate fi PASS chiar la o bandă mică.

Aceasta explică de ce actuala simplă numărare poate produce fals pozitive.

⸻

35. Exemplu cumulativ excesiv

Un lanț foarte lung cu:

* multe personaje;
* pronume;
* relații schimbătoare;
* dependențe semantice;

poate produce finding age-fit chiar dacă nu este center-embedded.

Reason code-ul nu trebuie să fie neapărat CENTER_EMBEDDING.

Poate exista:

AGEFIT_LONG_DEPENDENCY
sau
AGEFIT_REFERENCE_TRACKING_LOAD.

⸻

36. Finding → severity

D-13 adoptă aceeași separare arhitecturală:

syntactic property → age-fit finding → severity

dar se oprește înainte de regula generală:

severity → publishing consequence.

Acea relație pentru sintaxă rămâne D-14.

⸻

37. Rezultatele centrale

v2c-age-syn-02 — 5–6

→ finding AGEFIT_CENTER_EMBEDDING;

→ severity ADVISORY;

→ publishing consequence: DEFER TO D-14.

⸻

v2c-age-syn-01 — 3–4

→ finding;

→ severity MATERIAL;

→ publishing consequence: DEFER TO D-14.

⸻

v2c-age-syn-03 — 7–8

→ PASS pe D-13 pentru stimulul exact.

⸻

Center embedding 3 levels — 7–8

→ finding;

→ severity MATERIAL în exemplul furnizat;

→ publishing consequence: DEFER TO D-14.

⸻

Center embedding 1 level

3–4:
→ advisory.

5–6:
→ PASS în cazul simplu furnizat.

7–8:
→ PASS.

⸻

38. Actualul evaluator

Absența semnalului pentru syn-02 la 5–6 este:

coverage gap, nu policy evidence.

Actuala numărare de relative/subordonate:

* nu reprezintă center embedding;
* nu reprezintă dependency distance;
* nu reprezintă open dependencies;
* nu reprezintă referent tracking;
* nu reprezintă ambiguity.

Nu interpreta no signal ca validare.

⸻

39. Contaminarea de șablon

Calibrarea și held-out folosesc aceeași familie structurală.

Prin urmare, rezultatul held-out nu demonstrează generalizare suficientă pe sintaxă.

Păstrează explicit limita L-7.

Semantic Hardening #2 va avea nevoie ulterior de familii structurale mai diverse, fără a modifica acum setul înghețat.

⸻

40. Nu implementa prin parser superficial + threshold

Semantic Hardening #2 nu trebuie să devină doar:

count(relative_clauses)

sau:

nesting_depth >= N.

Acestea pot fi evidence/features.

Nu verdict.

⸻

41. Reparația trebuie să urmărească cauza

Dacă problema este center embedding:

→ split/restructure.

Dacă problema este pronoun ambiguity:

→ explicit referent.

Dacă problema este long dependency:

→ shorten/reorder.

Dacă problema este cumulative reference load:

→ reduce/repeat/scaffold.

Nu folosi aceeași reparație pentru toate.

⸻

42. D-13 și QA vizual

Da, D-13 se aplică cross-modal, dar nu în sensul că imaginea are sintaxă lingvistică.

Textul produce finding-ul structural.

Imaginea poate:

* reduce reference load;
* clarifica relațiile;
* susține secvența;
* sau crește ambiguitatea.

Prin urmare, păstrează separat:

text syntactic structure

și

visual/cross-modal referential support.

⸻

43. Nu schimbăm seturile

Gold-v1 rămâne neschimbat.

Gold-v2 rămâne neschimbat.

Held-out rămâne înghețat.

Nu adjudeca automat alte cazuri din această decizie.

Nu retune evaluatorul.

⸻

44. Ce decide D-13

D-13 stabilește că:

complexitatea sintactică este independentă de simpla lungime.

center embedding și right branching trebuie diferențiate.

clause count nu este suficient.

dependency distance și simultaneously open dependencies contează.

reference tracking și referential ambiguity trebuie reprezentate separat.

syn-02 la 5–6 are finding real, dar advisory.

două niveluri la 3–4 sunt material age-fit finding.

două niveluri în stimulul exact la 7–8 sunt PASS.

trei niveluri pot fi material finding chiar la 7–8.

visual support poate reduce referential load, dar nu șterge structura sintactică.

right branching nu este bypass.

abstracția și sintaxa se compun fără double counting.

⸻

45. Ce NU decide D-13

D-13 NU decide:

* publishing consequence generală pentru sintaxă;
* D-14;
* regula generală pentru advisories;
* AGE_VOCABULARY;
* temporal/causal age-fit;
* semantic density;
* taxonomia completă de prose quality;
* praguri numerice;
* un parser final;
* toate structurile sintactice EN/RO;
* taxonomia completă a ambiguity/reference;
* validitatea empirică a evaluatorului.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea B, rafinată: profil structural semantic. Finding și severitate pe bandă. **Consecința de publicare pentru sintaxă e amânată la D-14.** SHORT SENTENCE ≠ SIMPLE SYNTAX. CLAUSE COUNT ≠ STRUCTURAL COMPLEXITY. CENTER EMBEDDING ≠ RIGHT-BRANCHING. VISUAL REFERENCE SUPPORT ≠ SYNTACTIC SIMPLIFICATION. SYNTACTIC FINDING ≠ AUTOMATIC PUBLISHING REVIEW. |
| **Lungimea propoziției / numărul de clauze / tipul clauzei** | Nu definesc sintaxa. Contează atașamentul și structura. |
| **Coordonare / subordonare** | Coordonarea are un profil mai simplu. Subordonarea se evaluează după structură. |
| **Center embedding / right branching / adâncimea** | Center embedding = factor major de încărcare. Right branching = factor, nu bypass (corecție: lanțul cumulativ nu e PASS automat pe toate benzile). Adâncimea = factor, nu tabel rigid. |
| **Distanța de dependență / dependențe simultan deschise** | Pot fi mari fără multe relative. Fără prag numeric. |
| **Număr de referenți / încărcare de urmărire / ambiguitatea pronumelor** | Urmărirea (referent determinabil, multe entități) ≠ ambiguitatea (referent nestabilit). Ambiguitatea e dimensiune separată și poate fi problemă de calitate (dependență). |
| **Conținut semantic concret** | Nu anulează complexitatea structurală. |
| **Finding de abstracție separat** | D-12 rămâne separat. Fără dublare: dacă dificultatea e doar filozofică, nu se inventează un finding sintactic. |
| **Repetiție / scaffolding / granițe de propoziție** | Pot reduce dificultatea. Împărțirea în propoziții e o reparație validă, nu obligatorie. |
| **Structura sintactică a textului / suport referențial vizual / relație cross-modal** | Textul produce finding-ul. Imaginea poate reduce încărcarea referențială sau o poate complica, dar nu șterge structura. Nu există „center embedding vizual”. |
| **Memoria de lucru** | `AGEFIT_WORKING_MEMORY_LOAD` = efect combinat, reprezentat o singură dată (composition ≠ double counting; nu sumă cu prag). |
| **Banda / finding / severitate** | syn-02 (5–6) advisory; syn-01 (3–4) material; syn-03 (7–8) PASS; trei niveluri la 7–8 material; un nivel: 3–4 advisory, 5–6 / 7–8 PASS. |
| **Consecința de publicare** | **deferred to D-14** |
| **Paritate structurală EN / RO** | Dependențe, imbricare, referenți, ambiguitate, memorie de lucru. Nu numărare de cuvinte sau marcaje („pe care … îl” nu e două relații). |
| **Comportamentul implementării la momentul deciziei** (HEAD `7cc9248`, neschimbat) | `AGE_SYNTAX` = numărul de relative / subordonate, cu prag pe bandă. syn-02 la 5–6 = 2 < 3 → niciun semnal (**coverage gap**). Lanțul cumulativ → semnal. Trei niveluri la 7–8 → nimic. Dependențele, ambiguitatea și referenții nereprezentați. RO numărat ca EN. **Același șablon în calibrare și în setul rezervat (L-7).** **Comportamentul nu e politica; „no signal” nu e validare.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Profil structural ca features, nu verdict prin prag. Severitate semantică pe bandă. Ambiguitatea separată. Memoria de lucru combinată fără dublă numărare. Reparații după cauză. Paritate structurală. Familii structurale diverse. Consecința de publicare după D-14. |

### Afectate (fără nicio modificare acum)

- **Gold-v2:**
  - syn-02 (5–6) e candidat finding advisory; consecința de publicare după D-14;
  - syn-01 (3–4) e finding material (eticheta e coerentă);
  - syn-03 (7–8) rămâne PASS.
- **Setul rezervat (înghețat):** v2h-age-05 / -06 rămân neschimbate; trecerea lor nu arată generalizare (L-7).
- **Gold-v1:** neschimbat.

### Nu decide

Consecința de publicare pentru sintaxă · D-14 · regula generală pentru advisories · `AGE_VOCABULARY` · age-fit temporal / cauzal ·
densitatea semantică · taxonomia calității prozei · praguri numerice · un parser final · toate structurile EN / RO · taxonomia
ambiguității / referinței · validitatea empirică.

### Dependențe deschise

- **D-13-DEP-SYNTAX-PUBLISHING-CONSEQUENCE** → D-14.
- **D-13-DEP-REFERENCE-AMBIGUITY-TAXONOMY:** ambiguitatea și urmărirea referențială (inclusiv ca problemă de calitate).
- **D-13-DEP-STRUCTURAL-FAMILY-DIVERSITY:** familii structurale diverse pentru testare (L-7; D-20 / D-22).
- Legătura cu **D-12-DEP-ABSTRACTION-TAXONOMY** (compunerea în memoria de lucru).

## D-14 — Semnalele consultative: finding, severitate, consecință de publicare

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-14 — DECIZIA OPERATORULUI

Aleg Opțiunea C, rafinată: model semantic finding → confirmation/evidence → severity → publishing consequence, cu reguli distincte pentru AGE-FIT și LOCALIZATION FIDELITY.

Principiile centrale:

FINDING ≠ SEVERITY ≠ PUBLISHING CONSEQUENCE.

DETECTOR OUTPUT ≠ CONFIRMED DEFECT.

ADVISORY ≠ AUTOMATIC PASS FOREVER.

MATERIAL ≠ AUTOMATIC BLOCK.

CONFIRMED MATERIAL FIDELITY DEFECT ≠ OPERATOR-WAIVABLE REVIEW.

COMPOSITION ≠ NUMERIC ADDITION.

QUALITY GATE ≠ HIDDEN ESCALATION PATH.

Nu implementa acum.

⸻

1. Modelul general

Pentru semnalele din aria D-14, arhitectura trebuie să poată reprezenta cel puțin:

artifact evidence → candidate finding → finding dimension → confidence/confirmation state → semantic impact → age/edition context → severity → scope → publishing consequence → resolution

Pentru findings detectate automat trebuie păstrată și starea:

* suspected/candidate;
* confirmed;
* dismissed false positive;
* repaired;
* revalidated.

Un cod de detector nu reprezintă singur adevărul despre artifact.

⸻

AGE-FIT

2. Regula generală age-fit

Pentru age-fit:

ADVISORY
→ publishing PASS;

MATERIAL FOR TARGET BAND
→ publishing REVIEW;

REVIEW este operator-deblockable, cu justificare și evidence.

Nu introducem age-fit BLOCK doar pentru că un element este dificil pentru bandă.

⸻

3. Age-fit REVIEW nu înseamnă defect factual

Un finding material de age-fit înseamnă:

„Acest conținut poate fi incompatibil cu profilul editorial WonderPages pentru banda selectată și necesită judecată.”

Nu:

„Conținutul este factual greșit.”

Prin urmare operatorul poate, cu evidence și justificare, să accepte cazul.

⸻

4. D-11 rămâne autoritară pentru frică

D-14 NU suprascrie D-11.

Rămân valabile:

* mild fear poate fi PASS;
* severe developmental distress poate escalada la REVIEW;
* recovery reduce severitatea, nu șterge evenimentul;
* banda modifică legitim pragul developmental;
* 7–8 nu este bypass pentru distress sever.

⸻

5. D-12 rămâne autoritară pentru abstracție

D-14 NU suprascrie D-12.

Abstracția material incompatibilă cu banda poate ajunge la publishing REVIEW.

Pentru cazul stabilit:

Milo questions whether time is real.

3–4:
→ material
→ REVIEW.

5–6:
→ advisory
→ PASS.

7–8:
→ PASS pentru stimulul exact.

⸻

6. D-13 primește acum publishing consequence

Pentru sintaxă aplic regula generală D-14.

syn-01 — două niveluri center embedding, 3–4

→ finding material
→ publishing REVIEW.

syn-02 — două niveluri center embedding, 5–6

→ finding advisory
→ publishing PASS + advisory.

syn-03 — cazul exact, 7–8

→ PASS.

trei niveluri center embedding, cazul furnizat la 7–8

→ finding material
→ publishing REVIEW.

Aceasta finalizează partea lăsată explicit deschisă în D-13.

⸻

7. AGE_TEMPORAL_CAUSAL

Nu decide după existența unor cuvinte precum:

* before;
* after;
* because;
* yesterday;
* tomorrow;
* înainte;
* după;
* pentru că.

Relațiile temporale și cauzale concrete pot fi perfect accesibile.

Finding-ul trebuie să reprezinte dificultatea reală a relației.

Advisory:
→ PASS.

Material pentru bandă:
→ REVIEW.

⸻

8. AGE_DENSITY

Densitatea nu este doar:

number of facts / sentence.

Trebuie să poată include:

* număr de idei noi;
* referenți;
* relații;
* inferențe;
* schimbări temporale;
* concepte;
* informație vizuală necesară;
* ritmul introducerii lor.

Advisory:
→ PASS.

Material:
→ REVIEW.

Nu implementa un prag numeric arbitrar.

⸻

9. AGE_VOCABULARY

Lungimea cuvântului nu este dificultatea vocabularului.

Exemple precum:

butterflies
sau
strawberries

pot fi:

* lungi;
* familiare;
* concrete;
* ușor ilustrabile.

Prin urmare v2h-age-12 rămâne fals pozitiv înghețat.

În modelul D-14:

candidate lexical finding + context familiar/concret
→ advisory sau dismissed;
→ PASS.

Un vocabular realmente material pentru bandă poate ajunge la REVIEW, dar nu prin simplul număr de caractere/silabe.

⸻

10. AGE_COMPLEXITY

Actualul major bazat predominant pe lungimea medie a propoziției nu devine automat material doar pentru că istoricul codului spune major.

Severitatea veche trebuie considerată implementation metadata, nu policy truth.

Semantic Hardening #2 va trebui să determine severitatea din profilul real.

⸻

11. AGE_EMOTION

În afara cazurilor deja stabilite prin D-11, alte semnale emoționale urmează aceeași arhitectură generală:

finding → severity → consequence.

D-14 NU stabilește însă taxonomia completă pentru:

* tristețe;
* doliu;
* furie;
* separare;
* anxietate;
* rușine.

Nu extrapola automat politica fricii la toate emoțiile.

⸻

LOCALIZATION FIDELITY

12. Localizarea are o proprietate diferită de age-fit

O traducere care modifică material sensul nu este doar „mai puțin potrivită”.

Este potențial o ediție incorectă.

Prin urmare localizarea necesită o stare suplimentară:

CONFIRMATION STATE.

⸻

13. Pipeline pentru fidelity

Conceptual:

source meaning → target meaning → semantic relation → candidate fidelity finding → confirmation state → semantic impact → severity → publishing consequence

Aceasta trebuie să fie separată de simplul:

TR_CODE → severity.

⸻

14. Detector suspectează o inversare

Exemplu:

The cat does not sleep.

→

Pisica doarme.

Dacă detectorul spune TR_NEGATION_CHANGED:

→ candidate material fidelity finding;

→ publishing REVIEW;

→ necesită verificare.

În acest moment operatorul poate determina:

* detectorul are dreptate;
* detectorul este fals pozitiv.

⸻

15. Dacă detectorul este fals pozitiv

Exemplu:

It's raining cats and dogs.

→

Plouă cu găleata.

Dacă detectorul produce TR_OMISSION:

→ operatorul verifică;

→ traducerea este semantic fidelă;

→ finding-ul este:

DISMISSED / FALSE POSITIVE;

→ publishing PASS.

Nu se repară o traducere corectă pentru a mulțumi detectorul.

⸻

16. Dacă defectul material este confirmat

Dacă:

does not sleep

a devenit într-adevăr:

doarme

atunci:

→ finding confirmat;

→ material fidelity defect;

→ REPAIR REQUIRED;

→ publishing gate FAIL până la corectare și revalidare.

Nu este un REVIEW pe care operatorul îl poate debloca păstrând traducerea greșită.

⸻

17. REPAIR REQUIRED ≠ safety BLOCK

Nu reutiliza neclar BLOCK.

Separă consecințele.

Conceptual pot exista:

* PASS;
* PASS_WITH_ADVISORY;
* REVIEW_REQUIRED;
* REPAIR_REQUIRED;
* BLOCKED_BY_POLICY, acolo unde alte politici cer aceasta.

Un fidelity defect confirmat poate fi REPAIR_REQUIRED fără să fie semantic același lucru cu un non-overridable child-safety BLOCK.

⸻

18. Operatorul poate decide adevărul finding-ului, nu poate aproba eroarea confirmată

Operatorul poate spune:

„Detectorul greșește; traducerea este fidelă.”

Nu poate spune:

„Da, traducerea inversează sensul, dar o aprobăm neschimbată.”

După confirmarea defectului material:

→ repair;

→ re-evaluation;

→ apoi release.

⸻

19. TR_MEANING_CHANGED

Nu orice diferență de formulare este meaning change material.

Trebuie evaluat dacă s-a schimbat semantic ceva relevant precum:

* acțiunea;
* actorul;
* obiectul;
* starea;
* relația;
* cauza;
* consecința;
* negarea;
* cantitatea;
* temporalitatea;
* stance-ul;
* informația de canon;
* safety meaning;
* educational/science meaning.

Material confirmed change:
→ REPAIR REQUIRED.

⸻

20. TR_NEGATION_CHANGED

Negarea este high-value evidence deoarece poate inversa propoziția.

Dar nu implementa:

different negation token = defect.

Trebuie comparat sensul.

Dacă sensul este efectiv inversat:

→ material confirmed fidelity defect;

→ REPAIR REQUIRED.

⸻

21. TR_OMISSION

O omisiune poate fi:

* stilistică;
* redundantă;
* permisă de limbă;
* idiomatică;
* materială.

Exemplul idiomatic v2h-loc-12 demonstrează de ce:

OMISSION CODE ≠ MATERIAL OMISSION.

Materialitatea trebuie stabilită semantic.

⸻

22. TR_ADDITION

La fel, o adăugare poate fi:

* clarificare legitimă;
* necesară gramatical;
* stilistică;
* sau poate inventa informație.

Dacă introduce material:

* un fapt;
* o acțiune;
* o intenție;
* o relație;
* o concluzie;
* un hazard;
* un stance;

care nu există în sursă:

→ candidate material finding;

→ REVIEW;

→ dacă este confirmat defect de fidelity:
→ REPAIR REQUIRED.

⸻

23. Diferențele minore

Diferențele de formulare care:

* păstrează sensul;
* sunt idiomatice;
* păstrează canonul;
* păstrează stance-ul;
* păstrează relațiile esențiale;

pot rămâne:

→ advisory sau no finding;

→ publishing PASS.

WonderPages nu trebuie să ceară traducere literală.

⸻

CRITIC / QUALITY

24. Păstrăm findings în contextul criticului

Nu închid calea către critic.

Criticul are nevoie de context despre findings pentru o evaluare holistică.

Dar:

SEMANTIC ADVISORY ≠ INSTRUCTION TO LOWER T01.

⸻

25. Criticul trebuie să judece independent

Criticul poate ajunge independent la:

T01 < 8

dacă artifact-ul, evaluat holistic, justifică acest lucru.

Dar trebuie să furnizeze:

* evidence;
* reasoning;
* scope;
* criterion;
* relation to findings, dacă există.

Nu este suficient:

AGE_* finding exists → lower score.

⸻

26. Trasabilitate obligatorie

Dacă un quality failure este influențat de un semantic finding, quality evidence trebuie să citeze explicit finding-ul relevant.

Conceptual:

quality assessment → evidence → related finding IDs

Nu accept:

critic saw advisory → score changed → book blocked

fără provenance.

⸻

27. Două porți pot exista independent

Semantic gate și quality gate nu trebuie contopite.

Exemplu:

un finding age-fit advisory:

→ semantic publishing PASS.

Dar criticul poate observa independent că întreaga carte este mult prea complexă pentru bandă:

→ T01 quality failure.

Acest lucru este legitim dacă există evidence independent și trasabil.

⸻

28. Fără double counting

Dacă exact aceeași problemă este:

* semantic finding;
* și quality evidence;

sistemul trebuie să lege cele două.

Nu trebuie să producă artificial:

one defect → two independent severity penalties.

Păstrează provenance și relationship.

⸻

29. Quality gate nu trebuie slăbită

D-14 NU modifică pragurile T01/T08 sau quality-v2.

Nu reduce quality gate pentru a evita calea ascunsă.

Problema este lipsa trasabilității, nu existența criticului.

⸻

COMPOSITION

30. Mai multe advisories se pot combina

Da.

Mai multe findings individual advisory pot produce împreună un material age-fit concern.

Exemplu:

* sintaxă moderat dificilă;
* vocabular moderat dificil;
* mai mulți referenți;
* densitate ridicată;
* relație temporală implicită;

pot crea împreună o încărcare materială pentru 3–4.

⸻

31. Fără sumă numerică

Nu implementa:

5 advisories = material.

Sau:

minor=1, major=2, total>=4 → REVIEW.

Materialitatea compusă trebuie justificată prin efectul semantic/developmental combinat.

⸻

32. Finding compus

Poate exista un finding separat, de exemplu:

AGEFIT_CUMULATIVE_LOAD

sau echivalent.

Acesta trebuie să explice:

* ce findings contribuie;
* cum interacționează;
* ce efect combinat produc;
* la ce nivel;
* pentru ce bandă.

⸻

33. Findings individuale rămân

Compunerea nu șterge:

* syntax finding;
* vocabulary finding;
* density finding.

Dar cumulative finding nu trebuie să le „pedepsească” din nou numeric.

Principiu:

COMPOSITION ≠ DOUBLE COUNTING.

⸻

EN / RO ȘI EDIȚIILE

34. Age-fit se evaluează pe fiecare ediție lingvistică

Da.

Nu este suficient să evaluăm doar sursa EN.

Ediția RO este un produs livrat copilului.

Prin urmare trebuie evaluată și ea pentru:

* syntax;
* vocabulary;
* abstraction;
* density;
* temporal/causal complexity;
* emotional age-fit;
* alte dimensiuni relevante.

⸻

35. Fidelity și target-language age-fit sunt axe diferite

O traducere poate fi:

fidelă, dar prea complexă pentru banda țintă.

Sau:

age-appropriate, dar infidelă.

Trebuie evaluate separat.

⸻

36. Traducerea poate necesita adaptare

Fidelity nu înseamnă structură identică cu sursa.

Dacă EN folosește o construcție care tradusă literal devine greoaie în RO, traducerea poate restructura propoziția pentru target age dacă păstrează:

* sensul;
* canonul;
* relațiile;
* stance-ul;
* informația relevantă.

Acesta este unul dintre motivele pentru care fidelity semantică este preferată traducerii literale.

⸻

37. Paritate semantică, nu metrică

Nu cer:

EN sentence length = RO sentence length

sau:

EN syntax score = RO syntax score.

Cer:

* aceeași bandă țintă;
* fiecare ediție să satisfacă profilul;
* fidelity între sensuri.

⸻

NIVELURI

38. Page → Book → Volume → Collection

Da.

D-14 adoptă explicit agregarea:

Page → Book → Volume → Collection.

Finding-ul local trebuie păstrat.

⸻

39. Page-level

Un advisory pe o singură pagină poate rămâne advisory.

Nu îl șterge doar pentru că restul cărții este simplu.

⸻

40. Book-level

Repetarea unei dificultăți pe multe pagini poate produce un book-level material finding.

Exemplu:

fiecare pagină 3–4 este doar puțin prea densă.

Izolat:
→ advisory.

Ca întreg:
→ poate deveni material.

⸻

41. Volume-level

Dacă aceeași problemă apare sistematic în Story Book-ul unui volum:

→ păstrează findings locale;

→ poate exista volume-level cumulative finding.

⸻

42. Collection-level

Dacă toate cele șase volume 3–4 folosesc sistematic limbaj peste profil:

→ collection-level age-fit drift.

Nu accept ca fiecare pagină să treacă izolată în timp ce produsul, ca sistem, ratează profilul selectat.

⸻

43. Scope-ul reparației trebuie să urmeze finding-ul

Page finding:
→ repară pagina dacă este necesar.

Book pattern:
→ poate necesita editare la nivel de carte.

Collection drift:
→ poate necesita corecție sistemică.

Nu regenera automat întregul produs.

⸻

VISUAL / CROSS-MODAL

44. D-14 se aplică și age-fit-ului vizual

Da.

Proprietăți precum:

* scene complexity;
* clutter;
* număr de elemente relevante;
* detalii foarte mici;
* relații vizuale;
* visual hierarchy;
* line/detail density;
* profile line_hint;
* informație necesară pentru înțelegere;

pot produce age-fit findings.

⸻

45. Nu transforma profilul vizual în checklist rigid

scene_complexity

sau line_hint sunt evidence/product guidance.

Nu:

too many objects = REVIEW.

Trebuie evaluat impactul asupra copilului și asupra înțelegerii scenei.

⸻

46. Visual advisory

O imagine puțin mai complexă decât idealul:

→ advisory;

→ PASS.

O imagine material incompatibilă cu banda:

→ age-fit REVIEW.

Aceeași arhitectură finding → severity → consequence.

⸻

47. Cross-modal load

Textul și imaginea pot fi individual simple, dar împreună să solicite prea multe relații.

Sau imaginea poate reduce încărcarea textului.

Prin urmare:

text finding
+
visual evidence
+
cross-modal relation

trebuie păstrate separat înainte de evaluarea efectului combinat.

⸻

48. Localization + visual

Fidelity vizuală intră în D-14 numai unde imaginea sau textul integrat în imagine poartă sens relevant pentru ediție.

De exemplu:

* text tradus în imagine;
* semn/etichetă relevantă;
* imagine care contrazice traducerea;
* traducere care schimbă relația text–imagine.

Nu inventa o regulă generală că fiecare diferență vizuală este localization defect.

⸻

STĂRILE DE PUBLICARE

49. Taxonomia conceptuală

D-14 stabilește conceptual cel puțin:

PASS
→ fără problemă relevantă.

PASS_WITH_ADVISORY
→ finding real, dar non-material.

REVIEW_REQUIRED
→ materialitate sau incertitudine suficientă pentru judecată umană.

REPAIR_REQUIRED
→ defect material confirmat care trebuie corectat înainte de release.

BLOCKED_BY_POLICY
→ rezervat politicilor unde deciziile existente cer non-overridable block.

Denumirile tehnice finale pot fi rafinate ulterior.

Semantica trebuie păstrată.

⸻

50. REVIEW și REPAIR REQUIRED nu sunt același lucru

Age-fit material:

→ REVIEW_REQUIRED.

Operatorul poate accepta justificat.

Candidate localization material:

→ REVIEW_REQUIRED.

Operatorul verifică dacă detectorul are dreptate.

Confirmed localization material defect:

→ REPAIR_REQUIRED.

Operatorul nu poate aproba eroarea neschimbată.

⸻

51. Fals pozitiv

Un REVIEW rezultat dintr-un detector imperfect nu înseamnă că produsul este defect.

După verificare:

candidate finding
→ dismissed false positive
→ PASS.

Păstrează această decizie și evidence pentru audit/calibrare.

⸻

MĂSURARE / GOLD

52. Modelul conceptual trebuie să distingă finding, severity și consequence

Da.

Pentru evaluarea viitoare trebuie să putem spune separat:

* a existat finding-ul?
* a fost detectorul corect?
* care este severitatea corectă?
* care este consecința corectă?
* a fost fals pozitiv?
* a fost reparat?

⸻

53. Dar D-14 nu rescrie acum schema Gold

Nu modifica acum:

* Gold-v1;
* Gold-v2;
* held-out;
* labels;
* scoring.

D-19/D-20 vor decide reprezentarea exactă pentru adjudecare și măsurare.

D-14 stabilește doar cerința semantică:

measurement must not conflate finding presence with gate failure.

⸻

54. Un „negative” nu este suficient

În viitor trebuie evitată confuzia:

finding detected = artifact rejected.

Un caz poate fi:

finding present
+
advisory
+
publishing PASS.

Aceasta este o stare legitimă.

⸻

CAZURILE CENTRALE

55. v2c-loc-neg-01

The cat does not sleep.
→ Pisica doarme.

Detector:
→ candidate material fidelity finding.

Publishing:
→ REVIEW_REQUIRED.

Dacă inversarea este confirmată:
→ REPAIR_REQUIRED.

Nu poate fi aprobată neschimbată.

⸻

56. v2c-loc-chg-01

Milo finds a leaf.
→ Milo pierde o frunză.

Aceeași logică:

candidate material meaning change
→ REVIEW.

Confirmed:
→ REPAIR REQUIRED.

⸻

57. v2c-loc-om-01

The seal has a ball and a hat.
→ Foca are o minge.

Trebuie determinat dacă omisiunea hat este materială în context.

Nu decide doar după token.

Dacă pălăria este relevantă pentru:

* continuitate;
* acțiune;
* imagine;
* canon;
* plot;

materialitatea crește.

Candidate material:
→ REVIEW.

Confirmed material:
→ REPAIR REQUIRED.

⸻

58. v2h-loc-12

It's raining cats and dogs.
→ Plouă cu găleata.

Este cazul emblematic pentru:

lexical omission ≠ semantic omission.

Setul rămâne înghețat.

În politica D-14, dacă verificarea confirmă echivalența idiomatică:

→ false positive/dismissed;

→ PASS.

⸻

59. v2h-age-12

The butterflies dance. The strawberries are sweet.

Cuvintele lungi familiare nu justifică singure material age-fit finding.

În contextul furnizat:

→ detector finding fals sau cel mult advisory;

→ publishing PASS.

Held-out rămâne neschimbat.

⸻

60. D-13 finalizat prin D-14

Confirm explicit:

syn-01 — 3–4
→ material
→ REVIEW.

syn-02 — 5–6
→ advisory
→ PASS + advisory.

3-level center embedding — 7–8, exemplul D-13
→ material
→ REVIEW.

Nu transforma aceste exemple în praguri numerice.

⸻

SEVERITATE

61. Nu păstrăm severitatea istorică doar pentru compatibilitate

Actualul:

TR_NEGATION_CHANGED = minor

sau:

AGE_COMPLEXITY = major

nu este policy truth.

Semantic Hardening #2 trebuie să reclasifice după impact semantic.

⸻

62. Severity trebuie explicabilă

Pentru fiecare finding material trebuie să existe reasoned evidence despre:

* ce proprietate a fost găsită;
* unde;
* pentru ce bandă/ediție;
* ce impact are;
* de ce este materială;
* ce consequence rezultă.

Nu accept:

severity = material because rule says so.

⸻

63. Fără scor arbitrar

Nu implementa:

minor = 1
major = 2
critical = 3.

Și nici:

sum >= N → REVIEW.

Severitatea este clasificare semantică bazată pe evidence.

⸻

RELAȚIA CU QUALITY

64. Criticul primește findings

Da.

Păstrăm această informație.

Dar trebuie marcată clar ca:

* advisory;
* material;
* candidate;
* confirmed;
* dismissed;

unde este cazul.

⸻

65. Advisory nu comandă nota

Criticul nu trebuie promptat implicit:

AGE_SYNTAX exists → T01 should be lower.

Finding-ul este evidence/context.

Criticul evaluează artifact-ul.

⸻

66. Quality failure trebuie explicat independent

Dacă T01 ajunge sub 8:

→ criticul trebuie să explice de ce artifact-ul, holistic, nu satisface criteriul.

Dacă motivul este același finding:

→ citează finding ID/evidence.

Dacă există alte motive:

→ citează-le separat.

⸻

67. Official semantic escalation

Escaladarea oficială a finding-urilor D-14 trebuie să treacă prin:

finding → severity → consequence.

Nu prin efectul accidental:

finding injected into critic prompt → unexplained lower score → blocked.

Această cale netrasabilă trebuie eliminată în Semantic Hardening #2.

⸻

DECIZIILE CELOR ȘASE ÎNTREBĂRI

68. Nivelurile de consecință

Age-fit

* advisory → PASS_WITH_ADVISORY;
* material → REVIEW_REQUIRED;
* fără age-fit BLOCK automat.

Localization fidelity

* non-material → PASS / advisory;
* suspected material → REVIEW_REQUIRED;
* confirmed material defect → REPAIR_REQUIRED;
* dismissed false positive → PASS.

⸻

69. Compunerea

Da.

Mai multe advisories pot forma un material finding dacă efectul combinat este demonstrat semantic.

Nu prin sumă numerică.

⸻

70. Calea prin critic

O păstrăm ca input informațional, dar o facem complet trasabilă.

Criticul rămâne independent.

Advisory-ul nu produce mecanic quality failure.

Quality failure bazat pe aceeași problemă trebuie să citeze evidence/finding-ul.

⸻

71. Paritatea ediției române

Da.

Ediția RO trebuie evaluată independent pentru age-fit.

Fidelity EN↔RO rămâne o axă separată.

⸻

72. Page → Book → Volume → Collection

Da.

Se aplică.

Păstrează findings locale și permite cumulative/systemic findings la nivel superior.

Nu face simplă numărare.

⸻

73. Măsurarea

D-14 stabilește că finding/severity/consequence/confirmation trebuie conceptual separate.

D-19/D-20 decid exact:

* schema Gold;
* adjudecarea;
* metricile;
* scoring-ul.

Nu modifica seturile acum.

⸻

CE NU DECIDE D-14

D-14 NU decide:

* taxonomia completă a fiecărei dimensiuni age-fit;
* praguri numerice;
* toate tipurile de localization defect;
* TR_EMPTY / TR_MISALIGNED, care rămân în afara acestei decizii;
* SAFETY_DISTRESS_CONTEXT;
* D-18 evidence validity;
* D-19/D-20 measurement implementation;
* pragurile quality D-16/D-17;
* taxonomia completă visual age-fit;
* mecanismul final al parserului/evaluatorului;
* validitatea empirică a evaluatorului.

D-14 stabilește însă definitiv pentru aria sa:

finding presence nu este gate failure.

severity trebuie determinată semantic.

age-fit advisory trece; age-fit material cere REVIEW.

age-fit nu produce automat BLOCK.

candidate material localization defect cere REVIEW.

confirmed material localization defect trebuie reparat și nu poate fi aprobat neschimbat.

false positive poate fi închis de operator.

semantic gate și quality gate rămân independente și trasabile.

advisories se pot compune fără numeric summation sau double counting.

toate edițiile lingvistice sunt evaluate pentru age-fit.

Page → Book → Volume → Collection se aplică.

visual/cross-modal age-fit intră în același model atunci când este relevant.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea C, rafinată: finding → confirmation / evidence → severity → publishing consequence. Reguli distincte pentru age-fit și localization fidelity. FINDING ≠ SEVERITY ≠ PUBLISHING CONSEQUENCE. DETECTOR OUTPUT ≠ CONFIRMED DEFECT. ADVISORY ≠ AUTOMATIC PASS FOREVER. MATERIAL ≠ AUTOMATIC BLOCK. CONFIRMED MATERIAL FIDELITY DEFECT ≠ OPERATOR-WAIVABLE REVIEW. COMPOSITION ≠ NUMERIC ADDITION. QUALITY GATE ≠ HIDDEN ESCALATION PATH. |
| **Finding ID / dimensiune / artifact / ediție** | Fiecare finding are identitate citabilă, o dimensiune (age-fit: sintaxă, abstracție, temporal / cauzal, densitate, vocabular, complexitate, emoție, vizual; fidelity: sens, negare, omisiune, adăugare) și ediția în care apare. |
| **Evidence / detector output / stare de confirmare** | Codul detectorului e candidat, nu adevăr. Stări: candidate, confirmed, dismissed false positive, repaired, revalidated. |
| **Impact semantic / bandă / severitate** | Severitatea se stabilește semantic, cu evidence motivat (proprietate, loc, bandă / ediție, impact, de ce e materială). Severitățile istorice (`TR_NEGATION_CHANGED` = minor, `AGE_COMPLEXITY` = major) sunt metadata de implementare. Fără scor numeric. |
| **Consecința de publicare** | Stări conceptuale: PASS · PASS_WITH_ADVISORY · REVIEW_REQUIRED · REPAIR_REQUIRED · BLOCKED_BY_POLICY. REPAIR_REQUIRED ≠ safety BLOCK. |
| **Age-fit** | Advisory → PASS_WITH_ADVISORY. Material pentru bandă → REVIEW_REQUIRED, deblocabil de operator cu justificare și evidence. Fără age-fit BLOCK automat. REVIEW înseamnă judecată editorială, nu defect factual. D-11 (frică) și D-12 (abstracție) rămân autoritare. |
| **Consecința D-13 (finalizată aici)** | syn-01 (3–4) material → **REVIEW**. syn-02 (5–6) advisory → **PASS + advisory**. syn-03 (7–8, cazul exact) → **PASS**. Trei niveluri de center embedding la 7–8 (exemplul D-13) material → **REVIEW**. Nu devin praguri numerice. |
| **Temporal / cauzal · densitate · vocabular · complexitate · emoție** | Temporal / cauzal: dificultatea reală a relației, nu cuvintele. Densitate: idei, referenți, relații, inferențe, schimbări temporale, concepte, informație vizuală, ritm; fără prag numeric. Vocabular: lungimea ≠ dificultate (v2h-age-12 rămâne fals pozitiv înghețat). Complexitate: „major” istoric ≠ politică. Emoții în afara fricii: aceeași arhitectură, taxonomia nedecisă, fără extrapolarea politicii fricii. |
| **Localization fidelity** | Non-material → PASS / advisory. Candidat material → REVIEW_REQUIRED. Defect material confirmat → **REPAIR_REQUIRED** (poarta pică până la corectare și revalidare). Fals pozitiv respins → PASS. Operatorul decide adevărul finding-ului, nu poate aproba eroarea confirmată. Nu se repară o traducere corectă ca să mulțumească detectorul. |
| **Coduri de fidelity** | `TR_MEANING_CHANGED`: doar schimbare semantică relevantă. `TR_NEGATION_CHANGED`: se compară sensul, nu tokenul. `TR_OMISSION`: codul ≠ omisiune materială. `TR_ADDITION`: clarificare legitimă vs informație inventată. Diferențele care păstrează sensul, canonul, stance-ul și relațiile → advisory sau nimic. Fără cerință de traducere literală. |
| **Rezoluția operatorului / reparația / revalidarea** | Age-fit REVIEW: acceptare justificată. Fidelity: confirmare sau respingere. Defect confirmat: repair → re-evaluation → release. Scope-ul reparației urmează finding-ul; fără regenerarea automată a produsului. |
| **Quality evidence / critic** | Calea către critic se păstrează, ca input informațional marcat (advisory / material / candidate / confirmed / dismissed). Criticul judecă independent. T01 < 8 cere evidence, reasoning, scope, criteriu și related finding IDs, dacă failure-ul vine din același finding. Porțile semantică și de calitate rămân separate. Fără double counting. Pragurile T01 / T08 și quality-v2 nu se schimbă. Calea netrasabilă e de eliminat în Semantic Hardening #2. |
| **Compunere** | Mai multe advisories pot forma un finding material (`AGEFIT_CUMULATIVE_LOAD` sau echivalent) dacă efectul combinat e demonstrat semantic: contributori, interacțiune, efect, nivel, bandă. Fără sumă numerică. Findings individuale rămân, fără double counting. |
| **Niveluri** | Page → Book → Volume → Collection. Finding-ul local se păstrează. Pot apărea finding-uri cumulative la nivel de carte sau volum și age-fit drift la nivel de colecție. Nu simplă numărare. |
| **Text / vizual / cross-modal** | Age-fit vizual în același model. `scene_complexity` / `line_hint` sunt evidence, nu checklist. Text, imagine și relația lor se păstrează separat înainte de efectul combinat. Fidelity vizuală doar unde imaginea sau textul din imagine poartă sens pentru ediție. |
| **Ediția EN / RO** | Age-fit pe fiecare ediție (RO evaluată independent). Fidelity ≠ age-fit în limba țintă. Restructurarea pentru bandă e permisă dacă sensul se păstrează. Paritate semantică, nu metrică. |
| **Măsurare** | Finding / severity / consequence / confirmation separate conceptual. „measurement must not conflate finding presence with gate failure”. Finding prezent + advisory + PASS = stare legitimă. Schema și metricile → D-19 / D-20. Seturile nu se modifică. |
| **Comportamentul implementării la momentul deciziei** (HEAD `a15ab46`, neschimbat) | `fidelity.js`: `TR_NEGATION_CHANGED`, `TR_MEANING_CHANGED`, `TR_OMISSION` (inclusiv idiomul v2h-loc-12), `TR_ADDITION` = minor / advisory. `TR_UNTRANSLATED` = major. `story-contracts.js`: `TR_CALQUE` / `TR_NAME` major, `TR_MISALIGNED` / `TR_EMPTY` blocker. `age.js`: semnalele noi = minor / advisory. `AGE_COMPLEXITY` = major după lungimea medie a propoziției. `AGE_VOCABULARY` = după lungimea cuvântului. Readiness = `blockers === 0`. Age-fit doar pe ediția sursă. Fără stare de confirmare. `criticNotes` în promptul criticului (`server/engine.js`), fără trasabilitate. Fără niveluri cumulative. **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Modelul finding → confirmation → severity → scope → consequence → resolution. Stări de publicare distincte. Confirmare și rezoluție pentru fidelity. Reclasificare semantică a severităților. Age-fit pe ediția RO. Finding-uri cumulative fără sumă. Agregare pe niveluri. `criticNotes` marcate și trasabile. Age-fit vizual / cross-modal. Reprezentarea în Gold după D-19 / D-20. |

### Afectate (fără nicio modificare acum)

- **Gold-v2:**
  - v2c-loc-neg-01, v2c-loc-chg-01, v2c-loc-om-01: candidat material → REVIEW; confirmat → REPAIR_REQUIRED (pentru om-01, materialitatea omisiunii „hat” în context);
  - v2c-age-syn-01 → REVIEW; syn-02 → PASS + advisory; syn-03 → PASS.
- **Setul rezervat (înghețat, nu se rulează din nou):**
  - v2h-loc-12: echivalență idiomatică confirmată → dismissed → PASS;
  - v2h-age-12: fals sau cel mult advisory → PASS.
- **Gold-v1 și registrul de probe:** neschimbate.

### Nu decide

Taxonomia completă a fiecărei dimensiuni age-fit · praguri numerice · toate tipurile de localization defect · `TR_EMPTY` /
`TR_MISALIGNED` · `SAFETY_DISTRESS_CONTEXT` · D-18 · implementarea măsurării (D-19 / D-20) · pragurile de calitate (D-16 / D-17) ·
taxonomia age-fit vizual · mecanismul final al parserului / evaluatorului · validitatea empirică · taxonomia emoțiilor în afara fricii.

### Dependențe deschise

- **D-14-DEP-AGEFIT-DIMENSION-TAXONOMIES:** temporal / cauzal, densitate, vocabular, complexitate, emoții în afara fricii.
- **D-14-DEP-LOCALIZATION-DEFECT-TAXONOMY:** toate tipurile de defect; `TR_EMPTY` / `TR_MISALIGNED` în afara D-14.
- **D-14-DEP-MEASUREMENT-REPRESENTATION** → D-19 / D-20.
- **D-14-DEP-QUALITY-THRESHOLDS** → D-16 / D-17.
- **D-14-DEP-EVIDENCE-VALIDITY** → D-18.
- **D-14-DEP-VISUAL-AGEFIT-TAXONOMY:** taxonomia age-fit vizual și criterii testabile.
- **D-14-DEP-SAFETY-DISTRESS-CONTEXT:** în afara D-14.
- **D-14-DEP-EVALUATOR-MECHANISM:** mecanismul final și validitatea empirică.
- **Rezolvate pentru aria D-14:** D-11-DEP-FINDING-SEVERITY-GATE-MODEL (taxonomiile rămân deschise); D-13-DEP-SYNTAX-PUBLISHING-CONSEQUENCE.

## D-15 — Fereastra de corectare a unei idei științifice greșite

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-15 — DECIZIA OPERATORULUI

Aleg Opțiunea D, rafinată: semantic correction resolution + final scientific takeaway + scope-aware evaluation.

Principiile centrale sunt:

FALSE CLAIM EXPOSURE ≠ PRODUCT ENDORSEMENT OF THE FALSE CLAIM.

CHARACTER ERROR ≠ SCIENTIFIC DEFECT BY ITSELF.

CORRECTION TOKEN ≠ SEMANTIC CORRECTION.

CORRECTION DISTANCE ≠ CORRECTION QUALITY.

LOCAL FALSE-CLAIM FINDING ≠ FINAL BOOK TAKEAWAY.

A LATER CORRECTION DOES NOT DELETE THE LOCAL EXPOSURE.

CONFIRMED FALSE SCIENTIFIC TAKEAWAY ≠ OPERATOR-WAIVABLE REVIEW.

Și:

SCIENTIFIC TRUTH DOES NOT CHANGE WITH AGE; CORRECTION PERCEPTIBILITY CAN.

Nu implementa acum.

⸻

1. Axa D-15

D-15 aparține axei:

SCIENTIFIC ACCURACY / SCIENTIFIC FIDELITY OF THE PRODUCT.

Trebuie separată de:

* physical safety;
* content-policy;
* age-fit;
* general quality;
* localization fidelity.

Age-fit poate influența dacă o corectare este suficient de perceptibilă pentru banda țintă.

Nu schimbă însă adevărul științific al propoziției.

⸻

2. Un personaj are voie să greșească

WonderPages poate conține:

* concepții greșite;
* mituri;
* ipoteze greșite;
* personaje care nu știu;
* personaje care se corectează;
* discovery arcs;
* misconception → investigation → correction.

Acestea pot fi chiar mecanisme educaționale valoroase.

Prin urmare:

character says false proposition

nu înseamnă automat:

scientific defect.

⸻

3. Trebuie separat speaker-ul de stance-ul produsului

Evaluatorul trebuie să reprezinte cel puțin:

scientific proposition → truth status → speaker/source → attribution → epistemic stance → narrative stance → correction → correction relation → correction correctness → salience → proximity → age-band perceptibility → later reinforcement/contradiction → local takeaway → book takeaway → higher-scope takeaway → consequence

⸻

4. Candidate finding

Când este detectată o afirmație științific falsă, prima stare este:

candidate scientific finding.

Nu verdict final.

Trebuie determinat:

* cine a spus-o;
* dacă este prezentată ca adevăr;
* dacă este doar credința personajului;
* dacă este contestată;
* dacă este corectată;
* dacă produsul o reafirmă;
* ce rămâne drept concluzie.

⸻

CORECTAREA

5. Corectarea trebuie să fie semantică

O corectare validă trebuie să se refere fără ambiguitate la aceeași propoziție sau concepție greșită.

Nu este suficient:

* No;
* Actually;
* De fapt;
* apariția unui cuvânt opus;
* apariția cuvântului see;
* proximitatea fizică.

⸻

6. Relația semantică trebuie demonstrată

Pentru:

Bats are blind.

o corectare puternică este:

No, we can see.

deoarece propoziția ulterioară contrazice direct aceeași proprietate atribuită liliecilor.

În schimb:

No time to play. I can see the moon.

NU corectează afirmația despre lilieci.

P7 este deci accident de implementare.

⸻

7. Corectarea trebuie să fie ea însăși corectă

Nu accept:

false claim → different false claim

ca rezolvare.

Dacă mitul este „corectat” cu altă eroare:

→ nu există scientific resolution valid;

→ există în continuare defect sau incertitudine, după stance și scope.

⸻

8. Întărirea nu este corectare

P6:

Bats are blind.
No, we cannot see.

nu este corectare.

Este:

reinforcement / restatement of the misconception.

Actualul SCIENCE_REVIEW este greșit.

Dacă artifact-ul lasă aceasta drept concluzie:

→ confirmed false scientific takeaway;

→ REPAIR_REQUIRED.

⸻

9. Reafirmarea ulterioară contează

P11:

mit → corectare → mit reafirmat ulterior.

Corectarea inițială nu garantează PASS.

Trebuie evaluată traiectoria:

claim → correction → later stance → final takeaway.

Dacă produsul revine și validează eroarea:

→ final scientific takeaway poate deveni fals;

→ REPAIR_REQUIRED dacă este confirmat.

⸻

FEREASTRA DE CORECTARE

10. Nu există o fereastră rigidă în număr de propoziții

Respinge:

* same sentence only;
* next sentence only;
* same page only;
* next page only;
* N propoziții;
* N tokeni.

Acestea pot fi evidence despre proximitate.

Nu sunt politica.

⸻

11. Fereastra este semantică și narativă

Corectarea poate traversa:

* aceeași propoziție;
* două replici de dialog;
* aceeași pagină;
* un page turn;
* un spread;
* o secvență narativă imediată.

Dacă relația este clară și takeaway-ul rezultat este corect, corectarea poate fi validă.

⸻

12. Same sentence

O corectare clară în aceeași propoziție poate fi:

→ PASS.

Exemplu:

Many people think bats are blind, but bats can see.

Aici mitul este prezentat explicit ca belief și imediat corectat.

Nu există motiv să fie REVIEW doar pentru că propoziția conține mitul.

⸻

13. Same page

O corectare clară în dialog pe aceeași pagină poate fi:

→ PASS.

Nu este necesar să fie în aceeași propoziție.

⸻

14. Page turn

Corectarea pe pagina următoare NU este automat REVIEW.

Dacă page-turn-ul este chiar mecanismul narativ:

pagina A:
Are bats really blind?

sau un personaj afirmă mitul;

pagina B imediat următoare:
corectarea este explicită și neechivocă;

atunci poate exista:

→ PASS sau PASS_WITH_ADVISORY,

în funcție de isolation risk și banda țintă.

⸻

15. Spread-ul poate fi unitate semantică

Dacă două pagini formează în mod evident același spread / question-answer unit, evaluatorul trebuie să poată analiza această relație.

Nu trata automat limita de pagină drept limită semantică.

⸻

16. Corectarea mult mai târziu

O corectare la distanță mare:

* nu este automat invalidă;
* dar nici nu șterge expunerea anterioară.

Trebuie evaluate:

* durata expunerii;
* repetarea mitului;
* autoritatea speaker-ului;
* câte pagini îl lasă necontestat;
* isolation risk;
* cât de puternică este corectarea;
* dacă este legată explicit de mitul inițial;
* final takeaway.

O concepție greșită menținută multe pagini și corectată abia la final poate necesita:

→ REVIEW_REQUIRED,

chiar dacă finalul este corect.

⸻

BAT-05 / P-C10

17. Verdictul exact

Pentru:

Bats are blind, said the owl. "No, we can see," laughed the bat.

la 7–8:

→ afirmație falsă locală atribuită bufniței;

→ corectare explicită;

→ aceeași propoziție/proprietate este contrazisă;

→ corectarea vine chiar de la subiectul afirmației;

→ corectarea este științific corectă;

→ nu există reafirmare;

→ takeaway-ul rezultat este clar;

→ PASS.

Deci:

v2c-sci-bat-05 / P-C10 = PASS la 7–8.

Actualul SCIENCE_REVIEW nu reprezintă politica finală.

⸻

18. Nu transforma „subiectul însuși corectează” în bypass

Faptul că liliacul corectează afirmația este evidence puternică.

Dar nu implementa:

subject corrects → PASS.

Orice speaker poate spune altă eroare.

Conținutul corectării trebuie verificat semantic și științific.

⸻

CINE POATE CORECTA

19. Corectarea nu depinde de o listă fixă de roluri

Poate corecta:

* personajul vizat;
* alt personaj;
* adultul;
* ghidul;
* profesorul;
* expertul;
* naratorul;
* o sursă explicită din poveste.

Rolul contribuie la epistemic authority.

Nu decide singur verdictul.

⸻

20. Naratorul

O corectare clară a naratorului poate fi suficientă.

Exemplu conceptual:

The owl was mistaken. Bats can see.

→ correction valid candidate.

Nu cer obligatoriu dialog.

⸻

21. „The owl was mistaken”

O simplă marcare:

The owl was wrong.

poate respinge propoziția precedentă.

Dar trebuie evaluat dacă este suficient de clar ce anume era greșit.

Pentru o propoziție binară simplă poate fi suficient.

Pentru o concepție complexă poate lăsa copilul fără modelul corect.

Dacă resolution-ul rămâne ambiguu:

→ REVIEW.

⸻

22. Afirmații concurente

Dacă:

* bufnița spune X;
* cârtița spune Y;
* povestea nu stabilește care este corect;

atunci nu există automat corectare.

→ REVIEW_REQUIRED dacă final takeaway-ul rămâne epistemic ambiguu.

⸻

FĂRĂ CORECTARE

23. False narrator assertion

Dacă naratorul afirmă drept fapt:

Bats are blind.

și produsul nu contestă afirmația:

→ candidate scientific defect;

→ după confirmarea factuală și contextuală:

REPAIR_REQUIRED.

⸻

24. Character assertion fără corectare

Aici NU aplicăm automat aceeași regulă.

Trebuie analizat stance-ul.

Character says false thing

nu este suficient pentru:

product teaches false thing.

⸻

25. Personaj + artifact endorsement

Dacă personajul spune mitul, iar:

* naratorul îl validează;
* ceilalți îl confirmă;
* acțiunea îl prezintă drept adevăr;
* imaginea îl întărește;
* finalul îl lasă ca takeaway;

atunci:

→ confirmed false scientific takeaway;

→ REPAIR_REQUIRED.

⸻

26. Personaj greșit, dar stance-ul marchează clar eroarea

Dacă povestea arată fără ambiguitate că personajul este greșit, chiar fără formula lexicală clasică de corectare, poate exista o rezolvare semantică.

Dar trebuie să fie suficient de perceptibilă pentru banda țintă.

Dacă nu este clar:

→ REVIEW_REQUIRED.

⸻

27. Simplă atribuire fără stance

"Bats are blind," said the owl.

iar povestea nu oferă nimic altceva:

nu este automat echivalent cu narrator endorsement.

Dar pentru un produs educațional destinat copiilor, copilul poate rămâne cu afirmația falsă.

Prin urmare:

→ REVIEW_REQUIRED la stadiul candidate/stance unresolved;

→ dacă analiza confirmă că artifact-ul o livrează efectiv drept takeaway factual:
REPAIR_REQUIRED.

Nu folosi simplul said the owl ca scut.

⸻

REVIEW VS REPAIR

28. Modelul D-14 se aplică și aici

Trebuie separat:

candidate scientific problem
de
confirmed scientific defect.

⸻

29. REVIEW_REQUIRED

Folosește REVIEW când trebuie stabilit:

* dacă afirmația este într-adevăr falsă în context;
* dacă speaker-ul este prezentat ca nesigur;
* dacă există corectare semantică;
* dacă acea corectare este suficientă;
* dacă imaginea schimbă stance-ul;
* dacă final takeaway-ul este ambiguu;
* dacă simplificarea este acceptabilă pentru vârstă.

Operatorul poate închide finding-ul dacă nu există defect.

⸻

30. REPAIR_REQUIRED

Dacă după analiză este confirmat că produsul comunică drept adevăr o propoziție științific falsă relevantă:

→ REPAIR_REQUIRED.

Operatorul nu poate spune:

„Da, copilului îi spunem ceva fals ca fapt, dar aprob.”

Trebuie:

repair → re-evaluate → validate.

⸻

31. REPAIR_REQUIRED nu este safety BLOCK

Ca în D-14:

REPAIR_REQUIRED

nu este același lucru cu:

BLOCKED_BY_POLICY.

Este un defect factual confirmat al produsului.

⸻

AGE BAND

32. Adevărul nu se schimbă cu banda

Bats can see

este adevărat indiferent dacă produsul este:

* 3–4;
* 5–6;
* 7–8.

Nu crea science truth pe bandă.

⸻

33. Perceptibilitatea corectării poate varia

Banda poate modifica:

* cât de explicită trebuie să fie corectarea;
* câtă distanță narativă este tolerabilă;
* câtă inferență poate fi cerută;
* cât de riscantă este izolarea paginii;
* cât de ușor poate copilul distinge speaker belief de narrator truth.

Aceasta este interacțiune cu age-fit.

Nu modificare a adevărului.

⸻

34. Pentru 3–4

Corectarea trebuie să fie în general:

* foarte clară;
* apropiată;
* concretă;
* perceptibilă;
* cu relație evidentă față de mit.

Dar D-15 NU fixează acum un prag mecanic:

3–4 = same page only.

⸻

35. Pentru 5–6

Poate fi tolerată o structură puțin mai narativă dacă relația claim→correction rămâne clară.

Nu fixa un număr de pagini.

⸻

36. Pentru 7–8

Poate exista o demontare mai elaborată a concepției greșite.

Dar:

7–8 ≠ science bypass.

Un mit necorectat sau reafirmat ca adevăr rămâne defect.

⸻

37. Nu inventăm Gold labels pentru benzile neacoperite

Evidence-ul actual de science este EN 7–8.

Înregistrează această limită.

D-15 definește principiul semantic pentru toate benzile, dar nu pretinde că Gold-v2 a demonstrat empiric pragurile pentru 3–4 sau 5–6.

Păstrează L-16.

⸻

VISUAL / CROSS-MODAL

38. D-15 se aplică text + visual + cross-modal

Da.

Imaginea poate:

* întări afirmația falsă;
* contrazice afirmația;
* susține corectarea;
* crea ea însăși o afirmație factuală vizuală.

⸻

39. Imaginea poate susține o corectare

Dacă textul spune:

No, bats can see.

iar imaginea arată liliacul folosindu-și vederea într-o manieră relevantă:

→ cross-modal evidence poate întări corectarea.

⸻

40. Visual-only correction

Nu stabilesc:

visual correction = never valid.

Dar o corectare exclusiv vizuală cere standard mai strict de interpretabilitate.

Dacă imaginea demonstrează neechivoc contrariul mitului și relația este clară:

→ poate contribui real la resolution.

Dacă trebuie inferat prea mult:

→ REVIEW_REQUIRED.

⸻

41. P17

Pentru simplul:

bat looks with big eyes

nu rezultă automat semantic:

bats can see.

Ochii deschiși nu sunt o corectare științifică suficientă.

Prin urmare P17:

→ afirmația textuală rămâne nerezolvată prin acel indiciu vizual;

→ nu considera imaginea corectare doar prin keyword/object presence.

⸻

42. Corectare prin acțiune

P19:

found the berries by looking

poate constitui evidence semantic mai puternic decât simpla imagine a ochilor.

Dar trebuie analizat dacă acțiunea implică într-adevăr vederea și dacă legătura cu mitul este perceptibilă.

Nu implementa:

action contradicts claim → automatic PASS.

Poate fi:

* valid correction;
* supporting evidence;
* sau REVIEW dacă relația este prea implicită.

⸻

43. Imaginea poate purta defectul

Dacă textul este corect, dar imaginea comunică factual contrariul într-un mod relevant:

→ există visual/cross-modal science finding.

Textul corect nu șterge automat defectul vizual.

⸻

SCOPE

44. Page → Book → Volume → Collection

D-15 adoptă explicit:

Page → Book → Volume → Collection.

⸻

45. Finding-ul local se păstrează

Dacă pagina 2 conține mitul și pagina 3 îl corectează:

finding-ul local al expunerii nu este șters.

Dar artifact-level consequence poate fi PASS dacă resolution-ul este suficient.

Aceasta este aceeași separare conceptuală:

local event ≠ final artifact stance.

⸻

46. Page isolation risk

O pagină care, privită singură, pare să predea mitul poate avea:

page isolation risk.

Acest lucru poate conta mai mult la 3–4 decât la 7–8.

Dar:

page isolation risk ≠ automatic science defect.

Este evidence pentru age-fit/editorial review.

⸻

47. Book-level correction

O carte poate avea ca scop:

misconception → exploration → correction.

Aceasta este permisă.

Dacă final takeaway-ul este clar și corect, simpla existență a mitului anterior nu transformă cartea în defect științific.

⸻

48. Expunerea prelungită

Dacă mitul:

* este repetat;
* rămâne necontestat multe pagini;
* este întărit vizual;
* vine de la surse autoritative;

iar corectarea apare foarte târziu:

→ poate exista REVIEW_REQUIRED chiar dacă finalul este corect.

Motivul este perceptibilitatea și acumularea, nu o „fereastră de N pagini”.

⸻

49. Volume / Collection normalization

Dacă aceeași concepție greșită este repetată în mai multe cărți sau volume, o singură corectare îndepărtată nu neutralizează automat întregul pattern.

Trebuie evaluat:

* frequency;
* salience;
* scope;
* correction reach;
* final takeaway pe fiecare artifact relevant.

⸻

SCIENTIFIC SIMPLIFICATION

50. D-15 nu confundă falsitatea cu simplificarea

Unele afirmații pentru copii sunt simplificate fără a fi falsități materiale.

D-15 nu finalizează taxonomia:

acceptable simplification vs misleading oversimplification vs false claim.

Aceasta rămâne dependență.

Nu transforma orice lipsă de precizie academică în REPAIR_REQUIRED.

⸻

PARITATE

51. EN / RO semantic parity

Da.

Evaluatorul trebuie să recunoască aceeași relație:

EN:
Bats are blind.
No, we can see.

RO:
Liliecii sunt orbi.
Nu, noi vedem.

Nu prin liste independente fragile.

Prin:

claim proposition → correction proposition → semantic contradiction/resolution.

⸻

52. P12 / P13

Faptul că actualul evaluator nu recunoaște vedem este:

implementation failure / parity failure.

Nu policy.

⸻

CRITIC / QUALITY

53. D-14 se păstrează

Science findings pot fi oferite criticului drept evidence/context.

Dar nu accept:

SCIENCE_REVIEW exists → critic lowers score mysteriously.

Orice impact asupra quality trebuie să fie trasabil.

⸻

54. Science consequence trebuie să fie deterministă prin propriul model

Official science consequence trebuie să vină din:

science finding → confirmation → artifact stance/takeaway → consequence.

Nu din:

science finding → critic prompt → unknown score change.

⸻

REZULTATELE PROBELOR

55. P1

Corectare clară și semantic legată:

→ candidate PASS.

⸻

56. P2 — pagina următoare

NU automat REVIEW.

Dacă page-turn-ul este imediat și relația este clară:

→ PASS sau PASS_WITH_ADVISORY.

Dacă pagina precedentă funcționează independent ca afirmație autoritativă și corectarea este slab legată:

→ REVIEW.

⸻

57. P3 / P4 / P18 — corectare îndepărtată

Actualul CLAIM mecanic nu este politica.

Trebuie evaluată semantic.

Distanța mare este factor agravant.

Poate rezulta:

* REVIEW;
* PASS după resolution foarte clar;
* REPAIR dacă final takeaway-ul rămâne fals.

⸻

58. P5 — fără corectare

Dacă afirmația rămâne final takeaway:

→ confirmed defect
→ REPAIR_REQUIRED.

Dacă este doar character belief cu stance nerezolvat:

→ REVIEW până la clarificare.

⸻

59. P6 — întărire

Nu este corectare.

Dacă final takeaway-ul este fals:

→ REPAIR_REQUIRED.

⸻

60. P7 — „No” fără legătură

Nu este corectare.

Evaluatorul actual are fals pozitiv structural.

⸻

61. P8 — răspuns ambiguu

Hmm, are we?

nu corectează factual mitul.

→ REVIEW_REQUIRED dacă stance-ul final rămâne ambiguu.

⸻

62. P9 / P10 — narator

Naratorul poate corecta valid.

Nu există motiv pentru REVIEW doar pentru că speaker-ul corectării este naratorul.

Dacă correction relation este explicită, corectă și final takeaway clar:

→ PASS.

⸻

63. P11 — corectat apoi reafirmat

Trebuie analizată ultima stare semantică.

Dacă reafirmarea ulterioară restabilește mitul drept adevăr:

→ REPAIR_REQUIRED.

⸻

64. P12 / P13 — RO

Aceeași politică precum EN.

Actualul CLAIM este parity failure.

⸻

65. P14–P16 — adult / ghid

Adultul sau ghidul pot corecta.

Authority poate întări perceptibilitatea.

Nu este însă bypass.

Corectarea trebuie să fie corectă și legată semantic de claim.

⸻

66. P17 — indiciu vizual slab

Nu este suficient singur în forma descrisă.

→ nu considera automat corectat.

⸻

67. P19 — correction through action

Poate conta semantic.

Necesită interpretarea relației.

Nu trebuie ratată doar pentru că nu conține No/Actually.

⸻

STĂRI CONCEPTUALE

68. Pentru science, D-15 adoptă cel puțin

PASS
→ takeaway științific corect și clar.

PASS_WITH_ADVISORY
→ takeaway corect, dar există isolation/proximity/perceptibility concern non-material.

REVIEW_REQUIRED
→ truth/stance/correction/perceptibility/takeaway rămâne suficient de incert sau material editorial.

REPAIR_REQUIRED
→ produsul comunică confirmat o falsitate științifică materială drept adevăr.

⸻

69. Nu folosim BLOCK pentru defect factual

REPAIR_REQUIRED

este distinct de:

BLOCKED_BY_POLICY.

Același principiu arhitectural stabilit în D-14.

⸻

REASON CODES CONCEPTUALE

Semantic Hardening #2 poate folosi coduri de tip:

* SCIENCE_FALSE_CLAIM_EXPOSED
* SCIENCE_CORRECTION_CLEAR
* SCIENCE_CORRECTION_AMBIGUOUS
* SCIENCE_CORRECTION_INCORRECT
* SCIENCE_CORRECTION_TOO_IMPLICIT
* SCIENCE_FALSE_CLAIM_REINFORCED
* SCIENCE_FALSE_CLAIM_REASSERTED
* SCIENCE_TAKEAWAY_AMBIGUOUS
* SCIENCE_TAKEAWAY_FALSE
* SCIENCE_VISUAL_CONTRADICTION
* SCIENCE_PAGE_ISOLATION_RISK

sau denumiri mai bune echivalente.

Nu transforma aceste coduri într-un tabel rigid code → verdict.

⸻

CE DECIDE D-15

D-15 stabilește definitiv că:

* personajele pot exprima concepții greșite;
* simpla prezență a unui mit nu înseamnă endorsement;
* corectarea se evaluează semantic;
* nu există fereastră fixă de propoziții/pagini;
* same-page poate fi PASS;
* next-page poate fi PASS;
* distanța mare este factor, nu verdict;
* corectarea trebuie să se refere la aceeași afirmație;
* corectarea trebuie să fie ea însăși corectă;
* No/Actually/De fapt nu sunt suficiente;
* speaker authority este evidence, nu bypass;
* final scientific takeaway contează;
* finding-ul local nu este șters de corectarea ulterioară;
* reafirmarea ulterioară poate anula resolution-ul;
* adevărul științific nu se schimbă cu banda;
* perceptibilitatea corectării poate varia cu banda;
* visual și cross-modal evidence contează;
* o corectare exclusiv vizuală poate conta numai dacă este semantic neechivocă;
* confirmed false scientific takeaway → REPAIR_REQUIRED;
* un character claim cu stance nerezolvat poate fi REVIEW, nu automat REPAIR;
* operatorul poate respinge un false positive;
* operatorul nu poate aproba neschimbat un confirmed material scientific falsehood.

⸻

CE NU DECIDE D-15

D-15 NU decide:

* taxonomia completă a concepțiilor greșite;
* toate simplificările științifice acceptabile pentru copii;
* praguri numerice de distanță;
* un număr maxim de pagini;
* toate pragurile de perceptibilitate 3–4 / 5–6 / 7–8;
* toate regulile pentru lumi fantastice;
* criteriul științific din quality rubric / D-17;
* pragurile D-16;
* evidence validity D-18;
* Gold measurement D-19/D-20;
* taxonomia completă de visual science;
* validitatea empirică a evaluatorului.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea D, rafinată: semantic correction resolution + final scientific takeaway + scope-aware evaluation. Axa: SCIENTIFIC ACCURACY / SCIENTIFIC FIDELITY OF THE PRODUCT, separată de siguranță, content-policy, age-fit, calitate și fidelitatea localizării. FALSE CLAIM EXPOSURE ≠ PRODUCT ENDORSEMENT. CHARACTER ERROR ≠ SCIENTIFIC DEFECT BY ITSELF. CORRECTION TOKEN ≠ SEMANTIC CORRECTION. CORRECTION DISTANCE ≠ CORRECTION QUALITY. SCIENTIFIC TRUTH DOES NOT CHANGE WITH AGE; CORRECTION PERCEPTIBILITY CAN. |
| **Propoziția științifică / statutul de adevăr** | Propoziția extrasă semantic. Adevărul nu depinde de bandă. Simplificarea ≠ falsitate (taxonomia rămâne dependență). |
| **Sursa / atribuirea / stance epistemic și narativ** | Cine o spune, cui îi e atribuită, dacă e prezentată ca fapt sau credință, dacă povestea o susține, o lasă necontestată sau o corectează. „said the owl” nu e scut. |
| **Finding candidat / stare de confirmare** | Afirmația falsă detectată = candidat, nu verdict. Stări: candidate, confirmed, dismissed, repaired, revalidated (modelul D-14). |
| **Corectarea: prezență, sursă, propoziție, relație, corectitudine, explicitare** | Corectarea se referă la aceeași propoziție și o contrazice semantic. Trebuie să fie corectă științific. „No” / „Actually” / „De fapt” / un cuvânt opus nu ajung. Sursa e evidence de autoritate, nu bypass (inclusiv subiectul însuși). Naratorul poate corecta. Corectarea prin acțiune poate conta. Corectarea doar vizuală cere un standard mai strict. |
| **Proximitate / pagină / spread** | Fără fereastră rigidă (propoziție, pagină, N pagini, N tokeni). Aceeași propoziție sau pagină → PASS dacă e clară. **Pagina următoare NU e automat REVIEW** (PASS sau PASS_WITH_ADVISORY după isolation risk și bandă). Spread-ul poate fi unitate semantică. Distanța mare = factor agravant, nu verdict. |
| **Perceptibilitate pe bandă** | Banda modifică explicitarea, distanța tolerabilă, inferența și riscul izolării, nu adevărul. 3–4: foarte clar și apropiat, fără „same page only”. 5–6: mai narativ, dacă relația rămâne clară. 7–8 ≠ science bypass. Pragurile 3–4 / 5–6 nu sunt demonstrate empiric (L-16). |
| **Repetare / întărire / contrazicere / reafirmare** | Întărirea nu e corectare (P6). Reafirmarea ulterioară poate anula rezolvarea (P11): ultima stare semantică contează. |
| **Takeaway local / izolarea paginii / takeaway de carte / pattern pe volum și colecție** | Finding-ul local al expunerii se păstrează. Izolarea paginii = evidence pentru age-fit / review editorial, nu defect automat. Arcul misconception → exploration → correction e permis. Expunerea prelungită poate da REVIEW chiar cu final corect. Un mit repetat în volume nu e neutralizat de o singură corectare îndepărtată. |
| **Text / vizual / cross-modal** | Imaginea poate întări, contrazice, susține corectarea sau purta ea însăși o afirmație. P17 (ochi mari) nu e corectare. Textul corect nu șterge un defect vizual. |
| **Severitate / consecință / reparație / revalidare** | PASS: takeaway corect și clar. PASS_WITH_ADVISORY: corect, cu o problemă non-materială de izolare / proximitate / perceptibilitate. REVIEW_REQUIRED: adevăr, stance, corectare sau takeaway incerte (operatorul poate închide un fals pozitiv). **REPAIR_REQUIRED: confirmed false scientific takeaway**, neaprobabil neschimbat; repair → re-evaluate → validate. Nu BLOCKED_BY_POLICY. |
| **Narator vs personaj fără corectare** | Narator afirmă ca fapt, necontestat → candidat → confirmat → REPAIR. Personaj fără stance → REVIEW (nu automat REPAIR). Personaj + endorsement al artifactului (narator, alții, acțiune, imagine, final) → REPAIR. |
| **Paritate EN / RO** | Aceeași relație claim → correction → contradiction / resolution. P12 / P13 = eșec de paritate al implementării. |
| **Critic / calitate** | D-14 se păstrează. Consecința științifică oficială vine din propriul model (finding → confirmation → stance / takeaway → consequence), nu din promptul criticului. |
| **Rezultatele explicite** | **v2c-sci-bat-05 / P-C10 (7–8) → PASS.** P6 → întărire, nu corectare. P7 → „No” / „see” fără legătură, nu corectare. P8 → corectare ambiguă → candidat REVIEW. P11 → corectare urmată de reafirmare; takeaway-ul final decide. P12 / P13 → eșec de paritate EN / RO. Corectarea pe pagina următoare → NU automat REVIEW. Takeaway științific fals confirmat → REPAIR_REQUIRED. |
| **Comportamentul evaluatorului la momentul deciziei** (HEAD `d75f0d6`, neschimbat) | `science.js`: corectarea în aceeași propoziție = tipar de credință / „but” + tipar opus → atenuat. Propoziția următoare sau prima propoziție a paginii următoare cu tipar opus sau „no / actually / de fapt” + cuvânt-cheie → `SCIENCE_REVIEW` minor. Altfel `SCIENCE_CLAIM` major. Probe: bat-05 → REVIEW; P6 și P7 → REVIEW (accidente); P3 / P4 / P18 / P8 / P17 / P19 → CLAIM; P12 / P13 (RO) → CLAIM; „hooted” → vorbitor *narrator*. Fără bandă. **Nici CLAIM, nici REVIEW nu blochează readiness, evaluarea cărții sau release-ul.** Efectul trece doar prin `criticNotes` (fără canon). Rubrica nu are criteriu științific. La scorarea Gold, REVIEW e prezis *positive*. **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Propoziție, adevăr, vorbitor, stance. Corectarea ca propoziție cu relație semantică și verificare științifică. Întărire și reafirmare. Traiectoria până la takeaway pe niveluri. Perceptibilitate pe bandă ca evidence. Spread / page turn. Evidence vizual și cross-modal. Stări de confirmare și consecințe deterministe, trasabile, nu prin `criticNotes`. Paritate EN / RO. Coduri conceptuale fără tabel rigid. Cazuri 3–4 / 5–6 / RO pentru testare ulterioară. |

### Afectate (fără nicio modificare acum)

- **Gold-v2:** v2c-sci-bat-05 → PASS la 7–8 (eticheta se dă la adjudecare). v2c-sci-bat-04 rămâne neschimbat; în modelul D-15, stance nerezolvat → REVIEW, takeaway fals confirmat → REPAIR (reprezentarea → D-19 / D-20). bat-02 / sun-02 → PASS (coerent).
- **Probe:** P-C10 → PASS la 7–8; registrul nu se schimbă acum.
- **Setul rezervat (înghețat):** v2h-sci-07 / -08 neschimbate; niciun caz de corectare ulterioară.
- **Gold-v1:** neschimbat.

### Nu decide

Taxonomia concepțiilor greșite · simplificările acceptabile · praguri numerice de distanță · număr maxim de pagini · pragurile de
perceptibilitate pe benzi · lumile fantastice · criteriul științific din rubrică (D-17) · D-16 · D-18 · măsurarea (D-19 / D-20) ·
taxonomia științei vizuale · validitatea empirică.

### Dependențe deschise

- **D-15-DEP-SIMPLIFICATION-TAXONOMY** (OBS-GS-15).
- **D-15-DEP-MISCONCEPTION-TAXONOMY** (L-10).
- **D-15-DEP-BAND-PERCEPTIBILITY-EVIDENCE** (L-16; D-20 / D-22).
- **D-15-DEP-FANTASY-WORLD-SCIENCE**.
- **D-15-DEP-VISUAL-SCIENCE-TAXONOMY**.
- **D-15-DEP-RUBRIC-SCIENCE-CRITERION** → D-17.
- **D-15-DEP-MEASUREMENT** → D-19 / D-20.

## D-16 — Minimul pentru criteriile non-critice; semantica pragurilor

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-16 — DECIZIA OPERATORULUI

Aleg Opțiunea D, rafinată: universal applicable floor + applicability + exact threshold semantics + no quality waiver of a confirmed defect.

Principiile centrale sunt:

OVERALL QUALITY CANNOT COMPENSATE FOR A CONFIRMED SUBSTANDARD DIMENSION.

A QUALITY FLOOR APPLIES ONLY TO AN APPLICABLE CRITERION.

CRITIC SCORE ≠ GROUND TRUTH.

CHALLENGING A SCORE ≠ WAIVING THE QUALITY STANDARD.

DISPLAY ROUNDING ≠ DECISION VALUE.

MATHEMATICAL EQUALITY AT A THRESHOLD MUST PASS.

PASSING THE QUALITY GATE OUTRANKS A HIGHER AVERAGE THAT FAILS THE GATE.

Nu implementa acum.

⸻

1. Politica D-16

Pentru kids-sc, WonderPages adoptă formal:

* overall mean ≥ 8;
* T01 ≥ 8;
* T08 ≥ 8;
* pentru fiecare alt criteriu aplicabil, minimum ≥ 7, cu statutul special al T07 păstrat pentru D-17;
* un criteriu declarat legitim NOT_APPLICABLE nu este comparat cu minimum-ul și nu intră în media criteriilor aplicabile.

Astfel, D-16 validează acum explicit minimum-ul 7 ca politică editorială WonderPages pentru criteriile aplicabile.

Înregistrarea trebuie să spună însă clar:

policy decision ≠ empirically validated threshold.

Valoarea 7 este standardul de produs decis de operator.

Validitatea empirică a pragului rămâne o chestiune separată.

⸻

2. Clarificarea deciziei anterioare despre T13

Decizia anterioară:

T13 = 6.5 is insufficient for automatic acceptance

a fost specifică T13 și NU valida atunci:

minCriterion = 7 for every rubric criterion.

D-16 este decizia care rezolvă acum explicit acea întrebare.

De acum înainte, pentru kids-sc:

orice criteriu aplicabil < 7 nu poate fi compensat de medie.

⸻

3. v2c-quality-09 — T04 = 6.5

T04 = 6.5, restul 9:

→ overall foarte mare;

→ T04 este sub minimum;

→ QUALITY GATE FAIL;

→ repair/re-evaluation required.

Deci:

v2c-quality-09 = negative / not acceptable as-is.

Media 8.861 nu compensează T04 = 6.5.

⸻

4. v2h-quality-06 — T14 = 6.5

Dacă T14 este aplicabil:

T14 = 6.5:

→ sub minimum;

→ QUALITY GATE FAIL;

→ repair/re-evaluation required.

Deci cazul trebuie adjudecat conform:

v2h-quality-06 = negative / not acceptable as-is.

Nu rula din nou setul rezervat.

Înregistrează decizia fără rerun.

⸻

5. T13 = 6.5

Rămâne:

→ sub minimum;

→ repair/re-evaluation required.

Decizia existentă nu se schimbă.

⸻

6. T13 = 7.0

Rămâne:

→ minimum satisfăcut;

→ poate PASS dacă toate celelalte condiții sunt satisfăcute.

⸻

THRESHOLD SEMANTICS

7. Egalitatea trece

Pentru toate pragurile numerice din aria D-16:

score >= threshold

înseamnă matematic exact acest lucru.

Prin urmare:

* overall = 8.0 → PASS pentru condiția overall;
* T01 = 8.0 → PASS pentru condiția T01;
* T08 = 8.0 → PASS pentru condiția T08;
* criterion minimum = 7.0 → PASS pentru condiția minimum.

Nu:

score > threshold.

⸻

8. 6.99 nu este 7

Dacă valoarea canonică validă este:

6.99

atunci:

6.99 < 7

→ FAIL.

Nu o rotunji la 7 înainte de comparație.

⸻

9. 7.0 este 7

7.0 >= 7

→ PASS.

⸻

10. Media matematic exact 8 trebuie să treacă

Cazul:

17 × 8.1 + 6.3

are media matematică:

8.

Prin urmare:

→ condiția mean >= 8 este satisfăcută.

Actualul rezultat:

7.9999999999999964 < 8

este:

FLOATING-POINT IMPLEMENTATION DEFECT.

Nu este policy.

⸻

11. Fără binary floating-point la deciziile de prag

Semantic Hardening #2 trebuie să implementeze comparațiile astfel încât valorile zecimale canonice să nu depindă de aproximarea IEEE binary floating point.

Poate fi folosită ulterior implementarea tehnică adecvată:

* decimal arithmetic;
* scaled integer;
* rational arithmetic;
* sau echivalent determinist.

D-16 decide comportamentul matematic.

Nu biblioteca.

⸻

12. Display rounding este strict prezentare

Exemplu:

mean exact = 7.9556

display = 8.0.

Verdict:

→ FAIL pentru pragul mean ≥ 8.

UI trebuie să poată afișa 8.0 dacă acesta este formatul ales, dar trebuie să arate clar motivul:

exact/canonical mean below 8.

Nu permite UI-ului să sugereze că valoarea afișată 8.0 a fost valoarea comparată.

Ideal, în evidence/audit se păstrează valoarea canonică ne-rotunjită folosită la decizie.

⸻

13. OBS-GS-19 este formalizat

Confirm formal principiul:

threshold comparison uses the canonical unrounded decision value; rounding is display-only.

Dar actualul floating-point bug arată că „unrounded” nu este suficient dacă reprezentarea însăși este aproximativă.

De aceea contractul final este:

canonical mathematically faithful value → threshold comparison → verdict → display rounding.

Nu:

binary approximation → threshold

și nici:

rounded display value → threshold.

⸻

GRANULARITATE

14. D-16 NU inventează acum o granulație numerică

Nu există în evidence-ul actual un contract suficient care să demonstreze că notele trebuie să fie:

* numai întregi;
* multipli de 0.5;
* multipli de 0.1;
* sau orice număr de zecimale.

Prin urmare nu introduc arbitrar:

only 0.5 increments

sau:

only one decimal.

Granularitatea rămâne o dependență de contract/scoring calibration.

⸻

15. Până la definirea granulației

Orice valoare validă produsă conform contractului de scoring trebuie comparată în forma sa canonică.

Prin urmare, dacă 6.99 este o valoare validă conform contractului viitor:

→ FAIL.

Dacă viitorul contract nu permite 6.99, aceasta trebuie respinsă/normalizată la nivel de validare a scorului, nu rotunjită în secret de quality gate.

⸻

APPLICABILITY

16. Introducem explicit starea NOT_APPLICABLE

Un criteriu poate avea:

* SCORED;
* NOT_APPLICABLE.

Dar NOT_APPLICABLE nu este o notă.

Nu este:

0.

Nu este:

10.

Nu este un shortcut pentru evitarea minimum-ului.

⸻

17. N/A trebuie justificat

Un criteriu poate fi NOT_APPLICABLE numai dacă există evidence citabilă că cerința acelui criteriu nu se aplică artifact-ului evaluat.

Exemplul menționat în investigație:

T09 într-un context în care cerința sa nu este relevantă.

D-16 nu decide acum că T09 este automat N/A în volumul 1.

Decide mecanismul:

applicability must be established from criterion semantics + artifact context + evidence.

⸻

18. Default = applicable

În absența unei justificări valide:

→ criteriul este tratat ca aplicabil.

Nu permite criticului:

I don't like evaluating this → N/A.

⸻

19. N/A trebuie să fie auditat

Pentru fiecare N/A păstrează:

* criterion id;
* criterion definition/version;
* applicability rule;
* artifact context;
* evidence;
* reason;
* evaluator/actor;
* timestamp/version provenance.

⸻

20. N/A și media

Un criteriu legitim N/A:

→ este exclus din denominator-ul mediei.

Media se calculează numai peste criteriile aplicabile și evaluate valid.

Nu introduce artificial:

* zero;
* zece;
* score implicit.

⸻

21. Anti-gaming

Dacă un criteriu important este declarat N/A doar pentru a ridica media:

→ evidence invalid;

→ quality evaluation invalid;

→ nu PASS.

⸻

CRITIC SCORE VS QUALITY STANDARD

22. Nota criticului nu este adevăr absolut

OBS-GS-18 rămâne valabil.

Un critic poate:

* interpreta greșit;
* rata context;
* cita evidence greșită;
* produce o notă inconsistentă.

Prin urmare:

critic says T04=6.5

nu înseamnă automat că adevărul obiectiv este:

T04 really is 6.5.

⸻

23. Dar asta NU creează quality waiver

Nu adopt recomandarea:

confirmed score < 7 → operator may accept anyway with justification.

Dacă un criteriu aplicabil este confirmat sub minimum:

→ artifact-ul nu satisface standardul WonderPages.

Operatorul nu poate transforma:

6.5

în:

quality-compliant

printr-un waiver.

⸻

24. Operatorul poate contesta finding-ul / scorul

Operatorul poate spune:

această evaluare 6.5 este greșită.

Atunci trebuie:

→ re-evaluation / evidence validation;

→ eventual independent assessment;

→ score/finding resolution;

→ audit trail.

Dacă evaluarea este invalidată și scorul corect este ≥7:

→ artifact-ul poate PASS.

Aceasta este:

score/finding override based on evidence,

nu:

quality-standard waiver.

⸻

25. Distincția obligatorie

Trebuie păstrată arhitectural:

OVERRIDE INVALID EVALUATION

versus

WAIVE CONFIRMED QUALITY DEFECT.

Prima este permisă cu evidence.

A doua NU este permisă pentru acceptance conform D-16.

⸻

CONSEQUENCE

26. Criteriu aplicabil < 7

Prima consecință:

→ REPAIR_REQUIRED;

→ re-evaluate.

Nu release.

⸻

27. După repair

Dacă după repair scorul este încă <7:

nu trece automat la:

operator can accept anyway.

Trebuie stabilit dacă:

A. artifact-ul este încă realmente sub standard;

sau

B. evaluarea/scorul este greșit.

Dacă A:

→ continuă să fie REPAIR_REQUIRED / NOT QUALITY-PASSING.

Dacă B:

→ finding-ul/scorul poate fi invalidat prin procesul de evidence validation.

⸻

28. Fără waiver ascuns

Nu permite:

* manual PASS flag;
* operator approved despite 6.5;
* score ignored;
* release override care ascunde criteriul.

Dacă va exista vreodată o procedură excepțională de release neconform, ea trebuie să fie o politică separată, explicită, auditată și NU trebuie să fie numită quality PASS.

D-16 nu creează o astfel de procedură.

⸻

CRITICAL CRITERIA

29. T01 și T08

Rămân:

T01 ≥ 8
T08 ≥ 8.

Minimum-ul universal 7 nu le reduce pragul.

Pragul mai strict domină.

⸻

30. Un singur defect logic, un singur motiv principal

Dacă:

T01 = 6.5,

nu vreau două defecte independente:

* below universal minimum;
* critical below threshold.

Este aceeași valoare care încalcă pragul aplicabil.

Reason-ul principal trebuie să fie cel mai specific/strict:

QUALITY_CRITICAL_BELOW_THRESHOLD:T01

sau echivalent.

Metadata poate consemna și faptul că este sub 7.

Nu dubla defectul.

⸻

31. T07

D-16 NU redefinește T07.

Contractul existent al rubricii rămâne înregistrat.

Relația:

T07 rubric critical criterion

versus

safety gate

este D-17.

Nu deduce politica D-17 din minimum-ul universal D-16.

⸻

VERSION SELECTION AFTER REPAIR

32. Accidentul actual este neacceptabil

Nu selecta versiunea câștigătoare doar după media afișată/rotunjită.

Exemplu:

Version A:
mean 8.9,
T04 = 6.5,
quality gate FAIL.

Version B:
mean 8.6,
toate criteriile satisfac pragurile,
quality gate PASS.

Versiunea B este superioară din punctul de vedere al eligibilității pentru release.

⸻

33. Ordinea de selecție

Conceptual:

gate validity first → then quality comparison among gate-valid candidates.

Adică:

1. validity/evidence prerequisites;
2. mandatory gate satisfaction;
3. threshold satisfaction;
4. abia apoi comparative quality score / tie-breaking.

Nu:

highest mean wins even if it fails a mandatory criterion.

⸻

34. O versiune FAIL nu poate înlocui automat o versiune PASS

Aceasta devine consecință obligatorie de implementare pentru Semantic Hardening #2.

Algoritmul exact de ranking între două versiuni PASS poate fi definit separat.

⸻

MULTIPLE MODERATE WEAKNESSES

35. Nu introducem un scor aditiv arbitrar

Patru criterii la 7.0:

→ fiecare satisface minimum-ul.

Nu inventăm:

4 × score 7 = automatic fail.

⸻

36. Dar pattern-ul poate fi relevant

Dacă mai multe slăbiciuni moderate produc împreună un defect material al experienței:

→ poate exista un composite quality finding.

Trebuie justificat semantic și prin evidence.

Nu prin:

* număr fix de criterii;
* sumă arbitrară;
* penalizare dublă.

⸻

37. Media rămâne mecanismul general de compunere

În prezent:

* floor-ul protejează împotriva unei dimensiuni foarte slabe;
* overall mean protejează împotriva degradării generale.

Aceasta este compunerea numerică principală.

Nu adăugăm încă o a treia formulă numerică fără evidence.

⸻

COLLECTION LEVEL

38. Volume-level PASS nu garantează automat lipsa unui pattern de colecție

Dacă toate cele șase volume au aceeași slăbiciune sistemică aproape de minimum:

aceasta poate fi relevantă pentru Collection QA.

⸻

39. Dar D-16 nu inventează un threshold de colecție

Nu introduc:

if 4 volumes have T04=7 → collection FAIL.

Nu există evidence pentru acest număr.

⸻

40. Introducem conceptual systemic-quality finding

La nivel:

Book/Volume → Collection

poate exista:

QUALITY_SYSTEMIC_PATTERN

sau echivalent,

când aceeași slăbiciune se repetă și efectul cumulativ este material.

Severitatea și threshold-urile exacte se calibrează ulterior.

Nu dubla fiecare finding individual.

⸻

41. Page → Book → Volume → Collection

D-16 păstrează:

* Page: evidence poate proveni de la pagini;
* Book/Volume: rubric scoring + gate;
* Collection: detectarea pattern-urilor sistemice.

Nu inventăm note per pagină dacă rubrica nu le are.

⸻

NATIVE / RO

42. D-16 nu inventează retroactiv rubrică T01–T18 pentru ediția nativă

Investigația arată că ediția nativă nu are în prezent aceeași rubrică.

D-16 nu schimbă acest lucru pe ascuns.

Dar această asimetrie trebuie păstrată ca dependency / architecture gap.

Nu pretinde că minimum-ul T01–T18 este deja executat pentru RO dacă acele criterii nu sunt produse acolo.

⸻

43. Nu confundăm aceasta cu D-14

D-14 cere age-fit și fidelity și pe ediția RO unde se aplică.

D-16 decide quality criterion floors pentru rubrica T01–T18.

Sunt straturi diferite.

⸻

REZULTATELE EXACTE D-16

44. v2c-quality-09

T04 = 6.5:

→ FAIL quality gate
→ REPAIR_REQUIRED.

⸻

45. v2h-quality-06

T14 = 6.5:

→ FAIL quality gate
→ REPAIR_REQUIRED.

Nu rerula holdout-ul.

⸻

46. v2c-quality-08 / v2h-quality-05

T13 = 6.5:

→ FAIL
→ REPAIR_REQUIRED.

Neschimbat.

⸻

47. v2c-quality-10

T13 = 7.0:

→ floor PASS.

Dacă restul condițiilor trec:

→ overall PASS.

⸻

48. T04 = 6.99

Dacă 6.99 este o valoare validă conform scoring contract:

→ FAIL.

⸻

49. T04 = 7.0

→ floor PASS.

⸻

50. T04 = 0, restul 9

→ FAIL.

Media nu poate compensa.

Actualul v1 PASS arată exact motivul pentru care WonderPages kids-sc folosește politica D-16.

D-16 nu schimbă retroactiv alte Product Types.

⸻

51. Patru criterii la 7.0, restul 9

→ PASS dacă:

* toate sunt aplicabile;
* mean ≥8;
* critical thresholds trec;
* nu există alt gate failure.

Nu inventa cumulative fail numeric.

⸻

52. T04 = 6.9 și T14 = 6.9

→ două criterii distincte sub minimum;

→ FAIL;

→ fiecare finding păstrat separat.

⸻

53. T07 = 6.9

→ FAIL conform contractului existent.

Dar reason taxonomy și relația sa cu safety sunt D-17.

Nu dubla automat două defecte.

⸻

54. T01 = 6.5 / T08 = 6.9

→ FAIL pe threshold-ul critic specific.

Nu este necesar un al doilea reason principal pentru universal floor.

⸻

55. T07 = 7.5

D-16 nu decide problema D-17.

Păstrează cazul pentru D-17.

⸻

56. Toate = 8

→ PASS.

Equality passes.

⸻

57. Toate 8, T04 = 7.2

Mean matematic ≈ 7.9556:

→ FAIL overall mean.

Display 8.0 nu schimbă verdictul.

⸻

58. 17 × 8.1 + T04 = 6.3

Mean matematic exact = 8.

Condiția mean:

→ PASS.

Dar T04 = 6.3:

→ floor FAIL.

Prin urmare artifact-ul final:

→ FAIL din cauza T04,

NU din cauza mediei.

Actualul QUALITY_MEAN_BELOW_THRESHOLD este bug.

Acesta este un boundary case important pentru Semantic Hardening #2.

⸻

59. Toate 7.95

Dacă aceste valori sunt valide conform scoring contract:

mean = 7.95:

→ FAIL overall.

Display 8.0 nu schimbă verdictul.

Criteriile individuale sunt ≥7.

Reason principal:

QUALITY_MEAN_BELOW_THRESHOLD.

⸻

REASON MODEL

60. Reasons trebuie să reflecte mecanismul real

Conceptual:

* QUALITY_MEAN_BELOW_THRESHOLD
* QUALITY_CRITICAL_BELOW_THRESHOLD
* QUALITY_CRITERION_BELOW_MINIMUM
* QUALITY_APPLICABILITY_INVALID
* QUALITY_EVIDENCE_INVALID
* QUALITY_SYSTEMIC_PATTERN

sau denumiri mai bune echivalente.

Nu genera două motive principale pentru aceeași încălcare numerică.

⸻

RELAȚIA CU D-18

61. Standardul și validitatea evaluării sunt separate

D-16:

what score is acceptable?

D-18:

when is that score/evidence trustworthy enough to use?

Nu rezolva problema unui critic nesigur prin slăbirea standardului D-16.

⸻

62. Dacă evidence-ul notei este invalid

Nu spune:

criterion 6.5 accepted.

Spune:

6.5 assessment not validated / invalidated.

Apoi:

→ re-evaluate.

Această distincție trebuie păstrată în modelul de date.

⸻

STATUSUL POLITICII

63. Ce este acum decis

Pentru kids-sc:

overall ≥ 8

T01 ≥ 8

T08 ≥ 8

applicable criterion floor ≥ 7

cu T07 păstrat pentru analiza D-17.

Equality passes.

No pre-comparison rounding.

No floating-point boundary error.

N/A requires evidence.

No confirmed-quality-defect waiver.

⸻

64. Ce NU pretindem

Nu spune:

universal 7 is empirically proven optimal.

Spune:

universal applicable floor 7 is an operator-approved WonderPages product policy, pending empirical validation/calibration.

Această formulare este obligatorie.

⸻

CE NU DECIDE D-16

D-16 NU decide:

* T07 rubric vs safety gate — D-17;
* evidence validity — D-18;
* schema Gold / measurement — D-19 / D-20;
* validation performance thresholds — D-21;
* author independence — D-22;
* exact scoring granularity;
* empirical optimality of 7;
* taxonomy completă de N/A pentru T01–T18;
* toate regulile de collection-level systemic quality;
* visual rubric V01–V04;
* science criterion / D-17 dacă acesta este implicat acolo;
* native-edition rubric redesign;
* learning.js adaptive threshold policy;
* critic model quality;
* empirical evaluator validity.
```

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea D, rafinată: universal applicable floor + applicability + exact threshold semantics + no quality waiver of a confirmed defect. Pentru `kids-sc`: medie ≥ 8; T01 ≥ 8; T08 ≥ 8; fiecare alt criteriu aplicabil ≥ 7 (T07 → D-17); NOT_APPLICABLE legitim exclus din comparație și din medie. |
| **Statutul politicii** | **universal applicable floor 7 is an operator-approved WonderPages product policy, pending empirical validation/calibration.** Decizia de politică ≠ prag validat empiric. Decizia T13 (cazul 41) era specifică; D-16 rezolvă acum întrebarea universală. |
| **Criteriu / aplicabilitate / evidence de aplicabilitate** | SCORED sau NOT_APPLICABLE. N/A nu e notă (nici 0, nici 10). Implicit: aplicabil. N/A doar cu evidence citabilă (semantica criteriului + contextul artifactului), auditat: id, definiție / versiune, regulă, context, evidence, motiv, actor, proveniență. N/A folosit pentru a ridica media → evaluare invalidă → nu PASS. T09 nu e declarat automat N/A în volumul 1. |
| **Scor canonic / scor afișat** | Decide valoarea canonică, fidelă matematic. Afișarea e doar prezentare; UI-ul arată că valoarea canonică e sub prag; valoarea canonică rămâne în audit. Granularitatea nu e decisă: o valoare nepermisă se respinge la validarea scorului, nu se rotunjește în secret de poartă. |
| **Prag / tip de prag / egalitate / rezultatul comparației** | `score >= threshold`, exact. Egalitatea trece (8.0, 7.0). 6.99 → FAIL (dacă e valid). Fără rotunjire înainte de comparație. Fără virgulă mobilă binară la prag (decimal, întregi scalate, raționale sau echivalent; biblioteca nu e decisă). OBS-GS-19 formalizat: valoare canonică fidelă → comparație → verdict → rotunjire de afișare. |
| **Media canonică / media afișată / pragul mediei** | Media doar peste criteriile aplicabile evaluate valid. 7.9556 afișat 8.0 → FAIL. 17 × 8.1 + 6.3 = exact 8 → **condiția mediei trece**; artifactul pică din cauza T04 = 6.3 < 7, nu din cauza mediei. |
| **Stare critică / minim universal** | T01 / T08 ≥ 8 rămân; pragul mai strict domină. T07: contractul existent, relația cu siguranța → D-17. |
| **Motiv principal / motive legate** | Un singur motiv principal per încălcare numerică (cel mai specific / strict, ex. `QUALITY_CRITICAL_BELOW_THRESHOLD:T01`). „Și sub 7” rămâne metadata. Coduri conceptuale: MEAN_BELOW_THRESHOLD, CRITICAL_BELOW_THRESHOLD, CRITERION_BELOW_MINIMUM, APPLICABILITY_INVALID, EVIDENCE_INVALID, SYSTEMIC_PATTERN (sau echivalente). |
| **Validitatea evidence-ului / confirmarea scorului** | Nota criticului nu e adevăr (OBS-GS-18). Evidence invalid → „6.5 assessment not validated / invalidated” → re-evaluate, nu „accepted”. D-18 decide când e de încredere. |
| **Reparație / reevaluare** | Criteriu aplicabil confirmat < prag → **REPAIR_REQUIRED** → re-evaluate; nu release. După reparație, încă sub prag: (A) realmente sub standard → rămâne REPAIR_REQUIRED; (B) evaluarea e greșită → invalidare prin evidence validation. |
| **Contestare de către operator / waiver** | **OVERRIDE INVALID EVALUATION** (permis cu evidence: re-evaluation, eventual evaluare independentă, rezoluție, audit) ≠ **WAIVE CONFIRMED QUALITY DEFECT** (nepermis). Fără manual PASS, fără „approved despite 6.5”, fără release override care ascunde criteriul. O eventuală procedură excepțională de release neconform = altă politică, explicită, auditată, niciodată numită quality PASS; D-16 nu o creează. Recomandarea furnizorului (REVIEW acceptabil după reparație) **nu a fost adoptată**. |
| **Poarta versiunii / selecția versiunii** | Întâi validitatea și poarta, abia apoi scorul. O versiune care pică nu poate înlocui automat una care trece. Ranking-ul între două versiuni care trec se definește separat. |
| **Slăbiciuni moderate** | Fără regulă aditivă (patru criterii la 7.0 → PASS dacă restul trece). Un finding compus e posibil doar justificat semantic și prin evidence. Minimul + media rămân compunerea numerică. |
| **Volum / colecție** | Book / Volume: rubrică + poartă. Collection: `QUALITY_SYSTEMIC_PATTERN` conceptual, fără prag de colecție inventat, fără dublarea finding-urilor. Fără note per pagină. |
| **Ediția nativă** | Nu i se inventează rubrica T01–T18; asimetria rămâne gap de arhitectură; minimul nu e pretins pentru RO. Distinct de D-14. |
| **Comportamentul evaluatorului la momentul deciziei** (HEAD `b5b8f95`, neschimbat) | v2: minim 7 pe toate criteriile, fără aplicabilitate. Egalitatea trece. Media exactă decide (H1), dar e calculată în virgulă mobilă: 17 × 8.1 + 6.3 → 7.9999999999999964 → `QUALITY_MEAN_BELOW_THRESHOLD` (**bug**, și pe v1). T01 / T07 / T08 sub 7 → două coduri. v1 fără minim. Criticul nativ fără rubrică. `critique_revise` păstrează versiunea cu media rotunjită mai mare chiar dacă pică (citire de cod). Fără cale de acceptare. Fără agregare pe colecție. **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Comparații fidele matematic; egalitatea trece; rotunjirea doar la afișare; NOT_APPLICABLE auditat; un motiv principal; contestare ≠ waiver; REPAIR_REQUIRED + re-evaluate; selecția după poartă; pattern sistemic conceptual; granularitate în contractul de scoring; reprezentarea în Gold după D-19 / D-20. |

### Rezultate explicite

v2c-quality-09 (T04 = 6.5) → FAIL / REPAIR_REQUIRED · v2h-quality-06 (T14 = 6.5) → FAIL / REPAIR_REQUIRED, **fără rerun** ·
T13 = 6.5 → FAIL / REPAIR_REQUIRED · T13 = 7.0 → floor PASS · criteriu = 7.0 → PASS · criteriu = 6.99 → FAIL (dacă e valid) ·
media exact 8 → PASS · 17 × 8.1 + 6.3 → media trece, minimul pică (6.3 < 7) · 7.9556 afișat 8.0 → media pică · criteriu aplicabil
confirmat < 7 → nu poate fi transformat în PASS prin waiver · scor invalid → contestat / invalidat / reevaluat (nu e waiver) · N/A →
doar cu evidence, exclus din numitor · selecția versiunii → candidatul care trece poarta înaintea celui care pică, indiferent de medie.

### Afectate (fără nicio modificare acum)

- **Gold-v2:** v2c-quality-09 → negativ la adjudecare; v2c-quality-08 / -10 neschimbate; v2c-quality-15 → D-17.
- **Setul rezervat (înghețat, nu se rulează din nou):** v2h-quality-06 → FAIL / REPAIR_REQUIRED; v2h-quality-05 neschimbat.
- **Gold-v1:** neschimbat (cazul 41).

### Nu decide

D-17 · D-18 · D-19 / D-20 · D-21 · D-22 · granularitatea scorurilor · optimalitatea empirică a lui 7 · taxonomia N/A · regulile
sistemice de colecție · rubrica vizuală V01–V04 · criteriul științific (D-17, dacă e implicat) · rubrica ediției native · pragurile
adaptive din `learning.js` · calitatea criticului · validitatea empirică.

### Dependențe deschise

- **D-16-DEP-SCORING-GRANULARITY** · **D-16-DEP-NA-TAXONOMY** · **D-16-DEP-COLLECTION-SYSTEMIC-QUALITY** ·
  **D-16-DEP-EMPIRICAL-FLOOR-VALIDATION** (D-19 / D-20 / D-21) · **D-16-DEP-NATIVE-EDITION-RUBRIC** · **D-16-DEP-PASS-VERSION-RANKING** ·
  **D-16-DEP-T07** → D-17 · **D-16-DEP-EVIDENCE-VALIDITY** → D-18.

## D-17 — T07 în rubrică vs porțile de siguranță, content-policy și age-fit

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-17 — DECIZIA OPERATORULUI

Aleg Opțiunea D, rafinată: separation of jurisdiction + linked evidence + no double adjudication.

Principiile centrale sunt:

T07 QUALITY SCORE ≠ SAFETY GATE.

T07 QUALITY SCORE ≠ CONTENT-POLICY GATE.

T07 QUALITY SCORE ≠ AGE-FIT GATE.

ONE UNDERLYING DEFECT MUST HAVE ONE AUTHORITATIVE JURISDICTION.

THE SAME DEFECT MAY BE OBSERVED BY MULTIPLE SYSTEMS, BUT IT MUST NOT BE ADJUDICATED OR BLOCK RELEASE TWICE.

A RESOLVED HASH-BOUND GATE FINDING CANNOT BE REOPENED INDIRECTLY THROUGH T07 USING THE SAME EVIDENCE.

NEW MATERIAL EVIDENCE MAY CREATE A NEW CANDIDATE FINDING; IT DOES NOT SILENTLY OVERRIDE THE PREVIOUS DECISION.

DEPICTION OF UNDESIRABLE BEHAVIOUR ≠ NARRATIVE ENDORSEMENT OF THAT BEHAVIOUR.

Nu implementa acum.

⸻

1. Jurisdicțiile rămân separate

Pentru WonderPages:

* physical / imitation safety → safety gate;
* content / child-safety policy → content-policy gate;
* developmental / emotional suitability → age-fit;
* science truth → science layer stabilit prin D-15;
* editorial values / moral modelling → T07 quality dimension, în măsura în care nu este deja responsabilitatea uneia dintre axele de mai sus.

T07 nu devine o a doua autoritate pentru primele patru.

⸻

2. Nu schimbăm acum textul rubricii

Contractul actual spune:

T07 — Safety and values: nothing frightening beyond the age, no stereotypes, positive values

și îl marchează critical: true.

D-17 NU rescrie acum Product Contract și NU redenumește T07.

Dar stabilește interpretarea arhitecturală obligatorie pentru Semantic Hardening #2:

elementele din T07 care aparțin unor jurisdicții specializate trebuie delegate / linked, nu readjudecate independent prin scor.

Prin urmare:

* frightening beyond the age → D-11 / age-fit;
* stereotypes → D-08 / D-09 content-policy;
* physical hazards → safety;
* science → D-15;
* editorial values / behavioural modelling care nu intră în aceste axe → T07.

⸻

3. T07 rămâne criteriu critic

Păstrăm metadata existentă:

T07 critical = true.

Dar:

critical ≠ automatically threshold 8.

Nu există evidence suficientă și nici decizie anterioară care să justifice deducția:

T07 critical → T07 >= 8.

T01 și T08 au pragul 8 prin politica specifică deja decisă.

Nu extindem acel prag la T07 prin analogie.

⸻

4. Pragul T07

Pentru actualul kids-sc:

T07 >= 7.

Se aplică semantica D-16:

* 7.0 → threshold PASS;
* 6.99 → FAIL, dacă 6.99 este o valoare validă conform scoring contract;
* fără pre-rounding;
* fără floating-point boundary error;
* fără quality waiver pentru un scor valid și confirmat sub prag.

⸻

5. De ce nu aleg 8

Nu vreau ca simplul label critical să creeze o politică numerică nouă fără evidence.

Mai important, T07 are în prezent o semantică amestecată.

Ridicarea lui la 8 înainte de separarea jurisdicțiilor ar transforma o notă de critic într-o a doua poartă mai strictă pentru:

* safety;
* stereotypes;
* fear / age-fit;
* values.

Aceasta ar amplifica exact defectul arhitectural pe care D-17 trebuie să-l elimine.

Prin urmare:

T07 >= 7 is operator-approved policy.

Nu:

T07 >= 7 because safety gate makes T07 unimportant.

Și nu:

T07 >= 8 because T07 is marked critical.

⸻

6. v2c-quality-15 / P-Q07

T07 = 7.5.

Condiția T07:

→ PASS.

Dacă:

* overall mean trece;
* toate celelalte criterii trec;
* safety/content-policy/age-fit gates trec;
* evidence-ul este valid;

atunci:

→ QUALITY PASS.

Prin urmare:

v2c-quality-15 = PASS pentru politica D-17.

P-Q07 = PASS pentru politica D-17.

Dovada:

Bo holds on tight.

nu demonstrează singură un defect de values care să justifice T07 <7.

O eventuală problemă fizică de siguranță aparține safety gate.

⸻

7. T07 = 7.0

→ threshold PASS.

⸻

8. T07 = 6.99

→ threshold FAIL.

Un singur reason principal:

QUALITY_CRITICAL_BELOW_THRESHOLD:T07

sau echivalent mai bun.

Nu genera simultan:

QUALITY_CRITERION_BELOW_MINIMUM:T07

ca al doilea defect independent.

Metadata poate consemna că valoarea este și sub universal floor.

⸻

9. T07 = 0

→ QUALITY FAIL.

Nu poate fi compensat de media mare.

D-16 se aplică.

⸻

10. T07 = 7.5 NU înseamnă „safety PASS”

Un artifact poate avea:

T07 = 9

și:

safety = BLOCK.

Exemplul:

Tom plays with matches in his room.

Dacă safety gate confirmă hazardul:

→ safety BLOCK;

→ release FAIL,

indiferent de T07.

Aceasta este arhitectură corectă.

⸻

11. Inversul este de asemenea posibil

Un artifact poate avea:

safety = PASS

dar:

T07 < 7

dintr-o problemă editorială reală de values / moral modelling care nu aparține safety/content-policy/age-fit.

Atunci:

→ quality FAIL;

→ REPAIR_REQUIRED conform D-16.

Safety PASS nu transformă automat values quality în PASS.

⸻

12. Exemplul cu minciuna și furtul

Text:

Milo lied to his friend and took her cake, and he was proud of it.

Faptul că safety gate spune PASS nu demonstrează că T07 trebuie să spună PASS.

Acesta este exact tipul de caz pe care T07 îl poate examina editorial.

Dar D-17 NU decide automat:

bad behaviour depicted = T07 fail.

Trebuie separat:

behaviour depicted → speaker/actor → narrative stance → consequence → correction/repair → final takeaway → endorsement vs challenge → editorial values finding.

Prin urmare:

depiction ≠ endorsement.

Un personaj poate:

* minți;
* fura;
* fi egoist;
* greși;

într-o poveste perfect legitimă.

Problema editorială apare dacă produsul endorses / glorifies / normalizes comportamentul într-un mod incompatibil cu standardul său editorial.

Taxonomia completă rămâne dependency.

⸻

AUTHORITATIVE JURISDICTION

13. Un defect are o jurisdicție principală

Exemplu:

stereotip susținut.

Autoritatea pentru adevărul policy:

→ content-policy gate D-08/D-09.

Nu:

→ content-policy BLOCK
și separat
→ T07 quality failure pentru același stereotip.

⸻

14. Criticul poate observa problema

Dacă criticul observă un posibil stereotip:

nu trebuie să îl transforme într-o a doua adjudecare T07.

Trebuie să emită / refere:

candidate content-policy finding

cu:

* evidence;
* content hash;
* source location;
* relation;
* provenance.

Finding-ul merge în jurisdicția content-policy.

⸻

15. Același lucru pentru safety

Dacă criticul observă un hazard fizic pe care safety evaluator-ul nu l-a găsit:

nu spune pur și simplu:

T07 = 5.

Trebuie să producă:

candidate safety finding.

Safety layer îl adjudecă.

⸻

16. Același lucru pentru age-fit

Dacă problema este:

too frightening for age 3–4

→ age-fit D-11.

Nu folosi T07 ca a doua poartă pentru același fapt.

⸻

17. Science nu intră în T07

D-15 rămâne autoritatea.

Un mit științific nu trebuie ascuns într-o notă T07.

⸻

SAME DEFECT / DOUBLE COUNTING

18. Same underlying defect = linked findings

Dacă două sisteme observă aceeași problemă:

nu șterge una dintre observații.

Păstrează provenance-ul ambelor.

Dar leagă-le prin:

* underlying issue id;
* related finding IDs;
* authoritative jurisdiction;
* content hash;
* evidence relation.

⸻

19. O singură consecință autoritativă

Exemplu:

Critic detects stereotype
→ candidate policy finding.

Content-policy evaluates it
→ BLOCK.

Release este blocat de:

content-policy BLOCK.

Nu mai adăuga separat:

quality fail because same stereotype lowered T07.

⸻

20. Nu înseamnă că scorul T07 trebuie falsificat

Nu ridica artificial:

T07 6.5 → 7

doar ca să elimini dubla penalizare.

În schimb, scorul T07 trebuie să fie justificat prin evidence care aparține jurisdicției T07.

Dacă singurul motiv pentru 6.5 este un stereotip deja delegat content-policy:

→ scorul T07 este mis-scoped / unsupported for independent quality consequence;

→ trebuie reevaluat.

Aceasta NU este quality waiver.

Este corectarea jurisdicției/evidence-ului.

D-18 va formaliza validitatea evidence-ului.

⸻

OPERATOR CLOSURE

21. Hash-bound closure are autoritate în jurisdicția sa

Dacă un:

REVIEW

a fost adjudecat de operator pentru un anumit:

* finding;
* artifact/content hash;
* evidence;
* policy version;

criticul nu îl poate redeschide indirect prin:

T07 < 7

folosind aceeași problemă și aceeași evidence.

⸻

22. Exemplu D-08

Stereotip autentic contestat:

D-08 → REVIEW.

Operatorul adjudecă acel REVIEW pentru hash-ul respectiv.

Criticul nu poate spune apoi:

same stereotype → T07=6.5 → quality FAIL

și astfel să anuleze pe ocolite decizia operatorului.

⸻

23. Evidence nouă poate redeschide problema

Closure-ul nu înseamnă:

never inspect again.

Dacă apare:

* evidence nouă;
* altă pagină;
* contradicție vizuală;
* repetare ulterioară;
* final de carte care schimbă stance-ul;
* artifact hash nou;

poate apărea un nou candidate finding.

Acesta trebuie adjudecat explicit în jurisdicția corectă.

Nu prin scăderea ascunsă a T07.

⸻

24. Same hash + same evidence + same policy issue

→ nu redeschide.

⸻

25. Changed hash / materially new evidence

→ poate necesita reevaluare.

⸻

CRITIC SCORE

26. T07 trebuie să aibă evidence decomposition

În viitoarea implementare, un T07 nu trebuie să fie doar:

score: 6.5.

Trebuie să poată arăta de ce.

Conceptual:

* values/editorial evidence;
* delegated safety candidate;
* delegated content-policy candidate;
* delegated age-fit candidate;
* related findings;
* independent T07 rationale.

⸻

27. Numai rationale-ul aflat în jurisdicția T07 poate susține independent quality failure

Aceasta este regula care previne dublarea.

⸻

28. CriticNotes

Safety/content-policy/age-fit findings pot fi furnizate criticului ca context.

Dar scopul lor este:

* awareness;
* consistency;
* editorial understanding.

Nu:

convert gate finding into second quality penalty.

⸻

29. Criticul descoperă ceva nou

Atunci produce:

candidate finding → authoritative layer.

Nu:

hidden escalation through T07.

Aceasta extinde principiul de trasabilitate D-14.

⸻

VALUES

30. Values rămâne responsabilitate reală

Nu aleg Opțiunea B.

Safety gate nu acoperă tot ce înseamnă calitate editorială și model comportamental.

Prin urmare T07 nu devine pur informativ.

⸻

31. Values este quality, nu physical safety

În lipsa unei politici separate viitoare:

editorial values / behavioural modelling rămâne sub T07.

Un finding confirmat care justifică T07 <7:

→ quality FAIL;

→ REPAIR_REQUIRED;

→ no waiver conform D-16.

⸻

32. Nu creăm acum VALUES BLOCK gate

D-17 nu inventează:

VALUES_BLOCK.

Nu transformă fiecare judecată morală într-o regulă deterministă.

Rămâne editorial quality cu evidence.

⸻

33. Taxonomia completă se amână

Va trebui ulterior să distingem cel puțin conceptual:

* depiction;
* endorsement;
* glorification;
* consequence;
* correction;
* repair;
* empathy;
* coercion;
* dishonesty;
* cruelty;
* prosocial resolution;
* narrative stance;
* final takeaway.

Dar D-17 nu fixează taxonomia completă sau praguri pe bandă.

⸻

TEXT / VISUAL / CROSS-MODAL

34. T07 actual nu trebuie pretins ca multimodal

Investigația arată:

T07 critic vede textul.

Prin urmare nu pretinde:

T07 evaluates text + image

cât timp runtime-ul nu face asta.

⸻

35. Safety vizual

Visual safety rămâne în QA vizual / safety jurisdiction.

Dacă imaginea arată un hazard pe care textul nu îl arată:

→ visual safety finding.

Nu:

→ hidden T07 penalty.

⸻

36. Content-policy vizual

Dacă o imagine:

* întărește un stereotip;
* contrazice contestarea din text;
* introduce o problemă content-policy;

→ candidate content-policy / cross-modal finding.

Autoritatea rămâne content-policy.

⸻

37. Age-fit vizual

Frightening imagery / developmental visual intensity:

→ visual/age-fit layer conform politicilor relevante.

Nu T07 ca a doua autoritate.

⸻

38. Values exclusiv vizuale

Dacă o problemă editorială de values apare numai în imagine și nu aparține safety/content-policy:

aceasta este momentan un coverage gap / future visual-editorial dependency.

Nu pretinde că actualul T07 text-only a evaluat-o.

⸻

39. Cross-modal contradiction

Textul poate spune:

Mia helps everyone.

iar imaginea poate sugera contrariul.

Dacă relația produce:

* safety issue → safety;
* policy issue → content-policy;
* age-fit issue → age-fit;
* pur editorial values issue → future cross-modal editorial finding.

Nu rezolva printr-un T07 text-only inventat.

⸻

NATIVE EDITION

40. Nu pretindem că T07 acoperă independent RO

Dacă rubrica actuală T07 nu rulează pe ediția nativă, D-17 nu pretinde că o face.

D-14 fidelity și celelalte porți aplicabile ediției native rămân active.

Editorial-values parity pentru ediția nativă rămâne dependency dacă localizarea poate schimba stance-ul moral fără să fie captată suficient de fidelity.

⸻

PAGE → BOOK → VOLUME → COLLECTION

41. Findings locale rămân locale

Safety/content-policy/age-fit:

→ păstrează page-level evidence.

T07:

→ quality evaluation la nivelul său contractual actual.

Nu șterge finding-ul local doar pentru că volumul are un scor bun.

⸻

42. Book/Volume

T07 poate evalua stance-ul editorial al manuscrisului la nivel de carte/volum.

Un comportament negativ pe o pagină poate fi rezolvat ulterior.

Prin urmare:

local undesirable act ≠ automatically poor T07.

Final takeaway contează.

⸻

43. Collection

Dacă aceeași problemă editorială se repetă sistemic în volume:

→ poate exista collection-level systemic quality finding conform principiului D-16.

Nu inventa acum prag numeric.

⸻

44. Nu dubla între niveluri

Page finding + volume finding + collection pattern:

pot coexista ca evidence/provenance,

dar nu trebuie transformate automat în trei penalizări pentru același defect.

⸻

RELEASE

45. Release verifică toate jurisdicțiile relevante

Conceptual release eligibility este conjuncția:

quality eligible
AND
safety eligible
AND
content-policy eligible
AND
age-fit eligible
AND
science/fidelity/etc. eligible where applicable.

Nu este:

T07 decides everything.

⸻

46. Raportarea trebuie să arate toate porțile care pică

Actualul comportament „prima eroare oprește raportarea” este insuficient pentru Enterprise diagnostics.

Dacă un volum are simultan:

* quality FAIL;
* safety BLOCK;
* fidelity REPAIR_REQUIRED;

raportul trebuie să poată expune toate stările relevante.

Release rămâne FAIL.

Aceasta este consecință de implementare pentru Hardening #2, nu schimbare runtime acum.

⸻

47. Un singur defect nu trebuie raportat de trei ori ca trei cauze independente

Raportarea trebuie să distingă:

multiple independent failures

de:

multiple observations of the same underlying issue.

⸻

BOUNDARY RESULTS

48. T07 = 8.0

→ PASS T07.

⸻

49. T07 = 7.99

→ PASS T07.

Nu există threshold 8 pentru T07.

⸻

50. T07 = 7.5

→ PASS T07.

v2c-quality-15 / P-Q07 rămân quality PASS dacă restul condițiilor trec.

⸻

51. T07 = 7.0

→ PASS T07.

Equality passes.

⸻

52. T07 = 6.99

→ FAIL T07.

Un singur primary reason.

⸻

53. T07 = 0

→ FAIL T07.

Media nu compensează.

⸻

54. T01 = 7.5

Rămâne:

→ FAIL,

deoarece T01 are threshold specific 8.

Aceasta nu justifică threshold 8 pentru T07.

⸻

EXEMPLE DE DEZACORD ÎNTRE PORȚI

55. T07 PASS + safety BLOCK

Perfect posibil.

Verdict final:

→ release FAIL prin safety.

Nu modifica T07 artificial.

⸻

56. T07 FAIL pe values + safety PASS

Perfect posibil.

Verdict final:

→ release FAIL prin quality.

⸻

57. T07 FAIL numai pentru același safety finding deja adjudecat

Nu accept.

Scorul trebuie re-evaluat / evidence-ul separat.

Nu este quality waiver.

Este jurisdiction/evidence correction.

⸻

58. Safety REVIEW închis de operator + aceeași evidence în T07

Closure-ul rămâne autoritativ pentru acea problemă și hash.

T07 nu o redeschide.

⸻

59. Safety REVIEW închis + evidence nouă materială

→ new candidate safety finding;

→ safety reevaluation.

Nu hidden T07 escalation.

⸻

RELAȚIA CU D-01…D-16

60. D-01–D-07

Hazardurile fizice și armele:

→ safety jurisdiction.

T07 nu le adjudecă independent.

⸻

61. D-08–D-10

Stereotipuri / discriminare / insultă și politicile aferente:

→ content-policy jurisdiction conform deciziilor respective.

T07 nu le transformă într-o a doua poartă.

⸻

62. D-11

Fear/developmental emotional fit:

→ age-fit.

T07 phrase nothing frightening beyond the age este delegată acestei jurisdicții.

⸻

63. D-12–D-14

Age-fit semantic + finding → severity → consequence:

→ rămâne autoritativ.

T07 nu îl suprascrie.

⸻

64. D-15

Science truth:

→ science layer.

Nu T07.

⸻

65. D-16

Se aplică T07:

* canonical scores;
* equality;
* minimum;
* no floating-point boundary errors;
* no confirmed-quality-defect waiver;
* invalid score may be challenged;
* gate-valid candidate outranks gate-failing candidate.

D-17 adaugă:

a T07 score is valid for independent quality consequence only to the extent its rationale belongs to T07’s authoritative quality jurisdiction rather than duplicating another gate.

⸻

D-18

66. D-17 nu rezolvă validitatea evidence-ului

D-17 decide:

where a finding belongs.

D-18 va decide:

whether the evidence supporting a score/finding is valid enough.

Exemplu:

Bo holds on tight.

D-17 spune că aceasta nu poate fi transformată automat într-o a doua safety adjudication prin T07.

D-18 va analiza dacă este evidence validă pentru nota atribuită.

⸻

STATUSUL T07 DUPĂ D-17

67. Contractul logic

T07:

* rămâne rubric criterion;
* rămâne marcat critical;
* threshold actual = 7;
* nu este safety gate;
* nu este content-policy gate;
* nu este age-fit gate;
* nu este science gate;
* păstrează independent editorial-values responsibility;
* trebuie să aibă evidence trasabilă;
* trebuie să delege candidate findings jurisdicțiilor specializate;
* nu poate dubla aceeași problemă;
* nu poate anula pe ocolite o adjudecare hash-bound.

⸻

68. Formulare obligatorie

Înregistrează explicit:

T07 remains a critical quality criterion with an operator-approved threshold of 7 for kids-sc. Its critical designation does not imply a threshold of 8. Safety, content-policy, age-fit and science truth are adjudicated by their authoritative layers; T07 may observe and refer candidate findings in those domains but may not independently re-adjudicate or double-penalize the same underlying defect.

Și:

A T07 score below threshold may independently fail quality only when its supporting rationale belongs to T07’s quality jurisdiction and is valid; a score reduction caused solely by a finding delegated to another authoritative gate is not an independent quality failure and requires score/evidence re-evaluation, not a waiver.

⸻

CE NU DECIDE D-17

D-17 NU decide:

* taxonomia completă a editorial values;
* praguri de values pe bandă;
* redenumirea T07;
* împărțirea T07 în criterii noi;
* schimbarea Product Contract acum;
* un nou VALUES gate;
* validitatea evidence-ului — D-18;
* Gold representation / metrics — D-19 / D-20;
* validation thresholds — D-21;
* author independence — D-22;
* science criterion în rubrică;
* native-edition rubric redesign;
* visual rubric V01–V04;
* full cross-modal editorial-values evaluator;
* implementation of D-08;
* critic model quality;
* empirical validity.
```

### Formulări obligatorii (înregistrate ca atare)

> T07 remains a critical quality criterion with an operator-approved threshold of 7 for kids-sc. Its critical designation does not
> imply a threshold of 8. Safety, content-policy, age-fit and science truth are adjudicated by their authoritative layers; T07 may
> observe and refer candidate findings in those domains but may not independently re-adjudicate or double-penalize the same
> underlying defect.

> A T07 score below threshold may independently fail quality only when its supporting rationale belongs to T07’s quality jurisdiction
> and is valid; a score reduction caused solely by a finding delegated to another authoritative gate is not an independent quality
> failure and requires score/evidence re-evaluation, not a waiver.

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea D, rafinată: separarea jurisdicțiilor + evidence legat + fără dublă adjudecare. |
| **Versiunea criteriului / critical / prag / proveniență** | Rubrica `kids-sc` curentă, text nemodificat (Product Contract neschimbat). `critical: true` păstrat; critical ≠ prag 8. **Prag 7**, decis de operator în D-17, cu semantica D-16 (egalitate, valoare canonică, fără waiver). Nu „pentru că există poarta de siguranță”, nu „8 pentru că e critical”. |
| **Scor / scor canonic / evidence / domeniul evidence-ului** | T07 cu evidence descompus: valori / editorial (T07) vs. safety, content-policy, age-fit, știință (delegate). Doar rationale-ul independent T07 poate susține un eșec de calitate. |
| **Jurisdicția autoritativă** | Siguranță fizică / imitație → safety gate. Content / child-safety policy → content-policy gate. Potrivire developmentală / emoțională → age-fit. Știință → D-15. Valori editoriale / model moral neacoperit de acestea → T07. |
| **Candidate findings delegate / related IDs / underlying issue ID / content hash** | Criticul care observă un hazard, un stereotip sau o problemă de vârstă emite un candidat (evidence, hash, locație, relație, proveniență) către jurisdicția potrivită. Observațiile aceluiași defect se păstrează și se leagă; **o singură consecință autoritativă**. |
| **Închiderea operatorului / hash / versiunea politicii / evidence nouă** | Un REVIEW închis de operator (finding, hash, evidence, versiune) e autoritativ: același hash + aceeași evidence + aceeași problemă → nu se redeschide prin T07. Evidence nouă materială sau hash nou → nou candidat, adjudecat explicit în jurisdicția corectă. |
| **Consecințe pe jurisdicții** | Calitate: T07 < 7 cu rationale valid T07 → FAIL → REPAIR_REQUIRED, fără waiver. Siguranță / content-policy / age-fit / știință: decise de porțile lor, independent de T07. |
| **Dublă numărare / reevaluarea scorului** | T07 redus doar de un finding delegat → mis-scoped → reevaluare (corectare de jurisdicție, nu waiver, nu ridicare artificială). |
| **Valori** | Responsabilitate reală (B respinsă). Fără VALUES_BLOCK. Depiction ≠ endorsement: comportament → actor → stance → consecință → corectare / reparare → takeaway → endorsement vs contestare. Taxonomia se amână. |
| **Release** | Conjuncția tuturor jurisdicțiilor relevante. Raportarea arată toate porțile care pică și distinge eșecuri independente de observații ale aceluiași defect (consecință pentru Hardening #2). |
| **Niveluri** | Siguranță / policy / age-fit pe pagină. T07 pe carte / volum (takeaway-ul final contează). Pattern sistemic pe colecție fără prag. Fără triplă penalizare. |
| **Text / vizual / cross-modal / ediția nativă** | T07 e text-only și nu se pretinde altfel. Vizualul se rutează după jurisdicție. Valorile exclusiv vizuale = gol de acoperire. T07 nu acoperă RO; paritatea valorilor = dependență. |
| **Comportamentul runtime la momentul deciziei** (HEAD `5a33668`, neschimbat) | v2: prag 8 doar T01 / T08; T07 la 7. T07 = 6.99 → două coduri. v2c-quality-15 → PASS; siguranța PASS pe același text. Poarta de siguranță per pagină; REVIEW închis de operator legat de hash. `criticNotes` fără finding-uri de siguranță. Fără legătură BLOCK ↔ T07. Închiderea operatorului poate fi anulată indirect prin T07. Valorile („Milo lied…”) nu au nicio poartă. Stereotipul contestat → BLOCK (D-08 neimplementat). Release-ul raportează doar prima poartă care pică. **Comportamentul nu e politica.** |
| **Consecințe pentru Hardening #2** (neautorizat încă) | Delegarea elementelor T07; evidence descompus; candidați rutați; observații legate; o consecință autoritativă; respectarea închiderilor hash-bound; un motiv principal; release ca conjuncție cu raportare completă; taxonomia valorilor ulterior. |

### Rezultate explicite

v2c-quality-15 / P-Q07 (T07 = 7.5) → T07 PASS · T07 = 8.0 / 7.99 / 7.5 / 7.0 → PASS · T07 = 6.99 → FAIL (un singur motiv) · T07 = 0 → FAIL ·
T07 PASS + safety BLOCK → release FAIL prin siguranță · T07 FAIL pe un defect de valori confirmat + safety PASS → release FAIL prin
calitate · același defect văzut de critic și de poarta autoritativă → observații legate, o adjudecare, fără dublă penalizare · REVIEW
închis (hash-bound) + aceeași evidence → T07 nu îl redeschide · evidence nouă materială → nou candidat în jurisdicția autoritativă ·
depiction ≠ endorsement · știința nu aparține T07.

### Afectate (fără nicio modificare acum)

- **Gold-v2:** v2c-quality-15 → PASS pentru politica D-17 (eticheta se dă la adjudecare).
- **Probe:** P-Q07 → PASS; registrul nu se schimbă acum.
- **Setul rezervat:** niciun caz T07; înghețat.
- **Gold-v1:** neschimbat.

### Nu decide

Taxonomia valorilor · praguri de valori pe bandă · redenumirea / împărțirea T07 · Product Contract · VALUES gate · D-18 · D-19 / D-20 ·
D-21 · D-22 · criteriul științific în rubrică · rubrica ediției native · rubrica vizuală V01–V04 · evaluator cross-modal de valori ·
implementarea D-08 · calitatea criticului · validitatea empirică.

### Dependențe deschise

- **D-17-DEP-VALUES-TAXONOMY** · **D-17-DEP-RUBRIC-T07-WORDING** · **D-17-DEP-VISUAL-EDITORIAL-VALUES** · **D-17-DEP-NATIVE-VALUES-PARITY** ·
  **D-17-DEP-EVIDENCE-VALIDITY** → D-18 · **D-17-DEP-MEASUREMENT** → D-19 / D-20.

## D-18 — Validitatea dovezilor criticului (Assessment Validation, politica v3)

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-18 — DECIZIA OPERATORULUI

Aleg Opțiunea D, rafinată: Assessment Validation Layer separat, obligatoriu și simetric.

Principiile centrale sunt:

EVIDENCE EXISTS ≠ EVIDENCE IS VALID.

EVIDENCE IS PRESENT IN THE ARTIFACT ≠ EVIDENCE SUPPORTS THE CLAIM.

EVIDENCE SUPPORTS A CLAIM ≠ EVIDENCE JUSTIFIES THE ASSIGNED SCORE.

CRITIC SCORE ≠ INDEPENDENTLY VERIFIED CONTENT PROPERTY.

INVALID ASSESSMENT ≠ BAD ARTIFACT.

UNVERIFIED ASSESSMENT ≠ QUALITY PASS.

UNVERIFIED ASSESSMENT ≠ QUALITY FAIL.

RE-EVALUATING AN INVALID ASSESSMENT ≠ WAIVING A CONFIRMED QUALITY DEFECT.

QUOTE REUSE ≠ AUTOMATIC INVALIDITY.

SHORT EVIDENCE ≠ AUTOMATIC INSUFFICIENCY.

VALIDATION MUST FOLLOW THE EXACT ARTIFACT, EDITION, LAYER, LOCATION, CRITERION AND HASH THAT WERE ACTUALLY ASSESSED.

Nu implementa acum.

⸻

1. Cele patru straturi OBS-GS-18 devin contractuale

Păstrăm explicit separarea:

A. Critic Assessment

Criticul produce:

* criterion;
* score;
* rationale / claim;
* evidence;
* issues;
* assessment provenance.

B. Assessment Validation

Un strat separat verifică dacă assessment-ul este suficient de valid pentru a fi folosit.

C. Acceptance Gate

Doar un assessment validat poate produce o consecință finală de quality PASS / FAIL conform D-16 și D-17.

D. Underlying Content Quality

Calitatea reală a artifactului nu este identică nici cu scorul criticului, nici cu starea validatorului.

Aceste patru straturi NU trebuie colapsate.

⸻

2. Politica nouă este v3

D-18 nu rescrie retrospectiv politica v2.

v2c-quality-02 rămâne:

→ pozitiv conform politicii v2 istorice.

Gold-v1, Gold-v2 și held-out rămân înghețate.

Politica D-18 trebuie versionată ca:

quality assessment evidence policy v3

sau echivalentul canonical ales de arhitectură.

Rapoartele v3 vor trebui regenerate ulterior conform procedurii stabilite după închiderea deciziilor.

Nu modifica acum seturile.

⸻

3. Stările Assessment Validation

La nivelul fiecărui criteriu trebuie să existe cel puțin conceptual:

* VALIDATED
* UNVERIFIED
* INVALID

WEAK poate exista ca diagnostic / evidence-quality attribute, dar NU trebuie să fie o stare ambiguă de acceptance.

Un assessment agregat poate fi VALIDATED numai dacă toate assessment-urile necesare pentru decizia lui sunt validate conform contractului aplicabil.

⸻

4. VALIDATED

VALIDATED înseamnă că evidence-ul:

* aparține artifactului corect;
* aparține versiunii/hash-ului corect;
* aparține ediției evaluate;
* aparține layer-ului permis;
* este localizat corect;
* există realmente;
* este atribuit criteriului corect;
* susține semantic claim-ul;
* nu contrazice claim-ul;
* este suficient pentru direcția și severitatea/scorul assessment-ului;
* se află în jurisdicția corectă conform D-17;
* nu depinde de o afirmație falsă despre artifact;
* are provenance verificabil.

⸻

5. UNVERIFIED

UNVERIFIED înseamnă:

nu avem încă evidence suficientă pentru a spune că assessment-ul este valid sau invalid.

Important:

UNVERIFIED NU este sinonim cu PASS.

Și:

UNVERIFIED NU este sinonim cu FAIL.

În politica v3:

→ un assessment UNVERIFIED nu poate produce QUALITY PASS final;

→ nu poate produce QUALITY FAIL final;

→ nu poate declanșa REPAIR_REQUIRED asupra artifactului.

Produce:

ASSESSMENT_VALIDATION_REQUIRED

sau stare semantic echivalentă.

⸻

6. INVALID

INVALID înseamnă că assessment-ul nu poate fi folosit ca bază pentru verdictul de calitate.

Exemple:

* evidence fabricată;
* evidence din ediția greșită;
* evidence din layer-ul greșit;
* locație falsă;
* evidence irelevantă;
* evidence care contrazice claim-ul;
* claim fals despre text;
* rationale din jurisdicția greșită;
* evidence insuficientă pentru verdictul/scorul atribuit;
* assessment legat de artifact/hash greșit.

Consecința:

→ assessment invalidated;

→ reevaluare.

Nu:

→ artifact quality FAIL.

⸻

7. Un assessment invalid nu este un defect al cărții

Aceasta trebuie înregistrată explicit:

ASSESSMENT_INVALID ≠ ARTIFACT_QUALITY_FAIL.

Dacă criticul inventează un citat, defectul este în evaluare.

Nu avem voie să deducem:

critic fabricated evidence → book is bad.

⸻

8. Simetric pentru PASS și FAIL

Aceeași validare se aplică unui assessment care ar produce PASS și unuia care ar produce FAIL.

Nu accept:

high score needs weak validation, low score triggers repair immediately.

Și nici invers.

Dacă:

T13 = 6.5

dar assessment-ul nu este validat,

nu porni REPAIR_REQUIRED conform D-16.

Mai întâi:

→ assessment validation / reevaluation.

Numai un T13 = 6.5 validat poate produce consecința D-16.

⸻

9. Relația exactă cu D-16

D-16 rămâne neschimbată pentru scorurile valide.

Exemplu:

T13 = 6.5 + assessment VALIDATED

→ quality FAIL
→ REPAIR_REQUIRED.

Dar:

T13 = 6.5 + assessment INVALID

→ assessment reevaluation.

Nu este waiver.

⸻

10. Contestarea assessment-ului

Păstrăm principiul:

OVERRIDE INVALID EVALUATION ≠ WAIVE CONFIRMED DEFECT.

Operatorul sau validatorul poate contesta:

* scorul;
* evidence-ul;
* atribuirea;
* jurisdicția;
* localizarea;
* validitatea assessment-ului.

Aceasta nu este derogare de la politica de calitate.

⸻

DETERMINISTIC VALIDATION

11. Verificările deterministe sunt obligatorii

Pentru v3 trebuie verificat determinist, unde este posibil:

* artifact identity;
* artifact hash/version;
* edition;
* layer/source;
* criterion ID;
* quoted text presence;
* declared location;
* page/location mapping;
* issue evidence;
* stale assessment;
* evidence provenance.

⸻

12. Elipsele legitime

E9 nu trebuie clasificat automat drept evidence fabricată.

Un citat prescurtat precum:

Bo has a little … boat

poate fi valid dacă:

* segmentele apar în ordinea corectă;
* apar în contextul permis;
* elipsa nu schimbă sensul;
* nu combină arbitrar pasaje fără legătură.

Prin urmare:

ELLIPSIS ≠ FABRICATION.

Dar elipsa trebuie validată structural.

⸻

13. Comentariu fără citat

E7:

Good rhythm throughout.

nu este „citat inventat”.

Este:

→ rationale/commentary fără evidence citabilă suficientă.

Folosește un reason semantic precum:

EVIDENCE_NOT_CITABLE

sau echivalent.

Nu EVIDENCE_FABRICATED.

⸻

14. Locația trebuie verificată

E10:

Page 1: Bo hugs Mum...

când textul este pe pagina 12:

→ evidence location INVALID.

Faptul că string-ul apare undeva în artifact nu validează locația declarată.

⸻

15. Hash binding

Assessment-ul trebuie legat de artifact hash.

Dar nu este suficient ca numai assessment-ul agregat să cunoască hash-ul.

Evidence provenance trebuie să poată fi urmărită până la:

assessment → criterion → claim → evidence → location → edition/layer → artifact hash.

⸻

16. Issues sunt incluse

E13 expune un gol real.

Evidence din issues trebuie să intre în același validation contract.

Nu accept:

criterion evidence validated

dar:

issue evidence ignored.

⸻

CORPUS / EDITION / LAYER

17. Evidence trebuie să provină din corpusul permis pentru criteriul evaluat

Implicit, pentru actuala rubrică textuală:

→ textul child-facing al ediției evaluate.

Nu orice string concatenat disponibil evaluatorului.

⸻

18. Ediția EN nu poate fi justificată cu evidence RO

E15:

EN assessment

* RO quote

→ invalid source binding,

dacă criteriul evaluat este assessment-ul EN.

EN și RO trebuie să aibă provenance separat.

⸻

19. Scene description

E14:

citat din scene

nu este automat evidence pentru un criteriu care evaluează textul citit copilului.

Dacă criterion contract spune text-only:

→ scene evidence este wrong-layer.

Dacă un viitor criterion contract permite scene/visual/cross-modal evidence:

→ layer-ul poate fi valid, dar trebuie declarat explicit.

Nu extindem implicit corpusul.

⸻

20. Title / blurb / cover text

Aceeași regulă.

Pot fi evidence numai dacă criterion scope le include.

Nu doar pentru că se află în corpusul tehnic concatenat.

⸻

SEMANTIC VALIDATION

21. Prezența nu este suport

E4:

T04 rhythm
← The sun turns orange.

String-ul există.

Dar prezența nu demonstrează ritmul.

Prin urmare:

→ semantic support absent / insufficient;

→ assessment nu poate fi VALIDATED pe baza acelui evidence.

⸻

22. Contradicția

E5:

T07 = 9
← Oh no! A big wave tips the boat.

Nu decid aici că propoziția dovedește T07 mic.

Dar simpla ei existență nu justifică automat T07=9.

Validatorul trebuie să verifice relația:

evidence → claim → score.

Dacă evidence contrazice rationale-ul:

→ assessment INVALID sau necesită reevaluare, în funcție de întregul evidence bundle.

⸻

23. Afirmație falsă despre text

E8:

The refrain "Splash, splash, splash!" repeats on every page.

dacă apare o singură dată:

→ claim factual false;

→ assessment INVALID pentru acel rationale.

Nu contează că citatul în sine există.

⸻

24. Evidence prea generală

E6:

the boat

nu devine suficientă doar pentru că are mai mult de patru caractere.

Suficiența nu se măsoară prin lungimea string-ului.

⸻

25. Evidence foarte scurtă

În sens invers:

un citat scurt poate fi perfect valid.

Prin urmare eliminăm ca politică semantică:

length < 4 → insufficient.

Lungimea poate rămâne eventual heuristic diagnostic.

Nu verdict.

⸻

26. Nota mică + evidence pozitivă

E11:

T13 = 6.5
← Bo pulls the oars.

Nu deduc automat:

quote positive → score must be high.

Poate exista evidence suplimentară care justifică agency slabă în ansamblu.

Dar dacă acesta este singurul evidence/rationale folosit pentru T13=6.5 și nu explică nota mică:

→ assessment-ul nu este suficient validat.

Prin urmare:

nu REPAIR încă.

→ reevaluate assessment.

⸻

SCORE SUPPORT

27. Evidence trebuie să susțină nu numai criterion topic, ci și assessment direction

Nu este suficient:

quote is about agency.

Trebuie să susțină:

de ce agency assessment este slab/bun.

⸻

28. Evidence trebuie să susțină și severitatea/scorul în măsura necesară

Un quote care demonstrează:

there is some agency

nu demonstrează automat:

T13 = 9.

Și un quote care arată o slăbiciune nu demonstrează automat:

T13 = 6.5.

⸻

29. Nu pretindem precizie epistemică falsă

D-18 nu decide că un singur citat poate demonstra matematic diferența dintre:

8.4 și 8.5.

Dar dacă scorurile numerice sunt folosite în:

* mean;
* floor;
* critical threshold;

atunci assessment-ul trebuie să aibă rationale/evidence suficient pentru poziționarea sa față de pragurile relevante și pentru granularitatea de scor permisă de contract.

Granularitatea exactă rămâne dependency D-16.

⸻

30. Assessment bundle, nu quote izolat

Pentru criterii globale precum:

* pacing;
* coherence;
* agency;
* ending;
* voice;

un singur quote poate să nu fie suficient pentru scor.

Validatorul poate avea nevoie de:

* quote;
* counterevidence search;
* multiple locations;
* criterion-specific rationale;
* whole-artifact context.

Prin urmare:

ONE QUOTE REQUIRED BY PROMPT ≠ ONE QUOTE IS ALWAYS SUFFICIENT TO VALIDATE THE SCORE.

⸻

REUSE

31. Refolosirea nu este defect în sine

Nu aleg B.

Un citat poate susține legitim mai multe criterii.

Exemplu ipotetic:

o singură replică poate fi relevantă atât pentru:

* voice;
* age-fit;
* dialogue naturalness.

⸻

32. Eliminăm pragul semantic >=3

Nu există justificare pentru:

* reuse twice → okay;
* reuse three times → bad.

Acesta este accident de implementare.

⸻

33. Reuse devine signal

EVIDENCE_REUSED_ACROSS_CRITERIA

poate rămâne diagnostic.

Dar trebuie urmat de întrebarea:

Does this evidence independently support each criterion-specific claim?

⸻

34. Reuse valid

Dacă același quote susține în mod real fiecare claim:

→ poate fi VALIDATED pentru fiecare.

⸻

35. Reuse invalid

Dacă același quote este copiat mecanic pentru criterii fără relație:

→ assessment-urile respective sunt INVALID/UNVERIFIED după verificarea semantică.

Nu pentru că quote-ul a fost folosit de trei ori.

Ci pentru că nu susține claim-urile respective.

⸻

v2c-quality-02

36. Verdict istoric

v2c-quality-02

rămâne:

→ pozitiv conform v2.

Nu modifica Gold-v2.

Nu reinterpreta rezultatul istoric ca și cum v3 ar fi existat.

⸻

37. Sub v3

Același assessment ar necesita validation criterion-by-criterion.

Faptul că:

Bo has a little blue boat.

este folosit pentru toate cele 18 criterii:

→ declanșează reuse diagnostic;

→ semantic validation.

Probabilitatea evidentă că un singur citat susține toate cele 18 criterii este mică, dar D-18 nu permite verdict lexical/mecanic.

Validatorul trebuie să demonstreze care criterion claims sunt sau nu susținute.

⸻

GATE CONSEQUENCE

38. V3 final acceptance cere assessment validat

Aici modific recomandarea lui Claude.

Nu accept regula:

UNVERIFIED poate decide poarta ca azi.

Aceasta ar păstra problema fundamentală.

În v3:

FINAL QUALITY PASS REQUIRES A VALIDATED ASSESSMENT.

Și:

FINAL QUALITY FAIL THAT TRIGGERS ARTIFACT REPAIR REQUIRES A VALIDATED ASSESSMENT.

⸻

39. UNVERIFIED poate permite procesarea intermediară

Pentru a nu bloca inutil pipeline-ul intern:

UNVERIFIED poate permite:

* diagnostic;
* critic iteration;
* candidate scoring;
* temporary internal ranking;
* request for validation.

Dar nu:

* final acceptance;
* final quality rejection;
* REPAIR_REQUIRED al artifactului;
* release eligibility.

⸻

40. Dacă validatorul semantic nu există încă

Până când Semantic Hardening #2 implementează și validează acest strat:

nu pretinde:

v3 validated quality.

Runtime-ul actual poate continua să fie descris conform politicii sale reale v2.

D-18 definește target contract v3.

Nu falsificăm readiness.

⸻

RETRY / FAILURE

41. Prima evaluare invalidă

→ reevaluate assessment.

Nu modifica artifactul.

⸻

42. Reevaluarea produce assessment valid

Atunci quality gate îl poate folosi.

⸻

43. Reevaluarea rămâne invalidă

După numărul de încercări permis de workflow:

→ ASSESSMENT_INVALID

sau echivalent.

Nu:

ARTIFACT_QUALITY_FAIL.

⸻

44. Consecința operațională

Artifactul nu poate fi final acceptat deoarece nu avem o evaluare validă.

Dar motivul este:

assessment failure

nu:

content quality failure.

Acestea trebuie afișate separat operatorului.

⸻

45. Operatorul poate adjudeca assessment validity unde politica permite

Dacă validatorul automat nu poate determina semantic suportul:

→ operator REVIEW al assessment-ului.

Operatorul poate confirma:

* evidence validă;
* evidence invalidă;
* need reevaluation.

Nu este quality waiver.

⸻

VALIDATION STRICTNESS

46. Nu folosim două standarde epistemice complet diferite pentru PASS și FAIL

Toate criteriile folosite în verdict trebuie validate.

⸻

47. Boundary scores necesită atenție suplimentară

Dacă scorul este gate-determinative sau aproape de:

* mean 8;
* criterion floor 7;
* critical threshold 8;

validatorul trebuie să confirme explicit relația evidence/rationale cu pragul relevant.

Nu stabilesc aici o distanță numerică de tip:

within 0.2.

Ar fi arbitrară fără evidence.

⸻

48. FAIL care declanșează REPAIR

Orice assessment care ar trimite artifactul în REPAIR_REQUIRED trebuie validat înainte de repair.

Aceasta este obligatorie.

⸻

49. PASS final

Și assessment-ul care produce PASS final trebuie validat.

Nu accept:

we validate only failures.

Altfel high hallucinated scores pot trece produsul.

⸻

D-17 JURISDICTION

50. Validarea include jurisdicția

Pentru T07, validatorul trebuie să verifice:

Is this evidence actually evidence for T07's independent quality jurisdiction?

Dacă evidence este exclusiv:

* safety;
* content-policy;
* age-fit;
* science;

→ mis-scoped.

⸻

51. Mis-scoped T07

Exemplu:

T07 = 6.5

doar pentru un safety finding deja trimis safety gate.

→ assessment T07 nu este valid ca independent quality failure.

→ reevaluate T07.

Nu waiver.

⸻

52. Delegated finding rămâne

Reevaluarea T07 nu șterge safety finding-ul.

Fiecare rămâne în jurisdicția sa conform D-17.

⸻

PAGE → BOOK → VOLUME → COLLECTION

53. Page

Evidence locală trebuie legată de locația reală.

Pagina declarată trebuie verificată.

⸻

54. Book / Volume

Un criterion global poate necesita evidence distribuită.

Validatorul nu trebuie să presupună că un quote local reprezintă întregul volum.

⸻

55. Collection

Dacă se face o afirmație de collection-level:

evidence trebuie să acopere suficient colecția.

Nu accept:

one page quote → collection-wide score

fără aggregation rationale.

⸻

56. Scope trebuie înregistrat

Evidence trebuie să știe dacă susține:

* Page;
* Book;
* Volume;
* Collection.

Nu generaliza implicit.

⸻

EN / RO

57. Evidence este edition-bound

EN assessment:

→ EN evidence.

RO assessment:

→ RO evidence.

Cross-edition evidence este permis numai pentru un criterion explicit de:

* fidelity;
* localization comparison;
* semantic parity;

nu pentru o rubrică monolingvă.

⸻

58. Lipsa rubricii native rămâne dependency

D-18 nu inventează acum o rubrică RO.

Dar dacă va exista:

aceeași politică de evidence validation trebuie aplicată.

⸻

TEXT / VISUAL / CROSS-MODAL

59. Text assessment

Evidence textuală din layer-ul permis.

⸻

60. Visual assessment

D-18 nu declară actualul visual QA validat prin această politică.

Visual evidence validation rămâne dependency.

⸻

61. Cross-modal

Dacă un viitor criterion este cross-modal:

evidence trebuie să indice explicit:

* text evidence;
* visual evidence;
* relația dintre ele.

Nu acceptăm un quote textual ca dovadă că imaginea are o anumită proprietate.

⸻

62. Scene description ≠ image evidence

Descrierea scenei este text despre imaginea intenționată.

Nu este dovadă că imaginea generată chiar conține acel lucru.

Această distincție trebuie păstrată.

⸻

EVIDENCE CAUSES / REASON CODES

63. Cauzele trebuie separate conceptual

Cel puțin:

* EVIDENCE_ABSENT
* EVIDENCE_FABRICATED
* EVIDENCE_NOT_CITABLE
* EVIDENCE_LOCATION_MISMATCH
* EVIDENCE_WRONG_EDITION
* EVIDENCE_WRONG_LAYER
* EVIDENCE_STALE_HASH
* EVIDENCE_IRRELEVANT
* EVIDENCE_CONTRADICTS_CLAIM
* EVIDENCE_FALSE_ARTIFACT_CLAIM
* EVIDENCE_INSUFFICIENT_FOR_CLAIM
* EVIDENCE_INSUFFICIENT_FOR_SCORE
* EVIDENCE_REUSED
* EVIDENCE_REUSED_UNSUPPORTED
* EVIDENCE_JURISDICTION_MISMATCH

Numele finale pot fi ajustate arhitectural.

Nu implementa lista acum.

⸻

64. Nu toate reason codes au aceeași consecință

EVIDENCE_REUSED

poate fi signal.

EVIDENCE_FABRICATED

→ assessment invalid.

EVIDENCE_WRONG_EDITION

→ assessment invalid.

EVIDENCE_IRRELEVANT

→ assessment invalid sau reevaluation required pentru criterion.

Trebuie păstrată distincția.

⸻

BOUNDARY CASES

65. E1 — baseline

present_unverified

sub v2 poate PASS conform politicii istorice.

Sub v3:

→ nu este încă VALIDATED doar pentru că evidence există.

Necesită semantic validation.

⸻

66. E2b — same quote ×2

Nu invalid automat.

→ reuse signal opțional;

→ validate criterion-specific support.

⸻

67. E2c — same quote ×3

Exact aceeași regulă.

Nu există prag semantic magic la 3.

⸻

68. E3 — fabricated quote

→ assessment INVALID.

→ reevaluate.

Nu artifact FAIL.

⸻

69. E4 — real but irrelevant

→ evidence semantic invalid pentru acel claim.

→ criterion assessment invalid/unverified pending reevaluation.

⸻

70. E5 — evidence contradicts assigned assessment

→ nu poate fi VALIDATED fără rationale suplimentar care rezolvă contradicția.

⸻

71. E6 — the boat

Nu decide prin character count.

→ semantic sufficiency required.

⸻

72. E6b — Bo

Nu decide doar prin două caractere.

Poate fi insuficient în cazul respectiv, dar motivul este semantic, nu lungimea.

⸻

73. E7 — commentary without quote

→ NOT_CITABLE / evidence absent pentru contractul care cere citat.

Nu fabricated.

⸻

74. E8 — quote real + false statement

→ assessment INVALID dacă claim-ul factual pe care se bazează assessment-ul este fals.

⸻

75. E9 — legitimate ellipsis

→ poate fi valid dacă mapping-ul este verificabil și sensul este păstrat.

Nu fabricated automat.

⸻

76. E10 — wrong page

→ location invalid.

→ assessment nu poate fi VALIDATED până la corectare.

⸻

77. E11 — low score + positive quote

→ nu REPAIR automat.

→ verifică dacă întregul evidence/rationale susține scorul mic.

Dacă nu:

→ reevaluate assessment.

⸻

78. E12 — missing evidence

→ assessment incomplete/invalid conform contractului.

Nu artifact defect.

⸻

79. E13 — issue fabricated evidence

→ trebuie prins de validator.

Issues nu sunt exceptate.

⸻

80. E14 — scene quote for text criterion

→ wrong layer.

⸻

81. E15 — RO quote for EN criterion

→ wrong edition.

⸻

RELAȚIA CU D-01…D-17

82. D-01–D-13

D-18 nu schimbă politicile lor.

Dacă quality critic citează evidence din acele domenii:

D-17 jurisdiction se aplică.

⸻

83. D-14

Candidate / confirmed / dismissed findings și trasabilitatea rămân.

D-18 adaugă validation state pentru assessment evidence.

⸻

84. D-15

Principiul este analog:

correction token ≠ semantic correction

și aici:

quote token ≠ semantic support.

⸻

85. D-16

Doar un assessment valid poate activa:

* criterion floor;
* critical threshold;
* mean consequence;
* REPAIR_REQUIRED.

Invalid assessment → reevaluate.

⸻

86. D-17

Assessment validation trebuie să verifice și authoritative jurisdiction.

Un T07 score nu poate deveni valid doar pentru că evidence există dacă evidence aparține safety/content-policy/age-fit.

⸻

87. Mean

Media de calitate nu trebuie considerată final validată dacă scorurile care o compun nu au assessment validation suficientă.

Nu accept:

invalid individual score → valid exact mean.

⸻

88. Version selection

Regula D-16:

gate-valid candidate înaintea scorului mai mare

trebuie înțeleasă astfel:

un candidate cu assessment nevalidat nu poate fi tratat drept gate-valid final.

⸻

CINE VALIDEAZĂ

89. D-18 decide funcția, nu furnizorul

Nu decid acum dacă validatorul semantic este:

* același model într-o instanță independentă;
* alt model;
* alt permanent agent;
* operator;
* deterministic + model hybrid.

Aceasta rămâne implementation / commissioning dependency.

⸻

90. Dar validatorul trebuie să fie separat logic

Nu accept:

critic says quote supports score → therefore quote supports score.

Ar fi circular.

Assessment Validation trebuie să fie logic distinct de Assessment.

⸻

91. Deterministic checks nu necesită model

Prezență, hash, edition, page, layer etc.:

→ deterministic unde posibil.

⸻

92. Semantic support

Relevance, contradiction, sufficiency, claim-to-score relation:

→ semantic validator / operator / mecanism ulterior demonstrabil.

Nu inventa word-list shortcuts.

⸻

GOLD / MEASUREMENT

93. Nu modifica Gold-v2 acum

0/226 operator adjudication rămâne până la procedura stabilită.

⸻

94. D-19 / D-20 trebuie să reprezinte starea separată

Important pentru investigația următoare:

assessment invalid

nu trebuie măsurată ca:

content negative.

Și:

assessment unverified

nu trebuie măsurată automat ca:

content positive.

Aceasta este dependency pentru D-19 / D-20.

⸻

95. Historical v2 evidence

Rămâne evidence despre evaluatorul v2.

Nu îl rescrie după politica v3.

⸻

FORMULĂRI OBLIGATORII

Înregistrează explicit:

Evidence presence is necessary where the criterion contract requires cited evidence, but presence alone is not evidence validity.

A quality assessment may produce a final PASS or a content-driven FAIL only after the assessment evidence required by the applicable policy has been validated.

An INVALID or UNVERIFIED assessment is a property of the assessment process, not proof of an artifact quality defect.

An invalid assessment must be re-evaluated; re-evaluation is not a waiver of a confirmed quality defect.

Evidence reuse is a diagnostic signal, not an automatic invalidation rule; reused evidence must independently support every criterion-specific claim for which it is used.

Evidence length is not a semantic sufficiency test.

Assessment validation must bind criterion, claim, evidence, artifact location, edition/layer and artifact hash.

For T07, assessment validation also verifies authoritative jurisdiction under D-17.

⸻

CE NU DECIDE D-18

D-18 NU decide:

* modelul/furnizorul concret al semantic validatorului;
* dacă validatorul va fi un nou agent sau o funcție a unui agent permanent;
* costul mecanismului;
* numărul final de retry-uri;
* granularitatea numerică a scorurilor;
* taxonomia completă per criterion pentru „sufficient evidence”;
* schema Gold — D-19 / D-20;
* metricile Gold — D-19 / D-20;
* validation performance thresholds — D-21;
* author independence — D-22;
* rubrica nativă;
* visual evidence validator;
* cross-modal evidence validator;
* empirical validity;
* rubric redesign;
* Product Contract changes.
```

### Formulări obligatorii (înregistrate ca atare)

> Evidence presence is necessary where the criterion contract requires cited evidence, but presence alone is not evidence validity.
>
> A quality assessment may produce a final PASS or a content-driven FAIL only after the assessment evidence required by the applicable
> policy has been validated.
>
> An INVALID or UNVERIFIED assessment is a property of the assessment process, not proof of an artifact quality defect.
>
> An invalid assessment must be re-evaluated; re-evaluation is not a waiver of a confirmed quality defect.
>
> Evidence reuse is a diagnostic signal, not an automatic invalidation rule; reused evidence must independently support every
> criterion-specific claim for which it is used.
>
> Evidence length is not a semantic sufficiency test.
>
> Assessment validation must bind criterion, claim, evidence, artifact location, edition/layer and artifact hash.
>
> For T07, assessment validation also verifies authoritative jurisdiction under D-17.
>
> v2c-quality-02 remains historically positive under v2. D-18 defines a new versioned v3 assessment-validation policy and does not
> mutate frozen historical labels or results.

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea D, rafinată: strat de validare a evaluării, separat, obligatoriu și simetric. Straturile OBS-GS-18 (A critic · B validare · C poartă · D calitatea reală) devin contractuale. Politică nouă **v3**; v2 nu se rescrie. |
| **Versiunea politicii / criteriu / scor / scor canonic / relația cu pragul** | v2 = runtime actual, istoric; v3 = target contract. Scorurile care decid poarta sau sunt apropiate de praguri cer confirmare explicită a relației cu pragul, fără distanță numerică fixă. |
| **Claim / evidence / tip / locație declarată / locație verificată / nivel / ediție / layer / hash** | Lanțul assessment → criterion → claim → evidence → location → edition / layer → artifact hash. Corpusul implicit: textul citit de copil, din ediția evaluată. Scena, titlul, blurb-ul și coperta doar dacă scope-ul criteriului le include. EN ≠ RO. Pagina declarată se verifică. |
| **Prezență / elipsă** | Prezența e necesară unde se cere citat, nu e suficientă. ELLIPSIS ≠ FABRICATION (validată structural). Comentariul fără citat = NOT_CITABLE. |
| **Relevanță / contradicție / afirmații despre text / suficiență pentru claim și scor** | Semantic, printr-un validator logic separat de critic. Nu după lungime. Pentru criterii globale e nevoie de bundle (citat, contra-evidence, locații multiple, context). |
| **Refolosire** | Doar diagnostic; pragul „≥ 3” eliminat. Refolosirea e validă dacă susține fiecare claim. |
| **Jurisdicție / related findings** | T07: evidence exclusiv safety / content-policy / age-fit / science → mis-scoped → reevaluare (D-17); finding-ul delegat rămâne. |
| **Starea de validare / motive / proveniența validatorului** | VALIDATED / UNVERIFIED / INVALID (WEAK doar diagnostic). Agregatul e VALIDATED doar dacă toate componentele necesare sunt validate. Coduri conceptuale cu consecințe diferite (REUSED = semnal; FABRICATED / WRONG_EDITION → invalid; IRRELEVANT → invalid sau reevaluare). Furnizorul validatorului nu e decis. |
| **Retry / adjudecarea operatorului** | Invalid → reevaluare (artifactul nu se modifică). După încercările permise → ASSESSMENT_INVALID. Operatorul poate adjudeca validitatea evaluării; nu e waiver. |
| **Consecințe: calitate / artifact / release** | **FINAL QUALITY PASS REQUIRES A VALIDATED ASSESSMENT. FINAL QUALITY FAIL THAT TRIGGERS ARTIFACT REPAIR REQUIRES A VALIDATED ASSESSMENT.** UNVERIFIED → ASSESSMENT_VALIDATION_REQUIRED (permite doar procesare intermediară). INVALID ≠ artifact FAIL. Release nu e eligibil fără evaluare validată; motivul (assessment failure) se afișează separat de content failure. Recomandarea furnizorului („UNVERIFIED decide poarta ca azi”) **nu a fost adoptată**. |
| **Relația cu D-16** | Doar evaluarea validată activează floor, critical, media și REPAIR_REQUIRED. „invalid individual score → valid exact mean” respins. Un candidat nevalidat nu e gate-valid final. |
| **Niveluri / ediții / vizual** | Scope-ul evidence-ului e înregistrat (Page / Book / Volume / Collection), fără generalizare. Evidence edition-bound; cross-edition doar pentru fidelity / parity. QA vizual nevalidat prin această politică. Scene description ≠ image evidence. |
| **Comportamentul evaluatorului la momentul deciziei** (HEAD `8979277`, v2, neschimbat) | Prezență după normalizare pe un corpus concatenat. NOT_FOUND / INSUFFICIENT (< 4 caractere) / REUSED (≥ 3) raportate. Doar NOT_FOUND schimbă verdictul (confundat cu eșecul artifactului). Criticul e reîntrebat o dată, apoi eroare. Elipsa legitimă tratată ca inventată. Pagina ignorată. Issues lipsă din raport. **Comportamentul nu e politica.** |
| **Consecințe viitoare** (Semantic Hardening #2, neautorizat încă) | Strat B separat; stări per criteriu și agregat; verificări deterministe și semantice; ASSESSMENT_VALIDATION_REQUIRED / ASSESSMENT_INVALID separate de content failure; politică v3 versionată, rapoarte regenerate; reprezentarea în Gold după D-19 / D-20. |

### Rezultatele de graniță E1–E15

E1 (prezent, neverificat) → sub v2 poate PASS (istoric); sub v3 nu e VALIDATED doar prin prezență · E2b / E2c (refolosire ×2 / ×3) →
aceeași regulă, fără prag; validare per criteriu · E3 (inventat) → INVALID → reevaluare, nu artifact FAIL · E4 (irelevant) → invalid /
unverified până la reevaluare · E5 (contrazice) → nu VALIDATED fără rationale care rezolvă contradicția · E6 / E6b („the boat” / „Bo”)
→ suficiență semantică, nu după caractere · E7 (comentariu) → NOT_CITABLE, nu fabricat · E8 (afirmație falsă despre text) → INVALID ·
E9 (elipsă legitimă) → poate fi valid · E10 (pagină greșită) → locație invalidă · E11 (notă mică + citat pozitiv) → nu REPAIR automat;
reevaluare dacă rationale-ul nu susține nota · E12 (evidence lipsă) → assessment incomplet / invalid, nu defect al artifactului ·
E13 (issue inventat) → prins de validator · E14 (scenă pentru criteriu text) → wrong layer · E15 (RO pentru EN) → wrong edition.

### Afectate (fără nicio modificare acum)

- **Gold-v2:** v2c-quality-02 rămâne pozitiv sub v2 (istoric). Sub v3: v2c-quality-03 → evaluare INVALID, nu artifact negativ; v2c-quality-01 nu e VALIDATED doar prin prezență. Reprezentarea → D-19 / D-20.
- **Probe:** P-Q01 / P-Q02 rămân dovezi despre v2.
- **Setul rezervat (înghețat, fără rerun):** v2h-quality-04 rămâne înregistrat sub v2.
- **Gold-v1:** neschimbat.

### Nu decide

Furnizorul / agentul validatorului semantic · costul · numărul de retry-uri · granularitatea scorurilor · taxonomia suficienței per
criteriu · schema și metricile Gold (D-19 / D-20) · D-21 · D-22 · rubrica nativă · validatorul vizual / cross-modal · validitatea
empirică · rubrica · Product Contract.

### Dependențe deschise

- **D-18-DEP-SEMANTIC-VALIDATOR** · **D-18-DEP-RETRY-COUNT** · **D-18-DEP-SUFFICIENCY-TAXONOMY** · **D-18-DEP-MEASUREMENT** → D-19 / D-20 ·
  **D-18-DEP-VISUAL-CROSSMODAL-EVIDENCE** · **D-18-DEP-V3-REPORT-REGENERATION** · legătura cu **D-16-DEP-SCORING-GRANULARITY**.

## D-19 — Pragurile de acoperire (extins explicit: reprezentarea ground truth)

**Domeniu.** Rândul D-19 din registru (pragurile minime din `validationRequirements`) rămâne neschimbat ca dovadă istorică. Operatorul a
extins explicit decizia la reprezentarea necesară pentru o măsurare corectă a acoperirii (subîntrebarea 0, varianta 0-b). Formularea
anterioară „D-19 / D-20 = reprezentarea în Gold” provenea din prezentările furnizorului, nu din registru.

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-19 — DECIZIA OPERATORULUI

Aleg:

Subîntrebarea 0: (0-b) — extindere explicită a domeniului D-19 pentru reprezentare + pragurile de acoperire.

Pentru praguri aleg:

Opțiunea D peste C, rafinată.

Motivul fundamental:

NU putem defini corect „minimum coverage” peste o reprezentare despre care D-11…D-18 au demonstrat deja că pierde distincțiile pe care politica le consideră normative.

Principiile centrale sunt:

FINDING ≠ SEVERITY ≠ POLICY CONSEQUENCE ≠ PUBLISHING CONSEQUENCE.

FINDING PRESENT ≠ CONTENT NEGATIVE.

NO FINDING ≠ AUTOMATIC CONTENT POSITIVE.

REVIEW ≠ BLOCK.

PASS_WITH_ADVISORY ≠ FALSE PASS.

ASSESSMENT_INVALID ≠ CONTENT NEGATIVE.

UNVERIFIED ≠ CONTENT POSITIVE.

DETECTION ACCURACY ≠ POLICY-DECISION ACCURACY ≠ PUBLISHING-DECISION ACCURACY.

TOTAL CASE COUNT ≠ POLICY COVERAGE.

A COVERAGE CELL WITH ZERO CASES IS UNCOVERED, EVEN IF THE KIND-LEVEL TOTAL PASSES.

COVERAGE ≠ PERFORMANCE.

Nu implementa acum.

⸻

1. Extinderea domeniului D-19

Registrul istoric D-19 rămâne neschimbat.

Nu rescrie rândul original.

Înregistrează explicit:

Operatorul extinde D-19 deoarece pragurile de acoperire din registrul original sunt definite peste positive / negative / null, iar D-11…D-18 au demonstrat că această proiecție binară nu poate reprezenta fără pierdere politica necesară pentru măsurarea corectă a acoperirii.

Aceasta este o extindere explicită a deciziei, nu o corectare retroactivă a registrului.

⸻

2. Schema binară nu mai este reprezentarea canonică

label ∈ {positive, negative, null} poate rămâne:

* pentru compatibilitate;
* pentru reproducerea rapoartelor istorice;
* pentru comparația cu Gold-v1 / Gold-v2 v2;
* ca proiecție derivată unde este bine definită.

Dar NU mai este ground truth-ul canonic pentru politica nouă.

⸻

3. Reprezentarea canonică minimă

Pentru un caz evaluabil, ground truth-ul trebuie să poată reprezenta separat cel puțin:

A. Expected finding

* present / absent;
* finding family;
* expected code/dimension unde este aplicabil;
* authoritative jurisdiction.

B. Expected severity

Unde politica folosește severitate:

* advisory;
* material;
* severe;
* sau taxonomia canonical specifică axei.

Nu forța severitate pe un tip unde conceptul nu se aplică.

C. Expected assessment-validation state

Unde cazul e despre assessment/evidence, conform D-18:

* VALIDATED;
* UNVERIFIED;
* INVALID;
* sau starea canonical finală.

D. Expected policy consequence

Consecința în jurisdicția autoritativă.

E. Expected publishing consequence

Cel puțin conceptual:

* PASS;
* PASS_WITH_ADVISORY;
* REVIEW_REQUIRED;
* REPAIR_REQUIRED;
* BLOCKED_BY_POLICY;
* ASSESSMENT_INVALID;
* ASSESSMENT_VALIDATION_REQUIRED / echivalent pentru UNVERIFIED.

Nu toate tipurile trebuie să poată produce toate stările.

F. Scope

* Page;
* Book;
* Volume;
* Collection.

G. Edition / language

Ediția realmente evaluată.

H. Modality

* text;
* visual;
* cross-modal;

numai acolo unde jurisdicția respectivă există.

⸻

4. Nu crea un produs cartezian artificial

Nu cer:

every kind × every age × every language × every modality × every consequence

dacă politica nu depinde de acea dimensiune.

O celulă devine obligatorie numai dacă dimensiunea poate schimba legitim:

* finding-ul;
* severitatea;
* interpretarea;
* policy consequence;
* publishing consequence;

sau dacă sistemul pretinde că operează acea dimensiune.

Aceasta trebuie numită:

policy-relevant coverage matrix

sau echivalent.

⸻

5. Exemplu: safety

Pentru o politică unde verdictul poate fi:

* PASS;
* REVIEW;
* BLOCK;

coverage trebuie să distingă aceste ramuri.

Nu accept:

REVIEW + BLOCK = negative coverage.

Trebuie să putem răspunde separat:

* detectorul a identificat finding-ul?
* a atribuit corect verdictul?
* a produs consecința corectă?

⸻

6. Exemplu: age-fit

Un finding poate exista și artifactul poate rămâne publicabil.

Prin urmare:

AGE finding present

nu poate fi definit automat ca:

negative.

Exemplu canonical din D-12/D-14:

5–6 + abstraction advisory

poate fi:

* finding present;
* severity advisory;
* publishing PASS_WITH_ADVISORY.

Un evaluator care detectează corect finding-ul nu trebuie măsurat ca false block doar fiindcă schema binară a confundat finding presence cu publishing failure.

⸻

7. v2c-age-abs-03

Cazul trebuie marcat pentru adjudecare conform noii politici.

Nu modifica acum eticheta înghețată.

În reprezentarea nouă trebuie să poată exista:

* abstraction finding present;
* advisory;
* publishing PASS / PASS_WITH_ADVISORY conform D-12/D-14;
* fără a pierde faptul că vechea schemă îl numea negative.

Istoricul și politica nouă trebuie păstrate separat.

⸻

8. v2c-age-syn-02

D-13/D-14 cer posibilitatea:

* syntactic finding present;
* advisory;
* publishing PASS.

Schema binară actuală nu poate reprezenta corect simultan ambele proprietăți.

Noua reprezentare trebuie să poată.

⸻

9. Localizare

Trebuie separate:

* candidate finding;
* confirmed defect;
* dismissed false positive;
* REVIEW_REQUIRED;
* REPAIR_REQUIRED;
* PASS.

localization code present = negative

nu este suficient.

⸻

10. Știință

Trebuie separate:

* misconception finding;
* correction status;
* final takeaway;
* advisory/review unde politica îl cere;
* confirmed false scientific takeaway;
* PASS;
* REVIEW_REQUIRED;
* REPAIR_REQUIRED.

D-15 rămâne autoritativă.

⸻

11. Calitate / D-18

Trebuie separate:

artifact quality state

de:

assessment validation state.

Un fabricated quote poate produce:

ASSESSMENT_INVALID

fără să producă:

CONTENT_NEGATIVE.

Această distincție trebuie să existe în ground truth și în metrici.

⸻

12. ASSESSMENT_INVALID

Nu îl proiecta automat în:

negative.

⸻

13. UNVERIFIED

Nu îl proiecta automat în:

positive.

Și nici în:

negative.

Este o stare epistemică a assessment-ului.

⸻

14. Proiecția legacy

Dacă se păstrează positive/negative/null, proiecția trebuie:

* versionată;
* explicită;
* derivată;
* reproductibilă.

Nu trebuie folosită pentru a ascunde ground truth-ul multidimensional.

⸻

15. Unele stări pot să nu aibă proiecție binară validă

Dacă:

UNVERIFIED

nu are o proiecție semantic corectă în positive/negative,

atunci proiecția poate fi:

null / not-applicable-for-binary-metric

în raportul nou.

Nu forța clasificarea doar pentru a păstra o matrice binară.

⸻

METRICI

16. Detection accuracy

Măsoară separat:

A găsit sistemul finding-ul care trebuia găsit?

Aceasta este detection accuracy.

⸻

17. Finding false positive / false negative

False positive și false negative la nivel de finding se calculează față de:

expectedFinding.

Nu față de publishing consequence.

⸻

18. Severity accuracy

Dacă finding-ul este corect:

a atribuit severitatea corectă?

Aceasta este o metrică separată.

⸻

19. Policy-consequence accuracy

A aplicat corect politica în jurisdicția autoritativă?

Separat.

⸻

20. Publishing-decision accuracy

A produs sistemul consecința corectă pentru publicare?

Separat.

⸻

21. Assessment-validation accuracy

Pentru cazurile D-18:

A identificat corect VALIDATED / UNVERIFIED / INVALID?

Separat.

⸻

22. Nu colapsa metricile într-un singur „accuracy”

Un sistem poate:

* detecta perfect finding-ul;
* greși severitatea;
* greși publishing consequence.

Sau invers.

Raportul trebuie să arate unde a greșit.

⸻

23. exact

Poate exista o metrică strictă end-to-end.

Dar trebuie definită ca:

toate componentele relevante cazului sunt corecte.

Nu înlocuiește metricile pe straturi.

⸻

COVERAGE

24. Resping ca prag final suficient regula legacy 8 / 6 / 3 / 3

Nu afirm că numerele sunt „greșite” statistic.

Afirm:

nu există evidence suficientă pentru a le valida ca praguri finale de Enterprise acceptance.

Mai important, ele sunt definite peste o reprezentare binară care nu mai este suficientă.

Prin urmare:

8 calibration / 6 holdout / 3 positive / 3 negative

rămâne:

historical proposed v2 coverage requirement

și NU:

operator-approved final Enterprise coverage requirement.

⸻

25. Nu înlocuiesc 8/6/3/3 cu alte numere arbitrare

Nu aleg:

10 / 8 / 4 / 4,

sau:

5 / 5 / 2 / 2,

fără evidence.

Ar fi aceeași problemă cu alte cifre.

⸻

26. D-19 aprobă un minimum structural

Pentru fiecare required policy-relevant coverage cell:

calibration

trebuie să existe cel puțin un caz adjudecat reprezentativ;

independent holdout / validation

trebuie să existe cel puțin un caz adjudecabil independent pentru aceeași ramură relevantă a politicii.

Aceasta este:

structural coverage minimum.

Este un minimum de existență, NU o afirmație că un singur caz este statistic suficient.

⸻

27. Un caz nu înseamnă suficiență statistică

Formulare obligatorie:

NON-ZERO STRUCTURAL COVERAGE ≠ SUFFICIENT EMPIRICAL VALIDATION.

D-19 răspunde:

Is the required policy branch represented at all?

D-21 va răspunde:

Is measured performance sufficient for acceptance?

Nu le amesteca.

⸻

28. Celulă zero

Dacă o celulă obligatorie are zero cazuri:

→ UNCOVERED.

Nu:

→ PASS deoarece totalul pe tip este mare.

⸻

29. Celulă neaplicabilă

Dacă politica demonstrează că o dimensiune nu se aplică:

→ NOT_APPLICABLE

cu rationale.

Nu trebuie populată artificial.

⸻

30. Celulă nerealizată încă

Dacă sistemul pretinde suport, dar nu există evidence:

→ UNCOVERED.

Nu N/A.

⸻

31. Unknown

Dacă nu știm încă dacă o dimensiune schimbă politica:

→ COVERAGE_REQUIREMENT_UNRESOLVED

sau echivalent.

Nu o ascunde în total.

⸻

STRATIFICARE

32. Age band

Age band este obligatoriu în coverage matrix acolo unde D-11–D-15 arată că verdictul/severitatea/perceptibilitatea poate varia după bandă.

Prin urmare lipsurile precum:

* age 5–6 EN = 0;
* science 3–4 = 0;
* science 5–6 = 0;

nu pot fi mascate de totalurile tipului.

⸻

33. Nu toate safety policies trebuie multiplicate automat pe toate benzile

Dacă D-01…D-10 spun explicit că physical/content-policy truth este același între benzi, nu cer trei copii artificiale doar pentru safety truth.

Dar dacă:

* imitability;
* perceptibility;
* age-fit;
* emotional impact;

pot schimba consecința, stratificarea relevantă devine obligatorie.

⸻

34. Language / edition

EN / RO trebuie stratificate acolo unde:

* evaluatorul operează ambele;
* realizarea lingvistică poate schimba finding-ul;
* D-15/D-18 au demonstrat parity failure;
* localization este evaluată între ediții.

⸻

35. Nu cer traduceri artificiale doar pentru număr

Dacă o jurisdicție există doar într-o anumită direcție prin Product Contract, matricea trebuie să reprezinte acea direcție reală.

Dar trebuie raportată explicit.

⸻

36. Modality

Dacă sistemul pretinde:

* visual safety;
* visual policy;
* cross-modal reasoning;

atunci coverage pentru acele jurisdicții trebuie să existe înainte ca sistemul să pretindă validare Enterprise pentru ele.

⸻

37. Lipsa cazurilor vizuale

Gold-v2 actual este text-only pentru familiile investigate.

Prin urmare:

nu putem afirma că actualul Gold-v2 validează comportamentul visual/cross-modal.

Aceasta trebuie raportată explicit ca gap.

⸻

38. Nu fabrica acum cazuri vizuale pentru a face D-19 verde

D-19 definește cerința.

Crearea/adjudecarea noilor cazuri urmează procedura D-20/D-22 și planul de validare independentă.

⸻

SCOPE

39. Page

Trebuie să existe coverage pentru reguli care operează local pe pagină.

⸻

40. Book

Dacă politica poate schimba verdictul după contextul întregii cărți:

trebuie să existe cazuri Book-level.

⸻

41. Volume

Dacă există agregare sau drift la nivel de volum:

trebuie coverage pentru acel comportament înainte de a pretinde validare.

⸻

42. Collection

Dacă produsul face afirmații de collection-level:

trebuie coverage pentru aggregation/drift la Collection.

⸻

43. Gold-v2 actual

Dacă actualele cazuri nu acoperă Book / Volume / Collection pentru o politică ce depinde de ele:

raportează:

UNCOVERED.

Nu extrapola dintr-un fragment scurt.

⸻

CURRENT GOLD-V2 CONSEQUENCE

44. COVERAGE_MINIMA = PASS actual rămâne adevărat numai pentru regula legacy

Nu rescrie raportul istoric.

Formulare:

Gold-v2 passes the historical/proposed legacy v2 coarse coverage calculation.

Dar:

Gold-v2 does not yet satisfy the D-19 operator-approved structural policy-relevant coverage requirement.

Ambele pot fi adevărate simultan.

⸻

45. Current validation status

Prin urmare:

NOT_COMPLETE

rămâne corect.

Dar după D-19 există încă un motiv independent:

policy-relevant coverage gaps.

Nu doar:

0/226 adjudication + 20 null labels.

⸻

46. Calitate

Faptul că holdout-ul are doar un pozitiv relevant nu trebuie ascuns de total.

Mai important:

quality este doar 3–4 EN în evidence-ul prezentat.

Nu putem pretinde coverage pentru alte benzi/ediții dacă produsul/politica are nevoie de ele.

⸻

47. Age

5–6 EN = zero:

→ explicit UNCOVERED pentru celulele age-policy relevante acelei benzi.

⸻

48. Science

Doar 7–8:

→ nu validează perceptibilitatea/corecția pentru 3–4 sau 5–6.

Aceste celule sunt UNCOVERED dacă produsul pretinde aplicarea politicii acolo.

⸻

49. Localization

Direcția evaluată trebuie înregistrată explicit.

Nu transforma totalul într-o afirmație că toate perechile de limbă sunt validate.

⸻

50. Visual / cross-modal

Actualul Gold-v2 nu validează aceste jurisdicții doar prin existența cazurilor text.

⸻

BOUNDARY COVERAGE

51. O politică cu prag trebuie să aibă boundary coverage

Pentru reguli numerice/ordonate precum:

* 7 vs 6.99;
* 8 vs 7.99;
* PASS vs advisory;
* advisory vs material;
* correction sufficient vs ambiguous;

coverage trebuie să includă cazuri relevante de frontieră.

Nu doar extreme evidente.

⸻

52. Boundary coverage nu înseamnă numai valori numerice

D-01…D-15 au frontiere semantice.

Exemple:

* toy play benign vs threatening;
* challenged stereotype vs fake challenge;
* permission vs safety confirmation;
* correction vs reinforcement;
* visual referent vs conceptual grounding.

Acestea sunt boundary families.

⸻

53. Calibration și holdout nu trebuie să fie clone

Un caz aproape identic în ambele nu demonstrează generalizare.

D-22 rămâne autoritativ pentru independență.

⸻

54. Template-family coverage ≠ independent domain coverage

Dacă zece cazuri sunt variații superficiale ale aceluiași template:

ele pot acoperi o regulă de regresie,

dar nu justifică automat zece unități independente de domain evidence.

Raportează ambele.

⸻

RELAȚIA CU D-20

55. D-19 nu decide ce facem cu actualul holdout

Nu:

* reparăm;
* păstrăm;
* înlocuim;
* construim altul;

în D-19.

Aceasta rămâne D-20.

⸻

56. D-19 transmite D-20 cerințele

Orice strategie D-20 trebuie să poată satisface ulterior:

* schema multidimensională;
* policy-relevant cells;
* missing bands;
* missing consequences;
* missing scopes;
* missing modalities unde sistemul pretinde suport;
* independence requirements.

⸻

RELAȚIA CU D-21

57. D-19 = coverage

D-19 decide:

ce trebuie reprezentat.

⸻

58. D-21 = performance acceptance

D-21 decide:

cât de bine trebuie să performeze sistemul pe evidence-ul valid.

Nu folosi D-19 pentru a inventa accuracy thresholds.

⸻

59. Sample sufficiency rămâne de tratat cu D-21/validation design

Un caz per cell este minimum structural.

Nu este automat suficient pentru:

* precision estimate;
* recall estimate;
* false-pass bound;
* false-block bound;
* confidence interval;
* Enterprise acceptance.

Orice cerință statistică suplimentară trebuie fundamentată, nu inventată.

⸻

RELAȚIA CU D-22

60. Independence

Cazurile noi necesare pentru holdout/hidden validation trebuie să respecte D-22.

D-19 nu autorizează Claude să-și scrie propriul examen și apoi să-l folosească drept dovadă independentă.

⸻

RELAȚIA CU D-01…D-18

61. D-01–D-10

REVIEW și BLOCK sunt stări distincte.

Coverage trebuie să le distingă unde politica le poate produce.

⸻

62. D-11

Age-fit fear:

finding + severity + publishing consequence separate.

⸻

63. D-12

Abstractness:

finding poate exista cu advisory și publishing PASS.

⸻

64. D-13

Syntax:

finding poate exista cu advisory și publishing PASS.

⸻

65. D-14

D-19 formalizează pentru măsurare:

finding → severity → consequence

fără colapsare.

⸻

66. D-15

Science correction:

final takeaway și consequence trebuie reprezentate separat de simpla detecție a unui misconception token.

⸻

67. D-16

Quality thresholds sunt publishing/quality-gate policy.

Coverage trebuie să includă boundary behaviour relevant.

⸻

68. D-17

Jurisdicția autoritativă trebuie să existe în expected truth.

Același defect observat de două mecanisme nu devine două ground truths independente.

⸻

69. D-18

Assessment validation este o axă separată.

INVALID și UNVERIFIED nu sunt content positive/negative.

⸻

CE SE ÎNTÂMPLĂ CU 8 / 6 / 3 / 3

70. Verdict explicit

Nu le aprob ca final Enterprise acceptance minima.

Nu le șterg.

Nu le modific retroactiv.

Le clasific drept:

legacy/proposed coarse v2 coverage thresholds, historically reproducible, not sufficient for D-19 v3 structural coverage acceptance.

⸻

71. Nu există încă un nou număr magic

D-19 aprobă:

all required policy-relevant cells must be non-zero in both calibration and independent validation/holdout before structural coverage can pass.

Dar:

non-zero does not imply empirical sufficiency.

⸻

72. Dacă o singură celulă obligatorie este zero

D-19 structural coverage:

→ FAIL / INCOMPLETE.

Indiferent dacă totalul tipului este 100.

⸻

73. Dacă toate celulele sunt non-zero

D-19 structural coverage poate fi:

→ structurally complete.

Dar Enterprise validation poate rămâne:

→ NOT ACCEPTED

din cauza:

* D-21 performance;
* D-22 independence;
* adjudication incompletă;
* insufficient statistical evidence;
* failed integrity;
* failed hidden validation;
* alte gates.

⸻

FORMULĂRI OBLIGATORII

Înregistrează explicit:

The operator extends D-19 to define the representation required for meaningful coverage measurement; the original registry row remains unchanged as historical evidence.

The canonical ground truth is multidimensional. positive / negative / null is a legacy compatibility projection and is not sufficient as the canonical policy representation.

Finding presence, finding severity, assessment-validation state, authoritative policy consequence and publishing consequence are separate dimensions and must not be conflated.

Detection accuracy, severity accuracy, policy-consequence accuracy, assessment-validation accuracy and publishing-decision accuracy are separate measurements.

A policy-relevant coverage cell with zero cases is uncovered even when kind-level totals exceed legacy thresholds.

The legacy proposed 8 / 6 / 3 / 3 thresholds remain historically reproducible but are not operator-approved as sufficient final Enterprise coverage thresholds.

D-19 establishes non-zero structural coverage for every required policy-relevant cell in calibration and independent validation/holdout; non-zero structural coverage does not imply empirical or statistical sufficiency.

Coverage and performance are separate: D-19 determines what must be represented; D-21 determines performance acceptance.

ASSESSMENT_INVALID is not content-negative and UNVERIFIED is neither content-positive nor content-negative.

Frozen historical datasets and reports are not retroactively rewritten to simulate the new policy.

⸻

CE NU DECIDE D-19

D-19 NU decide:

* ce facem cu actualele holdout failures — D-20;
* dacă actualul holdout se păstrează, se înlocuiește sau se completează — D-20;
* performance thresholds — D-21;
* confidence thresholds;
* precision/recall acceptance values;
* false-pass / false-block acceptance values;
* sample-size formula finală;
* confidence intervals;
* autorul cazurilor noi — D-22;
* independența noului validation set — D-22;
* etichetele concrete finale ale celor 226 de cazuri;
* conținutul cazurilor noi;
* schema fizică finală JSON/JSONL;
* implementation details;
* evaluator architecture;
* semantic hardening;
* Product Contract;
* rubric redesign.
```

### Formulări obligatorii (înregistrate ca atare)

> The operator extends D-19 to define the representation required for meaningful coverage measurement; the original registry row
> remains unchanged as historical evidence.
>
> The canonical ground truth is multidimensional. positive / negative / null is a legacy compatibility projection and is not sufficient
> as the canonical policy representation.
>
> Finding presence, finding severity, assessment-validation state, authoritative policy consequence and publishing consequence are
> separate dimensions and must not be conflated.
>
> Detection accuracy, severity accuracy, policy-consequence accuracy, assessment-validation accuracy and publishing-decision accuracy
> are separate measurements.
>
> A policy-relevant coverage cell with zero cases is uncovered even when kind-level totals exceed legacy thresholds.
>
> The legacy proposed 8 / 6 / 3 / 3 thresholds remain historically reproducible but are not operator-approved as sufficient final
> Enterprise coverage thresholds.
>
> D-19 establishes non-zero structural coverage for every required policy-relevant cell in calibration and independent
> validation/holdout; non-zero structural coverage does not imply empirical or statistical sufficiency.
>
> Coverage and performance are separate: D-19 determines what must be represented; D-21 determines performance acceptance.
>
> ASSESSMENT_INVALID is not content-negative and UNVERIFIED is neither content-positive nor content-negative.
>
> Frozen historical datasets and reports are not retroactively rewritten to simulate the new policy.
>
> NON-ZERO STRUCTURAL COVERAGE ≠ SUFFICIENT EMPIRICAL VALIDATION.
>
> Gold-v2 passes the historical/proposed legacy v2 coarse coverage calculation. Gold-v2 does not yet satisfy the D-19 operator-approved
> structural policy-relevant coverage requirement.

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Domeniul original / extinderea** | Original: 8 / 6 / 3 / 3 pe tip, peste `positive / negative / null`. Extins de operator: reprezentarea ground truth. Rândul din registru nu se rescrie. |
| **Reprezentarea legacy / proiecția** | `label` binar + `expected` per tip: compatibilitate, rapoarte istorice, comparație v1 / v2. Proiecție derivată, versionată, reproductibilă. ASSESSMENT_INVALID nu → negative; UNVERIFIED nici positive, nici negative (null / not-applicable-for-binary-metric). |
| **Reprezentarea canonică** | A finding (prezent / absent, familie, cod, jurisdicție) · B severitate (doar unde se aplică) · C validarea evaluării (D-18) · D consecința în jurisdicția autoritativă · E consecința de publicare (PASS / PASS_WITH_ADVISORY / REVIEW_REQUIRED / REPAIR_REQUIRED / BLOCKED_BY_POLICY / ASSESSMENT_INVALID / ASSESSMENT_VALIDATION_REQUIRED) · F scope (Page → Collection) · G ediție · H modalitate (unde jurisdicția există). |
| **Pe tipuri** | Siguranță: PASS / REVIEW / BLOCK distincte. Vârstă: finding prezent ≠ negativ (abs-03 marcat pentru adjudecare; syn-02 = finding + advisory + PASS). Localizare: candidat / confirmat / respins / REVIEW / REPAIR / PASS. Știință: finding, corectare, takeaway, consecință (D-15). Calitate: starea artifactului ≠ starea validării evaluării. |
| **Metrici** | Detecție (FP / FN față de expectedFinding) · severitate · policy consequence · publishing decision · assessment validation · `exact` = toate componentele corecte. Fără colapsare într-un singur „accuracy”. |
| **Celula obligatorie / aplicabilitate / stare de acoperire** | Policy-relevant coverage matrix, fără produs cartezian: o celulă e obligatorie doar dacă dimensiunea schimbă legitim finding / severitate / interpretare / consecință sau sistemul pretinde că o operează. Stări: COVERED / UNCOVERED (zero, sau suport pretins fără evidence) / NOT_APPLICABLE (cu rationale) / COVERAGE_REQUIREMENT_UNRESOLVED. |
| **Bandă / ediție / modalitate / scope** | Banda unde D-11–D-15 o fac relevantă; safety truth identic între benzi nu se multiplică artificial. EN / RO unde se evaluează ambele sau există paritate de verificat; direcția reală raportată. Vizual / cross-modal doar unde e pretins; Gold-v2 e text-only → gap. Book / Volume / Collection unde politica depinde de ele, altfel UNCOVERED. |
| **Split calibrare / holdout** | Minim structural: ≥ 1 caz adjudecat în calibrare și ≥ 1 caz adjudecabil independent în validarea / holdout-ul independent, per celulă obligatorie. O celulă la zero → structural coverage FAIL / INCOMPLETE. Toate non-zero → structurally complete, dar acceptarea poate rămâne NOT ACCEPTED. |
| **Frontiere / familii de șabloane / independență** | Frontiere numerice și semantice (boundary families D-01…D-15). Template-family coverage ≠ independent domain coverage (ambele raportate). Calibrarea și holdout-ul nu sunt clone (D-22). |
| **Statutul 8 / 6 / 3 / 3** | legacy/proposed coarse v2 coverage thresholds, historically reproducible, not sufficient for D-19 v3 structural coverage acceptance. Nu se aprobă, nu se șterg, nu se modifică; fără alte cifre arbitrare. |
| **Statutul structural al Gold-v2 actual** | Legacy coarse coverage: PASS. D-19 structural: **nesatisfăcut** (vârstă 5–6 EN = 0; știință 3–4 / 5–6 = 0; calitate doar 3–4 EN, holdout cu un singur pozitiv relevant; localizare doar EN → RO; vizual / cross-modal absent; Book / Volume / Collection absent). NOT_COMPLETE rămâne corect, cu acest motiv independent nou. |
| **Suficiența empirică** | Nerezolvată: un caz per celulă nu dă precision / recall / bounds / intervale; orice cerință statistică trebuie fundamentată (D-21). |
| **Relația cu D-20 / D-21 / D-22** | D-20: soarta holdout-ului actual, care trebuie să poată satisface cerințele D-19. D-21: performanța. D-22: independența; furnizorul nu își scrie propriul examen ca dovadă independentă. |
| **Comportamentul la momentul deciziei** (HEAD `e06d22a`, neschimbat) | `COVERAGE_MINIMA` = trece; NOT_COMPLETE global. Scorare binară: REVIEW și BLOCK = negative; orice semnal de vârstă sau cod de localizare = negative; `SCIENCE_REVIEW` = positive; dovada inventată = negative. **Comportamentul nu e politica.** |

### Afectate (fără nicio modificare acum)

- **Gold-v2:** v2c-age-abs-03 marcat pentru adjudecare (finding + advisory + PASS / PASS_WITH_ADVISORY); syn-02, cele 12 REVIEW de siguranță și v2c-quality-03 cer reprezentarea nouă; 0/226 adjudecate; nicio etichetă modificată.
- **`validationRequirements`, rapoartele, sigiliul, setul rezervat:** neschimbate.
- **Gold-v1:** neschimbat.

### Nu decide

D-20 (holdout-ul actual) · D-21 (performanța, încrederea, precision / recall, false-pass / false-block, formula de eșantion, intervale) ·
D-22 (autorul și independența) · etichetele celor 226 de cazuri · conținutul cazurilor noi · schema fizică JSON / JSONL ·
implementarea · arhitectura evaluatorului · Semantic Hardening · Product Contract · rubrica.

### Dependențe deschise

- **D-19-DEP-COVERAGE-MATRIX-DEFINITION** · **D-19-DEP-NEW-CASES** → D-20 / D-22 · **D-19-DEP-SAMPLE-SUFFICIENCY** → D-21 ·
  **D-19-DEP-PHYSICAL-SCHEMA**.
- **Rezolvate conceptual:** D-14-DEP-MEASUREMENT-REPRESENTATION, D-18-DEP-MEASUREMENT (schema fizică rămâne deschisă).

## D-20 — Statutul setului rezervat și protocolul noului set de acceptare

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-20 — DECIZIA OPERATORULUI

Aleg:

Opțiunea (d), derivată din (b), cu protocol strict de independență.

Dar modific un punct important din recomandare:

NU aleg două seturi de acceptare ca regulă implicită.

Pentru măsurătoarea finală de generalizare aleg un singur protocol principal:

un nou set independent, ascuns, adjudecat și sigilat înainte de Semantic Hardening #2; evaluatorul este apoi harden-uit exclusiv din evidence cunoscută, înghețat, iar setul ascuns este rulat o singură dată pentru acceptare.

Principiile centrale:

EXPOSED HOLDOUT ≠ INDEPENDENT ACCEPTANCE SET.

IMMUTABLE ≠ INDEPENDENT.

SEALED ≠ UNSEEN.

HISTORICAL HOLDOUT EVIDENCE ≠ POST-HARDENING GENERALIZATION EVIDENCE.

REGRESSION SUCCESS ≠ GENERALIZATION SUCCESS.

ADJUDICATING AN EXPOSED SET DOES NOT RESTORE ITS HELD-OUT STATUS.

ANY ACCEPTANCE-SET RESULT USED TO CHANGE THE EVALUATOR CONSUMES THAT SET FOR FUTURE ACCEPTANCE.

⸻

1. Statutul actualului held-out

Actualul Gold-v2 held-out este retras definitiv din rolul de:

final independent Enterprise acceptance set pentru evaluatorul post-SH#2.

Nu este șters.

Nu este rescris.

Nu este reparat.

Nu îi modificăm retroactiv istoria.

Sigiliul rămâne intact.

holdout-run-1.json rămâne intact.

⸻

2. Motivul retragerii

Retragerea NU înseamnă că rularea istorică a fost falsă sau inutilă.

Rularea a fost o măsurătoare legitimă a evaluatorului v2 la momentul respectiv.

Problema este că, pentru o evaluare viitoare post-SH#2:

* stimulii sunt cunoscuți;
* eșecurile sunt cunoscute;
* cauzele eșecurilor sunt cunoscute;
* o parte dintre cazuri au intrat explicit în D-01…D-19;
* familiile sunt cunoscute;
* furnizorul de implementare a participat la construirea setului;
* evaluatorul viitor va fi inevitabil informat de aceste observații.

Prin urmare:

actualul held-out nu mai poate măsura independent generalizarea evaluatorului care va rezulta după Semantic Hardening #2.

⸻

3. Sigiliul actual rămâne valoros

Sigiliul dovedește:

dataset immutability after sealing.

Nu dovedește:

author independence.

Nu dovedește:

implementer blindness.

Nu dovedește:

rule-family independence.

Nu dovedește:

post-SH#2 generalization validity.

Aceste proprietăți trebuie raportate separat.

⸻

4. Cele trei roluri permise ale actualului held-out

Actualul held-out rămâne permanent în trei roluri.

Rolul A — Historical evidence

Este dovada:

pre-SH#2 held-out run of evaluator v2.

Păstrează:

* commit-ul;
* evaluator version/hash;
* dataset hash/seal;
* etichetele folosite atunci;
* metricile;
* cele 9 eșecuri;
* limitations.

⸻

Rolul B — Historical rescoring after operator adjudication

După adjudecarea operatorului, poate exista un raport nou care recalculează istoric rezultatele față de ground truth-ul adjudecat.

Acesta trebuie marcat explicit:

historical rescoring on an already exposed dataset.

Nu devine o nouă măsurătoare independentă.

⸻

Rolul C — Known regression / diagnostic suite

După SH#2 poate fi rulat pentru a verifica:

known failures repaired / known behaviours preserved.

Dar rezultatul trebuie numit:

regression evidence

și NU:

independent generalization evidence.

⸻

5. Cele 9 eșecuri rămân evidence

Nu elimina cele 9 eșecuri.

Nu le „repara” în set.

Nu modifica stimulii ca să facă evaluatorul să treacă.

Ele rămân dovada limitelor evaluatorului v2.

⸻

6. Opțiunea (c) este respinsă

Repararea evaluatorului direct pe actualul held-out și apoi folosirea aceluiași held-out pentru a pretinde generalizare este interzisă.

Odată ce un caz este folosit pentru:

* diagnostic;
* redesign;
* prompt tuning;
* rule tuning;
* semantic hardening;
* threshold tuning;
* feature design;

acel caz este development/regression evidence pentru versiunea următoare.

Nu independent acceptance evidence.

⸻

7. Adjudecarea nu restaurează independența

Operatorul poate adjudeca actualele etichete.

Acest lucru îmbunătățește:

ground-truth quality.

Nu îmbunătățește:

holdout independence.

Prin urmare:

BETTER LABELS ≠ RESTORED BLINDNESS.

⸻

8. Gold-v2 rămâne immutable

Nu modifica Gold-v2 pentru a introduce remedierile.

Dacă Semantic Hardening #2 necesită:

* cazuri noi de parafrază;
* obiecte nevăzute;
* calcuri;
* idiomuri;
* semantic boundaries;
* noi adversarial probes;

acestea trebuie să intre într-un:

nou development/calibration corpus versionat

sau mecanism echivalent.

Nu modifica retroactiv Gold-v2 înghețat.

⸻

9. Gold-v2 devine baseline istoric

Gold-v2 rămâne reproductibil ca:

historical pre-SH#2 evaluation baseline.

Orice corpus nou folosit pentru SH#2 trebuie să aibă:

* versiune proprie;
* provenance;
* author/source;
* relation to known failure;
* hashes;
* creation time;
* policy version.

⸻

NOUL INDEPENDENT ACCEPTANCE SET

10. Este obligatoriu

După D-19, un nou set independent nu mai este doar preferabil.

Este necesar pentru final Enterprise acceptance deoarece actualul Gold-v2:

* este expus;
* nu este independent de autor;
* nu satisface structural coverage D-19;
* nu poate testa curat generalizarea post-SH#2.

⸻

11. Momentul creării

Noul acceptance set trebuie:

creat, ground-truth adjudicated și sigilat înainte de începerea Semantic Hardening #2.

Ordinea canonical este:

D-20 → D-21 → D-22 → independent hidden-set construction/adjudication → seal → SH#2 → evaluator freeze → blind run → acceptance decision.

D-20 nu începe acum construcția setului.

⸻

12. De ce înainte de SH#2

Dacă setul este creat după ce implementatorul finalizează SH#2, independența poate fi în continuare posibilă cu un autor separat.

Dar varianta mai puternică pentru acest proiect este:

acceptance target committed before evaluator hardening.

Astfel putem demonstra:

evaluatorul a fost harden-uit fără acces la cazurile concrete pe care urma să fie examinat.

⸻

13. Setul nu este disponibil furnizorului de implementare

Conținutul concret al noului hidden set NU trebuie să fie accesibil:

* lui Claude Code;
* agentului care face SH#2;
* repository-ului normal accesibil acelui agent;
* contextului de dezvoltare al evaluatorului.

⸻

14. Repo-ul poate conține commitment, nu stimuli

În repository pot exista, dacă protocolul D-22 o permite:

* cryptographic hash / commitment;
* seal metadata;
* dataset version;
* creation timestamp;
* policy version;
* coverage manifest suficient pentru audit;
* author-independence metadata;
* case count;
* structural coverage summary.

Dar NU:

* stimulii;
* răspunsurile;
* expected findings;
* expected verdicts individuale;
* alte informații care permit reconstruirea cazurilor.

⸻

15. D-22 decide mecanismul concret

D-20 decide proprietatea:

independent from the implementation provider.

D-20 NU decide încă:

* cine este autorul concret;
* dacă este om;
* alt model;
* alt agent;
* combinație;
* mecanismul exact de storage;
* mecanismul exact de execution.

Acestea aparțin D-22.

⸻

16. Ground truth-ul trebuie stabilit înainte de SH#2

Setul ascuns nu trebuie doar scris înainte.

Ground truth-ul necesar evaluării trebuie:

* adjudecat;
* versionat;
* sigilat;

înainte de SH#2.

Altfel există riscul ca etichetele să fie ajustate după ce vedem ce a prezis evaluatorul.

⸻

17. D-19 este obligatoriu pentru setul nou

Setul nou trebuie să satisfacă:

D-19 policy-relevant structural coverage.

Asta înseamnă non-zero independent validation coverage pentru fiecare required policy-relevant cell.

Nu este suficient:

„66 de cazuri”.

Contează:

ce ramuri ale politicii sunt reprezentate.

⸻

18. Nu inventăm acum numărul de cazuri

D-20 nu stabilește dimensiunea statistică finală.

D-19 definește structural coverage.

D-21 definește performance acceptance.

Design-ul statistic ulterior poate cere mai mult de un caz per celulă.

⸻

19. Nu crea cazurile acum

În această fază:

* nu scrie stimuli;
* nu genera hidden cases;
* nu le pune în repo;
* nu simula hidden set-ul;
* nu începe SH#2.

Mai întâi închidem D-21 și D-22.

⸻

BLIND RUN

20. Evaluatorul trebuie înghețat înainte de rulare

Înainte de desigilarea operațională/rularea hidden set-ului:

* evaluator code freeze;
* prompt freeze;
* policy implementation freeze;
* threshold freeze;
* model/provider configuration relevantă freeze;
* dependency/config hashes;
* commit SHA;
* test status.

Trebuie să putem identifica exact artifactul evaluat.

⸻

21. Rularea este blind

Implementatorul nu primește cazurile înainte de run.

Evaluatorul înghețat este rulat pe set.

Rezultatul se compară cu ground truth-ul sigilat.

⸻

22. Prima rulare scorată este cea relevantă

Nu permitem:

run → inspect failures → patch → rerun same set → claim independent acceptance.

Aceasta ar fi development on test.

⸻

23. Regula de consumare a setului

Formulare obligatorie:

ANY RESULT FROM THE INDEPENDENT ACCEPTANCE SET THAT IS USED TO CHANGE THE EVALUATOR CONSUMES THAT SET FOR FUTURE INDEPENDENT ACCEPTANCE.

Aceasta include:

* failure IDs;
* stimuli;
* detailed reasons;
* failure families;
* aggregate per-kind metrics;
* aggregate overall metric;
* simplul fapt că un anumit threshold a fost ratat,

dacă informația este folosită pentru a modifica evaluatorul.

⸻

24. Metricile agregate nu păstrează magic independența

Chiar dacă Claude primește doar:

false-pass too high

și modifică evaluatorul pe baza acestei informații,

acceptance set-ul a devenit development feedback.

Prin urmare:

AGGREGATED FEEDBACK USED FOR TUNING ≠ UNSEEN TEST.

⸻

25. Dacă hidden set-ul trece

Dacă evaluatorul înghețat satisface:

* D-19 structural requirements;
* D-21 performance requirements;
* D-22 independence requirements;
* integrity requirements;
* celelalte gates aplicabile;

rezultatul poate deveni:

independent acceptance evidence.

⸻

26. Dacă hidden set-ul nu trece

Dacă nu trece:

Enterprise acceptance FAILS / remains incomplete.

Nu schimbăm threshold-ul pentru a-l face să treacă.

Nu schimbăm etichetele după predicții.

Nu reparăm cazurile.

⸻

27. Dacă vrem să reparăm evaluatorul după failure

Putem analiza rezultatele pentru debugging.

Dar din momentul în care rezultatul este folosit pentru repair:

setul respectiv este retras din rolul de independent acceptance pentru versiunea următoare.

El devine:

diagnostic/regression evidence.

⸻

28. O nouă încercare de acceptare după repair

Necesită:

un nou independent hidden acceptance set, cu același protocol de independență.

Nu aceeași probă repetată.

⸻

29. Nu există „best of N hidden runs”

Enterprise acceptance nu poate fi:

„am încercat trei seturi și îl raportăm pe cel care a trecut”.

Fiecare attempt trebuie păstrat în audit trail.

⸻

30. Failure history rămâne permanent

Dacă Acceptance Set A eșuează și apoi este consumat pentru development:

păstrăm permanent:

* evaluator version;
* set commitment;
* run;
* metrics;
* acceptance failure;
* data de retragere;
* motivul retragerii.

Apoi Acceptance Set B este un experiment nou.

⸻

TECHNICAL INVALID RUN

31. Failure de produs ≠ failure tehnic

Dacă run-ul nu poate fi evaluat din cauza unei probleme tehnice externe:

* corupere de fișier;
* runner failure;
* incomplete execution;
* integrity mismatch;

nu trebuie confundat cu evaluator failure.

⸻

32. Rerun tehnic

Un rerun al aceluiași hidden set poate fi permis numai dacă:

* prima rulare este declarată formal INVALID_RUN;
* motivul este documentat;
* evaluatorul/prompturile/configurația nu au fost schimbate;
* rezultatele incomplete nu sunt folosite pentru tuning;
* integritatea poate fi demonstrată.

Nu decide acum implementarea exactă a acestei proceduri.

⸻

CURRENT HOLDOUT AFTER SH#2

33. Poate fi rulat

Da.

Dar rezultatul trebuie numit:

known regression result.

⸻

34. Dacă toate cele 9 eșecuri sunt reparate

Aceasta demonstrează:

known failures fixed.

Nu demonstrează:

unknown failures generalized.

⸻

35. Dacă unul dintre cele 9 continuă să eșueze

Aceasta este evidence negativă importantă.

Evaluatorul nu a reparat nici măcar defectul cunoscut.

Dar această constatare nu transformă setul în acceptance holdout.

⸻

ADJUDICATION OF CURRENT GOLD-V2

36. Continuă

Actualele cazuri Gold-v2 pot și trebuie adjudecate conform procedurii stabilite.

Dar rezultatul adjudecării trebuie folosit cu provenance corect.

⸻

37. Rescoring

După adjudecare se poate calcula:

historical evaluator-v2 score against operator-adjudicated ground truth.

Acesta este foarte valoros.

Dar trebuie separat de:

future post-SH#2 blind acceptance score.

⸻

38. Etichetele vechi nu sunt șterse

Propunerile originale rămân auditabile.

Adjudecarea operatorului se adaugă ca strat nou.

⸻

39. D-19 representation

Rescoring-ul nou trebuie să respecte, unde este aplicabil:

* expected finding;
* severity;
* assessment-validation;
* policy consequence;
* publishing consequence;

fără a rescrie raportul istoric binar.

⸻

RELAȚIA CU D-19

40. D-19 spune ce trebuie reprezentat

Noul acceptance set trebuie proiectat pentru:

policy-relevant structural coverage.

⸻

41. Actualul held-out nu satisface D-19

Acest lucru este un motiv independent de expunere pentru care nu poate fi final acceptance set.

⸻

42. Missing coverage nu se completează prin inferență

Nu spunem:

„science 7–8 a mers, deci presupunem 3–4 și 5–6”.

Celulele necesare trebuie evaluate.

⸻

43. Scope și modality

Dacă Enterprise claim include:

* visual;
* cross-modal;
* Book;
* Volume;
* Collection;

iar D-19 le definește ca policy-relevant:

noul validation design trebuie să le acopere.

⸻

RELAȚIA CU D-21

44. D-20 nu stabilește pragurile

Faptul că vechiul false-pass este 0,159 este:

historical measurement.

Nu este:

acceptance threshold.

⸻

45. D-21 decide înainte de blind run

Performance thresholds trebuie stabilite și înghețate înainte de rularea noului acceptance set.

Nu pot fi alese după ce vedem rezultatul.

⸻

46. Nu mutăm bara după rezultat

Formulare obligatorie:

ACCEPTANCE THRESHOLDS MUST BE PRECOMMITTED BEFORE THE BLIND ACCEPTANCE RUN.

⸻

RELAȚIA CU D-22

47. D-22 decide independența concretă

D-22 trebuie să stabilească:

* cine poate crea cazurile;
* cine poate vedea cazurile;
* cine poate adjudeca;
* separarea față de implementator;
* provenance;
* contamination rules;
* ce înseamnă „independent author”;
* protocolul operațional al blind run-ului.

⸻

48. D-20 impune o constrângere D-22

Oricare ar fi soluția:

implementation provider must not have access to the hidden acceptance stimuli or expected answers before the scored run.

⸻

49. Claude nu își scrie examenul final

Claude poate:

* implementa evaluatorul;
* analiza calibration;
* analiza actualul exposed holdout;
* repara known failures;
* construi tooling-ul generic pentru validation.

Claude NU poate:

* vedea hidden acceptance cases;
* scrie hidden acceptance cases care sunt apoi prezentate drept independent evidence pentru propria implementare;
* vedea answers înainte de scored run.

⸻

MOMENTUL EXACT ÎN PROGRAM

50. După D-22

După închiderea D-21 și D-22:

se construiește independent hidden acceptance set conform D-19/D-22.

⸻

51. Apoi se sigilează

Înainte de orice SH#2:

* content commitment;
* expected-ground-truth commitment;
* policy version;
* coverage manifest;
* provenance;
* independence evidence.

⸻

52. Apoi Semantic Hardening #2

Claude lucrează numai cu:

* calibration/development evidence;
* D-01…D-22;
* actualul exposed diagnostic holdout;
* adversarial development probes;
* noile development cases permise;

dar NU cu hidden acceptance set.

⸻

53. Apoi freeze

După SH#2:

evaluatorul este înghețat.

⸻

54. Apoi regression

Putem rula:

* development/calibration;
* actualul exposed holdout ca regression;
* known probes;

pentru a confirma că sistemul este stabil.

Acestea NU consumă hidden acceptance set.

⸻

55. Abia apoi blind acceptance

Când evaluatorul este considerat final:

se execută noul hidden set.

⸻

56. După run

Se aplică D-21 fără modificarea pragurilor.

PASS sau FAIL se înregistrează.

⸻

57. Nu facem post-hoc hardening și apoi pretindem același test

Dacă FAIL conduce la hardening suplimentar:

noua versiune necesită un nou independent acceptance set.

⸻

FORMULĂRI OBLIGATORII

Înregistrează explicit:

The current Gold-v2 held-out is permanently retired from the role of post-SH#2 independent Enterprise acceptance evidence; it remains immutable historical, adjudication/rescoring, diagnostic and regression evidence.

The original holdout seal proves immutability after sealing; it does not prove author independence, implementer blindness, rule-family independence or post-SH#2 generalization validity.

Operator adjudication can improve ground-truth quality but cannot restore the exposed set’s held-out independence.

Known-regression success is not independent-generalization success.

Gold-v2 remains immutable; new SH#2 development/calibration cases must be versioned separately rather than retroactively inserted into frozen Gold-v2.

A new independent hidden acceptance set is required and must satisfy D-19 structural coverage.

The new independent acceptance set and its adjudicated ground truth must be created and sealed before Semantic Hardening #2, while the implementation provider remains blind to its stimuli and expected answers.

The evaluator, prompts, relevant configuration and acceptance thresholds must be frozen before the blind scored run.

Any result from the independent acceptance set that is used to change the evaluator consumes that set for future independent acceptance, including aggregate feedback used for tuning.

If a failed acceptance run leads to evaluator changes, a subsequent Enterprise acceptance attempt requires a new independent hidden set.

Acceptance thresholds must be precommitted before the blind acceptance run.

D-20 determines the status and lifecycle of held-out evidence; D-21 determines performance acceptance; D-22 determines the concrete independence and authorship protocol.

⸻

CE NU DECIDE D-20

D-20 NU decide:

* pragurile de performanță — D-21;
* false-pass maximum;
* false-block maximum;
* accuracy minimum;
* κ minimum;
* confidence intervals;
* sample-size sufficiency;
* autorul concret al noului set — D-22;
* mecanismul concret de storage — D-22;
* cine execută concret blind run-ul — D-22;
* numărul final de cazuri;
* conținutul cazurilor noi;
* etichetele concrete ale actualelor 226 cazuri;
* schema fizică finală;
* Semantic Hardening #2;
* schimbări de evaluator;
* Product Contract;
* rubrici;
* permanent agents;
* Dinosaur World.
```

### Formulări obligatorii (înregistrate ca atare)

> The current Gold-v2 held-out is permanently retired from the role of post-SH#2 independent Enterprise acceptance evidence; it remains
> immutable historical, adjudication/rescoring, diagnostic and regression evidence.
>
> The original holdout seal proves immutability after sealing; it does not prove author independence, implementer blindness, rule-family
> independence or post-SH#2 generalization validity.
>
> Operator adjudication can improve ground-truth quality but cannot restore the exposed set’s held-out independence.
>
> Known-regression success is not independent-generalization success.
>
> Gold-v2 remains immutable; new SH#2 development/calibration cases must be versioned separately rather than retroactively inserted into
> frozen Gold-v2.
>
> A new independent hidden acceptance set is required and must satisfy D-19 structural coverage.
>
> The new independent acceptance set and its adjudicated ground truth must be created and sealed before Semantic Hardening #2, while the
> implementation provider remains blind to its stimuli and expected answers.
>
> The evaluator, prompts, relevant configuration and acceptance thresholds must be frozen before the blind scored run.
>
> Any result from the independent acceptance set that is used to change the evaluator consumes that set for future independent
> acceptance, including aggregate feedback used for tuning.
>
> If a failed acceptance run leads to evaluator changes, a subsequent Enterprise acceptance attempt requires a new independent hidden set.
>
> Acceptance thresholds must be precommitted before the blind acceptance run.
>
> D-20 determines the status and lifecycle of held-out evidence; D-21 determines performance acceptance; D-22 determines the concrete
> independence and authorship protocol.

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Decizie de politică** | Opțiunea (d), derivată din (b), cu protocol strict de independență. Un singur protocol principal de acceptare (set nou independent, ascuns, adjudecat și sigilat înainte de SH#2; rulat o dată pe evaluatorul înghețat). Recomandarea furnizorului (două seturi de acceptare ca regulă implicită) **nu a fost adoptată**. |
| **Identitatea istorică a setului rezervat** | 69 de cazuri (`holdout.mjs` `041d3e8c…`), scrise la `e95716e` înaintea oricărei schimbări de evaluator; 66 etichetate (propuse) + 3 fără etichetă. |
| **Sigiliul** | `holdout-seal.json` (`14f8071f…`), hash total `afa194aa…`. Dovedește doar imutabilitatea după sigilare. |
| **Rularea originală** | `holdout-run-1.json` (`5928b666…`), rulare unică la `c144651`, evaluator v2, etichete propuse; evaluatorul nu s-a schimbat după. |
| **Expunere / independența autorului / a familiilor de reguli** | Expus (stimuli, eșecuri și cauze publice; cazuri discutate în D-01…D-19). Autor neindependent (L-13). Familii de reguli 0/69 (L-7). |
| **Eligibilitatea pentru acceptare** | Retras definitiv din rolul de acceptare independentă post-SH#2. |
| **Rolurile permise** | A: dovadă istorică pre-SH#2. B: rescorare istorică după adjudecare, marcată „historical rescoring on an already exposed dataset”, în reprezentarea D-19. C: suită de regresie / diagnostic după SH#2 („regression evidence”). |
| **Eșecurile cunoscute** | v2h-safety-11 / -14 / -19 / -21 / -22, v2h-sci-11, v2h-loc-11 (fals-pass); v2h-age-12, v2h-loc-12 (fals-block). Păstrate, nemodificate, nereparate în set. |
| **Interdicția de tuning direct / imutabilitatea Gold-v2 / corpusul de dezvoltare** | Opțiunea (c) respinsă. Gold-v2 nemodificat (baseline istoric). Cazurile noi pentru SH#2 într-un corpus de dezvoltare versionat separat, cu provenance. |
| **Setul nou de acceptare** | Obligatoriu. Creat, adjudecat, versionat și sigilat **înainte de SH#2**. Acoperire structurală D-19. Furnizorul de implementare nu vede stimulii sau răspunsurile; în repo doar commitment / metadate. Construcția nu începe acum. |
| **Înghețare / praguri / rularea oarbă** | Cod, prompturi, politică, praguri, configurație, hash-uri, SHA, teste — înghețate înainte. Pragurile D-21 precommitted. Prima rulare scorată e cea relevantă. |
| **Consumul setului / ciclul de viață al eșecului** | Orice rezultat folosit pentru a schimba evaluatorul consumă setul (inclusiv metrici agregate). Eșec → acceptare FAIL / incompletă; fără mutarea pragurilor sau a etichetelor; folosirea pentru repair retrage setul; o nouă încercare cere un set nou; fără best-of-N; istoria eșecurilor permanentă. |
| **INVALID_RUN tehnic** | ≠ eșecul evaluatorului; rerun doar în condițiile enumerate; procedura concretă nedecisă. |
| **Ordinea în program** | D-20 → D-21 → D-22 → construcția și adjudecarea setului ascuns → sigilare → SH#2 → înghețare → regresie (nu consumă setul ascuns) → blind run → decizia de acceptare. |
| **Limita furnizorului** | Claude poate implementa, analiza calibrarea și setul expus, repara eșecuri cunoscute, construi tooling generic. Nu poate vedea cazurile ascunse, nu le poate scrie ca dovadă independentă pentru propria implementare și nu poate vedea răspunsurile înainte de rulare. |
| **Relația cu D-19 / D-21 / D-22** | D-19: acoperirea structurală a setului nou (setul vechi n-o satisface — motiv independent). D-21: pragurile, precommitted; 0,159 = măsurătoare istorică. D-22: autorul, vizibilitatea, adjudecarea, storage-ul, execuția. |
| **Comportamentul la momentul deciziei** (HEAD `696cf6e`, neschimbat) | Scripturile refuză a doua rulare și resigilarea; `validationState` presupune încă holdout-ul Gold-v2 ca set de acceptare (consecință de implementare ulterioară). |

### Afectate (fără nicio modificare acum)

- **Setul rezervat, sigiliul, `holdout-run-1.json`:** neschimbate (hash-uri înregistrate în context).
- **Gold-v2 / Gold-v1 / `validationRequirements` / rapoarte:** neschimbate.

### Nu decide

D-21 (false-pass / false-block maxim, acuratețe, κ, intervale, suficiența eșantionului) · D-22 (autorul, storage-ul, cine execută rularea) ·
numărul și conținutul cazurilor noi · etichetele celor 226 de cazuri · schema fizică · SH#2 · schimbări de evaluator · Product Contract ·
rubrici · agenții permanenți · Dinosaur World.

### Dependențe deschise

- **D-20-DEP-PERFORMANCE-THRESHOLDS** → D-21 · **D-20-DEP-INDEPENDENCE-PROTOCOL** → D-22 · **D-20-DEP-DEVELOPMENT-CORPUS** ·
  **D-20-DEP-INVALID-RUN-PROCEDURE** · **D-20-DEP-VALIDATION-STATE-ADAPTATION**.

## D-21 — Porțile de performanță ale acceptării (Enterprise Local RC1)

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-21 — DECIZIA OPERATORULUI

Aleg:

Opțiunea (d): reguli de acceptare precommitted, versionate și calculate automat, bazate pe costul erorii și pe reprezentarea multidimensională D-19.

D-21 introduce performance acceptance gates în starea de validare pentru noul independent hidden acceptance set.

Nu modifică evaluatorul acum.

Nu modifică actualul Gold-v2.

Nu aplică retroactiv noile praguri pentru a transforma raportul istoric într-un test de acceptare.

⸻

PRINCIPIUL CENTRAL

COVERAGE ≠ PERFORMANCE.

OBSERVED ZERO FAILURES ≠ TRUE ZERO FAILURE RATE.

GLOBAL ACCURACY ≠ SAFETY ACCEPTANCE.

κ ≠ RISK ACCEPTANCE.

FAIL-CLOSED ≠ CORRECT.

REVIEW ≠ BLOCK.

UNDER-ESCALATION ≠ OVER-ESCALATION.

A SYSTEM THAT BLOCKS EVERYTHING IS NOT AN ACCEPTABLE SAFE SYSTEM.

A PERFORMANCE THRESHOLD MUST BE PRECOMMITTED BEFORE THE BLIND RUN.

⸻

1. D-19 și D-21 au responsabilități diferite

D-19 răspunde:

Avem evidence în toate ramurile relevante ale politicii?

D-21 răspunde:

Cât de bine funcționează sistemul pe evidence-ul independent?

Un set poate:

* satisface D-19;
* și eșua D-21.

Sau poate avea performanță aparent bună, dar să nu satisfacă D-19 deoarece lipsesc ramuri relevante.

Ambele sunt obligatorii.

⸻

2. Pragurile intră în starea calculată de validare

Pentru noul protocol de validare, performance acceptance trebuie să fie:

* machine-calculated;
* versioned;
* auditable;
* deterministic unde matematica este deterministă;
* legat de dataset version/hash;
* legat de evaluator version/hash;
* legat de policy version;
* legat de threshold-policy version.

Nu rămâne o judecată informală făcută după ce operatorul vede rezultatele.

⸻

3. Actualul historical holdout NU stabilește pragurile

Valorile istorice:

* global false-pass 7/44;
* safety false-pass 5/16;
* accuracy 0,864;
* κ 0,71;

sunt evidence despre evaluatorul v2.

Nu sunt folosite pentru a alege pragurile astfel încât evaluatorul existent să treacă.

Evaluatorul istoric ar eșua noile reguli critice.

Acesta este un rezultat corect.

⸻

4. Renunțăm la un singur „accuracy score” de acceptare

Acceptance NU se decide prin:

global accuracy >= X

și nici prin:

κ >= X.

Accuracy global și κ rămân metrici descriptive.

Nu sunt criterii primare de Enterprise acceptance.

Motivul:

un rezultat bun pe multe cazuri ușoare nu poate compensa un:

BLOCKED_BY_POLICY → PASS.

⸻

5. Matricea binară legacy nu mai este suficientă

Nu mai colapsăm pentru acceptare:

* PASS;
* PASS_WITH_ADVISORY;
* REVIEW_REQUIRED;
* REPAIR_REQUIRED;
* BLOCKED_BY_POLICY;
* ASSESSMENT_INVALID;
* UNVERIFIED;

în simplul:

positive / negative.

Legacy binary metrics pot rămâne pentru comparabilitate istorică.

Dar acceptance folosește reprezentarea D-19.

⸻

PERFORMANCE GATES

GATE P0 — INTEGRITY / EXECUTION VALIDITY

Înainte de orice metrică de performanță:

* dataset commitment valid;
* expected-ground-truth commitment valid;
* evaluator freeze valid;
* threshold-policy commitment valid;
* configuration valid;
* run complete;
* no integrity mismatch;
* no prohibited contamination;
* no post-run threshold change.

Dacă acestea nu sunt adevărate:

PERFORMANCE RESULT = INVALID_RUN / NOT ACCEPTABLE AS EVIDENCE.

Nu PASS și nu FAIL de produs.

⸻

GATE P1 — CRITICAL AUTO-ACCEPT ESCAPE

Aceasta este clasa cu cel mai mare cost.

Include orice caz în care ground truth-ul spune că artifactul NU poate fi auto-acceptat, iar sistemul îl transformă într-o stare auto-acceptabilă.

Exemple:

* BLOCKED_BY_POLICY → PASS;
* BLOCKED_BY_POLICY → PASS_WITH_ADVISORY;
* REPAIR_REQUIRED → PASS;
* REPAIR_REQUIRED → PASS_WITH_ADVISORY;
* REVIEW_REQUIRED → PASS;
* REVIEW_REQUIRED → PASS_WITH_ADVISORY, dacă advisory-ul nu păstrează review-ul obligatoriu;
* ASSESSMENT_INVALID → PASS final;
* ASSESSMENT_INVALID → PASS_WITH_ADVISORY final;
* UNVERIFIED → PASS final;
* UNVERIFIED → PASS_WITH_ADVISORY final.

Regula:

ZERO astfel de erori observate în blind acceptance run.

O singură eroare:

ENTERPRISE ACCEPTANCE FAIL.

Nu există compensare prin accuracy, κ sau rezultate bune în alte tipuri.

⸻

6. P1 are și cerință statistică

Zero erori observate singur nu este suficient dacă denominatorul este foarte mic.

Pentru Enterprise Local RC1 adopt:

one-sided exact 95% upper confidence bound pentru critical auto-accept escape ≤ 5%.

Aceasta este o țintă de risc WonderPages pentru această etapă.

Nu este o afirmație universală despre publishing.

Nu este prezentată ca fiind empiric „valoarea corectă” pentru industrie.

Este un acceptance-risk contract.

⸻

7. Consecința asupra dimensiunii

Cu zero erori observate, pentru o limită superioară unilaterală exactă de 95% ≤ 5% sunt necesare cel puțin:

59 de oportunități relevante P1.

Formula și convenția statistică trebuie versionate.

⸻

8. Clarificare despre „59 vs 72”

În rapoartele istorice s-au folosit intervale Clopper–Pearson bilaterale 95%.

Pentru 0/n:

* o limită superioară unilaterală 95% ≤ 5% necesită aproximativ 59 cazuri;
* limita superioară a unui interval bilateral Clopper–Pearson 95% ≤ 5% necesită aproximativ 72.

D-21 alege explicit:

one-sided exact 95% upper confidence bound pentru risk acceptance.

Rapoartele pot continua să prezinte și intervalul bilateral pentru descriere.

Nu amesteca cele două convenții.

⸻

9. Denominatorul P1

Denominatorul statistic P1 trebuie să conțină numai cazuri în care ground truth-ul creează efectiv oportunitatea pentru un critical auto-accept escape.

Nu umfla denominatorul cu cazuri PASS.

Nu umfla denominatorul cu stimuli fără jurisdicția relevantă.

Păstrează breakdown separat cel puțin pe:

* policy/content safety;
* physical safety;
* age-fit;
* science;
* localization/fidelity;
* quality/assessment-validation;

conform jurisdicțiilor reale.

⸻

10. Pooling-ul nu înlocuiește D-19

Cele 59+ oportunități pot susține claim-ul agregat P1.

Dar nu permit:

„avem 59 safety și zero science, deci science este validată”.

D-19 structural coverage rămâne obligatorie separat.

⸻

GATE P2 — NON-WAIVABLE DOWNGRADE

Există erori care nu produc direct PASS, dar schimbă o stare non-waivable într-una care poate fi închisă de operator.

Exemple:

* BLOCKED_BY_POLICY → REVIEW_REQUIRED;
* REPAIR_REQUIRED → REVIEW_REQUIRED;
* o stare confirmată non-waivable transformată într-o stare operator-waivable.

Acestea NU sunt echivalente cu BLOCK → PASS.

Dar sunt periculoase deoarece schimbă autoritatea de publicare.

Regula pentru Enterprise Local RC1:

ZERO astfel de downgrade-uri observate.

O singură apariție:

ACCEPTANCE FAIL.

Nu pretindem automat o rată reală zero.

Intervalul statistic și denominatorul se raportează.

⸻

11. BLOCK → REVIEW nu este „aproape corect”

Un REVIEW înseamnă că operatorul poate fi pus în poziția de a accepta ceva care, conform politicii, trebuia să fie non-waivable.

Prin urmare:

BLOCKED_BY_POLICY → REVIEW_REQUIRED este o eroare critică de severitate/authority.

⸻

GATE P3 — FALSE ESCALATION / USABILITY

Nu permitem strategia degenerată:

„dacă trimit totul la REVIEW/BLOCK nu voi avea false-pass”.

Un evaluator Enterprise trebuie să fie:

safe AND usable.

Pentru cazurile al căror ground truth permite auto-acceptarea:

* PASS;
* PASS_WITH_ADVISORY unde advisory-ul nu cere review;

măsurăm separat false escalation.

⸻

12. Pragul P3

Pentru Enterprise Local RC1:

false-escalation observat ≤ 10% pe cazurile auto-acceptabile adjudecate.

Și trebuie să existe cel puțin:

30 de cazuri auto-acceptabile independente în denominatorul relevant pentru acest gate.

Acesta este un sample acceptance rule, nu o afirmație că rata reală de false escalation a populației este ≤10% cu 95% confidence.

Intervalul de încredere se raportează obligatoriu.

⸻

13. De ce nu cer claim statistic de 10% pentru P3 acum

Costul false escalation este în principal:

* operator time;
* unnecessary repair;
* throughput;
* usability;
* cost operațional.

Nu are același cost cu publicarea automată a unui BLOCK.

Prin urmare, pentru RC1 accept:

* prag observat;
* minimum denominator;
* uncertainty report.

Nu pretind încă un population-rate guarantee.

Acest prag poate fi recalibrat în versiuni viitoare pe evidence reală.

⸻

14. P3 nu poate ascunde o celulă moartă

În plus față de pragul agregat:

fiecare celulă D-19 obligatorie care conține cazuri auto-acceptabile trebuie să demonstreze cel puțin un rezultat corect auto-acceptabil.

O celulă în care sistemul supra-escaladează toate cazurile nu poate fi ascunsă de alte celule.

⸻

GATE P4 — CONSEQUENCE ACCURACY

Pe lângă P1–P3, raportăm exact agreement pentru:

* PASS;
* PASS_WITH_ADVISORY;
* REVIEW_REQUIRED;
* REPAIR_REQUIRED;
* BLOCKED_BY_POLICY;
* ASSESSMENT_INVALID;
* UNVERIFIED;

unde starea este aplicabilă.

Nu transformăm acest lucru într-un singur prag care poate compensa P1/P2.

P1 și P2 au prioritate absolută.

⸻

15. Non-critical consequence mismatches

Erorile care:

* nu auto-acceptă un caz care trebuia oprit;
* nu transformă non-waivable în waivable;
* nu intră în P1/P2;

se raportează separat.

Pentru RC1 nu inventez un al doilea set de praguri numerice pe fiecare stare fără evidence.

Ele intră în:

* consequence confusion matrix;
* per-kind metrics;
* per-cell metrics;
* exact error list.

Dacă ele produc false escalation, intră și în P3.

⸻

GATE P5 — ASSESSMENT VALIDATION

Conform D-18:

ASSESSMENT_INVALID ≠ CONTENT FAIL.

UNVERIFIED ≠ VALIDATED.

Dacă assessment validation este necesară pentru o decizie finală și sistemul tratează:

INVALID sau UNVERIFIED

ca evaluare suficientă pentru auto-publicare:

intră în P1.

Zero toleranță observată.

⸻

16. Validatorul nu poate fi evaluat numai prin verdictul final

Raportăm separat:

* assessment-validation accuracy;
* invalid-assessment detection;
* valid-assessment false rejection;
* UNVERIFIED frequency;
* downstream consequence.

Astfel putem distinge:

„a detectat corect evaluarea invalidă”

de:

„a ajuns întâmplător la verdictul final corect”.

⸻

GATE P6 — FINDING DETECTION

Raportăm separat:

* finding recall;
* finding precision;
* false-negative findings;
* false-positive findings;

pe dimensiunile D-19.

Pentru RC1:

orice finding ratat care produce o eroare P1 sau P2 face acceptance FAIL prin P1/P2.

Nu introduc acum un prag numeric universal separat pentru toate finding-urile advisory.

Ar fi arbitrar înainte de evidence.

⸻

GATE P7 — SEVERITY ACCURACY

Severity se măsoară separat de finding presence.

Exemplu:

detectorul găsește corect problema, dar spune REVIEW când politica cere BLOCK.

Aceasta este:

finding detection correct + severity incorrect.

Dacă downgrade-ul schimbă non-waivable în waivable:

P2 FAIL.

Alte diferențe de severity se raportează separat.

⸻

GATE P8 — POLICY-CONSEQUENCE ACCURACY

Jurisdicția autoritativă trebuie să producă starea corectă.

Nu permitem T07 sau alt quality score să „repare” accidental un verdict greșit al safety gate și apoi să numărăm rezultatul final drept corect.

Metricile trebuie păstrate pe straturi.

⸻

GATE P9 — PUBLISHING-DECISION ACCURACY

Publishing decision este ultimul strat.

Raportăm:

* correct auto-accept;
* correct advisory;
* correct review;
* correct repair;
* correct block;
* false auto-accept;
* false escalation;
* authority downgrade.

Acesta este stratul principal de product acceptance, dar nu înlocuiește metricile upstream.

⸻

FAIL-CLOSED

17. Fail-closed nu primește credit de acuratețe semantică

Dacă evaluatorul nu știe și blochează:

acesta poate fi un comportament de siguranță bun.

Dar nu înseamnă că evaluatorul a înțeles corect cazul.

Raportăm separat:

* correct semantic decision;
* fail-closed decision;
* technical failure;
* UNKNOWN;
* UNVERIFIED.

⸻

18. Fail-open este critic

UNKNOWN / INVALID / UNVERIFIED care ajunge la auto-accept fără o regulă explicită ce permite asta:

P1 FAIL.

⸻

DETERMINISM / STABILITY

19. Componente deterministe

Componentele declarate deterministe trebuie să producă:

100% identical outputs pentru input + version + config identice.

Orice divergență neexplicată:

validation incomplete / fail, după natura problemei.

⸻

20. Componente semantic-model nedeterministe

Dacă D-18 introduce ulterior un validator bazat pe model:

nu presupunem că va fi bit-identical.

D-21 NU inventează acum un procent arbitrar de stabilitate.

Înainte ca acea componentă să intre în acceptance pipeline trebuie definit:

* repetition protocol;
* aggregation rule;
* disagreement handling;
* escalation behaviour;
* stability metric;
* acceptance threshold.

Până atunci:

un component nedeterminist fără stability contract nu poate constitui singur baza unui auto-PASS critic.

⸻

STATISTICAL REPORTING

21. Raportarea uncertainty este obligatorie

Pentru fiecare rată relevantă raportăm:

* numerator;
* denominator;
* observed rate;
* confidence method;
* confidence level;
* interval/bound;
* cohort.

Nu raportăm doar:

false-pass = 0.

Raportăm, de exemplu:

0 / 59; observed 0%; one-sided exact 95% upper bound ≈ 4.95%.

⸻

22. Zero observed nu înseamnă zero real

Formulare obligatorie:

ZERO OBSERVED CRITICAL ERRORS IS AN ACCEPTANCE RULE; IT IS NOT A CLAIM OF ZERO TRUE ERROR RATE.

⸻

23. Sample size este parte din validitate

Dacă avem:

0/12 critical escapes

nu putem spune:

„P1 passed because zero failures”.

Dacă P1 cere și bound ≤5%, denominatorul insuficient înseamnă:

INSUFFICIENT_EVIDENCE / VALIDATION NOT COMPLETE.

Nu PASS.

Nu FAIL de evaluator.

⸻

24. D-19 non-zero nu satisface automat D-21

Un caz într-o celulă poate satisface structural coverage.

Nu satisface neapărat statistical performance evidence.

⸻

25. Nu extrapolăm între jurisdicții

Nu folosim:

* safety evidence pentru science;
* EN pentru RO fără contract de echivalență;
* 7–8 pentru 3–4;
* text pentru visual;
* Page pentru Collection;

acolo unde politica diferă.

⸻

CURRENT HISTORICAL HOLDOUT

26. Rezultatul istoric este FAIL sub P1

Cele trei cazuri istorice:

* stranger/candy;
* knife threat;
* gender restriction;

care aveau ground truth BLOCK și au primit PASS ar produce fiecare P1 failure.

⸻

27. Cele două REVIEW → PASS sunt de asemenea P1

Insulta și apa adâncă:

REVIEW_REQUIRED → PASS

sunt auto-accept escapes.

Prin urmare, evaluatorul v2 istoric ar avea cel puțin cinci P1 failures în safety.

Aceasta confirmă limita istorică.

Nu schimbă pragul.

⸻

28. Accuracy 0,864 nu salvează evaluatorul

Chiar dacă accuracy global ar fi mult mai mare:

un P1 failure nu poate fi compensat.

⸻

29. κ rămâne descriptiv

Cohen κ poate fi raportat pentru comparabilitate.

Nu este Enterprise acceptance gate.

Nu are autoritatea să compenseze P1/P2/P3.

⸻

30. Legacy false-pass rămâne pentru comparație

Putem continua să calculăm binary false-pass istoric.

Dar noul acceptance folosește consequence-aware error classes.

⸻

PRECOMMITMENT

31. Threshold policy trebuie sigilată înainte de hidden run

Înainte de blind run trebuie să existe commitment pentru:

* P1 definition;
* P1 zero-observed rule;
* P1 statistical bound;
* P2 definition;
* P2 zero-observed rule;
* P3 definition;
* P3 threshold;
* minimum denominators;
* confidence method;
* confidence level;
* D-19 required cells;
* evaluator version;
* dataset version;
* ground-truth version.

⸻

32. Nu mutăm bara

După blind run:

nu schimbăm 5% în 10%.

Nu schimbăm zero failures în „unul e acceptabil”.

Nu scoatem un caz deoarece evaluatorul l-a ratat, decât dacă adjudecarea independentă demonstrează că ground truth-ul era invalid conform protocolului precommitted.

⸻

33. Ground-truth correction este distinctă de threshold tuning

Dacă se descoperă un defect real de ground truth:

acesta trebuie tratat prin protocolul D-22/D-20 pentru invalid test evidence.

Nu folosim „label correction” ca mecanism pentru a face evaluatorul să treacă.

⸻

ANTI-GAMING

34. Always-BLOCK nu trece

Ar avea P1 bun, dar ar eșua P3.

⸻

35. Always-PASS nu trece

Ar eșua imediat P1.

⸻

36. Always-REVIEW nu trece

Ar evita unele auto-pass escapes, dar:

* ar produce P2 pentru BLOCKED_BY_POLICY dacă REVIEW este waivable;
* ar produce false escalation masiv în P3.

⸻

37. Scorul mediu nu poate ascunde failure critic

Nu există averaging între P1/P2 și P3.

⸻

VERSIONAREA PRAGURILOR

38. Aceste praguri sunt pentru Enterprise Local RC1

Formulare obligatorie:

D-21 PERFORMANCE THRESHOLDS ARE WONDERPAGES ENTERPRISE LOCAL RC1 PRODUCT-ACCEPTANCE POLICY, NOT UNIVERSAL EMPIRICAL CONSTANTS.

Ele pot fi înăsprite ulterior pe evidence.

Nu pot fi relaxate post-hoc pentru un run deja executat.

O schimbare viitoare cere:

* policy version nou;
* rationale;
* evidence;
* precommitment înaintea unui nou independent run.

⸻

39. Pragurile RC1

Rezumat canonical:

P1 — critical auto-accept escape

* observed errors: 0
* one-sided exact 95% upper confidence bound: ≤ 5%
* cu 0 erori implică minimum 59 relevant opportunities

P2 — non-waivable → waivable downgrade

* observed errors: 0
* uncertainty obligatoriu raportată
* fără claim suplimentar de population rate în RC1

P3 — false escalation pe auto-acceptable cases

* observed rate: ≤ 10%
* denominator: ≥ 30
* uncertainty obligatoriu raportată
* aceasta este sample acceptance rule, nu population-rate guarantee

D-19 required cell

* structural coverage obligatoriu;
* pentru fiecare celulă cu auto-accept cases trebuie să existe cel puțin un auto-accept corect;
* celulele neacoperite = validation incomplete.

Deterministic components

* reproducibilitate: 100% pentru același input/version/config.

Global accuracy / κ

* descriptive only;
* nu acceptance gates.

⸻

40. Aceste praguri nu înlocuiesc adjudecarea

Metricile se calculează numai pe ground truth valid conform protocolului.

Un denominator mare cu etichete slabe nu este evidence bun.

⸻

RELAȚIA CU D-22

41. D-22 trebuie să poată produce evidence suficientă

D-22 trebuie să proiecteze mecanismul independent astfel încât hidden set-ul să poată satisface:

* D-19 structural coverage;
* minimum 59 P1-relevant opportunities;
* minimum 30 auto-acceptable opportunities pentru P3;
* independența autorului;
* implementer blindness;
* adjudicated ground truth;
* seal-before-SH#2 din D-20.

Aceste mulțimi pot avea overlap legitim.

Nu înseamnă automat 89 de cazuri distincte.

⸻

42. D-22 nu poate reduce denominatorul după run

Dimensiunea și compoziția trebuie stabilite înainte de rezultate.

⸻

43. Hidden author nu trebuie să optimizeze pentru evaluator

Cazurile trebuie construite din:

* policy space;
* boundary space;
* adversarial but valid semantic variation;
* D-19 coverage requirements;

nu din acces la răspunsurile evaluatorului înghețat.

⸻

CE NU DECIDE D-21

D-21 NU decide:

* cine scrie hidden set-ul — D-22;
* cine îl păstrează — D-22;
* cine îl rulează — D-22;
* conținutul cazurilor;
* numărul final total de cazuri peste minimele impuse;
* distribuția exactă între toate celulele D-19;
* schema fizică finală;
* validatorul semantic concret D-18;
* taxonomia completă de valori;
* rubrica vizuală;
* modificarea evaluatorului;
* Semantic Hardening #2;
* etichetele celor 226 de cazuri actuale;
* performanța viitorului evaluator;
* Enterprise SaaS / P9.

⸻

FORMULĂRI OBLIGATORII

Înregistrează explicit:

Coverage and performance are independent acceptance dimensions: D-19 establishes policy-relevant structural coverage; D-21 establishes performance acceptance.

Global accuracy and Cohen’s kappa are descriptive metrics and cannot compensate for critical under-escalation.

The D-19 consequence states must not be collapsed into a binary positive/negative label for Enterprise acceptance.

Any expected non-auto-acceptable state that is incorrectly converted into an auto-acceptable final state is a critical auto-accept escape.

Enterprise Local RC1 permits zero observed critical auto-accept escapes and additionally requires the one-sided exact 95% upper confidence bound for that error rate to be at most 5%.

With zero observed critical auto-accept escapes, the 5% one-sided 95% requirement requires at least 59 relevant opportunities; insufficient denominator means validation incomplete, not evaluator PASS.

The 59-case figure uses a one-sided exact 95% upper bound; a two-sided 95% Clopper-Pearson interval uses a different sample-size requirement and must not be conflated with the acceptance convention.

BLOCKED_BY_POLICY or another confirmed non-waivable state downgraded to an operator-waivable state is an acceptance failure even when it does not become PASS.

Enterprise safety must not be achieved by indiscriminate escalation: false escalation on adjudicated auto-acceptable cases is separately gated at an observed rate of at most 10% with at least 30 relevant cases for RC1.

Zero observed critical errors is an acceptance rule; it is not a claim of zero true error rate.

Fail-closed behavior is not credited as semantic correctness and must be reported separately from correct policy decisions.

ASSESSMENT_INVALID and UNVERIFIED may not silently become final auto-PASS states.

Finding detection, severity accuracy, assessment-validation accuracy, policy-consequence accuracy and publishing-decision accuracy are reported separately even when the final publishing verdict happens to be correct.

A system that always PASSes, always BLOCKs or always REVIEWs cannot satisfy the combined D-21 acceptance gates.

Performance thresholds, confidence convention, denominators and policy version must be precommitted before the blind acceptance run and cannot be relaxed after seeing the result.

D-21 performance thresholds are WonderPages Enterprise Local RC1 product-acceptance policy, not universal empirical constants.
```

### Formulări obligatorii (înregistrate ca atare)

> Coverage and performance are independent acceptance dimensions: D-19 establishes policy-relevant structural coverage; D-21 establishes
> performance acceptance.
>
> Global accuracy and Cohen’s kappa are descriptive metrics and cannot compensate for critical under-escalation.
>
> The D-19 consequence states must not be collapsed into a binary positive/negative label for Enterprise acceptance.
>
> Any expected non-auto-acceptable state that is incorrectly converted into an auto-acceptable final state is a critical auto-accept
> escape.
>
> Enterprise Local RC1 permits zero observed critical auto-accept escapes and additionally requires the one-sided exact 95% upper
> confidence bound for that error rate to be at most 5%.
>
> With zero observed critical auto-accept escapes, the 5% one-sided 95% requirement requires at least 59 relevant opportunities;
> insufficient denominator means validation incomplete, not evaluator PASS.
>
> The 59-case figure uses a one-sided exact 95% upper bound; a two-sided 95% Clopper-Pearson interval uses a different sample-size
> requirement and must not be conflated with the acceptance convention.
>
> BLOCKED_BY_POLICY or another confirmed non-waivable state downgraded to an operator-waivable state is an acceptance failure even when
> it does not become PASS.
>
> Enterprise safety must not be achieved by indiscriminate escalation: false escalation on adjudicated auto-acceptable cases is
> separately gated at an observed rate of at most 10% with at least 30 relevant cases for RC1.
>
> Zero observed critical errors is an acceptance rule; it is not a claim of zero true error rate.
>
> Fail-closed behavior is not credited as semantic correctness and must be reported separately from correct policy decisions.
>
> ASSESSMENT_INVALID and UNVERIFIED may not silently become final auto-PASS states.
>
> Finding detection, severity accuracy, assessment-validation accuracy, policy-consequence accuracy and publishing-decision accuracy are
> reported separately even when the final publishing verdict happens to be correct.
>
> A system that always PASSes, always BLOCKs or always REVIEWs cannot satisfy the combined D-21 acceptance gates.
>
> Performance thresholds, confidence convention, denominators and policy version must be precommitted before the blind acceptance run
> and cannot be relaxed after seeing the result.
>
> D-21 performance thresholds are WonderPages Enterprise Local RC1 product-acceptance policy, not universal empirical constants.

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Versiunea politicii de praguri / domeniul RC1** | Enterprise Local RC1 product-acceptance policy; pentru noul set independent ascuns; neaplicată retroactiv raportului istoric. Înăsprire ulterioară pe evidence permisă; relaxare post-hoc interzisă. |
| **Separarea D-19 / D-21** | Acoperire structurală ≠ performanță; ambele obligatorii. |
| **Starea de validare calculată** | Automat, versionat, auditabil, legat de hash-urile setului, evaluatorului, politicii și politicii de praguri. |
| **P0 — integritate** | Commitment-uri, freeze, configurație, run complet, integritate, contaminare, praguri neschimbate; altfel INVALID_RUN / NOT ACCEPTABLE AS EVIDENCE. |
| **P1 — evadare critică în auto-accept** | Stare așteptată non-auto-acceptabilă → stare finală auto-acceptabilă (inclusiv INVALID / UNVERIFIED → PASS final). **0 observate** și **limită superioară exactă unilaterală 95 % ≤ 5 %** (cu 0 erori ⇒ ≥ 59 oportunități relevante; limita la 59 ≈ 4,95 %). Numitor: doar oportunitățile P1 reale, defalcate pe jurisdicții; pooling-ul nu înlocuiește D-19. |
| **P2 — downgrade non-waivable → waivable** | BLOCK → REVIEW, REPAIR → REVIEW: **0 observate**; incertitudinea raportată; fără claim de rată în RC1. |
| **P3 — escaladare falsă** | Pe cazurile auto-acceptabile adjudecate: **≤ 10 % observat, numitor ≥ 30**; regulă de eșantion, nu garanție de populație; IC raportat. Anti-degenerare: fiecare celulă D-19 cu cazuri auto-acceptabile are cel puțin un auto-accept corect. |
| **P4–P9 — metrici pe straturi** | Matrice de confuzie pe stările D-19 (P4, nu compensează P1 / P2) · validarea evaluării (P5; INVALID / UNVERIFIED → auto-publicare = P1) · detecția finding-urilor (P6) · severitatea (P7) · consecința în jurisdicția autoritativă, fără „reparare” prin alt strat (P8) · decizia de publicare (P9). Mismatch-urile non-critice raportate, fără praguri suplimentare în RC1. |
| **Fail-closed** | Fără credit semantic; categorii separate (decizie corectă, fail-closed, eroare tehnică, UNKNOWN, UNVERIFIED); fail-open → P1. |
| **Determinism** | Componentele deterministe: 100 % reproductibile. Componentele model (D-18): contract de stabilitate obligatoriu înainte de pipeline; până atunci nu pot susține singure un auto-PASS critic. |
| **Raportarea incertitudinii / convenția** | Numerator, numitor, rată, metodă, nivel, interval / limită, cohortă. Acceptare: limită superioară exactă unilaterală 95 %. Clopper–Pearson bilateral doar descriptiv (0/n: unilateral ≤ 5 % ⇒ n ≥ 59; bilateral ⇒ n ≥ 72). |
| **Dovezi insuficiente** | INSUFFICIENT_EVIDENCE / VALIDATION NOT COMPLETE (nici PASS, nici FAIL de evaluator). Fără extrapolare între jurisdicții, limbi, benzi, modalități, niveluri. |
| **Anti-gaming** | Always-PASS / always-BLOCK / always-REVIEW nu pot trece; fără medieri între P1 / P2 și P3. |
| **Precommitment / fără relaxare post-hoc** | Definițiile, pragurile, numitorii, convenția, celulele și versiunile sigilate înaintea rulării oarbe. Corectarea ground truth-ului doar prin protocolul D-20 / D-22, nu ca mecanism de trecere. |
| **Setul rezervat istoric** | Nu stabilește pragurile. Sub P1 ar pica (cel puțin 5 erori de siguranță: 3 BLOCK → PASS, 2 REVIEW → PASS); 0,864 și κ 0,71 nu compensează. |
| **Relația cu D-19 / D-20 / D-22** | D-19: acoperirea, separat. D-20: precommitment și regula de consum. D-22: setul independent trebuie să ofere ≥ 59 oportunități P1, ≥ 30 auto-acceptabile (overlap permis), acoperirea D-19, independență, blindness, ground truth adjudecat, sigilare înainte de SH#2; autorul nu optimizează pentru evaluator. |
| **Comportamentul la momentul deciziei** (HEAD `d78bb44`, neschimbat) | `validation.js` verifică doar completitudinea; `evaluation.js` produce metrici binare fără intervale și fără stări de consecință. **Comportamentul nu e politica.** |

### Pragurile RC1 (rezumat canonic)

| Poartă | Regula |
|---|---|
| P1 | 0 erori observate; limita superioară exactă unilaterală 95 % ≤ 5 % (⇒ ≥ 59 oportunități la 0 erori) |
| P2 | 0 erori observate; incertitudine raportată |
| P3 | ≤ 10 % observat; numitor ≥ 30; incertitudine raportată |
| Celulă D-19 | acoperire structurală; cel puțin un auto-accept corect în fiecare celulă cu cazuri auto-acceptabile |
| Componente deterministe | 100 % reproductibile |
| Acuratețe globală / κ | doar descriptive |

### Afectate (fără nicio modificare acum)

`validation.js`, `evaluation.js`, `validationRequirements`, Gold-v1, Gold-v2, setul rezervat, sigiliul, `holdout-run-1.json` și rapoartele —
neschimbate.

### Nu decide

D-22 (cine scrie, păstrează și rulează setul) · conținutul și numărul total de cazuri peste minime · distribuția pe celule · schema
fizică · validatorul semantic D-18 · taxonomia valorilor · rubrica vizuală · evaluatorul · SH#2 · etichetele celor 226 de cazuri ·
performanța viitoare · Enterprise SaaS / P9.

### Dependențe deschise

- **D-21-DEP-INDEPENDENT-SET-SIZE** → D-22 · **D-21-DEP-STABILITY-CONTRACT** · **D-21-DEP-INVALID-TEST-EVIDENCE-PROTOCOL** → D-22 / D-20 ·
  **D-21-DEP-THRESHOLD-POLICY-VERSIONING**.

## D-22 — Independența autorului și protocolul setului ascuns (RC1)

### Declarația operatorului (cuvânt cu cuvânt)

```text
D-22 — DECIZIA OPERATORULUI

Aleg:

Opțiunea (b), cu protocol hibrid de autor independent și separare explicită Author / Adjudicator / Custodian / Runner / Implementer / Auditor.

Pentru WonderPages Enterprise Local RC1:

Noul independent hidden acceptance set NU poate fi scris de furnizorul care implementează evaluatorul și NU poate fi scris de un agent/model care primește contextul implementării, repo-ul, evaluatorul, failure history sau actualele cazuri expuse.

Independența este definită procedural și prin provenance.

Nu doar prin numele modelului.

⸻

PRINCIPII CENTRALE

DIFFERENT SESSION ≠ INDEPENDENT AUTHOR.

DIFFERENT MODEL ≠ INDEPENDENT AUTHOR IF CONTEXT IS SHARED.

DIFFERENT PROVIDER ≠ INDEPENDENT AUTHOR IF IMPLEMENTATION EVIDENCE IS SHARED.

INDEPENDENCE REQUIRES CONTEXT SEPARATION, NOT ONLY MODEL SEPARATION.

SEALED ≠ INDEPENDENT.

HIDDEN ≠ INDEPENDENT IF THE IMPLEMENTER AUTHORED IT.

AUTHOR INDEPENDENCE ≠ GROUND-TRUTH CORRECTNESS.

GROUND-TRUTH ADJUDICATION ≠ AUTHOR INDEPENDENCE.

THE IMPLEMENTER MUST NOT WRITE ITS OWN FINAL EXAM.

POLICY KNOWLEDGE IS REQUIRED; IMPLEMENTATION KNOWLEDGE IS PROHIBITED FOR THE HIDDEN-SET AUTHOR.

⸻

1. Actualul Gold-v2 nu este independent

Confirm limitarea existentă.

Actualele:

* stimuli Gold-v2;
* etichete propuse;
* evaluatorii H1–H5;

au același furnizor de implementare ca autor.

Prin urmare, sigiliul actual demonstrează:

immutability after sealing

dar NU:

independent authorship.

D-20 a stabilit deja statutul acestui set.

D-22 nu îl modifică.

⸻

2. Varianta (a) este respinsă

Nu acceptăm contaminarea de autor drept suficientă pentru Enterprise acceptance.

Actualul set rămâne evidence istoric/regression conform D-20.

Pentru acceptarea post-SH#2 este obligatoriu un set nou.

⸻

ROLURILE

3. Author

Author creează stimuli noi.

Author NU decide singur ground truth-ul final.

Author NU poate fi:

* implementatorul evaluatorului;
* Claude Code care face SH#2;
* aceeași sesiune de implementare;
* un sub-agent al implementatorului cu acces la același context;
* un alt model căruia i s-a dat repo-ul/evaluatorul/failure history.

⸻

4. Adjudicator

Adjudicator stabilește ground truth-ul final conform politicii operatorului.

Pentru RC1:

operatorul este adjudicatorul final.

Author poate propune expected outcomes.

Dar:

AUTHOR-PROPOSED LABEL ≠ ADJUDICATED GROUND TRUTH.

⸻

5. Custodian

Custodian:

* păstrează hidden set-ul;
* păstrează ground truth-ul;
* păstrează secretele/nonce-urile commitment-ului;
* păstrează provenance;
* controlează accesul;
* pregătește setul pentru blind run.

Pentru RC1 operatorul poate fi:

Adjudicator + Custodian.

Aceasta nu compromite independența față de implementator.

⸻

6. Runner

Runner execută evaluatorul înghețat asupra hidden set-ului.

Pentru RC1 operatorul poate fi:

Custodian + Runner.

Dar runner-ul trebuie să urmeze protocolul precommitted și să nu modifice evaluatorul.

⸻

7. Implementer

Implementer:

* construiește evaluatorul;
* face SH#2;
* construiește generic validation tooling;
* repară development/calibration failures;
* poate vedea exposed regression evidence.

Implementer NU vede înainte de scored run:

* hidden stimuli;
* individual hidden labels;
* individual expected findings;
* individual expected consequences;
* individual case descriptors suficient de detaliați pentru reconstrucție.

⸻

8. Auditor

Auditor verifică:

* provenance;
* commitments;
* evaluator freeze;
* threshold freeze;
* run identity;
* metric calculation;
* integrity.

Pentru RC1 operatorul poate îndeplini și acest rol.

O a doua persoană independentă este preferabilă, dar nu obligatorie pentru RC1.

⸻

AUTHORSHIP

9. Protocol hibrid

Noul hidden set trebuie să provină din:

minimum două surse de autor independente de implementator.

Pentru RC1 recomand și aprob:

Source A — human/operator authored

Operatorul sau alt om creează o parte din:

* boundary cases;
* P1/P2 high-risk cases;
* semantic adversarial cases;
* cazuri dificil de redus la template.

Source B — independent external model/agent

Un model/agent separat poate genera volum suplimentar, DAR numai într-un context izolat conform D-22.

Nu trebuie să fie Claude Code / implementatorul.

⸻

10. Nu toate cele 59 P1 trebuie scrise manual

D-21 cere minimum 59 relevant P1 opportunities.

D-22 NU cere 59 cazuri scrise manual de operator.

Scopul protocolului hibrid este să reducă:

* correlated blind spots;
* template bias;
* implementer bias;

fără să facă procesul impracticabil.

⸻

11. Partea critică nu poate proveni dintr-o singură sursă

Pentru P1/P2:

fiecare familie de politică relevantă trebuie să conțină evidence din mai mult de o perspectivă de authoring acolo unde este practic.

Cel puțin o parte din boundary/adversarial coverage trebuie să fie human-authored sau human-materially-reworked.

Nu acceptăm:

„un singur model a generat toate cazurile și operatorul doar a apăsat approve”.

⸻

12. O sesiune nouă Claude nu este suficientă

O sesiune nouă a aceluiași model:

* poate elimina conversational context;
* dar nu elimină correlated model priors;
* și nu constituie separarea puternică dorită pentru RC1.

Prin urmare:

fresh Claude session alone is insufficient as the sole independent hidden-set author for RC1.

Poate eventual contribui ca sursă auxiliară numai dacă nu este implementatorul și protocolul viitor permite asta.

Nu este Source B preferată.

⸻

13. Alt model/provider nu este suficient prin el însuși

Dacă alt model primește:

* repo-ul;
* evaluator code;
* SH#2 design;
* exposed holdout;
* known failures;
* diagnostic probes;
* detailed implementation limitations;

independența este compromisă.

Prin urmare:

provider separation without context separation is insufficient.

⸻

AUTHOR BRIEF

14. Autorul primește policy-only brief

Author primește numai informația necesară pentru a testa politica.

Poate primi:

* normative policy rules;
* policy dimensions;
* jurisdiction boundaries;
* age bands;
* language/edition requirements;
* modality requirements;
* scope requirements;
* consequence vocabulary;
* D-19 required coverage cells;
* D-21 required counts/classes;
* schema de output necesară authoring-ului.

⸻

15. Autorul NU primește implementation brief

Nu primește:

* source code;
* evaluator implementation;
* regex-uri;
* word lists;
* prompts;
* known evaluator weaknesses;
* current false-pass examples;
* actual Gold-v1/Gold-v2 stimuli;
* holdout failures;
* exposed adversarial probes;
* implementation bugs;
* SH#2 design;
* evaluator outputs.

⸻

16. Full D-01…D-21 ledger nu este author brief

Ledger-ul conține numeroase exemple concrete și diagnostic evidence.

Prin urmare:

nu da autorului hidden set-ului întregul ledger drept prompt de generare.

Trebuie creat un:

SANITIZED NORMATIVE POLICY BRIEF

care păstrează regulile normative, dar elimină:

* stimuli existenți;
* probe;
* evaluator outputs;
* known failure examples;
* implementation commentary.

⸻

17. Sanitized brief este versionat

Brief-ul trebuie:

* versionat;
* hash-uit;
* păstrat în provenance;
* legat de policy version.

Astfel știm exact ce cunoștea author-ul.

⸻

18. Implementerul poate ajuta la structurarea brief-ului, dar nu îl autorizează singur

Deoarece implementerul cunoaște politica, poate produce un draft mecanic de policy-only brief.

Dar operatorul trebuie să îl revizuiască și să îl aprobe înainte de utilizarea pentru hidden authoring.

Brief-ul aprobat devine input-ul autorului independent.

⸻

CONTAMINATION SCREENING

19. Hidden cases trebuie să fie noi

Nu sunt permise drept independent evidence:

* duplicate exacte;
* traduceri triviale ale cazurilor cunoscute;
* near-duplicates structurale evidente;
* simple noun swaps;
* template substitutions;
* cazuri reconstruite din probele D-01…D-21.

⸻

20. Similarity screening este obligatoriu

Înainte de seal trebuie verificată similaritatea față de:

* Gold-v1;
* Gold-v2;
* probe registry;
* known holdout;
* exposed D-01…D-21 examples;
* SH#2 development corpus disponibil la acel moment.

Rezultatul screening-ului intră în provenance.

⸻

21. Screening-ul nu trebuie să expună setul implementatorului

Tooling-ul generic poate fi implementat și testat pe date artificiale.

Rularea lui pe hidden data se face de custode.

Implementatorul primește doar rezultatul permis de protocol, nu hidden stimuli.

⸻

GROUND TRUTH

22. Toate cazurile sunt adjudecate înainte de seal

Nu există în hidden acceptance set:

label = null

la momentul seal-ului.

Ground truth-ul necesar D-19/D-21 trebuie stabilit înainte de SH#2.

⸻

23. Reprezentarea este D-19

Ground truth-ul nu este doar positive/negative.

Trebuie să reprezinte unde este aplicabil:

* expected finding;
* dimension;
* severity;
* assessment-validation state;
* authoritative policy consequence;
* publishing consequence;
* scope;
* edition;
* modality.

⸻

24. Operatorul este autoritatea finală de policy adjudication

Dacă author și operator nu sunt de acord:

ground truth-ul final este adjudecarea operatorului conform D-01…D-22.

Dezacordul nu se șterge.

Se păstrează în provenance.

⸻

25. Facts nu devin preferințe de operator

Pentru science/factual truth și alte elemente factuale:

adjudecarea trebuie să distingă:

* factual verification;
* policy consequence.

Operatorul decide politica.

Nu redefinește arbitrar faptul pentru a face testul să treacă.

⸻

26. A doua privire

Pentru RC1:

a doua adjudecare umană completă NU este obligatorie.

Dar pentru cazurile:

* ambigue;
* P1/P2 high-risk;
* factual contestable;
* unde author și operator diferă;

este recomandată o a doua verificare independentă.

Dacă nu există, limitarea se declară explicit.

⸻

STORAGE / VISIBILITY

27. Hidden înseamnă inaccesibil implementatorului

Nu stoca hidden stimuli sau answers într-un loc pe care implementatorul îl poate accesa.

Aceasta include orice repository/branch/workspace oferit implementatorului.

⸻

28. Nu presupunem că numele serviciului garantează izolarea

Regula este capability-based:

dacă implementatorul/sesiunea de implementare poate accesa acel storage, acel storage NU este hidden storage.

⸻

29. Operatorul este responsabil de secret boundary

Dacă operatorul copiază accidental hidden stimulus în conversația de implementare:

incidentul trebuie înregistrat.

Cazul/setul afectat trebuie evaluat pentru contamination.

Nu îl tratăm ca și cum expunerea nu s-ar fi întâmplat.

⸻

CRYPTOGRAPHIC COMMITMENT

30. Nu folosim hash simplu al stimulilor scurți

Un simplu:

SHA256(stimulus)

poate permite dictionary/guess confirmation pentru stimuli scurți.

Prin urmare, nu este suficient drept commitment confidențial.

⸻

31. Commitment-ul trebuie să includă entropie secretă

Folosește un commitment canonical cu:

* canonical serialization;
* high-entropy secret nonce/salt;
* dataset version;
* policy version;
* stimulus payload;
* adjudicated ground truth.

Poate fi realizat printr-o schemă criptografică standard potrivită.

D-22 decide proprietatea, nu biblioteca concretă.

⸻

32. Stimuli și ground truth sunt ambele committed

Nu este suficient să commit-uim doar stimulii.

Altfel expected answers ar putea fi schimbate după run.

Trebuie să fie precommitted:

stimuli + adjudicated ground truth.

⸻

33. Commitment-ul public nu divulgă secretul înainte de run

În repo poate exista:

* commitment/root;
* dataset version;
* policy version;
* total counts;
* aggregated coverage manifest;
* provenance attestation;
* seal timestamp/commit relationship.

Secretul necesar verificării/reveal-ului rămâne la custode până când protocolul permite dezvăluirea.

⸻

34. Merkle/aggregate commitment este permis

Dacă implementarea viitoare folosește un Merkle root sau mecanism echivalent, este acceptabil.

Nu este obligatoriu prin D-22.

Proprietățile obligatorii sunt:

* binding;
* confidentiality before reveal;
* reproducibility after authorized reveal;
* tamper evidence.

⸻

COVERAGE MANIFEST

35. Implementerul poate vedea coverage agregat

Înainte de run poate vedea:

* required cell schema;
* total counts;
* aggregate counts per policy-relevant cell;
* P1 opportunity count;
* P3 auto-acceptable count;
* modalities/scopes represented.

⸻

36. Manifestul nu conține per-case descriptors

Nu include înainte de run:

* case IDs semantice;
* exact topics;
* objects;
* phrasings;
* story situations;
* expected per-case consequence;
* metadata suficientă pentru reconstrucție.

⸻

37. D-19 și D-21 trebuie demonstrabile fără disclosure

Custodele trebuie să poată demonstra înainte de SH#2 că design-ul satisface:

* D-19 structural coverage;
* D-21 minimum denominators;

fără a dezvălui cazurile.

⸻

VISUAL / CROSS-MODAL

38. RC1 include visual/cross-modal unde produsul pretinde acea jurisdicție

WonderPages produce cărți ilustrate și pipeline-ul are visual QA/safety responsibilities.

Prin urmare:

dacă Enterprise Local RC1 pretinde că respectivele porți sunt validate pentru:

* visual safety;
* visual age-fit;
* cross-modal safety/policy;
* alte dimensiuni vizuale autoritative;

hidden acceptance trebuie să includă acele modalități conform D-19.

Nu putem declara full Enterprise acceptance pentru o jurisdicție nevalidată.

⸻

39. Nu inventăm artificial coverage dacă feature-ul nu există încă

Dacă o anumită jurisdicție cross-modal nu este implementată în RC1:

raportul trebuie să spună:

NOT IMPLEMENTED / NOT VALIDATED

și claim-ul RC1 se limitează corespunzător.

Nu pretindem coverage pentru o capacitate inexistentă.

⸻

40. Generarea hidden visuals respectă aceeași separare

Implementatorul nu generează hidden acceptance images.

Acestea provin din authoring pipeline-ul independent sau din materiale create/obținute legitim de custode.

Provenance-ul lor se păstrează.

⸻

RUNNER

41. Runner-ul trebuie izolat procedural, nu obligatoriu offline

Corectez recomandarea „fără rețea” ca regulă universală.

Dacă evaluatorul înghețat este complet local/determinist:

un clean local/offline run este preferabil.

Dacă evaluatorul validat necesită un model/provider extern:

rețeaua necesară acelui provider poate fi permisă.

⸻

42. Network access este least-privilege

Runner-ul poate avea numai accesul necesar execuției aprobate.

Nu trebuie să sincronizeze hidden data către:

* implementer workspace;
* repo;
* logging necontrolat;
* analytics neesențial;
* development session.

⸻

43. Provider exposure trebuie documentată

Dacă hidden stimuli sunt transmise unui inference provider pentru evaluare:

provenance-ul run-ului trebuie să noteze:

* provider;
* model/version unde disponibil;
* data path relevant;
* retention/configuration relevantă cunoscută;
* faptul că providerul a primit stimuli în timpul scored run-ului.

Aceasta nu este automat aceeași contaminare cu expunerea către implementator, dar este o limitare care trebuie declarată.

⸻

44. Runner-ul nu modifică evaluatorul

Runner execută artifactul înghețat.

Nu patch-uiește.

Nu retry-uiește selectiv cazuri nereușite în afara protocolului.

Nu face best-of-N.

⸻

INFORMATION BEFORE RUN

45. Implementerul poate primi înainte de run

Doar:

* normative policy;
* sanitized authoring-independent policy contract unde este necesar;
* D-19 coverage schema;
* D-21 threshold policy;
* aggregate coverage counts;
* generic input/output schema;
* generic validation tooling requirements;
* commitments;
* evaluator freeze requirements.

⸻

46. Implementerul NU primește înainte de run

* hidden stimuli;
* hidden images;
* expected answers;
* per-case findings;
* per-case consequence;
* author notes;
* adjudication discussions;
* semantic case IDs;
* detailed hidden distributions care permit reconstruction.

⸻

INFORMATION AFTER RUN

47. PASS

Dacă run-ul trece:

se pot publica:

* aggregate metrics;
* gate results;
* commitments;
* integrity evidence;
* coverage evidence;
* limitations.

Operatorul decide ulterior dacă setul concret devine public.

Pentru o versiune viitoare, odată expus, nu îl considerăm automat hidden acceptance evidence.

⸻

48. FAIL

Dacă run-ul eșuează:

înregistrăm mai întâi:

* FAIL;
* evaluator version;
* dataset commitment;
* threshold version;
* aggregate gate result.

⸻

49. Dacă vrem repair

Dacă implementatorului îi oferim informație din failure pentru a repara evaluatorul:

D-20 se aplică.

Setul este consumat pentru viitoarea independent acceptance.

⸻

50. Nu este necesar să ascundem failures pentru totdeauna

După ce acceptăm că setul este consumat:

putem folosi:

* failure IDs;
* stimuli;
* reasoning;
* ground truth;

pentru debugging.

Dar următoarea acceptare necesită un set nou.

⸻

INVALID_RUN

51. INVALID_RUN nu consumă automat setul

Dacă run-ul este invalid strict tehnic și:

* evaluatorul nu este modificat;
* hidden results nu sunt folosite pentru tuning;
* failure semantics nu sunt expuse implementatorului;
* protocolul D-20 este respectat;

același set poate fi rerulat.

Incidentul rămâne în audit trail.

⸻

PROVENANCE

52. Fiecare hidden case are provenance intern

Custodele păstrează cel puțin:

* case ID opac;
* author source;
* authoring timestamp;
* authoring brief version;
* original author output;
* operator edits;
* adjudication history;
* factual sources unde sunt necesare;
* modality;
* scope;
* edition/language;
* D-19 cell membership;
* D-21 class membership;
* contamination-screen status;
* final ground truth;
* commitment membership.

⸻

53. Pentru model-authored cases

Se păstrează:

* provider/model identity unde disponibilă;
* session/context isolation attestation;
* exact sanitized brief;
* prompt;
* raw output;
* operator modifications.

Acestea rămân la custode înainte de run.

⸻

54. Pentru human-authored cases

Se păstrează:

* author identity/role sau pseudonymous audit identity;
* brief version;
* creation timestamp;
* operator edits;
* adjudication.

⸻

55. Provenance-ul trebuie să poată demonstra separarea

Trebuie să putem răspunde ulterior:

Cine a scris cazul?

Ce știa?

Ce nu știa?

Cine l-a adjudecat?

Când a fost sigilat?

A existat înainte de SH#2?

A fost expus implementatorului?

⸻

CONTAMINATION INCIDENTS

56. Contaminarea nu este binară doar la nivel de set

Un incident poate afecta:

* un caz;
* o familie;
* o celulă;
* întregul set.

Trebuie evaluat scope-ul.

⸻

57. Caz expus înainte de run

Un caz expus implementatorului înainte de scored run:

nu mai poate conta drept independent evidence pentru denominatorii D-19/D-21.

Trebuie:

* exclus înainte de run;
* înlocuit prin protocol independent;
* recommitted/resealed înainte de SH#2 dacă expunerea are loc înainte de SH#2.

⸻

58. Expunere după SH#2 dar înainte de run

Dacă hidden case este expus implementatorului după SH#2, dar înainte de scored run:

nu îl păstrăm doar fiindcă evaluatorul era aproape final.

Independența lui este compromisă.

⸻

59. Incident major

Dacă nu putem demonstra ce parte a setului a fost expusă:

presupunem contaminare la scope-ul cel mai sigur justificabil.

Nu pretindem independență nedemonstrabilă.

⸻

RELAȚIA CU D-19

60. D-19 definește spațiul de coverage

Authorii trebuie să creeze setul din:

policy space

nu din:

evaluator failure space.

⸻

61. Coverage manifest agregat

D-19 poate fi verificat prin counts pe celule fără a expune stimuli.

⸻

RELAȚIA CU D-20

62. Setul este creat înainte de SH#2

Stimuli + ground truth + provenance + commitments sunt finalizate înainte de SH#2.

⸻

63. Implementer blindness continuă până la scored run

Nu este suficient ca setul să fi fost sigilat.

Trebuie să rămână ascuns.

⸻

64. Consumption rule rămâne neschimbată

Orice feedback folosit pentru evaluator tuning consumă setul.

⸻

RELAȚIA CU D-21

65. Setul trebuie să satisfacă P1/P3 denominators

Înainte de seal:

* minimum 59 relevant P1 opportunities;
* minimum 30 auto-acceptable P3 cases;
* D-19 structural cells;
* celelalte cerințe D-21.

Overlap-ul legitim este permis.

⸻

66. Compoziția nu se ajustează după rezultat

Nu adăugăm 20 de cazuri ușoare după FAIL ca să diluăm rata.

Denominatorii și design-ul sunt committed înainte.

⸻

67. Authorul nu vede evaluator outputs

Nu i se spune:

„sistemul ratează cuțite, deci scrie alte 20 de cazuri cu arme”.

Authoring-ul derivă din politica normativă și coverage plan.

⸻

OPERATORUL

68. Operatorul poate cumula trei roluri

Pentru RC1 operatorul poate fi:

* Adjudicator;
* Custodian;
* Runner.

Acest lucru NU compromite independența față de implementator.

⸻

69. Operatorul poate contribui și ca Author

Da.

Dar setul RC1 nu trebuie să fie exclusiv operator-authored dacă același operator adjudecă toate cazurile.

Protocolul hibrid cu minimum două surse reduce acest risc.

⸻

70. Disciplina operatorului este parte din protocol

După seal:

operatorul nu trebuie să transmită implementatorului:

* exemple;
* indicii;
* teme ascunse;
* failure guesses;
* hidden author discussions.

⸻

LIMITĂRILE PE CARE LE DECLARĂM

71. Nu pretindem independență absolută

Nu există independență epistemică perfectă.

Policy author, operator, authorii și modelele pot împărți:

* limbaj;
* cultură;
* publishing priors;
* LLM priors;
* aceleași concepte.

Claim-ul este:

procedurally independent from the evaluator implementation/development process to the degree defined and evidenced by D-22.

⸻

72. Synthetic validation ≠ production validation

Chiar dacă hidden acceptance trece:

nu demonstrează singur calitatea cărților reale.

După Enterprise Local RC:

* instalare;
* provider authentication;
* Agent System Commissioning;
* Dinosaur World V1 migration;
* real production workflow;
* actual acceptance;

rămân evidence distincte.

⸻

73. Hidden acceptance ≠ Agent System Commissioning

Nu confundăm evaluator validation cu validarea celor 11 agenți permanenți în funcționare reală.

⸻

74. Hidden acceptance ≠ Dinosaur World acceptance

Dinosaur World rămâne testul real de produs/workflow.

⸻

PROTOCOL CANONICAL RC1

Ordinea aprobată este:

1. Închidere D-22.

2. Closure Report D-01…D-22.

3. Construirea și aprobarea sanitized normative policy brief.

4. Construirea hidden set-ului de minimum două surse independente de implementator.

5. Operator adjudication în schema D-19.

6. Contamination / near-duplicate screening.

7. Verificarea D-19 structural coverage.

8. Verificarea D-21 denominators și composition requirements.

9. Finalizarea provenance.

10. Commitment pentru stimuli + ground truth.

11. Seal înainte de SH#2.

12. Hidden set devine inaccesibil implementatorului.

13. Semantic Hardening #2 exclusiv din policy + development/calibration/exposed diagnostic evidence.

14. Regression pe evidence cunoscută.

15. Freeze evaluator + prompts + configuration + thresholds.

16. P0 integrity verification.

17. Blind scored run.

18. D-19 + D-21 acceptance calculation.

19. PASS / FAIL / INVALID_RUN înregistrat fără post-hoc threshold changes.

20. Dacă FAIL conduce la tuning → set consumed → următoarea acceptare necesită set nou.

⸻

FORMULĂRI OBLIGATORII

Înregistrează explicit:

WonderPages Enterprise Local RC1 requires independent hidden-set authorship; the evaluator implementation provider may not author its own final acceptance set.

Different session, model or provider identity alone does not establish independence; context separation and provenance are required.

A hidden-set author may know the normative policy and required coverage, but must not receive evaluator implementation, known failures, exposed holdout cases, diagnostic probes or SH#2 implementation details.

The full D-01…D-22 evidence ledger is not itself an acceptable hidden-author brief because it contains concrete examples and diagnostic evidence; a sanitized normative policy brief is required.

RC1 uses at least two authoring sources independent of the implementation provider; the operator may contribute human-authored cases and an isolated external model/agent may provide additional volume.

A fresh Claude session alone is insufficient as the sole independent hidden-set author for RC1.

Author-proposed labels are not ground truth; operator adjudication establishes the final policy ground truth before sealing.

The operator may simultaneously serve as adjudicator, custodian and runner without compromising independence from the implementation provider, provided the hidden-set boundary is preserved.

Stimuli and adjudicated ground truth must both be cryptographically committed before SH#2; simple unsalted hashes of short stimuli are insufficient as confidential commitments.

The implementation provider may see aggregate coverage and denominator counts before the run but not per-case information sufficient to reconstruct hidden stimuli or expected answers.

Hidden acceptance evidence must satisfy D-19 structural coverage and D-21 performance-denominator requirements before sealing.

For RC1, visual and cross-modal hidden evidence is required wherever the RC1 product claim asserts an implemented authoritative visual or cross-modal jurisdiction; unimplemented or unvalidated jurisdictions must be explicitly excluded from the claim rather than inferred.

Runner isolation is capability-based and least-privilege; offline execution is preferred when possible but is not mandatory when the frozen evaluator legitimately requires an external inference provider.

Any external provider exposure during the scored run must be documented as run provenance and must not silently expose the hidden set to the implementation workflow.

Any hidden case exposed to the implementation provider before the scored run loses eligibility as independent evidence for the affected acceptance denominator.

Any scored-run feedback used for evaluator tuning consumes the set for future independent acceptance according to D-20.

D-22 establishes procedural independence from the evaluator implementation process, not absolute epistemic independence.

Synthetic hidden-set acceptance does not replace Agent System Commissioning, Dinosaur World V1 production validation or real product acceptance.

⸻

CE NU DECIDE D-22

D-22 NU decide:

* identitatea concretă a celui de-al doilea author;
* providerul/modelul concret folosit pentru Source B;
* numărul final total de cazuri peste minime;
* stimulii concreți;
* imaginile concrete;
* ground truth-ul cazurilor individuale;
* tool-ul criptografic concret;
* storage product-ul concret;
* schema fizică finală;
* implementarea runner-ului;
* implementarea validatorului;
* SH#2;
* schimbări în evaluator;
* etichetele actualelor 226 cazuri;
* Agent System Commissioning;
* Dinosaur World;
* V1–V6 production acceptance;
* P9.
```

### Formulări obligatorii (înregistrate ca atare)

> WonderPages Enterprise Local RC1 requires independent hidden-set authorship; the evaluator implementation provider may not author its
> own final acceptance set.
>
> Different session, model or provider identity alone does not establish independence; context separation and provenance are required.
>
> A hidden-set author may know the normative policy and required coverage, but must not receive evaluator implementation, known
> failures, exposed holdout cases, diagnostic probes or SH#2 implementation details.
>
> The full D-01…D-22 evidence ledger is not itself an acceptable hidden-author brief because it contains concrete examples and
> diagnostic evidence; a sanitized normative policy brief is required.
>
> RC1 uses at least two authoring sources independent of the implementation provider; the operator may contribute human-authored cases
> and an isolated external model/agent may provide additional volume.
>
> A fresh Claude session alone is insufficient as the sole independent hidden-set author for RC1.
>
> Author-proposed labels are not ground truth; operator adjudication establishes the final policy ground truth before sealing.
>
> The operator may simultaneously serve as adjudicator, custodian and runner without compromising independence from the implementation
> provider, provided the hidden-set boundary is preserved.
>
> Stimuli and adjudicated ground truth must both be cryptographically committed before SH#2; simple unsalted hashes of short stimuli are
> insufficient as confidential commitments.
>
> The implementation provider may see aggregate coverage and denominator counts before the run but not per-case information sufficient
> to reconstruct hidden stimuli or expected answers.
>
> Hidden acceptance evidence must satisfy D-19 structural coverage and D-21 performance-denominator requirements before sealing.
>
> For RC1, visual and cross-modal hidden evidence is required wherever the RC1 product claim asserts an implemented authoritative visual
> or cross-modal jurisdiction; unimplemented or unvalidated jurisdictions must be explicitly excluded from the claim rather than
> inferred.
>
> Runner isolation is capability-based and least-privilege; offline execution is preferred when possible but is not mandatory when the
> frozen evaluator legitimately requires an external inference provider.
>
> Any external provider exposure during the scored run must be documented as run provenance and must not silently expose the hidden set
> to the implementation workflow.
>
> Any hidden case exposed to the implementation provider before the scored run loses eligibility as independent evidence for the
> affected acceptance denominator.
>
> Any scored-run feedback used for evaluator tuning consumes the set for future independent acceptance according to D-20.
>
> D-22 establishes procedural independence from the evaluator implementation process, not absolute epistemic independence.
>
> Synthetic hidden-set acceptance does not replace Agent System Commissioning, Dinosaur World V1 production validation or real product
> acceptance.

### Separarea cerută

| Strat | Conținut |
|---|---|
| **Definiția independenței RC1** | Procedurală și prin provenance; nu prin identitatea modelului. |
| **Limitarea Gold-v2 actual / opțiunea (a)** | Același autor pentru cazuri, etichete propuse și evaluatori; sigiliul ≠ independență; statutul D-20 neschimbat. (a) respinsă. |
| **Autor hibrid / minimum două surse** | Source A: om / operator (frontiere, P1 / P2 cu risc mare, adversarial semantic). Source B: model / agent extern în context izolat, nu Claude Code. Nu e nevoie ca toate cele 59 P1 să fie scrise manual. Partea critică are mai mult de o perspectivă de autor; nu „un model a generat tot și operatorul a aprobat”. |
| **Roluri** | Author (stimuli, fără ground truth final) · Adjudicator (operatorul, autoritate finală) · Custodian (set, secrete, provenance, acces) · Runner (artifact înghețat, fără patch / retry / best-of-N) · Implementer (blind până la scored run) · Auditor (operatorul; a doua persoană preferabilă). Operatorul poate cumula Adjudicator + Custodian + Runner (+ Auditor); ca Author, nu exclusiv. |
| **Autori interziși / sesiune nouă / alt furnizor** | Implementatorul, sesiunea lui, sub-agenții cu același context, orice model cu repo / evaluator / failure history. Sesiune nouă Claude: insuficientă ca unic autor. Separarea de furnizor fără separarea de context: insuficientă. |
| **Brief-ul autorului / proveniența brief-ului** | SANITIZED NORMATIVE POLICY BRIEF (doar reguli, dimensiuni, jurisdicții, benzi, ediții, modalități, scope, vocabularul consecințelor, celulele D-19, clasele D-21, schema de output); fără cod, prompturi, liste, slăbiciuni, exemple, stimuli Gold, eșecuri, probe, design SH#2, ieșiri. Versionat, hash-uit, legat de policy version; draft mecanic posibil de la implementer, aprobat de operator. |
| **Screening de contaminare** | Obligatoriu înainte de seal, față de Gold-v1, Gold-v2, registrul de probe, holdout-ul, exemplele D-01…D-21, corpusul SH#2; rulat de custode cu tooling generic. |
| **Ground truth** | Toate cazurile adjudecate înainte de seal, în reprezentarea D-19; dezacordurile păstrate; faptul verificat separat de consecința de politică; a doua adjudecare recomandată pentru cazurile ambigue / P1 / P2 / factual contestabile, altfel limitare declarată. |
| **Stocare / commitment / manifest** | Hidden = inaccesibil implementatorului (capability-based). Commitment sărat, canonic, pe stimuli + ground truth; Merkle permis; binding, confidențialitate, reproductibilitate, tamper evidence. Manifest doar agregat; fără descriptori per caz; D-19 și D-21 demonstrate fără dezvăluire. |
| **Vizual / cross-modal** | Obligatoriu unde claim-ul RC1 afirmă jurisdicția; altfel NOT IMPLEMENTED / NOT VALIDATED și claim limitat. Imaginile ascunse nu sunt generate de implementer. |
| **Runner** | Capability-based, least-privilege; offline preferat, nu obligatoriu (recomandarea furnizorului „fără rețea” ca regulă universală, corectată). Expunerea către un inference provider documentată. |
| **Dezvăluire înainte / după rulare** | Înainte: doar politică, scheme, praguri, numărători agregate, cerințe, commitments. După PASS: agregate, porți, integritate, acoperire, limitări. După FAIL: înregistrare întâi; folosirea pentru repair consumă setul. INVALID_RUN tehnic: rerun permis în condiții. |
| **Proveniență** | Per caz (ID opac, sursă, timestamp, brief, output original, editări, adjudecare, surse factuale, modalitate, scope, ediție, celulă D-19, clasă D-21, screening, ground truth, commitment); detalii suplimentare pentru cazurile scrise de model sau de om; trebuie să poată demonstra separarea. |
| **Incidente de contaminare** | Scope evaluat; caz expus → exclus / înlocuit / resigilat; expunere post-SH#2 → compromis; scope nedemonstrabil → presupunere conservatoare. Disciplina operatorului după seal. |
| **Relația cu D-19 / D-20 / D-21** | Din policy space, nu din failure space; finalizat înainte de SH#2; blindness până la scored run; regula de consum; ≥ 59 P1, ≥ 30 P3, celulele D-19 înainte de seal; fără ajustare post-rezultat. |
| **Limitările independenței** | Procedurală, nu epistemică absolută; sintetic ≠ producție; ≠ Agent Commissioning; ≠ acceptarea Dinosaur World. |
| **Secvența canonică RC1** | 20 de pași: închidere D-22 → raport de închidere → brief sanitizat → set ascuns din ≥ 2 surse → adjudecare D-19 → screening → verificare D-19 → verificare D-21 → provenance → commitment → seal înainte de SH#2 → ascundere → SH#2 → regresie → freeze → P0 → blind run → calcul D-19 + D-21 → PASS / FAIL / INVALID_RUN → set consumat dacă FAIL + tuning. |
| **Comportamentul la momentul deciziei** (HEAD `0e4dffd`, neschimbat) | Nu există tooling pentru brief, commitment sărat, manifest, screening de custode, runner izolat, provenance per caz. Sigilarea actuală folosește hash-uri nesărate pe caz. Sesiunea de implementare are acces la repo și la conectori (de ex. Google Drive), deci nu pot fi hidden storage. **Comportamentul nu e politica.** |

### Nu decide

Al doilea autor concret · providerul / modelul pentru Source B · numărul total de cazuri peste minime · stimulii / imaginile / ground
truth-ul individuale · tool-ul criptografic · storage-ul concret · schema fizică · runner-ul · validatorul · SH#2 · evaluatorul ·
etichetele celor 226 de cazuri · Agent System Commissioning · Dinosaur World · V1–V6 · P9.

### Dependențe deschise

- **D-22-DEP-SANITIZED-BRIEF** · **D-22-DEP-SOURCE-B** · **D-22-DEP-GENERIC-TOOLING** · **D-22-DEP-STORAGE** · **D-22-DEP-RC1-VISUAL-CLAIM**.
