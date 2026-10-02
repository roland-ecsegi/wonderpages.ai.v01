> **Actualizare v03 (19.3.0):** regulile actuale din README.md au prioritate față de instrucțiunile istorice de mai jos. Abonamentele sunt ChatGPT Plus, Claude Pro și Canva Pro. Nu se continuă pe consum plătit separat. Digital este profilul implicit; KDP separă interiorul de copertă și cere rezoluția sursei. Backupul v03 păstrează DB și fișierele împreună. Proiectele vechi nu se migrează automat. Aprobarea unei corecturi creative cere revizuirea rezultatului. Generarea reală completă, reacția părintelui/copilului și tiparul nu sunt demonstrate de testele automate.

# Ghidul aplicației WonderPages.AI (pentru Dali, asistenta din aplicație)

Acest ghid se actualizează la fiecare versiune. Asistentul îl citește la fiecare mesaj.

## Ce face aplicația
Creează colecții de cărți pentru copii: 6 volume, livrate pe rând. Un volum = carte de colorat (fără text) + carte de povești în fiecare limbă aleasă (engleză și/sau română). Fiecare carte are 14 pagini (copertă, 12 pagini, copertă spate). Textul îl scrie Claude (abonamentul Pro al utilizatorului, fără cost în plus), imaginile le face Canva.

## Pagini și ce găsești pe ele
- **Panou**: ce te așteaptă (revizuiri), ce e în lucru, ce e gata.
- **Proiecte**: toate proiectele, cu căutare și filtre (Toate, Așteaptă revizuirea, În lucru, Finalizate, Arhivate).
- **Proiect nou** (butonul „Proiect nou” sau „Nou” pe telefon): 1) alegi tipul de produs (KIDs S&C), 2) completezi formularul, 3) confirmi și pornești.
- **Pagina unui proiect** are tab-urile: Progres (cronologia interactivă a seriei și a celor 6 volume), Revizuire (aprobări pe elemente), Carte (previzualizare poveste / colorat / față în față, pe volume și limbi), Livrare (livrează volumul N, PDF-uri separate), Activitate (decizii, jurnal, arhivare, ștergere definitivă).
- **Agenți**: echipa de agenți AI, modelul fiecăruia (Claude Sonnet, Claude Haiku sau GPT-6-Sol prin Codex), regulile învățate și regulile scrise de tine. Poți combina modelele în același proiect.
- **Învățare**: cât aprobi din prima în timp, modelul tău de preferințe, variantele de prompt.
- **Îmbunătățiri**: lista de îmbunătățiri și probleme notate de tine (prin Dali sau direct), cu atelierul de rezolvare (vezi mai jos).
- **Dali**: asistenta din dreapta jos (robotul turcoaz). Explică aplicația, dă idei, completează formularul de proiect nou, notează îmbunătățiri.
- **Tipuri de produs**: reguli avansate ale produsului (JSON), pentru utilizatori avansați.
- **Setări**: Claude (verificare, autentificare), Canva (conectare), Google Drive, acces de pe telefon/tabletă (cod de acces, cod QR), consum Claude și bugetul pe 5 ore, notificări, folderul fișierelor finale, diagnostic.

## Formularul de proiect nou (KIDs S&C)
- **Tema proiectului** (obligatoriu): o descriere scurtă; AI-ul o extinde. Exemplu bun: cine e personajul, unde trăiește, ce descoperă, ce valoare transmite.
- **Vârsta țintă**: 3–4, 5–6 sau 7–8 ani (ghiduri orientative: 3–4 ani ≈ 150 de caractere pe pagină, puțină acțiune blândă, fără pericol).
- **Limbile cărților**: engleză și/sau română (implicit ambele; povestea se scrie în engleză și se adaptează natural în română).
- **Coperțile cărții în română**: în română (implicit) sau la fel ca în engleză.
- **Stil vizual**: 3D animat, catifelat (implicit) / Gouache pictat / Acuarelă.
- **Format pagină**: 8 × 10 in portret (implicit) / 8,5 × 8,5 in pătrat.
- **Titlu de lucru** (opțional), **Comentarii adiționale** (opțional: valori, lucruri de evitat).
- **Personajele tale** (opțional): imagini PNG/JPG/WebP cu personaje existente; devin referința pe fiecare pagină.
- **Povestea volumului 1** (opțional): lipești sau încarci (.md/.txt) povestea; volumul 1 pornește de la ea, 2–6 le scrie AI-ul.
- Opțiuni: generarea ilustrațiilor în Canva, verificarea vizuală a personajelor.

