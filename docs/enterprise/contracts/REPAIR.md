# Planificator selectiv de reparații și verificarea lor (P5-T06)

Implementare: `server/quality/repair.js`; integrarea în aplicarea modificărilor pe elemente (`applyItemChanges`, `server/engine.js`); `GET /api/projects/:pid/repairs`, `GET /api/projects/:pid/missing/:v`.

## De la lista de probleme la PagePatch

Fiecare element cu „Cere modificare / Refă / Aprobă cu notă” devine un patch cu țintă exactă și operație:

| Operație | Țintă | Dependenți invalidați explicit | Recheck cerut | Creativă? |
|---|---|---|---|---|
| exact (înlocuire „X” cu „Y”) | `final_v#p` | `tr_v#p` (revalidare) | siguranță, aliniere nativă | nu (locală, fără AI) |
| semantic (rescrie pagina) | `final_v#p` | `ill_v_p:color`, `ill_v_p:line`, `tr_v#p` | contract de poveste, critic, siguranță | da |
| color (redesenează) | `ill_v_p:color` | `ill_v_p:line` | QA vizual complet (toate dimensiunile), siguranță, linia | da |
| line (doar pagina de colorat) | `ill_v_p:line` | — | verificarea liniei | da |
| document | cheia documentului | graful canonului | canon, matrice | da |

## Garanții

- **Limită**: cel mult 2 încercări creative pe element; a treia nu se execută — elementul trece la operator cu istoricul: hash-urile țintei înainte/după și numărul de apeluri ale fiecărei încercări.
- **Fără regenerări necerute**: hash-urile tuturor unităților volumului (pagini text/scenariu/nativ, culoare, linie) se compară înainte/după; orice schimbare în afara țintelor și a dependenților declarați este raportată (`verify.unrequested`).
- **Rezolvare doar cu recheck complet curent**: culoarea — QA pe imaginea curentă, pozitiv pe toate dimensiunile (anatomie bună dar acțiune greșită rămâne deschis); linia — derivată din culoarea curentă și verificată pe fișierul ei; înlocuirea exactă — textul nou prezent, cel vechi absent. Starea se recalculează din starea curentă, deci o contra-dovadă ulterioară redeschide problema.
- Raportul fiecărei aplicări (plan, verificare, rezolvări, elemente pentru operator, apelurile făcute) se păstrează în proiect (ultimele 20).

## Proiecte migrate (Dinosaur World)

`missingUnits` planifică numai unitățile lipsă sau eșuate: pentru V1 cele 13 ilustrații și 13 pagini de colorat; textul V1 și referințele originale nu intră în plan; V2–6 au manuscrisele de scris.
