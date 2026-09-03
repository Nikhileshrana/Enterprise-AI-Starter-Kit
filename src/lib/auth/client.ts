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

/**
 * Hard navigation after org create/switch so every route remounts with the
 * new active organization (router.refresh() leaves client state stale).
 */
export function hardResetForOrganization(path?: string) {
  window.location.assign(
    path ?? `${window.location.pathname}${window.location.search}`,
  );
}
