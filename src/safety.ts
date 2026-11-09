import { lstat, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";

export type PathClassification =
  | "allowed"
  | "excluded-sensitive"
  | "excluded-vcs"
  | "excluded-generated";

export type TraversalLimits = {
  maxFiles: number;
  maxDepth: number;
};

export type TraversalExclusion = {
  path: string;
  category: Exclude<PathClassification, "allowed">;
};

export type TraversalResult = {
  files: string[];
  exclusions: TraversalExclusion[];
  diagnostics: string[];
  scope: {
    root: string;
    maxFiles: number;
    maxDepth: number;
    readableFileCount: number;
    limitReached: boolean;
  };
};

const VCS_DIRECTORIES = new Set([".git", ".hg", ".svn"]);
const GENERATED_DIRECTORIES = new Set([
  ".next",
  ".nuxt",
  ".output",
  ".parcel-cache",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "target",
  "vendor",
]);
const CLOUD_CREDENTIAL_DIRECTORIES = new Set([".aws", ".azure"]);
const PRIVATE_KEY_FILENAMES = /^(?:id_(?:dsa|ecdsa|ed25519|rsa)|.*\.(?:key|ppk))$/i;
const CERTIFICATE_FILENAMES = /\.(?:cer|crt|der|p12|pfx|pem)$/i;
const CREDENTIAL_FILENAMES = /^(?:\.netrc|\.npmrc|\.pypirc|auth\.json|credentials(?:\.[^.]+)?|service-account(?:\.[^.]+)?)$/i;
const SECRET_NAME = /(?:^|[._-])(?:access[-_]?token|api[-_]?key|credential|credentials|password|private[-_]?key|secret|token)(?:[._-]|$)/i;

function normalizedParts(relativePath: string): string[] {
  return relativePath
    .replaceAll("\\", "/")
    .split("/")
    .filter((part) => part.length > 0 && part !== ".");
}

export function classifyPath(relativePath: string): PathClassification {
  if (
    relativePath.includes("\0") ||
    path.posix.isAbsolute(relativePath.replaceAll("\\", "/")) ||
    path.win32.isAbsolute(relativePath) ||
    normalizedParts(relativePath).includes("..")
  ) {
    return "excluded-sensitive";
  }

  const parts = normalizedParts(relativePath);
  const lowerParts = parts.map((part) => part.toLowerCase());

  if (lowerParts.some((part) => VCS_DIRECTORIES.has(part))) {
    return "excluded-vcs";
  }
  if (lowerParts.some((part) => GENERATED_DIRECTORIES.has(part))) {
    return "excluded-generated";
  }
  if (
    lowerParts.some((part) => CLOUD_CREDENTIAL_DIRECTORIES.has(part)) ||
    lowerParts.some(
      (part, index) =>
        part === ".config" && lowerParts[index + 1] === "gcloud",
    )
  ) {
    return "excluded-sensitive";
  }

  const filename = parts.at(-1) ?? "";
  if (
    filename === ".env" ||
    filename.toLowerCase().startsWith(".env.") ||
    PRIVATE_KEY_FILENAMES.test(filename) ||
    CERTIFICATE_FILENAMES.test(filename) ||
    CREDENTIAL_FILENAMES.test(filename) ||
    SECRET_NAME.test(filename)
  ) {
    return "excluded-sensitive";
  }

  return "allowed";
}

function isInsideRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

function portableRelativePath(root: string, candidate: string): string {
  return path.relative(root, candidate).split(path.sep).join("/");
}

function validateLimits(limits: TraversalLimits): void {
  if (!Number.isInteger(limits.maxFiles) || limits.maxFiles < 1) {
    throw new Error("Traversal maxFiles must be a positive integer.");
  }
  if (!Number.isInteger(limits.maxDepth) || limits.maxDepth < 0) {
    throw new Error("Traversal maxDepth must be a non-negative integer.");
  }
}

export async function listReadableFiles(
  root: string,
  limits: TraversalLimits,
): Promise<TraversalResult> {
  validateLimits(limits);

  const rootRealPath = await realpath(root);
  const files: string[] = [];
  const exclusions: TraversalExclusion[] = [];
  const diagnostics: string[] = [];
  const visitedDirectories = new Set<string>();
  let limitReached = false;

  async function visitDirectory(
    directoryPath: string,
    relativeDirectory: string,
    depth: number,
  ): Promise<void> {
    let directoryRealPath: string;
    try {
      directoryRealPath = await realpath(directoryPath);
    } catch (error) {
      diagnostics.push(
        `Unable to inspect ${relativeDirectory || "."}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }

    if (!isInsideRoot(rootRealPath, directoryRealPath)) {
      exclusions.push({
        path: relativeDirectory || ".",
        category: "excluded-sensitive",
      });
      return;
    }
    if (visitedDirectories.has(directoryRealPath)) return;
    visitedDirectories.add(directoryRealPath);

    const entries = await readdir(directoryPath, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      if (files.length >= limits.maxFiles) {
        limitReached = true;
        break;
      }

      const relativeEntry = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      const classification = classifyPath(relativeEntry);
      if (classification !== "allowed") {
        exclusions.push({ path: relativeEntry, category: classification });
        continue;
      }

      const entryPath = path.join(directoryPath, entry.name);
      let entryStats = await lstat(entryPath);
      if (entryStats.isSymbolicLink()) {
        let targetRealPath: string;
        try {
          targetRealPath = await realpath(entryPath);
        } catch (error) {
          diagnostics.push(
            `Unable to resolve ${relativeEntry}: ${error instanceof Error ? error.message : String(error)}`,
          );
          continue;
        }
        if (!isInsideRoot(rootRealPath, targetRealPath)) {
          exclusions.push({
            path: relativeEntry,
            category: "excluded-sensitive",
          });
          continue;
        }
        const targetClassification = classifyPath(
          portableRelativePath(rootRealPath, targetRealPath),
        );
        if (targetClassification !== "allowed") {
          exclusions.push({
            path: relativeEntry,
            category: targetClassification,
          });
          continue;
        }
        entryStats = await stat(entryPath);
      }

      if (entryStats.isDirectory()) {
        if (depth >= limits.maxDepth) {
          limitReached = true;
          continue;
        }
        await visitDirectory(entryPath, relativeEntry, depth + 1);
      } else if (entryStats.isFile()) {
        const entryRealPath = await realpath(entryPath);
        if (!isInsideRoot(rootRealPath, entryRealPath)) {
          exclusions.push({
            path: relativeEntry,
            category: "excluded-sensitive",
          });
          continue;
        }
        files.push(portableRelativePath(rootRealPath, entryRealPath));
      }
    }
  }

  await visitDirectory(rootRealPath, "", 0);
  files.sort();
  exclusions.sort((left, right) => left.path.localeCompare(right.path));

  return {
    files,
    exclusions,
    diagnostics,
    scope: {
      root: rootRealPath,
      maxFiles: limits.maxFiles,
      maxDepth: limits.maxDepth,
      readableFileCount: files.length,
      limitReached,
    },
  };
}
