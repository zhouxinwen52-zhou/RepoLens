# RepoLens Learning Report

> Replace every `{placeholder}`. Remove instructional comments only after the
> corresponding field is populated. Keep incomplete and skipped stages visible.

## Run identity

- **Repository:** `{repository identity or canonical URL}`
- **Analyzed ref:** `{commit SHA or immutable revision}`
- **Primary language:** `{language}`
- **Language support:** `{tested | best-effort}`
- **Support disclosure:** `{required near the beginning for best-effort; otherwise Not applicable}`
- **Profile:** `{profile path or non-sensitive profile identifier}`
- **Route:** `{LEARN | BOTH}`
- **Run started:** `{ISO 8601 timestamp}`
- **Run completed:** `{ISO 8601 timestamp | Incomplete}`

## Analyzed scope

- **Inspected:** `{directories, manifests, entry points, docs, tests, or selected components}`
- **Not inspected:** `{intentionally uninspected areas}`
- **Excluded:** `{paths and exclusion categories only; never excluded contents}`
- **Limits reached:** `{none | file/depth/time/context limit and its effect}`

## Route summary

- **Learning Value:** `{High}` — `{Profile-aware reason}`
- **Usage Value:** `{High | Low}` — `{Profile-aware reason}`
- **Route confidence:** `{High | Medium | Low}`
- **Reasons:**
  - `{concise reason}`
- **Evidence:** `{evidence IDs}`
- **Next workflows:** `{LEARNING | USAGE then LEARNING}`

## Run status

- **Overall status:** `{complete | incomplete}`
- **Current stage:** `{stage name | None}`
- **Completed stages:** `{ordered stage names | None}`
- **Incomplete stages:** `{ordered stage names | None}`
- **Reason:** `{why the run or current stage is incomplete | Not applicable}`
- **Recovery action:** `{specific next action | Not applicable}`

| Order | Workflow | Stage | Status | Started | Completed | Reason | Recovery action |
|---:|---|---|---|---|---|---|---|
| 1 | `{ROUTER | USAGE | LEARNING}` | `{stage}` | `{not-started | in-progress | completed | incomplete}` | `{ISO timestamp | Not started}` | `{ISO timestamp | Not completed}` | `{reason | —}` | `{action | —}` |

Do not add an ETA. Add one row per stage in execution order.

## Usage result

<!-- Keep this section for BOTH; otherwise write Not applicable. Usage precedes Learning. -->

- **Recommendation:** `{USE NOW | SAVE FOR LATER | SKIP | Not applicable}`
- **Reason:** `{one sentence | Not applicable}`
- **Smallest next step:** `{safe action | Not applicable}`
- **Largest risk:** `{risk | Not applicable}`
- **Change from Router judgment:** `{new/deeper evidence and its effect | No material change | Not applicable}`

## Learning stages

### 1. Architecture

- **Status:** `{complete | incomplete}`
- **Result:** `{system boundary, major subsystems, entry points, external systems, and relationships}`
- **Evidence:** `{evidence IDs}`
- **Diagram:** `{{architecture-diagram}}`
- **Incomplete reason:** `{reason | Not applicable}`
- **Recovery action:** `{action | Not applicable}`

### 2. Core Components

- **Status:** `{complete | incomplete}`
- **Result:** `{small set of primary-behavior components and reading groups}`
- **Evidence:** `{evidence IDs}`
- **Incomplete reason:** `{reason | Not applicable}`
- **Recovery action:** `{action | Not applicable}`

### 3. Main Runtime Flow

- **Status:** `{complete | incomplete}`
- **Trigger:** `{participant, file, symbol, input, and action}`
- **Ordered steps:** `{participant, file, symbol, input, action, output, next, evidence IDs, and confidence for every step}`
- **Dynamic dispatch or framework boundary:** `{mechanism and uncertainty | None}`
- **Final result:** `{participant and observable result}`
- **Evidence:** `{evidence IDs}`
- **Diagram:** `{{runtime-flow-diagram}}`
- **Incomplete reason:** `{reason | Not applicable}`
- **Recovery action:** `{action | Not applicable}`

### 4. Technical Concepts

- **Status:** `{complete | incomplete}`
- **Result:** `{Profile-appropriate concepts needed for the confirmed architecture or flow | None}`
- **Evidence:** `{evidence IDs}`
- **Incomplete reason:** `{reason | Not applicable}`
- **Recovery action:** `{action | Not applicable}`

