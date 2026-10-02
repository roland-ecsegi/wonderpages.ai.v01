# Progres și inspectabilitate (P3-T06)

Implementare: `server/observability/events.js`, `server/observability/progress.js`, rutele din `server/enterprise-routes.js`, SSE în `server/index.js`, UI în `public/app/core.js`, `public/app/views.js`, `public/app/actions.js`.

## Fluxul de evenimente (SSE cu cursor)

- Fiecare eveniment `change` primește un `id` monoton (`wonderpages.event-stream/1`), persistat împreună cu ultimele 500 de evenimente în documentul `_events/stream.json` (debounce 250 ms; scris și la oprirea ordonată). Numerotarea continuă după repornirea hostului.
- La conectare, serverul trimite `retry: 3000` și un eveniment `hello` cu `head` (cursorul curent). Browserul retrimite automat `Last-Event-ID` la reconectare (deconectare de rețea, laptop suspendat, host repornit); serverul reia **exact** evenimentele lipsă, în ordine, fără goluri.
- Cursor imposibil de servit exact (mai vechi decât inelul — `cursor_expired`; mai nou decât hostul, de ex. evenimente pierdute într-un crash — `cursor_ahead`) → eveniment `reset`: clientul reîncarcă tot. Niciodată un gol tăcut.
- Clientul aplică fiecare `id` o singură dată (un id reluat sau repetat este ignorat) → niciun eveniment duplicat vizual.
- Conținut sanitizat: numai `scope`, `pid`, `kind`, `key`, `status`, `unit` (fără text editorial, prompturi sau secrete).
- Ștergerea definitivă a unui proiect elimină id-ul lui din flux înaintea copiei de siguranță curate (inclusiv evenimentele întârziate).
- Evenimentele `live` (apelurile în curs) rămân tranzitorii, fără id.

## Progres adevărat — `GET /api/projects/:pid/progress` (`wonderpages.progress/1`)

- Unitățile de lucru provin din joburile durabile (P3-T03) ale **rulării curente** (`job.meta.run === project.run`). O replanificare totală (respingere cu reluare de la început) nu moștenește „gata”: unitățile vechi apar ca `superseded` și nu se numără; o unitate refolosită este marcată `reusedFromRun`.
- Pe etapă: unități comise / sărite / eșuate / în așteptare / ambigue, elemente (`done/total`), motivul opririi.
- Așteptări explicite: decizia ta la poartă (`human`), limita abonamentului cu ora reluării, furnizor cu pauză (`waiting_provider`), unitate ambiguă (decizia operatorului).
- Consum: apeluri text/imagine și erori din registrul de consum; tokeni **măsurați** numai unde furnizorul i-a raportat, altfel `null` cu mențiunea „necunoscut” (niciodată 0). Cota per canal din descoperire: `ok` / `limited` / `unknown`.
- **Estimare**: numai măsurată (mediana a cel puțin 3 unități comise, nereutilizate, ale etapei care rulează) × elementele rămase, limitată la etapa curentă, fără așteptări la furnizor și fără deciziile tale. Altfel `value: null` cu motivul. Nu există ETA pentru întregul proiect.

## Inspector — `GET /api/projects/:pid/inspect/:key` (`wonderpages.inspect/1`)

Leagă **versiunea efectivă** a documentului de unitatea care a comis-o (`job.result.versions[key] === version`, preferând unitatea interioară), cu încercările (rezultat, apeluri externe cu `providerJobId`, motivul opririi), proveniența (canal, agent, model și sursa lui, prompt, lecții), manifestul de context efectiv (carta, rolul, politica, lecții incluse/excluse, hash-urile sistemului și promptului), consumul unității (rândurile registrului au acum cheia unității), istoricul versiunilor, aprobările (versiunea aprobată vs. curentă) și deciziile care o menționează. O versiune fără unitate (editare manuală, schimb manual, import, migrare) este declarată ca atare.

## UI

- **Progres**: panoul „Unități de lucru (rularea N)” cu numerele din jurnalul durabil, estimarea măsurată sau motivul absenței ei, consumul măsurat/necunoscut, cota per canal, așteptările și motivul opririi.
- **Activitate**: unitățile rulării curente (stare, ieșiri cu versiuni, apeluri externe, motivul opririi, rezolvarea unităților ambigue cu avertismentul de consum dublu), inspectorul și lista pachetelor de schimb manual (descărcare, ultima respingere).
- Închiderea browserului nu oprește hostul; navigarea existentă este păstrată.

## Validare

`tests/35-p3-progress.test.mjs` (TEST-P3-T06): inel/cursor/reset/persistență peste repornire/purjare; reconectare SSE reală cu `Last-Event-ID` comparată cu un client rămas conectat; estimare numai măsurată și cotă necunoscută; producție → progres = unități comise, inspector legat de versiunea curentă, UI randat într-un browser real (CDP, `tests/cdp.mjs`) cu aceleași numere și același inspector; replanificare totală → rularea 2 reexecutată, nimic moștenit.
