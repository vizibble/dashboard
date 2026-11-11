import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Vera's own database. It holds AI-integration state only: who is linked, what was said,
 * which tools ran. Telemetry, devices and memberships stay in the main application.
 */

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

/** A WhatsApp number linked to a Vizibble user through a main-server grant. */
export const externalIdentity = pgTable(
  "external_identities",
  {
    id: text("id").primaryKey(),
    channel: text("channel").notNull(),
    // HMAC of the E.164 number: lookups without storing it in clear.
    externalIdHash: text("external_id_hash").notNull(),
    // Needed to reply; AES-256-GCM.
    externalIdEncrypted: text("external_id_encrypted").notNull(),
    userId: text("user_id").notNull(),
    grantId: text("grant_id").notNull(),
    // The main server stores only a hash; Vera keeps it encrypted to present it.
    grantTokenEncrypted: text("grant_token_encrypted").notNull(),
    defaultOrganisationId: text("default_organisation_id"),
    // Organisation the user is currently asking about; re-validated on every call.
    activeOrganisationId: text("active_organisation_id"),
    linkedAt: createdAt(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "external_identities_channel_check",
      sql`${table.channel} in ('whatsapp')`,
    ),
    uniqueIndex("external_identities_live_unique")
      .on(table.channel, table.externalIdHash)
      .where(sql`${table.revokedAt} is null`),
    index("external_identities_user_idx").on(table.userId),
  ],
);

export const conversation = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    channel: text("channel").notNull(),
    externalIdentityId: text("external_identity_id").references(
      () => externalIdentity.id,
      { onDelete: "set null" },
    ),
    userId: text("user_id").notNull(),
    organisationId: text("organisation_id"),
    createdAt: createdAt(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("conversations_channel_check", sql`${table.channel} in ('whatsapp')`),
    index("conversations_identity_idx").on(
      table.externalIdentityId,
      table.lastMessageAt,
    ),
  ],
);

export const message = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    // WhatsApp message id (wamid) of the inbound or outbound message.
    externalMessageId: text("external_message_id"),
    deliveryStatus: text("delivery_status"),
    provider: text("provider"),
    model: text("model"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    createdAt: createdAt(),
  },
  (table) => [
    check("messages_role_check", sql`${table.role} in ('user', 'assistant')`),
    index("messages_conversation_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    uniqueIndex("messages_external_message_unique")
      .on(table.externalMessageId)
      .where(sql`${table.externalMessageId} is not null`),
  ],
);

/** Audit trail of every tool execution, from any channel. Inputs are not stored. */
export const toolCall = pgTable(
  "tool_calls",
  {
    id: text("id").primaryKey(),
    channel: text("channel").notNull(),
    conversationId: text("conversation_id").references(() => conversation.id, {
      onDelete: "set null",
    }),
    requestId: text("request_id"),
    userId: text("user_id").notNull(),
    organisationId: text("organisation_id"),
    clientId: text("client_id"),
    toolName: text("tool_name").notNull(),
    status: text("status").notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms").notNull(),
    resultBytes: integer("result_bytes"),
    createdAt: createdAt(),
  },
  (table) => [
    check(
      "tool_calls_channel_check",
      sql`${table.channel} in ('mcp', 'whatsapp')`,
    ),
    check("tool_calls_status_check", sql`${table.status} in ('ok', 'error')`),
    index("tool_calls_user_created_idx").on(table.userId, table.createdAt),
    index("tool_calls_created_idx").on(table.createdAt),
  ],
);

/** Every WhatsApp webhook entry, deduplicated by Meta's id before any processing. */
export const webhookEvent = pgTable(
  "webhook_events",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull(),
    kind: text("kind").notNull(),
    // wamid for messages and statuses (a status shares its message's wamid, so kind is part of the key).
    externalId: text("external_id").notNull(),
    messageType: text("message_type"),
    status: text("status").notNull().default("received"),
    attempts: integer("attempts").default(0).notNull(),
    lastError: text("last_error"),
    receivedAt: createdAt(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "webhook_events_kind_check",
      sql`${table.kind} in ('message', 'status')`,
    ),
    check(
      "webhook_events_status_check",
      sql`${table.status} in ('received', 'processed', 'ignored', 'failed')`,
    ),
    uniqueIndex("webhook_events_source_kind_external_unique").on(
      table.source,
      table.kind,
      table.externalId,
    ),
    index("webhook_events_received_idx").on(table.receivedAt),
  ],
);

/**
 * A change the assistant proposed on WhatsApp and is waiting for the user to approve.
 * Holds the paused agent run (encrypted: it contains conversation text, never credentials).
 * One per conversation; a newer proposal replaces it.
 */
export const pendingApproval = pgTable(
  "pending_approvals",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(),
    stateEncrypted: text("state_encrypted").notNull(),
    createdAt: createdAt(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("pending_approvals_conversation_unique").on(
      table.conversationId,
    ),
  ],
);
