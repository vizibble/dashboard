import { z } from "zod";

import { VizibbleApiError } from "@/vizibble/client";
import type { AnalyticsResult, Location, MetricInfo } from "@/vizibble/schemas";
import { ToolError, type ToolContext } from "@/tools/types";

// --- Shared input pieces ---------------------------------------------------------------

export const organisationIdInput = z
  .string()
  .min(1)
  .max(255)
  .optional()
  .describe(
    "Organisation to query. Omit to use the user's current organisation; required when the user belongs to several and none is selected.",
  );

export const idInput = (what: string) =>
  z.uuid().describe(`${what} id (UUID) from a list tool.`);

export const metricKeyInput = z
  .string()
  .regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,99}$/)
  .describe(
    "Metric key, e.g. 'temperature'. Use list_device_metrics to discover keys.",
  );

export const periods = [
  "1h",
  "6h",
  "24h",
  "7d",
  "30d",
  "today",
  "yesterday",
  "this_week",
] as const;

export const periodInput = {
  period: z
    .enum(periods)
    .optional()
    .describe(
      "Relative period in the organisation's timezone. Use this OR from/to. Defaults to 24h.",
    ),
  from: z.iso
    .datetime({ offset: true })
    .optional()
    .describe("Start of a custom range (ISO 8601). Requires `to`."),
  to: z.iso
    .datetime({ offset: true })
    .optional()
    .describe("End of a custom range (ISO 8601). Requires `from`."),
};

const MAX_CUSTOM_RANGE_DAYS = 366;

/** Resolves the period inputs into the analytics API's time fields, enforcing bounds. */
export function timeRange(input: {
  period?: (typeof periods)[number];
  from?: string;
  to?: string;
}) {
  if (input.from || input.to) {
    if (!input.from || !input.to)
      throw new ToolError(
        "invalid_input",
        "A custom range needs both `from` and `to`.",
      );
    if (input.period)
      throw new ToolError(
        "invalid_input",
        "Use either `period` or `from`/`to`, not both.",
      );
    const from = new Date(input.from);
    const to = new Date(input.to);
    if (from >= to)
      throw new ToolError("invalid_input", "`from` must be before `to`.");
    if (to.getTime() - from.getTime() > MAX_CUSTOM_RANGE_DAYS * 86_400_000) {
      throw new ToolError(
        "invalid_input",
        `Ranges are limited to ${MAX_CUSTOM_RANGE_DAYS} days.`,
      );
    }
    if (from.getTime() > Date.now())
      throw new ToolError("invalid_input", "The range starts in the future.");
    return {
      time_range: "custom" as const,
      time_from: from.toISOString(),
      time_to: to.toISOString(),
    };
  }
  return { time_range: input.period ?? "24h" };
}

// --- Organisation resolution -----------------------------------------------------------

/**
 * Picks the organisation a call targets. This only chooses what to *ask* for: the main API
 * still verifies membership and permissions on the call itself.
 */
export async function resolveOrganisation(
  context: ToolContext,
  requested?: string,
): Promise<string> {
  if (requested) return requested;
  if (context.activeOrganisationId) return context.activeOrganisationId;
  const me = await context.api.me(context.delegation);
  const preferred = context.defaultOrganisationId ?? me.default_organisation_id;
  if (preferred && me.organisations.some((o) => o.id === preferred))
    return preferred;
  if (me.organisations.length === 1) return me.organisations[0]!.id;
  if (me.organisations.length === 0) {
    throw new ToolError(
      "forbidden",
      "This account doesn't belong to any Vizibble organisation.",
    );
  }
  throw new ToolError(
    "organisation_required",
    "The user belongs to several organisations. Ask which one, then pass organisation_id.",
    {
      organisations: me.organisations.map((o) => ({ id: o.id, name: o.name })),
    },
  );
}

// --- Error mapping --------------------------------------------------------------------

export function toToolError(error: unknown): ToolError {
  if (error instanceof ToolError) return error;
  if (error instanceof VizibbleApiError) {
    switch (error.code) {
      case "delegation_revoked":
        return new ToolError(
          "unauthorised",
          "This Vizibble connection is no longer authorised. Reconnect it from Vizibble → Integrations.",
        );
      case "forbidden":
        return new ToolError(
          "forbidden",
          "You don't have access to that in Vizibble.",
        );
      case "not_found":
        return new ToolError(
          "not_found",
          "That item wasn't found in this organisation.",
        );
      case "invalid_request":
        return new ToolError("invalid_input", error.message);
      default:
        return new ToolError(
          "unavailable",
          "Vizibble is temporarily unavailable. No data was returned; please try again shortly.",
        );
    }
  }
  return new ToolError(
    "internal",
    "Something went wrong while running this tool.",
  );
}

