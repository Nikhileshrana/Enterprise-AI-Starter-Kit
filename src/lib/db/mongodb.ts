import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { MongoClient, type MongoClientOptions, ObjectId } from "mongodb";
import { ensureAuthIndexes } from "@/lib/auth/indexes";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set");
}

/**
 * MongoDB client for Better Auth + app data on Vercel Fluid Compute.
 * @see https://www.better-auth.com/docs/adapters/mongo
 * @see https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package#attachdatabasepool
 */
const options: MongoClientOptions = {
  appName: "starter-kit",
  maxIdleTimeMS: 60_000,
  maxPoolSize: 10,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 15_000,
  socketTimeoutMS: 45_000,
};

const client = new MongoClient(uri, options);

// Release idle connections before the function suspends (Vercel Fluid Compute).
attachDatabasePool(client);

const dbName = process.env.DB_NAME;
if (!dbName) {
  throw new Error("DB_NAME environment variable is not set");
}

/** Centralized MongoDB collection names for the application */
export const COLLECTIONS = {
  // Chat Conversations
  CHAT_CONVERSATIONS: "chat_conversations",

  // Better Auth Core
  USER: "user",
  ACCOUNT: "account",
  SESSION: "session",
  VERIFICATION: "verification",
  RATE_LIMIT: "rateLimit",

  // Better Auth Organization Plugin
  ORGANIZATION: "organization",
  MEMBER: "member",
  INVITATION: "invitation",
} as const;

export const DB_NAME = dbName;

/** Shared DB handle — Better Auth and App collections live here */
export const db = client.db(dbName);

/** 24-char hex Mongo id. */
export function isId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

/**
 * Match an id whether Mongo stored it as ObjectId or hex string.
 * Use in filters: `{ userId: matchId(userId) }`
 */
export function matchId(id: string) {
  if (!isId(id)) return id;
  return { $in: [new ObjectId(id), id] as const };
}

/** Expand ids for `$in` queries. */
export function matchIds(ids: string[]) {
  return ids.flatMap((id) => (isId(id) ? [new ObjectId(id), id] : [id]));
}

let connectPromise: Promise<void> | null = null;
let indexesScheduled = false;

async function connectWithRetry(maxAttempts = 3): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await client.connect();
      await db.command({ ping: 1 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
      }
    }
  }

  throw lastError;
}

function scheduleAuthIndexes() {
  if (indexesScheduled) return;
  indexesScheduled = true;

  // Fire-and-forget — do not use after() (requires a request scope).
  void ensureAuthIndexes(db).catch((error) => {
    indexesScheduled = false;
    console.error("[mongodb] Failed to ensure auth indexes:", error);
  });
}

/**
 * Ensure MongoDB is connected before auth or DB operations.
 * Index creation runs in the background so login is not blocked.
 * @see https://www.better-auth.com/docs/guides/optimizing-for-performance
 */
export function ensureDbReady(): Promise<void> {
  if (!connectPromise) {
    connectPromise = connectWithRetry()
      .then(() => {
        scheduleAuthIndexes();
      })
      .catch((error) => {
        connectPromise = null;
        throw error;
      });
  }

  return connectPromise;
}

// Export a module-scoped MongoClient so it can be shared across functions.
export default client;
