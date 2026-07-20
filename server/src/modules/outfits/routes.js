import { Router } from 'express';
import authMiddleware from '../../middlewares/auth.js';
import { createOutfit, generate, getOutfits, rate, removeOutfit, suggest, updateFavorite } from './controller.js';

const router = Router();
router.use(authMiddleware);
router.get('/generate', generate);
router.post('/suggest', suggest);
router.get('/', getOutfits);
router.post('/', createOutfit);
router.patch('/:id/favorite', updateFavorite);
router.patch('/:id/rate', rate);
router.delete('/:id', removeOutfit);
export default router;
