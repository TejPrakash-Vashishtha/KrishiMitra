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
    <div className="min-h-screen bg-slate-50">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {t("heroTitle1")} <span className="text-emerald-300">{t("heroTitle2")}</span>
            </h1>

            <p className="text-base sm:text-lg text-emerald-100 max-w-2xl">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <button
                onClick={() => setCameraOpen(true)}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-base shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>{t("openCamera") || "Open Camera"}</span>
              </button>

              <Link
                to="/assistant"
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-base transition-colors"
              >
                <span>{t("aiAssistant")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <MandiPricesBar />
            </div>

            <div className="lg:col-span-5">
              <WeatherWidget showForecast={true} variant="glass" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <Link
              key={i}
              to={f.path}
              className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl ${f.color} text-white flex items-center justify-center mb-4 shadow-md`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-600">{f.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-4">
                <span>{t("explore")}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
