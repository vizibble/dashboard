import type { Request, Response } from "express";

import { ApiError } from "@/lib/api-error";
import { body, parse, sendData, textParam, uuidParam } from "@/lib/http";
import {
  listLocationsQuery,
  findLocationQuery,
  insertLocationQuery,
  hasLocationChildrenQuery,
  hasLocationDevicesQuery,
  removeLocationQuery,
  updateLocationQuery,
} from "@/models/locations";
import {
  createLocationSchema,
  renameLocationSchema,
} from "@vizibble/shared/locations";

export async function listLocationsController(req: Request, res: Response) {
  const organisationId = textParam(
    req.params.organisationId,
    "organisation id",
  );
  return sendData(res, await listLocationsQuery(organisationId));
}

export async function createLocationController(req: Request, res: Response) {
  const organisationId = textParam(
    req.params.organisationId,
    "organisation id",
  );
  const values = parse(createLocationSchema, body(req));
  if (values.parent_id) {
    const parent = await findLocationQuery(values.parent_id, organisationId);
    if (!parent) {
      throw new ApiError(400, "Parent location not found");
    }
    if (!parent.canHaveChildren) {
      throw new ApiError(400, "Parent location cannot contain child locations");
    }
  }

  const created = await insertLocationQuery({
    id: crypto.randomUUID(),
    organizationId: organisationId,
    parentId: values.parent_id ?? null,
    name: values.name,
    canHaveChildren: values.can_have_children,
  });
  return sendData(res, created, 201);
}

export async function getLocationController(req: Request, res: Response) {
  const organisationId = textParam(
    req.params.organisationId,
    "organisation id",
  );
  const id = uuidParam(req.params.locationId, "location id");
  const location = await findLocationQuery(id, organisationId);
  if (!location) {
    throw new ApiError(404, "Location not found");
  }
  return sendData(res, location);
}

export async function updateLocationController(req: Request, res: Response) {
  const organisationId = textParam(
    req.params.organisationId,
    "organisation id",
  );
  const id = uuidParam(req.params.locationId, "location id");
  const values = parse(renameLocationSchema, body(req));
  const updated = await updateLocationQuery(id, organisationId, {
    name: values.name,
  });
  if (!updated) {
    throw new ApiError(404, "Location not found");
  }
  return sendData(res, updated);
}

export async function deleteLocationController(req: Request, res: Response) {
  const organisationId = textParam(
    req.params.organisationId,
    "organisation id",
  );
  const id = uuidParam(req.params.locationId, "location id");
  const existing = await findLocationQuery(id, organisationId);
  if (!existing) {
    throw new ApiError(404, "Location not found");
  }
  if (await hasLocationChildrenQuery(id, organisationId)) {
    throw new ApiError(
      409,
      "Cannot delete a location that has child locations. Delete or reassign the children first.",
    );
  }
  if (await hasLocationDevicesQuery(id, organisationId)) {
    throw new ApiError(
      409,
      "Cannot delete a location that is assigned to one or more devices.",
    );
  }
  const deleted = await removeLocationQuery(id, organisationId);
  if (!deleted) {
    throw new ApiError(404, "Location not found");
  }
  return res.status(204).send();
}
