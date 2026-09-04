/**
 * Warms the MongoDB pool and builds indexes before the first request.
 * `ensureAuthIndexes` is memoized — lazy callers become no-ops after this.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertProductionEnv } = await import("@/lib/env");
  assertProductionEnv();

  try {
    const { ensureDbReady, db } = await import("@/lib/db/mongodb");
    const { ensureAuthIndexes } = await import("@/lib/auth/indexes");
    await ensureDbReady();
    await ensureAuthIndexes(db);
  } catch (error) {
    console.warn("instrumentation.register:", error);
  }
}
