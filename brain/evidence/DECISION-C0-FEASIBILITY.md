# Decision C0 — feasibility of an event-driven Claude wake-up (investigation only)

- **Authorized by:** `brain/phase/authorizations/CONTINUITY-1.operator-followups.md` #8 (verbatim, 2026-10-06). Investigation and design
  only. Decision C is **not implemented**. The C0 live test is **not run**. Nothing post-CONTINUITY-1 is started.
- **Sources:** official Anthropic documentation, read on 2026-10-06 (quoted below with URLs). Environment facts are observed in this
  cloud session (Claude Code 2.1.291).
- **Verdict: FEASIBLE_WITH_LIMITATIONS.** No contradiction with the subscription-first invariant was found, provided that **usage
  credits stay turned off** on the operator's Claude account (precondition P1). That precondition is an account setting the operator
  controls, not an API dependency.

## 1. Verdict

| Item | Determination |
|---|---|
| Subscription-only wake of Claude Code from a GitHub event | **Feasible**, by two officially documented routes (§4) |
| Recommended route | **R1: Claude Code routine with a GitHub trigger** on a dedicated Bridge ingress PR. No credential is stored in GitHub. |
| Alternative route | **R2: GitHub Actions** `anthropics/claude-code-action@v1` + `CLAUDE_CODE_OAUTH_TOKEN` (one-year subscription token). Works, but needs a stored secret and a cross-repository design (§8). |
| Opus 5.5 pinned | **Yes:** full model name `claude-opus-5-5` (aliases are not used) |
| High effort | **Yes, configurable** (`--effort high`, `CLAUDE_CODE_EFFORT_LEVEL=high`, `effortLevel`). Effect on routines to be observed in C0. |
| Usage limits | Runs fail or are rejected; nothing is billed while usage credits are off. Durability must come from the Bridge queue (as in B). |
| Limitations | research-preview feature (routines); GitHub event caps; 72 h GitHub-connection rule; documented automatic model fallback for flagged content; commits appear under the operator's GitHub identity |

## 2. Authentication — official evidence

1. **`CLAUDE_CODE_OAUTH_TOKEN` is officially supported in GitHub Actions.** <https://code.claude.com/docs/en/github-actions>:
   "`CLAUDE_CODE_OAUTH_TOKEN`: an OAuth token that authenticates with your Claude subscription, available on Pro, Max, Team, and
   Enterprise plans. Generate one by running `claude setup-token` locally." Action input: `claude_code_oauth_token`.
2. **`claude setup-token`.** <https://code.claude.com/docs/en/authentication#generate-a-long-lived-token>: "For CI pipelines, scripts,
   or other environments where interactive browser login isn't available, generate a one-year OAuth token with `claude setup-token`
   … It does not save the token anywhere … This token authenticates with your Claude subscription and requires a Pro, Max, Team, or
   Enterprise plan. It can only make model requests …" **Lifecycle:** one year, no refresh described. On expiry or revocation the
   requests fail (`OAuth token has expired` / `401`), and the operator must generate a new token. Note: "[Bare mode] does not read
   `CLAUDE_CODE_OAUTH_TOKEN`".
