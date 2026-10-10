import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sprout, Search, LogOut, ShoppingBag, HeartHandshake, Package, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageSelector from "../common/LanguageSelector";
import NotificationBell from "../common/NotificationBell";

/**
 * Customer-only navbar: logo far-left, search bar in the center,
 * Marketplace / Farmer Connect / My Orders / Profile links, language
 * selector + cart + profile far-right. Completely separate from the
 * farmer and merchant navbars.
 */
export default function CustomerNavbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/shop/marketplace?q=${encodeURIComponent(q)}` : "/shop/marketplace");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const links = [
    { to: "/shop/marketplace", label: "Marketplace", icon: ShoppingBag },
    { to: "/shop/farmers", label: "Farmer Connect", icon: HeartHandshake },
    { to: "/shop/orders", label: "My Orders", icon: Package },
    { to: "/shop/profile", label: "Profile", icon: User },
  ];

  const isActive = (to: string) => location.pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Far-left: logo */}
        <Link to="/shop" className="flex items-center gap-2.5 shrink-0">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
            <Sprout className="w-5 h-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-extrabold text-slate-900 tracking-tight">{t("brandName")}</span>
            <span className="block text-[9px] font-bold tracking-widest text-amber-600 uppercase">Fresh from Farms</span>
          </span>
        </Link>

        {/* Center: search bar (collapses on very small screens) */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for fresh produce, pickles, honey..."
              className="w-full pl-9 pr-20 py-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Right: links + language + cart + profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Compact search icon when the search bar collapses on phones */}
          <Link
            to="/shop/marketplace"
            title="Search produce"
            className="sm:hidden p-2 rounded-xl text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
          >
            <Search className="w-4 h-4" />
          </Link>
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              title={label}
              className={`flex items-center gap-1.5 px-2.5 md:px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                isActive(to)
                  ? "bg-amber-50 text-amber-700"
                  : "text-slate-700 hover:bg-amber-50 hover:text-amber-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
          <NotificationBell />
          <LanguageSelector />

          {/* Cart button with item count badge */}
          <Link
            to="/shop/orders"
            title="Cart"
            className="relative p-2 rounded-xl text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="hidden sm:flex w-8 h-8 rounded-full bg-amber-600 text-white text-xs font-bold items-center justify-center">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
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
