# WonderPages AI — claude-gpt.v04 / 19.4.0

Data: 1 octombrie 2026, Europe/Bucharest. Scope: repararea afișării backupurilor și upgrade-ul editorial Dinosaur World, distribuit separat. Nu s-au schimbat abonamentele, dependențele sau mecanica aprobărilor.

## 1. Backup `.wbackup`

Cauza afișării `0 KB`: lista returna o dimensiune constantă pentru snapshotul complet. Acesta este un director care conține baza de date, documentele, imaginile și manifestul; nu un fișier SQL individual.

Implementare: `server/snapshot.js` măsoară recursiv fișierele efectiv prezente și raportează bytes/fileCount. `server/index.js` combină lista cu backupurile SQL existente. `public/app/core.js` formatează B/KB/MB/GB; `public/app/views.js` afișează dimensiunea și erorile. O dimensiune imposibil de citit este necunoscută, nu zero; o copie cu eroare de listare nu primește buton activ de restaurare. Copiile în lucru rămân excluse.

Formatul `.wbackup`, restaurarea, verificarea integrității, retenția și copia secundară sunt păstrate. Numele `backup-v03-*` identifică formatul compatibil introdus în v03, inclusiv când copia este creată în v04; nu reprezintă versiunea aplicației restaurate. SQL-urile vechi rămân disponibile.

Verificare: patru teste noi în `tests/13-backup-display.test.mjs`, inclusiv dimensiune reală prin API, fișiere adăugate, staging ignorat, director invalid și formatare. Cele șase teste snapshot existente verifică salvarea/restaurarea, atomicitatea, retenția și erorile copiei secundare.

## 2. Aplicație fără proiect preîncărcat

Distribuția completă v04 exclude datele, baza de date, proiectele utilizatorului, configurația privată și arhiva Dinosaur World. Instalarea nouă pornește cu zero proiecte. Tipurile de produs, agenții și funcțiile generale rămân disponibile.

Update-ul instalării existente păstrează proiectele deja importate. Nu șterge Dinosaur World existent și nu importă automat proiectul nou. Importul este o acțiune separată a utilizatorului, din Proiecte → Importă proiect (.zip).

Politica editorială generică citește dimensiunea colecției și regulile proiectului din contractul său; nu presupune o colecție anume. Turul inițial nu numește Dinosaur World drept proiect implicit. Identificarea ediției/versionării este centralizată în `package.json`, utilizată în API, manifestul livrării și clientul verificării cotei. Dependențele nu se reinstalează și versiunile lor nu se schimbă.

## 3. Dinosaur World: upgrade în datele proiectului

Arhiva: `app.kit.versions/projects/dinosaur-world-proiect.v04.zip`. Regulile și conținutul sunt în `project.json` și documentele ZIP-ului; referințele originale sunt în `files/uploads`. Generatorul de pregătire și probele QA sunt în folderul de analiză și nu fac parte din aplicație.

