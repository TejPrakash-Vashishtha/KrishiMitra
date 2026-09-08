import dotenv from "dotenv";
import path from "path";


dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "agrinexus-secret-jwt-key-2026",
  demoMode: process.env.DEMO_MODE === "true" || !process.env.OPENAI_API_KEY,
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
  },
  openweather: {
    apiKey: process.env.OPENWEATHER_API_KEY || "",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  whatsappBusinessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || "+919876543210",
  uploadDir: path.resolve(process.cwd(), "uploads"),
};
