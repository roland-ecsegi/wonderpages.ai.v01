> **Actualizare v03 (19.3.0):** regulile actuale din README.md au prioritate față de instrucțiunile istorice de mai jos. Abonamentele sunt ChatGPT Plus, Claude Pro și Canva Pro. Nu se continuă pe consum plătit separat. Digital este profilul implicit; KDP separă interiorul de copertă și cere rezoluția sursei. Backupul v03 păstrează DB și fișierele împreună. Proiectele vechi nu se migrează automat. Aprobarea unei corecturi creative cere revizuirea rezultatului. Generarea reală completă, reacția părintelui/copilului și tiparul nu sunt demonstrate de testele automate.

# Agenți Claude și GPT — ediția 19.3.0

## Cum alegi modelul

În **Agenți**, fiecare agent are o listă cu **Claude Sonnet**, **Claude Haiku** și **GPT-6-Sol**. Poți lăsa unii agenți pe Claude și seta alții pe GPT; selecția se salvează în configurația locală a agenților și se aplică apelurilor viitoare. Nu schimbă proiectele sau rezultatele deja create. Configurația existentă rămâne Claude până când alegi GPT pentru un agent.

Recomandare pentru un început prudent: schimbă mai întâi **Dali** sau **Directorul creativ** pe GPT și folosește **Setări > Testează GPT-6-Sol**. Apoi setează ceilalți agenți după calitatea rezultatelor și limita disponibilă.

## Autentificare și consum

GPT este apelat prin **Codex CLI 0.159.0**, instalat în aplicație de `npm ci` și conectat cu contul ChatGPT. În **Setări > Motor de imagini**, folosește **Autentifică ChatGPT**, **Verifică**, apoi **Testează GPT-6-Sol**. O versiune Codex CLI mai veche poate refuza modelul; apelurile text folosesc versiunea fixată în aplicație. Un login Codex făcut cu o cheie API este refuzat pentru apelurile text. Aplicația elimină cheile API OpenAI din mediul procesului Codex. Calea Claude folosește în continuare Claude Code și abonamentul Claude Pro.

Pagina **Setări** arată separat apelurile text Claude, apelurile text GPT și imaginile ChatGPT. Bugetul configurabil pe 5 ore se aplică doar lui Claude. Codex controlează limita reală a GPT; când o atinge, agentul raportează eroarea și nu trece automat la Claude. v03 citește cota oficială înainte de apel și refuză continuarea după epuizarea ei, indiferent de soldul de credite. Verifică și utilizarea reală în cont.

## Cum lucrează în aplicație

Agentul GPT primește aceeași carte a agentului, aceleași lecții aprobate, datele proiectului și schema de răspuns ca agentul Claude. Răspunsurile JSON sunt validate local de fluxul existent. Modelul este fixat la `gpt-6-sol`, nivelul de raționament la `medium`. Codex rulează într-un director temporar cu acces doar pentru citire; fișierele temporare și imaginile de referință sunt șterse după apel. În istoricul consumului și în registrul de proveniență este notat modelul folosit.

Proiectul **Dinosaur World** și datele lui existente nu sunt modificate de instalarea ediției mixte. Arhivele anterioare `wonderpages-ai.v001.zip` și `wonderpages-ai.v002.zip` rămân ediții Claude. Această ediție se arhivează separat ca `wonderpages-ai.claude-gpt.v01.zip` și continuă cu `v02`, `v03` etc.

## Verificări

`npm test -- --quick` folosește simulatoare locale Claude, Codex și Canva, fără consum din abonamente. Testul ediției mixte verifică alegerea pe agent, un proiect cu ambele modele, parametrul intern `medium`, eliminarea cheilor API, contorizarea separată și limita Codex. Butonul **Testează GPT-6-Sol** face un singur apel real foarte scurt, pentru a verifica autentificarea și accesul la model. Pe instalarea curentă, testul real a răspuns `OK` prin Codex CLI 0.159.0.
