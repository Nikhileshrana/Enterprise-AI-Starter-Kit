import { upload, type UploadOptions } from "@vercel/blob/client";
import type { PutBlobResult } from "@vercel/blob";

/** Same value as server DB_NAME — required for `{DB_NAME}/…` pathnames. */
function getClientBlobRoot(): string {
  const dbName = process.env.NEXT_PUBLIC_DB_NAME;
  if (!dbName) {
    throw new Error(
      "NEXT_PUBLIC_DB_NAME is not set (must match server DB_NAME)",
    );
  }
  return dbName.replace(/^\/+|\/+$/g, "");
}

/** Build `{DB_NAME}/…` pathname for browser uploads. */
export function toClientBlobPath(...segments: string[]): string {
  const relative = segments
    .join("/")
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part.length > 0 && part !== "." && part !== "..")
    .join("/");

  if (!relative) {
    throw new Error("Blob pathname must include a file path under DB_NAME");
  }

  return `${getClientBlobRoot()}/${relative}`;
}

type UploadBlobOptions = Omit<
  UploadOptions,
  "access" | "handleUploadUrl"
> & {
  /** Relative path under DB_NAME, e.g. `documents/report.pdf` */
  pathname?: string;
  handleUploadUrl?: string;
};

/**
 * Public client upload (browser → Blob). Supports large files (e.g. 300 MB).
 *
 * @see https://vercel.com/docs/vercel-blob/client-upload
 */
export async function uploadBlob(
  file: File,
  options: UploadBlobOptions = {},
): Promise<PutBlobResult> {
  const { pathname: relativePath, handleUploadUrl, ...rest } = options;
  const pathname = relativePath
    ? toClientBlobPath(relativePath)
    : toClientBlobPath(file.name);

  return upload(pathname, file, {
    ...rest,
    access: "public",
    handleUploadUrl: handleUploadUrl ?? "/api/blob/client-upload",
    multipart: rest.multipart ?? true,
  });
}
