# WonderPages AI — claude-gpt.v03 (19.3.0)

Starea verificată și limitele sunt în docs/v03/RAPORT-ANALIZA-INITIALA.md și DECIZII-PRODUS.md. Istoricul de mai jos descrie versiunile anterioare.

# WonderPages.AI: audit complet (versiunea 10)

Constrângere respectată: **doar abonamentul Claude Pro**, fără API plătit.

## Probleme găsite și rezolvate

| # | Gravitate | Problemă | Rezolvare |
|---|---|---|---|
| 1 | Critică | O cheie `ANTHROPIC_API_KEY` rămasă în `.env` (din prima versiune locală) trecea textul pe API plătit, fără să observi. | Calea de API a fost ștearsă complet. Cheia e ignorată și nu ajunge nici la Claude Code. Diagnosticul te anunță dacă există. |
| 2 | Mare | Un apel Claude blocat oprea proiectul pentru totdeauna. | Limită de timp de 12 minute (setabilă); pasul se reia. |
| 3 | Mare | La limita Pro, pauza era fixă (60 min), iar limita era atinsă „în plin”, lăsându-te fără Claude. | **Buget pe 5 ore** (implicit 90 de apeluri, din Setări): aplicația se oprește *înainte* de limită și reia singură. La limita reală, citește ora de resetare anunțată de Claude. |
| 4 | Mare | Orice site deschis în browser putea trimite comenzi aplicației locale (de ex. „aprobă”, „oprește”). | Aplicația acceptă comenzi doar de la propria interfață și doar pe `localhost` (protecție și la DNS rebinding). |
| 5 | Medie | Imaginile temporare trimise lui Claude pentru verificare rămâneau pe disc. | Se șterg după fiecare apel. |
| 6 | Medie | Imaginile generate și personajele încărcate nu aveau backup (doar baza de date). | Copiere zilnică a fișierelor noi în `_backup/fisiere`. |
| 7 | Medie | Proiectele puteau fi doar arhivate, ocupând spațiu pentru totdeauna. | „Șterge definitiv” pentru proiectele arhivate (fișierele deja livrate rămân). |
| 8 | Mică | Apelurile care nu se făceau (buget atins) erau totuși numărate. | Se numără doar apelurile reușite. |
| 9 | Mică | Numele vechi ale fișierelor temporare. | Redenumite `wonderpages-*`. |

## Eficiență în limitele Pro

- **Model pe agent** (pagina Agenți): Sonnet pentru scris, Haiku pentru sarcini ușoare (Producătorul care extrage lecții). Haiku consumă mai puțin din abonament.
- **Editorul nativ** nu mai face o a doua evaluare după revizuire: un apel economisit pe volum.
- **Verificarea vizuală** compară 6 pagini pe apel (înainte 4): 3 apeluri pe volum în loc de 4.
- Un singur proiect rulează odată; restul așteaptă la rând.
- Consum estimat pe volum (cu ambele limbi, fără corecții): aproximativ 12–16 apeluri Claude și 26 de imagini Canva.

## Îmbunătățiri de utilizare

- **Diagnostic** într-un clic (Setări): baza de date, Claude, autentificarea, „fără API plătit”, Canva, folderul de livrare și spațiul liber, modulul PDF, consumul.
- **Notificări** în browser când te așteaptă o revizuire sau generarea se oprește, plus numărul de revizuiri în titlul filei.
- **Povestea volumului 1** se poate încărca direct din fișier (.md / .txt).

## Verificat

- Flux complet: colecție, text volum 1, volum 1, livrare (3 PDF-uri de câte 14 pagini), volumul 2 pornește singur.
- Cheia API veche din `.env` nu a fost folosită în niciun apel (23 de apeluri verificate).
- Bugetul pe 5 ore pune proiectul pe pauză și programează reluarea.
- Comenzile fără antetul aplicației sau de pe alt domeniu sunt refuzate (403).

## Rămâne de făcut / recomandări

- **Primul test real** pe Windows, cu Docker, Claude Pro și Canva reale (în mediul meu au fost simulate).
- **Text vectorial în PDF**: acum textul e randat ca imagine la 300 DPI (bun pentru tipar). Încorporarea fontului ar da fișiere mai mici și text selectabil.
- **Google Drive** și **Canva** reale: de verificat la prima conectare (`npm run canva:probe`).
- **Teste automate** incluse în proiect, pentru actualizări viitoare sigure.

## Versiunea 11: acces din rețea și ecrane mici

- Acces de pe telefon, tabletă sau alt PC din aceeași rețea, **oprit implicit**, pornit doar de pe laptop.
- Cod de acces obligatoriu pentru orice alt dispozitiv (stocat criptat), sesiuni de 30 de zile, blocare după 5 încercări greșite pe minut, „Deconectează toate dispozitivele”.
- Acțiunile sensibile (rețea, folder, conectări) sunt permise doar de pe laptop.
- Interfață adaptată: meniu jos pe telefon, butoane mari pentru deget, alegerea documentului dintr-o listă, bara de decizie 2×2, ferestre de tip „foaie” pe telefon, fără zoom automat pe iOS, instalabilă pe ecranul principal.
- Limită: pe rețea aplicația merge prin HTTP; notificările din browser funcționează doar pe laptop.

## Versiunea 12: aprobare pe elemente, cronologie, vizualizare cu zoom

### Ce ai propus și cum am decis

| Propunere | Decizie |
|---|---|
| 3 aprobări: serie, demo de volum, prefinal | **Da.** *Aprobarea seriei* (brief, arc, Biblia poveștii, distribuție, fișele de personaj), *Aprobarea demo-ului* (textul celor 12 pagini + coperta și 2 pagini desenate, color și de colorat), *Aprobarea finală* (toate paginile: text în fiecare limbă, imagine color și pagină de colorat). |
| Aprobare separată pe fiecare poză și pagină | **Da.** Fiecare element are decizia lui: Aprobă, Aprobă cu notă, Cere modificare, Refă de la zero. |
| „Aprobă tot” | **Da**, ca „Aprobă tot ce a rămas”, ca să nu suprascrie deciziile deja luate. |
| Modificare pe pagina sau poza specifică | **Da.** Paginile de text cerute se corectează împreună, într-un singur apel pe volum (economie din abonament). Poza se redesenează doar pe ea; pentru pagina de colorat se refolosește imaginea color aprobată. |
| „Aprobă cu notă” | Nota se aplică automat, iar elementul rămâne aprobat fără altă verificare. „Cere modificare” îl readuce la tine. |
| Cronologie grafică interactivă | **Da.** Serie + cele 6 volume, etapă cu etapă, cu rombul fiecărei aprobări. Zoom cu rotița sau + / −, mutare prin tragere sau săgeți, 0 potrivește; pe telefon, ciupire și tragere. |
| Vizualizare mărită a pozelor | **Da.** Clic pe o poză: ecran întreg, zoom și mutare, ← → pentru imaginea anterioară/următoare, A aprobă, Esc închide, cu deciziile alături. |
| Totul se creează doar pe laptop | **Da.** Generarea era deja pe laptop; acum și **livrarea** (PDF-urile): de pe telefon apeși „Livrează”, iar laptopul le creează cu browserul lui (Edge/Chrome, fără fereastră) și le salvează local. |

