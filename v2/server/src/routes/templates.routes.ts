import { Router } from "express";
import { routes } from "@vizibble/shared/routes";

import {
  createMetricDefinitionController,
  createTemplateController,
  deleteTemplateController,
  getTemplateController,
  listMetricDefinitionsController,
  listTemplatesController,
  replaceTemplateParametersController,
  updateTemplateController,
} from "@/controllers/templates";
import { requireOrganisationMember } from "@/middleware/require-organisation-member";
import { requireUser } from "@/middleware/require-user";
import { requirePermission } from "@/lib/permissions";

export const templatesRouter = Router();

templatesRouter
  .route(routes.templates.collection)
  .all(requireUser, requireOrganisationMember)
  .get(requirePermission({ template: ["read"] }), listTemplatesController)
  .post(requirePermission({ template: ["create"] }), createTemplateController);

templatesRouter
  .route(routes.templates.item)
  .all(requireUser, requireOrganisationMember)
  .get(requirePermission({ template: ["read"] }), getTemplateController)
  .patch(requirePermission({ template: ["update"] }), updateTemplateController)
  .delete(
    requirePermission({ template: ["delete"] }),
    deleteTemplateController,
  );

templatesRouter
  .route(routes.templates.parameters)
  .all(requireUser, requireOrganisationMember)
  .put(
    requirePermission({ template: ["update"] }),
    replaceTemplateParametersController,
  );

// Catalogue of telemetry parameters users pick from when building templates.
templatesRouter
  .route(routes.metricDefinitions.collection)
  .all(requireUser, requireOrganisationMember)
  .get(
    requirePermission({ template: ["read"] }),
    listMetricDefinitionsController,
  )
  .post(
    requirePermission({ template: ["create"] }),
    createMetricDefinitionController,
  );
