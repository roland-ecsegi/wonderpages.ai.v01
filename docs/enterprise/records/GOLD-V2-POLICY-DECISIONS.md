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
