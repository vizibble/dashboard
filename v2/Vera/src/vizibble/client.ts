import axios, { type AxiosInstance } from "axios";
import CircuitBreaker from "opossum";
import { z } from "zod";

import { env, urls } from "@/config/env";
import { logContext, logger } from "@/lib/logger";
import { recordDuration } from "@/lib/stats";
import {
  analyticsBatchResultSchema,
  dashboardDetailSchema,
  dashboardSchema,
  deviceSchema,
  discoveredMetricSchema,
  locationSchema,
  meSchema,
  organisationAccessSchema,
  readingsPageSchema,
  scopedDeviceListSchema,
  whatsappLinkResultSchema,
  metricDefinitionSchema,
  settingsSchema,
  templateSchema,
  templateSummarySchema,
  widgetSchema,
  type AnalyticsQuery,
  type TemplateParameterInput,
  type WidgetInput,
} from "@/vizibble/schemas";

/**
 * Who a call is made for. The MCP access token is never forwarded (its audience is Vera);
 * the main server verifies a delegation it issued itself and can revoke.
 */
export type Delegation =
  | { kind: "mcp"; userId: string; clientId: string }
  | { kind: "grant"; grantToken: string };

export type ApiErrorCode =
  | "delegation_revoked"
  | "forbidden"
  | "not_found"
  | "invalid_request"
  | "unavailable";

export class VizibbleApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VizibbleApiError";
  }
}

const UNAVAILABLE =
  "Vizibble is temporarily unavailable. Please try again shortly.";
const RETRIES = 2;

function codeFor(status: number): ApiErrorCode {
  if (status === 401) return "delegation_revoked";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status >= 400 && status < 500) return "invalid_request";
  return "unavailable";
}

type Request = {
  operation: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  delegation?: Delegation;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Only read requests are retried. */
  retry?: boolean;
};

let http: AxiosInstance | undefined;
function client() {
  http ??= axios.create({
    baseURL: urls().apiBase,
    timeout: 8000,
    headers: {
      authorization: `Bearer ${env().VIZIBBLE_SERVICE_TOKEN}`,
      accept: "application/json",
    },
    // Every status is handled below, so axios never throws for HTTP errors.
    validateStatus: () => true,
  });
  return http;
}

function delegationHeaders(delegation?: Delegation): Record<string, string> {
  const { requestId, correlationId } = logContext();
  const headers: Record<string, string> = {};
  if (requestId) headers["x-request-id"] = requestId;
  if (correlationId) headers["x-correlation-id"] = correlationId;
  if (delegation?.kind === "mcp") {
    headers["x-vizibble-delegation"] = "mcp";
    headers["x-vizibble-user"] = delegation.userId;
    headers["x-vizibble-client"] = delegation.clientId;
  } else if (delegation?.kind === "grant") {
    headers["x-vizibble-delegation"] = "grant";
    headers["x-vizibble-grant"] = delegation.grantToken;
  }
  return headers;
}

/** One HTTP exchange with bounded retries on network errors and 502-504. */
async function send(request: Request): Promise<unknown> {
  const attempts = request.retry === false ? 1 : RETRIES + 1;
  for (let attempt = 1; ; attempt++) {
    const started = performance.now();
    try {
      const response = await client().request<{
        data?: unknown;
        error?: string;
      } | null>({
        method: request.method,
        url: request.path,
        params: request.query,
        data: request.body,
        headers: delegationHeaders(request.delegation),
      });
      if (
        response.status >= 502 &&
        response.status <= 504 &&
        attempt < attempts
      ) {
        await Bun.sleep(200 * 2 ** attempt);
        continue;
      }
      if (response.status >= 400) {
        const code = codeFor(response.status);
        const message =
          code === "unavailable"
            ? UNAVAILABLE
            : (response.data?.error ?? "Request failed");
        throw new VizibbleApiError(code, message, response.status);
      }
      return response.data?.data ?? null;
    } catch (error) {
      if (error instanceof VizibbleApiError) throw error;
      if (attempt < attempts) {
        await Bun.sleep(200 * 2 ** attempt);
        continue;
      }
      logger.warn("Main API unreachable", {
        operation: request.operation,
        error: (error as Error).message,
      });
      throw new VizibbleApiError("unavailable", UNAVAILABLE);
    } finally {
      recordDuration(
        `main_api.${request.operation}`,
        performance.now() - started,
      );
    }
  }
}

