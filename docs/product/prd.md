# RepoLens V0.1 Product Requirements Document

**Date:** 2026-11-02  
**Status:** Approved product baseline  
**Product:** RepoLens  
**Use Cases:** `docs/product/use-cases.md`  
**Technical Design:** `docs/superpowers/specs/2026-10-30-repolens-v0.1-design.md`  

## 1. Executive Summary

RepoLens is an opinionated Codex plugin for systematically understanding unfamiliar software repositories and evaluating project ideas inspired by them.

The product begins after a user has already selected a repository. It first decides whether the repository is worth learning from, useful as a tool, valuable for both purposes, or currently low value. It then runs a consistent, Profile-aware workflow instead of producing a generic repository summary.

RepoLens is designed around one real junior software engineer's workflow, while remaining reusable by other people through an editable personal Profile. V0.1 must be useful as a daily learning tool and must also serve as a practical project through which its author learns product requirements, Codex plugin composition, skill design, personalization, evidence-grounded AI workflows, and eval-driven development.

## 2. Problem Statement

Software engineers frequently discover interesting repositories but lack a repeatable way to decide:

- whether a repository is worth studying or merely worth using;
- which parts of a large codebase matter most;
- how the major components work together;
- which real end-to-end runtime path represents the project's value;
- which concepts are new and relevant to their current goals;
- which implementation details have low learning return;
- whether an idea inspired by the repository is worth pursuing.

Generic AI repository summaries do not reliably solve this problem. They often restate the README, treat every file as equally important, produce inconsistent structures, ignore the learner's existing knowledge, or make unsupported claims about architecture and runtime behavior.

The result is wasted reading time, shallow understanding, duplicated learning, and poorly evaluated project ideas.

## 3. Product Vision

RepoLens should turn this informal workflow:

```text
Find an interesting repository
→ browse files without a clear path
→ ask scattered questions
→ maybe get an idea
→ decide emotionally whether to build it
```

into this repeatable loop:

```text
Select repository
→ route to LEARN / USE / BOTH / SKIP
→ understand or adopt it through a fixed workflow
→ convert learning into a small practice
→ preserve evidence-grounded ideas
→ evaluate whether an idea deserves investment
```

## 4. Target Users

### 4.1 Primary user: Growth-oriented software engineer

The primary user studies real open-source projects to improve engineering judgment and practical knowledge. The initial experience is calibrated for a junior software engineer who:

- can read code but may become lost in large repositories;
- wants architecture and runtime behavior before implementation detail;
- values Technical English as part of engineering development;
- wants to distinguish high-value learning from low-return detail;
- is building a portfolio and choosing projects carefully;
- benefits from a repeatable process rather than an unstructured conversation.

### 4.2 Secondary user: Experienced engineer with different priorities

Another engineer can replace or edit the Profile to change known technologies, goals, explanation depth, available time, and Technical English preferences. The methodology remains the same while prioritization and teaching adapt.

### 4.3 Developer user: RepoLens maintainer

The maintainer needs a small regression suite that checks whether changes to skills and prompts preserve factual and structural quality across representative repositories.

## 5. Jobs to Be Done

When I select an unfamiliar repository, I want RepoLens to identify whether learning it or using it is valuable for me, so I do not spend hours on the wrong project.

When a repository is worth learning, I want a guided path through its architecture, core components, and one real runtime flow, so I can understand the system without reading every file.

When I already know a concept, I want RepoLens to avoid reteaching it and focus on repository-specific differences, so my learning time goes toward genuinely new or useful material.

When a repository is better used than studied, I want a concise adoption recommendation and safe first step, so I can benefit from it without unnecessary code analysis.

When a repository inspires an idea, I want a consistent evidence-aware evaluation, so I can distinguish exciting ideas from projects that fit my goals and current capacity.

## 6. Product Principles

