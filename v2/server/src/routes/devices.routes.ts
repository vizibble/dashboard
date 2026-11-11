import { Router } from "express";
import { routes } from "@vizibble/shared/routes";

import {
  listDevicesController,
  createDeviceController,
  getDeviceController,
  updateDeviceController,
  deleteDeviceController,
  rotateDeviceKeyController,
} from "@/controllers/devices";
import { requireOrganisationMember } from "@/middleware/require-organisation-member";
import { requireUser } from "@/middleware/require-user";
import { requirePermission } from "@/lib/permissions";

export const devicesRouter = Router();

devicesRouter
  .route(routes.devices.collection)
  .all(requireUser, requireOrganisationMember)
  .get(requirePermission({ device: ["read"] }), listDevicesController)
  .post(requirePermission({ device: ["create"] }), createDeviceController);

devicesRouter
  .route(routes.devices.item)
  .all(requireUser, requireOrganisationMember)
  .get(requirePermission({ device: ["read"] }), getDeviceController)
  .patch(requirePermission({ device: ["update"] }), updateDeviceController)
  .delete(requirePermission({ device: ["delete"] }), deleteDeviceController);

devicesRouter
  .route(routes.devices.rotateKey)
  .all(requireUser, requireOrganisationMember)
  .post(requirePermission({ device: ["update"] }), rotateDeviceKeyController);