### Decizii de calitate luate pe parcurs

- **O aprobare nu poate fi „uitată”:** dacă un text sau o poză se schimbă după ce l-ai aprobat, elementul revine automat la „de decis” și e marcat „modificat după aprobare”.
- **O poză color nouă** readuce la verificare și pagina ei de colorat.
- **Paginile demo aprobate se păstrează** la producția finală dacă scena nu s-a schimbat: mai puține imagini Canva.
- **Aprobarea se finalizează** doar când toate elementele sunt aprobate; deciziile generale (notă, respinge tot) rămân disponibile.
- **Totul e salvat** ca date de învățare: fiecare modificare cerută pe element alimentează lecțiile agenților.

### Testat

Aprobarea seriei cu o modificare pe Biblia poveștii. Demo cu: text pagina 3 modificat, poza pagina 1 aprobată cu notă (rămâne aprobată; pagina de colorat revine la verificare), coperta de colorat refăcută. Aprobarea finală cu 50 de elemente (12 texte EN, 12 texte RO, 13 poze color, 13 de colorat), 2 pagini demo refolosite. Livrare pornită din „telefon” și realizată pe laptop: 3 PDF-uri.

## Versiunea 13: Robi, lista de îmbunătățiri, curățenie după agenți

### Robi, asistentul tău
- Robotul portocaliu din dreapta jos deschide o fereastră mică, care rămâne deschisă cât navighezi prin aplicație.
- **Mereu la zi:** la fiecare mesaj citește documentația aplicației (`docs/GHID-ASISTENT.md`, README, acest audit) și tipurile de produs. Când aplicația se actualizează, Robi știe automat noutățile.
- **Ce poate face:** explică pașii, dă idei (teme, personaje, povești), **completează formularul de proiect nou** la cererea ta, îți deschide pagina potrivită și **notează îmbunătățiri**. Nu poate modifica singur proiectele.
- **Resurse:** conversația stă doar în memorie. Fereastra se închide după 15 minute fără mesaje; conversația se șterge după 2 ore fără mesaje sau imediat când apeși ×. Folosește modelul Haiku (consum mic din abonament). Nu așteaptă după bugetul de producție, dar apelurile lui se numără la consum.

### Lista de îmbunătățiri
- Îi spui lui Robi „trece asta în lista de îmbunătățiri”; el o formulează profesionist: titlu clar, situația actuală, impact, propunere, categorie și prioritate.
- Pagina **Îmbunătățiri**: filtre pe stare (nouă, în lucru, rezolvată, respinsă), editare, ștergere, adăugare manuală, descărcare ca fișier `.md` (îl poți trimite mai departe).

### Curățenie după agenți (resursele laptopului)
| Resursă | Înainte | Acum |
|---|---|---|
| Procese Claude | se închideau la final de apel; la oprirea aplicației puteau rămâne | închise toate la oprirea aplicației |
| Browserul de livrare | închis la final | închis și la oprirea aplicației; profilul temporar șters |
| Conexiunea Canva | deschisă permanent | se închide după 10 minute fără imagini, se redeschide singură |
| Fișiere temporare rămase după o oprire bruscă | rămâneau | șterse la pornire |
| Memoria aplicației | documentele proiectelor deschise rămâneau în memorie | proiectele nefolosite de 30 de minute sunt eliberate din memorie |
| Conversațiile cu Robi | nu existau | doar în memorie, șterse automat |

### Testat
Robi a completat formularul pentru o colecție despre lumea acvatică și a rămas deschis la schimbarea paginii. A notat o îmbunătățire, formulată profesionist. La × conversația a fost ștearsă și pe server; expirarea automată am verificat-o cu un timp scurtat. Pe telefon, robotul și fereastra stau deasupra meniului de jos. Închiderea după 15 minute de inactivitate e scrisă, dar n-am așteptat efectiv 15 minute în test.

## Versiunea 14: audit pe registrul de lecții (LL-001 … LL-035) și pe imaginile istorice

### Imaginile trimise: ce e corect și ce e greșit

| Imagine | Ce e bine | Ce e greșit | Ce face acum aplicația |
|---|---|---|---|
| Milo, referința | Turcoaz, burtă și degete crem, exact 3 pete corai pe flanc, ochi căprui | Proporții diferite de referința v3 anterioară (gât și coadă mai lungi): două referințe „canonice” concurente | O singură referință aprobată pe personaj; proporțiile și trăsăturile numărabile sunt scrise în Biblia poveștii |
| Tia, referința | 3 coarne, guler liliachiu, patrupedă, burtă crem | Textura cu zeci de puncte mici e greu de transpus în pagina de colorat pentru 3–4 ani | Invariante explicite; pagina de colorat păstrează doar zonele mari, închise |
| Pagina 9, încercarea 1 | Scena, ploaia, frunza | **Tia ține tulpina cu o mână umană, cu degete** (LL-029) | Anatomia fiecărui personaj: patrupedele țin obiecte cu botul, pe coarne sau pe spate, niciodată cu mâini |
| Pagina 9, încercările 2 și 4 | Anatomia corectă | **Nimeni nu ține frunza; tulpina e înfiptă în pământ** (LL-035, regresie după corecție) | Fiecare pagină are „cine ce face”; verificarea vizuală testează și acțiunea |
| Pagina 9, încercarea 3 | Tia susține tulpina | Laba se strânge ca o mână, cu degete | Idem: anatomie + acțiune verificate împreună |
| Pagina 9, toate | Milo corect (3 pete) | Povestea spune că **amândoi** țin frunza; pietricica e gri, mată și crăpată, nu „netedă și strălucitoare”; fundalul (râu, ploaie deasă, mușchi) e prea încărcat pentru 3–4 ani | Invarianți pentru obiecte; verificare pe patru dimensiuni: anatomie, acțiune, poveste, lizibilitate |
| Pagina de colorat 5 | Linii curate, forme închise, 3 pete, 3 coarne | Pietricica stă pe iarbă, deși pagina cere ca Milo să i-o **arate** Tiei; burta lui Milo nu e o zonă separată de colorat | Pagina de colorat păstrează zonele de culoare ale personajelor (burtă, pete, guler) și aceeași acțiune |
| Pagina de colorat 5, încercarea 2 | Desen corect | Marginile netezite ar putea fi confundate cu gri (LL-030) | Validatorul separă marginile netezite (1,7%) de umbrele reale (0,01%), apoi normalizează la alb-negru pur; rezultatul diferă de varianta ta normalizată la doar 0,5% din pixeli |

