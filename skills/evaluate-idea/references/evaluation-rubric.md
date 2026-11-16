# Evidence-Aware Idea Evaluation Rubric

Use this reference after clarification is complete and the external-research
consent state has been recorded. Higher numeric values mean stronger support
for investment. Values 2 and 4 sit between the named anchors.

## Existing solutions

When current, reliable comparison evidence is available after explicit consent,
record each comparable solution's name, current coverage, meaningful difference,
and evidence. Keep uncertain coverage in `unknowns`.

Without consent, do not call external search or research. Continue using local
conversation, Profile, and Learning Report evidence. Mark externally dependent
Existing Solutions and Novelty claims `Unknown`; never substitute remembered or
stale market knowledge for current evidence.

## Six dimensions

| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| Novelty | No meaningful difference | Partial differentiation | Clear, important differentiation |
| Learning ROI | Familiar, or cost outweighs learning | Some useful learning | Concentrated practice of current high-value skills |
| Portfolio Value | Hard to demonstrate or explain | Shows some capability | Strong, coherent engineering story |
| Goal Alignment | Unrelated or conflicting | Some relevance | Directly serves current goals |
| Feasibility | Not achievable with current resources | Achievable after scoping | Independently achievable and verifiable in reasonable time |
| Skill Fit | Too familiar or far beyond current ability | Challenging with substantial support | Appropriate stretch with useful foundations |

Every dimension contains:

- `value`: `1 | 2 | 3 | 4 | 5 | Unknown`;
- `reason`: the idea- and Profile-specific explanation;
- `evidence`: one or more concrete supporting observations;
- `confidence`: `High | Medium | Low`;
- `verificationNeed`: required when value is `Unknown`.

Evidence and confidence describe support quality; do not average either into the
numeric value. Do not compute a simple average to choose the final decision.

## Critical unknowns

A critical unknown is any missing fact that could reasonably change the current
decision. Criticality is contextual, not a fixed list of dimensions. For each
critical unknown, record:

- a specific name;
- why resolving it could change the decision;
- how to verify it;
- the affected rubric dimensions.

`BUILD` requires known Goal Alignment and Feasibility and no remaining
decision-changing unknown. A cheaply testable critical unknown normally points
to `PROTOTYPE`. Missing timing, capacity, or evidence may point to `SAVE`.
Sufficient negative evidence can justify `SKIP` even when non-critical unknowns
remain.

## Decision contract

- `BUILD`: strong enough evidence and a clear first slice. Include
  `initialScope`.
- `PROTOTYPE`: promising, but one or more assumptions should be tested cheaply.
  Include `hypothesis` and an observable `successSignal`.
- `SAVE`: potentially valuable, but current goals, timing, or capacity do not
  fit. Include a concrete `reevaluationCondition`.
- `SKIP`: expected value remains too low after reasonable scoping. Include a
  specific `rejectionReason`.

Every decision includes a rubric-grounded rationale. Every complete evaluation
also names the largest unknown, smallest useful scope, and next action. The next
action is guidance only; RepoLens does not build the project.

## Profile sensitivity

Keep idea origin, external comparisons, and other external facts unchanged
across Profiles. Re-evaluate personal dimensions against the confirmed Profile.
The same idea may therefore receive a different justified recommendation for a
different user without changing external facts.
