import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { mongoSanitizer } from './middlewares/mongoSanitize.js';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { env } from './config/env.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import apiRouter from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the frontend dist directory (backend/src/../../../frontend/dist  OR  backend/public)
// On Hostinger: place frontend dist contents into backend/public folder
// Locally: uses the sibling frontend/dist folder
const FRONTEND_DIST = (() => {
  // Priority 1: backend/public (production – Hostinger)
  const publicDir = path.join(__dirname, '..', 'public');
  if (fs.existsSync(path.join(publicDir, 'index.html'))) return publicDir;
  // Priority 2: sibling frontend/dist (local dev convenience)
  const siblingDist = path.join(__dirname, '..', '..', '..', 'frontend', 'dist');
  if (fs.existsSync(path.join(siblingDist, 'index.html'))) return siblingDist;
  return null;
})();

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, same-origin, etc.)
      if (!origin) return callback(null, true);
      const allowed = [
        env.CLIENT_URL,
        'https://crm.inquisitivedigital.com',
        'http://crm.inquisitivedigital.com',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ];
      const isVercel = origin.endsWith('.vercel.app');
      if (allowed.includes(origin) || isVercel || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// ─── Health Route ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ID CRM API is healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Auto DB Connection Middleware (Serverless & Persistent) ─────────────────
import { connectDB } from './config/db.js';

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: err.message,
    });
  }
});

// ─── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Sanitize / HPP ───────────────────────────────────────────────────────────
app.use(mongoSanitizer);
app.use(hpp());

// ─── Compression + logging ────────────────────────────────────────────────────
app.use(compression());
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Static uploads ──────────────────────────────────────────────────────────
app.use('/uploads', express.static(env.UPLOAD_DIR));

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ─── Serve React frontend (production) ───────────────────────────────────────
if (FRONTEND_DIST) {
  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(FRONTEND_DIST));

  // SPA catch-all: for any non-API route, return index.html so React Router works
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
} else {
  // No frontend build found – return API info at root
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'ID CRM Backend API is active',
      version: '1.0.0',
      status: 'online',
      endpoints: { health: '/health', api: '/api/v1' },
    });
  });

  // ─── 404 + error handler ───────────────────────────────────────────────────
  app.use(notFound);
}

app.use(errorHandler);

export default app;
