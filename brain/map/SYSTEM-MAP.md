# System Map — architecture and navigation

A navigation layer. The authoritative descriptions live in the files named here. File → subsystem membership is
machine-checked in `brain/map/SUBSYSTEMS.json` (gate `G05`, seal `G06`).

## 1. What the product is

A **local editorial studio** (Node.js server + browser editor, local storage or PostgreSQL) that produces children's book
collections under the Product Contract `wonderpages.product-contract/1` (claim `C-PRODUCT-CONTRACT`):
one collection → 6 volumes → Story Book + Coloring Book per volume → 12 content pages per book (+ covers); one age band per
collection (3-4 / 5-6 / 7-8); Story editions per language, Coloring independent of language. It uses only the operator's
subscriptions: Claude Pro (Claude Code CLI), ChatGPT Plus (bundled Codex CLI), Canva Pro (claim `C-SUBSCRIPTIONS-ONLY`).
The target state, and why each part exists: `reference/architecture/WonderPages_Enterprise_Master_Architecture.md` (OUTPUT-01…29,
PHASE 1…9). Version `package.json` 19.4.0, edition "claude-gpt.v04".

## 2. Layers and subsystems

| Layer | Subsystem ids (`SUBSYSTEMS.json`) | Entry points | Authoritative docs |
|---|---|---|---|
| Runtime core / pipeline | `runtime-core`, `blueprints-seeds` | `server/start.js`, `server/index.js` (routes), `server/engine.js` (stages, gates), `server/enterprise-routes.js` | `PRODUCT-CONTRACT.md`, `PAGE-BLUEPRINTS.md`, `docs/IMPLEMENTARE-v19.md` |
| Domain | `domain` | `server/domain/*` (product contract, canon, layout, decisions, release candidate, canonical hashing) | `CANON-AND-DEPENDENCIES.md`, `DECISIONS.md`, `LAYOUT.md`, `RELEASE-CANDIDATE.md` |
| Agents (identity) | `agents` | `agents/*.md`, `agents/contracts/*.json`, `server/agents-runtime/registry.js`, `server/agents.js` | `AGENT-REGISTRY.md`, `DALI-ACTIONS.md`, `MATURITY.md` |
| Providers (model bindings) | `providers` | `server/providers/*`, `server/claudecode.js`, `server/codextext.js`, `server/codeximage.js`, `server/canva.js` | `PROVIDER-CAPABILITIES.md` |
| Quality / evaluation | `quality-evaluation`, `gold-sets`, `hardening-probes`, `policy-ledger` | `server/quality/*` (safety, assessment, evaluation, validation, regression), `server/inspection/*` | `SAFETY.md`, `QUALITY-ASSESSMENT.md`, `STORY-CONTRACTS.md`, `VISUAL-QUALITY.md`, `COLORING.md`, `GOLD-SET.md`, `records/HARDENING.md`, `records/GOLD-V2-*.md` |
| Learning | `knowledge-learning` | `server/knowledge/*`, `server/learning.js`, `server/creative/*` | `KNOWLEDGE-PROMOTION.md`, `KNOWLEDGE-QUARANTINE.md`, `EFFECTIVENESS.md`, `CREATIVE-UPGRADE.md` |
| Persistence / ops | `persistence-ops`, `security` | `server/persistence/*`, `server/jobs/*`, `server/ops/*`, `server/observability/*`, `server/security/*` | `PERSISTENCE.md`, `JOBS.md`, `RECOVERY.md`, `OBSERVABILITY.md`, `SECURITY-BASELINE.md`, `CAPACITY.md` |
| UI | `ui` | `public/index.html`, `public/app/*.js` | `UX-ACCESSIBILITY.md`, `WORKBENCH.md` |
| Build / release / QA | `scripts`, `tests`, `ci`, `install-packaging` | `scripts/build.mjs`, `scripts/enterprise/release-gate.mjs`, `tests/run.mjs`, `.github/workflows/ci.yml` (manual) | `RELEASE-GATE.md`, `INSTALL-UPGRADE.md`, `SAFER-CI.md`, `INSTALARE.md` |
| Records | `enterprise-records`, `product-docs`, `reference-architecture` | `docs/enterprise/JURNAL-IMPLEMENTARE.md` (journal + checkpoint), `docs/enterprise/records/*` | `READINESS-LEDGER.md` |
| Reference project | `dinosaur-world` | `dinosaur-world-enterprise/*`, `reference/dinosaur-world-v04/*.zip` | journal "Aprobări umane așteptate", `DW-P8-STATUS.md`, `OBSERVATII-DESCHISE.md` |
| Continuity control plane | `brain` | `CLAUDE.md`, `brain/*` | `brain/README.md` |

