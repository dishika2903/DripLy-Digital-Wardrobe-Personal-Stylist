import prisma from '../../config/db.js';

export const updateTheme = (userId, theme) => prisma.settings.upsert({
  where: { userId },
  update: { theme },
  create: { userId, theme },
});
