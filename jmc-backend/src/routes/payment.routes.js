import { Router } from 'express';
import { createPaymentOrder, verifyPayment } from '../controllers/payment.controller.js';
import { protect, requireOrderingEnabled } from '../middleware/auth.js';

const router = Router();
router.use(protect, requireOrderingEnabled);
router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
export default router;
