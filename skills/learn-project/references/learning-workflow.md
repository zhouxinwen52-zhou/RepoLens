# Learning Workflow

This reference defines the evidence and Archify integration boundary for the
RepoLens Learning Workflow. RepoLens owns repository truth; Archify owns typed
visualization, validation, and HTML delivery.

## Archify availability and recovery

Onboarding reports a preliminary Archify status for environment awareness. Do
not use that status to influence the Repository Router's `LEARN`, `USE`,
`BOTH`, or `SKIP` value judgment.

Run the authoritative capability check after routing selects `LEARN`, or when
`BOTH` enters its Learning portion, immediately before Stage 1. `USE` and
`SKIP` do not need this check. Availability requires a discoverable installed
skill package, its documented CLI, and a successful packaged health check from
the Archify skill directory:

```text
node bin/archify.mjs doctor
```

A missing package, missing CLI, or failed health check produces
`archify-unavailable`. Preserve the evidence-backed RepoLens text and analysis
models, mark the affected diagram and complete Learning Workflow incomplete,
and return one concrete recovery action.

Archify availability does not gate repository truth extraction. After the
authoritative check, always run Stage 1 against the allowed repository evidence
and produce a valid RepoLens `ArchitectureModel`. When Archify is unavailable,
stop only the visualization branch: keep the model and text, skip
`toArchifyArchitecture(model)`, validation, and delivery, then return the
degraded result.

When an official Archify source and current installation steps can be verified,
provide them to the user. If they cannot be verified, say so instead of
inventing instructions. Never install or update Archify automatically.

Do not assume a generic cross-plugin API or dependency declaration. The
verified integration contract is the installed Archify `SKILL.md`, its selected
JSON schema and example, its directly required authoring and delivery
references, and its packaged CLI. Re-read those resources before adapting to a
different installed version.

## Ownership boundary

RepoLens owns:

- repository identity and analyzed revision;
- evidence collection and evidence IDs;
- `Observed` versus `Inferred` status and confidence;
- architecture components, entry points, external systems, boundaries, and
  relationships;
- core-component importance and `Must Read`, `Worth Reading`, and
  `Reference Only` groups;
- validation that every important component and relationship resolves one or
  more RepoLens evidence IDs;
- incomplete-stage status, sanitized diagnostics, and recovery actions.

Archify owns:

- its diagram schemas and supported enums;
- layout and presentation rules;
- schema and showcase-quality validation;
- deterministic HTML rendering and atomic delivery;
- artifact receipts, automated browser evidence, and visual-review contracts.

The RepoLens model remains authoritative when Archify is unavailable or fails.
Never weaken, omit, or rewrite repository facts merely to satisfy the display
schema.

## Deterministic stage execution

Run the Learning Workflow in this fixed order:

1. Architecture
2. Core Components
3. Main Runtime Flow
4. Technical Concepts
5. Technical English
6. Known / New / Can Skip
7. Applied Practice
8. Inspired Ideas

Do not reorder or silently omit a stage. Stage 5 remains present as `Skipped by
Profile` when Technical English is disabled. That intentional skip is complete.
For `BOTH`, complete the Usage Workflow first, retain its evidence, and then
start this sequence.

Use the confirmed Profile snapshot at every stage. It may change explanation
depth, learning priority, classification, practice scope, and idea relevance.
It must not change repository facts, evidence status, confidence, or diagram
topology.

Prioritize evidence in this order while accounting for staleness and directness:

1. source code and runtime or build configuration
2. tests that exercise the relevant behavior
3. maintained technical or deployment documentation
4. README guidance
5. package and repository metadata
6. explicitly labeled inference

Reuse evidence collected by earlier stages. Stop inspecting when the current
stage has enough high-quality evidence to satisfy its contract. For a large
repository, narrow scope to high-information sources, the selected core
components, and one primary runtime path, then record the uninspected scope.
Stop a trace at an unsupported link. Mark a stage incomplete when its required
result cannot be supported. Never extend analysis merely to fill a quota.

During analysis, conversation output is limited to the current workflow and
stage, meaningful scope changes, blockers, incomplete-stage reasons, and
recorded completion timestamps. Keep the detailed results for `report.md`.

## Stage 1: Architecture

Start with high-information sources instead of reading files uniformly:

