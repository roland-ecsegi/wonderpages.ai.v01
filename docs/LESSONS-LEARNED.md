KIDs DP OS v1
Lessons Learned Register

*Errors, corrections, safeguards and reusable lessons*

**Version: **1.1

**Status: **Living canonical project document

**Coverage: **Project history through Milestone 6 Visual Demo correction stage

**Date: **2026-09-27

**Version 1.1 update: **Adds LL-035 from the Visual Demo Page 9 corrective-regression finding and updates the active open-lessons list.

**Primary purpose: **Preserve every material mistake, blocker, QA miss, correction and prevention rule so the same failure is not repeated.

**Document rule**

This register is not a blame log. It is a reusable engineering/editorial memory. A lesson can be technical, creative, operational or product-level. Future automated learning may consume entries only as governed candidates; nothing here becomes a global rule silently.

# 1. Purpose and governance

The goal of this document is to keep a single, readable record of what went wrong, why it happened, how it was corrected, and what KIDs DP OS should do differently next time. It combines product, creative, QA, infrastructure, checkpoint, versioning, localization and visual-generation lessons.

Scope classification used throughout the register: PAGE, VOLUME, COLLECTION, AGE_PROFILE, GLOBAL. A lesson may also be marked as INFRASTRUCTURE or WORKFLOW where the rule concerns the execution environment.

Promotion principle: a one-off owner correction does not automatically become global policy. It first becomes a documented lesson or learning candidate with provenance and proposed scope.

# 2. Executive summary of the highest-value lessons

| **Lesson** | **Why it matters** | **Scope** |
| --- | --- | --- |
| **Do not optimize for the wrong age target.** | The original 1–3 / 3–5 / 5–7 family pushed the product toward over-simplified prose and pastel visual assumptions. The active family is now 3–4 / 5–6 / 7–8. | AGE_PROFILE |
| **Human review must precede expensive generation.** | Text, character, style and prompt gates prevented large batches of incorrect assets from being generated. | GLOBAL |
| **A visually correct asset can fail an incorrect validator.** | Coloring Page 5 exposed that exact binary-pixel checks confuse anti-aliasing with visible gray shading. QA must judge the actual product requirement. | GLOBAL |
| **Static character QA is not enough.** | Storybook Page 9 passed despite Tia developing a human-like gripping hand during object interaction. Interaction anatomy must be validated. | GLOBAL |
| **Versioning must be granular.** | Only changed artifacts should bump. The v6 micro-correction correctly preserved architecture and unchanged pages while versioning the affected matrix/prompts/pages. | GLOBAL |
| **Checkpoints and evidence chains are product features.** | Usage/auth interruptions and one historical SHA transcription defect showed why exact checkpoint restore and immutable audit evidence are mandatory. | WORKFLOW |
| **Localization is authored, not translated.** | Several Romanian lines were grammatically acceptable but unnatural. Native read-aloud quality is a separate QA dimension. | AGE_PROFILE |
| **Dinosaur World must not become the application.** | The product is now defined as a generic collection-to-books system with persistent protagonists, recurring cast and paired Storybook/Coloring outputs. | GLOBAL |

# 3. Detailed Lessons Learned Register

This register currently contains 35 material lessons. Entries marked CORRECTION_IN_PROGRESS reflect the current targeted Visual Demo correction pass and should be updated after the next Human Review.

## LL-001 — Product assumption

| **Stage** | Initial product definition / M6 migration | **Scope** | AGE_PROFILE |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Product assumption |

Problem / mistake

The original active age family was 1–3, 3–5 and 5–7. The representative story and visual policy inherited toddler assumptions that no longer matched the desired product.

Impact

Story density became too low, action too limited, vocabulary rules too restrictive, and pastel/basic-color discussions were driven by the wrong audience.

Root cause

Age bands were defined early and then treated as canonical before enough creative calibration existed.

Correction applied

Canonical migration to AGE_3_4, AGE_5_6 and AGE_7_8; legacy profiles retained as immutable history; Volume 1 migrated to AGE_3_4.

Lesson learned

Age profiles are first-class production contracts, not labels. Changing them requires dependency invalidation, revalidation and creative review.

