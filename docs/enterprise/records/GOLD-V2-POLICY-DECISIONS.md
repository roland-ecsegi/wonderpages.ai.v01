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
