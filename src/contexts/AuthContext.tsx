import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { hashPin, normalizePhone, isValidPin } from "../lib/pin";

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
  role: "FARMER" | "DEALER" | "ADMIN";
  shopName?: string;
  shopCategory?: string;
  createdAt: string;
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
  role: "FARMER" | "DEALER" | "ADMIN";
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

// ---- localStorage fallback helpers (offline/demo mode) ----
interface LocalUser extends User {
  pinHash: string;
}

function getLocalUsers(): LocalUser[] {
  try {
    return JSON.parse(localStorage.getItem("agn_registered_users") || "[]");
  } catch {
    return [];
  }
}

function saveLocalUsers(users: LocalUser[]) {
  localStorage.setItem("agn_registered_users", JSON.stringify(users));
}

function mapFarmerRow(row: any): User {
  return {
    id: row.id,
    name: row.name || "",
    phone: row.phone || "",
    city: row.city || "",
    state: row.state || "",
    district: row.district || "",
    pincode: row.pincode || "",
    village: row.village || "",
    address: row.address || "",
    role: row.role || "FARMER",
    shopName: row.shop_name || "",
    shopCategory: row.shop_category || "",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// Log search to Supabase or localStorage (used by Mandi pages)
export async function logSearch(
  farmerId: string | null,
  searchType: string,
  query: string,
  result?: unknown,
  location?: string
) {
  if (isSupabaseConfigured() && supabase && farmerId) {
    await supabase.from("search_history").insert({
      farmer_id: farmerId,
      search_type: searchType,
      search_query: query,
      search_result: result || null,
      location: location || "",
    });
  }
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

// ---- LOGIN with Mobile Number + PIN ----
  const login = useCallback(
    async (phone: string, pin: string): Promise<{ success: boolean; error?: string; user?: User }> => {
      try {
        const cleanPhone = normalizePhone(phone);
        if (!isValidPin(pin)) {
          return { success: false, error: "PIN must be 4 to 6 digits." };
        }
        const pinHash = await hashPin(pin);

        if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase
            .from("farmers")
            .select("*")
            .eq("phone", cleanPhone)
            .single();

          if (error || !data) {
            return { success: false, error: "Account not found. Please register first." };
          }
          if (!data.pin_hash) {
            return { success: false, error: "No PIN set on this account. Please register again with a PIN." };
          }
          if (data.pin_hash !== pinHash) {
            return { success: false, error: "Invalid mobile number or PIN." };
          }

          const u = mapFarmerRow(data);
          setUser(u);
          localStorage.setItem("agn_current_user", JSON.stringify(u));
          return { success: true, user: u };
        }

        // localStorage fallback
        const users = getLocalUsers();
        const found = users.find((x) => x.phone.replace(/\D/g, "") === cleanPhone.replace(/\D/g, ""));
        if (!found) return { success: false, error: "Account not found. Please register first." };
        if (found.pinHash !== pinHash) return { success: false, error: "Invalid mobile number or PIN." };
        const { pinHash: _ph, ...pubUser } = found;
        setUser(pubUser);
        localStorage.setItem("agn_current_user", JSON.stringify(pubUser));
        return { success: true, user: pubUser };
      } catch (e: any) {
        return { success: false, error: e?.message || "Login failed. Please try again." };
      }
    },
    []
  );

// ---- REGISTER with Mobile Number + PIN ----
  const register = useCallback(
    async (data: RegisterInput): Promise<{ success: boolean; error?: string; user?: User }> => {
      try {
        const cleanPhone = normalizePhone(data.phone);
        if (!data.name.trim()) return { success: false, error: "Please enter your name." };
        if (cleanPhone.replace(/\D/g, "").length < 10) {
          return { success: false, error: "Please enter a valid 10-digit mobile number." };
        }
        if (!isValidPin(data.pin)) {
          return { success: false, error: "PIN must be 4 to 6 digits." };
        }
        const pinHash = await hashPin(data.pin);

        if (isSupabaseConfigured() && supabase) {
          const { data: existing } = await supabase.from("farmers").select("id").eq("phone", cleanPhone).maybeSingle();
          if (existing) {
            return { success: false, error: "This mobile number is already registered. Please login instead." };
          }

          const basePayload = {
            phone: cleanPhone,
            name: data.name.trim(),
            village: data.village || "",
            city: data.city || "",
            state: data.state || "",
            district: data.district || "",
            pincode: data.pincode || "",
            address: data.address || "",
            role: data.role || "FARMER",
            pin_hash: pinHash,
          };
          const merchantFields =
            data.role === "DEALER"
              ? { shop_name: data.shopName || "", shop_category: data.shopCategory || "" }
              : {};

          let { data: created, error } = await supabase
            .from("farmers")
            .insert({ ...basePayload, ...merchantFields })
            .select()
            .single();

          // If migration 005 (shop columns) hasn't run yet, retry without them
          if (error && data.role === "DEALER") {
            const retry = await supabase.from("farmers").insert(basePayload).select().single();
            created = retry.data;
            error = retry.error;
          }

          if (error) {
            return { success: false, error: `Registration failed: ${error.message}` };
          }

          const u = mapFarmerRow(created);
          setUser(u);
          localStorage.setItem("agn_current_user", JSON.stringify(u));
          await supabase.from("activity_log").insert({
            farmer_id: u.id,
            action: "register",
            details: { name: u.name, city: u.city, state: u.state, role: u.role },
          });
          return { success: true, user: u };
        }

        // localStorage fallback
        const users = getLocalUsers();
        if (users.some((x) => x.phone.replace(/\D/g, "") === cleanPhone.replace(/\D/g, ""))) {
          return { success: false, error: "This mobile number is already registered. Please login instead." };
        }
        const localUser: LocalUser = {
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: data.name.trim(),
          phone: cleanPhone,
          city: data.city || "",
          state: data.state || "",
          district: data.district || "",
          pincode: data.pincode || "",
          village: data.village || "",
          address: data.address || "",
          role: "FARMER",
          createdAt: new Date().toISOString(),
          pinHash,
        };
        users.push(localUser);
        saveLocalUsers(users);
        const { pinHash: _ph2, ...pubUser } = localUser;
        setUser(pubUser);
        localStorage.setItem("agn_current_user", JSON.stringify(pubUser));
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e?.message || "Registration failed. Please try again." };
      }
    },
    []
  );

  // ---- LOGOUT ----
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("agn_current_user");
  }, []);

  // ---- UPDATE PROFILE ----
  const updateProfile = useCallback(async (patch: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...patch };
    setUser(updated);
    localStorage.setItem("agn_current_user", JSON.stringify(updated));
    if (isSupabaseConfigured() && supabase) {
      const {
        id: _id,
        createdAt: _ca,
        role: _role,
        shopName: _sn,
        shopCategory: _sc,
        ...fields
      } = updated;
      await supabase
        .from("farmers")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    } else {
      const users = getLocalUsers();
      const idx = users.findIndex((x) => x.id === user.id);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...patch } as LocalUser;
        saveLocalUsers(users);
      }
    }
  }, [user]);

  // ---- REFRESH USER (re-fetch the row from the database) ----
  const refreshUser = useCallback(async () => {
    if (!user) return;
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from("farmers").select("*").eq("id", user.id).maybeSingle();
      if (!error && data) {
        const u = mapFarmerRow(data);
        setUser(u);
        localStorage.setItem("agn_current_user", JSON.stringify(u));
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;