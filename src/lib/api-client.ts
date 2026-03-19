import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

// ═══════════════════════════════════════════════════════════════════════════
// API Client — Centralized Axios instance
// ═══════════════════════════════════════════════════════════════════════════
// Refresh token lives in httpOnly cookie (set by backend).
// Access token lives in memory only (never localStorage).
// We use a module-level variable so it survives within the session but not
// across page reloads — on reload, middleware.ts handles refresh server-side.
// ═══════════════════════════════════════════════════════════════════════════

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // sends httpOnly cookies automatically
});

// ── Request Interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ── Response Interceptor — 401 refresh + 404 graceful ───────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // ── 401: attempt silent refresh ──────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh on auth endpoints (login, register, etc.)
      const url = originalRequest.url ?? "";
      const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/login/2fa");

      if (isAuthEndpoint) {
        // Let the error pass through with the backend's message
        const detail = (error.response?.data as Record<string, unknown>)?.detail;
        const message = (typeof detail === "string" ? detail : null) ?? "Credenciales inválidas";
        return Promise.reject(new Error(message));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.access_token;
        setAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Build readable error message ─────────────────────────────────────
    const detail = (error.response?.data as Record<string, unknown>)?.detail;
    const message =
      (Array.isArray(detail)
        ? detail.map((d: { msg: string }) => d.msg).join(", ")
        : (detail as string)) ??
      (error.response?.data as Record<string, unknown>)?.message ??
      error.message ??
      "Error desconocido";

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
