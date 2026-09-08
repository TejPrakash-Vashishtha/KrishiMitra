import React, { useState } from "react";
import { Truck, QrCode, MapPin, Clock, CheckCircle2, Circle, Package, ArrowRight, Search, Plus, Eye } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface SupplyBatch {
  id: string;
  batchId: string;
  crop: string;
  quantity: string;
  farmer: string;
  origin: string;
  destination: string;
  status: "harvested" | "in-transit" | "at-mandi" | "processing" | "delivered";
  stages: { label: string; location: string; time: string; completed: boolean }[];
  qrData: string;
  createdAt: string;
}

const MOCK_BATCHES: SupplyBatch[] = [
  {
    id: "1", batchId: "AXN-2026-0901-001", crop: "Paddy (Swarna)", quantity: "45 Quintals", farmer: "Ramesh Kumar",
    origin: "Cuttack, Odisha", destination: "Azadpur Mandi, Delhi", status: "in-transit",
    stages: [
      { label: "Harvested", location: "Ramesh Farm, Cuttack", time: "Sep 1, 6:00 AM", completed: true },
      { label: "Quality Graded", location: "Cuttack Collection Center", time: "Sep 1, 10:30 AM", completed: true },
      { label: "In Transit", location: "NH-16, near Bhubaneswar", time: "Sep 2, 2:00 PM", completed: false },
      { label: "At Mandi", location: "Azadpur Mandi, Delhi", time: "Expected: Sep 4", completed: false },
      { label: "Delivered", location: "Buyer Warehouse", time: "Pending", completed: false },
    ],
    qrData: "AXN-2026-0901-001|RAMESH|PADDY|45Q|CUTTACK-DELHI",
    createdAt: "Sep 1, 2026"
  },
  {
    id: "2", batchId: "AXN-2026-0828-002", crop: "Tomato (Hybrid)", quantity: "800 Kg", farmer: "Suresh Patil",
    origin: "Pune, Maharashtra", destination: "Mumbai Processing Unit", status: "processing",
    stages: [
      { label: "Harvested", location: "Suresh Farm, Pune", time: "Aug 28, 5:30 AM", completed: true },
      { label: "Quality Graded", location: "Pune APMC", time: "Aug 28, 9:00 AM", completed: true },
      { label: "In Transit", location: "Mumbai-Pune Expressway", time: "Aug 28, 1:00 PM", completed: true },
      { label: "At Mandi", location: "Vashi APMC, Mumbai", time: "Aug 28, 6:00 PM", completed: true },
      { label: "Processing", location: "FreshPack Processing, Mumbai", time: "Aug 29, 8:00 AM", completed: false },
    ],
    qrData: "AXN-2026-0828-002|SURESH|TOMATO|800KG|PUNE-MUMBAI",
    createdAt: "Aug 28, 2026"
  },
  {
    id: "3", batchId: "AXN-2026-0825-003", crop: "Mustard", quantity: "12 Quintals", farmer: "Priya Singh",
    origin: "Ludhiana, Punjab", destination: "Delhi Wholesale Market", status: "delivered",
    stages: [
      { label: "Harvested", location: "Priya Farm, Ludhiana", time: "Aug 25, 6:30 AM", completed: true },
      { label: "Quality Graded", location: "Khanna Mandi", time: "Aug 25, 11:00 AM", completed: true },
      { label: "In Transit", location: "NH-44, Ambala", time: "Aug 25, 4:00 PM", completed: true },
      { label: "At Mandi", location: "Ghazipur Mandi, Delhi", time: "Aug 26, 8:00 AM", completed: true },
      { label: "Delivered", location: "Sharma Trading Co., Delhi", time: "Aug 26, 12:00 PM", completed: true },
    ],
    qrData: "AXN-2026-0825-003|PRIYA|MUSTARD|12Q|LUDHIANA-DELHI",
    createdAt: "Aug 25, 2026"
  },
  {
    id: "4", batchId: "AXN-2026-0902-004", crop: "Maize", quantity: "20 Quintals", farmer: "Anil Reddy",
    origin: "Bengaluru, Karnataka", destination: "Chennai Export Hub", status: "harvested",
    stages: [
      { label: "Harvested", location: "Anil Farm, Bengaluru Rural", time: "Sep 2, 5:00 AM", completed: true },
      { label: "Quality Graded", location: "Bengaluru APMC", time: "Pending", completed: false },
      { label: "In Transit", location: "Not yet dispatched", time: "Pending", completed: false },
      { label: "At Mandi", location: "Chennai Koyambedu", time: "Pending", completed: false },
      { label: "Delivered", location: "Export Hub", time: "Pending", completed: false },
    ],
    qrData: "AXN-2026-0902-004|ANIL|MAIZE|20Q|BENGALURU-CHENNAI",
    createdAt: "Sep 2, 2026"
  },
];