1. **Route before deep analysis.** Decide the purpose of further work before spending substantial time on it.
2. **Architecture and runtime before details.** The system shape and primary behavior matter more than exhaustive file explanation.
3. **Evidence before confidence.** Missing links remain missing; plausible guesses are not facts.
4. **Personalization without factual drift.** The Profile changes teaching and recommendations, not repository truth.
5. **Learning ROI over completeness.** RepoLens should deliberately skip low-value implementation detail.
6. **Use before learning when both matter.** `BOTH` always starts with the practical Usage Workflow.
7. **No forced content.** Quotas never justify weak Technical English items, invented New concepts, or low-value inspired ideas.
8. **Transparent incompleteness.** Degraded and partial outcomes remain useful but are never presented as complete.
9. **Local ownership and privacy.** Profiles, reports, diagrams, and developer credentials stay under the user's or developer's control.
10. **Methodology first, infrastructure second.** V0.1 adds no backend, MCP server, hook, or interface without a demonstrated requirement.

## 7. Goals and Success Outcomes

### 7.1 Product goals

- Make repository learning repeatable rather than conversationally improvised.
- Produce evidence-backed architecture and primary runtime-flow understanding.
- Personalize explanations and priorities from an explicit local Profile.
- Support the distinct outcomes of learning a repository and adopting it as a tool.
- Turn learning into one appropriately scoped exercise.
- Evaluate project ideas with a stable, transparent rubric.
- Provide durable Learning Reports and reopenable diagrams.
- Detect methodology regressions through five representative fixture repositories.

### 7.2 Project learning goals

The author should gain practical experience with:

- requirements and use-case analysis;
- PRD, technical design, and implementation-plan separation;
- current Codex plugin and skill composition;
- TypeScript for small deterministic tooling;
- structured model outputs and schema validation;
- repository safety and evidence traceability;
- integration with an external skill;
- property-based AI workflow evaluation rather than exact prose snapshots.

### 7.3 V0.1 success outcome

After installing RepoLens and creating a Profile, a user can provide a selected local repository or GitHub URL, receive a justified `LEARN`, `USE`, `BOTH`, or `SKIP` route, complete the selected workflow, reopen the resulting Learning Report and diagrams, and evaluate an independent or inspired idea through the agreed rubric.

## 8. Non-goals

V0.1 does not include:

- GitHub Trending discovery, ranking, or recommendation;
- a custom GitHub MCP server;
- GitHub credential or OAuth management;
- automatic installation or execution of third-party repositories;
- automatic execution of Applied Practice;
- automatic creation of evaluated projects;
- a web dashboard, cloud backend, database, account system, or profile sync;
- a persistent cross-run idea library;
- a compiler-grade dependency graph;
- complete support for every language, framework, monorepo, or repository size;
- public plugin-directory publication as a release requirement;
- an OpenAI API key requirement for normal plugin users;
- a multi-model evaluation platform or second model grader.

## 9. V0.1 Scope

### 9.1 In scope

- Local plugin installation and discovery in Codex desktop on macOS.
- First-use Profile creation, validation, confirmation, storage, review, and update.
- Repository input from the current workspace, local path, or GitHub URL.
- Repository routing to `LEARN`, `USE`, `BOTH`, `SKIP`, or temporary `NEEDS_EVIDENCE`.
- The eight-stage Learning Workflow.
- The four-step Usage Workflow.
- Architecture and Runtime Flow visualization through Archify.
- Independent and inspired idea evaluation.
- Durable Learning Report Markdown and validated diagram HTML artifacts.
- Optional saving of an Idea Evaluation when explicitly requested.
- Explicit TypeScript, Python, and Java fixture coverage.
- Five-fixture developer model regression testing with a developer-owned API key.

### 9.2 Best-effort scope

- Codex CLI compatibility.
- Repositories whose primary language is not TypeScript, Python, or Java.
- Mixed-language and unusually large repositories.
- Private repositories accessible through the user's existing Git, SSH, GitHub CLI, or connected GitHub authorization.

### 9.3 Out of scope boundary

Repository discovery ends before RepoLens begins. Installation guidance ends before third-party code is executed. Idea evaluation ends before a new project is created.

## 10. Core User Journeys

### 10.1 First repository journey

```text
Invoke learn-project with repository
→ Profile missing
→ create and confirm Profile
→ resume original repository request
→ inspect lightweight evidence
→ choose route
→ complete selected workflow
→ deliver result and durable artifacts
```

### 10.2 Returning user journey

