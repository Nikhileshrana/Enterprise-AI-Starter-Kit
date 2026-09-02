import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic auth gate for /protected/*
 * Full session validation still happens in the protected layout.
 * @see https://better-auth.com/docs/integrations/next
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set(
      "callbackURL",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/protected/:path*"],
};
