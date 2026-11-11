import { z } from "zod";

import {
  describeMissing,
  describeRange,
  comparisonHighlights,
  ensureResult,
  idInput,
  locationPaths,
  matches,
  metricKeyInput,
  organisationIdInput,
  periodChange,
  periodInput,
  resolveOrganisation,
  seriesHighlights,
  timeRange,
  unitOf,
} from "@/tools/helpers";
import { defineTool, ToolError, type ToolContext } from "@/tools/types";
import { writeSupportReads, writeTools } from "@/tools/write-definitions";

/**
 * Read-only tools over the main Vizibble API, shared by MCP and WhatsApp.
 * Alarm tools are intentionally absent: the main application has no alarms yet.
 */

const listOrganizations = defineTool({
  name: "list_organizations",
  title: "List organisations",
  description:
    "Lists the Vizibble organisations the user belongs to, with their role and timezone. Use first when the user has several organisations or asks which ones they can see.",
  input: z.object({}).strict(),
  async run(_input, ctx) {
    const me = await ctx.api.me(ctx.delegation);
    return {
      user: { name: me.user.name },
      current_organisation_id:
        ctx.activeOrganisationId ?? me.default_organisation_id,
      organisations: me.organisations.map((o) => ({
        id: o.id,
        name: o.name,
        role: o.role,
        timezone: o.timezone,
      })),
    };
  },
});

const getOrganizationDetails = defineTool({
  name: "get_organization_details",
  title: "Organisation details",
  description:
    "Returns an organisation's name, timezone and the user's role and permissions in it.",
  input: z.object({ organisation_id: organisationIdInput }).strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    return await ctx.api.organisation(ctx.delegation, organisationId);
  },
});

const listLocations = defineTool({
  name: "list_locations",
  title: "List locations",
  description:
    "Lists sites, areas and production lines (a hierarchy) with their full path. Filter by `search` (name contains) or `parent_id` (direct children). Use to turn a place the user names into a location id.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      search: z
        .string()
        .max(100)
        .optional()
        .describe("Case-insensitive part of the location name."),
      parent_id: z
        .uuid()
        .optional()
        .describe("Only direct children of this location."),
    })
    .strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const locations = await ctx.api.locations(ctx.delegation, organisationId);
    const paths = locationPaths(locations);
    const selected = locations
      .filter((l) => (input.parent_id ? l.parent_id === input.parent_id : true))
      .filter((l) => matches(paths.get(l.id) ?? l.name, input.search))
      .slice(0, 200);
    return {
      organisation_id: organisationId,
      locations: selected.map((l) => ({
        id: l.id,
        name: l.name,
        path: paths.get(l.id),
        parent_id: l.parent_id,
        holds_devices: !l.can_have_children,
      })),
    };
  },
});

const getLocationDetails = defineTool({
  name: "get_location_details",
  title: "Location details",
  description:
    "Returns a location's path, its child locations and how many devices it contains (including descendants).",
  input: z
    .object({
      organisation_id: organisationIdInput,
      location_id: idInput("Location"),
    })
    .strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const [location, locations, devices] = await Promise.all([
      ctx.api.location(ctx.delegation, organisationId, input.location_id),
      ctx.api.locations(ctx.delegation, organisationId),
      ctx.api.devices(ctx.delegation, organisationId, {
        locationId: input.location_id,
        includeDescendants: true,
      }),
    ]);
    const paths = locationPaths(locations);
    return {
      id: location.id,
      name: location.name,
      path: paths.get(location.id),
      children: locations
        .filter((l) => l.parent_id === location.id)
        .map((l) => ({ id: l.id, name: l.name })),
      device_count: devices.devices.length,
      devices_online: devices.devices.filter((d) => d.status === "online")
        .length,
    };
  },
});

const listDevicesWithLocations = async (
  ctx: ToolContext,
  organisationId: string,
  filter: {
    locationId?: string;
    includeDescendants?: boolean;
    search?: string;
    status?: string;
  },
) => {
  const [list, locations] = await Promise.all([
    ctx.api.devices(ctx.delegation, organisationId, filter),
    ctx.api.locations(ctx.delegation, organisationId),
  ]);
  const paths = locationPaths(locations);
  return {
    organisation_id: organisationId,
    offline_after_seconds: list.offline_after_seconds,
    truncated: list.truncated,
    devices: list.devices
      .filter(
        (d) =>
          matches(d.name, filter.search) &&
          (!filter.status || d.status === filter.status),
      )
      .map((d) => ({
        id: d.id,
        name: d.name,
        location: paths.get(d.location_id) ?? null,
        location_id: d.location_id,
        template: d.template_name,
        status: d.status,
        last_seen_at: d.last_seen_at?.toISOString() ?? null,
      })),
  };
};

