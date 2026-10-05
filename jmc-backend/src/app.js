import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

// Render/Vercel/etc. sit behind a proxy: needed for correct client IPs in rate limiting.
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS: only origins listed in FRONTEND_URL (comma-separated) get CORS headers.
// Requests without an Origin header (curl, health checks, server-to-server) are allowed.
// Auth uses the Authorization header, so cookies/credentials are not needed.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, env.FRONTEND_ORIGINS.includes(origin.replace(/\/+$/, '')));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 600,
  })
);

if (env.NODE_ENV !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
    handler: (_req, res) =>
      res.status(429).json({ success: false, message: 'Too many requests. Please slow down.', errors: [] }),
  })
);

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
