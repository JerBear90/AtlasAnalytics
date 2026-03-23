import db from '../db/pool';

export const SettingsRepository = {
  get(key: string): string | null {
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as any;
    return row?.value ?? null;
  },

  set(key: string, value: string): void {
    db.prepare(
      `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    ).run(key, value);
  },

  getMultiple(keys: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    const placeholders = keys.map(() => '?').join(',');
    const rows = db.prepare(`SELECT key, value FROM app_settings WHERE key IN (${placeholders})`).all(...keys) as any[];
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  },

  setMultiple(entries: Record<string, string>): void {
    const stmt = db.prepare(
      `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    );
    const tx = db.transaction(() => {
      for (const [key, value] of Object.entries(entries)) {
        stmt.run(key, value);
      }
    });
    tx();
  },
};
