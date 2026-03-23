import db from '../db/pool';
import crypto from 'crypto';

export const SessionRepository = {
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<string> {
    const id = crypto.randomBytes(16).toString('hex');
    db.prepare(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`
    ).run(id, userId, tokenHash, expiresAt.toISOString());
    return id;
  },

  async findByTokenHash(tokenHash: string): Promise<{ id: string; userId: string; expiresAt: Date; invalidated: boolean } | null> {
    const row = db.prepare('SELECT id, user_id, expires_at, invalidated FROM sessions WHERE token_hash = ?').get(tokenHash) as any;
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      expiresAt: new Date(row.expires_at),
      invalidated: !!row.invalidated,
    };
  },

  async invalidate(tokenHash: string): Promise<void> {
    db.prepare('UPDATE sessions SET invalidated = 1 WHERE token_hash = ?').run(tokenHash);
  },

  async invalidateAllForUser(userId: string): Promise<void> {
    db.prepare('UPDATE sessions SET invalidated = 1 WHERE user_id = ?').run(userId);
  },
};
