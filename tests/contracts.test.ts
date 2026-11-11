import { describe, expect, test } from "vitest";

import {
  ArchitectureModelSchema,
  CoreComponentSchema,
  DiagramResultSchema,
  EvidenceRefSchema,
  LanguageSupportSchema,
  LearningReportStatusSchema,
  RouterResultSchema,
  RunProgressSchema,
  UsageReportSchema,
} from "../src/contracts.js";

const observedEvidence = {
  id: "evidence-package-manifest",
  path: "package.json",
  symbol: "scripts.test",
  observation: "The project exposes a Vitest test command.",
  status: "Observed",
  confidence: "High",
};

const inferredEvidence = {
  id: "evidence-cli-purpose",
  path: "src/cli.ts",
  section: "runRepositoryCli",
  observation: "The CLI is likely the primary user-facing entry point.",
  status: "Inferred",
  confidence: "Medium",
};

const coreComponent = {
  id: "router",
  name: "Repository Router",
  responsibility: "Select the repository workflow from lightweight evidence.",
  whyItMatters: "It prevents expensive analysis before value is established.",
  keyInterfaces: ["RouterResultSchema"],
  dependencies: ["evidence-policy"],
  evidenceIds: ["evidence-router"],
  status: "Observed",
  confidence: "High",
  keyFiles: [
    { path: "skills/learn-project/references/router.md", readingGroup: "Must Read" },
    { path: "src/contracts.ts", readingGroup: "Worth Reading" },
    { path: "README.md", readingGroup: "Reference Only" },
  ],
};

const architectureModel = {
  repository: {
    identity: "github.com/example/repolens",
    revision: "0123456789abcdef0123456789abcdef01234567",
  },
  title: "RepoLens Architecture",
  systemBoundary: "A local Codex plugin and deterministic TypeScript helpers.",
  evidence: [
    {
      id: "evidence-router",
      path: "skills/learn-project/references/router.md",
      observation: "The router selects LEARN, USE, BOTH, or SKIP.",
      status: "Observed",
      confidence: "High",
    },
    {
      id: "evidence-codex",
      path: "plugin.json",
      observation: "Codex hosts the RepoLens skills.",
      status: "Inferred",
      confidence: "Medium",
    },
  ],
  components: [coreComponent],
  entryPoints: [
    {
      id: "learn-project",
      name: "learn-project skill",
      evidenceIds: ["evidence-router"],
      status: "Observed",
      confidence: "High",
    },
  ],
  externalSystems: [
    {
      id: "codex",
      name: "Codex",
      evidenceIds: ["evidence-codex"],
      status: "Inferred",
      confidence: "Medium",
    },
  ],
  relationships: [
    {
      id: "codex-invokes-learn-project",
      from: "codex",
      to: "learn-project",
      label: "invokes",
      evidenceIds: ["evidence-codex"],
      status: "Inferred",
      confidence: "Medium",
    },
    {
      id: "learn-project-uses-router",
      from: "learn-project",
      to: "router",
      label: "routes with",
      evidenceIds: ["evidence-router"],
      status: "Observed",
      confidence: "High",
    },
  ],
};

const useRoute = {
  route: "USE",
  confidence: "High",
  reasons: [
    "The repository directly supports the user's developer-tooling workflow.",
  ],
  profileFit: {
    learningValue: "Low",
    usageValue: "High",
    explanation: "It overlaps known concepts but solves a current workflow need.",
  },
  evidence: [observedEvidence],
  nextWorkflows: ["USAGE"],
};

