import { Router } from 'express';
import {
  getProducts, getProductById, getProductBySlug, getNewArrivals, getFeatured,
} from '../controllers/product.controller.js';

import { optionalAuth } from '../middleware/auth.js';

const router = Router();
// optionalAuth lets INTERNATIONAL customers see prices; guests / Indian customers never do.
router.use(optionalAuth);
// Fixed paths first so they are not captured by "/:id".
router.get('/new-arrivals', getNewArrivals);
router.get('/featured', getFeatured);
router.get('/slug/:slug', getProductBySlug);
router.get('/', getProducts);
router.get('/:id', getProductById);
export default router;
