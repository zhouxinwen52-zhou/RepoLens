import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, test, vi } from "vitest";

import {
  createOpenAIModelEvalClient,
  loadSkillEvalBundle,
  type ModelEvalClient,
  runModelEvals,
} from "../evals/run-model-evals.js";
import {
  DEFAULT_EVAL_BASE_URL,
  DEFAULT_EVAL_MODEL,
  ExpectedPropertiesSchema,
  MODEL_EVAL_RESPONSE_JSON_SCHEMA,
  type ExpectedProperties,
} from "../evals/config.js";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const artifactRoot = "/tmp/repolens-model-eval-artifacts";
const fixtureIds = [
  "simple-web-service",
  "rag-app",
  "mcp-server",
  "agent-project",
  "unfamiliar-system",
] as const;

async function loadExpected(fixtureId: string): Promise<ExpectedProperties> {
  const contents = await readFile(
    path.join(repositoryRoot, "evals", "expected", `${fixtureId}.json`),
    "utf8",
  );
  return ExpectedPropertiesSchema.parse(JSON.parse(contents));
}

async function validOutput(fixtureId: string) {
  const expected = await loadExpected(fixtureId);
  return {
    primaryLanguage: expected.hardInvariants.primaryLanguage,
    architecture: expected.softExpectations.architectureThemes,
    entryPoints: expected.hardInvariants.entryPoints,
    coreComponents: expected.softExpectations.coreComponents,
    requiredFlowEdges: expected.hardInvariants.requiredFlowEdges,
    highValueFiles: expected.hardInvariants.highValueFiles,
    claims: ["The result is grounded in the supplied local fixture."],
    importantConcepts: expected.softExpectations.importantConcepts,
    artifactPaths: {
      report: path.join(artifactRoot, fixtureId, "report.md"),
      architecture: path.join(artifactRoot, fixtureId, "architecture.html"),
      runtimeFlow: path.join(artifactRoot, fixtureId, "runtime-flow.html"),
    },
  };
}

function createClient(
  generate: ModelEvalClient["generate"] = async (request) =>
    validOutput(request.fixtureId),
): ModelEvalClient {
  return { generate: vi.fn(generate) };
}

