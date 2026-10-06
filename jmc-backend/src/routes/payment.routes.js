import { Router } from 'express';
import { createPaymentOrder, verifyPayment, reportPaymentFailure } from '../controllers/payment.controller.js';
import { protect, requireOrderingAccess } from '../middleware/auth.js';

const router = Router();
router.use(protect, requireOrderingAccess);
router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/failed', reportPaymentFailure);
export default router;
