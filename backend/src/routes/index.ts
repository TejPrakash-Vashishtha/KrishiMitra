import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import authRoutes from "./auth.routes.js";
import weatherRoutes from "./weather.routes.js";
import analysisRoutes from "./analysis.routes.js";
import productRoutes from "./product.routes.js";
import dealerRoutes from "./dealer.routes.js";
import chatRoutes from "./chat.routes.js";
import cropPostRoutes from "./cropPost.routes.js";
import notificationRoutes from "./notification.routes.js";
import adminRoutes from "./admin.routes.js";
import fieldRoutes from "./field.routes.js";

// 5 New Advanced Agricultural Intelligence Routes
import digitalTwinRoutes from "./digitalTwin.routes.js";
import multiAgentRoutes from "./multiAgent.routes.js";
import simulationRoutes from "./simulation.routes.js";
import ragRoutes from "./rag.routes.js";
import gisRoutes from "./gis.routes.js";

const router = Router();

// Public routes
router.use("/auth", authRoutes);
router.use("/weather", weatherRoutes);

// Protected routes (Require JWT)
router.use(authenticateToken);

router.use("/analysis", analysisRoutes);
router.use("/products", productRoutes);
router.use("/dealers", dealerRoutes);
router.use("/chat", chatRoutes);
router.use("/crop-posts", cropPostRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);
router.use("/fields", fieldRoutes);

// Advanced intelligence routes
router.use("/digital-twin", digitalTwinRoutes);
router.use("/multi-agent", multiAgentRoutes);
router.use("/simulation", simulationRoutes);
router.use("/rag", ragRoutes);
router.use("/gis", gisRoutes);

export default router;
