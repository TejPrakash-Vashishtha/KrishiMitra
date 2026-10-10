import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  MapPin, Search, Star, ShieldCheck, Truck, QrCode, Calendar, Users, Wallet,
  Package, X, CheckCircle2, Circle, Store, ArrowRight, Layers, Clock, BadgeCheck,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchCollectionPoints,
  fetchCollectionPointInventory,
  fetchContributions,
  fetchCustomerOrders,
  createCustomerOrder,
  confirmDeliveryAndReleaseEscrow,
  createSubscription,
  fetchSubscriptions,
  CollectionPoint,
  CollectionPointInventoryRow,
  CustomerOrderRow,
  CustomerSubscriptionRow,
  FarmerContributionRow,
  referenceFor,
  farmerPayoutPerKg,
  farmerChipsFor,
  extraFarmersCount,
  daysAheadStr,
} from "../lib/collectionData";

// ---- helpers -------------------------------------------------
const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800",
  B: "bg-amber-100 text-amber-800",
  C: "bg-rose-100 text-rose-800",
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Pre-order Placed", color: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  in_transit: { label: "In Transit", color: "bg-violet-100 text-violet-800" },
  ready: { label: "Ready for Pickup", color: "bg-teal-100 text-teal-800" },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Cancelled", color: "bg-rose-100 text-rose-800" },
};

function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const SLOTS = [
  { label: "Morning 8–10 AM", offset: 3 },
  { label: "Afternoon 12–2 PM", offset: 3 },
  { label: "Evening 5–7 PM", offset: 4 },
];

