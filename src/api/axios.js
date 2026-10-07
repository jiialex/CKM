import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { decodeJWT } from "../utils/jwt";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const AUTH_PATHS = ["/auth/login", "/auth/signup", "/auth/refresh", "/auth/forgot-password"];

const isAuthPath = (url = "") => AUTH_PATHS.some((path) => url.includes(path));

const isTokenExpired = (token) => {
  if (!token) return true;
  const decoded = decodeJWT(token);
  if (!decoded?.exp) return false;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return decoded.exp <= nowInSeconds + 15;
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const authApi = axios.create({
  baseURL: API_BASE_URL,
});

let refreshPromise = null;

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const store = useAuthStore.getState();
      const refreshToken = store.refreshToken;

      if (!refreshToken) throw new Error("No refresh token");

      const res = await authApi.post("/auth/refresh", { refreshToken });

      const { accessToken, refreshToken: newRefresh } = res.data || {};

      store.setTokens({ accessToken, refreshToken: newRefresh || refreshToken });
      return accessToken;
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

// ==================== REQUEST INTERCEPTOR ====================
api.interceptors.request.use(async (config) => {
  if (isAuthPath(config.url)) {
    return config;
  }

  let token = useAuthStore.getState().accessToken;

  if (!token) {
    console.warn("No token found for protected request");
    return config;
  }

  if (isTokenExpired(token)) {
    try {
      token = await refreshAccessToken();
    } catch (e) {
      console.error("Token refresh failed", e);
      useAuthStore.getState().logout();
      return Promise.reject(e);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (!original || isAuthPath(original.url)) {
      return Promise.reject(error);
    }

    if ((error.response?.status === 401 || error.response?.status === 403) && !original._retry) {
      original._retry = true;

      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        console.error("Refresh failed, logging out");
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;