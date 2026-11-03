import path from "node:path";

import { describe, expect, test } from "vitest";

import {
  ProfileSchema,
  createProfileContinuation,
  parseProfile,
  resolveProfilePath,
} from "../src/profile.js";

const validProfile = `---
schemaVersion: 1
experienceLevel: junior
knownTechnologies:
  languages: [TypeScript, Python]
  frameworks: [React]
  concepts: [REST APIs, unit testing]
learningGoals:
  - Understand unfamiliar repository architecture
technicalInterests:
  - developer tooling
careerGoals:
  - Grow into an independent software engineer
portfolioGoals:
  - Build one evidence-backed project
availableHoursPerWeek: 6
explanation:
  language: zh-CN
  depth: balanced
technicalEnglish:
  enabled: true
---
I learn best from one end-to-end flow and a small practice task.
`;

describe("Profile contract", () => {
  test("parses a portable junior-engineer Profile without inventing defaults", () => {
    const profile = parseProfile(validProfile);

    expect(profile).toEqual({
      schemaVersion: 1,
      experienceLevel: "junior",
      knownTechnologies: {
        languages: ["TypeScript", "Python"],
        frameworks: ["React"],
        concepts: ["REST APIs", "unit testing"],
      },
      learningGoals: ["Understand unfamiliar repository architecture"],
      technicalInterests: ["developer tooling"],
      careerGoals: ["Grow into an independent software engineer"],
      portfolioGoals: ["Build one evidence-backed project"],
      availableHoursPerWeek: 6,
      explanation: { language: "zh-CN", depth: "balanced" },
      technicalEnglish: { enabled: true },
      context:
        "I learn best from one end-to-end flow and a small practice task.",
    });
  });

  test.each([
    "experienceLevel",
    "knownTechnologies",
    "learningGoals",
    "technicalInterests",
    "careerGoals",
    "portfolioGoals",
    "availableHoursPerWeek",
    "explanation",
    "technicalEnglish",
  ])("rejects a Profile missing required field %s", (field) => {
    const parsed = parseProfile(validProfile);
    const incomplete = { ...parsed } as Record<string, unknown>;
    delete incomplete[field];

    expect(() => ProfileSchema.parse(incomplete)).toThrow();
  });

  test("rejects unsupported schema versions", () => {
    expect(() =>
      parseProfile(validProfile.replace("schemaVersion: 1", "schemaVersion: 2")),
    ).toThrow(/schemaVersion/i);
  });

  test("rejects empty learning goals", () => {
    expect(() =>
      parseProfile(
        validProfile.replace(
          "learningGoals:\n  - Understand unfamiliar repository architecture",
          "learningGoals: []",
        ),
      ),
    ).toThrow(/learningGoals/i);
  });

  test("rejects an unsupported explanation depth", () => {
    expect(() =>
      parseProfile(validProfile.replace("depth: balanced", "depth: exhaustive")),
    ).toThrow(/depth/i);
  });

  test("allows an empty optional Markdown context", () => {
    const profile = parseProfile(validProfile.replace(/---\nI learn[\s\S]+$/, "---\n"));

    expect(profile.context).toBeUndefined();
  });

  test.each(["apiKey", "token", "password", "credentials", "privateKey"])(
    "rejects credential-like field %s",
    (field) => {
      const unsafe = validProfile.replace(
        "schemaVersion: 1",
        `schemaVersion: 1\n${field}: do-not-store-this`,
      );

      expect(() => parseProfile(unsafe)).toThrow(/credential|secret/i);
    },
  );
});

describe("Profile location", () => {
  test("uses CODEX_HOME when it is configured", () => {
    expect(resolveProfilePath({ CODEX_HOME: "/opt/codex-data" })).toBe(
      path.join("/opt/codex-data", "repolens", "profile.md"),
    );
  });

  test("uses the user's .codex directory by default", () => {
    expect(resolveProfilePath({ HOME: "/Users/example" })).toBe(
      path.join("/Users/example", ".codex", "repolens", "profile.md"),
    );
  });
});

describe("onboarding continuation", () => {
  const originalWorkflow = {
    skill: "learn-project" as const,
    input: "https://github.com/openai/openai-node --focus architecture",
  };

  test("preserves the original workflow input for automatic resume", () => {
    expect(createProfileContinuation(originalWorkflow, true)).toEqual({
      mode: "automatic",
      workflow: originalWorkflow,
    });
  });

  test("returns one context-preserving action when automatic resume is unavailable", () => {
    expect(createProfileContinuation(originalWorkflow, false)).toEqual({
      mode: "manual",
      workflow: originalWorkflow,
      action:
        "Continue learn-project with the preserved input: https://github.com/openai/openai-node --focus architecture",
    });
  });
});
