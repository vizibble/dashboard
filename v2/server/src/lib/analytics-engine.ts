import type {
  AnalyticsResult,
  MetricInfo,
  MissingDevice,
  ParsedAnalyticsQuery,
  Series,
  SummaryValue,
} from "@vizibble/shared/analytics";
import {
  aggregationsByDataType,
  type MetricDataType,
} from "@vizibble/shared/dashboards";

import { ApiError } from "@/lib/api-error";
import {
  resolveBucketSize,
  resolveTimeRange,
  type ResolvedRange,
} from "@/lib/time-range";
import {
  bucketedAggregateQuery,
  bucketStartsQuery,
  devicesWithDataQuery,
  findOrganisationDeviceIdsQuery,
  findOrganisationLocationIdsQuery,
  latestReadingsQuery,
  rawReadingsQuery,
  resolveMetricQuery,
  resolveScopeDevicesQuery,
  summaryAggregateQuery,
  type RawValueRow,
  type ResolvedMetric,
  type ScopeDevice,
} from "@/models/analytics";

/**
 * The central telemetry query engine. Every dashboard widget, whatever it draws, goes
 * through `runAnalyticsQuery`: resolve scope → resolve metric → resolve time → aggregate.
 * Missing data stays null; nothing is zero-filled or interpolated.
 */

export const MAX_SCOPE_DEVICES = 100;
export const MAX_RAW_ROWS = 5000;
export const OFFLINE_AFTER_SECONDS = 600;
const SLOW_QUERY_MS = 500;

type Scope = ParsedAnalyticsQuery["scope"];

/** Rejects ids that are not this organisation's, then expands locations to devices. */
export async function resolveScope(organisationId: string, scope: Scope) {
  const [deviceIds, locationIds] = await Promise.all([
    findOrganisationDeviceIdsQuery(organisationId, scope.device_ids),
    findOrganisationLocationIdsQuery(organisationId, scope.location_ids),
  ]);
  if (deviceIds.length !== new Set(scope.device_ids).size) {
    throw new ApiError(400, "One or more devices were not found");
  }
  if (locationIds.length !== new Set(scope.location_ids).size) {
    throw new ApiError(400, "One or more locations were not found");
  }
  return resolveScopeDevicesQuery(
    organisationId,
    {
      deviceIds,
      locationIds,
      includeChildLocations: scope.include_child_locations,
    },
    MAX_SCOPE_DEVICES,
  );
}

function numericFamily(dataType: string) {
  return dataType === "number" || dataType === "integer";
}

/**
 * Picks one definition for the metric across devices on different templates or template
 * versions. Devices whose parameter has an incompatible type are reported, not mixed in.
 */
export function pickMetric(
  devices: ScopeDevice[],
  resolved: ResolvedMetric[],
): {
  metric: MetricInfo | null;
  deviceIds: string[];
  missing: MissingDevice[];
} {
  const byDevice = new Map(resolved.map((row) => [row.deviceId, row]));
  const missing: MissingDevice[] = [];
  const family = (row: ResolvedMetric) =>
    numericFamily(row.dataType) ? "numeric" : row.dataType;

  // Prefer the type most devices currently use.
  const votes = new Map<string, number>();
  for (const row of resolved) {
    const weight = row.inCurrentVersion ? 2 : 1;
    votes.set(family(row), (votes.get(family(row)) ?? 0) + weight);
  }
  const winner = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const deviceIds: string[] = [];
  let reference: ResolvedMetric | undefined;
  let anyNumber = false;
  for (const device of devices) {
    const row = byDevice.get(device.id);
    if (!row) {
      missing.push({
        device_id: device.id,
        device_name: device.name,
        reason: "metric_not_in_template",
      });
      continue;
    }
    if (family(row) !== winner) {
      missing.push({
        device_id: device.id,
        device_name: device.name,
        reason: "incompatible_type",
      });
      continue;
    }
    deviceIds.push(device.id);
    if (row.dataType === "number") anyNumber = true;
    // Newest template configuration wins for label and unit.
    if (!reference || row.version > reference.version) {
      reference = row;
    }
  }

  if (!reference) return { metric: null, deviceIds, missing };
  const dataType = (
    anyNumber && numericFamily(reference.dataType)
      ? "number"
      : reference.dataType
  ) as MetricDataType;
  return {
    metric: {
      key: reference.key,
      label: reference.label,
      unit: reference.unit,
      symbol: reference.symbol,
      data_type: dataType,
    },
    deviceIds,
    missing,
  };
}

