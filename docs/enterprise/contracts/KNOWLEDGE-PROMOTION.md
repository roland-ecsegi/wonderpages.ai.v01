# Validarea, domeniul și porțile de promovare ale cunoașterii (P7-T02)

O lecție se naște într-**un** proiect (din decizia operatorului, dintr-o propunere retrospectivă sau dintr-un candidat
importat promovat într-un proiect ales). Lărgirea ei este o decizie bazată pe un **raport**, niciodată o difuzare.

| Țintă | Cerință (`server/knowledge/promotion.js`) |
|---|---|
| `project` (același sau alt proiect) | proiectul ales; restrângerea nu cere dovezi |
| `age` | ≥ 2 proiecte distincte de acea vârstă o confirmă; niciun caz negativ la acea vârstă |
| `global` (rolul agentului, toate proiectele) | ≥ 3 proiecte, ≥ 2 teme diferite; niciun caz negativ |
| oricare lărgire | nu numește personaje/locuri/obiecte din canonul unui proiect (specifică proiectului), sursa nu e revocată, siguranța copiilor nu e BLOCK, nicio semnalare de carantină (injecție, lume magică implicit, coliziune cu canonul) |

Dovezile: `projects` (confirmări, cu vârsta și tema fiecărui proiect) și `negatives` (contradicții înregistrate de
`learnFromEvent`). Contractul de produs și siguranța au prioritate față de orice preferință învățată.

## Flux

1. `GET /api/lessons/:id/promotion-report?scope=&age=&pid=` → `{ eligible, reasons, evidence, named, hash }`.
2. `POST /api/lessons/:id/scope {scope, age, pid, reportHash, note}` — fără `reportHash` doar previzualizează; cu un hash
   vechi → `stale_report`; neeligibil → `promotion_blocked`. Altfel: decizie `knowledge_promotion` (raport, dovezi, versiune),
   lecția primește `version + 1`, versiunea anterioară rămâne în `versions` (fixată).
3. `POST /api/knowledge/decisions/:id/rollback` — restaurează exact versiunea anterioară (decizie `knowledge_rollback`,
   `supersedes`); doar pentru ultima decizie a lecției (`not_latest` altfel). Istoricul nu se pierde.

Propunerile retrospective se acceptă numai la nivel de proiect (`single_case`). Politicile manuale ale proprietarului
(`POST /api/lessons`) rămân explicite. Revocarea sursei (P7-T01) face lecția derivată `revoked` și raportul neeligibil.

## Dinosaur World

„Tia ține obiectele numai cu gura” rămâne regulă a proiectului (numește un personaj din canon); verificarea generică
„cine ține ce și cu ce parte a corpului” se validează separat, cu dovezi din mai multe proiecte și teme.
