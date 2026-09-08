import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageCircle, Send, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import VoiceButton from "../components/voice/VoiceButton";
import api from "../services/api";

export default function ChatPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [searchParams] = useSearchParams();
  const withUserId = searchParams.get("with");

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/chat/conversations").then((res) => {
      if (res.data.success) {
        setConversations(res.data.conversations || []);
        if (res.data.conversations?.length > 0 && !activeConv) {
          setActiveConv(res.data.conversations[0]);
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (withUserId) {
      api.post("/chat/conversations", { recipientId: withUserId }).then((res) => {
        if (res.data.success) {
          setActiveConv(res.data.conversation);
          setConversations((prev) => {
            const exists = prev.some((c) => c.id === res.data.conversation.id);
            return exists ? prev : [res.data.conversation, ...prev];
          });
        }
      });
    }
  }, [withUserId]);

  useEffect(() => {
    if (activeConv) {
      api.get(`/chat/conversations/${activeConv.id}/messages`).then((res) => {
        if (res.data.success) setMessages(res.data.messages || []);
      });
      if (socket) {
        socket.emit("join_room", activeConv.id);
      }
    }
  }, [activeConv, socket]);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (data: any) => {
      if (data.conversationId === activeConv?.id) {
        setMessages((prev) => [...prev, data]);
      }
    };
    socket.on("new_message", onMsg);
    return () => { socket.off("new_message", onMsg); };
  }, [socket, activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConv) return;
    const text = input.trim();
    setInput("");
    if (socket) {
      socket.emit("send_message", {
        conversationId: activeConv.id,
        senderId: user?.id,
        content: text,
      });
    } else {
      await api.post(`/chat/conversations/${activeConv.id}/messages`, { content: text });
      setMessages((prev) => [...prev, { id: Date.now().toString(), senderId: user?.id, content: text, createdAt: new Date().toISOString() }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-8 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row h-[84vh] overflow-hidden">
        <div className="w-full md:w-80 border-r border-slate-200/80 flex flex-col">
          <div className="p-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h1 className="text-base font-bold text-slate-900">Messages</h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
              {conversations.length} Chats
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active conversations yet.
              </div>
            ) : (
              conversations.map((c) => {
                const otherUser = c.user1?.id === user?.id ? c.user2 : c.user1;
                const isActive = activeConv?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConv(c)}
                    className={`w-full p-3.5 text-left flex items-center gap-3 transition-colors ${isActive ? "bg-emerald-50/70" : "hover:bg-slate-50"}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {otherUser?.name || "KrishiMitra User"}
                      </span>
                      <p className="text-xs text-slate-500 truncate">
                        {otherUser?.role === "DEALER" ? "Verified Dealer" : "Farmer"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {activeConv ? (
          <div className="flex-1 flex flex-col h-full bg-slate-50/40">
            <div className="p-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {activeConv.user1?.id === user?.id ? activeConv.user2?.name : activeConv.user1?.name}
                  </h2>
                  <p className="text-[10px] text-emerald-700 font-medium">Active Session</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${msg.senderId === user?.id ? "bg-emerald-600 text-white" : "bg-white border border-slate-200/80 text-slate-800 shadow-sm"}`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <div
                      className={`text-[10px] mt-1 ${msg.senderId === user?.id ? "text-emerald-200 text-right" : "text-slate-400"}`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString().slice(0, 5)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <VoiceButton onTranscript={(text) => setInput((prev) => (prev ? prev + " " + text : text))} />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
            <MessageCircle className="w-12 h-12 mb-2 opacity-40" />
            <p className="text-sm">Select a conversation from the left panel</p>
          </div>
        )}
      </div>
    </div>
  );
}
