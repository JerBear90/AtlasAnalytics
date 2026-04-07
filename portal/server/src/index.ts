import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import csvRoutes from './routes/csvRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import exportRoutes from './routes/exportRoutes';
import settingsRoutes from './routes/settingsRoutes';
import { errorHandler } from './middleware/errorHandler';
import { UserRepository } from './repositories/userRepository';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Trust the first proxy (nginx) so Express correctly parses X-Forwarded-For
// headers for rate limiting and request identification
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // stricter for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

// CORS — allow portal subdomain + WordPress site
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://portal.atlasanalytics.com',
    'https://atlasanalytics.com',
    'https://www.atlasanalytics.com',
    'https://linen-shark-952965.hostingersite.com',
    /\.up\.railway\.app$/,
  ],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Disable X-Powered-By
app.disable('x-powered-by');

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Temporary admin password reset endpoint (no auth required — for setup only)
app.post('/api/admin/reset-password', async (req, res) => {
  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
    res.status(400).json({ error: 'newPassword is required' });
    return;
  }
  const adminEmail = 'super@atlas.com';
  const user = await UserRepository.findByEmail(adminEmail);
  if (!user) {
    res.status(404).json({ error: `Admin user ${adminEmail} not found` });
    return;
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await UserRepository.updatePassword(user.id, passwordHash);
  console.log('[admin] Password reset for super@atlas.com');
  res.json({ success: true, message: 'Admin password has been reset successfully' });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/csv', apiLimiter, csvRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/export', apiLimiter, exportRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);

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
<<<<<<< HEAD

  // Auto-seed super admin on every startup, clearing any stale user data first
  try {
    const db = require('./db/pool').default;
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    const adminEmail = process.env.ADMIN_EMAIL || 'super@atlas.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';
    console.log('[seed] Clearing existing users to ensure fresh super admin credentials...');
    db.prepare('DELETE FROM users').run();
    console.log('[seed] Existing users cleared');
    console.log('[seed] Starting auto-seed with email:', adminEmail);
    console.log('[seed] Admin password source:', process.env.ADMIN_PASSWORD ? 'ADMIN_PASSWORD env var' : 'default fallback');
    console.log('[seed] Admin password:', adminPassword);
    console.log('[seed] Admin password length:', adminPassword.length);
    console.log('[seed] Admin password first/last:', adminPassword[0], adminPassword[adminPassword.length-1]);
    const pw = await bcrypt.hash(adminPassword, 12);
    const id = crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO users (id,name,email,password_hash,role,user_type,company,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(id, 'Super Admin', adminEmail, pw, 'super_admin', 'retail', 'Atlas Analytics, Inc.', now, now);
    console.log('[seed] Super admin created successfully');
  } catch (err) {
    console.error('[seed] Auto-seed failed:', err);
  }
=======
>>>>>>> 223b9f6 (feat: super admin tab visibility settings)
});

export default app;
