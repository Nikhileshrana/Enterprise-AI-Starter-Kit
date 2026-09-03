import "server-only";

import { cacheLife } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { ensureDbReady } from "@/lib/db/mongodb";
import type { CurrentUser, Session } from "@/lib/types";

/**
 * Request-time session for Cache Components (`use cache: private`).
 * @see https://nextjs.org/docs/app/guides/authentication-with-cache-components
 */
export async function getCurrentSession(): Promise<Session | null> {
  "use cache: private";
  cacheLife("minutes");

  await ensureDbReady();

  return auth.api.getSession({
    headers: await headers(),
  });
}

/** Narrow user for Server Components — keep behind `<Suspense>`. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getCurrentSession();
  if (!session) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    image: session.user.image,
  };
}
