import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Plus, ArrowRight, Package, TrendingUp, ShoppingCart, MapPin, Truck, LogIn } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation as useGeoLocation } from "../contexts/LocationContext";
import { useLanguage } from "../contexts/LanguageContext";
import CameraCaptureModal from "../components/camera/CameraCaptureModal";
import api from "../services/api";
import { fetchInventory, fetchOrders, subscribeInventory, InventoryRow, OrderRow } from "../lib/supabaseData";

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-emerald-100 text-emerald-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { city } = useGeoLocation();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    api.get("/analysis/history")
      .then((res) => {
        if (res.data.success) setAnalyses(res.data.analyses || []);
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    if (user) {
      setInventory(await fetchInventory(user.id));
      setOrders(await fetchOrders(user.id));
    } else {
      setInventory([]);
      setOrders([]);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live sync — dashboard inventory mirrors Crop Stock instantly
  useEffect(() => {
    if (!user) return;
    return subscribeInventory(user.id, () => {
      loadData();
    });
  }, [user, loadData]);

  const handleCapture = (dataUrl: string) => {
    sessionStorage.setItem("km_pending_image", dataUrl);
    navigate("/analyze");
  };

  const activeInv = inventory.filter((i) => i.status !== "sold");
  const totalStockKg = activeInv.reduce(
    (s, i) => s + (i.unit === "quintal" ? Number(i.quantity) * 100 : Number(i.quantity)),
    0
  );
  const estimatedValue = activeInv.reduce(
    (s, i) => s + (i.unit === "quintal" ? Number(i.quantity) * 100 : Number(i.quantity)) * (Number(i.price_per_unit) || 0),
    0
  );
  const inventoryItems = inventory.slice(0, 3).map((i) => ({
    crop: i.crop_name,
    qty: `${i.quantity} ${i.unit}`,
    grade: i.grade,
    status: i.status,
  }));
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("greeting")}, {user ? user.name : "Farmer"} 🙏
            </h1>
            <p className="text-sm text-slate-500 max-w-xl flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {t("locationLabel")}: <span className="font-semibold text-emerald-700">{city || t("detectingLocation")}</span>
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setCameraOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm cursor-pointer">
              <Camera className="w-4 h-4" />
              <span>{t("scanCrop")}</span>
            </button>
            <Link to="/post-crop" className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm">
              <Plus className="w-4 h-4" />
              <span>{t("postIssue")}</span>
            </Link>
            <Link to="/marketplace" className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-sm">
              <ShoppingCart className="w-4 h-4" />
              <span>{t("sellProduce")}</span>
            </Link>
          </div>
        </div>

        {/* Inventory & Orders Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory Widget — mirrors Crop Stock */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">{t("myInventory")}</h2>
              </div>
              <Link to="/inventory" className="text-[10px] font-semibold text-emerald-600 hover:underline">{t("viewAll")} →</Link>
            </div>

            {!user ? (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500 mb-3">Login to see your crop stock here</p>
                <button
                  onClick={() => navigate("/login?returnTo=/dashboard")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" /> {t("login")}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase">{t("totalStockLabel")}</p>
                    <p className="text-lg font-extrabold text-emerald-800">{totalStockKg.toLocaleString()} kg</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] text-blue-600 font-semibold uppercase">{t("estValueLabel")}</p>
                    <p className="text-lg font-extrabold text-blue-800">₹{estimatedValue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {inventoryItems.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-4">No stock yet — add your first harvest</p>
                  ) : (
                    inventoryItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{item.crop}</p>
                          <p className="text-[10px] text-slate-400">{item.qty} • {t("gradeLabel")} {item.grade}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.status === "listed" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {item.status === "listed" ? t("listed") : t("available")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Pending Orders Widget — real order history from database */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">{t("pendingOrders")}</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">{user ? pendingCount : 0} {t("newOrders")}</span>
            </div>
            {!user ? (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500 mb-3">Login to see your order history</p>
                <button
                  onClick={() => navigate("/login?returnTo=/dashboard")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" /> {t("login")}
                </button>
              </div>
            ) : orders.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-6">No orders yet — buy/sell from the Marketplace</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-900">{order.buyer_name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ORDER_STATUS_COLORS[order.status] || "bg-slate-100 text-slate-600"}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-400">{order.order_number} • {order.crop} • {order.quantity} {order.unit}</p>
                      <p className="text-xs font-bold text-slate-900">₹{Number(order.amount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Diagnoses */}
        <div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">{t("recentDiagnoses")}</h2>
              <Link to="/history" className="text-xs font-semibold text-emerald-600 hover:underline">{t("viewAll")}</Link>
            </div>

            {analyses.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">{t("noDiagnoses")}</p>
            ) : (
              <div className="space-y-3">
                {analyses.slice(0, 3).map((a) => (
                  <Link key={a.id} to={`/analysis/${a.id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100">
                    <img src={a.imageUrl} alt="Crop" className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-semibold text-slate-800 truncate">{a.cropName}</h3>
                      <p className="text-[10px] text-rose-600 font-medium">{a.disease || t("healthy")}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CameraCaptureModal isOpen={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={handleCapture} />
    </div>
  );
}