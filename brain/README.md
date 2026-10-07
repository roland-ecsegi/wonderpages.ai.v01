# WonderPages Project Brain — index

The Project Brain is the canonical **index + state model + provenance + navigation layer** over the truth that already
exists in this repository. It does not replace the journal, contracts, records or ledgers. It points at them, binds every
critical claim to an exact anchor, and lets a tool prove that the pointers still hold.

**CHAT IS TRANSIENT. REPOSITORY IS CANONICAL.** Start every session with `node brain/tools/brain.mjs gate` (see `/CLAUDE.md`).

**ACTIVE PHASE:** `RC1-POLICY-DEPENDENCY-CLOSURE` (IN_PROGRESS) · **NEXT_AUTHORIZED_STEP:** `RC1-DEPENDENCY-CLOSURE-WORK` (canonical: `brain/phase/ACTIVE-PHASE.json`)

## Layout

| Path | What it is | Kind |
|---|---|---|
| `/CLAUDE.md` | Bootstrap rules that Claude Code auto-loads | hand-written |
| `brain/BOOTSTRAP.md` | BOOT → verify → load → readiness evidence → WORK | hand-written |
| `brain/CONTINUITY.md` | How the brain stays alive: staleness, review, reseal, phase transitions | hand-written |
| `brain/BRIDGE.md` | Agent Bridge, the one-way mirror and the Claude ↔ ChatGPT protocol (WonderPages side) | hand-written |
| `brain/state/CURRENT-STATE.json` | Machine state: goal, P1–P9, programmes, key statuses, blockers, next step | state |
| `brain/state/CURRENT-STATE.md` | Human view of the state | **generated** (`brain.mjs render`) |
| `brain/phase/ACTIVE-PHASE.json` | Active Phase Contract: allowed, forbidden, write scope, exit criteria, single next step | state |
| `brain/phase/PHASES.json` | Phase registry: exactly one ACTIVE; unknown phase ⇒ gate FAIL | state |
| `brain/phase/authorizations/` | Verbatim operator authorizations of phases (hash-bound from ACTIVE-PHASE) | evidence |
| `brain/phase/authorizations/RC1-POLICY-DEPENDENCY-CLOSURE.operator-instruction.txt` | Verbatim operator authorization of RC1 (2026-10-07), which also accepts the CONTINUITY-1 closure | canonical |
| `brain/phase/history/` | Contracts of closed phases, byte-identical (CONTINUITY-1 phase contract, its EXPIRED delegation) | evidence |
| `docs/enterprise/rc1/` | RC1 deliverables: dependency register, pre-hardening specification, operator decision packages | RC1 output |
| `brain/map/SYSTEM-MAP.md` | Architecture and subsystem navigation | hand-written |
| `brain/map/SUBSYSTEMS.json` | Every tracked file → exactly one subsystem (coverage + per-subsystem seal digests) | manifest |
| `brain/map/AGENTS.json` | 11 permanent agents + default model bindings | **derived** (`brain.mjs index`) |
| `brain/manifest/SOURCES.json` | Canonical Sources Manifest: claims → files → exact anchors; state values bound to claims | manifest |
| `brain/manifest/MIRROR-POLICY.json` | What the one-way mirror exports or excludes; secret-scan patterns | manifest |
| `brain/manifest/BRIDGE-CONTROL.json` | Canonical sha256 of the Agent Bridge control files (rules, schemas, tools, CI) | manifest |
| `brain/ledger/DECISIONS.json` | D-01…D-22 index (ledger hash, closure topic/option, commit) | **derived** |
| `brain/ledger/ACCIDENTS.json` | A-01…A-30 index (area, decisions) | **derived** |
| `brain/ledger/DEPENDENCIES.json` | Open / resolved policy dependencies | **derived** |
| `brain/ledger/STATUS-MATRIX.md` | DECIDED / IMPLEMENTED / VALIDATED matrix with claim references | hand-written, claim-checked |
| `brain/evidence/SEAL.json`, `SEAL-LOG.jsonl` | Freshness seal: per-subsystem digests; hash-chained review log | evidence |
| `brain/evidence/BASELINE-866a441.json` | Zero-drift fingerprint of the functional checkpoint | evidence |
| `brain/evidence/DECISION-B-INGRESS.json` | Evidence for operator decision B (ChatGPT ingress): live ring / no-ring checks, independence, no paid API | evidence |
| `brain/evidence/DECISION-C0-FEASIBILITY.md` | Decision C0 feasibility report: subscription-only Claude wake-up from GitHub (routines vs GitHub Actions), model/effort, limits, security, minimal live-test design | evidence |
| `brain/evidence/DECISION-C0-LIVE.md` | Decision C0 live test: isolated Bridge ingress PR, exact routine configuration, dry run, evidence and verdict rules | evidence |
| `brain/evidence/DECISION-C1.md` | Decision C1: durable ChatGPT → Claude channel (one new ingress PR per wake → Claude Code routine), guarantees, tests, live evidence | evidence |
| `brain/evidence/C1-LIVE-RUN-1.json` | C1 live run 1: first autonomous routine wake (PR #4), platform evidence, run record recovered from the transcript | evidence |
| `brain/ingress/runs/` | Run records written by the C1 routine itself (one file per routine run) | evidence |
| `brain/evidence/CONTINUITY-1-CLOSURE.json` | **CONTINUITY-1 closure checkpoint**: exit criteria, final commits, gates, fresh-session and full-duplex evidence, limitations, retained / stopped artifacts, next phase NOT YET AUTHORIZED | evidence |
| `brain/phase/DELEGATION.json` | Operator Delegation Contract of the active phase (`DELEGATION-RC1`: operator / Claude / ChatGPT authority; what a C1 routine may do), checked by gate G14 | canonical |
| `brain/phase/authorizations/CONTINUITY-1.operator-authorization-C1.txt` | Verbatim operator authorization #13 (C1, cold restart, CONTINUITY-1 closure) | canonical |
| `brain/ingress/CLAUDE-ROUTINE-PROMPT.txt` | Fixed bootstrap instruction of the C1 routine "WonderPages Claude ingress" (entered verbatim in the routine UI) | canonical |
| `brain/tools/c1.mjs` | C1 bootstrap / recheck / scope / authority tool run by the routine from the WonderPages canon | tool |
| `brain/evidence/C0-ROUTINE-PROMPT.txt` | Fixed bootstrap instruction entered verbatim into the C0 routine (hash recorded in DECISION-C0-LIVE.md) | evidence |
| `brain/evidence/CONTINUITY-1-ACCEPTANCE.json` | Exit evidence of CONTINUITY-1: zero drift, 428/428, self-tests, CI, fresh-session 27/27, Bridge | evidence |
| `brain/continuity/` | Fresh-session continuity questionnaire, grader and recorded results | test |
| `brain/tools/` | `brain.mjs` (gate/seal/index/render), `drift.mjs`, `bridge-export.mjs`, `rc1.mjs` (RC1 register / spec consistency, gate G15) | tooling |
| `brain/tests/run.mjs` | Self-tests, including negative tests that must make the gate fail | tests |

## Reconstruct the project: where each answer lives

| Question | Brain entry | Authoritative source (wins on conflict) |
|---|---|---|
| Final goal | `CURRENT-STATE.json` → `goal`; claim `C-GOAL` | `reference/architecture/WonderPages_Enterprise_Master_Architecture.md` OUTPUT-01 |
| Product Contract | claim `C-PRODUCT-CONTRACT` | `docs/enterprise/contracts/PRODUCT-CONTRACT.md`, `server/domain/product-contract.js` |
| P1–P9 and the current position | `CURRENT-STATE.json` → `phases`, `programmes`; `PHASES.json` | `docs/enterprise/JURNAL-IMPLEMENTARE.md` (task table, checkpoint), `docs/enterprise/records/P1.md`…`P8.md` |
| Architecture and subsystems | `map/SYSTEM-MAP.md`, `map/SUBSYSTEMS.json` | master architecture; `docs/enterprise/contracts/*.md` |
| 11 permanent agents (identity contracts) | `map/AGENTS.json`; claim `C-AGENTS` | `agents/contracts/role-contracts.json`, `agents/*.md`, `docs/enterprise/contracts/AGENT-REGISTRY.md` |
| Provider / model bindings (separate from agents) | `map/AGENTS.json` → `defaultModelBinding`; claim `C-PROVIDERS` | `agents/*.md` front-matter, `server/providers/capabilities.js`, `PROVIDER-CAPABILITIES.md` |
| Quality / evaluation architecture | `map/SYSTEM-MAP.md` § Quality; claims `C-EVALUATOR`, `C-TESTS` | `QUALITY-ASSESSMENT.md`, `SAFETY.md`, `GOLD-SET.md`, `records/HARDENING.md`, closure §7 |
| Gold-v1 / Gold-v2 / old held-out | claims `C-GOLD-V1`, `C-GOLD-V2`, `C-OLD-HOLDOUT`, `C-HOLDOUT-RUN-1` | closure report §11–§14; `evaluation/gold/*` |
| D-01…D-22, registry and closure | `ledger/DECISIONS.json`; claims `C-DECISIONS-STATE`, `C-DECISIONS-AUTHORITY` | `evaluation/gold-v2-policy/decisions.jsonl` (verbatim), `records/GOLD-V2-POLICY-DECISIONS.md`, `records/GOLD-V2-POLICY-CLOSURE.md` |
| A-01…A-30 | `ledger/ACCIDENTS.json`; claim `C-ACCIDENTS` | closure §8 |
| Open dependencies | `ledger/DEPENDENCIES.json`; claim `C-DEPENDENCIES` | closure §10 |
| DECIDED / IMPLEMENTED / VALIDATED | `ledger/STATUS-MATRIX.md` | closure §7, §22; journal |
| Dinosaur World and its rules | claims `C-DW-STOPPED`, `C-DW-DECISIONS`; `map/SYSTEM-MAP.md` § Dinosaur World | journal (human approvals), `dinosaur-world-enterprise/*`, `docs/enterprise/migration/DW-P8-STATUS.md` |
| Current phase, authorization boundary | `phase/ACTIVE-PHASE.json`, `phase/PHASES.json`; claims `C-RC1-AUTH`, `C-AFTER-RC1-NOT-AUTHORIZED` | `phase/authorizations/RC1-POLICY-DEPENDENCY-CLOSURE.operator-instruction.txt` (verbatim) |
| RC1 dependency classification and pre-hardening specification | `docs/enterprise/rc1/README.md` | closure §10, §15–§21; ledger `openDependencies` |
| Blockers, next authorized step | `CURRENT-STATE.json` → `blockers`, `nextAuthorizedStep` | `ACTIVE-PHASE.json`; closure §20–§21 |
| Post-closure order (not authorized yet) | claims `C-POST-CLOSURE-ORDER`, `C-PHASE-ORDER`, `C-SH2-PREREQS` | closure §20–§21 |

## What "ready" means

`CONTEXT_READY` means: the repository identity, branch and checkpoint hold; the working tree is clean; every tracked file is
covered; the brain was sealed against exactly this tree; all claims' anchors exist; the decision ledger and its indexes agree;
the state has no contradiction, an active phase that is registered and authorized, and one next step. It does **not** mean
"100 % known". The gate lists what it cannot verify (`notVerified` in `--json` output).
