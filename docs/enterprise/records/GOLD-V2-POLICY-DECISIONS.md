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
