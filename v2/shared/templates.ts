import { z } from "zod";

import { descriptionSchema, metricKeySchema, nameSchema } from "./common";

export const metricDataTypeSchema = z.enum([
  "number",
  "integer",
  "string",
  "boolean",
]);

const unitSchema = z.string().trim().max(40).nullable().optional();

/** One telemetry parameter a device of this template sends. */
export const templateParameterSchema = z
  .object({
    /** Catalogue entry it was picked from, if any. Label/unit may still be customised. */
    metric_definition_id: z.uuid().nullable().optional(),
    key: metricKeySchema,
    label: nameSchema,
    data_type: metricDataTypeSchema,
    unit: unitSchema,
    symbol: unitSchema,
  })
  .strict();

const parametersSchema = z
  .array(templateParameterSchema)
  .max(200)
  .refine(
    (parameters) =>
      new Set(parameters.map(({ key }) => key)).size === parameters.length,
    { message: "Each parameter key can only be used once in a template" },
  );

export const createTemplateSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema.optional(),
    parameters: parametersSchema.default([]),
  })
  .strict();

export const updateTemplateSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

export const replaceTemplateParametersSchema = z
  .object({ parameters: parametersSchema })
  .strict();

/** A custom catalogue entry created by an organisation. */
export const createMetricDefinitionSchema = z
  .object({
    key: metricKeySchema,
    label: nameSchema,
    data_type: metricDataTypeSchema,
    unit: unitSchema,
    symbol: unitSchema,
    category: z.string().trim().max(60).nullable().optional(),
  })
  .strict();

export type MetricDataType = z.infer<typeof metricDataTypeSchema>;
export type TemplateParameterInput = z.infer<typeof templateParameterSchema>;
export type CreateTemplateInput = z.input<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type ReplaceTemplateParametersInput = z.infer<
  typeof replaceTemplateParametersSchema
>;
export type CreateMetricDefinitionInput = z.infer<
  typeof createMetricDefinitionSchema
>;

// --- Responses ---------------------------------------------------------------

export const metricDefinitionSchema = z.object({
  id: z.string(),
  key: z.string(),
  label: z.string(),
  unit: z.string().nullable(),
  symbol: z.string().nullable(),
  data_type: metricDataTypeSchema,
  category: z.string().nullable(),
  is_built_in: z.boolean(),
});

export const templateParameterResponseSchema = z.object({
  id: z.string(),
  metric_definition_id: z.string().nullable(),
  key: z.string(),
  label: z.string(),
  data_type: metricDataTypeSchema,
  unit: z.string().nullable(),
  symbol: z.string().nullable(),
});

export const templateSummarySchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  parameter_count: z.number().int(),
  device_count: z.number().int(),
});

export const templateSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  parameters: z.array(templateParameterResponseSchema),
  device_count: z.number().int(),
});

export type MetricDefinition = z.infer<typeof metricDefinitionSchema>;
export type TemplateParameter = z.infer<typeof templateParameterResponseSchema>;
export type TemplateSummary = z.infer<typeof templateSummarySchema>;
export type Template = z.infer<typeof templateSchema>;
