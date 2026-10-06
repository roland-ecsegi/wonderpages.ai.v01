# Status matrix — DECIDED / IMPLEMENTED / VALIDATED

Each row names its claim (`brain/manifest/SOURCES.json`). The gate checks that every claim id cited here exists and that its
anchors are present in the sources. "VALIDATED" is used only in the sense the source states: implementation correctness, human
adjudication of labels, or independent empirical validation. These are three different things and are never merged.

| Item | DECIDED | IMPLEMENTED | VALIDATED | Claim |
|---|---|---|---|---|
| Product Contract (6 vol × story + coloring × 12 pages; 3 age bands) | yes | yes (enforced at import/create/gates) | tests only | `C-PRODUCT-CONTRACT` |
| P1–P7 | yes | DONE | tests (local + PostgreSQL) | `C-P1-DONE` … `C-P7-DONE` |
| P8 | yes | software DONE; P8-T05 BLOCKED; P8-T06 PARTIAL | real DW evidence missing | `C-P8-PARTIAL` |
| P9 | — | NOT AUTHORIZED | — | `C-P9-NOT-AUTHORIZED` |
| 11 permanent agents, RoleContracts, separate ModelBinding | yes | yes | maturity *unproven* | `C-AGENTS` |
| Provider channels | yes | yes | UNKNOWN on the operator host | `C-PROVIDERS` |
| Creative Upgrade workflow | yes | mechanical DONE | real run BLOCKED / NOT_RUN | `C-CU` |
| Gold-v1 | yes | frozen | 44/44 labels adjudicated by the operator; no evaluator validated | `C-GOLD-V1`, `C-GS` |
| Gold-v2 | yes | built, immutable | adjudication 0/226; NOT_COMPLETE | `C-GOLD-V2`, `C-HARDENING` |
| Old held-out | retired (D-20) | sealed | not an acceptance set | `C-OLD-HOLDOUT`, `C-HOLDOUT-RUN-1` |
| Evaluator v2 (current) | — | CURRENT IMPLEMENTATION, does not comply with D-01…D-22 | not validated | `C-EVALUATOR` |
| Test suite 428/428 | — | yes | implementation correctness only, not policy validation | `C-TESTS` |
| Policy D-01…D-22 | DECIDED | NOT IMPLEMENTED | NOT YET EMPIRICALLY VALIDATED | `C-DECISIONS-STATE` |
| D-19 coverage / D-21 gates / D-22 independence | DECIDED | NOT IMPLEMENTED | NOT VALIDATED | `C-D19`, `C-D21`, `C-D22` |
| Accidents A-01…A-30 | known gaps | none repaired | — | `C-ACCIDENTS` |
| Open policy dependencies | OPERATOR_DECISION_REQUIRED | — | — | `C-DEPENDENCIES` |
| Pre-SH#2 build list, post-closure order | order DECIDED | NOT STARTED, NOT AUTHORIZED | — | `C-SH2-PREREQS`, `C-POST-CLOSURE-ORDER` |
| Semantic Hardening #2 | — | NOT AUTHORIZED / NOT STARTED | — | `C-SH2` |
| Enterprise acceptance | — | — | NOT CLAIMED | `C-ENTERPRISE-ACCEPTANCE` |
| Dinosaur World production | DW01/DW02 decided | STOPPED | — | `C-DW-STOPPED`, `C-DW-DECISIONS` |
| Continuity system (CONTINUITY-1) | authorized | this phase | brain self-tests, fresh-session test, zero-drift | `C-CONTINUITY-AUTH` |
