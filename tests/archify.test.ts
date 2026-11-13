import { describe, expect, test } from "vitest";

import { toArchifyArchitecture, toArchifyRuntimeFlow } from "../src/archify.js";
import {
  ArchitectureModelSchema,
  RuntimeFlowModelSchema,
} from "../src/contracts.js";

const model = ArchitectureModelSchema.parse({
  repository: {
    identity: "https://github.com/example/repolens",
    revision: "0123456789abcdef0123456789abcdef01234567",
  },
  title: "RepoLens Architecture",
  systemBoundary: "A local Codex plugin and deterministic TypeScript helpers.",
  evidence: [
    {
      id: "evidence-router",
      path: "skills/learn-project/references/router.md",
      observation: "The router selects the next repository workflow.",
      status: "Observed",
      confidence: "High",
    },
    {
      id: "evidence-host",
      path: "plugin.json",
      observation: "Codex hosts the RepoLens skills.",
      status: "Inferred",
      confidence: "Medium",
    },
  ],
  components: [
    {
      id: "router",
      name: "Repository Router",
      responsibility: "Select the next workflow.",
      whyItMatters: "It avoids unnecessary deep analysis.",
      keyInterfaces: ["RouterResultSchema"],
      dependencies: ["evidence-policy"],
      evidenceIds: ["evidence-router"],
      status: "Observed",
      confidence: "High",
      keyFiles: [
        {
          path: "skills/learn-project/references/router.md",
          readingGroup: "Must Read",
        },
      ],
    },
  ],
  entryPoints: [
    {
      id: "learn-project",
      name: "learn-project",
      evidenceIds: ["evidence-router"],
      status: "Observed",
      confidence: "High",
    },
  ],
  externalSystems: [
    {
      id: "codex",
      name: "Codex",
      evidenceIds: ["evidence-host"],
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
      evidenceIds: ["evidence-host"],
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
});

describe("Archify architecture adapter", () => {
  test("creates a fresh architecture spec from the RepoLens model", () => {
    const first = toArchifyArchitecture(model);
    const second = toArchifyArchitecture(model);

    expect(first).not.toBe(second);
    expect(first).toMatchObject({
      schema_version: 1,
      diagram_type: "architecture",
      meta: {
        title: "RepoLens Architecture",
        quality_profile: "showcase",
        repository: {
          url: "https://github.com/example/repolens",
          revision: "0123456789abcdef0123456789abcdef01234567",
        },
      },
    });
  });

  test("provides a renderable initial grid instead of topology-only nodes", () => {
    const spec = toArchifyArchitecture(model);

    expect(spec.layout).toMatchObject({
      mode: "grid",
      cols: expect.any(Number),
      cellW: expect.any(Number),
      cellH: expect.any(Number),
    });
    expect(spec.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          row: expect.any(Number),
          col: expect.any(Number),
          size: [expect.any(Number), expect.any(Number)],
        }),
      ]),
    );
  });

  test("maps components, entry points, external systems, and relationships", () => {
    const spec = toArchifyArchitecture(model);

    expect(spec.components.map((component) => component.id)).toEqual([
      "router",
      "learn-project",
      "codex",
    ]);
    expect(spec.connections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "codex-invokes-learn-project",
          from: "codex",
          to: "learn-project",
          label: "invokes",
        }),
      ]),
    );
  });

  test("maps verified component evidence to sources without inventing connection fields", () => {
    const spec = toArchifyArchitecture(model);
    const router = spec.components.find((component) => component.id === "router");
    const connection = spec.connections?.find(
      (candidate) => candidate.id === "learn-project-uses-router",
    );

    expect(router?.sources).toEqual([
      {
        path: "skills/learn-project/references/router.md",
      },
    ]);
    expect(connection).not.toHaveProperty("evidenceIds");
    expect(connection).not.toHaveProperty("sources");
  });
});

describe("Archify runtime-flow adapter", () => {
  test("selects the explicit flow shape and preserves ordered runtime edges", () => {
    const runtime = RuntimeFlowModelSchema.parse({
      repository: model.repository,
      title: "Repository routing flow",
      flowShape: "sequence",
      evidence: model.evidence,
      trigger: {
        participant: "learner",
        file: "skills/learn-project/SKILL.md",
        symbol: "learn-project",
        input: "A repository path",
        action: "Start repository analysis",
        evidenceIds: ["evidence-router"],
      },
      participants: [
        { id: "learner", name: "Repository learner", boundary: "external" },
        { id: "router", name: "Repository router", boundary: "internal" },
        { id: "workflow", name: "Learning workflow", boundary: "internal" },
      ],
      steps: [
        {
          id: "route",
          order: 1,
          participant: "router",
          file: "skills/learn-project/references/router.md",
          symbol: "route repository",
          input: "Repository evidence",
          action: "Select the learning route",
          output: "LEARN",
          next: "start-learning",
          evidenceIds: ["evidence-router"],
          confidence: "High",
          stateChanges: ["The selected route becomes LEARN."],
        },
        {
          id: "start-learning",
          order: 2,
          participant: "workflow",
          file: "skills/learn-project/references/router.md",
          symbol: "LEARN",
          input: "LEARN route",
          action: "Start the Learning Workflow",
          output: "Architecture analysis begins",
          next: null,
          evidenceIds: ["evidence-router"],
          confidence: "Medium",
          dynamicDispatch: {
            mechanism: "Route-selected workflow",
            uncertainty: "The host performs the concrete skill dispatch.",
            evidenceIds: ["evidence-router"],
          },
        },
      ],
      finalResult: {
        stepId: "start-learning",
        participant: "learner",
        observableResult: "The Learning Workflow begins.",
        evidenceIds: ["evidence-router"],
      },
    });

    const result = toArchifyRuntimeFlow(runtime);

    expect(result).toMatchObject({
      status: "ready",
      spec: {
        diagram_type: "sequence",
        meta: { title: "Repository routing flow" },
      },
    });
    if (result.status !== "ready") throw new Error("Expected a ready spec");
    expect(result.spec.components.map((component) => component.id)).toEqual([
      "learner",
      "router",
      "workflow",
    ]);
    expect(result.spec.connections?.map((connection) => connection.id)).toEqual([
      "route",
      "start-learning",
    ]);
    expect(result.spec.connections?.[0]).toMatchObject({
      from: "router",
      to: "workflow",
      label: "Select the learning route",
      stateChanges: ["The selected route becomes LEARN."],
      confidence: "High",
    });
    expect(result.spec.components[0]).toMatchObject({ boundary: "external" });
  });

  test("returns diagnostics instead of a successful spec when conversion validation fails", () => {
    const invalidRuntime = {
      repository: model.repository,
      title: "Broken runtime flow",
      flowShape: "workflow",
      evidence: model.evidence,
      trigger: {
        participant: "missing-participant",
        file: "src/missing.ts",
        symbol: "missing",
        input: "Unknown",
        action: "Start",
        evidenceIds: ["evidence-router"],
      },
      participants: [],
      steps: [],
      finalResult: {
        stepId: "missing-step",
        participant: "missing-participant",
        observableResult: "Unknown",
        evidenceIds: ["evidence-router"],
      },
    };

    expect(toArchifyRuntimeFlow(invalidRuntime)).toMatchObject({
      status: "validation-failed",
      diagnostics: expect.arrayContaining([expect.any(String)]),
    });
  });
});
