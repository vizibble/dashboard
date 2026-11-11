import { z } from "zod";

import {
  descriptionSchema,
  idSchema,
  metricKeySchema,
  nameSchema,
  timestampSchema,
} from "./common";

// --- Vocabulary ----------------------------------------------------------------

export const dashboardScopes = ["organisation", "location", "device"] as const;
export const dashboardVisibilities = ["private", "organisation"] as const;

export const timeRanges = [
  "1h",
  "6h",
  "24h",
  "7d",
  "30d",
  "today",
  "yesterday",
  "this_week",
  "custom",
] as const;

export const bucketSizes = [
  "auto",
  "1m",
  "5m",
  "15m",
  "1h",
  "6h",
  "1d",
  "1w",
] as const;

export const aggregations = [
  "latest",
  "raw",
  "avg",
  "min",
  "max",
  "sum",
  "count",
] as const;

export const widgetTypes = [
  "kpi",
  "line",
  "area",
  "bar",
  "gauge",
  "state",
  "table",
  "map",
] as const;

export const metricDataTypes = [
  "number",
  "integer",
  "string",
  "boolean",
] as const;

export type DashboardScope = (typeof dashboardScopes)[number];
export type TimeRange = (typeof timeRanges)[number];
export type BucketSize = (typeof bucketSizes)[number];
export type Aggregation = (typeof aggregations)[number];
export type WidgetType = (typeof widgetTypes)[number];
export type MetricDataType = (typeof metricDataTypes)[number];

/** Aggregations that make sense for each data type. Numeric maths never runs on text or booleans. */
export const aggregationsByDataType: Record<
  MetricDataType,
  readonly Aggregation[]
> = {
  number: aggregations,
  integer: aggregations,
  boolean: ["latest", "raw", "count"],
  string: ["latest", "raw", "count"],
};

/** Which aggregations each widget can draw. */
export const aggregationsByWidget: Record<WidgetType, readonly Aggregation[]> =
  {
    kpi: ["latest", "avg", "min", "max", "sum", "count"],
    gauge: ["latest", "avg", "min", "max"],
    line: ["raw", "avg", "min", "max", "sum", "count"],
    area: ["raw", "avg", "min", "max", "sum", "count"],
    bar: ["avg", "min", "max", "sum", "count"],
    state: ["raw"],
    table: ["latest", "raw"],
    map: ["latest"],
  };

/** Data types each widget can draw. */
export const dataTypesByWidget: Record<WidgetType, readonly MetricDataType[]> =
  {
    kpi: metricDataTypes,
    gauge: ["number", "integer"],
    line: ["number", "integer"],
    area: ["number", "integer"],
    bar: ["number", "integer"],
    state: ["boolean", "string"],
    table: metricDataTypes,
    map: metricDataTypes,
  };

export function isCompatible(
  type: WidgetType,
  dataType: MetricDataType,
  aggregation: Aggregation,
) {
  return (
    dataTypesByWidget[type].includes(dataType) &&
    aggregationsByWidget[type].includes(aggregation) &&
    aggregationsByDataType[dataType].includes(aggregation)
  );
}

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Colours must be hex values like #1f77b4");

const customRangeRefinement = <
  T extends {
    time_range?: string | null;
    time_from?: string | null;
    time_to?: string | null;
  },
>(
  value: T,
) =>
  value.time_range !== "custom" ||
  (value.time_from != null &&
    value.time_to != null &&
    new Date(value.time_from) < new Date(value.time_to));

const customRangeMessage = {
  message: "A custom range needs a start before its end",
};

// --- Dashboards ----------------------------------------------------------------

const dashboardFields = {
  name: nameSchema,
  description: descriptionSchema.optional(),
  visibility: z.enum(dashboardVisibilities).optional(),
  is_default: z.boolean().optional(),
  time_range: z.enum(timeRanges).optional(),
  time_from: timestampSchema.nullable().optional(),
  time_to: timestampSchema.nullable().optional(),
  refresh_seconds: z
    .number()
    .int()
    .refine((value) => value === 0 || (value >= 10 && value <= 3600), {
      message: "Refresh must be off or between 10 seconds and 1 hour",
    })
    .optional(),
};

export const createDashboardSchema = z
  .object({
    ...dashboardFields,
    scope: z.enum(dashboardScopes),
    location_id: idSchema.nullable().optional(),
    device_id: idSchema.nullable().optional(),
  })
  .strict()
  .refine(customRangeRefinement, customRangeMessage)
  .refine(
    (value) =>
      (value.scope === "organisation" &&
        !value.location_id &&
        !value.device_id) ||
      (value.scope === "location" && !!value.location_id && !value.device_id) ||
      (value.scope === "device" && !!value.device_id && !value.location_id),
    { message: "Choose the location or device this dashboard is for" },
  );

