import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

/**
 * Cookie-first client (Next.js / browser sessions).
 * Bearer token is attached only when present — for API clients — so an empty
 * Authorization header never overrides cookie session auth.
 */
export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      teams: {
        enabled: true,
      },
    }),
  ],
  fetchOptions: {
    credentials: "include",
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken && typeof window !== "undefined") {
        localStorage.setItem("bearer_token", authToken);
      }
    },
    onRequest: (ctx) => {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("bearer_token");
      if (token) {
        ctx.headers.set("Authorization", `Bearer ${token}`);
      }
    },
  },
});

export const { signIn, signOut, useSession } = authClient;
