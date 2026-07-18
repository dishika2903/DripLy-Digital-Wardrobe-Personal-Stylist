import { updateThemeSchema } from './validation.js';
import * as settingsService from './service.js';

export const updateTheme = async (req, res, next) => {
  try {
    const { theme } = updateThemeSchema.parse(req.body);
    const settings = await settingsService.updateTheme(req.user.id, theme);
    res.json({ success: true, data: { settings } });
  } catch (error) { next(error); }
};
