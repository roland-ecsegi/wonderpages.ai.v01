# Dinosaur World — migration dry-run (P2-T05)

Generat cu `planMigration()` pe arhiva originală (nemodificată). Dry-run: nimic scris.

| Câmp | Valoare |
|---|---|
| Sursă | sha256 `7056e113bf5c84fdfc0f7b8f528713de6c8fe31e82b40fbab056544fe10e45e3`, format wonderpages-project v1, proiect original `p5405a8a96j4w` |
| Integritate | manifest de referință: 5/5 intrări conforme |
| Contract | valid: true; input valid: true; blueprint v15 |
| Inventar | 6 artefacte, 6 volume, 72 planuri de pagină, 12 pagini de manuscris, 2 referințe, 0 aprobări |
| Referințe | uploads/01-milo-reference.png 1199×1312 da8cbac3255e…; uploads/02-tia-reference.png 1222×1287 14c574ddb45b… |
| Prompturi personalizate păstrate | adapt, critic, native_critic, page_fix, polish, revise_pages, script, series, visual_qa |
| Conflicte | turn-type@v1 (dual_authority); projection:series.volumes[0].summary (unverified_projection); finding:DW01 (semantic_conflict) |
| Neproduse (nu se generează la migrare) | volume fără manuscris: 2, 3, 4, 5, 6; artă: absentă |
| Transformări | T1-raw-retention, T2-id-mapping, T3-contract-snapshot, T4-version-pins, T5-typed-adapter, T6-conflict-report, T7-gates-pending |
| Plan | `9a58c1c2e4eaf31fd55749da173b77791994ab2647017407719dd03db90154e0` · rulare: `mig-7056e113bf5c84fdfc0f7b8f` (idempotentă per sursă) |

Rularea reală pe instalația operatorului (P8-T05) cere backup înainte; reparațiile DW01/DW02 sunt propuneri pentru operator (P4-T05), nu transformări automate.
