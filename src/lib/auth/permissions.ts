/**
 * Client-side permission helpers using Better Auth organization AC.
 * @see https://www.better-auth.com/docs/plugins/organization#permissions
 */
import { authClient } from "@/lib/auth/client";
import type { OrganizationRole } from "@/lib/types";

function rolesOf(role: string | null | undefined): OrganizationRole[] {
  if (!role) return [];
  return role
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean) as OrganizationRole[];
}

function anyRoleHasPermission(
  role: string | null | undefined,
  permissions: Parameters<
    typeof authClient.organization.checkRolePermission
  >[0]["permissions"],
) {
  return rolesOf(role).some((r) =>
    authClient.organization.checkRolePermission({
      role: r,
      permissions,
    }),
  );
}

/** Owner + admin can invite / manage members (default BA statements). */
export function canManageMembers(role: string | null | undefined) {
  return anyRoleHasPermission(role, {
    invitation: ["create"],
    member: ["update"],
  });
}

/** Only owner can delete the organization (default BA statements). */
export function canDeleteOrganization(role: string | null | undefined) {
  return anyRoleHasPermission(role, {
    organization: ["delete"],
  });
}

export function hasOwnerRole(role: string | null | undefined) {
  return rolesOf(role).includes("owner");
}
