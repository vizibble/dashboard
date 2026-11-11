import type { Request, Response } from "express";

import { resolveScope } from "@/lib/analytics-engine";
import { ApiError } from "@/lib/api-error";
import { body, parse, sendData, textParam, uuidParam } from "@/lib/http";
import { can } from "@/lib/permissions";
import { discoverMetricsQuery } from "@/models/analytics";
import {
  findDashboardQuery,
  findWidgetQuery,
  insertDashboardQuery,
  insertWidgetQuery,
  listDashboardsQuery,
  listWidgetsQuery,
  removeDashboardQuery,
  removeWidgetQuery,
  updateDashboardQuery,
  updateLayoutQuery,
  updateWidgetQuery,
  type DashboardRow,
  type WidgetValues,
} from "@/models/dashboards";
import { findDeviceQuery } from "@/models/devices";
import { findLocationQuery } from "@/models/locations";
import {
  createDashboardSchema,
  dashboardDetailSchema,
  dashboardListQuerySchema,
  dashboardSchema,
  isCompatible,
  updateDashboardSchema,
  widgetInputSchema,
  widgetLayoutSchema,
  type MetricDataType,
  type WidgetInput,
} from "@vizibble/shared/dashboards";

function organisationParam(req: Request) {
  return textParam(req.params.organisationId, "organisation id");
}

function presentDashboard(req: Request, row: DashboardRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    scope: row.scope,
    locationId: row.locationId,
    deviceId: row.deviceId,
    createdBy: row.createdBy,
    visibility: row.visibility,
    isDefault: row.isDefault,
    timeRange: row.timeRange,
    timeFrom: row.timeFrom,
    timeTo: row.timeTo,
    refreshSeconds: row.refreshSeconds,
    // Private dashboards are only ever returned to their creator.
    canEdit: can(req, { dashboard: ["update"] }),
    updatedAt: row.updatedAt,
  };
}

const toNumber = (value: string | null) =>
  value === null ? null : Number(value);

async function presentDetail(req: Request, row: DashboardRow) {
  const widgets = await listWidgetsQuery(row.id, row.organizationId);
  return {
    ...presentDashboard(req, row),
    widgets: widgets.map((widget) => ({
      id: widget.id,
      dashboardId: widget.dashboardId,
      title: widget.title,
      type: widget.type,
      metricKey: widget.metricKey,
      aggregation: widget.aggregation,
      bucketSize: widget.bucketSize,
      splitByDevice: widget.splitByDevice,
      timeRange: widget.timeRange,
      timeFrom: widget.timeFrom,
      timeTo: widget.timeTo,
      latitudeMetric: widget.latitudeMetric,
      longitudeMetric: widget.longitudeMetric,
      sources: widget.sources.map((source) => ({
        deviceId: source.deviceId,
        locationId: source.locationId,
        includeChildLocations: source.includeChildLocations,
      })),
      decimals: widget.decimals,
      showUnit: widget.showUnit,
      showLegend: widget.showLegend,
      color: widget.color,
      minValue: toNumber(widget.minValue),
      maxValue: toNumber(widget.maxValue),
      trueLabel: widget.trueLabel,
      falseLabel: widget.falseLabel,
      thresholds: widget.thresholds.map((threshold) => ({
        value: Number(threshold.value),
        color: threshold.color,
        label: threshold.label,
      })),
      sortOrder: widget.sortOrder,
      width: widget.width,
      height: widget.height,
    })),
  };
}

async function dashboardOrThrow(req: Request) {
  const organisationId = organisationParam(req);
  const id = uuidParam(req.params.dashboardId, "dashboard id");
  const row = await findDashboardQuery(id, organisationId, req.userId!);
  if (!row) throw new ApiError(404, "Dashboard not found");
  return row;
}

/** The route guard has already checked dashboard:update. */
const editableDashboardOrThrow = dashboardOrThrow;

// --- Dashboards ----------------------------------------------------------------

export async function listDashboardsController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const filters = parse(dashboardListQuerySchema, req.query);
  const rows = await listDashboardsQuery(organisationId, req.userId!, {
    scope: filters.scope,
    locationId: filters.location_id,
    deviceId: filters.device_id,
  });
  return sendData(
    res,
    rows.map((row) => presentDashboard(req, row)),
    200,
    dashboardSchema.array(),
  );
}

