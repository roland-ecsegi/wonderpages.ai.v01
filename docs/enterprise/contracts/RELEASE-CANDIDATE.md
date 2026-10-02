# ReleaseCandidate și dovada comercială (P6-T06)

Un candidat de lansare leagă, pentru un volum și o destinație, **toate dovezile curente**:

| Element | Conținut |
|---|---|
| `snapshot` | versiunile exacte + hash-ul conținutului (brief, serie, distribuție, biblie, fișe, scenariu/text final/ediție nativă, toate paginile ilustrate) și referințele originale cu sha256 |
| `inventory` | fiecare ediție cerută (Poveste pe limbă, Colorat) + copertele separate la KDP |
| `receipts` | PDF-urile finale ale destinației: nume, sha256, amprentă, rezultatul inspecției independente |
| `readiness` | starea și hash-ul raportului P6-T05 |
| `rights` | eligibilitatea comercială (P1-T05) și blocajele |
| `disclosures` | nota AI din carte, licența fontului, cerințele canalului (KDP: declararea conținutului AI la publicare), regula probei |
| `proof` | separat: digital (`validated` doar cu pregătire PASS), tipar/platformă (`pending` → `accepted`/`rejected` numai cu referința probei) |

## Ciclu

`prepared` → `checked` (verificarea live trece) → `approved` (operatorul confirmă că a văzut previzualizarea reală; decizie
`release_candidate`) → `exported` (pachetul verificat + manifestul candidatului lângă arhivă; copia secundară are stare separată
și eșecul ei nu anulează exportul principal) → `verified` (pachetul și candidatul re-verificate).

## Verificarea (recalculată la fiecare citire)

`STALE_APPROVAL` (aprobarea curentă lipsește sau conținutul s-a schimbat după candidat), `STALE_REF` (referințe schimbate),
`EDITION_MISSING`, `COVER_MISMATCH`, `FILE_CHANGED`, `FILE_INTEGRITY`, `DESTINATION_NOT_READY` / `DESTINATION_UNMEASURED`,
`RIGHTS_MISSING` / `RIGHTS_UNKNOWN`. Orice problemă oprește aprobarea și exportul; previzualizarea rămâne disponibilă.

## API

- `POST /api/projects/:pid/release-candidates {volume, preset}` — creează și verifică.
- `GET /api/projects/:pid/release-candidates` — candidații cu verificarea live.
- `POST …/:id/approve {previewed: true, note}` · `POST …/:id/export` · `POST …/:id/proof {status, receipt: {reference, note}}`.

Pachetul intern, Drive și Canva își păstrează porțile existente (aprobare, inventar, hash-uri); drepturile comerciale sunt
raportate, nu presupuse. Acceptarea fizică/platformă nu se afirmă fără dovadă.

## Dinosaur World

Copia Enterprise primește un candidat cu raport înainte/după; arhiva originală rămâne intactă (sha256 neschimbat).
