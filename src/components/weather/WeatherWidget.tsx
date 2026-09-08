import React, { useState, useEffect, useCallback } from "react";
import { MapPin, RefreshCw, AlertTriangle } from "lucide-react";
import { useLocation } from "../../contexts/LocationContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { saveWeatherSnapshot, todayStr } from "../../lib/supabaseData";

interface WeatherWidgetProps {
  showForecast?: boolean;
  /** "glass" = transparent liquid-glass panel (for dark hero backgrounds); "solid" = original opaque card (default) */
  variant?: "glass" | "solid";
}

// --- Open-Meteo API helpers ---

function getWMOCondition(code: number, isDay = true): { condition: string; icon: string } {
  // isDay comes from Open-Meteo is_day field: 1 = day, 0 = night
  if (code === 0) return isDay
    ? { condition: "Clear", icon: "sunny" }
    : { condition: "Clear Night", icon: "clearNight" };
  if (code <= 3) return isDay
    ? { condition: "Partly Cloudy", icon: "partlyCloudy" }
    : { condition: "Partly Cloudy (Night)", icon: "cloudy" };
  if (code <= 48) return { condition: "Foggy", icon: "cloudy" };
  if (code <= 57) return { condition: "Drizzle", icon: "lightRain" };
  if (code <= 67) return { condition: "Rainy", icon: "rain" };
  if (code <= 77) return { condition: "Snowy", icon: "snow" };
  if (code <= 82) return { condition: "Rainy", icon: "rain" };
  if (code <= 86) return { condition: "Snowy", icon: "snow" };
  if (code <= 99) return { condition: "Thunderstorm", icon: "thunder" };
  return isDay
    ? { condition: "Clear", icon: "sunny" }
    : { condition: "Clear Night", icon: "clearNight" };
}

function getConditionLabel(cond: string, t: (k: string) => string): string {
  const map: Record<string, string> = {
    "Clear": t("sunny"), "Clear Night": t("nightClear"),
    "Partly Cloudy": t("partlyCloudy"), "Partly Cloudy (Night)": t("nightPartlyCloudy"),
    "Foggy": t("cloudy"),
    "Drizzle": t("lightRain"), "Rainy": t("lightRain"),
    "Snowy": t("cloudy"),
    "Thunderstorm": t("lightRain"),
  };
  return map[cond] || cond;
}

function getDayLabel(idx: number, t: (k: string) => string): string {
  if (idx === 0) return t("today");
  if (idx === 1) return t("tomorrow");
  const days = [t("sun"), t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat")];
  const d = new Date();
  d.setDate(d.getDate() + idx);
  return days[d.getDay()];
}

function isNightTime(): boolean {
  // If the API didn't tell us is_day, fall back to local clock time
  const h = new Date().getHours();
  return h < 5 || h >= 20;
}

// ============================================================
// CLOUD SVG COMPONENT — classic cartoon shape with round bumps
// ============================================================
function CloudShape({ width, height, color, opacity }: { width: number; height: number; color: string; opacity: number }) {
  // Creates a classic cloud: flat bottom + 4 round bumps (semicircles) on top
  // Using SVG arc (A) commands for perfect circles
  const w = width;
  const h = height;
  const baseY = h * 0.72; // flat bottom line
  const bumpR1 = w * 0.14; // big bump radius
  const bumpR2 = w * 0.11; // medium bump radius
  const bumpR3 = w * 0.16; // biggest bump radius
  const bumpR4 = w * 0.10; // small bump

  // Bump centers (x positions)
  const cx1 = w * 0.22;
  const cx2 = w * 0.42;
  const cx3 = w * 0.62;
  const cx4 = w * 0.80;

  // Build path: flat bottom, then arcs for each bump
  const d = [
    `M${w * 0.08},${baseY}`,           // start left on flat bottom
    `L${w * 0.92},${baseY}`,            // flat bottom to right
    `A${bumpR4},${bumpR4} 0 0,0 ${cx4},${baseY - bumpR4}`, // rightmost small bump
    `A${bumpR3},${bumpR3} 0 0,0 ${cx3},${baseY - bumpR3 * 0.3}`, // big bump
    `A${bumpR2},${bumpR2} 0 0,0 ${cx2},${baseY - bumpR2 * 0.5}`, // medium bump
    `A${bumpR1},${bumpR1} 0 0,0 ${cx1},${baseY - bumpR1 * 0.3}`, // big bump left
    `A${bumpR4},${bumpR4} 0 0,0 ${w * 0.08},${baseY}`, // close left
    `Z`,
  ].join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={d} fill={color} opacity={opacity} />
    </svg>
  );
}