export async function createDashboardController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const values = parse(createDashboardSchema, body(req));
  if (
    values.location_id &&
    !(await findLocationQuery(values.location_id, organisationId))
  ) {
    throw new ApiError(400, "Location must belong to this organisation");
  }
  if (
    values.device_id &&
    !(await findDeviceQuery(values.device_id, organisationId))
  ) {
    throw new ApiError(400, "Device must belong to this organisation");
  }
  const row = await insertDashboardQuery({
    id: crypto.randomUUID(),
    organizationId: organisationId,
    name: values.name,
    description: values.description ?? null,
    scope: values.scope,
    locationId: values.location_id ?? null,
    deviceId: values.device_id ?? null,
    createdBy: req.userId!,
    visibility: values.visibility ?? "organisation",
    isDefault: values.is_default ?? false,
    timeRange: values.time_range ?? "24h",
    timeFrom: values.time_from ? new Date(values.time_from) : null,
    timeTo: values.time_to ? new Date(values.time_to) : null,
    refreshSeconds: values.refresh_seconds ?? 60,
  });
  return sendData(
    res,
    await presentDetail(req, row),
    201,
    dashboardDetailSchema,
  );
}

export async function getDashboardController(req: Request, res: Response) {
  const row = await dashboardOrThrow(req);
  return sendData(
    res,
    await presentDetail(req, row),
    200,
    dashboardDetailSchema,
  );
}

export async function updateDashboardController(req: Request, res: Response) {
  const current = await editableDashboardOrThrow(req);
  const values = parse(updateDashboardSchema, body(req));
  const timeRange = values.time_range ?? current.timeRange;
  const custom = timeRange === "custom";
  const updated = await updateDashboardQuery(current, {
    ...(values.name === undefined ? {} : { name: values.name }),
    ...(values.description === undefined
      ? {}
      : { description: values.description }),
    ...(values.visibility === undefined
      ? {}
      : { visibility: values.visibility }),
    ...(values.is_default === undefined
      ? {}
      : { isDefault: values.is_default }),
    ...(values.refresh_seconds === undefined
      ? {}
      : { refreshSeconds: values.refresh_seconds }),
    ...(values.time_range === undefined
      ? {}
      : {
          timeRange,
          timeFrom:
            custom && values.time_from ? new Date(values.time_from) : null,
          timeTo: custom && values.time_to ? new Date(values.time_to) : null,
        }),
  });
  if (!updated) throw new ApiError(404, "Dashboard not found");
  return sendData(
    res,
    await presentDetail(req, updated),
    200,
    dashboardDetailSchema,
  );
}

export async function deleteDashboardController(req: Request, res: Response) {
  const row = await editableDashboardOrThrow(req);
  const deleted = await removeDashboardQuery(row.id, row.organizationId);
  if (!deleted) throw new ApiError(404, "Dashboard not found");
  return res.status(204).send();
}

// --- Widgets -------------------------------------------------------------------

/**
 * Checks sources belong to the organisation and the parameter exists on at least one
 * device in the widget's scope with a type the visualisation can draw.
 */
async function validateWidget(dashboard: DashboardRow, values: WidgetInput) {
  const sources = values.sources ?? [];
  const scope =
    sources.length > 0
      ? {
          device_ids: sources.flatMap((s) =>
            s.device_id ? [s.device_id] : [],
          ),
          location_ids: sources.flatMap((s) =>
            s.location_id ? [s.location_id] : [],
          ),
          include_child_locations: sources.every(
            (s) => s.include_child_locations !== false,
          ),
        }
      : {
          device_ids: dashboard.deviceId ? [dashboard.deviceId] : [],
          location_ids: dashboard.locationId ? [dashboard.locationId] : [],
          include_child_locations: true,
        };
  const { devices } = await resolveScope(dashboard.organizationId, scope);
  const metrics = await discoverMetricsQuery(devices.map((d) => d.id));
  const metric = metrics.find((row) => row.key === values.metric_key);
  if (!metric) {
    throw new ApiError(
      400,
      "No device in this widget's scope records the chosen parameter",
    );
  }
  if (
    !isCompatible(
      values.type,
      metric.data_type as MetricDataType,
      values.aggregation,
    )
  ) {
    throw new ApiError(
      400,
      `"${metric.label}" can't be shown this way. Choose another visualisation or calculation.`,
    );
  }
  if (values.type === "map") {
    for (const key of [values.latitude_metric, values.longitude_metric]) {
      const position = metrics.find((row) => row.key === key);
      if (
        !position ||
        position.data_type === "string" ||
        position.data_type === "boolean"
      ) {
        throw new ApiError(
          400,
          "Latitude and longitude must be numeric parameters",
        );
      }
    }
  }
}

