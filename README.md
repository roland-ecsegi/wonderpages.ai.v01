# WonderPages AI — claude-gpt.v04

Versiune software: **19.4.0**. Atelier editorial local pentru colecții de **șase volume**, fiecare cu **carte de poveste și carte de colorat distincte**. Vârstele 3+, 5+ și 7+ și profilurile proiectelor existente sunt păstrate. Numărul scenelor, paginile fizice și coperta sunt concepte separate.

**v04:** lista `.wbackup` măsoară dimensiunea reală a fișierelor, inclusiv manifestul; B/KB/MB se afișează fără un zero fictiv. O eroare de citire este vizibilă ca dimensiune necunoscută. Formatul, restaurarea, copiile SQL și retenția sunt păstrate. O instalare nouă pornește fără proiecte preîncărcate; un update păstrează proiectele proprii existente. Proiectele editoriale se importă separat prin Proiecte → Importă proiect (.zip); detaliile lor nu sunt introduse în motorul aplicației.

## Instalare și utilizare

Pe Windows, vezi **INSTALARE.md** și rulează `instaleaza.bat` pentru o instalare nouă. Sunt necesare Node.js 20–24, Docker Desktop/PostgreSQL pentru configurația standard și autentificările proprii. Dependențele sunt fixate în `package-lock.json`; `npm ci`, apoi `npm start`. Deschide http://localhost:4321. Nu înlocui `.env`, `data`, volumele Docker sau fișierele finale la un update.

1. Creează proiectul: temă, vârstă, limbi, stil, format și referințe. „Pregătit” înseamnă că nu a început producția.
2. Pornește lucrul. Pauza și reluarea păstrează pașii încheiați și rezultatele utile.
3. Revizuiește colecția, demo-ul și elementele finale. Aprobările aparțin versiunilor concrete. Lipsurile și evaluările necunoscute blochează finalizarea.
4. Ajustează sau rescrie un element, editează manual, încarcă o corectură, compară și restaurează versiuni. O înlocuire exactă neambiguă nu consumă AI. O modificare creativă cere reaprobare.
5. Acceptă culoarea corectată înainte de derivarea paginii de colorat. Corectarea numai a coloratului păstrează culoarea aprobată.
6. Validează volumul 1, inclusiv cele opt verificări ale cărții, înainte de volumele 2–6. Evaluările AI nu certifică interesul copilului sau reacția părintelui.
7. Livrează produsul în profilul ales. Previzualizările sunt separate de PDF-urile finale; fișierele depășite nu pot fi distribuite drept finale.

## Abonamente și limite

Se folosesc exclusiv **Claude Pro, ChatGPT Plus și Canva Pro**, fără chei API facturate separat, cumpărare de credite sau upgrade. Claude Code folosește autentificarea abonamentului. Textul și imaginile ChatGPT folosesc componenta Codex **0.159.0 inclusă în aplicație**, cu autentificare ChatGPT și chei API eliminate din proces. Înaintea fiecărui apel Codex se citește cota oficială: cotă epuizată sau neverificabilă → oprire, chiar dacă există un sold de credite. Aplicația nu schimbă setările de facturare ale contului; utilizarea concurentă a contului poate modifica cota între verificare și apel.

Autentificarea și generarea verificată sunt afișate distinct. Limitele Claude reale și resetarea sunt raportate; bugetele locale nu sunt solduri oficiale. Pentru Canva soldul real rămâne „necunoscut”, estimarea locală este etichetată și atingerea bugetului oprește generarea. Funcțiile incluse pot fi folosite manual în ChatGPT/Canva, apoi rezultatul se încarcă pentru revizuire. O corectură exactă nu declanșează învățare AI ascunsă; consolidarea imediată cere opțiune explicită.

## Machetă, PDF și publicare

