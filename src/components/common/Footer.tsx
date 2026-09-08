import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:kx-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🌾</span>
              <span className="text-xl font-bold text-white">AgriNexus</span>
            </div>
            <p className="text-sm">
              {t("heroSubtitle")?.substring(0, 80)}...
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t("store")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/analyze" className="hover:text-emerald-400">{t("cropCheckup")}</Link></li>
              <li><Link to="/soil-analysis" className="hover:text-emerald-400">{t("soilTitle")}</Link></li>
              <li><Link to="/weather" className="hover:text-emerald-400">{t("weather")}</Link></li>
              <li><Link to="/assistant" className="hover:text-emerald-400">{t("aiAssistant")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t("kisaanBazaar")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-emerald-400">{t("store")}</Link></li>
              <li><Link to="/dealers" className="hover:text-emerald-400">{t("dealers")}</Link></li>
              <li><Link to="/post-crop" className="hover:text-emerald-400">{t("postProduce")}</Link></li>
              <li><Link to="/learn" className="hover:text-emerald-400">{t("fasalSalah")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Helplines</h4>
            <ul className="space-y-2 text-sm">
              <li>Kisan Call Centre: <a href="tel:18001801551" className="text-emerald-400">1800-180-1551</a></li>
              <li>Kisan Credit Card: <a href="tel:1800111555" className="text-emerald-400">1800-111-555</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs">
          &copy; 2026 AgriNexus. Built for farmers of India.
        </div>
      </div>
    </footer>
  );
}
