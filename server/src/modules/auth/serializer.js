/**
 * Produces the single safe User shape allowed in API responses.
 * Authentication secrets must never cross the API boundary.
 */
export const serializeUser = (user) => {
  if (!user) return null;

  const {
    passwordHash,
    passwordResetToken,
    passwordResetExpires,
    ...safeUser
  } = user;

  return safeUser;
};
