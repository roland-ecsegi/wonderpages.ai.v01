# Bootstrap Protocol — from a cold session to authorized work

A session with no conversation history reconstructs the project from this repository alone. The order is mandatory.
No step may be skipped because "the context seems obvious".

| # | Step | How | Fails closed when |
|---|---|---|---|
| 1 | **BOOT** | Open the repository root. `/CLAUDE.md` is auto-loaded and points here. | — |
| 2 | **Repository identity** | gate check `G01` | not `wonderpages-ai`, wrong origin, lineage commit `9a8b248` not an ancestor |
| 3 | **Branch / checkpoint** | gate check `G03` | checkpoint commits (`866a441`, `168905b`) are not ancestors of HEAD (WARN on another branch, or in a shallow clone) |
| 4 | **Clean tree** | gate check `G04` | uncommitted changes to tracked files (the gate reasons about the git index) |
| 5 | **Load the Brain** | gate check `G02` | a state / phase / registry / map / manifest / navigation file is missing or invalid |
| 6 | **Coverage** | gate check `G05` | a tracked file maps to no subsystem, a subsystem has no files, an authoritative file is missing |
| 7 | **Freshness** | gate check `G06` | any subsystem digest differs from the seal (STALE), seal ≠ last seal-log entry, seal-log chain broken |
| 8 | **Sources** | gate check `G07` | a claim's source file is missing / untracked, or an anchor is not found verbatim |
| 9 | **Decisions** | gate check `G08` | ledger chain broken, not exactly D-01…D-22, closure tables disagree with the ledger, derived indexes stale |
| 10 | **State consistency** | gate check `G09` | unknown phase, ≠ 1 ACTIVE phase, unauthorized phase, authorization hash mismatch, several NEXT steps, state value contradicting its claim, unsourced state value |
| 11 | **Views** | gate check `G10` | `CURRENT-STATE.md` differs from its rendering |
| 12 | **Isolation** | gate check `G11` | an application file references the Agent Bridge |
| 12a | **Phase deliverables** | gate check `G15` | the RC1 dependency register disagrees with closure §10 / the ledger, a NORMATIVE dependency is closed without a verbatim operator decision, a cited spec section or package question is missing, the threshold-policy hash or the test vectors do not recompute |
| 13 | **Readiness evidence** | `node brain/tools/brain.mjs gate --json` | — prints `CONTEXT_INTEGRITY`, `CONTEXT_READY/NOT_READY`, every check, the list of files read with their hashes, and what was not verified |
| 14 | **Read for the task** | `brain/README.md` → `CURRENT-STATE.md` → `ACTIVE-PHASE.json` → the claims and sources for the task | — |
| 15 | **WORK** | only inside `ACTIVE-PHASE.json` (`allowed`, `forbidden`, `writeScope`) | — |

## Outcomes

- `CONTEXT_INTEGRITY = PASS` · `CONTEXT_READY` · `WORK AUTHORIZED ONLY WITHIN <phase>`.
- `CONTEXT_INTEGRITY = PASS` · `CONTEXT_READY` · `WORK NONE: <phase> COMPLETE — next phase awaits operator authorization`. The phase
  is closed (its checkpoint is `brain/evidence/<phase>-CLOSURE.json`): read and report only; start nothing until the operator records
  a new authorization under `brain/phase/authorizations/`.
- `CONTEXT_INTEGRITY = FAIL` · `CONTEXT_NOT_READY` · `WORK NOT AUTHORIZED`. Report the failing checks verbatim to the operator.
  The only work then allowed is repairing the brain itself (the continuity write scope) and only if the active phase permits it.
  Never "fix" a FAIL by editing a source document to match the brain.

## Reporting what you know

When asked about project state, answer from sources, cite the claim id and file, and say which gate run (HEAD, time) the answer
rests on. Do not say "100 %" or "everything is known". Say what the gate verified and what it lists under `notVerified`.

## Fresh-session continuity test

`brain/continuity/QUESTIONS.json` is a questionnaire. A new session must answer it from the repository alone.
`node brain/continuity/continuity.mjs grade <answers.json>` computes the answer key **from the canonical sources** (ledger, journal,
closure, contracts, role contracts, gold files, active phase), not from brain prose, and grades the answers. Recorded results are kept
in `brain/continuity/results/`.
