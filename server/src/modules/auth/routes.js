import { Router } from 'express';
import * as controller from './controller.js';
import authMiddleware from '../../middlewares/auth.js';
import upload, { uploadToCloudinary } from '../../middlewares/upload.js';

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
router.patch('/avatar', authMiddleware, upload.single('avatar'), uploadToCloudinary, controller.updateAvatar);
router.patch('/change-password', authMiddleware, controller.changePassword);
router.get('/account-summary', authMiddleware, controller.accountSummary);
router.delete('/me', authMiddleware, controller.deleteAccount);

export default router;
