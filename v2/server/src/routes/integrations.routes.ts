import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { routes } from "@vizibble/shared/routes";

import {
  discoverMetricsController,
  getSettingsController,
  runAnalyticsController,
  updateSettingsController,
} from "@/controllers/analytics";
import {
  createDashboardController,
  createWidgetController,
  deleteDashboardController,
  deleteWidgetController,
  getDashboardController,
  listDashboardsController,
  updateDashboardController,
  updateWidgetController,
} from "@/controllers/dashboards";
import {
  createDeviceController,
  deleteDeviceController,
  getDeviceController,
  updateDeviceController,
} from "@/controllers/devices";
import {
  createTemplateController,
  deleteTemplateController,
  getTemplateController,
  listMetricDefinitionsController,
  listTemplatesController,
  replaceTemplateParametersController,
  updateTemplateController,
} from "@/controllers/templates";
import {
  completeWhatsappLinkController,
  createWhatsappLinkCodeController,
  disconnectAiClientController,
  getIntegrationMeController,
  getIntegrationOrganisationController,
  getIntegrationsController,
  listReadingsController,
  listScopedDevicesController,
  revokeCurrentGrantController,
  revokeWhatsappGrantController,
} from "@/controllers/integrations";
import {
  createLocationController,
  deleteLocationController,
  getLocationController,
  listLocationsController,
  updateLocationController,
} from "@/controllers/locations";
import { requirePermission } from "@/lib/permissions";
import {
  requireIntegrationService,
  requireIntegrationUser,
  requireIntegrationWrite,
  sha256,
} from "@/middleware/require-integration";
import { requireOrganisationMember } from "@/middleware/require-organisation-member";
import { requireUser } from "@/middleware/require-user";

export const integrationsRouter = Router();

// --- Signed-in user managing their AI connections -------------------------------------

integrationsRouter
  .route(routes.integrations.overview)
  .get(requireUser, getIntegrationsController);

integrationsRouter.route(routes.integrations.whatsappLinkCodes).post(
  rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  requireUser,
  createWhatsappLinkCodeController,
);

integrationsRouter
  .route(routes.integrations.whatsappGrant)
  .delete(requireUser, revokeWhatsappGrantController);

integrationsRouter
  .route(routes.integrations.aiClient)
  .delete(requireUser, disconnectAiClientController);

// --- Versioned API for Vera -----------------------------------------------------------
// Every route needs Vera's service credential AND a live user delegation; organisation
// routes then run the dashboard's own membership and permission guards.

const integrationApi = Router();
integrationApi.use(
  "/integrations/v1",
  requireIntegrationService,
  // Per delegated user (all traffic comes from Vera's address, so an IP key would let one
  // busy user throttle everyone). Safe to read the headers: the service token is verified.
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => {
      const user = req.get("x-vizibble-user");
      const grant = req.get("x-vizibble-grant");
      return user
        ? `user:${user}`
        : grant
          ? `grant:${sha256(grant)}`
          : "service";
    },
  }),
);

// Linking runs before a delegation exists: the single-use code identifies the user.
integrationApi.post(
  routes.integrationApi.whatsappLink,
  completeWhatsappLinkController,
);

integrationApi.use("/integrations/v1", requireIntegrationUser);

integrationApi.get(routes.integrationApi.me, getIntegrationMeController);
integrationApi.delete(
  routes.integrationApi.whatsappGrant,
  revokeCurrentGrantController,
);

const member = [requireOrganisationMember] as const;

integrationApi.get(
  routes.integrationApi.organisation,
  ...member,
  getIntegrationOrganisationController,
);
integrationApi.get(
  routes.integrationApi.locations,
  ...member,
  requirePermission({ location: ["read"] }),
  listLocationsController,
);
integrationApi.get(
  routes.integrationApi.location,
  ...member,
  requirePermission({ location: ["read"] }),
  getLocationController,
);
integrationApi.get(
  routes.integrationApi.devices,
  ...member,
  requirePermission({ device: ["read"] }),
  listScopedDevicesController,
);
integrationApi.get(
  routes.integrationApi.device,
  ...member,
  requirePermission({ device: ["read"] }),
  getDeviceController,
);
integrationApi.post(
  routes.integrationApi.metrics,
  ...member,
  requirePermission({ telemetry: ["read"] }),
  discoverMetricsController,
);
integrationApi.post(
  routes.integrationApi.analytics,
  ...member,
  requirePermission({ telemetry: ["read"] }),
  runAnalyticsController,
);
integrationApi.get(
  routes.integrationApi.readings,
  ...member,
  requirePermission({ telemetry: ["read"] }),
  listReadingsController,
);
integrationApi.get(
  routes.integrationApi.dashboards,
  ...member,
  requirePermission({ dashboard: ["read"] }),
  listDashboardsController,
);
integrationApi.get(
  routes.integrationApi.dashboard,
  ...member,
  requirePermission({ dashboard: ["read"] }),
  getDashboardController,
);

