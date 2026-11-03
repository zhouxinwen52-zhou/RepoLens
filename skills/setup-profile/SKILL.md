---
name: setup-profile
description: Use when a RepoLens Profile is missing or invalid, or when a user wants to create, review, update, or replace their learning preferences.
---

# Set Up RepoLens Profile

Create a local, human-readable Profile that personalizes teaching and
recommendations without changing repository facts. Never invent a default
persona, collect credentials, or save an unconfirmed draft.

## Profile contract

Use [references/profile-schema.md](references/profile-schema.md) as the
authoritative field contract and
[assets/profile-template.md](assets/profile-template.md) as the editable
starting point.

Store the confirmed Profile at:

```text
${CODEX_HOME:-~/.codex}/repolens/profile.md
```

Resolve `CODEX_HOME` first. Otherwise use the current user's `.codex`
directory. Never store the Profile in this plugin package or in a repository
being analyzed.

## Onboarding workflow

1. Before asking Profile questions, preserve the interrupted workflow's skill
   name and its complete original input. Do not reinterpret or shorten it.
2. Resolve the exact Profile path and inspect an existing Profile when present.
   If it is invalid, identify the precise field problem and offer to repair it.
3. Report this capability check using exactly these status choices:
   - `Local filesystem access: Available / Unavailable`
   - `git: Available / Missing`
   - `gh CLI: Available / Missing`
   - `GitHub MCP/plugin: Connected / Not connected`
   - `Archify: Available / Missing`
4. Ask for every required field in the schema. Accept empty lists only for
   known languages, frameworks, and concepts. Do not infer values the user did
   not provide.
5. Reject API keys, tokens, passwords, passphrases, private keys, credentials,
   and secrets. Do not repeat a supplied secret in the response, preview, file,
   logs, or continuation action. Ask the user for a sanitized replacement.
6. Generate a complete Markdown draft from the template and validate it against
   the schema. Preserve optional free-text context in the Markdown body.
7. Show the complete draft and the exact resolved destination path. Ask for an
   explicit confirmation or requested edits.
8. Write the file only after confirmation. If the destination is unavailable,
   report the error and keep the interrupted workflow pending.
9. After a successful write, resume the preserved workflow automatically in the
   same conversation when the host supports it. When automatic resume is not
   available, return exactly one continuation action containing both the
   original skill name and its complete preserved input.

## Existing Profiles and one-run overrides

For an update, show the current Profile, validate the requested changes, show
the revised draft, and require confirmation before replacing the file.

A one-run override affects only the current workflow. Do not write it into the
saved Profile unless the user separately confirms that persistent change.

## Completion contract

Onboarding is complete only when a schema-valid Profile has been explicitly
confirmed and saved. A missing confirmation, invalid Profile, rejected secret,
or storage failure leaves onboarding incomplete and the original workflow
preserved.