```text
Invoke learn-project with repository
→ load valid Profile
→ route repository
→ complete selected workflow
→ optionally hand inspired idea to evaluate-idea
```

### 10.3 Independent idea journey

```text
Invoke evaluate-idea with idea
→ load valid Profile
→ clarify missing essentials
→ examine existing solutions where possible
→ apply six-dimension rubric
→ recommend BUILD / PROTOTYPE / SAVE / SKIP
→ optionally save evaluation when requested
```

## 11. Functional Requirements

### 11.1 Profile and onboarding

**FR-PROFILE-001 — Profile gate**  
`learn-project` and `evaluate-idea` must require a valid Profile before personalized work begins.

**FR-PROFILE-002 — First-use interruption and resume**  
When the Profile is missing, RepoLens must pause the requested workflow, complete onboarding, and resume the original request with its inputs preserved. If host limitations prevent automatic continuation, RepoLens must provide one explicit continuation action.

**FR-PROFILE-003 — Required Profile information**  
The Profile must cover experience, known languages/frameworks/concepts, learning goals, interests, career or portfolio goals, available time, explanation language and depth, Technical English preference, and optional context.

**FR-PROFILE-004 — Review before persistence**  
RepoLens must show a generated or revised Profile and require confirmation before saving it.

**FR-PROFILE-005 — Editable and reusable**  
Any user must be able to replace or edit the Profile without modifying plugin source.

**FR-PROFILE-006 — Per-run override**  
A user may temporarily override Profile behavior for one run. RepoLens must not persist the override without confirmation.

**FR-PROFILE-007 — No credentials**  
RepoLens must reject API keys, tokens, passwords, and other credentials from Profile data.

### 11.2 Environment awareness

**FR-ENV-001 — Capability check**  
Onboarding must report availability of local filesystem access, Git, optional GitHub CLI or connection, and Archify.

**FR-ENV-002 — Conditional requirements**  
A local repository must not require GitHub access. A GitHub URL requiring deep analysis must report Git or access problems clearly. Complete Learning output must require Archify. When Archify is unavailable, RepoLens must preserve available text and analysis models, mark the Learning Workflow incomplete, and provide the verified official Archify installation source and steps when available. RepoLens must not install or update Archify automatically and must not invent installation guidance when an official source cannot be verified.

### 11.3 Repository input and routing

**FR-REPO-001 — Supported inputs**  
RepoLens must accept the current workspace, a local repository path, or a GitHub repository URL.

**FR-REPO-002 — Analyzed identity**  
Every repository result must identify the repository and analyzed revision.

**FR-REPO-003 — Read-only behavior**  
RepoLens must not modify, delete, build, test, install dependencies for, or execute a user-provided repository.

**FR-ROUTE-001 — Route set**  
The Router must select `LEARN`, `USE`, `BOTH`, or `SKIP`, with `NEEDS_EVIDENCE` as an intermediate state rather than a final value judgment.

**FR-ROUTE-002 — Route factors**  
The Router must address learning relevance, novelty, learning cost, practical workflow fit, maturity, maintenance, compatibility, and meaningful alternatives.

**FR-ROUTE-003 — Explainable route**  
The route must include confidence, concise reasons, Profile fit, evidence, and the next workflow.

**FR-ROUTE-004 — No popularity shortcut**  
Popularity or codebase complexity alone must not determine value.

**FR-ROUTE-005 — Insufficient evidence**  
When evidence is insufficient, RepoLens must state what is missing and attempt a valid recovery before choosing a final route.

### 11.4 Learning Workflow

**FR-LEARN-001 — Fixed stage order**  
The Learning Workflow must contain the following ordered stages:

1. Architecture;
2. Core Components;
3. Main Runtime Flow;
4. Technical Concepts;
5. Technical English;
6. Known / New / Can Skip;
7. Applied Practice;
8. Inspired Ideas.

**FR-LEARN-002 — Architecture**  
Architecture output must explain the system boundary, major subsystems, entry points, external systems, and key relationships, with evidence and a validated Architecture Diagram.

**FR-LEARN-003 — Core Components**  
RepoLens must identify only the small number of components that determine primary behavior and classify recommended sources as `Must Read`, `Worth Reading`, or `Reference Only`.