const listDevices = defineTool({
  name: "list_devices",
  title: "List devices",
  description:
    "Lists devices with their location, template and connectivity (online/offline/never, from the last time data arrived). Filter by `search` (name contains), `location_id` (includes sub-locations) or `status`. Use to turn a machine or sensor the user names into a device id.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      search: z.string().max(100).optional(),
      location_id: z.uuid().optional(),
      status: z.enum(["online", "offline", "never"]).optional(),
    })
    .strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    return listDevicesWithLocations(ctx, organisationId, {
      locationId: input.location_id,
      search: input.search,
      status: input.status,
    });
  },
});

const listLocationDevices = defineTool({
  name: "list_location_devices",
  title: "Devices in a location",
  description:
    "Lists the devices in a location, by default including every sub-location.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      location_id: idInput("Location"),
      include_descendants: z.boolean().default(true),
    })
    .strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    return listDevicesWithLocations(ctx, organisationId, {
      locationId: input.location_id,
      includeDescendants: input.include_descendants,
    });
  },
});

const listDeviceMetrics = defineTool({
  name: "list_device_metrics",
  title: "Device metrics",
  description:
    "Lists the metrics (parameters) a device records: key, label, unit and data type. Text and on/off metrics can't be averaged.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      device_id: idInput("Device"),
    })
    .strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const metrics = await ctx.api.metrics(ctx.delegation, organisationId, {
      device_ids: [input.device_id],
    });
    return {
      device_id: input.device_id,
      metrics: metrics.map((m) => ({
        key: m.key,
        label: m.label,
        unit: m.symbol ?? m.unit,
        data_type: m.data_type,
      })),
    };
  },
});

const getDeviceDetails = defineTool({
  name: "get_device_details",
  title: "Device details",
  description:
    "Returns a device's location, template, connectivity and the metrics it records.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      device_id: idInput("Device"),
    })
    .strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const [device, list, locations, metrics] = await Promise.all([
      ctx.api.device(ctx.delegation, organisationId, input.device_id),
      ctx.api.devices(ctx.delegation, organisationId),
      ctx.api.locations(ctx.delegation, organisationId),
      ctx.api.metrics(ctx.delegation, organisationId, {
        device_ids: [input.device_id],
      }),
    ]);
    const status = list.devices.find((d) => d.id === device.id);
    return {
      id: device.id,
      name: device.name,
      template: device.template_name,
      location: locationPaths(locations).get(device.location_id) ?? null,
      status: status?.status ?? null,
      last_seen_at: status?.last_seen_at?.toISOString() ?? null,
      metrics: metrics.map((m) => ({
        key: m.key,
        label: m.label,
        unit: m.symbol ?? m.unit,
        data_type: m.data_type,
      })),
    };
  },
});

const scopeInput = {
  device_ids: z
    .array(z.uuid())
    .max(20)
    .optional()
    .describe("Devices to include (max 20)."),
  location_id: z
    .uuid()
    .optional()
    .describe("Include every device in this location and its sub-locations."),
};

function scopeOf(input: { device_ids?: string[]; location_id?: string }) {
  if (!input.device_ids?.length && !input.location_id) {
    throw new ToolError(
      "invalid_input",
      "Name the devices or the location to read. Use list_devices or list_locations to find ids.",
    );
  }
  return {
    device_ids: input.device_ids ?? [],
    location_ids: input.location_id ? [input.location_id] : [],
    include_child_locations: true,
  };
}

