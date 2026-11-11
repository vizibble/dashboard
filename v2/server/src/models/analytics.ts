import { sql, type SQL } from "drizzle-orm";
import type { Aggregation, BucketSize } from "@vizibble/shared/dashboards";

import { db } from "@/db/client";
import { BUCKET_INTERVAL } from "@/lib/time-range";

/**
 * Read-only telemetry queries for dashboards. Everything here takes already-validated,
 * organisation-checked device ids; tenant checks live in `resolveScopeDevicesQuery`.
 * All aggregation runs in PostgreSQL; only bucketed or capped rows reach JavaScript.
 */

export type ScopeDevice = {
  id: string;
  name: string;
  locationId: string | null;
  templateName: string;
  lastSeenAt: Date | null;
};

export type ResolvedMetric = {
  deviceId: string;
  key: string;
  label: string;
  unit: string | null;
  symbol: string | null;
  dataType: string;
  inCurrentVersion: boolean;
  version: number;
};

export type RawValueRow = {
  device_id: string;
  t: Date;
  value_numeric: string | null;
  value_text: string | null;
  value_boolean: boolean | null;
};

function idList(ids: string[]): SQL {
  return sql`array[${sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  )}]::text[]`;
}

/** Ids from the request that really are live devices of this organisation. */
export async function findOrganisationDeviceIdsQuery(
  organisationId: string,
  ids: string[],
) {
  if (ids.length === 0) return [];
  const rows = await db.execute<{ id: string }>(sql`
    select id from devices
    where organization_id = ${organisationId}
      and deleted_at is null
      and id = any(${idList(ids)})`);
  return rows.map((row) => row.id);
}

export async function findOrganisationLocationIdsQuery(
  organisationId: string,
  ids: string[],
) {
  if (ids.length === 0) return [];
  const rows = await db.execute<{ id: string }>(sql`
    select id from locations
    where organization_id = ${organisationId} and id = any(${idList(ids)})`);
  return rows.map((row) => row.id);
}

/**
 * Live devices selected by explicit ids and/or locations (optionally with every
 * descendant location). No ids and no locations means the whole organisation.
 */
export async function resolveScopeDevicesQuery(
  organisationId: string,
  scope: {
    deviceIds: string[];
    locationIds: string[];
    includeChildLocations: boolean;
  },
  limit: number,
) {
  const everything =
    scope.deviceIds.length === 0 && scope.locationIds.length === 0;
  const locationFilter =
    scope.locationIds.length === 0
      ? sql`false`
      : scope.includeChildLocations
        ? sql`d.location_id in (
            with recursive tree as (
              select id from locations
              where organization_id = ${organisationId} and id = any(${idList(scope.locationIds)})
              union
              select l.id from locations l join tree on l.parent_id = tree.id
              where l.organization_id = ${organisationId}
            )
            select id from tree)`
        : sql`d.location_id = any(${idList(scope.locationIds)})`;
  const deviceFilter =
    scope.deviceIds.length === 0
      ? sql`false`
      : sql`d.id = any(${idList(scope.deviceIds)})`;

  const rows = await db.execute<{
    id: string;
    name: string;
    location_id: string | null;
    template_name: string;
    last_seen_at: string | null;
  }>(sql`
    select d.id, d.name, d.location_id, dt.name as template_name, d.last_seen_at
    from devices d
    join template_versions tv on tv.id = d.template_version_id
    join device_templates dt on dt.id = tv.template_id
    where d.organization_id = ${organisationId}
      and d.deleted_at is null
      and (${everything ? sql`true` : sql`${deviceFilter} or ${locationFilter}`})
    order by d.name, d.id
    limit ${limit + 1}`);

  const devices: ScopeDevice[] = rows.slice(0, limit).map((row) => ({
    id: row.id,
    name: row.name,
    locationId: row.location_id,
    templateName: row.template_name,
    lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at) : null,
  }));
  return { devices, truncated: rows.length > limit };
}

/**
 * The parameter definition each device uses for `metricKey`: the device's current template
 * configuration, or else the newest earlier configuration of the same template that had it,
 * so readings recorded before a template change keep their label and unit.
 */
