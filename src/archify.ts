import {
  ArchitectureModelSchema,
  RuntimeFlowModelSchema,
  type ArchitectureModel,
  type EvidenceRef,
  type RuntimeFlowModel,
} from "./contracts.js";

type ArchifyComponentType =
  | "frontend"
  | "backend"
  | "database"
  | "cloud"
  | "security"
  | "messagebus"
  | "external";

type ArchifySource = {
  path: string;
  line?: number;
  end_line?: number;
  label?: string;
};

type ArchifyComponent = {
  id: string;
  type: ArchifyComponentType;
  label: string;
  sublabel?: string;
  sources?: ArchifySource[];
  row: number;
  col: number;
  size: [number, number];
  boundary?: "internal" | "external";
};

type ArchifyConnection = {
  id: string;
  from: string;
  to: string;
  label: string;
  variant: "default" | "emphasis" | "security" | "dashed";
  stateChanges?: string[];
  asynchronousBoundary?: string;
  externalInteraction?: string;
  confidence?: "High" | "Medium" | "Low";
};

export type ArchifySpec = {
  schema_version: 1;
  diagram_type: "architecture" | "sequence" | "workflow" | "dataflow";
  meta: {
    title: string;
    quality_profile: "showcase";
    repository?: {
      url: string;
      revision: string;
    };
  };
  layout: {
    mode: "grid";
    origin: [number, number];
    cols: number;
    gapX: number;
    gapY: number;
    cellW: number;
    cellH: number;
  };
  components: ArchifyComponent[];
  connections: ArchifyConnection[];
};

export type RuntimeFlowAdapterResult =
  | {
      status: "ready";
      spec: ArchifySpec;
    }
  | {
      status: "validation-failed";
      diagnostics: string[];
    };

const archifyIdPattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

function assertArchifyId(id: string, subject: string): void {
  if (!archifyIdPattern.test(id)) {
    throw new Error(`${subject} ID is not valid for Archify: ${id}`);
  }
}

function isHttpRepositoryIdentity(identity: string): boolean {
  try {
    const url = new URL(identity);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sourcesFor(
  evidenceIds: string[],
  evidenceById: ReadonlyMap<string, EvidenceRef>,
  includeSources: boolean,
): ArchifySource[] | undefined {
  if (!includeSources) return undefined;

  const sources = evidenceIds
    .map((id) => evidenceById.get(id))
    .filter((evidence): evidence is EvidenceRef => evidence !== undefined)
    .map((evidence) => ({ path: evidence.path }))
    .filter(
      (source, index, all) =>
        all.findIndex((candidate) => candidate.path === source.path) === index,
    )
    .slice(0, 3);

  return sources.length > 0 ? sources : undefined;
}

export function toArchifyArchitecture(model: ArchitectureModel): ArchifySpec {
  const validated = ArchitectureModelSchema.parse(model);
  const evidenceById = new Map(
    validated.evidence.map((evidence) => [evidence.id, evidence]),
  );
  const includeRepositoryEvidence = isHttpRepositoryIdentity(
    validated.repository.identity,
  );

  const unpositionedComponents = [
    ...validated.components.map((component) => ({
      id: component.id,
      type: "backend" as const,
      label: component.name,
      sublabel: component.responsibility,
      sources: sourcesFor(
        component.evidenceIds,
        evidenceById,
        includeRepositoryEvidence,
      ),
    })),
    ...validated.entryPoints.map((entryPoint) => ({
      id: entryPoint.id,
      type: "frontend" as const,
      label: entryPoint.name,
      sublabel: "Entry point",
      sources: sourcesFor(
        entryPoint.evidenceIds,
        evidenceById,
        includeRepositoryEvidence,
      ),
    })),
    ...validated.externalSystems.map((externalSystem) => ({
      id: externalSystem.id,
      type: "external" as const,
      label: externalSystem.name,
      sources: sourcesFor(
        externalSystem.evidenceIds,
        evidenceById,
        includeRepositoryEvidence,
      ),
    })),
  ];
  const columns = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(unpositionedComponents.length))));
  const components: ArchifyComponent[] = unpositionedComponents.map(
    (component, index) => ({
      ...component,
      row: Math.floor(index / columns),
      col: index % columns,
      size: [220, 80],
    }),
  );

  components.forEach((component) =>
    assertArchifyId(component.id, "Component"),
  );

  const connections = validated.relationships.map((relationship) => {
    assertArchifyId(relationship.id, "Relationship");

    return {
      id: relationship.id,
      from: relationship.from,
      to: relationship.to,
      label: relationship.label,
      variant:
        relationship.status === "Observed"
          ? ("default" as const)
          : ("dashed" as const),
    };
  });

  return {
    schema_version: 1,
    diagram_type: "architecture",
    meta: {
      title: validated.title,
      quality_profile: "showcase",
      ...(includeRepositoryEvidence
        ? {
            repository: {
              url: validated.repository.identity,
              revision: validated.repository.revision,
            },
          }
        : {}),
    },
    layout: {
      mode: "grid",
      origin: [80, 120],
      cols: columns,
      gapX: 70,
      gapY: 80,
      cellW: 220,
      cellH: 80,
    },
    components,
    connections,
  };
}

