# Remedierile auditului extern — versiunea 18.3

Fiecare constatare din „Raport de audit extern” și din „Raport de testare și validare” (28 septembrie 2026), cu locul unde a fost reparată și cum o verifici tu. Testele automate: `npm test` (27 de verificări, toate trec).

| ID | Constatare | Stare | Unde | Cum verifici |
| --- | --- | --- | --- | --- |
| C1 | Execuție de comenzi și scriere oriunde pe disc prin `code` dintr-un proiect importat | reparat | `server/projectpkg.js`, `server/output.js`, `server/sanitize.js` | `npm test` (testele „C1”); importă un proiect: intră „Pregătit”, fără aprobări |
| C2 | XSS stocat, fără CSP, fișiere .html servite ca pagini | reparat | `public/app/*.js`, `server/index.js` (CSP, fișiere), `public/login.js` | `npm test` („C2”); în browser, F12 > Network > antetul `Content-Security-Policy` |
| C3 | Setări sensibile modificabile din rețea | reparat | `server/index.js` (`localOnly`) | de pe telefon, Setări: schimbările se fac doar de pe laptop |
| H1 | Livrare/import fără verificarea aprobărilor; poartă închisă fără aprobarea elementelor | reparat | `server/engine.js` (`decide`, `volumeApproved`), `server/index.js`, `server/output.js` | „Aprobă” e inactiv până aprobi toate elementele; livrarea unui volum neaprobat e refuzată |
| H2 | Google Drive cu acces complet; tokenuri în clar (și în backup) | reparat | `server/gdrive.js` (`drive.file`), `server/secrets.js`, `server/canva.js` | în backup (`_backup/*.sql`) tokenurile apar criptate; reconectează Drive o dată |
| H3 | Atelierul AI putea citi `.env`, rescrie scripturi de pornire, verificare doar de sintaxă | reparat | `server/improve.js` | o îmbunătățire arată „Test de pornire” în verificări; `.bat`/`.vbs`/`package.json` sunt refuzate |
| H4 | Rețea: HTTP, cod comun, sesiuni de 30 de zile, blocare pe IP | **deschis** | `server/lan.js` (neschimbat) | vezi mai jos |
| M1 | OAuth `state` verificat slab | reparat | `server/gdrive.js`, `server/canva.js` | `npm test` („M1”) |
| M2 | Arhivă-bombă, corpuri mari, Dali fără limită | reparat | `server/training.js`, `server/index.js`, `server/assistant.js` | `npm test` („M2”) |
| M3 | Dependențe nefixate, fără lockfile | reparat | `package.json`, `package-lock.json`, `instaleaza.bat` (`npm ci`, Claude Code 2.1.268) | Setări > Diagnostic > „Versiune Claude Code testată” |
| M4 | Fără teste livrate; atelierul verifica doar sintaxa | reparat | `tests/`, `npm test`, `server/improve.js` | `npm test` |
| M5 | Codex: „cel mai nou fișier” dintr-un folder comun | reparat | `server/codeximage.js` (coadă + doar fișierul nou) | proiect cu motorul ChatGPT |
| M6 | `CANVA_CONCURRENCY` dublat (se aplica 2) | reparat | `.env.example`, `server/config.js` (ultima valoare + avertisment) | Setări > Diagnostic arată cheile dublate din `.env` |
| M7 | Backup fără restaurare, necriptat, pe același disc | reparat | `server/output.js`, `server/index.js`, Setări | Setări > Copii de siguranță > Fă o copie acum / Restaurează |
| M8 | WCAG 2.1 AA: contrast, tastatură, dialoguri, etichete, mesaje | reparat | `public/index.html` (culori, focus), `public/app/*.js` | Tab de la începutul paginii: „Sari la conținut”; Enter pe rombul din cronologie |
| M9 | „Aprobă tot” fără confirmare; tasta „a” aprobă | reparat | `public/app/actions.js`, `public/app/ui.js` (Shift+A) | „Aprobă tot ce a rămas” deschide o confirmare |
| M10 | Validatorul din Studio respingea tipul implicit | reparat | `public/app/views.js` | Tipuri de produs > KIDs S&C > Validează |
| M11 | Client într-un singur fișier de 254 KB | parțial | `public/app/` (5 fișiere pe responsabilități) | — |
| L1 | Google Fonts din internet; fontul cărților depindea de internet | reparat | `public/fonts/`, `instaleaza.bat` (descarcă Andika) | Setări > Diagnostic > „Fontul cărților (Andika)” |
| L2 | Mesaje interne de eroare trimise clientului | reparat | `server/index.js` | — |
| L3 | Parolă de bază de date implicită | reparat (instalări noi) | `instaleaza.bat` | la o instalare nouă, `PG_PASSWORD` din `.env` e aleatoare |
| L4 | `opreste.bat` oprea orice proces de pe port | reparat | `opreste.bat` | — |
| L5 | Cod rămas de la varianta cu API | reparat | `server/config.js`, `server/index.js`, `package.json`, Setări | — |

## Rămase deschise, cu motivul
- **H4 (autentificarea din rețea).** Logica de sesiuni și blocare din `server/lan.js` a rămas neschimbată în această versiune. Până la o remediere dedicată: pornește accesul din rețea doar când îl folosești, folosește un cod lung, nu-l folosi în rețele publice și, pentru acces criptat, o rețea privată de tip Tailscale.
- **M11 (împărțirea clientului).** Codul e împărțit în 5 fișiere, dar nu în module cu teste proprii. ESLint și Prettier nu au putut fi instalate în mediul de lucru.
- **În afara codului:** analiza juridică a abonamentelor, volumul-pilot, trecerea la SQLite, textul vectorial în PDF, contrastul ștampilei de copertă (element de design al cărții).

## Versiunea 19
Planul de optimizare a agenților (32 de îmbunătățiri, cost zero) e descris în `docs/IMPLEMENTARE-v19.md`. Testele: `npm test` (49), dintre care 22 noi în `tests/4-optimizare.test.mjs` și `tests/5-invatare.test.mjs`.

## De știut la actualizare
- Tokenurile Canva și Drive se criptează automat la prima pornire. Cheia e în `data/.secret-key`: dacă muți aplicația, copiază și folderul `data`.
- Google Drive prin Google Cloud cere acum acces doar la fișierele create de aplicație: reconectează Drive o dată; încărcările merg în folderul „WonderPages.AI”. „Al doilea folder” (Google Drive pentru desktop) funcționează ca înainte.
- Proiectele importate după actualizare cer din nou toate aprobările.
