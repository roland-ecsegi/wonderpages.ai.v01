# Decision C1 — durable ChatGPT → Claude channel (Claude Code routine), design and evidence

- **Authorized by:** operator follow-up #13 (verbatim: `brain/phase/authorizations/CONTINUITY-1.operator-authorization-C1.txt`;
  record `brain/phase/authorizations/CONTINUITY-1.operator-followups.md`).
- **Authority model:** `brain/phase/DELEGATION.json`, checked by gate G14.
- **Status:** IMPLEMENTED; local and adversarial tests PASS. The live test is recorded below once run.

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
| STILL PENDING / STILL AUTHORIZED | `c1.mjs recheck`: write-check on current Bridge main (with a control-verified tool); phase id / status / delegation hash unchanged; WonderPages origin unchanged except for the routine's own fast-forward pushes; gate PASS | integration |
| Writes confined | `c1.mjs scope --since=<bootstrap head>` against ACTIVE-PHASE.writeScope; gate G13 zero drift | brain tests |
| No loop | Claude replies go to chatgpt / operator; doorbell pushes and ingress PRs use GITHUB_TOKEN (no workflows); WonderPages commits only change `mirror/` in the Bridge | Bridge C1 self-loop test |
| Subscription only | no secret in the Bridge; bootstrap FAILS if `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN` or `OPENAI_API_KEY` is present; usage credits OFF (operator); over-budget rings are deferred | brain test, integration |
| Fail-closed ring | `set -euo pipefail`. Failing to close the previous PR, the guard, the push or the PR creation fails the workflow; the message stays pending, and the attempt is recorded only when the doorbell was pushed. | event-path simulation |

## 3. Evidence (filled in as it is produced)

The live test is recorded in §4.

## 4. Live test

Not yet run.
