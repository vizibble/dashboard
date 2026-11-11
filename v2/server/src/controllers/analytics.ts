import type { Request, Response } from "express";

import { ApiError } from "@/lib/api-error";
import {
  OFFLINE_AFTER_SECONDS,
  resolveScope,
  runAnalyticsQuery,
} from "@/lib/analytics-engine";
import { body, parse, sendData, textParam } from "@/lib/http";
import { can } from "@/lib/permissions";
import {
  discoverMetricsQuery,
  findOrganisationTimezoneQuery,
  updateOrganisationTimezoneQuery,
} from "@/models/analytics";
import {
  analyticsBatchResultSchema,
  analyticsBatchSchema,
  deviceStatusListSchema,
  discoveredMetricSchema,
  metricDiscoverySchema,
  type AnalyticsResult,
  type ParsedAnalyticsQuery,
} from "@vizibble/shared/analytics";
import {
  organisationSettingsSchema,
  updateOrganisationSettingsSchema,
} from "@vizibble/shared/settings";

function organisationParam(req: Request) {
  return textParam(req.params.organisationId, "organisation id");
}

/** Identical widget queries (same everything but `id`) run once per batch. */
function signature({ id: _id, ...rest }: ParsedAnalyticsQuery) {
  return JSON.stringify({
    ...rest,
    scope: {
      ...rest.scope,
      device_ids: [...rest.scope.device_ids].sort(),
      location_ids: [...rest.scope.location_ids].sort(),
    },
  });
}

export async function runAnalyticsController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const { queries } = parse(analyticsBatchSchema, body(req));
  const timezone = await findOrganisationTimezoneQuery(organisationId);

  const unique = new Map<string, Promise<AnalyticsResult>>();
  const results = await Promise.all(
    queries.map(async (query) => {
      const key = signature(query);
      let pending = unique.get(key);
      if (!pending) {
        pending = runAnalyticsQuery(organisationId, timezone, query);
        unique.set(key, pending);
      }
      try {
        return { ...(await pending), id: query.id };
      } catch (error) {
        // One misconfigured widget must not blank the whole dashboard.
        if (!(error instanceof ApiError) || error.status >= 500) throw error;
        const now = new Date();
        return {
          id: query.id,
          error: error.message,
          metric: null,
          range: { from: now, to: now, timezone, bucket_size: null },
          series: [],
          values: [],
          missing: [],
          truncated: false,
          duration_ms: 0,
        } satisfies AnalyticsResult;
      }
    }),
  );

  return sendData(res, { timezone, results }, 200, analyticsBatchResultSchema);
}

export async function discoverMetricsController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const { scope } = parse(metricDiscoverySchema, body(req));
  const { devices } = await resolveScope(organisationId, scope);
  const rows = await discoverMetricsQuery(devices.map((device) => device.id));
  return sendData(
    res,
    rows.map((row) => ({ ...row })),
    200,
    discoveredMetricSchema.array(),
  );
}

export async function listDeviceStatusController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const { devices } = await resolveScope(organisationId, {
    device_ids: [],
    location_ids: [],
    include_child_locations: true,
  });
  const now = Date.now();
  return sendData(
    res,
    {
      offlineAfterSeconds: OFFLINE_AFTER_SECONDS,
      devices: devices.map((device) => ({
        id: device.id,
        name: device.name,
        locationId: device.locationId ?? "",
        templateName: device.templateName,
        lastSeenAt: device.lastSeenAt,
        status: !device.lastSeenAt
          ? "never"
          : now - device.lastSeenAt.getTime() <= OFFLINE_AFTER_SECONDS * 1000
            ? "online"
            : "offline",
      })),
    },
    200,
    deviceStatusListSchema,
  );
}

export async function getSettingsController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  return sendData(
    res,
    {
      timezone: await findOrganisationTimezoneQuery(organisationId),
      canEdit: can(req, { settings: ["update"] }),
    },
    200,
    organisationSettingsSchema,
  );
}

export async function updateSettingsController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const values = parse(updateOrganisationSettingsSchema, body(req));
  await updateOrganisationTimezoneQuery(organisationId, values.timezone);
  return sendData(
    res,
    { timezone: values.timezone, canEdit: true },
    200,
    organisationSettingsSchema,
  );
}
