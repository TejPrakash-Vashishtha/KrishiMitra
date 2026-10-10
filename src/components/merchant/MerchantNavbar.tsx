import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, Search, LogOut, LayoutDashboard, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageSelector from "../common/LanguageSelector";
import NotificationBell from "../common/NotificationBell";

/**
 * Merchant-only navbar: logo far-left, crop search bar in the center,
 * Dashboard + B2B Contacts links, language selector + profile far-right.
 * Completely separate from the farmer navbar (no weather, no crop checkup, etc.)
 */
export default function MerchantNavbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/merchant/search?q=${encodeURIComponent(q)}` : "/merchant/search");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Far-left: logo */}
        <Link to="/merchant" className="flex items-center gap-2.5 shrink-0">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
            <Sprout className="w-5 h-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-extrabold text-slate-900 tracking-tight">{t("brandName")}</span>
            <span className="block text-[9px] font-bold tracking-widest text-violet-600 uppercase">Merchant Hub</span>
          </span>
        </Link>

        {/* Center: crop search bar (collapses on very small screens) */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your desired crop that you want to buy"
              className="w-full pl-9 pr-20 py-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Right: links + language + profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Compact search icon when the search bar collapses on phones */}
          <Link
            to="/merchant/search"
            title="Search crops"
            className="sm:hidden p-2 rounded-xl text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          >
            <Search className="w-4 h-4" />
          </Link>
          <Link
            to="/merchant/dashboard"
            title="Dashboard"
            className="flex items-center gap-1.5 px-2.5 md:px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors whitespace-nowrap"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden md:inline">Dashboard</span>
          </Link>
          <Link
            to="/merchant/contacts"
            title="B2B Contacts"
            className="flex items-center gap-1.5 px-2.5 md:px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors whitespace-nowrap"
          >
            <Users className="w-4 h-4" />
            <span className="hidden md:inline">B2B Contacts</span>
          </Link>
          <NotificationBell />
          <LanguageSelector />
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="hidden sm:flex w-8 h-8 rounded-full bg-violet-600 text-white text-xs font-bold items-center justify-center">
                {user.name ? user.name.charAt(0).toUpperCase() : "M"}
              </span>
              <span className="hidden lg:block text-xs font-semibold text-slate-700 max-w-[110px] truncate">{user.name}</span>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
