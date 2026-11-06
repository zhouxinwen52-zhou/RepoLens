import path from "node:path";

import { describe, expect, test, vi } from "vitest";

import { runRepositoryCli } from "../src/cli.js";

import {
  acquireRepository,
  normalizeGitHubUrl,
  releaseRepository,
  type AcquiredRepository,
  type RepositoryAdapters,
} from "../src/repository.js";

function createAdapters(overrides: Partial<RepositoryAdapters> = {}) {
  const existingPaths = new Set<string>();
  const runGit = vi.fn(
    async (args: readonly string[]): Promise<{ stdout: string }> => {
      if (args[0] === "clone") {
        existingPaths.add(args.at(-1) as string);
        return { stdout: "" };
      }

      if (args.includes("rev-parse")) {
        return { stdout: "0123456789abcdef0123456789abcdef01234567\n" };
      }

      throw new Error(`Unexpected git arguments: ${args.join(" ")}`);
    },
  );

  const adapters: RepositoryAdapters = {
    resolvePath: vi.fn(async (input: string) => path.resolve(input)),
    pathExists: vi.fn(async (input: string) => existingPaths.has(input)),
    makeDirectory: vi.fn(async (input: string) => {
      existingPaths.add(input);
    }),
    runGit,
    removeDirectory: vi.fn(async (input: string) => {
      existingPaths.delete(input);
    }),
    runId: () => "run-42",
    ...overrides,
  };

  return { adapters, existingPaths, runGit };
}

describe("GitHub URL normalization", () => {
  test.each([
    {
      input: "https://github.com/openai/openai-node.git",
      cloneUrl: "https://github.com/openai/openai-node",
    },
    {
      input: "git@github.com:openai/openai-node.git",
      cloneUrl: "git@github.com:openai/openai-node",
    },
    {
      input: "ssh://git@github.com/openai/openai-node.git",
      cloneUrl: "ssh://git@github.com/openai/openai-node",
    },
  ])("normalizes $input without changing its repository identity", ({ input, cloneUrl }) => {
    expect(normalizeGitHubUrl(input)).toEqual({
      owner: "openai",
      name: "openai-node",
      identity: "github.com/openai/openai-node",
      canonicalUrl: "https://github.com/openai/openai-node",
      cloneUrl,
    });
  });

  test.each([
    "https://gitlab.com/openai/openai-node",
    "git@example.com:openai/openai-node.git",
    "https://example.com/openai/openai-node",
  ])("rejects non-GitHub repository URL %s", (input) => {
    expect(() => normalizeGitHubUrl(input)).toThrow(/GitHub/i);
  });

  test.each([
    "https://token@github.com/openai/openai-node.git",
    "https://user:password@github.com/openai/openai-node.git",
    "ssh://user:password@github.com/openai/openai-node.git",
  ])("rejects embedded credentials in %s", (input) => {
    expect(() => normalizeGitHubUrl(input)).toThrow(/credential/i);
  });
});

