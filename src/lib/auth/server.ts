import { betterAuth } from "better-auth/minimal";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins/organization";
import { waitUntil } from "@vercel/functions";
import { getTrustedOrigins } from "@/lib/env";
import client, { db } from "@/lib/db/mongodb";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Better Auth (MongoDB) + organization plugin.
 * Cookie sessions only (Next.js). Creator role is `owner`.
 * @see https://www.better-auth.com/docs/plugins/organization
 * @see https://www.better-auth.com/docs/integrations/next
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: getTrustedOrigins(),
  database: mongodbAdapter(db, { client }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    // Cookie cache reduces DB session reads. For multi-region / 10M+ sessions,
    // add secondaryStorage (Redis) — see Better Auth session docs.
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
    useSecureCookies: isProduction,
    database: {
      joins: true,
    },
    backgroundTasks: {
      handler: waitUntil,
    },
  },
  plugins: [
    organization({
      creatorRole: "owner",
      allowUserToCreateOrganization: true,
      invitationExpiresIn: 60 * 60 * 24 * 7,
      cancelPendingInvitationsOnReInvite: true,
      // Invitation emails optional — pending invites work via listUserInvitations + accept.
    }),
    // Must be last so Set-Cookie is applied in Next.js route handlers.
    nextCookies(),
  ],
});
