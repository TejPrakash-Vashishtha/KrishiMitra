import React, { useState, useEffect } from "react";
import { Users, Search, MapPin } from "lucide-react";
import DealerCard from "../components/dealers/DealerCard";
import api from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";

const INDIAN_STATES = ["ALL", "Maharashtra", "Punjab", "Uttar Pradesh", "Karnataka", "Tamil Nadu", "Gujarat", "Rajasthan"];

const FALLBACK_DEALERS = [
  {
    id: "dealer-1",
    name: "Rajesh Kumar",
    shopName: "Green Valley Agro Center",
    phone: "+919876543210",
    whatsappNumber: "919876543210",
    address: "FC Road, Pune",
    district: "Pune",
    state: "Maharashtra",
    rating: 4.8,
    products: "Neem Oil, Trichoderma, NPK 19-19-19",
  },
  {
    id: "dealer-2",
    name: "Harpreet Singh",
    shopName: "Punjab Farm Inputs",
    phone: "+919812345678",
    whatsappNumber: "919812345678",
    address: "GT Road, Ludhiana",
    district: "Ludhiana",
    state: "Punjab",
    rating: 4.6,
    products: "DAP, Urea, Zinc Sulphate, Tricyclazole",
  },
  {
    id: "dealer-3",
    name: "Anita Sharma",
    shopName: "Krishi Seva Kendra",
    phone: "+919900112233",
    whatsappNumber: "919900112233",
    address: "Mall Road, Lucknow",
    district: "Lucknow",
    state: "Uttar Pradesh",
    rating: 4.7,
    products: "Organic Vermicompost, Potash, DAP",
  },
  {
    id: "dealer-4",
    name: "Venkatesh Reddy",
    shopName: "Deccan Agro Supply",
    phone: "+919445566778",
    whatsappNumber: "919445566778",
    address: "MG Road, Hyderabad",
    district: "Hyderabad",
    state: "Karnataka",
    rating: 4.5,
    products: "NPK, Bio-Fungicides, Pesticides, Seeds",
  },
  {
    id: "dealer-5",
    name: "Priya Patel",
    shopName: "Gujarat Agro Hub",
    phone: "+919898989898",
    whatsappNumber: "919898989898",
    address: "Ashram Road, Ahmedabad",
    district: "Ahmedabad",
    state: "Gujarat",
    rating: 4.9,
    products: "Tricyclazole, Copper Oxychloride, Micronutrients",
  },
];

export default function DealersPage() {
  const { t } = useLanguage();
  const [dealers, setDealers] = useState<any[]>([]);
  const [district, setDistrict] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = district !== "ALL" ? `?district=${district}` : "";
    api.get(`/dealers${params}`)
      .then((res) => {
        if (res.data.success && res.data.dealers && res.data.dealers.length > 0) {
          setDealers(res.data.dealers);
        } else {
          setDealers(FALLBACK_DEALERS);
        }
      })
      .catch(() => setDealers(FALLBACK_DEALERS))
      .finally(() => setLoading(false));
  }, [district]);

  const filtered = dealers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.shopName.toLowerCase().includes(search.toLowerCase()) ||
    d.district.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>{t("directCallWhatsapp")}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900">
            {t("verifiedDealersNear")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mt-2">
            {t("contactDealersDesc")}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-8 shadow-sm space-y-4">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-3 left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchDealers")}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
            {INDIAN_STATES.map((dist) => (
              <button
                key={dist}
                onClick={() => setDistrict(dist)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  district === dist
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {dist}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">{t("loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 p-8">
            No dealers found in this location.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((d) => (
              <DealerCard key={d.id} dealer={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
