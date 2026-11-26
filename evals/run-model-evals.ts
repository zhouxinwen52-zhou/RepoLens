import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  DEFAULT_EVAL_BASE_URL,
  DEFAULT_EVAL_MODEL,
  ExpectedPropertiesSchema,
  MODEL_EVAL_RESPONSE_JSON_SCHEMA,
  ModelEvalOutputSchema,
  type ExpectedProperties,
  type ModelEvalOutput,
} from "./config.js";

const fixtureIds = [
  "simple-web-service",
  "rag-app",
  "mcp-server",
  "agent-project",
  "unfamiliar-system",
] as const;

export type ModelEvalRequest = {
  fixtureId: string;
  model: string;
  input: string;
  responseSchema: typeof MODEL_EVAL_RESPONSE_JSON_SCHEMA;
};

export type ModelEvalClient = {
  generate(request: ModelEvalRequest): Promise<unknown>;
};

type CaseResult = {
  fixtureId: string;
  status: "passed" | "failed";
  violations: string[];
  warnings: string[];
  observed?: Pick<
    ModelEvalOutput,
    | "coreComponents"
    | "requiredFlowEdges"
    | "importantConcepts"
    | "highValueFiles"
    | "claims"
  >;
};

export const SKILL_EVAL_BUNDLE_PATHS = [
  "skills/learn-project/SKILL.md",
  "skills/learn-project/references/evidence-policy.md",
  "skills/learn-project/references/router.md",
  "skills/learn-project/references/learning-workflow.md",
] as const;

export async function loadSkillEvalBundle(repositoryRoot: string): Promise<string> {
  const sections: string[] = [];
  for (const relativePath of SKILL_EVAL_BUNDLE_PATHS) {
    try {
      const contents = await readFile(path.join(repositoryRoot, relativePath), "utf8");
      sections.push(`--- ${relativePath} ---\n${contents}`);
    } catch (error) {
      const detail = error instanceof Error ? `: ${error.message}` : "";
      throw new Error(`Missing required Skill eval bundle file: ${relativePath}${detail}`);
    }
  }
  return sections.join("\n\n");
}

export type ModelEvalRunResult = {
  exitCode: 0 | 1;
  model: string;
  cases: CaseResult[];
};

type RunModelEvalsOptions = {
  repositoryRoot: string;
  artifactRoot: string;
  env: NodeJS.ProcessEnv;
  client: ModelEvalClient;
  log: (message: string) => void;
};

async function listFiles(root: string, current = root): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(root, absolutePath)));
    } else if (entry.isFile()) {
      files.push(path.relative(root, absolutePath));
    }
  }

  return files;
}

async function renderRepositoryFiles(fixtureRoot: string): Promise<string> {
  const files = await listFiles(fixtureRoot);
  const rendered = await Promise.all(
    files.map(async (relativePath) => {
      const contents = await readFile(path.join(fixtureRoot, relativePath), "utf8");
      return `--- ${relativePath} ---\n${contents}`;
    }),
  );
  return rendered.join("\n\n");
}

async function loadExpected(
  repositoryRoot: string,
  fixtureId: string,
): Promise<ExpectedProperties> {
  const contents = await readFile(
    path.join(repositoryRoot, "evals", "expected", `${fixtureId}.json`),
    "utf8",
  );
  return ExpectedPropertiesSchema.parse(JSON.parse(contents));
}

