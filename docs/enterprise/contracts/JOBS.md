# Joburi durabile, lease și fencing (P3-T03, ADR06)

Surse: `server/jobs/scheduler.js`, `server/persistence/preconditions.js`, integrarea `unit()` din `server/engine.js`. Tabel `jobs` (migrarea 9) / `projects/<pid>/jobs/<key>.json`. API: `GET /api/projects/:pid/jobs`, `POST /api/projects/:pid/jobs/:key/resolve {action: retry|cancel}` (laptop).

- **Unități**: fiecare etapă executată de `runPipeline` și fiecare element din `runItems` (inclusiv în prefetch) este o unitate cu cheie stabilă (`<stage>` / `<stage>#<i>`) și hash de intrări (definiția unității, inputul proiectului, `run`, note, respingeri, versiunea blueprintului, versiunile artefactelor existente, sarcina de corectură).
- **Ciclul**: `pending → leased → executing → checking → committed`; alternativ `paused`, `cancelled`, `failed`, `waiting_provider`, `skipped`, `ambiguous`. Fiecare tranziție este un commit durabil.
- **Fencing**: lease-ul are un token monoton; `saveArt` primește fence-ul unității curente prin `AsyncLocalStorage` și `writeArtifact` îl verifică **în același commit** (precondiție sub lock local / `SELECT … FOR UPDATE` în PostgreSQL). Un worker expirat sau preluat (`takeover`, de ex. prefetch învechit) nu mai poate scrie (`409 stale_lease`).
- **Efecte externe**: înaintea fiecărui apel la provider (text sau imagine) se înregistrează `external` pe unitatea interioară.
- **Reconciliere la pornire**: lease-urile procesului anterior sunt moarte; unitate fără efect extern → `pending`; unitate cu ieșire salvată → reia verificarea fără apel nou; **unitate oprită după un apel extern fără rezultat → `ambiguous`**, nu se reia automat; operatorul alege `retry` (cu avertisment de consum dublu) sau `cancel`.
- **Reluare**: o unitate comisă cu aceleași intrări (excluzând propriile ieșiri) este refolosită, nu reexecutată; o sarcină de corectură nu este niciodată refolosită.
- **Ieșiri**: atribuite prin fence (nu prin diferență), deci corecte și când două elemente rulează concurent.
- Exact-once la providerii externi **nu** este promis; commit-ul local este idempotent.
