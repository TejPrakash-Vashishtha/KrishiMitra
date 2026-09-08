import React from "react";
import { Mic, MicOff } from "lucide-react";
import { useVoice } from "../../hooks/useVoice";
import { useLanguage } from "../../contexts/LanguageContext";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export default function VoiceButton({ onTranscript, className = "" }: VoiceButtonProps) {
  const { language } = useLanguage();
  const langCode = language === "or" ? "or-IN" : language === "hi" ? "hi-IN" : "en-IN";
  const { isListening, startListening, stopListening } = useVoice(onTranscript);

  const toggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(langCode);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`p-2.5 rounded-xl transition-all cursor-pointer ${
        isListening
          ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-200"
          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
      } ${className}`}
      title={isListening ? "Listening... Click to stop" : "Click to speak"}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}
