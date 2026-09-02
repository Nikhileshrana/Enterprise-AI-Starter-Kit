import { MongoClient, type MongoClientOptions } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";
import { ensureAuthIndexes } from "@/lib/auth/indexes";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set");
}

const options: MongoClientOptions = {
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000,
};

const client = new MongoClient(uri, options);

// Attach the client to ensure proper cleanup on function suspension
attachDatabasePool(client);

const dbName = process.env.DB_NAME;
if (!dbName) {
  throw new Error("DB_NAME environment variable is not set");
}

/** Shared DB handle — Better Auth collections live here */
export const db = client.db(dbName);

// Create recommended indexes once per cold start (createIndex is idempotent)
void ensureAuthIndexes(db).catch((error) => {
  console.error("[mongodb] Failed to ensure auth indexes:", error);
});

// Export a module-scoped MongoClient so it can be shared across functions.
export default client;
