export type UserRole = "FARMER" | "DEALER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  location?: string;
  preferredLanguage: string;
  farmerProfile?: FarmerProfile;
  dealerProfile?: DealerProfile;
}

export interface FarmerProfile {
  id: string;
  userId: string;
  farmName?: string;
  farmSize?: number;
  location?: string;
  district?: string;
  state?: string;
  primaryCrops?: string;
  soilType?: string;
}

export interface DealerProfile {
  id: string;
  userId: string;
  businessName: string;
  businessAddress: string;
  phone: string;
  whatsappNumber?: string;
  specialization?: string;
  products?: string;
  location: string;
  district: string;
  state: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
}

export interface WeatherForecastItem {
  date: string;
  day: string;
  tempDay: number;
  tempNight: number;
  condition: string;
  description: string;
  rainProbability: number;
  icon: string;
  farmingTip: string;
}

export interface WeatherData {
  city: string;
  district: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  weatherCondition: string;
  weatherDescription: string;
  icon: string;
  rainProbability: number;
  forecast: WeatherForecastItem[];
  agriculturalAdvisory: string[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand?: string;
  description: string;
  price: number;
  imageUrl?: string;
  purchaseUrl: string;
  recommendedFor?: string;
}
