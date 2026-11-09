import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { runRepositoryCli } from "../src/cli.js";
import {
  classifyPath,
  listReadableFiles,
  type PathClassification,
} from "../src/safety.js";

const temporaryDirectories: string[] = [];

async function createTemporaryDirectory(prefix: string): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("repository path classification", () => {
  test.each<{ relativePath: string; expected: PathClassification }>([
    { relativePath: ".env", expected: "excluded-sensitive" },
    { relativePath: ".env.local", expected: "excluded-sensitive" },
    { relativePath: "certificates/server.pem", expected: "excluded-sensitive" },
    { relativePath: "certificates/server.crt", expected: "excluded-sensitive" },
    { relativePath: "certificates/server.cer", expected: "excluded-sensitive" },
    { relativePath: "certificates/server.der", expected: "excluded-sensitive" },
    { relativePath: "keys/id_rsa", expected: "excluded-sensitive" },
    { relativePath: "keys/deploy.ppk", expected: "excluded-sensitive" },
    { relativePath: "config/credentials.json", expected: "excluded-sensitive" },
    { relativePath: ".aws/credentials", expected: "excluded-sensitive" },
    {
      relativePath: ".config/gcloud/application_default_credentials.json",
      expected: "excluded-sensitive",
    },
    { relativePath: "config/access-token.txt", expected: "excluded-sensitive" },
    { relativePath: "secrets/production-secret.yaml", expected: "excluded-sensitive" },
    { relativePath: ".git/config", expected: "excluded-vcs" },
    { relativePath: ".svn/entries", expected: "excluded-vcs" },
    { relativePath: ".hg/store/data", expected: "excluded-vcs" },
    { relativePath: "node_modules/pkg/index.js", expected: "excluded-generated" },
    { relativePath: "vendor/library/source.go", expected: "excluded-generated" },
    { relativePath: "dist/index.js", expected: "excluded-generated" },
    { relativePath: "../outside.txt", expected: "excluded-sensitive" },
    { relativePath: "src/main.ts", expected: "allowed" },
  ])("classifies $relativePath as $expected", ({ relativePath, expected }) => {
    expect(classifyPath(relativePath)).toBe(expected);
  });
});

