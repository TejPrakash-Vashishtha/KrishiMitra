import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Send, Volume2, Mic, MicOff, ImagePlus, X, Loader2, Sprout } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { askGemini, saveConversation, loadConversationHistory } from "../lib/gemini";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  timestamp: string;
}

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "or", label: "ଓଡ଼ିଆ", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা", flag: "🇮🇳" },
  { code: "te", label: "తెలుగు", flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "mr", label: "मराठी", flag: "🇮🇳" },
];

const WELCOME_MESSAGES: Record<string, string> = {
  en: "Namaste! 🙏 I am your AgriNexus AI assistant. You can:\n\n📸 Send me a photo of your crop — I'll analyze it for diseases\n💬 Ask me anything about farming, fertilizers, weather, or market prices\n🎙️ Or use the mic button to speak to me\n\nHow can I help you today?",
  hi: "नमस्ते! 🙏 मैं आपका AgriNexus AI सहायक हूं। आप:\n\n📸 अपनी फसल की फोटो भेज सकते हैं — मैं बीमारी की जांच करूंगा\n💬 खेती, खाद, मौसम, या बाजार भाव के बारे में कुछ भी पूछ सकते हैं\n🎙️ या माइक बटन दबाकर बोल सकते हैं\n\nआज मैं आपकी कैसे मदद कर सकता हूं?",
  bn: "নমস্কার! 🙏 আমি আপনার AgriNexus AI সহকারী। আপনি:\n\n📸 আপনার ফসলের ছবি পাঠাতে পারেন — আমি রোগ বিশ্লেষণ করব\n💬 চাষ, সার, আবহাওয়া বা বাজার দাম সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করতে পারেন\n🎙️ অথবা মাইক বোতাম ব্যবহার করে কথা বলতে পারেন\n\nআজ আমি কীভাবে আপনাকে সাহায্য করতে পারি?",
  te: "నమస్తే! 🙏 నేను మీ AgriNexus AI సహాయకుడిని. మీరు:\n\n📸 మీ పంట ఫోటో పంపవచ్చు — నేను వ్యాధిని విశ్లేషిస్తాను\n💬 వ్యవసాయం, ఎరువులు, వాతావరణం లేదా మార్కెట్ ధరల గురించి ఏదైనా అడగవచ్చు\n🎙️ లేదా మైక్ బటన్ ఉపయోగించి మాట్లాడవచ్చు\n\nఈ రోజు నేను మీకు ఎలా సహాయం చేయగలను?",
  ta: "வணக்கம்! 🙏 நான் உங்கள் AgriNexus AI உதவியாளர். நீங்கள்:\n\n📸 உங்கள் பயிர் புகைப்படத்தை அனுப்பலாம் — நான் நோயை பகுப்பாய்வு செய்வேன்\n💬 விவசாயம், உரம், வானிலை அல்லது சந்தை விலை பற்றி எதையும் கேட்கலாம்\n🎙️ அல்லது மைக் பொத்தானைப் பயன்படுத்தி பேசலாம்\n\nஇன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
  kn: "ನಮಸ್ಕಾರ! 🙏 ನಾನು ನಿಮ್ಮ AgriNexus AI ಸಹಾಯಕ. ನೀವು:\n\n📸 ನಿಮ್ಮ ಬೆಳೆಯ ಫೋಟೋ ಕಳುಹಿಸಬಹುದು — ನಾನು ರೋಗವನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತೇನೆ\n💬 ಕೃಷಿ, ಗೊಬ್ಬರ, ಹವಾಮಾನ ಅಥವಾ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳ ಬಗ್ಗೆ ಏನನ್ನಾದರೂ ಕೇಳಬಹುದು\n🎙️ ಅಥವಾ ಮೈಕ್ ಬಟನ್ ಬಳಸಿ ಮಾತನಾಡಬಹುದು\n\nಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
  mr: "नमस्कार! 🙏 मी तुमचा AgriNexus AI सहाय्यक आहे. तुम्ही:\n\n📸 तुमच्या पिकाचा फोटो पाठवू शकता — मी रोग विश्लेषण करीन\n💬 शेती, खते, हवामान किंवा बाजार भावाबद्दल काहीही विचारू शकता\n🎙️ किंवा मायक बटन वापरून बोलू शकता\n\nआज मी तुम्हाला कशी मदत करू शकतो?",
  od: "ନମସ୍କାର! 🙏 ମୁଁ ଆପଣଙ୍କ AgriNexus AI ସହାୟକ। ଆପଣ:\n\n📸 ଆପଣଙ୍କ ଫସଲର ଫୋଟୋ ପଠାଇ ପାରିବେ — ମୁଁ ରୋଗ ବିଶ୍ଳେଷଣ କରିବି\n💬 ଚାଷ, ସାର, ପାଗ କିମ୍ବା ବଜାର ଦାମ ବିଷୟରେ ଯେକୌଣସି କିଛି ପଚାରି ପାରିବେ\n🎙️ କିମ୍ବା ମାଇକ୍ ବଟନ୍ ବ୍ୟବହାର କରି କଥା ହୋଇ ପାରିବେ\n\nଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?",
};

