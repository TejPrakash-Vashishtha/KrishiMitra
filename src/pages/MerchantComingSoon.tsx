import React from "react";
import { Hammer } from "lucide-react";

/**
 * Placeholder for merchant routes whose features arrive in the next
 * phases (search & filter, dashboard, B2B contacts).
 */
export default function MerchantComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-4">
          <Hammer className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-2">{description}</p>
        <span className="inline-block mt-4 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold tracking-wide">
          ARRIVING IN THE NEXT UPDATE
        </span>
      </div>
    </div>
  );
}
