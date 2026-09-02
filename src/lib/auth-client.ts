import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      teams: {
        enabled: true,
      },
    }),
  ],
  fetchOptions: {
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken) {
        localStorage.setItem("bearer_token", authToken);
      }
    },
    auth: {
      type: "Bearer",
      token: () =>
        (typeof window !== "undefined" &&
          localStorage.getItem("bearer_token")) ||
        "",
    },
  },
});

export const { signIn, signOut, useSession } = authClient;
