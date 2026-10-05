import { Router } from 'express';
import { getContact } from '../controllers/settings.controller.js';

const router = Router();
router.get('/contact', getContact);
export default router;