const SUGGESTIONS: Record<string, string[]> = {
  en: [
    "Check my crop for disease",
    "What fertilizer for paddy?",
    "Mandi prices for tomato",
    "How to store harvested grain?",
  ],
  hi: [
    "मेरी फसल की जांच करें",
    "धान के लिए कौन सा खाद?",
    "टमाटर का मंडी भाव",
    "कटाई के बाद अनाज कैसे रखें?",
  ],
  bn: [
    "আমার ফসল রোগ চেক করুন",
    "ধানের জন্য কোন সার?",
    "টমেটোর মান্ডি দাম",
    "কেটে নেওয়া শস্য কীভাবে রাখবেন?",
  ],
  te: [
    "నా పంటను వ్యాధి కోసం చెక్ చేయండి",
    "వరికి ఏ ఎరువు?",
    "టమాటా మార్కెట్ ధర",
    "కోత తర్వాత ధాన్యం ఎలా నిల్వ చేయాలి?",
  ],
  ta: [
    "என் பயிரை நோய் சரிபார்க்கவும்",
    "நெல்லுக்கு என்ன உரம்?",
    "தக்காளி சந்தை விலை",
    "அறுவடை செய்த தானியத்தை எப்படி சேமிப்பது?",
  ],
  kn: [
    "ನನ್ನ ಬೆಳೆಯನ್ನು ರೋಗಕ್ಕಾಗಿ ಪರಿಶೀಲಿಸಿ",
    "ಭತ್ತಕ್ಕೆ ಯಾವ ಗೊಬ್ಬರ?",
    "ಟೊಮೆಟೊ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ",
    "ಕೊಯ್ಲು ಮಾಡಿದ ಧಾನ್ಯವನ್ನು ಹೇಗೆ ಸಂಗ್ರಹಿಸುವುದು?",
  ],
  mr: [
    "माझ्या पिकाची रोग तपासणी करा",
    "तांदूळासाठी कोणते खत?",
    "टोमॅटोचा बाजार भाव",
    "कापलेले धान्य कशी ठेवायचे?",
  ],    or: [
    "ମୋ ଫସଲକୁ ରୋଗ ପରୀକ୍ଷା କରନ୍ତୁ",
    "ଧାନ ପାଇଁ କେଉଁ ସାର?",
    "ଟମାଟୋ ବଜାର ଦାମ",
    "କଟା ଯାଇଥିବା ଶସ୍ୟ କିପରି ରଖିବେ?",
  ],
};

