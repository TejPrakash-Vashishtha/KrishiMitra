import { Router } from "express";
import { getFields, createField, deleteField } from "../controllers/field.controller.js";

const router = Router();

router.get("/", getFields);
router.post("/", createField);
router.delete("/:id", deleteField);

export default router;
