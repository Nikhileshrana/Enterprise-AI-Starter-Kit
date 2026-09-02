import { betterAuth } from "better-auth/minimal";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { bearer, organization } from "better-auth/plugins";
import { waitUntil } from "@vercel/functions";
import client, { db } from "@/lib/mongodb";

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    // Optional: if you don't provide a client, database transactions won't be enabled.
    client,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes — avoids a DB hit on every getSession
    },
  },
  // memory storage is per-instance and breaks under serverless scale
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    storage: "database",
  },
  advanced: {
    database: {
      joins: true, // Mongo adapter supports joins since Better Auth 1.4
    },
    // Defer non-critical work after the response on Vercel
    backgroundTasks: {
      handler: waitUntil,
    },
  },
  plugins: [
    bearer(),
    organization({
      teams: {
        enabled: true,
      },
    }),
    nextCookies(), // must be last — sets cookies from server actions / RSC auth calls
  ],
});

export type Session = typeof auth.$Infer.Session;
