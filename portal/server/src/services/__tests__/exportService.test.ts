import fc from 'fast-check';
import { UserRole, ExportFormat } from '../../types';
import { ExportService, ExportError } from '../exportService';
import { getDataScope, canExport } from '../../middleware/roleMiddleware';
import { EconomicDataRepository } from '../../repositories/economicDataRepository';

/**
 * Property 5: Export format restricted by role
 * Validates: Requirements 6.1, 6.2, 6.3, 6.6
 *
 * For any user role and requested export format, if the format is not in the
 * role's allowed exportFormats, the export should be denied. If allowed, the
 * export should succeed and contain only data within the role's data scope.
 */

import db from '../../db/pool';

const LIMITED = EconomicDataRepository.LIMITED_COUNTRIES;

beforeAll(() => {
  // Create parent records to satisfy FK constraints
  db.exec(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role) VALUES ('test-user-export', 'Test', 'export@test.com', 'hash', 'admin')`);
  db.exec(`INSERT OR IGNORE INTO csv_ingestions (id, filename, uploader_id, total_rows, valid_rows, invalid_rows) VALUES ('ing-export', 'export.csv', 'test-user-export', 0, 0, 0)`);

  // Seed a few rows for export tests
  db.exec(`DELETE FROM economic_data WHERE ingestion_id = 'ing-export'`);
  const insert = db.prepare(
    `INSERT INTO economic_data (id, ingestion_id, country_code, indicator_type, quarter, observation_date, value, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, '{}')`
  );
  let id = 0;
  for (const cc of ['US', 'GB', 'KR', 'MX']) {
    for (const q of ['Q4 2025', 'Q3 2025']) {
      insert.run(`exp-${id++}`, 'ing-export', cc, 'gdp_nowcast', q, '2025-01-15', 3.1);
    }
  }
});

afterAll(() => {
  db.exec(`DELETE FROM economic_data WHERE ingestion_id = 'ing-export'`);
  db.exec(`DELETE FROM csv_ingestions WHERE id = 'ing-export'`);
  db.exec(`DELETE FROM users WHERE id = 'test-user-export'`);
});

const allRoles = [UserRole.RETAIL, UserRole.INSTITUTIONAL, UserRole.ENTERPRISE, UserRole.ADMIN];
const allFormats: ExportFormat[] = ['csv', 'json', 'all'];

const roleArb = fc.constantFrom(...allRoles);
const formatArb = fc.constantFrom(...allFormats);

describe('Export role enforcement (Property 5)', () => {
  test('disallowed format throws ExportError, allowed format succeeds', async () => {
    await fc.assert(
      fc.asyncProperty(roleArb, formatArb, async (role, format) => {
        const allowed = canExport(role, format);

        if (!allowed) {
          await expect(
            ExportService.exportData('user-1', role, format, {})
          ).rejects.toThrow(ExportError);
        } else {
          const result = await ExportService.exportData('user-1', role, format, {});
          expect(result.data).toBeInstanceOf(Buffer);
          expect(result.data.length).toBeGreaterThan(0);
          expect(result.filename).toContain('atlas_export');
          expect(result.metadata.rowCount).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  test('Retail export contains only limited countries', async () => {
    const result = await ExportService.exportData('user-1', UserRole.RETAIL, 'csv', {});
    const csv = result.data.toString('utf-8');

    // Parse CSV lines (skip comment lines and header)
    const dataLines = csv.split('\n').filter(l => l && !l.startsWith('#') && !l.startsWith('country_code'));
    for (const line of dataLines) {
      const country = line.split(',')[0];
      expect(LIMITED).toContain(country);
    }
  });
});

/**
 * Unit tests for export metadata
 * Validates: Requirements 6.4, 6.5
 */
describe('Export metadata', () => {
  test('CSV export includes column headers and export timestamp', async () => {
    const result = await ExportService.exportData('user-1', UserRole.ENTERPRISE, 'csv', {});
    const csv = result.data.toString('utf-8');

    // Should have metadata comment with timestamp
    expect(csv).toContain('# Atlas Analytics Data Export');
    expect(csv).toContain('# Exported:');

    // Should have column headers
    expect(csv).toContain('country_code,indicator_type,quarter,observation_date,value');
  });

  test('JSON export includes metadata fields', async () => {
    const result = await ExportService.exportData('user-1', UserRole.ENTERPRISE, 'json', {});
    const parsed = JSON.parse(result.data.toString('utf-8'));

    expect(parsed.metadata).toBeDefined();
    expect(parsed.metadata.source).toBe('Atlas Analytics Portal');
    expect(parsed.metadata.exportedAt).toBeDefined();
    expect(typeof parsed.metadata.recordCount).toBe('number');
    expect(parsed.data).toBeInstanceOf(Array);
  });

  test('export respects current filter selections', async () => {
    const filtered = await ExportService.exportData('user-1', UserRole.ENTERPRISE, 'json', {
      quarter: 'Q4 2025',
    });
    const parsed = JSON.parse(filtered.data.toString('utf-8'));

    // All records should be Q4 2025
    for (const record of parsed.data) {
      expect(record.quarter).toBe('Q4 2025');
    }

    expect(parsed.metadata.filters).toEqual({ quarter: 'Q4 2025' });
  });
});
