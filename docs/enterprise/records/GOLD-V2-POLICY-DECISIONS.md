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
