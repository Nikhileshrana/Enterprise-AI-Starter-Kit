/** Auth session / user shapes. */

export type Session = typeof import("@/lib/auth/server").auth.$Infer.Session;

export type CurrentUser = {
  id: string;
  name: string;
  image?: string | null;
};

export type NavUserData = {
  name: string;
  email: string;
  image?: string | null;
};

export type NavUserProps = {
  user: NavUserData;
  variant?: "sidebar" | "header";
};
