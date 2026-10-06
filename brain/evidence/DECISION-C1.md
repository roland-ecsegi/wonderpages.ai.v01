# Decision C1 — durable ChatGPT → Claude channel (Claude Code routine), design and evidence

- **Authorized by:** operator follow-up #13 (verbatim: `brain/phase/authorizations/CONTINUITY-1.operator-authorization-C1.txt`;
  record `brain/phase/authorizations/CONTINUITY-1.operator-followups.md`).
- **Authority model:** `brain/phase/DELEGATION.json`, checked by gate G14.
- **Status:** IMPLEMENTED; local and adversarial tests PASS; live test IN PROGRESS (§4); independent audit rounds 1–2 repaired (§5).

## 1. Architecture (the real platform, not the documented one)

The Claude Routines UI on the operator's Pro account offers the GitHub trigger **Pull request: Opened** with exact head-branch and
base-branch filters. It offers no `synchronize`, which C0 observed. A repeatable wake therefore has to be a **new pull request per
wake**.

```
ChatGPT Work ──writes──▶ Bridge main: exchange/messages/<id>.json (to: claude)
      ingress-claude.yml (push to main / hourly / revive)
        verify the whole Bridge → plan from the durable queue (budget, coalescing, backoff)
        close the open inbox/claude PR → inbox/claude := main + ONE doorbell commit (Bridge-Ingress: claude)
        → open a NEW PR "[ingress] Claude inbox — do not merge (#seq)"  (GITHUB_TOKEN)
  pull_request.opened ──▶ routine "WonderPages Claude ingress" (Opus 5.5, subscription; repositories: Bridge + WonderPages)
        fixed bootstrap brain/ingress/CLAUDE-ROUTINE-PROMPT.txt
        node brain/tools/c1.mjs bootstrap   (canon-side verification, work order)
        classify against DELEGATION.json → COMMUNICATE / WORK / ESCALATE
        c1.mjs recheck before each consequential write (STILL PENDING + STILL AUTHORIZED)
        WonderPages commits only inside ACTIVE-PHASE.writeScope (gate + scope PASS)
        Bridge reply (to chatgpt / operator) ──▶ decision B wakes ChatGPT when its action is needed
```

Rejected alternatives (C0 report §4):
- `push` / `synchronize`: not offered by the UI.
- `repository_dispatch`: would need a token stored in the Bridge.
- GitHub Actions with `CLAUDE_CODE_OAUTH_TOKEN`: would need a secret, and the Bridge is writable by ChatGPT.
- Manual PR opening: not autonomous.

## 2. Guarantees and where they are implemented

