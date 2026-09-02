import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { bearer, organization } from "better-auth/plugins";
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