Prevention / future rule

Before a collection starts, verify target band against story complexity, language, illustration detail and educational intent. Never rename an age profile in place.

## LL-002 — Creative/process gap

| **Stage** | Early Dinosaur World story design | **Scope** | AGE_PROFILE |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Creative/process gap |

Problem / mistake

The AGE_1_3 text policy used a rigid very-low word target and produced pages that were closer to labels than a satisfying read-aloud story.

Impact

The story felt too simple and lacked momentum, personality and emotional payoff.

Root cause

A deterministic word-count ceiling was treated as the primary definition of age appropriateness.

Correction applied

Replaced rigid per-page word targeting with flexible read-aloud density based on rhythm, clarity, page purpose and cognitive load.

Lesson learned

Word count is a safety signal, not the story architecture.

Prevention / future rule

Use density bands plus semantic QA. Flag extremes, but do not force unnatural prose to satisfy a single number.

## LL-003 — Creative continuity defect

| **Stage** | M6 v1 review | **Scope** | PAGE |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Creative continuity defect |

Problem / mistake

Page 1 required/showed the shiny pebble even though the story did not discover it until Page 2.

Impact

The narrative reveal was broken before it happened.

Root cause

Prompt requirements were generated from an object-presence rule without respecting discovery chronology.

Correction applied

Page 1 explicitly forbids the pebble; Page 2 is the first reveal. Downstream prompts were regenerated.

Lesson learned

Object continuity includes absence-before-discovery, not only presence-after-discovery.

Prevention / future rule

Page contracts must encode FIRST_APPEARANCE / NOT_YET_VISIBLE rules for story-critical objects.

## LL-004 — Creative design gap

| **Stage** | M6 v1 review | **Scope** | COLLECTION |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Creative design gap |

Problem / mistake

The initial volume centered almost entirely on Milo, with no meaningful recurring companion and weak interpersonal development.

Impact

The story had less warmth, less dialogue and fewer opportunities for cooperation and future continuity.

Root cause

The early brief optimized for minimal cast complexity.

Correction applied

Introduced Tia, a juvenile Triceratops, as recurring companion while keeping Milo the primary protagonist.

Lesson learned

A stable protagonist can coexist with a controlled secondary cast without overcrowding.

Prevention / future rule

Collection Bible should define protagonist persistence, cast limits and recurrence rules before volume production.

## LL-005 — Narrative defect

| **Stage** | M6 v2-v3 review | **Scope** | VOLUME |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Narrative defect |

Problem / mistake

Milo and Tia initially became companions too abruptly; the meet-to-friend transition lacked clear beats.

Impact

The relationship felt authored for convenience rather than naturally formed.

Root cause

The page plan allocated too little narrative space to social transition.

Correction applied

Added meet → share discovery → invite → explore together progression.

Lesson learned

Friendship continuity needs a visible formation event before later volumes can treat characters as established friends.

Prevention / future rule

Continuity Manager should store relationship state transitions, not only character co-occurrence.

## LL-006 — Creative richness gap

| **Stage** | M6 early review | **Scope** | AGE_PROFILE |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Creative richness gap |

Problem / mistake

Narration, dialogue, sound play and repetition were initially too sparse.

Impact

Read-aloud energy was low and the book did not feel alive enough for the intended age.

Root cause

Over-minimal toddler assumptions.

Correction applied

Added narrator, short dialogue, selective onomatopoeia and controlled repetition.

Lesson learned

Simple language does not require flat storytelling.

Prevention / future rule

Age profiles should specify allowable narrative devices rather than only maximum complexity.

## LL-007 — Educational integrity risk

| **Stage** | M6 character review | **Scope** | COLLECTION |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Educational integrity risk |

Problem / mistake

There was pressure to mention dinosaur species for educational value, but Milo's stylized design was not diagnostically tied to a real species.

Impact

A forced label would have created false certainty or required redesign.

Root cause

Educational naming goal was applied without separating scientifically defensible characters from stylized fictional designs.

Correction applied

Milo remains species-indeterminate; Tia is naturally identified as a Triceratops.