const getLatestReadings = defineTool({
  name: "get_latest_readings",
  title: "Latest readings",
  description:
    "Current (most recent) value of one or more metrics for devices or a location, with the reading time and unit. If `metric_keys` is omitted, returns up to 10 metrics the devices record. A device with no reading is listed under `missing`; never treat that as zero.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      ...scopeInput,
      metric_keys: z.array(metricKeyInput).max(10).optional(),
    })
    .strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const scope = scopeOf(input);
    const keys =
      input.metric_keys ??
      (await ctx.api.metrics(ctx.delegation, organisationId, scope))
        .slice(0, 10)
        .map((m) => m.key);
    if (keys.length === 0)
      return { readings: [], note: "These devices don't record any metrics." };
    const batch = await ctx.api.analytics(
      ctx.delegation,
      organisationId,
      keys.map((key) => ({
        id: key,
        scope,
        metric_key: key,
        aggregation: "latest",
        mode: "summary",
        split_by_device: true,
      })),
    );
    return {
      timezone: batch.timezone,
      metrics: batch.results.map((result) => {
        if (result.error) return { metric_key: result.id, error: result.error };
        return {
          metric_key: result.id,
          label: result.metric?.label ?? result.id,
          unit: unitOf(result.metric),
          readings: result.values
            .filter((v) => v.t !== null)
            .map((v) => ({
              device_id: v.device_id,
              device_name: v.device_name,
              value: v.value,
              at: v.t?.toISOString(),
            })),
          missing: describeMissing(result),
        };
      }),
    };
  },
});

const getTelemetry = defineTool({
  name: "get_telemetry",
  title: "Telemetry history",
  description:
    "History of one metric for one device. `aggregation: raw` returns individual readings (paginated, newest first, max 31 days; pass `cursor` for the next page). Other aggregations return values per time bucket. Empty buckets are null, never zero.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      device_id: idInput("Device"),
      metric_key: metricKeyInput,
      aggregation: z
        .enum(["raw", "avg", "min", "max", "sum", "count"])
        .default("avg"),
      bucket_size: z
        .enum(["auto", "1m", "5m", "15m", "1h", "6h", "1d", "1w"])
        .default("auto"),
      ...periodInput,
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .default(100)
        .describe("Raw readings per page."),
      cursor: z.string().max(200).optional(),
    })
    .strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const range = timeRange(input);

    if (input.aggregation === "raw") {
      const page = await ctx.api.readings(ctx.delegation, organisationId, {
        deviceId: input.device_id,
        metricKey: input.metric_key,
        timeRange: range.time_range,
        from: "time_from" in range ? range.time_from : undefined,
        to: "time_to" in range ? range.time_to : undefined,
        limit: input.limit,
        cursor: input.cursor,
      });
      return {
        device_id: input.device_id,
        metric_key: input.metric_key,
        range: {
          from: page.range.from.toISOString(),
          to: page.range.to.toISOString(),
        },
        readings: page.readings.map((r) => ({
          at: r.timestamp.toISOString(),
          value: r.value,
        })),
        next_cursor: page.next_cursor,
      };
    }

    const batch = await ctx.api.analytics(ctx.delegation, organisationId, [
      {
        id: "series",
        scope: { device_ids: [input.device_id] },
        metric_key: input.metric_key,
        aggregation: input.aggregation,
        mode: "series",
        bucket_size: input.bucket_size,
        split_by_device: false,
        ...range,
      },
    ]);
    const result = ensureResult(batch.results[0]);
    const points = result.series[0]?.points ?? [];
    return {
      device_id: input.device_id,
      metric: result.metric && {
        key: result.metric.key,
        label: result.metric.label,
        unit: unitOf(result.metric),
      },
      aggregation: input.aggregation,
      range: describeRange(result),
      bucket_size: result.range.bucket_size,
      highlights: seriesHighlights(points),
      points: points
        .slice(-500)
        .map((p) => ({
          at: p.t.toISOString(),
          value: p.value,
          readings: p.count,
        })),
      truncated: result.truncated || points.length > 500,
      missing: describeMissing(result),
    };
  },
});

const summaryAggregations = [
  "latest",
  "avg",
  "min",
  "max",
  "sum",
  "count",
] as const;