### Registrul de lecții: unde se regăsește fiecare lecție

| Lecții | În aplicație |
|---|---|
| LL-001, LL-002, LL-006 (vârste, densitate, procedee narative) | Vârstele 3–4 / 5–6 / 7–8; lungimea textului e ghid, nu regulă; dialog, narator, sunete și repetiții pe fiecare vârstă |
| LL-003 (obiectul nu apare înainte de descoperire) | „Ce nu apare încă” pe fiecare pagină, în text și în imagine |
| LL-004, LL-005, LL-018 (distribuție, prietenie, revenire) | Planul distribuției, registrul de continuitate, pașii vizibili ai unei prietenii noi |
| LL-007 (specia) | **Nou:** „specie sigură / stilizată, nedefinită”; textul nu numește o specie nesigură |
| LL-008 (română autorială) | Adaptare + editor nativ |
| LL-009 (pagini alăturate cu același rol) | **Nou:** verificare automată a paginilor alăturate, trimisă editorului critic |
| LL-010 (finalul spațial) | **Nou:** ultima pagină spune unde ajunge fiecare personaj |
| LL-011 (finaluri variate) | **Nou:** tipul de final al fiecărui volum, fără repetări consecutive |
| LL-012 (culorile ca identitate) | Paleta stă în Biblia poveștii; stilul și vârsta nu o schimbă |
| LL-013, LL-014, LL-015 (cauzalitate, limbaj procedural, magie vs. lumină naturală) | **Nou:** o problemă și o soluție clare pe pagină; fără limbaj de manual; regulile lumii și efectele fiecărei pagini |
| LL-016 (textul în imagine) | Interdicția e scrisă strict pentru ilustrații; textul cărții se adaugă la paginare |
| LL-017 (motorul nu e Dinosaur World) | Totul vine din tipul de produs; testat cu o temă nouă, fără cod nou |
| LL-019, LL-020 (volum pereche, demo înainte de producție) | O singură sursă pentru poveste și colorat; aprobarea demo-ului înainte de toate imaginile |
| LL-021 (schema, nu doar „e JSON”) | **Nou:** câmpuri obligatorii verificate (pagini, scene, anatomie, invarianți) înainte de salvare |
| LL-022, LL-023 (identitate exactă și inspecție) | Tipul de produs fixat pe proiect; **nou:** fiecare document arată ce agent, ce model, ce prompt și câte reguli l-au produs |
| LL-024 (documentația la zi) | Ghidul lui Dali și auditul se actualizează la fiecare versiune; registrul tău e inclus în `docs/LESSONS-LEARNED.md` |
| LL-025 – LL-027 (autentificare, mediu Windows) | Verificare separată de autentificare; nicio modificare cât timp Claude nu e autentificat; lansare prin `.cmd`, nu prin PowerShell |
| LL-028 (dovezi) | Numele fișierelor și versiunile sunt generate din date, nu scrise de mână |
| LL-029, LL-031, LL-035 (anatomie în interacțiune, invarianți, regresie după corecție) | **Nou:** anatomie și invarianți pe personaje și obiecte; verificare pe patru dimensiuni; după orice redesenare, **tot** contractul paginii se reverifică |
| LL-030 (validatorul de colorat) | **Nou:** margini netezite ≠ umbre; normalizare alb-negru fără schimbarea desenului |
| LL-032 (învățare guvernată) | **Nou:** lecțiile noi se aplică doar în proiectul lor; doar tu le extinzi la o vârstă sau la tot |
| LL-033 (calibrare) | **Nou:** stări pe vârstă (definită, în calibrare, candidată, calibrată) în pagina Învățare |
| LL-034 (limitele de utilizare) | Buget pe 5 ore, pauză și reluare de la ultimul pas |

Cele 16 lecții direct aplicabile agenților au devenit reguli, cu referința lor (LL-0xx), vizibile în pagina Agenți.

### Dali
Asistentul se numește acum **Dali**. Vorbește la feminin („asistenta ta”), are designul turcoaz (nu roz), cu o stea pe antenă. Știe noile verificări de calitate din ghid.

### Testat, cu imaginile tale reale trecute prin aplicație
- Pagina de colorat 5 (încercarea 2): acceptată ca desen curat, normalizată la alb-negru pur; livrarea conține doar varianta normalizată.
- Pagina 9: o pagină cu „tulpina înfiptă, nimeni nu ține frunza” a fost prinsă ca eroare de acțiune, redesenată o dată și reverificată pe tot contractul.
- Biblia poveștii a fost refuzată până a avut anatomie și invarianți; proveniența apare pe documente.
- O notă pe un element („Tia ține obiectele cu botul”) a creat lecții doar pentru acel proiect; extinderea la vârsta 5–6 a mers doar la cererea mea.
- O temă nouă (Ocean World) a rulat fără nicio schimbare de cod.

## Versiunea 15: Dinosaur World ca antrenament, Canva în limitele abonamentului Pro

