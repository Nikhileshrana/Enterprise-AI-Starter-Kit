import { db, COLLECTIONS } from "@/lib/db/mongodb";
import type { StarterKitUIMessage } from "@/lib/types";

export interface ChatConversation {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  messages: StarterKitUIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatConversationMeta {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Strip file/binary attachments from UI messages before saving to DB.
 * Keeps text parts, reasoning parts, and string content.
 */
export function sanitizeMessagesForHistory(
  messages: StarterKitUIMessage[],
): StarterKitUIMessage[] {
  return messages.map((msg) => {
    if (!Array.isArray(msg.parts)) {
      return msg;
    }

    const textOnlyParts = msg.parts.filter((part) => {
      // Filter out file attachments (images, pdfs, csvs)
      if (part.type === "file") return false;
      return true;
    });

    return {
      ...msg,
      parts: textOnlyParts as StarterKitUIMessage["parts"],
    };
  });
}

/** Generate a concise title from the first user prompt. */
export function generateChatTitle(messages: StarterKitUIMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (!firstUserMsg) return "New Conversation";

  let text = "";
  if (Array.isArray(firstUserMsg.parts)) {
    for (const part of firstUserMsg.parts) {
      if (part.type === "text" && part.text) {
        text += part.text + " ";
      }
    }
  }

  text = text.trim();
  if (!text) return "New Conversation";

  // Limit to 45 characters
  return text.length > 45 ? `${text.slice(0, 42)}...` : text;
}

/** List all conversations for an organization, ordered by most recently updated. */
export async function listOrgConversations(
  organizationId: string,
): Promise<ChatConversationMeta[]> {
  const collection = db.collection(COLLECTIONS.CHAT_CONVERSATIONS);
  const docs = await collection
    .find({ organizationId })
    .project({ id: 1, organizationId: 1, userId: 1, title: 1, createdAt: 1, updatedAt: 1 })
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();

  return docs.map((doc) => ({
    id: doc.id || doc._id.toString(),
    organizationId: doc.organizationId,
    userId: doc.userId,
    title: doc.title || "New Conversation",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));
}

/** Fetch a single conversation with full messages for an organization. */
export async function getConversation(
  id: string,
  organizationId: string,
): Promise<ChatConversation | null> {
  const collection = db.collection(COLLECTIONS.CHAT_CONVERSATIONS);
  const doc = await collection.findOne({ id, organizationId });

  if (!doc) return null;

  return {
    id: doc.id || doc._id.toString(),
    organizationId: doc.organizationId,
    userId: doc.userId,
    title: doc.title || "New Conversation",
    messages: doc.messages || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/** Save or update a conversation with text-only message sanitization. */
export async function saveConversation(params: {
  id: string;
  organizationId: string;
  userId: string;
  messages: StarterKitUIMessage[];
  title?: string;
}): Promise<ChatConversation> {
  const collection = db.collection(COLLECTIONS.CHAT_CONVERSATIONS);
  const now = new Date();

  const sanitized = sanitizeMessagesForHistory(params.messages);
  const title =
    params.title || generateChatTitle(sanitized);

  await collection.updateOne(
    { id: params.id, organizationId: params.organizationId },
    {
      $set: {
        id: params.id,
        organizationId: params.organizationId,
        userId: params.userId,
        title,
        messages: sanitized,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  return {
    id: params.id,
    organizationId: params.organizationId,
    userId: params.userId,
    title,
    messages: sanitized,
    createdAt: now,
    updatedAt: now,
  };
}

/** Delete a conversation. */
export async function deleteConversation(
  id: string,
  organizationId: string,
): Promise<boolean> {
  const collection = db.collection(COLLECTIONS.CHAT_CONVERSATIONS);
  const res = await collection.deleteOne({ id, organizationId });
  return res.deletedCount > 0;
}