## Cum decurge un proiect
1. AI-ul pregătește seria → **Aprobarea seriei** (brief, arc, Biblia poveștii, distribuția, fișele de personaj).
2. Pentru fiecare volum: scenariu, editor critic, continuitate, demo (coperta + 2 pagini desenate) → **Aprobarea demo-ului**.
3. Text final, adaptare în română, editor nativ, toate ilustrațiile, verificare vizuală → **Aprobarea finală**.
4. **Livrarea**: în tab-ul Livrare, „Livrează volumul N” (merge și de pe telefon; PDF-urile se creează pe laptop).
5. Volumul următor pornește automat.

## Aprobarea pe elemente
Fiecare text de pagină și fiecare imagine (color și de colorat) are butoanele: **Aprobă**, **Modifică…** (Aprobă cu notă / Cere modificare / Refă de la zero). Sus: „Aprobă tot ce a rămas” și „Finalizează aprobarea” (ambele cer confirmare), „Aplică modificările”. Clic (sau Enter) pe o poză o mărește (rotița, + / −, tragere, ← → pentru următoarea, **Shift+A** aprobă, Esc închide). Dacă ceva se schimbă după aprobare, revine la „de decis”.
- O aprobare (a seriei, a demo-ului sau finală) se închide **doar după ce fiecare element e aprobat**; butoanele „Aprobă” și „Aprobă cu note” devin active abia atunci.
- Livrarea, pachetul final și trimiterea în Google Drive merg doar pentru volumele pe care le-ai aprobat final.

## Limite și sfaturi
- Totul rulează pe laptop; laptopul trebuie pornit, cu Docker Desktop.
- Consumul Claude are un buget pe 5 ore (Setări); la buget atins, proiectul face pauză și reia singur.
- Conectarea Canva / Drive / Claude și schimbarea folderului se fac doar de pe laptop.
- Notificările din browser merg doar pe laptop.
- Canva aplică limitele planului tău pentru imagini (~26 de imagini pe volum).

## Calitate: ce verifică aplicația singură
- **Verificarea vizuală** (Directorul artistic) verifică fiecare pagină pe patru dimensiuni: anatomie (de ex. fără mâini umane la un triceratops, numărul exact de pete și coarne), acțiune (cine ține frunza și cum), povestea paginii și lizibilitatea. După o redesenare, reverifică tot, nu doar defectul (ca să nu apară o greșeală nouă).
- **Paginile de colorat** sunt verificate fără să confunde marginile netezite cu umbrele, apoi sunt transformate în alb-negru pur, fără să li se schimbe desenul.
- **Lecțiile învățate** dintr-un proiect se aplică doar în acel proiect; tu decizi (în Agenți) dacă devin reguli pentru o vârstă sau pentru toate proiectele.
- **Registrul de lecții** din încercările tale anterioare (LL-001 … LL-035) e inclus ca reguli ale agenților.

## Pachete de antrenament
- În **Învățare > Pachete de antrenament** importi o arhivă .zip cu materiale reale (personaje, o poveste aprobată, imagini bune și greșite, lecții).
- Pachetul învață echipa: regulile lui, exemplele de text aprobat (pentru vârsta lui) și tiparele de greșeli din imagini (Directorul artistic le verifică explicit).
- Cu **„Pornește un proiect din pachet”** (sau din Proiect nou) formularul se completează cu tema, personajele și povestea volumului 1. Nimic nu e fixat în aplicație: pachetul se poate șterge oricând.
- Exemplu: pachetul „Dinosaur World (antrenament)” cu Milo și Tia.

## Canva și limitele abonamentului Pro
- Canva Pro are o alocare lunară de AI care se reînnoiește la data de facturare. După ce o consumi, Canva permite generarea în continuare, dar cu pauze scurte între sarcini.
- Aplicația face o imagine odată, numără generările lunii și, după alocare, trece singură în „ritm lent” (o imagine la câteva minute). Când Canva cere pauză, așteaptă și reia aceeași imagine; proiectul nu se oprește.
- În **Setări > Consum Canva** vezi câte generări ai folosit și setezi alocarea, ziua reînnoirii și pauza.
- Ca să consume mai puțin: demo-ul face o singură pagină de colorat; paginile de colorat finale se fac abia după ce imaginile color au trecut verificarea; paginile demo aprobate se refolosesc.
- Un volum costă aproximativ 26–30 de generări Canva.

