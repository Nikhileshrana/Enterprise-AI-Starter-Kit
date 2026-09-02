import "server-only";

import { del } from "@vercel/blob";
import { assertBlobPath, toBlobPath } from "@/lib/blob/path";

/**
 * Delete a blob by its URL (or relative/pathname under DB_NAME/).
 *
 * @see https://vercel.com/docs/vercel-blob/using-blob-sdk#del
 */
export async function deleteBlob(urlOrPathname: string): Promise<void> {
  const value = urlOrPathname.trim();
  if (!value) {
    throw new Error("Missing blob url or pathname");
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    const pathname = decodeURIComponent(
      new URL(value).pathname.replace(/^\/+/, ""),
    );
    assertBlobPath(pathname);
    await del(value);
    return;
  }

  await del(assertBlobPath(toBlobPath(value)));
}
