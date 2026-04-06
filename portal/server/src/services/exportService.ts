import { UserRole, ExportFormat, DashboardFilters, ExportResult } from '../types';
import { ClientDataRepository } from '../repositories/clientDataRepository';
import { canExport } from '../middleware/roleMiddleware';

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
    filters: DashboardFilters,
    tab?: string
  ): Promise<ExportResult> {
    if (!canExport(role, format)) {
      throw new ExportError(`Your account does not have permission to export in ${format.toUpperCase()} format.`);
    }

    const exportedAt = new Date();
    const effectiveFormat = format === 'all' ? 'csv' : format;
    const { headers, rows } = getTabData(tab || 'quarterly', filters);

    let data: Buffer;
    let contentType: string;
    let extension: string;

    if (effectiveFormat === 'csv') {
      data = Buffer.from(generateCSV(headers, rows, exportedAt), 'utf-8');
      contentType = 'text/csv';
      extension = 'csv';
    } else {
      data = Buffer.from(generateJSON(headers, rows, exportedAt, tab || 'quarterly'), 'utf-8');
      contentType = 'application/json';
      extension = 'json';
    }

    const tabName = tab || 'data';
    const filename = `atlas_${tabName}_${exportedAt.toISOString().split('T')[0]}.${extension}`;

    return {
      filename, contentType, data,
      metadata: { exportedAt, rowCount: rows.length, format: effectiveFormat as ExportFormat, filters },
    };
  },
};

function getTabData(tab: string, filters: DashboardFilters): { headers: string[]; rows: string[][] } {
  const startDate = filters.dateRange?.start ? String(filters.dateRange.start).split('T')[0] : undefined;
  const endDate = filters.dateRange?.end ? String(filters.dateRange.end).split('T')[0] : undefined;
  const quarter = filters.quarter;

  switch (tab) {
    case 'quarterly': {
      const data = ClientDataRepository.getQuarterlyTimeSeries(startDate, endDate, quarter);
      return {
        headers: ['Date', 'Year', 'Quarter', 'Date2', 'US GDP (SAAR)', 'Atlas Predicted (SAAR)'],
        rows: data.map(r => [r.date, String(r.year), String(r.quarter), r.date2, r.usGdp, r.atlasPredicted]),
      };
    }
    case 'weekly': {
      const data = ClientDataRepository.getWeeklyTimeSeries(quarter);
      return {
        headers: ['Prediction Quarter', 'Date', 'Year', 'Day', 'Month', 'Core GDP', 'Core GDP Updated', 'Net Exports', 'Private Inventories', 'GDP'],
        rows: data.map(r => [r.predictionQuarter, r.date, String(r.year), r.dayOfWeek, r.month,
          r.coreGdp != null ? String(r.coreGdp) : '', r.coreGdpUpdated != null ? String(r.coreGdpUpdated) : '',
          r.netExports != null ? String(r.netExports) : '', r.privateInventories != null ? String(r.privateInventories) : '',
          r.gdp != null ? String(r.gdp) : '']),
      };
    }
    case 'financial': {
      const data = ClientDataRepository.getFinancialTargets();
      return {
        headers: ['Section', 'ETF', 'Target Price', 'Trading Price', 'Deviation'],
        rows: data.map(r => [r.section, r.etf,
          r.targetPrice != null ? String(r.targetPrice) : '', r.tradingPrice != null ? String(r.tradingPrice) : '', r.deviation]),
      };
    }
    case 'exports': {
      const data = ClientDataRepository.getNxResults(startDate, endDate);
      return {
        headers: ['Date', 'Year', 'Quarter', 'Date2', 'Trade Balance', 'Trade Balance (% Ch)', 'NX Results'],
        rows: data.map(r => [r.date, String(r.year), String(r.quarter), r.date2,
          r.tradeBalance != null ? String(r.tradeBalance) : '', r.tradeBalancePctCh, r.nxResults]),
      };
    }
    case 'inventories': {
      const data = ClientDataRepository.getPiResults(startDate, endDate);
      return {
        headers: ['Date', 'Year', 'Quarter', 'Date2', 'Private Inventories'],
        rows: data.map(r => [r.date, String(r.year), String(r.quarter), r.date2, r.privateInventories]),
      };
    }
    case 'headline_gdp':
    case 'core_gdp':
    case 'state_gdp': {
      const typeMap: Record<string, string> = { headline_gdp: 'headline', core_gdp: 'core', state_gdp: 'state' };
      const data = ClientDataRepository.getAcademicGdp(typeMap[tab], startDate, endDate);
      return {
        headers: ['Date', 'Year', 'Quarter', 'Date 2', 'BEA Actual', 'Atlas Predictions'],
        rows: data.map(r => [r.date, String(r.year), String(r.quarter), r.date2, r.beaActual, r.atlasPredicted]),
      };
    }
    default:
      return { headers: [], rows: [] };
  }
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function generateCSV(headers: string[], rows: string[][], exportedAt: Date): string {
  const lines: string[] = [];
  lines.push(`# Atlas Analytics Data Export`);
  lines.push(`# Exported: ${exportedAt.toISOString()}`);
  lines.push(`# Records: ${rows.length}`);
  lines.push('');
  lines.push(headers.map(escapeCSV).join(','));
  for (const row of rows) {
    lines.push(row.map(escapeCSV).join(','));
  }
  return lines.join('\n');
}

function generateJSON(headers: string[], rows: string[][], exportedAt: Date, tab: string): string {
  return JSON.stringify({
    metadata: {
      source: 'Atlas Analytics Portal',
      exportedAt: exportedAt.toISOString(),
      tab,
      recordCount: rows.length,
    },
    data: rows.map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      return obj;
    }),
  }, null, 2);
}
