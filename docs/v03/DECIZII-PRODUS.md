# WonderPages — constrângeri și direcție de produs

Data: 1 octombrie 2026. Completează raportul inițial. Secțiunile 1–8 păstrează deciziile inițiale. Starea implementată și verificările v03 sunt consemnate în secțiunea 9; rezultatele externe neobservate nu sunt declarate finalizate.

## 1. Cerințe obligatorii ale utilizatorului

- Producția software rămâne în abonamentele existente: ChatGPT Plus, Claude Pro, Canva Pro. Fără servicii/API facturate separat, credite cumpărate, upgrade sau extensii cu abonament suplimentar.
- Colecția păstrează șase volume. Fiecare volum are două produse: carte de poveste ilustrată și carte de colorat.
- Se păstrează categoriile de vârstă alese: 3+, 5+, 7+, respectând profilurile existente ale proiectelor.
- Utilizatorul păstrează controlul asupra aprobării și corectării pe pagină și pe element.
- Obiectivul este calitatea editorială, vizuală și de utilizare necesară unor produse cu potențial internațional. Statutul de bestseller nu poate fi garantat de aplicație sau de un scor AI.

Acestea sunt instrucțiuni directe ale utilizatorului. Recomandările din audit și ghid rămân surse de analiză, fără a le înlocui.

## 2. Producție în limita abonamentelor

Utilizarea se face prin accesul inclus și autorizat al conturilor existente. Disponibilitatea unei funcții în interfața unui furnizor nu dovedește că integrarea automată existentă o poate utiliza. Verificarea trebuie făcută pe traseul real al aplicației; unde integrarea nu oferă funcția inclusă, se poate folosi un pas manual în produsul abonat.

Aplicația trebuie să păstreze rezultatele, să reia numai operațiile neterminate și să oprească generarea la epuizarea limitei relevante. Nu presupune că toate instrumentele Canva consumă aceeași cotă sau că un număr estimativ de utilizări înseamnă același număr de imagini. Nu activează consum suplimentar plătit. Dacă situația cotei nu este cunoscută, afișează necunoscut și cere verificarea în cont, fără a inventa un sold.

Verificările structurale, înlocuirile exacte de cuvinte, istoricul, compararea versiunilor și exportul local se execută local. Apelurile AI se rezervă creației, editării care cere judecată și criticii. O corectură exactă nu trebuie să declanșeze apeluri AI ascunse pentru „învățare”; lecțiile se pot consolida ulterior, în loturi.

Tipărirea fizică, transportul și promovarea plătită nu sunt incluse în cele trei abonamente. Planul de producție software nu presupune aceste cheltuieli.