const compareDevices = defineTool({
  name: "compare_devices",
  title: "Compare devices",
  description:
    "Compares one metric across devices (or every device in a location) using one calculation over a period, e.g. average humidity per production area today. Devices without data are listed under `missing`.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      ...scopeInput,
      metric_key: metricKeyInput,
      aggregation: z.enum(summaryAggregations).default("avg"),
      ...periodInput,
    })
    .strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const batch = await ctx.api.analytics(ctx.delegation, organisationId, [
      {
        id: "compare",
        scope: scopeOf(input),
        metric_key: input.metric_key,
        aggregation: input.aggregation,
        mode: "summary",
        split_by_device: true,
        ...timeRange(input),
      },
    ]);
    const result = ensureResult(batch.results[0]);
    return {
      metric: result.metric && {
        key: result.metric.key,
        label: result.metric.label,
        unit: unitOf(result.metric),
      },
      aggregation: input.aggregation,
      range: describeRange(result),
      highlights: comparisonHighlights(
        result.values.filter((v) => v.count > 0),
      ),
      // Highest first, so rankings read top-down.
      devices: [...result.values]
        .filter((v) => v.count > 0)
        .sort((a, b) =>
          typeof a.value === "number" && typeof b.value === "number"
            ? b.value - a.value
            : 0,
        )
        .map((v) => ({
          device_id: v.device_id,
          device_name: v.device_name,
          value: v.value,
          readings: v.count,
          at: v.t?.toISOString() ?? null,
        })),
      missing: describeMissing(result),
      truncated: result.truncated,
    };
  },
});

const getMetricSummary = defineTool({
  name: "get_metric_summary",
  title: "Metric summary",
  description:
    "Average, minimum, maximum and reading count of one metric over a period, across devices or a location, plus the same figures for the previous period. Use for 'what was the maximum pressure today'.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      ...scopeInput,
      metric_key: metricKeyInput,
      ...periodInput,
    })
    .strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const scope = scopeOf(input);
    const range = timeRange(input);
    const batch = await ctx.api.analytics(
      ctx.delegation,
      organisationId,
      (["avg", "min", "max", "count"] as const).map((aggregation) => ({
        id: aggregation,
        scope,
        metric_key: input.metric_key,
        aggregation,
        mode: "summary" as const,
        split_by_device: false,
        compare_previous: true,
        ...range,
      })),
    );
    const results = batch.results.map(ensureResult);
    const first = results[0]!;
    const figure = (id: string) => {
      const value = results.find((r) => r.id === id)?.values[0];
      return {
        value: value?.value ?? null,
        previous_period: value?.previous ?? null,
        vs_previous_period: periodChange(value?.value, value?.previous),
      };
    };
    return {
      metric: first.metric && {
        key: first.metric.key,
        label: first.metric.label,
        unit: unitOf(first.metric),
      },
      range: describeRange(first),
      average: figure("avg"),
      minimum: figure("min"),
      maximum: figure("max"),
      readings: figure("count"),
      missing: describeMissing(first),
    };
  },
});

const listDashboards = defineTool({
  name: "list_dashboards",
  title: "List dashboards",
  description:
    "Lists the dashboards the user can see in the organisation (shared ones and their own private ones).",
  input: z.object({ organisation_id: organisationIdInput }).strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const dashboards = await ctx.api.dashboards(ctx.delegation, organisationId);
    return {
      dashboards: dashboards.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        scope: d.scope,
        is_default: d.is_default,
      })),
    };
  },
});

const getDashboardSummary = defineTool({
  name: "get_dashboard_summary",
  title: "Dashboard summary",
  description:
    "Describes a dashboard: its scope, time range and each widget's metric and calculation. Use the telemetry tools to get the actual values.",
  input: z
    .object({
      organisation_id: organisationIdInput,
      dashboard_id: idInput("Dashboard"),
    })
    .strict(),
  async run(input, ctx) {
    const organisationId = await resolveOrganisation(
      ctx,
      input.organisation_id,
    );
    const d = await ctx.api.dashboard(
      ctx.delegation,
      organisationId,
      input.dashboard_id,
    );
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      scope: d.scope,
      time_range: d.time_range,
      widgets: d.widgets.map((w) => ({
        title: w.title,
        type: w.type,
        metric_key: w.metric_key,
        aggregation: w.aggregation,
        time_range: w.time_range ?? d.time_range,
        device_ids: w.sources.flatMap((s) =>
          s.device_id ? [s.device_id] : [],
        ),
        location_ids: w.sources.flatMap((s) =>
          s.location_id ? [s.location_id] : [],
        ),
      })),
    };
  },
});

const readTools = [
  listOrganizations,
  getOrganizationDetails,
  listLocations,
  getLocationDetails,
  listLocationDevices,
  listDevices,
  getDeviceDetails,
  listDeviceMetrics,
  getLatestReadings,
  getTelemetry,
  compareDevices,
  getMetricSummary,
  listDashboards,
  getDashboardSummary,
];

/** Every tool Vera offers, read and write, in one allowlist. */
export const tools = [...readTools, ...writeSupportReads, ...writeTools];
