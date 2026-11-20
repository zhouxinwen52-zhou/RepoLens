import { z } from "zod";

export const DEFAULT_EVAL_BASE_URL = "https://newapi.k8s.ewivt.com";
export const DEFAULT_EVAL_MODEL = "MiniMax-M3.1-Flash";

const FixtureMetadataSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    source: z.literal("local"),
    immutable: z.literal(true),
  })
  .strict();

const ExpectedEntryPointSchema = z
  .object({
    path: z.string().min(1),
    symbol: z.string().min(1),
  })
  .strict();

const RequiredFlowEdgeSchema = z
  .object({
    from: z.string().min(1),
    to: z.string().min(1),
    evidencePaths: z.array(z.string().min(1)).min(1),
  })
  .strict();

const ProfileExpectationSchema = z
  .object({
    profilePath: z.string().min(1),
    technicalEnglish: z.enum(["Enabled", "Skipped by Profile"]),
    noDefensibleNewConcept: z.boolean(),
    expectedPracticeType: z.enum(["New Concept", "Reinforcement"]),
    teachingFocus: z.array(z.string().min(1)).min(1),
  })
  .strict()
  .superRefine((expectation, context) => {
    if (
      expectation.noDefensibleNewConcept &&
      expectation.expectedPracticeType !== "Reinforcement"
    ) {
      context.addIssue({
        code: "custom",
        path: ["expectedPracticeType"],
        message: "A no-defensible-New case must use Reinforcement.",
      });
    }
  });

const FactInvariantSchema = z.enum([
  "primaryLanguage",
  "entryPoints",
  "requiredFlowEdges",
  "highValueFiles",
  "forbiddenClaims",
]);

export const ExpectedPropertiesSchema = z
  .object({
    fixture: FixtureMetadataSchema,
    hardInvariants: z
      .object({
        primaryLanguage: z.enum(["TypeScript", "Python", "Java"]),
        entryPoints: z.array(ExpectedEntryPointSchema).min(1),
        requiredFlowEdges: z.array(RequiredFlowEdgeSchema).min(1),
        allowedFlowEdges: z.array(RequiredFlowEdgeSchema).min(1),
        highValueFiles: z.array(z.string().min(1)).min(1),
        forbiddenClaims: z.array(z.string().min(1)).min(1),
      })
      .strict(),
    softExpectations: z
      .object({
        architectureThemes: z.array(z.string().min(1)).min(1),
        coreComponents: z.array(z.string().min(1)).min(1),
        importantConcepts: z.array(z.string().min(1)).min(1),
        teachingFocus: z.array(z.string().min(1)).min(1),
        recommendedTerms: z.array(z.string().min(1)).min(1),
        acceptableVariations: z.array(z.string().min(1)),
      })
      .strict(),
    profileExpectations: z
      .object({
        stableFactsAcrossProfiles: z.literal(true),
        factInvariants: z.array(FactInvariantSchema).length(5),
        cases: z.array(ProfileExpectationSchema).min(2),
      })
      .strict(),
  })
  .strict()
  .superRefine((expected, context) => {
    const invariantFields = new Set(expected.profileExpectations.factInvariants);
    for (const field of FactInvariantSchema.options) {
      if (!invariantFields.has(field)) {
        context.addIssue({
          code: "custom",
          path: ["profileExpectations", "factInvariants"],
          message: `Missing fact invariant: ${field}`,
        });
      }
    }

    const profilePaths = expected.profileExpectations.cases.map(
      (profileCase) => profileCase.profilePath,
    );
    if (new Set(profilePaths).size !== profilePaths.length) {
      context.addIssue({
        code: "custom",
        path: ["profileExpectations", "cases"],
        message: "Profile expectation paths must be unique.",
      });
    }

    if (
      !expected.profileExpectations.cases.some(
        (profileCase) => profileCase.technicalEnglish === "Skipped by Profile",
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["profileExpectations", "cases"],
        message: "At least one Profile must opt out of Technical English.",
      });
    }

    if (
      !expected.profileExpectations.cases.some(
        (profileCase) =>
          profileCase.noDefensibleNewConcept &&
          profileCase.expectedPracticeType === "Reinforcement",
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["profileExpectations", "cases"],
        message: "At least one no-defensible-New case must expect Reinforcement.",
      });
    }

    for (const edge of expected.hardInvariants.requiredFlowEdges) {
      if (
        !expected.hardInvariants.allowedFlowEdges.some(
          (allowed) => allowed.from === edge.from && allowed.to === edge.to,
        )
      ) {
        context.addIssue({
          code: "custom",
          path: ["hardInvariants", "allowedFlowEdges"],
          message: `Required flow edge is not allowed: ${edge.from} -> ${edge.to}`,
        });
      }
    }
  });

export type ExpectedProperties = z.infer<typeof ExpectedPropertiesSchema>;

const IdeaDimensionNameSchema = z.enum([
  "Novelty",
  "Learning ROI",
  "Portfolio Value",
  "Goal Alignment",
  "Feasibility",
  "Skill Fit",
]);

