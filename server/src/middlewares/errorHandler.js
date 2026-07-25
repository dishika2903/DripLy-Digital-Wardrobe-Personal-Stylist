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

    // P1xxx codes are connection/engine-layer failures (can't reach the server, connection
    // closed, pool exhausted/timed out) — this is what Neon's cold-start-after-idle or a
    // PgBouncer hiccup looks like to Prisma. It is distinct from P2xxx, which are query-layer
    // errors against a working connection. Neon's dashboard can show the database as healthy
    // while these still fire, since the failure is in the handshake, not the data.
    if (['P1001', 'P1002', 'P1008', 'P1017'].includes(err.code)) {
      message = 'Could not reach the database right now. Please try again in a few seconds.';
      code = 'DATABASE_UNAVAILABLE';
      status = 503;
    } else if (err.code === 'P2024') {
      message = 'The database is busy. Please try again in a moment.';
      code = 'DATABASE_CONNECTION_TIMEOUT';
      status = 503;
    } else if (err.code === 'P2002') {
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
      error: {
        message,
        code,
        // Never leak raw Prisma internals in production, but in dev this is the fastest way
        // to tell "wrong enum value" apart from "connection dropped" apart from "unique
        // constraint" without re-reading server logs for every failed request.
        ...(process.env.NODE_ENV !== 'production' ? { debug: { prismaCode: err.code, prismaMessage: err.message } } : {}),
      },
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
