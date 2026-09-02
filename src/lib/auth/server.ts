import { betterAuth } from "better-auth/minimal";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { bearer, organization } from "better-auth/plugins";
import { waitUntil } from "@vercel/functions";
import client, { db } from "@/lib/db/mongodb";

/**
 * Better Auth + organization plugin.
 * Creator is always `owner` (`creatorRole`).
 * @see https://www.better-auth.com/docs/plugins/organization
 */
export const auth = betterAuth({
  database: mongodbAdapter(db, {
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
      maxAge: 5 * 60,
    },
  },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    storage: "database",
  },
  advanced: {
    database: {
      joins: true,
    },
    backgroundTasks: {
      handler: waitUntil,
    },
  },
  plugins: [
    bearer(),
    organization({
      creatorRole: "owner",
      allowUserToCreateOrganization: true,
      // Pending invites live in Better Auth's `invitation` collection (no custom table).
      invitationExpiresIn: 60 * 60 * 24 * 7,
      cancelPendingInvitationsOnReInvite: true,
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