3. **Unattended execution is documented.** The GitHub Actions page has *automation mode*: "when the workflow provides a `prompt`
   input, Claude runs without waiting for a mention". The examples run on `schedule` and on `pull_request`. Routines
   (<https://code.claude.com/docs/en/routines>) "run autonomously as full Claude Code cloud sessions", on Pro, Max, Team and
   Enterprise.
4. **Terms of Service.** <https://code.claude.com/docs/en/legal-and-compliance>:
   - "OAuth authentication … is designed to support ordinary use of Claude Code and other native Anthropic applications."
   - "Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK."
   - "Developers building products or services … should use API key authentication." (That restriction targets third-party products
     and routing other users' requests through plan credentials. It does not apply to the operator's own project.)

   Both R1 and R2 run the unmodified Claude Code through features Anthropic itself documents for subscriptions.
   **Recommendation (not a legal opinion):** keep C low-volume and for the operator's own work, and avoid the Agent SDK in custom
   code.
5. **Claim 3 of the instruction (Agent SDK / `claude -p` on a subscription):** only partly confirmed. The docs confirm subscription
   billing for the GitHub Action ("If you authenticate with an OAuth token, runs use your Claude subscription instead of API billing")
   and for routines ("Routines draw down subscription usage the same way interactive sessions do"). The Agent SDK is not needed by R1
   or R2.

## 3. Subscription vs API billing

- **Precedence (authentication page):**
  - Precedence order: cloud provider > `ANTHROPIC_AUTH_TOKEN` > **`ANTHROPIC_API_KEY`** > `apiKeyHelper` > **`CLAUDE_CODE_OAUTH_TOKEN`** >
    profiles > `/login`.
  - "In non-interactive mode (`-p`), the key is always used when present."
  - Therefore, in R2, an `ANTHROPIC_API_KEY` (or `ANTHROPIC_AUTH_TOKEN`, or `apiKeyHelper`) anywhere in the job environment would
    silently switch the run to API billing.
  - **Rule:** no such variable or secret may exist in the repository or the organization, and the workflow passes only
    `claude_code_oauth_token`.
- **Cloud sessions and routines (R1):** "Cloud sessions always use your subscription credentials. If you set `ANTHROPIC_API_KEY` or
  `ANTHROPIC_AUTH_TOKEN` in the cloud environment, it doesn't override your subscription credentials." That is stronger than R2.
- **Usage credits (the only path to paid overage):**
  - The routines page says: "When a routine hits your subscription usage limit, organizations with usage credits turned on can keep
    running routines on metered overage. Without usage credits, additional runs are rejected until your usage window resets."
  - Usage credits are an explicit account toggle (claude.ai/settings/usage; on Team/Enterprise in the admin usage settings).
  - **Precondition P1: usage credits OFF.** With them OFF, exhaustion ⇒ WAIT_FOR_ALLOWANCE / WAIT_FOR_RESET, never paid.
  - If the operator cannot keep them off, C must not be built (fail-closed).
- **No Bedrock / Vertex / Foundry, no Console API key, no workload-identity federation** (that is a Console API path) appears in
  either route.

## 4. Event / wake mechanism

| Trigger | Assessment |
|---|---|
| `push` | A push by `GITHUB_TOKEN` starts no workflow, so a bot doorbell cannot chain. A ChatGPT push to Bridge `main` can start a Bridge workflow, but then the Claude secret (R2) would live in a repository where ChatGPT has write access, so a rewritten workflow could exfiltrate it. **Rejected for R2-in-Bridge.** |
| `workflow_dispatch` / `repository_dispatch` | Cross-repository dispatch (Bridge → WonderPages) needs a token with write on the target repository, stored in the Bridge. **Rejected** (weakens separation). |
| `schedule` | Not event-driven. Useful only as the retry heartbeat (as in B). |
| **`pull_request` `synchronize` on a never-merged ingress PR** | Mirrors B, which is proven live. With **R1** the routine's GitHub trigger subscribes to it through the Claude GitHub App webhook, so no secret is needed and nothing in GitHub can leak a Claude credential. **Recommended.** |

**Recommended design (R1), mirroring B:**

1. **Ingress PR in the Bridge.** Branch `inbox/claude`, title `[ingress] Claude inbox — do not merge`.
2. **Doorbell.** A Bridge workflow (`GITHUB_TOKEN`, trailer `Bridge-Ingress: claude`) rings it when a message `to: claude` is
   pending.
3. **Routine.** A routine on the operator's claude.ai account runs:
   - **Trigger:** GitHub `pull_request.synchronize`, repository `wonderpages.agent-bridge`, head branch equals `inbox/claude`.
   - **Prompt:** fixed (stored on claude.ai; ChatGPT cannot edit it).
   - **Model:** `claude-opus-5-5`.
   - **Environment:** a dedicated one with `CLAUDE_CODE_EFFORT_LEVEL=high`.
   - **Connectors:** none.
   - **Repositories:** Bridge (plus WonderPages only when a later decision allows it).
4. **Retries come from the Bridge, not from the event.**
   - GitHub events above the routine's hourly caps are dropped, and runs are rejected while the allowance is exhausted.
   - So the Bridge keeps a durable queue for Claude and re-rings with B's bounded backoff (3/6/12/24/48 h, 9 attempts ≈ 9.9 days >
     7 days).
   - Completion is measured by the resolving message on Bridge `main`, never by the run status.
     (Routines page: "A green status … does not mean the task in your prompt succeeded.")

