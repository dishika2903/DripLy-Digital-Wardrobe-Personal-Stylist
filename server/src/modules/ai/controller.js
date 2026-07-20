import { classifyImage } from './service.js';

export const classify = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: { message: 'Please upload an image to identify.', code: 'IMAGE_REQUIRED' } });
  try {
    res.json({ success: true, data: await classifyImage(req.file) });
  } catch (error) {
    res.status(503).json({ success: false, error: { message: 'We could not identify this item right now. Please fill in the form and try again later.', code: 'AI_CLASSIFICATION_UNAVAILABLE' } });
  }
};