export async function resolveMetricQuery(
  deviceIds: string[],
  metricKey: string,
): Promise<ResolvedMetric[]> {
  if (deviceIds.length === 0) return [];
  const rows = await db.execute<{
    device_id: string;
    key: string;
    label: string;
    unit: string | null;
    symbol: string | null;
    data_type: string;
    in_current_version: boolean;
    version: number;
  }>(sql`
    select distinct on (d.id)
      d.id as device_id, m.key, m.label, m.unit, m.symbol, m.data_type,
      (m.template_version_id = d.template_version_id) as in_current_version,
      tv.version
    from devices d
    join template_versions current_version on current_version.id = d.template_version_id
    join template_versions tv on tv.template_id = current_version.template_id
      and tv.version <= current_version.version
    join template_metrics m on m.template_version_id = tv.id and m.key = ${metricKey}
    where d.id = any(${idList(deviceIds)})
    order by d.id, tv.version desc`);
  return rows.map((row) => ({
    deviceId: row.device_id,
    key: row.key,
    label: row.label,
    unit: row.unit,
    symbol: row.symbol,
    dataType: row.data_type,
    inCurrentVersion: row.in_current_version,
    version: row.version,
  }));
}

/** Parameters available on the current configuration of the given devices. */
export async function discoverMetricsQuery(deviceIds: string[]) {
  if (deviceIds.length === 0) return [];
  return db.execute<{
    key: string;
    label: string;
    unit: string | null;
    symbol: string | null;
    data_type: string;
    device_count: number;
  }>(sql`
    select m.key,
      mode() within group (order by m.label) as label,
      mode() within group (order by m.unit) as unit,
      mode() within group (order by m.symbol) as symbol,
      mode() within group (order by m.data_type) as data_type,
      count(distinct d.id)::int as device_count
    from devices d
    join template_metrics m on m.template_version_id = d.template_version_id
    where d.id = any(${idList(deviceIds)})
    group by m.key
    order by label, m.key`);
}

function numericAggregate(aggregation: Aggregation): SQL {
  switch (aggregation) {
    case "avg":
      return sql`avg(t.value_numeric)::float8`;
    case "min":
      return sql`min(t.value_numeric)::float8`;
    case "max":
      return sql`max(t.value_numeric)::float8`;
    case "sum":
      return sql`sum(t.value_numeric)::float8`;
    case "count":
      return sql`count(*)::float8`;
    case "latest":
    case "raw":
      throw new Error(`${aggregation} is not an aggregate`);
  }
}

function bucketStart(
  size: Exclude<BucketSize, "auto">,
  from: Date,
  timezone: string,
): SQL {
  const fromSql = sql`${from.toISOString()}::timestamptz`;
  if (size === "1d") return sql`date_trunc('day', ${fromSql}, ${timezone})`;
  if (size === "1w") return sql`date_trunc('week', ${fromSql}, ${timezone})`;
  // Sub-day buckets align to local wall-clock time (matters for +05:30 style zones).
  return sql`(date_bin(${BUCKET_INTERVAL[size]}::interval, ${fromSql} at time zone ${timezone}, timestamp '2000-01-03') at time zone ${timezone})`;
}

/** Bucket boundaries, generated in the organisation timezone so day buckets follow DST. */
function bucketSeries(
  size: Exclude<BucketSize, "auto">,
  range: { from: Date; to: Date },
  timezone: string,
): SQL {
  return sql`generate_series(
    ${bucketStart(size, range.from, timezone)},
    ${range.to.toISOString()}::timestamptz - interval '1 microsecond',
    ${BUCKET_INTERVAL[size]}::interval,
    ${timezone})`;
}

export async function bucketStartsQuery(
  size: Exclude<BucketSize, "auto">,
  range: { from: Date; to: Date },
  timezone: string,
) {
  const rows = await db.execute<{ s: string }>(
    sql`select s from ${bucketSeries(size, range, timezone)} as s order by s`,
  );
  return rows.map((row) => new Date(row.s));
}

