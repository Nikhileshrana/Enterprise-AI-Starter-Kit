import { MongoClient, type MongoClientOptions } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";

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

// Export a module-scoped MongoClient so it can be shared across functions.
export default client;