### Dinosaur World: date de antrenament, nu cod
- **Pachete de antrenament** (Învățare): se importă o arhivă cu materiale reale. Pachetul aduce reguli (cu domeniul lor), exemple de text aprobat pentru vârsta lui și tipare de greșeli în imagini, pe care Directorul artistic le verifică explicit.
- **Proiect nou → „Pornește din pachet”** completează tema, vârsta, limbile, personajele (imaginile) și povestea volumului 1. Volumul 1 pornește de la povestea pachetului; volumele 2–6 le scrie AI-ul.
- **Pachetul „Dinosaur World (antrenament)”**, livrat separat, conține:
  - referințele canonice Milo și Tia și variantele istorice;
  - povestea volumului 1 corectată, EN și RO, cu indicații de scenă pentru paginile 5 și 9;
  - 10 imagini etichetate „bun”/„greșit” cu motivul;
  - registrul de lecții și pachetele de revizuire;
  - 3 reguli (două pentru 3–4 ani, una generală pentru paginile de colorat).
- **Faptele despre personaje** (Tia ține obiectele cu botul, Milo are specie nedefinită) stau în proiect, nu în regulile globale, ca să nu ajungă în alte colecții (LL-032).

### Canva: ce am aflat
- **Alocarea lunară:** Canva Pro are o alocare lunară de AI comună mai multor unelte. Pentru uneltele Premium e de ordinul a 200 de utilizări pe lună. Se reînnoiește lunar, la data de facturare.
- **Ce se întâmplă după consum:** pe Pro poți folosi în continuare uneltele AI, dar cu pauze scurte între sarcini. Asta se potrivește cu așteptarea de 3–4 minute pe care ai observat-o.
- **Cine consumă din alocare:** generările făcute de asistenți AI conectați la Canva (cum e aplicația noastră) consumă din aceeași alocare.
- **Unde vezi consumul:** Canva, Setări > Facturare > Utilizare AI.

### Canva: ce face aplicația acum
| Problemă | Soluție |
|---|---|
| Canva cere pauză după alocare | Pauza e recunoscută ca pauză, nu ca eroare. Aplicația așteaptă (implicit 4 min) și reia **aceeași** imagine; proiectul nu eșuează. După 45 de minute de pauze trece în „reia singur mai târziu”. |
| Alocarea lunară se termină în mijlocul unui volum | Generările lunii sunt numărate de la ziua reînnoirii. După alocare, aplicația trece singură în **ritm lent** (o imagine la câteva minute), exact cum permite Canva. |
| Mai multe imagini cerute deodată | O singură imagine odată, cu o scurtă distanță între ele. |
| Generări irosite | Demo-ul face **o singură** pagină de colorat (înainte 3). Paginile de colorat finale se fac **după** verificarea imaginilor color, deci niciuna pentru o imagine respinsă. Paginile demo aprobate se refolosesc. |
| Nu știai cât costă | Estimarea la proiect nou arată imaginile pe volum și câte generări mai ai luna aceasta. Setări > Consum Canva arată consumul, reînnoirea și ritmul. |

**Consum estimat:** cam 26–30 de generări Canva pe volum. Cu o alocare de ~200, asta înseamnă cam o colecție (6 volume) pe lună în ritm normal; restul continuă în ritm lent.

### Testat
- **Importul pachetului:** 18 fișiere, 3 reguli, 2 exemple de text (EN și RO), 5 tipare de greșeli.
- **Pornirea din pachet:** au venit vârsta 3–4, engleză și română, cele 2 personaje și povestea volumului 1.
- **Pauză simulată de Canva la a patra imagine:** aplicația a așteptat și a reluat, fără eroare.
- **Consum pe volum:** demo-ul a făcut o singură pagină de colorat, iar paginile de colorat finale au fost exact 13, câte una pe pagină, fără generări irosite.

## Versiunea 16: control complet al lucrului, proiect pregătit, două motoare de imagini

### Ce ai cerut și cum am decis
| Cerință | Decizie |
|---|---|
| Creare, apoi pornire separată | Proiectul nou intră **„Pregătit”**; pornești cu **Pornește lucrul** din proiect sau direct din lista Proiecte. Nimic nu pornește singur. |
| Un singur proiect lucrează odată | Regulă strictă, verificată pe server. Dacă pornești al doilea proiect, aplicația spune ce proiect lucrează și îți oferă **„Pune pe pauză și pornește acesta”**. La fel pentru corecții și modificări pe elemente. Dacă aprobi un proiect cât timp lucrează altul, cel aprobat rămâne pe pauză până îl pornești. |
| Pauză corectă, fără pierderi | **Pune pe pauză** nu întrerupe nimic: pasul în curs se termină și se salvează, apoi se scrie un **punct de salvare** (etapa, câte elemente sunt gata, versiunea fiecărui document). **Continuă** pornește exact de acolo. „Oprește imediat” rămâne doar pentru urgențe, cu confirmare. |
| Ștergere fără greșeli | Doar pentru proiecte arhivate. Trebuie să **scrii ȘTERGE**, verificat și pe server. Ți se recomandă întâi exportul. |
| Import de proiect | **Export/Import (.zip)** cu tot proiectul: documente cu versiuni, aprobări, imagini, puncte de salvare. Proiectul importat intră „Pregătit”. |
| Dinosaur World pregătit | Proiect gata de import, detaliat mai jos. |
| ChatGPT Plus (GPT Image) | Integrat oficial prin **Codex CLI**, fără API. Detaliat mai jos. |
| Dali la zi | Ghidul ei acoperă tot ce e nou: pornire, pauză, puncte de salvare, export/import, motoare de imagini. |

### Proiectul „Dinosaur World”, gata de import
Conține:
- **Brief-ul** colecției.
- **Arcul celor 6 volume**, cu finaluri variate:
  1. somn acasă;
  2. un cântec cântat împreună;
  3. rămas-bun în zbor;
  4. picnic împărțit;
  5. pictură cu flori;
  6. sărbătoarea prieteniei.
- **Biblia poveștii**:
  - Milo: specie nedefinită, exact 3 pete;
  - Tia: triceratops, patrupedă, ține obiectele cu botul;
  - Pip: pui de pterozaur, apare din volumul 3;
  - pietricica și frunza, cu invarianți;
  - locurile colecției și regulile lumii (fără magie).
- **Planul distribuției:** Tia e absentă în volumul 3; Pip apare din volumul 3 și revine în volumele 4 și 6.
- **Referințele Milo și Tia.**
- **Scenariul volumului 1** în forma completă a paginilor: acțiuni, ce nu apare, efecte, sunete, locul final al fiecărui personaj. Pagina 9 are explicit: Tia ține tulpina cu botul.

