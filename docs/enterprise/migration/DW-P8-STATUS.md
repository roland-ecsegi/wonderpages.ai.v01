# Dinosaur World — starea upgrade-ului real (P8-T05 / P8-T06)

Generat de `node scripts/enterprise/dw-status.mjs --out=docs/enterprise/migration/DW-P8-STATUS.json` pe o **copie**
(arhiva originală din `reference/` este read-only; hash-ul ei este verificat înainte și după).

## Ce rulează deja în aplicația implementată (fără furnizor, fără decizii)

| Pas | Rezultat |
|---|---|
| Dry-run + migrare în instalare separată | `committed`; 6 artefacte păstrate identic, 0 schimbate, 0 pierdute; noi: `canon_typed`, `migration_report`, versiuni fixate, sursa brută |
| Constatări | DW01 (premisa V1 vs paginile 8–9), DW02 (tipurile de întoarcere plan vs manuscris) — opțiuni și recomandare, **decizia operatorului** |
| Aprobări | 0 după migrare (nicio aprobare inventată) |
| Poarta pilotului (P4-T05) | doar V1 permis; V2–6 blocate până la acceptarea pilotului |
| Pachet Enterprise dus-întors (P8-T06) | 8 artefacte identice (hash de conținut), sursa brută identică, proiect nou, aprobări în așteptare, stare `ready` |
| Originalul | SHA-256 neschimbat |

## Ce blochează finalizarea (nu se simulează)

1. **DW01 / DW02** — alegerea reconcilierii (operator).
2. **Porțile de revizuire** — aprobarea canonului, a textului și a demo-ului (decizii creative ale operatorului).
3. **Furnizor real verificat** — Claude Pro / Canva Pro în aplicația operatorului, sau schimbul manual pentru ieșirile V1. În această sesiune nu există furnizor real verificat; ieșirile simulate nu sunt dovezi DW.
4. **Acceptarea pilotului V1** — deblochează V2–6.
5. **V2–6** cu edițiile EN+RO și colorat, QA de colecție, verificările de release; pregătirea pentru tipar rămâne „necunoscută” până la o probă fizică.

## P8-T06 — ce este și ce nu este demonstrat

- **Demonstrat:** pachetul Enterprise v2 se exportă și se reimportă fără pierderi, cu aprobările în așteptare; aplicația
  generică nu conține specificul DW (test static; faptul canonic DW este în `seeds/canon-facts.json`, adaptorul de
  migrare este separat în `server/migration/`); același flux rulează alte teme pentru 5–6 și 7–8 până la poarta colecției.
- **Nedemonstrat (blocat de P8-T05):** comparația oarbă înainte/după pe paginile V1 (nu există artă „după”, deci nicio
  diferență vizuală nu este raportată), regresiile cele mai grave, transferul negativ, piloții noi cu ieșiri reale.
  Ieșirile pentru temele noi provin din furnizori simulați: demonstrează genericitatea fluxului, nu calitatea.
- Fixtura evaluatorului (`server/quality/evaluation.js`) conține un text-eșantion al setului de aur; este dată de
  calibrare citată de răspunsurile de aur, nu logică de producție.