## Pornirea, pauza și un singur proiect odată
- Un proiect nou se **creează** (butonul „Creează proiectul”) și intră „Pregătit”. Lucrul începe când apeși **Pornește lucrul**, din pagina proiectului sau direct din lista Proiecte.
- **Doar un proiect lucrează odată** (resursele laptopului și abonamentele). Dacă pornești altul, aplicația îți spune ce proiect lucrează și îți oferă „Pune pe pauză și pornește acesta”.
- **Pune pe pauză** e sigur: pasul în curs se termină și se salvează, apoi se scrie un **punct de salvare** (etapă, câte elemente sunt gata, versiunile tuturor documentelor). **Continuă** pornește exact de acolo. „Oprește imediat” există doar pentru urgențe; elementul aflat chiar atunci în lucru se reface.
- După ce aprobi ceva, proiectul continuă singur doar dacă nu lucrează altul; altfel rămâne pe pauză până îl pornești.
- În bara din stânga vezi mereu ce proiect lucrează acum, cu buton de pauză. Punctele de salvare sunt în tab-ul Activitate.

## Export, import, ștergere
- **Exportă proiectul (.zip)** (tab-ul Activitate): tot proiectul, cu documente, versiuni, aprobări și imagini, pentru backup sau mutare.
- **Importă proiect (.zip)** (pagina Proiecte, doar de pe laptop): proiectul intră „Pregătit”; etapele deja lucrate se păstrează, dar **toate aprobările le refaci tu**: fiecare poartă se redeschide când ajunge lucrul la ea. Codul, starea și aprobările din arhivă nu sunt preluate (măsură de siguranță). Există un proiect pregătit „Dinosaur World”, cu Milo, Tia și Pip, arcul celor 6 volume și scenariul volumului 1.
- **Ștergerea definitivă** este în Proiect > Activitate, pentru orice proiect care nu lucrează, doar de pe laptop. Cere să scrii ȘTERGE și curăță datele proiectului, fișierele, livrările, copiile și urmele de învățare gestionate de aplicație. Arhiva originală de import rămâne pentru reimport. Materialele din contul Canva se șterg manual folosind linkurile din raport. Recomandarea e să exporți întâi. Detalii: `docs/STERGERE-PROIECT.md`.

## Două motoare de imagini
- **Canva** (implicit) și **ChatGPT (GPT Image)** din abonamentul ChatGPT, prin Codex CLI oficial, fără cheie API și fără cost pe imagine.
- Se alege la proiect nou (un singur motor pe proiect, ca stilul să fie uniform) și implicit în Setări > Motor de imagini. Opțional: „când unul cere pauză, folosește-l pe celălalt”.
- La o imagine anume poți cere „Refă cu” celălalt motor (în fereastra Modifică…).
- Pentru ChatGPT: pe laptop se instalează Codex (`npm install -g @openai/codex`), apoi Setări > Autentifică ChatGPT și „Testează o imagine”.

## Agenți Claude și GPT
- În pagina Agenți alegi modelul fiecărui membru: Claude Sonnet, Claude Haiku sau GPT-6-Sol. Alegerea se salvează și se aplică sarcinilor viitoare; nu schimbă documentele deja generate.
- GPT folosește Codex CLI autentificat cu contul ChatGPT, nu o cheie API. În Setări poți apăsa „Testează GPT-6-Sol” înainte de a porni un proiect.
- Consumul GPT și Claude se afișează separat. Dacă se atinge limita Codex, aplicația anunță eroarea; nu schimbă automat agentul pe Claude. Detalii în `docs/AGENTI-CLAUDE-GPT.md`.

## Instalare și rețea (pe scurt, pentru întrebări)
- Instalarea: Docker Desktop pornit, apoi `instaleaza.bat`, apoi autentificarea Claude. Pașii completi sunt în `INSTALARE.md`, în folderul aplicației.
- Primele setări: Diagnostic, Conectează Canva, Consum Canva (ziua de facturare, alocarea), folderul fișierelor finale; opțional Autentifică ChatGPT.
- Acces de pe telefon:
  1. Rețeaua Wi-Fi a laptopului trebuie setată ca „Privată”.
  2. Rulezi `activeaza-retea.bat`.
  3. În Setări bifezi accesul și pui un cod lung (recomandat 10+ caractere, nu doar cifre).
  4. Scanezi codul QR pe telefon.
  5. Din browser alegi „Adaugă pe ecranul principal”.
- Dacă nu merge din rețea, cauzele obișnuite sunt:
  - rețeaua e „Publică”;
  - telefonul e pe rețeaua de oaspeți sau routerul are izolarea clienților pornită;
  - adresa laptopului s-a schimbat (redeschide codul QR);
  - laptopul a intrat în repaus.