describe("repository acquisition", () => {
  test("preserves a local repository path and records its current commit", async () => {
    const { adapters, runGit } = createAdapters({
      resolvePath: vi.fn(async () => "/work/user-project"),
    });

    const acquired = await acquireRepository(
      { kind: "local", path: "./user-project" },
      { keepRepo: false },
      adapters,
    );

    expect(acquired).toEqual({
      path: "/work/user-project",
      source: "local",
      commitSha: "0123456789abcdef0123456789abcdef01234567",
      ownedByRepoLens: false,
    });
    expect(runGit).toHaveBeenCalledWith([
      "-C",
      "/work/user-project",
      "rev-parse",
      "HEAD",
    ]);
    expect(runGit).not.toHaveBeenCalledWith(
      expect.arrayContaining(["clone"]),
    );
  });

  test("uses the exact shallow-clone argument boundary for a GitHub URL", async () => {
    const { adapters, runGit } = createAdapters();

    const acquired = await acquireRepository(
      { kind: "github", url: "https://github.com/openai/openai-node.git" },
      { keepRepo: false, tempRoot: "/tmp/custom-root" },
      adapters,
    );

    expect(acquired.path).toMatch(
      /^\/tmp\/custom-root\/repolens\/run-42\//,
    );
    expect(runGit).toHaveBeenCalledWith([
      "clone",
      "--depth",
      "1",
      "--",
      "https://github.com/openai/openai-node",
      acquired.path,
    ]);
    expect(acquired).toMatchObject({
      source: "temporary-clone",
      normalizedUrl: {
        identity: "github.com/openai/openai-node",
        canonicalUrl: "https://github.com/openai/openai-node",
      },
      commitSha: "0123456789abcdef0123456789abcdef01234567",
      ownedByRepoLens: true,
    });
  });

  test("reuses one normalized repository identity within the same run", async () => {
    const { adapters, runGit } = createAdapters();

    const first = await acquireRepository(
      { kind: "github", url: "https://github.com/openai/openai-node.git" },
      { keepRepo: false, tempRoot: "/tmp" },
      adapters,
    );
    const second = await acquireRepository(
      { kind: "github", url: "git@github.com:openai/openai-node.git" },
      { keepRepo: false, tempRoot: "/tmp" },
      adapters,
    );

    expect(second.path).toBe(first.path);
    expect(second.normalizedUrl?.identity).toBe(first.normalizedUrl?.identity);
    expect(
      runGit.mock.calls.filter(([args]) => args[0] === "clone"),
    ).toHaveLength(1);
  });
});

describe("repository release", () => {
  const temporaryRepository: AcquiredRepository = {
    path: "/tmp/repolens/run-42/openai--openai-node",
    source: "temporary-clone",
    normalizedUrl: {
      owner: "openai",
      name: "openai-node",
      identity: "github.com/openai/openai-node",
      canonicalUrl: "https://github.com/openai/openai-node",
      cloneUrl: "https://github.com/openai/openai-node",
    },
    commitSha: "0123456789abcdef0123456789abcdef01234567",
    ownedByRepoLens: true,
    keepRepo: false,
  };

  test.each(["success", "failure"])(
    "removes an owned temporary clone after simulated analysis %s",
    async (outcome) => {
      const { adapters } = createAdapters();
      let analysisError: Error | undefined;
      let cleanupResult;

      try {
        if (outcome === "failure") throw new Error("analysis failed");
      } catch (error) {
        analysisError = error as Error;
      } finally {
        cleanupResult = await releaseRepository(temporaryRepository, adapters);
      }

      expect(adapters.removeDirectory).toHaveBeenCalledWith(
        temporaryRepository.path,
      );
      expect(cleanupResult).toEqual({
        status: "removed",
        path: temporaryRepository.path,
      });
      if (outcome === "failure") {
        expect(analysisError?.message).toBe("analysis failed");
      }
    },
  );

  test("retains a temporary clone when keepRepo is requested", async () => {
    const { adapters } = createAdapters();
    const retained = { ...temporaryRepository, keepRepo: true };

    await expect(releaseRepository(retained, adapters)).resolves.toEqual({
      status: "retained",
      path: retained.path,
      reason: "keep-repo",
    });
    expect(adapters.removeDirectory).not.toHaveBeenCalled();
  });

  test("never removes a local repository even if release is requested", async () => {
    const { adapters } = createAdapters();
    const localRepository: AcquiredRepository = {
      path: "/work/user-project",
      source: "local",
      commitSha: "0123456789abcdef0123456789abcdef01234567",
      ownedByRepoLens: false,
      keepRepo: false,
    };

    await expect(releaseRepository(localRepository, adapters)).resolves.toEqual({
      status: "skipped",
      path: localRepository.path,
      reason: "not-owned",
    });
    expect(adapters.removeDirectory).not.toHaveBeenCalled();
  });

  test("returns cleanup diagnostics instead of masking an analysis failure", async () => {
    const cleanupError = new Error("permission denied while cleaning up");
    const { adapters } = createAdapters({
      removeDirectory: vi.fn(async () => {
        throw cleanupError;
      }),
    });
    const analysisError = new Error("analysis failed");

    const cleanupResult = await releaseRepository(
      temporaryRepository,
      adapters,
    );

    expect(cleanupResult).toEqual({
      status: "failed",
      path: temporaryRepository.path,
      error: "permission denied while cleaning up",
    });
    expect(analysisError.message).toBe("analysis failed");
  });
});

