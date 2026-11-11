import { Router } from "express";
import { routes } from "@vizibble/shared/routes";

import {
  createLocationController,
  deleteLocationController,
  getLocationController,
  listLocationsController,
  updateLocationController,
} from "@/controllers/locations";
import { requireOrganisationMember } from "@/middleware/require-organisation-member";
import { requireUser } from "@/middleware/require-user";
import { requirePermission } from "@/lib/permissions";

export const locationsRouter = Router();

locationsRouter
  .route(routes.locations.collection)
  .all(requireUser, requireOrganisationMember)
  .get(requirePermission({ location: ["read"] }), listLocationsController)
  .post(requirePermission({ location: ["create"] }), createLocationController);

locationsRouter
  .route(routes.locations.item)
  .all(requireUser, requireOrganisationMember)
  .get(requirePermission({ location: ["read"] }), getLocationController)
  .patch(requirePermission({ location: ["update"] }), updateLocationController)
  .delete(
    requirePermission({ location: ["delete"] }),
    deleteLocationController,
  );