Lesson learned

Educational content must not fabricate certainty.

Prevention / future rule

Character Bible should store SPECIES_CERTAINTY and allow INDETERMINATE_STYLIZED_DESIGN.

## LL-008 — Localization defect

| **Stage** | M6 v2-v5 | **Scope** | AGE_PROFILE |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Localization defect |

Problem / mistake

Several Romanian lines were literal translations and sounded unnatural in read-aloud context (examples included rigid movement phrases and overly direct English syntax).

Impact

The Romanian edition felt translated instead of authored.

Root cause

Semantic equivalence was prioritized over native cadence.

Correction applied

Performed full native Romanian editorial passes; EN and RO are allowed to use different sentence structures while preserving meaning.

Lesson learned

Localization is a creative writing task plus QA, not string translation.

Prevention / future rule

Native-language QA must check rhythm, child-friendliness, dialogue and idiom independently from source-language structure.

## LL-009 — Narrative differentiation defect

| **Stage** | M6 v2 review | **Scope** | PAGE |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Narrative differentiation defect |

Problem / mistake

Pages 8 and 9 originally overlapped: rain onset and shelter response were not cleanly separated.

Impact

Adjacent pages repeated the same narrative job.

Root cause

Weather event and solution were compressed into similar scenes.

Correction applied

Page 8 = rain begins; Page 9 = cooperative shelter response.

Lesson learned

Adjacent pages should usually perform distinct narrative functions.

Prevention / future rule

Page Matrix validator should flag consecutive pages with substantially identical event purpose.

## LL-010 — Continuity/clarity defect

| **Stage** | M6 v3 review | **Scope** | PAGE |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Continuity/clarity defect |

Problem / mistake

Page 12 could be read as if Milo and Tia were settling/sleeping in the same place.

Impact

The intended separate-home continuity was ambiguous.

Root cause

Farewell and resting beats were compressed into one location-neutral ending.

Correction applied

Tia explicitly heads toward her own home; Milo settles in his own nest.

Lesson learned

Spatial continuity matters even in simple endings.

Prevention / future rule

Closing-page contracts should encode final location per active character.

## LL-011 — Product pattern risk

| **Stage** | Collection design discussion | **Scope** | COLLECTION |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Product pattern risk |

Problem / mistake

The early story pattern risked making bedtime/good-night the default ending for every volume.

Impact

The collection would become formulaic and emotionally repetitive.

Root cause

A successful ending pattern was at risk of being promoted into a universal template.

Correction applied

Varied endings are now a collection rule; this volume may end calmly, future volumes need not.

Lesson learned

A good local solution is not automatically a global rule.

Prevention / future rule

Learning candidates must carry scope and recurrence evidence before promotion.

## LL-012 — Visual identity misstep

| **Stage** | Age-profile transition | **Scope** | CHARACTER/COLLECTION |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Visual identity misstep |

Problem / mistake

Milo was temporarily pushed toward basic green / softer pastel treatment because of the younger 1–3 assumption.

Impact

His stronger, more memorable teal/turquoise identity was weakened.

Root cause

Age suitability was conflated with desaturated color identity.

Correction applied

Restored strong teal/turquoise canon; age profiles may alter rendering intensity without changing character identity.

Lesson learned

Character identity and age-style treatment are separate layers.

Prevention / future rule

Store palette identity in Character Bible and rendering intensity in Visual Style/Age Profile.

## LL-013 — Narrative geography defect

| **Stage** | M6 v4 review | **Scope** | PAGE |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Narrative geography defect |

Problem / mistake

Page 9 described a stream current pushing the pebble toward a puddle, creating unclear geography and too many micro-events.

Impact

The scene was harder to understand and overcomplicated for AGE_3_4.

Root cause

Tension was added without checking physical scene coherence.

Correction applied

Simplified to rain wetting the pebble; Milo draws it close; Tia raises a leaf; together they shelter it.

Lesson learned

One clear problem plus one clear solution is often stronger than layered micro-hazards for younger readers.

Prevention / future rule

Scene QA should validate physical causality and event count, not only prose grammar.

## LL-014 — Tone defect

