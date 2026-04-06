import { parse } from 'csv-parse/sync';
import {
  CSVSchema,
  CSVSchemaColumn,
  IngestionResult,
  RowValidationError,
  EconomicDataRecord,
} from '../types';
import { IngestionRepository } from '../repositories/ingestionRepository';
import { EconomicDataRepository } from '../repositories/economicDataRepository';
import { ClientDataRepository } from '../repositories/clientDataRepository';

type CsvFileType = 'generic' | 'weekly_time_series' | 'weekly_financial_targets' | 'nx_results' | 'pi_results' | 'quarterly_time_series' | 'academic_gdp';

function detectFileType(headers: string[]): CsvFileType {
  const h = headers.map(s => s.trim().toLowerCase());
  if (h.includes('prediction year-quarter') && h.includes('core gdp')) return 'weekly_time_series';
  if (h.includes('date') && h.includes('trade balance') && h.includes('nx results')) return 'nx_results';
  if (h.includes('date') && h.includes('private inventories') && h.length <= 5 && !h.includes('trade balance')) return 'pi_results';
  if (h.some(c => c.includes('us gdp')) && h.some(c => c.includes('atlas predicted'))) return 'quarterly_time_series';
  if (h.some(c => c.includes('bea actual')) && h.some(c => c.includes('atlas pred'))) return 'academic_gdp';
  if (h.includes('country_code') && h.includes('indicator_type')) return 'generic';
  // If none matched but has Date/Year/Quarter, treat as academic GDP
  if (h.includes('date') && h.includes('year') && h.includes('quarter') && !h.includes('trade balance') && !h.includes('private inventories')) return 'academic_gdp';
  return 'generic';
}

function detectFinancialTargets(content: string): boolean {
  return content.includes('Atlas Analytics Price Targets') || content.includes('Atlas Analytics\' Target');
}

// Default schema for Atlas economic data CSVs
const DEFAULT_SCHEMA: CSVSchema = {
  columns: [
    { name: 'country_code', type: 'string', required: true, pattern: '^[A-Z]{2,3}$' },
    { name: 'indicator_type', type: 'string', required: true },
    { name: 'quarter', type: 'string', required: true, pattern: '^Q[1-4]\\s\\d{4}$' },
    { name: 'observation_date', type: 'date', required: true },
    { name: 'value', type: 'number', required: true },
  ],
  requiredColumns: ['country_code', 'indicator_type', 'quarter', 'observation_date', 'value'],
};

export class CSVPipelineError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'CSVPipelineError';
  }
}

function validateRow(
  row: Record<string, string>,
  rowIndex: number,
  schema: CSVSchema
): RowValidationError[] {
  const errors: RowValidationError[] = [];

  for (const col of schema.columns) {
    const value = row[col.name];

    // Required check
    if (col.required && (value === undefined || value === null || value.trim() === '')) {
      errors.push({ row: rowIndex, column: col.name, message: `Required field is missing or empty`, value: value ?? '' });
      continue;
    }

    if (value === undefined || value === null || value.trim() === '') continue;

    const trimmed = value.trim();

    // Type validation
    switch (col.type) {
      case 'number': {
        const num = Number(trimmed);
        if (isNaN(num)) {
          errors.push({ row: rowIndex, column: col.name, message: `Expected a number`, value: trimmed });
        }
        break;
      }
      case 'date': {
        const d = new Date(trimmed);
        if (isNaN(d.getTime())) {
          errors.push({ row: rowIndex, column: col.name, message: `Expected a valid date`, value: trimmed });
        }
        break;
      }
      case 'enum': {
        if (col.enumValues && !col.enumValues.includes(trimmed)) {
          errors.push({ row: rowIndex, column: col.name, message: `Value must be one of: ${col.enumValues.join(', ')}`, value: trimmed });
        }
        break;
      }
      case 'string': {
        if (col.pattern) {
          const regex = new RegExp(col.pattern);
          if (!regex.test(trimmed)) {
            errors.push({ row: rowIndex, column: col.name, message: `Value does not match expected pattern`, value: trimmed });
          }
        }
        break;
      }
    }
  }

  return errors;
}

