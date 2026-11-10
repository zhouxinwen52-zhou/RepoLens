# Repository Router

Use this reference after repository acquisition, safety filtering, Profile
loading, and primary-language classification. The Router decides which
workflow provides value now; it does not perform the full workflow.

## Required judgment

Assess Learning Value and Usage Value as `High` or `Low`. Address every factor
below with the smallest amount of allowed evidence that supports a decision:

| Factor | Router question |
|---|---|
| Profile relevance | Does this repository support current learning, career, portfolio, or technical goals? |
| Novelty | Which important mechanisms are genuinely new to this user? |
| Learning cost | Is the likely value proportionate to repository size, complexity, prerequisites, and available time? |
| Workflow fit | Does the project solve a current practical problem or improve an existing workflow? |
| Maturity and maintenance | Is there evidence that the project is usable and sufficiently maintained for the proposed value? |
| Compatibility | Do platform, runtime, permissions, cost, and integration constraints fit the user? |
| Alternatives | Does this project add meaningful value over tools or approaches the user already has? |

Popularity, stars, novelty, or codebase complexity alone never establish
Learning Value or Usage Value. Do not encode or imply a universal numeric
threshold. Explain the High/Low judgments from the Profile and evidence.

## Route mapping

| Learning Value | Usage Value | Route | Next workflows |
|---|---|---|---|
| High | Low | `LEARN` | `LEARNING` |
| Low | High | `USE` | `USAGE` |
| High | High | `BOTH` | `USAGE`, then `LEARNING` |
| Low | Low | `SKIP` | none |

The result contains:

- `route`;
- `confidence` as `High`, `Medium`, or `Low`;
- one or more concise reasons;
- Profile fit with separate Learning Value and Usage Value explanations;
- allowed evidence references;
- the ordered next workflows.

Each evidence reference contains an identifier, repository-relative path,
concrete observation, `Observed` or `Inferred`, and confidence. Add a symbol or
document section when it materially improves traceability.

## Insufficient evidence

Use `NEEDS_EVIDENCE` only when missing information prevents a defensible final
route.

1. State the missing evidence and why it can change the route.
2. List the allowed sources already attempted.
3. Choose a concrete recovery action within the repository and safety boundary.
4. Attempt that recovery.
5. Route again when evidence becomes sufficient. If it remains insufficient,
   preserve `NEEDS_EVIDENCE` with the attempted sources and next recovery
   action; do not disguise uncertainty as `SKIP`.

Do not request secrets, open excluded paths, execute the repository, or use
unsupported external claims to force a final route.
