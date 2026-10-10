import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart, Trash2, Plus, Minus, MapPin, CheckCircle2, Package,
  Clock, XCircle, ArrowRight, Phone,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import {
  placeCustomerOrder,
  fetchCustomerOrders,
  cancelCustomerOrder,
  type CustomerOrder,
  type CustomerOrderStatus,
} from "../lib/customerData";

/**
 * My Orders (/shop/orders) — Phase 6.
 * Cart management → checkout (address) → order confirmation → history.
 * Orders are stored in the customer_orders table (migration 008);
 * no real payments/delivery yet.
 */
export default function MyOrdersPage() {
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, clearCart, totalAmount } = useCart();

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<CustomerOrder | null>(null);

  // Checkout form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchCustomerOrders(user.id).then(setOrders).catch(() => setOrders([]));
  }, [user]);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("Please fill your name, phone and delivery address.");
      return;
    }
    setPlacing(true);
    setError("");
    const order = await placeCustomerOrder({
      customerId: user.id,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      address: address.trim(),
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        emoji: "🥗",
        farmerId: i.farmerId,
        farmerName: i.farmerName,
        pricePerKg: i.pricePerKg,
        unit: i.unit,
        quantity: i.quantity,
      })),
      totalAmount: Math.round(totalAmount),
    });
    setPlacing(false);
    if (order) {
      clearCart();
      setConfirmed(order);
      setCheckoutOpen(false);
      fetchCustomerOrders(user.id).then(setOrders).catch(() => {});
    } else {
      setError("Could not place the order. Please try again.");
    }
  };

  const statusBadge = (status: CustomerOrderStatus) => {
    const map: Record<CustomerOrderStatus, { cls: string; icon: any; label: string }> = {
      PLACED: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Placed" },
      CONFIRMED: { cls: "bg-blue-50 text-blue-700 border-blue-200", icon: Package, label: "Confirmed" },
      COMPLETED: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Completed" },
      CANCELLED: { cls: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle, label: "Cancelled" },
    };
    const { cls, icon: Icon, label } = map[status] || map.PLACED;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${cls}`}>
        <Icon className="w-3 h-3" /> {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-amber-600" /> My Orders
        </h1>

        {/* Order confirmation banner */}
        {confirmed && (
          <div className="bg-white rounded-2xl border-2 border-emerald-200 p-5 shadow-sm flex items-start gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-extrabold text-slate-900">Order placed! 🎉</p>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-bold text-emerald-700">{confirmed.orderNumber}</span> · ₹{confirmed.totalAmount.toLocaleString("en-IN")} ·
                The farmer will contact you shortly to confirm.
              </p>
            </div>
            <button onClick={() => setConfirmed(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Cart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">🛒 Cart ({items.length} item{items.length === 1 ? "" : "s"})</h2>
            {items.length > 0 && (
              <button onClick={clearCart} className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer">
                Clear cart
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingCart className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Your cart is empty</p>
              <Link to="/shop/marketplace" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700">
                Browse marketplace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {items.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{i.productName}</p>
                      <p className="text-[11px] text-slate-500">
                        👨‍🌾 {i.farmerName} · ₹{i.pricePerKg}/{i.unit === "kg" ? "kg" : "pack"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => updateQuantity(i.id, i.quantity - 1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{i.quantity}</span>
                      <button onClick={() => updateQuantity(i.id, i.quantity + 1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="w-16 text-right text-sm font-extrabold text-slate-900 shrink-0">
                      ₹{Math.round(i.quantity * i.pricePerKg)}
                    </span>
                    <button onClick={() => removeItem(i.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Total</span>
                  <span className="text-lg font-extrabold text-slate-900">₹{Math.round(totalAmount).toLocaleString("en-IN")}</span>
                </div>
                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-md shadow-amber-200 cursor-pointer transition-colors"
                >
                  Place Order →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Order history */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Order history</h2>
          </div>
          {orders.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400">No orders yet — your purchases will appear here.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((o) => (
                <div key={o.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{o.orderNumber}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {o.items.map((i) => `${i.emoji || "🥗"} ${i.productName} × ${i.quantity}`).join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-slate-900">₹{o.totalAmount.toLocaleString("en-IN")}</p>
                      {statusBadge(o.status)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {o.address.slice(0, 60)}{o.address.length > 60 ? "..." : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                      {o.status === "PLACED" && (
                        <button
                          onClick={async () => {
                            await cancelCustomerOrder(o.id, user?.id || "");
                            fetchCustomerOrders(user?.id || "").then(setOrders);
                          }}
                          className="font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Checkout modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900">Checkout</h2>
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">{error}</div>
            )}
            <form onSubmit={placeOrder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Address *</label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House no, street, village/city, pincode"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">{items.length} items</span>
                <span className="font-extrabold text-slate-900">₹{Math.round(totalAmount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold cursor-pointer hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={placing}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {placing ? "Placing..." : "Confirm Order"}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                Payment is cash-on-delivery for now — online payments arrive in a future update.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
