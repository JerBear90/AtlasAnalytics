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

  // Seed sample economic data
  const dataCount = db.prepare('SELECT COUNT(*) as count FROM economic_data').get() as { count: number };
  if (dataCount.count === 0) {
    const uploaderId = (existing as any)?.id || adminId;
    const ingestionId = crypto.randomBytes(16).toString('hex');
    db.prepare(
      `INSERT INTO csv_ingestions (id, filename, uploader_id, total_rows, valid_rows, invalid_rows, error_details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(ingestionId, 'seed_data.csv', uploaderId, 60, 60, 0, '[]');

    const countries = ['US', 'GB', 'DE', 'JP', 'CN', 'FR', 'CA', 'AU', 'IN', 'BR'];
    const indicators = ['gdp_nowcast', 'trade_flow', 'consumer_spending'];
    const quarters = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026'];

    const insert = db.prepare(
      `INSERT INTO economic_data (id, ingestion_id, country_code, indicator_type, quarter, observation_date, value, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const tx = db.transaction(() => {
      for (const country of countries) {
        for (const indicator of indicators) {
          for (let qi = 0; qi < quarters.length; qi++) {
            const id = crypto.randomBytes(16).toString('hex');
            const baseValue = indicator === 'gdp_nowcast' ? 2.0 + Math.random() * 4 :
                              indicator === 'trade_flow' ? 50 + Math.random() * 100 :
                              30 + Math.random() * 70;
            const value = Math.round(baseValue * 100) / 100;
            const month = (qi * 3 + 1).toString().padStart(2, '0');
            const year = quarters[qi].includes('2026') ? '2026' : '2025';
            const obsDate = `${year}-${month}-15`;
            insert.run(id, ingestionId, country, indicator, quarters[qi], obsDate, value, '{}');
          }
        }
      }
    });
    tx();
    console.log('Seeded 150 economic data records across 10 countries, 3 indicators, 5 quarters.');
  } else {
    console.log(`Economic data already exists (${dataCount.count} records).`);
  }

  console.log('Seed complete.');
}

seed().catch(console.error);
