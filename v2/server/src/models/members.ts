import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { member } from "@/db/schema";

/** The user's membership in an organisation, or undefined when they aren't a member. */
export async function findMembershipQuery(
  organisationId: string,
  userId: string,
) {
  const [membership] = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(eq(member.organizationId, organisationId), eq(member.userId, userId)),
    )
    .limit(1);
  return membership;
}
