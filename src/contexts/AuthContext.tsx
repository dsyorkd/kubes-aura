/**
 * Authentication Context for Pi-Controller Integration
 * Provides authentication state management with JWT token handling
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContextType, User, LoginCredentials, RegisterData, AuthResponse } from "@/types/pi-controller";
import { config } from "@/lib/config";
import { toast } from "@/hooks/use-toast";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem("pi-controller-token");
        const storedUser = localStorage.getItem("pi-controller-user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to initialize auth state:", error);
        // Clear potentially corrupted data
        localStorage.removeItem("pi-controller-token");
        localStorage.removeItem("pi-controller-user");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (token && user) {
      const refreshInterval = setInterval(() => {
        refreshToken();
      }, config.security.tokenRefreshInterval);

      return () => clearInterval(refreshInterval);
    }
  }, [token, user]);

  // Auto-logout on session timeout
  useEffect(() => {
    if (token && user) {
      const timeoutId = setTimeout(() => {
        logout();
        toast({
          title: "Session Expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
      }, config.security.sessionTimeout);

      return () => clearTimeout(timeoutId);
    }
  }, [token, user]);

  const makeAuthRequest = async (endpoint: string, data: Record<string, unknown>): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${config.piController.apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Auth request failed:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Authentication request failed",
      };
    }
  };

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);

    try {
      const response = await makeAuthRequest("/auth/login", credentials);

      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);

        // Store in localStorage
        localStorage.setItem("pi-controller-token", response.token);
        localStorage.setItem("pi-controller-user", JSON.stringify(response.user));

        // Update last login
        const updatedUser = { ...response.user, lastLogin: new Date().toISOString() };
        setUser(updatedUser);
        localStorage.setItem("pi-controller-user", JSON.stringify(updatedUser));

        toast({
          title: "Welcome back!",
          description: `Successfully logged in as ${response.user.username}`,
        });

        return response;
      } else {
        toast({
          title: "Login Failed",
          description: response.message || "Invalid credentials",
          variant: "destructive",
        });
        return response;
      }
    } catch (error) {
      const errorMessage = "Login failed due to network error";
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    setIsLoading(true);

    try {
      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        const errorResponse = {
          success: false,
          message: "Passwords do not match",
        };

        toast({
          title: "Registration Failed",
          description: errorResponse.message,
          variant: "destructive",
        });

        return errorResponse;
      }

      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerPayload } = data;

      const response = await makeAuthRequest("/auth/register", registerPayload);

      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);

        // Store in localStorage
        localStorage.setItem("pi-controller-token", response.token);
        localStorage.setItem("pi-controller-user", JSON.stringify(response.user));

        toast({
          title: "Registration Successful",
          description: `Welcome to Pi-Controller, ${response.user.username}!`,
        });

        return response;
      } else {
        toast({
          title: "Registration Failed",
          description: response.message || "Failed to create account",
          variant: "destructive",
        });
        return response;
      }
    } catch (error) {
      const errorMessage = "Registration failed due to network error";
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<void> => {
    if (!token) return;

    try {
      const response = await fetch(`${config.piController.apiBaseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token) {
          setToken(data.token);
          localStorage.setItem("pi-controller-token", data.token);
        }
      } else if (response.status === 401) {
        // Token is invalid, logout user
        logout();
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem("pi-controller-token");
    localStorage.removeItem("pi-controller-user");

    // Navigate to login page
    navigate("/auth/login");

    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;