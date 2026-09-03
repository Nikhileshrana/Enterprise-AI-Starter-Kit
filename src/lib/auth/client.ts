import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

/**
 * Cookie session client for Next.js.
 * @see https://www.better-auth.com/docs/integrations/next
 * @see https://www.better-auth.com/docs/plugins/organization
 */
export const authClient = createAuthClient({
  plugins: [organizationClient()],
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signOut, useSession } = authClient;
