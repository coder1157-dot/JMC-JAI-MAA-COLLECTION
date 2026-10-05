import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as cartApi from "../api/cart";
import { useAuth } from "./AuthContext";
import { CART_ENABLED } from "../utils/constants";

const CartContext = createContext(null);
const EMPTY = { items: [], totalItems: 0, subtotal: 0 };

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cartApi.getCart();
      setCart({ ...EMPTY, ...res.data });
    } catch {
      /* cart is non-critical for browsing */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && CART_ENABLED) refresh();
    else setCart(EMPTY);
  }, [isAuthenticated, refresh]);

  const apply = (res) => {
    setCart({ ...EMPTY, ...res.data });
    return res;
  };

  const value = useMemo(
    () => ({
      ...cart,
      loading,
      refresh,
      addItem: async (productId, quantity = 1) => apply(await cartApi.addToCart(productId, quantity)),
      updateItem: async (itemId, quantity) => apply(await cartApi.updateCartItem(itemId, quantity)),
      removeItem: async (itemId) => apply(await cartApi.removeCartItem(itemId)),
      clear: async () => apply(await cartApi.clearCart()),
      reset: () => setCart(EMPTY),
    }),
    [cart, loading, refresh]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
