import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import { config } from "./config/index.js";
import routes from "./routes/index.js";
import { initSocket } from "./services/chat/socket.service.js";

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend localhost Vite port 5173
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static uploaded photos
const uploadDir = config.uploadDir || path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadDir));

// API router
app.use("/api", routes);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "AgriNexus API Server",
    time: new Date().toISOString(),
    demoMode: config.demoMode,
  });
});

// Setup WebSockets
initSocket(server);

const PORT = config.port || 5000;
server.listen(PORT, () => {
  console.log(`?? AgriNexus Backend running on http://localhost:${PORT}`);
  console.log(`?? WebSocket server initialized`);
  console.log(`?? Ready to serve farmers across India`);
});
