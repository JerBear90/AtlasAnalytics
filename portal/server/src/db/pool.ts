import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(DATA_DIR, 'portal.db');
const db: any = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run migrations on startup
function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      role TEXT NOT NULL DEFAULT 'retail',
      user_type TEXT NOT NULL DEFAULT 'retail',
      company TEXT DEFAULT '',
      subscriber TEXT DEFAULT '',
      primary_contact TEXT DEFAULT '',
      service_period_start TEXT DEFAULT '',
      service_period_end TEXT DEFAULT '',
      workbook_description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL REFERENCES users(id),
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS csv_ingestions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      filename TEXT NOT NULL,
      uploader_id TEXT NOT NULL REFERENCES users(id),
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      total_rows INTEGER NOT NULL DEFAULT 0,
      valid_rows INTEGER NOT NULL DEFAULT 0,
      invalid_rows INTEGER NOT NULL DEFAULT 0,
      error_details TEXT,
      file_path TEXT
    );

    CREATE TABLE IF NOT EXISTS economic_data (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      ingestion_id TEXT NOT NULL REFERENCES csv_ingestions(id),
      country_code TEXT NOT NULL,
      indicator_type TEXT NOT NULL,
      quarter TEXT NOT NULL,
      observation_date TEXT NOT NULL,
      value REAL NOT NULL,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL REFERENCES users(id),
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      invalidated INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_economic_data_country ON economic_data(country_code);
    CREATE INDEX IF NOT EXISTS idx_economic_data_quarter ON economic_data(quarter);
    CREATE INDEX IF NOT EXISTS idx_economic_data_ingestion ON economic_data(ingestion_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quarterly_time_series (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      ingestion_id TEXT NOT NULL,
      date TEXT NOT NULL,
      year INTEGER NOT NULL,
      quarter INTEGER NOT NULL,
      date2 TEXT NOT NULL,
      us_gdp TEXT,
      atlas_predicted TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS academic_gdp (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      ingestion_id TEXT NOT NULL,
      gdp_type TEXT NOT NULL,
      date TEXT NOT NULL,
      year INTEGER NOT NULL,
      quarter INTEGER NOT NULL,
      date2 TEXT NOT NULL,
      bea_actual TEXT,
      atlas_predicted TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS weekly_time_series (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      ingestion_id TEXT NOT NULL,
      prediction_quarter TEXT NOT NULL,
      date TEXT NOT NULL,
      year INTEGER NOT NULL,
      day_of_week TEXT,
      month TEXT,
      core_gdp REAL,
      core_gdp_updated REAL,
      net_exports REAL,
      private_inventories REAL,
      gdp REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS weekly_financial_targets (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      ingestion_id TEXT NOT NULL,
      section TEXT NOT NULL,
      etf TEXT NOT NULL,
      target_price REAL,
      trading_price REAL,
      deviation TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS nx_results (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      ingestion_id TEXT NOT NULL,
      date TEXT NOT NULL,
      year INTEGER NOT NULL,
      quarter INTEGER NOT NULL,
      date2 TEXT NOT NULL,
      trade_balance REAL,
      trade_balance_pct_ch TEXT,
      nx_results TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pi_results (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      ingestion_id TEXT NOT NULL,
      date TEXT NOT NULL,
      year INTEGER NOT NULL,
      quarter INTEGER NOT NULL,
      date2 TEXT NOT NULL,
      private_inventories TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Add profile columns to existing databases
  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  const colNames = cols.map(c => c.name);
  const newCols: [string, string][] = [
    ['user_type', "TEXT NOT NULL DEFAULT 'retail'"],
    ['company', "TEXT DEFAULT ''"],
    ['subscriber', "TEXT DEFAULT ''"],
    ['primary_contact', "TEXT DEFAULT ''"],
    ['service_period_start', "TEXT DEFAULT ''"],
    ['service_period_end', "TEXT DEFAULT ''"],
    ['workbook_description', "TEXT DEFAULT ''"],
  ];
  for (const [col, def] of newCols) {
    if (!colNames.includes(col)) {
      db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
    }
  }
}

migrate();

export default db;
