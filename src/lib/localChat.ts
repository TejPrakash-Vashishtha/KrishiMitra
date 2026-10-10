// ============================================================
// Local chat store — keeps the Messages page (/chat) usable when
// the socket/REST backend is not deployed (the app ships as a
// static bundle). Conversations and messages persist in
// localStorage so a reload keeps the thread, and the built-in
// KrishiMitra AI conversation gives the farmer someone to talk to
// even with no other user online.
//
// When a real backend IS available, its conversations/messages are
// merged in front of these, so nothing here overrides the server.
// ============================================================

export interface StoredMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface StoredConversation {
  id: string;
  isBot?: boolean;
  user1?: { id: string; name: string; role?: string };
  user2?: { id: string; name: string; role?: string };
  updatedAt?: string;
}

export const AI_BOT_ID = "krishimitra-ai-assistant";

const CONVS_KEY = "km_chat_conversations_v1";
const MSGS_KEY = "km_chat_messages_v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / private mode — the in-memory state still works for this session
  }
}

/** The always-available AI conversation for this farmer. */
export function aiConversation(myId: string, myName: string): StoredConversation {
  return {
    id: AI_BOT_ID,
    isBot: true,
    user1: { id: AI_BOT_ID, name: "KrishiMitra AI Assistant", role: "AI" },
    user2: { id: myId, name: myName, role: "FARMER" },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Stored conversations with the AI assistant conversation guaranteed to
 * exist (and seeded with a greeting on first use).
 */
export function ensureConversations(
  myId: string = "local-user",
  myName: string = "You"
): StoredConversation[] {
  const convs = read<StoredConversation[]>(CONVS_KEY, []);
  if (!convs.some((c) => c.id === AI_BOT_ID)) {
    convs.unshift(aiConversation(myId, myName));
    write(CONVS_KEY, convs);
    if (!loadMessages(AI_BOT_ID).length) {
      appendMessage(AI_BOT_ID, {
        id: `bot-greeting-${Date.now()}`,
        senderId: AI_BOT_ID,
        content:
          "Namaste! 🙏 I'm the KrishiMitra AI assistant. Ask me anything about farming — crops, fertilizers, pests, weather, irrigation or mandi prices.",
        createdAt: new Date().toISOString(),
      });
    }
  }
  return convs;
}

export function loadMessages(conversationId: string): StoredMessage[] {
  const all = read<Record<string, StoredMessage[]>>(MSGS_KEY, {});
  return all[conversationId] || [];
}

/** Persist a message locally and bump the conversation's timestamp. */
export function appendMessage(conversationId: string, message: StoredMessage) {
  const all = read<Record<string, StoredMessage[]>>(MSGS_KEY, {});
  const list = all[conversationId] || [];
  if (!list.some((m) => m.id === message.id)) {
    list.push(message);
    all[conversationId] = list;
    write(MSGS_KEY, all);
  }
  const convs = read<StoredConversation[]>(CONVS_KEY, []);
  const idx = convs.findIndex((c) => c.id === conversationId);
  if (idx >= 0) {
    convs[idx] = { ...convs[idx], updatedAt: message.createdAt };
    write(CONVS_KEY, convs);
  }
}
