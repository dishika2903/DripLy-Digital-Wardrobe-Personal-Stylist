import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const basePrisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

basePrisma.$on('query', (e) => {
  logger.debug(`[Prisma Query] ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
});

basePrisma.$on('info', (e) => {
  logger.info(`[Prisma Info] ${e.message}`);
});

basePrisma.$on('warn', (e) => {
  logger.warn(`[Prisma Warning] ${e.message}`);
});

basePrisma.$on('error', (e) => {
  logger.error(`[Prisma Error] ${e.message}`);
});

// Neon's serverless Postgres suspends the compute after a few minutes of inactivity and
// takes a moment to wake back up. On top of that, connections routed through Neon's pooled
// "-pooler" endpoint go through PgBouncer in transaction-pooling mode, which occasionally
// hands a query a connection that gets recycled mid-flight. Both show up to Prisma as a
// transient error (P1001 "Can't reach database server", P1017 "Server has closed the
// connection", P2024 "Timed out fetching a new connection from the pool") even though Neon's
// own dashboard reports the database as healthy/idle — the DB is fine, the connection
// handshake just needs one more try. Retrying those specific codes here fixes the
// intermittent "Database error occurred" on login/save/favorite without masking real bugs.
const TRANSIENT_CONNECTION_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);
const RETRYABLE_OPERATIONS = new Set(['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy']);

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        // Only auto-retry read operations. Retrying a write blindly could double-apply it if
        // the first attempt actually succeeded server-side before the connection dropped.
        if (!RETRYABLE_OPERATIONS.has(operation)) return query(args);

        const maxAttempts = 3;
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            return await query(args);
          } catch (error) {
            lastError = error;
            const isTransient = TRANSIENT_CONNECTION_CODES.has(error.code);
            if (!isTransient || attempt === maxAttempts) throw error;
            const delayMs = attempt * 250;
            logger.warn(`[Prisma] Transient connection error on ${model}.${operation} (${error.code}), retrying in ${delayMs}ms (attempt ${attempt}/${maxAttempts})`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
        throw lastError;
      },
    },
  },
});

export default prisma;
