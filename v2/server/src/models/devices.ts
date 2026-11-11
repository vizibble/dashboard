import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db/client";
import { device, deviceTemplate, templateVersion } from "@/db/schema";

/** What the API exposes: the template a device instantiates, never the internal version. */
const publicDeviceColumns = {
  id: device.id,
  name: device.name,
  locationId: device.locationId,
  templateId: deviceTemplate.id,
  templateName: deviceTemplate.name,
};

function selectDevices() {
  return db
    .select(publicDeviceColumns)
    .from(device)
    .innerJoin(
      templateVersion,
      eq(device.templateVersionId, templateVersion.id),
    )
    .innerJoin(
      deviceTemplate,
      eq(templateVersion.templateId, deviceTemplate.id),
    );
}

export function listDevicesQuery(organisationId: string) {
  return selectDevices()
    .where(
      and(eq(device.organizationId, organisationId), isNull(device.deletedAt)),
    )
    .orderBy(device.name);
}

export async function findDeviceQuery(id: string, organisationId: string) {
  const [row] = await selectDevices()
    .where(
      and(
        eq(device.id, id),
        eq(device.organizationId, organisationId),
        isNull(device.deletedAt),
      ),
    )
    .limit(1);
  return row;
}

export async function findDeviceByKeyHashQuery(keyHash: string) {
  const [row] = await db
    .select()
    .from(device)
    .where(and(eq(device.deviceKey, keyHash), isNull(device.deletedAt)))
    .limit(1);
  return row;
}

export async function insertDeviceQuery(values: typeof device.$inferInsert) {
  const [row] = await db
    .insert(device)
    .values(values)
    .returning({ id: device.id });
  return row;
}

export async function updateDeviceQuery(
  id: string,
  organisationId: string,
  values: Partial<
    Pick<
      typeof device.$inferInsert,
      "name" | "locationId" | "templateVersionId"
    >
  >,
) {
  const [row] = await db
    .update(device)
    .set(values)
    .where(
      and(
        eq(device.id, id),
        eq(device.organizationId, organisationId),
        isNull(device.deletedAt),
      ),
    )
    .returning({ id: device.id });
  return row;
}

export async function replaceDeviceKeyQuery(
  id: string,
  organisationId: string,
  keyHash: string,
) {
  const [row] = await db
    .update(device)
    .set({ deviceKey: keyHash })
    .where(
      and(
        eq(device.id, id),
        eq(device.organizationId, organisationId),
        isNull(device.deletedAt),
      ),
    )
    .returning({ id: device.id });
  return row;
}

export async function removeDeviceQuery(
  id: string,
  organisationId: string,
  replacementKeyHash: string,
) {
  const [row] = await db
    .update(device)
    .set({
      deletedAt: new Date(),
      deviceKey: replacementKeyHash,
      locationId: null,
    })
    .where(
      and(
        eq(device.id, id),
        eq(device.organizationId, organisationId),
        isNull(device.deletedAt),
      ),
    )
    .returning({ id: device.id });
  return row;
}
