/** Shared app types — single source of truth. */

export type OrganizationRole = "owner" | "admin" | "member";

export type Organization = {
  id: string;
  name: string;
  slug: string;
};

export type MemberRow = {
  id: string;
  role: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string | null;
};

export const ORGANIZATION_ROLES = [
  "member",
  "admin",
  "owner",
] as const satisfies readonly OrganizationRole[];

export function roleHas(role: string | null | undefined, target: OrganizationRole) {
  if (!role) return false;
  return role
    .split(",")
    .some((part) => part.trim().toLowerCase() === target);
}

export function isOrganizationManager(role: string | null | undefined) {
  return roleHas(role, "owner") || roleHas(role, "admin");
}
