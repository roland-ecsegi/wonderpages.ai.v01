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
