import React from "react";
import { ExternalLink, Star } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    brand: string;
    category: string;
    description: string;
    price: number;
    rating?: number;
    imageUrl?: string;
    amazonUrl?: string;
    flipkartUrl?: string;
    suitableFor?: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const amazonSearchUrl = product.amazonUrl || `https://www.amazon.in/s?k=${encodeURIComponent(product.name + " fertilizer agriculture")}`;
  const flipkartSearchUrl = product.flipkartUrl || `https://www.flipkart.com/search?q=${encodeURIComponent(product.name + " fertilizer agriculture")}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-100 mb-3 flex items-center justify-center">
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1592417817098-8f3d6eb22a57?w=500&q=80"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase">
            {product.category}
          </span>
        </div>

        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{product.brand}</span>
          <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{product.rating || 4.7}</span>
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
          {product.name}
        </h3>

        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>

        {product.suitableFor && (
          <div className="mt-2.5">
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
              Target: {product.suitableFor}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="text-base font-extrabold text-slate-900 mb-3">
          &#8377;{product.price}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={amazonSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-colors"
          >
            <span>Amazon</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <a
            href={flipkartSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            <span>Flipkart</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
