import { Router } from 'express';
import * as controller from './controller.js';
import authMiddleware from '../../middlewares/auth.js';

const router = Router();

router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.post('/logout-all', authMiddleware, controller.logoutAll);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.get('/me', authMiddleware, controller.me);
router.patch('/me', authMiddleware, controller.updateProfile);

export default router;
