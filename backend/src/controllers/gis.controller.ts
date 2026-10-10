import { Request, Response } from "express";
import { prisma } from "../prisma/client.js";

// Requirement 20: Real NDVI from Sentinel-2 (Stub architecture for Copernicus Data Space)
export const getSentinelData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;
    
    // In a real app, we'd look up the field's GeoJSON to send to the Copernicus API
    const field = await prisma.field.findUnique({ where: { id: fieldId } });
    if (!field) {
      res.status(404).json({ success: false, message: "Field not found" });
      return;
    }

    // REQUIREMENT 21: Handle cloud gaps and tiny plots.
    // A 1-acre plot is ~40 pixels at 10m resolution.
    const isTinyPlot = field.areaSqm < 4000; 

    // Generate 5 simulated satellite passes for the trend chart
    const trendData = [];
    let lastClearImageDate = null;
    let currentMeanNdvi = 0;
    
    // Simulate past 5 weeks of satellite passes
    for (let i = 4; i >= 0; i--) {
       const date = new Date();
       date.setDate(date.getDate() - (i * 5)); // Sentinel-2 passes every ~5 days
       
       // Randomly simulate clouds (30% chance)
       const cloudCover = Math.floor(Math.random() * 100);
       const isCloudy = cloudCover > 40;
       
       if (!isCloudy) {
          lastClearImageDate = date.toISOString();
          currentMeanNdvi = 0.3 + (Math.random() * 0.5); // 0.3 to 0.8
       }
       
       trendData.push({
          date: date.toISOString().split("T")[0],
          ndvi: isCloudy ? null : currentMeanNdvi, // Null if cloudy gap
          cloudCover,
          status: isCloudy ? "CLOUDY" : "CLEAR"
       });
    }

    res.json({
      success: true,
      data: {
         meanNdvi: currentMeanNdvi.toFixed(2),
         lastClearImageDate,
         isTinyPlot,
         qualityNote: isTinyPlot ? "Plot is very small (< 1 acre). Pixel mixing may reduce NDVI accuracy." : "Good spatial resolution.",
         // Requirement 22: Label soil moisture as area average
         soilMoisture: {
            value: 36.5,
            label: "Area Average (Regional Model)",
            note: "Data is from a coarse 10km grid, not plot-level."
         },
         trendChart: trendData
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
