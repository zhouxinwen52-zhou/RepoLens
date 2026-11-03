import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { describe, expect, test } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");

const expectedSkillNames = [
  "evaluate-idea",
  "learn-project",
  "setup-profile",
] as const;

const manifestSchema = z.object({
  $schema: z.literal(
    "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  ),
  name: z.literal("repolens"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().min(1),
  author: z.object({
    name: z.string().min(1),
  }),
  license: z.literal("MIT"),
  extensions: z.object({
    "com.openai": z.object({
      onboardingSkill: z.literal("./skills/setup-profile/SKILL.md"),
      interface: z.object({
        displayName: z.string().min(1),
        shortDescription: z.string().min(1),
        longDescription: z.string().min(1),
        developerName: z.string().min(1),
      }),
    }),
  }),
});

const skillFrontmatterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

const skillAgentSchema = z.object({
  interface: z.object({
    display_name: z.string().min(1),
    short_description: z.string().min(1),
  }),
});

async function readJson(relativePath: string): Promise<unknown> {
  const contents = await readFile(path.join(projectRoot, relativePath), "utf8");
  return JSON.parse(contents) as unknown;
}

async function pathExists(relativePath: string): Promise<boolean> {
  try {
    await stat(path.join(projectRoot, relativePath));
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function parseSkillFrontmatter(contents: string): unknown {
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/);
  expect(match, "SKILL.md must have frontmatter and a non-empty body").not.toBeNull();
  return parseYaml(match![1]);
}

function collectObjectKeys(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectObjectKeys);
  }
  if (value === null || typeof value !== "object") {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...collectObjectKeys(child),
  ]);
}

describe("RepoLens plugin package", () => {
  test("provides every required Day 1 root file", async () => {
    const requiredFiles = [
      "plugin.json",
      "package.json",
      "tsconfig.json",
      "README.md",
      "LICENSE",
    ];

    const existence = await Promise.all(requiredFiles.map(pathExists));

    expect(existence).toEqual(requiredFiles.map(() => true));
  });

  test("uses the canonical portable manifest with setup-profile onboarding", async () => {
    const manifest = manifestSchema.parse(await readJson("plugin.json"));

    expect(
      await pathExists(manifest.extensions["com.openai"].onboardingSkill),
    ).toBe(true);
  });

  test("discovers exactly the three V0.1 skills with valid metadata", async () => {
    const skillsRoot = path.join(projectRoot, "skills");
    const entries = await readdir(skillsRoot, { withFileTypes: true });
    const skillNames = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => entry.name)
      .sort();

    expect(skillNames).toEqual([...expectedSkillNames]);

    for (const skillName of skillNames) {
      const skillRoot = path.join(skillsRoot, skillName);
      const skillContents = await readFile(
        path.join(skillRoot, "SKILL.md"),
        "utf8",
      );
      const frontmatter = skillFrontmatterSchema.parse(
        parseSkillFrontmatter(skillContents),
      );
      const agentMetadata = skillAgentSchema.parse(
        parseYaml(
          await readFile(path.join(skillRoot, "agents/openai.yaml"), "utf8"),
        ),
      );

      expect(frontmatter.name).toBe(skillName);
      expect(agentMetadata.interface.display_name).not.toBe("");
    }
  });

  test("does not bundle excluded V0.1 runtime surfaces", async () => {
    const forbiddenPaths = [
      ".codex-plugin/plugin.json",
      ".mcp.json",
      ".app.json",
      "mcp.json",
      "hooks",
      "server.ts",
      "src/server.ts",
    ];

    const existence = await Promise.all(forbiddenPaths.map(pathExists));

    expect(existence).toEqual(forbiddenPaths.map(() => false));
  });

  test("does not configure telemetry or a RepoLens-operated service", async () => {
    const manifest = await readJson("plugin.json");
    const normalizedKeys = collectObjectKeys(manifest).map((key) =>
      key.toLowerCase(),
    );

    expect(normalizedKeys).not.toContain("telemetry");
    expect(normalizedKeys).not.toContain("analytics");
    expect(normalizedKeys).not.toContain("endpoint");
    expect(normalizedKeys).not.toContain("mcpservers");
    expect(normalizedKeys).not.toContain("apps");
    expect(normalizedKeys).not.toContain("hooks");
  });
});
