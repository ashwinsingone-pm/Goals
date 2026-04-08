import { db } from "@/lib/db";

/**
 * Resolves the active tenantId for a given userId.
 * Returns null if the user has no active membership.
 */
export async function getTenantId(userId: string): Promise<string | null> {
  const membership = await db.membership.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "asc" },
  });
  return membership?.tenantId ?? null;
}
