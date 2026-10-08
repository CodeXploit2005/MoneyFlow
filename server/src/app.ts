import express from 'express';
import { getDatabaseStatus } from './config/db.js';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { ENV, CLIENT_ORIGINS } from './config/env.js';

const app = express();
// Financial API responses must carry fresh JSON, never an empty 304 body.
app.disable('etag');
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  delete req.headers['if-none-match'];
  delete req.headers['if-modified-since'];
  next();
});

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: CLIENT_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(ENV.COOKIE_SECRET));

// Identify the backend when its Render URL is opened in a browser.
app.get('/', (_req, res) => {
  res.json({
    app: 'MoneyFlow API',
    message: 'Backend API. Open the frontend URL to use MoneyFlow.',
    health: '/api/health'
  });
});

// Rate limiting for general APIs
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  const database = getDatabaseStatus();
  res.status(database.connected ? 200 : 503).json({
    status: database.connected ? 'healthy' : 'unavailable',
    database,
    app: 'MoneyFlow API',
    time: new Date().toISOString()
  });
});

// Main API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

export default app;
