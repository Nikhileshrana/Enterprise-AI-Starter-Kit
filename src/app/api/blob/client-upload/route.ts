import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { assertBlobPath } from "@/lib/blob/path";

/**
 * Client upload token exchange only — the file itself never hits this route.
 * Browser uploads directly to private Vercel Blob (supports e.g. 300 MB).
 * Requires BLOB_READ_WRITE_TOKEN.
 *
 * @see https://vercel.com/docs/vercel-blob/client-upload
 * @see https://vercel.com/docs/vercel-blob/private-storage
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        });
        if (!session) {
          throw new Error("Not authenticated");
        }

        assertBlobPath(pathname);

        return {
          addRandomSuffix: true,
          maximumSizeInBytes: 5 * 1024 * 1024 * 1024, // 5 GB
          tokenPayload: JSON.stringify({
            userId: session.user.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Runs on Vercel; locally needs ngrok + VERCEL_BLOB_CALLBACK_URL
        console.log("blob upload completed", blob.pathname, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
