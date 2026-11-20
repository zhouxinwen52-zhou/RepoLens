import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

import {
  ExpectedPropertiesSchema,
  IdeaCaseSchema,
} from "../evals/config.js";
import { parseProfile } from "../src/profile.js";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const fixturesRoot = path.join(repositoryRoot, "evals", "fixtures");
const expectedRoot = path.join(repositoryRoot, "evals", "expected");
const ideaCasesRoot = path.join(repositoryRoot, "evals", "cases", "ideas");

const fixtureIds = [
  "simple-web-service",
  "rag-app",
  "mcp-server",
  "agent-project",
  "unfamiliar-system",
] as const;

const ideaCaseIds = [
  "build-evidence-map",
  "prototype-gap-explorer",
  "save-team-dashboard",
  "skip-generic-summary",
] as const;

async function loadExpectedProperties(fixtureId: string) {
  const manifestPath = path.join(expectedRoot, `${fixtureId}.json`);
  const contents = await readFile(manifestPath, "utf8");
  return ExpectedPropertiesSchema.parse(JSON.parse(contents));
}

function resolveFixtureFile(fixtureRoot: string, relativePath: string): string {
  const resolved = path.resolve(fixtureRoot, relativePath);
  const relative = path.relative(fixtureRoot, resolved);

  expect(relative).not.toBe("");
  expect(relative.startsWith("..") || path.isAbsolute(relative)).toBe(false);
  return resolved;
}

describe("repository evaluation fixtures", () => {
  test.each(fixtureIds)(
    "%s declares immutable local ground truth and semantic expectations",
    async (fixtureId) => {
      const expected = await loadExpectedProperties(fixtureId);

      expect(expected.fixture).toEqual({
        id: fixtureId,
        source: "local",
        immutable: true,
      });
      expect(expected.hardInvariants.primaryLanguage).toMatch(
        /^(TypeScript|Python|Java)$/,
      );
      expect(expected.hardInvariants.entryPoints.length).toBeGreaterThan(0);
      expect(expected.hardInvariants.requiredFlowEdges.length).toBeGreaterThan(0);
      expect(expected.hardInvariants.allowedFlowEdges).toEqual(
        expect.arrayContaining(expected.hardInvariants.requiredFlowEdges),
      );
      expect(expected.hardInvariants.highValueFiles.length).toBeGreaterThan(0);
      expect(expected.hardInvariants.forbiddenClaims.length).toBeGreaterThan(0);
      expect(expected.hardInvariants.forbiddenPatterns.length).toBeGreaterThan(0);
      expect(expected.softExpectations.architectureThemes.length).toBeGreaterThan(0);
      expect(expected.softExpectations.coreComponents.length).toBeGreaterThan(0);
      expect(expected.softExpectations.importantConcepts.length).toBeGreaterThan(0);
      expect(expected.softExpectations.recommendedTerms.length).toBeGreaterThan(0);
      expect(expected.softExpectations.acceptableVariations).toBeDefined();
      expect(expected.profileExpectations).toMatchObject({
        stableFactsAcrossProfiles: true,
        factInvariants: expect.arrayContaining([
          "entryPoints",
          "requiredFlowEdges",
          "highValueFiles",
          "forbiddenClaims",
        ]),
      });
      expect(expected.profileExpectations.cases).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            technicalEnglish: "Skipped by Profile",
          }),
          expect.objectContaining({
            noDefensibleNewConcept: true,
            expectedPracticeType: "Reinforcement",
          }),
        ]),
      );
    },
  );

  test.each(fixtureIds)(
    "%s resolves its entry points and high-value files inside the local fixture",
    async (fixtureId) => {
      const expected = await loadExpectedProperties(fixtureId);
      const fixtureRoot = path.join(fixturesRoot, fixtureId);

      const fixtureStats = await stat(fixtureRoot);
      expect(fixtureStats.isDirectory()).toBe(true);

      const referencedFiles = [
        ...expected.hardInvariants.entryPoints.map((entryPoint) => entryPoint.path),
        ...expected.hardInvariants.highValueFiles,
        ...expected.hardInvariants.allowedFlowEdges.flatMap(
          (edge) => edge.evidencePaths,
        ),
      ];

      for (const relativePath of referencedFiles) {
        const filePath = resolveFixtureFile(fixtureRoot, relativePath);
        const fileStats = await stat(filePath);
        expect(fileStats.isFile()).toBe(true);
      }
    },
  );

  test.each(fixtureIds)(
    "%s references valid local Profile cases",
    async (fixtureId) => {
      const expected = await loadExpectedProperties(fixtureId);

      for (const profileCase of expected.profileExpectations.cases) {
        const profilePath = resolveFixtureFile(
          path.join(repositoryRoot, "evals"),
          profileCase.profilePath,
        );
        const profile = await readFile(profilePath, "utf8");
        expect(parseProfile(profile)).toMatchObject({ schemaVersion: 1 });
      }
    },
  );
});

describe("idea evaluation cases", () => {
  test("cover all four decisions without requiring exact rubric scores", async () => {
    const cases = await Promise.all(
      ideaCaseIds.map(async (caseId) => {
        const contents = await readFile(path.join(ideaCasesRoot, `${caseId}.json`), "utf8");
        return IdeaCaseSchema.parse(JSON.parse(contents));
      }),
    );

    expect(cases.map((ideaCase) => ideaCase.expected.decision).sort()).toEqual([
      "BUILD",
      "PROTOTYPE",
      "SAVE",
      "SKIP",
    ]);
    for (const ideaCase of cases) {
      expect(ideaCase.expected).not.toHaveProperty("exactScores");
      expect(ideaCase.expected.requireSmallestUsefulScope).toBe(true);
      expect(ideaCase.expected.requireNextAction).toBe(true);
      expect(ideaCase.research.mustRequestConsentBeforeLookup).toBe(true);
    }
  });

  test("keeps declined research unknown and requires contextual critical unknowns", async () => {
    for (const caseId of ideaCaseIds) {
      const contents = await readFile(path.join(ideaCasesRoot, `${caseId}.json`), "utf8");
      const ideaCase = IdeaCaseSchema.parse(JSON.parse(contents));

      if (ideaCase.research.consent === "declined") {
        expect(ideaCase.research.externalLookupPerformed).toBe(false);
        expect(ideaCase.expected.unknownDimensions).toContain("Novelty");
      }

      if (ideaCase.expected.criticalUnknown !== null) {
        expect(ideaCase.expected.criticalUnknown).toMatchObject({
          nameRequired: true,
          reasonRequired: true,
          verificationRequired: true,
        });
      }
    }
  });

  test("allows BUILD only with known alignment and feasibility and no critical unknown", async () => {
    const contents = await readFile(
      path.join(ideaCasesRoot, "build-evidence-map.json"),
      "utf8",
    );
    const buildCase = IdeaCaseSchema.parse(JSON.parse(contents));

    expect(buildCase.expected.decision).toBe("BUILD");
    expect(buildCase.expected.requiredKnownDimensions).toEqual(
      expect.arrayContaining(["Goal Alignment", "Feasibility"]),
    );
    expect(buildCase.expected.criticalUnknown).toBeNull();
  });
});
