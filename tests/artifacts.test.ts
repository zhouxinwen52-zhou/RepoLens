import path from "node:path";

import { describe, expect, test } from "vitest";

import {
  saveLearningArtifacts,
  type ArtifactDependencies,
  type ArtifactFileSystem,
  type LearningArtifactBundle,
} from "../src/artifacts.js";
import { ArtifactDeliveryResultSchema } from "../src/contracts.js";

type FileOperation =
  | { kind: "mkdir"; path: string }
  | { kind: "write"; path: string; contents: string }
  | { kind: "rename"; from: string; to: string };

function createMemoryFileSystem(options?: {
  failWrite?: (filePath: string) => Error | undefined;
}): ArtifactFileSystem & {
  files: Map<string, string>;
  operations: FileOperation[];
} {
  const files = new Map<string, string>();
  const operations: FileOperation[] = [];

  return {
    files,
    operations,
    async mkdir(directory) {
      operations.push({ kind: "mkdir", path: directory });
    },
    async writeFile(filePath, contents) {
      operations.push({ kind: "write", path: filePath, contents });
      const failure = options?.failWrite?.(filePath);
      if (failure !== undefined) throw failure;
      files.set(filePath, contents);
    },
    async rename(from, to) {
      operations.push({ kind: "rename", from, to });
      const contents = files.get(from);
      if (contents === undefined) throw new Error("Temporary artifact is missing.");
      files.delete(from);
      files.set(to, contents);
    },
  };
}

function createDependencies(
  fileSystem: ArtifactFileSystem,
  runIds: string[] = ["run-001"],
): ArtifactDependencies {
  let runIndex = 0;
  return {
    fileSystem,
    now: () => new Date("2026-11-13T02:00:00.000Z"),
    createRunId: () => runIds[runIndex++] ?? `run-${runIndex}`,
  };
}

const completeBundle: LearningArtifactBundle = {
  repository: {
    identity: "https://github.com/example/repo.git",
    revision: "0123456789abcdef0123456789abcdef01234567",
    analyzedPath: "/workspaces/example-repo",
  },
  analysisStatus: "complete",
  reportMarkdown: [
    "# RepoLens Learning Report",
    "",
    "Architecture: {{architecture-diagram}}",
    "Runtime flow: {{runtime-flow-diagram}}",
    "",
  ].join("\n"),
  diagrams: {
    architecture: {
      status: "validated",
      html: "<html><body>Architecture</body></html>",
    },
    runtimeFlow: {
      status: "validated",
      html: "<html><body>Runtime flow</body></html>",
    },
  },
};

function expectAtomicPublish(
  operations: FileOperation[],
  finalPath: string,
): void {
  const renameIndex = operations.findIndex(
    (operation) => operation.kind === "rename" && operation.to === finalPath,
  );
  expect(renameIndex).toBeGreaterThan(-1);

  const rename = operations[renameIndex];
  if (rename.kind !== "rename") throw new Error("Expected a rename operation.");
  expect(path.dirname(rename.from)).toBe(path.dirname(finalPath));
  expect(rename.from).not.toBe(finalPath);

  const writeIndex = operations.findIndex(
    (operation) => operation.kind === "write" && operation.path === rename.from,
  );
  expect(writeIndex).toBeGreaterThan(-1);
  expect(writeIndex).toBeLessThan(renameIndex);
  expect(
    operations.some(
      (operation) =>
        operation.kind === "write" && operation.path === finalPath,
    ),
  ).toBe(false);
}

