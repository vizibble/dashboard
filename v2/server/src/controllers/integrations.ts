import { randomBytes, randomInt } from "node:crypto";
import type { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { OFFLINE_AFTER_SECONDS, resolveScope } from "@/lib/analytics-engine";
import { ApiError } from "@/lib/api-error";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { body, parse, sendData, textParam } from "@/lib/http";
import { resolveTimeRange } from "@/lib/time-range";
import { sha256 } from "@/middleware/require-integration";
import { findOrganisationTimezoneQuery } from "@/models/analytics";
import { findMembershipQuery } from "@/models/members";
import {
  consumeLinkCodeQuery,
  findOrganisationQuery,
  findVerifiedUserQuery,
  listClientConsentsQuery,
  listLiveGrantsQuery,
  listReadingsPageQuery,
  listUserMembershipsQuery,
  replaceLinkCodeQuery,
  revokeClientTokensQuery,
  revokeGrantQuery,
  type ReadingsCursor,
} from "@/models/integrations";
import {
  completeWhatsappLinkSchema,
  createWhatsappLinkCodeSchema,
  integrationMeSchema,
  integrationsOverviewSchema,
  MAX_READINGS_RANGE_DAYS,
  organisationAccessSchema,
  readingsPageSchema,
  readingsQuerySchema,
  scopedDeviceListSchema,
  scopedDevicesQuerySchema,
  whatsappLinkCodeSchema,
  whatsappLinkResultSchema,
} from "@vizibble/shared/integrations";
import {
  roleHasPermission,
  statements,
  type Permissions,
} from "@vizibble/shared/permissions";

const LINK_CODE_TTL_MS = 10 * 60 * 1000;
// No 0/O, 1/I/L: the code is read off a screen and typed into WhatsApp.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Every "resource:action" the role grants, from the shared Better Auth role definitions. */
export function permissionsOf(role: string): string[] {
  const granted: string[] = [];
  for (const [resource, actions] of Object.entries(statements)) {
    for (const action of actions) {
      if (roleHasPermission(role, { [resource]: [action] } as Permissions)) {
        granted.push(`${resource}:${action}`);
      }
    }
  }
  return granted;
}

function newLinkCode() {
  const chars = Array.from(
    { length: 8 },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
  ).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}

/** Codes are compared case-insensitively, ignoring spaces and dashes. */
export function normaliseLinkCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function maskPhone(digits: string) {
  return `+${digits.slice(0, 2)} ${"•".repeat(Math.max(digits.length - 5, 3))}${digits.slice(-3)}`;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

// --- Integration management (signed-in user) ------------------------------------------

export async function getIntegrationsController(req: Request, res: Response) {
  const config = env.AI_INTEGRATIONS;
  if (!config.enabled) {
    return sendData(
      res,
      {
        enabled: false,
        mcpUrl: null,
        whatsappNumber: null,
        aiClients: [],
        whatsapp: [],
      },
      200,
      integrationsOverviewSchema,
    );
  }
  const [consents, grants] = await Promise.all([
    listClientConsentsQuery(req.userId!),
    listLiveGrantsQuery(req.userId!),
  ]);
  // One row per client: a client can hold several consents (e.g. per resource).
  const clients = new Map<string, (typeof consents)[number]>();
  for (const consent of consents) {
    if (!clients.has(consent.clientId)) clients.set(consent.clientId, consent);
  }
  return sendData(
    res,
    {
      enabled: true,
      mcpUrl: config.mcpUrl,
      whatsappNumber: config.whatsappNumber,
      aiClients: [...clients.values()].map((client) => ({
        clientId: client.clientId,
        name: client.name ?? "AI client",
        icon: client.icon?.startsWith("https:") ? client.icon : null,
        uri: client.uri?.startsWith("https:") ? client.uri : null,
        scopes: client.scopes,
        connectedAt: client.connectedAt,
      })),
      whatsapp: grants.map((grant) => ({
        id: grant.id,
        phone: grant.externalLabel,
        organisationId: grant.organizationId,
        organisationName: grant.organizationName,
        linkedAt: grant.createdAt,
        lastUsedAt: grant.lastUsedAt,
      })),
    },
    200,
    integrationsOverviewSchema,
  );
}

export async function createWhatsappLinkCodeController(
  req: Request,
  res: Response,
) {
  const config = env.AI_INTEGRATIONS;
  if (!config.enabled || !config.whatsappNumber) {
    throw new ApiError(409, "WhatsApp is not available on this deployment");
  }
  const values = parse(createWhatsappLinkCodeSchema, body(req));
  const membership = await findMembershipQuery(
    values.organisation_id,
    req.userId!,
  );
  if (!membership) {
    throw new ApiError(403, "Organisation access denied");
  }

  const code = newLinkCode();
  const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS);
  await replaceLinkCodeQuery({
    id: crypto.randomUUID(),
    userId: req.userId!,
    organizationId: values.organisation_id,
    channel: "whatsapp",
    codeHash: sha256(normaliseLinkCode(code)),
    expiresAt,
  });
  const message = `LINK ${code}`;
  return sendData(
    res,
    {
      code,
      message,
      expiresAt,
      whatsappNumber: config.whatsappNumber,
      whatsappUrl: `https://wa.me/${digitsOnly(config.whatsappNumber)}?text=${encodeURIComponent(message)}`,
    },
    201,
    whatsappLinkCodeSchema,
  );
}

export async function revokeWhatsappGrantController(
  req: Request,
  res: Response,
) {
  const grantId = textParam(req.params.grantId, "connection id");
  const revoked = await revokeGrantQuery(grantId, req.userId!);
  if (!revoked) throw new ApiError(404, "Connection not found");
  return res.status(204).send();
}

/** Disconnects ChatGPT/Claude: consent removed through Better Auth, then its tokens revoked. */
export async function disconnectAiClientController(
  req: Request,
  res: Response,
) {
  const clientId = textParam(req.params.clientId, "client id");
  const consents = (await listClientConsentsQuery(req.userId!)).filter(
    (consent) => consent.clientId === clientId,
  );
  if (consents.length === 0) throw new ApiError(404, "Connection not found");

  const headers = fromNodeHeaders(req.headers);
  for (const consent of consents) {
    await auth.api.deleteOAuthConsent({
      headers,
      body: { id: consent.consentId },
    });
  }
  await revokeClientTokensQuery(req.userId!, clientId);
  return res.status(204).send();
}

// --- Integration API (Vera) ------------------------------------------------------------

export async function getIntegrationMeController(req: Request, res: Response) {
  const user = await findVerifiedUserQuery(req.userId!);
  if (!user) throw new ApiError(401, "The user account is not available");
  const memberships = await listUserMembershipsQuery(user.id);
  const defaultOrganisationId = req.integration?.defaultOrganisationId ?? null;
  return sendData(
    res,
    {
      user: { id: user.id, name: user.name, email: user.email },
      // Only offered while the user is still a member of it.
      defaultOrganisationId: memberships.some(
        (m) => m.id === defaultOrganisationId,
      )
        ? defaultOrganisationId
        : null,
      organisations: memberships.map((m) => ({
        ...m,
        permissions: permissionsOf(m.role),
      })),
    },
    200,
    integrationMeSchema,
  );
}

/** Mount after requireOrganisationMember, which has verified membership and set the role. */
export async function getIntegrationOrganisationController(
  req: Request,
  res: Response,
) {
  const organisation = await findOrganisationQuery(req.organisationId!);
  if (!organisation) throw new ApiError(404, "Organisation not found");
  return sendData(
    res,
    {
      ...organisation,
      role: req.memberRole!,
      permissions: permissionsOf(req.memberRole!),
    },
    200,
    organisationAccessSchema,
  );
}

/** Live devices, optionally limited to a location and its descendants, with connectivity. */
export async function listScopedDevicesController(req: Request, res: Response) {
  const query = parse(scopedDevicesQuerySchema, req.query);
  const { devices, truncated } = await resolveScope(req.organisationId!, {
    device_ids: [],
    location_ids: query.location_id ? [query.location_id] : [],
    include_child_locations: query.include_descendants,
  });
  const now = Date.now();
  return sendData(
    res,
    {
      offlineAfterSeconds: OFFLINE_AFTER_SECONDS,
      truncated,
      devices: devices.map((device) => ({
        id: device.id,
        name: device.name,
        locationId: device.locationId ?? "",
        templateName: device.templateName,
        lastSeenAt: device.lastSeenAt,
        status: !device.lastSeenAt
          ? "never"
          : now - device.lastSeenAt.getTime() <= OFFLINE_AFTER_SECONDS * 1000
            ? "online"
            : "offline",
      })),
    },
    200,
    scopedDeviceListSchema,
  );
}

function encodeCursor(cursor: ReadingsCursor) {
  return Buffer.from(`${cursor.timestamp.toISOString()}|${cursor.id}`).toString(
    "base64url",
  );
}

function decodeCursor(value: string): ReadingsCursor {
  const [timestamp, id] = Buffer.from(value, "base64url").toString().split("|");
  const date = new Date(timestamp ?? "");
  if (!id || Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Invalid cursor");
  }
  return { timestamp: date, id };
}

export async function listReadingsController(req: Request, res: Response) {
  const query = parse(readingsQuerySchema, req.query);
  // Same period rules as dashboards, in the organisation timezone.
  const range = await resolveTimeRange(
    await findOrganisationTimezoneQuery(req.organisationId!),
    query.time_range,
    query.from,
    query.to,
  );
  if (
    range.to.getTime() - range.from.getTime() >
    MAX_READINGS_RANGE_DAYS * 24 * 60 * 60 * 1000
  ) {
    throw new ApiError(
      400,
      `Raw readings are limited to ${MAX_READINGS_RANGE_DAYS} days per request`,
    );
  }
  const rows = await listReadingsPageQuery({
    organisationId: req.organisationId!,
    deviceId: query.device_id,
    metricKey: query.metric_key,
    from: range.from,
    to: range.to,
    limit: query.limit,
    cursor: query.cursor ? decodeCursor(query.cursor) : undefined,
  });
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  return sendData(
    res,
    {
      readings: page.map((row) => ({
        deviceId: row.deviceId,
        metricKey: row.metricKey,
        timestamp: row.timestamp,
        value:
          row.valueNumeric !== null
            ? Number(row.valueNumeric)
            : (row.valueText ?? row.valueBoolean!),
      })),
      range: { from: range.from, to: range.to },
      nextCursor:
        rows.length > query.limit && last
          ? encodeCursor({ timestamp: last.timestamp, id: last.id })
          : null,
    },
    200,
    readingsPageSchema,
  );
}

/** Vera reports a WhatsApp number that sent a link code; the code proves who the user is. */
export async function completeWhatsappLinkController(
  req: Request,
  res: Response,
) {
  const values = parse(completeWhatsappLinkSchema, body(req));
  const grantToken = randomBytes(32).toString("base64url");
  const grant = await consumeLinkCodeQuery({
    codeHash: sha256(normaliseLinkCode(values.code)),
    channel: "whatsapp",
    grant: {
      id: crypto.randomUUID(),
      tokenHash: sha256(grantToken),
      externalIdHash: sha256(`whatsapp:${values.phone_number}`),
      externalLabel: maskPhone(values.phone_number),
    },
  });
  if (!grant) {
    throw new ApiError(422, "This code is invalid, expired or already used");
  }
  return sendData(
    res,
    {
      grantId: grant.id,
      grantToken,
      userId: grant.userId,
      defaultOrganisationId: grant.organizationId,
    },
    201,
    whatsappLinkResultSchema,
  );
}

/** The user unlinked from WhatsApp itself ("unlink"); revokes the grant Vera presented. */
export async function revokeCurrentGrantController(
  req: Request,
  res: Response,
) {
  if (req.integration?.kind !== "grant" || !req.integration.grantId) {
    throw new ApiError(400, "Only a linked-account delegation can be revoked");
  }
  await revokeGrantQuery(req.integration.grantId, req.userId!);
  return res.status(204).send();
}
