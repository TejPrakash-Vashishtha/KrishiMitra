// ============================================================
// Customer chat data layer — Phase 5 (real chat, DB-backed)
//
// Messages live in the chat_messages table (migration 008) so
// conversations persist and work on both sides without a socket
// server. Polling keeps both ends in sync every few seconds.
// Falls back to localStorage when Supabase is not configured.
// ============================================================
import { supabase, isSupabaseConfigured } from "./supabaseClient";

export interface ChatMessage {
  id: string;
  conversationKey: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

/** Stable conversation key for a pair of users (order-independent). */
export function conversationKey(a: string, b: string): string {
  return [a, b].sort().join("__");
}

const LS_KEY = "agn_customer_chats";

function readLS(): ChatMessage[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLS(all: ChatMessage[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(all.slice(-500)));
  } catch {
    // ignore quota errors
  }
}

export async function fetchMessages(key: string): Promise<ChatMessage[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_key", key)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!error && data) {
        return (data as any[]).map((m) => ({
          id: String(m.id),
          conversationKey: m.conversation_key,
          senderId: m.sender_id,
          senderName: m.sender_name || "",
          content: m.content,
          createdAt: m.created_at,
        }));
      }
    } catch {
      // fall through to localStorage
    }
  }
  return readLS().filter((m) => m.conversationKey === key);
}

export async function sendMessage(
  key: string,
  sender: { id: string; name: string },
  content: string
): Promise<ChatMessage | null> {
  const msg: ChatMessage = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    conversationKey: key,
    senderId: sender.id,
    senderName: sender.name,
    content,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          conversation_key: key,
          sender_id: sender.id,
          sender_name: sender.name,
          content,
        })
        .select()
        .single();
      if (!error && data) {
        return {
          id: String(data.id),
          conversationKey: data.conversation_key,
          senderId: data.sender_id,
          senderName: data.sender_name || "",
          content: data.content,
          createdAt: data.created_at,
        };
      }
    } catch {
      // fall through to localStorage
    }
  }

  const all = readLS();
  all.push(msg);
  writeLS(all);
  return msg;
}