/** One row per (device, bucket) that has readings. Buckets without readings are absent. */
export async function bucketedAggregateQuery(params: {
  deviceIds: string[];
  metricKey: string;
  aggregation: Aggregation;
  size: Exclude<BucketSize, "auto">;
  range: { from: Date; to: Date };
  timezone: string;
  splitByDevice: boolean;
}) {
  const deviceColumn = params.splitByDevice ? sql`t.device_id` : sql`null`;
  return db.execute<{
    device_id: string | null;
    bucket: number;
    value: number | null;
    count: number;
  }>(sql`
    with buckets as (
      select array_agg(s order by s) as starts
      from ${bucketSeries(params.size, params.range, params.timezone)} as s
    )
    select ${deviceColumn} as device_id,
      width_bucket(t.timestamp, buckets.starts) as bucket,
      ${numericAggregate(params.aggregation)} as value,
      count(*)::int as count
    from telemetry t cross join buckets
    where t.device_id = any(${idList(params.deviceIds)})
      and t.metric_key = ${params.metricKey}
      and t.timestamp >= ${params.range.from.toISOString()}::timestamptz
      and t.timestamp < ${params.range.to.toISOString()}::timestamptz
    group by 1, 2
    order by 1, 2`);
}

/** One aggregate per device (or overall) across the whole range. */
export async function summaryAggregateQuery(params: {
  deviceIds: string[];
  metricKey: string;
  aggregation: Aggregation;
  range: { from: Date; to: Date };
  splitByDevice: boolean;
}) {
  const deviceColumn = params.splitByDevice ? sql`t.device_id` : sql`null`;
  return db.execute<{
    device_id: string | null;
    value: number | null;
    count: number;
  }>(sql`
    select ${deviceColumn} as device_id,
      ${numericAggregate(params.aggregation)} as value,
      count(*)::int as count
    from telemetry t
    where t.device_id = any(${idList(params.deviceIds)})
      and t.metric_key = ${params.metricKey}
      and t.timestamp >= ${params.range.from.toISOString()}::timestamptz
      and t.timestamp < ${params.range.to.toISOString()}::timestamptz
    group by 1`);
}

/** Newest reading per device at or before `to`. One index probe per device. */
export async function latestReadingsQuery(
  deviceIds: string[],
  metricKey: string,
  to: Date,
) {
  if (deviceIds.length === 0) return [];
  return db.execute<RawValueRow>(sql`
    select ids.id as device_id, r.timestamp as t, r.value_numeric, r.value_text, r.value_boolean
    from unnest(${idList(deviceIds)}) as ids(id)
    cross join lateral (
      select t.timestamp, t.value_numeric, t.value_text, t.value_boolean
      from telemetry t
      where t.device_id = ids.id
        and t.metric_key = ${metricKey}
        and t.timestamp <= ${to.toISOString()}::timestamptz
      order by t.timestamp desc
      limit 1
    ) r`);
}

/** Individual readings in time order, capped at `limit` + 1 so callers can flag truncation. */
export async function rawReadingsQuery(params: {
  deviceIds: string[];
  metricKey: string;
  range: { from: Date; to: Date };
  limit: number;
  newestFirst?: boolean;
}) {
  return db.execute<RawValueRow>(sql`
    select t.device_id, t.timestamp as t, t.value_numeric, t.value_text, t.value_boolean
    from telemetry t
    where t.device_id = any(${idList(params.deviceIds)})
      and t.metric_key = ${params.metricKey}
      and t.timestamp >= ${params.range.from.toISOString()}::timestamptz
      and t.timestamp < ${params.range.to.toISOString()}::timestamptz
    order by t.timestamp ${params.newestFirst ? sql`desc` : sql`asc`}, t.device_id
    limit ${params.limit + 1}`);
}

/** Readings of which devices exist in the range, for telling "no data" from real values. */
export async function devicesWithDataQuery(
  deviceIds: string[],
  metricKey: string,
  range: { from: Date; to: Date },
) {
  if (deviceIds.length === 0) return new Set<string>();
  const rows = await db.execute<{ device_id: string }>(sql`
    select ids.id as device_id
    from unnest(${idList(deviceIds)}) as ids(id)
    where exists (
      select 1 from telemetry t
      where t.device_id = ids.id
        and t.metric_key = ${metricKey}
        and t.timestamp >= ${range.from.toISOString()}::timestamptz
        and t.timestamp < ${range.to.toISOString()}::timestamptz
    )`);
  return new Set(rows.map((row) => row.device_id));
}

export async function findOrganisationTimezoneQuery(organisationId: string) {
  const [row] = await db.execute<{ timezone: string }>(
    sql`select timezone from organization where id = ${organisationId}`,
  );
  return row?.timezone ?? "UTC";
}

export async function updateOrganisationTimezoneQuery(
  organisationId: string,
  timezone: string,
) {
  await db.execute(
    sql`update organization set timezone = ${timezone} where id = ${organisationId}`,
  );
}
