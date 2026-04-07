import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserProfile } from '../types';
import { UserRepository } from '../repositories/userRepository';
import { SessionRepository } from '../repositories/sessionRepository';
import { PasswordResetRepository } from '../repositories/passwordResetRepository';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRY = '24h';
const SALT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_HOURS = 1;

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const AuthService = {
  async register(name: string, email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new AuthError('An account with this email already exists.', 409);
    }

    if (password.length < 8) {
      throw new AuthError('Password must be at least 8 characters.', 400);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await UserRepository.create({ name, email, passwordHash });
    const token = await issueToken(user);
    return { token, user };
  },

  async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const user = await UserRepository.findByEmail(email);
    console.log('[auth] User found:', !!user, '| has password hash:', !!(user?.passwordHash));
    if (!user || !user.passwordHash) {
      throw new AuthError('Invalid email or password.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log('[auth] Password valid:', valid);
    if (!valid) {
      throw new AuthError('Invalid email or password.');
    }

    const { passwordHash: _, ...profile } = user;
    const token = await issueToken(profile);
    return { token, user: profile };
  },

  async handleGoogleCallback(googleProfile: {
    id: string;
    displayName: string;
    email: string;
  }): Promise<{ token: string; user: UserProfile }> {
    // Check if user exists by Google ID
    let user = await UserRepository.findByGoogleId(googleProfile.id);

    if (!user) {
      // Check if email already registered (link accounts)
      const existingByEmail = await UserRepository.findByEmail(googleProfile.email);
      if (existingByEmail) {
        // Could link accounts here — for MVP, treat as existing user
        user = existingByEmail;
      } else {
        user = await UserRepository.create({
          name: googleProfile.displayName,
          email: googleProfile.email,
          googleId: googleProfile.id,
        });
      }
    }

    const token = await issueToken(user);
    return { token, user };
  },

  async requestPasswordReset(email: string): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    // Always return success to avoid revealing email existence
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    await PasswordResetRepository.create(user.id, hashToken(resetToken), expiresAt);

    // In production, send email via SendGrid here
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }
  },

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) {
      throw new AuthError('Password must be at least 8 characters.', 400);
    }

    const tokenHash = hashToken(resetToken);
    const record = await PasswordResetRepository.findByToken(tokenHash);

    if (!record) {
      throw new AuthError('Invalid or expired reset token.');
    }
    if (record.used) {
      throw new AuthError('This reset link has already been used.');
    }
    if (new Date() > record.expiresAt) {
      throw new AuthError('This reset link has expired.');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UserRepository.updatePassword(record.userId, passwordHash);
    await PasswordResetRepository.markUsed(record.id);

    // Invalidate all existing sessions for security
    await SessionRepository.invalidateAllForUser(record.userId);
  },

  async verifyToken(token: string): Promise<UserProfile> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      const tokenHash = hashToken(token);

      // Check session is still valid
      const session = await SessionRepository.findByTokenHash(tokenHash);
      if (!session || session.invalidated) {
        throw new AuthError('Session has been invalidated.');
      }
      if (new Date() > session.expiresAt) {
        throw new AuthError('Session has expired.');
      }

      const user = await UserRepository.findById(payload.userId);
      if (!user) {
        throw new AuthError('User not found.');
      }
      return user;
    } catch (err) {
      if (err instanceof AuthError) throw err;
      throw new AuthError('Invalid or expired token.');
    }
  },

  async invalidateSession(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    await SessionRepository.invalidate(tokenHash);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const profile = await UserRepository.findById(userId);
    if (!profile) {
      throw new AuthError('User not found.', 404);
    }
    const user = await UserRepository.findByEmail(profile.email);
    if (!user || !user.passwordHash) {
      throw new AuthError('Unable to change password for this account.', 400);
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new AuthError('Current password is incorrect.', 401);
    }

    if (newPassword.length < 8) {
      throw new AuthError('New password must be at least 8 characters.', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UserRepository.updatePassword(userId, passwordHash);
  },
};

async function issueToken(user: UserProfile): Promise<string> {
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await SessionRepository.create(user.id, tokenHash, expiresAt);
  return token;
}
