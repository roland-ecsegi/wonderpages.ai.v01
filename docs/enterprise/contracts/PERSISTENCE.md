# Persistență: UnitOfWork, migrări, revizii (P2-T01, ADR05)

## Schema registry

`server/persistence/migrations.js` — migrări numerotate, aditive, idempotente, cu checksum:

| ID | Nume | PostgreSQL | Local (fișiere) |
|---|---|---|---|
| 1 | schema_migrations | tabel | `_meta/schema.json` |
| 2 | project_revision | `projects.revision` | câmpul `revision` din `project.json` |
| 3 | commands | tabel (deduplicare + evenimente) | `_commands/<pid>/<commandId>.json` |
| 4 | artifact_versions | tabel | `projects/<pid>/versions/<key>/<v>.json` |
| 5 | artifact_dependencies | tabel | `projects/<pid>/dependencies/<id>.json` |
| 6 | decision_records | tabel | `projects/<pid>/decisions/<id>.json` |
| 7 | outbox | tabel | evenimentele din înregistrarea comenzii |
| 8 | migration_runs | tabel | `_migrations/<id>.json` |

Căile sunt rutate pe tabele prin același mecanism `route()` folosit de v04 (documentele JSONB și interfața de stocare se păstrează). Un checksum diferit pentru o migrare deja aplicată **oprește** pornirea (integritate). Nicio coloană nu se șterge; versiunile vechi ale aplicației ignoră tabelele noi. `GET /api/schema` raportează starea.

## commitBatch / UnitOfWork

`storage.commitBatch({ projectId, commandId, expectedRevision, bumpRevision, ops, kind, actor, events, result })`:

1. dacă `commandId` a fost deja comis → întoarce rezultatul inițial (`deduplicated: true`), fără nicio scriere;
2. CAS pe revizia proiectului (`409 revision_conflict` cu revizia curentă);
3. **PostgreSQL**: o tranzacție (`SELECT … FOR UPDATE` pe proiect, toate documentele, înregistrarea comenzii, outbox, `COMMIT`);
   **local**: jurnal redo cu toate documentele complete, scris cu fsync → aplicare atomică per document (tmp + fsync + rename + fsync director) → înregistrarea comenzii → ștergerea jurnalului; un jurnal rămas este reluat la pornire (`recoverJournal`) și înaintea următorului commit al aceluiași proiect;
4. ACK numai după pasul durabil final. O eroare înainte de jurnal/commit nu lasă nimic; o eroare după jurnal se completează la recuperare, iar clientul reia cu același `commandId` fără dublare.

`Repo.createProject` (blueprint + proiect) și `Repo.writeArtifact` (artefact + proiect cu revizie nouă) folosesc commitBatch; consumatorii (engine) nu se schimbă. `Repo.writeArtifact` acceptă `expectedVersion` (409 `version_conflict` cu `currentVersion`, `changedBy`, `changedAt`), `expectedRevision` și `commandId`. API: `POST /api/projects/:pid/artifacts/:key` acceptă `expectedVersion` / `expectedRevision` în corp și antetul `x-wp-command`.

## Snapshot / restaurare

Snapshoturile PostgreSQL includ tabelele de registru; restaurarea unui snapshot mai vechi pornește tabelele noi goale și păstrează registrul schemei instalate. Stocarea locală copiază întregul folder (inclusiv `_commands`, `_journal`, `_meta`). Reconcilierea detectează orfani și fișiere lipsă fără să șteargă.

## Validare

`tests/24-p2-uow.test.mjs` (local + PostgreSQL 16 real efemer) și **întreaga suită rulată și pe PostgreSQL** (`WP_TEST_DATABASE_URL`, check `RS0_SUITE_POSTGRES` în baseline-report).