| Guarantee | Implementation | Test |
|---|---|---|
| Durable queue for Claude | Bridge `pendingFor(messages, 'claude')`. AUDIT_RESULT is actionable; any later Claude message resolves an AUDIT_RESULT / ANSWER / RESPONSE; CLOSED / SUPERSEDED resolve. | Bridge `test.mjs` C1 cases |
| At-least-once, bounded retry > 7 days, STALLED, revive | `RETRY_CLAUDE`: +0, 6, 18, 42, 66, 114, 162, 210, 258 h; STALLED after 9 attempts; `workflow_dispatch revive` | Bridge C1 retry test |
| Batching, coalescing, daily budget | one ring = all non-stalled pending; ≥ 30 min between rings; ≤ 3 rings per rolling 24 h (2 of the 5 included Pro runs stay free); over budget = deferred, never paid | Bridge C1 coalescing / budget tests |
| Immutable anchor | H has exactly one parent R, changes only `ingress/claude/DOORBELL.json`, has trailer `Bridge-Ingress: claude`, `mainCommit == R`, R is on Bridge main. If exposed, the PR number is bound through `refs/pull/N/head == H`. | `c1.mjs bootstrap`; integration tests |
| Canonical verification from WonderPages | At R: mirror CURRENT VERIFIED / PASS / 5 checks; provenance against WonderPages; control files against WonderPages `BRIDGE-CONTROL.json`; mirror source in WonderPages history; WonderPages gate PASS on the canonical branch at origin head. | integration tests |
| Work list recomputed at R | `pending --for=claude` run by the control-verified tool at R; the doorbell ring list is only a hint | integration |
| Authority | `authorityState`: writes only if the phase is IN_PROGRESS and the delegation is ACTIVE for it; classification COMMUNICATE / WORK / ESCALATE in the fixed prompt; Bridge messages are never authority (G14 requires the principle) | brain tests, integration |
| STILL PENDING / STILL AUTHORIZED | `c1.mjs recheck`: write-check on current Bridge main (with a control-verified tool); phase id / status / **phase authority digest** / delegation hash unchanged; every change since the bootstrap passes `scope`; WonderPages origin unchanged except for the routine's own fast-forward pushes; gate PASS on the committed HEAD. Valid with a clean or a dirty tree, so it runs right before a commit, a push and a Bridge message (C1-A02). | integration |
| Writes confined | `c1.mjs scope --since=<bootstrap head>`: the writeScope **pinned at the bootstrap head** (never the mutable current file); `AUTHORITY_PATHS` (CLAUDE.md, DELEGATION.json, authorizations, the routine prompt, c1 / brain / lib / bridge-export tools, SOURCES.json, gate workflows) and the ACTIVE-PHASE authority fields are never routine-writable (C1-A01); gate G13 zero drift | brain tests, integration |
| No loop | Claude replies go to chatgpt / operator; doorbell pushes and ingress PRs use GITHUB_TOKEN (no workflows); WonderPages commits only change `mirror/` in the Bridge | Bridge C1 self-loop test |
| Subscription only | no secret in the Bridge; bootstrap FAILS if `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN` or `OPENAI_API_KEY` is present; usage credits OFF (operator); over-budget rings are deferred | brain test, integration |
| Fail-closed ring | `set -euo pipefail`. Failing to close the previous PR, the guard, the push or the PR creation fails the workflow and the message stays pending. If `gh pr create` fails, GitHub is asked whether a PR carries the new doorbell commit: confirmed absent → `inbox/claude` is rolled back, so an attempt that woke nobody is never recorded (repair after live run 2, §4); present → the wake happened; unknown → no rollback and no second ring before the backoff (audit C1-B01). | Bridge test (real git, fake `gh`), event-path simulation |
| Duplicate delivery | One ring opens one PR. A duplicated `opened` webhook could start two sessions (C1-A03, a platform limitation): canonical writes are still deduplicated by recheck plus fast-forward-only pushes. | integration (duplicate wake) |
| Overage | Not enforceable in-run (C1-A04): usage credits OFF is the operator's account control. Each live run's `isUsingOverage` is read from the platform afterwards and recorded in §4. | live evidence |

## 3. Evidence (filled in as it is produced)

The live test is recorded in §4.

## 4. Live test

Sequence: Claude → Bridge → ChatGPT Work → Bridge → autonomous C1 wake → fresh Claude routine.

