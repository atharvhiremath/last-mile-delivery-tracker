"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "CUSTOMER" | "AGENT" | "ADMIN";
  companyName?: string | null;
  agentProfile?: {
    id: string;
    vehicleType: string;
    vehicleNumber: string;
    isAvailable: boolean;
    currentLatitude: number;
    currentLongitude: number;
    maxCapacity: number;
    currentActiveLoad: number;
    rating: number;
    operatingZone?: { id: string; name: string; code: string } | null;
  } | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    if (loggedInUser.role === "ADMIN") {
      router.push("/admin/orders");
    } else if (loggedInUser.role === "AGENT") {
      router.push("/agent");
    } else {
      router.push("/customer");
    }
  };

  const logout = () => {
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
