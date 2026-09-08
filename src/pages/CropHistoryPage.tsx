import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { History, Search, Camera, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { fetchAnalysisHistory } from "../lib/analysisStore";

export default function CropHistoryPage() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisHistory(user?.id).then((rows) => {
      setAnalyses(rows || []);
      setLoading(false);
    });
  }, [user?.id]);

  const filtered = analyses.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.crop_name?.toLowerCase().includes(q) ||
      (a.disease && a.disease.toLowerCase().includes(q)) ||
      (a.severity && a.severity.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <History className="w-3.5 h-3.5" />
            <span>Crop Health Logs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Crop Analysis History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mt-1">
            All your past diagnoses, disease records, and agricultural treatments
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-sm">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-3 left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by crop, symptom, or disease name..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading history...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-6">
            <History className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-800 mb-1">No Diagnoses Found</h3>
            <p className="text-xs text-slate-500 mb-4">Snap a photo of your plant to get instant advisory.</p>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Crop Now</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((a) => (
              <Link key={a.id} to={`/analysis/${a.id}`} className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-900 mb-3">
                    <img src={a.image_url} alt="Crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${a.severity === "High" || a.severity === "Critical" ? "bg-rose-500 text-white" : "bg-amber-500 text-slate-900"}`}>
                      {a.severity || "Medium"}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                    {a.crop_name}
                  </h3>
                  <p className="text-xs text-rose-600 font-medium line-clamp-1">
                    {a.disease || "Healthy"}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                  <span>{new Date(a.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <span>Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
