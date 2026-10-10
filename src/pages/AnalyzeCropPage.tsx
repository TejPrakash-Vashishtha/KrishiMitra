import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Image, Sparkles, AlertCircle, Search, ChevronDown, HelpCircle, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import CameraCaptureModal from "../components/camera/CameraCaptureModal";
import AnalysisLoadingAnimation from "../components/analysis/AnalysisLoadingAnimation";
import { diagnoseCropImage, CropDiagnosis } from "../lib/gemini";
import { saveAnalysis } from "../lib/analysisStore";

// Common crops farmers actually irrigate — shown as quick suggestions.
// The search bar accepts ANY crop (grains, vegetables, fruits) beyond these.
const COMMON_CROPS = [
  "Paddy", "Wheat", "Maize", "Sugarcane", "Cotton", "Mustard",
  "Tomato", "Potato", "Onion", "Brinjal", "Chilli", "Banana",
  "Mango", "Guava", "Papaya", "Cauliflower", "Cabbage", "Other",
];

export default function AnalyzeCropPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unknownCrop, setUnknownCrop] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Close the suggestion dropdown when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const pending = sessionStorage.getItem("km_pending_image");
    if (pending) {
      setImageData(pending);
      sessionStorage.removeItem("km_pending_image");
    }
  }, []);

  const handleDiagnose = async () => {
    if (!imageData) {
      setError("Please capture or upload a leaf photo first.");
      return;
    }
    if (!selectedCrop && !unknownCrop) {
      setError("Please select your crop first — search or pick a suggestion above.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // 1. Diagnose with the free Gemini LLM (grounded in agri data,
      //    with offline knowledge-base fallback if network fails).
      //    "Unknown" lets the AI identify the crop itself (Khud Pata Lagao).
      const cropHint = selectedCrop || "Unknown";
      const diagnosis: CropDiagnosis = await diagnoseCropImage(cropHint, imageData, language);

      // 2. Reject non-agricultural images (person, pet, objects, etc.)
      if (!diagnosis.isAgriImage) {
        setError("This does not look like a crop. Please take a photo of a plant leaf, crop, soil, seeds, or anything related to farming.");
        setImageData(null);
        return;
      }

      // 3. Save permanently to the database (Supabase) with localStorage fallback
      const record = await saveAnalysis({
        farmer_id: user?.id || null,
        crop_name: cropHint,
        disease: diagnosis.disease,
        severity: diagnosis.severity,
        confidence: diagnosis.confidence,
        image_url: imageData,
        symptoms: diagnosis.symptoms,
        organic_treatments: diagnosis.organicTreatments,
        chemical_treatments: diagnosis.chemicalTreatments,
        cause: diagnosis.cause,
        irrigation_advice: diagnosis.irrigationAdvice,
        soil_advice: diagnosis.soilAdvice,
        recommended_products: diagnosis.recommendedProducts,
        summary: diagnosis.summary,
      });

      navigate(`/analysis/${record.id}`);
    } catch (err: any) {
      console.error("Diagnosis error:", err);
      setError(
        "Could not analyze this photo. Make sure the photo clearly shows a crop leaf or plant, is well-lit and not blurry — then try again. (AI service may also be busy — please retry.)"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AnalysisLoadingAnimation />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Crop Doctor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t("diagnosisTitle") || "Crop Disease Diagnosis"}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t("diagnosisSubtitle") || "Instant disease detection & treatments"}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs mb-5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">{t("selectCrop") || "Select Crop"}</label>

            {/* Searchable crop picker with dropdown suggestions */}
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDropdownOpen(true);
                    setUnknownCrop(false);
                    const match = COMMON_CROPS.find(
                      (c) => c.toLowerCase() === e.target.value.trim().toLowerCase()
                    );
                    setSelectedCrop(match || null);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Search your crop — e.g. mango, paddy, tomato..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCrop(null);
                      setUnknownCrop(false);
                      setDropdownOpen(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                )}
              </div>

              {/* Suggestion dropdown */}
              {dropdownOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl max-h-64 overflow-y-auto animate-fade-in">
                  {(() => {
                    const q = searchQuery.trim().toLowerCase();
                    const matches = q ? COMMON_CROPS.filter((c) => c.toLowerCase().includes(q)) : COMMON_CROPS;
                    if (matches.length === 0) {
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setUnknownCrop(true);
                            setSelectedCrop(null);
                            setDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-amber-50 cursor-pointer flex items-center gap-2.5"
                        >
                          <HelpCircle className="w-4 h-4 text-amber-500" />
                          <span className="text-sm text-slate-700">
                            Can't find "{searchQuery.trim()}"? <span className="font-bold text-amber-600">Know yourself (Khud Pata Lagao)</span>
                          </span>
                        </button>
                      );
                    }
                    return (
                      <>
                        {matches.map((crop) => (
                          <button
                            key={crop}
                            type="button"
                            onClick={() => {
                              setSelectedCrop(crop);
                              setSearchQuery(crop);
                              setUnknownCrop(false);
                              setDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm cursor-pointer flex items-center justify-between ${
                              selectedCrop === crop
                                ? "bg-emerald-50 text-emerald-800 font-bold"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span>{crop}</span>
                            {selectedCrop === crop && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Selected</span>
                            )}
                          </button>
                        ))}
                        {!matches.some((c) => c.toLowerCase() === q) && q !== "" && (
                          <button
                            type="button"
                            onClick={() => {
                              setUnknownCrop(true);
                              setSelectedCrop(null);
                              setDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-amber-50 cursor-pointer flex items-center gap-2.5 border-t border-slate-100"
                          >
                            <HelpCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-sm text-slate-700">
                              Not sure which crop? <span className="font-bold text-amber-600">Know yourself (Khud Pata Lagao)</span>
                            </span>
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Quick suggestion chips — common irrigated crops */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {COMMON_CROPS.slice(0, 8).map((crop) => (
                <button
                  key={crop}
                  type="button"
                  onClick={() => {
                    setSelectedCrop(crop);
                    setSearchQuery(crop);
                    setUnknownCrop(false);
                    setDropdownOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedCrop === crop
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>

            {/* Know yourself mode — AI identifies the crop from the photo */}
            {unknownCrop && (
              <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 animate-fade-in">
                <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-bold">Khud Pata Lagao (Know Yourself)</span> — no need to pick a crop.
                  Just take a photo of your plant and our AI will identify the crop AND its disease together.
                </p>
              </div>
            )}
          </div>

          <div>
            {imageData ? (
              <div className="relative w-full h-64 bg-slate-900 rounded-xl overflow-hidden">
                <img src={imageData} alt="Crop" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImageData(null)}
                  className="absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-black/70 cursor-pointer"
                >
                  {t("retake") || "Retake"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  className="p-8 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">{t("openCamera") || "Open Camera"}</span>
                </button>

                <label className="p-8 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <Image className="w-8 h-8 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">{t("uploadPhoto") || "Upload Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const r = new FileReader();
                        r.onloadend = () => setImageData(r.result as string);
                        r.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <button
            onClick={handleDiagnose}
            disabled={!imageData}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t("analyzeButton") || "Diagnose Disease"}</span>
          </button>
        </div>
      </div>

      <CameraCaptureModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(dataUrl) => {
          setImageData(dataUrl);
          setCameraOpen(false);
        }}
      />
    </div>
  );
}