**R2 (alternative):**

- The workflow must live in **WonderPages**, where ChatGPT has no access, with the secret `CLAUDE_CODE_OAUTH_TOKEN` stored there.
- WonderPages would then have to *poll* the Bridge on a schedule (no event across repositories without a stored token). That is a
  change to WonderPages CI and conflicts with the standing rule that WonderPages does not read the Bridge.
- Kept only as a fallback if routines become unavailable.

## 5. Model pinning

- **Pinning rule.** <https://code.claude.com/docs/en/model-config>: "Aliases point to the recommended version for your provider and
  update over time. To pin to a specific version, use the full model name, for example `claude-opus-5-5`."
  - R2: `claude_args: --model claude-opus-5-5`.
  - R1: the routine's model selector ("Claude uses the selected model on every run"). **Open item:** whether the selector stores the
    full ID or an alias must be checked when the operator creates the routine, and the run's model must be read back in the C0
    test (`get_session`: `session_context.model` and `external_metadata.last_served_model`).
- **Documented automatic fallback.** "Fable 5.1, Fable 5, Opus 5.5: Biology → Opus 5; Cybersecurity → Opus 4.8" for flagged
  requests. It cannot be disabled, but it is observable per turn (last served model). **Never set `--fallback-model` /
  `fallbackModel`.**

## 6. Effort (kept distinct from model, thinking and budget)

| Concept | Documented control | For Opus 5.5 |
|---|---|---|
| Model | `--model`, `ANTHROPIC_MODEL`, settings `model`, routine selector | `claude-opus-5-5` |
| **Effort** (adaptive reasoning level) | `--effort high`, `CLAUDE_CODE_EFFORT_LEVEL=high`, settings `effortLevel` / `modelSettings.<model>.effortLevel` | levels low…max; **default is `medium`**, so High must be set explicitly |
| Extended thinking | session toggle / `/config` | "You can't turn thinking off on Opus 5.5" (always on) |
| Thinking token budget | `MAX_THINKING_TOKENS` | applies only to Opus 4.6 / Sonnet 4.6; "Adaptive-reasoning models ignore nonzero budgets, so use effort levels there instead" |
| Run size / turns | `--max-turns`, workflow timeouts | independent of effort |

- **R2:** `--effort high` in `claude_args` (documented flag).
- **R1:** routines document no effort selector.
  - Plan: set `CLAUDE_CODE_EFFORT_LEVEL=high` as a (non-secret) environment variable on a dedicated cloud environment, which "a
    session reads … when you create it and again each time Claude Code starts". Alternative: settings `effortLevel` in a one-repository
    session.
  - Observability: this cloud session exposes `CLAUDE_EFFORT=high`, so the C0 test can read the effective level back.
  - **To be verified in C0.**

## 7. Usage-limit and failure behaviour

| Situation | Documented behaviour | Required C behaviour |
|---|---|---|
| 5-hour or weekly allowance exhausted | errors page: "You've hit your session limit / weekly limit"; in `-p` mode Claude Code "blocks further requests until the reset", reported as an execution error, no auto-continue. Routines: "additional runs are rejected until your usage window resets" (without usage credits). | Nothing partial; item stays pending; Bridge re-rings on backoff (WAIT_FOR_ALLOWANCE / WAIT_FOR_RESET) |
| Opus-only limit | "You've hit your Opus limit" | **Do not** switch model automatically; wait (the pin is part of the contract) |
| Authentication expires | R2: one-year token, then `401` / "OAuth token has expired". R1: the routine uses the operator's claude.ai account; a missing or expired *GitHub* connection makes the routine skip runs "for up to 72 hours", then it "turns off". | Pending stays durable. Operator action: new token (R2) or reconnect GitHub and re-enable the routine (R1). Surfaced as a STALLED warning. |
| Event arrives while Claude is unavailable / over caps | GitHub events "beyond the limit are dropped" | Covered by re-ring + STALLED + revive (B design) |
| Subscription paused | "routines are put on hold" | Same as above |

No quota probing and no usage monitor are needed or used.

