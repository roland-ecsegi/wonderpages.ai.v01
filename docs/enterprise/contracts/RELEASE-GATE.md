# Poarta de release, dovezile și sănătatea aplicației (P8-T01)

Un pachet se produce **numai** dintr-o poartă de release trecută pentru exact sursele care se livrează.

```
node scripts/enterprise/release-gate.mjs [--skip-tests] [--out=dovezi.json]   # exit 1 dacă o verificare obligatorie nu trece
node scripts/pachet-versiune.mjs [--evidence=dovezi.json] [--output=dosar]     # fără --evidence rulează poarta completă
```

## Verificări obligatorii

| Id | Ce verifică | Pică atunci când |
|---|---|---|
| `build` | `scripts/build.mjs`: sintaxa tuturor fișierelor JS/JSON, nume globale duplicate în `public/app`, manifest = lockfile, fonturi și fișiere runtime | un fișier nu se încarcă, lipsește un font sau metricile lui |
| `contract` | ProductContract al fiecărui tip livrat (`blueprints/*.json`) | o regresie de contract (de ex. 11 pagini în loc de 12) |
| `resources` | fonturi + metrici măsurate (hash-ul fontului), codul comun de măsurare, setul de aur, contractele de rol, suita de teste | o resursă lipsește sau metricile nu corespund fontului instalat |
| `secrets` | santinela parcurge **fiecare fișier care s-ar livra**: secrete (chei Anthropic/OpenAI, tokenuri, chei private, URL-uri de bază de date cu parolă spre gazde ne-locale), fișiere private (`.env`, `data/`, `node_modules`, `.git`, backup, `.pem/.key`), fișiere temporare (`.log/.part/.tmp/.bak`, `.env.*`), legături simbolice | oricare dintre acestea |
| `tests` | suita completă cu mock-urile explicite (`tests/mocks/bin` primul în PATH, PDF real dacă există `BROWSER_PATH`) | un test pică; cu `--skip-tests` starea este `NOT_RUN` și poarta este **INCOMPLETE**, niciodată PASS |

Șabloanele documentate (`sk-test-must-be-stripped`, gazde `example.com`, URL-uri construite din `${…}`) nu sunt secrete.
Jurnalele locale de dovezi (`docs/enterprise/baseline/logs/`) se regenerează pe fiecare mașină și nu se livrează.

## Furnizorii sunt raportați separat

Poarta notează doar dacă `claude`/`codex` sunt instalate. Probele reale rulează în aplicație (Setări › Diagnostic), nu în
release și nu la fiecare commit: **nicio cheltuială la furnizori din CI**. Un furnizor absent nu blochează release-ul.

## Dovezile (`RELEASE-EVIDENCE.json`)

Schema `wonderpages.release-evidence/1`: `checks` (ce a rulat efectiv, cu stare și detaliu), `providers` (separat),
`source` (digest SHA-256 peste calea + conținutul fiecărui fișier livrat) și `versions`:

- **cod**: commit, versiunea pachetului, ediția; tipurile de produs (slug, versiune, sha256 al blueprintului);
- **scheme**: contract, plan de pagină, readiness, QA colorat, inspecția PDF, cunoaștere, release candidate, bază de date (migrări), metrici font, decizii;
- **politici**: siguranță, politica de calitate activă, regulile de print (versiune + data înregistrării), criteriile de maturitate, eficacitate, evaluator, setul de aur (versiune + număr de cazuri);
- **unelte**: Node, npm, dependențe, `testedWith`.

`pachet-versiune.mjs` refuză pachetul când poarta nu este PASS sau când dovada dată cu `--evidence` are alt digest decât
sursele curente (o modificare după poartă invalidează dovada). Copia de pregătire este scanată din nou de santinelă, apoi
`RELEASE-EVIDENCE.json` intră în pachet, iar `RELEASE-MANIFEST.json` reține starea porții, digestul și versiunile.

## CI

`.github/workflows/ci.yml` rulează poarta doar la declanșare manuală (`workflow_dispatch`), fără secrete, și păstrează
`release-evidence.json` ca artefact.

## Sănătatea aplicației (`GET /api/health`)

Schema `wonderpages.health/1`. `app.status`: `ok` (baza de date, folderul de ieșire și resursele obligatorii funcționează),
`degraded` (lipsește o resursă sau folderul nu se poate scrie), `down` (baza de date nu răspunde → HTTP 503).
`providers` are stări grosiere: `available`, `limited`, `needs_login`, `absent`, `unknown` — **un furnizor limitat lasă
aplicația sănătoasă**: producția așteaptă, aplicația rămâne utilizabilă. Răspunsul nu conține căi, emailuri, chei, gazde
sau texte de eroare brute (orice stare neașteptată devine `unknown`).

**Dinosaur World:** un release care ar conține DW trece prin aceeași poartă; nu există excepții pentru proiectul migrat.