La pornire:
1. Se încarcă referințele în Canva (fără generare) și se desenează fișa lui Pip (o singură imagine).
2. Se deschide **Aprobarea seriei**.
3. Volumul 1 folosește scenariul pregătit (fără rescriere), iar volumele 2–6 le scrie AI-ul.

### ChatGPT (GPT Image): cercetare și decizie
- **Singura cale oficială fără API:** instrumentul de imagini inclus în **Codex CLI** de la OpenAI, autentificat cu contul ChatGPT, fără cheie API. Proiectele terțe care apelează direct serverele ChatGPT sunt neoficiale și nu le folosesc.
- **Riscuri cunoscute, raportate public:** în unele versiuni ale Codex, instrumentul de imagini nu apare în sesiune, inclusiv pe Windows. De aceea Setări are **„Testează o imagine”**, iar Canva rămâne implicit.
- **Siguranță:** `OPENAI_API_KEY` nu ajunge niciodată la Codex. Dacă Codex e autentificat cu cheie API, Setări te avertizează.
- **Decizia:** un motor pe proiect, pentru stil uniform în toată cartea. Alternarea automată la pauze e opțională (oprită implicit). Pe o imagine anume poți cere **„Refă cu”** celălalt motor, util pentru pagini grele, cum a fost pagina 9. Paginile de colorat funcționează cu ambele motoare, iar verificarea și normalizarea alb-negru rămân aceleași.

### Interfață
- În bara laterală vezi mereu **ce proiect lucrează acum**, cu buton de pauză.
- Lista Proiecte are butoane **Pornește / Continuă / Pauză** direct pe card.
- Stările sunt clare: Pregătit, Lucrează, Se pune pe pauză, Pe pauză, Așteaptă revizuirea, Finalizat.
- Tab-ul Activitate are istoricul punctelor de salvare și exportul.

### Testat
- Import Dinosaur World → pornire → fișa lui Pip → Aprobarea seriei.
- Aprobare în timp ce lucra alt proiect → proiectul aprobat a rămas pe pauză.
- Pornirea lui a fost refuzată cu numele proiectului care lucra.
- „Pune pe pauză și pornește acesta” → celălalt s-a oprit la un punct de salvare, iar Dinosaur World a pornit.
- Scenariul volumului 1 a rămas cel pregătit.
- Proiectul pus pe pauză a continuat exact de unde rămăsese.
- Un proiect cu ChatGPT a generat demo-ul prin Codex.
- Export → reimport → ștergere refuzată fără ȘTERGE, acceptată cu ȘTERGE.

## Versiunea 17: audit complet de performanță și calitate

### Probleme găsite și rezolvate
| # | Zonă | Problemă | Rezolvare |
|---|---|---|---|
| 1 | Aprobări | La respingerea întregii serii într-un proiect importat, pașii pregătiți nu se refăceau: aplicația îi sărea. | La respingere, marcajul „importat” se șterge și pașii se refac. Verificat: brief-ul a trecut de la versiunea 1 la 2. |
| 2 | Imagini | Cu motorul ChatGPT (sau fără Canva conectat), referințele personajelor tale erau trimise totuși la Canva. Proiectul se oprea. | Cu ChatGPT se folosesc direct fișierele locale; Canva e folosit doar dacă e motorul ales sau e conectat. |
| 3 | Imagini | O pagină de colorat cerută cu Canva, pentru o imagine color făcută de ChatGPT, genera o **imagine color nouă** (consum irosit). | Imaginea color se încarcă în Canva (încărcarea nu consumă din alocare), apoi se face doar pagina de colorat. |
| 4 | Imagini | La refacerea doar a paginii de colorat, imaginea își pierdea motorul și rezultatul verificării vizuale. | Motorul și verificarea imaginii color se păstrează. |
| 5 | Proiect nou | Dacă Canva nu era conectat, ilustrațiile erau debifate implicit chiar și cu ChatGPT pregătit. Avertismentul vorbea doar despre Canva. | Ilustrațiile depind de motorul ales; avertismentul numește motorul neconectat. |
| 6 | Consum Claude | Fiecare apel trimitea instrucțiunile lungi și lista de instrumente ale Claude Code, plus serverele MCP personale, dacă existau. | Când versiunea instalată permite, aplicația trimite un prompt de sistem scurt, doar instrumentul necesar (citire imagini sau niciunul) și niciun server MCP. Capabilitățile se detectează automat; versiunile mai vechi merg ca înainte. |
| 7 | Dali | Fiecare mesaj trimitea tot README-ul (~9 000 de caractere) și 14 replici de istoric. | Dali citește ghidul (sursa completă), doar noutățile ultimei versiuni și ultimele 10 replici. |
| 8 | Memorie | Lecțiile învățate nu aveau limită. | Maximum 500. La depășire se elimină întâi cele respinse, apoi cele de proiect, neconfirmate. |
| 9 | Documentație | Nu exista un ghid unic de instalare cu accesul din rețea și depanarea. | Ghid nou, `INSTALARE.md`, inclus și în cunoștințele lui Dali. |

### Verificat fără probleme
- Pornire, pauză sigură, comutare între proiecte, puncte de salvare.
- Export și import de proiect, ștergere cu confirmare.
- Bugetul Claude pe 5 ore, ritmul și pauzele Canva.
- Validarea paginilor de colorat, verificarea vizuală pe patru dimensiuni, livrarea pe laptop.
- Accesul din rețea: cod de acces, doar pe rețele private, setările sensibile doar de pe laptop.
- Curățenia după agenți: procese, browserul de livrare, fișiere temporare, memoria aplicației.

### Test de regresie complet
- **Proiect cu ChatGPT, Canva neconectat:**
  - serie, demo, volum final, 13 pagini color și 13 de colorat, toate normalizate;
  - livrare pe laptop.
- **Dinosaur World importat:** respingerea seriei a regenerat corect pașii importați.
- **Dali** a răspuns.
- **Fiecare pagină a aplicației** a fost deschisă pe desktop și pe telefon, fără nicio eroare de interfață.

