import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { adminLogin, getAnalytics } from "../api/admin";
import { ADMIN_TOKEN_KEY } from "../api/axios";

const AdminAuthContext = createContext(null);
const ADMIN_USER_KEY = "jmc_admin_user";

const store = {
  get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  del: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

const readUser = () => {
  try {
    return JSON.parse(store.get(ADMIN_USER_KEY) || "null");
  } catch {
    return null;
  }
};

// Admin session is fully separate from the customer session (different token key).
export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => store.get(ADMIN_TOKEN_KEY));
  const [admin, setAdmin] = useState(readUser);
  const [loading, setLoading] = useState(!!store.get(ADMIN_TOKEN_KEY));

  const clear = useCallback(() => {
    store.del(ADMIN_TOKEN_KEY);
    store.del(ADMIN_USER_KEY);
    setToken(null);
    setAdmin(null);
  }, []);

  // Restore session: only an admin token can read /admin/analytics (customers get 403).
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let alive = true;
    getAnalytics()
      .catch(() => alive && clear())
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onUnauthorized = (e) => {
      if (e.detail?.admin) clear();
    };
    window.addEventListener("jmc:unauthorized", onUnauthorized);
    return () => window.removeEventListener("jmc:unauthorized", onUnauthorized);
  }, [clear]);

  const login = async (credentials) => {
    const res = await adminLogin(credentials);
    if (res.data.user?.role !== "admin") throw new Error("Admin access required");
    store.set(ADMIN_TOKEN_KEY, res.data.token);
    store.set(ADMIN_USER_KEY, JSON.stringify(res.data.user));
    setToken(res.data.token);
    setAdmin(res.data.user);
    return res;
  };

  const value = useMemo(
    () => ({ admin, token, loading, isAdmin: !!token && admin?.role === "admin", login, logout: clear }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [admin, token, loading]
  );
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export const useAdminAuth = () => useContext(AdminAuthContext);