## 8. Security

1. **Injection.** Every Bridge message is untrusted data. In R1, instructions come only from the routine's stored prompt (fire or
   event content is labelled untrusted by the platform). The stored prompt must make the repository canon the authority, as in B
   (B-01/B-02/B-05).
2. **Future C bootstrap (design, not built):**
   - **R:** take R from the doorbell's `mainCommit`. Accept the doorbell only if its commit carries the `Bridge-Ingress: claude`
     trailer and is authored by the Bridge workflow bot; otherwise exit with nothing written.
   - **At R:** require mirror VERIFIED and provenance VERIFIED. Verify the control files against `brain/manifest/BRIDGE-CONTROL.json`
     **read from WonderPages itself**, which is stronger than B because Claude can read the canon directly.
   - **WonderPages:** clone it and run `node brain/tools/brain.mjs gate` (CONTEXT_INTEGRITY = PASS or stop). Read `ACTIVE-PHASE.json`
     (`allowed`, `forbidden`, `writeScope`, `doNotStart`) and a new, operator-written **delegation table** listing exactly what a
     ChatGPT message may ask Claude to do.
   - **Messages:** accept only the supported types, from `chatgpt` to `claude`, within the delegation. Everything else becomes an
     OPERATOR_DECISION_REQUIRED to the operator, never an action. A Bridge message can never create, widen or replace an operator
     authorization (operator decisions exist only verbatim in WonderPages).
   - **Before every write:** run the STILL-PENDING re-check (B-05 semantics) and skip anything CLOSED, SUPERSEDED or resolved;
     the first reply is canonical.
   - **No loop:** Claude replies go `to: chatgpt` (B rings ChatGPT). ChatGPT replies `to: claude` ring Claude only when actionable,
     never on ACK or CLOSED.
3. **Standing-rule conflict (needs an operator decision before C1).** CONTINUITY-1 forbids automatic Bridge → WonderPages flow. A
   ChatGPT message that makes Claude *write* WonderPages would be such a flow. **Recommendation:** C1 limits autonomous runs to Bridge
   writes plus read-only WonderPages verification. Any WonderPages write stays with an operator-present session, unless the operator
   explicitly amends the rule.
4. **Identity.** R1 commits appear as the operator's GitHub user (routines page). Runs must sign with trailers and their session
   link.
5. **Allowance abuse.** ChatGPT has write access to the Bridge and could push to `inbox/claude` to start runs. Mitigations: the guard
   above (cheap exit), a GitHub ruleset restricting `inbox/claude` to the workflow, and the routine's hourly caps.
6. **Liveness lesson, finding B-06 (observed today).**
   - ChatGPT wrote `MSG-20261006T145200Z-chatgpt-bpass` (Bridge `fae311b`): its id does not match the 4-hex format, and it is an
     AUDIT_RESULT without `inReplyTo`.
   - `validate` is therefore INVALID, so `ingress-plan` refuses to ring (fail-closed), and append-only forbids removal.
   - **B currently cannot ring until this is resolved.**
   - C must not inherit a permanent block caused by one malformed message. Proposed repair (not applied, needs authorization because
     it changes protocol semantics): a Claude-owned, control-pinned quarantine ledger that `validate` reports as warnings and excludes
     from threads and pending.

## 9. GitHub permissions (minimum)

| Route | Needs |
|---|---|
| R1 | Claude GitHub App installed on `roland-ecsegi/wonderpages.agent-bridge` (webhook delivery for the trigger; its permission set is fixed by GitHub and cannot be narrowed). The operator's GitHub connection on claude.ai (clone and push). The existing Bridge workflow `GITHUB_TOKEN` with `contents: write` for the doorbell. **No secrets.** |
| R2 | Workflow `contents: write` (plus `id-token: write` only for app-based GitHub auth) and the secret `CLAUDE_CODE_OAUTH_TOKEN` in the repository that hosts the workflow (**WonderPages, never the Bridge**). No `ANTHROPIC_API_KEY` anywhere. |

ChatGPT keeps access to the Bridge only, under both routes.

## 10. Proposed minimal C0 live test (not run)