**FR-LEARN-004 — Main Runtime Flow**  
RepoLens must trace one representative end-to-end happy path from a real trigger to an observable result. Unsupported links must be marked or stop the trace rather than being invented.

**FR-LEARN-005 — Runtime Flow Diagram**  
The confirmed runtime model must produce a validated sequence, workflow, or data-flow diagram appropriate to the flow.

**FR-LEARN-006 — Technical Concepts**  
Each selected concept must contain only its name, a Profile-appropriate plain-language explanation, and how the repository uses it.

**FR-LEARN-007 — Technical English**  
When enabled, RepoLens should target 10–15 valuable expressions from real repository material and may return fewer when quality is insufficient. When disabled, the stage must remain visible as `Skipped by Profile` and the workflow must still count as complete.

**FR-LEARN-008 — Learning classification**  
RepoLens must classify learning-relevant findings as `Known`, `New`, `Can Skip`, or `Unclear`, using the Profile and explaining classifications that affect the learning path.

**FR-LEARN-009 — Applied Practice**  
RepoLens must produce one small, independently achievable practice. It should use a high-value `New` concept; when none exists, it must use a repository-specific `Known` twist and label the result `Reinforcement` rather than inventing novelty.

**FR-LEARN-010 — Inspired Ideas**  
RepoLens must preserve user ideas separately from zero to three AI-inspired ideas. Every AI idea must be grounded in a repository mechanism, limitation, or workflow. Zero is valid.

**FR-LEARN-011 — Profile adaptation**  
The Profile may change depth, prioritization, classification, practice, and ideas, but must not change repository facts.

### 11.5 Usage Workflow

**FR-USE-001 — Fixed Usage sections**  
The Usage Workflow must contain:

1. What It Does & Personal Fit;
2. Requirements & Risks;
3. Quick Start;
4. Recommendation.

**FR-USE-002 — Guidance only**  
Quick Start must provide official installation guidance, minimal configuration, first useful task, expected result, and verification without automatically installing or executing the project.

**FR-USE-003 — Recommendation set**  
The final Usage recommendation must be `USE NOW`, `SAVE FOR LATER`, or `SKIP`, with a concise reason, smallest next step, and largest risk.

**FR-BOTH-001 — Workflow order**  
`BOTH` must run Usage before Learning and reuse evidence where appropriate. A negative adoption recommendation must not cancel a still-valuable Learning Workflow.

### 11.6 Idea Evaluation

**FR-IDEA-001 — Supported origins**  
RepoLens must evaluate both ideas handed off from a Learning Report and independently entered ideas while preserving their origin.

**FR-IDEA-002 — Minimum clarification**  
Problem, Target User, and Proposed Solution must be clear enough to evaluate. Otherwise RepoLens must return an incomplete clarification result rather than force a decision.

**FR-IDEA-003 — Existing solutions**  
RepoLens must identify comparable solutions when reliable research is available and mark unavailable evidence as unknown.

**FR-IDEA-004 — External research consent**  
Before sending an idea description to an external research or search capability, RepoLens must disclose that external lookup, explain that necessary idea details will leave the local conversation context, and obtain explicit user consent. If the user declines, evaluation must continue without external lookup and affected Existing Solutions or Novelty evidence must be marked `Unknown`.

**FR-IDEA-005 — Rubric dimensions**  
Every complete evaluation must address Novelty, Learning ROI, Portfolio Value, Goal Alignment, Feasibility, and Skill Fit.

**FR-IDEA-006 — Dimension explanation**  
Each dimension must contain a 1–5 score or `Unknown`, Reason, Evidence, and Confidence. `Unknown` must include a concrete verification need.

**FR-IDEA-007 — Decision set**  
The final decision must be `BUILD`, `PROTOTYPE`, `SAVE`, or `SKIP`, supported by the rubric rather than a simple average.

**FR-IDEA-008 — Unknown boundary**  
RepoLens must not issue `BUILD` while a critical dimension is `Unknown`. A cheaply testable critical unknown should normally lead to `PROTOTYPE`; missing evidence, timing, or capacity may lead to `SAVE`; sufficient negative evidence may justify `SKIP` despite non-critical unknowns.

