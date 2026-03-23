import db from '../db/pool';
import crypto from 'crypto';

export const PasswordResetRepository = {
  async create(userId: string, token: string, expiresAt: Date): Promise<string> {
    const id = crypto.randomBytes(16).toString('hex');
    db.prepare(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`
    ).run(id, userId, token, expiresAt.toISOString());
    return id;
  },

  async findByToken(token: string): Promise<{ id: string; userId: string; expiresAt: Date; used: boolean } | null> {
    const row = db.prepare('SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = ?').get(token) as any;
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      expiresAt: new Date(row.expires_at),
      used: !!row.used,
    };
  },

  async markUsed(id: string): Promise<void> {
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(id);
  },
};
