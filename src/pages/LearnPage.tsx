import React, { useState } from "react";
import { BookOpen, Play, CheckCircle } from "lucide-react";

const GUIDES = [
  {
    title: "Paddy Blast Disease Management in Odisha",
    crop: "Paddy",
    summary: "Identify leaf, node, and neck blast early. Organic spraying with Pseudomonas fluorescens and chemical management with Tricyclazole 75% WP.",
    season: "Kharif & Rabi",
  },
  {
    title: "Organic Pest Control with Neem Oil (Azadirachtin)",
    crop: "All Crops",
    summary: "Step-by-step ratio and spraying schedule to deter aphids, whiteflies, thrips, and caterpillars naturally.",
    season: "All Season",
  },
  {
    title: "Tomato Early & Late Blight Identification",
    crop: "Tomato",
    summary: "Recognize concentric ring target spots on foliage. Preventive copper oxychloride spraying techniques.",
    season: "Rabi",
  },
  {
    title: "Soil Preparation & NPK Balancing for Mustard",
    crop: "Mustard",
    summary: "Soil test analysis, farm yard manure incorporation, and optimal basal dose application in alluvial soils.",
    season: "Rabi",
  },
];

export default function LearnPage() {
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Farming Knowledge Base</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900">
            Agricultural Guides & Crop Tutorials
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mt-2">
            Practical, easy-to-follow best practices tailored for Odisha agricultural ecosystems
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GUIDES.map((g, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                    {g.crop}
                  </span>
                  <span className="text-xs text-slate-400">{g.season}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{g.title}</h3>
                <p className="text-sm text-slate-600">{g.summary}</p>
              </div>
              <button
                onClick={() => setSelectedGuide(g)}
                className="mt-4 w-full py-2.5 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold cursor-pointer"
              >
                Read Full Guide
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">{selectedGuide.title}</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{selectedGuide.summary}</p>
            <div className="p-3.5 rounded-xl bg-emerald-50 text-xs text-emerald-900 space-y-1.5">
              <div className="font-semibold">Quick Farmer Tip:</div>
              <div>Always spray during early morning or late afternoon to maximize absorption and protect pollinating bees.</div>
            </div>
            <button
              onClick={() => setSelectedGuide(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
