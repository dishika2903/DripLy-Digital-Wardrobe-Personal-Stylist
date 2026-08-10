import { classifyImage } from './service.js';
import logger from '../../utils/logger.js';

export const classify = async (req, res, next) => {
  if (!req.file) return res.status(400).json({ success: false, error: { message: 'Please upload an image to identify.', code: 'IMAGE_REQUIRED' } });
  try {
    res.json({ success: true, data: await classifyImage(req.file) });
  } catch (error) {
    logger.error(error, 'AI Classification failed');
    const apiError = new Error('We could not identify this item right now. Please fill in the form and try again later.');
    apiError.status = 503;
    apiError.code = 'AI_CLASSIFICATION_UNAVAILABLE';
    next(apiError);
  }
};
