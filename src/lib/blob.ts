import "server-only";

/** Blob pathnames are rooted at `{DB_NAME}/…` */
export function getBlobRoot(): string {
  const dbName = process.env.DB_NAME;
  if (!dbName) {
    throw new Error("DB_NAME environment variable is not set");
  }
  return dbName.replace(/^\/+|\/+$/g, "");
}

/** Join relative segments under DB_NAME. Rejects `..` traversal. */
export function toBlobPath(...segments: string[]): string {
  const relative = segments
    .join("/")
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part.length > 0 && part !== "." && part !== "..")
    .join("/");

  if (!relative) {
    throw new Error("Blob pathname must include a file path under DB_NAME");
  }

  return `${getBlobRoot()}/${relative}`;
}

/** Ensure a pathname is inside the DB_NAME folder. */
export function assertBlobPath(pathname: string): string {
  const root = getBlobRoot();
  const normalized = pathname.replace(/^\/+/, "");

  if (normalized !== root && !normalized.startsWith(`${root}/`)) {
    throw new Error(`Blob pathname must start with "${root}/"`);
  }

  if (normalized.includes("..")) {
    throw new Error("Invalid blob pathname");
  }

  return normalized;
}
