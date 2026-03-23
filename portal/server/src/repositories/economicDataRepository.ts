import db from '../db/pool';
import crypto from 'crypto';
import { EconomicDataRecord, DashboardFilters, UserRole } from '../types';

const LIMITED_COUNTRIES = ['US', 'GB', 'DE', 'JP', 'CN', 'FR', 'CA', 'AU', 'IN', 'BR'];

function parseDate(raw: unknown): Date {
  if (raw instanceof Date) return raw;
  const s = String(raw);
  // SQLite stores as 'YYYY-MM-DD' or ISO string — parse safely
  const d = new Date(s.includes('T') ? s : s + 'T00:00:00Z');
  return isNaN(d.getTime()) ? new Date() : d;
}

function toRecord(row: any): EconomicDataRecord {
  return {
    id: row.id,
    ingestionId: row.ingestion_id,
    countryCode: row.country_code,
    indicatorType: row.indicator_type,
    quarter: row.quarter,
    observationDate: parseDate(row.observation_date),
    value: typeof row.value === 'string' ? parseFloat(row.value) : row.value,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata || '{}') : (row.metadata || {}),
  };
}

export const EconomicDataRepository = {
  async bulkInsert(ingestionId: string, records: Omit<EconomicDataRecord, 'id' | 'ingestionId'>[]): Promise<number> {
    if (records.length === 0) return 0;

    const insert = db.prepare(
      `INSERT INTO economic_data (id, ingestion_id, country_code, indicator_type, quarter, observation_date, value, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const tx = db.transaction(() => {
      for (const r of records) {
        const id = crypto.randomBytes(16).toString('hex');
        const obsDate = r.observationDate instanceof Date ? r.observationDate.toISOString() : String(r.observationDate);
        insert.run(id, ingestionId, r.countryCode, r.indicatorType, r.quarter, obsDate, r.value, JSON.stringify(r.metadata));
      }
    });

    tx();
    return records.length;
  },

  async queryByRoleAndFilters(role: UserRole, filters: DashboardFilters): Promise<EconomicDataRecord[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Role-based scoping
    if (role === UserRole.RETAIL) {
      const placeholders = LIMITED_COUNTRIES.map(() => '?').join(',');
      conditions.push(`country_code IN (${placeholders})`);
      params.push(...LIMITED_COUNTRIES);
      conditions.push(`quarter = (SELECT MAX(quarter) FROM economic_data)`);
    }

    // Filter: countries
    if (filters.countries && filters.countries.length > 0) {
      const placeholders = filters.countries.map(() => '?').join(',');
      conditions.push(`country_code IN (${placeholders})`);
      params.push(...filters.countries);
    }

    // Filter: quarter
    if (filters.quarter) {
      conditions.push(`quarter = ?`);
      params.push(filters.quarter);
    }

    // Filter: date range
    if (filters.dateRange) {
      const start = filters.dateRange.start instanceof Date ? filters.dateRange.start.toISOString() : String(filters.dateRange.start);
      const end = filters.dateRange.end instanceof Date ? filters.dateRange.end.toISOString() : String(filters.dateRange.end);
      conditions.push(`observation_date >= ?`);
      params.push(start);
      conditions.push(`observation_date <= ?`);
      params.push(end);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db.prepare(`SELECT * FROM economic_data ${where} ORDER BY observation_date DESC, country_code`).all(...params) as any[];
    return rows.map(toRecord);
  },

  async getDistinctQuarters(): Promise<string[]> {
    const rows = db.prepare('SELECT DISTINCT quarter FROM economic_data ORDER BY quarter DESC').all() as any[];
    return rows.map(r => r.quarter);
  },

  async getDistinctCountries(): Promise<string[]> {
    const rows = db.prepare('SELECT DISTINCT country_code FROM economic_data ORDER BY country_code').all() as any[];
    return rows.map(r => r.country_code);
  },

  LIMITED_COUNTRIES,
};
