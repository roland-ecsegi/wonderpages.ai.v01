# WonderPages — bootstrap for every Claude session

**CHAT IS TRANSIENT. REPOSITORY IS CANONICAL.** Do not rely on conversation memory or summaries for project state.

## Before ANY work (mandatory, in this order)

1. Run the Context Integrity Gate:

   ```
   node brain/tools/brain.mjs gate
   ```

   - `CONTEXT_INTEGRITY = FAIL`: **WORK NOT AUTHORIZED.** Report the failing checks to the operator and stop. You may only
     repair the brain itself if the active phase allows it (see `brain/CONTINUITY.md`).
   - `CONTEXT_INTEGRITY = PASS`: continue.
2. Read `brain/README.md` (index), `brain/state/CURRENT-STATE.md` and `brain/phase/ACTIVE-PHASE.json`.
3. Load the authoritative sources for your task from `brain/manifest/SOURCES.json` (each claim names its file and exact
   anchors). If a brain summary and its source differ, the source wins, and the gate must be made to fail.
4. Work **only** inside the active phase: its `allowed`, `forbidden` and `writeScope`. Anything else needs a new explicit
   operator authorization recorded under `brain/phase/authorizations/`.

Full procedure: `brain/BOOTSTRAP.md`. Maintenance rules (keeping the brain fresh, resealing): `brain/CONTINUITY.md`.

## Standing rules (sources in `brain/manifest/SOURCES.json`)

- Never change semantics or behaviour outside the active phase's write scope: runtime, evaluator, Gold-v1/Gold-v2, old held-out,
  validation results, Dinosaur World, the 11 permanent agents, Product Contract, policy decisions D-01…D-22, release, UI.
- Operator decisions are made only by the operator and recorded verbatim (`evaluation/gold-v2-policy/decisions.jsonl` for policy;
  `brain/phase/authorizations/` for phase authorizations). Recommendations are labelled as recommendations.
- No PHASE 9, no paid services or API keys, no external publication, no secrets in the repository.
- The Agent Bridge (`roland-ecsegi/wonderpages.agent-bridge`) is a separate control plane: WonderPages → Bridge only.
  The Bridge and ChatGPT never write WonderPages or create authority; ChatGPT answers are advisory (`brain/BRIDGE.md`). Narrow
  exception (operator follow-up #13): a Claude routine woken through the C1 ingress may write WonderPages only under
  `brain/phase/DELEGATION.json`, inside the active phase's writeScope, after its own gate and authority checks.
- Commit messages end with the session attribution lines; never include model identifiers in repository artifacts.