A `critical` unknown is contextual: it is any missing fact that could reasonably change the final decision for the current idea. RepoLens must name every critical unknown, explain why it could change the decision, and state how to verify it. `BUILD` additionally requires both Goal Alignment and Feasibility to be known and no other decision-changing unknown to remain.

**FR-IDEA-009 — Actionable result**  
A complete evaluation must identify the largest unknown, smallest useful scope, and next action.

### 11.7 Artifacts and persistence

**FR-ARTIFACT-001 — Durable Learning Report**  
A completed Learning Workflow must save a local Markdown report that the user can reopen after the conversation.

**FR-ARTIFACT-002 — Durable diagrams**  
Validated Architecture and Runtime Flow diagrams must be saved as local HTML artifacts and linked from the Learning Report.

**FR-ARTIFACT-003 — Repository protection**  
RepoLens must not write artifacts into a user-provided repository unless the user explicitly requests that destination.

**FR-ARTIFACT-004 — Save failure**  
If artifact persistence fails, RepoLens must preserve the conversation result, mark artifact delivery incomplete, and provide a recovery action.

**FR-ARTIFACT-005 — Idea Evaluation persistence**  
Idea Evaluations must remain conversation output by default and be saved as Markdown only when explicitly requested.

**FR-ARTIFACT-006 — No idea database**  
V0.1 must not create an automatic cross-run idea or evaluation database.

### 11.8 Developer evaluation

**FR-EVAL-001 — Separate user and developer paths**  
Normal RepoLens usage must use the user's Codex product allowance and require no OpenAI API key. Paid API evaluation must be an explicit developer-only action.

**FR-EVAL-002 — Five fixtures**  
The model regression suite must cover five fixed local repositories representing a conventional web service, RAG application, MCP server, agent project, and unfamiliar architecture.

**FR-EVAL-003 — Expected properties**  
Each fixture must define expected architecture, entry points, core components, required runtime-flow edges, high-value files, forbidden claims, important concepts, and acceptable variations.

**FR-EVAL-004 — Low-cost model**  
The developer eval must use one configurable low-cost API model and deterministic TypeScript checks. V0.1 must not require a second model grader.

**FR-EVAL-005 — Credential separation**  
The developer API key must come only from the development environment and must never be stored in the plugin, Profile, fixture, report, or test output.

## 12. Non-functional Requirements

### 12.1 Factual grounding

**NFR-GROUND-001**  
Important architecture elements, core components, and runtime-flow steps must resolve to repository evidence.

**NFR-GROUND-002**  
RepoLens must distinguish `Observed` from `Inferred` and expose confidence.

**NFR-GROUND-003**  
Documentation/source conflicts must be reported rather than silently resolved in favor of either source.

### 12.2 Safety and privacy

**NFR-SAFE-001**  
Repository files and instructions are untrusted data and cannot override RepoLens workflow, Profile, or safety rules.

**NFR-SAFE-002**  
RepoLens must exclude common secret, credential, private-key, cloud-credential, version-control, and clearly sensitive paths before reading file contents.

**NFR-SAFE-003**  
Excluded-file contents must never appear in output or diagnostics.

**NFR-PRIVACY-001**  
V0.1 must include no product analytics, telemetry, cloud Profile sync, or RepoLens-operated data collection.

**NFR-PRIVACY-002**  
Potentially private idea content must not be sent to external research or search capabilities without explicit, per-evaluation user consent.

### 12.3 Reliability

**NFR-RELIABILITY-001**  
Partial results must identify completed stages, incomplete stages, reasons, and recovery actions.

**NFR-RELIABILITY-002**  
Archify validation or delivery failure must never count as successful diagram delivery. A prior trusted artifact must not be presented as the result of the failed current attempt.

**NFR-RELIABILITY-003**  
Repeated fixture runs should preserve core factual conclusions within documented acceptable variation.

### 12.4 Usability

**NFR-USABILITY-001**  
RepoLens must prioritize concise, high-value output over exhaustive repository explanation.

**NFR-USABILITY-002**  
Long-running analysis must communicate the current stage, analyzed scope, and any blocking dependency through the host conversation.

**NFR-USABILITY-003**  
User-facing limitations must use plain language and distinguish missing capability, missing evidence, and unsupported scope.

