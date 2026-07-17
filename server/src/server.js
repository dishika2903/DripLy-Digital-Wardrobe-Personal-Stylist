// Validate environment variables first before loading any other modules
import env from './config/env.js';
import app from './app.js';
import logger from './utils/logger.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 DripLy backend server listening on port ${PORT} in ${env.NODE_ENV} mode`);
});

// Handle graceful shutdown and uncaught anomalies
const handleSystemSignals = (signal) => {
  logger.warn(`Received ${signal}. Shutting down server gracefully...`);
  server.close(() => {
    logger.info('Server process closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleSystemSignals('SIGTERM'));
process.on('SIGINT', () => handleSystemSignals('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ promise, reason }, 'Unhandled Rejection at Promise');
  // Crash the server on unhandled rejections in production to trigger restarts
  if (env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  logger.fatal(err, 'Uncaught Exception thrown');
  process.exit(1);
});
