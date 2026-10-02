# Decizii, porți și inventar așteptat (P2-T04)

Surse: `server/domain/decisions.js`, `Repo.commitProjectDecision`, `engine.setItemDecisions/decide/completeGate`, `server/enterprise-routes.js`.

- **DecisionRecord** (`projects/<pid>/decisions/<id>.json` / tabel `decision_records`): `kind` (item / gate / canon_change), `actor` (`operator@laptop` sau `operator@lan`), `state`, `note`, `scope` (poartă, volum, rundă, element/propunere), `subject` (cheie + versiune de artefact, hash de conținut al elementului, hash de dependențe, versiuni aprobate), `policyHash` (contract + specificația porții + rubrică + contract editorial), `at`. Append-only.
- **Atomic**: schimbarea stării proiectului (aprobări, închiderea porții) și recordurile de decizie se scriu într-un singur commit, cu CAS pe revizie (`expectedRevision`) și deduplicare (`x-wp-command`).
- **Expirare**: o decizie devine `stale` când conținutul, dependențele sau politica se schimbă; decizia istorică rămâne și se cere una nouă (poarta revine la `pending`).
- **Scop valid**: un element care nu aparține porții deschise este refuzat (`400 resource_scope`); un operator pe o revizie veche primește `409 revision_conflict`.
- **Inventar așteptat**: `expectedInventory()` enumeră textele, ediția în a doua limbă, imaginile color, paginile de colorat și cărțile cerute; `releaseCheck()` blochează pachetul/Drive-ul dacă poarta nu e aprobată, dacă lipsește ceva sau dacă o decizie a expirat (`409 release_blocked` cu lista `errors`).
- **Canon**: o propunere de canon se aplică doar prin decizie explicită pe laptop, legată de hash-ul canonului de bază (`409 stale_proposal` dacă s-a schimbat).
- **Import**: aprobările se resetează; deciziile din arhivă se păstrează ca `importedEvidence` (`authority: none`).

API: `GET /api/projects/:pid/decisions`, `POST /api/projects/:pid/canon/proposals/:id/decide`; `items`, `gate/complete`, `decide` acceptă `expectedRevision` și `x-wp-command`.
