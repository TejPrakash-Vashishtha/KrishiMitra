import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, Shield, ShoppingBag, Droplets, Sprout, Volume2, ArrowLeft } from "lucide-react";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { fetchAnalysis, AnalysisRecord } from "../lib/analysisStore";
import { AGRI_DEALERS, productSearchLink } from "../lib/agriKnowledge";
import DealerCard from "../components/dealers/DealerCard";

export default function AnalysisDetailPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const { speak, isSpeaking } = useSpeechSynthesis();

  useEffect(() => {
    if (id) {
      fetchAnalysis(id).then((rec) => {
        setAnalysis(rec);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading diagnosis details...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h1 className="text-lg font-bold text-slate-800 mb-2">Diagnosis Not Found</h1>
        <Link to="/analyze" className="text-xs font-semibold text-emerald-600">Run New Scan &rarr;</Link>
      </div>
    );
  }

  const speakSummary = () => {
    const msg = `Crop: ${analysis.crop_name}. Diagnosis: ${analysis.disease}. Severity: ${analysis.severity}. ${analysis.summary}`;
    speak(msg);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/analyze" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Camera</span>
          </Link>
          <button
            onClick={speakSummary}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-sm hover:bg-emerald-700 cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>{isSpeaking ? "Stop Audio" : "Read Aloud"}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <div className="relative w-full h-72 bg-slate-900 rounded-xl overflow-hidden">
              <img src={analysis.image_url} alt="Diagnosed Crop" className="w-full h-full object-cover" />
              <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${analysis.severity === "High" || analysis.severity === "Critical" ? "bg-rose-500 text-white" : "bg-amber-500 text-slate-900"}`}>
                Severity: {analysis.severity || "Medium"}
              </span>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-slate-600 leading-relaxed">
              <p className="font-bold text-emerald-800 mb-1">AI Summary</p>
              {analysis.summary || "Follow the treatments below and monitor your crop daily."}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">{analysis.crop_name}</span>
              <h1 className="text-2xl font-extrabold text-slate-900">{analysis.disease}</h1>
              <p className="text-xs text-slate-400">Confidence: {analysis.confidence || 85}%</p>
            </div>

            {analysis.cause && (
              <p className="text-xs text-slate-500 leading-relaxed"><span className="font-semibold text-slate-700">Cause: </span>{analysis.cause}</p>
            )}

            <div>
              <h3 className="text-xs font-semibold text-slate-700 uppercase mb-2">Detected Symptoms</h3>
              <ul className="space-y-1 text-sm text-slate-600">
                {(analysis.symptoms || []).map((s: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-3">Organic Treatments</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              {(analysis.organic_treatments || []).map((t: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-3">Chemical & Preventive Measures</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              {(analysis.chemical_treatments || []).map((t: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Irrigation & Soil advice — from the agriculture knowledge base */}
        {(analysis.irrigation_advice?.length > 0 || analysis.soil_advice?.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" /> Irrigation Advice
              </h2>
              <ul className="space-y-2 text-sm text-slate-600">
                {(analysis.irrigation_advice || []).map((t: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <Droplets className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Sprout className="w-5 h-5 text-amber-600" /> Soil & Fertilizer Advice
              </h2>
              <ul className="space-y-2 text-sm text-slate-600">
                {(analysis.soil_advice || []).map((t: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <Sprout className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {analysis.recommended_products && analysis.recommended_products.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Recommended Products</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {analysis.recommended_products.map((p: string, i: number) => {
                const links = productSearchLink(p);
                return (
                  <div key={i} className="p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <p className="text-xs font-semibold text-slate-800 mb-2">{p}</p>
                    <div className="flex gap-2">
                      <a href={links.amazon} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold hover:bg-amber-100 transition-colors">Amazon</a>
                      <a href={links.flipkart} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold hover:bg-blue-100 transition-colors">Flipkart</a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Nearby Verified Agro Dealers</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {AGRI_DEALERS.slice(0, 3).map((dealer) => (
              <DealerCard key={dealer.id} dealer={dealer} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
