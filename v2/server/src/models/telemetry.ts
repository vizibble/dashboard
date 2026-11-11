import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { device, telemetry } from "@/db/schema";

export async function insertReadingsQuery(
  deviceId: string,
  readings: Omit<typeof telemetry.$inferInsert, "deviceId" | "id">[],
) {
  return db.transaction(async (tx) => {
    await tx.insert(telemetry).values(
      readings.map((reading) => ({
        ...reading,
        id: crypto.randomUUID(),
        deviceId,
      })),
    );
    // Arrival time, not reading time: backfilled readings must not make a device look online.
    await tx
      .update(device)
      .set({ lastSeenAt: sql`now()` })
      .where(eq(device.id, deviceId));
  });
}

export function listOrganisationTelemetryQuery(
  organisationId: string,
  filters: {
    deviceId?: string;
    metricKey?: string;
    from?: Date;
    to?: Date;
    limit: number;
  },
) {
  const conditions = [eq(device.organizationId, organisationId)];
  if (filters.deviceId) {
    conditions.push(eq(telemetry.deviceId, filters.deviceId));
  }
  if (filters.metricKey) {
    conditions.push(eq(telemetry.metricKey, filters.metricKey));
  }
  if (filters.from) {
    conditions.push(gte(telemetry.timestamp, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(telemetry.timestamp, filters.to));
  }

  return db
    .select({
      id: telemetry.id,
      deviceId: telemetry.deviceId,
      metricKey: telemetry.metricKey,
      timestamp: telemetry.timestamp,
      valueNumeric: telemetry.valueNumeric,
      valueText: telemetry.valueText,
      valueBoolean: telemetry.valueBoolean,
    })
    .from(telemetry)
    .innerJoin(device, eq(telemetry.deviceId, device.id))
    .where(and(...conditions))
    .orderBy(desc(telemetry.timestamp), asc(telemetry.metricKey))
    .limit(filters.limit);
}
