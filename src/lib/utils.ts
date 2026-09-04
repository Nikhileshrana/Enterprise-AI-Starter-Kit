import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Stable keys for skeleton placeholder rows. */
export function placeholderKeys(count: number, prefix = "sk"): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}-${index}`);
}

/** Normalize Mongo ObjectId or string id to hex. */
export function idHex(id: unknown): string {
  if (typeof id === "string") return id;
  if (
    id &&
    typeof id === "object" &&
    "toHexString" in id &&
    typeof id.toHexString === "function"
  ) {
    return (id as { toHexString: () => string }).toHexString();
  }
  return String(id);
}

/** Clamp page/limit for server-driven tables. */
export function pageBounds(page: number, limit: number) {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Math.trunc(limit) || 10));
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}
