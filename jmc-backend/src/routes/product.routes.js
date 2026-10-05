import { Router } from 'express';
import {
  getProducts, getProductById, getProductBySlug, getNewArrivals, getFeatured,
} from '../controllers/product.controller.js';

const router = Router();
// Fixed paths first so they are not captured by "/:id".
router.get('/new-arrivals', getNewArrivals);
router.get('/featured', getFeatured);
router.get('/slug/:slug', getProductBySlug);
router.get('/', getProducts);
router.get('/:id', getProductById);
export default router;
