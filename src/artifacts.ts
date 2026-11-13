import { randomUUID } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ArtifactDeliveryResult } from "./contracts.js";

export type ArtifactFileSystem = {
  mkdir(directory: string): Promise<void>;
  writeFile(filePath: string, contents: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
};

export type ArtifactDependencies = {
  fileSystem: ArtifactFileSystem;
  now: () => Date;
  createRunId: () => string;
};

type ValidatedDiagram = {
  status: "validated";
  html: string;
};

type UnavailableDiagram = {
  status: "validation-failed" | "delivery-failed" | "archify-unavailable";
  diagnostics: string[];
};

export type LearningArtifactBundle = {
  repository: {
    identity: string;
    revision: string;
    analyzedPath: string;
  };
  analysisStatus: "complete" | "incomplete";
  reportMarkdown: string;
  diagrams: {
    architecture: ValidatedDiagram | UnavailableDiagram;
    runtimeFlow: ValidatedDiagram | UnavailableDiagram;
  };
};

export type ArtifactDestination =
  | {
      kind: "user-local";
      pluginDataRoot: string;
    }
  | {
      kind: "user-selected";
      directory: string;
    };

const nodeFileSystem: ArtifactFileSystem = {
  async mkdir(directory) {
    await mkdir(directory, { recursive: true });
  },
  async writeFile(filePath, contents) {
    await writeFile(filePath, contents, "utf8");
  },
  async rename(from, to) {
    await rename(from, to);
  },
};

const defaultDependencies: ArtifactDependencies = {
  fileSystem: nodeFileSystem,
  now: () => new Date(),
  createRunId: () => randomUUID(),
};

function sanitizePathSegment(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\.git$/i, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "repository";
}

function repositoryDirectoryName(identity: string): string {
  try {
    const repositoryUrl = new URL(identity);
    return sanitizePathSegment(`${repositoryUrl.hostname}${repositoryUrl.pathname}`);
  } catch {
    return sanitizePathSegment(identity);
  }
}

function timestampDirectoryName(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function runDirectory(
  bundle: LearningArtifactBundle,
  destination: ArtifactDestination,
  now: Date,
  runId: string,
): string {
  const destinationRoot =
    destination.kind === "user-local"
      ? path.join(destination.pluginDataRoot, "learning-runs")
      : destination.directory;
  const repositoryName = repositoryDirectoryName(bundle.repository.identity);
  const runName = `${timestampDirectoryName(now)}-${sanitizePathSegment(runId)}`;

  return path.join(destinationRoot, repositoryName, runName);
}

function isWithin(parent: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

function temporarySibling(finalPath: string, runId: string): string {
  return `${finalPath}.tmp-${sanitizePathSegment(runId)}`;
}

async function publishFile(
  fileSystem: ArtifactFileSystem,
  finalPath: string,
  contents: string,
  runId: string,
): Promise<void> {
  const temporaryPath = temporarySibling(finalPath, runId);
  await fileSystem.writeFile(temporaryPath, contents);
  await fileSystem.rename(temporaryPath, finalPath);
}

function diagramReportValue(
  diagram: ValidatedDiagram | UnavailableDiagram,
  label: string,
  fileName: string,
): string {
  return diagram.status === "validated"
    ? `[${label}](./${fileName})`
    : diagram.status;
}

function renderReport(bundle: LearningArtifactBundle): string {
  return bundle.reportMarkdown
    .replace(
      "{{architecture-diagram}}",
      diagramReportValue(
        bundle.diagrams.architecture,
        "Architecture diagram",
        "architecture.html",
      ),
    )
    .replace(
      "{{runtime-flow-diagram}}",
      diagramReportValue(
        bundle.diagrams.runtimeFlow,
        "Runtime flow diagram",
        "runtime-flow.html",
      ),
    );
}

function sanitizedDeliveryDiagnostic(error: unknown): string {
  if (!(error instanceof Error)) return "Artifact delivery failed.";

  const errorCode = error.message.match(/^([A-Z][A-Z0-9_]+)\b/)?.[1];
  return errorCode === undefined
    ? "Artifact delivery failed."
    : `Artifact delivery failed (${errorCode}).`;
}

export async function saveLearningArtifacts(
  bundle: LearningArtifactBundle,
  destination: ArtifactDestination,
  dependencies: ArtifactDependencies = defaultDependencies,
): Promise<ArtifactDeliveryResult> {
  const runId = dependencies.createRunId();
  const intendedDestination = runDirectory(
    bundle,
    destination,
    dependencies.now(),
    runId,
  );
  const reportPath = path.join(intendedDestination, "report.md");
  const architecturePath = path.join(intendedDestination, "architecture.html");
  const runtimeFlowPath = path.join(intendedDestination, "runtime-flow.html");

  try {
    if (
      destination.kind === "user-local" &&
      isWithin(bundle.repository.analyzedPath, intendedDestination)
    ) {
      throw new Error("DEFAULT_DESTINATION_INSIDE_ANALYZED_REPOSITORY");
    }

    await dependencies.fileSystem.mkdir(intendedDestination);

    const files: {
      report: string;
      architecture?: string;
      runtimeFlow?: string;
    } = { report: reportPath };

    if (bundle.diagrams.architecture.status === "validated") {
      await publishFile(
        dependencies.fileSystem,
        architecturePath,
        bundle.diagrams.architecture.html,
        runId,
      );
      files.architecture = architecturePath;
    }

    if (bundle.diagrams.runtimeFlow.status === "validated") {
      await publishFile(
        dependencies.fileSystem,
        runtimeFlowPath,
        bundle.diagrams.runtimeFlow.html,
        runId,
      );
      files.runtimeFlow = runtimeFlowPath;
    }

    await publishFile(
      dependencies.fileSystem,
      reportPath,
      renderReport(bundle),
      runId,
    );

    return {
      analysisStatus: bundle.analysisStatus,
      artifactStatus: "saved",
      intendedDestination,
      files,
    };
  } catch (error) {
    return {
      analysisStatus: bundle.analysisStatus,
      artifactStatus: "incomplete",
      intendedDestination,
      diagnostics: [sanitizedDeliveryDiagnostic(error)],
      recoveryActions: [
        {
          type: "retry-save",
          label: "Retry saving the current validated Learning Report bundle.",
          usesCurrentRunBundle: true,
        },
      ],
    };
  }
}
