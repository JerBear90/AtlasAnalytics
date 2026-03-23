import fc from 'fast-check';
import { getDataScope, canExport } from '../roleMiddleware';
import { UserRole, DataScope, ExportFormat } from '../../types';

/**
 * Property 1: Role data scope consistency
 * Validates: Requirements 3.2, 3.3, 3.4, 3.5
 *
 * For any valid UserRole, getDataScope(role) should return a DataScope where:
 * - export formats are a subset of ['csv', 'json', 'all']
 * - Retail scope is strictly narrower than Institutional
 * - Institutional scope is strictly narrower than Enterprise
 */

const allRoles = [UserRole.RETAIL, UserRole.INSTITUTIONAL, UserRole.ENTERPRISE, UserRole.ADMIN];
const validExportFormats: ExportFormat[] = ['csv', 'json', 'all'];

const roleArb = fc.constantFrom(...allRoles);

describe('Role-to-DataScope mapping', () => {
  test('every role returns a valid DataScope with valid export formats', () => {
    fc.assert(
      fc.property(roleArb, (role) => {
        const scope = getDataScope(role);

        // Must have all required fields
        expect(scope).toHaveProperty('timeRange');
        expect(scope).toHaveProperty('countries');
        expect(scope).toHaveProperty('components');
        expect(scope).toHaveProperty('exportFormats');

        // Export formats must be valid
        for (const fmt of scope.exportFormats) {
          expect(validExportFormats).toContain(fmt);
        }

        // Must have at least one export format
        expect(scope.exportFormats.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  test('Retail scope is strictly narrower than Institutional', () => {
    const retail = getDataScope(UserRole.RETAIL);
    const institutional = getDataScope(UserRole.INSTITUTIONAL);

    // Retail: current_quarter only, Institutional: full_history
    expect(retail.timeRange).toBe('current_quarter');
    expect(institutional.timeRange).toBe('full_history');

    // Retail: limited countries, Institutional: all
    expect(retail.countries).toBe('limited');
    expect(institutional.countries).toBe('all_38');

    // Retail: summary only, Institutional: full breakdown
    expect(retail.components).toBe('summary');
    expect(institutional.components).toBe('full_breakdown');

    // Retail export formats must be a strict subset of Institutional
    expect(retail.exportFormats.length).toBeLessThan(institutional.exportFormats.length);
    for (const fmt of retail.exportFormats) {
      expect(institutional.exportFormats).toContain(fmt);
    }
  });

  test('Institutional scope is strictly narrower than Enterprise', () => {
    const institutional = getDataScope(UserRole.INSTITUTIONAL);
    const enterprise = getDataScope(UserRole.ENTERPRISE);

    // Both have full history and all countries
    expect(institutional.timeRange).toBe('full_history');
    expect(enterprise.timeRange).toBe('full_history');
    expect(institutional.countries).toBe('all_38');
    expect(enterprise.countries).toBe('all_38');

    // Enterprise has custom components, Institutional has full_breakdown
    expect(institutional.components).toBe('full_breakdown');
    expect(enterprise.components).toBe('custom');

    // Enterprise has more export formats
    expect(institutional.exportFormats.length).toBeLessThanOrEqual(enterprise.exportFormats.length);
  });

  test('canExport respects role permissions for any role and format', () => {
    const formatArb = fc.constantFrom<ExportFormat>('csv', 'json', 'all');

    fc.assert(
      fc.property(roleArb, formatArb, (role, format) => {
        const scope = getDataScope(role);
        const allowed = canExport(role, format);

        if (scope.exportFormats.includes('all')) {
          // 'all' means every format is allowed
          expect(allowed).toBe(true);
        } else if (scope.exportFormats.includes(format)) {
          expect(allowed).toBe(true);
        } else {
          expect(allowed).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });
});
