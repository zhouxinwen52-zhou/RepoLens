import { describe, expect, test } from "vitest";

import { toArchifyArchitecture } from "../src/archify.js";
import { ArchitectureModelSchema } from "../src/contracts.js";

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