Proves only: GitHub event → subscription → Claude Code → model and effort read back → nonce read at an immutable Bridge commit →
diagnostic result written to the Bridge. It does not touch WonderPages, Bridge `main`, the protocol, or ChatGPT.

1. **Operator setup:** see §11.
2. **Claude:** create branch `inbox/claude-c0` and a draft PR `[c0] Claude wake probe — do not merge` in the Bridge.
3. **Claude:** push **one** probe commit changing `ingress/claude/C0-PROBE.json` = `{nonce, mainCommit R}` (unique nonce).
4. The `pull_request.synchronize` event fires the routine. Its fixed prompt says to:
   - read the probe at the event's head commit (not a moving ref) and check that its parent chain is the probe branch;
   - check out R and run `node tools/bridge.mjs verify-mirror` and `verify-control` at R (read only);
   - record `session_context.model` and `last_served_model` (`get_session`), `CLAUDE_EFFORT`, the session link and the UTC time;
   - write **only** one result file (c0/RESULT.json, not yet existing) on a new branch `claude/c0-result-<nonce>`, then stop.
5. **Claude (operator session) validates:**
   - the nonce;
   - R, and the mirror and control results at R;
   - model `claude-opus-5-5` and effort `high`;
   - exactly one result branch and one file;
   - no change to `main`, `inbox/chatgpt` or WonderPages;
   - no paid usage (usage credits off).

   It then records the evidence and deletes the probe PR and branches only if the operator agrees.
6. **Not proven by C0 (left to C1):** delivery of an event caused by a **bot** (`GITHUB_TOKEN`) commit to the routine; the durable
   queue for Claude; retries.

## 11. Operator actions

The recommended route R1 needs **no credential at all**. No token, key or PAT is ever pasted anywhere.

1. **P1:** confirm the plan (Pro / Max / Team / Enterprise) and that **usage credits are OFF** at claude.ai/settings/usage. If they
   cannot stay off, stop C.
2. **P2:** confirm the Claude GitHub App is installed on the Bridge repository (github.com/apps/claude). Install it if not.
3. **When the C0 test is authorized:** create the routine at claude.ai/code/routines from the exact configuration Claude will
   provide: prompt, repository (Bridge only), model `claude-opus-5-5`, a dedicated environment with `CLAUDE_CODE_EFFORT_LEVEL=high`
   (not a secret), connectors none, and a GitHub trigger on `pull_request.synchronize` with head branch `inbox/claude-c0`. Then
   confirm.

**Only if R2 is chosen instead:**

1. Run `claude setup-token` locally and approve in the browser. The token is printed once.
2. Paste it **directly** into GitHub, in **WonderPages** › Settings › Secrets and variables › Actions › New repository secret, named
   `CLAUDE_CODE_OAUTH_TOKEN`.
3. Make sure no `ANTHROPIC_API_KEY` secret exists, then tell Claude only "set up".
4. Renew it within a year.

## 12. Risks and open unknowns

- Routines are a **research preview** ("Behavior, limits, and the API surface may change").
- GitHub event caps per routine and per account. Events beyond them are dropped (covered by re-ring).
- The 72-hour GitHub-connection rule turns the routine off (needs the operator). Surfaced as STALLED.
- Unverified: whether the routine model selector pins the full ID; whether the effort environment variable is honoured; whether
  routines receive events caused by `GITHUB_TOKEN` commits (B proved this only for ChatGPT Work).
- Documented automatic model fallback on flagged content: observable, not preventable.
- Consumer-terms "ordinary, individual usage" expectation: keep volume low.
- Commits are under the operator's identity.
- B-06 currently blocks B's ingress (§8.6).
- Routine fire payloads are untrusted by design, so all authority must come from the stored prompt plus the repository canon.

## 13. Recommendation on authorizing Decision C

**Do not authorize the implementation of Decision C yet.** Recommended order (recommendations, not decisions):

1. Authorize the **B-06 repair**: B is blocked now.
2. The operator confirms **P1 and P2**.
3. Authorize the **C0 live test** (§10) on route R1.
4. Only after C0 PASS, decide the C1 scope. That needs an explicit operator decision on the standing rule *Bridge → WonderPages
   automatic is forbidden* (recommended: Bridge-only writes for autonomous runs) and an operator-written delegation table for
   ChatGPT.