1. top-level directories and workspace boundaries;
2. package, dependency, build, and workspace manifests;
3. application, CLI, worker, and library entry points;
4. maintained architecture and deployment documentation;
5. deployment, infrastructure, and runtime configuration;
6. tests that exercise system boundaries or primary integrations.

Describe the system boundary first: what runs inside the analyzed system, what
invokes it, and which external systems it calls or depends on. Then identify
only the major layers, services, packages, or subsystems needed to explain the
repository's primary behavior.

For every important component, entry point, external system, and relationship:

- attach one or more RepoLens evidence IDs;
- record `Observed` or `Inferred` and confidence;
- keep documentation/source conflicts visible;
- reject missing evidence IDs, dangling references, and unresolved
  relationship endpoints;
- stop at an unsupported link instead of inventing causality from naming or
  file proximity.

Prefer a compact model with one obvious primary path. Include secondary
relationships only when they explain orchestration, state, storage, security,
asynchronous work, or an external boundary. The Profile may change wording and
depth, but it must not change the system boundary or factual relationships.

After the RepoLens `ArchitectureModel` is valid, follow the availability and
delivery sequence below. An unavailable Archify installation preserves the
model and text as `archify-unavailable`. A rejected candidate returns
`validation-failed`. A non-zero deterministic delivery returns
`delivery-failed`. None of these states may reuse a stale HTML artifact or mark
the complete Learning Workflow successful.

## Stage 2: Core Components

Choose the small set of components that determine primary behavior. Importance
comes from evidence of one or more of these roles:

- participation in the primary runtime path;
- shared dependency or domain abstraction;
- orchestration or control flow;
- state, storage, caching, or messaging;
- external integration or security boundary;
- tests that define important behavior or contracts.

Do not rank by file count, directory size, naming prominence, or README mention
alone. Each selected component records its responsibility, why it matters, key
interfaces, dependencies, evidence IDs, `Observed` or `Inferred` status,
confidence, and key source files.

Assign every recommended source file to exactly one reading group:

- `Must Read`: necessary to understand the primary architecture or runtime
  behavior; keep this list deliberately small.
- `Worth Reading`: adds useful implementation depth after the Must Read path.
- `Reference Only`: useful for lookup, edge cases, configuration detail, or
  later maintenance, but not required for the first understanding pass.

Use the Profile to adjust which evidence-backed details deserve the user's
limited reading time. Never classify a source as low value merely because the
Profile is unfamiliar with its technology, and never promote a file without a
repository-specific reason.

## Stage 3: Main Runtime Flow

Choose one representative happy path that best explains the repository's
primary value. Start from a real trigger or entry point and stop at an
observable result.

Record the trigger, participants, ordered steps, final result, and the evidence
index used by the flow. Every step must contain participant, file, symbol,
input, action, output, next link, evidence IDs, and confidence. Record relevant
state or data changes, asynchronous boundaries, and external interactions.

Use contiguous one-based step order. Each non-final `next` link must name the
immediately following confirmed step. The final step uses `next: null` and must
produce the recorded final result. A dynamic dispatch or framework-controlled
link records its mechanism, explicit uncertainty, and evidence. If the next
link cannot be supported, stop the trace or mark the stage incomplete.

After `RuntimeFlowModel` validation, call `toArchifyRuntimeFlow(model)`. Use the
model's explicit `flowShape` to select `sequence`, `workflow`, or `dataflow`.
Preserve participants, ordered edges, state changes, external boundaries, and
confidence. Treat adapter diagnostics as `validation-failed`; never present a
candidate as a successful runtime diagram.

## Stage 4: Technical Concepts

Select only concepts required to understand the confirmed architecture or
runtime flow. Each concept contains exactly these learning fields:

- name
- Profile-appropriate plain-language explanation
- how this repository uses the concept

Do not produce a generic technology inventory or a detached tutorial. Omit a
concept when it does not improve understanding of the confirmed model.

## Stage 5: Technical English

Read the Profile before extracting expressions. When Technical English is
enabled, target 10–15 reusable engineering expressions found in allowed README,
documentation, configuration, error messages, or comments. Each item contains
the expression, its meaning in repository context, and how engineers use it.

