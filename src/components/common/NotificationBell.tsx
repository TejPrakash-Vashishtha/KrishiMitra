import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CloudRain,
  TrendingUp,
  Bug,
  Landmark,
  ShoppingBag,
  ShieldAlert,
  Sparkles,
  CheckCheck,
  Trash2,
  ExternalLink,
  PlusCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { useNotifications } from "../../contexts/NotificationContext";
import { NotificationCategory, AppNotification } from "../../types/notifications";

function getCategoryIcon(type?: string, category?: string) {
  switch (type || category) {
    case "cloud-rain":
    case "weather":
      return <CloudRain className="w-4 h-4 text-sky-500" />;
    case "trending-up":
    case "mandi":
      return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    case "bug":
    case "disease":
      return <Bug className="w-4 h-4 text-rose-500" />;
    case "landmark":
    case "scheme":
      return <Landmark className="w-4 h-4 text-amber-500" />;
    case "shopping-bag":
    case "marketplace":
      return <ShoppingBag className="w-4 h-4 text-violet-500" />;
    case "shield-alert":
    case "system":
      return <ShieldAlert className="w-4 h-4 text-indigo-500" />;
    default:
      return <Sparkles className="w-4 h-4 text-emerald-500" />;
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "critical":
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider">Critical</span>;
    case "warning":
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">Warning</span>;
    case "success":
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">Update</span>;
    default:
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">Advisory</span>;
  }
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "Recent";
  }
}

const CATEGORY_TABS: { id: NotificationCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "weather", label: "Weather" },
  { id: "mandi", label: "Mandi" },
  { id: "disease", label: "Pest & Crop" },
  { id: "scheme", label: "Schemes" },
  { id: "marketplace", label: "Market" },
];

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    activeFilter,
    setActiveFilter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    sendTestAlert,
    refreshRealTimeAlerts,
    isLiveLoading,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    return n.category === activeFilter;
  });

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title="Alerts, Weather, Mandi and Crop Advisories"
        className="relative p-2 rounded-xl text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 active:scale-90 transition-all duration-150 cursor-pointer border border-slate-200/80 shadow-xs"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Flyout Modal / Tray */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel: bottom sheet on small mobile (<640px) or centered floating card, right aligned on desktop */}
          <div className="fixed inset-x-2 top-16 sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[410px] max-h-[80vh] sm:max-h-[520px] rounded-2xl bg-white shadow-2xl border border-slate-200/90 z-[60] flex flex-col overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="shrink-0 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 px-3.5 py-2.5 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                  <Bell className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-bold tracking-tight truncate">
                      Agri Alerts & Live Telemetry
                    </h3>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-[9px] font-extrabold text-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-100 truncate">
                    {isLiveLoading ? "Fetching live radar & mandi rates..." : `${unreadCount} unread advisories`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-1">
                {/* Live Sync Button */}
                <button
                  onClick={() => refreshRealTimeAlerts()}
                  disabled={isLiveLoading}
                  title="Sync live weather & market alerts"
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLiveLoading ? "animate-spin" : ""}`} />
                </button>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-semibold text-white flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span className="text-[10px]">Read all</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close notifications"
                  className="p-1 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar">
              {CATEGORY_TABS.map((tab) => {
                const isSelected = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 min-h-0 overscroll-contain">
              {filteredNotifications.length === 0 ? (
                <div className="py-10 text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No alerts in this category</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    All weather stations, mandi yards, and crop health scans are currently clear.
                  </p>
                  <button
                    onClick={() => sendTestAlert(activeFilter === "all" ? "weather" : activeFilter)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Simulate Field Alert</span>
                  </button>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl transition-all duration-150 relative group mb-1 ${
                      notif.read ? "bg-white hover:bg-slate-50/80" : "bg-emerald-50/50 hover:bg-emerald-50/80 border border-emerald-100/80"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                        {getCategoryIcon(notif.iconType, notif.category)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {getPriorityBadge(notif.priority)}
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatRelativeTime(notif.timestamp)}
                          </span>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </div>

                        <h4
                          onClick={() => markAsRead(notif.id)}
                          className={`text-xs leading-snug cursor-pointer break-words ${
                            notif.read ? "font-semibold text-slate-800" : "font-extrabold text-slate-900"
                          }`}
                        >
                          {notif.title}
                        </h4>

                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed break-words">
                          {notif.message}
                        </p>

                        {/* Action Link button */}
                        {notif.actionUrl && (
                          <div className="mt-2.5 flex items-center gap-2.5 flex-wrap">
                            <Link
                              to={notif.actionUrl}
                              onClick={() => {
                                markAsRead(notif.id);
                                setIsOpen(false);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold shadow-xs transition-all"
                            >
                              <span>{notif.actionLabel || "View Details"}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>

                            {!notif.read && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Delete notification button */}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        title="Dismiss alert"
                        className="opacity-70 sm:opacity-0 group-hover:opacity-100 absolute top-2.5 right-2.5 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tray Footer */}
            <div className="shrink-0 p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => sendTestAlert("weather")}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 active:scale-95 transition-transform cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Simulate Alert</span>
              </button>

              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 active:scale-95 transition-colors cursor-pointer"
                >
                  Clear all alerts
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
