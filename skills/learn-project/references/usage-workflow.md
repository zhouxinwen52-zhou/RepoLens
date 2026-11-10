# Usage Workflow

Use this reference for `USE` and for the Usage portion of `BOTH`. The outcome
is adoption guidance, not installation or execution of the analyzed project.

## 1. What It Does & Personal Fit

State the problem, the core capability that addresses it, fit with the user's
current workflow, and overlap with existing tools. Keep repository facts
separate from Profile-based fit.

## 2. Requirements & Risks

Include only adoption-relevant prerequisites, permissions, cost,
compatibility, maintenance, and safety concerns. Mark unavailable or
conflicting information as unknown with evidence and confidence. Explain any
credential or permission requirement without asking the user to provide it.

## 3. Quick Start

Provide all of the following from allowed official or repository evidence:

- official installation guidance;
- minimal configuration;
- the first useful task;
- the expected result;
- a verification method.

This is guidance only. Do not install dependencies, modify configuration,
execute the project, or perform the first task. If reliable installation or
compatibility instructions are unavailable, state the gap instead of
fabricating commands.

## 4. Recommendation

Choose exactly one:

- `USE NOW`: fit is current and the smallest safe trial is proportionate to
  the likely benefit.
- `SAVE FOR LATER`: potential value exists, but a current prerequisite, cost,
  timing, compatibility issue, or competing priority makes adoption premature.
- `SKIP`: current fit or expected value does not justify adoption.

Return a one-sentence reason, the smallest safe next step, and the largest
adoption risk. In `BOTH`, a `SAVE FOR LATER` or `SKIP` recommendation does not
cancel the Learning Workflow when Learning Value remains High.

### Keep routing and recommendation consistent

Router `SKIP` and Usage Recommendation `SKIP` answer different questions:

- Router `SKIP` means the lightweight assessment found insufficient value to
  enter either full workflow.
- Usage Recommendation `SKIP` means the Usage Workflow was worth completing,
  but deeper adoption evidence shows that the project should not be adopted.

A `USE` or `BOTH` route may therefore end with Recommendation `SKIP` only when
the Usage Workflow uncovers new or more specific evidence, such as a blocking
compatibility constraint, disproportionate cost, unsafe permission model, or
material maintenance risk. Cite that evidence and state how it changes the
Router's preliminary Usage Value judgment. If the evidence has not materially
changed, preserve consistency with the Router instead of silently reversing
the recommendation.

## Completion

Validate the four sections and recommendation with `UsageReportSchema`. Record
ordered stage timestamps without an ETA. If Usage cannot finish, preserve all
valid completed sections and report the incomplete section, reason, and
recovery action.
