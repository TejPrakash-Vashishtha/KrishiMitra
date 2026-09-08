import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Camera, Activity, Satellite, Sparkles } from "lucide-react";

export default function MobileNav() {
  const { pathname } = useLocation();

  const tabs = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { to: "/analyze", icon: Camera, label: "Doctor" },
    { to: "/digital-twin", icon: Activity, label: "Twin" },
    { to: "/field-mapping", icon: Satellite, label: "GIS" },
    { to: "/consensus-engine", icon: Sparkles, label: "Agents" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {tabs.map((t) => {
        const isActive = pathname === t.to;
        return (
          <Link
            key={t.to}
            to={t.to}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive ? "text-emerald-600 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <t.icon className={`w-5 h-5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
            <span className="text-[9px] mt-0.5">{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