// Opens after repeated upstream failures so calls fail fast instead of piling on.
// A user's 4xx (revoked, forbidden, not found) never counts as a failure.
const breaker = new CircuitBreaker(send, {
  timeout: false,
  errorThresholdPercentage: 50,
  volumeThreshold: 5,
  resetTimeout: 15_000,
  errorFilter: (error: unknown) =>
    error instanceof VizibbleApiError && error.code !== "unavailable",
});
breaker.on("open", () => logger.warn("Main API circuit opened"));
breaker.on("close", () => logger.info("Main API circuit closed"));

export function circuitState() {
  return breaker.opened ? "open" : breaker.halfOpen ? "half-open" : "closed";
}

async function call<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let data: unknown;
  try {
    data = await breaker.fire(request);
  } catch (error) {
    if (error instanceof VizibbleApiError) throw error;
    throw new VizibbleApiError("unavailable", UNAVAILABLE); // circuit open
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    logger.error("Main API response violates contract", {
      operation: request.operation,
      issues: parsed.error.issues.slice(0, 3),
    });
    throw new VizibbleApiError("unavailable", UNAVAILABLE);
  }
  return parsed.data;
}

const org = (organisationId: string) =>
  `integrations/v1/organisations/${encodeURIComponent(organisationId)}`;

/**
 * The only way Vera reaches business data. Each function is one documented main-API
 * operation; there is no generic request a model could misuse.
 */
