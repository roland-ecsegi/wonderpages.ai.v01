# Decision C0 live test — one controlled routine wake (route R1)

- **Authorized by:** `brain/phase/authorizations/CONTINUITY-1.operator-followups.md` #10 (verbatim, 2026-10-06). One intentional wake, no
  retry, no loop. Decision C / C1 is not authorized.
- **Preconditions (confirmed by the operator):** P1 plan Pro with usage credits OFF; P2 Claude GitHub App on
  `roland-ecsegi/wonderpages.agent-bridge`.
- **Status:** PREPARED. Waiting for the operator to create the routine. The LIVE commit is **not** published.

## 1. Ingress path (Bridge, isolated from decision B)

| Item | Value |
|---|---|
| Pull request | roland-ecsegi/wonderpages.agent-bridge#2 `[c0] Claude ingress probe — do not merge` (head `inbox/claude-c0` → base `main`, never merged) |
| Branch base | Bridge `main` at `cd85396e44ac660d43ca4c4e3205057bdca29638` |
| Inert commit | `b3a2727`. One file, the probe (path c0/probe/C0-PROBE.json, on the PR branch only), with `state: "INERT"`, no nonce, trailer `Bridge-C0: probe` |
| Diff vs `main` | exactly that one file. Nothing under `ingress/`, `exchange/`, `mirror/`, control files or decision B. |
| PR #2 opened | before any routine existed, so the `opened` event could not consume a run |
| Live wake (later) | exactly **one** push to `inbox/claude-c0`. It sets the probe to `state: "LIVE"` with a 32-hex nonce from a CSPRNG, the UTC time, the repository, PR 2, the head branch, the result branch and the result path. The resulting `pull_request.synchronize` is the only intended event. The commit's own SHA cannot be inside the commit, so it is recorded here after publication. |
| Result | written by the routine only: one file (c0/results/&lt;nonce&gt;.json) on the separate branch `claude/c0-result`, created from `main`. Not the PR head (no second synchronize), not `main`, no PR. |

## 2. Routine configuration (operator UI, claude.ai/code/routines)

| Field | Value |
|---|---|
| Name | `WonderPages C0 probe` |
| Prompt | exactly `brain/evidence/C0-ROUTINE-PROMPT.txt` (sha256 `fff1f9153a5d41f91e29eea50c63613c6c58943c627284d6a9df6aae1db85877`, 4324 bytes) |
| Model | Claude Opus 5.5 in the prompt's model selector (the full ID `claude-opus-5-5` if shown) |
| Repository | `roland-ecsegi/wonderpages.agent-bridge` only (no WonderPages) |
| Environment | new cloud environment `wonderpages-c0`: network **Trusted**, variables `CLAUDE_CODE_EFFORT_LEVEL=high` (not a secret), no setup script, no API credentials |
| Trigger | GitHub event only. Repository `roland-ecsegi/wonderpages.agent-bridge`, event **Pull request → synchronize** (not "all actions"). Filters: head branch **equals** `inbox/claude-c0`, base branch **equals** `main`. No schedule, no API trigger. |
| Connectors | all removed |
| After saving | do **not** press Run now |

## 3. Dry run (local, nothing published)

Steps 2 to 7 of the routine prompt were executed on a temporary clone, with a fake LIVE commit that was never pushed:

- R was an ancestor of the branch.
- The merge base was `cd85396`, and the diff contained only the probe file.
- All probe checks passed.
- At R: `verify-mirror` gave SYNC_STATUS VERIFIED (snapshot `000016-504c0d9a3565`) and `verify-control` gave CONTROL VERIFIED.
- The credential presence tests returned `false` for all three variables, without reading any value.
- `CLAUDE_EFFORT` is exposed in cloud sessions (`high` in the preparing session).
- No `claude/c0-result` branch exists.

## 4. Evidence to collect after the wake (Claude, read only)

- **Bridge:**
  - the LIVE commit SHA (= R);
  - no further commit on `inbox/claude-c0`;
  - `claude/c0-result` holds exactly one new file (c0/results/&lt;nonce&gt;.json) and one commit;
  - nothing new on `main` from the run, and `inbox/chatgpt` unchanged;
  - `bridge.mjs all` VERIFIED / VALID / PASS.
- **Result content:** nonce = published nonce; R = LIVE commit; probe read at R; checks; verdict.
- **Claude session side:**
  - the routine session from the claude-code-remote session list (exactly one new routine session after the wake);
  - `get_session`: `configured_model`, `session_context.model`, `external_metadata.last_served_model`;
  - the transcript events when needed.
- **Effort:** the value the run reports (`CLAUDE_EFFORT` / `CLAUDE_CODE_EFFORT_LEVEL`). Otherwise UNKNOWN, recorded as a limitation.
- **WonderPages:** gate PASS and zero drift (no application change).

## 5. Verdict rules

- **PASS** only if every success criterion of follow-up #10 is evidenced.
- **PASS_WITH_LIMITATIONS** if the path works but model or effort cannot be observed.
- **FAIL** otherwise: no event, no session, allowance refusal, wrong model, a paid path requested, a loop, or any write outside the result file.

On FAIL: stop and preserve the evidence. No retry, no API, no usage credits.
