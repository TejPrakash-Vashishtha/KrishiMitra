import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Image, Send, AlertCircle, Package, Store } from "lucide-react";
import { useLocation as useGeoLocation } from "../contexts/LocationContext";
import CameraCaptureModal from "../components/camera/CameraCaptureModal";
import VoiceButton from "../components/voice/VoiceButton";
import api from "../services/api";

export default function PostCropPage() {
  const { city } = useGeoLocation();
  const [cropName, setCropName] = useState("Paddy");
  const [problem, setProblem] = useState("");
  const [locationField, setLocationField] = useState(city ? `${city}` : "Your location");
  const [activeTab, setActiveTab] = useState<"issue" | "sell">("issue");
  const [imageData, setImageData] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropName || !problem) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/crop-posts", {
        cropName,
        problem,
        location: locationField,
        imageUrl: imageData || undefined,
      });
      if (res.data.success) {
        navigate("/dashboard");
      } else {
        setError(res.data.message || "Failed to post issue.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to post crop issue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex gap-1 p-1 rounded-xl bg-slate-100 mb-4">
            <button onClick={() => setActiveTab("issue")} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "issue" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>
              <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Post Crop Issue</span>
            </button>
            <button onClick={() => setActiveTab("sell")} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "sell" ? "bg-emerald-600 shadow-sm text-white" : "text-slate-500"}`}>
              <span className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> Post Produce for Sale</span>
            </button>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {activeTab === "issue" ? "Post Crop Issue to Local Dealers" : "List Your Produce for Sale"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === "issue" ? "Verified agro-dealers will review your photo and offer solutions" : "Connect directly with buyers and sell your harvest at the best price"}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div>
            {imageData ? (
              <div className="relative w-full h-56 bg-slate-900 rounded-xl overflow-hidden">
                <img src={imageData} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageData(null)}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-black/70 cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  className="p-4 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-800">Open Camera</span>
                </button>

                <label className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <Image className="w-6 h-6 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">Gallery</span>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Crop Name</label>
              <input
                type="text"
                required
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                required
                value={locationField}
                onChange={(e) => setLocationField(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Problem Description</label>
              <VoiceButton onTranscript={(text) => setProblem((prev) => (prev ? `${prev} ${text}` : text))} />
            </div>
            <textarea
              required
              rows={3}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Describe the issue, spots, infestation, etc..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? "Posting..." : "Post to Dealers"}</span>
          </button>
        </form>
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
