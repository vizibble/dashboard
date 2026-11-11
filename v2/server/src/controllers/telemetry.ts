import { createHash } from "node:crypto";
import type { Request, Response } from "express";

import { ApiError } from "@/lib/api-error";
import { body, parse, sendData, textParam } from "@/lib/http";
import { findDeviceByKeyHashQuery } from "@/models/devices";
import {
  insertReadingsQuery,
  listOrganisationTelemetryQuery,
} from "@/models/telemetry";
import { listMetricsQuery } from "@/models/templates";
import {
  ingestTelemetrySchema,
  telemetryQuerySchema,
} from "@vizibble/shared/telemetry";

export async function ingestTelemetryController(req: Request, res: Response) {
  const values = parse(ingestTelemetrySchema, body(req));
  const deviceKey = req.get("x-device-key");
  if (!deviceKey || deviceKey.length > 256) {
    throw new ApiError(401, "Valid x-device-key header required");
  }
  const keyHash = createHash("sha256").update(deviceKey).digest("hex");
  const device = await findDeviceByKeyHashQuery(keyHash);
  if (!device) {
    throw new ApiError(401, "Invalid device key");
  }

  const metrics = await listMetricsQuery(device.templateVersionId);
  const metricsByKey = new Map(metrics.map((metric) => [metric.key, metric]));
  for (const reading of values.readings) {
    const readingType = "value_type" in reading ? reading.value_type : "number";
    const metric = metricsByKey.get(reading.metric_key);
    if (!metric) {
      throw new ApiError(
        400,
        `Metric "${reading.metric_key}" is not a parameter of this device's template`,
      );
    }
    const expectedValueType =
      metric.dataType === "number" || metric.dataType === "integer"
        ? "number"
        : metric.dataType;
    if (readingType !== expectedValueType) {
      throw new ApiError(
        400,
        `Metric "${reading.metric_key}" requires a ${expectedValueType} value`,
      );
    }
    if (
      metric.dataType === "integer" &&
      readingType === "number" &&
      "value_numeric" in reading &&
      !Number.isInteger(reading.value_numeric)
    ) {
      throw new ApiError(
        400,
        `Metric "${reading.metric_key}" requires an integer value`,
      );
    }
  }

  await insertReadingsQuery(
    device.id,
    values.readings.map((reading) => {
      const base = {
        metricKey: reading.metric_key,
        timestamp: new Date(reading.timestamp),
      };
      if ("value_numeric" in reading) {
        return {
          ...base,
          valueNumeric: String(reading.value_numeric),
          valueText: null,
          valueBoolean: null,
        };
      }
      if ("value_text" in reading) {
        return {
          ...base,
          valueNumeric: null,
          valueText: reading.value_text,
          valueBoolean: null,
        };
      }
      return {
        ...base,
        valueNumeric: null,
        valueText: null,
        valueBoolean: reading.value_boolean,
      };
    }),
  );
  return sendData(res, { accepted: values.readings.length }, 202);
}

export async function listTelemetryController(req: Request, res: Response) {
  const organisationId = textParam(
    req.params.organisationId,
    "organisation id",
  );
  const query = parse(telemetryQuerySchema, req.query);
  const rows = await listOrganisationTelemetryQuery(organisationId, {
    deviceId: query.device_id,
    metricKey: query.metric_key,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
    limit: query.limit,
  });
  return sendData(res, rows);
}
