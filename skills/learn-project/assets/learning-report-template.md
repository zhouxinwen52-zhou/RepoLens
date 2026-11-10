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
- **Diagram:** `{validated local HTML link | validation-failed | archify-unavailable | pending}`
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
- **Result:** `{one evidence-backed trigger-to-result happy path}`
- **Evidence:** `{evidence IDs}`
- **Diagram:** `{validated local HTML link | validation-failed | archify-unavailable | pending}`
- **Incomplete reason:** `{reason | Not applicable}`
- **Recovery action:** `{action | Not applicable}`

### 4. Technical Concepts

- **Status:** `{complete | incomplete}`
- **Result:** `{Profile-appropriate concepts needed for the confirmed architecture or flow}`
- **Evidence:** `{evidence IDs}`
- **Incomplete reason:** `{reason | Not applicable}`
- **Recovery action:** `{action | Not applicable}`

### 5. Technical English

- **Status:** `{complete | incomplete | Skipped by Profile}`
- **Result:** `{high-value expressions from repository material | Skipped by Profile}`
- **Evidence:** `{evidence IDs | Not applicable}`
- **Incomplete reason:** `{reason | Not applicable}`
- **Recovery action:** `{action | Not applicable}`

### 6. Known / New / Can Skip

- **Status:** `{complete | incomplete}`
- **Result:** `{Profile-supported classifications, including Unclear where evidence is insufficient}`
- **Evidence:** `{evidence IDs}`
- **Incomplete reason:** `{reason | Not applicable}`
- **Recovery action:** `{action | Not applicable}`

### 7. Applied Practice

- **Status:** `{complete | incomplete}`
- **Result:** `{practice around a high-value New concept | Reinforcement around a Known concept}`
- **Evidence:** `{evidence IDs}`
- **Incomplete reason:** `{reason | Not applicable}`
- **Recovery action:** `{action | Not applicable}`

### 8. Inspired Ideas

- **Status:** `{complete | incomplete}`
- **User ideas:** `{preserved separately | None}`
- **AI-inspired ideas:** `{zero to three evidence-grounded ideas | None}`
- **Evidence:** `{evidence IDs | Not applicable}`
- **Incomplete reason:** `{reason | Not applicable}`
- **Recovery action:** `{action | Not applicable}`

## Evidence index

| ID | Path | Symbol or section | Observation | Status | Confidence |
|---|---|---|---|---|---|
| `{evidence ID}` | `{repository-relative allowed path}` | `{symbol/section | —}` | `{concrete observation}` | `{Observed | Inferred}` | `{High | Medium | Low}` |

Every important claim and diagram element must resolve to an entry in this
index. Never include excluded-file contents. Report conflicting sources as
separate entries and explain their effect on confidence.