| **Stage** | M6 v4 review | **Scope** | PAGE |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Tone defect |

Problem / mistake

Page 10 said Tia tested each stone before they stepped, reading like procedural risk management.

Impact

The story briefly sounded instructional rather than adventurous.

Root cause

Safety intent was expressed too literally.

Correction applied

Rewritten as rhythmic return movement with Milo leading and Tia staying close.

Lesson learned

Safety can be embedded in action without becoming a procedure manual.

Prevention / future rule

Semantic QA should flag procedural/adult operational language in narrative prose.

## LL-015 — World-model ambiguity

| **Stage** | M6 v4-v6 | **Scope** | PAGE/COLLECTION |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | World-model ambiguity |

Problem / mistake

Page 11's rainbow sparkle could be interpreted as the pebble emitting magic even though the intended effect was natural sunlight.

Impact

The scene accidentally changed the implied rules of the world.

Root cause

Visual payoff language was evocative but physically underspecified.

Correction applied

Anchored the glimmer directly on the wet pebble's surface and explicitly prohibited emitted/floating magical light in the prompt.

Lesson learned

If a visual effect can alter world rules, its physical interpretation must be explicit.

Prevention / future rule

Page contracts should distinguish NATURAL_EFFECT vs FANTASY_EFFECT for ambiguous phenomena.

## LL-016 — Prompt/layout ambiguity

| **Stage** | M6 v1-v3 | **Scope** | GLOBAL |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Prompt/layout ambiguity |

Problem / mistake

The phrase 'text forbidden' could be misread as forbidding story text entirely rather than only forbidding text embedded inside generated artwork.

Impact

Potential conflict between image-generation rules and final book layout.

Root cause

Asset-level and publication-level text policies were not separated.

Correction applied

Canonical rule: no story text/random letters/captions in illustration assets; final layout text is allowed and expected.

Lesson learned

Rules need artifact scope.

Prevention / future rule

Every prohibition should state the target artifact class: IMAGE_ASSET, PAGE_LAYOUT, METADATA, etc.

## LL-017 — Product architecture gap

| **Stage** | Post-M6 productization discussion | **Scope** | GLOBAL |
| --- | --- | --- | --- |
| **Status** | PLANNED_GUARDRAIL | **Type** | Product architecture gap |

Problem / mistake

Dinosaur World risked becoming the de facto hard-coded application instead of the first instance of a generic system.

Impact

Future collections such as Ocean World would require redevelopment instead of configuration.

Root cause

Initial implementation naturally centered the first pilot.

Correction applied

Added M7 Autonomous Collection Production and canonical generic flow Theme + Age → Collection Review → Volume Review → Demo → Production.

Lesson learned

Pilot content must test the engine, not define the engine.

Prevention / future rule

M7 acceptance requires a non-Dinosaur dry-run without new code.

## LL-018 — Collection continuity gap

| **Stage** | Post-M6 productization discussion | **Scope** | COLLECTION |
| --- | --- | --- | --- |
| **Status** | PLANNED_FOR_M7 | **Type** | Collection continuity gap |

Problem / mistake

The original model did not formally encode recurring characters disappearing and returning across volumes.

Impact

A returning Tia could be treated like a first-time meeting or be forced into every book.

Root cause

Character presence was modeled per volume, not as relationship history.

Correction applied

Canonical Collection Cast Model: persistent protagonist, flexible secondary cast, recurrence states and remembered relationships.

Lesson learned

Collection continuity is temporal, not just per-book.

Prevention / future rule

Store first appearance, relationship state, current presence and availability-for-return separately.

## LL-019 — Product structure gap

| **Stage** | Post-M6 productization discussion | **Scope** | VOLUME |
| --- | --- | --- | --- |
| **Status** | PLANNED_FOR_M7 | **Type** | Product structure gap |

Problem / mistake

Storybook and Coloring Book could have drifted into separate projects.

Impact

Paired products might depict inconsistent casts, events or objects.

Root cause

Variants were originally handled as parallel outputs rather than one volume canon.

Correction applied

Canonical Volume Pair Model: one narrative canon → Storybook + Coloring Book.

