import { homedir } from "node:os";
import path from "node:path";

import { parse as parseYaml } from "yaml";
import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);
const nonEmptyTextList = z.array(nonEmptyText).min(1);

export const ProfileSchema = z
  .object({
    schemaVersion: z.literal(1),
    experienceLevel: z.enum(["beginner", "junior", "mid", "senior"]),
    knownTechnologies: z
      .object({
        languages: z.array(nonEmptyText),
        frameworks: z.array(nonEmptyText),
        concepts: z.array(nonEmptyText),
      })
      .strict(),
    learningGoals: nonEmptyTextList,
    technicalInterests: nonEmptyTextList,
    careerGoals: nonEmptyTextList,
    portfolioGoals: nonEmptyTextList,
    availableHoursPerWeek: z.number().positive().max(168),
    explanation: z
      .object({
        language: nonEmptyText,
        depth: z.enum(["concise", "balanced", "deep"]),
      })
      .strict(),
    technicalEnglish: z
      .object({
        enabled: z.boolean(),
      })
      .strict(),
    context: nonEmptyText.optional(),
  })
  .strict();

export type Profile = z.infer<typeof ProfileSchema>;

const credentialFieldPattern =
  /^(?:api[_-]?key|token|password|passphrase|secret|credentials?|private[_-]?key)$/i;

function findCredentialField(value: unknown, parent = ""): string | undefined {
  if (Array.isArray(value)) {
    for (const [index, child] of value.entries()) {
      const match = findCredentialField(child, `${parent}[${index}]`);
      if (match) return match;
    }
    return undefined;
  }

  if (value === null || typeof value !== "object") return undefined;

  for (const [key, child] of Object.entries(value)) {
    const fieldPath = parent ? `${parent}.${key}` : key;
    if (credentialFieldPattern.test(key)) return fieldPath;
    const nestedMatch = findCredentialField(child, fieldPath);
    if (nestedMatch) return nestedMatch;
  }

  return undefined;
}

export function parseProfile(markdown: string): Profile {
  const match = markdown.match(
    /^---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)([\s\S]*)$/,
  );
  if (!match) {
    throw new Error("Profile must contain YAML frontmatter followed by Markdown.");
  }

  const frontmatter: unknown = parseYaml(match[1]);
  const credentialField = findCredentialField(frontmatter);
  if (credentialField) {
    throw new Error(
      `Profile contains credential or secret field '${credentialField}', which is not allowed.`,
    );
  }

  const context = match[2].trim();
  const candidate =
    frontmatter !== null && typeof frontmatter === "object"
      ? { ...frontmatter, ...(context ? { context } : {}) }
      : frontmatter;

  return ProfileSchema.parse(candidate);
}

export function resolveProfilePath(env: NodeJS.ProcessEnv): string {
  const configuredCodexHome = env.CODEX_HOME?.trim();
  const codexHome = configuredCodexHome
    ? configuredCodexHome
    : path.join(env.HOME?.trim() || homedir(), ".codex");

  return path.resolve(codexHome, "repolens", "profile.md");
}

export type InterruptedWorkflow = {
  skill: "learn-project" | "evaluate-idea";
  input: string;
};

export type ProfileContinuation =
  | { mode: "automatic"; workflow: InterruptedWorkflow }
  | {
      mode: "manual";
      workflow: InterruptedWorkflow;
      action: string;
    };

export function createProfileContinuation(
  workflow: InterruptedWorkflow,
  canResumeAutomatically: boolean,
): ProfileContinuation {
  if (canResumeAutomatically) {
    return { mode: "automatic", workflow };
  }

  return {
    mode: "manual",
    workflow,
    action: `Continue ${workflow.skill} with the preserved input: ${workflow.input}`,
  };
}
