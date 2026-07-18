import { Router } from 'express';
import authMiddleware from '../../middlewares/auth.js';
import { generate } from './controller.js';

const router = Router();
router.get('/generate', authMiddleware, generate);
export default router;