function widgetColumns(values: WidgetInput): Omit<WidgetValues, "sortOrder"> {
  const custom = values.time_range === "custom";
  return {
    title: values.title,
    type: values.type,
    metricKey: values.metric_key,
    aggregation: values.aggregation,
    bucketSize: values.bucket_size ?? "auto",
    splitByDevice: values.split_by_device ?? true,
    timeRange: values.time_range ?? null,
    timeFrom: custom && values.time_from ? new Date(values.time_from) : null,
    timeTo: custom && values.time_to ? new Date(values.time_to) : null,
    latitudeMetric:
      values.type === "map" ? (values.latitude_metric ?? null) : null,
    longitudeMetric:
      values.type === "map" ? (values.longitude_metric ?? null) : null,
    decimals: values.decimals ?? null,
    showUnit: values.show_unit ?? true,
    showLegend: values.show_legend ?? true,
    color: values.color ?? null,
    minValue: values.min_value == null ? null : String(values.min_value),
    maxValue: values.max_value == null ? null : String(values.max_value),
    trueLabel: values.true_label || null,
    falseLabel: values.false_label || null,
    width: values.width ?? 4,
    height: values.height ?? 2,
  };
}

function childRows(values: WidgetInput) {
  return {
    sources: (values.sources ?? []).map((source) => ({
      deviceId: source.device_id ?? null,
      locationId: source.location_id ?? null,
      includeChildLocations: source.include_child_locations ?? true,
    })),
    thresholds: (values.thresholds ?? []).map((threshold) => ({
      value: String(threshold.value),
      color: threshold.color,
      label: threshold.label || null,
    })),
  };
}

export async function createWidgetController(req: Request, res: Response) {
  const dashboard = await editableDashboardOrThrow(req);
  const values = parse(widgetInputSchema, body(req));
  await validateWidget(dashboard, values);
  const { sources, thresholds } = childRows(values);
  await insertWidgetQuery(
    dashboard.organizationId,
    dashboard.id,
    widgetColumns(values),
    sources,
    thresholds,
  );
  return sendData(
    res,
    await presentDetail(req, dashboard),
    201,
    dashboardDetailSchema,
  );
}

/** Full replacement: the editor always sends the whole widget. */
export async function updateWidgetController(req: Request, res: Response) {
  const dashboard = await editableDashboardOrThrow(req);
  const widgetId = uuidParam(req.params.widgetId, "widget id");
  if (
    !(await findWidgetQuery(widgetId, dashboard.id, dashboard.organizationId))
  ) {
    throw new ApiError(404, "Widget not found");
  }
  const values = parse(widgetInputSchema, body(req));
  await validateWidget(dashboard, values);
  const { sources, thresholds } = childRows(values);
  await updateWidgetQuery(
    dashboard.organizationId,
    dashboard.id,
    widgetId,
    widgetColumns(values),
    sources,
    thresholds,
  );
  return sendData(
    res,
    await presentDetail(req, dashboard),
    200,
    dashboardDetailSchema,
  );
}

export async function deleteWidgetController(req: Request, res: Response) {
  const dashboard = await editableDashboardOrThrow(req);
  const widgetId = uuidParam(req.params.widgetId, "widget id");
  const deleted = await removeWidgetQuery(
    dashboard.organizationId,
    dashboard.id,
    widgetId,
  );
  if (!deleted) throw new ApiError(404, "Widget not found");
  return res.status(204).send();
}

export async function updateLayoutController(req: Request, res: Response) {
  const dashboard = await editableDashboardOrThrow(req);
  const { widgets } = parse(widgetLayoutSchema, body(req));
  await updateLayoutQuery(
    dashboard.organizationId,
    dashboard.id,
    widgets.map((widget) => ({
      id: widget.id,
      sortOrder: widget.sort_order,
      width: widget.width,
      height: widget.height,
    })),
  );
  return sendData(
    res,
    await presentDetail(req, dashboard),
    200,
    dashboardDetailSchema,
  );
}
