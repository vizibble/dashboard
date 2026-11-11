import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";

import { env } from "@/config/env";
import { database } from "@/db/client";
import {
  conversation,
  externalIdentity,
  message,
  pendingApproval,
} from "@/db/schema";
import { decrypt, encrypt, hashIdentifier } from "@/lib/crypto";

/** A new conversation starts after this much silence, so old context doesn't leak in. */
const CONVERSATION_IDLE_MS = 12 * 60 * 60 * 1000;
const HISTORY_MESSAGES = 10;

export type LinkedIdentity = {
  id: string;
  userId: string;
  grantToken: string;
  defaultOrganisationId: string | null;
  activeOrganisationId: string | null;
};

function phoneHash(phone: string) {
  return hashIdentifier(`whatsapp:${phone}`, env().VERA_ENCRYPTION_KEY);
}

export async function findLinkedIdentity(
  phone: string,
): Promise<LinkedIdentity | null> {
  const [row] = await database()
    .select()
    .from(externalIdentity)
    .where(
      and(
        eq(externalIdentity.channel, "whatsapp"),
        eq(externalIdentity.externalIdHash, phoneHash(phone)),
        isNull(externalIdentity.revokedAt),
      ),
    )
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId,
    grantToken: decrypt(row.grantTokenEncrypted, env().VERA_ENCRYPTION_KEY),
    defaultOrganisationId: row.defaultOrganisationId,
    activeOrganisationId: row.activeOrganisationId,
  };
}

/** Stores a new link, replacing any earlier one for the same number. */
export async function saveLinkedIdentity(
  phone: string,
  grant: {
    grantId: string;
    grantToken: string;
    userId: string;
    defaultOrganisationId: string | null;
  },
) {
  const key = env().VERA_ENCRYPTION_KEY;
  await database().transaction(async (tx) => {
    await tx
      .update(externalIdentity)
      .set({ revokedAt: sql`now()` })
      .where(
        and(
          eq(externalIdentity.channel, "whatsapp"),
          eq(externalIdentity.externalIdHash, phoneHash(phone)),
          isNull(externalIdentity.revokedAt),
        ),
      );
    await tx.insert(externalIdentity).values({
      id: crypto.randomUUID(),
      channel: "whatsapp",
      externalIdHash: phoneHash(phone),
      externalIdEncrypted: encrypt(phone, key),
      userId: grant.userId,
      grantId: grant.grantId,
      grantTokenEncrypted: encrypt(grant.grantToken, key),
      defaultOrganisationId: grant.defaultOrganisationId,
      activeOrganisationId: grant.defaultOrganisationId,
    });
  });
}

export async function revokeIdentity(identityId: string) {
  await database()
    .update(externalIdentity)
    .set({ revokedAt: sql`now()` })
    .where(eq(externalIdentity.id, identityId));
}

export async function updateIdentityActivity(
  identityId: string,
  activeOrganisationId: string | null,
) {
  await database()
    .update(externalIdentity)
    .set({ lastSeenAt: sql`now()`, activeOrganisationId })
    .where(eq(externalIdentity.id, identityId));
}

/** The identity's current conversation (or a new one) and its recent turns, oldest first. */
export async function openConversation(identity: LinkedIdentity) {
  const db = database();
  const since = new Date(Date.now() - CONVERSATION_IDLE_MS);
  const [existing] = await db
    .select()
    .from(conversation)
    .where(
      and(
        eq(conversation.externalIdentityId, identity.id),
        gt(conversation.lastMessageAt, since),
      ),
    )
    .orderBy(desc(conversation.lastMessageAt))
    .limit(1);
  const conversationId =
    existing?.id ??
    (
      await db
        .insert(conversation)
        .values({
          id: crypto.randomUUID(),
          channel: "whatsapp",
          externalIdentityId: identity.id,
          userId: identity.userId,
          organisationId: identity.activeOrganisationId,
        })
        .returning({ id: conversation.id })
    )[0]!.id;

  const recent = await db
    .select({ role: message.role, content: message.content })
    .from(message)
    .where(eq(message.conversationId, conversationId))
    .orderBy(desc(message.createdAt))
    .limit(HISTORY_MESSAGES);
  return {
    conversationId,
    history: recent.reverse() as {
      role: "user" | "assistant";
      content: string;
    }[],
  };
}

/** Saves an inbound message once (Meta's id is unique); false when it was already stored. */
export async function saveUserMessage(
  conversationId: string,
  content: string,
  externalMessageId: string,
) {
  const [row] = await database()
    .insert(message)
    .values({
      id: crypto.randomUUID(),
      conversationId,
      role: "user",
      content,
      externalMessageId,
    })
    .onConflictDoNothing()
    .returning({ id: message.id });
  return Boolean(row);
}

export async function saveAssistantMessage(
  conversationId: string,
  values: {
    content: string;
    externalMessageId: string | null;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    organisationId: string | null;
  },
) {
  const db = database();
  await db.insert(message).values({
    id: crypto.randomUUID(),
    conversationId,
    role: "assistant",
    content: values.content,
    externalMessageId: values.externalMessageId || null,
    provider: values.model ? "openai" : null,
    model: values.model ?? null,
    inputTokens: values.inputTokens ?? null,
    outputTokens: values.outputTokens ?? null,
  });
  await db
    .update(conversation)
    .set({ lastMessageAt: sql`now()`, organisationId: values.organisationId })
    .where(eq(conversation.id, conversationId));
}

// --- Changes waiting for the user's YES/NO -----------------------------------------------

const APPROVAL_TTL_MS = 10 * 60 * 1000;

export async function savePendingApproval(
  conversationId: string,
  summary: string,
  state: string,
) {
  const values = {
    summary,
    stateEncrypted: encrypt(state, env().VERA_ENCRYPTION_KEY),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + APPROVAL_TTL_MS),
  };
  await database()
    .insert(pendingApproval)
    .values({ id: crypto.randomUUID(), conversationId, ...values })
    .onConflictDoUpdate({
      target: pendingApproval.conversationId,
      set: values,
    });
}

/** Removes and returns the conversation's live proposal; an expired one is just removed. */
export async function takePendingApproval(conversationId: string) {
  const [row] = await database()
    .delete(pendingApproval)
    .where(eq(pendingApproval.conversationId, conversationId))
    .returning();
  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  return {
    summary: row.summary,
    state: decrypt(row.stateEncrypted, env().VERA_ENCRYPTION_KEY),
  };
}
