import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleMiddleware';
import { requireSuperAdmin } from '../middleware/roleMiddleware';
import { SettingsRepository } from '../repositories/settingsRepository';

const router = Router();

router.use(authMiddleware);

// Tab visibility — any authenticated user can read, super admin can write
// GET /api/settings/tabs
router.get('/tabs', (_req: Request, res: Response) => {
  try {
    const retail = SettingsRepository.get('visible_tabs_retail');
    const academic = SettingsRepository.get('visible_tabs_academic');
    res.json({
      retail: retail ? JSON.parse(retail) : null,
      academic: academic ? JSON.parse(academic) : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load tab settings.' });
  }
});

// PUT /api/settings/tabs (super admin only)
router.put('/tabs', requireSuperAdmin, (req: Request, res: Response) => {
  try {
    const { retail, academic } = req.body;
    if (retail) SettingsRepository.set('visible_tabs_retail', JSON.stringify(retail));
    if (academic) SettingsRepository.set('visible_tabs_academic', JSON.stringify(academic));
    res.json({ message: 'Tab visibility updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tab settings.' });
  }
});

// SSO and other settings require admin
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
