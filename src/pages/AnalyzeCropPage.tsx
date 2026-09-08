import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Image, Sparkles, AlertCircle } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import CameraCaptureModal from "../components/camera/CameraCaptureModal";
import AnalysisLoadingAnimation from "../components/analysis/AnalysisLoadingAnimation";
import { diagnoseCropImage, CropDiagnosis } from "../lib/gemini";
import { saveAnalysis } from "../lib/analysisStore";

const CROPS = ["Paddy", "Tomato", "Mustard", "Potato", "Maize", "Brinjal", "Chilli", "Other"];

export default function AnalyzeCropPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [selectedCrop, setSelectedCrop] = useState("Paddy");
  const [imageData, setImageData] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    setLoading(true);
    setError("");
    try {
      // 1. Diagnose with the free Gemini LLM (grounded in agri data,
      //    with offline knowledge-base fallback if network fails)
      const diagnosis: CropDiagnosis = await diagnoseCropImage(selectedCrop, imageData, language);

      // 2. Reject non-agricultural images (person, pet, objects, etc.)
      if (!diagnosis.isAgriImage) {
        setError("This does not look like a crop. Please take a photo of a plant leaf, crop, soil, seeds, or anything related to farming.");
        setImageData(null);
        return;
      }

      // 3. Save permanently to the database (Supabase) with localStorage fallback
      const record = await saveAnalysis({
        farmer_id: user?.id || null,
        crop_name: selectedCrop,
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
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
              {CROPS.map((crop) => (
                <button
                  key={crop}
                  type="button"
                  onClick={() => setSelectedCrop(crop)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${selectedCrop === crop ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                >
                  {crop}
                </button>
              ))}
            </div>
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
