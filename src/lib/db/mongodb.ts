import { attachDatabasePool } from "@vercel/functions";
import { MongoClient, type MongoClientOptions } from "mongodb";
import { after } from "next/server";
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

/** Shared DB handle — Better Auth and App collections live here */
export const db = client.db(dbName);

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

  // Non-blocking index setup — do not compete with first auth/DB request.
  // Next.js 16+: prefer after() over waitUntil for post-response work.
  after(async () => {
    try {
      await ensureAuthIndexes(db);
    } catch (error) {
      indexesScheduled = false;
      console.error("[mongodb] Failed to ensure auth indexes:", error);
    }
  });
}

/**
 * Ensure MongoDB is connected before auth or DB operations.
 * Index creation runs after the response via after() so login is not blocked.
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
