import db from '../db/pool';
import { UserProfile, UserRole, UserType } from '../types';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  role: UserRole;
  user_type: string;
  company: string;
  subscriber: string;
  primary_contact: string;
  service_period_start: string;
  service_period_end: string;
  workbook_description: string;
  created_at: string;
  updated_at: string;
}

function toProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserRole,
    userType: (row.user_type || 'retail') as UserType,
    company: row.company || '',
    subscriber: row.subscriber || '',
    primaryContact: row.primary_contact || '',
    servicePeriodStart: row.service_period_start || '',
    servicePeriodEnd: row.service_period_end || '',
    workbookDescription: row.workbook_description || '',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export const UserRepository = {
  async findById(id: string): Promise<UserProfile | null> {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row ? toProfile(row) : null;
  },

  async findByEmail(email: string): Promise<(UserProfile & { passwordHash: string | null }) | null> {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
    if (!row) return null;
    return { ...toProfile(row), passwordHash: row.password_hash };
  },

  async findByGoogleId(googleId: string): Promise<UserProfile | null> {
    const row = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId) as UserRow | undefined;
    return row ? toProfile(row) : null;
  },

  async create(data: { name: string; email: string; passwordHash?: string; googleId?: string; role?: UserRole }): Promise<UserProfile> {
    const id = require('crypto').randomBytes(16).toString('hex');
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, google_id, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.name, data.email, data.passwordHash || null, data.googleId || null, data.role || UserRole.RETAIL, now, now);
    return (await this.findById(id))!;
  },

  async updateProfile(id: string, updates: { name: string }): Promise<UserProfile> {
    db.prepare('UPDATE users SET name = ?, updated_at = datetime(\'now\') WHERE id = ?').run(updates.name, id);
    return (await this.findById(id))!;
  },

  async updateUserProfile(id: string, updates: {
    name?: string;
    userType?: UserType;
    company?: string;
    subscriber?: string;
    primaryContact?: string;
    servicePeriodStart?: string;
    servicePeriodEnd?: string;
    workbookDescription?: string;
  }): Promise<UserProfile> {
    const fields: string[] = [];
    const values: any[] = [];
    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.userType !== undefined) { fields.push('user_type = ?'); values.push(updates.userType); }
    if (updates.company !== undefined) { fields.push('company = ?'); values.push(updates.company); }
    if (updates.subscriber !== undefined) { fields.push('subscriber = ?'); values.push(updates.subscriber); }
    if (updates.primaryContact !== undefined) { fields.push('primary_contact = ?'); values.push(updates.primaryContact); }
    if (updates.servicePeriodStart !== undefined) { fields.push('service_period_start = ?'); values.push(updates.servicePeriodStart); }
    if (updates.servicePeriodEnd !== undefined) { fields.push('service_period_end = ?'); values.push(updates.servicePeriodEnd); }
    if (updates.workbookDescription !== undefined) { fields.push('workbook_description = ?'); values.push(updates.workbookDescription); }
    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    return (await this.findById(id))!;
  },

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(passwordHash, id);
  },

  async updateRole(id: string, role: UserRole): Promise<UserProfile> {
    db.prepare('UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?').run(role, id);
    return (await this.findById(id))!;
  },

  async listUsers(page: number, pageSize: number): Promise<{ users: UserProfile[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?').all(pageSize, offset) as UserRow[];
    const countRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    return {
      users: rows.map(toProfile),
      total: countRow.count,
    };
  },
};
