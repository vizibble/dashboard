import { z } from "zod";

import { idSchema, metricKeySchema, timestampSchema } from "./common";
import {
  aggregations,
  bucketSizes,
  metricDataTypes,
  timeRanges,
} from "./dashboards";

// --- Requests ------------------------------------------------------------------

/**
 * Which devices a query reads. Empty lists mean the whole organisation.
 * Devices and locations combine (union); every id is checked against the organisation.
 */
export const analyticsScopeSchema = z
  .object({
    device_ids: z.array(idSchema).max(100).default([]),
    location_ids: z.array(idSchema).max(50).default([]),
    include_child_locations: z.boolean().default(true),
  })
  .strict();

export const analyticsQuerySchema = z
  .object({
    /** Caller's key for matching results to widgets. */
    id: z.string().min(1).max(100),
    scope: analyticsScopeSchema,
    metric_key: metricKeySchema,
    aggregation: z.enum(aggregations),
    /** `series` buckets over time; `summary` returns one value per device (or overall). */
    mode: z.enum(["series", "summary"]).default("series"),
    bucket_size: z.enum(bucketSizes).default("auto"),
    split_by_device: z.boolean().default(true),
    time_range: z.enum(timeRanges).default("24h"),
    time_from: timestampSchema.nullable().optional(),
    time_to: timestampSchema.nullable().optional(),
    /** Summary mode: also compute the preceding period of the same length or calendar unit. */
    compare_previous: z.boolean().default(false),
    latitude_metric: metricKeySchema.nullable().optional(),
    longitude_metric: metricKeySchema.nullable().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.time_range !== "custom" ||
      (value.time_from != null &&
        value.time_to != null &&
        new Date(value.time_from) < new Date(value.time_to)),
    { message: "A custom range needs a start before its end" },
  );

export const analyticsBatchSchema = z
  .object({ queries: z.array(analyticsQuerySchema).min(1).max(30) })
  .strict();

export const metricDiscoverySchema = z
  .object({ scope: analyticsScopeSchema })
  .strict();

export type AnalyticsScope = z.input<typeof analyticsScopeSchema>;
export type AnalyticsQuery = z.input<typeof analyticsQuerySchema>;
export type ParsedAnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type AnalyticsBatchInput = z.input<typeof analyticsBatchSchema>;

// --- Responses -----------------------------------------------------------------

const valueSchema = z.union([z.number(), z.string(), z.boolean()]).nullable();

export const metricInfoSchema = z.object({
  key: z.string(),
  label: z.string(),
  unit: z.string().nullable(),
  symbol: z.string().nullable(),
  data_type: z.enum(metricDataTypes),
});

/** `value: null` is a bucket with no readings. It is never zero-filled. */
export const seriesPointSchema = z.object({
  t: z.coerce.date(),
  value: valueSchema,
  count: z.number(),
});

export const seriesSchema = z.object({
  device_id: z.string().nullable(),
  device_name: z.string().nullable(),
  points: z.array(seriesPointSchema),
});

export const summaryValueSchema = z.object({
  device_id: z.string().nullable(),
  device_name: z.string().nullable(),
  value: valueSchema,
  /** Reading time for `latest`; null for aggregates. */
  t: z.coerce.date().nullable(),
  count: z.number(),
  previous: valueSchema.optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export const missingReasons = [
  "metric_not_in_template",
  "incompatible_type",
  "no_data",
] as const;

export const missingDeviceSchema = z.object({
  device_id: z.string(),
  device_name: z.string(),
  reason: z.enum(missingReasons),
});

export const analyticsResultSchema = z.object({
  id: z.string(),
  error: z.string().nullable(),
  metric: metricInfoSchema.nullable(),
  range: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
    timezone: z.string(),
    bucket_size: z.enum(bucketSizes).nullable(),
  }),
  series: z.array(seriesSchema),
  values: z.array(summaryValueSchema),
  missing: z.array(missingDeviceSchema),
  truncated: z.boolean(),
  duration_ms: z.number(),
});

export const analyticsBatchResultSchema = z.object({
  timezone: z.string(),
  results: z.array(analyticsResultSchema),
});

export const discoveredMetricSchema = metricInfoSchema.extend({
  device_count: z.number(),
});

export const connectivityStatuses = ["online", "offline", "never"] as const;

export const deviceStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  location_id: z.string(),
  template_name: z.string(),
  last_seen_at: z.coerce.date().nullable(),
  status: z.enum(connectivityStatuses),
});

export const deviceStatusListSchema = z.object({
  offline_after_seconds: z.number(),
  devices: z.array(deviceStatusSchema),
});

export type MetricInfo = z.infer<typeof metricInfoSchema>;
export type SeriesPoint = z.infer<typeof seriesPointSchema>;
export type Series = z.infer<typeof seriesSchema>;
export type SummaryValue = z.infer<typeof summaryValueSchema>;
export type MissingDevice = z.infer<typeof missingDeviceSchema>;
export type AnalyticsResult = z.infer<typeof analyticsResultSchema>;
export type AnalyticsBatchResult = z.infer<typeof analyticsBatchResultSchema>;
export type DiscoveredMetric = z.infer<typeof discoveredMetricSchema>;
export type DeviceStatus = z.infer<typeof deviceStatusSchema>;
export type DeviceStatusList = z.infer<typeof deviceStatusListSchema>;
