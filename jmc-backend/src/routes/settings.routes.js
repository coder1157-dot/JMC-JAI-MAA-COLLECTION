import { Router } from 'express';
import { getContact, getCurrencies } from '../controllers/settings.controller.js';

const router = Router();
router.get('/contact', getContact);
router.get('/currencies', getCurrencies);
export default router;
