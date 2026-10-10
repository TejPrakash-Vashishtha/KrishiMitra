import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";
import { validateRequest } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = Router();
router.post("/login", validateRequest(loginSchema), login);
router.post("/register", validateRequest(registerSchema), register);
export default router;
