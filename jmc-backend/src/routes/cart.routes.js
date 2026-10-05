import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from '../controllers/cart.controller.js';
import { protect, requireOrderingEnabled } from '../middleware/auth.js';

const router = Router();
router.use(protect, requireOrderingEnabled);
router.get('/', getCart);
router.post('/', addToCart);
router.delete('/', clearCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeCartItem);
export default router;