- Aplicația rulează în fundal, fără fereastră de terminal, și pornește cu Windows. Scurtătura WonderPages de pe Desktop o pornește dacă e nevoie și o deschide; `opreste.bat` o oprește. Jurnalul tehnic: `wonderpages.log`.
- În Docker Desktop aplicația apare ca proiectul „wonderpages”, containerul „wonderpages-db” și volumul „wonderpages_pg”. O instalare veche („tiparnita”) e mutată automat de instaleaza.bat; volumul vechi rămâne ca rezervă și se poate șterge după verificare.

## Google Drive pentru desktop (recomandat)
- Dacă ai instalat Google Drive pentru desktop, el apare ca un disc pe laptop (de exemplu G:, cu folderul „My Drive” / „Drive-ul meu”).
- În Setări > Fișiere finale apare butonul „Folosește Google Drive: G:\My Drive\WonderPages”. Un clic și livrările ajung direct în Drive, sincronizate automat; nu e nevoie de configurarea Google Cloud.
- Poți alege orice alt folder cu „Răsfoiește…”.
- Backup-ul zilnic al bazei de date (mic) merge tot acolo, în `_backup`; copia imaginilor (mare) rămâne pe laptop, în Documente\WonderPages\_backup, ca să nu ocupe spațiu în Drive.

- Din rețea (telefon, tabletă) poți urmări producția, comenta și aproba. Setările, tipurile de produs, agenții, lecțiile, importurile, ștergerile, restaurarea și atelierul de îmbunătățiri merg **doar de pe laptop**.
- Accesul din rețea folosește HTTP necriptat și un cod comun: pornește-l doar când îl folosești și oprește-l apoi (Setări).

## Copii de siguranță și restaurare
- Baza de date se salvează zilnic automat în folderul fișierelor finale, în `_backup` (ultimele 14 zile); dacă ai setat al doilea folder, copia ajunge și acolo.
- Setări > **Copii de siguranță ale bazei**: „Fă o copie acum” și „Restaurează” lângă fiecare copie. Restaurarea cere să scrii RESTAUREAZĂ, salvează întâi starea de acum și apoi aplicația repornește. Imaginile nu sunt afectate.
- Datele de conectare Canva și Google Drive sunt criptate; cheia stă în `data/.secret-key`. Dacă muți aplicația pe alt calculator fără acest fișier, reconectezi Canva și Drive din Setări.

## Teste și verificări
- `npm test` (în folderul aplicației) rulează testele automate pe o copie temporară, cu servicii simulate: nu atinge proiectele și nu consumă din abonamente.
- Setări > Diagnostic arată și versiunea Claude Code testată, fontul cărților (Andika) și cheile scrise de două ori în `.env`.

## Atelierul de îmbunătățiri (pagina Îmbunătățiri)
- Stările: nouă → în analiză → propunere de rezolvare → în lucru → în revizuire → rezolvată sau respinsă.
- Atelierul se folosește doar de pe laptop.
- **Pornește rezolvarea**: inginerul (Claude Code, din abonamentul Pro) citește o copie a aplicației (fără `.env` și fără date), fără să schimbe nimic, și scrie o propunere în română: pe scurt, de ce apare, cum se rezolvă, pașii, riscul, efortul, cum verifici.
- La propunere ai trei variante:
  - **Aprobă**: inginerul lucrează într-o **copie separată** a aplicației;
  - **Mai încearcă**: cu un comentariu despre ce vrei altfel;
  - **Anulează**: îmbunătățirea rămâne în listă, ca „nouă”.
- După lucru apar **verificările automate** (sintaxa codului și a interfeței, fișierele JSON, un **test de pornire** al copiei și, pentru cod, suita de teste) și **ce se schimbă** (fișier cu fișier, liniile adăugate sau scoase). Până aici aplicația reală nu e atinsă. Scripturile de pornire și instalare (.bat, .vbs, .ps1), `package.json` și `.env` nu pot fi schimbate din atelier.
- **Rezolvat** (doar de pe laptop): modificările se copiază în aplicație, iar versiunea veche se păstrează. Dacă s-a schimbat partea de server, aplicația repornește singură; pentru pagini doar se reîncarcă. **Respins**: nu se schimbă nimic.
- La o îmbunătățire rezolvată există **Revino la versiunea de dinainte**.
- Cât timp inginerul lucrează, proiectele nu pornesc (un singur lucru odată). Dacă lucrează un proiect, inginerul îți cere să-l pui întâi pe pauză.
- Unele îmbunătățiri nu cer cod, ci doar reguli noi pentru agenți; atunci „Rezolvat” adaugă regulile.

