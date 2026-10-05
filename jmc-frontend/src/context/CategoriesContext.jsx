import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCategories } from "../api/categories";

const CategoriesContext = createContext(null);

// Categories are public and rarely change: fetched once and shared.
export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getCategories()
      .then((res) => alive && setCategories(res.data || []))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => ({ categories, loading }), [categories, loading]);
  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export const useCategories = () => useContext(CategoriesContext);