export default function AIAssistantPage() {
  const { language: ctxLang } = useLanguage();
  const { user } = useAuth();

  const [chatLang, setChatLang] = useState(ctxLang || "en");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState("image/jpeg");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Set initial welcome message
  useEffect(() => {
    if (!historyLoaded) {
      setMessages([
        {
          role: "assistant",
          content: WELCOME_MESSAGES[chatLang] || WELCOME_MESSAGES.en,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [chatLang, historyLoaded]);

  // Load conversation history from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured() || !user?.id || historyLoaded) return;

    loadConversationHistory(supabase, user.id, 50).then((history) => {
      if (history.length > 0) {
        setMessages(
          history.map((msg) => ({
            ...msg,
            timestamp: new Date().toISOString(),
          }))
        );
      }
      setHistoryLoaded(true);
    });
  }, [user?.id, historyLoaded]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // --- Image Handling ---
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result as string);
      setImageMimeType(file.type || "image/jpeg");
    };
    reader.readAsDataURL(file);
  }, []);

  // --- Voice (Speech-to-Text) ---
  const startRecording = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang =
      chatLang === "hi" ? "hi-IN" :
      chatLang === "bn" ? "bn-IN" :
      chatLang === "te" ? "te-IN" :
      chatLang === "ta" ? "ta-IN" :
      chatLang === "kn" ? "kn-IN" :
      chatLang === "mr" ? "mr-IN" :
      chatLang === "or" ? "or-IN" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
      setIsRecording(false);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [chatLang]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  // --- Text-to-Speech ---
  const speak = useCallback((text: string) => {
    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      chatLang === "hi" ? "hi-IN" :
      chatLang === "bn" ? "bn-IN" :
      chatLang === "te" ? "te-IN" :
      chatLang === "ta" ? "ta-IN" :
      chatLang === "kn" ? "kn-IN" :
      chatLang === "mr" ? "mr-IN" :
      chatLang === "or" ? "or-IN" : "en-US";
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [chatLang]);

  // --- Send Message ---
  const handleSend = useCallback(async (query?: string) => {
    const text = query || input.trim();
    if ((!text && !selectedImage) || loading) return;
    setInput("");
    setSelectedImage(null);

    const userMsg: Message = {
      role: "user",
      content: text || (selectedImage ? "Please analyze this crop image" : ""),
      imageUrl: selectedImage || undefined,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Build conversation history for Gemini
      const history = newMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      // Call Gemini
      const reply = await askGemini(
        userMsg.content,
        chatLang,
        selectedImage || undefined,
        imageMimeType
      );

      const assistantMsg: Message = {
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Save to Supabase
      if (isSupabaseConfigured() && user?.id) {
        saveConversation(supabase, user.id, "user", userMsg.content, chatLang, userMsg.imageUrl);
        saveConversation(supabase, user.id, "assistant", reply, chatLang);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, selectedImage, loading, messages, chatLang, imageMimeType, user?.id]);

  const suggestions = SUGGESTIONS[chatLang] || SUGGESTIONS.en;

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-8 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[85vh] overflow-hidden">
        {/* Header with Language Selector */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-sm font-bold">AgriNexus AI Assistant</h1>
              <p className="text-[10px] text-emerald-300">
                {loading ? "Analyzing..." : "Online"} | Image + Voice + Multi-lingual
              </p>
            </div>
          </div>

          {/* Language Dropdown */}
          <select
            value={chatLang}
            onChange={(e) => setChatLang(e.target.value as typeof chatLang)}
            className="bg-emerald-800 text-white text-xs px-3 py-2 rounded-xl border border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="flex items-start gap-2 max-w-[85%]">
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sprout className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-slate-200/80 text-slate-800 shadow-sm"
                  }`}
                >
                  {/* Show image if user sent one */}
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Crop"
                      className="w-full max-w-[250px] rounded-xl mb-2"
                    />
                  )}
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => speak(msg.content)}
                      className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-700 cursor-pointer"
                    >
                      <Volume2 className={`w-3 h-3 ${isSpeaking ? "animate-pulse" : ""}`} />
                      <span>{isSpeaking ? "Stop" : "Listen"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>AI is analyzing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="p-3 bg-slate-100/70 border-t border-slate-200/60 flex flex-wrap gap-1.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s)}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Image Preview */}
        {selectedImage && (
          <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 flex items-center gap-3">
            <img src={selectedImage} alt="Selected" className="w-12 h-12 rounded-lg object-cover" />
            <span className="text-xs text-emerald-800 font-medium">Image attached</span>
            <button
              onClick={() => setSelectedImage(null)}
              className="ml-auto p-1 rounded-full hover:bg-emerald-200 cursor-pointer"
            >
              <X className="w-4 h-4 text-emerald-700" />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Image Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
              title="Upload crop image"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Text Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your crops..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Mic Button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-xl transition-colors cursor-pointer ${
                isRecording
                  ? "bg-red-100 text-red-600 animate-pulse"
                  : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
              title={isRecording ? "Stop recording" : "Speak to AI"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!input.trim() && !selectedImage) || loading}
              className="p-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
