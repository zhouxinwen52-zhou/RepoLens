import { z } from "zod";

const ConfidenceSchema = z.enum(["High", "Medium", "Low"]);

export const EvidenceRefSchema = z
  .object({
    id: z.string().min(1),
    path: z.string().min(1),
    symbol: z.string().min(1).optional(),
    section: z.string().min(1).optional(),
    observation: z.string().min(1),
    status: z.enum(["Observed", "Inferred"]),
    confidence: ConfidenceSchema,
  })
  .strict();

const FindingStatusSchema = z.enum(["Observed", "Inferred"]);
const EvidenceIdsSchema = z.array(z.string().min(1)).min(1);

const ArchitectureNodeSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    evidenceIds: EvidenceIdsSchema,
    status: FindingStatusSchema,
    confidence: ConfidenceSchema,
  })
  .strict();

const ReadingGroupSchema = z.enum([
  "Must Read",
  "Worth Reading",
  "Reference Only",
]);

export const CoreComponentSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    responsibility: z.string().min(1),
    whyItMatters: z.string().min(1),
    keyInterfaces: z.array(z.string().min(1)),
    dependencies: z.array(z.string().min(1)),
    evidenceIds: EvidenceIdsSchema,
    status: FindingStatusSchema,
    confidence: ConfidenceSchema,
    keyFiles: z
      .array(
        z
          .object({
            path: z.string().min(1),
            readingGroup: ReadingGroupSchema,
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

const ArchitectureRelationshipSchema = z
  .object({
    id: z.string().min(1),
    from: z.string().min(1),
    to: z.string().min(1),
    label: z.string().min(1),
    evidenceIds: EvidenceIdsSchema,
    status: FindingStatusSchema,
    confidence: ConfidenceSchema,
  })
  .strict();

export const ArchitectureModelSchema = z
  .object({
    repository: z
      .object({
        identity: z.string().min(1),
        revision: z.string().regex(/^[a-fA-F0-9]{40}$/),
      })
      .strict(),
    title: z.string().min(1),
    systemBoundary: z.string().min(1),
    evidence: z.array(EvidenceRefSchema).min(1),
    components: z.array(CoreComponentSchema).min(1),
    entryPoints: z.array(ArchitectureNodeSchema),
    externalSystems: z.array(ArchitectureNodeSchema),
    relationships: z.array(ArchitectureRelationshipSchema),
  })
  .strict()
  .superRefine((model, context) => {
    const evidenceIds = new Set<string>();
    model.evidence.forEach((evidence, index) => {
      if (evidenceIds.has(evidence.id)) {
        context.addIssue({
          code: "custom",
          path: ["evidence", index, "id"],
          message: `Duplicate evidence ID: ${evidence.id}`,
        });
      }
      evidenceIds.add(evidence.id);
    });

    const nodes = [
      ...model.components.map((node, index) => ({
        node,
        path: ["components", index] as (string | number)[],
      })),
      ...model.entryPoints.map((node, index) => ({
        node,
        path: ["entryPoints", index] as (string | number)[],
      })),
      ...model.externalSystems.map((node, index) => ({
        node,
        path: ["externalSystems", index] as (string | number)[],
      })),
    ];
    const nodeIds = new Set<string>();

    for (const { node, path } of nodes) {
      if (nodeIds.has(node.id)) {
        context.addIssue({
          code: "custom",
          path: [...path, "id"],
          message: `Duplicate architecture node ID: ${node.id}`,
        });
      }
      nodeIds.add(node.id);

      node.evidenceIds.forEach((evidenceId, evidenceIndex) => {
        if (!evidenceIds.has(evidenceId)) {
          context.addIssue({
            code: "custom",
            path: [...path, "evidenceIds", evidenceIndex],
            message: `Unknown evidence ID: ${evidenceId}`,
          });
        }
      });
    }

    const relationshipIds = new Set<string>();
    model.relationships.forEach((relationship, index) => {
      if (relationshipIds.has(relationship.id)) {
        context.addIssue({
          code: "custom",
          path: ["relationships", index, "id"],
          message: `Duplicate relationship ID: ${relationship.id}`,
        });
      }
      relationshipIds.add(relationship.id);

      for (const endpoint of ["from", "to"] as const) {
        if (!nodeIds.has(relationship[endpoint])) {
          context.addIssue({
            code: "custom",
            path: ["relationships", index, endpoint],
            message: `Unknown architecture node ID: ${relationship[endpoint]}`,
          });
        }
      }

      relationship.evidenceIds.forEach((evidenceId, evidenceIndex) => {
        if (!evidenceIds.has(evidenceId)) {
          context.addIssue({
            code: "custom",
            path: ["relationships", index, "evidenceIds", evidenceIndex],
            message: `Unknown evidence ID: ${evidenceId}`,
          });
        }
      });
    });
  });

const VerifiedInstallationSchema = z
  .object({
    status: z.literal("verified"),
    source: z.string().url(),
    steps: z.array(z.string().min(1)).min(1),
  })
  .strict();

const UnverifiedInstallationSchema = z
  .object({
    status: z.literal("unverified"),
    reason: z.string().min(1),
  })
  .strict();

export const DiagramResultSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("validated"),
      artifactPath: z.string().min(1),
    })
    .strict(),
  z
    .object({
      status: z.literal("validation-failed"),
      diagnostics: z.array(z.string().min(1)).min(1),
      recoveryAction: z.string().min(1),
    })
    .strict(),
  z
    .object({
      status: z.literal("delivery-failed"),
      diagnostics: z.array(z.string().min(1)).min(1),
      recoveryAction: z.string().min(1),
    })
    .strict(),
  z
    .object({
      status: z.literal("archify-unavailable"),
      recoveryAction: z.string().min(1),
      installation: z.union([
        VerifiedInstallationSchema,
        UnverifiedInstallationSchema,
      ]),
    })
    .strict(),
]);

