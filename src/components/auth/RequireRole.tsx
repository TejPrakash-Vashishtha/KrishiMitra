import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import PageLoader from "../common/PageLoader";

interface RequireRoleProps {
  role: "FARMER" | "DEALER" | "ADMIN" | "CUSTOMER";
  children: React.ReactNode;
}

/**
 * Route guard for role-specific areas.
 * - Not logged in  → login page pre-tagged with the right role (+ returnTo)
 * - Wrong role     → bounced to that user's own home (/merchant or /dashboard)
 */
export default function RequireRole({ role, children }: RequireRoleProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <PageLoader
        message="Verifying account permissions..."
        subtext="Connecting to agricultural secure gateway"
        minHeight="min-h-[50vh]"
      />
    );
  }

  if (!user) {
    const as = role === "DEALER" ? "merchant" : role === "CUSTOMER" ? "customer" : "farmer";
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?as=${as}&returnTo=${returnTo}`} replace />;
  }

  if (user.role !== role && user.role !== "ADMIN") {
    return <Navigate to={user.role === "DEALER" ? "/merchant" : user.role === "CUSTOMER" ? "/shop" : "/dashboard"} replace />;
  }

  return <>{children}</>;
}