Lesson learned

Variants should share source truth and specialize downstream.

Prevention / future rule

Both variants must bind the same volume canon and page-event lineage.

## LL-020 — Workflow/cost risk

| **Stage** | Pre-visual production planning | **Scope** | GLOBAL |
| --- | --- | --- | --- |
| **Status** | ACTIVE | **Type** | Workflow/cost risk |

Problem / mistake

Generating all final images before seeing a representative visual sample would waste usage when the style or character anatomy is wrong.

Impact

Potentially dozens of unusable images and expensive rework.

Root cause

Production pipeline originally moved from prompts toward full generation without a formal minimal visual gate.

Correction applied

Introduced Visual Demo Gate before mass generation.

Lesson learned

Validate the expensive layer with the smallest representative sample first.

Prevention / future rule

Character refs + one Storybook scene + one Coloring scene must pass owner review before full-volume generation.

## LL-021 — Engineering security defect

| **Stage** | M3 | **Scope** | GLOBAL |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Engineering security defect |

Problem / mistake

A plain-text artifact could bypass a Task Contract whose output_schema required a JSON-shaped object.

Impact

Invalid artifacts could reach gate recording or commit despite schema expectations.

Root cause

Artifact presence was checked more strongly than actual schema conformance.

Correction applied

Added adversarial test and enforced rejection before gate recording/commit.

Lesson learned

Output format must be validated structurally, not inferred from task success.

Prevention / future rule

Schema validation is mandatory before any quality gate or COMMITTED transition.

## LL-022 — Checkpoint integrity gap

| **Stage** | M3 | **Scope** | GLOBAL |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Checkpoint integrity gap |

Problem / mistake

Checkpoints did not initially bind exact agent/skill/quality-gate registry content hashes/definitions.

Impact

A restored checkpoint could reference logically different registry content under the same names.

Root cause

Checkpoint state captured references more strongly than immutable registry identity.

Correction applied

Bound exact registry content hashes and validated registry graph.

Lesson learned

Exact restore requires immutable identity for configuration as well as data.

Prevention / future rule

Checkpoint manifest must bind version/hash of all execution registries that affect behavior.

## LL-023 — Observability gap

| **Stage** | M3 | **Scope** | GLOBAL |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Observability gap |

Problem / mistake

Per-capsule inspector/history and persistent-registry validation were initially incomplete.

Impact

Context provenance and execution-history auditing were weaker than required.

Root cause

Core execution path was implemented before all inspection surfaces.

Correction applied

Completed capsule/history inspection and persistent registry validation audit.

Lesson learned

If the system claims context control, it must make the applied context auditable.

Prevention / future rule

Acceptance suites should cover operator inspection surfaces, not only internal correctness.

## LL-024 — Documentation drift

| **Stage** | M6 product review | **Scope** | GLOBAL |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Documentation drift |

Problem / mistake

Google Drive canonical documents remained stuck at old M1/M3 state and still described 1–3 as the initial target after the real project had moved far beyond it.

Impact

A new Work session could resume from stale product assumptions.

Root cause

Implementation state advanced faster than canonical documentation synchronization.

Correction applied

Updated MASTER SYSTEM SPEC, WORK DEVELOPMENT HANDOFF and CURRENT DEVELOPMENT STATE with current age profiles, M6 state, M7/M8 roadmap and product rules.

Lesson learned

Canonical docs are part of runtime safety.

Prevention / future rule

Milestone closure/checkpoint process should include a documentation freshness check and sync event.

## LL-025 — Infrastructure/auth failure

| **Stage** | Interrupted M6 age migration | **Scope** | INFRASTRUCTURE |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Infrastructure/auth failure |

Problem / mistake

Work/Codex returned 401 Unauthorized with an internal service-style key reference during migration.

Impact

Migration stopped before a new committed checkpoint and risked confusing backend auth failure with project failure.

Root cause

Authentication/backend issue; not evidence of a project defect or need for a user-created API key.

Correction applied

Opened a fresh Work session, tested auth with a trivial AUTH_OK request, then resumed from the last safe checkpoint and inspected persisted/dirty state before continuing.

