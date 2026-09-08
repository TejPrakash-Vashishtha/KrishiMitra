import React, { useState } from "react";
import {
  Camera, Image, Sprout, Sparkles, AlertCircle, CheckCircle, Volume2,
  Layers, Palette, Leaf, Waves, Droplet, Eye, FlaskConical, RefreshCw, Info,
} from "lucide-react";
import CameraCaptureModal from "../components/camera/CameraCaptureModal";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { useLanguage } from "../contexts/LanguageContext";
import { diagnoseSoilImage, SoilAssessment } from "../lib/gemini";

const TTS_LOCALES: Record<string, string> = {
  en: "en-IN", hi: "hi-IN", bn: "bn-IN", te: "te-IN",
  ta: "ta-IN", kn: "kn-IN", mr: "mr-IN", or: "or-IN",
};

type Tone = "good" | "moderate" | "poor" | "unclear";

const BADGE_TONES: Record<Tone, string> = {
  good: "bg-emerald-50 text-emerald-800 border-emerald-200",
  moderate: "bg-amber-50 text-amber-900 border-amber-200",
  poor: "bg-rose-50 text-rose-800 border-rose-200",
  unclear: "bg-slate-100 text-slate-600 border-slate-200",
};

function toneOf(level: string): Tone {
  switch (level) {
    case "Good": case "High": case "None": return "good";
    case "Moderate": case "Moist": return "moderate";
    case "Poor": case "Possible": case "Low": return "poor";
    default: return "unclear";
  }
}

function ResultCard({
  icon: Icon,
  label,
  badge,
  badgeTone,
  iconTone,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  badgeTone?: Tone;
  iconTone?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconTone || "bg-emerald-50 text-emerald-700"}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">{label}</span>
        </div>
        {badge && (
          <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex-shrink-0 ${BADGE_TONES[badgeTone || "unclear"]}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-800 font-medium leading-relaxed">{children}</p>
    </div>
  );
}

export default function SoilAnalysisPage() {
  const { language, t } = useLanguage();
  const [imageData, setImageData] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<SoilAssessment | null>(null);
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

  const handleAnalyze = async () => {
    if (!imageData) return;
    setLoading(true);
    setError(false);
    setResult(null);
    try {
      const assessment = await diagnoseSoilImage(imageData, language);
      setResult(assessment);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setImageData(null);
    setResult(null);
    setError(false);
    if (isSpeaking) stop();
  };

  const toggleSpeak = () => {
    if (!result) return;
    if (isSpeaking) {
      stop();
    } else {
      const text = `${result.soilType}. ${result.summary} ${result.recommendations.join(" ")}`;
      speak(text, TTS_LOCALES[language] || "en-IN");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-3">
            <Sprout className="w-3.5 h-3.5" />
            <span>{t("soilTitle")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t("soilTitle")}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t("soilSubtitle")}</p>
        </div>

        {/* Capture / upload */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm mb-6">
          {imageData ? (
            <div className="relative w-full h-64 bg-slate-900 rounded-xl overflow-hidden">
              <img src={imageData} alt="Soil" className="w-full h-full object-cover" />
              <button onClick={handleRetake} className="absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-black/70 cursor-pointer">{t("retake")}</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setCameraOpen(true)} className="p-8 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/30 flex flex-col items-center justify-center gap-2 cursor-pointer">
                <Camera className="w-8 h-8 text-amber-600" />
                <span className="text-sm font-semibold text-amber-900">{t("openCamera")}</span>
              </button>
              <label className="p-8 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer">
                <Image className="w-8 h-8 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">{t("soilUploadPhoto")}</span>
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader();
                    r.onloadend = () => { setImageData(r.result as string); setResult(null); setError(false); };
                    r.readAsDataURL(file);
                  }
                }} className="hidden" />
              </label>
            </div>
          )}

          <button onClick={handleAnalyze} disabled={!imageData || loading} className="w-full mt-4 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
            <Sparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
            <span>{loading ? t("soilAnalyzing") : t("soilAnalyze")}</span>
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center animate-pulse">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-slate-900">{t("soilAnalyzing")}</p>
            </div>
            <div className="space-y-2.5">
              <div className="h-4 rounded-full bg-slate-100 animate-pulse w-3/4" />
              <div className="h-4 rounded-full bg-slate-100 animate-pulse w-1/2" />
              <div className="h-4 rounded-full bg-slate-100 animate-pulse w-2/3" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{t("soilErrorTitle")}</h3>
            <p className="text-sm text-slate-500">{t("soilErrorBody")}</p>
            <button onClick={handleAnalyze} className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer">
              <RefreshCw className="w-4 h-4" />
              <span>{t("soilRetry")}</span>
            </button>
          </div>
        )}

        {/* Not a soil photo */}
        {!loading && result && !result.isSoilImage && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{t("soilNotSoilTitle")}</h3>
            <p className="text-sm text-slate-500">{result.notSoilReason}</p>
            <button onClick={handleRetake} className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer">
              <Camera className="w-4 h-4" />
              <span>{t("retake")}</span>
            </button>
          </div>
        )}

        {/* Result */}
        {!loading && result && result.isSoilImage && (
          <div className="space-y-4">
            {/* Summary + listen */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
                <button onClick={toggleSpeak} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex-shrink-0 cursor-pointer">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isSpeaking ? t("soilStop") : t("soilListen")}</span>
                </button>
              </div>
            </div>

            {/* Visual assessment cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ResultCard icon={Layers} label={t("soilTypeLabel")} badge={result.confidenceBadge} badgeTone={toneOf(result.confidence)}>
                {result.soilType}
              </ResultCard>
              <ResultCard icon={Palette} label={t("soilColorLabel")}>
                {result.colorIndication}
              </ResultCard>
              <ResultCard icon={Leaf} label={t("soilOMLabel")} badge={result.organicMatterBadge} badgeTone={toneOf(result.organicMatterLevel)}>
                {result.organicMatterText}
              </ResultCard>
              <ResultCard
                icon={Waves}
                label={t("soilDrainageLabel")}
                iconTone={result.drainageLevel === "Poor" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"}
              >
                {result.drainageText}
              </ResultCard>
              <ResultCard
                icon={Droplet}
                label={t("soilMoistureLabel")}
                iconTone={result.moistureLevel === "Dry" || result.moistureLevel === "VeryDry" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"}
              >
                {result.moistureText}
              </ResultCard>
              <ResultCard
                icon={AlertCircle}
                label={t("soilSalinityLabel")}
                badge={result.salinityBadge}
                badgeTone={toneOf(result.salinitySigns)}
                iconTone={result.salinitySigns === "Possible" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}
              >
                {result.salinityText}
              </ResultCard>

              {result.vegetationNote && (
                <ResultCard icon={Sprout} label={t("soilVegetationLabel")}>
                  {result.vegetationNote}
                </ResultCard>
              )}

              {result.surfaceConditions.length > 0 && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm sm:col-span-2">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{t("soilSurfaceLabel")}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.surfaceConditions.map((c, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3">{t("soilRecsLabel")}</h3>
                <ul className="space-y-2.5">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lab test — visually distinct */}
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-5 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">{t("soilLabTitle")}</h3>
                  <p className="text-[13px] text-amber-900/80 mt-1.5 leading-relaxed">{t("soilLabBody")}</p>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="flex items-start justify-center gap-1.5 text-[11px] text-slate-400 text-center px-4">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{t("soilDisclaimer")}</span>
            </p>
          </div>
        )}
      </div>

      <CameraCaptureModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(dataUrl) => { setImageData(dataUrl); setCameraOpen(false); setResult(null); setError(false); }}
      />
    </div>
  );
}
