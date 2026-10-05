import { Router } from 'express';
import { createOrder, getMyOrders, getMyOrder } from '../controllers/order.controller.js';
import { protect, requireOrderingEnabled } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.post('/', requireOrderingEnabled, createOrder);
router.get('/', getMyOrders);
router.get('/:id', getMyOrder);
export default router;
