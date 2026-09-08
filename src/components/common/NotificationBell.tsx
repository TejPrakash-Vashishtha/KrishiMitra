import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import api from "../../services/api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.get("/notifications")
      .then((res) => {
        if (res.data.success) {
          setNotifications(res.data.notifications || []);
          setUnreadCount(res.data.notifications?.filter((n: any) => !n.read).length || 0);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-200/80 p-3 z-50">
            <h4 className="text-xs font-bold text-slate-800 mb-2 px-1">Alerts & Advisories</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No new notifications</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <p className="font-semibold text-slate-800">{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
