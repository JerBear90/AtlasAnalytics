import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AuthService, AuthError } from '../services/authService';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Configure Google OAuth if credentials are set
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

if (googleClientId && googleClientSecret) {
  passport.use(new GoogleStrategy({
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: googleCallbackUrl,
  }, (_accessToken, _refreshToken, profile, done) => {
    done(null, {
      id: profile.id,
      displayName: profile.displayName || '',
      email: profile.emails?.[0]?.value || '',
    } as any);
  }));

  // GET /api/auth/google — redirect to Google
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }));

  // GET /api/auth/google/callback — handle Google response
  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${clientUrl}/login?error=google_failed` }),
    async (req: Request, res: Response) => {
      try {
        const googleProfile = req.user as unknown as { id: string; displayName: string; email: string };
        const result = await AuthService.handleGoogleCallback(googleProfile);
        // Redirect to client with token in URL fragment
        res.redirect(`${clientUrl}/login?token=${result.token}&user=${encodeURIComponent(JSON.stringify(result.user))}`);
      } catch (err) {
        res.redirect(`${clientUrl}/login?error=auth_failed`);
      }
    }
  );
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }
    const result = await AuthService.register(name, email, password);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    console.log('[auth] Login attempt received for email:', email);
    console.log('[auth] Calling AuthService.login()');
    const result = await AuthService.login(email, password);
    console.log('[auth] Login successful for email:', email, '| userId:', result.user.id);
    res.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      console.log('[auth] Login failed for email:', req.body?.email, '| reason:', err.message, '| status:', err.statusCode);
      res.status(err.statusCode).json({ error: err.message });
    } else {
      console.error('[auth] Unexpected error during login for email:', req.body?.email, err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

router.post('/password-reset/request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }
    await AuthService.requestPasswordReset(email);
    res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/password-reset/confirm', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required.' });
      return;
    }
    await AuthService.resetPassword(token, newPassword);
    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.token) {
      await AuthService.invalidateSession(req.token);
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