// ============================================================
// DRAMATIC LIVE WEATHER ANIMATIONS
// ============================================================

function WeatherAnimation({ condition }: { condition: string }) {
  const condLower = condition.toLowerCase();

  // --- SUNNY / CLEAR (day) ---
  if ((condLower.includes("clear") || condLower.includes("sunny")) && !condLower.includes("night")) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <style>{`
          @keyframes sunGlow { 0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.15);opacity:.9} }
          @keyframes sunRaySpin { 0%{transform:rotate(0deg)}100%{transform:rotate(360deg)} }
          @keyframes sunPulse { 0%,100%{box-shadow:0 0 40px 15px rgba(251,191,36,.25),0 0 80px 30px rgba(251,191,36,.1)}50%{box-shadow:0 0 60px 25px rgba(251,191,36,.4),0 0 120px 50px rgba(251,191,36,.15)} }
        `}</style>
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-400"
          style={{ animation: "sunPulse 4s ease-in-out infinite", filter: "blur(1px)" }} />
        <div className="absolute -top-2 -right-2 w-20 h-20 rounded-full border-2 border-amber-300/30"
          style={{ animation: "sunGlow 3s ease-in-out infinite" }} />
        <div className="absolute top-1 right-1 w-24 h-24 opacity-20"
          style={{ animation: "sunRaySpin 20s linear infinite" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute top-1/2 left-1/2 w-0.5 h-12 bg-amber-300 origin-bottom"
              style={{ transform: `translate(-50%, -100%) rotate(${i * 45}deg)` }} />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-orange-500/5 rounded-3xl" />
      </div>
    );
  }

  // --- RAINY / DRIZZLE (day + night) ---
  if (condLower.includes("rain") || condLower.includes("drizzle")) {
    const isNightRain = condLower.includes("night");
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <style>{`
          @keyframes heavyRain { 0%{transform:translateY(-30px) translateX(0);opacity:0}10%{opacity:1}90%{opacity:.9}100%{transform:translateY(320px) translateX(-15px);opacity:0} }
          @keyframes dropSlide { 0%{transform:translateY(0) scaleY(1);opacity:0}20%{opacity:.9}80%{opacity:.7}100%{transform:translateY(90px) scaleY(1.4);opacity:0} }
          @keyframes ripple { 0%{transform:scale(0);opacity:.6;border-width:2px}100%{transform:scale(4);opacity:0;border-width:.5px} }
          @keyframes cloudDrift1 { 0%{transform:translateX(-20px)}50%{transform:translateX(15px)}100%{transform:translateX(-20px)} }
          @keyframes cloudDrift2 { 0%{transform:translateX(10px)}50%{transform:translateX(-15px)}100%{transform:translateX(10px)} }
        `}</style>
        <div className="absolute top-[-2px] left-[-5px]" style={{ animation: "cloudDrift1 8s ease-in-out infinite" }}>
          <CloudShape width={230} height={75} color="rgba(20,30,50,0.85)" opacity={1} />
        </div>
        <div className="absolute top-[12px] right-[-15px]" style={{ animation: "cloudDrift2 10s ease-in-out infinite" }}>
          <CloudShape width={190} height={65} color="rgba(25,35,55,0.75)" opacity={1} />
        </div>
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={`r-${i}`} className="absolute rounded-full"
            style={{
              left: `${(i * 2.8) % 98}%`, top: "-8%",
              width: `${1.5 + (i % 3) * 0.5}px`, height: `${22 + (i % 5) * 10}px`,
              background: `linear-gradient(to bottom, transparent 0%, rgba(147,197,253,0.6) 40%, rgba(96,165,250,0.8) 100%)`,
              animation: `heavyRain ${0.45 + (i % 6) * 0.08}s linear infinite`,
              animationDelay: `${(i * 0.04) % 0.8}s`,
            }} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={`d-${i}`} className="absolute"
            style={{
              left: `${5 + (i * 8) % 88}%`, top: `${10 + (i * 7) % 55}%`,
              width: `${6 + (i % 4) * 3}px`, height: `${8 + (i % 4) * 4}px`,
              background: "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.7), rgba(147,197,253,0.5) 60%, transparent)",
              borderRadius: "40% 40% 50% 50% / 50% 50% 60% 60%",
              animation: `dropSlide ${1.8 + (i % 4) * 0.6}s ease-in infinite`,
              animationDelay: `${i * 0.35}s`,
            }} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`rp-${i}`} className="absolute rounded-full border border-blue-300/40"
            style={{
              left: `${5 + (i * 12) % 90}%`, bottom: `${2 + (i * 3) % 12}%`,
              width: "8px", height: "8px",
              animation: `ripple ${1.2 + (i % 3) * 0.4}s ease-out infinite`,
              animationDelay: `${i * 0.25}s`,
            }} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800/30 via-blue-900/20 to-slate-900/30 rounded-3xl" />
      </div>
    );
  }

  // --- THUNDERSTORM ---
  if (condLower.includes("thunder")) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <style>{`
          @keyframes boltFlash1 { 0%,100%{opacity:0}3%{opacity:1}4%{opacity:.1}5%{opacity:.9}7%{opacity:0}40%{opacity:0}41%{opacity:.7}42%{opacity:0} }
          @keyframes boltFlash2 { 0%,100%{opacity:0}20%{opacity:0}21%{opacity:1}23%{opacity:.2}24%{opacity:.8}26%{opacity:0} }
          @keyframes stormRain { 0%{transform:translateY(-25px) translateX(0);opacity:0}8%{opacity:1}100%{transform:translateY(320px) translateX(-20px);opacity:0} }
          @keyframes stormDrift1 { 0%{transform:translateX(0)}50%{transform:translateX(12px)}100%{transform:translateX(0)} }
          @keyframes stormDrift2 { 0%{transform:translateX(0)}50%{transform:translateX(-10px)}100%{transform:translateX(0)} }
        `}</style>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/60 via-slate-900/50 to-purple-950/70 rounded-3xl" />
        {/* MASSIVE dark storm clouds */}
        <div className="absolute top-[-2px] left-[-5px]" style={{ animation: "stormDrift1 6s ease-in-out infinite" }}>
          <CloudShape width={280} height={85} color="rgba(10,15,30,0.9)" opacity={1} />
        </div>
        <div className="absolute top-[10px] right-[-25px]" style={{ animation: "stormDrift2 7s ease-in-out infinite" }}>
          <CloudShape width={210} height={72} color="rgba(15,20,35,0.85)" opacity={1} />
        </div>
        {/* BOLTS — large, bright */}
        <div className="absolute top-0 left-[28%] w-20 h-full opacity-0"
          style={{ animation: "boltFlash1 5s ease infinite" }}>
          <svg viewBox="0 0 70 250" className="w-full h-full"
            style={{ filter: "drop-shadow(0 0 20px rgba(251,191,36,0.9)) drop-shadow(0 0 40px rgba(255,255,255,0.4))" }}>
            <polygon points="35,0 28,55 42,48 20,120 48,108 25,180 50,165 18,250 55,155 22,160 45,95 25,100 40,45 22,50 38,0"
              fill="rgba(255,255,200,0.95)" stroke="rgba(255,255,255,0.8)" strokeWidth="1" />
          </svg>
        </div>
        <div className="absolute top-0 right-[18%] w-14 h-[85%] opacity-0"
          style={{ animation: "boltFlash2 5s ease infinite" }}>
          <svg viewBox="0 0 50 220" className="w-full h-full"
            style={{ filter: "drop-shadow(0 0 15px rgba(251,191,36,0.8))" }}>
            <polygon points="25,0 18,45 32,40 12,100 35,88 20,155 38,145 15,220"
              fill="rgba(255,255,200,0.9)" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-white/0 rounded-3xl" style={{ animation: "boltFlash1 5s ease infinite" }} />
        {/* HEAVY storm rain */}
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={`tr-${i}`} className="absolute rounded-full"
            style={{
              left: `${(i * 2.5) % 98}%`, top: "-8%",
              width: `${2 + (i % 3) * 0.5}px`, height: `${20 + (i % 5) * 8}px`,
              background: `linear-gradient(to bottom, transparent 0%, rgba(147,197,253,0.5) 30%, rgba(96,165,250,0.7) 100%)`,
              animation: `stormRain ${0.35 + (i % 6) * 0.06}s linear infinite`,
              animationDelay: `${(i * 0.03) % 0.6}s`,
            }} />
        ))}
      </div>
    );
  }

  // --- CLOUDY / FOGGY ---
  if (condLower.includes("cloud") || condLower.includes("fog")) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <style>{`
          @keyframes cDrift1 { 0%{transform:translateX(-30px)}50%{transform:translateX(25px)}100%{transform:translateX(-30px)} }
          @keyframes cDrift2 { 0%{transform:translateX(20px)}50%{transform:translateX(-25px)}100%{transform:translateX(20px)} }
          @keyframes cDrift3 { 0%{transform:translateX(-15px) translateY(3px)}50%{transform:translateX(20px) translateY(-2px)}100%{transform:translateX(-15px) translateY(3px)} }
          @keyframes cDrift4 { 0%{transform:translateX(10px) translateY(-2px)}50%{transform:translateX(-18px) translateY(3px)}100%{transform:translateX(10px) translateY(-2px)} }
        `}</style>
        <div className="absolute top-[-2px] left-[-5px]" style={{ animation: "cDrift1 10s ease-in-out infinite" }}>
          <CloudShape width={250} height={85} color="rgba(30,58,95,0.7)" opacity={1} />
        </div>
        <div className="absolute top-[18px] right-[-10px]" style={{ animation: "cDrift2 12s ease-in-out infinite" }}>
          <CloudShape width={210} height={75} color="rgba(35,65,105,0.6)" opacity={1} />
        </div>
        <div className="absolute bottom-[25px] left-[10px]" style={{ animation: "cDrift3 14s ease-in-out infinite" }}>
          <CloudShape width={170} height={65} color="rgba(25,50,85,0.5)" opacity={1} />
        </div>
        <div className="absolute top-[40px] left-[30%]" style={{ animation: "cDrift4 11s ease-in-out infinite" }}>
          <CloudShape width={140} height={55} color="rgba(30,55,90,0.45)" opacity={1} />
        </div>
      </div>
    );
  }

  // --- PARTLY CLOUDY (day) ---
  if (condLower.includes("part") && !condLower.includes("night")) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <style>{`
          @keyframes pcSunPulse { 0%,100%{box-shadow:0 0 30px 10px rgba(251,191,36,.25);transform:scale(1)}50%{box-shadow:0 0 50px 20px rgba(251,191,36,.4);transform:scale(1.08)} }
          @keyframes pcDrift1 { 0%{transform:translateX(-20px)}50%{transform:translateX(15px)}100%{transform:translateX(-20px)} }
          @keyframes pcDrift2 { 0%{transform:translateX(15px)}50%{transform:translateX(-18px)}100%{transform:translateX(15px)} }
        `}</style>
        <div className="absolute -top-4 -right-2 w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-400"
          style={{ animation: "pcSunPulse 4s ease-in-out infinite", filter: "blur(2px)" }} />
        <div className="absolute top-[5px] right-[-5px]" style={{ animation: "pcDrift1 9s ease-in-out infinite" }}>
          <CloudShape width={170} height={70} color="rgba(30,58,95,0.6)" opacity={1} />
        </div>
        <div className="absolute bottom-[35px] left-[5px]" style={{ animation: "pcDrift2 12s ease-in-out infinite" }}>
          <CloudShape width={140} height={58} color="rgba(35,62,100,0.45)" opacity={1} />
        </div>
      </div>
    );
  }

  // --- NIGHT CLOUDY ---
  if (condLower.includes("cloud") && condLower.includes("night")) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <style>{`
          @keyframes nCloudDrift1 { 0%{transform:translateX(-30px)}50%{transform:translateX(25px)}100%{transform:translateX(-30px)} }
          @keyframes nCloudDrift2 { 0%{transform:translateX(20px)}50%{transform:translateX(-25px)}100%{transform:translateX(20px)} }
          @keyframes twinkle { 0%,100%{opacity:.2}50%{opacity:.7} }
        `}</style>
        <div className="absolute top-[-2px] left-[-5px]" style={{ animation: "nCloudDrift1 10s ease-in-out infinite" }}>
          <CloudShape width={250} height={85} color="rgba(20,30,60,0.85)" opacity={1} />
        </div>
        <div className="absolute top-[18px] right-[-10px]" style={{ animation: "nCloudDrift2 12s ease-in-out infinite" }}>
          <CloudShape width={210} height={75} color="rgba(25,35,70,0.75)" opacity={1} />
        </div>
        {/* Stars peeking through clouds */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={`ns-${i}`} className="absolute w-1 h-1 rounded-full bg-indigo-200"
            style={{
              left: `${4 + (i * 9.1) % 90}%`,
              top: `${5 + (i * 7.3) % 40}%`,
              opacity: 0.2 + (i % 3) * 0.2,
              animation: `twinkle ${(3 + (i % 4) * 0.5)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.4) % 5}s`,
            }} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-indigo-950/10 to-indigo-900/20 rounded-3xl" />
      </div>
    );
  }
  // --- NIGHT CLOUDY ---
  if (condLower.includes("cloud") && condLower.includes("night")) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <style>{`
          @keyframes nCloudDrift1 { 0%{transform:translateX(-30px)}50%{transform:translateX(25px)}100%{transform:translateX(-30px)} }
          @keyframes nCloudDrift2 { 0%{transform:translateX(20px)}50%{transform:translateX(-25px)}100%{transform:translateX(20px)} }
          @keyframes twinkle { 0%,100%{opacity:.2}50%{opacity:.7} }
        `}</style>
        <div className="absolute top-[-2px] left-[-5px]" style={{ animation: "nCloudDrift1 10s ease-in-out infinite" }}>
          <CloudShape width={250} height={85} color="rgba(20,30,60,0.85)" opacity={1} />
        </div>
        <div className="absolute top-[18px] right-[-10px]" style={{ animation: "nCloudDrift2 12s ease-in-out infinite" }}>
          <CloudShape width={210} height={75} color="rgba(25,35,70,0.75)" opacity={1} />
        </div>
        {/* Stars peeking through clouds */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={`ns-${i}`} className="absolute w-1 h-1 rounded-full bg-indigo-200"
            style={{
              left: `${4 + (i * 9.1) % 90}%`,
              top: `${5 + (i * 7.3) % 40}%`,
              opacity: 0.2 + (i % 3) * 0.2,
              animation: `twinkle ${(3 + (i % 4) * 0.5)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.4) % 5}s`,
            }} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-indigo-950/10 to-indigo-900/20 rounded-3xl" />
      </div>
    );
  }
  // --- CLOUDY / FOGGY (day) ---
  if (condLower.includes("cloud") || condLower.includes("fog")) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <style>{`
          @keyframes cDrift1 { 0%{transform:translateX(-30px)}50%{transform:translateX(25px)}100%{transform:translateX(-30px)} }
          @keyframes cDrift2 { 0%{transform:translateX(20px)}50%{transform:translateX(-25px)}100%{transform:translateX(20px)} }
          @keyframes cDrift3 { 0%{transform:translateX(-15px) translateY(3px)}50%{transform:translateX(20px) translateY(-2px)}100%{transform:translateX(-15px) translateY(3px)} }
          @keyframes cDrift4 { 0%{transform:translateX(10px) translateY(-2px)}50%{transform:translateX(-18px) translateY(3px)}100%{transform:translateX(10px) translateY(-2px)} }
        `}</style>
        <div className="absolute top-[-2px] left-[-5px]" style={{ animation: "cDrift1 10s ease-in-out infinite" }}>
          <CloudShape width={250} height={85} color="rgba(30,58,95,0.7)" opacity={1} />
        </div>
        <div className="absolute top-[18px] right-[-10px]" style={{ animation: "cDrift2 12s ease-in-out infinite" }}>
          <CloudShape width={210} height={75} color="rgba(35,65,105,0.6)" opacity={1} />
        </div>
        <div className="absolute bottom-[25px] left-[10px]" style={{ animation: "cDrift3 14s ease-in-out infinite" }}>
          <CloudShape width={170} height={65} color="rgba(25,50,85,0.5)" opacity={1} />
        </div>
        <div className="absolute top-[40px] left-[30%]" style={{ animation: "cDrift4 11s ease-in-out infinite" }}>
          <CloudShape width={140} height={55} color="rgba(30,55,90,0.45)" opacity={1} />
        </div>
      </div>
    );
  }
  // --- SNOW ---
  if (condLower.includes("snow")) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <style>{` @keyframes snowFall { 0%{transform:translateY(-10px) translateX(0) rotate(0deg);opacity:0}10%{opacity:1}100%{transform:translateY(220px) translateX(20px) rotate(360deg);opacity:.3} } `}</style>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={`s-${i}`} className="absolute rounded-full bg-white"
            style={{
              left: `${5 + (i * 6.5) % 90}%`, top: "-5%",
              width: `${3 + (i % 3) * 2}px`, height: `${3 + (i % 3) * 2}px`,
              opacity: 0.6 + (i % 3) * 0.15,
              animation: `snowFall ${2 + (i % 4) * 0.8}s linear infinite`,
              animationDelay: `${(i * 0.2) % 3}s`,
            }} />
        ))}
      </div>
    );
  }

  // --- CLEAR NIGHT (moon) ---
  if (condLower.includes("clear") && condLower.includes("night")) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <style>{`
          @keyframes moonGlow { 0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.7;transform:scale(1.08)} }
          @keyframes twinkle { 0%,100%{opacity:.3}50%{opacity:1} }
        `}</style>
        {/* Big soft moon glow */}
        <div className="absolute top-3 right-3 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-200 via-indigo-300 to-indigo-400"
          style={{ animation: "moonGlow 5s ease-in-out infinite", filter: "blur(1px)" }} />
        {/* Moon disc */}
        <div className="absolute top-3 right-3 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-100 via-indigo-100 to-indigo-300"
          style={{ animation: "moonGlow 5s ease-in-out infinite" }} />
        {/* Twinkling stars */}
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={`star-${i}`} className="absolute w-1 h-1 rounded-full bg-white"
            style={{
              left: `${3 + (i * 5.3) % 92}%`,
              top: `${4 + (i * 6.1) % 60}%`,
              opacity: 0.3 + (i % 3) * 0.3,
              animation: `twinkle ${(2 + (i % 4) * 0.7)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.3) % 4}s`,
            }} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-indigo-900/15 to-indigo-950/40 rounded-3xl" />
      </div>
    );
  }

  return null;
}

