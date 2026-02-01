/**
 * Authentication Context for Pi-Controller Integration
 * Provides authentication state management with JWT token handling
 */

import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AuthContextType,
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  BackendLoginResponse,
  BackendRefreshResponse,
} from "@/types/pi-controller";
import { setTokens, clearAuth } from "@/api/axios";
import { config } from "@/lib/config";
import { toast } from "@/hooks/use-toast";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/** Raw user object that may use either camelCase or snake_case field names. */
interface RawBackendUser {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  role: User["role"];
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
  lastLogin?: string;
  last_login?: string;
}

/**
 * Normalize a backend user object (snake_case) to the frontend User shape (camelCase).
 * Handles both camelCase (login response) and snake_case (register/profile) field names.
 */
function normalizeUser(raw: RawBackendUser): User {
  return {
    id: raw.id,
    username: raw.username,
    email: raw.email,
    firstName: raw.firstName ?? raw.first_name,
    lastName: raw.lastName ?? raw.last_name,
    role: raw.role,
    isActive: raw.isActive ?? raw.is_active,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    lastLogin: raw.lastLogin ?? raw.last_login,
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem("pi-controller-token");
        const storedRefreshToken = localStorage.getItem("pi-controller-refresh-token");
        const storedUser = localStorage.getItem("pi-controller-user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to initialize auth state:", error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const logout = useCallback((): void => {
    // Fire-and-forget logout to backend
    const currentToken = token;
    if (currentToken) {
      axios
        .post(
          `${config.piController.apiBaseUrl}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${currentToken}` } },
        )
        .catch(() => {});
    }

    setUser(null);
    setToken(null);
    setRefreshToken(null);
    clearAuth();

    navigate("/auth/login");

    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  }, [token, navigate]);

  const refreshAccessToken = useCallback(async (): Promise<void> => {
    if (!refreshToken) return;

    try {
      // Use raw axios to avoid interceptor loops
      const response = await axios.post<BackendRefreshResponse>(
        `${config.piController.apiBaseUrl}/auth/refresh`,
        { refresh_token: refreshToken },
      );

      const data = response.data;
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setTokens(data.access_token, data.refresh_token);
    } catch (error) {
      console.error("Token refresh failed:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        logout();
      }
    }
  }, [refreshToken, logout]);

  // Set up token refresh interval
  useEffect(() => {
    if (token && refreshToken && user) {
      const refreshInterval = setInterval(() => {
        refreshAccessToken();
      }, config.security.tokenRefreshInterval);

      return () => clearInterval(refreshInterval);
    }
  }, [token, refreshToken, user, refreshAccessToken]);

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
  }, [token, user, logout]);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);

    try {
      const response = await axios.post<BackendLoginResponse>(
        `${config.piController.apiBaseUrl}/auth/login`,
        credentials,
      );

      const data = response.data;
      const normalizedUser = normalizeUser(data.user);

      // Store tokens
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setUser(normalizedUser);
      setTokens(data.access_token, data.refresh_token);
      localStorage.setItem("pi-controller-user", JSON.stringify(normalizedUser));

      toast({
        title: "Welcome back!",
        description: `Successfully logged in as ${normalizedUser.username}`,
      });

      return {
        success: true,
        user: normalizedUser,
        token: data.access_token,
        refreshToken: data.refresh_token,
      };
    } catch (error) {
      let errorMessage = "Login failed";

      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Login Failed",
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
        const errorResponse: AuthResponse = {
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

      await axios.post(
        `${config.piController.apiBaseUrl}/auth/register`,
        registerPayload,
      );

      // Backend register returns { message, user } with NO tokens.
      // Auto-login to obtain tokens.
      const loginResult = await login({
        username: data.username,
        password: data.password,
      });

      if (loginResult.success) {
        toast({
          title: "Registration Successful",
          description: `Welcome to Pi-Controller, ${loginResult.user?.username}!`,
        });
      }

      return loginResult;
    } catch (error) {
      let errorMessage = "Registration failed";

      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Registration Failed",
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

  const value: AuthContextType = {
    user,
    token,
    refreshToken,
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
