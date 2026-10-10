import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Radio, Wrench, Satellite, Sparkles, Check, ShieldCheck,
  IndianRupee, Loader2, Smartphone, BadgeCheck, ArrowLeft,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import {
  PLAN_PRICE_INR, fetchSubscription, activateSubscription, isSubscriptionActive,
  type SubscriptionRow,
} from "../lib/subscriptionData";

/**
 * KrishiMitra Pro — ₹999/year.
 * Full physical soil & moisture sensor kit installed by our team, ongoing
 * land-data reports, and unlimited access to every AI feature.
 *
 * Payment: a Razorpay Payment Page (hosted, UPI/cards/netbanking) opened in a
 * new tab keeps this fully static-hosting compatible. The plan activates on
 * return via the "I have paid" confirmation, and persists to Supabase.
 */

const RAZORPAY_PAYMENT_PAGE_URL = import.meta.env.VITE_RAZORPAY_PAYMENT_PAGE_URL || "";

const BENEFITS = [
  {
    icon: Radio,
    title: "Full Sensor Kit in Your Field",
    desc: "A complete physical kit — soil moisture at two depths, soil temperature, salinity (EC) and ambient humidity — placed in your own field, not estimates.",
    accent: "emerald",
  },
  {
    icon: Wrench,
    title: "We Install, We Maintain",
    desc: "Our team visits your farm, installs and calibrates the entire kit, and services it whenever needed — free for the whole year. Zero effort for you.",
    accent: "amber",
  },
  {
    icon: Satellite,
    title: "Land Data, Delivered Regularly",
    desc: "Time-to-time reports on your soil health, moisture trends and crop conditions — in simple language, right here in the app.",
    accent: "blue",
  },
  {
    icon: Sparkles,
    title: "Unlimited AI Access",
    desc: "Every AI feature unlocked with no limits — crop doctor, digital twin, what-if simulator, AI advisory and the knowledge assistant.",
    accent: "violet",
  },
];

const ACCENTS: Record<string, { chip: string; iconWrap: string; bar: string }> = {
  emerald: { chip: "bg-emerald-50 text-emerald-700 border-emerald-100", iconWrap: "bg-emerald-600", bar: "from-emerald-500 to-green-400" },
  amber: { chip: "bg-amber-50 text-amber-700 border-amber-100", iconWrap: "bg-amber-500", bar: "from-amber-500 to-yellow-400" },
  blue: { chip: "bg-blue-50 text-blue-700 border-blue-100", iconWrap: "bg-blue-600", bar: "from-blue-500 to-cyan-400" },
  violet: { chip: "bg-violet-50 text-violet-700 border-violet-100", iconWrap: "bg-violet-600", bar: "from-violet-500 to-fuchsia-400" },
};

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [checking, setChecking] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!user) { setChecking(false); return; }
    fetchSubscription(user.id)
      .then((s) => { if (alive) setSub(s); })
      .finally(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, [user]);

  const active = isSubscriptionActive(sub);

  const startPayment = () => {
    if (!user) {
      navigate("/login?returnTo=/subscription");
      return;
    }
    setPaying(true);
    const ref = `agn_${user.id.slice(0, 8)}_${Date.now()}`;
    if (RAZORPAY_PAYMENT_PAGE_URL) {
      // Hosted Razorpay Payment Page — UPI, cards, netbanking, wallets.
      window.open(RAZORPAY_PAYMENT_PAGE_URL, "_blank", "noopener");
      setTimeout(() => setPaying(false), 1500);
    } else {
      // No payment page configured yet — record intent and confirm activation.
      activateSubscription(user.id, ref)
        .then((row) => {
          setSub(row);
          setPaying(false);
        })
        .catch(() => setPaying(false));
    }
  };

  const confirmPaid = async () => {
    if (!user) return;
    setPaying(true);
    const ref = `manual_${user.id.slice(0, 8)}_${Date.now()}`;
    const row = await activateSubscription(user.id, ref);
    setSub(row);
    setPaying(false);
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-emerald-50/60 via-white to-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 mb-5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold uppercase tracking-wide mb-3">
            <BadgeCheck className="w-3.5 h-3.5" /> KrishiMitra Pro
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Your land, monitored. Your AI, unlimited.
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl mx-auto">
            A full sensor kit installed in your soil by our team — plus a year of unlimited access to every AI feature AgriNexus offers.
          </p>
          <div className="mt-4 inline-flex items-baseline gap-1.5">
            <IndianRupee className="w-6 h-6 text-emerald-600 relative top-0.5" />
            <span className="text-4xl font-extrabold text-slate-900">999</span>
            <span className="text-sm font-semibold text-slate-400">/ year</span>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-emerald-700">That's less than ₹3 a day for a fully instrumented farm.</p>
        </div>

        {/* Active banner */}
        {checking ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /></div>
        ) : active ? (
          <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
            <p className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-800">
              <ShieldCheck className="w-5 h-5" /> Subscription active — sensors scheduled for installation
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              {sub?.sensor_install_status === "installed"
                ? "Sensors are live on your farm — land data reports are flowing."
                : sub?.sensor_install_status === "installing"
                  ? "Our team is installing your sensors now."
                  : "Our team will contact you within 48 hours to schedule sensor installation."}
              {sub?.current_period_end && ` Renews on ${new Date(sub.current_period_end).toLocaleDateString("en-IN")}.`}
            </p>
          </div>
        ) : null}

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {BENEFITS.map((b) => {
            const a = ACCENTS[b.accent];
            return (
              <div key={b.title} className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${a.bar}`} />
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${a.iconWrap} text-white flex items-center justify-center shrink-0 shadow-md`}>
                    <b.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{b.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* What's included list */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Everything included</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {[
              "Soil-moisture sensors at 2 depths (30 cm & 60 cm)",
              "Soil temperature sensor",
              "Soil salinity (EC) sensor",
              "Ambient temperature & humidity sensor",
              "On-farm installation & calibration of the full kit",
              "Free sensor maintenance & battery replacement all year",
              "Weekly land-health report in your language",
              "Live sensor data in your Digital Twin & What-If simulator",
              "Unlimited crop-doctor scans & AI advisory",
              "Unlimited AI assistant conversations",
              "Priority support on WhatsApp",
              "Cancel anytime — no lock-in",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-600 to-green-600 p-6 sm:p-8 text-center shadow-lg shadow-emerald-500/20">
          <p className="text-white font-extrabold text-lg">Subscribe to KrishiMitra Pro</p>
          <p className="text-emerald-100 text-xs mt-1">₹999/year · full sensor kit + installation + land data + unlimited AI</p>
          {!user && (
            <p className="text-emerald-100 text-xs mt-2 font-semibold">
              You'll be asked to log in first so we know whose farm to equip.
            </p>
          )}
          <button
            onClick={startPayment}
            disabled={paying}
            className="mt-4 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-emerald-700 font-extrabold text-sm shadow-md hover:bg-emerald-50 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
            {paying ? "Opening payment…" : `Subscribe — ₹${PLAN_PRICE_INR}/month`}
          </button>
          {user && !active && !paying && (
            <button
              onClick={confirmPaid}
              className="mt-3 block mx-auto text-emerald-100 text-xs font-semibold underline underline-offset-2 hover:text-white cursor-pointer"
            >
              Already paid? Activate now
            </button>
          )}
          <p className="mt-3 text-[11px] text-emerald-100/80">
            Secure payment via UPI, cards & netbanking · GST invoice provided
          </p>
        </div>
      </div>
    </div>
  );
}
