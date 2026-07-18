import { Router } from 'express';
import authMiddleware from '../../middlewares/auth.js';
import { updateTheme } from './controller.js';

const router = Router();
router.patch('/theme', authMiddleware, updateTheme);
export default router;
