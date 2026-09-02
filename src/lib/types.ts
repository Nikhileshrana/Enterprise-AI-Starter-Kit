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
  createdAt: Date | null;
};

export type InvitationRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date | null;
};

export const ORGANIZATION_ROLES = [
  "member",
  "admin",
  "owner",
] as const satisfies readonly OrganizationRole[];

/** Normalize API / DB date values to `Date`. */
export function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function roleHas(role: string | null | undefined, target: OrganizationRole) {
  if (!role) return false;
  return role
    .split(",")
    .some((part) => part.trim().toLowerCase() === target);
}

export function isOrganizationManager(role: string | null | undefined) {
  return roleHas(role, "owner") || roleHas(role, "admin");
}
