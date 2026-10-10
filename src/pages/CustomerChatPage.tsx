import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Send, User, Package } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { conversationKey, fetchMessages, sendMessage, type ChatMessage } from "../lib/customerChat";
import { fetchMarketplace, type MarketProduct } from "../lib/customerData";

/**
 * Contact Farmer chat (/shop/chat/:farmerId) — Phase 5, real chat.
 * Messages are stored in the chat_messages table (migration 008)
 * and polled every 4s, so both sides see the same conversation
 * without a socket backend.
 */
export default function CustomerChatPage() {
  const { farmerId } = useParams<{ farmerId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [farmer, setFarmer] = useState<{ name: string; phone: string; storefront: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const key = farmerId && user ? conversationKey(user.id, farmerId) : null;

  // Identify the farmer from the marketplace cache
  useEffect(() => {
    if (!farmerId) return;
    fetchMarketplace("").then((products: MarketProduct[]) => {
      const p = products.find((x) => x.listing.id === farmerId);
      if (p) {
        setFarmer({
          name: p.listing.name,
          phone: p.listing.phone,
          storefront: `/shop/farmers/${encodeURIComponent(farmerId)}`,
        });
      } else {
        setFarmer({ name: "Farmer", phone: "", storefront: "/shop/farmers" });
      }
    });
  }, [farmerId]);

  // Load + poll messages
  useEffect(() => {
    if (!key) return;
    let alive = true;
    const load = () =>
      fetchMessages(key).then((m) => {
        if (alive) setMessages(m);
      });
    load();
    const timer = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [key]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !key || !user || sending) return;
    setSending(true);
    setInput("");
    const msg = await sendMessage(key, { id: user.id, name: user.name }, text);
    if (msg) setMessages((prev) => [...prev, msg]);
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link to="/shop/farmers" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Farmer Connect
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[75vh] overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-green-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <User className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-sm font-extrabold">💬 {farmer ? farmer.name : "Farmer"}</h1>
                <p className="text-[10px] text-emerald-100">Direct chat · usually replies within a day</p>
              </div>
            </div>
            {farmer && (
              <Link
                to={farmer.storefront}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-[11px] font-bold transition-colors"
              >
                <Package className="w-3.5 h-3.5" /> Storefront
              </Link>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/60">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
                <MessageCircle className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm font-semibold text-slate-500">Say namaste 👋</p>
                <p className="text-xs mt-1 max-w-xs">
                  Ask about quality, price, pickup or bulk deals — messages go straight to the farmer.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                        mine
                          ? "bg-emerald-600 text-white rounded-br-sm"
                          : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                      <p className={`text-[10px] mt-1 ${mine ? "text-emerald-200 text-right" : "text-slate-400"}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3.5 bg-white border-t border-slate-100">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