// --- Presentation ----------------------------------------------------------------------

export function unitOf(metric: MetricInfo | null) {
  return metric?.symbol ?? metric?.unit ?? null;
}

/** Location names from the root down, e.g. "Plant 1 › BOPP Line 6". */
export function locationPaths(locations: Location[]) {
  const byId = new Map(locations.map((l) => [l.id, l]));
  const paths = new Map<string, string>();
  for (const location of locations) {
    const names: string[] = [];
    let current: Location | undefined = location;
    const seen = new Set<string>();
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      names.unshift(current.name);
      current = current.parent_id ? byId.get(current.parent_id) : undefined;
    }
    paths.set(location.id, names.join(" › "));
  }
  return paths;
}

export function matches(name: string, search?: string) {
  return !search || name.toLowerCase().includes(search.trim().toLowerCase());
}

/** Analytics results carry their own per-query error; surface it as a tool error. */
export function ensureResult(
  result: AnalyticsResult | undefined,
): AnalyticsResult {
  if (!result) throw new ToolError("internal", "No result was returned.");
  if (result.error) throw new ToolError("invalid_input", result.error);
  return result;
}

export function describeRange(result: AnalyticsResult) {
  return {
    from: result.range.from.toISOString(),
    to: result.range.to.toISOString(),
    timezone: result.range.timezone,
  };
}

export function describeMissing(result: AnalyticsResult) {
  const reasons = {
    metric_not_in_template: "this device doesn't measure this metric",
    incompatible_type:
      "this device records the metric with a different data type",
    no_data: "no readings in this period",
  } as const;
  return result.missing.map((m) => ({
    device_id: m.device_id,
    device_name: m.device_name,
    reason: reasons[m.reason],
  }));
}

// --- Computed highlights ---------------------------------------------------------------
// Facts computed here, not by the model, so answers never rest on model arithmetic.

const round = (value: number) => Math.round(value * 1000) / 1000;

/** First/last value, extremes with their times, and the overall change of a series. */
export function seriesHighlights(
  points: { t: Date; value: number | string | boolean | null }[],
) {
  const numeric = points.filter(
    (p): p is { t: Date; value: number } => typeof p.value === "number",
  );
  if (numeric.length === 0) return null;
  const first = numeric[0]!;
  const last = numeric.at(-1)!;
  const highest = numeric.reduce((a, b) => (b.value > a.value ? b : a));
  const lowest = numeric.reduce((a, b) => (b.value < a.value ? b : a));
  const change = last.value - first.value;
  return {
    first: { at: first.t.toISOString(), value: round(first.value) },
    last: { at: last.t.toISOString(), value: round(last.value) },
    highest: { at: highest.t.toISOString(), value: round(highest.value) },
    lowest: { at: lowest.t.toISOString(), value: round(lowest.value) },
    change: round(change),
    change_percent:
      first.value !== 0 ? round((change / Math.abs(first.value)) * 100) : null,
    direction:
      Math.abs(change) < 1e-9 ? "flat" : change > 0 ? "rising" : "falling",
    buckets_with_data: numeric.length,
    buckets_without_data: points.length - numeric.length,
  };
}

/** Ranking and spread across devices for one numeric value each. */
export function comparisonHighlights(
  values: {
    device_name: string | null;
    value: number | string | boolean | null;
  }[],
) {
  const numeric = values.filter(
    (v): v is { device_name: string | null; value: number } =>
      typeof v.value === "number",
  );
  if (numeric.length < 2) return null;
  const sorted = [...numeric].sort((a, b) => b.value - a.value);
  const mean = numeric.reduce((sum, v) => sum + v.value, 0) / numeric.length;
  return {
    highest: {
      device_name: sorted[0]!.device_name,
      value: round(sorted[0]!.value),
    },
    lowest: {
      device_name: sorted.at(-1)!.device_name,
      value: round(sorted.at(-1)!.value),
    },
    spread: round(sorted[0]!.value - sorted.at(-1)!.value),
    mean_of_devices: round(mean),
  };
}

/** Change against the previous equivalent period, when both values are numbers. */
export function periodChange(current: unknown, previous: unknown) {
  if (typeof current !== "number" || typeof previous !== "number") return null;
  return {
    change: round(current - previous),
    change_percent:
      previous !== 0
        ? round(((current - previous) / Math.abs(previous)) * 100)
        : null,
  };
}
