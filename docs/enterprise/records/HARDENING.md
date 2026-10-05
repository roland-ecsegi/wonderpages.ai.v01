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

## 2. Matricea de trasabilitate (plan → rezultat; completată pe parcurs)

| OBS | Defect / limită demonstrată | Subsistem | Reparație planificată | Teste | Rezultat | Limită rămasă |
|---|---|---|---|---|---|---|
| GS-1 | expresii de siguranță și negații fără legătură anulează regula; ordinea acțiunilor ignorată; adult prezent ≠ supraveghere | safety | analiză pe propoziții/clauze: negația legată de predicatul periculos; „anyway/în ciuda”; ASK/verificare vs prezență | P-S01…08, P-S30, P-S35/36; cazuri v2 | — | — |
| GS-2 | verdict corect din motiv greșit (cazul 3) | metodă / safety | motivul de PASS consemnat ca dovadă (negație recunoscută) | P-S06; cazul 3 v1 | — | — |
| GS-3 | stereotip contestat vs promovat; tipar incluziv ca bypass; dezaprobare narativă | safety | contestarea doar pe aceeași acțiune → REVIEW; incluziv pe altă activitate nu anulează | P-S39…41 | — | — |
| GS-4 | specia/capacitatea personajului | safety | canon/specie (acvatic) pentru regula de apă; context de pericol separat | P-S13; cazurile 5/6 v1 | — | — |
| GS-5 | verdict vs raționament | metodă | coduri de motiv structurate; verificarea motivelor în evaluarea Gold-v2 | toate | — | — |
| GS-6 | restricție contextuală clasificată drept stereotip | safety | restricție episodică/justificată cu gen → REVIEW (nu BLOCK, nu bypass) | P-S42 | — | — |
| GS-7 | morfologie, adverbe intercalate, parafraze | toate | lematizare EN sistematică; tulpini RO; clauze în loc de regex fix; familii de concepte | P-S05,09,10,31,32; P-C12,15,16,19 | — | — |
| GS-8 | obiect/acțiune/politică pentru arme | safety | identificare obiect (real/jucărie/fantastic/proiectil benign) + acțiune; politica nedefinită → REVIEW cu cod de politică | P-S14…21 | — | — |
| GS-9 | paritate EN↔RO; diacritice | safety | lexicoane paralele; normalizare care păstrează diacriticele pentru sens | P-S21…27 | — | — |
| GS-10 | intensitate emoțională și recuperare | safety / age | intensitate cumulativă RO+EN; recuperarea consemnată ca dovadă | P-S27…29 | — | — |
| GS-11 | vârsta = doar lungime | age | profil multidimensional (sintaxă, abstracție, temporal/cauzal, densitate, emoție) — semnale consultative | P-A01…03; cazuri v2 | — | — |
| GS-12 | duplicate, pseudo-acoperire, independența setului rezervat | gold infra | detecția duplicatelor exacte/normalizate/apropiate, metadate, axe de independență, sigiliu | constructorul Gold-v2 | — | — |
| GS-13 | fidelitate SOURCE↔TARGET; recall tokenuri netraduse | localization | verificare de fidelitate pe lexicon bilingv (acțiuni, obiecte, negație, adăugări, omisiuni); tokenuri de conținut copiate din sursă | P-L01,02,04,05 | — | — |
| GS-14 | „are” românesc marcat ca englezesc | localization | identificarea contextuală a limbii (tokenuri comune ambelor limbi = ambigue, decise de context) | P-L03 | — | — |
| GS-15 | taxonomie / identitatea entității | science | rezolvarea referentului (păsări, pterozauri, canon) | P-C01…04 | — | — |
| GS-16 | co-apariție ≠ relație | science | relație om–dinozaur (interacțiune vs mediere prin fosile/muzeu); entități umane extinse sistematic | P-C05…08 | — | — |
| GS-17 | atribuire, poziție narativă, corectare | science | credință atribuită + corectare explicită → fără defect; corectare ulterioară → REVIEW (politică nedecisă) | P-C09…13, P-C18 | — | — |
| GS-18 | dovadă prezentă ≠ suport; încredere în critic | quality | strat de validitate a dovezilor (absentă, refolosită, relevanță neverificată), separat de verdictul porții | P-Q01, P-Q02 | — | — |
| GS-19 | prag pe valoarea rotunjită; respingeri fără motiv / motiv parțial | quality | decizie pe media exactă; un cod de motiv pentru fiecare condiție activă | P-Q03…06 | — | — |
| GS-20 | circularitate etichetă ↔ politică | gold infra / quality | sursa etichetei pe caz; cazuri fără etichetă pentru politici nedecise; gardă de validare | constructorul Gold-v2 | — | — |
| (arh.) | garda nu impune hardening-ul | acceptance | stare de validare separată: adjudecare ≠ validare ≠ acceptare | teste de gardă | — | — |
| (arh.) | formatul depinde doar de critic | quality | validator determinist: număr de pagini, secvență | cazuri v2 | — | — |
