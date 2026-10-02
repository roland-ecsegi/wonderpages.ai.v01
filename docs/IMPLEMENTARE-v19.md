# Implementarea planului de optimizare (versiunea 19)

Jurnal de lucru pentru cele 32 de îmbunătățiri din documentul „WonderPages.AI: audit și plan de optimizare a agenților AI”.
Regula de bază: tot ce e nou are o variantă de rezervă; dacă o funcție nu e disponibilă, aplicația se comportă ca în 18.3.
Costuri: zero. Text doar prin Claude Code cu contul Pro (niciodată `--bare`, nicio cheie API), imagini prin Canva Pro.

Stare: [ ] de făcut · [~] în lucru · [x] gata și testat

## Valul 1: bazele (măsurare, contracte, rubrică, buget)
- [x] 2.6 Registru de consum și calitate (server/ledger.js, /api/ledger, CSV, Diagnostic)
- [x] 1.3 Contract de ieșire: scheme JSON în blueprint, `--json-schema` când e disponibil, validare locală mereu
- [x] 1.2 Carta în promptul de sistem (`--system-prompt-file`), rezervă: în mesaj
- [x] 1.1 Cartele agenților (5 secțiuni) + prompturi fără „You are…” duplicat
- [x] 2.2 Rubrică cu coduri (T01…, V01…), motiv opțional la respingere
- [x] 1.7 Critic pe criterii, cu citate; scor calculat în cod; praguri pentru criteriile critice
- [x] 2.1 Verificarea de structură ca poartă înainte de critic
- [x] 2.5 Guvernator pe 5 ore + 7 zile, estimare înainte de start
- [x] 1.9 Fișierele Proiectului „Studioul WonderPages” (docs/claude-project/)
- [x] 3.4 Export lunar al cunoștințelor (Markdown, zip)

## Valul 2
- [x] 1.4 Prefix stabil (ordinea blocurilor în prompturi)
- [x] 1.5 Dieta de context (Bible doar cu personajele volumului)
- [x] 1.8 Registrul de continuitate persistent (mod incremental)
- [x] 2.3 Revizie țintită pe pagini, a doua rundă doar dacă nota crește
- [x] 2.4 Alinierea EN–RO verificată în cod
- [x] 2.7 Kit de brand Canva pe proiect
- [x] 2.8 Șabloane de brand + autofill pentru copertă
- [x] 2.11 Porți cu diferențe și motive
- [x] 3.1 Lecții cu dovadă și efect măsurat
- [x] 3.2 Lecții alese după etapă și criteriu, cu plafon de mărime
- [x] 3.3 Retrospectiva de volum
- [x] 3.6 Setul de aur
- [x] 3.9 Catalog de eșecuri vizuale automat

## Valul 3
- [x] 1.6 Rutarea modelelor (prompt_models, model_variants)
- [x] 1.10 Skill-uri Claude Code pentru Inginer
- [x] 2.9 Promovare prin redimensionare
- [x] 2.10 Corecturi în Canva prin comentarii
- [x] 2.12 Orchestrare hibridă (scenariul N+1 în timpul imaginilor N)
- [x] 3.5 Procedura lunară de rafinare (în Proiect) + variante noi
- [x] 3.7 Variante cu promovare și retragere
- [x] 3.8 Praguri de critic calibrate pe vârstă
- [x] 3.10 Raport de evoluție pe versiuni

## Jurnal
- 28.09: valul 1 gata și testat (38 de teste). Pe drum: 1.4, 1.5, 1.8, 2.3, 2.4, 2.11, 3.1, 3.2, 3.9, 3.10 (partea de server).
  Descoperit și reparat: `probeFlags()` nu era apelat niciodată (promptul scurt și limitarea uneltelor nu funcționau);
  scrierea fișierelor JSON locale se putea ciocni (ENOENT la rename); mesaje de eroare rămase de la varianta cu API.
- 28.09: valurile 2 și 3 gata. Teste: 49 (inclusiv livrarea PDF) + verificare în browser (13/13; singura eroare de consolă este fontul Andika, care lipsește în mediul de test și e descărcat de instalator).
- De verificat la prima colecție reală (nu se poate simula aici): dacă `--json-schema` merge împreună cu `--tools ""` (dacă nu, aplicația oprește singură schema după prima eroare și validează local); câte apeluri încap efectiv în limita săptămânală; câmpurile reale ale șablonului tău de copertă din Canva.
