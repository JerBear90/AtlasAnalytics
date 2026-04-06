import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleMiddleware';
import { UserRepository } from '../repositories/userRepository';
import { AuthService, AuthError } from '../services/authService';
import { UserRole, UserType } from '../types';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// GET /api/users/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const user = await UserRepository.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const { password_hash, ...profile } = user as any;
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/users/me
router.put('/me', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Name is required.' });
      return;
    }
    const updated = await UserRepository.updateProfile(req.user!.id, { name: name.trim() });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/users/me/profile
router.put('/me/profile', async (req: Request, res: Response) => {
  try {
    const { company, subscriber, primaryContact, servicePeriodStart, servicePeriodEnd, workbookDescription } = req.body;
    const updated = await UserRepository.updateUserProfile(req.user!.id, {
      company, subscriber, primaryContact, servicePeriodStart, servicePeriodEnd, workbookDescription,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/users/me/password
router.put('/me/password', async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }
    await AuthService.changePassword(req.user!.id, currentPassword, newPassword);
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

// GET /api/users (Admin only)
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const result = await UserRepository.listUsers(page, pageSize);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/users/:id/role (Admin only)
router.put('/:id/role', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const validRoles = Object.values(UserRole);
    if (!role || !validRoles.includes(role)) {
      res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
      return;
    }
    const updated = await UserRepository.updateRole(req.params.id, role);
    if (!updated) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/users/:id/profile (Admin only)
router.put('/:id/profile', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userType, company, subscriber, primaryContact, servicePeriodStart, servicePeriodEnd, workbookDescription } = req.body;
    const validTypes = Object.values(UserType);
    if (userType && !validTypes.includes(userType)) {
      res.status(400).json({ error: `userType must be one of: ${validTypes.join(', ')}` });
      return;
    }
    const updated = await UserRepository.updateUserProfile(req.params.id, {
      userType, company, subscriber, primaryContact, servicePeriodStart, servicePeriodEnd, workbookDescription,
    });
    if (!updated) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
