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
