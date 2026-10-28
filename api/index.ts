import express, { Request, Response, NextFunction } from 'express';
import { apiRouter } from '../src/server/api';

const app = express();

app.use(express.json());

// Normalization middleware for Vercel Serverless routing
app.use((req: Request, _res: Response, next: NextFunction) => {
  // If Vercel rewrote /api/:path* and set query param 'path'
  if (req.query?.path) {
    const subPath = Array.isArray(req.query.path)
      ? req.query.path.join('/')
      : req.query.path;
    req.url = `/${subPath}`;
  } else if (req.headers['x-matched-path']) {
    const matched = req.headers['x-matched-path'] as string;
    if (matched.startsWith('/api')) {
      req.url = matched.replace(/^\/api/, '') || '/';
    }
  }
  next();
});

// Mount router on both '/api' and '/'
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Health check endpoint
app.get('/health', (_req, res) => res.json({ status: 'ok', v: 'vercel-live' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', v: 'vercel-live' }));

export default function handler(req: any, res: any) {
  return app(req, res);
}
