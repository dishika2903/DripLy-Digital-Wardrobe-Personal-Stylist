import { Router } from 'express';
import authMiddleware from '../../middlewares/auth.js';
import upload from '../../middlewares/upload.js';
import { classify } from './controller.js';

const router = Router();
router.post('/classify', authMiddleware, upload.single('image'), classify);
export default router;
