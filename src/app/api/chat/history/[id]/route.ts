import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { deleteConversation, getConversation } from "@/lib/db/chat";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId =
    session.session.activeOrganizationId || `user_${session.user.id}`;

  try {
    const conversation = await getConversation(params.id, organizationId);
    if (!conversation) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    return Response.json({ conversation });
  } catch (error) {
    console.error("[api/chat/history/[id] GET] Error:", error);
    return Response.json(
      { error: "Failed to fetch conversation" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId =
    session.session.activeOrganizationId || `user_${session.user.id}`;

  try {
    const success = await deleteConversation(params.id, organizationId);
    if (!success) {
      return Response.json(
        { error: "Conversation not found or could not be deleted" },
        { status: 404 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("[api/chat/history/[id] DELETE] Error:", error);
    return Response.json(
      { error: "Failed to delete conversation" },
      { status: 500 },
    );
  }
}