export const IdeaCaseSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    profilePath: z.string().min(1),
    origin: z.enum(["user-provided", "learning-report"]),
    idea: z
      .object({
        problem: z.string().min(1),
        targetUser: z.string().min(1),
        proposedSolution: z.string().min(1),
        whyNow: z.string().min(1),
      })
      .strict(),
    research: z
      .object({
        consent: z.enum(["not-requested", "granted", "declined"]),
        mustRequestConsentBeforeLookup: z.literal(true),
        externalLookupPerformed: z.boolean(),
        evidenceState: z.string().min(1),
      })
      .strict(),
    expected: z
      .object({
        decision: z.enum(["BUILD", "PROTOTYPE", "SAVE", "SKIP"]),
        reasoningProperties: z.array(z.string().min(1)).min(1),
        forbiddenReasoning: z.array(z.string().min(1)).min(1),
        unknownDimensions: z.array(IdeaDimensionNameSchema),
        requiredKnownDimensions: z.array(IdeaDimensionNameSchema),
        criticalUnknown: z
          .object({
            nameRequired: z.literal(true),
            reasonRequired: z.literal(true),
            verificationRequired: z.literal(true),
            affectedDimensions: z.array(IdeaDimensionNameSchema).min(1),
          })
          .strict()
          .nullable(),
        requireSmallestUsefulScope: z.literal(true),
        requireNextAction: z.literal(true),
      })
      .strict(),
  })
  .strict()
  .superRefine((ideaCase, context) => {
    if (
      ideaCase.research.externalLookupPerformed &&
      ideaCase.research.consent !== "granted"
    ) {
      context.addIssue({
        code: "custom",
        path: ["research", "externalLookupPerformed"],
        message: "External lookup requires granted consent.",
      });
    }

    if (
      ideaCase.research.consent === "declined" &&
      !ideaCase.expected.unknownDimensions.includes("Novelty")
    ) {
      context.addIssue({
        code: "custom",
        path: ["expected", "unknownDimensions"],
        message: "Declined research requires Novelty to remain Unknown.",
      });
    }

    if (ideaCase.expected.decision === "BUILD") {
      for (const dimension of ["Goal Alignment", "Feasibility"] as const) {
        if (!ideaCase.expected.requiredKnownDimensions.includes(dimension)) {
          context.addIssue({
            code: "custom",
            path: ["expected", "requiredKnownDimensions"],
            message: `BUILD requires ${dimension} to be known.`,
          });
        }
      }

      if (ideaCase.expected.criticalUnknown !== null) {
        context.addIssue({
          code: "custom",
          path: ["expected", "criticalUnknown"],
          message: "BUILD cannot retain a decision-changing critical unknown.",
        });
      }
    }
  });

export type IdeaCase = z.infer<typeof IdeaCaseSchema>;

const EvalEntryPointSchema = z
  .object({
    path: z.string().min(1),
    symbol: z.string().min(1),
  })
  .strict();

const EvalFlowEdgeSchema = z
  .object({
    from: z.string().min(1),
    to: z.string().min(1),
    evidencePaths: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const ModelEvalOutputSchema = z
  .object({
    primaryLanguage: z.enum(["TypeScript", "Python", "Java"]),
    architecture: z.array(z.string().min(1)).min(1),
    entryPoints: z.array(EvalEntryPointSchema).min(1),
    coreComponents: z.array(z.string().min(1)).min(1),
    requiredFlowEdges: z.array(EvalFlowEdgeSchema).min(1),
    highValueFiles: z.array(z.string().min(1)).min(1),
    claims: z.array(z.string().min(1)),
    importantConcepts: z.array(z.string().min(1)).min(1),
    artifactPaths: z
      .object({
        report: z.string().min(1),
        architecture: z.string().min(1),
        runtimeFlow: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export type ModelEvalOutput = z.infer<typeof ModelEvalOutputSchema>;

export const MODEL_EVAL_RESPONSE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "primaryLanguage",
    "architecture",
    "entryPoints",
    "coreComponents",
    "requiredFlowEdges",
    "highValueFiles",
    "claims",
    "importantConcepts",
    "artifactPaths",
  ],
  properties: {
    primaryLanguage: { type: "string", enum: ["TypeScript", "Python", "Java"] },
    architecture: { type: "array", minItems: 1, items: { type: "string" } },
    entryPoints: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "symbol"],
        properties: {
          path: { type: "string" },
          symbol: { type: "string" },
        },
      },
    },
    coreComponents: { type: "array", minItems: 1, items: { type: "string" } },
    requiredFlowEdges: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["from", "to", "evidencePaths"],
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          evidencePaths: {
            type: "array",
            minItems: 1,
            items: { type: "string" },
          },
        },
      },
    },
    highValueFiles: { type: "array", minItems: 1, items: { type: "string" } },
    claims: { type: "array", items: { type: "string" } },
    importantConcepts: { type: "array", minItems: 1, items: { type: "string" } },
    artifactPaths: {
      type: "object",
      additionalProperties: false,
      required: ["report", "architecture", "runtimeFlow"],
      properties: {
        report: { type: "string" },
        architecture: { type: "string" },
        runtimeFlow: { type: "string" },
      },
    },
  },
} as const;