export const vizibble = {
  me: (d: Delegation) =>
    call(
      {
        operation: "me",
        method: "GET",
        path: "integrations/v1/me",
        delegation: d,
      },
      meSchema,
    ),

  organisation: (d: Delegation, organisationId: string) =>
    call(
      {
        operation: "organisation",
        method: "GET",
        path: org(organisationId),
        delegation: d,
      },
      organisationAccessSchema,
    ),

  locations: (d: Delegation, organisationId: string) =>
    call(
      {
        operation: "locations",
        method: "GET",
        path: `${org(organisationId)}/locations`,
        delegation: d,
      },
      z.array(locationSchema),
    ),

  location: (d: Delegation, organisationId: string, locationId: string) =>
    call(
      {
        operation: "location",
        method: "GET",
        path: `${org(organisationId)}/locations/${encodeURIComponent(locationId)}`,
        delegation: d,
      },
      locationSchema,
    ),

  devices: (
    d: Delegation,
    organisationId: string,
    filter: { locationId?: string; includeDescendants?: boolean } = {},
  ) =>
    call(
      {
        operation: "devices",
        method: "GET",
        path: `${org(organisationId)}/devices`,
        delegation: d,
        query: {
          location_id: filter.locationId,
          include_descendants: filter.includeDescendants ?? true,
        },
      },
      scopedDeviceListSchema,
    ),

  device: (d: Delegation, organisationId: string, deviceId: string) =>
    call(
      {
        operation: "device",
        method: "GET",
        path: `${org(organisationId)}/devices/${encodeURIComponent(deviceId)}`,
        delegation: d,
      },
      deviceSchema,
    ),

  metrics: (
    d: Delegation,
    organisationId: string,
    scope: { device_ids?: string[]; location_ids?: string[] },
  ) =>
    call(
      {
        operation: "metrics",
        method: "POST",
        path: `${org(organisationId)}/metrics`,
        delegation: d,
        body: { scope },
      },
      z.array(discoveredMetricSchema),
    ),

  analytics: (
    d: Delegation,
    organisationId: string,
    queries: AnalyticsQuery[],
  ) =>
    call(
      {
        operation: "analytics",
        method: "POST",
        path: `${org(organisationId)}/analytics`,
        delegation: d,
        body: { queries },
      },
      analyticsBatchResultSchema,
    ),

  readings: (
    d: Delegation,
    organisationId: string,
    q: {
      deviceId: string;
      metricKey?: string;
      timeRange: string;
      from?: string;
      to?: string;
      limit: number;
      cursor?: string;
    },
  ) =>
    call(
      {
        operation: "readings",
        method: "GET",
        path: `${org(organisationId)}/telemetry/readings`,
        delegation: d,
        query: {
          device_id: q.deviceId,
          metric_key: q.metricKey,
          time_range: q.timeRange,
          from: q.from,
          to: q.to,
          limit: q.limit,
          cursor: q.cursor,
        },
      },
      readingsPageSchema,
    ),

  dashboards: (d: Delegation, organisationId: string) =>
    call(
      {
        operation: "dashboards",
        method: "GET",
        path: `${org(organisationId)}/dashboards`,
        delegation: d,
      },
      z.array(dashboardSchema),
    ),

  dashboard: (d: Delegation, organisationId: string, dashboardId: string) =>
    call(
      {
        operation: "dashboard",
        method: "GET",
        path: `${org(organisationId)}/dashboards/${encodeURIComponent(dashboardId)}`,
        delegation: d,
      },
      dashboardDetailSchema,
    ),

  // --- Templates, catalogue and settings (reads) ---------------------------------------

  templates: (d: Delegation, organisationId: string) =>
    call(
      {
        operation: "templates",
        method: "GET",
        path: `${org(organisationId)}/templates`,
        delegation: d,
      },
      z.array(templateSummarySchema),
    ),

  template: (d: Delegation, organisationId: string, templateId: string) =>
    call(
      {
        operation: "template",
        method: "GET",
        path: `${org(organisationId)}/templates/${encodeURIComponent(templateId)}`,
        delegation: d,
      },
      templateSchema,
    ),

  metricDefinitions: (d: Delegation, organisationId: string) =>
    call(
      {
        operation: "metric_definitions",
        method: "GET",
        path: `${org(organisationId)}/metric-definitions`,
        delegation: d,
      },
      z.array(metricDefinitionSchema),
    ),

  settings: (d: Delegation, organisationId: string) =>
    call(
      {
        operation: "settings",
        method: "GET",
        path: `${org(organisationId)}/settings`,
        delegation: d,
      },
      settingsSchema,
    ),

  // --- Changes. Never retried: a timed-out write may still have succeeded. ------------

  createLocation: (
    d: Delegation,
    organisationId: string,
    body: {
      name: string;
      parent_id?: string | null;
      can_have_children: boolean;
    },
  ) =>
    call(
      {
        operation: "create_location",
        method: "POST",
        path: `${org(organisationId)}/locations`,
        delegation: d,
        body,
        retry: false,
      },
      locationSchema,
    ),

  renameLocation: (
    d: Delegation,
    organisationId: string,
    locationId: string,
    name: string,
  ) =>
    call(
      {
        operation: "rename_location",
        method: "PATCH",
        path: `${org(organisationId)}/locations/${encodeURIComponent(locationId)}`,
        delegation: d,
        body: { name },
        retry: false,
      },
      locationSchema,
    ),

  deleteLocation: (d: Delegation, organisationId: string, locationId: string) =>
    call(
      {
        operation: "delete_location",
        method: "DELETE",
        path: `${org(organisationId)}/locations/${encodeURIComponent(locationId)}`,
        delegation: d,
        retry: false,
      },
      z.null(),
    ),

  /** The response's one-time device key is dropped by the schema: it never reaches a model or chat. */
  createDevice: (
    d: Delegation,
    organisationId: string,
    body: { name: string; template_id: string; location_id: string },
  ) =>
    call(
      {
        operation: "create_device",
        method: "POST",
        path: `${org(organisationId)}/devices`,
        delegation: d,
        body,
        retry: false,
      },
      deviceSchema,
    ),

  updateDevice: (
    d: Delegation,
    organisationId: string,
    deviceId: string,
    body: { name?: string; template_id?: string; location_id?: string },
  ) =>
    call(
      {
        operation: "update_device",
        method: "PATCH",
        path: `${org(organisationId)}/devices/${encodeURIComponent(deviceId)}`,
        delegation: d,
        body,
        retry: false,
      },
      deviceSchema,
    ),

  deleteDevice: (d: Delegation, organisationId: string, deviceId: string) =>
    call(
      {
        operation: "delete_device",
        method: "DELETE",
        path: `${org(organisationId)}/devices/${encodeURIComponent(deviceId)}`,
        delegation: d,
        retry: false,
      },
      z.null(),
    ),

  createTemplate: (
    d: Delegation,
    organisationId: string,
    body: {
      name: string;
      description?: string | null;
      parameters: TemplateParameterInput[];
    },
  ) =>
    call(
      {
        operation: "create_template",
        method: "POST",
        path: `${org(organisationId)}/templates`,
        delegation: d,
        body,
        retry: false,
      },
      templateSchema,
    ),

  updateTemplate: (
    d: Delegation,
    organisationId: string,
    templateId: string,
    body: { name?: string; description?: string | null },
  ) =>
    call(
      {
        operation: "update_template",
        method: "PATCH",
        path: `${org(organisationId)}/templates/${encodeURIComponent(templateId)}`,
        delegation: d,
        body,
        retry: false,
      },
      templateSchema,
    ),

  replaceTemplateParameters: (
    d: Delegation,
    organisationId: string,
    templateId: string,
    parameters: TemplateParameterInput[],
  ) =>
    call(
      {
        operation: "replace_template_parameters",
        method: "PUT",
        path: `${org(organisationId)}/templates/${encodeURIComponent(templateId)}/parameters`,
        delegation: d,
        body: { parameters },
        retry: false,
      },
      templateSchema,
    ),

  deleteTemplate: (d: Delegation, organisationId: string, templateId: string) =>
    call(
      {
        operation: "delete_template",
        method: "DELETE",
        path: `${org(organisationId)}/templates/${encodeURIComponent(templateId)}`,
        delegation: d,
        retry: false,
      },
      z.null(),
    ),

  createDashboard: (
    d: Delegation,
    organisationId: string,
    body: {
      name: string;
      description?: string | null;
      scope: string;
      location_id?: string;
      device_id?: string;
      time_range?: string;
      visibility?: string;
    },
  ) =>
    call(
      {
        operation: "create_dashboard",
        method: "POST",
        path: `${org(organisationId)}/dashboards`,
        delegation: d,
        body,
        retry: false,
      },
      dashboardSchema,
    ),

  updateDashboard: (
    d: Delegation,
    organisationId: string,
    dashboardId: string,
    body: {
      name?: string;
      description?: string | null;
      time_range?: string;
      is_default?: boolean;
      visibility?: string;
    },
  ) =>
    call(
      {
        operation: "update_dashboard",
        method: "PATCH",
        path: `${org(organisationId)}/dashboards/${encodeURIComponent(dashboardId)}`,
        delegation: d,
        body,
        retry: false,
      },
      dashboardSchema,
    ),

  deleteDashboard: (
    d: Delegation,
    organisationId: string,
    dashboardId: string,
  ) =>
    call(
      {
        operation: "delete_dashboard",
        method: "DELETE",
        path: `${org(organisationId)}/dashboards/${encodeURIComponent(dashboardId)}`,
        delegation: d,
        retry: false,
      },
      z.null(),
    ),

  createWidget: (
    d: Delegation,
    organisationId: string,
    dashboardId: string,
    body: WidgetInput,
  ) =>
    call(
      {
        operation: "create_widget",
        method: "POST",
        path: `${org(organisationId)}/dashboards/${encodeURIComponent(dashboardId)}/widgets`,
        delegation: d,
        body,
        retry: false,
      },
      widgetSchema,
    ),

  updateWidget: (
    d: Delegation,
    organisationId: string,
    dashboardId: string,
    widgetId: string,
    body: WidgetInput,
  ) =>
    call(
      {
        operation: "update_widget",
        method: "PUT",
        path: `${org(organisationId)}/dashboards/${encodeURIComponent(dashboardId)}/widgets/${encodeURIComponent(widgetId)}`,
        delegation: d,
        body,
        retry: false,
      },
      widgetSchema,
    ),

  deleteWidget: (
    d: Delegation,
    organisationId: string,
    dashboardId: string,
    widgetId: string,
  ) =>
    call(
      {
        operation: "delete_widget",
        method: "DELETE",
        path: `${org(organisationId)}/dashboards/${encodeURIComponent(dashboardId)}/widgets/${encodeURIComponent(widgetId)}`,
        delegation: d,
        retry: false,
      },
      z.null(),
    ),

  updateTimezone: (d: Delegation, organisationId: string, timezone: string) =>
    call(
      {
        operation: "update_timezone",
        method: "PATCH",
        path: `${org(organisationId)}/settings`,
        delegation: d,
        body: { timezone },
        retry: false,
      },
      settingsSchema,
    ),

  /** Exchanges a single-use link code (sent by the user over WhatsApp) for a grant. */
  completeWhatsappLink: (code: string, phoneNumber: string) =>
    call(
      {
        operation: "whatsapp_link",
        method: "POST",
        path: "integrations/v1/whatsapp/link",
        body: { code, phone_number: phoneNumber },
        retry: false,
      },
      whatsappLinkResultSchema,
    ),

  /** The user typed "unlink" on WhatsApp. */
  revokeGrant: (d: Delegation) =>
    call(
      {
        operation: "revoke_grant",
        method: "DELETE",
        path: "integrations/v1/whatsapp/grant",
        delegation: d,
        retry: false,
      },
      z.null(),
    ),
};

export type VizibbleClient = typeof vizibble;