## Versiunea 17.1: instalare și Docker
- `instaleaza.bat` se oprea brusc: o paranteză într-un mesaj închidea un bloc de instrucțiuni. Am reparat-o. Fereastra rămâne acum deschisă orice s-ar întâmpla, iar o verificare automată a fișierelor `.bat` rulează la fiecare versiune.
- Aplicația rulează în fundal, fără fereastră de terminal. Pornește cu Windows și așteaptă după Docker, repornește singură dacă se oprește și poate fi oprită cu `opreste.bat`. Scurtătura de pe Desktop o pornește dacă e nevoie.
- Docker folosește numele nou: proiectul `wonderpages`, containerul `wonderpages-db`, volumul `wonderpages_pg`. Mutarea datelor de sub numele vechi e automată și fără pierderi, iar volumul vechi rămâne ca rezervă. Backup-ul zilnic găsește singur containerul corect.

## Versiunea 17.2: Google Drive pentru desktop și eticheta de stocare
- **Google Drive pentru desktop**: aplicația găsește singură folderul „My Drive” / „Drive-ul meu” de pe disc. În Setări, un clic pune livrările în `…\My Drive\WonderPages`, sincronizat automat, fără Google Cloud. Pentru orice alt loc există un selector de foldere, disponibil doar de pe laptop.
- Când livrările merg în Drive, conectarea prin Google Cloud dispare din Setări, ca să nu încurce.
- Copia mare a imaginilor rămâne pe laptop, ca să nu consume spațiul din Drive. Backup-ul mic al bazei de date merge în `_backup`, lângă livrări.
- **Eticheta „Stocare proiecte”** afișa numele intern vechi al bazei de date. Acum arată containerul `wonderpages-db` și folderul de fișiere. Numele intern al bazei copiate rămâne neschimbat, pentru siguranța datelor, și nu mai apare nicăieri în interfață.

## Versiunea 17.3: actualizarea repornește aplicația
- **Problemă:** la actualizare, aplicația care rula în fundal nu era repornită. Interfața nouă mergea peste serverul vechi. De aceea eticheta de stocare arăta încă numele vechi, iar butonul Google Drive nu apărea.
- **Soluție:** `instaleaza.bat` oprește acum versiunea care rulează și pornește la final versiunea nouă.
- În Setări, funcțiile opționale oprite (notificările, accesul din rețea) apar neutru, nu roșu. Roșu rămâne doar pentru ce trebuie rezolvat, de exemplu Canva neconectat.

## Versiunea 17.4: pornire cu pagină de stare
- În loc de „This site can't be reached”, `http://localhost:4321` răspunde imediat cu o pagină de stare: „WonderPages pornește… (baza de date / Claude)”.
- Dacă pornirea eșuează, aceeași pagină arată **motivul exact** și ce ai de făcut, de exemplu Docker oprit. Aplicația reîncearcă singură.
- Verificarea opțiunilor Claude la pornire nu mai poate bloca pornirea: are o limită de timp de 8 secunde.

## Versiunea 17.5: conectarea la baza de date după redenumire
- **Problema** (din captura ta): baza de date mutată păstrează utilizatorul vechi (`tiparnita`), dar aplicația încerca să intre cu utilizatorul nou (`wonderpages`). Rezultatul: „password authentication failed”, deși Docker rula.
- **Soluția:** la o eroare de autentificare, aplicația încearcă singură datele de conectare cunoscute (noi și vechi), o folosește pe cea care merge și corectează automat `.env`. Datele nu sunt atinse.
- **Testat:** am simulat exact situația ta. Aplicația a pornit, iar `.env` a fost corectat.

## Versiunea 18: audit, curățenie, două destinații, atelierul de îmbunătățiri

### Scopul aplicației (reconfirmat din toată discuția)
WonderPages.AI e un studio local pentru colecții de cărți pentru copii (KIDs S&C):
- 6 volume livrate pe rând; fiecare volum are o carte de colorat și câte o carte de povești pe limbă.
- Calitate controlată de tine prin trei aprobări pe elemente, învățare guvernată și verificări automate de anatomie și continuitate.
- Doar abonamente: Claude Pro, Canva Pro, ChatGPT Plus prin Codex; fără cost API.
- Rulează pe laptop, e accesibil din rețeaua de acasă, cu Dali ca asistentă.
- Nimic nu e scris direct în cod pentru un proiect anume. Dinosaur World e un proiect de import și un pachet de antrenament.

### Curățenie (resturi eliminate)
- Folderul rămas `server/engine/`, gol și nefolosit.
- Scripturile macOS (`instaleaza.command`, `porneste.command`), nesincronizate cu fluxul actual. Aplicația e pentru Windows.
- Stocarea „Google Drive ca bază de date” (`server/storage/gdrive.js`), neterminată și nefolosită. Livrarea în Drive se face prin Google Drive pentru desktop.
- Importuri nefolosite în server.
- Denumiri interne rămase de la „Robi”, trecute pe Dali.
- README rescris după starea reală a aplicației (fără referințe vechi la KDP, „review”, Mac etc.).

### Funcții noi
- **Două destinații pentru livrări:** pe laptop (principală) și „Copie și în” (de exemplu Google Drive pentru desktop), cu detectare automată și selector de foldere. Dacă a doua copie eșuează, livrarea de pe laptop rămâne valabilă și primești mesajul.
- **Atelierul de îmbunătățiri:** nouă → în analiză → propunere (Aprobă / Mai încearcă cu comentariu / Anulează) → în lucru → în revizuire (Rezolvat / Respins) → rezolvată / respinsă, cu **Revino la versiunea de dinainte**.

### Garanțiile atelierului
- Analiza e doar citire.
- Lucrul se face exclusiv într-o copie separată; `.env`, `data/` și `node_modules/` sunt protejate și verificate.
- Verificări automate: sintaxa serverului și a interfeței, fișierele JSON, fișierele .bat. Dacă eșuează, urmează o singură trecere de reparare cu erorile exacte; dacă tot nu trec, „Rezolvat” rămâne blocat.
- Diferențele fișier cu fișier sunt vizibile înainte de aplicare.
- Backup al fișierelor înlocuite; repornire automată doar când s-a schimbat serverul.
- Un singur lucru odată: inginerul și proiectele nu rulează simultan.
- Bugetul Pro pe 5 ore se aplică și inginerului.

### Testat
- Livrare copiată în al doilea folder.
- Flux complet pe o îmbunătățire: analiză, „Mai încearcă” (refuzat fără comentariu, apoi acceptat), anulare (revine la „nouă”), aprobare, lucru în copie (aplicația reală neatinsă), verificări verzi, diferența afișată, Rezolvat (fișierul real schimbat, backup creat), Revino (fișierul restaurat).
- Interfața fără erori.

