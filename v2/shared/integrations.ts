import { z } from "zod";

import { idSchema, metricKeySchema, timestampSchema } from "./common";
import { connectivityStatuses } from "./analytics";
import { timeRanges } from "./dashboards";

// --- Integration management (signed-in user) ------------------------------------------

export const createWhatsappLinkCodeSchema = z
  .object({ organisation_id: z.string().trim().min(1).max(255) })
  .strict();

export type CreateWhatsappLinkCodeInput = z.infer<
  typeof createWhatsappLinkCodeSchema
>;

export const aiClientConnectionSchema = z.object({
  client_id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  uri: z.string().nullable(),
  scopes: z.array(z.string()),
  connected_at: z.coerce.date().nullable(),
});

export const whatsappConnectionSchema = z.object({
  id: z.string(),
  phone: z.string(),
  organisation_id: z.string().nullable(),
  organisation_name: z.string().nullable(),
  linked_at: z.coerce.date(),
  last_used_at: z.coerce.date().nullable(),
});

export const integrationsOverviewSchema = z.object({
  /** False until the AI service (Vera) is configured for this deployment. */
  enabled: z.boolean(),
  mcp_url: z.string().nullable(),
  whatsapp_number: z.string().nullable(),
  ai_clients: z.array(aiClientConnectionSchema),
  whatsapp: z.array(whatsappConnectionSchema),
});

export const whatsappLinkCodeSchema = z.object({
  code: z.string(),
  /** The exact message to send, e.g. "LINK 7KQ4-M9PX". */
  message: z.string(),
  expires_at: z.coerce.date(),
  whatsapp_number: z.string(),
  whatsapp_url: z.string(),
});

export type AiClientConnection = z.infer<typeof aiClientConnectionSchema>;
export type WhatsappConnection = z.infer<typeof whatsappConnectionSchema>;
export type IntegrationsOverview = z.infer<typeof integrationsOverviewSchema>;
export type WhatsappLinkCode = z.infer<typeof whatsappLinkCodeSchema>;

// --- Integration API (Vera) ------------------------------------------------------------

export const organisationAccessSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  timezone: z.string(),
  role: z.string(),
  /** Every permission the member's current role grants, as "resource:action". */
  permissions: z.array(z.string()),
});

export const integrationMeSchema = z.object({
  user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
  /** Organisation picked when the channel was linked, if any (WhatsApp). */
  default_organisation_id: z.string().nullable(),
  organisations: z.array(organisationAccessSchema),
});

export const scopedDevicesQuerySchema = z
  .object({
    location_id: idSchema.optional(),
    include_descendants: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
  })
  .strict();

export const scopedDeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  location_id: z.string(),
  template_name: z.string(),
  last_seen_at: z.coerce.date().nullable(),
  status: z.enum(connectivityStatuses),
});

export const scopedDeviceListSchema = z.object({
  offline_after_seconds: z.number(),
  truncated: z.boolean(),
  devices: z.array(scopedDeviceSchema),
});

/** Maximum span of one raw-readings request; longer periods should be aggregated. */
export const MAX_READINGS_RANGE_DAYS = 31;

export const readingsQuerySchema = z
  .object({
    device_id: idSchema,
    metric_key: metricKeySchema.optional(),
    /** A relative period in the organisation timezone, or "custom" with from/to. */
    time_range: z.enum(timeRanges).default("custom"),
    from: timestampSchema.optional(),
    to: timestampSchema.optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
    cursor: z.string().max(200).optional(),
  })
  .strict()
  .refine(
    ({ time_range, from, to }) =>
      time_range !== "custom" ||
      (!!from && !!to && new Date(from) < new Date(to)),
    { message: "A custom range needs `from` earlier than `to`" },
  );

export const readingSchema = z.object({
  device_id: z.string(),
  metric_key: z.string(),
  timestamp: z.coerce.date(),
  value: z.union([z.number(), z.string(), z.boolean()]),
});

export const readingsPageSchema = z.object({
  range: z.object({ from: z.coerce.date(), to: z.coerce.date() }),
  readings: z.array(readingSchema),
  /** Pass back as `cursor` for the next (older) page; null when there are no more. */
  next_cursor: z.string().nullable(),
});

export const completeWhatsappLinkSchema = z
  .object({
    code: z.string().trim().min(4).max(40),
    /** E.164 without the plus sign, as WhatsApp reports it (e.g. "919876543210"). */
    phone_number: z.string().regex(/^[1-9]\d{6,14}$/),
  })
  .strict();

export const whatsappLinkResultSchema = z.object({
  grant_id: z.string(),
  /** Returned once. Vera stores it encrypted; the main server keeps only its hash. */
  grant_token: z.string(),
  user_id: z.string(),
  default_organisation_id: z.string().nullable(),
});

export type OrganisationAccess = z.infer<typeof organisationAccessSchema>;
export type IntegrationMe = z.infer<typeof integrationMeSchema>;
export type ScopedDeviceList = z.infer<typeof scopedDeviceListSchema>;
export type ReadingsPage = z.infer<typeof readingsPageSchema>;
export type WhatsappLinkResult = z.infer<typeof whatsappLinkResultSchema>;