function readValue(row: RawValueRow): number | string | boolean | null {
  if (row.value_numeric !== null) return Number(row.value_numeric);
  if (row.value_text !== null) return row.value_text;
  return row.value_boolean;
}

function emptyResult(
  query: ParsedAnalyticsQuery,
  timezone: string,
  range: ResolvedRange | null,
): AnalyticsResult {
  const now = new Date();
  return {
    id: query.id,
    error: null,
    metric: null,
    range: {
      from: range?.from ?? now,
      to: range?.to ?? now,
      timezone,
      bucket_size: null,
    },
    series: [],
    values: [],
    missing: [],
    truncated: false,
    duration_ms: 0,
  };
}

export async function runAnalyticsQuery(
  organisationId: string,
  timezone: string,
  query: ParsedAnalyticsQuery,
): Promise<AnalyticsResult> {
  const started = performance.now();
  const range = await resolveTimeRange(
    timezone,
    query.time_range,
    query.time_from,
    query.time_to,
  );
  const result = emptyResult(query, timezone, range);

  const scope = await resolveScope(organisationId, query.scope);
  result.truncated = scope.truncated;
  const names = new Map(
    scope.devices.map((device) => [device.id, device.name]),
  );

  const picked = pickMetric(
    scope.devices,
    await resolveMetricQuery(
      scope.devices.map((device) => device.id),
      query.metric_key,
    ),
  );
  result.metric = picked.metric;
  result.missing = picked.missing;
  if (!picked.metric || picked.deviceIds.length === 0) {
    return finish(result, started, query);
  }

  const supported = aggregationsByDataType[picked.metric.data_type];
  if (!supported.includes(query.aggregation)) {
    throw new ApiError(
      400,
      `"${picked.metric.label}" can't be calculated as ${query.aggregation}`,
    );
  }

  const deviceIds = picked.deviceIds;
  const latestOnly = query.aggregation === "latest";

  if (latestOnly) {
    result.values = await latestValues(
      deviceIds,
      query,
      range.to,
      names,
      result,
    );
  } else if (query.aggregation === "raw") {
    if (query.mode === "summary") {
      throw new ApiError(400, "Raw readings can only be shown over time");
    }
    const rows = await rawReadingsQuery({
      deviceIds,
      metricKey: query.metric_key,
      range,
      limit: MAX_RAW_ROWS,
    });
    if (rows.length > MAX_RAW_ROWS) result.truncated = true;
    result.series = rawSeries(rows.slice(0, MAX_RAW_ROWS), deviceIds, names);
  } else if (query.mode === "summary") {
    result.values = await summaryValues(deviceIds, query, range, names);
  } else {
    const size = resolveBucketSize(query.bucket_size, range);
    result.range.bucket_size = size;
    const [starts, rows] = await Promise.all([
      bucketStartsQuery(size, range, timezone),
      bucketedAggregateQuery({
        deviceIds,
        metricKey: query.metric_key,
        aggregation: query.aggregation,
        size,
        range,
        timezone,
        splitByDevice: query.split_by_device,
      }),
    ]);
    result.series = bucketedSeries(
      starts,
      rows,
      query.split_by_device ? deviceIds : [null],
      names,
    );
  }

  // Devices that have the parameter but sent nothing in the range.
  if (!latestOnly) {
    const withData = await devicesWithDataQuery(
      deviceIds,
      query.metric_key,
      range,
    );
    for (const id of deviceIds) {
      if (!withData.has(id)) {
        result.missing.push({
          device_id: id,
          device_name: names.get(id) ?? "",
          reason: "no_data",
        });
      }
    }
  }

  return finish(result, started, query);
}

function finish(
  result: AnalyticsResult,
  started: number,
  query: ParsedAnalyticsQuery,
) {
  result.duration_ms = Math.round(performance.now() - started);
  if (result.duration_ms > SLOW_QUERY_MS) {
    console.warn(
      `[analytics] slow query ${result.duration_ms}ms`,
      JSON.stringify({
        metric: query.metric_key,
        aggregation: query.aggregation,
        mode: query.mode,
        range: query.time_range,
        devices: result.series.length || result.values.length,
      }),
    );
  }
  return result;
}

