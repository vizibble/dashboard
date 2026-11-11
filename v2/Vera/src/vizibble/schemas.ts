import { z } from "zod";

/**
 * Vera's copy of the main application's integration API contract (v1). Vera does not import
 * the main app's `shared` package: it validates every response against these schemas, so a
 * contract drift fails loudly here instead of reaching a user.
 */

const date = z.coerce.date();
const value = z.union([z.number(), z.string(), z.boolean()]).nullable();

export const organisationAccessSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  timezone: z.string(),
  role: z.string(),
  permissions: z.array(z.string()),
});

export const meSchema = z.object({
  user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
  default_organisation_id: z.string().nullable(),
  organisations: z.array(organisationAccessSchema),
});

export const locationSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  parent_id: z.string().nullable(),
  name: z.string(),
  can_have_children: z.boolean(),
});

export const scopedDeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  location_id: z.string(),
  template_name: z.string(),
  last_seen_at: date.nullable(),
  status: z.enum(["online", "offline", "never"]),
});

export const scopedDeviceListSchema = z.object({
  offline_after_seconds: z.number(),
  truncated: z.boolean(),
  devices: z.array(scopedDeviceSchema),
});

export const deviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  location_id: z.string(),
  template_id: z.string(),
  template_name: z.string(),
});

export const metricDataTypes = [
  "number",
  "integer",
  "string",
  "boolean",
] as const;

export const metricInfoSchema = z.object({
  key: z.string(),
  label: z.string(),
  unit: z.string().nullable(),
  symbol: z.string().nullable(),
  data_type: z.enum(metricDataTypes),
});

export const discoveredMetricSchema = metricInfoSchema.extend({
  device_count: z.number(),
});

export const analyticsResultSchema = z.object({
  id: z.string(),
  error: z.string().nullable(),
  metric: metricInfoSchema.nullable(),
  range: z.object({
    from: date,
    to: date,
    timezone: z.string(),
    bucket_size: z.string().nullable(),
  }),
  series: z.array(
    z.object({
      device_id: z.string().nullable(),
      device_name: z.string().nullable(),
      points: z.array(z.object({ t: date, value, count: z.number() })),
    }),
  ),
  values: z.array(
    z.object({
      device_id: z.string().nullable(),
      device_name: z.string().nullable(),
      value,
      t: date.nullable(),
      count: z.number(),
      previous: value.optional(),
    }),
  ),
  missing: z.array(
    z.object({
      device_id: z.string(),
      device_name: z.string(),
      reason: z.enum([
        "metric_not_in_template",
        "incompatible_type",
        "no_data",
      ]),
    }),
  ),
  truncated: z.boolean(),
  duration_ms: z.number(),
});

export const analyticsBatchResultSchema = z.object({
  timezone: z.string(),
  results: z.array(analyticsResultSchema),
});

export const readingsPageSchema = z.object({
  range: z.object({ from: date, to: date }),
  readings: z.array(
    z.object({
      device_id: z.string(),
      metric_key: z.string(),
      timestamp: date,
      value: z.union([z.number(), z.string(), z.boolean()]),
    }),
  ),
  next_cursor: z.string().nullable(),
});

export const dashboardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  scope: z.enum(["organisation", "location", "device"]),
  location_id: z.string().nullable(),
  device_id: z.string().nullable(),
  visibility: z.enum(["private", "organisation"]),
  is_default: z.boolean(),
  time_range: z.string(),
  updated_at: date,
});

export const dashboardDetailSchema = dashboardSchema.extend({
  widgets: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      type: z.string(),
      metric_key: z.string(),
      aggregation: z.string(),
      time_range: z.string().nullable(),
      sources: z.array(
        z.object({
          device_id: z.string().nullable(),
          location_id: z.string().nullable(),
          include_child_locations: z.boolean(),
        }),
      ),
    }),
  ),
});

export const whatsappLinkResultSchema = z.object({
  grant_id: z.string(),
  grant_token: z.string(),
  user_id: z.string(),
  default_organisation_id: z.string().nullable(),
});

export type Me = z.infer<typeof meSchema>;
export type OrganisationAccess = z.infer<typeof organisationAccessSchema>;
export type Location = z.infer<typeof locationSchema>;
export type ScopedDevice = z.infer<typeof scopedDeviceSchema>;
export type MetricInfo = z.infer<typeof metricInfoSchema>;
export type AnalyticsResult = z.infer<typeof analyticsResultSchema>;
export type MetricDataType = (typeof metricDataTypes)[number];

/** Request body for one analytics query (validated again by the main server). */
export type AnalyticsQuery = {
  id: string;
  scope: {
    device_ids?: string[];
    location_ids?: string[];
    include_child_locations?: boolean;
  };
  metric_key: string;
  aggregation: "latest" | "raw" | "avg" | "min" | "max" | "sum" | "count";
  mode?: "series" | "summary";
  bucket_size?: "auto" | "1m" | "5m" | "15m" | "1h" | "6h" | "1d" | "1w";
  split_by_device?: boolean;
  time_range?:
    | "1h"
    | "6h"
    | "24h"
    | "7d"
    | "30d"
    | "today"
    | "yesterday"
    | "this_week"
    | "custom";
  time_from?: string;
  time_to?: string;
  compare_previous?: boolean;
};

// --- Writes and their reads -------------------------------------------------------------

export const templateSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  parameter_count: z.number(),
  device_count: z.number(),
});

export const templateParameterSchema = z.object({
  key: z.string(),
  label: z.string(),
  data_type: z.enum(metricDataTypes),
  unit: z.string().nullable(),
  symbol: z.string().nullable(),
  metric_definition_id: z.string().nullable(),
});

export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  parameters: z.array(templateParameterSchema),
  device_count: z.number(),
});

export const metricDefinitionSchema = z.object({
  id: z.string(),
  key: z.string(),
  label: z.string(),
  unit: z.string().nullable(),
  symbol: z.string().nullable(),
  data_type: z.enum(metricDataTypes),
  category: z.string().nullable(),
});

export const widgetSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
});

export const settingsSchema = z.object({
  timezone: z.string(),
  can_edit: z.boolean(),
});

export type TemplateParameterInput = {
  key: string;
  label: string;
  data_type: MetricDataType;
  unit?: string | null;
  symbol?: string | null;
  metric_definition_id?: string | null;
};

export type WidgetInput = {
  title: string;
  type: "kpi" | "line" | "area" | "bar" | "gauge" | "state" | "table" | "map";
  metric_key: string;
  aggregation: "latest" | "raw" | "avg" | "min" | "max" | "sum" | "count";
  time_range?: string | null;
  sources?: { device_id?: string; location_id?: string }[];
};
