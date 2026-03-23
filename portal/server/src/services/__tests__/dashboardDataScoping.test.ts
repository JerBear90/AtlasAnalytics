import fc from 'fast-check';
import { UserRole } from '../../types';
import { DashboardDataService } from '../dashboardDataService';
import { EconomicDataRepository } from '../../repositories/economicDataRepository';
import { getDataScope } from '../../middleware/roleMiddleware';

/**
 * Property 4: Role scoping restricts data
 * Validates: Requirements 3.2, 3.3, 3.4, 5.1, 5.2, 5.3
 *
 * For any Retail user, getDashboardData should return only records from the
 * current quarter and limited country set. For Institutional/Enterprise users,
 * data may include full history and all 38 countries.
 */

// Seed some test data directly into the in-memory SQLite DB
import db from '../../db/pool';

const LIMITED = EconomicDataRepository.LIMITED_COUNTRIES;
const NON_LIMITED = ['KR', 'MX', 'ZA', 'SE', 'NO', 'PL', 'TH', 'MY'];

beforeAll(() => {
  // Create parent records to satisfy FK constraints
  db.exec(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role) VALUES ('test-user-scope', 'Test', 'scope@test.com', 'hash', 'admin')`);
  db.exec(`INSERT OR IGNORE INTO csv_ingestions (id, filename, uploader_id, total_rows, valid_rows, invalid_rows) VALUES ('ing-scope', 'scope.csv', 'test-user-scope', 0, 0, 0)`);

  // Clear old test data and seed
  db.exec(`DELETE FROM economic_data WHERE ingestion_id = 'ing-scope'`);

  const insert = db.prepare(
    `INSERT INTO economic_data (id, ingestion_id, country_code, indicator_type, quarter, observation_date, value, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, '{}')`
  );

  let id = 0;
  const quarters = ['Q4 2025', 'Q3 2025', 'Q2 2025', 'Q1 2025'];
  const allCountries = [...LIMITED, ...NON_LIMITED];

  for (const q of quarters) {
    for (const cc of allCountries) {
      insert.run(`scope-${id++}`, 'ing-scope', cc, 'gdp_nowcast', q, '2025-01-15', 2.5 + Math.random());
    }
  }
});

afterAll(() => {
  db.exec(`DELETE FROM economic_data WHERE ingestion_id = 'ing-scope'`);
  db.exec(`DELETE FROM csv_ingestions WHERE id = 'ing-scope'`);
  db.exec(`DELETE FROM users WHERE id = 'test-user-scope'`);
});

const retailRoleArb = fc.constant(UserRole.RETAIL);
const widerRoleArb = fc.constantFrom(UserRole.INSTITUTIONAL, UserRole.ENTERPRISE, UserRole.ADMIN);

describe('Role-scoped data filtering (Property 4)', () => {
  test('Retail user only sees current quarter and limited countries', async () => {
    await fc.assert(
      fc.asyncProperty(retailRoleArb, async (role) => {
        const result = await DashboardDataService.getDashboardData('user-1', role, {});
        const scope = getDataScope(role);

        expect(scope.timeRange).toBe('current_quarter');
        expect(scope.countries).toBe('limited');

        // Table rows should only contain limited countries
        for (const table of result.tables) {
          for (const row of table.rows) {
            const country = String(row[0]);
            expect(LIMITED).toContain(country);
          }
        }
      }),
      { numRuns: 20 }
    );
  });

  test('Institutional/Enterprise users can see non-limited countries and multiple quarters', async () => {
    await fc.assert(
      fc.asyncProperty(widerRoleArb, async (role) => {
        const result = await DashboardDataService.getDashboardData('user-1', role, {});
        const scope = getDataScope(role);

        expect(scope.timeRange).toBe('full_history');
        expect(scope.countries).toBe('all_38');

        // Should have data from non-limited countries too
        const allCountriesInData = new Set<string>();
        for (const table of result.tables) {
          for (const row of table.rows) {
            allCountriesInData.add(String(row[0]));
          }
        }

        // At least one non-limited country should appear
        const hasNonLimited = NON_LIMITED.some(c => allCountriesInData.has(c));
        expect(hasNonLimited).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  test('Retail filter options show only current quarter', async () => {
    const options = await DashboardDataService.getFilterOptions(UserRole.RETAIL);
    expect(options.quarters.length).toBe(1);

    const instOptions = await DashboardDataService.getFilterOptions(UserRole.INSTITUTIONAL);
    expect(instOptions.quarters.length).toBeGreaterThan(1);
  });
});
