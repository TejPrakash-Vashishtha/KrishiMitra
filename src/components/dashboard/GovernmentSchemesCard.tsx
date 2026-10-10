import React from "react";
import { Landmark, ExternalLink } from "lucide-react";

interface Scheme {
  name: string;
  hindiName: string;
  benefit: string;
  url: string;
  accent: string; // tailwind bg for the icon chip
}

/**
 * Top 5 central government schemes for farmers (verified official portals).
 * Shown on the farmer dashboard so schemes are one tap away.
 */
const SCHEMES: Scheme[] = [
  {
    name: "PM-KISAN",
    hindiName: "किसान सम्मान निधि",
    benefit: "₹6,000/year directly in your bank — 3 installments",
    url: "https://pmkisan.gov.in",
    accent: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    name: "PMFBY",
    hindiName: "फसल बीमा योजना",
    benefit: "Crop insurance — small premium, compensation for crop loss",
    url: "https://pmfby.gov.in",
    accent: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    name: "Kisan Credit Card",
    hindiName: "किसान क्रेडिट कार्ड",
    benefit: "Crop loans up to ₹3 lakh at ~4% effective interest",
    url: "https://fasalrin.gov.in",
    accent: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    name: "eNAM",
    hindiName: "राष्ट्रीय कृषि बाज़ार",
    benefit: "Sell produce online to 1,000+ mandis across India",
    url: "https://enam.gov.in",
    accent: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    name: "PM-KISAN Maandhan",
    hindiName: "किसान पेंशन योजना",
    benefit: "₹3,000/month pension after age 60",
    url: "https://maandhan.in",
    accent: "bg-rose-50 text-rose-600 border-rose-100",
  },
];

export default function GovernmentSchemesCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Sarkari Yojanaayein</h2>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Official portals</span>
      </div>

      <div className="space-y-2.5">
        {SCHEMES.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors"
          >
            <span className={`w-9 h-9 rounded-lg border flex items-center justify-center text-base font-bold shrink-0 ${s.accent}`}>
              {s.name.charAt(0)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {s.name} <span className="font-medium text-slate-400">· {s.hindiName}</span>
              </p>
              <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{s.benefit}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 shrink-0 transition-colors" />
          </a>
        ))}
      </div>

      <p className="text-[9px] text-slate-400 mt-3 text-center">
        Government of India schemes — apply free on official websites only
      </p>
    </div>
  );
}
