import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import errorHandler from './middlewares/errorHandler.js';
import logger from './utils/logger.js';
import env from './config/env.js';
import authRouter from './modules/auth/routes.js';
import wardrobeRouter from './modules/wardrobe/routes.js';

const app = express();

// Security Middlewares
app.use(helmet());

// CORS configuration - Lock down to client origin or allow local dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://driply.vercel.app' // Placeholder Vercel url
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server queries or local REST client requests without an origin header
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Blocked by CORS'));
    }
  },
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again after 15 minutes',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'Incoming request');
  next();
});

// Routes mounting
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/wardrobe', wardrobeRouter);

// Hello World & Health Check Route
app.get('/api/v1/hello', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Hello from the DripLy Backend API!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

// Catch-all route for unmatched paths (returns 404)
app.use('*', (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.status = 404;
  err.code = 'NOT_FOUND';
  next(err);
});

// Global Error Handler
app.use(errorHandler);

export default app;
