import express, { Request, Response, NextFunction } from 'express';
import { apiRouter } from '../src/server/api';

const app = express();

app.use(express.json());

// Normalization middleware for Vercel Serverless routing
app.use((req: Request, _res: Response, next: NextFunction) => {
  // If Vercel passed path via query param ?path=...
  if (req.query?.path) {
    const subPath = Array.isArray(req.query.path)
      ? req.query.path.join('/')
      : req.query.path;
    const cleanSubPath = String(subPath).replace(/^\/+/, '');
    req.url = `/${cleanSubPath}`;
  } else if (req.headers['x-matched-path']) {
    const matched = req.headers['x-matched-path'] as string;
    if (matched.startsWith('/api')) {
      req.url = matched.replace(/^\/api/, '') || '/';
    }
  } else if (req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }
  next();
});

// Mount router on both '/api' and '/'
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Health check endpoint
app.get('/health', (_req, res) => res.json({ status: 'ok', v: 'vercel-live' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', v: 'vercel-live' }));

// 404 JSON fallback: NEVER leave requests unhandled
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Endpoint nicht gefunden: ${req.method} ${req.originalUrl || req.url}`,
  });
});

// Top-level 500 error handler: ALWAYS return JSON, never plain text or HTML
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Vercel API Error:', err);
  res.status(500).json({
    success: false,
    error: err?.message || 'Interner Serverfehler',
  });
});

export default function handler(req: any, res: any) {
  return app(req, res);
}
