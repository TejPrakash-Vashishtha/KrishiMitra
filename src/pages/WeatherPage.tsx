import React, { useState, useEffect } from "react";
import { Calendar, Sun, Cloud, CloudRain, Wind, Droplets, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import WeatherWidget from "../components/weather/WeatherWidget";
import { useLanguage } from "../contexts/LanguageContext";
import { fetchWeatherHistory, WeatherHistoryRow } from "../lib/supabaseData";

const HARVEST_WINDOWS_KEYS = [
  { dayKey: "dayToday", conditionKey: "condClear", recommendation: "optimal", icon: Sun, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", temp: "32°C", rain: "0%" },
  { dayKey: "dayTomorrow", conditionKey: "condPartlyCloudy", recommendation: "good", icon: Cloud, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", temp: "30°C", rain: "10%" },
  { dayKey: "day3", conditionKey: "condCloudy", recommendation: "caution", icon: Cloud, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", temp: "28°C", rain: "30%" },
  { dayKey: "day4", conditionKey: "condLightRain", recommendation: "avoid", icon: CloudRain, color: "text-rose-600", bg: "bg-rose-50 border-rose-200", temp: "26°C", rain: "70%" },
  { dayKey: "day5", conditionKey: "condHeavyRain", recommendation: "avoid", icon: CloudRain, color: "text-rose-600", bg: "bg-rose-50 border-rose-200", temp: "24°C", rain: "90%" },
  { dayKey: "day6", conditionKey: "condRainStopping", recommendation: "caution", icon: Cloud, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", temp: "27°C", rain: "40%" },
  { dayKey: "day7", conditionKey: "condClearing", recommendation: "good", icon: Sun, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", temp: "31°C", rain: "5%" },
];

const RECOMMENDATION_CONFIG: Record<string, { labelKey: string; icon: any; color: string }> = {
  optimal: { labelKey: "harvestOptimal", icon: CheckCircle2, color: "text-emerald-700" },
  good: { labelKey: "harvestGood", icon: CheckCircle2, color: "text-emerald-600" },
  caution: { labelKey: "harvestCaution", icon: AlertTriangle, color: "text-amber-600" },
  avoid: { labelKey: "harvestAvoid", icon: AlertTriangle, color: "text-rose-600" },
};

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}`;
}

export default function WeatherPage() {
  const { t } = useLanguage();
  const [history, setHistory] = useState<WeatherHistoryRow[]>([]);

  // Load the stored 10-day weather history from the database
  useEffect(() => {
    fetchWeatherHistory(10)
      .then((rows) => setHistory(rows.slice(-10).reverse()))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t("weatherHarvestTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t("weatherHarvestDesc")}
          </p>
        </div>

        <WeatherWidget showForecast={true} />

        {/* Last 10 Days — stored weather history (database) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Last 10 Days — Saved Weather History</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            A snapshot is saved to the database automatically each day weather is fetched, and records older than 10 days are removed automatically.
          </p>
          {history.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No stored weather yet — snapshots appear here as you use the weather widget (one per day).
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {history.map((row) => (
                <div key={row.id ?? row.weather_date} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center hover:shadow-sm transition-all">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{formatDay(row.weather_date)}</p>
                  <p className="text-lg font-extrabold text-slate-900">{row.temperature}°C</p>
                  <p className="text-[10px] text-slate-500 font-medium">{row.condition}</p>
                  <div className="mt-1.5 space-y-0.5">
                    <p className="text-[10px] text-blue-600 font-semibold">💧 {row.humidity}% humidity</p>
                    <p className="text-[10px] text-sky-600 font-semibold">🌧 {row.rainfall_chance}% rain</p>
                    <p className="text-[10px] text-slate-500">💨 {row.wind_speed} km/h</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Harvest Window Advisory */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">{t("harvestWindow7Day")}</h2>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            {t("harvestWindowDesc")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
            {HARVEST_WINDOWS_KEYS.map((hw, i) => {
              const Icon = hw.icon;
              const rec = RECOMMENDATION_CONFIG[hw.recommendation];
              const RecIcon = rec.icon;
              return (
                <div key={i} className={`rounded-2xl border p-4 text-center ${hw.bg} transition-all hover:shadow-sm`}>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{t(hw.dayKey)}</p>
                  <Icon className={`w-8 h-8 mx-auto ${hw.color} mb-2`} />
                  <p className="text-xs font-bold text-slate-900">{hw.temp}</p>
                  <p className="text-[10px] text-slate-400">{t(hw.conditionKey)}</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Droplets className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] font-semibold text-blue-600">{hw.rain}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200/50">
                    <RecIcon className={`w-4 h-4 mx-auto ${rec.color}`} />
                    <p className={`text-[9px] font-bold ${rec.color} mt-0.5`}>{t(rec.labelKey)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-800">{t("bestHarvestWindow")}</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  {t("bestHarvestDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