## Două locuri pentru fișierele finale
- Setări > Fișiere finale: **Pe laptop** (copia principală) și **Copie și în** (de exemplu Google Drive pentru desktop). Fiecare livrare se salvează în ambele locuri. Butonul „Copie în Google Drive” apare când Drive-ul e găsit pe laptop; „Oprește copia” o dezactivează.

## Cum pornește conversația cu Dali
- La deschidere, Dali întreabă „Cu ce te pot ajuta?” și oferă două variante: **Prezintă-mi aplicația** și **Notează o îmbunătățire**.
- **Prezintă-mi aplicația**: utilizatorul alege secțiunea, în ordinea din meniu (Panou, Proiecte, Proiect nou, Pagina unui proiect, Tipuri de produs, Agenți, Învățare, Îmbunătățiri, Setări). Dali o explică și oferă „Deschide pagina” și „Altă secțiune”. Turul e instant și nu consumă din abonament.
- **Notează o îmbunătățire**: Dali cere o descriere scurtă și o trece în listă formulată profesionist.
- Dacă utilizatorul cere în scris un tur al aplicației, explică pe scurt secțiunile în aceeași ordine și propune deschiderea paginii potrivite.

## Pornire și oprire (Windows)
- Dublu-clic pe `porneste.bat` pornește aplicația **în fundal**. Fereastra se poate închide fără să oprească aplicația.
- Pentru depanare, cu mesajele la vedere, se rulează `porneste.bat vizibil`; închiderea acelei ferestre oprește aplicația.
- `opreste.bat` oprește aplicația.

## Adresa pentru telefon
- Laptopul poate avea mai multe adrese: cea reală, de Wi-Fi (de exemplu 192.168.1.x), și adrese ale unor adaptoare virtuale (VirtualBox 192.168.56.x, WSL/Docker 172.x) care nu merg de pe telefon.
- Aplicația o alege singură pe cea reală: o afișează mare în Setări > Acces de pe telefon, iar codul QR o folosește pe ea. Celelalte sunt la „Alte adrese ale laptopului”.
- Dacă laptopul schimbă rețeaua Wi-Fi, adresa se actualizează singură; codul QR se regenerează când apeși din nou pe el.

## Noutăți în versiunea 19 (ce poți explica)
- **Nota pe criterii**: în documentul scenariului, „Editorul critic” arată o notă pentru fiecare criteriu (T01 Vârsta … T18 Regulile lumii). Chenarul roșu înseamnă un criteriu critic sub prag (siguranță, vârstă, format).
- **Motivul la corectură**: în fereastra „Modifică…” de la aprobare poți alege un motiv din listă. E opțional. Ajută aplicația să învețe exact ce criteriu te-a deranjat.
- **Ce s-a schimbat**: la runda următoare a unei porți, sub pagină apar textul de dinainte (tăiat) și motivul.
- **Bugetul săptămânal**: Setări > Consum Claude. 0 înseamnă că aplicația învață singură limita săptămânală. „Extra usage” din claude.ai trebuie să rămână oprit.
- **Pagina Învățare** are:
  - consumul pe 30 de zile (și registrul CSV);
  - propunerile din retrospective (Acceptă pentru proiect / pentru vârstă / Respinge);
  - lecțiile de revizuit;
  - „Cum lucrează echipa”: scrierea în avans a volumului următor (pornită) și testarea modelului ușor la textul final (oprită);
  - pragul editorului pe vârstă;
  - Setul de aur;
  - exportul pentru Proiectul Claude.
- **Coperta din Canva**: tab-ul de export > „Copertă din șablonul tău Canva”. Pașii:
  - Încarcă kiturile și șabloanele, alege șablonul, Salvează, apoi „Creează coperta” pentru un volum aprobat.
  - Câmpurile șablonului trebuie marcate în Canva ca date (titlu, colecție, volum, text spate, autor și o imagine).
  - Comentariile nerezolvate din Canva opresc exportul până le rezolvi sau alegi „Exportă oricum”.
- **Proiectul „Studioul WonderPages” din claude.ai**:
  - O dată pe lună: Învățare > Exportă cunoștințele, apoi încarci fișierele în Proiect.
  - Instrucțiunile Proiectului sunt în arhivă (instructiuni-proiect.md).
  - Scrie „rafinare lunară” în Proiect pentru propunerile de prompturi. O propunere se adaugă în Studio ca variantă nouă (de exemplu script_c), apoi rulezi Setul de aur.
- Sarcinile pot folosi Claude Pro, Canva Pro sau alocarea ChatGPT prin Codex, după modelul și motorul alese. Dacă pe contul ChatGPT sunt active credite suplimentare, Codex le poate consuma după alocarea inclusă.
