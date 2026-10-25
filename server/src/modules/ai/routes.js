import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authMiddleware from '../../middlewares/auth.js';
import upload from '../../middlewares/upload.js';
import { classify } from './controller.js';

const router = Router();

// Tighter per-IP limit on the classify endpoint — Gemini free tier allows
// ~15 req/min globally, so we cap each IP at 12/min to leave head-room.
const classifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many identify requests. Please wait a minute before trying again.',
      code: 'AI_RATE_LIMIT_EXCEEDED',
    },
  },
});

router.post('/classify', classifyLimiter, authMiddleware, upload.single('image'), classify);
export default router;
