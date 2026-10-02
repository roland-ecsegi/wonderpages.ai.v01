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

## Versiuni imuabile, VariantSet, retenție (P2-T03)

`server/persistence/artifact-store.js`, `server/persistence/rebind.js`.

- Fiecare `writeArtifact` scrie în același commit: pointerul curent, versiunea imuabilă (`versions/<key>/<v>.json`, conținut + hash canonic) și, când există `basedOn`, muchia de lineage tipizată (`dependencies/<key>@<v>.json`).
- Pin-uri: `approved` (la aprobarea unui element — exact versiunea aprobată), `released` (la receipt-ul PDF final), `operator`, iar `evidence`/`migration` sunt rezervate pentru P5/P2-T05. O versiune fixată nu este eliminată niciodată de retenție.
- Restaurarea citește stocul imuabil (fallback: istoricul încorporat legacy), verifică hash-ul (versiune coruptă → 409 `version_corrupt`) și scrie o **versiune nouă** cu `restoredFrom {version, hash}`; dependenții cu aceeași amprentă de scenă sunt re-legați, ceilalți rămân expirați.
- Retenția: `GET /api/projects/:pid/retention?keep=N` (dry-run, `planHash`); `POST …/retention/apply {planHash, keep}` doar pe laptop, refuzat dacă planul s-a schimbat. Nu atinge versiunile curente, fixate sau referite; fișierele de imagine rămân (GC separat).
- API: `GET …/artifacts/:key/history` (istoric complet + VariantSet), `GET …/variants/:key`, `POST …/variants/:key/pin`.
- Backfill legacy: istoricul încorporat (≤5) și documentul curent devin versiuni marcate `backfill`; nu se inventează variante.

## Pachet v2 și migrator (P2-T05)

- **Export v2** (`GET /api/projects/:pid/export.zip`) = superset al v1 (aceleași câmpuri în `project.json`, deci importatorul v04 îl citește) + `versions` (istoric imuabil, pin-uri, adnotări), `dependencies`, `decisions` (evidență), `rights`, `contract`, `files/raw/**` (surse de migrare) și `manifest.json` cu bytes + sha256 pentru fiecare fișier. Exclude secrete și setări.
- **Import v1/v2**: schemă nesuportată → `unsupported_schema`; v2: manifest obligatoriu, orice fișier lipsă/alterat → `package_missing_file` / `package_corrupt`, asset referit absent → `package_missing_asset`; numerele de versiune originale și lineage-ul (`basedOn`) se păstrează; istoricul v2 intră fixat `migration`; deciziile originale devin evidență; orice eroare retrage proiectul nou (fără proiect parțial). Un pachet v1 fără asset-uri referite doar avertizează (comportament v04).
- **Adnotări**: verdictele QA scrise în conținutul curent (`patchArtifact`) se înregistrează pe versiune (`annotatedHash`, `annotations`); hash-ul original rămâne.
- **Migrator** (`server/migration/migrator.js`): `POST /api/migrations/plan` (dry-run read-only, `planHash`), `POST /api/migrations/run?plan=…` (laptop), `GET /api/migrations`, `GET /api/projects/:pid/migration-report`. Transformările T1–T7, idempotență per hash de sursă, raport preserved/repaired/new/revalidate, rollback la orice eroare. Raportul DW: `docs/enterprise/migration/DW-DRY-RUN.md`.
