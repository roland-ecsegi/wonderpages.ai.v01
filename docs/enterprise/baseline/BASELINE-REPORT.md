# Baseline report (2026-10-02, cod 730aa69)

Generat de `scripts/enterprise/baseline-report.mjs`. NOT_RUN nu este PASS; istoricul este separat.

| Check | Status | Rezumat | Log |
|---|---|---|---|
| INVENTORY | PASS | 194 fișiere (fără node_modules/.git/data), 6 ascunse |  |
| SOURCE_DRIFT_V04 | PASS | 124/137 fișiere v04 identice, 13 modificate (enterprise), 51 adăugate, 0 lipsă |  |
| BUILD | PASS | PASS: 109 fișiere JavaScript, JSON, lockfile, fonturi și fișiere runtime; WonderPages AI — claude-gpt.v04 | `docs/enterprise/baseline/logs/2026-10-02-build.log` |
| RS0_SUITE | PASS | 151 trecute, 0 picate, 0 sărite; browser PDF: da | `docs/enterprise/baseline/logs/2026-10-02-rs0.log` |
| PROTECT_IMPORT | PASS | 7/7 teste |  |
| PROTECT_APPROVALS | PASS | 19/19 teste |  |
| PROTECT_PDF | PASS | 4/4 teste |  |
| PROTECT_BACKUP | PASS | 8/8 teste |  |
| PROTECT_LEARNING | PASS | 5/5 teste |  |
| PROTECT_ATELIER | PASS | 2/2 teste |  |
| PROTECT_LAN | PASS | 5/5 teste |  |
| PG_QA | PASS | PASS: PostgreSQL real — CRUD, istoric, backup DB+fișiere, restaurare, rollback tranzacțional; numărul proiectelor instalate păstrat. | `docs/enterprise/baseline/logs/2026-10-02-pg-qa.log` |
| RS0_SUITE_POSTGRES | PASS | 151 trecute, 0 picate, 0 sărite (STORAGE=postgres) | `docs/enterprise/baseline/logs/2026-10-02-rs0-postgres.log` |
| DW_REFERENCE | PASS | sha256 7056e113bf5c…, manifest 5/5, 6 artefacte, 6 volume, 72 planuri, 12 pagini V1, 2 PNG; producție nepornită |  |
| RUNTIME | PASS | Node v22.22.0, npm 10.9.4, linux 6.18.44-fc-v51 x64 |  |
| PROVIDERS_REAL | NOT_RUN | Fără apeluri reale în baseline (claude: instalat, codex: absent); discovery în P1-T03 |  |
| WINDOWS_INSTALLER | NOT_RUN | hostul de referință Windows nu este acest mediu |  |
| DOCKER_POSTGRES | NOT_RUN | Docker prezent, dar nu se pornește în baseline |  |

## Istoric (nu rulare nouă)

- 2026-10-01: 91/91 PASS (simulați) — Audit_Full_WonderPages_AI_v04.pdf pp. 250–251 / docs/v04/RAPORT-V04.md. raport istoric; nu este rezultatul acestei rulări

Total: 15 PASS · 0 FAIL · 3 NOT_RUN
