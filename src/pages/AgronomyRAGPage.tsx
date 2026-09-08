import React, { useState } from "react";
import { BookOpen, ShieldCheck, Search, CheckCircle, AlertOctagon, Sparkles, RefreshCw } from "lucide-react";
import api from "../services/api";

export default function AgronomyRAGPage() {
  const [query, setQuery] = useState("Recommended Tricyclazole dosage for Paddy Blast and organic alternatives in Odisha");
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const sampleQueries = [
    "How to manage Brown Planthopper (BPH) without synthetic pyrethroids?",
    "Amelioration of acidic laterite soils in Odisha using agricultural lime",
    "Tomato Early Blight organic Neem and Mancozeb treatment schedule",
  ];

  const runQuery = async (qText?: string) => {
    const q = qText || query;
    if (!q) return;
    setLoading(true);
    try {
      const res = await api.post("/rag/query", { query: q });
      if (res.data.success) {
        setResult(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Vector DB & Agronomic Guardrails</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            Agronomy RAG Knowledge Base & Guardrail Auditor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Every AI recommendation is grounded in verified research manuals from ICAR, OUAT, and FAO ? actively filtering banned pesticides and toxic dosages.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-3.5 left-4 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runQuery()}
                placeholder="Ask any agronomy question (dosages, pest cycles, soil acidity, organic practices)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={() => runQuery()}
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Verify & Query</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 items-center pt-2">
            <span className="text-[11px] font-bold text-slate-400">Verified Queries:</span>
            {sampleQueries.map((sq, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(sq);
                  runQuery(sq);
                }}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700 font-medium cursor-pointer"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs text-slate-500">Searching vector embeddings & executing safety guardrails...</p>
          </div>
        ) : result ? (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Grounded Agronomic Synthesis</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Grounding Confidence: {result.groundingConfidenceScore}%</span>
                </span>
              </div>

              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {result.groundedAnswer}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Agronomic Safety Guardrail Verification Checks</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.guardrails?.map((g: any, idx: number) => {
                  const isPassed = g.status === "PASSED" || g.status === "FLAGGED_SAFE";
                  return (
                    <div key={idx} className={`p-4 rounded-2xl border ${isPassed ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50 border-rose-200"}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        {isPassed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertOctagon className="w-4 h-4 text-rose-600" />
                        )}
                        <span className="text-xs font-bold text-slate-900">{g.guardrailName}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{g.message}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Direct Cited Literature & Textbook Excerpts ({result.citedSources?.length || 0})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.citedSources?.map((src: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                      {src.cropOrDomain}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900">{src.sourceDoc}</h5>
                    <p className="text-[11px] text-slate-500">{src.publisher} &bull; {src.chapterOrSection}</p>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                      "{src.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
