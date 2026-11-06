import { randomUUID } from "node:crypto";
import { access, mkdir, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const processRunId = randomUUID();

export type NormalizedRepositoryUrl = {
  owner: string;
  name: string;
  identity: string;
  canonicalUrl: string;
  cloneUrl: string;
};

export type RepositoryInput =
  | { kind: "local"; path: string }
  | { kind: "github"; url: string };

export type AcquiredRepository = {
  path: string;
  source: "local" | "temporary-clone";
  normalizedUrl?: NormalizedRepositoryUrl;
  commitSha: string;
  ownedByRepoLens: boolean;
  keepRepo?: boolean;
};

export type CleanupResult =
  | { status: "removed"; path: string }
  | { status: "retained"; path: string; reason: "keep-repo" }
  | { status: "skipped"; path: string; reason: "not-owned" }
  | { status: "failed"; path: string; error: string };

export type GitResult = { stdout: string };

export type RepositoryAdapters = {
  resolvePath(input: string): Promise<string>;
  pathExists(input: string): Promise<boolean>;
  makeDirectory(input: string): Promise<void>;
  runGit(args: readonly string[]): Promise<GitResult>;
  removeDirectory(input: string): Promise<void>;
  runId(): string;
};

const defaultAdapters: RepositoryAdapters = {
  resolvePath: realpath,
  async pathExists(input) {
    try {
      await access(input);
      return true;
    } catch {
      return false;
    }
  },
  async makeDirectory(input) {
    await mkdir(input, { recursive: true });
  },
  async runGit(args) {
    const { stdout } = await execFileAsync("git", [...args], {
      encoding: "utf8",
    });
    return { stdout };
  },
  async removeDirectory(input) {
    await rm(input, { recursive: true, force: true });
  },
  runId: () => processRunId,
};

function repositoryParts(pathname: string): { owner: string; name: string } {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 2) {
    throw new Error("GitHub repository URL must contain exactly an owner and repository name.");
  }

  const owner = segments[0];
  const name = segments[1].replace(/\.git$/i, "");
  if (!owner || !name || owner === "." || owner === ".." || name === "." || name === "..") {
    throw new Error("GitHub repository URL contains an invalid owner or repository name.");
  }

  return { owner, name };
}

function normalizedResult(
  owner: string,
  name: string,
  cloneUrl: string,
): NormalizedRepositoryUrl {
  return {
    owner,
    name,
    identity: `github.com/${owner}/${name}`,
    canonicalUrl: `https://github.com/${owner}/${name}`,
    cloneUrl,
  };
}

export function normalizeGitHubUrl(input: string): NormalizedRepositoryUrl {
  const trimmed = input.trim();
  const scpMatch = /^git@github\.com:([^/]+)\/(.+)$/i.exec(trimmed);
  if (scpMatch) {
    const { owner, name } = repositoryParts(`${scpMatch[1]}/${scpMatch[2]}`);
    return normalizedResult(owner, name, `git@github.com:${owner}/${name}`);
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Repository input must be a supported GitHub HTTPS or SSH URL.");
  }

  if (parsed.username && parsed.username !== "git" || parsed.password) {
    throw new Error("GitHub repository URLs must not contain embedded credentials.");
  }
  if (parsed.hostname.toLowerCase() !== "github.com") {
    throw new Error("Only GitHub repository URLs are supported.");
  }
  if (parsed.search || parsed.hash) {
    throw new Error("GitHub repository URLs must not contain query parameters or fragments.");
  }

  const { owner, name } = repositoryParts(parsed.pathname);
  if (parsed.protocol === "https:") {
    return normalizedResult(owner, name, `https://github.com/${owner}/${name}`);
  }
  if (parsed.protocol === "ssh:" && parsed.username === "git") {
    return normalizedResult(owner, name, `ssh://git@github.com/${owner}/${name}`);
  }

  throw new Error("Repository input must be a supported GitHub HTTPS or SSH URL.");
}

async function resolveCommitSha(
  repositoryPath: string,
  adapters: RepositoryAdapters,
): Promise<string> {
  const result = await adapters.runGit([
    "-C",
    repositoryPath,
    "rev-parse",
    "HEAD",
  ]);
  return result.stdout.trim();
}

export async function acquireRepository(
  input: RepositoryInput,
  options: { keepRepo: boolean; tempRoot?: string },
  adapters: RepositoryAdapters = defaultAdapters,
): Promise<AcquiredRepository> {
  if (input.kind === "local") {
    const repositoryPath = await adapters.resolvePath(input.path);
    return {
      path: repositoryPath,
      source: "local",
      commitSha: await resolveCommitSha(repositoryPath, adapters),
      ownedByRepoLens: false,
    };
  }

  const normalizedUrl = normalizeGitHubUrl(input.url);
  const runRoot = path.join(
    options.tempRoot ?? tmpdir(),
    "repolens",
    adapters.runId(),
  );
  const repositoryPath = path.join(
    runRoot,
    `${normalizedUrl.owner}--${normalizedUrl.name}`,
  );

  await adapters.makeDirectory(runRoot);
  if (!(await adapters.pathExists(repositoryPath))) {
    await adapters.runGit([
      "clone",
      "--depth",
      "1",
      "--",
      normalizedUrl.cloneUrl,
      repositoryPath,
    ]);
  }

  return {
    path: repositoryPath,
    source: "temporary-clone",
    normalizedUrl,
    commitSha: await resolveCommitSha(repositoryPath, adapters),
    ownedByRepoLens: true,
    keepRepo: options.keepRepo,
  };
}

export async function releaseRepository(
  repository: AcquiredRepository,
  adapters: RepositoryAdapters = defaultAdapters,
): Promise<CleanupResult> {
  if (!repository.ownedByRepoLens || repository.source === "local") {
    return {
      status: "skipped",
      path: repository.path,
      reason: "not-owned",
    };
  }

  if (repository.keepRepo) {
    return {
      status: "retained",
      path: repository.path,
      reason: "keep-repo",
    };
  }

  try {
    await adapters.removeDirectory(repository.path);
    return { status: "removed", path: repository.path };
  } catch (error) {
    return {
      status: "failed",
      path: repository.path,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