function validationDiagnostics(
  issues: { path: PropertyKey[]; message: string }[],
): string[] {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "runtimeFlow";
    return `${path}: ${issue.message}`;
  });
}

function runtimeFlowSpec(model: RuntimeFlowModel): ArchifySpec {
  const columns = Math.min(3, model.participants.length);
  const components: ArchifyComponent[] = model.participants.map(
    (participant, index) => ({
      id: participant.id,
      type: participant.boundary === "external" ? "external" : "backend",
      label: participant.name,
      row: Math.floor(index / columns),
      col: index % columns,
      size: [220, 80],
      boundary: participant.boundary,
    }),
  );

  components.forEach((component) =>
    assertArchifyId(component.id, "Runtime participant"),
  );

  const stepById = new Map(model.steps.map((step) => [step.id, step]));
  const connections: ArchifyConnection[] = model.steps.map((step) => {
    assertArchifyId(step.id, "Runtime step");
    const destination =
      step.next === null
        ? model.finalResult.participant
        : stepById.get(step.next)?.participant;

    if (destination === undefined) {
      throw new Error(`Runtime step has no confirmed destination: ${step.id}`);
    }

    return {
      id: step.id,
      from: step.participant,
      to: destination,
      label: step.action,
      variant:
        step.confidence === "High"
          ? ("default" as const)
          : ("dashed" as const),
      stateChanges: step.stateChanges,
      asynchronousBoundary: step.asynchronousBoundary,
      externalInteraction: step.externalInteraction,
      confidence: step.confidence,
    };
  });

  return {
    schema_version: 1,
    diagram_type: model.flowShape,
    meta: {
      title: model.title,
      quality_profile: "showcase",
      ...(isHttpRepositoryIdentity(model.repository.identity)
        ? {
            repository: {
              url: model.repository.identity,
              revision: model.repository.revision,
            },
          }
        : {}),
    },
    layout: {
      mode: "grid",
      origin: [0, 0],
      cols: columns,
      gapX: 80,
      gapY: 80,
      cellW: 260,
      cellH: 120,
    },
    components,
    connections,
  };
}

export function toArchifyRuntimeFlow(
  model: unknown,
): RuntimeFlowAdapterResult {
  const validated = RuntimeFlowModelSchema.safeParse(model);
  if (!validated.success) {
    return {
      status: "validation-failed",
      diagnostics: validationDiagnostics(validated.error.issues),
    };
  }

  try {
    return {
      status: "ready",
      spec: runtimeFlowSpec(validated.data),
    };
  } catch (error) {
    return {
      status: "validation-failed",
      diagnostics: [
        error instanceof Error
          ? error.message
          : "Runtime flow conversion failed validation.",
      ],
    };
  }
}
