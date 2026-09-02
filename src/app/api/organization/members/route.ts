import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  ORGANIZATION_ROLES,
  isOrganizationManager,
  type OrganizationRole,
} from "@/lib/types";

const ALLOWED_ROLES = new Set<string>(ORGANIZATION_ROLES);

/**
 * Direct-add an existing user by email (Better Auth has no email→userId on the client).
 * List / remove / role / leave / delete use authClient.organization.* instead.
 */
export async function POST(request: NextRequest) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
    query: { disableCookieCache: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 400 },
    );
  }

  let activeMember;
  try {
    activeMember = await auth.api.getActiveMember({ headers: requestHeaders });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isOrganizationManager(activeMember?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    role?: string;
  } | null;

  const email = body?.email?.trim().toLowerCase();
  const role = (body?.role?.trim() || "member") as OrganizationRole;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const authCtx = await auth.$context;
  const found = await authCtx.internalAdapter.findUserByEmail(email);
  const userId = found?.user?.id;

  if (!userId) {
    return NextResponse.json(
      {
        error:
          "No account with that email. They must sign in with Google once first.",
      },
      { status: 404 },
    );
  }

  try {
    const member = await auth.api.addMember({
      body: { userId, role, organizationId },
      headers: requestHeaders,
    });
    return NextResponse.json({ member });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not add member";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
