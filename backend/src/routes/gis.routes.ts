import { Router } from "express";
import { getSentinelData } from "../controllers/gis.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Phase 4: Sentinel-2 Satellite Integration route
router.get("/satellite-data/:fieldId", authenticateToken, getSentinelData);

export default router;
