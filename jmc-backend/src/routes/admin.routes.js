import { Router } from 'express';
import { adminLogin } from '../controllers/auth.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { authLimiter } from './auth.routes.js';
import * as a from '../controllers/admin.controller.js';

const router = Router();

// Admin login is separate from customer login and rejects non-admin accounts.
router.post('/auth/login', authLimiter, adminLogin);

// Everything below requires a valid admin token.
router.use(protect, adminOnly);

router.get('/analytics', a.adminAnalytics);
router.post('/uploads/signature', a.adminUploadSignature);

router.get('/products', a.adminListProducts);
router.post('/products', a.adminCreateProduct);
router.get('/products/:id', a.adminGetProduct);
router.put('/products/:id', a.adminUpdateProduct);
router.delete('/products/:id', a.adminDeleteProduct);

router.get('/inventory', a.adminInventory);
router.patch('/inventory/:id', a.adminSetStock);

router.get('/categories', a.adminListCategories);
router.post('/categories', a.adminCreateCategory);
router.put('/categories/:id', a.adminUpdateCategory);
router.delete('/categories/:id', a.adminDeleteCategory);

router.get('/orders', a.adminListOrders);
router.get('/orders/:id', a.adminGetOrder);
router.patch('/orders/:id/status', a.adminUpdateOrderStatus);

router.get('/users', a.adminListUsers);
router.patch('/users/:id/status', a.adminSetUserStatus);

router.get('/banners', a.banners.list);
router.post('/banners', a.banners.create);
router.put('/banners/:id', a.banners.update);
router.delete('/banners/:id', a.banners.remove);

router.get('/coupons', a.coupons.list);
router.post('/coupons', a.coupons.create);
router.put('/coupons/:id', a.coupons.update);
router.delete('/coupons/:id', a.coupons.remove);

export default router;
