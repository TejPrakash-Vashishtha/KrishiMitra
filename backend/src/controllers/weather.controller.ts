import { Request, Response } from "express";
import { reverseGeocode, getWeatherData } from "../services/weather/weather.service.js";

export const getCurrentWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 28.6139;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : 77.2090;
    const city = (req.query.city as string) || "New Delhi";

    const weather = await getWeatherData(lat, lon, city);
    res.json({ success: true, ...weather });
  } catch (error: any) {
    console.error("Weather controller error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch weather data" });
  }
};

export const getGeocode = async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      res.status(400).json({ success: false, message: "Valid lat and lon are required" });
      return;
    }

    const location = await reverseGeocode(lat, lon);
    res.json({ success: true, location });
  } catch (error: any) {
    console.error("Geocode error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to geocode location" });
  }
};
