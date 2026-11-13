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

const RuntimeTriggerSchema = z
  .object({
    participant: z.string().min(1),
    file: z.string().min(1),
    symbol: z.string().min(1),
    input: z.string().min(1),
    action: z.string().min(1),
    evidenceIds: EvidenceIdsSchema,
  })
  .strict();

const RuntimeParticipantSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    boundary: z.enum(["internal", "external"]),
  })
  .strict();

const DynamicDispatchSchema = z
  .object({
    mechanism: z.string().min(1),
    uncertainty: z.string().min(1),
    evidenceIds: EvidenceIdsSchema,
  })
  .strict();

const RuntimeStepSchema = z
  .object({
    id: z.string().min(1),
    order: z.number().int().positive(),
    participant: z.string().min(1),
    file: z.string().min(1),
    symbol: z.string().min(1),
    input: z.string().min(1),
    action: z.string().min(1),
    output: z.string().min(1),
    next: z.string().min(1).nullable(),
    evidenceIds: EvidenceIdsSchema,
    confidence: ConfidenceSchema,
    stateChanges: z.array(z.string().min(1)).min(1).optional(),
    asynchronousBoundary: z.string().min(1).optional(),
    externalInteraction: z.string().min(1).optional(),
    dynamicDispatch: DynamicDispatchSchema.optional(),
  })
  .strict();

export const RuntimeFlowModelSchema = z
  .object({
    repository: z
      .object({
        identity: z.string().min(1),
        revision: z.string().regex(/^[a-fA-F0-9]{40}$/),
      })
      .strict(),
    title: z.string().min(1),
    flowShape: z.enum(["sequence", "workflow", "dataflow"]),
    evidence: z.array(EvidenceRefSchema).min(1),
    trigger: RuntimeTriggerSchema,
    participants: z.array(RuntimeParticipantSchema).min(1),
    steps: z.array(RuntimeStepSchema).min(1),
    finalResult: z
      .object({
        stepId: z.string().min(1),
        participant: z.string().min(1),
        observableResult: z.string().min(1),
        evidenceIds: EvidenceIdsSchema,
      })
      .strict(),
  })
  .strict()
  .superRefine((flow, context) => {
    const evidenceIds = new Set<string>();
    flow.evidence.forEach((evidence, index) => {
      if (evidenceIds.has(evidence.id)) {
        context.addIssue({
          code: "custom",
          path: ["evidence", index, "id"],
          message: `Duplicate evidence ID: ${evidence.id}`,
        });
      }
      evidenceIds.add(evidence.id);
    });

    const validateEvidenceIds = (
      ids: string[],
      path: (string | number)[],
    ): void => {
      ids.forEach((id, index) => {
        if (!evidenceIds.has(id)) {
          context.addIssue({
            code: "custom",
            path: [...path, index],
            message: `Unknown evidence ID: ${id}`,
          });
        }
      });
    };

    const participantIds = new Set<string>();
    flow.participants.forEach((participant, index) => {
      if (participantIds.has(participant.id)) {
        context.addIssue({
          code: "custom",
          path: ["participants", index, "id"],
          message: `Duplicate runtime participant ID: ${participant.id}`,
        });
      }
      participantIds.add(participant.id);
    });

    const validateParticipant = (
      participant: string,
      path: (string | number)[],
    ): void => {
      if (!participantIds.has(participant)) {
        context.addIssue({
          code: "custom",
          path,
          message: `Unknown runtime participant ID: ${participant}`,
        });
      }
    };

    validateParticipant(flow.trigger.participant, ["trigger", "participant"]);
    validateEvidenceIds(flow.trigger.evidenceIds, ["trigger", "evidenceIds"]);

    const stepIds = new Set<string>();
    flow.steps.forEach((step, index) => {
      if (stepIds.has(step.id)) {
        context.addIssue({
          code: "custom",
          path: ["steps", index, "id"],
          message: `Duplicate runtime step ID: ${step.id}`,
        });
      }
      stepIds.add(step.id);

      if (step.order !== index + 1) {
        context.addIssue({
          code: "custom",
          path: ["steps", index, "order"],
          message: "Runtime steps must use contiguous one-based order",
        });
      }

      const expectedNext = flow.steps[index + 1]?.id ?? null;
      if (step.next !== expectedNext) {
        context.addIssue({
          code: "custom",
          path: ["steps", index, "next"],
          message:
            expectedNext === null
              ? "The final runtime step must have a null next link"
              : `Runtime step must link to the next confirmed step: ${expectedNext}`,
        });
      }

      validateParticipant(step.participant, ["steps", index, "participant"]);
      validateEvidenceIds(step.evidenceIds, ["steps", index, "evidenceIds"]);
      if (step.dynamicDispatch !== undefined) {
        validateEvidenceIds(step.dynamicDispatch.evidenceIds, [
          "steps",
          index,
          "dynamicDispatch",
          "evidenceIds",
        ]);
      }
    });

    const finalStep = flow.steps.at(-1);
    if (finalStep !== undefined && flow.finalResult.stepId !== finalStep.id) {
      context.addIssue({
        code: "custom",
        path: ["finalResult", "stepId"],
        message: "The observable result must be produced by the final confirmed step",
      });
    }
    validateParticipant(flow.finalResult.participant, [
      "finalResult",
      "participant",
    ]);
    validateEvidenceIds(flow.finalResult.evidenceIds, [
      "finalResult",
      "evidenceIds",
    ]);
  });