// --- Reads added with write support (templates, catalogue, settings) ----------------

integrationApi.get(
  routes.integrationApi.templates,
  ...member,
  requirePermission({ template: ["read"] }),
  listTemplatesController,
);
integrationApi.get(
  routes.integrationApi.template,
  ...member,
  requirePermission({ template: ["read"] }),
  getTemplateController,
);
integrationApi.get(
  routes.integrationApi.metricDefinitions,
  ...member,
  requirePermission({ template: ["read"] }),
  listMetricDefinitionsController,
);
integrationApi.get(
  routes.integrationApi.settings,
  ...member,
  requirePermission({ settings: ["read"] }),
  getSettingsController,
);

// --- Changes: write-enabled delegation + the same permission as the dashboard ------

const writer = [requireOrganisationMember, requireIntegrationWrite] as const;

integrationApi.post(
  routes.integrationApi.locations,
  ...writer,
  requirePermission({ location: ["create"] }),
  createLocationController,
);
integrationApi.patch(
  routes.integrationApi.location,
  ...writer,
  requirePermission({ location: ["update"] }),
  updateLocationController,
);
integrationApi.delete(
  routes.integrationApi.location,
  ...writer,
  requirePermission({ location: ["delete"] }),
  deleteLocationController,
);

integrationApi.post(
  routes.integrationApi.devices,
  ...writer,
  requirePermission({ device: ["create"] }),
  createDeviceController,
);
integrationApi.patch(
  routes.integrationApi.device,
  ...writer,
  requirePermission({ device: ["update"] }),
  updateDeviceController,
);
integrationApi.delete(
  routes.integrationApi.device,
  ...writer,
  requirePermission({ device: ["delete"] }),
  deleteDeviceController,
);

integrationApi.post(
  routes.integrationApi.templates,
  ...writer,
  requirePermission({ template: ["create"] }),
  createTemplateController,
);
integrationApi.patch(
  routes.integrationApi.template,
  ...writer,
  requirePermission({ template: ["update"] }),
  updateTemplateController,
);
integrationApi.put(
  routes.integrationApi.templateParameters,
  ...writer,
  requirePermission({ template: ["update"] }),
  replaceTemplateParametersController,
);
integrationApi.delete(
  routes.integrationApi.template,
  ...writer,
  requirePermission({ template: ["delete"] }),
  deleteTemplateController,
);

integrationApi.post(
  routes.integrationApi.dashboards,
  ...writer,
  requirePermission({ dashboard: ["create"] }),
  createDashboardController,
);
integrationApi.patch(
  routes.integrationApi.dashboard,
  ...writer,
  requirePermission({ dashboard: ["update"] }),
  updateDashboardController,
);
integrationApi.delete(
  routes.integrationApi.dashboard,
  ...writer,
  requirePermission({ dashboard: ["delete"] }),
  deleteDashboardController,
);
integrationApi.post(
  routes.integrationApi.dashboardWidgets,
  ...writer,
  requirePermission({ dashboard: ["update"] }),
  createWidgetController,
);
integrationApi.put(
  routes.integrationApi.dashboardWidget,
  ...writer,
  requirePermission({ dashboard: ["update"] }),
  updateWidgetController,
);
integrationApi.delete(
  routes.integrationApi.dashboardWidget,
  ...writer,
  requirePermission({ dashboard: ["update"] }),
  deleteWidgetController,
);

integrationApi.patch(
  routes.integrationApi.settings,
  ...writer,
  requirePermission({ settings: ["update"] }),
  updateSettingsController,
);

integrationsRouter.use(integrationApi);
