# RepoLens

RepoLens is an opinionated Codex plugin for learning from unfamiliar software
repositories and evaluating project ideas inspired by them.

## Verified plugin contract

The packaging contract was checked against the official OpenAI documentation on
2026-11-03:

- [Package your plugin](https://developers.openai.com/plugins/build/plugins)
- [Build skills](https://learn.chatgpt.com/docs/build-skills?product=breeze)
- [Plugin submission errors](https://developers.openai.com/plugins/deploy/submission-errors)

The verified Day 1 contract is:

- The canonical portable manifest is `plugin.json` at the plugin root.
- The manifest identifies the plugin with a schema URL, stable name, semantic
  version, non-empty description, author, and OpenAI-facing interface metadata.
- Portable hosts discover skills as immediate children of the root `skills/`
  directory; the root manifest does not need a `skills` field.
- Every skill has a non-empty `SKILL.md` with YAML frontmatter containing a
  unique `name` and a trigger-oriented `description`.
- A skill may contain `scripts/`, `references/`, and `assets/`. These hold
  executable helpers, detailed supporting documentation, and reusable resources
  respectively; they are not additional skills.
- `agents/openai.yaml` is optional. When included, it must contain an
  `interface` mapping with non-empty `display_name` and `short_description`.
- OpenAI-specific plugin settings belong in `extensions.com.openai`. RepoLens
  uses `onboardingSkill` to point to `./skills/setup-profile/SKILL.md`.
- `.codex-plugin/plugin.json` is only a compatibility fallback. RepoLens does not
  add it unless local acceptance later proves it necessary.

Day 1 creates packaging and discovery skeletons only. The Profile, repository
analysis, learning workflow, and idea-evaluation behavior belong to later days.

## Local Profile

RepoLens personalization is stored as editable Markdown with YAML frontmatter.
The confirmed Profile lives at
`${CODEX_HOME:-~/.codex}/repolens/profile.md`; it is never stored in the plugin
package or the repository being analyzed.

Run `setup-profile` to create, inspect, repair, or update it. Onboarding checks
local filesystem, Git, optional GitHub access, and Archify availability; rejects
credential fields; previews the complete Profile and destination before saving;
and resumes the interrupted workflow with its original input preserved. If the
host cannot resume automatically, RepoLens returns one explicit continuation
action instead.