Lesson learned

Do not modify project state while the execution environment is unauthenticated.

Prevention / future rule

On 401: verify auth separately, do not create ad hoc API keys, then resume from exact checkpoint only after service recovery.

## LL-026 — Infrastructure/sandbox failure

| **Stage** | Earlier Codex local diagnostics | **Scope** | INFRASTRUCTURE |
| --- | --- | --- | --- |
| **Status** | HISTORICAL_RESOLVED/EXTERNAL | **Type** | Infrastructure/sandbox failure |

Problem / mistake

Codex sandbox provisioning failed with helper_unknown_error, including in a clean test repository.

Impact

Local agent execution was blocked and initially appeared related to repository ACL/ownership.

Root cause

The clean-repo reproduction showed the failure was global sandbox/environmental rather than project-specific.

Correction applied

Separated global environment diagnosis from repository fixes; avoided destructive project changes based on a false root cause.

Lesson learned

Reproduce tool failures in a minimal clean environment before changing project state.

Prevention / future rule

Maintain a standard diagnostic smoke repo and distinguish project defect vs host/toolchain defect.

## LL-027 — CLI environment issue

| **Stage** | Earlier local diagnostics | **Scope** | INFRASTRUCTURE |
| --- | --- | --- | --- |
| **Status** | DOCUMENTED | **Type** | CLI environment issue |

Problem / mistake

PowerShell execution policy could block the codex launcher command.

Impact

CLI tests could fail for shell-policy reasons unrelated to Codex itself.

Root cause

PowerShell script execution behavior.

Correction applied

Use codex.cmd where appropriate for diagnostic invocation.

Lesson learned

Shell/launcher failures are not equivalent to application failures.

Prevention / future rule

Windows runbooks should specify the verified executable form.

## LL-028 — Checkpoint/evidence defect

| **Stage** | M6 v5→v6 | **Scope** | WORKFLOW |
| --- | --- | --- | --- |
| **Status** | RESOLVED | **Type** | Checkpoint/evidence defect |

Problem / mistake

A historical carrier manifest contained an incorrect expanded documentation commit SHA even though checkpoint payload and restore were valid.

Impact

Human reviewers saw apparently conflicting commit/checkpoint identities.

Root cause

Transcription/reference defect in documentation evidence.

Correction applied

Verified exact Git ancestry, preserved history without rewriting it, recorded the correct SHA in v6 and documented that creative artifacts had not changed.

Lesson learned

Evidence metadata must be independently verifiable; a valid payload does not excuse an incorrect reference.

Prevention / future rule

Generate commit/checkpoint references directly from repository state and validate ancestry during packet creation.

## LL-029 — Visual QA miss

| **Stage** | M6 Visual Demo | **Scope** | GLOBAL |
| --- | --- | --- | --- |
| **Status** | CORRECTION_IN_PROGRESS | **Type** | Visual QA miss |

Problem / mistake

Storybook Page 9 was initially marked PASS even though Tia's leaf-holding extremity became a human-like grasping hand.

Impact

A character-consistency defect could have propagated across full production.

Root cause

Visual QA emphasized static traits (palette, horns, frill) but did not sufficiently inspect anatomy during object interaction.

Correction applied

Reclassified Page 9 as blocked; targeted regeneration only; proposed stronger limb count, attachment and extremity-morphology checks.

Lesson learned

Characters can drift specifically during interactions even when static references are correct.

Prevention / future rule

Interaction-scene QA must validate limb count, limb attachment, extremity morphology, object grip and absence of humanoid anatomy.

## LL-030 — Validator design defect

| **Stage** | M6 Visual Demo | **Scope** | GLOBAL |
| --- | --- | --- | --- |
| **Status** | CORRECTION_IN_PROGRESS | **Type** | Validator design defect |

Problem / mistake

Coloring Page 5 failed because QA required exact binary pixels; anti-aliased near-white/off-neutral edge pixels were treated as forbidden gray.

Impact

A visually valid coloring page was blocked by a validator that measured renderer internals instead of visible product requirements.

Root cause

The deterministic rule conflated anti-aliasing with shading/gray fills.

