# Capacitate și admitere (P8-T04)

Măsurat cu `scripts/enterprise/capacity-bench.mjs` pe **acest host** (Linux, 4 vCPU Xeon 2,8 GHz, 16 GB RAM, Node 22),
cu furnizorii simulați — **nu este debitul real AI** și nu este hostul de referință al clientului. Dovezile brute:
`docs/enterprise/baseline/CAPACITY.json` (1/10/100 proiecte arhivate + o colecție activă 6×12 cu 3 variante, local și
PostgreSQL) și `CAPACITY-REAL-ASSETS.json` (imagini de 1,6 MB, ca referințele DW).

## Ținte propuse vs măsurat

| Țintă (arhitectură) | Măsurat (p95, cel mai rău caz din toate seturile) | Verdict |
|---|---|---|
| Citire API < 1 s | 38,5 ms (secvențial, 8 clienți concurenți și în timp ce Dali răspunde în paralel) | atins |
| Mutație locală < 2 s | 8,5 ms (comentariu) / 7,1 ms (commit de proiect cu revizie) | atins |
| UI vede evenimentul ≤ 2 s | 150 ms (fluxul de evenimente, după mutație) | atins |
| Imagini lente + Dali în timpul producției (test) | citiri p95 sub 1 s; textul volumului 2 nu se pregătește înaintea pilotului | atins |

| Set | Pornire | RSS (vârf) | Date | Per proiect | Plan de pagină (server) |
|---|---|---|---|---|---|
| local, 100 arhivate | 6,4 s | 210 MB (228) | 128 MB | 1,3 MB (asseturi de 8 KB) | p95 ≈ 20–36 ms |
| PostgreSQL, 100 arhivate | 7,3 s | 328 MB (454) | 94 MB fișiere + 27 MB DB | 1,2 MB | p95 ≈ 20–31 ms |
| local, imagini reale (3 + activ) | 1,2 s | 145 MB | 1,1 GB | **≈ 275 MB** per colecție ilustrată | — |

Pornirea crește liniar cu numărul de proiecte (depozitul încarcă toate proiectele la start).

## Constatare și remediere: blocarea la backup

O copie coerentă (manuală sau zilnică) ține lacătul de stocare; mutațiile primite între timp sunt **refuzate explicit
(409, „Se salvează o copie coerentă…”)** — nimic nu se pierde și nimic nu este confirmat fals, dar fereastra creștea
liniar cu datele (măsurat: 35 s la 128 MB; la ~250 MB per colecție ilustrată ar fi fost minute).

**Remediere (P8-T04): backup incremental cu legături fizice.** Un fișier neschimbat față de backupul anterior (aceeași
cale, mărime, mtime) este legat (hard link) de copia lui imuabilă și își păstrează hash-ul; doar fișierele schimbate se
copiază și se hash-uiesc. Fiecare backup rămâne un folder complet, verificabil și restaurabil independent; restaurarea
copiază (datele vii nu împart inodul cu backupul); retenția (ștergerea celor vechi) nu atinge backupurile noi. Compromisul
inodurilor comune este limitat de o copie completă cel puțin săptămânală (`WP_SNAPSHOT_FULL=1` forțează una), iar copia
din al doilea folder este întotdeauna independentă.

| Set | Backup complet (lacăt) | Backup incremental (lacăt) | Copiate |
|---|---|---|---|
| imagini reale, 1,1 GB | 13,5 s | **0,5 s** | 11 fișiere |
| local, 100 arhivate (35 000 fișiere mici) | 19,9 s | 7,9 s | 11 fișiere |
| PostgreSQL, 100 arhivate | 12,4 s | 4,4 s | 0 fișiere (+ baza) |

La multe fișiere mici rămâne costul per fișier (stat + legătură); backupul zilnic rulează oricum numai când nu lucrează
niciun proiect.

## Dimensionarea retenției

- Fără incremental: 14 copii zilnice complete = 14 × datele (măsurat: 1,1 GB → ~15 GB; 10 colecții ilustrate ≈ 2,75 GB → ~38 GB).
- Cu incremental și o copie completă pe săptămână: în fereastra de 14 zile stau cel mult ~3 seturi complete + modificările
  zilnice → **≈ 3 × datele + diferențele** (10 colecții ilustrate: ~8–9 GB în loc de ~38 GB).
- Dinosaur World: arhiva de referință are 3,6 MB (texte + 2 imagini de 1,6 MB); ilustrațiile finale nu există încă, deci
  dimensiunea reală DW este estimată din imaginile de referință (≈ 275 MB per colecție ilustrată, ca în setul cu imagini reale).

## Admitere

- **Spațiu liber**: un proiect pornește numai dacă folderul de date și cel al fișierelor finale au cel puțin spațiul minim
  (implicit 2 GB; Setări › `PUT /api/settings/admission` sau `WP_MIN_FREE_MB`); în timpul rulării verificarea se repetă
  înaintea fiecărei etape și proiectul intră pe pauză cu mesajul clar, nu la jumătatea unei etape. `/api/health` devine
  „degraded” (fără căi). Un spațiu necunoscut nu blochează.
- **Un singur proiect activ** (protejat): nu există coadă de proiecte — al doilea este refuzat sau trece „în așteptare”
  explicit; pregătirea în avans este limitată la textul volumului următor, după pilot, și se oprește odată cu proiectul.

## Ce nu este măsurat

Debitul real al furnizorilor AI și latența lor (separate de aplicație), randarea PDF în browser (P6-T05), hostul de
referință al clientului, mai multe procese/tenanți (P9).
