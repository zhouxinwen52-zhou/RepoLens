# RepoLens V0.1 Use Cases

**Date:** 2026-11-02  
**Status:** Approved for PRD drafting  
**Product:** RepoLens  

## 1. Purpose

This document describes how people use RepoLens V0.1 and what outcome they expect from each interaction. It intentionally focuses on user goals and observable behavior.

It does not decide how RepoLens is implemented. Plugin packaging, TypeScript helpers, Git clone mechanics, schemas, Archify adapters, and test architecture belong in the Technical Design.

These use cases will become the input for the PRD. After they are approved, the PRD will convert them into functional requirements, non-functional requirements, scope, success criteria, and release acceptance criteria.

## 2. Actors

### Primary actor: Repository Learner

A software engineer who has selected an unfamiliar repository and wants to decide whether to learn from it, use it, do both, or skip it. The initial experience is optimized for a junior engineer but adapts to other users through an editable Profile.

### Primary actor: Idea Evaluator

A user who wants to decide whether a project idea is worth building, prototyping, saving, or skipping. The idea may come from a RepoLens learning report or may be entered independently.

### Supporting actor: Codex

The host in which users invoke RepoLens. Codex supplies the model capability and the user's existing product usage allowance.

### Supporting actor: Archify

The companion skill that turns evidence-backed architecture and runtime-flow models into validated visual artifacts.

### Secondary actor: RepoLens Developer

The person maintaining RepoLens and running the five-fixture model regression suite with a developer-owned OpenAI API key.

## 3. System Boundary

RepoLens V0.1 begins after a user has selected a repository or has an idea to evaluate.

RepoLens does:

- create and use a personal learning Profile;
- accept a local repository or GitHub repository URL;
- route a repository to `LEARN`, `USE`, `BOTH`, or `SKIP`;
- produce the selected learning or usage workflow;
- generate evidence-backed architecture and runtime-flow visualizations through Archify;
- evaluate ideas with a stable rubric;
- report uncertainty, missing evidence, and degraded states.

RepoLens does not:

- discover or rank GitHub Trending repositories;
- install or run third-party repositories automatically;
- build the Applied Practice or evaluated project automatically;
- require an OpenAI API key from ordinary plugin users;
- operate a custom backend, account system, or persistent idea database.

## 4. Use Case Map

```text
UC-00 Install and enable RepoLens
        ↓
UC-01 Create Profile on first use
        ↓
UC-03 Submit repository and choose route
        ├── LEARN → UC-04 Complete Learning Workflow
        ├── USE   → UC-05 Complete Usage Workflow
        ├── BOTH  → UC-06 Complete Usage and Learning Workflows
        └── SKIP  → recommendation and stop

UC-02 Review or update Profile ───────────────┐
                                              ├── affects personalization
UC-07 Evaluate an inspired idea ← UC-04 ─────┤
UC-08 Evaluate an independent idea ──────────┘

UC-09 Continue without Archify in degraded mode

Developer-only:
UC-10 Run the five-fixture model regression suite
```

## 5. Use Case Summary

| ID | Use case | Primary actor | Priority | Successful outcome |
|---|---|---|---|---|
| UC-00 | Install and enable RepoLens | Repository Learner | Must | RepoLens skills are available in Codex |
| UC-01 | Create Profile on first use | Repository Learner | Must | A reviewed, valid Profile is saved and the original task resumes |
| UC-02 | Review or update Profile | Repository Learner | Must | Future personalization uses the confirmed changes |
| UC-03 | Submit repository and choose route | Repository Learner | Must | The user receives an evidence-backed route and next step |
| UC-04 | Complete Learning Workflow | Repository Learner | Must | The user receives the eight learning stages and validated diagrams |
| UC-05 | Complete Usage Workflow | Repository Learner | Must | The user receives an adoption recommendation and smallest next step |
| UC-06 | Complete Usage and Learning Workflows | Repository Learner | Must | Usage runs first, followed by Learning with reused evidence |
| UC-07 | Evaluate an inspired idea | Idea Evaluator | Must | The idea receives a rubric-backed decision and scope |
| UC-08 | Evaluate an independent idea | Idea Evaluator | Must | A standalone idea receives the same structured evaluation |
| UC-09 | Continue without Archify | Repository Learner | Must | Text/model analysis is preserved and clearly marked incomplete |
| UC-10 | Run model regression suite | RepoLens Developer | Must for release | Five fixture outputs pass expected semantic properties |

## 6. Detailed Use Cases