## Versiunea 18.1: Dali, autentificarea ChatGPT, pornirea
- **Autentificarea ChatGPT pe Windows** dădea eroarea „Windows cannot find 'login\'”: comanda `codex login` era transmisă greșit ferestrei noi. Am reparat-o, cu același mecanism care merge deja pentru Claude.
- **Închiderea terminalului oprea aplicația:** dublu-clic pe `porneste.bat` rula aplicația chiar în acea fereastră. Acum o pornește în fundal, iar fereastra se poate închide. Pentru depanare rămâne `porneste.bat vizibil`.
- **Dali:**
  - robotul e mai mare în același cerc;
  - începe cu „Cu ce te pot ajuta?” și două variante: „Prezintă-mi aplicația” și „Notează o îmbunătățire”;
  - turul aplicației e local și instant (nu consumă din abonament): secțiunile apar în ordinea din meniu, fiecare cu „Deschide pagina” și „Altă secțiune”;
  - „Notează o îmbunătățire” cere descrierea și o trece în listă, formulată profesionist.

## Versiunea 18.2: adresa corectă pentru telefon
- **Problema:** laptopul are, pe lângă Wi-Fi (192.168.1.143), și adaptoare virtuale: VirtualBox (192.168.56.1) și WSL/Hyper-V (172.17.224.1). Aplicația le afișa pe toate la fel, iar codul QR îl folosea pe primul, care era cel virtual.
- **Soluția:**
  - aplicația întreabă sistemul ce adresă folosește laptopul ca să ajungă la router (fără să trimită nimic pe internet);
  - ca rezervă, recunoaște adaptoarele virtuale după nume;
  - adresa reală apare mare, cu numele adaptorului, iar codul QR o folosește pe ea;
  - celelalte adrese stau ascunse, cu explicația că nu merg de pe telefon;
  - adresa se reverifică la 30 de secunde și la fiecare generare a codului QR (utilă după schimbarea rețelei).
- **Testat** cu exact adaptoarele laptopului tău: pe primul loc iese 192.168.1.143, atât cu detectarea prin sistem, cât și fără internet (după nume).

