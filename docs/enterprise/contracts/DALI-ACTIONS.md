# Dali: propuneri de acțiune și interfața cunoașterii (P7-T06)

Ce întoarce modelul este o **propunere** validată de server (`server/assistant.js`), niciodată o comandă executată.

| Tip | Mutează | Regulă |
|---|---|---|
| `navigate` | nu | numai rute reale (registrul de rute: secțiuni, `#/p/<id existent>/<tab>`, atelierul `#/p/<id>/book/<v>/<p>`); altfel `invalid_route` |
| `fill_project` | nu | completează formularul; crearea rămâne a ta |
| `add_improvement` | da | numai dacă **mesajul tău** o cere (intenție); devine propunere `proposed`, aplicată doar la confirmare |
| orice altceva (aprobare, promovare, publicare, trimitere, livrare, ștergere, pornire) | — | refuzat (`not_allowed`), indiferent ce spune promptul sau un document injectat |

Confirmarea: `POST /api/assistant/:sid/proposals/:id {confirm: true|false}` — verifică existența, expirarea (15 min),
proiectul (`stale_project`) și revizia lui (`stale_revision`); o propunere decisă nu se mai aplică (`proposal_decided`).
Răspunsul distinge clar `actions` (acceptate / propuse) de `rejected` (cu motiv).

Contextul lui Dali include sursa proiectului (de ex. `migration`), numărul aprobărilor date efectiv și starea raportului de
reconciliere; Dali nu poate afirma aprobări care nu există.

**Inspectorul memoriei rolului:** `GET /api/agents/:id/memory` — lecțiile pe stare (active/candidate/revocate), domeniu,
versiune și versiuni anterioare, proveniență, decizia de promovare, dovezi (confirmări/contradicții), efect; candidații de
cunoaștere ai rolului; experiența pe abilități. Pagina Agenți: „Inspector memorie” și „Maturitate pe abilități”.