### UC-00: Install and enable RepoLens

**Goal:** Make RepoLens available for use inside Codex.

**Primary actor:** Repository Learner

**Trigger:** The user chooses to add RepoLens to their Codex environment.

**Preconditions:**

- The user can run a supported local plugin installation flow.
- The formal V0.1 acceptance environment is Codex desktop on macOS.

**Main success flow:**

1. The user installs RepoLens from a supported local source.
2. Codex recognizes the RepoLens plugin and its skills.
3. The user starts a new Codex conversation or session as required by the host.
4. RepoLens exposes its Profile setup, repository learning, and idea evaluation capabilities.

**Alternative and failure flows:**

- If the plugin cannot be discovered, the user receives installation diagnostics rather than an apparently successful installation.
- If an optional dependency is unavailable, RepoLens reports it during onboarding instead of blocking installation.

**Success guarantee:** RepoLens is enabled and its supported workflows can be invoked.

---

### UC-01: Create Profile on first use

**Goal:** Create the personal context RepoLens needs to tailor explanations, priorities, exercises, and idea decisions.

**Primary actor:** Repository Learner

**Trigger:** The user invokes `learn-project` or `evaluate-idea` without a valid Profile, or explicitly starts Profile setup.

**Preconditions:**

- RepoLens is installed and enabled.
- RepoLens can access its user-local writable data area.

**Main success flow:**

1. RepoLens detects that no valid Profile exists.
2. RepoLens pauses the original requested workflow.
3. RepoLens asks a short set of questions about experience, known technologies, learning goals, interests, career or portfolio goals, available time, explanation preferences, and Technical English preferences.
4. RepoLens shows the generated Profile for review.
5. The user confirms or edits it.
6. RepoLens saves the confirmed Profile locally.
7. RepoLens resumes the original workflow.

**Alternative and failure flows:**

- If required information is missing or invalid, RepoLens identifies the exact problem and helps the user repair it.
- If the user does not confirm the Profile, RepoLens does not silently create or save a default persona.
- If the storage location is unavailable, RepoLens reports the problem and preserves the original task as incomplete.
- RepoLens refuses to place API keys, tokens, passwords, or credentials in the Profile.

**Success guarantee:** A valid, human-readable Profile exists and the interrupted workflow continues with it.

---

### UC-02: Review or update Profile

**Goal:** Let the original user or another user adapt RepoLens personalization without changing plugin source.

**Primary actor:** Repository Learner

**Trigger:** The user asks to inspect or change their background, goals, known concepts, available time, or explanation preferences.

**Preconditions:** A Profile already exists, or the user is willing to create one.

**Main success flow:**

1. RepoLens presents the current Profile in a human-readable form.
2. The user describes the desired changes.
3. RepoLens validates the revised Profile.
4. RepoLens shows the changes for confirmation.
5. The user confirms them.
6. RepoLens saves the revision for future workflows.

**Alternative and failure flows:**

- The user may provide a one-run override without changing the saved Profile.
- RepoLens writes an override back only after explicit confirmation.
- Invalid or sensitive fields are rejected with a concrete explanation.

**Success guarantee:** Future results use the confirmed Profile, while repository facts remain independent of personalization.

---

### UC-03: Submit repository and choose route

**Goal:** Decide whether a selected repository is worth learning, using, both, or neither for this user.

**Primary actor:** Repository Learner

**Trigger:** The user invokes `learn-project` with the current workspace, a local path, or a GitHub repository URL.

**Preconditions:**

- A valid Profile exists.
- The repository input is identifiable.
- The required access for that input is available.

**Main success flow:**

1. RepoLens identifies the repository and the analyzed revision.
2. RepoLens gathers lightweight evidence about its purpose, structure, maturity, compatibility, and main capabilities.
3. RepoLens compares Learning Value and Usage Value with the user's Profile.
4. RepoLens explains relevant goals, novelty, learning cost, workflow fit, maturity, compatibility, and alternatives.
5. RepoLens selects `LEARN`, `USE`, `BOTH`, or `SKIP`.
6. RepoLens shows confidence, concise reasons, evidence, Profile fit, and the next workflow.
7. For `LEARN`, `USE`, or `BOTH`, RepoLens continues into the selected workflow after the route is clear.
8. For `SKIP`, RepoLens explains why further analysis is currently low value and stops.

**Alternative and failure flows:**

