import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X, ShoppingCart, Package, Store } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

export default function DealerDashboard() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/crop-posts")
      .then((res) => {
        if (res.data.success) {
          setPosts(res.data.posts || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSendResponse = async () => {
    if (!selectedPost || !responseMessage.trim()) return;
    try {
      const res = await api.post(`/crop-posts/${selectedPost.id}/response`, {
        message: responseMessage,
      });
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === selectedPost.id ? { ...p, status: "RESPONDED" } : p
          )
        );
        setSelectedPost(null);
        setResponseMessage("");
      }
    } catch (err) {}
  };

  // Buyer role state
  const [buyerMode, setBuyerMode] = useState(false);
  const [buyListings, setBuyListings] = useState<any[]>([
    { id: "b1", crop: "Paddy (Swarna)", qty: "45 Quintal", price: "₹22.5/kg", seller: "Ramesh Kumar", location: "Cuttack", grade: "A" },
    { id: "b2", crop: "Tomato (Hybrid)", qty: "800 Kg", price: "₹18/kg", seller: "Suresh Patil", location: "Pune", grade: "B" },
    { id: "b3", crop: "Mustard", qty: "12 Quintal", price: "₹55/kg", seller: "Priya Singh", location: "Ludhiana", grade: "A" },
    { id: "b4", crop: "Potato", qty: "200 Quintal", price: "₹14.5/kg", seller: "Green Valley Traders", location: "Agra", grade: "A" },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">
                {user ? user.name : "Dealer Portal"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                Verified Dealer
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Review and respond to crop inquiries from local farmers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setBuyerMode(!buyerMode)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm cursor-pointer ${buyerMode ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-violet-100 hover:bg-violet-200 text-violet-800"}`}>
              <ShoppingCart className="w-4 h-4" />
              <span>{buyerMode ? "Buyer Mode ON" : "Switch to Buyer"}</span>
            </button>
            <Link to="/chat" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm">
              <MessageCircle className="w-4 h-4" />
              <span>Open Chats</span>
            </Link>
          </div>
        </div>

        {/* Buyer Mode: Browse & Order Produce */}
        {buyerMode && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Store className="w-4 h-4 text-violet-600" />
              <h2 className="text-sm font-bold text-slate-900">Available Produce from Farmers</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buyListings.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-slate-900">{item.crop}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Grade {item.grade}</span>
                    </div>
                    <p className="text-xs text-slate-500">{item.qty} &bull; {item.seller} &bull; {item.location}</p>
                    <p className="text-lg font-extrabold text-violet-700 mt-2">{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold cursor-pointer">Place Order</button>
                    <Link to="/chat" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"><MessageCircle className="w-4 h-4" /></Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dealer Mode: Incoming Posts */}
        {!buyerMode && (
          <>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Package className="w-4 h-4 text-emerald-600" /> Incoming Crop Issues</h2>
            {loading ? (
          <div className="py-12 text-center text-slate-400">Loading incoming posts...</div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-sm text-slate-500">
            No farmer crop issues posted yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{post.cropName}</h3>
                      <p className="text-xs text-slate-500">
                        By <span className="font-semibold">{post.farmer ? post.farmer.name : "Farmer"}</span> | {post.location}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${post.status === "OPEN" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {post.status}
                    </span>
                  </div>
                  {post.imageUrl && (
                    <div className="w-full h-48 bg-slate-900 rounded-xl overflow-hidden mb-3">
                      <img src={post.imageUrl} alt="Crop" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <p className="text-sm text-slate-700 mb-4">{post.problem}</p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Prescribe Solution
                  </button>
                  <Link
                    to={`/chat?with=${post.farmerId}`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Respond to Post</h3>
              <button onClick={() => setSelectedPost(null)} className="text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <textarea rows={4} value={responseMessage} onChange={(e) => setResponseMessage(e.target.value)} placeholder="Recommend specific products, dosages, etc..." className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4" />
            <button onClick={handleSendResponse} disabled={!responseMessage.trim()} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">Submit Recommendation</button>
          </div>
        </div>
      )}
    </div>
  );
}
