import type { Db } from "mongodb";
import { COLLECTIONS } from "@/lib/db/mongodb";

/**
 * Recommended Better Auth & App indexes for MongoDB.
 * Idempotent — safe to run on every cold start.
 * @see https://better-auth.com/docs/guides/optimizing-for-performance#recommended-fields-to-index
 */
export async function ensureAuthIndexes(db: Db) {
  await Promise.all([
    // Core
    db.collection(COLLECTIONS.USER).createIndex({ email: 1 }, { unique: true }),
    db.collection(COLLECTIONS.ACCOUNT).createIndex({ userId: 1 }),
    db.collection(COLLECTIONS.SESSION).createIndex({ userId: 1 }),
    db.collection(COLLECTIONS.SESSION).createIndex({ token: 1 }, { unique: true }),
    db.collection(COLLECTIONS.VERIFICATION).createIndex({ identifier: 1 }),

    // Database-backed rate limiting (rateLimit.storage: "database")
    db.collection(COLLECTIONS.RATE_LIMIT).createIndex({ key: 1 }, { unique: true }),

    // Organization plugin
    db.collection(COLLECTIONS.ORGANIZATION).createIndex({ slug: 1 }, { unique: true }),
    db.collection(COLLECTIONS.MEMBER).createIndex({ userId: 1 }),
    db.collection(COLLECTIONS.MEMBER).createIndex({ organizationId: 1 }),
    db
      .collection(COLLECTIONS.MEMBER)
      .createIndex({ organizationId: 1, userId: 1 }, { unique: true }),
    // Organization plugin schema includes invitation even if unused
    db.collection(COLLECTIONS.INVITATION).createIndex({ email: 1 }),
    db.collection(COLLECTIONS.INVITATION).createIndex({ organizationId: 1 }),

    // Chat Conversations (organization-scoped)
    db
      .collection(COLLECTIONS.CHAT_CONVERSATIONS)
      .createIndex({ organizationId: 1, updatedAt: -1 }),
    db
      .collection(COLLECTIONS.CHAT_CONVERSATIONS)
      .createIndex({ id: 1, organizationId: 1 }, { unique: true }),
  ]);
}
