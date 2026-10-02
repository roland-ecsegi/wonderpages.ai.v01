# Carantina cunoașterii și proveniența ingestiei (P7-T01)

Materialul importat este o **sursă** (`server/knowledge/store.js`, `knowledge/store.json`): tip, referință, sha256,
fișiere, drepturi, stare (`active` / `revoked`) și un **index de revocare** (`derived`) cu tot ce s-a promovat din ea.
Tot ce s-ar putea învăța din sursă devine **candidat**, niciodată cunoaștere activă:

| Tip | Din | La promovare devine |
|---|---|---|
| `lesson` | `lessons` / `lessons_file` | lecție activă (cu `provenance.sourceId/candidateId`) |
| `world_rule` | `world_rules` | lecție a păstrătorului de continuitate |
| `example` | `text_examples` | exemplu de text aprobat |
| `failure` | `image_examples` respinse | tipar de greșeală vizuală |
| `lesson_history` | registrul LL | (doar istoric; se reformulează înainte de promovare, P7-T02) |

## Scanarea de carantină

`INSTRUCTION_INJECTION` (ignoră/suprascrie reguli, „act as”, scripturi, comenzi shell, chei/secrete, ștergeri),
`FAKE_QUOTE` (citatul nu există în fișierul citat), `WORLD_RULE_CONFLICT` (lumină/vreme magice implicit),
`CONTRADICTS_ACTIVE` (neagă o regulă activă pe același subiect), `CANON_COLLISION` (contrazice canonul reconciliat —
LL-013 ↔ Dinosaur World p9). Un candidat în carantină nu se poate promova.

## Importul de pachet

- Fișierele sunt păstrate ca atașamente inerte (servite ca descărcare); scripturile/HTML nu sunt niciodată ingerate (`scriptFiles`).
- Cheile `charter`, `agents`, `skills`, `system_prompt`, `settings`, `policies`, `rubric`, `blueprint`, `thresholds` sunt ignorate și raportate (`ignoredKeys`): un import nu poate schimba carta, abilitățile sau cunoașterea activă.
- Numerele sunt exacte: `candidates`, `quarantined`, `failed` (+ `failedItems`), `unsafeSkipped` (siguranța P5-T01).
- Reimportul aceluiași pachet revocă sursa anterioară; ștergerea pachetului revocă sursa și **tot** ce s-a promovat din ea (lecții → `revoked`, exemple și tipare eliminate).
- Politica manuală a operatorului (`POST /api/lessons`) rămâne distinctă și activă imediat.

## API

`GET /api/knowledge/sources` · `GET /api/knowledge/candidates[?status=&source=]` · `POST /api/knowledge/candidates/:id/promote` ·
`POST /api/knowledge/candidates/:id/reject` · `POST /api/knowledge/sources/:id/revoke` · `POST /api/knowledge/ingest-lessons-registry`.

## Dinosaur World / LL

Registrul `docs/LESSONS-LEARNED.md` și documentele DW rămân brute; ingerarea registrului creează candidați istorici, iar
LL-013 este în carantină (`CANON_COLLISION` cu p9 reconciliat). Pagina 9 canonică nu se suprascrie.
