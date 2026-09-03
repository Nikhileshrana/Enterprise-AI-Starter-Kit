import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/server";
import { ensureDbReady } from "@/lib/db/mongodb";

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth);

export async function GET(request: Request) {
  await ensureDbReady();
  return authGET(request);
}

export async function POST(request: Request) {
  await ensureDbReady();
  return authPOST(request);
}
