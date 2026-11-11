import {
  and,
  arrayContains,
  desc,
  eq,
  gt,
  gte,
  lte,
  isNull,
  lt,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db/client";
import {
  device,
  integrationGrant,
  integrationLinkCode,
  member,
  oauthAccessToken,
  oauthClient,
  oauthConsent,
  oauthRefreshToken,
  organization,
  telemetry,
  user,
} from "@/db/schema";

export type IntegrationChannel = "whatsapp";

export async function findVerifiedUserQuery(id: string) {
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
  return row?.emailVerified ? row : undefined;
}

/** Every organisation the user belongs to, with their role in it. */
export function listUserMembershipsQuery(userId: string) {
  return db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      timezone: organization.timezone,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, userId))
    .orderBy(organization.name);
}

export async function findOrganisationQuery(id: string) {
  const [row] = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      timezone: organization.timezone,
    })
    .from(organization)
    .where(eq(organization.id, id))
    .limit(1);
  return row;
}

// --- AI clients (OAuth consents) ------------------------------------------------------

/** The user's consent for an OAuth client, only while it still covers `scope`. */
export async function findClientConsentQuery(
  userId: string,
  clientId: string,
  scope: string,
) {
  const [row] = await db
    .select({ id: oauthConsent.id, scopes: oauthConsent.scopes })
    .from(oauthConsent)
    .innerJoin(oauthClient, eq(oauthConsent.clientId, oauthClient.clientId))
    .where(
      and(
        eq(oauthConsent.userId, userId),
        eq(oauthConsent.clientId, clientId),
        arrayContains(oauthConsent.scopes, [scope]),
        or(isNull(oauthClient.disabled), eq(oauthClient.disabled, false)),
      ),
    )
    .limit(1);
  return row;
}

export function listClientConsentsQuery(userId: string) {
  return db
    .select({
      consentId: oauthConsent.id,
      clientId: oauthClient.clientId,
      name: oauthClient.name,
      icon: oauthClient.icon,
      uri: oauthClient.uri,
      scopes: oauthConsent.scopes,
      connectedAt: oauthConsent.createdAt,
    })
    .from(oauthConsent)
    .innerJoin(oauthClient, eq(oauthConsent.clientId, oauthClient.clientId))
    .where(eq(oauthConsent.userId, userId))
    .orderBy(desc(oauthConsent.createdAt));
}

/**
 * Revokes everything a user granted one OAuth client: refresh tokens (so it can't mint new
 * access tokens) and any stored access tokens. Consents are removed through Better Auth.
 */
export async function revokeClientTokensQuery(
  userId: string,
  clientId: string,
) {
  await db.transaction(async (tx) => {
    await tx
      .delete(oauthAccessToken)
      .where(
        and(
          eq(oauthAccessToken.userId, userId),
          eq(oauthAccessToken.clientId, clientId),
        ),
      );
    await tx
      .delete(oauthRefreshToken)
      .where(
        and(
          eq(oauthRefreshToken.userId, userId),
          eq(oauthRefreshToken.clientId, clientId),
        ),
      );
  });
}

// --- WhatsApp link codes and grants ----------------------------------------------------

/** Replaces any unused code the user has for this channel with a new one. */
export async function replaceLinkCodeQuery(
  values: typeof integrationLinkCode.$inferInsert,
) {
  await db.transaction(async (tx) => {
    await tx
      .delete(integrationLinkCode)
      .where(
        and(
          eq(integrationLinkCode.userId, values.userId),
          eq(integrationLinkCode.channel, values.channel),
          isNull(integrationLinkCode.consumedAt),
        ),
      );
    await tx.insert(integrationLinkCode).values(values);
  });
}

/**
 * Atomically consumes a live code and issues a grant for the external identity. Any earlier
 * live grant for the same number is revoked first, so one number maps to one account.
 * Returns undefined when the code is unknown, expired or already used.
 */
