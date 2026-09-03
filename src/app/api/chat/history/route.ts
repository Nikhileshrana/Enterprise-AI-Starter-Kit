import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import {
  listOrgConversations,
  saveConversation,
} from "@/lib/db/chat";
import { ensureDbReady } from "@/lib/db/mongodb";
import type { StarterKitUIMessage } from "@/lib/types";

export async function GET() {
  await ensureDbReady();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId =
    session.session.activeOrganizationId || `user_${session.user.id}`;

  try {
    const conversations = await listOrgConversations(organizationId);
    return Response.json({ conversations });
  } catch (error) {
    console.error("[api/chat/history GET] Error:", error);
    return Response.json(
      { error: "Failed to list conversations" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  await ensureDbReady();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId =
    session.session.activeOrganizationId || `user_${session.user.id}`;

  try {
    const body = (await request.json()) as {
      id: string;
      messages: StarterKitUIMessage[];
      title?: string;
    };

    if (!body.id || !Array.isArray(body.messages)) {
      return Response.json(
        { error: "Invalid payload: 'id' and 'messages' array required" },
        { status: 400 },
      );
    }

    const saved = await saveConversation({
      id: body.id,
      organizationId,
      userId: session.user.id,
      messages: body.messages,
      title: body.title,
    });

    return Response.json({ conversation: saved });
  } catch (error) {
    console.error("[api/chat/history POST] Error:", error);
    return Response.json(
      { error: "Failed to save conversation" },
      { status: 500 },
    );
  }
}