function rowToRecord(row: Record<string, string>): Omit<EconomicDataRecord, 'id' | 'ingestionId'> {
  // Collect any extra columns as metadata
  const knownCols = new Set(['country_code', 'indicator_type', 'quarter', 'observation_date', 'value']);
  const metadata: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(row)) {
    if (!knownCols.has(key) && val !== undefined && val.trim() !== '') {
      metadata[key] = val.trim();
    }
  }

  return {
    countryCode: row.country_code.trim(),
    indicatorType: row.indicator_type.trim(),
    quarter: row.quarter.trim(),
    observationDate: new Date(row.observation_date.trim()),
    value: parseFloat(row.value.trim()),
    metadata,
  };
}

export const CSVPipelineService = {
  async ingestCSV(
    file: Buffer,
    filename: string,
    uploaderId: string,
    schema: CSVSchema = DEFAULT_SCHEMA
  ): Promise<IngestionResult> {
    const content = file.toString('utf-8').trim();

    if (!content) {
      throw new CSVPipelineError('CSV file is empty.');
    }

    // Check for financial targets (special format with empty rows and sections)
    if (detectFinancialTargets(content)) {
      return this.ingestFinancialTargets(content, filename, uploaderId);
    }

    // Check for non-tabular files (Support, Contents, etc.) — skip gracefully
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename.includes('support') || lowerFilename.includes('disclaimer') || lowerFilename.includes('contents')) {
      // Store as ingestion record but don't try to parse as data
      const ingestionId = await IngestionRepository.create({
        filename, uploaderId, totalRows: 0, validRows: 0, invalidRows: 0, errors: [],
      });
      return { success: true, totalRows: 0, validRows: 0, invalidRows: 0, errors: [], ingestionId };
    }

    // Parse CSV
    let rows: Record<string, string>[];
    try {
      rows = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (err) {
      throw new CSVPipelineError(`Failed to parse CSV: ${(err as Error).message}`);
    }

    if (rows.length === 0) {
      throw new CSVPipelineError('CSV file contains only headers with no data rows.');
    }

    const headerKeys = Object.keys(rows[0]);
    const fileType = detectFileType(headerKeys);

    switch (fileType) {
      case 'weekly_time_series':
        return this.ingestWeeklyTimeSeries(rows, filename, uploaderId);
      case 'quarterly_time_series':
        return this.ingestQuarterlyTimeSeries(rows, filename, uploaderId);
      case 'academic_gdp':
        return this.ingestAcademicGdp(rows, filename, uploaderId);
      case 'nx_results':
        return this.ingestNxResults(rows, filename, uploaderId);
      case 'pi_results':
        return this.ingestPiResults(rows, filename, uploaderId);
      default:
        return this.ingestGeneric(rows, filename, uploaderId, schema);
    }
  },

  async ingestGeneric(
    rows: Record<string, string>[],
    filename: string,
    uploaderId: string,
    schema: CSVSchema
  ): Promise<IngestionResult> {
    const headerKeys = Object.keys(rows[0]);
    for (const reqCol of schema.requiredColumns) {
      if (!headerKeys.includes(reqCol)) {
        throw new CSVPipelineError(`Missing required column: ${reqCol}`);
      }
    }

    const allErrors: RowValidationError[] = [];
    const validRecords: Omit<EconomicDataRecord, 'id' | 'ingestionId'>[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowErrors = validateRow(rows[i], i + 1, schema);
      if (rowErrors.length > 0) {
        allErrors.push(...rowErrors);
      } else {
        validRecords.push(rowToRecord(rows[i]));
      }
    }

    const ingestionId = await IngestionRepository.create({
      filename, uploaderId, totalRows: rows.length,
      validRows: validRecords.length, invalidRows: rows.length - validRecords.length, errors: allErrors,
    });

    if (validRecords.length > 0) {
      await EconomicDataRepository.bulkInsert(ingestionId, validRecords);
    }

    return {
      success: allErrors.length === 0, totalRows: rows.length,
      validRows: validRecords.length, invalidRows: rows.length - validRecords.length,
      errors: allErrors, ingestionId,
    };
  },

  async ingestWeeklyTimeSeries(
    rows: Record<string, string>[],
    filename: string,
    uploaderId: string
  ): Promise<IngestionResult> {
    const allErrors: RowValidationError[] = [];
    const validRows: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const pq = (r['Prediction Year-Quarter'] || '').trim();
      const date = (r['Date'] || '').trim();
      if (!pq || !date) {
        allErrors.push({ row: i + 1, column: 'Prediction Year-Quarter', message: 'Required field missing', value: pq });
        continue;
      }
      const parseNum = (v: string) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
      validRows.push({
        predictionQuarter: pq, date, year: parseInt(r['Year']) || 0,
        dayOfWeek: (r['Day of the Week'] || '').trim(), month: (r['Month'] || '').trim(),
        coreGdp: parseNum(r['Core GDP'] || ''), coreGdpUpdated: parseNum(r['Core GDP Updated'] || ''),
        netExports: parseNum(r['Net Exports'] || ''), privateInventories: parseNum(r['Private Inventories'] || ''),
        gdp: parseNum(r['GDP'] || ''),
      });
    }

    const ingestionId = await IngestionRepository.create({
      filename, uploaderId, totalRows: rows.length,
      validRows: validRows.length, invalidRows: allErrors.length, errors: allErrors,
    });

    if (validRows.length > 0) {
      ClientDataRepository.bulkInsertWeeklyTimeSeries(ingestionId, validRows);
    }

    return {
      success: allErrors.length === 0, totalRows: rows.length,
      validRows: validRows.length, invalidRows: allErrors.length,
      errors: allErrors, ingestionId,
    };
  },

  async ingestQuarterlyTimeSeries(
    rows: Record<string, string>[],
    filename: string,
    uploaderId: string
  ): Promise<IngestionResult> {
    const validRows: any[] = [];
    for (const r of rows) {
      const date = (r['Date'] || '').trim();
      if (!date) continue;
      // Find the GDP columns (headers may vary slightly)
      const keys = Object.keys(r);
      const gdpKey = keys.find(k => k.toLowerCase().includes('us gdp')) || 'US GDP (SAAR)';
      const atlasKey = keys.find(k => k.toLowerCase().includes('atlas predicted')) || 'Atlas Predicted (SAAR)';
      validRows.push({
        date,
        year: parseInt(r['Year']) || 0,
        quarter: parseInt(r['Quarter']) || 0,
        date2: (r['Date2'] || '').trim(),
        usGdp: (r[gdpKey] || '').trim(),
        atlasPredicted: (r[atlasKey] || '').trim(),
      });
    }

    const ingestionId = await IngestionRepository.create({
      filename, uploaderId, totalRows: rows.length,
      validRows: validRows.length, invalidRows: rows.length - validRows.length, errors: [],
    });

    if (validRows.length > 0) {
      ClientDataRepository.bulkInsertQuarterlyTimeSeries(ingestionId, validRows);
    }

    return {
      success: true, totalRows: rows.length,
      validRows: validRows.length, invalidRows: rows.length - validRows.length,
      errors: [], ingestionId,
    };
  },

  async ingestAcademicGdp(
    rows: Record<string, string>[],
    filename: string,
    uploaderId: string
  ): Promise<IngestionResult> {
    // Determine the GDP type from filename
    const lowerName = filename.toLowerCase();
    let gdpType = 'headline';
    if (lowerName.includes('core')) gdpType = 'core';
    else if (lowerName.includes('nevada') || lowerName.includes('state')) gdpType = 'state';

    const validRows: any[] = [];
    for (const r of rows) {
      const date = (r['Date'] || '').trim();
      if (!date) continue;
      const keys = Object.keys(r);
      const beaKey = keys.find(k => k.toLowerCase().includes('bea actual')) || 'BEA Actual';
      const atlasKey = keys.find(k => k.toLowerCase().includes('atlas pred')) || 'Atlas Predicitions';
      const date2Key = keys.find(k => k.toLowerCase().includes('date 2') || k.toLowerCase() === 'date2') || 'Date 2';
      validRows.push({
        gdpType,
        date,
        year: parseInt(r['Year']) || 0,
        quarter: parseInt(r['Quarter']) || 0,
        date2: (r[date2Key] || '').trim(),
        beaActual: (r[beaKey] || '').trim(),
        atlasPredicted: (r[atlasKey] || '').trim(),
      });
    }

    const ingestionId = await IngestionRepository.create({
      filename, uploaderId, totalRows: rows.length,
      validRows: validRows.length, invalidRows: rows.length - validRows.length, errors: [],
    });

    if (validRows.length > 0) {
      ClientDataRepository.bulkInsertAcademicGdp(ingestionId, validRows);
    }

    return {
      success: true, totalRows: rows.length,
      validRows: validRows.length, invalidRows: rows.length - validRows.length,
      errors: [], ingestionId,
    };
  },

  async ingestFinancialTargets(
    content: string,
    filename: string,
    uploaderId: string
  ): Promise<IngestionResult> {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const validRows: any[] = [];
    let currentSection = 'GDP-Based';

    for (const line of lines) {
      if (line.includes('Core GDP-Based')) { currentSection = 'Core GDP-Based'; continue; }
      if (line.includes('GDP-Based') && !line.includes('Core')) { currentSection = 'GDP-Based'; continue; }
      if (line.includes('Atlas Analytics Price Targets') || line.includes('As of Market Close') || line.includes('ETF,')) continue;

      const parts = line.split(',').map(s => s.trim());
      // Look for rows where second column is an ETF ticker
      const etf = (parts[1] || '').trim();
      if (!etf || etf.length > 6 || etf.length < 2 || etf.includes(' ')) continue;
      if (['ETF'].includes(etf)) continue;

      const cleanPrice = (s: string) => { const n = parseFloat(s.replace(/[$,\s`]/g, '')); return isNaN(n) ? null : n; };
      validRows.push({
        section: currentSection, etf,
        targetPrice: cleanPrice(parts[2] || ''),
        tradingPrice: cleanPrice(parts[3] || ''),
        deviation: (parts[4] || '').trim(),
      });
    }

    const ingestionId = await IngestionRepository.create({
      filename, uploaderId, totalRows: validRows.length,
      validRows: validRows.length, invalidRows: 0, errors: [],
    });

    if (validRows.length > 0) {
      ClientDataRepository.bulkInsertFinancialTargets(ingestionId, validRows);
    }

    return {
      success: true, totalRows: validRows.length,
      validRows: validRows.length, invalidRows: 0,
      errors: [], ingestionId,
    };
  },

  async ingestNxResults(
    rows: Record<string, string>[],
    filename: string,
    uploaderId: string
  ): Promise<IngestionResult> {
    const validRows: any[] = [];
    for (const r of rows) {
      const date = (r['Date'] || '').trim();
      if (!date) continue;
      const parseNum = (v: string) => { const n = parseFloat(v.replace(/,/g, '')); return isNaN(n) ? null : n; };
      validRows.push({
        date, year: parseInt(r['Year']) || 0, quarter: parseInt(r['Quarter']) || 0,
        date2: (r['Date2'] || '').trim(),
        tradeBalance: parseNum(r['Trade Balance'] || ''),
        tradeBalancePctCh: (r['Trade Balance (% Ch)'] || '').trim(),
        nxResults: (r['NX Results'] || '').trim(),
      });
    }

    const ingestionId = await IngestionRepository.create({
      filename, uploaderId, totalRows: rows.length,
      validRows: validRows.length, invalidRows: rows.length - validRows.length, errors: [],
    });

    if (validRows.length > 0) {
      ClientDataRepository.bulkInsertNxResults(ingestionId, validRows);
    }

    return {
      success: true, totalRows: rows.length,
      validRows: validRows.length, invalidRows: rows.length - validRows.length,
      errors: [], ingestionId,
    };
  },

  async ingestPiResults(
    rows: Record<string, string>[],
    filename: string,
    uploaderId: string
  ): Promise<IngestionResult> {
    const validRows: any[] = [];
    for (const r of rows) {
      const date = (r['Date'] || '').trim();
      if (!date) continue;
      validRows.push({
        date, year: parseInt(r['Year']) || 0, quarter: parseInt(r['Quarter']) || 0,
        date2: (r['Date2'] || '').trim(),
        privateInventories: (r['Private Inventories'] || '').trim(),
      });
    }

    const ingestionId = await IngestionRepository.create({
      filename, uploaderId, totalRows: rows.length,
      validRows: validRows.length, invalidRows: rows.length - validRows.length, errors: [],
    });

    if (validRows.length > 0) {
      ClientDataRepository.bulkInsertPiResults(ingestionId, validRows);
    }

    return {
      success: true, totalRows: rows.length,
      validRows: validRows.length, invalidRows: rows.length - validRows.length,
      errors: [], ingestionId,
    };
  },

  // Exposed for testing
  validateRow,
  rowToRecord,
  DEFAULT_SCHEMA,
};
