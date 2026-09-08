import React from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, Store, Users } from "lucide-react";

interface RoleSelectModalProps {
  open: boolean;
  /** Called after the user picks a role (closes the modal) */
  onSelect: () => void;
}

/**
 * Role onboarding shown to logged-out visitors immediately after the
 * language popup, on EVERY visit (no persistence). Sends the user to the
 * login page with the chosen role pre-tagged: /login?as=farmer|merchant
 */
export default function RoleSelectModal({ open, onSelect }: RoleSelectModalProps) {
  const navigate = useNavigate();

  if (!open) return null;

  const choose = (path: string) => {
    onSelect();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Darkened, blurred backdrop — blocks all interaction until a role is chosen */}
      <div
        className="absolute inset-0 bg-slate-900/60"
        style={{
          WebkitBackdropFilter: "blur(14px)",
          backdropFilter: "blur(14px)",
        }}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 pt-6 pb-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-3">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Aap Kaun Hain?
          </h2>
          <p className="text-emerald-50/90 text-sm mt-1">
            Choose how you want to use AgriNexus
          </p>
        </div>

        {/* Role cards */}
        <div className="p-5 space-y-3">
          <button
            onClick={() => choose("/login?as=farmer")}
            className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer text-left"
          >
            <span className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Sprout className="w-6 h-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold text-slate-900 tracking-wide">
                FARMER
              </span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Grow crops, check crop health, weather &amp; mandi prices
              </span>
            </span>
          </button>

          <button
            onClick={() => choose("/login?as=merchant")}
            className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-violet-400 hover:bg-violet-50/50 transition-all cursor-pointer text-left"
          >
            <span className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 group-hover:bg-violet-500 group-hover:text-white transition-colors">
              <Store className="w-6 h-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold text-slate-900 tracking-wide">
                MERCHANT
              </span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Buy produce, manage your shop &amp; connect with farmers
              </span>
            </span>
          </button>

          <p className="text-center text-xs text-slate-400 pt-1">
            Already have an account? Pick your role and login as usual
          </p>
        </div>
      </div>
    </div>
  );
}