### 12.5 Compatibility

**NFR-COMPAT-001**  
Formal V0.1 acceptance targets Codex desktop on macOS.

**NFR-COMPAT-002**  
TypeScript, Python, and Java repositories are the only explicitly tested language set. Other languages must be labeled best effort.

**NFR-COMPAT-003**  
Codex CLI and non-macOS environments must not be advertised as fully supported until separately tested.

## 13. Degraded and Error States

| Condition | Required product behavior |
|---|---|
| Missing Profile | Pause, complete onboarding, then resume or provide one explicit continuation action |
| Invalid repository input | Identify whether path, URL, access, or repository validity failed |
| Private access denied | Point to existing authorization options; never request a pasted token |
| Insufficient repository evidence | Return `NEEDS_EVIDENCE`, missing information, attempted recovery, and next action |
| Unsupported primary language | Label the result best effort and avoid complete-coverage claims |
| Very large repository | Narrow scope deliberately and disclose what was and was not analyzed |
| Source/documentation conflict | Show both claims and confidence |
| Archify unavailable | Preserve text/model output, mark Learning incomplete, and provide verified official installation source and steps when available without automatic installation |
| Archify validation failure | Preserve model and diagnostics; deliver no failed or stale diagram |
| Archify delivery failure | Preserve model and diagnostics; mark delivery failed and do not present a prior trusted artifact as the current result |
| External idea research unavailable | Use `Unknown` with verification need rather than fabricate market facts |
| User declines external idea research | Continue locally; mark affected Existing Solutions or Novelty evidence `Unknown` |
| Artifact save failure | Preserve conversation output and mark artifact delivery incomplete |
| Developer API key missing | Stop only the paid eval command; normal plugin usage remains unaffected |

## 14. Success Metrics and Quality Gates

V0.1 is a local product without telemetry, so success is measured through acceptance evidence rather than usage analytics.

### 14.1 Required automated gates

- All deterministic structure, Profile, safety, repository lifecycle, contract, and artifact tests pass.
- All five fixtures resolve their declared high-value files and evidence paths.
- All five paid model-eval fixtures pass required semantic properties.
- No fixture output contains a forbidden or unsupported critical claim.
- Every required runtime-flow edge maps to real fixture evidence.
- Changing the Profile changes personalization while preserving repository facts.
- Missing evidence produces `Unknown`, `Unclear`, `NEEDS_EVIDENCE`, or incomplete status as appropriate.

### 14.2 Required manual acceptance

A manual macOS Codex desktop run must demonstrate:

- local plugin discovery;
- first-use Profile creation and resume;
- local repository input;
- GitHub URL input;
- all four final routes across controlled scenarios;
- a complete Learning Workflow with both validated diagrams;
- degraded Learning output without Archify;
- a complete Usage Workflow;
- inspired and independent Idea Evaluations;
- explicit consent before an idea is sent to external research, plus a successful no-search evaluation after consent is declined;
- durable report and diagram reopening;
- confirmation that ordinary users are never asked for an OpenAI API key.

### 14.3 Human quality review

For each representative fixture, a human reviewer must confirm:

- architecture and runtime flow are factually credible;
- recommended source files are genuinely high value;
- the report is concise enough to guide reading rather than replace the repository;
- personalization is material rather than cosmetic;
- Applied Practice is achievable and relevant;
- route and idea decisions are understandable and defensible.

### 14.4 Performance baseline

V0.1 has no hard universal time SLA because repository size, model latency, local filesystem speed, and Archify availability vary. The eval and manual-acceptance runs must record total duration and stage-level duration to establish a baseline. The product must show stage progress during long-running work rather than remain silent.

## 15. Dependencies and Assumptions

- Users already have access to Codex and consume their own Codex product allowance.
- Local filesystem access is available.
- Git is available when a GitHub URL requires a local working copy.
- Private repository access, when needed, is already configured outside RepoLens.
- Archify is installed and available for complete Learning output.
- External research availability may vary and must not be assumed.
- Developer model evals have a separately supplied API key and incur separate API usage.
- The official plugin format and host behavior may evolve and must be rechecked before implementation.

## 16. Risks and Mitigations

