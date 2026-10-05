import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getContactSettings } from "../api/settings";

const SettingsContext = createContext(null);
const EMPTY = { whatsapp: "", phone: "", email: "", address: "", social: {} };

// Fetched once per page load and shared by every component.
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getContactSettings()
      .then((res) => alive && setSettings({ ...EMPTY, ...res.data }))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => ({ ...settings, loading, error }), [settings, loading, error]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
