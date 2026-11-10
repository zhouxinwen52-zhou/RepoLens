# RepoLens Artifact-First Learning Report Design

**Date:** 2026-11-10
**Status:** Approved
**Applies to:** Learning Workflow artifact delivery in V0.1

## Intent

Keep the complete Learning Report durable and reopenable without duplicating
its full contents in the host conversation. The conversation remains useful for
progress and handoff, while `report.md` is the canonical detailed result.

## Goals

- Save the complete eight-stage Learning Report as a local Markdown artifact.
- Keep routine conversation output concise enough to avoid consuming context
  with a second copy of the report.
- Preserve a completed structured result in the current run when artifact
  writing fails, and offer an explicit retry-save action.
- Retain atomic artifact semantics: a partial file must never appear to be a
  completed report.

## Non-goals

- No cross-conversation failed-report cache, database, or recovery service.
- No incremental user-visible draft file for each completed stage.
- No change to the requirement that validated diagrams are saved as local HTML
  files and linked relatively from the report.
- No change to Idea Evaluation delivery, which remains conversation-first
  unless the user explicitly requests saving it.

## Approaches considered

### Chosen: current-run structured result plus atomic final write

Keep validated stage results in the active run state. Render them into a
temporary sibling Markdown file, then rename it to `report.md` only after the
write completes. On failure, retain the structured result for the current run
and return a retry-save action without printing the complete report.

This preserves the existing atomic-write boundary and avoids both partial
artifacts and duplicated conversation content.

### Rejected: incrementally update a visible draft

Writing after every stage would improve crash recovery, but adds draft versus
final semantics, repeated writes, and more complex cleanup. V0.1 does not need
cross-run recovery enough to justify that lifecycle.

### Rejected: print the complete report when saving fails

This preserves immediate access but duplicates the largest output in the
conversation and defeats the context-saving goal.

## Delivery behavior

During analysis, the conversation reports only:

- current workflow and stage;
- meaningful analyzed-scope changes;
- blocking dependencies or incomplete-stage reasons;
- completion timestamps where relevant.

After a successful save, the conversation returns:

- route and final workflow status;
- three to five key findings;
- incomplete or degraded stages, if any;
- the local `report.md` path;
- links to validated diagram HTML artifacts;
- the smallest relevant next action.

The full stage content and evidence index live in `report.md`. A user may ask
to expand a specific stage in the conversation, but RepoLens does not emit the
entire report there by default.

## Save failure and retry

If the report write fails:

1. Keep the validated structured report result in the current run state.
2. Mark artifact delivery `incomplete` without marking the analysis itself
   failed.
3. Return the intended destination, sanitized error diagnostics, and one
   explicit retry-save action.
4. On retry, reuse the retained structured result; do not rerun repository
   analysis unless that result is no longer available.
5. If the current run ends before saving succeeds, report that no durable
   report was created and provide an action to regenerate it. Do not dump the
   complete report into the conversation.

## Contract and test impact

- Extend artifact delivery status to distinguish analysis completion from
  artifact persistence completion.
- `saveLearningArtifacts` accepts an already validated structured report and
  can be called again with the same result and a new valid destination.
- Artifact tests cover a failed first write followed by a successful retry
  without re-analysis.
- Skill instructions require concise conversation handoff and prohibit full
  report duplication by default.
- Manual acceptance verifies that a complete run produces a reopenable report
  while the conversation contains only the concise handoff.

## Failure boundary

The current run is the only retry boundary in V0.1. Once that run state is no
longer available, RepoLens does not claim recoverability. It reports the
missing durable artifact plainly and offers regeneration.