// STATUS_MAP labels are now translation keys
const STATUS_MAP = {
  "harvested": { labelKey: "harvested", color: "bg-amber-100 text-amber-800", icon: "🌾" },
  "in-transit": { labelKey: "inTransit", color: "bg-blue-100 text-blue-800", icon: "🚛" },
  "at-mandi": { labelKey: "atMandi", color: "bg-violet-100 text-violet-800", icon: "🏪" },
  "processing": { labelKey: "processing", color: "bg-orange-100 text-orange-800", icon: "🏭" },
  "delivered": { labelKey: "delivered", color: "bg-emerald-100 text-emerald-800", icon: "✅" },
};

export default function SupplyChainPage() {
  const { t } = useLanguage();
  const [batches] = useState<SupplyBatch[]>(MOCK_BATCHES);
  const [selectedBatch, setSelectedBatch] = useState<SupplyBatch | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = batches.filter((b) => b.crop.toLowerCase().includes(search.toLowerCase()) || b.batchId.toLowerCase().includes(search.toLowerCase()) || b.farmer.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2">
              <Truck className="w-3.5 h-3.5" />
              <span>{t("supplyChainTracker")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t("supplyChainTracker")}</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">{t("trackProduceFork")}</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>{t("postProduce")}</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(["harvested", "in-transit", "at-mandi", "processing", "delivered"] as const).map((status) => {
            const count = batches.filter((b) => b.status === status).length;
            const info = STATUS_MAP[status];
            return (
              <div key={status} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm text-center">
                <span className="text-lg">{info.icon}</span>
                <p className="text-lg font-extrabold text-slate-900 mt-1">{count}</p>
                <p className="text-[10px] text-slate-400 font-semibold">{t(info.labelKey)}</p>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchBatch")} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Batch List */}
        <div className="space-y-4">
          {filtered.map((batch) => {
            const info = STATUS_MAP[batch.status];
            const completedStages = batch.stages.filter((s) => s.completed).length;
            return (
              <div key={batch.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg">{info.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{batch.crop}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${info.color}`}>{t(info.labelKey)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{batch.batchId} &bull; {batch.farmer} &bull; {batch.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowQR(batch.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-700 cursor-pointer">
                      <QrCode className="w-3.5 h-3.5" /> {t("qrCode")}
                    </button>
                    <button onClick={() => setSelectedBatch(selectedBatch?.id === batch.id ? null : batch)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> {t("track")}
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-1 mb-3">
                  {batch.stages.map((stage, i) => (
                    <div key={i} className="flex-1">
                      <div className={`h-1.5 rounded-full ${stage.completed ? "bg-emerald-500" : "bg-slate-200"}`} />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">{completedStages}/{batch.stages.length} {t("stagesCompleted")} &bull; {batch.origin} → {batch.destination}</p>

                {/* Expanded Timeline */}
                {selectedBatch?.id === batch.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 mb-3">Shipment Timeline</h4>
                    <div className="space-y-3">
                      {batch.stages.map((stage, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            {stage.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                            )}
                            {i < batch.stages.length - 1 && (
                              <div className={`w-0.5 h-6 ${stage.completed && batch.stages[i + 1].completed ? "bg-emerald-300" : "bg-slate-200"}`} />
                            )}
                          </div>
                          <div>
                            <p className={`text-xs font-semibold ${stage.completed ? "text-slate-900" : "text-slate-400"}`}>{stage.label}</p>
                            <p className="text-[10px] text-slate-400">{stage.location}</p>
                            <p className="text-[10px] text-slate-300">{stage.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-base font-bold text-slate-900">{t("qrCode")}</h3>
            <div className="w-48 h-48 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300">
              <div className="text-center">
                <QrCode className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                <p className="text-[10px] text-slate-400 font-mono">{batches.find((b) => b.id === showQR)?.batchId}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Scan this QR code to verify the produce origin, quality grade, and shipment status.</p>
            <div className="bg-slate-50 rounded-xl p-3 text-left">
              <p className="text-[10px] text-slate-400 mb-1">Batch Data:</p>
              <p className="text-[10px] font-mono text-slate-600 break-all">{batches.find((b) => b.id === showQR)?.qrData}</p>
            </div>
            <button onClick={() => setShowQR(null)} className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer">{t("cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
