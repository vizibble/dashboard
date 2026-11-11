import { z } from "zod";

import {
  idSchema,
  metricKeySchema,
  numericMetricValueSchema,
  timestampSchema,
} from "./common";

const numericReadingSchema = z
  .object({
    metric_key: metricKeySchema,
    timestamp: timestampSchema,
    value_numeric: numericMetricValueSchema,
  })
  .strict();

const typedNumericReadingSchema = z
  .object({
    metric_key: metricKeySchema,
    timestamp: timestampSchema,
    value_type: z.literal("number"),
    value_numeric: numericMetricValueSchema,
  })
  .strict();

const stringReadingSchema = z
  .object({
    metric_key: metricKeySchema,
    timestamp: timestampSchema,
    value_type: z.literal("string"),
    value_text: z.string().max(10_000),
  })
  .strict();

const booleanReadingSchema = z
  .object({
    metric_key: metricKeySchema,
    timestamp: timestampSchema,
    value_type: z.literal("boolean"),
    value_boolean: z.boolean(),
  })
  .strict();

export const ingestTelemetrySchema = z
  .object({
    readings: z
      .array(
        z.union([
          numericReadingSchema,
          typedNumericReadingSchema,
          stringReadingSchema,
          booleanReadingSchema,
        ]),
      )
      .min(1)
      .max(500),
  })
  .strict();

export const telemetryQuerySchema = z
  .object({
    device_id: idSchema.optional(),
    metric_key: metricKeySchema.optional(),
    from: timestampSchema.optional(),
    to: timestampSchema.optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(200),
  })
  .strict()
  .refine(
    ({ from, to }) =>
      !from || !to || new Date(from).getTime() <= new Date(to).getTime(),
    { message: "`from` must be earlier than or equal to `to`" },
  );

export type IngestTelemetryInput = z.infer<typeof ingestTelemetrySchema>;
export type TelemetryQuery = z.infer<typeof telemetryQuerySchema>;

// --- Responses ---------------------------------------------------------------

export const telemetryReadingSchema = z.object({
  id: z.string(),
  device_id: z.string(),
  metric_key: z.string(),
  timestamp: z.coerce.date(),
  value_numeric: z.string().nullable(),
  value_text: z.string().nullable(),
  value_boolean: z.boolean().nullable(),
});

export const ingestTelemetryResultSchema = z.object({
  accepted: z.number().int(),
});

export type TelemetryReading = z.infer<typeof telemetryReadingSchema>;
export type IngestTelemetryResult = z.infer<typeof ingestTelemetryResultSchema>;
