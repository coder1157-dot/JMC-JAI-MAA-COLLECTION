import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as wishApi from "../api/wishlist";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wishApi.getWishlist();
      setProducts(res.data.products || []);
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) refresh();
    else setProducts([]);
  }, [isAuthenticated, refresh]);

  const ids = useMemo(() => new Set(products.map((p) => p.id)), [products]);

  const value = useMemo(
    () => ({
      products,
      loading,
      count: products.length,
      has: (id) => ids.has(id),
      refresh,
      add: async (id) => setProducts((await wishApi.addToWishlist(id)).data.products || []),
      remove: async (id) => setProducts((await wishApi.removeFromWishlist(id)).data.products || []),
    }),
    [products, ids, loading, refresh]
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
