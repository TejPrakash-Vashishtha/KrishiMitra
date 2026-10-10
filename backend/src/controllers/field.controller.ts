import { Request, Response } from "express";
import { prisma } from "../prisma/client.js";

// Get all fields for the authenticated user
export const getFields = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const fields = await prisma.field.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, fields });
  } catch (error: any) {
    console.error("Get fields error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch fields" });
  }
};

import fs from "fs";

// Create a new field
export const createField = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Saving field... (backend restarted successfully)");
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Protect against ghost sessions (user deleted but token still exists)
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      res.status(401).json({ success: false, message: "Your account session is invalid or the database was reset. Please log out and log back in." });
      return;
    }

    const { name, geoJson, areaSqm, crop, sowingDate, khasraNo, khataNo, village } = req.body;

    const field = await prisma.field.create({
      data: {
        userId,
        name: name || "My Farm Plot",
        geoJson,
        areaSqm,
        crop,
        sowingDate,
        khasraNo,
        khataNo,
        village,
      },
    });

    // Automatically increase farmer profile acreage for eligibility
    const profile = await prisma.farmerProfile.findUnique({ where: { userId } });
    if (profile) {
       const acres = areaSqm / 4046.86;
       await prisma.farmerProfile.update({
          where: { userId },
          data: { farmSize: (profile.farmSize || 0) + acres }
       });
    }

    res.status(201).json({ success: true, field });
  } catch (error: any) {
    fs.writeFileSync("field_error.log", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("Create field error:", error);
    res.status(500).json({ success: false, message: "Failed to create field" });
  }
};

// Delete a field
export const deleteField = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    
    const { id } = req.params;

    const field = await prisma.field.findUnique({ where: { id } });
    if (!field || field.userId !== userId) {
      res.status(404).json({ success: false, message: "Field not found or unauthorized" });
      return;
    }

    await prisma.field.delete({ where: { id } });

    // Optional: Decrease farmer profile acreage
    const profile = await prisma.farmerProfile.findUnique({ where: { userId } });
    if (profile) {
       const acres = field.areaSqm / 4046.86;
       await prisma.farmerProfile.update({
          where: { userId },
          data: { farmSize: Math.max(0, (profile.farmSize || 0) - acres) }
       });
    }

    res.json({ success: true, message: "Field deleted successfully" });
  } catch (error: any) {
    console.error("Delete field error:", error);
    res.status(500).json({ success: false, message: "Failed to delete field" });
  }
};
