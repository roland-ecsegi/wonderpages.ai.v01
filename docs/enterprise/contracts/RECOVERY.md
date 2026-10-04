# Recuperare, backup/restore și runbooks (P8-T02)

## Ce s-a schimbat

| Zonă | Comportament |
|---|---|
| Manifestul backupului | pe lângă inventar (cale + SHA-256 + mărime): `app` (versiunea aplicației, ediția, versiunea schemei) și `summary` (proiecte, decizii, joburi, versiuni de artefacte, asseturi, cunoaștere, release candidates, migrări; pe PostgreSQL și rândurile pe tabel). Formatul rămâne `version: 1`: backupurile vechi se citesc, retenția celor 14 zilnice rămâne. |
| Restaurare | refuză un backup dintr-o schemă mai nouă decât aplicația; o întrerupere înainte de înlocuirea datelor sau înainte de confirmarea bazei lasă datele curente neatinse; după restaurare: `recoveryReport` (fiecare fișier verificat prin hash, rânduri pe tabel, entități, versiuni de ambele părți), migrările reaplicate idempotent, apoi normalizarea. |
| Normalizare (`server/ops/recovery.js`) | aceeași la repornire și după restaurare: lucrul în curs devine reluabil (pauză sau așteaptă revizia), lease-urile sunt reconciliate (după restaurare **toate** lease-urile restaurate sunt moarte, indiferent de expirare); o unitate oprită după un apel extern fără rezultat confirmat devine **ambiguă** și nu se reia orbește. **Nimic nu pornește automat.** Aprobările și deciziile rămân cum au fost înregistrate: o restaurare nu acordă și nu retrage autoritate. |
| A doua copie | copia din folderul secundar este verificată prin hash; eșecul ei este raportat separat, backupul principal rămâne valid. |
| Migrare de proiect | un marker durabil „running” înaintea importului; la pornire, o migrare rămasă „running” (proces oprit) își elimină proiectul parțial și devine „interrupted”; arhiva sursă nu este atinsă, migrarea se reia din dry-run. |
| Migrare de schemă | PostgreSQL: o tranzacție per migrare (verificat: o migrare întreruptă nu lasă tabel parțial și nu este înregistrată); local: doar metadate scrise atomic. |

## Drill-ul (`scripts/enterprise/recovery-drill.mjs`)

Rulează pe o copie temporară, niciodată pe instalația reală. Ultima rulare: `docs/enterprise/baseline/RECOVERY-DRILL.json`
(20 de proiecte + un proiect migrat, 300 MB de asseturi incompresibile, local și PostgreSQL real).

| Țintă propusă (arhitectură) | Măsurat pe acest host | Verdict |
|---|---|---|
| Zero ACK pentru mutații nedurabile | eșec înainte de jurnal / înainte de COMMIT → comanda nu este confirmată și nu există | atins |
| RPO = 0 pentru date comise după crash local (disc/DB intacte) | commit jurnalizat dar neconfirmat → reaplicat la repornire; PostgreSQL: tranzacția nu lasă stare parțială | atins pentru datele comise |
| RPO dezastru ≤ 24 h cu backup zilnic | commit-urile de după ultimul backup **se pierd**: drill-ul le numără (3 din 3) și le raportează; fereastra este distanța până la ultimul backup | dependent de programul backupului; nu „zero pierderi” |
| RTO ≤ 2 h pe hostul de referință | 300 MB: restaurare + verificare + normalizare 4,3 s local / 5,3 s PostgreSQL (≈ 70 / 57 MB/s) | atins pe acest host; extrapolare liniară ≈ 400–500 GB în 2 h, **nemăsurat pe hostul de referință** |

Ce **nu** acoperă: defecțiunea simultană a hostului și a backupului (și a copiei secundare), discul degradat care
corupe și backupul, restaurarea pe alt sistem de operare. Furnizorii externi nu sunt restaurați: o lucrare ambiguă se
reconciliază manual.

## Runbooks

### Furnizor ambiguu (apel extern fără rezultat confirmat)
1. Activitate › unitatea „ambiguă”: verifică în contul furnizorului (Canva/Codex) dacă există rezultatul.
2. Dacă există: importă-l manual (schimb manual) sau reia acceptând consum posibil dublu (`resolve: retry`).
3. Dacă nu există: anulează (`resolve: cancel`) și reia etapa. Nimic nu se reia automat.

### Disc plin / baza de date indisponibilă
1. `GET /api/health`: `down` = baza nu răspunde (pornește Docker Desktop / PostgreSQL); `degraded` = folderul de ieșire nu se poate scrie sau lipsește o resursă.
2. Eliberează spațiu în afara folderului de date (exporturi vechi, `_backup` vechi peste retenție); nu șterge `data/`.
3. Repornește aplicația: jurnalul reaplică commit-urile pregătite, lucrul în curs devine reluabil.
4. Dacă datele sunt deteriorate: Setări › Backup › restaurează ultimul backup verificat; citește raportul de recuperare (fișiere, rânduri, entități); reia manual.

### Copia secundară (mirror) eșuează
1. Răspunsul backupului/livrării conține `mirror.error`; backupul principal este valid (verificat prin hash).
2. Verifică folderul secundar (montat, permisiuni, spațiu); rulează din nou backupul manual — copia trebuie să apară `verified: true`.

### Restaurare
1. Pune producția pe pauză (restaurarea refuză cât lucrează un proiect).
2. Restaurează: aplicația face întâi un backup de siguranță, apoi restaurează, verifică și normalizează.
3. Citește `recovery`: `ok`, `inventory.missing/changed`, `rowMismatch`, `newerTablesEmpty` (backup vechi), `versions`.
4. Nicio producție nu pornește singură; proiectele cu unități ambigue cer decizia ta.

### Actualizare etapizată (staged update)
1. Backup manual verificat înainte de actualizare.
2. Instalează versiunea nouă din pachetul cu `RELEASE-EVIDENCE.json` trecut (P8-T01); migrările se aplică aditiv, cu checksum.
3. Dacă pornirea eșuează: reinstalează versiunea anterioară; schema aditivă rămâne compatibilă înapoi; la nevoie restaurează backupul de dinainte (un backup din schemă mai nouă este refuzat de o aplicație mai veche — restaurezi backupul făcut înainte de actualizare).

**Dinosaur World:** arhiva originală (`reference/…`, read-only) și proiectul DW migrat se restaurează independent:
sursa brută din proiect are același SHA-256 ca originalul, raportul de migrare și proiecția tipizată (proveniența) sunt
recuperate, aprobările rămân resetate (testat în `tests/81-p8-recovery.test.mjs`).
