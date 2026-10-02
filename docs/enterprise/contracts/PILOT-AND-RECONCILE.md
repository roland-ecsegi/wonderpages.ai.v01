# Demo → pilot → producție în volum și reconcilierea DW (P4-T05)

Implementare: `server/domain/pilot.js`, verificarea în bucla motorului și în pregătirea în avans (`server/engine.js`), `server/migration/dw-reconcile.js`, rutele `GET /api/projects/:pid/pilot`, `GET /api/projects/:pid/reconcile`, `POST /api/projects/:pid/reconcile/apply`, panourile „Pilot” (Progres) și „Reconciliere” (Activitate).

## Politica pilot

- Volumul 1 este pilotul: întâi **demo-ul** (poarta `review_1` a volumului 1), apoi **cartea completă** (poarta `review_2` a volumului 1).
- Până când ambele porți sunt **decise de operator**, nicio etapă generativă a volumelor 2–N nu rulează — nici normal, nici în **pregătirea în avans** (v19 2.12). Motorul pune proiectul pe pauză cu mesajul „Volumele 2–6 sunt blocate până aprobi pilotul…”; nu se face niciun apel și nu se scrie niciun artefact.
- Stările porților **importate** nu contează (nicio aprobare automată pentru lucrul importat/migrat).
- După aprobarea pilotului, pregătirea în avans continuă ca înainte, de la volumul 3 (în timp ce se desenează volumul 2).
- Un tip de produs fără flux pe volume sau cu `pilot: false` nu este afectat.

## Reconcilierea selectivă (proiect migrat, Dinosaur World)

Raport fără modificări (`dryRun: true`, cu hash):

- **DW01** — cele trei copii ale premisei V1 (`series.volumes[0].summary`, `series.volumes[0].story_bible.premise`, `script_0.story_bible.premise`) spun că prietenii „feresc pietricica de ploaie”, în timp ce paginile 8–9 îi adăpostesc pe prieteni. Propunere țintită: „se adăpostesc împreună de ploaie sub o frunză lată” (textul poate fi înlocuit de operator). Opțiuni: aliniază la pagini / păstrează.
- **DW02** — 8 pagini au alt tip de întoarcere în manuscris decât planul V1 („quiet” peste tot). Pentru fiecare pagină operatorul alege contractul intenționat (implicit: tipul din manuscris) → PageBlueprint-urile V1 canonice.
- **Fapte verificate** (fără schimbare): p1 fără pietricică, p2 prima dezvăluire, p9 Tia ține frunza cu botul.
- **Hash-uri păstrate**: textul EN/RO al fiecărei pagini.

Aplicarea cere hash-ul raportului văzut (`409 stale_report` altfel), scrie **numai** câmpurile alese (versiuni noi, cu notă), înregistrează un `DecisionRecord` de tip `reconcile` cu fiecare schimbare (cale, înainte, după) și nu aprobă nimic. Referințele originale rămân byte-identice.

## Ce rămâne pentru P8

Producția reală DW (pilotul V1 cu imagini, apoi V2–6), comparația înainte/după și reexportul sunt P8-T05/P8-T06 și cer furnizorii reali și deciziile operatorului.