const usageReport = {
  whatItDoesAndPersonalFit: {
    problem: "Inspect unfamiliar repositories safely.",
    coreCapability: "Routes repository analysis into practical workflows.",
    workflowFit: "Matches the user's repository-review workflow.",
    currentToolOverlap: "Partially overlaps manual source browsing.",
  },
  requirementsAndRisks: {
    prerequisites: ["Node.js 20 or newer"],
    permissions: ["Read access to the repository"],
    cost: "No additional service cost for local analysis.",
    compatibility: "Tested with TypeScript repositories.",
    maintenance: "Confirm the project is still actively maintained.",
    safety: ["Do not execute the analyzed repository."],
  },
  quickStart: {
    officialInstallation: "Follow the project's official installation guide.",
    minimalConfiguration: "Select a repository path.",
    firstUsefulTask: "Request a repository usage assessment.",
    expectedResult: "A recommendation with risks and a next step.",
    verification: "Confirm the report identifies the analyzed revision.",
  },
  recommendation: {
    decision: "USE NOW",
    reason: "It addresses an active workflow need with low adoption cost.",
    smallestNextStep: "Try it on one non-sensitive repository.",
    largestRisk: "Compatibility outside tested languages is best effort.",
  },
};

describe("evidence reference contract", () => {
  test("accepts observed and inferred evidence with optional source refinements", () => {
    expect(EvidenceRefSchema.parse(observedEvidence)).toEqual(observedEvidence);
    expect(EvidenceRefSchema.parse(inferredEvidence)).toEqual(inferredEvidence);
  });

  test.each(["path", "observation", "status", "confidence"])(
    "rejects evidence missing required field %s",
    (field) => {
      const incomplete = { ...observedEvidence } as Record<string, unknown>;
      delete incomplete[field];

      expect(EvidenceRefSchema.safeParse(incomplete).success).toBe(false);
    },
  );

  test.each([
    ["status", "Assumed"],
    ["confidence", "Certain"],
  ])("rejects unsupported %s value %s", (field, value) => {
    expect(
      EvidenceRefSchema.safeParse({
        ...observedEvidence,
        [field]: value,
      }).success,
    ).toBe(false);
  });
});

