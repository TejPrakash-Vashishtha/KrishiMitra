import React, { useState, useEffect } from "react";
import { Sprout, Sparkles } from "lucide-react";

interface PageLoaderProps {
  message?: string;
  subtext?: string;
  minHeight?: string;
}

const AGRI_TIPS = [
  "Syncing real-time APMC Mandi market arrivals...",
  "Calibrating satellite NDVI & crop vegetative index...",
  "Connecting to regional soil health & weather radars...",
  "Querying agricultural university (OUAT/ICAR) advisory...",
  "Optimizing harvest, market & fertilizer schedules...",
];

export default function PageLoader({
  message = "Loading KrishiMitra...",
  subtext,
  minHeight = "min-h-[65vh]",
}: PageLoaderProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % AGRI_TIPS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`${minHeight} w-full flex flex-col items-center justify-center p-6 select-none animate-fade-in`}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex flex-col items-center max-w-sm text-center">
        {/* Animated Glow Halo Background */}
        <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-amber-500/15 rounded-full blur-2xl animate-pulse-glow" />

        {/* Central Organic Spinner Core */}
        <div className="relative mb-6">
          {/* Outer dashed spinning ring */}
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-500/40 animate-[spin_8s_linear_infinite]" />

          {/* Inner reverse spinning arc */}
          <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-emerald-600 border-r-amber-500 animate-[spin_2s_cubic-bezier(0.4,0,0.2,1)_infinite]" />

          {/* Orbiting Satellite Dot */}
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/60 -translate-y-1.5 mx-auto" />
          </div>

          {/* Central Sprout Icon with Breathing Bounce */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 animate-seed-pulse">
              <Sprout className="w-6 h-6 animate-float" />
            </div>
          </div>
        </div>

        {/* Loading Title */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-center gap-1.5 text-slate-800 font-bold text-base tracking-tight">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>{message}</span>
          </div>
          <p className="text-xs font-medium text-slate-500 h-5 transition-all duration-300">
            {subtext || AGRI_TIPS[tipIndex]}
          </p>
        </div>

        {/* Smooth Shimmering Progress Bar */}
        <div className="w-48 h-1.5 bg-slate-200/80 rounded-full overflow-hidden relative shadow-inner">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 w-full rounded-full animate-shimmer" />
        </div>

        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700/60 mt-3">
          KrishiMitra Seva
        </span>
      </div>
    </div>
  );
}
