/**
 * Single source of truth for API paths (relative to /api/v2).
 * The server registers these patterns; the client builds URLs from them with `buildPath`,
 * so a renamed route fails to compile on both sides instead of 404-ing at runtime.
 */
export const routes = {
  locations: {
    collection: "/locations/:organisationId",
    item: "/locations/:organisationId/:locationId",
  },
  templates: {
    collection: "/templates/:organisationId",
    item: "/templates/:organisationId/:templateId",
    parameters: "/templates/:organisationId/:templateId/parameters",
  },
  metricDefinitions: {
    collection: "/metric-definitions/:organisationId",
  },
  devices: {
    collection: "/devices/:organisationId",
    item: "/devices/:organisationId/:deviceId",
    rotateKey: "/devices/:organisationId/:deviceId/rotate-key",
  },
  telemetry: {
    ingest: "/telemetry",
    collection: "/telemetry/:organisationId",
  },
  dashboards: {
    collection: "/dashboards/:organisationId",
    item: "/dashboards/:organisationId/:dashboardId",
    widgets: "/dashboards/:organisationId/:dashboardId/widgets",
    widget: "/dashboards/:organisationId/:dashboardId/widgets/:widgetId",
    layout: "/dashboards/:organisationId/:dashboardId/layout",
  },
  analytics: {
    query: "/analytics/:organisationId/query",
    metrics: "/analytics/:organisationId/metrics",
    devices: "/analytics/:organisationId/devices",
  },
  settings: {
    item: "/settings/:organisationId",
  },
  /** Signed-in user managing their AI connections (session auth). */
  integrations: {
    overview: "/integrations",
    whatsappLinkCodes: "/integrations/whatsapp/link-codes",
    whatsappGrant: "/integrations/whatsapp/:grantId",
    aiClient: "/integrations/ai-clients/:clientId",
  },
  /**
   * Versioned API for Vera, the AI integration service (service credential + user delegation).
   * Organisation routes reuse the dashboard's controllers and permission checks.
   */
  integrationApi: {
    me: "/integrations/v1/me",
    organisation: "/integrations/v1/organisations/:organisationId",
    locations: "/integrations/v1/organisations/:organisationId/locations",
    location:
      "/integrations/v1/organisations/:organisationId/locations/:locationId",
    devices: "/integrations/v1/organisations/:organisationId/devices",
    device: "/integrations/v1/organisations/:organisationId/devices/:deviceId",
    metrics: "/integrations/v1/organisations/:organisationId/metrics",
    analytics: "/integrations/v1/organisations/:organisationId/analytics",
    readings:
      "/integrations/v1/organisations/:organisationId/telemetry/readings",
    dashboards: "/integrations/v1/organisations/:organisationId/dashboards",
    dashboard:
      "/integrations/v1/organisations/:organisationId/dashboards/:dashboardId",
    templates: "/integrations/v1/organisations/:organisationId/templates",
    template:
      "/integrations/v1/organisations/:organisationId/templates/:templateId",
    templateParameters:
      "/integrations/v1/organisations/:organisationId/templates/:templateId/parameters",
    metricDefinitions:
      "/integrations/v1/organisations/:organisationId/metric-definitions",
    dashboardWidgets:
      "/integrations/v1/organisations/:organisationId/dashboards/:dashboardId/widgets",
    dashboardWidget:
      "/integrations/v1/organisations/:organisationId/dashboards/:dashboardId/widgets/:widgetId",
    settings: "/integrations/v1/organisations/:organisationId/settings",
    whatsappLink: "/integrations/v1/whatsapp/link",
    whatsappGrant: "/integrations/v1/whatsapp/grant",
  },
} as const;

type ParamNames<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ParamNames<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? Param
      : never;

export type PathParams<Path extends string> = {
  [K in ParamNames<Path>]: string;
};

/** buildPath(routes.devices.item, { organisationId, deviceId }) → "/devices/org/dev" (URL-encoded). */
export function buildPath<Path extends string>(
  path: Path,
  params: PathParams<Path>,
): string {
  return path.replace(/:([A-Za-z]+)/g, (_, name: string) => {
    const value = (params as Record<string, string>)[name];
    if (value === undefined)
      throw new Error(`Missing path parameter "${name}" for ${path}`);
    return encodeURIComponent(value);
  });
}
