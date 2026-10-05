import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth";
import { adminLogin as adminLoginRequest } from "../api/admin";
import { TOKEN_KEY } from "../api/axios";

const AuthContext = createContext(null);

const getStored = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * The single JWT session for customers AND admins.
 * `user.role` ("customer" | "admin") comes from the backend (/auth/login, /auth/me),
 * which re-reads it from the database on every protected request.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStored);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getStored());

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  }, []);

  const persist = useCallback((data) => {
    try {
      localStorage.setItem(TOKEN_KEY, data.token);
    } catch {
      /* ignore */
    }
    setToken(data.token);
    setUser(data.user);
  }, []);

  // Restore session (also refreshes the role from the server)
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let alive = true;
    authApi
      .getMe()
      .then((res) => alive && setUser(res.data.user))
      .catch(() => alive && clear())
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expired / invalid token anywhere → sign out
  useEffect(() => {
    window.addEventListener("jmc:unauthorized", clear);
    return () => window.removeEventListener("jmc:unauthorized", clear);
  }, [clear]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    persist(res.data);
    return res;
  };
  const adminLogin = async (credentials) => {
    const res = await adminLoginRequest(credentials);
    persist(res.data);
    return res;
  };
  const register = async (payload) => {
    const res = await authApi.register(payload);
    persist(res.data);
    return res;
  };
  const updateProfile = async (payload) => {
    const res = await authApi.updateProfile(payload);
    setUser(res.data.user);
    return res;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      isAdmin: !!token && user?.role === "admin",
      login,
      adminLogin,
      register,
      logout: clear,
      updateProfile,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, token, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Where each role lands after logging in. */
export const homeFor = (user, from) => {
  if (user?.role === "admin") return "/admin/dashboard";
  return from && !from.startsWith("/admin") ? from : "/profile";
};