export async function consumeLinkCodeQuery(params: {
  codeHash: string;
  channel: IntegrationChannel;
  grant: {
    id: string;
    tokenHash: string;
    externalIdHash: string;
    externalLabel: string;
  };
}) {
  return db.transaction(async (tx) => {
    const [code] = await tx
      .update(integrationLinkCode)
      .set({ consumedAt: sql`now()` })
      .where(
        and(
          eq(integrationLinkCode.codeHash, params.codeHash),
          eq(integrationLinkCode.channel, params.channel),
          isNull(integrationLinkCode.consumedAt),
          gt(integrationLinkCode.expiresAt, sql`now()`),
        ),
      )
      .returning();
    if (!code) return undefined;

    await tx
      .update(integrationGrant)
      .set({ revokedAt: sql`now()` })
      .where(
        and(
          eq(integrationGrant.channel, params.channel),
          eq(integrationGrant.externalIdHash, params.grant.externalIdHash),
          isNull(integrationGrant.revokedAt),
        ),
      );
    const [grant] = await tx
      .insert(integrationGrant)
      .values({
        ...params.grant,
        userId: code.userId,
        organizationId: code.organizationId,
        channel: params.channel,
      })
      .returning();
    return grant;
  });
}

export async function findLiveGrantByTokenHashQuery(tokenHash: string) {
  const [row] = await db
    .select()
    .from(integrationGrant)
    .where(
      and(
        eq(integrationGrant.tokenHash, tokenHash),
        isNull(integrationGrant.revokedAt),
      ),
    )
    .limit(1);
  return row;
}

export async function touchGrantQuery(id: string) {
  await db
    .update(integrationGrant)
    .set({ lastUsedAt: sql`now()` })
    .where(eq(integrationGrant.id, id));
}

export function listLiveGrantsQuery(userId: string) {
  return db
    .select({
      id: integrationGrant.id,
      channel: integrationGrant.channel,
      externalLabel: integrationGrant.externalLabel,
      organizationId: integrationGrant.organizationId,
      organizationName: organization.name,
      createdAt: integrationGrant.createdAt,
      lastUsedAt: integrationGrant.lastUsedAt,
    })
    .from(integrationGrant)
    .leftJoin(
      organization,
      eq(integrationGrant.organizationId, organization.id),
    )
    .where(
      and(
        eq(integrationGrant.userId, userId),
        isNull(integrationGrant.revokedAt),
      ),
    )
    .orderBy(desc(integrationGrant.createdAt));
}

export async function revokeGrantQuery(id: string, userId: string) {
  const [row] = await db
    .update(integrationGrant)
    .set({ revokedAt: sql`now()` })
    .where(
      and(
        eq(integrationGrant.id, id),
        eq(integrationGrant.userId, userId),
        isNull(integrationGrant.revokedAt),
      ),
    )
    .returning({ id: integrationGrant.id });
  return row;
}

// --- Raw readings (keyset pagination) --------------------------------------------------

export type ReadingsCursor = { timestamp: Date; id: string };

/**
 * One page of a device's raw readings, newest first. Ordered by (timestamp, id) so the
 * cursor is stable even when several readings share a timestamp.
 */
export function listReadingsPageQuery(params: {
  organisationId: string;
  deviceId: string;
  metricKey?: string;
  from: Date;
  to: Date;
  limit: number;
  cursor?: ReadingsCursor;
}) {
  const conditions = [
    eq(device.organizationId, params.organisationId),
    isNull(device.deletedAt),
    eq(telemetry.deviceId, params.deviceId),
    gte(telemetry.timestamp, params.from),
    lte(telemetry.timestamp, params.to),
  ];
  if (params.metricKey) {
    conditions.push(eq(telemetry.metricKey, params.metricKey));
  }
  if (params.cursor) {
    conditions.push(
      or(
        lt(telemetry.timestamp, params.cursor.timestamp),
        and(
          eq(telemetry.timestamp, params.cursor.timestamp),
          lt(telemetry.id, params.cursor.id),
        ),
      )!,
    );
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
    .orderBy(desc(telemetry.timestamp), desc(telemetry.id))
    .limit(params.limit + 1);
}