describe("bounded repository traversal", () => {
  test("returns normal source paths while reporting exclusions without their contents", async () => {
    const root = await createTemporaryDirectory("repolens-safety-root-");
    const sentinel = "SENTINEL_REPOLENS_SECRET_7f31";

    await mkdir(path.join(root, "src"), { recursive: true });
    await mkdir(path.join(root, ".git"), { recursive: true });
    await mkdir(path.join(root, ".aws"), { recursive: true });
    await mkdir(path.join(root, "node_modules", "example"), { recursive: true });
    await writeFile(path.join(root, "src", "main.ts"), "export const answer = 42;\n");
    await writeFile(path.join(root, ".env.local"), `TOKEN=${sentinel}\n`);
    await writeFile(path.join(root, ".git", "config"), sentinel);
    await writeFile(path.join(root, ".aws", "credentials"), sentinel);
    await writeFile(path.join(root, "node_modules", "example", "index.js"), sentinel);

    const result = await listReadableFiles(root, { maxFiles: 100, maxDepth: 8 });

    expect(result.files).toEqual(["src/main.ts"]);
    expect(result.exclusions).toEqual(
      expect.arrayContaining([
        { path: ".env.local", category: "excluded-sensitive" },
        { path: ".git", category: "excluded-vcs" },
        { path: ".aws", category: "excluded-sensitive" },
        { path: "node_modules", category: "excluded-generated" },
      ]),
    );
    expect(JSON.stringify(result)).not.toContain(sentinel);
  });

  test("does not follow a symlink that escapes the repository root", async () => {
    const root = await createTemporaryDirectory("repolens-safety-root-");
    const outside = await createTemporaryDirectory("repolens-safety-outside-");
    const sentinel = "SENTINEL_REPOLENS_SYMLINK_SECRET_4d92";

    await writeFile(path.join(outside, "outside-secret.txt"), sentinel);
    await symlink(outside, path.join(root, "escaped"), "dir");

    const result = await listReadableFiles(root, { maxFiles: 100, maxDepth: 8 });

    expect(result.files).not.toContain("escaped/outside-secret.txt");
    expect(result.exclusions).toContainEqual({
      path: "escaped",
      category: "excluded-sensitive",
    });
    expect(JSON.stringify(result)).not.toContain(sentinel);
  });

  test("does not let an internal symlink bypass sensitive-path classification", async () => {
    const root = await createTemporaryDirectory("repolens-safety-root-");
    const sentinel = "SENTINEL_REPOLENS_INTERNAL_LINK_SECRET_b617";

    await writeFile(path.join(root, ".env"), `TOKEN=${sentinel}\n`);
    await symlink(path.join(root, ".env"), path.join(root, "public-config"));

    const result = await listReadableFiles(root, { maxFiles: 100, maxDepth: 8 });

    expect(result.files).not.toContain(".env");
    expect(result.files).not.toContain("public-config");
    expect(result.exclusions).toContainEqual({
      path: "public-config",
      category: "excluded-sensitive",
    });
    expect(JSON.stringify(result)).not.toContain(sentinel);
  });

  test("enforces the file-count limit", async () => {
    const root = await createTemporaryDirectory("repolens-safety-root-");

    await writeFile(path.join(root, "a.ts"), "export const a = 1;\n");
    await writeFile(path.join(root, "b.ts"), "export const b = 2;\n");

    const result = await listReadableFiles(root, { maxFiles: 1, maxDepth: 8 });

    expect(result.files).toHaveLength(1);
    expect(result.scope.limitReached).toBe(true);
  });

  test("does not descend beyond the depth limit", async () => {
    const root = await createTemporaryDirectory("repolens-safety-root-");
    const sentinel = "SENTINEL_REPOLENS_DEPTH_SECRET_8a20";

    await mkdir(path.join(root, "one", "two", "three"), { recursive: true });
    await writeFile(path.join(root, "one", "two", "three", "secret.txt"), sentinel);

    const result = await listReadableFiles(root, { maxFiles: 100, maxDepth: 2 });

    expect(result.files).not.toContain("one/two/three/secret.txt");
    expect(result.scope.readableFileCount).toBe(0);
    expect(result.scope.limitReached).toBe(true);
    expect(JSON.stringify(result)).not.toContain(sentinel);
  });
});

describe("safety helper CLI", () => {
  test("emits readable paths and exclusion categories without sensitive contents", async () => {
    const root = await createTemporaryDirectory("repolens-safety-cli-");
    const sentinel = "SENTINEL_REPOLENS_CLI_SECRET_c503";
    const stdout: string[] = [];
    const stderr: string[] = [];

    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src", "main.ts"), "export const main = true;\n");
    await writeFile(path.join(root, ".env"), `API_TOKEN=${sentinel}\n`);

    const exitCode = await runRepositoryCli(
      [
        "scan",
        "--root",
        root,
        "--max-files",
        "20",
        "--max-depth",
        "4",
      ],
      {
        writeStdout: (value) => stdout.push(value),
        writeStderr: (value) => stderr.push(value),
      },
    );

    const serializedOutput = stdout.join("");
    expect(exitCode).toBe(0);
    expect(stderr).toEqual([]);
    expect(JSON.parse(serializedOutput)).toMatchObject({
      ok: true,
      command: "scan",
      traversal: {
        files: ["src/main.ts"],
        exclusions: [
          { path: ".env", category: "excluded-sensitive" },
        ],
        scope: {
          readableFileCount: 1,
          limitReached: false,
        },
      },
    });
    expect(serializedOutput).not.toContain(sentinel);
  });
});