function weekendLabel(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function CustomerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [points, setPoints] = useState<CollectionPoint[]>([]);
  const [inventory, setInventory] = useState<CollectionPointInventoryRow[]>([]);
  const [contributions, setContributions] = useState<FarmerContributionRow[]>([]);
  const [myOrders, setMyOrders] = useState<CustomerOrderRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<CustomerSubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("All");
  const [seasonFilter, setSeasonFilter] = useState("All");
  const [selectedPoint, setSelectedPoint] = useState<string>("all");

  // order flow
  const [chipsOpen, setChipsOpen] = useState<string | null>(null);
  const [orderItem, setOrderItem] = useState<{ inv: CollectionPointInventoryRow; cp: CollectionPoint } | null>(null);
  const [orderQty, setOrderQty] = useState("");
  const [fulfilment, setFulfilment] = useState<"pickup" | "scheduled_slot">("pickup");
  const [slotIndex, setSlotIndex] = useState(0);
  const [pooling, setPooling] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderDone, setOrderDone] = useState<CustomerOrderRow | null>(null);

  // QR + escrow
  const [qrOrder, setQrOrder] = useState<CustomerOrderRow | null>(null);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"browse" | "orders" | "subscribe">("browse");

  const customerId = user?.id || "customer-demo";
  const customerName = user?.name || "Guest Customer";
  const customerPhone = user?.phone || "";

  const refresh = useCallback(async () => {
    setLoading(true);
    const [pts, inv, contribs, orders, subs] = await Promise.all([
      fetchCollectionPoints(),
      fetchCollectionPointInventory(),
      fetchContributions(),
      fetchCustomerOrders(customerId),
      fetchSubscriptions(customerId),
    ]);
    setPoints(pts);
    setInventory(inv);
    setContributions(contribs);
    setMyOrders(orders);
    setSubscriptions(subs);
    setLoading(false);
  }, [customerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---- derived data -------------------------------------------
  const pointById = useMemo(() => {
    const m = new Map<string, CollectionPoint>();
    points.forEach((p) => m.set(p.id, p));
    return m;
  }, [points]);

  const byCrop = useMemo(() => {
    const m = new Map<string, CollectionPointInventoryRow[]>();
    inventory.forEach((r) => {
      const list = m.get(r.crop_name) || [];
      list.push(r);
      m.set(r.crop_name, list);
    });
    return m;
  }, [inventory]);

  // Seasonality: crops that are in season right now (heuristic view)
  const cropSeasons: Record<string, string> = {
    "Paddy (Swarna)": "Kharif · Sep–Dec",
    "Tomato (Hybrid)": "Rabi · Nov–Mar",
    Mustard: "Rabi · Jan–Apr",
    "Brinjal (Round)": "Kharif · Jul–Oct",
    Maize: "Kharif · Sep–Nov",
    Wheat: "Rabi · Mar–May",
  };

  const crops = Array.from(new Set(inventory.map((r) => r.crop_name)));
  const seasons = Array.from(new Set(inventory.map((r) => r.season)));

  const filteredInventory = inventory.filter((r) => {
    const cp = pointById.get(r.collection_point_id);
    const matchPoint = selectedPoint === "all" || r.collection_point_id === selectedPoint;
    const matchCrop = cropFilter === "All" || r.crop_name.includes(cropFilter);
    const matchSeason = seasonFilter === "All" || r.season === seasonFilter;
    const matchSearch =
      search === "" ||
      r.crop_name.toLowerCase().includes(search.toLowerCase()) ||
      (cp?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (cp?.region || "").toLowerCase().includes(search.toLowerCase());
    return matchPoint && matchCrop && matchSeason && matchSearch && r.status === "available";
  });

  const totalPoolKg = inventory.reduce((s, r) => s + (Number(r.quantity_kg) - Number(r.reserved_kg)), 0);
  const activeCrops = new Set(inventory.map((r) => r.crop_name)).size;
  const pooledFarmers = contributions.length;
  const totalReleased = myOrders
    .filter((o) => o.payment_status === "released")
    .reduce((s, o) => s + Number(o.total_amount), 0);

  // ---- actions -----------------------------------------------
  const openOrder = (inv: CollectionPointInventoryRow) => {
    const cp = pointById.get(inv.collection_point_id);
    if (!cp) return;
    setOrderItem({ inv, cp });
    setOrderQty("");
    setFulfilment("pickup");
    setSlotIndex(0);
    setPooling(false);
    setOrderDone(null);
  };

  const placeOrder = async () => {
    if (!orderItem) return;
    const qty = parseFloat(orderQty);
    if (!qty || qty <= 0) return;
    const available = Number(orderItem.inv.quantity_kg) - Number(orderItem.inv.reserved_kg);
    if (qty > available) return;

    setPlacing(true);
    const orders = await fetchCustomerOrders(customerId);
    // community pooling: join an open pooled batch on this crop at this CP (if any)
    const openBatch = orders.find(
      (o) =>
        o.collection_point_id === orderItem.cp.id &&
        o.crop_name === orderItem.inv.crop_name &&
        o.pooled_batch_id !== "" &&
        o.status === "pending"
    );
    const poolBatchId = pooling && openBatch ? openBatch.pooled_batch_id : `pool-${Date.now().toString(36)}`;

    const slotMeta = SLOTS[slotIndex];
    const created = await createCustomerOrder({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_id: customerId,
      collection_point_id: orderItem.cp.id,
      inventory_id: orderItem.inv.id,
      crop_name: orderItem.inv.crop_name,
      quantity_kg: qty,
      price_per_kg: Number(orderItem.inv.price_per_kg),
      total_amount: Math.round(qty * Number(orderItem.inv.price_per_kg) * 100) / 100,
      payment_status: "held_in_escrow",
      escrow_released_at: null,
      fulfilment_mode: fulfilment,
      pickup_point: orderItem.cp.name,
      slot_date: daysAheadStr(slotMeta.offset),
      slot_label: weekendLabel(slotMeta.offset),
      ready_date: orderItem.inv.ready_from_date,
      pooled_batch_id: poolBatchId,
      status: "pending",
      items: { grade: orderItem.inv.grade, season: orderItem.inv.season, cp_id: orderItem.cp.id },
    });
    setPlacing(false);
    setOrderDone(created);
    await refresh();
  };

  const releaseEscrow = async (orderId: string) => {
    setReleasingId(orderId);
    await confirmDeliveryAndReleaseEscrow(orderId);
    setReleasingId(null);
    await refresh();
  };

  const [subCpId, setSubCpId] = useState("");
  const [subFreq, setSubFreq] = useState<"weekly" | "fortnightly">("weekly");
  const [subSize, setSubSize] = useState(5);
  const [subDone, setSubDone] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const subscribe = async () => {
    setSubscribing(true);
    await createSubscription({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_id: customerId,
      collection_point_id: subCpId || points[0]?.id || "cp-demo-1",
      frequency: subFreq,
      box_size_kg: subSize,
      next_delivery_date: daysAheadStr(7),
      status: "active",
    });
    setSubscribing(false);
    setSubDone(true);
    await refresh();
  };

  const orderStatusStages = (o: CustomerOrderRow): { label: string; done: boolean }[] => [
    { label: "Pre-order placed", done: true },
    { label: "Payment held in escrow", done: true },
    { label: "Pooled & confirmed", done: o.status === "confirmed" || o.status === "in_transit" || o.status === "ready" || o.status === "delivered" },
    { label: "Ready for pickup", done: o.status === "ready" || o.status === "delivered" },
    { label: "Delivered · escrow released", done: o.status === "delivered" },
  ];

  // Showcase mode: the customer dashboard is open to everyone —
  // no login/register required so it can be demoed directly.
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-800 text-xs font-semibold mb-2">
              <Store className="w-3.5 h-3.5" />
              <span>Customer · Pooled Supply Chain</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Buy from Collection Points</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Fresh produce pooled from nearby farmers — pre-order, pick up, pay only on delivery.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab("browse")} className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === "browse" ? "bg-violet-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200"}`}>
              Browse Stock
            </button>
            <button onClick={() => setActiveTab("orders")} className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === "orders" ? "bg-violet-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200"}`}>
              My Orders ({myOrders.filter((o) => o.status !== "cancelled").length})
            </button>
            <button onClick={() => setActiveTab("subscribe")} className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === "subscribe" ? "bg-violet-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200"}`}>
              Produce Box
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Pooled stock ready</p>
            <p className="text-lg font-extrabold text-slate-900 mt-1">{totalPoolKg.toLocaleString()} kg</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Active crops</p>
            <p className="text-lg font-extrabold text-slate-900 mt-1">{activeCrops}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Farmers in pool</p>
            <p className="text-lg font-extrabold text-slate-900 mt-1">{pooledFarmers}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Escrow released</p>
            <p className="text-lg font-extrabold text-emerald-600 mt-1">₹{totalReleased.toLocaleString()}</p>
          </div>
        </div>

        {activeTab === "browse" && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search crops, collection points..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="flex flex-wrap gap-2">
                <select value={selectedPoint} onChange={(e) => setSelectedPoint(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="all">All Collection Points</option>
                  {points.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={cropFilter} onChange={(e) => setCropFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="All">All Crops</option>
                  {crops.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="All">All Seasons</option>
                  {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Seasonal availability strip */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-bold text-emerald-900">Now in Season</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {crops.map((c) => (
                  <button key={c} onClick={() => setCropFilter(c)} className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer ${cropFilter === c ? "bg-emerald-600 text-white" : "bg-white text-emerald-800 border border-emerald-200"}`}>
                    {c} <span className="opacity-70">· {cropSeasons[c] || "In season"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pooled stock grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredInventory.map((inv) => {
                const cp = pointById.get(inv.collection_point_id);
                if (!cp) return null;
                const available = Number(inv.quantity_kg) - Number(inv.reserved_kg);
                const ref = referenceFor(inv.crop_name);
                const match = byCrop.get(inv.crop_name)?.length || 0;
                return (
                  <div key={inv.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative h-40 bg-slate-900">
                      <img src={cp.photoUrl} alt={cp.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">{cp.name}</p>
                          <p className="text-[10px] text-white/80 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{cp.region}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-black/50 rounded-lg px-1.5 py-1">
                          {cp.verified && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-[10px] font-bold text-white">{cp.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{inv.crop_name}</h3>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1"><Layers className="w-2.5 h-2.5" />{inv.season} · Ready from {fmtDate(inv.ready_from_date)}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${GRADE_COLORS[inv.grade]}`}>Grade {inv.grade}</span>
                      </div>

                      {/* Farmer chips — direct from farmers, not a warehouse */}
                      <button
                        onClick={() => setChipsOpen(chipsOpen === inv.id ? null : inv.id)}
                        className="w-full flex items-center gap-2 group cursor-pointer"
                        title="Farmers who contributed to this pool"
                      >
                        <div className="flex -space-x-1.5">
                          {farmerChipsFor(contributions, cp.id, cp.contributingFarmerCount).map((chip) => (
                            <span key={chip.name} className={`w-5 h-5 rounded-full ${chip.color} border-2 border-white flex items-center justify-center text-[8px] font-bold text-white`}>
                              {chip.name.charAt(0)}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-500 group-hover:text-emerald-700 font-medium text-left">
                          Contributed by: {farmerChipsFor(contributions, cp.id, cp.contributingFarmerCount).map((c) => c.name).join(", ")}
                          {(() => { const x = extraFarmersCount(contributions, cp.id, cp.contributingFarmerCount); return x > 0 ? ` +${x} more` : ""; })()}
                        </span>
                      </button>
                      {chipsOpen === inv.id && (
                        <div className="flex flex-wrap gap-1.5 -mt-1">
                          {Array.from(new Set(contributions.filter((c) => c.collection_point_id === cp.id).map((c) => c.farmer_name))).map((name) => (
                            <span key={name} className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-semibold text-emerald-800">👨‍🌾 {name}</span>
                          ))}
                        </div>
                      )}

                      {/* Price ladder — the killer feature, front and centre */}
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Price ladder — where your ₹ goes</p>
                        {([
                          { label: "Mandi (wholesale)", value: ref.mandi, bar: "bg-slate-300", text: "text-slate-600" },
                          { label: "City retail (middleman)", value: ref.retail, bar: "bg-amber-300", text: "text-slate-600" },
                          { label: "You pay here", value: Number(inv.price_per_kg), bar: "bg-emerald-500", text: "text-emerald-700" },
                        ]).map((row) => {
                          const max = Math.max(ref.retail, Number(inv.price_per_kg), ref.mandi) || 1;
                          return (
                            <div key={row.label} className="space-y-0.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className={`font-semibold ${row.text}`}>{row.label}</span>
                                <span className={`font-bold ${row.text}`}>₹{row.value}/kg</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                                <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${Math.min(100, (row.value / max) * 100)}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                          <span className="text-[10px] font-semibold text-slate-500">👨‍🌾 Farmer payout</span>
                          <span className="text-[11px] font-extrabold text-emerald-600">₹{farmerPayoutPerKg(Number(inv.price_per_kg))}/kg</span>
                        </div>
                        <p className="text-[9px] text-slate-400">
                          {Number(inv.price_per_kg) < ref.retail
                            ? `₹${(ref.retail - Number(inv.price_per_kg)).toFixed(0)}/kg cheaper than retail — savings shared with farmers`
                            : "Fair price, directly to the pool"}
                        </p>
                      </div>

                      <p className="text-[10px] text-slate-400">{available.toLocaleString()} kg available · pooled from {match} batch(es)</p>
                      <button onClick={() => openOrder(inv)} className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer">
                        Pre-order Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredInventory.length === 0 && !loading && (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No pooled stock matches your filters</p>
              </div>
            )}
          </>
        )}

        {activeTab === "orders" && (
          <div className="space-y-4">
            {myOrders.length === 0 && (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No orders yet. Browse stock and pre-order fresh produce.</p>
              </div>
            )}
            {myOrders.map((o) => {
              const cp = pointById.get(o.collection_point_id);
              const stages = orderStatusStages(o);
              const doneCount = stages.filter((s) => s.done).length;
              return (
                <div key={o.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{o.crop_name} · {Number(o.quantity_kg)} kg</p>
                        <p className="text-[10px] text-slate-400">{o.order_number} · {cp?.name || "Collection point"} · {fmtDate(o.slot_date)} {o.slot_label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_META[o.status]?.color || "bg-slate-100 text-slate-600"}`}>
                        {STATUS_META[o.status]?.label || o.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.payment_status === "released" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {o.payment_status === "released" ? "💰 Escrow Released" : "🔒 Held in Escrow"}
                      </span>
                      <button onClick={() => setQrOrder(o)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"><QrCode className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Fulfilment info */}
                  <div className="flex flex-wrap gap-2 mb-3 text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50"><Truck className="w-3 h-3" />{o.fulfilment_mode === "pickup" ? "Pickup at " + (cp?.name || "collection point") : `Scheduled slot · ${o.slot_label}`}</span>
                    {o.pooled_batch_id && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-50 text-violet-700"><Users className="w-3 h-3" />Community pool #{o.pooled_batch_id.slice(-6)}</span>}
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700"><Wallet className="w-3 h-3" />₹{Number(o.total_amount).toLocaleString()}</span>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-1 mb-2">
                    {stages.map((s, i) => <div key={i} className={`flex-1 h-1.5 rounded-full ${s.done ? "bg-emerald-500" : "bg-slate-200"}`} />)}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400">{doneCount}/{stages.length} stages complete</p>
                    {o.payment_status === "held_in_escrow" && (
                      <button
                        onClick={() => releaseEscrow(o.id!)}
                        disabled={releasingId === o.id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold disabled:opacity-50 cursor-pointer"
                      >
                        {releasingId === o.id ? "Releasing…" : "Confirm Delivery · Release Escrow"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "subscribe" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center"><Calendar className="w-5 h-5 text-emerald-600" /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Seasonal Produce Box</h3>
                  <p className="text-[10px] text-slate-500">Auto-picked from whatever is in season at your linked collection point.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Collection Point</label>
                  <select value={subCpId || points[0]?.id || ""} onChange={(e) => setSubCpId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                    {points.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.region}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                    <div className="flex gap-2">
                      {(["weekly", "fortnightly"] as const).map((f) => (
                        <button key={f} onClick={() => setSubFreq(f)} className={`flex-1 py-2 rounded-xl text-[11px] font-bold cursor-pointer ${subFreq === f ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                          {f === "weekly" ? "Weekly" : "Fortnightly"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Box Size</label>
                    <select value={subSize} onChange={(e) => setSubSize(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                      {[3, 5, 10].map((s) => <option key={s} value={s}>{s} kg</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={subscribe} disabled={subscribing || subDone} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer">
                  {subDone ? "Subscribed ✓" : subscribing ? "Subscribing…" : "Subscribe to Produce Box"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">My Subscriptions</h3>
              {subscriptions.length === 0 ? (
                <p className="text-xs text-slate-400">No active subscriptions yet.</p>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((s) => {
                    const cp = pointById.get(s.collection_point_id);
                    return (
                      <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{cp?.name || "Collection point"}</p>
                          <p className="text-[10px] text-slate-400">{s.box_size_kg} kg · {s.frequency} · next {fmtDate(s.next_delivery_date)}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{s.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price transparency explainer */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900">How your rupee is split (transparency)</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { label: "Mandi price", hint: "wholesale benchmark" },
              { label: "Middleman / retail", hint: "typical city retail" },
              { label: "Platform pool price", hint: "what you pay here" },
              { label: "Farmer payout", hint: "~82% after pooling costs" },
            ].map((x) => (
              <div key={x.label} className={`rounded-xl p-3 ${x.label === "Platform pool price" ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50"}`}>
                <p className="text-[11px] font-bold text-slate-900">{x.label}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{x.hint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2"><ArrowRight className="w-4 h-4 text-violet-600" />How the pooled supply chain works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            {[
              { icon: "🌾", t: "Farmers deliver to the collection point" },
              { icon: "📦", t: "Produce is pooled, graded & priced transparently" },
              { icon: "🗓️", t: "You pre-order with a pickup/slot window" },
              { icon: "💰", t: "Payment held, released only after delivery" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl bg-slate-50 p-3">
                <span className="text-lg">{s.icon}</span>
                <p className="text-[10px] text-slate-600 mt-1">{s.t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pre-order Modal */}
      {orderItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOrderItem(null)}>
          {orderDone ? (
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl text-center space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div>
              <h3 className="text-base font-bold text-slate-900">Pre-order placed!</h3>
              <p className="text-xs text-slate-500">
                {orderDone.order_number} — {Number(orderDone.quantity_kg)} kg {orderDone.crop_name} ready {fmtDate(orderDone.ready_date)}.
                Payment ₹{Number(orderDone.total_amount).toLocaleString()} is held in escrow and released only after you confirm delivery.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                <p className="text-[10px] font-bold text-amber-800">🔒 Escrow protection</p>
                <p className="text-[10px] text-amber-700 mt-1">Your money stays with the platform until the collection point hands over the produce.</p>
              </div>
              <button onClick={() => { setOrderItem(null); setActiveTab("orders"); }} className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer">Track my order</button>
            </div>
          ) : (
            <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pre-order {orderItem.inv.crop_name}</h3>
                  <p className="text-[10px] text-slate-400">{orderItem.cp.name} · {orderItem.cp.region} · Ready from {fmtDate(orderItem.inv.ready_from_date)}</p>
                </div>
                <button onClick={() => setOrderItem(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (kg)</label>
                  <input type="number" value={orderQty} onChange={(e) => setOrderQty(e.target.value)} placeholder={`max ${Math.max(0, Number(orderItem.inv.quantity_kg) - Number(orderItem.inv.reserved_kg))} kg`} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div className="rounded-xl bg-slate-50 p-3 flex flex-col justify-center">
                  <p className="text-[10px] text-slate-400">Total (held in escrow)</p>
                  <p className="text-base font-extrabold text-slate-900">₹{((parseFloat(orderQty) || 0) * Number(orderItem.inv.price_per_kg)).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fulfilment window</label>
                <div className="flex gap-2">
                  <button onClick={() => setFulfilment("pickup")} className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer ${fulfilment === "pickup" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    Pickup at CP
                  </button>
                  <button onClick={() => setFulfilment("scheduled_slot")} className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer ${fulfilment === "scheduled_slot" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    Scheduled slot
                  </button>
                </div>
              </div>

              {fulfilment === "scheduled_slot" && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Pick a delivery slot</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SLOTS.map((s, i) => (
                      <button key={i} onClick={() => setSlotIndex(i)} className={`px-2 py-2 rounded-xl text-[10px] font-bold cursor-pointer ${slotIndex === i ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {weekendLabel(s.offset)}<br />{s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                <input type="checkbox" checked={pooling} onChange={(e) => setPooling(e.target.checked)} className="accent-violet-600 w-4 h-4" />
                <Users className="w-3.5 h-3.5 text-violet-600" />
                Join a community pool — combine with neighbours to hit the minimum delivery size for one run
              </label>

              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                <p className="text-[10px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />No instant delivery — this is a pre-order with a stated ready/pickup date.</p>
                <p className="text-[10px] text-slate-500 flex items-center gap-1"><Wallet className="w-3 h-3" />Payment is held in escrow and released to the collection point (then farmers) after delivery.</p>
              </div>

              <button onClick={placeOrder} disabled={placing || !(parseFloat(orderQty) > 0)} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer">
                {placing ? "Placing…" : "Place Pre-order"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* QR Modal */}
      {qrOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setQrOrder(null)}>
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-900">Order QR — {qrOrder.order_number}</h3>
            <div className="w-48 h-48 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300">
              <div className="text-center">
                <QrCode className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                <p className="text-[10px] text-slate-400 font-mono">{qrOrder.order_number}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Show this code at the collection point to verify your pre-order and release escrow on delivery.</p>
            <div className="bg-slate-50 rounded-xl p-3 text-left">
              <p className="text-[10px] text-slate-400 mb-1">Batch Data:</p>
              <p className="text-[10px] font-mono text-slate-600 break-all">{qrOrder.order_number}|{qrOrder.crop_name}|{Number(qrOrder.quantity_kg)}KG|{qrOrder.pooled_batch_id || "SINGLE"}|{qrOrder.status}</p>
            </div>
            <button onClick={() => setQrOrder(null)} className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}