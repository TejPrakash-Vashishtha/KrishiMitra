import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Sprout, Sun, ShoppingBag, Users, ArrowRight, Sparkles, Package, BarChart3, Store, Truck } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import WeatherWidget from "../components/weather/WeatherWidget";
import CameraCaptureModal from "../components/camera/CameraCaptureModal";
import MandiPricesBar from "../components/MandiPricesBar";
import riceFieldBg from "../assets/rice-field.jpg"; // live wallpaper photo

export default function LandingPage() {
  const { t } = useLanguage();
  const [cameraOpen, setCameraOpen] = useState(false);
  const navigate = useNavigate();

  const handleCapture = (dataUrl: string) => {
    sessionStorage.setItem("km_pending_image", dataUrl);
    navigate("/analyze");
  };

  const features = [
    {
      path: "/analyze",
      title: t("feature1Title"),
      desc: t("feature1Desc"),
      icon: Camera,
      color: "bg-emerald-500",
    },
    {
      path: "/soil-analysis",
      title: t("feature2Title"),
      desc: t("feature2Desc"),
      icon: Sprout,
      color: "bg-amber-500",
    },
    {
      path: "/weather",
      title: t("feature3Title"),
      desc: t("feature3Desc"),
      icon: Sun,
      color: "bg-sky-500",
    },
    {
      path: "/inventory",
      title: t("feature4Title"),
      desc: t("feature4Desc"),
      icon: Package,
      color: "bg-orange-500",
    },
    {
      path: "/mandi-prices",
      title: t("feature5Title"),
      desc: t("feature5Desc"),
      icon: BarChart3,
      color: "bg-blue-600",
    },
    {
      path: "/products",
      title: t("feature6Title"),
      desc: t("feature6Desc"),
      icon: ShoppingBag,
      color: "bg-violet-500",
    },
    {
      path: "/dealers",
      title: t("feature7Title"),
      desc: t("feature7Desc"),
      icon: Users,
      color: "bg-teal-500",
    },
    {
      path: "/marketplace",
      title: t("feature8Title"),
      desc: t("feature8Desc"),
      icon: Store,
      color: "bg-violet-600",
    },
    {
      path: "/supply-chain",
      title: t("feature9Title"),
      desc: t("feature9Desc"),
      icon: Truck,
      color: "bg-indigo-600",
    },
    {
      path: "/assistant",
      title: t("feature10Title"),
      desc: t("feature10Desc"),
      icon: Sparkles,
      color: "bg-green-600",
    },
  ];

  return (
    <div className="min-h-dvh-fill bg-slate-50">
      <div className="relative overflow-hidden text-white pt-0 pb-16 px-4">

        {/* SVG filter that makes the photo's crops sway (turbulence -> displacement) */}
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <filter id="cropWave" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.006 0.012"
              numOctaves={2}
              seed={7}
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="14s"
                values="0.006 0.012;0.009 0.016;0.006 0.012"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={18}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>

        {/* Live background photo (Ken-Burns zoom + wavy filter) — brightened, greener */}
        <div
          className="absolute inset-0 motion-safe:animate-[breathe_22s_ease-in-out_infinite_alternate]"
          style={{
            backgroundImage: `url(${riceFieldBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center 55%",
            filter: "url(#cropWave) saturate(1.28) brightness(1.12) hue-rotate(12deg)",
            willChange: "transform",
          }}
        />

        {/* Lighter scrim — image shows through clearly, text/buttons stay readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,46,33,0.68) 0%, rgba(6,78,59,0.52) 45%, rgba(5,46,22,0.70) 100%)",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Top Liquid Glass Status Pill */}
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 max-w-full px-3.5 py-1.5 rounded-full liquid-glass-pill text-xs font-semibold text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="truncate">Smart Indian Agriculture OS · Kharif & Rabi Sync</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-md">
                {t("heroTitle1")} <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">{t("heroTitle2")}</span>
              </h1>

              <p className="text-base sm:text-lg text-emerald-50/90 max-w-2xl leading-relaxed drop-shadow-xs">
                {t("heroSubtitle")}
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  onClick={() => setCameraOpen(true)}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-green-600 hover:from-emerald-300 hover:to-green-500 active:scale-95 text-slate-950 font-bold text-base shadow-xl shadow-emerald-950/40 transition-all duration-150 cursor-pointer border border-emerald-300/60"
                >
                  <Camera className="w-5 h-5 text-slate-950" />
                  <span>{t("openCamera") || "Diagnose Crop"}</span>
                </button>

                <Link
                  to="/assistant"
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl liquid-glass hover:bg-white/20 active:scale-95 text-white font-semibold text-base transition-all duration-150 shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>{t("aiAssistant")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Mandi Prices Bar rendered in liquid glass */}
              <MandiPricesBar />
            </div>

            <div className="lg:col-span-5">
              <WeatherWidget showForecast={true} variant="glass" />
            </div>
          </div>
        </div>
      </div>

      {/* Extended Liquid Glass Feature Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300/60 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Comprehensive Agri Ecosystem</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Integrated Intelligent Farming Tools
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Every module is tailored for Indian cultivators, mandi traders, and agro-service dealers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <Link
              key={i}
              to={f.path}
              className="group liquid-glass-card rounded-2xl p-6 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl ${f.color} text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform duration-200`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mt-5 pt-3 border-t border-slate-200/50">
                <span>{t("explore")}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <CameraCaptureModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCapture}
      />
    </div>
  );
}
