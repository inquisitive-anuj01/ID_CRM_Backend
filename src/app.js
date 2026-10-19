import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { mongoSanitizer } from './middlewares/mongoSanitize.js';
import hpp from 'hpp';

import { env } from './config/env.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import apiRouter from './routes/index.js';

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

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

// ─── 404 + error handler ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
