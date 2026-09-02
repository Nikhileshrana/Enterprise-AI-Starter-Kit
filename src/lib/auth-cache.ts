import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/mongodb";
import { getCurrentSession } from "@/lib/auth-session";

type OrganizationDoc = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: unknown;
  createdAt: Date;
};

type MemberDoc = {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
};

/**
 * Public org lookup by slug — safe to share across users (no session secrets).
 * Invalidate with `updateTag(\`organization:${slug}\`)` or `revalidateTag(...)`.
 */
export async function getCachedOrganizationBySlug(slug: string) {
  "use cache";
  cacheTag("organizations", `organization:${slug}`);
  cacheLife("hours");

  return db.collection<OrganizationDoc>("organization").findOne({ slug });
}

/**
 * Org by id — keyed only by stable id (never put tokens/emails in cache keys).
 */
async function getCachedOrganizationById(organizationId: string) {
  "use cache";
  cacheTag("organizations", `organization:${organizationId}`);
  cacheLife("hours");

  return db
    .collection<OrganizationDoc>("organization")
    .findOne({ id: organizationId });
}

/**
 * Membership for a user+org — keyed by ids only.
 * Kept unexported so callers must go through the session-aware helper below.
 */
async function getCachedMembership(userId: string, organizationId: string) {
  "use cache";
  cacheTag(
    "members",
    `member:${userId}:${organizationId}`,
    `organization:${organizationId}`,
  );
  cacheLife("minutes");

  return db.collection<MemberDoc>("member").findOne({
    userId,
    organizationId,
  });
}

/**
 * Session-derived active organization (DAL pattern).
 * Resolves the user from the private session cache, then hits shared `use cache`.
 *
 * @see https://nextjs.org/docs/app/guides/authentication-with-cache-components#step-4-cache-session-derived-data
 */
export async function getActiveOrganization() {
  const session = await getCurrentSession();
  if (!session) return null;

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) return null;

  const [organization, membership] = await Promise.all([
    getCachedOrganizationById(organizationId),
    getCachedMembership(session.user.id, organizationId),
  ]);

  if (!organization || !membership) return null;

  return { organization, membership };
}