Correction applied

Targeted fix: distinguish visible gray/shading from harmless near-neutral anti-aliasing and introduce deterministic local black/white normalization where geometry is preserved.

Lesson learned

Deterministic QA must encode the actual user-visible requirement, not an overly literal proxy.

Prevention / future rule

Raw generator assets may contain bounded anti-aliasing; accepted final coloring assets must be normalized/audited to true B/W without changing geometry.

## LL-031 — Character consistency rule gap

| **Stage** | M6 Visual Demo review | **Scope** | COLLECTION |
| --- | --- | --- | --- |
| **Status** | CORRECTION_IN_PROGRESS | **Type** | Character consistency rule gap |

Problem / mistake

Visual QA needed stronger explicit checks for Milo's exact three spots and Tia's three horns/frill across interaction scenes.

Impact

Small canonical traits could drift between pages while the overall character still looked similar.

Root cause

Trait QA was not yet sufficiently enumerated as invariant checks.

Correction applied

Add invariant checklist for spot count, horn count, frill, palette, tail, proportions and forbidden anatomical drift.

Lesson learned

Memorable small traits are part of character identity and need explicit QA.

Prevention / future rule

Character Bible must expose machine-checkable invariant traits for every generated asset.

## LL-032 — Governance risk

| **Stage** | Auto-learning design | **Scope** | GLOBAL |
| --- | --- | --- | --- |
| **Status** | PLANNED_FOR_M8 | **Type** | Governance risk |

Problem / mistake

A naive auto-learning system could promote a single owner correction into a global rule.

Impact

One local preference could contaminate unrelated collections or age profiles.

Root cause

Learning without explicit scope/evidence governance.

Correction applied

Defined governed learning candidates with provenance, evidence and PAGE/VOLUME/COLLECTION/AGE_PROFILE/GLOBAL scope; owner review required before promotion.

Lesson learned

Learning must be reversible, scoped and evidence-based.

Prevention / future rule

No silent promotion; retain candidate, conflicts, source history and rollback/versioning.

## LL-033 — Calibration strategy gap

| **Stage** | Auto-learning design | **Scope** | AGE_PROFILE |
| --- | --- | --- | --- |
| **Status** | PLANNED | **Type** | Calibration strategy gap |

Problem / mistake

Calling an age profile 'trained' after one collection would overfit lessons to one theme.

Impact

Collection-specific patterns could be mistaken for age-wide best practices.

Root cause

Insufficient sample diversity.

Correction applied

Preferred calibration plan: three materially different collections per age band; acceptable cost-saving alternative: two full collections plus one deep dry-run.

Lesson learned

Calibration requires cross-theme evidence.

Prevention / future rule

Profile states: DEFINED → IN_CALIBRATION → CALIBRATION_CANDIDATE → CALIBRATED, with review after each collection.

## LL-034 — Usage/recovery risk

| **Stage** | M4/M5/M6 execution | **Scope** | WORKFLOW |
| --- | --- | --- | --- |
| **Status** | ACTIVE_RULE | **Type** | Usage/recovery risk |

Problem / mistake

Long tasks can be interrupted by usage allowance/reset windows.

Impact

Without a safe handoff, partially completed work could be lost or repeated.

Root cause

Model/Work allowance is an external constrained resource.

Correction applied

Adopted /checkpoint-and-handoff and exact /resume workflow; persist, validate, commit, record NEXT ACTION, then start a new session.

Lesson learned

Usage limits are an expected operating condition, not an exceptional failure.

Prevention / future rule

Prepare handoff near low allowance and never start a large atomic task that cannot fit the execution envelope.

## LL-035 — Corrective visual regression

Stage: M6 Visual Demo targeted correction | Scope: PAGE / GLOBAL | Status: OPEN — FINAL PAGE 9 CORRECTION PENDING

Problem / mistake

The first targeted Storybook Page 9 correction successfully removed Tia's humanoid grasping hand, but the revised image weakened a previously correct story action: Tia no longer clearly appeared to be the one actively supporting or raising the shelter leaf.

Impact