Surse oficiale consultate la data documentului: [ChatGPT Plus și separarea API](https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus), [Codex prin abonament](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan), [Claude Pro](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan), [utilizarea AI Canva](https://www.canva.com/help/ai-access-variantb/). Limitele efective se verifică în conturile utilizatorului.

## 3. Contractul de revizuire propus

O pagină prezintă separat textul fiecărei limbi, imaginea color, pagina de colorat și macheta. Opțiunile sunt: aprobă, aprobă cu o corectură exactă, cere ajustare, respinge și refă, editează manual, compară versiuni și revino la o versiune. Comenzile creative arată ce va fi refăcut înainte de execuție.

| Cerere | Modificare | Aprobare după modificare |
|---|---|---|
| Corectează numai imaginea color de la pagina 4 | Corectură localizată; validare color; după acceptarea culorii se actualizează automat pagina de colorat și se verifică perechea | Noua imagine color și noua pagină de colorat se revizuiesc separat. Versiunea de colorat veche devine depășită, fără a fi pierdută din istoric. |
| Corectează numai pagina de colorat 4 | Se lucrează pornind din imaginea color aprobată | Culoarea rămâne aprobată. Dacă operația nu poate păstra culoarea, se oprește; nu o regenerează pe ascuns. |
| Ajustează textul paginii 7 | Se păstrează evenimentul și intenția, se îmbunătățește formularea | Numai textul schimbat revine la revizuire; se verifică legătura cu paginile 6 și 8. |
| Rescrie textul paginii 7 | Rescriere în contextul poveștii, cu comparație înainte/după | Reaprobare. Dacă schimbă acțiunea, emoția, obiectele sau locul, se marchează și imaginile/traducerea dependente. |
| Aprobă, dar înlocuiește „băltoacă” cu „baltă” | Înlocuire deterministă în locul selectat; verificare a încadrării și a rezultatului | Poate păstra aprobarea prin delegarea explicită a acestei corecturi exacte. Dacă ținta este ambiguă sau apar alte schimbări, revine la revizuire. |

Aprobarea este legată de versiunea concretă a elementului. O modificare nu poate moșteni automat aprobarea versiunii precedente. Elementele neafectate rămân aprobate. O carte cu dependențe depășite sau elemente lipsă nu poate deveni livrare finală.

Automatizarea actualizării color → colorat nu echivalează cu aprobarea automată a unei creații noi. Dacă derivarea alb-negru eșuează, culoarea bună se păstrează și se reia doar derivarea.

## 4. Identitate și consistență a personajelor

Bible-ul vizual trebuie completat cu repere anatomice verificabile și planșe aprobate: față, profil stâng/drept, trei sferturi, spate, proporții, expresii și câteva poziții recurente. Bible-ul narativ include dorință, frică, defect, calitate, voce și relații.

Pentru Milo, cele trei pete de pe flancul stâng primesc poziții, forme și dimensiuni relative la reperele corpului din modelul aprobat. Se mișcă împreună cu corpul, nu sunt fixate în pixeli pe pagină. „Stânga” este stânga personajului. Petele pot fi ascunse de perspectivă sau de braț; nu trebuie mutate pe partea dreaptă pentru a rămâne trei vizibile. Oglindirea unei imagini se verifică pentru asemenea erori.

Referințele și instrucțiunile AI ajută, dar nu garantează fidelitate geometrică. Se folosesc și reutilizarea elementelor aprobate, corecturi pe zone/layer-e și revizuire umană. Dacă modelul greșește repetat un detaliu, se corectează precis sau se reutilizează un element valid, în locul unor regenerări nelimitate.

## 5. Sistem editorial pentru șase volume

Se definește mai întâi arhitectura colecției: premisă distinctă, distribuție, reguli ale lumii, identitate vizuală și evoluție pe șase volume. Fiecare volum are un conflict și un final satisfăcător propriu, plus o contribuție la relațiile și evoluția colecției. Se evită șase variante ale aceleiași intrigi sau ale unei lecții morale.

Pentru fiecare volum: premisă → dorința protagonistului → incident → încercări care schimbă situația → escaladare → alegere decisivă → rezolvare → final cu sens. Umorul, misterul și surpriza provin din personaje și situații. Învățarea apare prin acțiune și consecințe.

Profilurile de vârstă ghidează vocabularul, densitatea textului, numărul relațiilor cauzale și intensitatea suspansului. Pentru 3+ sunt prioritare acțiunea clară, repetiția cu variație și suspansul blând; pentru 5+, mai multe încercări, dialog și indicii; pentru 7+, motive și consecințe mai nuanțate. Complexitatea poate crește în formatul ilustrat existent, fără trecere obligatorie la chapter books.

Fiecare pagină primește o funcție: text, acțiune, emoție, informație nouă, contribuția imaginii, compoziție și legătura cu pagina următoare. Hook-ul are un payoff identificabil; paginile liniștite au un rol. Storyboard-ul verifică succesiunea, spațiul, direcția mișcării și varietatea cadrelor înainte de ilustrațiile finale.

## 6. Agenți și control editorial

Se rafinează rolurile existente: arhitect al colecției, autor, editor, critic, director artistic, verificator de continuitate și responsabil de machetă. Fiecare primește un rezultat cerut și dovezi necesare pentru acceptare. Nu este necesar câte un model sau apel separat pentru fiecare etichetă de rol.

Criticul evaluează rezultatul într-o etapă distinctă, pe baza textului și imaginilor efective. Explicațiile autorului nu înlocuiesc dovezile din carte. Evaluările incomplete nu primesc implicit succes. Critica întoarce pagina, problema, motivul și corectura recomandată, nu doar un scor general.

O corectură se verifică față de cerere și față de continuitate. Corecțiile globale schimbă bible-ul numai printr-o decizie explicită; notele de pe o pagină nu devin accidental reguli pentru toată colecția. După cel mult două încercări automate pentru aceeași problemă, se prezintă rezultatul și cauza pentru intervenție, păstrând variantele utile.

## 7. Machetă și cartea de colorat

Layout-ul se proiectează odată cu storyboard-ul: câteva familii de pagini pentru acțiune, dialog, surpriză, panoramă și moment intim. Textul rămâne editabil și se așază în spații prevăzute, cu contrast, font lizibil, margini și verificare a încadrării pentru fiecare limbă. Nu se generează paragraful în ilustrație și nu se micșorează arbitrar fontul pentru a ascunde prea mult text.

Numărul scenelor narative, numărul paginilor fizice, coperta și paginile preliminare sunt concepte diferite. Profilul de tipar se adaptează destinației fără a schimba cele șase volume și cele două produse per volum. Cartea de poveste și cartea de colorat rămân livrări distincte.

Pagina de colorat păstrează identitatea, poziția și acțiunea din scena color, cu simplificare potrivită vârstei: contururi clare, spații utilizabile și detalii dozate. Conversia nu se reduce la desaturare sau extragere automată a tuturor muchiilor. Se verifică și dacă simplificarea a pierdut detalii distinctive ori obiecte esențiale.

## 8. Următorul pas după plan

Urmează primul lot de implementare din raport: aprobări legate de versiuni, completitudinea livrării, corectări pe element și validări care nu acceptă lipsuri, cu diagnosticarea PDF. Cele patru exemple ale utilizatorului devin scenarii de acceptare, alături de refuzul exportului pentru conținut incomplet sau depășit. Acesta face sigur controlul editorial înaintea producției premium.

În continuare se extind contractele editoriale și vizuale. Se aprobă planul întregii colecții, se produc câteva scene reprezentative pentru a fixa stilul și se finalizează volumul 1 cu ambele produse. Pilotul verifică lectură cu voce tare, continuitate, imagine-text, page turns, layout, colorabilitate și export.

Abia după validarea volumului 1 se produc volumele 2–6 cu regulile calibrate. Reacțiile observate ale părinților și copiilor completează evaluările AI. Pentru extinderea internațională se adaptează natural limba, umorul, titlurile și coperta; se păstrează identitatea colecției. Dorința de recitire și interesul real sunt dovezi de produs mai utile decât o etichetă automată „premium”.

## 9. Starea implementării v03 — 1 octombrie 2026

Versiune: **WonderPages AI — claude-gpt.v03 / 19.3.0**. Deciziile acestui document au avut prioritate față de recomandările contradictorii din audit. Matricea H01–H08/M01–M16/LOW, modulele și rezultatele sunt în raportul actualizat.

| Decizie | Implementare și verificare | Stare |
|---|---|---|
| Numai abonamentele actuale | Claude Pro autentificat; Codex inclus 0.159.0 pentru text și imagini, fără chei API; citirea cotei reale refuză limita epuizată sau necunoscută, indiferent de credite; Canva buget local etichetat și oprire, sold oficial necunoscut | Implementat; probe ChatGPT reale PASS, Claude limitat. Nu se promit cote fixe sau control asupra facturării concurente din cont. |
| 6 volume × poveste/colorat, vârste păstrate | Blueprint v15 și profiluri legacy; scene/pagini/coperți distincte, livrări separate și bilingve unde ales | Testat; nu s-a extins obligatoriu la chapter books. |
| Aprobare pe element/versiune | Fingerprints, enumerate missing/stale, titlu+blurb, machetă și book-check; incomplete nu devine final | Teste contracts/corrections/release integrity PASS. |
| Imagine color pagina 4 | Revizuire color; derivare lineart numai după acceptare, revizuire separată, variante păstrate | Scenariu end-to-end PASS. |
| Numai lineart 4 | Sursa este culoarea aprobată, fără regenerarea ei; eroarea derivării păstrează rezultatul bun | Scenariu end-to-end PASS. |
| Ajustare / rescriere text 7 | Numai pagina aleasă în context; reaprobare, amprenta semantică invalidează imaginile/traducerea dependente | Scenariu end-to-end PASS. |
| „băltoacă” → „baltă” | Înlocuire locală neambiguă și delegare explicită; ambiguitate refuzată; fără învățare AI ascunsă | Număr de apeluri neschimbat în test. |
| Comparare / revenire | Istoric de conținut și meta/dependențe, afișare text/imagini, restaurare versiune verificată; editor document/machetă și upload manual | Unit/integration/UI PASS. |
| Character / Story Bible / storyboard | Psihologie și voce, repere legate de corp și ocluziune, planșe/expresii, beat-uri, emoție, imagine care adaugă, hook/payoff/spread și scopul cadrului | Contracte și validări implementate; fidelitatea artistică efectivă se revizuiește uman. |
| Critic separat și retry limitat | 18 criterii exacte cu dovezi, QA complet curent și vecini; maximum 2 corecții automate, fără succes implicit | Teste incomplete/duplicate/unknown/negative PASS. |
| Pilot înainte de volume 2–6 | Gate v15 al cărții; opt verificări, revizuirea tuturor paginilor și machetei | Software implementat. Pilotul real și observarea părinte/copil **NEEFECTUATE**; nu sunt substituite de fixture. |
| Layout și export corect | Text editabil/selectabil, Andika, PNG lossless, layout family/zone și încadrare; Digital implicit și KDP cu cover/DPI | PDF real pe fixture inspectat, geometrie și font PASS. Proba de tipar **NEEFECTUATĂ**. |
| Stabilitate și date existente | Persistare atomică, flush, reconciliere read-only, snapshot DB+files/verificare SHA; migrare contract explicită/reversibilă | 87/87 teste PASS; PostgreSQL real PASS în bază izolată. Instalarea v03 a trecut verificarea distinctă după update; datele/configurația și contractul v13 al Dinosaur World sunt păstrate. |
| Potențial internațional / bestseller | Cerințe de adaptare naturală, originalitate, recitire, calitate și calibrare; fără scor care promite succes comercial | Direcție de produs păstrată; rezultatul comercial nu poate fi certificat software. |

Îmbunătățirile sunt locale și compatibile: fără rescriere framework, fără eliminarea funcțiilor Dali/agenți/învățare/Canva/Drive/import/export/LAN/îmbunătățiri. Contractele v13/v14 nu sunt schimbate automat. Schimbarea explicită salvează contractul precedent și reface aprobările, păstrând textele/imaginile.

Limitări: Claude a raportat resetarea cotei săptămânale pe **4 octombrie 2026, ora 16:00 București**. Generarea reală completă în Canva, publicarea și uploadul Drive nu au fost executate; autentificarea și contractele software nu dovedesc acele operații. HTTPS este disponibil când utilizatorul configurează certificatul; instalarea curentă păstrează configurația LAN. Copiile automate v03 au retenție de 14; copiile manuale/SQL istorice și copia secundară sunt păstrate, iar restaurarea cere repornire pentru toate conexiunile. Datele personale și credentialele nu se distribuie în ZIP.

### Validare finală și livrare

Versiunea **WonderPages AI — claude-gpt.v03 / 19.3.0** este aplicată în instalarea existentă. **87/87 teste**, build și lint trecute din instalare. Comparația cu backupul inițial confirmă păstrarea datelor, imaginilor, configurației, autentificărilor și preferințelor agenților. UI-ul real a trecut 30 verificări de rută/rezoluție, fără overflow al paginii; calea lungă de livrare a fost reparată. Backupul DB+fișiere și copia secundară au trecut prin API-ul instalat; o livrare neaprobată a fost refuzată cu 409. Detaliile și toate limitările sunt în FINAL REGRESSION TEST din raport.

Arhiva completă este `app.kit.versions/wonderpages-ai.claude-gpt.v03.zip`, cu folderul complet al versiunii și instalatorul Windows standard inclus. Inventarul SHA-256/CRC și excluderea configurației private au fost verificate. Nu există format EXE/MSI separat. Nu sunt cunoscute regresii introduse în fluxurile verificate; aceasta nu echivalează cu o certificare universală a tuturor mediilor sau a tuturor ieșirilor AI.

Pilotul real, observația părinte/copil și proba fizică rămân **NEEFECTUATE**. Nu se marchează drept DONE și nu se promite statut de bestseller. Limitele actuale ale Claude/Canva/ChatGPT și diferența dintre autentificare, cotă și generare verificată rămân vizibile și explicite.


## Actualizare v04 — 1 octombrie 2026

**WonderPages AI — claude-gpt.v04 / 19.4.0**: afișarea backupurilor `.wbackup` măsoară dimensiunea reală a fișierelor; o eroare este raportată ca necunoscută. Salvarea, restaurarea, retenția și SQL-urile vechi rămân compatibile. Instalarea nouă pornește fără proiecte; update-ul instalării existente păstrează datele.

Dinosaur World este modernizat exclusiv în pachetul separat `dinosaur-world-proiect.v04.zip`: Character Bible pentru Milo/Tia/Pip cu repere anatomice, șase Story Bibles și 72 planuri de pagină, scenariu EN/RO al volumului 1, hook/payoff și storyboard, contract v15 cu 18 criterii și maximum două corecții. Nu este importat automat; aprobările sunt deschise. Referințele originale sunt păstrate, iar atlasul nou și ilustrațiile nu sunt declarate produse.

**91/91 teste PASS**, build/lint PASS; instalarea efectivă verificată separat, 10 rute HTTP 200, 30 verificări UI fără overflow/warn/error. Backupurile reale afișează **3,4 MB**, bytes și manifeste verificate. Datele, imaginile, contractul v13 al proiectului existent, configurația și preferințele agenților sunt neschimbate. Distribuția completă v04 este verificată, fără date sau secrete, cu instalatorul Windows standard. Detalii și module: `ANALIZA-V04/RAPORT-V04.md`; dovezi în `ANALIZA-V04/dovezi`.

Limitări explicite: volumele 2–6 au planuri, nu manuscrise finale; atlasul/ilustrațiile noi se produc și aprobă în pipeline. Pilotul cu familii, proba de tipar și publicarea rămân neefectuate. Nicio promisiune de bestseller. Abonamentele ChatGPT Plus, Claude Pro și Canva Pro rămân singurele abonamente utilizate.
