/**
 * Shared Axios Instance with Auth Interceptors
 *
 * Single axios instance used by all API hooks. Handles automatic
 * token attachment and transparent token refresh on 401 responses.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/** Axios config extended with a retry flag to prevent infinite refresh loops. */
interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

// ── Token helpers ────────────────────────────────────────────────────────────

const TOKEN_KEY = 'pi-controller-token';
const REFRESH_TOKEN_KEY = 'pi-controller-refresh-token';
const USER_KEY = 'pi-controller-user';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Axios instance ───────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: '/api/v1',
});

// ── Request interceptor: attach Bearer token ─────────────────────────────────

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: refresh on 401 ─────────────────────────────────────

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    // Don't attempt refresh for auth endpoints or missing config
    if (
      !originalRequest ||
      !error.response ||
      error.response.status !== 401 ||
      originalRequest.url?.startsWith('/auth/')
    ) {
      return Promise.reject(error);
    }

    // Avoid infinite loops by marking retried requests
    if (originalRequest._retried) {
      clearAuth();
      window.location.href = '/auth/login';
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    try {
      // Deduplicate concurrent refresh attempts
      if (!refreshPromise) {
        refreshPromise = attemptRefresh();
      }

      const newAccessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch {
      clearAuth();
      window.location.href = '/auth/login';
      return Promise.reject(error);
    } finally {
      refreshPromise = null;
    }
  },
);

async function attemptRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  // Use raw axios (not the intercepted instance) to avoid loops
  const response = await axios.post('/api/v1/auth/refresh', {
    refresh_token: refreshToken,
  });

  const { access_token, refresh_token } = response.data;
  setTokens(access_token, refresh_token);
  return access_token;
}

export default apiClient;
