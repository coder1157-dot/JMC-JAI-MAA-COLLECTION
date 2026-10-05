import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
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

  const requireLogin = (message) => {
    toast.info(message);
    navigate("/login", { state: { from: location.pathname + location.search, notice: message } });
  };

  const addToCart = async (product, quantity = 1) => {
    if (!isAuthenticated) return requireLogin("Please sign in to add items to your cart.");
    try {
      await cart.addItem(product.id, quantity);
      toast.success(`${product.name} added to your cart`);
    } catch (e) {
      toast.error(e.message);
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

  return { addToCart, toggleWishlist, inWishlist: (id) => wishlist.has(id) };
}