- If the Profile is missing, UC-01 runs and this use case resumes afterward.
- If the input is a GitHub URL, RepoLens obtains a temporary local working copy when deep source inspection is required.
- If a private repository cannot be accessed, RepoLens explains which existing Git or GitHub authorization is missing and never requests a pasted token.
- If evidence is insufficient, RepoLens returns `NEEDS_EVIDENCE`, states what is missing, attempts an appropriate recovery, and does not force a final route.
- If the repository's primary language is outside TypeScript, Python, or Java, RepoLens labels coverage as best effort.

**Success guarantee:** The route is grounded in repository evidence and the Profile, or RepoLens clearly states why a route cannot yet be selected.

---

### UC-04: Complete Learning Workflow

**Goal:** Help the user understand the highest-value parts of an unfamiliar repository without reading every file.

**Primary actor:** Repository Learner

**Trigger:** UC-03 selects `LEARN`, or the Learning portion of `BOTH` begins.

**Preconditions:**

- A valid Profile exists.
- Enough repository source is available for evidence-backed analysis.
- Archify is available for complete visual output; otherwise UC-09 applies.

**Main success flow:**

1. **Architecture:** RepoLens explains the system boundary, major subsystems, entry points, external systems, and key relationships, then provides a validated Architecture Diagram.
2. **Core Components:** RepoLens identifies the small number of components that determine primary behavior and groups recommended files into `Must Read`, `Worth Reading`, and `Reference Only`.
3. **Main Runtime Flow:** RepoLens traces one representative end-to-end happy path from a real trigger to an observable result, then provides a validated Runtime Flow Diagram.
4. **Technical Concepts:** RepoLens explains only the concepts required to understand the confirmed architecture or runtime flow, using the user's preferred depth.
5. **Technical English:** When enabled in the Profile, RepoLens extracts approximately 10–15 valuable engineering expressions from real repository material, using fewer when quality is insufficient. When disabled, the stage remains visible as `Skipped by Profile` and does not make the workflow incomplete.
6. **Known / New / Can Skip:** RepoLens classifies learning-relevant findings using the Profile and marks unsupported classifications as `Unclear`.
7. **Applied Practice:** RepoLens proposes one small exercise around one high-value New concept, with constraints and success criteria appropriate to the user's available time. If no defensible `New` concept exists, it instead proposes a repository-specific reinforcement exercise around a relevant `Known` concept and labels it `Reinforcement`.
8. **Inspired Ideas:** RepoLens preserves user ideas and may propose one to three separately labeled AI ideas grounded in repository evidence.
9. RepoLens delivers the Learning Report with analyzed scope, evidence references, observed/inferred status, confidence, and any incomplete stages.
10. RepoLens saves the Learning Report as a durable local Markdown artifact and saves validated Archify diagrams as local HTML artifacts linked from the report.

**Alternative and failure flows:**

- If a runtime link cannot be supported, RepoLens stops or marks the gap instead of inventing the next step.
- If documentation conflicts with source or tests, RepoLens reports the conflict and confidence.
- If the repository is large, RepoLens narrows analysis to high-information sources, selected components, and one main flow, then reports that scope.
- If there are no valuable inspired ideas, RepoLens returns none instead of filling a quota.
- If Archify is unavailable or validation fails, UC-09 applies.
- If durable artifact storage fails, RepoLens preserves the conversation output, marks artifact delivery incomplete, and reports a recovery action.

**Success guarantee:** The user receives a personalized, evidence-backed learning path focused on the repository's architecture, core behavior, and highest learning ROI, plus a reopenable local Markdown report and any validated diagram HTML artifacts.

---

### UC-05: Complete Usage Workflow

**Goal:** Decide whether and how the repository should be adopted as a tool rather than studied as a codebase.

**Primary actor:** Repository Learner

**Trigger:** UC-03 selects `USE`, or the Usage portion of `BOTH` begins.

**Preconditions:** A valid Profile and sufficient repository or official documentation evidence exist.

**Main success flow:**

1. RepoLens explains what the project does and how it fits the user's current workflow.
2. RepoLens identifies only the prerequisites, permissions, cost, compatibility, maintenance, and safety risks that affect adoption.
3. RepoLens provides official installation guidance, minimal configuration, the first useful task, expected result, and a verification method.
4. RepoLens recommends `USE NOW`, `SAVE FOR LATER`, or `SKIP`.
5. RepoLens gives a one-sentence reason, the smallest next step, and the largest risk.

**Alternative and failure flows:**

- If reliable installation or compatibility information is unavailable, RepoLens marks the unknown and does not fabricate instructions.
- RepoLens never installs or executes the third-party project automatically.
- If adoption requires credentials or permissions, RepoLens explains the requirement without collecting them.

