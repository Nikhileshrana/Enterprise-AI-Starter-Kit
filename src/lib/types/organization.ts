/** Organization domain types. */

export type OrganizationRole = "owner" | "admin" | "member";

export type Organization = {
  id: string;
  name: string;
  slug: string;
};

export const ORGANIZATION_ROLES = [
  "member",
  "admin",
  "owner",
] as const satisfies readonly OrganizationRole[];

export type OrganizationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  required?: boolean;
  onCreated?: (organization: Organization) => void | Promise<void>;
};

export type OrganizationGateProps = {
  userId: string;
};

export type OrganizationSwitcherProps = {
  variant?: "sidebar" | "logo";
};
