import React, { useState } from "react";
import { Languages, Check } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { LanguageCode } from "../../utils/translations";

const LANGUAGES: { code: LanguageCode; native: string; name: string }[] = [
  { code: "en", native: "English", name: "English" },
  { code: "hi", native: "हिन्दी", name: "Hindi" },
  { code: "bn", native: "বাংলা", name: "Bengali" },
  { code: "te", native: "తెలుగు", name: "Telugu" },
  { code: "ta", native: "தமிழ்", name: "Tamil" },
  { code: "kn", native: "ಕನ್ನಡ", name: "Kannada" },
  { code: "mr", native: "मराठी", name: "Marathi" },
  { code: "or", native: "ଓଡ଼ିଆ", name: "Odia" },
];

interface LanguageOnboardingModalProps {
  open: boolean;
  /** Called after the user picks a language and confirms */
  onSelect: () => void;
}

/**
 * Language onboarding shown to logged-out visitors on every visit.
 * The app shell blurs itself (CSS filter) while this is open; the overlay
 * uses both prefixed and unprefixed backdrop-filter for wide support.
 */
export default function LanguageOnboardingModal({
  open,
  onSelect,
}: LanguageOnboardingModalProps) {
  const { language, setLanguage } = useLanguage();
  const [pending, setPending] = useState<LanguageCode | null>(null);

  if (!open) return null;

  const handleContinue = () => {
    if (!pending) return;
    setLanguage(pending);
    setPending(null);
    onSelect();
  };

  const selected = pending ?? language;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Darkened, blurred backdrop — blocks all interaction until a language is chosen */}
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
            <Languages className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Choose Your Language
          </h2>
          <p className="text-emerald-50/90 text-sm mt-1">
            Select your preferred language to continue
          </p>
        </div>

        {/* Language grid */}
        <div className="p-5">
          <div className="grid grid-cols-2 gap-2.5">
            {LANGUAGES.map((lang) => {
              const isSelected = selected === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setPending(lang.code)}
                  className={`relative flex flex-col items-center justify-center py-3.5 px-2 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-100"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </span>
                  )}
                  <span
                    className={`text-lg font-semibold leading-tight ${
                      isSelected ? "text-emerald-700" : "text-slate-800"
                    }`}
                  >
                    {lang.native}
                  </span>
                  <span
                    className={`text-[11px] mt-0.5 ${
                      isSelected ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {lang.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Confirm */}
          <button
            onClick={handleContinue}
            disabled={!pending}
            className={`w-full mt-4 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              pending
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            Continue
          </button>

          <p className="text-center text-xs text-slate-400 mt-3">
            You can change this anytime from the language menu
          </p>
        </div>
      </div>
    </div>
  );
}
