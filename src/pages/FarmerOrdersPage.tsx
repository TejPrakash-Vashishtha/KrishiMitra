import React, { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Package, Clock, XCircle, MapPin, Phone, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

// ============================================================
// Farmer Orders (/farmer-orders) — closes the Phase 7 loop.
// Farmers see every customer order that contains at least one of
// their products, and can CONFIRM or COMPLETE it. Status changes
// are written straight to the customer_orders table so the
// customer's order history updates live.
// ============================================================

interface OrderItem {
  productId: string;
  productName: string;
  emoji?: string;
  farmerId: string;
  farmerName: string;
  pricePerKg: number;
  unit: string;
  quantity: number;
}

interface CustomerOrderRow {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
}

const STATUS_META: Record<string, { cls: string; icon: any; label: string }> = {
  PLACED: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "New order" },
  CONFIRMED: { cls: "bg-blue-50 text-blue-700 border-blue-200", icon: Package, label: "Confirmed" },
  COMPLETED: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Completed" },
  CANCELLED: { cls: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle, label: "Cancelled" },
};

export default function FarmerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<CustomerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    if (!isSupabaseConfigured() || !supabase || !user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("customer_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error && data) {
        // Keep only orders that contain this farmer's items
        const mine = (data as any[]).filter((o) => {
          let items: OrderItem[] = [];
          try {
            items = typeof o.items === "string" ? JSON.parse(o.items) : o.items || [];
          } catch {
            items = [];
          }
          return items.some((i) => i.farmerId === user.id);
        });
        setOrders(mine as CustomerOrderRow[]);
      }
    } catch {
      // ignore — table may not exist yet (migration 008)
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 8000); // poll for new orders
    return () => clearInterval(timer);
  }, [user?.id]);

  const updateStatus = async (orderId: string, status: string) => {
    if (!supabase) return;
    setUpdating(orderId);
    await supabase
      .from("customer_orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    setUpdating(null);
    load();
  };

  const fmt = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BellRing className="w-6 h-6 text-emerald-600" />
              Customer Orders
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Orders customers placed on your marketplace listings. Confirm them, then mark complete after handover.
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            Live · polling
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200/80 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-slate-200/80 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No orders yet</p>
            <p className="text-xs text-slate-500 mt-1">
              When a customer orders your produce from the marketplace, it appears here instantly.
              {!isSupabaseConfigured() && " (Connect Supabase to receive real orders.)"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const myItems = o.items.filter((i) => i.farmerId === user?.id);
              const myTotal = myItems.reduce((s, i) => s + i.quantity * i.pricePerKg, 0);
              const meta = STATUS_META[o.status] || STATUS_META.PLACED;
              const StatusIcon = meta.icon;
              return (
                <div key={o.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{o.customer_name}</p>
                        <p className="text-[11px] text-slate-500">
                          {o.order_number} · {new Date(o.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold shrink-0 ${meta.cls}`}>
                      <StatusIcon className="w-3 h-3" /> {meta.label}
                    </span>
                  </div>

                  <div className="px-5 py-3 space-y-1.5">
                    {myItems.map((i, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-slate-800 font-semibold">
                          {i.emoji || "🥗"} {i.productName} × {i.quantity} {i.unit === "kg" ? "kg" : i.unit}
                        </span>
                        <span className="font-bold text-slate-900">{fmt(i.quantity * i.pricePerKg)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-slate-100 text-sm">
                      <span className="text-xs text-slate-500">Your part of this order</span>
                      <span className="font-extrabold text-emerald-700">{fmt(myTotal)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {o.address}</span>
                      {o.customer_phone && (
                        <a href={`tel:${o.customer_phone}`} className="flex items-center gap-1 font-semibold text-emerald-700 hover:underline">
                          <Phone className="w-3 h-3" /> {o.customer_phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {o.status === "PLACED" && (
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                      <button
                        onClick={() => updateStatus(o.id, "CONFIRMED")}
                        disabled={updating === o.id}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        ✓ Confirm Order
                      </button>
                      <button
                        onClick={() => updateStatus(o.id, "CANCELLED")}
                        disabled={updating === o.id}
                        className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {o.status === "CONFIRMED" && (
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                      <button
                        onClick={() => updateStatus(o.id, "COMPLETED")}
                        disabled={updating === o.id}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        📦 Mark Completed (handover done)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
