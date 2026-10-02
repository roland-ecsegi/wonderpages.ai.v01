# ADR04 — Paginare: strict12 implicit, `legacy-scene-expansion` separat

- **Status:** adoptat în P1-T01 (2026-10-02), conform arhitecturii (KEY ARCHITECTURE DECISIONS / ADR04).
- **Context:** contractul protejat cere 12 pagini de conținut per carte, plus coperți. Codul v04 tratează cele 12 elemente ca scene și produce: digital 14 pagini (copertă + 12 + spate), KDP Story 28 și Coloring 26 (preliminare, pagini separate imagine/text, verso-uri goale, copertă wrap separată) — verificat în `server/printprofile.js` și în testul nou `tests/20-p1-contract.test.mjs`.

## Decizie

1. Cartea canonică are **12 pagini de conținut**; numărul nu se schimbă pentru benchmark sau destinație.
2. Profilurile `digital` și `print` au semantica **`strict12`** (14 pagini fizice cu coperțile în carte).
3. Profilul `kdp` existent se păstrează sub semantica **`legacy-scene-expansion`**: `explicitOptIn: true`, `requiresApproval: true`, mapare explicită pagină fizică → pagină canonică (`pageMap`). Nu este numit „12 pagini fizice”.
4. Un interior strict12 este **incompatibil** cu minimul KDP de 24 de pagini; `profileCompatibility()` întoarce `incompatible`, niciodată `ready`. Nu se umple cartea cu conținut artificial.
5. `ready` nu este acordat de contract pentru niciun profil; readiness cere măsurători (P6-T05) și, pentru tipar, dovadă de proof.
6. Un proiect migrat nu trece automat la prezentarea legacy.

## Implementare

- `server/domain/product-contract.js`: `renderingProfiles` cu `semantics`, `physicalPages`, `pageMap`; `profileCompatibility()`.
- `GET /api/projects/:pid/print-plan` raportează acum `semantics` și `canonicalContentPages` (comportamentul existent 28/26 neschimbat).
- Snapshoturile v14 (fără preset `kdp`) nu primesc retroactiv profilul KDP.

## Alternative respinse

Creșterea tăcută a numărului de pagini sau eticheta „14 pagini KDP-ready”: schimbă sensul contractului sau afirmă fals compatibilitatea.

## Reconsiderare

Numai printr-o decizie explicită de ProductContract / nevoie de canal, nu prin paritate cu un competitor.

## Extindere P6-T04 (2026-10-02): profiluri versionate și aprobarea prezentării legacy

- `server/printprofile.js`: `PROFILE_VERSIONS` (digital/print `strict12`, kdp `legacy-scene-expansion`, fiecare cu `version`) și
  `PROFILE_RULES` (versiunea 1, înregistrată la 2026-10-02, cu sursele KDP citate): bleed 0,125 in pe marginile exterioare;
  minime de pagini pe cerneală — alb-negru 24, color premium 24, **color standard 72**; grosimea hârtiei pe pagină
  (alb-negru alb 0,002252 / crem 0,0025; color premium alb 0,002347; color standard alb 0,002252); margine interioară după
  numărul de pagini (24–150 → 0,375 in, …); text pe cotor numai de la 80 de pagini. Regulile se reverifică înainte de publicare.
- `pageMap(count, book, profile)`: pagina fizică → pagina canonică, rol (copertă, conținut, ilustrație, text, preliminare,
  verso gol), **parte** (pagina fizică 1 = recto) și **deschidere** (perechile 2–3, 4–5, …).
- `spreadLeaks(map, PageBlueprints)`: o întrebare/cârlig al cărei răspuns ajunge pe aceeași deschidere fizică după mapare
  este semnalată (de ex. în `strict12` digital paginile canonice 1–2 sunt pe deschiderea fizică 2–3).
- `destinationCheck()`: `strict12` nu este niciodată compatibil KDP; prezentarea legacy este `requires_approval` până la
  aprobarea explicită per carte (cerneală + hârtie + `mapHash` + versiunea profilului); color standard pentru 28 de pagini
  este `incompatible` (nicio utilizare greșită a culorii standard). Nicio stare nu este „ready” (P6-T05 măsoară).
- `POST /api/projects/:pid/print-profile` (aprobare / retragere, înregistrare de decizie `print_profile`; contractul canonic
  de 12 pagini rămâne identic, verificat prin hash), `GET /api/projects/:pid/print-profiles` (toate profilurile × cărți,
  cu scurgeri pe volume și coperta separată), `print-plan` include verificarea și coperta (cotor din cerneala/hârtia aprobată).
- Exportul final KDP fără aprobarea cărții este refuzat (`profile_not_approved`); validatorul PDF calculează coperta cu
  același cotor. Comportamentul 28/26 este neschimbat; doar etichetat și aprobat.
