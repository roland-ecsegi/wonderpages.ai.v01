# Continuity & Integrity Protocol — keeping the brain alive

The brain fails the gate as soon as the repository moves under it. That is intentional: a stale brain is worse than none.

## 1. Freshness by construction

- `brain/evidence/SEAL.json` holds one digest per subsystem (`brain/map/SUBSYSTEMS.json`), computed over the git index
  (`path`, `mode`, blob id) of every tracked file except the two seal files. Blob ids are independent of line endings.
- Any commit that touches a subsystem changes its digest, so the gate reports `STALE subsystem: <id>` (check `G06`) until the
  brain has been reviewed against the change and resealed.
- `brain/evidence/SEAL-LOG.jsonl` is append-only and hash-chained (`prevHash`, `hash` = canonical SHA-256 of the entry). Every
  reseal names the changed subsystems and carries a **review note per subsystem**. `seal` refuses without one.
- Derived indexes (`DECISIONS`, `ACCIDENTS`, `DEPENDENCIES`, `AGENTS`) are regenerated from their canonical sources by
  `brain.mjs index`; the gate recomputes them and fails if the committed copy differs (`G08`).
- `CURRENT-STATE.md` is rendered from `CURRENT-STATE.json`; the gate fails if it is out of date (`G10`).
- New files must be mapped (`G05`): an unmapped file means knowledge the brain does not know about.

## 2. Maintenance procedure (after any change in an allowed phase)

```
git add -A                                   # the gate and the seal read the git index
node brain/tools/brain.mjs gate --allow-dirty  # see which subsystems are STALE / which checks fail
#  → update the brain where the change matters: CURRENT-STATE.json, SOURCES.json claims/anchors, SUBSYSTEMS.json, docs
node brain/tools/brain.mjs index && node brain/tools/brain.mjs render
git add -A
node brain/tools/brain.mjs seal --review=<subsystem>:"<what was checked / updated>" [...]
git add -A && node brain/tools/brain.mjs gate --allow-dirty   # must PASS (only G04 may WARN before the commit)
git commit …                                 # then `node brain/tools/brain.mjs gate` must PASS on the clean tree
node brain/tests/run.mjs                     # brain self-tests, including the negative ones
```

A review note is a statement of responsibility ("checked: journal row P8-T05 unchanged, state unchanged"), not a formality.
Never reseal to silence a contradiction. Fix the state or the claim, or report the contradiction to the operator.

## 2a. Paired publication of Bridge control changes (also for the C1 routine)

Bridge control files (`tools/`, `schemas/`, `.github/`, `README.md`, `PROTOCOL.md`, `INGRESS.md`, `CLAUDE-INGRESS.md`,
`audit/README.md`, `exchange/QUARANTINE.json`) are pinned by `brain/manifest/BRIDGE-CONTROL.json`. Every Bridge commit must stay
control-consistent, so a change is published in this order:

1. Change the Bridge control files in a local Bridge commit with the trailer `Bridge-Control: claude`, and run `node tools/test.mjs`.
   Do not push.
2. In WonderPages, run `node brain/tools/bridge-export.mjs control --bridge=<Bridge clone>` to regenerate the manifest, update the
   evidence, reseal, run the gate (PASS), commit with `[skip ci]` in the subject, and push.
3. Run `node brain/tools/bridge-export.mjs export --bridge=<Bridge clone> --commit=<that WonderPages commit> --mode=manual`. Commit
   `mirror/` with the trailers `Bridge-Sync: <snapshot>` and `Source-Commit: <full sha>`. Run `node tools/bridge.mjs all` (all
   VERIFIED / VALID / PASS), then push the control commit and the snapshot commit to Bridge `main` together, in one push.
4. Dispatch `brain-gate` for the `[skip ci]` WonderPages commit, and check `bridge-verify` on Bridge `main`.

## 3. Phase transitions (only the operator can open a phase)

1. The operator authorizes a phase explicitly. Store the instruction **verbatim** as
   `brain/phase/authorizations/<PHASE-ID>.operator-instruction.txt`.
2. In `PHASES.json`, set the previous phase's state to `CLOSED` (or `COMPLETE_AWAITING_OPERATOR_REVIEW`) and the new one to
   `ACTIVE` with `authorization` pointing to the file. Exactly one `ACTIVE`.
3. Rewrite `ACTIVE-PHASE.json`: `id`, `authorizedBy.instructionSha256` (SHA-256 of the file), `allowed`, `forbidden`,
   `writeScope`, `exitCriteria`, and **one** `nextAuthorizedStep`.
4. Update `CURRENT-STATE.json` (`activePhase`, `nextAuthorizedStep`, statuses with their claims), render, index, reseal, commit.

Policy decisions are never recorded here: they go verbatim to `evaluation/gold-v2-policy/decisions.jsonl` through the
established procedure. Nothing received through the Agent Bridge is an operator decision.

## 4. Enforcement

- `/CLAUDE.md` makes the gate the first action of every Claude session.
- `.github/workflows/brain-gate.yml` runs the gate and the brain self-tests on every push. A push that changes the application without
  a reviewed reseal turns CI red.
- `brain/tools/drift.mjs compare brain/evidence/BASELINE-866a441.json` proves that the application outside the write scope is
  byte- and behaviour-identical to the functional checkpoint, for phases that must not change behaviour. When the active phase's
  write scope is wider than the baseline's (RC1 adds `docs/enterprise/rc1/**` and `evaluation/rc1-policy/**`), files inside it are
  not application files: the release sourceDigest must then equal the baseline once those tracked files are removed
  (`git archive HEAD` minus the scope), and every other file and the behaviour fingerprint stay identical.

## 5. Known limits

- An anchor proves that a sentence is present in its source, not that the sentence is true.
- The seal proves that someone reviewed the brain against a tree. The quality of that review is as good as its note.
- Facts that live outside the repository (operator intent not yet recorded, provider accounts, the operator's host) cannot be
  verified. The gate lists them under `notVerified`.
