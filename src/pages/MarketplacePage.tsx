import React, { useState } from "react";
import { Store, Search, Camera, Image, MapPin, Star, MessageCircle, Package, ArrowRight, X, Send, Filter } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { createOrder } from "../lib/supabaseData";

interface ProduceListing {
  id: string;
  sellerName: string;
  sellerType: "farmer" | "trader";
  sellerVerified: boolean;
  crop: string;
  quantity: number;
  unit: string;
  grade: "A" | "B" | "C";
  pricePerKg: number;
  location: string;
  distance: string;
  imageUrl: string;
  description: string;
  postedDate: string;
  status: "available" | "reserved" | "sold";
  rating: number;
}

interface Message {
  id: string;
  sender: "buyer" | "seller";
  text: string;
  time: string;
}

const MOCK_LISTINGS: ProduceListing[] = [
  { id: "1", sellerName: "Ramesh Kumar", sellerType: "farmer", sellerVerified: true, crop: "Paddy (Swarna)", quantity: 45, unit: "quintal", grade: "A", pricePerKg: 22.5, location: "Cuttack, Odisha", distance: "12 km", imageUrl: "https://images.unsplash.com/photo-1536657464919-892534f60d7e?w=400&auto=format&fit=crop&q=80", description: "Premium long grain paddy, freshly harvested. Well-dried, moisture < 14%.", postedDate: "Today", status: "available", rating: 4.8 },
  { id: "2", sellerName: "Suresh Agro Farm", sellerType: "farmer", sellerVerified: true, crop: "Tomato (Hybrid)", quantity: 800, unit: "kg", grade: "B", pricePerKg: 18, location: "Pune, Maharashtra", distance: "5 km", imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80", description: "Fresh hybrid tomato, slight color variation. Best for processing.", postedDate: "Yesterday", status: "available", rating: 4.5 },
  { id: "3", sellerName: "Priya Mustard Farm", sellerType: "farmer", sellerVerified: false, crop: "Mustard", quantity: 12, unit: "quintal", grade: "A", pricePerKg: 55, location: "Ludhiana, Punjab", distance: "8 km", imageUrl: "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=400&auto=format&fit=crop&q=80", description: "Premium yellow mustard seeds. High oil content, well-cleaned.", postedDate: "2 days ago", status: "available", rating: 4.9 },
  { id: "4", sellerName: "Green Valley Traders", sellerType: "trader", sellerVerified: true, crop: "Potato", quantity: 200, unit: "quintal", grade: "A", pricePerKg: 14.5, location: "Agra, UP", distance: "15 km", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82ber?w=400&auto=format&fit=crop&q=80", description: "Fresh Jyoti variety potatoes, uniform size, well-washed.", postedDate: "Today", status: "available", rating: 4.3 },
  { id: "5", sellerName: "Karnataka Maize Co.", sellerType: "trader", sellerVerified: true, crop: "Maize", quantity: 50, unit: "quintal", grade: "A", pricePerKg: 18.5, location: "Bengaluru, Karnataka", distance: "20 km", imageUrl: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&auto=format&fit=crop&q=80", description: "Hybrid maize, high test weight, moisture 12%. Ready for immediate dispatch.", postedDate: "Today", status: "available", rating: 4.6 },
  { id: "6", sellerName: "Anita Reddy Farm", sellerType: "farmer", sellerVerified: true, crop: "Brinjal (Round)", quantity: 300, unit: "kg", grade: "A", pricePerKg: 25, location: "Hyderabad, Telangana", distance: "3 km", imageUrl: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400&auto=format&fit=crop&q=80", description: "Fresh round brinjal, uniform purple color, no pest damage.", postedDate: "Yesterday", status: "available", rating: 4.7 },
];

const GRADE_COLORS: Record<string, string> = { A: "bg-emerald-100 text-emerald-800", B: "bg-amber-100 text-amber-800", C: "bg-rose-100 text-rose-800" };
const CROPS = ["All", "Paddy", "Tomato", "Mustard", "Potato", "Maize", "Brinjal"];

export default function MarketplacePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [listings] = useState<ProduceListing[]>(MOCK_LISTINGS);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedListing, setSelectedListing] = useState<ProduceListing | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { id: "1", sender: "seller", text: "Hello! Thanks for your interest. How can I help you?", time: "10:30 AM" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [placedIds, setPlacedIds] = useState<Record<string, boolean>>({});

  const filtered = listings.filter((l) => {
    const matchCrop = filter === "All" || l.crop.includes(filter);
    const matchSearch = l.crop.toLowerCase().includes(search.toLowerCase()) || l.sellerName.toLowerCase().includes(search.toLowerCase()) || l.location.toLowerCase().includes(search.toLowerCase());
    return matchCrop && matchSearch && l.status === "available";
  });

  const openChat = (listing: ProduceListing) => {
    setSelectedListing(listing);
    setChatOpen(true);
    setChatMessages([{ id: "1", sender: "seller", text: `Hi! I have ${listing.crop} available at ₹${listing.pricePerKg}/kg. How can I help you?`, time: "Just now" }]);
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, { id: Date.now().toString(), sender: "buyer", text: chatInput, time: "Now" }]);
    setChatInput("");
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { id: Date.now().toString(), sender: "seller", text: "Thanks for your message! Let me check and get back to you.", time: "Now" }]);
    }, 1500);
  };

  // Create a permanent order record in the database (orders table)
  const placeOrder = async (listing: ProduceListing) => {
    setPlacingId(listing.id);
    try {
      const qtyKg = listing.unit === "quintal" ? listing.quantity * 100 : listing.quantity;
      await createOrder({
        farmer_id: user?.id ?? null,
        buyer_name: user?.name || "Guest Buyer",
        crop: listing.crop,
        quantity: listing.quantity,
        unit: listing.unit,
        amount: Math.round(qtyKg * listing.pricePerKg),
        status: "pending",
        items: {
          listing_id: listing.id,
          seller: listing.sellerName,
          seller_type: listing.sellerType,
          grade: listing.grade,
          price_per_kg: listing.pricePerKg,
          location: listing.location,
        },
      });
      setPlacedIds((prev) => ({ ...prev, [listing.id]: true }));
    } catch {
      // order creation failed — button resets so the farmer can retry
    } finally {
      setPlacingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-800 text-xs font-semibold mb-2">
              <Store className="w-3.5 h-3.5" />
              <span>Buyer-Seller Produce Marketplace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Produce Marketplace</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Buy directly from farmers and verified traders near you</p>
          </div>
          <button onClick={() => setShowPostForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer">
            <Package className="w-4 h-4" />
            <span>Sell Produce</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search crops, sellers, or locations..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex flex-wrap gap-2">
            {CROPS.map((c) => (
              <button key={c} onClick={() => setFilter(c)} className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${filter === c ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((listing) => (
            <div key={listing.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-44 bg-slate-900">
                <img src={listing.imageUrl} alt={listing.crop} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${GRADE_COLORS[listing.grade]}`}>
                    Grade {listing.grade}
                  </span>
                  {listing.sellerVerified && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">✓ Verified</span>
                  )}
                </div>
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-bold">
                  ₹{listing.pricePerKg}/kg
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{listing.crop}</h3>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{listing.location} &bull; {listing.distance}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-[10px] font-bold text-slate-600">{listing.rating}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{listing.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-600">{listing.quantity} {listing.unit}</span> &bull; {listing.postedDate}
                  </div>
                  <span className="text-[10px] text-slate-400">by {listing.sellerName}</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => openChat(listing)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Contact Seller
                  </button>
                  <button
                    onClick={() => placeOrder(listing)}
                    disabled={placingId === listing.id || placedIds[listing.id]}
                    className={`px-3 py-2 rounded-xl text-[11px] font-semibold cursor-pointer disabled:cursor-default ${
                      placedIds[listing.id]
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {placingId === listing.id ? "Placing…" : placedIds[listing.id] ? "Order Placed ✓" : "Place Order"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Modal */}
      {chatOpen && selectedListing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col h-[70vh] overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white rounded-t-3xl">
              <div>
                <p className="text-xs font-bold">{selectedListing.sellerName}</p>
                <p className="text-[10px] text-emerald-300">{selectedListing.crop} &bull; ₹{selectedListing.pricePerKg}/kg</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "buyer" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs ${msg.sender === "buyer" ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
                    <p>{msg.text}</p>
                    <p className={`text-[9px] mt-0.5 ${msg.sender === "buyer" ? "text-emerald-200" : "text-slate-400"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-slate-100 bg-white">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button type="submit" className="p-2.5 rounded-xl bg-emerald-600 text-white cursor-pointer"><Send className="w-4 h-4" /></button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Post Produce Modal */}
      {showPostForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">List Your Produce for Sale</h3>
              <button onClick={() => setShowPostForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Crop Name</label>
                  <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {["Paddy", "Tomato", "Mustard", "Potato", "Maize", "Brinjal", "Chilli", "Other"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
                  <div className="flex gap-2">
                    {["A", "B", "C"].map((g) => (
                      <button key={g} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer">Grade {g}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input type="number" placeholder="e.g. 45" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price per Kg (₹)</label>
                  <input type="number" placeholder="e.g. 22" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea rows={3} placeholder="Describe your produce quality, harvest date, etc." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-4 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 flex flex-col items-center justify-center gap-1 cursor-pointer">
                  <Camera className="w-6 h-6 text-emerald-600" />
                  <span className="text-[10px] font-semibold text-emerald-800">Take Photo</span>
                </button>
                <label className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-1 cursor-pointer">
                  <Image className="w-6 h-6 text-slate-500" />
                  <span className="text-[10px] font-semibold text-slate-700">Upload Photo</span>
                  <input type="file" accept="image/*" className="hidden" />
                </label>
              </div>
            </div>
            <button className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer">Publish Listing</button>
          </div>
        </div>
      )}
    </div>
  );
}
