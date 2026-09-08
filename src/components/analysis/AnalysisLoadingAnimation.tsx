import React, { useState, useEffect } from "react";
import { Sparkles, Sprout, ShieldCheck, Microscope } from "lucide-react";

const STEPS = [
  { icon: Microscope, text: "Scanning leaf texture and coloration..." },
  { icon: Sprout, text: "Consulting Gemini AI Agricultural Knowledge Base..." },
  { icon: ShieldCheck, text: "Generating organic and chemical treatment plans..." },
  { icon: Sparkles, text: "Finding verified agro-dealers and fertilizers..." },
];

export default function AnalysisLoadingAnimation() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % STEPS.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const Icon = STEPS[currentStep].icon;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl text-center space-y-6">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-75" />
          <div className="relative w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <Icon className="w-10 h-10 animate-bounce" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-900">AI Plant Doctor Analyzing</h2>
          <p className="text-xs text-slate-500 mt-1">Please hold on while AgriNexus processes your crop image</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-900 transition-all">
          {STEPS[currentStep].text}
        </div>

        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