async function latestValues(
  deviceIds: string[],
  query: ParsedAnalyticsQuery,
  to: Date,
  names: Map<string, string>,
  result: AnalyticsResult,
): Promise<SummaryValue[]> {
  const [rows, latitudes, longitudes] = await Promise.all([
    latestReadingsQuery(deviceIds, query.metric_key, to),
    query.latitude_metric
      ? latestReadingsQuery(deviceIds, query.latitude_metric, to)
      : Promise.resolve([]),
    query.longitude_metric
      ? latestReadingsQuery(deviceIds, query.longitude_metric, to)
      : Promise.resolve([]),
  ]);
  const numberOf = (list: RawValueRow[]) =>
    new Map(
      list.map((row) => {
        const value = readValue(row);
        return [row.device_id, typeof value === "number" ? value : null];
      }),
    );
  const lat = numberOf(latitudes);
  const lon = numberOf(longitudes);
  const byDevice = new Map(rows.map((row) => [row.device_id, row]));

  const values: SummaryValue[] = deviceIds.map((id) => {
    const row = byDevice.get(id);
    if (!row) {
      result.missing.push({
        device_id: id,
        device_name: names.get(id) ?? "",
        reason: "no_data",
      });
    }
    return {
      device_id: id,
      device_name: names.get(id) ?? null,
      value: row ? readValue(row) : null,
      t: row ? new Date(row.t) : null,
      count: row ? 1 : 0,
      ...(query.latitude_metric
        ? { latitude: lat.get(id) ?? null, longitude: lon.get(id) ?? null }
        : {}),
    };
  });

  if (query.split_by_device) return values;
  // Overall latest = the newest reading across all devices.
  const newest = values
    .filter((value) => value.t !== null)
    .sort((a, b) => b.t!.getTime() - a.t!.getTime())[0];
  return newest ? [newest] : [];
}

async function summaryValues(
  deviceIds: string[],
  query: ParsedAnalyticsQuery,
  range: ResolvedRange,
  names: Map<string, string>,
): Promise<SummaryValue[]> {
  const base = {
    deviceIds,
    metricKey: query.metric_key,
    aggregation: query.aggregation,
    splitByDevice: query.split_by_device,
  };
  const [current, previous] = await Promise.all([
    summaryAggregateQuery({ ...base, range }),
    query.compare_previous
      ? summaryAggregateQuery({
          ...base,
          range: { from: range.previousFrom, to: range.previousTo },
        })
      : Promise.resolve(null),
  ]);
  const previousBy = new Map(
    (previous ?? []).map((row) => [row.device_id, row]),
  );
  const keys: (string | null)[] = query.split_by_device ? deviceIds : [null];
  const currentBy = new Map(current.map((row) => [row.device_id, row]));
  return keys.map((key) => {
    const row = currentBy.get(key);
    const before = previousBy.get(key);
    return {
      device_id: key,
      device_name: key ? (names.get(key) ?? null) : null,
      // count over an empty range is a real 0; every other aggregate is null.
      value:
        row && row.count > 0
          ? row.value
          : query.aggregation === "count"
            ? 0
            : null,
      t: null,
      count: row?.count ?? 0,
      ...(query.compare_previous
        ? {
            previous:
              before && before.count > 0
                ? before.value
                : query.aggregation === "count"
                  ? 0
                  : null,
          }
        : {}),
    };
  });
}

function rawSeries(
  rows: RawValueRow[],
  deviceIds: string[],
  names: Map<string, string>,
): Series[] {
  const byDevice = new Map<string, Series>(
    deviceIds.map((id) => [
      id,
      { device_id: id, device_name: names.get(id) ?? null, points: [] },
    ]),
  );
  for (const row of rows) {
    byDevice.get(row.device_id)?.points.push({
      t: new Date(row.t),
      value: readValue(row),
      count: 1,
    });
  }
  return [...byDevice.values()];
}

function bucketedSeries(
  starts: Date[],
  rows: {
    device_id: string | null;
    bucket: number;
    value: number | null;
    count: number;
  }[],
  keys: (string | null)[],
  names: Map<string, string>,
): Series[] {
  const byKey = new Map<string | null, Map<number, (typeof rows)[number]>>();
  for (const row of rows) {
    const buckets = byKey.get(row.device_id) ?? new Map();
    buckets.set(row.bucket, row);
    byKey.set(row.device_id, buckets);
  }
  return keys.map((key) => {
    const buckets = byKey.get(key);
    return {
      device_id: key,
      device_name: key ? (names.get(key) ?? null) : null,
      // width_bucket is 1-based. Empty buckets stay null so charts show the gap.
      points: starts.map((t, index) => {
        const row = buckets?.get(index + 1);
        return {
          t,
          value: row && row.count > 0 ? row.value : null,
          count: row?.count ?? 0,
        };
      }),
    };
  });
}