describe("Learning artifact lifecycle", () => {
  test("publishes a unique user-local run atomically with sanitized identity and relative diagram links", async () => {
    const fileSystem = createMemoryFileSystem();
    const dependencies = createDependencies(fileSystem, ["run-001", "run-002"]);
    const destination = {
      kind: "user-local" as const,
      pluginDataRoot: "/host/plugin-data",
    };

    const first = await saveLearningArtifacts(
      completeBundle,
      destination,
      dependencies,
    );
    const second = await saveLearningArtifacts(
      completeBundle,
      destination,
      dependencies,
    );

    expect(ArtifactDeliveryResultSchema.safeParse(first).success).toBe(true);
    expect(first).toMatchObject({
      analysisStatus: "complete",
      artifactStatus: "saved",
      files: {
        report: expect.stringMatching(/\/report\.md$/),
        architecture: expect.stringMatching(/\/architecture\.html$/),
        runtimeFlow: expect.stringMatching(/\/runtime-flow\.html$/),
      },
    });
    expect(second.artifactStatus).toBe("saved");
    expect(second.intendedDestination).not.toBe(first.intendedDestination);
    expect(first.intendedDestination).toContain("/host/plugin-data/");
    expect(first.intendedDestination).toContain("github-com-example-repo");
    expect(first.intendedDestination).toContain("run-001");
    expect(first.intendedDestination).not.toContain("https://");
    expect(first.intendedDestination).not.toContain(".git");

    if (first.artifactStatus !== "saved") {
      throw new Error("Expected the first artifact save to succeed.");
    }
    const { architecture, runtimeFlow } = first.files;
    if (architecture === undefined || runtimeFlow === undefined) {
      throw new Error("Expected both validated diagrams to be published.");
    }
    const report = fileSystem.files.get(first.files.report);
    expect(report).toContain("[Architecture diagram](./architecture.html)");
    expect(report).toContain("[Runtime flow diagram](./runtime-flow.html)");
    expect(report).not.toContain("{{architecture-diagram}}");
    expect(report).not.toContain("{{runtime-flow-diagram}}");

    expectAtomicPublish(fileSystem.operations, architecture);
    expectAtomicPublish(fileSystem.operations, runtimeFlow);
    expectAtomicPublish(fileSystem.operations, first.files.report);
    const reportPublishIndex = fileSystem.operations.findIndex(
      (operation) =>
        operation.kind === "rename" && operation.to === first.files.report,
    );
    for (const diagramPath of [architecture, runtimeFlow]) {
      expect(
        fileSystem.operations.findIndex(
          (operation) =>
            operation.kind === "rename" && operation.to === diagramPath,
        ),
      ).toBeLessThan(reportPublishIndex);
    }
    expect(
      fileSystem.operations.some((operation) =>
        "path" in operation
          ? operation.path.startsWith(completeBundle.repository.analyzedPath)
          : operation.from.startsWith(completeBundle.repository.analyzedPath) ||
            operation.to.startsWith(completeBundle.repository.analyzedPath),
      ),
    ).toBe(false);
  });

  test("does not write a diagram artifact after diagram validation failure", async () => {
    const fileSystem = createMemoryFileSystem();
    const bundle: LearningArtifactBundle = {
      ...completeBundle,
      analysisStatus: "incomplete",
      diagrams: {
        ...completeBundle.diagrams,
        runtimeFlow: {
          status: "validation-failed",
          diagnostics: ["steps.1.next: Unknown runtime step ID"],
        },
      },
    };

    const result = await saveLearningArtifacts(
      bundle,
      { kind: "user-local", pluginDataRoot: "/host/plugin-data" },
      createDependencies(fileSystem),
    );

    expect(result).toMatchObject({
      analysisStatus: "incomplete",
      artifactStatus: "saved",
      files: {
        report: expect.stringMatching(/\/report\.md$/),
        architecture: expect.stringMatching(/\/architecture\.html$/),
      },
    });
    if (result.artifactStatus !== "saved") {
      throw new Error("Expected incomplete analysis artifacts to be saved.");
    }
    expect(result.files).not.toHaveProperty("runtimeFlow");
    expect(
      fileSystem.operations.some((operation) =>
        JSON.stringify(operation).includes("runtime-flow.html"),
      ),
    ).toBe(false);
  });

  test("writes below an explicit user-selected destination", async () => {
    const fileSystem = createMemoryFileSystem();

    const result = await saveLearningArtifacts(
      completeBundle,
      {
        kind: "user-selected",
        directory: "/workspaces/example-repo/repolens-output",
      },
      createDependencies(fileSystem),
    );

    expect(result.artifactStatus).toBe("saved");
    expect(result.intendedDestination).toMatch(
      /^\/workspaces\/example-repo\/repolens-output\//,
    );
    expect(
      fileSystem.operations.some((operation) =>
        JSON.stringify(operation).includes(
          "/workspaces/example-repo/repolens-output/",
        ),
      ),
    ).toBe(true);
  });

  test("returns a sanitized retry action and reuses the same bundle at a new destination", async () => {
    const secret = "super-secret-token";
    const failingFileSystem = createMemoryFileSystem({
      failWrite: () =>
        new Error(
          `EACCES: ${secret} at /private/host/account/reports/report.md`,
        ),
    });

    const failed = await saveLearningArtifacts(
      completeBundle,
      { kind: "user-local", pluginDataRoot: "/unwritable/plugin-data" },
      createDependencies(failingFileSystem),
    );

    expect(ArtifactDeliveryResultSchema.safeParse(failed).success).toBe(true);
    expect(failed).toMatchObject({
      analysisStatus: "complete",
      artifactStatus: "incomplete",
      intendedDestination: expect.stringContaining("/unwritable/plugin-data/"),
      diagnostics: expect.arrayContaining([expect.any(String)]),
      recoveryActions: [
        {
          type: "retry-save",
          label: expect.any(String),
          usesCurrentRunBundle: true,
        },
      ],
    });
    expect(JSON.stringify(failed)).not.toContain(secret);
    expect(JSON.stringify(failed)).not.toContain("/private/host/account");
    expect(
      [...failingFileSystem.files.keys()].some((filePath) =>
        filePath.endsWith("/report.md"),
      ),
    ).toBe(false);

    const retryFileSystem = createMemoryFileSystem();
    const retried = await saveLearningArtifacts(
      completeBundle,
      { kind: "user-selected", directory: "/safe/retry" },
      createDependencies(retryFileSystem, ["retry-001"]),
    );

    expect(retried).toMatchObject({
      analysisStatus: "complete",
      artifactStatus: "saved",
      intendedDestination: expect.stringContaining("/safe/retry/"),
    });
    if (retried.artifactStatus !== "saved") {
      throw new Error("Expected retry-save to succeed.");
    }
    expect(retryFileSystem.files.get(retried.files.report)).toContain(
      "# RepoLens Learning Report",
    );
  });
});
