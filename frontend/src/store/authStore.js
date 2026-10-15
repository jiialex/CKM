import { create } from "zustand";
import { decodeJWT } from "../utils/jwt";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

const persistTokens = ({ accessToken, refreshToken }) => {
  if (typeof window === "undefined") {
    return;
  }

  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

const buildUserFromToken = (token, fallbackUser = null) => {
  const decoded = decodeJWT(token);

  if (!decoded) {
    return fallbackUser;
  }

  return {
    username: decoded.sub,
    role: decoded.role,
    caType: decoded.caType,
  };
};

const getInitialAuthState = () => {
  if (typeof window === "undefined") {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
    };
  }

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const user = buildUserFromToken(accessToken);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const useAuthStore = create((set) => ({
  ...getInitialAuthState(),

  setTokens: (tokens) =>
    set((state) => {
      const nextAccessToken = tokens.accessToken ?? state.accessToken;
      const nextRefreshToken = tokens.refreshToken ?? state.refreshToken;
      const nextUser = tokens.user ?? buildUserFromToken(nextAccessToken, state.user);

      persistTokens({
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
      });

      return {
        user: nextUser,
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
      };
    }),

  clearTokens: () => {
    persistTokens({
      accessToken: null,
      refreshToken: null,
    });

    set({ user: null, accessToken: null, refreshToken: null });
  },

  logout: () => {
    persistTokens({
      accessToken: null,
      refreshToken: null,
    });

    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
