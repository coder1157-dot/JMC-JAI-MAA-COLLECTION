import { Router } from 'express';
import { createOrder, quoteOrder, getMyOrders, getMyOrder, cancelMyOrder } from '../controllers/order.controller.js';
import { startPayment } from '../controllers/payment.controller.js';
import { protect, requireOrderingAccess } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.post('/quote', requireOrderingAccess, quoteOrder);
router.post('/', requireOrderingAccess, createOrder);
router.get('/', getMyOrders);
router.get('/:id', getMyOrder);
router.post('/:id/cancel', cancelMyOrder);
router.post('/:id/retry-payment', requireOrderingAccess, (req, res) => startPayment(req, res, req.params.id));
export default router;
