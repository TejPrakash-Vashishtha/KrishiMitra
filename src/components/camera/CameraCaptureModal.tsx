import React, { useEffect, useState } from "react";
import { Camera, SwitchCamera, X, Check } from "lucide-react";
import { useCamera } from "../../hooks/useCamera";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export default function CameraCaptureModal({ isOpen, onClose, onCapture }: CameraCaptureModalProps) {
  const { videoRef, isActive, error, startCamera, stopCamera, switchCamera, takeSnapshot } = useCamera();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewImage(null);
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  const handleSnap = () => {
    const snap = takeSnapshot();
    if (snap) {
      setPreviewImage(snap);
      stopCamera();
    }
  };

  const handleConfirm = () => {
    if (previewImage) {
      onCapture(previewImage);
      onClose();
    }
  };

  const handleRetake = () => {
    setPreviewImage(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Live Crop Scanner</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-rose-400 text-xs max-w-xs">{error}</div>
          ) : previewImage ? (
            <img src={previewImage} alt="Crop Snapshot" className="w-full h-full object-cover" />
          ) : (
            <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
          )}

          {!previewImage && isActive && (
            <div className="pointer-events-none absolute inset-8 border-2 border-emerald-400/60 rounded-2xl flex items-center justify-center">
              <span className="text-[11px] font-semibold text-emerald-200 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                Center leaf or affected crop here
              </span>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950 flex items-center justify-around">
          {previewImage ? (
            <>
              <button
                onClick={handleRetake}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Use Photo</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={switchCamera}
                className="p-3 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                title="Switch front/back camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>

              <button
                onClick={handleSnap}
                className="w-16 h-16 rounded-full bg-white ring-4 ring-emerald-500 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer shadow-xl shadow-emerald-500/30"
                title="Capture Photo"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500" />
              </button>

              <div className="w-11" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