A correction that passes the originally reported anatomy defect can still fail the page contract by making the required character action ambiguous. If accepted, full production could preserve anatomically correct characters while silently drifting from the narrative.

Root cause

The targeted regeneration and follow-up QA optimized primarily for removal of the known anatomy defect. The corrected output was not re-evaluated strongly enough against the complete scene contract, especially the requirement that Tia visibly performs the cooperative shelter action.

Correction applied / current action

The current demo is being held for one final, narrowly scoped Page 9 regeneration. The next candidate must simultaneously preserve Tia's canonical Triceratops anatomy and make it visually unambiguous that she supports/raises the broad leaf, without a humanoid fingered grip.

Lesson learned

Fixing one visual defect can introduce a corrective regression: the new image may solve the reported defect while removing or weakening a requirement that was previously correct. Targeted regeneration must therefore be validated against the complete scene contract, not only against the defect that triggered the retry.

Prevention / future rule

After every targeted visual correction, revalidate at least four dimensions together: Character Anatomy + Character Action + Story Contract + Scene Readability. A candidate cannot pass merely because the original defect disappeared. Also re-check all stable canonical invariants (limb count/attachment, extremity morphology, horn/spot/frill counts, palette, props, object relationships, and page purpose).

# 4. Recurring patterns across the project

**Wrong abstraction level: **Several failures came from encoding a proxy as the real requirement: word count instead of read-aloud quality, exact binary pixels instead of visible no-shading output, object presence instead of discovery chronology.

**Local success promoted too broadly: **Bedtime endings, pastel assumptions and one-off feedback all showed the risk of turning a local solution into a universal rule.

**Static validation misses temporal/interaction defects: **Returning-character memory and Tia's human-like hand both show that correctness must be evaluated through time and interaction, not only in isolated reference states.

**Documentation and evidence are executable safety infrastructure: **Stale Drive docs, commit/checkpoint discrepancies and usage handoffs can change what a new session does even when production artifacts are correct.

**Human review is most valuable before expensive/irreversible steps: **Story gates and the Visual Demo Gate prevented batch generation from amplifying small defects.

**Generic architecture must be proven outside the pilot: **Dinosaur World is valuable as calibration data, but M7 must demonstrate that a new theme can run without code changes.

# 5. Rules that should remain non-negotiable

No full image production before the relevant Human Gates and Visual Demo Gate are approved.

No silent overwrite of historical canonical artifacts; version and invalidate downstream dependencies.

No automatic promotion of one-off feedback into GLOBAL or AGE_PROFILE policy.

No fabricated progress; progress only from measurable completed work units/events.

No provider/API spend without explicit owner approval.

No assumption that a passing automated validator means the asset is creatively correct; Human Review remains required at designated gates.

No forced species identity when the visual design does not support one.

No mechanical EN→RO translation accepted as final localization.

No resume from chat memory alone when a checkpoint/state file exists.

No project mutation while auth/sandbox state is known to be broken or unverified.

# 6. Open lessons / update after next Visual Demo correction

The following entries are intentionally still open and should be revised after the current targeted correction completes:

**LL-029: **Storybook Page 9 was initially marked PASS even though Tia's leaf-holding extremity became a human-like grasping hand.

**LL-030: **Coloring Page 5 failed because QA required exact binary pixels; anti-aliased near-white/off-neutral edge pixels were treated as forbidden gray.

**LL-031: **Visual QA needed stronger explicit checks for Milo's exact three spots and Tia's three horns/frill across interaction scenes.

**LL-035: **A targeted visual correction can fix the original defect while weakening required character action; full scene-contract revalidation is mandatory.

# 7. Maintenance protocol

Update this document whenever a material defect, blocker, false assumption, QA miss or recovery incident changes how the system should behave. A new entry should include evidence/provenance, correction, scope and prevention rule. When an open lesson is resolved, preserve the original problem statement and update its status/correction rather than deleting history.

Recommended future integration: keep this human-readable document as the editorial/engineering register, and mirror each approved lesson in a machine-readable Lessons Learned ledger so M8 can consume lessons as governed learning candidates without using conversational memory as policy.

KIDs DP OS v1 — Lessons Learned Register v1.1