# Dinosaur World Enterprise — decizia DW01

| Câmp | Valoare |
|---|---|
| Decizie | **Varianta A — aliniere la paginile 8–9**, aprobată de operator la 2026-10-04 |
| Text aprobat | „Milo găsește o pietricică strălucitoare, o urmărește pe cărare, o cunoaște pe Tia și se adăpostesc împreună de ploaie sub o frunză lată.” |
| Câmpuri modificate (exact 3) | `series.volumes[0].summary`; `series.volumes[0].story_bible.premise`; `script_0.story_bible.premise` |
| Versiuni | `series` v2 → v3, `script_0` v2 → v3; v2 păstrate în istoric (restaurabile) |
| Înregistrare | decizie `reconcile`, stare `approved`, domeniu `{ conflicts: ["DW01"] }`, actor `operator@laptop` |
| Ce NU reprezintă | aprobarea manuscrisului V1, a volumului, a colecției sau a altor porți de revizuire/calitate (aprobările rămân 0) |
| Neatinse (verificat) | cele 12 pagini EN/RO (toate câmpurile), planurile paginilor V1, restul premisei V1, volumele 2–6, brief, biblie, distribuție, referințe, etapele, statusul proiectului, arhiva originală (SHA-256 `7056e113…`) |
| Rămas deschis | **DW02** (decizie separată, neaplicată) |
| Dovezi | `DW01-VERIFICARE.json` (diferența completă înainte/după), `pachet/dinosaur-world-enterprise.zip` (pachet Enterprise v2 cu versiuni și decizie) |
| Rollback | stării de dinainte de această etapă: commitul Git `34750b0`; în proiect: restaurarea v2 a `series` și `script_0` |

Aplicat prin aplicația reală (`scripts/enterprise/dw-workspace.mjs apply`), pe proiectul Enterprise separat din
`dinosaur-world-enterprise/` (datele vii `data/` nu sunt versionate). Arhiva originală din `reference/` este read-only.
