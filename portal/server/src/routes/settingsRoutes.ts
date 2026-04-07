import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireAdmin, requireSuperAdmin } from '../middleware/roleMiddleware';
import { SettingsRepository } from '../repositories/settingsRepository';

const router = Router();

router.use(authMiddleware);

// ── Tab Visibility (readable by all authenticated users, writable by super admin) ──

const ALL_TABS = [
  'overview', 'quarterly', 'weekly', 'financial',
  'headline_gdp', 'core_gdp', 'state_gdp',
  'exports', 'inventories',
  'contents', 'insights', 'support',
];

const TAB_VISIBILITY_KEY = 'tab_visibility';

// GET /api/settings/tab-visibility
router.get('/tab-visibility', (_req: Request, res: Response) => {
  try {
    const raw = SettingsRepository.get(TAB_VISIBILITY_KEY);
    if (!raw) {
      // Default: all tabs enabled
      const defaults: Record<string, boolean> = {};
      ALL_TABS.forEach(t => { defaults[t] = true; });
      res.json(defaults);
      return;
    }
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load tab visibility settings.' });
  }
});

// PUT /api/settings/tab-visibility (super admin only)
router.put('/tab-visibility', requireSuperAdmin, (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'Request body must be an object of tab keys to booleans.' });
      return;
    }
    // Validate: only known tab keys, boolean values
    const visibility: Record<string, boolean> = {};
    for (const key of ALL_TABS) {
      visibility[key] = body[key] !== false; // default to true if not specified
    }
    SettingsRepository.set(TAB_VISIBILITY_KEY, JSON.stringify(visibility));
    res.json(visibility);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tab visibility settings.' });
  }
});

// ── SSO & other admin settings below require admin ──
router.use(requireAdmin);

const SSO_KEYS = ['google_client_id', 'google_client_secret', 'google_callback_url'];

// GET /api/settings/sso
router.get('/sso', (_req: Request, res: Response) => {
  try {
    const settings = SettingsRepository.getMultiple(SSO_KEYS);
    // Mask the client secret for display
    const masked = { ...settings };
    if (masked.google_client_secret) {
      const secret = masked.google_client_secret;
      masked.google_client_secret = secret.length > 8
        ? secret.slice(0, 4) + '••••' + secret.slice(-4)
        : '••••••••';
    }
    res.json(masked);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load SSO settings.' });
  }
});

// PUT /api/settings/sso
router.put('/sso', (req: Request, res: Response) => {
  try {
    const { google_client_id, google_client_secret, google_callback_url } = req.body;
    const updates: Record<string, string> = {};

    if (google_client_id !== undefined) updates.google_client_id = google_client_id.trim();
    if (google_client_secret !== undefined) updates.google_client_secret = google_client_secret.trim();
    if (google_callback_url !== undefined) updates.google_callback_url = google_callback_url.trim();

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No settings provided.' });
      return;
    }

    SettingsRepository.setMultiple(updates);

    // Update process.env so the auth service picks up changes immediately
    if (updates.google_client_id) process.env.GOOGLE_CLIENT_ID = updates.google_client_id;
    if (updates.google_client_secret) process.env.GOOGLE_CLIENT_SECRET = updates.google_client_secret;
    if (updates.google_callback_url) process.env.GOOGLE_CALLBACK_URL = updates.google_callback_url;

    res.json({ message: 'SSO settings updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update SSO settings.' });
  }
});

export default router;
