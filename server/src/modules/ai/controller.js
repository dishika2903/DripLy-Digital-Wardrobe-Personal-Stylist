import { classifyImage } from './service.js';
import logger from '../../utils/logger.js';

export const classify = async (req, res, next) => {
  if (!req.file) return res.status(400).json({ success: false, error: { message: 'Please upload an image to identify.', code: 'IMAGE_REQUIRED' } });
  try {
    res.json({ success: true, data: await classifyImage(req.file, req.user) });
  } catch (error) {
    logger.error(error, 'AI Classification failed');

    // Give users a specific, actionable message when Gemini quota is exhausted
    // instead of the generic "could not identify" — this way they know to wait
    // a minute and try again rather than assuming their photo is bad.
    if (error.isQuotaError) {
      const quotaError = new Error('AI identification is temporarily rate-limited. Please wait a moment and try again.');
      quotaError.status = 429;
      quotaError.code = 'AI_QUOTA_EXCEEDED';
      return next(quotaError);
    }

    const apiError = new Error('We could not identify this item right now. Please fill in the form and try again later.');
    apiError.status = 503;
    apiError.code = 'AI_CLASSIFICATION_UNAVAILABLE';
    next(apiError);
  }
};