export const TechnicalConceptSchema = z
  .object({
    name: z.string().min(1),
    explanation: z.string().min(1),
    repositoryUse: z.string().min(1),
  })
  .strict();

const TechnicalEnglishItemSchema = z
  .object({
    expression: z.string().min(1),
    meaningInContext: z.string().min(1),
    engineerUsage: z.string().min(1),
  })
  .strict();

const EnabledTechnicalEnglishSchema = z
  .object({
    status: z.literal("Enabled"),
    target: z
      .object({
        minimum: z.literal(10),
        maximum: z.literal(15),
      })
      .strict(),
    items: z.array(TechnicalEnglishItemSchema).max(15),
    insufficientQualityNote: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((stage, context) => {
    if (stage.items.length < 10 && stage.insufficientQualityNote === undefined) {
      context.addIssue({
        code: "custom",
        path: ["insufficientQualityNote"],
        message:
          "Fewer than 10 Technical English items require an insufficient-quality note",
      });
    }
  });

export const TechnicalEnglishSchema = z.discriminatedUnion("status", [
  EnabledTechnicalEnglishSchema,
  z
    .object({
      status: z.literal("Skipped by Profile"),
      reason: z.string().min(1),
    })
    .strict(),
]);

const LearningClassificationValueSchema = z.enum([
  "Known",
  "New",
  "Can Skip",
  "Unclear",
]);

export const LearningClassificationSchema = z
  .object({
    subject: z.string().min(1),
    classification: LearningClassificationValueSchema,
    explanation: z.string().min(1),
  })
  .strict();

export const AppliedPracticeSchema = z
  .object({
    type: z.enum(["New Concept", "Reinforcement"]),
    title: z.string().min(1),
    concept: z.string().min(1),
    classification: LearningClassificationValueSchema,
    whyItFits: z.string().min(1),
    task: z.string().min(1),
    constraints: z.array(z.string().min(1)).min(1),
    successCriteria: z.array(z.string().min(1)).min(1),
    timeEstimate: z.string().min(1),
    hints: z.array(z.string().min(1)).min(1).max(3),
  })
  .strict()
  .superRefine((practice, context) => {
    const expectedClassification =
      practice.type === "New Concept" ? "New" : "Known";
    if (practice.classification !== expectedClassification) {
      context.addIssue({
        code: "custom",
        path: ["classification"],
        message: `${practice.type} practice requires a ${expectedClassification} classification`,
      });
    }
  });

const InspiredIdeaBaseShape = {
  title: z.string().min(1),
  inspiration: z.string().min(1),
  description: z.string().min(1),
  profileFit: z.string().min(1),
  unknowns: z.array(z.string().min(1)),
  evaluateIdeaHandoff: z.boolean(),
};

export const InspiredIdeaSchema = z.discriminatedUnion("source", [
  z
    .object({
      source: z.literal("User"),
      ...InspiredIdeaBaseShape,
    })
    .strict(),
  z
    .object({
      source: z.literal("AI"),
      ...InspiredIdeaBaseShape,
      repositoryGrounding: z
        .object({
          mechanism: z.string().min(1),
          evidenceIds: EvidenceIdsSchema,
        })
        .strict(),
    })
    .strict(),
]);

const SavedArtifactFilesSchema = z
  .object({
    report: z.string().min(1),
    architecture: z.string().min(1).optional(),
    runtimeFlow: z.string().min(1).optional(),
  })
  .strict();

const RetrySaveActionSchema = z
  .object({
    type: z.literal("retry-save"),
    label: z.string().min(1),
    usesCurrentRunBundle: z.literal(true),
  })
  .strict();

export const ArtifactDeliveryResultSchema = z.discriminatedUnion(
  "artifactStatus",
  [
    z
      .object({
        analysisStatus: z.enum(["complete", "incomplete"]),
        artifactStatus: z.literal("saved"),
        intendedDestination: z.string().min(1),
        files: SavedArtifactFilesSchema,
      })
      .strict(),
    z
      .object({
        analysisStatus: z.enum(["complete", "incomplete"]),
        artifactStatus: z.literal("incomplete"),
        intendedDestination: z.string().min(1),
        diagnostics: z.array(z.string().min(1)).min(1),
        recoveryActions: z.tuple([RetrySaveActionSchema]),
      })
      .strict(),
  ],
);

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
export type RuntimeFlowModel = z.infer<typeof RuntimeFlowModelSchema>;
export type TechnicalConcept = z.infer<typeof TechnicalConceptSchema>;
export type TechnicalEnglish = z.infer<typeof TechnicalEnglishSchema>;
export type LearningClassification = z.infer<
  typeof LearningClassificationSchema
>;
export type AppliedPractice = z.infer<typeof AppliedPracticeSchema>;
export type InspiredIdea = z.infer<typeof InspiredIdeaSchema>;
export type ArtifactDeliveryResult = z.infer<
  typeof ArtifactDeliveryResultSchema
>;
export type DiagramResult = z.infer<typeof DiagramResultSchema>;
export type RouterResult = z.infer<typeof RouterResultSchema>;
export type UsageReport = z.infer<typeof UsageReportSchema>;
export type LanguageSupport = z.infer<typeof LanguageSupportSchema>;
export type RunProgress = z.infer<typeof RunProgressSchema>;
export type LearningReportStatus = z.infer<typeof LearningReportStatusSchema>;
