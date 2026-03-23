import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import csvRoutes from './routes/csvRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import exportRoutes from './routes/exportRoutes';
import settingsRoutes from './routes/settingsRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS — allow portal subdomain + WordPress site
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://portal.atlasanalytics.com',
    'https://atlasanalytics.com',
    'https://www.atlasanalytics.com',
    'https://linen-shark-952965.hostingersite.com',
  ],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/settings', settingsRoutes);

// Centralized error handler
app.use(errorHandler);

// Catch-all: redirect root to client or show API info
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'Atlas Portal API. Frontend is at http://localhost:5173',
    endpoints: { health: '/api/health', auth: '/api/auth/*', dashboard: '/api/dashboard/*' },
  });
});

app.listen(PORT, () => {
  console.log(`Atlas Portal API running on port ${PORT}`);
});

export default app;