All `docs/…` contract names above are under `docs/enterprise/contracts/` unless a path is given.

## 3. The 11 permanent agents and their model bindings

Identity = RoleContract 1.0.0 (`agents/contracts/role-contracts.json`) + persona (`agents/<id>.md`) + owned skills
(`agents/contracts/skills.json`, 20 SkillVersions, maturity *unproven*). The **ModelBinding is separate**: the default comes from the
persona front-matter (`model:`), the live binding is runtime AgentProfile state, and charter ↔ binding consistency is enforced
(e.g. the Engineer may only use Claude Code for text). Changing a binding never changes an identity. Index: `brain/map/AGENTS.json`
(derived, gate-checked). Claims `C-AGENTS`, `C-PROVIDERS`.

## 4. Quality and evaluation architecture

- **Separate gates, not one score:** child-safety verdict PASS / REVIEW / BLOCK / UNKNOWN is independent of any quality score
  (`SAFETY.md`); quality policy v1/v2 with exact thresholds and evidence validity (`QUALITY-ASSESSMENT.md`); deterministic story /
  age / localization / science contracts (`STORY-CONTRACTS.md`); visual and coloring QA; PDF inspection and readiness per destination.
- **Measurement:** deterministic evaluators (`server/quality/evaluation.js`, `EVALUATOR_VERSION = 2`) run on versioned gold sets;
  reports never mix dataset / policy / evaluator versions; adjudication ≠ validation ≠ acceptance (`records/HARDENING.md`).
- **Gold-v1** frozen "Before" benchmark (44/44 adjudicated). **Gold-v2** 226 cases, immutable, 0/226 adjudicated, NOT_COMPLETE.
  **Old held-out** retired from independent acceptance. Claims `C-GOLD-V1`, `C-GOLD-V2`, `C-OLD-HOLDOUT`, `C-HOLDOUT-RUN-1`.
- **Decided policy (not implemented):** D-01…D-22 (`evaluation/gold-v2-policy/decisions.jsonl`), the finding → confirmation →
  severity → publishing-consequence model, D-18 assessment-validation layer, D-19 multidimensional ground truth, D-21 gates P0–P9,
  D-22 independence roles. Gaps between current implementation and policy: closure §7, accidents §8 (`brain/ledger/ACCIDENTS.json`).
- **Release:** `scripts/enterprise/release-gate.mjs` (build, contract, resources, secret sentinel, licenses, full tests; provider
  probes reported separately). Its `sourceDigest` covers exactly the shipped files; `brain/` and `CLAUDE.md` are outside it.

## 5. Dinosaur World and its rules

The real reference project. The original archive in `reference/dinosaur-world-v04/` is read-only and hash-verified before and after
any run (`DW-P8-STATUS.md`). DW01 / DW02 were decided by the operator (narrow scope). Observations O1 / O2 stay open and unrepaired.
Production is **stopped**: no V1 pilot, no images, no real Creative Upgrade (claim `C-DW-STOPPED`). V2–V6 stay blocked until the V1 pilot
is accepted. Creative decisions belong to the operator only. Synthetic acceptance ≠ Agent Commissioning ≠ Dinosaur World ≠ real product
acceptance (D-22). DW work of any kind needs an explicit phase authorization.

## 6. Control plane outside the application

`CLAUDE.md` and `brain/` (this layer) plus the separate Agent Bridge repository (`brain/BRIDGE.md`). The application never imports
or reads either; the gate check `G11` enforces that no application file references the Bridge.
