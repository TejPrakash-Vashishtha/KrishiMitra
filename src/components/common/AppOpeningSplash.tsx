import React, { useState, useEffect } from "react";
import { Sprout, Sparkles, CheckCircle2, ChevronRight, Zap } from "lucide-react";

interface AppOpeningSplashProps {
  onComplete: () => void;
}

const BOOT_STEPS = [
  "Connecting to Krishi agricultural intelligence...",
  "Calibrating micro-weather sensors & crop diagnostics...",
  "Syncing live e-NAM Mandi prices & merchant network...",
  "Welcome to KrishiMitra!",
];

export default function AppOpeningSplash({ onComplete }: AppOpeningSplashProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Step 1 -> 2
    const t1 = setTimeout(() => {
      setStepIndex(1);
      setProgress(48);
    }, 450);

    // Step 2 -> 3
    const t2 = setTimeout(() => {
      setStepIndex(2);
      setProgress(82);
    }, 950);

    // Step 3 -> 4 (Ready)
    const t3 = setTimeout(() => {
      setStepIndex(3);
      setProgress(100);
    }, 1450);

    // Fade out and finish
    const t4 = setTimeout(() => {
      handleFinish();
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const handleFinish = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 550);
  };

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950 text-white select-none transition-all duration-500 ease-out cursor-pointer ${
        isExiting
          ? "opacity-0 scale-105 pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      role="banner"
      aria-label="KrishiMitra App Launch"
    >
      {/* Ambient background glow balls */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none animate-float" />

      {/* Top Bar / Status */}
      <div className="w-full max-w-md flex items-center justify-between pt-4 px-2 opacity-80">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <Zap className="w-3.5 h-3.5 animate-pulse text-amber-400" />
          <span>v2.4 Smart Agri Cloud</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <span>Skip</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Emblem & Branding */}
      <div className="flex flex-col items-center text-center my-auto relative z-10">
        {/* Animated Emblem */}
        <div className="relative mb-7">
          {/* Glowing Aura Rings */}
          <div className="absolute -inset-5 rounded-full border border-emerald-400/30 animate-[spin_10s_linear_infinite]" />
          <div className="absolute -inset-2.5 rounded-full border border-dashed border-amber-400/40 animate-[spin_6s_linear_infinite_reverse]" />

          {/* Central Logo Box */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-green-700 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 border border-emerald-300/30 animate-seed-pulse">
            <Sprout className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md text-emerald-50 animate-float" />
          </div>

          {/* Orbiting Sparkle Star */}
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/50 animate-bounce-click">
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
          </div>
        </div>

        {/* Brand Name */}
        <div className="space-y-1.5 mb-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            <span className="text-white">Krishi</span>
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              Mitra
            </span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-emerald-200/90 tracking-wide">
            कृषि मित्र · समृद्ध किसान, समृद्ध भारत
          </p>
        </div>

        {/* Tagline / Subtitle */}
        <p className="text-xs text-slate-400 max-w-xs sm:max-w-sm mb-6">
          AI Crop Doctor · Live Mandi Prices · Field Mapping · Digital Twin
        </p>

        {/* Progress Tracker Bar */}
        <div className="w-64 sm:w-72 bg-slate-800/80 rounded-full h-2 p-0.5 border border-white/10 shadow-inner overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-shimmer" />
          </div>
        </div>

        {/* Step Text */}
        <div className="h-6 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-300">
          {stepIndex === 3 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-scale-in" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          )}
          <span className="animate-fade-in">{BOOT_STEPS[stepIndex]}</span>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="pb-4 text-center">
        <p className="text-[11px] text-slate-500 font-medium animate-pulse">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}