async function buildRequest(
  repositoryRoot: string,
  fixtureId: string,
  model: string,
  expected: ExpectedProperties,
  artifactRoot: string,
  skillBundle: string,
): Promise<ModelEvalRequest> {
  const profilePath = expected.profileExpectations.cases[0]?.profilePath;
  if (profilePath === undefined) {
    throw new Error(`Fixture ${fixtureId} has no Profile expectation.`);
  }
  const profile = await readFile(
    path.join(repositoryRoot, "evals", profilePath),
    "utf8",
  );
  const fixtureRoot = path.join(repositoryRoot, "evals", "fixtures", fixtureId);
  const repositoryFiles = await renderRepositoryFiles(fixtureRoot);

  return {
    fixtureId,
    model,
    responseSchema: MODEL_EVAL_RESPONSE_JSON_SCHEMA,
    input: [
      "Apply the RepoLens instructions to the supplied immutable local fixture.",
      "Return only the requested structured JSON. Do not execute or modify the fixture.",
      `Fixture: ${fixtureId}`,
      `Allowed artifact root: ${artifactRoot}`,
      "Return artifact paths beneath that root, but do not write any artifacts during evaluation.",
      "Preserve source paths and symbol names exactly as they appear in the repository files.",
      "Core components may be qualified or include a short description, but must retain a real source symbol.",
      "Runtime-flow endpoints must retain the exact callable symbol, including method names when a method performs the call.",
      "For example, handle_alert and main.handle_alert are both acceptable when grounded in main.py.",
      "",
      "RepoLens skill instructions:",
      skillBundle,
      "",
      "Profile:",
      profile,
      "",
      "Repository files:",
      repositoryFiles,
    ].join("\n"),
  };
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function matchesSourceSymbol(candidate: string, expected: string): boolean {
  const candidateSymbol = normalize(candidate);
  const expectedSymbol = normalize(expected);
  return (
    candidateSymbol === expectedSymbol ||
    candidateSymbol.startsWith(`${expectedSymbol}.`) ||
    new RegExp(`(^|[^a-z0-9_$])${expectedSymbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9_$]|$)`).test(
      candidateSymbol,
    )
  );
}

function fileExists(relativePath: string, fixtureFiles: Set<string>): boolean {
  return fixtureFiles.has(relativePath.split(path.sep).join("/"));
}

function mentionsExpected(candidate: string, expected: string): boolean {
  const normalizedCandidate = normalize(candidate);
  const normalizedExpected = normalize(expected);
  return normalizedCandidate.includes(normalizedExpected);
}

function namesSourceSymbol(
  candidate: string,
  repositorySource: string,
  fixtureFiles: Set<string>,
): boolean {
  const [beforeDescription, afterDescription = ""] = candidate.split(":", 2);
  const referenceText = /^(?:[^\s/\\]+[/\\])*[^\s/\\]+\.(?:c|cc|cpp|go|java|js|jsx|kt|py|rb|rs|ts|tsx)$/.test(
    beforeDescription.trim(),
  )
    ? afterDescription
    : beforeDescription;
  const reference = referenceText
    .trim()
    .match(/^([A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*)/)?.[1];
  if (reference === undefined) return false;
  if (fileExists(reference, fixtureFiles)) return true;

  const identifiers = reference.split(".");
  return identifiers.every((identifier) => {
    return new RegExp(`\\b${identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(
      repositorySource,
    );
  });
}

function symbolExistsInSource(symbol: string, source: string, sourcePath: string): boolean {
  const normalizedSymbol = normalizeFlowEndpoint(symbol);
  const identifiers = normalizedSymbol.split(".").filter(Boolean);
  if (identifiers.length === 0) return false;
  const fileStem = normalize(path.basename(sourcePath, path.extname(sourcePath)));
  return identifiers.every(
    (identifier) =>
      identifier === fileStem ||
      new RegExp(
        `\\b${identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i",
      ).test(source),
  );
}

function normalizeFlowEndpoint(value: string): string {
  const [prefix, suffix] = value.split(":", 2);
  if (
    suffix !== undefined &&
    /\.(?:c|cc|cpp|go|java|js|jsx|kt|py|rb|rs|ts|tsx)$/.test(prefix.trim())
  ) {
    return normalize(suffix);
  }
  return normalize(value);
}

function matchesFlowEndpoint(candidate: string, expected: string): boolean {
  const normalizedCandidate = normalizeFlowEndpoint(candidate);
  const normalizedExpected = normalizeFlowEndpoint(expected);
  return (
    normalizedCandidate === normalizedExpected ||
    normalizedCandidate.endsWith(`.${normalizedExpected}`) ||
    normalizedExpected.endsWith(`.${normalizedCandidate}`)
  );
}

function isInside(root: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function validateSemantics(
  output: ModelEvalOutput,
  expected: ExpectedProperties,
  fixtureRoot: string,
  artifactRoot: string,
  fixtureFiles: Set<string>,
  repositorySource: string,
  sourceByPath: Map<string, string>,
): { violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];

  if (output.primaryLanguage !== expected.hardInvariants.primaryLanguage) {
    violations.push(
      `Incorrect primary language: expected ${expected.hardInvariants.primaryLanguage}, received ${output.primaryLanguage}.`,
    );
  }

  for (const component of output.coreComponents) {
    if (!namesSourceSymbol(component, repositorySource, fixtureFiles)) {
      violations.push(`Output names a component not found in fixture source: ${component}`);
    }
  }

  for (const component of expected.softExpectations.coreComponents) {
    if (
      !output.coreComponents.some((candidate) =>
        matchesSourceSymbol(candidate, component),
      )
    ) {
      warnings.push(`Missing recommended core component: ${component}`);
    }
  }

  for (const entryPoint of expected.hardInvariants.entryPoints) {
    if (
      !output.entryPoints.some(
        (candidate) =>
          candidate.path === entryPoint.path &&
          matchesFlowEndpoint(candidate.symbol, entryPoint.symbol),
      )
    ) {
      violations.push(`Missing entry point: ${entryPoint.path}#${entryPoint.symbol}`);
    }
  }

  for (const entryPoint of output.entryPoints) {
    if (!fileExists(entryPoint.path, fixtureFiles)) {
      violations.push(`Entry-point evidence path does not exist: ${entryPoint.path}`);
    } else if (
      !symbolExistsInSource(
        entryPoint.symbol,
        sourceByPath.get(entryPoint.path) ?? "",
        entryPoint.path,
      )
    ) {
      violations.push(
        `Entry-point symbol does not exist in ${entryPoint.path}: ${entryPoint.symbol}`,
      );
    }
  }

  for (const edge of expected.hardInvariants.requiredFlowEdges) {
    const candidate = output.requiredFlowEdges.find(
      (outputEdge) =>
        matchesFlowEndpoint(outputEdge.from, edge.from) &&
        matchesFlowEndpoint(outputEdge.to, edge.to),
    );
    if (candidate === undefined) {
      violations.push(`Missing required flow edge: ${edge.from} -> ${edge.to}`);
    }
  }


  for (const edge of output.requiredFlowEdges) {
    for (const evidencePath of edge.evidencePaths) {
      if (!fileExists(evidencePath, fixtureFiles)) {
        violations.push(`Flow-edge evidence path does not exist: ${evidencePath}`);
      }
    }
    if (
      !expected.hardInvariants.allowedFlowEdges.some(
        (allowed) =>
          matchesFlowEndpoint(edge.from, allowed.from) &&
          matchesFlowEndpoint(edge.to, allowed.to),
      )
    ) {
      violations.push(`Output contains an unsupported flow edge: ${edge.from} -> ${edge.to}`);
    }
  }

  for (const highValueFile of expected.hardInvariants.highValueFiles) {
    if (!output.highValueFiles.includes(highValueFile)) {
      violations.push(`Missing expected high-value file: ${highValueFile}`);
    }
  }

  for (const highValueFile of output.highValueFiles) {
    if (!fileExists(highValueFile, fixtureFiles)) {
      violations.push(`High-value file does not exist: ${highValueFile}`);
    }
  }

  const factualStrings = [
    ...output.architecture,
    ...output.entryPoints.flatMap((entryPoint) => [entryPoint.path, entryPoint.symbol]),
    ...output.coreComponents,
    ...output.requiredFlowEdges.flatMap((edge) => [edge.from, edge.to]),
    ...output.highValueFiles,
    ...output.claims,
    ...output.importantConcepts,
  ];
  for (const forbiddenClaim of expected.hardInvariants.forbiddenClaims) {
    const normalizedForbiddenClaim = normalize(forbiddenClaim);
    if (
      factualStrings.some((claim) => {
        const normalizedClaim = normalize(claim);
        return normalizedClaim.includes(normalizedForbiddenClaim);
      })
    ) {
      violations.push(`Output contains forbidden claim: ${forbiddenClaim}`);
    }
  }

  for (const forbiddenPattern of expected.hardInvariants.forbiddenPatterns) {
    const pattern = new RegExp(forbiddenPattern.pattern, "i");
    if (factualStrings.some((value) => pattern.test(value))) {
      violations.push(
        `Output matches forbidden fact pattern: ${forbiddenPattern.description}`,
      );
    }
  }

  for (const concept of expected.softExpectations.importantConcepts) {
    if (!output.importantConcepts.some((candidate) => mentionsExpected(candidate, concept))) {
      warnings.push(`Missing recommended concept wording: ${concept}`);
    }
  }

  for (const theme of expected.softExpectations.architectureThemes) {
    if (!output.architecture.some((candidate) => mentionsExpected(candidate, theme))) {
      warnings.push(`Architecture theme differs from recommendation: ${theme}`);
    }
  }

  for (const [kind, artifactPath] of Object.entries(output.artifactPaths)) {
    if (isInside(fixtureRoot, artifactPath) || !isInside(artifactRoot, artifactPath)) {
      violations.push(
        `Invalid artifact path for ${kind}: paths must stay outside fixtures and inside the artifact root.`,
      );
    }
  }

  return { violations, warnings };
}

export async function runModelEvals(
  options: RunModelEvalsOptions,
): Promise<ModelEvalRunResult> {
  if (!options.env.REPOLENS_EVAL_API_KEY) {
    throw new Error(
      "REPOLENS_EVAL_API_KEY is required for the developer-only model evaluation command.",
    );
  }

  if (
    options.env.OPENAI_BASE_URL &&
    new URL(options.env.OPENAI_BASE_URL).origin !==
      new URL(DEFAULT_EVAL_BASE_URL).origin &&
    !options.env.REPOLENS_EVAL_MODEL
  ) {
    throw new Error(
      "REPOLENS_EVAL_MODEL is required when OPENAI_BASE_URL selects a non-default provider.",
    );
  }

  const model = options.env.REPOLENS_EVAL_MODEL || DEFAULT_EVAL_MODEL;
  const cases: CaseResult[] = [];
  const requestedFixture = options.env.REPOLENS_EVAL_FIXTURE;
  if (
    requestedFixture !== undefined &&
    !fixtureIds.includes(requestedFixture as (typeof fixtureIds)[number])
  ) {
    throw new Error(
      `Unknown REPOLENS_EVAL_FIXTURE: ${requestedFixture}. Expected one of: ${fixtureIds.join(
        ", ",
      )}.`,
    );
  }
  const selectedFixtureIds = requestedFixture
    ? [requestedFixture as (typeof fixtureIds)[number]]
    : fixtureIds;
  const skillBundle = await loadSkillEvalBundle(options.repositoryRoot);

  options.log(`Running ${selectedFixtureIds.length} RepoLens model smoke tests with ${model}.`);
  for (const fixtureId of selectedFixtureIds) {
    const expected = await loadExpected(options.repositoryRoot, fixtureId);
    const request = await buildRequest(
      options.repositoryRoot,
      fixtureId,
      model,
      expected,
      options.artifactRoot,
      skillBundle,
    );
    const fixtureRoot = path.join(
      options.repositoryRoot,
      "evals",
      "fixtures",
      fixtureId,
    );
    const fixtureFileList = await listFiles(fixtureRoot);
    const fixtureFiles = new Set(fixtureFileList.map((file) => file.split(path.sep).join("/")));
    const repositorySource = await renderRepositoryFiles(fixtureRoot);
    const sourceByPath = new Map(
      await Promise.all(
        fixtureFileList.map(async (relativePath) => [
          relativePath.split(path.sep).join("/"),
          await readFile(path.join(fixtureRoot, relativePath), "utf8"),
        ] as const),
      ),
    );

    try {
      const rawOutput = await options.client.generate(request);
      const parsed = ModelEvalOutputSchema.safeParse(rawOutput);
      const validation = parsed.success
        ? validateSemantics(
            parsed.data,
            expected,
            fixtureRoot,
            options.artifactRoot,
            fixtureFiles,
            repositorySource,
            sourceByPath,
          )
        : {
            warnings: [],
            violations: [
            `Invalid structured output: ${parsed.error.issues
              .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
              .join("; ")}`,
            ],
          };
      const { violations, warnings } = validation;
      const status = violations.length === 0 ? "passed" : "failed";
      cases.push({
        fixtureId,
        status,
        violations,
        warnings,
        ...(parsed.success && status === "failed"
          ? {
              observed: {
                coreComponents: parsed.data.coreComponents,
                requiredFlowEdges: parsed.data.requiredFlowEdges,
                importantConcepts: parsed.data.importantConcepts,
                highValueFiles: parsed.data.highValueFiles,
                claims: parsed.data.claims,
              },
            }
          : {}),
      });
      options.log(
        `${fixtureId}: ${status}${warnings.length > 0 ? ` (${warnings.length} warnings)` : ""}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown model-eval error";
      cases.push({
        fixtureId,
        status: "failed",
        violations: [`Model request failed: ${message}`],
        warnings: [],
      });
      options.log(`${fixtureId}: failed`);
    }
  }

  return {
    exitCode: cases.every((item) => item.status === "passed") ? 0 : 1,
    model,
    cases,
  };
}

type ChatCompletionsApiBody = {
  choices?: Array<{
    message?: {
      content?: string | null;
      refusal?: string | null;
    };
  }>;
  error?: { message?: string };
};

type OpenAICompatibleClientOptions = {
  apiKey: string;
  baseUrl?: string;
  fetchImplementation?: typeof fetch;
};

export function createOpenAIModelEvalClient(
  options: OpenAICompatibleClientOptions,
): ModelEvalClient {
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const baseUrl = new URL(options.baseUrl ?? DEFAULT_EVAL_BASE_URL);
  if (baseUrl.protocol !== "https:" && baseUrl.protocol !== "http:") {
    throw new Error("OPENAI_BASE_URL must use HTTP or HTTPS.");
  }
  const configuredPath = baseUrl.pathname.replace(/\/+$/, "");
  const apiPath = configuredPath === "" ? "/v1" : configuredPath;
  const endpoint = new URL(`${apiPath}/chat/completions`, baseUrl.origin);

  return {
    async generate(request): Promise<unknown> {
      const response = await fetchImplementation(endpoint.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.model,
          reasoning_effort: "low",
          stream: false,
          messages: [
            {
              role: "system",
              content: [
                "Return only one valid JSON object with no Markdown fences or commentary.",
                "The object must satisfy this JSON Schema:",
                JSON.stringify(request.responseSchema),
              ].join("\n"),
            },
            { role: "user", content: request.input },
          ],
        }),
      });
      const body = (await response.json()) as ChatCompletionsApiBody;
      if (!response.ok) {
        throw new Error(
          body.error?.message ||
            `OpenAI-compatible API request failed (${response.status}).`,
        );
      }

      const message = body.choices?.[0]?.message;
      if (message?.refusal) {
        throw new Error(`OpenAI-compatible API refused the evaluation: ${message.refusal}`);
      }

      if (!message?.content) {
        throw new Error("OpenAI-compatible API returned no output text.");
      }
      return JSON.parse(message.content) as unknown;
    },
  };
}

async function main(): Promise<void> {
  const repositoryRoot = path.resolve(import.meta.dirname, "..");
  const apiKey = process.env.REPOLENS_EVAL_API_KEY;
  if (!apiKey) {
    throw new Error(
      "REPOLENS_EVAL_API_KEY is required for the developer-only model evaluation command.",
    );
  }
  const result = await runModelEvals({
    repositoryRoot,
    artifactRoot: path.join(repositoryRoot, ".tmp", "model-eval-artifacts"),
    env: process.env,
    client: createOpenAIModelEvalClient({
      apiKey,
      baseUrl: process.env.OPENAI_BASE_URL,
    }),
    log: console.log,
  });
  for (const item of result.cases) {
    if (item.observed) {
      console.error(`${item.fixtureId}: observed ${JSON.stringify(item.observed)}`);
    }
    for (const violation of item.violations) {
      console.error(`${item.fixtureId}: ${violation}`);
    }
    for (const warning of item.warnings) {
      console.warn(`${item.fixtureId}: warning: ${warning}`);
    }
  }
  process.exitCode = result.exitCode;
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown model-eval error";
    console.error(message);
    process.exitCode = 1;
  });
}
