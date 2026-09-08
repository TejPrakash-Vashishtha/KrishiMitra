import React from "react";
import { Link } from "react-router-dom";
import { Phone, MessageSquare, MapPin, ShieldCheck, MessageCircle, Tag } from "lucide-react";

interface DealerCardProps {
  dealer: {
    id: string;
    name: string;
    shopName: string;
    phone: string;
    whatsappNumber?: string;
    address: string;
    district: string;
    rating?: number;
    products?: string;
  };
}

export default function DealerCard({ dealer }: DealerCardProps) {
  const cleanPhone = (dealer.whatsappNumber || dealer.phone).replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent("Namaste! I am a farmer on KrishiMitra AI and need advice on fertilizers/products for my crops.")}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">{dealer.shopName}</h3>
            <p className="text-xs text-slate-600 font-medium">{dealer.name}</p>
          </div>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold flex-shrink-0">
            <ShieldCheck className="w-3 h-3" />
            <span>Verified</span>
          </span>
        </div>

        <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>{dealer.address}, {dealer.district}</span>
        </div>

        <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="font-medium">{dealer.phone}</span>
          {dealer.rating && (
            <span className="ml-auto text-amber-500 font-bold">{dealer.rating} ★</span>
          )}
        </div>

        {dealer.products && (
          <div className="flex items-start gap-1.5 mt-2 text-[11px] text-teal-700 bg-teal-50 rounded-lg px-2.5 py-1.5">
            <Tag className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>{dealer.products}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5 pt-3 border-t border-slate-100">
        <a
          href={`tel:${dealer.phone}`}
          className="flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call</span>
        </a>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </a>

        <Link
          to={`/chat?with=${dealer.id}`}
          className="flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </Link>
      </div>
    </div>
  );
}
