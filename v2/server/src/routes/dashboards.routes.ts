import { Router } from "express";
import { routes } from "@vizibble/shared/routes";

import {
  createDashboardController,
  createWidgetController,
  deleteDashboardController,
  deleteWidgetController,
  getDashboardController,
  listDashboardsController,
  updateDashboardController,
  updateLayoutController,
  updateWidgetController,
} from "@/controllers/dashboards";
import { requireOrganisationMember } from "@/middleware/require-organisation-member";
import { requireUser } from "@/middleware/require-user";
import { requirePermission } from "@/lib/permissions";

export const dashboardsRouter = Router();

dashboardsRouter
  .route(routes.dashboards.collection)
  .all(requireUser, requireOrganisationMember)
  .get(requirePermission({ dashboard: ["read"] }), listDashboardsController)
  .post(
    requirePermission({ dashboard: ["create"] }),
    createDashboardController,
  );

dashboardsRouter
  .route(routes.dashboards.item)
  .all(requireUser, requireOrganisationMember)
  .get(requirePermission({ dashboard: ["read"] }), getDashboardController)
  .patch(
    requirePermission({ dashboard: ["update"] }),
    updateDashboardController,
  )
  .delete(
    requirePermission({ dashboard: ["delete"] }),
    deleteDashboardController,
  );

dashboardsRouter
  .route(routes.dashboards.widgets)
  .all(requireUser, requireOrganisationMember)
  .post(requirePermission({ dashboard: ["update"] }), createWidgetController);

dashboardsRouter
  .route(routes.dashboards.widget)
  .all(requireUser, requireOrganisationMember)
  .put(requirePermission({ dashboard: ["update"] }), updateWidgetController)
  .delete(requirePermission({ dashboard: ["update"] }), deleteWidgetController);

dashboardsRouter
  .route(routes.dashboards.layout)
  .all(requireUser, requireOrganisationMember)
  .put(requirePermission({ dashboard: ["update"] }), updateLayoutController);
