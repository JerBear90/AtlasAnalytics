import {
  UserRole,
  ExportFormat,
  DashboardFilters,
  ExportResult,
} from '../types';
import { EconomicDataRepository } from '../repositories/economicDataRepository';
import { getDataScope, canExport } from '../middleware/roleMiddleware';

export class ExportError extends Error {
  constructor(message: string, public statusCode: number = 403) {
    super(message);
    this.name = 'ExportError';
  }
}

export const ExportService = {
  async exportData(
    userId: string,
    role: UserRole,
    format: ExportFormat,
    filters: DashboardFilters
  ): Promise<ExportResult> {
    // Check role permission for requested format
    if (!canExport(role, format)) {
      throw new ExportError(`Your account does not have permission to export in ${format.toUpperCase()} format.`);
    }

    const scope = getDataScope(role);

    // Apply role scoping to filters
    const scopedFilters = { ...filters };
    if (scope.countries === 'limited' && (!scopedFilters.countries || scopedFilters.countries.length === 0)) {
      scopedFilters.countries = EconomicDataRepository.LIMITED_COUNTRIES;
    }

    const records = await EconomicDataRepository.queryByRoleAndFilters(role, scopedFilters);
    const exportedAt = new Date();
    const effectiveFormat = format === 'all' ? 'json' : format;

    let data: Buffer;
    let contentType: string;
    let extension: string;

    if (effectiveFormat === 'csv') {
      const csvContent = generateCSV(records, exportedAt);
      data = Buffer.from(csvContent, 'utf-8');
      contentType = 'text/csv';
      extension = 'csv';
    } else {
      const jsonContent = generateJSON(records, exportedAt, filters);
      data = Buffer.from(jsonContent, 'utf-8');
      contentType = 'application/json';
      extension = 'json';
    }

    const filename = `atlas_export_${exportedAt.toISOString().split('T')[0]}.${extension}`;

    return {
      filename,
      contentType,
      data,
      metadata: {
        exportedAt,
        rowCount: records.length,
        format: effectiveFormat as ExportFormat,
        filters,
      },
    };
  },
};

interface ExportRecord {
  countryCode: string;
  indicatorType: string;
  quarter: string;
  observationDate: Date;
  value: number;
  metadata: Record<string, unknown>;
}

function generateCSV(records: ExportRecord[], exportedAt: Date): string {
  const lines: string[] = [];

  // Header comment with metadata
  lines.push(`# Atlas Analytics Data Export`);
  lines.push(`# Exported: ${exportedAt.toISOString()}`);
  lines.push(`# Records: ${records.length}`);
  lines.push('');

  // Column headers
  lines.push('country_code,indicator_type,quarter,observation_date,value');

  // Data rows
  for (const r of records) {
    const date = r.observationDate instanceof Date
      ? r.observationDate.toISOString().split('T')[0]
      : String(r.observationDate);
    lines.push(`${r.countryCode},${r.indicatorType},${r.quarter},${date},${r.value}`);
  }

  return lines.join('\n');
}

function generateJSON(records: ExportRecord[], exportedAt: Date, filters: DashboardFilters): string {
  return JSON.stringify({
    metadata: {
      source: 'Atlas Analytics Portal',
      exportedAt: exportedAt.toISOString(),
      recordCount: records.length,
      filters,
    },
    data: records.map(r => ({
      countryCode: r.countryCode,
      indicatorType: r.indicatorType,
      quarter: r.quarter,
      observationDate: r.observationDate instanceof Date
        ? r.observationDate.toISOString().split('T')[0]
        : String(r.observationDate),
      value: r.value,
    })),
  }, null, 2);
}
