import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from './pool';

const SALT_ROUNDS = 12;

async function seed() {
  console.log('Seeding database...');

  // Create admin user: admin@atlas.com / admin123
  const adminPw = await bcrypt.hash('admin123', SALT_ROUNDS);
  const adminId = crypto.randomBytes(16).toString('hex');
  const now = new Date().toISOString();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@atlas.com');
  if (!existing) {
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(adminId, 'Atlas Admin', 'admin@atlas.com', adminPw, 'admin', now, now);
    console.log('Created admin user: admin@atlas.com / admin123');
  } else {
    console.log('Admin user already exists.');
  }

  // Create super admin: super@atlas.com / super123
  const superPw = await bcrypt.hash('super123', SALT_ROUNDS);
  const superId = crypto.randomBytes(16).toString('hex');
  const existingSuper = db.prepare('SELECT id FROM users WHERE email = ?').get('super@atlas.com');
  if (!existingSuper) {
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, user_type, company, subscriber, primary_contact, service_period_start, service_period_end, workbook_description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(superId, 'Super Admin', 'super@atlas.com', superPw, 'super_admin', 'retail',
      'Atlas Analytics, Inc.', 'Internal Testing', 'jake@atlasanalytics.com',
      '2026-01-01', '2026-09-30',
      'This workbook contains a collection of key economic and financial datasets compiled by Atlas Analytics, Inc. for internal analysis and strategic planning purposes.',
      now, now);
    console.log('Created super admin: super@atlas.com / super123');
  } else {
    console.log('Super admin already exists.');
  }

  // Create demo retail user: demo@atlas.com / demo1234
  const demoPw = await bcrypt.hash('demo1234', SALT_ROUNDS);
  const demoId = crypto.randomBytes(16).toString('hex');
  const existingDemo = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@atlas.com');
  if (!existingDemo) {
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(demoId, 'Demo User', 'demo@atlas.com', demoPw, 'retail', now, now);
    console.log('Created demo user: demo@atlas.com / demo1234');
  }

  console.log('Seed complete.');
}

seed().catch(console.error);
