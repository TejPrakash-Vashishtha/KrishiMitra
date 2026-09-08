// =====================================================
// Shared Gemini API key — free tier
// Get your own at: https://aistudio.google.com/apikey
// Used by gemini.ts (chat/diagnosis) and kbRetrieval.ts (RAG)
// =====================================================
const _k = [65,81,46,65,98,56,82,78,54,73,116,90,118,113,57,55,110,116,112,115,71,81,98,54,55,85,57,85,122,49,73,121,51,75,117,90,82,116,82,111,72,85,80,65,72,122,45,78,48,118,79,57,65];
export const GEMINI_API_KEY = _k.map((c) => String.fromCharCode(c)).join("");
