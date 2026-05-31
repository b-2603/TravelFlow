import { createContext, useEffect, useMemo, useState } from 'react';
import { authAPI } from '../services/api';
import { getRole, isTokenExpired } from '../utils/jwtHelper';

export const AuthContext = createContext(null);

const STORAGE_KEY = import.meta.env.VITE_STORAGE_KEY || 'travel_management_auth';

function readStoredAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return { token: null, user: null };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token ?? null,
      user: parsed?.user ?? null,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const stored = readStoredAuth();
  const [token, setToken] = useState(stored.token);
  const [user, setUser] = useState(stored.user);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const persistAuth = (nextToken, nextUser) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: nextToken,
        user: nextUser,
        role: getRole(nextToken),
      })
    );

    setToken(nextToken);
    setUser(nextUser);
  };

  const refreshUser = async () => {
    if (!token || isTokenExpired(token)) {
      clearAuth();
      return null;
    }

    try {
      const response = await authAPI.me();
      const nextUser = response.data?.data?.user ?? response.data?.data ?? null;

      if (nextUser) {
        persistAuth(token, nextUser);
      }

      return nextUser;
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        clearAuth();
      }
      throw error;
    }
  };

  const updateCurrentUser = (nextUser) => {
    if (!token || !nextUser) {
      return;
    }

    persistAuth(token, nextUser);
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const nextToken = response.data?.data?.token;
    const nextUser = response.data?.data?.user;

    if (!nextToken || !nextUser) {
      throw new Error('Thiếu dữ liệu đăng nhập hợp lệ.');
    }

    persistAuth(nextToken, nextUser);

    try {
      const meResponse = await authAPI.me();
      const verifiedUser = meResponse.data?.data?.user ?? meResponse.data?.data ?? nextUser;
      persistAuth(nextToken, verifiedUser);
    } catch (error) {
      clearAuth();
      throw error;
    }

    return response.data?.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout();
      }
    } finally {
      clearAuth();
    }
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        if (!token || isTokenExpired(token)) {
          clearAuth();
          return;
        }

        const response = await authAPI.me();
        const nextUser = response.data?.data?.user ?? response.data?.data ?? null;

        if (mounted && nextUser) {
          persistAuth(token, nextUser);
        }
      } catch (error) {
        const status = error?.response?.status;
        if (mounted && status === 401) {
          clearAuth();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    const handleLogout = () => {
      clearAuth();
      setIsLoading(false);
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      mounted = false;
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      role: user?.role || getRole(token),
      login,
      logout,
      refreshUser,
      updateCurrentUser,
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
