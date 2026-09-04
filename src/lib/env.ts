import "server-only";

const REQUIRED_IN_PRODUCTION = [
  "MONGODB_URI",
  "DB_NAME",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

/** Comma-separated origins for Better Auth CSRF checks (e.g. preview URLs). */
export function getTrustedOrigins(): string[] | undefined {
  const raw = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (!raw?.trim()) return undefined;
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/** Warn once at startup when production env is incomplete. */
export function assertProductionEnv() {
  if (process.env.NODE_ENV !== "production") return;

  const missing = REQUIRED_IN_PRODUCTION.filter(
    (key) => !process.env[key]?.trim(),
  );

  if (missing.length > 0) {
    console.warn(
      `[env] Missing production environment variables: ${missing.join(", ")}`,
    );
  }

  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret && secret.length < 32) {
    console.warn(
      "[env] BETTER_AUTH_SECRET should be at least 32 characters in production.",
    );
  }
}
