import React from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Sparkles,
  ArrowRight,
  Store,
  LayoutDashboard,
  Users,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import NearestMandiWidget from "../components/merchant/NearestMandiWidget";
import riceFieldBg from "../assets/rice-field.jpg"; // same live wallpaper as farmer landing

const AI_QUESTIONS = [
  "What crop should I buy this week for best margin?",
  "Tomato is ₹1,800/q at my mandi — is it a good buy today?",
  "How much should I offer a farmer below mandi rate?",
  "Which crop has the highest demand this season?",
];

const QUICK_ACTIONS = [
  {
    path: "/merchant/search",
    title: "Find Crops to Buy",
    desc: "Search any crop, vegetable or fruit and see nearby farmers with live stock, grades and prices.",
    icon: Search,
    color: "bg-emerald-500",
  },
  {
    path: "/merchant/dashboard",
    title: "My Purchase Dashboard",
    desc: "Everything you've bought, how much you've spent, and your full deal history in one place.",
    icon: LayoutDashboard,
    color: "bg-violet-500",
  },
  {
    path: "/merchant/contacts",
    title: "B2B Contacts",
    desc: "Direct phone and WhatsApp contacts of registered farmers near you — reach them in one tap.",
    icon: Users,
    color: "bg-teal-500",
  },
];

/**
 * Merchant landing page — same live rice-field wallpaper as the farmer
 * landing page, but a completely separate experience: no weather widget,
 * no farmer features. Hero + nearest-mandi widget + AI Trade Advisor.
 */
export default function MerchantLandingPage() {
  const scrollToAI = () => {
    document.getElementById("ai-trade-advisor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero — identical background treatment to the farmer landing page */}
      <div className="relative overflow-hidden text-white pt-0 pb-16 px-4">
        {/* SVG filter that makes the photo's crops sway (same as farmer page) */}
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <filter id="merchantCropWave" x="-20%" y="-20%" width="140%" height="140%">
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
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={18} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        <div
          className="absolute inset-0 motion-safe:animate-[breathe_22s_ease-in-out_infinite_alternate]"
          style={{
            backgroundImage: `url(${riceFieldBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center 55%",
            filter: "url(#merchantCropWave) saturate(1.28) brightness(1.12) hue-rotate(12deg)",
            willChange: "transform",
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,46,33,0.68) 0%, rgba(6,78,59,0.52) 45%, rgba(5,46,22,0.70) 100%)",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-10">
            {/* Left: merchant hero */}
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/30 border border-violet-300/30 text-violet-100 text-[11px] font-bold tracking-widest uppercase">
                <Store className="w-3 h-3" />
                Merchant Hub
              </span>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Buy Smart. <span className="text-emerald-300">Sell More.</span>
              </h1>

              <p className="text-base sm:text-lg text-emerald-100 max-w-2xl">
                Buy produce directly from verified farmers near you at the right price. Search live crop
                stock, compare mandi rates, and let AI guide every deal — fair for you, fair for the farmer.
              </p>

              <div className="flex flex-wrap items-center gap-3.5">
                <Link
                  to="/merchant/search"
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-base shadow-lg shadow-emerald-900/40 transition-all"
                >
                  <Search className="w-5 h-5" />
                  <span>Find Crops</span>
                </Link>

                <button
                  onClick={scrollToAI}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-base transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI Advisor</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: nearest mandi prices (same data as farmer world) */}
            <div className="lg:col-span-5">
              <NearestMandiWidget />
            </div>
          </div>
        </div>
      </div>

      {/* AI Trade Advisor — middle of the landing page (not in the navbar) */}
      <div id="ai-trade-advisor" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-7 sm:p-10 shadow-xl">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${riceFieldBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center 60%",
            }}
          />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold tracking-widest uppercase">
                <Sparkles className="w-3 h-3" />
                AI Trade Advisor
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Your personal <span className="text-emerald-300">profit strategist</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
                Ask anything about your trade: what to buy, the fair rate to offer against today's mandi
                price, margin maths, and demand trends — advice that keeps your profit healthy while the
                farmer earns fairly too.
              </p>
              <div className="flex flex-wrap gap-2">
                {AI_QUESTIONS.map((q, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] text-slate-200"
                  >
                    "{q}"
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Full chat arrives in the next update — grounded in live mandi prices.
              </p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
                <ShieldCheck className="w-5 h-5 text-emerald-300 mb-2" />
                <p className="text-xs font-bold">Fair-Rate Guidance</p>
                <p className="text-[11px] text-slate-300 mt-1">Offers benchmarked against live mandi rates</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
                <TrendingUp className="w-5 h-5 text-emerald-300 mb-2" />
                <p className="text-xs font-bold">Margin Maths</p>
                <p className="text-[11px] text-slate-300 mt-1">Buy price → resale profit, calculated for you</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Merchant quick actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {QUICK_ACTIONS.map((f, i) => (
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
                <span>Open</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
