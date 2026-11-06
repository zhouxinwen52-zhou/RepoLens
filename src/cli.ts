#!/usr/bin/env -S node --import tsx

import path from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

import {
  acquireRepository,
  releaseRepository,
  type AcquiredRepository,
  type RepositoryAdapters,
} from "./repository.js";

export type RepositoryCliIo = {
  writeStdout(value: string): void;
  writeStderr(value: string): void;
};

type RepositoryCliRuntime = {
  tempRoot?: string;
};

function optionValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

function parseRepository(value: string): AcquiredRepository {
  let candidate: unknown;
  try {
    candidate = JSON.parse(value);
  } catch {
    throw new Error("--repository must contain valid JSON.");
  }

  if (candidate === null || typeof candidate !== "object") {
    throw new Error("--repository must contain an acquired repository object.");
  }

  const repository = candidate as Record<string, unknown>;
  if (
    typeof repository.path !== "string" ||
    (repository.source !== "local" && repository.source !== "temporary-clone") ||
    typeof repository.commitSha !== "string" ||
    typeof repository.ownedByRepoLens !== "boolean" ||
    (repository.keepRepo !== undefined && typeof repository.keepRepo !== "boolean")
  ) {
    throw new Error("--repository does not match the acquired repository contract.");
  }

  return candidate as AcquiredRepository;
}

function assertSafeReleasePath(
  repository: AcquiredRepository,
  tempRoot: string,
): void {
  if (!repository.ownedByRepoLens && repository.source === "local") return;

  const ownedRoot = path.resolve(tempRoot, "repolens");
  const candidate = path.resolve(repository.path);
  const relative = path.relative(ownedRoot, candidate);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(
      "Owned temporary repositories must remain inside the RepoLens temporary root.",
    );
  }
}

function writeJson(io: RepositoryCliIo, value: unknown): void {
  io.writeStdout(`${JSON.stringify(value)}\n`);
}

export async function runRepositoryCli(
  args: readonly string[],
  io: RepositoryCliIo,
  adapters?: RepositoryAdapters,
  runtime: RepositoryCliRuntime = {},
): Promise<number> {
  const command = args[0];

  try {
    if (command === "acquire") {
      const localPath = optionValue(args, "--local");
      const url = optionValue(args, "--url");
      if (Boolean(localPath) === Boolean(url)) {
        throw new Error("acquire requires exactly one of --local or --url.");
      }

      const repository = await acquireRepository(
        localPath
          ? { kind: "local", path: localPath }
          : { kind: "github", url: url as string },
        {
          keepRepo: args.includes("--keep-repo"),
          ...(runtime.tempRoot ? { tempRoot: runtime.tempRoot } : {}),
        },
        adapters,
      );
      writeJson(io, { ok: true, command, repository });
      return 0;
    }

    if (command === "release") {
      const serialized = optionValue(args, "--repository");
      if (!serialized) throw new Error("release requires --repository JSON.");
      const repository = parseRepository(serialized);
      assertSafeReleasePath(repository, runtime.tempRoot ?? tmpdir());
      const cleanup = await releaseRepository(repository, adapters);
      writeJson(io, { ok: cleanup.status !== "failed", command, cleanup });
      return cleanup.status === "failed" ? 1 : 0;
    }

    throw new Error("Expected one narrow helper command: acquire or release.");
  } catch (error) {
    writeJson(io, {
      ok: false,
      ...(command ? { command } : {}),
      error: error instanceof Error ? error.message : String(error),
    });
    return 1;
  }
}

async function main(): Promise<void> {
  process.exitCode = await runRepositoryCli(process.argv.slice(2), {
    writeStdout: (value) => process.stdout.write(value),
    writeStderr: (value) => process.stderr.write(value),
  });
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  await main();
}