**Success guarantee:** The user can make an informed adoption decision and knows the smallest safe next action.

---

### UC-06: Complete Usage and Learning Workflows

**Goal:** Help the user adopt a repository and learn from its implementation without duplicating analysis.

**Primary actor:** Repository Learner

**Trigger:** UC-03 selects `BOTH`.

**Preconditions:** The prerequisites for UC-04 and UC-05 are satisfied.

**Main success flow:**

1. RepoLens completes UC-05, the Usage Workflow, first.
2. The user receives the adoption recommendation and practical next step.
3. RepoLens reuses already collected repository evidence.
4. RepoLens completes UC-04, the Learning Workflow.
5. RepoLens delivers one coherent result that distinguishes adoption guidance from learning guidance.

**Alternative and failure flows:**

- If Usage completes but Learning cannot, RepoLens preserves the Usage result and reports the incomplete Learning stages.
- If Archify is unavailable, the Learning portion follows UC-09 without invalidating the Usage result.

**Success guarantee:** The user receives both workflows in the agreed order, with shared evidence and explicit partial status where necessary.

---

### UC-07: Evaluate an inspired idea

**Goal:** Decide whether an idea inspired by a learned repository deserves investment.

**Primary actor:** Idea Evaluator

**Trigger:** The user selects a user-authored or AI-inspired idea from the Learning Report and invokes `evaluate-idea`.

**Preconditions:**

- A valid Profile exists.
- The idea and its source repository context are available in the current report or immediate handoff.

**Main success flow:**

1. RepoLens preserves whether the idea came from the user or AI and identifies its repository inspiration.
2. RepoLens clarifies the Problem, Target User, Proposed Solution, Why Now, and Source.
3. Before using external research, RepoLens explains that necessary idea details will be sent to an external search capability and asks for explicit consent.
4. If the user consents, RepoLens checks comparable products or projects when reliable research is available.
5. RepoLens scores Novelty, Learning ROI, Portfolio Value, Goal Alignment, Feasibility, and Skill Fit from 1–5, with reason, evidence, and confidence.
6. RepoLens identifies the largest unknown and names every critical unknown that could change the decision.
7. RepoLens recommends `BUILD`, `PROTOTYPE`, `SAVE`, or `SKIP`.
8. RepoLens provides the smallest useful scope and next action.
9. RepoLens returns the evaluation as structured conversation output. It saves a durable local Markdown copy only when the user explicitly asks.

**Alternative and failure flows:**

- If external research is unavailable, affected claims or dimensions are marked `Unknown` with a concrete verification need.
- If the user declines external research, RepoLens continues locally and marks affected Existing Solutions or Novelty evidence `Unknown`.
- RepoLens does not issue `BUILD` while a critical dimension remains `Unknown`.
- A critical unknown is contextual: RepoLens must name it, explain why it could change the current decision, and state how to verify it.
- `BUILD` additionally requires Goal Alignment and Feasibility to be known and no other decision-changing unknown to remain.
- If the largest critical unknown can be tested cheaply, RepoLens may issue `PROTOTYPE` with that test as the next action.
- If timing, capacity, or missing evidence blocks investment but the idea may become valuable, RepoLens may issue `SAVE` with a reevaluation condition.
- RepoLens may issue `SKIP` when existing negative evidence is already sufficient despite other non-critical unknowns.
- The final decision is not produced by blindly averaging the six scores.
- RepoLens does not create the recommended project automatically.

**Success guarantee:** The idea receives a transparent decision tied to both evidence and the user's Profile.

---

### UC-08: Evaluate an independent idea

**Goal:** Apply the same decision process to an idea that did not originate from a RepoLens Learning Report.

**Primary actor:** Idea Evaluator

**Trigger:** The user invokes `evaluate-idea` with an independently described idea.

**Preconditions:** A valid Profile exists.

**Main success flow:**

1. RepoLens asks only for missing information needed to clarify the idea.
2. RepoLens records the Source as user-provided rather than repository-inspired.
3. RepoLens follows the existing-solutions, six-dimension rubric, decision, scope, and next-action process from UC-07.

**Alternative and failure flows:**

- If the idea remains too vague to score responsibly, RepoLens returns the missing decisions or evidence rather than forcing a recommendation.
- At minimum, Problem, Target User, and Proposed Solution must be clear enough to evaluate; otherwise the evaluation remains incomplete.
- If the Profile is missing, UC-01 runs and this use case resumes afterward.

