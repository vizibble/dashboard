import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";

import { ApiError } from "@/lib/api-error";
import { body, parse, sendData, textParam, uuidParam } from "@/lib/http";
import {
  findDeviceQuery,
  insertDeviceQuery,
  listDevicesQuery,
  removeDeviceQuery,
  replaceDeviceKeyQuery,
  updateDeviceQuery,
} from "@/models/devices";
import { findLocationQuery } from "@/models/locations";
import { findCurrentVersionQuery } from "@/models/templates";
import {
  createDeviceSchema,
  deviceSchema,
  deviceWithKeySchema,
  updateDeviceSchema,
} from "@vizibble/shared/devices";

function hashDeviceKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

function newDeviceKey() {
  return randomBytes(32).toString("base64url");
}

function organisationParam(req: Request) {
  return textParam(req.params.organisationId, "organisation id");
}

/** Devices can only live in leaf locations of their own organisation. */
async function assertLeafLocation(organisationId: string, locationId: string) {
  const location = await findLocationQuery(locationId, organisationId);
  if (!location) {
    throw new ApiError(400, "Location must belong to this organisation");
  }
  if (location.canHaveChildren) {
    throw new ApiError(
      400,
      "Devices can only be placed in locations that cannot contain other locations",
    );
  }
}

/** A device runs its template's current configuration. */
async function currentConfigurationOf(
  organisationId: string,
  templateId: string,
) {
  const version = await findCurrentVersionQuery(templateId, organisationId);
  if (!version) {
    throw new ApiError(400, "Template must belong to this organisation");
  }
  return version.id;
}

async function deviceOrThrow(id: string, organisationId: string) {
  const row = await findDeviceQuery(id, organisationId);
  if (!row) throw new ApiError(404, "Device not found");
  return row;
}

export async function listDevicesController(req: Request, res: Response) {
  return sendData(
    res,
    await listDevicesQuery(organisationParam(req)),
    200,
    deviceSchema.array(),
  );
}

export async function createDeviceController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const values = parse(createDeviceSchema, body(req));
  await assertLeafLocation(organisationId, values.location_id);
  const templateVersionId = await currentConfigurationOf(
    organisationId,
    values.template_id,
  );

  const deviceKey = newDeviceKey();
  const created = await insertDeviceQuery({
    id: crypto.randomUUID(),
    organizationId: organisationId,
    name: values.name,
    deviceKey: hashDeviceKey(deviceKey),
    deletedAt: null,
    locationId: values.location_id,
    templateVersionId,
  });
  if (!created) throw new Error("Failed to create device");
  const row = await deviceOrThrow(created.id, organisationId);
  return sendData(res, { ...row, deviceKey }, 201, deviceWithKeySchema);
}

export async function getDeviceController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const id = uuidParam(req.params.deviceId, "device id");
  return sendData(
    res,
    await deviceOrThrow(id, organisationId),
    200,
    deviceSchema,
  );
}

export async function updateDeviceController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const id = uuidParam(req.params.deviceId, "device id");
  const values = parse(updateDeviceSchema, body(req));
  const current = await deviceOrThrow(id, organisationId);

  if (values.location_id !== undefined) {
    await assertLeafLocation(organisationId, values.location_id);
  }
  // Only re-point the configuration when the template actually changes.
  const templateVersionId =
    values.template_id !== undefined &&
    values.template_id !== current.templateId
      ? await currentConfigurationOf(organisationId, values.template_id)
      : undefined;

  const updated = await updateDeviceQuery(id, organisationId, {
    ...(values.name === undefined ? {} : { name: values.name }),
    ...(values.location_id === undefined
      ? {}
      : { locationId: values.location_id }),
    ...(templateVersionId === undefined ? {} : { templateVersionId }),
  });
  if (!updated) throw new ApiError(404, "Device not found");
  return sendData(
    res,
    await deviceOrThrow(id, organisationId),
    200,
    deviceSchema,
  );
}

export async function rotateDeviceKeyController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const id = uuidParam(req.params.deviceId, "device id");
  const deviceKey = newDeviceKey();
  const updated = await replaceDeviceKeyQuery(
    id,
    organisationId,
    hashDeviceKey(deviceKey),
  );
  if (!updated) throw new ApiError(404, "Device not found");
  const row = await deviceOrThrow(id, organisationId);
  return sendData(res, { ...row, deviceKey }, 200, deviceWithKeySchema);
}

export async function deleteDeviceController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const id = uuidParam(req.params.deviceId, "device id");
  const deleted = await removeDeviceQuery(
    id,
    organisationId,
    hashDeviceKey(newDeviceKey()),
  );
  if (!deleted) throw new ApiError(404, "Device not found");
  return res.status(204).send();
}
