import type {
  Collection,
  CreateIndexesOptions,
  Db,
  IndexSpecification,
} from "mongodb";
import { COLLECTIONS } from "@/lib/db/mongodb";

/** Mongo auto-name for a key pattern, e.g. { a: 1, b: -1 } → "a_1_b_-1". */
function defaultIndexName(key: IndexSpecification): string {
  return Object.entries(key)
    .map(([field, direction]) => `${field}_${direction}`)
    .join("_");
}

/**
 * createIndex, dropping a same-name/same-key index first when options diverge.
 * Handles MongoDB codes 85 (IndexOptionsConflict) and 86 (IndexKeySpecsConflict).
 */
async function ensureIndex(
  collection: Collection,
  key: IndexSpecification,
  options: CreateIndexesOptions = {},
) {
  try {
    await collection.createIndex(key, options);
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code !== 85 && code !== 86) throw error;

    const name =
      (typeof options.name === "string" && options.name) ||
      defaultIndexName(key);
    await collection.dropIndex(name);
    await collection.createIndex(key, options);
  }
}

let indexesPromise: Promise<void> | null = null;

/**
 * Recommended Better Auth & app indexes for MongoDB.
 * Memoized — safe to call from instrumentation and route handlers.
 * @see https://better-auth.com/docs/guides/optimizing-for-performance#recommended-fields-to-index
 */
export async function ensureAuthIndexes(db: Db) {
  indexesPromise ??= createAuthIndexes(db).catch((error) => {
    indexesPromise = null;
    throw error;
  });
  return indexesPromise;
}

async function createAuthIndexes(db: Db) {
  const tasks = [
    ensureIndex(
      db.collection(COLLECTIONS.USER),
      { email: 1 },
      { unique: true },
    ),
    ensureIndex(db.collection(COLLECTIONS.ACCOUNT), { userId: 1 }),
    ensureIndex(db.collection(COLLECTIONS.SESSION), { userId: 1 }),
    ensureIndex(
      db.collection(COLLECTIONS.SESSION),
      { token: 1 },
      { unique: true },
    ),
    ensureIndex(db.collection(COLLECTIONS.VERIFICATION), { identifier: 1 }),
    ensureIndex(
      db.collection(COLLECTIONS.RATE_LIMIT),
      { key: 1 },
      { unique: true },
    ),
    ensureIndex(
      db.collection(COLLECTIONS.ORGANIZATION),
      { slug: 1 },
      { unique: true },
    ),
    ensureIndex(db.collection(COLLECTIONS.MEMBER), { userId: 1 }),
    ensureIndex(db.collection(COLLECTIONS.MEMBER), { organizationId: 1 }),
    ensureIndex(
      db.collection(COLLECTIONS.MEMBER),
      { organizationId: 1, userId: 1 },
      { unique: true },
    ),
    ensureIndex(db.collection(COLLECTIONS.INVITATION), { email: 1 }),
    ensureIndex(db.collection(COLLECTIONS.INVITATION), { organizationId: 1 }),
    ensureIndex(db.collection(COLLECTIONS.CHAT_CONVERSATIONS), {
      organizationId: 1,
      updatedAt: -1,
    }),
    ensureIndex(
      db.collection(COLLECTIONS.CHAT_CONVERSATIONS),
      { id: 1, organizationId: 1 },
      { unique: true },
    ),
  ];

  await Promise.all(
    tasks.map((task) =>
      task.catch((error) => {
        console.warn("[mongodb] Index creation failed:", error);
      }),
    ),
  );
}
