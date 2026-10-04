> **Actualizare v04 (19.4.0):** instalarea nouă pornește fără proiecte. Update-ul păstrează datele și configurația existente. Proiectele se distribuie separat și se importă explicit din Proiecte. Backupurile `.wbackup` arată dimensiunea reală a tuturor fișierelor; o dimensiune necunoscută este raportată explicit. Regulile actuale din README.md au prioritate față de instrucțiunile istorice de mai jos. Se păstrează abonamentele ChatGPT Plus, Claude Pro și Canva Pro, fără consum plătit separat.

# WonderPages.AI: instalare și acces din rețeaua locală

Totul rulează pe laptopul tău. Pentru text poți alege **Claude Pro** sau **ChatGPT Plus prin Codex CLI** pentru fiecare agent. Imaginile se fac cu **Canva Pro** sau, opțional, cu **ChatGPT prin Codex**. Aplicația nu folosește chei API plătite pentru aceste apeluri. v03 verifică limita inclusă înaintea apelului și oprește generarea când aceasta este epuizată sau necunoscută; nu cumpără și nu activează credite.

## 1. Ce îți trebuie (o singură dată)
1. **Windows 10 sau 11** cu drepturi de administrator.
2. **Docker Desktop**: descarcă-l de pe docker.com, instalează-l (acceptă WSL 2 dacă îl cere), repornește dacă ți se cere. În Docker Desktop: *Settings > General > Start Docker Desktop when you sign in* bifat.
3. Conturile tale: **Claude Pro**, **Canva Pro** și opțional **ChatGPT Plus** pentru agenți GPT sau imagini ChatGPT.

## 2. Instalarea aplicației
1. Dezarhivează `wonderpages-ai.zip` într-un folder permanent, de exemplu `C:\WonderPages\wonderpages-ai`. Nu-l lăsa în Descărcări.
2. Pornește **Docker Desktop** și așteaptă să scrie „Engine running”.
3. Dublu-clic pe **`instaleaza.bat`**. Ce face:
   - instalează Node.js dacă lipsește (atunci îl pornești din nou după ce se termină);
   - pornește baza de date în Docker;
   - la prima instalare generează o parolă nouă, aleatoare, pentru baza de date;
   - instalează componentele aplicației exact în versiunile testate (`npm ci`, din `package-lock.json`), inclusiv Codex CLI 0.159.0 folosit pentru textul GPT;
   - descarcă fontul cărților (Andika, licență liberă OFL) în `public\fonts`, ca PDF-urile să arate la fel și fără internet;
   - instalează Claude Code în versiunea testată și, opțional, Codex;
   - pune pornirea automată cu Windows (în fundal, fără fereastră) și scurtătura **WonderPages** pe Desktop.
4. La final, răspunde **D** pentru autentificarea Claude. Se deschide fereastra oficială: alegi contul Claude Pro, confirmi în browser, scrii `/exit` și închizi fereastra.
5. Deschide **WonderPages** de pe Desktop (sau `http://localhost:4321`).

## 3. Primele setări (în aplicație, pe laptop)
1. **Setări > Diagnostic > Rulează diagnosticul**: interpretează separat rândurile verificate, neconectate și necunoscute; autentificarea nu garantează disponibilitatea generării (baza de date, Claude, „fără API plătit”, folderul de livrare).
2. **Setări > Canva > Conectează Canva**: autorizezi în browser.
3. **Setări > Consum Canva**: pune ziua ta de facturare Canva și alocarea (verifici în Canva: *Setări > Facturare > Utilizare AI*).
4. **Setări > Fișiere finale**:
   - **Pe laptop**: folderul principal (**Răsfoiește…** ca să alegi);
   - **Copie și în**: dacă ai **Google Drive pentru desktop**, apasă **Copie în Google Drive**. Fiecare livrare se salvează și acolo și se sincronizează singură, fără configurare Google Cloud.
5. Opțional, ChatGPT pentru imagini:
   - **Setări > Motor de imagini > Autentifică ChatGPT**; alegi contul ChatGPT în browser;
   - apoi **Verifică** și **Testează o imagine**;
   - dacă testul nu reușește, rămâi pe Canva (e motorul implicit).
6. Conectarea Google Drive prin Google Cloud (README) e necesară doar dacă **nu** folosești Google Drive pentru desktop.

