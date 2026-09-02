import type { Db } from "mongodb";

/**
 * Recommended Better Auth indexes for MongoDB.
 * Idempotent — safe to run on every cold start.
 * @see https://better-auth.com/docs/guides/optimizing-for-performance#recommended-fields-to-index
 */
export async function ensureAuthIndexes(db: Db) {
  await Promise.all([
    // Core
    db.collection("user").createIndex({ email: 1 }, { unique: true }),
    db.collection("account").createIndex({ userId: 1 }),
    db.collection("session").createIndex({ userId: 1 }),
    db.collection("session").createIndex({ token: 1 }, { unique: true }),
    db.collection("verification").createIndex({ identifier: 1 }),

    // Database-backed rate limiting (rateLimit.storage: "database")
    db.collection("rateLimit").createIndex({ key: 1 }, { unique: true }),

    // Organization plugin
    db.collection("organization").createIndex({ slug: 1 }, { unique: true }),
    db.collection("member").createIndex({ userId: 1 }),
    db.collection("member").createIndex({ organizationId: 1 }),
    db
      .collection("member")
      .createIndex({ organizationId: 1, userId: 1 }, { unique: true }),
    db.collection("invitation").createIndex({ email: 1 }),
    db.collection("invitation").createIndex({ organizationId: 1 }),

    // Teams (organization plugin with teams.enabled)
    db.collection("team").createIndex({ organizationId: 1 }),
    db.collection("teamMember").createIndex({ teamId: 1 }),
    db.collection("teamMember").createIndex({ userId: 1 }),
    db
      .collection("teamMember")
      .createIndex({ teamId: 1, userId: 1 }, { unique: true }),
  ]);
}
