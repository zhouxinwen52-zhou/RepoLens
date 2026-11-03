# RepoLens Profile schema

The Profile is a Markdown document with YAML frontmatter. Frontmatter supplies
machine-checkable personalization data; the Markdown body supplies optional
free-text context. Unknown fields are invalid so credential-like or accidental
data cannot silently enter the Profile.

## Frontmatter fields

| Field | Type | Requirement |
| --- | --- | --- |
| `schemaVersion` | `1` | Required; other versions are unsupported |
| `experienceLevel` | `beginner`, `junior`, `mid`, or `senior` | Required |
| `knownTechnologies.languages` | string array | Required; may be empty |
| `knownTechnologies.frameworks` | string array | Required; may be empty |
| `knownTechnologies.concepts` | string array | Required; may be empty |
| `learningGoals` | non-empty string array | Required |
| `technicalInterests` | non-empty string array | Required |
| `careerGoals` | non-empty string array | Required |
| `portfolioGoals` | non-empty string array | Required |
| `availableHoursPerWeek` | number greater than `0` and at most `168` | Required |
| `explanation.language` | non-empty language name or locale | Required |
| `explanation.depth` | `concise`, `balanced`, or `deep` | Required |
| `technicalEnglish.enabled` | boolean | Required |

The Markdown body after the closing `---` is optional. When present, it becomes
the Profile's `context` value after surrounding whitespace is removed.

## Credential boundary

The Profile must not contain fields for API keys, tokens, passwords,
passphrases, secrets, credentials, or private keys. Keep authentication in the
user's existing environment or authorized connection, never in Profile data.

## Storage

The default path is `${CODEX_HOME:-~/.codex}/repolens/profile.md`. The Profile
is user-local data and must not be stored inside the installed plugin or an
analyzed repository.