| Step | Evidence |
|---|---|
| 1. Claude request | `MSG-20261006T180648Z-claude-7014` (AUDIT_REQUEST to chatgpt), Bridge main 3d21f24, 18:06:56 UTC. `ingress-claude` run 1 (37508799341) ran on that push and **skipped the ring**: no self-trigger. |
| 2. ChatGPT wake (B) | `ingress-chatgpt` run 15: doorbell seq 6, mainCommit 3d21f24, 18:07:07 UTC. |
| 3. ChatGPT reply | `MSG-20261006T181019Z-chatgpt-c1a4` (AUDIT_RESULT, CHANGES_REQUIRED: C1-A01 BLOCKER, A02–A04 MAJOR, A05 INFO), Bridge main e2d4083, 18:10:19 UTC. Correct correlation, nonce and R; one file. |
| 4. Claude ring, attempt 1 | `ingress-claude` run 2 (37509237799): Bridge verified, plan `new`, guard PASS, doorbell seq 1 pushed to `inbox/claude` (7455478, parent e2d4083), then **PR creation refused**: "GitHub Actions is not permitted to create or approve pull requests". No PR, so no wake and no routine run (fail-closed). Defect found: the attempt stayed recorded on `inbox/claude` although nobody woke; repaired (rollback, §2). Root cause is the repository setting, an operator-only action. |
| 5. Repair round 1 | WonderPages 6cc3aab (C1-A01/A02), Bridge control a460a16 (ring rollback) + snapshot 000021 (3e5a2a8). Re-audit request `MSG-20261006T182409Z-claude-0df9` (914b0c2). |
| 6. ChatGPT wake and reply, round 2 | doorbell seq 7 (R 914b0c2); `MSG-20261006T182725Z-chatgpt-b017` (6f462d3, 18:27:25 UTC): A01 / A02 RESOLVED, A03 / A04 ACCEPTED_LIMITATION, new C1-B01 MAJOR. `ingress-claude` run 4 (37511452433) deferred the ring: within 30 min of the previous ring (coalescing works live). |
| 7. Repair round 2, ChatGPT round 3 | Bridge control 9496069 + snapshot 000022 (f0cd22e), WonderPages 99b94cf; request `MSG-20261006T183011Z-claude-f35f` (207df6a); ChatGPT doorbell seq 8; reply `MSG-20261006T183155Z-chatgpt-c301` (42e0459, 18:31:55 UTC): **PASS_WITH_LIMITATIONS**, B01 RESOLVED, no new findings. ChatGPT leg: three autonomous round trips in 25 minutes. |
| 8. Claude ring for c301 | `ingress-claude` run 6 (37512033085) deferred the ring by the 30-minute coalescing rule; the stale seq-1 doorbell left by run 2 (before the rollback repair) counted as the last ring. The deferred ring waits for the hourly schedule. **Finding:** no scheduled run of any Bridge workflow has ever started (`event=schedule`: 0 runs; ingress-chatgpt `17 */3 * * *` since about 12:30, ingress-claude `41 * * * *` since 17:51). Push-triggered rings work; retries and deferred rings depend on GitHub's scheduler. The repository setting that lets Actions open pull requests is still needed (operator-only). |

## 5. Independent audit, round 1 (ChatGPT, advisory) and disposition

| Finding | Disposition |
|---|---|
| C1-A01 BLOCKER: scope and recheck trust the mutable ACTIVE-PHASE.writeScope | Repaired: writeScope pinned at the bootstrap head; phase authority digest in the work order and in every recheck; authority files and fields never routine-writable. Tests: brain `C1 scope (audit C1-A01)`, integration `recheck (audit C1-A01)`. |
| C1-A02 MAJOR: "clean tree" recheck before a commit is ambiguous | Repaired in the tool: recheck validates the committed HEAD with the gate and any uncommitted diff with the pinned scope, so it is valid right before the commit, the push and the Bridge message. The saved routine prompt is unchanged (changing it is an operator UI action). Test: integration `recheck (audit C1-A02)`. |
| C1-A03 MAJOR: duplicate `opened` delivery could start two sessions | Documented as a platform limitation (CLAUDE-INGRESS.md); canonical writes stay deduplicated. Observed live: see §4. |
| C1-A04 MAJOR: no code-enforced non-overage assertion | Documented: account-level control held by the operator; per-run platform evidence (`isUsingOverage`) recorded in §4. |
| C1-A05 INFO | No action. |
| Round 2 (`MSG-20261006T182725Z-chatgpt-b017`) | A01 RESOLVED, A02 RESOLVED, A03 ACCEPTED_LIMITATION, A04 ACCEPTED_LIMITATION. |
| C1-B01 MAJOR: rollback assumed a failed `gh pr create` means no PR | Repaired (Bridge control 9496069): rollback only on confirmed absence; present = delivered; unknown = keep the attempt and fail. Bridge test covers absent / present / query error. Round 3 (`MSG-20261006T183155Z-chatgpt-c301`): RESOLVED; verdict PASS_WITH_LIMITATIONS. |
