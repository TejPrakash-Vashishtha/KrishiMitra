import React from "react";
import { Link } from "react-router-dom";
import { Sprout, Heart } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Sprout className="w-6 h-6 text-emerald-400" />
              <span>AgriNexus</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Empowering farmers across India with crop disease detection, weather forecasting, live mandi prices, dealer contacts, and a complete post-harvest marketplace.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/analyze" className="hover:text-emerald-400">{t("cropCheckup")}</Link></li>
              <li><Link to="/soil-analysis" className="hover:text-emerald-400">{t("soilTitle")}</Link></li>
              <li><Link to="/weather" className="hover:text-emerald-400">{t("weather")}</Link></li>
              <li><Link to="/products" className="hover:text-emerald-400">{t("store")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">More</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/dealers" className="hover:text-emerald-400">{t("dealers")}</Link></li>
              <li><Link to="/assistant" className="hover:text-emerald-400">{t("aiAssistant")}</Link></li>
              <li><Link to="/learn" className="hover:text-emerald-400">{t("fasalSalah")}</Link></li>
              <li><Link to="/admin" className="hover:text-emerald-400">Admin</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
          <span>Built for farmers of India with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
        </div>
      </div>
    </footer>
  );
}