Quality has priority over the target. If fewer than 10 items meet the quality
threshold, return only those items and record an explicit
`insufficientQualityNote`. Do not include long excerpts or ordinary vocabulary.

When the Profile disables this practice, emit `Skipped by Profile` with the
Profile reason. Mark the stage complete and continue to Stage 6.

## Stage 6: Known / New / Can Skip

Classify only learning-relevant components, concepts, mechanisms, and practices.
Use one of `Known`, `New`, `Can Skip`, or `Unclear` and explain the Profile basis
for each classification that changes the learning path.

- `Known` records only repository-specific twists worth noticing.
- `New` requires Profile support that the subject is unfamiliar, relevant, and
  worth learning.
- `Can Skip` requires a current low-ROI or irrelevant-detail reason.
- `Unclear` is used when the Profile cannot support another classification.

Ask the user about an `Unclear` subject only when the answer changes the
remaining workflow. Never promote an unsupported subject to `New` to create a
practice exercise.

## Stage 7: Applied Practice

Produce exactly one independently achievable practice. When Stage 6 contains a
defensible high-value `New` concept, set the type to `New Concept` and use that
classification. Include title, concept, why it fits, task, constraints, success
criteria, a Profile-based time estimate, and one to three hints.

When no defensible `New` concept exists, choose a relevant `Known` concept with
a repository-specific twist and set the type to `Reinforcement`. Do not revise
an otherwise valid `LEARN` route and do not invent novelty. Provide the brief
without implementing or executing it.

## Stage 8: Inspired Ideas

Preserve user-authored ideas with `source: User`. Generate zero to three
AI-authored ideas only when repository evidence supports something valuable,
and label each one `source: AI`. Every AI idea records the specific repository
mechanism, limitation, or workflow and its evidence IDs.

Each idea contains title, inspiration, short description, preliminary Profile
fit, unknowns, and whether it is ready for the optional `evaluate-idea`
handoff. Zero AI ideas is a complete valid result. Preserve ideas in the current
Learning Report and immediate handoff only.

After Stage 8, offer the user an immediate optional handoff for one selected
idea. Invoke `evaluate-idea` only when the user selects an idea or asks for the
evaluation.

## Artifact-first delivery

After the eight stages reach valid complete or explicit incomplete states,
render the full report from the validated structured bundle. Replace the
template's diagram markers with relative links only for diagrams that completed
validation and delivery. Save `architecture.html` and `runtime-flow.html` as
sibling artifacts when their corresponding result is validated.

Use the host-provided plugin data area as the default destination. Never derive
the destination from the analyzed repository path. A destination inside the
repository is allowed only when the user explicitly selected it.

Publish every file through a temporary sibling followed by rename. Publish
`report.md` after the available diagram files so the canonical report never
points to artifacts that have not completed publishing.

After a successful save, return only the route and final workflow status, three
to five key findings, incomplete or degraded stages, links to `report.md` and
validated diagrams, and the smallest relevant next action. Do not duplicate the
complete report in the conversation by default.

If saving fails, keep the validated `LearningArtifactBundle` in the current run.
Return `analysisStatus`, `artifactStatus: incomplete`, the intended destination,
sanitized diagnostics, and one `retry-save` action. A retry passes the same
bundle to `saveLearningArtifacts` with a valid destination and does not rerun
repository analysis. If current-run state is gone, state that recovery is no
longer available and offer regeneration. Never claim cross-conversation
recovery.

## Architecture adapter boundary

`toArchifyArchitecture(model)` creates a new architecture candidate for every
attempt. It never treats a previous candidate or HTML artifact as the current
result.

For the verified Archify v2.17 architecture contract, the candidate uses:

- `schema_version: 1`;
- `diagram_type: "architecture"`;
- a non-empty `meta.title` and `meta.quality_profile: "showcase"`;
- `meta.locale: "en" | "zh-CN"` when the authored language is supported;
- only the supported component types: `frontend`, `backend`, `database`,
  `cloud`, `security`, `messagebus`, and `external`;
- stable IDs matching `^[a-zA-Z][a-zA-Z0-9_-]*$`;
- connections whose `from` and `to` IDs resolve to emitted components;
- `meta.repository` and `components[].sources` only when the repository origin,
  full 40-character revision, relative paths, and optional line ranges can be
  verified against the analyzed commit.