| Concept name | Plain-language explanation | How this repository uses it |
|---|---|---|
| `{name}` | `{Profile-appropriate explanation}` | `{repository-specific use}` |

### 5. Technical English

- **Status:** `{complete | incomplete | Skipped by Profile}`
- **Target:** `{10–15 | Skipped by Profile}`
- **Result:** `{number of high-value expressions | Skipped by Profile}`
- **Insufficient-quality note:** `{required when fewer than 10 items are returned | Not applicable | Skipped by Profile}`
- **Evidence:** `{evidence IDs | Not applicable}`
- **Incomplete reason:** `{reason | Not applicable}`
- **Recovery action:** `{action | Not applicable}`

| Technical expression | Meaning in context | How engineers use it |
|---|---|---|
| `{expression}` | `{repository-context meaning}` | `{reusable engineering usage}` |

### 6. Known / New / Can Skip

- **Status:** `{complete | incomplete}`
- **Result:** `{Profile-supported classifications, including Unclear where evidence is insufficient | None}`
- **Evidence:** `{evidence IDs}`
- **Incomplete reason:** `{reason | Not applicable}`
- **Recovery action:** `{action | Not applicable}`

| Subject | Classification | Profile-based explanation |
|---|---|---|
| `{component, concept, mechanism, or practice}` | `{Known | New | Can Skip | Unclear}` | `{why this classification affects the learning path}` |

### 7. Applied Practice

- **Status:** `{complete | incomplete}`
- **Type:** `{New Concept | Reinforcement}`
- **Title:** `{practice title}`
- **Concept:** `{one classified concept}`
- **Classification:** `{New | Known}`
- **Why it fits:** `{Profile and repository-specific reason}`
- **Task:** `{one independently achievable task}`
- **Constraints:** `{scope and environment constraints}`
- **Success criteria:** `{observable completion checks}`
- **Time estimate:** `{Profile-based estimate}`
- **Hints:** `{one to three hints}`
- **Evidence:** `{evidence IDs}`
- **Incomplete reason:** `{reason | Not applicable}`
- **Recovery action:** `{action | Not applicable}`

### 8. Inspired Ideas

- **Status:** `{complete | incomplete}`
- **User ideas:** `{count | None}`
- **AI-inspired ideas:** `{zero to three evidence-grounded ideas | None}`
- **Evidence:** `{evidence IDs | Not applicable}`
- **Incomplete reason:** `{reason | Not applicable}`
- **Recovery action:** `{action | Not applicable}`

| Source | Title | Inspiration | Description | Preliminary Profile fit | Unknowns | Grounding evidence | Evaluate-idea handoff |
|---|---|---|---|---|---|---|---|
| `{User | AI}` | `{title}` | `{repository mechanism, limitation, workflow, or user inspiration}` | `{short description}` | `{fit}` | `{unknowns | None}` | `{evidence IDs for AI | Not applicable for User}` | `{Ready | Not requested}` |

For every AI row, resolve the grounding evidence IDs in the Evidence index.
Keep user and AI rows separately labeled. Do not add placeholder AI ideas to
reach a quota.

## Artifact delivery

- **Analysis status:** `{complete | incomplete}`
- **Artifact status:** `{saved | incomplete}`
- **Intended destination:** `{user-local run directory | explicit user-selected directory}`
- **Report:** `{report.md path | Not saved}`
- **Architecture diagram:** `{architecture.html path | Not produced}`
- **Runtime Flow diagram:** `{runtime-flow.html path | Not produced}`
- **Sanitized diagnostics:** `{diagnostics | Not applicable}`
- **Recovery action:** `{retry-save in the current run | regenerate after current-run state is gone | Not applicable}`

## Evidence index

| ID | Path | Symbol or section | Observation | Status | Confidence |
|---|---|---|---|---|---|
| `{evidence ID}` | `{repository-relative allowed path}` | `{symbol/section | —}` | `{concrete observation}` | `{Observed | Inferred}` | `{High | Medium | Low}` |

Every important claim and diagram element must resolve to an entry in this
index. Never include excluded-file contents. Report conflicting sources as
separate entries and explain their effect on confidence.