describe("repository helper CLI", () => {
  function createIo() {
    const stdout: string[] = [];
    const stderr: string[] = [];
    return {
      stdout,
      stderr,
      io: {
        writeStdout: (value: string) => stdout.push(value),
        writeStderr: (value: string) => stderr.push(value),
      },
    };
  }

  test("acquire emits one machine-readable JSON result", async () => {
    const { adapters } = createAdapters();
    const { io, stdout, stderr } = createIo();

    const exitCode = await runRepositoryCli(
      [
        "acquire",
        "--url",
        "https://github.com/openai/openai-node.git",
        "--keep-repo",
      ],
      io,
      adapters,
      { tempRoot: "/tmp" },
    );

    expect(exitCode).toBe(0);
    expect(stderr).toEqual([]);
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      ok: true,
      command: "acquire",
      repository: {
        path: "/tmp/repolens/run-42/openai--openai-node",
        source: "temporary-clone",
        ownedByRepoLens: true,
        keepRepo: true,
      },
    });
  });

  test("release accepts only a serialized acquired-repository result", async () => {
    const { adapters } = createAdapters();
    const { io, stdout } = createIo();
    const repository: AcquiredRepository = {
      path: "/tmp/repolens/run-42/openai--openai-node",
      source: "temporary-clone",
      commitSha: "0123456789abcdef0123456789abcdef01234567",
      ownedByRepoLens: true,
      keepRepo: false,
    };

    const exitCode = await runRepositoryCli(
      ["release", "--repository", JSON.stringify(repository)],
      io,
      adapters,
      { tempRoot: "/tmp" },
    );

    expect(exitCode).toBe(0);
    expect(adapters.removeDirectory).toHaveBeenCalledWith(repository.path);
    expect(JSON.parse(stdout.join(""))).toEqual({
      ok: true,
      command: "release",
      cleanup: { status: "removed", path: repository.path },
    });
  });

  test("release rejects an owned flag for a path outside the RepoLens temp root", async () => {
    const { adapters } = createAdapters();
    const { io, stdout } = createIo();
    const forged: AcquiredRepository = {
      path: "/work/user-project",
      source: "temporary-clone",
      commitSha: "0123456789abcdef0123456789abcdef01234567",
      ownedByRepoLens: true,
      keepRepo: false,
    };

    const exitCode = await runRepositoryCli(
      ["release", "--repository", JSON.stringify(forged)],
      io,
      adapters,
      { tempRoot: "/tmp" },
    );

    expect(exitCode).toBe(1);
    expect(adapters.removeDirectory).not.toHaveBeenCalled();
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      ok: false,
      command: "release",
      error: expect.stringMatching(/RepoLens temporary root/i),
    });
  });

  test("rejects commands outside the acquire and release surface", async () => {
    const { adapters, runGit } = createAdapters();
    const { io, stdout } = createIo();

    const exitCode = await runRepositoryCli(
      ["run", "git", "status"],
      io,
      adapters,
      { tempRoot: "/tmp" },
    );

    expect(exitCode).toBe(1);
    expect(runGit).not.toHaveBeenCalled();
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      ok: false,
      error: expect.stringMatching(/acquire.*release/i),
    });
  });
});
