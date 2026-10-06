# Decision C0 live test — one controlled routine wake (route R1), revision 2: one-shot `pull_request.opened`

- **Authorized by:** `brain/phase/authorizations/CONTINUITY-1.operator-followups.md` #10, adapted by #11 (verbatim, 2026-10-06). One
  intentional wake, no retry, no loop. Decision C / C1 is not authorized. `opened` is **not** approved as the future C wake
  architecture.
- **Preconditions (confirmed by the operator):** P1 plan Pro with usage credits OFF; P2 Claude GitHub App on
  `roland-ecsegi/wonderpages.agent-bridge`.
- **Status:** PREPARED (revision 2).
  - The LIVE branch is pushed **without** a pull request.
  - Waiting for the operator to create the routine and confirm 0 runs.
  - The only wake action after that is opening one PR.

## 1. Why revision 2

- **The UI does not offer `synchronize`.** The operator observed that the Routines UI on this Pro account offers `Pull request:
  Opened` with exact head-branch and base-branch filters, but no `synchronize` (follow-up #11), although the documentation lists
  it.
- **So the wake moves from a push to a PR opening.** The wake is now the opening of one new PR from a branch that already carries
  the nonce. PR #2 is already open, so it cannot be the trigger.

## 2. Ingress path (Bridge, isolated from decision B)

| Item | Value |
|---|---|
| Revision 1 artifact (kept, inert) | roland-ecsegi/wonderpages.agent-bridge#2 (head `inbox/claude-c0`, commit `b3a2727`, state INERT, no nonce). It stays open and is never merged. Its head branch does not match the new trigger filter. |
| LIVE branch | `inbox/claude-c0-live`, based on Bridge `main` at `8a5e3f8cbe28ffcbf6fff2f8a1cfa716862fadf1` |
| LIVE commit = R | **`6723b29f893dd4c94e30df8f2fc365bc7ea9a58d`**. One commit with one file (the probe, path c0/probe/C0-PROBE.json on that branch only), state `LIVE`, `Bridge-C0: probe` trailer. |
| Nonce | `136281ab91a9232afc8dcc2f2be66285` (32 hex, Python `secrets.token_hex(16)`); `createdAt` `2026-10-06T17:03:25Z` |
| Probe fields | repository, head branch `inbox/claude-c0-live`, base `main`, `expectedPullRequest: null` plus the binding rule, branch base, result branch `claude/c0-result`, result path, statement "C0 diagnostic only" |
| PR when pushed | none. GitHub emits no `pull_request` event for a bare branch push, and no routine existed yet, so no run could be consumed. |
| Wake (after the operator confirms) | Claude opens **one** PR `inbox/claude-c0-live` → `main`. Its `pull_request.opened` is the only intended event. |
| Result | written by the routine only: one file (c0/results/136281ab91a9232afc8dcc2f2be66285.json) on the separate branch `claude/c0-result`, created from `main`. No PR, not `main`, not the LIVE branch. |

## 3. Binding the PR number without guessing

The PR number is assigned only when the PR is opened, so it is never written in advance. Since the number cannot be known safely
beforehand, the bootstrap identifies the PR from immutable facts instead:

1. **R is fixed in the prompt** (`EXPECTED_R`). The branch tip must equal it, and any head SHA the event exposes must equal it.
2. **The number comes from GitHub's own ref.** N is the **unique** number with `refs/pull/N/head == R`, read through git.
   - Zero or several matches is a FAIL.
   - A PR number shown by the event must equal N.
3. **If pull refs cannot be fetched,** the event's number is recorded "event only, not bound" (or UNKNOWN), as a LIMITATION rather
   than a guess. Claude then checks the PR number independently after the run.

Before the PR exists there are 0 matches (dry run). Existing PRs: #1 → `e126e49`, #2 → `b3a2727`; neither equals R.

## 4. Routine configuration (operator UI, claude.ai/code/routines)

| Field | Value |
|---|---|
| Name | `WonderPages C0 probe` |
| Instructions | exactly `brain/evidence/C0-ROUTINE-PROMPT.txt` (revision 2; sha256 `e936bef253322d6c0078d605b23eaa857c2ce7e23a04865a6998fbc6104ff44a`, 5247 bytes). Revision 1 (sha256 `fff1f915…`) is superseded. |
| Model | Claude Opus 5.5 (the full ID `claude-opus-5-5` if shown). If the selector offers effort, choose High. |
| Repository | `roland-ecsegi/wonderpages.agent-bridge` only |
| Environment | `wonderpages-c0`: network Trusted, one variable `CLAUDE_CODE_EFFORT_LEVEL=high`, no setup script, no API credentials |
| Trigger | GitHub event only: **Pull request: Opened**, repository `roland-ecsegi/wonderpages.agent-bridge`, filters **Head branch equals `inbox/claude-c0-live`** and **Base branch equals `main`**. No schedule, no API trigger. |
| Connectors | none |
| After saving | do **not** press Run now. The routine must show 0 runs. |

## 5. Dry run (revision 2, read-only, nothing opened)

Steps 2 to 9 were run on a fresh shallow clone from GitHub.

- **Bug found and fixed in the prompt:** in a single-branch clone, `git fetch origin main <branch>` creates no remote-tracking
  ref. The prompt now uses explicit refspecs, and checks whether the result branch exists with `git ls-remote`.
- **Results after the fix:**
  - unshallow OK, pull refs fetched;
  - branch tip == EXPECTED_R;
  - 0 pull refs match R (expected before opening);
  - merge base `8a5e3f8`, 1 commit, diff = probe only;
  - probe checks pass;
  - at R, SYNC_STATUS VERIFIED (snapshot `000017-904bdbfa1dcf`) and CONTROL VERIFIED;
  - `claude/c0-result` absent.

## 6. Evidence to collect after the single wake (Claude, read only)

- **Bridge:**
  - the PR number and that its head is R;
  - no further commit on `inbox/claude-c0-live`;
  - `claude/c0-result` holds exactly one commit and the one result file;
  - nothing new on `main` from the run;
  - `inbox/chatgpt` and PR #1 / #2 unchanged;
  - `bridge.mjs all` VERIFIED / VALID / PASS.
- **Result content:** nonce, R, PR binding, checks, runtime facts, verdict.
- **Claude session side:**
  - exactly one new routine session after the PR opened;
  - `get_session`: `configured_model`, `session_context.model`, `external_metadata.last_served_model`;
  - the transcript when needed.
- **Effort:** as reported by the run; otherwise UNKNOWN, recorded as a limitation.
- **WonderPages:** gate PASS and zero drift.

## 7. Verdict rules

- **PASS** only if every success criterion of follow-up #10 is evidenced.
- **PASS_WITH_LIMITATIONS** if the path works but model, effort or PR binding is unobservable.
- **FAIL** otherwise: no event, no session, allowance refusal, wrong model, a paid path requested, a loop, or any write outside the result file.

On FAIL: stop and preserve the evidence. No retry, no Run now, no API, no usage credits.