export const updateDashboardSchema = z
  .object({
    name: nameSchema.optional(),
    description: dashboardFields.description,
    visibility: dashboardFields.visibility,
    is_default: dashboardFields.is_default,
    time_range: dashboardFields.time_range,
    time_from: dashboardFields.time_from,
    time_to: dashboardFields.time_to,
    refresh_seconds: dashboardFields.refresh_seconds,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0)
  .refine(customRangeRefinement, customRangeMessage);

export const dashboardListQuerySchema = z
  .object({
    scope: z.enum(dashboardScopes).optional(),
    location_id: idSchema.optional(),
    device_id: idSchema.optional(),
  })
  .strict();

export type CreateDashboardInput = z.infer<typeof createDashboardSchema>;
export type UpdateDashboardInput = z.infer<typeof updateDashboardSchema>;
export type DashboardListQuery = z.infer<typeof dashboardListQuerySchema>;

// --- Widgets -------------------------------------------------------------------

const widgetSourceInputSchema = z
  .object({
    device_id: idSchema.nullable().optional(),
    location_id: idSchema.nullable().optional(),
    include_child_locations: z.boolean().optional(),
  })
  .strict()
  .refine((value) => !!value.device_id !== !!value.location_id, {
    message: "Each source is either a device or a location",
  });

const thresholdInputSchema = z
  .object({
    value: z.number().finite(),
    color: colorSchema,
    label: z.string().trim().max(60).nullable().optional(),
  })
  .strict();

export const widgetInputSchema = z
  .object({
    title: nameSchema,
    type: z.enum(widgetTypes),

    // Query
    metric_key: metricKeySchema,
    aggregation: z.enum(aggregations),
    bucket_size: z.enum(bucketSizes).optional(),
    split_by_device: z.boolean().optional(),
    time_range: z.enum(timeRanges).nullable().optional(),
    time_from: timestampSchema.nullable().optional(),
    time_to: timestampSchema.nullable().optional(),
    latitude_metric: metricKeySchema.nullable().optional(),
    longitude_metric: metricKeySchema.nullable().optional(),
    sources: z.array(widgetSourceInputSchema).max(50).optional(),

    // Presentation
    decimals: z.number().int().min(0).max(6).nullable().optional(),
    show_unit: z.boolean().optional(),
    show_legend: z.boolean().optional(),
    color: colorSchema.nullable().optional(),
    min_value: z.number().finite().nullable().optional(),
    max_value: z.number().finite().nullable().optional(),
    true_label: z.string().trim().max(40).nullable().optional(),
    false_label: z.string().trim().max(40).nullable().optional(),
    thresholds: z.array(thresholdInputSchema).max(10).optional(),

    // Layout
    width: z.number().int().min(1).max(12).optional(),
    height: z.number().int().min(1).max(8).optional(),
  })
  .strict()
  .refine(customRangeRefinement, customRangeMessage)
  .refine(
    (value) =>
      (value.type === "map") ===
      (!!value.latitude_metric && !!value.longitude_metric),
    { message: "Map widgets need latitude and longitude parameters" },
  )
  .refine(
    (value) =>
      value.min_value == null ||
      value.max_value == null ||
      value.min_value < value.max_value,
    { message: "Minimum must be lower than maximum" },
  )
  .refine(
    (value) => aggregationsByWidget[value.type].includes(value.aggregation),
    {
      message: "This calculation isn't available for the chosen visualisation",
    },
  );

export const widgetLayoutSchema = z
  .object({
    widgets: z
      .array(
        z
          .object({
            id: idSchema,
            sort_order: z.number().int().min(0),
            width: z.number().int().min(1).max(12),
            height: z.number().int().min(1).max(8),
          })
          .strict(),
      )
      .max(100),
  })
  .strict();

export type WidgetInput = z.infer<typeof widgetInputSchema>;
export type WidgetLayoutInput = z.infer<typeof widgetLayoutSchema>;

// --- Responses -----------------------------------------------------------------

export const widgetSourceSchema = z.object({
  device_id: z.string().nullable(),
  location_id: z.string().nullable(),
  include_child_locations: z.boolean(),
});

export const widgetThresholdSchema = z.object({
  value: z.number(),
  color: z.string(),
  label: z.string().nullable(),
});

export const widgetSchema = z.object({
  id: z.string(),
  dashboard_id: z.string(),
  title: z.string(),
  type: z.enum(widgetTypes),
  metric_key: z.string(),
  aggregation: z.enum(aggregations),
  bucket_size: z.enum(bucketSizes),
  split_by_device: z.boolean(),
  time_range: z.enum(timeRanges).nullable(),
  time_from: z.coerce.date().nullable(),
  time_to: z.coerce.date().nullable(),
  latitude_metric: z.string().nullable(),
  longitude_metric: z.string().nullable(),
  sources: z.array(widgetSourceSchema),
  decimals: z.number().nullable(),
  show_unit: z.boolean(),
  show_legend: z.boolean(),
  color: z.string().nullable(),
  min_value: z.number().nullable(),
  max_value: z.number().nullable(),
  true_label: z.string().nullable(),
  false_label: z.string().nullable(),
  thresholds: z.array(widgetThresholdSchema),
  sort_order: z.number(),
  width: z.number(),
  height: z.number(),
});

export const dashboardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  scope: z.enum(dashboardScopes),
  location_id: z.string().nullable(),
  device_id: z.string().nullable(),
  created_by: z.string().nullable(),
  visibility: z.enum(dashboardVisibilities),
  is_default: z.boolean(),
  time_range: z.enum(timeRanges),
  time_from: z.coerce.date().nullable(),
  time_to: z.coerce.date().nullable(),
  refresh_seconds: z.number(),
  can_edit: z.boolean(),
  updated_at: z.coerce.date(),
});

export const dashboardDetailSchema = dashboardSchema.extend({
  widgets: z.array(widgetSchema),
});

export type Widget = z.infer<typeof widgetSchema>;
export type WidgetThreshold = z.infer<typeof widgetThresholdSchema>;
export type Dashboard = z.infer<typeof dashboardSchema>;
export type DashboardDetail = z.infer<typeof dashboardDetailSchema>;