## 4. Importul opțional al proiectului Dinosaur World
1. **Proiecte > Importă proiect (.zip)** și alegi `dinosaur-world-proiect.v04.zip`, distribuit separat. Aplicația nu îl include și nu îl importă la instalare.
2. Proiectul apare **Pregătit**. Apasă **Pornește lucrul**: se păstrează referințele și documentele pregătite, se produc planșele necesare, apoi se deschide **Aprobarea seriei**. Revizuiești personajele, seria și regulile vizuale înainte de continuare. Scenariul pregătit al volumului 1 trece ulterior prin critica separată; nu este marcat drept carte finală.
3. Opțional, pentru antrenament: **Învățare > Pachete de antrenament > Importă pachet** cu `dinosaur-world-training.zip` (livrat anterior).

## 5. Acces de pe telefon, tabletă sau alt PC (aceeași rețea Wi-Fi)
1. Pe laptop, rețeaua Wi-Fi trebuie să fie **privată**: *Setări Windows > Rețea și internet > Wi-Fi > (rețeaua ta) > Tip profil de rețea: Privată*.
2. Dublu-clic pe **`activeaza-retea.bat`** și accepți întrebarea de administrator. Deschide portul aplicației (4321) doar pentru rețele private.
3. În aplicație, pe laptop: **Setări > Acces de pe telefon, tabletă sau alt PC**:
   - bifezi **Permite accesul din rețeaua locală**;
   - scrii un **cod de acces** lung (recomandat 10+ caractere, cu litere, nu doar cifre);
   - apeși **Salvează**.
4. Apasă **Cod QR pentru telefon**. Pe telefon (conectat la același Wi-Fi):
   - scanezi codul sau scrii adresa afișată, de exemplu `http://192.168.1.20:4321`;
   - introduci codul de acces.
5. Pe telefon, din meniul browserului: **Adaugă pe ecranul principal**. Aplicația se deschide ca una instalată.
6. Ca laptopul să rămână accesibil: *Setări Windows > Sistem > Alimentare > „Când e conectat la priză, trece în repaus după: Niciodată”*.

**Dacă pagina nu se deschide nici pe laptop:**
- Deschide `http://localhost:4321`: în timpul pornirii apare „WonderPages pornește…”, iar dacă ceva nu merge, pagina scrie motivul.
- Verifică Docker Desktop (Engine running, containerul `wonderpages-db` pornit).
- Pentru depanare: deschide un terminal în folderul aplicației și rulează `porneste.bat vizibil`. Fereastra arată tot ce se întâmplă (închiderea ei oprește aplicația). Trimite o captură dacă apare o eroare.

**Dacă nu merge din rețea:**
- Rețeaua e „Publică” în loc de „Privată”: schimb-o (pasul 1).
- Telefonul e pe rețeaua de oaspeți a routerului sau routerul are „izolare clienți” (AP isolation): folosește rețeaua principală.
- Adresa s-a schimbat după o repornire a routerului: redeschide **Cod QR** din Setări.
- Folosește adresa mare din Setări (sau codul QR). Adresele de la „Alte adrese ale laptopului” sunt ale unor adaptoare virtuale (VirtualBox, WSL, Docker) și nu merg de pe telefon. Poți rezerva adresa laptopului în router (DHCP reservation). Pe iPhone merge de obicei și `http://NUMELE-LAPTOPULUI.local:4321`.
- Ai schimbat `PORT` în `.env`: editează și `activeaza-retea.bat` cu același port.
- Doar de pe laptop: conectarea Canva, Claude, ChatGPT și Drive, setările, tipurile de produs, agenții și lecțiile, importurile, ștergerile, restaurarea bazei și atelierul de îmbunătățiri. De pe telefon: urmărești producția, comentezi, aprobi și pornești livrarea (PDF-urile se creează pe laptop).

**Siguranța accesului din rețea.** Legătura telefon–laptop folosește HTTP necriptat și un cod comun. Pornește accesul doar când îl folosești, nu-l folosi în rețele publice (cafenea, hotel) și schimbă codul dacă l-a aflat cineva (Setări > Deconectează toate dispozitivele). Pentru acces criptat, inclusiv din afara casei, o rețea privată de tip Tailscale e varianta recomandată; aplicația nu o configurează singură.

