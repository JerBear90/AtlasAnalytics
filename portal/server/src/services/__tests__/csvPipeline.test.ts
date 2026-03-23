import fc from 'fast-check';
import { CSVPipelineService, CSVPipelineError } from '../csvPipelineService';
import { CSVSchema, RowValidationError } from '../../types';

// Mock repositories — we're testing parsing/validation logic, not DB
jest.mock('../../repositories/ingestionRepository');
jest.mock('../../repositories/economicDataRepository');

import { IngestionRepository } from '../../repositories/ingestionRepository';
import { EconomicDataRepository } from '../../repositories/economicDataRepository';

const mockedIngestionRepo = IngestionRepository as jest.Mocked<typeof IngestionRepository>;
const mockedEconomicDataRepo = EconomicDataRepository as jest.Mocked<typeof EconomicDataRepository>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedIngestionRepo.create.mockResolvedValue('ingestion-123');
  mockedEconomicDataRepo.bulkInsert.mockResolvedValue(0);
});

/**
 * Property 3: Valid rows pass, invalid rows are reported
 * Validates: Requirements 4.2, 4.3
 */
describe('CSV Validation - Property tests', () => {
  // Generate a valid CSV row
  const validRowArb = fc.record({
    country_code: fc.constantFrom('US', 'GB', 'DE', 'JP', 'CN', 'FR'),
    indicator_type: fc.constantFrom('gdp_nowcast', 'trade_flow', 'consumer_spending'),
    quarter: fc.tuple(
      fc.constantFrom('Q1', 'Q2', 'Q3', 'Q4'),
      fc.integer({ min: 2020, max: 2026 })
    ).map(([q, y]) => `${q} ${y}`),
    observation_date: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
      .map(d => d.toISOString().split('T')[0]),
    value: fc.double({ min: -1e9, max: 1e9, noNaN: true, noDefaultInfinity: true })
      .map(v => v.toString()),
  });

  // Generate an invalid CSV row (bad value field)
  const invalidRowArb = fc.record({
    country_code: fc.constantFrom('US', 'GB'),
    indicator_type: fc.constant('gdp_nowcast'),
    quarter: fc.constant('Q1 2025'),
    observation_date: fc.constant('2025-01-15'),
    value: fc.constantFrom('not_a_number', '', 'abc', 'NaN'),
  });

  function rowsToCSV(rows: Record<string, string>[]): string {
    if (rows.length === 0) return 'country_code,indicator_type,quarter,observation_date,value';
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map(h => row[h]).join(','));
    }
    return lines.join('\n');
  }

  test('validRows + invalidRows always equals totalRows', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.oneof(validRowArb, invalidRowArb), { minLength: 1, maxLength: 20 }),
        async (rows) => {
          const csv = rowsToCSV(rows);
          const buffer = Buffer.from(csv, 'utf-8');
          const result = await CSVPipelineService.ingestCSV(buffer, 'test.csv', 'user-1');

          expect(result.validRows + result.invalidRows).toBe(result.totalRows);
          expect(result.totalRows).toBe(rows.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('error row numbers reference rows present in the input', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.oneof(validRowArb, invalidRowArb), { minLength: 1, maxLength: 20 }),
        async (rows) => {
          const csv = rowsToCSV(rows);
          const buffer = Buffer.from(csv, 'utf-8');
          const result = await CSVPipelineService.ingestCSV(buffer, 'test.csv', 'user-1');

          for (const error of result.errors) {
            expect(error.row).toBeGreaterThanOrEqual(1);
            expect(error.row).toBeLessThanOrEqual(result.totalRows);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('all-valid CSV produces zero errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validRowArb, { minLength: 1, maxLength: 10 }),
        async (rows) => {
          const csv = rowsToCSV(rows);
          const buffer = Buffer.from(csv, 'utf-8');
          const result = await CSVPipelineService.ingestCSV(buffer, 'test.csv', 'user-1');

          expect(result.errors.length).toBe(0);
          expect(result.validRows).toBe(rows.length);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Unit tests for CSV Pipeline edge cases
 * Validates: Requirements 4.5, 4.6
 */
describe('CSV Pipeline - Edge cases', () => {
  test('rejects empty file', async () => {
    const buffer = Buffer.from('', 'utf-8');
    await expect(CSVPipelineService.ingestCSV(buffer, 'empty.csv', 'user-1'))
      .rejects.toThrow('CSV file is empty.');
  });

  test('rejects header-only file', async () => {
    const csv = 'country_code,indicator_type,quarter,observation_date,value';
    const buffer = Buffer.from(csv, 'utf-8');
    await expect(CSVPipelineService.ingestCSV(buffer, 'headers.csv', 'user-1'))
      .rejects.toThrow('CSV file contains only headers with no data rows.');
  });

  test('rejects file missing required columns', async () => {
    const csv = 'country_code,indicator_type\nUS,gdp_nowcast';
    const buffer = Buffer.from(csv, 'utf-8');
    await expect(CSVPipelineService.ingestCSV(buffer, 'missing.csv', 'user-1'))
      .rejects.toThrow('Missing required column: quarter');
  });

  test('records ingestion metadata (filename, uploader, counts)', async () => {
    const csv = 'country_code,indicator_type,quarter,observation_date,value\nUS,gdp_nowcast,Q1 2025,2025-01-15,3.2';
    const buffer = Buffer.from(csv, 'utf-8');

    await CSVPipelineService.ingestCSV(buffer, 'data.csv', 'user-42');

    expect(mockedIngestionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'data.csv',
        uploaderId: 'user-42',
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
      })
    );
  });

  test('partial valid CSV: valid rows stored, invalid rows reported', async () => {
    const csv = [
      'country_code,indicator_type,quarter,observation_date,value',
      'US,gdp_nowcast,Q1 2025,2025-01-15,3.2',
      'GB,trade_flow,Q2 2025,2025-04-10,not_a_number',
      'DE,consumer_spending,Q3 2025,2025-07-20,1.8',
    ].join('\n');
    const buffer = Buffer.from(csv, 'utf-8');

    const result = await CSVPipelineService.ingestCSV(buffer, 'mixed.csv', 'user-1');

    expect(result.totalRows).toBe(3);
    expect(result.validRows).toBe(2);
    expect(result.invalidRows).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].row).toBe(2); // 1-indexed, second data row
  });
});
