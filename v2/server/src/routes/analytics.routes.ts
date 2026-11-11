import { Router } from "express";
import { routes } from "@vizibble/shared/routes";

import {
  discoverMetricsController,
  getSettingsController,
  listDeviceStatusController,
  runAnalyticsController,
  updateSettingsController,
} from "@/controllers/analytics";
import { requireOrganisationMember } from "@/middleware/require-organisation-member";
import { requireUser } from "@/middleware/require-user";
import { requirePermission } from "@/lib/permissions";

export const analyticsRouter = Router();

analyticsRouter
  .route(routes.analytics.query)
  .all(requireUser, requireOrganisationMember)
  .post(requirePermission({ telemetry: ["read"] }), runAnalyticsController);

analyticsRouter
  .route(routes.analytics.metrics)
  .all(requireUser, requireOrganisationMember)
  .post(requirePermission({ telemetry: ["read"] }), discoverMetricsController);

analyticsRouter
  .route(routes.analytics.devices)
  .all(requireUser, requireOrganisationMember)
  .get(requirePermission({ device: ["read"] }), listDeviceStatusController);

analyticsRouter
  .route(routes.settings.item)
  .all(requireUser, requireOrganisationMember)
  .get(requirePermission({ settings: ["read"] }), getSettingsController)
  .patch(requirePermission({ settings: ["update"] }), updateSettingsController);