const ProfileFitSchema = z
  .object({
    learningValue: z.enum(["High", "Low"]),
    usageValue: z.enum(["High", "Low"]),
    explanation: z.string().min(1),
  })
  .strict();

const RouterRouteSchema = z.enum([
  "LEARN",
  "USE",
  "BOTH",
  "SKIP",
  "NEEDS_EVIDENCE",
]);

const WorkflowSchema = z.enum(["USAGE", "LEARNING"]);

export const RouterResultSchema = z
  .object({
    route: RouterRouteSchema,
    confidence: ConfidenceSchema,
    reasons: z.array(z.string().min(1)).min(1),
    profileFit: ProfileFitSchema,
    evidence: z.array(EvidenceRefSchema).min(1),
    nextWorkflows: z.array(WorkflowSchema),
    missingEvidence: z.array(z.string().min(1)).min(1).optional(),
    attemptedSources: z.array(z.string().min(1)).min(1).optional(),
    recoveryAction: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((result, context) => {
    const expectedWorkflows: Record<z.infer<typeof RouterRouteSchema>, string[]> = {
      LEARN: ["LEARNING"],
      USE: ["USAGE"],
      BOTH: ["USAGE", "LEARNING"],
      SKIP: [],
      NEEDS_EVIDENCE: [],
    };

    if (
      result.nextWorkflows.length !== expectedWorkflows[result.route].length ||
      result.nextWorkflows.some(
        (workflow, index) => workflow !== expectedWorkflows[result.route][index],
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["nextWorkflows"],
        message: `Route ${result.route} requires workflows in this order: ${expectedWorkflows[
          result.route
        ].join(", ")}`,
      });
    }

    if (result.route === "NEEDS_EVIDENCE") {
      for (const field of [
        "missingEvidence",
        "attemptedSources",
        "recoveryAction",
      ] as const) {
        if (result[field] === undefined) {
          context.addIssue({
            code: "custom",
            path: [field],
            message: `${field} is required for NEEDS_EVIDENCE`,
          });
        }
      }
    }
  });

export const UsageReportSchema = z
  .object({
    whatItDoesAndPersonalFit: z
      .object({
        problem: z.string().min(1),
        coreCapability: z.string().min(1),
        workflowFit: z.string().min(1),
        currentToolOverlap: z.string().min(1),
      })
      .strict(),
    requirementsAndRisks: z
      .object({
        prerequisites: z.array(z.string().min(1)),
        permissions: z.array(z.string().min(1)),
        cost: z.string().min(1),
        compatibility: z.string().min(1),
        maintenance: z.string().min(1),
        safety: z.array(z.string().min(1)),
      })
      .strict(),
    quickStart: z
      .object({
        officialInstallation: z.string().min(1),
        minimalConfiguration: z.string().min(1),
        firstUsefulTask: z.string().min(1),
        expectedResult: z.string().min(1),
        verification: z.string().min(1),
      })
      .strict(),
    recommendation: z
      .object({
        decision: z.enum(["USE NOW", "SAVE FOR LATER", "SKIP"]),
        reason: z.string().min(1),
        smallestNextStep: z.string().min(1),
        largestRisk: z.string().min(1),
      })
      .strict(),
  })
  .strict();

const testedLanguages = new Set(["TypeScript", "Python", "Java"]);

export const LanguageSupportSchema = z
  .object({
    primaryLanguage: z.string().min(1),
    status: z.enum(["tested", "best-effort"]),
    disclosure: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((support, context) => {
    const isTestedLanguage = testedLanguages.has(support.primaryLanguage);

    if (support.status === "tested" && !isTestedLanguage) {
      context.addIssue({
        code: "custom",
        path: ["status"],
        message: `${support.primaryLanguage} is not an explicitly tested V0.1 language`,
      });
    }

    if (support.status === "best-effort" && support.disclosure === undefined) {
      context.addIssue({
        code: "custom",
        path: ["disclosure"],
        message: "Best-effort language support requires an early disclosure",
      });
    }
  });

const ProgressStageSchema = z
  .object({
    order: z.number().int().positive(),
    stage: z.string().min(1),
    status: z.enum(["not-started", "in-progress", "completed", "incomplete"]),
    startedAt: z.iso.datetime().optional(),
    completedAt: z.iso.datetime().optional(),
  })
  .strict()
  .superRefine((stage, context) => {
    if (stage.status !== "not-started" && stage.startedAt === undefined) {
      context.addIssue({
        code: "custom",
        path: ["startedAt"],
        message: `${stage.status} stages require a start timestamp`,
      });
    }

    if (stage.status === "completed" && stage.completedAt === undefined) {
      context.addIssue({
        code: "custom",
        path: ["completedAt"],
        message: "Completed stages require a completion timestamp",
      });
    }
  });

export const RunProgressSchema = z
  .object({
    workflow: z.enum(["ROUTER", "USAGE", "LEARNING"]),
    stages: z.array(ProgressStageSchema).min(1),
  })
  .strict()
  .superRefine((progress, context) => {
    progress.stages.forEach((stage, index) => {
      if (index > 0 && stage.order <= progress.stages[index - 1].order) {
        context.addIssue({
          code: "custom",
          path: ["stages", index, "order"],
          message: "Progress stages must be ordered by ascending stage number",
        });
      }
    });
  });

const IncompleteStageSchema = z
  .object({
    stage: z.string().min(1),
    reason: z.string().min(1),
    recoveryAction: z.string().min(1),
  })
  .strict();

export const LearningReportStatusSchema = z
  .object({
    status: z.enum(["complete", "incomplete"]),
    currentStage: z.string().min(1).optional(),
    completedStages: z.array(z.string().min(1)),
    incompleteStages: z.array(IncompleteStageSchema),
  })
  .strict()
  .superRefine((report, context) => {
    if (report.status === "incomplete" && report.incompleteStages.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["incompleteStages"],
        message: "An incomplete report must identify at least one incomplete stage",
      });
    }

    if (report.status === "complete" && report.incompleteStages.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["incompleteStages"],
        message: "A complete report cannot contain incomplete stages",
      });
    }
  });

export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;
export type CoreComponent = z.infer<typeof CoreComponentSchema>;
export type ArchitectureModel = z.infer<typeof ArchitectureModelSchema>;
export type DiagramResult = z.infer<typeof DiagramResultSchema>;
export type RouterResult = z.infer<typeof RouterResultSchema>;
export type UsageReport = z.infer<typeof UsageReportSchema>;
export type LanguageSupport = z.infer<typeof LanguageSupportSchema>;
export type RunProgress = z.infer<typeof RunProgressSchema>;
export type LearningReportStatus = z.infer<typeof LearningReportStatusSchema>;