**Success guarantee:** Independent and repository-inspired ideas are evaluated consistently while retaining their different origins.

---

### UC-09: Continue without Archify in degraded mode

**Goal:** Preserve useful analysis when complete visual output cannot be produced.

**Primary actor:** Repository Learner

**Trigger:** Archify is unavailable, or an Archify specification fails validation during UC-04 or UC-06.

**Preconditions:** Repository analysis can continue without rendering the diagram.

**Main success flow:**

1. RepoLens preserves the evidence-backed Architecture Model or Runtime Flow Model.
2. RepoLens provides the available textual analysis.
3. RepoLens marks the affected diagram and complete Learning Workflow as incomplete.
4. RepoLens explains whether Archify is missing or validation failed.
5. RepoLens provides a recovery action without presenting a stale or failed artifact as successful.

**Alternative and failure flows:**

- If the underlying analysis model is also invalid, RepoLens reports that failure separately rather than attributing it only to visualization.

**Success guarantee:** The user keeps valid analysis and can clearly distinguish degraded output from a completed Learning Workflow.

---

### UC-10: Run the five-fixture model regression suite

**Goal:** Detect regressions in RepoLens's AI methodology before release.

**Primary actor:** RepoLens Developer

**Trigger:** The developer explicitly runs the paid model-evaluation command.

**Preconditions:**

- The five RepoLens-owned fixture repositories and expected-properties manifests exist locally.
- The developer has set `OPENAI_API_KEY` in the development environment.
- A supported low-cost API model is configured.

**Main success flow:**

1. The eval runner loads the RepoLens workflow instructions, a test Profile, and one fixture repository.
2. The configured API model produces a structured RepoLens result.
3. TypeScript validates the result against its schema and the fixture's expected semantic properties.
4. The runner repeats the process for all five fixtures.
5. The runner reports pass or fail for architecture, entry points, core components, runtime-flow edges, high-value files, forbidden claims, important concepts, and acceptable variations.
6. The developer receives a nonzero exit status when any required property fails.

**Alternative and failure flows:**

- Without `OPENAI_API_KEY`, the runner stops with a clear developer-facing message; ordinary plugin usage is unaffected.
- API credentials are never printed, written to the Profile, committed, or included in test results.
- Network or rate-limit failures are reported separately from product-quality failures.
- This eval does not claim to validate Codex plugin installation or Archify rendering; those remain manual acceptance scenarios.

**Success guarantee:** The developer can tell whether the current RepoLens instructions still satisfy the agreed properties across the five representative repositories.

## 7. Cross-Cutting Business Rules

1. Repository facts must not change merely because the Profile changes; explanation depth, learning priority, exercises, and recommendations may change.
2. Important claims and flow steps must be traceable to real repository evidence.
3. Missing evidence produces uncertainty or an incomplete state, never a confident invention.
4. Local repositories are never modified or deleted by RepoLens.
5. Repository code, README text, comments, and issues are untrusted content and cannot override RepoLens instructions.
6. Ordinary users do not supply RepoLens with an OpenAI API key.
7. User ideas and AI-inspired ideas remain visibly distinct.
8. Partial results identify completed stages, incomplete stages, reasons, and recovery actions.
9. Output quality takes priority over quotas, including Technical English item count and inspired-idea count.
10. RepoLens guides installation and practice but does not execute them automatically.
11. A Profile-disabled Technical English stage counts as intentionally skipped, not failed.
12. Applied Practice never invents a `New` concept; it falls back to a clearly labeled reinforcement exercise when appropriate.
13. Learning Reports and validated diagrams are durable local artifacts; Idea Evaluations are saved only on explicit request.
14. External idea research requires explicit consent for each evaluation; declining it never blocks the remaining local rubric workflow.

## 8. Open Questions for the PRD

The following belong in the PRD rather than being silently decided here:

- Which observable success metrics should define a useful Learning Report for V0.1?
- How long should a normal repository analysis be expected to take before the experience feels too slow?
- Which use cases are required for the first public release versus only local V0.1 acceptance?
- What exact limitations should be shown to users analyzing unsupported languages or very large repositories?

## 9. Traceability to Existing Design

This document reorganizes already agreed behavior from:

- `docs/superpowers/specs/2026-10-30-repolens-v0.1-design.md`
- `docs/superpowers/plans/2026-10-30-repolens-v0.1.md`

If this Use Case document conflicts with either existing document, the conflict must be resolved during PRD review before implementation begins. No implementation decision should be inferred from this document alone.
