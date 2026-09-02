import "server-only";

import { cacheLife } from "next/cache";
import { headers } from "next/headers";
import { auth, type Session } from "@/lib/auth";

/**
 * Request-time session read for Cache Components.
 * Uses `use cache: private` so cookies/headers are allowed and the result
 * stays in the browser cache (never a shared server cache).
 *
 * @see https://nextjs.org/docs/app/guides/authentication-with-cache-components
 */
export async function getCurrentSession(): Promise<Session | null> {
  "use cache: private";
  cacheLife("minutes");

  return auth.api.getSession({
    headers: await headers(),
  });
}

export type CurrentUser = {
  id: string;
  name: string;
  image?: string | null;
};

/**
 * Narrow user for Server Components — avoids exposing full session to clients.
 * Keep calls behind `<Suspense>` when used in pages (Cache Components rule).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getCurrentSession();
  if (!session) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    image: session.user.image,
  };
}
