import express from 'express';
import { apiRouter } from '../src/server/api';

const app = express();

// Parse incoming JSON
app.use(express.json());

// Handle /api/* and direct route rewrites
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
