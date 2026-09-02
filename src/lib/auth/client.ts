import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

const BEARER_TOKEN_KEY = "bearer_token";

/** Drop stale bearer auth so a new login is not overridden by the previous user. */
export function clearBearerToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(BEARER_TOKEN_KEY);
  }
}

/**
 * Cookie-first client (Next.js / browser sessions).
 * Bearer token is optional — for API clients only. It must be cleared on sign-out.
 */
export const authClient = createAuthClient({
  plugins: [organizationClient()],
  fetchOptions: {
    credentials: "include",
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken && typeof window !== "undefined") {
        localStorage.setItem(BEARER_TOKEN_KEY, authToken);
      }
    },
    onRequest: (ctx) => {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem(BEARER_TOKEN_KEY);
      if (token) {
        ctx.headers.set("Authorization", `Bearer ${token}`);
      }
    },
  },
});

export const { signIn, useSession } = authClient;

export async function signOut(
  ...args: Parameters<typeof authClient.signOut>
) {
  clearBearerToken();
  try {
    return await authClient.signOut(...args);
  } finally {
    clearBearerToken();
  }
}

/** Fresh session read — bypass Better Auth cookie cache after auth changes. */
export function getFreshSession() {
  return authClient.getSession({
    query: { disableCookieCache: true },
  });
}
