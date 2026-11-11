import { sql, type SQL } from "drizzle-orm";
import type { BucketSize, TimeRange } from "@vizibble/shared/dashboards";

import { db } from "@/db/client";
import { ApiError } from "@/lib/api-error";

/**
 * Turns a dashboard time range into absolute UTC instants for one organisation timezone.
 * Calendar ranges ("today", "this week") are computed in PostgreSQL on local wall-clock time
 * and converted back with AT TIME ZONE, so DST days are 23 or 25 hours long as they should be.
 * Ranges are half-open: [from, to).
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const RELATIVE_DURATIONS: Partial<Record<TimeRange, number>> = {
  "1h": HOUR,
  "6h": 6 * HOUR,
  "24h": DAY,
  "7d": 7 * DAY,
  "30d": 30 * DAY,
};

export const MAX_RANGE_MS = 400 * DAY;
export const MAX_BUCKETS = 1500;
const TARGET_BUCKETS = 240;

/** Approximate width, used only for sizing; real boundaries come from PostgreSQL. */
export const BUCKET_MS: Record<Exclude<BucketSize, "auto">, number> = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1h": HOUR,
  "6h": 6 * HOUR,
  "1d": DAY,
  "1w": 7 * DAY,
};

export const BUCKET_INTERVAL: Record<Exclude<BucketSize, "auto">, string> = {
  "1m": "1 minute",
  "5m": "5 minutes",
  "15m": "15 minutes",
  "1h": "1 hour",
  "6h": "6 hours",
  "1d": "1 day",
  "1w": "1 week",
};

export type ResolvedRange = {
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
};

export function resolveBucketSize(
  requested: BucketSize,
  range: { from: Date; to: Date },
): Exclude<BucketSize, "auto"> {
  const span = range.to.getTime() - range.from.getTime();
  if (requested !== "auto") {
    if (span / BUCKET_MS[requested] > MAX_BUCKETS) {
      throw new ApiError(
        400,
        "Too many points for this time range. Choose a larger interval.",
      );
    }
    return requested;
  }
  const sizes = Object.keys(BUCKET_MS) as Exclude<BucketSize, "auto">[];
  return sizes.find((size) => span / BUCKET_MS[size] <= TARGET_BUCKETS) ?? "1w";
}

export async function resolveTimeRange(
  timezone: string,
  range: TimeRange,
  customFrom?: string | Date | null,
  customTo?: string | Date | null,
): Promise<ResolvedRange> {
  const now = new Date();

  if (range === "custom") {
    if (!customFrom || !customTo) {
      throw new ApiError(400, "A custom range needs a start and an end");
    }
    const from = new Date(customFrom);
    const to = new Date(customTo);
    return withShiftedPrevious(from, to);
  }

  const duration = RELATIVE_DURATIONS[range];
  if (duration !== undefined) {
    return withShiftedPrevious(new Date(now.getTime() - duration), now);
  }

  const local = sql`(${now.toISOString()}::timestamptz at time zone ${timezone})`;
  const toUtc = (expression: SQL) =>
    sql`((${expression}) at time zone ${timezone})`;
  const startOf = (unit: "day" | "week") => sql`date_trunc(${unit}, ${local})`;

  let bounds: { from: SQL; to: SQL; previousFrom: SQL; previousTo: SQL };
  switch (range) {
    case "today":
      bounds = {
        from: toUtc(startOf("day")),
        to: toUtc(local),
        previousFrom: toUtc(sql`${startOf("day")} - interval '1 day'`),
        previousTo: toUtc(sql`${local} - interval '1 day'`),
      };
      break;
    case "yesterday":
      bounds = {
        from: toUtc(sql`${startOf("day")} - interval '1 day'`),
        to: toUtc(startOf("day")),
        previousFrom: toUtc(sql`${startOf("day")} - interval '2 days'`),
        previousTo: toUtc(sql`${startOf("day")} - interval '1 day'`),
      };
      break;
    case "this_week":
      bounds = {
        from: toUtc(startOf("week")),
        to: toUtc(local),
        previousFrom: toUtc(sql`${startOf("week")} - interval '7 days'`),
        previousTo: toUtc(sql`${local} - interval '7 days'`),
      };
      break;
    default:
      throw new ApiError(400, "Unsupported time range");
  }

  const [row] = await db.execute<{
    from: string;
    to: string;
    previous_from: string;
    previous_to: string;
  }>(
    sql`select ${bounds.from} as "from", ${bounds.to} as "to",
      ${bounds.previousFrom} as previous_from, ${bounds.previousTo} as previous_to`,
  );
  if (!row) throw new Error("Failed to resolve time range");
  return checked({
    from: new Date(row.from),
    to: new Date(row.to),
    previousFrom: new Date(row.previous_from),
    previousTo: new Date(row.previous_to),
  });
}

function withShiftedPrevious(from: Date, to: Date): ResolvedRange {
  const span = to.getTime() - from.getTime();
  return checked({
    from,
    to,
    previousFrom: new Date(from.getTime() - span),
    previousTo: from,
  });
}

function checked(range: ResolvedRange): ResolvedRange {
  const span = range.to.getTime() - range.from.getTime();
  if (!(span > 0)) {
    throw new ApiError(400, "The time range is empty");
  }
  if (span > MAX_RANGE_MS) {
    throw new ApiError(400, "Time ranges can cover at most 400 days");
  }
  return range;
}
