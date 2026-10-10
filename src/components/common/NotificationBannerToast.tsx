import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CloudRain, TrendingUp, Bug, X, ArrowRight } from "lucide-react";
import { useNotifications } from "../../contexts/NotificationContext";

export default function NotificationBannerToast() {
  const { bannerAlert, dismissBannerAlert, markAsRead } = useNotifications();

  React.useEffect(() => {
    if (bannerAlert) {
      const timer = setTimeout(() => {
        dismissBannerAlert();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [bannerAlert, dismissBannerAlert]);

  if (!bannerAlert) return null;

  const isCritical = bannerAlert.priority === "critical";

  return (
    <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 animate-slide-down pointer-events-auto">
      <div
        className={`rounded-2xl p-3 sm:p-3.5 shadow-2xl border backdrop-blur-xl transition-all ${
          isCritical
            ? "bg-rose-950/95 text-white border-rose-500/50 shadow-rose-950/50"
            : "bg-slate-900/95 text-white border-emerald-500/40 shadow-slate-950/40"
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              isCritical ? "bg-rose-500 text-white" : "bg-emerald-500 text-slate-950"
            }`}
          >
            {bannerAlert.category === "weather" ? (
              <CloudRain className="w-4 h-4" />
            ) : bannerAlert.category === "mandi" ? (
              <TrendingUp className="w-4 h-4" />
            ) : bannerAlert.category === "disease" ? (
              <Bug className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                  isCritical ? "bg-rose-500/30 text-rose-200" : "bg-emerald-500/30 text-emerald-300"
                }`}
              >
                {isCritical ? "Emergency Warning" : "Real-Time Alert"}
              </span>
              <span className="text-[10px] text-slate-400">Live</span>
            </div>

            <h4 className="text-xs font-bold text-white leading-snug line-clamp-1">
              {bannerAlert.title}
            </h4>

            <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
              {bannerAlert.message}
            </p>

            <div className="mt-2.5 flex items-center gap-2">
              {bannerAlert.actionUrl && (
                <Link
                  to={bannerAlert.actionUrl}
                  onClick={() => {
                    markAsRead(bannerAlert.id);
                    dismissBannerAlert();
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 ${
                    isCritical
                      ? "bg-rose-500 hover:bg-rose-400 text-white shadow-xs"
                      : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xs"
                  }`}
                >
                  <span>{bannerAlert.actionLabel || "View"}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}

              <button
                onClick={dismissBannerAlert}
                className="text-[11px] font-medium text-slate-400 hover:text-white transition-colors cursor-pointer px-1 py-0.5"
              >
                Dismiss
              </button>
            </div>
          </div>

          <button
            onClick={dismissBannerAlert}
            aria-label="Close alert"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
