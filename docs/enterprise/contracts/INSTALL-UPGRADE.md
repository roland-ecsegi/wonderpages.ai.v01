# Instalare, actualizare etapizată și operațiuni comerciale de release (P8-T03)

## Pachetul
- `scripts/pachet-versiune.mjs` produce ZIP + `RELEASE-MANIFEST.json` (inventar sortat, SHA-256 per fișier) numai dintr-o
  poartă PASS (P8-T01); include `RELEASE-EVIDENCE.json`, `THIRD-PARTY-NOTICES.md` și instalatorul Windows existent.
- **Reproductibil**: un singur timestamp per release (al porții, sau `--at=` / `SOURCE_DATE_EPOCH`), ordine stabilă a
  fișierelor, câmpuri de dată ZIP în UTC → aceleași surse + aceeași dovadă dau aceiași octeți (verificat în test).
- **Licențe** (`scripts/enterprise/licenses.mjs`, verificare obligatorie `licenses` în poartă): toate dependențele de
  producție din lockfile sunt permisive (MIT, ISC, Apache-2.0, BSD-2/3); licențele duble au alegerea documentată —
  dompurify `(MPL-2.0 OR Apache-2.0)` → **Apache-2.0**, rgbcolor `MIT OR SEE LICENSE IN FEEL-FREE.md` → **MIT**,
  `(MIT OR Apache-2.0)` → MIT. Fiecare font are textul OFL lângă el (`public/fonts/OFL-Andika.txt`, preluat din depozitul
  oficial SIL; `OFL-InstrumentSans.txt`). Textul OFL al Andika însoțește și fiecare pachet livrat (`Extra/Licente/`).

## Actualizarea (`scripts/actualizare.mjs`)

```
node scripts/actualizare.mjs --release=<wonderpages-ai.vNNN.zip sau folderul dezarhivat>
node scripts/actualizare.mjs --rollback
```

| Pas | Regulă |
|---|---|
| Verificare | fiecare fișier al versiunii noi față de manifest (SHA-256); dovada porții PASS pentru exact aceste surse (digest); altfel nimic nu se schimbă (`release_corrupt`, `gate_not_passed`, `evidence_mismatch`). |
| Păstrat | `.env`, `data/` (proiecte, setări, agenți, chei), `node_modules/`, jurnale: hash-uite înainte și după (hash-uri protejate); o diferență oprește și reface. |
| Dependențe | un lockfile cu alte pachete oprește actualizarea (`dependencies_changed`); actualizarea dependențelor este un pas separat (`--allow-deps` → `npm ci`). O schimbare doar de versiune a aplicației nu contează ca schimbare de dependențe. |
| Aplicare jurnalizată | backup al codului curent în `_upgrade/previous-*`, jurnal `applying` → fișierele eliminate de versiunea nouă sunt șterse, cele noi copiate → `applied`. O oprire la mijloc se anulează la următoarea rulare. |
| Smoke | fișierele instalate = manifestul; ghidul de build trece; codul nou pornește pe un folder de date **gol și temporar** (`/api/health` ok, zero proiecte) — datele reale nu sunt atinse de smoke. |
| Revenire | orice eșec → revenire automată, verificată prin hash față de codul anterior; `--rollback` anulează manual ultima actualizare reușită (un nivel). |

Datele reale se migrează aditiv la următoarea pornire normală; fă un backup înainte (Setări › Backup). Pe Windows, după
actualizare rulează `instaleaza.bat` ca până acum (oprește versiunea din fundal, pornește versiunea nouă).

## Căi lungi (Windows)
Folderul de ieșire este refuzat dacă livrarea ar depăși limita de 259 de caractere (`outputPathCheck`: rezervă pentru
folderul proiectului, `Collection-Final/Canva/Volumul-06/` și numele fișierului); construcția pachetului verifică
fiecare cale reală înainte de publicare (`path_too_long`); Setări › Diagnostic arată lungimea curentă.

## Statut comercial (`commercialStatus`)
Pe dovezi și **specific destinației**: un candidat vorbește doar pentru destinația lui (digital / kdp / print); celelalte
sunt `not_evaluated`. Stări: `eligible`, `not_eligible` (cu motive: verificare eșuată, neexportat, validare digitală
lipsă, probă lipsă/respinsă, **chitanță învechită** — înregistrată pentru alt conținut, **export doar-sursă**),
`blocked_rights` (drepturi necunoscute sau neclarificate). Chitanța probei reține hash-ul conținutului pentru care a fost
dată. Nu este consultanță juridică și nu garantează acceptarea platformei.

**Dinosaur World:** nicio importare automată; operatorul actualizează o copie; pachetul final al proiectului este separat.
