import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as cartApi from "../api/cart";
import { useAuth } from "./AuthContext";
import { useCustomerType } from "./CustomerTypeContext";
import { useToast } from "./ToastContext";

const CartContext = createContext(null);
const EMPTY = { items: [], totalItems: 0, subtotal: 0, currency: "" };
const PENDING_KEY = "jmc_pending_cart";

/** A guest who clicked Add to Cart / Buy Now is sent to sign in; the item is added right after login. */
export const savePendingCartItem = (item) => {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(item));
  } catch {
    /* ignore */
  }
};
const takePendingCartItem = () => {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * The single cart (server-side, per account). It is only active for International customers;
 * Indian customers keep the enquiry-only behaviour and never call the cart API.
 */
export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { canShop, currency } = useCustomerType();
  const toast = useToast();
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

  // Load the cart when shopping is enabled. Any item queued while signed out is added first,
  // so the cart (and the page the customer returns to) is complete when loading ends.
  useEffect(() => {
    if (!isAuthenticated || !canShop) {
      setCart(EMPTY);
      return undefined;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const pending = takePendingCartItem();
        if (pending?.productId) {
          try {
            await cartApi.addToCart(pending.productId, pending.quantity || 1);
            if (alive) toast.success(`${pending.name || "Item"} added to your cart`);
          } catch (e) {
            if (alive) toast.error(e.message);
          }
        }
        const res = await cartApi.getCart();
        if (alive) setCart({ ...EMPTY, ...res.data });
      } catch {
        /* non-critical */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isAuthenticated, canShop, currency, toast]);

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
