import logger from '../utils/logger.js';
import { z } from 'zod';

export default function errorHandler(err, req, res, next) {
  logger.error(err, 'Unhandled exception caught by error handler');

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Handle common Prisma database errors
  if (err.code && err.code.startsWith('P')) {
    let message = 'Database error occurred';
    let code = 'DATABASE_ERROR';
    let status = 500;

    if (err.code === 'P2002') {
      message = `A record with this ${err.meta?.target?.join(', ') || 'field'} already exists`;
      code = 'UNIQUE_CONSTRAINT_ERROR';
      status = 409;
    } else if (err.code === 'P2025') {
      message = 'Record not found';
      code = 'RECORD_NOT_FOUND';
      status = 404;
    }

    return res.status(status).json({
      success: false,
      error: { message, code },
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: err.code || 'INTERNAL_SERVER_ERROR',
    },
  });
}