describe("developer model-eval runner", () => {
  test("loads the four-file Skill eval bundle without the report template", async () => {
    const bundle = await loadSkillEvalBundle(repositoryRoot);

    expect(bundle).toContain("skills/learn-project/SKILL.md");
    expect(bundle).toContain("references/evidence-policy.md");
    expect(bundle).toContain("references/router.md");
    expect(bundle).toContain("references/learning-workflow.md");
    expect(bundle).not.toContain("assets/learning-report-template.md ---");
  });

  test("reports the exact missing required Skill bundle file", async () => {
    const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "repolens-bundle-"));
    const skillRoot = path.join(temporaryRoot, "skills", "learn-project");
    await mkdir(path.join(skillRoot, "references"), { recursive: true });
    await writeFile(path.join(skillRoot, "SKILL.md"), "skill", "utf8");
    await writeFile(
      path.join(skillRoot, "references", "evidence-policy.md"),
      "policy",
      "utf8",
    );
    await writeFile(path.join(skillRoot, "references", "router.md"), "router", "utf8");

    try {
      await expect(loadSkillEvalBundle(temporaryRoot)).rejects.toThrow(
        /skills\/learn-project\/references\/learning-workflow\.md/,
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  test("defaults to the configured OpenAI-compatible gateway and MiniMax model", async () => {
    expect(DEFAULT_EVAL_BASE_URL).toBe("https://newapi.k8s.ewivt.com");
    expect(DEFAULT_EVAL_MODEL).toBe("MiniMax-M3.1-Flash");

    const client = createClient();
    const result = await runModelEvals({
      repositoryRoot,
      artifactRoot,
      env: { OPENAI_API_KEY: "test-key" },
      client,
      log: () => undefined,
    });

    expect(result.model).toBe("MiniMax-M3.1-Flash");
    for (const [request] of vi.mocked(client.generate).mock.calls) {
      expect(request.model).toBe("MiniMax-M3.1-Flash");
    }
  });

  test("builds and validates one structured request for every local fixture", async () => {
    const client = createClient();
    const logs: string[] = [];
    const apiKey = "test-api-key-must-not-appear";

    const result = await runModelEvals({
      repositoryRoot,
      artifactRoot,
      env: { OPENAI_API_KEY: apiKey, REPOLENS_EVAL_MODEL: "test-low-cost-model" },
      client,
      log: (message) => logs.push(message),
    });

    expect(result.exitCode).toBe(0);
    expect(result.cases).toHaveLength(5);
    expect(result.cases.every((item) => item.status === "passed")).toBe(true);
    expect(client.generate).toHaveBeenCalledTimes(5);

    const requests = vi.mocked(client.generate).mock.calls.map(([request]) => request);
    expect(requests.map((request) => request.fixtureId)).toEqual(fixtureIds);
    for (const request of requests) {
      expect(request.model).toBe("test-low-cost-model");
      expect(request.input).toContain("# Learn a Project with RepoLens");
      expect(request.input).toContain(
        "--- skills/learn-project/references/evidence-policy.md ---",
      );
      expect(request.input).toContain(
        "--- skills/learn-project/references/learning-workflow.md ---",
      );
      expect(request.input).toContain("schemaVersion: 1");
      expect(request.input).toContain(`Fixture: ${request.fixtureId}`);
      expect(request.input).toContain("Repository files:");
      expect(request.input).toContain(`Allowed artifact root: ${artifactRoot}`);
      expect(request.input).toContain(
        "Core components may be qualified or include a short description",
      );
      expect(request.input).toContain(
        "Runtime-flow endpoints must retain the exact callable symbol",
      );
      expect(request.input).toContain(
        "handle_alert and main.handle_alert are both acceptable",
      );
      expect(request.responseSchema).toMatchObject({ type: "object" });
    }
    expect(logs.join("\n")).not.toContain(apiKey);
  });

  test("fails clearly before contacting a client when OPENAI_API_KEY is missing", async () => {
    const client = createClient();

    await expect(
      runModelEvals({
        repositoryRoot,
        artifactRoot,
        env: {},
        client,
        log: () => undefined,
      }),
    ).rejects.toThrow(/OPENAI_API_KEY/);
    expect(client.generate).not.toHaveBeenCalled();
  });

  test("uses an OpenAI-compatible base URL without exposing the provider key", async () => {
    const fetchImplementation = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify(await validOutput("simple-web-service")),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const providerKey = "minimax-provider-key";
    const client = createOpenAIModelEvalClient({
      apiKey: providerKey,
      baseUrl: "https://api.minimax.io/v1/",
      fetchImplementation: fetchImplementation as typeof fetch,
    });

    await client.generate({
      fixtureId: "simple-web-service",
      model: "MiniMax-test-model",
      input: "Return structured JSON.",
      responseSchema: MODEL_EVAL_RESPONSE_JSON_SCHEMA,
    });

    expect(fetchImplementation).toHaveBeenCalledWith(
      "https://api.minimax.io/v1/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
    const serializedCall = JSON.stringify(fetchImplementation.mock.calls);
    expect(serializedCall).toContain(providerKey);
    expect(serializedCall).toContain("messages");
    expect(serializedCall).toContain("JSON Schema");
  });

  test("adds the v1 Chat Completions path to the default gateway base URL", async () => {
    const fetchImplementation = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify(await validOutput("simple-web-service")),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const client = createOpenAIModelEvalClient({
      apiKey: "gateway-key",
      fetchImplementation: fetchImplementation as typeof fetch,
    });

    await client.generate({
      fixtureId: "simple-web-service",
      model: DEFAULT_EVAL_MODEL,
      input: "Return structured JSON.",
      responseSchema: MODEL_EVAL_RESPONSE_JSON_SCHEMA,
    });

    expect(fetchImplementation).toHaveBeenCalledWith(
      "https://newapi.k8s.ewivt.com/v1/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("requires an explicit model override for a non-default base URL", async () => {
    const client = createClient();

    await expect(
      runModelEvals({
        repositoryRoot,
        artifactRoot,
        env: {
          OPENAI_API_KEY: "test-key",
          OPENAI_BASE_URL: "https://api.openai.com/v1",
        },
        client,
        log: () => undefined,
      }),
    ).rejects.toThrow(/REPOLENS_EVAL_MODEL/);
    expect(client.generate).not.toHaveBeenCalled();
  });

  test("reports malformed structured output without hiding the fixture", async () => {
    const client = createClient(async () => ({ architecture: [] }));

    const result = await runModelEvals({
      repositoryRoot,
      artifactRoot,
      env: { OPENAI_API_KEY: "test-key" },
      client,
      log: () => undefined,
    });

    expect(result.exitCode).toBe(1);
    expect(result.cases).toContainEqual(
      expect.objectContaining({
        fixtureId: "simple-web-service",
        status: "failed",
        violations: expect.arrayContaining([expect.stringMatching(/structured output/i)]),
      }),
    );
  });

  test("runs one selected fixture for low-cost diagnostics", async () => {
    const client = createClient();

    const result = await runModelEvals({
      repositoryRoot,
      artifactRoot,
      env: {
        OPENAI_API_KEY: "test-key",
        REPOLENS_EVAL_FIXTURE: "agent-project",
      },
      client,
      log: () => undefined,
    });

    expect(result.cases).toHaveLength(1);
    expect(result.cases[0]).toMatchObject({
      fixtureId: "agent-project",
      status: "passed",
    });
    expect(client.generate).toHaveBeenCalledTimes(1);
    expect(vi.mocked(client.generate).mock.calls[0]?.[0].fixtureId).toBe(
      "agent-project",
    );
  });

  test("treats equivalent concept wording as warnings rather than failure", async () => {
    const client = createClient(async () => ({
      ...(await validOutput("agent-project")),
      coreComponents: [
        "main.handle_alert: Entry point that constructs the agent.",
        "IncidentAgent.run: Orchestrates planning and tool execution.",
        "IncidentPlanner.choose_action: Selects one diagnostic action.",
        "IncidentTools.execute: Returns a diagnostic observation.",
      ],
      requiredFlowEdges: [
        {
          from: "main.handle_alert",
          to: "IncidentAgent.run",
          evidencePaths: ["main.py", "incident_agent.py"],
        },
        {
          from: "IncidentAgent.run",
          to: "IncidentPlanner.choose_action",
          evidencePaths: ["incident_agent.py", "planner.py"],
        },
        {
          from: "IncidentAgent.run",
          to: "IncidentTools.execute",
          evidencePaths: ["incident_agent.py", "tools.py"],
        },
      ],
      importantConcepts: [
        "Separation of orchestration, planning, and execution",
        "Synchronous diagnostic tool abstraction",
        "Input-dependent routing using a case-insensitive latency check",
      ],
    }));

    const result = await runModelEvals({
      repositoryRoot,
      artifactRoot,
      env: {
        OPENAI_API_KEY: "test-key",
        REPOLENS_EVAL_FIXTURE: "agent-project",
      },
      client,
      log: () => undefined,
    });

    expect(result).toMatchObject({
      exitCode: 0,
      cases: [
        {
          fixtureId: "agent-project",
          status: "passed",
          violations: [],
          warnings: expect.arrayContaining([expect.stringMatching(/recommended concept/i)]),
        },
      ],
    });
  });

  test("accepts existing caller-only evidence paths for required edges", async () => {
    const output = await validOutput("simple-web-service");
    output.requiredFlowEdges = output.requiredFlowEdges.map((edge) => ({
      ...edge,
      evidencePaths: edge.evidencePaths.slice(0, 1),
    }));
    const client = createClient(async () => output);

    const result = await runModelEvals({
      repositoryRoot,
      artifactRoot,
      env: {
        OPENAI_API_KEY: "test-key",
        REPOLENS_EVAL_FIXTURE: "simple-web-service",
      },
      client,
      log: () => undefined,
    });

    expect(result.cases[0]).toMatchObject({ status: "passed", violations: [] });
  });

  test("accepts unqualified flow symbols and components with prose descriptions", async () => {
    const output = await validOutput("mcp-server");
    output.coreComponents = [
      "createCatalogServer in src/server.ts handles request routing.",
      "searchCatalog in src/tools/search-catalog.ts filters the catalog.",
      "catalog in src/catalog.ts is the data source.",
      "handleRequest in src/index.ts is the public entry point.",
    ];
    output.requiredFlowEdges = [
      {
        from: "handleRequest",
        to: "handle",
        evidencePaths: ["src/index.ts", "src/server.ts"],
      },
      {
        from: "handle",
        to: "searchCatalog",
        evidencePaths: ["src/server.ts", "src/tools/search-catalog.ts"],
      },
      output.requiredFlowEdges[2],
    ];
    const client = createClient(async () => output);

    const result = await runModelEvals({
      repositoryRoot,
      artifactRoot,
      env: { OPENAI_API_KEY: "test-key", REPOLENS_EVAL_FIXTURE: "mcp-server" },
      client,
      log: () => undefined,
    });

    expect(result.cases[0]).toMatchObject({ status: "passed", violations: [] });
  });

  test("accepts real component symbols followed by an in-file description", async () => {
    const output = await validOutput("rag-app");
    output.coreComponents = [
      "AnswerService.answer in answer_service.py",
      "DocumentRetriever.search in retriever.py",
      "CitationGenerator.generate in generator.py",
      "DOCUMENTS in retriever.py",
    ];
    const client = createClient(async () => output);

    const result = await runModelEvals({
      repositoryRoot,
      artifactRoot,
      env: { OPENAI_API_KEY: "test-key", REPOLENS_EVAL_FIXTURE: "rag-app" },
      client,
      log: () => undefined,
    });

    expect(result.cases[0]).toMatchObject({ status: "passed", violations: [] });
  });

  test("accepts file-qualified symbols and an approved composition relationship", async () => {
    const output = await validOutput("rag-app");
    output.requiredFlowEdges = [
      {
        from: "app.py:answer_question",
        to: "answer_service.py:AnswerService.answer",
        evidencePaths: ["app.py", "answer_service.py"],
      },
      {
        from: "answer_service.py:AnswerService.answer",
        to: "retriever.py:DocumentRetriever.search",
        evidencePaths: ["answer_service.py", "retriever.py"],
      },
      {
        from: "answer_service.py:AnswerService.answer",
        to: "generator.py:CitationGenerator.generate",
        evidencePaths: ["answer_service.py", "generator.py"],
      },
      {
        from: "app.py:answer_question",
        to: "generator.py:CitationGenerator.generate",
        evidencePaths: ["app.py", "generator.py"],
      },
    ];
    const client = createClient(async () => output);

    const result = await runModelEvals({
      repositoryRoot,
      artifactRoot,
      env: { OPENAI_API_KEY: "test-key", REPOLENS_EVAL_FIXTURE: "rag-app" },
      client,
      log: () => undefined,
    });

    expect(result.cases[0]).toMatchObject({ status: "passed", violations: [] });
  });

  test("accepts a manifest-approved sequential data-flow relationship", async () => {
    const output = await validOutput("agent-project");
    output.requiredFlowEdges.push({
      from: "IncidentPlanner.choose_action",
      to: "IncidentTools.execute",
      evidencePaths: ["planner.py", "incident_agent.py", "tools.py"],
    });
    const client = createClient(async () => output);

    const result = await runModelEvals({
      repositoryRoot,
      artifactRoot,
      env: { OPENAI_API_KEY: "test-key", REPOLENS_EVAL_FIXTURE: "agent-project" },
      client,
      log: () => undefined,
    });

    expect(result.cases[0]).toMatchObject({ status: "passed", violations: [] });
  });

  test("fails when a required main call edge is missing", async () => {
    const output = await validOutput("agent-project");
    const client = createClient(async () => ({
      ...output,
      requiredFlowEdges: output.requiredFlowEdges.slice(0, -1),
    }));

    const result = await runModelEvals({
      repositoryRoot,
      artifactRoot,
      env: { OPENAI_API_KEY: "test-key", REPOLENS_EVAL_FIXTURE: "agent-project" },
      client,
      log: () => undefined,
    });

    expect(result.cases[0]).toMatchObject({
      status: "failed",
      violations: expect.arrayContaining([expect.stringMatching(/required flow edge/i)]),
    });
  });

  test("fails when output cites an evidence path that does not exist", async () => {
    const output = await validOutput("agent-project");
    output.requiredFlowEdges[0] = {
      ...output.requiredFlowEdges[0],
      evidencePaths: ["invented.py"],
    };
    const client = createClient(async () => output);

    const result = await runModelEvals({
      repositoryRoot,
      artifactRoot,
      env: { OPENAI_API_KEY: "test-key", REPOLENS_EVAL_FIXTURE: "agent-project" },
      client,
      log: () => undefined,
    });

    expect(result.cases[0]).toMatchObject({
      status: "failed",
      violations: expect.arrayContaining([expect.stringMatching(/evidence path.*invented\.py/i)]),
    });
  });

  test("fails on fabricated components and call relationships", async () => {
    const output = await validOutput("agent-project");
    output.coreComponents.push("ImaginaryCoordinator: invented component");
    output.requiredFlowEdges.push({
      from: "IncidentAgent.run",
      to: "ImaginaryCoordinator.dispatch",
      evidencePaths: ["incident_agent.py"],
    });
    const client = createClient(async () => output);

    const result = await runModelEvals({
      repositoryRoot,
      artifactRoot,
      env: { OPENAI_API_KEY: "test-key", REPOLENS_EVAL_FIXTURE: "agent-project" },
      client,
      log: () => undefined,
    });

    expect(result.cases[0]).toMatchObject({
      status: "failed",
      violations: expect.arrayContaining([
        expect.stringMatching(/component not found/i),
        expect.stringMatching(/unsupported flow edge/i),
      ]),
    });
  });

  test("rejects semantic violations and artifact paths inside a fixture", async () => {
    const client = createClient(async (request) => {
      const output = await validOutput(request.fixtureId);
      if (request.fixtureId !== "rag-app") return output;

      return {
        ...output,
        highValueFiles: ["old_keyword_search.py"],
        claims: ["old_keyword_search.search_everything is used by the application."],
        artifactPaths: {
          ...output.artifactPaths,
          report: path.join(
            repositoryRoot,
            "evals",
            "fixtures",
            request.fixtureId,
            "report.md",
          ),
        },
      };
    });

    const result = await runModelEvals({
      repositoryRoot,
      artifactRoot,
      env: { OPENAI_API_KEY: "test-key" },
      client,
      log: () => undefined,
    });

    expect(result.exitCode).toBe(1);
    expect(result.cases).toContainEqual(
      expect.objectContaining({
        fixtureId: "rag-app",
        status: "failed",
        observed: {
          coreComponents: ["AnswerService", "DocumentRetriever", "CitationGenerator"],
          requiredFlowEdges: expect.any(Array),
          importantConcepts: expect.any(Array),
          highValueFiles: ["old_keyword_search.py"],
          claims: ["old_keyword_search.search_everything is used by the application."],
        },
        violations: expect.arrayContaining([
          expect.stringMatching(/high-value file/i),
          expect.stringMatching(/forbidden claim/i),
          expect.stringMatching(/artifact path/i),
        ]),
      }),
    );
  });
});