describe("architecture and core-component contracts", () => {
  test("accepts evidence-backed components, relationships, entry points, and external systems", () => {
    expect(ArchitectureModelSchema.parse(architectureModel)).toEqual(
      architectureModel,
    );
  });

  test.each(["Observed", "Inferred"])(
    "accepts %s architecture findings",
    (status) => {
      expect(
        ArchitectureModelSchema.safeParse({
          ...architectureModel,
          components: [
            {
              ...coreComponent,
              status,
              confidence: status === "Observed" ? "High" : "Medium",
            },
          ],
        }).success,
      ).toBe(true);
    },
  );

  test.each(["Must Read", "Worth Reading", "Reference Only"])(
    "accepts the %s reading group",
    (readingGroup) => {
      expect(
        CoreComponentSchema.safeParse({
          ...coreComponent,
          keyFiles: [{ path: "src/contracts.ts", readingGroup }],
        }).success,
      ).toBe(true);
    },
  );

  test("rejects important model elements without evidence", () => {
    expect(
      ArchitectureModelSchema.safeParse({
        ...architectureModel,
        components: [{ ...coreComponent, evidenceIds: [] }],
      }).success,
    ).toBe(false);

    expect(
      ArchitectureModelSchema.safeParse({
        ...architectureModel,
        relationships: [
          { ...architectureModel.relationships[0], evidenceIds: [] },
        ],
      }).success,
    ).toBe(false);
  });

  test("rejects dangling evidence IDs and relationship endpoints", () => {
    expect(
      ArchitectureModelSchema.safeParse({
        ...architectureModel,
        entryPoints: [
          { ...architectureModel.entryPoints[0], evidenceIds: ["missing"] },
        ],
      }).success,
    ).toBe(false);

    expect(
      ArchitectureModelSchema.safeParse({
        ...architectureModel,
        relationships: [
          { ...architectureModel.relationships[0], to: "missing-node" },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("diagram result contract", () => {
  test("records verified installation recovery when Archify is unavailable", () => {
    expect(
      DiagramResultSchema.safeParse({
        status: "archify-unavailable",
        recoveryAction: "Install Archify from its verified official source.",
        installation: {
          status: "verified",
          source: "https://github.com/tt-a1i/archify",
          steps: ["Follow the official Archify installation instructions."],
        },
      }).success,
    ).toBe(true);
  });

  test.each(["validation-failed", "delivery-failed"])(
    "requires diagnostics and recovery for %s",
    (status) => {
      expect(
        DiagramResultSchema.safeParse({
          status,
          diagnostics: ["Archify rejected the current candidate."],
          recoveryAction: "Repair the reported candidate field and retry.",
        }).success,
      ).toBe(true);
    },
  );

  test("rejects a stale artifact path after failed delivery", () => {
    expect(
      DiagramResultSchema.safeParse({
        status: "delivery-failed",
        diagnostics: ["Atomic delivery failed."],
        recoveryAction: "Resolve the delivery error and retry.",
        artifactPath: "/tmp/last-good.html",
      }).success,
    ).toBe(false);
  });
});

describe("repository router contract", () => {
  test.each([
    ["LEARN", ["LEARNING"]],
    ["USE", ["USAGE"]],
    ["SKIP", []],
  ])("accepts the %s final route", (route, nextWorkflows) => {
    expect(
      RouterResultSchema.safeParse({
        ...useRoute,
        route,
        nextWorkflows,
      }).success,
    ).toBe(true);
  });

  test("requires reasons, evidence, confidence, and Profile fit", () => {
    for (const field of ["reasons", "evidence", "confidence", "profileFit"]) {
      const incomplete = { ...useRoute } as Record<string, unknown>;
      delete incomplete[field];

      expect(RouterResultSchema.safeParse(incomplete).success, field).toBe(false);
    }
  });

  test("orders Usage before Learning for BOTH", () => {
    const both = {
      ...useRoute,
      route: "BOTH",
      profileFit: {
        ...useRoute.profileFit,
        learningValue: "High",
      },
      nextWorkflows: ["USAGE", "LEARNING"],
    };

    expect(RouterResultSchema.safeParse(both).success).toBe(true);
    expect(
      RouterResultSchema.safeParse({
        ...both,
        nextWorkflows: ["LEARNING", "USAGE"],
      }).success,
    ).toBe(false);
  });

  test("requires a recovery attempt before NEEDS_EVIDENCE can be returned", () => {
    const needsEvidence = {
      ...useRoute,
      route: "NEEDS_EVIDENCE",
      confidence: "Low",
      reasons: ["The repository does not expose reliable compatibility information."],
      nextWorkflows: [],
      missingEvidence: ["Supported runtime versions"],
      attemptedSources: ["README.md", "package.json"],
      recoveryAction: "Inspect maintained release documentation.",
    };

    expect(RouterResultSchema.safeParse(needsEvidence).success).toBe(true);

    const withoutRecovery = { ...needsEvidence } as Record<string, unknown>;
    delete withoutRecovery.recoveryAction;
    expect(RouterResultSchema.safeParse(withoutRecovery).success).toBe(false);
  });

  test("rejects routes outside the approved route set", () => {
    expect(
      RouterResultSchema.safeParse({ ...useRoute, route: "REVIEW" }).success,
    ).toBe(false);
  });
});

describe("Usage report contract", () => {
  test("accepts all four fixed Usage sections", () => {
    expect(UsageReportSchema.parse(usageReport)).toEqual(usageReport);
  });

  test.each([
    "whatItDoesAndPersonalFit",
    "requirementsAndRisks",
    "quickStart",
    "recommendation",
  ])("rejects a Usage report missing section %s", (section) => {
    const incomplete = { ...usageReport } as Record<string, unknown>;
    delete incomplete[section];

    expect(UsageReportSchema.safeParse(incomplete).success).toBe(false);
  });

  test.each(["USE NOW", "SAVE FOR LATER", "SKIP"])(
    "accepts recommendation %s",
    (decision) => {
      expect(
        UsageReportSchema.safeParse({
          ...usageReport,
          recommendation: { ...usageReport.recommendation, decision },
        }).success,
      ).toBe(true);
    },
  );

  test("rejects an unsupported recommendation", () => {
    expect(
      UsageReportSchema.safeParse({
        ...usageReport,
        recommendation: {
          ...usageReport.recommendation,
          decision: "MAYBE",
        },
      }).success,
    ).toBe(false);
  });
});

describe("language-support contract", () => {
  test.each(["TypeScript", "Python", "Java"])(
    "marks explicitly covered language %s as tested",
    (primaryLanguage) => {
      expect(
        LanguageSupportSchema.safeParse({
          primaryLanguage,
          status: "tested",
        }).success,
      ).toBe(true);
    },
  );

  test("requires an early disclosure for a best-effort language", () => {
    expect(
      LanguageSupportSchema.safeParse({
        primaryLanguage: "Rust",
        status: "best-effort",
        disclosure:
          "Best Effort: Rust is outside RepoLens V0.1's explicitly tested languages.",
      }).success,
    ).toBe(true);

    expect(
      LanguageSupportSchema.safeParse({
        primaryLanguage: "Rust",
        status: "best-effort",
      }).success,
    ).toBe(false);
  });

  test("rejects claiming tested support for a language outside TypeScript, Python, and Java", () => {
    expect(
      LanguageSupportSchema.safeParse({
        primaryLanguage: "Rust",
        status: "tested",
      }).success,
    ).toBe(false);
  });
});

describe("run progress and partial Learning status contracts", () => {
  test("accepts ordered stage progress with start and completion timestamps", () => {
    const progress = {
      workflow: "USAGE",
      stages: [
        {
          order: 1,
          stage: "What It Does & Personal Fit",
          status: "completed",
          startedAt: "2026-11-09T01:00:00.000Z",
          completedAt: "2026-11-09T01:02:00.000Z",
        },
        {
          order: 2,
          stage: "Requirements & Risks",
          status: "in-progress",
          startedAt: "2026-11-09T01:02:00.000Z",
        },
      ],
    };

    expect(RunProgressSchema.parse(progress)).toEqual(progress);
  });

  test("rejects out-of-order stages and completed stages without completion timestamps", () => {
    const stages = [
      {
        order: 2,
        stage: "Requirements & Risks",
        status: "completed",
        startedAt: "2026-11-09T01:02:00.000Z",
        completedAt: "2026-11-09T01:03:00.000Z",
      },
      {
        order: 1,
        stage: "What It Does & Personal Fit",
        status: "completed",
        startedAt: "2026-11-09T01:00:00.000Z",
      },
    ];

    expect(
      RunProgressSchema.safeParse({ workflow: "USAGE", stages }).success,
    ).toBe(false);
  });

  test("rejects a promised ETA field", () => {
    expect(
      RunProgressSchema.safeParse({
        workflow: "ROUTER",
        stages: [
          {
            order: 1,
            stage: "Route repository",
            status: "in-progress",
            startedAt: "2026-11-09T01:00:00.000Z",
            eta: "2026-11-09T01:05:00.000Z",
          },
        ],
      }).success,
    ).toBe(false);
  });

  test("requires reasons and recovery actions for incomplete Learning stages", () => {
    const partial = {
      status: "incomplete",
      currentStage: "Main Runtime Flow",
      completedStages: ["Architecture", "Core Components"],
      incompleteStages: [
        {
          stage: "Main Runtime Flow",
          reason: "The runtime dispatch target could not be confirmed.",
          recoveryAction: "Inspect integration tests that exercise dispatch.",
        },
      ],
    };

    expect(LearningReportStatusSchema.safeParse(partial).success).toBe(true);

    expect(
      LearningReportStatusSchema.safeParse({
        ...partial,
        incompleteStages: [{ stage: "Main Runtime Flow" }],
      }).success,
    ).toBe(false);
  });
});