| Risk | Impact | V0.1 mitigation |
|---|---|---|
| Model invents architecture or runtime links | Misleading learning | Evidence references, Observed/Inferred status, fixture forbidden claims |
| Large repository overwhelms context | Shallow or inconsistent analysis | Progressive scope, high-information files, one primary flow, disclosed limits |
| Personalization changes facts | Loss of trust | Facts validated independently from Profile-sensitive recommendations |
| Archify dependency is missing or changes | Incomplete diagrams | Availability check, degraded mode, validation diagnostics, manual acceptance |
| Profile becomes too personal or contains secrets | Privacy risk | Minimal fields, local storage, explicit credential rejection |
| Model evals become expensive | Development cost | Five small fixtures, one configurable low-cost model, no second model grader |
| Plugin format changes before implementation | Installation failure | Revalidate official contracts on Day 1 |
| PRD and existing design diverge | Wrong implementation | Requirement traceability review before updating the implementation plan |

## 17. Release Criteria

RepoLens V0.1 is ready for local release when:

1. All Must functional requirements are implemented or explicitly waived through a PRD revision.
2. Required automated gates pass.
3. The five-fixture paid model regression suite passes with documented results.
4. The macOS Codex desktop manual acceptance checklist passes.
5. A new user can create a Profile and complete at least one repository workflow without developer assistance.
6. A Learning Report and both diagram artifacts can be reopened after the originating conversation.
7. Safety review confirms that repository secrets and developer API credentials are not exposed.
8. README documents supported inputs, tested languages, dependencies, degraded behavior, artifact storage, and the separation between user operation and developer eval credentials.

Public marketplace publication is a later release decision and is not required for V0.1.

## 18. Requirement Traceability

| Use case | Primary requirements |
|---|---|
| UC-00 Install and enable | NFR-COMPAT-001, release criteria 4–5 |
| UC-01 Create Profile | FR-PROFILE-001 through FR-PROFILE-004, FR-ENV-001 |
| UC-02 Review/update Profile | FR-PROFILE-005 through FR-PROFILE-007 |
| UC-03 Submit repository and route | FR-REPO-001 through FR-REPO-003, FR-ROUTE-001 through FR-ROUTE-005 |
| UC-04 Learning Workflow | FR-LEARN-001 through FR-LEARN-011, FR-ARTIFACT-001 through FR-ARTIFACT-004 |
| UC-05 Usage Workflow | FR-USE-001 through FR-USE-003 |
| UC-06 BOTH | FR-BOTH-001 |
| UC-07 Inspired Idea | FR-IDEA-001 through FR-IDEA-009 |
| UC-08 Independent Idea | FR-IDEA-001 through FR-IDEA-009 |
| UC-09 Degraded Archify | NFR-RELIABILITY-001 through NFR-RELIABILITY-002 |
| UC-10 Developer model eval | FR-EVAL-001 through FR-EVAL-005 |

## 19. Relationship to Technical Design

This PRD owns product intent, scope, observable behavior, and success conditions. The Technical Design owns implementation choices such as:

- plugin and skill file layout;
- manifest details;
- Profile serialization and storage path;
- repository acquisition and cleanup mechanics;
- TypeScript schemas and helper interfaces;
- Archify model adapters;
- test-runner structure and commands.

If the Technical Design or Implementation Plan cannot satisfy a requirement without materially changing product scope, the PRD must be revised explicitly rather than silently weakened.

## 20. Approved Product Decisions

The following decisions were approved for V0.1 based on the Use Cases and PRD review:

1. V0.1 remains a local release; public marketplace publication is not required.
2. V0.1 has no hard analysis-time SLA. It records timing baselines and must communicate stage progress.
3. Unsupported languages are visibly labeled best effort near the beginning of the result.
4. Product success uses acceptance and fixture quality gates rather than telemetry or adoption analytics.
5. All functional requirements in this document are treated as Must for V0.1 unless the PRD is revised before implementation.
6. External idea research requires explicit per-evaluation consent; declining research does not block the remaining local evaluation.
7. Critical unknowns are contextual and must be named and explained. `BUILD` requires known Goal Alignment and Feasibility plus no remaining decision-changing unknown.