// --- Weather Icon Selector ---
function WeatherIcon({ condition }: { condition: string }) {
  const condLower = condition.toLowerCase();
  // --- CLEAR NIGHT ---
  if (condLower.includes("clear") && condLower.includes("night")) {
    return (
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-300/20 to-indigo-500/15 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 36 36">
          {/* Crescent moon */}
          <path d="M22 8a9 9 0 1 0 0 18 8.5 8.5 0 0 0 0-17z" fill="#E0E7FF" />
          {/* Stars */}
          {Array.from({ length: 4 }).map((_, i) => (
            <circle key={i} cx={6 + i * 4} cy={5 + (i * 3) % 20} r="0.8"
              fill="#C7D2FE" opacity={0.7 + (i % 3) * 0.1} />
          ))}
        </svg>
      </div>
    );
  }
  if (condLower.includes("clear") || condLower.includes("sunny")) {
    return (
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300/20 to-orange-400/20 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="8" fill="#FBBF24" />
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i} x1="18" y1="2" x2="18" y2="6" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"
              transform={`rotate(${i * 45} 18 18)`} />
          ))}
        </svg>
      </div>
    );
  }
  if (condLower.includes("rain") || condLower.includes("drizzle")) {
    return (
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400/20 to-blue-600/20 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 36 36">
          <path d="M8 18a8 8 0 0 1 16 0h2a5 5 0 0 1 0 10H6a5 5 0 0 1 0-10h2z" fill="#60A5FA" opacity="0.8" />
          <line x1="12" y1="28" x2="10" y2="34" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="18" y1="28" x2="16" y2="34" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="24" y1="28" x2="22" y2="34" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (condLower.includes("thunder")) {
    return (
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400/20 to-slate-600/20 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 36 36">
          <path d="M8 16a8 8 0 0 1 16 0h2a5 5 0 0 1 0 10H6a5 5 0 0 1 0-10h2z" fill="#8B5CF6" opacity="0.7" />
          <polygon points="18,18 15,26 20,24 14,34 22,25 17,27 22,18" fill="#FBBF24" />
        </svg>
      </div>
    );
  }
  if (condLower.includes("cloud") && condLower.includes("part")) {
    return (
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300/15 to-blue-400/15 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="14" cy="14" r="6" fill="#FBBF24" opacity="0.7" />
          <path d="M10 22a6 6 0 0 1 12 0h1a4 4 0 0 1 0 8H9a4 4 0 0 1 0-8h1z" fill="#93C5FD" opacity="0.7" />
        </svg>
      </div>
    );
  }
  if (condLower.includes("cloud") || condLower.includes("fog")) {
    return (
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-300/20 to-blue-400/15 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 36 36">
          <path d="M8 20a7 7 0 0 1 14 0h1.5a4.5 4.5 0 0 1 0 9H6.5a4.5 4.5 0 0 1 0-9H8z" fill="#94A3B8" opacity="0.6" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
      <svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="8" fill="#FBBF24" /></svg>
    </div>
  );
}

// ============================================================
// MAIN WEATHER WIDGET
// ============================================================

export default function WeatherWidget({ showForecast = true, variant = "solid" }: WeatherWidgetProps) {
  const { city, district, state, latitude, longitude, refreshLocation } = useLocation();
  const { t } = useLanguage();
  const [weather, setWeather] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    const lat = latitude || 28.6139;
    const lon = longitude || 77.2090;
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,rain_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=5`
      );
      if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
      const data = await res.json();
      const currentCode = data.current?.weather_code ?? 0;
      // Open-Meteo returns is_day: 1 (day) or 0 (night) — key for correct day/night display
      const apiIsDay = data.current?.is_day === 1;
      const condInfo = getWMOCondition(currentCode, apiIsDay);
      const current = {
        temp: Math.round(data.current?.temperature_2m ?? 28),
        condition: condInfo.condition,
        humidity: data.current?.relative_humidity_2m ?? 60,
        windSpeed: Math.round(data.current?.wind_speed_10m ?? 10),
        rainfallChance: data.current?.rain_probability ?? 15,
        isDay: apiIsDay,
      };
      const forecast = (data.daily?.time ?? []).map((dateStr: string, i: number) => {
        const dayCode = data.daily?.weather_code?.[i] ?? 0;
        const dayCond = getWMOCondition(dayCode);
        return {
          day: getDayLabel(i, t),
          temp: Math.round(data.daily?.temperature_2m_max?.[i] ?? 30),
          condition: dayCond.condition,
          rain: data.daily?.precipitation_probability_max?.[i] ?? 10,
        };
      });
      let advisory = "";
      if (current.rainfallChance > 60) advisory = t("advisoryHeavyRain") || "Heavy rainfall expected.";
      else if (current.rainfallChance > 30) advisory = t("advisoryLightRain") || "Light rain possible.";
      else if (current.temp > 38) advisory = t("advisoryHot") || "Very hot today.";
      else if (current.condition === "Clear" && current.humidity < 50) advisory = t("advisoryGood") || "Good weather for fertilizer.";
      else advisory = t("advisoryFavorable") || "Favorable weather for field preparation.";
      setWeather({ current, forecast, advisory });
      // Persist today's snapshot to the weather history database (last 10 days)
      try {
        await saveWeatherSnapshot({
          city: city || "Delhi",
          district: district || "New Delhi",
          state: state || "Delhi",
          weather_date: todayStr(),
          temperature: current.temp,
          humidity: current.humidity,
          wind_speed: current.windSpeed,
          rainfall_chance: current.rainfallChance,
          condition: current.condition,
          forecast_data: forecast,
        });
      } catch {
        // snapshot save is non-critical
      }
    } catch (err) {
      console.warn("Open-Meteo failed:", err);
      setError("Weather data temporarily unavailable");
      setWeather({
        // If the API fails, use local time to decide day vs night
        current: { temp: 29, condition: isNightTime() ? "Clear Night" : "Partly Cloudy", humidity: 65, windSpeed: 12, rainfallChance: 20, isDay: !isNightTime() },
        forecast: Array.from({ length: 5 }, (_, i) => ({
          day: getDayLabel(i, t), temp: 30 + Math.round(Math.random() * 5 - 2),
          condition: i === 0 && isNightTime() ? "Clear Night" : ["Clear", "Partly Cloudy", "Clear", "Cloudy", "Clear"][i], rain: [5, 15, 10, 30, 5][i],
        })),
        advisory: t("advisoryFavorable") || "Favorable weather.",
      });
    } finally {
      setLoading(false);
    }
  }, [city, latitude, longitude, t]);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  const glass = variant === "glass";

  if (loading) {
    return (
      <div
        className={`rounded-2xl p-6 border text-white flex items-center justify-center min-h-[160px] ${
          glass
            ? "liquid-glass border-white/40"
            : "bg-gradient-to-br from-sky-500 via-blue-500 to-blue-600 backdrop-blur-md border-white/20"
        }`}
      >
        <RefreshCw className="w-6 h-6 animate-spin text-white" />
      </div>
    );
  }

  const resolvedCity = city || "Delhi";
  const resolvedDistrict = district || "New Delhi";
  const resolvedState = state || "Delhi";
  const current = weather?.current || { temp: 29, condition: "Partly Cloudy", humidity: 65, windSpeed: 12, rainfallChance: 20 };
  const forecast = weather?.forecast || [];
  const advisory = weather?.advisory || "";
  const conditionLabel = getConditionLabel(current.condition, t);

  const condLower = current.condition.toLowerCase();
  const isNight = condLower.includes("night");
  let bgClass = "bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600";
  if (condLower.includes("clear") && isNight) bgClass = "bg-gradient-to-br from-indigo-800 via-indigo-900 to-indigo-950";
  else if (condLower.includes("clear") || condLower.includes("sunny")) bgClass = "bg-gradient-to-br from-sky-400 via-blue-400 to-blue-500";
  else if (condLower.includes("thunder")) bgClass = "bg-gradient-to-br from-slate-800 via-purple-950 to-slate-900";
  else if (condLower.includes("rain") || condLower.includes("drizzle")) bgClass = isNight
    ? "bg-gradient-to-br from-indigo-800 via-slate-800 to-indigo-950"
    : "bg-gradient-to-br from-slate-600 via-blue-800 to-slate-800";
  else if (condLower.includes("cloud") && condLower.includes("part")) bgClass = isNight
    ? "bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900"
    : "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700";
  else if (condLower.includes("cloud") || condLower.includes("fog")) bgClass = isNight
    ? "bg-gradient-to-br from-indigo-800 via-slate-800 to-indigo-950"
    : "bg-gradient-to-br from-blue-700 via-blue-800 to-slate-800";
  else if (condLower.includes("snow")) bgClass = "bg-gradient-to-br from-blue-400 via-blue-500 to-slate-500";

  return (
    <div
      className={`${
        glass
          ? "liquid-glass"
          : `${bgClass} backdrop-blur-md`
      } rounded-3xl p-6 text-white border shadow-xl space-y-5 relative overflow-hidden ${
        glass ? "border-white/40" : "border-white/20"
      }`}
    >
      <WeatherAnimation condition={current.condition} />

      {/* Location header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-white/15 text-white">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">{resolvedCity}, {resolvedState}</h3>
            <p className="text-[11px] text-white/70 font-medium">{t("district")}: {resolvedDistrict}</p>
          </div>
        </div>
        <button onClick={() => { refreshLocation(); fetchWeather(); }}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title={t("refresh") || "Refresh"}>
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Current weather */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <div className="text-4xl font-extrabold tracking-tight">{current.temp}&deg;C</div>
          <div className="text-xs font-semibold text-white/80 mt-1">{conditionLabel}</div>
        </div>
        <WeatherIcon condition={current.condition} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-2xl bg-black/20 text-center text-xs relative z-10">
        <div>
          <span className="text-[10px] text-white/60 block">{t("humidityLabel")}</span>
          <span className="font-bold">{current.humidity}%</span>
        </div>
        <div className="border-x border-white/10">
          <span className="text-[10px] text-white/60 block">{t("windLabel")}</span>
          <span className="font-bold">{current.windSpeed} km/h</span>
        </div>
        <div>
          <span className="text-[10px] text-white/60 block">{t("rainChanceLabel")}</span>
          <span className="font-bold">{current.rainfallChance}%</span>
        </div>
      </div>

      {/* Advisory */}
      {advisory && (
        <div className="p-3.5 rounded-2xl bg-white/15 border border-white/20 text-xs leading-relaxed text-white/90 flex items-start gap-2 relative z-10">
          <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{t("farmerAdvisory")}: </span>
            <span>{advisory}</span>
          </div>
        </div>
      )}

      {/* 5-Day Forecast */}
      {showForecast && forecast.length > 0 && (
        <div className="border-t border-white/10 pt-4 space-y-2 relative z-10">
          <h4 className="text-xs font-bold text-white/80">{t("forecast5DayTitle")}</h4>
          <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
            {forecast.map((day: any, i: number) => {
              const dayCondLabel = getConditionLabel(day.condition, t);
              return (
                <div key={i} className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
                  <span className="font-semibold text-slate-300">{day.day}</span>
                  <WeatherIcon condition={day.condition} />
                  <span className="text-xs font-bold text-white">{day.temp}&deg;</span>
                  <span className="text-[9px] text-white/60 truncate w-full">{dayCondLabel}</span>
                  <span className="text-[9px] text-blue-300">{t("rainLabel")} {day.rain}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && <div className="text-[10px] text-amber-300 text-center relative z-10">{error}</div>}
    </div>
  );
}
