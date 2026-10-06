import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { savePendingCartItem, useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";

/** Cart + wishlist actions with a clear login prompt for guests. */
export default function useShopActions() {
  const { isAuthenticated } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const busy = useRef(false);

  const requireLogin = (message, from) => {
    toast.info(message);
    navigate("/login", { state: { from: from || location.pathname + location.search, notice: message } });
  };

  // Guests are sent to sign in; the product is added to their cart right after they log in.
  const queueForLogin = (product, quantity, message, from) => {
    savePendingCartItem({ productId: product.id, quantity, name: product.name });
    requireLogin(message, from);
  };

  const addToCart = async (product, quantity = 1) => {
    if (!isAuthenticated) return queueForLogin(product, quantity, "Please sign in to add items to your cart.");
    try {
      await cart.addItem(product.id, quantity);
      toast.success(`${product.name} added to your cart`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const buyNow = async (product, quantity = 1) => {
    if (!isAuthenticated) return queueForLogin(product, quantity, "Please sign in to continue to checkout.", "/checkout");
    if (busy.current) return;
    busy.current = true;
    try {
      await cart.addItem(product.id, quantity);
      navigate("/checkout");
    } catch (e) {
      toast.error(e.message);
    } finally {
      busy.current = false;
    }
  };

  const toggleWishlist = async (product) => {
    if (!isAuthenticated) return requireLogin("Please sign in to save items to your wishlist.");
    try {
      if (wishlist.has(product.id)) {
        await wishlist.remove(product.id);
        toast.info("Removed from wishlist");
      } else {
        await wishlist.add(product.id);
        toast.success("Added to wishlist");
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  return { addToCart, buyNow, toggleWishlist, inWishlist: (id) => wishlist.has(id) };
}
