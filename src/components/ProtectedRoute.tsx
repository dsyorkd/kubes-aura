/**
 * Route guard that redirects unauthenticated users to login.
 * Optionally enforces a minimum role (admin > operator > viewer).
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import type { User } from "@/types/pi-controller";

const ROLE_HIERARCHY: Record<User["role"], number> = {
  viewer: 0,
  operator: 1,
  admin: 2,
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: User["role"];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user) {
    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
    if (userLevel < requiredLevel) {
      return <Navigate to="/pi-controller" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
