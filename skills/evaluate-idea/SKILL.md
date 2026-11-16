---
name: evaluate-idea
description: Use when deciding whether an independent or repository-inspired software project idea deserves investment; do not use for repository analysis alone.
---

# Evaluate an Idea with RepoLens

Turn project enthusiasm into a transparent, Profile-aware decision without
inventing evidence or treating a score average as the verdict.

## Before evaluation

1. Preserve whether the idea is independent or handed off from a Learning
   Report. For a handoff, retain its title, description, inspiration, and
   evidence IDs unchanged.
2. Load the confirmed Profile. If none exists, pause for `setup-profile`, then
   resume with the original idea and origin preserved.
3. Clarify Problem, Target User, Proposed Solution, Why Now, and Source. Problem,
   Target User, and Proposed Solution are mandatory. If any is not clear enough,
   return `incomplete-clarification` with the missing fields and one next action;
   do not score or decide.

## External research consent

Before sending any idea detail to search, browsing, or another external
research capability:

1. disclose the intended lookup;
2. state which necessary idea details will leave the local conversation;
3. obtain explicit consent for this evaluation.

Do not infer consent from the request to evaluate. Record `granted`, `declined`,
or `not-requested`. After a decline, continue locally without external lookup;
mark affected Existing Solutions and Novelty evidence `Unknown` and give a
concrete verification need. Consent applies only to the current evaluation.

## Evaluate and decide

Read and follow [the evaluation rubric](references/evaluation-rubric.md). Keep
external facts stable across Profiles; the Profile may change Goal Alignment,
Learning ROI, Portfolio Value, Skill Fit, and the resulting recommendation.

Validate the result with `IdeaEvaluationSchema` before presenting it. Every
complete result includes all six dimensions, the largest unknown, contextual
critical unknowns, the smallest useful scope, the next action, and exactly one
decision: `BUILD`, `PROTOTYPE`, `SAVE`, or `SKIP`.

Use [the Idea Evaluation template](assets/idea-evaluation-template.md) for the
conversation result. Explain the decision through the rubric rather than a
simple average. Do not create, scaffold, or execute the proposed project.

## Optional saving

Return the structured evaluation in conversation by default. Do not write a
file merely because the evaluation is complete. Only after the user explicitly
asks to save it, render the populated template and call `saveIdeaEvaluation`
with the user-local data area or their explicit destination.

On save failure, preserve the conversation evaluation, report artifact delivery
as incomplete with sanitized diagnostics, and offer retry-save. Do not create
an index, database, telemetry event, or automatic cross-run collection.