| Cerință | Conținut pregătit și verificare |
|---|---|
| Character Bible extins | Milo, Tia și Pip: rol, psihologie, dorință, frică, obiectiv, defect, calitate, relații, voce, vocabular, gesturi și identitate vizuală. Repere anatomice cu latură, ancoră, formă, culoare, dimensiune relativă și ocluziune. |
| Petele lui Milo | Trei pete corelate cu regiuni ale corpului, pe stânga anatomică a personajului. Poziția nu este o coordonată fixă a paginii. Raporturile propuse trebuie confirmate în planșele de referință. |
| Referințe și expresii | Cele două imagini originale sunt păstrate identic. Sunt specificate vederile/expresiile/pozele lipsă, inclusiv identitatea lui Pip. Nu sunt prezentate drept imagini deja produse sau aprobate. |
| Story Bible | Șase volume cu premise, obiective, obstacole, incident, escaladare, alegere culminantă, rezolvare, final și reguli ale lumii. Conflictele și contribuția fiecărui volum sunt distincte. |
| Paginare și page turns | 72 de momente planificate: 12 per volum, cu acțiune, emoție, informație nouă, contribuție vizuală, hook/payoff și scop pentru paginile liniștite. |
| Storyboard/text–imagine | Cadru, unghi, focalizare, mișcare, lumină și scopul compoziției. Pentru volumul 1 sunt pregătite și scenele, obiectele, continuitatea și zonele de text/layout. |
| Volumul 1 | Scenariu EN 335 cuvinte și draft RO 344 cuvinte, 12 pagini. Cauzalitate reparată, acțiuni anatomice realizabile, umor vizual, participare și final complet. Celelalte cinci volume sunt planuri editoriale, nu manuscrise finale. |
| Vârste și produse | Proiectul rămâne 3–4 ani; șase volume × carte de poveste și carte de colorat. Profilurile 3+/5+/7+ sunt progresive; bugetele de cuvinte sunt orientative și 7+ nu este forțat în chapter books. |
| Critică separată | Contract v15, exact 18 criterii și maximum două corecții automate pentru aceeași etapă. Revizia editorială inclusă citează pagini; nu înlocuiește criticul din pipeline sau aprobarea utilizatorului. |

Corecții concrete în poveste: sclipirea din apă este reflexia aceleiași pietricele; Tia ține frunza cu botul, conform anatomiei; adăpostul este necesar prietenilor, nu pietrei. Pana lui Pip este un obiect colecționat, fără schimbarea anatomiei sale. Fiecare personaj se întoarce la propria casă.

## 4. Import și aprobări

Proiectul importat apare Pregătit, fără pornire automată și fără aprobări inventate. Documentele, scenariul pregătit și referințele sunt păstrate. La Pornește lucrul, se produc referințele necesare și se deschide aprobarea colecției. După acceptarea utilizatorului, scenariul pregătit trece prin critica separată și continuitate, apoi se ajunge la aprobarea demo-ului. Celelalte opriri, corecturile pe pagină și regulile de livrare rămân cele existente.

Proba izolată a verificat import → aprobarea colecției → critică cu 18 criterii → aprobarea demo-ului, păstrarea textului pregătit, export/reimport cu aprobări resetate și refuzul livrării neaprobate (409). Furnizorii din această probă sunt simulați, exclusiv în QA; nu s-a generat artă reală și nu s-au consumat cote ale abonamentelor.

## 5. Module modificate și compatibilitate

Aplicație: `server/snapshot.js`, `server/index.js`, `server/config.js`, `server/output.js`, `server/subscription-usage.js`, `server/editorial.js`, comentariu în `server/projectpkg.js`, `public/app/core.js`, `public/app/views.js`, `public/app/ui.js`, metadata `package.json`/lockfile, `README.md`, `INSTALARE.md` și patru teste noi. Nu există rescriere de motor, schimbare de dependențe sau eliminare de funcții.

Proiect separat: `project.json`, `CITESTE-MA.md`, `REVIZIE-EDITORIALA.md`, manifest de integritate și cele două referințe originale. Conținutul specific Dinosaur World nu este introdus în codul runtime, blueprintul global, agenții generici sau seed-urile aplicației.

## FINAL REGRESSION TEST

- Build: PASS, 78 fișiere JavaScript plus JSON, lockfile, fonturi și resurse runtime. Lint-ul standard utilizează aceeași verificare de sintaxă/configurație; nu există TypeScript sau build frontend separat.
- Candidat final: **91/91 PASS, 0 FAIL, 0 SKIPPED**, aproximativ 156 secunde, toate testele existente plus patru teste noi. Furnizori simulați în date temporare; browser PDF real. `dovezi/v04-regression-final.log`. Instalarea efectivă a trecut **91/91 PASS, 0 FAIL, 0 SKIPPED**, aproximativ 157 secunde — `dovezi/v04-installed-regression.log`.
- Upgrade proiect: PASS — manifest/hashes, patru scheme, editorial completeness, 72 planuri, secvența de 12 pagini, import/critic/aprobări/export, identitatea byte-for-byte a referințelor. `dovezi/dinosaur-import-validation.json`.
- Instalare existentă: backup privat v03 DB+fișiere+sursă+configurație verificat înainte de update. Datele private nu se distribuie.