Textul rămâne editabil și selectabil în PDF, cu fonturile Andika locale încorporate și diacritice. Imaginile sunt incluse PNG, fără compresia JPEG a lineartului. Textul prea mare pentru zona aleasă produce eroare; fontul nu este micșorat arbitrar. Familiile acțiune/dialog/surpriză/panoramă/intimitate și zonele sus/jos/stânga/dreapta sunt editabile; compoziția imaginii se planifică în storyboard.

- **Digital** este implicit: 12 scene + coperțile pentru produsul existent. Nu pretinde 300 DPI.
- **Tipar generic** păstrează formatul existent cu bleed de 3 mm și verifică rezoluția sursă; se adaptează cerințelor tipografiei. Nu este certificare PDF/X/CMYK.
- **KDP**: interior și copertă distincte; pentru 12 scene, 28 pagini de poveste și 26 de colorat, cu verso liber la colorat. Bleed de 0,125 inch și surse de minimum 300 DPI. Coperta folosește grosimea pentru culoare premium/alb-negru pe hârtie albă, spațiu pentru barcode și fără text pe cotor sub prag. Verifică șablonul și proba fizică înainte de publicare. Nu se publică automat.

## Date, compatibilitate și backup

Proiectele existente își păstrează contractele v13/v14 și materialele. Contractul editorial **v15** se aplică proiectelor noi. Schimbarea unui proiect existent este explicită și reversibilă din bible: păstrează conținutul, salvează contractul anterior și reface aprobările. Detaliile necunoscute nu sunt inventate.

Backupurile v03 `.wbackup` sunt directoare cu baza de date și fișierele împreună, inventar SHA-256 și verificare înainte de restaurare. Copia zilnică rulează numai în repaus, după salvarea registrelor; dacă producția este activă, reîncearcă ulterior. Se păstrează 14 copii zilnice v03 și toate copiile manuale/SQL istorice; copia secundară configurată este păstrată. O întrerupere nu creează un backup valid, iar un backup existent nu se suprascrie. Urmărește spațiul disponibil. Restaurarea salvează o copie de siguranță și necesită repornire pentru reîncărcarea tuturor conexiunilor și configurațiilor. Backupurile SQL istorice rămân utilizabile, dar nu includ toate imaginile. Cheia `data/.secret-key` și autentificările nu se distribuie în release.

Accesul LAN și administrarea locală sunt păstrate. HTTPS este opțional prin `WP_TLS_CERT`, `WP_TLS_KEY`, `WP_TLS_PORT` (implicit 4322); certificatul trebuie acceptat pe dispozitive. Fără certificat, LAN rămâne HTTP în rețeaua locală. Configurarea HTTPS nu deschide automat firewallul pentru 4322. Aplicația nu este un serviciu public cu conturi de familie.

## Funcții păstrate și verificări

Dali, agenții configurabili, învățarea, exemplele și calibrarea, pregătirea în avans, import/export proiect, referințele, Canva/brand templates, copia secundară, Google Drive, ștergerea controlată, îmbunătățirile și revenirea la modificări rămân disponibile. Nu s-a înlocuit frameworkul sau modelul de stocare.

`npm test`: 91 teste automate pe date temporare cu furnizori simulați; nu certifică un volum produs real. `npm run build` și `npm run lint`: verifică sintaxa JavaScript, JSON, manifestele, dependențele și resursele; proiectul nu are TypeScript sau transpiler. Cele 87 teste anterioare sunt păstrate; patru teste v04 verifică dimensiunea backupului, erorile de citire, lista API și afișarea. Pilotul editorial real, reacțiile părinților/copilului, proba de tipar și publicarea rămân verificări externe.

`npm run release:zip -- --edition=claude-gpt --version=04`: creează folderul complet și ZIP-ul, cu inventar SHA-256. `.env.example` conține numai exemple pentru instalare; `.env`, proiecte importate, datele utilizatorului, `.git`, cache-urile și `node_modules` nu sunt incluse. Instalatorul Windows standard este `instaleaza.bat`; proiectul nu are un format EXE/MSI separat.