Archify architecture connections do not expose a source or evidence field.
Evidence for important relationships therefore stays in the RepoLens
`ArchitectureModel` and Learning Report. The adapter may emit a relationship
only after its RepoLens evidence IDs resolve; it must not invent an Archify
field to carry those IDs.

Keep factual fields independent from display-only choices such as coordinates,
routes, label offsets, cards, views, and visual presets. Start with automatic
routing, sparse labels, and at most 12 primary nodes. Use an Archify example
only for field shape; never copy its facts, IDs, or geometry.

## Validation and delivery sequence

The end-to-end order is:

1. Complete Repository Router without using Archify availability as a routing
   factor.
2. For `LEARN`, or when `BOTH` reaches its Learning portion, run the
   authoritative Archify capability check immediately before Stage 1 and retain
   the result for the current workflow.
3. Analyze allowed repository evidence and validate the RepoLens
   `ArchitectureModel`, regardless of Archify availability.
4. If Archify is unavailable, preserve the model and text, return
   `archify-unavailable`, and stop the visualization branch.
5. If Archify is available, continue through adaptation, validation, and
   delivery below.

For the available branch:

1. Produce a fresh typed Archify candidate and write it to a candidate JSON
   file before inspecting renderer internals or planning geometry fixes.
2. Validate after every candidate edit and immediately before delivery:

   ```text
   node bin/archify.mjs validate architecture <candidate.json> --quality showcase --json
   ```

3. Accept showcase validation only when all nine artifact checks pass with zero
   composition errors and zero warnings. On failure, return
   `validation-failed`, preserve the RepoLens model and sanitized diagnostics,
   and do not run delivery immediately. Enter the bounded diagnostic repair
   loop below.
4. Freeze the passing candidate and deliver those exact specification bytes:

   ```text
   node bin/archify.mjs deliver architecture <candidate.json> <output.html> --quality showcase --json
   ```

5. Only exit zero for the frozen candidate produces `validated`. A non-zero
   exit produces `delivery-failed`, preserves the RepoLens model and sanitized
   diagnostics, and must not be presented as successful.
6. A failed delivery may leave a previous trusted artifact at the output path.
   Do not run `visual-check` on that path or present it as the current result.
7. After successful delivery only, run `visual-check` against the delivered
   HTML when browser evidence is required. Keep deterministic delivery,
   automated browser evidence, and perceptual visual review as separate claims.

Every failure returns the smallest safe recovery action. A retry creates and
validates a fresh candidate; it never promotes stale HTML.

### Diagnostic repair loop

When Archify validation fails:

1. Record the current objective error count and the best count reached in this
   candidate attempt.
2. Select one diagnostic and change only its exact `subject`. Verify the
   diagnostic's measured `evidence` and choose from `supportedFixes` when
   present.
3. Apply at most one diagnosed geometry control in that repair round. Do not
   delete semantic relationship labels or alter RepoLens facts to make layout
   pass.
4. Run the full showcase `validate` command again after every candidate edit.
5. Continue while the objective error count reaches a new minimum. If two
   consecutive repair rounds do not improve the best count, stop and return
   `validation-failed` with sanitized diagnostics and a recovery action.
6. A passing validation freezes the exact candidate bytes. Never edit the
   frozen candidate; run `deliver` only for that validated revision.

If visual review requires a candidate change after delivery, the changed
candidate is a new revision and must pass the full validation sequence again
before another delivery. Never use successful validation or delivery receipts
from an earlier revision.

## Diagram result statuses

- `archify-unavailable`: the installed package, documented CLI, or health check
  is unavailable; no candidate is delivered.
- `validation-failed`: the fresh candidate does not pass required Archify
  schema/showcase validation; delivery is not attempted.
- `delivery-failed`: validation passed, but deterministic delivery for the
  frozen candidate exited non-zero; any last-good artifact remains stale.
- `validated`: validation and deterministic delivery both succeeded for the
  same frozen specification bytes.

## Verified sources

- installed Archify `SKILL.md`, version 2.17;
- `schemas/architecture.schema.json`;
- `schemas/common.schema.json`;
- `examples/web-app.architecture.json`;
- `references/authoring-contract.md`;
- `references/delivery-contract.md`.