## Versiunea 18.3: remedierile din auditul extern
Auditul extern (28 septembrie 2026) a găsit 3 vulnerabilități critice și mai multe probleme de aprobare, secrete, stabilitate și accesibilitate. Toate au fost reparate și testate, cu excepția celor de la final.
- **Import de proiect (C1):** codul, starea, aprobările și deciziile din arhivă nu mai sunt preluate. Proiectul intră „Pregătit”, etapele deja lucrate se păstrează, dar **fiecare poartă de aprobare se redeschide pentru tine**. „Deschide folderul” nu mai trece prin linia de comandă, iar folderul nu poate ieși din destinația fișierelor finale. Se pot salva doar PDF-uri reale.
- **Pagini și fișiere (C2):** tot textul venit din proiecte, blueprinturi sau AI e afișat ca text. O politică de securitate (CSP) permite doar scripturile aplicației. Fișierele încărcate care nu sunt imagini se descarcă, nu se deschid ca pagini. Scriptul interfeței e acum în `public/app/`.
- **Doar de pe laptop (C3):** tipurile de produs, agenții, lecțiile, setările, bugetul, importurile, ștergerile, restaurarea și atelierul de îmbunătățiri. Din rețea: urmărești producția, comentezi și aprobi.
- **Aprobările (H1):** o poartă se închide doar când ai aprobat fiecare element. Livrarea, pachetul și trimiterea în Drive sunt permise doar pentru volume aprobate de tine; pachetul nu mai folosește textul neaprobat din scenariu.
- **Secrete (H2):** Google Drive cere acces doar la fișierele create de aplicație. Tokenurile Canva și Drive sunt criptate (cheia în `data/.secret-key`, nu în bază), deci și backupurile conțin doar text criptat.
- **Atelierul de îmbunătățiri (H3):** analiza citește o copie fără `.env` și `data/`. Scripturile de pornire/instalare și dependențele nu pot fi modificate din atelier. Înainte de revizuire, copia trebuie să pornească și să răspundă (test de pornire) și, pentru cod, să treacă suita de teste.
- **OAuth (M1)** cu verificare obligatorie, de unică folosință. **Limite (M2):** arhivele au plafon la despachetare; Dali are maximum 40 de mesaje pe oră; conexiunile live sunt limitate.
- **Stabilitate:** versiunile pachetelor sunt fixate (`package-lock.json`, instalare cu `npm ci`), Claude Code se instalează în versiunea testată, iar Diagnosticul arată dacă versiunea diferă. Imaginile ChatGPT se generează pe rând și se preia doar imaginea nouă. În `.env`, o cheie scrisă de două ori folosește ultima valoare (`CANVA_CONCURRENCY` era 2 în loc de 1).
- **Backup (M7):** copiile bazei sunt acum restaurabile. Setări > Copii de siguranță: „Fă o copie acum” și „Restaurează” (cu confirmare scrisă și copie automată a stării de dinainte). Dacă e setat al doilea folder, copia ajunge și acolo.
- **Teste (#4):** `npm test` pornește o instanță temporară cu servicii simulate și verifică producția cap-coadă, aprobările, livrarea PDF, importul, Dali, atelierul și atacurile din audit.
- **Accesibilitate (WCAG 2.1 AA):** culori cu contrast suficient pe ambele teme, link „Sari la conținut”, titlu pe fiecare pagină, dialoguri accesibile, cronologia și miniaturile folosibile de la tastatură, etichete pe toate câmpurile, mesaje citite de cititoarele de ecran (erorile rămân până le închizi). Aprobarea din vizualizator e acum **Shift+A**.
- **Interfață:** „Aprobă tot ce a rămas”, „Finalizează aprobarea”, arhivarea și celelalte acțiuni greu de anulat cer confirmare. Erorile de rețea apar în română. Pe telefon, Dali nu mai acoperă butoanele de aprobare. Validarea tipului de produs din Studio acceptă câmpurile de limbi și imagini.
- **Fonturi locale:** interfața nu mai cere nimic de pe internet. Fontul cărților (Andika) e descărcat de instalator în `public/fonts`; dacă lipsește, Diagnosticul și livrarea te anunță.
- **Rămase deschise:** autentificarea din rețea (sesiuni, blocare la încercări repetate, HTTPS) este neschimbată: accesul din rețea să fie pornit doar când e nevoie. Analiza juridică a abonamentelor, volumul-pilot, trecerea la SQLite și textul vectorial în PDF sunt decizii în afara codului.

## Versiunea 19: agenți mai buni, cost zero

Planul de optimizare (32 de îmbunătățiri), totul în Claude Pro și Canva Pro, fără API și fără costuri ascunse. Pașii editorului rămân aceiași.
- **Agenții**: fiecare are o cartă (misiune, intrări, contract, criterii, interdicții), trimisă ca prompt de sistem. Răspunsurile compacte sunt validate cu schemă, iar toate sunt verificate local.
- **Editorul critic** dă o notă pe fiecare criteriu (T01–T18), cu citat. Siguranța, vârsta și formatul au prag propriu. Erorile mecanice se repară în cod, înainte de editor.
- **Revizia** rescrie doar paginile cu probleme. A doua rundă vine doar dacă nota crește, iar varianta cea mai bună se păstrează.
- **Continuitatea** citește registrul aprobat plus volumul nou, nu toată colecția.
- **La porți** vezi ce s-a schimbat și de ce. La „Modifică…” poți alege un motiv din rubrică (opțional).
- **Bugetul**: pe 5 ore și pe 7 zile. Limita săptămânală se învață singură; la limită, proiectul intră pe pauză și se reia.
- **Registrul de consum** (Învățare): apeluri, KB, cache, note, redesenări, pe etape și pe versiuni; export CSV.
- **Învățarea**: lecțiile se aleg pe etapă, cu plafon de mărime, și li se măsoară efectul. Cele fără efect apar „de revizuit”. După fiecare volum, o retrospectivă propune lecții, pe care le accepți tu.
- **Setul de aur**: 3 subiecte fixe, doar text, pentru a compara versiunile. Variantele de prompt au competiție cu câștigător.
- **Pragul editorului** poate fi calibrat pe vârstă, doar cu acordul tău.
- **Scenariul volumului următor** se scrie cât Canva desenează imaginile.
- **Canva Pro**: coperta din șablonul tău de brand (autofill), export PDF, formate de promovare, comentarii verificate înainte de export.
- **Proiectul „Studioul WonderPages”** din claude.ai: Învățare > Exportă cunoștințele, lunar.
- Reparate pe drum: detectarea funcțiilor Claude Code nu rula deloc; scrierea fișierelor locale se putea ciocni; mesaje de eroare rămase de la varianta cu API.
- Rămas deschis: H4 (autentificarea din rețea, vezi docs/REMEDIERI-AUDIT.md).

## Versiunea 19.0.1: ștergerea definitivă a proiectului

- În Proiect > Activitate, pe laptop, butonul „Șterge definitiv…” apare pentru proiectele care nu lucrează. Nu este necesară arhivarea. Confirmarea scrisă ȘTERGE este obligatorie.
- Curățarea include înregistrările din baza de date, fișierele, livrările și copia lor din al doilea folder, urmele din învățare și registrul de consum, precum și copiile SQL gestionate de aplicație. Fișierele încărcate de aplicație în Google Drive se șterg când Drive este conectat; dacă nu poate fi accesat, ștergerea se oprește înainte de a elimina datele locale.
- Datele vechi de învățare fără proveniență pe proiect se resetează pentru toate proiectele. Arhiva originală de import rămâne disponibilă. Materialele din contul Canva se elimină manual, prin linkurile din raportul afișat după ștergere.
- Detalii de utilizare și limite: `docs/STERGERE-PROIECT.md`.

## Versiunea 19.1.0: agenți Claude și GPT în același proiect

- Fiecare agent poate folosi Claude Sonnet, Claude Haiku sau GPT-6 Sol medium. Configurațiile existente rămân pe Claude până când alegi alt model. Selecția agentului are prioritate față de sugestia de model Claude din blueprint.
- GPT folosește Codex CLI 0.159.0 instalat în aplicație și autentificarea ChatGPT existentă. Pentru text, un login API este refuzat și cheile API sunt eliminate din mediul procesului. Codex rulează cu acces doar pentru citire într-un folder temporar și șterge referințele după apel.
- Consumul text GPT și imaginile ChatGPT sunt afișate separat de Claude. Limita Codex este raportată ca atare, fără înlocuire automată cu Claude. A fost adăugat în Setări un test real scurt pentru modelul GPT.
- Testarea simulată verifică proiectul mixt, alegerea pe agent, `medium`, lipsa cheilor API, contorizarea separată și tratarea limitei. Un test real cu Codex CLI 0.143.0 a arătat că acea versiune refuză modelul; după instalarea locală a versiunii 0.159.0, `gpt-6-sol` a răspuns `OK` și a produs JSON structurat valid prin contul ChatGPT, fără apel Claude.
- Regresia rapidă finală: 55 teste trecute, 0 eșuate, 1 test de livrare PDF omis de modul rapid. O cursă existentă la ștergere a fost reparată: sarcinile de învățare și retrospectivă sunt lăsate să se termine înainte de curățarea proiectului, astfel încât nu recreează fișiere sau rânduri după ștergere.
- Limite ale verificării: testul real a fost un răspuns scurt; o colecție completă cu GPT și Canva reale nu a fost produsă. Disponibilitatea modelului poate depinde de planul și configurarea contului ChatGPT. Codex poate consuma credite suplimentare când acestea sunt active în cont.
- Instrucțiuni: `docs/AGENTI-CLAUDE-GPT.md`. Arhivă: `wonderpages-ai.claude-gpt.v01.zip`; seriile anterioare doar Claude rămân neschimbate.

## Versiunea 19.1.1: afișare GPT și corecție mobil

- Interfața afișează `GPT-6-Sol` pentru agenți și testul din Setări. Apelul intern continuă să folosească `gpt-6-sol` cu nivelul de raționament `medium`.
- În Setări, căile lungi de pe telefon se împart pe rânduri în card, inclusiv textul din butoane. Schimbarea de stil este limitată la vizualizarea mobilă.
- Verificare vizuală la 390 px: pagina Setări nu depășește lățimea ecranului, iar pagina Agenți afișează noua denumire. Regresia rapidă: 55 teste trecute, 0 eșuate, 1 test PDF omis de modul rapid. Testele aplicației sunt simulate local și nu consumă apeluri Claude sau GPT.
- Arhivă: `wonderpages-ai.claude-gpt.v02.zip`.
