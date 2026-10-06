# Decision C0 live test — one controlled routine wake (route R1), revision 2: one-shot `pull_request.opened`

- **Authorized by:** `brain/phase/authorizations/CONTINUITY-1.operator-followups.md` #10, adapted by #11 (verbatim, 2026-10-06). One
  intentional wake, no retry, no loop. Decision C / C1 is not authorized. `opened` is **not** approved as the future C wake
  architecture.
- **Preconditions (confirmed by the operator):** P1 plan Pro with usage credits OFF; P2 Claude GitHub App on
  `roland-ecsegi/wonderpages.agent-bridge`.
- **Status:** **DONE — C0 LIVE: PASS_WITH_LIMITATIONS** (§8). One wake, one routine run, result validated from Git and from the
  platform's session record. Decision C / C1 remains NOT IMPLEMENTED.

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
| Nonce | `136281ab91a9232afc8dcc2f2be66285` (32 hex, Python `secrets.token_hex(16)`); `createdAt` `2026-10-06T17:03:08Z` (an earlier revision of this file said 17:03:25Z; that was an error in this record, corrected from `git show R:` and the commit time) |
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

## 8. Live result (follow-up #12)

### 8.1 Timeline (UTC, 2026-10-06)

| Time | Event | Evidence |
|---|---|---|
| 17:08:42 | Routine created by the operator | `trig_01N4poWHyZgAL7kZrwwVagb6`: stored model `claude-opus-5-5`, no connectors, no schedule. The stored prompt was compared visually with `brain/evidence/C0-ROUTINE-PROMPT.txt`, without a byte comparison; no difference was found. |
| 17:13:33 | Claude opens **one** PR: roland-ecsegi/wonderpages.agent-bridge#3 (`inbox/claude-c0-live` → `main`) | `refs/pull/3/head` = R |
| 17:13:36 | Routine fires | `last_run.fired_at` 17:13:36.49. Session `cse_01RLgUX9zQLHnEV467qUyAKG` (`session_01RLgUX9zQLHnEV467qUyAKG`), `origin: github_webhook_trigger`, source revision `refs/pull/3/head` |
| 17:14:53 | Routine commits the result | `43e75bcf2d5614619d085dee4c5752ed7269ad83` on `claude/c0-result`, parent `b2b66f7` (Bridge `main`), one added file (c0/results/136281ab91a9232afc8dcc2f2be66285.json), trailer `Bridge-C0: result` |
| 17:15:10 | Run ends | `last_run.status` `ROUTINE_RUN_STATUS_SUCCEEDED`. Session IDLE, bucket REVIEW_READY. |

### 8.2 Validation (independent, from Git and the platform)

| Criterion | Result |
|---|---|
| Exactly one intentional wake | PASS. One PR opened, no other commit or event by Claude. Branch `inbox/claude-c0-live` still at R. |
| A routine session started from that GitHub event | PASS. `origin: github_webhook_trigger`, `fired_at` 3 s after the PR opened, source `refs/pull/3/head`. |
| Exactly one run, no self-loop | PASS. The routine has a single `last_run` (the session above). `claude/c0-result` has exactly one commit, and nothing was pushed to the LIVE branch. The result push triggered only `bridge-verify` (run 37502066122, success), not the routine, because no PR exists from `claude/c0-result`. |
| Immutable R / nonce | PASS. The result has R `6723b29f893dd4c94e30df8f2fc365bc7ea9a58d` and nonce `136281ab91a9232afc8dcc2f2be66285`, which equal `git show R:` (createdAt 17:03:08Z, state LIVE). |
| PR binding | PASS. The routine bound N = 3 as the unique `refs/pull/N/head == R` (pr/1 `e126e49`, pr/2 `b3a2727`), equal to the event's PR number. The event context was exposed in the session (`pull_request.opened`, repository, #3, head → base, head SHA = R; sender not exposed). |
| Isolation / integrity | PASS. Merge base `8a5e3f8`, one commit, only the probe file. At R: `verify-mirror` VERIFIED and `verify-control` VERIFIED (11 files), snapshot `000017-904bdbfa1dcf`. |
| Result only on `claude/c0-result` | PASS. One file. `main` (`b2b66f7`), `inbox/chatgpt` (`e126e49`) and PR #1 / #2 are unchanged. No new PR, comment or review. |
| Bridge integrity after the run | PASS. `bridge.mjs all` on `main` gives SYNC + provenance + CONTROL VERIFIED, MESSAGES VALID and APPEND_ONLY PASS. On `claude/c0-result` it gives VERIFIED / VALID / PASS. |
| Subscription only | PASS. In the result, `credentialsPresent` is false for `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN` and `CLAUDE_CODE_OAUTH_TOKEN`. In the session record, `rate_limit_info.isUsingOverage: false`. Usage credits are OFF (operator). The session record's `usage.cost_usd` (0.42) is the platform's token-cost estimate, not a charge. |
| Model | **Opus 5.5.** `configured_model`, `session_context.model` and `external_metadata.last_served_model` are all `claude-opus-5-5` (platform record, read by Claude). Inside the run, the routine had no `get_session` tool and honestly recorded UNKNOWN. |
| Effort | **high**, as exposed to the run: `CLAUDE_EFFORT=high` and `CLAUDE_CODE_EFFORT_LEVEL=high`. The platform record carries no `effort_level` field for this session, so there is no server-side confirmation. |
| WonderPages | PASS. The routine had only the Bridge repository. Gate G13 / `drift.mjs`: application files byte-identical to `866a441`. |

### 8.3 Verdict: **C0 LIVE — PASS_WITH_LIMITATIONS**

Every functional criterion passed: GitHub event → routine → subscription run → nonce read at immutable R → one diagnostic result in
the Bridge, with no loop and no paid path. The limitations are about observability, not function:

1. The run itself could not read its model. The model is confirmed only from the platform's session record.
2. Effort is the value exposed to the run (`CLAUDE_EFFORT`), not a server-side confirmation.
3. The event's sender is not exposed.
4. `pull_request.opened` was used because the UI offers no `synchronize`. It is **not** approved as the C/C1 wake mechanism (follow-up
   #11), and B-style re-ringing needs an event that can repeat.
5. The run consumed **1 of the 5 Pro routine runs for the day**. The session record shows `rate_limit_info.status: allowed_warning`
   (`seven_day`), so the weekly allowance is close to its limit. Future C design must budget for it (§7a of the feasibility record).

Artifacts kept, never merged:
- PR #2 (inert) and PR #3 (LIVE), with their branches `inbox/claude-c0` and `inbox/claude-c0-live`;
- branch `claude/c0-result`;
- routine `trig_01N4poWHyZgAL7kZrwwVagb6` (enabled; it fires only on another PR opened from `inbox/claude-c0-live`).

Disabling or deleting them is left to the operator.