## 6. Folosire zilnică
- **Nu trebuie să ții nicio fereastră deschisă.** Aplicația rulează în fundal și pornește singură cu Windows (după ce Docker Desktop e gata).
- Scurtătura **WonderPages** de pe Desktop o deschide în browser; dacă aplicația nu rulează, o pornește întâi (fără fereastră de terminal). La fel face dublu-clic pe `porneste.bat`: fereastra care apare se poate închide.
- Dacă se oprește neașteptat, repornește singură în câteva secunde. Ca s-o oprești intenționat: dublu-clic pe **`opreste.bat`** din folderul aplicației.
- Jurnalul tehnic, util la depanare, e în `wonderpages.log` din folderul aplicației.
- Laptopul trebuie să fie pornit, cu Docker Desktop pornit.
- **Un singur proiect lucrează odată.** „Pune pe pauză” e sigur (punct de salvare), „Continuă” pornește de acolo.
- Te ajută **Dali** (robotul turcoaz din dreapta jos).

## 7. Numele în Docker Desktop
În Docker Desktop aplicația apare ca proiectul **wonderpages**, cu containerul **wonderpages-db** și volumul **wonderpages_pg**.
Dacă aveai o instalare mai veche (numele „tiparnita”), `instaleaza.bat` mută automat baza de date sub numele nou, fără pierderi. Volumul vechi (`tiparnita-local_tiparnita_pg`) rămâne ca rezervă; după ce verifici că proiectele sunt acolo, îl poți șterge din Docker Desktop > Volumes.

## 8. Copii de siguranță și restaurare
- Baza de date și fișierele se salvează împreună zilnic, numai în repaus, în `_backup` din folderul fișierelor finale. Se păstrează 14 copii automate v03, fără eliminarea copiilor manuale/SQL istorice; al doilea folder configurat primește copia.
- **Setări > Copii de siguranță ale bazei:** „Fă o copie acum” și „Restaurează”. Restaurarea cere confirmare scrisă, salvează întâi starea de acum și repornește aplicația.
- Datele de conectare Canva și Drive sunt criptate cu cheia din `data\.secret-key`. Când muți aplicația pe alt calculator, copiază și folderul `data` (altfel reconectezi Canva și Drive din Setări).

## 9. Verificare după instalare sau actualizare
- **Setări > Diagnostic**: baza de date, Claude Code (și dacă e versiunea testată), fontul cărților, folderul fișierelor finale.
- **`npm test`** (într-un terminal deschis în folderul aplicației): pornește o copie temporară a aplicației cu servicii simulate și rulează testele automate (producție cap-coadă, aprobări, livrare PDF, import, Dali, atelier, securitate, optimizările din versiunea 19). Nu atinge proiectele tale și nu consumă din abonamente. La final scrie „Rezultat: N trecute, 0 picate”.

## 10. Actualizare la o versiune nouă
**Recomandat (etapizat, cu revenire):** pune producția pe pauză, fă un backup (Setări › Backup), oprește aplicația (`opreste.bat`), apoi într-un terminal deschis în folderul aplicației: `node scripts\actualizare.mjs --release=C:\cale\wonderpages-ai.vNNN.zip`. Scriptul verifică versiunea (manifest + poarta de release), păstrează `.env` și `data`, pornește codul nou de probă și revine singur dacă ceva nu merge; `node scripts\actualizare.mjs --rollback` anulează ultima actualizare. Apoi rulează `instaleaza.bat`. Pașii manuali de mai jos rămân valabili.

1. Pune proiectul care lucrează pe **pauză** (opțional: Activitate > Exportă proiectul).
2. Dezarhivează noua versiune peste folderul vechi **sau** într-un folder nou și copiază `.env` din cel vechi.
3. Rulează din nou `instaleaza.bat`. Oprește singur versiunea care rulează în fundal și o pornește pe cea nouă. Proiectele rămân în baza de date.
   - Dacă ai dezarhivat într-un folder nou, copiază și folderul `data` din cel vechi (imaginile proiectelor și cheia datelor de conectare).
   - De la 18.3: proiectele importate după actualizare cer din nou toate aprobările; proiectele existente nu sunt afectate.
   - De la v03: proiectele noi folosesc blueprintul v15 (cartele agenților, nota pe criterii, revizia țintită). Proiectele în lucru își păstrează regulile cu care au început și merg mai departe normal. Dacă ai modificat în Studio tipul „KIDs S&C”, modificările tale sunt înlocuite de versiunea 14: fă o copie din Studio („Duplică”) înainte de actualizare, dacă vrei să le păstrezi.
   - De la 19: instrucțiunile agenților pe care nu le-ai schimbat primesc automat noile carte; cele editate de tine rămân ale tale.
4. Dacă interfața pare pe jumătate actualizată: `opreste.bat`, apoi scurtătura WonderPages de pe Desktop.
