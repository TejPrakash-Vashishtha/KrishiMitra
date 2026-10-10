import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AppNotification, NotificationCategory, SEED_NOTIFICATIONS } from "../types/notifications";
import { useLocation } from "./LocationContext";
import { useAuth } from "./AuthContext";
import { fetchLiveWeatherAlerts } from "../services/realAlertsService";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  activeFilter: NotificationCategory;
  setActiveFilter: (cat: NotificationCategory) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (notif: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  sendTestAlert: (category?: NotificationCategory) => void;
  bannerAlert: AppNotification | null;
  dismissBannerAlert: () => void;
  refreshRealTimeAlerts: () => Promise<void>;
  isLiveLoading: boolean;
}

const STORAGE_KEY = "km_notifications_v2";

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { latitude, longitude, district, state } = useLocation();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>("all");
  const [bannerAlert, setBannerAlert] = useState<AppNotification | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState(false);

  // Load persisted notifications or seed initial set
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to load notifications from storage", e);
    }
    return SEED_NOTIFICATIONS;
  });

  // Persist whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn("Failed to save notifications to storage", e);
    }
  }, [notifications]);

  // Fetch REAL-TIME live weather & agronomic alerts from Open-Meteo & local telemetry
  const refreshRealTimeAlerts = useCallback(async () => {
    const lat = latitude || 28.6139;
    const lon = longitude || 77.2090;
    const dist = district || "New Delhi";
    const st = state || "Delhi";

    setIsLiveLoading(true);
    try {
      const liveAlerts = await fetchLiveWeatherAlerts(lat, lon, dist, st);
      if (liveAlerts.length > 0) {
        setNotifications((prev) => {
          // Remove old live alerts for this district to avoid duplicates
          const liveIds = new Set(liveAlerts.map((a) => a.id));
          const cleaned = prev.filter((p) => !liveIds.has(p.id));
          return [...liveAlerts, ...cleaned];
        });

        // Trigger subtle banner for critical real-time alert ONLY once
        const criticalAlert = liveAlerts.find((a) => a.priority === "critical");
        if (criticalAlert) {
          setBannerAlert(criticalAlert);
        }
      }
    } catch (err) {
      console.warn("Error refreshing real-time alerts:", err);
    } finally {
      setIsLiveLoading(false);
    }
  }, [latitude, longitude, district, state]);

  // Automatically fetch real alerts when location resolves or changes
  useEffect(() => {
    refreshRealTimeAlerts();
  }, [refreshRealTimeAlerts]);

  // Periodic poll every 10 minutes for live meteorological updates
  useEffect(() => {
    const interval = setInterval(() => {
      refreshRealTimeAlerts();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshRealTimeAlerts]);

  // Role-specific welcome notification
  useEffect(() => {
    if (user?.role) {
      const roleKey = `notif-role-${user.role.toLowerCase()}`;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === roleKey)) return prev;

        let title = "KrishiMitra Farmer Portal Active";
        let message = "Access live mandi arrivals, crop doctor diagnostics, and government subsidies with real-time sync.";
        let category: NotificationCategory = "system";
        let actionUrl = "/dashboard";
        let actionLabel = "Open Dashboard";

        if (user.role === "DEALER") {
          title = "Agro-Dealer B2B Suite Initialized";
          message = "Your shop inventory and buyer inquiries are synchronized with nearby mandi arrivals.";
          category = "marketplace";
          actionUrl = "/merchant/dashboard";
          actionLabel = "Open Merchant Suite";
        } else if (user.role === "CUSTOMER") {
          title = "Direct-From-Farmer Marketplace Active";
          message = "Fresh organic vegetables and grains direct from verified local cultivators are now browseable.";
          category = "marketplace";
          actionUrl = "/customer";
          actionLabel = "Browse Fresh Produce";
        }

        const roleNotif: AppNotification = {
          id: roleKey,
          category,
          priority: "info",
          title,
          message,
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl,
          actionLabel,
          iconType: "shield-alert",
        };

        return [roleNotif, ...prev];
      });
    }
  }, [user?.role]);

  // Only show bannerAlert if explicitly requested or on actual severe storm detection
  // Do NOT pop up automatically on normal loads to prevent screen obstruction

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setBannerAlert((current) => (current?.id === id ? null : current));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setBannerAlert((current) => (current?.id === id ? null : current));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setBannerAlert(null);
  }, []);

  const addNotification = useCallback((notif: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    if (notif.priority === "critical") {
      setBannerAlert(newNotif);
    }
  }, []);

  const sendTestAlert = useCallback((category: NotificationCategory = "weather") => {
    const samples: Record<string, Omit<AppNotification, "id" | "timestamp" | "read">> = {
      weather: {
        category: "weather",
        priority: "critical",
        title: "⚡ Sudden Hailstorm Warning",
        message: "High-velocity convective cloud cell detected within 35km radius. Shelter young seedlings and harvestable melons immediately.",
        actionUrl: "/weather",
        actionLabel: "View Radar Map",
        iconType: "cloud-rain",
      },
      mandi: {
        category: "mandi",
        priority: "success",
        title: "📈 Mustard / Sarson Price Surge",
        message: "Mustard arrival bids peaked at ₹5,650/quintal in neighboring wholesale yard (+8.4% above MSP).",
        actionUrl: "/mandi-prices",
        actionLabel: "View Live Mandis",
        iconType: "trending-up",
      },
      disease: {
        category: "disease",
        priority: "warning",
        title: "🔬 Leaf Curl Virus Alert",
        message: "Whitefly vector populations surging with dry ambient humidity. Apply yellow sticky traps or neem oil spray.",
        actionUrl: "/analyze",
        actionLabel: "Scan Leaves Now",
        iconType: "bug",
      },
      scheme: {
        category: "scheme",
        priority: "info",
        title: "🏛️ Pradhan Mantri Fasal Bima (PMFBY)",
        message: "Kharif crop insurance claim window closing in 6 days. Verify insured survey numbers on your portal.",
        actionUrl: "/digital-twin",
        actionLabel: "Verify Land Survey",
        iconType: "landmark",
      },
      marketplace: {
        category: "marketplace",
        priority: "info",
        title: "🛒 Direct Order Received",
        message: "A registered agro-retailer confirmed order for 25 bags of cold-pressed organic oil.",
        actionUrl: "/marketplace",
        actionLabel: "View Order Details",
        iconType: "shopping-bag",
      },
      system: {
        category: "system",
        priority: "info",
        title: "🛡️ Offline Mode Activated",
        message: "KrishiMitra database saved to device cache for smooth offline village connectivity.",
        actionUrl: "/assistant",
        actionLabel: "Voice Assistant Ready",
        iconType: "sparkles",
      },
    };

    const chosen = samples[category] || samples.weather;
    addNotification(chosen);
  }, [addNotification]);

  const dismissBannerAlert = useCallback(() => {
    setBannerAlert(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeFilter,
        setActiveFilter,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
        sendTestAlert,
        bannerAlert,
        dismissBannerAlert,
        refreshRealTimeAlerts,
        isLiveLoading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
