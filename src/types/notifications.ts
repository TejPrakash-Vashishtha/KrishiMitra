export type NotificationCategory =
  | "all"
  | "weather"
  | "mandi"
  | "disease"
  | "scheme"
  | "marketplace"
  | "system";

export type NotificationPriority = "critical" | "warning" | "info" | "success";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string; // ISO date string or human readable
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  iconType?: "cloud-rain" | "trending-up" | "bug" | "landmark" | "shopping-bag" | "shield-alert" | "sparkles";
  meta?: {
    crop?: string;
    mandiName?: string;
    priceDelta?: string;
    temperature?: string;
    schemeName?: string;
    orderId?: string;
    district?: string;
  };
}

export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-weather-01",
    category: "weather",
    priority: "critical",
    title: "IMD Weather Alert: Heavy Thunderstorms Ahead",
    message: "Squall line & heavy downpour predicted in your district within next 18–24 hours. Postpone foliar pesticide sprays and secure newly harvested grains in covered storage.",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
    read: false,
    actionUrl: "/weather",
    actionLabel: "View Radar & Hourly Rain",
    iconType: "cloud-rain",
    meta: {
      temperature: "28°C",
    },
  },
  {
    id: "notif-mandi-02",
    category: "mandi",
    priority: "success",
    title: "Mandi Price Spike: Paddy (Basmati)",
    message: "Arrival modal rate jumped +₹160/quintal at nearest APMC Mandi today to reach ₹3,840/Q. Favorable selling window for dry grains.",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    read: false,
    actionUrl: "/mandi-prices",
    actionLabel: "Compare Mandi Rates",
    iconType: "trending-up",
    meta: {
      crop: "Paddy (Basmati)",
      priceDelta: "+₹160/Q",
      mandiName: "APMC Main Yard",
    },
  },
  {
    id: "notif-disease-03",
    category: "disease",
    priority: "warning",
    title: "Pest Warning: Brown Planthopper (BPH) Alert",
    message: "Neighboring agricultural clusters reported hopper burn signs in dense vegetative stage. Inspect plant hills 10cm above water level before evening.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
    actionUrl: "/analyze",
    actionLabel: "Run AI Crop Scan",
    iconType: "bug",
    meta: {
      crop: "Rice / Paddy",
    },
  },
  {
    id: "notif-scheme-04",
    category: "scheme",
    priority: "info",
    title: "PM-KISAN: 17th DBT Installment Disbursed",
    message: "₹2,000 Direct Benefit Transfer has been initiated to eligible bank accounts. Verify your e-KYC and land seeding status.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    read: false,
    actionUrl: "/digital-twin",
    actionLabel: "Check Khet Records",
    iconType: "landmark",
    meta: {
      schemeName: "PM-KISAN Samman Nidhi",
    },
  },
  {
    id: "notif-market-05",
    category: "marketplace",
    priority: "info",
    title: "B2B Merchant Inquiry: 15 Quintals Wheat",
    message: "Shree Ganesh Agro Traders submitted a procurement query for high-grade Sharbati wheat at ₹2,750/Q.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(), // 14 hours ago
    read: true,
    actionUrl: "/marketplace",
    actionLabel: "Review Quotation",
    iconType: "shopping-bag",
  },
  {
    id: "notif-soil-06",
    category: "disease",
    priority: "info",
    title: "Soil Health Advisory: Pre-Sowing Gypsum / Lime",
    message: "Regional soil test telemetry indicates slightly acidic pH (5.8). Applying agricultural lime 2.5 quintals/acre will elevate phosphorus absorption by 35%.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day ago
    read: true,
    actionUrl: "/agronomy-rag",
    actionLabel: "Read Agronomist Guide",
    iconType: "sparkles",
  },
  {
    id: "notif-system-07",
    category: "system",
    priority: "success",
    title: "KrishiMitra AI Engine Updated (v2.4)",
    message: "Added offline vernacular audio advice in 8 regional languages and ultra-fast visual crop diagnosis support.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    read: true,
    actionUrl: "/assistant",
    actionLabel: "Try Voice Assistant",
    iconType: "shield-alert",
  },
];
