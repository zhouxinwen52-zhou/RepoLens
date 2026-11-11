import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { toArchifyArchitecture } from "../src/archify.js";
import { ArchitectureModelSchema } from "../src/contracts.js";

type ArchifyReceipt = {
  ok?: boolean;
  validation?: {
    checksPassed?: number;
    checkCount?: number;
    errors?: number;
    warnings?: number;
  };
};

function runArchify(
  archifyDirectory: string,
  args: string[],
): { stdout: string; stderr: string } {
  const executable = path.join(archifyDirectory, "bin", "archify.mjs");
  const result = spawnSync(process.execPath, [executable, ...args], {
    cwd: archifyDirectory,
    encoding: "utf8",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `Archify ${args[0]} failed with exit ${String(result.status)}:\n${result.stdout}${result.stderr}`,
    );
  }

  return { stdout: result.stdout, stderr: result.stderr };
}

function parseReceipt(stdout: string, command: string): ArchifyReceipt {
  try {
    return JSON.parse(stdout) as ArchifyReceipt;
  } catch (error) {
    throw new Error(`Archify ${command} returned invalid JSON`, { cause: error });
  }
}

async function main(): Promise<void> {
  const configuredDirectory = process.env.REPOLENS_ARCHIFY_DIR;
  if (!configuredDirectory) {
    throw new Error(
      "REPOLENS_ARCHIFY_DIR is required; real integration acceptance never skips",
    );
  }

  const archifyDirectory = path.resolve(configuredDirectory);
  await stat(path.join(archifyDirectory, "SKILL.md"));
  runArchify(archifyDirectory, ["doctor"]);

  const model = ArchitectureModelSchema.parse({
    repository: {
      identity: "repolens-integration-fixture",
      revision: "0123456789abcdef0123456789abcdef01234567",
    },
    title: "RepoLens Integration",
    systemBoundary: "A compact adapter verification fixture.",
    evidence: [
      {
        id: "evidence-ingest",
        path: "src/input.ts",
        observation: "Input enters the fixture.",
        status: "Observed",
        confidence: "High",
      },
      {
        id: "evidence-store",
        path: "src/store.ts",
        observation: "The fixture stores validated output.",
        status: "Observed",
        confidence: "High",
      },
    ],
    components: [
      {
        id: "ingest",
        name: "Input",
        responsibility: "Accept input.",
        whyItMatters: "It starts the flow.",
        keyInterfaces: ["accept"],
        dependencies: [],
        evidenceIds: ["evidence-ingest"],
        status: "Observed",
        confidence: "High",
        keyFiles: [{ path: "src/input.ts", readingGroup: "Must Read" }],
      },
      {
        id: "store",
        name: "Store",
        responsibility: "Save output.",
        whyItMatters: "It makes the result observable.",
        keyInterfaces: ["save"],
        dependencies: ["ingest"],
        evidenceIds: ["evidence-store"],
        status: "Observed",
        confidence: "High",
        keyFiles: [{ path: "src/store.ts", readingGroup: "Must Read" }],
      },
    ],
    entryPoints: [],
    externalSystems: [],
    relationships: [
      {
        id: "ingest-writes-store",
        from: "ingest",
        to: "store",
        label: "writes",
        evidenceIds: ["evidence-ingest", "evidence-store"],
        status: "Observed",
        confidence: "High",
      },
    ],
  });

  const workspace = await mkdtemp(path.join(tmpdir(), "repolens-archify-"));
  const candidatePath = path.join(workspace, "candidate.json");
  const outputPath = path.join(workspace, "architecture.html");

  try {
    await writeFile(
      candidatePath,
      `${JSON.stringify(toArchifyArchitecture(model), null, 2)}\n`,
      "utf8",
    );

    const validation = parseReceipt(
      runArchify(archifyDirectory, [
        "validate",
        "architecture",
        candidatePath,
        "--quality",
        "showcase",
        "--json",
      ]).stdout,
      "validate",
    );
    if (!validation.ok) throw new Error("Archify validation did not pass");

    const delivery = parseReceipt(
      runArchify(archifyDirectory, [
        "deliver",
        "architecture",
        candidatePath,
        outputPath,
        "--quality",
        "showcase",
        "--json",
      ]).stdout,
      "deliver",
    );
    if (
      !delivery.ok ||
      delivery.validation?.checksPassed !== 9 ||
      delivery.validation.checkCount !== 9 ||
      delivery.validation.errors !== 0 ||
      delivery.validation.warnings !== 0
    ) {
      throw new Error("Archify delivery receipt did not meet showcase acceptance");
    }

    const artifact = await stat(outputPath);
    if (!artifact.isFile() || artifact.size === 0) {
      throw new Error("Archify did not produce a non-empty HTML artifact");
    }

    process.stdout.write(
      `Archify integration PASS: 9/9 checks, 0 errors, 0 warnings, ${artifact.size} HTML bytes\n`,
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

void main();
