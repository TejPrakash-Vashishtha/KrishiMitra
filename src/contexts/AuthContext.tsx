import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../services/api";

export interface User {
  id: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  district: string;
  pincode: string;
  village: string;
  address: string;
  role: "FARMER" | "DEALER" | "ADMIN" | "CUSTOMER";
  shopName?: string;
  shopCategory?: string;
  createdAt: string;
  // ---- Government Schemes layer (Phase 1-4) ----
  land_acres?: number | null;
  crop_type?: string | null;
  annual_income_inr?: number | null;
  age?: number | null;
  aadhaar_linked?: boolean;
  bank_account_linked?: boolean;
  land_records_uploaded?: boolean;
  is_income_tax_payer?: boolean;
}

export interface RegisterInput {
  name: string;
  phone: string;
  pin: string;
  village: string;
  city: string;
  state: string;
  district: string;
  pincode: string;
  address: string;
  role: "FARMER" | "DEALER" | "ADMIN" | "CUSTOMER";
  shopName?: string;
  shopCategory?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string, pin: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (data: RegisterInput) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  updateProfile: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("agn_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // ---- LOGIN via Express Backend ----
  const login = useCallback(async (phone: string, pin: string) => {
    try {
      const response = await api.post("/auth/login", { phone, password: pin });
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem("agn_current_user", JSON.stringify(response.data.user));
        localStorage.setItem("km_auth_token", response.data.token);
        return { success: true, user: response.data.user };
      }
      return { success: false, error: "Login failed." };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Login failed. Please try again." };
    }
  }, []);

  // ---- REGISTER via Express Backend ----
  const register = useCallback(async (data: RegisterInput) => {
    try {
      const payload = {
        name: data.name,
        phone: data.phone,
        password: data.pin,
        role: data.role,
        district: data.district,
        shopName: data.shopName,
      };
      const response = await api.post("/auth/register", payload);
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem("agn_current_user", JSON.stringify(response.data.user));
        localStorage.setItem("km_auth_token", response.data.token);
        return { success: true, user: response.data.user };
      }
      return { success: false, error: "Registration failed." };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Registration failed. Please try again." };
    }
  }, []);

  // ---- LOGOUT ----
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("agn_current_user");
    localStorage.removeItem("km_auth_token");
  }, []);

  // ---- UPDATE PROFILE (Local Only For Now) ----
  const updateProfile = useCallback(async (patch: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...patch };
    setUser(updated as User);
    localStorage.setItem("agn_current_user", JSON.stringify(updated));
  }, [user]);

  // ---- REFRESH USER (Local Only For Now) ----
  const refreshUser = useCallback(async () => {
    // Ideally this would be an API call to GET /auth/me to refresh from backend
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

// Log search local storage fallback (used by Mandi pages)
export async function logSearch(
  farmerId: string | null,
  searchType: string,
  query: string,
  result?: unknown,
  location?: string
) {
  try {
    const history = JSON.parse(localStorage.getItem("agn_search_history") || "[]");
    history.unshift({
      id: Date.now(),
      farmerId,
      searchType,
      query,
      result,
      location,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("agn_search_history", JSON.stringify(history.slice(0, 200)));
  } catch {
    // ignore
  }
}