Limitări: atlasul nou, expresiile și ilustrațiile nu sunt încă produse/aprobate; fidelitatea geometrică se verifică pe imaginile efective. Volumele 2–6 au structură și planuri, dar se scriu în pipeline. Draftul RO se reverifică în adaptare. Nu s-au efectuat pilotul cu familii, tiparul sau publicarea. Acest update nu certifică statutul de bestseller.


### Verificarea instalării efective și livrarea finală

| Verificare | Rezultat și dovadă |
|---|---|
| Pornire/build/lint | **PASS** — ediție v04/19.4.0; build din instalare, 78 fișiere JS și resurse. Lint standard PASS în candidatul identic. Dependențele sunt neschimbate. |
| Regresie completă | **91/91 PASS**, candidat și instalare efectivă. Aprobare, corecturi locale color/lineart/text, istoric, producție/pauză, critică/retry, import/export, upload, PDF/livrare, backup/restore, învățare/atelier, securitate/LAN și erori. |
| Smoke API | **10 rute HTTP 200**, inclusiv proiectul existent, planul KDP, agenți, învățare, îmbunătățiri, backup și Canva read-only — `dovezi/v04-installed-smoke.json`. |
| Date/configurație | `.env`, cheia de criptare, imaginile și rândurile projects/project_blueprints/artifacts/comments/review_events comparate cu backupul inițial: **neschimbate**. Setările, LAN, modelele și preferințele agenților sunt păstrate. |
| Proiect existent | Dinosaur World rămâne v13, cu șase artefacte și două referințe. Upgrade-ul v04 **nu a fost importat automat** în instalarea reală. |
| Backup real | Cinci snapshoturi: aproximativ **3,4 MB** fiecare, numărul exact de bytes verificat pe disc și manifestele verificate SHA. Backup manual PostgreSQL+fișiere și copia secundară: **PASS**. SQL-urile istorice păstrate. `dovezi/v04-installed-backups.json`. |
| UI real | 10 ecrane × 375/768/1440 px, **fără overflow**, console fără warn/error. Setări afișează efectiv **3,4 MB**, nu 0 KB. `dovezi/v04-installed-web.json`. |
| Proiect separat | Scheme, integritate, conținut, referințe, import, prima aprobare, critic separat, demo, export/reimport: **PASS**, prin furnizori simulați numai în QA. Fără aprobare/deliverability inventată. |
| Distribuție curată | ZIP complet cu instalatorul standard Windows, hashes/CRC și pornire din sursa pachetului: **PASS**, zero proiecte la instalarea nouă. Exclude date, configurație privată, `.git`, `node_modules` și arhiva Dinosaur. `dovezi/v04-release-validation.json`. |

**Regresii introduse cunoscute:** niciuna în fluxurile verificate. În QA s-au corectat tipurile unor câmpuri ale datelor proiectului și etichetele de versiune rămase v03 înaintea instalării. Niciuna dintre acele stări intermediare nu a înlocuit instalarea funcțională. Avertismentul Node existent DEP0190 la lansarea legacy Claude pe Windows rămâne vizibil; nu a fost ascuns și nu este o eroare nouă de pornire.

**Verdict factual:** software-ul v04 este construit, testat, instalat și verificat. Configurația și datele existente sunt păstrate. Pachetul editorial separat este importabil și verificat; atlasul/ilustrațiile noi, manuscrisele finale 2–6, revizuirea umană, proba cu familii și proba fizică rămân etape ale producției, fără statut DONE. Niciun acces sau consum plătit suplimentar nu a fost activat.

Livrări: `app.kit.versions/wonderpages-ai.claude-gpt.v04.zip` și `app.kit.versions/projects/dinosaur-world-proiect.v04.zip`, fiecare cu SHA-256 alături. Aplicația include instalatorul Windows existent; proiectul nu suportă EXE/MSI separat.
