import { Router } from 'express';
import * as controller from './controller.js';
import authMiddleware from '../../middlewares/auth.js';
import upload, { uploadToCloudinary } from '../../middlewares/upload.js';

const router = Router();

// Apply authMiddleware to all routes in this router
router.use(authMiddleware);

router.get('/', controller.getWardrobe);
router.get('/:id', controller.getClothingItem);
router.post('/', upload.single('image'), uploadToCloudinary, controller.createClothingItem);
router.put('/:id', upload.single('image'), uploadToCloudinary, controller.updateClothingItem);
router.delete('/:id', controller.deleteClothingItem);

export default router;
